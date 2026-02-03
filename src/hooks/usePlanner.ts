import { useState, useCallback, useEffect } from 'react';
import { PlannerEvent, PlannerView } from '../types/planner';
import * as plannerRepo from '../db/repositories/plannerRepo';
import { today, getWeekDates, addDays } from '../utils/dates';

interface UsePlannerOptions {
  grantXP: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
}

export function usePlanner({ grantXP }: UsePlannerOptions) {
  const [view, setView] = useState<PlannerView>('day');
  const [currentDate, setCurrentDate] = useState(today());
  const [events, setEvents] = useState<PlannerEvent[]>([]);

  const refresh = useCallback(() => {
    if (view === 'day') {
      setEvents(plannerRepo.getEvents(currentDate));
    } else if (view === 'week') {
      const weekDates = getWeekDates(currentDate);
      setEvents(plannerRepo.getEvents(undefined, weekDates[0], weekDates[6]));
    } else {
      const d = new Date(currentDate + 'T00:00:00');
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      setEvents(plannerRepo.getEvents(undefined, firstDay, lastDay));
    }
  }, [view, currentDate]);

  // Auto-refresh when view or date changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  const createEvent = useCallback(
    async (
      title: string,
      date: string,
      description?: string,
      startTime?: string | null,
      endTime?: string | null,
      questId?: number | null,
      stepId?: number | null
    ) => {
      await plannerRepo.createEvent(title, date, description, startTime, endTime, questId, stepId);
      refresh();
    },
    [refresh]
  );

  const completeEvent = useCallback(
    async (eventId: number) => {
      await plannerRepo.completeEvent(eventId);
      const ev = events.find((e) => e.id === eventId);
      if (ev && (ev.quest_id || ev.step_id)) {
        await grantXP(10, `Completed linked event: ${ev.title}`, 'event', eventId);
      }
      refresh();
    },
    [refresh, events, grantXP]
  );

  const uncompleteEvent = useCallback(
    async (eventId: number) => {
      await plannerRepo.uncompleteEvent(eventId);
      refresh();
    },
    [refresh]
  );

  const deleteEvent = useCallback(
    async (eventId: number) => {
      await plannerRepo.deleteEvent(eventId);
      refresh();
    },
    [refresh]
  );

  const navigateDay = useCallback(
    (direction: number) => {
      if (view === 'day') {
        setCurrentDate(addDays(currentDate, direction));
      } else if (view === 'week') {
        setCurrentDate(addDays(currentDate, direction * 7));
      } else {
        const d = new Date(currentDate + 'T00:00:00');
        d.setMonth(d.getMonth() + direction);
        setCurrentDate(d.toISOString().split('T')[0]);
      }
    },
    [view, currentDate]
  );

  const goToToday = useCallback(() => setCurrentDate(today()), []);

  return {
    view,
    setView,
    currentDate,
    setCurrentDate,
    events,
    refresh,
    createEvent,
    completeEvent,
    uncompleteEvent,
    deleteEvent,
    navigateDay,
    goToToday,
  };
}
