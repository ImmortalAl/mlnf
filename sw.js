// MLNF Service Worker - PWA Core Functionality
const CACHE_VERSION = 'mlnf-v1.2.0';
const STATIC_CACHE = `mlnf-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `mlnf-dynamic-${CACHE_VERSION}`;
const API_CACHE = `mlnf-api-${CACHE_VERSION}`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/lander.html',
  '/pages/blog.html',
  '/pages/celestial-commons.html',
  '/pages/news.html',
  '/pages/messageboard.html',
  '/souls/index.html',
  '/css/base-theme.css',
  '/css/styles.css',
  '/css/critical.css',
  '/css/lander.css',
  '/components/shared/styles.css',
  '/components/shared/config.js',
  '/components/shared/mlnf-core.js',
  '/js/mlnf-avatar-system.js',
  '/favicon.svg',
  '/favicon.ico',
  '/assets/images/default.jpg'
];

// API endpoints to cache with strategies
const API_CACHE_STRATEGIES = {
  '/api/users/online': { strategy: 'networkFirst', ttl: 30000 }, // 30 seconds
  '/api/users/me': { strategy: 'networkFirst', ttl: 300000 },    // 5 minutes
  '/api/blogs': { strategy: 'staleWhileRevalidate', ttl: 600000 }, // 10 minutes
  '/api/chronicles': { strategy: 'staleWhileRevalidate', ttl: 600000 }
};

// Background sync tags
const SYNC_TAGS = {
  MESSAGE_SEND: 'message-send',
  BLOG_POST: 'blog-post',
  CHRONICLE_SUBMIT: 'chronicle-submit',
  STATUS_UPDATE: 'status-update',
  LIKE_ACTION: 'like-action'
};

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[MLNF SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[MLNF SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[MLNF SW] Static assets cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error('[MLNF SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[MLNF SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.startsWith('mlnf-') && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('[MLNF SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[MLNF SW] Service worker activated');
        return self.clients.claim(); // Take control of all pages immediately
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static assets
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
    event.respondWith(handleStaticAsset(request));
    return;
  }
  
  // Handle dynamic content (HTML pages, images, etc.)
  event.respondWith(handleDynamicContent(request));
});

// API request handler with different strategies
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const endpoint = url.pathname;
  const strategy = getApiStrategy(endpoint);
  
  try {
    switch (strategy.type) {
      case 'networkFirst':
        return await networkFirst(request, API_CACHE, strategy.ttl);
      case 'cacheFirst':
        return await cacheFirst(request, API_CACHE, strategy.ttl);
      case 'staleWhileRevalidate':
        return await staleWhileRevalidate(request, API_CACHE);
      default:
        return await networkOnly(request);
    }
  } catch (error) {
    console.error('[MLNF SW] API request failed:', error);
    return await getCachedResponse(request, API_CACHE) || 
           new Response(JSON.stringify({ error: 'Offline - cached data unavailable' }), {
             status: 503,
             headers: { 'Content-Type': 'application/json' }
           });
  }
}

// Static asset handler
async function handleStaticAsset(request) {
  try {
    return await cacheFirst(request, STATIC_CACHE);
  } catch (error) {
    console.error('[MLNF SW] Static asset request failed:', error);
    return new Response('Offline - asset unavailable', { status: 503 });
  }
}

// Dynamic content handler
async function handleDynamicContent(request) {
  try {
    return await staleWhileRevalidate(request, DYNAMIC_CACHE);
  } catch (error) {
    console.error('[MLNF SW] Dynamic content request failed:', error);
    
    // For HTML pages, return offline page if available
    if (request.headers.get('accept').includes('text/html')) {
      const offlineResponse = await caches.match('/offline.html');
      return offlineResponse || new Response('You are offline', { 
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    return new Response('Offline - content unavailable', { status: 503 });
  }
}

// Caching strategies implementation
async function networkFirst(request, cacheName, ttl = 300000) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cacheResponse(request, response.clone(), cacheName, ttl);
    }
    return response;
  } catch (error) {
    return await getCachedResponse(request, cacheName) || 
           Promise.reject(error);
  }
}

async function cacheFirst(request, cacheName, ttl = 86400000) {
  const cachedResponse = await getCachedResponse(request, cacheName);
  
  if (cachedResponse && !isCacheExpired(cachedResponse, ttl)) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cacheResponse(request, response.clone(), cacheName, ttl);
    }
    return response;
  } catch (error) {
    return cachedResponse || Promise.reject(error);
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = getCachedResponse(request, cacheName);
  
  const networkResponse = fetch(request)
    .then(response => {
      if (response.ok) {
        cacheResponse(request, response.clone(), cacheName);
      }
      return response;
    })
    .catch(() => null);
  
  return (await cachedResponse) || (await networkResponse) || 
         new Response('Offline - content unavailable', { status: 503 });
}

async function networkOnly(request) {
  return await fetch(request);
}

// Helper functions
function getApiStrategy(endpoint) {
  for (const [pattern, config] of Object.entries(API_CACHE_STRATEGIES)) {
    if (endpoint.includes(pattern)) {
      return { type: config.strategy, ttl: config.ttl };
    }
  }
  return { type: 'networkOnly', ttl: 0 };
}

async function cacheResponse(request, response, cacheName, ttl = 86400000) {
  const cache = await caches.open(cacheName);
  const responseToCache = response.clone();
  
  // Add timestamp for TTL
  const headers = new Headers(responseToCache.headers);
  headers.append('sw-cached-at', Date.now().toString());
  headers.append('sw-ttl', ttl.toString());
  
  const cachedResponse = new Response(responseToCache.body, {
    status: responseToCache.status,
    statusText: responseToCache.statusText,
    headers: headers
  });
  
  await cache.put(request, cachedResponse);
}

async function getCachedResponse(request, cacheName) {
  const cache = await caches.open(cacheName);
  return await cache.match(request);
}

function isCacheExpired(response, ttl) {
  const cachedAt = response.headers.get('sw-cached-at');
  const cacheTtl = response.headers.get('sw-ttl');
  
  if (!cachedAt) return true;
  
  const age = Date.now() - parseInt(cachedAt);
  const maxAge = cacheTtl ? parseInt(cacheTtl) : ttl;
  
  return age > maxAge;
}

// Background Sync for offline actions
self.addEventListener('sync', event => {
  console.log('[MLNF SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.MESSAGE_SEND:
      event.waitUntil(syncMessages());
      break;
    case SYNC_TAGS.BLOG_POST:
      event.waitUntil(syncBlogPosts());
      break;
    case SYNC_TAGS.CHRONICLE_SUBMIT:
      event.waitUntil(syncChronicleSubmissions());
      break;
    case SYNC_TAGS.STATUS_UPDATE:
      event.waitUntil(syncStatusUpdates());
      break;
    case SYNC_TAGS.LIKE_ACTION:
      event.waitUntil(syncLikeActions());
      break;
  }
});

// Push notification handler
self.addEventListener('push', event => {
  console.log('[MLNF SW] Push notification received');
  
  let notificationData = {
    title: 'MLNF Notification',
    body: 'You have a new update',
    icon: '/favicon.svg',
    badge: '/assets/icons/badge-72x72.png',
    tag: 'mlnf-notification'
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('[MLNF SW] Failed to parse push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/assets/icons/view-icon.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/assets/icons/dismiss-icon.png'
        }
      ],
      data: notificationData.data || {}
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('[MLNF SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              client.focus();
              client.navigate(urlToOpen);
              return;
            }
          }
          // Open new window if app not open
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Sync functions for offline actions
async function syncMessages() {
  try {
    const pendingMessages = await getStoredData('pendingMessages');
    for (const message of pendingMessages) {
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${message.token}`
        },
        body: JSON.stringify(message.data)
      });
    }
    await clearStoredData('pendingMessages');
    console.log('[MLNF SW] Messages synced successfully');
  } catch (error) {
    console.error('[MLNF SW] Failed to sync messages:', error);
  }
}

