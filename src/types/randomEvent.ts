export type EventType = 'bonus' | 'challenge' | 'modifier';
export type EventRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export interface EventTemplate {
  id: number;
  name: string;
  description: string;
  type: EventType;
  icon: string;
  duration_hours: number;
  effect_type: string;
  effect_value: string; // JSON
  rarity: EventRarity;
  weight: number;
}

export interface ActiveEvent {
  id: number;
  template_id: number;
  started_at: string;
  expires_at: string;
  is_claimed: boolean;
  claimed_at: string | null;
}

export interface EventHistory {
  id: number;
  template_id: number;
  event_name: string;
  started_at: string;
  result: string;
  xp_earned: number;
}

export interface ActiveEventWithTemplate extends ActiveEvent {
  template: EventTemplate;
  time_remaining: number; // seconds
}

export const RARITY_COLORS: Record<EventRarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
};

export const SEED_EVENT_TEMPLATES: Omit<EventTemplate, 'id'>[] = [
  // Bonus events
  {
    name: 'Double XP Hour',
    description: 'All XP gains are doubled for the next hour!',
    type: 'bonus',
    icon: '⭐',
    duration_hours: 1,
    effect_type: 'xp_multiplier',
    effect_value: '{"multiplier": 2}',
    rarity: 'rare',
    weight: 10,
  },
  {
    name: 'Energy Surge',
    description: 'Instantly restore 50 energy!',
    type: 'bonus',
    icon: '⚡',
    duration_hours: 0,
    effect_type: 'energy_restore',
    effect_value: '{"amount": 50}',
    rarity: 'common',
    weight: 30,
  },
  {
    name: 'Streak Shield Drop',
    description: 'A free streak shield has appeared!',
    type: 'bonus',
    icon: '🛡️',
    duration_hours: 0,
    effect_type: 'streak_shield',
    effect_value: '{"shields": 1}',
    rarity: 'uncommon',
    weight: 15,
  },
  {
    name: 'XP Bonus',
    description: 'Receive a bonus of 25 XP!',
    type: 'bonus',
    icon: '💰',
    duration_hours: 0,
    effect_type: 'xp_bonus',
    effect_value: '{"amount": 25}',
    rarity: 'common',
    weight: 25,
  },
  // Challenge events
  {
    name: 'Sprint Challenge',
    description: 'Complete 5 steps in 2 hours for bonus XP!',
    type: 'challenge',
    icon: '🏃',
    duration_hours: 2,
    effect_type: 'step_challenge',
    effect_value: '{"target": 5, "reward_xp": 50}',
    rarity: 'uncommon',
    weight: 20,
  },
  {
    name: 'Habit Rush',
    description: 'Activate 3 buffs in 4 hours for bonus XP!',
    type: 'challenge',
    icon: '💪',
    duration_hours: 4,
    effect_type: 'buff_challenge',
    effect_value: '{"target": 3, "reward_xp": 40}',
    rarity: 'common',
    weight: 25,
  },
  {
    name: 'Focus Marathon',
    description: 'Complete 2 focus sessions in 3 hours!',
    type: 'challenge',
    icon: '🎯',
    duration_hours: 3,
    effect_type: 'focus_challenge',
    effect_value: '{"target": 2, "reward_xp": 45}',
    rarity: 'uncommon',
    weight: 15,
  },
  // Modifier events
  {
    name: 'Stat Boost',
    description: 'All stats increased by +2 for 6 hours!',
    type: 'modifier',
    icon: '📈',
    duration_hours: 6,
    effect_type: 'stat_boost',
    effect_value: '{"all_stats": 2}',
    rarity: 'rare',
    weight: 10,
  },
  {
    name: 'Lucky Day',
    description: 'Increased chance of rare events for 12 hours!',
    type: 'modifier',
    icon: '🍀',
    duration_hours: 12,
    effect_type: 'luck_boost',
    effect_value: '{"rare_chance_bonus": 0.5}',
    rarity: 'epic',
    weight: 5,
  },
];

// Event trigger chances
export const EVENT_TRIGGER_CHANCE = 0.15; // 15% chance on app load/check
export const EVENT_CHECK_COOLDOWN_HOURS = 4; // Minimum hours between event checks
