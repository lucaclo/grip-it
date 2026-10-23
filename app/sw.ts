/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import { ExpirationPlugin, NetworkFirst, type PrecacheEntry, Serwist, type SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

/**
 * Offline support. The app shell and every tab are precached, so Grip It opens with no signal.
 *
 * Data survives updates:
 * - skipWaiting is off. A new version waits until the user taps "Update ready", which
 *   components/pwa.tsx only offers when no workout is in progress.
 * - Clean-up only deletes Serwist's own outdated caches. It never touches localStorage or
 *   IndexedDB, where the user's data lives.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: { cleanupOutdatedCaches: true },
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Exercise and workout detail pages (one per id): kept as they're visited or warmed by the
    // client, with a short timeout so bad gym signal falls back to the cached copy quickly.
    {
      matcher: ({ request, url, sameOrigin }) =>
        sameOrigin && request.headers.get("RSC") !== "1" && /^\/(exercises|workout)\/[^/]+$/.test(url.pathname),
      handler: new NetworkFirst({
        cacheName: "detail-pages",
        networkTimeoutSeconds: 3,
        plugins: [new ExpirationPlugin({ maxEntries: 400 })],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }],
  },
});

serwist.addEventListeners();
