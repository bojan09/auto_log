# Phase 7 — mobile compatibility (2.5)

Implemented:
- 44px touch targets for editor close, profile, vehicle-menu, service and hotspot actions.
- 16px input text on coarse-pointer devices, including landscape layouts.
- Display-cutout padding and scroll clearance above the floating dock.
- Visual-viewport sizing for phone dialogs when the on-screen keyboard overlays the layout viewport.
- Compact editor headers in short viewports; focused fields scroll into the visible form area.
- Background scrolling is locked while a native dialog is open.

Verified in Chromium: touch-context portrait/landscape, 390×360 short viewport, visible focused inputs and footer, value retention through resizing, simulated visual-viewport keyboard/zoom events, offline quick add, and existing responsive/accessibility/update regressions. The simulation does not exercise a real OS keyboard.

Still requires physical devices: iOS Safari keyboard open/close and pinch zoom, Android Chrome keyboard resizing, installed-PWA launch, real notch/home-indicator spacing, camera/photo selection and calendar/backup download handling. Firefox and WebKit runtimes are unavailable in this environment. No physical-device or cross-engine pass is claimed.
