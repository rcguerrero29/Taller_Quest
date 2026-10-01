#!/usr/bin/env node
/* OFFLINE PLAY, proven in a real browser — #254, 2026-09-27.
   The owner: "make sure that we dont go out with "open" doors". The public page used to run one script
   written inside it (the service-worker registration), and that was the only reason its security policy
   let ANY script written inside the page run. The script is now its own file (sw-register.js) and the
   policy is script-src 'self'. Nothing tested the service worker before today — every other suite runs
   the page from disk, where no service worker can exist — so this is the first check that the offline
   game works at all, and it is the check that the tighter policy did not quietly switch it off.

   What it does, against the BUILT site (scripts/build-site.sh, the same box Pages uploads), served on
   127.0.0.1 because a service worker needs http:
   1. first visit: the worker installs, takes control, caches every file sw.js lists (sw-register.js
      included), the game boots, and the page does NOT reload (nothing was stale);
   2. offline: the same page reloads from the cache and the game boots;
   3. a new version: the server starts handing out a sw.js with a new cache name, the page asks for an
      update, and it reloads exactly ONCE onto the new version, which consumes the "updated" flag;
   4. all the way through, the browser reports no Content-Security-Policy violation;
   5. El Horno's generated shell registers no worker, runs no script written inside it, and its policy is
      the public page's, word for word;
   6. the three typefaces load from this site, online and offline (the page asks Google for nothing);
   7. another site that puts the game inside a frame gets a blank page (frame-guard.js), while the game in
      its own tab is visible;
   8. Meridian's worker does not keep the bakery's files: another world is fetched fresh, never cached.
   Nothing to measure is a red: a page with no game in it, or a worker that never took control, fails
   by name before any of the checks above can pass on nothing.

   Run:  node test/offline.js          (CHROMIUM_PATH=/opt/pw-browsers/chromium where needed) */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..');

const CANDIDATES = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  '/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].filter(Boolean);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.css': 'text/css', '.svg': 'image/svg+xml' };
const CSP = html => (html.match(/http-equiv="Content-Security-Policy" content="([^"]*)"/) || [])[1];

