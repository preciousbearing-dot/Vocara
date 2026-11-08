import { h, icon, toast } from '../dom.js';
import { store, cache, hasKey, VERSION } from '../services.js';
import { maskKey } from '../store.js';
import { buildInfo, runCheck, openSheet } from '../updater.js';
import { applyTheme } from '../theme.js';
import { DEFAULT_MODEL, testKey } from '../gemini.js';

function mb(bytes) {
  return bytes < 1048576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
}

export function renderSettings(root, { go, rerender }) {
  const s = store.get();
  const wrap = h('div', { class: 'screen' });

  const themeSeg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Theme' },
    [['system', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([val, name]) =>
      h('button', {
        'aria-pressed': String(s.theme === val), text: name,
        onclick: () => { store.set({ theme: val }); applyTheme(val); rerender(); },
      })));

  const keyNote = h('div', { 'aria-live': 'polite' });
  const testBtn = h('button', { class: 'chip plain', text: 'Test key' });
  testBtn.addEventListener('click', async () => {
    keyNote.replaceChildren(h('div', { class: 'notice mt8', text: 'Checking with Google...' }));
    try {
      const r = await testKey({ key: store.getKey(), model: store.get().model });
      keyNote.replaceChildren(h('div', { class: `notice mt8 ${r.modelAvailable ? 'ok' : ''}`.trim(),
        text: r.modelAvailable ? 'Key works and the model is available.' : `Key works, but "${store.get().model}" is not listed for it.${r.ttsModels.length ? ` Available: ${r.ttsModels.join(', ')}.` : ''}` }));
    } catch (e) {
      keyNote.replaceChildren(h('div', { class: 'notice err mt8', text: e.message }));
    }
  });

  const modelInput = h('input', { class: 'input', id: 'model', value: s.model, autocapitalize: 'off', spellcheck: 'false' });
  const saveModel = () => {
    const v = modelInput.value.trim() || DEFAULT_MODEL;
    store.set({ model: v });
    modelInput.value = v;
    toast('Model saved.');
  };

  const cacheLine = h('div', { class: 'd', text: 'Counting saved clips...' });
  const refreshCache = async () => {
    const st = await cache.stats();
    cacheLine.textContent = st.count ? `${st.count} saved clip${st.count === 1 ? '' : 's'}, ${mb(st.bytes)} on this phone` : 'Nothing saved yet';
  };
  refreshCache();

  const updLine = h('div', { class: 'd', text: 'Checking the installed version...' });
  const versionLine = h('p', { class: 'sub center mt24', text: `Vocara ${VERSION}` });
  const updBtn = h('button', { class: 'btn small', text: 'Check now' });
  let cur = { build: 0, version: VERSION };
  buildInfo().then((b) => { cur = b; updLine.textContent = b.build ? `Installed: ${b.version || VERSION}, build ${b.build}` : 'Installed: development copy'; versionLine.textContent = `Vocara ${b.version || VERSION}${b.build ? ` (build ${b.build})` : ''}`; });
  updBtn.addEventListener('click', async () => {
    updBtn.disabled = true; updBtn.textContent = 'Checking...';
    const res = await runCheck({ manual: true });
    updBtn.disabled = false; updBtn.textContent = 'Check now';
    if (res.state === 'available') { updLine.textContent = `Update available: ${res.info.version || 'new build'}`; openSheet(res.info, res.current); }
    else if (res.state === 'latest') toast('You have the latest version.');
    else toast(res.message);
  });

  wrap.append(
    h('div', { class: 'topbar' }, h('h1', { text: 'Settings' })),

    h('div', { class: 'label', text: 'Appearance' }),
    h('div', { class: 'mt8' }, themeSeg),

    h('div', { class: 'label mt24', text: 'Gemini key' }),
    h('div', { class: 'card mt8' },
      h('div', { class: 'settings-row' },
        h('div', { class: 'grow' },
          h('div', { class: 't', text: hasKey() ? 'Key saved' : 'No key yet' }),
          h('div', { class: 'd', text: hasKey() ? maskKey(store.getKey()) : 'Needed to hear and make voices' })),
        h('button', { class: 'btn small', onclick: () => go('key'), text: hasKey() ? 'Change' : 'Add key' })),
      hasKey() ? h('div', { class: 'row mt8' },
        testBtn,
        h('button', { class: 'chip peach', text: 'Remove', onclick: () => {
          if (confirm('Remove the saved key from this phone?')) { store.clearKey(); toast('Key removed.'); rerender(); }
        } })) : null,
      keyNote),

    h('div', { class: 'label mt24', text: 'Voice model' }),
    h('div', { class: 'card mt8 stack' },
      h('p', { class: 'sub', text: 'The Google model that speaks. Free access can change, so use Test key to see what your key can use.' }),
      h('label', { class: 'label', for: 'model', text: 'Model id' }),
      modelInput,
      h('div', { class: 'row' },
        h('button', { class: 'btn small', text: 'Save', onclick: saveModel }),
        h('button', { class: 'chip plain', text: 'Reset', onclick: () => { modelInput.value = DEFAULT_MODEL; saveModel(); } }))),

    h('div', { class: 'label mt24', text: 'Saved clips' }),
    h('div', { class: 'card mt8' },
      h('div', { class: 'settings-row' },
        h('div', { class: 'grow' }, h('div', { class: 't', text: 'Voice samples and takes' }), cacheLine),
        h('button', { class: 'icon-btn sm', 'aria-label': 'Clear saved clips', onclick: async () => {
          if (confirm('Delete all saved clips? They will cost quota again if you replay them.')) {
            await cache.clear(); await refreshCache(); toast('Saved clips cleared.');
          }
        } }, icon('trash', 18)))),

    h('div', { class: 'label mt24', text: 'App updates' }),
    h('div', { class: 'card mt8' },
      h('div', { class: 'settings-row' },
        h('div', { class: 'grow' }, h('div', { class: 't', text: 'Vocara updates' }), updLine),
        updBtn)),

    versionLine);
  root.append(wrap);
}
