self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("app-cache").then(cache => {
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