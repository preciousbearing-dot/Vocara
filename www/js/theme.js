// Applies the chosen theme. 'system' follows the phone and updates live.
const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
let mode = 'system';

function paint() {
  const dark = mode === 'dark' || (mode === 'system' && mq && mq.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export function applyTheme(next) {
  mode = next;
  paint();
}

if (mq && mq.addEventListener) mq.addEventListener('change', paint);
