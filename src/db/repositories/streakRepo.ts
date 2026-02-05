import { getDB, persist } from '../database';
import { StreakInfo, StreakFreeze, STREAK_MILESTONES } from '../../types/streak';
import type { SqlValue } from 'sql.js';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function getStreakInfo(buffDefinitionId: number): StreakInfo {
  const db = getDB();
  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  // Get activation dates for this buff (last 400 days to cover full year+ streaks)
  const result = db.exec(
    `SELECT DISTINCT date(activated_at) as d FROM buff_log
     WHERE definition_id = ? AND activated_at >= date('now', '-400 days')
     ORDER BY d DESC`,
    [buffDefinitionId]
  );

  const dates = result.length ? result[0].values.map((r: SqlValue[]) => r[0] as string) : [];

  // Get freeze dates
  const freezeResult = db.exec(
    `SELECT freeze_date FROM streak_freezes
     WHERE buff_definition_id = ? AND freeze_date >= date('now', '-400 days')`,
    [buffDefinitionId]
  );
  const freezeDates = freezeResult.length ? freezeResult[0].values.map((r: SqlValue[]) => r[0] as string) : [];

  // Get shield uses
  const shieldResult = db.exec(
    `SELECT used_date FROM streak_shield_uses
     WHERE buff_definition_id = ? AND used_date >= date('now', '-400 days')`,
    [buffDefinitionId]
  );
  const shieldDates = shieldResult.length ? shieldResult[0].values.map((r: SqlValue[]) => r[0] as string) : [];

  // Calculate streak with freeze days and shield uses counted
  let streak = 0;
  const allActiveDays = new Set([...dates, ...freezeDates, ...shieldDates]);

  // Determine starting point
  let checkDate = today;
  if (!allActiveDays.has(today)) {
    if (allActiveDays.has(yesterday)) {
      checkDate = yesterday;
    } else {
      // No activity today or yesterday - streak is 0 unless today is frozen
      if (freezeDates.includes(today)) {
        checkDate = today;
      } else {
        return {
          buffDefinitionId,
          currentStreak: 0,
          longestStreak: getLongestStreak(buffDefinitionId),
          lastActivatedDate: dates[0] || null,
          isAtRisk: dates.length > 0 && dates[0] === yesterday,
          shieldActive: false,
        };
      }
    }
  }

  // Count consecutive days
  while (allActiveDays.has(checkDate)) {
    streak++;
    const d = new Date(checkDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    checkDate = d.toISOString().split('T')[0];
  }

  // Check if streak is at risk (activated yesterday but not today)
  const isAtRisk = !dates.includes(today) && !freezeDates.includes(today) && dates.includes(yesterday);

  // Check if shield is protecting today
  const shieldActive = shieldDates.includes(today);

  // Update longest streak record if needed
  const longestStreak = getLongestStreak(buffDefinitionId);
  if (streak > longestStreak) {
    updateLongestStreak(buffDefinitionId, streak);
  }

  return {
    buffDefinitionId,
    currentStreak: streak,
    longestStreak: Math.max(streak, longestStreak),
    lastActivatedDate: dates[0] || null,
    isAtRisk,
    shieldActive,
  };
}

export function getLongestStreak(buffDefinitionId: number): number {
  const db = getDB();
  const result = db.exec(
    'SELECT longest_streak FROM streak_records WHERE buff_definition_id = ?',
    [buffDefinitionId]
  );
  return result.length && result[0].values.length ? (result[0].values[0][0] as number) : 0;
}

export async function updateLongestStreak(buffDefinitionId: number, streak: number): Promise<void> {
  const db = getDB();
  db.run(
    `INSERT INTO streak_records (buff_definition_id, longest_streak, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(buff_definition_id) DO UPDATE SET
       longest_streak = MAX(longest_streak, excluded.longest_streak),
       updated_at = datetime('now')`,
    [buffDefinitionId, streak]
  );
  await persist();
}

export function getShieldCount(): number {
  const db = getDB();
  const result = db.exec('SELECT SUM(quantity) FROM streak_shields');
  return result.length && result[0].values.length ? (result[0].values[0][0] as number || 0) : 0;
}

export async function addShields(count: number): Promise<void> {
  const db = getDB();
  db.run(`INSERT INTO streak_shields (quantity) VALUES (?)`, [count]);
  await persist();
}

export async function useShield(buffDefinitionId: number): Promise<boolean> {
  const db = getDB();
  const today = getTodayDate();

  // Check if we have shields
  const shieldCount = getShieldCount();
  if (shieldCount <= 0) return false;

  // Check if already used a shield for this buff today
  const existing = db.exec(
    'SELECT id FROM streak_shield_uses WHERE buff_definition_id = ? AND used_date = ?',
    [buffDefinitionId, today]
  );
  if (existing.length && existing[0].values.length) return false;

  // Get current streak to record
  const streakInfo = getStreakInfo(buffDefinitionId);

  // Deduct one shield (from oldest entry with remaining quantity)
  db.run(
    `UPDATE streak_shields SET quantity = quantity - 1
     WHERE id = (SELECT id FROM streak_shields WHERE quantity > 0 ORDER BY earned_at LIMIT 1)`
  );

  // Record shield use
  db.run(
    `INSERT INTO streak_shield_uses (buff_definition_id, used_date, streak_saved)
     VALUES (?, ?, ?)`,
    [buffDefinitionId, today, streakInfo.currentStreak]
  );

  // Clean up empty shield records
  db.run('DELETE FROM streak_shields WHERE quantity <= 0');

  await persist();
  return true;
}

export function getStreakFreezes(buffDefinitionId: number): StreakFreeze[] {
  const db = getDB();
  const result = db.exec(
    `SELECT id, buff_definition_id, freeze_date, reason, created_at
     FROM streak_freezes WHERE buff_definition_id = ? AND freeze_date >= date('now')
     ORDER BY freeze_date`,
    [buffDefinitionId]
  );
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    buff_definition_id: row[1] as number,
    freeze_date: row[2] as string,
    reason: row[3] as string,
    created_at: row[4] as string,
  }));
}

