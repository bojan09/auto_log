import {
  fuelCycles,
  consumption,
  efficiency,
  ledger,
  summarize,
} from "./finance.js";
import { today } from "./maintenance.js";
import { careCard } from "./visuals.js";
import { chart } from "./finance-charts.js";
export const layoutText = {
  en: {
    workspace: "Workspace",
    vehicles: "Vehicles",
    tools: "Tools",
    theme: "Toggle theme",
    overview: "Your vehicle, at a glance",
    addFuel: "Add fuel",
    addService: "Add service",
    addExpense: "Add expense",
    trip: "Trip checklist",
    economy: "Fuel economy",
    spending: "Total expenses",
    recent: "Recent activity",
    viewAll: "View all",
    empty: "No activity yet",
    insufficient: "Not enough fill-ups",
    year: "This year",
    details: "Chart details",
    noSchedule: "No service scheduled",
    remaining: "remaining",
    overdue: "overdue",
    active: "Active",
    fuel: "Fuel refill",
    service: "Service",
    expense: "Expense",
    settings: "Settings",
    documents: "Documents",
    reports: "Reports",
    trips: "Trip preparation",
    backup: "Backup & restore",
    reminders: "Maintenance reminders",
    history: "Odometer history",
  },
};
const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
export function actionIcon(kind) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute(
    "d",
    {
      fuel: "M4 21V3h10v18 M4 9h10 M14 12h3v6h3V7l-3-3",
      service: "M14 3a6 6 0 0 0-7 7L2 18l4 4 8-8a6 6 0 0 0 7-7l-4 4-4-4z",
      expense: "M3 6h17v15H3z M3 6V3h14v3 M15 11h6v5h-6z",
      trip: "M12 22s8-9 8-14a8 8 0 0 0-16 0c0 5 8 14 8 14 M9 8a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
    }[kind],
  );
  svg.append(path);
  return svg;
}
export function quickActions(language, onAction) {
  const t = layoutText[language],
    wrap = el("div", undefined, "quick-actions");
  for (const [kind, key] of [
    ["fuel", "addFuel"],
    ["service", "addService"],
    ["expense", "addExpense"],
    ["trip", "trip"],
  ]) {
    const b = el("button");
    b.type = "button";
    b.className = "quick-action " + kind;
    const icon = el("span", undefined, "action-icon");
    icon.append(actionIcon(kind));
    b.append(icon, el("span", t[key]));
    b.onclick = () => onAction(kind);
    wrap.append(b);
  }
  return wrap;
}
export function dashboardOverview({
  vehicle,
  fuel,
  expenses,
  records,
  schedules,
  language,
  preferences,
  onFinance,
}) {
  const t = layoutText[language],
    root = el("section", undefined, "dashboard-overview"),
    from = today().slice(0, 4) + "-01-01",
    to = today();
  const ownFuel = fuel.filter((r) => r.vehicleId === vehicle.id),
    ownServices = records.filter((r) => r.vehicleId === vehicle.id),
    ownExpenses = expenses.filter((r) => r.vehicleId === vehicle.id);
  const rows = ledger(ownFuel, ownExpenses, ownServices),
    report = summarize(
      rows,
      (vehicle.currency || "MKD").toUpperCase(),
      from,
      to,
    ),
    cycles = fuelCycles(ownFuel).filter((c) => c.start >= from && c.end <= to),
    cons = consumption(cycles),
    format = preferences.consumption || "L100";
  const num = (v, maximumFractionDigits = 2) =>
    new Intl.NumberFormat(language === "mk" ? "mk-MK" : "en", {
      maximumFractionDigits,
    }).format(v);
  const group = el("div", undefined, "overview-cards");
  const economy = el("article", undefined, "card overview-card economy");
  economy.append(
    el("h3", t.economy),
    el(
      "p",
      cons === null
        ? "—"
        : num(efficiency(cons, format), 1) +
            " " +
            { L100: "L/100km", USmpg: "US MPG", UKmpg: "UK MPG" }[format],
      "metric",
    ),
    el("p", cons === null ? t.insufficient : t.year, "muted"),
  );
  const spending = el("article", undefined, "card overview-card spending");
  spending.append(
    el("h3", t.spending),
    el(
      "p",
      num(report.total) + " " + (vehicle.currency || "MKD").toUpperCase(),
      "metric",
    ),
  );
  spending.append(el("p", t.year, "muted"));
  function miniGraph(card, kind, points) {
    if (!points.length) return;
    const status = el("p", "", "graph-status");
    status.setAttribute("role", "status");
    const graph = chart(
      kind,
      points,
      card.querySelector("h3").textContent,
      (p) => (status.textContent = p.label),
    );
    const svg = graph.querySelector("svg");
    svg.setAttribute("preserveAspectRatio", "none");
    for (const line of svg.querySelectorAll("polyline"))
      line.setAttribute("vector-effect", "non-scaling-stroke");
    const buttons = graph.querySelector(".chart-points");
    const details = el("details", undefined, "graph-data");
    details.append(el("summary", t.details), buttons);
    graph.append(details);
    card.append(graph, status);
  }
  miniGraph(
    economy,
    "line",
    cycles.slice(-6).map((c) => ({
      value: efficiency(c.l100, format),
      label: c.end + " · " + num(efficiency(c.l100, format)),
    })),
  );
  miniGraph(
    spending,
    "bar",
    Object.entries(report.byMonth)
      .sort()
      .slice(-6)
      .map(([month, value]) => ({
        value,
        label:
          month +
          " · " +
          num(value) +
          " " +
          (vehicle.currency || "MKD").toUpperCase(),
      })),
  );
  group.append(
    economy,
    spending,
    careCard(vehicle, schedules, records, language),
  );
  const activity = el("article", undefined, "card recent-activity");
  const heading = el("div", undefined, "section-heading");
  const all = el("button", t.viewAll);
  all.type = "button";
  all.dataset.tone = "quiet";
  all.onclick = onFinance;
  heading.append(el("h3", t.recent), all);
  activity.append(heading);
  const latest = [...rows]
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
    .slice(0, 4);
  if (!latest.length) activity.append(el("p", t.empty, "muted"));
  for (const r of latest) {
    const row = el("div", undefined, "activity-row");
    const icon = el("span", undefined, "action-icon " + r.source);
    icon.append(actionIcon(r.source));
    const description = el("div");
    description.append(
      el("strong", r.title || r.station || t[r.source]),
      el("p", r.date + " · " + num(r.amount) + " " + r.currency),
    );
    row.append(icon, description);
    activity.append(row);
  }
  root.append(group, activity);
  return root;
}
