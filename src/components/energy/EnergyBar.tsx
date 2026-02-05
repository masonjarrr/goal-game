import { useState } from 'react';
import { EnergyState, EnergyDebuffEffect, ENERGY_REGEN_RATE } from '../../types/energy';
import styles from '../../styles/components/energy.module.css';

interface EnergyBarProps {
  state: EnergyState;
  percentage: number;
  isLow: boolean;
  isEmpty: boolean;
  debuffs?: EnergyDebuffEffect[];
  compact?: boolean;
}

export function EnergyBar({ state, percentage, isLow, isEmpty, debuffs = [], compact = false }: EnergyBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const maxTotal = state.max_energy + state.bonus_energy;
  const barClass = compact ? styles.energyBarCompact : styles.energyBar;

  const fillClass = `${styles.energyFill} ${isEmpty ? styles.empty : isLow ? styles.low : ''}`;
  const textClass = `${styles.energyText} ${isEmpty ? styles.empty : isLow ? styles.low : ''}`;

  return (
    <div className={styles.energyContainer}>
      <div
        className={barClass}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{ position: 'relative' }}
      >
        <span className={styles.energyIcon}>⚡</span>
        <div className={styles.energyTrack}>
          <div className={fillClass} style={{ width: `${percentage}%` }} />
        </div>
        <span className={textClass}>
          {state.current_energy}/{maxTotal}
        </span>

        {showTooltip && (
          <div className={styles.energyTooltip}>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>Current</span>
              <span className={styles.tooltipValue}>{state.current_energy}</span>
            </div>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>Max</span>
              <span className={styles.tooltipValue}>{state.max_energy}</span>
            </div>
            {state.bonus_energy > 0 && (
              <div className={styles.tooltipRow}>
                <span className={styles.tooltipLabel}>Bonus</span>
                <span className={styles.tooltipValue}>+{state.bonus_energy}</span>
              </div>
            )}
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>Regen</span>
              <span className={styles.tooltipValue}>{ENERGY_REGEN_RATE}/hr</span>
            </div>
          </div>
        )}
      </div>

      {/* Show active energy debuffs */}
      {debuffs.map((debuff, index) => (
        <div
          key={index}
          className={`${styles.energyDebuff} ${debuff.name === 'Exhausted' ? styles.exhausted : ''}`}
        >
          <span className={styles.debuffIcon}>{debuff.icon}</span>
          {debuff.name}
        </div>
      ))}
    </div>
  );
}

interface EnergyCostProps {
  cost: number;
  currentEnergy: number;
}

export function EnergyCost({ cost, currentEnergy }: EnergyCostProps) {
  const canAfford = currentEnergy >= cost;
  return (
    <span className={`${styles.energyCost} ${!canAfford ? styles.cantAfford : ''}`}>
      <span className={styles.costIcon}>⚡</span>
      {cost}
    </span>
  );
}
