import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({ locale: "mk-MK" });
const page = await context.newPage();
await page.addInitScript(() => localStorage.setItem("language", "mk"));
for (const theme of ["dark", "light"]) {
  await page.goto("http://127.0.0.1:8080");
  await page.evaluate((theme) => localStorage.setItem("theme", theme), theme);
  await page.reload();
  await page.getByRole("heading", { name: "Garage", exact: true }).waitFor();
  assert.equal(await page.locator("html").getAttribute("lang"), "en");
  assert.equal(await page.locator("#language").count(), 0);
  for (const dialog of [false, true]) {
    if (dialog)
      await page.getByRole("button", { name: "+ Add vehicle" }).click();
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      scan.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
    );
    if (dialog) await page.keyboard.press("Escape");
  }
}
console.log(
  "PASS English-only locale migration and WCAG A/AA: light/dark empty garage and modal",
);
await browser.close();
