import { getDB, persist } from '../database';
import { WeeklyBoss, BOSS_TEMPLATES, getWeekStart } from '../../types/weeklyBoss';
import type { SqlValue } from 'sql.js';

export function getCurrentBoss(): WeeklyBoss | null {
  const db = getDB();
  const weekStart = getWeekStart();

  const result = db.exec(
    `SELECT id, week_start, boss_type, name, description, icon, max_hp, current_hp,
            is_defeated, defeated_at, xp_reward, bonus_shields, created_at
     FROM weekly_boss WHERE week_start = ?`,
    [weekStart]
  );

  if (!result.length || !result[0].values.length) {
    return null;
  }

  const row = result[0].values[0];
  return mapRowToBoss(row);
}

export function getBossById(id: number): WeeklyBoss | null {
  const db = getDB();

  const result = db.exec(
    `SELECT id, week_start, boss_type, name, description, icon, max_hp, current_hp,
            is_defeated, defeated_at, xp_reward, bonus_shields, created_at
     FROM weekly_boss WHERE id = ?`,
    [id]
  );

  if (!result.length || !result[0].values.length) {
    return null;
  }

  return mapRowToBoss(result[0].values[0]);
}

export async function generateWeeklyBoss(): Promise<WeeklyBoss> {
  const db = getDB();
  const weekStart = getWeekStart();

  // Check if boss already exists for this week
  const existing = getCurrentBoss();
  if (existing) {
    return existing;
  }

  // Select a random boss template
  const template = BOSS_TEMPLATES[Math.floor(Math.random() * BOSS_TEMPLATES.length)];

  // Calculate HP within range
  const hp = Math.floor(
    Math.random() * (template.hpRange[1] - template.hpRange[0] + 1)
  ) + template.hpRange[0];

  db.run(
    `INSERT INTO weekly_boss (week_start, boss_type, name, description, icon, max_hp, current_hp, xp_reward, bonus_shields)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [weekStart, template.type, template.name, template.description, template.icon, hp, hp, template.xpReward, template.bonusShields]
  );

  await persist();
  return getCurrentBoss()!;
}

export async function dealDamage(
  bossId: number,
  damageType: string,
  damageAmount: number,
  sourceDescription?: string
): Promise<{ newHp: number; isDefeated: boolean }> {
  const db = getDB();

  // Get current boss
  const boss = getBossById(bossId);
  if (!boss || boss.is_defeated) {
    return { newHp: boss?.current_hp || 0, isDefeated: boss?.is_defeated || false };
  }

  // Calculate new HP
  const newHp = Math.max(0, boss.current_hp - damageAmount);
  const isDefeated = newHp === 0;

  // Update boss HP
  db.run(
    `UPDATE weekly_boss SET current_hp = ?, is_defeated = ?, defeated_at = ?
     WHERE id = ?`,
    [newHp, isDefeated ? 1 : 0, isDefeated ? new Date().toISOString() : null, bossId]
  );

  // Log the damage
  db.run(
    `INSERT INTO boss_damage_log (boss_id, damage_type, damage_amount, source_description)
     VALUES (?, ?, ?, ?)`,
    [bossId, damageType, damageAmount, sourceDescription || null]
  );

  await persist();
  return { newHp, isDefeated };
}

export async function healBoss(
  bossId: number,
  healType: string,
  healAmount: number,
  sourceDescription?: string
): Promise<{ newHp: number }> {
  const db = getDB();

  // Get current boss
  const boss = getBossById(bossId);
  if (!boss || boss.is_defeated) {
    return { newHp: boss?.current_hp || 0 };
  }

  // Calculate new HP (can't exceed max)
  const newHp = Math.min(boss.max_hp, boss.current_hp + healAmount);

  // Update boss HP
  db.run(
    `UPDATE weekly_boss SET current_hp = ? WHERE id = ?`,
    [newHp, bossId]
  );

  // Log the healing as negative damage
  db.run(
    `INSERT INTO boss_damage_log (boss_id, damage_type, damage_amount, source_description)
     VALUES (?, ?, ?, ?)`,
    [bossId, healType, -healAmount, sourceDescription || null]
  );

  await persist();
  return { newHp };
}

export function getDamageLog(bossId: number, limit: number = 20): Array<{
  id: number;
  damage_type: string;
  damage_amount: number;
  source_description: string | null;
  dealt_at: string;
}> {
  const db = getDB();

  const result = db.exec(
    `SELECT id, damage_type, damage_amount, source_description, dealt_at
     FROM boss_damage_log WHERE boss_id = ?
     ORDER BY dealt_at DESC LIMIT ?`,
    [bossId, limit]
  );

  if (!result.length) return [];

  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    damage_type: row[1] as string,
    damage_amount: row[2] as number,
    source_description: row[3] as string | null,
    dealt_at: row[4] as string,
  }));
}

export function getPastBosses(limit: number = 10): WeeklyBoss[] {
  const db = getDB();
  const weekStart = getWeekStart();

  const result = db.exec(
    `SELECT id, week_start, boss_type, name, description, icon, max_hp, current_hp,
            is_defeated, defeated_at, xp_reward, bonus_shields, created_at
     FROM weekly_boss WHERE week_start < ?
     ORDER BY week_start DESC LIMIT ?`,
    [weekStart, limit]
  );

  if (!result.length) return [];

  return result[0].values.map((row: SqlValue[]) => mapRowToBoss(row));
}

export function getTotalBossesDefeated(): number {
  const db = getDB();
  const result = db.exec('SELECT COUNT(*) FROM weekly_boss WHERE is_defeated = 1');
  return result.length && result[0].values.length ? (result[0].values[0][0] as number) : 0;
}

function mapRowToBoss(row: SqlValue[]): WeeklyBoss {
  return {
    id: row[0] as number,
    week_start: row[1] as string,
    boss_type: row[2] as string,
    name: row[3] as string,
    description: row[4] as string,
    icon: row[5] as string,
    max_hp: row[6] as number,
    current_hp: row[7] as number,
    is_defeated: Boolean(row[8]),
    defeated_at: row[9] as string | null,
    xp_reward: row[10] as number,
    bonus_shields: row[11] as number,
    created_at: row[12] as string,
  };
}
