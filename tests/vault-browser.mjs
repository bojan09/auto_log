import { fillVehicleField, saveVehicleForm } from "./helpers/vehicle.mjs";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8080");
await page.getByRole("button", { name: "+ Add vehicle", exact: true }).click();
for (const [key, value] of Object.entries({
  make: "Fiat",
  model: "Sedici",
  year: "2010",
  odometer: "120000",
  variant: "2.0 diesel",
}))
  await fillVehicleField(page, key, value);
await saveVehicleForm(page);
await page.getByRole("heading", { name: "Fiat Sedici", exact: true }).waitFor();
await page.evaluate(async () => {
  const { openDatabase } = await import("/src/storage.js");
  const { writeRow } = await import("/src/vault.js");
  const { list } = await import("/src/maintenance.js");
  const db = await openDatabase();
  const v = (await list(db, "vehicles"))[0];
  await writeRow(db, "serviceRecords", {
    id: "s1",
    vehicleId: v.id,
    title: "Oil & filter",
    category: "oil",
    date: "2025-01-01",
    odometer: 120000,
    unit: "km",
    cost: 2500,
    currency: "MKD",
    provider: "Workshop",
    notes: "Original receipt",
  });
  db.close();
});
await page.reload();
const more = () =>
  page
    .locator("nav")
    .getByRole("button", { name: "More", exact: true })
    .click();
const tab = (name) =>
  page
    .locator(".vault-tabs")
    .getByRole("button", { name, exact: true })
    .click();
const scan = async () =>
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
await more();
await tab("Documents");
await page.getByLabel("Document file", { exact: true }).setInputFiles({
  name: "invoice.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4\n%%EOF"),
});
await page
  .getByLabel("Linked record", { exact: true })
  .selectOption("serviceRecords:s1");
await page.getByRole("button", { name: "Save document", exact: true }).click();
await page.getByRole("heading", { name: "invoice.pdf" }).waitFor();
await page
  .locator("article")
  .filter({
    has: page.getByRole("heading", { name: "invoice.pdf", exact: true }),
  })
  .getByRole("button", { name: "Preview", exact: true })
  .click();
await page.getByRole("dialog", { name: "invoice.pdf" }).waitFor();
await page.keyboard.press("Escape");
await page.getByLabel("Document file", { exact: true }).setInputFiles({
  name: "receipt.png",
  mimeType: "image/png",
  buffer: await page.screenshot(),
});
await page.getByRole("button", { name: "Save document", exact: true }).click();
await page.getByRole("heading", { name: "receipt.png" }).waitFor();
await tab("Trip preparation");
await page.getByRole("button", { name: "Add checklist", exact: true }).click();
await page.getByLabel("Title", { exact: true }).fill("Winter trip");
await page.getByLabel("Reminder date", { exact: true }).fill("2027-01-01");
await page
  .getByLabel("Checklist items (one per line)", { exact: true })
  .fill("Check tyres\nPack first aid kit");
await page.getByRole("button", { name: "Save", exact: true }).click();
await page.getByLabel("Check tyres", { exact: true }).check();
await page.getByText("1 remaining", { exact: true }).waitFor();
let dl = page.waitForEvent("download");
await page
  .getByRole("button", { name: "Export calendar (.ics)", exact: true })
  .click();
const ics = await readFile(await (await dl).path(), "utf8");
assert(ics.includes("Winter trip"));
await tab("Settings");
await page.getByLabel("Theme", { exact: true }).selectOption("light");
await page.getByRole("radio", { name: "Mint", exact: true }).check();
await page
  .getByLabel("Default distance unit", { exact: true })
  .selectOption("mi");
await page.getByLabel("Default currency", { exact: true }).selectOption("EUR");
await page
  .getByLabel("Default fuel volume unit", { exact: true })
  .selectOption("UKgal");
await page
  .getByLabel("Fuel consumption display", { exact: true })
  .selectOption("UKmpg");
await page
  .getByLabel("Report date format", { exact: true })
  .selectOption("iso");
await page.getByRole("button", { name: "Save", exact: true }).click();
await page.waitForFunction(
  () => document.documentElement.dataset.theme === "light",
);
await scan();
for (const name of ["Garage", "Dashboard", "Services", "Fuel & expenses"]) {
  await page.locator("nav").getByRole("button", { name, exact: true }).click();
  await scan();
}
await more();
await page.reload();
await more();
assert.equal(
  await page.getByLabel("Default distance unit", { exact: true }).inputValue(),
  "mi",
);
assert.equal(
  await page.getByLabel("Default currency", { exact: true }).inputValue(),
  "EUR",
);
assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
assert(
  await page.evaluate(() =>
    [...new FormData(document.querySelector(".settings-grid"))].every(
      ([key, value]) => localStorage.getItem(key) === value,
    ),
  ),
);
await page
  .locator(".vault-tabs")
  .getByRole("button", { name: "Garage", exact: true })
  .click();
await page.getByRole("button", { name: "+ Add vehicle", exact: true }).click();
assert.equal(await page.locator("#vehicle [name=unit]").inputValue(), "mi");
assert.equal(
  await page.locator("#vehicle [name=currency]").inputValue(),
  "EUR",
);
await page.keyboard.press("Escape");
await page
  .locator(".floating-nav")
  .getByRole("button", { name: "More", exact: true })
  .click();
