# Security

## Reporting a problem

Please report a vulnerability privately with GitHub's **Report a vulnerability** button on this
repository's **Security** tab, not in a public issue. You will get an answer there.

## What the site promises

Meridian Quest is a static site. It has no server, no accounts and no database, so there is nothing
on our side that holds your data. What it does promise, on every page it publishes:

- **Nothing leaves your device on its own.** The page's Content-Security-Policy allows scripts,
  styles, fonts and pictures from this site only, and no background connections at all
  (`connect-src 'none'`). No request goes to another company: the fonts are served from here.
- **No script written inside the page runs** (`script-src 'self'`): code runs only from the site's
  own files, so text that reaches the page can never run as code.
- **No style written inside the page applies either** (`style-src 'self'`): the page's look comes
  only from the site's own stylesheet files, so text that reaches the page can never repaint it.
- **No referrer** is sent when you follow a link out, and the page **hides itself inside another
  site's frame**, so its buttons cannot be covered by someone else's.
- **The offline worker keeps only this game's own files** — never another site's response, never
  another world on the same site, never an error page — and deletes only the caches it owns.
- **Saves stay on the device.** A save moves to another device only as a Trolley Pass that you share
  yourself; a pass someone else sends you is checked field by field before it may replace yours, and
  it asks you first.
- **Third-party code is pinned.** three.js, the QR library and the fonts are copied into this
  repository and checked against recorded hashes on every build (`test/vendor.sha256`).

These are enforced by tests, not only described: `test/public.js` reads every page the site would
publish, `test/offline.js` runs the built site in a real browser, and `test/smoke.js` fails on any
refusal the browser reports under the page's own policy.

## Known limits

- The site is hosted on GitHub Pages, which cannot send security headers, so the policy is a
  `<meta>` tag in each page. Framing is refused by `frame-guard.js` for that reason.
- The game shares its web address (`rcguerrero29.github.io`) with anything else published from the
  same account, and browsers keep one storage area per address. Only a custom domain would separate it.
