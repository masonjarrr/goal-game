export type AchievementCategory = 'quests' | 'buffs' | 'streaks' | 'boss' | 'levels' | 'special';

export type RequirementType = 'count' | 'threshold' | 'milestone';

export interface AchievementDefinition {
  id: number;
  key: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  xp_reward: number;
  requirement_type: RequirementType;
  requirement_value: number;
  requirement_source: string;
  sort_order: number;
  is_hidden: boolean;
}

export interface AchievementUnlock {
  id: number;
  definition_id: number;
  unlocked_at: string;
}

export interface AchievementProgress {
  id: number;
  definition_id: number;
  current_value: number;
  last_updated: string;
}

export interface AchievementWithProgress extends AchievementDefinition {
  unlocked: boolean;
  unlocked_at: string | null;
  current_value: number;
  progress_percent: number;
}

export interface AchievementUnlockResult {
  achievement: AchievementDefinition;
  xpAwarded: number;
}

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  quests: 'Quests & Goals',
  buffs: 'Habits & Buffs',
  streaks: 'Streaks',
  boss: 'Boss Battles',
  levels: 'Leveling',
  special: 'Special',
};

export const ACHIEVEMENT_CATEGORY_ICONS: Record<AchievementCategory, string> = {
  quests: '📜',
  buffs: '✨',
  streaks: '🔥',
  boss: '🐉',
  levels: '⭐',
  special: '🏆',
};

export const SEED_ACHIEVEMENTS: Omit<AchievementDefinition, 'id'>[] = [
  // Quest category
  { key: 'first_step', name: 'First Step', description: 'Complete your first step', category: 'quests', icon: '👣', xp_reward: 25, requirement_type: 'count', requirement_value: 1, requirement_source: 'steps_completed', sort_order: 1, is_hidden: false },
  { key: 'ten_steps', name: 'On Your Way', description: 'Complete 10 steps', category: 'quests', icon: '🚶', xp_reward: 50, requirement_type: 'count', requirement_value: 10, requirement_source: 'steps_completed', sort_order: 2, is_hidden: false },
  { key: 'hundred_steps', name: 'Journey Master', description: 'Complete 100 steps', category: 'quests', icon: '🏃', xp_reward: 200, requirement_type: 'count', requirement_value: 100, requirement_source: 'steps_completed', sort_order: 3, is_hidden: false },
  { key: 'first_quest', name: 'Quest Beginner', description: 'Complete your first quest', category: 'quests', icon: '📋', xp_reward: 50, requirement_type: 'count', requirement_value: 1, requirement_source: 'quests_completed', sort_order: 4, is_hidden: false },
  { key: 'ten_quests', name: 'Quest Veteran', description: 'Complete 10 quests', category: 'quests', icon: '📚', xp_reward: 150, requirement_type: 'count', requirement_value: 10, requirement_source: 'quests_completed', sort_order: 5, is_hidden: false },
  { key: 'first_goal', name: 'Goal Getter', description: 'Complete your first goal', category: 'quests', icon: '🎯', xp_reward: 100, requirement_type: 'count', requirement_value: 1, requirement_source: 'goals_completed', sort_order: 6, is_hidden: false },

  // Buffs category
  { key: 'first_buff', name: 'Habit Former', description: 'Activate your first buff', category: 'buffs', icon: '💪', xp_reward: 25, requirement_type: 'count', requirement_value: 1, requirement_source: 'buffs_activated', sort_order: 1, is_hidden: false },
  { key: 'ten_buffs', name: 'Habit Builder', description: 'Activate 10 buffs', category: 'buffs', icon: '🌟', xp_reward: 50, requirement_type: 'count', requirement_value: 10, requirement_source: 'buffs_activated', sort_order: 2, is_hidden: false },
  { key: 'hundred_buffs', name: 'Habit Master', description: 'Activate 100 buffs', category: 'buffs', icon: '✨', xp_reward: 200, requirement_type: 'count', requirement_value: 100, requirement_source: 'buffs_activated', sort_order: 3, is_hidden: false },

  // Streaks category
  { key: 'week_streak', name: 'Week Warrior', description: 'Maintain a 7-day streak', category: 'streaks', icon: '🔥', xp_reward: 75, requirement_type: 'threshold', requirement_value: 7, requirement_source: 'buff_streak', sort_order: 1, is_hidden: false },
  { key: 'month_streak', name: 'Monthly Champion', description: 'Maintain a 30-day streak', category: 'streaks', icon: '🏅', xp_reward: 300, requirement_type: 'threshold', requirement_value: 30, requirement_source: 'buff_streak', sort_order: 2, is_hidden: false },

  // Boss category
  { key: 'first_boss', name: 'Dragon Slayer', description: 'Defeat your first weekly boss', category: 'boss', icon: '🐉', xp_reward: 100, requirement_type: 'count', requirement_value: 1, requirement_source: 'bosses_defeated', sort_order: 1, is_hidden: false },
  { key: 'five_bosses', name: 'Boss Hunter', description: 'Defeat 5 weekly bosses', category: 'boss', icon: '⚔️', xp_reward: 250, requirement_type: 'count', requirement_value: 5, requirement_source: 'bosses_defeated', sort_order: 2, is_hidden: false },

  // Levels category
  { key: 'level_5', name: 'Rising Star', description: 'Reach level 5', category: 'levels', icon: '⭐', xp_reward: 50, requirement_type: 'threshold', requirement_value: 5, requirement_source: 'character_level', sort_order: 1, is_hidden: false },
  { key: 'level_10', name: 'Apprentice', description: 'Reach level 10', category: 'levels', icon: '🌟', xp_reward: 100, requirement_type: 'threshold', requirement_value: 10, requirement_source: 'character_level', sort_order: 2, is_hidden: false },
  { key: 'level_25', name: 'Expert', description: 'Reach level 25', category: 'levels', icon: '💫', xp_reward: 250, requirement_type: 'threshold', requirement_value: 25, requirement_source: 'character_level', sort_order: 3, is_hidden: false },
  { key: 'level_50', name: 'Master', description: 'Reach level 50', category: 'levels', icon: '👑', xp_reward: 500, requirement_type: 'threshold', requirement_value: 50, requirement_source: 'character_level', sort_order: 4, is_hidden: false },
];
