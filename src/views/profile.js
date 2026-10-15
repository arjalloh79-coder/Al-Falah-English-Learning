import { h, mount } from '../h.js';
import { getState, update, reset, currentStreak } from '../engine/state.js';
import { LANGS } from '../data/ui.js';
import { t } from '../i18n.js';
import { topbar, nav } from './shell.js';
import { ALL_LESSONS } from '../data/curriculum.js';

let deferred;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; });

export function profile(go, relaunch) {
  const s = getState();
  const stat = (ico, v, l) => h('div', { class: 'tile' }, h('b', null, ico, ' ', v), h('small', null, l));
  mount(h('div', { class: 'app' }, topbar(), h('main', { class: 'screen' },
    h('h2', null, `${LANGS.find((l) => l.code === s.lang)?.flag || ''} ${t('profile')}`),
    h('div', { class: 'tiles' }, stat('🔥', currentStreak(), t('dayStreak')), stat('⚡', s.xp, t('totalXp')),
      stat('✅', Object.keys(s.done).length + '/' + ALL_LESSONS.length, t('lessonsDone')), stat('❤️', s.hearts, t('hearts'))),
    h('label', { class: 'row' }, t('dailyGoal'), h('select', { onchange: (e) => { update({ goal: +e.target.value }); } },
      [10, 20, 30, 50].map((g) => h('option', { value: g, selected: g === s.goal }, `${g} XP`)))),
    h('label', { class: 'row' }, t('sound'), h('input', { type: 'checkbox', checked: s.sound, onchange: (e) => update({ sound: e.target.checked }) })),
    h('button', { class: 'btn secondary', onclick: () => { update({ lang: null }); relaunch(); } }, `🌍 ${t('changeLang')}`),
    deferred ? h('button', { class: 'btn primary', onclick: async () => { deferred.prompt(); deferred = null; go('profile'); } }, `📲 ${t('installApp')}`) : null,
    h('button', { class: 'btn ghost danger', onclick: () => { if (confirm(t('resetConfirm'))) { reset(); relaunch(); } } }, t('reset'))),
    nav('profile', go)));
}
