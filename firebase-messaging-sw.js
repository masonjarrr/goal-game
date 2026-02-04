// Firebase Messaging Service Worker
// This file handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Firebase configuration
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
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

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
    actions: [
      {
        action: 'view',
        title: 'View',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open or focus the app
  const urlToOpen = event.notification.data?.url || '/goal-game/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes('/goal-game/') && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker installed');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activated');
  event.waitUntil(clients.claim());
});
