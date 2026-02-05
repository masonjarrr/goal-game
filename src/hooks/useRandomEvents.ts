import { useState, useCallback, useEffect } from 'react';
import { ActiveEventWithTemplate, EVENT_TRIGGER_CHANCE, EVENT_CHECK_COOLDOWN_HOURS } from '../types/randomEvent';
import * as randomEventRepo from '../db/repositories/randomEventRepo';

const LAST_EVENT_CHECK_KEY = 'last_event_check';

interface UseRandomEventsOptions {
  grantXP: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
  addEnergy?: (amount: number, reason: string) => Promise<any>;
  addShields?: (amount: number) => Promise<any>;
  onEventTriggered?: (event: ActiveEventWithTemplate) => void;
}

export function useRandomEvents({ grantXP, addEnergy, addShields, onEventTriggered }: UseRandomEventsOptions) {
  const [activeEvents, setActiveEvents] = useState<ActiveEventWithTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingEvent, setPendingEvent] = useState<ActiveEventWithTemplate | null>(null);

  const refresh = useCallback(async () => {
    await randomEventRepo.expireOldEvents();
    setActiveEvents(randomEventRepo.getActiveEvents());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Check for random event on mount
  useEffect(() => {
    const checkForEvent = async () => {
      const lastCheck = localStorage.getItem(LAST_EVENT_CHECK_KEY);
      const now = Date.now();

      if (lastCheck) {
        const hoursSinceLastCheck = (now - parseInt(lastCheck, 10)) / (1000 * 60 * 60);
        if (hoursSinceLastCheck < EVENT_CHECK_COOLDOWN_HOURS) {
          return; // Too soon to check again
        }
      }

      // Random chance to trigger event
      if (Math.random() < EVENT_TRIGGER_CHANCE) {
        const event = await randomEventRepo.triggerRandomEvent();
        if (event) {
          setPendingEvent(event);
          onEventTriggered?.(event);
          refresh();
        }
      }

      localStorage.setItem(LAST_EVENT_CHECK_KEY, now.toString());
    };

    checkForEvent();
  }, [onEventTriggered, refresh]);

  const claimEvent = useCallback(
    async (eventId: number) => {
      const { success, effectValue } = await randomEventRepo.claimEvent(eventId);
      if (!success) return null;

      const event = activeEvents.find((e) => e.id === eventId);
      if (!event) return null;

      // Apply effect based on type
      switch (event.template.effect_type) {
        case 'xp_bonus':
          if (effectValue.amount) {
            await grantXP(effectValue.amount, `Event: ${event.template.name}`, 'event', eventId);
          }
          break;
        case 'energy_restore':
          if (effectValue.amount && addEnergy) {
            await addEnergy(effectValue.amount, `Event: ${event.template.name}`);
          }
          break;
        case 'streak_shield':
          if (effectValue.shields && addShields) {
            await addShields(effectValue.shields);
          }
          break;
        // XP multiplier and other modifiers are tracked by the active event itself
        default:
          break;
      }

      refresh();
      return event;
    },
    [activeEvents, grantXP, addEnergy, addShields, refresh]
  );

  const dismissPendingEvent = useCallback(() => {
    setPendingEvent(null);
  }, []);

  const getUnclaimedEvents = useCallback(() => {
    return activeEvents.filter((e) => !e.is_claimed);
  }, [activeEvents]);

  const getActiveModifiers = useCallback(() => {
    return activeEvents.filter((e) => e.is_claimed && e.template.type === 'modifier' && e.time_remaining > 0);
  }, [activeEvents]);

  const hasActiveXpMultiplier = useCallback(() => {
    return activeEvents.some(
      (e) => e.is_claimed && e.template.effect_type === 'xp_multiplier' && e.time_remaining > 0
    );
  }, [activeEvents]);

  const getXpMultiplier = useCallback(() => {
    const event = activeEvents.find(
      (e) => e.is_claimed && e.template.effect_type === 'xp_multiplier' && e.time_remaining > 0
    );
    if (!event) return 1;
    try {
      const value = JSON.parse(event.template.effect_value);
      return value.multiplier || 1;
    } catch {
      return 1;
    }
  }, [activeEvents]);

  return {
    activeEvents,
    loading,
    pendingEvent,
    refresh,
    claimEvent,
    dismissPendingEvent,
    getUnclaimedEvents,
    getActiveModifiers,
    hasActiveXpMultiplier,
    getXpMultiplier,
  };
}
