import { test } from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { openDatabase, saveVehicle, stores } from "../src/storage.js";
test("schema and persisted vehicle edits preserve identity and independent vehicles", async () => {
  const factory = new IDBFactory();
  let db = await openDatabase(factory);
  assert.deepEqual([...db.objectStoreNames].sort(), stores.toSorted());
  const vehicle = {
    id: "sedici",
    make: "Fiat",
    model: "Sedici",
    odometer: 120000,
  };
  await saveVehicle(db, vehicle);
  await saveVehicle(db, {
    ...vehicle,
    id: "golf",
    make: "Volkswagen",
    model: "Golf",
  });
  await saveVehicle(db, { ...vehicle, archived: true });
  db.close();
  db = await openDatabase(factory);
  const rows = await new Promise((resolve) => {
    const r = db.transaction("vehicles").objectStore("vehicles").getAll();
    r.onsuccess = () => resolve(r.result);
  });
  assert.equal(rows.length, 2);
  assert.equal(rows.find((v) => v.id === "sedici").archived, true);
  assert.equal(rows.find((v) => v.id === "golf").model, "Golf");
  await assert.rejects(saveVehicle(db, { ...vehicle, odometer: -1 }));
  db.close();
});

test("English and Macedonian catalogs have equivalent nonempty keys", async () => {
  const { messages } = await import("../src/i18n.js");
  assert.deepEqual(
    Object.keys(messages.en).sort(),
    Object.keys(messages.mk).sort(),
  );
  for (const catalog of Object.values(messages))
    for (const text of Object.values(catalog))
      assert.equal(typeof text === "string" && text.trim().length > 0, true);
});