async function syncBlogPosts() {
  try {
    const pendingPosts = await getStoredData('pendingBlogPosts');
    for (const post of pendingPosts) {
      await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${post.token}`
        },
        body: JSON.stringify(post.data)
      });
    }
    await clearStoredData('pendingBlogPosts');
    console.log('[MLNF SW] Blog posts synced successfully');
  } catch (error) {
    console.error('[MLNF SW] Failed to sync blog posts:', error);
  }
}

async function syncChronicleSubmissions() {
  try {
    const pendingSubmissions = await getStoredData('pendingChronicleSubmissions');
    for (const submission of pendingSubmissions) {
      await fetch('/api/chronicles/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${submission.token}`
        },
        body: JSON.stringify(submission.data)
      });
    }
    await clearStoredData('pendingChronicleSubmissions');
    console.log('[MLNF SW] Chronicle submissions synced successfully');
  } catch (error) {
    console.error('[MLNF SW] Failed to sync chronicle submissions:', error);
  }
}

async function syncStatusUpdates() {
  try {
    const pendingUpdates = await getStoredData('pendingStatusUpdates');
    for (const update of pendingUpdates) {
      await fetch(`/api/users/${update.userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${update.token}`
        },
        body: JSON.stringify(update.data)
      });
    }
    await clearStoredData('pendingStatusUpdates');
    console.log('[MLNF SW] Status updates synced successfully');
  } catch (error) {
    console.error('[MLNF SW] Failed to sync status updates:', error);
  }
}

async function syncLikeActions() {
  try {
    const pendingLikes = await getStoredData('pendingLikeActions');
    for (const like of pendingLikes) {
      await fetch(`/api/blogs/${like.postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${like.token}`
        },
        body: JSON.stringify(like.data)
      });
    }
    await clearStoredData('pendingLikeActions');
    console.log('[MLNF SW] Like actions synced successfully');
  } catch (error) {
    console.error('[MLNF SW] Failed to sync like actions:', error);
  }
}

// IndexedDB helpers for offline storage
async function getStoredData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mlnf-offline-storage', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function clearStoredData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mlnf-offline-storage', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => resolve();
    };
    
    request.onerror = () => reject(request.error);
  });
}