import { chromium } from "playwright";
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
await page.goto("http://127.0.0.1:8080/");
await page.locator("#quick-add").click();
const sheet = page.getByRole("dialog", { name: "Quick add", exact: true });
assert(await sheet.getByRole("button", { name: /Add fuel/ }).isDisabled());
await sheet.getByRole("button", { name: "Close", exact: true }).click();
await page.evaluate(async () => {
  const { openDatabase } = await import("/src/storage.js"),
    { writeRow } = await import("/src/vault.js");
  const db = await openDatabase(),
    date = new Date(),
    year = date.getFullYear();
  const date1 = new Date(date.getTime() - 40 * 86400000)
      .toISOString()
      .slice(0, 10),
    date2 = new Date(date.getTime() - 10 * 86400000).toISOString().slice(0, 10);
  await writeRow(db, "vehicles", {
    id: "a",
    make: "Fiat",
    model: "Sedici",
    year: 2010,
    odometer: 11000,
    unit: "km",
    currency: "EUR",
  });
  for (const [id, d, odo] of [
    ["f1", date1, 10000],
    ["f2", date2, 10600],
  ])
    await writeRow(db, "fuelEntries", {
      id,
      vehicleId: "a",
      date: d,
      odometer: odo,
      unit: "km",
      volume: 30,
      volumeUnit: "L",
      unitPrice: 2,
      total: 60,
      currency: "EUR",
      station: "Remembered station",
      full: true,
    });
  await writeRow(db, "serviceRecords", {
    id: "s",
    vehicleId: "a",
    date: date1,
    odometer: 10000,
    unit: "km",
    title: "Oil change",
    category: "oil",
    cost: 70,
    currency: "EUR",
    provider: "Trusted workshop",
  });
  await writeRow(db, "serviceSchedules", {
    id: "schedule",
    vehicleId: "a",
    title: "Oil",
    category: "oil",
    baseDate: date1,
    baseOdometer: 10000,
    unit: "km",
    distance: 2000,
    months: 12,
    warnDays: 30,
    warnDistance: 1500,
  });
});
await page.reload();
await page.locator("#quick-add").click();
await page.screenshot({ path: "test-results/journey-quick-add.png" });
const sheetAudit = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa"])
  .analyze();
assert.deepEqual(
  sheetAudit.violations.map((v) => v.id),
  [],
);
await sheet.getByRole("button", { name: /Add fuel/ }).click();
const form = page.locator("dialog[open] form");
assert.equal(
  await form.locator('[name="station"]').inputValue(),
  "Remembered station",
);
assert.equal(await form.locator('[name="currency"]').inputValue(), "EUR");
await form.locator('[name="volume"]').fill("20");
await form.locator('[name="unitPrice"]').fill("1.75");
assert.equal(await form.locator('[name="totalPaid"]').inputValue(), "35.00");
assert(await form.locator('[name="totalPaid"]').evaluate((e) => e.readOnly));
await form.getByLabel("Price per litre", { exact: true }).waitFor();
await form.locator('[name="volumeUnit"]').selectOption("USgal");
await form.getByLabel("Price per US gallon", { exact: true }).waitFor();
await form.locator('[name="volumeUnit"]').selectOption("UKgal");
await form.getByLabel("Price per imperial gallon", { exact: true }).waitFor();
await form.locator('[name="volumeUnit"]').selectOption("L");
await form.locator('[name="volume"]').fill("21");
assert.equal(await form.locator('[name="totalPaid"]').inputValue(), "36.75");
await form.getByLabel("Adjust total to match receipt").check();
await form.locator('[name="totalPaid"]').fill("34.50");
await form.locator('[name="volume"]').fill("21");
assert.equal(await form.locator('[name="totalPaid"]').inputValue(), "34.50");
await form.getByLabel("Adjust total to match receipt").uncheck();
assert.equal(await form.locator('[name="totalPaid"]').inputValue(), "36.75");
await form.locator('[name="volume"]').fill("");
assert.equal(await form.locator('[name="totalPaid"]').inputValue(), "");
await page.getByRole("button", { name: "Close entry form" }).click();
await page.locator("#quick-add").click();
await sheet.getByRole("button", { name: /Log service/ }).click();
assert.equal(
  await form.locator('[name="provider"]').inputValue(),
  "Trusted workshop",
);
await page.getByRole("button", { name: "Close entry form" }).click();
await page
  .getByText(/Estimated mileage due:/)
  .first()
  .waitFor();
