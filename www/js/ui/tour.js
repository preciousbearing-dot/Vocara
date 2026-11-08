import { h, icon, orb } from '../dom.js';

function barsArt() {
  const heights = [34, 58, 90, 64, 110, 76, 48, 96, 70, 40, 84, 56];
  return h('div', { class: 'bars', 'aria-hidden': 'true' },
    heights.map((n, i) => h('i', { vars: { height: `${n}px`, 'animation-delay': `${i * 0.11}s` } })));
}

const SLIDES = [
  {
    art: () => orb(190, 'live'),
    title: 'Your script, in a real voice',
    text: 'Paste what you wrote, pick a voice and a mood, and Vocara turns it into narration for your videos.',
  },
  {
    art: () => h('div', { class: 'tags-demo', 'aria-hidden': 'true' },
      h('div', { class: 'line', text: 'Fear is older than words.' }),
      h('span', { class: 'chip', text: 'pause 0.6s' }),
      h('div', { class: 'line', text: 'And it still shapes us.' })),
    title: 'Direct every scene',
    text: 'Add exact pauses and mood tags, and redo a single line without redoing the whole video.',
  },
  {
    art: barsArt,
    title: 'Never pay twice',
    text: 'Every clip is saved on your phone. Replays, previews and repeats cost nothing from your free quota.',
  },
  {
    art: () => h('div', { class: 'icon-btn accent', vars: { width: '96px', height: '96px' } }, icon('key', 44)),
    title: 'Your key stays with you',
    text: 'Vocara uses your own free Gemini key and talks straight to Google. No account, no server in between.',
  },
];

// onDone is called when the tour ends, either by finishing or skipping.
export function renderTour(root, onDone) {
  let i = 0;
  const paint = () => {
    const s = SLIDES[i];
    const last = i === SLIDES.length - 1;
    root.replaceChildren(
      h('div', { class: 'screen full' },
        h('div', { class: 'row spread' },
          h('div', { class: 'brand' }, orb(28, ''), 'Vocara'),
          last ? h('span') : h('button', { class: 'chip plain', onclick: onDone, text: 'Skip' })),
        h('div', { class: 'tour slide-in', key: i },
          h('div', { class: 'art' }, s.art()),
          h('h1', { text: s.title }),
          h('p', { class: 'sub', text: s.text }),
          h('div', { class: 'dots', 'aria-label': `Step ${i + 1} of ${SLIDES.length}` },
            SLIDES.map((_, n) => h('i', { class: n === i ? 'on' : '' })))),
        h('button', {
          class: 'btn block',
          onclick: () => { if (last) onDone(); else { i += 1; paint(); } },
          text: last ? 'Set up my key' : 'Next',
        })));
  };
  paint();
}
