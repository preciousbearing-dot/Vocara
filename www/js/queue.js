// Retry and pacing helpers for talking to Gemini on a free quota.
export const sleep = (ms, signal) => new Promise((resolve, reject) => {
  if (signal && signal.aborted) return reject(new DOMException('Stopped', 'AbortError'));
  const t = setTimeout(resolve, ms);
  if (signal) signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Stopped', 'AbortError')); }, { once: true });
});

// Runs fn. When Google says the quota is used up (kind 'quota') or has a hiccup (kind 'server'),
// waits and tries again, up to waits.length times. Other errors are thrown at once.
export async function withRetry(fn, { waits = [15000, 45000], sleepImpl = sleep, onWait, signal } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const retryable = e && (e.kind === 'quota' || e.kind === 'server') && !e.daily;
      if (!retryable || attempt >= waits.length) throw e;
      // When Google (or the model rotation) says how long, wait that long instead of a fixed guess.
      const wait = e.retryAfter > 0 ? Math.min(70000, Math.max(3000, Math.round(e.retryAfter * 1000) + 500)) : waits[attempt];
      if (onWait) onWait(Math.round(wait / 1000), attempt + 1, e);
      await sleepImpl(wait, signal);
    }
  }
}
