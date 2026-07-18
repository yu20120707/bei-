import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadStoredState, saveStoredState } from "./state-store.js";

test("migrates the old shared application state only when the new state is absent", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "word-trainer-state-"));
  const currentPath = path.join(directory, "new", "word-trainer-state.json");
  const legacyPath = path.join(directory, "old", "word-trainer-state.json");
  try {
    await saveStoredState(legacyPath, { progress: { legacy: { correct: 2 } } });
    assert.deepEqual(await loadStoredState(currentPath, legacyPath), {
      state: { progress: { legacy: { correct: 2 } } }, migrated: true,
    });
    await saveStoredState(currentPath, { progress: { new: { correct: 3 } } });
    assert.deepEqual(await loadStoredState(currentPath, legacyPath), {
      state: { progress: { new: { correct: 3 } } }, migrated: false,
    });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
