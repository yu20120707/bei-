import assert from "node:assert/strict";
import test from "node:test";
import { endSession, sessionFor, startSession } from "./session.js";

test("keeps paused sessions independent per deck", () => {
  const state = {};
  startSession(state, "deck-a", 0).correct = 2;
  startSession(state, "deck-b", 10).skipped = 1;
  assert.equal(sessionFor(state, "deck-a").correct, 2);
  assert.equal(sessionFor(state, "deck-b").skipped, 1);
  assert.equal(endSession(state, "deck-b").deckId, "deck-b");
  assert.equal(sessionFor(state, "deck-a").deckId, "deck-a");
});

test("migrates the previous single paused session", () => {
  const state = { session: { deckId: "deck-a", correct: 1 } };
  assert.equal(sessionFor(state, "deck-a").correct, 1);
  assert.equal(state.session, undefined);
});
