import { useState, useCallback, useEffect } from 'react';
import { EnergyState, EnergyDebuffEffect, ENERGY_LOW_THRESHOLD, ENERGY_EMPTY_THRESHOLD, FATIGUED_DEBUFF, EXHAUSTED_DEBUFF } from '../types/energy';
import * as energyRepo from '../db/repositories/energyRepo';

export function useEnergy() {
  const [state, setState] = useState<EnergyState>(() => energyRepo.getEnergyState());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setState(energyRepo.getEnergyState());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-regenerate energy every minute
  useEffect(() => {
    const regen = async () => {
      const { regenerated, newState } = await energyRepo.regenerateEnergy();
      if (regenerated > 0) {
        setState(newState);
      }
    };

    // Initial regen check
    regen();

    const interval = setInterval(regen, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  const spendEnergy = useCallback(async (actionType: string, sourceId: number | null = null) => {
    const result = await energyRepo.spendEnergy(actionType, sourceId);
    if (result.success) {
      setState(result.newState);
    }
    return result;
  }, []);

  const addEnergy = useCallback(async (amount: number, reason: string) => {
    const newState = await energyRepo.updateEnergy(amount, reason, 'bonus');
    setState(newState);
    return newState;
  }, []);

  const restoreFullEnergy = useCallback(async () => {
    const newState = await energyRepo.restoreFullEnergy();
    setState(newState);
    return newState;
  }, []);

  const canAfford = useCallback((actionType: string) => {
    return energyRepo.canAfford(actionType);
  }, []);

  const getActionCost = useCallback((actionType: string) => {
    return energyRepo.getActionCost(actionType);
  }, []);

  // Calculate energy debuff effects
  const getEnergyDebuffs = useCallback((): EnergyDebuffEffect[] => {
    const debuffs: EnergyDebuffEffect[] = [];

    if (state.current_energy <= ENERGY_EMPTY_THRESHOLD) {
      debuffs.push({
        active: true,
        name: EXHAUSTED_DEBUFF.name,
        icon: EXHAUSTED_DEBUFF.icon,
        effects: EXHAUSTED_DEBUFF.effects,
      });
    } else if (state.current_energy <= ENERGY_LOW_THRESHOLD) {
      debuffs.push({
        active: true,
        name: FATIGUED_DEBUFF.name,
        icon: FATIGUED_DEBUFF.icon,
        effects: FATIGUED_DEBUFF.effects,
      });
    }

    return debuffs;
  }, [state.current_energy]);

  // Get total stat penalties from energy debuffs
  const getEnergyStatPenalties = useCallback((): Record<string, number> => {
    const debuffs = getEnergyDebuffs();
    const penalties: Record<string, number> = {};

    for (const debuff of debuffs) {
      for (const [stat, value] of Object.entries(debuff.effects)) {
        penalties[stat] = (penalties[stat] || 0) + value;
      }
    }

    return penalties;
  }, [getEnergyDebuffs]);

  const percentage = Math.round((state.current_energy / (state.max_energy + state.bonus_energy)) * 100);
  const isLow = state.current_energy <= ENERGY_LOW_THRESHOLD;
  const isEmpty = state.current_energy <= ENERGY_EMPTY_THRESHOLD;

  return {
    state,
    loading,
    refresh,
    spendEnergy,
    addEnergy,
    restoreFullEnergy,
    canAfford,
    getActionCost,
    getEnergyDebuffs,
    getEnergyStatPenalties,
    percentage,
    isLow,
    isEmpty,
  };
}
