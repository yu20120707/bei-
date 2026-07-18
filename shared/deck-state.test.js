import test from "node:test";
import assert from "node:assert/strict";
import { removeRetiredBuiltinDeckState } from "./deck-state.js";

test("removes only retired default decks and their learning state", () => {
  const state = {
    decks: [{ id: "junior-high" }, { id: "junior-s" }, { id: "deck-custom" }],
    progress: { "junior-high": { correct: 1 }, "junior-s": { correct: 2 }, "deck-custom": { correct: 3 } },
    mistakes: { "junior-high": { word: {} }, "deck-custom": { word: {} } },
    mistakeReviewCycles: { "junior-s": {}, "deck-custom": {} },
    sessions: { "junior-high": {}, "deck-custom": {} },
  };
  assert.equal(removeRetiredBuiltinDeckState(state), true);
  assert.deepEqual(state.decks, [{ id: "deck-custom" }]);
  assert.deepEqual(state.progress, { "deck-custom": { correct: 3 } });
  assert.deepEqual(state.mistakes, { "deck-custom": { word: {} } });
  assert.deepEqual(state.mistakeReviewCycles, { "deck-custom": {} });
  assert.deepEqual(state.sessions, { "deck-custom": {} });
  assert.equal(removeRetiredBuiltinDeckState(state), false);
});
