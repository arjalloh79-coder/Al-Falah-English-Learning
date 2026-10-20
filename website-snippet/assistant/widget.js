/* Al-Falah website assistant: chat bubble. One file, no dependencies.
   Add to any page, before </body>:
   <script src="/assistant/widget.js" defer data-af-assistant></script>
   Optional attributes: data-endpoint="/assistant/chat.php" data-whatsapp="224611351302"
                        data-privacy="/privacy.html" data-lang="fr|en" (default: follows <html lang>) */
(function () {
  if (window.__afAssistant) return;
  window.__afAssistant = true;

  var me = document.currentScript || document.querySelector('script[data-af-assistant]');
  var ds = (me && me.dataset) || {};
  var ENDPOINT = ds.endpoint || '/assistant/chat.php';
  var WA = (ds.whatsapp || '224611351302').replace(/\D/g, '');
  var PRIVACY = ds.privacy || '/privacy.html';
  var STORE = 'af-assistant-v1';

  var T = {
    fr: {
      open: 'Besoin d’aide ?', title: 'Assistant Al-Falah', ai: 'IA', close: 'Fermer', reset: 'Nouvelle conversation',
      hello: 'Bonjour ! 👋 Je suis l’assistant IA d’Al-Falah Marketing. Posez-moi vos questions sur nos services ou sur l’appli d’anglais gratuite.',
      ph: 'Écrivez votre question…', send: 'Envoyer', typing: 'L’assistant écrit…',
      chips: ['Quels sont vos services ?', 'Comment démarrer un projet ?', 'L’appli d’anglais gratuite'],
      note: 'Assistant IA : il peut se tromper.', wa: 'Parler à une personne (WhatsApp)', privacy: 'Confidentialité',
      errGeneric: 'Désolé, je n’arrive pas à répondre pour le moment. Vous pouvez nous écrire directement sur WhatsApp.',
      errLimit: 'Vous avez posé beaucoup de questions. Réessayez plus tard ou écrivez-nous sur WhatsApp.',
      errBusy: 'L’assistant est très sollicité en ce moment. Écrivez-nous sur WhatsApp, nous répondons vite.',
      waText: 'Bonjour, je vous contacte depuis le site Al-Falah Marketing.'
    },
    en: {
      open: 'Need help?', title: 'Al-Falah Assistant', ai: 'AI', close: 'Close', reset: 'New conversation',
      hello: 'Hello! 👋 I’m the AI assistant of Al-Falah Marketing. Ask me about our services or our free English app.',
      ph: 'Type your question…', send: 'Send', typing: 'The assistant is typing…',
      chips: ['What services do you offer?', 'How do I start a project?', 'The free English app'],
      note: 'AI assistant: it can make mistakes.', wa: 'Talk to a person (WhatsApp)', privacy: 'Privacy',
      errGeneric: 'Sorry, I can’t answer right now. You can message us directly on WhatsApp.',
      errLimit: 'You’ve asked a lot of questions. Please try again later or message us on WhatsApp.',
      errBusy: 'The assistant is very busy right now. Message us on WhatsApp, we reply quickly.',
      waText: 'Hello, I’m contacting you from the Al-Falah Marketing website.'
    }
  };

  function pickLang() {
    var l = (ds.lang || document.documentElement.lang || navigator.language || 'fr').slice(0, 2).toLowerCase();
    return l === 'en' ? 'en' : 'fr';
  }
  var lang = pickLang();
  var t = function (k) { return T[lang][k]; };

  var msgs = [];                 // [{role, content}] real conversation sent to the server
  try { msgs = JSON.parse(sessionStorage.getItem(STORE) || '[]') || []; } catch (e) { msgs = []; }
  var save = function () { try { sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-20))); } catch (e) { /* storage blocked */ } };

  var host = document.createElement('div');
  host.id = 'af-assistant-host';
  var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;

  root.innerHTML =
    '<style>' +
    ':host{all:initial}' +
    '*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '.wrap{--navy:#0D1B2A;--card:#16293D;--line:#254260;--gold:#C9963A;--gold2:#E8B455;--ivory:#F5EDD8;--mute:#b9ad90;position:fixed;right:16px;bottom:16px;z-index:2147483000;font-size:16px;line-height:1.45;color:var(--ivory)}' +
    'button{font:inherit;cursor:pointer}' +
    '.launch{display:flex;align-items:center;gap:8px;background:var(--gold);color:var(--navy);border:0;border-radius:999px;padding:0 18px 0 14px;height:54px;font-weight:800;box-shadow:0 6px 20px rgba(0,0,0,.35)}' +
    '.launch svg{width:26px;height:26px;flex:none}' +
    '.launch:focus-visible,.hd button:focus-visible,.chip:focus-visible,.send:focus-visible,a:focus-visible,textarea:focus-visible{outline:3px solid var(--gold2);outline-offset:2px}' +
    '.panel{display:none;flex-direction:column;width:380px;max-width:calc(100vw - 32px);height:min(600px,calc(100dvh - 32px));background:var(--navy);border:1px solid var(--line);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.5);overflow:hidden}' +
    '.open .panel{display:flex}.open .launch{display:none}' +
    '.hd{display:flex;align-items:center;gap:8px;padding:12px 12px 12px 16px;background:var(--card);border-bottom:1px solid var(--line)}' +
    '.hd b{font:700 17px Georgia,serif;color:var(--gold2)}' +
    '.badge{background:rgba(201,150,58,.18);color:var(--gold2);border:1px solid var(--gold);border-radius:999px;padding:1px 8px;font-size:12px;font-weight:800}' +
    '.sp{flex:1}' +
    '.hd button{background:none;border:1px solid var(--line);color:var(--ivory);border-radius:10px;width:38px;height:38px;font-size:18px}' +
    '.log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}' +
    '.m{max-width:86%;padding:10px 13px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere}' +
    '.m.bot{align-self:flex-start;background:var(--card);border:1px solid var(--line);border-bottom-left-radius:4px}' +
    '.m.me{align-self:flex-end;background:var(--gold);color:var(--navy);font-weight:600;border-bottom-right-radius:4px}' +
    '.m.err{align-self:flex-start;background:#3a1f26;border:1px solid #7a3a46}' +
    '.m a{color:var(--gold2)}.m.me a{color:var(--navy)}' +
    '.chips{display:flex;flex-wrap:wrap;gap:8px}' +
    '.chip{background:none;border:1px solid var(--gold);color:var(--gold2);border-radius:999px;padding:8px 13px;font-weight:700;font-size:14px}' +
    '.typing{align-self:flex-start;color:var(--mute);font-size:14px}' +
    '.ft{border-top:1px solid var(--line);padding:10px 12px 12px;background:var(--navy)}' +
    'form{display:flex;gap:8px;align-items:flex-end}' +
    'textarea{flex:1;resize:none;max-height:110px;min-height:44px;background:var(--card);border:1px solid var(--line);border-radius:12px;color:var(--ivory);padding:10px 12px;font-size:16px;line-height:1.35}' +
    'textarea::placeholder{color:var(--mute)}' +
    '.send{background:var(--gold);color:var(--navy);border:0;border-radius:12px;height:44px;padding:0 16px;font-weight:800}.send:disabled{opacity:.5;cursor:default}' +
    '.meta{display:flex;flex-wrap:wrap;gap:4px 12px;justify-content:space-between;margin-top:8px;font-size:12.5px;color:var(--mute)}' +
    '.meta a{color:var(--gold2)}' +
    '@media (max-width:520px){.wrap{right:12px;bottom:12px}.launch .lbl{display:none}.launch{padding:0 14px}' +
    '.open{inset:0;right:0;bottom:0}.panel{width:100vw;max-width:100vw;height:100dvh;border-radius:0;border:0}' +
    '.ft{padding-bottom:max(12px,env(safe-area-inset-bottom))}}' +
    '@media (prefers-reduced-motion:no-preference){.m{animation:pop .15s ease-out}@keyframes pop{from{opacity:0;transform:translateY(4px)}}}' +
    '</style>' +
    '<div class="wrap" id="wrap">' +
    '<button class="launch" id="launch" type="button" aria-haspopup="dialog" aria-expanded="false">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-4.6A8 8 0 1 1 21 12z"/></svg>' +
    '<span class="lbl" id="open"></span></button>' +
    '<div class="panel" id="panel" role="dialog" aria-modal="false" aria-labelledby="ttl">' +
    '<div class="hd"><b id="ttl"></b><span class="badge" id="ai"></span><span class="sp"></span>' +
    '<button type="button" id="reset" title="">↻</button><button type="button" id="close" title="">✕</button></div>' +
    '<div class="log" id="log" role="log" aria-live="polite"></div>' +
    '<div class="ft"><form id="form" autocomplete="off"><textarea id="inp" rows="1" maxlength="600"></textarea>' +
    '<button class="send" id="send" type="submit"></button></form>' +
    '<div class="meta"><span id="note"></span><span><a id="wa" target="_blank" rel="noopener"></a> · <a id="pv" target="_blank" rel="noopener"></a></span></div></div>' +
    '</div></div>';

  var $ = function (id) { return root.getElementById ? root.getElementById(id) : root.querySelector('#' + id); };
  var wrap = $('wrap'), log = $('log'), inp = $('inp'), sendBtn = $('send'), launch = $('launch');
  var busy = false;

  function labels() {
    $('open').textContent = t('open');
    launch.setAttribute('aria-label', t('open'));
    $('ttl').textContent = t('title'); $('ai').textContent = t('ai');
    $('close').title = t('close');
    $('reset').title = t('reset'); $('reset').setAttribute('aria-label', t('reset'));
    $('close').setAttribute('aria-label', t('close'));
    inp.placeholder = t('ph'); inp.setAttribute('aria-label', t('ph'));
    sendBtn.textContent = t('send'); $('note').textContent = t('note');
    var w = $('wa'); w.textContent = t('wa'); w.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t('waText'));
    var p = $('pv'); p.textContent = t('privacy'); p.href = PRIVACY;
  }

  // Safe text rendering: only text nodes, **bold** and clickable https links. Never innerHTML.
  function fill(el, text) {
    el.textContent = '';
    String(text).split(/(\*\*[^*\n]+\*\*|https?:\/\/[^\s<>()]+)/g).forEach(function (part) {
      if (!part) return;
      if (/^\*\*.+\*\*$/.test(part)) { var b = document.createElement('strong'); b.textContent = part.slice(2, -2); el.appendChild(b); }
      else if (/^https?:\/\//.test(part)) {
        var tail = (part.match(/[.,;:!?]+$/) || [''])[0], url = part.slice(0, part.length - tail.length);
        var a = document.createElement('a'); a.href = url; a.textContent = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        el.appendChild(a); if (tail) el.appendChild(document.createTextNode(tail));
      } else el.appendChild(document.createTextNode(part));
    });
  }
  function bubble(cls, text) {
    var d = document.createElement('div'); d.className = 'm ' + cls; fill(d, text); log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function render() {
    log.textContent = '';
    bubble('bot', t('hello'));
    if (!msgs.length) {
      var c = document.createElement('div'); c.className = 'chips';
      t('chips').forEach(function (q) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = q;
        b.addEventListener('click', function () { ask(q); }); c.appendChild(b);
      });
      log.appendChild(c);
    }
    msgs.forEach(function (m) { bubble(m.role === 'user' ? 'me' : 'bot', m.content); });
  }

  function ask(text) {
    text = String(text || '').trim().slice(0, 600);
    if (!text || busy) return;
    busy = true; sendBtn.disabled = true;
    msgs.push({ role: 'user', content: text }); save(); render();
    var typing = document.createElement('div'); typing.className = 'typing'; typing.textContent = t('typing'); log.appendChild(typing); log.scrollTop = log.scrollHeight;
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 40000);
    fetch(ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgs.slice(-10) }), signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j }; });
    }).then(function (res) {
      if (res.status === 200 && res.j.reply) { msgs.push({ role: 'assistant', content: String(res.j.reply) }); save(); render(); }
      else { render(); bubble('err', res.status === 429 ? t('errLimit') : (res.status === 503 ? t('errBusy') : t('errGeneric'))); }
    }).catch(function () { render(); bubble('err', t('errGeneric')); })
      .then(function () { clearTimeout(timer); busy = false; sendBtn.disabled = false; });
  }

  function open() {
    wrap.classList.add('open'); launch.setAttribute('aria-expanded', 'true'); render();
    if (window.matchMedia && matchMedia('(min-width:521px)').matches) inp.focus();
  }
  function close() { wrap.classList.remove('open'); launch.setAttribute('aria-expanded', 'false'); launch.focus(); }

  launch.addEventListener('click', open);
  $('close').addEventListener('click', close);
  $('reset').addEventListener('click', function () { msgs = []; save(); render(); });
  $('form').addEventListener('submit', function (e) { e.preventDefault(); var v = inp.value; inp.value = ''; inp.style.height = ''; ask(v); });
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('form').requestSubmit ? $('form').requestSubmit() : sendBtn.click(); } });
  inp.addEventListener('input', function () { inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight, 110) + 'px'; });
  root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && wrap.classList.contains('open')) close(); });

  // Follow the page language if the site switches it (<html lang> changes).
  if (window.MutationObserver && !ds.lang) {
    new MutationObserver(function () {
      var nl = pickLang(); if (nl !== lang) { lang = nl; labels(); if (wrap.classList.contains('open')) render(); }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  labels();
  function mount() { document.body.appendChild(host); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
