import { getDB, persist } from '../database';
import { EnergyState, EnergyLog, EnergyCost, ENERGY_REGEN_RATE, ENERGY_MAX_DEFAULT } from '../../types/energy';
import type { SqlValue } from 'sql.js';

export function getEnergyState(): EnergyState {
  const db = getDB();
  const result = db.exec('SELECT id, current_energy, max_energy, last_regen_at, bonus_energy FROM energy_state WHERE id = 1');
  if (!result.length || !result[0].values.length) {
    // Return default if not initialized
    return {
      id: 1,
      current_energy: ENERGY_MAX_DEFAULT,
      max_energy: ENERGY_MAX_DEFAULT,
      last_regen_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      bonus_energy: 0,
    };
  }
  const row = result[0].values[0];
  return {
    id: row[0] as number,
    current_energy: row[1] as number,
    max_energy: row[2] as number,
    last_regen_at: row[3] as string,
    bonus_energy: row[4] as number,
  };
}

export async function updateEnergy(amount: number, reason: string, sourceType: string, sourceId: number | null = null): Promise<EnergyState> {
  const db = getDB();
  const state = getEnergyState();
  const energyBefore = state.current_energy;

  // Calculate new energy (capped at max + bonus)
  const maxTotal = state.max_energy + state.bonus_energy;
  const newEnergy = Math.max(0, Math.min(maxTotal, state.current_energy + amount));

  // Update state
  db.run(
    `UPDATE energy_state SET current_energy = ?, last_regen_at = datetime('now') WHERE id = 1`,
    [newEnergy]
  );

  // Log the change
  db.run(
    `INSERT INTO energy_log (amount, reason, source_type, source_id, energy_before, energy_after)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [amount, reason, sourceType, sourceId, energyBefore, newEnergy]
  );

  await persist();

  return {
    ...state,
    current_energy: newEnergy,
    last_regen_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
}

export async function spendEnergy(actionType: string, sourceId: number | null = null): Promise<{ success: boolean; newState: EnergyState; cost: number }> {
  const cost = getActionCost(actionType);
  const state = getEnergyState();

  if (state.current_energy < cost) {
    return { success: false, newState: state, cost };
  }

  const newState = await updateEnergy(-cost, `Spent on ${actionType.replace(/_/g, ' ')}`, actionType, sourceId);
  return { success: true, newState, cost };
}

export function canAfford(actionType: string): boolean {
  const cost = getActionCost(actionType);
  const state = getEnergyState();
  return state.current_energy >= cost;
}

export function getActionCost(actionType: string): number {
  const db = getDB();
  const result = db.exec('SELECT base_cost FROM energy_costs WHERE action_type = ?', [actionType]);
  if (!result.length || !result[0].values.length) return 0;
  return result[0].values[0][0] as number;
}

export function getAllCosts(): EnergyCost[] {
  const db = getDB();
  const result = db.exec('SELECT id, action_type, base_cost, description FROM energy_costs ORDER BY action_type');
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    action_type: row[1] as string,
    base_cost: row[2] as number,
    description: row[3] as string,
  }));
}

export async function regenerateEnergy(): Promise<{ regenerated: number; newState: EnergyState }> {
  const db = getDB();
  const state = getEnergyState();
  const maxTotal = state.max_energy + state.bonus_energy;

  // Already at max
  if (state.current_energy >= maxTotal) {
    // Just update the regen timestamp
    db.run(`UPDATE energy_state SET last_regen_at = datetime('now') WHERE id = 1`);
    await persist();
    return { regenerated: 0, newState: state };
  }

  // Calculate time since last regen
  const lastRegen = new Date(state.last_regen_at + 'Z');
  const now = new Date();
  const hoursSinceRegen = (now.getTime() - lastRegen.getTime()) / (1000 * 60 * 60);

  // Calculate energy to regenerate
  const regenAmount = Math.floor(hoursSinceRegen * ENERGY_REGEN_RATE);
  if (regenAmount <= 0) {
    return { regenerated: 0, newState: state };
  }

  const newEnergy = Math.min(maxTotal, state.current_energy + regenAmount);
  const actualRegen = newEnergy - state.current_energy;

  if (actualRegen > 0) {
    const newState = await updateEnergy(actualRegen, 'Natural regeneration', 'regen');
    return { regenerated: actualRegen, newState };
  }

  return { regenerated: 0, newState: state };
}

export async function addBonusEnergy(amount: number): Promise<EnergyState> {
  const db = getDB();
  db.run(
    `UPDATE energy_state SET bonus_energy = bonus_energy + ? WHERE id = 1`,
    [amount]
  );
  await persist();
  return getEnergyState();
}

export async function setMaxEnergy(newMax: number): Promise<EnergyState> {
  const db = getDB();
  db.run(
    `UPDATE energy_state SET max_energy = ? WHERE id = 1`,
    [newMax]
  );
  await persist();
  return getEnergyState();
}

export function getEnergyLog(limit: number = 20): EnergyLog[] {
  const db = getDB();
  const result = db.exec(
    `SELECT id, amount, reason, source_type, source_id, energy_before, energy_after, created_at
     FROM energy_log ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    amount: row[1] as number,
    reason: row[2] as string,
    source_type: row[3] as string,
    source_id: row[4] as number | null,
    energy_before: row[5] as number,
    energy_after: row[6] as number,
    created_at: row[7] as string,
  }));
}

export async function restoreFullEnergy(): Promise<EnergyState> {
  const state = getEnergyState();
  const maxTotal = state.max_energy + state.bonus_energy;
  const toRestore = maxTotal - state.current_energy;
  if (toRestore > 0) {
    return await updateEnergy(toRestore, 'Full energy restore', 'restore');
  }
  return state;
}
