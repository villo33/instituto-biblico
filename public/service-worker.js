self.addEventListener("install", event => {
  self.skipWaiting();
  console.log("SW instalado");
});

self.addEventListener("activate", event => {
  console.log("SW activo");
});

self.addEventListener("fetch", event => {
  if (!event.request.url.startsWith("http")) return;
  event.respondWith(fetch(event.request));
});