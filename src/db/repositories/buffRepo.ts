import { getDB, persist } from '../database';
import { BuffDefinition, BuffLog } from '../../types/buff';
import type { SqlValue } from 'sql.js';

export function getBuffDefinitions(type?: string): BuffDefinition[] {
  const db = getDB();
  let sql = 'SELECT id, name, description, type, icon, duration_hours, stat_effects, created_at FROM buff_definitions';
  const params: string[] = [];
  if (type) { sql += ' WHERE type = ?'; params.push(type); }
  sql += ' ORDER BY name';
  const result = db.exec(sql, params);
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    name: row[1] as string,
    description: row[2] as string,
    type: row[3] as BuffDefinition['type'],
    icon: row[4] as string,
    duration_hours: row[5] as number,
    stat_effects: row[6] as string,
    created_at: row[7] as string,
  }));
}

export async function createBuffDefinition(
  name: string,
  description: string,
  type: string,
  icon: string,
  durationHours: number,
  statEffects: string
): Promise<number> {
  const db = getDB();
  db.run(
    'INSERT INTO buff_definitions (name, description, type, icon, duration_hours, stat_effects) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, type, icon, durationHours, statEffects]
  );
  const result = db.exec('SELECT last_insert_rowid()');
  await persist();
  return result[0].values[0][0] as number;
}

export async function deleteBuffDefinition(id: number): Promise<void> {
  const db = getDB();
  db.run('DELETE FROM buff_log WHERE definition_id = ?', [id]);
  db.run('DELETE FROM buff_definitions WHERE id = ?', [id]);
  await persist();
}

export async function activateBuff(definitionId: number): Promise<number> {
  const db = getDB();
  const defResult = db.exec('SELECT duration_hours FROM buff_definitions WHERE id = ?', [definitionId]);
  if (!defResult.length) throw new Error('Buff definition not found');
  const hours = defResult[0].values[0][0] as number;

  db.run(
    `INSERT INTO buff_log (definition_id, expires_at)
     VALUES (?, datetime('now', '+' || ? || ' hours'))`,
    [definitionId, hours]
  );
  const result = db.exec('SELECT last_insert_rowid()');
  await persist();
  return result[0].values[0][0] as number;
}

export async function deactivateBuff(logId: number): Promise<void> {
  const db = getDB();
  db.run('UPDATE buff_log SET is_active = 0 WHERE id = ?', [logId]);
  await persist();
}

export function getBuffLog(limit = 50): BuffLog[] {
  const db = getDB();
  const result = db.exec(
    `SELECT id, definition_id, activated_at, expires_at, is_active
     FROM buff_log ORDER BY activated_at DESC LIMIT ?`,
    [limit]
  );
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    definition_id: row[1] as number,
    activated_at: row[2] as string,
    expires_at: row[3] as string,
    is_active: Boolean(row[4]),
  }));
}

export function getStreakDays(definitionId: number): number {
  const db = getDB();
  const result = db.exec(
    `SELECT DISTINCT date(activated_at) as d FROM buff_log
     WHERE definition_id = ? AND activated_at >= date('now', '-30 days')
     ORDER BY d DESC`,
    [definitionId]
  );
  if (!result.length) return 0;

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const dates = result[0].values.map((r: SqlValue[]) => r[0] as string);

  // Check if today or yesterday is in the list to start the streak
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (!dates.includes(today) && !dates.includes(yesterday)) return 0;

  let checkDate = dates.includes(today) ? today : yesterday;
  for (const d of dates) {
    if (d === checkDate) {
      streak++;
      const prev = new Date(checkDate + 'T00:00:00');
      prev.setDate(prev.getDate() - 1);
      checkDate = prev.toISOString().split('T')[0];
    }
  }
  return streak;
}
