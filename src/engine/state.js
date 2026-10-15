// Persistent learner state (localStorage — tiny, synchronous, works offline).
const KEY = 'anglais-gn-v1';
export const MAX_HEARTS = 5;
export const REGEN_MS = 20 * 60 * 1000;

const fresh = () => ({ lang: null, xp: 0, streak: 0, lastDay: null, hearts: MAX_HEARTS, heartsTs: null,
  done: {}, weak: {}, dayXp: {}, goal: 20, sound: true });

let s;
try { s = { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { s = fresh(); }

const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage full/blocked */ } };
export const dayStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function getState() { regen(); return s; }
export function update(patch) { Object.assign(s, patch); save(); }
export function reset() { s = fresh(); save(); }

function regen() {
  if (s.hearts >= MAX_HEARTS) { s.heartsTs = null; return; }
  if (!s.heartsTs) s.heartsTs = Date.now();
  const n = Math.floor((Date.now() - s.heartsTs) / REGEN_MS);
  if (n > 0) {
    s.hearts = Math.min(MAX_HEARTS, s.hearts + n);
    s.heartsTs = s.hearts >= MAX_HEARTS ? null : s.heartsTs + n * REGEN_MS;
    save();
  }
}
export function loseHeart() {
  regen();
  if (s.hearts === MAX_HEARTS) s.heartsTs = Date.now();
  s.hearts = Math.max(0, s.hearts - 1); save();
}
export function gainHeart() { regen(); s.hearts = Math.min(MAX_HEARTS, s.hearts + 1); if (s.hearts >= MAX_HEARTS) s.heartsTs = null; save(); }
export const msToNextHeart = () => { regen(); return s.heartsTs ? Math.max(0, REGEN_MS - (Date.now() - s.heartsTs)) : 0; };

export function currentStreak() {
  const y = new Date(); y.setDate(y.getDate() - 1);
  return s.lastDay === dayStr() || s.lastDay === dayStr(y) ? s.streak : 0;
}
export const todayXp = () => s.dayXp[dayStr()] || 0;

export function completeLesson(id, xp, perfect) {
  const today = dayStr(), y = new Date(); y.setDate(y.getDate() - 1);
  const firstToday = s.lastDay !== today;
  if (firstToday) s.streak = s.lastDay === dayStr(y) ? s.streak + 1 : 1;
  s.lastDay = today;
  s.xp += xp; s.dayXp[today] = (s.dayXp[today] || 0) + xp;
  const prev = s.done[id] || { n: 0, best: 0 };
  s.done[id] = { n: prev.n + 1, best: Math.max(prev.best, perfect ? 3 : 2) };
  save();
  return { firstToday, streak: s.streak };
}

// Smart review: remember which words the learner misses.
export function noteWord(k, ok) {
  if (!k) return;
  const n = (s.weak[k] || 0) + (ok ? -1 : 2);
  if (n > 0) s.weak[k] = Math.min(n, 9); else delete s.weak[k];
  save();
}
