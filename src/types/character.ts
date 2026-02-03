import { Title } from './common';

export interface Character {
  id: number;
  name: string;
  total_xp: number;
  level: number;
  title: Title;
  created_at: string;
}

export interface XPLogEntry {
  id: number;
  amount: number;
  reason: string;
  source_type: 'step' | 'quest' | 'goal' | 'buff' | 'streak' | 'event';
  source_id: number | null;
  created_at: string;
}

export interface Stats {
  stamina: number;
  willpower: number;
  health: number;
  focus: number;
  charisma: number;
}
