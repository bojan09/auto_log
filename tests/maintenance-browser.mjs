import {
  fillVehicleField,
  saveVehicleForm,
} from "./helpers/vehicle.mjs";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8080");
async function car(make, model) {
  await page
    .getByRole("button", { name: "+ Add vehicle", exact: true })
    .click();
  for (const [key, value] of Object.entries({
    make,
    model,
    year: "2010",
    odometer: "120000",
  }))
    await fillVehicleField(page, key, value);
  await saveVehicleForm(page);
  await page
    .getByRole("heading", { name: make + " " + model, exact: true })
    .waitFor();
}
await car("Fiat", "Sedici");
await car("Volkswagen", "Golf");
await page
  .locator(".card")
  .filter({
    has: page.getByRole("heading", { name: "Fiat Sedici", exact: true }),
  })
  .getByRole("button", { name: "Open dashboard" })
  .click();
await page
  .locator("nav")
  .getByRole("button", { name: "Services", exact: true })
  .click();
await page.getByRole("button", { name: "+ Add schedule" }).click();
let modal = page.getByRole("dialog", { name: "Add schedule" });
for (const [key, value] of Object.entries({
  title: "Oil and filter",
  baseDate: "2024-01-31",
  baseOdometer: "110000",
  months: "12",
  distance: "10000",
}))
  await modal.locator("[name=" + key + "]").fill(value);
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
await modal.getByRole("button", { name: "Save", exact: true }).click();
await page.locator(".service-card.overdue").waitFor();
await page
  .getByRole("button", { name: "Complete service", exact: true })
  .click();
modal = page.getByRole("dialog", { name: "Log service" });
await modal.locator("[name=cost]").fill("4500");
await modal.getByText("Provider & notes", { exact: true }).click();
await modal.locator("[name=provider]").fill("Local workshop");
await modal.locator("[name=notes]").fill("Oil and filter replaced");
await modal.getByRole("button", { name: "Save", exact: true }).click();
await page.locator(".service-card.scheduled").waitFor();
assert.equal(await page.locator(".service-timeline article").count(), 1);
assert(
  (await page.locator(".service-card.scheduled").textContent()).includes(
    "130,000",
  ),
);
await page.getByRole("button", { name: "Overdue", exact: true }).click();
assert.equal(
  await page
    .getByRole("button", { name: "Complete service", exact: true })
    .count(),
  0,
);
await page.getByRole("button", { name: "All", exact: true }).click();
await page
  .locator(".service-timeline")
  .getByRole("button", { name: "Edit", exact: true })
  .click();
modal = page.getByRole("dialog", { name: "Edit service" });
await modal.locator("[name=cost]").fill("4600");
await modal.getByRole("button", { name: "Save", exact: true }).click();
await page
  .locator(".service-timeline")
  .getByText("4,600 MKD · Local workshop")
  .waitFor();
await page
  .getByRole("combobox", { name: "Select vehicle", exact: true })
  .selectOption({ label: "Volkswagen Golf" });
assert.equal(await page.locator(".service-card").count(), 0);
await page
  .getByRole("combobox", { name: "Select vehicle", exact: true })
  .selectOption({ label: "Fiat Sedici" });
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
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/services-${width}.png`,
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
  .getByRole("heading", { name: "Service history", exact: true })
  .waitFor();
await page.setViewportSize({ width: 360, height: 640 });
assert(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
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
await page.getByRole("button", { name: "+ Add schedule" }).click();
await page
  .getByRole("dialog", { name: "Add schedule" })
  .getByLabel("Service name")
  .waitFor();
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
await page.keyboard.press("Escape");
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await page.getByRole("button", { name: "Services", exact: true }).click();
await page.locator(".service-timeline article").waitFor();
await context.setOffline(true);
await page.reload();
await page.getByRole("button", { name: "Services", exact: true }).click();
await page.locator(".service-timeline article").waitFor();
page.once("dialog", (d) => d.accept());
await page
  .locator(".service-timeline")
  .getByRole("button", { name: "Delete", exact: true })
  .click();
await page.locator(".service-card.overdue").waitFor();
assert.equal(await page.locator(".service-timeline article").count(), 0);
assert.deepEqual(errors, []);
console.log(
  "PASS Phase 2: completion, recurrence, filters, edits/deletion, car separation, English, offline, four viewports and axe",
);
await browser.close();
