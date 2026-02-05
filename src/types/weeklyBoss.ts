export interface WeeklyBoss {
  id: number;
  week_start: string; // YYYY-MM-DD (Monday)
  boss_type: string;
  name: string;
  description: string;
  icon: string;
  max_hp: number;
  current_hp: number;
  is_defeated: boolean;
  defeated_at: string | null;
  xp_reward: number;
  bonus_shields: number;
  created_at: string;
}

export interface BossTemplate {
  type: string;
  name: string;
  description: string;
  icon: string;
  hpRange: [number, number];
  xpReward: number;
  bonusShields: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const BOSS_TEMPLATES: BossTemplate[] = [
  {
    type: 'procrastination_dragon',
    name: 'Procrastination Dragon',
    description: 'A lazy beast that feeds on delayed tasks and broken promises.',
    icon: '🐉',
    hpRange: [400, 500],
    xpReward: 200,
    bonusShields: 1,
    difficulty: 'medium',
  },
  {
    type: 'distraction_demon',
    name: 'Distraction Demon',
    description: 'A cunning fiend that lures you away from your goals with endless diversions.',
    icon: '👹',
    hpRange: [350, 450],
    xpReward: 175,
    bonusShields: 1,
    difficulty: 'medium',
  },
  {
    type: 'sloth_specter',
    name: 'Sloth Specter',
    description: 'A ghostly presence that drains your energy and willpower.',
    icon: '👻',
    hpRange: [300, 400],
    xpReward: 150,
    bonusShields: 0,
    difficulty: 'easy',
  },
  {
    type: 'chaos_chimera',
    name: 'Chaos Chimera',
    description: 'A multi-headed monster representing disorganization and scattered focus.',
    icon: '🦁',
    hpRange: [500, 600],
    xpReward: 250,
    bonusShields: 2,
    difficulty: 'hard',
  },
  {
    type: 'anxiety_wyrm',
    name: 'Anxiety Wyrm',
    description: 'A serpentine creature that coils around your mind with worry and doubt.',
    icon: '🐍',
    hpRange: [450, 550],
    xpReward: 225,
    bonusShields: 1,
    difficulty: 'hard',
  },
  {
    type: 'comfort_zone_golem',
    name: 'Comfort Zone Golem',
    description: 'A stubborn construct that blocks the path to growth and change.',
    icon: '🗿',
    hpRange: [350, 450],
    xpReward: 175,
    bonusShields: 1,
    difficulty: 'medium',
  },
];

// Damage values for different actions
export const BOSS_DAMAGE = {
  step_completed: 10,
  buff_activated: 25,
  quest_completed: 50,
  goal_completed: 100,
  daily_quest_completed: 15,
  focus_session: 20,
  routine_completed: 30,
};

// Healing values (negative actions that help the boss)
export const BOSS_HEAL = {
  debuff_activated: 20,
  step_missed: 15,
};

export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart + 'T12:00:00');
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}
