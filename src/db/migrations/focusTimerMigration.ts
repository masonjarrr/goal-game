import { getDB, persist } from '../database';
import { DEFAULT_FOCUS_SETTINGS } from '../../types/focusTimer';

const MIGRATION_KEY = 'focus_timer_migration_v1';

export async function runFocusTimerMigration(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Create focus_sessions table
    db.run(`
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        duration_minutes INTEGER NOT NULL,
        started_at TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        xp_earned INTEGER NOT NULL DEFAULT 0,
        linked_step_id INTEGER,
        linked_quest_id INTEGER,
        break_taken INTEGER NOT NULL DEFAULT 0,
        notes TEXT NOT NULL DEFAULT '',
        FOREIGN KEY (linked_step_id) REFERENCES steps(id) ON DELETE SET NULL,
        FOREIGN KEY (linked_quest_id) REFERENCES quests(id) ON DELETE SET NULL
      )
    `);

    // Create focus_settings table (singleton)
    db.run(`
      CREATE TABLE IF NOT EXISTS focus_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        work_duration INTEGER NOT NULL DEFAULT ${DEFAULT_FOCUS_SETTINGS.work_duration},
        short_break INTEGER NOT NULL DEFAULT ${DEFAULT_FOCUS_SETTINGS.short_break},
        long_break INTEGER NOT NULL DEFAULT ${DEFAULT_FOCUS_SETTINGS.long_break},
        sessions_before_long_break INTEGER NOT NULL DEFAULT ${DEFAULT_FOCUS_SETTINGS.sessions_before_long_break},
        auto_start_breaks INTEGER NOT NULL DEFAULT ${DEFAULT_FOCUS_SETTINGS.auto_start_breaks ? 1 : 0},
        sound_enabled INTEGER NOT NULL DEFAULT ${DEFAULT_FOCUS_SETTINGS.sound_enabled ? 1 : 0}
      )
    `);

    // Initialize focus settings if not exists
    const settingsExist = db.exec('SELECT COUNT(*) FROM focus_settings');
    if (settingsExist[0].values[0][0] === 0) {
      db.run(`
        INSERT INTO focus_settings (id, work_duration, short_break, long_break, sessions_before_long_break, auto_start_breaks, sound_enabled)
        VALUES (1, ?, ?, ?, ?, ?, ?)
      `, [
        DEFAULT_FOCUS_SETTINGS.work_duration,
        DEFAULT_FOCUS_SETTINGS.short_break,
        DEFAULT_FOCUS_SETTINGS.long_break,
        DEFAULT_FOCUS_SETTINGS.sessions_before_long_break,
        DEFAULT_FOCUS_SETTINGS.auto_start_breaks ? 1 : 0,
        DEFAULT_FOCUS_SETTINGS.sound_enabled ? 1 : 0,
      ]);
    }

    // Create focus_stats table (singleton)
    db.run(`
      CREATE TABLE IF NOT EXISTS focus_stats (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        total_sessions INTEGER NOT NULL DEFAULT 0,
        total_minutes INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        current_streak INTEGER NOT NULL DEFAULT 0,
        today_sessions INTEGER NOT NULL DEFAULT 0,
        today_date TEXT NOT NULL DEFAULT (date('now'))
      )
    `);

    // Initialize focus stats if not exists
    const statsExist = db.exec('SELECT COUNT(*) FROM focus_stats');
    if (statsExist[0].values[0][0] === 0) {
      db.run(`INSERT INTO focus_stats (id) VALUES (1)`);
    }

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_focus_sessions_started ON focus_sessions(started_at)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_focus_sessions_status ON focus_sessions(status)`);

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Focus timer migration completed successfully');
  } catch (error) {
    console.error('Failed to run focus timer migration:', error);
    throw error;
  }
}
