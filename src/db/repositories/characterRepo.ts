import { getDB, persist } from '../database';
import { Character, XPLogEntry } from '../../types/character';

export function getCharacter(): Character {
  const db = getDB();
  const result = db.exec('SELECT id, name, total_xp, level, title, created_at FROM character WHERE id = 1');
  if (!result.length) throw new Error('Character not found');
  const row = result[0].values[0];
  return {
    id: row[0] as number,
    name: row[1] as string,
    total_xp: row[2] as number,
    level: row[3] as number,
    title: row[4] as Character['title'],
    created_at: row[5] as string,
  };
}

export async function updateCharacterName(name: string): Promise<void> {
  const db = getDB();
  db.run('UPDATE character SET name = ? WHERE id = 1', [name]);
  await persist();
}

export function getXPLog(limit = 50): XPLogEntry[] {
  const db = getDB();
  const result = db.exec(
    `SELECT id, amount, reason, source_type, source_id, created_at
     FROM xp_log ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
  if (!result.length) return [];
  return result[0].values.map((row) => ({
    id: row[0] as number,
    amount: row[1] as number,
    reason: row[2] as string,
    source_type: row[3] as XPLogEntry['source_type'],
    source_id: row[4] as number | null,
    created_at: row[5] as string,
  }));
}
