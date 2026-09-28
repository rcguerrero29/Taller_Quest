#!/usr/bin/env node
/* EL HORNO — one room, one tray, one verb, run against the shared suite AND actually played.

   Owner, 2026-09-22: "why no for the game? because we havent built it? we will soon."

   Same construction as test/gauge.js and for the same reason: the shell is GENERATED from the
   public index rather than copied, because ~770 of its ~800 lines must be identical (the shared
   suite reads about twenty element ids straight out of it) and a copy would rot silently the
   first time index.html changed. Every edit below asserts it actually matched — a String.replace
   that stops matching returns the input unchanged and would otherwise print success while
   testing the wrong thing.

   PUBLISHED since 2026-09-22, at the owner's word ("lets build/ship it"): scripts/build-site.sh runs
   this generator and copies content/horno/ into the public box, so its shell is held to the public
   page's policy word for word (test/public.js reads every shipped page; test/offline.js compares the
   two). It is linked from nothing. (This paragraph said UNPUBLISHED until 2026-09-27; Zeni caught it.)

   Run:  node test/horno.js          (CHROMIUM_PATH=/opt/pw-browsers/chromium) */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const SCRIPTS = ['strings', 'quests.en', 'quests.es', 'npcs', 'maps', 'art', 'docs', 'config'];
const TRAY = { x: 4, y: 3 };
const MASA = { x: 2, y: 3 };                /* the dough bench */
const KSTAND = { x: 2, y: 4 };              /* directly below the dough, which is where a walk west actually stops */
const STAND = { x: 4, y: 4 };               /* the tile you stand on to read it — one step up from the spawn */
const CAMS = ['top', 'front', 'iso', '3d']; /* ALL FOUR, and the fourth is read back as pixels like the rest */

/* ───────────────── 1 · THE SHELL ───────────────── */
let h = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const edit = (what, re, to) => {
  const before = h;
  h = h.replace(re, to);
  if (h === before) throw new Error('the horno shell can no longer be built from index.html: the "' + what + '" edit matched nothing. index.html changed shape — fix this generator, do not commit a hand-made copy.');
};
edit('script tags',
  /<script src="content\/meridian\/strings\.js"><\/script>[\s\S]*?<script src="content\/meridian\/docs\.js"><\/script>/,
  SCRIPTS.map(s => '<script src="' + s + '.js"></script>').join('\n'));
