import { getDB, persist } from '../database';
import { SEED_TERRITORIES } from '../../types/territory';

const MIGRATION_KEY = 'territory_migration_v1';

export async function runTerritoryMigration(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Create territories table
    db.run(`
      CREATE TABLE IF NOT EXISTS territories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        unlock_level INTEGER NOT NULL DEFAULT 1,
        background_color TEXT NOT NULL DEFAULT '#333333',
        position_x INTEGER NOT NULL DEFAULT 50,
        position_y INTEGER NOT NULL DEFAULT 50,
        connected_to TEXT NOT NULL DEFAULT '[]',
        challenges TEXT NOT NULL DEFAULT '[]',
        rewards TEXT NOT NULL DEFAULT '{}'
      )
    `);

    // Create territory_progress table
    db.run(`
      CREATE TABLE IF NOT EXISTS territory_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        territory_id INTEGER NOT NULL UNIQUE,
        discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at TEXT,
        challenges_completed TEXT NOT NULL DEFAULT '[]',
        is_current INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_territory_progress_territory ON territory_progress(territory_id)`);

    // Seed territories
    for (const territory of SEED_TERRITORIES) {
      db.run(
        `INSERT INTO territories (name, description, icon, unlock_level, background_color, position_x, position_y, connected_to, challenges, rewards)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          territory.name,
          territory.description,
          territory.icon,
          territory.unlock_level,
          territory.background_color,
          territory.position_x,
          territory.position_y,
          territory.connected_to,
          territory.challenges,
          territory.rewards,
        ]
      );
    }

    // Auto-discover first territory
    db.run(`INSERT INTO territory_progress (territory_id, is_current) VALUES (1, 1)`);

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Territory migration completed successfully');
  } catch (error) {
    console.error('Failed to run territory migration:', error);
    throw error;
  }
}
