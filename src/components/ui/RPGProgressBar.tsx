import styles from '../../styles/components/rpg-progress.module.css';

interface RPGProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
  color?: 'gold' | 'green' | 'blue';
  size?: 'normal' | 'large';
  shimmer?: boolean;
  className?: string;
}

export function RPGProgressBar({
  value,
  max,
  label,
  showValue = true,
  color = 'gold',
  size = 'normal',
  shimmer = false,
  className,
}: RPGProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const colorClass = color === 'gold' ? styles.fillGold : color === 'green' ? styles.fillGreen : styles.fillBlue;
  const trackClass = [styles.track, size === 'large' && styles.trackLarge].filter(Boolean).join(' ');

  return (
    <div className={`${styles.progressContainer} ${className || ''}`}>
      {(label || showValue) && (
        <div className={styles.progressLabel}>
          {label && <span>{label}</span>}
          {showValue && (
            <span>
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className={trackClass}>
        <div
          className={[colorClass, styles.fill, shimmer && styles.shimmer].filter(Boolean).join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
