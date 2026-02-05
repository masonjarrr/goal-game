import { getDB, persist } from '../database';
import { SEED_ACHIEVEMENTS } from '../../types/achievement';

const MIGRATION_KEY = 'achievement_migration_v1';

export async function runAchievementMigration(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Create achievement_definitions table
    db.run(`
      CREATE TABLE IF NOT EXISTS achievement_definitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        icon TEXT NOT NULL,
        xp_reward INTEGER NOT NULL DEFAULT 0,
        requirement_type TEXT NOT NULL,
        requirement_value INTEGER NOT NULL,
        requirement_source TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_hidden INTEGER NOT NULL DEFAULT 0
      )
    `);

    // Create achievement_unlocks table
    db.run(`
      CREATE TABLE IF NOT EXISTS achievement_unlocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        definition_id INTEGER NOT NULL UNIQUE,
        unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (definition_id) REFERENCES achievement_definitions(id) ON DELETE CASCADE
      )
    `);

    // Create achievement_progress table
    db.run(`
      CREATE TABLE IF NOT EXISTS achievement_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        definition_id INTEGER NOT NULL UNIQUE,
        current_value INTEGER NOT NULL DEFAULT 0,
        last_updated TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (definition_id) REFERENCES achievement_definitions(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_achievement_unlocks_def ON achievement_unlocks(definition_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_achievement_progress_def ON achievement_progress(definition_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_achievement_defs_category ON achievement_definitions(category)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_achievement_defs_source ON achievement_definitions(requirement_source)`);

    // Seed achievements
    for (const achievement of SEED_ACHIEVEMENTS) {
      db.run(
        `INSERT OR IGNORE INTO achievement_definitions
         (key, name, description, category, icon, xp_reward, requirement_type, requirement_value, requirement_source, sort_order, is_hidden)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          achievement.key,
          achievement.name,
          achievement.description,
          achievement.category,
          achievement.icon,
          achievement.xp_reward,
          achievement.requirement_type,
          achievement.requirement_value,
          achievement.requirement_source,
          achievement.sort_order,
          achievement.is_hidden ? 1 : 0,
        ]
      );
    }

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Achievement migration completed successfully');
  } catch (error) {
    console.error('Failed to run achievement migration:', error);
    throw error;
  }
}
