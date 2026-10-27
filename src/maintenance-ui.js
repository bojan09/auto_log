import { maintenanceMessages } from "./maintenance-i18n.js";
import {
  today,
  compareDue,
  dueStatus,
  putSchedule,
  saveRecord,
  removeItem,
} from "./maintenance.js";
export function maintenancePanel({
  db,
  vehicle,
  vehicles,
  schedules,
  records,
  language,
  onChange,
  onSelect,
  summary = false,
}) {
  const t = (k) => maintenanceMessages[language][k],
    root = el("section", undefined, "maintenance");
  const ownSchedules = schedules.filter((x) => x.vehicleId === vehicle?.id),
    ownRecords = records.filter((x) => x.vehicleId === vehicle?.id);
  let filter = "all";
  function el(tag, text, cls) {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
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
  function date(value) {
    return new Intl.DateTimeFormat(language === "mk" ? "mk-MK" : "en", {
      timeZone: "UTC",
    }).format(new Date(value + "T00:00:00Z"));
  }
  function num(value) {
    return new Intl.NumberFormat(language === "mk" ? "mk-MK" : "en", {
      maximumFractionDigits: 2,
    }).format(value);
  }
  function draw() {
    root.replaceChildren();
    if (!vehicle) {
      root.append(el("p", t("noVehicle")));
      return;
    }
    root.append(
      el("h3", summary ? t("reminders") : vehicle.make + " " + vehicle.model),
    );
    if (!summary) {
      const select = el("select");
      select.setAttribute("aria-label", t("choose"));
      for (const v of vehicles.filter((v) => !v.archived)) {
        const o = el("option", v.make + " " + v.model);
        o.value = v.id;
        o.selected = v.id === vehicle.id;
        select.append(o);
      }
      select.onchange = () => onSelect(select.value);
      const help = el("details", undefined, "maintenance-help");
      help.append(el("summary", t("rulesTitle")), el("p", t("rules"), "muted"));
      root.append(select, help);
      const actions = el("div", undefined, "actions");
      actions.append(
        button("+ " + t("newSchedule"), () => editor("schedule"), "primary"),
        button("+ " + t("newRecord"), () => editor("record")),
      );
      root.append(actions);
      const filters = el("div", undefined, "actions filters");
      for (const key of ["all", "scheduled", "soon", "due", "overdue"]) {
        const b = button(t(key), () => {
          filter = key;
          draw();
        });
        b.setAttribute("aria-pressed", String(filter === key));
        filters.append(b);
      }
      root.append(filters);
    }
    const rows = ownSchedules
      .map((s) => ({ s, d: dueStatus(s, vehicle, ownRecords) }))
      .sort(compareDue);
    root.append(el("h4", t("schedules")));
    let visible = 0;
    for (const { s, d } of rows) {
      if (
        (summary && visible >= 3) ||
        (!summary && filter !== "all" && filter !== d.status)
      )
        continue;
      visible++;
      const card = el("article", undefined, "card service-card " + d.status);
      card.append(
        el("h4", s.title),
        el("span", t(d.status), "status " + d.status),
        el("p", t(s.category)),
      );
      card.append(
        el(
          "p",
          t("next") +
            ": " +
            [
              d.dueDate ? date(d.dueDate) : "",
              d.dueOdometer !== null ? num(d.dueOdometer) + " " + s.unit : "",
            ]
              .filter(Boolean)
              .join(" · "),
        ),
      );
      const actions = el("div", undefined, "actions");
      actions.append(
        button(t("complete"), () => editor("record", {}, s), "primary"),
        button(t("edit"), () => editor("schedule", s)),
        button(
          t("remove"),
          async () => {
            if (confirm(t("confirm"))) {
              await removeItem(db, "serviceSchedules", s.id);
              await onChange();
            }
          },
          "danger",
        ),
      );
      card.append(actions);
      root.append(card);
    }
    if (!visible) root.append(el("p", t("empty"), "muted"));
    if (summary) return;
    root.append(el("h4", t("history")), el("p", t("historyNote"), "muted"));
    const timeline = el("div", undefined, "service-timeline");
    for (const r of [...ownRecords].sort((a, b) =>
      b.date.localeCompare(a.date),
    )) {
      const card = el("article", undefined, "card service-card");
      card.append(
        el("h4", r.title),
        el("p", date(r.date) + " · " + num(r.odometer) + " " + r.unit),
        el("p", num(r.cost) + " " + r.currency + " · " + r.provider),
        el("p", r.notes),
      );
      const actions = el("div", undefined, "actions");
      actions.append(
        button(t("edit"), () => editor("record", r)),
        button(
          t("remove"),
          async () => {
            if (confirm(t("confirm"))) {
              await removeItem(db, "serviceRecords", r.id);
              await onChange();
            }
          },
          "danger",
        ),
      );
      card.append(actions);
      if (r.revisions?.length) {
        const audit = el("details");
        audit.append(el("summary", t("revisions")));
        for (const previous of r.revisions)
          audit.append(
            el(
              "p",
              date(previous.date) +
                " · " +
                num(previous.odometer) +
                " " +
                previous.unit,
            ),
          );
        card.append(audit);
      }
      timeline.append(card);
    }
    root.append(timeline);
  }
  function editor(kind, existing = {}, linked) {
    const modal = el("dialog"),
      form = el("form"),
      error = el("p");
    error.setAttribute("role", "alert");
    modal.setAttribute(
      "aria-label",
      t(kind === "schedule" ? "newSchedule" : "newRecord"),
    );
    form.append(
      el(
        "h2",
        t(
          existing.id
            ? "edit"
            : kind === "schedule"
              ? "newSchedule"
              : "newRecord",
        ),
      ),
    );
    const id = existing.id || crypto.randomUUID();
    function field(name, type, value, options) {
      const label = el("label", t(name));
      let input;
      if (options) {
        input = el("select");
        for (const [key, title] of options) {
          const o = el("option", title);
          o.value = key;
          input.append(o);
        }
      } else {
        input = el(type === "textarea" ? "textarea" : "input");
        if (type !== "textarea") input.type = type;
      }
      input.name = name;
      input.value = value ?? "";
      if (type === "number") {
        input.min = "0";
        input.step = ["months", "warnDays"].includes(name) ? "1" : "any";
      }
      if (type === "text") input.maxLength = 200;
      if (type === "textarea") input.maxLength = 4000;
      if (!["provider", "notes"].includes(name)) input.required = true;
      label.append(input);
      form.append(label);
      return input;
    }
    field("title", "text", existing.title || linked?.title || "");
    field(
      "category",
      "select",
      existing.category || linked?.category || "oil",
      ["oil", "brakes", "tires", "battery", "inspection", "other"].map((k) => [
        k,
        t(k),
      ]),
    );
    field("unit", "select", existing.unit || vehicle.unit || "km", [
      ["km", "km"],
      ["mi", "mi"],
    ]);
    if (kind === "schedule") {
      field("baseDate", "date", existing.baseDate || today());
      field(
        "baseOdometer",
        "number",
        existing.baseOdometer ?? vehicle.odometer,
      );
      field("months", "number", existing.months ?? 0);
      field("distance", "number", existing.distance ?? 0);
      field("warnDays", "number", existing.warnDays ?? 30);
      field("warnDistance", "number", existing.warnDistance ?? 500);
    } else {
      field("date", "date", existing.date || today()).max = today();
      field("odometer", "number", existing.odometer ?? vehicle.odometer);
      field("cost", "number", existing.cost ?? 0);
      field("currency", "text", existing.currency || vehicle.currency || "MKD");
      field("provider", "text", existing.provider || "");
      field("notes", "textarea", existing.notes || "");
      const link = field(
        "linked",
        "select",
        existing.scheduleId || linked?.id || "",
        [["", t("standalone")], ...ownSchedules.map((s) => [s.id, s.title])],
      );
      link.required = false;
    }
    const actions = el("footer");
    const save = el("button", t("save"));
    save.type = "submit";
    actions.append(
      button(t("cancel"), () => modal.close(), "quiet"),
      save,
    );
    form.append(actions, error);
    modal.append(form);
    document.body.append(modal);
    modal.addEventListener("close", () => modal.remove());
    form.onsubmit = async (e) => {
      e.preventDefault();
      if (save.disabled) return;
      save.disabled = true;
      try {
        const data = Object.fromEntries(new FormData(form));
        for (const key of [
          "baseOdometer",
          "months",
          "distance",
          "warnDays",
          "warnDistance",
          "odometer",
          "cost",
        ])
          if (key in data) data[key] = Number(data[key]);
        const value = {
          ...existing,
          ...data,
          id,
          vehicleId: vehicle.id,
          updatedAt: new Date().toISOString(),
        };
        if (kind === "schedule") await putSchedule(db, value);
        else {
          value.scheduleId = data.linked || null;
          delete value.linked;
          await saveRecord(db, value);
        }
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
  return root;
}
