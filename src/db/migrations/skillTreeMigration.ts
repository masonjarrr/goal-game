import { getDB, persist } from '../database';
import { SEED_SKILL_BRANCHES, SEED_SKILL_NODES } from '../../types/skillTree';

const MIGRATION_KEY = 'skill_tree_migration_v1';

export async function runSkillTreeMigration(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Create skill_branches table
    db.run(`
      CREATE TABLE IF NOT EXISTS skill_branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      )
    `);

    // Create skill_nodes table
    db.run(`
      CREATE TABLE IF NOT EXISTS skill_nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        branch_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        tier INTEGER NOT NULL DEFAULT 1,
        position INTEGER NOT NULL DEFAULT 0,
        xp_cost INTEGER NOT NULL DEFAULT 100,
        prerequisite_node_id INTEGER,
        effect_type TEXT NOT NULL,
        effect_value TEXT NOT NULL DEFAULT '{}',
        is_capstone INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (branch_id) REFERENCES skill_branches(id) ON DELETE CASCADE,
        FOREIGN KEY (prerequisite_node_id) REFERENCES skill_nodes(id) ON DELETE SET NULL
      )
    `);

    // Create unlocked_skills table
    db.run(`
      CREATE TABLE IF NOT EXISTS unlocked_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        node_id INTEGER NOT NULL UNIQUE,
        unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (node_id) REFERENCES skill_nodes(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_skill_nodes_branch ON skill_nodes(branch_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_unlocked_skills_node ON unlocked_skills(node_id)`);

    // Seed branches
    for (const branch of SEED_SKILL_BRANCHES) {
      db.run(
        `INSERT INTO skill_branches (name, description, icon, color, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [branch.name, branch.description, branch.icon, branch.color, branch.sort_order]
      );
    }

    // Seed nodes (need to map branch_id and prerequisite correctly)
    for (const node of SEED_SKILL_NODES) {
      db.run(
        `INSERT INTO skill_nodes (branch_id, name, description, icon, tier, position, xp_cost, prerequisite_node_id, effect_type, effect_value, is_capstone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          node.branch_id,
          node.name,
          node.description,
          node.icon,
          node.tier,
          node.position,
          node.xp_cost,
          node.prerequisite_node_id,
          node.effect_type,
          node.effect_value,
          node.is_capstone ? 1 : 0,
        ]
      );
    }

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Skill tree migration completed successfully');
  } catch (error) {
    console.error('Failed to run skill tree migration:', error);
    throw error;
  }
}
