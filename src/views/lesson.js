import { h, mount } from '../h.js';
import { t, local, hasLocal } from '../i18n.js';
import { getState, update, noteWord, loseHeart, gainHeart, completeLesson, currentStreak } from '../engine/state.js';
import { norm, wordOverlap } from '../engine/exercises.js';
import { sfx, speak, ttsAvailable } from '../engine/audio.js';
import { confetti, modal } from './shell.js';
import { fmtMs, sponsorCard } from './shell.js';
import { track } from '../engine/track.js';
import { msToNextHeart } from '../engine/state.js';

const spk = (text, cls = '') => h('button', { class: `spk ${cls}`, 'aria-label': 'Écouter', onclick: () => { if (!speak(text) || !ttsAvailable()) hint(); } }, '🔊');
let hinted = false;
function hint() { if (hinted) return; hinted = true; const el = h('div', { class: 'toast' }, t('ttsMissing')); document.body.append(el); setTimeout(() => el.remove(), 3500); }

const meaning = (w) => h('span', null, local(w), !hasLocal(w) ? '' : h('small', { class: 'sub' }, ` · ${w.fr}`));

// Each renderer returns { node, ready(), result() -> {ok, answer}, auto }.
const R = {
  image(ex, ui) {
    let sel = null;
    const tiles = ex.options.map((o) => { const b = h('button', { class: 'opt tile-emoji', onclick: () => { sel = o.k; mark(tiles, b); ui.enable(); } }, h('span', { class: 'big-e' }, o.e || '❓'), h('small', null, '')); return b; });
    return { node: h('div', null, h('h2', null, t('tr_image')), h('div', { class: 'promptrow' }, spk(ex.word.en), h('b', { class: 'word' }, ex.word.en), ex.word.ph ? h('small', { class: 'sub' }, ex.word.ph) : null), h('div', { class: 'grid2' }, tiles)),
      result: () => ({ ok: sel === ex.answer, answer: `${ex.word.e} ${ex.word.en}` }) };
  },
  pick(ex, ui) {
    let sel = null;
    const btns = ex.options.map((o) => { const b = h('button', { class: 'opt', onclick: () => { sel = o.k; mark(btns, b); speak(o.en); ui.enable(); } }, o.en); return b; });
    return { node: h('div', null, h('h2', null, t('tr_pick')), h('div', { class: 'promptrow' }, h('b', { class: 'word' }, local(ex.word)), hasLocal(ex.word) ? h('small', { class: 'sub' }, ex.word.fr) : null), h('div', { class: 'stack' }, btns)),
      result: () => ({ ok: sel === ex.answer, answer: ex.word.en }) };
  },
  listen(ex, ui) {
    let sel = null;
    const btns = ex.options.map((o) => { const b = h('button', { class: 'opt', onclick: () => { sel = o.k; mark(btns, b); ui.enable(); } }, o.e ? `${o.e} ` : '', local(o)); return b; });
    setTimeout(() => speak(ex.word.en), 250);
    return { node: h('div', null, h('h2', null, t('tr_listen')), h('div', { class: 'promptrow center' }, spk(ex.word.en, 'huge'), h('button', { class: 'spk slow', onclick: () => speak(ex.word.en, true), 'aria-label': 'Lent' }, '🐢')), h('div', { class: 'stack' }, btns)),
      result: () => ({ ok: sel === ex.answer, answer: `${ex.word.en}${ex.word.ph ? ' ' + ex.word.ph : ''} = ${local(ex.word)}` }) };
  },
  type(ex, ui) {
    const inp = h('input', { class: 'txt', type: 'text', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', placeholder: t('typeHere'),
      oninput: () => (inp.value.trim() ? ui.enable() : ui.disable()), onkeydown: (e) => e.key === 'Enter' && ui.submit() });
    setTimeout(() => { speak(ex.text); inp.focus(); }, 300);
    return { node: h('div', null, h('h2', null, t('tr_type')), h('div', { class: 'promptrow center' }, spk(ex.text, 'huge'), h('button', { class: 'spk slow', onclick: () => speak(ex.text, true), 'aria-label': 'Lent' }, '🐢')), inp),
      result: () => ({ ok: norm(inp.value) === norm(ex.text), answer: ex.text }) };
  },
  bank(ex, ui) {
    const chosen = [];
    const line = h('div', { class: 'line' }), bank = h('div', { class: 'tiles-bank' });
    const tiles = ex.tiles.map((w, i) => { const b = h('button', { class: 'chip', onclick: () => {
      if (b.parentNode === bank) { line.append(b); chosen.push(i); } else { bank.append(b); chosen.splice(chosen.indexOf(i), 1); }
      chosen.length ? ui.enable() : ui.disable(); speak(w);
    } }, w); return b; });
    bank.append(...tiles);
    const order = () => [...line.children].map((c) => c.textContent).join(' ');
    return { node: h('div', null, h('h2', null, t('tr_bank')), h('div', { class: 'promptrow' }, h('b', { class: 'word' }, ex.phrase.fr)), line, bank),
      result: () => ({ ok: norm(order()) === norm(ex.phrase.en), answer: ex.phrase.en }) };
  },
  speak(ex, ui) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let said = false, heard = '', tries = 0; const status = h('p', { class: 'muted center' }, '');
    const mic = h('button', { class: 'mic', onclick: () => {
      if (!SR) { said = true; ui.enable(); mic.classList.add('on'); return; }
      const r = new SR(); r.lang = 'en-US'; r.maxAlternatives = 3;
      status.textContent = t('listening'); mic.classList.add('rec');
      r.onresult = (e) => { heard = e.results[0][0].transcript; };
      r.onerror = () => { said = true; mic.classList.remove('rec'); status.textContent = ''; ui.enable(); };  // offline/no-permission → self-assessed
      r.onend = () => { mic.classList.remove('rec'); if (said) return; tries++;
        const sc = Math.round(wordOverlap(ex.phrase.en, heard) * 100); if (sc >= 60 || tries >= 2) { said = true; status.textContent = heard ? `« ${heard} » — ${t('pronScore')} ${sc}%` : ''; ui.enable(); } else status.textContent = t('tryAgainSpeak'); };
      try { r.start(); } catch { said = true; ui.enable(); }
    } }, '🎤');
    return { node: h('div', null, h('h2', null, t('tr_speak')), h('div', { class: 'promptrow center' }, spk(ex.phrase.en, 'huge'), h('b', { class: 'word' }, ex.phrase.en)), h('p', { class: 'muted center' }, ex.phrase.fr),
      h('div', { class: 'center' }, mic, h('div', null, SR ? t('speakBtn') : t('saidIt'))), status),
      result: () => ({ ok: said, answer: ex.phrase.en }) };
  },
  read(ex, ui) {
    let sel = null; const r = ex.read;
    const btns = ex.options.map((o) => { const b = h('button', { class: 'opt', onclick: () => { sel = o; mark(btns, b); ui.enable(); } }, o); return b; });
    return { node: h('div', null, h('h2', null, t('tr_read')), h('div', { class: 'doc' }, h('b', null, r.title), h('pre', null, r.doc)),
      h('div', { class: 'promptrow' }, spk(r.q), h('b', null, r.q)), h('p', { class: 'muted small' }, r.qfr), h('div', { class: 'stack' }, btns)),
      result: () => ({ ok: sel === r.answer, answer: r.answer }) };
  },
  match(ex, ui) {
    const L = ex.pairs.map((w) => ({ k: w.k, label: w.en })), Rr = [...ex.pairs].sort(() => Math.random() - 0.5).map((w) => ({ k: w.k, label: `${w.e || ''} ${local(w)}` }));
    let a = null, left = ex.pairs.length, miss = false;
    const mk = (item, side) => { const b = h('button', { class: 'opt', 'data-side': side, onclick: () => {
      if (b.classList.contains('gone')) return;
      if (side === 'L') speak(item.label);
      if (a && a.side === side) { a.b.classList.remove('sel'); a = null; }
      if (!a) { a = { item, side, b }; b.classList.add('sel'); return; }
      if (a.item.k === item.k) { sfx.ok(); [a.b, b].forEach((x) => { x.classList.remove('sel'); x.classList.add('gone'); x.disabled = true; }); a = null; if (--left === 0) ui.finish(!miss, ''); }
      else { sfx.bad(); miss = true; ui.penalty(); [a.b, b].forEach((x) => { x.classList.add('shake'); setTimeout(() => x.classList.remove('shake', 'sel'), 400); }); a = null; }
    } }, item.label); return b; };
    return { node: h('div', null, h('h2', null, t('tr_match')), h('div', { class: 'cols' }, h('div', { class: 'stack' }, L.map((i) => mk(i, 'L'))), h('div', { class: 'stack' }, Rr.map((i) => mk(i, 'R'))))), auto: true, result: () => ({ ok: true, answer: '' }) };
  },
};
function mark(list, b) { list.forEach((x) => x.classList.toggle('sel', x === b)); }

