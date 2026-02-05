import { useState, useCallback, useEffect } from 'react';
import { WeeklyReview, WeeklySummaryData, WEEKLY_REVIEW_XP } from '../types/weeklyReview';
import * as weeklyReviewRepo from '../db/repositories/weeklyReviewRepo';

interface UseWeeklyReviewOptions {
  grantXP: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
}

export function useWeeklyReview({ grantXP }: UseWeeklyReviewOptions) {
  const [currentReview, setCurrentReview] = useState<WeeklyReview | null>(null);
  const [summaryData, setSummaryData] = useState<WeeklySummaryData | null>(null);
  const [recentReviews, setRecentReviews] = useState<WeeklyReview[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setCurrentReview(weeklyReviewRepo.getCurrentWeekReview());
    setRecentReviews(weeklyReviewRepo.getRecentReviews(10));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const generateSummary = useCallback(async () => {
    const summary = await weeklyReviewRepo.generateWeeklySummary();
    setSummaryData(summary);
    const review = await weeklyReviewRepo.createOrUpdateReview(summary);
    setCurrentReview(review);
    return { summary, review };
  }, []);

  const updateContent = useCallback(
    async (wins: string, challenges: string, priorities: string[], notes: string) => {
      if (!currentReview) return;
      await weeklyReviewRepo.updateReviewContent(currentReview.id, wins, challenges, priorities, notes);
      refresh();
    },
    [currentReview, refresh]
  );

  const completeReview = useCallback(async () => {
    if (!currentReview || currentReview.is_completed) return;

    await weeklyReviewRepo.completeReview(currentReview.id, WEEKLY_REVIEW_XP);
    await grantXP(WEEKLY_REVIEW_XP, 'Completed weekly review', 'weekly_review', currentReview.id);
    refresh();
  }, [currentReview, grantXP, refresh]);

  const getWeekStart = useCallback(() => {
    return weeklyReviewRepo.getWeekStart();
  }, []);

  const getSummaryFromReview = useCallback((review: WeeklyReview): WeeklySummaryData => {
    try {
      return JSON.parse(review.summary_data);
    } catch {
      return {
        steps_completed: 0,
        quests_completed: 0,
        goals_completed: 0,
        buffs_activated: 0,
        debuffs_activated: 0,
        xp_earned: 0,
        boss_damage_dealt: 0,
        boss_defeated: false,
        streaks_maintained: 0,
        achievements_unlocked: 0,
        focus_sessions: 0,
        focus_minutes: 0,
        routines_completed: 0,
        combos_activated: 0,
      };
    }
  }, []);

  const getPrioritiesFromReview = useCallback((review: WeeklyReview): string[] => {
    try {
      return JSON.parse(review.priorities);
    } catch {
      return [];
    }
  }, []);

  return {
    currentReview,
    summaryData,
    recentReviews,
    loading,
    refresh,
    generateSummary,
    updateContent,
    completeReview,
    getWeekStart,
    getSummaryFromReview,
    getPrioritiesFromReview,
  };
}
