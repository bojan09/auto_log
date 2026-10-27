import { fillVehicleField, saveVehicleForm } from "./helpers/vehicle.mjs";
import { chromium } from "playwright";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8080");
await page.getByRole("button", { name: "+ Add vehicle" }).click();
for (const [name, value] of Object.entries({
  make: "Fiat",
  model: "Sedici",
  year: "2010",
  variant: "2.0 MultiJet diesel 4x4",
  odometer: "120000",
}))
  await fillVehicleField(page, name, value);
await saveVehicleForm(page);
await page.getByRole("heading", { name: "Fiat Sedici" }).waitFor();
await page.reload();
await page.getByRole("heading", { name: "Fiat Sedici" }).waitFor();

await page.getByRole("heading", { name: "Garage", exact: true }).waitFor();
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await page.context().setOffline(true);
await page.reload();
await page.getByRole("heading", { name: "Fiat Sedici" }).waitFor();
console.log("PASS vehicle save, reload, English navigation, offline reload");
await browser.close();