export function runLesson({ id, exercises, practice, tip: lessonTip }, onExit) {
  const total = exercises.length; let queue = [...exercises], done = 0, mistakes = 0, hrtLost = false;
  const t0 = Date.now(); let tq = t0;
  track('lesson_start', { id });
  const bar = h('i'), footer = h('footer', { class: 'foot' }), body = h('main', { class: 'screen lessonbody' });
  const close = h('button', { class: 'x', 'aria-label': 'Quitter', onclick: () => {
    const c = modal([h('h2', null, t('quit')), h('p', { class: 'muted' }, t('quitSub')),
      h('button', { class: 'btn primary', onclick: () => c() }, t('stay')), h('button', { class: 'btn ghost danger', onclick: () => { track('lesson_quit', { id, done, total }); c(); onExit(); } }, t('leave'))]);
  } }, '✕');
  const heartsEl = h('span', { class: 'stat red' });
  const refreshHearts = () => { heartsEl.textContent = `❤️ ${getState().hearts}`; };
  mount(h('div', { class: 'app lesson' }, h('header', { class: 'lhead' }, close, h('div', { class: 'bar big' }, bar), heartsEl), body, footer));

  function loseOne() { if (practice) return; loseHeart(); refreshHearts(); if (getState().hearts <= 0) { outOfHearts(); return true; } }

  function showTip() {
    const tip = lessonTip; if (!tip) return step();
    footer.className = 'foot'; footer.replaceChildren(h('button', { class: 'btn primary big', onclick: step }, t('start')));
    body.replaceChildren(h('div', null, h('h2', null, `💡 ${t('grammarTip')}`), h('div', { class: 'doc tip' }, h('p', null, tip.fr), h('p', null, h('b', null, tip.pat)), h('p', { class: 'ex' }, spk(tip.ex), ' ', tip.ex), tip.ph ? h('p', { class: 'muted small' }, `🔈 ${tip.ph}`) : null)));
  }
  function step() {
    if (!queue.length) return finish();
    refreshHearts(); bar.style.width = `${(done / total) * 100}%`; tq = Date.now();
    const ex = queue[0], rs = {}; let btn, resolved = false;
    const ui = {
      enable: () => btn && (btn.disabled = false), disable: () => btn && (btn.disabled = true),
      submit: () => btn && !btn.disabled && btn.click(), penalty: () => { if (!hrtLost) { hrtLost = true; mistakes++; track('answer', { lesson: id, type: 'match', ok: 0 }); loseOne(); } },
      finish: () => { resolved = true; feedback(true, '', true); },
    };
    const r = R[ex.type](ex, ui); Object.assign(rs, r);
    body.replaceChildren(r.node);
    footer.className = 'foot'; footer.replaceChildren();
    if (r.auto) { btn = null; return; }
    btn = h('button', { class: 'btn primary big', disabled: true, onclick: () => { const res = r.result(); feedback(res.ok, res.answer); } }, t('check'));
    footer.append(btn);

    function feedback(ok, answer, fromMatch) {
      if (resolved && !fromMatch) return; resolved = true;
      body.querySelectorAll('input,button.opt,button.chip').forEach((x) => (x.disabled = true));
      ok ? sfx.ok() : sfx.bad();
      noteWord(ex.word?.k || ex.answer, ok);
      track('answer', { lesson: id, type: ex.type, k: ex.word?.k || ex.answer || undefined, ok: ok ? 1 : 0, ms: Math.min(Date.now() - tq, 120000) });
      if (!ok) { mistakes++; if (!fromMatch && loseOne()) return; }
      if (fromMatch && !ok) { /* hearts already deducted in penalty() */ }
      const nextBtn = h('button', { class: `btn big ${ok ? 'primary' : 'danger-solid'}`, onclick: () => {
        queue.shift(); if (ok) done++; else if (!fromMatch) queue.push({ ...ex }); else done++; hrtLost = false; step();
      } }, t('next'));
      footer.className = `foot ${ok ? 'good' : 'bad'}`;
      footer.replaceChildren(h('div', { class: 'fb' }, h('b', null, ok ? `✓ ${t('correct')}` : `✗ ${t('wrong')}`), !ok && answer ? h('div', null, t('correctAnswer'), ' ', h('b', null, answer)) : null), nextBtn);
      nextBtn.focus();
    }
  }
  function outOfHearts() {
    track('out_of_hearts', { id });
    footer.replaceChildren();
    body.replaceChildren(h('div', { class: 'center pad' }, h('div', { class: 'emoji' }, '💔'), h('h2', null, t('outOfHearts')),
      h('p', { class: 'muted' }, `${t('heartsBack')} ${fmtMs(msToNextHeart())}`), h('button', { class: 'btn primary', onclick: onExit }, t('done'))));
  }
  function finish() {
    bar.style.width = '100%';
    const acc = Math.max(0, Math.round(((total - Math.min(mistakes, total)) / total) * 100));
    const xp = practice ? 5 : 10 + (mistakes === 0 ? 5 : 0);
    let info = { streak: currentStreak() };
    if (practice) { gainHeart(); update({ xp: getState().xp + xp }); } else info = completeLesson(id, xp, mistakes === 0);
    track('lesson_complete', { id, xp, acc, mis: mistakes, ms: Math.min(Date.now() - t0, 3600000) });
    sfx.win(); confetti();
    footer.className = 'foot'; footer.replaceChildren(h('button', { class: 'btn primary big', onclick: onExit }, t('continue')));
    body.replaceChildren(h('div', { class: 'center pad win' }, h('div', { class: 'emoji bounce' }, '🏆'), h('h1', null, t('lessonComplete')),
      h('div', { class: 'tiles' }, h('div', { class: 'tile y' }, h('b', null, `⚡ +${xp}`), h('small', null, t('xpEarned'))), h('div', { class: 'tile g' }, h('b', null, `🎯 ${acc}%`), h('small', null, t('accuracy'))),
        h('div', { class: 'tile o' }, h('b', null, `🔥 ${info.streak}`), h('small', null, t('streakDays')))),
      info.firstToday && info.streak > 1 ? h('p', { class: 'streakmsg' }, `🔥 ${t('legendary')}`) : null,
      sponsorCard('complete')));
    refreshHearts();
  }
  showTip();
}
