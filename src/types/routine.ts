export type RoutineType = 'morning' | 'evening' | 'custom';

export interface RoutineDefinition {
  id: number;
  name: string;
  type: RoutineType;
  description: string;
  bonus_xp: number;
  is_active: boolean;
  created_at: string;
}

export interface RoutineStep {
  id: number;
  routine_id: number;
  title: string;
  description: string;
  linked_buff_id: number | null;
  sort_order: number;
  duration_minutes: number;
  is_optional: boolean;
}

export interface RoutineLog {
  id: number;
  routine_id: number;
  date: string;
  started_at: string | null;
  completed_at: string | null;
  is_completed: boolean;
  steps_completed: number;
  total_steps: number;
  xp_earned: number;
}

export interface RoutineStepLog {
  id: number;
  routine_log_id: number;
  step_id: number;
  completed_at: string | null;
  is_completed: boolean;
  skipped: boolean;
}

export interface RoutineStreak {
  id: number;
  routine_id: number;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
}

export interface RoutineWithSteps extends RoutineDefinition {
  steps: RoutineStep[];
  streak?: RoutineStreak;
  todayLog?: RoutineLog;
}

export interface RoutineStepWithStatus extends RoutineStep {
  is_completed: boolean;
  skipped: boolean;
  completed_at: string | null;
}

// Default XP bonuses
export const ROUTINE_COMPLETION_XP = 25;
export const ROUTINE_STREAK_BONUS_XP = 10; // per week streak
