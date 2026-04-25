self.addEventListener("fetch", event => {
  if (!event.request.url.startsWith("http")) return;
  event.respondWith(fetch(event.request));
});