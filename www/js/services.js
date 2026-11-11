// App-wide singletons and the one function that turns text into a cached clip.
import { createStore } from './store.js';
import { createCache, idbAdapter, memoryAdapter } from './cache.js';
import { synth, testKey } from './gemini.js';
import { modelOrder, createRest, synthRotating } from './models.js';
import { pcmToWav, pcmDurationMs, wavToPcm, unwrapWav, checkTake, cutRepeat } from './wav.js';
import { GeminiError } from './gemini.js';
import { PREVIEW_LINE } from './voices.js';
import { createUsage } from './usage.js';
import { createProjects } from './projects.js';

export const VERSION = '0.1.0';

export const store = createStore(window.localStorage);
export const usage = createUsage(window.localStorage);
export const projects = createProjects(window.localStorage);
export const cache = createCache(typeof indexedDB !== 'undefined' ? idbAdapter() : memoryAdapter());

export function hasKey() {
  return store.getKey().length > 0;
}

const MODELS_KEY = 'vocara.models.v1';
const rest = createRest();

function readModels() {
  try { const v = JSON.parse(window.localStorage.getItem(MODELS_KEY)); if (v && Array.isArray(v.names)) return v; } catch (_) { /* none yet */ }
  return { names: [], at: 0 };
}

// The voice models this key can reach. Listing costs no speech quota; checked once a day.
export async function discoverModels(force = false) {
  const saved = readModels();
  if (!force && saved.names.length && Date.now() - saved.at < 864e5) return saved.names;
  try {
    const r = await testKey({ key: store.getKey() });
    window.localStorage.setItem(MODELS_KEY, JSON.stringify({ names: r.ttsModels, at: Date.now() }));
    return r.ttsModels;
  } catch (_) { return saved.names; }
}

// Judges a take. A clip that says the script twice is cut back to its first copy when the two
// halves match in length; anything else that looks wrong is rejected.
function judge(pcm, rate, text) {
  const v = checkTake(pcm, rate, text);
  if (v.ok) return { ok: true, pcm, repaired: false, v };
  if (v.repeat) {
    const cut = cutRepeat(pcm, rate, v.repeatAt);
    if (cut) {
      const v2 = checkTake(cut, rate, text);
      if (v2.ok) return { ok: true, pcm: cut, repaired: true, v: v2 };
    }
  }
  return { ok: false, pcm, repaired: false, v };
}

const CHECKED = 2; // clips saved with this mark have already passed the checks

// A clip saved earlier can carry the WAV header and trailing static that newer Gemini models add,
// or a repeated script. Cleans what can be cleaned for free; { ok: false } means ask Google again.
function tidyCached(hit, text) {
  if (hit.checked === CHECKED) return { ok: true, changed: false, value: hit };
  const { pcm: raw, rate: savedRate } = wavToPcm(hit.wav);
  const un = unwrapWav(raw);
  const rate = un.rate || hit.rate || savedRate;
  const j = judge(un.pcm, rate, text);
  if (!j.ok) return { ok: false };
  const value = { ...hit, wav: pcmToWav(j.pcm, rate), rate, ms: pcmDurationMs(j.pcm, rate), repaired: Boolean(hit.repaired || j.repaired), checked: CHECKED };
  return { ok: true, changed: true, value };
}

// Generates (or recalls) one clip. Only a cache miss touches the network.
// The clip is stored under the model the user picked, even when a backup model made it,
// so asking again later is free either way.
export async function clip({ voice, text, style = '', model, take = 0 }) {
  const s = store.get();
  const wanted = model || s.model;
  const params = { model: wanted, voice, style, text, take };
  const hit = await cache.lookup(params);
  if (hit) {
    const t = tidyCached(hit, text);
    if (t.ok) {
      if (t.changed) await cache.save(params, t.value);
      return { value: t.value, cached: true };
    }
  }
  const order = modelOrder(wanted, await discoverModels());
  let last = null;
  // A take that repeats itself or reads the style notes aloud is never saved. Repairable ones
  // are fixed on the spot; otherwise ask once more, then stop with a clear message.
  for (let attempt = 0; attempt < 2; attempt++) {
    const { pcm, rate, model: used } = await synthRotating({
      order, rest, synthOne: (m) => synth({ key: store.getKey(), voice, text, style, model: m }),
    });
    usage.bump();
    const j = judge(pcm, rate, text);
    if (j.ok) {
      const value = { wav: pcmToWav(j.pcm, rate), rate, ms: pcmDurationMs(j.pcm, rate), model: used, repaired: j.repaired, checked: CHECKED };
      await cache.save(params, value);
      return { value, cached: false };
    }
    last = j.v;
  }
  throw new GeminiError('request', last && last.repeat
    ? 'The voice read this scene twice. Tap the scene again for a fresh take.'
    : 'The voice read the style notes out loud. Shorten the Mood and style text and try again.');
}

// Same as clip() but hands back raw audio for the engine.
export async function clipPcm(params) {
  const { value, cached } = await clip(params);
  const { pcm, rate } = wavToPcm(value.wav);
  return { pcm, rate, cached, model: value.model || '', repaired: Boolean(value.repaired) };
}

export async function isCached({ voice, text, style = '', take = 0 }) {
  const hit = await cache.lookup({ model: store.get().model, voice, style, text, take });
  return Boolean(hit) && tidyCached(hit, text).ok;
}

export function previewParams(voice) {
  return { model: store.get().model, voice, style: '', text: PREVIEW_LINE };
}

export function isPreviewCached(voice) {
  return cache.lookup(previewParams(voice)).then(Boolean);
}

export function previewVoice(voice) {
  return clip({ voice, text: PREVIEW_LINE });
}
