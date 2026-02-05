import { useState, useCallback, useEffect } from 'react';
import { WeeklyBoss, BOSS_DAMAGE, getWeekStart, getWeekEnd } from '../types/weeklyBoss';
import * as bossRepo from '../db/repositories/weeklyBossRepo';
import * as streakRepo from '../db/repositories/streakRepo';

interface UseWeeklyBossOptions {
  grantXP: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
  addShields?: (count: number) => Promise<void>;
}

export function useWeeklyBoss({ grantXP, addShields }: UseWeeklyBossOptions) {
  const [boss, setBoss] = useState<WeeklyBoss | null>(null);
  const [loading, setLoading] = useState(true);
  const [justDefeated, setJustDefeated] = useState(false);

  const refresh = useCallback(async () => {
    const currentBoss = await bossRepo.generateWeeklyBoss();
    setBoss(currentBoss);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Check for week change
  useEffect(() => {
    const checkWeek = () => {
      const currentWeekStart = getWeekStart();
      if (boss && boss.week_start !== currentWeekStart) {
        refresh();
      }
    };

    const interval = setInterval(checkWeek, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [boss, refresh]);

  const dealDamage = useCallback(
    async (damageType: keyof typeof BOSS_DAMAGE, sourceDescription?: string) => {
      if (!boss || boss.is_defeated) return;

      const damage = BOSS_DAMAGE[damageType];
      const result = await bossRepo.dealDamage(boss.id, damageType, damage, sourceDescription);

      setBoss((prev) => prev ? { ...prev, current_hp: result.newHp, is_defeated: result.isDefeated } : null);

      // If boss was just defeated, grant rewards
      if (result.isDefeated && !boss.is_defeated) {
        setJustDefeated(true);
        await grantXP(boss.xp_reward, `Defeated ${boss.name}!`, 'boss', boss.id);

        // Grant bonus shields
        if (boss.bonus_shields > 0 && addShields) {
          await addShields(boss.bonus_shields);
        }
      }

      return result;
    },
    [boss, grantXP, addShields]
  );

  const dismissDefeatNotification = useCallback(() => {
    setJustDefeated(false);
  }, []);

  const weekStart = boss?.week_start || getWeekStart();
  const weekEnd = getWeekEnd(weekStart);
  const hpPercentage = boss ? Math.round((boss.current_hp / boss.max_hp) * 100) : 100;
  const damageDealt = boss ? boss.max_hp - boss.current_hp : 0;
  const totalDefeated = bossRepo.getTotalBossesDefeated();

  return {
    boss,
    loading,
    justDefeated,
    weekStart,
    weekEnd,
    hpPercentage,
    damageDealt,
    totalDefeated,
    refresh,
    dealDamage,
    dismissDefeatNotification,
  };
}
