import { useState, useCallback, useEffect } from 'react';
import { TerritoryWithProgress } from '../types/territory';
import * as territoryRepo from '../db/repositories/territoryRepo';

interface UseTerritoryOptions {
  characterLevel: number;
  grantXP: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
}

export function useTerritory({ characterLevel, grantXP }: UseTerritoryOptions) {
  const [territories, setTerritories] = useState<TerritoryWithProgress[]>([]);
  const [currentTerritory, setCurrentTerritory] = useState<TerritoryWithProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setTerritories(territoryRepo.getTerritoriesWithProgress(characterLevel));
    setCurrentTerritory(territoryRepo.getCurrentTerritory());
    setLoading(false);
  }, [characterLevel]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-discover territories when level changes
  useEffect(() => {
    const checkDiscoveries = async () => {
      const allTerritories = territoryRepo.getTerritories();
      for (const territory of allTerritories) {
        if (territory.unlock_level <= characterLevel) {
          const progress = territories.find((t) => t.id === territory.id);
          if (!progress?.discovered) {
            await territoryRepo.discoverTerritory(territory.id);
          }
        }
      }
      refresh();
    };
    checkDiscoveries();
  }, [characterLevel, territories, refresh]);

  const travelTo = useCallback(
    async (territoryId: number) => {
      const territory = territories.find((t) => t.id === territoryId);
      if (!territory || territory.is_locked || !territory.discovered) return false;

      await territoryRepo.setCurrentTerritory(territoryId);
      refresh();
      return true;
    },
    [territories, refresh]
  );

  const completeChallenge = useCallback(
    async (territoryId: number, challengeIndex: number) => {
      await territoryRepo.completeChallenge(territoryId, challengeIndex);
      refresh();
    },
    [refresh]
  );

  const completeTerritory = useCallback(
    async (territoryId: number) => {
      const territory = territories.find((t) => t.id === territoryId);
      if (!territory || territory.completed) return;

      await territoryRepo.completeTerritory(territoryId);

      // Grant rewards
      try {
        const rewards = JSON.parse(territory.rewards);
        if (rewards.xp) {
          await grantXP(rewards.xp, `Completed territory: ${territory.name}`, 'territory', territoryId);
        }
      } catch { /* ignore */ }

      refresh();
    },
    [territories, grantXP, refresh]
  );

  const getDiscoveredTerritories = useCallback(() => {
    return territories.filter((t) => t.discovered);
  }, [territories]);

  const getCompletedTerritories = useCallback(() => {
    return territories.filter((t) => t.completed);
  }, [territories]);

  return {
    territories,
    currentTerritory,
    loading,
    refresh,
    travelTo,
    completeChallenge,
    completeTerritory,
    getDiscoveredTerritories,
    getCompletedTerritories,
  };
}
