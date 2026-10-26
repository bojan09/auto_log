const CACHE = "autolog-v8";
const ASSETS = [
  "./",
  "./index.html",
  "./src/app.js",
  "./src/maintenance.js",
  "./src/maintenance-ui.js",
  "./src/maintenance-i18n.js",
  "./src/boot.js",
  "./src/storage.js",
  "./src/i18n.js",
  "./src/style.css",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/vehicle-crossover.svg",
  "./assets/vehicle-hatchback.svg",
  "./assets/vehicle-sedan.svg",
  "./assets/vehicle-coupe.svg",
  "./assets/vehicle-van.svg",
  "./assets/vehicle-motorcycle.svg",
];
self.addEventListener("install", (e) =>
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS))),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("autolog-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      ),
  ),
);
self.addEventListener("fetch", (e) => {
  if (
    e.request.method === "GET" &&
    new URL(e.request.url).origin === location.origin
  )
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request)),
    );
});
