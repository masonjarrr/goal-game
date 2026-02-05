export interface StreakInfo {
  buffDefinitionId: number;
  currentStreak: number;
  longestStreak: number;
  lastActivatedDate: string | null;
  isAtRisk: boolean; // True if streak will break if not activated today
  shieldActive: boolean; // True if a shield is protecting this streak
}

export interface StreakShield {
  id: number;
  quantity: number;
  earned_at: string;
}

export interface StreakFreeze {
  id: number;
  buff_definition_id: number;
  freeze_date: string;
  reason: string;
  created_at: string;
}

export interface StreakMilestone {
  days: number;
  title: string;
  bonusXp: number;
  icon: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, title: 'Getting Started', bonusXp: 15, icon: '🌱' },
  { days: 7, title: 'One Week Strong', bonusXp: 50, icon: '🔥' },
  { days: 14, title: 'Two Week Warrior', bonusXp: 75, icon: '💪' },
  { days: 21, title: 'Habit Forming', bonusXp: 100, icon: '⚡' },
  { days: 30, title: 'Monthly Master', bonusXp: 150, icon: '🏆' },
  { days: 60, title: 'Two Month Champion', bonusXp: 250, icon: '👑' },
  { days: 90, title: 'Quarterly Legend', bonusXp: 400, icon: '🌟' },
  { days: 180, title: 'Half Year Hero', bonusXp: 750, icon: '💎' },
  { days: 365, title: 'Annual Achiever', bonusXp: 1500, icon: '🎖️' },
];

export function getNextMilestone(currentStreak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find(m => m.days > currentStreak) || null;
}

export function getReachedMilestones(currentStreak: number): StreakMilestone[] {
  return STREAK_MILESTONES.filter(m => m.days <= currentStreak);
}

export function getLatestMilestone(currentStreak: number): StreakMilestone | null {
  const reached = getReachedMilestones(currentStreak);
  return reached.length > 0 ? reached[reached.length - 1] : null;
}
