import { today, validDate, km } from "./maintenance.js";
export const volumeFactors = { L: 1, USgal: 3.785411784, UKgal: 4.54609 };
export const categories = [
  "fuel",
  "service",
  "repair",
  "parts",
  "insurance",
  "inspection",
  "registration",
  "tolls",
  "parking",
  "other",
];
export function fuelCycles(entries) {
  const sorted = [...entries].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      km(a.odometer, a.unit) - km(b.odometer, b.unit),
  );
  const result = [];
  let anchor = null,
    litres = 0,
    previous = null;
  for (const e of sorted) {
    const reading = km(e.odometer, e.unit),
      volume = e.volume * volumeFactors[e.volumeUnit];
    if (
      e.missed ||
      !Number.isFinite(volume) ||
      volume <= 0 ||
      (previous !== null && reading <= previous)
    ) {
      anchor = null;
      litres = 0;
    }
    if (anchor) {
      litres += volume;
      if (e.full) {
        const distance = reading - km(anchor.odometer, anchor.unit);
        if (distance > 0 && Number.isFinite(litres))
          result.push({
            start: anchor.date,
            end: e.date,
            distance,
            litres,
            l100: (litres / distance) * 100,
            entryId: e.id,
          });
        anchor = e;
        litres = 0;
      }
    } else if (e.full) anchor = e;
    previous = reading;
  }
  return result;
}
export function consumption(cycles) {
  const distance = cycles.reduce((s, c) => s + c.distance, 0),
    litres = cycles.reduce((s, c) => s + c.litres, 0);
  return distance > 0 ? (litres / distance) * 100 : null;
}
export const efficiency = (l100, unit) =>
  l100 === null
    ? null
    : unit === "USmpg"
      ? 235.214583 / l100
      : unit === "UKmpg"
        ? 282.480936 / l100
        : l100;
