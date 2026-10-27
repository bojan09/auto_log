import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8080");
await page.locator("#quick-add").click();
for (const [key, value] of Object.entries({
  make: "Fiat",
  model: "Sedici",
  year: "2010",
  odometer: "120000",
  variant: "2.0 diesel",
}))
  await page.locator("#vehicle [name=" + key + "]").fill(value);
await page.getByRole("button", { name: "Save", exact: true }).click();
await page.getByRole("heading", { name: "Fiat Sedici", exact: true }).waitFor();
await mkdir("test-results", { recursive: true });
await page.screenshot({
  path: "test-results/controls-garage-390.png",
  fullPage: true,
  animations: "disabled",
});
await page.getByRole("button", { name: "Open dashboard", exact: true }).click();
await page.screenshot({
  path: "test-results/controls-dashboard-390.png",
  fullPage: true,
  animations: "disabled",
});
for (const theme of ["dark", "light"])
  for (const language of ["en", "mk"]) {
    await page.evaluate(
      ({ theme, language }) => {
        localStorage.setItem("theme", theme);
        localStorage.setItem("language", language);
      },
      { theme, language },
    );
    await page.reload();
    await page
      .locator("nav")
      .getByRole("button", {
        name: "More",
        exact: true,
      })
      .click();
    for (const [width, height] of [
      [320, 640],
      [360, 640],
      [390, 844],
    ]) {
      await page.setViewportSize({ width, height });
      const nav = page.locator(".floating-nav");
      const box = await nav.boundingBox();
      assert(
        box.x >= 11 && width - box.x - box.width >= 11,
        "Dock must float clear of both edges",
      );
      assert(
        height - box.y - box.height >= 11,
        "Dock must float above bottom edge",
      );
      assert.equal(
        await nav.evaluate((e) => getComputedStyle(e).position),
        "fixed",
      );
      for (const b of await nav.getByRole("button").all())
        if (await b.isVisible()) {
          const bounds = await b.boundingBox();
          assert(
            bounds.width >= 44 && bounds.height >= 44,
            "Each dock action has a 44px touch target",
          );
        }
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
      const last = page.locator(".vault button").last();
      const bounds = await last.boundingBox();
      assert(
        bounds.y + bounds.height < box.y,
        "Bottom actions must scroll clear of the dock",
      );
      await page.evaluate(() => scrollTo(0, 0));
      if (width === 390)
        await page.screenshot({
          path: `test-results/controls-${theme}-${language}-390.png`,
          fullPage: true,
          animations: "disabled",
        });
    }
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    assert.deepEqual(
      scan.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
      [],
    );
    await page.locator("#quick-add").focus();
    await page.keyboard.press("Enter");
    await page.locator("#editor").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await page.locator("#editor").waitFor({ state: "hidden" });
  }
await page.setViewportSize({ width: 1440, height: 900 });
await page.evaluate(() => {
  localStorage.setItem("theme", "dark");
  localStorage.setItem("language", "mk");
});
await page.reload();
await page.screenshot({
  path: "test-results/controls-garage-1440.png",
  fullPage: true,
  animations: "disabled",
});
assert.equal(await page.locator("#quick-add").isVisible(), true);
await page.evaluate(() => navigator.serviceWorker.ready);
await context.setOffline(true);
await page.reload();
assert.equal(
  await page
    .locator("#app .heading>button:not(.mobile-profile)")
    .evaluate((e) => getComputedStyle(e).borderRadius),
  "10px",
);
assert.deepEqual(errors, []);
console.log(
  "PASS floating dock geometry, touch targets, scroll clearance, keyboard add, English light/dark accessibility, desktop and offline controls",
);
await browser.close();
