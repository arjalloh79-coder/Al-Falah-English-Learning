import { getState } from './state.js';

let ctx;
function tone(freq, start, dur, type = 'sine', vol = 0.15) {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    const t0 = ctx.currentTime + start;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + dur);
  } catch { /* audio unavailable */ }
}
export const sfx = {
  ok: () => getState().sound && (tone(660, 0, 0.12), tone(880, 0.1, 0.18)),
  bad: () => getState().sound && (tone(220, 0, 0.18, 'sawtooth', 0.1), tone(165, 0.15, 0.25, 'sawtooth', 0.1)),
  win: () => getState().sound && [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25)),
};

// English text-to-speech using the device voice (works offline when an English voice is installed).
export const ttsAvailable = () => 'speechSynthesis' in window && speechSynthesis.getVoices().some((v) => v.lang.startsWith('en'));
export function speak(text, slow = false) {
  if (!('speechSynthesis' in window)) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = slow ? 0.6 : 0.85;
  const v = speechSynthesis.getVoices().find((x) => x.lang.startsWith('en'));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
  return true;
}
if ('speechSynthesis' in window) speechSynthesis.getVoices();
