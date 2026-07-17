import { app, BrowserWindow, dialog, ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseTsv } from "../shared/quiz.js";
import { reportHtml, writeDocxReport } from "./report-export.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const statePath = () => path.join(app.getPath("userData"), "word-trainer-state.json");

async function builtinDecks() {
  const loadDeck = async (id, name, file) => ({ id, name, words: parseTsv(await fs.readFile(path.join(root, "data", file), "utf8")) });
  return Promise.all([
    loadDeck("junior-high", "初中英语核心词汇", "junior-high.tsv"),
    loadDeck("junior-s", "初中英语 S 级核心词汇", "junior-s.tsv"),
    loadDeck("junior-a", "初中英语 A 级阅读词汇", "junior-a.tsv"),
  ]);
}

async function loadState() {
  let state;
  try { state = JSON.parse(await fs.readFile(statePath(), "utf8")); }
  catch { state = { decks: [], progress: {} }; }
  state.decks ??= [];
  state.progress ??= {};
  for (const deck of await builtinDecks()) {
    if (!state.decks.some((item) => item.id === deck.id)) state.decks.push(deck);
    state.progress[deck.id] ??= { completedIds: [], correct: 0, skipped: 0 };
  }
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
    webPreferences: { preload: path.join(root, "electron", "preload.cjs"), contextIsolation: true },
  });
  window.loadFile(path.join(root, "renderer", "index.html"));
}

app.whenReady().then(() => {
  ipcMain.handle("state:load", loadState);
  ipcMain.handle("state:save", async (_event, state) => {
    await fs.mkdir(path.dirname(statePath()), { recursive: true });
    await fs.writeFile(statePath(), JSON.stringify(state), "utf8");
  });
  ipcMain.handle("deck:parse", (_event, text) => parseTsv(text));
  ipcMain.handle("report:export", (_event, format, wrongWords) => exportWrongWords(format, wrongWords));
  createWindow();
  app.on("activate", () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
