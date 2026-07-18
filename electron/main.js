import { app, BrowserWindow, dialog, ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseTsv } from "../shared/quiz.js";
import { removeRetiredBuiltinDeckState } from "../shared/deck-state.js";
import { reportHtml, writeDocxReport } from "./report-export.js";
import { loadStoredState, saveStoredState } from "./state-store.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const legacyStatePath = path.join(app.getPath("appData"), "word-trainer", "word-trainer-state.json");
app.setPath("userData", path.join(app.getPath("appData"), "yuchen-word-trainer"));
const statePath = () => path.join(app.getPath("userData"), "word-trainer-state.json");
let stateSaveQueue = Promise.resolve();

async function builtinDecks() {
  const loadDeck = async (id, name, file) => ({ id, name, words: parseTsv(await fs.readFile(path.join(root, "data", file), "utf8")) });
  return Promise.all([
    loadDeck("guangdong-zhongkao-1600", "广东中考课标词汇（1600+）", "guangdong-zhongkao-1600.tsv"),
    loadDeck("guangdong-zhongkao-core-800", "广东／中山中考高频核心 800 词", "guangdong-zhongkao-core-800.tsv"),
  ]);
}

async function loadState() {
  const stored = await loadStoredState(statePath(), legacyStatePath);
  const state = stored.state;
  state.decks ??= [];
  state.progress ??= {};
  let changed = removeRetiredBuiltinDeckState(state);
  for (const deck of await builtinDecks()) {
    if (!state.decks.some((item) => item.id === deck.id)) { state.decks.push(deck); changed = true; }
    if (!state.progress[deck.id]) { state.progress[deck.id] = { completedIds: [], correct: 0, skipped: 0 }; changed = true; }
  }
  if (stored.migrated || changed) await saveStoredState(statePath(), state);
  return state;
}

const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

async function exportWrongWords(format, wrongWords) {
  if (!wrongWords?.length) throw new Error("本轮没有答错的单词可导出。");
  const extension = format === "pdf" ? "pdf" : "docx";
  const result = await dialog.showSaveDialog({
    title: `导出错题 ${extension.toUpperCase()}`,
    defaultPath: `本轮错题-${timestamp()}.${extension}`,
    filters: [{ name: extension === "pdf" ? "PDF 文件" : "Word 文件", extensions: [extension] }],
  });
  if (result.canceled || !result.filePath) return null;
  if (format === "docx") await writeDocxReport(result.filePath, wrongWords);
  else {
    const window = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
    try {
      await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(reportHtml(wrongWords))}`);
      await fs.writeFile(result.filePath, await window.webContents.printToPDF({ printBackground: true, pageSize: "A4", marginsType: 1 }));
    } finally { window.destroy(); }
  }
  return result.filePath;
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 860,
    minHeight: 620,
    backgroundColor: "#ffffff",
    icon: path.join(root, "assets", "app-icon.png"),
    webPreferences: { preload: path.join(root, "electron", "preload.cjs"), contextIsolation: true },
  });
  window.loadFile(path.join(root, "renderer", "index.html"));
}

app.whenReady().then(() => {
  ipcMain.handle("state:load", loadState);
  ipcMain.handle("state:save", async (_event, state) => {
    stateSaveQueue = stateSaveQueue.catch(() => {}).then(() => saveStoredState(statePath(), state));
    await stateSaveQueue;
  });
  ipcMain.handle("deck:parse", (_event, text) => parseTsv(text));
  ipcMain.handle("report:export", (_event, format, wrongWords) => exportWrongWords(format, wrongWords));
  createWindow();
  app.on("activate", () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
