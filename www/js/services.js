// App-wide singletons and the one function that turns text into a cached clip.
import { createStore } from './store.js';
import { createCache, idbAdapter, memoryAdapter } from './cache.js';
import { synth } from './gemini.js';
import { pcmToWav, pcmDurationMs, wavToPcm } from './wav.js';
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

// Generates (or recalls) one clip. Only a cache miss touches the network.
export async function clip({ voice, text, style = '', model, take = 0 }) {
  const s = store.get();
  const params = { model: model || s.model, voice, style, text, take };
  return cache.getOrMake(params, async () => {
    const { pcm, rate } = await synth({ key: store.getKey(), ...params });
    usage.bump();
    return { wav: pcmToWav(pcm, rate), rate, ms: pcmDurationMs(pcm, rate) };
  });
}

// Same as clip() but hands back raw audio for the engine.
export async function clipPcm(params) {
  const { value, cached } = await clip(params);
  const { pcm, rate } = wavToPcm(value.wav);
  return { pcm, rate, cached };
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
