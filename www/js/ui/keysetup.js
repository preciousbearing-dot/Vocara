import { h, icon, toast } from '../dom.js';
import { store } from '../services.js';
import { testKey } from '../gemini.js';
import { looksLikeKey } from '../store.js';

// Used in first-run setup and from Settings. onDone() runs after a key is saved.
export function renderKeySetup(root, { onDone, onSkip, onBack }) {
  let busy = false;
  const input = h('input', {
    class: 'input', type: 'password', id: 'key', autocomplete: 'off', autocapitalize: 'off',
    spellcheck: 'false', placeholder: 'Paste your key here', 'aria-describedby': 'keyhelp',
  });
  const status = h('div', { 'aria-live': 'polite' });
  const show = h('button', { class: 'chip plain', type: 'button', text: 'Show' });
  const paste = h('button', { class: 'chip plain', type: 'button', text: 'Paste' });
  const test = h('button', { class: 'btn ghost block', type: 'button', text: 'Test key' });
  const save = h('button', { class: 'btn block', type: 'button', text: 'Save and continue' });

  show.addEventListener('click', () => {
    const hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    show.textContent = hidden ? 'Hide' : 'Show';
  });
  paste.addEventListener('click', async () => {
    try {
      input.value = (await navigator.clipboard.readText()).trim();
      status.replaceChildren();
    } catch (_) {
      toast('Could not read the clipboard. Paste into the box by hand.');
    }
  });

  const setNotice = (kind, text) => status.replaceChildren(h('div', { class: `notice ${kind}`.trim(), text }));

  async function run(saveAfter) {
    const key = input.value.trim();
    if (!key) { setNotice('err', 'Paste your key first.'); return; }
    if (busy) return;
    busy = true; test.disabled = save.disabled = true;
    setNotice('', 'Checking with Google...');
    try {
      const r = await testKey({ key, model: store.get().model });
      if (saveAfter) {
        store.setKey(key);
        onDone();
        return;
      }
      setNotice('ok', r.modelAvailable
        ? 'Key works, and the voice model is available.'
        : `Key works, but the model "${store.get().model}" is not listed for it. You can change the model in Settings.${r.ttsModels.length ? ` Available: ${r.ttsModels.join(', ')}.` : ''}`);
    } catch (e) {
      // A rejected key is never saved. A network or server problem should not
      // block saving, since the key may be fine and the user may be offline.
      if (saveAfter && e.kind !== 'key') {
        store.setKey(key);
        onDone();
        return;
      }
      setNotice('err', e.message || 'That did not work.');
    } finally {
      busy = false; test.disabled = save.disabled = false;
    }
  }
  test.addEventListener('click', () => run(false));
  save.addEventListener('click', () => {
    if (!looksLikeKey(input.value) && !confirm('That does not look like a Google key (they start with AIza). Save it anyway?')) return;
    run(true);
  });

  root.replaceChildren(
    h('div', { class: 'screen full' },
      h('div', { class: 'row spread' },
        onBack ? h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: onBack }, icon('back')) : h('span'),
        onSkip ? h('button', { class: 'chip plain', onclick: onSkip, text: 'Set up later' }) : h('span')),
      h('div', { class: 'stack mt16' },
        h('h1', { text: 'Add your Gemini key' }),
        h('p', { class: 'sub', id: 'keyhelp', text: 'Vocara sends your text straight to Google using your own free key. The key is saved on this phone only.' }),
        h('div', { class: 'card stack' },
          h('div', { class: 'label', text: 'Get a free key' }),
          h('p', { class: 'sub', text: '1. Open Google AI Studio and sign in.' }),
          h('a', { class: 'chip', href: 'https://aistudio.google.com/apikey', target: '_blank', rel: 'noopener' }, 'aistudio.google.com/apikey ', icon('external', 14)),
          h('p', { class: 'sub', text: '2. Tap Create API key, then copy it.' }),
          h('p', { class: 'sub', text: '3. Come back here and paste it below.' })),
        h('div', { class: 'field' },
          h('label', { class: 'label', for: 'key', text: 'Your key' }),
          input,
          h('div', { class: 'row' }, show, paste)),
        status),
      h('div', { class: 'grow' }),
      h('div', { class: 'stack mt16' }, test, save)));
}