(async () => {
  const fails = [];
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-offline-'));
  try { execFileSync('bash', [path.join(ROOT, 'scripts', 'build-site.sh'), out], { cwd: ROOT, stdio: ['ignore', 'ignore', 'pipe'] }); }
  catch (e) {
    const why = String(e.stderr || '').split('\n').find(l => /Error|FAIL|--/.test(l)) || e.message.split('\n')[0];
    console.log('FAIL — offline play\n- the public site could not be built, so there is no offline game to test: ' + why.trim().slice(0, 300));
    process.exit(1);
  }
  const swSrc = fs.readFileSync(path.join(out, 'sw.js'), 'utf8');
  const CACHE = (swSrc.match(/const CACHE = "([^"]+)"/) || [])[1];
  if (!CACHE) { console.log('FAIL — the built sw.js declares no CACHE this check can read, so there is nothing to test'); process.exit(1); }
  const listed = [...new Set([...((swSrc.match(/const ASSETS = \[([\s\S]*?)\];/) || [])[1] || "").matchAll(/"\.\/([^"]*)"/g)].map(m => m[1]).filter(Boolean))];
  if (!listed.length) { console.log("FAIL — the built sw.js lists no ASSETS this check can read, so there is nothing to test"); process.exit(1); }
  if (!listed.includes('sw-register.js')) fails.push('sw.js does not cache sw-register.js, so an offline visit would load a page whose offline switch is missing');
  /* #256: the page's look lives in stylesheet FILES now (style-src 'self'), so a stylesheet the page wears and the
     worker does not keep is a game that may open offline as bare text. Asked HERE, of the list, because the run
     below cannot see a missing entry: its framed visit and its bakery visit go through the worker once it is in
     control, and the worker stores shell.css on the way. Planted 2026-10-01 (shell.css taken off ASSETS): this
     line went red and the offline check further down stayed green. Every link the built page carries. */
  const sheetsWorn = [...fs.readFileSync(path.join(out, 'index.html'), 'utf8').matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m => m[1].replace(/^\.\//, ''));
  if (!sheetsWorn.length) fails.push('the built page links no stylesheet at all, so whether its look survives offline could not be asked — nothing to measure is not a pass');
  sheetsWorn.filter(f => !listed.includes(f)).forEach(f => fails.push('the page wears ' + f + ' and sw.js does not cache it, so offline the game opens without it'));

  /* the server: the built box, with one switch — hand out the NEXT version of sw.js */
  let next = false;
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.join(out, rel.endsWith('/') ? rel + 'index.html' : rel);
    if (!file.startsWith(out) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    let body = fs.readFileSync(file);
    if (rel === 'sw.js' && next) body = Buffer.from(body.toString('utf8').replace('const CACHE = "' + CACHE + '"', 'const CACHE = "' + CACHE + '-next"'));
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';

  let exe;
  try { const p = chromium.executablePath(); if (p && fs.existsSync(p)) exe = p; } catch (e) {}
  if (!exe) exe = CANDIDATES.find(p => { try { return fs.existsSync(p) && fs.statSync(p).isFile(); } catch (e) { return false; } });
  if (!exe) { console.error('No Chromium found. Set CHROMIUM_PATH.'); process.exit(1); }
  const browser = await chromium.launch({ executablePath: exe });
  const context = await browser.newContext();
  const page = await context.newPage();
  const violations = [];
  page.on('console', m => { if (/Content Security Policy/i.test(m.text())) violations.push(m.text().slice(0, 160)); });
  await context.exposeBinding('__cspViolation', (src, v) => violations.push(v));
  await context.addInitScript(() => document.addEventListener('securitypolicyviolation', e => window.__cspViolation(e.violatedDirective + ' blocked ' + (e.blockedURI || 'inline'))));
  let loads = 0;
  page.on('load', () => loads++);
  const settle = ms => new Promise(r => setTimeout(r, ms));
  /* every face the page declares, weight and style each — a family with one good weight must not cover
     for a missing one (the first draft of this check asked by family and a misnamed file walked past it) */
  const FACES = [['Unbounded', '500', 'normal'], ['Unbounded', '700', 'normal'], ['IBM Plex Sans', '400', 'normal'], ['IBM Plex Sans', '500', 'normal'],
    ['IBM Plex Sans', '600', 'normal'], ['IBM Plex Sans', '400', 'italic'], ['IBM Plex Mono', '400', 'normal'], ['IBM Plex Mono', '500', 'normal']];
  const fontsIn = p => p.evaluate(async faces => {
    await Promise.all(faces.map(([f, w, s]) => document.fonts.load(s + ' ' + w + ' 16px "' + f + '"', 'Aa').catch(() => [])));
    const ok = new Set([...document.fonts].filter(x => x.status === 'loaded').map(x => x.family.replace(/["']/g, '') + ' ' + x.weight + ' ' + x.style));
    return faces.map(([f, w, s]) => f + ' ' + w + ' ' + s).filter(k => !ok.has(k));
  }, FACES).catch(e => ['(could not read: ' + e.message.split('\n')[0] + ')']);
  const booted = () => page.evaluate(() => ({ gamev: typeof GAMEV !== 'undefined' ? GAMEV : null, canvas: !!document.querySelector('canvas') })).catch(() => ({ gamev: null, canvas: false }));
  /* every stylesheet the page links ARRIVED and parsed: a <link> whose file never came has no sheet, or one with
     no rules in it. Asked of the page, not of the cache, so it reads what the player's browser actually applied. */
  const unstyled = () => page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"]')]
    .filter(l => { try { return !l.sheet || !l.sheet.cssRules.length; } catch (e) { return true; } }).map(l => l.getAttribute('href')))
    .catch(e => ['(could not read: ' + e.message.split('\n')[0] + ')']);

  try {
    /* 1 · first visit */
    await page.goto(base, { waitUntil: 'load' });
    const controlled = await page.waitForFunction(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller), null, { timeout: 15000 }).then(() => true, () => false);
    if (!controlled) fails.push('first visit: the service worker never took control of the page — offline play is off (was sw-register.js loaded? did the policy block it?)');
    const b1 = await booted();
    if (!b1.gamev || !b1.canvas) fails.push('first visit: the game did not boot (GAMEV ' + b1.gamev + ', canvas ' + b1.canvas + ') — there is nothing here to test offline');
    const cached = await page.evaluate(async ([c, files]) => { const k = await caches.open(c); const miss = []; for (const f of files) if (!(await k.match('./' + f))) miss.push(f); return miss; }, [CACHE, listed]);
    if (cached.length) fails.push('first visit: the cache "' + CACHE + '" is missing ' + cached.join(', '));
    await settle(1500);
    if (loads !== 1) fails.push('first visit: the page loaded ' + loads + ' times — a first visit has nothing stale and must not reload');
    const bare1 = await unstyled();
    if (bare1.length) fails.push('first visit: the stylesheet(s) ' + bare1.join(', ') + ' did not arrive, so the page is not wearing its own look');
    const noFont1 = await fontsIn(page);
    if (noFont1.length) fails.push('first visit: the typeface(s) ' + noFont1.join(', ') + ' did not load from this site');
    const shown = await page.evaluate(() => getComputedStyle(document.documentElement).display);
    if (shown === 'none') fails.push('the game hides itself in its OWN tab — frame-guard.js thinks it is framed when it is not');

    /* 7 · framed by another site (another port is another origin) */
    const other = http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<!doctype html><iframe id="f" src="' + base + '" width="400" height="300"></iframe>'); });
    await new Promise(r => other.listen(0, '127.0.0.1', r));
    const fp = await context.newPage();
    await fp.goto('http://127.0.0.1:' + other.address().port + '/', { waitUntil: 'load' });
    const frame = fp.frames().find(f => f.url().startsWith(base));
    const framedDisplay = frame ? await frame.evaluate(() => getComputedStyle(document.documentElement).display).catch(e => 'unreadable: ' + e.message.split('\n')[0]) : null;
    if (!frame) fails.push('framing: the test page never loaded the game in its frame, so the guard was not tried');
    else if (framedDisplay !== 'none') fails.push('framing: another site shows the game inside its own page (display "' + framedDisplay + '") — its buttons could be laid over ours');
    await fp.close(); other.close();

    /* 8 · the bakery is not kept in Meridian's cache */
    const hp = await context.newPage();
    await hp.goto(base + 'content/horno/', { waitUntil: 'load' }).catch(() => {});
    await settle(800);
    await hp.close();
    const kept = await page.evaluate(async c => (await (await caches.open(c)).keys()).map(r => new URL(r.url).pathname).filter(p => /\/content\/(?!meridian\/)/.test(p)), CACHE);
    if (kept.length) fails.push('the worker keeps another world\'s files in Meridian\'s cache (' + kept.slice(0, 3).join(', ') + ') — they would go stale until Meridian updates');

    /* 2 · offline */
    await context.setOffline(true);
    await page.reload({ waitUntil: 'load' }).catch(e => fails.push('offline: the reload failed — ' + e.message.split('\n')[0]));
    const b2 = await booted();
    if (b2.gamev !== b1.gamev || !b2.canvas) fails.push('offline: the game did not boot from the cache (GAMEV ' + b2.gamev + ', canvas ' + b2.canvas + ')');
    const bare2 = await unstyled();
    if (bare2.length) fails.push('offline: the stylesheet(s) ' + bare2.join(', ') + ' did not load from the cache — offline the game would open without its look');
    const noFont2 = await fontsIn(page);
    if (noFont2.length) fails.push('offline: the typeface(s) ' + noFont2.join(', ') + ' did not load from the cache — offline would look different from online');
    await context.setOffline(false);

    /* 3 · a new version reloads the page exactly once */
    const before = loads;
    next = true;
    await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r && r.update()));
    const reloaded = await (async () => { for (let i = 0; i < 40 && loads === before; i++) await settle(250); return loads > before; })();
    if (!reloaded) fails.push('a new version: the page never reloaded onto it — a returning player would sit on the old build until they refreshed twice');
    await settle(2500);
    if (loads - before > 1) fails.push('a new version: the page reloaded ' + (loads - before) + ' times — it must reload exactly once');
    const after = await page.evaluate(() => ({ flag: sessionStorage.getItem('mqupd'), cache: caches.keys() })).then(async o => ({ flag: o.flag, keys: await page.evaluate(() => caches.keys()) }));
    if (reloaded && after.flag !== null) fails.push('a new version: the "updated" flag was left set, so the game never told the player it updated');
    if (reloaded && !after.keys.includes(CACHE + '-next')) fails.push('a new version: the new worker\'s cache is not there after the reload (' + after.keys.join(', ') + ')');
  } catch (e) {
    fails.push('the browser run stopped: ' + e.message.split('\n')[0]);
  }
  if (violations.length) fails.push('the browser reported ' + violations.length + ' Content-Security-Policy violation(s) — something the page needs is blocked: ' + [...new Set(violations)].slice(0, 3).join(' | '));
  await browser.close();
  server.close();

  /* 5 · El Horno's shell is no looser than the public page */
  const pub = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
  const hornoFile = path.join(out, 'content', 'horno', 'index.html');
  if (!fs.existsSync(hornoFile)) fails.push('el horno has no shell in the build, so its policy could not be compared');
  else {
    const horno = fs.readFileSync(hornoFile, 'utf8');
    if (CSP(horno) !== CSP(pub)) fails.push('el horno\'s policy is not the public page\'s, word for word');
    if (/sw-register\.js|serviceWorker/.test(horno)) fails.push('el horno\'s shell still turns on a service worker — it is not the app and must never fight it for a cache');
    if (/<script(?![^>]*\bsrc=)[^>]*>/.test(horno)) fails.push('el horno\'s shell carries a script written inside the page');
  }
  if (!/script-src 'self';/.test(CSP(pub) || '')) fails.push('the public page\'s policy is not script-src \'self\' only');
  fs.rmSync(out, { recursive: true, force: true });

  if (fails.length) { console.log('FAIL — offline play\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('OK — the built site installs its worker, caches all ' + listed.length + ' files it lists, plays offline wearing its own ' + sheetsWorn.length + ' stylesheet(s) and three typefaces, reloads exactly once onto a new version, hides inside another site\'s frame, keeps no other world in its cache, and the browser reported no policy violation. El Horno\'s shell matches the public policy and runs no worker.');
})();
