import { useState, useCallback, useEffect } from 'react';
import {
  RoutineWithSteps,
  RoutineStepWithStatus,
  RoutineType,
  ROUTINE_COMPLETION_XP,
  ROUTINE_STREAK_BONUS_XP,
} from '../types/routine';
import * as routineRepo from '../db/repositories/routineRepo';

interface UseRoutinesOptions {
  grantXP: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
  onRoutineComplete?: (routineId: number) => void;
}

export function useRoutines({ grantXP, onRoutineComplete }: UseRoutinesOptions) {
  const [routines, setRoutines] = useState<RoutineWithSteps[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setRoutines(routineRepo.getRoutinesWithSteps());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createRoutine = useCallback(
    async (name: string, type: RoutineType, description: string, bonusXp: number = ROUTINE_COMPLETION_XP) => {
      await routineRepo.createRoutine(name, type, description, bonusXp);
      refresh();
    },
    [refresh]
  );

  const addStep = useCallback(
    async (
      routineId: number,
      title: string,
      description: string,
      linkedBuffId: number | null,
      durationMinutes: number,
      isOptional: boolean
    ) => {
      await routineRepo.addRoutineStep(routineId, title, description, linkedBuffId, durationMinutes, isOptional);
      refresh();
    },
    [refresh]
  );

  const deleteStep = useCallback(
    async (stepId: number) => {
      await routineRepo.deleteRoutineStep(stepId);
      refresh();
    },
    [refresh]
  );

  const deleteRoutine = useCallback(
    async (routineId: number) => {
      await routineRepo.deleteRoutine(routineId);
      refresh();
    },
    [refresh]
  );

  const startRoutine = useCallback(
    async (routineId: number) => {
      await routineRepo.startRoutine(routineId);
      refresh();
    },
    [refresh]
  );

  const completeStep = useCallback(
    async (routineId: number, stepId: number) => {
      const routine = routines.find((r) => r.id === routineId);
      if (!routine?.todayLog) return;

      await routineRepo.completeRoutineStep(routine.todayLog.id, stepId);

      // Check if routine is now complete
      if (routineRepo.isRoutineComplete(routineId)) {
        // Calculate XP
        let xp = routine.bonus_xp;
        const streak = routineRepo.getRoutineStreak(routineId);
        if (streak && streak.current_streak > 0 && streak.current_streak % 7 === 0) {
          xp += ROUTINE_STREAK_BONUS_XP;
        }

        await routineRepo.completeRoutine(routineId, xp);
        await grantXP(xp, `Completed routine: ${routine.name}`, 'routine', routineId);
        onRoutineComplete?.(routineId);
      }

      refresh();
    },
    [routines, grantXP, onRoutineComplete, refresh]
  );

  const skipStep = useCallback(
    async (routineId: number, stepId: number) => {
      const routine = routines.find((r) => r.id === routineId);
      if (!routine?.todayLog) return;

      await routineRepo.skipRoutineStep(routine.todayLog.id, stepId);

      // Check if routine is now complete
      if (routineRepo.isRoutineComplete(routineId)) {
        let xp = routine.bonus_xp;
        const streak = routineRepo.getRoutineStreak(routineId);
        if (streak && streak.current_streak > 0 && streak.current_streak % 7 === 0) {
          xp += ROUTINE_STREAK_BONUS_XP;
        }

        await routineRepo.completeRoutine(routineId, xp);
        await grantXP(xp, `Completed routine: ${routine.name}`, 'routine', routineId);
        onRoutineComplete?.(routineId);
      }

      refresh();
    },
    [routines, grantXP, onRoutineComplete, refresh]
  );

  const getStepsWithStatus = useCallback((routineId: number): RoutineStepWithStatus[] => {
    return routineRepo.getStepsWithStatus(routineId);
  }, []);

  const getMorningRoutines = useCallback(() => {
    return routines.filter((r) => r.type === 'morning');
  }, [routines]);

  const getEveningRoutines = useCallback(() => {
    return routines.filter((r) => r.type === 'evening');
  }, [routines]);

  const getCustomRoutines = useCallback(() => {
    return routines.filter((r) => r.type === 'custom');
  }, [routines]);

  return {
    routines,
    loading,
    refresh,
    createRoutine,
    addStep,
    deleteStep,
    deleteRoutine,
    startRoutine,
    completeStep,
    skipStep,
    getStepsWithStatus,
    getMorningRoutines,
    getEveningRoutines,
    getCustomRoutines,
  };
}
