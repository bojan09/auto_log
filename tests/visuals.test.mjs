import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bodyStyle,
  visualAsset,
  compliance,
  effectiveMotion,
  visualText,
} from "../src/visuals.js";
test("vehicle renderer selects appropriate body types and gives owner photos priority", () => {
  for (const [make, model, style] of [
    ["Fiat", "Sedici", "crossover"],
    ["Volkswagen", "Golf", "hatchback"],
    ["Ford", "Focus", "hatchback"],
    ["Audi", "A4", "sedan"],
    ["Mercedes-Benz", "C-Class", "sedan"],
    ["BMW", "3 Series", "sedan"],
    ["Peugeot", "308", "hatchback"],
  ])
    assert.equal(bodyStyle({ make, model }), style);
  assert.notEqual(
    visualAsset({ make: "Fiat", model: "Sedici" }),
    visualAsset({ make: "Volkswagen", model: "Golf" }),
  );
  assert.equal(
    visualAsset({ photo: "data:image/png;base64,user" }),
    "data:image/png;base64,user",
  );
});
test("compliance exposes contributing counts, no-data state and vehicle isolation", () => {
  const v = { id: "a", odometer: 100, unit: "km" };
  const base = {
    vehicleId: "a",
    baseDate: "2026-01-01",
    baseOdometer: 0,
    distance: 200,
    months: 0,
    warnDistance: 20,
    warnDays: 0,
    unit: "km",
  };
  assert.equal(compliance(v, [], [], "2026-01-01").score, null);
  const score = compliance(
    v,
    [
      { ...base, id: "1" },
      { ...base, id: "2", distance: 50 },
      { ...base, id: "3", vehicleId: "other" },
    ],
    [],
    "2026-01-01",
  );
  assert.equal(score.score, 50);
  assert.equal(score.total, 2);
  assert.equal(score.current, 1);
});
test("system reduced-motion and resource constraints override enhanced motion", () => {
  assert.equal(effectiveMotion("enhanced", true), "reduced");
  assert.equal(effectiveMotion("enhanced", false, true), "reduced");
  assert.equal(effectiveMotion("enhanced", false), "enhanced");
  assert.deepEqual(
    Object.keys(visualText.en).sort(),
    Object.keys(visualText.mk).sort(),
  );
});
