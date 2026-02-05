export type FocusSessionStatus = 'active' | 'completed' | 'cancelled' | 'paused';

export interface FocusSession {
  id: number;
  duration_minutes: number;
  started_at: string;
  completed_at: string | null;
  status: FocusSessionStatus;
  xp_earned: number;
  linked_step_id: number | null;
  linked_quest_id: number | null;
  break_taken: boolean;
  notes: string;
}

export interface FocusSettings {
  id: number;
  work_duration: number;
  short_break: number;
  long_break: number;
  sessions_before_long_break: number;
  auto_start_breaks: boolean;
  sound_enabled: boolean;
}

export interface FocusStats {
  id: number;
  total_sessions: number;
  total_minutes: number;
  longest_streak: number;
  current_streak: number;
  today_sessions: number;
  today_date: string;
}

// XP Constants
export const XP_PER_FOCUS_SESSION = 15;
export const XP_BONUS_LINKED_STEP = 5;
export const XP_STREAK_BONUS = 10; // Every 4 sessions

// Default settings
export const DEFAULT_FOCUS_SETTINGS: Omit<FocusSettings, 'id'> = {
  work_duration: 25,
  short_break: 5,
  long_break: 15,
  sessions_before_long_break: 4,
  auto_start_breaks: false,
  sound_enabled: true,
};

export type TimerPhase = 'work' | 'short_break' | 'long_break' | 'idle';

export interface TimerState {
  phase: TimerPhase;
  timeRemaining: number; // in seconds
  isRunning: boolean;
  sessionsCompleted: number;
}