export function ledger(fuel, expenses, services) {
  return [
    ...fuel.map((e) => ({
      ...e,
      amount: e.total,
      category: "fuel",
      source: "fuel",
    })),
    ...expenses.map((e) => ({ ...e, source: "expense" })),
    ...services.map((e) => ({
      ...e,
      amount: e.cost,
      category: "service",
      source: "service",
    })),
  ];
}
export function inRange(e, from, to) {
  return e.date >= from && e.date <= to;
}
export function summarize(rows, currency, from, to) {
  const selected = rows.filter(
    (e) => e.currency === currency && inRange(e, from, to),
  );
  const byCategory = {},
    byMonth = {};
  let total = 0;
  for (const e of selected) {
    total += e.amount;
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    const month = e.date.slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + e.amount;
  }
  return {
    total,
    byCategory,
    byMonth,
    rows: selected.sort(
      (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
    ),
  };
}
export function priorPeriod(from, to) {
  const days = (Date.parse(to) - Date.parse(from)) / 86400000 + 1;
  return {
    from: new Date(Date.parse(from) - days * 86400000)
      .toISOString()
      .slice(0, 10),
    to: new Date(Date.parse(from) - 86400000).toISOString().slice(0, 10),
  };
}
export function costPerDistance(rows, readings, currency, from, to) {
  const points = readings
    .filter((e) => inRange(e, from, to))
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        km(a.odometer, a.unit) - km(b.odometer, b.unit),
    );
  if (points.length < 2) return null;
  for (let i = 1; i < points.length; i++)
    if (
      km(points[i].odometer, points[i].unit) <
      km(points[i - 1].odometer, points[i - 1].unit)
    )
      return null;
  const start = points[0],
    end = points.at(-1),
    distance = km(end.odometer, end.unit) - km(start.odometer, start.unit);
  if (distance <= 0 || start.date === end.date) return null;
  const total = summarize(rows, currency, start.date, end.date).total;
  return { value: total / distance, distance, from: start.date, to: end.date };
}
export function validateFinance(kind, e) {
  if (
    !e.id ||
    !e.vehicleId ||
    !validDate(e.date) ||
    e.date > today() ||
    !Number.isFinite(kind === "fuel" ? e.total : e.amount) ||
    (kind === "fuel" ? e.total : e.amount) < 0 ||
    !/^[A-Z]{3}$/.test(e.currency)
  )
    throw Error("invalid");
  if (kind === "fuel") {
    if (
      !["km", "mi"].includes(e.unit) ||
      !Number.isFinite(e.odometer) ||
      e.odometer < 0 ||
      !Number.isFinite(e.volume) ||
      e.volume <= 0 ||
      !volumeFactors[e.volumeUnit] ||
      typeof e.full !== "boolean" ||
      !Number.isFinite(e.unitPrice) ||
      e.unitPrice < 0
    )
      throw Error("invalid");
  } else if (
    !categories.includes(e.category) ||
    ["fuel", "service"].includes(e.category) ||
    !e.title?.trim()
  )
    throw Error("invalid");
}
export function saveFinance(db, kind, e) {
  validateFinance(kind, e);
  const store = kind === "fuel" ? "fuelEntries" : "expenseEntries";
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
        [store, "vehicles", "odometerEntries"],
        "readwrite",
      ),
      target = tx.objectStore(store);
    const vr = tx.objectStore("vehicles").get(e.vehicleId);
    vr.onsuccess = () => {
      const vehicle = vr.result;
      if (!vehicle) {
        tx.abort();
        return;
      }
      const all = target.getAll();
      all.onsuccess = () => {
        const old = all.result.find((r) => r.id === e.id);
        if (old && old.vehicleId !== e.vehicleId) {
          tx.abort();
          return;
        }
        if (kind === "fuel") {
          const reading = km(e.odometer, e.unit);
          if (
            all.result.some(
              (r) =>
                r.vehicleId === e.vehicleId &&
                r.id !== e.id &&
                ((r.date < e.date && km(r.odometer, r.unit) >= reading) ||
                  (r.date > e.date && km(r.odometer, r.unit) <= reading) ||
                  (r.date === e.date && km(r.odometer, r.unit) === reading)),
            )
          ) {
            tx.abort();
            return;
          }
          if (reading > km(vehicle.odometer, vehicle.unit)) {
            vehicle.odometer = reading / (vehicle.unit === "mi" ? 1.609344 : 1);
            vehicle.odometerHistory = [
              ...(vehicle.odometerHistory || []),
              {
                value: vehicle.odometer,
                unit: vehicle.unit || "km",
                at: new Date().toISOString(),
                source: e.id,
              },
            ];
            tx.objectStore("vehicles").put(vehicle);
          }
          tx.objectStore("odometerEntries").put({
            id: e.id,
            vehicleId: e.vehicleId,
            date: e.date,
            value: e.odometer,
            unit: e.unit,
            source: "fuel",
          });
        }
        target.put({
          ...e,
          revisions: old
            ? [
                ...(old.revisions || []),
                {
                  date: old.date,
                  odometer: old.odometer,
                  total: old.total,
                  amount: old.amount,
                  at: new Date().toISOString(),
                },
              ]
            : [],
        });
      };
    };
    tx.oncomplete = resolve;
    tx.onabort = tx.onerror = () => reject(tx.error || Error("invalid"));
  });
}
export function deleteFinance(db, kind, id) {
  return new Promise((resolve, reject) => {
    const store = kind === "fuel" ? "fuelEntries" : "expenseEntries",
      tx = db.transaction(
        [store, "odometerEntries", "attachments"],
        "readwrite",
      );
    tx.objectStore(store).delete(id);
    const linked = tx.objectStore("attachments").getAll();
    linked.onsuccess = () =>
      linked.result
        .filter((d) => d.recordStore === store && d.recordId === id)
        .forEach((d) =>
          tx
            .objectStore("attachments")
            .put({ ...d, recordId: "", recordStore: "" }),
        );
    if (kind === "fuel") tx.objectStore("odometerEntries").delete(id);
    tx.oncomplete = resolve;
    tx.onabort = tx.onerror = () => reject(tx.error || Error("invalid"));
  });
}
