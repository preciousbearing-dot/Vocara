// Picks which Gemini voice model to ask, and moves on to the next one when a
// model has used up its own free limit. Each model has its own quota.
import { GeminiError } from './gemini.js';

const ver = (n) => { const m = /(\d+(?:\.\d+)?)/.exec(n); return m ? parseFloat(m[1]) : 0; };

// Newest first; full models before "lite"; stable names before "preview".
export function rankModels(names) {
  return [...new Set(names)].sort((a, b) => (ver(b) - ver(a))
    || ((/lite/.test(a) ? 1 : 0) - (/lite/.test(b) ? 1 : 0))
    || ((/preview/.test(a) ? 1 : 0) - (/preview/.test(b) ? 1 : 0)));
}

// The model the user chose always goes first, the rest follow in ranked order.
export function modelOrder(preferred, discovered = []) {
  const rest = rankModels(discovered.filter((n) => n !== preferred));
  return [preferred, ...rest].filter(Boolean);
}

// Remembers which models are resting and until when.
export function createRest(now = () => Date.now()) {
  const until = new Map();
  return {
    set(model, ms) { until.set(model, now() + ms); },
    isResting(model) { return (until.get(model) || 0) > now(); },
    secondsLeft(models) {
      const left = models.map((m) => Math.max(0, (until.get(m) || 0) - now())).filter((x) => x > 0);
      return left.length ? Math.ceil(Math.min(...left) / 1000) : 0;
    },
    clear() { until.clear(); },
  };
}

const HOUR = 3600000;

// Tries each model in order. A model that hits its limit rests and the next one is tried.
// synthOne(model) -> { pcm, rate }. Returns { pcm, rate, model }.
export async function synthRotating({ order, rest, synthOne }) {
  const avail = order.filter((m) => !rest.isResting(m));
  if (!avail.length) {
    const secs = rest.secondsLeft(order) || 60;
    throw new GeminiError('quota', `Every voice model is resting after its free limit. Try again in about ${secs <= 90 ? `${secs} seconds` : `${Math.ceil(secs / 60)} minutes`}.`, 429, { retryAfter: secs, daily: secs > 600 });
  }
  let last = null;
  for (const m of avail) {
    try {
      const r = await synthOne(m);
      return { ...r, model: m };
    } catch (e) {
      if (e && e.kind === 'quota') {
        rest.set(m, e.daily ? 6 * HOUR : Math.max(20, e.retryAfter || 60) * 1000);
        last = e; continue;
      }
      if (e && e.kind === 'model') { rest.set(m, HOUR); last = e; continue; }
      throw e;
    }
  }
  if (last && last.kind === 'quota') {
    const secs = rest.secondsLeft(order) || 60;
    throw new GeminiError('quota', last.message, 429, { retryAfter: secs, daily: secs > 600 });
  }
  throw last;
}
