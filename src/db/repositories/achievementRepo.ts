import { getDB, persist } from '../database';
import { AchievementDefinition, AchievementWithProgress, AchievementUnlock, AchievementProgress } from '../../types/achievement';
import type { SqlValue } from 'sql.js';

export function getAchievementDefinitions(category?: string): AchievementDefinition[] {
  const db = getDB();
  let sql = `SELECT id, key, name, description, category, icon, xp_reward,
             requirement_type, requirement_value, requirement_source, sort_order, is_hidden
             FROM achievement_definitions`;
  const params: string[] = [];
  if (category) {
    sql += ' WHERE category = ?';
    params.push(category);
  }
  sql += ' ORDER BY category, sort_order';
  const result = db.exec(sql, params);
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    key: row[1] as string,
    name: row[2] as string,
    description: row[3] as string,
    category: row[4] as AchievementDefinition['category'],
    icon: row[5] as string,
    xp_reward: row[6] as number,
    requirement_type: row[7] as AchievementDefinition['requirement_type'],
    requirement_value: row[8] as number,
    requirement_source: row[9] as string,
    sort_order: row[10] as number,
    is_hidden: Boolean(row[11]),
  }));
}

export function getAchievementsWithProgress(): AchievementWithProgress[] {
  const db = getDB();
  const sql = `
    SELECT
      ad.id, ad.key, ad.name, ad.description, ad.category, ad.icon, ad.xp_reward,
      ad.requirement_type, ad.requirement_value, ad.requirement_source, ad.sort_order, ad.is_hidden,
      au.unlocked_at,
      COALESCE(ap.current_value, 0) as current_value
    FROM achievement_definitions ad
    LEFT JOIN achievement_unlocks au ON ad.id = au.definition_id
    LEFT JOIN achievement_progress ap ON ad.id = ap.definition_id
    ORDER BY ad.category, ad.sort_order
  `;
  const result = db.exec(sql);
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => {
    const requirement_value = row[8] as number;
    const current_value = row[13] as number;
    const unlocked_at = row[12] as string | null;
    return {
      id: row[0] as number,
      key: row[1] as string,
      name: row[2] as string,
      description: row[3] as string,
      category: row[4] as AchievementDefinition['category'],
      icon: row[5] as string,
      xp_reward: row[6] as number,
      requirement_type: row[7] as AchievementDefinition['requirement_type'],
      requirement_value,
      requirement_source: row[9] as string,
      sort_order: row[10] as number,
      is_hidden: Boolean(row[11]),
      unlocked: unlocked_at !== null,
      unlocked_at,
      current_value,
      progress_percent: Math.min(100, Math.round((current_value / requirement_value) * 100)),
    };
  });
}

export function getUnlockedAchievements(): AchievementUnlock[] {
  const db = getDB();
  const result = db.exec('SELECT id, definition_id, unlocked_at FROM achievement_unlocks ORDER BY unlocked_at DESC');
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    definition_id: row[1] as number,
    unlocked_at: row[2] as string,
  }));
}

export function getProgress(definitionId: number): AchievementProgress | null {
  const db = getDB();
  const result = db.exec(
    'SELECT id, definition_id, current_value, last_updated FROM achievement_progress WHERE definition_id = ?',
    [definitionId]
  );
  if (!result.length || !result[0].values.length) return null;
  const row = result[0].values[0];
  return {
    id: row[0] as number,
    definition_id: row[1] as number,
    current_value: row[2] as number,
    last_updated: row[3] as string,
  };
}

export async function setProgress(definitionId: number, value: number): Promise<void> {
  const db = getDB();
  // Upsert progress
  db.run(
    `INSERT INTO achievement_progress (definition_id, current_value, last_updated)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(definition_id) DO UPDATE SET
     current_value = excluded.current_value,
     last_updated = excluded.last_updated`,
    [definitionId, value]
  );
  await persist();
}

