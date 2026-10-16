// ── SPONSOR SLOTS ─────────────────────────────────────────────────────────────
// Add a paying sponsor by copying the example below into SPONSORS. No other code changes needed.
//   place: 'complete' = card on the lesson-complete screen · unit: 'u5' = "Presented by" chip on that unit
//   from/to: optional dates (YYYY-MM-DD). Outside the window the sponsor is not shown.
//   logo: optional image URL (emoji is the fallback and works offline). Keep text short.
export const SPONSORS = [
  // {
  //   id: 'acme-bank', name: 'Acme Bank', emoji: '🏦', color: '#16A085',
  //   tag: { fr: 'Ouvrez un compte en 5 minutes', en: 'Open an account in 5 minutes' },
  //   cta: { fr: 'En savoir plus', en: 'Learn more' }, url: 'https://example.com',
  //   place: ['complete'], unit: 'u5', from: '2026-11-01', to: '2026-12-01',
  // },
];

// Shown on the lesson-complete screen when no paid sponsor is active. Turn off with SHOW_HOUSE_AD = false.
export const SHOW_HOUSE_AD = true;

const today = () => new Date().toISOString().slice(0, 10);
const live = (s) => (!s.from || s.from <= today()) && (!s.to || s.to >= today());

let rot = 0;
export function pickSponsor(place) {
  const pool = SPONSORS.filter((s) => live(s) && (s.place || ['complete']).includes(place));
  return pool.length ? pool[rot++ % pool.length] : null;
}
export const unitSponsor = (unitId) => SPONSORS.find((s) => live(s) && s.unit === unitId) || null;
