import test from "node:test";
import assert from "node:assert/strict";
import { mileageForecast, historyRows, latestEntry } from "../src/journey.js";
test("mileage estimates normalize units and reject stale, declining or insufficient readings", () => {
  const rows = [
    { date: "2026-09-01", odometer: 10000, unit: "km" },
    { date: "2026-10-01", odometer: 10600, unit: "km" },
  ];
  assert.equal(
    mileageForecast(200, "km", rows, "2026-10-01").date,
    "2026-10-11",
  );
  assert.equal(
    mileageForecast(200 / 1.609344, "mi", rows, "2026-10-01").date,
    "2026-10-11",
  );
  assert.equal(mileageForecast(200, "km", rows, "2027-02-01"), null);
  assert.equal(mileageForecast(200, "km", [rows[0]], "2026-10-01"), null);
  assert.equal(
    mileageForecast(
      200,
      "km",
      [rows[1], { date: "2026-10-15", odometer: 9000, unit: "km" }],
      "2026-10-15",
    ),
    null,
  );
  assert.equal(mileageForecast(-5, "km", rows, "2026-10-01"), null);
});
test("history isolates vehicles, attaches receipts once and retains undated documents", () => {
  const docs = [
    {
      id: "d",
      vehicleId: "a",
      recordStore: "serviceRecords",
      recordId: "s",
      name: "Invoice",
    },
    { id: "u", vehicleId: "a", name: "Registration" },
    { id: "x", vehicleId: "b", name: "Private" },
  ];
  const rows = historyRows(
    "a",
    [{ id: "s", vehicleId: "a", title: "Oil", date: "2026-01-01", cost: 50 }],
    [{ id: "f", vehicleId: "a", date: "2026-02-01", total: 60 }],
    [],
    docs,
  );
  assert.deepEqual(
    rows.map((r) => r.type),
    ["Fuel", "Service", "Document"],
  );
  assert.equal(rows[1].documents[0].name, "Invoice");
  assert.equal(rows.length, 3);
});
test("entry defaults use the latest saved record for the current vehicle", () => {
  assert.equal(
    latestEntry(
      [
        { id: "1", vehicleId: "a", date: "2026-01-01", station: "A" },
        { id: "2", vehicleId: "b", date: "2026-03-01", station: "B" },
        { id: "3", vehicleId: "a", date: "2026-02-01", station: "C" },
      ],
      "a",
    ).station,
    "C",
  );
});
