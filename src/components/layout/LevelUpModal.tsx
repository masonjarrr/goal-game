import { useEffect } from 'react';
import styles from '../../styles/components/level-up-modal.module.css';

interface LevelUpModalProps {
  level: number;
  title: string;
  onDismiss: () => void;
}

export function LevelUpModal({ level, title, onDismiss }: LevelUpModalProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') onDismiss();
    };
    window.addEventListener('keydown', handler);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handler);
    };
  }, [onDismiss]);

  return (
    <div className={styles.levelUpOverlay} onClick={onDismiss}>
      <div className={styles.levelUpContent}>
        <span className={styles.levelUpIcon}>⚔</span>
        <div className={styles.levelUpTitle}>LEVEL UP</div>
        <div className={styles.levelUpLevel}>Level {level}</div>
        <div className={styles.levelUpTitleName}>{title}</div>
        <div className={styles.dismissText}>Click or press any key to continue</div>
      </div>
    </div>
  );
}
