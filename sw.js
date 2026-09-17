/* Levo Kitchen — offline shell.
   Bump CACHE whenever index.html or the icons change. */
const CACHE = "levo-kitchen-v2";

const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./favicon-32.png",
  "./data/prices.json"
];

// Synced by build/sync-snappfood.js; refreshed on every load when online,
// but must still resolve instantly offline — so it gets its own strategy
// below instead of falling into the generic same-origin cache-first rule.
const PRICES_PATH = "./data/prices.json";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Live prices: network first with a short timeout, cache as the fallback —
  // freshest number when online, last-known number offline.
  if (url.origin === self.location.origin && url.pathname.endsWith("/data/prices.json")) {
    event.respondWith(
      Promise.race([
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(PRICES_PATH, copy));
          return res;
        }),
        new Promise((_, reject) => setTimeout(reject, 4000))
      ]).catch(() => caches.match(PRICES_PATH))
    );
    return;
  }

  // Navigations: network first so a redeploy is picked up, cache as the fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Google Fonts: cache first, refresh in the background.
  if (url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com") {
    event.respondWith(
      caches.match(req).then((hit) => {
        const live = fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
          .catch(() => hit);
        return hit || live;
      })
    );
    return;
  }

  // Same-origin assets: cache first.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
  }
});
