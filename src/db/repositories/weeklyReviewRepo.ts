import { getDB, persist } from '../database';
import { WeeklyReview, WeeklySummaryData, DEFAULT_SUMMARY_DATA } from '../../types/weeklyReview';
import type { SqlValue } from 'sql.js';

export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function getCurrentWeekReview(): WeeklyReview | null {
  const db = getDB();
  const weekStart = getWeekStart();
  const result = db.exec(
    `SELECT id, week_start, generated_at, completed_at, is_completed, summary_data, wins, challenges, priorities, notes, xp_earned
     FROM weekly_reviews WHERE week_start = ?`,
    [weekStart]
  );
  if (!result.length || !result[0].values.length) return null;
  return mapReviewRow(result[0].values[0]);
}

export function getReviewByWeek(weekStart: string): WeeklyReview | null {
  const db = getDB();
  const result = db.exec(
    `SELECT id, week_start, generated_at, completed_at, is_completed, summary_data, wins, challenges, priorities, notes, xp_earned
     FROM weekly_reviews WHERE week_start = ?`,
    [weekStart]
  );
  if (!result.length || !result[0].values.length) return null;
  return mapReviewRow(result[0].values[0]);
}

export function getRecentReviews(limit: number = 10): WeeklyReview[] {
  const db = getDB();
  const result = db.exec(
    `SELECT id, week_start, generated_at, completed_at, is_completed, summary_data, wins, challenges, priorities, notes, xp_earned
     FROM weekly_reviews ORDER BY week_start DESC LIMIT ?`,
    [limit]
  );
  if (!result.length) return [];
  return result[0].values.map(mapReviewRow);
}

export async function generateWeeklySummary(): Promise<WeeklySummaryData> {
  const db = getDB();
  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const summary: WeeklySummaryData = { ...DEFAULT_SUMMARY_DATA };

  // Steps completed this week
  const stepsResult = db.exec(
    `SELECT COUNT(*) FROM steps WHERE completed_at IS NOT NULL
     AND date(completed_at) >= ? AND date(completed_at) < ?`,
    [weekStart, weekEndStr]
  );
  summary.steps_completed = stepsResult.length ? (stepsResult[0].values[0][0] as number) : 0;

  // Quests completed
  const questsResult = db.exec(
    `SELECT COUNT(*) FROM quests WHERE status = 'completed'
     AND date(completed_at) >= ? AND date(completed_at) < ?`,
    [weekStart, weekEndStr]
  );
  summary.quests_completed = questsResult.length ? (questsResult[0].values[0][0] as number) : 0;

  // Goals completed
  const goalsResult = db.exec(
    `SELECT COUNT(*) FROM goals WHERE status = 'completed'
     AND date(completed_at) >= ? AND date(completed_at) < ?`,
    [weekStart, weekEndStr]
  );
  summary.goals_completed = goalsResult.length ? (goalsResult[0].values[0][0] as number) : 0;

  // Buffs activated
  const buffsResult = db.exec(
    `SELECT COUNT(*) FROM buff_log bl
     JOIN buff_definitions bd ON bl.definition_id = bd.id
     WHERE bd.type = 'buff' AND date(bl.activated_at) >= ? AND date(bl.activated_at) < ?`,
    [weekStart, weekEndStr]
  );
  summary.buffs_activated = buffsResult.length ? (buffsResult[0].values[0][0] as number) : 0;

  // Debuffs activated
  const debuffsResult = db.exec(
    `SELECT COUNT(*) FROM buff_log bl
     JOIN buff_definitions bd ON bl.definition_id = bd.id
     WHERE bd.type = 'debuff' AND date(bl.activated_at) >= ? AND date(bl.activated_at) < ?`,
    [weekStart, weekEndStr]
  );
  summary.debuffs_activated = debuffsResult.length ? (debuffsResult[0].values[0][0] as number) : 0;

  // XP earned
  const xpResult = db.exec(
    `SELECT COALESCE(SUM(amount), 0) FROM xp_log
     WHERE date(created_at) >= ? AND date(created_at) < ?`,
    [weekStart, weekEndStr]
  );
  summary.xp_earned = xpResult.length ? (xpResult[0].values[0][0] as number) : 0;

  // Boss damage - check if table exists first
  try {
    const bossResult = db.exec(
      `SELECT COALESCE(SUM(damage), 0), MAX(CASE WHEN is_defeated = 1 THEN 1 ELSE 0 END)
       FROM weekly_boss WHERE week_start = ?`,
      [weekStart]
    );
    if (bossResult.length && bossResult[0].values.length) {
      summary.boss_damage_dealt = bossResult[0].values[0][0] as number;
      summary.boss_defeated = Boolean(bossResult[0].values[0][1]);
    }
  } catch {
    // Table may not exist yet
  }

  // Focus sessions - check if table exists
  try {
    const focusResult = db.exec(
      `SELECT COUNT(*), COALESCE(SUM(duration_minutes), 0) FROM focus_sessions
       WHERE status = 'completed' AND date(started_at) >= ? AND date(started_at) < ?`,
      [weekStart, weekEndStr]
    );
    if (focusResult.length && focusResult[0].values.length) {
      summary.focus_sessions = focusResult[0].values[0][0] as number;
      summary.focus_minutes = focusResult[0].values[0][1] as number;
    }
  } catch {
    // Table may not exist yet
  }

  // Routines completed - check if table exists
  try {
    const routinesResult = db.exec(
      `SELECT COUNT(*) FROM routine_logs
       WHERE is_completed = 1 AND date >= ? AND date < ?`,
      [weekStart, weekEndStr]
    );
    summary.routines_completed = routinesResult.length ? (routinesResult[0].values[0][0] as number) : 0;
  } catch {
    // Table may not exist yet
  }

  // Combos activated - check if table exists
  try {
    const combosResult = db.exec(
      `SELECT COUNT(*) FROM combo_activations
       WHERE date(activated_at) >= ? AND date(activated_at) < ?`,
      [weekStart, weekEndStr]
    );
    summary.combos_activated = combosResult.length ? (combosResult[0].values[0][0] as number) : 0;
  } catch {
    // Table may not exist yet
  }

  // Achievements unlocked - check if table exists
  try {
    const achievementsResult = db.exec(
      `SELECT COUNT(*) FROM achievement_unlocks
       WHERE date(unlocked_at) >= ? AND date(unlocked_at) < ?`,
      [weekStart, weekEndStr]
    );
    summary.achievements_unlocked = achievementsResult.length ? (achievementsResult[0].values[0][0] as number) : 0;
  } catch {
    // Table may not exist yet
  }

  return summary;
}