const download = page.waitForEvent("download");
await page
  .getByRole("button", { name: "Export reminders", exact: true })
  .click();
assert((await download).suggestedFilename().endsWith(".ics"));
await page.evaluate(async () => {
  const { openDatabase } = await import("/src/storage.js"),
    { writeRow } = await import("/src/vault.js");
  await writeRow(await openDatabase(), "attachments", {
    id: "receipt",
    vehicleId: "a",
    recordStore: "serviceRecords",
    recordId: "s",
    name: "Oil invoice.pdf",
    type: "application/pdf",
    size: 8,
    data: "data:application/pdf;base64," + btoa("%PDF-1.4"),
  });
});
await page.goto("http://127.0.0.1:8080/#history");
await page
  .getByRole("searchbox", { name: "Search vehicle history" })
  .fill("invoice");
const receiptDownload = page.waitForEvent("download");
await page.getByRole("link", { name: "Download Oil invoice.pdf" }).click();
assert.equal((await receiptDownload).suggestedFilename(), "Oil invoice.pdf");
await page
  .getByRole("combobox", { name: "History type" })
  .selectOption("Document");
assert.equal(await page.locator(".history-record").count(), 1);
await page.getByRole("combobox", { name: "History type" }).selectOption("All");
await page
  .getByRole("searchbox", { name: "Search vehicle history" })
  .fill("Trusted workshop");
assert.equal(await page.locator(".history-record").count(), 1);
await page.getByRole("combobox", { name: "History type" }).selectOption("Fuel");
assert.equal(await page.locator(".history-record").count(), 0);
await page.getByRole("searchbox").fill("");
assert.equal(await page.locator(".history-record").count(), 2);
for (const width of [390, 820, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "test-results/journey-history-" + width + ".png",
    fullPage: true,
  });
}
await page
  .locator(".top-menu")
  .filter({ has: page.locator("summary", { hasText: "Tools" }) })
  .locator("summary")
  .click();
await page.getByRole("button", { name: "Quick add", exact: true }).click();
await sheet.getByRole("button", { name: "Close", exact: true }).click();
await page.setViewportSize({ width: 390, height: 844 });
const audit = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa"])
  .analyze();
assert.deepEqual(
  audit.violations.map((v) => v.id),
  [],
);
await page.goto("http://127.0.0.1:8080/#dashboard");
const exported = page.waitForEvent("download");
await page.getByRole("button", { name: "Export backup", exact: true }).click();
assert((await exported).suggestedFilename().endsWith(".json"));
await page.reload();
await page.getByText(/Last export requested:/).waitFor();
assert(await page.locator(".spending-insights").evaluate((e) => e.open));
await page.evaluate(async () => {
  const { openDatabase } = await import("/src/storage.js");
  const db = await openDatabase();
  await new Promise((resolve) => {
    const tx = db.transaction("fuelEntries", "readwrite");
    tx.objectStore("fuelEntries").clear();
    tx.oncomplete = resolve;
  });
});
await page.reload();
assert.equal(
  await page.locator(".spending-insights").evaluate((e) => e.open),
  false,
);
await page.evaluate(() => navigator.serviceWorker.ready);
await context.setOffline(true);
await page.reload();
await page.locator("#quick-add").click();
await sheet.getByRole("button", { name: /Add expense/ }).click();
await page.locator('dialog[open] [name="amount"]').waitFor();
await browser.close();
console.log(
  "PASS six improvements: quick add, useful dashboard, entry defaults/total override, forecasts/calendar, searchable history and backup reminder/offline use",
);
