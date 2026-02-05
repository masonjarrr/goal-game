import { getDB, persist } from '../database';
import { ItemDefinition, InventoryItem, EquippedItem, InventoryItemWithDefinition, EquippedItemWithDefinition } from '../../types/inventory';
import type { SqlValue } from 'sql.js';

export function getItemDefinitions(): ItemDefinition[] {
  const db = getDB();
  const result = db.exec(`
    SELECT id, name, description, icon, type, slot, rarity, stat_effects, special_effect, stack_limit
    FROM item_definitions ORDER BY rarity, name
  `);
  if (!result.length) return [];
  return result[0].values.map(mapItemRow);
}

export function getItemById(id: number): ItemDefinition | null {
  const db = getDB();
  const result = db.exec(`
    SELECT id, name, description, icon, type, slot, rarity, stat_effects, special_effect, stack_limit
    FROM item_definitions WHERE id = ?
  `, [id]);
  if (!result.length || !result[0].values.length) return null;
  return mapItemRow(result[0].values[0]);
}

export function getInventory(): InventoryItemWithDefinition[] {
  const db = getDB();
  const result = db.exec(`
    SELECT i.id, i.item_id, i.quantity, i.acquired_at, i.source,
           d.id, d.name, d.description, d.icon, d.type, d.slot, d.rarity, d.stat_effects, d.special_effect, d.stack_limit
    FROM inventory i
    JOIN item_definitions d ON i.item_id = d.id
    ORDER BY d.type, d.rarity DESC, d.name
  `);
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    item_id: row[1] as number,
    quantity: row[2] as number,
    acquired_at: row[3] as string,
    source: row[4] as string,
    definition: {
      id: row[5] as number,
      name: row[6] as string,
      description: row[7] as string,
      icon: row[8] as string,
      type: row[9] as ItemDefinition['type'],
      slot: row[10] as ItemDefinition['slot'],
      rarity: row[11] as ItemDefinition['rarity'],
      stat_effects: row[12] as string,
      special_effect: row[13] as string,
      stack_limit: row[14] as number,
    },
  }));
}

export function getEquippedItems(): EquippedItemWithDefinition[] {
  const db = getDB();
  const result = db.exec(`
    SELECT e.id, e.slot, e.inventory_id, e.equipped_at,
           i.id, i.item_id, i.quantity, i.acquired_at, i.source,
           d.id, d.name, d.description, d.icon, d.type, d.slot, d.rarity, d.stat_effects, d.special_effect, d.stack_limit
    FROM equipped_items e
    JOIN inventory i ON e.inventory_id = i.id
    JOIN item_definitions d ON i.item_id = d.id
  `);
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    slot: row[1] as string,
    inventory_id: row[2] as number,
    equipped_at: row[3] as string,
    item: {
      id: row[4] as number,
      item_id: row[5] as number,
      quantity: row[6] as number,
      acquired_at: row[7] as string,
      source: row[8] as string,
      definition: {
        id: row[9] as number,
        name: row[10] as string,
        description: row[11] as string,
        icon: row[12] as string,
        type: row[13] as ItemDefinition['type'],
        slot: row[14] as ItemDefinition['slot'],
        rarity: row[15] as ItemDefinition['rarity'],
        stat_effects: row[16] as string,
        special_effect: row[17] as string,
        stack_limit: row[18] as number,
      },
    },
  }));
}

export async function addItem(itemId: number, quantity: number = 1, source: string = 'unknown'): Promise<InventoryItem> {
  const db = getDB();
  const item = getItemById(itemId);
  if (!item) throw new Error('Item not found');

  // Check if stackable and already in inventory
  if (item.stack_limit > 1) {
    const existing = db.exec(`SELECT id, quantity FROM inventory WHERE item_id = ?`, [itemId]);
    if (existing.length && existing[0].values.length) {
      const existingId = existing[0].values[0][0] as number;
      const existingQty = existing[0].values[0][1] as number;
      const newQty = Math.min(existingQty + quantity, item.stack_limit);
      db.run(`UPDATE inventory SET quantity = ? WHERE id = ?`, [newQty, existingId]);
      await persist();
      return { id: existingId, item_id: itemId, quantity: newQty, acquired_at: '', source };
    }
  }

  db.run(`INSERT INTO inventory (item_id, quantity, source) VALUES (?, ?, ?)`, [itemId, quantity, source]);
  const result = db.exec('SELECT last_insert_rowid()');
  await persist();
  return { id: result[0].values[0][0] as number, item_id: itemId, quantity, acquired_at: '', source };
}

export async function removeItem(inventoryId: number, quantity: number = 1): Promise<void> {
  const db = getDB();
  const existing = db.exec(`SELECT quantity FROM inventory WHERE id = ?`, [inventoryId]);
  if (!existing.length || !existing[0].values.length) return;

  const currentQty = existing[0].values[0][0] as number;
  if (currentQty <= quantity) {
    db.run(`DELETE FROM inventory WHERE id = ?`, [inventoryId]);
  } else {
    db.run(`UPDATE inventory SET quantity = quantity - ? WHERE id = ?`, [quantity, inventoryId]);
  }
  await persist();
}

export async function equipItem(inventoryId: number): Promise<void> {
  const db = getDB();
  const inventory = getInventory().find((i) => i.id === inventoryId);
  if (!inventory || !inventory.definition.slot) return;

  // Unequip current item in slot
  db.run(`DELETE FROM equipped_items WHERE slot = ?`, [inventory.definition.slot]);

  // Equip new item
  db.run(`INSERT INTO equipped_items (slot, inventory_id) VALUES (?, ?)`, [inventory.definition.slot, inventoryId]);
  await persist();
}

export async function unequipItem(slot: string): Promise<void> {
  const db = getDB();
  db.run(`DELETE FROM equipped_items WHERE slot = ?`, [slot]);
  await persist();
}

export function getEquippedStatBonuses(): Record<string, number> {
  const equipped = getEquippedItems();
  const bonuses: Record<string, number> = {};

  for (const item of equipped) {
    try {
      const effects = JSON.parse(item.item.definition.stat_effects);
      for (const [stat, value] of Object.entries(effects)) {
        if (typeof value === 'number') {
          bonuses[stat] = (bonuses[stat] || 0) + value;
        }
      }
    } catch { /* ignore parse errors */ }
  }

  return bonuses;
}

function mapItemRow(row: SqlValue[]): ItemDefinition {
  return {
    id: row[0] as number,
    name: row[1] as string,
    description: row[2] as string,
    icon: row[3] as string,
    type: row[4] as ItemDefinition['type'],
    slot: row[5] as ItemDefinition['slot'],
    rarity: row[6] as ItemDefinition['rarity'],
    stat_effects: row[7] as string,
    special_effect: row[8] as string,
    stack_limit: row[9] as number,
  };
}
