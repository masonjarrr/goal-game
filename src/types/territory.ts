export interface Territory {
  id: number;
  name: string;
  description: string;
  icon: string;
  unlock_level: number;
  background_color: string;
  position_x: number;
  position_y: number;
  connected_to: string; // JSON array of territory IDs
  challenges: string; // JSON
  rewards: string; // JSON
}

export interface TerritoryProgress {
  id: number;
  territory_id: number;
  discovered_at: string;
  completed_at: string | null;
  challenges_completed: string; // JSON
  is_current: boolean;
}

export interface TerritoryWithProgress extends Territory {
  discovered: boolean;
  discovered_at: string | null;
  completed: boolean;
  completed_at: string | null;
  is_current: boolean;
  is_locked: boolean;
  challenges_completed: string[];
}

export const SEED_TERRITORIES: Omit<Territory, 'id'>[] = [
  {
    name: 'The Awakening Glade',
    description: 'Where every journey begins. A peaceful clearing filled with morning light.',
    icon: '🌱',
    unlock_level: 1,
    background_color: '#22c55e',
    position_x: 50,
    position_y: 80,
    connected_to: '[2]',
    challenges: '["Complete your first quest", "Activate 5 buffs", "Reach level 3"]',
    rewards: '{"xp": 100, "title": "Awakened"}',
  },
  {
    name: 'Habit Highlands',
    description: 'Rocky terrain where only consistent habits lead to the summit.',
    icon: '⛰️',
    unlock_level: 5,
    background_color: '#a3a3a3',
    position_x: 30,
    position_y: 60,
    connected_to: '[1, 3]',
    challenges: '["Maintain a 7-day streak", "Complete 10 quests", "Defeat your first boss"]',
    rewards: '{"xp": 250, "title": "Highland Wanderer"}',
  },
  {
    name: 'Focus Forest',
    description: 'Dense woods where only the focused can find their way.',
    icon: '🌲',
    unlock_level: 10,
    background_color: '#166534',
    position_x: 70,
    position_y: 50,
    connected_to: '[2, 4]',
    challenges: '["Complete 10 focus sessions", "Reach level 15", "Unlock 3 skill nodes"]',
    rewards: '{"xp": 400, "title": "Forest Pathfinder"}',
  },
  {
    name: 'Productivity Plains',
    description: 'Vast open fields where goals are achieved and dreams realized.',
    icon: '🌾',
    unlock_level: 15,
    background_color: '#eab308',
    position_x: 50,
    position_y: 35,
    connected_to: '[3, 5]',
    challenges: '["Complete 5 goals", "Earn 5000 total XP", "Defeat 5 bosses"]',
    rewards: '{"xp": 600, "title": "Plains Champion"}',
  },
  {
    name: 'Summit of Mastery',
    description: 'The peak where only true masters stand. Your journey culminates here.',
    icon: '🏔️',
    unlock_level: 25,
    background_color: '#7c3aed',
    position_x: 50,
    position_y: 15,
    connected_to: '[4]',
    challenges: '["Reach level 30", "Unlock all capstone skills", "Complete 50 quests"]',
    rewards: '{"xp": 1000, "title": "Summit Master"}',
  },
];
