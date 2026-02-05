export interface WeeklyReview {
  id: number;
  week_start: string;
  generated_at: string;
  completed_at: string | null;
  is_completed: boolean;
  summary_data: string; // JSON
  wins: string;
  challenges: string;
  priorities: string; // JSON array
  notes: string;
  xp_earned: number;
}

export interface WeeklySummaryData {
  steps_completed: number;
  quests_completed: number;
  goals_completed: number;
  buffs_activated: number;
  debuffs_activated: number;
  xp_earned: number;
  boss_damage_dealt: number;
  boss_defeated: boolean;
  streaks_maintained: number;
  achievements_unlocked: number;
  focus_sessions: number;
  focus_minutes: number;
  routines_completed: number;
  combos_activated: number;
}

export const WEEKLY_REVIEW_XP = 100;

export const DEFAULT_SUMMARY_DATA: WeeklySummaryData = {
  steps_completed: 0,
  quests_completed: 0,
  goals_completed: 0,
  buffs_activated: 0,
  debuffs_activated: 0,
  xp_earned: 0,
  boss_damage_dealt: 0,
  boss_defeated: false,
  streaks_maintained: 0,
  achievements_unlocked: 0,
  focus_sessions: 0,
  focus_minutes: 0,
  routines_completed: 0,
  combos_activated: 0,
};
