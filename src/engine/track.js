// Anonymous, consent-based usage tracking. Offline-first: events queue locally and are sent in batches
// when the phone is online. Disabled entirely unless ANALYTICS_URL is set. Never stores phone, GPS or IP.
import { ANALYTICS_URL, APP_VERSION } from '../config.js';
import { getState } from './state.js';

const K = 'anglais-gn-track', Q = 'anglais-gn-queue', MAX_Q = 600, BATCH = 60;
const rnd = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => ((Math.random() * 16) | 0).toString(16)));
const rd = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };

let id = rd(K, null) || { uid: rnd(), consent: null, name: '' };
if (!rd(K, null)) wr(K, id);
const sid = rnd().slice(0, 8);
let queue = rd(Q, []), timer = 0, sending = false;

export const trackEnabled = () => !!ANALYTICS_URL;
export const needsConsent = () => trackEnabled() && id.consent === null;
export const hasConsent = () => trackEnabled() && id.consent === true;
export const trackName = () => id.name;

export function setConsent(yes, name = '') {
  id.consent = !!yes; id.name = yes ? String(name).trim().slice(0, 40) : '';
  wr(K, id);
  if (yes) { track('consent', { yes: 1 }); if (id.name) track('name_set', {}); } else forgetMe(false);
}
export function setName(name) { id.name = String(name).trim().slice(0, 40); wr(K, id); if (hasConsent()) track('name_set', {}); }

export function track(type, d = {}) {
  if (!hasConsent()) return;
  queue.push({ i: rnd().slice(0, 12), t: Date.now(), y: type, d });
  if (queue.length > MAX_Q) queue = queue.slice(-MAX_Q);
  wr(Q, queue);
  clearTimeout(timer); timer = setTimeout(flush, queue.length >= 12 ? 300 : 4000);
}

async function post(body) {
  const r = await fetch(ANALYTICS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body), keepalive: true });
  return r.ok;
}
export async function flush() {
  if (!hasConsent() || sending || !queue.length || navigator.onLine === false) return;
  sending = true;
  try {
    const batch = queue.slice(0, BATCH);
    const ok = await post({ uid: id.uid, sid, v: APP_VERSION, name: id.name, ul: getState().lang || '',
      dev: { w: innerWidth, h: innerHeight, lang: navigator.language, pwa: matchMedia('(display-mode: standalone)').matches ? 1 : 0 }, events: batch });
    if (ok) { queue = queue.slice(batch.length); wr(Q, queue); if (queue.length) { sending = false; return flush(); } }
  } catch { /* offline or server down: keep the queue, retry later */ }
  sending = false;
}

// Ask the server to delete everything stored for this phone (used on opt-out).
export async function forgetMe(keepConsent = true) {
  const uid = id.uid; queue = []; wr(Q, []);
  if (!trackEnabled()) return false;
  try { return await post({ uid, forget: true }); } catch { return false; } finally { if (!keepConsent) wr(K, id); }
}

if (trackEnabled()) {
  addEventListener('online', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  setTimeout(flush, 1500);
}
