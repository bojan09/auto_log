import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  }),
  page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8080/#garage");
await page.getByRole("heading", { name: "Garage", exact: true }).waitFor();
await page.evaluate(async () => {
  const { openDatabase } = await import("/src/storage.js"),
    { writeRow } = await import("/src/vault.js");
  const db = await openDatabase();
  for (const [id, make, model] of [
    ["a", "Fiat", "Sedici"],
    ["b", "Volkswagen", "Golf"],
  ])
    await writeRow(db, "vehicles", {
      id,
      make,
      model,
      year: 2010,
      odometer: 213000,
      unit: "km",
      currency: "EUR",
      variant: "2.0 Diesel · Manual",
      fuel: "diesel",
    });
  const year = new Date().getFullYear();
  for (const [id, vehicleId, currency, total] of [
    ["f1", "a", "EUR", 40],
    ["f2", "b", "EUR", 60],
    ["f3", "a", "USD", 90],
  ])
    await writeRow(db, "fuelEntries", {
      id,
      vehicleId,
      currency,
      total,
      date: year + "-01-02",
      volume: 20,
      volumeUnit: "L",
      unitPrice: 2,
      odometer: 212000,
      unit: "km",
      full: true,
      station: "Local station",
    });
  localStorage.setItem("selected", "a");
});
await page.reload();
const nav = (name) =>
  page.locator(".floating-nav").getByRole("button", { name, exact: true });
await nav("Dashboard").click();
const monthly = page.locator(".monthly-fuel");
assert.match(await monthly.textContent(), /40 EUR/);
await monthly.getByLabel("Vehicle", { exact: true }).selectOption("all");
assert.match(await monthly.textContent(), /100 EUR/);
await monthly.getByLabel("Currency", { exact: true }).selectOption("USD");
assert.match(await monthly.textContent(), /90 USD/);
await monthly.getByRole("button", { name: /Jan .*90 USD/ }).click();
assert.match(
  await monthly.locator(".fuel-drilldown").textContent(),
  /1 transactions/,
);
assert.match(
  await monthly.locator(".fuel-drilldown").textContent(),
  /Fiat Sedici/,
);
await nav("Garage").click();
await page
  .locator(".garage-card")
  .filter({
    has: page.getByRole("heading", { name: "Fiat Sedici", exact: true }),
  })
  .getByRole("button", { name: "View details", exact: true })
  .click();
const detail = page.getByRole("dialog", {
  name: "Vehicle details",
  exact: true,
});
await detail.getByRole("button", { name: "Fuel", exact: true }).click();
assert.equal(await detail.locator(".detail-record").count(), 2);
await detail.getByRole("button", { name: "Expenses", exact: true }).click();
assert.match(await detail.textContent(), /No expenses/);
const scan = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa"])
  .analyze();
assert.deepEqual(
  scan.violations.map((v) => ({
    id: v.id,
    nodes: v.nodes.map((n) => n.failureSummary),
  })),
  [],
);
await detail.getByRole("button", { name: "Close", exact: true }).click();
await mkdir("test-results/rebuild", { recursive: true });
const views = [
  ["Garage", () => nav("Garage").click()],
  ["Dashboard", () => nav("Dashboard").click()],
  ["Maintenance", () => nav("Services").click()],
  ["Fuel", () => nav("Fuel & expenses").click()],
  ["Settings", () => nav("More").click()],
  [
    "Profile",
    () =>
      page
        .getByRole("button", { name: "Open profile", exact: true })
        .filter({ visible: true })
        .first()
        .click(),
  ],
];
for (const [width, height] of [
  [360, 800],
  [390, 844],
  [700, 900],
  [768, 1024],
  [820, 1180],
  [1280, 900],
  [1440, 900],
]) {
  await page.setViewportSize({ width, height });
  for (const [name, open] of views) {
    if (name === "Garage" && width <= 700) {
      await nav("More").click();
      await page
        .locator(".vault-tabs")
        .getByRole("button", { name: "Garage", exact: true })
        .click();
    } else await open();
    await page.locator("#app").waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `${name} overflow at ${width}`,
    );
    await page.screenshot({
      path: `test-results/rebuild/${name.toLowerCase()}-${width}.png`,
      fullPage: true,
    });
    if (name === "Fuel" && [390, 820, 1440].includes(width))
      for (const mode of ["Fuel log", "Expenses", "Overview"]) {
        await page
          .locator(".finance-workspace-tabs")
          .getByRole("button", { name: mode, exact: true })
          .click();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        await page.screenshot({
          path: `test-results/rebuild/finance-${mode.replace(" ", "-").toLowerCase()}-${width}.png`,
          fullPage: true,
        });
      }
  }
}
await page.setViewportSize({ width: 390, height: 844 });
await nav("More").click();
for (const tab of [
  "Documents",
  "Reports",
  "Trip preparation",
  "Backup & restore",
]) {
  const button = page
    .locator(".vault-tabs")
    .getByRole("button", { name: tab, exact: true });

  await button.click();
  await page.screenshot({
    path: `test-results/rebuild/workspace-${tab.split(" ")[0].toLowerCase()}.png`,
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
}
for (const theme of ["dark", "light"]) {
  await page.evaluate(
    (theme) => (document.documentElement.dataset.theme = theme),
    theme,
  );
  await nav("Dashboard").click();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  assert.deepEqual(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.failureSummary),
    })),
    [],
  );
}
await writeFile(
  "test-results/rebuild/runtime.json",
  JSON.stringify(
    {
      pageErrors: errors,
      viewportWidths: [360, 390, 700, 768, 820, 1280, 1440],
      resources: await page.evaluate(() =>
        performance.getEntriesByType("resource").map((r) => ({
          name: r.name.split("/").pop(),
          bytes: r.transferSize,
        })),
      ),
    },
    null,
    2,
  ),
);
assert.deepEqual(errors, []);
console.log(
  "PASS monthly vehicle/currency filters and drilldown, vehicle detail history, seven-width screen review, dark/light dashboard and detail accessibility",
);
await browser.close();
