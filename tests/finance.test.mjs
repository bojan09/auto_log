import { test } from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { IDBFactory } from "fake-indexeddb";
import { openDatabase, saveVehicle } from "../src/storage.js";
import { list } from "../src/maintenance.js";
import {
  fuelCycles,
  consumption,
  efficiency,
  ledger,
  summarize,
  priorPeriod,
  costPerDistance,
  validateFinance,
  saveFinance,
  deleteFinance,
} from "../src/finance.js";
import { financeMessages } from "../src/finance-i18n.js";
const fill = (id, date, odometer, volume = 40, full = true) => ({
  id,
  vehicleId: "sedici",
  date,
  odometer,
  unit: "km",
  volume,
  volumeUnit: "L",
  full,
  missed: false,
  unitPrice: 80,
  total: volume * 80,
  currency: "MKD",
});
const base = [
  fill("a", "2025-01-01", 10000, 50),
  fill("b", "2025-01-05", 10200, 20, false),
  fill("c", "2025-01-10", 10500, 30),
];
test("full-to-full sums partial fills and excludes the starting fill", () => {
  const cycles = fuelCycles(base);
  assert.equal(cycles.length, 1);
  assert.equal(cycles[0].litres, 50);
  assert.equal(cycles[0].distance, 500);
  assert.equal(consumption(cycles), 10);
  assert.equal(consumption(fuelCycles(base.slice(0, 2))), null);
  assert.equal(consumption(fuelCycles([base[1], base[2]])), null);
});
test("missing fills break the chain; next full tank becomes a new baseline", () => {
  assert.equal(
    fuelCycles([base[0], { ...base[1], missed: true }, base[2]]).length,
    0,
  );
  const result = fuelCycles([
    base[0],
    { ...base[1], missed: true },
    base[2],
    fill("d", "2025-01-20", 11000, 40),
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].l100, 8);
});
test("unit conversion and weighted average are calculated before display rounding", () => {
  const first = {
    ...fill("a", "2025-01-01", 100),
    unit: "mi",
    volumeUnit: "USgal",
    volume: 10,
  };
  const second = {
    ...fill("b", "2025-01-02", 200),
    unit: "mi",
    volumeUnit: "USgal",
    volume: 4,
  };
  const l100 = consumption(fuelCycles([first, second]));
  assert(Math.abs(efficiency(l100, "USmpg") - 25) < 1e-6);
  assert.equal(
    consumption([
      { distance: 100, litres: 5 },
      { distance: 900, litres: 90 },
    ]),
    9.5,
  );
  assert.equal(efficiency(null, "UKmpg"), null);
});
test("ledger uses source records once and separates currencies and date ranges", () => {
  const rows = ledger(
    [base[0]],
    [
      {
        id: "e",
        date: "2025-01-05",
        amount: 100,
        category: "parking",
        currency: "MKD",
      },
      {
        id: "e2",
        date: "2025-01-05",
        amount: 200,
        category: "repair",
        currency: "EUR",
      },
    ],
    [{ id: "s", date: "2025-01-05", cost: 1000, currency: "MKD" }],
  );
  const summary = summarize(rows, "MKD", "2025-01-01", "2025-01-31");
  assert.equal(summary.total, 5100);
  assert.equal(summary.byCategory.fuel, 4000);
  assert.equal(summary.byCategory.service, 1000);
  assert.equal(summary.rows.length, 3);
  assert.equal(summarize(rows, "EUR", "2025-01-01", "2025-01-31").total, 200);
  assert.equal(summarize(rows, "MKD", "2025-02-01", "2025-02-28").total, 0);
});
test("cost/km requires increasing observed mileage and bounds its cost window", () => {
  const rows = ledger(
    base,
    [
      {
        id: "before",
        date: "2024-12-31",
        amount: 999999,
        category: "repair",
        currency: "MKD",
      },
    ],
    [],
  );
  const result = costPerDistance(rows, base, "MKD", "2024-01-01", "2025-12-31");
  assert.equal(result.value, 16);
  assert.equal(result.from, "2025-01-01");
  assert.equal(
    costPerDistance(rows, [base[0]], "MKD", "2025-01-01", "2025-12-31"),
    null,
  );
  assert.equal(
    costPerDistance(
      rows,
      [base[0], { ...base[2], odometer: 9000 }],
      "MKD",
      "2025-01-01",
      "2025-12-31",
    ),
    null,
  );
});
test("previous period has equal duration over leap days and year boundaries", () => {
  assert.deepEqual(priorPeriod("2024-03-01", "2024-03-02"), {
    from: "2024-02-28",
    to: "2024-02-29",
  });
  assert.deepEqual(priorPeriod("2025-01-01", "2025-01-01"), {
    from: "2024-12-31",
    to: "2024-12-31",
  });
});
test("validation rejects invalid volumes, currencies, dates and duplicate manual source categories", () => {
  assert.throws(() => validateFinance("fuel", { ...base[0], volume: 0 }));
  assert.throws(() =>
    validateFinance("fuel", { ...base[0], date: "2025-02-30" }),
  );
  assert.throws(() =>
    validateFinance("fuel", { ...base[0], currency: "cash" }),
  );
  assert.throws(() =>
    validateFinance("expense", {
      id: "e",
      vehicleId: "sedici",
      title: "Duplicate",
      amount: 50,
      category: "fuel",
      currency: "MKD",
      date: "2025-01-01",
    }),
  );
});
test("fuel saves are atomic, maintain vehicle independence and keep edit audit", async () => {
  const db = await openDatabase(new IDBFactory());
  await saveVehicle(db, {
    id: "sedici",
    make: "Fiat",
    model: "Sedici",
    odometer: 9000,
    unit: "km",
  });
  await saveVehicle(db, {
    id: "golf",
    make: "VW",
    model: "Golf",
    odometer: 9000,
    unit: "km",
  });
  for (const f of base) await saveFinance(db, "fuel", f);
  await assert.rejects(
    saveFinance(db, "fuel", { ...base[0], id: "duplicate" }),
  );
  await assert.rejects(
    saveFinance(db, "fuel", fill("bad", "2025-01-06", 10001)),
  );
  await saveFinance(db, "fuel", { ...base[2], total: 2500 });
  assert.equal((await list(db, "fuelEntries")).length, 3);
  assert.equal(
    (await list(db, "fuelEntries")).find((e) => e.id === "c").revisions.length,
    1,
  );
  assert.equal(
    (await list(db, "vehicles")).find((v) => v.id === "golf").odometer,
    9000,
  );
  assert.equal(
    (await list(db, "vehicles")).find((v) => v.id === "sedici").odometer,
    10500,
  );
  await deleteFinance(db, "fuel", "c");
  assert.equal((await list(db, "fuelEntries")).length, 2);
  assert.equal((await list(db, "odometerEntries")).length, 2);
  assert.equal(
    (await list(db, "vehicles")).find((v) => v.id === "sedici").odometer,
    10500,
  );
  db.close();
});
test("10,000 fill-ups calculate accurately within a practical time budget", () => {
  const records = Array.from({ length: 10000 }, (_, i) =>
    fill(
      String(i),
      new Date(Date.UTC(2000, 0, 1 + i)).toISOString().slice(0, 10),
      i * 500,
      50,
    ),
  );
  const start = performance.now();
  const cycles = fuelCycles(records);
  assert.equal(cycles.length, 9999);
  assert.equal(consumption(cycles), 10);
  assert.equal(
    summarize(ledger(records, [], []), "MKD", "2000-01-01", "2100-01-01").total,
    40000000,
  );
  assert(performance.now() - start < 5000);
});
test("finance ships a nonempty English catalog", () => {
  assert.deepEqual(Object.keys(financeMessages), ["en"]);
  for (const catalog of Object.values(financeMessages))
    for (const text of Object.values(catalog)) assert(text.length);
});
