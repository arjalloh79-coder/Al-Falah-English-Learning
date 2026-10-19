import './style.css';
import { getState } from './engine/state.js';
import { onboarding } from './views/onboarding.js';
import { home } from './views/home.js';
import { profile } from './views/profile.js';
import { runLesson } from './views/lesson.js';
import { ALL_LESSONS } from './data/curriculum.js';
import { buildLesson, buildPractice } from './engine/exercises.js';
import { toast } from './views/shell.js';
import { t } from './i18n.js';
import { consent } from './views/consent.js';
import { needsConsent, track } from './engine/track.js';

function route(view = 'home') {
  if (!getState().lang) return onboarding(() => route('home'));
  if (needsConsent()) return consent(() => route('home'));
  if (view === 'profile') return profile(route, () => route('home'));
  home(route, startLesson, startPractice);
}
function startLesson(id) {
  const l = ALL_LESSONS.find((x) => x.id === id);
  runLesson({ id, exercises: buildLesson(l), tip: l.tip }, () => route('home'));
}
function startPractice() {
  const done = Object.keys(getState().done);
  if (!done.length) return route('home');
  track('practice_start', {});
  runLesson({ id: 'practice', practice: true, exercises: buildPractice(done, ALL_LESSONS, getState().weak) }, () => route('home'));
}

route();
track('app_open', { lang: getState().lang || '', standalone: matchMedia('(display-mode: standalone)').matches ? 1 : 0, online: navigator.onLine ? 1 : 0 });
addEventListener('appinstalled', () => track('installed', {}));

// Offline indicator + service worker (production only)
addEventListener('offline', () => toast(t('offline')));
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Resolved against the page (not this bundle in /assets/), so it works from any folder. Built at runtime
  // so link checkers don't try to resolve a literal './sw.js' relative to the JS file.
  addEventListener('load', () => navigator.serviceWorker.register(new URL('sw.js', document.baseURI).href).catch(() => {}));
}
