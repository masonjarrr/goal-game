import { useState, useCallback, useEffect } from 'react';
import { BuffDefinition, ActiveBuff } from '../types/buff';
import { Stats } from '../types/character';
import * as buffRepo from '../db/repositories/buffRepo';
import { getActiveBuffs, aggregateStats, expireBuffs } from '../utils/buffEngine';
import { XP_DAILY_BUFF, XP_STREAK_7DAY } from '../utils/constants';

interface UseBuffsOptions {
  grantXP: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
  deductXP: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
  scheduleBuffExpiry?: (
    buffLogId: number,
    buffName: string,
    buffType: 'buff' | 'debuff',
    expiresAt: string
  ) => Promise<void>;
  cancelBuffExpiry?: (buffLogId: number) => Promise<void>;
  onBuffActivated?: (type: 'buff' | 'debuff') => void;
}

export function useBuffs({ grantXP, deductXP, scheduleBuffExpiry, cancelBuffExpiry, onBuffActivated }: UseBuffsOptions) {
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
      const result = await buffRepo.activateBuff(definitionId);
      const def = definitions.find((d) => d.id === definitionId);

      // Check if buff has any stat effects (skip XP for test buffs with no stats)
      const hasStatEffects = def && def.stat_effects && def.stat_effects !== '{}' && (() => {
        try {
          const effects = JSON.parse(def.stat_effects);
          return Object.values(effects).some((v) => v !== 0);
        } catch {
          return false;
        }
      })();

      // Award XP for every buff activation (including stacking)
      if (def && def.type === 'buff' && hasStatEffects) {
        await grantXP(XP_DAILY_BUFF, `Activated buff: ${def.name}`, 'buff', result.logId);

        // Check 7-day streak (only on first activation, not stacks)
        if (!result.isStacked) {
          const streak = buffRepo.getStreakDays(definitionId);
          if (streak > 0 && streak % 7 === 0) {
            await grantXP(XP_STREAK_7DAY, `7-day streak: ${def.name}`, 'streak', definitionId);
          }
        }
      }

      // Notify daily quest tracker (only if has stat effects)
      if (def && onBuffActivated && hasStatEffects) {
        onBuffActivated(def.type);
      }

      // Schedule/update notification for buff expiry
      if (def && scheduleBuffExpiry) {
        // Cancel existing notification first (if stacking)
        if (result.isStacked && cancelBuffExpiry) {
          await cancelBuffExpiry(result.logId);
        }
        // Schedule new notification with updated expiry time
        await scheduleBuffExpiry(result.logId, def.name, def.type, result.newExpiresAt);
      }

      refresh();
    },
    [refresh, definitions, grantXP, scheduleBuffExpiry, cancelBuffExpiry, onBuffActivated]
  );

  const deactivateBuff = useCallback(
    async (logId: number) => {
      const result = await buffRepo.deactivateBuff(logId);

      if (result) {
        // Always deduct XP for each undo (since each activation awards XP)
        if (result.buffType === 'buff') {
          await deductXP(XP_DAILY_BUFF, `Undo buff: ${result.buffName}`, 'buff_undo', logId);
        }

        if (result.fullyDeactivated) {
          // Buff was completely removed - cancel notification
          if (cancelBuffExpiry) {
            await cancelBuffExpiry(logId);
          }
        } else {
          // Buff still has time remaining - reschedule notification with new expiry
          if (scheduleBuffExpiry && cancelBuffExpiry && result.newExpiresAt) {
            await cancelBuffExpiry(logId);
            await scheduleBuffExpiry(logId, result.buffName, result.buffType, result.newExpiresAt);
          }
        }
      }

      refresh();
    },
    [refresh, cancelBuffExpiry, scheduleBuffExpiry, deductXP]
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
