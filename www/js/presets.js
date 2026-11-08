// Ready-made voice + mood combinations. The style is a plain instruction put in front of the text.
export const PRESETS = [
  { id: 'thesis', name: 'Thesis narrator', voice: 'Charon', style: 'Say in a calm, deep documentary narrator voice, measured pace, quiet gravity' },
  { id: 'hype', name: 'Hype explainer', voice: 'Puck', style: 'Say with bright energy and curiosity, like an excited science YouTuber' },
  { id: 'whisper', name: 'Whispered story', voice: 'Enceladus', style: 'Say in a soft, close whisper, slowly, like telling a secret' },
  { id: 'teacher', name: 'Warm teacher', voice: 'Sulafat', style: 'Say warmly and clearly, like a kind teacher explaining to a student' },
  { id: 'plain', name: 'Plain', voice: '', style: '' },
];
export const findPreset = (id) => PRESETS.find((p) => p.id === id) || null;
