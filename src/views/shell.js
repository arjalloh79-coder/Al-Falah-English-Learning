import { h } from '../h.js';
import { t } from '../i18n.js';
import { pickSponsor, SHOW_HOUSE_AD } from '../data/sponsors.js';
import { SPONSOR_WHATSAPP } from '../config.js';
import { track } from '../engine/track.js';
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

// Sponsor card: a paying sponsor if one is live for this placement, else the "Become a sponsor" house ad.
// Always labelled "Sponsorisé" for transparency. Impressions and taps are tracked (when the learner consented).
export function sponsorCard(place, forced) {
  const sp = forced || pickSponsor(place);
  if (!sp && !SHOW_HOUSE_AD) return null;
  const fr = (o) => (o && (o.fr || o.en)) || '';
  const house = !sp;
  const data = house
    ? { id: 'house', name: t('houseTitle'), emoji: '📣', color: '#C9963A', tag: t('houseTag'), cta: t('houseCta'),
        url: `https://wa.me/${SPONSOR_WHATSAPP}?text=${encodeURIComponent('Hello, I would like to sponsor lessons in the Al-Falah English app.')}` }
    : { id: sp.id, name: sp.name, emoji: sp.emoji || '⭐', color: sp.color || '#C9963A', tag: fr(sp.tag), cta: fr(sp.cta) || t('learnMore'), url: sp.url, logo: sp.logo };
  track('sponsor_impression', { s: data.id, place });
  const icon = data.logo
    ? h('img', { src: data.logo, alt: '', loading: 'lazy', width: 44, height: 44, onerror: (e) => { e.target.replaceWith(h('span', { class: 'sp-e' }, data.emoji)); } })
    : h('span', { class: 'sp-e' }, data.emoji);
  return h('aside', { class: 'sponsor', style: `--sc:${data.color}`, 'aria-label': t('sponsored') },
    h('small', { class: 'sp-label' }, house ? t('sponsored') + ' · ' + t('houseTitle') : t('sponsored')),
    h('div', { class: 'sp-row' }, icon, h('div', { class: 'sp-txt' }, h('b', null, data.name), h('span', null, data.tag))),
    h('a', { class: 'sp-cta', href: data.url, target: '_blank', rel: 'noopener sponsored', onclick: () => track('sponsor_click', { s: data.id, place }) }, data.cta));
}
