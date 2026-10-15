import { h, mount } from '../h.js';
import { LANGS } from '../data/ui.js';
import { update } from '../engine/state.js';
import { t } from '../i18n.js';

export function onboarding(done) {
  let sel = null;
  const btn = h('button', { class: 'btn primary big', disabled: true, onclick: () => { update({ lang: sel }); done(); } }, t('continue'));
  const cards = LANGS.map((l) => {
    const c = h('button', { class: 'langcard', onclick: () => {
      sel = l.code; cards.forEach((x) => x.classList.toggle('on', x === c)); btn.disabled = false;
    } }, h('span', { class: 'flag' }, l.flag),
      h('span', { class: 'ltxt' }, h('b', null, l.native), h('small', null, l.note, l.draft ? ` · ${t('draftBadge')}` : '')));
    return c;
  });
  mount(h('main', { class: 'screen center' },
    h('div', { class: 'logo' }, '🇬🇳'),
    h('h1', null, t('appName')), h('p', { class: 'muted' }, t('tagline')),
    h('h2', null, t('chooseLang')), h('p', { class: 'muted small' }, t('chooseLangSub')),
    h('div', { class: 'langs' }, cards), btn));
}
