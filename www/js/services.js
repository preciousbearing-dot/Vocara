// App-wide singletons and the one function that turns text into a cached clip.
import { createStore } from './store.js';
import { createCache, idbAdapter, memoryAdapter } from './cache.js';
import { synth, testKey } from './gemini.js';
import { modelOrder, createRest, synthRotating } from './models.js';
import { pcmToWav, pcmDurationMs, wavToPcm, runsTooLong } from './wav.js';
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

// Generates (or recalls) one clip. Only a cache miss touches the network.
// The clip is stored under the model the user picked, even when a backup model made it,
// so asking again later is free either way.
export async function clip({ voice, text, style = '', model, take = 0 }) {
  const s = store.get();
  const wanted = model || s.model;
  const params = { model: wanted, voice, style, text, take };
  return cache.getOrMake(params, async () => {
    const order = modelOrder(wanted, await discoverModels());
    // A take where the voice also reads the style notes aloud is never saved. Try once more,
    // then stop with a clear message instead of handing back bad audio.
    for (let attempt = 0; attempt < 2; attempt++) {
      const { pcm, rate, model: used } = await synthRotating({
        order, rest, synthOne: (m) => synth({ key: store.getKey(), voice, text, style, model: m }),
      });
      usage.bump();
      const ms = pcmDurationMs(pcm, rate);
      if (!style || !runsTooLong(ms, text)) return { wav: pcmToWav(pcm, rate), rate, ms, model: used };
    }
    throw new GeminiError('request', 'The voice read the style notes out loud. Shorten the Mood and style text and try again.');
  });
}

// Same as clip() but hands back raw audio for the engine.
export async function clipPcm(params) {
  const { value, cached } = await clip(params);
  const { pcm, rate } = wavToPcm(value.wav);
  return { pcm, rate, cached, model: value.model || '' };
}

export async function isCached({ voice, text, style = '', take = 0 }) {
  return Boolean(await cache.lookup({ model: store.get().model, voice, style, text, take }));
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
