/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// Workbox precaching
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Firebase Messaging Setup
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

declare const firebase: any;

// Initialize Firebase
firebase.initializeApp({
  apiKey: 'AIzaSyA3dJLU8Xw6vcqXtOhVbuI5aO_ImdT8upg',
  authDomain: 'goal-game-7ad53.firebaseapp.com',
  projectId: 'goal-game-7ad53',
  storageBucket: 'goal-game-7ad53.firebasestorage.app',
  messagingSenderId: '86507800050',
  appId: '1:86507800050:web:f7674a55bc2291686f976b',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload: any) => {
  console.log('[SW] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Goal Game Reminder';
  const notificationOptions = {
    body: payload.notification?.body || 'You have an upcoming event!',
    icon: '/goal-game/icons/icon-192.png',
    badge: '/goal-game/icons/icon-192.png',
    tag: payload.data?.eventId || payload.data?.buffLogId || 'goal-game-notification',
    data: {
      url: '/goal-game/',
      eventId: payload.data?.eventId,
      buffLogId: payload.data?.buffLogId,
      notificationType: payload.data?.notificationType,
    },
    requireInteraction: true,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/goal-game/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/goal-game/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Log service worker lifecycle
self.addEventListener('install', () => {
  console.log('[SW] Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  event.waitUntil(self.clients.claim());
});
