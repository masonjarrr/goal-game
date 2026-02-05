import { Character } from '../../types/character';
import { EnergyState, ENERGY_LOW_THRESHOLD, ENERGY_EMPTY_THRESHOLD } from '../../types/energy';
import { getXPProgress } from '../../utils/constants';
import { RPGProgressBar } from '../ui/RPGProgressBar';
import { EnergyBar } from '../energy/EnergyBar';
import styles from '../../styles/components/layout.module.css';

interface HeaderProps {
  character: Character;
  energyState?: EnergyState;
}

export function Header({ character, energyState }: HeaderProps) {
  const xpProgress = getXPProgress(character.total_xp);

  const energyPercentage = energyState
    ? (energyState.current_energy / (energyState.max_energy + energyState.bonus_energy)) * 100
    : 0;
  const isLow = energyState ? energyState.current_energy <= ENERGY_LOW_THRESHOLD : false;
  const isEmpty = energyState ? energyState.current_energy <= ENERGY_EMPTY_THRESHOLD : false;

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <span className={styles.characterName}>{character.name}</span>
        <span className={styles.levelBadge}>
          Lv. {character.level} — {character.title}
        </span>
      </div>
      <div className={styles.headerRight}>
        {energyState && (
          <div className={styles.headerEnergy}>
            <EnergyBar
              state={energyState}
              percentage={energyPercentage}
              isLow={isLow}
              isEmpty={isEmpty}
              compact
            />
          </div>
        )}
        <div className={styles.headerXP}>
          <RPGProgressBar
            value={xpProgress.current}
            max={xpProgress.needed}
            label="XP"
            shimmer
          />
        </div>
      </div>
    </header>
  );
}
