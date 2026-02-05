import { getDB, persist } from '../database';

const MIGRATION_KEY = 'miss_step_migration_v1';

export async function runMissStepMigration(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Add missed_at column to steps table
    const columns = db.exec("PRAGMA table_info(steps)");
    const hasColumn = columns.length > 0 &&
      columns[0].values.some((row) => row[1] === 'missed_at');

    if (!hasColumn) {
      db.run('ALTER TABLE steps ADD COLUMN missed_at TEXT');
    }

    // Create missed_steps_log table to track daily misses for debuff logic
    db.run(`
      CREATE TABLE IF NOT EXISTS missed_steps_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        step_id INTEGER NOT NULL,
        missed_date TEXT NOT NULL,
        xp_penalty INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (step_id) REFERENCES steps(id)
      )
    `);

    // Create index for efficient daily lookups
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_missed_steps_date
      ON missed_steps_log(missed_date)
    `);

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Miss step migration completed');
  } catch (error) {
    console.error('Failed to run miss step migration:', error);
    throw error;
  }
}
