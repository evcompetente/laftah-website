# LAFTAH Experiences website

Bilingual (EN/AR) one-page site. Upload the whole folder to the web root of laftah.me (PHP hosting needed for `send.php`).

- `index.html`, `assets/css`, `assets/js` — site
- `send.php` — emails the brief to info@laftah.me (edit constants at the top)
- `assets/js/config.js` — form endpoint
- `LAFTAH_Original_Website_Animated_Graph_Background.html` — earlier original, kept untouched

Media: intro videos in `assets/video/`, photos in `assets/img/`, poster in `assets/poster.webp`. The intro video is a third-party sample and the event photos show other organisations; replace or get permission before launch.

## Admin (/admin)

`admin/` is a private editor for the site content. It signs in with a GitHub fine-grained token (Contents: read and write on this repo only) and publishes by committing `content/content.js` plus any uploaded images or PDFs. Page text overrides are keyed by `data-k` attributes in `index.html`; keep those attributes if you edit the HTML. Changes can be previewed with `index.html?preview=1` before publishing.
