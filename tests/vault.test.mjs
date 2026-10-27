import { test } from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { openDatabase, stores } from "../src/storage.js";
import {
  snapshot,
  restore,
  validateBackup,
  parseBackup,
  writeRow,
  documentData,
  validateAttachment,
  csv,
  calendar,
  reminderEvents,
  defaults,
} from "../src/vault.js";
import { vaultMessages } from "../src/vault-i18n.js";
import { removeItem, list } from "../src/maintenance.js";
const fixture = () => ({
  format: "AutoLog",
  version: 1,
  stores: {
    ...Object.fromEntries(stores.map((k) => [k, []])),
    vehicles: [
      {
        id: "sedici",
        make: "Fiat",
        model: "Sedici",
        year: 2010,
        unit: "km",
        odometer: 120000,
      },
    ],
    serviceSchedules: [
      {
        id: "oil",
        vehicleId: "sedici",
        title: "Oil",
        category: "oil",
        baseDate: "2025-01-01",
        baseOdometer: 100000,
        months: 12,
        distance: 15000,
        unit: "km",
        warnDays: 7,
        warnDistance: 500,
      },
    ],
    serviceRecords: [
      {
        id: "service",
        vehicleId: "sedici",
        scheduleId: "oil",
        title: "Oil & filter",
        category: "oil",
        date: "2025-02-01",
        odometer: 110000,
        unit: "km",
        cost: 2500,
        currency: "MKD",
      },
    ],
    checklists: [
      {
        id: "trip",
        vehicleId: "sedici",
        title: "Holiday",
        date: "2027-01-01",
        items: [{ text: "Check tyres", done: false }],
      },
    ],
    settings: [{ id: "preferences", values: defaults }],
  },
});
test("full backup roundtrip preserves files, relationships, preferences and isolates vehicles", async () => {
  const db = await openDatabase(new IDBFactory());
  const f = fixture();
  f.stores.vehicles.push({
    ...f.stores.vehicles[0],
    id: "golf",
    make: "VW",
    model: "Golf",
  });
  const file = new File(["%PDF-1.4\n%%EOF"], "invoice.pdf", {
    type: "application/pdf",
  });
  f.stores.attachments.push({
    id: "doc",
    vehicleId: "sedici",
    recordStore: "serviceRecords",
    recordId: "service",
    name: file.name,
    type: file.type,
    size: file.size,
    data: await documentData(file),
  });
  await restore(db, f);
  const exported = parseBackup(JSON.stringify(await snapshot(db)));
  await restore(db, {
    ...fixture(),
    stores: Object.fromEntries(stores.map((k) => [k, []])),
  });
  assert.equal((await list(db, "vehicles")).length, 0);
  await restore(db, exported);
  assert.deepEqual((await snapshot(db)).stores, exported.stores);
  await removeItem(db, "serviceRecords", "service");
  assert.equal((await list(db, "attachments"))[0].recordId, "");
  assert.doesNotThrow(() =>
    validateBackup({
      ...exported,
      stores: { ...exported.stores, serviceRecords: [], attachments: [] },
    }),
  );
  db.close();
});
test("invalid versions, structures, relationships, duplicate IDs, dangerous images and settings are rejected before writes", async () => {
  const db = await openDatabase(new IDBFactory());
  await restore(db, fixture());
  for (const mutate of [
    (f) => (f.version = 99),
    (f) => delete f.stores.fuelEntries,
    (f) => f.stores.vehicles.push(f.stores.vehicles[0]),
    (f) => (f.stores.serviceRecords[0].vehicleId = "missing"),
    (f) =>
      (f.stores.vehicles[0].photo = "data:image/svg+xml,<svg onload=alert(1)>"),
    (f) => (f.stores.settings[0].values = { theme: "evil" }),
    (f) => (f.stores.checklists[0].items = [{ text: "x", done: "yes" }]),
    (f) => (f.stores.serviceRecords[0].cost = -1),
    (f) => (f.stores.vehicles[0].odometer = "NaN"),
  ]) {
    const bad = fixture();
    mutate(bad);
    assert.throws(() => restore(db, bad));
    assert.equal((await list(db, "vehicles"))[0].id, "sedici");
  }
  assert.throws(() => parseBackup("{"));
  db.close();
});
test("restore transaction abort retains original records", async () => {
  const db = await openDatabase(new IDBFactory());
  await restore(db, fixture());
  const bad = fixture();
  bad.stores.vehicles[0].model = "Replacement"; // Inject a storage failure after validation through IDB request failure.
  const original = db.transaction.bind(db);
  db.transaction = (...args) => {
    const tx = original(...args);
    queueMicrotask(() => tx.abort());
    return tx;
  };
  await assert.rejects(restore(db, bad));
  db.transaction = original;
  assert.equal((await list(db, "vehicles"))[0].model, "Sedici");
  db.close();
});
test("document signature, size and encoded length are checked", async () => {
  await assert.rejects(
    documentData(
      new File(["<script>bad</script>"], "x.png", { type: "image/png" }),
    ),
  );
  await assert.rejects(
    documentData(
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.pdf", {
        type: "application/pdf",
      }),
    ),
  );
  const file = new File(["%PDF-1.4"], "x.pdf", { type: "application/pdf" });
  const data = await documentData(file);
  const row = {
    id: "d",
    vehicleId: "v",
    name: file.name,
    type: file.type,
    size: file.size,
    data,
  };
  assert.doesNotThrow(() => validateAttachment(row));
  assert.throws(() => validateAttachment({ ...row, size: 100 }));
});
test("CSV safely quotes formulas, commas and multiline values; ICS escapes and folds UTF-8", () => {
  const output = csv(
    [{ name: "=SUM(1,2)", notes: 'hello\n"world"' }],
    [
      { key: "name", label: "Name" },
      { key: "notes", label: "Notes" },
    ],
  );
  assert(output.includes('"\'=SUM(1,2)"'));
  assert(output.includes('hello\n""world""'));
  const ics = calendar([
    {
      id: "x",
      date: "2027-01-01",
      title: "Проверка ".repeat(30) + "\nBEGIN:VEVENT",
    },
  ]);
  assert(ics.includes("DTSTART;VALUE=DATE:20270101"));
  assert.equal((ics.match(/\r\nBEGIN:VEVENT/g) || []).length, 1);
  assert(
    ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75),
  );
  const f = fixture();
  assert.equal(
    reminderEvents(
      f.stores.vehicles[0],
      f.stores.serviceSchedules,
      f.stores.serviceRecords,
      f.stores.checklists,
    ).length,
    2,
  );
  f.stores.serviceSchedules[0].months = 0;
  assert.equal(
    reminderEvents(
      f.stores.vehicles[0],
      f.stores.serviceSchedules,
      f.stores.serviceRecords,
      [],
    ).length,
    0,
  );
});
test("vault English strings are complete", () => {
  assert.deepEqual(Object.keys(vaultMessages), ["en"]);
  assert(Object.values(vaultMessages.en).every(Boolean));
});

test("backup import rejects forged document types and trailing encoded data", () => {
  const base = {
    id: "d",
    vehicleId: "sedici",
    name: "invoice.pdf",
    type: "application/pdf",
    size: 8,
    data: "data:application/pdf;base64," + btoa("<script>"),
  };
  assert.throws(() => validateAttachment(base));
  assert.throws(() =>
    validateAttachment({
      ...base,
      size: 8,
      data: "data:application/pdf;base64," + btoa("%PDF-1.4") + ",junk",
    }),
  );
});
test("large linked-history backups validate within a practical time budget", () => {
  const data = fixture();
  data.stores.serviceRecords = Array.from({ length: 10000 }, (_, i) => ({
    ...data.stores.serviceRecords[0],
    id: "service" + i,
  }));
  const started = performance.now();
  assert.doesNotThrow(() => validateBackup(data));
  assert(performance.now() - started < 3000);
});
