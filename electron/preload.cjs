const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("trainer", {
  load: () => ipcRenderer.invoke("state:load"),
  save: (state) => ipcRenderer.invoke("state:save", state),
  parseDeck: (text) => ipcRenderer.invoke("deck:parse", text),
  exportWrongWords: (format, wrongWords) => ipcRenderer.invoke("report:export", format, wrongWords),
});
