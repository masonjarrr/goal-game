import { useState, useCallback, useEffect } from 'react';
import { PlannerEvent, PlannerView } from '../types/planner';
import * as plannerRepo from '../db/repositories/plannerRepo';
import { today, getWeekDates, addDays } from '../utils/dates';
import { ReminderOption } from '../types/notification';

interface UsePlannerOptions {
  grantXP: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
  scheduleEventReminder?: (
    eventId: number,
    eventTitle: string,
    eventDate: string,
    eventTime: string,
    reminderMinutes: number
  ) => Promise<void>;
  cancelEventReminder?: (eventId: number) => Promise<void>;
  onEventComplete?: () => void;
}

export function usePlanner({ grantXP, scheduleEventReminder, cancelEventReminder, onEventComplete }: UsePlannerOptions) {
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
      stepId?: number | null,
      reminderMinutes?: ReminderOption
    ) => {
      const eventId = await plannerRepo.createEvent(
        title,
        date,
        description,
        startTime,
        endTime,
        questId,
        stepId,
        reminderMinutes
      );

      // Schedule notification if reminder is set and event has a start time
      if (reminderMinutes !== null && reminderMinutes !== undefined && startTime && scheduleEventReminder) {
        await scheduleEventReminder(eventId, title, date, startTime, reminderMinutes);
      }

      refresh();
    },
    [refresh, scheduleEventReminder]
  );

  const completeEvent = useCallback(
    async (eventId: number) => {
      await plannerRepo.completeEvent(eventId);
      const ev = events.find((e) => e.id === eventId);
      if (ev && (ev.quest_id || ev.step_id)) {
        await grantXP(10, `Completed linked event: ${ev.title}`, 'event', eventId);
      }
      // Notify daily quest tracker
      if (onEventComplete) {
        onEventComplete();
      }
      // Cancel any pending reminder for this event
      if (cancelEventReminder) {
        await cancelEventReminder(eventId);
      }
      refresh();
    },
    [refresh, events, grantXP, cancelEventReminder, onEventComplete]
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
      // Cancel any pending reminder for this event
      if (cancelEventReminder) {
        await cancelEventReminder(eventId);
      }
      await plannerRepo.deleteEvent(eventId);
      refresh();
    },
    [refresh, cancelEventReminder]
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
