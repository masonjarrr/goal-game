import { useState, useCallback, useEffect, useRef } from 'react';
import {
  FocusSession,
  FocusSettings,
  FocusStats,
  TimerState,
  TimerPhase,
  XP_PER_FOCUS_SESSION,
  XP_BONUS_LINKED_STEP,
  XP_STREAK_BONUS,
} from '../types/focusTimer';
import * as focusTimerRepo from '../db/repositories/focusTimerRepo';

interface UseFocusTimerOptions {
  grantXP: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
  onSessionComplete?: () => void;
}

export function useFocusTimer({ grantXP, onSessionComplete }: UseFocusTimerOptions) {
  const [settings, setSettings] = useState<FocusSettings>(() => focusTimerRepo.getFocusSettings());
  const [stats, setStats] = useState<FocusStats>(() => focusTimerRepo.getFocusStats());
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(() => focusTimerRepo.getActiveSession());
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);

  const [timerState, setTimerState] = useState<TimerState>({
    phase: 'idle',
    timeRemaining: settings.work_duration * 60,
    isRunning: false,
    sessionsCompleted: 0,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<number | null>(currentSession?.id || null);

  const refresh = useCallback(() => {
    setSettings(focusTimerRepo.getFocusSettings());
    setStats(focusTimerRepo.getFocusStats());
    setCurrentSession(focusTimerRepo.getActiveSession());
    setRecentSessions(focusTimerRepo.getRecentSessions(10));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Timer tick
  useEffect(() => {
    if (timerState.isRunning && timerState.timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimerState((prev) => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1),
        }));
      }, 1000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [timerState.isRunning]);

  // Handle timer completion
  useEffect(() => {
    if (timerState.timeRemaining === 0 && timerState.isRunning) {
      handlePhaseComplete();
    }
  }, [timerState.timeRemaining, timerState.isRunning]);

  const handlePhaseComplete = async () => {
    if (timerState.phase === 'work' && sessionIdRef.current) {
      // Complete work session
      const session = focusTimerRepo.getSessionById(sessionIdRef.current);
      let xpEarned = XP_PER_FOCUS_SESSION;

      // Bonus for linked step
      if (session?.linked_step_id) {
        xpEarned += XP_BONUS_LINKED_STEP;
      }

      // Streak bonus every 4 sessions
      const newSessionCount = timerState.sessionsCompleted + 1;
      if (newSessionCount % 4 === 0) {
        xpEarned += XP_STREAK_BONUS;
      }

      await focusTimerRepo.completeSession(sessionIdRef.current, xpEarned);
      await grantXP(xpEarned, 'Focus session completed', 'focus', sessionIdRef.current);

      onSessionComplete?.();

      // Play completion sound if enabled
      if (settings.sound_enabled) {
        playNotificationSound();
      }

      // Determine next phase
      const isLongBreak = newSessionCount % settings.sessions_before_long_break === 0;
      const nextPhase: TimerPhase = isLongBreak ? 'long_break' : 'short_break';
      const nextDuration = isLongBreak ? settings.long_break : settings.short_break;

      setTimerState({
        phase: settings.auto_start_breaks ? nextPhase : 'idle',
        timeRemaining: nextDuration * 60,
        isRunning: settings.auto_start_breaks,
        sessionsCompleted: newSessionCount,
      });

      sessionIdRef.current = null;
      refresh();
    } else if (timerState.phase === 'short_break' || timerState.phase === 'long_break') {
      // Break complete
      if (settings.sound_enabled) {
        playNotificationSound();
      }

      setTimerState({
        phase: 'idle',
        timeRemaining: settings.work_duration * 60,
        isRunning: false,
        sessionsCompleted: timerState.sessionsCompleted,
      });
    }
  };

  const startWork = useCallback(
    async (linkedStepId: number | null = null, linkedQuestId: number | null = null) => {
      const session = await focusTimerRepo.startSession(settings.work_duration, linkedStepId, linkedQuestId);
      sessionIdRef.current = session.id;
      setCurrentSession(session);

      setTimerState({
        phase: 'work',
        timeRemaining: settings.work_duration * 60,
        isRunning: true,
        sessionsCompleted: timerState.sessionsCompleted,
      });
    },
    [settings.work_duration, timerState.sessionsCompleted]
  );

  const startBreak = useCallback(
    (isLongBreak: boolean = false) => {
      const duration = isLongBreak ? settings.long_break : settings.short_break;
      setTimerState({
        phase: isLongBreak ? 'long_break' : 'short_break',
        timeRemaining: duration * 60,
        isRunning: true,
        sessionsCompleted: timerState.sessionsCompleted,
      });
    },
    [settings.short_break, settings.long_break, timerState.sessionsCompleted]
  );

  const pause = useCallback(() => {
    setTimerState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const resume = useCallback(() => {
    setTimerState((prev) => ({ ...prev, isRunning: true }));
  }, []);

  const stop = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (sessionIdRef.current && timerState.phase === 'work') {
      await focusTimerRepo.cancelSession(sessionIdRef.current);
    }

    sessionIdRef.current = null;
    setCurrentSession(null);
    setTimerState({
      phase: 'idle',
      timeRemaining: settings.work_duration * 60,
      isRunning: false,
      sessionsCompleted: timerState.sessionsCompleted,
    });
    refresh();
  }, [settings.work_duration, timerState.phase, timerState.sessionsCompleted, refresh]);

  const skipBreak = useCallback(() => {
    if (timerState.phase === 'short_break' || timerState.phase === 'long_break') {
      setTimerState({
        phase: 'idle',
        timeRemaining: settings.work_duration * 60,
        isRunning: false,
        sessionsCompleted: timerState.sessionsCompleted,
      });
    }
  }, [settings.work_duration, timerState.phase, timerState.sessionsCompleted]);

  const updateSettings = useCallback(async (newSettings: Partial<Omit<FocusSettings, 'id'>>) => {
    const updated = await focusTimerRepo.updateFocusSettings(newSettings);
    setSettings(updated);

    // Update timer if idle
    if (timerState.phase === 'idle') {
      setTimerState((prev) => ({
        ...prev,
        timeRemaining: (newSettings.work_duration || prev.timeRemaining / 60) * 60,
      }));
    }
  }, [timerState.phase]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    settings,
    stats,
    timerState,
    currentSession,
    recentSessions,
    refresh,
    startWork,
    startBreak,
    pause,
    resume,
    stop,
    skipBreak,
    updateSettings,
    formatTime,
  };
}

function playNotificationSound() {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdGCdqIyYY19lf6O3qJyAa3B1gqKvpZNyYW50iaS7s5yBaWx3g6C4t5uGc2l0gJy0t5qGcWl0gJyzrZOAbWp0gJyzrZaEc2p2gJixsJmGeWt3gJivsJmGd2x3gZitq5OAbWp0f5asrJaAdmp1f5aqq5aAdmp1f5aqq5aAdmp1gJaqq5aAdmp1gJaqq5aAdmp1gJaqq5aAdmp1gJaqq5aAdmp1gJaqq5aAdmp1gJaqq5aAdmp1gJaqq5aAdmp1gJaqq5aAdmp1gJaqq5aAdmp1gJaqqZSAdWl0f5OqqZSAdWl0f5OqqZSAdWl0f5OqqZSAdWl0f5OqqZSAdWl0f5OqqZOAdGlzfpKppZKAc2hyfpCmpZCAbGZxfY+lppGBbGVxfY+lppGBbGVxfY+lppGBbGVxfY+lppGBbGVxfY+lppGBbGVxfY6kpJCAa2RvfI2iopCAbGRvfI2iopCAbGRvfI2iopCAbGRvfI2iopCAbGRvfI2iopCAbGRvfI2iopCAbGRvfI2iopCAbGRvfI2iopCAbGRvfI2iopCAbGRvfI2iopB/a2NueoykopB/a2NueoykopB/a2NueoykopB/a2NueoykopB/a2NueoykopB/a2NueoykopB/a2NueoykopB/a2NueoykopB/a2NueoykopB/a2NueoykopB/a2NueoykopB/a2NueoykopB/a2NueoykopB/a2NueoykopB/a2NueoykopB/a2NueoykopB/a2NueoykopB/a2NueoyjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI5/amJseImjnI4=');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    // Ignore audio errors
  }
}
