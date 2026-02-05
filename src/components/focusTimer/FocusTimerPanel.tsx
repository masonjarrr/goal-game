import { useState } from 'react';
import { FocusSettings, FocusStats, FocusSession, TimerState } from '../../types/focusTimer';
import { RPGPanel } from '../ui/RPGPanel';
import { RPGButton } from '../ui/RPGButton';
import { TimerCircle } from './TimerCircle';
import { FocusTimerSettings } from './FocusTimerSettings';
import styles from '../../styles/components/focus-timer.module.css';

interface FocusTimerPanelProps {
  settings: FocusSettings;
  stats: FocusStats;
  timerState: TimerState;
  recentSessions: FocusSession[];
  onStartWork: (linkedStepId?: number | null, linkedQuestId?: number | null) => void;
  onStartBreak: (isLongBreak?: boolean) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSkipBreak: () => void;
  onUpdateSettings: (settings: Partial<Omit<FocusSettings, 'id'>>) => void;
  formatTime: (seconds: number) => string;
}

export function FocusTimerPanel({
  settings,
  stats,
  timerState,
  recentSessions,
  onStartWork,
  onStartBreak,
  onPause,
  onResume,
  onStop,
  onSkipBreak,
  onUpdateSettings,
  formatTime,
}: FocusTimerPanelProps) {
  const [showSettings, setShowSettings] = useState(false);

  const getTotalTime = () => {
    switch (timerState.phase) {
      case 'work':
        return settings.work_duration * 60;
      case 'short_break':
        return settings.short_break * 60;
      case 'long_break':
        return settings.long_break * 60;
      default:
        return settings.work_duration * 60;
    }
  };

  const sessionsUntilLongBreak = settings.sessions_before_long_break - (timerState.sessionsCompleted % settings.sessions_before_long_break);

  return (
    <div className={styles.focusTimerPanel}>
      <RPGPanel header="Focus Timer" glow>
        <div className={styles.timerContainer}>
          <TimerCircle
            timeRemaining={timerState.timeRemaining}
            totalTime={getTotalTime()}
            phase={timerState.phase}
            formattedTime={formatTime(timerState.timeRemaining)}
          />

          <div className={styles.timerControls}>
            {timerState.phase === 'idle' && (
              <RPGButton variant="primary" onClick={() => onStartWork()}>
                Start Focus
              </RPGButton>
            )}
            {timerState.phase === 'work' && timerState.isRunning && (
              <>
                <RPGButton variant="ghost" onClick={onPause}>
                  Pause
                </RPGButton>
                <RPGButton variant="danger" onClick={onStop}>
                  Stop
                </RPGButton>
              </>
            )}
            {timerState.phase === 'work' && !timerState.isRunning && (
              <>
                <RPGButton variant="primary" onClick={onResume}>
                  Resume
                </RPGButton>
                <RPGButton variant="danger" onClick={onStop}>
                  Stop
                </RPGButton>
              </>
            )}
            {(timerState.phase === 'short_break' || timerState.phase === 'long_break') && (
              <>
                {timerState.isRunning ? (
                  <RPGButton variant="ghost" onClick={onPause}>
                    Pause
                  </RPGButton>
                ) : (
                  <RPGButton variant="primary" onClick={onResume}>
                    Resume
                  </RPGButton>
                )}
                <RPGButton variant="ghost" onClick={onSkipBreak}>
                  Skip Break
                </RPGButton>
              </>
            )}
          </div>

          {/* Session indicators */}
          <div className={styles.sessionCount}>
            {Array.from({ length: settings.sessions_before_long_break }).map((_, i) => (
              <div
                key={i}
                className={`${styles.sessionDot} ${
                  i < timerState.sessionsCompleted % settings.sessions_before_long_break ? styles.completed : ''
                } ${
                  i === timerState.sessionsCompleted % settings.sessions_before_long_break && timerState.phase === 'work' ? styles.active : ''
                }`}
              />
            ))}
            <span style={{ marginLeft: 8 }}>
              {sessionsUntilLongBreak} until long break
            </span>
          </div>
        </div>
      </RPGPanel>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🎯</span>
          <span className={styles.statValue}>{stats.total_sessions}</span>
          <span className={styles.statLabel}>Total Sessions</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>⏱️</span>
          <span className={styles.statValue}>{Math.round(stats.total_minutes / 60)}h</span>
          <span className={styles.statLabel}>Total Focus</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🔥</span>
          <span className={styles.statValue}>{stats.current_streak}</span>
          <span className={styles.statLabel}>Current Streak</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🏆</span>
          <span className={styles.statValue}>{stats.today_sessions}</span>
          <span className={styles.statLabel}>Today</span>
        </div>
      </div>

      {/* Settings toggle */}
      <RPGButton variant="ghost" size="small" onClick={() => setShowSettings(!showSettings)}>
        {showSettings ? 'Hide Settings' : 'Timer Settings'}
      </RPGButton>

      {showSettings && (
        <FocusTimerSettings settings={settings} onUpdateSettings={onUpdateSettings} />
      )}

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <RPGPanel header="Recent Sessions">
          <div className={styles.sessionList}>
            {recentSessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className={`${styles.sessionItem} ${
                  session.status === 'completed' ? styles.completed : styles.cancelled
                }`}
              >
                <span className={styles.sessionTime}>{session.duration_minutes}m</span>
                <span className={styles.sessionInfo}>
                  {new Date(session.started_at + 'Z').toLocaleString()}
                </span>
                {session.status === 'completed' && session.xp_earned > 0 && (
                  <span className={styles.sessionXp}>+{session.xp_earned} XP</span>
                )}
              </div>
            ))}
          </div>
        </RPGPanel>
      )}
    </div>
  );
}

// Floating timer button for use when timer is running but user is on another tab
interface FloatingTimerProps {
  timerState: TimerState;
  formatTime: (seconds: number) => string;
  onClick: () => void;
}

export function FloatingTimer({ timerState, formatTime, onClick }: FloatingTimerProps) {
  if (timerState.phase === 'idle') return null;

  return (
    <div
      className={`${styles.floatingTimer} ${timerState.isRunning ? styles.running : ''}`}
      onClick={onClick}
    >
      <span className={styles.floatingTimerIcon}>
        {timerState.phase === 'work' ? '🎯' : '☕'}
      </span>
      <span className={styles.floatingTimerTime}>{formatTime(timerState.timeRemaining)}</span>
    </div>
  );
}
