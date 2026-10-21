import { h } from '../h.js';
import { t } from '../i18n.js';
import { speak, ttsAvailable } from '../engine/audio.js';

// Small shared UI pieces for the lesson screens (pronunciation buttons).
let hinted = false;
export function hint() {
  if (hinted) return;
  hinted = true;
  const el = h('div', { class: 'toast' }, t('ttsMissing'));
  document.body.append(el);
  setTimeout(() => el.remove(), 3500);
}

export const spk = (text, cls = '') => h('button', { class: `spk ${cls}`, type: 'button', 'aria-label': 'Écouter', onclick: () => { if (!speak(text) || !ttsAvailable()) hint(); } }, '🔊');
export const slowBtn = (text) => h('button', { class: 'spk slow', type: 'button', 'aria-label': 'Lent', onclick: () => speak(text, true) }, '🐢');
