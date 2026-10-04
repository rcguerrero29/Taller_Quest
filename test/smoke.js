/* Meridian Quest headless smoke test.
 *
 * Runs the real game in headless Chromium and checks every invariant that has
 * bitten us (or could): boot errors, world/portal validators, BFS reachability
 * (at boot AND after the construction site completes), EN/ES content parity,
 * XP math, the retry-until-correct rules, and the wardrobe for both pets.
 *
 * Setup:   npm install playwright-core
 * Run:     node test/smoke.js
 * Chromium: set CHROMIUM_PATH, or rely on the fallbacks below.
 * Exit code 0 = all green; 1 = failures (listed on stdout).
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

/* EVERY file under engine/, read off disk — never a list of names typed here.
   Both portability guards below used to say ['engine.js','engine3d.js'], which is a PROXY for
   "the shared engine": correct on the day it was written and wrong the first time the engine
   grows a third file. Crew 14 planted an engine/shapes.js spelling this pack's transit brand
   and both guards printed OK (docs/REGRESSION.md, the proxy register). The noun is the folder.
   Not finding it is a RED, never a pass: an unreadable shelf must not read as an empty one. */
const ENGINE_DIR = path.join(__dirname, '..', 'engine');
function engineFiles(fails) {
  let names = [];
  try { names = fs.readdirSync(ENGINE_DIR).filter(n => n.endsWith('.js')).sort(); }
  catch (e) { fails.push('portability: engine/ could not be read (' + e.code + ') — the guard that keeps this pack\'s names out of the engine cannot run, which is a failure and not a pass'); return []; }
  if (!names.length) fails.push('portability: engine/ holds no .js file — either the engine moved or this guard is now pointed at nothing; it is not a pass either way');
  return names;
}

const CANDIDATES = [
  process.env.CHROMIUM_PATH,
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  '/opt/pw-browsers/chromium',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
].filter(Boolean);

(async () => {
  let exe;
  try { const p = chromium.executablePath(); if (p && fs.existsSync(p)) exe = p; } catch (e) {}
  if (!exe) exe = CANDIDATES.find(p => { try { return fs.existsSync(p) && fs.statSync(p).isFile(); } catch (e) { return false; } });
  if (!exe) { console.error('No Chromium found. Set CHROMIUM_PATH.'); process.exit(1); }
  const fails = [];
  // the cast: no key declared twice in NPCE / NPCN — the later wins silently and a neighbour is labelled the mercado's owner (Nacho, 2026-09-07)
  {
    const src = fs.readFileSync(path.resolve(__dirname, '..', 'content', 'meridian', 'npcs.js'), 'utf8');
    src.split('\n').filter(l => /^(const NPCE=|\s*en:\{|\s*es:\{)/.test(l)).forEach(l => {
      const keys = [...l.matchAll(/(?:^|[{,])\s*([a-z][a-z0-9_]*)\s*:/g)].map(m => m[1]).filter(k => !['en', 'es'].includes(k));
      const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
      if (dup.length) fails.push('a cast key is declared twice: ' + [...new Set(dup)].join(', '));
    });
  }
  // version lockstep: sw.js CACHE and config.js GAMEV must move together
  {
    const sw = fs.readFileSync(path.resolve(__dirname, '..', 'sw.js'), 'utf8');
    const cfg = fs.readFileSync(path.resolve(__dirname, '..', 'content', 'meridian', 'config.js'), 'utf8');
    const swv = (sw.match(/CACHE = "(mq-v\d+)"/) || [])[1];
    const gv = (cfg.match(/GAMEV="(mq-v\d+)"/) || [])[1];
    if (!swv || !gv || swv !== gv) fails.push(`version lockstep broken: sw=${swv} config=${gv}`);
    // the city record (#14): status.json is served network-first, before the cache-first path, or a clerk is stale forever
    const rec = sw.indexOf('status.json'), cf = sw.indexOf('caches.match(e.request, { cacheName: CACHE }).then(hit => hit || fetch');
    if (rec < 0 || cf < 0 || rec > cf) fails.push('sw.js does not serve status.json network-first');
    if (!fs.existsSync(path.resolve(__dirname, '..', '.github', 'workflows', 'pages.yml')) || !fs.existsSync(path.resolve(__dirname, '..', '.github', 'scripts', 'city-record.js'))) fails.push('no deploy writes the city record (#14)');
  }
  const browser = await chromium.launch({ executablePath: exe });
  // #254: every refusal under the page's own policy is a red — on a player's phone it is silent.
  // #256: on EVERY page this file opens, not only the first, and BY CONSTRUCTION: the browser hands each new page
  // to the watcher, so a check added later with a browser of its own is watched without anybody remembering to.
  // The first draft called watchPolicy() at each place a page was opened; two checks landed on main the same day
  // and opened pages that draft never saw. Since style-src is 'self' a refused style is a silent visual break.
  const refused = [], watched = new WeakSet();
  const watchPolicy = p => { if (watched.has(p)) return; watched.add(p); watchPolicy.n = (watchPolicy.n || 0) + 1;
    p.on('console', m => { if (/Content Security Policy/i.test(m.text())) refused.push(m.text().slice(0, 220)); }); };
  { const ctx0 = browser.newContext.bind(browser), page0 = browser.newPage.bind(browser);
    browser.newContext = async (...a) => { const c = await ctx0(...a); c.on('page', watchPolicy); return c; };
    browser.newPage = async (...a) => { const p = await page0(...a); watchPolicy(p); return p; }; }
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  const warns = [];
  page.on('console', m => { if (m.type() === 'warning') warns.push(m.text()); });
  // fail external fetches (Google Fonts) instantly — a hanging CDN must never stall the suite
  await page.route('**', r => r.request().url().startsWith('file://') ? r.continue() : r.abort());

  const index = 'file://' + path.resolve(__dirname, '..', 'index.html');
  await page.goto(index);
  await page.waitForTimeout(1200);

  // ---- 1. boot: no JS errors, no validator warnings (WORLD/PORTAL/REACH) ----
  if (pageErrors.length) fails.push('page errors: ' + pageErrors.join(' | '));
  /* mqwarn (engine.js:27) emits `("CRIT " if crit) + kind + ": " + message`, and EVERY kind in the
     engine is lowercase. This filter was anchored and uppercase, so it matched zero characters —
     which means a portal spawning inside a wall (engine.js:239), a short map row, an unreachable
     room and a stranded wanderer have all been detected by the engine and invisible to the build
     since the day this line was written. Seventh guard in this repo to read a proxy for the thing,
     and the worst of them, because it silences four others. Proven by planting, not by review. */
  const valWarns = warns.filter(w => /^(?:CRIT )?(world|portal|reach|room|wander|arrival):/i.test(w));
  if (valWarns.length) fails.push('validator warnings: ' + valWarns.join(' | '));

  // ---- 2. static invariants inside the page ----
  // #126 — the chair used to trap you. The creator panel grew and had no height of its own, so on a short screen
  // the finish button fell below the fold with nothing able to scroll: at the start the page scrolls, but the chair
  // opens this panel over the world, where it cannot. Checked at a phone's height, with every row showing.
  {
    await page.setViewportSize({ width: 390, height: 560 });
    const t2 = await page.evaluate(() => {
      const problems = [];
      const bl = (typeof BUILDS !== 'undefined' ? BUILDS : []).find(b => b.tpl === 'barberia'), who = GRW().barberNpc;
      if (!bl || !who) return problems;
      const keep = { world, px, py, season: seasonPick };
      seasonSet('muertos');
      const rm = WORLDS[bl.id], n = rm && rm.npcs.find(x => x.npc === who);
      if (n) {
        world = bl.id; px = fx = n.x; py = fy = n.y + 1; moving = false; held = null; checkTalk(); $('talk').click();
        const pnl = $('creator'), out = $('begin');
        if (pnl.hidden) problems.push('the chair did not open');
        else { const cs = getComputedStyle(pnl), bs = getComputedStyle(out);
          const pr = pnl.getBoundingClientRect(), br = out.getBoundingClientRect();
          if (pr.bottom > window.innerHeight + 1) problems.push(`the chair's panel runs ${Math.round(pr.bottom - window.innerHeight)}px past the bottom of the screen`);
          if (br.bottom > window.innerHeight + 1) problems.push(`the way out of the chair sits ${Math.round(br.bottom - window.innerHeight)}px below the screen`);
          if (cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') problems.push('the chair\'s panel does not scroll inside itself');
          if (bs.position !== 'sticky') problems.push('the way out of the chair does not ride the bottom of the panel');
          if (br.width < 40 || br.height < 20) problems.push('the way out of the chair has no size');
          out.click(); if (!$('creator').hidden) problems.push('pressing the way out does not leave the chair'); }

        /* ---- AND THE CHAIR SURVIVES HER HAVING A QUEST ----
           For the whole life of this engine a person was ONE thing: checkTalk's chain is else-if and
           a pending quest is its first branch, so a quest deleted `dataset.chatn` and that key is the
           only thing the chair, the fitting room, a room host and a carried document are dispatched
           from. Give the barber a quest and the chair the owner asked for on 2026-09-07 silently
           disappeared for as long as it was unanswered — with every suite green, because nobody in
           either game had both until a district was planned for her.
           Found by a plant aimed at a completely different guard (docs/POSTMORTEM.md §13w), so this
           is the check that would have caught it on purpose. It hands her a quest, asserts Talk
           offers the QUEST and the new button offers the SERVICE, presses the service, and puts her
           back exactly as she was. */
        const hadQ = n.q;
        const free = QEN.findIndex((_, i) => !done.has(i) && qOpen(i));
        if (free < 0) problems.push('no open quest to lend the barber, so the two-things check measured nothing — that is not a pass.');
        else {
          n.q = [free]; checkTalk();
          const tb = $('talk'), sb = $('serve');
          if (tb.hidden || tb.dataset.qi === undefined)
            problems.push('with a quest on her, the barber stopped offering the quest: Talk is ' + (tb.hidden ? 'hidden' : 'showing "' + tb.textContent + '"') + '.');
          if (!sb) problems.push('this shell has no #serve button, so a person who has a quest AND runs something can only ever offer one of them.');
          else if (sb.hidden)
            problems.push('the barber has a quest and runs the chair, and only the quest is offered — the chair is gone until the quest is answered. checkTalk sets dataset.qi and deletes dataset.chatn, and dataset.chatn is the only thing the chair is dispatched from. The owner asked for that chair on 2026-09-07.');
          else {
            sb.click();
            if ($('creator').hidden) problems.push('the service button is showing beside the barber\'s quest and pressing it does not open the chair.');
            else { $('begin').click(); }
          }
          n.q = hadQ; checkTalk();
        }
      }
      seasonSet(keep.season || 'auto'); world = keep.world; px = fx = keep.px; py = fy = keep.py;
      return problems;
    });
    t2.forEach(m => fails.push(m));
    await page.setViewportSize({ width: 480, height: 900 });
  }
  // el trolley (owner, 2026-09-08): it runs a line nothing stands on, it comes on its own, it waits for anyone
  // crossing, and it comes when you stand at a stop. TROLLEYAT is content; the engine knows only the line.
  {
    const t = await page.evaluate(() => {
      const problems = [];
      if (typeof TROLLEYAT === 'undefined' || !TROLLEYAT.length) { problems.push('the city declares no trolley line'); return problems; }
      if (typeof troStops !== 'function') { problems.push('this engine cannot be asked where a trolley stop is — the city says where its stops are and nothing reads it'); return problems; }
      TROLLEYAT.forEach(L => {
        const w = WORLDS[L.world];
        if (!w) { problems.push('the trolley runs in a world that does not exist: ' + L.world); return; }
        const keep = { world, px, py, st: TRO.state, x: TRO.x, t: TRO.t };
        /* park somewhere the trolley is NOT called from. Standing at a stop calls it, on purpose,
           so "it comes on its own" can only be tested away from one — this used to park at the
           line's own end, which stopped being neutral the moment a stop was put where the trolley
           actually terminates (#125). The middle of the run is neutral in both worlds. */
        const park = Math.round((L.from + L.to) / 2);
        world = L.world; px = fx = park; py = fy = L.row + 2; moving = false;
        // nothing stands on the line — no wall, no lot, no person, no door
        const bad = troBlocked(L.world);
        if (bad.length) problems.push(`something stands on the trolley's line in ${L.world}: ${bad.join(' ')}`);
        /* #125, the owner: "a trolley icon stands at the end of the construction — why?" It was a real
           stop, standing two rows off its own rails at the far corner of the site, past the end of the
           run. Nothing on screen could tell you it was a stop, because it was nowhere near a trolley.
           A stop belongs beside the line it serves, within reach of where the trolley actually goes. */
        /* Since 2026-09-11 a stop is a thing the LINE declares, not a letter the engine reads out
           of one town's alphabet (docs/TAGS.md L20), and "the stop stands away from its own line"
           moved into the engine's own boot audit, where a second world gets it too. What is left
           here is a PACK CONSISTENCY question the engine cannot ask and must not: the map's stop
           glyph and the line's declared stops are one fact said twice, and they must agree.
           A painted stop nobody serves is a bench that summons nothing; a served stop nobody
           painted is a place the tram stops for no reason a player can see. */
        const declared = troStops(L).map(s => s.x + ',' + s.y);
        const painted = [];
        for (let yy = 0; yy < w.H; yy++) for (let xx = 0; xx < w.W; xx++) if (w.rows[yy][xx] === 'Y') painted.push(xx + ',' + yy);
        declared.filter(k => painted.indexOf(k) < 0).forEach(k => problems.push(`the trolley line in ${L.world} serves ${k}, and the map paints no stop there — the tram stops for nothing anyone can see`));
        painted.filter(k => declared.indexOf(k) < 0).forEach(k => problems.push(`a trolley stop is painted at ${k} in ${L.world} and the line does not serve it — a bench that summons nothing`));
        if (!declared.length) problems.push(`the trolley line in ${L.world} serves no stops at all`);
        // it comes on its own
        TRO.state = 'away'; TRO.t = 0; TRO.called = false; px = fx = park; py = fy = L.row + 2;
        troUpdate(100); if (TRO.state !== 'away') problems.push('the trolley leaves before its time');
        troUpdate(TRO_EVERY); if (TRO.state === 'away') problems.push('the trolley never comes on its own');
        const x0 = TRO.x; troUpdate(500); if (TRO.x === x0) problems.push('the trolley does not move');
        // it waits for anyone on the line ahead of it
        py = fy = L.row; px = fx = Math.round(TRO.x + TRO.dir * 2);
        troUpdate(200); if (TRO.state !== 'hold') problems.push('the trolley does not stop for someone crossing');
        const xh = TRO.x; troUpdate(200); if (TRO.x !== xh) problems.push('the trolley rolls through someone crossing');
        py = fy = L.row + 2; troUpdate(TRO_HOLD + 200); if (TRO.state === 'hold') problems.push('the trolley never starts again once the way is clear');
        // it comes when you stand at a stop
        TRO.state = 'away'; TRO.t = 0; TRO.called = false;
        const s0 = troStops(L)[0];
        if (!s0) problems.push('the trolley\'s world has no stop to call it from');
        else { px = fx = s0.x; py = fy = s0.y; troUpdate(50);
          if (!TRO.called && TRO.state === 'away') problems.push('standing at the stop does not call the trolley'); }
        /* ...and a stop is what the line SAYS. Plant the violation: take the stops away and stand
           on the very tile the map still paints as one. If the trolley still comes, the engine is
           reading the picture instead of the declaration, which is the bug this seam removed and
           the shape every wrong fix for it takes. */
        { const saved = L.stops; delete L.stops;
          TRO.state = 'away'; TRO.t = 0; TRO.called = false;
          if (s0) { px = fx = s0.x; py = fy = s0.y; troUpdate(50);
            if (TRO.state === 'run') problems.push('standing where the map draws a stop brings the trolley to a line that serves no stops — the engine is reading the picture, not the line');
            if (troIsStop(L.world, s0.x, s0.y)) problems.push('a tile the line does not serve is still a stop — the trolley pass opens where nothing stops'); }
          if (saved) L.stops = saved; TRO.state = 'away'; TRO.t = 0; TRO.called = false; }
        world = keep.world; px = fx = keep.px; py = fy = keep.py; TRO.state = keep.st; TRO.x = keep.x; TRO.t = keep.t;
      });
      // it draws in the flat cameras and stands in 3D
      const L0 = TROLLEYAT[0]; const keep2 = { world, px, py, cam: camMode };
      world = L0.world; px = fx = L0.from + 3; py = fy = L0.row + 2; moving = false; TRO.state = 'run'; TRO.x = L0.from + 2; TRO.dir = 1;
      const d0 = troDraw2D; let drew = 0; troDraw2D = function () { drew++; return d0.apply(this, arguments); };
      camSet('top'); draw(); camSet('front'); draw(); troDraw2D = d0;
      if (drew < 2) problems.push('the top and front cameras do not draw the trolley');
      camSet('3d'); draw3d();
      const tram = T3.tram;
      if (!tram || !tram.visible) problems.push('the trolley does not stand in 3D');
      else if (Math.abs(tram.position.z - (L0.row + 0.5)) > 0.6) problems.push('the trolley in 3D is not on its line');
      TRO.state = 'away'; camSet('3d'); draw3d(); if (T3.tram && T3.tram.visible) problems.push('the trolley is still there when it has gone');
      world = keep2.world; px = fx = keep2.px; py = fy = keep2.py; camSet(keep2.cam);
      return problems;
    });
    t.forEach(m => fails.push(m));
  }
  const stat = await page.evaluate(() => {
    const problems = [];
    const keys = o => Object.keys(o).sort().join(',');
    if (keys(UI.en) !== keys(UI.es)) {
      const en = new Set(Object.keys(UI.en)), es = new Set(Object.keys(UI.es));
      problems.push('UI keys differ: EN-only=' + [...en].filter(k => !es.has(k)) + ' ES-only=' + [...es].filter(k => !en.has(k)));
    }
    ['flavor', 'locs', 'classes', 'chat', 'arrive', 'pass'].forEach(k => {
      if (keys(UI.en[k]) !== keys(UI.es[k])) problems.push('UI.' + k + ' subkeys differ');
    });
    if (UI.en.careEvents('X').length !== UI.es.careEvents('X').length) problems.push('careEvents length differs');
    if (UI.en.styles.length !== UI.es.styles.length) problems.push('styles length differs');
    if (keys(NPCN.en) !== keys(NPCN.es)) problems.push('NPCN keys differ');
    Object.keys(NPCN.en).forEach(k => { if (!NPCE[k]) problems.push('NPCE missing emoji: ' + k); });

    /* the doc id is part of a quest's shape: a node that hands over paper in English and not
       in Spanish is exactly the drift a shared DOCS entry exists to make impossible. */
    const shape = q => q.npc + '|' + q.start + '|' + Object.entries(q.nodes).map(([k, n]) =>
      k + ':' + n.ch.map(c => c.next ? '>' + c.next : c.out.r).join(',') +
      (n.doc ? '#' + n.doc : '')).join(';');
    if (QEN.length !== QES.length) problems.push('quest count EN=' + QEN.length + ' ES=' + QES.length);
    QEN.forEach((q, i) => { if (QES[i] && shape(q) !== shape(QES[i])) problems.push('quest ' + i + ' EN/ES shape mismatch'); });
    if (shape(FQEN) !== shape(FQES)) problems.push('fred quest EN/ES shape mismatch');

    let max = 0;
    QEN.forEach(q => { max += 10; Object.values(q.nodes).forEach(n => n.ch.forEach(c => { if (c.next) max += 10; })); });
    if (max !== MAXXP) problems.push('MAXXP=' + MAXXP + ' but max achievable=' + max);

    /* WHO ACTUALLY ASKS IT — the people standing in the rooms, not the table they are seeded from.
       This read `WNPC`, the declaration of which letter on which map is which person, and that was a
       PROXY for "somebody asks this quest" which stopped being true twice over:

       - A TEMPLATE-BUILT ROOM takes its people from the interior's own `people` and never touches
         `WNPC` (engine.js, grep `wnpcs.push` — two call sites, and only one of them reads WNPC). So a
         quest carried by anybody in a room a BUILD brought with it read as orphaned. PLANTED: quest 13
         moved off Lupe and onto Naye in the barbería, who really does ask it, and this printed
         `quest 13 unassigned`.
       - A `WNPC` ENTRY WHOSE LETTER IS IN NO MAP is never placed in any world, so its quests can be
         started by nobody — and reading the declaration made that INVISIBLE. PLANTED: Rosa's station
         letter changed to one no map contains, and the whole suite came back
         `OK — 60 quests, maxXP 880, all invariants hold.` **That is the dangerous direction**: a false
         red costs a build, a false green ships a quest a player can never reach.

       Both are the same fault and both predate La llave (2026-09-07), when a person first gained a
       second place to stand. Reading the worlds catches both, because a world's `npcs` is what the
       engine itself asks when it decides who is standing in front of you. No growth pass is needed:
       `applyBuilds()` runs unconditionally at load and `BLDS()` is not gated on `chSeen`, so every
       template interior and its people exist from the first frame. */
    const assigned = new Set();
    Object.entries(WORLDS).forEach(([wid, w]) => (w.npcs || []).forEach(n => (n.q || []).forEach(qi => {
      assigned.add(qi);
      if (!QEN[qi]) problems.push((n.npc || n.key) + ' in ' + wid + ' asks quest ' + qi + ', and there is no such quest');
    })));
    QEN.forEach((_, i) => { if (!assigned.has(i)) problems.push('quest ' + i + ' is asked by nobody — no person standing in any world carries it, so a player can never start it. (This reads the people in the rooms, not the WNPC table: a station letter that appears in no map, and anybody in a room a build brought with it, were both invisible here until 2026-09-23.)'); });
    // every district's last visit is written in both languages: three endings, the burnout,
    // and the toast that opens the next lot (or says nothing opens). A chapter wired
    // to a missing key would print "undefined" on the one screen the player waited for.
    CHS().forEach((c, i) => { const k = epiKeys(i, i === CHS().length - 1);
      [k.pre + '1', k.pre + '2', k.pre + '3', k.go, k.open].forEach(key => {
        if (typeof UI.en[key] !== 'string' || typeof UI.es[key] !== 'string') problems.push('district ' + c.id + ': strings.js has no ' + key + ' in both languages'); }); });
    Object.values(WORLDS).forEach(w => w.npcs.forEach(n => { if (!lookOf(n)) problems.push('no look for ' + n.npc + ' (' + n.key + ')'); }));

    if (auditReach().length) problems.push('boot reachability: ' + auditReach().join(' | '));
    // post-construction: the Studio (and Xochi) must be reachable once La Obra completes
    done.add(12); done.add(13); world = 'st'; px = fx = 2; py = fy = 10; applyStaged();
    if (auditReach().length) problems.push('post-obra reachability: ' + auditReach().join(' | '));
    if (isSolid(px, py)) problems.push('the staged build left the hero inside a wall');
    done = new Set(); world = 'hq'; px = fx = 10; py = fy = 11;
    return { problems, quests: QEN.length, maxXP: max };
  });
  fails.push(...stat.problems);

  // ---- 3. gameplay flow: retry rules, XP deltas, wardrobe ----
  await page.click('.classes button[data-c="architect"]');
  await page.click('#begin');
  await page.waitForTimeout(200);
  const clickChoice = async pred => page.evaluate(p => {
    const c = curQ.nodes[node].ch.find(eval(p));
    [...document.getElementById('choices').children].find(b => b.textContent === c.t).click();
  }, pred);
  const header = () => page.evaluate(() => document.querySelector('#verdict h2').textContent);

  // hearts are OFF by default now (open world). Turn them on for the lives tests.
  await page.evaluate(() => { stakesAdmin = { mode: 'hearts' }; hearts = 3; });

  // bad pick: heart lost, quest open, no reveal
  await page.evaluate(() => questStart(1));
  await clickChoice(`c => c.out && c.out.r === 'bad'`);
  const t1 = await page.evaluate(() => ({
    hearts, open: !done.has(1),
    revealed: [...document.getElementById('choices').children].some(b => b.classList.contains('right')),
  }));
  if (t1.hearts !== 2) fails.push('bad pick did not cost a heart');
  if (!t1.open) fails.push('bad pick completed the quest');
  if (t1.revealed) fails.push('miss revealed the correct answer');
  await page.click('#next');

  // mid then ok: +5 then +5 (delta), header honest
  await page.evaluate(() => questStart(1));
  await clickChoice(`c => c.out && c.out.r === 'mid'`);
  const h1 = await header();
  if (!h1.includes('+5 XP')) fails.push('first mid header wrong: ' + h1);
  await page.click('#next');
  await page.evaluate(() => questStart(1));
  await clickChoice(`c => c.out && c.out.r === 'ok'`);
  const h2 = await header();
  if (!h2.includes('+5 XP')) fails.push('ok-after-mid header wrong: ' + h2);
  const t2 = await page.evaluate(() => ({ xp, done1: done.has(1) }));
  if (t2.xp !== 10) fails.push('XP after mid+ok should be 10, got ' + t2.xp);
  if (!t2.done1) fails.push('ok pick did not complete the quest');
  await page.click('#next');

  // wardrobe: attempt (fail) quest 15 -> settings button appears; dress both pets
  await page.evaluate(() => { hearts = 3; questStart(15); });
  await clickChoice(`c => c.out && c.out.r === 'bad'`);
  await page.click('#next');
  await page.click('#gear');
  if (await page.evaluate(() => document.getElementById('openWd').hidden)) fails.push('wardrobe button hidden after quest-15 attempt');
  await page.click('#openWd');
  await page.evaluate(() => {
    document.querySelectorAll('#wdRowBandana .sw')[1].click();
    document.getElementById('wdTabC').click();
  });
  await page.evaluate(() => {
    document.querySelectorAll('#wdRowBandana .sw')[2].click();
    document.querySelectorAll('#wdRowCollar .sw')[1].click();
  });
  const t3 = await page.evaluate(() => ({
    capeRowHiddenForCat: document.getElementById('wdRowCape').hidden,
    saved: JSON.parse(localStorage.getItem('mq1')),
  }));
  if (!t3.capeRowHiddenForCat) fails.push('cape row visible for Canela');
  if (!t3.saved.wr || !t3.saved.wr.bandana) fails.push('dog wear not saved');
  if (!t3.saved.wc || !t3.saved.wc.bandana || !t3.saved.wc.collar) fails.push('cat wear not saved');

  // ---- 3a1. chapters: Week One closes, the epilogue hands over, El Mercado opens ----
  const chap = await page.evaluate(() => {
    const problems = [];
    const week1 = CHAPTERS[0], merc = CHAPTERS[1];
    // the owner's rule: write the full pack, need fewer than all of it to close the district
    if (!(merc.need < merc.quests.length)) problems.push('mercado `need` must be lower than its pack size');
    done = new Set(); chSeen = 0; hearts = 3; applyGrowth();
    if (chDue()) problems.push('chapter reported due on a fresh save');
    if (ribbonUp()) problems.push('El Mercado open before the first district closed');
    if (WORLDS.st.rows[13][6] === 'M') problems.push('mercado door on the street before it was earned');

    week1.quests.forEach(i => done.add(i));
    if (!chDue()) problems.push('Week One closed but no epilogue is due');
    hearts = 2; finish();
    if (!document.getElementById('epi').textContent) problems.push('no epilogue text on the chapter close');
    if (document.getElementById('endGo').hidden) problems.push('handover button hidden with a chapter still to come');
    document.getElementById('endGo').click();
    if (chSeen !== 1) problems.push('handover did not advance the chapter cursor');
    if (hearts !== 3) problems.push('the new week did not restore hearts');
    if (world !== 'st') problems.push('handover did not put the hero on the street: ' + world);
    if (isSolid(px, py)) problems.push('handover dropped the hero inside a wall');
    if (!ribbonUp()) problems.push('El Mercado did not open on the handover');
    if (WORLDS.st.rows[13][6] !== 'M') problems.push('mercado door missing from the street');
    // Week One included La Obra, so the Studio must be standing and Lupe streetside
    if (WORLDS.st.rows[5][21] !== 'O') problems.push('Studio door missing after a rewind + rebuild');
    { const lu = WORLDS.st.npcs.find(n => n.key === 'e');
      if (!lu || lu.x !== 7 || lu.y !== 7) problems.push('Lupe did not move streetside after a rewind + rebuild'); }
    if (auditReach().length) problems.push('post-mercado reachability: ' + auditReach().join(' | '));

    // every district from the mercado on closes at `need` AND on the visit that ends it — never on
    // a full sweep; every one but the last hands over to the next lot, and the last returns you to
    // the city.
    //
    // #208 changed what "closed" means and this block had to follow it. It answered the FIRST
    // `need` quests, which under the old pure count was enough — and that is exactly the hole the
    // owner's bug lived in: the closing visit sat outside the count, so a district could tell you
    // how its story ended while the person who ends it was still standing there with the question.
    // The claim worth keeping is unchanged and is checked below: you never have to answer them all.
    for (let ci = 1; ci < CHAPTERS.length; ci++) {
      const c = CHAPTERS[ci], last = ci === CHAPTERS.length - 1, k = chClose(c);
      if (!(c.need < c.quests.length)) problems.push(`district ${c.id}: need must be lower than its pack size`);
      /* EVERY ENDING A DISTRICT HAS MUST BE REACHABLE, and the arithmetic is the whole check.
         A district ends the instant `need` quests are answered (chClosed), and gradeOf divides by
         how many were ANSWERED — not by how many exist. So at the moment the ending is picked the
         denominator IS `need`, the only scores possible are 0/need .. need/need, and the grade
         bands are 0.9 and 0.6. At need:2 that gives 0, 0.5, 1 -> grades 1, 1, 3: GRADE 2 CAN NEVER
         HAPPEN. Somebody writes three endings, two of them ever appear, nothing errors, no test
         fails, and the only way to find out is to do this multiplication.
         Caught by Nacho in 2026-09-16 while COSTING El Espejo, which was signed at need:2 and not
         yet built — so no ending has ever been lost in this game, and every shipped district
         reaches 1, 2 and 3 today. It was written into docs/CITY.md as prose and guarded nowhere,
         which is why it is here: a lesson in a ledger is not a guard, and the next district added
         at need:2 would have passed the line above it. */
      {
        const bands = [];
        for (let k = 0; k <= c.need; k++) { const clean = k / c.need; bands.push(clean >= 0.9 ? 3 : clean >= 0.6 ? 2 : 1); }
        const reach = [...new Set(bands)];
        [1, 2, 3].forEach(g => { if (!reach.includes(g))
          problems.push(`district ${c.id}: grade ${g} can never happen, so the ending written for it is never shown. It closes at need:${c.need}, and gradeOf divides by how many were ANSWERED — which at the ending is exactly need — so the only scores are ${bands.map((_, k) => k + '/' + c.need).join(', ')} and they land on grades ${bands.join(', ')}. A district needs at least four quests and need:3 for all three endings to be reachable.`); });
      }
      if (k !== null && c.quests.indexOf(k) < 0) problems.push(`district ${c.id}: the quest it closes on (${k}) is not one of its own`);
      // the count alone, WITHOUT the closing visit, must not be enough
      if (k !== null) {
        /* a probe, and it must LEAVE NOTHING BEHIND: its answers were still in `done` when the real
           set was built below, which turned la esquina's three-of-four into a full sweep and failed
           a rule the game was keeping. A check that dirties the state it shares is a check that
           breaks the next one. */
        const before = new Set(done);
        c.quests.filter(i => i !== k).slice(0, c.need).forEach(i => done.add(i));
        if (chDue()) problems.push(`district ${c.id} closed on ${c.need} answers that skipped its last visit — the ending can play before the quest that ends it`);
        /* `done` is cumulative across the districts this loop has already walked, so its SIZE is not
           this district's tally — the first draft compared a global count against one district's
           length and failed every district while the game was behaving. Count this district's own. */
        if (c.quests.every(i => done.has(i))) problems.push(`district ${c.id}: the check needed every quest, so it proved nothing`);
        done = before;
      }
      /* the closing visit AND need-1 others — `need` answers in total, one of which is the closer.
         Taking the first `need` and then adding the closer answers need+1 and made la esquina
         (need:3 of 4) look like a full sweep when it is three of four. The guard was building a
         set the rule does not ask for. */
      if (k !== null) done.add(k);
      c.quests.filter(i => i !== k).slice(0, Math.max(0, c.need - (k === null ? 0 : 1))).forEach(i => done.add(i));
      if (c.quests.every(i => done.has(i))) problems.push(`district ${c.id} only closes on a full sweep — ❗La puerta says a place you cannot come back to is the one thing this city does not have`);
      if (!chDue()) problems.push(`district ${c.id} did not close at its need threshold`);
      finish();
      if (!document.getElementById('epi').textContent) problems.push(`district ${c.id}: no ending text`);
      if (document.getElementById('endGo').hidden) problems.push(`district ${c.id}: no way off the ending screen`);
      const wantStay = document.getElementById('endGo').textContent === UI[lang].endStay;
      if (last && !wantStay) problems.push('final district still offers a handover instead of returning to the city');
      if (!last && wantStay) problems.push(`district ${c.id} offered "stay" with districts still to come`);
      document.getElementById('endGo').click();
      if (chSeen !== ci + 1) problems.push(`district ${c.id}: the cursor did not advance`);
      if (isSolid(px, py)) problems.push(`district ${c.id}: the handover dropped the hero inside a wall`);
      if (!last && auditReach().length) problems.push(`after ${c.id}: ` + auditReach().join(' | '));
    }
    if (chSeen !== CHAPTERS.length) problems.push('final acknowledgement did not close the last chapter');
    if (chDue()) problems.push('an ending is still due after the last chapter closed');

    // rewind: a fresh run must not inherit a shop it never earned
    document.getElementById('end').hidden = true;
    done = new Set(); chSeen = 0; hearts = 3; applyGrowth();
    world = 'hq'; px = fx = 10; py = fy = 11;
    if (ribbonUp()) problems.push('replay left El Mercado standing');
    // ...and a district that has not opened yet is not answerable from the street
    if (qOpen(16)) problems.push('an unopened district\'s quests were already on offer');
    if (!qOpen(0)) problems.push('the opening district is not on offer at the start');
    if (WORLDS.st.rows[13][6] === 'M') problems.push('replay left the mercado door on the street');
    // and the city rewinds evenly: no building survives a run it was not built in
    if (WORLDS.st.rows[5][21] === 'O') problems.push('replay left the Studio standing');
    if (WORLDS.st.rows[9][20] === 'B') problems.push('replay left the Studio walls on the street');
    { const lu = WORLDS.st.npcs.find(n => n.key === 'e');
      if (!lu || lu.x !== 27 || lu.y !== 7) problems.push('replay left Lupe streetside instead of at her post'); }
    if (auditReach().length) problems.push('post-replay reachability: ' + auditReach().join(' | '));
    document.getElementById('world').hidden = false;
    return problems;
  });
  fails.push(...chap);

  // ---- 3a1b. running out of hearts ends the chapter; it never erases the city ----
  const doom = await page.evaluate(() => {
    const problems = [];
    stakesAdmin = { mode: 'hearts' };   // burnout only exists when lives are on
    done = new Set(); chSeen = 0; hearts = 3; xp = 0; marks = {}; applyGrowth();
    // build something, then burn out with most of Week One unanswered
    [12, 13].forEach(i => done.add(i)); applyGrowth();
    if (WORLDS.st.rows[5][21] !== 'O') problems.push('setup: Studio did not go up');
    hearts = 0; save();
    if (!chDue()) problems.push('zero hearts did not end the chapter');
    if (!localStorage.getItem('mq1')) problems.push('the save was deleted at zero hearts');
    finish(true);
    if (document.getElementById('endTitle').textContent !== UI[lang].goTitle)
      problems.push('burnout did not show the burnout title');
    if (document.getElementById('endGo').hidden) problems.push('burnout offers no way forward');

    document.getElementById('endGo').click();
    if (chSeen !== 1) problems.push('burnout did not move the story on to the next chapter');
    if (hearts !== 3) problems.push('the new week did not restore hearts after a burnout');
    if (xp !== 0) problems.push('burnout changed XP');
    if (!done.has(12) || !done.has(13)) problems.push('burnout erased answered quests');
    if (WORLDS.st.rows[5][21] !== 'O') problems.push('burnout tore down the Studio');
    if (!ribbonUp()) problems.push('burnout did not open the next district');
    // owner's law (docs/OWNER.md, 2026-09-01): no practice is ever missed. Ending a
    // district's ARC never closes its quests — they stay answerable, and the ❗ stays up.
    if (!qOpen(0)) problems.push('a Week One quest closed behind the player');
    { const tovar = WORLDS.hq.npcs.find(n => n.npc === 'tovar');
      if (!tovar || pendingAt(tovar) === undefined) problems.push('an unanswered quest lost its marker when its district closed'); }
    if (!qOpen(16)) problems.push('the new chapter\'s quests are not on offer');

    // a quest answered after its district's last visit gets its reframe line, at the
    // opening node only. Content's call: no `late` field, no line, nothing breaks.
    if (!qLate(0)) problems.push('a Week One quest does not read as late once the mercado opened');
    if (qLate(16)) problems.push('the district being played reads as late');
    { const q = AQ()[0], had = q.late, el = document.getElementById('npcLate');
      q.late = 'REFRAME-PROBE';
      questStart(0);
      if (el.hidden) problems.push('the late reframe line did not show');
      if (el.textContent !== 'REFRAME-PROBE') problems.push('the late reframe line showed the wrong text');
      node = Object.keys(q.nodes).find(k => k !== q.start);
      if (node) { nodeShow(); if (!el.hidden) problems.push('the reframe line repeated on a follow-up step'); }
      delete q.late; if (had !== undefined) q.late = had;
      questStart(16);
      if (!el.hidden) problems.push('a quest with no late line still showed one');
      cur = null; curQ = null; node = null;
      document.getElementById('card').hidden = true;
      document.getElementById('world').hidden = false; }

    // the ❗ on the world tag means what it means everywhere: somebody in here has
    // something to say. It was hardcoded to hq, so the office promised one forever.
    { const el = document.getElementById('worldTag'), keep = new Set(done);
      world = 'hq'; setWorldTag();
      if (!el.textContent.includes('❗')) problems.push('the office hides its ❗ while quests are still open there');
      WORLDS.hq.npcs.forEach(n => (n.q || []).forEach(qi => done.add(qi)));
      setWorldTag();
      if (el.textContent.includes('❗')) problems.push('the office still promises a ❗ with nothing left to answer');
      done = keep; setWorldTag(); }

    done = new Set(); chSeen = 0; hearts = 3; marks = {}; applyGrowth();
    world = 'hq'; px = fx = 10; py = fy = 11;
    return problems;
  });
  fails.push(...doom);

  // ---- 3a1d. stakes are a layer; the grade underneath is always on ----
  const stakes = await page.evaluate(() => {
    const problems = [];
    const week1 = CHAPTERS[0];

    // the pack ships open-world: no lives, nothing to lose
    stakesAdmin = null;
    if (STAKES.mode !== 'none') problems.push('the shipped pack should default to no stakes');
    if (livesOn()) problems.push('lives are on with the pack default');
    done = new Set(); marks = {}; hearts = 3; chSeen = 0;
    hud();
    if (document.getElementById('hearts').textContent !== '')
      problems.push('the HUD shows hearts when there are no lives');

    // a wrong answer with stakes off costs nothing but the mark
    hearts = 3; questStart(1);
    const bad = curQ.nodes[node].ch.find(c => c.out && c.out.r === 'bad');
    [...document.getElementById('choices').children].find(b => b.textContent === bad.t).click();
    if (hearts !== 3) problems.push('a wrong answer cost a heart with stakes off');
    if (marks[1] !== 1) problems.push('the attempt was not recorded as a mark');
    if (chDue()) problems.push('a wrong answer ended a chapter with stakes off');
    const ok = curQ.nodes[node].ch.find(c => c.out && c.out.r === 'ok');
    questStart(1);
    [...document.getElementById('choices').children].find(b => b.textContent === ok.t).click();
    if (marks[1] !== 2) problems.push('the retry was not counted toward the grade');
    if (!done.has(1)) problems.push('the right answer did not complete the quest');

    // the grade reads the marks, and a retry costs grade — not progress
    marks = {}; done = new Set();
    week1.quests.forEach(i => { done.add(i); marks[i] = 1; });
    if (gradeOf(week1) !== 3) problems.push('all-first-try did not grade 3');
    week1.quests.forEach(i => { marks[i] = 3; });
    if (gradeOf(week1) !== 1) problems.push('all-retried did not grade 1');
    week1.quests.forEach((i, n) => { marks[i] = n < 12 ? 1 : 3; });   // 75% clean
    if (gradeOf(week1) !== 2) problems.push('a mixed run did not grade 2');

    // budget is declared in content but must behave as `none` until it is built
    stakesAdmin = { mode: 'budget' };
    if (stakesMode() !== 'none') problems.push('unbuilt `budget` mode is not falling back to none');
    if (livesOn()) problems.push('`budget` switched lives on');

    // a district may override the pack, so a calm town can hold a scored challenge
    stakesAdmin = null;
    const saved = CHAPTERS[0].stakes;
    CHAPTERS[0].stakes = { mode: 'hearts', hearts: 2 };
    chSeen = 0;
    if (!livesOn()) problems.push('a district could not switch its own stakes on');
    if (startHearts() !== 2) problems.push('a district could not set its own heart count');
    CHAPTERS[0].stakes = saved;

    stakesAdmin = null; done = new Set(); marks = {}; hearts = 3; chSeen = 0;
    document.getElementById('card').hidden = true;      // the quest card would cover #gear
    document.getElementById('world').hidden = false;
    return problems;
  });
  fails.push(...stakes);

  // ---- 3a1e. the admin toggle brings hearts back for a mini-game ----
  await page.evaluate(() => { document.getElementById('end').hidden = true; document.getElementById('wardrobe').hidden = true; });
  await page.click('#gear');
  const stkUI = await page.evaluate(() => {
    const problems = [];
    admin = false; applyAdmin(); applyStakes();
    if (!document.getElementById('stkRow').hidden) problems.push('the stakes toggle is visible outside admin mode');
    admin = true; applyAdmin(); applyStakes();
    if (document.getElementById('stkRow').hidden) problems.push('the stakes toggle is hidden in admin mode');
    document.getElementById('stkHearts').click();
    if (!livesOn()) problems.push('the admin toggle did not switch hearts on');
    let stored = null; try { stored = localStorage.getItem('mqstakes'); } catch (e) {}
    if (stored !== 'hearts') problems.push('the stakes choice was not remembered: ' + stored);
    hud();
    if (!document.getElementById('hearts').textContent) problems.push('the HUD hid hearts while lives were on');
    document.getElementById('stkNone').click();
    if (livesOn()) problems.push('the admin toggle did not switch hearts back off');
    // the project's own comfort standard: the audit skips these because they are
    // admin-only and hidden when it runs, so check them here while they are visible
    ['stkNone', 'stkHearts'].forEach(id => {
      const r = document.getElementById(id).getBoundingClientRect();
      if (Math.min(r.width, r.height) < 24)
        problems.push(`tap target < 24px: #${id} (${Math.round(r.width)}x${Math.round(r.height)})`);
      if (!document.getElementById(id).textContent.trim())
        problems.push(`#${id} has no label`);
    });
    if (!document.getElementById('lbStakes').textContent.trim()) problems.push('stakes row has no label');
    admin = false; applyAdmin(); stakesAdmin = null;
    try { localStorage.removeItem('mqstakes'); } catch (e) {}
    return problems;
  });
  fails.push(...stkUI);
  await page.evaluate(() => { document.getElementById('settings').hidden = true; });

  // ---- 3a1c. restart is a Settings tool behind a two-tap confirm, not a story button ----
  await page.evaluate(() => {
    document.getElementById('end').hidden = true;
    document.getElementById('wardrobe').hidden = true;
  });
  await page.click('#gear');
  const reset = await page.evaluate(() => {
    const problems = [];
    const b = document.getElementById('replay');
    if (!b) return ['restart button missing'];
    if (!document.getElementById('settings').contains(b)) problems.push('restart is not in Settings');
    if (document.getElementById('end').contains(b)) problems.push('restart is still on the ending screen');
    xp = 99; done = new Set([1, 2]); chSeen = 1; save();
    b.click();  // first tap only arms it
    if (b.textContent !== UI[lang].replayArm) problems.push('first tap did not ask for confirmation');
    if (xp !== 99 || chSeen !== 1) problems.push('first tap already wiped the run');
    b.click();  // second tap commits
    if (xp !== 0 || chSeen !== 0 || done.size) problems.push('confirmed restart did not reset the run');
    if (b.textContent !== UI[lang].replay) problems.push('restart button stuck on the confirm label');
    return problems;
  });
  fails.push(...reset);
  await page.evaluate(() => { document.getElementById('settings').hidden = true; hearts = 3; });

  // ---- 3a2. comfort checks (template guarantee): WCAG contrast on every theme
  //           variant, and tap targets >= 24px on every visible button ----
  const comfort = await page.evaluate(() => {
    const problems = [];
    const lum = h => {
      const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
        .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const ratio = (a, b) => { const l = [lum(a), lum(b)].sort((x, y) => y - x); return (l[0] + 0.05) / (l[1] + 0.05); };
    const PAIRS = [['ink', 'bg'], ['ink', 'surface'], ['ink', 'chip'], ['ink', 'bubble'], ['muted', 'surface'], ['accent-ink', 'accent']];
    const audit = (name, mode, p) => PAIRS.forEach(([fg, bg2]) => {
      const r = ratio(p[fg], p[bg2]);
      if (r < 4.5) problems.push(`contrast ${name}/${mode} ${fg} on ${bg2} = ${r.toFixed(2)} (< 4.5)`);
    });
    // built-in palette: read the stylesheet's values in both modes via data-theme
    const readVars = () => { const cs = getComputedStyle(document.documentElement); const o = {};
      ['bg', 'surface', 'ink', 'muted', 'line', 'accent', 'accent-ink', 'chip', 'bubble', 'bubble-line']
        .forEach(k => o[k] = cs.getPropertyValue('--' + k).trim()); return o; };
    document.documentElement.dataset.theme = 'light'; audit('meridian', 'light', readVars());
    document.documentElement.dataset.theme = 'dark'; audit('meridian', 'dark', readVars());
    delete document.documentElement.dataset.theme;
    Object.entries(THEMES).forEach(([name, t]) => {
      if (!t) return;
      audit(name, 'light', t.light); audit(name, 'dark', t.dark);
    });
    // tap targets: every visible button at least 24x24 (WCAG 2.5.8)
    document.querySelectorAll('button').forEach(b => {
      const r = b.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return; // hidden
      if (Math.min(r.width, r.height) < 24) problems.push(`tap target < 24px: #${b.id || b.className || b.textContent.slice(0, 12)} (${Math.round(r.width)}x${Math.round(r.height)})`);
    });
    // theme switch applies + persists
    document.querySelector('#themeRow button[data-th="fairy"]').click();
    const acc = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    let stored = null; try { stored = localStorage.getItem('mqtheme'); } catch (e) {}
    if (!(acc === THEMES.fairy.light.accent || acc === THEMES.fairy.dark.accent)) problems.push('fairy theme did not apply: ' + acc);
    if (stored !== 'fairy') problems.push('theme not persisted: ' + stored);
    document.querySelector('#themeRow button[data-th="meridian"]').click();
    return problems;
  });
  fails.push(...comfort);

  // ---- 3a3. theme editor: clone -> sabotage -> auto-fix must repass the audit ----
  const editor = await page.evaluate(() => {
    const problems = [];
    cloneTheme('fairy');
    if (themeName !== 'custom') problems.push('clone did not select custom theme');
    if (document.getElementById('thCustom').hidden) problems.push('custom button not revealed');
    // lazy change: ink painted the same as the background, muted nearly invisible
    customTheme.light.ink = customTheme.light.bg;
    customTheme.dark.muted = customTheme.dark.surface;
    customTheme.light['accent-ink'] = customTheme.light.accent;
    autoFixTheme();
    const PAIRS = [['ink', 'bg'], ['ink', 'surface'], ['ink', 'chip'], ['ink', 'bubble'], ['muted', 'surface'], ['accent-ink', 'accent']];
    ['light', 'dark'].forEach(m => PAIRS.forEach(([fg, bg2]) => {
      const r = cRatio(customTheme[m][fg], customTheme[m][bg2]);
      if (r < 4.5) problems.push(`auto-fix left ${m} ${fg}/${bg2} at ${r.toFixed(2)}`);
    }));
    /* palette wardrobe model: mqpals is a list of named palettes, mqpal the active index */
    let pals = null; try { pals = JSON.parse(localStorage.getItem('mqpals')); } catch (e) {}
    const active = Array.isArray(pals) ? pals[parseInt(localStorage.getItem('mqpal') || '0') || 0] : null;
    if (!active || !active.light || !active.dark || !active.n) problems.push('custom palette not persisted');
    if (sanitizeTheme({ light: { bg: 'javascript:x' }, dark: null }) !== null) problems.push('sanitizeTheme accepted garbage');
    if (sanitizeTheme(active) === null) problems.push('sanitizeTheme rejected its own output');
    if (pals && pals.length > 8) problems.push('palette wardrobe exceeded its cap');
    // back to default for the rest of the suite
    themeName = 'meridian'; applyTheme();
    return problems;
  });
  fails.push(...editor);

  // ---- 3b. multiplayer stub: button opens the under-construction panel; NET seam inert ----
  await page.evaluate(() => { document.getElementById('wardrobe').hidden = true; });
  await page.click('#gear');
  await page.click('#openMp');
  const mp = await page.evaluate(() => ({
    open: !document.getElementById('mpanel').hidden,
    title: document.getElementById('mpTitle').textContent,
    netInert: typeof NET === 'object' && NET.enabled === false,
  }));
  if (!mp.open || !mp.title) fails.push('multiplayer panel did not open');
  if (!mp.netInert) fails.push('NET seam missing or enabled by default');
  await page.click('#mpClose');

  // ---- 4. care-pack personalization: pet name flows into sheet + ics ----
  await page.evaluate(() => { fredQ = 1; treats = 3; });
  await page.click('#gear');
  await page.click('#openExp');
  await page.click('#exTabCare');
  await page.evaluate(() => {
    const el = document.getElementById('petName');
    el.value = 'Canelita'; el.dispatchEvent(new Event('input'));
  });
  const care = await page.evaluate(() => ({
    sheet: document.getElementById('exArea').value.split('\n')[0],
    ics: icsData(),
    formVisible: !document.getElementById('careForm').hidden,
  }));
  if (!care.formVisible) fails.push('care form not visible in care mode');
  if (!care.sheet.includes('CANELITA')) fails.push('pet name not in care sheet: ' + care.sheet);
  if (!care.ics.includes('Canelita')) fails.push('pet name not in ics');

  // ---- 4a. decision report: the play log becomes a portfolio document ----
  await page.click('#exTabRep');
  const rep = await page.evaluate(() => ({
    text: document.getElementById('exArea').value,
    dl: !document.getElementById('exDl').hidden,
    ics: document.getElementById('exIcs').hidden,
    form: document.getElementById('careForm').hidden,
    logged: dlog.length,
  }));
  if (!rep.dl) fails.push('report download button hidden in report mode');
  if (!rep.ics) fails.push('ics button still visible in report mode');
  if (!rep.form) fails.push('care form still visible in report mode');
  if (!rep.logged) fails.push('no decisions logged after answering quests');
  if (!rep.text.includes('Free Churro Friday')) fails.push('report missing a quest the player answered');
  if (!rep.text.includes('Hallucination control')) fails.push('report missing the concept it tested');
  if (!rep.text.includes('Your call:')) fails.push('report missing the choice the player made');
  const roles = await page.evaluate(() => {
    const problems = [];
    // every chapter must declare the job it trains, or the report cannot attribute a call
    CHAPTERS.forEach(c => { if (!c.role || !c.role.en || !c.role.es) problems.push('chapter ' + c.id + ' declares no role'); });
    const txt = document.getElementById('exArea').value;
    if (!txt.includes(UI[lang].repL.roles)) problems.push('report has no roles-practiced section');
    const r = CHAPTERS.find(c => c.quests.includes(1));
    if (!r || !r.role) problems.push('the chapter holding quest 1 declares no role');
    else if (!txt.includes(r.role[lang])) problems.push('report does not name the role a played quest trains');
    else if (r.industry && !txt.includes(r.industry[lang] + ' · ' + r.role[lang])) problems.push('report does not put the industry before the role');
    return problems;
  });
  fails.push(...roles);
  await page.click('#exClose');

  // ---- 4b. security: hostile pass payloads come out sanitized; peers render safely ----
  const sec = await page.evaluate(() => {
    const out = {};
    out.qrLoaded = typeof qrcode !== 'undefined'; // CSP must not block qr.js (incl. file://)
    const evil = { v: 1, l: 'xx', s: {
      n: '<img src=x onerror=alert(1)>WayTooLongName', xp: '999999999', he: 99,
      d: { a: 1 }, px: -5, py: 1e9, lk: { shirt: 'javascript:alert(1)', style: 'x'.repeat(400) },
      qa: { __proto__: 9, constructor: 9, 5: 'zzz', '-1': 30 }, wr: { bandana: 'url(x)' },
    }};
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(evil)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    history.replaceState(null, '', '#save=' + b64);
    const p = readPass();
    history.replaceState(null, '', location.pathname);
    out.pass = p && {
      nLen: p.s.n.length, nHasTag: p.s.n.includes('<'), xp: p.s.xp, he: p.s.he,
      dIsArray: Array.isArray(p.s.d), px: p.s.px, py: p.s.py,
      shirt: p.s.lk.shirt, styleLen: p.s.lk.style.length, lang: p.l,
      qaKeys: Object.keys(p.s.qa).sort().join(','), bandana: p.s.wr.bandana,
      protoClean: !Object.prototype.hasOwnProperty.call({}, 'polluted') && ({}).x === undefined,
    };
    // peers: hostile name renders via canvas only, no throw
    PEERS = [{ id: 'p1', name: '<script>x</script>OverlongPeerName', w: world, x: px + 1, y: py, dir: 'down' }];
    try { draw(); out.peerDrawOk = true; } catch (e) { out.peerDrawOk = 'THREW ' + e.message; }
    PEERS = [];
    return out;
  });
  if (!sec.qrLoaded) fails.push('qr.js blocked (CSP?)');
  if (!sec.pass) fails.push('sanitized hostile pass was rejected entirely (should be coerced)');
  else {
    if (sec.pass.nLen > 14 || sec.pass.nHasTag === undefined) fails.push('hostile name not clamped: ' + sec.pass.nLen);
    if (sec.pass.xp !== 999) fails.push('xp not clamped: ' + sec.pass.xp);
    if (sec.pass.he !== 3) fails.push('hearts not clamped: ' + sec.pass.he);
    if (!sec.pass.dIsArray) fails.push('d not coerced to array');
    if (sec.pass.px !== 0 || sec.pass.py !== 63) fails.push('coords not clamped: ' + sec.pass.px + ',' + sec.pass.py);
    if (sec.pass.shirt !== '#8B5CF6') fails.push('bad color not rejected: ' + sec.pass.shirt);
    if (sec.pass.styleLen > 12) fails.push('style not clamped');
    if (sec.pass.lang !== 'en') fails.push('bad lang not defaulted: ' + sec.pass.lang);
    if (sec.pass.qaKeys !== '-1,5') fails.push('qa keys not filtered: ' + sec.pass.qaKeys);
    if (sec.pass.bandana !== null) fails.push('bad wear color not rejected');
  }
  if (sec.peerDrawOk !== true) fails.push('peer draw failed: ' + sec.peerDrawOk);

  // ---- 5. Trolley Pass: pass URL round-trips a save; boarding restores it ----
  await page.evaluate(() => { heroName = 'Traveler'; xp = 42; save(); });
  const passUrl = await page.evaluate(() => passURL());
  if (!/#save=[A-Za-z0-9\-_]+$/.test(passUrl)) fails.push('pass URL malformed: ' + passUrl.slice(0, 60));
  await page.evaluate(() => localStorage.removeItem('mq1')); // fresh device
  await page.goto(passUrl);
  await page.reload(); // hash-only navigation doesn't rerun boot; reload does
  await page.waitForTimeout(800);
  const banner = await page.evaluate(() => ({
    shown: !document.getElementById('tpFound').hidden,
    text: document.getElementById('tpFoundTx').textContent,
  }));
  if (!banner.shown) fails.push('pass banner not shown');
  if (!banner.text.includes('Traveler') || !banner.text.includes('42')) fails.push('pass banner text wrong: ' + banner.text);
  await page.click('#tpBoard'); // boarding reloads the page
  await page.waitForSelector('#continueBtn:not([hidden])', { timeout: 10000 }).catch(() => {});
  const boarded = await page.evaluate(() => {
    const b = document.getElementById('continueBtn');
    return b ? { cont: !b.hidden, label: b.textContent } : { cont: false, label: '(no button)' };
  });
  if (!boarded.cont || !boarded.label.includes('Traveler')) fails.push('boarding did not restore the save: ' + JSON.stringify(boarded));

  // ---- 6. Front-profile 2.5D, TILES metadata, and the dog program ----
  const front = await page.evaluate(() => {
    const out = {};
    // TILES: every solid glyph (content SOLIDX included) carries a numeric lift
    out.tilesMissing = [...SOLID].filter(g => !TILES[g] || typeof TILES[g].lift !== 'number');
    // the front camera renders a frame without throwing, and the toggle persists
    try { camSet('front'); draw(); out.frontDraw = true; } catch (e) { out.frontDraw = String(e); }
    out.camStored = localStorage.getItem('mqcam');
    try { camSet('top'); draw(); } catch (e) { out.frontDraw = 'top restore threw: ' + e; }
    // the fetch cycle: exactly 4 of every 7, cycle after cycle
    const dog = {};
    let a = 0; for (let i = 0; i < 7; i++) a += fetchRoll(dog) ? 1 : 0;
    let b = 0; for (let i = 0; i < 7; i++) b += fetchRoll(dog) ? 1 : 0;
    out.fetch7 = a; out.fetch14 = a + b;
    // food-driven: a fed dog's cycle rolls at exactly 6 of 7
    const fed = { fedT: performance.now() };
    let f = 0; for (let i = 0; i < 7; i++) f += fetchRoll(fed) ? 1 : 0;
    out.fetchFed = f;
    // BFS pathing: from a walkable hq tile, a step toward another exists,
    // and a target inside a wall is correctly unreachable
    out.bfs = (() => {
      const cr = { world: 'hq', x: 1, y: 1 };
      const step = bfsStep(cr, 3, 1);
      const blocked = bfsStep(cr, 0, 0); // (0,0) is border wall
      return { step: Array.isArray(step), blocked: blocked === null };
    })();
    // ground decals fade on their own
    const n0 = DECALS.length;
    DECALS.push({ world, x: 1, y: 1, kind: 'hole', until: Date.now() - 10 });
    drawDecals(0, 0);
    out.decalPruned = DECALS.length === n0;
    // every DECOR row points at art the engine (or the pack) actually has
    out.decorOk = typeof DECOR === 'undefined' || DECOR.every(d => !!DECODRAW[d.deco]);
    // the pack declares a default camera and the facades declare their windows
    out.camdef = typeof CAMDEF !== 'undefined' ? CAMDEF : null;
    out.cams = CAMS.slice();
    out.facadeWin = ['B', 'Q', 'Z'].every(g => TILES[g] && Array.isArray(TILES[g].win));
    // the lit-windows pass renders under a mocked night clock without throwing
    out.winPass = (() => {
      const RD = Date;
      try {
        Date = class extends RD { getHours() { return 22; } getMinutes() { return 0; } };
        drawWindows(CW(), 0, 0);
        Date = RD; return true;
      } catch (e) { Date = RD; return String(e); }
    })();
    // camera #4: three.js is vendored and a 3D frame actually renders
    out.threeOk = !!window.THREE;
    try { camSet('3d'); out.d3 = (typeof draw3d === 'function') ? draw3d() : 'missing'; }
    catch (e) { out.d3 = String(e); }
    try { camSet('top'); draw(); } catch (e) { out.d3 = 'top restore threw: ' + e; }
    // the ball button exists and the dog's strings are in both languages
    out.ballBtn = !!document.getElementById('ball');
    out.langOk = ['ballLb', 'fetchYes', 'fetchNo', 'howl', 'beagleTreat', 'camFront']
      .every(k => UI.en[k] && UI.es[k]);
    return out;
  });
  if (front.tilesMissing.length) fails.push('TILES rows missing for solid glyphs: ' + front.tilesMissing.join(','));
  if (front.frontDraw !== true) fails.push('front camera draw threw: ' + front.frontDraw);
  if (front.camStored !== 'front') fails.push('front camera choice not persisted: ' + front.camStored);
  if (front.fetch7 !== 4) fails.push(`fetch cycle: ${front.fetch7}/7 fetched, expected exactly 4`);
  if (front.fetch14 !== 8) fails.push(`fetch across two cycles: ${front.fetch14}/14, expected 8`);
  if (front.fetchFed !== 6) fails.push(`fed fetch cycle: ${front.fetchFed}/7 fetched, expected exactly 6`);
  if (!front.bfs.step) fails.push('bfsStep found no path between open hq tiles');
  if (!front.bfs.blocked) fails.push('bfsStep pathed into a wall');
  if (!front.decalPruned) fails.push('expired ground decal not pruned');
  if (front.decorOk !== true) fails.push('DECOR references unknown deco art');
  // the engine's own CAMS list is the single source of truth — this used to be a
  // third hand-written whitelist and it went stale the moment 3D was added.
  if (!front.cams.includes(front.camdef)) fails.push('CAMDEF missing or invalid: ' + front.camdef);
  if (!front.facadeWin) fails.push('facade tiles missing win metadata');
  if (front.winPass !== true) fails.push('lit-windows pass threw: ' + front.winPass);
  if (!front.threeOk) fails.push('three.js not loaded (vendor/three.min.js missing?)');
  if (front.d3 !== true) fails.push('3D camera did not render: ' + front.d3);
  if (!front.ballBtn) fails.push('ball button missing from the HUD');
  if (!front.langOk) fails.push('dog/camera strings missing in EN or ES');

  // ---- 7. El Parque: leash → rainbow bridge → chill session → recap card ----
  const park = await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const out = {};
    const w = WORLDS.pk;
    out.pkOk = !!w && w.W === 24 && w.H === 12 && !!PORTALS.pk && !!PORTALS.pk['2'];
    // the lawn is reachable from the bridge entry (a dog's-eye flood)
    const rs = dogReach({ world: 'pk', x: 2, y: 6 });
    out.lawnReach = !!rs[4 * w.W + 17] && !!rs[3 * w.W + 17]; // beside the doghouse
    out.waterBlocked = !rs[1 * w.W + 3]; // river tiles are not walkable
    // the star dog lives on the street — found by his role, because his name is whatever this device picked (#264)
    const star = CRIT.find(c => c.role === 'star');
    out.star = !!star && star.world === 'st';
    if (!star) return out;
    const SN = star.name;
    // leash him: stand adjacent, press the button, ride the 900ms transition
    world = 'st'; px = fx = 21; py = fy = 11; setWorldTag();
    star.x = 22; star.y = 11; star.fx = 22; star.fy = 11; star.moving = false; star.task = null;
    petCrit = star; petTarget = 'beagle';
    document.getElementById('leash').click();
    await sleep(1200);
    out.inPark = world === 'pk' && star.world === 'pk' && star.follow === true;
    // a treat in the park counts toward the recap
    petCrit = star; petTarget = 'beagle';
    document.getElementById('treat').click();
    out.treatCounted = PARK.t === 1;
    // bandana cycles and persists
    petCrit = star; petTarget = 'beagle';
    document.getElementById('band').click();
    out.band = !!star.band;
    out.bandStored = !!(JSON.parse(localStorage.getItem('mqpark') || '{}').band || {})[SN];
    // adopt a dog by name
    document.getElementById('adoptTitle').textContent = '';
    document.getElementById('adoptName').value = 'Nube';
    document.getElementById('adoptGo').click();
    out.adopted = CRIT.some(c => c.kind === 'beagle' && c.name === 'Nube' && c.world === 'pk');
    out.adoptStored = (JSON.parse(localStorage.getItem('mqpark') || '{}').dogs || []).length === 1;
    // breeds: adopt a chocolate lab, and a duplicate name is refused
    adoptB = 'lab'; adoptC = '#6E4B2F';
    document.getElementById('adoptName').value = 'Oso';
    document.getElementById('adoptGo').click();
    out.labAdopted = CRIT.some(c => c.kind === 'lab' && c.name === 'Oso' && c.c === '#6E4B2F');
    const nDogs = CRIT.filter(c => DOGK.has(c.kind)).length;
    document.getElementById('adoptName').value = SN;
    document.getElementById('adoptGo').click();
    out.dupBlocked = CRIT.filter(c => DOGK.has(c.kind)).length === nDogs;
    // the star is a single instance: a neighbour made in his name must not double him
    spawnCustom({ n: SN, w: 'st', x: 9, y: 11 });
    out.oneStar = CRIT.filter(c => DOGK.has(c.kind) && c.name === SN).length === 1;
    // no adoption limit: dogs 3-6 all land (the old cap was 4)
    for (const nm of ['Kiko', 'Luna', 'Rex', 'Toby']) {
      adoptB = 'chi'; adoptC = '#C9975C';
      document.getElementById('adoptName').value = nm;
      document.getElementById('adoptGo').click();
    }
    out.noLimit = CRIT.filter(c => DOGK.has(c.kind) && dogRecord(c)).length === 6;
    // every adopted dog has one particular friend in the city
    out.friends = parkPrefs.dogs.every(d => d.friend && d.friend.w && d.friend.key);
    // rename: works for an adopted dog, migrates its records, refuses the star's name in any case
    const nube = CRIT.find(c => c.name === 'Nube');
    parkPrefs.band.Nube = '#C0392B'; parkPrefs.train.Nube = { sit: 2 };
    renTarget = nube; document.getElementById('renName').value = 'Nieve';
    document.getElementById('renGo').click();
    out.renamed = nube.name === 'Nieve' && dogRecord(nube).n === 'Nieve'
      && parkPrefs.band.Nieve === '#C0392B' && parkPrefs.train.Nieve.sit === 2;
    renTarget = nube; document.getElementById('renName').value = SN.toLowerCase();
    document.getElementById('renGo').click();
    out.renDupBlocked = nube.name === 'Nieve';
    // rehome: the dog moves in with its friend, record kept — never deleted
    const oso = CRIT.find(c => c.name === 'Oso');
    px = fx = 10; py = fy = 10; // an empty corner: Oso alone is nearest
    oso.x = 9; oso.y = 10; oso.fx = 9; oso.fy = 10; oso.task = null;
    petCrit = oso; petTarget = 'lab';
    document.getElementById('cmd').click();
    out.rehBtn = !document.getElementById('cmdReh').hidden;
    document.getElementById('cmdReh').click();
    const orec = parkPrefs.dogs.find(d => d.n === 'Oso');
    out.rehomed = !!orec && orec.rehomed === true && oso.world === orec.friend.w
      && CRIT.includes(oso);
    // the star dog can be renamed like any adopted dog (#264) — and never rehomed: he lives on the street
    px = fx = 8; py = fy = 6;
    star.x = 9; star.y = 6; star.fx = 9; star.fy = 6; star.world = 'pk'; star.task = null;
    document.getElementById('cmd').click();
    out.starRenameOnly = (!document.getElementById('cmdRen').hidden && document.getElementById('cmdReh').hidden) ||
      'the paw menu beside the star dog offers ' + (document.getElementById('cmdRen').hidden ? 'no rename' : 'a rename') +
      ' and ' + (document.getElementById('cmdReh').hidden ? 'no rehome' : 'a rehome') + ' — he is renamed like any adopted dog, and never rehomed';
    document.getElementById('dogPX').click();
    // training: with luck pinned, Sit lands and Come recalls from across the lawn
    const MR = Math.random; Math.random = () => 0.01;
    star.task = null; star.layT = 0; star.stayT = 0;
    px = fx = 8; py = fy = 6;
    dogCmd('sit');
    out.sitOk = star.sit === true;
    dogCmd('stay');
    out.stayOk = star.stayT > performance.now();
    star.stayT = 0; star.x = 17; star.y = 2; star.fx = 17; star.fy = 2; star.moving = false; star.next = 0;
    dogCmd('come');
    Math.random = MR;
    const runner = CRIT.find(c => c.task && c.task.type === 'come') || star;
    const t1 = Date.now();
    while (Date.now() - t1 < 6000) {
      await sleep(150);
      if (!runner.task && Math.abs(runner.x - px) + Math.abs(runner.y - py) <= 1) break;
    }
    out.comeOk = Math.abs(runner.x - px) + Math.abs(runner.y - py) <= 1;
    // the agility course exists, is reachable, and is the course the dog is actually SENT on.
    // Meridian's has been hurdle, tunnel, weave at (9,8) (11,8) (13,8) since it was built. From
    // 2026-09-29 the engine reads it off this map instead of carrying those three coordinates
    // itself, so this pins that nothing about Meridian's dog moved when that happened — asked
    // through the whim, with the roll pinned to the one that means "run the course" and the star put
    // straight back, synchronously, so the steps below find him exactly where they left him.
    {
      const keep = { world: star.world, x: star.x, y: star.y, fx: star.fx, fy: star.fy,
        task: star.task, sit: star.sit, layT: star.layT, next: star.next };
      const MR2 = Math.random; Math.random = () => 0.8;
      star.world = 'pk'; star.task = null;
      let wp = [];
      try { dogWhim(star, performance.now()); wp = star.task && star.task.type === 'run' ? star.task.wp : []; }
      finally { Math.random = MR2; Object.assign(star, keep); }
      const sent = wp.map(([x, y]) => ({ '3': 'hurdle', '4': 'tunnel', '5': 'weave' }[WORLDS.pk.rows[y][x]] || 'bare ground') + ' (' + x + ',' + y + ')').join(', ');
      const reach = dogReach({ world: 'pk', x: 2, y: 6 });
      out.agility = (WORLDS.pk.rows[8].includes('3.4.5') && sent === 'hurdle (9,8), tunnel (11,8), weave (13,8)' &&
        wp.every(([ax, ay]) => !!reach[ay * WORLDS.pk.W + ax])) ||
        "Meridian's dog no longer runs its course as it always has, hurdle (9,8), tunnel (11,8), weave (13,8): it was sent on " + (sent || 'no course at all');
    }
    // and a restaurant to sing at. La Cocina's door opens onto Calle Principal at (6,5), and it
    // is Rosa who brings the water (owner, 2026-09-29: "awooing infront of a restaurant and a worker brings
    // them a water bowl"). Without this, taking the restaurant out of PLACES would leave the engine's own
    // check asking a pack that serves nothing, and passing. Asked through the whim, for a dog made here
    // in the star dog's own corner of the street, so nobody real moves.
    {
      const MR3 = Math.random; Math.random = () => 0.80;
      const d = { kind: 'beagle', name: 'Probe', world: 'st', x: 22, y: 11, fx: 22, fy: 11, face: 1, sit: false, layT: 0, next: 0, home: [22, 11], task: null };
      try { dogWhim(d, performance.now()); } finally { Math.random = MR3; }
      const t = d.task;
      /* the step is whichever side of La Cocina's door (6,5) he comes from: from his corner, the south one */
      const worker = t && t.eat && typeof eateryWorker === 'function' ? eateryWorker(t.eat) : null;
      out.cocina = (!!t && t.type === 'door' && !!t.step && t.step[0] === 6 && t.step[1] === 6 && !!t.eat && t.eat.world === 'lc' && !!worker && worker.npc === 'rosa') ||
        "Meridian's dog has no restaurant to sing at on Calle Principal: from his corner the roll for a restaurant door " +
        (t ? 'sent him to ' + t.type + (t.step ? ' at (' + t.step + ')' : '') : 'did nothing') + " — it should send him to La Cocina's south step at (6,6), where Rosa brings the water";
    }
    // swipe works on the 3D canvas too
    held = null; ctl = 'swipe';
    document.getElementById('world').hidden = false; // the trolley-pass section left the intro up
    const c3 = document.getElementById('cv3');
    c3.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7, clientX: 100, clientY: 100 }));
    c3.dispatchEvent(new PointerEvent('pointermove', { pointerId: 7, clientX: 170, clientY: 104 }));
    out.swipe3d = held === 'right';
    c3.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, clientX: 170, clientY: 104 }));
    held = null;
    // walk out over the bridge: land on the exit tile and let the portal fire
    px = fx = 1; py = fy = 6; moving = true; mt = 1; dir = 'left'; px = 0; portalT = 0;
    await sleep(300);
    out.exited = world === 'st';
    out.card = !document.getElementById('parkCard').hidden;
    out.starHome = star.world === 'st' && star.follow === false;
    document.getElementById('pkClose').click();
    // strings in both languages
    out.langOk = !!(['leashLb', 'parkArrive', 'parkTitle', 'parkSum', 'parkLove', 'parkTeaser',
      'adoptLb', 'adoptAsk', 'adoptDone', 'bandLb', 'parkFull', 'loveLb', 'loveLines']
      .every(k => UI.en[k] && UI.es[k]) && UI.en.locs.pk && UI.es.locs.pk && UI.en.arrive.pk && UI.es.arrive.pk);
    // cleanup so this section leaves no park residue for reruns
    localStorage.removeItem('mqpark');
    return out;
  });
  ['pkOk', 'lawnReach', 'waterBlocked', 'star', 'inPark', 'treatCounted', 'band', 'bandStored',
    'adopted', 'adoptStored', 'labAdopted', 'dupBlocked', 'oneStar', 'sitOk', 'stayOk', 'comeOk',
    'noLimit', 'friends', 'renamed', 'renDupBlocked', 'rehBtn', 'rehomed', 'starRenameOnly',
    'agility', 'cocina', 'swipe3d', 'exited', 'card', 'starHome', 'langOk'].forEach(k => {
    if (park[k] !== true) fails.push('park: ' + k + ' failed (' + JSON.stringify(park[k]) + ')');
  });

  // ---- #264 · the star dog: found by his ROLE, named from the pack's POOL, renamable, and nobody's ----
  // In plain words: every new player meets the star dog under a name the game picks from a pool and
  // keeps; the player may rename him (one or two dogs take a while to come round to a new name — a
  // joke, on purpose); the engine finds him by what he is, never by what he is called; and nothing
  // in this repository says whose dog he is. Each sentence below is what somebody would notice if one
  // of those stopped being true. Names are read off the page that ships, never typed here, except the
  // few this suite gives dogs of its own.
  {
    const P = [];
    const ROOT = path.resolve(__dirname, '..');
    const { execFileSync } = require('child_process');
    const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const word = n => new RegExp('(?:^|[^\\p{L}\\p{N}_$])' + esc(n) + '(?:$|[^\\p{L}\\p{N}_$])', 'iu');
    const decl = await page.evaluate(() => {
      const C = typeof CRITTERS !== 'undefined' ? CRITTERS : [];
      const dogKinds = typeof DOGK !== 'undefined' ? [...DOGK] : [];
      return {
        pool: typeof DOGNAMES !== 'undefined' && Array.isArray(DOGNAMES) ? DOGNAMES.slice() : null,
        stars: C.filter(c => c.role === 'star').map(c => ({ kind: c.kind, name: c.name })),
        named: C.filter(c => c.name).map(c => c.name),
        dogNames: C.filter(c => c.name && dogKinds.includes(c.kind)).map(c => c.name),
        dogKinds,
        triggers: Object.entries(typeof EGGS !== 'undefined' ? EGGS : {}).flatMap(([k, e]) => (e.triggers || []).map(t => [k, t])),
        cast: [...new Set(['en', 'es'].flatMap(l => Object.values((typeof NPCN !== 'undefined' && NPCN[l]) || {}).map(n => String(n).split(' ·')[0].trim())))],
        words: ['renameStub', 'dogStubborn', 'dogCameRound', 'parkTeaser'].map(k => [k, typeof UI.en[k], typeof UI.es[k],
          Array.isArray(UI.en[k]) ? UI.en[k].length : -1, Array.isArray(UI.es[k]) ? UI.es[k].length : -1])
      };
    });
    const star = decl.stars[0] || null;
    const pool = decl.pool || [];
    /* this suite's own page is a brand-new device, so its star was named by a random seed: every run is
       a sample, and a red that depends on the name reproduces with the name printed here */
    console.log('  NOTE: this run\'s star dog is "' + (await page.evaluate(() => (CRIT.find(c => c.role === 'star') || {}).name)) + '" (a brand-new device, a random seed)');
    if (decl.stars.length !== 1) P.push('the pack marks ' + decl.stars.length + ' dogs as its star (role:"star" in CRITTERS) — exactly one, or the engine has nothing but a name to find him by');
    else if (!decl.dogKinds.includes(star.kind)) P.push('the pack\'s star is a "' + star.kind + '", which does not run the dog program');
    // the names this suite gives dogs of its own: a pool name among them would fail a check here one run in N, for no fault of the game
    const SUITE_DOGS = ['Nube', 'Oso', 'Kiko', 'Luna', 'Rex', 'Toby', 'Nieve', 'Bizcocho', 'Garabato'];
    if (!decl.pool) P.push('the pack declares no pool of dog names (DOGNAMES), so every new player meets the star dog under the same name');
    else {
      if (pool.length < 8) P.push('the pool of dog names holds ' + pool.length + ' — a pool is a real choice, eight names at least');
      if (star && !pool.includes(star.name)) P.push('the name the map gives the star ("' + star.name + '") is missing from the pool — it is one possibility among the others');
      const low = pool.map(n => String(n).toLowerCase());
      low.forEach((n, i) => { if (low.indexOf(n) !== i) P.push('the pool names "' + pool[i] + '" twice'); });
      pool.forEach(n => {
        if (typeof n !== 'string' || !n.trim() || n !== n.trim() || n.length > 24 || /[\u0000-\u001f<>]/.test(n)) { P.push('the pool\'s ' + JSON.stringify(n) + ' is not a name the rename box would keep as it is'); return; }
        const l = n.toLowerCase();
        decl.triggers.forEach(([k, t]) => { if (l.includes(t)) P.push('the pool\'s "' + n + '" wakes the "' + k + '" easter egg (it contains "' + t + '") — the star dog would answer to a legend that is not his'); });
        decl.cast.forEach(c => { if (c.toLowerCase() === l || c.toLowerCase().split(/\s+/).includes(l)) P.push('the pool\'s "' + n + '" is already somebody in this city ("' + c + '")'); });
        decl.named.forEach(c => { if (c !== (star && star.name) && c.toLowerCase() === l) P.push('the pool\'s "' + n + '" is already an animal in this city'); });
        if (SUITE_DOGS.some(s => s.toLowerCase() === l)) P.push('the pool\'s "' + n + '" is a name this suite gives a dog of its own, so one run in ' + pool.length + ' would fail on a duplicate that is not a bug');
      });
    }
    decl.words.forEach(([k, en, es, nen, nes]) => {
      if (en === 'undefined' || es === 'undefined') P.push('the words "' + k + '" are missing in ' + (en === 'undefined' ? 'English' : 'Spanish'));
      else if (en !== es || nen !== nes) P.push('the words "' + k + '" are not the same shape in English and Spanish (' + en + '/' + nen + ' against ' + es + '/' + nes + ')');
    });
    if (decl.words.some(w => w[0] === 'parkTeaser' && w[1] !== 'function')) P.push('the park card\'s last line is fixed text, so it cannot say the name the player\'s dog actually has');

    // the engine finds an animal by what it IS, never by the name a pack gave it (docs/TAGS.md L17).
    // Read off the pack at runtime: every animal the map names, and every name the pool could give.
    {
      const NAMES = [...new Set([...decl.named, ...pool])];
      if (!NAMES.length) P.push('no animal in this pack has a name, so the name scan has nothing to read — that is not a pass');
      for (const base of engineFiles(fails)) {
        const src = fs.readFileSync(path.join(ENGINE_DIR, base), 'utf8');
        const bare = src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).replace(/\/\/[^\n]*/g, '');
        bare.split('\n').forEach((code, i) => NAMES.forEach(n => {
          if (word(n).test(code)) P.push('engine/' + base + ':' + (i + 1) + ' names "' + n + '" in code — the engine finds an animal by its role, never by the name a pack gave it');
        }));
      }
    }

    // nothing in this repository says whose dog he is. Two shapes: a possessive in front of a dog word,
    // and a dog's name within two lines of the word "owner" (a quote runs onto the next line). Every
    // tracked file, because a note is published the moment it is pushed, wherever it sits.
    const DOGW = '(?:dogs?|pups?|pupp(?:y|ies)|beagles?|pooch|doggo|perr[oa]s?|perrit[oa]s?|cachorr[oa]s?)';
    const TIE_POSS = new RegExp('\\b(?:his|my|our|mine)\\s+(?:own\\s+|real\\s+|actual\\s+|real-life\\s+|family\\s+)?' + DOGW + '\\b', 'i');
    const TIE_OWNERS = new RegExp('\\bowner[\'\u2019]s\\s+(?:[\\w-]+\\s+){0,2}' + DOGW + '\\b', 'i');
    const TIE_ES = /\b(?:mis?|nuestr[oa]s?)\s+(?:perr[oa]s?|perrit[oa]s?|cachorr[oa]s?)\b|\bperr[oa]s?\s+del\s+due[ñn]o\b/i;
    const OWNERW = /\bowners?\b|\bdue[ñn][oa]s?\b/i;
    const ties = (text, names) => {
      const res = names.map(n => [n, word(n)]), lines = text.split('\n'), hits = [];
      lines.forEach((l, i) => {
        if (TIE_POSS.test(l) || TIE_OWNERS.test(l) || TIE_ES.test(l)) hits.push([i + 1, 'says the game\'s dog belongs to somebody']);
        const near = lines.slice(Math.max(0, i - 2), i + 1).some(x => OWNERW.test(x));
        const nm = near && res.find(([, re]) => re.test(l));
        if (nm) hits.push([i + 1, 'puts a dog\'s name ("' + nm[0] + '") beside the word owner']);
      });
      return hits;
    };
    // its own red cases, run every time — the phrases are assembled here so this file never says them
    {
      const nm = pool[0] || (star && star.name) || 'Fido', O = 'own' + 'er';
      [['the ' + O + '\'s dog, by name', true], ['the ' + O + '\u2019s recurring dog', true], ['a note about ' + 'his' + ' dog', true],
       [O + ', 2026-09-04: "' + nm.toLowerCase() + ' should follow me anywhere"', true],
       [O + ', 2026-09-04: "the cone"\nand then\n' + nm + ' should be able to rip it', true],
       ['mi ' + 'perro', true],
       ['your dog sits', false], ['the ' + O + ' of the bakery opens at six', false], [nm + ' fetches the ball', false]]
        .forEach(([t, bad]) => { if ((ties(t, [nm]).length > 0) !== bad)
          P.push('the whose-dog check ' + (bad ? 'let through' : 'flagged') + ' "' + t.replace(/\n/g, ' / ') + '" — it cannot be trusted with the repository'); });
    }
    {
      let files = null;
      try { files = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean); }
      catch (e) { P.push('git could not list the tracked files, so no line was read for who the dog belongs to — that is a red, not a pass'); }
      if (files) {
        const names = [...new Set([...decl.dogNames, ...pool])];
        let read = 0;
        files.forEach(f => {
          let t; try { t = fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { return; }
          if (t.includes('\0')) return;
          read++;
          ties(t, names).forEach(([ln, why]) => P.push(f + ':' + ln + ' ' + why + ' — the public copy never says whose dog he is ("the star dog" says what he is)'));
        });
        if (read < 50) P.push('the whose-dog check read ' + read + ' tracked text files — it is pointed at the wrong place');
      }
    }

    // ---- the pick, the rename and the joke, each on a device of its own ----
    // The seed is ONE 32-bit value from crypto.getRandomValues, pinned here; a sessionStorage value
    // overrides it for a reload, so "the next visit" can roll a different seed and must not use it.
    const pinSeed = k => { const real = crypto.getRandomValues.bind(crypto);
      crypto.getRandomValues = a => { if (a instanceof Uint32Array && a.length === 1) {
        const s = sessionStorage.getItem('mq264seed'); a[0] = s !== null ? +s : k; return a; } return real(a); }; };
    const device = async (seed, before, route) => {
      const ctx = await browser.newContext();
      if (before) await ctx.addInitScript(before);
      await ctx.addInitScript(pinSeed, seed);
      const p = await ctx.newPage({ viewport: { width: 480, height: 900 } });
      const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.route('**', r => r.request().url().startsWith('file://') ? r.continue() : r.abort());
      if (route) await route(p);
      await p.goto(index); await p.waitForTimeout(1200);
      return { ctx, p, errs };
    };
    if (star && decl.pool && pool.length > 2) {
      const n = pool.length;
      let i1 = [...pool.keys()].find(i => i >= 3 && pool[i] !== star.name); if (i1 === undefined) i1 = pool.findIndex(x => x !== star.name);
      const K1 = 4099 * n + i1, i2 = (i1 + 1) % n, K2 = 31 * n + i2;
      const readStar = () => { const s = CRIT.find(c => c.role === 'star'); let rec = null;
        try { rec = JSON.parse(localStorage.getItem('mqpark') || 'null'); } catch (e) {}
        return { name: s ? s.name : null, kept: rec && rec.star ? rec.star.n : null }; };

      // A · a brand-new player: the seed names him, the name is kept, and the next visit keeps it
      const A = await device(K1);
      const a1 = await A.p.evaluate(readStar);
      if (a1.name !== pool[i1]) P.push('a brand-new player met the star dog as "' + a1.name + '"; with the seed pinned to ' + K1 + ' the pool\'s rule (the seed, modulo the pool\'s size) names him "' + pool[i1] + '"');
      if (a1.kept !== a1.name) P.push('the name picked for a brand-new player was not kept on the device (' + JSON.stringify(a1.kept) + ') — the next visit would meet a different dog');
      await A.p.evaluate(k => sessionStorage.setItem('mq264seed', String(k)), K2);
      await A.p.reload(); await A.p.waitForTimeout(1200);
      const a2 = await A.p.evaluate(readStar);
      if (a2.name !== a1.name) P.push('coming back the next day, the star dog was "' + a2.name + '" instead of "' + a1.name + '" — a name is picked once and kept');

      // the rename, through the paw menu; then the stubborn part, through the same buttons
      const ra = await A.p.evaluate(async () => {
        const sleep = ms => new Promise(r => setTimeout(r, ms)), $ = id => document.getElementById(id), P = [];
        /* what each press SAYS, recorded as it is said: the activity record is no witness, because a toast
           that has to queue is written into it twice — once when called, again when finally shown */
        const said = [], toast0 = window.toast;
        window.toast = function (m) { said.push(String(m)); return toast0.apply(this, arguments); };
        const during = fn => { const i0 = said.length; fn(); return said.slice(i0).join(' | '); };
        try {
        document.querySelector('.classes button[data-c="architect"]').click(); $('begin').click();
        await sleep(300);
        const s = CRIT.find(c => c.role === 'star'); if (!s) return ['there is no star dog to rename'];
        const was = s.name, NEW = 'Bizcocho';
        const beside = () => { world = 'st'; s.world = 'st'; s.x = s.fx = 22; s.y = s.fy = 11; s.moving = false; s.task = null;
          px = fx = 21; py = fy = 11; moving = false; setWorldTag(); };
        beside(); $('cmd').click();
        if ($('dogP').hidden) return ['the paw menu did not open beside the star dog'];
        if ($('cmdRen').hidden) P.push('the paw menu beside the star dog offers no rename');
        if (!$('cmdReh').hidden) P.push('the paw menu beside the star dog offers to rehome him — he lives on the street');
        $('cmdReh').click(); if (s.world !== 'st') P.push('pressing rehome moved the star dog to ' + s.world);
        $('cmdRen').click();
        if ($('renP').hidden) return P.concat(['pressing rename beside the star dog opened nothing']);
        if ($('renName').value !== was) P.push('the rename box opened with "' + $('renName').value + '", not the name he has ("' + was + '")');
        $('renName').value = NEW;
        const renSaid = during(() => $('renGo').click());
        let rec = null; try { rec = JSON.parse(localStorage.getItem('mqpark') || 'null'); } catch (e) {}
        if (s.name !== NEW) return P.concat(['renamed "' + NEW + '", the star dog is still "' + s.name + '"']);
        if (!rec || !rec.star || rec.star.n !== NEW) P.push('the new name was not kept on the device (' + JSON.stringify(rec && rec.star) + ')');
        if (!renSaid.includes(was) || !renSaid.includes(NEW)) P.push('the first time the star dog is renamed he is the stubborn one, and the rename said "' + renSaid + '" — no word of the name he is used to');
        // he keeps answering to the old name for the next two calls, then comes round
        const MR = Math.random; Math.random = () => 0.01; /* every command would land: only the joke can stop one */
        const call = () => { beside(); s.stayT = 0; $('cmd').click(); const got = during(() => $('cmdStay').click()); return { ok: s.stayT > performance.now(), said: got }; };
        const c1 = call(), c2 = call(), c3 = call();
        const r0 = said.length; await sleep(2600);
        const later = said.slice(r0), round = later.find(m => m.includes(NEW) && !m.includes(was)) || later.join(' | ');
        const c4 = call();
        Math.random = MR;
        [c1, c2].forEach((c, i) => {
          if (c.ok) P.push('call ' + (i + 1) + ' after the rename: a stubborn dog answered to "' + NEW + '" at once');
          else if (!c.said.includes(was)) P.push('call ' + (i + 1) + ' after the rename was ignored and the line ("' + c.said + '") never says the name he still answers to, "' + was + '"'); });
        if (!c3.ok) P.push('the third call after the rename was ignored too — he must come round');
        if (!round.includes(NEW) || round.includes(was)) P.push('coming round, the line was "' + round + '" — it should use his new name and let the old one go');
        if (!c4.ok || c4.said.includes(was)) P.push('once he came round, a call still met the old name ("' + c4.said + '")');
        // the words that name him name him NOW: the park card, and every treat line his legend has
        parkExit(); const tz = $('pkTeaser').textContent; $('pkClose').click();
        if (!tz.includes(NEW) || tz.includes(was)) P.push('the park card\'s last line says "' + tz + '" about a dog now called "' + NEW + '"');
        const eg = s.egg && EGGS[s.egg];
        if (!eg) P.push('the star dog carries no easter egg, so no treat line can name him');
        else {
          const L = eg.lines[lang].length, got = [];
          for (let i = 0; i < L; i++) {
            const seq = [0.1, (i + 0.5) / L]; let k = 0; const MR3 = Math.random; Math.random = () => seq[Math.min(k++, 1)];
            beside(); petCrit = s; petTarget = s.kind;
            try { got.push(during(() => $('treat').click())); } finally { Math.random = MR3; }
          }
          if (!got.some(l => l.includes(NEW))) P.push('no treat line names the dog being fed, so a stale name could not be told from a missing one');
          got.filter(l => l.includes(was)).forEach(l => P.push('a treat line still calls him "' + was + '": "' + l + '"'));
        }
        // the legend follows the name he has now: name a neighbour after him and the barrio knows him
        const kNew = eggFor(NEW), kOld = eggFor(was);
        if (!kNew || !EGGS[kNew] || !EGGS[kNew].dog) P.push('a neighbour named "' + NEW + '", the star dog\'s name now, wakes no dog legend (' + kNew + ')');
        if (kOld && kOld === kNew) P.push('the barrio still hails "' + was + '" as the star dog after he was renamed');
        spawnCustom({ n: NEW, w: 'st', x: 9, y: 11 });
        const twins = CRIT.filter(c => DOGK.has(c.kind) && c.name === NEW).length;
        if (twins !== 1) P.push('a neighbour named after the star dog made ' + twins + ' dogs called "' + NEW + '" — there is one of him');
        // the paw menu finds him by his ROLE: first in the list or last, called anything
        const decoy = { kind: 'beagle', name: 'Garabato', world: PL.park, x: 3, y: 3, fx: 3, fy: 3, face: 1, sit: false, home: [3, 3], task: null, next: 0 };
        CRIT.unshift(decoy); world = PL.home; px = fx = PL.spawn[0]; py = fy = PL.spawn[1]; s.world = 'st';
        const found = nearestDog(); CRIT.splice(CRIT.indexOf(decoy), 1);
        if (found !== s) P.push('from a room with no dog in it the paw menu reached ' + (found ? '"' + found.name + '"' : 'nobody') + ', not the star dog — it finds him by his role, whatever he is called and wherever he stands in the list');
        return P;
        } finally { window.toast = toast0; }
      });
      P.push(...ra);
      await A.p.reload(); await A.p.waitForTimeout(1200);
      const a3 = await A.p.evaluate(readStar);
      if (a3.name !== 'Bizcocho') P.push('after a reload the renamed star dog was "' + a3.name + '" again — a rename is kept');
      if (A.errs.length) P.push('the brand-new device threw: ' + A.errs.join(' | '));
      await A.ctx.close();

      // B and C · one or two dogs are stubborn, never more, and WHICH ones is not a roll of the dice
      const cap = async (mr, es) => {
        const D = await device(K1);
        const r = await D.p.evaluate(([mr, es]) => {
          const $ = id => document.getElementById(id), said = [], toast0 = window.toast;
          window.toast = function (m) { said.push(String(m)); return toast0.apply(this, arguments); };
          if (es) $('optEs').click();
          const MR = Math.random; Math.random = () => mr;
          const stub = [], ren = (c, nm) => { const was = c.name, i0 = said.length; renTarget = c; $('renName').value = nm; $('renGo').click();
            if (c.name === nm && said.slice(i0).some(m => m.includes(was))) stub.push(was); };
          try {
            const s = CRIT.find(c => c.role === 'star');
            if (s) ren(s, 'Bizcocho');
            /* a new name never contains the old one, or "the line says the old name" would read every rename as stubborn */
            const names = ['Garabato', 'Tlacuache', 'Nopal', 'Elote', 'Cacahuate', 'Pinole', 'Tejocote', 'Zapote', 'Mamey', 'Guayabo', 'Jicama', 'Camote'];
            const next = ['Chamoy', 'Tepache', 'Pozole', 'Atole', 'Jamoncillo', 'Glorias', 'Cocada', 'Merengue', 'Obleas', 'Borrachito', 'Palanqueta', 'Mazapan'];
            names.forEach(nm => { $('adoptName').value = nm; $('adoptGo').click(); });
            names.forEach((nm, i) => { const c = CRIT.find(x => x.name === nm); if (c) ren(c, next[i]); });
            return { stub, renamed: next.filter(nm => CRIT.some(x => x.name === nm)).length };
          } finally { Math.random = MR; window.toast = toast0; }
        }, [mr, es]);
        await D.ctx.close();
        return r;
      };
      const B = await cap(0.05, true), C = await cap(0.95, false);
      if (B.renamed !== 12 || C.renamed !== 12) P.push('only ' + B.renamed + ' and ' + C.renamed + ' of 12 adopted dogs took a new name, so the count of stubborn ones reads a short list');
      [['in Spanish, the dice low', B], ['in English, the dice high', C]].forEach(([how, r]) => {
        if (r.stub.length < 1 || r.stub.length > 2) P.push(how + ', ' + r.stub.length + ' of 13 renamed dogs were stubborn (' + r.stub.join(', ') + ') — one or two, never more');
      });
      if (B.stub.join('|') !== C.stub.join('|')) P.push('which dogs are stubborn changed with the dice (' + B.stub.join(', ') + ' against ' + C.stub.join(', ') + ') — it is chosen once, not rolled');

      // R · a device that played before the pool existed keeps the name it has always seen
      const R = await device(K1, () => { if (!localStorage.getItem('mqpark')) localStorage.setItem('mqpark', '{"band":{},"dogs":[],"train":{}}'); });
      const r1 = await R.p.evaluate(readStar);
      if (r1.name !== star.name) P.push('a returning player (a park record, no name picked yet) met the star dog as "' + r1.name + '" — he keeps the name that player has always seen, "' + star.name + '"');
      if (r1.kept !== star.name) P.push('the returning player\'s name for the star dog was not recorded (' + JSON.stringify(r1.kept) + '), so a later visit could still roll one');
      await R.ctx.close();

      // N · a game that declares no pool and no star: everything is as it was before either existed
      const mapsSrc = fs.readFileSync(path.join(ROOT, 'content', 'meridian', 'maps.js'), 'utf8');
      const cut = [[/const DOGNAMES=\[[^\]]*\];/, 'the pool'], [/,role:"star"/, 'the role']];
      const missed = cut.filter(([re]) => !re.test(mapsSrc)).map(([, what]) => what);
      if (missed.length) P.push('a game with no pool and no star cannot be built from maps.js (' + missed.join(' and ') + ' matched nothing) — this check would be reading the real game under another name');
      else {
        const bare = cut.reduce((s, [re]) => s.replace(re, ''), mapsSrc);
        const N = await device(K1, null, p => p.route(/content\/meridian\/maps\.js$/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: bare })));
        const n1 = await N.p.evaluate(() => {
          const $ = id => document.getElementById(id), d = CRIT.find(c => DOGK.has(c.kind));
          let rec = null; try { rec = JSON.parse(localStorage.getItem('mqpark') || 'null'); } catch (e) {}
          const o = { pool: typeof DOGNAMES, role: CRITTERS.some(c => c.role), name: d && d.name,
            mapName: (CRITTERS.find(c => DOGK.has(c.kind)) || {}).name, kept: !!(rec && 'star' in rec) };
          document.querySelector('.classes button[data-c="architect"]').click(); $('begin').click();
          world = 'st'; d.world = 'st'; d.x = d.fx = 22; d.y = d.fy = 11; d.moving = false; d.task = null; px = fx = 21; py = fy = 11; setWorldTag();
          $('cmd').click(); o.ren = !$('cmdRen').hidden; o.reh = !$('cmdReh').hidden; $('dogPX').click();
          world = PL.home; o.reached = nearestDog() === d;
          return o;
        });
        if (n1.pool !== 'undefined' || n1.role) P.push('the no-pool game still declares ' + (n1.role ? 'a star' : 'a pool') + ' — this check is reading the real game');
        else {
          if (n1.name !== n1.mapName) P.push('with no pool declared the dog was named "' + n1.name + '" — a game that declares no pool keeps the name in its own map ("' + n1.mapName + '")');
          if (n1.kept) P.push('with no pool declared the engine still wrote a picked name into the park record');
          if (n1.ren || n1.reh) P.push('with no star declared the paw menu offers ' + (n1.ren ? 'a rename' : 'a rehome') + ' for the map\'s dog — before #264 it offered neither');
          if (!n1.reached) P.push('with no star declared the paw menu no longer reaches the map\'s dog from another room');
        }
        if (N.errs.length) P.push('the no-pool game threw: ' + N.errs.join(' | '));
        await N.ctx.close();
      }
    }
    fails.push(...P.map(m => 'star dog (#264): ' + m));
  }

  // ---- swiping "up" must walk up the SCREEN at every camera rotation ----
  // The bug this locks out: engine.js referenced T3 zero times, so movement was pure
  // world-space and ignored the 3D camera's yaw. Un-rotated it was an exact identity
  // (which is why it felt fine), and every turn of the ↻ button desynced it.
  const rot = await page.evaluate(() => {
    const problems = [];
    const before = { cam: camMode, yaw: (typeof T3 !== 'undefined' && T3) ? T3.yaw : 0, px, py, world };
    camSet('3d');
    // an open patch to walk on, so a wall never masks a wrong direction
    world = 'st'; px = fx = 6; py = fy = 12; moving = false; held = null;
    // screen-up, screen-right etc. must map to these world deltas per quarter-turn
    const EXPECT = [
      { yaw: 0,            up: [0,-1], right: [1,0]  },
      { yaw: Math.PI / 2,  up: [-1,0], right: [0,-1] },
      { yaw: Math.PI,      up: [0,1],  right: [-1,0] },
      { yaw: 3*Math.PI/2,  up: [1,0],  right: [0,1]  },
    ];
    EXPECT.forEach(({ yaw, up, right }) => {
      T3.yaw = yaw;
      [['up', up], ['right', right]].forEach(([intent, want]) => {
        const wd = worldDir(intent), got = DIRS[wd];
        if (got[0] !== want[0] || got[1] !== want[1])
          problems.push(`at yaw ${Math.round(yaw*180/Math.PI)}° swiping "${intent}" moves [${got}] — expected [${want}]`);
        // and the facing the renderer interpolates with must BE that world direction,
        // or the hero slides one way while walking another
        if (DIRS[wd][0] !== got[0] || DIRS[wd][1] !== got[1])
          problems.push(`at yaw ${Math.round(yaw*180/Math.PI)}° facing desyncs from the move`);
      });
      // a full turn must come back to itself
      if (worldDir(worldDir(worldDir(worldDir('up')))) !== 'up')
        problems.push(`four quarter-turns from yaw ${yaw} did not return to "up"`);
    });
    // The ↻ button must step in QUARTER turns — a 4-way movement grid cannot be driven from 45°.
    // The turn is EASED now (a Settings choice, 300ms by default), so the quarter is checked at
    // its destination rather than one frame after the press; "instant" is the old behaviour.
    T3.yaw = 0; T3.turn = null;
    const btn = document.getElementById('rot3d');
    if (!btn) problems.push('the 3D rotate button is missing');
    else { btn.click();
      const landed = T3.turn ? T3.turn.to : T3.yaw;
      if (Math.abs(landed - Math.PI/2) > 1e-9)
        problems.push(`↻ stepped ${(landed*180/Math.PI).toFixed(1)}° — must be 90°, or half the stops are unmappable`);
      T3.turn = null; T3.yaw = 0; }
    // the 2D cameras must be completely unaffected
    camSet('front'); T3.yaw = Math.PI / 2;
    if (worldDir('up') !== 'up') problems.push('camera rotation leaked into a 2D camera');
    T3.yaw = before.yaw; camSet(before.cam);
    world = before.world; px = fx = before.px; py = fy = before.py; held = null; moving = false;
    return problems;
  });
  fails.push(...rot);

  // ---- maps and doors must be structurally plausible, not just reachable ----
  // Added 2026-09-01 after the owner asked why TDD had not caught "broken doors and
  // non-realistic maps". Honest result: it would NOT have — every door in the shipped
  // maps passes these rules, so what looks wrong is RENDERING, not layout. Kept as a
  // guard so a future map edit cannot introduce the structural version of the problem.
  // (First draft of these rules produced 10 findings and all 10 were false positives:
  // a door on the map edge opens to the outside, and a portal may be stairs or the
  // trolley rather than a door. A test that cries wolf is worse than no test.)
  const maps = await page.evaluate(() => {
    const problems = [];
    const open1 = c => c === null || !SOLID.has(c);   // off-map counts as outside
    Object.entries(WORLDS).forEach(([id, w]) => {
      for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) {
        const ch = w.rows[y][x];
        if (!DOORSET.has(ch)) continue;
        const N = y > 0 ? w.rows[y-1][x] : null, S = y < w.H-1 ? w.rows[y+1][x] : null;
        const E = x < w.W-1 ? w.rows[y][x+1] : null, W = x > 0 ? w.rows[y][x-1] : null;
        const sides = [N, S, E, W];
        if (!sides.some(c => c !== null && SOLID.has(c)))
          problems.push(`${id} (${x},${y}) '${ch}': a door with no wall beside it`);
        if (!(open1(N) && open1(S)) && !(open1(E) && open1(W)))
          problems.push(`${id} (${x},${y}) '${ch}': a door you cannot walk through`);
        if (sides.every(c => c !== null && !SOLID.has(c)))
          problems.push(`${id} (${x},${y}) '${ch}': a door set into nothing (open on all four sides)`);
        sides.forEach((c, i) => { if (c !== null && DOORSET.has(c))
          problems.push(`${id} (${x},${y}) '${ch}': doors side by side with '${c}' (${'NSEW'[i]}) — reads as a hole`); });
      }
    });
    // a portal need not be a door (stairs, the trolley) but you must be able to stand on it
    Object.entries(PORTALS).forEach(([from, m]) => Object.keys(m).forEach(ch => {
      if (SOLID.has(ch)) problems.push(`PORTAL ${from}:'${ch}' is a solid tile — unreachable`);
    }));
    return problems;
  });
  fails.push(...maps);

  // ---- a door you are standing on must fire once its cooldown ends ----
  // The bug: portals were only ever checked on the frame a STEP ENDS. Walk out of HQ,
  // turn round, walk back — that step lands inside portalT's 900ms anti-ping-pong
  // window, so the tile is looked at once, rejected, and never looked at again. The
  // door ignores you until you step off it and step on again. The fix is a standing
  // check, not a shorter cooldown (a shorter cooldown moves the dead window, it does
  // not remove it). No wall-clock walking here: the first version of this test went
  // red and green on the same code depending on how fast headless Chromium ran.
  const reenter = await page.evaluate(async () => {
    const problems = [];
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const before = { cam: camMode, world, px, py };
    camSet('top');
    // 1. the ordinary case: a step that ENDS on HQ's front door goes through it
    world = 'hq'; px = fx = 10; py = fy = 16; moving = true; mt = 1; held = null; portalT = 0; portalHold = ''; /* the front door is at (10,16) since the lobby (#4) */
    await wait(250);
    if (world !== 'st' || px !== 14 || py !== 1) problems.push(`a step ending on HQ’s door left you in ${world} (${px},${py}) — expected the doorstep st (14,1)`);
    // 2. the bug: standing on the street door, arrived DURING the cooldown
    world = 'st'; px = fx = 14; py = fy = 0; moving = false; held = null; portalHold = '';
    portalT = performance.now() + 100000;
    await wait(250);
    if (world !== 'st') problems.push('the door fired inside its anti-ping-pong window');
    portalT = 0;                        // the window closes while you are still standing there
    await wait(400);
    if (world !== 'hq') problems.push('standing on a door after its cooldown ended, nothing re-checked the ground under your feet');
    // 3. the guard that makes the standing check safe: the tile a warp SET YOU DOWN on
    //    never fires until you step off it — even if a pack lands you on a portal
    world = 'hq'; px = fx = 10; py = fy = 16; moving = false; held = null; portalT = 0;
    portalHold = 'hq:10,16';
    await wait(250);
    if (world !== 'hq') problems.push('the tile a warp set you down on fired by itself — that is the ping-pong the cooldown existed to stop');
    portalHold = '';                    // …and once the hold is gone, the same tile is a door again
    await wait(250);
    if (world !== 'st') problems.push('with the hold cleared, standing on the door still did nothing');
    /* Y (the trolley stop) must stay step-only: a menu you dismissed must not reopen under your feet.
       THE TILE COMES FROM THE LINE, and it used to be typed here as (0,1). The owner moved the stop one
       tile east on 2026-09-22 ("ok move one tile east") and this check went on standing on (0,1) — a
       tile that is no longer a stop, where the menu could never have opened and the check could never
       have failed. It would have printed OK for ever. A guard that names a coordinate the content also
       names is two copies of one fact, and content is the copy that moves. */
    world = 'st'; moving = false; held = null; portalT = 0; portalHold = '';
    { const s1 = (typeof troStops === 'function') ? troStops(troLine('st'))[0] : null;
      if (!s1) problems.push('the street declares no trolley stop, so "the pass is step-only" has nowhere to stand and proves nothing');
      else { px = fx = s1.x; py = fy = s1.y; } }
    document.getElementById('travel').hidden = true;
    await wait(250);
    if (!document.getElementById('travel').hidden) problems.push('the trolley menu reopened under your feet while you stood still');
    camSet(before.cam);
    world = before.world; px = fx = before.px; py = fy = before.py;
    held = null; moving = false; portalT = 0; portalHold = ''; setWorldTag();
    return problems;
  });
  fails.push(...reenter);

  // ---- in 3D a door stands in its wall, and a wall has a face on every side ----
  // What the eyeball pass saw (IDEAS §15.3): the door plane had no rotation, so every
  // door in a north-south wall stood 90° off its wall, floating; every north-south wall
  // in HQ was a bare purple slab because only the ±Z faces of the box carried the art;
  // a paper-thin door vanished at the two edge-on camera stops; and a slot showed above
  // every door because the plane was 1 unit tall in a 1.1-unit wall.
  const doors3d = await page.evaluate(() => {
    const problems = [];
    const before = { cam: camMode, world, px, py, yaw: (typeof T3 !== 'undefined' && T3) ? T3.yaw : 0 };
    camSet('3d'); world = 'hq'; px = fx = 10; py = fy = 11; moving = false; held = null;
    if (!draw3d() || T3.fail) { problems.push('3D did not render headless — the doors could not be checked'); return problems; }
    const w = CW();
    const solid = (x, y) => (x < 0 || y < 0 || x >= w.W || y >= w.H) ? true : SOLID.has(w.grid[y][x]); // off-map is a wall
    let want = 0;
    for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) if (DOORSET.has(w.rows[y][x]) && !SOLID.has(w.grid[y][x])) want++;
    let doors = 0, lintels = 0, glows = 0;
    T3.group.children.forEach(o => {
      const u = o.userData || {};
      if (u.door) {
        doors++;
        const ns = solid(u.x, u.y - 1) && solid(u.x, u.y + 1) && !(solid(u.x - 1, u.y) && solid(u.x + 1, u.y));
        const rot = Math.abs(o.rotation.y), exp = ns ? Math.PI / 2 : 0;
        if (Math.abs(rot - exp) > 1e-6)
          problems.push(`hq door (${u.x},${u.y}) is turned ${Math.round(rot * 180 / Math.PI)}° but its wall runs ${ns ? 'north-south' : 'east-west'}`);
        if (!(o.geometry.parameters && o.geometry.parameters.depth > 0))
          problems.push(`hq door (${u.x},${u.y}) has no thickness — it vanishes edge-on`);
      }
      if (u.lintel) lintels++;
      if (u.glow) glows++;
      if (u.wall) {
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        const bare = [0, 1, 4, 5].filter(i => !ms[i] || !ms[i].map);
        if (bare.length) problems.push(`wall '${u.g}' at (${u.x},${u.y}) is a bare slab on ${bare.length} of its 4 sides`);
      }
    });
    if (doors !== want) problems.push(`hq has ${want} doors on the map and ${doors} standing in 3D`);
    // #22 (mq-v73): exactly one billboard — the hero — is drawn through walls; everyone else sits in the scene
    const through = T3.pool.filter(p => p.live && p.spr.material.depthTest === false);
    if (through.length !== 1) problems.push(`${through.length} billboards draw through walls — the hero, and only the hero, must`);
    // owner, 2026-09-07: "when we walk behind people it seems like im walking on them" — the hero was
    // drawn LAST, over everyone. Billboards draw in order of distance from the camera: whoever is
    // nearer the camera than you draws over you, whoever is farther draws under; the hero still
    // ignores depth so a wall never hides them.
    const order = () => {
      const hero = T3.pool.find(p => p.live && p.spr.material.depthTest === false); if (!hero) return ['no hero billboard'];
      const dist = p => Math.hypot(T3.cam.position.x - p.spr.position.x, T3.cam.position.z - p.spr.position.z);
      const dh = dist(hero), out = [];
      T3.pool.filter(p => p.live && p !== hero).forEach(p => { const d = dist(p);
        if (d < dh - 0.3 && p.spr.renderOrder <= hero.spr.renderOrder) out.push(`a billboard ${(dh - d).toFixed(1)} nearer the camera than the hero draws under them (${p.spr.renderOrder} vs ${hero.spr.renderOrder})`);
        if (d > dh + 0.3 && p.spr.renderOrder >= hero.spr.renderOrder) out.push(`a billboard ${(d - dh).toFixed(1)} farther from the camera than the hero draws over them`); });
      return out; };
    { // stand right behind a person, camera to the south: they are nearer the camera than you
      const n = WORLDS.hq.npcs.find(n => !isSolidAt('hq', n.x, n.y - 1));
      if (!n) problems.push('no one in hq has a free tile behind them to test the draw order');
      else { world = 'hq'; px = fx = n.x; py = fy = n.y - 1; T3.yaw = 0; draw3d(); problems.push(...order().slice(0, 2));
        py = fy = n.y + 1; if (!isSolidAt('hq', n.x, n.y + 1)) { draw3d(); problems.push(...order().slice(0, 2)); } }
    }
    // #92 (owner: "when im going downstairs, im walking on the wall again"): sunk in the well the hero is
    // depth-tested, so the lip and the rail in front hide their legs; on the floor they draw through walls
    world = 'f2'; px = fx = 11; py = fy = 14; T3.yaw = 0; draw3d();
    { const hero = T3.pool.find(p => p.live && p.spr.userData.mark === '' && Math.abs(p.spr.position.x - 11.5) < 0.6 && p.spr.position.y < -0.1);
      if (!hero) problems.push('no hero billboard sunk in the loft\'s well at (11,14)');
      else if (hero.spr.material.depthTest !== true) problems.push('sunk in the well, the hero is still drawn through the rail and the floor\'s lip — they read as standing on the wall (#92)'); }
    px = fx = 11; py = fy = 11; draw3d();
    { const hero = T3.pool.find(p => p.live && p.spr.material.depthTest === false);
      if (!hero) problems.push('on the floor the hero no longer draws through walls (#22)'); }
    // asked for on 2026-09-07: an upgraded rainbow bridge (IDEAS §15.4, planned since
    // 2026-09-01): in 3D the bridge is a DECK over the river with a rail each side, not flat paint,
    // and whoever crosses it stands on the deck.
    world = 'pk'; px = fx = 2; py = fy = 6; T3.yaw = 0; draw3d();
    const decks = T3.group.children.filter(o => o.userData && o.userData.bridge);
    // owner, 2026-09-07 (night): "make it a bit wider - the bridge, twice as wide" — two rows of deck, rails only on the open edges
    if (decks.length !== 4) problems.push(`the rainbow bridge is ${decks.length} deck(s) in 3D, not four (two wide, two long)`);
    const pkw = WORLDS.pk, deckRows = new Set(); for (let yy = 0; yy < pkw.H; yy++) for (let xx = 0; xx < pkw.W; xx++) if ((TILES[pkw.rows[yy][xx]] || {}).kind === 'bridge') deckRows.add(yy);
    if (deckRows.size < 2) problems.push('the bridge is one tile wide');
    const railsAll = T3.group.children.filter(o => o.userData && o.userData.bridgeRail);
    railsAll.forEach(r => { const dz = r.position.z - (r.userData.y + 0.5), dx = r.position.x - (r.userData.x + 0.5); const ny = r.userData.y + (Math.abs(dz) > 0.3 ? Math.sign(dz) : 0), nx = r.userData.x + (Math.abs(dx) > 0.3 && Math.abs(dz) <= 0.3 ? Math.sign(dx) : 0);
      if ((nx !== r.userData.x || ny !== r.userData.y) && (TILES[(pkw.rows[ny] || '')[nx]] || {}).kind === 'bridge') problems.push(`a rail stands between two deck tiles at (${r.userData.x},${r.userData.y})`); });
    if (typeof bridgeEdges !== 'function') problems.push('the engine does not know which edges of a deck are open');
    else { const kw = world; world = 'pk'; const e5 = bridgeEdges(3, 5), e6 = bridgeEdges(3, 6); world = kw; if (e5 !== '10' || e6 !== '01') problems.push(`the deck's open edges read ${e5}/${e6}, not north-only/south-only`); }
    if (typeof DECK_PETALS === 'undefined' || DECK_PETALS.reduce((a, b) => a + b, 0) < 4500) problems.push('the deck carries fewer than four and a half thousand petals a tile — the owner asked for fifty times');
      // then ten times that, behind the frame (owner: "definitely do like 10x the amount of petals for the bridge"): a fresh tile queues a deep bake that fills in slices
      if (typeof DECK_DEEP === 'undefined' || typeof petalDeepStep !== 'function' || DECK_PETALS.reduce((a, b) => a + b, 0) + DECK_DEEP < 45000) problems.push('the deck does not fill in to forty-five thousand petals behind the frame');
      else { const sid0 = seasonPick; seasonSet(Object.keys(SEAS()).find(k => SEAS()[k].art && SEAS()[k].art.bridgeStyle === 'petals') || 'off'); PETALCACHE.clear(); PETALDEEP.length = 0; const c2 = document.createElement('canvas'); c2.width = 32; c2.height = 32; const o2 = ctx; ctx = c2.getContext('2d'); try { TILEDRAW['^']({ sx: 0, sy: 0, x: 3, y: 6, canopy: () => {} }); } finally { ctx = o2; }
        if (petalDeepPending() < DECK_DEEP) problems.push('a fresh deck tile queues no deep bake (' + petalDeepPending() + ' pending, style ' + art('bridgeStyle', 'bands') + ', season ' + seasonNow() + ')');
        let guard = 200; while (petalDeepPending() && guard--) petalDeepStep(); if (petalDeepPending()) problems.push('the deep bake never finishes');
        const ck = [...PETALCACHE.keys()].find(k => k.endsWith('|deck|3|6|' + bridgeEdges(3, 6))); const cc = ck ? PETALCACHE.get(ck) : null; const dd = cc ? cc.getContext('2d').getImageData(0, 0, 32, 32).data : null; const seen2 = new Set();
        const palD = petalPal().map(h => h.toLowerCase()); if (dd) for (let i = 0; i < dd.length; i += 4) { const h = '#' + [dd[i], dd[i + 1], dd[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''); if (palD.includes(h)) seen2.add(h); }
        if (!cc || seen2.size < 4) problems.push('after the deep bake the heap is a rug again (' + seen2.size + ' colours)'); seasonSet(sid0); }
    if (typeof petalBake !== 'function') problems.push('nine hundred petals a tile are drawn every frame — bake them');
    decks.forEach(d => { if (!(d.position.y > 0.05)) problems.push(`the bridge deck at (${d.userData.x},${d.userData.y}) lies flat on the water`); });
    const rails = T3.group.children.filter(o => o.userData && o.userData.bridgeRail);
    if (rails.length < 4) problems.push(`the rainbow bridge has ${rails.length} rail pieces in 3D — it needs a rail each side`);
    if (rails.some(r => r.position.y <= 0.2)) problems.push('a bridge rail stands on the water, not on the deck');
    // the crossing arches (owner, 2026-09-08: "make the bridge a bit better, some arching and or dimesionality")
    if (typeof bridgeCamber !== 'function' || typeof bridgeSlope !== 'function') problems.push('the bridge does not arch');
    else { const pk2 = WORLDS[PL.park], deckT = [];
      for (let y2 = 0; y2 < pk2.H; y2++) for (let x2 = 0; x2 < pk2.W; x2++) if ((TILES[pk2.rows[y2][x2]] || {}).kind === 'bridge') deckT.push([x2, y2]);
      if (!deckT.every(([x2, y2]) => bridgeCamber(pk2, x2, y2) > 0.02)) problems.push('a deck tile rides no higher than its banks');
      const slopes = deckT.map(([x2, y2]) => bridgeSlope(pk2, x2, y2));
      if (!slopes.some(v => v > 0.05) || !slopes.some(v => v < -0.05)) problems.push('the crossing does not rise and fall — it is a flat slab, not an arch');
      if (bridgeCamber(pk2, 0, 0) !== 0) problems.push('the bank arches too');
      const bank = stairLift(pk2, deckT[0][0], deckT[0][1]);
      if (!(bank > BRIDGEH)) problems.push('standing on the deck does not put you on the arch');
      if (!decks.some(d => d.rotation.z !== 0)) problems.push('no deck tile in 3D is laid at a slope');
      if (!T3.group.children.some(o => o.userData && o.userData.arch === true)) problems.push('the crossing has no rib under it'); }
    px = fx = 3; draw3d();
    { const hero = T3.pool.find(p => p.live && p.spr.material.depthTest === false);
      if (!hero || hero.spr.position.y < 0.15) problems.push('standing on the rainbow bridge, the hero is not lifted onto its deck (' + (hero ? hero.spr.position.y.toFixed(2) : 'no hero') + ')'); }
    // #45: a poster on a wall hangs on the wall's open face, mid-height. The six office posters
    // on f2's north wall used to float 1.15 up — above the wall they are pinned to.
    world = 'f2'; px = fx = 2; py = fy = 1; draw3d();
    const wallTop = 0.55 + ((TILES['▭'] || {}).lift | 0) * 0.042;
    const posters = T3.pool.filter(p => p.live && p.spr.userData.mark === 'read' && p.spr.position.z < 1.5);
    if (posters.length !== 6) problems.push(`${posters.length} of 6 office posters stand on f2's north wall in 3D`);
    posters.forEach(p => { const s = p.spr.position;
      if (s.y + 0.2 > wallTop || s.y < 0.3) problems.push(`the poster at x ${s.x.toFixed(1)} is not mid-face on its wall (${s.y.toFixed(2)} up on a ${wallTop.toFixed(2)} wall)`);
      if (s.z < 1.0) problems.push(`the poster at x ${s.x.toFixed(1)} hangs inside the wall, not on its open face (z ${s.z.toFixed(2)})`); });
    const desk = T3.pool.filter(p => p.live && p.spr.userData.mark === 'read' && Math.abs(p.spr.position.x - 10.5) < 0.6);
    if (desk.length !== 1 || desk[0].spr.position.y < 1.0) problems.push('the read mark on the old lead\'s desk no longer floats where it can be seen');
    // #57 (mq-v78): the actor card has headroom — a thought bubble above the head is not cut off
    if (T3.pool[0].c.height !== 48 * T3.K) problems.push('the actor card is not 48 tall');
    { const c = document.createElement('canvas'); c.width = 36; c.height = 48; const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 8);
      const now0 = Date.now; Date.now = () => 1000; const o = ctx; ctx = g;
      try { drawPerson(g, 2, 6, look, { dir: 'down' }); drawEmote({ npc: 'nobody', x: 0, y: 0 }, 2, 6); } finally { ctx = o; Date.now = now0; }
      const d = g.getImageData(0, 0, 36, 48).data, on = y => { for (let x = 0; x < 36; x++) if (d[(y * 36 + x) * 4 + 3] > 30) return true; return false; };
      if (on(0) || on(1)) problems.push('the bubble touches the top edge of the actor card');
      let any = false; for (let y = 2; y < 14; y++) if (on(y)) { any = true; break; } if (!any) problems.push('no bubble was drawn above the head'); }
    // #4 (mq-v81): Meridian's office has the flight — it rises in HQ's stair hall and sinks into the loft's well
    if (!(stairLift(WORLDS.hq, 11, 14) > 0 && stairLift(WORLDS.hq, 14, 14) > stairLift(WORLDS.hq, 11, 14))) problems.push("Meridian's flight does not rise east in HQ's stair hall (#4)");
    if (!(stairLift(WORLDS.f2, 13, 14) < 0 && stairLift(WORLDS.f2, 10, 14) < stairLift(WORLDS.f2, 13, 14))) problems.push("Meridian's loft has no well sinking to the way down (#4)");
    // #24 (mq-v74): a 3D failure leaves a trace — once in the console, the last one under the prefix
    { const n0 = T3.errors.length; t3Note('test', new Error('boom')); t3Note('test', new Error('boom'));
      if (T3.errors.length !== n0 + 1) problems.push('t3Note does not log once per distinct message (' + (T3.errors.length - n0) + ')');
      const last = JSON.parse(localStorage.getItem(SK('err3d')) || 'null');
      if (!last || last.where !== 'test' || !/boom/.test(last.msg) || last.v !== GAMEV) problems.push('the last 3D error is not kept under the prefix with the version');
      T3.errors.pop(); localStorage.removeItem(SK('err3d')); }
    if (lintels < doors) problems.push(`${doors - lintels} of hq's ${doors} doors have a see-through slot above them (no lintel)`);
    if (glows < doors) problems.push(`${doors - glows} of hq's ${doors} doors do not say "this one opens" in 3D`);
    T3.yaw = before.yaw; camSet(before.cam);
    world = before.world; px = fx = before.px; py = fy = before.py; held = null; moving = false;
    return problems;
  });
  fails.push(...doors3d);

  // ---- 3D textures are baked at the screen's resolution, not at 1x ----
  // The blur (IDEAS §15.1, measured): every 3D texture was baked at 32px a tile while
  // the renderer output at up to 3x device pixels — a 2.9x–4.0x magnification of the
  // source art. The two earlier "blur fixes" on main raised the OUTPUT resolution and
  // added mipmaps; neither can sharpen a texture that is being magnified. The fix is
  // one factor K = the renderer's pixel ratio, applied at every bake site.
  const bake = await page.evaluate(() => {
    const problems = [];
    const before = { cam: camMode, world, px, py };
    camSet('3d'); world = 'hq'; px = fx = 10; py = fy = 11; moving = false; held = null;
    if (!draw3d() || T3.fail) { problems.push('3D did not render headless — the bakes could not be checked'); return problems; }
    // headless is 1x, where the old 1x bake was accidentally right — so stand in for a
    // retina phone: tell the renderer it draws at 2x and everything must re-bake at 2x
    const pr0 = T3.renderer.getPixelRatio();
    T3.renderer.setPixelRatio(2); draw3d();
    const K = T3.K;
    if (K !== 2) { problems.push(`renderer at 2x but the bake factor is ${K}`); T3.renderer.setPixelRatio(pr0); return problems; }
    const w = CW();
    let ground = 0, tiles = 0, canopy = 0;
    T3.group.traverse(o => {
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      ms.forEach(m => {
        if (!m.map || !m.map.image) return;
        const im = m.map.image, u = o.userData || {};
        if (im.width === w.W * 32 * K && im.height === w.H * 32 * K) { ground++; return; }
        if (im.width === 40 * K && im.height === 40 * K) { canopy++; return; }
        if (im.width === 32 * K && im.height === 32 * K) { tiles++; return; }
        problems.push(`a ${u.door ? 'door' : u.wall ? 'wall' : 'prop'} texture is ${im.width}x${im.height} — not ${32 * K}x${32 * K} (K=${K})`);
      });
    });
    if (!ground) problems.push(`the ground texture is not ${w.W * 32 * K}x${w.H * 32 * K} (K=${K})`);
    if (!tiles) problems.push('no tile texture found at K resolution');
    // actors: the live billboards must be baked at K too, or people go soft while walls stay sharp
    const live = T3.pool.filter(p => p.live);
    if (!live.length) problems.push('no live actor billboards after a draw');
    // 48, not 40 (#134). This line used to read 40 and passed — because it runs AFTER a forced DPR
    // change, and the resize path was cutting the billboards 40 tall while t3Sprite bakes them 48
    // (8px of headroom for the bubble, #57). The test was pinning the bug: every person went short
    // and stretched after the owner went fullscreen. The engine now re-cuts them 48 and this asks for it.
    live.forEach(p => { if (p.c.width !== 36 * K || p.c.height !== 48 * K)
      problems.push(`an actor billboard is ${p.c.width}x${p.c.height} — not ${36 * K}x${48 * K}`); });
    // and back: a DPR change (fullscreen, a window dragged between monitors) re-bakes both ways
    T3.renderer.setPixelRatio(pr0); draw3d();
    if (T3.K !== Math.min(3, Math.max(1, Math.round(pr0)))) problems.push(`back at ${pr0}x the bake factor stayed ${T3.K}`);
    const g1 = T3.group.children.find(o => o.material && o.material.map && o.material.map.image.width === w.W * 32 * T3.K);
    if (!g1) problems.push('the ground did not re-bake when the pixel ratio changed back');
    camSet(before.cam); world = before.world; px = fx = before.px; py = fy = before.py; held = null; moving = false;
    return problems;
  });
  fails.push(...bake);

  // ---- seasons: a season changes colour, never design (IDEAS §15.9) ----
  // The bridge's six bands were literal hex inside the engine, which is why no palette
  // could ever reach them. Now world art goes through art(key, fallback); a season is
  // content (SEASONS in the pack's config) that overrides art keys, arriving on its own
  // by date with a Settings override. The engine must not know a season's name.
  const season = await page.evaluate(() => {
    const problems = [];
    if (typeof art !== 'function' || typeof seasonNow !== 'function' || typeof seasonSet !== 'function') {
      problems.push('the season seam (art / seasonNow / seasonSet) is missing'); return problems; }
    if (typeof SEASONS === 'undefined' || !Object.keys(SEASONS).length) { problems.push('the pack declares no SEASONS'); return problems; }
    const [id, S] = Object.entries(SEASONS)[0];
    const pick0 = seasonPick;
    // off: the fallback is what you get, and the bridge paints its year-round bands
    seasonSet('off');
    if (art('bridge', 'X') !== 'X') problems.push('with the season off, art() did not return the fallback');
    const bake = () => { const c = document.createElement('canvas'); c.width = 32; c.height = 32;
      const o = ctx; ctx = c.getContext('2d'); try { TILEDRAW['^']({ sx: 0, sy: 0, x: 0, y: 0, canopy: () => {} }); } finally { ctx = o; }
      const d = ctx === o ? c.getContext('2d').getImageData(16, 5, 1, 1).data : null;
      return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); };
    const off = bake();
    // forced on: the pack's palette reaches the bridge, and only the colours changed
    seasonSet(id);
    if (seasonNow() !== id) problems.push(`forcing season "${id}" did not make it current`);
    if (art('bridge', 'X') !== S.art.bridge) problems.push('with the season forced, art("bridge") is not the pack palette');
    const on = bake();
    if (S.art.bridgeStyle === 'petals') {
      // owner, 2026-09-07: "marigold, and petals too" — the deck is strewn with the season's petals:
      // many pixels of the palette scattered over the tile, not six stripes
      const c = document.createElement('canvas'); c.width = 32; c.height = 32;
      const o = ctx; ctx = c.getContext('2d'); try { TILEDRAW['^']({ sx: 0, sy: 0, x: 3, y: 6, canopy: () => {} }); } finally { ctx = o; }
      const px = c.getContext('2d').getImageData(0, 0, 32, 32).data, pal = S.art.bridge.map(h => h.toLowerCase());
      let hits = 0; for (let i = 0; i < px.length; i += 4) { const h = '#' + [px[i], px[i + 1], px[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''); if (pal.includes(h)) hits++; }
      if (hits < 60) problems.push(`in season the deck shows ${hits} petal pixels of the palette — it is not strewn with petals`);
      // stripes paint every row one colour edge to edge; petals leave no row uniform
      let mixed = 0; for (let yy = 5; yy < 27; yy++) { const seen = new Set(); for (let xx = 2; xx < 30; xx++) { const i = (yy * 32 + xx) * 4; seen.add([px[i], px[i + 1], px[i + 2]].join()); } if (seen.size > 1) mixed++; }
      if (mixed < 15) problems.push(`the deck in season reads as stripes, not petals (${mixed} of 22 rows vary)`);
      // owner, 2026-09-07 (evening): "the bridge turns into one mostly made out of the petals, they dont even look like the
      // correct petals" — a bridge MADE of petals: no plank shows, the heap has a value range, a petal is a fan with a rib
      if (typeof petalShape !== 'function') problems.push('the engine has no petal shape — the deck is gravel');
      else {
        const seen = new Set(); let plank = 0; for (let i = 0; i < px.length; i += 4) { const h = '#' + [px[i], px[i + 1], px[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''); if (pal.includes(h)) seen.add(h); if (['#6e4e30', '#c9b99a', '#8a6f4d'].includes(h)) plank++; }
        if (plank) problems.push(`in season the deck still shows ${plank} plank pixels — the bridge is not made of petals`);
        if (seen.size < 4) problems.push(`the heap uses ${seen.size} of the palette's ${pal.length} colours — it has no depth`);
        const pc = document.createElement('canvas'); pc.width = 48; pc.height = 48; const pg = pc.getContext('2d'); petalShape(pg, 24, 40, 0, 6, '#f2870f');
        const d = pg.getImageData(0, 0, 48, 48).data; let x0 = 48, x1 = 0, y0 = 48, y1 = 0, rib = 0;
        for (let yy = 0; yy < 48; yy++) for (let xx = 0; xx < 48; xx++) { const i = (yy * 48 + xx) * 4; if (d[i + 3] < 250) continue; x0 = Math.min(x0, xx); x1 = Math.max(x1, xx); y0 = Math.min(y0, yy); y1 = Math.max(y1, yy); if (!(d[i] === 0xf2 && d[i + 1] === 0x87 && d[i + 2] === 0x0f)) rib++; }
        if ((y1 - y0) < (x1 - x0) * 1.2) problems.push('a petal is not longer than it is wide — a lentil, not a cempasúchil petal');
        if (rib < 6) problems.push('a petal has no rib');
      }
    } else if (on.toLowerCase() !== S.art.bridge[0].toLowerCase()) problems.push(`the bridge's first band is ${on}, not the season's ${S.art.bridge[0]}`);
    if (on === off) problems.push('the season changed nothing on the bridge');
    if (S.art.bridgeStyle === 'petals') { // owner, 2026-09-07: "full of the petals, they spill into water and the floor and a trail forms behind characters"
      const keep = { cam: camMode, world, px, py };
      const pal = S.art.bridge.map(h => h.toLowerCase());
      const offCount = fn => { const c = document.createElement('canvas'); c.width = 32; c.height = 32; const o = ctx; ctx = c.getContext('2d'); try { fn(); } finally { ctx = o; }
        const d = c.getContext('2d').getImageData(0, 0, 32, 32).data; let n = 0; for (let i = 0; i < d.length; i += 4) { const h = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''); if (pal.some(p => Math.abs(parseInt(p.slice(1, 3), 16) - d[i]) < 48 && Math.abs(parseInt(p.slice(3, 5), 16) - d[i + 1]) < 48 && Math.abs(parseInt(p.slice(5, 7), 16) - d[i + 2]) < 48)) n++; } return n; };
      if (typeof petalSpill !== 'function' || typeof petalDrop !== 'function' || typeof petalTrail !== 'function' || typeof bridgeDist !== 'function') problems.push('the engine has no petal spill or trail');
      else {
        seasonSet(id); const pk = WORLDS[PL.park];
        const wt = (() => { for (let y = 0; y < pk.H; y++) for (let x = 0; x < pk.W; x++) if ((TILES[pk.rows[y][x]] || {}).kind === 'water' && bridgeDist(pk, x, y) === 1) return [x, y]; return null; })();
        const ft = (() => { for (let y = 0; y < pk.H; y++) for (let x = 0; x < pk.W; x++) if (pk.rows[y][x] === '.' && bridgeDist(pk, x, y) === 2) return [x, y]; return null; })();
        if (!wt || !ft) problems.push('no water beside the bridge or floor near it to spill onto');
        else {
          const nw = offCount(() => petalSpill(pk, wt[0], wt[1], 0, 0)), nf = offCount(() => petalSpill(pk, ft[0], ft[1], 0, 0));
          if (nw < 12) problems.push(`the petals do not spill into the water beside the bridge (${nw} petal pixels)`);
          if (nf < 5) problems.push(`the petals do not spill onto the floor near the bridge (${nf} petal pixels)`);
          if (nf >= nw) problems.push('the spill is not thickest beside the deck');
          if (offCount(() => petalSpill(pk, 20, 2, 0, 0)) > 0) problems.push('petals spill far from any bridge');
        }
        // every painter calls the spill for the ground: top, front, iso and the 3D bake
        const spill0 = petalSpill, trail0 = petalTrail; let spills = 0, trails = 0;
        petalSpill = function () { spills++; return spill0.apply(this, arguments); }; petalTrail = function () { trails++; return trail0.apply(this, arguments); };
        world = PL.park; px = fx = PL.parkIn[0]; py = fy = PL.parkIn[1]; moving = false; held = null;
        const per = {}; ['top', 'front', 'iso'].forEach(c => { spills = 0; camSet(c); draw(); per[c] = spills; });
        spills = 0; camSet('3d'); t3Invalidate(); draw3d(); per['3d'] = spills;
        petalSpill = spill0; petalTrail = trail0;
        // in 3D the deck's SIDES are petals too, and the papel picado over the crossing is cut from the marigold palette (Pili)
        camSet('3d'); t3Invalidate(); draw3d();
        const dk = T3.group.children.filter(o => o.userData && o.userData.bridge);
        if (!dk.length) problems.push('no deck in the park in 3D'); else if (!dk.every(m => Array.isArray(m.material) && m.material[0].map)) problems.push('the deck\'s sides in 3D are bare planks under a bridge of petals');
        const pb = (S.art.papelBridge || []).map(h => h.toLowerCase());
        if (S.art.papel && !pb.length) problems.push('the bridge has no marigold palette for its papel picado (papelBridge)');
        const bf = T3.group.children.filter(o => o.userData && o.userData.papel && o.userData.flag);
        if (pb.length && bf.length && !bf.every(f => (f.userData.pal || []).map(h => h.toLowerCase()).join() === pb.join())) problems.push('the papel picado over the bridge is not cut from the marigold palette');
        Object.entries(per).forEach(([c, n]) => { if (!n) problems.push('the ' + c + ' camera never spills petals onto the ground around the bridge'); });
        if (!trails) problems.push('the top and front cameras never draw the trail');
        // the trail: a step ON THE DECK drops three petals, drawn on the ground, three flat planes in 3D;
        // the two steps after it still shed what the shoes carried; a step anywhere else drops nothing
        // (owner, 2026-09-07: "i meant for the bridge only lol. there are that many petals on the bridge")
        const deck = (() => { for (let y = 0; y < pk.H; y++) for (let x = 0; x < pk.W; x++) if ((TILES[pk.rows[y][x]] || {}).kind === 'bridge') return [x, y]; return null; })();
        const feet = {}; PETALS.length = 0; petalDrop(PL.park, PL.parkIn[0], PL.parkIn[1], feet);
        if (PETALS.length) problems.push('a step far from the bridge drops petals — the trail is the bridge\'s only');
        if (deck) { petalDrop(PL.park, deck[0], deck[1], feet); if (PETALS.length !== 1) problems.push('a step on the deck drops no petals');
          petalDrop(PL.park, 2, 6, feet); petalDrop(PL.park, 2, 7, feet); if (PETALS.length !== 3) problems.push('the two steps off the deck do not shed what the shoes carried');
          petalDrop(PL.park, 2, 8, feet); if (PETALS.length !== 3) problems.push('the third step off the deck still drops petals'); }
        if (offCount(() => petalTrail(PL.park, () => [0, 0])) < 4) problems.push('a dropped petal draws nothing on the ground');
        PETALS.length = 0; if (deck) { px = fx = deck[0]; py = fy = deck[1]; } moving = true; mt = 1; dir = 'right'; loop(performance.now() + 20); moving = false;
        if (!PETALS.length) problems.push('finishing a step on the deck in season drops no petals (the trail never forms)');
        const wn = pk.npcs[0]; if (wn && (() => { PETALS.length = 0; petalDrop(PL.park, PL.parkIn[0], PL.parkIn[1], wn); return PETALS.length; })()) problems.push('a wanderer far from the bridge drops petals');
        // the moment on the deck (owner, 2026-09-07): stand still on the bridge for a breath, pick a petal up, say the line — once per crossing, never off the deck
        if (typeof petalMomentTick !== 'function' || !(UI.en.petalLines || []).length || (UI.en.petalLines || []).length !== (UI.es.petalLines || []).length) problems.push('the deck has no moment or no lines in both languages');
        else if (deck) { const heldBefore = petalMoment; moving = false; px = fx = deck[0]; py = fy = deck[1]; deckIdle = 0; petalSaid = false; petalMoment = false;
          const toast0 = toast; let said = null; toast = function (m) { said = m; return toast0.apply(this, arguments); };
          for (let i = 0; i < 10; i++) petalMomentTick(100); if (petalMoment) problems.push('the petal comes up before a breath has passed');
          for (let i = 0; i < 20; i++) petalMomentTick(100); if (!petalMoment) problems.push('standing on the deck, no petal is picked up');
          toast = toast0; if (!UI[lang].petalLines.includes(said)) problems.push('the moment says nothing of the pack\'s lines (' + JSON.stringify(said) + ')');
          const bakeH = fn => { const c = document.createElement('canvas'); c.width = 44; c.height = 44; const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 6, 12); fn(g); return g.getImageData(0, 0, 44, 44).data; };
          const withP = bakeH(g => drawPerson(g, 0, 0, look, { dir: 'down', hero: true })); petalMoment = false; const without = bakeH(g => drawPerson(g, 0, 0, look, { dir: 'down', hero: true })); petalMoment = true;
          let diff = 0; for (let i = 0; i < withP.length; i += 4) if (withP[i + 3] !== without[i + 3]) diff++; if (diff < 10) problems.push('the petal in hand draws nothing');
          px = fx = PL.parkIn[0]; py = fy = PL.parkIn[1]; petalMomentTick(100); if (petalMoment) problems.push('off the deck the petal stays in hand');
          for (let i = 0; i < 30; i++) petalMomentTick(100); if (petalMoment) problems.push('a step off the deck and the moment repeats itself');
          seasonSet('off'); px = fx = deck[0]; py = fy = deck[1]; deckIdle = 0; petalSaid = false; for (let i = 0; i < 30; i++) petalMomentTick(100); if (petalMoment) problems.push('out of season a petal is picked up'); seasonSet(id); petalMoment = heldBefore; }
        camSet('3d'); draw3d(); const planes = T3.scene.children.filter(o => o.userData && o.userData.petal && o.visible);
        if (planes.length < 3) problems.push(`the trail has ${planes.length} petals on the ground in 3D — three a drop`);
        seasonSet('off'); PETALS.length = 0;
        if (wt && offCount(() => petalSpill(pk, wt[0], wt[1], 0, 0)) > 0) problems.push('out of season the water beside the bridge still carries petals');
        petalDrop(PL.park, 2, 6); if (PETALS.length) problems.push('out of season a step still drops petals');
      }
      camSet(keep.cam); world = keep.world; px = fx = keep.px; py = fy = keep.py;
    }
    if (S.art.swags) { // LA FIESTA (owner: "lets hang papel picado all over. put a pinata in there as well as tamales"; Nacho's plan)
      if (typeof fiestaSwags !== 'function' || typeof fiestaHangs !== 'function' || typeof drawPinata !== 'function') problems.push('the engine has no fiesta (fiestaSwags / fiestaHangs / drawPinata)');
      else {
        const keep = { cam: camMode, world, px, py }, rows0 = JSON.stringify(Object.fromEntries(Object.entries(WORLDS).map(([k, w]) => [k, w.rows])));
        seasonSet(id);
        if (JSON.stringify(Object.fromEntries(Object.entries(WORLDS).map(([k, w]) => [k, w.rows]))) !== rows0) problems.push('the season changed a map row — the dressing must never rebuild the design');
        if (fiestaSwags(PL.street).length < 5) problems.push('the street is not dressed: fewer than five swags');
        // every swag is tied to something you can see it tied to, or gets a pole; none crosses a door or a portal
        fiestaSwags(PL.street).forEach(sw => { const y = sw.from[1]; for (let x = Math.min(sw.from[0], sw.to[0]); x <= Math.max(sw.from[0], sw.to[0]); x++) { if (portalAt(PL.street, x, y)) problems.push(`a swag on the street hangs over the door at (${x},${y})`); } });
        camSet('3d'); world = PL.street; px = fx = 5; py = fy = 10; moving = false; held = null; t3Invalidate(); draw3d();
        const flags = T3.group.children.filter(o => o.userData && o.userData.swag && o.userData.flag);
        const nfl = flags.reduce((a, f) => a + (f.userData.flags || 1), 0);
        if (nfl < 200) problems.push(`the street carries ${nfl} swag flags in 3D — it is not dressed`);
        // owner, 2026-09-07 (evening): "papel picado all over the place" — Pili: cut paper with punched holes, two rows, by place
        if (flags.some(f => !f.material.map)) problems.push('the papel picado in 3D is plain bunting — no cut, no holes');
        if (!flags.some(f => f.userData.row === 1)) problems.push('the papel picado hangs in one row');
        if (typeof drawCalaverita !== 'function' || typeof canopyDress !== 'function' || typeof fiestaProps !== 'function' || typeof drawPapelRow !== 'function') problems.push('the engine has no calaveritas, no dressed trees, no cut paper');
        else {
          const pal2 = (art('papel', []) || []);
          // owner, 2026-09-07 (night): "the papel picado can be everywhere and more colorful" — every base world strung, ten colours in the cut
          Object.keys(WORLDS).filter(k => !WORLDS[k].built).forEach(wid => { if (!fiestaSwags(wid).length) problems.push('no papel picado in ' + wid); });
          if (pal2.length < 9) problems.push('the cut has only ' + pal2.length + ' colours');
        // owner, 2026-09-08: "the alebrijes mode has some overlay issues still in the park" — a swag must never share a
        // line with the deck: the bridge hangs its own marigold cut, and two strings in one line tangle at the deck's end
        Object.keys(WORLDS).filter(k => !WORLDS[k].built).forEach(wid => { const w = WORLDS[wid];
          fiestaSwags(wid).forEach(sw => { const hor = sw.from[1] === sw.to[1], ln = hor ? sw.from[1] : sw.from[0];
            for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++)
              if ((TILES[w.rows[y][x]] || {}).kind === 'bridge' && (hor ? y : x) === ln)
                problems.push(`a swag in ${wid} shares the bridge's ${hor ? 'row' : 'column'} ${ln} — the deck hangs its own cut there`); }); });
          const pr = art('props', []) || []; if (!pr.some(p => p.kind === 'calaverita')) problems.push('no calaveritas de azúcar anywhere');
          // "the candied skulls are probably better in a window sill (as in human reality)": every calaverita sits on a facade's window
          pr.filter(p => p.kind === 'calaverita').forEach(p => { if (!p.sill) problems.push('a calaverita is not on a sill at ' + p.world + ' ' + p.x + ',' + p.y); else if (typeof propSill !== 'function' || !propSill(p.world, p)) problems.push('a sill calaverita has no window under it at ' + p.world + ' ' + p.x + ',' + p.y); });
          // ❗La ofrenda: one at the foot of the bridge, one on Doña Tencha's table; it draws; it stands in 3D
          const ofr = pr.filter(p => p.kind === 'ofrenda'); if (typeof drawOfrenda !== 'function') problems.push('the engine has no ofrenda');
          else { if (!ofr.some(p => p.world === PL.park) || !ofr.some(p => WORLDS[p.world] && WORLDS[p.world].built)) problems.push('the ofrenda is not at the foot of the bridge and on a neighbour\'s table');
            const oc = document.createElement('canvas'); oc.width = 32; oc.height = 32; const og = oc.getContext('2d'); drawOfrenda(og, 0, 0); const od = og.getImageData(0, 0, 32, 32).data; let on = 0; for (let i = 3; i < od.length; i += 4) if (od[i] > 200) on++; if (on < 300) problems.push('the ofrenda draws almost nothing (' + on + ' px)');
            camSet('3d'); world = PL.park; px = fx = PL.parkIn[0]; py = fy = PL.parkIn[1]; moving = false; held = null; t3Invalidate(); draw3d();
            if (!T3.group.children.some(o => o.userData && o.userData.ofrenda)) problems.push('the ofrenda does not stand in the park in 3D');
            world = 'st'; px = fx = 5; py = fy = 2; t3Invalidate(); draw3d(); const sills = T3.group.children.filter(o => o.userData && o.userData.calaverita && o.userData.sill);
            if (!sills.length) problems.push('no calaverita stands on a sill on the street in 3D'); else if (sills.some(s => s.position.y < 0.2)) problems.push('a sill calaverita sits on the ground, not in the window'); }
          const pw = pr.find(p => p.kind === 'calaverita'); if (pw) { camSet('3d'); world = pw.world; px = fx = pw.x; py = fy = pw.y + 2; moving = false; held = null; t3Invalidate(); draw3d();
            const cs = T3.group.children.filter(o => o.userData && o.userData.calaverita), want = pr.filter(p => p.world === pw.world && p.kind === 'calaverita');
            if (cs.length !== want.length) problems.push(`${cs.length} calaveritas stand in ${pw.world} in 3D, ${want.length} were set down`);
            want.forEach(p => { const s = cs.find(o => o.userData.x === p.x && o.userData.y === p.y); if (s && p.h !== undefined && s.position.y < p.h) problems.push('a calaverita sank below where it was set'); }); }
          const bakeC = (fn, w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); fn(g); return g.getImageData(0, 0, w, h).data; };
          const inPal = (d, list) => { const L = list.map(h => h.toLowerCase()); let n = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 250) continue; if (L.includes('#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''))) n++; } return n; };
          if (inPal(bakeC(g => drawCalaverita(g, 0, 0), 8, 8), ['#F6F2E8']) < 12) problems.push('a calaverita is not a white sugar skull');
          if (inPal(bakeC(g => canopyDress(g, 20, 12), 40, 40), pal2) < 10) problems.push('a dressed tree carries no paper');
          const cd0 = canopyDress; let dressed = 0; canopyDress = function () { dressed++; return cd0.apply(this, arguments); };
          world = PL.park; px = fx = PL.parkIn[0]; py = fy = PL.parkIn[1]; camSet('top'); draw(); camSet('front'); draw(); canopyDress = cd0;
          if (dressed < 2) problems.push('the top and front cameras do not dress the trees (' + dressed + ')');
          seasonSet('off'); if (inPal(bakeC(g => canopyDress(g, 20, 12), 40, 40), pal2) > 0) problems.push('out of season a tree is still dressed'); seasonSet(id);
        }
        if (flags.some(f => f.position.y < 1.5)) problems.push('a swag hangs at head height');
        const ex = (art('hangs', []) || []).find(h => h.kind === 'pinata'); if (!ex) problems.push('no piñata is hung');
        else { world = ex.world; px = fx = ex.x; py = fy = ex.y + 3; t3Invalidate(); draw3d();
          if (!T3.group.children.some(o => o.userData && o.userData.pinata)) problems.push('the piñata is not hanging in 3D');
          if (isSolidAt(ex.world, ex.x, ex.y)) problems.push('the piñata hangs over a solid tile — it must hang over open ground'); }
        // the two flat cameras draw it: spy the painter, and the flags leave paper-coloured pixels
        const f0 = fiestaDraw2D; let calls = 0; fiestaDraw2D = function () { calls++; return f0.apply(this, arguments); };
        world = PL.street; px = fx = 5; py = fy = 2; camSet('top'); draw(); camSet('front'); draw(); fiestaDraw2D = f0;
        if (calls < 2) problems.push('the top and front cameras do not draw the fiesta');
        const pal = (art('papel', []) || []).map(h => h.toLowerCase());
        const cnt = (() => { const c = document.createElement('canvas'); c.width = 320; c.height = 64; const o = ctx; ctx = c.getContext('2d'); try { fiestaDraw2D(PL.street, (x, y) => [x * 32, (y - 1) * 32], false); } finally { ctx = o; }
          const d = c.getContext('2d').getImageData(0, 0, 320, 64).data; let n = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 250) continue; if (pal.includes('#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''))) n++; } return n; })();
        if (cnt < 40) problems.push('the flat cameras draw no paper flags (' + cnt + ' pixels)');
        // the season speaks: arrival lines may be functions and say something different tonight; planters bloom
        const arr = UI.en.arrive[ex ? ex.world : PL.street]; const said = typeof arr === 'function' ? arr() : arr;
        seasonSet('off'); const plain = typeof arr === 'function' ? arr() : arr;
        if (said === plain) problems.push('Calle Dos says the same line in season as out of it');
        if (!S.art.bloom) problems.push('the season gives the planters no bloom');
        else { const bakeP = () => { const c = document.createElement('canvas'); c.width = 32; c.height = 32; const o = ctx; ctx = c.getContext('2d'); try { TILEDRAW['P']({ sx: 0, sy: 0, x: 0, y: 0, canopy: () => {} }); } finally { ctx = o; }
            const d = c.getContext('2d').getImageData(0, 0, 32, 32).data; let n = 0; const b = S.art.bloom.toLowerCase(); for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 250) continue; if ('#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('') === b) n++; } return n; };
          seasonSet(id); const on = bakeP(); seasonSet('off'); const off = bakeP();
          if (on < 12) problems.push('in season the planters do not bloom'); if (off) problems.push('out of season a planter still blooms'); }
        // and out of season nothing is left behind
        world = PL.street; camSet('3d'); t3Invalidate(); draw3d();
        if (T3.group.children.some(o => o.userData && (o.userData.swag || o.userData.pinata))) problems.push('out of season the swags or the piñata are still up');
        camSet(keep.cam); world = keep.world; px = fx = keep.px; py = fy = keep.py;
      }
      // Doña Meche, the tamalera at the trolley stop: a neighbour with three lines, her pot a box you walk around
      if (!NPCN.en.meche || !NPCN.es.meche || !NPCE.meche) problems.push('Doña Meche has no name in both languages');
      const mw = Object.entries(WORLDS).find(([k, w]) => w.npcs.some(n => n.npc === 'meche'));
      if (!mw) problems.push('Doña Meche stands nowhere');
      else { const reach = auditReach().filter(m => m.includes('meche')); if (reach.length) problems.push('Doña Meche is not reachable: ' + reach.join('; '));
        if (!(UI.en.chat.meche || []).length || (UI.en.chat.meche || []).length !== (UI.es.chat.meche || []).length) problems.push('Doña Meche has no lines, or not the same number in both languages');
        const mn = mw[1].npcs.find(n => n.npc === 'meche'), pot = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (mw[1].rows[mn.y + dy] || '')[mn.x + dx] === 'ʘ');
        if (!pot) problems.push('Doña Meche\'s pot is not beside her');
        if (wanders(mn)) problems.push('Doña Meche wanders off from her pot — she would step onto the trolley\'s landing');
        if (!SOLID.has('ʘ') || !TILESIDE['ʘ'] || (TILES['ʘ'] || {}).kind !== 'appliance') problems.push('the pot is not a solid box with a side view — it would ship flat (#39)'); }
    }
    if (S.art.papel) { // "and papel picado": in 3D the season hangs cut-paper flags over the crossing; none out of season
      const keep = { cam: camMode, world, px, py };
      camSet('3d'); world = PL.park; px = fx = PL.parkIn[0]; py = fy = PL.parkIn[1]; moving = false; held = null;
      seasonSet(id); draw3d();
      const flags = T3.group.children.filter(o => o.userData && o.userData.flag), poles = T3.group.children.filter(o => o.userData && o.userData.pole);
      if (flags.length < 5) problems.push(`in season the bridge carries ${flags.length} papel picado flags in 3D — it needs a string of five per deck tile`);
      if (poles.length < 2) problems.push('the papel picado has no poles to hang from');
      if (flags.some(f => f.position.y < 1.5)) problems.push('a papel picado flag hangs at head height — it must be strung high over the crossing');
      seasonSet('off'); draw3d();
      if (T3.group.children.some(o => o.userData && o.userData.papel)) problems.push('out of season the papel picado is still up');
      camSet(keep.cam); world = keep.world; px = fx = keep.px; py = fy = keep.py;
    }
    // auto by date: inside the window it arrives on its own; outside, it is gone
    seasonSet('auto');
    const [fm, fd] = S.from, [tm, td] = S.to;
    if (seasonNow(new Date(2026, fm - 1, fd)) !== id) problems.push('auto: the first day of the window is not in season');
    if (seasonNow(new Date(2026, tm - 1, td)) !== id) problems.push('auto: the last day of the window is not in season');
    if (seasonNow(new Date(2026, 5, 15)) !== null) problems.push('auto: mid-June is in season');
    // the choice persists, and a change re-bakes the 3D world
    seasonSet('off');
    let stored = null; try { stored = localStorage.getItem('mqseason'); } catch (e) {}
    if (stored !== 'off') problems.push('the season choice did not persist');
    const d0 = (typeof T3 !== 'undefined' && T3) ? T3.dirty : 0;
    seasonSet(id);
    if (typeof T3 !== 'undefined' && T3 && T3.dirty === d0) problems.push('changing the season did not tell the 3D camera to rebuild');
    // the Settings row exists and is built from content, not hardcoded
    const row = document.getElementById('seasonRow');
    if (!row) problems.push('no #seasonRow in Settings');
    else if (![...row.querySelectorAll('button')].some(b => b.dataset.sn === id)) problems.push(`Settings has no button for season "${id}"`);
    // NOCHE DE ALEBRIJES (owner, 2026-09-07; Pili's direction the same day): a second mode, by name only.
    // Every animal keeps its silhouette and gets tinted, marked and (the wingless) winged; five looks a
    // kind, the same five names; everyone gets calavera paint, five looks, the crowd varies by person.
    const ale = Object.entries(SEASONS).find(([k, v]) => v.art && v.art.alebrije);
    if (!ale) problems.push('no season hands alebrije looks');
    else if (typeof alebLooks !== 'function' || typeof faceLookFor !== 'function' || typeof wildDraw !== 'function') problems.push('the engine has no alebrije looks (alebLooks / faceLookFor / wildDraw)');
    else { const [aid, A] = ale;
      if (A.from || A.to) problems.push('the alebrije mode is on the calendar — it is a mode you pick, not a season that arrives');
      const star = CRIT.find(c => c.role === 'star'), SN = star && star.name; /* by his role: his name is this device's (#264) */
      if (!star) problems.push('no star dog to paint');
      else { const keep = { cam: camMode, world, px, py, ale: JSON.stringify(alePick) };
        const now0 = Date.now; Date.now = () => 1700000000000; /* the tail wags with the clock: freeze it so two bakes differ only by the treatment */
        const bake = (fn, sc) => { sc = sc || 1; const c = document.createElement('canvas'); c.width = 44 * sc; c.height = 44 * sc; const g = c.getContext('2d'); g.setTransform(sc, 0, 0, sc, 6 * sc, 12 * sc); fn(g); return g.getImageData(0, 0, 44 * sc, 44 * sc).data; };
        const dog = () => bake(g => drawBeagle(g, star, 0, 0));
        const alpha = d => { const a = []; for (let i = 3; i < d.length; i += 4) a.push(d[i] > 40 ? 1 : 0); return a; };
        const hues = d => { const B = new Set(); for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 200) continue; const r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2, sat = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1)); if (sat < 0.35 || l < 0.12 || l > 0.9) continue; let h = 0; if (mx === r) h = ((gg - b) / (mx - mn)) % 6; else if (mx === gg) h = (b - r) / (mx - mn) + 2; else h = (r - gg) / (mx - mn) + 4; B.add(Math.floor(((h * 60 + 360) % 360) / 30)); } return B.size; };
        seasonSet('off'); const off = dog();
        seasonSet(aid); const L = alebLooks();
        if (!L || L.length !== 5) problems.push('the alebrije mode does not offer five looks (' + (L ? L.length : 0) + ')');
        else {
          const noWing = L.findIndex(l => !l.wings), wing = L.findIndex(l => l.wings);
          if (noWing < 0 || wing < 0) problems.push('the five looks must include wings on and wings off');
          alePick.animals[SN] = noWing; const on = dog();
          if (alpha(on).join('') !== alpha(off).join('')) problems.push('the alebrije treatment moved the star dog\'s silhouette — it must paint only inside his own pixels');
          const nh = hues(on); if (nh < 2 || nh > 4) problems.push(`the star dog wears ${nh} hue families as an alebrije — two to four read; one is a wash, more is crossed out`);
          const ids = new Set(); for (let i = 0; i < 5; i++) { alePick.animals[SN] = i; ids.add(alebLookFor('beagle', SN).id); } if (ids.size !== 5) problems.push('the five looks are not five distinct looks for the star dog');
          alePick.animals[SN] = wing; const w1 = dog(), a0 = alpha(off), a1 = alpha(w1);
          let added = 0, out = 0; for (let i = 0; i < a0.length; i++) { if (a0[i] && !a1[i]) out++; if (!a0[i] && a1[i]) { added++; const x = i % 44, y = Math.floor(i / 44); if (x < 6 + 16 - 13 || x > 6 + 16 + 13 || y > 12 + 22) out++; } }
          if (added < 12) problems.push('the winged look adds no wings to the star dog');
          if (out) problems.push('the wings cross the star dog\'s own pixels, his face, or the card\'s edge (' + out + ' pixels)');
          // owner, 2026-09-07 (evening): "wings look off". Their size, their root, their ribs and their beat are asked of every kind in every
          // pose just below this block (NOCHE DE ALEBRIJES: WHAT AN ANIMAL WEARS…) — the floor on their size that stood here guarded the
          // opposite of what the night was asked for (the dog still himself, perhaps with tiny wings), and its "three colours" was any anti-aliased edge
          const wcols = new Set(); for (let i = 0; i < a0.length; i++) if (!a0[i] && a1[i]) wcols.add(w1[i * 4] + ',' + w1[i * 4 + 1] + ',' + w1[i * 4 + 2]);
          const acc = parseInt(L[wing].accent.slice(1), 16), tgt = [(acc >> 16) & 255, (acc >> 8) & 255, acc & 255].map(v => v * 0.5 | 0);
          if (![...wcols].some(c => { const v = c.split(',').map(Number); return Math.abs(v[0] - tgt[0]) < 10 && Math.abs(v[1] - tgt[1]) < 10 && Math.abs(v[2] - tgt[2]) < 10; })) problems.push('the wings have no darker edge in their own colour — cut paper has an edge all the way round');
          // "the color can be added like around the eyes": a ring round the eye, wider than it, the pupil untouched
          const KB = ALEB_KIND.beagle; if (!KB || !KB.eye) problems.push('the star dog has no colour round the eyes');
          else { alePick.animals[SN] = noWing; const ringed = dog(); const eye = KB.eye; delete KB.eye; const bare = dog(); KB.eye = eye;
            let ring = 0, pupil = 0; for (let i = 0; i < a0.length; i++) { const x = i % 44 - 6 - 16 - eye[0] * (star.face || 1), y = Math.floor(i / 44) - 12 - eye[1], r = Math.hypot(x, y);
              const diff = ringed[i * 4] !== bare[i * 4] || ringed[i * 4 + 1] !== bare[i * 4 + 1] || ringed[i * 4 + 2] !== bare[i * 4 + 2]; if (!diff) continue; if (r < 1.3) pupil++; else if (r < eye[2] + 2.5) ring++; }
            if (ring < 8) problems.push('the ring round the star dog\'s eye paints nothing (' + ring + ')'); if (pupil) problems.push('the ring closes on the star dog\'s pupil — he goes blind at ten tiles'); }
          // the buttons: next cycles all five and comes back; random never repeats the current look
          petCrit = star; petTarget = 'beagle'; alePick.animals[SN] = 0; const seen = [];
          for (let i = 0; i < 5; i++) { alePress(false); seen.push(alebLookFor('beagle', SN).id); }
          if (new Set(seen).size !== 5 || alebLookFor('beagle', SN).id !== L[0].id) problems.push('Next does not walk the five looks and come back (' + seen.join(',') + ')');
          for (let i = 0; i < 12; i++) { const cur = alebLookFor('beagle', SN).id; alePress(true); if (alebLookFor('beagle', SN).id === cur) { problems.push('Random repeated the current look'); break; } }
          petCrit = null; petTarget = null;
        }
        // everyone painted: the hero and a person of the world, in different looks when they are different people
        const F = faceLooks(); if (!F || F.length !== 5) problems.push('the calavera paint does not offer five looks');
        else {
          const face = (who, hero) => bake(g => drawPerson(g, 0, 0, hero ? look : (NPCLOOK.tacho || look), { dir: 'down', hero, who }), 3); /* at 3x the base has room to be counted */
          const count = (d, hex) => { const h = hex.toLowerCase(); let n = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 250) continue; if ('#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('') === h) n++; } return n; };
          const lum = hex => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
          for (let i = 0; i < 5; i++) { alePick.hero = i; const d = face('hero', true); if (count(d, F[i].base) < 30) problems.push('the hero\'s calavera look ' + F[i].id + ' leaves no base on the face (' + count(d, F[i].base) + ')');
            // a Día de Muertos makeup review (2026-09-07): white bone + black voids IS the symbol — a dark base reads as a mask.
            // Owner: "having one with all dark is a bit of a no no - not really even looking like a skeleton"
            if (lum(F[i].base) < 0.8) problems.push('calavera look ' + F[i].id + ' has a dark base — it would not read as a skull');
            if (lum(F[i].dark) > 0.3) problems.push('calavera look ' + F[i].id + ' has no dark sockets');
            if (count(d, F[i].dark) < 20) problems.push('calavera look ' + F[i].id + ' paints no sockets or grin on the hero (' + count(d, F[i].dark) + ')'); }
          if (new Set(F.map(f => f.id)).size !== 5) problems.push('the five calavera looks are not five names');
          alePick.hero = 0;
          const lk = faceLookFor('tacho', false); if (!lk) problems.push('a person of the world gets no calavera look');
          else if (count(face('tacho', false), lk.base) < 30) problems.push('a person of the world is not painted (' + lk.id + ')');
          const pair = (WORLDS.hq.npcs || []).slice(0, 2).map(n => faceLookFor(n.npc || n.key, false).id);
          const ids = new Set((WORLDS.hq.npcs || []).map(n => faceLookFor(n.npc || n.key, false).id));
          if ((WORLDS.hq.npcs || []).length >= 5 && ids.size < 3) problems.push('the crowd in HQ wears fewer than three calavera looks');
          // owner, 2026-09-07 (night): "a menu to choose the different alebrije styles" — Settings → Alebrijes: who, then the look by name
          const row = $('aleRow'), sel = $('aleWho');
          if (!row || row.hidden || !sel) problems.push('Settings has no Alebrijes menu in season');
          else { const opts = [...sel.options].map(o => o.value); if (!opts.includes('you') || !opts.includes(SN)) problems.push('the menu offers neither your face nor the star dog (' + opts.join(',') + ')');
            sel.value = SN; sel.dispatchEvent(new Event('change')); const btns = [...$('aleRow').querySelectorAll('button')];
            if (btns.length !== 5) problems.push('the menu lists ' + btns.length + ' looks for the star dog, not five');
            else { btns[3].click(); if (alePick.animals[SN] !== 3 || alebLookFor('beagle', SN).id !== F.length && alebLookFor('beagle', SN).id !== alebLooks()[3].id) problems.push('picking a look from the menu did not dress the star dog in it');
              if ($('aleRow').querySelectorAll('button[aria-pressed="true"]').length !== 1) problems.push('the menu does not mark the look the star dog wears'); }
            $('aleWho').value = 'you'; $('aleWho').dispatchEvent(new Event('change')); const fb = [...$('aleRow').querySelectorAll('button')];
            if (fb.length !== 5) problems.push('the menu lists ' + fb.length + ' calavera looks for your face, not five'); else { fb[2].click(); if (alePick.hero !== 2) problems.push('picking a face from the menu did not paint it'); }
            delete alePick.animals[SN]; alePick.hero = 0; }
          // "leave it in the architecture to have the ability to upgrade to customize the look": a custom seam over the pick
          alePick.custom = { [SN]: { tint: '#123456' }, you: { ring: '#654321' } };
          if (alebLookFor('beagle', SN).tint !== '#123456') problems.push('a custom look for the star dog is not laid over his pick');
          if (faceLookFor('hero', true).ring !== '#654321') problems.push('a custom face is not laid over your pick');
          if (alebLookFor('beagle', SN).id !== alebLooks()[((aleHash(SN) + alePick.off) % 5 + 5) % 5].id) problems.push('a custom look lost the pick\'s name');
          alePick.custom = {};
          seasonSet('off'); if (faceLookFor('tacho', false) || alebLooks()) problems.push('with the mode off, the paint and the looks remain');
          if ($('aleRow') && !$('aleRow').hidden) problems.push('with the mode off, the Alebrijes menu stays');
          // "we also should be able to wear the make up during dia de los muertos": the calavera in Muertos, the buttons act on your face
          if (S.art.facepaint === undefined) problems.push('Día de Muertos hands out no face paint');
          else { seasonSet(id); if (!faceLookFor('tacho', false) || !faceLookFor('hero', true)) problems.push('in Día de Muertos nobody is painted');
            applyCtl(); if ($('aleRnd') && $('aleRnd').hidden) problems.push('in Día de Muertos the look buttons hide'); const h0 = alePick.hero; alePress(false); if (alePick.hero === h0) problems.push('in Día de Muertos the next-look button does not change your face'); alePick.hero = h0; alePersist();
            if (!$('aleRow') || $('aleRow').hidden || ![...$('aleWho').options].some(o => o.value === 'you')) problems.push('in Día de Muertos the menu does not offer your face');
            seasonSet('off'); }
          const offAgain = dog(); if (alpha(offAgain).join('') !== alpha(off).join('')) problems.push('with the mode off, the star dog\'s wings did not go');
        }
        Date.now = now0;
        alePick = JSON.parse(keep.ale); alePersist();
        camSet(keep.cam); world = keep.world; px = fx = keep.px; py = fy = keep.py; } }
    seasonSet(pick0);
    return problems;
  });
  fails.push(...season);

  /* ---- NOCHE DE ALEBRIJES: WHAT AN ANIMAL WEARS GOES WHERE HE GOES (mq-v233) ----
     The alebrije night was asked for as the dog still looking like himself, perhaps with tiny wings (2026-09-07, the
     comment over ALEB_DEF in engine/engine.js). Until
     mq-v233 the guard on the wings was a FLOOR on their size — "a wing that does not break the silhouette is not a wing",
     fewer than 40 pixels outside him and the build went red — read off one dog standing still at one frozen clock. It
     guarded the opposite of that, and it was green while, over the hurdle, the beagle's wings stayed down where he
     had been standing, lying down the colour round his eye sat on his brow, inside the agility tunnel his wings showed
     where the tube hid him, and every wing in the world beat on the clock, together, asleep or awake. The painters lift
     and lower the body themselves, and the alebrije layer was pinned to the standing pose.
     So this asks that, of every kind the engine gives wings or an eye ring (read off ALEB_KIND, so a new one cannot
     be skipped), in every pose its painter has, facing both ways, at every eighth of its step, on the park's own hurdle
     and in its own tunnel, with the clock held still — and then swept, where the clock is the question:
       · THE ROOT IS IN HIS BACK — the lowest point of the wings, drawn alone, is inside him, at least ¾ px and at most
         4 px below the top of his body in that column: not floating over him, not left behind under him;
       · A TINY WING — nothing of the wing you can see rises above the top of his head;
       · THE RIBS SHOW — the wing's pattern colour changes what you see of the wing;
       · THE COLOUR ROUND HIS EYE IS ROUND HIS EYE — wherever his own painter put the eye in this pose;
       · INSIDE THE TUNNEL NOTHING OF HIM SHOWS, wings included;
       · THE WINGS BEAT WITH HIS STEP — still at rest whatever the clock says, beating as he walks, and three dogs
         walking in step do not beat as one.
     Every answer is read from pixels the engine draws: the eye from his painter with the mode off, his body from the
     wingless look, the wings from the alebrije layer drawn over nothing (wildDraw with an empty painter); the guard
     supplies no position of its own. Planted 2026-10-04 on a copy outside the repository, each rule red on its own plant:
     the wings anchored at the standing pose, a root 3 px over the back, the wings grown back big, the ribs laid under the
     paper, the ring left at the standing pose, the ring drifted 2 px, a painter lowering the body by its own number, the
     beat on the clock, one beat for every dog, the wings drawn in the tunnel. Everything it moves is put back. */
  const wingsRide = await page.evaluate(() => {
    const P = [], N = [];
    const A = typeof SEASONS === 'object' && Object.entries(SEASONS).find(([k, v]) => v.art && v.art.alebrije);
    if (!A || typeof wildDraw !== 'function' || typeof ALEB_KIND !== 'object' || typeof alebLookFor !== 'function') {
      P.push('NOCHE DE ALEBRIJES: this pack has no alebrije mode, or the engine no alebrije layer, so nothing an animal wears could be asked to go where he goes'); return { P, N }; }
    const aid = A[0], pick0 = seasonPick, ale0 = JSON.stringify(alePick), DN = Date.now, PN = performance.now, ctx0 = ctx;
    const D0 = 1700000000000, T0 = 5e6, LONG = 1e7;   /* the clock held at a fixed moment, so every run asks the same question */
    const held = [DOG, CAT, PIG, LORO].map(o => [o, Object.assign({}, o)]);
    const SC = 4, CWU = 44, CHU = 48, OX = 6, OY = 16, W = CWU * SC, H = CHU * SC, CX = (OX + 16) * SC;   /* the card, at 4x, with room above for a dog in the air */
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const at = (D, T) => { Date.now = () => D; performance.now = () => T; };
    const shot = f => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.setTransform(SC, 0, 0, SC, OX * SC, OY * SC);
      ctx = g; try { f(g); } finally { ctx = ctx0; } return g.getImageData(0, 0, W, H).data; };
    const KN = { beagle: 'beagle', lab: 'lab', chi: 'chihuahua', dog: 'office dog', cat: 'cat', gato: 'street cat', pigeon: 'pigeon', loro: 'parrot', colibri: 'hummingbird' };
    const probe = (kind, name, o) => Object.assign({ kind, name, world: '__probe', x: 0, y: 0, fx: 0, fy: 0, dx: 1, dy: 0, face: 1, sit: false, layT: 0, howlT: 0, digT: 0, happyT: 0, loveT: 0,
      moving: false, mt: 0, home: [0, 0], task: null }, o);
    /* how each kind is drawn: the dog program's kinds and the street cat are critters with a name; the office dog, the bodega cat,
       the pigeon and the parrot are the engine's own four, one each */
    const ONE = { dog: DOG, cat: CAT, pigeon: PIG, loro: LORO };
    const PAINT = { beagle: (g, a) => drawBeagle(g, a, 0, 0), lab: (g, a) => drawLab(g, a, 0, 0), chi: (g, a) => drawChi(g, a, 0, 0), gato: (g, a) => drawGato(g, a, 0, 0),
      colibri: (g, a) => drawColibri(g, a, 0, 0), dog: g => drawDog(g, 0, 0), cat: g => drawCat(g, 0, 0), pigeon: g => drawPigeon(g, 0, 0), loro: g => drawLoro(g, 0, 0) };
    const winged = Object.keys(ALEB_KIND).filter(k => ALEB_KIND[k].wings), ringed = Object.keys(ALEB_KIND).filter(k => ALEB_KIND[k].eye);
    [...new Set([...winged, ...ringed])].filter(k => !PAINT[k]).forEach(k => P.push('NOCHE DE ALEBRIJES: the ' + k + ' has ' + (ALEB_KIND[k].wings ? 'wings' : 'a ring round its eye') + ' and this guard does not know how to draw it, so nothing it wears was asked to go where it goes — teach the guard its painter'));
    /* where he is on the hurdle, from the park's own course, on a real run: the line through the bar, the step onto it and off it */
    const course = typeof agilityCourse === 'function' && PL.park ? agilityCourse(PL.park) : [];
    const hur = course.find(p => GEARROLE[(WORLDS[PL.park].rows[p[1]] || '')[p[0]]] === 'hurdle'), HL = hur ? gearLine(PL.park, hur[0], hur[1]) : null;
    if (!hur) N.push('this pack lays no hurdle, so no dog was asked over one');
    const over = u => { const on = u >= 0, x = hur[0] + (on ? HL[0] : 0), y = hur[1] + (on ? HL[1] : 0);
      return { world: PL.park, task: { type: 'run' }, moving: true, dx: HL[0], dy: HL[1], x, y, mt: on ? u : 1 + u, fx: hur[0] + u * HL[0], fy: hur[1] + u * HL[1] }; };
    const STEP = [0, 1, 2, 3, 4, 5, 6, 7].map(i => i / 8);
    const poses = k => {
      const L = [];
      if (DOGK.has(k)) {
        L.push(['standing', {}], ['sitting', { sit: true }], ['lying down', { layT: LONG }], ['howling', { howlT: LONG }], ['howling lying down', { layT: LONG, howlT: LONG }],
          ['digging', { digT: LONG }], ['happy', { happyT: LONG }]);
        STEP.forEach(m => L.push(['walking (' + m * 8 + '/8 of a step)', { moving: true, mt: m }]));
        if (hur) [0, -0.15, 0.15, -0.3, 0.3].forEach(u => L.push(['over the hurdle (' + (u < 0 ? -u + ' of a tile before' : u ? u + ' of a tile past' : 'at') + ' the bar)', over(u)]));
      } else if (k === 'pigeon') L.push(['standing', {}], ['pecking', { peck: true }], ['lifting off the rail', { hop: 10 }], ['lifted off the rail', { hop: 20 }], ['lifted off the rail, pecking', { hop: 20, peck: true }]);
      else if (k === 'loro' || k === 'colibri') STEP.forEach(m => L.push(['at ' + m * 8 + '/8 of its bob', { clock: m }]));
      else { L.push(['standing', { sit: false }], ['sitting', { sit: true }]); STEP.forEach(m => L.push(['walking (' + m * 8 + '/8 of a step)', { moving: true, mt: m, sit: false }])); }
      return L; };
    const keyOf = (k, nm) => nm || k;
    const TURNS = new Set(Object.keys(ONE).filter(k => 'face' in ONE[k])), FACES = k => (ONE[k] && !TURNS.has(k)) ? [1] : [1, -1];   /* the parrot on its perch is never turned; everything else is asked both ways */
    /* pose one animal: a probe for a critter, the engine's own object for the four */
    const pose = (k, nm, o, face) => { const st = Object.assign({}, o, { face }); delete st.clock;
      ['layT', 'howlT', 'digT', 'happyT'].forEach(f => { if (st[f]) st[f] = T0 + st[f]; });
      if (ONE[k]) { const a = ONE[k]; Object.assign(a, { moving: false, mt: 0, sit: k === 'cat', peck: false, hop: 0 }, st); return a; }
      return probe(k, nm, st); };
    const paint = (k, a) => g => PAINT[k](g, a);
    const alone = (k, nm, a, face) => g => wildDraw(g, alebLookFor(k, nm), k, () => {}, 0, 0, face, a);   /* the alebrije layer over nothing: what it wears, alone */
    const dress = (k, nm, cu) => { const key = keyOf(k, nm); if (cu) alePick.custom[key] = cu; else delete alePick.custom[key]; };
    let WL = -1;
    const sayP = (k, pn, face) => pn[0].toUpperCase() + pn.slice(1) + (face < 0 ? ' and facing left' : '') + ', the ' + KN[k];
    const firsts = {}, tally = (rule, k, msg) => { const id = rule + '|' + k + '|' + msg.replace(/^[^,]*, /, '').replace(/[\d.]+/g, '#'); if (!firsts[id]) firsts[id] = { msg, n: 0 }; firsts[id].n++; };
    const hash = d => { let h = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) h = (Math.imul(h, 31) + d[i] + d[i - 1] * 7 + d[i - 2] * 13 + d[i - 3] * 17 + i) | 0; return h; };
    const alphaAt = (d, x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : d[(y * W + x) * 4 + 3];
    try {
      /* ---- PASS 1, the mode off: where each painter puts the eye, in every pose ---- */
      seasonSet('off');
      const EYE = {}, TOPS = {};
      ringed.filter(k => PAINT[k]).forEach(k => poses(k).forEach(([pn, o]) => FACES(k).forEach(face => {
        const nm = ONE[k] ? null : 'Ala1', a = pose(k, nm, o, face); at(D0 + (o.clock || 0) * 1760, T0);
        const d = shot(paint(k, a)), dark = new Uint8Array(W * H);
        for (let i = 0; i < W * H; i++) { const r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2]; if (d[i * 4 + 3] >= 250 && Math.abs(r - 0x26) < 8 && Math.abs(gg - 0x20) < 8 && Math.abs(b - 0x2B) < 8) dark[i] = 1; }   /* the ink itself, not its soft edge */
        /* the eye is the painter's small dark mark cut square — a filled rectangle no more than 2 px either way (a closed eye
           is a bar 1.9 long); a nose is round and a beak is long, and neither is an eye */
        const seen = new Uint8Array(W * H); let sx = 0, sy = 0, n = 0;
        for (let i = 0; i < W * H; i++) { if (!dark[i] || seen[i]) continue; const st = [i], cells = []; seen[i] = 1;
          while (st.length) { const j = st.pop(); cells.push(j); const x = j % W, y = (j - x) / W;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy, q = yy * W + xx; if (xx >= 0 && yy >= 0 && xx < W && yy < H && dark[q] && !seen[q]) { seen[q] = 1; st.push(q); } } }
          let x0 = W, x1 = 0, y0 = H, y1 = 0; cells.forEach(j => { const x = j % W, y = (j - x) / W; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
          if (x1 - x0 < 2 * SC && y1 - y0 < 2 * SC && cells.length === (x1 - x0 + 1) * (y1 - y0 + 1)) cells.forEach(j => { sx += j % W; sy += Math.floor(j / W); n++; }); }
        EYE[k + '|' + pn + '|' + face] = n ? [sx / n, sy / n] : null; })));
      /* ---- PASS 2, the mode on ---- */
      seasonSet(aid); WL = (alebLooks() || []).findIndex(l => l.wings);
      if (WL < 0) P.push('NOCHE DE ALEBRIJES: none of the alebrije looks has wings, so no wing was asked anything');
      const kinds = [...new Set([...winged, ...ringed])].filter(k => PAINT[k]);
      kinds.forEach(k => poses(k).forEach(([pn, o]) => FACES(k).forEach(face => {
        const nm = ONE[k] ? null : 'Ala1', key = keyOf(k, nm), a = pose(k, nm, o, face), say = sayP(k, pn, face);
        at(D0 + (o.clock || 0) * 1760, T0); alePick.animals[key] = WL >= 0 ? WL : 0;
        if (ALEB_KIND[k].wings && WL >= 0) {
          dress(k, nm, { wings: false }); const S = shot(paint(k, a));
          if (face > 0 && (pn === 'standing' || /at the bar/.test(pn))) { let top = -1; for (let i = 3; i < S.length && top < 0; i += 4) if (S[i] >= 128) top = Math.floor((i >> 2) / W); TOPS[k + '|' + pn] = top; }
          dress(k, nm, null); const V = shot(paint(k, a)), WA = shot(alone(k, nm, a, face));
          dress(k, nm, { pat: '#10F0F0' }); const VP = shot(paint(k, a)); dress(k, nm, null);
          /* THE ROOT IS IN HIS BACK: the lowest point of the wings drawn alone, against the top of his body in that column */
          let yl = -1, xs = []; for (let y = H - 1; y >= 0 && yl < 0; y--) for (let x = 0; x < W; x++) if (WA[(y * W + x) * 4 + 3] >= 128) { yl = y; xs.push(x); }
          if (yl < 0) tally('none', k, say + ' has wings in the look and none drawn');
          else { const xc = xs[Math.floor(xs.length / 2)], inS = y => alphaAt(S, xc, y) >= 128;
            /* the body round that point: the run of him it sits in, or the nearest of him below it (it floats) or above it (it hangs) —
               read down that one column, so a note or a heart over his head is not taken for his back */
            if (inS(yl)) { let yt = yl; while (yt > 0 && inS(yt - 1)) yt--; const dp = (yl - yt) / SC;
              if (dp < 0.75) tally('root', k, say + '\'s wings only touch the edge of his back (' + dp.toFixed(1) + ' px in): a wing goes INTO the shoulder');
              else if (dp > 4) tally('root', k, say + '\'s wings are not on his back: their root is ' + dp.toFixed(1) + ' px below the top of it'); }
            else { let yb = -1, ya = -1; for (let y = yl + 1; y < H; y++) if (inS(y)) { yb = y; break; } for (let y = yl - 1; y >= 0; y--) if (inS(y)) { ya = y; break; }
              if (yb >= 0) tally('root', k, say + '\'s wings float above his back: their root is ' + ((yb - yl) / SC).toFixed(1) + ' px over it, with daylight between');
              else if (ya >= 0) { let yt = ya; while (yt > 0 && inS(yt - 1)) yt--;
                tally('root', k, say + '\'s wings stayed where he was standing: their root is ' + ((yl - yt) / SC).toFixed(1) + ' px below his back, out under him'); }
              else tally('root', k, say + '\'s wings hang where there is no animal at all'); } }
          /* A TINY WING: nothing of the wing you can see rises above the top of his head */
          let yh = -1; for (let y = 0; y < H && yh < 0; y++) for (let x = 0; x < W; x++) if ((face > 0 ? x >= CX : x <= CX) && S[(y * W + x) * 4 + 3] >= 128) { yh = y; break; }
          let yv = -1, vis = 0, rib = 0;
          for (let i = 0; i < W * H; i++) { if (S[i * 4 + 3] >= 64 || V[i * 4 + 3] < 128) continue; vis++; if (yv < 0) yv = Math.floor(i / W);
            if (Math.abs(V[i * 4] - VP[i * 4]) > 40 || Math.abs(V[i * 4 + 1] - VP[i * 4 + 1]) > 40 || Math.abs(V[i * 4 + 2] - VP[i * 4 + 2]) > 40) rib++; }
          if (!vis) tally('seen', k, say + ' wears wings nobody can see: not one pixel of them shows round him');
          else { if (yh >= 0 && yv < yh - 1) tally('tip', k, say + '\'s wings stand ' + ((yh - yv) / SC).toFixed(1) + ' px above the top of his head; a tiny wing keeps his outline');
            /* THE RIBS SHOW: the wing's pattern colour changes what you see of it */
            if (rib < Math.max(2 * SC, vis * 0.08)) tally('ribs', k, say + '\'s wings show no ribs: their pattern colour changes ' + rib + ' of the ' + vis + ' pixels you can see of the wing'); }
        }
        /* THE COLOUR ROUND HIS EYE IS ROUND HIS EYE, where his own painter put it in this pose */
        if (ALEB_KIND[k].eye) {
          const E = EYE[k + '|' + pn + '|' + face];
          if (!E) tally('eye', k, say + ' has no eye this guard could find (the painter\'s small dark marks), so the colour round it was not asked');
          else {
            dress(k, nm, { accent: '#00FF00', pat: '#0000FF', tint: '#FF00FF', wings: false }); const R = shot(paint(k, a)); dress(k, nm, null);
            const acc = (x, y) => { const i = (y * W + x) * 4; return R[i + 3] >= 96 && R[i + 1] > 150 && R[i] < 150 && R[i + 2] < 150; };
            /* eight ways out of his eye: each meets the ring within its width, or leaves him first (the ring is clipped to him
               there); and the ring is round the eye, not beside it — the two ways along any line meet it at the same distance,
               give or take 1.75 px (the chihuahua's one ring goes round both his eyes, and howling his nose touches the near
               one, so only the far eye is found) */
            const lim = (ALEB_KIND[k].eye[2] + 1.6) * SC, D = [];
            for (let r = 0; r < 8; r++) { const t = r * Math.PI / 4, ux = Math.cos(t), uy = Math.sin(t); let res = null;
              for (let s = 1; s <= lim; s += 0.5) { const x = Math.round(E[0] + ux * s), y = Math.round(E[1] + uy * s);
                if (acc(x, y)) { res = s; break; } if (alphaAt(R, x, y) < 64) { res = 'out'; break; } }
              D.push(res); }
            const hits = D.filter(d => typeof d === 'number').length, miss = D.filter(d => d === null).length, onEye = acc(Math.round(E[0]), Math.round(E[1]));
            let off = 0;
            for (let r = 0; r < 4; r++) { const a1 = D[r], a2 = D[r + 4]; if (typeof a1 !== 'number' || typeof a2 !== 'number') continue;
              const d = (a2 - a1) / 2 / SC; if (Math.abs(d) > Math.abs(off)) off = d; }
            if (miss || hits < 4 || onEye || Math.abs(off) > 1.75) {
              /* the words only, never the verdict: which way the colour went, from the middle of what it painted near his eye */
              let mx = 0, my = 0, mn = 0; const rr = (ALEB_KIND[k].eye[2] + 2.5) * SC;
              for (let y = Math.max(0, Math.floor(E[1] - rr)); y < Math.min(H, E[1] + rr); y++) for (let x = Math.max(0, Math.floor(E[0] - rr)); x < Math.min(W, E[0] + rr); x++)
                if (Math.hypot(x - E[0], y - E[1]) <= rr && acc(x, y)) { mx += x; my += y; mn++; }
              const cx_ = mn ? (mx / mn - E[0]) * face : 0, cy_ = mn ? my / mn - E[1] : 0;
              let where = !hits ? 'nowhere near it: there is none round his eye at all'
                : Math.abs(cy_) >= Math.abs(cx_) ? (cy_ < 0 ? 'above it, on his brow' : 'below it, on his muzzle')
                : (cx_ > 0 ? 'in front of it, toward his nose' : 'behind it');
              if (hits && onEye) where += ', and its line runs across his eye';
              tally('eye', k, say + '\'s colour round his eye sat ' + where); } }
        }
      })));
      /* nothing to measure is not a pass: at the bar he must really be in the air, or the hurdle asked nothing */
      if (hur) winged.filter(k => DOGK.has(k)).forEach(k => { const t0 = TOPS[k + '|standing'], t1 = TOPS[k + '|over the hurdle (at the bar)'];
        if (!(t0 >= 0 && t1 >= 0 && t0 - t1 >= 8 * SC)) P.push('NOCHE DE ALEBRIJES: at the hurdle\'s bar the ' + KN[k] + ' was not in the air (' + (t0 >= 0 && t1 >= 0 ? ((t0 - t1) / SC).toFixed(1) + ' px up' : 'not drawn') + '), so nothing he wears was asked to go over it'); });
      /* INSIDE THE TUNNEL NOTHING OF HIM SHOWS, and that includes what he wears */
      const tun = course.find(p => GEARROLE[(WORLDS[PL.park].rows[p[1]] || '')[p[0]]] === 'tunnel');
      if (tun) winged.filter(k => DOGK.has(k) && WL >= 0).forEach(k => [1, -1].forEach(face => { at(D0, T0); alePick.animals.Ala1 = WL;
        const a = probe(k, 'Ala1', { world: PL.park, x: tun[0], y: tun[1], fx: tun[0], fy: tun[1], face }), d = shot(paint(k, a)); let n = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] >= 32) n++;
        if (n) tally('tunnel', k, 'Inside the agility tunnel' + (face < 0 ? ' and facing left' : '') + ', the ' + KN[k] + ' is hidden and his wings are not: ' + n + ' pixels of wing show where the tube should hide him'); }));
      else N.push('this pack lays no agility tunnel, so no dog was asked to hide his wings in one');
      /* THE WINGS BEAT WITH HIS STEP: at rest they lie still whatever the clock says; walking, they beat; two walking side by side do not beat as one */
      winged.filter(k => PAINT[k] && WL >= 0).forEach(k => {
        const nm = ONE[k] ? null : 'Ala1', key = keyOf(k, nm); alePick.animals[key] = WL;
        const rest = (DOGK.has(k) ? [['lying down', { layT: LONG }]] : []).concat([['standing', { sit: false }], ['sitting', { sit: true }]]).concat([['walking (2/8 of a step)', { moving: true, mt: 0.25, sit: false }]]);
        rest.forEach(([pn, o]) => { const pics = new Set();
          for (let i = 0; i < 8; i++) { at(D0 + i * 37, T0 + i * 37); pics.add(hash(shot(alone(k, nm, pose(k, nm, o, 1), 1)))); }
          if (pics.size > 1) tally('clock', k, sayP(k, pn, 1) + '\'s wings move with the clock: over a third of a second he does not move and they make ' + pics.size + ' different pictures' + (pn === 'lying down' ? ' — asleep, they beat' : '')); });
        at(D0, T0);
        const beat = nm2 => STEP.map(m => hash(shot(alone(k, nm2, pose(k, nm2, { moving: true, mt: m, sit: false }, 1), 1))));
        const b1 = beat(nm);
        if (new Set(b1).size < 2) tally('beat', k, 'Walking, the ' + KN[k] + '\'s wings never beat: over a whole step they are one picture');
        else if (!ONE[k]) { ['Ala2', 'Ala3'].forEach(n2 => { alePick.animals[n2] = WL; });
          const b2 = beat('Ala2'), b3 = beat('Ala3');
          if (b1.join() === b2.join() && b1.join() === b3.join()) tally('beat', k, 'Three ' + KN[k] + 's walking in step beat their wings as one, every frame of the step'); }
      });
    } catch (e) { P.push('NOCHE DE ALEBRIJES: asking what an animal wears to go where he goes threw: ' + (e && e.message)); }
    finally {
      Date.now = DN; performance.now = PN; ctx = ctx0; held.forEach(([o, s]) => { Object.keys(o).forEach(f => { if (!(f in s)) delete o[f]; }); Object.assign(o, s); });
      alePick = JSON.parse(ale0); seasonSet(pick0);
    }
    Object.values(firsts).forEach(f => P.push('NOCHE DE ALEBRIJES: ' + f.msg + (f.n > 1 ? ' (and in ' + (f.n - 1) + ' more pose' + (f.n > 2 ? 's' : '') + ' of the same kind)' : '')));
    if (!P.length) N.push('every winged kind (' + winged.map(k => KN[k] || k).join(', ') + ') in every pose, facing both ways, at every eighth of its step and over the hurdle: the wings root in the back, never rise above the head, show their ribs, lie still at rest whatever the clock says and beat with the step, each dog on his own beat; and the colour round the eye sits on the eye of ' + ringed.map(k => KN[k] || k).join(', '));
    return { P, N };
    });
  fails.push(...wingsRide.P); wingsRide.N.forEach(n => console.log('  ALEBRIJE WINGS: ' + n));

  // ---- #283: a pup adopted while the alebrije mode is on is in Settings → Alebrijes the next time Settings opens ----
  // Found 2026-10-01: the Alebrijes list was built when the game opened and rebuilt only when the mode, the language,
  // a look or a name changed — so with the mode already on, a pup adopted at the park was not in the list until the
  // game was reloaded. Every check before this one adopted first and turned the mode on after, which rebuilt the list
  // and hid the gap. This one does it in the order a player does: the mode on from Settings → Picture; Settings
  // opened once; a pup adopted at the park's post; Settings opened again by the gear — she must be listed — and a
  // SECOND pup adopted the same way and Settings opened a third time, so a list refreshed only once is caught too.
  // Then she is chosen in the list and given a look there, and she must be drawn in it. A fresh browser of its own:
  // it leans on nothing above, leaves nothing behind.
  {
    const ctx = await browser.newContext();
    const p = await ctx.newPage({ viewport: { width: 480, height: 900 } });
    p.setDefaultTimeout(6000);
    const errs = [], nl = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.route('**', r => r.request().url().startsWith('file://') ? r.continue() : r.abort());
    const helpers = () => {
      const dogOf = nm => CRIT.find(c => c.name === nm && DOGK.has(c.kind));
      window.__pupList = {
        // beside the park's post, every dog there held on her own spot so none stands where the player would
        post: () => { const w = WORLDS[PL.park]; world = PL.park; setWorldTag(); moving = false;
          CRIT.filter(c => DOGK.has(c.kind) && c.world === PL.park).forEach(c => { if (c.home) { c.x = c.home[0]; c.y = c.home[1]; } c.stayT = performance.now() + 1e9; c.task = null; c.follow = false; c.fx = c.x; c.fy = c.y; c.moving = false; });
          for (let y = 1; y < w.H - 1; y++) for (let x = 1; x < w.W - 1; x++)
            if (!SOLID.has(w.grid[y][x]) && w.grid[y][x] !== 'N' && !CRIT.some(c => c.world === PL.park && c.x === x && c.y === y)
              && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => w.grid[y + dy][x + dx] === '9')) { px = fx = x; py = fy = y; return true; }
          return false; },
        adopted: nm => !!dogOf(nm),
        /* what Settings → Alebrijes offers, as a player reads it: the drawer, and the names in its list */
        menu: () => { const d = $('drwSelf'), sel = $('aleWho');
          if (!d || d.hidden || !sel || $('aleRow').hidden) return null;
          return [...sel.options].map(o => ({ v: o.value, t: o.textContent })); },
        looks: () => [...$('aleRow').querySelectorAll('button[data-look]')].map(b => ({ id: b.dataset.look, on: b.getAttribute('aria-pressed') === 'true' })),
        wears: nm => { const d = dogOf(nm), lk = d && alebLookFor(d.kind, d.name); return lk ? lk.id : null; },
        /* the drawing every camera paints a dog with, the clock and the pose held still */
        draw: nm => { const d = dogOf(nm); if (!d) return null;
          const fn = { beagle: drawBeagle, lab: drawLab, chi: drawChi }[d.kind]; if (!fn) return null;
          const P = ['face', 'sit', 'layT', 'howlT', 'digT', 'happyT', 'loveT', 'moving'], keep = P.map(k => d[k]), now0 = Date.now;
          Object.assign(d, { face: 1, sit: false, layT: 0, howlT: 0, digT: 0, happyT: 0, loveT: 0, moving: false }); Date.now = () => 1700000000000;
          try { const c = document.createElement('canvas'); c.width = c.height = 44; const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 6, 12); fn(g, d, 0, 0);
            return Array.from(g.getImageData(0, 0, 44, 44).data); }
          finally { Date.now = now0; P.forEach((k, i) => { d[k] = keep[i]; }); } },
      }; };
    const call = (fn, ...a) => p.evaluate(([fn, a]) => __pupList[fn](...a), [fn, a]);
    const diff = (a, b) => { if (!a || !b || a.length !== b.length) return -1; let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) n++; return n; };
    // Settings, opened the way a player opens it — the gear — and the drawer that holds the list opened if it is shut
    const openSettings = async () => { await p.click('#gear'); const m = await call('menu');
      if (m && !await p.evaluate(() => $('drwSelf').open)) await p.click('#drwSelf summary');
      return m; };
    const says = m => m ? m.map(o => o.t).join(', ') : 'no Alebrijes menu at all';
    const adopt = async nm => { if (!await call('post')) throw new Error('there is nowhere to stand beside the park\'s post');
      await p.waitForSelector('#adopt:not([hidden])'); await p.click('#adopt'); await p.fill('#adoptName', nm); await p.click('#adoptGo'); await p.waitForTimeout(150);
      if (!await call('adopted', nm)) throw new Error(`${nm} could not be adopted at the park's post`); };
    try {
      await p.goto(index); await p.waitForTimeout(900);
      await p.click('.classes button[data-c="architect"]'); await p.click('#begin'); await p.waitForTimeout(500);
      await p.evaluate(helpers);
      const aid = await p.evaluate(() => { const a = Object.entries(SEASONS).find(([k, v]) => v.art && v.art.alebrije); return a && a[0]; });
      if (!aid) nl.push('no season hands out alebrije looks — there is no Alebrijes list to be missing from, so nothing was measured, which is not a pass');
      else {
        // the mode on, from Settings → Picture, by the button the season row builds from content
        await p.click('#gear'); if (!await p.evaluate(() => $('drwLook').open)) await p.click('#drwLook summary');
        await p.click(`#seasonRow button[data-sn="${aid}"]`); await p.click('#closeSet');
        // Settings opened once with the mode on, before anybody is adopted: the list is there, and neither pup is in it
        const PUPS = ['Nube', 'Oso'], m0 = await openSettings(); await p.click('#closeSet');
        if (!m0) nl.push('with the alebrije mode on, Settings has no Alebrijes list at all — nothing was measured');
        else if (!m0.some(o => o.v !== 'you')) nl.push(`with the alebrije mode on, Settings → Alebrijes lists ${says(m0)} and no animal at all — there is nobody a new pup could join, so nothing was measured`);
        else if (m0.some(o => PUPS.includes(o.v))) nl.push(`Settings → Alebrijes already lists ${says(m0)} before anybody was adopted — the check cannot tell a new pup from an old name`);
        else {
          for (const nm of PUPS) {
            await adopt(nm);
            const m = await openSettings();
            if (!m || !m.some(o => o.v === nm)) nl.push(`with the alebrije mode on, ${nm} was adopted at the park, and the next time Settings opened, Alebrijes did not list her (it lists ${says(m)}) — a player cannot choose her a look until the game is reloaded`);
            await p.click('#closeSet'); }
          // and the entry is HER: chosen in the list, given a look that is not her own there, she is drawn in it
          if (!nl.length) {
            const nm = PUPS[PUPS.length - 1], bare = await call('draw', nm), own = await call('wears', nm);
            await openSettings(); await p.selectOption('#aleWho', nm);
            const L = await call('looks'), pick = (L.find(l => l.id !== own) || {}).id;
            if (!pick) nl.push(`Settings → Alebrijes offers ${nm} no look other than her own — nothing was measured`);
            else { await p.click(`#aleRow button[data-look="${pick}"]`); await p.click('#closeSet');
              const now = await call('wears', nm), dp = diff(bare, await call('draw', nm));
              if (now !== pick) nl.push(`${nm} was given the look ${pick} in Settings → Alebrijes, and she wears ${now}`);
              else if (dp < 1) nl.push(`${nm} was given the look ${pick} in Settings → Alebrijes, and she is drawn exactly as before (${dp < 0 ? 'there is no drawing to compare' : 'no pixel changed'})`); }
          }
          if (!nl.length) console.log(`  NEW PUP, SETTINGS: with the alebrije mode on, ${PUPS.join(' and then ')} were adopted at the park, each was in Settings → Alebrijes the next time the gear opened it, and the look chosen for her there is the one she is drawn in`);
        }
      }
    } catch (e) { nl.push('the check could not drive the game to the end, so it measured nothing: ' + String(e.message || e).split('\n')[0]); }
    if (errs.length) nl.push('the page errored: ' + errs.join(' | '));
    fails.push(...nl.map(s => '#283 a new pup in Settings: ' + s));
    await ctx.close();
  }

  // ---- #277: rename a dog, close the game, open it again — everything about her but her name is the same ----
  // Found 2026-09-30: a rename carried the bandana and the training to the new name by hand, from a list, and the
  // list did not have the alebrije look, which is kept by name too — so she went back to whatever her new name
  // gives, in Settings, on the street and after a reload. The rename's older check (grep `migrates its records`)
  // reads the same two tables the rename carries, so it could never see a third. This one does not ask the rename's
  // list: it records what a player can see about each dog AND everything the game has stored under her name in any
  // table, renames her, reloads, and requires all of it back under the new name, and nothing still kept under the
  // old one. Three dogs: one with a look chosen, a bandana and some training; one nobody chose anything for (her
  // look came from her name); one wearing a custom look — the seam a later editor writes; nothing in play writes it
  // yet, so it is put there by hand. The rest is done the way a player does it: adopted at the park's post, the look
  // picked in Settings → Alebrijes, the bandana and the Sit from the buttons beside her, the rename from the paw
  // menu, the game closed and continued. A fresh browser of its own: it leans on nothing above, leaves nothing behind.
  {
    const ctx = await browser.newContext();
    const p = await ctx.newPage({ viewport: { width: 480, height: 900 } });
    p.setDefaultTimeout(6000);
    const errs = [], rn = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.route('**', r => r.request().url().startsWith('file://') ? r.continue() : r.abort());
    const helpers = () => {
      const dogOf = nm => CRIT.find(c => c.name === nm && DOGK.has(c.kind));
      const free = (w, x, y) => x >= 0 && y >= 0 && x < w.W && y < w.H && !SOLID.has(w.grid[y][x]) && w.grid[y][x] !== 'N';
      // every dog here back on her own spot and told to stay (they wander, and a wander must not decide what is measured);
      // then the first tile beside what we came for, and any other dog within reach of it walked a few tiles off — so the
      // buttons and the paw menu mean the one we mean (the park's own spots ring its post, so three dogs at home fence it)
      const hold = wid => { const here = CRIT.filter(c => DOGK.has(c.kind) && c.world === wid);
        here.forEach(c => { if (c.home) { c.x = c.home[0]; c.y = c.home[1]; } c.stayT = performance.now() + 1e9; c.task = null; c.follow = false; c.fx = c.x; c.fy = c.y; c.moving = false; }); return here; };
      const dist = (c, x, y) => Math.abs(c.x - x) + Math.abs(c.y - y);
      const standBy = (wid, near, alone) => { const w = WORLDS[wid], here = hold(wid); world = wid; setWorldTag(); moving = false;
        let at = null; for (let y = 0; y < w.H && !at; y++) for (let x = 0; x < w.W && !at; x++) if (free(w, x, y) && near(x, y) && !here.some(c => dist(c, x, y) === 0)) at = [x, y];
        if (!at) return false;
        for (const c of here) { if (c === alone || dist(c, at[0], at[1]) > 1) continue; let to = null;
          for (let y = 0; y < w.H && !to; y++) for (let x = 0; x < w.W && !to; x++) if (free(w, x, y) && Math.abs(x - at[0]) + Math.abs(y - at[1]) >= 3 && here.every(o => o === c || dist(o, x, y) >= 2)) to = [x, y];
          if (!to) return false; c.x = c.fx = to[0]; c.y = c.fy = to[1]; }
        px = fx = at[0]; py = fy = at[1]; return true; };
      window.__renLook = {
        beside: nm => { const d = dogOf(nm); return !!d && standBy(d.world, (x, y) => Math.abs(d.x - x) + Math.abs(d.y - y) === 1, d); },
        post: () => { const w = WORLDS[PL.park]; return standBy(PL.park, (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (w.grid[y + dy] || [])[x + dx] === '9'), null); },
        /* the tail wags with the clock and the pose changes by the second: both held still, so two drawings differ only by how she is dressed */
        draw: nm => { const d = dogOf(nm); if (!d) return null;
          const fn = { beagle: drawBeagle, lab: drawLab, chi: drawChi }[d.kind]; if (!fn) return null;
          const P = ['face', 'sit', 'layT', 'howlT', 'digT', 'happyT', 'loveT', 'moving'], keep = P.map(k => d[k]), now0 = Date.now;
          Object.assign(d, { face: 1, sit: false, layT: 0, howlT: 0, digT: 0, happyT: 0, loveT: 0, moving: false }); Date.now = () => 1700000000000;
          try { const c = document.createElement('canvas'); c.width = c.height = 44; const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 6, 12); fn(g, d, 0, 0);
            return Array.from(g.getImageData(0, 0, 44, 44).data); }
          finally { Date.now = now0; P.forEach((k, i) => { d[k] = keep[i]; }); } },
        /* everything the game has stored under this name, in every table it keeps: a key that is the name, or a value that is */
        stored: nm => { const out = {};
          const walk = (v, at) => { if (v === nm) out[at] = '{name}';
            else if (v && typeof v === 'object') Object.keys(v).forEach(k => { const kp = at + '.' + (k === nm ? '{name}' : k); if (k === nm) out[kp] = JSON.stringify(v[k]); walk(v[k], kp); }); };
          for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); let v; try { v = JSON.parse(localStorage.getItem(key)); } catch (e) { continue; } walk(v, key); }
          return out; },
        /* what a player can see about her, and what the game keeps for her */
        snap: nm => { const d = dogOf(nm); if (!d) return null; const r = dogRecord(d), lk = alebLookFor(d.kind, d.name);
          return { kind: d.kind, coat: d.c, look: lk ? lk.id : null, band: d.band || null, train: JSON.stringify(parkPrefs.train[d.name] || null),
            friend: JSON.stringify(r ? r.friend : null), home: JSON.stringify(r ? { rehomed: !!r.rehomed, x: r.x, y: r.y } : null),
            px: __renLook.draw(nm), stored: __renLook.stored(nm) }; },
        listed: nm => { const sel = $('aleWho'); if (!sel || $('aleRow').hidden) return 'Settings has no Alebrijes menu';
          const opts = [...sel.options].map(o => o.value);
          return opts.includes(nm) ? '' : `Settings → Alebrijes does not list ${nm} (it lists ${opts.join(', ')})`; },
        pressed: () => [...$('aleRow').querySelectorAll('button[aria-pressed="true"]')].map(b => b.dataset.look),
      }; };
    const call = (fn, ...a) => p.evaluate(([fn, a]) => __renLook[fn](...a), [fn, a]);
    const diff = (a, b) => { if (!a || !b || a.length !== b.length) return -1; let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) n++; return n; };
    const drawer = async id => { await p.click('#gear'); if (!await p.evaluate(id => $(id).open, id)) await p.click(`#${id} summary`); };
    const selfDrawer = () => drawer('drwSelf');
    // what Settings → Alebrijes says this dog wears: the one look pressed once her name is chosen
    const menuSays = async nm => { await selfDrawer(); const none = await call('listed', nm); let look = null;
      if (!none) { await p.selectOption('#aleWho', nm); const pr = await call('pressed'); look = pr.length === 1 ? pr[0] : 'pressed: ' + (pr.join('+') || 'none'); }
      await p.click('#closeSet'); return { none, look }; };
    const adopt = async nm => { if (!await call('post')) return false;
      await p.waitForSelector('#adopt:not([hidden])'); await p.click('#adopt'); await p.fill('#adoptName', nm); await p.click('#adoptGo'); await p.waitForTimeout(150);
      return p.evaluate(nm => CRIT.some(c => c.name === nm && DOGK.has(c.kind)), nm); };
    const rename = async (old, nw) => { if (!await call('beside', old)) return false; await p.waitForTimeout(120);
      await p.click('#cmd'); await p.click('#cmdRen'); await p.fill('#renName', nw); await p.click('#renGo'); await p.waitForTimeout(150);
      return p.evaluate(([old, nw]) => CRIT.some(c => c.name === nw) && !CRIT.some(c => c.name === old), [old, nw]); };
    // everything but her name the same: what a player sees, and everything the game kept under her name
    const same = (a, b, at) => {
      if (!b) return [`${at}: she is not in the game at all`];
      const out = [], dp = diff(a.px, b.px);
      if (b.kind !== a.kind || b.coat !== a.coat) out.push(`${at}: she is a different dog — was a ${a.kind} in ${a.coat}, now a ${b.kind} in ${b.coat}`);
      if (b.look !== a.look) out.push(`${at}: she wears another alebrije look — was ${a.look}, now ${b.look}`);
      if (dp !== 0) out.push(`${at}: she is drawn differently — ${dp < 0 ? 'there is no drawing to compare' : dp + ' of 1936 pixels changed'}`);
      if (b.band !== a.band) out.push(`${at}: her bandana changed — was ${a.band || 'none'}, now ${b.band || 'none'}`);
      if (b.train !== a.train) out.push(`${at}: her training changed — was ${a.train}, now ${b.train}`);
      if (b.friend !== a.friend) out.push(`${at}: her friend in the city changed — was ${a.friend}, now ${b.friend}`);
      if (b.home !== a.home) out.push(`${at}: her home changed — was ${a.home}, now ${b.home}`);
      const lost = Object.keys(a.stored).filter(k => b.stored[k] !== a.stored[k]);
      if (lost.length) out.push(`${at}: not everything the game kept under her name came with her — ${lost.map(k => `${k} was ${a.stored[k]}, now ${b.stored[k] === undefined ? 'gone' : b.stored[k]}`).join('; ')}`);
      return out; };
    // a TABLE still keyed by the old name is left behind; a value that remembers the old name on purpose is not
    const orphans = async (old, at) => { const k = Object.keys(await call('stored', old)).filter(s => s.endsWith('.{name}'));
      return k.length ? [`${at}: the game still keeps something under her old name — ${k.map(s => s.replace(/\{name\}/g, old)).join(', ')}`] : []; };
    try {
      await p.goto(index); await p.waitForTimeout(900);
      await p.click('.classes button[data-c="architect"]'); await p.click('#begin'); await p.waitForTimeout(500);
      await p.evaluate(helpers);
      // the flat camera, from Settings → Picture: it draws at three times the 3D frame rate here, and the drawing measured
      // below is the one every camera paints with
      await drawer('drwLook'); await p.click('#camRow button[data-cam="top"]'); await p.click('#closeSet');
      const aid = await p.evaluate(() => { const a = Object.entries(SEASONS).find(([k, v]) => v.art && v.art.alebrije); return a && a[0]; });
      const D = [{ old: 'Canela', is: 'her look chosen, a bandana, training' }, { old: 'Pinto', is: 'nothing chosen for her' }, { old: 'Rayo', is: 'a custom look' }];
      if (!aid) rn.push('no season hands out alebrije looks — nothing was measured, which is not a pass');
      else {
        for (const d of D) if (!await adopt(d.old)) throw new Error(`${d.old} could not be adopted at the park's post`);
        // then the alebrije mode, from Settings → Picture, by the button the season row builds from content
        await drawer('drwLook'); await p.click(`#seasonRow button[data-sn="${aid}"]`); await p.click('#closeSet');
        // each new name's own look must differ from the old name's, and Canela's chosen look from both — or a kept look and a lost one are the same picture
        const plan = await p.evaluate(D => { const L = alebLooks(); if (!L) return null;
          const used = new Set(CRIT.map(c => String(c.name || '').toLowerCase())), cand = ['Miel', 'Nube', 'Luna', 'Toby', 'Kiko', 'Rex', 'Sol', 'Nieve', 'Coco', 'Lola', 'Chispa', 'Duque'];
          return D.map(d => { const dog = CRIT.find(c => c.name === d.old && DOGK.has(c.kind)); if (!dog) return null;
            const mine = alebLookFor(dog.kind, d.old).id, nw = cand.find(n => !used.has(n.toLowerCase()) && alePick.animals[n] === undefined && alebLookFor(dog.kind, n).id !== mine);
            if (!nw) return { mine }; used.add(nw.toLowerCase()); const theirs = alebLookFor(dog.kind, nw).id;
            return { mine, nw, pick: L.map(l => l.id).find(id => id !== mine && id !== theirs) }; }); }, D);
        if (!plan || plan.some(x => !x || !x.nw || !x.pick)) rn.push('the check cannot tell a kept look from a lost one — the mode is off, a pup is missing, or no new name gives a different look: ' + JSON.stringify(plan));
        else {
          D.forEach((d, i) => Object.assign(d, plan[i]));
          const [A, B, C] = D, bareA = await call('draw', A.old);
          // Canela: the look picked in Settings, the bandana from the button beside her, a Sit that lands (the dice held for one click)
          await selfDrawer(); await p.selectOption('#aleWho', A.old); await p.click(`#aleRow button[data-look="${A.pick}"]`); await p.click('#closeSet');
          if (!await call('beside', A.old)) throw new Error(`there is nowhere to stand beside ${A.old} alone`);
          await p.waitForSelector('#band:not([hidden])'); await p.click('#band');
          await p.evaluate(() => { window.__mr = Math.random; Math.random = () => 0.01; });
          try { await p.click('#cmd'); await p.click('#cmdSit'); } finally { await p.evaluate(() => { Math.random = window.__mr; }); }
          // Rayo: a custom look laid over her own, the way a later editor would
          const bareC = await call('draw', C.old);
          await p.evaluate(nm => { alePick.custom[nm] = { tint: '#0B6E4F', pat: '#F2E94E' }; alePersist(); }, C.old);
          for (const d of D) d.s0 = await call('snap', d.old);
          if (!A.s0.band || A.s0.train === 'null' || A.s0.look !== A.pick || diff(bareA, A.s0.px) < 1) rn.push(`${A.old} did not get her bandana, her Sit or her look (${A.s0.band}, ${A.s0.train}, ${A.s0.look}) — the check cannot say whether they come with her`);
          else if (diff(bareC, C.s0.px) < 1) rn.push(`the custom look changed nothing about how ${C.old} is drawn — nothing to measure`);
          else {
            for (const d of D) {
              if (!await rename(d.old, d.nw)) { rn.push(`the paw menu did not rename ${d.old} to ${d.nw} — nothing was measured`); continue; }
              const at = `renamed ${d.old} → ${d.nw} (${d.is})`;
              rn.push(...same(d.s0, await call('snap', d.nw), at), ...await orphans(d.old, at)); }
            const said = await menuSays(A.nw);
            if (said.none) rn.push(`renamed ${A.old} → ${A.nw}, and ${said.none}`);
            else if (said.look !== A.pick) rn.push(`renamed ${A.old} → ${A.nw}, and Settings → Alebrijes says she wears ${said.look}; she was picked ${A.pick}`);
            // the next time the game is opened
            await p.reload(); await p.waitForTimeout(900); await p.click('#continueBtn'); await p.waitForTimeout(500); await p.evaluate(helpers);
            if (!await p.evaluate(() => !!alebLooks())) rn.push('after a reload the alebrije mode is off, so nothing about the looks could be measured');
            else {
              for (const d of D) { const at = `renamed ${d.old} → ${d.nw} (${d.is}), then a reload`;
                rn.push(...same(d.s0, await call('snap', d.nw), at), ...await orphans(d.old, at)); }
              const said2 = await menuSays(A.nw);
              if (said2.none) rn.push(`after a reload, ${said2.none}`);
              else if (said2.look !== A.pick) rn.push(`after a reload, Settings → Alebrijes says ${A.nw} wears ${said2.look}; she was picked ${A.pick}`);
              // the look went WITH her: a new pup given her old name is drawn as the first one was before anybody chose her anything
              if (!await adopt(A.old)) rn.push(`after the rename, a new pup could not be named ${A.old} — nothing was measured`);
              else { const d3 = diff(bareA, await call('draw', A.old));
                if (d3 !== 0) rn.push(`a new pup named ${A.old} is not drawn as the first ${A.old} was before anything was chosen for her (${d3} pixels differ) — something stayed with the name instead of going with the dog`); }
            }
          }
        }
      }
    } catch (e) { rn.push('the check could not drive the game to the end, so it measured nothing: ' + String(e.message || e).split('\n')[0]); }
    if (errs.length) rn.push('the page errored: ' + errs.join(' | '));
    if (!rn.length) console.log('  RENAME, RELOAD, COMPARE: three dogs renamed (a chosen look, a bandana and training · nothing chosen · a custom look) — after a reload everything but the name came back, and nothing stayed under an old name');
    fails.push(...rn.map(s => '#277 rename, reload, compare: ' + s));
    await ctx.close();
  }

  // ---- #281: a bandana given at the park comes back after a reload on every breed, not only the beagle ----
  // Found 2026-10-01: the bandana is kept by the dog's name in the park record, and the line that puts it back when the
  // game opens asked whether the dog was a BEAGLE — so a lab or a chihuahua wore it until the game was closed and came
  // back bare, while the record still held it. Every check that reloaded a bandana before this one adopted with the
  // card's default breed, which is the beagle, so none could see it. This one adopts one pup of EVERY breed the
  // adoption card offers (read off the card, so a breed added later is in it), the way a player does: the card at the
  // park's post, the breed button, a name; then the bandana from the button beside each pup; then the game closed and
  // continued. Each pup must wear the bandana she wore when the game was closed, in the record AND in the drawing every
  // camera paints with. A fresh browser of its own: it leans on nothing above, leaves nothing behind.
  {
    const ctx = await browser.newContext();
    const p = await ctx.newPage({ viewport: { width: 480, height: 900 } });
    p.setDefaultTimeout(6000);
    const errs = [], bd = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.route('**', r => r.request().url().startsWith('file://') ? r.continue() : r.abort());
    const helpers = () => {
      const dogOf = nm => CRIT.find(c => c.name === nm && DOGK.has(c.kind));
      const free = (w, x, y) => x >= 0 && y >= 0 && x < w.W && y < w.H && !SOLID.has(w.grid[y][x]) && w.grid[y][x] !== 'N';
      const dist = (c, x, y) => Math.abs(c.x - x) + Math.abs(c.y - y);
      // every dog here on her own spot and told to stay (a wander must not decide which dog the button means); then the
      // first free tile beside what we came for, and any other dog within reach of it walked a few tiles off
      const standBy = (wid, near, alone) => { const w = WORLDS[wid]; world = wid; setWorldTag(); moving = false;
        const here = CRIT.filter(c => DOGK.has(c.kind) && c.world === wid);
        here.forEach(c => { if (c.home) { c.x = c.home[0]; c.y = c.home[1]; } c.stayT = performance.now() + 1e9; c.task = null; c.follow = false; c.fx = c.x; c.fy = c.y; c.moving = false; });
        let at = null; for (let y = 0; y < w.H && !at; y++) for (let x = 0; x < w.W && !at; x++) if (free(w, x, y) && near(x, y) && !here.some(c => dist(c, x, y) === 0)) at = [x, y];
        if (!at) return false;
        for (const c of here) { if (c === alone || dist(c, at[0], at[1]) > 1) continue; let to = null;
          for (let y = 0; y < w.H && !to; y++) for (let x = 0; x < w.W && !to; x++) if (free(w, x, y) && dist({ x, y }, at[0], at[1]) >= 3 && here.every(o => o === c || dist(o, x, y) >= 2)) to = [x, y];
          if (!to) return false; c.x = c.fx = to[0]; c.y = c.fy = to[1]; }
        px = fx = at[0]; py = fy = at[1]; return true; };
      window.__band = {
        breeds: () => [...document.querySelectorAll('#adoptBreeds button')].map(b => b.dataset.b),
        post: () => { const w = WORLDS[PL.park]; return standBy(PL.park, (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (w.grid[y + dy] || [])[x + dx] === '9'), null); },
        beside: nm => { const d = dogOf(nm); return !!d && standBy(d.world, (x, y) => dist(d, x, y) === 1, d); },
        kind: nm => { const d = dogOf(nm); return d ? d.kind : null; },
        band: nm => { const d = dogOf(nm); return d ? d.band || null : undefined; },
        kept: nm => { try { return (JSON.parse(localStorage.getItem(SK('park')) || '{}').band || {})[nm] || null; } catch (e) { return null; } },
        /* the drawing every camera paints a dog with; the tail wags with the clock and the pose changes by the second,
           both held still, so two drawings differ only by what she wears */
        draw: nm => { const d = dogOf(nm); if (!d) return null;
          const fn = { beagle: drawBeagle, lab: drawLab, chi: drawChi }[d.kind]; if (!fn) return null;
          const P = ['face', 'sit', 'layT', 'howlT', 'digT', 'happyT', 'loveT', 'moving'], keep = P.map(k => d[k]), now0 = Date.now;
          Object.assign(d, { face: 1, sit: false, layT: 0, howlT: 0, digT: 0, happyT: 0, loveT: 0, moving: false }); Date.now = () => 1700000000000;
          try { const c = document.createElement('canvas'); c.width = c.height = 44; const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 6, 12); fn(g, d, 0, 0);
            return Array.from(g.getImageData(0, 0, 44, 44).data); }
          finally { Date.now = now0; P.forEach((k, i) => { d[k] = keep[i]; }); } },
      }; };
    const call = (fn, ...a) => p.evaluate(([fn, a]) => __band[fn](...a), [fn, a]);
    const diff = (a, b) => { if (!a || !b || a.length !== b.length) return -1; let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) n++; return n; };
    const NAMES = ['Nube', 'Oso', 'Kiko', 'Lunares', 'Pelusa', 'Tamal'];
    try {
      await p.goto(index); await p.waitForTimeout(900);
      await p.click('.classes button[data-c="architect"]'); await p.click('#begin'); await p.waitForTimeout(500);
      await p.evaluate(helpers);
      const breeds = await call('breeds');
      if (!breeds.some(b => b !== 'beagle')) bd.push(`the adoption card offers ${breeds.join(', ') || 'no breed at all'} — there is no other breed to give a bandana to, so nothing was measured, which is not a pass`);
      else {
        const pups = breeds.map((b, i) => ({ breed: b, nm: NAMES[i] }));
        // adopted the way a player does: stand at the post, open the card, choose the breed, give a name
        for (const d of pups) {
          if (!await call('post')) throw new Error('there is nowhere to stand beside the park\'s post');
          await p.waitForSelector('#adopt:not([hidden])'); await p.click('#adopt');
          await p.click(`#adoptBreeds button[data-b="${d.breed}"]`); d.is = d.nm + ' the ' + (await p.textContent(`#adoptBreeds button[data-b="${d.breed}"]`)).replace(/[^\p{L} ]/gu, '').trim();
          await p.fill('#adoptName', d.nm); await p.click('#adoptGo'); await p.waitForTimeout(150);
          if (await call('kind', d.nm) !== d.breed) throw new Error(`the card did not give a ${d.breed} named ${d.nm} (got ${await call('kind', d.nm)})`); }
        // a bandana each, from the button beside her
        for (const d of pups) {
          d.bare = await call('draw', d.nm);
          if (!await call('beside', d.nm)) throw new Error(`there is nowhere to stand beside ${d.nm} alone`);
          await p.waitForSelector('#band:not([hidden])'); await p.click('#band'); await p.waitForTimeout(80);
          d.band = await call('band', d.nm); d.px = await call('draw', d.nm); }
        for (const d of pups) {
          if (!d.band) bd.push(`the bandana button did not put a bandana on ${d.is} — nothing was measured for her`);
          else if (await call('kept', d.nm) !== d.band) bd.push(`${d.is} wears a bandana, but the park record does not keep it under her name — nothing a reload could bring back`);
          else if (diff(d.bare, d.px) < 1) bd.push(`a bandana changes nothing about how ${d.is} is drawn — the drawing cannot say whether it came back`); }
        if (!bd.length) {
          // the next time the game is opened
          await p.reload(); await p.waitForTimeout(900); await p.click('#continueBtn'); await p.waitForTimeout(500); await p.evaluate(helpers);
          for (const d of pups) {
            const band = await call('band', d.nm);
            if (band === undefined) { bd.push(`after a reload, ${d.is} is not in the game at all`); continue; }
            const dp = diff(d.px, await call('draw', d.nm));
            if (band !== d.band) bd.push(`after a reload, ${d.is} has ${band ? 'a different bandana (' + band + ')' : 'no bandana'} — she wore ${d.band} when the game was closed, and the park record still keeps it for her`);
            else if (dp !== 0) bd.push(`after a reload, ${d.is} is drawn differently from how she looked when the game was closed (${dp < 0 ? 'there is no drawing to compare' : dp + ' of 1936 pixels'})`); }
          if (!bd.length) console.log(`  BANDANA, RELOAD: a pup of every breed the adoption card offers (${pups.map(d => d.is).join(', ')}) got a bandana from the button beside her, and after a reload each one wears it again, in the record and in the drawing`);
        }
      }
    } catch (e) { bd.push('the check could not drive the game to the end, so it measured nothing: ' + String(e.message || e).split('\n')[0]); }
    if (errs.length) bd.push('the page errored: ' + errs.join(' | '));
    fails.push(...bd.map(s => '#281 bandana after a reload: ' + s));
    await ctx.close();
  }

  // ---- a door says where it leads ----
  // The cold read (IDEAS §15.8) found all five door glyphs pixel-identical: an office
  // door, a shop entrance and the mercado's door were the same brown, so nothing told a
  // newcomer which one goes somewhere. The body stays shared in the engine; DOORLOOK in
  // the pack colours each door for its destination.
  const doorLook = await page.evaluate(() => {
    const problems = [];
    if (typeof DOORLOOK === 'undefined') { problems.push('the pack declares no DOORLOOK — every door is the same brown'); return problems; }
    const bake = g => { const c = document.createElement('canvas'); c.width = 32; c.height = 32;
      const o = ctx; ctx = c.getContext('2d'); try { TILEDRAW[g]({ sx: 0, sy: 0, x: 0, y: 0, t: 0, canopy: () => {} }); } finally { ctx = o; }
      return c.getContext('2d').getImageData(0, 0, 32, 32).data.join(','); };
    const seen = {};
    [...DOORSET].forEach(g => { const k = bake(g); if (seen[k]) problems.push(`doors '${seen[k]}' and '${g}' are pixel-identical`); else seen[k] = g; });
    Object.keys(DOORLOOK).forEach(g => { if (!DOORSET.has(g)) problems.push(`DOORLOOK names '${g}', which is not a door glyph`); });
    return problems;
  });
  fails.push(...doorLook);

  // ---- iso reads a pack tile's declared height (Don Güero, 2026-09-02: a declared lift:13
  // window rendered 6px short of the wall beside it because IZH was a hardcoded table) ----
  {
    const iso = await page.evaluate(() => typeof izh === 'function' ? { win: izh('|'), wall: izh('#'), unknown: izh('¤') } : null);
    if (!iso) fails.push('iso has no izh() height lookup that reads TILES.lift');
    else { if (iso.win !== iso.wall) fails.push(`iso draws the window ${iso.win} tall and the wall ${iso.wall} — a notch in the north wall`);
           if (iso.unknown !== 14) fails.push('iso lost its 14px default for an undeclared glyph'); }
  }

  // ---- a piece of furniture is drawn for the camera that sees it ----
  // Owner 2026-09-02: "some furniture still looks bad like the table and fences and the
  // coffee machine". Root cause, from the frames: every prop was drawn from ABOVE and
  // then stood up as a cutout in the front and 3D cameras — a gingham table stood up is
  // a dartboard. The professional fix is a second drawing per prop, made for the view
  // that sees it standing (HD-2D games draw every object from the front, never from
  // above). TILESIDE holds those; a glyph without one falls back to its top-down art;
  // a pack adds or overrides its own through TILEART_SIDE.
  const side = await page.evaluate(() => {
    const problems = [];
    if (typeof TILESIDE === 'undefined' || typeof sideArt !== 'function') return ['the engine has no side-view registry (TILESIDE / sideArt)'];
    ['T', 'K', 'V'].forEach(g => { if (typeof TILESIDE[g] !== 'function') problems.push(`no side view for '${g}'`); });
    if (sideArt('T') === TILEDRAW['T']) problems.push('the table\'s side view is its top-down drawing');
    if (sideArt('P') !== TILEDRAW['P']) problems.push('a glyph with no side view must fall back to its top-down drawing');
    Object.keys(TILESIDE).forEach(g => { try {
      const t = document.createElement('canvas'); t.width = 32; t.height = 32; const o = ctx; ctx = t.getContext('2d');
      TILESIDE[g]({ sx: 0, sy: 0, x: 1, y: 1, canopy: () => {} }); ctx = o;
      const d = t.getContext('2d').getImageData(0, 0, 32, 32).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++;
      if (n < 100) problems.push(`the side view of '${g}' paints almost nothing`);
    } catch (e) { problems.push(`the side view of '${g}' throws: ${e.message}`); } });
    return problems;
  });
  fails.push(...side);

  // ---- a person with something to say beats an animal for the button ----
  // Owner 2026-09-02: "i get logs of the crosswalk while im trying to talk who i thought was
  // don guero". The crosswalk line is the pigeon's. She wanders the street, and when she
  // stepped beside the player the pet button appeared next to Talk; tap the wrong one and
  // you get the bird. A quest person adjacent now hides the animal button.
  const yield_ = await page.evaluate(() => {
    const problems = [];
    const before = { world, px, py, pig: { x: PIG.x, y: PIG.y, m: PIG.moving } };
    // Lupe carries both La Obra quests since 2026-09-03 (Don Güero stands upstairs only)
    const lu = WORLDS.st.npcs.find(x => x.npc === 'lupe');
    world = 'st'; px = fx = lu.x; py = fy = lu.y + 1; moving = false; held = null;
    document.getElementById('card').hidden = true; document.getElementById('world').hidden = false;
    PIG.x = lu.x - 1; PIG.y = lu.y + 1; PIG.moving = false;                    // the pigeon beside you too
    checkTalk(); fredCheck();
    const talk = document.getElementById('talk'), treat = document.getElementById('treat');
    if (talk.hidden || talk.dataset.qi === undefined) problems.push('standing beside the quest-giver shows no quest Talk button');
    if (!treat.hidden) problems.push('the pigeon still takes a button while a quest person is adjacent');
    px = fx = 6; py = fy = 9; PIG.x = 6; PIG.y = 10; checkTalk(); fredCheck();   // away from her, bird still beside you
    if (treat.hidden) problems.push('with nobody to talk to, the pigeon lost her button');
    world = before.world; px = fx = before.px; py = fy = before.py; PIG.x = before.pig.x; PIG.y = before.pig.y; PIG.moving = before.pig.m;
    checkTalk(); fredCheck();
    return problems;
  });
  fails.push(...yield_);

  // ---- a fence stands along its run in 3D, and a corner has two panels ----
  // Owner 2026-09-02: the construction fences "are sideways ... laying around instead of
  // fencing in construction". Every fence tile was a flat panel facing south, so a
  // north-south run showed as a row of edge-on slats.
  const fence3d = await page.evaluate(() => {
    const problems = [];
    const before = { cam: camMode, world, px, py };
    camSet('3d'); world = 'st'; px = fx = 13; py = fy = 6; moving = false; held = null;
    if (!draw3d() || T3.fail) { problems.push('3D did not render headless — fences could not be checked'); camSet(before.cam); return problems; }
    const w = CW();
    const isF = (x, y) => y >= 0 && y < w.H && x >= 0 && x < w.W && (TILES[w.rows[y][x]] || {}).kind === 'fence';
    const seen = {}, shaped = {};
    T3.group.children.forEach(o => { const u = o.userData || {};
      /* A pack that gave the fence a SHAPE (the `mesh` view, 2026-09-21) stands one merged mesh per tile
         and no panel to turn, so the noun is read off the shape: does it REACH each tile it continues
         into — per direction, because a run's end and a corner stop at their post and must not be asked
         for the whole tile (the first cut of this asked for a full span and went red on twelve tiles that
         were right). Its run is by the same GLYPH, which is how a pack builds it (TILEART_MESH["F"] reads
         F, not kind) — a barricade beside the crew pen is kind `fence` too, and counting it as more fence
         is what stood the engine's panels at 90° in mid-air there (docs/BEAUTIFY.md, row F). Planted in
         a copy outside the repo (the rails cut to 0.6 of the bay; the whole shape turned a quarter): red
         in the sentences below, both times. */
      if (u.mesh && u.g !== undefined && (TILES[u.g] || {}).kind === 'fence' && o.geometry) {
        o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox;
        shaped[u.x + ',' + u.y] = { g: u.g, minx: bb.min.x, maxx: bb.max.x, minz: bb.min.z, maxz: bb.max.z }; return; }
      if (!u.fence) return;
      const k = u.x + ',' + u.y; seen[k] = seen[k] || []; seen[k].push(Math.abs(o.rotation.y)); });
    let checked = 0;
    for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) if (isF(x, y)) {
      const ns = isF(x, y - 1) || isF(x, y + 1), ew = isF(x - 1, y) || isF(x + 1, y);
      const rots = seen[x + ',' + y] || [], sh = shaped[x + ',' + y];
      if (!rots.length && sh) { checked++;
        const same = (ax, ay) => ay >= 0 && ay < w.H && ax >= 0 && ax < w.W && w.rows[ay][ax] === sh.g;
        /* 0.48, not 0.45: the outermost picket's point reaches 0.452 with the rails cut to 0.6 of the bay, and
           a threshold under it would have read the picket for the rail — the plant found that */
        [[1, 0, 'east', sh.maxx >= 0.48], [-1, 0, 'west', sh.minx <= -0.48], [0, 1, 'south', sh.maxz >= 0.48], [0, -1, 'north', sh.minz <= -0.48]].forEach(([dx, dy, name, reaches]) => {
          if (same(x + dx, y + dy) && !reaches) problems.push(`the fence at (${x},${y}) continues ${name} into the next tile but its shape stops short of the tile line — the rails break there and the run reads as separate panels`); });
        const runNS = same(x, y - 1) || same(x, y + 1), runEW = same(x - 1, y) || same(x + 1, y);
        if (runEW && !runNS && sh.maxz - sh.minz > 0.5) problems.push(`the fence at (${x},${y}) runs east-west but its shape is turned across the run`);
        if (runNS && !runEW && sh.maxx - sh.minx > 0.5) problems.push(`the fence at (${x},${y}) runs north-south but its shape is turned across the run`);
        continue; }
      if (!rots.length) { problems.push(`fence at (${x},${y}) has no panel in 3D`); continue; }
      checked++;
      const wantNS = ns && !ew, corner = ns && ew;
      if (corner) { if (rots.length < 2) problems.push(`fence corner at (${x},${y}) has one panel — it needs two`); }
      else if (wantNS && !rots.some(r => Math.abs(r - Math.PI / 2) < 1e-6)) problems.push(`fence at (${x},${y}) runs north-south but its panel faces south`);
      else if (!wantNS && !rots.some(r => r < 1e-6)) problems.push(`fence at (${x},${y}) runs east-west but its panel is turned`);
    }
    if (!checked) problems.push('no fence tiles found on the street map');
    camSet(before.cam); world = before.world; px = fx = before.px; py = fy = before.py;
    return problems;
  });
  fails.push(...fence3d);

  // ---- a marker floats over a door you are near, and only over doors that lead somewhere ----
  // Owner 2026-09-02: "i think we should have a marker- would be good." The third door
  // affordance: within three steps of a door that goes somewhere, a bouncing arrow.
  const marks = await page.evaluate(() => {
    const problems = [];
    if (typeof doorMarks !== 'function' || typeof drawDoorMark !== 'function') return ['no doorMarks()/drawDoorMark() in the engine'];
    const before = { world, px, py };
    world = 'hq'; px = fx = 10; py = fy = 14;                   // two steps from the front door at (10,16), on the landing
    let m = doorMarks();
    if (!m.some(d => d.x === 10 && d.y === 16)) problems.push('two steps from HQ\'s front door, no marker');
    if (m.some(d => !PORTALS.hq[d.ch])) problems.push('a marker over a door that leads nowhere');
    px = fx = 8; py = fy = 12;                                   // beside an interior door "+" at (7,12)
    m = doorMarks();
    if (m.some(d => d.ch === '+')) problems.push('interior doors (no portal) got a marker');
    px = fx = 10; py = fy = 5;                                   // far away
    if (doorMarks().some(d => d.y === 13)) problems.push('the front door is marked from eight steps away');
    try { const t = document.createElement('canvas'); t.width = 64; t.height = 64; drawDoorMark(t.getContext('2d'), 16, 30, 0); }
    catch (e) { problems.push('drawDoorMark throws: ' + e.message); }
    world = before.world; px = fx = before.px; py = fy = before.py;
    return problems;
  });
  fails.push(...marks);

  // ---- a district declares its own ending strings and its own "next lot" toast ----
  // The engine held exactly two ending sets (Week One's and the mercado's), so a third
  // district would print the wrong last visit. Now a district may say which strings are
  // its own; with nothing declared the old two-set behaviour stands.
  const epis = await page.evaluate(() => {
    const problems = [];
    if (typeof epiKeys !== 'function') return ['no epiKeys() in the engine'];
    const L = CHS(), k0 = L[0].epi, o0 = L[0].open;
    delete L[0].epi; delete L[0].open;
    let k = epiKeys(0, false);
    if (k.pre !== 'epi' || k.go !== 'goEpi' || k.open !== 'weekTwoToast') problems.push(`undeclared first district: ${JSON.stringify(k)}`);
    // the last district used to be the mercado, whose declared keys happen to equal the
    // fallback; now it is whoever closes the city, so strip its declaration before asking
    const li = L.length - 1, kl = { epi: L[li].epi, go: L[li].go, open: L[li].open };
    delete L[li].epi; delete L[li].go; delete L[li].open;
    k = epiKeys(li, true);
    if (k.pre !== 'mepi' || k.go !== 'mgoEpi' || k.open !== 'endStayToast') problems.push(`undeclared last district: ${JSON.stringify(k)}`);
    Object.entries(kl).forEach(([f, v]) => { if (v === undefined) delete L[li][f]; else L[li][f] = v; });
    L[0].epi = 'mepi'; L[0].open = 'endStayToast';
    k = epiKeys(0, false);
    if (k.pre !== 'mepi' || k.open !== 'endStayToast') problems.push(`declared keys ignored: ${JSON.stringify(k)}`);
    if (k0 === undefined) delete L[0].epi; else L[0].epi = k0;
    if (o0 === undefined) delete L[0].open; else L[0].open = o0;
    // Meridian's own districts declare theirs, so the fallback is never what ships
    if (!L.every(c => c.epi && c.open)) problems.push('a Meridian district relies on the engine fallback for its ending strings');
    L.forEach(c => ['1', '2', '3'].forEach(n => { if (!UI.en[c.epi + n] || !UI.es[c.epi + n]) problems.push(`district ${c.id}: ending string ${c.epi + n} missing in EN or ES`); }));
    return problems;
  });
  fails.push(...epis);

  // ---- a person's look is keyed by who they are, not by the map letter ----
  // NPCLOOK was one flat table keyed by station letter, shared by every world — the
  // taller's cast would have worn Tovar's colours. Now the npc id wins; the letter stays
  // as the fallback so nothing shipped changes.
  const looks = await page.evaluate(() => {
    const problems = [];
    if (typeof lookOf !== 'function') return ['no lookOf() in the engine'];
    const n = WORLDS.st.npcs.find(x => x.npc === 'lupe');
    if (!n) return ['Lupe is not on the street'];
    if (lookOf(n) !== NPCLOOK[n.key]) problems.push('with no per-person look, the letter look must be used');
    NPCLOOK.lupe = { shirt: '#123456', skin: '#C08356', hair: '#000000', style: 'buzz' };
    if (lookOf(n) !== NPCLOOK.lupe) problems.push('a look keyed by npc id is ignored');
    delete NPCLOOK.lupe;
    return problems;
  });
  fails.push(...looks);

  // ---- the whole city raised: every lot, door, room, cat and gift holds up ----
  // Don Güero's four parcels (2026-09-02). Raise every storefront at once and check what
  // the boot-time audit cannot: rooms behind doors that do not exist yet.
  const city = await page.evaluate(() => {
    const problems = [];
    const keep = { chSeen, world, px, py, done: new Set(done) };
    const g = GROWTH;
    if (!Array.isArray(g.ribbons) || g.ribbons.length < 5) problems.push('the pack declares fewer than five storefronts');
    chSeen = 99; applyGrowth();
    if (auditReach().length) problems.push('with every lot raised: ' + auditReach().join(' | '));
    ribbons().filter(r => r.doorstep).forEach(r => {
      const w = WORLDS[r.world];
      const doorTile = r.tiles.find(([y, x, ch]) => DOORSET.has(ch));
      if (!doorTile) { problems.push(`${r.id}: no door in its storefront`); return; }
      const [dy, dx, dch] = doorTile;
      if (w.rows[dy][dx] !== dch) problems.push(`${r.id}: the door did not land at (${dx},${dy})`);
      const p = PORTALS[r.world] && PORTALS[r.world][dch];
      if (!p) { problems.push(`${r.id}: door '${dch}' has no portal`); return; }
      const inside = WORLDS[p.to]; if (!inside) { problems.push(`${r.id}: leads to a missing world ${p.to}`); return; }
      if (SOLID.has(inside.grid[p.y][p.x]) || inside.grid[p.y][p.x] === 'N') problems.push(`${r.id}: arrival (${p.x},${p.y}) in ${p.to} is blocked`);
      const back = Object.values(PORTALS[p.to] || {}).find(q => q.to === r.world);
      if (!back) problems.push(`${r.id}: no way back to the street from ${p.to}`);
      else if (SOLID.has(w.grid[back.y][back.x])) problems.push(`${r.id}: the way back lands on a solid tile`);
      if (r.doorstep.world !== r.world || SOLID.has(w.grid[r.doorstep.y][r.doorstep.x])) problems.push(`${r.id}: the doorstep is not a standable street tile`);
    });
    Object.entries(WORLDS).forEach(([id, w]) => {
      for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) {
        const ch = w.rows[y][x]; if (!DOORSET.has(ch)) continue;
        const N = y > 0 ? w.rows[y-1][x] : null, S = y < w.H-1 ? w.rows[y+1][x] : null, E = x < w.W-1 ? w.rows[y][x+1] : null, W = x > 0 ? w.rows[y][x-1] : null;
        const open1 = c => c === null || !SOLID.has(c);
        if (![N, S, E, W].some(c => c !== null && SOLID.has(c))) problems.push(`${id} (${x},${y}) '${ch}': a raised door with no wall beside it`);
        if (!(open1(N) && open1(S)) && !(open1(E) && open1(W))) problems.push(`${id} (${x},${y}) '${ch}': a raised door you cannot walk through`);
        [N, S, E, W].forEach(c => { if (c !== null && DOORSET.has(c)) problems.push(`${id} (${x},${y}) '${ch}': raised doors side by side`); });
      }
    });
    (typeof CRITTERS !== 'undefined' ? CRITTERS : []).forEach(c => { const w = WORLDS[c.world];
      if (!w) problems.push(`critter in a missing world ${c.world}`);
      else if (SOLID.has(w.grid[c.y][c.x]) || w.grid[c.y][c.x] === 'N') problems.push(`${c.kind} ${c.name || ''} at ${c.world} (${c.x},${c.y}) sits on a blocked tile`); });
    const f2 = WORLDS.f2;
    ribbons().filter(r => r.world === 'f2').forEach(r => r.tiles.forEach(([y, x, ch]) => {
      if (f2.rows[y][x] !== ch) problems.push(`${r.id}: gift '${ch}' did not land at (${x},${y})`);
      if (x === 14 && y === 14) problems.push(`${r.id}: a gift on the arrival tile`);
      if ([[14,13],[13,12],[13,11],[13,10],[12,9],[12,8],[12,7],[12,6],[11,5],[11,4],[11,3],[10,2]].some(([sx, sy]) => sx === x && sy === y) && (TILES[ch] || {}).lift > 6) problems.push(`${r.id}: a tall gift on the sight line`);
    }));
    if (!f2.npcs.some(n => roomHosts[n.npc])) problems.push('the room hosts vanished when the office was rebuilt');
    if (typeof drawTown === 'function') { try { drawTown(); } catch (e) { problems.push('the town plan throws with every lot raised: ' + e.message); } }
    ['=', '%', '6', '7', '8', '0', 'i', '&', '!', '▣', '▯', '⊔', '○'].forEach(gch => { try {
      const t = document.createElement('canvas'); t.width = 32; t.height = 32; const o = ctx; ctx = t.getContext('2d');
      (TILEDRAW[gch])({ sx: 0, sy: 0, x: 1, y: 1, canopy: () => {} }); if (TILESIDE[gch]) TILESIDE[gch]({ sx: 0, sy: 0, x: 1, y: 1, canopy: () => {} }); ctx = o;
    } catch (e) { problems.push(`tile '${gch}' throws when drawn alone: ${e.message}`); } });
    chSeen = keep.chSeen; done = keep.done; applyGrowth();
    world = keep.world; px = fx = keep.px; py = fy = keep.py;
    return problems;
  });
  fails.push(...city);

  // ---- the record keeps every decision — it never silently drops your earliest work ----
  // Owner 2026-09-02: "I thought we fixed this 200 entries thing". It was not fixed: the
  // play log was cut to its last 200 entries on every write, so a five-district city
  // would lose its first districts from the portfolio without a word. Nothing you make
  // is taken away — the cap is gone, and a storage failure is warned about, not hidden.
  const keep = await page.evaluate(() => {
    const problems = [];
    const before = { dlog: dlog.slice(), stored: localStorage.getItem('mqdlog'), cur, curQ, node };
    dlog = []; cur = 0; curQ = AQ()[0]; node = curQ.start;
    const c = curQ.nodes[node].ch.find(x => x.out) || curQ.nodes[node].ch[0];
    for (let i = 0; i < 260; i++) logDecision(c.out || { r: 'ok', concept: 'x', why: 'y' }, c);
    if (dlog.length !== 260) problems.push(`logged 260 decisions, the record holds ${dlog.length}`);
    let stored = []; try { stored = JSON.parse(localStorage.getItem('mqdlog') || '[]'); } catch (e) {}
    if (stored.length !== 260) problems.push(`the phone stored ${stored.length} of 260 decisions`);
    dlog = before.dlog; cur = before.cur; curQ = before.curQ; node = before.node;
    if (before.stored === null) localStorage.removeItem('mqdlog'); else localStorage.setItem('mqdlog', before.stored);
    return problems;
  });
  fails.push(...keep);

  // ---- the city can raise more than one storefront, and each says where you stand ----
  // Owner 2026-09-02: "not stopping at a certain amount of store fronts" — it was still
  // stopping at one: GROWTH.ribbon held a single storefront, and the handover walked you
  // to the mercado's front step, hardcoded in the engine. Now a pack declares ribbons[]
  // (the old singular ribbon still works), each with its own doorstep.
  const ribs = await page.evaluate(() => {
    const problems = [];
    const g = GROWTH, keep = { ribbons: g.ribbons, ribbon: g.ribbon, chSeen, world, px, py, done: new Set(done), hearts };
    const st = () => WORLDS.st.rows[1][1];
    if (typeof ribbons !== 'function') return ['the engine has no ribbons() list'];
    const merc = ribbons().find(r => r.district === 1);
    if (!merc || !merc.doorstep || merc.doorstep.x !== 6 || merc.doorstep.y !== 12) problems.push('the pack does not declare the mercado\'s doorstep (the engine used to hardcode it)');
    // the old singular declaration still counts as a list of one ([partner]'s pack, older saves)
    delete g.ribbons; g.ribbon = merc;
    if (ribbons().length !== 1 || ribbons()[0] !== merc) problems.push('the old singular ribbon is not read as a list of one');
    // two storefronts: each rises when its own district opens
    g.ribbons = [merc, { world: 'st', district: 2, tiles: [[1, 1, 'P']], doorstep: { world: 'st', x: 1, y: 2, dir: 'up' } }];
    done = new Set(); chSeen = 0; applyGrowth();
    if (ribbonUp()) problems.push('a storefront is up before any district opened');
    chSeen = 1; applyGrowth();
    if (!ribbonUp(g.ribbons[0])) problems.push('the first storefront did not rise on its district');
    if (ribbonUp(g.ribbons[1]) || st() === 'P') problems.push('the second storefront rose a district early');
    chSeen = 2; applyGrowth();
    if (!ribbonUp(g.ribbons[1]) || st() !== 'P') problems.push('the second storefront never rose — the city still stops at one');
    // the handover doorstep comes from the storefront that just opened, not from the engine
    g.ribbons = [merc]; chSeen = 0; applyGrowth();
    world = 'hq'; px = fx = 10; py = fy = 11; document.getElementById('end').hidden = false;
    document.getElementById('endGo').click();
    if (chSeen !== 1) problems.push('the handover did not open the next district');
    if (world !== 'st' || px !== 6 || py !== 12) problems.push(`the handover left you at ${world} (${px},${py}) — expected the declared doorstep st (6,12)`);
    // with no doorstep declared, the handover leaves you where you were
    const ds = merc.doorstep; delete merc.doorstep;
    chSeen = 0; applyGrowth(); world = 'hq'; px = fx = 10; py = fy = 11;
    document.getElementById('end').hidden = false; document.getElementById('endGo').click();
    if (world !== 'hq' || px !== 10 || py !== 11) problems.push('with no doorstep declared the engine still walked you somewhere of its own choosing');
    merc.doorstep = ds;
    // put the city back
    if (keep.ribbons) g.ribbons = keep.ribbons; else delete g.ribbons;
    if (keep.ribbon) g.ribbon = keep.ribbon; else delete g.ribbon;
    done = keep.done; chSeen = keep.chSeen; hearts = keep.hearts; applyGrowth();
    world = keep.world; px = fx = keep.px; py = fy = keep.py;
    document.getElementById('end').hidden = true; document.getElementById('world').hidden = false; setWorldTag(); checkTalk();
    return problems;
  });
  fails.push(...ribs);

  // ---- the room upstairs: two neighbours ask, nothing is graded, the sheet is hers ----
  // Owner 2026-09-02: "lets make it so that [partner] can interact through the characters with
  // you if possible ... i dont want an api setup". So: the characters ask IN the game,
  // her answers are kept on the phone, and the game writes a plain sheet with a Copy
  // button that the owner hands to Claude. Everything with a name lives in
  // content/meridian/room.js (INTERVIEW); the engine reads only shapes, and a pack
  // that declares nothing gets nothing (the off-switch law). Three skeptics shaped this test:
  // the box and the sheet must be ON SCREEN while the card is up (the old panels live
  // inside the hidden world panel), answers keep their written order (no shuffle — there
  // is no right answer to hide), a mis-tap costs nothing, and a fruit crate is not a
  // moving box, so the room opens bare, exactly as signed.
  const room = await page.evaluate(async () => {
    const problems = [];
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const $ = id => document.getElementById(id);
    if (typeof INTERVIEW === 'undefined' || typeof RM !== 'function' || !RM()) return ['no INTERVIEW declared by the pack (content/meridian/room.js)'];
    const I = RM(), U = I.ui[lang];
    // the office opens MID-MOVE (owner 2026-09-02: "for the move it should be mid"), and
    // nothing else: the old lead's desk, the stairs, the three window panes, four taped
    // moving boxes on the pack's own glyph, one of Don Güero's cones, a plant still in
    // its pot. Don Güero's grid; the arrival tile and the sight line from the stairs to
    // the window stay clear because Nacho's "nothing in the way" is an answer a player
    // can pick, so it has to be true.
    // HQ (#4): rows 0–12 untouched but for the old stair leaving Dana's closet; then the office door and the
    // stair mass, the landing and the flight to the head, the lobby, the front door — Don Güero's candidate B
    { const hq = WORLDS.hq.rows;
      if (hq.length !== 17 || hq.some(r => r.length !== 20)) problems.push('hq is not 20 wide x 17 tall');
      if (hq[13] !== '##########+⊓⊓⊓⊓#####' || hq[14] !== '#..........≡≡≡▲#####' || hq[15] !== '#..................#' || hq[16] !== '##########E#########') problems.push('HQ\'s last four rows are not the stair hall and the lobby');
      if (hq[5] !== '#......#..RR...#...#') problems.push('the old stair did not leave Dana\'s closet: ' + hq[5]);
      if (hq[12] !== '#.a....+.......#####') problems.push('row 12 of HQ changed — rows 0–12 keep every coordinate');
      if (hq.some(r => r.includes('1'))) problems.push('the old stair glyph is still laid in HQ');
      const up = PORTALS.hq['▲'], dn = PORTALS.f2['▼'], inE = PORTALS.st.E;
      if (!up || up.to !== 'f2' || up.x !== 14 || up.y !== 14 || up.mark !== 'up') problems.push('▲ does not climb to the loft at (14,14) with the up mark');
      if (!dn || dn.to !== 'hq' || dn.x !== 10 || dn.y !== 14) problems.push('▼ does not come down to the landing (10,14)');
      if (!inE || inE.to !== 'hq' || inE.x !== 10 || inE.y !== 14) problems.push('coming in from the street does not land on the landing (10,14)');
      if (PORTALS.hq['1'] || PORTALS.f2['1']) problems.push('the old stair portals are still declared'); }
    const f2 = WORLDS.f2.rows;
    // #4 (mq-v81, Don Güero's candidate B): three rows south — the railed well over the flight, the loft's floor, the wall
    if (f2.length !== 17 || f2.some(r => r.length !== 20)) problems.push('f2 is not 20 wide x 17 tall');
    if (f2[13] !== '#.........◺◺◺◺.....#' || f2[14] !== '#........◺▼≡≡≡.....#' || f2[15] !== '#.........◺◺◺◺.....#' || f2[16] !== '####################') problems.push('the loft\'s last four rows are not the railed well over the flight');
    if (f2[12] !== '#..................#') problems.push('row 12 of the loft changed — rows 0–12 keep every coordinate');
    const glyphs = {}; f2.forEach(r => [...r].forEach(c => { glyphs[c] = (glyphs[c] || 0) + 1; }));
    // the wall now carries six sheets of blank paper — the office's own record, pinned
    // from day one and unlabelled (owner's call, 2026-09-03), each swapped for a stapled
    // document by its district's ribbon.
    const want = { D: 1, '□': 4, C: 1, P: 1, '▼': 1, '≡': 3, '◺': 9, '▭': 6 };
    Object.entries(want).forEach(([c, n]) => { if (glyphs[c] !== n) problems.push(`the office should hold ${n} '${c}', found ${glyphs[c] || 0}`); });
    if ((f2[14] || '')[10] !== '▼') problems.push('the way down moved — it is the ▼ at (10,14), the deepest tile of the well');
    if (f2.some(r => r.includes('1'))) problems.push('the old stair glyph is still laid in the office — the flight replaced it');
    Object.keys(glyphs).forEach(c => { if (!'#.D|□CP▭▤▼≡◺'.includes(c)) problems.push(`the office holds something unplanned: '${c}'`); });
    if ((f2[14] || '')[14] !== '.') problems.push('the arrival tile (14,14) is blocked');
    if ((f2[13] || '')[14] !== '.') problems.push('(14,13) must be floor — you step off the top of the flight into the room');
    [[14,13],[13,12],[13,11],[13,10],[12,9],[12,8],[12,7],[12,6],[11,5],[11,4],[11,3],[10,2]].forEach(([x, y]) => {
      if ((f2[y] || '')[x] !== '.') problems.push(`the sight line from the stairs to the window is blocked at (${x},${y}) by '${(f2[y] || '')[x]}'`); });
    // ---- la ventana del norte (Don Güero + Nacho, 2026-09-02): three panes IN the north wall,
    // over the old desk, declared by the pack (art.js) and never by the engine ----
    if (f2[0].slice(9, 12) !== '|||') problems.push(`the three panes must stay over the desk, got "${f2[0]}"`);
    if ([...f2[0]].some((c, i) => (i >= 9 && i <= 11) ? false : !'#▭▤'.includes(c))) problems.push(`the north wall holds something that is not wall or paper: "${f2[0]}"`);
    if (f2[0].length !== 20) problems.push('the north wall is not 20 wide');
    f2.slice(1).forEach((r, i) => { if (r.includes('|')) problems.push(`a window pane off the north wall at row ${i + 1}`); });
    if (typeof TILEART === 'undefined' || typeof TILEART['|'] !== 'function') problems.push('the pack declares no drawing for the window (TILEART["|"])');
    if (!TILES['|'] || TILES['|'].kind !== 'wall' || TILES['|'].lift !== TILES['#'].lift) problems.push('the window must be a wall-kind tile as tall as the wall beside it, or 3D shows a notch');
    if (!SOLID.has('|')) problems.push('the window is walkable — SOLIDX must carry it');
    if (!MAPCOL['|']) problems.push('the window has no colour on the village map');
    // the moving box: the pack's second glyph — solid, low, its own colour on the map
    if (typeof TILEART === 'undefined' || typeof TILEART['□'] !== 'function') problems.push('the pack declares no drawing for the moving box (TILEART["□"])');
    if (!TILES['□'] || TILES['□'].kind !== 'prop' || !(TILES['□'].lift > 0 && TILES['□'].lift <= 6)) problems.push('the moving box must be a low prop (it must not block the view)');
    if (!SOLID.has('□')) problems.push('the moving box is walkable — SOLIDX must carry it');
    if (!MAPCOL['□'] || MAPCOL['□'] === MAPCOL['H']) problems.push('the moving box needs its own colour on the village map, not the produce crate\'s');
    // the cold-read sheet draws every tile with no scene: the art must tolerate that, in both box variants
    try { const t = document.createElement('canvas'); t.width = 32; t.height = 32; const o = ctx; ctx = t.getContext('2d');
      TILEDRAW['|']({ sx: 0, sy: 0, x: 10, y: 0, canopy: () => {} });
      TILEDRAW['□']({ sx: 0, sy: 0, x: 1, y: 1, canopy: () => {} }); TILEDRAW['□']({ sx: 0, sy: 0, x: 1, y: 2, canopy: () => {} });
      ctx = o; } catch (e) { problems.push('the pack art throws when drawn alone: ' + e.message); }
    // shape: everything a pack must declare, EN and ES in lockstep
    const keys = o => Object.keys(o).sort().join(',');
    if (keys(I.ui.en) !== keys(I.ui.es)) problems.push('INTERVIEW.ui EN/ES keys differ');
    ['title', 'place', 'invite'].forEach(k => { if (!I[k] || !I[k].en || !I[k].es) problems.push(`INTERVIEW.${k} needs en and es`); });
    const ids = new Set();
    I.hosts.forEach(h => {
      if (ids.has(h.id)) problems.push(`host id ${h.id} repeated`); ids.add(h.id);
      if (!h.emoji || !h.name || !h.name.en || !h.name.es || !h.look || !h.talk || !h.talk.en || !h.talk.es) problems.push(`host ${h.id} is missing emoji/name/look/talk`);
      if (!WORLDS[h.world]) problems.push(`host ${h.id} stands in a world that does not exist: ${h.world}`);
      if (!h.done || !h.done.en || !h.done.es) problems.push(`host ${h.id} has no closing line`);
      const sids = new Set();
      (h.steps || []).forEach(s => {
        if (sids.has(s.id)) problems.push(`host ${h.id} step ${s.id} repeated`); sids.add(s.id);
        ['say', 'why', 'q'].forEach(k => { if (!s[k] || !s[k].en || !s[k].es) problems.push(`${h.id}:${s.id} ${k} needs en and es`); });
        if (!s.opts || s.opts.length < 2 || s.opts.some(o => !o.en || !o.es)) problems.push(`${h.id}:${s.id} needs 2+ answers in both languages`);
        // phone rules: a host speaks two sentences, an answer fits on one line
        if (s.say && s.say.en && s.say.en.split(/[.!?…]["”]?\s+/).filter(Boolean).length > 3) problems.push(`${h.id}:${s.id} say runs past two sentences`);
        (s.opts || []).forEach(o => { if (o.en && o.en.split(/\s+/).length > 12) problems.push(`${h.id}:${s.id} answer "${o.en}" is over 12 words`); });
        // stairs, not a door: f2's only way out is the stairs
        ['say', 'q'].forEach(k => { if (s[k] && /\bthat door\b|\bthe door\b/i.test(s[k].en)) problems.push(`${h.id}:${s.id} says "door" — the office has stairs`); });
      });
      if (!(h.steps || []).length) problems.push(`host ${h.id} has no steps`);
    });
    // placed: every host stands in its world as a chat person, and the city stays reachable
    I.hosts.forEach(h => {
      const n = WORLDS[h.world].npcs.find(n => n.x === h.x && n.y === h.y && n.chat);
      if (!n) problems.push(`host ${h.id} is not standing at ${h.world} (${h.x},${h.y})`);
      else if (!roomHosts[n.npc] || roomHosts[n.npc].id !== h.id) problems.push(`the person at ${h.world} (${h.x},${h.y}) is not registered as host ${h.id}`);
    });
    if (auditReach().length) problems.push('hosts broke reachability: ' + auditReach().join(' | '));
    const nachos = Object.values(WORLDS).flatMap(w => w.npcs).filter(n => CHILLN[n.npc] && /nacho/i.test(CHILLN[n.npc].en)).length;
    if (nachos !== 1) problems.push(`Nacho stands in ${nachos} places — expected once, upstairs`);
    // stand beside the first host
    const h0 = I.hosts[0], key0 = Object.keys(roomHosts).find(k => roomHosts[k].id === h0.id);
    const before = { world, px, py, xp, marks: JSON.stringify(marks), dl: dlog.length, done: done.size };
    localStorage.removeItem('mqroom'); Object.keys(roomAns).forEach(k => delete roomAns[k]);
    world = h0.world; px = fx = h0.x - 1; py = fy = h0.y; moving = false; held = null; portalT = 0; portalHold = '';
    $('card').hidden = true; $('world').hidden = false; $('settings').hidden = true;
    checkTalk();
    const tb = $('talk');
    if (tb.hidden) problems.push('standing beside a host shows no Talk button');
    else if (!tb.textContent.includes(h0.talk[lang])) problems.push(`the Talk button does not say what the talk is about: "${tb.textContent}"`);
    const n0 = WORLDS[h0.world].npcs.find(n => n.npc === key0);
    if (!n0 || !hasSay(n0)) problems.push('a host with unanswered questions does not count as having something to say (no ❗)');
    if (!worldPending(h0.world)) problems.push('the world where hosts wait is not marked pending');
    tb.click();
    if ($('card').hidden || !$('world').hidden) problems.push('Talk did not open the card');
    if ($('qtag').textContent !== U.tag) problems.push(`card eyebrow is "${$('qtag').textContent}", expected "${U.tag}"`);
    const s0 = h0.steps[0];
    if ($('npcSay').textContent !== s0.say[lang]) problems.push('first step does not show the host\'s first line');
    if ($('npcName').textContent !== h0.name[lang]) problems.push('the card does not name the host');
    if ($('q').textContent !== s0.q[lang]) problems.push('first step does not show its question');
    let btns = [...$('choices').children];
    if (btns.length !== s0.opts.length + 1) problems.push(`expected ${s0.opts.length} answers + say-it-my-way, got ${btns.length} buttons`);
    s0.opts.forEach((o, i) => { if (btns[i] && btns[i].textContent !== o[lang]) problems.push(`answers are not in written order (button ${i})`); });
    if (btns.length && btns[btns.length - 1].textContent !== U.free) problems.push('say-it-my-way is not the last answer button');
    if ($('rmLater').hidden || $('choices').contains($('rmLater'))) problems.push('"that\'s enough for now" must sit below the answers, outside them');
    if (!$('verdict').hidden || !$('next').hidden || !$('levelup').hidden) problems.push('the interview card shows quest chrome (verdict/next/levelup)');
    if (!$('codex').parentElement.hidden) problems.push('the gold lesson box is showing on a design talk');
    if ($('rmWhy').hidden || $('rmWhy').textContent !== s0.why[lang]) problems.push('the "why I\'m asking" line is missing below the answers');
    // a tap saves the WRITTEN index, is acknowledged, and advances
    btns[1].click(); await wait(450);
    const rec = () => JSON.parse(localStorage.getItem('mqroom') || '{}');
    let st = rec();
    if (!st.a || !st.a[h0.id + ':' + s0.id] || st.a[h0.id + ':' + s0.id].pick !== 1) problems.push('tapping the second answer did not save pick=1 under mqroom');
    if (!tickerLines.includes(U.noted)) problems.push('a tap was not acknowledged ("Written down.")');
    if ($('q').textContent !== h0.steps[1].q[lang]) problems.push('a tap did not advance to the next question');
    // say it my way: the box is ON SCREEN while the world panel is hidden; Cancel changes nothing
    btns = [...$('choices').children]; btns[btns.length - 1].click();
    if ($('rmAsk').hidden || $('rmAsk').offsetParent === null) problems.push('say-it-my-way opened nothing visible (the box must live inside the card, not the hidden world panel)');
    if (document.activeElement !== $('rmText')) problems.push('the text box did not take focus');
    $('rmText').value = 'nope'; $('rmCancel').click();
    st = rec();
    if (st.a[h0.id + ':' + h0.steps[1].id]) problems.push('Cancel recorded an answer');
    if ($('q').textContent !== h0.steps[1].q[lang]) problems.push('Cancel moved off the question');
    if (!$('rmAsk').hidden) problems.push('Cancel left the box open');
    // typed words are kept verbatim (a <3 stays a <3) and advance
    btns = [...$('choices').children]; btns[btns.length - 1].click();
    $('rmText').value = "  <3 warm like abuela's kitchen  "; $('rmOk').click(); await wait(450);
    st = rec();
    const a1 = st.a[h0.id + ':' + h0.steps[1].id];
    if (!a1 || a1.text !== "<3 warm like abuela's kitchen") problems.push('typed words were not kept verbatim: ' + JSON.stringify(a1));
    if ($('q').textContent !== h0.steps[2].q[lang]) problems.push('a typed answer did not advance');
    // an empty OK on a fresh question means "I'll tell you out loud"
    btns = [...$('choices').children]; btns[btns.length - 1].click(); $('rmText').value = '   '; $('rmOk').click(); await wait(450);
    st = rec();
    if (!st.a[h0.id + ':' + h0.steps[2].id] || !st.a[h0.id + ':' + h0.steps[2].id].out) problems.push('an empty OK on a fresh question was not recorded as "tell you out loud"');
    if ($('q').textContent !== h0.steps[3].q[lang]) problems.push('"tell you out loud" did not advance');
    // "that's enough for now" leaves with everything kept; coming back resumes where she was
    $('rmLater').click();
    if (!$('card').hidden || $('world').hidden) problems.push('"that\'s enough for now" did not return to the room');
    if (Object.keys(rec().a).length !== 3) problems.push('leaving early lost answers');
    checkTalk(); tb.click();
    if ($('q').textContent !== h0.steps[3].q[lang]) problems.push('talking again did not resume at the first unanswered question');
    // finish this host with first answers
    for (let i = 3; i < h0.steps.length; i++) { [...$('choices').children][0].click(); await wait(450); }
    if ($('npcSay').textContent !== h0.done[lang]) problems.push('after the last answer the host did not say the closing line');
    if ($('rmSheet').hidden || $('rmSheet').offsetParent === null) problems.push('the sheet is not shown on the card after the closing line');
    const sheet = $('rmSheet').textContent;
    if (!sheet.includes(s0.opts[1][lang])) problems.push('the sheet does not print the tapped answer verbatim');
    if (!sheet.includes("<3 warm like abuela's kitchen")) problems.push('the sheet does not print her typed words verbatim');
    if (!sheet.includes(U.saidOut)) problems.push('the sheet does not say which answer she wants to give out loud');
    if (!sheet.includes(heroName)) problems.push('the sheet does not carry the player\'s name');
    if (/(^|\n)#|\*\*/.test(sheet)) problems.push('the sheet shows Markdown marks to the player');
    if ($('rmBar').hidden || $('rmCopy').hidden || $('rmBack').hidden || $('rmAgain').hidden) problems.push('the sheet card is missing Copy / Ask me again / Back');
    if (!$('next').hidden) problems.push('the quest Next button appeared on the interview (it can trigger a chapter ending)');
    if (hasSay(n0)) problems.push('a host with every question answered still shows ❗');
    const h1 = I.hosts[1];
    if (h1) {
      const n1 = WORLDS[h1.world].npcs.find(n => roomHosts[n.npc] && roomHosts[n.npc].id === h1.id);
      if (!n1 || !hasSay(n1)) problems.push('the second host lost the ❗ before being answered');
      if (!sheet.includes(U.unanswered)) problems.push('the sheet does not list what is still unanswered');
    }
    // nothing was graded, paid, or logged
    if (xp !== before.xp || JSON.stringify(marks) !== before.marks || dlog.length !== before.dl || done.size !== before.done) problems.push('the interview touched XP, marks, the play log or done — it must grade nothing');
    // "ask me again" starts over with her earlier tap marked; a new tap keeps the old one as history
    $('rmAgain').click();
    if ($('q').textContent !== s0.q[lang]) problems.push('"ask me again" did not start from the first question');
    btns = [...$('choices').children];
    if (!btns[1] || !btns[1].classList.contains('was')) problems.push('her earlier answer is not marked when re-asked');
    btns[0].click(); await wait(450);
    const a0 = rec().a[h0.id + ':' + s0.id];
    if (!a0 || a0.pick !== 0 || !a0.hist || !a0.hist.length) problems.push('re-answering overwrote the earlier tap without keeping it');
    $('rmLater').click();
    // the other language re-labels the sheet; her words stay
    const lang0 = lang; lang = lang0 === 'en' ? 'es' : 'en'; applyLang();
    const sheet2 = roomSheet();
    if (!sheet2.includes(s0.q[lang]) || !sheet2.includes("<3 warm like abuela's kitchen")) problems.push('the sheet in the other language lost a label or her words');
    lang = lang0; applyLang();
    // Export gains a "The room" tab, labelled, showing the same sheet
    $('openExp').click();
    if ($('exTabRoom').hidden || $('exTabRoom').textContent !== U.tab) problems.push('Export has no "The room" tab');
    $('exTabRoom').click();
    if ($('exArea').value !== roomSheet()) problems.push('the Export tab does not show the sheet');
    $('exClose').click();
    // restart never wipes it (nothing you make gets taken away)
    const keep = localStorage.getItem('mqroom');
    const b = $('replay'); b.click(); b.click();
    if (localStorage.getItem('mqroom') !== keep) problems.push('restart touched her answers');
    // put things back
    world = before.world; px = fx = before.px; py = fy = before.py; held = null; moving = false; hearts = 3;
    $('card').hidden = true; $('world').hidden = false; $('settings').hidden = true; setWorldTag(); checkTalk();
    return problems;
  });
  fails.push(...room);

  // ---- the off switch: a pack that declares no interview gets no interview ----
  // Same engine, room.js blocked at load: no page error, no hosts, no tab, no storage.
  {
    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage({ viewport: { width: 480, height: 900 } });
    const errs = [], w2 = [];
    p2.on('pageerror', e => errs.push(e.message));
    p2.on('console', m => { if (m.type() === 'warning') w2.push(m.text()); });
    await p2.route('**', r => { const u = r.request().url(); if (!u.startsWith('file://') || /content\/meridian\/room\.js$/.test(u)) return r.abort(); r.continue(); });
    await p2.goto(index); await p2.waitForTimeout(1200);
    if (errs.length) fails.push('with no INTERVIEW declared the page errors: ' + errs.join(' | '));
    if (w2.some(w => /^ROOM/.test(w))) fails.push('with no INTERVIEW declared the engine still warns about hosts');
    const off = await p2.evaluate(() => {
      const problems = [];
      if (typeof INTERVIEW !== 'undefined') return ['room.js still loaded — the off-switch test is not testing anything'];
      if (typeof RM !== 'function' || typeof roomHosts === 'undefined') return ['the engine has no room seam (RM / roomHosts)'];
      if (RM()) problems.push('RM() is not empty with no pack declaration');
      if (Object.values(WORLDS).some(w => w.npcs.some(n => roomHosts[n.npc]))) problems.push('hosts were placed with nothing declared');
      if (localStorage.getItem('mqroom')) problems.push('mqroom was written with nothing declared');
      document.querySelector('.classes button[data-c="architect"]').click(); document.getElementById('begin').click();
      document.getElementById('openExp').click();
      if (!document.getElementById('exTabRoom').hidden) problems.push('the Export tab "The room" shows with nothing declared');
      document.getElementById('exClose').click();
      world = 'f2'; px = fx = 11; py = fy = 8; checkTalk();
      if (!document.getElementById('talk').hidden) problems.push('a Talk button appeared upstairs with nobody declared');
      return problems;
    });
    fails.push(...off);
    await ctx2.close();
  }

  // ---- the version is on the opening page, not only buried in Settings ----
  // Owner 2026-09-02: "move the version to the first/opening page so i know which im
  // using. also keep in settings but i want it there." Both must show GAMEV exactly.
  const ver = await page.evaluate(() => {
    const problems = [];
    const a = document.getElementById('verIntro'), b = document.getElementById('verTag');
    if (!a) problems.push('no #verIntro on the opening page');
    else if (!a.textContent.includes(GAMEV)) problems.push(`opening page shows "${a.textContent}", not ${GAMEV}`);
    else if (!document.getElementById('intro').contains(a)) problems.push('#verIntro is not inside the intro panel');
    if (!b || !b.textContent.includes(GAMEV)) problems.push('Settings no longer shows the version');
    return problems;
  });
  fails.push(...ver);

  // ---- the camera the pack asks for is the camera you get, and it sticks ----
  const cam = await page.evaluate(() => {
    const problems = [];
    if (typeof CAMDEF !== 'undefined' && !CAMS.includes(CAMDEF))
      problems.push(`CAMDEF "${CAMDEF}" is not a camera the engine accepts`);
    if (typeof CAMDEF !== 'undefined' && camMode !== CAMDEF && !localStorage.getItem('mqcam'))
      problems.push(`the pack asked for camera "${CAMDEF}" and booted into "${camMode}"`);
    // every camera must survive a save/restore round trip — camSet writes it, boot reads it.
    // These were two separate whitelists and both omitted "3d", so a 3D choice was
    // written and then silently discarded on the next load.
    CAMS.forEach(m => {
      camSet(m);
      let stored = null; try { stored = localStorage.getItem('mqcam'); } catch (e) {}
      if (stored !== m) problems.push(`camera "${m}" was not stored`);
      if (!CAMS.includes(stored)) problems.push(`camera "${m}" is stored but boot would reject it`);
    });
    camSet(CAMDEF);
    return problems;
  });
  fails.push(...cam);

  // ---- portability: the shared engine must not know one pack's content ----
  // The engine is never forked — [partner]'s game is a different content pack on the same
  // engine (docs/OWNER.md). So a Meridian name or a Meridian quest index living in
  // engine/ is a bug for her pack, not a style nit. This is the guard that keeps the
  // GROWTH/TILEART/DOORS seams from quietly leaking back.
  {
    const NAMES = ['mercado', 'chelo', 'nando', 'perla', 'chava', 'frijol', 'obra',
                   'cocina', 'xochi', 'lupe', 'guero', 'rosa', 'chuy', 'tovar', 'priya',
                   'canela', 'robles', 'jacaranda', 'muertos', 'otono', 'otoño', 'nacho',
                   'tacho', 'yesenia', 'moy', 'licha', 'tito', 'vero', 'chente', 'karla', 'nolasco', 'bere',
                   'espiga', 'velazquez', 'tuerca', 'bolillo', 'pelusa', 'timbre', 'taller'];
    // every file under engine/ is the same engine, so all of them are held to the same rule
    for (const base of engineFiles(fails)) {
      const f = 'engine/' + base;
      const src = fs.readFileSync(path.join(ENGINE_DIR, base), 'utf8');
      // blank out comments first — block comments span lines, so this cannot be
      // done per-line. Newlines are preserved so reported line numbers stay true.
      const bare = src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
                      .replace(/\/\/[^\n]*/g, '');
      const rawLines = src.split('\n'); // the UNstripped source: some things hide in comments
      bare.split('\n').forEach((code, i) => {
        NAMES.forEach(n => {
          if (new RegExp(n, 'i').test(code))
            fails.push(`portability: ${f}:${i + 1} names "${n}" in code — content belongs in the pack`);
        });
        // #25 (mq-v71): the engine reads ROLES from the pack's PLACES table; a world id spelled
        // in engine code is Meridian's room leaking into every other world. The two default
        // tables (PLDEF, ANIDEF) are the one place the ids may live.
        if (/\bworld\s*(?:===|!==|=|:)\s*"[a-z0-9]+"/.test(code) && !/\b(PLDEF|ANIDEF)=/.test(code))
          fails.push(`portability: ${f}:${i + 1} compares or sets world to a literal id — read it from PL (the PLACES seam)`);
        if (f === 'engine/engine3d.js' && /catch\(e\)\{\}/.test(code))
          fails.push(`${f}:${i + 1} swallows an error — route it through t3Note (#24)`);
        // A deliberate break left behind. 2026-09-10: an agent doing mutation testing replaced
        // `setTimeout(sizeCanvas,80)` and the fullscreenchange listener with `/*MUTANT*/` to find
        // out whether any suite noticed, and did not put them back. It was caught by reading
        // `git status --short` before a commit — which is the discipline, and this is the net under
        // it, because the discipline is a human habit and the net is not. Broken fullscreen would
        // have shipped: docs/QA-PASS.md E1 is already a fullscreen escape.
        // read the RAW line, not the comment-stripped one: a mutant marker IS a comment, so the
        // first version of this check could not see the thing it was written for. Proved by
        // planting one and watching it pass — the same class of mistake as the guarantee scan that
        // could not see the town (docs/QA-PASS.md E5). Check the noun you actually mean.
        if (/\bMUTANT\b|\bDELIBERATELY BROKEN\b/.test(rawLines[i] || ''))
          fails.push(`${f}:${i + 1} still carries a deliberate break left by a test or an agent — put the real code back`);
        if (/WORLDS\.[a-z][a-z0-9]\b/.test(code) && !/\b(PLDEF|ANIDEF)=/.test(code))
          fails.push(`portability: ${f}:${i + 1} reaches WORLDS.<id> by name — read the id from PL`);
      });
    }
  }

  // ---- 20. the owner's 2026-09-03 phone/laptop reports, each red first ----
  {
    const r = await page.evaluate(() => {
      const problems = [];
      // the save loader must carry the district counter, the grades and the toasts seen
      const sv = sanitizeSave({ n: 'Keep', cs: 2, mk: { 1: 3, 2: 1 }, so: ['tallerToast'], v: 2 });
      if (!sv || sv.cs !== 2) problems.push('sanitizeSave drops cs (the district counter) — the last ending replays on every open');
      if (!sv || !sv.mk || sv.mk[1] !== 3) problems.push('sanitizeSave drops mk (the grades)');
      if (!sv || !sv.so || sv.so[0] !== 'tallerToast') problems.push('sanitizeSave drops so (opening toasts seen)');
      if (!sv || sv.v !== 2) problems.push('sanitizeSave drops the save version');
      // keys: capitals and physical key codes walk too
      if (typeof keyDir !== 'function' || keyDir({ key: 'W' }) !== 'up' || keyDir({ key: 'Dead', code: 'KeyA' }) !== 'left') problems.push('WASD with caps lock or a non-QWERTY layout does not walk');
      // 3D: an animal is painted for the camera stop, not the map
      if (typeof t3ScreenFace !== 'function' || typeof T3 === 'undefined' || !T3) problems.push('no t3ScreenFace');
      else { const y0 = T3.yaw;
        T3.yaw = 0; if (t3ScreenFace({ face: 1 }) !== 1) problems.push('screen face at the south stop');
        T3.yaw = Math.PI; if (t3ScreenFace({ face: 1 }) !== -1) problems.push('a dog facing world +x is still painted facing screen-right from the north stop (the ball behind him)');
        T3.yaw = Math.PI / 2; if (t3ScreenFace({ face: -1, dx: 0, dy: -1 }) !== 1) problems.push('a dog walking north with the camera east should face screen-right');
        if (t3ScreenDir('up') !== 'right' || t3ScreenDir('left') !== 'up') problems.push('hero direction world→screen at the east stop: ' + t3ScreenDir('up') + '/' + t3ScreenDir('left'));
        T3.yaw = Math.PI; if (t3ScreenDir('up') !== 'down') problems.push('hero walking toward the north camera shows their back');
        T3.yaw = y0; }
      // the curtain: the veil goes up, the change lands behind it, the veil comes down
      if (!document.getElementById('veil')) problems.push('no #veil for the growth curtain');
      return problems;
    });
    fails.push(...r);
    const curt = await page.evaluate(() => new Promise(res => {
      let applied = false; const v = document.getElementById('veil');
      curtain(() => { applied = v.classList.contains('on'); }, () => res({ applied, down: !v.classList.contains('on') }));
      setTimeout(() => res({ timeout: true }), 3000);
    }));
    if (curt.timeout || !curt.applied || !curt.down) fails.push('the growth curtain did not apply the change behind the veil: ' + JSON.stringify(curt));
    // 3D: every piece of furniture in La Cocina STANDS UP — it is not a picture — and a plant is not a box.
    /* This asked `boxes >= 1` from 2026-09-07, when the only cure for flat furniture was a side view and a
       box. The `mesh` view (2026-09-21) is a better cure and it DELETES the box, so by crew iteration 12 the
       stove `V` was the last box left in the room and the count fell to zero the moment it got a shape —
       the guard went red on a room where every single thing had just been improved. `box` was a PROXY for
       "stands up as a thing with sides"; a mesh answers that noun too. So the demand is derived from what
       the room itself lays (docs/POSTMORTEM.md, the owner: "can we make the guards smarter instead of just
       making them notes?"): EVERY furniture/appliance glyph on La Cocina's map must come back as a box or
       as a shape, and none of them as a billboard. That is strictly more than the old count of one — it
       names the glyph that failed — and it cannot be satisfied by one lucky table. Planted both ways
       (la mueblería, crew iteration 12): with `V`'s mesh and side view taken away at runtime it prints
       'La Cocina lays KTVW and V does not stand up in 3D — a picture, not a thing with sides', and with
       the room as it ships it prints nothing. */
    const b3 = await page.evaluate(async () => {
      if (typeof T3 === 'undefined' || !T3 || T3.fail) return null;
      camSet('3d'); world = 'lc'; px = fx = 2; py = fy = 2; moving = false; held = null;
      await new Promise(r => setTimeout(r, 700));
      if (!T3.group) return { none: true };
      let boxes = 0, meshes = 0, boxG = new Set(), stood = new Set(), flatG = new Set();
      T3.group.traverse(o => { const u = o.userData || {};
        if (u.box) { boxes++; boxG.add(u.g); stood.add(u.g); }
        if (u.mesh && u.g !== undefined) { meshes++; stood.add(u.g); }
        if (u.flat && u.g !== undefined) flatG.add(u.g); });
      const w = CW(), want = new Set();
      for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) {
        const g = w.rows[y][x], k = (TILES[g] || {}).kind;
        if (k === 'furniture' || k === 'appliance') want.add(g); }
      return { boxes, meshes, glyphs: [...boxG].join(''), want: [...want].sort().join(''),
               missing: [...want].filter(g => !stood.has(g)).sort().join(''), flat: [...flatG].join('') };
    });
    if (b3 === null) { /* no WebGL here: the shape rule is still checked by the code path above */ }
    else if (b3.none) fails.push('La Cocina did not build a 3D scene at all: ' + JSON.stringify(b3));
    else if (!b3.want) fails.push('La Cocina lays no furniture at all — this guard measured nothing: ' + JSON.stringify(b3));
    else if (b3.missing) fails.push('La Cocina lays ' + b3.want + ' and ' + b3.missing + ' does not stand up in 3D — a picture, not a thing with sides: ' + JSON.stringify(b3));
    else if (b3.glyphs.includes('P')) fails.push('a plant became a box');

    /* ---- EVERY MARIGOLD HAS SOMETHING DARK BEHIND IT, AND IT IS WIDER THAN THE FLOWER ----
       The owner has come back about the marigolds four times — "the marigolds can use another try",
       "everything looks good except the marigolds", and on 2026-09-22 "the marigold decor is also not
       very well defined". Three of the fixes before this one changed a SIZE (docs/POSTMORTEM.md §1:
       when the second fix is the same KIND as the first, the cause is not the thing you keep
       changing). The cause is the light. DAY_AMB 0.66 and DAY_SUN 0.42 give a Lambert face 1.00 /
       0.88 / 0.78 / 0.66 and nothing else, so FORM cannot separate two orange things — only value
       can, and value has to be painted into the parts. In the bed that happened by accident: the
       near-black foliage mound sits under the heads. Used as DECOR — the tree's garland, the altar's
       arch, the lid of the calaverita — a head hangs against pale plaster with nothing dark anywhere
       near it, and a dozen orange lobes average to a smear. The bakery found the same law and the
       answer there was the PACKAGING: a polvorón reads because its paper cup is WIDER than the
       cookie. So every head meshMarigold grows now carries its own dark collar, and this is the
       guard on it.

       WHAT IT READS, said plainly, because the extraction is the proxy (docs/REGRESSION.md §3): it
       reads the PARTS LIST the pack returns, not the screen. It therefore knows nothing about
       occlusion, about the camera, about whether the collar is actually visible at 40°, or about
       tc()'s theme tint — it compares the pack's own hexes before any of that. What it does read is
       the one thing four attempts did not have: that under every petal there is a part darker than
       every petal of that head, dark in absolute terms, and wider than that head's petals reach.
       The picture is still the judge, and the picture is not in this repository: it is rendered by
       standing the hero at a flower bed and looking, which is what settled this and what will
       settle the next one. (This line used to cite a .png under scratchpad/ as if it were evidence
       a reader could open. Scratch is not the record — nothing outside the repository is.)

       Red first, on the tree as it stood before the collar existed: 'the marigold on "b" at 17,10 has
       nothing dark behind it: 12 heads and 0 collars'. A WRONG FIX that would pass a weaker draft —
       marking a small pale part collar:true — fails on both the width and the luma clause; shrinking
       the collar under the petals fails on width; painting it a mid green (#4E8A58, luma 115) fails
       the absolute clause.

       AND IT NAMES ITS SUBJECTS, because a total is not coverage. The first draft's only
       anti-vacuity clause was "did we find ANY petals", and the flower bed alone supplies 300 of the
       538 — so the three DECOR cases this guard was written for (the tree's garland, the ofrenda's
       arch, the marigold on the tamalera's lid) could every one of them stop being laid and the
       guard would still have gone green on the bed. That is the vacuity trap in .claude/skills/guard
       word for word: nothing to measure is a RED, never a pass. MARI_FLOOR below is the list of
       subjects Meridian must actually reach, with the number of heads each one had when this was
       written; fewer than that, or the subject missing entirely, is a failure that names it. This
       list is Meridian's, and test/smoke.js is Meridian's suite — a pack that legitimately stops
       laying one of these edits the floor, and the edit is the point. The coverage is printed on a
       GREEN run too, so nobody has to fail the build to find out what was measured. */
    const MARI_FLOOR = { 'b': 12, 'J': 6, 'ʘ': 1, 'prop:ofrenda': 9 };
    const mari = await page.evaluate((FLOOR) => {
      if (typeof tileView !== 'function' || typeof WORLDS === 'undefined') return { seam: true };
      const keep = seasonPick, out = { heads: 0, petals: 0, bad: [], seen: [], found: {} };
      const L = h => { const n = parseInt(String(h).slice(1), 16);
        return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); };
      try {
        /* in season, so the tree's garland and the altar's arch exist to be measured */
        if (typeof seasonSet === 'function') { const m = Object.keys(SEAS()).find(k => (SEAS()[k].art || {}).papel); if (m) seasonSet(m); }
        /* every glyph actually laid in a world that answers the `mesh` view, plus the season's props */
        const laid = new Set(); Object.entries(WORLDS).forEach(([wid, w]) => w.rows.forEach((r, y) => r.split('').forEach((ch, x) => laid.add(ch + '|' + wid + '|' + x + '|' + y))));
        const first = {}; [...laid].forEach(k => { const g = k.split('|')[0]; if (!first[g]) first[g] = k; });
        const subjects = Object.values(first).map(k => { const [g, wid, x, y] = k.split('|'); return { g, x: +x, y: +y }; })
          .concat([{ g: 'prop:ofrenda', x: 0, y: 0 }]);
        subjects.forEach(({ g, x, y }) => {
          const mv = tileView(g, 'mesh'); if (!mv) return;
          let parts; try { parts = typeof mv === 'function' ? mv({ x, y }) : mv; } catch (e) { return; }
          if (!Array.isArray(parts)) return;
          const collars = parts.filter(p => p && p.collar), petals = parts.filter(p => p && p.petal);
          if (!collars.length && !petals.length) return;
          out.seen.push(g + ':' + collars.length + 'c/' + petals.length + 'p');
          out.found[g] = collars.length;
          out.heads += collars.length; out.petals += petals.length;
          if (!collars.length) { out.bad.push('the marigold on "' + g + '" at ' + x + ',' + y + ' has nothing dark behind it: ' + (petals.length ? Math.round(petals.length / 25) + '-odd heads' : 'no heads') + ' and 0 collars'); return; }
          const near = collars.map(() => []);
          petals.forEach(p => { let bi = 0, bd = Infinity;
            collars.forEach((c, i) => { const d = Math.hypot(p.x - c.x, p.z - c.z); if (d < bd) { bd = d; bi = i; } });
            near[bi].push(p); });
          collars.forEach((c, i) => {
            const mine = near[i]; if (!mine.length) { out.bad.push('a collar on "' + g + '" has no petals over it — it is dark for nothing'); return; }
            const cl = L(c.c), half = c.r * (c.sx === undefined ? 1 : c.sx);
            const reach = Math.max(...mine.map(p => Math.hypot(p.x - c.x, p.z - c.z) + p.r * Math.max(p.sx === undefined ? 1 : p.sx, p.sz === undefined ? 1 : p.sz)));
            const lightest = Math.min(...mine.map(p => L(p.c)));
            if (half < reach) out.bad.push('a marigold on "' + g + '" is wider than the dark behind it (petals reach ' + reach.toFixed(3) + ', the collar is ' + half.toFixed(3) + ') — at 35 px the flower and the one beside it are one orange smear');
            else if (cl >= 60 || cl >= lightest) out.bad.push('a marigold on "' + g + '" has a collar the same value as its petals (collar ' + c.c + ' luma ' + Math.round(cl) + ', darkest petal luma ' + Math.round(lightest) + ') — there is nothing for the eye to cut the flower out against');
          });
        });
        /* COVERAGE, not a total: each subject this pack promises must have been reached, and with
           at least as many heads as it had. A subject that stopped being laid, or that now returns
           parts with neither a collar nor a petal, lands here instead of vanishing into a big
           green number somebody else's flower bed paid for. */
        Object.keys(FLOOR).forEach(g => {
          const got = out.found[g];
          if (got === undefined) out.bad.unshift('the marigold guard never reached "' + g + '" at all — it is one of the ' + Object.keys(FLOOR).length + ' places this pack puts marigolds and it measured NONE of them there, so this guard was passing on the flower bed alone');
          else if (got < FLOOR[g]) out.bad.unshift('"' + g + '" grows ' + got + ' marigold heads and it grew ' + FLOOR[g] + ' when this guard was written — either a flower was dropped or the floor in MARI_FLOOR needs moving, and somebody has to look at which');
        });
      } finally { if (typeof seasonSet === 'function') seasonSet(keep); }
      return out;
    }, MARI_FLOOR);
    const mariSeen = mari.seen ? mari.seen.join(' ') : '';
    if (mari.seam) fails.push('the marigold guard could not reach tileView or WORLDS at all — it measured nothing');
    else if (!mari.petals) fails.push('the marigold guard found no marigold petals anywhere in this pack — nothing was measured, which is a red and not a pass');
    else if (mari.bad.length) fails.push(mari.bad[0] + ' [' + mari.bad.length + ' like it; ' + mari.heads + ' collars over ' + mari.petals + ' petals; seen: ' + mariSeen + ']');
    else console.log('  MARIGOLDS: ' + mari.heads + ' heads, each with a dark collar wider than its own petals — ' + mariSeen);
    await page.evaluate(() => { world = 'hq'; px = fx = 10; py = fy = 11; camSet('3d'); });

    // Continue with a last visit due: it plays once, the street is not blank, the counter persists
    // pagehide writes the loaded hero over anything injected, so inject on a page with nobody loaded
    const inject = async sv => { await page.reload(); await page.waitForTimeout(500);
      await page.evaluate(sv => localStorage.setItem('mq1', JSON.stringify(sv)), sv);
      await page.reload(); await page.waitForTimeout(900); };
    await page.evaluate(() => localStorage.setItem('mqctl', 'joy'));
    /* 15 is in the list since #208: a district closes on its count AND on the visit that ends it
       (chClose — the last quest it lists), so thirteen answers that skip the closing quest no longer
       bring a last visit due. The fixture's job is "a save with a last visit due", and what that
       means changed; the numbers follow the definition rather than the definition following them. */
    await inject({ n: 'Keep', c: '', lk: {}, xp: 230, he: 3, d: [0,1,2,3,4,5,6,7,8,9,10,11,12,15], px: 6, py: 12, tr: 0, fq: 0, w: 'st', wr: {}, wc: {}, qa: {}, cs: 0, mk: {}, so: [], v: 2 });
    await page.click('#continueBtn'); await page.waitForTimeout(300);
    let st = await page.evaluate(() => ({ end: $('end').hidden }));
    if (st.end) fails.push('a last visit due at Continue did not play');
    await page.click('#endGo'); await page.waitForTimeout(400);
    st = await page.evaluate(() => ({ end: $('end').hidden, world: $('world').hidden, h: parseFloat(cv.style.height) || 0, joy: $('joy').hidden, cs: chSeen, saved: (JSON.parse(localStorage.getItem('mq1')) || {}).cs }));
    if (!st.end || st.world) fails.push('after "Out to the street" the world is not showing');
    if (!(st.h > 0)) fails.push('the street is blank after a last visit claimed from Continue (canvas height ' + st.h + ')');
    if (st.joy) fails.push('the joystick is missing after a last visit claimed from Continue');
    if (st.cs !== 1 || st.saved !== 1) fails.push('the district counter did not persist: memory ' + st.cs + ', saved ' + st.saved);
    await page.reload(); await page.waitForTimeout(900);
    await page.click('#continueBtn'); await page.waitForTimeout(300);
    st = await page.evaluate(() => ({ end: $('end').hidden, cs: chSeen }));
    if (!st.end) fails.push('the last visit played again on the next open');
    if (st.cs !== 1) fails.push('chSeen after reopening: ' + st.cs);
    // a pre-fix save: played through the mercado, counter reset to 0 by the bug. Week One is
    // counted as claimed (the mercado was started); the mercado's last visit is still due
    await inject({ n: 'Keep', c: '', lk: {}, xp: 350, he: 3, d: [...Array(24).keys()], px: 6, py: 12, tr: 0, fq: 0, w: 'st', wr: {}, wc: {}, qa: {}, cs: 0, mk: {}, so: [] });
    await page.click('#continueBtn'); await page.waitForTimeout(300);
    /* WHICH ending played is asked by its KEY, not by its words. This matched the printed prose
       against /^Saturday, closing/ — a proxy for the string key, and one that would have gone red
       the moment anybody rewrote the mercado's last visit, which is exactly what #208 asks for. A
       guard that pins prose is a guard that forbids editing it. */
    st = await page.evaluate(() => {
      const t = UI[lang], c = CHAPTERS[1], pre = c.epi || 'epi';
      const shown = $('epi').textContent, mine = [t[pre + '1'], t[pre + '2'], t[pre + '3']];
      return { end: $('end').hidden, cs: chSeen, mine: mine.indexOf(shown), title: $('endTitle').textContent,
               trade: (typeof chTrade === 'function') ? chTrade(1) : null, rank: lvlName(), head: shown.slice(0, 40) };
    });
    if (st.cs !== 1) fails.push('a damaged save was not rebuilt: chSeen ' + st.cs);
    if (st.end) fails.push('the mercado last visit, never claimed on the damaged save, did not play');
    if (st.mine < 0) fails.push('the wrong last visit played for the damaged save — the text on screen is not one of the mercado\'s three: ' + st.head);
    /* T3: the last visit says what you PRACTISED, never what rank you are. It printed
       "🏆 AI LEGEND" over the closing scene of a grocer's. */
    if (/🏆/.test(st.title)) fails.push('the last visit is still crowned with a trophy: ' + st.title);
    if (st.title === st.rank) fails.push('the last visit is titled with the global rank ("' + st.rank + '") instead of the trade the district was practice for');
    if (st.trade && st.title !== st.trade) fails.push('the last visit is titled "' + st.title + '" and the district was practice for "' + st.trade + '"');
    await page.click('#endGo'); await page.waitForTimeout(400);
    st = await page.evaluate(() => ({ cs: chSeen, seen: seenOpen.has('tallerToast'), v: (JSON.parse(localStorage.getItem('mq1')) || {}).v }));
    if (st.cs !== 2 || !st.seen || st.v !== 2) fails.push('after the mercado last visit: ' + JSON.stringify(st));
    // a lot that opened while the phone was away is announced once at Continue
    await inject({ n: 'Keep', c: '', lk: {}, xp: 350, he: 3, d: [...Array(24).keys()], px: 6, py: 12, tr: 0, fq: 0, w: 'st', wr: {}, wc: {}, qa: {}, cs: 2, mk: {}, so: [], v: 2 });
    await page.click('#continueBtn'); await page.waitForTimeout(1900);
    st = await page.evaluate(() => ({ seen: seenOpen.has('tallerToast'), saved: (JSON.parse(localStorage.getItem('mq1')) || {}).so }));
    if (!st.seen || !(st.saved || []).includes('tallerToast')) fails.push('the taller opening while away was not announced once: ' + JSON.stringify(st));
    await page.reload(); await page.waitForTimeout(900);
    await page.click('#continueBtn'); await page.waitForTimeout(300);
  }

  // ---- 21. the activity record holds, sits left, and every spoken line is signed ----
  {
    const r = await page.evaluate(async () => {
      const problems = [], tk = document.getElementById('ticker');
      // it lives on the left rail now, under the XP pill, not over theright  buttons
      const cs = getComputedStyle(tk);
      if (cs.left !== '10px') problems.push('the record is not on the left rail: left=' + cs.left);
      if (cs.right === '10px') problems.push('the record is still pinned right');
      // every spoken line carries the speaker
      if (typeof sayAs !== 'function') problems.push('no sayAs()');
      else {
        const line = sayAs('chelo', 'the tomatoes turn on Tuesday');
        if (!line.includes(npcName('chelo').split(' ·')[0])) problems.push('a spoken line is unsigned: ' + line);
        if (!line.includes('the tomatoes turn on Tuesday')) problems.push('sayAs dropped the line');
      }
      // three activities: the oldest is pushed out, the last two stay
      tk.hidden = true; tickerLines.length = 0;
      toast('ONE', 300); toast('TWO', 300); toast('THREE', 300);
      if (tickerLines.length !== 2 || tickerLines[0] !== 'TWO' || tickerLines[1] !== 'THREE')
        problems.push('the record does not keep exactly the last two: ' + JSON.stringify(tickerLines));
      return problems;
    });
    fails.push(...r);
    // no timer: it is still on screen long after the toast under it has gone
    await page.waitForTimeout(5200);
    const held = await page.evaluate(() => ({ hidden: document.getElementById('ticker').hidden, lines: tickerLines.length }));
    if (held.hidden || held.lines !== 2) fails.push('the record cleared itself on a timer: ' + JSON.stringify(held));
    // tapping it is still how it goes away.
    // THE NOUN IS "WERE THE LINES THAT WERE THERE DISMISSED", not "is the record empty an instant
    // later". CI on 2026-09-20 read {hidden:false, lines:1} here on a commit that touched no engine
    // code: the click had cleared the two lines synchronously (engine.js, grep `"ticker").addEventListener`)
    // and a townsperson spoke in the gap before the read, which re-showed the record with one NEW
    // line. The game talking is not a failed dismiss. So: remember what was showing, click, and
    // insist none of THOSE survive — a line that arrived after the click is reported, never failed.
    const before = await page.evaluate(() => tickerLines.slice());
    await page.evaluate(() => document.getElementById('ticker').click());
    const tapped = await page.evaluate(() => ({ hidden: document.getElementById('ticker').hidden, lines: tickerLines.slice() }));
    const survived = tapped.lines.filter(l => before.includes(l));
    if (survived.length) fails.push('tapping the record did not dismiss it: ' + JSON.stringify({ hidden: tapped.hidden, survived }));
    else if (tapped.lines.length) console.log('  COUNT-ONLY: the record was dismissed and the town spoke ' + tapped.lines.length + ' new line(s) before the read — timing, not a fault');
    else if (!tapped.hidden) fails.push('tapping the record emptied it but left it showing: ' + JSON.stringify(tapped));
    // a tile's flavour line is NOT signed — the crosswalk is not a person
    const flav = await page.evaluate(() => { tickerLines.length = 0; const f = (UI.en.flavor['-'] || UI.en.flavor['.'] || ['x'])[0]; toast(f, 300); return tickerLines[0]; });
    if (/^💬 [^:]+:/.test(flav || '')) fails.push('a tile flavour line was signed as if a person said it: ' + flav);
  }

  // ---- 22. la junta, batch A+B: the stairwell speaks, the arrow finds the stairs,
  //          the barrio picks its tools back up ----
  {
    // the marker asks "does this lead somewhere", not "is it in the DOORS list"
    const marks = await page.evaluate(() => {
      world = 'hq'; px = fx = 13; py = fy = 14; moving = false; held = null; /* on the flight, below the head */
      const m = doorMarks();
      return { has: m.some(d => d.x === 14 && d.y === 14 && d.ch === '▲'), all: m.map(d => d.ch).join('') };
    });
    if (!marks.has) fails.push('the HQ stairs still wear no marker: ' + JSON.stringify(marks));
    const bogus = await page.evaluate(() => doorMarks().filter(d => !PORTALS[world][d.ch]).length);
    if (bogus) fails.push('the marker offered ' + bogus + ' tiles that lead nowhere');

    // the doorstep nudge: the room on the other side says who is waiting, once
    const nudge = await page.evaluate(async () => {
      const out = {};
      roomAns = {}; nudgeW = ''; nudged = new Set(); tickerLines.length = 0;
      document.getElementById('world').hidden = false;
      world = 'hq'; px = fx = 13; py = fy = 14; /* on the flight, a step from the head */
      out.pendingUpstairs = worldPending('f2');
      portalNudge();
      out.first = tickerLines[tickerLines.length - 1] || '';
      tickerLines.length = 0;
      portalNudge();
      out.second = tickerLines.length;
      out.invite = (RM() && RM().invite && RM().invite.en) || '';
      nudgeW = ''; nudged = new Set(); tickerLines.length = 0;
      RM().hosts.forEach(h => h.steps.forEach(st => { roomAns[h.id + ':' + st.id] = 'x'; }));
      portalNudge();
      out.quiet = tickerLines.length;
      roomAns = {};
      return out;
    });
    if (!nudge.pendingUpstairs) fails.push('the engine does not know somebody is waiting upstairs');
    if (nudge.first !== nudge.invite) fails.push('the stairwell did not speak the pack invite: ' + JSON.stringify(nudge.first));
    if (nudge.second !== 0) fails.push('the doorstep nudge repeats itself - that is a to-do list');
    if (nudge.quiet !== 0) fails.push('the doorstep spoke about a room where nobody is waiting');

    const generic = await page.evaluate(() => typeof UI.en.waitingAt === 'function' && typeof UI.es.waitingAt === 'function'
      ? [UI.en.waitingAt('X'), UI.es.waitingAt('X')] : null);
    if (!generic || !generic[0].includes('X') || !generic[1].includes('X')) fails.push('waitingAt is missing or drops the place name in one language');

    // the job icon is drawn BESIDE the mark, never instead of it
    {
      const src = fs.readFileSync(path.join(__dirname, '..', 'engine', 'engine.js'), 'utf8')
                + fs.readFileSync(path.join(__dirname, '..', 'engine', 'engine3d.js'), 'utf8');
      if (/else[ \t\n]+drawEmote\(/.test(src)) fails.push('a camera still hides a trade behind the mark');
      const n = (src.replace(/function drawEmote\(/g, 'DEF(').match(/drawEmote\(n,/g) || []).length;
      if (n !== 4) fails.push('expected the job icon on all four camera paths, found ' + n);
    }
    // the icon's window is identity-sized now, not a 2.4s-in-13 flicker
    {
      const src = fs.readFileSync(path.join(__dirname, '..', 'engine', 'engine.js'), 'utf8');
      const win = src.match(/ph=\(\(nw\/1000\)[^;]*;[\s\S]{0,600}?if\(ph>=([\d.]+)\)return;/);
      if (!win) fails.push('could not read the job-icon window');
      else if (parseFloat(win[1]) < 5) fails.push('the job icon is still a flicker: ' + win[1] + 's of every 13');
    }

    // the theme stops washing the barrio into one shirt
    const tint = await page.evaluate(() => {
      const n = WORLDS.hq.npcs[0], base = lookOf(n);
      const clear = () => Object.keys(npcLookCache).forEach(k => delete npcLookCache[k]);
      clear(); tintCol = '#FF0000';
      const got = npcWhimsy(n).shirt;
      clear(); tintCol = null;
      return { got, at15: mixHex(base.shirt, '#FF0000', 0.15), at40: mixHex(base.shirt, '#FF0000', 0.4) };
    });
    if (tint.got !== tint.at15) fails.push('the shirt tint is not 0.15 (got ' + tint.got + ', 0.15 = ' + tint.at15 + ', old 0.4 = ' + tint.at40 + ')');

    const gold = await page.evaluate(() => (typeof MAPCOL !== 'undefined' && MAPCOL['1']) || null);
    if (!gold || gold.toUpperCase() !== '#E0B45C') fails.push('the map legend says stairs are gold; the plan paints them ' + gold);

    const gifts = await page.evaluate(() => {
      const f2 = WORLDS.f2, boxes = [];
      for (let y = 0; y < f2.H; y++) for (let x = 0; x < f2.W; x++) if (f2.rows0[y][x] === '□') boxes.push(x + ',' + y);
      const no = ribbons().find(r => r.id === 'gift-no');
      return { boxes, no: no && no.tiles, onBox: !!(no && no.tiles.every(t => boxes.includes(t[1] + ',' + t[0]))) };
    });
    if (!gifts.onBox) fails.push('the file cabinet does not land on the box by the stairs: ' + JSON.stringify(gifts));

    const flav = await page.evaluate(() => ['□', '|'].filter(g => !(UI.en.flavor[g] && UI.es.flavor[g])));
    if (flav.length) fails.push('no flavour line in both languages for: ' + flav.join(' '));

    await page.evaluate(() => { world = 'hq'; px = fx = 10; py = fy = 11; camSet('3d'); nudgeW = ''; nudged = new Set(); });
  }

  // ---- 23. the paper the city produces: readable objects, the wall, the machine ----
  {
    const st = await page.evaluate(() => {
      const problems = [];
      if (typeof READS === 'undefined' || typeof DOCS === 'undefined') return ['the pack declares no READS / DOCS'];
      // every readable spot points at a real document, in a real world, on a real tile
      READS.forEach(r => {
        if (!DOCS[r.doc]) problems.push('a readable spot points at a missing document: ' + r.doc);
        const w = WORLDS[r.world];
        if (!w) problems.push('a readable spot is in a world that does not exist: ' + r.world);
        else if (!w.rows[r.y] || w.rows[r.y][r.x] === undefined) problems.push('a readable spot is off the map: ' + r.world + ' ' + r.x + ',' + r.y);
      });
      // every document builds in both languages, without throwing, and titles exist in both
      const keep = lang;
      ['en', 'es'].forEach(L => { lang = L;
        Object.keys(DOCS).forEach(id => {
          const d = DOCS[id];
          if (!d.title || !d.title.en || !d.title.es) problems.push('document ' + id + ' has no title in both languages');
          const secs = docSections(id);
          if (!Array.isArray(secs) || !secs.length) problems.push('document ' + id + ' built nothing in ' + L);
          const md = docMarkdown(id);
          if (!md || md.indexOf('# ') !== 0) problems.push('document ' + id + ' produced no markdown in ' + L);
        });
      });
      lang = keep;
      if (!DOCUI.en || !DOCUI.es) problems.push('DOCUI is missing a language');
      return problems;
    });
    fails.push(...st);

    // the marker is there, and it does NOT clear once read — a thing you can read is a place
    const mk = await page.evaluate(() => {
      world = 'f2'; px = fx = 10; py = fy = 2; moving = false; held = null;
      const before = readMarks().length;
      docOpen('file'); document.getElementById('docClose').click();
      return { before, after: readMarks().length, marks: readMarks().map(r => r.doc) };
    });
    if (!mk.before) fails.push('no read marker beside the machine on the desk');
    // and every readable in the room is marked from where the game puts you, not from on top of it
    const far = await page.evaluate(() => {
      world = 'f2'; px = fx = 17; py = fy = 11; moving = false; held = null;   // the arrival tile by the stairs
      return { seen: readMarks().length, total: READS.filter(r => r.world === 'f2').length };
    });
    if (far.seen !== far.total) fails.push('standing where the game drops you in the office, only ' + far.seen + ' of ' + far.total + ' readable things wear a marker');
    if (mk.after !== mk.before) fails.push('the read marker cleared once read — that is a checklist, not a place');

    // the button appears one step away, names the document, and opens it
    const btn = await page.evaluate(() => {
      document.getElementById('world').hidden = false;
      world = 'f2'; px = fx = 10; py = fy = 2; moving = false; checkTalk();
      const b = document.getElementById('read');
      const out = { hidden: b.hidden, label: b.textContent, doc: b.dataset.doc };
      b.click();
      out.readerOpen = !document.getElementById('reader').hidden;
      out.title = document.getElementById('docTitle').textContent;
      out.body = document.getElementById('docBody').textContent.slice(0, 400);
      document.getElementById('docClose').click();
      out.closed = document.getElementById('reader').hidden;
      // and it is NOT offered from across the room
      px = fx = 10; py = fy = 8; checkTalk();
      out.farHidden = document.getElementById('read').hidden;
      return out;
    });
    if (btn.hidden) fails.push('no Read button beside a readable thing');
    if (!btn.readerOpen) fails.push('pressing Read opened nothing');
    if (!btn.title) fails.push('the document opened with no title');
    if (!/logged in|sesión abierta|desk|escritorio/i.test(btn.title + btn.body)) fails.push('the machine did not open the lead\'s file: ' + btn.title);
    if (!btn.closed) fails.push('the reader would not close');
    if (!btn.farHidden) fails.push('the Read button offers a thing you are not standing next to');

    // a district you have not worked is blank paper that says so, and never lists work
    const blankDoc = await page.evaluate(() => {
      const keepD = new Set(done), keepL = dlog.slice();
      done = new Set(); dlog.length = 0;
      const secs = docSections('taller'), md = docMarkdown('taller');
      done = keepD; dlog.length = 0; keepL.forEach(e => dlog.push(e));
      return { n: secs.length, txt: JSON.stringify(secs), md };
    });
    if (blankDoc.n > 3) fails.push('an unworked document is not blank paper: ' + blankDoc.n + ' sections');
    if (/Client|Cliente|Calls of record/.test(blankDoc.txt)) fails.push('an unworked document lists an engagement that never happened');

    // a district you HAVE worked prints your real answers, with the retry count
    const filled = await page.evaluate(() => {
      const keepL = dlog.slice(), keepD = new Set(done);
      dlog.length = 0;
      const ta = CHAPTERS.find(c => c.id === 'taller'), qi = ta.quests[0];
      dlog.push({ t: 1, quest: AQ()[qi].title, qi, npc: 'tacho', ask: 'PROBE-ASK', pick: 'PROBE-WRONG', concept: 'PROBE-CONCEPT', why: 'PROBE-WHY', result: 'bad' });
      dlog.push({ t: 2, quest: AQ()[qi].title, qi, npc: 'tacho', ask: 'PROBE-ASK', pick: 'PROBE-RIGHT', concept: 'PROBE-CONCEPT', why: 'PROBE-WHY', result: 'ok' });
      done.add(qi);
      const md = docMarkdown('taller');
      docOpen('taller');
      const body = document.getElementById('docBody').textContent;
      document.getElementById('docClose').click();
      dlog.length = 0; keepL.forEach(e => dlog.push(e)); done = keepD;
      return { md, body };
    });
    if (!/PROBE-RIGHT/.test(filled.body)) fails.push('the document does not show the answer you actually picked');
    if (/PROBE-WRONG/.test(filled.body)) fails.push('the document shows a superseded answer as the answer of record');
    if (!/\(2\)/.test(filled.body)) fails.push('the document hides that it took two tries');
    if (!/PROBE-RIGHT/.test(filled.md) || !/^# /.test(filled.md)) fails.push('the exported markdown is not the same document');
    if (!/PROBE-CONCEPT/.test(filled.md)) fails.push('the exported markdown drops the concept it taught');

    // the wall: six sheets of blank paper, and a district's ribbon pins its page over one
    const wall = await page.evaluate(() => {
      // count the blanks from the pristine map: paint only ever goes on, so a poster this
      // session already pinned will not go back to paper
      const before = (WORLDS.f2.rows0.join('').match(/▭/g) || []).length;
      const keep = chSeen; chSeen = 99; applyGrowth();
      const after = { blank: (WORLDS.f2.rows.join('').match(/▭/g) || []).length,
                      posted: (WORLDS.f2.rows.join('').match(/▤/g) || []).length };
      chSeen = keep; applyGrowth();
      return { before, after };
    });
    if (wall.before !== 6) fails.push('the office wall does not start with six blank sheets: ' + wall.before);
    if (wall.after.posted !== 6) fails.push('a closed city does not pin all six documents: ' + JSON.stringify(wall.after));

    await page.evaluate(() => { world = 'hq'; px = fx = 10; py = fy = 11; checkTalk(); });
  }

  // ---- 24. drawers that remember, and decor drawn in every camera ----
  {
    const dr = await page.evaluate(() => {
      const problems = [], ids = ['drwCtl', 'drwLook', 'drwSound', 'drwGame'];
      ids.forEach(id => { if (!document.getElementById(id)) problems.push('no settings drawer: ' + id); });
      // every control still lives inside exactly one drawer, and none was lost in the move
      ['lbCtl', 'optSwipe', 'optJoy', 'optPad', 'lbTheme', 'themeRow', 'camRow', 'seasonRow',
       'lbMusic', 'tuneRow', 'musMute', 'musVol', 'optEn', 'optEs', 'stkRow', 'admOff', 'admOn']
        .forEach(k => { const el = document.getElementById(k);
          if (!el) { problems.push('a settings control vanished: ' + k); return; }
          if (!el.closest('details.drawer')) problems.push(k + ' is not in a drawer'); });
      // the buttons that DO things are not settings and must never hide behind a drawer
      ['openExp', 'openLab', 'openTp', 'openMp', 'replay', 'closeSet'].forEach(k => {
        const el = document.getElementById(k);
        if (el && el.closest('details.drawer')) problems.push(k + ' was buried in a drawer — it is an action, not a setting'); });
      // both languages name every drawer
      ids.forEach(id => { const k = 'drw' + id.slice(3);
        if (!UI.en[k] || !UI.es[k]) problems.push('drawer ' + id + ' has no label in both languages'); });
      return problems;
    });
    fails.push(...dr);
    // closing one and reopening the game remembers it
    await page.evaluate(() => { document.getElementById('drwCtl').open = false; document.getElementById('drwSound').open = true; });
    await page.waitForTimeout(120);
    const saved = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('mqdrawers')); } catch (e) { return null; } });
    if (!saved || saved.drwCtl !== false || saved.drwSound !== true) fails.push('the drawers did not remember which are open: ' + JSON.stringify(saved));

    // decor is drawn in all four cameras — the mural was invisible in the two people play in
    const dec = await page.evaluate(() => {
      const problems = [];
      if (typeof DECOS === 'undefined' || !DECOS.length) return ['the pack declares no DECOR to check'];
      const src = drawIso.toString() + draw.toString() + drawFront.toString();
      ['drawIso', 'draw', 'drawFront'].forEach(() => {});
      if (!/DECOS/.test(drawIso.toString())) problems.push('the iso camera still skips decor');
      if (!/DECOS/.test(draw.toString()) && !/drawDecor/.test(draw.toString())) problems.push('the top camera skips decor');
      if (!/DECOS/.test(drawFront.toString())) problems.push('the front camera skips decor');
      return problems;
    });
    fails.push(...dec);
    // 3D: the mural becomes a real object on the wall it is painted on
    const d3 = await page.evaluate(async () => {
      if (typeof T3 === 'undefined' || !T3 || T3.fail) return null;
      const d = DECOS.find(x => x.world === 'st'); if (!d) return { none: true };
      camSet('3d'); world = 'st'; px = fx = d.x; py = fy = Math.min(d.y + 3, WORLDS.st.H - 2);
      moving = false; held = null;
      await new Promise(r => setTimeout(r, 800));
      if (!T3.group) return { none: true };
      let hit = null; T3.group.traverse(o => { if (o.userData && o.userData.deco) hit = { deco: o.userData.deco, y: +o.position.y.toFixed(2), isSprite: o.isSprite === true }; });
      return { hit, onSolid: SOLID.has(WORLDS.st.grid[d.y][d.x]) };
    });
    if (d3 && !d3.none) {
      if (!d3.hit) fails.push('decor is still missing from 3D — the camera the game boots into');
      else if (d3.onSolid && d3.hit.isSprite) fails.push('a mural on a wall became a billboard instead of paint on the wall');
    }
    await page.evaluate(() => { world = 'hq'; px = fx = 10; py = fy = 11; camSet('3d'); });
  }

  // ---- 25. the mural, the honest grade, and townsfolk who walk ----
  {
    const g = await page.evaluate(() => {
      const problems = [];
      if (typeof worldFlags !== 'function') return ['no worldFlags()'];
      const keepD = new Set(done), keepM = { ...marks };
      // nothing answered anywhere: every grade is 0, NOT a flawless 3
      done = new Set(); marks = {};
      let f = worldFlags();
      CHAPTERS.forEach(c => { if (f.grade[c.id] !== 0) problems.push('an untouched district grades ' + f.grade[c.id] + ' — not begun is not done well'); });
      // one clean answer: the district gets a real grade
      const ta = CHAPTERS.find(c => c.id === 'taller');
      done.add(ta.quests[0]); marks[ta.quests[0]] = 1;
      f = worldFlags();
      if (f.grade.taller !== 3) problems.push('a clean call did not grade the district: ' + f.grade.taller);
      if (f.grade.mercado !== 0) problems.push('answering in one district graded another');
      if (f.answered.taller !== 1) problems.push('worldFlags miscounts answered quests');
      done = keepD; marks = keepM;
      return problems;
    });
    fails.push(...g);

    // the wall: Nacho's piece plus one panel per district, all on solid tiles with street below
    const mural = await page.evaluate(() => {
      const problems = [];
      const panels = DECOS.filter(d => d.deco === 'panel');
      if (panels.length !== CHAPTERS.length) problems.push('the mural has ' + panels.length + ' panels for ' + CHAPTERS.length + ' districts');
      panels.forEach(d => {
        if (!CHAPTERS.some(c => c.id === d.id)) problems.push('a mural panel names a district that does not exist: ' + d.id);
        const w = WORLDS[d.world];
        if (!SOLID.has(w.grid[d.y][d.x])) problems.push('a mural panel is painted on thin air at ' + d.x + ',' + d.y);
        if (SOLID.has(w.grid[d.y + 1][d.x])) problems.push('nobody can stand in front of the panel at ' + d.x + ',' + d.y);
      });
      if (!DECOS.some(d => d.deco === 'mural')) problems.push('the signature mural is gone');
      if (typeof DECODRAW.panel !== 'function') problems.push('the pack draws no panel');
      /* A PANEL WITH NO DRAWING IS BLANK PLASTER FOREVER, AND NOTHING SAYS SO.
         La esquina shipped its DECOR row on the day the district shipped and PANELART.esquina did
         not exist, so Doña Meche's wall stayed the unbegun blue at every grade — the one visible
         reward for finishing her four quests, silently withheld. It was found by reading, which is
         not a method. The pairing is the noun: a panel names a business, a business owns a drawing. */
      DECOS.filter(d => d.deco === 'panel').forEach(d => {
        if (!d.id) problems.push('a panel at ' + d.x + ',' + d.y + ' names no business, so nothing can ever be painted on it');
        else if (typeof PANELART[d.id] !== 'function')
          problems.push('the panel for "' + d.id + '" has no drawing — that wall is blank plaster at every grade, and finishing the district changes nothing on it');
      });
      Object.keys(PANELART).forEach(id => {
        if (!DECOS.some(d => d.deco === 'panel' && d.id === id))
          problems.push('PANELART has a drawing for "' + id + '" and no wall to put it on');
      });
      return problems;
    });
    fails.push(...mural);

    // an unbegun panel is plaster and nothing else; a graded one paints.
    // MEASURED IN THE MURAL FIELD, not over the whole tile: since 2026-09-17 the panel keeps the
    // wall's own window (owner: "the store front icon or mural can go around it"), so a whole-tile
    // colour count reads glass, a lintel and a stone ledge as "the panel painted something" and
    // this guard failed on a wall that was behaving. The noun it means is the EMBLEM, and the
    // emblem lives in the field beside the kept window — x2..16, measured: the lintel and the ledge
    // start bleeding at x17. Counting the window in was the
    // guard measuring the container instead of the thing.
    const paint = await page.evaluate(() => {
      const c = document.createElement('canvas'); c.width = c.height = 32;
      const g2 = c.getContext('2d'), old = ctx;
      const shot = () => { const d = g2.getImageData(2, 6, 15, 24).data; const seen = new Set();
        for (let i = 0; i < d.length; i += 4) seen.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); return seen; };
      const keepD = new Set(done), keepM = { ...marks };
      const panel = DECOS.find(d => d.deco === 'panel' && d.id === 'taller');
      ctx = g2;
      done = new Set(); marks = {};
      /* bare plaster, drawn by the same function the panel starts with: the thing an unbegun
         panel has to be indistinguishable from. A count against a hard number would drift the
         next time a trowel mark moves; this compares the field against what plaster IS. */
      g2.clearRect(0, 0, 32, 32); muralGround(0, 0); const bare = [...shot()].sort().join('|');
      g2.clearRect(0, 0, 32, 32); DECODRAW.panel(0, 0, panel); const blank = shot();
      const ta = CHAPTERS.find(c2 => c2.id === 'taller');
      ta.quests.forEach(q => { done.add(q); marks[q] = 1; });
      g2.clearRect(0, 0, 32, 32); DECODRAW.panel(0, 0, panel); const painted = shot();
      ctx = old; done = keepD; marks = keepM;
      return { bare, blank: [...blank].sort().join('|'), blankColours: blank.size, paintedColours: painted.size };
    });
    if (paint.blank !== paint.bare) fails.push('an unbegun panel is not plain plaster: ' + paint.blankColours + ' colours in the mural field');
    if (paint.paintedColours <= paint.blankColours) fails.push('a worked district did not paint its panel');

    /* A FINISHED DISTRICT'S EMBLEM HAS TO BE VISIBLE ON ITS OWN WALL.
       La esquina's was #E8D5A8 and the plaster is #C6DCEA — 1.4 luma apart. The note in maps.js
       defending the choice compared it to the OTHER SIX PANELS and never to the wall it is painted
       on, so the one visible reward for finishing Doña Meche's four quests was a wall that still
       looked blank. Measured on the RENDER at full grade, in the emblem's own field, against this
       repo's own accent-vs-ground floor of 90. */
    const legible = await page.evaluate(() => {
      const P = [], L = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
      const c = document.createElement('canvas'); c.width = c.height = 32;
      const g2 = c.getContext('2d'), old = ctx, keepD = new Set(done), keepM = { ...marks };
      ctx = g2;
      g2.clearRect(0, 0, 32, 32); muralGround(0, 0);
      const ground = L(...[...g2.getImageData(8, 26, 1, 1).data].slice(0, 3));
      DECOS.filter(d => d.deco === 'panel' && d.id).forEach(d => {
        const ch = CHAPTERS.find(c2 => c2.id === d.id); if (!ch) return;
        done = new Set(); marks = {};
        (ch.quests || []).forEach(q => { done.add(q); marks[q] = 1; });    /* every quest right first try: grade 3 */
        g2.clearRect(0, 0, 32, 32); DECODRAW.panel(0, 0, d);
        const px2 = g2.getImageData(2, 6, 15, 24).data;
        let far = 0;
        for (let i = 0; i < px2.length; i += 4) far = Math.max(far, Math.abs(L(px2[i], px2[i + 1], px2[i + 2]) - ground));
        if (far < 90) P.push('the emblem for "' + d.id + '" is ' + Math.round(far) +
          ' luma from the plaster it is painted on at its furthest pixel — under the 90 this repo separates an accent from its ground by. Finishing that district changes nothing anyone can see');
      });
      ctx = old; done = keepD; marks = keepM;
      return P;
    });
    fails.push(...legible);

    /* AND THE CLIMB EXISTS AT ALL. The engine's suite holds any shell to "a flight is walked, not
       teleported" but cannot require a shell to HAVE a flight — the gauge's five-tile world owes
       it nothing, and said so on the first run. Meridian has one, so Meridian is held to it here:
       Nolasco's well is real, it is deep enough to be a storey rather than a dip, and the avenue
       door lands you at its foot. Owner, 2026-09-17: "ok lets do b." */
    const climb = await page.evaluate(() => {
      const P = [], w = WORLDS.no;
      if (!w) return ['the Nolasco stair room is gone'];
      let deepest = 0, treads = 0;
      for (let x = 0; x < w.W; x++) { const d = wellDepth(w, x, 4); if (d > deepest) deepest = d;
        if (w.rows[4][x] === '\u2261') treads++; }
      if (treads < 5) P.push('Nolasco\'s flight is ' + treads + ' treads — under five it drops less than two thirds of a wall and reads as a dip in the floor, not as a storey');
      if (deepest < 0.9) P.push('Nolasco\'s well is ' + deepest.toFixed(2) + ' deep and a wall is about 1.1 — you would arrive on the avenue from half a storey up');
      const p = PORTALS.st.$;
      if (!p || p.to !== 'no') P.push('the avenue door no longer opens into the stair room');
      else if (wellDepth(w, p.x, p.y) < deepest - 0.17)
        P.push('the avenue door drops you at no ' + p.x + ',' + p.y + ', ' + wellDepth(w, p.x, p.y).toFixed(2) +
               ' down a well that goes ' + deepest.toFixed(2) + ' — you are meant to arrive at the foot and walk up');
      return P;
    });
    fails.push(...climb);

    /* EVERY PLACE IN THIS CITY IS ON ITS MAP. Owner, 2026-09-17: "yeah i mean a map implies this
       lol" — and six of fifteen worlds were on the plan in no form at all, the park among them,
       which is the third-largest world in the game. The engine's suite cannot demand this of every
       future world (a pack may hide a place on purpose — a memory, a dream, a menu) so it reports
       the count there; Meridian has no such place, so Meridian is held to all fifteen here. */
    const onmap = await page.evaluate(() => {
      const P = [], keepD = new Set(done), keepC = chSeen;
      CHAPTERS.forEach(c => (c.quests || []).forEach(i => done.add(i)));
      chSeen = CHAPTERS.length; applyGrowth();
      const lost = Object.keys(WORLDS).filter(id => !planPlace(id));
      if (lost.length) P.push('these worlds are nowhere on the plan: ' + lost.join(', ') +
        ' — every place in this city is somewhere you can be shown, and the park is reached on a leash so only MAPDOT can say where it is');
      done = keepD; chSeen = keepC; applyGrowth();
      return P;
    });
    fails.push(...onmap);

    /* #208 — AN ENDING MAY PAY OFF A SCENE; IT MAY NOT STAGE ONE AGAIN.
       Reported by a narrative designer, not by a test: La Espiga tells you how its story ended, and
       then Doña Licha is still standing there with a question about the same afternoon — the two
       texts opened with the SAME SENTENCE. It happens because a district closes on a COUNT
       (`need`), so its last-visit quest is optional and the ending can fire first.

       Measured before writing anything, which is the only reason the fix is the right size: it was
       never only La Espiga. TWELVE ending strings across SIX districts shared a seven-word verbatim
       run with their own quests, in both languages, and in four cases the ending re-played the exact
       outcome beat the quest already plays — so a player who DID the quest watched it happen twice,
       and a player who skipped it was shown it happening and then offered it as pending. One bug,
       two faces, one fix: the ending reports the state that beat left behind.

       SEVEN WORDS, and the number is not arbitrary. At six it flags an ending for NAMING THE SAME
       OBJECT as its quest — "on the wall by the register" — which an ending has to be allowed to do,
       and which Spanish reaches sooner than English because it takes more words to say the same
       thing. At seven, nothing survives that is not a copied sentence. The longest run is printed
       either way, so the margin is visible and drift shows up before it becomes a failure. */
    const echo = await page.evaluate(() => {
      const P = [], text = n => { const s = []; const walk = v => { if (typeof v === 'string') s.push(v);
        else if (v && typeof v === 'object') Object.values(v).forEach(walk); }; walk(n); return s.join(' '); };
      const norm = t => t.toLowerCase().replace(/[^a-z0-9áéíóúñü ]/g, ' ').split(/\s+/).filter(Boolean);
      const runs = (a, n) => { const S = new Set(); for (let i = 0; i + n <= a.length; i++) S.add(a.slice(i, i + n).join(' ')); return S; };
      const N = 7;
      let longest = 0, longestAt = '';
      [['en', UI.en, QEN], ['es', UI.es, QES]].forEach(([tag, T, Q]) => {
        CHAPTERS.forEach(c => {
          const pre = c.epi || 'epi';
          const qn = norm((c.quests || []).map(i => Q[i] ? text(Q[i]) : '').join(' '));
          ['1', '2', '3'].forEach(k => {
            const e = T[pre + k]; if (typeof e !== 'string') return;
            const en = norm(e);
            for (let n = 14; n >= 3; n--) {
              const QR = runs(qn, n), hit = [...runs(en, n)].find(r => QR.has(r));
              if (!hit) continue;
              if (n > longest) { longest = n; longestAt = tag + ' ' + pre + k + ' "' + hit + '"'; }
              if (n >= N) P.push('the ' + tag + ' ending "' + pre + k + '" repeats ' + n + ' words of its own district\'s quest text word for word — "' + hit +
                '" — so the last visit and a quest that may still be pending describe the same moment');
              break;
            }
          });
        });
      });
      P.push('COUNT-ONLY: the longest run an ending shares with its own quests is ' + longest + ' words (' + longestAt + '); ' + N + ' fails');
      return P;
    });
    fails.push(...echo.filter(l => !/^COUNT-ONLY: /.test(l)));
    echo.filter(l => /^COUNT-ONLY: /.test(l)).forEach(l => console.log('  ' + l));

    /* T4b — NO TWO PLACES END THE SAME WAY, AND NO PLACE ENDS THE WAY ITS OWN LAST QUEST BEGINS.
       La junta measured it: every one of the six business districts ran the same five beats in the
       same order, and the first of them — a day stamp — was literally the same words. "Saturday."
       opened nine endings. The owner had already called the concept silly; what he was looking at
       was a form with the nouns swapped, six times.
       This is the only thing on that page that stops the template coming back. Without it, a writer
       in six months with one grey paragraph and five jobs to do writes the same form again and
       nothing turns red. It holds four claims, all about the OPENING CLAUSE — the first sentence,
       which is the whole of what a template is:
         · no two districts open a tier the same way, in either language;
         · no district opens two of its own tiers the same way;
         · no district's ending opens on the same clause as the quest that closes it;
         · and a day of the week may open at most ONE ending in the game, because the moment it
           opens two it is a format again. (Meridian spends that one on Meridian Labs, whose whole
           character is that it runs on the calendar.)
       The burnout endings are held to the same rules: they are six more paragraphs in the same
       slot, and five of the six named a different room to learn in while two of them said "floor". */
    const openers = await page.evaluate(() => {
      const P = [], clause = v => String(v).split(/(?<=[.!?])\s/)[0].trim().toLowerCase();
      const DAY = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b/;
      [['en', UI.en, QEN], ['es', UI.es, QES]].forEach(([L, T, Q]) => {
        const seen = {}, days = [];
        CHAPTERS.forEach(c => {
          const pre = c.epi || 'epi', mine = {};
          [['1', T[pre + '1']], ['2', T[pre + '2']], ['3', T[pre + '3']], ['go', T[c.go]]].forEach(([tier, v]) => {
            if (typeof v !== 'string' || !v) return;
            const o = clause(v), key = tier + '|' + o;
            if (seen[key]) P.push(L + ': ' + c.id + ' and ' + seen[key] + ' open their ' + (tier === 'go' ? 'burnout' : 'tier ' + tier) +
              ' ending with the same words — "' + o + '" — which is a template with the nouns swapped');
            else seen[key] = c.id;
            if (mine[o]) P.push(L + ': ' + c.id + ' opens both its ' + mine[o] + ' and its ' + tier + ' ending with "' + o + '"');
            else mine[o] = tier;
            if (DAY.test(o)) days.push(L + ' ' + c.id + ' ' + tier + ' "' + o + '"');
          });
          /* and not the same clause the quest that CLOSES the district opens with (#208's shape) */
          const k = (typeof chClose === 'function') ? chClose(c) : null;
          const q = k === null || k === undefined ? null : Q[k];
          const qo = q && q.nodes && q.nodes[q.start] ? clause(q.nodes[q.start].say) : null;
          if (qo) ['1', '2', '3'].forEach(tier => { const v = T[pre + tier];
            if (typeof v === 'string' && clause(v) === qo)
              P.push(L + ': ' + c.id + "'s tier " + tier + ' ending opens on the same sentence as the quest that closes the district — "' + qo + '"'); });
        });
        if (days.length > 1) P.push(L + ': a day of the week opens ' + days.length + ' endings (' + days.join(', ') +
          ') — one is a place with a calendar, two is a format');
      });
      return P;
    });
    fails.push(...openers);

    // townsfolk: people with no quests move, people with quests never do
    const walk = await page.evaluate(async () => {
      const problems = [];
      if (typeof wanderUpdate !== 'function') return ['nobody can walk'];
      const bad = auditWander();
      if (bad.length) problems.push('somebody was placed with nowhere to walk: ' + bad.join(' '));
      world = 'ex'; px = fx = 1; py = fy = 8; moving = false; held = null;
      document.getElementById('card').hidden = true; document.getElementById('reader').hidden = true;
      const w = WORLDS.ex;
      const movers = w.npcs.filter(n => wanders(n)), fixed = w.npcs.filter(n => !wanders(n));
      if (!movers.length) return ['no townsfolk with time on their hands in this world'];
      const before = w.npcs.map(n => n.x + ',' + n.y);
      for (let i = 0; i < 300; i++) { wanderUpdate(60); await new Promise(r => setTimeout(r, 4)); }
      const after = w.npcs.map(n => n.x + ',' + n.y);
      const movedAny = w.npcs.some((n, i) => before[i] !== after[i]);
      if (!movedAny) problems.push('nobody moved in 300 ticks');
      fixed.forEach(n => { const i = w.npcs.indexOf(n);
        if (before[i] !== after[i]) problems.push('a quest-giver wandered off: ' + (n.npc || n.key)); });
      movers.forEach(n => { if (Math.abs(n.x - n.hx) + Math.abs(n.y - n.hy) > WANDER_R)
        problems.push((n.npc || n.key) + ' left their corner'); });
      // nobody is standing inside a wall, on a door, or on the player, and the grid agrees
      w.npcs.forEach(n => {
        if (SOLID.has(w.rows[n.y][n.x])) problems.push((n.npc || n.key) + ' walked into a wall');
        if (DOORSET.has(w.rows[n.y][n.x])) problems.push((n.npc || n.key) + ' is standing in a doorway');
        if (w.grid[n.y][n.x] !== 'N') problems.push('the grid lost track of ' + (n.npc || n.key)); });
      const spots = new Set(w.npcs.map(n => n.x + ',' + n.y));
      if (spots.size !== w.npcs.length) problems.push('two people are standing on the same tile');
      return problems;
    });
    fails.push(...walk);
    await page.evaluate(() => { world = 'hq'; px = fx = 10; py = fy = 11; checkTalk(); });
  }

  // ---- 26. one Don Güero, and the pair are a couple of taps away ----
  {
    const cast = await page.evaluate(() => {
      const problems = [];
      // he stands upstairs only now; nobody is left on the street wearing his name
      const street = WORLDS.st.npcs.filter(n => n.npc === 'guero');
      if (street.length) problems.push('Don Güero is still standing on the street');
      // room hosts are placed as townsfolk, so the map key is generated — look at the declaration
      const host = Object.values(roomHosts || {}).some(h => h.id === 'guero');
      if (!host) problems.push('Don Güero is not upstairs either — he has left the game');
      // his quest went with him: Lupe carries both La Obra quests and no quest is orphaned
      const lu = WORLDS.st.npcs.find(n => n.npc === 'lupe');
      if (!lu) problems.push('Lupe is gone from La Obra');
      else { if (lu.q.indexOf(12) < 0 || lu.q.indexOf(13) < 0) problems.push('Lupe does not carry both La Obra quests: ' + JSON.stringify(lu.q)); }
      ['en', 'es'].forEach(L => {
        const Q = L === 'en' ? QEN : QES;
        if (Q[12].npc !== 'lupe') problems.push('quest 12 is still given by ' + Q[12].npc + ' in ' + L);
        // she names him in her first breath, so he is introduced rather than merely absent
        const first = Q[12].nodes[Q[12].start].say;
        if (!/G(ü|u)ero/.test(first)) problems.push('Lupe does not introduce Don Güero in ' + L);
      });
      // the office is somewhere the Trolley Pass will take you
      // A trolley stops where there are rails. Every destination must be a world that actually
      // holds a trolley tile — which is why the office came off the list (owner, 2026-09-03:
      // "i dont like that i go from a train to a floor... i asked to make the world realistic").
      TRV.forEach(d => { const L = troLine(d.w);
        if (!WORLDS[d.w]) return;
        if (!L || !troStops(L).length) problems.push('the trolley stops somewhere with no trolley stop in it: ' + d.w); });
      if (TRV.some(d => d.w === 'f2')) problems.push('the office is back on the trolley list');
      TRV.forEach(d => { const w = WORLDS[d.w];
        if (!w) problems.push('travel points at a world that does not exist: ' + d.w);
        else if (SOLID.has(w.grid[d.y][d.x]) || w.grid[d.y][d.x] === 'N') problems.push('travel drops you inside something at ' + d.w); });
      return problems;
    });
    fails.push(...cast);
    // the pair are still upstairs, reached the way you reach an office: the door and the stairs
    const pair = await page.evaluate(() => {
      const ids = WORLDS.f2.npcs.map(n => (roomHosts[n.npc] || {}).id).filter(Boolean);
      world = 'f2'; px = fx = 17; py = fy = 11; moving = false;
      return { ids, arrive: (UI.en.arrive.f2 || '') + '|' + (UI.es.arrive.f2 || '') };
    });
    if (!pair.ids.includes('nacho') || !pair.ids.includes('guero')) fails.push('the pair are not upstairs: ' + JSON.stringify(pair.ids));
    if (!/wall/i.test(pair.arrive) || !/pared/i.test(pair.arrive)) fails.push('walking into the office does not mention the wall in both languages');
    await page.evaluate(() => { world = 'hq'; px = fx = 10; py = fy = 11; checkTalk(); });
  }

  // ---- 27. Don Güero builds from a template: same lot, same house, every time ----
  {
    const b = await page.evaluate(() => {
      const problems = [];
      if (typeof BUILDTPL === 'undefined' || typeof BUILDS === 'undefined') return ['the pack declares no templates'];
      if (typeof resolveBuild !== 'function' || typeof buildSafe !== 'function') return ['the engine has no build seam'];
      // DETERMINISTIC: the same lot resolves to the same house every time it is asked
      // every template resolves the same way twice, and stays inside its own footprint
      const probes = Object.keys(BUILDTPL).map(t => ({ id: 'det-' + t, tpl: t, world: 'ex', x: 0, y: 0, seed: 'det' }))
        .concat(BUILDS);
      probes.forEach(bd => {
        const a = resolveBuild(bd), c = resolveBuild(bd);
        if (!a) { problems.push('no template for ' + bd.id); return; }
        if (JSON.stringify(a.pick) !== JSON.stringify(c.pick)) problems.push(bd.id + ' builds differently each time it is asked');
        if (!a.tiles.length) problems.push(bd.id + ' built nothing');
        a.tiles.forEach(t => { if (t[1] < bd.x || t[1] >= bd.x + BUILDTPL[bd.tpl].size.w || t[0] < bd.y || t[0] >= bd.y + BUILDTPL[bd.tpl].size.h)
          problems.push(bd.id + ' put a tile outside its own footprint at ' + t[1] + ',' + t[0]); });
      });
      // VARIATION: different seeds on the same template give different houses
      const t = Object.keys(BUILDTPL)[0], faces = new Set();
      for (let i = 0; i < 24; i++) faces.add(JSON.stringify(resolveBuild({ id: 'probe' + i, tpl: t, world: 'ex', x: 16, y: 0, seed: 'seed' + i }).pick));
      if (faces.size < 3) problems.push('the template only ever builds ' + faces.size + ' house(s) — that is not variation');
      // PARTS SEE EACH OTHER: the yard never appears when the door is on the edge
      // the yard part declares when(c => c.pick.door !== 'left'), so a left-hand door means no yard
      let sawSkip = false;
      for (let i = 0; i < 80; i++) { const r = resolveBuild({ id: 'p' + i, tpl: 'casita', world: 'ex', x: 0, y: 0, seed: 'x' + i });
        if (r.pick.door === 'left') { sawSkip = true;
          if (r.pick.yard !== undefined) problems.push('a pot was put where the door swings'); } }
      if (!sawSkip) problems.push('never rolled the door that skips the yard — the when() rule is untested');
      // PINNED: a saved pick survives a template that gains a new option
      // a lot whose template offers a choice of door; the casa's door is fixed (it is the link), so probe the casita
      const one = BUILDS.find(bd => (BUILDTPL[bd.tpl].parts || []).some(pt => pt.id === 'door' && pt.pick)) || { id: 'pin-probe', tpl: 'casita', world: 'ex', x: 0, y: 0, seed: 'pin' };
      const before = resolveBuild(one).pick;
      bldPicks[one.id] = { ...before, door: before.door === 'left' ? 'right' : 'left' };
      const after = resolveBuild(one).pick;
      if (after.door !== bldPicks[one.id].door) problems.push('a house did not keep the face it was built with');
      delete bldPicks[one.id];
      // SAFE: a build that would seal a door, stand on a person or leave the map is refused
      const w = WORLDS.ex;
      const doorTile = []; for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) if ((PORTALS.ex || {})[w.rows[y][x]]) doorTile.push([y, x]);
      if (!doorTile.length) problems.push('no door on Calle Dos to test against');
      else {
        const [dy, dx] = doorTile[0];
        const seal = { id: 'evil', world: 'ex', tpl: 'casita', pick: {}, reads: [],
          tiles: [[dy + 1, dx, '▩'], [dy - 1, dx, '▩'], [dy, dx + 1, '▩'], [dy, dx - 1, '▩']].filter(t => t[0] >= 0 && t[1] >= 0) };
        if (!buildSafe(seal)) problems.push('a build that seals a door was allowed');
      }
      const npc = w.npcs[0];
      if (npc && !buildSafe({ id: 'e2', world: 'ex', tiles: [[npc.y, npc.x, '▩']], reads: [] })) problems.push('a build was allowed to stand on somebody');
      if (!buildSafe({ id: 'e3', world: 'ex', tiles: [[999, 999, '▩']], reads: [] })) problems.push('a build was allowed off the map');
      // #9 (Don Güero): a build may not lay a door-kind tile that opens onto nothing. A probe glyph
      // declared as a solid door with no portal must be refused; the same glyph with a portal passes.
      { const G = '⌂', had = TILES[G], wasSolid = SOLID.has(G), P0 = PORTALS.ex;
        TILES[G] = { lift: 13, kind: 'door' }; SOLID.add(G);
        const spot = (() => { for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) if (w.rows[y][x] === '.' && w.grid[y][x] === '.') return [y, x]; return null; })();
        if (!spot) problems.push('no open tile on Calle Dos to probe a door on');
        else {
          if (!buildSafe({ id: 'e4', world: 'ex', tiles: [[spot[0], spot[1], G]], reads: [] })) problems.push('a build was allowed to lay a door that opens onto nothing (#9)');
          PORTALS.ex = Object.assign({}, P0, { [G]: { to: 'st', x: 1, y: 1, dir: 'down' } });
          if (buildSafe({ id: 'e5', world: 'ex', tiles: [[spot[0], spot[1], G]], reads: [] })) problems.push('a build was refused for a door that does open');
        }
        PORTALS.ex = P0; if (had) TILES[G] = had; else delete TILES[G]; if (!wasSolid) SOLID.delete(G); }
      // and every lot the pack has declared is one the engine accepts — a refused lot must never
      // ship silently (Don Güero on #8: the suite fails the build)
      BUILDS.forEach(bd => { const spec = resolveBuild(bd); const bad = spec && buildSafe(spec); if (!spec || bad) problems.push('the lot ' + bd.id + ' is refused: ' + (bad || 'no template')); });
      // #10 La llave: a template may LINK a lot's door to a room it carries. Doña Chelo's casa on Calle Dos
      // is the first: her door is a portal keyed by where it stands, the room is a world of its own named
      // after the lot, her exit leads back to the doorstep, she has a name and three lines, and the whole
      // thing is reachable from the street.
      if (typeof portalAt !== 'function' || typeof portalsOf !== 'function') problems.push('the engine has no coordinate-portal seam (portalAt / portalsOf)');
      else {
        const lot = BUILDS.find(bd => bd.tpl === 'casa');
        if (!lot) problems.push('no casa lot is declared — nothing on Calle Dos can be entered');
        else {
          const id = lot.id, door = portalAt(lot.world, lot.x + 1, lot.y);
          if (!door || door.to !== id) problems.push('the casa\'s front door does not open into its own room (' + JSON.stringify(door) + ')');
          const room = WORLDS[id];
          if (!room) problems.push('the casa has no room of its own in WORLDS');
          else {
            if (!isSolidAt(id, door.x, door.y) === false) problems.push('the casa\'s landing is not walkable');
            const back = portalsOf(id).find(o => o.p.to === lot.world);
            if (!back) problems.push('the room has no way back out');
            else if (back.p.x !== lot.x + 1 || back.p.y !== lot.y + 1) problems.push('the way out does not land on the doorstep (' + back.p.x + ',' + back.p.y + ')');
            if (!room.npcs.length || !room.npcs[0].chat) problems.push('nobody lives in the casa');
            else if (!NPCN.en[room.npcs[0].npc] || !NPCN.es[room.npcs[0].npc] || !UI.en.chat[room.npcs[0].npc] || !UI.es.chat[room.npcs[0].npc]) problems.push('the neighbour has no name or no lines in both languages');
            if (!UI.en.locs[id] || !UI.es.locs[id] || !UI.en.arrive[id] || !UI.es.arrive[id]) problems.push('the casa has no name or arrival line in both languages');
            const reach = auditReach().filter(m => m.includes(id)); if (reach.length) problems.push('the casa is not reachable: ' + reach.join('; '));
            if (room.rows.some(r => r.includes('▦'))) problems.push('the room has a reja inside it');
          }
          // the chair (owner, 2026-09-07: "open the ability to change our character outfit and haircut after start...
          // a small barber"): a barbería lot from a template, Naye behind the chair, Talk reopens the creator with the
          // name locked, what you pick is saved, progress untouched; in season the calavera looks sit in the same panel
          const bl = BUILDS.find(bd => bd.tpl === 'barberia');
          if (!bl) problems.push('no barbería is declared — outfit and hair are decided once, at the start');
          else if (!GRW().barberNpc) problems.push('nobody is nominated to run the chair (GROWTH.barberNpc)');
          else {
            const bid = bl.id, broom = WORLDS[bid], who = GRW().barberNpc;
            if (!broom) problems.push('the barbería has no room');
            else {
              if (!broom.npcs.some(n => n.npc === who)) problems.push('the barber is not in the barbería');
              if (!NPCN.en[who] || !NPCN.es[who] || !(UI.en.chat[who] || []).length || (UI.en.chat[who] || []).length !== (UI.es.chat[who] || []).length) problems.push('the barber has no name or lines in both languages');
              if (!UI.en.locs[bid] || !UI.es.locs[bid] || !UI.en.arrive[bid] || !UI.es.arrive[bid]) problems.push('the barbería has no name or arrival line in both languages');
              const reach = auditReach().filter(m => m.includes(bid)); if (reach.length) problems.push('the barbería is not reachable: ' + reach.join('; '));
              const bn = broom.npcs.find(n => n.npc === who); const keep = { world, px, py, xp, style: look.style, cam: camMode, hero: alePick.hero };
              world = bid; px = fx = bn.x; py = fy = bn.y + 1; moving = false; held = null; checkTalk();
              if ($('talk').hidden || $('talk').dataset.chatn !== who) problems.push('standing before the barber, Talk does not offer the chair');
              // the bubble hints what the chair changes (owner, 2026-09-07: "make it easy to tell... their thought bubble at least has a hint")
              if (!/✂️/.test($('talk').textContent) || !$('talk').textContent.includes(UI[lang].chairHint)) problems.push('the barber\'s bubble does not say what the chair changes: ' + $('talk').textContent);
              // the fashion options: patterns on the shirt, four to pick, drawn inside the shirt, saved with the look
              if (!UI.en.patterns || UI.en.patterns.length < 4 || (UI.es.patterns || []).length !== UI.en.patterns.length) problems.push('the shirt offers fewer than four patterns in both languages');
              else { $('talk').click();
                if ($('creator').hidden) problems.push('Talk at the barber does not open the chair');
                else { if (!$('heroname').hidden) problems.push('the chair lets you rename yourself');
                  const sb = [...$('rowStyle').querySelectorAll('button')].find(b => b.getAttribute('aria-pressed') !== 'true'); if (sb) sb.click();
                  const pbs = [...$('rowPattern').querySelectorAll('button')]; if (pbs.length < 4 || $('rowPattern').hidden) problems.push('the chair offers no patterns');
                  else { const bakeP = () => { const c = document.createElement('canvas'); c.width = 44; c.height = 44; const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 6, 12); drawPerson(g, 0, 0, look, { dir: 'down', hero: true }); return g.getImageData(0, 0, 44, 44).data; };
                    const plain0 = bakeP(); pbs[1].click(); const striped = bakeP(); let dp = 0; for (let i = 0; i < plain0.length; i += 4) if (plain0[i] !== striped[i] || plain0[i + 1] !== striped[i + 1]) dp++;
                    if (look.pattern !== UI.en.patterns[1][0]) problems.push('picking a pattern does not set it on the look'); if (dp < 12) problems.push('the pattern draws nothing on the shirt (' + dp + ' px)');
                    pbs[0].click(); }
                  $('begin').click();
                  if (!$('creator').hidden) problems.push('the chair does not close'); if (xp !== keep.xp) problems.push('sitting in the chair reset your progress');
                  if (sb && look.style === keep.style) problems.push('a new hairstyle from the chair did not take');
                  { const svp = loadSave(); if (!svp || !svp.lk || svp.lk.pattern !== look.pattern) problems.push('the shirt\'s pattern is not saved with the look'); }
                  const sv = loadSave(); if (sb && (!sv || !sv.lk || sv.lk.style !== look.style)) problems.push('the new look was not saved');
                  if ($('heroname').hidden) problems.push('after the chair the name field stays hidden for the next hero');
                  seasonSet('muertos'); checkTalk(); $('talk').click(); const pb = $('rowPaint') ? [...$('rowPaint').querySelectorAll('button')] : [];
                  if ($('creator').hidden) problems.push('in season the chair does not open'); else if (pb.length !== 5) problems.push('in season the chair offers ' + pb.length + ' calavera looks, not five');
                  else { pb[4].click(); if (alePick.hero !== 4) problems.push('picking the calavera in the chair did not paint it'); }
                  $('begin').click(); seasonSet('auto'); } }
              alePick.hero = keep.hero; alePersist(); look.style = keep.style; world = keep.world; px = fx = keep.px; py = fy = keep.py; save(); camSet(keep.cam); }
          }
          // #8 El Portero: the log, the tin man in his hut, the count he says, the red on his sheet
          if (typeof mqwarn !== 'function' || typeof logCrit !== 'function') problems.push('the engine keeps no log (mqwarn / logCrit)');
          else {
            const hut = Object.entries(WORLDS).find(([k, w]) => w.built && w.npcs.some(n => n.npc === 'portero'));
            if (!hut) problems.push('El Portero has no hut');
            else {
              const [hid, hw] = hut, rob = hw.npcs.find(n => n.npc === 'portero');
              if (!NPCLOOK.portero || !NPCLOOK.portero.robot) problems.push('El Portero is not drawn as a robot');
              if (!RD().some(r => r.world === hid && r.doc === 'portero')) problems.push('the gate sheet is not on a desk in the hut');
              const say = () => { let l = UI[lang].chat.portero[0]; return typeof l === 'function' ? l() : l; };
              const keep = mqLog.slice(); logClear();
              const quiet = say(); if (quiet && quiet.crit) problems.push('with nothing logged El Portero speaks in red');
              mqwarn('build', 'refused to build probe — the door at 1,1 would open onto nothing', true);
              mqwarn('build', 'refused to build probe — the door at 1,1 would open onto nothing', true);
              const loud = say();
              if (!loud || !loud.crit || !/^2 /.test(loud.t)) problems.push('El Portero does not count two stopped attempts in red (' + JSON.stringify(loud) + ')');
              const secs = docSections('portero') || [];
              if (!secs.some(x => x.red && /× 2/.test(x.red))) problems.push('the gate sheet does not print the stopped attempt in red');
              window.dispatchEvent(new ErrorEvent('error', { message: 'probe error' }));
              if (!logCrit().some(e => e.kind === 'error' && e.msg === 'probe error')) problems.push('an uncaught error does not reach the log');
              let stored = null; try { stored = JSON.parse(localStorage.getItem(SK('log'))); } catch (e) {}
              if (!stored || !stored.some(e => e.kind === 'build')) problems.push('the log is not kept under the prefix');
              logClear(); mqLog.push(...keep);
              mqwarn('build', 'refused to build probe2 — off the map', true); docOpen('portero'); if (!document.querySelector('#docBody .dred')) problems.push('the reader has no red line'); $('reader').hidden = true; logClear(); mqLog.push(...keep);
            }
          }
          // a second lot from the same template gets a room of its own — the point of keying doors by place
          const two = resolveBuild({ id: 'casa-probe', tpl: 'casa', world: lot.world, x: lot.x + 8, y: lot.y, seed: 'probe' });
          if (!two || !two.links || two.links.length !== 1 || two.links[0].id !== 'casa-probe') problems.push('a second lot from the casa template does not carry its own link');
        }
      }
      return problems;
    });
    fails.push(...b);

    // if the pack places any lots, they must actually stand and not break the street.
    // Placing lots is optional: the ability is the feature (owner, 2026-09-03 — the two
    // demo casitas came back off the street because nobody asked for them and you could
    // not walk into them).
    const street = await page.evaluate(() => {
      const problems = [];
      chSeen = 99; applyGrowth();
      if (!BUILDS.length) { if (auditReach().length) problems.push('reachability broke with no lots placed'); return problems; }
      const w = WORLDS[BUILDS[0].world], row = w.rows[BUILDS[0].y];
      // parts stamp in order and later parts overwrite earlier ones (the door lands on the
      // shell), so fold the list the way applyBuilds does before comparing to the street
      BUILDS.forEach(bd => { const spec = resolveBuild(bd), fold = {};
        spec.tiles.forEach(([y, x, ch]) => { fold[x + ',' + y] = ch; });
        Object.entries(fold).forEach(([k, ch]) => { const [x, y] = k.split(',').map(Number);
          if (w.rows[y][x] !== ch) problems.push(bd.id + ' is not standing: expected ' + ch + ' at ' + x + ',' + y + ', found ' + w.rows[y][x]); }); });
      if (!/[▦▩▨]/.test(row)) problems.push('a lot was declared but no house stands on it: ' + row);
      if (BUILDS.length > 1) { const a = resolveBuild(BUILDS[0]).pick, c = resolveBuild(BUILDS[1]).pick;
        if (JSON.stringify(a) === JSON.stringify(c)) problems.push('two lots built the same house'); }
      if (auditReach().length) problems.push('the houses broke reachability: ' + auditReach().join(' | '));
      return problems;
    });
    fails.push(...street);

    // ❗A SHAPED HOUSE — the casita faces that answer the `mesh` view (el albañil, crew 14, from the
    // owner's "should we shape and beautify buildings? ... just do one or two and show me").
    // Three questions a picture cannot answer, and they cannot all fail the same way: one reads the
    // geometry the engine places things against, one reads the drawing the front camera shows, and
    // one reads whether the roof carries over the door you walk through.
    const casa3d = await page.evaluate(() => {
      const problems = [];
      const wallH = g => 0.55 + ((TILES[g] || {}).lift | 0) * 0.042;

      // (1) A FACADE THAT GOT A SHAPE IS STILL A WALL: SOLID MASONRY, WITH NO SLOT IN IT, ALL THE
      // WAY UP TO THE HEIGHT THE ENGINE READS. engine3d.js t3MeshTile takes the mesh INSTEAD of the
      // wall branch ("the mesh view beats box, billboard and even wall"), and four places still
      // compute from wallH(g) for a facade and never ask the shape: the door's lintel, a person
      // working in a window, wall decor and the sill pane.
      //
      // ❗THIS USED TO READ THE MAXIMUM Y ON THE TILE EDGE, AND THAT WAS A PROXY, NOT THE NOUN.
      // A reader whose only job was to refute this check dropped the wall box alone to wallH−0.2
      // and the suite stayed green, because the RING BEAM also tops out at exactly wallH — a
      // see-through slot 0.13 tall opened along the head of every casa wall and a maximum cannot
      // see a hole underneath it (docs/REGRESSION.md's proxy register; the extraction threw away
      // everything between the two numbers it kept). So this now walks UP the face: it takes the
      // triangles actually lying in each of the tile's four vertical planes and asks, at every
      // centimetre, whether masonry is there. A gap is what a person sees as daylight.
      camSet('3d'); world = 'ex'; px = fx = 5; py = fy = 3; moving = false; held = null; t3Invalidate(); draw3d();
      const shaped = T3.group.children.filter(o => o.userData && o.userData.mesh && o.userData.g
        && ((TILES[o.userData.g] || {}).kind === 'facade' || (TILES[o.userData.g] || {}).kind === 'wall'));
      if (!shaped.length) problems.push('no wall or facade on Calle Dos answers the mesh view, so this check measured nothing — that is a red, not a pass');
      // point-in-triangle, in the plane's own two axes
      const inTri = (t, P) => { const s = (a, b, c) => (a[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (a[1] - c[1]);
        const d1 = s(P, t[0], t[1]), d2 = s(P, t[1], t[2]), d3 = s(P, t[2], t[0]);
        return !(((d1 < -1e-9) || (d2 < -1e-9) || (d3 < -1e-9)) && ((d1 > 1e-9) || (d2 > 1e-9) || (d3 > 1e-9))); };
      shaped.forEach(o => {
        const g = o.userData.g, pa = o.geometry.attributes.position.array, WH = wallH(g);
        // the four vertical planes where this tile meets whatever is next to it
        [[0, 0.5], [0, -0.5], [2, 0.5], [2, -0.5]].forEach(([ax, val]) => {
          const oh = ax === 0 ? 2 : 0;                               // the in-plane horizontal axis
          const tri = [];
          for (let i = 0; i < pa.length; i += 9) {
            if (Math.abs(pa[i + ax] - val) > 1e-4 || Math.abs(pa[i + 3 + ax] - val) > 1e-4 || Math.abs(pa[i + 6 + ax] - val) > 1e-4) continue;
            tri.push([[pa[i + oh], pa[i + 1]], [pa[i + 3 + oh], pa[i + 4]], [pa[i + 6 + oh], pa[i + 7]]]);
          }
          const side = (ax === 0 ? 'east/west' : 'north/south') + ' face';
          if (!tri.length) { problems.push('the shape at ' + g + ' has no masonry at all in its ' + side + ' (' + (ax ? 'z' : 'x') + '=' + val + '): it is not a wall, and the lintel over the front door beside it is placed against thin air'); return; }
          let top = -Infinity; tri.forEach(t => t.forEach(p => { if (p[1] > top) top = p[1]; }));
          if (Math.abs(top - WH) > 1e-6)
            problems.push('the shaped house at ' + g + ' is ' + top.toFixed(3) + ' tall where it meets the tile next door and the engine reads ' + WH.toFixed(3)
              + ': the lintel over the front door, anything hung on this wall and any sweet set on its sill are all placed from ' + WH.toFixed(3) + ' and would hang ' + Math.abs(top - WH).toFixed(3) + ' out in the air');
          // and now the hole a maximum cannot see: march the middle of the face from the plinth up
          for (let hgt = 0.12; hgt < WH - 0.004; hgt += 0.01) {
            if (tri.some(t => inTri(t, [0, hgt]))) continue;
            problems.push('there is a see-through slot in the ' + side + ' of ' + g + ' at ' + hgt.toFixed(3) + ' of a tile up: the wall stops being a wall there and you can see daylight along it, while the door lintel, the wall decor and the sill pane beside it are all still placed from ' + WH.toFixed(3));
            break;
          }
        });
      });

      // (2) THE ROOF CARRIES OVER THE FRONT DOOR. A `⌂` is a door, not a facade, so it has no mesh
      // of its own — if each face stopped at its own tile edge the roofline would break exactly
      // where you walk in, which is the owner's "three boxes, not one building" all over again.
      const doorAt = [];
      for (let y = 0; y < WORLDS.ex.H; y++) for (let x = 0; x < WORLDS.ex.W; x++)
        if (DOORSET.has(WORLDS.ex.rows[y][x]) && !SOLID.has(WORLDS.ex.grid[y][x])) doorAt.push([x, y]);
      doorAt.forEach(([dx, dy]) => {
        [-1, 1].forEach(side => {
          const nb = shaped.find(o => o.userData.x === dx + side && o.userData.y === dy);
          if (!nb) return;                                  // no shaped neighbour on that side: nothing to carry
          // the neighbour's roof has to reach BACK toward the door: for the face to the door's west
          // the door's middle is at local x +1, for the face to its east it is at local x −1
          const pa = nb.geometry.attributes.position.array; let reach = -Infinity;
          for (let i = 0; i < pa.length; i += 3) { const r = pa[i] * -side; if (r > reach) reach = r; }
          if (reach < 0.999) problems.push('the roof of the ' + nb.userData.g + ' beside the door at ' + dx + ',' + dy
            + ' stops ' + (1 - reach).toFixed(2) + ' of a tile short of the door\'s middle: the roofline breaks over the front door and the house reads as two boxes with a gap between them');
        });
      });

      // (3) AND THE DRAWING, because the front camera is the one the owner photographs and it never
      // sees the mesh at all. Two casa faces laid side by side have to make ONE roof: the same band,
      // reaching both edges of the tile, on a pitch that divides 32 so the course carries through
      // the join instead of restarting at it.
      const bake = (g, tx, ty) => { const c = document.createElement('canvas'); c.width = 32; c.height = 32;
        const old = ctx; ctx = c.getContext('2d');
        try { TILEDRAW[g]({ sx: 0, sy: 0, x: tx, y: ty }); } finally { ctx = old; }
        return c.getContext('2d').getImageData(0, 0, 32, 32).data; };
      const faces = ['▩', '▨', '▦'].filter(g => TILEDRAW[g]);
      if (faces.length < 2) problems.push('fewer than two casita faces are drawable, so the roofline check measured nothing');
      const pxAt = (d, r, c) => d.slice((r * 32 + c) * 4, (r * 32 + c) * 4 + 4).join(',');
      const bands = faces.map(g => ({ g, d: bake(g, 4, 2) }));
      bands.forEach(b => { for (let r = 3; r < 8; r++) for (let c = 0; c < 24; c++)
        if (pxAt(b.d, r, c) !== pxAt(b.d, r, c + 8))
          { problems.push('the roof course on ' + b.g + ' does not repeat every 8 px across the tile (row ' + r + ', column ' + c + '): its pitch does not divide 32, so two of these side by side show the join'); return; } });
      bands.forEach(b => { for (let r = 0; r < 8; r++) [0, 31].forEach(c => {
        if (pxAt(b.d, r, c) === pxAt(b.d, 20, 2))
          problems.push('the roof on ' + b.g + ' does not reach column ' + c + ' of its own tile (row ' + r + ' is still wall there): the roofline stops short of the join and two houses will not make one roof'); }); });
      for (let i = 1; i < bands.length; i++) { for (let r = 0; r < 8; r++) for (let c = 0; c < 32; c++)
        if (pxAt(bands[0].d, r, c) !== pxAt(bands[i].d, r, c))
          { problems.push('the roof band of ' + bands[0].g + ' and ' + bands[i].g + ' differ at row ' + r + ', column ' + c + ': they are meant to be one roof over one house, and a person will see the step where the two meet'); r = 8; break; } }

      // (4) AND THE ROOF RUNS THROUGH THE FRONT DOOR IN THE DRAWING TOO — which (2) above does NOT
      // cover, because (2) reads the 3D mesh and the owner photographs the flat front camera. The
      // first shaped casita carried its roof over the door in 3D and broke it dead at the doorway
      // in 2D: two roof stubs with a grey gap, louder than the flat lids they replaced. A door
      // fills its whole tile, so this only works through the engine's `cap` seam.
      const homeDoor = (typeof DOORLOOK !== 'undefined') && DOORLOOK['⌂'];
      if (!homeDoor || !homeDoor.cap) problems.push('the casa front door ⌂ declares no roof cap, so the engine draws it full-tile and the roofline of every casita breaks at its own front door');
      else {
        const dd = bake('⌂', 5, 2), ww = bake('▩', 4, 2);
        let same = true;
        for (let r = 0; r < 8 && same; r++) for (let c = 0; c < 32; c++)
          if (pxAt(dd, r, c) !== pxAt(ww, r, c)) {
            problems.push('the roof course over the front door differs from the course on the wall beside it at row ' + r + ', column ' + c + ': the house reads as two buildings with a doorway between them, which is exactly what it was shaped to stop');
            same = false; break; }
        // and it must NOT be painted on in 3D, where the roof is real geometry standing over the
        // door slab — a second one baked onto the slab hangs inside the house
        const dbk = (() => { const c2 = document.createElement('canvas'); c2.width = 32; c2.height = 32;
          const old = ctx; ctx = c2.getContext('2d');
          try { TILEDRAW['⌂']({ sx: 0, sy: 0, x: 5, y: 2, t: 1, bake: true }); } finally { ctx = old; }
          return c2.getContext('2d').getImageData(0, 0, 32, 32).data; })();
        let painted = 0; for (let c = 0; c < 32; c++) if (pxAt(dbk, 2, c) === pxAt(ww, 2, c)) painted++;
        if (painted > 24) problems.push('the door slab baked for 3D has the roof course painted on it as well as standing over it in geometry: the house wears two roofs, one of them inside itself');
      }

      // (5) THE ❗ YOU PRESS IS STILL VISIBLE. The door marker rides a billboard lifted above the
      // door; that lift was a constant 1.0 chosen against a flat lid at wallH≈1.096, and a roof
      // carried over the doorway at 1.10–1.47 swallowed it whole. Found by a reader looking at the
      // lane's own before/after frames, not by any suite: the arrow became a 6-px cream stub.
      // ❗IT READS WHERE THE ARROW ACTUALLY ENDED UP. The first draft of this check recomputed the
      // engine's own lift — max(1.0, cover+0.20) — and then compared it to `cover`, so it agreed
      // with its own arithmetic: putting the engine back to the flat h:1.0 left it GREEN. Planted
      // and caught in the lab, which is the first of the four questions in .claude/skills/guard.
      // So: find the sprite the engine placed, and ask it how high it is.
      const cov = (T3.group && T3.group.userData && T3.group.userData.cover) || {};
      const arrows = (T3.pool || []).filter(p => p.live && p.spr && p.spr.visible && p.spr.userData && p.spr.userData.mark === 'door');
      if (!arrows.length) problems.push('no door marker is standing anywhere near Doña Tencha\'s front door, so the marker-clearance check measured nothing — that is a red, not a pass');
      let covered = 0;
      arrows.forEach(p => {
        // which door tile is this arrow over? the billboard is pulled 0.34 toward the camera
        let best = null, bd = 9;
        for (let y = 0; y < WORLDS.ex.H; y++) for (let x = 0; x < WORLDS.ex.W; x++) {
          if (!portalAt('ex', x, y)) continue;
          const d = Math.hypot(p.spr.position.x - (x + 0.5), p.spr.position.z - (y + 0.5));
          if (d < bd) { bd = d; best = [x, y]; } }
        if (!best || bd > 0.75) return;
        const over = cov[best[0] + ',' + best[1]] || 0; if (over <= 0) return;
        covered++;
        // drawDoorMark's lowest ink sits 0.175 of a tile below the sprite's centre, bob included
        const bottom = p.spr.position.y - 0.175;
        if (bottom < over) problems.push('the ❗ over the door at ' + best[0] + ',' + best[1] + ' is inside the roof that is carried over it (the roof reaches ' + over.toFixed(2) + ', the mark bottoms out at ' + bottom.toFixed(2) + '): the one cue that says this door opens is hidden, and a player has no way to know the house can be entered');
      });
      if (arrows.length && !covered) problems.push('no door on Calle Dos has anything carried over it, so the marker-clearance check measured nothing — that is a red, not a pass');

      // (6) AND NOTHING HUNG ON A SHAPED WALL IS BURIED IN IT. engine3d.js hangs wall decor
      // 0.505 from the middle of a tile — 0.005 proud of the wall plane — and a shaped facade's
      // relief stands PROUD of that plane, because a solid box has no hole in it and an opening
      // here is built out, never cut in. The casa's sill reaches 0.627. No DECOR row lands on a
      // casa today, so this would pass by finding nothing; it therefore proves it can fire first,
      // against a decor row placed on a shaped tile on purpose, and only then reads the real ones.
      const DECO_Y = 0.62, DECO_PROUD = 0.505, DECO_HALF = 0.47;
      const buries = o => { const pa = o.geometry.attributes.position.array; let reach = 0;
        for (let i = 0; i < pa.length; i += 3) { const Y = pa[i + 1];
          if (Y < DECO_Y - DECO_HALF || Y > DECO_Y + DECO_HALF) continue;
          if (Math.abs(pa[i + 2]) <= 0.5 + 1e-4 && Math.abs(pa[i]) > reach) reach = Math.abs(pa[i]);
          if (Math.abs(pa[i]) <= 0.5 + 1e-4 && Math.abs(pa[i + 2]) > reach) reach = Math.abs(pa[i + 2]); }
        return reach > DECO_PROUD ? reach : 0; };
      if (!shaped.some(buries)) problems.push('the buried-decor check found no shaped wall whose face stands proud of 0.505, so it cannot tell a buried poster from a visible one and measured nothing — that is a red, not a pass');
      // (7) AND NO CASITA FACE GOES UP ON A STREET WITHOUT A SHAPE. ▦ la reja is drawn, wears the
      // shared 2D roofline, and stands on NO lot in the shipped game — BUILDTPL.casita uses it and
      // no row of BUILDS uses that template. It was left a box on purpose: the owner said "just do
      // one or two and show me" and an hour on a tile nobody can walk to is an hour of his tokens.
      // What must never happen QUIETLY is the day somebody builds a casita lot: a flat-lidded box
      // would stand in the middle of a pitched roof, in 3D only, and the two cameras would disagree
      // about the same house with nothing anywhere to say so. This is that day's alarm.
      const casitaLots = (typeof BUILDS !== 'undefined' ? BUILDS : []).filter(b => b.tpl === 'casita');
      const unshaped = ['▩', '▨', '▦'].filter(g => TILEDRAW[g] && !(typeof TILEMESH !== 'undefined' && TILEMESH[g]));
      if (casitaLots.length && unshaped.length)
        problems.push('a casita lot is built (' + casitaLots.map(b => b.id).join(', ') + ') and ' + unshaped.join(' ')
          + ' still has no shape: in 3D it will stand as a flat-lidded box in the middle of its own pitched roof while the flat cameras show it with one, and the same house will look like two different buildings depending on which camera you are in');
      if (!unshaped.length && !casitaLots.length && !['▩', '▨', '▦'].some(g => TILEDRAW[g]))
        problems.push('no casita face is drawable at all, so the unshaped-lot check measured nothing — that is a red, not a pass');

      if (typeof DECOR !== 'undefined') DECOR.forEach(d => {
        const hit = shaped.find(o => o.userData.x === d.x && o.userData.y === d.y && d.world === 'ex');
        const r = hit && buries(hit);
        if (r) problems.push('the ' + d.deco + ' at ' + d.x + ',' + d.y + ' is hung 0.505 from the middle of a tile whose ' + hit.userData.g + ' reaches ' + r.toFixed(3) + ': it is inside the wall and nobody will ever see it, and nothing in the engine will say so');
      });

      // (8) THE ROOF GOES OVER A FRONT DOOR AND NOWHERE ELSE — every door in the game, drawn twice.
      //
      // ❗THIS IS THE ONE THE LAST ROUND SHIPPED AND EVERY SUITE CALLED GREEN. The cap was hung on
      // the GLYPH and nothing asked where the glyph STOOD. `⌂` is a casa's front door and it is
      // also the way out of the room behind it — CASA_ROOM ends "#####⌂####", and so do the
      // barbería's and the caseta's — so a course of terracotta roof tiles was painted across the
      // top of the door INSIDE Doña Tencha's living room, indoors, in three rooms. Found by looking
      // at the picture, never by a suite (docs/POSTMORTEM.md §2).
      //
      // It also holds the engine to the sentence the owner was given when he was asked what keeping
      // this seam costs: "it is opt-in per door, every door that declares nothing is unchanged, no
      // building metadata is updated anywhere." So this does not read the seam's flags — it DRAWS
      // every door tile in the game as it ships, draws it again with the cap switched off, and
      // compares all 4096 bytes. The tiles that differ must be exactly the ones with a house beside
      // them, and every other door in both games must come out byte-identical.
      const roofed = [], plain = [];
      {
        const bakeAt = (ch, tx, ty) => { const c = document.createElement('canvas'); c.width = 32; c.height = 32;
          const old = ctx; ctx = c.getContext('2d');
          // t is pinned: the threshold's glow is a sine of the clock and two bakes a millisecond
          // apart would differ on their own, which would make this check report noise as a fault
          try { TILEDRAW[ch]({ sx: 0, sy: 0, x: tx, y: ty, t: 1, canopy: () => {} }); } finally { ctx = old; }
          return c.getContext('2d').getImageData(0, 0, 32, 32).data.join(','); };
        const tiles = [];
        Object.keys(WORLDS).forEach(wid => { const W = WORLDS[wid]; if (!W || !W.rows) return;
          W.rows.forEach((row, ty) => { for (let tx = 0; tx < row.length; tx++)
            if (DOORSET.has(row[tx]) && TILEDRAW[row[tx]]) tiles.push({ wid, x: tx, y: ty, ch: row[tx] }); }); });
        if (tiles.length < 2) problems.push('fewer than two doors were found in the whole game, so the opt-in check measured nothing — that is a red, not a pass');
        const hl = (typeof DOORLOOK !== 'undefined') && DOORLOOK['⌂'];
        const keepCap = hl && hl.cap, keepH = hl && hl.capH, w0 = world;
        try {
          tiles.forEach(d => { world = d.wid; d.shipped = bakeAt(d.ch, d.x, d.y); });
          if (hl) hl.cap = null;
          tiles.forEach(d => { world = d.wid; d.plain = bakeAt(d.ch, d.x, d.y); });
        } finally { if (hl) { hl.cap = keepCap; hl.capH = keepH; } world = w0; }
        tiles.forEach(d => {
          const row = WORLDS[d.wid].rows[d.y];
          const nb = [row[d.x - 1], row[d.x + 1]].filter(c => c !== undefined);
          const house = nb.some(c => CASA_FACE.indexOf(c) >= 0);  // the pack's one list, not a copy (#241)
          if (d.shipped !== d.plain) { roofed.push(d.wid + ' ' + d.x + ',' + d.y);
            if (!house) problems.push('the door at ' + d.x + ',' + d.y + ' in "' + d.wid + '" has a course of roof tiles painted across the top of it and there is no house beside it — what stands either side of it is "' + nb.join('" and "') + '". Inside a room that is a strip of terracotta roof over a living-room doorway, and it is the same door glyph as the front door only because a home and the room behind it share one'); }
          else { plain.push(d.wid + ' ' + d.x + ',' + d.y);
            if (house) problems.push('the front door at ' + d.x + ',' + d.y + ' in "' + d.wid + '" has a casa face beside it and wears no roof: the roofline breaks at the doorway and the house reads as two boxes with a gap between them, which is what the owner said when he looked at it'); }
        });
        if (!roofed.length) problems.push('not one door in the game takes the roof cap, so this check cannot tell an opt-in seam from a dead one — that is a red, not a pass');
        if (!plain.length) problems.push('every door in the game changed when the roof cap was switched off, so "every door that declares nothing is unchanged" is false — that is a red, not a pass');
      }

      // (9) AND THE ❗ OVER EVERY OTHER DOOR IN THE GAME IS STILL AT EXACTLY 1.0. The marker's lift
      // stopped being a constant when a roof started being carried over a doorway; the promise made
      // in exchange was that nothing else moves. This walks every world that has a portal in it,
      // builds the scene, and reads the sprite the engine actually placed — not the formula.
      // It walks to EVERY door in the game rather than standing in one place and reading what
      // happens to be near: the first draft parked the hero in the middle of each world and reached
      // three doors out of thirty-odd, because a marker that is out of the billboard pool's range
      // is not a marker that is at 1.0, it is a marker nobody measured. The scene is rebuilt once
      // per world and the hero then walked door to door inside it, so the sweep costs one build a
      // world and not one a door.
      {
        const w0 = world, x0 = px, y0 = py;
        let atOne = 0, raised = 0, unseen = 0, tally = [];
        // every DOOR TILE on every map, not every entry in PORTALSAT: a coordinate portal is only
        // how an interior a template carries is wired up, and taking the list from there reached
        // three doors — the three rooms — and called the other thirty-five measured.
        const byW = {};
        Object.keys(WORLDS).forEach(wid => { const W = WORLDS[wid]; if (!W || !W.rows) return;
          W.rows.forEach((row, dy) => { for (let dx = 0; dx < row.length; dx++)
            if (DOORSET.has(row[dx])) (byW[wid] = byW[wid] || []).push([dx, dy]); }); });
        try {
          Object.keys(byW).forEach(wid => {
            world = wid; moving = false; held = null;
            px = fx = byW[wid][0][0]; py = fy = byW[wid][0][1];
            t3Invalidate(); draw3d();
            const cov = (T3.group && T3.group.userData && T3.group.userData.cover) || {};
            byW[wid].forEach(([dx, dy]) => {
              px = fx = dx; py = fy = dy; draw3d();          // walk to it; the scene is already standing
              // a door glyph that is not a portal leads nowhere yet and wears no ❗ by design
              // (doorMarks asks portalAt, not DOORSET) — that is not a mark this check lost
              if (!portalAt(wid, dx, dy)) return;
              let hit = null, bd = 9;
              (T3.pool || []).filter(p => p.live && p.spr && p.spr.visible && p.spr.userData && p.spr.userData.mark === 'door')
                .forEach(p => { const dd = Math.hypot(p.spr.position.x - (dx + 0.5), p.spr.position.z - (dy + 0.5));
                  if (dd < bd) { bd = dd; hit = p; } });
              if (!hit || bd > 0.75) { unseen++; return; }
              if ((cov[dx + ',' + dy] || 0) > 0) { raised++; return; }
              atOne++; tally.push(wid + ' ' + dx + ',' + dy);
              if (Math.abs(hit.spr.position.y - 1.0) > 1e-9)
                problems.push('the ❗ over the door at ' + dx + ',' + dy + ' in "' + wid + '" is standing at ' + hit.spr.position.y.toFixed(4) + ' and nothing is carried over that tile: the casita roof was supposed to lift the mark at the doorways it covers and leave every other door in both games exactly where it was, and this one moved');
            });
          });
        } finally { world = w0; px = fx = x0; py = fy = y0; t3Invalidate(); draw3d(); }
        if (atOne < 10) problems.push('only ' + atOne + ' door marker' + (atOne === 1 ? '' : 's') + ' in the whole game stood over an uncovered tile where this check could read ' + (atOne === 1 ? 'it' : 'them') + ': "every other door is untouched" is a claim about every door, and a sweep this thin has not made it — that is a red, not a pass');
        if (unseen) problems.push(unseen + ' door' + (unseen === 1 ? '' : 's') + ' in the game open onto somewhere and have no ❗ standing over them at all, so nobody can see they open and this check could not read their height either — the first of those is ' + (tally.length ? 'near ' + tally[0] : 'unnamed'));
        if (!raised) problems.push('not one door marker was found over a tile with something carried across it, so this check cannot tell a lifted mark from an unlifted one — that is a red, not a pass');
      }

      // (10) THE PANE A SWEET STANDS IN. Round one named TWO readers that place in Z shallower than
      // this house's new sill: wall decor (guarded above, (6)) and the calaverita's lit sill pane.
      // This is the second one. The engine hangs that pane 0.12 of a tile proud of the wall face and
      // its ledge at 0.17, and a Sprite is a flat quad — anything of the house's that reaches past
      // it does not share the space with it, it eats it. The first shaped sill reached 0.127 and sat
      // 0.007 in FRONT of the pane.
      //
      // ❗THE DEPTH IS TAKEN OFF A PANE THE ENGINE REALLY PLACED, not off the engine's source. A
      // guard that types the constant back in is testing its own arithmetic.
      // And the rule is geometric, so nothing has to be tagged and nothing can be tagged around:
      // a thing that runs the WIDTH OF THE WALL is the wall — a cast sill, a lintel — and a thing
      // the width of your hand is something somebody carried out and stood on the ledge. A pot in
      // front of a windowpane is a pot in front of a windowpane.
      {
        const w0 = world, s0 = (typeof seasonPick !== 'undefined') ? seasonPick : 'auto';
        let D = null, from = '', PT = null, TP = null;  // the pane's depth, its top edge, and the camera's pitch — all read, none typed
        try {
          seasonSet('muertos');
          const ids = Object.keys(WORLDS);
          for (let i = 0; i < ids.length && D === null; i++) {
            const W = WORLDS[ids[i]]; if (!W || !W.rows) continue;
            world = ids[i]; px = fx = Math.min(W.W - 2, 5); py = fy = Math.min(W.H - 2, 5); moving = false; held = null;
            t3Invalidate(); draw3d();
            (T3.group.children || []).forEach(o => { const u = o.userData || {};
              if (D !== null || !u.calaverita || !u.sill) return;
              D = o.position.z - (u.y + 0.5); PT = o.position.y + o.scale.y / 2; from = ids[i] + ' ' + u.x + ',' + u.y;
              const dir = new THREE.Vector3(); T3.cam.getWorldDirection(dir); TP = Math.tan(Math.asin(-dir.y)); });
          }
        } finally { seasonSet(s0 || 'auto'); world = w0; t3Invalidate(); draw3d(); }
        if (D === null) problems.push('no sugar skull is standing in a lit pane on any sill in the whole game with the season forced to muertos, so the depth this check compares against could not be measured at all — that is a red, not a pass');
        else {
          // the widest run of this shape that stands further out than `d`, in any of the four
          // horizontal directions, measured in the mesh's own frame — and only IN THE HEIGHT BAND A
          // WINDOW CAN BE IN: clear of the plinth at the foot, clear of the ring beam and the eave
          // at the head. A pane hangs in a window and a window is in a wall, so those are the only
          // heights at which standing proud can bury one. The roof is the part that is SUPPOSED to
          // oversail — its eave reaches 0.65 and its barrels 0.75, both wider than a tile — and the
          // first draft of this check, bounded only by the head of the wall, reported all six roofs
          // as buried sills because the fascia dips two thousandths below it. A roof over your head
          // is not in front of your window.
          // ❗AND ONLY WHERE IT CAN STAND BETWEEN THE PANE AND THE CAMERA (#241). Above the pane's top
          // edge, a thing standing further out hides the pane only if the camera's line of sight from
          // that edge passes under it: lower than the edge by nothing, higher by less than (how much
          // further out) × tan(pitch). An awning over a shop window is a roof over the window, as the eave
          // is over the house, and the band's old head (92% of the wall) called it a buried sill. The
          // edge and the pitch are read off the pane and the camera the engine placed, like the depth.
          const WINLO = 0.12, WINHI = 0.92;
          if (PT === null || !(TP > 0)) problems.push('the sweet\'s pane or the 3D camera could not be read (top ' + PT + ', pitch tangent ' + TP + '), so this check cannot tell what stands in front of a pane from what stands over it — that is a red, not a pass');
          const inSight = (y, r, d) => y <= PT + Math.max(0, r - d) * TP;
          const widestBeyond = (o, d) => { const pa = o.geometry.attributes.position.array; let worst = 0, deep = 0;
            const WH = wallH(o.userData.g);
            [[0, 1, 2], [0, -1, 2], [2, 1, 0], [2, -1, 0]].forEach(([ax, sgn, oh]) => {
              let lo = Infinity, hi = -Infinity, far = 0;
              for (let i = 0; i < pa.length; i += 3) { const r = pa[i + ax] * sgn;
                if (pa[i + 1] < WH * WINLO || pa[i + 1] > WH * WINHI) continue;
                if (r <= d + 1e-4) continue;
                if (!inSight(pa[i + 1], r, d)) continue;
                if (r > far) far = r;
                if (pa[i + oh] < lo) lo = pa[i + oh]; if (pa[i + oh] > hi) hi = pa[i + oh]; }
              if (hi > lo && hi - lo > worst) { worst = hi - lo; deep = far; } });
            return [worst, deep]; };
          // it can fire: with the pane hung at the wall face itself, the cast sill must be found
          if (!shaped.some(o => widestBeyond(o, 0.5)[0] > 0.5))
            problems.push('with the pane moved back to the wall face this check still finds no wall-wide cast work on any shaped facade, so it cannot tell a buried pane from a clear one and is measuring nothing — that is a red, not a pass');
          shaped.forEach(o => { const [wide, deep] = widestBeyond(o, D);
            if (wide > 0.5) problems.push('the cast work on ' + o.userData.g + ' at ' + o.userData.x + ',' + o.userData.y + ' stands ' + deep.toFixed(3) + ' out from the middle of its tile and runs ' + wide.toFixed(2) + ' of a tile wide where the camera looks at the pane — that is a sill, a lintel or an awning, not a pot — while the lit pane a sugar skull stands in is hung at ' + D.toFixed(3) + ' (measured off the one at ' + from + '). Give this window a `win` and the sweet\'s pane is clipped along its bottom edge by the very ledge that was built to hold it'); });
        }
      }

      return problems;
    });
    fails.push(...casa3d);

    // every glyph a template can lay is a real, declared, drawable tile
    const gl = await page.evaluate(() => {
      const problems = [], seen = new Set();
      Object.values(BUILDTPL).forEach(t => (t.parts || []).forEach(p => {
        const opts = p.pick || [p];
        opts.forEach(o => (o.tiles || []).forEach(t2 => seen.add(t2[2])));
      }));
      seen.forEach(g => {
        if (g === '.') return;
        if (!TILEDRAW[g] && !TILEART[g] && !DOORSET.has(g)) problems.push('a template lays a glyph nothing can draw: ' + g);
        if (SOLID.has(g) && !TILES[g]) problems.push('a solid template glyph has no metadata: ' + g);
        // #9: no glyph a template can lay is solid AND a door AND portalless everywhere — a door drawn on a wall
        if (SOLID.has(g) && (TILES[g] || {}).kind === 'door' && !Object.values(PORTALS).some(P => P[g])) problems.push('a template lays a solid door no world opens: ' + g);
      });
      return problems;
    });
    fails.push(...gl);
    await page.evaluate(() => { world = 'hq'; px = fx = 10; py = fy = 11; checkTalk(); });
  }

  // ---- 28. DISCOVERABILITY: stand where the game puts you, in every world ----
  // Twice now a feature shipped working and invisible — the stairs (2026-09-03) and the
  // office posters (same day) — because it was only ever checked from on top of the thing.
  // This is the general form of that bug, checked for every world the pack declares.
  {
    const disc = await page.evaluate(() => {
      const problems = [];
      // where a player can appear in a world: through any portal that leads there, the
      // trolley, and the place a new hero starts
      const arrivals = {};
      const add = (w, x, y) => { if (!WORLDS[w]) return; (arrivals[w] = arrivals[w] || []).push([x, y]); };
      Object.keys(WORLDS).forEach(id => portalsOf(id).forEach(({ p }) => { if (p.to) add(p.to, p.x, p.y); })); /* #10: portals by glyph and by place */
      (typeof TRV !== 'undefined' ? TRV : []).forEach(d => add(d.w, d.x, d.y));
      add('hq', 10, 11);                    // where a new hero starts
      add('pk', 2, 6);                      // the park is entered on a leash, not through a door
      const keep = { world, px, py };
      Object.keys(WORLDS).forEach(id => {
        const spots = arrivals[id] || [];
        if (!spots.length) { problems.push('no way into ' + id + ' — nothing points at it'); return; }
        // the pack names the place, in both languages, so arriving says where you are
        if (!UI.en.locs[id] || !UI.es.locs[id]) problems.push(id + ' has no name in both languages');
        if (!UI.en.arrive[id] || !UI.es.arrive[id]) problems.push(id + ' says nothing when you walk in, in one or both languages');
        const reads = (typeof READS !== 'undefined' ? READS : []).filter(r => r.world === id);
        spots.forEach(([sx, sy]) => {
          world = id; px = fx = sx; py = fy = sy; moving = false; held = null;
          // you cannot arrive inside a wall
          if (isSolid(sx, sy)) problems.push('arriving in ' + id + ' at ' + sx + ',' + sy + ' puts you inside something');
          // everything readable in this room announces itself from where you land
          if (reads.length && readMarks().length !== reads.length)
            problems.push('arriving in ' + id + ' at ' + sx + ',' + sy + ': only ' + readMarks().length + ' of ' + reads.length + ' readable things are marked');
          // every person with something to say is either in this room or behind a door that says so
          const waiting = (WORLDS[id].npcs || []).filter(n => hasSay(n));
          if (waiting.length && !worldPending(id)) problems.push(id + ' has someone waiting that worldPending() cannot see');
        });
      });
      world = keep.world; px = fx = keep.px; py = fy = keep.py;
      return problems;
    });
    fails.push(...disc);

    // and the doorstep nudge covers every portal whose far side has somebody waiting
    const nudges = await page.evaluate(() => {
      const problems = [];
      const keep = { world, px, py };
      Object.entries(PORTALS).forEach(([from, P]) => {
        const w = WORLDS[from]; if (!w) return;
        Object.entries(P).forEach(([g, p]) => {
          if (!WORLDS[p.to]) return;
          for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) {
            if (w.rows[y][x] !== g) continue;
            // stand beside the door and ask: if somebody is waiting through it, are we told?
            const spot = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(d => [x + d[0], y + d[1]])
              .find(([nx, ny]) => nx >= 0 && ny >= 0 && nx < w.W && ny < w.H && !isSolidAt(from, nx, ny));
            if (!spot) { problems.push('the door ' + g + ' in ' + from + ' at ' + x + ',' + y + ' has nowhere to stand'); continue; }
            if (!worldPending(p.to)) continue;
            world = from; px = fx = spot[0]; py = fy = spot[1];
            nudgeW = ''; nudged = new Set(); tickerLines.length = 0;
            document.getElementById('world').hidden = false;
            portalNudge();
            if (!tickerLines.length) problems.push('standing beside the door to ' + p.to + ' (where somebody is waiting) says nothing');
          }
        });
      });
      world = keep.world; px = fx = keep.px; py = fy = keep.py;
      nudgeW = ''; nudged = new Set();
      return problems;
    });
    fails.push(...nudges);
    await page.evaluate(() => { world = 'hq'; px = fx = 10; py = fy = 11; checkTalk(); });
  }

  // ---- 29. a delivery says where it landed ----
  // The owner finished districts, pages were pinned to his office wall exactly as designed,
  // and he asked three times where they were. A thing that arrives while you are looking at
  // a different screen has to say so.
  {
    const say = await page.evaluate(() => {
      const problems = [];
      if (typeof ribbonSay !== 'function') return ['deliveries cannot speak'];
      // every ribbon that puts something in a room you are not standing in should say so
      // A ribbon WITH a doorstep walks you to what it built, so its district's toast covers it.
      // A ribbon WITHOUT one lands somewhere you are not standing — that one has to say where.
      ribbons().filter(r => r.tiles && r.id && !r.doorstep).forEach(r => {
        if (!r.say) problems.push('the delivery "' + r.id + '" lands somewhere you are not standing and says nothing');
        else if (!r.say.en || !r.say.es) problems.push('the delivery "' + r.id + '" only speaks one language');
        else if (!/upstairs|office|arriba|oficina/i.test(r.say.en + r.say.es)) problems.push('the delivery "' + r.id + '" does not say WHERE it landed');
      });
      // said once, ever
      const keepSeen = new Set(seenOpen), keepCh = chSeen;
      seenOpen = new Set(); chSeen = 99; applyGrowth(); tickerLines.length = 0;
      ribbonSay();
      const firstMarked = [...seenOpen].filter(k => k.indexOf('r:') === 0).length;
      const before = seenOpen.size;
      ribbonSay();
      if (seenOpen.size !== before) problems.push('a delivery announced itself twice');
      if (!firstMarked) problems.push('no delivery was announced at all with the whole city open');
      seenOpen = keepSeen; chSeen = keepCh; applyGrowth();
      return problems;
    });
    fails.push(...say);
    // and the line actually reaches the player
    await page.evaluate(() => { seenOpen = new Set(); chSeen = 99; applyGrowth(); tickerLines.length = 0; ribbonSay(); });
    await page.waitForTimeout(1900);
    const heard = await page.evaluate(() => tickerLines.slice());
    if (!heard.length) fails.push('a delivery was announced but the player never heard it');
    await page.evaluate(() => { tickerLines.length = 0; document.getElementById('ticker').hidden = true; });
  }

  // ---- 30. paper a person hands you ----
  // The owner, 2026-09-04: "no she says it and shows a fake doc- the important ones are the
  // ones for AI roles but lets help me see it and live it." A node may name a document. This
  // section is here because a mistyped id would show a button that opens nothing, and because
  // closing that document has to put you back in front of the person, not out on the street.
  {
    const paper = await page.evaluate(() => {
      const problems = [];
      if (typeof docDef !== 'function') return ['a person cannot hand over paper at all'];

      // every document named by a node, in BOTH languages, actually builds
      ['en', 'es'].forEach(L => {
        const keep = lang; lang = L;
        const Q = L === 'en' ? QEN : QES, F = L === 'en' ? FQEN : FQES;
        Q.concat([F]).forEach((q, qi) => Object.keys(q.nodes).forEach(k => {
          const d = q.nodes[k].doc; if (!d) return;
          const secs = docSections(d);
          const nm = L + ' quest ' + qi + ' node ' + k;
          if (!secs) problems.push(nm + ' hands over a document that does not exist: ' + JSON.stringify(d));
          else if (!secs.length) problems.push(nm + ' hands over an empty sheet');
          if (!docTitle(d)) problems.push(nm + ' hands over paper with no title');
        }));
        lang = keep;
      });

      // a document written inline is as real as one in DOCS — the seam takes both
      const inline = { title: { en: 'PROBE SHEET', es: 'HOJA PROBE' },
                       build: () => [{ h: 'PROBE' }, { p: 'one line' }] };
      if (!docSections(inline)) problems.push('a document written inline does not build');
      if (docTitle(inline) !== 'PROBE SHEET') problems.push('an inline document loses its title');
      if (!/PROBE/.test(docMarkdown(inline))) problems.push('an inline document cannot be exported');

      // handed over inside a quest: the way back is the card, and fullscreen survives.
      // The street's talk check is the tell — it belongs to the world, and running it while
      // the player is still in a conversation lights the talk button and fires doorstep lines
      // behind the card. Count the calls; do not guess from side effects.
      const realTalk = checkTalk; let talkRan = 0;
      checkTalk = function () { talkRan++; return realTalk.apply(this, arguments); };
      const wasFsBefore = wasFs, vp = document.getElementById('vp');
      const hadFs = vp.classList.contains('fs');
      vp.classList.add('fs');            // pretend the player is playing fullscreen, as on a phone
      questStart(0);
      if (wasFs !== true) problems.push('a quest did not record that the player was fullscreen');
      docOpen(inline, 'card');
      if (wasFs !== true) problems.push('opening paper mid-quest threw away the way back to fullscreen');
      if (document.getElementById('reader').hidden) problems.push('the paper never opened');
      if (document.getElementById('card').hidden) problems.push('the card vanished behind the paper');
      // MEASURE it, never trust .hidden. The reader used to live inside #vp, inside #world, and a
      // quest hides #world — so this panel reported hidden:false at 0x0 and rendered nothing at
      // all. Every assertion above passed while the player saw a blank screen (found 2026-09-04).
      const rb = document.getElementById('reader').getBoundingClientRect();
      if (rb.width < 200 || rb.height < 200)
        problems.push('the paper opened into a collapsed container — ' + Math.round(rb.width) + 'x' + Math.round(rb.height) + '; check what the reader is nested inside');
      const cb = document.getElementById('docClose').getBoundingClientRect();
      if (cb.bottom > rb.height + 1 || cb.width < 10)
        problems.push('the way out of a long document is off-screen; the action bar must stay in reach');
      talkRan = 0;
      document.getElementById('docClose').click();
      if (!document.getElementById('reader').hidden) problems.push('the paper would not close');
      if (document.getElementById('card').hidden) problems.push('closing the paper left the conversation');
      if (!document.getElementById('world').hidden) problems.push('closing the paper dumped the player on the street');
      if (talkRan) problems.push('closing paper handed over mid-quest ran the street check behind the card');
      if (docBack) problems.push('the way back was never cleared — the next document would think it came from a quest');

      // read off a wall, and the way back is the street, talk check and all
      talkRan = 0;
      docOpen('file');
      if (docBack) problems.push('a wall document thinks somebody handed it to you');
      document.getElementById('docClose').click();
      if (!talkRan) problems.push('closing a wall document no longer returns the player to the street');

      checkTalk = realTalk;
      wasFs = wasFsBefore;
      if (!hadFs) vp.classList.remove('fs');
      document.body.classList.remove('noscroll');
      return problems;
    });
    fails.push(...paper);

    // and when a node names paper, the card holds it out, labelled with what the PAPER is
    const held = await page.evaluate(() => {
      const probe = { hand: { en: 'PROBE TAKE IT', es: 'PROBE TOMALA' },
                      title: { en: 'PROBE SHEET', es: 'HOJA PROBE' }, build: () => [{ p: 'x' }] };
      const q = AQ()[0], k = q.start, had = q.nodes[k].doc;
      q.nodes[k].doc = probe; questStart(0);
      const b = document.getElementById('npcDoc'), out = { hidden: b.hidden, txt: b.textContent };
      // a document with no `hand` label still gets a working button, not a blank one
      q.nodes[k].doc = { title: { en: 'BARE', es: 'BARE' }, build: () => [{ p: 'x' }] };
      nodeShow(); out.bare = document.getElementById('npcDoc').textContent;
      q.nodes[k].doc = had; nodeShow();
      out.gone = document.getElementById('npcDoc').hidden;
      return out;
    });
    if (held.hidden) fails.push('a node named a document and the card did not hold it out');
    if (held.txt && held.txt.indexOf('PROBE TAKE IT') < 0) fails.push('the held-out paper is not labelled with what it is: ' + held.txt);
    if (!held.bare) fails.push('a document with no hand label gives the player a blank button');
    if (!held.gone) fails.push('a node with no document still shows a sheet from the node before');
    await page.evaluate(() => { document.getElementById('card').hidden = true; showWorld(); });

    // the shipped pack hands over SHARED documents, never one written inside a node.
    // The engine takes both (docDef, tested above) so the architecture can grow; the CONTENT
    // stays disciplined, because a document written inside a quest lives in two language
    // files and nothing in this build compares its prose.
    const discipline = await page.evaluate(() => {
      const problems = [];
      [['en', QEN.concat([FQEN])], ['es', QES.concat([FQES])]].forEach(([L, list]) =>
        list.forEach((q, i) => Object.keys(q.nodes).forEach(k => {
          const d = q.nodes[k].doc; if (!d) return;
          const nm = L + ' quest ' + i + ' node ' + k;
          if (typeof d !== 'string') problems.push(nm + ' writes a document inline; it belongs in DOCS, where both languages sit on one line');
          else if (!DC()[d]) problems.push(nm + ' names a document DOCS does not have: ' + d);
        })));
      return problems;
    });
    fails.push(...discipline);

    // paper you were handed reaches the office file, and survives a save/load round trip
    const record = await page.evaluate(() => {
      const problems = [], keep = [...handedDocs];
      handedDocs = new Set();
      const before = JSON.stringify(docSections('file'));
      if (/handed you|la gente te dio/.test(before)) problems.push('the office file lists handed paper before any was handed');
      questStart(16);                       // Chelo's list is on this quest's opening node
      if (!handedDocs.has('lista-chelo')) problems.push('a document was held out and the file never recorded it');
      save();
      const round = sanitizeSave(JSON.parse(localStorage.getItem('mq1')));
      if (!round || (round.hd || []).indexOf('lista-chelo') < 0) problems.push('handed paper does not survive being saved and loaded back');
      const after = JSON.stringify(docSections('file'));
      if (!/handed you|la gente te dio/.test(after)) problems.push('the office file does not show what people handed you');
      if (after.indexOf('lista-chelo') < 0) problems.push('the file records the pile but not the page');
      handedDocs = new Set(keep);
      return problems;
    });
    fails.push(...record);
    await page.evaluate(() => { document.getElementById('card').hidden = true; showWorld(); });
  }

  // ---- 31. a staircase stands up ----
  // Owner, 2026-09-04: "those stairs are trash. not realistic." The drawing was only half of
  // it — "1" is walkable, and the engine had exactly two categories, flat ground art or solid
  // geometry. So the front camera and the 3D ground bake painted the stair's TOP-DOWN art flat
  // onto the floor and the iso pass drew a gold lozenge: it read as a gate lying down in three
  // of four cameras, and 3D is the one the game boots into.
  {
    const stairs = await page.evaluate(() => {
      const problems = [];
      if (typeof stands !== 'function') return ['a walkable tile can never be drawn standing'];
      if (!stands('1')) problems.push('the stairs are not flagged as a thing that stands up');
      if (!TILESIDE['1']) problems.push('the stairs have no profile drawing, so nothing can stand them up');
      if (!TILES['1'] || TILES['1'].kind !== 'stair') problems.push('the stairs do not say what they are');
      if (IZH['1'] !== undefined) problems.push('IZH["1"] is back; the iso block pass runs for SOLID glyphs only, so it is a number nothing reads');

      // the decisive test: which drawing does each camera actually CALL near the stairs?
      const spy = g => { const plan = TILEDRAW[g], side = TILESIDE[g], n = { plan: 0, side: 0 };
        TILEDRAW[g] = rc => { n.plan++; return plan(rc); };
        TILESIDE[g] = rc => { n.side++; return side(rc); };
        n.restore = () => { TILEDRAW[g] = plan; TILESIDE[g] = side; }; return n; };
      const keepW = world, keepX = px, keepY = py, keepC = camMode, keepFx = fx, keepFy = fy;
      // the camera follows fx/fy, not px/py — move both or the stairs are off-screen and every
      // count below is zero for the wrong reason
      // #7 (2026-09-07): the last old '1' left the city (Nolasco's well is the engine's flight now), so the
      // stand-tile category is proven on the CONE at (4,4) on the street — walkable, drawn standing, kickable
      world = 'st'; px = fx = 5; py = fy = 4;

      const f = spy('C'); camSet('front'); drawFront();
      if (f.plan) problems.push('the front camera still paints the stairs flat on the floor (' + f.plan + ' calls)');
      if (!f.side) problems.push('the front camera never draws the stairs standing');
      f.restore();

      const t = spy('C'); camSet('top'); draw();
      if (!t.plan) problems.push('the top camera lost the stairs entirely — it is the one camera a plan view is right for');
      t.restore();

      world = keepW; px = keepX; py = keepY; fx = keepFx; fy = keepFy; camSet(keepC);
      return problems;
    });
    fails.push(...stairs);

    // the arrow over a portal points the way that portal goes
    const arrow = await page.evaluate(() => {
      const problems = [], keepW = world, keepX = px, keepY = py;
      const markAt = (w2, x, y, ch) => { world = w2; px = x; py = y;
        const d = doorMarks().find(m => m.ch === ch); return d ? (d.mark || 'down') : null; };
      if (markAt('hq', 13, 14, '▲') !== 'up') problems.push('HQ\'s flight climbs to the office and its marker still points down');
      if (markAt('f2', 11, 14, '▼') !== 'down') problems.push('the office\'s way down does not say so');
      if (markAt('no', 18, 4, '▼') !== 'down') problems.push('Nolasco\'s well goes down to the avenue and its marker does not say so (#7)');
      if (Object.values(WORLDS).some(w => w.rows.some(r => r.includes('1')))) problems.push('the old stair glyph is still laid somewhere — Nolasco\'s was the last (#7)');
      world = keepW; px = keepX; py = keepY;
      return problems;
    });
    fails.push(...arrow);

    // and the engine stopped naming a content pack's glyphs to decide how to draw them
    {
      const eng = fs.readFileSync(path.resolve(__dirname, '..', 'engine', 'engine3d.js'), 'utf8');
      if (/"345"/.test(eng)) fails.push('engine3d.js still hardcodes a pack glyph list ("345") instead of asking the tile');
      const bare = f => fs.readFileSync(path.resolve(ENGINE_DIR, f), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      engineFiles(fails).forEach(f => {
        if (/\bMQT\b/.test(bare(f)))
          fails.push('engine/' + f + ' spells this pack\'s transit brand — a pack name in engine code is the one thing the portability law forbids');
      });
    }
  }

  // ---- 32. a building has faces ----
  // Pili, 2026-09-04: ambient 0.95 against a sun of 0.5 put three of a box's five faces at or
  // past full brightness and left the other two identical, so every building in the city
  // rendered as one flat colour from every angle. That is not an art problem and no drawing
  // fixes it. This section is arithmetic, not pixels: it holds the light to a real ladder.
  {
    const light = await page.evaluate(() => {
      const problems = [];
      if (typeof DAY_AMB === 'undefined' || typeof DAY_SUN === 'undefined')
        return ['the daylight is no longer named, so nothing can check it'];
      const L = [14, 22, 8], n = Math.hypot(L[0], L[1], L[2]), d = L.map(v => v / n);
      const faces = { top: [0, 1, 0], east: [1, 0, 0], west: [-1, 0, 0], north: [0, 0, -1], south: [0, 0, 1] };
      const lit = {};
      Object.keys(faces).forEach(k => {
        const v = faces[k], dot = Math.max(0, v[0] * d[0] + v[1] * d[1] + v[2] * d[2]);
        lit[k] = DAY_AMB + DAY_SUN * dot;
      });
      // nothing may clip: a face past 1.0 is white, and two white faces are one face
      Object.keys(lit).forEach(k => { if (lit[k] > 1.001)
        problems.push('the ' + k + ' face of every building clips to white at ' + lit[k].toFixed(2) + ' — raise nothing, lower the ambient'); });
      // and there has to be a real ladder, or the box is a flat cutout again
      const spread = lit.top - lit.north;
      if (spread < 0.22) problems.push('a building\'s lightest and darkest faces are only ' + spread.toFixed(2) + ' apart; it will read as wallpaper');
      if (Math.abs(lit.east - lit.south) < 0.04) problems.push('two side faces of a building are the same value');
      if (DAY_AMB < 0.4) problems.push('the shadow side is so dark the city stops reading as daylight');
      return problems;
    });
    fails.push(...light);

    // and the 3D ground plants what stands on it, the way both 2D cameras already do
    {
      const g3 = fs.readFileSync(path.resolve(__dirname, '..', 'engine', 'engine3d.js'), 'utf8');
      if (!/CONTACT SHADOW/.test(g3) || !/createLinearGradient/.test(g3))
        fails.push('the 3D ground no longer darkens where a solid meets it — every building floats in the camera the game boots into');
    }
  }

  // ---- 33. the dog comes through the door ----
  // Asked for on 2026-09-04: the dog can follow the player anywhere; told to stay or sit, he stops
  // following; and sometimes he follows just for fun.
  // A critter in a world you are not in only idles, so no dog had ever crossed a threshold.
  {
    const dog = await page.evaluate(() => {
      const problems = [];
      if (typeof dogsFollow !== 'function') return ['a dog cannot cross a door at all'];
      const star = CRIT.find(c => c.role === 'star');
      if (!star) return ['the star dog is not in the world'];

      const keep = { w: star.world, x: star.x, y: star.y, f: star.follow, h: star.holdT, s: star.stayT,
                     pw: world, px: px, py: py };
      const put = (w2, x, y) => { star.world = w2; star.x = x; star.y = y; star.fx = x; star.fy = y; };
      // stand on hq's stairs and cross to the office, with the dog at your heel
      const cross = () => { world = 'hq'; px = fx = 17; py = fy = 6;
        put('hq', 17, 7); star.moving = false;
        const fw = world, fx0 = px, fy0 = py;
        world = 'f2'; px = fx = 17; py = fy = 11;            // where hq's stair portal lands you
        dogsFollow(fw, fx0, fy0); };

      // 1. following: he comes
      star.follow = true; star.holdT = 0; star.stayT = 0;
      cross();
      if (star.world !== 'f2') problems.push('a dog on follow did not come through the door');
      const w2 = WORLDS['f2'];
      if (star.world === 'f2') {
        if (SOLID.has(w2.grid[star.y][star.x])) problems.push('the dog arrived inside a wall');
        if (star.x === px && star.y === py) problems.push('the dog arrived standing on the player');
        if (Math.abs(star.x - px) + Math.abs(star.y - py) > 5) problems.push('the dog arrived across the room instead of beside you');
        if (star.fx !== star.x || star.fy !== star.y) problems.push('the dog arrived mid-slide and will skate to his tile');
      }

      // 2. told to STAY: he stays, even though you left the room
      star.follow = true; star.stayT = performance.now() + 9000; star.holdT = star.stayT;
      cross();
      if (star.world !== 'hq') problems.push('a dog told to stay was dragged through the door anyway');

      // 3. told to SIT: same — the owner grouped them
      star.follow = true; star.stayT = 0; star.holdT = performance.now() + 4000;
      cross();
      if (star.world !== 'hq') problems.push('a dog told to sit was dragged through the door anyway');

      // 4. not following and far from the door: he stays put, always
      star.follow = false; star.holdT = 0; star.stayT = 0;
      let dragged = 0;
      for (let i = 0; i < 40; i++) {
        world = 'hq'; px = fx = 17; py = fy = 6;
        put('hq', 10, 12);                                   // across the room
        const fw = world, fx0 = px, fy0 = py;
        world = 'f2'; px = fx = 17; py = fy = 11;
        dogsFollow(fw, fx0, fy0);
        if (star.world === 'f2') dragged++;
      }
      if (dragged) problems.push('a dog across the room followed you through a door ' + dragged + '/40 times — he cannot teleport to the door');

      // 5. not following but AT YOUR HEEL: sometimes, for fun — not never, not always
      star.follow = false; star.holdT = 0; star.stayT = 0;
      let came = 0;
      for (let i = 0; i < 300; i++) { cross(); if (star.world === 'f2') came++; }
      if (came === 0) problems.push('an off-duty dog at your heel never once came along for fun');
      if (came === 300) problems.push('an off-duty dog came along every single time — that is a shadow, not a dog');

      // 5b. AND IT IS ACTUALLY WIRED TO THE DOOR. Everything above calls dogsFollow() directly,
      // which proves the function works and NOT that walking through a door ever calls it. Drive
      // the real path: stand on the portal tile and let tryPortal() run.
      {
        const hq = WORLDS['hq']; let sx = -1, sy = -1;
        for (let y = 0; y < hq.H; y++) for (let x = 0; x < hq.W; x++) if (hq.rows[y][x] === '▲') { sx = x; sy = y; }
        if (sx < 0) problems.push('no stair head in hq to test the door with');
        else {
          world = 'hq'; px = fx = sx; py = fy = sy;
          put('hq', sx, sy + 1); star.follow = true; star.holdT = 0; star.stayT = 0; star.moving = false;
          portalHold = ''; portalT = 0;
          /* TWO CALLS, because since mq-v171 the swap happens BEHIND A SHUTTING DOOR (the owner's
             option A): the first call starts the door and parks the warp, the second completes it
             once the door has shut. The claim this check makes has not changed — walking through a
             door brings the dog — only the number of frames the real path takes. Driving it in one
             call would be testing the old timing rather than the wiring. */
          const t0 = performance.now() + 5000;
          const started = tryPortal(t0);
          const warped = started && tryPortal(t0 + 1000);
          if (!started) problems.push('standing on the stairs did not travel — the wiring test proves nothing');
          else if (!warped) problems.push('the door shut on the stairs and never opened — the warp was parked and dropped');
          else if (world === 'hq') problems.push('the door shut and the world never changed behind it');
          else if (star.world === 'hq') problems.push('walking through a door does not bring the dog: dogsFollow is never called from tryPortal');
        }
      }

      // 5c. THE TROLLEY IS ALSO A WAY THE WORLD CHANGES. It is a second world switch that does not
      // go through tryPortal, and it silently skipped every arrival step — you rode across town and
      // the dog you were walking with was still standing at the stop.
      {
        world = 'st'; px = fx = 1; py = fy = 1;
        /* row 2 in st is the tram's own line. He used to be put there, and since the critters
           learned to keep off the rails he sometimes could not get out of the way — the player is on
           one side of him and a wall on the other — so the ride waited for him and this check went
           intermittently red thirty checks later, on a traffic cone. The dog belongs beside you. */
        put('st', 1, 3); star.follow = true; star.holdT = 0; star.stayT = 0; star.moving = false;
        openTravel();
        const btn = [...document.querySelectorAll('#tvList button')].find(b2 => !b2.disabled);
        if (!btn) problems.push('the trolley offered nowhere to go, so this proves nothing');
        else {
          btn.click();
          /* since mq-v150 the pass starts a RIDE, so the world changes at the end of the line and
             not on the click. The dog is the point of this check and the dog is handed over by
             worldArrived() either way — which is exactly why worldArrived() exists. Ride it out. */
          /* the car only, and deliberately NOT the critters. Ticking them here wandered the whole
             city's fauna six hundred frames forward inside one check, and a butterfly that ended up
             beside the traffic cone made the cone-kick check thirty checks later go red — a cone
             cannot be kicked onto a tile something is standing on. A check that moves the world on
             behalf of its own subject has to put it back, and the cheapest way to put it back is not
             to move it. The dog beside this stop is off the rails, so nothing needs to clear. */
          for (let i = 0; i < 600 && typeof RIDE !== 'undefined' && RIDE.on; i++) {
            troTick(16.67); wanderUpdate(16.67); }
          /* and if it is STILL running, say why in the words of the thing that stopped it — the dog
             this check deliberately stands on the rails is the likeliest answer and "did not travel"
             would send the next person to the wrong function entirely. */
          if (typeof RIDE !== 'undefined' && RIDE.on)
            problems.push('the trolley ride never finished — the car is in state "' + TRO.state +
              '" at x=' + TRO.x.toFixed(1) + ', so something alive is standing on the line and it is waiting for it');
          /* worldArrived() sets a 450 ms no-step window and a ride ends 3 s later than a teleport
             did, so the window now lands ON the checks that follow this one instead of expiring
             under them. That is a fact about this FILE's pacing, not about the game — a player has
             no trouble waiting half a second after getting off a tram — so the window is spent here
             rather than papered over downstream. It cost two intermittent reds on a traffic cone. */
          warpT = 0;
          if (world === 'st') problems.push('the trolley did not travel');
          else if (star.world === 'st') problems.push('the trolley left the dog standing at the stop — it does not arrive the way a door does');
        }
        document.getElementById('travel').hidden = true;
      }

      // 6. the whistle still reaches him wherever he is
      put('pk', 5, 5); star.follow = false;
      world = 'hq'; px = fx = 10; py = fy = 11;
      const found = nearestDog();
      if (found !== star) problems.push('the paw menu can no longer reach the dog in another world');

      star.world = keep.w; star.x = star.fx = keep.x; star.y = star.fy = keep.y;
      star.follow = keep.f; star.holdT = keep.h; star.stayT = keep.s;
      world = keep.pw; px = fx = keep.px; py = fy = keep.py;
      return problems;
    });
    fails.push(...dog);
  }

  // ---- 34. a cone is a thing you kick ----
  // Asked for on 2026-09-04: a cone should not make the player walk around it — the player can kick
  // it, the dog can even rip it, and it reappears once the player leaves the screen.
  {
    const prop = await page.evaluate(() => {
      const problems = [];
      if (typeof isLight !== 'function' || typeof kickProp !== 'function') return ['nothing can be kicked'];
      if (!isLight('C')) problems.push('the cone is not a light prop');
      if (SOLID.has('C')) problems.push('the cone still blocks you — you must still walk around it');
      if (!TILESIDE['C']) problems.push('the cone has no profile, so the front camera lays it back down on the road');
      // things that SHOULD still stop you
      ['#', 'B', 'Q', 'Z', 'W', 'V', 'J'].forEach(g => { if (isLight(g)) problems.push('"' + g + '" became kickable and should not have'); });

      const keep = { w: world, x: px, y: py };
      // FREEZE THE DOGS FIRST. dogWhim() can now rip a light prop, and the page's live loop keeps
      // running between the assertions below — so a dog could destroy the cone this section is
      // measuring and the failure would look like a broken reset. Park every dog off-world and
      // hold it; the rip is tested deliberately at the end, on purpose, with one dog put back.
      const dogState = CRIT.filter(isDog).map(c => ({ c: c, w: c.world, x: c.x, y: c.y, n: c.next, h: c.holdT }));
      dogState.forEach(d => { d.c.world = '__frozen'; d.c.next = performance.now() + 6e5; d.c.holdT = performance.now() + 6e5; });
      const w = WORLDS['st'];
      let cx = -1, cy = -1;
      for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) if (w.grid[y][x] === 'C') { cx = x; cy = y; }
      const thaw = () => dogState.forEach(d => { d.c.world = d.w; d.c.x = d.c.fx = d.x; d.c.y = d.c.fy = d.y; d.c.next = d.n; d.c.holdT = d.h; });
      if (cx < 0) { thaw(); problems.push('no cone on the street to kick'); return problems; }

      world = 'st';
      // 1. it moves when you kick it, and the tile you kicked from is clear
      const before = propEdits.length;
      px = fx = cx; py = fy = cy - 1;                        // stand north of it, kick south
      kickProp(cx, cy, 0, 1);
      const moved = w.grid[cy][cx] !== 'C';
      if (!moved) problems.push('kicking the cone did not move it');
      if (moved && w.grid[cy + 1] && w.grid[cy + 1][cx] !== 'C' &&
          !(w.grid[cy][cx + 1] === 'C' || w.grid[cy][cx - 1] === 'C'))
        problems.push('the cone left its tile and landed nowhere');

      // 2. leaving the room puts it back exactly
      propsReset();
      if (w.grid[cy][cx] !== 'C') problems.push('the cone did not reappear when the room reset');
      if (propEdits.length !== 0) problems.push('the prop edit log was not cleared, so it will grow forever');
      if (propEdits.length !== before) problems.push('reset left the log in a different state than it started');

      // 3. a kicked cone can never come to rest on a door, an NPC, or the player
      const bad = [];
      for (let i = 0; i < 200; i++) {
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]][i % 4];
        px = fx = cx - dirs[0]; py = fy = cy - dirs[1];
        kickProp(cx, cy, dirs[0], dirs[1]);
        for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) {
          if (w.grid[y][x] !== 'C') continue;
          if (PORTALS.st && PORTALS.st[w.rows[y][x]]) bad.push('a cone came to rest on a door');
          if (w.grid[y][x] === 'N') bad.push('a cone came to rest on a person');
          if (x === px && y === py) bad.push('a cone came to rest on the player');
        }
        propsReset();
      }
      if (bad.length) problems.push(bad[0] + ' (' + bad.length + ' times in 200 kicks)');

      // 3b. AND WALKING INTO IT ACTUALLY KICKS IT. Everything above calls kickProp() directly,
      // which proves the function works and NOT that a step ever reaches it. Drive the real path:
      // hold a direction and let tryStep() run, the way a player does.
      {
        propsReset();
        // the top camera so held-direction maps 1:1 to world direction, and clear the warp
        // cooldown a previous section left behind — tryStep refuses to move inside it
        const keepCam = camMode; camSet('top'); warpT = 0; portalHold = '';
        /* AND clear the fauna out of the three tiles the cone can skitter into. propFree() refuses a
           tile a critter is standing on, so a butterfly beside the cone makes this check red while
           saying "kickProp is never reached from tryStep" — which sends the next person into the
           movement code for a bug that is a butterfly. The page's game loop is LIVE for the whole
           suite, so the critters really do wander between checks; they wander more since they learned
           to keep off the tram's line, because that pushes them onto the rows either side of it and
           the cone sits on one. Parked and put straight back, inside this block. */
        /* Count the CALL, not the cone's new tile. The message below has always said "kickProp is
           never reached from tryStep" and the check underneath it read the grid instead — so any
           frame where all three tiles the cone can skitter into happened to be occupied (a butterfly,
           a wandering neighbour, a wall) printed a sentence about movement code for a bug that was a
           butterfly standing still. It cost six red runs to notice. kickProp is a function
           declaration, so it is a property of the global object and can be counted from here. */
        const realKick = kickProp; let reached = 0;
        window.kickProp = function () { reached++; return realKick.apply(null, arguments); };
        px = fx = cx; py = fy = cy - 1; world = 'st'; moving = false; dir = 'down';
        held = 'down';
        tryStep();
        if (px !== cx || py !== cy) problems.push('walking into the cone did not move the player onto its tile — it is still a wall in practice');
        window.kickProp = realKick;
        if (!reached) problems.push('walking into the cone did not kick it: kickProp is never reached from tryStep');
        held = null; moving = false; camSet(keepCam);
        propsReset();
      }

      // 4. the cone still exists in every camera — it stopped being solid, and the iso block pass
      //    only ever ran for solids, so this is exactly where it would silently disappear
      if (typeof standsUp !== 'function' || !standsUp('C'))
        problems.push('the cone is neither solid nor standing, so the iso and front cameras drop it');

      // 5. the dog can take one, and it comes back too
      const star = CRIT.find(c => c.role === 'star');
      if (!star) problems.push('there is no star dog to take a cone, so nothing here can say whether a dog can');
      if (star) {
        star.world = 'st'; star.x = cx; star.y = cy - 1; star.next = 0; star.holdT = 0;
        let ripped = false;
        for (let i = 0; i < 400 && !ripped; i++) { dogWhim(star, performance.now()); ripped = w.grid[cy][cx] !== 'C'; }
        if (!ripped) problems.push('the dog can never rip a cone even standing on top of one');
        propsReset();
        if (w.grid[cy][cx] !== 'C') problems.push('a ripped cone never comes back');
      }

      thaw();
      world = keep.w; px = fx = keep.x; py = fy = keep.y;
      return problems;
    });
    fails.push(...prop);
  }

  // ---- 35. the flowers that show the souls the way are walked THROUGH, not around ----
  // Owner, 2026-09-22: "ok can you try to lookinto making petals? that i can walk and interact
  // through as if they were mounds of items piled up"
  //
  // The park lays cempasuchil from a flower bed to the ofrenda, and the map's own comment says
  // why: "Marigolds are how the souls are shown the way — the flower IS the arrow … Walkable, so
  // it cannot cork the park (R11)." For a day it was a WALL, because one letter was doing two
  // jobs — a raised bed with a curb, which is solid, and loose petals on the ground, which are not.
  //
  // THIS SECTION READS NEITHER SOLIDX NOR ANY LETTER OF THIS PACK. The altar comes from what the
  // season declares; the bed is whatever in the altar's own row you cannot stand on; the path is
  // the ground between them. Then it WALKS it, on arrow keys, in the live game.
  {
    const setup = await page.evaluate(() => {
      const out = { problems: [] };
      const wid = PL.park, w = WORLDS[wid];
      if (!w) { out.problems.push('this pack declares no park, so there is nothing to walk'); return out; }
      // the altar, from what the pack's season sets down — never a coordinate typed here
      const ofr = (typeof SEASONS === 'object' && SEASONS ? Object.values(SEASONS) : [])
        .flatMap(s => ((s.art && s.art.props) || []))
        .find(p => p && p.kind === 'ofrenda' && p.world === wid);
      if (!ofr) { out.problems.push('no ofrenda is set down in the park, so the trail of petals is an arrow pointing at nothing — there is nothing here to measure, and that is a failure and not a pass'); return out; }
      // the bed the flowers were cut from: the nearest thing in the altar's own row, to its west,
      // that is a growing thing you CANNOT stand on. A raised bed has a curb; that is the whole
      // difference between it and the petals, and it is why they must not share a letter.
      let bx = -1;
      for (let x = ofr.x - 1; x >= 0; x--) {
        const g = w.grid[ofr.y][x];
        if (SOLID.has(g)) { if ((TILES[g] || {}).kind === 'nature') bx = x; break; }
      }
      if (bx < 0) { out.problems.push('nothing in the altar\'s row is a flower bed you cannot walk into — the raised bed has lost its curb, and a scatter of loose petals is not a bed'); return out; }
      const path = [];
      for (let x = bx + 1; x < ofr.x; x++) path.push(x);
      if (!path.length) { out.problems.push('there is no trail of petals to walk to the altar: the tile standing against it at ' + wid + '(' + bx + ',' + ofr.y + ') is "' + w.grid[ofr.y][bx] + '", a growing thing you CANNOT stand on, sitting exactly where marigolds laid on the ground should be. Either nobody laid a trail, or the trail and the raised bed are sharing one letter and the trail went solid with it — the flower IS the arrow, and an arrow you have to walk around is a wall (content/meridian/maps.js, the pk row 10 comment; R11)'); return out; }

      // what the path is MADE of, before anybody walks it
      path.forEach(x => {
        const g = w.grid[ofr.y][x];
        const at = wid + '(' + x + ',' + ofr.y + ')';
        if (SOLID.has(g)) { out.problems.push('the trail that shows the souls the way is a WALL at ' + at + ': the tile is "' + g + '" and you cannot stand on it. Marigolds laid on the ground are the arrow to the altar — you are supposed to walk through them, not around them (content/meridian/maps.js, the pk row 10 comment; R11)'); return; }
        if ((TILES[g] || {}).kind !== 'nature') out.problems.push('there are no flowers on the trail at ' + at + ': the tile is "' + g + '", which is not a growing thing — the path from the bed to the altar was cleared instead of being made walkable');
        if (!(typeof stands === 'function' && stands(g))) out.problems.push('the petals at ' + at + ' do not stand: they are painted into the floor, so they are a rug and not a mound of flowers piled up');
        if (!TILEDRAW[g]) out.problems.push('the petals at ' + at + ' have no art from above');
        if (!TILESIDE[g]) out.problems.push('the petals at ' + at + ' have no profile, so the front and iso cameras lay the heap flat on the grass');
        if (!(typeof TILEMESH !== 'undefined' && TILEMESH[g])) out.problems.push('the petals at ' + at + ' have no shape in 3D, so the one camera that could show a heap shows a picture of one');
      });

      // stand the hero one tile NORTH of the first petals, and clear everything that could
      // refuse a step for a reason that is not the trail
      const start = { x: path[0], y: ofr.y - 1 };
      if (SOLID.has(w.grid[start.y][start.x])) { out.problems.push('there is no way onto the trail from the north at ' + wid + '(' + start.x + ',' + start.y + ')'); return out; }
      out.wid = wid; out.ofr = { x: ofr.x, y: ofr.y }; out.bed = bx; out.path = path; out.start = start;
      out.before = (typeof PETALS !== 'undefined' ? PETALS.length : -1);
      world = wid; px = fx = start.x; py = fy = start.y; dir = 'down';
      moving = false; held = null; warpT = 0; portalHold = '';
      camSet('top');                                  // held direction maps 1:1 to the world
      window.__petalSeen = [];                        // every tile the hero actually stood on
      window.__petalTick = setInterval(() => { window.__petalSeen.push(px + ',' + py); }, 40);
      return out;
    });
    setup.walked = !setup.problems.length && !!setup.path;
    if (setup.walked) {
      // PRESS THE KEYS. One tap a tile: down onto the first petals, then east along the trail to
      // the altar. Nothing here calls tryStep() or petalDrop() — a person walks this.
      const tap = async k => { await page.keyboard.down(k); await page.waitForTimeout(110); await page.keyboard.up(k); await page.waitForTimeout(420); };
      await tap('ArrowDown');
      for (let i = 0; i < setup.path.length; i++) await tap('ArrowRight');
      // and the bed must still refuse him: turn round and walk back into it
      for (let i = 0; i < setup.path.length; i++) await tap('ArrowLeft');
      await tap('ArrowLeft');
    }
    const walk = await page.evaluate(s => {
      const problems = [];
      // Nobody walked, because the setup above already found what is wrong. Say nothing here —
      // a guard that prints "the petals stopped him" about a walk that never happened is telling
      // the next person to go and look at the movement code for a fault that is in the map.
      if (!s.walked) { clearInterval(window.__petalTick); return problems; }
      clearInterval(window.__petalTick);
      const seen = new Set(window.__petalSeen || []);
      s.path.forEach(x => { if (!seen.has(x + ',' + s.ofr.y)) problems.push('walking the trail never put the hero on ' + s.wid + '(' + x + ',' + s.ofr.y + '): the petals stopped him, so the path the souls are shown has to be walked around'); });
      if (!seen.has(s.ofr.x + ',' + s.ofr.y)) problems.push('walking east along the petals never reached the altar at ' + s.wid + '(' + s.ofr.x + ',' + s.ofr.y + ') — the trail does not go where it points');
      if (seen.has(s.bed + ',' + s.ofr.y)) problems.push('the hero walked INTO the flower bed at ' + s.wid + '(' + s.bed + ',' + s.ofr.y + '): a raised bed has a curb, and making the petals walkable must not take the bed\'s curb with it');
      // the interact: you walk through a heap of petals and some of it comes away on your shoes
      const after = (typeof PETALS !== 'undefined' ? PETALS.length : -1);
      const onPath = (typeof PETALS !== 'undefined' ? PETALS : []).filter(p => p.w === s.wid && p.y === s.ofr.y && s.path.indexOf(p.x) >= 0).length;
      if (after <= s.before || !onPath) problems.push('walking through the petals disturbed nothing: ' + (after - s.before) + ' petals came loose on the whole walk and ' + onPath + ' of them on the trail. A mound of loose flowers you can walk through and not touch is a painted rug');
      // put the park back the way the next section expects it
      px = fx = PL.parkIn[0]; py = fy = PL.parkIn[1]; moving = false; held = null;
      return problems;
    }, setup);
    fails.push(...setup.problems, ...walk);
  }

  // ---- R1: something stands under every animal, and an animal is only where its pack put it ----
  // Lorenzo floated in the town (#38): the parrot was pinned to a fence only Meridian has.
  // Ground animals need a walkable tile; the parrot needs a perch — a solid or lifted tile.
  {
    const r1 = await page.evaluate(() => {
      const problems = [];
      if (typeof ANIMALS !== 'undefined') problems.push('Meridian declares ANIMALS — its animals are the engine defaults by design');
      // #25 (owner, 2026-09-07: "update here and meridian and template so we have a good amount of
      // metadata that includes these"): Meridian DECLARES its rooms, one line per role with a note,
      // and the declaration must match the engine's default table key for key — it is documentation
      // of the seam, never a divergence from it. A role the engine knows and Meridian does not name
      // is metadata missing; a role Meridian names and the engine does not read is a lie.
      if (typeof PLACES === 'undefined') problems.push('Meridian declares no PLACES — its rooms must be written down, one role per line (#25)');
      else {
        Object.keys(PLDEF).forEach(k => { if (!(k in PLACES)) problems.push('Meridian\'s PLACES leaves out the role ' + k); });
        Object.keys(PLACES).forEach(k => { if (!(k in PLDEF)) problems.push('Meridian\'s PLACES names a role the engine never reads: ' + k); });
        if (JSON.stringify(PLACES) !== JSON.stringify(PLDEF)) problems.push('Meridian\'s PLACES drifted from the engine\'s defaults: ' + JSON.stringify(PLACES) + ' vs ' + JSON.stringify(PLDEF));
      }
      if (typeof FLOORS !== 'undefined') problems.push('Meridian declares FLOORS — its pavements are the engine defaults by design');
      // mq-v77: the reader's look is the pack's choice; Meridian declares none and keeps the cream paper
      if (typeof READERLOOK !== 'undefined') problems.push('Meridian declares READERLOOK — its paper is cream by design');
      if (document.getElementById('paperSheet').className !== 'paper') problems.push("Meridian's paper wears a look it did not ask for: " + document.getElementById('paperSheet').className);
      if (JSON.stringify(PL) !== JSON.stringify(PLDEF)) problems.push('PL drifted from PLDEF — Meridian\'s declared rooms are the defaults by design');
      if (PL.home !== 'hq' || PL.spawn.join() !== '10,11' || PL.street !== 'st' || PL.park !== 'pk' || PL.upstairs !== 'f2') problems.push('the default roles are not Meridian\'s rooms: ' + JSON.stringify(PL));
      if (world !== PL.home && !WORLDS[world]) problems.push('the current world is not a world');
      // mq-v75 (#4): the engine owns the flight that runs east — five glyphs, drawable. mq-v81: Meridian lays
      // them, in HQ's stair hall and the loft's well and nowhere else (the owner walked them in the town first)
      ['⊓', '≡', '▲', '▼', '◺'].forEach(g => { if (!TILES[g] || !TILEDRAW[g]) problems.push('the engine lacks the stair glyph ' + g);
        const c = document.createElement('canvas'); c.width = 32; c.height = 32; const o = ctx; ctx = c.getContext('2d');
        try { TILEDRAW[g]({ sx: 0, sy: 0, x: 12, y: 13, canopy: () => {} }); if (TILESIDE[g]) TILESIDE[g]({ sx: 0, sy: 0, x: 12, y: 13, canopy: () => {} }); } catch (e) { problems.push('stair glyph ' + g + ' throws: ' + e.message); } finally { ctx = o; }
        const laid = Object.keys(WORLDS).filter(id => WORLDS[id].rows.join('').includes(g)).sort().join(',');
        const wantIn = { '⊓': 'hq', '≡': 'f2,hq,no', '▲': 'hq', '▼': 'f2,no', '◺': 'f2,no' }[g]; /* #7: Nolasco's stair room */
        if (laid !== wantIn) problems.push('the stair glyph ' + g + ' is laid in [' + laid + '], expected [' + wantIn + ']'); });
      if (!SOLID.has('⊓') || !SOLID.has('◺') || SOLID.has('≡') || SOLID.has('▲') || SOLID.has('▼')) problems.push('the stair glyphs have the wrong solidity');
      // mq-v70: `roams` lets a document-carrier walk (the town's crier). No Meridian station says
      // it, so every person with a document stays where the map put them, as before.
      Object.entries(WORLDS).forEach(([id, w]) => w.npcs.forEach(n => { if (n.roams) problems.push(`Meridian station ${n.npc} in ${id} roams — the seam is the town's, not Meridian's`);
        if (n.doc && wanders(n)) problems.push(`Meridian's ${n.npc} carries a document and wanders — a person you look for must be where you left them`); }));
      const want = { dog: ['hq', 12, 5], cat: ['lc', 16, 9], pig: ['st', 4, 1], loro: ['st', 17, 5] };
      Object.entries(want).forEach(([k, [wid, x, y]]) => {
        const a = ANI(k); if (!a || a.world !== wid || a.x !== x || a.y !== y) problems.push(`animal ${k} default moved: ${JSON.stringify(a)}`);
        if (AW(k) !== wid) problems.push(`animal ${k} is not in ${wid}`);
        const w = WORLDS[wid], g = w.grid[y] && w.grid[y][x];
        if (g === undefined) problems.push(`animal ${k} is off the map`);
        else if (k === 'loro') { if (!SOLID.has(g) && !((TILES[g] || {}).lift > 0)) problems.push(`the parrot has nothing under him at ${wid} (${x},${y}): "${g}"`); }
        else if (SOLID.has(g)) problems.push(`animal ${k} stands in a wall at ${wid} (${x},${y}): "${g}"`);
      });
      return problems;
    });
    fails.push(...r1);
  }
  // ---- R5: every document a quest hands over exists, builds, and names a real template ----
  {
    const r5 = await page.evaluate(() => {
      const problems = [], ids = new Set();
      [QEN, QES].forEach(Q => Q.forEach(q => Object.values(q.nodes || {}).forEach(n => { if (n.doc) ids.add(n.doc); })));
      const en = new Set(), es = new Set();
      QEN.forEach(q => Object.values(q.nodes || {}).forEach(n => { if (n.doc) en.add(n.doc); }));
      QES.forEach(q => Object.values(q.nodes || {}).forEach(n => { if (n.doc) es.add(n.doc); }));
      if ([...en].sort().join() !== [...es].sort().join()) problems.push('EN and ES hand over different documents');
      const tmpls = [];
      ids.forEach(id => { const d = DOCS[id]; if (!d) { problems.push(`quest hands over "${id}" and DOCS has no such document`); return; }
        const secs = docSections(id); if (!Array.isArray(secs) || !secs.length) problems.push(`document "${id}" does not build`);
        if (d.tmpl) tmpls.push([id, d.tmpl]); });
      return { problems, tmpls };
    });
    fails.push(...r5.problems);
    // the neutral set is the source; the branded set is generated from it (build-branded.js --check holds that)
    const tdir = path.join(__dirname, '..', 'docs', 'templates', 'neutral');
    /* The templates are the owner's and stay private; the PUBLIC copy carries their names only
       (docs/templates/NAMES.md, from public-overlay/). Owner, 2026-09-27: "dont publish their url but
       would their names really be a risk? i dont thnk so". Where the templates are here, the published
       list must name exactly them, so the two cannot drift; where neither is here, that is a red. */
    const namesOf = p => fs.existsSync(p) ? [...fs.readFileSync(p, 'utf8').matchAll(/^- `([^`]+)`$/gm)].map(m => m[1]) : null;
    const listed = namesOf(path.join(__dirname, '..', 'docs', 'templates', 'NAMES.md'));
    const published = namesOf(path.join(__dirname, '..', 'public-overlay', 'docs', 'templates', 'NAMES.md'));
    const files = fs.existsSync(tdir) ? fs.readdirSync(tdir).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')) : (listed || []);
    if (!files.length) fails.push('no deliverable template to check the documents against: neither docs/templates/neutral/ nor docs/templates/NAMES.md is here');
    if (fs.existsSync(tdir) && published && published.slice().sort().join() !== files.slice().sort().join())
      fails.push('public-overlay/docs/templates/NAMES.md no longer names exactly the templates in docs/templates/neutral/ — the public copy would check its documents against a stale list');
    r5.tmpls.forEach(([id, t]) => { if (!files.some(f => f.startsWith(String(t)))) fails.push(`document "${id}" names template ${t} and there is no ${t}-* template (docs/templates/neutral/, or its names in docs/templates/NAMES.md)`); });
  }

  // ---- the public build's guarantee (docs/story/el-changarrito.md §5 R7) ----
  // Meridian's public build must not know about any personal build: no API host, no
  // token, no URL-driven behaviour, a pinned CSP, every storage key through SK(), pack
  // text never interpolated into innerHTML, and a service worker that serves only its
  // own shell. Each line here was red once, or would have been the day it mattered.
  {
    const { execSync } = require('child_process');
    const root = path.resolve(__dirname, '..');
    let tracked = [];
    try { tracked = execSync('git ls-files', { cwd: root }).toString().split('\n').filter(Boolean); }
    catch (e) { fails.push('guarantee: git ls-files unavailable — the guard needs the tracked list, not the working tree'); }
    // R8: the shell is whatever the PUBLIC index loads — derived from its script tags, so a
    // second pack added to index.html is scanned the day it is added, not the day it leaks
    const pubIndex = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const loaded = [...pubIndex.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
    const loadedDirs = [...new Set(loaded.map(p => p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : ''))].filter(Boolean);
    const shell = tracked.filter(f => ['index.html', 'sw.js', 'qr.js', 'manifest.webmanifest'].includes(f)
                                   || loaded.includes(f) || loadedDirs.some(d => f.startsWith(d))
                                   || f.startsWith('engine/') || f.startsWith('content/'));
    if (!loaded.some(p => p.startsWith('engine/'))) fails.push('guarantee: the public index does not load engine/ — the script scan found nothing');
    for (const f of shell) {
      const src = fs.readFileSync(path.join(root, f), 'utf8');
      ['api.github.com', 'net.local', 'github_pat', 'Authorization'].forEach(w => {
        if (src.includes(w)) fails.push(`guarantee: ${f} mentions "${w}" — the public build must not`);
      });
    }
    for (const f of tracked.filter(f => f.startsWith('engine/'))) {
      const src = fs.readFileSync(path.join(root, f), 'utf8');
      // the one allowed mention: stripPassHash() writes the URL back with its query intact,
      // it reads nothing. Anything else that touches the query is URL-driven behaviour.
      const q = src.replace(/location\.pathname\+location\.search/g, '');
      if (/location\.search|URLSearchParams/.test(q))
        fails.push(`guarantee: ${f} reads the URL query — no URL-driven behaviour in the public build`);
      const lit = src.match(/localStorage\.(get|set|remove)Item\(\s*["']/g);
      if (lit) fails.push(`guarantee: ${f} has ${lit.length} literal storage key(s) — every key goes through SK()`);
      src.split('\n').forEach((line, i) => {
        if (/innerHTML\s*=/.test(line) && /\$\{/.test(line))
          fails.push(`guarantee: ${f}:${i + 1} interpolates into innerHTML — pack text is data, use textContent`);
      });
    }
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    /* WHERE THE BROWSER READS IT, not wherever the text is (#256, Zeni's review). A browser obeys a policy <meta> only
       inside <head>, and never one inside an HTML comment; this used to take the first match anywhere in the file, so a
       meta commented out, or moved into <body>, still read as the policy while the browser enforced nothing. Measured in
       Chromium 2026-10-01: commented out, a <style> block and a style attribute both applied and nothing reached the
       console; in <body>, both applied. */
    const live = html.replace(/<!--[\s\S]*?-->/g, ''), headEnd = live.search(/<\/head\s*>|<body[\s>]/i);
    const csp = ((headEnd < 0 ? '' : live.slice(0, headEnd)).match(/http-equiv="Content-Security-Policy" content="([^"]*)"/) || [])[1];
    // #256 (2026-10-01): style-src is 'self' too, so every door on the list is shut. Styles come from files only.
    const PINNED = "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; connect-src 'none'; base-uri 'self'; form-action 'none'; object-src 'none'";
    if (!csp) fails.push('guarantee: index.html has no Content-Security-Policy in its <head> outside a comment, the only place a browser obeys one — the page runs with no policy at all');
    else if (csp !== PINNED) fails.push('guarantee: index.html CSP differs from the pinned literal — widen it in a personal build only' + (/style-src[^;]*'unsafe-inline'/.test(csp || '') ? ' (it lets the page use styling written inside it again, the door #256 shut: if outside text ever reached the page, that door would let it repaint or deface the game)' : ''));
    // #254 (2026-09-27): the page runs only script FILES. Under script-src 'self' a script written inside
    // the page is blocked without a sound, so one here is dead code or the first step to reopening that door.
    const inlineJs = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g)].length
                   + [...html.matchAll(/<[a-z][^>]*\son[a-z]+\s*=/gi)].length;
    if (inlineJs) fails.push(`guarantee: index.html carries ${inlineJs} script(s) written inside the page (a <script> block or an on…= handler) — the page runs only script files (#254); move it into one`);
    // #256: and styles the same way. Under style-src 'self' the browser refuses a <style> block or a style="…"
    // attribute without a sound and the element just loses that look, so one here is a silent visual break
    // or the first step to reopening the door. Counted, so the sentence says how much of the page went.
    // read with the page's comments taken out (`live`, above): a comment that SAYS "<style>" is prose, not a block
    const inlineCss = [...live.matchAll(/<style[\s>]/gi)].length, inlineAttr = [...live.matchAll(/<[a-z][^>]*\sstyle\s*=/gi)].length;
    if (inlineCss + inlineAttr) fails.push(`guarantee: index.html carries ${inlineCss} <style> block(s) and ${inlineAttr} style="…" attribute(s) written inside the page — the policy refuses every one and a player sees the page without them (#256); the page's styles live in shell.css`);
    const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    if (!/res\.ok/.test(sw)) fails.push('guarantee: sw.js caches responses without checking res.ok');
    if (!/self\.location\.origin/.test(sw)) fails.push('guarantee: sw.js does not restrict itself to its own origin');
    if (!/startsWith\(PFX\)/.test(sw)) fails.push('guarantee: sw.js activate would delete caches it does not own');
    // no URL can turn admin mode on: load with every flag a reader might guess, expect nothing
    await page.evaluate(() => { try { localStorage.removeItem('mqadmin'); } catch (e) {} });
    await page.goto(index + '?dev=1&admin=1#admin=1');
    await page.waitForTimeout(800);
    const adm = await page.evaluate(() => ({ admin: typeof admin === 'undefined' ? null : admin,
                                              brushes: document.getElementById('brushes').hidden }));
    if (adm.admin !== false || adm.brushes !== true)
      fails.push(`guarantee: a URL flag changed admin mode (admin=${adm.admin}, brushes hidden=${adm.brushes})`);
  }

  /* ---- everything alive that can reach the rails is something the tram can SEE ----
     docs/OWNER.md, settled by the owner 2026-09-11: "a realistic trolley, in my boook does stop for
     traffic- pedestrian, vehicle or even fauna", and the sentence under it — "braking for the
     hummingbird and running over the pigeon is not a policy, it is a blind spot."
     Meridian did that, by species, by name, literally. Chava filmed Paloma being drawn INSIDE the
     tram's third window, twice inside sixty seconds of standing at the stop, on the same rails where
     the same tram stopped dead for him and waited fifty seconds.
     TWO WRONG VERSIONS OF THIS CHECK WERE WRITTEN FIRST AND BOTH ARE WORTH THE COMMENT.
     The first asked whether ANY critter was in that world and went green — because the colibri is on
     the same street, so the guard written to catch "it brakes for the hummingbird and runs over the
     pigeon" passed for precisely the reason that sentence names. The second asked whether the animal
     was a member of CRIT, which is an implementation detail: the fix does not add it to CRIT, so a
     correct engine would have stayed red.
     This one puts each animal on the rails in front of a running tram and asks whether the tram
     stops. That is the noun. It survives any rewrite of how the engine keeps its list. */
  const blind = await page.evaluate(() => {
    const P = [];
    const lines = (typeof TROLLEYAT !== 'undefined' && TROLLEYAT) ? TROLLEYAT : [];
    if (!lines.length) return P;
    const beasts = [['dog', typeof DOG !== 'undefined' ? DOG : null],
                    ['cat', typeof CAT !== 'undefined' ? CAT : null],
                    ['pigeon', typeof PIG !== 'undefined' ? PIG : null]];
    const key = { dog: 'dog', cat: 'cat', pigeon: 'pig' };
    lines.forEach(L => {
      const keep = { st: TRO.state, x: TRO.x, dir: TRO.dir, w: world, px: px, py: py };
      beasts.forEach(([name, a]) => {
        if (!a || AW(key[name]) !== L.world) return;       /* not on a trolley street at all */
        const w = WORLDS[L.world];
        const mid = Math.round((L.from + L.to) / 2);
        const g = w.grid[L.row] && w.grid[L.row][mid];
        if (g === undefined || SOLID.has(g) || g === 'N') return;   /* it could not stand there anyway */
        /* park the hero far away so HE is not what stops it, put the animal on the rails,
           and roll the tram up to it */
        world = L.world; px = fx = 0; py = fy = 0;
        const was = { x: a.x, y: a.y, fx: a.fx, fy: a.fy, lift: a.lift };
        a.x = a.fx = mid; a.y = a.fy = L.row; a.lift = null;
        TRO.dir = L.to >= L.from ? 1 : -1;
        TRO.x = mid - TRO.dir * 3.0; TRO.state = 'run'; TRO.t = 0;
        let held = false;
        for (let i = 0; i < 40 && !held; i++) { troUpdate(50); if (TRO.state === 'hold') held = true; }
        if (!held) P.push('the trolley does not stop for the ' + name + ' on its own line in ' +
          L.world + ' — it drives straight through, while it brakes for a hummingbird on the same street');
        a.x = was.x; a.y = was.y; a.fx = was.fx; a.fy = was.fy; a.lift = was.lift;
      });
      TRO.state = keep.st; TRO.x = keep.x; TRO.dir = keep.dir;
      world = keep.w; px = fx = keep.px; py = fy = keep.py;
    });
    return P;
  });
  fails.push(...blind);

  /* ---- a bird already in the air is not something to brake for ----
     The lift exists so the tram does NOT have to stop for her. Lupe measured that it stopped doing
     that the moment TRO_SPEED moved: at 3.4 the tram never braked for her at all; at 6.0 it braked
     83 ms BEFORE she was clear of the rail, so every fourth tram made a 1.4 s unexplained stop in
     the street for a bird that was already flying away.
     The cause is worth the comment because it is E10's whole shape: the lift's lead was written as
     a fraction of the speed — `TRO_SPEED*0.9` — precisely so it would survive a speed change, and
     the comment above it SAID so. But she stays logically on the rails for the whole 560 ms flight,
     so the lead has to clear the brake window PLUS the flight, and 0.9v > 2.6 + 0.56v only holds
     above v=7.65. A constant expressed as a fraction of another constant is not automatically safe
     when that constant moves, and a comment promising an invariant is a claim about arithmetic
     nobody did.
     This measures the thing itself: from the frame she leaves the rail row to the frame the tram
     first holds. It must be positive at whatever speed the pack is running. */
  const birdLead = await page.evaluate(() => {
    const P = [];
    const L = (typeof troLine === 'function') ? troLine(typeof AW === 'function' ? AW('pig') : null) : null;
    if (!L || typeof PIG === 'undefined') return P;
    const keep = { w: world, px: px, py: py, x: PIG.x, y: PIG.y, st: TRO.state, tx: TRO.x };
    world = L.world; px = fx = 0; py = fy = 0;            /* the hero must not be what stops it */
    const mid = Math.round((L.from + L.to) / 2);
    PIG.x = PIG.fx = mid; PIG.y = PIG.fy = L.row; PIG.lift = null; PIG.hop = 0;
    PIG.moving = false; PIG.next = 1e9;
    TRO.dir = L.to >= L.from ? 1 : -1;
    TRO.x = mid - TRO.dir * 12; TRO.state = 'run'; TRO.t = 0;
    let clearAt = null, brakeAt = null;
    for (let i = 0; i < 220; i++) { const t = i * 16.67;
      troUpdate(16.67); pigUpdate(16.67, performance.now() + t);
      if (clearAt === null && Math.round(PIG.y) !== L.row) clearAt = t;
      if (brakeAt === null && TRO.state === 'hold') brakeAt = t; }
    if (clearAt === null) P.push('the pigeon never gets off the trolley line at all — she is standing on the rails when the tram arrives and the lift never fires');
    else if (brakeAt !== null && brakeAt < clearAt)
      P.push('the tram brakes ' + Math.round(clearAt - brakeAt) + ' ms before the pigeon is clear of the rail — ' +
             'she is already in the air and it stops for her anyway, so every pass makes an unexplained stop in the middle of the street');
    world = keep.w; px = fx = keep.px; py = fy = keep.py;
    PIG.x = PIG.fx = keep.x; PIG.y = PIG.fy = keep.y; PIG.lift = null; PIG.hop = 0;
    TRO.state = keep.st; TRO.x = keep.tx;
    return P;
  });
  fails.push(...birdLead);

  /* ---- and it sees what is UNDER it, not only what is in front of the nose ----
     troAhead's window was d ∈ [-0.6, 2.6] measured from the nose, and the car is TRO_LEN=2 long —
     so the 1.4 tiles between its own door and its own tail were invisible to it. That is 30% of the
     span where anything can interact with the tram at all, and it is where you end up if you step
     onto the rails just after the front of it goes past you.
     Chava filmed both halves in one ten-minute trace: Paloma waited out the whole approach on the
     kerb, correctly, then stepped onto the rails at d = -0.70 — a TENTH OF A TILE past the edge —
     and six consecutive samples show her drawn inside the tram's body with the tram in state `run`.
     Then he did it to himself on purpose at d = -1.13 and stood chest-deep in a moving tram for
     230 ms. Both the brake and the bird's lift start at the same -0.6, so a thing that steps on
     beside the door misses both.
     It is a ratio of distances, so it was identical at 3.4 and at 6.0 — the speed did not cause it.
     What the speed changed is that the band now sweeps past in 233 ms instead of 412, so you fall
     into it half as often and it reads more like a glitch than a collision when you do. */
  const under = await page.evaluate(() => {
    const P = [];
    const L = (typeof troLine === 'function' && typeof TROLLEYAT !== 'undefined' && TROLLEYAT[0])
      ? troLine(TROLLEYAT[0].world) : null;
    if (!L) return P;
    const keep = { w: world, px: px, py: py, st: TRO.state, x: TRO.x, d: TRO.dir };
    world = L.world; TRO.dir = L.to >= L.from ? 1 : -1; TRO.state = 'run';
    const mid = Math.round((L.from + L.to) / 2);
    py = fy = L.row; px = fx = mid;                       /* the hero, standing on the rails */
    /* put him dead in the middle of the car: want d = -1, and d = (px-nose)*dir, so nose = px+dir */
    const span = (typeof troSpan === 'function') ? troSpan(L) : TRO_LEN;   /* a train is longer than a car, and the body he is standing under is all of it */
    TRO.x = (px + TRO.dir) - (TRO.dir > 0 ? span : 0);
    const nose = TRO.x + (TRO.dir > 0 ? span : 0), d = (px - nose) * TRO.dir;
    if (d < -span || d > 0) P.push('this check did not manage to stand the hero under the tram (d=' + d.toFixed(2) + ') — it proves nothing');
    else if (!troAhead(L))
      P.push('a person standing on the rails INSIDE the tram is invisible to it — it is ' + Math.abs(d).toFixed(2) +
             ' tiles behind the nose, under the car, and the tram rolls straight through without slowing');
    world = keep.w; px = fx = keep.px; py = fy = keep.py; TRO.state = keep.st; TRO.x = keep.x; TRO.dir = keep.d;
    return P;
  });
  fails.push(...under);

  /* ---- the small things keep off the rails, and the tram does not have to stop for them ----
     The owner, 2026-09-11: "i mean she should be small enough and smart enough to stay away from the
     tram please." "She" is the colibri. CRITTERS declares her at st(16,4) and the engine lets a
     critter wander four tiles of Manhattan around home, which reaches row 2 — the rails. She hovers
     rather than walks, so she can stand on the line indefinitely, and she did: three of six trams in
     four minutes stopped dead for a hummingbird.
     THE NOUN IS NOT "does the tram avoid her". That is the blind spot this branch already closed
     once, by species, and the brake must keep catching a critter that is genuinely cornered. The
     noun is "does the tram HAVE TO STOP for her" — she must be off the rail row before the brake
     window ever reaches her, by her own doing.
     Every critter is given `next = 1e9` so its ordinary wander cannot fire. Nothing but the rule can
     move it, so a random walk that happened to clear the line in time cannot be mistaken for one. */
  const shy = await page.evaluate(() => {
    const P = [];
    const lines = (typeof TROLLEYAT !== 'undefined' && TROLLEYAT) ? TROLLEYAT : [];
    if (!lines.length || typeof CRIT === 'undefined' || typeof critUpdate !== 'function') return P;
    lines.forEach(L => {
      const w = WORLDS[L.world]; if (!w) return;
      const mid = Math.round((L.from + L.to) / 2);
      const g = w.grid[L.row] && w.grid[L.row][mid];
      if (g === undefined || SOLID.has(g) || g === 'N') return;   /* nothing could stand there anyway */
      CRIT.filter(c => c.world === L.world).forEach(cr => {
        const keep = { w: world, px: px, py: py, x: cr.x, y: cr.y, fx: cr.fx, fy: cr.fy,
                       mv: cr.moving, mt: cr.mt, nx: cr.next, sit: cr.sit, tk: cr.task,
                       st: TRO.state, tx: TRO.x, dir: TRO.dir, t: TRO.t };
        world = L.world;
        /* the hero: off the rails, and far from the stop, so he is not the reason for anything */
        px = fx = mid; py = fy = Math.min(w.H - 1, L.row + 4);
        cr.x = cr.fx = mid; cr.y = cr.fy = L.row; cr.moving = false; cr.mt = 0;
        cr.sit = false; cr.task = null; cr.next = 1e9;   /* its turn never comes: only the rule can move it */
        TRO.dir = L.to >= L.from ? 1 : -1;
        TRO.x = mid - TRO.dir * 10; TRO.state = 'run'; TRO.t = 0;
        TRO.dwelt = 0; TRO.dwellAt = null;
        let clearAt = null, brakeAt = null;
        for (let i = 0; i < 200; i++) { const t = i * 16.67;
          troUpdate(16.67); critUpdate(16.67, 1e6 + t);
          if (clearAt === null && Math.round(cr.y) !== L.row) clearAt = t;
          if (brakeAt === null && TRO.state === 'hold') brakeAt = t; }
        const who = cr.name || ('the ' + cr.kind);
        if (clearAt === null)
          P.push(who + ' never leaves the trolley line in ' + L.world + ' — standing on the rails while the ' +
                 'tram comes, waiting for the tram to stop instead of getting out of the way');
        else if (brakeAt !== null && brakeAt <= clearAt)
          P.push('the tram has to brake for ' + who + ' in ' + L.world + ', ' + Math.round(clearAt - brakeAt) +
                 ' ms before the line is clear — that is the tram staying away from the critter, not the critter staying away from the tram');
        world = keep.w; px = fx = keep.px; py = fy = keep.py;
        cr.x = keep.x; cr.y = keep.y; cr.fx = keep.fx; cr.fy = keep.fy;
        cr.moving = keep.mv; cr.mt = keep.mt; cr.next = keep.nx; cr.sit = keep.sit; cr.task = keep.tk;
        TRO.state = keep.st; TRO.x = keep.tx; TRO.dir = keep.dir; TRO.t = keep.t;
      });
    });
    return P;
  });
  fails.push(...shy);

  /* ---- ...and the two radii cannot be put in the wrong order ----
     The one line of arithmetic the rule above rests on, asserted instead of promised. The critter's
     awareness must reach FURTHER than the tram's brake, or the brake fires first, the car stops
     before it is ever frightening, the critter never becomes endangered, and both of them stand in
     the street for ever. That deadlock is not hypothetical: it is exactly what the pigeon's lift
     threshold did on 2026-09-11 (the lift fired at 3.2, the brake at 2.6, the tram entered the
     window first and the lift's own "the tram must be running" test then refused to fire — a tram
     stopped in the street for good), and it was found by rendering a mock, not by reading the code.
     Two constants, one comparison, and the thing this file exists to prevent. */
  const radii = await page.evaluate(() => {
    const P = [];
    if (typeof TRO_SHY === 'undefined' || typeof TRO_LOOK === 'undefined') return P;
    if (!(TRO_SHY > TRO_LOOK)) P.push('the tram brakes at ' + TRO_LOOK + ' tiles and a critter only ' +
      'notices it at ' + TRO_SHY + ' — the tram stops before it is frightening, so nothing ever moves ' +
      'out of its way and the car and the critter stand in the street looking at each other for ever');
    return P;
  });
  fails.push(...radii);

  /* ---- ...and a critter that IS cornered still stops it ----
     The half of the rule above that is easy to lose. "She gets out of the way" must never become
     "she is ignored": the fauna guard higher up in this file is the record of what that costs, and
     it was written by this repository about this tram. A critter walled in on both sides of the line
     cannot leave it, and the tram brakes, exactly as the owner ruled in the first place. */
  const cornered = await page.evaluate(() => {
    const P = [];
    const lines = (typeof TROLLEYAT !== 'undefined' && TROLLEYAT) ? TROLLEYAT : [];
    if (!lines.length || typeof CRIT === 'undefined') return P;
    const L = lines[0], w = WORLDS[L.world]; if (!w) return P;
    const cr = CRIT.filter(c => c.world === L.world)[0]; if (!cr) return P;
    const mid = Math.round((L.from + L.to) / 2);
    const keep = { w: world, px: px, py: py, x: cr.x, y: cr.y, mv: cr.moving, nx: cr.next,
                   st: TRO.state, tx: TRO.x, dir: TRO.dir,
                   up: w.grid[L.row - 1], dn: w.grid[L.row + 1],
                   upv: w.grid[L.row - 1] && w.grid[L.row - 1][mid],
                   dnv: w.grid[L.row + 1] && w.grid[L.row + 1][mid] };
    /* wall the two tiles beside it — a real violation, put back before we leave */
    const solidGlyph = [...SOLID].find(g => g && g.length === 1) || '#';
    const wall = (row) => { if (!w.grid[row]) return;
      if (typeof w.grid[row] === 'string') { const g = w.grid[row].split(''); g[mid] = solidGlyph; w.grid[row] = g.join(''); }
      else w.grid[row][mid] = solidGlyph; };
    wall(L.row - 1); wall(L.row + 1);
    world = L.world; px = fx = mid; py = fy = Math.min(w.H - 1, L.row + 4);
    cr.x = cr.fx = mid; cr.y = cr.fy = L.row; cr.moving = false; cr.next = 1e9;
    TRO.dir = L.to >= L.from ? 1 : -1;
    TRO.x = mid - TRO.dir * 6; TRO.state = 'run'; TRO.t = 0; TRO.dwelt = 0; TRO.dwellAt = null;
    let held = false;
    for (let i = 0; i < 120 && !held; i++) { troUpdate(16.67); if (typeof critUpdate === 'function') critUpdate(16.67, 1e6 + i * 16.67);
      if (TRO.state === 'hold' && Math.round(cr.y) === L.row) held = true; }
    if (!held) P.push((cr.name || ('a ' + cr.kind)) + ', walled in on the trolley line in ' + L.world +
      ', cannot get off it and the tram drives straight through — getting out of the way has quietly become being ignored');
    if (w.grid[L.row - 1]) { if (typeof w.grid[L.row - 1] === 'string') w.grid[L.row - 1] = keep.up; else w.grid[L.row - 1][mid] = keep.upv; }
    if (w.grid[L.row + 1]) { if (typeof w.grid[L.row + 1] === 'string') w.grid[L.row + 1] = keep.dn; else w.grid[L.row + 1][mid] = keep.dnv; }
    world = keep.w; px = fx = keep.px; py = fy = keep.py;
    cr.x = cr.fx = keep.x; cr.y = cr.fy = keep.y; cr.moving = keep.mv; cr.next = keep.nx;
    TRO.state = keep.st; TRO.x = keep.tx; TRO.dir = keep.dir;
    return P;
  });
  fails.push(...cornered);

  /* ---- it waits at the stop for somebody walking up to it, and the waiting ends ----
     The owner, 2026-09-11: "why wouldnt they stop for me? if im walking close to the tram, it should
     wait if it is already at the tram stop, if i missed it then its ok, itll take me a second and
     then i should be at the stop anyhow and wont mind a second to arrive."
     Until now `stops` was read by exactly two things — the boot audit and the summon check — so the
     car passed its own platform at full speed with a passenger standing on it, and the summon made
     that WORSE rather than better: standing at the stop called a tram every 8.5 seconds and not one
     of them stopped. Chava's verdict at the new speed was "worse", in one word.
     Three things are measured, and the third is the one that keeps it a tram instead of a lift:
     it waits; it stops waiting; and it does not wait for an empty platform. The brake is checked to
     be OFF throughout, because "the tram stopped" is also true of a person standing on the rails and
     that is a different rule with a different reason. */
  const dwell = await page.evaluate(() => {
    const P = [];
    const lines = (typeof TROLLEYAT !== 'undefined' && TROLLEYAT) ? TROLLEYAT : [];
    if (!lines.length || typeof troStops !== 'function') return P;
    lines.forEach(L => {
      const s = troStops(L)[0], w = WORLDS[L.world]; if (!s || !w) return;
      const keep = { w: world, px: px, py: py, st: TRO.state, x: TRO.x, d: TRO.dir, t: TRO.t, c: TRO.called };
      const ride = (atStop) => {
        world = L.world;
        if (atStop) { px = fx = s.x; py = fy = s.y; }
        else { px = fx = L.to; py = fy = Math.min(w.H - 1, L.row + 5); }
        TRO.dir = L.to >= L.from ? 1 : -1;
        TRO.state = 'run'; TRO.t = 0; TRO.called = false; TRO.dwelt = 0; TRO.dwellAt = null;
        TRO.x = s.x - TRO.dir * 3;
        let still = 0, served = 0, standX = null;
        for (let i = 0; i < 200; i++) {
          /* the engine's own window, not a copy of it. This line used to spell the serving test out
             by hand — `s.x >= TRO.x-0.5 && s.x <= TRO.x+TRO_LEN+0.5` — which is two copies of one
             number, and the day troServing changed (crew 14: a train berths its LEADING car, not
             whichever of three is level with the sign) the check would have kept measuring the old
             one and passed. Ask the function the game asks. */
          const x0 = TRO.x, at = !!troServing(L);
          troUpdate(50);
          if (at && TRO.state !== 'away') { served += 50;
            /* standing still AND with nothing on the rails in front of it. The first draft counted
               every still frame and then asked separately whether the brake had ever fired — which
               made this check intermittently blame the hero for a dog that had wandered onto the
               line thirty tiles away. The brake and the platform both stop the car; only one of them
               is what this check is about, so the condition has to carry both halves. */
            if (TRO.x === x0 && !(typeof troAhead === 'function' && troAhead(L))) { still += 50; if (standX === null) standX = TRO.x; } }
        }
        return { still: still, served: served, onRails: Math.round(py) === L.row, standX: standX };
      };
      const mine = ride(true);
      if (!mine.served) P.push('this check never got the tram as far as its own stop in ' + L.world + ' — it proves nothing');
      else if (mine.onRails) P.push('the stop this line declares in ' + L.world + ' is ON the rails, so standing at it puts the hero in front of the tram and this check is reading the brake — it proves nothing');
      else if (mine.still < 800) P.push('the trolley runs straight past its own stop in ' + L.world +
        ' with somebody standing on it: you call it, it comes, and it does not stop for you');
      else if (mine.still > 7000) P.push('the trolley stands at the stop in ' + L.world + ' for ' + mine.still +
        ' ms and shows no sign of leaving — one person on a platform can park the line for ever');
      /* ...and it stops where you can SEE it. The three lines above read TRO.state, and the state said
         "dwell" while the car stood at x=-2 on Calle Principal: its whole body past the west end of the
         street, where the top and front cameras cannot pan and the 3D camera hangs it in the dark. A car
         is born TRO_LEN off the end of its run so it can drive in; the stop at the line's first tile was
         inside the serving window before the car had entered the street, so it served the platform from
         the void, ran its dwell out there, and then ran past the person it had stopped for. "It waits"
         was true and the person waiting saw nothing — a state is a proxy for a picture (docs/REGRESSION.md).
         Ridden and photographed by the line inspector, crew iteration 12. Read the noun: with the hero at
         the stop, the flat cameras' own framing must hold some of the standing car. */
      if (mine.served && mine.still >= 800 && mine.standX !== null) {
        const keep3 = { cam: camMode, x: TRO.x, st: TRO.state };
        world = L.world; px = fx = s.x; py = fy = s.y; TRO.x = mine.standX; TRO.state = 'dwell';
        const shown = {};
        ['top', 'front'].forEach(c => { camSet(c); draw(); const sx = mine.standX * TS - camXg, sy = L.row * TS - camYg;
          shown[c] = sx + TS * troSpan(L) > 0 && sx < VW && sy + TS > 0 && sy < VH; });
        camSet(keep3.cam); TRO.x = keep3.x; TRO.state = keep3.st;
        Object.keys(shown).filter(c => !shown[c]).forEach(c => P.push('the trolley stops for you in ' + L.world + ' at x=' + mine.standX.toFixed(1) +
          ', past the end of the street — with you at the stop the ' + c + ' camera shows none of it: it stopped, and not where you can see it'));
      }
      const empty = ride(false);
      if (empty.served && empty.still > 400) P.push('the trolley stands at the stop in ' + L.world + ' for ' +
        empty.still + ' ms with nobody anywhere near it — it is not waiting for a passenger, it is just slow');
      world = keep.w; px = fx = keep.px; py = fy = keep.py;
      TRO.state = keep.st; TRO.x = keep.x; TRO.dir = keep.d; TRO.t = keep.t; TRO.called = keep.c;
    });
    return P;
  });
  fails.push(...dwell);

  /* ---- and you RIDE it: the pass no longer swaps the world under you ----
     The owner, 2026-09-11: "lets have the teleport survive for now but maybe the tram goes quickly
     if im on it, honks and everyone gets out of the way and we zip by in a 'slow' teleport or
     teleport with animation… am i describing literal decoration?" Then, 2026-09-12: "lets just
     build one and i'll give you feedback."
     Four nouns, and the third is the one with the trap in it:
     1. picking a destination does NOT change the world on that frame;
     2. it does change it, by itself, by the end of the line;
     3. the tram does not brake for its own passenger — the hero's DRAW position rides the car and
        his GRID position stays on the platform, and if those two ever became one thing the tram
        would see a person on the rails directly under its nose and hold for ever, which is this
        branch's own signature bug wearing a new hat;
     4. you cannot walk off a moving tram.
     Driven through troTick, which is the function loop() calls, so this is the shipped path. */
  const paseo = await page.evaluate(() => {
    const P = [];
    if (typeof RIDE === 'undefined' || typeof troTick !== 'function' ||
        typeof TRV === 'undefined' || TRV.length < 2) return P;
    const L = troLine(TRV[0].w); if (!L) return P;
    const here = TRV[0], there = TRV.find(t => t.w !== here.w);
    const keep = { w: world, px: px, py: py, st: TRO.state, x: TRO.x };
    world = here.w; px = fx = here.x; py = fy = here.y; moving = false;
    if (!rideCan()) P.push('the world the pass stands you in has no line the engine will ride — the trolley pass is a menu that teleports and nothing else');
    else {
      /* THROUGH THE BUTTON, not through rideStart(). The first version of this check called
         rideStart() directly and went green with the pass's own wiring cut out of openTravel() — it
         proved the ride works and NOT that anything ever starts one. That is the same mistake this
         repository has now made twelve times (docs/REGRESSION.md), on a guard written by the session
         that was writing the register entry for the eleventh. Planted, and it printed nothing. */
      openTravel();
      const btn = [...document.querySelectorAll('#tvList button')].find(b2 => !b2.disabled);
      if (!btn) { P.push('the trolley pass offered nowhere to go, so this proves nothing'); return P; }
      btn.click();
      if (world !== here.w) P.push('picking a destination in the trolley pass changes the world on the spot — there is no ride, it is still a teleport wearing a tram');
      if (!RIDE.on) P.push('picking a destination in the trolley pass does not start a ride at all');
      const asked = RIDE.to;
      let braked = false, walked = false, rode = false, n = 0;
      const startX = px, startY = py;
      while (RIDE.on && n++ < 600) {
        troTick(16.67);
        if (typeof critUpdate === 'function') critUpdate(16.67, performance.now() + n * 16.67);
        if (!RIDE.on) break;
        if (TRO.state === 'hold' && troAhead(L)) braked = true;
        if (Math.abs(fx - px) > 0.9) rode = true;          /* the DRAW position left the platform */
        if (px !== startX || py !== startY) walked = true; /* the GRID position must not have */
        held = 'right'; tryStep(); if (px !== startX || py !== startY) walked = true;
      }
      held = null;
      if (n >= 600) P.push('the trolley ride never ends — you get on and the line never runs out');
      if (!rode) P.push('the ride never moves: you board, the bell rings and the car stands there until the world changes around you');
      if (braked) P.push('the tram brakes for its own passenger — the rider is on the rails as far as the brake is concerned, so the ride holds for the person taking it');
      if (walked) P.push('you can walk off a moving trolley');
      const want = asked || there;
      if (world !== want.w) P.push('the trolley ride ends somewhere other than where you asked for: ' + world + ' instead of ' + want.w);
      else if (px !== want.x || py !== want.y) P.push('the trolley ride puts you down at ' + px + ',' + py + ' and the pass says ' + want.x + ',' + want.y);
      if (RIDE.on) P.push('the ride is still running after it arrived');
    }
    RIDE.on = false; RIDE.to = null; document.getElementById('travel').hidden = true;
    world = keep.w; px = fx = keep.px; py = fy = keep.py;
    TRO.state = keep.st; TRO.x = keep.x; held = null; warpT = 0;
    return P;
  });
  fails.push(...paseo);

  /* ---- and a ride never traps you ----
     The brake stays on during a ride and that is right. What is not right is the consequence nobody
     writes down: the thing it brakes for might be a neighbour who wanders once every 1.6 to 4.8
     seconds and is standing on the line, and while the tram waits the player cannot move, cannot get
     off and cannot see why. It is the worst class of bug this game can have — not wrong, stuck — and
     it is invisible unless you hold something on the rails on purpose, which is what this does. */
  const trapped = await page.evaluate(() => {
    const P = [];
    if (typeof RIDE === 'undefined' || typeof TRV === 'undefined' || TRV.length < 2) return P;
    const L = troLine(TRV[0].w); if (!L) return P;
    const here = TRV[0], there = TRV.find(t => t.w !== here.w);
    const keep = { w: world, px: px, py: py, st: TRO.state, x: TRO.x,
                   dx: typeof DOG !== 'undefined' ? DOG.x : 0, dy: typeof DOG !== 'undefined' ? DOG.y : 0,
                   dw: typeof AW === 'function' ? AW('dog') : null };
    world = here.w; px = fx = here.x; py = fy = here.y; moving = false;
    /* a real violation: something alive, parked on the rails, that will not move */
    const mid = Math.round((L.from + L.to) / 2), cr = CRIT.filter(c => c.world === L.world)[0];
    const was = cr ? { x: cr.x, y: cr.y, mv: cr.moving, nx: cr.next } : null;
    if (cr) { cr.x = cr.fx = mid; cr.y = cr.fy = L.row; cr.moving = false; cr.next = 1e9; }
    rideStart(there);
    let n = 0, everHeld = false;
    while (RIDE.on && n++ < 3000) { troTick(16.67);
      if (cr) { cr.x = cr.fx = mid; cr.y = cr.fy = L.row; cr.moving = false; cr.next = 1e9; }  /* it will not move */
      if (TRO.state === 'hold') everHeld = true; }
    if (cr && !everHeld) P.push('this check never got anything onto the rails in front of the ride — it proves nothing');
    else if (RIDE.on) P.push('a trolley ride with something standing on the line never ends: you are on a tram that will not move, you cannot walk off it, and nothing tells you why');
    else if (world !== there.w) P.push('a held trolley ride gives up and puts you somewhere that is not where you asked for: ' + world);
    RIDE.on = false; RIDE.to = null;
    if (cr && was) { cr.x = cr.fx = was.x; cr.y = cr.fy = was.y; cr.moving = was.mv; cr.next = was.nx; }
    world = keep.w; px = fx = keep.px; py = fy = keep.py;
    TRO.state = keep.st; TRO.x = keep.x; held = null; warpT = 0;
    return P;
  });
  fails.push(...trapped);

  /* ---- the window sills are not HIDDEN — asked with a ray, which is what that word means ----
     The owner has reported this four times: 2026-09-08 "the sugar skulls share a sill", 2026-09-09
     and 2026-09-10 "the skulls are still hidden on the sills", 2026-09-12 "another attempt at
     showing the window sills". Four answers were shipped and all four were about SIZE — 8 pixels of
     sweet, then 5, then 0.85 of the pane, then the whole pane lit. Each was measured. Each was
     defensible. He came back every time.
     Two things were actually wrong and neither is a dimension. **There was never a sill**: propSill
     has always computed a y called `sill` and nothing ever drew a ledge, so the candy stood on the
     bottom edge of a hole in a wall. And when the ledge was finally drawn, it was **behind the
     shopfront** — the sprite sat 0.035 in front of the wall face and something in front of the wall
     covered it, so the texture was perfect, the position was right, the sprite was visible:true, and
     the screen showed a dark smear. Found by rendering it and looking, after five rounds of reading
     the code and reasoning about it correctly and being wrong.
     So this does not measure anything. It asks the one question the owner has been asking: cast a
     ray from the camera at the sill and see whether the sill is what it hits. */
  const sills = await page.evaluate(() => {
    const P = [];
    if (typeof SEASONS === 'undefined' || typeof seasonSet !== 'function' || typeof THREE === 'undefined') return P;
    /* ASK THE ENGINE WHAT IS ON A SILL, not the config file. The first version of this check read
       `SEASONS[k].props`, and in this pack `props` is nested under `art` — so it found nothing, took
       an early return, and went green against THREE planted violations including "there is no sill
       at all", which is the state this shipped in for four owner reports. It read the shape of one
       file when it meant the thing the game draws. Entry thirteen, written by the session that had
       just written up eleven and twelve, in the same hour, in the guard FOR the bug. */
    const keep = { w: world, px: px, py: py, cam: camMode, season: (typeof seasonNow === 'function' ? seasonNow() : null) };
    let dressed = null, prop = null;
    for (const k of Object.keys(SEASONS)) { seasonSet(k);
      for (const wid of Object.keys(WORLDS)) {
        const q = (typeof fiestaProps === 'function' ? fiestaProps(wid) : []).find(r => r.sill && r.kind === 'calaverita');
        if (q) { dressed = k; prop = { ...q, world: wid }; break; } }
      if (prop) break; }
    if (!prop) { seasonSet(keep.season); return P; }   /* this pack hangs nothing on a sill */
    world = prop.world; px = fx = prop.x + 3; py = fy = prop.y + 2; moving = false;
    camSet('3d'); if (typeof draw3d === 'function') draw3d();
    const root = (typeof T3 !== 'undefined' && T3) ? (T3.group || T3.scene) : null;
    if (!root) { seasonSet(keep.season); return P; }
    let pane = null, ledge = null;
    root.traverse(o => { if (!o.userData) return;
      if (o.userData.ledge && o.userData.x === prop.x && o.userData.y === prop.y) ledge = o;
      else if (o.userData.sill && o.userData.x === prop.x && o.userData.y === prop.y) pane = o; });
    if (!pane) { P.push('the window this season dresses has no lit pane in 3D at all'); }
    if (!ledge) {
      P.push('there is no sill under the window in 3D — the candy is standing on the bottom edge of a hole in a wall, which is what "the skulls are hidden on the sills" has meant every time it was reported');
    } else {
      /* it must sit immediately UNDER the pane, not floating and not overlapping it */
      if (pane) { const gap = (pane.position.y) - (ledge.position.y + ledge.scale.y);
        if (Math.abs(gap) > 0.02) P.push('the sill is ' + gap.toFixed(3) + ' world units from the window it belongs to — a ledge that is not touching its own window is a shelf hanging in a wall'); }
      /* AND IT IS NOT HIDDEN — asked of the SCREEN, because nothing else can answer it.
         Two cleverer versions of this check were written first and both went green against the real
         bug. A raycast against the scene's meshes found nothing in the way; a probe of the objects
         on that tile found nothing but the two sprites. Both were right and both were useless,
         because the occluder is not another object — it is the wall the sprite hangs on. A sprite is
         a billboard that turns to face the camera, the camera looks DOWN at the street, so the lower
         half of a tall billboard tilts back INTO the wall behind it and is swallowed. Moving it
         0.045 further out fixed it; no amount of asking the scene graph would ever have said so.
         So: render, find where the ledge lands on screen, and count the pale stone pixels that
         actually arrived there. "Hidden" is a fact about pixels. It is the owner's own word, he has
         used it three times, and this is the first check in this file that reads it. */
      const gl = T3.renderer.getContext();
      if (typeof draw3d === 'function') draw3d();                 /* the drawing buffer is only valid right after */
      const cv = T3.renderer.domElement;
      const mid = ledge.position.clone(); mid.y += ledge.scale.y * 0.55;
      const v = mid.project(T3.cam);
      const sx = Math.round((v.x * 0.5 + 0.5) * cv.width), sy = Math.round((v.y * 0.5 + 0.5) * cv.height);
      const R = Math.max(6, Math.round(ledge.scale.x * cv.width / 12));
      const w2 = R * 2, h2 = Math.max(6, R);
      const buf = new Uint8Array(w2 * h2 * 4);
      gl.readPixels(Math.max(0, sx - R), Math.max(0, sy - h2 / 2), w2, h2, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      /* the stone is #F7F2E2 — the palest thing anywhere near a night facade. Count what survived. */
      let stone = 0;
      for (let i = 0; i < buf.length; i += 4)
        if (buf[i] > 190 && buf[i + 1] > 185 && buf[i + 2] > 165 && buf[i + 3] > 200) stone++;
      if (stone < 3) P.push('the window sill is drawn, correctly placed, reports itself visible — and ' +
        stone + ' of its pixels reach the screen. It is hidden: either something is in front of it, or ' +
        'it is the colour of what is behind it. (The known cause is the wall it hangs on — a billboard ' +
        'tilts into the surface behind it when the camera looks down — but this check only knows that ' +
        'nothing arrived.) The owner has reported this as "the skulls are hidden on the sills" three times');
    }
    seasonSet(keep.season); world = keep.w; px = fx = keep.px; py = fy = keep.py; camSet(keep.cam);
    return P;
  });
  fails.push(...sills);

  /* ---- THE ALTAR HAS A TABLE UNDER IT, AND IT IS THE ALTAR'S SIZE ----
     Owner, 2026-09-22: "dona tenchas table is too small. take it out when its dia de los muertos or
     alebrijes mode and replae it with a bigger table for the altar. please"

     WHAT THIS ASKS, AND WHY IT IS NOT A WIDTH. The obvious check is "is the table's bounding box at
     least as wide as the altar's", and it is proxy #9 all over again — the tram's skirt reached the
     road with all four wheels deleted. The round table's own two chairs stand at x ±0.43, so its BOX
     is 1.09 wide while the cloth you could actually set something on is a disc 0.68 across: a box
     check calls that "wide enough" and the altar is still standing on air with two chair backs under
     its corners. The noun is not a width, it is CONTACT — for every place the altar touches down, is
     there table under it? So this takes the altar's own base out of the built geometry and drops a
     ray from each point onto the tile's shape. Nothing else can tell the difference between a table
     and two slats with a table's width of air between them.

     IT CANNOT PASS BY FINDING NOTHING. No season with an ofrenda on a solid tile, no world, no shape
     under the prop, no prop in the scene — every one of those is a RED with its own sentence, because
     "nothing to measure" has printed a pass sentence in this repository before (docs/REGRESSION.md
     #21, and the first sill guard, which went green against three planted violations). */
  const altarTables = await page.evaluate(() => {
    const P = [];
    if (typeof SEASONS === 'undefined' || typeof seasonSet !== 'function' || typeof THREE === 'undefined' ||
        typeof fiestaProps !== 'function' || typeof draw3d !== 'function') {
      P.push('nothing measured whether the altar has a table under it: the season seam, three.js or the 3D camera is missing'); return P; }
    const keep = { w: world, px: px, py: py, cam: camMode, season: (typeof seasonNow === 'function' ? seasonNow() : null) };
    const restore = () => { seasonSet(keep.season); world = keep.w; px = fx = keep.px; py = fy = keep.py; camSet(keep.cam); };

    /* ASK THE ENGINE where an ofrenda stands ON something — `props` is nested under `art` in this
       pack, so reading the config file's shape finds nothing and returns early (POSTMORTEM §13).
       `up` here is the engine's own test, copied from the season-prop pass in engine3d.js. */
    const stood = [], flat = [];
    for (const k of Object.keys(SEASONS)) { seasonSet(k);
      for (const wid of Object.keys(WORLDS)) {
        const w = WORLDS[wid]; if (!w || !w.rows) continue;
        (fiestaProps(wid) || []).forEach(p => { if (p.kind !== 'ofrenda') return;
          const g = w.rows[p.y] && w.rows[p.y][p.x];
          const up = g !== undefined && (SOLID.has(g) || ((TILES[g] || {}).lift | 0) >= 5);
          (up ? stood : flat).push({ season: k, world: wid, x: p.x, y: p.y, g: g }); }); } }
    if (!stood.length) { restore();
      P.push('no season in this pack stands an ofrenda on a table — ' + flat.length + ' ofrendas were found and every one is on the floor. ' +
        'So this check measured nothing, and nothing to measure is a red, not a pass'); return P; }

    for (const job of stood) {
      seasonSet(job.season); world = job.world; px = fx = job.x; py = fy = job.y + 3; moving = false; held = null;
      camSet('3d'); draw3d();
      const root = (typeof T3 !== 'undefined' && T3) ? T3.group : null;
      if (!root) { P.push('the 3D scene did not build at all for ' + job.world + ', so the altar at (' + job.x + ',' + job.y + ') was never measured'); continue; }
      let table = null, altar = null;
      root.children.forEach(o => { const u = o.userData || {}; if (!o.geometry) return;
        if (u.ofrenda) altar = o;
        else if (u.mesh && u.g && u.x === job.x && u.y === job.y) table = o; });
      if (!altar) { P.push('in ' + job.season + ' the ofrenda at ' + job.world + ' (' + job.x + ',' + job.y + ') is not a shape in the 3D scene, ' +
        'so whether it has a table under it could not be measured at all'); continue; }
      if (!table) { P.push('in ' + job.season + ' the ofrenda at ' + job.world + ' (' + job.x + ',' + job.y + ') is standing on tile "' + job.g +
        '", and that tile has no shape in 3D — there is nothing under the altar to measure'); continue; }

      /* THE ALTAR'S OWN FEET, out of its built geometry: every vertex within 0.025 of its base is a
         place it touches down. Taken in its own local space and carried out through its own matrix,
         so the 0.8 the engine scales it by is included and not retyped here (guard trap A). */
      altar.updateMatrixWorld(true); table.updateMatrixWorld(true);
      const pos = altar.geometry.getAttribute('position');
      const seen = new Set(), feet = [];
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        if (pos.getY(i) > 0.025) continue;
        v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(altar.matrixWorld);
        const key = Math.round(v.x * 60) + ',' + Math.round(v.z * 60);   /* one sample per ~1.7cm of floor */
        if (seen.has(key)) continue; seen.add(key); feet.push({ x: v.x, z: v.z });
      }
      if (feet.length < 8) { P.push('in ' + job.season + ' the ofrenda at ' + job.world + ' (' + job.x + ',' + job.y + ') has only ' + feet.length +
        ' points where it touches down, which is too few to say anything about what is under it'); continue; }

      const ab = altar.geometry.boundingBox || (altar.geometry.computeBoundingBox(), altar.geometry.boundingBox);
      const sc = altar.scale.x, aw = (ab.max.x - ab.min.x) * sc, ad = (ab.max.z - ab.min.z) * sc;

      /* AND THE ALTAR IS STILL THE ALTAR'S SIZE — because CONTACT ALONE PASSES THE OPPOSITE WRONG FIX.
         Leave the round table exactly where it is and shrink the ofrenda until it fits on the cloth:
         every foot lands on something, nothing is standing on air, the contact test below counts zero
         misses and prints OK — and the owner, who asked for a BIGGER TABLE, has been given a SMALLER
         ALTAR. That is not a hypothetical: planted 2026-09-22 by reverting content/meridian/art.js to
         its old round table and setting the engine's `sc = up ? 0.8 : 1` to 0.45, this whole block went
         green. A guard that green-lights the opposite of the ask is not a guard, so the size the altar
         has to KEEP is asserted here and not inferred from the fact that it fits.

         WHERE 0.75 AND 0.57 COME FROM, so nobody has to guess later. An ofrenda is drawn to fill the
         tile it is set on, and the engine scales it to 0.8 when it stands on something (engine3d.js,
         the `sc = up ? 0.8 : 1` line), which measures 0.83 wide by 0.64 deep out of the built geometry.
         These are 90% of that: enough slack that somebody redrawing the altar's art pays nothing, tight
         enough that any extra shrink below about 0.72 of a tile is caught by the width. */
      if (aw < 0.75 || ad < 0.57) {
        P.push('in ' + job.season + ' the altar at ' + job.world + ' (' + job.x + ',' + job.y + ') has been shrunk to fit its table: it measures ' +
          aw.toFixed(2) + ' wide and ' + ad.toFixed(2) + ' deep, where an ofrenda standing on something is 0.83 by 0.64 — near enough ' +
          'the whole tile it is set on. Somebody made the altar smaller instead of the table bigger, and the owner asked for the table');
      }

      const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3();
      const standY = altar.position.y;
      let miss = 0;
      feet.forEach(f => { from.set(f.x, standY + 0.12, f.z); ray.set(from, down);
        if (!ray.intersectObject(table, false).length) miss++; });

      if (miss) {
        /* what it IS standing on, at the height it stands: the tile's shape sliced at the altar's feet */
        const tp = table.geometry.getAttribute('position');
        let tx0 = 1e9, tx1 = -1e9, tz0 = 1e9, tz1 = -1e9, n = 0;
        const top = (table.t3Top !== undefined ? table.t3Top : standY);
        for (let i = 0; i < tp.count; i++) { const ty = tp.getY(i); if (ty < top - 0.02 || ty > top + 0.001) continue;
          n++; const X = tp.getX(i), Z = tp.getZ(i);
          if (X < tx0) tx0 = X; if (X > tx1) tx1 = X; if (Z < tz0) tz0 = Z; if (Z > tz1) tz1 = Z; }
        P.push('in ' + job.season + ' the altar at ' + job.world + ' (' + job.x + ',' + job.y + ') is standing on a table too small for it: ' +
          miss + ' of the ' + feet.length + ' places where it touches down have nothing under them. The altar is ' +
          aw.toFixed(2) + ' wide and ' + ad.toFixed(2) + ' deep; what it is resting on measures ' +
          (n ? (tx1 - tx0).toFixed(2) + ' by ' + (tz1 - tz0).toFixed(2) : 'nothing at all') +
          '. In a house you do not balance an ofrenda on the table you eat at — you carry in a bigger one');
      }
    }

    /* AND THE SEVEN TABLES NOBODY ASKED ABOUT. There are eight `T` tiles in this game and only one of
       them is Doña Tencha's; the other seven are La Cocina's four dinner tables (lc 3,3 · 7,3 · 11,3 ·
       15,3), La Panadería's two (pa 15,5 · 13,7) and one in the lobby (lo 11,5) — counted out of the
       built rows on 2026-09-22, because the first draft of this sentence said eight and named six. The
       cheap way to make the check above pass is to swap the table for the whole season, which would
       set a funeral table under four restaurant dinners in both seasons and nobody would find it
       until he did. So: a table with NO altar on it is the same shape in season as out of it. */
    const onAltar = new Set(stood.concat(flat).map(j => j.world + ':' + j.x + ',' + j.y));
    const shapeOf = (wid, x, y) => { world = wid; px = fx = x; py = fy = Math.min(y + 3, WORLDS[wid].rows.length - 1);
      moving = false; camSet('3d'); draw3d();
      let m = null; (T3.group ? T3.group.children : []).forEach(o => { const u = o.userData || {};
        if (u.mesh && u.g && u.x === x && u.y === y && o.geometry) m = o; });
      if (!m) return null;
      m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox;
      return m.geometry.getAttribute('position').count + '|' + [b.min.x, b.max.x, b.min.y, b.max.y, b.min.z, b.max.z].map(q => q.toFixed(3)).join(','); };
    let checked = 0;
    for (const wid of Object.keys(WORLDS)) { const w = WORLDS[wid]; if (!w || !w.rows) continue;
      for (let y = 0; y < w.rows.length; y++) for (let x = 0; x < w.rows[y].length; x++) {
        if (w.rows[y][x] !== 'T' || onAltar.has(wid + ':' + x + ',' + y)) continue;
        seasonSet('off'); const off = shapeOf(wid, x, y);
        if (off === null) continue;
        for (const k of Object.keys(SEASONS)) { seasonSet(k); const on = shapeOf(wid, x, y);
          checked++;
          if (on !== off) { P.push('in ' + k + ' the table at ' + wid + ' (' + x + ',' + y + ') changed shape, and there is no altar on it — ' +
            'the season is dressing every table in the game instead of the one the ofrenda stands on, so ' +
            "La Cocina's dinner tables are altar tables now"); } } } }
    if (!checked) P.push('there is no table anywhere in this game without an altar on it, so nothing checked that the season leaves the other tables alone');

    /* ---- AND THE SAME TABLE IN THE THREE CAMERAS THAT ARE NOT 3D ----
       The first version of this fix was a 3D-camera change and nothing else, and in the flat cameras
       the altar went on standing over the ROUND table: the front camera drew its two thin legs under
       the ofrenda sprite and the top camera showed its red gingham through the marigold arch. Both were
       already drawing a table and neither had been told it changed. (Iso is not in this check and
       cannot be: `drawIso` paints a solid tile as one flat colour out of `ISOCOL`, engine/engine.js:862,
       so it has never drawn this table at all and no pack change reaches it.) So the check is: ON THE
       ALTAR'S TILE, in season, BOTH the top-down drawing and the front profile must differ from what
       they are out of season — and on every other `T` tile both must be identical to it.

       WHAT THIS COMPARISON THROWS AWAY, named in the same breath as the result (the crew rule: name what your comparison discarded): it
       paints ONE tile, alone, into a 32x32 buffer and compares the RGBA bytes. It therefore knows
       nothing about draw ORDER, nothing about what is painted over this tile afterwards — the ofrenda
       sprite is painted over it, which is the whole reason the first version looked fine — and nothing
       about any camera's own shading. It answers one question: did the drawing change. Whether the
       change is VISIBLE is a thing only a picture can answer, and it was answered with one.

       Borrowing `ctx` for an offscreen canvas is the engine's own idiom for this; test/tilesheet.js
       has done it since the cold-read sheet shipped. */
    const paintTile = (view, x, y) => {
      const fn = (typeof tileView === 'function') ? tileView('T', view) : null;
      if (typeof fn !== 'function') return null;
      const c = document.createElement('canvas'); c.width = 32; c.height = 32;
      const old = ctx; let out = null;
      try { ctx = c.getContext('2d'); fn({ sx: 0, sy: 0, x: x, y: y, canopy: () => {} });
        const d = c.getContext('2d').getImageData(0, 0, 32, 32).data;
        let ink = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) ink++;
        out = { sig: Array.from(d).join(','), ink: ink / (32 * 32) }; }
      catch (e) { out = { threw: e.message }; }
      ctx = old; return out; };

    /* ---- AND THE DRAWING HAS TO BE A DRAWING. THIS IS THE HOLE THE FIRST VERSION HAD. ----
       Everything below compares one signature against another, and two signatures that are both
       EMPTY compare equal. That is not a hypothetical either: the pack puts a getter in front of the
       engine's own `TILEDRAW["T"]` and captures the original at the moment `Object.assign` reads it
       (content/meridian/art.js, `wrapTableArt`), and the first draft froze that capture even when it
       found nothing. Planted on 2026-09-22 — one line, `void TILEART.T;`, reading the top view before
       engine.js has built `TILEDRAW` — it took the top-down drawing away from ALL EIGHT `T` tiles in
       the game: La Cocina's four dinner tables, La Panadería's two and the lobby's one were bare
       floor from above, and THIS BLOCK PRINTED NOTHING, because blank in season equalled blank out of
       it. The suite said "OK — 60 quests, maxXP 880, all invariants hold."

       So an empty tile is a RED, everywhere, in both views, in season and out — the fourth guard trap
       in `.claude/skills/guard/SKILL.md`, "nothing to measure is a red, never a pass", applied to the
       measurement itself rather than to the subject. The two failures are opposite and BOTH are now
       named: a wrapper that never got installed leaves the altar's tile drawn the same in season as
       out of it (caught below by the `onTop === offTop` pair), and a wrapper installed with nothing
       behind it leaves every OTHER table drawn as nothing at all (caught here). Planted both ways.

       AND IT IS INK, NOT EMPTINESS, BECAUSE "NOT BLANK" IS ONE PIXEL AWAY FROM BLANK. A wrapper that
       returned a single grey dot for every table in the game would clear a blank test and leave the
       game just as broken, so the floor is a SHARE OF THE TILE. A table is a big object in its own
       square and the four real drawings are nowhere near the line — measured on 2026-09-22 out of
       these same 32x32 buffers, every `T` tile in the game: the round table from above 0.5527 and
       from the front 0.4023, the altar table from above 0.8750 and from the front 0.4863. The floor
       is 0.08, a fifth of the thinnest of them, so no honest redraw trips it and a token dot cannot
       pass it. (WHAT THE SHARE THROWS AWAY, in the same breath as the result: it counts pixels with
       any alpha at all and knows nothing about WHICH pixels, so it cannot tell a table from a blot
       of the same area. The identity comparison below is what says it is the same table; this only
       says something was painted.) */
    const INK = 0.08;
    const drew = (r, who, view, when) => {
      const cam = view === 'top' ? 'FROM ABOVE' : 'in the FRONT camera';
      if (r === null) { P.push(who + ' has no ' + (view === 'top' ? 'top-down drawing' : 'front profile') + ' at all ' + when +
        ', so the cameras that are not 3D could not be checked — and those are three of the four'); return false; }
      if (r.threw !== undefined) {
        P.push(who + ' threw while it was being drawn ' + cam + ' ' + when + ' (' + r.threw + ')'); return false; }
      if (r.ink < INK) { P.push(who + ' is drawn as ' + (r.ink === 0 ? 'NOTHING AT ALL' : 'almost nothing — ' + Math.round(r.ink * 100) +
        '% of the tile') + ' ' + cam + ' ' + when + ', so in that camera the table is bare floor. The pack stands a wrapper in front ' +
        'of the engine\'s own table drawing (content/meridian/art.js, wrapTableArt) and this is what it looks like when the wrapper ' +
        'has nothing behind it: every table in the game disappears, not just this one'); return false; }
      return true; };

    let flatChecked = 0;
    for (const job of stood) {
      world = job.world;
      const who = 'the tile the altar stands on at ' + job.world + ' (' + job.x + ',' + job.y + ')';
      seasonSet('off');      const offTop = paintTile('top', job.x, job.y), offSide = paintTile('side', job.x, job.y);
      seasonSet(job.season); const onTop  = paintTile('top', job.x, job.y), onSide  = paintTile('side', job.x, job.y);
      const ok = [drew(offTop, who, 'top', 'out of season'), drew(offSide, who, 'side', 'out of season'),
                  drew(onTop, who, 'top', 'in ' + job.season), drew(onSide, who, 'side', 'in ' + job.season)];
      if (ok.some(q => !q)) continue;
      flatChecked++;
      if (onTop.sig === offTop.sig) P.push('in ' + job.season + ' the tile the altar stands on at ' + job.world + ' (' + job.x + ',' + job.y + ') is drawn ' +
        'FROM ABOVE exactly as it is out of season, so in the top camera the altar is still standing on the small round dinner table ' +
        '— you can see it through the gap in the marigold arch');
      if (onSide.sig === offSide.sig) P.push('in ' + job.season + ' the FRONT camera draws the tile the altar stands on at ' + job.world + ' (' + job.x + ',' +
        job.y + ') exactly as it does out of season, so the legs and the gingham edge showing either side of the ofrenda are still the ' +
        'small round table\'s');
    }
    if (!flatChecked) P.push('nothing checked whether the flat cameras show the altar\'s table, so three of the four cameras went unmeasured');

    let othersDrawn = 0;
    for (const wid of Object.keys(WORLDS)) { const w = WORLDS[wid]; if (!w || !w.rows) continue;
      for (let y = 0; y < w.rows.length; y++) for (let x = 0; x < w.rows[y].length; x++) {
        if (w.rows[y][x] !== 'T' || onAltar.has(wid + ':' + x + ',' + y)) continue;
        world = wid;
        const who = 'the table at ' + wid + ' (' + x + ',' + y + '), which has no altar on it,';
        seasonSet('off'); const oT = paintTile('top', x, y), oS = paintTile('side', x, y);
        /* this used to be `if (oT === null) continue;` — a table with no drawing was SKIPPED here and
           RED on the altar's own tile, which is the same fault guarded on one side and waved through
           on the other. It is red on both sides now. */
        if (!drew(oT, who, 'top', 'out of season') || !drew(oS, who, 'side', 'out of season')) continue;
        othersDrawn++;
        for (const k of Object.keys(SEASONS)) { seasonSet(k);
          const kT = paintTile('top', x, y), kS = paintTile('side', x, y);
          if (!drew(kT, who, 'top', 'in ' + k) || !drew(kS, who, 'side', 'in ' + k)) continue;
          if (kT.sig !== oT.sig || kS.sig !== oS.sig)
            P.push('in ' + k + ' the table at ' + wid + ' (' + x + ',' + y + ') is DRAWN differently and there is no altar on it — ' +
              'the altar cloth has been thrown over every table in the game in the flat cameras too'); } } }
    if (!othersDrawn) P.push('not one table without an altar on it could be drawn in the flat cameras, so nothing checked that the ' +
      'season leaves the rest of the game\'s tables alone — and nothing to measure is a red, not a pass');

    restore();
    return P;
  });
  fails.push(...altarTables);

  /* ---- and in the FRONT camera the sill box has to REACH THE CANVAS at all ----
     Chema, 2026-09-14 (docs/3D-LOG.md): blank the one painter and diff the frame. In the front camera
     `drawSillBox` was called eight times a frame and delivered ZERO pixels — the fiesta was drawn in
     the ground pass and the facade's own tile art painted over it in the depth pass, every frame since
     the sills shipped. No contrast number could have said that, because there was nothing to take the
     contrast of; five fixes about size and light went past it. So this asks the only question that
     catches the whole class: with `drawSillBox` a no-op, does the front frame CHANGE? A prop the
     ground pass draws and the depth pass covers changes nothing. The 3D check above reads the ledge's
     stone in one camera; this reads the sweet, the pane and the ledge together in the other. */
  const frontSill = await page.evaluate(() => {
    const P = [];
    if (typeof SEASONS === 'undefined' || typeof seasonSet !== 'function' || typeof drawSillBox !== 'function' || typeof draw !== 'function') return P;
    const keep = { w: world, px: px, py: py, cam: camMode, season: (typeof seasonNow === 'function' ? seasonNow() : null) };
    let prop = null;
    for (const k of Object.keys(SEASONS)) { seasonSet(k);
      for (const wid of Object.keys(WORLDS)) {
        const q = (typeof fiestaProps === 'function' ? fiestaProps(wid) : []).find(r => r.sill && r.kind === 'calaverita');
        if (q) { prop = { ...q, world: wid }; break; } }
      if (prop) break; }
    if (!prop) { seasonSet(keep.season); return P; }
    world = prop.world; px = fx = prop.x + 3; py = fy = prop.y + 2; moving = false; held = null;
    camSet('front');
    const c = document.getElementById('cv'), g = c.getContext('2d');
    /* the frame has to be STILL or the diff measures the tram and the petals: freeze both clocks,
       as the measurement that found this did. The first draft of this probe did not, read 703 pixels
       of noise between two identical frames, and would have passed on a frame that draws no sill */
    const D = Date.now, PN = performance.now, t0 = D(); Date.now = () => t0; performance.now = () => t0;
    const frame = () => { draw(); return g.getImageData(0, 0, c.width, c.height).data; };
    const a = frame(), a2 = frame();                     /* the control: two frames, nothing changed */
    let noise = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== a2[i] || a[i + 1] !== a2[i + 1] || a[i + 2] !== a2[i + 2]) noise++;
    const real = drawSillBox; drawSillBox = function () {}; /* the one painter, blanked */
    const b = frame(); drawSillBox = real; Date.now = D; performance.now = PN;
    let changed = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) changed++;
    if (noise > 50) P.push('the front-camera sill probe has ' + noise + ' pixels of noise between two identical frames — it cannot measure anything until the frame is still');
    else if (changed < 100) P.push('the front camera calls drawSillBox for every dressed window and ' + changed + ' pixels of it reach the canvas (control noise ' + noise + '): the sill box is painted in the ground pass and the facade\'s own art is painted over it afterwards. The window, the sweet and the ledge are drawn and then covered, every frame. A prop standing on a SOLID tile belongs in that tile\'s row of the depth queue, after its facade');
    seasonSet(keep.season); world = keep.w; px = fx = keep.px; py = fy = keep.py; camSet(keep.cam);
    return P;
  });
  fails.push(...frontSill);


  /* ---- the plan says where somebody is waiting, and it says it in PIXELS ----
     #160, and the owner's word of 2026-09-15: "i like the marking of people with quests in
     different colors but its hard to tell unless you have a legend." docs/meetings/2026-09-14-el-mapa.md
     §7 is the plan. This guard is written the way REGRESSION.md §3 says to write it: not
     "drawPlanMarks was called N times" — a call count where the noun is a mark on a tile is the
     commonest wrong guard in this repo — but blank the one painter and read what the plan lost,
     and plant a world with NOBODY waiting, which must lose nothing. Every plant is on real state
     (a quest id taken out of `done` and put back), never on a stub. */
  const plan = await page.evaluate(() => {
    const P = [];
    if (typeof planMarks !== 'function' || typeof drawPlanMarks !== 'function')
      { P.push('the plan carries nothing about who is waiting: planMarks()/drawPlanMarks() do not exist (#160)'); return P; }
    if (typeof drawTown !== 'function' || typeof MAPDOT === 'undefined') return P;
    const c = document.getElementById('mapcv'), g = c.getContext('2d'), s = 10;
    const shot = () => { drawTown(); return g.getImageData(0, 0, c.width, c.height).data; };
    const box = (buf, tx, ty) => { /* the pixels of ONE tile, by tile coords */
      const out = []; const x0 = tx * s, y0 = ty * s;
      for (let y = y0 - s; y < y0 + s * 2; y++) for (let x = x0 - s; x < x0 + s * 2; x++) {
        if (x < 0 || y < 0 || x >= c.width || y >= c.height) continue;
        const i = (y * c.width + x) * 4; out.push(buf[i], buf[i + 1], buf[i + 2]); }
      return out; };
    const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 3) if (a[i] !== b[i] || a[i+1] !== b[i+1] || a[i+2] !== b[i+2]) n++; return n; };

    /* the plant: one quest-giver on the drawn street, made pending by real state */
    const st = PL.street, people = ((WORLDS[st] || {}).npcs || []);
    let who = null, qid = -1;
    for (const n of people) { const q = (n.q || []).find(i => qOpen(i)); if (q !== undefined) { who = n; qid = q; break; } }
    if (!who) { P.push('no quest-giver stands on the street world, so the plan cannot be tested'); return P; }
    const had = done.has(qid); done.delete(qid);
    /* a world nobody is waiting in — the plant that must draw NOTHING */
    let quiet = null;
    for (const id of Object.keys(MAPDOT)) if (id !== st && WORLDS[id] && !worldPending(id)) { quiet = id; break; }

    const real = drawPlanMarks;
    const on = shot();
    drawPlanMarks = function () {}; const off = shot(); drawPlanMarks = real;

    const lost = diff(box(on, who.x, who.y), box(off, who.x, who.y));
    if (lost < 12) P.push('a quest-giver is standing on the street with an open question and blanking the plan\'s mark painter changes ' + lost + ' pixels at his tile: the plan does not say he is there');
    if (quiet) { const q = MAPDOT[quiet], same = diff(box(on, q[0], q[1]), box(off, q[0], q[1]));
      if (same > 0) P.push('the world "' + quiet + '" has nobody waiting in it and the plan draws ' + same + ' pixels of mark at its anchor anyway: the mark is not reading who is waiting'); }

    /* two clauses true at once — work AND something to read. The kind the pack declared first wins,
       and the plan must say ONE thing about one person, not two marks on one tile */
    const kinds = (typeof MAPMARK !== 'undefined' && Array.isArray(MAPMARK)) ? MAPMARK : [];
    {
      const keepDoc = who.doc; who.doc = 'any';                 /* two clauses true at once */
      const marks = planMarks().filter(m => m.w === st && m.x === who.x && m.y === who.y);
      who.doc = keepDoc;
      if (marks.length !== 1) P.push('a person with work for you AND something to read gets ' + marks.length + ' marks on one tile');
      else if (marks[0].k !== kinds.find(k => k === 'work' || k === 'read'))
        P.push('a person who is two kinds at once is marked "' + marks[0].k + '": the kind the pack declared FIRST must win');
    }
    { /* the opt-in, planted the only way that proves it: a kind the pack did NOT declare draws
         nothing at all. In Meridian nobody hands you a document, so "read" is undeclared.
         The plant is MADE, never found: the first draft waited for a neighbour who happened to have
         no work, there was no such neighbour at this point in the suite, and the check sat there
         passing without ever running — the failure this repo keeps writing down. */
      if (!kinds.includes('read')) {
        const man = people.find(n => !roomPending(n)) || people[0];
        const keepQ = man.q, keepDoc = man.doc;
        man.q = []; man.doc = 'any';                     /* nothing but a document to hand you */
        const drew = planMarks().some(m => m.w === st && m.x === man.x && m.y === man.y);
        man.q = keepQ; man.doc = keepDoc;
        if (drew) P.push('a neighbour with nothing but a document is marked on the plan, and this pack never declared the kind "read": an undeclared kind must draw nothing');
      }
    }

    /* the legend: real text, one row per kind actually drawn, in the language the game is in */
    const rows = document.querySelectorAll('#mapLeg [data-kind]');
    const drawn = [...new Set(planMarks().map(m => m.k))];
    if (rows.length !== drawn.length) P.push('the plan draws ' + drawn.length + ' kinds of mark and the legend has ' + rows.length + ' rows: the owner said "its hard to tell unless you have a legend"');
    rows.forEach(r => { if (!r.textContent.trim()) P.push('a legend row for "' + r.getAttribute('data-kind') + '" has no word beside its colour'); });

    /* the destination he chooses — and the ring that says he chose it */
    if (typeof mapPick === 'function') {
      const before = shot();
      mapPick(who.x + 0.5, who.y + 0.5);
      const after = shot();
      if (diff(box(before, who.x, who.y), box(after, who.x, who.y)) < 8) P.push('choosing a destination on the plan draws nothing at the place chosen');
      const tag = document.getElementById('worldTag').textContent;
      if (!/→|↑|↗|→|↘|↓|↙|←|↖|🚋/.test(tag)) P.push('a destination is chosen and the world tag does not point at it: "' + tag + '"');
      mapPick(who.x + 0.5, who.y + 0.5); /* the same mark again clears it */
      if (mapDest) P.push('tapping the chosen destination again does not clear it');
    } else P.push('there is no way to choose a destination on the plan (mapPick), which is the half of #160 the owner asked for by name');

    if (!had) done.delete(qid); else done.add(qid);
    drawTown();
    return P;
  });
  fails.push(...plan);


  /* ---- two one-line faults, planted rather than reasoned (#192, #193) ----
     Both plants are MADE, never found. The first draft of this block looked for a wanderer in
     whatever world the suite happened to be standing in, found none, and passed twice without
     running a line of either check. */
  const twoSmall = await page.evaluate(() => {
    const P = [];
    /* #193 · a "__proto__" key in the text lab's paste reaches a prototype SETTER. JSON.parse keeps
       the key as an ordinary own property; Object.assign then SETS it, and the target — NPCN[lang],
       the cast's names — gets a new prototype it never asked for, so every unknown name lookup can
       be answered by whatever was pasted. Local-only and self-inflicted (his own paste, his own
       lab), which is why it is low tier and not why it may stand. */
    try {
      const before = Object.getPrototypeOf(NPCN[lang]);
      localStorage.setItem(SK('text_') + lang, '{"npcNames":{"__proto__":{"mqPwned":1}}}');
      applyText();
      if (NPCN[lang].mqPwned !== undefined || Object.getPrototypeOf(NPCN[lang]) !== before)
        P.push('pasting {"__proto__":…} into the text lab replaces the prototype of the cast\'s own name table (#193): a name nobody wrote now answers');
      Object.setPrototypeOf(NPCN[lang], before);
    } catch (e) { P.push('the text-lab prototype probe threw: ' + e.message); }
    localStorage.removeItem(SK('text_') + lang);

    /* #192 · when a neighbour steps OFF a tile, the engine writes plain floor over whatever the map
       had there. Nothing visible today — no decorated tile sits inside a wander pen — so the plant
       makes one: put a jacaranda on the tile under a wanderer, walk him off it, and read what is
       left. The same file already knows the answer seventy lines earlier: "the glyph the map had,
       not '.'". `rows` are strings and `grid` rows are arrays; the first draft of this plant wrote
       a string into grid, which no assignment in the engine can change, and proved nothing. */
    let wid = null, n = null;
    for (const id of Object.keys(WORLDS)) {
      const cand = (WORLDS[id].npcs || []).find(p => wanders(p) && p.x + 1 < WORLDS[id].W);
      if (cand) { wid = id; n = cand; break; }
    }
    if (!n) P.push('no wanderer anywhere in this pack, so the step-off cannot be tested');
    else {
      const keepW = world, w = WORLDS[wid], gx = n.x, gy = n.y;
      const keepRow = w.rows[gy], keepCell = w.grid[gy][gx], keepNext = w.grid[gy][gx + 1];
      world = wid;                                         /* wanderUpdate only walks CW() */
      w.rows[gy] = keepRow.substring(0, gx) + 'J' + keepRow.substring(gx + 1);
      w.grid[gy][gx] = 'N'; w.grid[gy][gx + 1] = '.';
      n.mv = [gx + 1, gy]; n.mt = 1; n.wnext = 0;
      wanderUpdate(16);
      const left = w.grid[gy][gx];
      w.rows[gy] = keepRow; w.grid[gy][gx] = keepCell; w.grid[gy][gx + 1] = keepNext;
      n.mv = null; n.mt = 0; n.x = gx; n.y = gy; n.fx = gx; n.fy = gy; world = keepW;
      if (left !== 'J') P.push('a neighbour steps off a decorated tile and the engine writes "' + left + '" over the map\'s own glyph (#192): the map says "J"');
    }
    return P;
  });
  fails.push(...twoSmall);


  /* ---- MERIDIAN HAS NO BUILDER'S DRONE (#271) ----
     The builder's drone is a pack's choice — `BUILDER` in a pack's config — and Meridian's answer is
     no: the drone is a tool for making a world, and this game's players came to practise a job. Its
     content is never edited for another world's sake. This is the CONTENT half of the rule and it
     lives here, in Meridian's own suite, because the shared suite cannot know which answer a game
     chose: test/engine.smoke.js asks the engine half (where no builder is declared, B does nothing and
     Settings offers nothing), and measures the drone under a probe declaration it takes away again. */
  const noDrone = await page.evaluate(() => ({ declared: typeof BUILDER !== 'undefined', row: !!document.getElementById('openDrone') }));
  if (noDrone.declared) fails.push("Meridian's players can fly the builder's drone: Meridian's config declares BUILDER, and the builder is a tool for making worlds that this game's players were never offered");
  if (noDrone.row) fails.push("Meridian's Settings offers every player the builder's drone");

  await browser.close();



  console.log('  NOTE: ' + (watchPolicy.n || 0) + ' page(s) opened by this file, every one watched for a refusal under the page\'s own policy');
  if (refused.length) fails.push('the browser refused ' + refused.length + ' thing(s) this page asked for under its own policy (#254) — silent to a player, so a red here: ' + [...new Set(refused)].slice(0, 3).join(' | '));
  if (fails.length) { console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log(`OK — ${stat.quests} quests, maxXP ${stat.maxXP}, all invariants hold.`);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
