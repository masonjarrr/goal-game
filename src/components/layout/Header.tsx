import { Character } from '../../types/character';
import { getXPProgress } from '../../utils/constants';
import { RPGProgressBar } from '../ui/RPGProgressBar';
import styles from '../../styles/components/layout.module.css';

interface HeaderProps {
  character: Character;
}

export function Header({ character }: HeaderProps) {
  const xpProgress = getXPProgress(character.total_xp);

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <span className={styles.characterName}>{character.name}</span>
        <span className={styles.levelBadge}>
          Lv. {character.level} — {character.title}
        </span>
      </div>
      <div className={styles.headerRight}>
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
