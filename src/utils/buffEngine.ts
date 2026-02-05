import { getDB, persist } from '../db/database';
import { ActiveBuff, ParsedStatEffects } from '../types/buff';
import { Stats } from '../types/character';
import type { SqlValue } from 'sql.js';

export function parseStatEffects(json: string): ParsedStatEffects {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export async function expireBuffs(): Promise<void> {
  const db = getDB();
  db.run(
    "UPDATE buff_log SET is_active = 0 WHERE is_active = 1 AND expires_at <= datetime('now')"
  );
  await persist();
}

export function getActiveBuffs(): ActiveBuff[] {
  const db = getDB();
  const result = db.exec(`
    SELECT bl.id, bl.definition_id, bl.activated_at, bl.expires_at, bl.is_active,
           bd.name, bd.description, bd.type, bd.icon, bd.stat_effects
    FROM buff_log bl
    JOIN buff_definitions bd ON bl.definition_id = bd.id
    WHERE bl.is_active = 1 AND bl.expires_at > datetime('now')
    ORDER BY bl.activated_at DESC
  `);

  if (!result.length) return [];

  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    definition_id: row[1] as number,
    activated_at: row[2] as string,
    expires_at: row[3] as string,
    is_active: Boolean(row[4]),
    name: row[5] as string,
    description: row[6] as string,
    type: row[7] as 'buff' | 'debuff',
    icon: row[8] as string,
    stat_effects: row[9] as string,
  }));
}

export function aggregateStats(activeBuffs: ActiveBuff[]): Stats {
  const base: Stats = { stamina: 10, willpower: 10, health: 10, focus: 10, charisma: 10 };

  for (const buff of activeBuffs) {
    const effects = parseStatEffects(buff.stat_effects);
    for (const [stat, value] of Object.entries(effects)) {
      if (stat in base) {
        base[stat as keyof Stats] += value;
      }
    }
  }

  return base;
}

/**
 * Aggregate stats from all sources:
 * - Base stats (10 each)
 * - Active buff effects
 * - Equipped item bonuses
 * - Skill tree passive bonuses
 * - Character class bonuses
 * - Energy debuff penalties
 */
export function aggregateAllStats(
  activeBuffs: ActiveBuff[],
  equippedBonuses: Record<string, number> = {},
  skillBonuses: Record<string, number> = {},
  classBonuses: Record<string, number> = {},
  energyPenalties: Record<string, number> = {}
): Stats {
  const stats: Stats = { stamina: 10, willpower: 10, health: 10, focus: 10, charisma: 10 };

  // Add buff effects
  for (const buff of activeBuffs) {
    const effects = parseStatEffects(buff.stat_effects);
    for (const [stat, value] of Object.entries(effects)) {
      if (stat in stats) {
        stats[stat as keyof Stats] += value;
      }
    }
  }

  // Add equipped item bonuses
  for (const [stat, value] of Object.entries(equippedBonuses)) {
    if (stat in stats) {
      stats[stat as keyof Stats] += value;
    }
  }

  // Add skill tree bonuses
  for (const [stat, value] of Object.entries(skillBonuses)) {
    if (stat in stats) {
      stats[stat as keyof Stats] += value;
    }
  }

  // Add class bonuses
  for (const [stat, value] of Object.entries(classBonuses)) {
    if (stat in stats) {
      stats[stat as keyof Stats] += value;
    }
  }

  // Apply energy penalties (debuffs from low energy)
  for (const [stat, value] of Object.entries(energyPenalties)) {
    if (stat in stats) {
      stats[stat as keyof Stats] += value; // Value is negative
    }
  }

  // Ensure stats don't go below 0
  for (const stat of Object.keys(stats) as (keyof Stats)[]) {
    stats[stat] = Math.max(0, stats[stat]);
  }

  return stats;
}
