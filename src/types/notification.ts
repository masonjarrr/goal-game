export interface ScheduledNotification {
  id: string;
  eventId?: number;
  buffLogId?: number;
  eventTitle?: string;
  buffName?: string;
  buffType?: 'buff' | 'debuff';
  eventDate?: string;
  eventTime?: string;
  triggerAt: string; // ISO timestamp
  fcmToken: string;
  deviceId: string;
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: string;
  notificationType: 'event' | 'buff_expiry';
}

export interface NotificationSettings {
  enabled: boolean;
  defaultReminderMinutes: number;
  fcmToken: string | null;
  deviceId: string;
}

export type ReminderOption =
  | null          // No reminder
  | 0             // At event time
  | 5             // 5 minutes before
  | 10            // 10 minutes before
  | 15            // 15 minutes before
  | 30            // 30 minutes before
  | 60;           // 1 hour before

export const REMINDER_OPTIONS: { value: ReminderOption; label: string }[] = [
  { value: null, label: 'No reminder' },
  { value: 0, label: 'At event time' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
];
