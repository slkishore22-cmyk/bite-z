/// <reference lib="webworker" />
/* eslint-disable @typescript-eslint/no-explicit-any */

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

self.skipWaiting();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

/* ---------------- App-shell warm cache ----------------
 * On install, prime the cache with the root document and key icons so the
 * very first cold launch after install paints the shell instantly with no
 * white flash, even on a slow / lossy campus network.
 */
const APP_SHELL_CACHE = "bitez-shell-v1";
const APP_SHELL_URLS = [
  "/",
  "/app/home",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(APP_SHELL_CACHE);
        await Promise.all(
          APP_SHELL_URLS.map((u) =>
            cache.add(new Request(u, { cache: "reload" })).catch(() => null),
          ),
        );
      } catch {
        /* non-fatal — runtime caching will still work */
      }
    })(),
  );
});

/* ---------------- Runtime caching ---------------- */

// HTML navigations — network first with a short timeout, then fall back to
// the warm app-shell cache so cold launches paint instantly even when the
// network is slow or offline. This eliminates the launch white flash.
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: "bitez-html",
      networkTimeoutSeconds: 2,
      plugins: [
        new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 }),
        {
          // Navigation fallback chain: try the last-good cached copy of the
          // requested URL, then the warm app-shell (/, /app/home), then the
          // dedicated friendly offline page so the user NEVER sees a blank
          // screen when navigation fails.
          handlerDidError: async ({ request }) => {
            const html = await caches.open("bitez-html");
            const lastGood =
              (await html.match(request, { ignoreSearch: true })) ||
              (await html.match("/app/home")) ||
              (await html.match("/"));
            if (lastGood) return lastGood;
            const shell = await caches.open(APP_SHELL_CACHE);
            return (
              (await shell.match("/app/home")) ||
              (await shell.match("/")) ||
              (await shell.match("/offline.html")) ||
              Response.error()
            );
          },
        },
      ],
    }),
    {
      denylist: [/^\/~oauth/, /^\/functions\//, /^\/auth\//, /^\/sw\.js$/],
    },
  ),
);

// Hashed build assets (JS/CSS/fonts emitted by Vite under /assets/) are
// content-hashed and immutable — serve them cache-first for instant launches.
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith("/assets/") &&
    (request.destination === "script" ||
      request.destination === "style" ||
      request.destination === "font"),
  new CacheFirst({
    cacheName: "bitez-static",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
);

// Google fonts CSS
registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com",
  new StaleWhileRevalidate({ cacheName: "google-fonts-css" }),
);

// Google fonts files
registerRoute(
  ({ url }) => url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "google-fonts-files",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  }),
);

// Images — stale while revalidate.
registerRoute(
  ({ request }) => request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: "bitez-images",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 }),
    ],
  }),
);

// Supabase GET — network first, short cache for offline reads.
registerRoute(
  ({ url, request }) =>
    url.hostname.endsWith(".supabase.co") && request.method === "GET",
  new NetworkFirst({
    cacheName: "bitez-api",
    networkTimeoutSeconds: 4,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 5 }),
    ],
  }),
);

/* ---------------- Push notifications ---------------- */

self.addEventListener("push", (event) => {
  let data: { title?: string; body?: string; url?: string; tag?: string } = {};
  try {
    if (event.data) data = event.data.json();
  } catch {
    if (event.data) data = { body: event.data.text() };
  }

  const title = data.title ?? "Bitez";
  const options: NotificationOptions = {
    body: data.body ?? "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag,
    data: { url: data.url ?? "/app/home" },
    // @ts-ignore
    vibrate: [40, 30, 40],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data as any)?.url ?? "/app/home";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existing = all.find((c) => c.url.includes(target));
      if (existing) {
        await existing.focus();
        return;
      }
      await self.clients.openWindow(target);
    })(),
  );
});

/* ---------------- Background sync (placeholder) ----------------
 * Background Sync requires registering a 'sync' tag from a page when the
 * order request fails offline. We expose a 'queue-order' tag here; the
 * client side that actually queues failed POSTs lives in the order code.
 * (Phase 2.5 — wire IndexedDB queue when needed.)
 */
self.addEventListener("sync", (event: any) => {
  if (event.tag === "bitez-orders") {
    // Future: replay queued orders from IndexedDB.
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});