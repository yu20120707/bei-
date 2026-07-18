export function createAdvanceController(timer = window) {
  let pending = null;
  let revision = 0;

  return {
    token() {
      return revision;
    },
    schedule(token, callback, delay) {
      if (token !== revision) return;
      if (pending !== null) timer.clearTimeout(pending);
      pending = timer.setTimeout(() => {
        pending = null;
        if (token === revision) callback();
      }, delay);
    },
    cancel() {
      revision += 1;
      if (pending === null) return;
      timer.clearTimeout(pending);
      pending = null;
    },
  };
}
