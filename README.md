# WaveHub — marketing landing page

Static site deployed on Vercel from `main`. No build step: the files are served
as they are.

- `index.html` — the landing page
- `free.html` — free-group page, served at `/free` via a rewrite
- `imprint.html`, `privacy.html`, `terms.html`, `withdrawal.html`, `legal.css` —
  legal pages (linked from the footer; required for a paid EU service)
- `assets/` — images and the hero video

## About `vercel.json`

**Do not add a `_comment` key (or any other non-schema key).** Vercel validates
`vercel.json` against its schema and rejects unknown properties, which fails the
build with:

> The `vercel.json` schema validation failed with the following message: should
> NOT have additional property `_comment`

That is exactly what happened between 2026-07-26 and 2026-07-28: every deploy
errored, and production stayed pinned to the last commit made before the file
existed. Keep the notes here in this README instead.

### Why the redirects exist

These paths live on the app (`app.wavehubtennis.com`), not on this static
marketing site, so they used to 404 here — people type them anyway.

`permanent` is deliberately `false` (a 307, not a cached 308): a permanent
redirect gets pinned in visitors' browsers and could not be undone if any of
these ever becomes a real page on the marketing site.

`/apply` no longer exists on the app either — the application funnel was
removed — so it points at signup rather than at a fresh 404.

### Why the rewrite exists

It serves the free-group page at a clean `/free` without renaming the file or
turning on `cleanUrls`, which would also rewrite the legal pages.
