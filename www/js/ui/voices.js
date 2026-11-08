import { h, icon, toast } from '../dom.js';
import { VOICES, PREVIEW_LINE } from '../voices.js';
import { store, hasKey, previewVoice, isPreviewCached } from '../services.js';
import { playWav, stopAudio } from '../audio.js';

export function renderVoices(root, { go }) {
  const wrap = h('div', { class: 'screen' });
  const list = h('div', { class: 'card flush' });
  let playing = null; // voice name currently playing or loading
  const rows = new Map();

  const chosenName = () => store.get().voice;

  function paintRow(v, state) {
    const row = rows.get(v.name);
    const chosen = chosenName() === v.name;
    row.className = `voice${chosen ? ' chosen' : ''}`;
    const busy = state && state.busy;
    const isPlaying = playing === v.name && !busy;
    const play = h('button', {
      class: `icon-btn sm${isPlaying ? ' accent' : ''}`,
      'aria-label': isPlaying ? `Stop ${v.name}` : `Preview ${v.name}`,
      disabled: busy,
      onclick: () => toggle(v),
    }, icon(isPlaying ? 'pause' : 'play', 18));
    const saved = state && state.cached;
    row.replaceChildren(...[
      play,
      h('div', { class: 'grow' },
        h('div', { class: 'name', text: v.name }),
        h('div', { class: 'trait', text: busy ? 'Generating the sample...' : v.trait })),
      saved ? h('span', { class: 'chip ok', text: 'Saved' }) : null,
      chosen
        ? h('span', { class: 'chip', text: 'Chosen' })
        : h('button', { class: 'btn small', onclick: () => choose(v), text: 'Choose' }),
    ].filter(Boolean));
  }

  async function toggle(v) {
    if (playing === v.name) { stopAudio(); playing = null; refresh(v); return; }
    if (!hasKey()) { go('settings'); toast('Add your key first.'); return; }
    stopAudio();
    const prev = playing; playing = null;
    if (prev) refresh(VOICES.find((x) => x.name === prev));
    paintRow(v, { busy: true });
    try {
      const { value, cached } = await previewVoice(v.name);
      playing = v.name;
      paintRow(v, { cached: true });
      if (!cached) toast(`${v.name} saved. Replays are free.`);
      await playWav(value.wav);
    } catch (e) {
      toast(e.message || 'Could not play that sample.');
    } finally {
      if (playing === v.name) playing = null;
      refresh(v);
    }
  }

  function choose(v) {
    store.set({ voice: v.name });
    VOICES.forEach((x) => refresh(x));
    toast(`${v.name} is now your default voice.`);
  }

  async function refresh(v) {
    paintRow(v, { cached: await isPreviewCached(v.name) });
  }

  VOICES.forEach((v) => {
    const row = h('div', { class: 'voice' });
    rows.set(v.name, row);
    list.append(row);
    paintRow(v, {});
    refresh(v);
  });

  wrap.append(...[
    h('div', { class: 'topbar' }, h('h1', { text: 'Voices' })),
    h('p', { class: 'sub', text: 'Tap play to hear each voice read the same line. Heard samples are saved, so replaying costs nothing.' }),
    h('div', { class: 'card mt16' }, h('div', { class: 'label', text: 'Sample line' }), h('p', { class: 'mt8', text: PREVIEW_LINE })),
    hasKey() ? null : h('div', { class: 'notice mt16', text: 'Add your Gemini key in Settings to hear the voices.' }),
    h('div', { class: 'mt16' }, list),
  ].filter(Boolean));
  root.append(wrap);
  return () => stopAudio();
}
