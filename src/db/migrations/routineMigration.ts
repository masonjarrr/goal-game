import { getDB, persist } from '../database';

const MIGRATION_KEY = 'routine_migration_v1';

export async function runRoutineMigration(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Create routine_definitions table
    db.run(`
      CREATE TABLE IF NOT EXISTS routine_definitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'custom',
        description TEXT NOT NULL DEFAULT '',
        bonus_xp INTEGER NOT NULL DEFAULT 25,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Create routine_steps table
    db.run(`
      CREATE TABLE IF NOT EXISTS routine_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        routine_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        linked_buff_id INTEGER,
        sort_order INTEGER NOT NULL DEFAULT 0,
        duration_minutes INTEGER NOT NULL DEFAULT 5,
        is_optional INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (routine_id) REFERENCES routine_definitions(id) ON DELETE CASCADE,
        FOREIGN KEY (linked_buff_id) REFERENCES buff_definitions(id) ON DELETE SET NULL
      )
    `);

    // Create routine_logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS routine_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        routine_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        is_completed INTEGER NOT NULL DEFAULT 0,
        steps_completed INTEGER NOT NULL DEFAULT 0,
        total_steps INTEGER NOT NULL DEFAULT 0,
        xp_earned INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (routine_id) REFERENCES routine_definitions(id) ON DELETE CASCADE,
        UNIQUE(routine_id, date)
      )
    `);

    // Create routine_step_logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS routine_step_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        routine_log_id INTEGER NOT NULL,
        step_id INTEGER NOT NULL,
        completed_at TEXT,
        is_completed INTEGER NOT NULL DEFAULT 0,
        skipped INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (routine_log_id) REFERENCES routine_logs(id) ON DELETE CASCADE,
        FOREIGN KEY (step_id) REFERENCES routine_steps(id) ON DELETE CASCADE
      )
    `);

    // Create routine_streaks table
    db.run(`
      CREATE TABLE IF NOT EXISTS routine_streaks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        routine_id INTEGER NOT NULL UNIQUE,
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        last_completed_date TEXT,
        FOREIGN KEY (routine_id) REFERENCES routine_definitions(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_routine_steps_routine ON routine_steps(routine_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_routine_logs_date ON routine_logs(date)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_routine_logs_routine ON routine_logs(routine_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_routine_step_logs_log ON routine_step_logs(routine_log_id)`);

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Routine migration completed successfully');
  } catch (error) {
    console.error('Failed to run routine migration:', error);
    throw error;
  }
}
