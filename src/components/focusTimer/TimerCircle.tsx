import { TimerPhase } from '../../types/focusTimer';
import styles from '../../styles/components/focus-timer.module.css';

interface TimerCircleProps {
  timeRemaining: number;
  totalTime: number;
  phase: TimerPhase;
  formattedTime: string;
}

export function TimerCircle({ timeRemaining, totalTime, phase, formattedTime }: TimerCircleProps) {
  const size = 200;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const progress = totalTime > 0 ? timeRemaining / totalTime : 1;
  const strokeDashoffset = circumference * (1 - progress);

  const phaseLabel = {
    work: 'Focus',
    short_break: 'Short Break',
    long_break: 'Long Break',
    idle: 'Ready',
  }[phase];

  return (
    <div className={styles.timerCircleWrapper}>
      <svg className={styles.timerCircle} width={size} height={size}>
        {/* Background circle */}
        <circle
          className={styles.timerCircleBg}
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        {/* Progress circle */}
        <circle
          className={`${styles.timerCircleProgress} ${
            phase === 'work' ? styles.work :
            phase === 'short_break' ? styles.shortBreak :
            phase === 'long_break' ? styles.longBreak :
            styles.idle
          }`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className={styles.timerDisplay}>
        <div className={styles.timerTime}>{formattedTime}</div>
        <div className={`${styles.timerPhase} ${
          phase === 'work' ? styles.work :
          phase === 'short_break' ? styles.shortBreak :
          phase === 'long_break' ? styles.longBreak : ''
        }`}>
          {phaseLabel}
        </div>
      </div>
    </div>
  );
}
