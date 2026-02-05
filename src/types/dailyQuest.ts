export type DailyQuestType =
  | 'activate_buffs'      // Activate X buffs today
  | 'complete_steps'      // Complete X steps today
  | 'no_debuffs'          // No debuffs for the day
  | 'hit_protein'         // Hit protein goal (based on specific step)
  | 'gym_session'         // Complete a gym session
  | 'early_start'         // Complete a habit before 8 AM
  | 'streak_maintain'     // Maintain an existing streak
  | 'activate_specific';  // Activate a specific buff type

export interface DailyQuest {
  id: number;
  date: string; // YYYY-MM-DD
  quest_type: DailyQuestType;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  xp_reward: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface DailyQuestProgress {
  quests: DailyQuest[];
  allCompleted: boolean;
  bonusXpClaimed: boolean;
  bonusXp: number;
}

export const DAILY_QUEST_TEMPLATES: {
  type: DailyQuestType;
  title: string;
  description: string;
  targetRange: [number, number];
  xpReward: number;
}[] = [
  {
    type: 'activate_buffs',
    title: 'Habit Builder',
    description: 'Activate {target} buff(s) today',
    targetRange: [2, 4],
    xpReward: 25,
  },
  {
    type: 'complete_steps',
    title: 'Step by Step',
    description: 'Complete {target} quest step(s) today',
    targetRange: [3, 7],
    xpReward: 30,
  },
  {
    type: 'no_debuffs',
    title: 'Clean Slate',
    description: 'Avoid activating any debuffs today',
    targetRange: [1, 1],
    xpReward: 40,
  },
  {
    type: 'gym_session',
    title: 'Iron Warrior',
    description: 'Complete a gym workout today',
    targetRange: [1, 1],
    xpReward: 35,
  },
  {
    type: 'early_start',
    title: 'Early Bird',
    description: 'Complete a habit before 8 AM',
    targetRange: [1, 1],
    xpReward: 30,
  },
  {
    type: 'activate_specific',
    title: 'Wellness Warrior',
    description: 'Activate a health-related buff',
    targetRange: [1, 1],
    xpReward: 20,
  },
];

export const DAILY_QUEST_BONUS_XP = 50; // Bonus for completing all 3 quests
