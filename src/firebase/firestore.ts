import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { getFirestoreDB, getDeviceId, isFirebaseConfigured } from './config';
import { ScheduledNotification } from '../types/notification';

const NOTIFICATIONS_COLLECTION = 'scheduled_notifications';
const TOKENS_COLLECTION = 'fcm_tokens';

export async function scheduleNotification(
  eventId: number,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  reminderMinutes: number,
  fcmToken: string
): Promise<string | null> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured, skipping notification scheduling');
    return null;
  }

  const db = getFirestoreDB();
  const deviceId = getDeviceId();

  // Calculate trigger time
  const eventDateTime = new Date(`${eventDate}T${eventTime}`);
  const triggerAt = new Date(eventDateTime.getTime() - reminderMinutes * 60 * 1000);

  // Don't schedule if trigger time is in the past
  if (triggerAt <= new Date()) {
    console.warn('Notification trigger time is in the past, skipping');
    return null;
  }

  const notificationId = `${deviceId}_event_${eventId}`;
  const notification: ScheduledNotification = {
    id: notificationId,
    eventId,
    eventTitle,
    eventDate,
    eventTime,
    triggerAt: triggerAt.toISOString(),
    fcmToken,
    deviceId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    notificationType: 'event',
  };

  try {
    await setDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), notification);
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return null;
  }
}

export async function scheduleBuffExpiryNotification(
  buffLogId: number,
  buffName: string,
  buffType: 'buff' | 'debuff',
  expiresAt: string,
  fcmToken: string
): Promise<string | null> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured, skipping notification scheduling');
    return null;
  }

  const db = getFirestoreDB();
  const deviceId = getDeviceId();

  // SQLite datetime is in UTC but without timezone marker
  // Add 'Z' to indicate UTC if not already present
  const utcExpiresAt = expiresAt.includes('Z') || expiresAt.includes('+')
    ? expiresAt
    : expiresAt.replace(' ', 'T') + 'Z';
  const triggerAt = new Date(utcExpiresAt);

  // Don't schedule if trigger time is in the past
  if (triggerAt <= new Date()) {
    console.warn('Buff expiry time is in the past, skipping notification');
    return null;
  }

  const notificationId = `${deviceId}_buff_${buffLogId}`;
  const notification: ScheduledNotification = {
    id: notificationId,
    buffLogId,
    buffName,
    buffType,
    triggerAt: triggerAt.toISOString(),
    fcmToken,
    deviceId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    notificationType: 'buff_expiry',
  };

  try {
    await setDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), notification);
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule buff expiry notification:', error);
    return null;
  }
}

export async function cancelBuffExpiryNotification(buffLogId: number): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const db = getFirestoreDB();
  const deviceId = getDeviceId();
  const notificationId = `${deviceId}_buff_${buffLogId}`;

  try {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId));
  } catch (error) {
    console.error('Failed to cancel buff expiry notification:', error);
  }
}

export async function cancelNotification(eventId: number): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const db = getFirestoreDB();
  const deviceId = getDeviceId();
  const notificationId = `${deviceId}_event_${eventId}`;

  try {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId));
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
}

export async function cancelAllDeviceNotifications(): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const db = getFirestoreDB();
  const deviceId = getDeviceId();

  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('deviceId', '==', deviceId),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, docSnap.id))
    );
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Failed to cancel all notifications:', error);
  }
}

export async function saveFcmToken(token: string): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const db = getFirestoreDB();
  const deviceId = getDeviceId();

  try {
    await setDoc(doc(db, TOKENS_COLLECTION, deviceId), {
      token,
      deviceId,
      updatedAt: new Date().toISOString(),
      platform: navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')
        ? 'ios'
        : navigator.userAgent.includes('Android')
          ? 'android'
          : 'web',
    });
  } catch (error) {
    console.error('Failed to save FCM token:', error);
  }
}

export async function deleteFcmToken(): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const db = getFirestoreDB();
  const deviceId = getDeviceId();

  try {
    await deleteDoc(doc(db, TOKENS_COLLECTION, deviceId));
  } catch (error) {
    console.error('Failed to delete FCM token:', error);
  }
}
