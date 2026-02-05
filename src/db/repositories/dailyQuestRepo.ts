import { getDB, persist } from '../database';
import { DailyQuest, DailyQuestType, DAILY_QUEST_TEMPLATES, DAILY_QUEST_BONUS_XP } from '../../types/dailyQuest';
import type { SqlValue } from 'sql.js';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDailyQuests(date?: string): DailyQuest[] {
  const db = getDB();
  const targetDate = date || getTodayDate();

  const result = db.exec(
    `SELECT id, date, quest_type, title, description, target_value, current_value, xp_reward, is_completed, completed_at
     FROM daily_quests WHERE date = ? ORDER BY id`,
    [targetDate]
  );

  if (!result.length) return [];

  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    date: row[1] as string,
    quest_type: row[2] as DailyQuestType,
    title: row[3] as string,
    description: row[4] as string,
    target_value: row[5] as number,
    current_value: row[6] as number,
    xp_reward: row[7] as number,
    is_completed: Boolean(row[8]),
    completed_at: row[9] as string | null,
  }));
}

export function isBonusClaimed(date?: string): boolean {
  const db = getDB();
  const targetDate = date || getTodayDate();

  const result = db.exec(
    'SELECT id FROM daily_quest_bonus WHERE date = ?',
    [targetDate]
  );

  return result.length > 0 && result[0].values.length > 0;
}

export async function claimBonus(date?: string): Promise<void> {
  const db = getDB();
  const targetDate = date || getTodayDate();

  db.run(
    `INSERT OR IGNORE INTO daily_quest_bonus (date, claimed_at) VALUES (?, datetime('now'))`,
    [targetDate]
  );

  await persist();
}

export async function generateDailyQuests(): Promise<DailyQuest[]> {
  const db = getDB();
  const today = getTodayDate();

  // Check if quests already exist for today
  const existing = getDailyQuests(today);
  if (existing.length > 0) {
    return existing;
  }

  // Select 3 random quest templates
  const shuffled = [...DAILY_QUEST_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  for (const template of selected) {
    const target = template.targetRange[0] === template.targetRange[1]
      ? template.targetRange[0]
      : Math.floor(Math.random() * (template.targetRange[1] - template.targetRange[0] + 1)) + template.targetRange[0];

    const description = template.description.replace('{target}', target.toString());

    db.run(
      `INSERT INTO daily_quests (date, quest_type, title, description, target_value, xp_reward)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [today, template.type, template.title, description, target, template.xpReward]
    );
  }

  await persist();
  return getDailyQuests(today);
}

export async function updateQuestProgress(
  questType: DailyQuestType,
  increment: number = 1,
  date?: string
): Promise<DailyQuest | null> {
  const db = getDB();
  const targetDate = date || getTodayDate();

  // Find the quest of this type for today
  const result = db.exec(
    `SELECT id, current_value, target_value, is_completed FROM daily_quests
     WHERE date = ? AND quest_type = ? AND is_completed = 0`,
    [targetDate, questType]
  );

  if (!result.length || !result[0].values.length) {
    return null;
  }

  const questId = result[0].values[0][0] as number;
  const currentValue = result[0].values[0][1] as number;
  const targetValue = result[0].values[0][2] as number;
  const newValue = currentValue + increment;
  const isNowCompleted = newValue >= targetValue;

  db.run(
    `UPDATE daily_quests SET current_value = ?, is_completed = ?, completed_at = ?
     WHERE id = ?`,
    [newValue, isNowCompleted ? 1 : 0, isNowCompleted ? new Date().toISOString() : null, questId]
  );

  await persist();

  // Return updated quest
  const updated = db.exec(
    `SELECT id, date, quest_type, title, description, target_value, current_value, xp_reward, is_completed, completed_at
     FROM daily_quests WHERE id = ?`,
    [questId]
  );

  if (!updated.length) return null;

  const row = updated[0].values[0];
  return {
    id: row[0] as number,
    date: row[1] as string,
    quest_type: row[2] as DailyQuestType,
    title: row[3] as string,
    description: row[4] as string,
    target_value: row[5] as number,
    current_value: row[6] as number,
    xp_reward: row[7] as number,
    is_completed: Boolean(row[8]),
    completed_at: row[9] as string | null,
  };
}

export async function checkNoDebuffsQuest(date?: string): Promise<void> {
  const db = getDB();
  const targetDate = date || getTodayDate();

  // Check if any debuffs were activated today
  const debuffsToday = db.exec(
    `SELECT COUNT(*) FROM buff_log bl
     JOIN buff_definitions bd ON bl.definition_id = bd.id
     WHERE bd.type = 'debuff' AND date(bl.activated_at) = ?`,
    [targetDate]
  );

  const debuffCount = debuffsToday[0]?.values[0]?.[0] as number || 0;

  if (debuffCount === 0) {
    // No debuffs today, update the quest progress
    await updateQuestProgress('no_debuffs', 1, targetDate);
  }
}

export function getBonusXp(): number {
  return DAILY_QUEST_BONUS_XP;
}

export async function cleanupOldQuests(daysToKeep: number = 30): Promise<void> {
  const db = getDB();

  db.run(
    `DELETE FROM daily_quests WHERE date < date('now', '-' || ? || ' days')`,
    [daysToKeep]
  );

  db.run(
    `DELETE FROM daily_quest_bonus WHERE date < date('now', '-' || ? || ' days')`,
    [daysToKeep]
  );

  await persist();
}
