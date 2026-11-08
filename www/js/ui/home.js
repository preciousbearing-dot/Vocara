import { h, orb, toast } from '../dom.js';
import { hasKey, projects } from '../services.js';
import { icon } from '../dom.js';

export function renderHome(root, { go }) {
  const recent = projects.list()[0] || null;
  root.append(
    h('div', { class: 'screen' },
      h('div', { class: 'topbar' },
        h('div', { class: 'brand' }, orb(28, ''), 'Vocara')),
      h('div', { class: 'stack center' },
        h('div', { class: 'row', vars: { 'justify-content': 'center' } }, orb(176, 'live')),
        h('h1', { class: 'mt16', text: 'What should we voice today?' }),
        h('p', { class: 'sub', text: 'Paste a script, pick a voice and mood, export audio and captions.' })),
      h('div', { class: 'stack mt24' },
        hasKey() ? null : h('div', { class: 'notice', text: 'Add your Gemini key to start making voices.' }),
        h('button', { class: 'btn block', text: hasKey() ? 'New voiceover' : 'Add your key',
          onclick: () => go(hasKey() ? 'studio' : 'key') }),
        recent ? h('button', { class: 'btn ghost block', text: `Continue: ${recent.title || 'Untitled voiceover'}`, onclick: () => go(`studio?id=${recent.id}`) }) : null,
        h('button', { class: 'btn ghost block', text: 'Hear the voices', onclick: () => go('voices') }))));
}

export function renderLibrary(root, { go, rerender }) {
  const list = projects.list();
  const when = (t) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  root.append(
    h('div', { class: 'screen' },
      h('div', { class: 'topbar' }, h('h1', { text: 'Library' })),
      list.length
        ? h('div', { class: 'stack' }, list.map((p) => h('div', { class: 'card row proj' },
          h('button', { class: 'grow proj-open', onclick: () => go(`studio?id=${p.id}`) },
            h('div', { class: 't', text: p.title || 'Untitled voiceover' }),
            h('div', { class: 'sub', text: `${p.voice || 'Voice'} · ${when(p.updated)} · ${(p.script.match(/\S+/g) || []).length} words` })),
          h('button', { class: 'icon-btn sm', 'aria-label': 'Delete project', onclick: () => { if (confirm(`Delete "${p.title || 'Untitled voiceover'}"? Its saved audio stays in the cache.`)) { projects.remove(p.id); rerender(); } } }, icon('trash', 18)))))
        : h('div', { class: 'card center stack' },
          h('h2', { text: 'No projects yet' }),
          h('p', { class: 'sub', text: 'Your voiceovers are kept here, so you can reopen them and export again for free.' }),
          h('button', { class: 'btn', text: 'New voiceover', onclick: () => go('studio') }))));
}
