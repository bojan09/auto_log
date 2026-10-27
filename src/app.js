import { openVehicleDetails } from "./vehicle-details.js";
import { setupVehicleEditor } from "./entry-forms.js";
import { profilePanel, avatarButton } from "./profile.js";
import { renderTopbar, setupTopbar } from "./topbar.js";
import { layoutText, quickActions, dashboardOverview } from "./dashboard.js";
import { morePanel, applyAppearance } from "./vault-ui.js";
import { readPreferences, defaults } from "./vault.js";
import { visualAsset, hotspots, setupMotion } from "./visuals.js";
import { financePanel } from "./finance-ui.js";
import { list, dueStatus, compareDue } from "./maintenance.js";
import { maintenancePanel } from "./maintenance-ui.js";
import { openDatabase, saveVehicle } from "./storage.js";
import { messages } from "./i18n.js";

const financeStates = {};
const moreState = {};
let pendingEditor = null;
setupTopbar();
const transientPreferences = new Map();
const preferences = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return transientPreferences.get(key) ?? null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      transientPreferences.set(key, value);
    }
  },
};
const applyMotion = setupMotion(preferences);
applyAppearance(preferences);
matchMedia("(prefers-color-scheme: light)").addEventListener("change", () =>
  applyAppearance(preferences),
);
let language = "en",
  view = "garage",
  vehicles = [],
  schedules = [],
  records = [],
  fuel = [],
  expenses = [],
  profile = {},
  selected = preferences.getItem("selected");
const app = document.querySelector("#app"),
  dialog = document.querySelector("dialog"),
  form = document.querySelector("form");
const t = (k) => messages[language][k];
const vehicleEditor = setupVehicleEditor({ form, dialog });

preferences.setItem("language", language);
const db = await openDatabase();
// IndexedDB also retains preferences when browser policy blocks localStorage.
const retained = (await list(db, "settings")).find(
  (row) => row.id === "preferences",
)?.values;
if (retained)
  for (const key of Object.keys(defaults))
    if (preferences.getItem(key) === null && typeof retained[key] === "string")
      preferences.setItem(key, retained[key]);
