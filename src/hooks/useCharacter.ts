import { useState, useCallback } from 'react';
import { Character } from '../types/character';
import { getCharacter, updateCharacterName, getXPLog } from '../db/repositories/characterRepo';
import { XPLogEntry } from '../types/character';
import { awardXP, deductXP as deductXPUtil, XPAwardResult, XPDeductResult } from '../utils/xp';

export function useCharacter() {
  const [character, setCharacter] = useState<Character>(() => getCharacter());
  const [xpLog, setXPLog] = useState<XPLogEntry[]>(() => getXPLog());
  const [levelUpInfo, setLevelUpInfo] = useState<{ level: number; title: string } | null>(null);
  const [xpFloats, setXPFloats] = useState<{ id: number; amount: number }[]>([]);

  const refresh = useCallback(() => {
    setCharacter(getCharacter());
    setXPLog(getXPLog());
  }, []);

  const grantXP = useCallback(
    async (amount: number, reason: string, sourceType: string, sourceId?: number) => {
      const result: XPAwardResult = await awardXP(amount, reason, sourceType, sourceId ?? null);
      if (result.leveledUp) {
        setLevelUpInfo({ level: result.newLevel, title: result.newTitle });
      }
      // Show floating XP
      const floatId = Date.now();
      setXPFloats((prev) => [...prev, { id: floatId, amount }]);
      setTimeout(() => setXPFloats((prev) => prev.filter((f) => f.id !== floatId)), 1500);

      refresh();
      return result;
    },
    [refresh]
  );

  const deductXP = useCallback(
    async (amount: number, reason: string, sourceType: string, sourceId?: number) => {
      const result: XPDeductResult = await deductXPUtil(amount, reason, sourceType, sourceId ?? null);
      // Show floating negative XP
      const floatId = Date.now();
      setXPFloats((prev) => [...prev, { id: floatId, amount: -amount }]);
      setTimeout(() => setXPFloats((prev) => prev.filter((f) => f.id !== floatId)), 1500);

      refresh();
      return result;
    },
    [refresh]
  );

  const dismissLevelUp = useCallback(() => setLevelUpInfo(null), []);

  const setName = useCallback(
    async (name: string) => {
      await updateCharacterName(name);
      refresh();
    },
    [refresh]
  );

  return {
    character,
    xpLog,
    levelUpInfo,
    xpFloats,
    grantXP,
    deductXP,
    dismissLevelUp,
    setName,
    refresh,
  };
}
