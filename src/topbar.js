import { destinations as allDestinations } from "./navigation.js";
import { avatarButton } from "./profile.js";
import { visualAsset } from "./visuals.js";
import { layoutText } from "./dashboard.js";
const el = (tag, text) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  return n;
};
export function renderTopbar({
  vehicles,
  current,
  viewLabel,
  language,
  onSelect,
  onGarage,
  onTool,
  onTheme,
  onProfile,
  profile,
  onDestination,
}) {
  const t = layoutText[language],
    root = document.querySelector("#top-tools");
  root.replaceChildren();
  document.querySelector(".app-context").textContent = viewLabel;
  function menu(label) {
    const d = el("details");
    d.className = "top-menu";
    const s = el("summary");
    s.setAttribute("aria-label", label);
    s.append(
      menuIcon(label === t.vehicles ? "vehicle" : "tools"),
      el("span", label),
    );
    const p = el("div");
    p.className = "dropdown-panel";
    d.append(s, p);
    d.addEventListener("toggle", () => {
      if (d.open)
        for (const other of root.querySelectorAll("details"))
          if (other !== d) other.open = false;
    });
    root.append(d);
    return { d, p };
  }
  function option(menu, label, action) {
    const b = el("button", label);
    b.type = "button";
    b.onclick = () => {
      menu.d.open = false;
      action();
    };
    menu.p.append(b);
    return b;
  }
  const destinations = el("div");
  destinations.className = "workspace-links";
  for (const [key, label] of [
    ["expenses", "Expenses"],
    ["trips", "Trips"],
    ["reports", "Statistics"],
    ["reminders", "Reminders"],
  ]) {
    const b = el("button", label);
    b.type = "button";
    b.onclick = () => onDestination(key);
    destinations.append(b);
  }
  root.append(destinations);
  const cars = menu(t.vehicles);
  for (const v of vehicles.filter((v) => !v.archived)) {
    const b = option(cars, v.make + " " + v.model, () => onSelect(v.id));
    const thumb = el("img");
    thumb.src = visualAsset(v);
    thumb.alt = "";
    thumb.setAttribute("aria-hidden", "true");
    b.prepend(thumb);
    if (v.id === current?.id) b.setAttribute("aria-current", "true");
  }
  option(cars, t.vehicles + " →", onGarage);
  const tools = menu(t.tools);
  for (const [key, label] of allDestinations)
    option(tools, label, () => onDestination(key));
  const theme = el("button");
  theme.type = "button";
  theme.className = "theme-toggle";
  theme.setAttribute("aria-label", t.theme);
  theme.title = t.theme;
  theme.append(menuIcon("theme"));
  theme.onclick = onTheme;
  root.append(theme, avatarButton(profile, onProfile));
}
export function setupTopbar() {
  const dock = document.querySelector(".floating-nav");
  const desktop = matchMedia("(min-width: 701px)");
  const place = () =>
    desktop.matches
      ? document
          .querySelector(".app-bar")
          .insertBefore(dock, document.querySelector("#top-tools"))
      : document.querySelector(".app-bar").after(dock);
  desktop.addEventListener("change", place);
  place();
  document.addEventListener("click", (event) => {
    for (const d of document.querySelectorAll(
      ".top-menu[open], .vehicle-menu[open]",
    ))
      if (!d.contains(event.target)) d.open = false;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const d = document.querySelector(".top-menu[open], .vehicle-menu[open]");
      if (d) {
        d.open = false;
        d.querySelector("summary").focus();
      }
    }
  });
}

function menuIcon(kind) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute(
    "d",
    {
      vehicle: "M3 15h18l-2-7H5z M5 15v5 M19 15v5 M6 11h12",
      tools: "M4 6h16M4 12h16M4 18h16 M8 3v6 M16 9v6 M10 15v6",
      theme:
        "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17m10-10 1.4-1.4 M16 12a4 4 0 1 1-8 0a4 4 0 1 1 8 0",
    }[kind],
  );
  svg.append(path);
  return svg;
}
