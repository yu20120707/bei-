import fs from "node:fs/promises";
import path from "node:path";

let writeSequence = 0;

export async function loadStoredState(currentPath, legacyPath) {
  try {
    return { state: JSON.parse(await fs.readFile(currentPath, "utf8")), migrated: false };
  } catch { /* Try the previous shared application directory once. */ }
  try {
    return { state: JSON.parse(await fs.readFile(legacyPath, "utf8")), migrated: true };
  } catch {
    return { state: { decks: [], progress: {} }, migrated: false };
  }
}

export async function saveStoredState(filePath, state) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${++writeSequence}.tmp`;
  await fs.writeFile(temporaryPath, JSON.stringify(state), "utf8");
  await fs.rename(temporaryPath, filePath);
}
