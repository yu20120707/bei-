import { createQuestion, createReviewQuestion } from "../shared/quiz.js";
import { createAdvanceController } from "../shared/advance.js";
import { migratePausedSessionMistakes } from "../shared/mistake-migration.js";
import { mistakeIds, mistakeStreak, recordMistake, recordReviewResult, sampleMistakeIds } from "../shared/mistakes.js";
import { endSession, sessionFor, sessionsFor, startSession } from "../shared/session.js";

const app = document.querySelector("#app");
const fileInput = document.querySelector("#deck-file");
let state = await window.trainer.load();
sessionsFor(state);
let activeDeckId = state.decks[0]?.id;
let question = null;
let locked = false;
let report = null;
let mode = "normal";
let reviewIds = [];
const advance = createAdvanceController();

const progressFor = (deckId) => state.progress[deckId] ?? { completedIds: [], correct: 0, skipped: 0 };
const activeDeck = () => state.decks.find((deck) => deck.id === activeDeckId);
const reviewSessionKey = (deckId) => `${deckId}:mistake-review`;
const activeSessionKey = () => mode === "review" ? reviewSessionKey(activeDeckId) : activeDeckId;

async function persist() { await window.trainer.save(state); }

if (migratePausedSessionMistakes(state)) await persist();

async function practice(preferredWordId = null) {
  const deck = activeDeck();
  const progress = progressFor(deck.id);
  const pausedSession = sessionFor(state, activeSessionKey());
  if (mode === "review") {
    reviewIds = pausedSession?.reviewIds ?? reviewIds;
    question = createReviewQuestion(deck.words, reviewIds, pausedSession?.reviewedIds ?? [], Math.random, preferredWordId);
  } else question = createQuestion(deck.words, progress.completedIds, Math.random, preferredWordId);
  if (!question) return finishSession();
  const session = startSession(state, activeSessionKey(), mode === "review" ? reviewIds.length : progress.completedIds.length);
  if (mode === "review") {
    session.reviewIds ??= reviewIds;
    session.reviewedIds ??= [];
    session.mastered ??= 0;
  }
  session.currentWordId = question.answer.id;
  await persist();
  locked = false;
  render();
}

function home() {
  advance.cancel();
  question = null;
  report = null;
  mode = "normal";
  reviewIds = [];
  render();
}

async function pauseSession() {
  advance.cancel();
  question = null;
  await persist();
  render();
}

async function finishSession() {
  advance.cancel();
  const deck = activeDeck();
  const progress = progressFor(deck.id);
  const session = endSession(state, activeSessionKey());
  report = mode === "review"
    ? {
      type: "review", selected: session?.reviewIds?.length ?? reviewIds.length,
      finished: session?.reviewedIds?.length ?? 0, correct: session?.correct ?? 0,
      skipped: session?.skipped ?? 0, mastered: session?.mastered ?? 0,
      remainingMistakes: mistakeIds(state, deck.id).length, wrongWords: session?.wrongWords ?? [],
    }
    : {
      correct: session?.correct ?? 0, skipped: session?.skipped ?? 0,
      finished: (session?.correct ?? 0) + (session?.skipped ?? 0),
      remaining: deck.words.length - progress.completedIds.length,
      wrongWords: session?.wrongWords ?? [],
    };
  question = null;
  reviewIds = [];
  await persist();
  render();
}

async function startReview() {
  advance.cancel();
  const deck = activeDeck();
  const pausedSession = sessionFor(state, reviewSessionKey(deck.id));
  mode = "review";
  reviewIds = pausedSession?.reviewIds ?? sampleMistakeIds(state, deck.id);
  if (!reviewIds.length) {
    mode = "normal";
    window.alert("当前词库还没有错题。先完成普通练习，答错的单词会自动进入错题库。");
    return;
  }
  await practice(pausedSession?.currentWordId);
}

