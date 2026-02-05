import { getDB, persist } from '../database';

const MIGRATION_KEY = 'streak_migration_v1';

export async function runStreakMigration(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Create streak_shields table - inventory of streak protection items
    db.run(`
      CREATE TABLE IF NOT EXISTS streak_shields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quantity INTEGER NOT NULL DEFAULT 0,
        earned_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Initialize with 3 free shields for new users
    const existing = db.exec('SELECT COUNT(*) FROM streak_shields');
    if (existing[0].values[0][0] === 0) {
      db.run(`INSERT INTO streak_shields (quantity) VALUES (3)`);
    }

    // Create streak_freezes table - planned skip days
    db.run(`
      CREATE TABLE IF NOT EXISTS streak_freezes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buff_definition_id INTEGER NOT NULL,
        freeze_date TEXT NOT NULL,
        reason TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (buff_definition_id) REFERENCES buff_definitions(id) ON DELETE CASCADE,
        UNIQUE(buff_definition_id, freeze_date)
      )
    `);

    // Create streak_records table - track longest streaks
    db.run(`
      CREATE TABLE IF NOT EXISTS streak_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buff_definition_id INTEGER NOT NULL UNIQUE,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        last_milestone_claimed INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (buff_definition_id) REFERENCES buff_definitions(id) ON DELETE CASCADE
      )
    `);

    // Create streak_shield_uses table - track when shields were used
    db.run(`
      CREATE TABLE IF NOT EXISTS streak_shield_uses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buff_definition_id INTEGER NOT NULL,
        used_date TEXT NOT NULL,
        streak_saved INTEGER NOT NULL,
        used_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (buff_definition_id) REFERENCES buff_definitions(id) ON DELETE CASCADE
      )
    `);

    // Create index for faster lookups
    db.run(`CREATE INDEX IF NOT EXISTS idx_streak_freezes_date ON streak_freezes(freeze_date)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_streak_freezes_buff ON streak_freezes(buff_definition_id)`);

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Streak migration completed successfully');
  } catch (error) {
    console.error('Failed to run streak migration:', error);
    throw error;
  }
}
