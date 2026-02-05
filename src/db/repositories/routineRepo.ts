import { getDB, persist } from '../database';
import {
  RoutineDefinition,
  RoutineStep,
  RoutineLog,
  RoutineStepLog,
  RoutineStreak,
  RoutineWithSteps,
  RoutineStepWithStatus,
  RoutineType,
} from '../../types/routine';
import type { SqlValue } from 'sql.js';

export function getRoutines(): RoutineDefinition[] {
  const db = getDB();
  const result = db.exec(`
    SELECT id, name, type, description, bonus_xp, is_active, created_at
    FROM routine_definitions WHERE is_active = 1 ORDER BY type, name
  `);
  if (!result.length) return [];
  return result[0].values.map(mapRoutineRow);
}

export function getRoutineWithSteps(routineId: number): RoutineWithSteps | null {
  const routine = getRoutineById(routineId);
  if (!routine) return null;

  const steps = getRoutineSteps(routineId);
  const streak = getRoutineStreak(routineId);
  const todayLog = getTodayLog(routineId);

  return { ...routine, steps, streak: streak || undefined, todayLog: todayLog || undefined };
}

export function getRoutinesWithSteps(): RoutineWithSteps[] {
  const routines = getRoutines();
  return routines.map((routine) => {
    const steps = getRoutineSteps(routine.id);
    const streak = getRoutineStreak(routine.id);
    const todayLog = getTodayLog(routine.id);
    return { ...routine, steps, streak: streak || undefined, todayLog: todayLog || undefined };
  });
}

export function getRoutineById(id: number): RoutineDefinition | null {
  const db = getDB();
  const result = db.exec(`
    SELECT id, name, type, description, bonus_xp, is_active, created_at
    FROM routine_definitions WHERE id = ?
  `, [id]);
  if (!result.length || !result[0].values.length) return null;
  return mapRoutineRow(result[0].values[0]);
}

export function getRoutineSteps(routineId: number): RoutineStep[] {
  const db = getDB();
  const result = db.exec(`
    SELECT id, routine_id, title, description, linked_buff_id, sort_order, duration_minutes, is_optional
    FROM routine_steps WHERE routine_id = ? ORDER BY sort_order
  `, [routineId]);
  if (!result.length) return [];
  return result[0].values.map(mapStepRow);
}

export function getRoutineStreak(routineId: number): RoutineStreak | null {
  const db = getDB();
  const result = db.exec(`
    SELECT id, routine_id, current_streak, longest_streak, last_completed_date
    FROM routine_streaks WHERE routine_id = ?
  `, [routineId]);
  if (!result.length || !result[0].values.length) return null;
  const row = result[0].values[0];
  return {
    id: row[0] as number,
    routine_id: row[1] as number,
    current_streak: row[2] as number,
    longest_streak: row[3] as number,
    last_completed_date: row[4] as string | null,
  };
}

export function getTodayLog(routineId: number): RoutineLog | null {
  const db = getDB();
  const result = db.exec(`
    SELECT id, routine_id, date, started_at, completed_at, is_completed, steps_completed, total_steps, xp_earned
    FROM routine_logs WHERE routine_id = ? AND date = date('now')
  `, [routineId]);
  if (!result.length || !result[0].values.length) return null;
  return mapLogRow(result[0].values[0]);
}

export function getStepLogsForLog(logId: number): RoutineStepLog[] {
  const db = getDB();
  const result = db.exec(`
    SELECT id, routine_log_id, step_id, completed_at, is_completed, skipped
    FROM routine_step_logs WHERE routine_log_id = ?
  `, [logId]);
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    routine_log_id: row[1] as number,
    step_id: row[2] as number,
    completed_at: row[3] as string | null,
    is_completed: Boolean(row[4]),
    skipped: Boolean(row[5]),
  }));
}

export function getStepsWithStatus(routineId: number): RoutineStepWithStatus[] {
  const steps = getRoutineSteps(routineId);
  const todayLog = getTodayLog(routineId);

  if (!todayLog) {
    return steps.map((step) => ({ ...step, is_completed: false, skipped: false, completed_at: null }));
  }

  const stepLogs = getStepLogsForLog(todayLog.id);
  const stepLogMap = new Map(stepLogs.map((sl) => [sl.step_id, sl]));

  return steps.map((step) => {
    const log = stepLogMap.get(step.id);
    return {
      ...step,
      is_completed: log?.is_completed || false,
      skipped: log?.skipped || false,
      completed_at: log?.completed_at || null,
    };
  });
}

export async function createRoutine(
  name: string,
  type: RoutineType,
  description: string,
  bonusXp: number
): Promise<number> {
  const db = getDB();
  db.run(
    `INSERT INTO routine_definitions (name, type, description, bonus_xp) VALUES (?, ?, ?, ?)`,
    [name, type, description, bonusXp]
  );
  const result = db.exec('SELECT last_insert_rowid()');
  const id = result[0].values[0][0] as number;

  // Create streak record
  db.run(`INSERT INTO routine_streaks (routine_id) VALUES (?)`, [id]);

  await persist();
  return id;
}

