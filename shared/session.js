export function sessionsFor(state) {
  state.sessions ??= {};
  if (state.session?.deckId && !state.sessions[state.session.deckId]) {
    state.sessions[state.session.deckId] = state.session;
  }
  delete state.session;
  return state.sessions;
}

export function sessionFor(state, deckId) {
  return sessionsFor(state)[deckId] ?? null;
}

export function startSession(state, deckId, startedWith) {
  const sessions = sessionsFor(state);
  sessions[deckId] ??= { deckId, correct: 0, skipped: 0, wrongWords: [], startedWith };
  return sessions[deckId];
}

export function endSession(state, deckId) {
  const session = sessionFor(state, deckId);
  delete sessionsFor(state)[deckId];
  return session;
}