applyAppearance(preferences);
applyMotion();
function store(value) {
  return saveVehicle(db, value);
}
async function load() {
  vehicles = await new Promise((resolve, reject) => {
    const r = db.transaction("vehicles").objectStore("vehicles").getAll();
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  let settings;
  [schedules, records, fuel, expenses, settings] = await Promise.all([
    list(db, "serviceSchedules"),
    list(db, "serviceRecords"),
    list(db, "fuelEntries"),
    list(db, "expenseEntries"),
    list(db, "settings"),
  ]);
  profile = settings.find((row) => row.id === "profile")?.values || {};
  render();
}
function node(tag, text, cls) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
function button(text, action, tone = "secondary") {
  const b = node("button", text);
  b.dataset.tone = tone;
  b.onclick = (event) =>
    Promise.resolve()
      .then(() => action(event))
      .catch(() => {
        const notice = node("p", t("actionFailed"));
        notice.setAttribute("role", "alert");
        app.prepend(notice);
      });
  return b;
}
function edit(v = {}) {
  form.reset();
  document.querySelector("#error").textContent = "";
  for (const el of form.elements)
    if (el.name && el.type !== "file" && el.type !== "checkbox")
      el.value =
        v[el.name] ??
        ({
          bodyStyle: readPreferences(preferences).defaultBody,
          unit: readPreferences(preferences).distance,
          fuel: readPreferences(preferences).defaultFuel,
          currency: readPreferences(preferences).currency,
        }[el.name] ||
          "");
  document.querySelector("#form-title").textContent = v.id
    ? t("edit")
    : t("add");
  vehicleEditor.open(v);
  dialog.showModal();
  vehicleEditor.focus();
}
function render() {
  document.body.dataset.view = view;
  localize();
  document.documentElement.lang = language === "mk" ? "mk" : "en";

  document.querySelectorAll("nav [data-view]").forEach((b) => {
    b.replaceChildren();
    b.setAttribute("aria-label", t(b.dataset.view));
    b.append(node("span", t(b.dataset.view), "nav-label"));
    const short = {
      en: { dashboard: "Home", fuel: "Fuel" },
    };
    const compact = node(
      "span",
      short[language][b.dataset.view] || t(b.dataset.view),
      "nav-label-mobile",
    );
    compact.setAttribute("aria-hidden", "true");
    b.append(compact);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("nav-icon");
    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute(
      "d",
      {
        dashboard: "M3 11 12 3 21 11 M5 10v11h14V10 M10 21v-7h4v7",
        garage: "M3 15h18l-2-7H5z M5 15v5 M19 15v5 M6 11h12",
        services: "M14 3a6 6 0 0 0-7 7L2 18l4 4 8-8a6 6 0 0 0 7-7l-4 4-4-4z",
        fuel: "M4 21V3h10v18 M4 9h10 M14 12h3v6h3V7l-3-3",
        more: "M4 12h2 M11 12h2 M18 12h2",
      }[b.dataset.view],
    );
    svg.append(path);
    b.prepend(svg);
    b.setAttribute("aria-current", view === b.dataset.view ? "page" : "false");
  });
  const current =
    vehicles.find((v) => v.id === selected && !v.archived) ||
    vehicles.find((v) => !v.archived);
  const openProfile = () => {
    if (view === "profile") return;
    view = "profile";
    render();
  };
  renderTopbar({
    profile,
    onDestination: (key) => {
      if (key === "expenses") {
        view = "fuel";
        if (current)
          Object.assign((financeStates[current.id] ??= {}), {
            category: "all",
            workspace: "expenses",
          });
      } else if (key === "reminders") view = "services";
      else {
        view = "more";
        moreState.tab = key;
      }
      render();
      if (key === "expenses")
        document
          .querySelector(".ledger-heading")
          ?.scrollIntoView({ block: "start" });
    },
    onProfile: openProfile,
    vehicles,
    current,
    viewLabel: t(view),
    language,
    onSelect: (id) => {
      selected = id;
      preferences.setItem("selected", id);
      view = "dashboard";
      render();
    },
    onGarage: () => {
      view = "garage";
      render();
    },
    onTool: (key) => {
      moreState.tab = key;
      view = "more";
      render();
    },
    onTheme: () => {
      preferences.setItem(
        "theme",
        document.documentElement.dataset.theme === "dark" ? "light" : "dark",
      );
      applyAppearance(preferences);
    },
  });
  app.replaceChildren();
  const heading = node("div", undefined, "heading");
  heading.append(node("h2", t(view)));
  if (view === "garage") heading.append(button("+ " + t("add"), () => edit()));
  heading.append(
    avatarButton(profile, openProfile, "profile-trigger mobile-profile"),
  );
  app.append(heading);
  if (view === "profile") {
    app.append(
      profilePanel({
        db,
        profile,
        onSave: load,
        onSettings: () => {
          view = "more";
          moreState.tab = "settings";
          render();
        },
      }),
    );
    return;
  }
  if (view === "more") {
    app.append(
      morePanel({
        db,
        vehicles,
        services: records,
        fuel,
        expenses,
        schedules,
        language,
        preferences,
        state: moreState,
        onProfile: openProfile,
        onGarage: () => {
          view = "garage";
          render();
        },
        onChange: load,
        onPreferences: async (values, replace = false) => {
          for (const [key, value] of Object.entries(
            replace ? { ...defaults, ...values } : values,
          ))
            preferences.setItem(key, value);
          language = "en";
          preferences.setItem("language", "en");
          applyMotion();
          applyAppearance(preferences);
          for (const key of Object.keys(financeStates))
            delete financeStates[key];
          if (!replace) render();
        },
      }),
    );
    return;
  }
  if (!vehicles.length) {
    const c = node("section", undefined, "hero empty-garage");
    const copy = node("div", undefined, "empty-copy");
    copy.append(
      node("p", "MORE ROAD. LESS WORRY.", "eyebrow"),
      node("h2", "A good journey starts here."),
      node(
        "p",
        "Every service, fill-up and mile. A clear history for the vehicles you care about.",
        "empty-description",
      ),
      button("Add your first vehicle", () => edit(), "primary"),
      node("p", "Private by design. Saved on this device.", "empty-privacy"),
    );
    const illustration = node("figure", undefined, "empty-art");
    const img = node("img");
    img.src = "assets/crossover-studio.webp";
    img.alt = "Generic crossover illustration";
    illustration.append(img, node("figcaption", "Body-style illustration"));
    c.append(copy, illustration);
    app.append(c);
    return;
  }
  const initialAction = pendingEditor;
  pendingEditor = null;
  const panel = (summary = false) =>
    maintenancePanel({
      initialAction: summary ? null : initialAction,
      db,
      vehicle: current,
      vehicles,
      schedules,
      records,
      language,
      onChange: load,
      onSelect: (id) => {
        selected = id;
        preferences.setItem("selected", id);
        render();
      },
      summary,
    });
  const finance = (summary = false) =>
    financePanel({
      initialAction: summary ? null : initialAction,
      db,
      preferences: readPreferences(preferences),
      vehicle: current,
      vehicles,
      fuel,
      expenses,
      services: records,
      language,
      onChange: load,
      onSelect: (id) => {
        selected = id;
        preferences.setItem("selected", id);
        render();
      },
      onServices: () => {
        view = "services";
        render();
      },
      summary,
      state: (financeStates[current?.id] ??= {}),
    });
  if (view === "fuel") {
    app.append(finance());
    return;
  }
  if (view === "services") {
    app.append(panel());
    return;
  }
  if (view === "dashboard" && current) {
    const hero = node("section", undefined, "hero vehicle-hero");
    const copy = node("div", undefined, "hero-copy");
    copy.append(
      node("p", "YOUR ACTIVE VEHICLE", "eyebrow"),
      node("h2", current.make + " " + current.model),
      node(
        "p",
        current.year + " · " + current.variant,
        "vehicle-specification",
      ),
    );
    const manage = button("Manage vehicle", () => edit(current), "primary");
    manage.classList.add("manage-vehicle");
    manage.setAttribute("aria-label", "Manage vehicle");
    manage.title = "Manage vehicle";
    const pencil = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    pencil.setAttribute("viewBox", "0 0 24 24");
    pencil.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(pencil.namespaceURI, "path");
    path.setAttribute("d", "m15 5 4 4 M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15z");
    pencil.append(path);
    manage.replaceChildren(
      pencil,
      node("span", "Manage vehicle", "manage-label"),
    );
    hero.append(
      copy,
      art(current),
      hotspots(current, records, language),
      manage,
    );
    const switcher = node("select");
    switcher.setAttribute("aria-label", t("switchVehicle"));
    for (const vehicle of vehicles.filter((v) => !v.archived)) {
      const option = node("option", vehicle.make + " " + vehicle.model);
      option.value = vehicle.id;
      option.selected = vehicle.id === current.id;
      switcher.append(option);
    }
    switcher.onchange = () => {
      selected = switcher.value;
      preferences.setItem("selected", selected);
      render();
    };
    switcher.className = "dashboard-switcher";
    heading.append(switcher);
    const top = node("div", undefined, "dashboard-top");
    app.append(top);
    const showcase = node("div", undefined, "showcase");
    const greeting = node("div", undefined, "showcase-greeting");
    greeting.append(
      node(
        "h3",
        "Good " +
          (new Date().getHours() < 12
            ? "morning"
            : new Date().getHours() < 18
              ? "afternoon"
              : "evening") +
          (profile.displayName ? ", " + profile.displayName : "") +
          ".",
      ),
      node(
        "p",
        "Your " + current.make + " " + current.model + ", ready for the road.",
      ),
    );
    showcase.append(greeting, hero);
    top.append(showcase);
    const grid = node("div", undefined, "dashboard-status");
    const upcoming = schedules
      .filter((s) => s.vehicleId === current.id)
      .map((s) => ({ s, d: dueStatus(s, current, records) }))
      .sort(compareDue)[0];
    for (const [title, value] of [
      [
        t("mileage"),
        new Intl.NumberFormat(language === "mk" ? "mk-MK" : "en").format(
          current.odometer,
        ) +
          " " +
          (current.unit || "km"),
      ],
      [t("next"), upcoming?.s.title || layoutText[language].noSchedule],
    ]) {
      const c = node("section", undefined, "card");
      c.append(node("h3", title), node("p", value));
      if (title === t("next") && upcoming) {
        const parts = [];
        if (Number.isFinite(upcoming.d.remaining))
          parts.push(
            new Intl.NumberFormat(language === "mk" ? "mk-MK" : "en", {
              maximumFractionDigits: 0,
            }).format(Math.abs(upcoming.d.remaining)) +
              " " +
              upcoming.s.unit +
              " " +
              layoutText[language][
                upcoming.d.remaining < 0 ? "overdue" : "remaining"
              ],
          );
        if (upcoming.d.dueDate) parts.push(upcoming.d.dueDate);
        c.append(node("p", parts.join(" · "), "next-detail"));
      }
      if (title === t("next"))
        c.append(
          button("View maintenance", () => {
            view = "services";
            render();
          }),
        );
      grid.append(c);
    }
    top.append(grid);
    app.append(
      quickActions(language, (kind) => {
        if (kind === "trip") {
          view = "more";
          moreState.tab = "trips";
          moreState.vehicleId = current.id;
          moreState.addTrip = true;
        } else {
          view = kind === "service" ? "services" : "fuel";
          pendingEditor = kind === "service" ? "record" : kind;
        }
        render();
      }),
    );
    app.append(
      dashboardOverview({
        vehicle: current,
        vehicles,
        fuel,
        expenses,
        records,
        schedules,
        language,
        preferences: readPreferences(preferences),
        onFinance: () => {
          view = "fuel";
          render();
        },
      }),
    );
    const reminders = node("details", undefined, "dashboard-reminders");
    reminders.append(
      node("summary", layoutText[language].reminders),
      panel(true),
    );
    app.append(reminders);
    const history = node("details", undefined, "card");
    history.append(node("summary", t("mileageHistory")));
    for (const entry of current.odometerHistory || []) {
      history.append(
        node(
          "p",
          new Intl.DateTimeFormat(language === "mk" ? "mk-MK" : "en").format(
            new Date(entry.at),
          ) +
            " · " +
            entry.value +
            " " +
            (entry.unit || "km"),
        ),
      );
    }
    app.append(history);
    return;
  }
  const grid = node("div", undefined, "grid");
  for (const v of vehicles) {
    const c = node("section", undefined, "card garage-card");
    const body = node("div", undefined, "garage-card-body");
    const identity = node("div", undefined, "section-heading");
    identity.append(
      node("h3", v.make + " " + v.model),
      node(
        "span",
        v.archived
          ? t("archived")
          : v.id === current?.id
            ? "Active"
            : String(v.year),
        "status",
      ),
    );
    const specs = node("div", undefined, "vehicle-specs");
    for (const text of [
      String(v.year),
      v.variant,
      new Intl.NumberFormat("en").format(v.odometer) + " " + (v.unit || "km"),
    ])
      if (text) specs.append(node("span", text));
    body.append(identity, specs);
    c.append(art(v), body);
    const a = node("div", undefined, "actions");
    a.append(button(t("edit"), () => edit(v), "quiet"));
    const menu = node("details", undefined, "vehicle-menu");
    const trigger = node("summary", "•••");
    trigger.setAttribute("aria-label", "Vehicle actions");
    const options = node("div", undefined, "dropdown-panel");
    menu.append(trigger, options);
    a.append(menu);
    options.append(
      button(v.archived ? t("restore") : t("archive"), async () => {
        await store({ ...v, archived: !v.archived });
        await load();
      }),
    );
    options.append(
      button(
        t("ui4"),
        async () => {
          if (!confirm(t("ui5"))) return;
          await new Promise((resolve, reject) => {
            const related = [
              "serviceSchedules",
              "serviceRecords",
              "odometerEntries",
              "fuelEntries",
              "expenseEntries",
              "attachments",
              "checklists",
            ];
            const tx = db.transaction(["vehicles", ...related], "readwrite");
            tx.objectStore("vehicles").delete(v.id);
            for (const name of related) {
              const request = tx.objectStore(name).getAll();
              request.onsuccess = () =>
                request.result
                  .filter((row) => row.vehicleId === v.id)
                  .forEach((row) => tx.objectStore(name).delete(row.id));
            }
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
          });
          await load();
        },
        "danger",
      ),
    );
    if (!v.archived)
      a.append(
        button(
          t("select"),
          () => {
            selected = v.id;
            preferences.setItem("selected", selected);
            view = "dashboard";
            render();
          },
          "primary",
        ),
      );
    const details = button(
      "View details",
      () =>
        openVehicleDetails({
          vehicle: v,
          records,
          fuel,
          expenses,
          onEdit: edit,
        }),
      "quiet",
    );
    body.append(details, a);
    grid.append(c);
  }
  app.append(grid);
}
form.onsubmit = async (e) => {
  e.preventDefault();
  const submit = form.querySelector("[type=submit]");
  if (submit.disabled) return;
  submit.disabled = true;
  const data = Object.fromEntries(new FormData(form));
  try {
    const old = vehicles.find((v) => v.id === data.id);
    if (
      old &&
      (Number(data.odometer) < old.odometer ||
        data.unit !== (old.unit || "km")) &&
      !confirm(t("ui6"))
    )
      return;
    let photo = form.elements.removePhoto.checked ? "" : old?.photo || "";
    const file = form.elements.photo.files[0];
    if (file) {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 5000000
      )
        throw Error("photo");
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const ratio = Math.min(1, 1200 / bitmap.width, 800 / bitmap.height);
      canvas.width = bitmap.width * ratio;
      canvas.height = bitmap.height * ratio;
      canvas
        .getContext("2d")
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      photo = canvas.toDataURL("image/webp", 0.8);
      bitmap.close();
    }
    delete data.photo;
    delete data.removePhoto;
    await store({
      ...old,
      ...data,
      photo,
      id: data.id || crypto.randomUUID(),
      year: Number(data.year),
      odometer: Number(data.odometer),
      odometerHistory: [
        ...(old?.odometerHistory || []),
        {
          value: Number(data.odometer),
          previous: old?.odometer ?? null,
          unit: data.unit,
          at: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    });
    dialog.close();
    await load();
  } catch {
    document.querySelector("#error").textContent = t("ui7");
  } finally {
    submit.disabled = false;
  }
};
document.querySelector("#cancel").onclick = () => dialog.close();
document.querySelectorAll("nav [data-view]").forEach(
  (b) =>
    (b.onclick = () => {
      view = b.dataset.view;
      render();
    }),
);
await load();
if ("serviceWorker" in navigator)
  navigator.serviceWorker
    .register("./sw.js")
    .then((reg) => {
      const notify = () => {
        if (
          !navigator.serviceWorker.controller ||
          document.querySelector("#update-ready")
        )
          return;
        const notice = node("p", t("ui9"));
        notice.id = "update-ready";
        notice.setAttribute("role", "status");
        app.prepend(notice);
      };
      const watch = (worker) => {
        if (!worker) return;
        const check = () => {
          if (worker.state === "installed") notify();
        };
        worker.addEventListener("statechange", check);
        check();
      };
      reg.addEventListener("updatefound", () => watch(reg.installing));
      watch(reg.installing);
      if (reg.waiting) notify();
    })
    .catch(() => {
      const notice = node("p", t("ui10"));
      notice.setAttribute("role", "alert");
      app.prepend(notice);
    });

function art(v) {
  const figure = node("figure", undefined, "vehicle-image");
  const img = node("img");
  img.src = visualAsset(v);
  img.alt = v.photo ? v.make + " " + v.model : t("ui11");
  img.className = "vehicle-art";
  figure.append(img);
  if (!v.photo) figure.append(node("figcaption", t("ui12"), "muted"));
  return figure;
}
function localize() {
  document.querySelector("#services-nav").textContent = t("services");
  document.querySelector("#fuel-nav").textContent = t("fuel");
  document.querySelector("#quick-add").setAttribute("aria-label", t("add"));
  form
    .querySelectorAll("[data-en]")
    .forEach((el) => (el.textContent = el.dataset[language]));
  document.querySelector("#remove-photo-text").textContent = t("ui15");
  document.querySelector("#custom").textContent = t("ui16");
  document.querySelector("#cancel").textContent = t("ui17");
  document.querySelector(".app-context").textContent = t("ui19");
}
const catalog = {
  Fiat: [
    "Sedici",
    "Panda",
    "Punto",
    "Grande Punto",
    "500",
    "Tipo",
    "Bravo",
    "Doblo",
    "Ducato",
  ],
  Ford: ["Focus", "Fiesta", "Mondeo", "Kuga", "Puma", "Transit"],
  Volkswagen: ["Golf", "Polo", "Passat", "Tiguan", "Touran", "Caddy"],
  Audi: ["A3", "A4", "A6", "Q3", "Q5"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "GLA", "GLC", "Sprinter"],
  BMW: ["1 Series", "3 Series", "5 Series", "X1", "X3", "X5", "M4"],
  Peugeot: ["206", "207", "208", "307", "308", "3008", "5008", "Partner"],
};
form.elements.make.addEventListener("input", () => {
  const list = document.querySelector("#models");
  list.replaceChildren();
  for (const model of catalog[
    Object.keys(catalog).find(
      (k) => k.toLowerCase() === form.elements.make.value.toLowerCase(),
    )
  ] || [])
    list.append(node("option", model));
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  const install = button(t("ui21"), async () => {
    await event.prompt();
    install.remove();
  });
  document.querySelector(".app-bar").append(install);
});

document.querySelector("#quick-add").onclick = () => edit();
