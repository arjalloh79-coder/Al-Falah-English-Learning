import { W, P } from '../data/vocab.js';
import { local } from '../i18n.js';

const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);

export const norm = (s) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();

// Build the exercise queue for a lesson.
export function buildLesson(lesson) {
  const words = lesson.w.map((k) => ({ k, ...W[k] }));
  const phrases = lesson.p.map((k) => ({ k, ...P[k] }));
  const pool = Object.keys(W).map((k) => ({ k, ...W[k] }));
  // Options never repeat an English word OR a displayed local label (e.g. Maninka "I ni ce" = hello & thanks).
  const uniq = (list) => { const en = new Set(), lb = new Set(); return list.filter((x) => (en.has(x.en) || lb.has(local(x))) ? false : (en.add(x.en), lb.add(local(x)), true)); };
  const opts = (w, n = 3) => shuffle(uniq([w, ...shuffle(words.filter((x) => x.k !== w.k)), ...shuffle(pool.filter((x) => !words.some((y) => y.k === x.k)))]).slice(0, n + 1));
  const ex = [];

  words.forEach((w, i) => {
    const kind = i % 3;
    const o = opts(w);
    if (kind === 0 && w.e) ex.push({ type: 'image', word: w, options: o, answer: w.k });          // English word -> emoji
    else if (kind === 1) ex.push({ type: 'pick', word: w, options: shuffle(o), answer: w.k });   // local word -> English
    else ex.push({ type: 'listen', word: w, options: shuffle(o), answer: w.k });                 // hear English -> pick
  });
  ex.push({ type: 'match', pairs: pick(uniq(words), 5) });
  pick(words, 2).forEach((w) => ex.push({ type: 'type', text: w.en, word: w }));
  phrases.forEach((p, i) => {
    const extra = pick(['the', 'is', 'a', 'you', 'we', 'my', 'not', 'good', 'to'].filter((x) => !norm(p.en).split(' ').includes(x)), 2);
    ex.push({ type: 'bank', phrase: p, tiles: shuffle([...p.en.replace(/[.?!,]/g, '').split(' '), ...extra]) });
    if (i === 0) ex.push({ type: 'speak', phrase: p });
    else ex.push({ type: 'type', text: p.en, word: p });
  });
  if (lesson.read) ex.push({ type: 'read', read: lesson.read, options: shuffle(lesson.read.options) });
  return ex;
}

// Pick the cheapest exercises for a "practice" round (earns back a heart).
export function buildPractice(doneIds, all, weak = {}) {
  const src = all.filter((l) => doneIds.includes(l.id));
  const uniq = shuffle(src.flatMap((l) => l.w)).filter((k, i, a) => a.indexOf(k) === i);
  // weakest words first (smart review), then random fill
  const w = uniq.sort((a, b) => (weak[b] || 0) - (weak[a] || 0)).slice(0, 6);
  return buildLesson({ id: 'practice', w, p: [] }).filter((e) => e.type !== 'speak');
}

export function wordOverlap(a, b) {
  const A = norm(a).split(' '), B = new Set(norm(b).split(' '));
  return A.filter((x) => B.has(x)).length / Math.max(A.length, 1);
}
