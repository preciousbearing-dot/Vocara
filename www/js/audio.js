// One-clip-at-a-time player for WAV bytes.
let current = null;

export function stopAudio() {
  if (current) {
    current.audio.pause();
    URL.revokeObjectURL(current.url);
    current.done();
    current = null;
  }
}

// Resolves when playback ends or is stopped. Starting a new clip stops the old one.
export function playWav(wav) {
  stopAudio();
  const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
  const audio = new Audio(url);
  return new Promise((resolve, reject) => {
    const done = () => resolve();
    current = { audio, url, done };
    audio.addEventListener('ended', () => { if (current && current.audio === audio) { URL.revokeObjectURL(url); current = null; } resolve(); });
    audio.addEventListener('error', () => { if (current && current.audio === audio) current = null; reject(new Error('Could not play this clip.')); });
    audio.play().catch(reject);
  });
}
