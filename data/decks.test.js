import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseTsv } from "../shared/quiz.js";

const dataDirectory = path.dirname(fileURLToPath(import.meta.url));

async function loadDeck(file) {
  return parseTsv(await fs.readFile(path.join(dataDirectory, file), "utf8"));
}

test("includes the complete 1600-plus Guangdong middle-school exam range", async () => {
  const deck = await loadDeck("guangdong-zhongkao-1600.tsv");
  assert.equal(deck.length, 1603);
  assert.ok(deck.some((item) => item.word === "a"));
  assert.ok(deck.some((item) => item.word === "environment"));
  assert.ok(new Set(deck.map((item) => item.definition)).size >= 12);
});

test("keeps the Guangdong/Zhongshan high-frequency deck focused and usable", async () => {
  const deck = await loadDeck("guangdong-zhongkao-core-800.tsv");
  const words = new Set(deck.map((item) => item.word.toLowerCase()));
  assert.equal(deck.length, 800);
  assert.equal(words.size, 800);
  for (const basicWord of ["a", "an", "the", "before", "later", "after", "today", "tomorrow"]) assert.ok(!words.has(basicWord));
  for (const coreWord of ["relationship", "responsible", "opportunity", "pollution", "technology", "environment"]) assert.ok(words.has(coreWord));
  assert.ok(new Set(deck.map((item) => item.definition)).size >= 12);
});
