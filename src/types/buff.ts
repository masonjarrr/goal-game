import { BuffType, StatName } from './common';

export interface BuffDefinition {
  id: number;
  name: string;
  description: string;
  type: BuffType;
  icon: string;
  duration_hours: number;
  stat_effects: string; // JSON: Record<StatName, number>
  created_at: string;
}

export interface BuffLog {
  id: number;
  definition_id: number;
  activated_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface ActiveBuff extends BuffLog {
  name: string;
  description: string;
  type: BuffType;
  icon: string;
  stat_effects: string;
}

export interface ParsedStatEffects {
  [key: string]: number;
}
