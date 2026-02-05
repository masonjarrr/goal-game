export type PlannerView = 'day' | 'week' | 'month';

export interface PlannerEvent {
  id: number;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  start_time: string | null; // HH:MM
  end_time: string | null; // HH:MM
  quest_id: number | null;
  step_id: number | null;
  is_completed: boolean;
  created_at: string;
  reminder_minutes: number | null; // Minutes before event to send notification
}
