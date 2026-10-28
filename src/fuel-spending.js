import { volumeFactors } from "./finance.js";
export function monthlyFuel(
  entries,
  {
    year,
    vehicleId = "all",
    currency,
    asOf = new Date().toISOString().slice(0, 10),
  },
) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: String(year) + "-" + String(i + 1).padStart(2, "0"),
    total: 0,
    litres: 0,
    count: 0,
    rows: [],
  }));
  for (const row of entries) {
    if (
      row.date > asOf ||
      !row.date.startsWith(year + "-") ||
      row.currency !== currency ||
      (vehicleId !== "all" && row.vehicleId !== vehicleId)
    )
      continue;
    const i = Number(row.date.slice(5, 7)) - 1;
    if (i < 0 || i > 11) continue;
    months[i].total += row.total;
    months[i].litres += row.volume * (volumeFactors[row.volumeUnit] || 0);
    months[i].count++;
    months[i].rows.push(row);
  }
  const currentYear = Number(asOf.slice(0, 4)),
    elapsed =
      year < currentYear
        ? 12
        : year === currentYear
          ? Number(asOf.slice(5, 7))
          : 0;
  const total = months.reduce((s, m) => s + m.total, 0);
  return {
    months,
    total,
    elapsed,
    average: elapsed ? total / elapsed : 0,
    current: year === currentYear ? months[elapsed - 1] : null,
  };
}
export function fuelSpendingPanel({ fuel, vehicles, vehicle }) {
  const root = document.createElement("section");
  root.className = "card monthly-fuel";
  const state = {
    year: new Date().getFullYear(),
    vehicleId: vehicle?.id || "all",
    currency: vehicle?.currency || "MKD",
  };
  const el = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  const fmt = (n) =>
    new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(n);
  function draw() {
    root.replaceChildren();
    const heading = el("div", undefined, "section-heading");
    heading.append(el("h3", "Monthly Fuel Spending"));
    const filters = el("div", undefined, "fuel-filters");
    const years = [
      ...new Set([
        new Date().getFullYear(),
        ...fuel.map((r) => Number(r.date.slice(0, 4))),
      ]),
    ].sort((a, b) => b - a);
    for (const [key, label, options] of [
      [
        "vehicleId",
        "Vehicle",
        [
          ["all", "All vehicles"],
          ...vehicles.map((v) => [v.id, v.make + " " + v.model]),
        ],
      ],
      ["year", "Year", years.map((y) => [y, String(y)])],
      [
        "currency",
        "Currency",
        [...new Set([state.currency, ...fuel.map((r) => r.currency)])]
          .sort()
          .map((c) => [c, c]),
      ],
    ]) {
      const l = el("label", label),
        select = el("select");
      select.setAttribute("aria-label", label);
      select.name = key;
      for (const [value, text] of options) {
        const o = el("option", text);
        o.value = value;
        o.selected = String(state[key]) === String(value);
        select.append(o);
      }
      select.onchange = () => {
        state[key] = key === "year" ? Number(select.value) : select.value;
        draw();
      };
      l.append(select);
      filters.append(l);
    }
    heading.append(filters);
    root.append(heading);
    const data = monthlyFuel(fuel, state),
      stats = el("div", undefined, "fuel-summary");
    for (const [label, value] of [
      [
        data.current ? "This month · in progress" : "Selected year",
        data.current ? data.current.total : data.total,
      ],
      [data.current ? "Year to date" : "Annual total", data.total],
      ["Monthly average", data.average],
    ]) {
      const block = el("div");
      block.append(
        el("small", label),
        el("strong", fmt(value) + " " + state.currency),
      );
      stats.append(block);
    }
    root.classList.toggle("is-empty", !data.months.some((m) => m.count));
    root.append(stats);
    const bars = el("div", undefined, "month-bars"),
      detail = el("div", undefined, "fuel-drilldown");
    detail.setAttribute("aria-live", "polite");
    const max = Math.max(1, ...data.months.map((m) => m.total));
    const selectMonth = (month) => {
      for (const b of bars.children)
        b.setAttribute("aria-pressed", String(b.dataset.month === month.month));
      detail.replaceChildren(
        el(
          "strong",
          month.month + " · " + fmt(month.total) + " " + state.currency,
        ),
        el(
          "p",
          fmt(month.litres) + " L purchased · " + month.count + " transactions",
        ),
      );
      for (const row of month.rows.sort((a, b) =>
        b.date.localeCompare(a.date),
      )) {
        const v = vehicles.find((v) => v.id === row.vehicleId);
        detail.append(
          el(
            "p",
            row.date +
              " · " +
              (v ? v.make + " " + v.model : "Vehicle") +
              " · " +
              fmt(row.total) +
              " " +
              row.currency +
              " · " +
              (row.station || "Fill-up"),
          ),
        );
      }
      if (!month.count)
        detail.append(el("p", "No fuel purchases recorded for this month."));
    };
    for (const [i, m] of data.months.entries()) {
      const b = el("button", undefined, "month-bar");
      b.type = "button";
      b.dataset.month = m.month;
      b.setAttribute("aria-pressed", "false");
      const name = new Date(Date.UTC(state.year, i, 1)).toLocaleString("en", {
        month: "short",
        timeZone: "UTC",
      });
      b.setAttribute(
        "aria-label",
        name +
          " " +
          state.year +
          ": " +
          fmt(m.total) +
          " " +
          state.currency +
          ", " +
          fmt(m.litres) +
          " litres, " +
          m.count +
          " transactions",
      );
      b.title = b.getAttribute("aria-label");
      const track = el("span", undefined, "bar-track"),
        fill = el("span", undefined, "bar-fill");
      fill.style.setProperty("--bar-height", (m.total / max) * 100 + "%");
      track.append(fill);
      b.append(track, el("span", name));
      b.onclick = () => selectMonth(m);
      bars.append(b);
    }
    root.append(
      bars,
      el(
        "p",
        "Average includes zero-spend months through " +
          (data.current
            ? "the current, incomplete month."
            : "the end of the selected year.") +
          " Fuel purchased, not fuel consumed.",
        "muted",
      ),
      detail,
    );
    if (!data.months.some((m) => m.count))
      detail.append(el("p", "Add a fill-up to start your spending history."));
  }
  draw();
  return root;
}
