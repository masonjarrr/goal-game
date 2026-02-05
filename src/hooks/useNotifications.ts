import { useState, useEffect, useCallback } from 'react';
import { NotificationSettings, ReminderOption } from '../types/notification';
import { getDB, persist } from '../db/database';
import { getDeviceId, isFirebaseConfigured } from '../firebase/config';
import {
  requestNotificationPermission,
  disableNotifications,
  getNotificationPermissionState,
  isNotificationSupported,
  canRequestPermission,
  isIOSDevice,
  isStandaloneMode,
  setupForegroundMessaging,
  NotificationPermissionState,
} from '../firebase/messaging';
import {
  scheduleNotification,
  cancelNotification,
  scheduleBuffExpiryNotification,
  cancelBuffExpiryNotification,
} from '../firebase/firestore';

interface UseNotificationsReturn {
  settings: NotificationSettings;
  permissionState: NotificationPermissionState;
  isSupported: boolean;
  isConfigured: boolean;
  canEnable: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  loading: boolean;
  error: string | null;
  enableNotifications: () => Promise<boolean>;
  disableNotificationsHandler: () => Promise<void>;
  setDefaultReminderMinutes: (minutes: number) => Promise<void>;
  scheduleEventReminder: (
    eventId: number,
    eventTitle: string,
    eventDate: string,
    eventTime: string,
    reminderMinutes: number
  ) => Promise<void>;
  cancelEventReminder: (eventId: number) => Promise<void>;
  scheduleBuffExpiry: (
    buffLogId: number,
    buffName: string,
    buffType: 'buff' | 'debuff',
    expiresAt: string
  ) => Promise<void>;
  cancelBuffExpiry: (buffLogId: number) => Promise<void>;
}

function loadSettings(): NotificationSettings {
  const db = getDB();
  const deviceId = getDeviceId();

  const result = db.exec('SELECT enabled, default_reminder_minutes, fcm_token, device_id FROM notification_settings WHERE id = 1');

  if (result.length === 0 || result[0].values.length === 0) {
    // Create default settings
    db.run(
      'INSERT OR REPLACE INTO notification_settings (id, enabled, default_reminder_minutes, fcm_token, device_id) VALUES (1, 0, 15, NULL, ?)',
      [deviceId]
    );
    return {
      enabled: false,
      defaultReminderMinutes: 15,
      fcmToken: null,
      deviceId,
    };
  }

  const row = result[0].values[0];
  return {
    enabled: Boolean(row[0]),
    defaultReminderMinutes: row[1] as number,
    fcmToken: row[2] as string | null,
    deviceId: row[3] as string,
  };
}

async function saveSettings(settings: Partial<NotificationSettings>): Promise<void> {
  const db = getDB();
  const deviceId = getDeviceId();

  const current = loadSettings();
  const updated = { ...current, ...settings };

  db.run(
    `UPDATE notification_settings SET
      enabled = ?,
      default_reminder_minutes = ?,
      fcm_token = ?,
      device_id = ?,
      updated_at = datetime('now')
    WHERE id = 1`,
    [
      updated.enabled ? 1 : 0,
      updated.defaultReminderMinutes,
      updated.fcmToken,
      deviceId,
    ]
  );

  await persist();
}

export function useNotifications(): UseNotificationsReturn {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    defaultReminderMinutes: 15,
    fcmToken: null,
    deviceId: '',
  });
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = isNotificationSupported();
  const isConfigured = isFirebaseConfigured();
  const canEnable = canRequestPermission();
  const isIOS = isIOSDevice();
  const isStandalone = isStandaloneMode();

  // Load settings on mount
  useEffect(() => {
    try {
      const loaded = loadSettings();
      setSettings(loaded);
      setPermissionState(getNotificationPermissionState());
    } catch (err) {
      console.error('Failed to load notification settings:', err);
    }
  }, []);

  // Setup foreground message handler
  useEffect(() => {
    if (!settings.enabled || !settings.fcmToken) return;

    const unsubscribe = setupForegroundMessaging((payload) => {
      console.log('Notification received in foreground:', payload);
    });

    return unsubscribe;
  }, [settings.enabled, settings.fcmToken]);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await requestNotificationPermission();

      if (!result.success) {
        setError(result.error || 'Failed to enable notifications');
        return false;
      }

      await saveSettings({
        enabled: true,
        fcmToken: result.token,
      });

      setSettings((prev) => ({
        ...prev,
        enabled: true,
        fcmToken: result.token,
      }));

      setPermissionState('granted');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const disableNotificationsHandler = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await disableNotifications();

      await saveSettings({
        enabled: false,
        fcmToken: null,
      });

      setSettings((prev) => ({
        ...prev,
        enabled: false,
        fcmToken: null,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const setDefaultReminderMinutes = useCallback(async (minutes: number): Promise<void> => {
    await saveSettings({ defaultReminderMinutes: minutes });
    setSettings((prev) => ({ ...prev, defaultReminderMinutes: minutes }));
  }, []);

  const scheduleEventReminder = useCallback(
    async (
      eventId: number,
      eventTitle: string,
      eventDate: string,
      eventTime: string,
      reminderMinutes: number
    ): Promise<void> => {
      if (!settings.enabled || !settings.fcmToken) {
        return;
      }

      await scheduleNotification(
        eventId,
        eventTitle,
        eventDate,
        eventTime,
        reminderMinutes,
        settings.fcmToken
      );
    },
    [settings.enabled, settings.fcmToken]
  );

  const cancelEventReminder = useCallback(async (eventId: number): Promise<void> => {
    await cancelNotification(eventId);
  }, []);

  const scheduleBuffExpiry = useCallback(
    async (
      buffLogId: number,
      buffName: string,
      buffType: 'buff' | 'debuff',
      expiresAt: string
    ): Promise<void> => {
      if (!settings.enabled || !settings.fcmToken) {
        return;
      }

      await scheduleBuffExpiryNotification(
        buffLogId,
        buffName,
        buffType,
        expiresAt,
        settings.fcmToken
      );
    },
    [settings.enabled, settings.fcmToken]
  );

  const cancelBuffExpiry = useCallback(async (buffLogId: number): Promise<void> => {
    await cancelBuffExpiryNotification(buffLogId);
  }, []);

  return {
    settings,
    permissionState,
    isSupported,
    isConfigured,
    canEnable,
    isIOS,
    isStandalone,
    loading,
    error,
    enableNotifications,
    disableNotificationsHandler,
    setDefaultReminderMinutes,
    scheduleEventReminder,
    cancelEventReminder,
    scheduleBuffExpiry,
    cancelBuffExpiry,
  };
}
