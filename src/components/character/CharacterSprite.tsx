import { useEffect, useRef } from 'react';
import { Stats } from '../../types/character';
import { getEquipmentTier, getAuraIntensity, STAT_AURA_COLORS } from '../../utils/spriteUtils';
import { renderCharacter, CANVAS_SIZE } from './PixelArtRenderer';
import styles from '../../styles/components/character-sprite.module.css';

interface CharacterSpriteProps {
  level: number;
  stats: Stats;
  size?: 'small' | 'medium' | 'large';
}

export function CharacterSprite({ level, stats, size = 'medium' }: CharacterSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tier = getEquipmentTier(level);

  // Render character when tier changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderCharacter(ctx, tier);
  }, [tier]);

  // Calculate aura intensities
  const auraIntensities = {
    stamina: getAuraIntensity(stats.stamina),
    willpower: getAuraIntensity(stats.willpower),
    health: getAuraIntensity(stats.health),
    focus: getAuraIntensity(stats.focus),
    charisma: getAuraIntensity(stats.charisma),
  };

  // CSS custom properties for aura effects
  const auraStyles = {
    '--aura-stamina-intensity': auraIntensities.stamina,
    '--aura-stamina-color': STAT_AURA_COLORS.stamina,
    '--aura-willpower-intensity': auraIntensities.willpower,
    '--aura-willpower-color': STAT_AURA_COLORS.willpower,
    '--aura-health-intensity': auraIntensities.health,
    '--aura-health-color': STAT_AURA_COLORS.health,
    '--aura-focus-intensity': auraIntensities.focus,
    '--aura-focus-color': STAT_AURA_COLORS.focus,
    '--aura-charisma-intensity': auraIntensities.charisma,
    '--aura-charisma-color': STAT_AURA_COLORS.charisma,
  } as React.CSSProperties;

  const sizeClass = size === 'small' ? styles.small : size === 'large' ? styles.large : '';

  return (
    <div className={`${styles.spriteContainer} ${sizeClass}`} style={auraStyles}>
      {/* Aura layers (behind character) */}
      {auraIntensities.stamina > 0 && (
        <div className={`${styles.auraLayer} ${styles.auraStamina}`} />
      )}
      {auraIntensities.willpower > 0 && (
        <div className={`${styles.auraLayer} ${styles.auraWillpower}`} />
      )}
      {auraIntensities.health > 0 && (
        <div className={`${styles.auraLayer} ${styles.auraHealth}`} />
      )}
      {auraIntensities.focus > 0 && (
        <div className={`${styles.auraLayer} ${styles.auraFocus}`} />
      )}
      {auraIntensities.charisma > 0 && (
        <div className={`${styles.auraLayer} ${styles.auraCharisma}`} />
      )}

      {/* Character sprite canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className={styles.spriteCanvas}
      />
    </div>
  );
}
