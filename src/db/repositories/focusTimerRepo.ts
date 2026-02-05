import { getDB, persist } from '../database';
import { FocusSession, FocusSettings, FocusStats, DEFAULT_FOCUS_SETTINGS } from '../../types/focusTimer';
import type { SqlValue } from 'sql.js';

export function getFocusSettings(): FocusSettings {
  const db = getDB();
  const result = db.exec(`
    SELECT id, work_duration, short_break, long_break, sessions_before_long_break, auto_start_breaks, sound_enabled
    FROM focus_settings WHERE id = 1
  `);
  if (!result.length || !result[0].values.length) {
    return { id: 1, ...DEFAULT_FOCUS_SETTINGS };
  }
  const row = result[0].values[0];
  return {
    id: row[0] as number,
    work_duration: row[1] as number,
    short_break: row[2] as number,
    long_break: row[3] as number,
    sessions_before_long_break: row[4] as number,
    auto_start_breaks: Boolean(row[5]),
    sound_enabled: Boolean(row[6]),
  };
}

export async function updateFocusSettings(settings: Partial<Omit<FocusSettings, 'id'>>): Promise<FocusSettings> {
  const db = getDB();
  const current = getFocusSettings();
  const updated = { ...current, ...settings };

  db.run(`
    UPDATE focus_settings SET
      work_duration = ?,
      short_break = ?,
      long_break = ?,
      sessions_before_long_break = ?,
      auto_start_breaks = ?,
      sound_enabled = ?
    WHERE id = 1
  `, [
    updated.work_duration,
    updated.short_break,
    updated.long_break,
    updated.sessions_before_long_break,
    updated.auto_start_breaks ? 1 : 0,
    updated.sound_enabled ? 1 : 0,
  ]);

  await persist();
  return updated;
}

export function getFocusStats(): FocusStats {
  const db = getDB();
  const result = db.exec(`
    SELECT id, total_sessions, total_minutes, longest_streak, current_streak, today_sessions, today_date
    FROM focus_stats WHERE id = 1
  `);
  if (!result.length || !result[0].values.length) {
    return {
      id: 1,
      total_sessions: 0,
      total_minutes: 0,
      longest_streak: 0,
      current_streak: 0,
      today_sessions: 0,
      today_date: new Date().toISOString().split('T')[0],
    };
  }
  const row = result[0].values[0];
  return {
    id: row[0] as number,
    total_sessions: row[1] as number,
    total_minutes: row[2] as number,
    longest_streak: row[3] as number,
    current_streak: row[4] as number,
    today_sessions: row[5] as number,
    today_date: row[6] as string,
  };
}

export async function startSession(
  durationMinutes: number,
  linkedStepId: number | null = null,
  linkedQuestId: number | null = null
): Promise<FocusSession> {
  const db = getDB();

  db.run(`
    INSERT INTO focus_sessions (duration_minutes, linked_step_id, linked_quest_id, status)
    VALUES (?, ?, ?, 'active')
  `, [durationMinutes, linkedStepId, linkedQuestId]);

  const result = db.exec('SELECT last_insert_rowid()');
  const id = result[0].values[0][0] as number;

  await persist();
  return getSessionById(id)!;
}

export async function completeSession(sessionId: number, xpEarned: number, notes: string = ''): Promise<FocusSession | null> {
  const db = getDB();

  db.run(`
    UPDATE focus_sessions SET
      status = 'completed',
      completed_at = datetime('now'),
      xp_earned = ?,
      notes = ?
    WHERE id = ? AND status = 'active'
  `, [xpEarned, notes, sessionId]);

  // Update stats
  const session = getSessionById(sessionId);
  if (session) {
    await updateStatsOnCompletion(session.duration_minutes);
  }

  await persist();
  return session;
}

export async function cancelSession(sessionId: number): Promise<void> {
  const db = getDB();
  db.run(`UPDATE focus_sessions SET status = 'cancelled', completed_at = datetime('now') WHERE id = ?`, [sessionId]);
  await persist();
}

export function getSessionById(id: number): FocusSession | null {
  const db = getDB();
  const result = db.exec(`
    SELECT id, duration_minutes, started_at, completed_at, status, xp_earned, linked_step_id, linked_quest_id, break_taken, notes
    FROM focus_sessions WHERE id = ?
  `, [id]);
  if (!result.length || !result[0].values.length) return null;
  const row = result[0].values[0];
  return mapSessionRow(row);
}

export function getActiveSession(): FocusSession | null {
  const db = getDB();
  const result = db.exec(`
    SELECT id, duration_minutes, started_at, completed_at, status, xp_earned, linked_step_id, linked_quest_id, break_taken, notes
    FROM focus_sessions WHERE status = 'active' ORDER BY started_at DESC LIMIT 1
  `);
  if (!result.length || !result[0].values.length) return null;
  return mapSessionRow(result[0].values[0]);
}

export function getRecentSessions(limit: number = 10): FocusSession[] {
  const db = getDB();
  const result = db.exec(`
    SELECT id, duration_minutes, started_at, completed_at, status, xp_earned, linked_step_id, linked_quest_id, break_taken, notes
    FROM focus_sessions ORDER BY started_at DESC LIMIT ?
  `, [limit]);
  if (!result.length) return [];
  return result[0].values.map(mapSessionRow);
}

export function getTodaySessions(): FocusSession[] {
  const db = getDB();
  const result = db.exec(`
    SELECT id, duration_minutes, started_at, completed_at, status, xp_earned, linked_step_id, linked_quest_id, break_taken, notes
    FROM focus_sessions WHERE date(started_at) = date('now') AND status = 'completed'
    ORDER BY started_at DESC
  `);
  if (!result.length) return [];
  return result[0].values.map(mapSessionRow);
}

async function updateStatsOnCompletion(durationMinutes: number): Promise<void> {
  const db = getDB();
  const stats = getFocusStats();
  const today = new Date().toISOString().split('T')[0];

  // Check if we need to reset today's count
  const isSameDay = stats.today_date === today;
  const todaySessions = isSameDay ? stats.today_sessions + 1 : 1;

  // Calculate new streak
  const newCurrentStreak = stats.current_streak + 1;
  const newLongestStreak = Math.max(stats.longest_streak, newCurrentStreak);

  db.run(`
    UPDATE focus_stats SET
      total_sessions = total_sessions + 1,
      total_minutes = total_minutes + ?,
      current_streak = ?,
      longest_streak = ?,
      today_sessions = ?,
      today_date = ?
    WHERE id = 1
  `, [durationMinutes, newCurrentStreak, newLongestStreak, todaySessions, today]);

  await persist();
}

export async function resetStreak(): Promise<void> {
  const db = getDB();
  db.run(`UPDATE focus_stats SET current_streak = 0 WHERE id = 1`);
  await persist();
}

function mapSessionRow(row: SqlValue[]): FocusSession {
  return {
    id: row[0] as number,
    duration_minutes: row[1] as number,
    started_at: row[2] as string,
    completed_at: row[3] as string | null,
    status: row[4] as FocusSession['status'],
    xp_earned: row[5] as number,
    linked_step_id: row[6] as number | null,
    linked_quest_id: row[7] as number | null,
    break_taken: Boolean(row[8]),
    notes: row[9] as string,
  };
}
