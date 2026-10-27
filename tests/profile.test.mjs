import { test } from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { openDatabase } from "../src/storage.js";
import {
  validateProfile,
  writeRow,
  snapshot,
  restore,
  parseBackup,
  defaults,
} from "../src/vault.js";
import { list } from "../src/maintenance.js";
test("profile survives full backup and restore independently of app preferences", async () => {
  const db = await openDatabase(new IDBFactory());
  const profile = {
    displayName: "Alex Driver",
    bio: "Weekend mountain drives.",
    avatar: "",
  };
  await writeRow(db, "settings", { id: "profile", values: profile });
  const backup = await snapshot(db, { ...defaults, theme: "light" });
  assert.deepEqual(
    backup.stores.settings.find((r) => r.id === "profile").values,
    profile,
  );
  assert.equal(
    backup.stores.settings.find((r) => r.id === "preferences").values.theme,
    "light",
  );
  await restore(db, parseBackup(JSON.stringify(backup)));
  assert.deepEqual(
    (await list(db, "settings")).find((r) => r.id === "profile").values,
    profile,
  );
  const legacy = structuredClone(backup);
  legacy.stores.settings = legacy.stores.settings.filter(
    (r) => r.id !== "profile",
  );
  await restore(db, legacy);
  assert.equal(
    (await list(db, "settings")).some((r) => r.id === "profile"),
    false,
  );
  db.close();
});
test("profile validation rejects remote/executable/spoofed photos and excessive fields", () => {
  const profile = { displayName: "Alex", bio: "", avatar: "" };
  assert.deepEqual(validateProfile(profile), profile);
  for (const patch of [
    { avatar: "https://example.com/avatar.png" },
    { avatar: "data:image/svg+xml;base64,PHN2Zz4=" },
    { avatar: "data:image/png;base64,PHNjcmlwdD4=" },
    { avatar: "data:image/png;base64," + "A".repeat(512 * 1024) },
    { displayName: "x".repeat(61) },
    { bio: "x".repeat(201) },
    { email: "not supported" },
    { avatar: null },
  ])
    assert.throws(() => validateProfile({ ...profile, ...patch }));
});
