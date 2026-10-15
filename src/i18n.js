import { UI } from './data/ui.js';
import { getState } from './engine/state.js';

export const lang = () => getState().lang || 'fr';

export function t(key) {
  const l = lang();
  return UI[l]?.[key] ?? UI.fr[key] ?? key;
}

// Word in the learner's base language; falls back to French when the local entry is missing.
export function local(item) {
  const l = lang();
  return (l !== 'fr' && item[l]) || item.fr;
}
export const hasLocal = (item) => lang() !== 'fr' && !!item[lang()];
