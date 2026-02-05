import { AchievementUnlockResult } from '../../types/achievement';
import { RPGModal } from '../ui/RPGModal';
import { RPGButton } from '../ui/RPGButton';
import styles from '../../styles/components/achievements.module.css';

interface AchievementUnlockModalProps {
  unlock: AchievementUnlockResult | null;
  onDismiss: () => void;
}

export function AchievementUnlockModal({ unlock, onDismiss }: AchievementUnlockModalProps) {
  if (!unlock) return null;

  return (
    <RPGModal
      open={true}
      onClose={onDismiss}
      title="Achievement Unlocked!"
      actions={
        <RPGButton variant="primary" onClick={onDismiss}>
          Awesome!
        </RPGButton>
      }
    >
      <div className={styles.unlockModal}>
        <div className={styles.unlockIcon}>{unlock.achievement.icon}</div>
        <div className={styles.unlockTitle}>{unlock.achievement.name}</div>
        <div className={styles.unlockDesc}>{unlock.achievement.description}</div>
        <div className={styles.unlockReward}>
          +{unlock.xpAwarded} XP
        </div>
      </div>
    </RPGModal>
  );
}
