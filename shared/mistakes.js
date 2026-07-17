export function mistakeBankFor(state, deckId) {
  state.mistakes ??= {};
  state.mistakes[deckId] ??= {};
  return state.mistakes[deckId];
}

export function mistakeIds(state, deckId) {
  return Object.keys(mistakeBankFor(state, deckId));
}

export function recordMistake(state, deckId, wordId) {
  mistakeBankFor(state, deckId)[wordId] = { streak: 0 };
}

export function recordReviewResult(state, deckId, wordId, correct) {
  const bank = mistakeBankFor(state, deckId);
  if (!bank[wordId]) return { mastered: false, streak: 0 };
  if (!correct) {
    bank[wordId].streak = 0;
    return { mastered: false, streak: 0 };
  }
  bank[wordId].streak += 1;
  if (bank[wordId].streak < 3) return { mastered: false, streak: bank[wordId].streak };
  delete bank[wordId];
  return { mastered: true, streak: 3 };
}

export function sampleMistakeIds(state, deckId, limit = 50, random = Math.random) {
  const ids = mistakeIds(state, deckId);
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [ids[index], ids[swapIndex]] = [ids[swapIndex], ids[index]];
  }
  return ids.slice(0, limit);
}
