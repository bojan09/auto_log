import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext();
const page = await context.newPage();
await page.goto("http://127.0.0.1:8080");
for (const lang of ["en", "mk"]) {
  if (lang === "mk")
    await page.getByRole("button", { name: "MK", exact: true }).click();
  for (const dialog of [false, true]) {
    if (dialog)
      await page
        .getByRole("button", {
          name: lang === "en" ? "+ Add vehicle" : "+ Додај возило",
        })
        .click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
    );
    if (dialog) await page.keyboard.press("Escape");
  }
}
console.log("PASS axe WCAG A/AA checks: empty garage and modal in EN/MK");
await browser.close();