export async function addRoutineStep(
  routineId: number,
  title: string,
  description: string,
  linkedBuffId: number | null,
  durationMinutes: number,
  isOptional: boolean
): Promise<number> {
  const db = getDB();

  // Get next sort order
  const orderResult = db.exec(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 FROM routine_steps WHERE routine_id = ?`,
    [routineId]
  );
  const sortOrder = orderResult[0].values[0][0] as number;

  db.run(
    `INSERT INTO routine_steps (routine_id, title, description, linked_buff_id, sort_order, duration_minutes, is_optional)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [routineId, title, description, linkedBuffId, sortOrder, durationMinutes, isOptional ? 1 : 0]
  );
  const result = db.exec('SELECT last_insert_rowid()');
  await persist();
  return result[0].values[0][0] as number;
}

export async function deleteRoutineStep(stepId: number): Promise<void> {
  const db = getDB();
  db.run(`DELETE FROM routine_steps WHERE id = ?`, [stepId]);
  await persist();
}

export async function deleteRoutine(routineId: number): Promise<void> {
  const db = getDB();
  db.run(`DELETE FROM routine_definitions WHERE id = ?`, [routineId]);
  await persist();
}

export async function startRoutine(routineId: number): Promise<RoutineLog> {
  const db = getDB();
  const steps = getRoutineSteps(routineId);

  // Check if log exists for today
  let log = getTodayLog(routineId);
  if (!log) {
    db.run(
      `INSERT INTO routine_logs (routine_id, date, started_at, total_steps)
       VALUES (?, date('now'), datetime('now'), ?)`,
      [routineId, steps.length]
    );
    const result = db.exec('SELECT last_insert_rowid()');
    const logId = result[0].values[0][0] as number;

    // Create step logs
    for (const step of steps) {
      db.run(
        `INSERT INTO routine_step_logs (routine_log_id, step_id) VALUES (?, ?)`,
        [logId, step.id]
      );
    }

    await persist();
    log = getTodayLog(routineId)!;
  }

  return log;
}

export async function completeRoutineStep(logId: number, stepId: number): Promise<void> {
  const db = getDB();
  db.run(
    `UPDATE routine_step_logs SET is_completed = 1, completed_at = datetime('now')
     WHERE routine_log_id = ? AND step_id = ?`,
    [logId, stepId]
  );

  // Update steps completed count
  const completedResult = db.exec(
    `SELECT COUNT(*) FROM routine_step_logs WHERE routine_log_id = ? AND is_completed = 1`,
    [logId]
  );
  const completedCount = completedResult[0].values[0][0] as number;
  db.run(`UPDATE routine_logs SET steps_completed = ? WHERE id = ?`, [completedCount, logId]);

  await persist();
}

export async function skipRoutineStep(logId: number, stepId: number): Promise<void> {
  const db = getDB();
  db.run(
    `UPDATE routine_step_logs SET skipped = 1, completed_at = datetime('now')
     WHERE routine_log_id = ? AND step_id = ?`,
    [logId, stepId]
  );
  await persist();
}

export async function completeRoutine(routineId: number, xpEarned: number): Promise<void> {
  const db = getDB();
  const today = new Date().toISOString().split('T')[0];

  // Update log
  db.run(
    `UPDATE routine_logs SET is_completed = 1, completed_at = datetime('now'), xp_earned = ?
     WHERE routine_id = ? AND date = date('now')`,
    [xpEarned, routineId]
  );

  // Update streak
  const streak = getRoutineStreak(routineId);
  if (streak) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const isConsecutive = streak.last_completed_date === yesterday;
    const newStreak = isConsecutive ? streak.current_streak + 1 : 1;
    const newLongest = Math.max(streak.longest_streak, newStreak);

    db.run(
      `UPDATE routine_streaks SET current_streak = ?, longest_streak = ?, last_completed_date = ?
       WHERE routine_id = ?`,
      [newStreak, newLongest, today, routineId]
    );
  }

  await persist();
}

export function isRoutineComplete(routineId: number): boolean {
  const steps = getStepsWithStatus(routineId);
  const requiredSteps = steps.filter((s) => !s.is_optional);
  return requiredSteps.every((s) => s.is_completed || s.skipped);
}

function mapRoutineRow(row: SqlValue[]): RoutineDefinition {
  return {
    id: row[0] as number,
    name: row[1] as string,
    type: row[2] as RoutineType,
    description: row[3] as string,
    bonus_xp: row[4] as number,
    is_active: Boolean(row[5]),
    created_at: row[6] as string,
  };
}

function mapStepRow(row: SqlValue[]): RoutineStep {
  return {
    id: row[0] as number,
    routine_id: row[1] as number,
    title: row[2] as string,
    description: row[3] as string,
    linked_buff_id: row[4] as number | null,
    sort_order: row[5] as number,
    duration_minutes: row[6] as number,
    is_optional: Boolean(row[7]),
  };
}

function mapLogRow(row: SqlValue[]): RoutineLog {
  return {
    id: row[0] as number,
    routine_id: row[1] as number,
    date: row[2] as string,
    started_at: row[3] as string | null,
    completed_at: row[4] as string | null,
    is_completed: Boolean(row[5]),
    steps_completed: row[6] as number,
    total_steps: row[7] as number,
    xp_earned: row[8] as number,
  };
}
