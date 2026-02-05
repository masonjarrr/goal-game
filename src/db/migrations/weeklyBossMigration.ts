import { getDB, persist } from '../database';

const MIGRATION_KEY = 'weekly_boss_migration_v1';

export async function runWeeklyBossMigration(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Create weekly_boss table
    db.run(`
      CREATE TABLE IF NOT EXISTS weekly_boss (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_start TEXT NOT NULL UNIQUE,
        boss_type TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        max_hp INTEGER NOT NULL,
        current_hp INTEGER NOT NULL,
        is_defeated INTEGER NOT NULL DEFAULT 0,
        defeated_at TEXT,
        xp_reward INTEGER NOT NULL,
        bonus_shields INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Create boss_damage_log table to track damage dealt
    db.run(`
      CREATE TABLE IF NOT EXISTS boss_damage_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        boss_id INTEGER NOT NULL,
        damage_type TEXT NOT NULL,
        damage_amount INTEGER NOT NULL,
        source_description TEXT,
        dealt_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (boss_id) REFERENCES weekly_boss(id) ON DELETE CASCADE
      )
    `);

    // Create index for faster lookups
    db.run(`CREATE INDEX IF NOT EXISTS idx_weekly_boss_week ON weekly_boss(week_start)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_boss_damage_log_boss ON boss_damage_log(boss_id)`);

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Weekly boss migration completed successfully');
  } catch (error) {
    console.error('Failed to run weekly boss migration:', error);
    throw error;
  }
}
