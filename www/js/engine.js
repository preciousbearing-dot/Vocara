// Turns a script into scenes, scenes into audio, and audio into a timeline.
// No DOM and no network here: audio comes from the injected getPcm().
import { parseScript, splitScenes } from './tags.js';
import { concatBytes, normalizePcm, pcmDurationMs, silencePcm, trimSilence } from './wav.js';
import { buildCues, wordCues, wordTimings } from './timing.js';
import { buildSrt } from './srt.js';

export const DEFAULT_GAP_MS = 400;

// Each scene: { index, text, parts:[{type:'text',text}|{type:'pause',ms}] }
export function planScenes(script) {
  return splitScenes(script).map((text, index) => ({ index, text, parts: parseScript(text) }));
}

export const requestsFor = (scene) => scene.parts.filter((p) => p.type === 'text').length;

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
  for (const part of scene.parts) {
    if (part.type === 'pause') {
      chunks.push(silencePcm(part.ms, rate));
      parts.push({ type: 'pause', startMs: ms, endMs: ms + part.ms });
      ms += part.ms;
    } else {
      const got = await getPcm({ text: part.text, scene });
      rate = got.rate;
      const pcm = normalizePcm(trimSilence(got.pcm, rate));
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