edit('engine paths', /<script src="(engine\/|vendor\/|qr\.js|frame-guard\.js)/g, '<script src="../../$1');
edit('font paths', /<link rel="stylesheet" href="vendor\/fonts\//, '<link rel="stylesheet" href="../../vendor/fonts/');
edit('touch icon', /<link rel="apple-touch-icon" href="icon-192\.png">/, '<link rel="apple-touch-icon" href="../../icon-192.png">');
edit('title', /<title>[^<]*<\/title>/, '<title>Reposo — El Horno</title>');
/* THE HEADING, and the owner caught it by opening the thing rather than reading about it: the
   generated bakery still said MERIDIAN QUEST across the top of its own page. Every guard in this
   pack looks INSIDE the game canvas; nothing looks above it, which is exactly where the first
   thing a person reads lives. The name: `[cooking world]` is a second world's name (docs/cooking-world.md) and it stays that world's — this is a BRANCH of it, and a bakery's own version of it is the PROOF, the slow
   patient rise a dough is left to take. `Reposo` is that, and it also just means rest, which is
   the right word for a world with no clock and no way to lose. One line to change if he wants
   another. (owner, 2026-09-22: he asked for a cute translation.) */
edit('the heading', /<header><h1>[\s\S]*?<\/h1><\/header>/,
  '<header><h1>REPOSO <span>EL HORNO</span></h1></header>');
edit('manifest', /<link rel="manifest"[^>]*>/, '<!-- no manifest: el horno is not the app -->');
edit('service worker', /<script src="sw-register\.js"><\/script>/, '<!-- no service worker: el horno never installs one -->');

/* THE CREATOR SCREEN — AND THE ICONS, WHICH ARE THE HALF THAT IS ACTUALLY VISIBLE.
   Every shell hardcodes data-c="architect|diplomat|operator", the engine hardcodes SHIRTS, and
   applyLang bare-dereferences t.classes[b.dataset.c] (docs/TAGS.md L17; docs/OPEN.md §2). The pack
   can rename the three careers through UI.classes, and content/horno/strings.js does — Panadera,
   Hornero, Charolera. But the GLYPH beside each name is not a string, it is markup, and the first
   draft of this generator left it alone: the bakery's first screen read
   `🏗️ Panadera the one at the bench / 🤝 Hornero the one at the oven / ⚡ Charolera the one who
   carries the trays` — a construction crane and a handshake over a list of bakery jobs. That is
   the lane brief's own "joke landing the wrong way", in the FIRST screen anybody clicking a link
   would see, so it is fixed here and asserted below rather than written down as a known wart.
   THE REAL FIX is still an engine one and it is still not billable to this pack: the three ids,
   their shirt colours and their icons all belong in a seam a pack answers, not in the shell. */
const CLASSES = [
  ['architect', '🥖', 'Panadera, the one at the bench'],
  ['diplomat', '🔥', 'Hornero, the one at the oven'],
  ['operator', '🥐', 'Charolera, the one who carries the trays']
];
CLASSES.forEach(([c, glyph, who]) => edit('the ' + c + ' icon (' + who + ')',
  new RegExp('(<button data-c="' + c + '"><span class="ce">)[^<]*(</span>)'), '$1' + glyph + '$2'));

/* THE PAW BUTTON. engine.js (grep `the paw menu`) shows #cmd unconditionally — "the paw menu: always on
   screen (owner ask)" — and its handler (engine.js, grep `nearestDog`) opens with `const c=nearestDog(); if(!c)
   return;`. There is no dog in a one-room panaderia, so the shipped HUD was rot3d, gear, fsbtn,
   mapbtn and a 🐾 that does nothing when you press it. A control that never answers teaches the
   player that controls here may not answer, which is a worse thing to ship than a missing feature.
   It is HIDDEN rather than deleted: the engine writes $("cmd").hidden=false and $("cmd").textContent
   on every checkTalk, so removing the element would throw inside checkTalk and take the rest of the
   HUD with it. An inline display:none outranks the hidden attribute being cleared, and the element
   stays there for the engine to write to. The owner's "always on screen" ask is Meridian's, where
   there are dogs; this is a second world and it has none. */
edit('the paw button', /<button class="talk treat" id="cmd" hidden><\/button>/,
  '<button class="talk treat" id="cmd" hidden style="display:none"></button>');

if (h.includes('content/meridian/')) throw new Error('the generated horno shell still loads Meridian content');
/* Only what a PERSON READS. `meridian` is also a THEME key three times over (data-th, data-tn,
   data-cl) and those must stay: the engine's THEMES table has a key literally named `meridian`,
   which is its null default, and content/horno/strings.js already says so. A first draft of this
   check tested the whole file and went red on the theme buttons — the guard would have been
   telling the truth about the wrong noun. */
[['title', /<title>([^<]*)<\/title>/], ['heading', /<header><h1>([\s\S]*?)<\/h1><\/header>/]].forEach(([what, re]) => {
  const m = re.exec(h);
  if (!m) throw new Error('the bakery shell has no ' + what + ' at all, so the check that it does not say MERIDIAN could not run. Nothing to read is not a pass.');
  if (/meridian/i.test(m[1])) throw new Error('the generated bakery still says MERIDIAN in its ' + what + ': "' + m[1].replace(/<[^>]*>/g, '').trim() + '". That is what a person reads before the game has even drawn, and it sits above the canvas where every other check in this file looks.');
});
['🏗️', '🤝', '⚡'].forEach(g => { if (h.includes(g)) throw new Error('the generated horno shell still offers the public game\'s careers on its first screen: it carries a ' + g + '. A bakery whose opening screen shows a hard hat is the joke landing the wrong way, and it is the first thing anybody opening the link sees.'); });
SCRIPTS.forEach(s => { if (!h.includes('"' + s + '.js"')) throw new Error('the generated horno shell never loads ' + s + '.js'); });
fs.writeFileSync(path.join(root, 'content', 'horno', 'index.html'), h);
console.log('horno shell built from index.html (' + h.split('\n').length + ' lines, ' + SCRIPTS.length + ' pack scripts)');
/* --build-only: write the shell and stop. scripts/build-site.sh calls this, because the shell is
   generated and is not in git, so the site build has to make one before it can copy the pack.
   The site build must NOT run the browser checks below -- a publish step that needs Chromium is a
   publish step that fails for a reason that has nothing to do with publishing. CI runs the whole
   file separately, and a shell that generated cleanly but plays wrong is caught there, before a
   merge, which is the right place for it. Every edit above already asserted it matched. */
if (process.argv.includes('--build-only')) process.exit(0);

/* ───────────────── 2 · THE VERB, PLAYED ─────────────────

   THE CHECK THIS PACK EXISTS FOR, and it reads PIXELS because that is the noun.

   The thing being claimed is not "propSet works". It is the owner's sentence: you press one
   button and the SAME OBJECT changes in all four cameras. A guard that called hBake() would be
   testing the function and not the feature (docs/POSTMORTEM.md §4), and a guard that asserted
   "the glyph is now v" would be reading the fix rather than the shape a player sees (§13k). So
   this walks to the tray, presses the Read button a person presses, presses the button on the
   sheet a person presses, and then counts the pixels that moved in each camera.

   THE CONTROL RUNS FIRST AND MUST BE ZERO (§13r). Shoot the same frame twice with nothing
   pressed; if that is not zero the probe measures the animation and every number after it is
   worthless. The clocks are pinned for exactly that reason (REGRESSION row C).

   AND IT WENT RED ON THE CODE IT WAS WRITTEN AGAINST. The first run of this check reported
   `the isometric camera drew the same frame after the bake as before it: 0 pixels moved` —
   because drawIso paints every SOLID glyph as a coloured slab and never asks the tile's painter
   (engine.js, grep `isoBlock(cx,cy,ISOCOL`), and the `iso` slot the view registry advertises at
   engine.js (grep `TILEART["J"] = { top`) advertises an `iso` slot that is WRITE-ONLY: nothing in engine/ ever calls tileView(g,"iso"). MAPCOL is the
   only seam a pack has there. This is the guard that found it and it is the guard that holds it.

   ALL FOUR CAMERAS ARE READ AS PIXELS, INCLUDING THE 3D ONE, and the first draft of this file did
   not do that. It asked the baked scene what glyph the mesh at the tray's tile was LABELLED with
   (`m.userData.g`) — which is a proxy for the noun and not the noun (docs/REGRESSION.md's proxy
   register). A reader planted `mesh:hTrayMesh("p")` on all three tray states, so the 3D tray never
   changed shape at all, and this file printed `the mesh standing at the tray is now a "v"` and
   exited 0. It was the ONLY camera never pixel-diffed, and it is the camera content/horno/config.js
   names as the one the pack is FOR (CAMDEF="3d"). The WebGL buffer is not kept after compositing,
   so it is rendered on demand and copied into a 2D canvas in the same task — `T3.renderer.render`,
   then drawImage, then getImageData. The label check is kept as well, because it says one thing
   pixels cannot: WHICH glyph the scene is holding. It is no longer the only thing asked.

   WHAT THE COUNT DISCARDS, in the same breath: a whole-canvas pixel count cannot say the TRAY
   changed, only that the frame did, and it cannot tell a new SHAPE from a recolour — which is
   exactly how the iso camera passes. That is why the control is zero, why the changed box is
   printed beside the count so a person reading a failure can see where the pixels were, and why
   the pass sentence at the foot of this file says "shape" for three cameras and "colour" for the
   fourth instead of claiming all four alike. */
const CAND = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', '/opt/pw-browsers/chromium', '/usr/bin/chromium'].filter(Boolean);
const bad = [];

async function played() {
  let chromium; try { chromium = require('playwright-core').chromium; }
  catch (e) { bad.push('el horno could not be played at all: playwright-core is not installed, so nothing here measured anything. Nothing to measure is not a pass.'); return; }
  let exe; try { const p = chromium.executablePath(); if (p && fs.existsSync(p)) exe = p; } catch (e) {}
  if (!exe) exe = CAND.find(p => { try { return fs.existsSync(p) && fs.statSync(p).isFile(); } catch (e) { return false; } });
  const b = await chromium.launch({ executablePath: exe });
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
    await pg.route('**', r => r.request().url().startsWith('file://') ? r.continue() : r.abort());
    await pg.goto('file://' + path.join(root, 'content', 'horno', 'index.html'));
    await pg.waitForTimeout(1200);
    await pg.click('.classes button[data-c="architect"]');
    await pg.click('#begin');
    await pg.waitForTimeout(600);

    /* THE HUD, BEFORE ANYTHING ELSE. What is on screen when the game starts is the first thing a
       person sees after the creator screen, and a control that does nothing is a lie told once per
       press. #cmd is hidden by the shell generator above; this is what proves it stayed hidden. */
    const hud = await pg.evaluate(() => [...document.querySelectorAll('button')]
      .filter(x => !x.hidden && x.offsetParent !== null && x.getBoundingClientRect().width > 0 && x.id)
      .map(x => x.id + (x.textContent.trim() ? ':' + x.textContent.trim() : '')));
    if (hud.some(b => b.startsWith('cmd')))
      bad.push('a 🐾 paw button is on the HUD of a one-room bakery that has no dog in it, and pressing it does nothing at all (engine.js, grep `nearestDog`, which opens with `const c=nearestDog(); if(!c)return;`). The visible HUD is: ' + hud.join(', ') + '. A control that never answers teaches a player that controls here may not answer.');

    /* ───────── 2a · YOU WALK THERE. On foot, from where the game puts you. ─────────
       This used to be a lie in the reply and not in the code: the probe teleported the player onto
       the tile with `px=fx=...` and the write-up said "walks to the tray". Nothing proved the tray
       could be REACHED. So it holds the up button a person holds — the dpad button, with the real
       pointer events the engine binds (grep `exitFsForCard`, and the pointer handlers beside it) — and waits to arrive. The clocks are
       pinned only AFTER this, because pinning performance.now freezes the walk itself. */
    const where = () => pg.evaluate(() => ({ x: px, y: py, moving }));
    const spawn = await where();
    await pg.dispatchEvent('.dpad button[data-d="up"]', 'pointerdown');
    let arrived = false;
    for (let i = 0; i < 40 && !arrived; i++) { await pg.waitForTimeout(100);
      const p = await where(); arrived = (p.x === STAND.x && p.y === STAND.y); }
    await pg.dispatchEvent('.dpad button[data-d="up"]', 'pointerup');
    await pg.waitForTimeout(400);
    const stood = await where();
    if (!arrived) { bad.push('you cannot WALK to the tray. From where the game puts you (' + spawn.x + ',' + spawn.y + '), holding the up button for four seconds left you at (' + stood.x + ',' + stood.y + ') and not on the tile beside the tray at (' + STAND.x + ',' + STAND.y + '). The one thing in this world is behind something.'); return; }
    const read = await pg.evaluate(() => { const r = document.getElementById('read'); return r && !r.hidden; });
    if (!read) { bad.push('you can walk to the tray, and standing beside it there is no Read button at all, so this world has no verb. The read mark and the sheet are what make the tray a thing you do something to.'); return; }
    console.log('  walked from (' + spawn.x + ',' + spawn.y + ') to (' + stood.x + ',' + stood.y + ') on the dpad, and the Read button lit');

    /* pin both clocks, so the only thing that can move a pixel is the bake */
    await pg.evaluate(() => { window.__rclock = { d: Date.now, p: performance.now };
      Date.now = () => 1700000000000; performance.now = () => 50000; });

    /* stand(): NOT the walk — the walk is above and it is the one that proves reachability. This
       puts the player on exactly the same sub-tile coordinates before every photograph, because a
       pixel diff between two frames shot from two slightly different places measures the camera. */
    const stand = () => pg.evaluate(s => { world = 'horno'; px = fx = s.x; py = fy = s.y; moving = false; held = null; dir = 'up'; setWorldTag(); checkTalk(); }, STAND);

    /* THE FLAT CAMERAS draw into #cv and can just be read. THE 3D ONE CANNOT: the WebGL drawing
       buffer is not preserved past compositing, so it is rendered on demand and copied into a 2D
       canvas inside the same task, which is the only moment the pixels exist. */
    const grab2d = () => pg.evaluate(() => { const cv = document.getElementById('cv');
      return { w: cv.width, h: cv.height, d: [...cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data] }; });
    const grab3d = () => pg.evaluate(() => { try {
      T3.renderer.render(T3.scene, T3.cam);
      const c3 = T3.renderer.domElement, t = document.createElement('canvas');
      t.width = c3.width; t.height = c3.height;
      const x = t.getContext('2d'); x.drawImage(c3, 0, 0);
      return { w: t.width, h: t.height, d: [...x.getImageData(0, 0, t.width, t.height).data] };
    } catch (e) { return { err: String(e) }; } });
    const frame = async cam => { await pg.evaluate(c => camSet(c), cam); await pg.waitForTimeout(450);
      return cam === '3d' ? grab3d() : grab2d(); };
    /* NOTHING TO MEASURE IS NOT A PASS. A WebGL readback that comes back blank or flat would make
       every diff after it zero — a red with a message about the wrong thing. Say so instead. */
    const unreadable = f => { if (f.err) return 'the 3D camera could not be read back at all: ' + f.err + '. Nothing was photographed, so nothing below measured anything.';
      if (!f.w || !f.h || !f.d.length) return 'the 3D camera read back as an empty buffer (' + f.w + 'x' + f.h + '). Nothing to measure is not a pass.';
      let lo = 255, hi = 0; for (let i = 0; i < f.d.length; i += 4) { const v = f.d[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
      return hi - lo < 8 ? 'the 3D camera read back as one flat colour (red channel ' + lo + '..' + hi + ' over the whole ' + f.w + 'x' + f.h + ' buffer), so the scene was never photographed and every 3D number below is a comparison of two blanks. Nothing to measure is not a pass.' : null; };
    const diff = (a, c) => { let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let i = 0; i < a.d.length; i += 4) {
        if (Math.abs(a.d[i] - c.d[i]) + Math.abs(a.d[i + 1] - c.d[i + 1]) + Math.abs(a.d[i + 2] - c.d[i + 2]) <= 18) continue;
        const p = i / 4, x = p % a.w, y = (p / a.w) | 0;
        n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return { n, box: n ? [x0, y0, x1, y1].join(',') : 'nowhere' }; };

    await stand();

    /* ───────── 2b · THE ROOM, MEASURED AGAINST THE PERSON WHO WORKS IN IT ─────────

       WHY THIS EXISTS. A previous pass raised this bench from 0.502 to 0.696 world units on a
       measurement of the wrong thing — it sized the furniture against the top edge of a person's
       sprite CARD (1.265) instead of against the person, and the card is 8px of speech-bubble
       headroom taller than she is. The bench top ended up above her shoulder, the dough level with
       her face, and the pan cut the sign on the wall behind it in half. EVERY SUITE WAS GREEN, both
       before and after, and the 3D pixel diff above was 76 either way, because a diff asks whether
       the frame CHANGED and never whether the room makes sense. If proportion matters here, then
       something has to read it, and this is the something.

       IT DOES NOT TRUST ANY NUMBER IN ANY COMMENT, INCLUDING THIS FILE'S.
       - The PERSON is PAINTED and then SCANNED: drawPerson into a 36x48 card through the same
         transform engine3d.js hands every artist, then the topmost opaque row. Her feet are the
         sprite's own `center.y` and her card is the sprite's own `scale.y`, both read off the live
         billboard. So this tracks T3PERSON through any rescale — the cast went 1.12 -> 0.92 on
         2026-09-22 — without anybody remembering to update a constant here. A guard that names its
         own copy of a number is testing its own arithmetic (.claude/skills/guard/SKILL.md).
       - The PROP is the engine's own `t3Top` off the baked mesh — "the tallest ink in the thing
         itself" (engine3d.js, grep `m.t3Top=`) — not a sum this file computes from the parts.

       WHAT THE EXTRACTION THREW AWAY, in the same breath as the result: two scalars. A height and a
       height. This cannot see WIDTH, so a bench the right height and three tiles wide passes; it
       cannot see what the bench is BEHIND, so it would not have caught the sign on its own; and it
       cannot see the flat cameras at all, where a tile's height on screen comes from its row.

       THE BAND, and it is about THIS drawing and not about people. She is a cartoon with a large
       head, so human proportions do not transfer. Off drawPerson's own coordinates, as fractions of
       her drawn height: feet 0.09, hip 0.31, shoulder 0.66, the middle of her head 0.78, the top of
       her head 1.00. A bench you get your weight over stands between the hip and the chin, and what
       is piled on it must stay below her face. 0.75 is that ceiling. 0.30 is the floor, under which
       the thing is a crate on the ground and not a bench you stand at. */
    const PROP_CEIL = 0.75, PROP_FLOOR = 0.30;
    const scale = await pg.evaluate(t => { try {
      const spr = T3.pool.map(p => p.spr).find(s => s && s.visible && s.userData && s.userData.hero);
      if (!spr) return { err: 'there is no hero billboard standing in the 3D scene, so there is nobody to measure the room against. Nothing to measure is not a pass.' };
      const K = T3.K, c = document.createElement('canvas'); c.width = 36 * K; c.height = 48 * K;
      const g = c.getContext('2d'); g.setTransform(K, 0, 0, K, 0, 8 * K); /* engine3d.js's own +8: the artist paints 8px lower (#57) */
      drawPerson(g, 2, 6, look, { dir: 'down' });                         /* where engine3d.js paints the hero: (2,6) */
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let top = -1;
      for (let r = 0; r < c.height && top < 0; r++) for (let x = 0; x < c.width; x++)
        if (d[(r * c.width + x) * 4 + 3] > 24) { top = r; break; }
      if (top < 0) return { err: 'a person painted onto her own billboard came back completely blank, so the ruler this check measures the room with does not exist. Nothing to measure is not a pass.' };
      const cardPx = 48 * K, floor = cardPx * (1 - spr.center.y), per = spr.scale.y / cardPx;
      const props = T3.group.children.filter(o => o.userData && o.userData.mesh)
        .map(o => ({ g: o.userData.g, x: o.userData.x, y: o.userData.y, top: o.t3Top }));
      return { person: (floor - top) * per, props, tray: props.find(p => p.x === t.x && p.y === t.y) || null };
    } catch (e) { return { err: 'the room could not be measured against a person at all: ' + e }; } }, TRAY);

    if (scale.err) bad.push(scale.err);
    else if (!(scale.person > 0)) bad.push('a person in this room measured ' + scale.person + ' world units tall, so every proportion below is a division by nothing.');
    else if (!scale.tray) bad.push('nothing with a SHAPE is standing at the tray\'s tile (' + TRAY.x + ',' + TRAY.y + '), so the one object this world is about could not be measured against the baker at all. Nothing to measure is not a pass.');
    else {
      const R = scale.tray.top / scale.person;
      const room = scale.props.map(p => '"' + p.g + '" at (' + p.x + ',' + p.y + ') ' + (p.top / scale.person * 100).toFixed(1) + '%').join(', ');
      if (R > PROP_CEIL) bad.push('the bench the baker works at is too tall for her. She is ' + scale.person.toFixed(3) + ' world units tall (painted and measured, not assumed), and what stands on her bench tops out at ' + scale.tray.top.toFixed(3) + ' — ' + (R * 100).toFixed(1) + '% of her, where her shoulder is 66% and the middle of her head is 78%. The dough is level with her face and the bench top is above her shoulder. The rest of the room, in the same units: ' + room + '. This is the check that a pixel diff cannot do: every camera still CHANGED when she pressed the button, and the room still did not make sense.');
      else if (R < PROP_FLOOR) bad.push('the bench the baker works at is too low to be a bench. She is ' + scale.person.toFixed(3) + ' world units tall and what stands on it tops out at ' + scale.tray.top.toFixed(3) + ' — ' + (R * 100).toFixed(1) + '% of her, below her hip. That is a crate on the floor, not something you get your weight over. The rest of the room: ' + room + '.');
      else console.log('  the baker is ' + scale.person.toFixed(3) + ' tall (painted, then scanned) and her bench tops out at ' + scale.tray.top.toFixed(3) + ' — ' + (R * 100).toFixed(1) + '% of her, between her hip and her face. The room: ' + room);
    }
    if (bad.length) return;

    const before = {}, control = {};
    for (const c of CAMS) before[c] = await frame(c);
    const blank = unreadable(before['3d']); if (blank) { bad.push(blank); return; }
    await stand();
    for (const c of CAMS) control[c] = await frame(c);
    for (const c of CAMS) { const d = diff(before[c], control[c]);
      if (d.n) bad.push('the CONTROL is not zero: the ' + c + ' camera drew ' + d.n + ' different pixels (at ' + d.box + ') with nothing pressed at all, so everything this check measures afterwards is the animation and not the bake. Stop and read docs/POSTMORTEM.md 13r.'); }
    if (bad.length) return;

    const g0 = await pg.evaluate(t => WORLDS.horno.grid[t.y][t.x], TRAY);
    const k0 = await pg.evaluate(() => { try { return T3.builtKey; } catch (e) { return null; } });
    await pg.evaluate(c => camSet(c), '3d'); await pg.waitForTimeout(400); await stand();
    await pg.click('#read'); await pg.waitForTimeout(400);
    const btns = await pg.evaluate(() => [...document.querySelectorAll('#docBody .dbtn')].map(x => x.textContent.trim()));
    if (!btns.some(t => /vanilla|vainilla/i.test(t)) || !btns.some(t => /chocolate/i.test(t)))
      { bad.push('the sheet at the tray does not offer both shells — it offered: ' + JSON.stringify(btns)); return; }
    await pg.evaluate(() => [...document.querySelectorAll('#docBody .dbtn')].find(x => /vanilla|vainilla/i.test(x.textContent)).click());
    await pg.waitForTimeout(600);

    if (!(await pg.evaluate(() => document.getElementById('reader').hidden)))
      bad.push('pressing a shell on the baker\'s card left the sheet open, so you never see the tray you just changed.');
    const g1 = await pg.evaluate(t => WORLDS.horno.grid[t.y][t.x], TRAY);
    if (g1 === g0) bad.push('pressing "vanilla" on the baker\'s card left the tray exactly as it was (still "' + g0 + '"), so the one thing you can do in this world does nothing.');

    await stand();
    /* THE CAUSE LINE IS PER CAMERA, and that is not tidiness. The first draft appended the
       drawIso explanation to every camera's failure, so planting a swallowed button press printed
       "drawIso paints a SOLID glyph as a coloured slab" under the TOP camera — a true sentence
       about the wrong camera, handed to whoever is reading the red. A failure message that names
       a cause it cannot know is worse than one that names none. */
    /* AND ONE THING PIXELS CANNOT SAY: WHICH glyph the baked scene is holding. This is a label and
       it is kept as a label — it was the only 3D assertion in the first draft, which made it a
       proxy standing in for a shape; now it stands beside a pixel diff and answers a different
       question. It is asked BEFORE the diff loop because it is what lets the 3D failure sentence
       name the RIGHT cause: a 3D camera that did not move has two quite different diseases, and a
       message that guesses between them is the mistake this file's iso comment already warns about. */
    const t3 = await pg.evaluate(t => { try {
      const m = T3.group.children.find(o => o.userData && o.userData.mesh && o.userData.x === t.x && o.userData.y === t.y);
      return { key: T3.builtKey, glyph: m ? m.userData.g : null }; } catch (e) { return { err: String(e) }; } }, TRAY);

    const why = {
      iso: ' drawIso paints a SOLID glyph as a coloured slab and never calls the tile\'s painter (engine.js, grep `isoBlock(cx,cy,ISOCOL`), and nothing in the engine ever reads the `iso` slot of the view registry — MAPCOL is the only seam a pack has here.',
      '3d': (t3.err || t3.key === k0)
        ? ' the scene was never re-baked (builtKey is still "' + k0 + '"), so in 3D the tray keeps the shape it had until you walk out of the room and come back — t3Invalidate() is the line that is missing (engine/engine3d.js, grep t3Invalidate).'
        : (t3.glyph !== g1
          ? ' the scene WAS re-baked but it is still holding a "' + t3.glyph + '" at the tray\'s tile while every other camera draws a "' + g1 + '".'
          : ' the scene was re-baked and the tile really is labelled "' + t3.glyph + '" — so the two glyphs DRAW THE SAME PICTURE. The mesh recipe for the baked tray is making the same shape as the dough one (content/horno/art.js, TILEART\'s v and c entries and hTrayMesh). A tile that changes its name and not its shape is the bug a label check cannot see, which is why this camera is now counted in pixels.')
    };
    /* WHAT EACH CAMERA'S NUMBER ACTUALLY MEANS, printed beside it, because three of these are a
       new OBJECT and one is a recolour, and a count cannot tell them apart. Saying "shape" under a
       camera that only changed colour is the proxy this file was caught shipping once already. */
    const kind = { top: 'a new shape', front: 'a new shape', '3d': 'a new shape', iso: 'a COLOUR only — drawIso draws no object here; see MAPCOL in content/horno/art.js' };
    const moved = {};
    for (const c of CAMS) { const d = moved[c] = diff(before[c], await frame(c));
      if (!d.n) bad.push('the ' + c + ' camera drew the same frame after the bake as before it: 0 pixels moved. One decision is supposed to feed every view, and this camera is not being told.' + (why[c] || ''));
      else console.log('  the ' + c + ' camera: ' + d.n + ' pixels moved, in a box at ' + d.box + ' — ' + kind[c]); }

    /* AND THE PIXELS HAVE TO BE ON THE TRAY. This is the hole a count cannot fill on its own and
       naming it is not enough: in 3D the whole bake moves 76 pixels while the SAME scene with the
       clocks left running moves 477 (measured, by planting the unpinned clock), so "the frame
       changed" is a claim a passing cloud could satisfy. So ask three.js where the tray's tile
       lands on screen and require the changed box to contain it. The extraction is honest about
       what it threw away: a bounding box keeps position and extent and discards SHAPE and count
       inside it, so this says the change happened at the tray — never that it is bread. */
    if (moved['3d'] && moved['3d'].n) {
      const aim = await pg.evaluate(t => { try {
        const v = new THREE.Vector3(t.x + 0.5, 0.6, t.y + 0.5).project(T3.cam), c3 = T3.renderer.domElement;
        return { x: Math.round((v.x * 0.5 + 0.5) * c3.width), y: Math.round((-v.y * 0.5 + 0.5) * c3.height) };
      } catch (e) { return { err: String(e) }; } }, TRAY);
      if (aim.err) bad.push('the 3D camera could not be asked where the tray lands on screen: ' + aim.err);
      else { const [x0, y0, x1, y1] = moved['3d'].box.split(',').map(Number), M = 12;
        if (aim.x < x0 - M || aim.x > x1 + M || aim.y < y0 - M || aim.y > y1 + M)
          bad.push('in 3D the bake moved ' + moved['3d'].n + ' pixels, but not where the tray is: the changed box is ' + moved['3d'].box + ' and the tray\'s own tile projects to (' + aim.x + ',' + aim.y + '). Something in the frame changed and it was not the thing you pressed a button on.');
        else console.log('  and in 3D those pixels are ON the tray: its tile projects to (' + aim.x + ',' + aim.y + '), inside the changed box'); }
    }

    if (t3.err) bad.push('the 3D camera could not be asked what it is holding at the tray: ' + t3.err);
    else if (t3.key === k0) bad.push('the 3D scene was never re-baked (builtKey is still "' + k0 + '"), so in 3D the tray keeps the shape it had until you walk out of the room and back.');
    else if (t3.glyph !== g1) bad.push('the 3D scene is still holding a "' + t3.glyph + '" at the tray\'s tile while every other camera draws a "' + g1 + '".');
    else console.log('  the 3d camera: re-baked, and the mesh standing at the tray is labelled "' + t3.glyph + '"');

    /* ───────── 2c¼ · A THING YOU CAN READ IS A PLACE, SO THE PLACE HAS TO BE THERE ─────────

       THIS CHECK EXISTS BECAUSE A PLANT WALKED STRAIGHT PAST EVERYTHING BELOW IT. On 2026-09-23 the
       dough bench was deleted from the map — `"w.m.p...w"` back to `"w...p...w"` — and `test/horno.js`
       came back GREEN and printed its whole pass sentence, the one that says you walk to the other
       bench and push the dough. Six other plants that day each printed a sentence a person would say;
       this one printed a lie.

       WHY IT GOT THROUGH, and it is worth stating plainly because every pack inherits it: READS
       declares a COORDINATE, and readAt (engine.js, grep `const readAt=`) matches on world/x/y and
       whether the document exists. It never asks what is STANDING there. So the read mark floats over
       bare floor, the Read button lights, the card opens — and the knead's own state lives in the
       pack (H_MASA) and reaches the tray through hRise/hSpread, neither of which is a tile. Every
       assertion below was about the dough's BEHAVIOUR and not one was about the dough's PRESENCE, so
       deleting the object changed nothing any of them could see.

       The engine's own rule, printed beside readAt: "a thing you can read is a place." This is that
       sentence as a guard — every read this pack declares has to stand on something that is drawn as
       an object, checked through TILEART's mesh entry rather than a list of letters typed here. */
    const reads = await pg.evaluate(() => ((typeof READS !== 'undefined' && READS) || []).map(r => {
      let g = null; try { g = WORLDS[r.world].grid[r.y][r.x]; } catch (e) {}
      return { x: r.x, y: r.y, doc: r.doc, g: g,
               mesh: !!(g && typeof TILEART !== 'undefined' && TILEART[g] && TILEART[g].mesh),
               solid: !!(g && typeof SOLIDX !== 'undefined' && SOLIDX.indexOf(g) >= 0) };
    }));
    if (!reads.length) bad.push('this pack declares no READS at all, so the two cards below cannot be opened by anybody and every check after this one is measuring nothing.');
    reads.forEach(r => {
      if (!r.g) bad.push('the read "' + r.doc + '" is declared at (' + r.x + ',' + r.y + ') and there is no tile there at all.');
      else if (!r.mesh) bad.push('the read "' + r.doc + '" stands at (' + r.x + ',' + r.y + ') on a "' + r.g + '", which has no mesh in TILEART — so in 3D the mark hangs over an empty piece of floor and a player walks up to nothing. The engine\'s own note beside readAt is "a thing you can read is a place"; a coordinate with no object on it is not a place. (READS matches world/x/y and never asks what is standing there, which is why nothing else in this file can see it.)');
      else if (!r.solid) bad.push('the read "' + r.doc + '" stands at (' + r.x + ',' + r.y + ') on a "' + r.g + '" that is not in SOLIDX, so a player can walk through the bench.');
    });
    /* AND THE REGISTRY IS NOT THE ROOM. TILEART[g].mesh says a painter was REGISTERED; it does not say
       the painter returned anything, and `mesh:()=>[]` would satisfy it while the bench stayed empty —
       the same distance between a declaration and a thing that the plant above walked through. So the
       height is read off the BAKED scene, from the props 2b already collected (`o.t3Top`, the tallest
       ink in the thing itself), which is the room and not a table. */
    if (!scale.err && scale.props) reads.forEach(r => {
      if (!r.mesh) return;                                    /* already reported above, with a better sentence */
      const stood = scale.props.find(q => q.x === r.x && q.y === r.y);
      if (!stood) bad.push('the read "' + r.doc + '" stands at (' + r.x + ',' + r.y + ') on a "' + r.g + '" that registers a mesh in TILEART, and the baked 3D scene is holding nothing at that tile at all.');
      else if (!(stood.top > 0)) bad.push('the read "' + r.doc + '" stands at (' + r.x + ',' + r.y + ') on a "' + r.g + '" whose mesh baked to a height of ' + stood.top + ', so the painter is registered and draws nothing. A registered painter is a declaration; this is the room.');
    });
    if (reads.length && !bad.length) console.log('  every read stands on something that is really there: ' + reads.map(r => '"' + r.doc + '" on a "' + r.g + '" at (' + r.x + ',' + r.y + ')').join(', '));

    /* ───────── 2c½ · THE KNEAD. A STROKE, AND WHERE THE STROKE WENT ─────────

       This is the second verb and it is the one that could not be checked by asking whether a frame
       changed, because its whole content is WHICH PART of a surface your hand has been over. So it is
       checked in two different currencies and they are kept apart on purpose:

       - THE FIELD, exactly. H_MASA.cover is arithmetic; a claim about it can be proved and not
         estimated. That is where "the dough develops where your hand went" is tested, by working one
         third of the lump with a real drag and requiring the far third to be UNTOUCHED — zero, not
         small. A per-region claim tested with a whole-object average is exactly the proxy this repo
         keeps a register of (docs/REGRESSION.md).
       - THE PIXELS, for the two things the field cannot say: that the drawing actually repainted, and
         that a worked dough reaches the three rounds on the TRAY in 3D — which is the only reason the
         gesture is worth a player's attention a second time.

       WHAT THE EXTRACTIONS THREW AWAY, said out loud: the field check discards how it LOOKS (a dough
       whose numbers are perfect and whose drawing is a grey disc would pass it), and the pixel checks
       discard what the pixels ARE (they say something changed at the tray, never that it is bread).
       Neither is the other's evidence, which is why both are here.

       AND THE CLOCKS COME BACK FOR THE WALK. Pinning performance.now freezes movement, so the walk to
       the second bench restores the real pair stashed at pin time and re-pins on arrival — the four
       pixel diffs above are already taken, so nothing upstream can be disturbed by it. */
    await pg.evaluate(() => { if (window.__rclock) { Date.now = window.__rclock.d; performance.now = window.__rclock.p; } });
    await pg.evaluate(() => { world = 'horno'; px = fx = 4; py = fy = 4; moving = false; held = null; setWorldTag(); checkTalk(); });
    await pg.waitForTimeout(200);
    /* ONE HELD BUTTON, WEST, and it stops where the room stops it — the tile under the dough.
       This used to hold left and then up for (3,3), and it worked only because MARI was standing at
       (2,4) and blocked the walk there. She moved one tile west on 2026-09-23 — she was between her
       own dough and the camera and hid it completely in 3D — the wall the walk leaned on disappeared,
       and the walk sailed past to (2,4), where `up` is the dough itself and solid, so the player stood
       still and this reported the second verb unreachable. A route that depends on where a PERSON
       happens to stand is a route, not a proof. (2,4) is where a walk west actually ends, and readAt's
       own order — self, up, down, left, right — finds the dough from it. */
    let kthere = false;
    await pg.dispatchEvent('.dpad button[data-d="left"]', 'pointerdown');
    for (let i = 0; i < 30; i++) { await pg.waitForTimeout(100);
      const q = await where(); if (q.x === KSTAND.x && q.y === KSTAND.y) { kthere = true; break; } }
    await pg.dispatchEvent('.dpad button[data-d="left"]', 'pointerup');
    await pg.waitForTimeout(400);
    const kat = await where();
    await pg.evaluate(() => { Date.now = () => 1700000000000; performance.now = () => 50000; });
    if (!kthere) bad.push('you cannot WALK to the dough bench. From beside the tray at (4,4), holding the left button left you at (' + kat.x + ',' + kat.y + ') instead of (' + KSTAND.x + ',' + KSTAND.y + '), the tile under the dough. A second verb you cannot reach on foot is not a second verb.');
    else {
      const kread = await pg.evaluate(() => { const r = document.getElementById('read'); return r && !r.hidden; });
      if (!kread) bad.push('standing between the two benches at (' + KSTAND.x + ',' + KSTAND.y + ') there is no Read button, so the dough at (' + MASA.x + ',' + MASA.y + ') cannot be opened at all. READS in content/horno/docs.js declares it and readAt (engine.js, grep `const readAt=`) looks at the tile you are on plus its four neighbours.');
      else {
        await pg.evaluate(() => { try { hMasaReset(); } catch (e) {} });
        /* the tray in 3D BEFORE any dough has been worked, shot from where we are standing now, so
           the only thing that can move these pixels afterwards is the dough */
        await pg.evaluate(k => { px = fx = k.x; py = fy = k.y; moving = false; dir = 'up'; }, KSTAND);
        const k3before = await frame('3d');
        const un = unreadable(k3before); if (un) bad.push(un);

        await pg.click('#read'); await pg.waitForTimeout(500);
        const card = await pg.evaluate(() => ({
          open: !document.getElementById('reader').hidden,
          title: (document.getElementById('docTitle') || {}).textContent || '',
          n: document.querySelectorAll('#docBody canvas.dart').length,
          touch: (() => { const c = document.querySelector('#docBody canvas.dart'); return c ? c.style.touchAction : null; })(),
          tab: (() => { const c = document.querySelector('#docBody canvas.dart'); return c ? c.getAttribute('tabindex') : null; })(),
          cssw: (() => { const c = document.querySelector('#docBody canvas.dart'); return c ? Math.round(parseFloat(c.style.width)) : 0; })(),
          col: document.getElementById('docBody').clientWidth,
          win: document.documentElement.clientWidth,
          txt: document.getElementById('docBody').textContent
        }));
        if (!card.open || !/dough|masa/i.test(card.title))
          bad.push('standing between the benches, pressing Read opened "' + card.title + '" instead of the dough. readAt checks the tile you are on and then up, down, LEFT, right — the dough is the left neighbour of (' + KSTAND.x + ',' + KSTAND.y + ') and the tray is the right one, so the dough is supposed to win here.');
        else if (!card.n)
          bad.push('the dough card opened with no drawing on it at all. The knead IS the drawing: docRender only builds a canvas for a section that carries an `art` function (engine.js, grep `A DRAWING. The pack draws`), and content/horno/docs.js pushes one into the `masa` card.');
        else {
          /* ---- THE ENGINE SEAM, both halves, measured on the canvas the reader actually made ---- */
          if (card.touch !== 'none')
            bad.push('the dough\'s canvas has touch-action "' + card.touch + '", so on a phone a downward drag on it scrolls the sheet instead of working the dough and the whole mechanic is unreachable by thumb. The section declares `grab:true` and the engine is supposed to answer it (engine.js, grep `A PICTURE MAY TAKE THE POINTER`); .dart carries no touch-action rule in either shell, so nothing else will.');
          if (card.tab === null)
            bad.push('the dough\'s canvas is not in the tab order, so a player who does not use a pointer cannot reach the knead at all. `grab` is supposed to put it there.');
          /* THE WIDTH. docOpen used to render the sheet while the reader was still hidden, and a
             display:none column measures 0 — so the measuring chain fell through to the WINDOW and
             every drawing in either game was sized to 382 while sitting in a ~330 column, which the
             CSS cap then scaled down. This is the one mechanic whose entire content is surface
             texture, so it is the one that pays for that, and it is checked here rather than
             described: the canvas must be the COLUMN's width, and must not be the window's. */
          if (card.col <= 0)
            bad.push('the reader\'s column measured ' + card.col + 'px while the sheet was open, so this check cannot tell what width the drawing should have been.');
          else if (Math.abs(card.cssw - Math.max(240, Math.min(560, card.col - 8))) > 1)
            bad.push('the dough is drawn ' + card.cssw + 'px wide inside a ' + card.col + 'px column (the window is ' + card.win + 'px). A picture wider than its column is scaled down by the CSS cap, and the detail the browser throws away is the only thing this mechanic has to show. engine.js docOpen has to unhide the reader BEFORE docRender measures it — grep `THE READER IS SHOWN BEFORE THE DOCUMENT IS DRAWN`.');
          else console.log('  the dough is drawn ' + card.cssw + 'px wide in a ' + card.col + 'px column (the window is ' + card.win + 'px, and that is what it used to be drawn at)');
          /* NO COUNTER. Narrow on purpose and it says so: this catches a percentage and an "8 of 12",
             and it cannot catch a bar drawn on the canvas. The bar it cannot see is the reason the
             canvas diff below exists at all. */
          if (/\d+\s*%|\d+\s*(\/|of|de)\s*\d+/i.test(card.txt))
            bad.push('the dough card is showing a count: "' + (card.txt.match(/\d+\s*%|\d+\s*(\/|of|de)\s*\d+/i) || [])[0] + '". The dough is the display — a number turns a thing you do into a thing you complete, and the four lines of prose become four checkpoints.');

          const box = await pg.locator('#docBody canvas.dart').boundingBox();
          const shot = () => pg.evaluate(() => { const c = document.querySelector('#docBody canvas.dart');
            const x = c.getContext('2d'); return { w: c.width, h: c.height, d: [...x.getImageData(0, 0, c.width, c.height).data] }; });
          const field = () => pg.evaluate(() => ({ dev: hDev(), even: hEven(), band: hBand(),
            piece: [0, 1, 2].map(hPieceDev), cover: H_MASA.cover.slice() }));
          /* a real drag, with the browser's own pointer events, mapped through the canvas's box —
             which is also the only way to catch a handler that reads offsetX on a CSS-scaled canvas */
          /* THE LUMP'S OWN GEOMETRY, ASKED OF THE PAGE AND NEVER RECOMPUTED HERE. A guard that keeps
             its own copy of the centre and the radii is testing its own arithmetic
             (.claude/skills/guard/SKILL.md): move the lump in art.js and this file would keep
             stroking thin air and stay green. hGeom() is what the drawing itself uses. */
          const G = await pg.evaluate(() => { const g = hGeom(); return { cx: g.cx, cy: g.cy, rx: g.rx, ry: g.ry, W: H_CARD.W, H: H_CARD.H }; });
          const stroke = async (u0, u1, v, steps) => {
            const X = u => box.x + box.width * (G.cx + u * G.rx) / G.W;
            const yy = box.y + box.height * (G.cy + v * G.ry) / G.H;
            await pg.mouse.move(X(u0), yy); await pg.mouse.down();
            for (let i = 1; i <= steps; i++) await pg.mouse.move(X(u0 + (u1 - u0) * i / steps), yy);
            await pg.mouse.up(); await pg.waitForTimeout(80);
          };
          const before = await shot();
          /* ONE THIRD OF IT, AND THE FAR THIRD MUST COME BACK ZERO */
          for (const v of [-0.5, 0, 0.5]) await stroke(-0.92, -0.34, v, 10);
          await pg.waitForTimeout(250);
          const f1 = await field(), after = await shot();
          if (!(f1.dev > 0)) bad.push('a real mouse drag across the dough changed nothing in it at all: hDev() is still ' + f1.dev + '. Either the canvas never got the pointer, or the handler is reading offsetX on a canvas the CSS has scaled (engine.js sets `cv.style.height="auto"` on the non-wide branch, so its layout box and its backing box are different sizes).');
          else {
            if (!(f1.piece[0] > 0.10))
              bad.push('three strokes down the LEFT of the dough left the left third at ' + f1.piece[0].toFixed(3) + '. The strokes landed somewhere, but not where they were aimed.');
            if (f1.piece[2] > 0.001)
              bad.push('working only the LEFT of the dough also worked the RIGHT: the right third came back at ' + f1.piece[2].toFixed(3) + ', where it has to be exactly zero. "It develops where your hand went" is the whole of this mechanic — a knead that spreads everywhere is a counter with a thumb on it, and then the three rounds on the tray cannot differ from each other either.');
            else if (f1.piece[0] > 0.10)
              console.log('  a drag down the left of the dough worked the left third to ' + f1.piece[0].toFixed(2) + ' and left the right third at exactly ' + f1.piece[2].toFixed(0) + ' — the dough develops where the hand went');
            const cd = diff(before, after);
            if (!cd.n) bad.push('the dough\'s own drawing did not change by one pixel after a drag that demonstrably moved the field (hDev ' + f1.dev.toFixed(3) + '). The surface is the only display this mechanic has; a field that changes behind an unchanged picture is a number with no face.');
            else console.log('  and the drawing repainted: ' + cd.n + ' pixels moved on the card, in a box at ' + cd.box);
          }
          /* ---- A HAND THAT IS A KEYBOARD ---- */
          await pg.evaluate(() => { try { hMasaReset(); } catch (e) {} const c = document.querySelector('#docBody canvas.dart'); if (c) c.focus(); });
          await pg.waitForTimeout(120);
          for (let i = 0; i < 6; i++) { await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(40); }
          const fk = await field();
          if (!(fk.dev > 0)) bad.push('the dough cannot be worked from the keyboard: six ArrowRight presses on the focused canvas left hDev() at ' + fk.dev + '. A surface you can only reach with a thumb is a surface some people cannot reach at all, and `grab` put this canvas in the tab order on purpose.');
          else console.log('  and it can be worked from the keyboard: six arrow presses took it to ' + fk.dev.toFixed(2));

          /* ---- AND IT HAS TO REACH THE BREAD. Work the WHOLE lump, then look at the tray. ---- */
          await pg.evaluate(() => { try { hMasaReset(); } catch (e) {} });
          for (let pass = 0; pass < 5; pass++)
            for (const v of [-0.9, -0.55, -0.18, 0.18, 0.55, 0.9]) await stroke(-0.92, 0.92, v, 12);
          await pg.waitForTimeout(250);
          const f2 = await field();
          if (f2.band < 3) bad.push('thirty full strokes across the whole lump only took it to band ' + f2.band + ' of 3 (hDev ' + f2.dev.toFixed(3) + ', evenness ' + f2.even.toFixed(2) + '). The far end of this mechanic is meant to be reachable by hand in a sitting, not in an afternoon — if it is not, the last of the four lines is written and never read, which is the same fault as a district ending nobody can reach.');
          else console.log('  and a thorough knead reaches the far band: hDev ' + f2.dev.toFixed(2) + ', evenness ' + f2.even.toFixed(2));
          /* the way out, which is on screen from the first second and is what makes this an offer */
          const outBtn = await pg.evaluate(() => { const b = [...document.querySelectorAll('#docBody .dbtn')]
            .find(x => /tray|charola/i.test(x.textContent)); if (!b) return null; b.click(); return b.textContent.trim(); });
          await pg.waitForTimeout(450);
          /* AND IT CLOSES THE SHEET ITSELF WHEN THE BUTTON IS GONE. Planting this one the first time
             did report the missing button — and then left the reader open, so section 2d's click on
             #read hit an overlay and the whole run died with "page.click: Timeout 30000ms exceeded".
             A true finding followed by a crash about something else is worse than either, because the
             crash is what a person reads. A check that removes a thing puts it back. */
          if (!outBtn) { bad.push('the dough card has no button that takes you to the tray, so the only way out of the knead is the reader\'s own close. An action you can leave in one press and do not leave is something done on purpose; an action you have to finish is a toll.');
            await pg.evaluate(() => { const c = document.getElementById('docClose'); if (c) c.click(); }); await pg.waitForTimeout(350); }
          else {
            const shut = await pg.evaluate(() => document.getElementById('reader').hidden);
            if (!shut) bad.push('pressing "' + outBtn + '" on the dough card left the sheet open.');
          }
          await pg.evaluate(k => { world = 'horno'; px = fx = k.x; py = fy = k.y; moving = false; held = null; dir = 'up'; setWorldTag(); checkTalk(); }, KSTAND);
          const k3after = await frame('3d');
          const kd = diff(k3before, k3after);
          const aim2 = await pg.evaluate(t => { try {
            const v = new THREE.Vector3(t.x + 0.5, 0.6, t.y + 0.5).project(T3.cam), c3 = T3.renderer.domElement;
            return { x: Math.round((v.x * 0.5 + 0.5) * c3.width), y: Math.round((-v.y * 0.5 + 0.5) * c3.height) };
          } catch (e) { return { err: String(e) }; } }, TRAY);
          /* NOT A BOUNDING BOX THIS TIME. The dough's own tile is two tiles from the tray and a box
             that contains both proves nothing about either, so this counts the changed pixels within
             18 of where three.js says the TRAY's tile lands. It still discards shape: it says the
             tray moved, never that it moved into taller bread. */
          if (aim2.err) bad.push('the 3D camera could not be asked where the tray lands: ' + aim2.err);
          else {
            let near = 0;
            for (let i = 0; i < k3before.d.length; i += 4) {
              if (Math.abs(k3before.d[i] - k3after.d[i]) + Math.abs(k3before.d[i + 1] - k3after.d[i + 1]) + Math.abs(k3before.d[i + 2] - k3after.d[i + 2]) <= 18) continue;
              const q = i / 4, x = q % k3before.w, y = (q / k3before.w) | 0;
              if (Math.abs(x - aim2.x) <= 18 && Math.abs(y - aim2.y) <= 18) near++;
            }
            if (!near) bad.push('a dough worked to silk changed nothing at the TRAY in 3D: ' + kd.n + ' pixels moved in the frame and not one of them is within 18 of where the tray\'s tile projects (' + aim2.x + ',' + aim2.y + '). Then the knead is a toy in a sheet — the three rounds are supposed to come off the dough you worked (content/horno/art.js, grep `WHERE YOUR HAND WENT, SURVIVING INTO THE BREAD`), and t3Invalidate has to be called when the hand comes off, or the scene keeps the shape it baked.');
            else console.log('  and the worked dough reached the bread: ' + near + ' of ' + kd.n + ' changed pixels are on the tray itself at (' + aim2.x + ',' + aim2.y + ')');
          }
          await pg.evaluate(() => { try { hMasaReset(); if (typeof t3Invalidate === 'function') t3Invalidate(); } catch (e) {} });
        }
      }
    }
    /* AND IT PUTS THE ROOM BACK WHERE IT FOUND IT. This section walks the player two tiles west to
       the dough bench, and readAt checks the LEFT neighbour before the right one — so leaving her
       there makes 2d below press Read and get the dough card, look for a chocolate button that is
       not on it, click nothing, and report that baking left the sheet open. Which is what it did
       report, on the first run of this section: a true failure about the wrong thing, caused by the
       check above it. A step that moves the player owes the next step its starting position. */
    await stand();
    await pg.waitForTimeout(200);

    /* ───────── 2d · AND THE WAY OUT OF THE CARD, WHICH IS WHERE A PHONE PLAYER GETS HURT ─────────
       Opening the card runs exitFsForCard() (engine.js, grep `exitFsForCard`): #vp loses `.fs`, the body
       loses `noscroll`, browser fullscreen is exited, and `wasFs=true` is recorded. ONLY restoreFs()
       undoes that and only the reader's own close button calls it (engine.js, grep `restoreFs();checkTalk`). The first
       draft of content/horno/docs.js closed with `$("reader").hidden=true`, so every single bake
       threw a fullscreen player back out to browser chrome and left wasFs stuck true, and the only
       thing this file asserted afterwards was `reader.hidden===true` — which is exactly what the
       broken version did do. This runs LAST because putting #vp into .fs resizes the canvas, and a
       resized canvas would make every pixel diff above a comparison of two different pictures. */
    await pg.evaluate(() => { document.getElementById('vp').classList.add('fs'); document.body.classList.add('noscroll'); });
    await pg.waitForTimeout(250);
    await pg.click('#read'); await pg.waitForTimeout(400);
    const mid = await pg.evaluate(() => ({ fs: document.getElementById('vp').classList.contains('fs'), open: !document.getElementById('reader').hidden }));
    if (!mid.open) bad.push('in fullscreen, pressing Read at the tray opened no card at all.');
    else if (mid.fs) bad.push('opening the card did not leave fullscreen, so this check cannot tell whether closing it comes back — the engine is supposed to run exitFsForCard() on open (engine.js, grep `exitFsForCard`).');
    else {
      await pg.evaluate(() => { const x = [...document.querySelectorAll('#docBody .dbtn')].find(b => /chocolate/i.test(b.textContent)); if (x) x.click(); });
      await pg.waitForTimeout(500);
      const out = await pg.evaluate(() => ({ hidden: document.getElementById('reader').hidden,
        fs: document.getElementById('vp').classList.contains('fs'), noscroll: document.body.classList.contains('noscroll'),
        read: (() => { const r = document.getElementById('read'); return !!(r && !r.hidden); })() }));
      if (!out.hidden) bad.push('pressing a shell on the baker\'s card left the sheet open, so you never see the tray you just changed.');
      if (!out.fs || !out.noscroll) bad.push('baking threw the player out of fullscreen and never put it back: after pressing a shell, #vp.fs=' + out.fs + ' and body.noscroll=' + out.noscroll + ', where both were true before. The card exits fullscreen when it opens and only the reader\'s own close button restores it, so a card that hides itself hands a phone player back the browser chrome every time she bakes — and leaves wasFs stuck true, so the next honest close restores nothing either.');
      if (!out.read) bad.push('after baking, the Read button at the tray is gone, so you cannot open the card a second time and change your mind — and changing your mind for ever is the whole of this world\'s no-punishment rule.');
      if (out.fs && out.noscroll && out.hidden && out.read) console.log('  the card closes the engine\'s own way: fullscreen comes back and the Read button relights');
    }
  } finally { await b.close(); }
}

/* ───────────────── 3 · THE STANDING DEMANDS ─────────────────
   The gauge's own device. A small pack fails some of the shared suite's checks for being SMALL
   rather than for being WRONG; record them and fail when the SET changes. A line that disappears
   means the template got easier, a line that appears means somebody made the engine harder to
   write a second game for, and it says so on the day it happens.
   NOTHING TO MEASURE IS NOT A MEASUREMENT: an empty result is a broken run and fails differently. */
function demands() {
  const expectedPath = path.join(root, 'content', 'horno', 'expected.txt');
  let out = '';
  try {
    out = execFileSync('node', [path.join(root, 'test', 'engine.smoke.js'), '--index', 'content/horno/index.html'],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const got = out.split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2).trim())
    .map(l => l.replace(/drawn \d+ time\(s\)/, 'drawn N time(s)')).sort();
  if (!/COUNT-ONLY|\bOK\b|^FAIL/m.test(out)) {
    console.log('FAIL — el horno never ran. The shared suite produced nothing at all, which is not');
    console.log('the same as finding nothing. This is a broken run, not an easier template.');
    console.log('Most often: no usable Chromium. Set CHROMIUM_PATH to a real binary and try again.');
    console.log(out.trim().split('\n').slice(-20).join('\n') || '(it said nothing at all)');
    return false;
  }
  if (!fs.existsSync(expectedPath)) {
    fs.writeFileSync(expectedPath, got.join('\n') + (got.length ? '\n' : ''));
    console.log('horno: first run — recorded ' + got.length + ' standing demands in content/horno/expected.txt');
    return true;
  }
  const want = fs.readFileSync(expectedPath, 'utf8').split('\n').map(l => l.trim()).filter(Boolean).sort();
  const gone = want.filter(l => !got.includes(l)), fresh = got.filter(l => !want.includes(l));
  if (!gone.length && !fresh.length) {
    console.log('  the shared suite: still the same ' + want.length + ' standing demands');
    return true;
  }
  console.log('FAIL — what the engine demands of this pack has CHANGED.');
  fresh.forEach(l => console.log('  NEW demand: ' + l));
  gone.forEach(l => console.log('  no longer demanded (the template got easier — delete this line from content/horno/expected.txt and say so in the commit): ' + l));
  return false;
}

(async () => {
  await played();
  const ok = demands() && !bad.length;
  bad.forEach(l => console.log('FAIL — ' + l));
  /* THE PASS SENTENCE, AND WHY IT IS NOT THE ONE THIS FILE FIRST SHIPPED.
     It used to read "the same three rounds change in all four cameras", and the before/after sheet
     rendered from this very tree showed the iso column as a flat coloured slab in all three rows —
     no bench, no pan, no rounds. The picture refuted the sentence, and the sentence was the one CI
     and the owner read. A pass line is a claim; it says what was measured and nothing wider. */
  if (ok) console.log('OK — el horno: you walk to the tray on the dpad, press Read, press a shell, and the same three rounds are wearing it — as a SHAPE in top, front and 3D, and as a COLOUR in iso, where drawIso draws no object at all. You walk to the other bench, push the dough with a real drag, and it comes together WHERE THE HAND WENT — the far third measured at exactly zero — reaches its last band by hand in a sitting, works from the keyboard too, and the rounds on the tray change with it in 3D. The bench she works at was measured against her, painted and scanned, and stands between her hip and her face. Two benches, one tray, and nothing here waits on anything.');
  process.exit(ok ? 0 : 1);
})().catch(e => { console.log('FAIL — el horno could not be run at all: ' + e.message); process.exit(1); });
