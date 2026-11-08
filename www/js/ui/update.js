import { h, icon } from '../dom.js';
import { formatSize, noteLines } from '../update.js';

// Bottom sheet with the update details. onLater runs when dismissed.
export function showUpdateSheet(info, { currentVersion, onLater }) {
  document.querySelectorAll('.sheet-scrim').forEach((n) => n.remove());
  const close = () => { scrim.remove(); if (onLater) onLater(); };
  const lines = noteLines(info.notes);
  const scrim = h('div', { class: 'sheet-scrim', onclick: (e) => { if (e.target === scrim) close(); } },
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
        h('a', { class: 'btn block', href: info.url, target: '_blank', rel: 'noopener', onclick: () => setTimeout(close, 300) }, icon('external', 18), ' Download and install'),
        h('button', { class: 'btn ghost block', text: 'Later', onclick: close }),
        h('p', { class: 'sub center', text: 'Android will ask you to confirm the install. Allow installs from your browser if it asks.' }))));
  document.body.append(scrim);
}
