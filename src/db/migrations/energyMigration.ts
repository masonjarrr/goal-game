import { getDB, persist } from '../database';
import { ENERGY_MAX_DEFAULT, DEFAULT_ENERGY_COSTS } from '../../types/energy';

const MIGRATION_KEY = 'energy_migration_v1';

export async function runEnergyMigration(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Create energy_state table (singleton)
    db.run(`
      CREATE TABLE IF NOT EXISTS energy_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        current_energy INTEGER NOT NULL DEFAULT ${ENERGY_MAX_DEFAULT},
        max_energy INTEGER NOT NULL DEFAULT ${ENERGY_MAX_DEFAULT},
        last_regen_at TEXT NOT NULL DEFAULT (datetime('now')),
        bonus_energy INTEGER NOT NULL DEFAULT 0
      )
    `);

    // Initialize energy state if not exists
    const existing = db.exec('SELECT COUNT(*) FROM energy_state');
    if (existing[0].values[0][0] === 0) {
      db.run(`INSERT INTO energy_state (id, current_energy, max_energy) VALUES (1, ${ENERGY_MAX_DEFAULT}, ${ENERGY_MAX_DEFAULT})`);
    }

    // Create energy_log table
    db.run(`
      CREATE TABLE IF NOT EXISTS energy_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_id INTEGER,
        energy_before INTEGER NOT NULL,
        energy_after INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Create energy_costs table
    db.run(`
      CREATE TABLE IF NOT EXISTS energy_costs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_type TEXT NOT NULL UNIQUE,
        base_cost INTEGER NOT NULL,
        description TEXT NOT NULL DEFAULT ''
      )
    `);

    // Seed default costs
    for (const [actionType, cost] of Object.entries(DEFAULT_ENERGY_COSTS)) {
      db.run(
        `INSERT OR IGNORE INTO energy_costs (action_type, base_cost, description)
         VALUES (?, ?, ?)`,
        [actionType, cost, `Cost for ${actionType.replace(/_/g, ' ')}`]
      );
    }

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_energy_log_created ON energy_log(created_at)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_energy_log_source ON energy_log(source_type)`);

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Energy migration completed successfully');
  } catch (error) {
    console.error('Failed to run energy migration:', error);
    throw error;
  }
}
