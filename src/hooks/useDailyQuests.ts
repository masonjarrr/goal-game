import { useState, useCallback, useEffect } from 'react';
import { DailyQuest, DailyQuestType, DAILY_QUEST_BONUS_XP } from '../types/dailyQuest';
import * as dailyQuestRepo from '../db/repositories/dailyQuestRepo';

interface UseDailyQuestsOptions {
  grantXP: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
}

export function useDailyQuests({ grantXP }: UseDailyQuestsOptions) {
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const todayQuests = await dailyQuestRepo.generateDailyQuests();
    setQuests(todayQuests);
    setBonusClaimed(dailyQuestRepo.isBonusClaimed());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Check for midnight reset
  useEffect(() => {
    const checkDate = () => {
      const today = new Date().toISOString().split('T')[0];
      if (quests.length > 0 && quests[0].date !== today) {
        refresh();
      }
    };

    const interval = setInterval(checkDate, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [quests, refresh]);

  const updateProgress = useCallback(
    async (questType: DailyQuestType, increment: number = 1) => {
      const updated = await dailyQuestRepo.updateQuestProgress(questType, increment);

      if (updated?.is_completed) {
        // Grant XP for completing the quest
        await grantXP(updated.xp_reward, `Daily Quest: ${updated.title}`, 'daily_quest', updated.id);
      }

      await refresh();
      return updated;
    },
    [grantXP, refresh]
  );

  const claimBonus = useCallback(async () => {
    const allCompleted = quests.every((q) => q.is_completed);
    if (!allCompleted || bonusClaimed) return false;

    await dailyQuestRepo.claimBonus();
    await grantXP(DAILY_QUEST_BONUS_XP, 'Daily Quest Bonus: All quests completed!', 'daily_quest_bonus');
    setBonusClaimed(true);
    return true;
  }, [quests, bonusClaimed, grantXP]);

  const checkNoDebuffs = useCallback(async () => {
    await dailyQuestRepo.checkNoDebuffsQuest();
    await refresh();
  }, [refresh]);

  const allCompleted = quests.every((q) => q.is_completed);
  const completedCount = quests.filter((q) => q.is_completed).length;
  const totalXpEarned = quests
    .filter((q) => q.is_completed)
    .reduce((sum, q) => sum + q.xp_reward, 0);

  return {
    quests,
    loading,
    allCompleted,
    completedCount,
    bonusClaimed,
    bonusXp: DAILY_QUEST_BONUS_XP,
    totalXpEarned,
    refresh,
    updateProgress,
    claimBonus,
    checkNoDebuffs,
  };
}
