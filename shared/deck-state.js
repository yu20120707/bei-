const retiredBuiltinDeckIds = new Set(["junior-high", "junior-s", "junior-a"]);

export function removeRetiredBuiltinDeckState(state) {
  let changed = false;
  const decks = state.decks ?? [];
  const keptDecks = decks.filter((deck) => !retiredBuiltinDeckIds.has(deck.id));
  if (keptDecks.length !== decks.length) {
    state.decks = keptDecks;
    changed = true;
  }
  for (const key of ["progress", "mistakes", "mistakeReviewCycles", "sessions"]) {
    for (const deckId of retiredBuiltinDeckIds) {
      if (state[key]?.[deckId] !== undefined) {
        delete state[key][deckId];
        changed = true;
      }
    }
  }
  if (retiredBuiltinDeckIds.has(state.session?.deckId)) {
    delete state.session;
    changed = true;
  }
  return changed;
}
