import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8080");
async function add(make, model) {
  await page.getByRole("button", { name: "+ Add vehicle" }).click();
  for (const [key, value] of Object.entries({
    make,
    model,
    year: "2010",
    variant: "2.0 MultiJet diesel 4x4",
    odometer: "120000",
  }))
    await page.locator(`[name=${key}]`).fill(value);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page
    .getByRole("heading", { name: make + " " + model, exact: true })
    .waitFor();
}
await add("Fiat", "Sedici");
await add("Volkswagen", "Golf");
await page
  .locator(".card")
  .filter({
    has: page.getByRole("heading", { name: "Fiat Sedici", exact: true }),
  })
  .getByRole("button", { name: "Open dashboard" })
  .click();
await page.getByRole("heading", { name: "Fiat Sedici" }).waitFor();
const switcher = page.getByRole("combobox", { name: "Select vehicle" });
await switcher.selectOption({ label: "Volkswagen Golf" });
await page
  .getByRole("heading", { name: "Volkswagen Golf", exact: true })
  .waitFor();
await page
  .getByRole("combobox", { name: "Select vehicle" })
  .selectOption({ label: "Fiat Sedici" });
await page.getByRole("heading", { name: "Fiat Sedici", exact: true }).waitFor();
await mkdir("test-results", { recursive: true });
for (const [width, height] of [
  [390, 844],
  [1440, 900],
]) {
  await page.setViewportSize({ width, height });
  await page.screenshot({
    path: `test-results/dashboard-${width}.png`,
    fullPage: true,
    animations: "disabled",
  });
}
await page
  .locator("nav")
  .getByRole("button", { name: "Garage", exact: true })
  .click();
await page
  .getByRole("button", { name: "Archive", exact: true })
  .first()
  .click();
await page.getByRole("button", { name: "Restore", exact: true }).waitFor();
await page.getByRole("button", { name: "Restore", exact: true }).click();
await page
  .getByRole("button", { name: "Archive", exact: true })
  .first()
  .waitFor();
await page.getByRole("button", { name: "Edit", exact: true }).first().click();
await page.locator("[name=photo]").setInputFiles({
  name: "photo.png",
  mimeType: "image/png",
  buffer: await page.screenshot(),
});
await page.getByRole("button", { name: "Save", exact: true }).click();
await page.locator("dialog").waitFor({ state: "hidden" });
await page.reload();
await page.getByRole("heading", { name: "Fiat Sedici", exact: true }).waitFor();
assert.equal(await page.locator(".card").count(), 2);
assert.equal(await page.locator('img[src^="data:image/"]').count(), 1);
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
    path: `test-results/garage-${width}.png`,
    fullPage: true,
    animations: "disabled",
  });
}
const fiat = page.locator(".card").filter({
  has: page.getByRole("heading", { name: "Fiat Sedici", exact: true }),
});
await fiat.getByRole("button", { name: "Edit", exact: true }).click();
await page.locator("[name=odometer]").fill("119000");
page.once("dialog", (dialog) => dialog.accept());
await page.getByRole("button", { name: "Save", exact: true }).click();
await page.locator("dialog").waitFor({ state: "hidden" });
assert((await fiat.textContent()).includes("119,000"));
const golf = page.locator(".card").filter({
  has: page.getByRole("heading", { name: "Volkswagen Golf", exact: true }),
});
page.once("dialog", (dialog) => dialog.dismiss());
await golf.getByRole("button", { name: "Delete", exact: true }).click();
assert.equal(await golf.count(), 1);
page.once("dialog", (dialog) => dialog.accept());
await golf.getByRole("button", { name: "Delete", exact: true }).click();
await page
  .getByRole("heading", { name: "Volkswagen Golf", exact: true })
  .waitFor({ state: "hidden" });

await page.getByRole("button", { name: "+ Add vehicle" }).click();
await page.getByLabel("Make", { exact: true }).waitFor();
await page.getByRole("button", { name: "Cancel", exact: true }).click();
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await page.context().setOffline(true);
await page.reload();
await page.getByRole("heading", { name: "Fiat Sedici" }).waitFor();
assert.equal(errors.length, 0, errors.join("\n"));
console.log(
  "PASS two vehicles, switching, archive/restore, photo persistence, localized form, offline reload, four viewport overflow checks; no page errors",
);
await browser.close();
