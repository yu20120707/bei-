import test from "node:test";
import assert from "node:assert/strict";
import { mistakeIds, mistakeStreak, recordMistake, recordReviewResult, sampleMistakeIds } from "./mistakes.js";

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
  assert.equal(mistakeStreak(state, "deck", "word-1"), 1);
});

test("samples at most fifty mistakes and covers every mistake before repeating one", () => {
  const state = {};
  for (let index = 0; index < 60; index += 1) recordMistake(state, "deck", `word-${index}`);
  const first = sampleMistakeIds(state, "deck", 50, () => 0);
  const second = sampleMistakeIds(state, "deck", 50, () => 0);
  assert.equal(first.length, 50);
  assert.equal(second.length, 10);
  assert.equal(new Set([...first, ...second]).size, 60);
  assert.equal(sampleMistakeIds(state, "deck", 50, () => 0).length, 50);
});
