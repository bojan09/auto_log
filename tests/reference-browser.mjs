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
page.setDefaultTimeout(10000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8080/#garage");
await page.evaluate(async () => {
  const { openDatabase } = await import("/src/storage.js");
  const { writeRow } = await import("/src/vault.js");
  const db = await openDatabase();
  const year = new Date().getFullYear();
  for (const v of [
    {
      id: "sedici",
      make: "Fiat",
      model: "Sedici",
      year: 2010,
      odometer: 11500,
      unit: "km",
      currency: "MKD",
      variant: "2.0 Diesel · Manual · 4×4",
    },
    {
      id: "golf",
      make: "Volkswagen",
      model: "Golf",
      year: 2015,
      odometer: 80000,
      unit: "km",
      currency: "EUR",
      variant: "1.6 Diesel",
    },
  ])
    await writeRow(db, "vehicles", v);
  for (const [id, date, odometer, volume] of [
    ["f1", year + "-01-01", 10000, 50],
    ["f2", year + "-01-15", 10500, 50],
    ["f3", year + "-02-15", 11000, 55],
    ["f4", year + "-03-15", 11500, 40],
  ])
    await writeRow(db, "fuelEntries", {
      id,
      vehicleId: "sedici",
      date,
      odometer,
      unit: "km",
      volume,
      volumeUnit: "L",
      unitPrice: 80,
      total: volume * 80,
      currency: "MKD",
      full: true,
      station: "Fuel station",
    });
  await writeRow(db, "serviceSchedules", {
    id: "oil",
    vehicleId: "sedici",
    title: "Oil change",
    category: "oil",
    baseDate: year + "-01-01",
    baseOdometer: 10000,
    unit: "km",
    months: 12,
    distance: 10000,
    warnDays: 7,
    warnDistance: 500,
  });
  await writeRow(db, "serviceRecords", {
    scheduleId: "oil",
    id: "s1",
    vehicleId: "sedici",
    date: year + "-01-03",
    odometer: 10100,
    unit: "km",
    title: "Oil & filter",
    category: "oil",
    cost: 2500,
    currency: "MKD",
    provider: "Workshop",
    notes: "",
  });
  await writeRow(db, "expenseEntries", {
    id: "e1",
    vehicleId: "sedici",
    date: year + "-01-05",
    title: "Parking",
    category: "parking",
    amount: 300.55,
    currency: "MKD",
  });
  db.close();
  localStorage.setItem("selected", "sedici");
});
await page.goto("http://127.0.0.1:8080/");
await page.locator(".vehicle-hero").waitFor();
assert.equal(new URL(page.url()).hash, "#dashboard");
const dashboard = () =>
  page
    .locator("nav")
    .getByRole("button", { name: "Dashboard", exact: true })
    .click();
await dashboard();
await page.locator(".vehicle-hero img").waitFor();
assert.equal(await page.locator("aside").count(), 0);
assert(
  (await page.locator(".economy .metric").textContent()).includes(
    "9.7 L/100km",
  ),
);
assert(
  (await page.locator(".spending .metric").textContent()).includes(
    "18,400.55 MKD",
  ),
);
assert.equal(await page.locator(".activity-row").count(), 4);
for (const [label, input] of [
  ["Add fuel", "volume"],
  ["Add service", "provider"],
  ["Add expense", "amount"],
  ["Trip checklist", "title"],
]) {
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.getByRole("dialog").waitFor();
  if (
    input === "provider" &&
    !(await page.getByRole("dialog").locator("[name=provider]").isVisible())
  )
    await page.getByText("Provider & notes", { exact: true }).click();
  await page
    .getByRole("dialog")
    .locator("[name=" + input + "]")
    .waitFor();
  await page.keyboard.press("Escape");
  await dashboard();
}
const cars = page
  .locator(".top-menu")
  .filter({ has: page.locator("summary", { hasText: "Vehicles" }) });
await cars.locator("summary").click();
await cars
  .getByRole("button", { name: "Volkswagen Golf", exact: true })
  .click();
await page
  .getByRole("heading", { name: "Volkswagen Golf", exact: true })
  .waitFor();
assert.equal(await page.locator(".spending .metric").textContent(), "0 EUR");
assert.equal(await page.locator(".activity-row").count(), 0);
await cars.locator("summary").click();
await cars.getByRole("button", { name: "Fiat Sedici", exact: true }).click();
const tools = page
  .locator(".top-menu")
  .filter({ has: page.locator("summary", { hasText: "Tools" }) });
await tools.locator("summary").click();
await page.keyboard.press("Escape");
assert.equal(await tools.getAttribute("open"), null);
await tools.locator("summary").click();
await tools.getByRole("button", { name: "Documents", exact: true }).click();
await page.getByLabel("Document file", { exact: true }).waitFor();
await dashboard();
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
  if (width > 700) {
    const bar = await page.locator(".app-bar").boundingBox();
    assert(bar.height <= 64);
    await cars.locator("summary").click();
    const dropdown = await cars.locator(".dropdown-panel").boundingBox();
    assert(dropdown.x >= 0 && dropdown.x + dropdown.width <= width);
    await page.keyboard.press("Escape");
  } else {
    assert.equal(await page.locator(".app-bar").isVisible(), false);
    assert.equal(await page.locator("#top-tools").isVisible(), false);
  }
  const dock = await page.locator(".floating-nav").boundingBox();
  assert(height - dock.y - dock.height >= 11);
  assert(dock.x >= 11);
  await page.screenshot({
    path: `test-results/reference-dashboard-${width}.png`,
    fullPage: true,
    animations: "disabled",
  });
  if (width === 390 || width === 1440)
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
}
await page.getByRole("button", { name: "Toggle theme", exact: true }).click();
assert.equal(await page.locator("html").getAttribute("data-theme"), "light");

await page.setViewportSize({ width: 390, height: 844 });
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
assert(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.evaluate(() => navigator.serviceWorker.ready);
await context.setOffline(true);
await page.reload();
await page
  .locator("nav")
  .getByRole("button", { name: "Dashboard", exact: true })
  .click();
await page.locator(".recent-activity").waitFor();
assert.equal(await page.locator("aside").count(), 0);
assert.deepEqual(errors, []);
console.log(
  "PASS compact reference dashboard, exact totals and vehicle isolation, quick-entry forms, dropdown navigation/Escape, floating dock at four widths, English themes and offline",
);
await browser.close();
