// Lets the studio open offline and install as an app.
// Network first: when you're online you always get the newest version; the saved copy is only used offline.
const CACHE = "borhan-studio-v6";
const FILES = ["./", "index.html", "css/styles.css", "css/fonts.css", "manifest.webmanifest", "icons/icon-192.png",
  "js/config.js", "js/templates.js", "js/engine.js", "js/layouts.js", "js/cricket.js", "js/testcards.js", "js/stylish.js", "js/quickfill.js", "js/smartfill.js", "js/zip.js", "js/library.js", "js/caption.js", "js/series.js", "js/app.js", "js/series-ui.js", "js/cutout.js", "js/cutfix.js", "js/enhance.js",
  "fonts/anton-400-latin.woff2", "fonts/baloo-da-2-800-bengali.woff2", "fonts/baloo-da-2-800-latin.woff2", "fonts/bebas-neue-400-latin.woff2", "fonts/big-shoulders-display-900-latin.woff2", "fonts/black-ops-one-400-latin.woff2", "fonts/galada-400-bengali.woff2", "fonts/galada-400-latin.woff2", "fonts/league-gothic-400-latin.woff2", "fonts/oswald-500-latin.woff2", "fonts/oswald-700-latin.woff2", "fonts/permanent-marker-400-latin.woff2", "fonts/rubik-dirt-400-latin.woff2", "fonts/saira-extra-condensed-800-latin.woff2", "fonts/teko-700-latin.woff2"];

self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    // no-cache: always ask the server for the newest file, never a stale copy from the browser cache.
    fetch(new URL(e.request.url).origin === location.origin ? new Request(e.request.url, { cache: "no-cache" }) : e.request)
      .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
