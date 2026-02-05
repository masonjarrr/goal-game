import { getDB, persist } from '../database';
import { SEED_EVENT_TEMPLATES } from '../../types/randomEvent';

const MIGRATION_KEY = 'random_event_migration_v1';

export async function runRandomEventMigration(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Create event_templates table
    db.run(`
      CREATE TABLE IF NOT EXISTS event_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT NOT NULL,
        duration_hours INTEGER NOT NULL DEFAULT 0,
        effect_type TEXT NOT NULL,
        effect_value TEXT NOT NULL DEFAULT '{}',
        rarity TEXT NOT NULL DEFAULT 'common',
        weight INTEGER NOT NULL DEFAULT 10
      )
    `);

    // Create active_events table
    db.run(`
      CREATE TABLE IF NOT EXISTS active_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL,
        started_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL,
        is_claimed INTEGER NOT NULL DEFAULT 0,
        claimed_at TEXT,
        FOREIGN KEY (template_id) REFERENCES event_templates(id) ON DELETE CASCADE
      )
    `);

    // Create event_history table
    db.run(`
      CREATE TABLE IF NOT EXISTS event_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL,
        event_name TEXT NOT NULL,
        started_at TEXT NOT NULL DEFAULT (datetime('now')),
        result TEXT NOT NULL DEFAULT '',
        xp_earned INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (template_id) REFERENCES event_templates(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_active_events_expires ON active_events(expires_at)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_event_history_started ON event_history(started_at)`);

    // Seed event templates
    for (const template of SEED_EVENT_TEMPLATES) {
      db.run(
        `INSERT INTO event_templates (name, description, type, icon, duration_hours, effect_type, effect_value, rarity, weight)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          template.name,
          template.description,
          template.type,
          template.icon,
          template.duration_hours,
          template.effect_type,
          template.effect_value,
          template.rarity,
          template.weight,
        ]
      );
    }

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Random event migration completed successfully');
  } catch (error) {
    console.error('Failed to run random event migration:', error);
    throw error;
  }
}
