import { Priority, QuestStatus, StepStatus } from './common';

export interface Goal {
  id: number;
  domain_id: number;
  title: string;
  description: string;
  status: QuestStatus;
  created_at: string;
  completed_at: string | null;
}

export interface Quest {
  id: number;
  goal_id: number;
  title: string;
  description: string;
  priority: Priority;
  status: QuestStatus;
  created_at: string;
  completed_at: string | null;
}

export interface Step {
  id: number;
  quest_id: number;
  title: string;
  priority: Priority;
  status: StepStatus;
  sort_order: number;
  completed_at: string | null;
}

export interface QuestWithSteps extends Quest {
  steps: Step[];
  domain_name?: string;
  domain_icon?: string;
  domain_color?: string;
  goal_title?: string;
}

export interface GoalWithQuests extends Goal {
  quests: QuestWithSteps[];
  domain_name?: string;
  domain_icon?: string;
  domain_color?: string;
}
