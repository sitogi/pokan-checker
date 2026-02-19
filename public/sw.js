const CACHE_NAME = "pokan-checker-v1";
const APP_SHELL_URLS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/zundamon-alert.wav",
  "/no-face-alert.wav",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        APP_SHELL_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "no-store" });
            if (response.ok) {
              await cache.put(url, response.clone());
            }
          } catch (_e) {}
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const network = await fetch(event.request);
          const cache = await caches.open(CACHE_NAME);
          await cache.put("/", network.clone());
          return network;
        } catch (_e) {
          const cache = await caches.open(CACHE_NAME);
          const cached = (await cache.match(event.request)) || (await cache.match("/"));
          if (cached) {
            return cached;
          }
          return new Response("offline", {
            status: 503,
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);
      const networkPromise = fetch(event.request)
        .then(async (network) => {
          if (network.ok) {
            await cache.put(event.request, network.clone());
          }
          return network;
        })
        .catch(() => null);

      if (cached) {
        void networkPromise;
        return cached;
      }
      const network = await networkPromise;
      if (network) {
        return network;
      }
      return new Response("offline", {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    })()
  );
});
