import { h } from '../h.js';
import { t } from '../i18n.js';
import { getState, currentStreak, MAX_HEARTS, msToNextHeart, todayXp } from '../engine/state.js';

export const fmtMs = (ms) => { const m = Math.ceil(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60}` : `${m} ${t('min')}`; };

export function topbar() {
  const s = getState();
  return h('header', { class: 'top' },
    h('span', { class: 'stat orange', title: t('dayStreak') }, '🔥 ', currentStreak()),
    h('span', { class: 'stat blue', title: 'XP' }, '⚡ ', s.xp),
    h('span', { class: 'stat red', title: t('hearts') }, '❤️ ', s.hearts, s.hearts < MAX_HEARTS ? h('small', null, ` ${fmtMs(msToNextHeart())}`) : null));
}
export function goalBar() {
  const x = Math.min(todayXp(), getState().goal), g = getState().goal;
  return h('div', { class: 'goal', 'aria-label': t('dailyGoal') },
    h('span', null, `🎯 ${t('dailyGoal')}: ${x}/${g} XP`),
    h('div', { class: 'bar' }, h('i', { style: `width:${(x / g) * 100}%` })));
}
export function nav(active, go) {
  const b = (id, ico, label) => h('button', { class: 'tab' + (active === id ? ' on' : ''), onclick: () => go(id) }, h('span', null, ico), label);
  return h('nav', { class: 'tabs' }, b('home', '🏠', t('learn')), b('profile', '👤', t('profile')));
}
export function toast(msg) {
  const el = h('div', { class: 'toast', role: 'status' }, msg);
  document.body.append(el); setTimeout(() => el.remove(), 2200);
}
export function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#ce82ff'];
  const box = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  for (let i = 0; i < 40; i++) box.append(h('i', { style: `left:${Math.random() * 100}%;background:${colors[i % 5]};animation-delay:${Math.random() * 0.6}s;animation-duration:${1.6 + Math.random()}s` }));
  document.body.append(box); setTimeout(() => box.remove(), 3200);
}
export function modal(content) {
  const m = h('div', { class: 'modal', role: 'dialog' }, h('div', { class: 'sheet' }, content));
  document.body.append(m); return () => m.remove();
}
