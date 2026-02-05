import { useState, useCallback, useEffect } from 'react';
import { InventoryItemWithDefinition, EquippedItemWithDefinition } from '../types/inventory';
import * as inventoryRepo from '../db/repositories/inventoryRepo';

interface UseInventoryOptions {
  grantXP?: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
  addEnergy?: (amount: number, reason: string) => Promise<any>;
  addShields?: (amount: number) => Promise<any>;
}

export function useInventory({ grantXP, addEnergy, addShields }: UseInventoryOptions = {}) {
  const [inventory, setInventory] = useState<InventoryItemWithDefinition[]>([]);
  const [equipped, setEquipped] = useState<EquippedItemWithDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setInventory(inventoryRepo.getInventory());
    setEquipped(inventoryRepo.getEquippedItems());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (itemId: number, quantity: number = 1, source: string = 'reward') => {
      await inventoryRepo.addItem(itemId, quantity, source);
      refresh();
    },
    [refresh]
  );

  const removeItem = useCallback(
    async (inventoryId: number, quantity: number = 1) => {
      await inventoryRepo.removeItem(inventoryId, quantity);
      refresh();
    },
    [refresh]
  );

  const equipItem = useCallback(
    async (inventoryId: number) => {
      await inventoryRepo.equipItem(inventoryId);
      refresh();
    },
    [refresh]
  );

  const unequipItem = useCallback(
    async (slot: string) => {
      await inventoryRepo.unequipItem(slot);
      refresh();
    },
    [refresh]
  );

  const useConsumable = useCallback(
    async (inventoryId: number) => {
      const item = inventory.find((i) => i.id === inventoryId);
      if (!item || item.definition.type !== 'consumable') return false;

      const effect = item.definition.special_effect;
      if (!effect) return false;

      const [action, value] = effect.split(':');
      const numValue = parseInt(value, 10);

      switch (action) {
        case 'restore_energy':
          if (addEnergy) {
            await addEnergy(numValue, `Used ${item.definition.name}`);
          }
          break;
        case 'grant_xp':
          if (grantXP) {
            await grantXP(numValue, `Used ${item.definition.name}`, 'consumable', inventoryId);
          }
          break;
        case 'add_shield':
          if (addShields) {
            await addShields(numValue);
          }
          break;
        default:
          return false;
      }

      await inventoryRepo.removeItem(inventoryId, 1);
      refresh();
      return true;
    },
    [inventory, grantXP, addEnergy, addShields, refresh]
  );

  const getStatBonuses = useCallback(() => {
    return inventoryRepo.getEquippedStatBonuses();
  }, []);

  const getEquipmentBySlot = useCallback(
    (slot: string) => {
      return equipped.find((e) => e.slot === slot) || null;
    },
    [equipped]
  );

  const getInventoryByType = useCallback(
    (type: string) => {
      return inventory.filter((i) => i.definition.type === type);
    },
    [inventory]
  );

  return {
    inventory,
    equipped,
    loading,
    refresh,
    addItem,
    removeItem,
    equipItem,
    unequipItem,
    useConsumable,
    getStatBonuses,
    getEquipmentBySlot,
    getInventoryByType,
  };
}
