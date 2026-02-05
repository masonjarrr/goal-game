import { useState, useCallback, useEffect } from 'react';
import { CharacterClassWithSelection, CharacterClassSelection } from '../types/characterClass';
import * as characterClassRepo from '../db/repositories/characterClassRepo';

export function useCharacterClass() {
  const [classes, setClasses] = useState<CharacterClassWithSelection[]>([]);
  const [selection, setSelection] = useState<CharacterClassSelection | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setClasses(characterClassRepo.getClassesWithSelection());
    setSelection(characterClassRepo.getClassSelection());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectClass = useCallback(
    async (classId: number) => {
      const success = await characterClassRepo.selectClass(classId);
      if (success) {
        refresh();
      }
      return success;
    },
    [refresh]
  );

  const getSelectedClass = useCallback(() => {
    return classes.find((c) => c.is_selected) || null;
  }, [classes]);

  const getStatBonuses = useCallback(() => {
    return characterClassRepo.getClassStatBonuses();
  }, []);

  const getXpBonus = useCallback((xpType: string) => {
    return characterClassRepo.getClassXpBonus(xpType);
  }, []);

  const canChangeClass = useCallback(() => {
    if (!selection) return true;
    if (!selection.class_id) return true;
    return selection.changes_remaining > 0;
  }, [selection]);

  return {
    classes,
    selection,
    loading,
    refresh,
    selectClass,
    getSelectedClass,
    getStatBonuses,
    getXpBonus,
    canChangeClass,
  };
}
