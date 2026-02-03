export type TabId = 'character' | 'quests' | 'buffs' | 'planner';

export interface Domain {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export type Priority = 'normal' | 'important' | 'legendary';
export type QuestStatus = 'active' | 'completed' | 'failed' | 'abandoned';
export type StepStatus = 'pending' | 'completed' | 'skipped';
export type BuffType = 'buff' | 'debuff';
export type StatName = 'stamina' | 'willpower' | 'health' | 'focus' | 'charisma';

export const STAT_NAMES: StatName[] = ['stamina', 'willpower', 'health', 'focus', 'charisma'];

export const TITLES = [
  'Novice',
  'Apprentice',
  'Journeyman',
  'Adept',
  'Expert',
  'Master',
  'Legend',
  'Dragonborn',
] as const;

export type Title = (typeof TITLES)[number];
