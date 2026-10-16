# Put the English-app page on al-falahmarketing.com (Hostinger)

You have two files. Use one or both.

| File | What it is | Result |
|---|---|---|
| `english-app.html` | A complete page (bilingual EN/FR, mobile-friendly, no other files needed) | `https://al-falahmarketing.com/english-app.html` |
| `english-app-section.html` | A block to paste inside an existing page (e.g. your homepage) | A banner section on that page |

## Option 1: upload the page (safest, touches nothing else)
1. hPanel, then **Websites**, then your site, then **File Manager**.
2. Open `public_html`.
3. Click **Upload** and choose `english-app.html`.
4. Visit `https://al-falahmarketing.com/english-app.html` on your phone.
5. If it shows a 404, you uploaded to the wrong folder, or the site is in a sub-folder: check where `index.html` (or `index.php`) is and upload next to it.

## Option 2: link to it from your homepage
Add this anywhere in your homepage HTML (menu, banner, footer):
```html
<a href="/english-app.html">Free English Learning for Beginners in Guinea</a>
```
Or paste the full contents of `english-app-section.html` where you want the banner to appear.

## Through Grok / Git
Whatever you use to push files, send these exact files into `public_html` next to the homepage. Don't rename `english-app.html` unless you also update the link.

## After publishing: check
- Loads fast on mobile data, no sideways scroll.
- The EN / FR buttons switch the language, and the choice is remembered.
- "Try the app free" opens https://english.al-falahmarketing.com/
- The "Send your feedback" button opens WhatsApp (+224 611 351 302). To change it, edit `FEEDBACK_URL` near the bottom of `english-app.html`.
