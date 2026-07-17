import test from "node:test";
import assert from "node:assert/strict";
import { mistakeIds, recordMistake, recordReviewResult, sampleMistakeIds } from "./mistakes.js";

test("removes a mistake only after three consecutive correct answers", () => {
  const state = {};
  recordMistake(state, "deck", "word-1");
  assert.deepEqual(recordReviewResult(state, "deck", "word-1", true), { mastered: false, streak: 1 });
  assert.deepEqual(recordReviewResult(state, "deck", "word-1", true), { mastered: false, streak: 2 });
  assert.deepEqual(recordReviewResult(state, "deck", "word-1", true), { mastered: true, streak: 3 });
  assert.deepEqual(mistakeIds(state, "deck"), []);
});

test("a wrong review answer resets the consecutive-correct streak", () => {
  const state = {};
  recordMistake(state, "deck", "word-1");
  recordReviewResult(state, "deck", "word-1", true);
  assert.deepEqual(recordReviewResult(state, "deck", "word-1", false), { mastered: false, streak: 0 });
  assert.deepEqual(recordReviewResult(state, "deck", "word-1", true), { mastered: false, streak: 1 });
});

test("samples no more than fifty unique mistakes", () => {
  const state = {};
  for (let index = 0; index < 60; index += 1) recordMistake(state, "deck", `word-${index}`);
  const sample = sampleMistakeIds(state, "deck", 50, () => 0);
  assert.equal(sample.length, 50);
  assert.equal(new Set(sample).size, 50);
});
