import { getDB, persist } from '../database';
import { ComboDefinition, ComboActivation, ComboWithStatus } from '../../types/combo';
import type { SqlValue } from 'sql.js';

export function getCombos(): ComboDefinition[] {
  const db = getDB();
  const result = db.exec(`
    SELECT id, name, description, icon, required_buffs, time_window_hours, bonus_xp, is_active
    FROM combo_definitions WHERE is_active = 1 ORDER BY name
  `);
  if (!result.length) return [];
  return result[0].values.map(mapComboRow);
}

export function getComboById(id: number): ComboDefinition | null {
  const db = getDB();
  const result = db.exec(`
    SELECT id, name, description, icon, required_buffs, time_window_hours, bonus_xp, is_active
    FROM combo_definitions WHERE id = ?
  `, [id]);
  if (!result.length || !result[0].values.length) return null;
  return mapComboRow(result[0].values[0]);
}

export function getCombosWithStatus(): ComboWithStatus[] {
  const db = getDB();
  const combos = getCombos();

  return combos.map((combo) => {
    const requiredIds: number[] = JSON.parse(combo.required_buffs);

    // Get buff names for display
    const buffNamesResult = db.exec(
      `SELECT name FROM buff_definitions WHERE id IN (${requiredIds.join(',') || '0'})`
    );
    const requiredBuffNames = buffNamesResult.length
      ? buffNamesResult[0].values.map((r) => r[0] as string)
      : [];

    // Get currently active buffs within the time window
    const activeBuffsResult = db.exec(
      `SELECT DISTINCT definition_id FROM buff_log
       WHERE is_active = 1
       AND definition_id IN (${requiredIds.join(',') || '0'})
       AND activated_at >= datetime('now', '-${combo.time_window_hours} hours')`
    );
    const activeBuffIds = activeBuffsResult.length
      ? activeBuffsResult[0].values.map((r) => r[0] as number)
      : [];

    // Check last activation
    const lastActivationResult = db.exec(
      `SELECT activated_at FROM combo_activations
       WHERE combo_id = ? ORDER BY activated_at DESC LIMIT 1`,
      [combo.id]
    );
    const lastActivated = lastActivationResult.length && lastActivationResult[0].values.length
      ? lastActivationResult[0].values[0][0] as string
      : null;

    // Check if already activated today
    const todayActivationResult = db.exec(
      `SELECT 1 FROM combo_activations
       WHERE combo_id = ? AND date(activated_at) = date('now')`,
      [combo.id]
    );
    const activatedToday = todayActivationResult.length && todayActivationResult[0].values.length > 0;

    const progress = requiredIds.length > 0
      ? Math.round((activeBuffIds.length / requiredIds.length) * 100)
      : 0;
    const isReady = activeBuffIds.length === requiredIds.length && !activatedToday;

    return {
      ...combo,
      required_buff_names: requiredBuffNames,
      active_buff_ids: activeBuffIds,
      progress,
      is_ready: isReady,
      last_activated: lastActivated,
    };
  });
}

export function checkReadyCombos(): ComboWithStatus[] {
  return getCombosWithStatus().filter((c) => c.is_ready);
}

export async function activateCombo(comboId: number, buffLogIds: number[]): Promise<ComboActivation | null> {
  const db = getDB();
  const combo = getComboById(comboId);
  if (!combo) return null;

  db.run(
    `INSERT INTO combo_activations (combo_id, buffs_used) VALUES (?, ?)`,
    [comboId, JSON.stringify(buffLogIds)]
  );

  const result = db.exec('SELECT last_insert_rowid()');
  const id = result[0].values[0][0] as number;

  await persist();

  return getActivationById(id);
}

export function getActivationById(id: number): ComboActivation | null {
  const db = getDB();
  const result = db.exec(
    `SELECT id, combo_id, activated_at, buffs_used FROM combo_activations WHERE id = ?`,
    [id]
  );
  if (!result.length || !result[0].values.length) return null;
  const row = result[0].values[0];
  return {
    id: row[0] as number,
    combo_id: row[1] as number,
    activated_at: row[2] as string,
    buffs_used: row[3] as string,
  };
}

export function getRecentActivations(limit: number = 10): ComboActivation[] {
  const db = getDB();
  const result = db.exec(
    `SELECT id, combo_id, activated_at, buffs_used FROM combo_activations ORDER BY activated_at DESC LIMIT ?`,
    [limit]
  );
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    combo_id: row[1] as number,
    activated_at: row[2] as string,
    buffs_used: row[3] as string,
  }));
}

export async function createCombo(
  name: string,
  description: string,
  icon: string,
  requiredBuffIds: number[],
  timeWindowHours: number,
  bonusXp: number
): Promise<number> {
  const db = getDB();
  db.run(
    `INSERT INTO combo_definitions (name, description, icon, required_buffs, time_window_hours, bonus_xp)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, description, icon, JSON.stringify(requiredBuffIds), timeWindowHours, bonusXp]
  );
  const result = db.exec('SELECT last_insert_rowid()');
  await persist();
  return result[0].values[0][0] as number;
}

export async function deleteCombo(comboId: number): Promise<void> {
  const db = getDB();
  db.run(`DELETE FROM combo_definitions WHERE id = ?`, [comboId]);
  await persist();
}

function mapComboRow(row: SqlValue[]): ComboDefinition {
  return {
    id: row[0] as number,
    name: row[1] as string,
    description: row[2] as string,
    icon: row[3] as string,
    required_buffs: row[4] as string,
    time_window_hours: row[5] as number,
    bonus_xp: row[6] as number,
    is_active: Boolean(row[7]),
  };
}
