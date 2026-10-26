// Calendar dates are date-only values; UTC arithmetic avoids DST drift.
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export function validDate(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value
  );
}
export function addMonths(date, months) {
  const d = new Date(date + "T00:00:00Z");
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const end = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, end));
  return d.toISOString().slice(0, 10);
}
export const km = (value, unit = "km") =>
  Number(value) * (unit === "mi" ? 1.609344 : 1);
export function validateSchedule(s) {
  if (
    !s.id ||
    !["km", "mi"].includes(s.unit) ||
    !s.vehicleId ||
    !s.title?.trim() ||
    !validDate(s.baseDate) ||
    !Number.isFinite(s.baseOdometer) ||
    s.baseOdometer < 0 ||
    (!s.months && !s.distance) ||
    !Number.isInteger(s.months) ||
    s.months < 0 ||
    s.months > 120 ||
    !Number.isFinite(s.distance) ||
    s.distance < 0 ||
    !Number.isFinite(s.warnDays) ||
    s.warnDays < 0 ||
    !Number.isFinite(s.warnDistance) ||
    s.warnDistance < 0
  )
    throw Error("invalid");
}
export function effectiveSchedule(schedule, records) {
  const latest = records
    .filter(
      (r) =>
        r.scheduleId === schedule.id &&
        r.vehicleId === schedule.vehicleId &&
        r.date >= schedule.baseDate,
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        km(b.odometer, b.unit) - km(a.odometer, a.unit),
    )[0];
  return latest
    ? {
        ...schedule,
        baseDate: latest.date,
        baseOdometer:
          km(latest.odometer, latest.unit) /
          (schedule.unit === "mi" ? 1.609344 : 1),
      }
    : schedule;
}
export function dueStatus(schedule, vehicle, records = [], date = today()) {
  const s = effectiveSchedule(schedule, records);
  const dueDate = s.months ? addMonths(s.baseDate, s.months) : null;
  const dueOdometer = s.distance ? s.baseOdometer + s.distance : null;
  const days = dueDate
    ? (Date.parse(dueDate) - Date.parse(date)) / 86400000
    : Infinity;
  const remaining =
    dueOdometer === null
      ? Infinity
      : dueOdometer -
        km(vehicle.odometer, vehicle.unit) / (s.unit === "mi" ? 1.609344 : 1);
  const status =
    days < 0 || remaining < 0
      ? "overdue"
      : days === 0 || remaining === 0
        ? "due"
        : days <= s.warnDays || remaining <= s.warnDistance
          ? "soon"
          : "scheduled";
  return { status, dueDate, dueOdometer, days, remaining };
}
export function list(db, store) {
  return new Promise((resolve, reject) => {
    const r = db.transaction(store).objectStore(store).getAll();
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export function putSchedule(db, s) {
  validateSchedule(s);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["vehicles", "serviceSchedules"], "readwrite");
    const r = tx.objectStore("vehicles").get(s.vehicleId);
    r.onsuccess = () => {
      if (!r.result) {
        tx.abort();
        return;
      }
      tx.objectStore("serviceSchedules").put(s);
    };
    tx.oncomplete = resolve;
    tx.onabort = tx.onerror = () => reject(tx.error || Error("invalid"));
  });
}
export function saveRecord(db, record) {
  if (
    !record.id ||
    !record.title?.trim() ||
    !validDate(record.date) ||
    record.date > today() ||
    !Number.isFinite(record.odometer) ||
    record.odometer < 0 ||
    !Number.isFinite(record.cost) ||
    record.cost < 0 ||
    !["km", "mi"].includes(record.unit) ||
    !record.currency?.trim()
  )
    return Promise.reject(Error("invalid"));
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      ["vehicles", "serviceRecords", "serviceSchedules", "odometerEntries"],
      "readwrite",
    );
    const records = tx.objectStore("serviceRecords");
    const vr = tx.objectStore("vehicles").get(record.vehicleId);
    vr.onsuccess = () => {
      const v = vr.result;
      if (!v) {
        tx.abort();
        return;
      }
      const all = records.getAll();
      all.onsuccess = () => {
        const others = all.result.filter(
          (r) => r.vehicleId === v.id && r.id !== record.id,
        );
        const value = km(record.odometer, record.unit);
        if (
          others.some(
            (r) =>
              (r.date < record.date && km(r.odometer, r.unit) > value) ||
              (r.date > record.date && km(r.odometer, r.unit) < value) ||
              (r.date === record.date &&
                km(r.odometer, r.unit) === value &&
                r.scheduleId === record.scheduleId &&
                r.title === record.title),
          )
        ) {
          tx.abort();
          return;
        }
        const previous = all.result.find((r) => r.id === record.id);
        if (previous && previous.vehicleId !== record.vehicleId) {
          tx.abort();
          return;
        }
        const write = () => {
          records.put({
            ...record,
            createdAt: previous?.createdAt || new Date().toISOString(),
            revisions: previous
              ? [
                  ...(previous.revisions || []),
                  {
                    date: previous.date,
                    odometer: previous.odometer,
                    unit: previous.unit,
                    cost: previous.cost,
                    title: previous.title,
                    changedAt: new Date().toISOString(),
                  },
                ]
              : [],
          });
          if (value > km(v.odometer, v.unit)) {
            v.odometer = value / (v.unit === "mi" ? 1.609344 : 1);
            v.odometerHistory = [
              ...(v.odometerHistory || []),
              {
                value: v.odometer,
                unit: v.unit || "km",
                at: new Date().toISOString(),
                source: record.id,
              },
            ];
            tx.objectStore("vehicles").put(v);
          }
          tx.objectStore("odometerEntries").put({
            id: record.id,
            vehicleId: v.id,
            date: record.date,
            value: record.odometer,
            unit: record.unit,
            source: "service",
          });
        };
        if (record.scheduleId) {
          const sr = tx.objectStore("serviceSchedules").get(record.scheduleId);
          sr.onsuccess = () => {
            if (!sr.result || sr.result.vehicleId !== v.id) {
              tx.abort();
              return;
            }
            write();
          };
        } else write();
      };
    };
    tx.oncomplete = resolve;
    tx.onabort = tx.onerror = () => reject(tx.error || Error("invalid"));
  });
}
export function removeItem(db, store, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [store, "odometerEntries", "serviceRecords"],
      "readwrite",
    );
    tx.objectStore(store).delete(id);
    if (store === "serviceRecords")
      tx.objectStore("odometerEntries").delete(id);
    if (store === "serviceSchedules") {
      const r = tx.objectStore("serviceRecords").getAll();
      r.onsuccess = () =>
        r.result
          .filter((x) => x.scheduleId === id)
          .forEach((x) =>
            tx.objectStore("serviceRecords").put({ ...x, scheduleId: null }),
          );
    }
    tx.oncomplete = resolve;
    tx.onabort = tx.onerror = () => reject(tx.error || Error("invalid"));
  });
}

// Prioritize urgency, then the earliest date and remaining distance.
export function compareDue(a, b) {
  const order = ["overdue", "due", "soon", "scheduled"];
  return (
    order.indexOf(a.d.status) - order.indexOf(b.d.status) ||
    a.d.days - b.d.days ||
    km(a.d.remaining, a.s.unit) - km(b.d.remaining, b.s.unit) ||
    a.s.title.localeCompare(b.s.title)
  );
}