function render() {
  const deck = activeDeck();
  if (!deck) {
    app.innerHTML = `<section class="empty"><h1>还没有词库</h1><button class="primary" data-action="import">导入词库</button></section>`;
    bind();
    return;
  }
  const progress = progressFor(deck.id);
  const done = progress.completedIds.length;
  const remaining = deck.words.length - done;
  if (report) {
    const reviewReport = report.type === "review";
    const tiles = reviewReport
      ? `<div><dt>本轮抽取</dt><dd>${report.selected}</dd></div><div><dt>实际完成</dt><dd>${report.finished}</dd></div><div><dt>答对</dt><dd>${report.correct}</dd></div><div><dt>答错</dt><dd>${report.skipped}</dd></div><div><dt>已移出错题库</dt><dd>${report.mastered}</dd></div><div><dt>仍在错题库</dt><dd>${report.remainingMistakes}</dd></div>`
      : `<div><dt>本轮完成</dt><dd>${report.finished}</dd></div><div><dt>答对</dt><dd>${report.correct}</dd></div><div><dt>答错后跳过</dt><dd>${report.skipped}</dd></div><div><dt>仍未学习</dt><dd>${report.remaining}</dd></div>`;
    app.innerHTML = `
      <header><span class="brand">${deck.name}</span></header>
      <section class="home report">
        <p class="label">${reviewReport ? "错题库复习已结束" : "本轮练习已结束"}</p>
        <h1>${reviewReport ? "错题复习报告" : "结果报告"}</h1>
        <dl>${tiles}</dl>
        ${report.wrongWords.length ? `<div class="exports"><button class="quiet export" data-action="export-pdf">导出错题 PDF</button><button class="quiet export" data-action="export-docx">导出错题 Word</button></div>` : `<p class="summary">本轮没有错题，无需导出。</p>`}
        <button class="primary large" data-action="home">返回词库</button>
      </section>`;
  } else if (!question) {
    const pausedSession = sessionFor(state, deck.id);
    const paused = Boolean(pausedSession);
    const reviewSession = sessionFor(state, reviewSessionKey(deck.id));
    const mistakes = mistakeIds(state, deck.id).length;
    app.innerHTML = `
      <header><span class="brand">单词选择器</span><button class="quiet" data-action="import">导入词库</button></header>
      <section class="home">
        <p class="signature">YuChen</p>
        <p class="label">今天的单词练习</p>
        <div class="deck-field"><span>选择词库</span><select id="deck-select" aria-label="选择词库">${state.decks.map((item) => `<option value="${item.id}" ${item.id === deck.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></div>
        <div class="home-stat">
          <p class="stat-label">待练习</p>
          <h1>${remaining ? `<strong>${remaining}</strong><span>个单词</span>` : "本词库已完成"}</h1>
          <p class="summary">已答对 ${progress.correct} 个，答错后跳过 ${progress.skipped} 个。</p>
        </div>
        <div class="home-actions">
          <button class="primary large" data-action="${paused ? "resume" : "start"}" ${remaining ? "" : "disabled"}>${paused ? "继续练习" : "开始练习"}</button>
          ${paused ? `<p class="summary resume-note">本轮已答对 ${pausedSession.correct} 个，跳过 ${pausedSession.skipped} 个。</p>` : ""}
          <button class="review-action" data-action="${reviewSession ? "resume-review" : "review"}" ${mistakes || reviewSession ? "" : "disabled"}>${reviewSession ? `继续错题复习（${reviewSession.reviewIds.length} 个）` : `错题库复习（随机 ${Math.min(mistakes, 50)} 个）`}</button>
          <p class="review-note">错题库 ${mistakes} 个单词。同一单词连续答对 3 次后才会移出。</p>
          <button class="quiet reset" data-action="reset">重置本词库进度</button>
        </div>
      </section>`;
  } else {
    const session = sessionFor(state, activeSessionKey());
    const current = mode === "review" ? (session?.reviewedIds?.length ?? 0) + 1 : done + 1;
    const total = mode === "review" ? reviewIds.length : deck.words.length;
    const streak = mode === "review" ? mistakeStreak(state, deck.id, question.answer.id) : 0;
    app.innerHTML = `
      <header><button class="quiet" data-action="pause">暂停</button><button class="quiet" data-action="finish">结束并查看结果</button><span class="progress">${current} / ${total}</span><span class="brand">${mode === "review" ? `${deck.name} · 错题复习` : deck.name}</span></header>
      <section class="practice">
        <div class="practice-intro"><p class="label">${mode === "review" ? "错题库复习：选择正确的中文释义" : "选择正确的中文释义"}</p><span>${mode === "review" ? `当前连续答对 ${streak} / 3` : "12 个选项"}</span></div>
        <h1 class="word">${question.answer.word}</h1>
        <div class="choices">${question.choices.map((choice, index) => `<button class="choice" data-choice="${index}">${choice}</button>`).join("")}</div>
      </section>`;
  }
  bind();
}

function bind() {
  app.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", async () => {
    const action = button.dataset.action;
    if (action === "start") { mode = "normal"; await practice(); }
    if (action === "resume") { mode = "normal"; await practice(sessionFor(state, activeDeckId)?.currentWordId); }
    if (action === "review" || action === "resume-review") await startReview();
    if (action === "home") home();
    if (action === "pause") await pauseSession();
    if (action === "finish") await finishSession();
    if (action === "export-pdf" || action === "export-docx") {
      try {
        const path = await window.trainer.exportWrongWords(action === "export-pdf" ? "pdf" : "docx", report.wrongWords);
        if (path) window.alert(`已导出：${path}`);
      } catch (error) { window.alert(error.message); }
    }
    if (action === "import") fileInput.click();
    if (action === "reset") {
      state.progress[activeDeckId] = { completedIds: [], correct: 0, skipped: 0 };
      endSession(state, activeDeckId);
      await persist(); render();
    }
  }));
  app.querySelector("#deck-select")?.addEventListener("change", (event) => { activeDeckId = event.target.value; render(); });
  app.querySelectorAll("[data-choice]").forEach((button) => button.addEventListener("click", () => answer(Number(button.dataset.choice), button)));
}

async function answer(index, button) {
  if (locked) return;
  locked = true;
  const answerToken = advance.token();
  const chosen = question.choices[index];
  const correct = chosen === question.answer.definition;
  const session = sessionFor(state, activeSessionKey());
  session.correct += correct ? 1 : 0;
  session.skipped += correct ? 0 : 1;
  if (mode === "review") {
    session.reviewedIds.push(question.answer.id);
    const result = recordReviewResult(state, activeDeckId, question.answer.id, correct);
    session.mastered += result.mastered ? 1 : 0;
  } else {
    const progress = progressFor(activeDeckId);
    progress.completedIds.push(question.answer.id);
    if (correct) progress.correct += 1; else progress.skipped += 1;
    state.progress[activeDeckId] = progress;
    if (!correct) recordMistake(state, activeDeckId, question.answer.id);
  }
  if (!correct) {
    session.wrongWords ??= [];
    session.wrongWords.push({ word: question.answer.word, definition: question.answer.definition, chosen });
  }
  button.classList.add(correct ? "correct" : "wrong");
  await persist();
  advance.schedule(answerToken, () => practice(), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500);
}

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    const words = await window.trainer.parseDeck(await file.text());
    const name = file.name.replace(/\.(tsv|txt)$/i, "").trim() || "新词库";
    const id = `deck-${Date.now()}`;
    state.decks.push({ id, name, words });
    state.progress[id] = { completedIds: [], correct: 0, skipped: 0 };
    state.mistakes ??= {};
    state.mistakes[id] = {};
    activeDeckId = id;
    await persist(); render();
  } catch (error) { window.alert(error.message); }
  fileInput.value = "";
});

render();
