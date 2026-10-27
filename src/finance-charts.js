let chartSequence = 0;
const NS = "http://www.w3.org/2000/svg";
export function chart(kind, points, label, onSelect) {
  const wrap = document.createElement("div");
  wrap.className = "finance-chart";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 320 180");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", label);
  const colors = [
    "#87aa98",
    "#789ab0",
    "#b49a72",
    "#9b9eab",
    "#b97f7f",
    "#8a9da7",
    "#9da883",
    "#b0957b",
    "#84a69b",
    "#98aeb5",
  ];
  const max = Math.max(1, ...points.map((p) => p.value));
  const sum = points.reduce((n, p) => n + p.value, 0);
  function shape(tag, attrs) {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    svg.append(n);
    return n;
  }
  const chartId = "chart-fill-" + ++chartSequence;
  const defs = document.createElementNS(NS, "defs");
  const gradient = document.createElementNS(NS, "linearGradient");
  gradient.id = chartId;
  gradient.setAttribute("x1", "0");
  gradient.setAttribute("y1", "0");
  gradient.setAttribute("x2", "0");
  gradient.setAttribute("y2", "1");
  for (const [offset, opacity] of [
    ["0%", ".32"],
    ["100%", "0"],
  ]) {
    const stop = document.createElementNS(NS, "stop");
    stop.setAttribute("offset", offset);
    stop.setAttribute("stop-color", kind === "line" ? "#789ab0" : "#789ab0");
    stop.setAttribute("stop-opacity", opacity);
    gradient.append(stop);
  }
  defs.append(gradient);
  svg.append(defs);
  if (kind !== "donut")
    for (const y of [35, 75, 115, 155])
      shape("line", {
        x1: 15,
        y1: y,
        x2: 305,
        y2: y,
        stroke: "currentColor",
        "stroke-opacity": 0.08,
        "stroke-width": 1,
      });
  if (kind === "line" && points.length) {
    const coords = points.map((p, i) => [
      20 + (i * 280) / Math.max(1, points.length - 1),
      155 - (p.value / max) * 125,
    ]);
    if (coords.length > 1)
      shape("polygon", {
        points: `${coords[0][0]},160 ${coords.map((p) => p.join(",")).join(" ")} ${coords.at(-1)[0]},160`,
        fill: "#507b9818",
      });
    shape("polyline", {
      points: coords.map((p) => p.join(",")).join(" "),
      fill: "none",
      stroke: "#8eb0c5",
      "stroke-width": 3,
    });
    coords.forEach(([cx, cy], i) => {
      const dot = shape("circle", { cx, cy, r: 3.5, fill: "#b4cad7" });
      const title = document.createElementNS(NS, "title");
      title.textContent = points[i].label;
      dot.append(title);
    });
  }
  if (kind === "bar")
    points.forEach((p, i) =>
      shape("rect", {
        x: 15 + (i * 290) / points.length,
        y: 160 - (p.value / max) * 130,
        width: Math.max(1, 260 / points.length),
        height: (p.value / max) * 130,
        rx: 3,
        fill: "#507b98",
      }),
    );
  if (kind === "donut" && sum > 0) {
    let offset = 0;
    points.forEach((p, i) => {
      const part = (p.value / sum) * 100;
      shape("circle", {
        cx: 160,
        cy: 90,
        r: 60,
        fill: "none",
        stroke: colors[i % colors.length],
        "stroke-width": 25,
        pathLength: 100,
        "stroke-dasharray": `${part} ${100 - part}`,
        "stroke-dashoffset": -offset,
        transform: "rotate(-90 160 90)",
      });
      offset += part;
    });
  }
  wrap.append(svg);
  const legend = document.createElement("div");
  legend.className = "chart-points";
  points.forEach((p, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = p.label;
    button.onclick = () => onSelect(p);
    button.style.borderLeftColor =
      colors[kind === "donut" ? i % colors.length : 0];
    legend.append(button);
  });
  wrap.append(legend);
  return wrap;
}
