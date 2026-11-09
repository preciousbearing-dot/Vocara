import { h, icon, toast } from '../dom.js';
import { store, hasKey, usage, projects, clipPcm, isCached } from '../services.js';
import { VOICES } from '../voices.js';
import { PRESETS } from '../presets.js';
import { planScenes, renderScene, assemble, outputsFor, claudeBundle, requestsFor, requestTexts, estimateSeconds } from '../engine.js';
import { withRetry, sleep } from '../queue.js';
import { pcmToWav } from '../wav.js';
import { playWav, stopAudio } from '../audio.js';
import { deliver, copyText } from './native.js';

const PACE_MS = 400; // breathing room between paid requests

const slug = (t) => (t || 'voiceover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'voiceover';

export function renderStudio(root, { go }, id) {
  let project = (id && projects.get(id)) || projects.create({ voice: store.get().voice, style: PRESETS[0].style });
  let scenes = planScenes(project.script);
  let result = null; // { timeline, files }
  let busy = null; // AbortController while generating
  const usedModels = new Set();
  let statusToken = 0;
  let saveTimer = null;
  let rebuildTimer = null;

  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { if (project.script.trim() || project.title.trim()) projects.save(project); }, 400);
  };
  const takeInfo = (scene) => project.takes[scene.text] || { cur: 0, max: 0 };
  const params = (scene) => ({ voice: project.voice, style: project.style, take: takeInfo(scene).cur });

  // ---- inputs
  const title = h('input', { class: 'input', id: 'title', placeholder: 'Untitled voiceover', value: project.title, autocomplete: 'off' });
  const voiceSel = h('select', { class: 'input', id: 'voice', 'aria-label': 'Voice' },
    VOICES.map((v) => h('option', { value: v.name, text: `${v.name} · ${v.trait}` })));
  voiceSel.value = project.voice;
  const style = h('input', { class: 'input', id: 'style', placeholder: 'e.g. Say calmly and slowly', value: project.style, autocomplete: 'off', spellcheck: 'false' });
  const script = h('textarea', { class: 'input script', id: 'script', rows: '9', placeholder: 'Paste your script. A blank line starts a new scene.\n\n[pause 0.6s] adds exact silence. Tags like [whispers] go to the voice.' });
  script.value = project.script;
  const chips = h('div', { class: 'chips' });
  const sceneList = h('div', { class: 'stack' });
  const planLine = h('p', { class: 'sub' });
  const quotaLine = h('p', { class: 'sub center' });
  const progress = h('div', { class: 'stack' });
  const resultBox = h('div', { class: 'stack' });
  const genBtn = h('button', { class: 'btn block', id: 'generate', text: 'Generate voiceover' });

  // ---- presets
  function paintChips() {
    chips.replaceChildren(...PRESETS.map((p) => h('button', {
      class: `chip ${project.preset === p.id ? '' : 'plain'}`, 'aria-pressed': String(project.preset === p.id), text: p.name,
      onclick: () => {
        project.preset = p.id;
        if (p.voice) { project.voice = p.voice; voiceSel.value = p.voice; }
        project.style = p.style; style.value = p.style;
        invalidate(); paintChips(); save(); paintScenes();
      },
    })));
  }

  function invalidate() { result = null; resultBox.replaceChildren(); stopAudio(); }

  // ---- scenes
  async function paintScenes() {
    const token = ++statusToken;
    scenes = planScenes(project.script);
    updateQuota();
    if (!scenes.length) {
      sceneList.replaceChildren();
      planLine.textContent = 'Add a script to begin.';
      genBtn.disabled = true; genBtn.textContent = 'Generate voiceover';
      return;
    }
    const rows = scenes.map((scene) => {
      const t = takeInfo(scene);
      const status = h('span', { class: 'chip plain', text: '…' });
      const playBtn = h('button', { class: 'icon-btn sm accent', 'aria-label': `Play scene ${scene.index + 1}`, onclick: () => playScene(scene, playBtn) }, icon('play', 18));
      const controls = h('div', { class: 'row scene-ctl' },
        t.cur > 0 ? h('button', { class: 'icon-btn sm', 'aria-label': 'Previous take', onclick: () => stepTake(scene, -1) }, icon('back', 18)) : null,
        t.max > 0 ? h('span', { class: 'chip plain', text: `Take ${t.cur + 1}` }) : null,
        t.cur < t.max ? h('button', { class: 'icon-btn sm', 'aria-label': 'Next take', onclick: () => stepTake(scene, 1) }, icon('next', 18)) : null,
        h('button', { class: 'icon-btn sm', 'aria-label': 'New take', title: 'New take (costs a request)', onclick: () => newTake(scene) }, icon('refresh', 18)));
      const card = h('div', { class: 'card scene' },
        h('div', { class: 'row' },
          h('div', { class: 'grow' },
            h('div', { class: 'label', text: `Scene ${scene.index + 1}` }),
            h('div', { class: 'scene-text', text: scene.text.length > 110 ? `${scene.text.slice(0, 110)}…` : scene.text })),
          playBtn),
        h('div', { class: 'row mt8' },
          status,
          h('span', { class: 'sub', text: `~${estimateSeconds(scene)}s · ${requestsFor(scene)} request${requestsFor(scene) === 1 ? '' : 's'}` }),
          h('div', { class: 'grow' }),
          controls));
      return { scene, status, card };
    });
    sceneList.replaceChildren(...rows.map((r) => r.card));
    // cache status (free lookups)
    let pending = 0;
    for (const r of rows) {
      let missing = 0;
      for (const text of requestTexts(r.scene)) if (!(await isCached({ ...params(r.scene), text }))) missing++;
      if (token !== statusToken) return;
      pending += missing;
      r.status.textContent = missing ? `${missing} new` : 'Saved';
      r.status.className = missing ? 'chip peach' : 'chip ok';
    }
    planLine.textContent = pending ? `${pending} new voice request${pending === 1 ? '' : 's'}, the rest are saved and free.` : 'Everything is saved. Generating costs nothing.';
    genBtn.disabled = Boolean(busy);
    genBtn.textContent = pending ? `Generate voiceover (${pending} new)` : 'Build voiceover (free)';
    genBtn.dataset.pending = String(pending);
  }

  function updateQuota() {
    quotaLine.textContent = `Voice requests today: ${usage.today()} (your guard: ${store.get().dailyGuard})`;
  }

  async function pendingFor(list) {
    let n = 0;
    for (const s of list) for (const text of requestTexts(s)) if (!(await isCached({ ...params(s), text }))) n++;
    return n;
  }

  async function confirmSpend(list) {
    if (!hasKey()) { toast('Add your Gemini key first.'); go('key'); return false; }
    const n = await pendingFor(list);
    const guard = store.get().dailyGuard;
    if (n > 0 && usage.today() + n > guard) {
      return confirm(`This needs ${n} new voice request${n === 1 ? '' : 's'}. You have made ${usage.today()} today and your guard is ${guard}. Continue anyway?`);
    }
    return true;
  }

  function makeGetPcm(scene, signal, onWait) {
    return ({ text }) => withRetry(async () => {
      const got = await clipPcm({ ...params(scene), text });
      if (got.model) usedModels.add(got.model);
      if (!got.cached) { updateQuota(); await sleep(PACE_MS, signal); }
      return got;
    }, { signal, onWait });
  }

  function say(el, text, cls = 'notice') { el.replaceChildren(h('div', { class: cls, text })); }

  // ---- generate everything
  async function generate() {
    if (busy || !scenes.length) return;
    if (!(await confirmSpend(scenes))) return;
    const ctl = new AbortController();
    busy = ctl; genBtn.disabled = true; invalidate();
    const stopBtn = h('button', { class: 'btn ghost block', text: 'Stop', onclick: () => ctl.abort() });
    try {
      const rendered = [];
      usedModels.clear();
      for (const scene of scenes) {
        const note = h('div', { class: 'notice', text: `Scene ${scene.index + 1} of ${scenes.length}…` });
        progress.replaceChildren(note, stopBtn);
        rendered.push(await renderScene(scene, makeGetPcm(scene, ctl.signal, (secs, n) => { note.textContent = `Google asked us to slow down. Retrying scene ${scene.index + 1} in ${secs}s (try ${n}).`; })));
        paintScenes(); // finished scenes show Saved and can be played right away
      }
      const timeline = assemble(rendered, project.gapMs);
      result = { timeline };
      progress.replaceChildren();
      const backups = [...usedModels].filter((m) => m && m !== store.get().model);
      if (backups.length) progress.replaceChildren(h('div', { class: 'notice', text: `Some scenes used a backup voice model (${backups.join(', ')}) because ${store.get().model} hit its limit. If a scene sounds different, tap New take on it later.` }));
      paintResult();
    } catch (e) {
      if (e && e.name === 'AbortError') say(progress, 'Stopped. Finished scenes are saved, so you can continue later at no extra cost.');
      else say(progress, `${e.message || 'Something went wrong.'} Finished scenes are saved; run it again to continue.`, 'notice err');
    } finally { busy = null; updateQuota(); paintScenes(); }
  }

  // ---- single scene actions
  async function playScene(scene, btn) {
    if (btn.dataset.playing === '1') { stopAudio(); return; }
    const during = Boolean(busy); // a run is going: only scenes that are already saved can play
    if (during && (await pendingFor([scene])) > 0) { toast('Wait for this scene to finish, or stop the run.'); return; }
    if (!during && !(await confirmSpend([scene]))) return;
    const ctl = new AbortController(); if (!during) busy = ctl;
    btn.dataset.playing = '1'; btn.replaceChildren(icon('stop', 18));
    try {
      const r = await renderScene(scene, makeGetPcm(scene, ctl.signal, (secs) => toast(`Quota is busy. Retrying in ${secs}s.`)));
      invalidate(); paintScenes();
      if (busy === ctl) busy = null;
      await playWav(pcmToWav(r.pcm, r.rate));
    } catch (e) { if (!(e && e.name === 'AbortError')) toast(e.message || 'Could not make this scene.'); }
    finally { if (busy === ctl) busy = null; btn.dataset.playing = ''; btn.replaceChildren(icon('play', 18)); updateQuota(); }
  }

  function stepTake(scene, d) {
    const t = takeInfo(scene);
    project.takes[scene.text] = { cur: Math.max(0, Math.min(t.max, t.cur + d)), max: t.max };
    invalidate(); save(); paintScenes();
  }

  async function newTake(scene) {
    const t = takeInfo(scene);
    const prev = { ...t };
    project.takes[scene.text] = { cur: t.max + 1, max: t.max + 1 };
    invalidate(); save();
    await paintScenes();
    const btn = sceneList.children[scene.index] && sceneList.children[scene.index].querySelector('.icon-btn.accent');
    if (!(await confirmSpend([scene]))) { project.takes[scene.text] = prev; save(); paintScenes(); return; }
    if (btn) playScene(scene, btn);
  }

  // ---- results and export
  function files() {
    const t = result.timeline;
    const meta = { title: project.title, voice: project.voice, style: project.style, model: store.get().model };
    const o = outputsFor(t, meta);
    const base = slug(project.title);
    return {
      all: [
        { name: `${base}.wav`, mime: 'audio/wav', data: pcmToWav(t.pcm, t.rate) },
        { name: `${base}.srt`, mime: 'application/x-subrip', data: o.captionsSrt },
        { name: `${base}.words.srt`, mime: 'application/x-subrip', data: o.wordsSrt },
        { name: `${base}.timings.json`, mime: 'application/json', data: o.timingsJson },
      ],
      bundle: claudeBundle(t, meta),
    };
  }

  async function send(list, label) {
    try {
      const how = await deliver(list, `Vocara: ${project.title || 'voiceover'}`);
      toast(how === 'shared' ? `${label} ready to save or send.` : `${label} downloaded.`);
    } catch (e) { toast(e && e.name === 'AbortError' ? 'Cancelled.' : `Could not export: ${e.message || e}`); }
  }

  function paintResult() {
    if (!result) { resultBox.replaceChildren(); return; }
    const f = files();
    const secs = (result.timeline.durationMs / 1000).toFixed(1);
    const playAll = h('button', { class: 'btn block', text: 'Play full voiceover' });
    playAll.addEventListener('click', async () => {
      if (playAll.dataset.on === '1') { stopAudio(); return; }
      playAll.dataset.on = '1'; playAll.textContent = 'Stop';
      try { await playWav(f.all[0].data); } catch (e) { toast(e.message); }
      playAll.dataset.on = ''; playAll.textContent = 'Play full voiceover';
    });
    resultBox.replaceChildren(h('div', { class: 'card stack', id: 'result' },
      h('div', { class: 'row' }, h('h2', { class: 'grow', text: 'Voiceover ready' }), h('span', { class: 'chip ok', text: `${secs}s` })),
      h('p', { class: 'sub', text: `${result.timeline.scenes.length} scene${result.timeline.scenes.length === 1 ? '' : 's'}. Word times are estimated from the audio; scene and pause times are exact.` }),
      playAll,
      h('button', { class: 'btn ghost block', id: 'share-all', onclick: () => send(f.all, 'Files') }, icon('share', 18), ' Share all files'),
      h('div', { class: 'grid2' },
        h('button', { class: 'btn ghost small', text: 'Audio WAV', onclick: () => send([f.all[0]], 'Audio') }),
        h('button', { class: 'btn ghost small', text: 'Captions', onclick: () => send([f.all[1]], 'Captions') }),
        h('button', { class: 'btn ghost small', text: 'Word captions', onclick: () => send([f.all[2]], 'Word captions') }),
        h('button', { class: 'btn ghost small', text: 'Timings', onclick: () => send([f.all[3]], 'Timings') })),
      h('button', { class: 'btn ghost block', id: 'copy-claude', onclick: async () => toast((await copyText(f.bundle)) ? 'Copied. Paste it to Claude.' : 'Could not copy on this device.') }, icon('copy', 18), ' Copy for Claude')));
  }

  // ---- wiring
  title.addEventListener('input', () => { project.title = title.value; save(); });
  voiceSel.addEventListener('change', () => { project.voice = voiceSel.value; project.preset = ''; invalidate(); paintChips(); save(); paintScenes(); });
  style.addEventListener('input', () => { project.style = style.value; project.preset = ''; invalidate(); paintChips(); save(); clearTimeout(rebuildTimer); rebuildTimer = setTimeout(paintScenes, 350); });
  script.addEventListener('input', () => { project.script = script.value; invalidate(); save(); clearTimeout(rebuildTimer); rebuildTimer = setTimeout(paintScenes, 350); });
  genBtn.addEventListener('click', generate);

  paintChips();
  root.append(h('div', { class: 'screen' },
    h('div', { class: 'topbar' }, h('button', { class: 'icon-btn sm', 'aria-label': 'Back', onclick: () => go('library') }, icon('back', 20)), h('h1', { text: 'Studio' })),
    h('div', { class: 'stack' },
      h('div', { class: 'field' }, h('label', { class: 'label', for: 'title', text: 'Title' }), title),
      h('div', { class: 'field' }, h('div', { class: 'label', text: 'Preset' }), chips),
      h('div', { class: 'field' }, h('label', { class: 'label', for: 'voice', text: 'Voice' }), voiceSel),
      h('div', { class: 'field' }, h('label', { class: 'label', for: 'style', text: 'Mood and style' }), style),
      h('div', { class: 'field' }, h('label', { class: 'label', for: 'script', text: 'Script' }), script),
      h('div', { class: 'label mt8', text: 'Scenes' }),
      sceneList, planLine, genBtn, progress, resultBox, quotaLine)));
  paintScenes();

  return () => { stopAudio(); if (busy) busy.abort(); clearTimeout(saveTimer); clearTimeout(rebuildTimer); if (project.script.trim() || project.title.trim()) projects.save(project); };
}
