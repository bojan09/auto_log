// Visual viewport support for browsers whose keyboard overlays the layout viewport.
// Pinch zoom is intentionally excluded so zooming does not resize the interface.
export function setupMobileViewport() {
  const viewport = window.visualViewport;
  if (!viewport) return;
  const root = document.documentElement;
  let frame;
  const update = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const unzoomed = Math.abs(viewport.scale - 1) < 0.05;
      root.toggleAttribute(
        "data-short-viewport",
        unzoomed && viewport.height < 500,
      );
      root.style.setProperty(
        "--visible-height",
        (unzoomed ? viewport.height : innerHeight) + "px",
      );
      root.style.setProperty(
        "--keyboard-inset",
        (unzoomed
          ? Math.max(0, innerHeight - viewport.height - viewport.offsetTop)
          : 0) + "px",
      );
      const active = document.activeElement;
      const body = active?.closest(".vehicle-editor-body, .record-editor-body");
      if (unzoomed && body && active.matches("input, select, textarea")) {
        const fieldRect = active.getBoundingClientRect(),
          bodyRect = body.getBoundingClientRect();
        if (fieldRect.top < bodyRect.top || fieldRect.bottom > bodyRect.bottom)
          active.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    });
  };
  document.addEventListener("focusin", update);
  viewport.addEventListener("resize", update);
  viewport.addEventListener("scroll", update);
  window.addEventListener("orientationchange", update);
  update();
}
