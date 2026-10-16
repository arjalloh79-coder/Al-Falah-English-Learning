import { h, mount } from '../h.js';
import { t } from '../i18n.js';
import { setConsent, track } from '../engine/track.js';
import { getState } from '../engine/state.js';

export function consent(done) {
  const name = h('input', { class: 'txt', type: 'text', maxlength: 40, placeholder: t('consentName'), autocomplete: 'nickname' });
  mount(h('main', { class: 'screen center' },
    h('div', { class: 'logo' }, '🔒'), h('h1', null, t('consentTitle')),
    h('p', { class: 'muted' }, t('consentBody')), name,
    h('button', { class: 'btn primary big', onclick: () => { setConsent(true, name.value); track('app_open', { lang: getState().lang || '', standalone: matchMedia('(display-mode: standalone)').matches ? 1 : 0, online: navigator.onLine ? 1 : 0 }); done(); } }, t('consentYes')),
    h('button', { class: 'btn ghost', onclick: () => { setConsent(false); done(); } }, t('consentNo'))));
}
