/**
 * P21 Service Worker — 缓存优先策略。
 * 安装时预缓存本工具核心文件；样式与文档走网络优先。
 */
const CACHE_NAME = "p21-exif-inspector-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.svg",
  "./styles.css",
  "./app.js",
  "./pm-metrics.js",
  "./sample-photo.jpg",
  "../shared/design-tokens.css",
  "../shared/modern-styles.css",
  "../shared/tool-chrome.css",
  "../shared/dark-toggle.js",
  "../shared/cmd-palette.js",
  "../shared/toast.js",
  "../shared/onboarding.js",
  "../shared/pedagogy-data-p1.js",
  "../shared/pedagogy-data-p2.js",
  "../shared/global-nav.js",
  "../shared/kbd-hints.js",
  "../shared/vendor/exifr.full.umd.js"
];

// Install: Pre-cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch(() => {
        // Silently skip missing optional files
        return Promise.allSettled(
          CORE_ASSETS.map((url) => cache.add(url).catch(() => {}))
        );
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Cache-First for same-origin, Network-First for external
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin API calls
  if (event.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // HTML/CSS 走网络优先，避免羊皮纸样式被旧缓存锁死
  const isStyleOrDoc =
    event.request.destination === "document" ||
    event.request.destination === "style" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".css");

  if (isStyleOrDoc) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match("./index.html")))
    );
    return;
  }

  const responsePromise = caches.match(event.request).then((cached) => {
    if (cached) {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {});
      event.waitUntil(fetchPromise);
      return cached;
    }
    return fetch(event.request).then((response) => {
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      if (event.request.destination === "document") {
        return caches.match("./index.html");
      }
    });
  });

  event.respondWith(responsePromise);
});