await tab("Backup & restore");
dl = page.waitForEvent("download");
await page
  .getByRole("button", { name: "Download full JSON backup", exact: true })
  .click();
const backup = await readFile(await (await dl).path(), "utf8");
const parsed = JSON.parse(backup);
assert.equal(
  parsed.stores.attachments.find((d) => d.name === "invoice.pdf").recordId,
  "s1",
);
assert.equal(parsed.stores.checklists[0].items[0].done, true);
await page.getByLabel("Choose JSON backup", { exact: true }).setInputFiles({
  name: "invalid.json",
  mimeType: "application/json",
  buffer: Buffer.from('{"version":999}'),
});
await page
  .getByRole("alert")
  .filter({ hasText: "Invalid or unsupported backup" })
  .waitFor();
// Replace only this isolated browser test context's data, then recover through the UI.
await page.evaluate(async () => {
  const { openDatabase, stores } = await import("/src/storage.js");
  const { restore } = await import("/src/vault.js");
  const db = await openDatabase();
  await restore(db, {
    format: "AutoLog",
    version: 1,
    stores: Object.fromEntries(stores.map((k) => [k, []])),
  });
  db.close();
});
await page.reload();
await more();
await tab("Backup & restore");
await page.getByLabel("Choose JSON backup", { exact: true }).setInputFiles({
  name: "backup.json",
  mimeType: "application/json",
  buffer: Buffer.from(backup),
});
await page.getByRole("heading", { name: "Validated backup" }).waitFor();
page.once("dialog", (d) => d.dismiss());
await page
  .getByRole("button", { name: "Replace local data", exact: true })
  .click();
assert.equal(
  await page.evaluate(async () => {
    const { openDatabase } = await import("/src/storage.js");
    const { list } = await import("/src/maintenance.js");
    return (await list(await openDatabase(), "vehicles")).length;
  }),
  0,
);
page.once("dialog", (d) => d.accept());
await page
  .getByRole("button", { name: "Replace local data", exact: true })
  .click();
await tab("Documents");
await page.getByRole("heading", { name: "invoice.pdf" }).waitFor();
await page.evaluate(() => navigator.serviceWorker.ready);
await context.setOffline(true);
await page.reload();
await more();
await tab("Documents");
await page
  .locator("article")
  .filter({
    has: page.getByRole("heading", { name: "invoice.pdf", exact: true }),
  })
  .getByRole("button", { name: "Preview", exact: true })
  .click();
assert(
  (
    await page.getByRole("dialog").locator("iframe").getAttribute("src")
  ).startsWith("data:application/pdf"),
);
await page.keyboard.press("Escape");
await page
  .locator("article")
  .filter({
    has: page.getByRole("heading", { name: "receipt.png", exact: true }),
  })
  .getByRole("button", { name: "Preview", exact: true })
  .click();
await page.waitForFunction(
  () => document.querySelector("dialog[open] img")?.naturalWidth > 0,
);
await page.keyboard.press("Escape");
await tab("Reports");
dl = page.waitForEvent("download");
await page
  .locator("article")
  .filter({ has: page.getByRole("heading", { name: "Services", exact: true }) })
  .getByRole("button", { name: "Download CSV" })
  .click();
assert(
  (await readFile(await (await dl).path(), "utf8")).includes("Oil & filter"),
);
await page.getByRole("button", { name: "Open printable report" }).click();
await page
  .getByRole("dialog")
  .getByText("Oil & filter", { exact: true })
  .waitFor();
await mkdir("test-results", { recursive: true });
await page.pdf({
  path: "test-results/phase5-report.pdf",
  preferCSSPageSize: true,
});
assert((await readFile("test-results/phase5-report.pdf")).length > 1000);
await page.keyboard.press("Escape");
await tab("Settings");
await page.getByLabel("Theme", { exact: true }).selectOption("dark");
assert.equal(await page.locator("select[name=language]").count(), 0);
await page.getByRole("button", { name: "Save", exact: true }).click();
await page.getByLabel("Theme", { exact: true }).waitFor();
await scan();
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
    path: `test-results/phase5-settings-${width}.png`,
    fullPage: true,
    animations: "disabled",
  });
}
await tab("Documents");
await page.getByRole("heading", { name: "invoice.pdf" }).waitFor();
await scan();
await page
  .locator("article")
  .filter({
    has: page.getByRole("heading", { name: "invoice.pdf", exact: true }),
  })
  .getByRole("button", { name: "Preview", exact: true })
  .click();
await scan();
await page.keyboard.press("Escape");
await page.screenshot({
  path: "test-results/phase5-documents-1440.png",
  fullPage: true,
  animations: "disabled",
});
await page.setViewportSize({ width: 390, height: 844 });
assert(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.screenshot({
  path: "test-results/phase5-documents-390.png",
  fullPage: true,
  animations: "disabled",
});
assert.deepEqual(errors, []);
console.log(
  "PASS Phase 5: linked document, checklist/calendar, persisted defaults, confirmed backup recovery, offline preview/CSV/PDF, English accessibility, four viewports",
);
await browser.close();
