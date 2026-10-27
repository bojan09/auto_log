export async function vehicleStep(page, step) {
  const editor = page.locator("#editor");
  const names = ["Vehicle", "Usage", "Review"];
  const target = editor.getByRole("button", { name: names[step], exact: true });
  if (await target.isDisabled()) {
    for (let i = 0; i < 3 && (await target.isDisabled()); i++)
      await editor.locator("[type=submit]").click();
  }
  if ((await target.getAttribute("aria-current")) !== "step")
    await target.click();
}
export async function fillVehicleField(page, key, value) {
  await vehicleStep(page, ["make", "model", "year"].includes(key) ? 0 : 1);
  const control = page.locator("#vehicle [name=" + key + "]");
  const details = control.locator("xpath=ancestor::details[1]");
  if ((await details.count()) && (await details.getAttribute("open")) === null)
    await details.locator("summary").click();
  if (await control.evaluate((el) => el.tagName === "SELECT"))
    await control.selectOption(value);
  else await control.fill(value);
}
export async function saveVehicleForm(page) {
  await page.waitForFunction(
    () => document.querySelector("#vehicle [name=photo]").validity.valid,
  );
  await vehicleStep(page, 2);
  await page.locator("#editor [type=submit]").click();
}
