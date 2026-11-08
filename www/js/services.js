// App-wide singletons and the one function that turns text into a cached clip.
import { createStore } from './store.js';
import { createCache, idbAdapter, memoryAdapter } from './cache.js';
import { synth } from './gemini.js';
import { pcmToWav, pcmDurationMs } from './wav.js';
import { PREVIEW_LINE } from './voices.js';

export const VERSION = '0.1.0';

export const store = createStore(window.localStorage);
export const cache = createCache(typeof indexedDB !== 'undefined' ? idbAdapter() : memoryAdapter());

export function hasKey() {
  return store.getKey().length > 0;
}

// Generates (or recalls) one clip. Only a cache miss touches the network.
export async function clip({ voice, text, style = '', model }) {
  const s = store.get();
  const params = { model: model || s.model, voice, style, text };
  return cache.getOrMake(params, async () => {
    const { pcm, rate } = await synth({ key: store.getKey(), ...params });
    return { wav: pcmToWav(pcm, rate), rate, ms: pcmDurationMs(pcm, rate) };
  });
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
