const CACHE = "autolog-v19";
const ASSETS = [
  "./",
  "./index.html",
  "./src/app.js",
  "./src/vehicle-details.js",
  "./src/design/tokens.css",
  "./src/design/base.css",
  "./src/design/shell.css",
  "./src/design/components.css",
  "./src/design/pages.css",
  "./src/design/editors.css",

  "./src/entry-forms.js",
  "./src/profile.js",
  "./src/visuals.js",
  "./src/vault.js",
  "./src/vault-ui.js",
  "./src/vault-i18n.js",
  "./assets/alpine-road.webp",
  "./assets/crossover-studio.webp",
  "./assets/hatchback-studio.webp",
  "./assets/sedan-studio.webp",
  "./src/finance.js",
  "./src/finance-ui.js",
  "./src/finance-i18n.js",
  "./src/finance-charts.js",
  "./src/maintenance.js",
  "./src/maintenance-ui.js",
  "./src/maintenance-i18n.js",
  "./src/boot.js",
  "./src/storage.js",
  "./src/i18n.js",
  "./src/dashboard.js",
  "./src/fuel-spending.js",
  "./src/topbar.js",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/fonts/manrope-latin.woff2",
  "./assets/fonts/OFL.txt",
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