export async function createOrUpdateReview(summaryData: WeeklySummaryData): Promise<WeeklyReview> {
  const db = getDB();
  const weekStart = getWeekStart();
  const summaryJson = JSON.stringify(summaryData);

  const existing = getCurrentWeekReview();
  if (existing) {
    db.run(
      `UPDATE weekly_reviews SET summary_data = ?, generated_at = datetime('now') WHERE id = ?`,
      [summaryJson, existing.id]
    );
  } else {
    db.run(
      `INSERT INTO weekly_reviews (week_start, summary_data) VALUES (?, ?)`,
      [weekStart, summaryJson]
    );
  }

  await persist();
  return getCurrentWeekReview()!;
}

export async function updateReviewContent(
  reviewId: number,
  wins: string,
  challenges: string,
  priorities: string[],
  notes: string
): Promise<void> {
  const db = getDB();
  db.run(
    `UPDATE weekly_reviews SET wins = ?, challenges = ?, priorities = ?, notes = ? WHERE id = ?`,
    [wins, challenges, JSON.stringify(priorities), notes, reviewId]
  );
  await persist();
}

export async function completeReview(reviewId: number, xpEarned: number): Promise<void> {
  const db = getDB();
  db.run(
    `UPDATE weekly_reviews SET is_completed = 1, completed_at = datetime('now'), xp_earned = ? WHERE id = ?`,
    [xpEarned, reviewId]
  );
  await persist();
}

function mapReviewRow(row: SqlValue[]): WeeklyReview {
  return {
    id: row[0] as number,
    week_start: row[1] as string,
    generated_at: row[2] as string,
    completed_at: row[3] as string | null,
    is_completed: Boolean(row[4]),
    summary_data: row[5] as string,
    wins: row[6] as string,
    challenges: row[7] as string,
    priorities: row[8] as string,
    notes: row[9] as string,
    xp_earned: row[10] as number,
  };
}
