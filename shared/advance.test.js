import test from "node:test";
import assert from "node:assert/strict";
import { createAdvanceController } from "./advance.js";

function fakeTimer() {
  let nextId = 0;
  const callbacks = new Map();
  return {
    setTimeout(callback) { const id = ++nextId; callbacks.set(id, callback); return id; },
    clearTimeout(id) { callbacks.delete(id); },
    runAll() { [...callbacks.values()].forEach((callback) => callback()); callbacks.clear(); },
  };
}

test("cancels a pending next question when a session is paused or finished", () => {
  const timer = fakeTimer();
  const advance = createAdvanceController(timer);
  let advanced = 0;
  advance.schedule(advance.token(), () => { advanced += 1; }, 500);
  advance.cancel();
  timer.runAll();
  assert.equal(advanced, 0);
});

test("keeps only the latest pending next question", () => {
  const timer = fakeTimer();
  const advance = createAdvanceController(timer);
  const calls = [];
  const token = advance.token();
  advance.schedule(token, () => calls.push("first"), 500);
  advance.schedule(token, () => calls.push("second"), 500);
  timer.runAll();
  assert.deepEqual(calls, ["second"]);
});

test("does not schedule an answer that was invalidated while saving", () => {
  const timer = fakeTimer();
  const advance = createAdvanceController(timer);
  const token = advance.token();
  advance.cancel();
  advance.schedule(token, () => assert.fail("stale answer advanced"), 500);
  timer.runAll();
});
