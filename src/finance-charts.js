const NS = "http://www.w3.org/2000/svg";
export function chart(kind, points, label, onSelect) {
  const wrap = document.createElement("div");
  wrap.className = "finance-chart";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 320 180");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", label);
  const colors = [
    "#34e5ce",
    "#36b7e9",
    "#efb44f",
    "#ac8cf5",
    "#e86774",
    "#8cbad0",
    "#c1e078",
    "#f2a071",
    "#8dcebd",
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
  if (kind === "line" && points.length) {
    const coords = points.map((p, i) => [
      20 + (i * 280) / Math.max(1, points.length - 1),
      155 - (p.value / max) * 125,
    ]);
    shape("polyline", {
      points: coords.map((p) => p.join(",")).join(" "),
      fill: "none",
      stroke: "#34e5ce",
      "stroke-width": 3,
    });
    coords.forEach(([cx, cy], i) => {
      const dot = shape("circle", { cx, cy, r: 5, fill: "#bafff3" });
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
        fill: "#34e5ce",
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
