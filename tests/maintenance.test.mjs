import { test } from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { openDatabase, saveVehicle } from "../src/storage.js";
import {
  addMonths,
  dueStatus,
  validateSchedule,
  effectiveSchedule,
  putSchedule,
  saveRecord,
  removeItem,
  list,
} from "../src/maintenance.js";
import { maintenanceMessages } from "../src/maintenance-i18n.js";
const schedule = {
  id: "oil",
  vehicleId: "sedici",
  title: "Oil",
  category: "oil",
  baseDate: "2024-01-31",
  baseOdometer: 100000,
  months: 1,
  distance: 10000,
  unit: "km",
  warnDays: 7,
  warnDistance: 500,
};
const car = {
  id: "sedici",
  make: "Fiat",
  model: "Sedici",
  odometer: 105000,
  unit: "km",
};
test("calendar months clamp month end, including leap years, independent of DST", () => {
  assert.equal(addMonths("2024-01-31", 1), "2024-02-29");
  assert.equal(addMonths("2025-01-31", 1), "2025-02-28");
  assert.equal(addMonths("2024-02-29", 12), "2025-02-28");
  assert.equal(addMonths("2024-03-31", 1), "2024-04-30");
});
test("either threshold determines due, overdue, soon, or scheduled", () => {
  assert.equal(dueStatus(schedule, car, [], "2024-02-01").status, "scheduled");
  assert.equal(dueStatus(schedule, car, [], "2024-02-23").status, "soon");
  assert.equal(dueStatus(schedule, car, [], "2024-02-29").status, "due");
  assert.equal(dueStatus(schedule, car, [], "2024-03-01").status, "overdue");
  assert.equal(
    dueStatus(schedule, { ...car, odometer: 110000 }, [], "2024-02-01").status,
    "due",
  );
  assert.equal(
    dueStatus(schedule, { ...car, odometer: 110001 }, [], "2024-02-01").status,
    "overdue",
  );
  assert.equal(
    dueStatus(
      { ...schedule, months: 0 },
      { ...car, odometer: 109501 },
      [],
      "2030-01-01",
    ).status,
    "soon",
  );
  assert.equal(
    dueStatus(
      { ...schedule, distance: 0 },
      { ...car, odometer: 999999 },
      [],
      "2024-02-01",
    ).status,
    "scheduled",
  );
});
test("mile/kilometer units normalize without changing historical records", () => {
  assert.equal(
    dueStatus(
      { ...schedule, months: 0, baseOdometer: 0, distance: 100, unit: "mi" },
      { ...car, odometer: 160.9344 },
      [],
      "2024-01-01",
    ).status,
    "due",
  );
});
test("schedule validation rejects missing intervals, bad dates, negative odometers", () => {
  assert.throws(() =>
    validateSchedule({ ...schedule, months: 0, distance: 0 }),
  );
  assert.throws(() =>
    validateSchedule({ ...schedule, baseDate: "2024-02-30" }),
  );
  assert.throws(() => validateSchedule({ ...schedule, baseOdometer: -1 }));
  assert.throws(() => validateSchedule({ ...schedule, months: 1.5 }));
});
test("record completion, correction and deletion recalculate recurrence; cars remain isolated", async () => {
  const db = await openDatabase(new IDBFactory());
  await saveVehicle(db, car);
  await saveVehicle(db, { ...car, id: "golf", make: "VW", model: "Golf" });
  await putSchedule(db, schedule);
  await putSchedule(db, { ...schedule, id: "golf-oil", vehicleId: "golf" });
  const record = {
    id: "record",
    vehicleId: "sedici",
    scheduleId: "oil",
    title: "Oil",
    category: "oil",
    date: "2024-03-01",
    odometer: 111000,
    unit: "km",
    cost: 3000,
    currency: "MKD",
    provider: "Garage",
    notes: "",
  };
  await saveRecord(db, record);
  let records = await list(db, "serviceRecords");
  assert.equal(effectiveSchedule(schedule, records).baseDate, "2024-03-01");
  assert.equal(
    dueStatus(schedule, car, records, "2024-03-02").dueDate,
    "2024-04-01",
  );
  assert.equal(
    effectiveSchedule(
      { ...schedule, id: "golf-oil", vehicleId: "golf" },
      records,
    ).baseDate,
    "2024-01-31",
  );
  await saveRecord(db, { ...record, date: "2024-03-02" });
  assert.equal((await list(db, "serviceRecords")).length, 1);
  assert.equal(
    effectiveSchedule(schedule, await list(db, "serviceRecords")).baseDate,
    "2024-03-02",
  );
  await assert.rejects(saveRecord(db, { ...record, id: "bad", odometer: -1 }));
  await assert.rejects(
    saveRecord(db, { ...record, id: "bad", date: "2024-04-01", odometer: 100 }),
  );
  await assert.rejects(
    saveRecord(db, {
      ...record,
      id: "bad",
      vehicleId: "golf",
      scheduleId: "oil",
    }),
  );
  await removeItem(db, "serviceRecords", "record");
  assert.equal(
    effectiveSchedule(schedule, await list(db, "serviceRecords")).baseDate,
    schedule.baseDate,
  );
  assert.equal(
    (await list(db, "vehicles")).find((v) => v.id === "sedici").odometer,
    111000,
  );
  assert.equal(
    (await list(db, "vehicles")).find((v) => v.id === "golf").odometer,
    car.odometer,
  );
  assert.equal((await list(db, "odometerEntries")).length, 0);
  db.close();
});
test("maintenance translations have equivalent nonempty keys", () => {
  assert.deepEqual(
    Object.keys(maintenanceMessages.en).sort(),
    Object.keys(maintenanceMessages.mk).sort(),
  );
  for (const lang of Object.values(maintenanceMessages))
    for (const value of Object.values(lang)) assert(value.length);
});

test("duplicate completion is rejected, edit audit is retained, and schedule removal keeps history", async () => {
  const db = await openDatabase(new IDBFactory());
  await saveVehicle(db, car);
  await putSchedule(db, schedule);
  const record = {
    id: "r",
    vehicleId: car.id,
    scheduleId: schedule.id,
    title: "Oil",
    date: "2024-03-01",
    odometer: 111000,
    unit: "km",
    cost: 100,
    currency: "EUR",
  };
  await saveRecord(db, record);
  await assert.rejects(saveRecord(db, { ...record, id: "duplicate" }));
  await saveRecord(db, { ...record, cost: 120 });
  const updated = (await list(db, "serviceRecords"))[0];
  assert.equal(updated.revisions.length, 1);
  assert.equal(updated.revisions[0].cost, 100);
  await removeItem(db, "serviceSchedules", schedule.id);
  assert.equal((await list(db, "serviceRecords")).length, 1);
  assert.equal((await list(db, "serviceRecords"))[0].scheduleId, null);
  db.close();
});
