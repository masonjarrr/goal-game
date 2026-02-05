import { useState, useCallback, useEffect } from 'react';
import { AchievementWithProgress, AchievementDefinition, AchievementUnlockResult } from '../types/achievement';
import * as achievementRepo from '../db/repositories/achievementRepo';

interface UseAchievementsOptions {
  grantXP: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
}

export function useAchievements({ grantXP }: UseAchievementsOptions) {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [stats, setStats] = useState({ total: 0, unlocked: 0, totalXp: 0, earnedXp: 0 });
  const [pendingUnlocks, setPendingUnlocks] = useState<AchievementUnlockResult[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setAchievements(achievementRepo.getAchievementsWithProgress());
    setStats(achievementRepo.getAchievementStats());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const processUnlocks = useCallback(
    async (definitionIds: number[]) => {
      const newUnlocks: AchievementUnlockResult[] = [];

      for (const defId of definitionIds) {
        const wasUnlocked = await achievementRepo.unlockAchievement(defId);
        if (wasUnlocked) {
          const achievement = achievementRepo.getAchievementById(defId);
          if (achievement) {
            await grantXP(achievement.xp_reward, `Achievement: ${achievement.name}`, 'achievement', defId);
            newUnlocks.push({ achievement, xpAwarded: achievement.xp_reward });
          }
        }
      }

      if (newUnlocks.length > 0) {
        setPendingUnlocks((prev) => [...prev, ...newUnlocks]);
        refresh();
      }

      return newUnlocks;
    },
    [grantXP, refresh]
  );

  const incrementProgress = useCallback(
    async (source: string, amount: number = 1) => {
      const unlockedIds = await achievementRepo.incrementProgress(source, amount);
      if (unlockedIds.length > 0) {
        await processUnlocks(unlockedIds);
      }
      refresh();
    },
    [processUnlocks, refresh]
  );

  const checkThreshold = useCallback(
    async (source: string, value: number) => {
      const unlockedIds = await achievementRepo.checkThreshold(source, value);
      if (unlockedIds.length > 0) {
        await processUnlocks(unlockedIds);
      }
      refresh();
    },
    [processUnlocks, refresh]
  );

  const dismissUnlock = useCallback((index: number) => {
    setPendingUnlocks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const dismissAllUnlocks = useCallback(() => {
    setPendingUnlocks([]);
  }, []);

  const getAchievementsByCategory = useCallback(
    (category: string) => {
      return achievements.filter((a) => a.category === category);
    },
    [achievements]
  );

  return {
    achievements,
    stats,
    loading,
    pendingUnlocks,
    refresh,
    incrementProgress,
    checkThreshold,
    dismissUnlock,
    dismissAllUnlocks,
    getAchievementsByCategory,
  };
}
