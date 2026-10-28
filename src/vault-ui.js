import { historyPanel } from "./history-ui.js";
import { destinations } from "./navigation.js";
import { fuelSpendingPanel } from "./fuel-spending.js";
import { vaultMessages } from "./vault-i18n.js";
import {
  preferenceOptions,
  readPreferences,
  snapshot,
  parseBackup,
  restore,
  MAX_BACKUP,
  documentData,
  validateAttachment,
  writeRow,
  removeRow,
  validateChecklist,
  csv,
  calendar,
  reminderEvents,
} from "./vault.js";
import { list } from "./maintenance.js";
import { maintenanceMessages } from "./maintenance-i18n.js";
import { financeMessages } from "./finance-i18n.js";
export function applyAppearance(preferences) {
  const p = readPreferences(preferences);
  document.documentElement.dataset.theme =
    p.theme === "system"
      ? matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : p.theme;
  document.documentElement.dataset.accent = p.accent;
  document.documentElement.dataset.surface = p.surface;
  document.documentElement.dataset.background = p.background;
}
const el = (tag, text, cls) => {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
};
export function downloadFile(content, name, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = el("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportBackup(db, preferences) {
  const data = JSON.stringify(await snapshot(db, readPreferences(preferences)));
  if (new Blob([data]).size > MAX_BACKUP) throw Error("Backup exceeds 50 MiB.");
  downloadFile(
    data,
    "autolog-backup-" + new Date().toISOString().slice(0, 10) + ".json",
    "application/json",
  );
  const stamp = new Date().toISOString();
  preferences.setItem("lastBackupAt", stamp);
  return stamp;
}
export function backupSummary(preferences) {
  const stamp = preferences.getItem("lastBackupAt");
  const valid =
    stamp &&
    Number.isFinite(Date.parse(stamp)) &&
    Date.parse(stamp) <= Date.now();
  return {
    due: !valid || Date.now() - Date.parse(stamp) > 30 * 86400000,
    text: valid
      ? "Last export requested: " + new Date(stamp).toLocaleDateString("en")
      : "No backup export requested on this device.",
  };
}
export function morePanel({
  db,
  vehicles,
  services,
  fuel,
  expenses,
  schedules,
  language,
  preferences,
  onChange,
  onPreferences,
  state,
  onProfile,
  onGarage,
  onDestination,
}) {
  const t = (k) => vaultMessages[language][k] || k;
  const root = el("section", undefined, "vault");
  const notice = el("p");
  notice.setAttribute("role", "status");
  const nav = el("div", undefined, "vault-tabs");
  nav.setAttribute("aria-label", t("settings"));
  const content = el("div", undefined, "vault-content");
  const directory = el("details", undefined, "feature-directory");
  directory.append(el("summary", "All features"));
  const links = el("div", undefined, "feature-links");
  for (const [key, label] of destinations) {
    const link = el("a", label);
    link.href = "#" + key;
    link.onclick = (event) => {
      event.preventDefault();
      onDestination(key);
    };
    links.append(link);
  }
  directory.append(links);
  root.append(directory, nav, notice, content);

  const message = (key, error = false) => {
    notice.setAttribute("role", error ? "alert" : "status");
    notice.textContent = t(key);
  };
  const action = (label, fn, tone = "secondary") => {
    const b = el("button", label);
    b.dataset.tone = tone;
    b.type = "button";
    b.onclick = async () => {
      b.disabled = true;
      try {
        await fn();
      } catch {
        message("error", true);
      } finally {
        b.disabled = false;
      }
    };
    return b;
  };
  const field = (parent, key, type = "text", value = "", options) => {
    const label = el("label", t(key));
    const input = el(options ? "select" : "input");
    input.name = key;
    input.setAttribute("aria-label", t(key));
    if (options) {
      for (const [v, name] of options) {
        const o = el("option", name);
        o.value = v;
        input.append(o);
      }
    } else input.type = type;
    input.value = value;
    label.append(input);
    parent.append(label);
    return input;
  };
  const modal = (title) => {
    const d = el("dialog");
    d.setAttribute("aria-label", title);
    d.append(el("h2", title));
    d.onclose = () => d.remove();
    document.body.append(d);
    return d;
  };
  const vehicleSelect = () => {
    const v =
      vehicles.find((v) => v.id === state.vehicleId) ||
      vehicles.find((v) => !v.archived) ||
      vehicles[0];
    if (!v) {
      content.append(el("p", t("noVehicle")));
      return null;
    }
    state.vehicleId = v.id;
    const select = field(
      content,
      "vehicle",
      "",
      v.id,
      vehicles.map((v) => [v.id, v.make + " " + v.model]),
    );
    select.onchange = () => {
      state.vehicleId = select.value;
      draw();
    };
    return v;
  };
  const rowsFor = (v) => ({
    serviceRecords: services.filter((r) => r.vehicleId === v.id),
    fuelEntries: fuel.filter((r) => r.vehicleId === v.id),
    expenseEntries: expenses.filter((r) => r.vehicleId === v.id),
  });
  const columns = {
    serviceRecords: [
      "date",
      "title",
      "odometer",
      "unit",
      "cost",
      "currency",
      "provider",
      "notes",
    ],
    fuelEntries: [
      "date",
      "odometer",
      "unit",
      "volume",
      "volumeUnit",
      "total",
      "currency",
      "station",
      "full",
    ],
    expenseEntries: [
      "date",
      "title",
      "category",
      "amount",
      "currency",
      "notes",
    ],
  };
  const labelFor = (k) =>
    t(
      {
        date: "dateColumn",
        currency: "recordCurrency",
        volume: "volumeColumn",
        amount: "cost",
      }[k] || k,
    );
  const mappedRows = (kind, rows) =>
    rows.map((r) => ({
      ...r,
      category:
        financeMessages[language][r.category] ||
        maintenanceMessages[language][r.category] ||
        r.category,
      full: r.full ? t("yes") : t("no"),
    }));
  const checklistForm = (vehicle, old) => {
    const d = modal(old ? t("edit") : t("addTrip"));
    const f = el("form");
    d.append(f);
    const title = field(f, "title", "text", old?.title || "");
    title.required = true;
    title.maxLength = 120;
    const date = field(f, "date", "date", old?.date || "");
    const label = el("label", t("items"));
    const input = el("textarea");
    input.setAttribute("aria-label", t("items"));
    input.value = (old?.items || []).map((i) => i.text).join("\n");
    input.maxLength = 20000;
    label.append(input);
    f.append(label);
    const submit = el("button", t("save"));
    submit.type = "submit";
    const error = el("p");
    error.setAttribute("role", "alert");
    f.append(
      submit,
      action(t("cancel"), () => d.close(), "quiet"),
      error,
    );
    f.onsubmit = async (e) => {
      e.preventDefault();
      submit.disabled = true;
      try {
        const items = input.value
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((text, index) => ({
            text,
            done:
              old?.items[index]?.text === text ? old.items[index].done : false,
          }));
        const row = {
          id: old?.id || crypto.randomUUID(),
          vehicleId: vehicle.id,
          title: title.value.trim(),
          date: date.value,
          items,
        };
        validateChecklist(row);
        await writeRow(db, "checklists", row);
        d.close();
        await draw();
      } catch {
        error.textContent = t("error");
      } finally {
        submit.disabled = false;
      }
    };
    d.showModal();
  };
  async function documents(vehicle) {
    const requestGeneration = generation;
    content.append(el("p", t("fileHelp"), "muted"));
    const f = el("form", undefined, "card vault-form");
    content.append(f);
    const file = field(f, "file", "file");
    file.accept = "image/png,image/jpeg,image/webp,application/pdf";
    file.required = true;
    const options = [["", t("unlinked")]];
    for (const [kind, rows] of Object.entries(rowsFor(vehicle)))
      for (const r of rows)
        options.push([
          kind + ":" + r.id,
          t(kind) + " · " + r.date + " · " + (r.title || r.station || r.total),
        ]);
    const link = field(f, "link", "", "", options);
    const submit = el("button", t("upload"));
    submit.type = "submit";
    f.append(submit);
    f.onsubmit = async (e) => {
      e.preventDefault();
      submit.disabled = true;
      try {
        const picked = file.files[0];
        const data = await documentData(picked);
        const estimate = await navigator.storage?.estimate?.();
        if (
          estimate?.quota &&
          estimate.quota - estimate.usage < picked.size * 2
        )
          throw Error("quota");
        const separator = link.value.indexOf(":");
        const recordStore = separator < 0 ? "" : link.value.slice(0, separator);
        const recordId = separator < 0 ? "" : link.value.slice(separator + 1);
        const row = {
          id: crypto.randomUUID(),
          vehicleId: vehicle.id,
          name: picked.name,
          type: picked.type,
          size: picked.size,
          data,
          recordStore: recordStore || "",
          recordId: recordId || "",
        };
        validateAttachment(row);
        await writeRow(db, "attachments", row);
        await draw();
      } catch {
        message("fileError", true);
      } finally {
        submit.disabled = false;
      }
    };
    const docs = (await list(db, "attachments")).filter(
      (r) => r.vehicleId === vehicle.id,
    );
    if (requestGeneration !== generation) return;
    if (!docs.length) content.append(el("p", t("empty")));
    const grid = el("div", undefined, "grid");
    content.append(grid);
    for (const doc of docs) {
      const card = el("article", undefined, "card document-card");
      card.append(
        el("p", "VEHICLE DOCUMENT", "eyebrow"),
        el("h3", doc.name),
        el("p", (doc.size / 1024).toFixed(1) + " KiB"),
      );
      const record = rowsFor(vehicle)[doc.recordStore]?.find(
        (r) => r.id === doc.recordId,
      );
      card.append(
        el(
          "p",
          record
            ? t(doc.recordStore) +
                " · " +
                record.date +
                " · " +
                (record.title || record.station || "")
            : t("unlinked"),
          "muted",
        ),
      );
      card.append(
        action(t("preview"), () => {
          const d = modal(doc.name);
          if (doc.type.startsWith("image/")) {
            const img = el("img");
            img.src = doc.data;
            img.alt = doc.name;
            img.className = "document-preview";
            d.append(img);
          } else {
            const iframe = el("iframe");
            iframe.title = doc.name;
            iframe.setAttribute("sandbox", "");
            iframe.src = doc.data;
            iframe.className = "document-preview";
            d.append(iframe, el("p", t("fileHelp")));
          }
          const a = el("a", t("download"));
          a.href = doc.data;
          a.download = doc.name;
          d.append(
            a,
            action(t("close"), () => d.close(), "quiet"),
          );
          d.showModal();
          d.querySelector("button").focus();
        }),
        action(
          t("remove"),
          async () => {
            if (confirm(t("deleteConfirm"))) {
              await removeRow(db, "attachments", doc.id);
              await draw();
            }
          },
          "danger",
        ),
      );
      grid.append(card);
    }
  }
  async function trips(vehicle) {
    const requestGeneration = generation;
    content.append(el("p", t("calendarHelp"), "muted"));
    const rows = (await list(db, "checklists")).filter(
      (r) => r.vehicleId === vehicle.id,
    );
    if (requestGeneration !== generation) return;
    content.append(
      action(t("addTrip"), () => checklistForm(vehicle), "primary"),
      action(t("exportCalendar"), () =>
        downloadFile(
          calendar(reminderEvents(vehicle, schedules, services, rows)),
          "autolog-calendar.ics",
          "text/calendar;charset=utf-8",
        ),
      ),
    );
    if (!rows.length)
      content.append(
        el(
          "p",
          "Plan your next journey with a departure date and a checklist.",
          "empty-state",
        ),
      );
    for (const row of rows) {
      const card = el("article", undefined, "card trip-card"),
        header = el("div", undefined, "section-heading"),
        identity = el("div");
      identity.append(
        el("h3", row.title),
        el("p", row.date || "No departure date", "muted"),
      );
      header.append(
        identity,
        el(
          "span",
          row.items.filter((i) => i.done).length +
            " / " +
            row.items.length +
            " ready",
          "status",
        ),
      );
      card.append(header);
      card.append(
        el(
          "p",
          row.items.filter((i) => !i.done).length + " " + t("remaining"),
          "muted",
        ),
      );
      for (const [index, item] of row.items.entries()) {
        const label = el("label", undefined, "check-item");
        const box = el("input");
        box.type = "checkbox";
        box.checked = item.done;
        box.onchange = async () => {
          box.disabled = true;
          try {
            const next = {
              ...row,
              items: row.items.map((i, n) =>
                n === index ? { ...i, done: box.checked } : i,
              ),
            };
            await writeRow(db, "checklists", next);
            await draw();
          } catch {
            box.checked = item.done;
            box.disabled = false;
            message("error", true);
          }
        };
        label.append(box, el("span", item.text));
        card.append(label);
      }
      card.append(
        action(t("edit"), () => checklistForm(vehicle, row)),
        action(
          t("remove"),
          async () => {
            if (confirm(t("deleteConfirm"))) {
              await removeRow(db, "checklists", row.id);
              await draw();
            }
          },
          "danger",
        ),
      );
      content.append(card);
    }
  }
  function reports(vehicle) {
    content.append(fuelSpendingPanel({ fuel, vehicles, vehicle }));
    content.append(el("p", t("reportHelp"), "muted"));
    for (const [kind, rows] of Object.entries(rowsFor(vehicle))) {
      const card = el("article", undefined, "card");
      card.append(
        el("h3", t(kind)),
        el("p", rows.length + " " + t("records")),
        action(t("csv"), () =>
          downloadFile(
            csv(
              mappedRows(kind, rows),
              columns[kind].map((key) => ({ key, label: labelFor(key) })),
            ),
            "autolog-" + kind + ".csv",
            "text/csv;charset=utf-8",
          ),
        ),
      );
      content.append(card);
    }
    content.append(
      action(
        t("report"),
        () => {
          const d = modal(t("summary"));
          d.className = "report-dialog";
          d.append(
            el("h3", vehicle.make + " " + vehicle.model + " · " + vehicle.year),
          );
          const prefs = readPreferences(preferences);
          for (const [kind, rows] of Object.entries(rowsFor(vehicle))) {
            d.append(el("h3", t(kind)));
            const table = el("table");
            const head = el("thead");
            const hr = el("tr");
            for (const key of columns[kind]) hr.append(el("th", labelFor(key)));
            head.append(hr);
            table.append(head);
            const body = el("tbody");
            for (const r of mappedRows(kind, rows).sort((a, b) =>
              a.date.localeCompare(b.date),
            )) {
              const tr = el("tr");
              for (const key of columns[kind]) {
                let value = r[key] ?? "";
                if (key === "date" && prefs.dateFormat === "locale")
                  value = new Intl.DateTimeFormat(
                    language === "mk" ? "mk-MK" : "en",
                    { timeZone: "UTC" },
                  ).format(new Date(value + "T00:00:00Z"));
                tr.append(el("td", value));
              }
              body.append(tr);
            }
            table.append(body);
            const wrap = el("div", undefined, "table-scroll");
            wrap.append(table);
            d.append(wrap);
            const sums = Object.create(null);
            for (const r of rows)
              sums[r.currency] =
                (sums[r.currency] || 0) + (r.cost ?? r.total ?? r.amount ?? 0);
            for (const [currency, total] of Object.entries(sums))
              d.append(
                el("p", t("total") + ": " + total.toFixed(2) + " " + currency),
              );
          }
          d.append(
            action(t("print"), () => window.print()),
            action(t("close"), () => d.close(), "quiet"),
          );
          d.showModal();
        },
        "primary",
      ),
    );
  }
  async function backup() {
    const status = el("p", backupSummary(preferences).text, "muted");
    content.append(status);
    content.append(el("p", t("backupHelp")));
    content.append(
      action(
        t("exportBackup"),
        async () => {
          await exportBackup(db, preferences);
          message("Backup download requested. Check your Downloads folder.");
          status.textContent = backupSummary(preferences).text;
        },
        "primary",
      ),
    );
    const file = field(content, "importBackup", "file");
    file.accept = ".json,application/json";
    const preview = el("section", undefined, "card");
    content.append(preview);
    file.onchange = async () => {
      preview.replaceChildren();
      try {
        const selected = file.files[0];
        if (!selected || selected.size > MAX_BACKUP) throw Error("size");
        const data = parseBackup(await selected.text());
        preview.append(
          el("h3", t("backupReady")),
          el(
            "p",
            data.stores.vehicles.length +
              " " +
              t("vehicles") +
              " · " +
              Object.values(data.stores).reduce(
                (n, rows) => n + rows.length,
                0,
              ) +
              " " +
              t("records"),
          ),
          action(
            t("restore"),
            async () => {
              if (!confirm(t("restoreConfirm"))) return;
              await restore(db, data);
              const prefs =
                data.stores.settings.find((row) => row.id === "preferences")
                  ?.values || {};
              state.flash = "restored";
              await onPreferences(prefs, true);
              await onChange();
            },
            "danger",
          ),
        );
      } catch {
        message("invalidBackup", true);
      }
    };
  }
  async function settings() {
    const f = el("form", undefined, "card settings-grid");
    const prefs = readPreferences(preferences);
    const groups = [
      ["Appearance", ["theme", "accent", "surface", "background", "motion"]],
      [
        "Units & formats",
        ["distance", "volume", "consumption", "currency", "dateFormat"],
      ],
      ["New vehicle defaults", ["defaultFuel", "defaultBody"]],
    ];
    for (const [title, keys] of groups) {
      const group = el("fieldset", undefined, "settings-section");
      group.append(el("legend", title));
      for (const key of keys) {
        const values = preferenceOptions[key];
        if (["accent", "surface", "background"].includes(key)) {
          const picker = el("fieldset", undefined, "appearance-picker");
          picker.append(
            el(
              "legend",
              {
                accent: "Accent color",
                surface: "Surface palette",
                background: "Background finish",
              }[key],
            ),
          );
          const choices = el("div", undefined, "appearance-choices");
          for (const value of values) {
            const label = el("label", undefined, "appearance-choice");
            const radio = el("input");
            radio.type = "radio";
            radio.name = key;
            radio.value = value;
            radio.checked = prefs[key] === value;
            const swatch = el("span", undefined, "appearance-swatch");
            swatch.dataset.choice = value;
            label.append(
              radio,
              swatch,
              el("span", value[0].toUpperCase() + value.slice(1)),
            );
            choices.append(label);
          }
          picker.append(choices);
          group.append(picker);
          continue;
        }
        field(
          group,
          key,
          "",
          prefs[key],
          values.map((v) => [v, t(v)]),
        );
      }
      f.append(group);
    }
    const preview = el("section", undefined, "appearance-preview");
    preview.setAttribute("aria-label", "Appearance preview");
    preview.append(
      el("span", "YOUR PERSONAL COCKPIT", "eyebrow"),
      el("h3", "Make every journey yours."),
    );
    const sample = el("button", "Primary action");
    sample.type = "button";
    sample.dataset.tone = "primary";
    preview.append(
      sample,
      el("p", "Preview your colors here. Save to apply them across AutoLog."),
    );
    const refreshPreview = () => {
      const values = Object.fromEntries(new FormData(f));
      for (const key of ["theme", "accent", "surface", "background"])
        preview.dataset[key] =
          values[key] === "system"
            ? document.documentElement.dataset.theme
            : values[key];
    };
    f.addEventListener("change", refreshPreview);
    f.prepend(preview);
    refreshPreview();
    const submit = el("button", t("save"));
    submit.type = "submit";
    f.append(submit);
    content.append(
      el(
        "p",
        "Choose your colors, then save. Your records stay unchanged.",
        "muted",
      ),
      f,
    );
    f.onsubmit = async (e) => {
      e.preventDefault();
      submit.disabled = true;
      try {
        const values = {
          ...Object.fromEntries(new FormData(f)),
          language: "en",
        };
        await writeRow(db, "settings", { id: "preferences", values });
        state.flash = "saved";
        await onPreferences(values);
      } catch {
        message("error", true);
      } finally {
        submit.disabled = false;
      }
    };
    const privacy = el("section", undefined, "card");
    privacy.append(el("h3", t("privacy")), el("p", t("privacyHelp")));
    content.append(privacy);
    try {
      const estimate = await navigator.storage?.estimate?.();
      privacy.append(
        el(
          "p",
          estimate
            ? t("storage") +
                ": " +
                (estimate.usage / 1024 / 1024).toFixed(1) +
                " MiB / " +
                (estimate.quota / 1024 / 1024).toFixed(1) +
                " MiB"
            : t("unavailable"),
        ),
      );
    } catch {
      privacy.append(el("p", t("unavailable")));
    }
    privacy.append(
      action(t("persist"), async () =>
        message(
          (await navigator.storage?.persist?.())
            ? "persistent"
            : "notPersistent",
        ),
      ),
      el("p", t("installHelp")),
      el("p", t("updateHelp")),
      action(t("update"), async () => {
        const reg = await navigator.serviceWorker?.getRegistration();
        if (!reg) {
          message("unavailable");
          return;
        }
        try {
          await reg.update();
          if (reg.waiting) {
            window.dispatchEvent(new Event("autolog-update"));
          } else {
            message("updateChecked");
          }
        } catch {
          message(
            "Update check failed. Reconnect to the internet and try again.",
            true,
          );
        }
      }),
    );
  }
  let generation = 0;
  async function draw() {
    generation++;
    content.replaceChildren();
    const descriptions = {
      history: [
        "Vehicle history",
        "Search services, fill-ups, expenses and receipts together.",
      ],
      settings: ["Settings", "Make AutoLog work the way you do."],
      documents: ["Documents", "Keep the paperwork with the vehicle."],
      reports: [
        "Statistics & reports",
        "Your recorded ownership history, ready to review or export.",
      ],
      trips: [
        "Trip preparation",
        "Prepare for the road and export your upcoming reminders.",
      ],
      backup: [
        "Backup & restore",
        "Keep a portable copy of the records stored on this device.",
      ],
    };
    const [title, description] =
      descriptions[state.tab] || descriptions.settings;
    const heading = el("header", undefined, "page-banner");
    heading.append(el("h3", title), el("p", description, "muted"));
    content.append(heading);
    notice.textContent = state.flash ? t(state.flash) : "";
    delete state.flash;
    for (const b of nav.children)
      b.setAttribute("aria-pressed", String(b.dataset.tab === state.tab));
    if (state.tab === "backup") await backup();
    else if (state.tab === "settings") await settings();
    else {
      const vehicle = vehicleSelect();
      if (!vehicle) return;
      if (state.tab === "documents") await documents(vehicle);
      else if (state.tab === "reports") reports(vehicle);
      else if (state.tab === "history") {
        const request = generation;
        const documents = await list(db, "attachments");
        if (request === generation)
          content.append(
            historyPanel({ vehicle, services, fuel, expenses, documents }),
          );
      } else {
        await trips(vehicle);
        if (state.addTrip) {
          delete state.addTrip;
          checklistForm(vehicle);
        }
      }
    }
  }
  state.tab ||= "settings";
  for (const key of [
    "settings",
    "history",
    "documents",
    "reports",
    "trips",
    "backup",
  ]) {
    const b = action(t(key), async () => {
      if (onDestination) onDestination(key);
      else {
        state.tab = key;
        await draw();
      }
    });
    b.dataset.tab = key;
    nav.append(b);
  }
  if (onProfile) nav.append(action("Profile", onProfile));
  if (onGarage) nav.append(action("Garage", onGarage));
  draw().catch(() => message("error", true));
  return root;
}
