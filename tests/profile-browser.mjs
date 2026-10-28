import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  acceptDownloads: true,
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8080/#garage");
await page.getByRole("heading", { name: "Garage", exact: true }).waitFor();
assert.equal(await page.locator(".app-bar").isVisible(), false);
assert.equal(await page.locator("#top-tools").isVisible(), false);
assert.equal(await page.locator(".floating-nav").isVisible(), true);
await page.getByRole("button", { name: "Open profile", exact: true }).click();
await page.getByRole("heading", { name: "Profile", exact: true }).waitFor();
assert.equal(await page.getByLabel("Theme", { exact: true }).count(), 0);
await page.getByLabel("Display name", { exact: true }).fill("Alex Driver");
await page
  .getByLabel("About you", { exact: true })
  .fill("Weekend mountain drives.");
await page.getByLabel("Profile photo", { exact: true }).setInputFiles({
  name: "fake.png",
  mimeType: "image/png",
  buffer: Buffer.from("<script>bad</script>"),
});
await page.getByRole("alert").filter({ hasText: "Choose a valid" }).waitFor();
const png = Buffer.from(
  await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 320;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f06a70";
    ctx.fillRect(0, 0, 160, 320);
    ctx.fillStyle = "#285c7f";
    ctx.fillRect(160, 0, 320, 320);
    ctx.fillStyle = "#61bca0";
    ctx.fillRect(480, 0, 160, 320);
    ctx.font = "700 105px Manrope";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#e8f4ff";
    ctx.fillText("AD", 320, 165);
    return canvas.toDataURL("image/png").split(",")[1];
  }),
  "base64",
);
await page
  .getByLabel("Profile photo", { exact: true })
  .setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: png });
await page.getByText("Photo ready. Save your profile to keep it.").waitFor();
await page.getByRole("button", { name: "Save profile", exact: true }).click();
await page.getByRole("status").filter({ hasText: "Profile saved." }).waitFor();
await page.reload();
await page.getByRole("button", { name: "Open profile", exact: true }).click();
await page.getByRole("heading", { name: "Alex Driver", exact: true }).waitFor();
assert.equal(
  await page.getByLabel("About you", { exact: true }).inputValue(),
  "Weekend mountain drives.",
);
const photo = await page.locator(".profile-avatar img").getAttribute("src");
assert(photo.startsWith("data:image/webp;base64,"));
assert(
  await page
    .locator(".profile-avatar img")
    .evaluate((i) => i.naturalWidth === 320 && i.naturalHeight === 320),
);
assert(
  await page.locator(".profile-avatar img").evaluate((image) => {
    const c = document.createElement("canvas");
    c.width = c.height = 320;
    c.getContext("2d").drawImage(image, 0, 0);
    const [r, g, b] = c.getContext("2d").getImageData(5, 5, 1, 1).data;
    return (
      Math.abs(r - 40) < 15 && Math.abs(g - 92) < 15 && Math.abs(b - 127) < 15
    );
  }),
  "Crop must preserve the center and discard outer stripes",
);
await mkdir("test-results/previews", { recursive: true });
for (const [width, height] of [
  [320, 640],
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
  assert.equal(await page.locator(".app-bar").isVisible(), width > 700);
  await page.screenshot({
    path: `test-results/previews/profile-${width}.png`,
    fullPage: true,
    animations: "disabled",
  });
}
assert.deepEqual(
  (
    await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()
  ).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  [],
);
await page.setViewportSize({ width: 390, height: 844 });
await page
  .locator("nav")
  .getByRole("button", { name: "More", exact: true })
  .click();
await page
  .locator(".vault-tabs")
  .getByRole("button", { name: "Settings", exact: true })
  .click();
assert.equal(await page.getByLabel("Display name", { exact: true }).count(), 0);
await page
  .locator(".vault-tabs")
  .getByRole("button", { name: "Backup & restore", exact: true })
  .click();
const download = page.waitForEvent("download");
await page
  .getByRole("button", { name: "Download full JSON backup", exact: true })
  .click();
const raw = await readFile(await (await download).path(), "utf8");
const backup = JSON.parse(raw);
assert.equal(
  backup.stores.settings.find((r) => r.id === "profile").values.avatar,
  photo,
);
await page.getByRole("button", { name: "Open profile", exact: true }).click();
await page.getByRole("button", { name: "Remove photo", exact: true }).click();
await page.getByRole("button", { name: "Save profile", exact: true }).click();
await page.getByRole("status").filter({ hasText: "Profile saved." }).waitFor();
assert.equal(await page.locator(".profile-avatar img").count(), 0);
await page
  .locator("nav")
  .getByRole("button", { name: "More", exact: true })
  .click();
await page
  .locator(".vault-tabs")
  .getByRole("button", { name: "Backup & restore", exact: true })
  .click();
await page.getByLabel("Choose JSON backup", { exact: true }).setInputFiles({
  name: "backup.json",
  mimeType: "application/json",
  buffer: Buffer.from(raw),
});
await page
  .getByRole("heading", { name: "Validated backup", exact: true })
  .waitFor();
page.once("dialog", (d) => d.accept());
await page
  .getByRole("button", { name: "Replace local data", exact: true })
  .click();
await page
  .getByRole("status")
  .filter({ hasText: "Backup restored." })
  .waitFor();
await page.getByRole("button", { name: "Open profile", exact: true }).click();
await page.locator(".profile-avatar img").waitFor();
assert.equal(
  await page.locator(".profile-avatar img").getAttribute("src"),
  photo,
);
await page.evaluate(() => navigator.serviceWorker.ready);
await context.setOffline(true);
await page.reload();
await page.getByRole("button", { name: "Open profile", exact: true }).click();
await page.getByRole("heading", { name: "Alex Driver", exact: true }).waitFor();
await page.waitForFunction(
  () => document.querySelector(".profile-avatar img")?.naturalWidth === 320,
);
assert.deepEqual(
  (
    await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()
  ).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  [],
);
assert.deepEqual(errors, []);
console.log(
  "PASS separate profile/settings, image validation/320px crop, avatar save/removal/backup recovery, mobile-only bottom navigation, five widths, accessibility and offline",
);
await browser.close();
