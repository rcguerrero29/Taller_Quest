/* Meridian Quest service worker — cache-first, offline-capable.
   Rules (2026-09-05, docs/story/el-changarrito.md §4 B5, §5 R6): this worker serves the
   game's own shell and nothing else — never a cross-origin request (an API answer must not
   be frozen in a cache), never a non-ok response (a 403 must not become the permanent
   answer), and it deletes only caches it owns (another pack on this origin keeps its own). */
const CACHE = "mq-v225";
const PFX = "mq-"; /* the cache names this worker owns */
const ASSETS = ["./", "./index.html", "./frame-guard.js", "./sw-register.js", "./qr.js",
  "./vendor/fonts/fonts.css", "./vendor/fonts/unbounded-latin-500-normal.woff2", "./vendor/fonts/unbounded-latin-700-normal.woff2", "./vendor/fonts/ibm-plex-sans-latin-400-normal.woff2", "./vendor/fonts/ibm-plex-sans-latin-500-normal.woff2", "./vendor/fonts/ibm-plex-sans-latin-600-normal.woff2", "./vendor/fonts/ibm-plex-sans-latin-400-italic.woff2", "./vendor/fonts/ibm-plex-mono-latin-400-normal.woff2", "./vendor/fonts/ibm-plex-mono-latin-500-normal.woff2", "./engine/boot.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
  "./engine/engine.js", "./engine/shapes.js", "./engine/engine3d.js", "./vendor/three.min.js",
  "./content/meridian/strings.js", "./content/meridian/quests.en.js", "./content/meridian/quests.es.js",
  "./content/meridian/npcs.js", "./content/meridian/maps.js", "./content/meridian/config.js",
  "./content/meridian/art.js", "./content/meridian/room.js", "./content/meridian/docs.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(PFX) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  let url; try { url = new URL(e.request.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return; /* the shell only — never an API, never a CDN */
  /* and only its own game: another world on this site (content/horno/) is fetched fresh, never kept in
     Meridian's cache, where it would go stale until Meridian's own version changed (#254, 2026-09-27) */
  if (/\/content\//.test(url.pathname) && !/\/content\/meridian\//.test(url.pathname)) return;
  if (url.pathname.endsWith("/status.json")) { /* the city record (#14): network first, the cached copy only when offline — or a clerk is stale forever */
    e.respondWith(fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { cacheName: CACHE }).then(hit => hit || Response.error())));
    return;
  }
  e.respondWith(
    caches.match(e.request, { cacheName: CACHE }).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => e.request.mode === "navigate" ? caches.match("./index.html", { cacheName: CACHE }) : Response.error()))
  );
});
