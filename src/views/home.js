import { h, mount } from '../h.js';
import { UNITS, ALL_LESSONS } from '../data/curriculum.js';
import { getState, msToNextHeart } from '../engine/state.js';
import { t } from '../i18n.js';
import { topbar, goalBar, nav, toast, modal, fmtMs } from './shell.js';
import { buildPractice } from '../engine/exercises.js';
import { unitSponsor } from '../data/sponsors.js';
import { track } from '../engine/track.js';
const seen = new Set();

export function home(go, startLesson, startPractice) {
  const s = getState();
  const unlocked = (id) => { const i = ALL_LESSONS.findIndex((l) => l.id === id); return i === 0 || !!s.done[ALL_LESSONS[i - 1].id]; };
  const firstOpen = ALL_LESSONS.find((l) => !s.done[l.id])?.id;
  const guard = (fn) => () => {
    if (s.hearts <= 0) return noHearts(startPractice);
    fn();
  };
  const path = UNITS.map((u) => {
    const nodes = u.lessons.map((l, i) => {
      const ok = unlocked(l.id), done = !!s.done[l.id], cur = l.id === firstOpen;
      const off = [0, 56, 28, -28, -56][i % 5];
      return h('div', { class: 'nodewrap', style: `transform:translateX(${off}px)` },
        cur ? h('div', { class: 'startbubble' }, t('start')) : null,
        h('button', { class: `node ${done ? 'done' : ok ? 'open' : 'lock'}${cur ? ' cur' : ''}`, style: `--c:${u.color}`,
          'aria-label': `${u.title.fr} ${i + 1}`,
          onclick: ok ? guard(() => startLesson(l.id)) : () => toast(t('locked')) }, done ? '✓' : ok ? '★' : '🔒'));
    });
    return h('section', { class: 'unit' },
      h('div', { class: 'unithead', style: `background:${u.color}` },
        h('div', null, h('small', null, `${u.emoji}  ${UNITS.indexOf(u) + 1}`), h('b', null, u.title.fr), h('small', null, u.title.en),
          (() => { const sp = unitSponsor(u.id); if (!sp) return null;
            if (!seen.has(sp.id)) { seen.add(sp.id); track('sponsor_impression', { s: sp.id, place: 'unit' }); }
            return h('a', { class: 'unit-sp', href: sp.url, target: '_blank', rel: 'noopener sponsored', onclick: () => track('sponsor_click', { s: sp.id, place: 'unit' }) }, `${t('presentedBy')} ${sp.emoji || ''} ${sp.name}`); })())),
      h('div', { class: 'nodes' }, nodes));
  });
  const doneIds = Object.keys(s.done);
  mount(h('div', { class: 'app' }, topbar(), h('main', { class: 'screen' }, goalBar(), ...path,
    doneIds.length ? h('button', { class: 'btn secondary practice', onclick: guard(() => startPractice()) }, `🔁 ${t('practice')}`) : null),
    nav('home', go)));
  requestAnimationFrame(() => document.querySelector('.node.cur')?.scrollIntoView({ block: 'center' }));
}

export function noHearts(startPractice) {
  const close = modal([
    h('div', { class: 'emoji' }, '💔'), h('h2', null, t('outOfHearts')),
    h('p', { class: 'muted' }, `${t('heartsBack')} ${fmtMs(msToNextHeart())}`),
    h('button', { class: 'btn primary', onclick: () => { close(); startPractice(); } }, t('practiceHeart')),
    h('button', { class: 'btn ghost', onclick: () => close() }, t('done'))]);
}
