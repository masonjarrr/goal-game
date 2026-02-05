export interface CharacterClass {
  id: number;
  key: string;
  name: string;
  description: string;
  icon: string;
  primary_stat: string;
  stat_bonuses: string; // JSON
  xp_bonus_type: string;
  xp_bonus_percent: number;
  special_ability: string;
  special_ability_desc: string;
}

export interface CharacterClassSelection {
  id: number;
  class_id: number;
  selected_at: string;
  last_changed_at: string;
  changes_remaining: number;
}

export interface CharacterClassWithSelection extends CharacterClass {
  is_selected: boolean;
}

export const SEED_CHARACTER_CLASSES: Omit<CharacterClass, 'id'>[] = [
  {
    key: 'warrior',
    name: 'Warrior',
    description: 'Masters of physical challenges and quest completion',
    icon: '⚔️',
    primary_stat: 'stamina',
    stat_bonuses: '{"stamina": 3, "health": 2}',
    xp_bonus_type: 'quest',
    xp_bonus_percent: 10,
    special_ability: 'Battlecry',
    special_ability_desc: 'Once per day, complete a quest step instantly',
  },
  {
    key: 'mage',
    name: 'Mage',
    description: 'Experts in habits and mental discipline',
    icon: '🧙',
    primary_stat: 'focus',
    stat_bonuses: '{"focus": 3, "willpower": 2}',
    xp_bonus_type: 'buff',
    xp_bonus_percent: 10,
    special_ability: 'Arcane Focus',
    special_ability_desc: 'Focus sessions grant 20% more XP',
  },
  {
    key: 'ranger',
    name: 'Ranger',
    description: 'Specialists in maintaining streaks and consistency',
    icon: '🏹',
    primary_stat: 'willpower',
    stat_bonuses: '{"willpower": 3, "stamina": 1, "focus": 1}',
    xp_bonus_type: 'streak',
    xp_bonus_percent: 10,
    special_ability: 'Tracking',
    special_ability_desc: 'Streaks are protected for 1 extra day',
  },
  {
    key: 'paladin',
    name: 'Paladin',
    description: 'Champions of boss battles and weekly challenges',
    icon: '🛡️',
    primary_stat: 'health',
    stat_bonuses: '{"health": 2, "willpower": 2, "charisma": 1}',
    xp_bonus_type: 'boss',
    xp_bonus_percent: 10,
    special_ability: 'Divine Shield',
    special_ability_desc: 'Deal 25% more damage to weekly bosses',
  },
];

export const CLASS_CHANGE_LIMIT = 3; // How many times can change class total
