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

function route(view = 'home') {
  if (!getState().lang) return onboarding(() => route('home'));
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
  runLesson({ id: 'practice', practice: true, exercises: buildPractice(done, ALL_LESSONS, getState().weak) }, () => route('home'));
}

route();

// Offline indicator + service worker (production only)
addEventListener('offline', () => toast(t('offline')));
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
