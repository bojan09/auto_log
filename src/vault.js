import { stores } from "./storage.js";
import { validDate, validateSchedule, dueStatus } from "./maintenance.js";
import { validateFinance } from "./finance.js";
export const MAX_FILE = 5 * 1024 * 1024;
export const MAX_BACKUP = 50 * 1024 * 1024;
export const preferenceOptions = {
  language: ["en", "mk"],
  theme: ["dark", "light", "system"],
  accent: ["blue", "mint"],
  motion: ["reduced", "balanced", "enhanced"],
  distance: ["km", "mi"],
  volume: ["L", "USgal", "UKgal"],
  consumption: ["L100", "USmpg", "UKmpg"],
  currency: ["MKD", "EUR", "USD", "GBP"],
  dateFormat: ["locale", "iso"],
  defaultFuel: ["petrol", "diesel", "electric", "hybrid", "other"],
  defaultBody: [
    "crossover",
    "hatchback",
    "sedan",
    "coupe",
    "van",
    "motorcycle",
  ],
};
export const defaults = {
  language: "en",
  theme: "dark",
  accent: "blue",
  motion: "balanced",
  distance: "km",
  volume: "L",
  consumption: "L100",
  currency: "MKD",
  dateFormat: "locale",
  defaultFuel: "other",
  defaultBody: "crossover",
};
export function readPreferences(storage) {
  storage = {
    getItem: ((source) => (key) =>
      key === "language" ? "en" : source.getItem(key))(storage),
  };
  return Object.fromEntries(
    Object.entries(defaults).map(([k, v]) => [
      k,
      preferenceOptions[k].includes(storage.getItem(k))
        ? storage.getItem(k)
        : v,
    ]),
  );
}
function invalid() {
  throw Error("invalidBackup");
}
const text = (v, max = 5000) => typeof v === "string" && v.length <= max;
const id = (v) => text(v, 200) && v.length > 0;
const number = (v) => Number.isFinite(v) && v >= 0;
const units = (v) => ["km", "mi"].includes(v);
export function safeImage(v) {
  return (
    v === "" ||
    (typeof v === "string" &&
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]*={0,2}$/.test(v) &&
      v.length < 8 * 1024 * 1024)
  );
}
export function validateBackup(data) {
  if (
    !data ||
    data.format !== "AutoLog" ||
    data.version !== 1 ||
    !data.stores ||
    Object.keys(data.stores).length !== stores.length
  )
    invalid();
  const tables = data.stores;
  for (const name of stores) {
    const rows = tables[name];
    if (!Array.isArray(rows) || rows.length > 50000) invalid();
    const ids = new Set();
    for (const r of rows) {
      if (!r || !id(r.id) || ids.has(r.id)) invalid();
      ids.add(r.id);
      if (JSON.stringify(r).length > 10 * 1024 * 1024) invalid();
      for (const key of [
        "title",
        "notes",
        "provider",
        "station",
        "nickname",
        "plate",
        "variant",
      ])
        if (r[key] !== undefined && !text(r[key])) invalid();
      for (const key of ["photo", "receipt"])
        if (r[key] !== undefined && !safeImage(r[key])) invalid();
    }
  }
  const cars = new Set(tables.vehicles.map((v) => v.id));
  for (const v of tables.vehicles) {
    if (
      !text(v.make, 100) ||
      !v.make.trim() ||
      !text(v.model, 100) ||
      !v.model.trim() ||
      !number(v.odometer) ||
      !units(v.unit) ||
      !Number.isInteger(v.year) ||
      v.year < 1886 ||
      v.year > 2200
    )
      invalid();
    if (v.archived !== undefined && typeof v.archived !== "boolean") invalid();
    if (v.bodyStyle && !preferenceOptions.defaultBody.includes(v.bodyStyle))
      invalid();
    if (v.currency && !text(v.currency, 50)) invalid();
    if (
      v.odometerHistory &&
      (!Array.isArray(v.odometerHistory) ||
        v.odometerHistory.some(
          (h) => !number(h.value) || !Number.isFinite(Date.parse(h.at)),
        ))
    )
      invalid();
  }
  for (const name of stores.filter(
    (n) => !["vehicles", "settings"].includes(n),
  ))
    for (const r of tables[name]) if (!cars.has(r.vehicleId)) invalid();
  for (const s of tables.serviceSchedules) validateSchedule(s);
  const schedulesById = new Map(tables.serviceSchedules.map((s) => [s.id, s]));
  const recordVehicles = Object.fromEntries(
    ["serviceRecords", "fuelEntries", "expenseEntries"].map((name) => [
      name,
      new Map(tables[name].map((r) => [r.id, r.vehicleId])),
    ]),
  );
  for (const r of tables.serviceRecords) {
    if (
      !text(r.title) ||
      !r.title.trim() ||
      !validDate(r.date) ||
      !number(r.odometer) ||
      !units(r.unit) ||
      !number(r.cost) ||
      !text(r.currency, 50) ||
      !r.currency.trim() ||
      !text(r.category, 50)
    )
      invalid();
    // Removed schedules intentionally leave historical schedule IDs intact.
    const s = schedulesById.get(r.scheduleId);
    if (s && s.vehicleId !== r.vehicleId) invalid();
  }
  for (const r of tables.fuelEntries) validateFinance("fuel", r);
  for (const r of tables.expenseEntries) validateFinance("expense", r);
  for (const r of tables.odometerEntries)
    if (!number(r.value) || !units(r.unit) || !validDate(r.date)) invalid();
  for (const r of tables.attachments) {
    validateAttachment(r);
    if (r.recordId) {
      if (
        !["serviceRecords", "fuelEntries", "expenseEntries"].includes(
          r.recordStore,
        ) ||
        recordVehicles[r.recordStore].get(r.recordId) !== r.vehicleId
      )
        invalid();
    }
  }
  for (const r of tables.checklists) validateChecklist(r);
  if (tables.settings.length > 1) invalid();
  for (const r of tables.settings) {
    if (
      r.id !== "preferences" ||
      !r.values ||
      typeof r.values !== "object" ||
      Array.isArray(r.values) ||
      Object.keys(r.values).some(
        (k) => !preferenceOptions[k]?.includes(r.values[k]),
      )
    )
      invalid();
  }
  return data;
}
export async function snapshot(db, preferences) {
  const tables = await new Promise((resolve, reject) => {
    const tx = db.transaction(stores);
    const result = {};
    for (const name of stores) {
      const r = tx.objectStore(name).getAll();
      r.onsuccess = () => (result[name] = r.result);
    }
    tx.oncomplete = () => resolve(result);
    tx.onabort = tx.onerror = () => reject(tx.error);
  });
  if (preferences)
    tables.settings = [{ id: "preferences", values: preferences }];
  return validateBackup({
    format: "AutoLog",
    version: 1,
    createdAt: new Date().toISOString(),
    stores: tables,
  });
}
export function parseBackup(raw) {
  if (
    typeof raw !== "string" ||
    new TextEncoder().encode(raw).length > MAX_BACKUP
  )
    invalid();
  return validateBackup(JSON.parse(raw));
}
export function restore(db, backup) {
  validateBackup(backup);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, "readwrite");
    try {
      for (const name of stores) {
        const target = tx.objectStore(name);
        target.clear();
        for (const row of backup.stores[name]) target.put(row);
      }
    } catch (error) {
      tx.abort();
      reject(error);
    }
    tx.oncomplete = resolve;
    tx.onabort = tx.onerror = () => reject(tx.error || Error("storage"));
  });
}
export function writeRow(db, store, row) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(row);
    tx.oncomplete = resolve;
    tx.onabort = tx.onerror = () => reject(tx.error || Error("storage"));
  });
}
export function removeRow(db, store, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    tx.oncomplete = resolve;
    tx.onabort = tx.onerror = () => reject(tx.error || Error("storage"));
  });
}
export function validateAttachment(r) {
  if (
    !id(r.id) ||
    !id(r.vehicleId) ||
    !text(r.name, 250) ||
    !r.name ||
    !["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(
      r.type,
    ) ||
    !number(r.size) ||
    r.size === 0 ||
    r.size > MAX_FILE ||
    typeof r.data !== "string" ||
    !r.data.startsWith("data:" + r.type + ";base64,") ||
    r.data.length > MAX_FILE * 1.34 + 100
  )
    invalid();
  const encoded = r.data.slice(("data:" + r.type + ";base64,").length);
  if (
    !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) ||
    encoded.length % 4 ||
    Math.floor((encoded.length * 3) / 4) -
      (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0) !==
      r.size
  )
    invalid();
  const prefix = Uint8Array.from(atob(encoded.slice(0, 16)), (c) =>
    c.charCodeAt(0),
  );
  if (!fileSignature(r.type, prefix)) invalid();
}
function fileSignature(type, bytes) {
  const hex = Array.from(bytes.slice(0, 12), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  return type === "image/png"
    ? hex.startsWith("89504e470d0a1a0a")
    : type === "image/jpeg"
      ? hex.startsWith("ffd8ff")
      : type === "image/webp"
        ? hex.startsWith("52494646") && hex.slice(16) === "57454250"
        : type === "application/pdf"
          ? new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-"
          : false;
}
export async function documentData(file) {
  if (!file || file.size === 0 || file.size > MAX_FILE) throw Error("file");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!fileSignature(file.type, bytes)) throw Error("file");
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return "data:" + file.type + ";base64," + btoa(binary);
}
export function validateChecklist(r) {
  if (
    !id(r.id) ||
    !id(r.vehicleId) ||
    !text(r.title, 120) ||
    !r.title.trim() ||
    (r.date && !validDate(r.date)) ||
    !Array.isArray(r.items) ||
    r.items.length > 100 ||
    r.items.some(
      (i) =>
        !text(i.text, 200) || !i.text.trim() || typeof i.done !== "boolean",
    )
  )
    invalid();
}
export function csv(rows, columns) {
  const cell = (v) => {
    let s = String(v ?? "");
    if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return (
    "\ufeff" +
    [
      columns.map((c) => cell(c.label)).join(","),
      ...rows.map((r) => columns.map((c) => cell(r[c.key])).join(",")),
    ].join("\r\n")
  );
}
const escapeICS = (v) =>
  String(v)
    .replaceAll("\\", "\\\\")
    .replaceAll("\r", "")
    .replaceAll("\n", "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
export function calendar(events) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AutoLog//Reminders//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const e of events) {
    if (!validDate(e.date)) continue;
    lines.push(
      "BEGIN:VEVENT",
      "UID:" + escapeICS(e.id) + "@autolog.local",
      "DTSTAMP:" +
        new Date()
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\.\d{3}Z$/, "Z"),
      "DTSTART;VALUE=DATE:" + e.date.replaceAll("-", ""),
      "SUMMARY:" + escapeICS(e.title),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return (
    lines
      .map((line) => {
        let out = "",
          len = 0;
        for (const c of line) {
          const n = new TextEncoder().encode(c).length;
          if (len + n > 73) {
            out += "\r\n ";
            len = 1;
          }
          out += c;
          len += n;
        }
        return out;
      })
      .join("\r\n") + "\r\n"
  );
}
export function reminderEvents(vehicle, schedules, records, checklists) {
  return [
    ...schedules
      .filter((s) => s.vehicleId === vehicle.id)
      .map((s) => ({
        id: s.id,
        title: vehicle.make + " " + vehicle.model + " · " + s.title,
        date: dueStatus(s, vehicle, records).dueDate,
      })),
    ...checklists
      .filter((c) => c.vehicleId === vehicle.id)
      .map((c) => ({
        id: c.id,
        title: vehicle.make + " " + vehicle.model + " · " + c.title,
        date: c.date,
      })),
  ].filter((e) => validDate(e.date));
}
