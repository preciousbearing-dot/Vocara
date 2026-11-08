// Word timings and captions.
// Gemini returns audio only, with no word alignment, so word times are ESTIMATED:
// each spoken piece has an exact duration (we measure the audio) and the words
// inside it share that time by length, with extra weight after punctuation.
// Pauses and scene gaps are exact. This is close enough to drive captions and
// animation, and timings.json says it is an estimate.

export function tokenizeWords(text) {
  return text
    .replace(/\[[^\]]*\]/g, ' ')
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w));
}

function weight(word) {
  const letters = (word.match(/[\p{L}\p{N}]/gu) || []).length || 1;
  let extra = 0;
  if (/[.!?…]["')\]]*$/.test(word)) extra = 4;
  else if (/[,;:—–-]["')\]]*$/.test(word)) extra = 2;
  return letters + extra;
}

// Spreads `durMs` over the words of `text`, starting at `startMs`.
export function wordTimings(text, startMs, durMs) {
  const words = tokenizeWords(text);
  const total = words.reduce((a, w) => a + weight(w), 0);
  let t = startMs;
  return words.map((w, i) => {
    const d = i === words.length - 1 ? startMs + durMs - t : (durMs * weight(w)) / total;
    const out = { w, startMs: Math.round(t), endMs: Math.round(t + d) };
    t += d;
    return out;
  });
}

// Groups words into readable caption lines.
export function buildCues(words, { maxWords = 7, maxChars = 42 } = {}) {
  const cues = [];
  let cur = [];
  const flush = () => {
    if (!cur.length) return;
    cues.push({ start: cur[0].startMs, end: cur[cur.length - 1].endMs, text: cur.map((x) => x.w).join(' ') });
    cur = [];
  };
  for (const w of words) {
    const len = cur.reduce((a, x) => a + x.w.length + 1, 0) + w.w.length;
    if (cur.length && (cur.length >= maxWords || len > maxChars)) flush();
    cur.push(w);
    if (/[.!?…]["')\]]*$/.test(w.w)) flush();
  }
  flush();
  return cues;
}

export function wordCues(words) {
  return words.map((x) => ({ start: x.startMs, end: x.endMs, text: x.w }));
}
