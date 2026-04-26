const CACHE_NAME = "app-v1";

self.addEventListener("install", event => {
  self.skipWaiting();
  console.log("SW instalado");
});

self.addEventListener("activate", event => {
  console.log("SW activo");
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response("Sin conexión");
    })
  );
});