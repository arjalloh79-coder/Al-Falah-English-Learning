# Translation review — required before public launch

French and English are complete. **Pular, Susu and Maninka are partial drafts** written without a native-speaker
reviewer. Only entries I was reasonably confident about were filled; everything else shows French (never invented text).
Languages marked "en cours de traduction" in the picker are flagged for the same reason.

## What exists today
| Language | Vocabulary | UI strings | Confidence |
|---|---|---|---|
| Pular | numbers 1–10, ~15 basic words | ~8 | Medium — dialect: Fuuta Djalon |
| Maninka | numbers 1–10, ~20 basic words | ~8 | Medium — spelling varies (Maninka vs Bambara) |
| Susu | numbers 1–10 + rice | 2 | Low |

## Checklist
1. Have one native speaker per language review `src/data/vocab.js` (fields `pul`, `man`, `sus`) and `src/data/ui.js`.
2. Fill the gaps: greetings (hello/goodbye/please/sorry), family, food, market phrases, full UI (≈60 strings).
3. Check spelling convention (orthographe officielle / N'Ko vs Latin for Maninka) and dialect choice.
4. Once a language is complete, remove `draft: true` in `LANGS` (`src/data/ui.js`) to drop the badge.
5. Idea (cheap + effective): recruit reviewers from local schools/community radio; pay per 100 strings.
