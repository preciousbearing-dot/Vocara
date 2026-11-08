// Script tags.
// [pause 0.6s] / [pause 600ms] become real, exact silence between audio pieces,
// so they work with any voice. Every other tag, such as [whispers] or
// [excitedly], is passed through to the model untouched.

const PAUSE = /\[\s*pause\s+(\d+(?:\.\d+)?)\s*(ms|s)?\s*\]/gi;
const MAX_PAUSE_MS = 10000;

export function parseScript(text) {
  const parts = [];
  let last = 0;
  let m;
  PAUSE.lastIndex = 0;
  while ((m = PAUSE.exec(text)) !== null) {
    pushText(parts, text.slice(last, m.index));
    const n = parseFloat(m[1]);
    const ms = (m[2] || 's').toLowerCase() === 'ms' ? n : n * 1000;
    parts.push({ type: 'pause', ms: Math.min(Math.round(ms), MAX_PAUSE_MS) });
    last = m.index + m[0].length;
  }
  pushText(parts, text.slice(last));
  return parts;
}

function pushText(parts, raw) {
  const t = raw.replace(/\s+/g, ' ').trim();
  if (t) parts.push({ type: 'text', text: t });
}

// Splits a script into scenes at blank lines.
export function splitScenes(script) {
  return script
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