export async function incrementProgress(source: string, amount: number = 1): Promise<number[]> {
  const db = getDB();
  // Find all achievements tracking this source
  const defsResult = db.exec(
    `SELECT id, requirement_value FROM achievement_definitions
     WHERE requirement_source = ?`,
    [source]
  );
  if (!defsResult.length) return [];

  const unlockedIds: number[] = [];

  for (const row of defsResult[0].values) {
    const defId = row[0] as number;
    const reqValue = row[1] as number;

    // Check if already unlocked
    const unlockCheck = db.exec(
      'SELECT 1 FROM achievement_unlocks WHERE definition_id = ?',
      [defId]
    );
    if (unlockCheck.length && unlockCheck[0].values.length) continue;

    // Get or create progress
    const progressResult = db.exec(
      'SELECT current_value FROM achievement_progress WHERE definition_id = ?',
      [defId]
    );
    const currentValue = progressResult.length && progressResult[0].values.length
      ? (progressResult[0].values[0][0] as number)
      : 0;

    const newValue = currentValue + amount;

    // Update progress
    db.run(
      `INSERT INTO achievement_progress (definition_id, current_value, last_updated)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(definition_id) DO UPDATE SET
       current_value = excluded.current_value,
       last_updated = excluded.last_updated`,
      [defId, newValue]
    );

    // Check if achievement should be unlocked
    if (newValue >= reqValue) {
      unlockedIds.push(defId);
    }
  }

  await persist();
  return unlockedIds;
}

export async function checkThreshold(source: string, value: number): Promise<number[]> {
  const db = getDB();
  // Find all threshold-based achievements for this source
  const defsResult = db.exec(
    `SELECT id, requirement_value FROM achievement_definitions
     WHERE requirement_source = ? AND requirement_type = 'threshold'`,
    [source]
  );
  if (!defsResult.length) return [];

  const unlockedIds: number[] = [];

  for (const row of defsResult[0].values) {
    const defId = row[0] as number;
    const reqValue = row[1] as number;

    // Check if already unlocked
    const unlockCheck = db.exec(
      'SELECT 1 FROM achievement_unlocks WHERE definition_id = ?',
      [defId]
    );
    if (unlockCheck.length && unlockCheck[0].values.length) continue;

    // Update progress to current value
    db.run(
      `INSERT INTO achievement_progress (definition_id, current_value, last_updated)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(definition_id) DO UPDATE SET
       current_value = excluded.current_value,
       last_updated = excluded.last_updated`,
      [defId, value]
    );

    // Check if threshold is met
    if (value >= reqValue) {
      unlockedIds.push(defId);
    }
  }

  await persist();
  return unlockedIds;
}

export async function unlockAchievement(definitionId: number): Promise<boolean> {
  const db = getDB();

  // Check if already unlocked
  const existing = db.exec(
    'SELECT 1 FROM achievement_unlocks WHERE definition_id = ?',
    [definitionId]
  );
  if (existing.length && existing[0].values.length) return false;

  db.run(
    `INSERT INTO achievement_unlocks (definition_id, unlocked_at) VALUES (?, datetime('now'))`,
    [definitionId]
  );
  await persist();
  return true;
}

export function getAchievementById(id: number): AchievementDefinition | null {
  const db = getDB();
  const result = db.exec(
    `SELECT id, key, name, description, category, icon, xp_reward,
     requirement_type, requirement_value, requirement_source, sort_order, is_hidden
     FROM achievement_definitions WHERE id = ?`,
    [id]
  );
  if (!result.length || !result[0].values.length) return null;
  const row = result[0].values[0];
  return {
    id: row[0] as number,
    key: row[1] as string,
    name: row[2] as string,
    description: row[3] as string,
    category: row[4] as AchievementDefinition['category'],
    icon: row[5] as string,
    xp_reward: row[6] as number,
    requirement_type: row[7] as AchievementDefinition['requirement_type'],
    requirement_value: row[8] as number,
    requirement_source: row[9] as string,
    sort_order: row[10] as number,
    is_hidden: Boolean(row[11]),
  };
}

export function getAchievementStats(): { total: number; unlocked: number; totalXp: number; earnedXp: number } {
  const db = getDB();

  const totalResult = db.exec('SELECT COUNT(*), SUM(xp_reward) FROM achievement_definitions');
  const total = totalResult.length ? (totalResult[0].values[0][0] as number) : 0;
  const totalXp = totalResult.length ? (totalResult[0].values[0][1] as number) || 0 : 0;

  const unlockedResult = db.exec(`
    SELECT COUNT(*), COALESCE(SUM(ad.xp_reward), 0)
    FROM achievement_unlocks au
    JOIN achievement_definitions ad ON au.definition_id = ad.id
  `);
  const unlocked = unlockedResult.length ? (unlockedResult[0].values[0][0] as number) : 0;
  const earnedXp = unlockedResult.length ? (unlockedResult[0].values[0][1] as number) : 0;

  return { total, unlocked, totalXp, earnedXp };
}
