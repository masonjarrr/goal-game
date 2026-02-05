export interface EnergyState {
  id: number;
  current_energy: number;
  max_energy: number;
  last_regen_at: string;
  bonus_energy: number;
}

export interface EnergyLog {
  id: number;
  amount: number;
  reason: string;
  source_type: string;
  source_id: number | null;
  energy_before: number;
  energy_after: number;
  created_at: string;
}

export interface EnergyCost {
  id: number;
  action_type: string;
  base_cost: number;
  description: string;
}

// Constants
export const ENERGY_REGEN_RATE = 10; // per hour
export const ENERGY_MAX_DEFAULT = 100;
export const ENERGY_LOW_THRESHOLD = 20;
export const ENERGY_EMPTY_THRESHOLD = 5;

// Default costs for actions
export const DEFAULT_ENERGY_COSTS: Record<string, number> = {
  complete_step: 5,
  activate_buff: 3,
  start_focus_timer: 10,
  deactivate_debuff: 15,
};

// Debuff effects when energy is low
export const FATIGUED_DEBUFF = {
  name: 'Fatigued',
  description: 'Low energy is affecting your performance',
  icon: '😓',
  effects: { focus: -2, willpower: -2 },
  threshold: ENERGY_LOW_THRESHOLD,
};

export const EXHAUSTED_DEBUFF = {
  name: 'Exhausted',
  description: 'Critically low energy is severely impacting you',
  icon: '😵',
  effects: { stamina: -3, willpower: -3, focus: -3, health: -1 },
  threshold: ENERGY_EMPTY_THRESHOLD,
};

export interface EnergyDebuffEffect {
  active: boolean;
  name: string;
  icon: string;
  effects: Record<string, number>;
}
