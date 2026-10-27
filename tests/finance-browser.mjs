import { fillVehicleField, saveVehicleForm } from "./helpers/vehicle.mjs";
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
await page.getByRole("button", { name: "+ Add vehicle", exact: true }).click();
for (const [name, value] of Object.entries({
  make: "Fiat",
  model: "Sedici",
  year: "2010",
  odometer: "10000",
}))
  await fillVehicleField(page, name, value);
await saveVehicleForm(page);
await page.getByRole("heading", { name: "Fiat Sedici", exact: true }).waitFor();
await page
  .locator("nav")
  .getByRole("button", { name: "Fuel & expenses", exact: true })
  .click();
const year = new Date().getFullYear();
async function fill(day, odo, volume, full) {
  await page
    .getByRole("button", { name: "+ Add fill-up", exact: true })
    .click();
  const d = page.getByRole("dialog");
  for (const [name, value] of Object.entries({
    date: `${year}-01-${day}`,
    odometer: String(odo),
    volume: String(volume),
    unitPrice: "80",
    totalPaid: String(volume * 80),
  }))
    await d.locator("[name=" + name + "]").fill(value);
  await d.locator("[name=full]").setChecked(full);
  await d.getByRole("button", { name: "Save", exact: true }).click();
  await d.waitFor({ state: "hidden" });
}
await fill("01", 10000, 50, true);
await fill("05", 10200, 20, false);
await fill("10", 10500, 30, true);
await page
  .locator(".finance-metrics .metric")
  .filter({ hasText: "10 L/100km" })
  .waitFor();
assert(
  (await page.locator(".finance-metrics").textContent()).includes("10 L/100km"),
);
await page.getByRole("button", { name: "+ Add expense", exact: true }).click();
let d = page.getByRole("dialog");
await d.locator("[name=title]").fill("Parking");
await d.locator("[name=amount]").fill("100");
await d.getByRole("button", { name: "Save", exact: true }).click();
await d.waitFor({ state: "hidden" });
await page
  .locator(".finance-metrics .metric")
  .filter({ hasText: "8,100 MKD" })
  .waitFor();
assert(
  (await page.locator(".finance-metrics").textContent()).includes("8,100 MKD"),
);
assert.equal(await page.locator(".ledger-row").count(), 4);
await page
  .getByRole("button", { name: "Other · 100 MKD", exact: true })
  .click();
assert.equal(await page.locator(".ledger-row").count(), 1);
await page.locator(".finance label select[name=category]").selectOption("all");
await mkdir("test-results", { recursive: true });
for (const [width, height] of [
  [360, 640],
  [390, 844],
  [768, 1024],
  [1440, 900],
]) {
  await page.setViewportSize({ width, height });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: `test-results/finance-${width}.png`,
    fullPage: true,
    animations: "disabled",
  });
}
assert.deepEqual(
  (
    await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()
  ).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  [],
);

await page.getByRole("button", { name: "+ Add fill-up" }).click();
assert.deepEqual(
  (
    await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()
  ).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  [],
);
await page.keyboard.press("Escape");
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await context.setOffline(true);
await page.reload();
await page
  .locator("nav")
  .getByRole("button", { name: "Fuel & expenses", exact: true })
  .click();
await page
  .locator(".finance-workspace-tabs")
  .getByRole("button", { name: "Fuel log", exact: true })
  .click();
await page.locator(".finance-entry").first().waitFor();
assert.equal(await page.locator(".finance-entry").count(), 3);
assert.deepEqual(errors, []);
console.log(
  "PASS finance creation, full/partial consumption, totals, chart filtering, four viewports, English accessibility and offline persistence",
);
await browser.close();
