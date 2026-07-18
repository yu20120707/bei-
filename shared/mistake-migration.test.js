import test from "node:test";
import assert from "node:assert/strict";
import { migratePausedSessionMistakes } from "./mistake-migration.js";

test("imports wrong answers preserved in an old paused normal session", () => {
  const state = {
    decks: [{ id: "deck", words: [{ id: "one", word: "peace", definition: "和平" }] }],
    sessions: { deck: { wrongWords: [{ word: "peace", definition: "和平" }] } },
  };
  assert.equal(migratePausedSessionMistakes(state), true);
  assert.deepEqual(state.mistakes, { deck: { one: { streak: 0 } } });
  assert.equal(migratePausedSessionMistakes(state), false);
});
