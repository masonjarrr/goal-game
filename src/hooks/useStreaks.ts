import { useState, useCallback, useEffect } from 'react';
import { StreakInfo, StreakFreeze, STREAK_MILESTONES } from '../types/streak';
import * as streakRepo from '../db/repositories/streakRepo';

interface UseStreaksOptions {
  grantXP: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
}

export function useStreaks({ grantXP }: UseStreaksOptions) {
  const [streakInfos, setStreakInfos] = useState<Map<number, StreakInfo>>(new Map());
  const [shieldCount, setShieldCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setStreakInfos(streakRepo.getAllStreakInfos());
    setShieldCount(streakRepo.getShieldCount());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getStreakForBuff = useCallback(
    (buffDefinitionId: number): StreakInfo => {
      return streakInfos.get(buffDefinitionId) || {
        buffDefinitionId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivatedDate: null,
        isAtRisk: false,
        shieldActive: false,
      };
    },
    [streakInfos]
  );

  const useShield = useCallback(
    async (buffDefinitionId: number): Promise<boolean> => {
      const success = await streakRepo.useShield(buffDefinitionId);
      if (success) {
        refresh();
      }
      return success;
    },
    [refresh]
  );

  const addFreeze = useCallback(
    async (buffDefinitionId: number, freezeDate: string, reason?: string) => {
      await streakRepo.addStreakFreeze(buffDefinitionId, freezeDate, reason);
      refresh();
    },
    [refresh]
  );

  const removeFreeze = useCallback(
    async (freezeId: number) => {
      await streakRepo.removeStreakFreeze(freezeId);
      refresh();
    },
    [refresh]
  );

  const getFreezes = useCallback(
    (buffDefinitionId: number): StreakFreeze[] => {
      return streakRepo.getStreakFreezes(buffDefinitionId);
    },
    []
  );

  const claimMilestones = useCallback(
    async (buffDefinitionId: number) => {
      const streakInfo = getStreakForBuff(buffDefinitionId);
      const unclaimed = streakRepo.getUnclaimedMilestones(buffDefinitionId, streakInfo.currentStreak);

      for (const milestone of unclaimed) {
        await grantXP(milestone.bonusXp, `Streak Milestone: ${milestone.title} (${milestone.days} days)`, 'streak_milestone', buffDefinitionId);
        await streakRepo.claimMilestone(buffDefinitionId, milestone.days);
      }

      refresh();
      return unclaimed;
    },
    [getStreakForBuff, grantXP, refresh]
  );

  const getUnclaimedMilestones = useCallback(
    (buffDefinitionId: number) => {
      const streakInfo = getStreakForBuff(buffDefinitionId);
      return streakRepo.getUnclaimedMilestones(buffDefinitionId, streakInfo.currentStreak);
    },
    [getStreakForBuff]
  );

  const addShields = useCallback(
    async (count: number) => {
      await streakRepo.addShields(count);
      refresh();
    },
    [refresh]
  );

  return {
    streakInfos,
    shieldCount,
    loading,
    refresh,
    getStreakForBuff,
    useShield,
    addFreeze,
    removeFreeze,
    getFreezes,
    claimMilestones,
    getUnclaimedMilestones,
    addShields,
  };
}
