import { getDB, persist } from '../database';

const MIGRATION_KEY = 'daily_quests_migration_v1';

export async function runDailyQuestsMigration(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Create daily_quests table
    db.run(`
      CREATE TABLE IF NOT EXISTS daily_quests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        quest_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        target_value INTEGER NOT NULL DEFAULT 1,
        current_value INTEGER NOT NULL DEFAULT 0,
        xp_reward INTEGER NOT NULL DEFAULT 25,
        is_completed INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT
      )
    `);

    // Create daily_quest_bonus table to track if bonus was claimed
    db.run(`
      CREATE TABLE IF NOT EXISTS daily_quest_bonus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        claimed_at TEXT NOT NULL
      )
    `);

    // Create index for faster date lookups
    db.run(`CREATE INDEX IF NOT EXISTS idx_daily_quests_date ON daily_quests(date)`);

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Daily quests migration completed successfully');
  } catch (error) {
    console.error('Failed to run daily quests migration:', error);
    throw error;
  }
}
