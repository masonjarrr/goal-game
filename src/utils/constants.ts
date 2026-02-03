import { Title, TITLES } from '../types/common';

export const XP_PER_STEP: Record<string, number> = {
  normal: 10,
  important: 15,
  legendary: 20,
};

export const XP_QUEST_COMPLETE = 50;
export const XP_GOAL_COMPLETE = 200;
export const XP_DAILY_BUFF = 5;
export const XP_STREAK_7DAY = 25;

export const LEVEL_EXPONENT = 1.8;
export const LEVEL_BASE = 50;

export function xpForLevel(level: number): number {
  return Math.floor(LEVEL_BASE * Math.pow(level, LEVEL_EXPONENT));
}

export function totalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpNeeded = 0;
  while (true) {
    xpNeeded += xpForLevel(level);
    if (totalXP < xpNeeded) return level;
    level++;
    if (level > 100) return 100;
  }
}

export function getXPProgress(totalXP: number): { current: number; needed: number; percentage: number } {
  const level = getLevelFromXP(totalXP);
  const xpAtLevelStart = totalXPForLevel(level);
  const current = totalXP - xpAtLevelStart;
  const needed = xpForLevel(level);
  return {
    current,
    needed,
    percentage: Math.min((current / needed) * 100, 100),
  };
}

export function getTitleForLevel(level: number): Title {
  if (level >= 50) return TITLES[7]; // Dragonborn
  if (level >= 40) return TITLES[6]; // Legend
  if (level >= 30) return TITLES[5]; // Master
  if (level >= 22) return TITLES[4]; // Expert
  if (level >= 15) return TITLES[3]; // Adept
  if (level >= 10) return TITLES[2]; // Journeyman
  if (level >= 5) return TITLES[1]; // Apprentice
  return TITLES[0]; // Novice
}