export async function addStreakFreeze(
  buffDefinitionId: number,
  freezeDate: string,
  reason?: string
): Promise<void> {
  const db = getDB();
  db.run(
    `INSERT OR IGNORE INTO streak_freezes (buff_definition_id, freeze_date, reason)
     VALUES (?, ?, ?)`,
    [buffDefinitionId, freezeDate, reason || null]
  );
  await persist();
}

export async function removeStreakFreeze(freezeId: number): Promise<void> {
  const db = getDB();
  db.run('DELETE FROM streak_freezes WHERE id = ?', [freezeId]);
  await persist();
}

export function getLastMilestoneClaimed(buffDefinitionId: number): number {
  const db = getDB();
  const result = db.exec(
    'SELECT last_milestone_claimed FROM streak_records WHERE buff_definition_id = ?',
    [buffDefinitionId]
  );
  return result.length && result[0].values.length ? (result[0].values[0][0] as number) : 0;
}

export async function claimMilestone(buffDefinitionId: number, milestoneDays: number): Promise<void> {
  const db = getDB();
  db.run(
    `INSERT INTO streak_records (buff_definition_id, longest_streak, last_milestone_claimed, updated_at)
     VALUES (?, 0, ?, datetime('now'))
     ON CONFLICT(buff_definition_id) DO UPDATE SET
       last_milestone_claimed = ?,
       updated_at = datetime('now')`,
    [buffDefinitionId, milestoneDays, milestoneDays]
  );
  await persist();
}

export function getUnclaimedMilestones(buffDefinitionId: number, currentStreak: number): typeof STREAK_MILESTONES {
  const lastClaimed = getLastMilestoneClaimed(buffDefinitionId);
  return STREAK_MILESTONES.filter(m => m.days <= currentStreak && m.days > lastClaimed);
}

export function getAllStreakInfos(): Map<number, StreakInfo> {
  const db = getDB();
  const result = db.exec(
    'SELECT DISTINCT definition_id FROM buff_log WHERE definition_id IN (SELECT id FROM buff_definitions WHERE type = ?)',
    ['buff']
  );

  const streakMap = new Map<number, StreakInfo>();
  if (!result.length) return streakMap;

  for (const row of result[0].values) {
    const defId = row[0] as number;
    streakMap.set(defId, getStreakInfo(defId));
  }

  return streakMap;
}
