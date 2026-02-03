import { useState, useCallback, useEffect } from 'react';
import { BuffDefinition, ActiveBuff } from '../types/buff';
import { Stats } from '../types/character';
import * as buffRepo from '../db/repositories/buffRepo';
import { getActiveBuffs, aggregateStats, expireBuffs } from '../utils/buffEngine';
import { XP_DAILY_BUFF, XP_STREAK_7DAY } from '../utils/constants';

interface UseBuffsOptions {
  grantXP: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
}

export function useBuffs({ grantXP }: UseBuffsOptions) {
  const [definitions, setDefinitions] = useState<BuffDefinition[]>([]);
  const [activeBuffs, setActiveBuffs] = useState<ActiveBuff[]>([]);
  const [stats, setStats] = useState<Stats>({ stamina: 10, willpower: 10, health: 10, focus: 10, charisma: 10 });

  const refresh = useCallback(async () => {
    await expireBuffs();
    setDefinitions(buffRepo.getBuffDefinitions());
    const active = getActiveBuffs();
    setActiveBuffs(active);
    setStats(aggregateStats(active));
  }, []);

  // Poll for expiry every 60 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const createDefinition = useCallback(
    async (
      name: string,
      description: string,
      type: string,
      icon: string,
      durationHours: number,
      statEffects: string
    ) => {
      await buffRepo.createBuffDefinition(name, description, type, icon, durationHours, statEffects);
      refresh();
    },
    [refresh]
  );

  const deleteDefinition = useCallback(
    async (id: number) => {
      await buffRepo.deleteBuffDefinition(id);
      refresh();
    },
    [refresh]
  );

  const activateBuff = useCallback(
    async (definitionId: number) => {
      const logId = await buffRepo.activateBuff(definitionId);
      const def = definitions.find((d) => d.id === definitionId);

      // Award XP for buff activation (habits)
      if (def && def.type === 'buff') {
        await grantXP(XP_DAILY_BUFF, `Activated buff: ${def.name}`, 'buff', logId);

        // Check 7-day streak
        const streak = buffRepo.getStreakDays(definitionId);
        if (streak > 0 && streak % 7 === 0) {
          await grantXP(XP_STREAK_7DAY, `7-day streak: ${def.name}`, 'streak', definitionId);
        }
      }

      refresh();
    },
    [refresh, definitions, grantXP]
  );

  const deactivateBuff = useCallback(
    async (logId: number) => {
      await buffRepo.deactivateBuff(logId);
      refresh();
    },
    [refresh]
  );

  return {
    definitions,
    activeBuffs,
    stats,
    refresh,
    createDefinition,
    deleteDefinition,
    activateBuff,
    deactivateBuff,
  };
}
