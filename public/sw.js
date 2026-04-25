const CACHE_NAME = "app-cache-v1";

const urlsToCache = [
  "/login.html",
  "/index.html",
  "/style.css",
  "/logo.jpg"
];

// 🔥 INSTALL: guardar archivos base
self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 🔥 ACTIVATE: limpiar cachés viejos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// 🔥 FETCH: SIN errores de redirect en Render
self.addEventListener("fetch", event => {
  const request = event.request;

  // Solo manejar GET (evita errores con POST/PUT)
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // Guardar copia en cache SOLO si es válida
        const responseClone = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseClone);
        });

        return response;
      })
      .catch(() => {
        return caches.match(request).then(cacheRes => {
          // fallback para navegación (PWA)
          if (cacheRes) return cacheRes;

          if (request.mode === "navigate") {
            return caches.match("/login.html");
          }
        });
      })
  );
});