# Usage dashboard for the Al-Falah English app

Shows, for every learner who agreed to share: when they opened the app, which lessons they started, finished or left,
every answer (right/wrong, time taken), hearts lost, practice rounds and sponsor views/taps, plus totals, a lesson
funnel and the most-missed words. Works on normal Hostinger hosting (PHP 8 + SQLite). No extra service or cost.

```
Learner's phone  --(only if they agreed, batched, works offline)-->  collect.php  -->  database
You              --(password)-->  admin.php  (overview, users, one user's full timeline, sponsors, CSV)
```

## Install on Hostinger (about 10 minutes)
1. **File Manager**, open `public_html`, create a folder with a hard-to-guess name, e.g. `afel-7k2x9`.
2. Upload everything from this `collector/` folder into it (`collect.php`, `admin.php`, `setup.php`, `lib.php`, `lessons.php`, `config.sample.php`, `.htaccess`).
3. Create a **data folder OUTSIDE public_html** (next to it), e.g. `/home/uXXXXXXX/afel-data`. The database and password live there, unreachable from the web.
4. In the uploaded folder, copy `config.sample.php` to `config.php` and edit three values:
   - `ALLOWED_ORIGINS`: `['https://english.al-falahmarketing.com']`
   - `SETUP_TOKEN`: any long random text (needed once)
   - `DATA_DIR`: the folder from step 3
5. Open `https://al-falahmarketing.com/afel-7k2x9/setup.php`, enter the token, choose your dashboard password (10+ characters).
6. **Delete `setup.php`** from the server.
7. Open `.../afel-7k2x9/admin.php` and sign in.
8. Turn tracking on in the app: Netlify, **Site configuration, Environment variables**, add
   `VITE_ANALYTICS_URL` = `https://al-falahmarketing.com/afel-7k2x9/collect.php`, then **Deploy site** again.
9. Test: open the app on a phone, accept the consent screen, finish a lesson, refresh the dashboard.

Until step 8, the app does not track anything and does not even show the consent screen.

## Privacy (read this)
- **Consent first.** Nothing is recorded or sent before the learner taps "J'accepte". "Non merci" sends nothing.
- **What is stored:** a random ID, an optional first name/nickname the learner types, language, screen size, phone language, and the activity events listed above.
- **Not stored:** phone number, location, contacts, IP address. Don't ask learners for these in the name field.
- **Learner control:** Profil, then "Supprimer mes données" deletes everything stored for that phone. Unchecking "Partager mon utilisation" stops tracking.
- **You can delete a user** on their dashboard page, and export their data (CSV).
- Guinea has personal-data rules and many learners may be under 18. Publish a short privacy notice on your website and confirm requirements with a local adviser before promoting widely. This README is not legal advice.

## Security notes
- Dashboard: password hash, CSRF protection, lockout after 5 wrong attempts, no-index, strict cookies.
- Collector: validates every field, accepts only known event types, ignores duplicates, caps batch size and rate per phone.
- Keep `config.php` and the data folder out of Git (already in `.gitignore`).

## If you add lessons
Run `node collector/make-lessons.mjs` and re-upload `lessons.php` so the dashboard shows the new lesson and word names.
