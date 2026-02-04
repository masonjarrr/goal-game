import { Title, TITLES } from '../types/common';

/**
 * Equipment tier thresholds based on character level
 */
const TIER_THRESHOLDS = [
  { minLevel: 50, tier: 7 }, // Dragonborn
  { minLevel: 40, tier: 6 }, // Legend
  { minLevel: 30, tier: 5 }, // Master
  { minLevel: 22, tier: 4 }, // Expert
  { minLevel: 15, tier: 3 }, // Adept
  { minLevel: 10, tier: 2 }, // Journeyman
  { minLevel: 5, tier: 1 },  // Apprentice
  { minLevel: 1, tier: 0 },  // Novice
];

/**
 * Get equipment tier (0-7) based on character level
 */
export function getEquipmentTier(level: number): number {
  for (const { minLevel, tier } of TIER_THRESHOLDS) {
    if (level >= minLevel) return tier;
  }
  return 0;
}

/**
 * Get equipment tier from title directly
 */
export function getEquipmentTierFromTitle(title: Title): number {
  return TITLES.indexOf(title);
}

/**
 * Calculate aura intensity (0-1) based on stat value
 * Stats typically range from 0-30
 */
export function getAuraIntensity(statValue: number): number {
  const maxStat = 30;
  const minThreshold = 5; // Below this, no visible aura

  if (statValue < minThreshold) return 0;

  // Normalize to 0-1 range with some curve for visual appeal
  const normalized = (statValue - minThreshold) / (maxStat - minThreshold);
  return Math.min(Math.pow(normalized, 0.7), 1); // Slightly curved for better visual progression
}

/**
 * Stat aura color definitions
 */
export const STAT_AURA_COLORS = {
  stamina: '#2ecc71',   // Green - outer glow ring
  willpower: '#9b59b6', // Purple - inner shimmer
  health: '#e74c3c',    // Red - pulsing glow
  focus: '#3498db',     // Blue - head halo
  charisma: '#e67e22',  // Orange - sparkle particles
} as const;

/**
 * Equipment tier color palettes
 */
export const TIER_PALETTES = {
  0: { // Novice - cloth
    primary: '#8b7355',
    secondary: '#6b5344',
    accent: '#a08060',
    skin: '#e8c4a0',
    hair: '#4a3728',
  },
  1: { // Apprentice - leather
    primary: '#8b4513',
    secondary: '#654321',
    accent: '#cd853f',
    skin: '#e8c4a0',
    hair: '#4a3728',
  },
  2: { // Journeyman - chainmail
    primary: '#708090',
    secondary: '#4a5568',
    accent: '#a0aec0',
    skin: '#e8c4a0',
    hair: '#4a3728',
  },
  3: { // Adept - plate armor
    primary: '#5a6672',
    secondary: '#3d4852',
    accent: '#8892a0',
    skin: '#e8c4a0',
    hair: '#4a3728',
  },
  4: { // Expert - ornate plate
    primary: '#b8860b',
    secondary: '#8b6914',
    accent: '#daa520',
    skin: '#e8c4a0',
    hair: '#4a3728',
  },
  5: { // Master - glowing plate
    primary: '#ffd700',
    secondary: '#b8860b',
    accent: '#ffed4a',
    skin: '#e8c4a0',
    hair: '#4a3728',
    glow: '#ffd700',
  },
  6: { // Legend - legendary armor
    primary: '#e6e6fa',
    secondary: '#9370db',
    accent: '#dda0dd',
    skin: '#e8c4a0',
    hair: '#4a3728',
    glow: '#9370db',
  },
  7: { // Dragonborn - dragon scale
    primary: '#8b0000',
    secondary: '#4a0000',
    accent: '#ff4500',
    skin: '#e8c4a0',
    hair: '#ffd700',
    glow: '#ff4500',
    crown: '#ffd700',
  },
} as const;

export type TierPalette = typeof TIER_PALETTES[keyof typeof TIER_PALETTES];
