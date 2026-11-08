import { h, orb, toast } from '../dom.js';
import { hasKey } from '../services.js';

export function renderHome(root, { go }) {
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
          onclick: () => (hasKey() ? toast('The scene editor arrives in the next build.') : go('key')) }),
        h('button', { class: 'btn ghost block', text: 'Hear the voices', onclick: () => go('voices') }))));
}

export function renderLibrary(root) {
  root.append(
    h('div', { class: 'screen' },
      h('div', { class: 'topbar' }, h('h1', { text: 'Library' })),
      h('div', { class: 'card center stack' },
        h('h2', { text: 'No projects yet' }),
        h('p', { class: 'sub', text: 'Your finished voiceovers will be kept here.' }))));
}
