import { km, validDate, today } from "./maintenance.js";
export function latestEntry(rows, vehicleId) {
  return rows
    .filter((r) => r.vehicleId === vehicleId)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        String(b.id).localeCompare(String(a.id)),
    )[0];
}
export function mileageForecast(remaining, unit, rows, asOf = today()) {
  if (!Number.isFinite(remaining) || remaining <= 0 || !validDate(asOf))
    return null;
  const now = Date.parse(asOf),
    byDate = new Map();
  for (const r of rows) {
    if (!validDate(r.date) || !Number.isFinite(r.odometer) || r.odometer < 0)
      continue;
    const age = (now - Date.parse(r.date)) / 86400000;
    if (age < 0 || age > 180) continue;
    const value = km(r.odometer, r.unit);
    byDate.set(r.date, Math.max(byDate.get(r.date) ?? 0, value));
  }
  const samples = [...byDate].sort((a, b) => a[0].localeCompare(b[0]));
  if (samples.length < 2) return null;
  const first = samples[0],
    last = samples.at(-1);
  const days = (Date.parse(last[0]) - Date.parse(first[0])) / 86400000;
  if (days < 14 || (now - Date.parse(last[0])) / 86400000 > 90) return null;
  if (samples.some((s, i) => i && s[1] < samples[i - 1][1])) return null;
  const rate = (last[1] - first[1]) / days;
  if (rate <= 0) return null;
  const dueIn = Math.ceil(km(remaining, unit) / rate);
  if (dueIn > 3650) return null;
  return {
    date: new Date(now + dueIn * 86400000).toISOString().slice(0, 10),
    dailyKm: rate,
    days,
  };
}
export function historyRows(vehicleId, services, fuel, expenses, documents) {
  const rows = [];
  for (const [type, store, records] of [
    ["Service", "serviceRecords", services],
    ["Fuel", "fuelEntries", fuel],
    ["Expense", "expenseEntries", expenses],
  ]) {
    for (const r of records.filter((r) => r.vehicleId === vehicleId)) {
      const docs = documents.filter(
        (d) =>
          d.vehicleId === vehicleId &&
          d.recordStore === store &&
          d.recordId === r.id,
      );
      rows.push({
        id: type + ":" + r.id,
        type,
        date: r.date,
        title: r.title || "Fuel refill",
        amount: r.cost ?? r.total ?? r.amount,
        currency: r.currency,
        notes: [r.station, r.provider, r.notes].filter(Boolean).join(" · "),
        documents: docs,
        receipt: r.receipt,
      });
    }
  }
  for (const d of documents.filter((d) => d.vehicleId === vehicleId)) {
    if (rows.some((r) => r.documents.includes(d))) continue;
    rows.push({
      id: "Document:" + d.id,
      type: "Document",
      date: "",
      title: d.name,
      notes: "Undated vehicle document",
      documents: [d],
    });
  }
  return rows.sort(
    (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
  );
}
