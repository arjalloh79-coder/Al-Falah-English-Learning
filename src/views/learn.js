import { h } from '../h.js';
import { t, local, hasLocal } from '../i18n.js';
import { speak, sfx } from '../engine/audio.js';
import { norm, wordOverlap } from '../engine/exercises.js';
import { noteWord } from '../engine/state.js';
import { track } from '../engine/track.js';
import { ACT } from '../data/actions.js';
import { spk, slowBtn } from './speakui.js';

// "Mot en 3 temps": one word, three steps. 1 Voix (listen & repeat) -> 2 Action (do it) -> 3 Écriture (write it).
// No heart is ever lost here: it is a teaching card, not a test. Steps 1 and 2 never block the learner.
export const LEARN_XP = 5;
const PASS = 60;   // pronunciation score (%) that counts as a good try

// True when a and b differ by at most one letter (substitution, insertion or deletion).
function oneOff(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  const [s, l] = a.length < b.length ? [a, b] : [b, a];
  return s.slice(i) === l.slice(i + 1);
}

export function runLearn({ body, footer, word: w, lesson, onDone }) {
  const act = ACT[w.k] || { i: w.e || '🙌', fr: `${t('learn_invent')} « ${w.fr} »`, a: 'pulse' };
  let n = 0;   // current step: 0 voice, 1 action, 2 writing

  const foot = (cls, ...kids) => { footer.className = `foot ${cls}`.trim(); footer.replaceChildren(...kids); };
  const primary = (label, fn, disabled = false) => h('button', { class: 'btn primary big', type: 'button', disabled, onclick: fn }, label);
  const english = h('b', { class: 'word', lang: 'en' }, w.en);
  const heard = () => h('div', { class: 'promptrow center' }, spk(w.en, 'huge'), slowBtn(w.en));
  const meaning = () => h('p', { class: 'muted center' }, hasLocal(w) ? `${local(w)} · ${w.fr}` : w.fr);
  const stepper = () => h('div', { class: 'lsteps', role: 'list' },
    [['🔊', 'learn_s1'], ['🙌', 'learn_s2'], ['✍️', 'learn_s3']].map(([ico, key], i) =>
      h('div', { role: 'listitem', class: `lstep${i < n ? ' done' : ''}${i === n ? ' on' : ''}`, 'aria-current': i === n ? 'step' : null },
        h('span', null, i < n ? '✓' : ico), h('small', null, t(key)))));
  const show = (i, title, ...nodes) => { n = i; body.replaceChildren(stepper(), h('h2', null, title), ...nodes); };

  // ── Step 1: Écoute & répète ─────────────────────────────────────────────────────────────────
  function voice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let tries = 0, finished = false;
    const status = h('p', { class: 'muted center lstatus', 'aria-live': 'polite' }, '');
    const mic = h('button', { class: 'mic', type: 'button', 'aria-label': t('speakBtn'), onclick: listen }, '🎤');
    show(0, t('learn_t1'), h('div', { class: 'learn-emoji', 'aria-hidden': 'true' }, w.e || ''),
      h('div', { class: 'promptrow center' }, english, w.ph ? h('small', { class: 'sub' }, w.ph) : null), meaning(), heard(),
      h('div', { class: 'center' }, mic, h('div', null, SR ? t('speakBtn') : t('saidIt'))), status);
    foot('', h('button', { class: 'btn ghost', type: 'button', onclick: action }, `${t('skip')} →`));   // "Passer": never blocked
    setTimeout(() => speak(w.en), 250);

    function finish(score) {
      if (!finished) {
        finished = true;
        if (score != null) track('answer', { lesson, type: 'learn_voice', k: w.k, ok: score >= PASS ? 1 : 0 });
      }
      if (score != null && score >= PASS) sfx.ok();
      foot('', primary(t('continue'), action));
    }
    function listen() {
      if (!SR) { status.textContent = ''; mic.classList.add('on'); return finish(null); }    // no recognition: self-assessed
      let said = '', best = 0, failed = false;
      const r = new SR(); r.lang = 'en-US'; r.maxAlternatives = 3;
      status.textContent = t('listening'); mic.classList.add('rec');
      r.onresult = (e) => { const alts = [...e.results[0]]; said = alts[0].transcript; best = Math.max(...alts.map((a) => wordOverlap(w.en, a.transcript))); };
      r.onerror = () => { failed = true; };                                                  // offline / no permission
      r.onend = () => {
        mic.classList.remove('rec');
        if (failed && !said) { status.textContent = ''; return finish(null); }
        const sc = Math.round(best * 100); tries++;
        status.textContent = said ? `« ${said} » — ${t('pronScore')} ${sc}%` : '';
        if (sc >= PASS || tries >= 2) finish(sc); else status.textContent += `${said ? ' · ' : ''}${t('tryAgainSpeak')}`;
      };
      try { r.start(); } catch { finish(null); }
    }
  }

  // ── Step 2: Regarde & fais ──────────────────────────────────────────────────────────────────
  function action() {
    show(1, t('learn_t2'), h('span', { class: `lact a-${act.a}`, 'aria-hidden': 'true' }, act.i),
      h('p', { class: 'linstr' }, act.fr),
      h('p', { class: 'muted center' }, `${t('learn_say')} « `, h('b', { lang: 'en' }, w.en), ` » ${t('learn_doing')}`),
      meaning(), heard());
    foot('', primary(t('learn_didit'), write));
  }

  // ── Step 3: Écris ───────────────────────────────────────────────────────────────────────────
  function write() {
    let attempts = 0, finished = false;
    const t0 = Date.now(), target = norm(w.en);
    const msg = h('p', { class: 'muted center lstatus', 'aria-live': 'polite' }, '');
    const inp = h('input', { class: 'txt', type: 'text', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', enterkeyhint: 'done',
      placeholder: t('typeHere'), 'aria-label': t('typeHere'),
      oninput: () => { chk.disabled = !inp.value.trim(); },
      onkeydown: (e) => { if (e.key === 'Enter' && !chk.disabled) chk.click(); } });
    const chk = primary(t('check'), check, true);
    const hintBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => { inp.placeholder = `${w.en[0]}…`; hintBtn.remove(); inp.focus(); } }, t('learn_hint'));
    show(2, t('learn_t3'), h('div', { class: 'learn-emoji', 'aria-hidden': 'true' }, w.e || ''), meaning(), heard(), inp, msg, hintBtn);
    foot('', chk);
    setTimeout(() => { speak(w.en); inp.focus(); }, 300);

    function check() {
      if (finished) return;
      attempts++;
      const a = norm(inp.value);
      if (a === target) return end('ok');
      if (target.length >= 4 && oneOff(a, target)) return end('almost');   // one letter off still earns the word, with the right spelling shown
      if (attempts < 2) { msg.textContent = t('learn_retry'); sfx.bad(); inp.select(); return; }
      end('miss');
    }
    function end(kind) {
      finished = true; inp.disabled = true; hintBtn.remove(); msg.textContent = '';
      const ok = kind === 'ok';
      ok || kind === 'almost' ? sfx.ok() : sfx.bad();
      noteWord(w.k, ok);   // a slip puts the word back into Smart Review
      track('answer', { lesson, type: 'learn_write', k: w.k, ok: ok ? 1 : 0, ms: Math.min(Date.now() - t0, 120000) });
      const fb = kind === 'ok' ? h('div', { class: 'fb' }, h('b', null, `✓ ${t('correct')}`))
        : h('div', { class: 'fb' }, h('b', null, kind === 'almost' ? t('learn_almost') : `✗ ${t('wrong')}`), h('div', null, t('correctAnswer'), ' ', h('b', { lang: 'en' }, w.en)));
      const next = primary(t('continue'), onDone);
      foot(kind === 'miss' ? 'bad' : 'good', fb, next);
      next.focus();
    }
  }

  voice();
}
