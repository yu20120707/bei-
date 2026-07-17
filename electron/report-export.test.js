import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { reportHtml, writeDocxReport } from "./report-export.js";

const mistakes = [{ word: "alternative", definition: "n. 替代方案", chosen: "adj. 另一个的" }];

test("builds a printable HTML report", () => {
  const html = reportHtml(mistakes);
  assert.match(html, /alternative/);
  assert.match(html, /正确中文/);
});

test("writes a non-empty Word report", async () => {
  const output = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "word-trainer-")), "mistakes.docx");
  await writeDocxReport(output, mistakes);
  assert.ok((await fs.stat(output)).size > 1000);
});
