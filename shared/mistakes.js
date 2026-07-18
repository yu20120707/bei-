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

export function mistakeStreak(state, deckId, wordId) {
  return mistakeBankFor(state, deckId)[wordId]?.streak ?? 0;
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
  const bankIds = new Set(ids);
  state.mistakeReviewCycles ??= {};
  const cycle = state.mistakeReviewCycles[deckId] ??= { remainingIds: [], reviewedThisCycle: [] };
  cycle.remainingIds = cycle.remainingIds.filter((id) => bankIds.has(id));
  cycle.reviewedThisCycle = cycle.reviewedThisCycle.filter((id) => bankIds.has(id));
  const knownIds = new Set([...cycle.remainingIds, ...cycle.reviewedThisCycle]);
  cycle.remainingIds.push(...ids.filter((id) => !knownIds.has(id)));
  if (!cycle.remainingIds.length) {
    cycle.remainingIds = [...ids];
    cycle.reviewedThisCycle = [];
  }
  for (let index = cycle.remainingIds.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [cycle.remainingIds[index], cycle.remainingIds[swapIndex]] = [cycle.remainingIds[swapIndex], cycle.remainingIds[index]];
  }
  const sample = cycle.remainingIds.splice(0, limit);
  cycle.reviewedThisCycle.push(...sample);
  return sample;
}
