import { getDB, persist } from '../database';

const MIGRATION_KEY = 'notifications_migration_v1';

export async function runNotificationsMigration(): Promise<void> {
  // Check if migration already ran
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Check if reminder_minutes column exists in planner_events
    const tableInfo = db.exec("PRAGMA table_info(planner_events)");
    const columns = tableInfo[0]?.values.map((row) => row[1]) || [];

    if (!columns.includes('reminder_minutes')) {
      // Add reminder_minutes column to planner_events
      db.run('ALTER TABLE planner_events ADD COLUMN reminder_minutes INTEGER DEFAULT NULL');
    }

    // Create notification_settings table for local preferences
    db.run(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        enabled INTEGER NOT NULL DEFAULT 0,
        default_reminder_minutes INTEGER NOT NULL DEFAULT 15,
        fcm_token TEXT,
        device_id TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Notifications migration completed successfully');
  } catch (error) {
    console.error('Failed to run notifications migration:', error);
    throw error;
  }
}
