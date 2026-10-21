# Al-Falah GlobalAI — English for Guinea (PWA, v8 rebuild)

Duolingo-style English learning app: French / Pular / Susu / Maninka base language, skill path (6 units, 15 lessons),
streak, XP, hearts (1 heart / 20 min), 6 exercise types, confetti, **fully offline** after first visit.
Bundle: ~14 KB gzipped (no framework, no web fonts, no images except the app icon).

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # → dist/  (includes auto-generated offline service worker)
npm run preview    # test the production build (offline mode works here, not in dev)
```

## Deploy (any static host, HTTPS required for PWA install)
- **Netlify**: drag & drop the `dist/` folder at app.netlify.com/drop — or connect the repo (`netlify.toml` is ready).
- **Vercel**: `npx vercel --prod` (`vercel.json` is ready).
- **Cloudflare Pages / GitHub Pages**: build command `npm run build`, output `dist` (paths are relative, works in sub-folders).

## Where to edit
| What | File |
|---|---|
| Words & phrases (+ Pular/Susu/Maninka) | `src/data/vocab.js` |
| Units & lessons order | `src/data/curriculum.js` |
| Interface texts per language | `src/data/ui.js` |
| Exercise generation | `src/engine/exercises.js` |
| "Mot en 3 temps" card (voice, action, writing) | `src/views/learn.js` |
| Action prompts (gestures) per word | `src/data/actions.js` |
| Hearts / streak / XP rules | `src/engine/state.js` (`REGEN_MS`, `MAX_HEARTS`) |
| Colours / look | `src/style.css` (`:root` variables) |

Missing local-language entries automatically fall back to French — add a field (`pul:`, `sus:`, `man:`) and it appears.
**Read `TRANSLATION_REVIEW.md` before public launch.**

## Storage
Progress lives in `localStorage` (key `anglais-gn-v1`): tiny, synchronous, offline. IndexedDB is not needed at this size.

## What changed vs. v7 (the single-file app)
| v7 | v8 (this rebuild) |
|---|---|
| 4 modules, one lesson format | 12 units / 23 lessons, skill path, 8 exercise types |
| Browser called `api.anthropic.com` with no key (always failed → English fallback) | Removed. Local-language content is human-reviewed data files, no AI call |
| Stripe script + 3 Google Fonts loaded on every visit | Nothing external. System fonts, zero third-party requests |
| 45 AI-translated languages | French + Pular / Susu / Maninka (partial, see TRANSLATION_REVIEW.md) |
| Login + Stripe paywall (backend not deployed) | No accounts, no paywall: free & private, progress stays on the phone |
| 191 KB single HTML | ~16 KB gzipped |
Kept from v7: navy/gold brand, the 4 real-life modules (supermarket, doctor, job interview, renting) with their grammar
tips, IPA pronunciation and reading documents, speech scoring, streak/XP, install-to-home-screen.
New: Guinea units (Getting Around, Phone & Mobile Money), hearts, smart review of missed words.

## Monetisation (when you're ready)
Stripe cards are rare in Guinea. Options that fit the market: Orange Money / MTN MoMo manual unlock code per user,
sponsored lessons from local businesses (your agency's SMB clients), or a school/NGO licence. Accounts + a backend
are only needed for paid unlocks; tell me which model and I'll add it.

## Sponsors and usage tracking (v8.1)
- **Sponsor slots:** edit `src/data/sponsors.js` to add a paying sponsor (card on the lesson-complete screen and/or a "Presented by" chip on a unit). With no sponsor, a small "Become a sponsor" house ad shows; set `SHOW_HOUSE_AD = false` to hide it.
- **Sponsor pitch (EN/FR, one page):** `sponsor-kit/`. Edit the prices in the HTML, then re-export the PDF.
- **Usage dashboard:** `collector/` (PHP + SQLite for Hostinger). See `collector/README.md`. Disabled until `VITE_ANALYTICS_URL` is set.

## "Mot en 3 temps" learning card (Voix + Action + Écriture)
Each lesson starts with 2 cards (Smart Review starts with 1, for the weakest word). One word, three steps:
1. **Écoute & répète**: hear the word (🔊 / 🐢), say it into the mic. On-device speech recognition scores it; if the microphone is unavailable the learner can say it and continue. Never blocks ("Passer").
2. **Regarde & fais**: an animated icon and one short instruction to act the word out (Total Physical Response). Self-reported ("J'ai fait ✓"). Words without an entry in `src/data/actions.js` get "Invente un geste pour…".
3. **Écris**: the word is hidden; the learner types it. One letter off = "Presque !" (accepted, spelling shown); two misses reveal the answer and the word returns in Smart Review.

Rules: no heart is lost in these cards; +5 XP per completed card; they are not counted in the lesson accuracy. No audio is recorded or uploaded. Analytics (with consent) reuse the existing `answer` event with `type` `learn_voice` / `learn_write`; the action step sends nothing. To add or change a gesture, edit `src/data/actions.js` (French text; keep it culturally neutral: no left-hand actions, no pointing at people).
