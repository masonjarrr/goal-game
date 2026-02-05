import { getDB, persist } from '../database';
import { SEED_CHARACTER_CLASSES, CLASS_CHANGE_LIMIT } from '../../types/characterClass';

const MIGRATION_KEY = 'character_class_migration_v1';

export async function runCharacterClassMigration(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Create character_classes table
    db.run(`
      CREATE TABLE IF NOT EXISTS character_classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        primary_stat TEXT NOT NULL,
        stat_bonuses TEXT NOT NULL DEFAULT '{}',
        xp_bonus_type TEXT NOT NULL,
        xp_bonus_percent INTEGER NOT NULL DEFAULT 0,
        special_ability TEXT NOT NULL,
        special_ability_desc TEXT NOT NULL
      )
    `);

    // Create character_class_selection table (singleton)
    db.run(`
      CREATE TABLE IF NOT EXISTS character_class_selection (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        class_id INTEGER,
        selected_at TEXT,
        last_changed_at TEXT,
        changes_remaining INTEGER NOT NULL DEFAULT ${CLASS_CHANGE_LIMIT},
        FOREIGN KEY (class_id) REFERENCES character_classes(id) ON DELETE SET NULL
      )
    `);

    // Initialize selection if not exists
    const existing = db.exec('SELECT COUNT(*) FROM character_class_selection');
    if (existing[0].values[0][0] === 0) {
      db.run(`INSERT INTO character_class_selection (id, changes_remaining) VALUES (1, ${CLASS_CHANGE_LIMIT})`);
    }

    // Seed classes
    for (const cls of SEED_CHARACTER_CLASSES) {
      db.run(
        `INSERT INTO character_classes (key, name, description, icon, primary_stat, stat_bonuses, xp_bonus_type, xp_bonus_percent, special_ability, special_ability_desc)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cls.key,
          cls.name,
          cls.description,
          cls.icon,
          cls.primary_stat,
          cls.stat_bonuses,
          cls.xp_bonus_type,
          cls.xp_bonus_percent,
          cls.special_ability,
          cls.special_ability_desc,
        ]
      );
    }

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Character class migration completed successfully');
  } catch (error) {
    console.error('Failed to run character class migration:', error);
    throw error;
  }
}
