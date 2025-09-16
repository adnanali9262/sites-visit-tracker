self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("site-visit-tracker-v1").then((cache) => {
      return cache.addAll([
        "/sites-visit-tracker/",
        "/sites-visit-tracker/index.html",
        "/sites-visit-tracker/app.js",
        "/sites-visit-tracker/manifest.json",
        "/sites-visit-tracker/icons/icon-192.png",
        "/sites-visit-tracker/icons/icon-512.png"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
