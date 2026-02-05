import { getDB, persist } from '../database';
import { CharacterClass, CharacterClassSelection, CharacterClassWithSelection } from '../../types/characterClass';
import type { SqlValue } from 'sql.js';

export function getCharacterClasses(): CharacterClass[] {
  const db = getDB();
  const result = db.exec(`
    SELECT id, key, name, description, icon, primary_stat, stat_bonuses, xp_bonus_type, xp_bonus_percent, special_ability, special_ability_desc
    FROM character_classes ORDER BY name
  `);
  if (!result.length) return [];
  return result[0].values.map(mapClassRow);
}

export function getClassById(id: number): CharacterClass | null {
  const db = getDB();
  const result = db.exec(`
    SELECT id, key, name, description, icon, primary_stat, stat_bonuses, xp_bonus_type, xp_bonus_percent, special_ability, special_ability_desc
    FROM character_classes WHERE id = ?
  `, [id]);
  if (!result.length || !result[0].values.length) return null;
  return mapClassRow(result[0].values[0]);
}

export function getClassByKey(key: string): CharacterClass | null {
  const db = getDB();
  const result = db.exec(`
    SELECT id, key, name, description, icon, primary_stat, stat_bonuses, xp_bonus_type, xp_bonus_percent, special_ability, special_ability_desc
    FROM character_classes WHERE key = ?
  `, [key]);
  if (!result.length || !result[0].values.length) return null;
  return mapClassRow(result[0].values[0]);
}

export function getClassSelection(): CharacterClassSelection | null {
  const db = getDB();
  const result = db.exec(`
    SELECT id, class_id, selected_at, last_changed_at, changes_remaining
    FROM character_class_selection WHERE id = 1
  `);
  if (!result.length || !result[0].values.length) return null;
  const row = result[0].values[0];
  return {
    id: row[0] as number,
    class_id: row[1] as number,
    selected_at: row[2] as string,
    last_changed_at: row[3] as string,
    changes_remaining: row[4] as number,
  };
}

export function getSelectedClass(): CharacterClass | null {
  const selection = getClassSelection();
  if (!selection || !selection.class_id) return null;
  return getClassById(selection.class_id);
}

export function getClassesWithSelection(): CharacterClassWithSelection[] {
  const classes = getCharacterClasses();
  const selection = getClassSelection();
  return classes.map((cls) => ({
    ...cls,
    is_selected: selection?.class_id === cls.id,
  }));
}

export async function selectClass(classId: number): Promise<boolean> {
  const db = getDB();
  const selection = getClassSelection();

  // Check if can change (first selection is free, subsequent require changes_remaining)
  if (selection?.class_id && selection.changes_remaining <= 0) {
    return false;
  }

  const changesRemaining = selection?.class_id
    ? selection.changes_remaining - 1
    : selection?.changes_remaining || 3;

  db.run(
    `UPDATE character_class_selection SET class_id = ?, selected_at = COALESCE(selected_at, datetime('now')), last_changed_at = datetime('now'), changes_remaining = ? WHERE id = 1`,
    [classId, changesRemaining]
  );

  await persist();
  return true;
}

export function getClassStatBonuses(): Record<string, number> {
  const selectedClass = getSelectedClass();
  if (!selectedClass) return {};

  try {
    return JSON.parse(selectedClass.stat_bonuses);
  } catch {
    return {};
  }
}

export function getClassXpBonus(xpType: string): number {
  const selectedClass = getSelectedClass();
  if (!selectedClass) return 0;
  if (selectedClass.xp_bonus_type === xpType) {
    return selectedClass.xp_bonus_percent;
  }
  return 0;
}

function mapClassRow(row: SqlValue[]): CharacterClass {
  return {
    id: row[0] as number,
    key: row[1] as string,
    name: row[2] as string,
    description: row[3] as string,
    icon: row[4] as string,
    primary_stat: row[5] as string,
    stat_bonuses: row[6] as string,
    xp_bonus_type: row[7] as string,
    xp_bonus_percent: row[8] as number,
    special_ability: row[9] as string,
    special_ability_desc: row[10] as string,
  };
}
