import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8080/");
await page.locator("#quick-add").tap();
await page
  .getByRole("dialog", { name: "Quick add" })
  .getByRole("button", { name: /Add vehicle/ })
  .tap();
await page.getByLabel("Make", { exact: true }).fill("Fiat");
await page.getByLabel("Model", { exact: true }).fill("Sedici");
await page.getByLabel("Year", { exact: true }).fill("2010");
for (const [width, height] of [
  [390, 360],
  [844, 390],
  [390, 844],
]) {
  await page.setViewportSize({ width, height });
  await page.getByLabel("Model", { exact: true }).focus();
  await page.waitForFunction(() => {
    const field = document
      .querySelector('[name="model"]')
      .getBoundingClientRect();
    const body = document
      .querySelector(".vehicle-editor-body")
      .getBoundingClientRect();
    return field.top >= body.top && field.bottom <= body.bottom;
  });
  const footer = await page.locator(".vehicle-editor-footer").boundingBox();
  assert(
    footer.y >= 0 && footer.y + footer.height <= height + 1,
    "Footer visible in short viewport",
  );
  assert.equal(
    await page.getByLabel("Model", { exact: true }).inputValue(),
    "Sedici",
  );
  assert(
    await page
      .getByLabel("Model", { exact: true })
      .evaluate((e) => parseFloat(getComputedStyle(e).fontSize) >= 16),
  );
  const close = await page
    .getByRole("button", { name: "Close vehicle form" })
    .boundingBox();
  assert(close.width >= 44 && close.height >= 44);
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: `test-results/mobile-form-${width}-${height}.png`,
  });
}
// Simulated overlay keyboard: test viewport handling without claiming a real OS keyboard.
await page.evaluate(() => {
  const viewport = window.visualViewport;
  window.testViewport = { height: 420, scale: 1, offsetTop: 0 };
  for (const key of ["height", "scale", "offsetTop"])
    Object.defineProperty(viewport, key, {
      configurable: true,
      get: () => window.testViewport[key],
    });
  viewport.dispatchEvent(new Event("resize"));
});
await page.waitForFunction(
  () =>
    document.documentElement.style.getPropertyValue("--visible-height") ===
    "420px",
);
assert(
  await page
    .locator("#editor")
    .evaluate((e) => e.getBoundingClientRect().bottom <= 421),
);
await page.evaluate(() => {
  window.testViewport.scale = 2;
  window.visualViewport.dispatchEvent(new Event("resize"));
});
await page.waitForFunction(
  () =>
    document.documentElement.style.getPropertyValue("--keyboard-inset") ===
    "0px",
);
assert.equal(
  await page.getByLabel("Model", { exact: true }).inputValue(),
  "Sedici",
);
await page.getByRole("button", { name: "Close vehicle form" }).tap();
await page.evaluate(() => navigator.serviceWorker.ready);
await context.setOffline(true);
await page.reload();
await page.locator("#quick-add").tap();
await page.getByRole("dialog", { name: "Quick add" }).waitFor();
assert.deepEqual(errors, []);
await browser.close();
console.log(
  "PASS touch entry, portrait/landscape and short viewport sizing, 44px close target, 16px text, overlay viewport/zoom handling and offline launch",
);
