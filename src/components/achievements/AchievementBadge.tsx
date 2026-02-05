import styles from '../../styles/components/achievements.module.css';

interface AchievementBadgeProps {
  unlocked: number;
  total: number;
}

export function AchievementBadge({ unlocked, total }: AchievementBadgeProps) {
  return (
    <span className={styles.achievementBadge}>
      <span className={styles.achievementBadgeIcon}>🏆</span>
      {unlocked}/{total}
    </span>
  );
}
