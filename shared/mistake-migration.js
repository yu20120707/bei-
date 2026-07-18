import { recordMistake } from "./mistakes.js";
import { sessionsFor } from "./session.js";

export function migratePausedSessionMistakes(state) {
  let changed = false;
  for (const [sessionId, session] of Object.entries(sessionsFor(state))) {
    if (sessionId.endsWith(":mistake-review")) continue;
    const deck = state.decks.find((item) => item.id === sessionId);
    for (const wrong of session.wrongWords ?? []) {
      const word = deck?.words.find((item) => item.word === wrong.word && item.definition === wrong.definition);
      if (word && !state.mistakes?.[deck.id]?.[word.id]) {
        recordMistake(state, deck.id, word.id);
        changed = true;
      }
    }
  }
  return changed;
}
