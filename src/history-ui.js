import { historyRows } from "./journey.js";
const el = (tag, text, cls) => {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
};
export function historyPanel({ vehicle, services, fuel, expenses, documents }) {
  const root = el("section", undefined, "ownership-history"),
    tools = el("div", undefined, "history-tools"),
    results = el("div"),
    count = el("p", undefined, "muted");
  const search = el("input");
  search.type = "search";
  search.placeholder = "Search records, providers and receipts";
  search.setAttribute("aria-label", "Search vehicle history");
  const type = el("select");
  type.setAttribute("aria-label", "History type");
  for (const v of ["All", "Service", "Fuel", "Expense", "Document"]) {
    const o = el("option", v === "Document" ? "Receipts & documents" : v);
    o.value = v;
    type.append(o);
  }
  tools.append(search, type);
  count.setAttribute("role", "status");
  root.append(tools, count, results);
  const rows = historyRows(vehicle.id, services, fuel, expenses, documents);
  const draw = () => {
    const query = search.value.trim().toLowerCase();
    const visible = rows.filter(
      (r) =>
        (type.value === "All" ||
          r.type === type.value ||
          (type.value === "Document" && (r.documents.length || r.receipt))) &&
        [
          r.title,
          r.notes,
          r.date,
          r.currency,
          ...r.documents.map((d) => d.name),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query),
    );
    count.textContent = visible.length + " matching records";
    results.replaceChildren();
    if (!visible.length)
      results.append(
        el(
          "p",
          "No matching history. Try another search or add a record.",
          "empty-state",
        ),
      );
    for (const r of visible) {
      const card = el("article", undefined, "card history-record"),
        heading = el("div", undefined, "section-heading");
      heading.append(el("h4", r.title), el("span", r.type, "status"));
      card.append(heading, el("p", r.date || "No date"), el("p", r.notes));
      if (Number.isFinite(r.amount))
        card.append(
          el(
            "strong",
            new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(
              r.amount,
            ) +
              " " +
              r.currency,
          ),
        );
      for (const d of r.documents) {
        const link = el("a", "Download " + d.name);
        link.href = d.data;
        link.download = d.name;
        card.append(link);
      }
      if (r.receipt) {
        const b = el("button", "View receipt");
        b.type = "button";
        b.onclick = () => {
          const dialog = el("dialog"),
            image = el("img"),
            close = el("button", "Close");
          dialog.setAttribute("aria-label", "Receipt");
          image.src = r.receipt;
          image.alt = "Receipt for " + r.title;
          close.onclick = () => dialog.close();
          dialog.append(image, close);
          dialog.onclose = () => dialog.remove();
          document.body.append(dialog);
          dialog.showModal();
        };
        card.append(b);
      }
      results.append(card);
    }
  };
  search.oninput = draw;
  type.onchange = draw;
  draw();
  return root;
}
