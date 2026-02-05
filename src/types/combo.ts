export interface ComboDefinition {
  id: number;
  name: string;
  description: string;
  icon: string;
  required_buffs: string; // JSON array of buff definition IDs
  time_window_hours: number;
  bonus_xp: number;
  is_active: boolean;
}

export interface ComboActivation {
  id: number;
  combo_id: number;
  activated_at: string;
  buffs_used: string; // JSON array of buff log IDs
}

export interface ComboWithStatus extends ComboDefinition {
  required_buff_names: string[];
  active_buff_ids: number[];
  progress: number;
  is_ready: boolean;
  last_activated: string | null;
}

// Seed combos
export const SEED_COMBOS: Omit<ComboDefinition, 'id'>[] = [
  {
    name: 'Wellness Warrior',
    description: 'Activate Meditation, Exercise, and Healthy Meal buffs',
    icon: '🏆',
    required_buffs: '[]', // Will be filled based on existing buffs
    time_window_hours: 24,
    bonus_xp: 30,
    is_active: true,
  },
  {
    name: 'Focus Master',
    description: 'Activate No Phone First Hour, Deep Work Session, and Read 30+ Minutes',
    icon: '🎯',
    required_buffs: '[]',
    time_window_hours: 24,
    bonus_xp: 25,
    is_active: true,
  },
  {
    name: 'Early Bird',
    description: 'Activate Morning Exercise, 8 Hours Sleep, and No Phone First Hour',
    icon: '🌅',
    required_buffs: '[]',
    time_window_hours: 24,
    bonus_xp: 35,
    is_active: true,
  },
  {
    name: 'Mind & Body',
    description: 'Activate Meditation, Yoga/Stretching, and Journaling',
    icon: '🧘',
    required_buffs: '[]',
    time_window_hours: 24,
    bonus_xp: 25,
    is_active: true,
  },
  {
    name: 'Social Champion',
    description: 'Activate Socialised, Helped Someone, and Gratitude Practice',
    icon: '🤝',
    required_buffs: '[]',
    time_window_hours: 24,
    bonus_xp: 30,
    is_active: true,
  },
];

// Map combo names to required buff names for auto-linking
export const COMBO_BUFF_REQUIREMENTS: Record<string, string[]> = {
  'Wellness Warrior': ['Meditation', 'Morning Exercise', 'Healthy Meal'],
  'Focus Master': ['No Phone First Hour', 'Deep Work Session', 'Read 30+ Minutes'],
  'Early Bird': ['Morning Exercise', '8 Hours Sleep', 'No Phone First Hour'],
  'Mind & Body': ['Meditation', 'Yoga / Stretching', 'Journaling'],
  'Social Champion': ['Socialised', 'Helped Someone', 'Gratitude Practice'],
};
