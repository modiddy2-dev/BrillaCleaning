const CACHE = "brilla-shell-v4";
const SHELL = [
  "/manifest.webmanifest",
  "/owner.webmanifest",
  "/cleaner.webmanifest",
  "/icons/icon-192.png?v2",
  "/icons/icon-512.png?v2",
  "/icons/apple-touch-icon.png?v2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Always network-first for pages so layout fixes are not stuck behind a cached shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          if (url.pathname.startsWith("/owner")) return (await caches.match("/owner/login")) || Response.error();
          if (url.pathname.startsWith("/cleaner")) return (await caches.match("/cleaner/login")) || Response.error();
          return (await caches.match("/")) || Response.error();
        }),
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(async () => (await caches.match(request)) || Response.error()),
  );
});
