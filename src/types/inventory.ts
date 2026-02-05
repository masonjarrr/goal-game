export type ItemType = 'equipment' | 'consumable' | 'material' | 'trophy';
export type ItemSlot = 'weapon' | 'armor' | 'accessory' | null;
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ItemDefinition {
  id: number;
  name: string;
  description: string;
  icon: string;
  type: ItemType;
  slot: ItemSlot;
  rarity: ItemRarity;
  stat_effects: string; // JSON
  special_effect: string;
  stack_limit: number;
}

export interface InventoryItem {
  id: number;
  item_id: number;
  quantity: number;
  acquired_at: string;
  source: string;
}

export interface EquippedItem {
  id: number;
  slot: string;
  inventory_id: number;
  equipped_at: string;
}

export interface InventoryItemWithDefinition extends InventoryItem {
  definition: ItemDefinition;
}

export interface EquippedItemWithDefinition extends EquippedItem {
  item: InventoryItemWithDefinition;
}

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f97316',
};

export const SEED_ITEMS: Omit<ItemDefinition, 'id'>[] = [
  // Weapons
  { name: 'Wooden Sword', description: 'A basic training sword', icon: '🗡️', type: 'equipment', slot: 'weapon', rarity: 'common', stat_effects: '{"stamina": 1}', special_effect: '', stack_limit: 1 },
  { name: 'Iron Blade', description: 'A sturdy iron sword', icon: '⚔️', type: 'equipment', slot: 'weapon', rarity: 'uncommon', stat_effects: '{"stamina": 2, "willpower": 1}', special_effect: '', stack_limit: 1 },
  { name: 'Focus Staff', description: 'A staff that enhances concentration', icon: '🪄', type: 'equipment', slot: 'weapon', rarity: 'rare', stat_effects: '{"focus": 3, "willpower": 2}', special_effect: '+5% focus session XP', stack_limit: 1 },
  { name: 'Dragon Slayer', description: 'Legendary weapon forged from dragon scales', icon: '🐉', type: 'equipment', slot: 'weapon', rarity: 'legendary', stat_effects: '{"stamina": 5, "willpower": 3, "health": 2}', special_effect: '+25% boss damage', stack_limit: 1 },

  // Armor
  { name: 'Leather Vest', description: 'Basic protection', icon: '🥋', type: 'equipment', slot: 'armor', rarity: 'common', stat_effects: '{"health": 1}', special_effect: '', stack_limit: 1 },
  { name: 'Chain Mail', description: 'Linked metal rings for defense', icon: '🛡️', type: 'equipment', slot: 'armor', rarity: 'uncommon', stat_effects: '{"health": 2, "stamina": 1}', special_effect: '', stack_limit: 1 },
  { name: 'Mage Robes', description: 'Enchanted robes of wisdom', icon: '🧥', type: 'equipment', slot: 'armor', rarity: 'rare', stat_effects: '{"willpower": 3, "focus": 2}', special_effect: '+10% buff duration', stack_limit: 1 },

  // Accessories
  { name: 'Lucky Charm', description: 'Brings good fortune', icon: '🍀', type: 'equipment', slot: 'accessory', rarity: 'common', stat_effects: '{"charisma": 1}', special_effect: '', stack_limit: 1 },
  { name: 'Ring of Focus', description: 'Enhances mental clarity', icon: '💍', type: 'equipment', slot: 'accessory', rarity: 'uncommon', stat_effects: '{"focus": 2}', special_effect: '', stack_limit: 1 },
  { name: 'Amulet of Persistence', description: 'Grants unwavering determination', icon: '📿', type: 'equipment', slot: 'accessory', rarity: 'rare', stat_effects: '{"willpower": 3, "stamina": 1}', special_effect: 'Streaks protected for +1 day', stack_limit: 1 },

  // Consumables
  { name: 'Energy Potion', description: 'Restores 25 energy', icon: '🧪', type: 'consumable', slot: null, rarity: 'common', stat_effects: '{}', special_effect: 'restore_energy:25', stack_limit: 10 },
  { name: 'XP Elixir', description: 'Grants 50 bonus XP', icon: '✨', type: 'consumable', slot: null, rarity: 'uncommon', stat_effects: '{}', special_effect: 'grant_xp:50', stack_limit: 5 },
  { name: 'Streak Shield Scroll', description: 'Adds a streak shield', icon: '📜', type: 'consumable', slot: null, rarity: 'rare', stat_effects: '{}', special_effect: 'add_shield:1', stack_limit: 3 },

  // Trophies
  { name: 'First Blood Trophy', description: 'Awarded for defeating your first boss', icon: '🏆', type: 'trophy', slot: null, rarity: 'uncommon', stat_effects: '{}', special_effect: '', stack_limit: 1 },
  { name: 'Streak Champion Medal', description: 'Awarded for a 30-day streak', icon: '🎖️', type: 'trophy', slot: null, rarity: 'rare', stat_effects: '{}', special_effect: '', stack_limit: 1 },
  { name: 'Mastery Crown', description: 'Awarded for reaching level 50', icon: '👑', type: 'trophy', slot: null, rarity: 'legendary', stat_effects: '{}', special_effect: '', stack_limit: 1 },
];
