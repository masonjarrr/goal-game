import { getDB, persist } from '../database';
import { SEED_ITEMS } from '../../types/inventory';

const MIGRATION_KEY = 'inventory_migration_v1';

export async function runInventoryMigration(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Create item_definitions table
    db.run(`
      CREATE TABLE IF NOT EXISTS item_definitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        type TEXT NOT NULL,
        slot TEXT,
        rarity TEXT NOT NULL DEFAULT 'common',
        stat_effects TEXT NOT NULL DEFAULT '{}',
        special_effect TEXT NOT NULL DEFAULT '',
        stack_limit INTEGER NOT NULL DEFAULT 1
      )
    `);

    // Create inventory table
    db.run(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        acquired_at TEXT NOT NULL DEFAULT (datetime('now')),
        source TEXT NOT NULL DEFAULT 'unknown',
        FOREIGN KEY (item_id) REFERENCES item_definitions(id) ON DELETE CASCADE
      )
    `);

    // Create equipped_items table
    db.run(`
      CREATE TABLE IF NOT EXISTS equipped_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slot TEXT NOT NULL UNIQUE,
        inventory_id INTEGER NOT NULL,
        equipped_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_inventory_item ON inventory(item_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_equipped_items_slot ON equipped_items(slot)`);

    // Seed items
    for (const item of SEED_ITEMS) {
      db.run(
        `INSERT INTO item_definitions (name, description, icon, type, slot, rarity, stat_effects, special_effect, stack_limit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.name,
          item.description,
          item.icon,
          item.type,
          item.slot,
          item.rarity,
          item.stat_effects,
          item.special_effect,
          item.stack_limit,
        ]
      );
    }

    // Give starter items
    db.run(`INSERT INTO inventory (item_id, source) VALUES (1, 'starter')`); // Wooden Sword
    db.run(`INSERT INTO inventory (item_id, source) VALUES (5, 'starter')`); // Leather Vest
    db.run(`INSERT INTO inventory (item_id, quantity, source) VALUES (12, 3, 'starter')`); // 3x Energy Potion

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Inventory migration completed successfully');
  } catch (error) {
    console.error('Failed to run inventory migration:', error);
    throw error;
  }
}
