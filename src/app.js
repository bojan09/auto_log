import { openDatabase, saveVehicle } from "./storage.js";
import { messages } from "./i18n.js";

const preferences = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};
let language =
    preferences.getItem("language") ||
    (navigator.language.startsWith("mk") ? "mk" : "en"),
  view = "garage",
  vehicles = [],
  selected = preferences.getItem("selected");
const app = document.querySelector("#app"),
  dialog = document.querySelector("dialog"),
  form = document.querySelector("form");
const t = (k) => messages[language][k];
if (!messages[language]) language = "en";
const db = await openDatabase();
function store(value) {
  return saveVehicle(db, value);
}
async function load() {
  vehicles = await new Promise((resolve, reject) => {
    const r = db.transaction("vehicles").objectStore("vehicles").getAll();
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  render();
}
function node(tag, text, cls) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
function button(text, action) {
  const b = node("button", text);
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
        ({ bodyStyle: "crossover", unit: "km", fuel: "other", currency: "MKD" }[
          el.name
        ] ||
          "");
  document.querySelector("#form-title").textContent = v.id
    ? t("edit")
    : t("add");
  dialog.showModal();
}
function render() {
  localize();
  document.documentElement.lang = language === "mk" ? "mk" : "en";
  document.querySelector("#language").textContent = t("ui1");
  document.querySelectorAll("[data-view]").forEach((b) => {
    b.textContent = t(b.dataset.view);
    b.setAttribute("aria-current", view === b.dataset.view ? "page" : "false");
  });
  app.replaceChildren();
  const heading = node("div", undefined, "heading");
  heading.append(
    node("h2", t(view)),
    button("+ " + t("add"), () => edit()),
  );
  app.append(heading);
  if (view === "more") {
    const panel = node("section", undefined, "card");
    panel.append(
      node("h3", t("ui2")),
      node("p", t("ui3")),
      button(t("garage"), () => {
        view = "garage";
        render();
      }),
    );
    app.append(panel);
    return;
  }
  const current =
    vehicles.find((v) => v.id === selected && !v.archived) ||
    vehicles.find((v) => !v.archived);
  if (!vehicles.length) {
    const c = node("section", undefined, "hero");
    c.append(
      node("div", "◇", "car"),
      node("h2", t("empty")),
      node("p", t("intro")),
      node("p", t("custom"), "muted"),
    );
    app.append(c);
    return;
  }
  if (view === "dashboard" && current) {
    const hero = node("section", undefined, "hero vehicle-hero");
    hero.append(
      node("h2", current.make + " " + current.model),
      node("p", current.year + " · " + current.variant),
      art(current),
      button(t("edit"), () => edit(current)),
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
    app.append(switcher, hero);
    const grid = node("div", undefined, "grid");
    for (const [title, value] of [
      [
        t("mileage"),
        new Intl.NumberFormat(language === "mk" ? "mk-MK" : "en").format(
          current.odometer,
        ) +
          " " +
          (current.unit || "km"),
      ],
      [t("next"), t("none")],
      [t("care"), t("insufficient")],
    ]) {
      const c = node("section", undefined, "card");
      c.append(node("h3", title), node("p", value));
      grid.append(c);
    }
    app.append(grid);
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
    const c = node("section", undefined, "card");
    c.append(
      art(v),
      node("h3", v.make + " " + v.model),
      node("p", v.year + " · " + v.variant),
      node(
        "p",
        new Intl.NumberFormat(language === "mk" ? "mk-MK" : "en").format(
          v.odometer,
        ) +
          " " +
          (v.unit || "km"),
      ),
      node("p", v.archived ? t("archived") : ""),
    );
    const a = node("div", undefined, "actions");
    a.append(
      button(t("edit"), () => edit(v)),
      button(v.archived ? t("restore") : t("archive"), async () => {
        await store({ ...v, archived: !v.archived });
        await load();
      }),
    );
    a.append(
      button(t("ui4"), async () => {
        if (!confirm(t("ui5"))) return;
        await new Promise((resolve, reject) => {
          const tx = db.transaction("vehicles", "readwrite");
          tx.objectStore("vehicles").delete(v.id);
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
        await load();
      }),
    );
    if (!v.archived)
      a.append(
        button(t("select"), () => {
          selected = v.id;
          preferences.setItem("selected", selected);
          view = "dashboard";
          render();
        }),
      );
    c.append(a);
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
document.querySelector("#language").onclick = () => {
  language = t("ui8");
  preferences.setItem("language", language);
  render();
};
document.querySelectorAll("[data-view]").forEach(
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
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        worker.addEventListener("statechange", () => {
          if (
            worker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            const notice = node("p", t("ui9"));
            notice.setAttribute("role", "status");
            app.prepend(notice);
          }
        });
      });
    })
    .catch(() => {
      const notice = node("p", t("ui10"));
      notice.setAttribute("role", "alert");
      app.prepend(notice);
    });

function art(v) {
  const figure = node("figure");
  const img = node("img");
  img.src =
    v.photo || "assets/vehicle-" + (v.bodyStyle || "crossover") + ".svg";
  img.alt = v.photo ? v.make + " " + v.model : t("ui11");
  img.className = "vehicle-art";
  figure.append(img);
  if (!v.photo) figure.append(node("figcaption", t("ui12"), "muted"));
  return figure;
}
function localize() {
  document.querySelector("#services-nav").textContent = t("ui13");
  document.querySelector("#fuel-nav").textContent = t("ui14");
  document.querySelector("#quick-add").setAttribute("aria-label", t("add"));
  const labels =
    language === "en"
      ? [
          "Make",
          "Model",
          "Year",
          "Engine, fuel and drivetrain",
          "Odometer",
          "Vehicle photo (JPEG, PNG or WebP; up to 5 MB)",
          "Body style",
          "Nickname",
          "License plate (optional)",
          "Notes",
          "Distance unit",
          "Fuel type",
          "Purchase date (optional)",
          "Purchase price (optional)",
          "Currency (e.g. MKD or EUR)",
          "Color (optional)",
        ]
      : [
          "Производител",
          "Модел",
          "Година",
          "Мотор, гориво и погон",
          "Километража",
          "Фотографија (JPEG, PNG или WebP; до 5 MB)",
          "Каросерија",
          "Прекар",
          "Регистарска табличка (незадолжително)",
          "Белешки",
          "Единица за растојание",
          "Вид гориво",
          "Датум на купување (незадолжително)",
          "Куповна цена (незадолжително)",
          "Валута (на пр. MKD или EUR)",
          "Боја (незадолжително)",
        ];
  document.querySelectorAll("form label:not(.checkbox)").forEach((label, i) => {
    if (labels[i]) label.firstChild.textContent = labels[i];
  });
  form
    .querySelectorAll("[data-en]")
    .forEach((el) => (el.textContent = el.dataset[language]));
  document.querySelector("#remove-photo-text").textContent = t("ui15");
  document.querySelector("#custom").textContent = t("ui16");
  document.querySelector("#cancel").textContent = t("ui17");
  form.querySelector("[type=submit]").textContent = t("ui18");
  document.querySelector("header small").textContent = t("ui19");
  document.querySelector("aside p").textContent = t("ui20");
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
  document.querySelector("aside").append(install);
});

document.querySelector("#quick-add").onclick = () => edit();
