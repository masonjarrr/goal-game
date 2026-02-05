import { Character, Stats } from '../../types/character';
import { getXPProgress } from '../../utils/constants';
import { RPGProgressBar } from '../ui/RPGProgressBar';
import { CharacterSprite } from './CharacterSprite';
import styles from '../../styles/components/character-header.module.css';

interface CharacterHeaderProps {
  character: Character;
  stats: Stats;
}

export function CharacterHeader({ character, stats }: CharacterHeaderProps) {
  const xpProgress = getXPProgress(character.total_xp);

  return (
    <div className={styles.header}>
      <div className={styles.spriteContainer}>
        <CharacterSprite level={character.level} stats={stats} size="small" />
      </div>

      <div className={styles.info}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{character.name}</span>
          <span className={styles.level}>Lv. {character.level}</span>
          <span className={styles.title}>{character.title}</span>
        </div>

        <div className={styles.xpRow}>
          <RPGProgressBar
            value={xpProgress.current}
            max={xpProgress.needed}
            showValue={false}
            shimmer
          />
          <span className={styles.xpText}>
            {xpProgress.current} / {xpProgress.needed} XP
          </span>
        </div>
      </div>

      <div className={styles.quickStats}>
        {Object.entries(stats).slice(0, 5).map(([stat, value]) => (
          <div key={stat} className={styles.quickStat}>
            <span className={styles.statIcon}>{getStatIcon(stat)}</span>
            <span className={styles.statValue}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatIcon(stat: string): string {
  const icons: Record<string, string> = {
    stamina: '💪',
    willpower: '🧠',
    health: '❤️',
    focus: '🎯',
    charisma: '✨',
  };
  return icons[stat] || '📊';
}
