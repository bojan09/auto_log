import { fuelSpendingPanel } from "./fuel-spending.js";
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
    overview: "A little care. A lot more road.",
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
    b.append(icon, el("span", t[key]), el("span", "→", "action-arrow"));
    b.querySelector(".action-arrow").setAttribute("aria-hidden", "true");
    b.onclick = () => onAction(kind);
    wrap.append(b);
  }
  return wrap;
}
export function dashboardOverview({
  vehicle,
  vehicles,
  fuel,
  expenses,
  records,
  schedules,
  language,
  preferences,
  onFinance,
}) {
  const root = el("section", undefined, "dashboard-overview"),
    group = el("div", undefined, "overview-cards");
  const from = today().slice(0, 4) + "-01-01",
    ownFuel = fuel.filter((r) => r.vehicleId === vehicle.id);
  const rows = ledger(
    ownFuel,
    expenses.filter((r) => r.vehicleId === vehicle.id),
    records.filter((r) => r.vehicleId === vehicle.id),
  );
  const currency = (vehicle.currency || "MKD").toUpperCase(),
    report = summarize(rows, currency, from, today());
  const cycles = fuelCycles(ownFuel).filter(
      (c) => c.start >= from && c.end <= today(),
    ),
    value = consumption(cycles),
    format = preferences.consumption || "L100";
  const num = (n) =>
    new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(n);
  function metric(kind, title, amount, caption) {
    const card = el("article", undefined, "card overview-card " + kind);
    const label = el("div", undefined, "metric-label");
    label.append(
      actionIcon(kind === "economy" ? "fuel" : "expense"),
      el("h3", title),
    );
    card.append(label, el("p", amount, "metric"), el("p", caption, "muted"));
    group.append(card);
    return card;
  }
  const economy = metric(
    "economy",
    "Fuel economy",
    value === null
      ? "—"
      : new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(
          efficiency(value, format),
        ) +
          " " +
          { L100: "L/100km", USmpg: "US MPG", UKmpg: "UK MPG" }[format],
    value === null
      ? "Add full-tank readings to measure consumption."
      : "Measured full-to-full · this year",
  );
  if (cycles.length) {
    const detail = el("p", "", "graph-status");
    const graph = chart(
      "line",
      cycles.slice(-6).map((c) => ({
        value: efficiency(c.l100, format),
        label: c.end + " · " + num(efficiency(c.l100, format)),
      })),
      "Measured fuel economy",
      (p) => (detail.textContent = p.label),
    );
    const disclosure = el("details", undefined, "graph-data");
    disclosure.append(
      el("summary", "Chart details"),
      graph.querySelector(".chart-points"),
    );
    graph.append(disclosure);
    economy.append(graph, detail);
  }
  metric(
    "spending",
    "Total expenses",
    num(report.total) + " " + currency,
    "Year to date · recorded costs",
  );
  group.append(careCard(vehicle, schedules, records, language));
  const activity = el("article", undefined, "card recent-activity"),
    heading = el("div", undefined, "section-heading"),
    all = el("button", "View all");
  all.type = "button";
  all.dataset.tone = "quiet";
  all.onclick = onFinance;
  heading.append(el("h3", "Recent activity"), all);
  activity.append(heading);
  const latest = [...rows]
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
    .slice(0, 4);
  if (!latest.length)
    activity.append(
      el(
        "p",
        "Your fill-ups, services and expenses will appear here.",
        "empty-state",
      ),
    );
  for (const r of latest) {
    const row = el("div", undefined, "activity-row"),
      icon = el("span", undefined, "action-icon " + r.source),
      description = el("div");
    icon.append(actionIcon(r.source));
    description.append(
      el("strong", r.source === "fuel" ? "Fuel refill" : r.title || "Service"),
      el("p", r.date),
    );
    row.append(
      icon,
      description,
      el("strong", num(r.amount) + " " + r.currency, "activity-amount"),
    );
    activity.append(row);
  }
  const lower = el("div", undefined, "dashboard-lower");
  lower.append(fuelSpendingPanel({ fuel, vehicles, vehicle }), activity);
  root.append(group, lower);
  return root;
}
