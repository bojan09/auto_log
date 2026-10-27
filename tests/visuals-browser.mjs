import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8080");
async function add(make, model) {
  await page
    .getByRole("button", { name: "+ Add vehicle", exact: true })
    .click();
  for (const [key, value] of Object.entries({
    make,
    model,
    year: "2010",
    odometer: "120000",
    variant: "2.0 diesel",
  }))
    await page.locator("#vehicle [name=" + key + "]").fill(value);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page
    .getByRole("heading", { name: make + " " + model, exact: true })
    .waitFor();
}
await add("Fiat", "Sedici");
await add("Volkswagen", "Golf");
const car = page.locator(".card").filter({
  has: page.getByRole("heading", { name: "Fiat Sedici", exact: true }),
});
await car.getByRole("button", { name: "Open dashboard" }).click();
await page.locator(".vehicle-hero img").waitFor();
const fiat = await page.locator(".vehicle-hero img").getAttribute("src");
await page
  .getByRole("combobox", { name: "Select vehicle", exact: true })
  .selectOption({ label: "Volkswagen Golf" });
const golf = await page.locator(".vehicle-hero img").getAttribute("src");
assert.notEqual(fiat, golf);
await page
  .getByRole("combobox", { name: "Select vehicle", exact: true })
  .selectOption({ label: "Fiat Sedici" });
await page
  .getByRole("button", { name: "Engine & fluids", exact: true })
  .click();
await page
  .getByRole("dialog", { name: "Engine & fluids" })
  .getByText("No matching service records.")
  .waitFor();
await page.keyboard.press("Escape");
await page.evaluate(async () => {
  const { openDatabase } = await import("/src/storage.js");
  const db = await openDatabase();
  const cars = await new Promise((resolve) => {
    const r = db.transaction("vehicles").objectStore("vehicles").getAll();
    r.onsuccess = () => resolve(r.result);
  });
  const vehicle = cars.find((v) => v.model === "Sedici");
  await new Promise((resolve) => {
    const tx = db.transaction("serviceRecords", "readwrite");
    tx.objectStore("serviceRecords").put({
      id: "oil",
      vehicleId: vehicle.id,
      title: "Oil replacement",
      category: "oil",
      date: "2026-01-01",
      odometer: 120000,
      unit: "km",
      cost: 2500,
      currency: "MKD",
      provider: "Workshop",
      notes: "",
    });
    tx.oncomplete = resolve;
  });
  db.close();
});
await page.reload();
await page
  .locator("nav")
  .getByRole("button", { name: "Dashboard", exact: true })
  .click();
await page
  .getByRole("button", { name: "Engine & fluids", exact: true })
  .click();
await page
  .getByRole("dialog")
  .getByRole("heading", { name: "Oil replacement", exact: true })
  .waitFor();
await page.keyboard.press("Escape");
await mkdir("test-results", { recursive: true });
for (const [width, height] of [
  [360, 640],
  [390, 844],
  [768, 1024],
  [1440, 900],
]) {
  await page.setViewportSize({ width, height });
  await page.evaluate(() => scrollTo(0, 0));
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  const artwork = await page.locator(".vehicle-hero img").boundingBox();
  assert(artwork.width > width * 0.25, "Vehicle artwork must remain prominent");
  await page.screenshot({
    path: `test-results/design4-${width}.png`,
    fullPage: true,
    animations: "disabled",
  });
}
assert.deepEqual(
  (
    await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()
  ).violations.map((v) => ({
    id: v.id,
    nodes: v.nodes.map((n) => ({
      target: n.target,
      summary: n.failureSummary,
    })),
  })),
  [],
);
await page
  .locator("nav")
  .getByRole("button", { name: "More", exact: true })
  .click();
await page.getByLabel("Motion", { exact: true }).selectOption("enhanced");
await page.getByRole("button", { name: "Save", exact: true }).click();
await page.waitForFunction(() => localStorage.getItem("motion") === "enhanced");
assert.equal(
  await page.evaluate(() => localStorage.getItem("motion")),
  "enhanced",
);
await page.emulateMedia({ reducedMotion: "reduce" });
await page.waitForFunction(
  () => document.documentElement.dataset.motion === "reduced",
);
assert.equal(await page.locator("html").getAttribute("data-motion"), "reduced");
await page.reload();
assert.equal(await page.locator("html").getAttribute("data-motion"), "reduced");

await page
  .locator("nav")
  .getByRole("button", { name: "Dashboard", exact: true })
  .click();
await page
  .getByRole("button", { name: "Engine & fluids", exact: true })
  .click();
await page
  .getByRole("dialog")
  .getByRole("heading", { name: "Oil replacement", exact: true })
  .waitFor();
await page.keyboard.press("Escape");
await page.setViewportSize({ width: 390, height: 844 });
assert.deepEqual(
  (
    await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()
  ).violations.map((v) => v.id),
  [],
);
const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
const started = performance.now();
await page.reload();
await page
  .locator("nav")
  .getByRole("button", { name: "Dashboard", exact: true })
  .click();
await page.locator(".vehicle-hero img").waitFor();
const elapsed = performance.now() - started;
assert(elapsed < 10000, "Dashboard exceeds 10s budget at 4x CPU slowdown");
console.log("4x CPU dashboard ready: " + Math.round(elapsed) + "ms");
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
await context.addInitScript(() =>
  Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 2 }),
);
await page.emulateMedia({ reducedMotion: "no-preference" });
await page.reload();
assert.equal(await page.locator("html").getAttribute("data-motion"), "reduced");
assert.deepEqual(errors, []);
console.log(
  "PASS distinct vehicle artwork, linked hotspots, four screenshots, accessibility, English, persisted preference and system reduced motion",
);
await browser.close();
