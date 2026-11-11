// Turns a script into scenes, scenes into audio, and audio into a timeline.
// No DOM and no network here: audio comes from the injected getPcm().
import { parseScript, splitScenes } from './tags.js';
import { concatBytes, fadeEdges, findGap, normalizePcm, pcmDurationMs, silencePcm, trimSilence } from './wav.js';
import { buildCues, wordCues, wordTimings } from './timing.js';
import { buildSrt } from './srt.js';

export const DEFAULT_GAP_MS = 400;

// Each scene: { index, text, parts:[{type:'text',text}|{type:'pause',ms}] }
export function planScenes(script) {
  return splitScenes(script).map((text, index) => ({ index, text, parts: parseScript(text) }));
}

// A scene with pauses in it is spoken in ONE request; the pauses are placed afterwards at
// the natural breaths in the audio. These are the texts that need a clip for a scene.
export function requestTexts(scene) {
  const texts = scene.parts.filter((p) => p.type === 'text').map((p) => p.text);
  return texts.length > 1 && scene.parts.some((p) => p.type === 'pause') ? [texts.join(' ')] : texts;
}

export const requestsFor = (scene) => requestTexts(scene).length;

// Cuts one spoken clip at the breaths nearest where each pause belongs.
// lengths = characters of each text part. Returns the pieces, or null when a clean cut is not found.
export function splitAtGaps(pcm, rate, lengths) {
  const total = lengths.reduce((a, b) => a + b, 0);
  const cuts = [];
  let acc = 0; let from = 0;
  for (let i = 0; i < lengths.length - 1; i++) {
    acc += lengths[i];
    const at = findGap(pcm, rate, acc / total, { fromSample: from });
    if (at < 0) return null;
    cuts.push(at); from = at;
  }
  const pieces = []; let prev = 0;
  for (const c of [...cuts, pcm.length >> 1]) { pieces.push(pcm.slice(prev * 2, c * 2)); prev = c; }
  return pieces;
}

export function estimateSeconds(scene) {
  const chars = scene.parts.reduce((a, p) => a + (p.type === 'text' ? p.text.length : 0), 0);
  const pauses = scene.parts.reduce((a, p) => a + (p.type === 'pause' ? p.ms : 0), 0);
  return Math.max(1, Math.round(chars / 15 + pauses / 1000));
}

// Builds one scene's audio. getPcm({text}) -> { pcm, rate }.
export async function renderScene(scene, getPcm) {
  const chunks = [];
  const parts = [];
  let ms = 0;
  let rate = 24000;
  const textParts = scene.parts.filter((p) => p.type === 'text');
  // One request for the whole scene when it has pauses; fall back to one per piece if no clean cut exists.
  let pieces = null;
  if (requestTexts(scene).length === 1 && textParts.length > 1) {
    const got = await getPcm({ text: requestTexts(scene)[0], scene });
    rate = got.rate;
    pieces = splitAtGaps(got.pcm, rate, textParts.map((p) => p.text.length));
  }
  let ti = 0;
  for (const part of scene.parts) {
    if (part.type === 'pause') {
      chunks.push(silencePcm(part.ms, rate));
      parts.push({ type: 'pause', startMs: ms, endMs: ms + part.ms });
      ms += part.ms;
    } else {
      let raw;
      if (pieces) raw = pieces[ti];
      else { const got = await getPcm({ text: part.text, scene }); rate = got.rate; raw = got.pcm; }
      ti++;
      const pcm = fadeEdges(normalizePcm(trimSilence(raw, rate)), rate);
      const dur = pcmDurationMs(pcm, rate);
      chunks.push(pcm);
      parts.push({ type: 'text', text: part.text, startMs: ms, endMs: ms + dur, words: wordTimings(part.text, ms, dur) });
      ms += dur;
    }
  }
  return { text: scene.text, pcm: concatBytes(chunks), rate, durationMs: ms, parts };
}

// Joins rendered scenes with a gap and shifts every time to the global timeline.
export function assemble(rendered, gapMs = DEFAULT_GAP_MS) {
  const rate = rendered.length ? rendered[0].rate : 24000;
  const chunks = [];
  const scenes = [];
  let offset = 0;
  rendered.forEach((r, i) => {
    if (i > 0 && gapMs > 0) { chunks.push(silencePcm(gapMs, rate)); offset += gapMs; }
    const words = [];
    for (const p of r.parts) if (p.words) for (const w of p.words) words.push({ w: w.w, startMs: w.startMs + offset, endMs: w.endMs + offset });
    scenes.push({
      index: i, text: r.text, startMs: offset, endMs: offset + r.durationMs, words,
      parts: r.parts.map((p) => ({ ...p, startMs: p.startMs + offset, endMs: p.endMs + offset, words: undefined })),
    });
    chunks.push(r.pcm);
    offset += r.durationMs;
  });
  return { pcm: concatBytes(chunks), rate, durationMs: offset, scenes };
}

export function outputsFor(timeline, meta = {}) {
  const words = timeline.scenes.flatMap((s) => s.words);
  const json = {
    project: meta.title || '',
    voice: meta.voice || '',
    style: meta.style || '',
    model: meta.model || '',
    sampleRate: timeline.rate,
    durationMs: timeline.durationMs,
    wordTimings: 'estimated',
    scenes: timeline.scenes.map((s) => ({ index: s.index, text: s.text, startMs: s.startMs, endMs: s.endMs, words: s.words })),
  };
  return {
    captionsSrt: buildSrt(buildCues(words)),
    wordsSrt: buildSrt(wordCues(words)),
    timingsJson: JSON.stringify(json, null, 2),
    json,
  };
}

// Text for pasting into a chat with Claude, so it can build visuals against the timings.
export function claudeBundle(timeline, meta = {}) {
  const o = outputsFor(timeline, meta);
  const sec = (ms) => (ms / 1000).toFixed(2);
  const lines = [
    `# Vocara voiceover: ${meta.title || 'Untitled'}`,
    `Voice ${meta.voice}, style "${meta.style || 'none'}", model ${meta.model}. Duration ${sec(timeline.durationMs)}s.`,
    'Word times are estimated from audio length (not aligned); scene and pause times are exact.',
    'The audio file is voiceover.wav, shared separately.',
    '',
    '## Scenes',
    ...timeline.scenes.map((s) => `${s.index + 1}. [${sec(s.startMs)}s to ${sec(s.endMs)}s] ${s.text}`),
    '',
    '## timings.json',
    o.timingsJson,
  ];
  return lines.join('\n');
}
