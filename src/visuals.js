import { maintenanceMessages } from "./maintenance-i18n.js";
import { dueStatus } from "./maintenance.js";
export const visualText = {
  en: {
    score: "Maintenance compliance",
    explain:
      "Share of your configured schedules that are not due or overdue. Due-soon schedules count as current. This reflects your records, not vehicle safety or mechanical health.",
    empty: "Add schedules to calculate compliance.",
    zones: "Service zones",
    engine: "Engine & fluids",
    wheels: "Wheels & brakes",
    battery: "Battery",
    none: "No matching service records.",
    illustration: "Illustrative body-style fallback",
    motion: "Motion",
    reduced: "Reduced",
    balanced: "Balanced",
    enhanced: "Enhanced",
    close: "Close",
    current: "Current schedules",
    recent: "Recent activity",
  },
};
export function compliance(vehicle, schedules, records, date) {
  const own = schedules.filter((s) => s.vehicleId === vehicle.id);
  const statuses = own.map((s) => ({
    title: s.title,
    ...dueStatus(s, vehicle, records, date),
  }));
  const current = statuses.filter((s) =>
    ["scheduled", "soon"].includes(s.status),
  ).length;
  return {
    score: own.length ? Math.round((current / own.length) * 100) : null,
    current,
    total: own.length,
    statuses,
  };
}
export function bodyStyle(v) {
  if (v.bodyStyle && v.bodyStyle !== "crossover") return v.bodyStyle;
  const name = (v.make + " " + v.model).toLowerCase();
  if (/sedici|sx4|kuga|tiguan|3008|5008|q[357]|x[135]/.test(name))
    return "crossover";
  if (/golf|panda|punto|fiesta|focus|208|308|500|a3/.test(name))
    return "hatchback";
  if (/ducato|transit|sprinter/.test(name)) return "van";
  if (/m4|coupe/.test(name)) return "coupe";
  if (/bmw|audi|mercedes|mondeo|passat/.test(name)) return "sedan";
  return v.bodyStyle || "crossover";
}
export function visualAsset(v) {
  if (v.photo) return v.photo;
  const style = bodyStyle(v);
  return ["crossover", "hatchback", "sedan"].includes(style)
    ? "assets/" + style + "-studio.webp"
    : "assets/vehicle-" + style + ".svg";
}
export function effectiveMotion(preference, systemReduced, limited = false) {
  return systemReduced || limited
    ? "reduced"
    : ["reduced", "balanced", "enhanced"].includes(preference)
      ? preference
      : "balanced";
}
export function setupMotion(preferences) {
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const apply = () => {
    document.documentElement.dataset.motion = effectiveMotion(
      preferences.getItem("motion"),
      media.matches,
      navigator.hardwareConcurrency <= 2,
    );
    document.documentElement.dataset.hidden = String(document.hidden);
  };
  media.addEventListener("change", apply);
  document.addEventListener("visibilitychange", apply);
  apply();
  return apply;
}
export function careCard(v, schedules, records, lang) {
  const t = visualText[lang],
    data = compliance(v, schedules, records),
    card = document.createElement("article");
  card.className = "card care-card";
  const h = document.createElement("h3");
  h.textContent = t.score;
  const gauge = document.createElement("div");
  gauge.className = "care-gauge";
  gauge.style.setProperty("--score", data.score ?? 0);
  gauge.textContent = data.score === null ? "—" : data.score + "%";
  const detail = document.createElement("details"),
    summary = document.createElement("summary");
  summary.textContent = t.current + " · " + data.current + "/" + data.total;
  detail.append(summary);
  const p = document.createElement("p");
  p.textContent = data.score === null ? t.empty : t.explain;
  detail.append(p);
  for (const s of data.statuses) {
    const row = document.createElement("p");
    row.textContent = s.title + ": " + maintenanceMessages[lang][s.status];
    detail.append(row);
  }
  card.append(h, gauge, detail);
  return card;
}
export function hotspots(v, records, lang) {
  const t = visualText[lang],
    wrap = document.createElement("div");
  wrap.className = "vehicle-hotspots";
  wrap.setAttribute("aria-label", t.zones);
  for (const [zone, categories] of [
    ["engine", ["oil"]],
    ["wheels", ["tires", "brakes"]],
    ["battery", ["battery"]],
  ]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hotspot " + zone;
    button.textContent = t[zone];
    button.onclick = () => {
      const dialog = document.createElement("dialog");
      dialog.setAttribute("aria-label", t[zone]);
      const heading = document.createElement("h2");
      heading.textContent = t[zone];
      dialog.append(heading);
      const own = records
        .filter((r) => r.vehicleId === v.id && categories.includes(r.category))
        .sort((a, b) => b.date.localeCompare(a.date));
      if (!own.length) {
        const p = document.createElement("p");
        p.textContent = t.none;
        dialog.append(p);
      }
      for (const r of own) {
        const article = document.createElement("article");
        article.className = "card";
        const h = document.createElement("h3");
        h.textContent = r.title;
        const p = document.createElement("p");
        p.textContent =
          r.date +
          " · " +
          r.odometer +
          " " +
          r.unit +
          " · " +
          r.cost +
          " " +
          r.currency;
        article.append(h, p);
        dialog.append(article);
      }
      const close = document.createElement("button");
      close.textContent = t.close;
      close.onclick = () => dialog.close();
      dialog.append(close);
      dialog.onclose = () => dialog.remove();
      document.body.append(dialog);
      dialog.showModal();
    };
    wrap.append(button);
  }
  return wrap;
}
