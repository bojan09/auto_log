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
}) {
  const t = layoutText[language],
    root = document.querySelector("#top-tools");
  root.replaceChildren();
  document.querySelector(".app-context").textContent = viewLabel;
  function menu(label) {
    const d = el("details");
    d.className = "top-menu";
    const s = el("summary", label);
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
  const cars = menu(t.vehicles);
  for (const v of vehicles.filter((v) => !v.archived)) {
    const b = option(cars, v.make + " " + v.model, () => onSelect(v.id));
    if (v.id === current?.id) b.setAttribute("aria-current", "true");
  }
  option(cars, t.vehicles + " →", onGarage);
  const tools = menu(t.tools);
  for (const key of ["settings", "documents", "reports", "trips", "backup"])
    option(tools, t[key], () => onTool(key));
  const theme = el("button");
  theme.type = "button";
  theme.className = "theme-toggle";
  theme.setAttribute("aria-label", t.theme);
  theme.title = t.theme;
  theme.textContent = "◐";
  theme.onclick = onTheme;
  root.append(theme);
}
export function setupTopbar() {
  document.addEventListener("click", (event) => {
    for (const d of document.querySelectorAll(".top-menu[open]"))
      if (!d.contains(event.target)) d.open = false;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const d = document.querySelector(".top-menu[open]");
      if (d) {
        d.open = false;
        d.querySelector("summary").focus();
      }
    }
  });
}
