import { financeMessages } from "./finance-i18n.js";
import { today, validDate } from "./maintenance.js";
import {
  categories,
  fuelCycles,
  consumption,
  efficiency,
  ledger,
  summarize,
  priorPeriod,
  costPerDistance,
  saveFinance,
  deleteFinance,
  inRange,
} from "./finance.js";
import { chart } from "./finance-charts.js";
export function financePanel({
  db,
  initialAction = null,
  preferences = {},
  vehicle,
  vehicles,
  fuel,
  expenses,
  services,
  language,
  onChange,
  onSelect,
  onServices,
  summary = false,
  state = {},
}) {
  const t = (k) => financeMessages[language][k],
    locale = language === "mk" ? "mk-MK" : "en";
  const n = (value) =>
      new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value),
    date = (value) =>
      new Intl.DateTimeFormat(locale, { timeZone: "UTC" }).format(
        new Date(value + "T00:00:00Z"),
      );
  const root = el("section", undefined, "finance");
  state.from ??= today().slice(0, 4) + "-01-01";
  state.to ??= today();
  state.currency ??= (vehicle?.currency || "MKD").toUpperCase();
  state.format ??= preferences.consumption || "L100";
  state.limit ??= 20;
  state.category ??= "all";
  function el(tag, text, cls) {
    const v = document.createElement(tag);
    if (text !== undefined) v.textContent = text;
    if (cls) v.className = cls;
    return v;
  }
  function button(text, action, tone = "secondary") {
    const b = el("button", text);
    b.dataset.tone = tone;
    b.type = "button";
    b.onclick = () =>
      Promise.resolve()
        .then(action)
        .catch(() => {
          const error = el("p", t("invalid"));
          error.setAttribute("role", "alert");
          root.prepend(error);
        });
    return b;
  }
  const category = (k) => t(k === "fuel" ? "fuelCategory" : k);
  const unitLabel = () =>
    state.format === "USmpg"
      ? "US MPG"
      : state.format === "UKmpg"
        ? "UK MPG"
        : "L/100km";
  const money = (value) => n(value) + " " + state.currency;
  function field(form, key, type, value, options) {
    const label = el("label", t(key));
    const input = el(
      options ? "select" : type === "textarea" ? "textarea" : "input",
    );
    if (options)
      for (const [id, text] of options) {
        const option = el("option", text);
        option.value = id;
        input.append(option);
      }
    else if (type !== "textarea") input.type = type;
    input.name = key;
    if (type === "checkbox") {
      input.checked = !!value;
      label.className = "checkbox";
    } else if (type !== "file") input.value = value ?? "";
    if (type === "number") {
      input.min = "0";
      input.step = "any";
    }
    if (type === "text") input.maxLength = 200;
    if (type === "textarea") input.maxLength = 2000;
    label.append(input);
    form.append(label);
    return input;
  }
  function draw() {
    root.replaceChildren();
    if (!vehicle) {
      root.append(el("p", t("noVehicle")));
      return;
    }
    const ownFuel = fuel.filter((e) => e.vehicleId === vehicle.id),
      ownExpenses = expenses.filter((e) => e.vehicleId === vehicle.id),
      ownServices = services.filter((e) => e.vehicleId === vehicle.id);
    const rows = ledger(ownFuel, ownExpenses, ownServices),
      report = summarize(rows, state.currency, state.from, state.to);
    const cycles = fuelCycles(ownFuel).filter(
      (c) => c.start >= state.from && c.end <= state.to,
    );
    const l100 = consumption(cycles);
    const ratio = costPerDistance(
      rows,
      [...ownFuel, ...ownServices],
      state.currency,
      state.from,
      state.to,
    );
    root.append(
      el("h3", summary ? t("fuel") : vehicle.make + " " + vehicle.model),
    );
    if (!summary) {
      const select = field(
        root,
        "vehicle",
        "select",
        vehicle.id,
        vehicles
          .filter((v) => !v.archived)
          .map((v) => [v.id, v.make + " " + v.model]),
      );
      select.onchange = () => onSelect(select.value);
      const actions = el("div", undefined, "actions");
      actions.append(
        button("+ " + t("addFuel"), () => editor("fuel"), "primary"),
        button("+ " + t("addExpense"), () => editor("expense")),
      );
      root.append(actions);
    }
    const filter = el("form", undefined, "finance-filters");
    field(filter, "from", "date", state.from).required = true;
    field(filter, "to", "date", state.to).required = true;
    const currencies = [
      ...new Set([
        "MKD",
        "EUR",
        state.currency,
        ...rows.map((e) => e.currency),
      ]),
    ].sort();
    field(
      filter,
      "currency",
      "select",
      state.currency,
      currencies.map((c) => [c, c]),
    );
    field(filter, "format", "select", state.format, [
      ["L100", "L/100km"],
      ["USmpg", "US MPG"],
      ["UKmpg", "UK MPG"],
    ]);
    const apply = el("button", t("apply"));
    apply.type = "submit";
    filter.append(apply);
    const filterError = el("p");
    filterError.setAttribute("role", "alert");
    filter.append(filterError);
    filter.onsubmit = (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(filter));
      if (!validDate(data.from) || !validDate(data.to) || data.from > data.to) {
        filterError.textContent = t("badRange");
        return;
      }
      Object.assign(state, data, { limit: 20 });
      draw();
    };
    root.append(filter);
    const help = el("details");
    help.append(
      el("summary", t("method")),
      el("p", t("explain")),
      el("p", t("coverage")),
    );
    root.append(help);
    const metrics = el("div", undefined, "grid finance-metrics");
    const previous = priorPeriod(state.from, state.to),
      prior = summarize(rows, state.currency, previous.from, previous.to);
    for (const [label, value] of [
      [t("total"), money(report.total)],
      [
        t("consumption"),
        l100 === null
          ? t("insufficient")
          : n(efficiency(l100, state.format)) + " " + unitLabel(),
      ],
      [
        t("distanceCost"),
        ratio ? money(ratio.value) + "/km" : t("insufficient"),
      ],
      [
        t("previous"),
        prior.rows.length
          ? money(prior.total) +
            (prior.total > 0
              ? " · " +
                t("change") +
                " " +
                n(((report.total - prior.total) / prior.total) * 100) +
                "%"
              : "")
          : t("noPrevious"),
      ],
    ]) {
      const card = el("article", undefined, "card");
      card.append(el("h4", label), el("p", value, "metric"));
      metrics.append(card);
    }
    root.append(metrics);
    if (ratio)
      root.append(
        el(
          "p",
          t("period") +
            ": " +
            date(ratio.from) +
            " – " +
            date(ratio.to) +
            " · " +
            n(ratio.distance) +
            " km",
          "muted",
        ),
      );
    root.append(
      el(
        "p",
        t("previous") + ": " + date(previous.from) + " – " + date(previous.to),
        "muted",
      ),
    );
    const detail = el("p", t("details"), "chart-detail");
    detail.setAttribute("role", "status");
    const graphGrid = el("div", undefined, "finance-graphs");
    const series = [
      [
        "bar",
        "spending",
        Object.entries(report.byMonth)
          .sort()
          .slice(-24)
          .map(([key, value]) => ({
            value,
            label: key + " · " + money(value),
          })),
      ],
      [
        "line",
        "trend",
        cycles.slice(-24).map((c) => ({
          value: efficiency(c.l100, state.format),
          label:
            date(c.end) +
            " · " +
            n(efficiency(c.l100, state.format)) +
            " " +
            unitLabel(),
          record: c.entryId,
        })),
      ],
      [
        "donut",
        "breakdown",
        Object.entries(report.byCategory).map(([key, value]) => ({
          value,
          label: category(key) + " · " + money(value),
          category: key,
        })),
      ],
    ];
    for (const [kind, key, points] of series) {
      const card = el("article", undefined, "card");
      card.append(el("h4", t(key)));
      if (points.length && points.some((p) => p.value > 0))
        card.append(
          chart(kind, points, t(key), (p) => {
            if (p.category) {
              state.category = p.category;
              draw();
              root
                .querySelector(".ledger-heading")
                ?.scrollIntoView({ block: "start", behavior: "auto" });
            } else detail.textContent = p.label;
          }),
        );
      else
        card.append(
          el("p", key === "trend" ? t("noEstimate") : t("empty"), "muted"),
        );
      graphGrid.append(card);
    }
    root.append(graphGrid, el("p", t("chartWindow"), "muted"), detail);
    if (summary) return;
    root.append(el("h3", t("history")));
    const history = ownFuel
      .filter((e) => inRange(e, state.from, state.to))
      .sort((a, b) => b.date.localeCompare(a.date) || b.odometer - a.odometer);
    for (const e of history.slice(0, state.limit)) {
      const card = el("article", undefined, "card finance-entry");
      card.append(
        el("h4", date(e.date) + " · " + (e.full ? t("fullYes") : t("fullNo"))),
        el(
          "p",
          n(e.odometer) +
            " " +
            e.unit +
            " · " +
            n(e.volume) +
            " " +
            e.volumeUnit,
        ),
        el("p", n(e.total) + " " + e.currency + " · " + e.station),
        el("p", e.notes),
      );
      if (e.missed) card.append(el("p", t("missed"), "muted"));
      if (e.receipt) {
        const details = el("details");
        details.append(el("summary", t("receiptView")));
        const img = el("img");
        img.src = e.receipt;
        img.alt = t("receiptView");
        img.className = "receipt";
        details.append(img);
        card.append(details);
      }
      if (e.revisions?.length) {
        const audit = el("details");
        audit.append(el("summary", t("revisions")));
        for (const r of e.revisions)
          audit.append(
            el("p", date(r.date) + " · " + n(r.odometer) + " · " + n(r.total)),
          );
        card.append(audit);
      }
      const actions = el("div", undefined, "actions");
      actions.append(
        button(t("edit"), () => editor("fuel", e)),
        button(t("remove"), () => remove("fuel", e), "danger"),
      );
      card.append(actions);
      root.append(card);
    }
    if (!history.length) root.append(el("p", t("empty")));
    root.append(el("h3", t("ledger"), "ledger-heading"));
    const categorySelect = field(root, "category", "select", state.category, [
      ["all", t("all")],
      ...categories.map((k) => [k, category(k)]),
    ]);
    categorySelect.onchange = () => {
      state.category = categorySelect.value;
      state.limit = 20;
      draw();
    };
    const chosen = report.rows.filter(
      (e) => state.category === "all" || e.category === state.category,
    );
    for (const e of chosen.slice(0, state.limit)) {
      const card = el("article", undefined, "card ledger-row");
      card.append(
        el("h4", category(e.category) + " · " + money(e.amount)),
        el("p", date(e.date) + " · " + (e.title || e.station || "")),
        el(
          "p",
          t("source") +
            ": " +
            (e.source === "fuel" ? t("fuelCategory") : t(e.source)),
        ),
      );
      const actions = el("div", undefined, "actions");
      if (e.source === "expense") {
        actions.append(
          button(t("edit"), () => editor("expense", e)),
          button(t("remove"), () => remove("expense", e), "danger"),
        );
      } else
        actions.append(
          button(e.source === "service" ? t("viewService") : t("edit"), () =>
            e.source === "service"
              ? onServices()
              : editor(
                  "fuel",
                  ownFuel.find((f) => f.id === e.id),
                ),
          ),
        );
      card.append(actions);
      root.append(card);
    }
    if (!chosen.length) root.append(el("p", t("empty")));
    if (chosen.length > state.limit || history.length > state.limit)
      root.append(
        button(t("more"), () => {
          state.limit += 20;
          draw();
        }),
      );
    root.append(el("h3", t("comparison")));
    for (const v of vehicles.filter((v) => !v.archived)) {
      const f = fuel.filter((e) => e.vehicleId === v.id),
        s = services.filter((e) => e.vehicleId === v.id),
        r = ledger(
          f,
          expenses.filter((e) => e.vehicleId === v.id),
          s,
        );
      const total = summarize(r, state.currency, state.from, state.to),
        cost = costPerDistance(
          r,
          [...f, ...s],
          state.currency,
          state.from,
          state.to,
        );
      root.append(
        el(
          "p",
          v.make +
            " " +
            v.model +
            " · " +
            money(total.total) +
            " · " +
            (cost
              ? money(cost.value) +
                "/km · " +
                n(cost.distance) +
                " km · " +
                date(cost.from) +
                " – " +
                date(cost.to)
              : t("insufficient")),
        ),
      );
    }
  }
  async function remove(kind, e) {
    if (confirm(t("confirm"))) {
      await deleteFinance(db, kind, e.id);
      await onChange();
    }
  }
  function editor(kind, existing = {}) {
    const modal = el("dialog"),
      form = el("form"),
      error = el("p");
    error.setAttribute("role", "alert");
    modal.setAttribute(
      "aria-label",
      t(kind === "fuel" ? "addFuel" : "addExpense"),
    );
    form.append(
      el(
        "h2",
        t(existing.id ? "edit" : kind === "fuel" ? "addFuel" : "addExpense"),
      ),
    );
    const id = existing.id || crypto.randomUUID();
    field(form, "date", "date", existing.date || today()).max = today();
    field(form, "currency", "text", existing.currency || state.currency);
    if (kind === "fuel") {
      field(form, "odometer", "number", existing.odometer ?? vehicle.odometer);
      field(form, "unit", "select", existing.unit || vehicle.unit || "km", [
        ["km", "km"],
        ["mi", "mi"],
      ]);
      field(form, "volume", "number", existing.volume);
      field(
        form,
        "volumeUnit",
        "select",
        existing.volumeUnit || preferences.volume || "L",
        [
          ["L", t("volumeL")],
          ["USgal", t("volumeUS")],
          ["UKgal", t("volumeUK")],
        ],
      );
      field(form, "unitPrice", "number", existing.unitPrice);
      field(form, "totalPaid", "number", existing.total);
      const preview = el("p");
      const update = () =>
        (preview.textContent =
          t("preview") +
          ": " +
          n(
            Number(form.elements.volume.value) *
              Number(form.elements.unitPrice.value),
          ));
      form.addEventListener("input", update);
      update();
      form.append(preview, el("p", t("priceNote"), "muted"));
      field(form, "full", "checkbox", existing.full ?? true);
      field(form, "missed", "checkbox", existing.missed ?? false);
      field(form, "station", "text", existing.station);
      field(form, "receipt", "file").accept = "image/jpeg,image/png,image/webp";
      if (existing.receipt) field(form, "removeReceipt", "checkbox", false);
    } else {
      field(form, "title", "text", existing.title);
      field(
        form,
        "category",
        "select",
        existing.category || "other",
        categories
          .filter((c) => !["fuel", "service"].includes(c))
          .map((c) => [c, category(c)]),
      );
      field(form, "amount", "number", existing.amount);
    }
    field(form, "notes", "textarea", existing.notes);
    for (const input of form.elements)
      if (
        !["checkbox", "file"].includes(input.type) &&
        !["station", "notes"].includes(input.name)
      )
        input.required = true;
    const actions = el("footer"),
      save = el("button", t("save"));
    save.type = "submit";
    actions.append(
      button(t("cancel"), () => modal.close(), "quiet"),
      save,
    );
    form.append(actions, error);
    modal.append(form);
    document.body.append(modal);
    modal.onclose = () => modal.remove();
    form.onsubmit = async (e) => {
      e.preventDefault();
      if (save.disabled) return;
      save.disabled = true;
      try {
        const data = Object.fromEntries(new FormData(form));
        for (const key of ["odometer", "volume", "unitPrice", "amount"])
          if (key in data) data[key] = Number(data[key]);
        data.currency = data.currency.trim().toUpperCase();
        if (kind === "fuel") {
          data.total = Number(data.totalPaid);
          delete data.totalPaid;
          data.full = form.elements.full.checked;
          data.missed = form.elements.missed.checked;
          data.receipt = form.elements.removeReceipt?.checked
            ? ""
            : existing.receipt || "";
          delete data.removeReceipt;
          const file = form.elements.receipt.files[0];
          if (file) {
            if (
              !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
              file.size > 5000000
            )
              throw Error("image");
            const bitmap = await createImageBitmap(file),
              canvas = document.createElement("canvas"),
              ratio = Math.min(1, 1200 / bitmap.width, 1200 / bitmap.height);
            canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
            canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
            canvas
              .getContext("2d")
              .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            data.receipt = canvas.toDataURL("image/webp", 0.85);
            bitmap.close();
          }
        }
        await saveFinance(db, kind, {
          ...existing,
          ...data,
          id,
          vehicleId: vehicle.id,
          updatedAt: new Date().toISOString(),
        });
        modal.close();
        await onChange();
      } catch {
        error.textContent = t("invalid");
      } finally {
        save.disabled = false;
      }
    };
    modal.showModal();
  }
  draw();
  if (initialAction && vehicle) queueMicrotask(() => editor(initialAction));
  return root;
}
