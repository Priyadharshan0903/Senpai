/* Canon PWA service worker.
 * Strategies:
 *  - navigations:            network-first, fallback to cached shell
 *  - /api/data:              network-first, fallback to last snapshot (offline read)
 *  - /api/avatar:            cache-first (deterministic, immutable)
 *  - anime covers (anilist/MAL CDNs): cache-first
 *  - static assets (_next/static, fonts, icons): cache-first
 *  - other API POSTs:        network only (never cached)
 */
const VERSION = "canon-v1";
const SHELL_CACHE = VERSION + "-shell";
const DATA_CACHE = VERSION + "-data";
const IMG_CACHE = VERSION + "-img";
const STATIC_CACHE = VERSION + "-static";

const IMG_HOSTS = ["s4.anilist.co", "cdn.myanimelist.net"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((c) => c.addAll(["/", "/manifest.webmanifest", "/icon.svg"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

async function networkFirst(req, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req);
    if (hit) return hit;
    if (fallbackUrl) {
      const shell = await caches.match(fallbackUrl);
      if (shell) return shell;
    }
    throw err;
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // mutations always hit the network

  const url = new URL(req.url);

  // app navigations
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, SHELL_CACHE, "/"));
    return;
  }

  // data snapshot
  if (url.origin === self.location.origin && url.pathname === "/api/data") {
    event.respondWith(networkFirst(req, DATA_CACHE));
    return;
  }

  // avatars
  if (url.origin === self.location.origin && url.pathname === "/api/avatar") {
    event.respondWith(cacheFirst(req, IMG_CACHE));
    return;
  }

  // anime cover CDNs
  if (IMG_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(req, IMG_CACHE));
    return;
  }

  // build assets + local static files
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".woff2") ||
      url.pathname === "/manifest.webmanifest")
  ) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
  }
});
