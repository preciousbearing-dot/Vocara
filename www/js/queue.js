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
      const retryable = e && (e.kind === 'quota' || e.kind === 'server');
      if (!retryable || attempt >= waits.length) throw e;
      if (onWait) onWait(Math.round(waits[attempt] / 1000), attempt + 1, e);
      await sleepImpl(waits[attempt], signal);
    }
  }
}
