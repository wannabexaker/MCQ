// Bump CACHE_VERSION every time the app shell (script.js/style.css/index.html)
// changes — the activate handler purges old caches, and clients.claim() makes
// the new SW take control of already-open tabs immediately.
const CACHE_VERSION = "mcq-v8";

const APP_SHELL = [
  "./",
  "./index.html",
  "./script.js",
  "./style.css",
  "./manifest.json",
  "./images/favicon.png",
  "./images/sidebanner.jpg",
  "./images/game_over.jpg",
  "./questions_template.json",
];

// Files that benefit from instant updates over offline guarantees. We use a
// network-first strategy: try the network, fall back to cache only if offline.
// This is what makes the welcome search / mobile import fixes show up on
// mobile devices that have the PWA already cached.
const NETWORK_FIRST_SHELL = /\/(index\.html|script\.js|style\.css|manifest\.json|sw\.js)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(APP_SHELL).catch((err) => {
        console.warn("[sw] precache partial failure", err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isQuestionsJson =
    /\/q[_-].*\.json$/i.test(url.pathname) ||
    url.pathname.endsWith("/sources_index.json");

  // Network-first for question banks (already the behaviour).
  if (isQuestionsJson) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Network-first for the app shell so updates land immediately on mobile.
  // The `/` and bare URL forms also count as index.html.
  const isShell =
    NETWORK_FIRST_SHELL.test(url.pathname) ||
    url.pathname === "/" ||
    url.pathname.endsWith("/mcq-trainer/") ||
    url.pathname.endsWith("/mcq-trainer");
  if (isShell) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Cache-first for everything else (images, fonts, etc.).
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});

function networkFirst(req) {
  return fetch(req)
    .then((res) => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    })
    .catch(() => caches.match(req));
}
