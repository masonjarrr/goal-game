import { getDB, persist } from '../database';
import { PlannerEvent } from '../../types/planner';
import type { SqlValue } from 'sql.js';

export function getEvents(date?: string, startDate?: string, endDate?: string): PlannerEvent[] {
  const db = getDB();
  let sql = `SELECT id, title, description, date, start_time, end_time, quest_id, step_id, is_completed, created_at, reminder_minutes
             FROM planner_events WHERE 1=1`;
  const params: string[] = [];

  if (date) {
    sql += ' AND date = ?';
    params.push(date);
  }
  if (startDate) {
    sql += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND date <= ?';
    params.push(endDate);
  }
  sql += ' ORDER BY date, start_time, id';

  const result = db.exec(sql, params);
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    title: row[1] as string,
    description: row[2] as string,
    date: row[3] as string,
    start_time: row[4] as string | null,
    end_time: row[5] as string | null,
    quest_id: row[6] as number | null,
    step_id: row[7] as number | null,
    is_completed: Boolean(row[8]),
    created_at: row[9] as string,
    reminder_minutes: row[10] as number | null,
  }));
}

export async function createEvent(
  title: string,
  date: string,
  description: string = '',
  startTime: string | null = null,
  endTime: string | null = null,
  questId: number | null = null,
  stepId: number | null = null,
  reminderMinutes: number | null = null
): Promise<number> {
  const db = getDB();
  db.run(
    `INSERT INTO planner_events (title, description, date, start_time, end_time, quest_id, step_id, reminder_minutes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, date, startTime, endTime, questId, stepId, reminderMinutes]
  );
  const result = db.exec('SELECT last_insert_rowid()');
  await persist();
  return result[0].values[0][0] as number;
}

export async function completeEvent(id: number): Promise<void> {
  const db = getDB();
  db.run('UPDATE planner_events SET is_completed = 1 WHERE id = ?', [id]);
  await persist();
}

export async function uncompleteEvent(id: number): Promise<void> {
  const db = getDB();
  db.run('UPDATE planner_events SET is_completed = 0 WHERE id = ?', [id]);
  await persist();
}

export async function deleteEvent(id: number): Promise<void> {
  const db = getDB();
  db.run('DELETE FROM planner_events WHERE id = ?', [id]);
  await persist();
}

export async function updateEvent(
  id: number,
  title: string,
  date: string,
  description: string = '',
  startTime: string | null = null,
  endTime: string | null = null,
  questId: number | null = null,
  stepId: number | null = null,
  reminderMinutes: number | null = null
): Promise<void> {
  const db = getDB();
  db.run(
    `UPDATE planner_events SET title = ?, description = ?, date = ?, start_time = ?, end_time = ?, quest_id = ?, step_id = ?, reminder_minutes = ?
     WHERE id = ?`,
    [title, description, date, startTime, endTime, questId, stepId, reminderMinutes, id]
  );
  await persist();
}

export function getEventById(id: number): PlannerEvent | null {
  const db = getDB();
  const result = db.exec(
    `SELECT id, title, description, date, start_time, end_time, quest_id, step_id, is_completed, created_at, reminder_minutes
     FROM planner_events WHERE id = ?`,
    [id]
  );
  if (!result.length || !result[0].values.length) return null;
  const row = result[0].values[0];
  return {
    id: row[0] as number,
    title: row[1] as string,
    description: row[2] as string,
    date: row[3] as string,
    start_time: row[4] as string | null,
    end_time: row[5] as string | null,
    quest_id: row[6] as number | null,
    step_id: row[7] as number | null,
    is_completed: Boolean(row[8]),
    created_at: row[9] as string,
    reminder_minutes: row[10] as number | null,
  };
}
