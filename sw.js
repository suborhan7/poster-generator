// Lets the studio open offline and install as an app.
// Network first: when you're online you always get the newest version; the saved copy is only used offline.
const CACHE = "borhan-studio";
const FILES = ["./", "index.html", "css/styles.css", "manifest.webmanifest", "icons/icon-192.png",
  "js/config.js", "js/templates.js", "js/engine.js", "js/layouts.js", "js/cricket.js", "js/quickfill.js", "js/caption.js", "js/series.js", "js/app.js", "js/series-ui.js"];

self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
