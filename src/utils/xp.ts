import { getDB, persist } from '../db/database';
import { getLevelFromXP, getTitleForLevel } from './constants';

export interface XPAwardResult {
  amount: number;
  newTotal: number;
  leveledUp: boolean;
  newLevel: number;
  newTitle: string;
}

export async function awardXP(
  amount: number,
  reason: string,
  sourceType: string,
  sourceId: number | null = null
): Promise<XPAwardResult> {
  const db = getDB();

  // Get current state
  const charResult = db.exec('SELECT total_xp, level FROM character WHERE id = 1');
  const oldXP = charResult[0].values[0][0] as number;
  const oldLevel = charResult[0].values[0][1] as number;

  const newTotal = oldXP + amount;
  const newLevel = getLevelFromXP(newTotal);
  const newTitle = getTitleForLevel(newLevel);
  const leveledUp = newLevel > oldLevel;

  // Update character
  db.run(
    'UPDATE character SET total_xp = ?, level = ?, title = ? WHERE id = 1',
    [newTotal, newLevel, newTitle]
  );

  // Log XP
  db.run(
    'INSERT INTO xp_log (amount, reason, source_type, source_id) VALUES (?, ?, ?, ?)',
    [amount, reason, sourceType, sourceId]
  );

  await persist();

  return { amount, newTotal, leveledUp, newLevel, newTitle };
}
