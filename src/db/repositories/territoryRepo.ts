import { getDB, persist } from '../database';
import { Territory, TerritoryProgress, TerritoryWithProgress } from '../../types/territory';
import type { SqlValue } from 'sql.js';

export function getTerritories(): Territory[] {
  const db = getDB();
  const result = db.exec(`
    SELECT id, name, description, icon, unlock_level, background_color, position_x, position_y, connected_to, challenges, rewards
    FROM territories ORDER BY unlock_level
  `);
  if (!result.length) return [];
  return result[0].values.map(mapTerritoryRow);
}

export function getTerritoryById(id: number): Territory | null {
  const db = getDB();
  const result = db.exec(`
    SELECT id, name, description, icon, unlock_level, background_color, position_x, position_y, connected_to, challenges, rewards
    FROM territories WHERE id = ?
  `, [id]);
  if (!result.length || !result[0].values.length) return null;
  return mapTerritoryRow(result[0].values[0]);
}

export function getTerritoriesWithProgress(characterLevel: number): TerritoryWithProgress[] {
  const db = getDB();
  const territories = getTerritories();
  const progressResult = db.exec(`
    SELECT id, territory_id, discovered_at, completed_at, challenges_completed, is_current
    FROM territory_progress
  `);

  const progressMap = new Map<number, TerritoryProgress>();
  if (progressResult.length) {
    for (const row of progressResult[0].values) {
      progressMap.set(row[1] as number, {
        id: row[0] as number,
        territory_id: row[1] as number,
        discovered_at: row[2] as string,
        completed_at: row[3] as string | null,
        challenges_completed: row[4] as string,
        is_current: Boolean(row[5]),
      });
    }
  }

  return territories.map((territory) => {
    const progress = progressMap.get(territory.id);
    return {
      ...territory,
      discovered: !!progress,
      discovered_at: progress?.discovered_at || null,
      completed: !!progress?.completed_at,
      completed_at: progress?.completed_at || null,
      is_current: progress?.is_current || false,
      is_locked: territory.unlock_level > characterLevel,
      challenges_completed: progress ? JSON.parse(progress.challenges_completed) : [],
    };
  });
}

export function getCurrentTerritory(): TerritoryWithProgress | null {
  const db = getDB();
  const result = db.exec(`
    SELECT t.id, t.name, t.description, t.icon, t.unlock_level, t.background_color, t.position_x, t.position_y, t.connected_to, t.challenges, t.rewards,
           tp.id, tp.discovered_at, tp.completed_at, tp.challenges_completed, tp.is_current
    FROM territories t
    JOIN territory_progress tp ON t.id = tp.territory_id
    WHERE tp.is_current = 1
  `);
  if (!result.length || !result[0].values.length) return null;
  const row = result[0].values[0];
  return {
    id: row[0] as number,
    name: row[1] as string,
    description: row[2] as string,
    icon: row[3] as string,
    unlock_level: row[4] as number,
    background_color: row[5] as string,
    position_x: row[6] as number,
    position_y: row[7] as number,
    connected_to: row[8] as string,
    challenges: row[9] as string,
    rewards: row[10] as string,
    discovered: true,
    discovered_at: row[12] as string,
    completed: row[13] !== null,
    completed_at: row[13] as string | null,
    is_current: true,
    is_locked: false,
    challenges_completed: JSON.parse(row[14] as string),
  };
}

export async function discoverTerritory(territoryId: number): Promise<void> {
  const db = getDB();
  const existing = db.exec(`SELECT 1 FROM territory_progress WHERE territory_id = ?`, [territoryId]);
  if (existing.length && existing[0].values.length) return;

  db.run(`INSERT INTO territory_progress (territory_id) VALUES (?)`, [territoryId]);
  await persist();
}

export async function setCurrentTerritory(territoryId: number): Promise<void> {
  const db = getDB();
  db.run(`UPDATE territory_progress SET is_current = 0`);
  db.run(`UPDATE territory_progress SET is_current = 1 WHERE territory_id = ?`, [territoryId]);
  await persist();
}

export async function completeChallenge(territoryId: number, challengeIndex: number): Promise<void> {
  const db = getDB();
  const progressResult = db.exec(`SELECT challenges_completed FROM territory_progress WHERE territory_id = ?`, [territoryId]);
  if (!progressResult.length || !progressResult[0].values.length) return;

  const completed: number[] = JSON.parse(progressResult[0].values[0][0] as string);
  if (!completed.includes(challengeIndex)) {
    completed.push(challengeIndex);
    db.run(`UPDATE territory_progress SET challenges_completed = ? WHERE territory_id = ?`, [JSON.stringify(completed), territoryId]);
    await persist();
  }
}

export async function completeTerritory(territoryId: number): Promise<void> {
  const db = getDB();
  db.run(`UPDATE territory_progress SET completed_at = datetime('now') WHERE territory_id = ?`, [territoryId]);
  await persist();
}

function mapTerritoryRow(row: SqlValue[]): Territory {
  return {
    id: row[0] as number,
    name: row[1] as string,
    description: row[2] as string,
    icon: row[3] as string,
    unlock_level: row[4] as number,
    background_color: row[5] as string,
    position_x: row[6] as number,
    position_y: row[7] as number,
    connected_to: row[8] as string,
    challenges: row[9] as string,
    rewards: row[10] as string,
  };
}
