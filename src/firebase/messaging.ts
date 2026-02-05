import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { getFirebaseMessaging, VAPID_KEY, isFirebaseConfigured } from './config';
import { saveFcmToken, deleteFcmToken, cancelAllDeviceNotifications } from './firestore';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function getNotificationPermissionState(): NotificationPermissionState {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

export function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isStandaloneMode(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true;
}

export function canRequestPermission(): boolean {
  // On iOS, must be in standalone mode (added to home screen)
  if (isIOSDevice() && !isStandaloneMode()) {
    return false;
  }
  return isNotificationSupported();
}

export async function requestNotificationPermission(): Promise<{
  success: boolean;
  token: string | null;
  error?: string;
}> {
  if (!isFirebaseConfigured()) {
    return { success: false, token: null, error: 'Firebase is not configured' };
  }

  if (!isNotificationSupported()) {
    return { success: false, token: null, error: 'Notifications are not supported in this browser' };
  }

  if (isIOSDevice() && !isStandaloneMode()) {
    return {
      success: false,
      token: null,
      error: 'On iOS, you must add this app to your home screen first, then enable notifications',
    };
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      return { success: false, token: null, error: 'Notification permission was denied' };
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return { success: false, token: null, error: 'Failed to initialize Firebase Messaging' };
    }

    // Use the main service worker (which now includes Firebase messaging)
    const registration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return { success: false, token: null, error: 'Failed to get FCM token' };
    }

    // Save token to Firestore
    await saveFcmToken(token);

    return { success: true, token };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return {
      success: false,
      token: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function disableNotifications(): Promise<void> {
  try {
    // Delete token from Firestore
    await deleteFcmToken();
    // Cancel all pending notifications
    await cancelAllDeviceNotifications();
  } catch (error) {
    console.error('Error disabling notifications:', error);
  }
}

export function setupForegroundMessaging(onNotification: (payload: MessagePayload) => void): () => void {
  let unsubscribe: (() => void) | null = null;

  getFirebaseMessaging().then((messaging) => {
    if (messaging) {
      unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        onNotification(payload);

        // Show notification manually when app is in foreground
        if (payload.notification) {
          const { title, body } = payload.notification;
          if (title) {
            new Notification(title, {
              body: body || '',
              icon: '/goal-game/icons/icon-192.png',
              badge: '/goal-game/icons/icon-192.png',
              tag: payload.data?.eventId || 'goal-game-notification',
            });
          }
        }
      });
    }
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}
