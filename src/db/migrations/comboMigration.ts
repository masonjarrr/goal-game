import { getDB, persist } from '../database';
import { SEED_COMBOS, COMBO_BUFF_REQUIREMENTS } from '../../types/combo';

const MIGRATION_KEY = 'combo_migration_v1';

export async function runComboMigration(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Create combo_definitions table
    db.run(`
      CREATE TABLE IF NOT EXISTS combo_definitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        icon TEXT NOT NULL DEFAULT '🎯',
        required_buffs TEXT NOT NULL DEFAULT '[]',
        time_window_hours INTEGER NOT NULL DEFAULT 24,
        bonus_xp INTEGER NOT NULL DEFAULT 25,
        is_active INTEGER NOT NULL DEFAULT 1
      )
    `);

    // Create combo_activations table
    db.run(`
      CREATE TABLE IF NOT EXISTS combo_activations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        combo_id INTEGER NOT NULL,
        activated_at TEXT NOT NULL DEFAULT (datetime('now')),
        buffs_used TEXT NOT NULL DEFAULT '[]',
        FOREIGN KEY (combo_id) REFERENCES combo_definitions(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_combo_activations_combo ON combo_activations(combo_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_combo_activations_date ON combo_activations(activated_at)`);

    // Seed combos with buff references
    for (const combo of SEED_COMBOS) {
      // Look up buff IDs by name
      const buffNames = COMBO_BUFF_REQUIREMENTS[combo.name] || [];
      const buffIds: number[] = [];

      for (const buffName of buffNames) {
        const result = db.exec(
          `SELECT id FROM buff_definitions WHERE name = ? AND type = 'buff' LIMIT 1`,
          [buffName]
        );
        if (result.length && result[0].values.length) {
          buffIds.push(result[0].values[0][0] as number);
        }
      }

      // Only create combo if we found at least 2 buffs
      if (buffIds.length >= 2) {
        db.run(
          `INSERT INTO combo_definitions (name, description, icon, required_buffs, time_window_hours, bonus_xp, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            combo.name,
            combo.description,
            combo.icon,
            JSON.stringify(buffIds),
            combo.time_window_hours,
            combo.bonus_xp,
            combo.is_active ? 1 : 0,
          ]
        );
      }
    }

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Combo migration completed successfully');
  } catch (error) {
    console.error('Failed to run combo migration:', error);
    throw error;
  }
}
