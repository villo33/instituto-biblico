self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("app-cache-v1").then(cache => {
      return cache.addAll([
        "/",
        "/login.html",
        "/index.html",
        "/style.css",
        "/logo.jpg"
      ]);
    })
  );
});

// 🔥 ACTIVAR (limpia versiones viejas)
self.addEventListener("activate", e => {
  const cacheWhitelist = ["app-cache-v1"];

  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (!cacheWhitelist.includes(key)) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// 🔥 FETCH (para que funcione offline)
self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});