import { chromium, firefox, webkit } from "playwright";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, access, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve(".");
let version = "old";
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};
const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (path.endsWith("/")) path += "index.html";
    const folder = path.startsWith("/auto_log/") ? resolve(root, "dist") : root;
    if (folder !== root) path = path.slice("/auto_log".length);
    const file = resolve(folder, "." + path);
    if (!file.startsWith(root + sep)) throw Error();
    let body = await readFile(file);
    if (path === "/sw.js")
      body = Buffer.from(
        body
          .toString()
          .replace(
            "autolog-v17",
            version === "old" ? "autolog-release-old" : "autolog-v17",
          ),
      );
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(8091, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:8091");
  await page.getByRole("heading", { name: "Garage", exact: true }).waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  assert(
    (await page.evaluate(() => caches.keys())).includes("autolog-release-old"),
  );
  const hostile = "<img src=x onerror=window.__autologXss=1>";
  await page
    .getByRole("button", { name: "+ Add vehicle", exact: true })
    .click();
  for (const [name, value] of Object.entries({
    make: hostile,
    model: "Sedici",
    year: "2010",
    odometer: "0",
  }))
    await page.locator("#vehicle [name=" + name + "]").fill(value);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page
    .getByRole("heading", { name: hostile + " Sedici", exact: true })
    .waitFor();
  assert.equal(await page.locator("#app img[src=x]").count(), 0);
  assert.equal(await page.evaluate(() => window.__autologXss), undefined);
  await page
    .locator("nav")
    .getByRole("button", { name: "More", exact: true })
    .click();
  await page
    .locator(".vault-tabs")
    .getByRole("button", { name: "Documents", exact: true })
    .click();
  await page.getByLabel("Document file", { exact: true }).setInputFiles({
    name: "invoice.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4"),
  });
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await page
    .getByRole("button", { name: "Save document", exact: true })
    .click();
  await page.getByRole("alert").filter({ hasText: "Could not save" }).waitFor();
  assert.equal(await page.locator(".vault article").count(), 0);
  await page.reload();
  await page
    .getByRole("heading", { name: hostile + " Sedici", exact: true })
    .waitFor();
  version = "new";
  await page.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    await r.update();
  });
  await page.waitForFunction(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    return r.waiting?.state === "installed";
  });
  await page
    .getByRole("status")
    .filter({ hasText: "An update is ready" })
    .waitFor();
  assert(
    (await page.evaluate(() => caches.keys())).includes("autolog-release-old"),
  );
  await page.close();
  let activated = false;
  for (let i = 0; i < 100; i++) {
    for (const worker of context.serviceWorkers()) {
      try {
        if (
          await worker.evaluate(async () => {
            const keys = await caches.keys();
            return (
              keys.includes("autolog-v17") &&
              !keys.includes("autolog-release-old")
            );
          })
        )
          activated = true;
      } catch {}
    }
    if (activated) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert(
    activated,
    "New worker activates and clears its obsolete app cache after tabs close",
  );
  const offline = await context.newPage();
  await context.setOffline(true);
  await offline.goto("http://127.0.0.1:8091");
  await offline.getByRole("heading", { name: "Garage", exact: true }).waitFor();
  assert.equal(await offline.locator("html").getAttribute("lang"), "en");
  await context.close();
  const blocked = await browser.newContext();
  await blocked.addInitScript(() =>
    Object.defineProperty(window, "indexedDB", {
      value: {
        open() {
          throw new DOMException("Denied", "SecurityError");
        },
      },
    }),
  );
  const failure = await blocked.newPage();
  await failure.goto("http://127.0.0.1:8091");
  await failure
    .getByRole("heading", { name: "Local storage is unavailable" })
    .waitFor();
  assert.equal(await failure.locator("nav button:enabled").count(), 0);
  await blocked.close();
  const preference = await browser.newContext();
  await preference.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Denied", "SecurityError");
      },
    }),
  );
  const prefPage = await preference.newPage();
  await prefPage.goto("http://127.0.0.1:8091");
  await prefPage
    .locator("nav")
    .getByRole("button", { name: "More", exact: true })
    .click();
  await prefPage.getByLabel("Theme", { exact: true }).selectOption("light");
  await prefPage.getByRole("button", { name: "Save", exact: true }).click();
  await prefPage.waitForFunction(
    () => document.documentElement.dataset.theme === "light",
  );
  await prefPage.reload();
  await prefPage
    .getByRole("heading", { name: "Garage", exact: true })
    .waitFor();
  assert.equal(
    await prefPage.locator("html").getAttribute("data-theme"),
    "light",
  );
  await preference.close();
  const staged = await browser.newContext();
  const project = await staged.newPage();
  await project.goto("http://127.0.0.1:8091/auto_log/");
  await project.getByRole("heading", { name: "Garage", exact: true }).waitFor();
  await project.evaluate(() => navigator.serviceWorker.ready);
  await project.reload();
  await staged.setOffline(true);
  await project.reload();
  await project.getByRole("heading", { name: "Garage", exact: true }).waitFor();
  assert(
    await project.evaluate(async () => {
      const img = new Image();
      img.src = "./assets/crossover-studio.webp";
      await img.decode();
      return img.naturalWidth > 0;
    }),
  );
  await project.evaluate(() => document.fonts.ready);
  assert(
    await project.evaluate(() => document.fonts.check("12px Manrope")),
    "Local brand typography must load from the offline artifact",
  );
  await staged.close();
  const files = [
    "alpine-road",
    "crossover-studio",
    "hatchback-studio",
    "sedan-studio",
  ];
  let before = 0,
    after = 0;
  for (const file of files) {
    before += (await stat("assets/" + file + ".png")).size;
    after += (await stat("assets/" + file + ".webp")).size;
  }
  assert(after < 600000);
  console.log(
    "Artwork bytes: " +
      before +
      " → " +
      after +
      " (" +
      (100 - (after / before) * 100).toFixed(1) +
      "% smaller)",
  );
  for (const engine of [firefox, webkit]) {
    try {
      await access(engine.executablePath());
      console.log("Additional engine installed: " + engine.name());
    } catch {
      console.log("Not installed: " + engine.name());
    }
  }
  console.log(
    "PASS worker install/waiting/update/activation/cache cleanup, offline refresh, blocked IndexedDB, quota errors, inert user text, preference recovery without localStorage, subpath release artifact, decoded offline WebP, artwork size budget",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
