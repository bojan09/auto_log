import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8080/");
await page.evaluate(async () => {
  const { openDatabase } = await import("/src/storage.js");
  const { writeRow } = await import("/src/vault.js");
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
      odometer: 225000,
      unit: "km",
      currency: "MKD",
      variant: "2.0 Multijet Front Wheel Drive",
    });
});
await page.reload();
for (const width of [320, 390, 820, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  for (const route of [
    "dashboard",
    "fuel",
    "services",
    "settings",
    "profile",
    "garage",
  ]) {
    await page.goto("http://127.0.0.1:8080/#" + route);
    await page.locator("#app .heading").waitFor();
    for (const select of await page.locator("select:visible").all()) {
      const style = await select.evaluate((e) => ({
        appearance: getComputedStyle(e).appearance,
        image: getComputedStyle(e).backgroundImage,
        padding: parseFloat(getComputedStyle(e).paddingRight),
      }));
      assert.equal(style.appearance, "none");
      assert(style.image.includes("data:image/svg+xml") && style.padding >= 42);
    }
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route + " overflows",
    );
    if (width === 390 && ["dashboard", "fuel"].includes(route))
      await page.screenshot({
        path: "test-results/audit-" + route + "-390.png",
        fullPage: true,
      });
  }
}
await page.goto("http://127.0.0.1:8080/#dashboard");
const switcher = page.getByRole("combobox", {
  name: "Select vehicle",
  exact: true,
});
await switcher.selectOption("b");
await page
  .locator(".hero-copy")
  .getByRole("heading", { name: "Volkswagen Golf", exact: true })
  .waitFor();
await page.goto("http://127.0.0.1:8080/#fuel");
const message = page.locator('.metric[data-empty="true"]').first();
assert(
  Number.parseFloat(
    await message.evaluate((e) => getComputedStyle(e).fontSize),
  ) <= 14,
);
const disclosure = page
  .locator("details")
  .filter({
    has: page.locator("summary", { hasText: "How calculations work" }),
  })
  .first();
await disclosure.locator("summary").focus();
await page.keyboard.press("Enter");
assert(await disclosure.evaluate((e) => e.open));
await page.emulateMedia({ forcedColors: "active" });
assert.equal(
  await page
    .locator("select")
    .first()
    .evaluate((e) => getComputedStyle(e).appearance),
  "auto",
);
assert.deepEqual(errors, []);
await browser.close();
console.log(
  "PASS shared chevrons, select behavior, disclosure keyboard operation, compact empty metrics, forced colors and six pages at four widths",
);
