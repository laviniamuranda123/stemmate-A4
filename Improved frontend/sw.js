const CACHE_NAME = "stemmate-shell-v3";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./log-session.html",
  "./log-session.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  // API calls always go to the network (never cached), so data is never stale
  if (new URL(event.request.url).pathname.startsWith("/api/")) return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok && new URL(event.request.url).origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    } catch (error) {
      if (event.request.mode === "navigate") {
        return (await caches.match("./index.html")) || new Response(
          "STEMMate is offline. Please reconnect and try again.", {status:503, headers:{"Content-Type":"text/plain; charset=utf-8"}}
        );
      }
      return new Response("This resource is unavailable offline.", {
        status:503, headers:{"Content-Type":"text/plain; charset=utf-8"}
      });
    }
  })());
});