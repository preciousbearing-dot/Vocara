import { h, icon, toast } from '../dom.js';
import { formatSize, noteLines, progressText } from '../update.js';
import { updatePlugin } from './native.js';

// Bottom sheet: update details, then download INSIDE the app with progress, then the Android installer.
// onLater runs when the person dismisses it with Later (not while a download is running).
export function showUpdateSheet(info, { currentVersion, onLater }) {
  document.querySelectorAll('.sheet-scrim').forEach((n) => n.remove());
  const native = updatePlugin();
  let poll = null;
  let st = null;
  let installing = false;

  const stopPoll = () => { clearInterval(poll); poll = null; };
  const close = () => { stopPoll(); scrim.remove(); };
  const later = () => { close(); if (onLater) onLater(); };

  const lines = noteLines(info.notes);
  const bar = h('i');
  const barBox = h('div', { class: 'prog hidden', role: 'progressbar', 'aria-label': 'Download progress' }, bar);
  const status = h('p', { class: 'sub center' });
  const main = h('button', { class: 'btn block', id: 'update-main' });
  const secondary = h('button', { class: 'btn ghost block' });
  const hint = h('p', { class: 'sub center', text: 'Android will ask you to confirm the install.' });

  function paint() {
    const s = st ? st.state : 'idle';
    const running = s === 'running' || s === 'waiting';
    barBox.classList.toggle('hidden', !(running || s === 'ready'));
    bar.style.setProperty('--pct', `${s === 'ready' ? 100 : (st && st.pct) || 0}%`);
    status.textContent = st && s !== 'idle' ? progressText(st) : '';
    if (running) {
      main.textContent = 'Downloading...'; main.disabled = true;
      secondary.textContent = 'Cancel download';
      secondary.onclick = async () => { await native.cancel(); st = await native.status(); stopPoll(); paint(); };
    } else if (s === 'ready') {
      main.disabled = false;
      main.textContent = st.allowed === false ? 'Allow installs, then install' : 'Install now';
      main.onclick = install;
      secondary.textContent = 'Later'; secondary.onclick = later;
    } else {
      main.disabled = false;
      main.textContent = s === 'error' ? 'Try again' : `Download and install (${formatSize(info.size)})`;
      main.onclick = start;
      secondary.textContent = 'Later'; secondary.onclick = later;
    }
  }

  async function refresh() {
    st = await native.status();
    if (st.state === 'ready') { stopPoll(); paint(); await install(true); return; }
    if (st.state === 'error' || st.state === 'idle') stopPoll();
    paint();
  }

  async function start() {
    try {
      await native.download({ url: info.url, bytes: info.size || 0 });
      stopPoll();
      poll = setInterval(refresh, 500);
      await refresh();
    } catch (e) { toast('Could not start the download.'); }
  }

  async function install(auto = false) {
    if (installing) return;
    try {
      const s = await native.status();
      if (s.allowed === false) {
        toast('Allow Vocara to install updates, then come back and tap Install.');
        await native.openSettings();
        return;
      }
      installing = true;
      await native.install();
    } catch (e) { toast(e && e.message ? e.message : 'Android could not open the installer.'); }
    finally { setTimeout(() => { installing = false; }, 1500); }
  }

  const scrim = h('div', { class: 'sheet-scrim', onclick: (e) => { if (e.target === scrim && !(st && (st.state === 'running' || st.state === 'waiting'))) later(); } },
    h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Update available' },
      h('div', { class: 'row' },
        h('div', { class: 'grow' },
          h('div', { class: 'label', text: 'Update available' }),
          h('h2', { text: info.version ? `Vocara ${info.version}` : 'A new version of Vocara' })),
        h('span', { class: 'chip', text: formatSize(info.size) })),
      h('p', { class: 'sub mt8', text: `You have ${currentVersion || 'an older version'}. Your key and saved clips stay on your phone.` }),
      h('div', { class: 'label mt16', text: 'What is new' }),
      lines.length
        ? h('ul', { class: 'notes' }, lines.map((l) => h('li', { text: l })))
        : h('p', { class: 'sub', text: 'Improvements and fixes.' }),
      h('div', { class: 'stack mt16' },
        barBox, status,
        native
          ? [main, secondary, hint]
          // Browser only (no native plugin): fall back to opening the file link.
          : [h('a', { class: 'btn block', href: info.url, target: '_blank', rel: 'noopener', onclick: () => setTimeout(later, 300) }, icon('external', 18), ' Download'),
            h('button', { class: 'btn ghost block', text: 'Later', onclick: later })])));
  document.body.append(scrim);

  if (native) {
    native.status().then((s) => {
      st = s;
      paint();
      if (s.state === 'running' || s.state === 'waiting') poll = setInterval(refresh, 500);
    }).catch(() => paint());
  }
}
