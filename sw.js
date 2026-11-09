// Lets the studio open offline and install as an app.
// Network first: when you're online you always get the newest version; the saved copy is only used offline.
const CACHE = "borhan-studio-v8";
const FILES = ["./", "index.html", "css/styles.css", "css/fonts.css", "manifest.webmanifest", "icons/icon-192.png",
  "js/config.js", "js/templates.js", "js/engine.js", "js/layouts.js", "js/cricket.js", "js/testcards.js", "js/stylish.js", "js/quickfill.js", "js/smartfill.js", "js/zip.js", "js/library.js", "js/caption.js", "js/series.js", "js/app.js", "js/series-ui.js", "js/cutout.js", "js/cutfix.js", "js/enhance.js",
  "fonts/abril-fatface-400-latin.woff2", "fonts/alfa-slab-one-400-latin.woff2", "fonts/anek-bangla-800-bengali.woff2", "fonts/anek-bangla-800-latin.woff2", "fonts/anton-400-latin.woff2", "fonts/archivo-black-400-latin.woff2", "fonts/baloo-da-2-800-bengali.woff2", "fonts/baloo-da-2-800-latin.woff2", "fonts/bangers-400-latin.woff2", "fonts/barlow-condensed-900-italic-latin.woff2", "fonts/bebas-neue-400-latin.woff2", "fonts/big-shoulders-display-900-latin.woff2", "fonts/black-ops-one-400-latin.woff2", "fonts/bungee-400-latin.woff2", "fonts/climate-crisis-400-latin.woff2", "fonts/dm-serif-display-400-latin.woff2", "fonts/exo-2-900-italic-latin.woff2", "fonts/galada-400-bengali.woff2", "fonts/galada-400-latin.woff2", "fonts/graduate-400-latin.woff2", "fonts/great-vibes-400-latin.woff2", "fonts/kanit-900-italic-latin.woff2", "fonts/kaushan-script-400-latin.woff2", "fonts/knewave-400-latin.woff2", "fonts/league-gothic-400-latin.woff2", "fonts/montserrat-900-latin.woff2", "fonts/mr-dafoe-400-latin.woff2", "fonts/oswald-500-latin.woff2", "fonts/oswald-700-latin.woff2", "fonts/permanent-marker-400-latin.woff2", "fonts/playfair-display-900-latin.woff2", "fonts/rubik-dirt-400-latin.woff2", "fonts/rubik-distressed-400-latin.woff2", "fonts/rubik-spray-paint-400-latin.woff2", "fonts/saira-stencil-one-400-latin.woff2", "fonts/sedgwick-ave-display-400-latin.woff2", "fonts/teko-700-latin.woff2", "fonts/tiro-bangla-400-bengali.woff2", "fonts/tiro-bangla-400-latin.woff2", "fonts/unbounded-900-latin.woff2", "fonts/yellowtail-400-latin.woff2"];

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
