import assert from "node:assert/strict";
import test from "node:test";
import { createQuestion, parseTsv } from "./quiz.js";

test("parses a header and word rows", () => {
  const input = ["Word\tDefinition", ...Array.from({ length: 12 }, (_, index) => `word-${index}\t释义-${index}`)].join("\n");
  assert.equal(parseTsv(input).length, 12);
});

test("rejects a deck that cannot produce twelve choices", () => {
  assert.throws(() => parseTsv("Word\tDefinition\na\t一\n"), /至少需要 12/);
});

test("rejects a deck without twelve distinct definitions", () => {
  const input = ["Word\tDefinition", ...Array.from({ length: 12 }, (_, index) => `word-${index}\t相同释义`)].join("\n");
  assert.throws(() => parseTsv(input), /12 个不同/);
});

test("creates an English question with the correct Chinese choice", () => {
  const words = Array.from({ length: 12 }, (_, index) => ({
    id: String(index + 1), word: `word-${index + 1}`, definition: `释义-${index + 1}`,
  }));
  const question = createQuestion(words, [], () => 0.1);
  assert.equal(question.choices.length, 12);
  assert.ok(question.choices.includes(question.answer.definition));
});

test("restores the paused word when its id is supplied", () => {
  const words = Array.from({ length: 12 }, (_, index) => ({
    id: String(index + 1), word: `word-${index + 1}`, definition: `释义-${index + 1}`,
  }));
  assert.equal(createQuestion(words, [], Math.random, "7").answer.id, "7");
});

test("returns no question after every word is completed", () => {
  const words = [{ id: "1", word: "a", definition: "一" }];
  assert.equal(createQuestion(words, ["1"]), null);
});
