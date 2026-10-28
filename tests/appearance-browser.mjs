import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext();
const page = await context.newPage();
await page.goto("http://127.0.0.1:8080/#settings");
await page.getByRole("radio", { name: "Violet", exact: true }).check();
await page.getByRole("radio", { name: "Plum", exact: true }).check();
await page.getByRole("radio", { name: "Sunset", exact: true }).check();
assert.equal(
  await page.locator(".appearance-preview").getAttribute("data-background"),
  "sunset",
);
assert.equal(await page.locator("html").getAttribute("data-accent"), "blue");
await page.getByRole("button", { name: "Save", exact: true }).click();
await page.waitForFunction(
  () => document.documentElement.dataset.accent === "violet",
);
await page.reload();
await page.getByRole("radio", { name: "Violet", exact: true }).waitFor();
assert.equal(await page.locator("html").getAttribute("data-surface"), "plum");
assert.equal(
  await page.locator("html").getAttribute("data-background"),
  "sunset",
);
for (const width of [390, 820, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: `test-results/appearance-${width}.png`,
    fullPage: true,
  });
}
for (const theme of ["dark", "light"]) {
  await page.getByLabel("Theme", { exact: true }).selectOption(theme);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForFunction(
    (t) => document.documentElement.dataset.theme === t,
    theme,
  );
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  assert.deepEqual(
    results.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
    [],
  );
}
await page.evaluate(async () => {
  const { snapshot, parseBackup, readPreferences } = await import("/src/vault.js");
  const { openDatabase } = await import("/src/storage.js");
  const backup = await snapshot(await openDatabase(), readPreferences(localStorage));
  parseBackup(JSON.stringify(backup));
});
await browser.close();
console.log(
  "PASS appearance preview, save/reload, backup validation, responsive layout and light/dark accessibility",
);
