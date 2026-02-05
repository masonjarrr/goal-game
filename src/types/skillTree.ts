export interface SkillBranch {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface SkillNode {
  id: number;
  branch_id: number;
  name: string;
  description: string;
  icon: string;
  tier: number;
  position: number;
  xp_cost: number;
  prerequisite_node_id: number | null;
  effect_type: string;
  effect_value: string; // JSON
  is_capstone: boolean;
}

export interface UnlockedSkill {
  id: number;
  node_id: number;
  unlocked_at: string;
}

export interface SkillNodeWithStatus extends SkillNode {
  unlocked: boolean;
  unlocked_at: string | null;
  can_unlock: boolean;
  branch_name: string;
  branch_color: string;
}

export const SEED_SKILL_BRANCHES: Omit<SkillBranch, 'id'>[] = [
  { name: 'Productivity', description: 'Quest and step bonuses', icon: '⚡', color: '#3b82f6', sort_order: 1 },
  { name: 'Health', description: 'Energy and stamina bonuses', icon: '❤️', color: '#ef4444', sort_order: 2 },
  { name: 'Focus', description: 'Timer and concentration bonuses', icon: '🎯', color: '#8b5cf6', sort_order: 3 },
  { name: 'Social', description: 'Streak and charisma bonuses', icon: '🤝', color: '#f97316', sort_order: 4 },
];

export const SEED_SKILL_NODES: Omit<SkillNode, 'id'>[] = [
  // Productivity branch
  { branch_id: 1, name: 'Quick Learner', description: '+5% XP from steps', icon: '📚', tier: 1, position: 0, xp_cost: 100, prerequisite_node_id: null, effect_type: 'step_xp_bonus', effect_value: '{"percent": 5}', is_capstone: false },
  { branch_id: 1, name: 'Efficient Worker', description: '+10% XP from quests', icon: '✅', tier: 2, position: 0, xp_cost: 250, prerequisite_node_id: 1, effect_type: 'quest_xp_bonus', effect_value: '{"percent": 10}', is_capstone: false },
  { branch_id: 1, name: 'Goal Master', description: '+15% XP from goals', icon: '🎯', tier: 3, position: 0, xp_cost: 500, prerequisite_node_id: 2, effect_type: 'goal_xp_bonus', effect_value: '{"percent": 15}', is_capstone: true },

  // Health branch
  { branch_id: 2, name: 'Energized', description: '+10 max energy', icon: '⚡', tier: 1, position: 0, xp_cost: 100, prerequisite_node_id: null, effect_type: 'max_energy', effect_value: '{"amount": 10}', is_capstone: false },
  { branch_id: 2, name: 'Quick Recovery', description: '+2 energy regen/hour', icon: '💚', tier: 2, position: 0, xp_cost: 250, prerequisite_node_id: 4, effect_type: 'energy_regen', effect_value: '{"amount": 2}', is_capstone: false },
  { branch_id: 2, name: 'Vitality Master', description: '+2 stamina, +2 health', icon: '❤️', tier: 3, position: 0, xp_cost: 500, prerequisite_node_id: 5, effect_type: 'stat_bonus', effect_value: '{"stamina": 2, "health": 2}', is_capstone: true },

  // Focus branch
  { branch_id: 3, name: 'Focused Mind', description: '+1 focus stat', icon: '🧠', tier: 1, position: 0, xp_cost: 100, prerequisite_node_id: null, effect_type: 'stat_bonus', effect_value: '{"focus": 1}', is_capstone: false },
  { branch_id: 3, name: 'Deep Concentration', description: '+10% focus session XP', icon: '🎯', tier: 2, position: 0, xp_cost: 250, prerequisite_node_id: 7, effect_type: 'focus_xp_bonus', effect_value: '{"percent": 10}', is_capstone: false },
  { branch_id: 3, name: 'Zen Master', description: '+3 focus, +2 willpower', icon: '🧘', tier: 3, position: 0, xp_cost: 500, prerequisite_node_id: 8, effect_type: 'stat_bonus', effect_value: '{"focus": 3, "willpower": 2}', is_capstone: true },

  // Social branch
  { branch_id: 4, name: 'Charismatic', description: '+1 charisma stat', icon: '💬', tier: 1, position: 0, xp_cost: 100, prerequisite_node_id: null, effect_type: 'stat_bonus', effect_value: '{"charisma": 1}', is_capstone: false },
  { branch_id: 4, name: 'Streak Guardian', description: 'Streaks last 1 extra day', icon: '🛡️', tier: 2, position: 0, xp_cost: 250, prerequisite_node_id: 10, effect_type: 'streak_extension', effect_value: '{"days": 1}', is_capstone: false },
  { branch_id: 4, name: 'Social Champion', description: '+3 charisma, +10% streak XP', icon: '🤝', tier: 3, position: 0, xp_cost: 500, prerequisite_node_id: 11, effect_type: 'combined', effect_value: '{"charisma": 3, "streak_xp_bonus": 10}', is_capstone: true },
];
