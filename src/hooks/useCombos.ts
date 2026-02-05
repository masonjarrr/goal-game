import { useState, useCallback, useEffect } from 'react';
import { ComboWithStatus } from '../types/combo';
import * as comboRepo from '../db/repositories/comboRepo';

interface UseCombosOptions {
  grantXP: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
  onComboActivated?: (combo: ComboWithStatus) => void;
}

export function useCombos({ grantXP, onComboActivated }: UseCombosOptions) {
  const [combos, setCombos] = useState<ComboWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setCombos(comboRepo.getCombosWithStatus());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const checkAndActivateCombos = useCallback(async () => {
    const readyCombos = comboRepo.checkReadyCombos();
    const activated: ComboWithStatus[] = [];

    for (const combo of readyCombos) {
      await comboRepo.activateCombo(combo.id, combo.active_buff_ids);
      await grantXP(combo.bonus_xp, `Combo activated: ${combo.name}`, 'combo', combo.id);
      activated.push(combo);
      onComboActivated?.(combo);
    }

    if (activated.length > 0) {
      refresh();
    }

    return activated;
  }, [grantXP, onComboActivated, refresh]);

  const claimCombo = useCallback(
    async (comboId: number) => {
      const combo = combos.find((c) => c.id === comboId);
      if (!combo || !combo.is_ready) return null;

      await comboRepo.activateCombo(comboId, combo.active_buff_ids);
      await grantXP(combo.bonus_xp, `Combo activated: ${combo.name}`, 'combo', comboId);
      onComboActivated?.(combo);
      refresh();
      return combo;
    },
    [combos, grantXP, onComboActivated, refresh]
  );

  const createCombo = useCallback(
    async (
      name: string,
      description: string,
      icon: string,
      requiredBuffIds: number[],
      timeWindowHours: number,
      bonusXp: number
    ) => {
      await comboRepo.createCombo(name, description, icon, requiredBuffIds, timeWindowHours, bonusXp);
      refresh();
    },
    [refresh]
  );

  const deleteCombo = useCallback(
    async (comboId: number) => {
      await comboRepo.deleteCombo(comboId);
      refresh();
    },
    [refresh]
  );

  const getReadyCombos = useCallback(() => {
    return combos.filter((c) => c.is_ready);
  }, [combos]);

  const getInProgressCombos = useCallback(() => {
    return combos.filter((c) => c.progress > 0 && c.progress < 100 && !c.is_ready);
  }, [combos]);

  return {
    combos,
    loading,
    refresh,
    checkAndActivateCombos,
    claimCombo,
    createCombo,
    deleteCombo,
    getReadyCombos,
    getInProgressCombos,
  };
}
