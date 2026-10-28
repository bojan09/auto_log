import { chromium } from "playwright";
import assert from "node:assert/strict";
import { destinations } from "../src/navigation.js";
const b = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
for (const width of [390, 820, 1440]) {
  const c = await b.newContext({ viewport: { width, height: 900 } }),
    p = await c.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:8080");
  for (const [key, label] of destinations) {
    await p
      .locator(".floating-nav")
      .getByRole("button", { name: "More", exact: true })
      .click();
    await p.locator(".feature-directory summary").click();
    if (key === "dashboard")
      await p.screenshot({
        path: `test-results/navigation-${width}.png`,
        fullPage: false,
      });
    const links = await p.locator(".feature-links a").allTextContents();
    assert.deepEqual(
      links,
      destinations.map((d) => d[1]),
    );
    await p
      .locator(".feature-links")
      .getByRole("link", { name: label, exact: true })
      .click();
    await p.waitForFunction(() => location.hash.length > 1);
    assert.equal(
      new URL(p.url()).hash,
      "#" + (key === "reminders" ? "services" : key),
    );
    assert.equal(
      await p
        .locator("#app")
        .textContent()
        .then((t) => !!t.trim()),
      true,
    );
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    if (
      ["fuel", "services", "dashboard", "expenses", "reminders"].includes(key)
    )
      await p
        .locator("#app")
        .getByRole("button", { name: "Add vehicle", exact: true })
        .waitFor();
  }
  await p
    .locator(".floating-nav")
    .getByRole("button", { name: "Dashboard", exact: true })
    .click();
  await p
    .locator(".floating-nav")
    .getByRole("button", { name: "More", exact: true })
    .click();
  await p.goBack();
  await p
    .getByRole("heading", { name: "Your dashboard is ready", exact: true })
    .waitFor();
  await p.reload();
  await p
    .getByRole("heading", { name: "Your dashboard is ready", exact: true })
    .waitFor();
  assert.deepEqual(errors, []);
  await c.close();
}
console.log(
  "PASS identical feature directory at phone/tablet/desktop, every empty-state destination, direct routes, back and reload",
);
await b.close();
