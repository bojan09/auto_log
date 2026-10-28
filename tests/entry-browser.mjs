import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import {
  fillVehicleField,
  vehicleStep,
  saveVehicleForm,
} from "./helpers/vehicle.mjs";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8080/#garage");
await page.locator("#quick-add").click();
await page
  .getByRole("dialog", { name: "Quick add", exact: true })
  .getByRole("button", { name: "Add vehicle", exact: false })
  .click();
await page.locator("#editor [type=submit]").click();
assert.equal(
  await page.locator("#vehicle [name=make]").getAttribute("aria-invalid"),
  "true",
);
for (const [key, value] of Object.entries({
  make: "Fiat",
  model: "Sedici",
  year: "2010",
  odometer: "213000",
  nickname: "Mountain companion",
  plate: "AB 123",
  variant: "2.0 MultiJet",
  notes: "Family car",
}))
  await fillVehicleField(page, key, value);
await page.locator("#vehicle [name=photo]").setInputFiles({
  name: "bad.png",
  mimeType: "image/png",
  buffer: Buffer.from("invalid image"),
});
await page
  .locator(".photo-error")
  .filter({ hasText: "could not be opened" })
  .waitFor();
await page.locator("#editor [type=submit]").click();
assert.equal(
  await page.locator('.vehicle-step[data-step="1"]').isVisible(),
  true,
);
await page.locator("#vehicle [name=photo]").setInputFiles([]);
await page.locator("#editor [type=submit]").click();
assert.match(await page.locator(".vehicle-review").textContent(), /213,000 km/);
assert.match(
  await page.locator(".vehicle-review").textContent(),
  /Mountain companion/,
);
await vehicleStep(page, 0);
assert.equal(
  await page.locator("#vehicle [name=model]").inputValue(),
  "Sedici",
);
await mkdir("test-results/entry", { recursive: true });
for (const [width, height] of [
  [360, 640],
  [390, 844],
  [768, 1024],
  [1440, 900],
  [390, 500],
]) {
  await page.setViewportSize({ width, height });
  for (const step of [0, 1, 2]) {
    await vehicleStep(page, step);
    if (step === 1)
      while (await page.locator(".vehicle-optional[open] summary").count())
        await page.locator(".vehicle-optional[open] summary").first().click();
    const footer = await page.locator(".vehicle-editor-footer").boundingBox();
    assert(
      footer.y >= 0 && footer.y + footer.height <= height + 1,
      `footer visible ${width}x${height}`,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.screenshot({
      path: `test-results/entry/vehicle-${width}x${height}-${step}.png`,
    });
  }
}
await page.setViewportSize({ width: 390, height: 844 });
for (const theme of ["dark", "light"])
  for (const step of [0, 1, 2]) {
    await page.evaluate(
      (theme) => (document.documentElement.dataset.theme = theme),
      theme,
    );
    await vehicleStep(page, step);
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
await page.evaluate(() => (document.documentElement.dataset.theme = "dark"));
await saveVehicleForm(page);
await page.getByRole("heading", { name: "Fiat Sedici", exact: true }).waitFor();
await page.reload();
await page.getByRole("heading", { name: "Fiat Sedici", exact: true }).waitFor();
await page
  .locator("nav")
  .getByRole("button", { name: "Fuel & expenses", exact: true })
  .click();
await page.getByRole("button", { name: "+ Add fill-up", exact: true }).click();
for (const [width, height] of [
  [360, 640],
  [768, 1024],
  [1440, 900],
]) {
  await page.setViewportSize({ width, height });
  const footer = await page.locator(".record-editor-footer").boundingBox();
  assert(footer.y >= 0 && footer.y + footer.height <= height + 1);
  await page.screenshot({ path: `test-results/entry/fuel-${width}.png` });
}
for (const theme of ["dark", "light"]) {
  await page.evaluate(
    (theme) => (document.documentElement.dataset.theme = theme),
    theme,
  );
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
await page
  .getByRole("button", { name: "Close entry form", exact: true })
  .click();
assert.deepEqual(errors, []);
console.log(
  "PASS guided vehicle validation, invalid photo recovery, preserved values, final save/reload, anchored actions at five viewports, three-step accessibility",
);
await browser.close();
