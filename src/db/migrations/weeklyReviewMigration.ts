import { getDB, persist } from '../database';

const MIGRATION_KEY = 'weekly_review_migration_v1';

export async function runWeeklyReviewMigration(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Create weekly_reviews table
    db.run(`
      CREATE TABLE IF NOT EXISTS weekly_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_start TEXT NOT NULL UNIQUE,
        generated_at TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at TEXT,
        is_completed INTEGER NOT NULL DEFAULT 0,
        summary_data TEXT NOT NULL DEFAULT '{}',
        wins TEXT NOT NULL DEFAULT '',
        challenges TEXT NOT NULL DEFAULT '',
        priorities TEXT NOT NULL DEFAULT '[]',
        notes TEXT NOT NULL DEFAULT '',
        xp_earned INTEGER NOT NULL DEFAULT 0
      )
    `);

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_weekly_reviews_week ON weekly_reviews(week_start)`);

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Weekly review migration completed successfully');
  } catch (error) {
    console.error('Failed to run weekly review migration:', error);
    throw error;
  }
}
