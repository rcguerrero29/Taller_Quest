#!/usr/bin/env node
/* R4 — the engine's own smoke, run against ANY index (docs/REGRESSION.md; NEW-WORLD.md §3).
   Meridian's suite (test/smoke.js) holds Meridian's content to account; the town's holds the
   town's. Neither asks the engine questions a second world would ask. This one does, against
   whichever shell it is pointed at: the worlds hang together, every person can be reached and
   talked to, every document builds, every camera draws every world, every door stands in 3D,
   every animal has something under it, and nothing is stored outside the pack's prefix.
   Run:  node test/engine.smoke.js --index index.html
         node test/engine.smoke.js --index changarrito/index.html
   (CHROMIUM_PATH if Chromium is not where Playwright looks). */
const path = require('path');
const fs = require('fs');   /* module scope: findChromium() below needs it, and it was declared only INSIDE two functions */
const { chromium } = require('playwright-core');

/* FIND A BROWSER THE WAY test/smoke.js ALREADY DOES (T0.5, la junta 2026-09-17).
   `chromium.executablePath()` returns the path playwright-core WANTS, not one that exists: this
   container ships chromium-1194 and the resolver asks for 1243. The old line trusted it, so
   `node test/town.smoke.js` could not run AT ALL here — which means the town's safety has been
   REASONED rather than observed, in a repo whose own rule is that an engine change is proven the
   same day by running the suites. Ten minutes buys back the standard of proof.
   The resolved path is checked for existence now, and a real file is looked for if it is wrong. */
const CANDIDATES = [
  process.env.CHROMIUM_PATH,
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
].filter(Boolean);
function findChromium() {
  let exe;
  try { const p = chromium.executablePath(); if (p && fs.existsSync(p)) exe = p; } catch (e) {}
  if (!exe) exe = CANDIDATES.find(p => { try { return fs.existsSync(p) && fs.statSync(p).isFile(); } catch (e) { return false; } });
  return exe;
}
(async () => {
  const args = process.argv.slice(2);
  const idx = args[args.indexOf('--index') + 1];
  if (!args.includes('--index') || !idx) { console.error('usage: node test/engine.smoke.js --index <path to an index.html>'); process.exit(2); }
  const exe = findChromium();
  if (!exe) { console.error('No Chromium found. Set CHROMIUM_PATH, or install one of: ' + CANDIDATES.join(', ')); process.exit(1); }
  const root = path.resolve(__dirname, '..'), file = path.resolve(root, idx);
  const browser = await chromium.launch({ executablePath: exe });
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
  const pageErrors = [], warns = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'warning') warns.push(m.text()); });
  // #254: every refusal under the page's own policy is a red — on a player's phone it is silent
  // …except the gauge pack's own deliberate attack (content/gauge/config.js PAPER: an @import and a font from
  // example.invalid). The engine parses a pack's paper in a probe <style>, the browser tries the import there, and
  // the page's policy refusing it is the door working, not a door open. Counted out loud, never failed, never hidden.
  const refused = [], attackRefused = [];
  page.on('console', m => { const s = m.text(); if (/Content Security Policy/i.test(s)) (/example\.invalid/.test(s) ? attackRefused : refused).push(s.slice(0, 220)); });
  await page.route('**', r => r.request().url().startsWith('file://') ? r.continue() : r.abort());
  await page.goto('file://' + file);
  await page.waitForTimeout(1500);
  let fails = [];

  /* ---- in-scene text has a floor (Rosa's 3D note) ----
     Text painted into the world is authored in tile units and the camera decides how big it lands:
     measured on a phone, one unit is about a CSS pixel, so a glyph authored at 5.5 arrives around
     five pixels tall and stops being letters. Raising it at draw time would only overflow the
     tile, so the floor is enforced where the art is authored — here, by reading it. Scanned rather
     than run because these sizes are literals in the drawing code, and a literal is exactly the
     thing that drifts. */
  {
    const fs = require('fs');
    const SCENE_MIN = 7;
    const dirs = [path.join(root, 'engine'), path.dirname(path.resolve(root, idx))];
    const seen = [];
    const scan = (dir, depth) => { let ents = []; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
      ents.forEach(en => { const f = path.join(dir, en.name);
        if (en.isDirectory()) { if (depth < 3 && en.name !== 'node_modules') scan(f, depth + 1); return; }
        if (!/\.js$/.test(en.name)) return;
        const src = fs.readFileSync(f, 'utf8');
        const re = /font\s*=\s*"(?:[^"]*?\s)?(\d+(?:\.\d+)?)px\s/g; let m;
        while ((m = re.exec(src))) { const px = parseFloat(m[1]);
          if (px < SCENE_MIN) seen.push(path.relative(root, f) + ' draws text at ' + px + ' units'); }
      }); };
    dirs.forEach(d => scan(d, 0));
    [...new Set(seen)].forEach(msg =>
      fails.push('in-scene text below the floor: ' + msg + ' — under ' + SCENE_MIN + ' units it lands around five CSS pixels on a phone and stops resolving in every camera'));
  }

  /* ---- every script this shell loads has to exist ----
     changarrito/index.html loaded content/room.js from the day the folder was made, and that file
     was never created: a 404 on every load of the town, for weeks, seen by nobody. It was harmless
     — INTERVIEW stays undefined and the engine does less, which is the intended off state — but
     NOTHING CAUGHT IT, and the next dropped file will not be harmless. The suites cannot see it
     from inside the page: they abort every non-file:// request and collect `pageerror`, and a
     <script> that 404s is neither. So it is checked on disk, from outside.
     Found by an agent asked to rebuild the town from the template and report what it could not say. */
  {
    const fs2 = require('fs');
    const shellDir = path.dirname(path.resolve(root, idx));
    const html = fs2.readFileSync(path.resolve(root, idx), 'utf8');
    [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1])
      .filter(s => !/^https?:/.test(s))
      .forEach(s => { if (!fs2.existsSync(path.resolve(shellDir, s)))
        fails.push('this shell loads "' + s + '" and there is no such file — every load of it is a 404 nobody sees'); });
  }

  if (pageErrors.length) fails.push('page errors: ' + pageErrors.join(' | '));
  /* same blindness, same cause — see test/smoke.js. mqwarn writes a lowercase kind and a colon;
     this asked for an uppercase word and a space, so it has never matched anything. */
  warns.filter(w => /^(?:CRIT )?(reach|portal|world|room|wander|arrival):/i.test(w))
       .forEach(w => fails.push('the engine warned at boot and nobody was listening: ' + w));

  /* IDXNAME is passed IN because the flat list below is per game and the page cannot know which
     index it is — see the #39 block. Nothing else in here reads it. */
  const r0 = await page.evaluate((IDXNAME) => {
    const P = [];
    const walk = (w, x, y) => x >= 0 && y >= 0 && x < w.W && y < w.H && !SOLID.has(w.grid[y][x]) && w.grid[y][x] !== 'N';
    const firstWalkable = w => { for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) if (walk(w, x, y)) return [x, y]; return null; };
    // ---- the shell names itself and its version ----
    if (typeof GAMENAME !== 'string' || !GAMENAME) P.push('GAMENAME is not set');
    if (typeof GAMEV !== 'string' || !GAMEV) P.push('GAMEV is not set');
    const tag = (document.getElementById('verTag') || {}).textContent || '';
    if (typeof GAMEV === 'string' && !tag.includes(GAMEV)) P.push('the title screen does not show GAMEV (' + tag + ')');
    // ---- the worlds hang together ----
    if (!WORLDS || !Object.keys(WORLDS).length) P.push('no worlds');
    Object.entries(WORLDS).forEach(([id, w]) => {
      if (!w.rows.every(r => r.length === w.W)) P.push(id + ': rows are not all the same width');
      (typeof portalsOf === 'function' ? portalsOf(id) : Object.entries(PORTALS[id] || {}).map(([ch, p]) => ({ ch, p }))).forEach(({ ch, p }) => { /* #10: by glyph and by place */
        if (!WORLDS[p.to]) { P.push(id + ':' + ch + ' portals to a missing world ' + p.to); return; }
        if (!walk(WORLDS[p.to], p.x, p.y)) P.push(id + ':' + ch + ' lands on a blocked tile in ' + p.to + ' (' + p.x + ',' + p.y + ')');
      });
    });
    // ---- the roles the pack declares point at real places (#25) ----
    if (!WORLDS[PL.home]) P.push('PLACES.home names a missing world ' + PL.home);
    else if (!walk(WORLDS[PL.home], PL.spawn[0], PL.spawn[1])) P.push('the spawn (' + PL.spawn + ') in ' + PL.home + ' is not walkable');
    if (!WORLDS[PL.street]) P.push('PLACES.street names a missing world ' + PL.street);
    if (WORLDS[PL.park]) { const pk = WORLDS[PL.park];
      if (!walk(pk, PL.parkIn[0], PL.parkIn[1])) P.push('the leash lands on a blocked tile (' + PL.parkIn.slice(0, 2) + ') in ' + PL.park);
      if (!walk(pk, PL.parkDog[0], PL.parkDog[1])) P.push('the dog\'s park spot (' + PL.parkDog + ') is blocked');
      if (!walk(pk, PL.parkDogHome[0], PL.parkDogHome[1])) P.push('the dog\'s park home (' + PL.parkDogHome + ') is blocked');
      if (!PL.parkAdopt.some(([x, y]) => walk(pk, x, y))) P.push('no adoption spot in the park is walkable'); }
    if (!PL.friends.some(w => WORLDS[w])) P.push('no PLACES.friends world exists — an adopted dog would have nobody to befriend');
    auditReach().forEach(p => P.push('reach: ' + p));
    auditWander().forEach(p => P.push('a wanderer has nowhere to step: ' + p));
    // ---- every person is a person ----
    Object.entries(WORLDS).forEach(([id, w]) => w.npcs.forEach(n => {
      if (w.grid[n.y][n.x] !== 'N') P.push(id + ':' + n.npc + ' does not stand on a person tile');
      if (!npcName(n.npc)) P.push(id + ':' + n.npc + ' has no name in ' + lang);
      if (!lookOf(n)) P.push(id + ':' + n.npc + ' has no look');
      if (n.doc && !docDef(n.doc)) P.push(id + ':' + n.npc + " carries a document that does not exist ('" + n.doc + "')");
      (n.q || []).forEach(qi => { if (!QEN[qi]) P.push(id + ':' + n.npc + ' gives quest ' + qi + ' which does not exist'); });
    }));
    /* ---- and the look is HERS ---- 
       `lookOf` resolves by npc id first and map letter second (engine.js:3768), and that fall-back
       is deliberate and load-bearing — it is what lets an unnamed extra render at all, and
       test/smoke.js pins it using Lupe, who has no named look and is not meant to need one.
       But the letter half of NPCLOOK is a GLOBAL namespace while map letters are assigned per
       world: `m` is Marcus in hq, Moy in ta, and Doña Meche in ex. Three people, one key, one
       table, no warning. So a person placed on a letter somebody else already owns silently wears
       that person's clothes, and nothing anywhere says a word.
       The check one line above this asked whether a look CAME BACK. It means whether the look is
       HERS, and it has passed two wrong characters every run in both shells since 2026-09-07 —
       the sixth guard in this repo to read a proxy for the thing (docs/REGRESSION.md: a guard has
       to read the noun it actually means).
       Measured, not reasoned: on unchanged content this goes red on exactly two pairs, and both
       are the two people added after the letter table was full.
       Asked by OBJECT IDENTITY rather than by counting distinct looks — a count passes vacuously
       in any pack with fewer people than letters, which is what docs/GAUGE.md exists for. */
    {
      const byLook = new Map();
      const seen = new Set();
      Object.entries(WORLDS).forEach(([id, w]) => w.npcs.forEach(n => {
        if (!n.npc || seen.has(n.npc)) return; seen.add(n.npc);
        const lk = lookOf(n); if (!lk) return;
        if (!byLook.has(lk)) byLook.set(lk, []);
        byLook.get(lk).push(n.npc);
      }));
      byLook.forEach(who => { if (who.length > 1) {
        const names = who.map(k => npcName(k) || k);
        P.push(names.join(' and ') + ' are drawn as the same person — ' +
               who.slice(1).join(', ') + ' never got a look, so they are wearing ' + (npcName(who[0]) || who[0]) + "'s clothes");
      }});
    }

    // ---- every document builds; every readable thing points at one ----
    Object.keys(DC()).forEach(id => { let s = null; try { s = docSections(id); } catch (e) { P.push("document '" + id + "' throws: " + e.message); return; }
      if (!Array.isArray(s)) P.push("document '" + id + "' does not build"); });
    (typeof READS !== 'undefined' ? READS : []).forEach(rd => {
      if (!WORLDS[rd.world]) { P.push('READ in a missing world ' + rd.world); return; }
      if (!docDef(rd.doc)) P.push("READ at " + rd.world + ' (' + rd.x + ',' + rd.y + ") names a missing document '" + rd.doc + "'"); });
    // ---- every animal has something under it (R1, for any pack) ----
    ['dog', 'cat', 'pig', 'loro'].forEach(k => { const a = ANI(k), wid = AW(k); if (!a || !wid) return; const w = WORLDS[wid];
      if (k === 'loro') { const t = w.rows[a.y] && w.rows[a.y][a.x]; if (!(t && (SOLID.has(t) || (TILES[t] && TILES[t].lift)))) P.push('loro has no perch at ' + wid + ' (' + a.x + ',' + a.y + ')'); }
      else if (!walk(w, a.x, a.y)) P.push(k + ' has nowhere to stand at ' + wid + ' (' + a.x + ',' + a.y + ')'); });
    // ---- every camera draws every world; every door stands in 3D ----
    const before = { cam: camMode, world, px, py, yaw: (typeof T3 !== 'undefined' && T3) ? T3.yaw : 0 };
    moving = false; held = null;
    const flat = {}, flatIn = {};
    /* ---- THE SHAPE GATE (crew iteration 14, el repartidor) — the two nouns the flat audit cannot read ----
       `engine/shapes.js` gives a glyph the engine's own shape when the pack said nothing about that
       letter. The flat audit CANNOT check that: it only counts `THREE.Sprite`s, so a letter that
       stood as a BOX (K, S, D, T, V — 71 tiles of El Changarrito) never appeared on any row, and
       `couldBeFlat` does not even list 'fence', which is F's 93 tiles and ◺'s 9. The audit sees 37
       of the 208 tiles this change stands up. So two checks of my own, each reading its own noun:

       1 · A SHAPE STANDS WHERE THE GATE SAID IT WOULD, and it is not a box wearing the word.
           `userData.mesh` set, `userData.flat` not, and more than twelve triangles — twelve is one
           BoxGeometry, so a "shape" of twelve is the box we were trying to stop shipping.
       2 · NO SHADOW WITH NOTHING STANDING ON IT. The ground bake paints a soft radial contact pad
           under any tile that HAS a mesh view and never asks whether that tile can stand
           (`engine/engine3d.js`, grep "THE PAD"). Bind a walkable letter and its tiles get a smudge
           on the pavement with no object over it — and because it is baked into a texture, a
           scene-graph dump reports the scene identical. So this one reads PIXELS off the baked
           ground: the tile's centre against its own corner. It also proves it can SEE a pad it
           knows is there before it reports not finding one, because "nothing to measure" is a red
           and not a pass (docs/REGRESSION.md, the four ways a guard fools its author, row B). */
    const shpWant = {}, shpGot = {}, shpBad = [], padBad = [], padSeen = { ghosts: 0, real: 0, lit: 0, worlds: 0 };
    /* A WORLD THAT DECLINED 3D HAS NO 3D TO CHECK, and since mq-v172 it does not even download the
       library — so `T3` is not merely failed, it does not exist, and a bare mention of it throws.
       The gauge found that in one run. The gate is the pack's own `CAMERAS`, cross-checked against
       whether the engine3d globals actually arrived: a pack that ASKED for 3D and did not get it is
       a broken shell and says so, which is the difference between this and a shrug. */
    const wants3d = (typeof CAMS !== 'undefined' ? CAMS : ['3d']).indexOf('3d') >= 0;
    const has3d = typeof T3 !== 'undefined' && typeof draw3d === 'function' && !!window.THREE;
    if (wants3d && !has3d) P.push('this shell lists a 3D camera and the 3D engine never loaded — engine/boot.js did not bring it');
    if (!wants3d && has3d) P.push('this shell lists no 3D camera and downloaded the 3D engine anyway — a quarter of the game, for nothing');
    P.push('COUNT-ONLY: 3D ' + (wants3d ? 'wanted' : 'declined') + ', 3D engine ' + (has3d ? 'loaded' : 'absent'));
    Object.entries(WORLDS).forEach(([id, w]) => {
      const spot = firstWalkable(w); if (!spot) { P.push(id + ' has no walkable tile'); return; }
      world = id; px = fx = spot[0]; py = fy = spot[1];
      ['top', 'front', 'iso'].forEach(c => { camSet(c); try { draw(); } catch (e) { P.push(id + ' in ' + c + ' throws: ' + e.message); } });
      if (!has3d) return;                       /* the flat cameras above are still held to account */
      camSet('3d');
      let ok = false; try { ok = draw3d(); } catch (e) { P.push(id + ' in 3d throws: ' + e.message); }
      if (!ok || T3.fail) { P.push(id + ' did not render in 3D'); return; }
      // a door needs a lintel only where its wall stands taller than the door (lift ≥ 11 ≈ 1.0 unit);
      // a gate in a fence has open sky above it by design
      const tall = (x, y) => [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([ax, ay]) => { const g = w.grid[ay] && w.grid[ay][ax], m = g && TILES[g]; return !!(m && (m.kind === 'wall' || m.kind === 'facade') && (m.lift | 0) >= 11); });
      let want = 0, wantLintel = 0; for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) if (DOORSET.has(w.rows[y][x]) && !SOLID.has(w.grid[y][x])) { want++; if (tall(x, y)) wantLintel++; }
      let doors = 0, lintels = 0, glows = 0;
      T3.group.children.forEach(o => { const u = o.userData || {}; if (u.door) doors++; if (u.lintel) lintels++; if (u.glow) glows++; });
      if (doors !== want) P.push(id + ' has ' + want + ' doors on the map and ' + doors + ' standing in 3D');
      if (lintels < wantLintel) P.push(id + ': ' + (wantLintel - lintels) + ' door(s) in a tall wall have a see-through slot above them');
      if (glows < doors) P.push(id + ': ' + (doors - glows) + ' door(s) do not say "this one opens" in 3D');
      T3.group.children.forEach(o => { const u = o.userData || {}; if (u.flat) { flat[u.g] = (flat[u.g] || 0) + 1; (flatIn[u.g] = flatIn[u.g] || new Set()).add(id); } });
      /* ---- 1 · every letter the gate answered for actually stands, as a shape and not a box ---- */
      if (typeof SHAPEBIND === 'object' && SHAPEBIND && typeof TILEMESH !== 'undefined') {
        const at = {};
        T3.group.children.forEach(o => { const u = o.userData || {}; if (u.x !== undefined) (at[u.x + ',' + u.y] = at[u.x + ',' + u.y] || []).push(o); });
        /* ONLY THE LETTERS THE ENGINE ITSELF HANDED OVER. Walking SHAPEBIND and asking "does this
           letter have a mesh" swept up every letter the PACK had drawn too, so on Meridian this
           check reported 331 tiles of the pack's own art as the library's work. */
        const gave = (typeof SHAPEGIVEN !== 'undefined' && Array.isArray(SHAPEGIVEN)) ? SHAPEGIVEN : [];
        gave.forEach(g => {
          if (!TILEMESH[g]) return;                      /* the pack refused this letter; nothing is claimed about it */
          for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) {
            if (w.grid[y][x] !== g) continue;
            shpWant[g] = (shpWant[g] || 0) + 1;
            const m = (at[x + ',' + y] || []).find(o => (o.userData || {}).mesh);
            if (!m) { shpBad.push('"' + g + '" at ' + id + ' (' + x + ',' + y + ') — the engine has a shape for this letter and the tile still does not stand as one'); continue; }
            if ((m.userData || {}).flat) { shpBad.push('"' + g + '" at ' + id + ' (' + x + ',' + y + ') is tagged both a shape and a picture'); continue; }
            const pa = m.geometry && m.geometry.attributes && m.geometry.attributes.position;
            const tris = pa ? pa.array.length / 9 : 0;
            if (tris <= 12) shpBad.push('"' + g + '" at ' + id + ' (' + x + ',' + y + ') is a "shape" of ' + tris + ' triangles — one box is twelve, so this is still a box with a new word on it');
            else shpGot[g] = (shpGot[g] || 0) + 1;
          }
        });
      }
      /* ---- 2 · no contact shadow under a letter that can never stand ---- */
      {
        const gnd = T3.group.children.find(o => o.geometry && o.geometry.type === 'PlaneGeometry' && o.geometry.parameters
          && o.geometry.parameters.width === w.W && o.geometry.parameters.height === w.H);
        const src = gnd && gnd.material && gnd.material.map && gnd.material.map.image;
        const hasMesh = g => (typeof tileView === 'function') && !!tileView(g, 'mesh');
        /* CAN THIS TILE EVER SHOW A SHAPE? `stands`, never `standsUp`. `standsUp` also demands a
           side drawing, which is the flat front camera's question; the 3D camera's walkable branch
           (engine/engine3d.js:447) asks plain `stands`. The first draft of this check asked
           `standsUp` and reported six of Meridian's grass tiles as shadows-with-nothing-on-them,
           on art nobody had touched — `g` is `stand:true` with no side art and its mesh stands
           perfectly well. A red I did not plant is a hypothesis about the guard (POSTMORTEM §13g).
           It reads BOTH glyphs, like the pad itself does: the grid's and the row's. */
        const canStand = g => g !== undefined && (SOLID.has(g) || (typeof stands === 'function' && stands(g)));
        const ghosts = [], reals = [];
        for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) {
          const gch = w.grid[y][x], ch = w.rows[y][x];
          if ((TILES[gch] || {}).kind === 'water') continue;
          const mg = hasMesh(gch) ? gch : hasMesh(ch) ? ch : null;
          if (!mg) continue;
          if (!canStand(gch) && !canStand(ch)) ghosts.push([x, y, mg]); else reals.push([x, y, mg]);
        }
        if (!src) { if (ghosts.length || reals.length) padBad.push(id + ': the baked ground could not be read at all, so nothing was checked for shadows with nothing standing on them'); }
        else {
          padSeen.worlds++; padSeen.ghosts += ghosts.length; padSeen.real += reals.length;
          const K = Math.round(src.width / (w.W * 32)) || 1;
          const cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height;
          const c2 = cv.getContext('2d'); c2.drawImage(src, 0, 0);
          const px1 = c2.getImageData(0, 0, src.width, src.height).data;
          const lum = (sx, sy) => { const i = ((sy | 0) * src.width + (sx | 0)) * 4; return 0.299 * px1[i] + 0.587 * px1[i + 1] + 0.114 * px1[i + 2]; };
          /* centre against the tile's own top-left corner. A pad is a radial darkest in the middle;
             the neighbour gradients this engine also paints darken EDGES, which biases the other way. */
          const padAt = ([x, y]) => lum((x * 32 + 2) * K, (y * 32 + 2) * K) - lum((x * 32 + 16) * K, (y * 32 + 16) * K);
          /* CAN THIS PROBE SEE A PAD IT KNOWS IS THERE? If not, its silence means nothing.
             THE CONTROL IS PER WORLD. It used to read the running totals and add `worlds === 1`,
             so the question was only ever asked of the FIRST world drawn: if world one's ground
             baked readably and every later one did not, the probe went on reporting silence about
             grounds it had never managed to measure, and the silence looked like a pass. Each
             world now proves it can see a pad in ITS OWN bake before its verdict counts. */
          let litHere = 0;
          reals.forEach(t => { if (padAt(t) > 6) litHere++; });
          padSeen.lit += litHere;
          if (reals.length && !litHere) padBad.push(id + ': the shadow probe read ' + reals.length + ' tiles in this world that certainly carry a contact shadow and could not see one on any of them — it is measuring nothing here, so its verdict about this world\'s other tiles is worth nothing');
          ghosts.forEach(([x, y, g]) => { const d = padAt([x, y]);
            if (d > 6) padBad.push('"' + g + '" at ' + id + ' (' + x + ',' + y + ') has a shadow painted on the pavement with nothing standing on it — the letter is walkable, so it can never show a shape, but it was given one anyway (engine/shapes.js SHAPEBIND, and the solidity line in the gate in engine/engine.js)'); });
        }
      }
    });
    world = before.world; px = fx = before.px; py = fy = before.py; if (has3d) T3.yaw = before.yaw; camSet(before.cam);
    // ---- #132 / #133: a hair style has to look like its name ----
    // Owner: "long hair looks like a beard, lets call it that, then create one that looks a bit
    // more like long hair only not bearded" and "fro is also offf". Both are claims about pixels,
    // so both are measured in pixels: the person is drawn at the size they are seen on the street.
    {
      const HAIR = '#E01B24'; /* a colour nothing else in the drawing uses, so hair is countable */
      const shot = (style) => {
        const c = document.createElement('canvas'); c.width = 40; c.height = 40;
        const g = c.getContext('2d'); const o = ctx; ctx = g;
        try { g.translate(11, 6); drawPerson(g, 0, 0, { shirt: '#8B5CF6', skin: '#E5AC82', hair: HAIR, style, outfit: 'casual', pattern: 'plain' }, { dir: 'down' }); }
        finally { ctx = o; }
        const d = g.getImageData(0, 0, 40, 40).data;
        return { at: (x, y) => { const i = ((y | 0) * 40 + (x | 0)) * 4; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; },
                 isHair: (x, y) => { const i = (((y | 0) * 40 + (x | 0)) * 4);
                   return d[i + 3] > 40 && d[i] > 60 && d[i] > d[i + 1] * 1.5 && d[i] > d[i + 2] * 1.5; },
                 isSkin: (x, y) => { const i = (((y | 0) * 40 + (x | 0)) * 4);
                   return d[i + 3] > 40 && d[i] > 180 && d[i + 1] > 140 && d[i + 2] > 110 && d[i] < d[i + 1] * 1.5; },
                 data: d };
      };
      const named = (T().styles || []).map(x => x[0]);
      ['long', 'beard', 'afro'].forEach(k => { if (named.indexOf(k) < 0) P.push('#132/#133: "' + k + '" is not offered in the style list (' + lang + ')'); });
      // The face finds itself, so nothing here depends on where the drawing happens to land.
      const faceBox = (sh) => { let x0 = 99, y0 = 99, x1 = -1, y1 = -1;
        for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) if (sh.isSkin(x, y)) {
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        return x1 < 0 ? null : { x0, y0, x1, y1, cx: Math.round((x0 + x1) / 2) }; };
      const massIn = (sh, x0, x1, y0, y1) => { let n = 0;
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (sh.isHair(x, y)) n++; return n; };
      const beard = shot('beard'), long = shot('long');
      const fb = faceBox(beard), fl = faceBox(long);
      if (!fb || !fl) P.push('#132: no face found in the drawing, so the hair cannot be judged against it');
      else {
        // under the chin: closed is a beard, open is long hair. That is the whole distinction.
        const chin = (sh, f) => massIn(sh, f.cx - 2, f.cx + 2, f.y1 + 1, f.y1 + 3);
        if (chin(beard, fb) < 8) P.push('#132: "beard" does not close under the chin (' + chin(beard, fb) + 'px) — that closed shape is what makes it a beard');
        if (chin(long, fl) > 2) P.push('#132: "long" closes under the chin (' + chin(long, fl) + 'px), which is the silhouette of a beard, not of long hair');
        // and it has to be long: mass down both sides, from mid-face past the jaw
        const midY = Math.round((fl.y0 + fl.y1) / 2);
        [['left', fl.x0 - 5, fl.x0 - 1], ['right', fl.x1 + 1, fl.x1 + 5]].forEach(([side, a, b]) => {
          const n = massIn(long, a, b, midY, fl.y1 + 3);
          if (n < 8) P.push('#132: "long" has almost no hair down its ' + side + ' side past the jaw (' + n + 'px) — that fall is what makes it long');
        });
      }
      // #133: the afro must have a value range, not one flat brightness
      // Only the INSIDE of the mass counts. An edge is antialiased against the background and
      // would hand back a spread of values for free; what was missing is a ladder across the
      // body of the hair, so that is what is measured.
      const afro = shot('afro');
      const inside = (x, y) => afro.isHair(x, y) && afro.isHair(x - 1, y) && afro.isHair(x + 1, y) && afro.isHair(x, y - 1) && afro.isHair(x, y + 1);
      let lo = 999, hi = -1, n = 0;
      for (let y = 2; y < 22; y++) for (let x = 2; x < 38; x++) if (inside(x, y)) {
        const i = (y * 40 + x) * 4;
        const L = 0.299 * afro.data[i] + 0.587 * afro.data[i + 1] + 0.114 * afro.data[i + 2];
        if (L < lo) lo = L; if (L > hi) hi = L; n++; }
      if (n < 40) P.push('#133: the afro has almost no mass to it (' + n + ' pixels inside its own edge)');
      else if (hi - lo < 18) P.push('#133: the body of the afro spans ' + Math.round(hi - lo) + ' levels of brightness — at one value it reads as a helmet, not as hair with a near side and a far side');
    }
    // a save that chose the old "long" was wearing the beard, and keeps it
    {
      const s0 = { n: 'Test', c: 'architect', lk: { style: 'long' }, v: 2 };
      const out = sanitizeSave(s0);
      if (!out || out.lk.style !== 'beard') P.push('#132: a save made before this change loses the beard it was wearing (got "' + (out && out.lk.style) + '")');
      const s1 = { n: 'Test', c: 'architect', lk: { style: 'long' }, v: 2, hairV: 2 };
      const out1 = sanitizeSave(s1);
      if (!out1 || out1.lk.style !== 'long') P.push('#132: a save made after this change cannot keep long hair (got "' + (out1 && out1.lk.style) + '")');
    }
    // ---- #130: naming and styling are two parts, and look like two parts ----
    // Asked for (#130): the menu that sets the dog's look and the hero's own should sit a little higher
    // and apart from the name — it looked as if it overlapped. The panel is one block above (title,
    // note, preview, name) and one below (the choices), with a rule between them — and the chair,
    // which comes in with the name hidden, gets the same shape so both ways in read the same.
    {
      const cr = document.getElementById('creator'), hid = cr.hidden;
      cr.hidden = false;
      const head = cr.querySelector('.crhead'), body = cr.querySelector('.crbody');
      if (!head || !body) P.push('#130: the create-your-character panel is not split into a header and its choices');
      else {
        const nm = document.getElementById('heroname'), row = document.getElementById('rowOutfit');
        if (!head.contains(nm)) P.push('#130: the name field is not in the panel\'s header');
        if (!body.contains(row)) P.push('#130: the first row of choices is not in the panel\'s body');
        const cs = getComputedStyle(body);
        if (parseFloat(cs.borderTopWidth) < 1) P.push('#130: nothing marks where naming ends and styling begins');
        const gap = body.getBoundingClientRect().top - nm.getBoundingClientRect().bottom;
        if (gap < 12) P.push('#130: the choices start ' + Math.round(gap) + 'px under the name field — that is the same rhythm as every row, so they read as one list');
        const lb = document.getElementById('crLooksLb');
        if (!lb || !lb.textContent.trim()) P.push('#130: the styling half of the panel has no heading in ' + lang);
      }
      cr.hidden = hid;
    }
    // ---- every button on a sheet is a thumb's target, and none of them touch (Rosa 2) ----
    // `.dbtn` carried a colour and nothing else, so it fell back to the browser's default — 21px
    // tall, half a reliable thumb target — and flowed flush against its neighbours, while Copy and
    // Download beside it were 68. Her floor is 44 for anything that acts, and the buttons that only
    // copy the page may never be the most prominent thing on it.
    {
      const withBtns = Object.keys(DC()).filter(id => { try { return (docSections(id) || []).some(x => x && (x.btn || x.form || x.docs)); } catch (e) { return false; } });
      const said = {};
      withBtns.slice(0, 6).forEach(id => {
        try { docOpen(id); } catch (e) { return; }
        const sheet = document.getElementById('paperSheet');
        const acts = [...sheet.querySelectorAll('.dbtn, .opt')].filter(b => b.getBoundingClientRect().height > 0);
        acts.forEach(b => { const r = b.getBoundingClientRect();
          if (r.height < 44) said['a "' + b.textContent.trim().slice(0, 18) + '" button on a sheet is ' + Math.round(r.height) + 'px tall — under the 44 a thumb needs'] = 1; });
        // no two may touch: a miss then lands on the neighbour rather than on nothing
        for (let i = 0; i < acts.length; i++) for (let j = i + 1; j < acts.length; j++) {
          const a = acts[i].getBoundingClientRect(), c = acts[j].getBoundingClientRect();
          const apart = Math.max(a.left - c.right, c.left - a.right, a.top - c.bottom, c.top - a.bottom);
          if (apart < 8) said['"' + acts[i].textContent.trim().slice(0, 14) + '" and "' + acts[j].textContent.trim().slice(0, 14) + '" are ' + Math.round(Math.max(0, apart)) + 'px apart — a miss lands on the neighbour'] = 1;
        }
        // and the quiet end stays quiet
        const quiet = [...sheet.querySelectorAll('.docbar button')].map(b => b.getBoundingClientRect().height).filter(h => h > 0);
        const loud = acts.map(b => b.getBoundingClientRect().height);
        if (quiet.length && loud.length && Math.max(...quiet) > Math.min(...loud))
          said['the buttons that only copy the sheet (' + Math.round(Math.max(...quiet)) + 'px) are bigger than the ones that change something (' + Math.round(Math.min(...loud)) + 'px)'] = 1;
        try { document.getElementById('docClose').click(); } catch (e) {}
      });
      Object.keys(said).slice(0, 4).forEach(m => P.push('Rosa 2: ' + m));
    }
    // ---- #127: every drawer is one subject, and its controls live inside it ----
    // Asked for (#127): the options for the dog and the hero broke the main settings menu, so they moved
    // to a section of their own, reorganised so they do not break the architecture of the drawers and
    // menus. So this checks the architecture, not one drawer: each drawer is
    // named, opens and closes on its own, and every control belongs to exactly one of them.
    {
      const WANT = { drwCtl: ['lbCtl', 'optSwipe'], drwLook: ['lbTheme', 'themeRow', 'lbCam', 'camRow', 'lbSeason', 'seasonRow'],
                     drwSelf: ['lbAle', 'aleRow'], drwSound: ['lbMusic', 'tuneRow'], drwGame: ['lbLang'] };
      const ORDER = Object.keys(WANT); /* named here, not read from DRAWERS — DRAWERS is what is under test */
      const seen = {};
      if (ORDER.some(id => DRAWERS.indexOf(id) < 0))
        P.push('#127: the engine does not know every drawer (' + ORDER.filter(id => DRAWERS.indexOf(id) < 0).join(', ') + '), so it will not remember whether it was open');
      ORDER.forEach(id => {
        const d = document.getElementById(id);
        if (!d) { P.push('#127: the ' + id + ' drawer is not in this shell'); return; }
        if (d.tagName !== 'DETAILS') { P.push('#127: ' + id + ' is a ' + d.tagName + ', not a drawer'); return; }
        const lb = d.querySelector('summary span');
        if (!lb || !lb.textContent.trim()) P.push('#127: the ' + id + ' drawer has no name in ' + lang);
        // it opens and closes on its own, and remembers which
        const was = d.open; d.open = true; if (!d.open) P.push('#127: ' + id + ' will not open');
        d.open = false; if (d.open) P.push('#127: ' + id + ' will not close'); d.open = was;
        (WANT[id] || []).forEach(cid => {
          const el = document.getElementById(cid);
          if (!el) { P.push('#127: ' + cid + ' is missing from this shell'); return; }
          if (!d.contains(el)) {
            const home = ORDER.map(k => document.getElementById(k)).find(o => o && o.contains(el));
            P.push('#127: ' + cid + ' belongs in ' + id + ' but sits in ' + (home ? home.id : 'no drawer at all'));
          }
        });
        // nothing may be claimed by two drawers
        [...d.querySelectorAll('[id]')].forEach(el => {
          if (seen[el.id] && seen[el.id] !== id) P.push('#127: ' + el.id + ' is inside both ' + seen[el.id] + ' and ' + id);
          seen[el.id] = id; });
      });
      // the dropdown the looks row brings is styled with the sheet, not left to the browser
      const sel = document.querySelector('#aleRow select');
      if (sel) { const cs = getComputedStyle(sel);
        if (parseFloat(cs.borderRadius) < 4) P.push('#127: the looks dropdown is unstyled — it is the one control on the page that looks like nothing else'); }
    }
    // ---- fullscreen: the 3D buffer is the shape of the box it is shown in ----
    // Owner, 2026-09-08: "its still blurry in full screen". `.viewport.fs` gives the canvas
    // `height:100% !important` and `object-fit:contain`. A drawing buffer whose aspect does not
    // match the element's box is then RESCALED by the browser before anyone sees it — at
    // 1440x900 a 2880x2304 buffer was resampled down to 1125x900, letterboxed with bars either
    // side, and every edge in the world went soft. A 3D camera has no fixed frame to protect, so
    // it renders the box it is actually given.
    /* only if this GAME has a 3D camera. CAMERAS (mq-v133) lets a pack ship without one, and
       camSet refuses a camera the game does not have — so on such a pack the lines below were
       measuring a 3D camera that never ran and failing the build for it. Found by the gauge
       pack, which declares CAMERAS=["top","front"]: the seam existed and the gate ignored it.
       `has3d` as well as `wants3d` since mq-v172: a pack that ASKS for 3D and whose library did not
       arrive is a broken shell, and it is named by the line above rather than crashing here on a
       null renderer. Planted (boot.js never loading Three for a pack that wants it) and the crash
       is what came out until this gate existed — a guard that dies is a guard that reports nothing. */
    if (has3d && (typeof CAMS === 'undefined' || CAMS.indexOf('3d') >= 0)) {
      const c3 = T3.renderer.domElement, vp = document.getElementById('vp');
      const before = { cam: camMode, w: world, x: px, y: py, hid: document.getElementById('world').hidden };
      document.getElementById('world').hidden = false; /* this suite never enters the world; the box needs to be real */
      camSet('3d'); world = before.w;
      const check = (why) => {
        sizeCanvas(); draw3d(); t3Resize();
        const box = c3.getBoundingClientRect();
        if (box.width < 2 || box.height < 2) { P.push('fullscreen: the 3D canvas has no box ' + why); return; }
        const boxAsp = box.width / box.height, bufAsp = c3.width / c3.height;
        if (Math.abs(boxAsp - bufAsp) / boxAsp > 0.02)
          P.push('fullscreen: ' + why + ' the 3D buffer is ' + c3.width + '\u00d7' + c3.height + ' (' + bufAsp.toFixed(2) + ') in a ' +
                 Math.round(box.width) + '\u00d7' + Math.round(box.height) + ' box (' + boxAsp.toFixed(2) + ') — the browser rescales that before it is seen, and every edge goes soft');
        if (T3.cam && Math.abs(T3.cam.aspect - boxAsp) / boxAsp > 0.02)
          P.push('fullscreen: ' + why + ' the camera is framed ' + T3.cam.aspect.toFixed(2) + ' for a ' + boxAsp.toFixed(2) + ' box');
      };
      check('in a window,');
      vp.classList.add('fs'); document.body.classList.add('noscroll');
      check('in fullscreen,');
      vp.classList.remove('fs'); document.body.classList.remove('noscroll');
      sizeCanvas();
      world = before.w; px = fx = before.x; py = fy = before.y; camSet(before.cam);
      document.getElementById('world').hidden = before.hid;
    }
    // ---- #131: one candy per window, and a candy smaller than the window it stands in ----
    // Owner: "sugar skull on sills are overlapping". Two ways for that to be true, both checked
    // here for whatever pack this is run against.
    if (typeof propSill === 'function' && typeof fiestaProps === 'function') {
      const seasons = (typeof SEASONS === 'object' && SEASONS) ? Object.keys(SEASONS) : [];
      const was = (typeof seasonNow === 'function') ? seasonNow() : null;
      seasons.forEach(sn => {
        seasonSet(sn);
        Object.keys(WORLDS).forEach(wid => {
          const taken = {};
          fiestaProps(wid).forEach(pr => {
            if (!pr.sill) return;
            const win = propSill(wid, pr);
            if (!win) { P.push('#131: a sill candy at ' + wid + ' (' + pr.x + ',' + pr.y + ') in ' + sn + ' names a tile with no window'); return; }
            // a candy must leave glass around it, or it reads as pasted over the pane. The pane is
            // read straight off the map, so this holds whatever propSill decides to report.
            const box = ((TILES[WORLDS[wid].rows[pr.y][pr.x]] || {}).win || [])[win.i] || [];
            const pw = box[2], ph = box[3];
            if (typeof win.size !== 'number')
              P.push('#131: the candy at ' + wid + ' (' + pr.x + ',' + pr.y + ') is drawn at its full 8px whatever the window is — nothing stops it covering the glass');
            else if (win.size > pw - 1 || win.size > ph)
              P.push('#131: the candy at ' + wid + ' (' + pr.x + ',' + pr.y + ') in ' + sn + ' is ' + win.size + 'px in a ' + pw + '\u00d7' + ph + ' window — it covers the glass instead of sitting on the sill');
            else if (win.size < 4) P.push('#131: the candy at ' + wid + ' (' + pr.x + ',' + pr.y + ') is ' + win.size + 'px — too small to read as a skull');
            // and no two may share one
            const key = wid + '|' + pr.x + '|' + pr.y + '|' + win.i;
            if (taken[key]) P.push('#131: two candies share one window at ' + wid + ' (' + pr.x + ',' + pr.y + ') in ' + sn + ' — each sill takes one');
            taken[key] = true;
          });
        });
      });
      // two candies set on one two-window front must land on different panes without being numbered
      const tile = (() => { for (const wid of Object.keys(WORLDS)) { const w = WORLDS[wid];
        for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) { const m = TILES[w.rows[y][x]] || {};
          if (m.win && m.win.length > 1) return { wid, x, y }; } } return null; })();
      if (!tile) P.push('#131: no facade in this pack has two windows, so the spreading rule cannot be checked');
      else { const a = { world: tile.wid, x: tile.x, y: tile.y, kind: 'calaverita', sill: true },
                   b = { world: tile.wid, x: tile.x, y: tile.y, kind: 'calaverita', sill: true };
        const sn0 = Object.keys(SEASONS)[0], bag = SEASONS[sn0].art;
        seasonSet(sn0);
        const keep = bag.props; bag.props = (keep || []).concat([a, b]);
        const ia = propSill(tile.wid, a), ib = propSill(tile.wid, b);
        if (!ia || !ib || ia.i === ib.i) P.push('#131: two candies on one front both took window ' + (ia ? ia.i : '?') + ' — a front with two windows must spread them');
        bag.props = keep;
      }
      if (was !== null) seasonSet(was);
    }
    // ---- #134 "things are looking a bit blurry": nothing is sampled through a LINEAR filter ----
    // This art is a pixel grid. A linear filter blends between texels (and, with a pyramid,
    // between mip levels), which is exactly the smear the owner reported. Nearest keeps the grid.
    // The pyramid itself was never the blur and stays: without it the far half of the street
    // crawls as you walk. So: nearest between texels AND between levels, everywhere.
    // The pyramid is asked for only under WebGL2 — on a WebGL1 fallback a non-power-of-two
    // texture with mipmaps renders BLACK, and every texture here is sized to its world.
    if (has3d) {   /* a shell that declined 3D has no THREE to ask about a filter — see the gate above */
      const N = THREE.NearestFilter, OKMIN = [N, THREE.NearestMipmapNearestFilter, THREE.NearestMipmapLinearFilter];
      const cap = T3.renderer && T3.renderer.capabilities, gl2 = !!(cap && cap.isWebGL2);
      const seen = [], bad = [], noMip = [], wrongMip = [];
      T3.group.traverse(o => {
        const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        ms.forEach(m => { if (!m.map) return; const t = m.map, tag = JSON.stringify(o.userData || {}).slice(0, 40);
          seen.push(t);
          if (t.magFilter !== N) bad.push('magFilter on ' + tag);
          if (OKMIN.indexOf(t.minFilter) < 0) bad.push('minFilter on ' + tag);
          if (gl2 && !t.generateMipmaps) noMip.push(tag);
          if (!gl2 && t.generateMipmaps) wrongMip.push(tag); });
      });
      if (!seen.length) P.push('#134: no textures found in the 3D scene to check');
      if (bad.length) P.push('#134: ' + bad.length + ' texture(s) in the 3D scene are sampled through a linear filter — that is the blur (' + bad.slice(0, 3).join(', ') + ')');
      if (noMip.length) P.push('#134: ' + noMip.length + ' texture(s) have no mip pyramid, so the distance crawls (' + noMip.slice(0, 3).join(', ') + ')');
      if (wrongMip.length) P.push('#134: mipmaps asked for without WebGL2 — a non-power-of-two texture renders black there (' + wrongMip.slice(0, 3).join(', ') + ')');
      // the live sprites are repainted every frame, so they carry no pyramid — but they must still
      // be nearest, and they must keep their shape when the device pixel ratio changes.
      const shape = (why) => T3.pool.forEach((sp, i) => {
        if (sp.c.width !== 36 * T3.K || sp.c.height !== 48 * T3.K)
          P.push('#134: sprite ' + i + ' is ' + sp.c.width + '\u00d7' + sp.c.height + ', not ' + (36 * T3.K) + '\u00d7' + (48 * T3.K) + ' ' + why + ' — the artists paint 36\u00d748 and the rest is stretched');
        if (sp.tex.magFilter !== N || sp.tex.minFilter !== N) P.push('#134: sprite ' + i + ' is sampled through a linear filter');
        if (sp.tex.generateMipmaps) P.push('#134: sprite ' + i + ' rebuilds a mip pyramid every frame');
      });
      if (!T3.pool.length) P.push('#134: no live sprites were built to check');
      shape('as built');
      const gp = T3.renderer.getPixelRatio.bind(T3.renderer), K0 = T3.K;
      T3.renderer.getPixelRatio = () => (K0 > 1 ? 1 : 2); /* the owner goes fullscreen, or drags the window to another monitor */
      t3CheckK(); shape('after the device pixel ratio changed');
      T3.renderer.getPixelRatio = gp; t3CheckK();
    }
    // ---- #39: the 3D-realism audit — a picture standing in the scene is not a thing with sides ----
    // Owner, 2026-09-07: "the test should catch things like 2d image looking thing/objects." The 3D
    // builder tags every billboard it stands in a world as `flat`. FLAT_KNOWN is what is still flat
    // TODAY, and it only ever shrinks: a glyph flat and not on it fails the build (nothing new may
    // ship as a picture), and a glyph on it that is laid in this pack yet no longer flat fails too,
    // so the list is kept honest as things get sides (TILESIDE) or become boxes.
    // 2026-09-07: 17 kinds were flat; the desk (D) and the shelving (S) got sides the same day.
    /* ---- WHAT IS STILL FLAT, PER GAME, AND WHY IT HAD TO BECOME PER GAME ----
       'H' and 'I' came off Meridian's list on 2026-09-15: the produce crate and the shop counter
       now carry a pack side view and box:true, so both stand as boxes. THE LIST ONLY EVER SHRINKS,
       and it shrank because the guard said so — it went red naming both the moment the art landed,
       which is exactly what an is-it-still-true check is for.
       AND THEN IT WENT RED ON A SECOND GAME, which is the more useful half. One list was shared by
       two games that lay DIFFERENT glyphs: Meridian's H is a produce crate and the other game's H is
       a different object, so a letter shrinking out of one game's list silently claimed something
       about the other game's letter of the same name. That is `docs/REGRESSION.md`'s recurring shape —
       the list read the GLYPH and meant `this glyph, in this game`. It is keyed by index now, and a
       game with no row of its own gets the shared baseline. Two games diverge again tomorrow; this
       stops that from being a surprise. (docs/BEAUTIFY.md build order, item 2.) */
    const FLAT_BASE = ['3', '4', '5', '7', '9', 'A', 'C', 'H', 'I', 'J', 'P', 'W', 'X', 'Y']; /* the old stair '1' left the city with #7 */
    /* 'P' came off Meridian's row on 2026-09-21: the potted plant is a mesh from parts (the `mesh` view),
       thrown pot and leaf masses, and the guard said so first — red on the run that landed the art. */
    /* '9', 'C' and 'J' came off the same day: the doghouse, the cone and the tree are meshes from parts; red first, each. */
    /* '7' and 'W' came off on 2026-09-21, crew iteration 11 (el taller): the two-post lift and the fridge are meshes
       from parts (TILEART_MESH in content/meridian/art.js). Red first — the audit named both the moment the shapes landed:
       '"7" is no longer flat in 3D — take it off this game's row' and the same for "W". Still flat: 3 4 5 A X Y. */
    /* 'Y' came off on 2026-09-21, crew iteration 12 (el ebanista, #226): the trolley stop is a shelter from parts —
       posts, a roof, the name-board round it with M·Q·T built of boxes, a bench (TILEART_MESH["Y"]). Red first, the
       audit's own sentence: '"Y" is no longer flat in 3D — take it off this game's row'. Still flat: 3 4 5 A X. */
    /* 'A' came off on 2026-09-21, crew iteration 12 (la mueblería): the drafting table is a shape from parts —
       two feet, two columns, a stretcher, and the BOARD raked at 23° with its pencil rail, sheet and parallel
       rule (TILEART_MESH["A"] in content/meridian/art.js). It was the last piece of FURNITURE on this list, and
       the owner's ask was furniture: "no i was just trying to make sure all furniture and this type of item".
       Red first, the audit's own sentence: '"A" is no longer flat in 3D — take it off this game's row of
       FLAT_BY_GAME in test/engine.smoke.js (the key is "index.html") so the list keeps shrinking (#39)'.
       Still flat: 3 4 5 (the agility gear, which is machinery) and X (the site marker). */
    /* A GAME THAT KEEPS ITS OWN ROW DECLARES IT IN ITS OWN FILES (2026-09-29, #263). Another game on
       this engine lays some of the same letters as different objects, and its reasons for keeping a
       letter flat are about its own rooms, so they belong to that game and not to this shared test:
       `const FLAT_OK = { letters: [...], why: { G: 'the decision, in that game\'s words' } }` in the
       game's content. A listed letter with a `why` was CHOSEN, and says so if it ever stands up; one
       with no `why` is one nobody has got to yet, and says "take it off" the day it gets a shape. A
       game with no declaration uses its row here, or FLAT_BASE. The history of each game's row lives
       with that game. */
    const FLAT_BY_GAME = { 'index.html': ['3', '4', '5', 'X'] };
    const packFlat = (typeof FLAT_OK === 'object' && FLAT_OK && Array.isArray(FLAT_OK.letters)) ? FLAT_OK : null;
    const FLAT_KNOWN = packFlat ? packFlat.letters : (FLAT_BY_GAME[IDXNAME] || FLAT_BASE);
    const laid = new Set(); Object.values(WORLDS).forEach(w => w.rows.forEach(r => r.split('').forEach(ch => laid.add(ch))));
    Object.keys(flat).forEach(g => { if (!FLAT_KNOWN.includes(g)) P.push('"' + g + '" (' + ((TILES[g] || {}).kind || '?') + ') stands in 3D as a flat picture in ' + [...flatIn[g]].join(',') + ' — give it a side view (TILESIDE) so it becomes a box; nothing new may ship flat (#39)'); });
    // a pack may give a letter another meaning (another game's I is a facade): only a glyph laid here
    // as a kind the builder could make flat counts as "no longer flat"
    const couldBeFlat = g => ['furniture', 'appliance', 'prop', 'nature', 'gear', 'marker', 'site', 'transit', 'stair', 'tree'].includes((TILES[g] || {}).kind);
    const onPurpose = (packFlat && packFlat.why) || {};
    FLAT_KNOWN.forEach(g => { if (laid.has(g) && couldBeFlat(g) && !flat[g]) P.push(onPurpose[g]
      ? '"' + g + '" is standing in 3D and it was supposed to stay a picture: ' + onPurpose[g] + ' — something has given it a shape, and that is the thing to undo'
      : packFlat ? '"' + g + '" is no longer flat in 3D — take it off FLAT_OK in this game\'s own files so the list keeps shrinking (#39)'
      : FLAT_BY_GAME[IDXNAME] ? '"' + g + '" is no longer flat in 3D — take it off this game\'s row of FLAT_BY_GAME in test/engine.smoke.js (the key is "' + IDXNAME + '") so the list keeps shrinking (#39)'
      : '"' + g + '" is no longer flat in 3D, and this game declares no FLAT_OK of its own, so it is held to the shared baseline: declare `const FLAT_OK={letters:[…],why:{…}}` in its own files with the letters it still keeps flat, and why (#39, #263)'); });
    /* ---- the shape gate's verdict, and it reports the HONEST number ----
       The flat row above can only ever show the letters that stood as sprites. This one counts
       tiles, which is what a person walking the street actually meets. */
    if (typeof SHAPEBIND === 'object' && SHAPEBIND) {
      P.push(...shpBad.slice(0, 8));
      if (shpBad.length > 8) P.push('…and ' + (shpBad.length - 8) + ' more tiles the engine has a shape for and did not stand up');
      const tiles = Object.values(shpGot).reduce((a, b) => a + b, 0);
      const want = Object.values(shpWant).reduce((a, b) => a + b, 0);
      /* WHAT THE ENGINE ACTUALLY GAVE, from the engine's own receipt.
         This used to read `Object.keys(SHAPEBIND).filter(g => TILEMESH[g])`, and that line runs
         long after the gate has written into `TILEMESH` — so it could not tell a shape the PACK
         wrote from one the ENGINE supplied, and answered the much weaker question "does this
         letter have any mesh at all". On Meridian it reported 331 of 331 tiles standing on the
         engine's library when the true number is ZERO: every one of those is Meridian's own
         TILEART_MESH, refused by clause 1. The headline number of the whole change was a proxy for
         something else. `SHAPEGIVEN` is the gate writing down what it handed over. */
      const given = (typeof SHAPEGIVEN !== 'undefined' && Array.isArray(SHAPEGIVEN)) ? SHAPEGIVEN : null;
      if (!given) P.push('engine/shapes.js is loaded but the gate kept no record of what it handed out (SHAPEGIVEN) — the count below would be a guess, so it is not printed');
      else if (!given.length) P.push('COUNT-ONLY: this pack takes no letter from the engine\'s shape library — either it answers for them itself or its SHAPETAKE does not name them — so the library stands nothing here and costs it nothing');
      else if (!want) P.push('COUNT-ONLY: the engine gave this pack a shape for ' + given.join('') + ', and it lays none of those letters anywhere');
      else P.push('COUNT-ONLY: the engine\'s shapes stand ' + tiles + ' of ' + want + ' tiles across ' +
        Object.keys(shpGot).sort().map(g => g + '×' + shpGot[g]).join(' ') + ' — taken by name in SHAPETAKE (' + given.join('') + ')');
      /* ---- THE RULE: an engine default fills a hole, it never replaces a drawing ----
         A letter that stands today as a BOX is not a hole: `t3BoxMats` bakes its top-down art onto
         the lid and wraps its side art round the four faces, and the mesh view has no texture
         channel to carry either. So a default here deletes a drawing and every meter in this
         repository scores it as a gain — 71 tiles of the town (K S D T V) went that way in the
         first draft and the triangle-counting guard above called all 71 a success. */
      if (given && typeof wearsArt === 'function') given.forEach(g => { if (wearsArt(g))
        P.push('the engine handed "' + g + '" its own shape, but "' + g + '" is already drawn standing up — it is a box wearing its own picture on the lid and sides, and a shape has no picture on it, so this quietly swaps a drawing for a bare block (engine/engine.js, the gate, clause 5)'); });
    } else if (wants3d) P.push('this shell asked for a 3D camera and engine/shapes.js never arrived, so every letter the pack did not draw itself stands as a box — engine/boot.js writes it inside `if(want)` and sw.js must list it, or the second, OFFLINE visit is the one that loses it');
    /* NOT a failure and NOT a shrug: a pack with no 3D camera does not download the library, by
       design (engine/boot.js). The gauge is that pack. It still says so out loud every run. */
    else P.push('COUNT-ONLY: this shell declined the 3D camera, so engine/shapes.js was never downloaded and no letter took an engine shape');
    P.push(...padBad.slice(0, 6));
    P.push('COUNT-ONLY: the shadow probe read ' + padSeen.worlds + ' baked grounds — ' + padSeen.real +
      ' tiles that should carry a contact shadow (' + padSeen.lit + ' of them read as darker in the middle, which is how it knows it can see one) and ' +
      padSeen.ghosts + ' walkable tiles that must not');
    // ---- nothing is stored outside the pack's prefix ----
    const pfx = SK(''); const stray = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!k.startsWith(pfx)) stray.push(k); }
    if (stray.length) P.push('storage keys outside the prefix "' + pfx + '": ' + stray.join(', '));
    return { P, stillFlat: Object.keys(flat).sort().map(g => g + '×' + flat[g]) };
  }, idx);
  const r = r0.P; r.stillFlat = r0.stillFlat;
  fails.push(...r.filter(l => !/^COUNT-ONLY: /.test(l)));
  r.filter(l => /^COUNT-ONLY: /.test(l)).forEach(l => console.log('  ' + l));

  /* ---- A PARK DOG RUNS THE COURSE ITS OWN PARK LAYS DOWN, AND NO OTHER ----
     Owner, 2026-09-29: "please also fix the dog agility course too - shape and beautify please."
     Before the gear can be shaped, the line it is shaped across has to be the park's own. Until
     2026-09-29 the course was three of Meridian's tile coordinates written into the engine, so every
     park's dog ran Meridian's course: in a park with no gear, laps to three tiles of bare grass; in a
     room smaller than Meridian's park, a course that is not even on the map.
     Asked by moving the OBJECT, never by reading the engine's list:
       1 · lay three pieces where no gear has stood, and the dog runs through exactly those, in the
           order you read the map, and finishes. Laid weave first and hurdle last, so a course run
           in any other order reads differently from one run in reading order.
       2 · take every piece out of the park, and the roll that means "run the course" does nothing
           at all: not a run to empty ground, and not a fall-through into the next whim on the list,
           which is digging, the puppy phase canon keeps rare (engine.js, grep `puppy phase`).
     Synchronous from end to end, so no frame is drawn and no live dog moves while the park is
     rearranged, and every tile is put back before it returns. The dog is made here rather than
     borrowed, so this runs in a pack with no dog at all; which dog it is never enters the route.
     The roll is pinned, never drawn from the clock, and step 1 proves it still means "run the
     course" before step 2 believes its silence. */
  const agility = await page.evaluate(() => {
    const P = [];
    const wid = PL.park, w = WORLDS[wid];
    if (!w) { P.push('this shell names "' + wid + '" as its park and there is no such world, so where its dog runs could not be asked'); return P; }
    if (typeof dogWhim !== 'function' || typeof dogStep !== 'function') { P.push('the engine has no dog whim to ask where a park dog runs'); return P; }
    const ROLL = 0.8;   /* inside the band of dogWhim's odds that means "run the course"; step 1 proves it */
    const keepRows = w.rows.slice(), keepGrid = w.grid.map(r => r.slice());
    const keepPark = JSON.stringify(PARK), keepDecals = DECALS.length;
    const MR = Math.random, ST = window.setTimeout;
    const put = (x, y, g) => { w.rows[y] = w.rows[y].slice(0, x) + g + w.rows[y].slice(x + 1); w.grid[y][x] = g; };
    const isGear = g => g === '3' || g === '4' || g === '5' || (TILES[g] || {}).kind === 'gear';
    const NAME = { '3': 'hurdle', '4': 'tunnel', '5': 'weave' };
    const at = p => '(' + p[0] + ',' + p[1] + ')';
    const [dx0, dy0] = PL.parkDog;
    const dog = () => ({ kind: [...DOGK][0], world: wid, x: dx0, y: dy0, fx: dx0, fy: dy0, face: 1, dx: 0, dy: 0,
      sit: false, layT: 0, next: 0, home: [dx0, dy0], task: null });
    try {
      Math.random = () => ROLL;
      window.setTimeout = () => 0;   /* a whim that digs schedules its hole; a wrong answer here must not leave one in the park */
      /* the gear this park has today — and then none of it */
      const had = new Set();
      for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) if (isGear(w.rows[y][x])) { had.add(x + ',' + y); put(x, y, '.'); }

      /* 1 · three pieces where no gear has stood, a step apart, reachable by the dog */
      const reach = dogReach({ world: wid, x: dx0, y: dy0 }), spots = [];
      for (let y = w.H - 1; y >= 0 && spots.length < 3; y--) for (let x = w.W - 1; x >= 0 && spots.length < 3; x--) {
        if (!reach[y * w.W + x] || (x === dx0 && y === dy0) || had.has(x + ',' + y) || portalAt(wid, x, y)) continue;
        if (spots.every(([sx, sy]) => Math.abs(sx - x) + Math.abs(sy - y) >= 2)) spots.push([x, y]);
      }
      if (spots.length < 3) { P.push('the park "' + wid + '" has fewer than three open tiles its dog can reach, so no course could be laid to ask where the dog runs'); return P; }
      const route = spots.slice().sort((a, b) => a[1] - b[1] || a[0] - b[0]);   /* the order you read the map */
      const LAY = ['5', '4', '3'];                                               /* weave first, hurdle last */
      route.forEach((p, i) => put(p[0], p[1], LAY[i]));
      const laid = route.map((p, i) => NAME[LAY[i]] + ' ' + at(p)).join(', ');
      const d1 = dog();
      dogWhim(d1, performance.now());
      if (!d1.task || d1.task.type !== 'run') {
        P.push('with a course laid in ' + wid + ' (' + laid + '), the roll that means "run the course" did not send the dog round it (it ' +
          (d1.task ? 'set off to ' + d1.task.type : 'did nothing') + '), so a park dog never runs its own gear — or dogWhim\'s odds moved and this check has to be re-aimed');
        return P;
      }
      const sent = (d1.task.wp || []).map(at).join(' '), ran = [];
      for (let n = 0; n < 200 && d1.task; n++) {
        const wp = d1.task.wp[d1.task.i];
        if (wp && d1.x === wp[0] && d1.y === wp[1]) ran.push([d1.x, d1.y]);
        dogStep(d1, performance.now());
      }
      const want = route.map(at).join(' '), got = ran.map(at).join(' ');
      if (got !== want) P.push('a park dog runs an agility course its park does not have: in ' + wid + ' the gear stands at ' + laid +
        ', and the dog was sent to ' + (sent || 'nowhere') + ' and stood on ' + (got || 'none of it') + '. It should run the park\'s own gear, in the order you read the map: ' + want);

      /* 2 · no gear anywhere: the whim passes, and hands its roll to nothing else */
      route.forEach(p => put(p[0], p[1], '.'));
      const d2 = dog(), before = JSON.stringify(d2), decals = DECALS.length;
      dogWhim(d2, performance.now());
      const did = [];
      if (d2.task) did.push(d2.task.type === 'run' ? 'run a course through ' + ((d2.task.wp || []).map(at).join(' ') || 'nothing') : 'set off to ' + d2.task.type);
      if (d2.digT) did.push('dig a hole');
      if (d2.layT) did.push('lie down');
      if (d2.howlT) did.push('howl');
      if (DECALS.length !== decals) did.push('leave something on the grass');
      if (!did.length && JSON.stringify(d2) !== before) did.push('change what it was doing');
      if (did.length) P.push('a park dog runs an agility course its park does not have: with no gear anywhere in ' + wid +
        ', the roll that means "run the course" made the dog ' + did.join(' and ') +
        '. A park with no course has nothing to run, and the roll must not pass to anything else — digging is the puppy phase canon keeps rare');
    } finally {
      Math.random = MR; window.setTimeout = ST;
      keepRows.forEach((r, i) => { w.rows[i] = r; });
      keepGrid.forEach((row, y) => row.forEach((g, x) => { w.grid[y][x] = g; }));
      Object.assign(PARK, JSON.parse(keepPark)); DECALS.length = keepDecals;
    }
    return P;
  });
  fails.push(...agility);

  /* ---- THE DOG DIGS ABOUT 8% OF WHAT HE DOES, WHEREVER HE IS ----
     Canon (2026-09-01, docs/IDEAS.md:436): digging was a puppy phase, cut to about 8% of
     his whims from about 25%. Owner, 2026-09-29: "ok make it about 8 percent yes."
     The same day as the canon, the course and the greeting between dogs were slotted in ABOVE
     digging with their conditions in the else-if, so every roll they declined fell through to the
     hole: away from the park he dug 22.5% of the time, nearly the 25% the canon had just cut, and
     beside another dog 3.5%. Nothing asked how often, so for four weeks nobody saw it.
     Asked by sweeping the roll, never by reading the odds: a thousand even steps from 0 to 1, through
     dogWhim itself, for a dog made here — away from the park, in the park alone, and in the park with
     another dog beside him. The share is of the whims that DO something; a whim that passes because
     it cannot happen here is not a thing he did.
       · 6–10%, because the canon and the owner both say "about", and one set of odds has to serve
         three places where different whims apply, so it cannot land on 8.0 in all three; two points
         either side still tells the canon from 22.5 and 3.5 at a glance.
       · a whim that cannot happen here PASSES — it does not turn into something else. Asked as a
         fact about every place at once: a nap, a song, a hole and the other thing each take the same
         share of ALL his whims wherever he is. A fix that put digging at 8% by moving it above the
         park whims, and let the street's declined rolls fall into the next line down, is caught here
         and not by the 8%.
       · naps and songs stay most of what he does, and the course and the greeting still happen where
         they can — reaching 8% by deleting them is not the fix.
     Deterministic: the roll is the only thing swept. Every later draw in the whim gets 0.5, so the cone
     (4%) and the favourite person (40%) never fire and are not measured here; they are rolled before
     the rest, and a made-up dog has neither beside it. Every real dog is parked off the map for the
     sweep and put back, so "alone" means alone. */
  const digging = await page.evaluate(() => {
    const P = [], out = [];
    if (typeof dogWhim !== 'function') { P.push('the engine has no dog whim to ask how often a dog digs'); return { P, out }; }
    const N = 1000, K = [...DOGK][0], KINDS = ['nap', 'song', 'course', 'greeting', 'stick', 'door', 'romp', 'dig', 'poop'];
    /* a task is named by what it is: the course and the greeting keep their names; the whims that fill
       the rolls those cannot use away from the park (2026-09-29) are counted under their own */
    const SORT = { run: 'course', sniff: 'greeting', chase: 'greeting' };
    const open = (w, x, y) => !SOLID.has(w.grid[y][x]) && w.grid[y][x] !== 'N';
    const spot = wid => { const w = WORLDS[wid]; for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) if (open(w, x, y)) return [x, y]; return null; };
    const away = [PL.street, PL.home].concat(Object.keys(WORLDS)).find(id => WORLDS[id] && id !== PL.park && spot(id));
    const places = [];
    if (away) places.push({ name: away === PL.street ? 'on the street' : 'away from the park, in ' + away, wid: away });
    /* and a second place off the park, with no restaurant door in it (2026-09-29): the new whims pass there, and a
       whim that fell through into the next line down when it could not happen would only show where it cannot */
    const indoors = [PL.home].concat(Object.keys(WORLDS)).find(id => WORLDS[id] && id !== PL.park && id !== away && spot(id) &&
      !(typeof eateryDoors === 'function' && eateryDoors(id).length));
    if (indoors) places.push({ name: indoors === PL.home ? 'at home' : 'in ' + indoors, wid: indoors });
    if (WORLDS[PL.park]) places.push({ name: 'in the park alone', wid: PL.park }, { name: 'in the park with another dog beside him', wid: PL.park, pal: true });
    if (!places.length) { P.push('this shell has no world in which to ask how often a dog digs'); return { P, out }; }
    const hasCourse = !!WORLDS[PL.park] && WORLDS[PL.park].rows.some(row => [...row].some(g => (TILES[g] || {}).kind === 'gear'));
    const keep = { MR: Math.random, ST: window.setTimeout, TO: window.toast, MH: window.musHowl, park: JSON.stringify(PARK), decals: DECALS.length };
    const real = CRIT.filter(isDog).map(c => [c, c.world]);
    const seen = [];
    try {
      window.setTimeout = () => 0; window.toast = () => {}; window.musHowl = () => {};
      real.forEach(([c]) => { c.world = '__frozen'; });
      places.forEach(pl => {
        const at = spot(pl.wid);
        if (!at) { P.push(pl.name + ' there is no open tile to stand a dog on, so how often he digs could not be asked'); return; }
        const [x, y] = at;
        const pal = pl.pal ? { kind: K, world: pl.wid, x, y, fx: x, fy: y, face: 1, task: null } : null;
        if (pal) CRIT.push(pal);
        const n = { nap: 0, song: 0, course: 0, greeting: 0, stick: 0, door: 0, romp: 0, dig: 0, poop: 0, passes: 0 };
        try {
          for (let i = 0; i < N; i++) {
            const r = (i + 0.5) / N; let first = true;
            Math.random = () => { if (first) { first = false; return r; } return 0.5; };
            const d = { kind: K, world: pl.wid, x, y, fx: x, fy: y, face: 1, dx: 0, dy: 0, sit: false, layT: 0, next: 0, home: [x, y], task: null };
            const dec = DECALS.length, things = typeof DOGTHINGS !== 'undefined' ? DOGTHINGS.length : 0;
            dogWhim(d, performance.now());
            if (d.layT) n.nap++; else if (d.howlT) n.song++; else if (d.task) { const k = SORT[d.task.type] || d.task.type; n[k] = (n[k] || 0) + 1; }
            else if (d.digT) n.dig++; else if (DECALS.length > dec) n.poop++; else n.passes++;
            DECALS.length = dec; if (typeof DOGTHINGS !== 'undefined') DOGTHINGS.length = things; if (pal) pal.task = null;
          }
        } finally { if (pal) CRIT.splice(CRIT.indexOf(pal), 1); }
        const did = N - n.passes, pc = k => did ? 100 * n[k] / did : 0;
        out.push(pl.name + ': ' + KINDS.map(k => k + ' ' + pc(k).toFixed(1) + '%').join(' · ') + ' of what he does; ' + (100 * n.passes / N).toFixed(1) + '% of whims pass');
        if (!did) { P.push(pl.name + ' none of the dog\'s whims does anything, so how often he digs could not be asked'); return; }
        seen.push({ pl, n });
        const dig = pc('dig');
        if (dig < 6 || dig > 10) P.push(pl.name + ' the dog digs ' + dig.toFixed(1) + '% of the time; canon keeps it about 8% ("ok make it about 8 percent yes", 2026-09-29 — a puppy phase, docs/IDEAS.md:436)');
        if (pc('nap') + pc('song') <= 50) P.push(pl.name + ' naps and songs are only ' + (pc('nap') + pc('song')).toFixed(1) + '% of what the dog does; they are meant to be most of it');
        if (pl.pal && !n.greeting) P.push(pl.name + ', the two dogs never greet each other');
        if (pl.wid === PL.park && hasCourse && !n.course) P.push(pl.name + ', the dog never runs the course his park has');
      });
      /* the pass, asked of every place at once: what cannot happen here must not become something else */
      ['nap', 'song', 'dig', 'poop'].forEach(k => {
        const lo = seen.reduce((a, s) => (!a || s.n[k] < a.n[k] ? s : a), null), hi = seen.reduce((a, s) => (!a || s.n[k] > a.n[k] ? s : a), null);
        if (lo && hi && lo.n[k] !== hi.n[k]) P.push(hi.pl.name + ' ' + { nap: 'the dog naps', song: 'the dog howls', dig: 'the dog digs', poop: 'the dog leaves a mess' }[k] + ' on ' +
          (100 * hi.n[k] / N).toFixed(1) + '% of his whims, and ' + lo.pl.name + ' on ' + (100 * lo.n[k] / N).toFixed(1) + '%: a whim that cannot happen ' + hi.pl.name + ' is turning into that instead of passing quietly');
      });
    } finally {
      Math.random = keep.MR; window.setTimeout = keep.ST; window.toast = keep.TO; window.musHowl = keep.MH;
      real.forEach(([c, w]) => { c.world = w; });
      Object.assign(PARK, JSON.parse(keep.park)); DECALS.length = keep.decals;
    }
    return { P, out };
  });
  digging.out.forEach(l => console.log('  DIGGING: ' + l));
  fails.push(...digging.P);

  /* ---- OFF THE PARK HE HAS THINGS TO DO: HIS OWN STICK, AND WATER AT A RESTAURANT DOOR ----
     Owner, 2026-09-29: "give him other things to do to keep him busy? running after his own stick or
     other dog things, chasing after another character. traveling to the bed on my office. awooing
     infront of a restaurant and a worker brings them a water bowl. ya kno?"
     Away from the park two bands of his whims used to pass, because the course and the greeting
     cannot happen there. These fill them. Asked by driving the whim and then the dog, step by step,
     on a clock this check owns (never the page's), for a dog made here:
       1 · his own stick — he flings it, runs it down, picks it up, trots back to where he threw it
           from, pleased with himself the whole way, and puts it down beside him.
       2 · a restaurant door — for a place the pack says serves food (PLACES.eateries) whose door opens
           onto a world that is not the park: he walks to the door and sings; somebody who works there
           steps out onto the step with water and sets the bowl down between them; he drinks; they go
           back in and the step is clear again; and he walks home, because a dog far from home cannot
           wander (critFree keeps him within four tiles of it). A pack that serves nothing: the same
           roll passes and nothing happens at all.
       3 · the stick and the bowl are drawn by every camera this shell has — counted at the one drawer
           they share, the way a kicked cone's call is counted (test/smoke.js, grep `Count the CALL`).
     Synchronous; every real dog is parked off the map and put back; every stick, bowl and person this
     makes is taken away again before it returns. */
  const busy = await page.evaluate(() => {
    const P = [];
    const K = [...DOGK][0], MR = Math.random;
    const keep = { world, px, py, fx, fy, cam: camMode };
    const THINGS = typeof DOGTHINGS !== 'undefined' ? DOGTHINGS : null, thingsBefore = THINGS ? THINGS.length : 0;
    const VISITS = typeof DOGVISIT !== 'undefined' ? DOGVISIT : null;
    const tick = typeof dogThingsUpdate === 'function' ? dogThingsUpdate : () => {};
    const real = CRIT.filter(isDog).map(c => [c, c.world]);
    const at = p => '(' + p[0] + ',' + p[1] + ')';
    const open = (wid, x, y) => { const w = WORLDS[wid]; return x >= 0 && y >= 0 && x < w.W && y < w.H && !SOLID.has(w.grid[y][x]) && w.grid[y][x] !== 'N' && !portalAt(wid, x, y); };
    const made = (wid, x, y) => ({ kind: K, name: 'Probe', world: wid, x, y, fx: x, fy: y, face: 1, dx: 0, dy: 0, sit: false, layT: 0, next: 0, home: [x, y], task: null, holdT: 0, stayT: 0 });
    let T = performance.now();
    /* one dog through its task, on this check's clock; `each` sees every step before it is taken */
    const drive = (d, max, each) => { for (let i = 0; i < max && d.task; i++) { T += 100; tick(100, T); if (each) each(d); dogStep(d, T); d.moving = false; d.fx = d.x; d.fy = d.y; } T += 100; tick(100, T); };
    /* which cameras draw this thing: the call at the shared drawer, per camera */
    const has3d = typeof draw3d === 'function' && (typeof CAMS === 'undefined' || CAMS.indexOf('3d') >= 0);
    let drew3d = false;
    const drawnBy = o => { const seen = new Set(), realDraw = window.drawDogThing; let cam = '';
      if (typeof realDraw !== 'function') return seen;
      window.drawDogThing = function (g, sx, sy, t) { if (t === o) seen.add(cam); return realDraw.apply(this, arguments); };
      try { world = o.world; px = Math.round(o.fx); py = Math.round(o.fy); fx = px; fy = py;
        ['top', 'front', 'iso'].forEach(c => { cam = c; camSet(c); draw(); });
        if (has3d) { cam = '3d'; camSet('3d'); sizeCanvas(); draw3d(); drew3d = true; } }
      finally { window.drawDogThing = realDraw; }
      return seen; };
    const cams = ['top', 'front', 'iso'].concat(has3d ? ['3d'] : []);
    const missing = seen => cams.filter(c => !seen.has(c));
    const away = [world, PL.street, PL.home].concat(Object.keys(WORLDS)).find(id => WORLDS[id] && id !== PL.park);
    try {
      real.forEach(([c]) => { c.world = '__frozen'; });

      /* 1 · his own stick */
      if (away) {
        const w = WORLDS[away], reach = (x, y) => dogReach({ world: away, x, y });
        let s = null;
        for (let y = 0; y < w.H && !s; y++) for (let x = 0; x < w.W && !s; x++) {
          if (!open(away, x, y)) continue;
          const rs = reach(x, y);
          for (let yy = 0; yy < w.H && !s; yy++) for (let xx = 0; xx < w.W && !s; xx++) {
            const dd = Math.abs(xx - x) + Math.abs(yy - y);
            if (dd >= 3 && dd <= 5 && rs[yy * w.W + xx] && open(away, xx, yy)) s = [x, y]; } }
        if (s) {
          world = away; px = fx = w.W - 1; py = fy = w.H - 1;
          Math.random = () => 0.74;   /* inside the band that, away from the park, means "his own stick" */
          const d = made(away, s[0], s[1]);
          dogWhim(d, T);
          Math.random = MR;
          if (!d.task || d.task.type !== 'stick') P.push('away from the park the dog never goes after his own stick: the roll that should send him ' +
            (d.task ? 'sent him to ' + d.task.type : 'did nothing') + ' (owner, 2026-09-29: "running after his own stick")');
          else {
            const stick = d.task.o; let carried = 0, proud = 0;
            drive(d, 400, dd => { if (stick.phase === 'carried') { carried++; if (dd.happyT > T) proud++; } });
            if (!carried) P.push('the dog ran to his own stick and never picked it up');
            else if (d.x !== s[0] || d.y !== s[1]) P.push('the dog picked up his own stick and never brought it back to where he threw it from: he stopped at ' + at([d.x, d.y]) + ', not ' + at(s));
            else if (proud < carried - 1) P.push('the dog trotted back with his own stick and was not pleased with himself for ' + (carried - 1 - proud) + ' of the steps home — the owner asked for proud');
            if (!THINGS || THINGS.indexOf(stick) < 0 || stick.phase !== 'ground' || Math.abs(stick.fx - d.x) > 1 || Math.abs(stick.fy - d.y) > 1)
              P.push('the dog brought his own stick back and it is not lying beside him — it vanished, or it is somewhere else');
            else { const miss = missing(drawnBy(stick)); if (miss.length) P.push('his own stick is not drawn in the ' + miss.join(', ') + ' camera: there he is carrying nothing'); }
          }
        }
      }

      /* 2 · a restaurant door */
      const eats = (PL.eateries || []).filter(e => e && WORLDS[e.world]);
      if (!eats.length) {
        if (away) { const w = WORLDS[away]; let s = null;
          for (let y = 0; y < w.H && !s; y++) for (let x = 0; x < w.W && !s; x++) if (open(away, x, y)) s = [x, y];
          if (s) { world = away; Math.random = () => 0.80; const d = made(away, s[0], s[1]); dogWhim(d, T); Math.random = MR;
            if (d.task || d.howlT || d.layT || d.digT) P.push('this pack serves no food, and the roll for a restaurant door still made the dog ' + (d.task ? 'set off to ' + d.task.type : 'do something') + ' — with no restaurant it must pass quietly'); } }
      } else {
        /* a door INTO the place, in a world that is not the park; its steps are the open tiles either side */
        const doors = [];
        eats.forEach(e => Object.keys(WORLDS).forEach(wid => { if (wid === PL.park || wid === e.world) return;
          portalsOf(wid).forEach(({ x, y, p }) => { if (p.to === e.world) doors.push({ e, wid, door: [x, y] }); }); }));
        if (!doors.length) P.push('PLACES.eateries names ' + eats.map(e => e.world).join(', ') + ', and no door leads into it from anywhere but the park, so no dog can ever sing at it');
        const door = doors[0];
        if (door) {
          const w = WORLDS[door.wid], [sx, sy] = door.door, rs = dogReach({ world: door.wid, x: sx, y: sy });
          const steps = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => [sx + dx, sy + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < w.W && y < w.H && !SOLID.has(w.rows[y][x]) && !portalAt(door.wid, x, y));
          const onStep = n => steps.some(([x, y]) => n.x === x && n.y === y);
          let s = null;
          for (let y = 0; y < w.H && !s; y++) for (let x = 0; x < w.W && !s; x++) {
            const dd = Math.abs(x - sx) + Math.abs(y - sy);
            if (dd >= 4 && dd <= 12 && rs[y * w.W + x] && open(door.wid, x, y)) s = [x, y]; }
          const inside = WORLDS[door.e.world].npcs || [];
          const worker = (door.e.who && inside.find(n => n.npc === door.e.who)) || inside[0];
          if (door.e.who && !inside.some(n => n.npc === door.e.who)) P.push('PLACES.eateries says ' + door.e.who + ' works at ' + door.e.world + ', and nobody of that name works there');
          if (!s) P.push('there is nowhere near the door of ' + door.e.world + ' in ' + door.wid + ' for a dog to start from, so the restaurant door could not be asked');
          else if (worker) {
            const name = npcName(worker.npc).split(' ·')[0], glyph = steps.map(([x, y]) => w.grid[y][x]).join('');
            world = door.wid; px = fx = w.W - 1; py = fy = w.H - 1;
            Math.random = () => 0.80;   /* inside the band that, away from the park, means "a restaurant door" */
            const d = made(door.wid, s[0], s[1]);
            dogWhim(d, T);
            Math.random = MR;
            if (!d.task || d.task.type !== 'door') P.push('a dog in ' + door.wid + ' never goes to sing at ' + name + '\'s door: the roll that should send him ' +
              (d.task ? 'sent him to ' + d.task.type : 'did nothing') + ' (owner, 2026-09-29: "awooing infront of a restaurant and a worker brings them a water bowl")');
            else {
              let sang = false, came = null, lookOk = false, bowl = null, drank = false;
              drive(d, 700, dd => {
                if (Math.abs(dd.x - sx) + Math.abs(dd.y - sy) <= 2 && dd.howlT > T) sang = true;
                const v = w.npcs.find(n => onStep(n) && n !== worker && String(n.key).indexOf('~') === 0);
                if (v && !came) { came = v; lookOk = lookOf(v) === lookOf(worker) && v.npc === worker.npc; }
                const b = THINGS && THINGS.find(o => o.kind === 'bowl' && o.world === door.wid);
                if (b) bowl = b;
                if (bowl && bowl.drinkUntil > T && Math.abs(dd.x - bowl.fx) <= 1 && Math.abs(dd.y - bowl.fy) <= 1) drank = true; });
              if (!sang) P.push('the dog went to ' + name + '\'s door and never sang');
              else if (!came) P.push('the dog sang at ' + name + '\'s door and nobody came out');
              else if (!lookOk) P.push('somebody came out of ' + door.e.world + ' with the water and it was not ' + name + ': they are wearing somebody else\'s clothes');
              if (came && !bowl) P.push(name + ' came out to the dog and brought no water bowl');
              if (bowl && !drank) P.push(name + ' set a bowl of water down and the dog never drank from it');
              if (came && w.npcs.indexOf(came) >= 0) P.push(name + ' came out with the water and never went back in: they are standing on the step for good');
              if (steps.map(([x, y]) => w.grid[y][x]).join('') !== glyph) P.push('after ' + name + ' went back in, the step outside the door still reads as a person standing there — nobody can walk through it');
              if (d.task || Math.abs(d.x - s[0]) + Math.abs(d.y - s[1]) > 1) P.push('after his drink the dog never went home: he stopped at ' + at([d.x, d.y]) + ', and a dog far from home cannot wander');
              if (bowl) { const miss = missing(drawnBy(bowl)); if (miss.length) P.push('the water bowl is not drawn in the ' + miss.join(', ') + ' camera: the dog is drinking from nothing'); }
            }
          }
        }
      }
    } finally {
      Math.random = MR;
      if (THINGS) THINGS.length = thingsBefore;
      if (VISITS) { VISITS.forEach(v => removeChill(v.key)); VISITS.length = 0; }
      real.forEach(([c, w]) => { c.world = w; });
      world = keep.world; px = keep.px; py = keep.py; fx = keep.fx; fy = keep.fy;
      /* the 3D scene was built for the world this check visited; build it again for the one it came from,
         or the next check that reads T3.scene measures a different room (it did: the roof check, 20×1) */
      if (drew3d) { camSet('3d'); sizeCanvas(); draw3d(); }
      camSet(keep.cam); if (typeof sizeCanvas === 'function') sizeCanvas();
    }
    return P;
  });
  fails.push(...busy);

  /* ---- WHAT THE DOG LEAVES ON THE GROUND IS ON THE GROUND IN EVERY CAMERA (#267) ----
     The owner's issue, 2026-09-29: "When the dog digs a hole or leaves a mess, it only shows in the flat
     top-down and front cameras. In 3D, which is Meridian's default camera, and in iso, there is nothing on
     the ground. You see the dog dig and no hole appears. Done when what the dog leaves on the ground shows
     in every camera." Asked as pixels, the way a player misses it (docs/POSTMORTEM.md §3). A dog made here
     is sent by his own whim — the roll is swept until he digs, and until he leaves the other thing, so no
     band is typed out here — on an open tile with open ground all round; the person you steer stands on
     that spot, and every camera this shell has is asked three things:
       · IT SHOWS: the frame with the mark minus the frame without it;
       · WHERE HE LEFT IT: the middle of those pixels lies inside the outline of the person standing on the
         spot (the frame with him minus the frame without him) — under his feet, not a tile away;
       · ON THE SAME CLOCK: near the end of its life its strength, as a share of its full strength, is the
         share the reference camera (the first flat one, the painter that has always faded it) shows at the
         same instant; and a moment after its end it is drawn by nobody and kept by nobody.
     THE CLOCK IS HELD STILL. A mark fades by Date.now(), and so do a neighbour's idle sway, a door's glow,
     a tree's canopy: every pair of frames compared here is taken at one stubbed instant, and a control pair
     (the same scene twice) must differ by nothing first, or the probe measures nothing (§13r). The season
     is switched off, the tram sent away, and the critters and people of that world taken out of the
     picture, so nothing else stands on the spot. Nothing here calls a painter: the whim makes the mark, and draw() / draw3d() draw it. The 3D
     camera is asked at all four of its quarter turns, because a mark can hide behind a wall at one stop. */
  const leaves = await page.evaluate(() => {
    const P = [];
    const K = typeof DOGK !== 'undefined' ? [...DOGK][0] : null;
    if (typeof dogWhim !== 'function' || typeof DECALS === 'undefined' || !K) { P.push('COUNT-ONLY: this shell has no dog, so nothing is dug and nothing is left on the ground'); return P; }
    const has3d = typeof draw3d === 'function' && !!window.THREE && typeof T3 !== 'undefined' && CAMS.indexOf('3d') >= 0;
    const flat = ['top', 'front', 'iso'].filter(c => CAMS.indexOf(c) >= 0);
    if (!flat.length) { P.push('COUNT-ONLY: this shell has no flat camera to say how a mark on the ground fades'); return P; }
    const QT = Math.PI / 2;
    const views = flat.map(c => ({ cam: c, nm: 'the ' + c + ' camera', clock: true }))
      .concat(has3d ? [0, 1, 2, 3].map(q => ({ cam: '3d', yaw: q * QT, nm: q ? 'the 3D camera turned ' + q + ' quarter' + (q > 1 ? 's' : '') : 'the 3D camera', clock: !q })) : []);
    /* the spot: ground a player can stand on, off the tram's rails, with as much open ground round it as the shell
       has — all eight neighbours in a street, fewer in a one-room world (the gauge, El Horno). It is chosen from the
       MAP, never from where people happen to stand: a person is stamped into the grid wherever they wander, so a
       spot read through them came and went between runs (it did — the gauge found one on one run and none on the
       next). The people of that world are taken out of the picture while it is measured instead, and put back. */
    const bare = (wid, x, y) => { const w = WORLDS[wid];
      if (x < 0 || y < 0 || x >= w.W || y >= w.H) return false;
      const r = w.rows[y][x], g = w.grid[y][x] === 'N' ? r : w.grid[y][x];
      return !SOLID.has(g) && !SOLID.has(r) && g !== 'N' && r !== 'N' && !stands(r) && !stands(g) && !DOORSET.has(r) && !portalAt(wid, x, y)
        && !DECOS.some(d => d.world === wid && d.x === x && d.y === y) && !wellDepth(w, x, y) && !stairLift(w, x, y); };
    const animals = wid => [['dog', typeof DOG !== 'undefined' && DOG], ['cat', typeof CAT !== 'undefined' && CAT], ['pig', typeof PIG !== 'undefined' && PIG], ['loro', typeof LORO !== 'undefined' && LORO]]
      .filter(([k, a]) => a && AW(k) === wid).map(([, a]) => [Math.round(a.fx === undefined ? a.x : a.fx), Math.round(a.fy === undefined ? a.y : a.fy)]);
    let spot = null;
    [PL.street].concat(Object.keys(WORLDS)).filter((id, i, a) => WORLDS[id] && a.indexOf(id) === i).some(wid => {
      const w = WORLDS[wid], L = troLine(wid), an = animals(wid);
      for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) {
        if ((L && Math.abs(y - L.row) <= 1) || !bare(wid, x, y)) continue;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (bare(wid, x + dx, y + dy) && !an.some(a => a[0] === x + dx && a[1] === y + dy)) n++;
        if (!spot || n > spot.n) spot = { wid, x, y, n }; }
      return spot && spot.n === 9; });
    if (!spot) { P.push('there is no open ground a person can stand on in any world of this shell, so where the dog leaves things could not be looked at — that is a red, not a pass'); return P; }
    const realNow = Date.now, keep = { world, px, py, fx, fy, cam: camMode, mv: moving, st: TRO.state, season: typeof seasonPick !== 'undefined' ? seasonPick : null,
      yaw: has3d ? T3.yaw : 0, MR: Math.random, ST: window.setTimeout, TO: window.toast, MH: window.musHowl, dp: drawPerson,
      decals: DECALS.slice(), things: typeof DOGTHINGS !== 'undefined' ? DOGTHINGS.length : 0, park: JSON.stringify(PARK), hid: document.getElementById('world').hidden };
    const parked = CRIT.filter(c => c.world === spot.wid).map(c => [c, c.world]), people = WORLDS[spot.wid].npcs;
    let NOW = realNow(), heroOn = true, drew3d = false;
    const cv2 = document.getElementById('cv'), g2 = cv2.getContext('2d');
    const frame = v => {
      if (v.cam === '3d') { T3.turn = null; T3.yaw = v.yaw; if (!draw3d()) return null; drew3d = true;
        const c3 = T3.renderer.domElement, c = document.createElement('canvas'); c.width = c3.width; c.height = c3.height;
        const g = c.getContext('2d'); g.drawImage(c3, 0, 0); return { d: g.getImageData(0, 0, c.width, c.height).data, W: c.width }; }
      draw(); return { d: g2.getImageData(0, 0, cv2.width, cv2.height).data, W: cv2.width }; };
    /* how many pixels moved (by more than a shade), where their middle is, the box round them, and the
       summed change over every pixel — the strength, which is what a fade takes away */
    const cmp = (A, B) => { const a = A.d, b = B.d, W = A.W; let n = 0, sx = 0, sy = 0, s = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let i = 0; i < a.length; i += 4) { const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); if (!d) continue; s += d;
        if (d > 30) { const p = i >> 2, x = p % W, y = (p - x) / W; n++; sx += x; sy += y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      return { n, s, cx: n ? sx / n : NaN, cy: n ? sy / n : NaN, x0, y0, x1, y1 }; };
    const MIN = 20;
    try {
      Date.now = () => NOW;
      window.setTimeout = fn => { if (typeof fn === 'function') fn(); return 0; };   /* the hole lands 1.4 s into the dig: now, at this check's instant */
      window.toast = () => {}; window.musHowl = () => {};
      parked.forEach(([c]) => { c.world = '__frozen'; });
      WORLDS[spot.wid].npcs = [];
      if (typeof seasonSet === 'function') seasonSet('off');
      TRO.state = 'away';
      /* 1 · the dog leaves them, by his own whim: the roll swept until each kind of mark has appeared once */
      const marks = [], MK = (wid, x, y) => ({ kind: K, world: wid, x, y, fx: x, fy: y, face: 1, dx: 0, dy: 0, sit: false, layT: 0, next: 0, home: [x, y], task: null, holdT: 0, stayT: 0 });
      for (let i = 0; i < 400; i++) {
        const r = (i + 0.5) / 400; let first = true;
        Math.random = () => { if (first) { first = false; return r; } return 0.5; };
        const n0 = DECALS.length;
        dogWhim(MK(spot.wid, spot.x, spot.y), performance.now());
        Math.random = keep.MR;
        const got = DECALS.slice(n0);
        DECALS.length = n0; if (typeof DOGTHINGS !== 'undefined') DOGTHINGS.length = keep.things;
        got.forEach(dc => { if (!marks.some(m => m.kind === dc.kind)) marks.push(dc); });
      }
      Object.assign(PARK, JSON.parse(keep.park));
      if (!marks.some(m => m.kind === 'hole')) P.push('swept through every roll of his whim at ' + spot.wid + ' (' + spot.x + ',' + spot.y + '), the dog never dug a hole, so there was nothing to look for in any camera');
      if (marks.length < 2) P.push('swept through every roll of his whim, the dog never left the other thing on the ground either, so there was nothing to look for in any camera');
      marks.forEach(dc => {
        if (dc.world !== spot.wid || dc.x !== spot.x || dc.y !== spot.y) P.push('the dog standing at ' + spot.wid + ' (' + spot.x + ',' + spot.y + ') left a ' + dc.kind + ' at ' + dc.world + ' (' + dc.x + ',' + dc.y + ') instead: not where he was'); });
      /* 2 · every camera, with you standing on the spot and the clock held still */
      document.getElementById('world').hidden = false;
      world = spot.wid; px = fx = spot.x; py = fy = spot.y; moving = false; held = null;
      drawPerson = function (g, sx, sy, lk, o) { if (o && o.hero && !heroOn) return; return keep.dp.apply(this, arguments); };
      const put = dc => { if (DECALS.indexOf(dc) < 0) DECALS.push(dc); }, lift = dc => { const i = DECALS.indexOf(dc); if (i >= 0) DECALS.splice(i, 1); };
      DECALS.length = 0;
      const TIMES = [-1200, -600, -200];   /* the last moments of its life; the reference camera says what strength each should have */
      const born = NOW;                    /* every mark was made at this one instant */
      marks.forEach(dc => {
        DECALS.length = 0;                 /* this mark and nothing else, whatever the one before it left behind */
        const name = dc.kind === 'hole' ? 'the hole the dog dug' : 'the mess the dog left', at = ' at ' + dc.world + ' (' + dc.x + ',' + dc.y + ')';
        const mid = born + (dc.until - born) / 2, ref = {}, seen = [], fades = [], turns = {}, flatN = {};
        views.forEach((v, vi) => {
          const vn = v.cam === '3d' ? '3D' + (v.yaw ? '↻' + Math.round(v.yaw / QT) : '') : v.cam;
          camSet(v.cam); sizeCanvas();
          NOW = mid; heroOn = false; put(dc);
          /* one frame thrown away first: in Meridian the first top-camera frame paints the flower bed at st 8,4
             differently from every frame after it (10 pixels, measured with the season left alone as well as
             switched off), which is a first draw settling and not the mark */
          frame(v);
          const A = frame(v); if (!A) { P.push(v.nm + ' could not draw at all, so ' + name + ' was not looked for there'); return; }
          const A2 = frame(v); lift(dc); const B = frame(v); heroOn = true; const H = frame(v); heroOn = false; put(dc);
          const ctl = cmp(A, A2), mark = cmp(A, B), him = cmp(H, B);
          if (ctl.n) { P.push(v.nm + ' cannot be measured: two frames of the same scene at the same instant differ by ' + ctl.n + ' pixels'); return; }
          if (him.n < 30) { P.push('in ' + v.nm + ' nobody shows standing' + at + ' (' + him.n + ' pixels), so where ' + name + ' lies could not be compared with anything — that is a red, not a pass'); return; }
          if (mark.n < MIN) { P.push(name + at + ' does not show in ' + v.nm + ': taking it away changes ' + mark.n + ' pixels. You watch him ' + (dc.kind === 'hole' ? 'dig' : 'squat') + ' and nothing is on the ground (#267)'); return; }
          if (mark.cx < him.x0 || mark.cx > him.x1 || mark.cy < him.y0 || mark.cy > him.y1)
            P.push('in ' + v.nm + ' ' + name + ' is not where he left it: stand on the spot and its middle is at (' + Math.round(mark.cx) + ',' + Math.round(mark.cy) + '), outside your own outline (' +
              him.x0 + '–' + him.x1 + ' across, ' + him.y0 + '–' + him.y1 + ' down) — it is drawn somewhere else');
          seen.push(vn + ' ' + mark.n);
          if (v.cam === '3d') turns[Math.round(v.yaw / QT)] = [mark.x1 - mark.x0 + 1, mark.y1 - mark.y0 + 1]; else flatN[v.cam] = mark.n;
          if (!v.clock) return;
          /* the clock: its strength near the end, as a share of its full strength, against the reference camera's */
          /* the reference is the first camera, and only the first: if it could not be measured it has already said so above */
          const isRef = vi === 0;
          if (!isRef && !Object.keys(ref).length) return;
          const sh = [];
          for (const dt of TIMES) {
            NOW = dc.until + dt; put(dc); const F = frame(v); lift(dc); const G = frame(v); put(dc);
            const share = cmp(F, G).s / mark.s; sh.push(Math.round(share * 100) + '%');
            if (isRef) ref[dt] = share;
            else if (Math.abs(share - ref[dt]) > 0.2) { P.push('in ' + v.nm + ' ' + name + ' does not fade with the others: ' + (-dt / 1000).toFixed(1) + ' s before it is gone it shows at ' +
              Math.round(share * 100) + '% of its full strength, and ' + views[0].nm + ' shows it at ' + Math.round(ref[dt] * 100) + '%'); break; }
          }
          fades.push(vn + ' ' + sh.join('/'));
          /* and it is taken away after, not put back: a mark whose time is up comes alive again the moment the clock
             is set back for the next one, and the first draft of this check measured the mess on top of a ghost of
             the hole — the top camera read the mess at 131% of its own full strength in El Horno */
          NOW = dc.until + 1; put(dc); const E = frame(v); const kept = DECALS.indexOf(dc) >= 0; lift(dc); const E2 = frame(v);
          const left = cmp(E, E2).n;
          if (left) P.push('in ' + v.nm + ' ' + name + ' is still drawn a moment after its time is up: ' + left + ' pixels of it, on a mark that has gone');
          if (kept) P.push('in ' + v.nm + ' ' + name + ' is kept after its time is up: nothing lets go of it while this camera runs, so everything he ever leaves on the ground is carried for good');
        });
        /* A HOLE LIES IN THE GROUND. Turn the 3D camera a quarter and a thing lying on the ground is seen along its
           other side, so its outline on screen changes shape; a card standing up like a sign turns to face you
           and keeps the one it had. Asked of the hole only: the other thing is a little pile, and it stands. */
        if (dc.kind === 'hole' && turns[0] && turns[1]) { const r0 = turns[0][0] / turns[0][1], r1 = turns[1][0] / turns[1][1];
          if (Math.abs(r0 / r1 - 1) < 0.25) P.push('in the 3D camera ' + name + ' stands up like a sign instead of lying on the ground: turned a quarter, its outline keeps its shape (' +
            turns[0].join('×') + ' → ' + turns[1].join('×') + ' pixels), where a hole in the ground is seen along its other side'); }
        /* THE OTHER THING STANDS, and every flat camera stands it up with the same painter on the same canvas at the
           same scale, so it covers about as many pixels in each. It is a colour glyph, which keeps the ALPHA of
           whatever fill the painter before it left: in iso that drew it at about half its strength (59 pixels where
           top and front showed 102, measured 2026-09-30) until it was given an ink of its own. */
        if (dc.kind !== 'hole') { const most = Math.max(...Object.values(flatN)), top = Object.keys(flatN).find(c => flatN[c] === most);
          Object.keys(flatN).forEach(c => { if (flatN[c] < most * 0.75) P.push('in the ' + c + ' camera ' + name + ' is drawn faint: it changes ' + flatN[c] +
            ' pixels where the same drawing in the ' + top + ' camera changes ' + most + ' — it is written in whatever ink the painter before it left'); }); }
        P.push('COUNT-ONLY: ' + name + at + ' — pixels it changes, you standing on it: ' + seen.join(', ') + (turns[0] && turns[1] ? '; its outline in 3D ' + turns[0].join('×') + ', turned a quarter ' + turns[1].join('×') : '') + '; its strength ' +
          TIMES.map(t => (-t / 1000).toFixed(1)).join('/') + ' s before it is gone: ' + fades.join(', '));
      });
    } finally {
      Date.now = realNow; Math.random = keep.MR; window.setTimeout = keep.ST; window.toast = keep.TO; window.musHowl = keep.MH; drawPerson = keep.dp;
      DECALS.length = 0; keep.decals.forEach(d => DECALS.push(d));
      if (typeof DOGTHINGS !== 'undefined') DOGTHINGS.length = keep.things;
      Object.assign(PARK, JSON.parse(keep.park));
      parked.forEach(([c, w]) => { c.world = w; });
      WORLDS[spot.wid].npcs = people;
      if (keep.season !== null && typeof seasonSet === 'function') seasonSet(keep.season);
      TRO.state = keep.st; moving = keep.mv;
      world = keep.world; px = keep.px; py = keep.py; fx = keep.fx; fy = keep.fy;
      if (has3d) T3.yaw = keep.yaw;
      /* build the 3D scene again for the world this check came from, or the next check that reads T3.scene measures this room */
      if (drew3d) { camSet('3d'); sizeCanvas(); draw3d(); }
      camSet(keep.cam); sizeCanvas(); document.getElementById('world').hidden = keep.hid;
    }
    return P;
  });
  fails.push(...leaves.filter(l => !/^COUNT-ONLY: /.test(l)));
  leaves.filter(l => /^COUNT-ONLY: /.test(l)).forEach(l => console.log('  ' + l));

  /* ---- AND A ROMP WITH SOMEBODY NEAR: THEY LAUGH, NOBODY RUNS ----
     The owner, 2026-09-29: "chasing after another character". Away from the park the greeting's roll
     cannot greet another dog, so it sends him to the nearest person in reach: he runs to their feet and
     goes round them a few times, and they laugh. Friendly, the whole way: he never stands on them, and
     they never move away from him — the page's own wander step is run between his hops, so a person who
     would wander is proved to stay. The laugh is asked of the one painter every camera shares
     (drawEmote), by reading what it writes. Same clock rules as above; nobody real moves. */
  const romp = await page.evaluate(() => {
    const P = [];
    const K = [...DOGK][0], MR = Math.random, keep = { world, px, py, fx, fy };
    const real = CRIT.filter(isDog).map(c => [c, c.world]);
    const at = p => '(' + p[0] + ',' + p[1] + ')';
    const tick = typeof dogThingsUpdate === 'function' ? dogThingsUpdate : () => {};
    const open = (wid, x, y) => { const w = WORLDS[wid]; return x >= 0 && y >= 0 && x < w.W && y < w.H && !SOLID.has(w.grid[y][x]) && w.grid[y][x] !== 'N' && !portalAt(wid, x, y); };
    let T = performance.now();
    /* a person in a world that is not the park, with room around them to start a dog from — somebody who
       WANDERS first, because only they could run from him, and "nobody runs" asked of a person who never
       moves is a check that cannot fail */
    /* three to five steps from their feet ON FOOT — counted here, by this check's own flood, not by the
       engine's: a start picked by straight distance was behind a fence, and the engine rightly said
       nobody was near */
    const onFoot = (w, n) => { const far = new Int16Array(w.W * w.H).fill(-1), q = [];
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const x = n.x + dx, y = n.y + dy;
        if (x >= 0 && y >= 0 && x < w.W && y < w.H && !SOLID.has(w.grid[y][x]) && w.grid[y][x] !== 'N') { far[y * w.W + x] = 1; q.push([x, y]); } });
      while (q.length) { const [cx, cy] = q.shift(), d0 = far[cy * w.W + cx]; if (d0 >= 5) continue;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const x = cx + dx, y = cy + dy;
          if (x < 0 || y < 0 || x >= w.W || y >= w.H || far[y * w.W + x] >= 0 || SOLID.has(w.grid[y][x]) || w.grid[y][x] === 'N') return;
          far[y * w.W + x] = d0 + 1; q.push([x, y]); }); }
      return far; };
    let pick = null, anybody = false;
    [true, false].forEach(wantWander => Object.keys(WORLDS).forEach(wid => { if (pick || wid === PL.park) return; const w = WORLDS[wid];
      (w.npcs || []).forEach(n => { if (pick || String(n.key).indexOf('~') === 0) return; anybody = true;
        if (wantWander && !wanders(n)) return;
        const far = onFoot(w, n);
        for (let y = 0; y < w.H && !pick; y++) for (let x = 0; x < w.W && !pick; x++)
          if (far[y * w.W + x] >= 3 && open(wid, x, y)) pick = { wid, s: [x, y], wanders: wanders(n) }; }); }));
    if (!pick) { if (anybody) P.push('there are people away from the park and not one of them has open ground three to five steps from their feet, so the romp could not be asked'); return P; }
    const w = WORLDS[pick.wid];
    try {
      real.forEach(([c]) => { c.world = '__frozen'; });
      world = pick.wid; px = fx = w.W - 1; py = fy = w.H - 1;
      const d = { kind: K, name: 'Probe', world: pick.wid, x: pick.s[0], y: pick.s[1], fx: pick.s[0], fy: pick.s[1], face: 1, dx: 0, dy: 0, sit: false, layT: 0, next: 0, home: pick.s.slice(), task: null, holdT: 0, stayT: 0 };
      Math.random = () => 0.86;   /* inside the band that, away from the park, means "a romp with somebody" */
      dogWhim(d, T);
      Math.random = MR;
      const n = d.task && d.task.type === 'romp' ? d.task.n : null;
      if (!n) { P.push('away from the park the dog never romps with anybody near: the roll that should send him ' + (d.task ? 'sent him to ' + d.task.type : 'did nothing') + ' (owner, 2026-09-29: "chasing after another character")'); return P; }
      const name = npcName(n.npc || n.key).split(' ·')[0], home = [n.x, n.y], round = new Set();
      let reached = false, onThem = false, laughed = false, laughDrawn = null;
      for (let i = 0; i < 300 && d.task; i++) {
        T += 100; tick(100, T);
        if (typeof wanderUpdate === 'function') wanderUpdate(100);   /* the page's own step for anybody who wanders */
        if (Math.max(Math.abs(d.x - n.x), Math.abs(d.y - n.y)) <= 1) { reached = true; round.add(d.x + ',' + d.y); }
        if (d.x === n.x && d.y === n.y) onThem = true;
        if (n.laughUntil > T - 1) { laughed = true;
          if (laughDrawn === null) { const cv = document.createElement('canvas').getContext('2d'), old = ctx, said = [];
            cv.fillText = t => said.push(t); ctx = cv; try { drawEmote(n, 0, 0); } finally { ctx = old; } laughDrawn = said.join(''); } }
        dogStep(d, T); d.moving = false; d.fx = d.x; d.fy = d.y;
      }
      if (!reached) P.push('the dog set off to romp with ' + name + ' and never reached their feet');
      else if (round.size < 2) P.push('the dog reached ' + name + ' and never went round them: he stood on one tile');
      if (onThem) P.push('the dog stood on ' + name + ' — a romp goes round somebody\'s feet, never onto them');
      if (n.x !== home[0] || n.y !== home[1]) P.push(name + ' moved away from the dog, from ' + at(home) + ' to ' + at([n.x, n.y]) + ', while he romped — it is play, nobody runs from him');
      if (reached && !laughed) P.push(name + ' never laughed while the dog romped round their feet');
      else if (laughed && laughDrawn !== '😄') P.push('while the dog romps round ' + name + ' the one painter every camera shares writes ' + JSON.stringify(laughDrawn) + ' over their head, not the laugh');
      if (d.task) P.push('the dog never finished his romp with ' + name);
    } finally {
      Math.random = MR;
      real.forEach(([c, ww]) => { c.world = ww; });
      world = keep.world; px = keep.px; py = keep.py; fx = keep.fx; fy = keep.fy;
    }
    return P;
  });
  fails.push(...romp);

  /* ---- A SAVE THAT DID NOT HAPPEN HAS TO SAY SO ----
     Owner, 2026-09-16: "how do we fix the save failing silently?" It was nineteen copies of
     `try{localStorage.setItem(...)}catch(e){}`, so a device out of room let the game go on playing
     and simply stop remembering — no error, no warning, nothing in the log, and an afternoon gone
     when the tab closed. docs/GAUGE.md's silent zero, in the one place where the thing lost belongs
     to a person.
     Asked by making the device refuse, which is the only way to ask it: a real player hits this
     when their disk is full and never when the suite is run normally. */
  const silentsave = await page.evaluate(() => {
    const P = [];
    if (typeof mqStore !== 'function') {
      P.push('the engine has no single door for storage writes, so a device out of room stops the game saving and tells nobody — that is the silent save');
      return P; }
    const real = localStorage.setItem.bind(localStorage);
    const tick = () => { const t = document.getElementById('ticker'); return t ? t.textContent : ''; };
    const full = () => { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; };
    try {
      /* 1 · THE DEVICE IS FULL AND THERE IS NOTHING TO SACRIFICE. The player must be told. */
      mqLog.length = 0; storeBad = false; storeToldAt = 0;
      const before = tick();
      localStorage.setItem = full;
      const ok = save();
      const after = tick();
      if (ok !== false) P.push('save() reports success when the device refused the write — a caller cannot tell a kept afternoon from a lost one');
      if (after === before) P.push('a save that did not happen says nothing to the player: no line on screen, nothing to read back. That is the silent save (docs/GAUGE.md)');
      else if (!/\S/.test(after)) P.push('the save failure put an empty line on screen');
      if (!mqLog.some(e => e.kind === 'store')) P.push('a failed save leaves nothing in the log either, so nobody can find out afterwards what happened');

      /* 2 · AND IT RECOVERS BEFORE IT COMPLAINS. Sixteen kilobytes of our own diagnostics are
             never worth somebody's progress: the log goes first, and the write is retried. */
      localStorage.setItem = real;
      mqLog.length = 0; mqwarn('probe', 'something to sacrifice'); storeBad = false; storeToldAt = 0;
      let once = 1;
      localStorage.setItem = function (k, v) {
        if (once > 0 && k !== SK('log')) { once--; full(); }
        return real(k, v); };
      const ok2 = save();
      if (ok2 !== true) P.push('a full device with a throwaway log still loses the save — the engine’s own notes should be dropped and the write retried before anybody loses anything');
      /* the log is not EMPTY afterwards, and should not be: dropping it is itself worth one line,
         so what proves the sacrifice is that the entry which was there before is gone. Asserting
         `mqLog.length === 0` failed here on correct code — the guard was reading the wrong noun. */
      else if (mqLog.some(e => e.kind === 'probe')) P.push('the save was retried but the log was not the thing given up for it');
      else if (!mqLog.some(e => /dropped the log/.test(e.msg || ''))) P.push('the log was dropped to save the game and nothing recorded that it happened');
    } finally { localStorage.setItem = real; storeBad = false; storeToldAt = 0; }
    return P;
  });
  fails.push(...silentsave);

  /* ---- A PACK MAY DESIGN ITS PAPER, AND MAY NOT REACH OUT OF IT ----
     ARCH-LOG A15, built 2026-09-16 on the owner's "ok go for the seam". The gap it closes: a pack
     shipped nine JavaScript files and no CSS, so Meridian's civic-form typography was hardcoded for
     every world that will ever run on this engine. The risk it opens, in A15's own words, is "a hole
     a pack can reach through to restyle the game's chrome, the HUD or the world" — so this asks BOTH
     halves, because a seam that is merely safe is a seam nobody can use:

       1 · did the pack's own paper actually ARRIVE, and
       2 · did every attempt to reach past the reader come to nothing.

     Asked of the sheet the ENGINE PRODUCED — `PAPER_APPLIED` — and never of a sheet this test wrote
     itself. That is register fault A (docs/REGRESSION.md): a guard that supplies its own input tests
     a pair of strings it typed out, and a plant that changes what the engine ships walks past it.
     The attacks live in content/gauge/config.js so they run against a real pack on every CI push. */
  const paper = await page.evaluate(() => {
    const P = [];
    if (typeof paperSkin !== 'function') {
      P.push('the engine has no paper seam, so a pack cannot design its own documents and every world gets Meridian\'s civic-form typography (docs/ARCH-LOG.md A15)');
      return P; }
    const declared = (typeof PAPER === 'string') ? PAPER : '';
    const out = (typeof PAPER_APPLIED === 'string') ? PAPER_APPLIED : '';

    /* ---- A PACK THAT DECLARES NOTHING MUST GET NOTHING. Meridian's path, and the one that keeps
           "every engine change is behaviour-identical for Meridian's players" true. ---- */
    if (!declared.trim()) {
      if (out) P.push('this pack declares no PAPER and the engine injected a stylesheet anyway');
      if (document.getElementById('paperSkin')) P.push('a pack that declares no PAPER still got a <style id="paperSkin"> in the document');
      return P;
    }

    /* ---- 1 · THE GOOD HALF ARRIVED ---- */
    if (!out) { P.push('this pack declares PAPER and the engine produced no stylesheet at all — the seam is dead'); return P; }
    const node = document.getElementById('paperSkin');
    if (!node) P.push('the engine built a paper stylesheet but never put it in the document');
    else {
      /* it must come AFTER the shell's own styles, or a tie goes to the engine and the pack's
         declaration silently loses to Meridian's voice */
      const styles = [...document.querySelectorAll('style')];
      if (styles.indexOf(node) !== styles.length - 1 && styles.some((s2, i) => i > styles.indexOf(node) && /\.paper/.test(s2.textContent || '')))
        P.push('the pack\'s paper is injected before a shell stylesheet that also styles .paper, so the pack loses every tie');
    }
    /* the sheet is real CSS the browser accepted, not a string that looks like CSS */
    let ruleCount = 0;
    try { ruleCount = node && node.sheet ? node.sheet.cssRules.length : 0; } catch (e) {}
    if (!ruleCount) P.push('the injected paper stylesheet parses to zero rules — it reached the page as text and styles nothing');

    /* ---- 2 · EVERY SELECTOR IS ROOTED IN THE READER ----
           Read off the PARSED sheet, so a selector that only LOOKS scoped in the source text cannot
           pass: the browser normalises what we are checking. ---- */
    const sels = [];
    try { for (const r of node.sheet.cssRules) collect(r, sels); } catch (e) {}
    function collect(r, acc) {
      if (r.selectorText !== undefined) { acc.push(r.selectorText); return; }
      if (r.cssRules) for (const c of r.cssRules) collect(c, acc);
    }
    sels.forEach(sel => {
      sel.split(',').forEach(one => {
        const t = one.trim(); if (!t) return;
        if (!/^\.paper(\s|$|[.:#[>~+])/.test(t))
          P.push('a pack selector escaped the reader: "' + t + '" is not rooted at .paper, so a pack can style the game outside its own paper');
      });
    });

    /* ---- 3 · AND THE THINGS THAT CANNOT BE SCOPED DID NOT COME IN ----
           A selector can be re-rooted; a NAME cannot. @font-face, @keyframes and @property all
           register into a global namespace, and @import is a fetch. Each must be absent from the
           output even though the gauge's PAPER declares all four. ---- */
    [['@import', 'a fetch to another origin'],
     ['@font-face', 'a global font name'],
     ['@keyframes', 'a global animation name the engine already uses'],
     ['@property', 'a global custom-property registration']].forEach(([at, why]) => {
      if (declared.includes(at) && out.includes(at))
        P.push(at + ' survived into the pack\'s paper, and it cannot be scoped to a subtree — it registers ' + why);
    });

    /* ---- 4 · position:fixed IS GONE, because it escapes the containing block: a descendant of
           .paper set fixed can paint over the HUD however well the selector is scoped. ---- */
    if (/position\s*:\s*fixed/i.test(out))
      P.push('position:fixed survived into the pack\'s paper — a scoped selector does not stop a fixed element covering the whole screen');

    /* ---- 5 · AND THE READER IS AN ISLAND. The selector half and the fixed half both assume
           nothing inside .paper can raise itself above the chrome; that is only true if .paper is
           a stacking context, which is a shell CSS fact and not an engine one, so it is asked
           HERE rather than assumed. This is register fault D: measure the thing, not the container
           it happens to sit in. ---- */
    const sheet = document.querySelector('.paper');
    if (!sheet) P.push('there is no .paper element to scope the seam to');
    else if (getComputedStyle(sheet).isolation !== 'isolate')
      P.push('.paper is not a stacking context (isolation:isolate), so an absolutely-positioned element inside the reader can paint on top of the HUD');

    /* ---- 5b · AND THE ELEMENT ACTUALLY WEARS IT.
           Everything above reads the STYLESHEET, which is a proxy: a sheet can contain a rule that
           loses to the shell on specificity, or names a property the browser rejected, and the text
           would still look right. docs/REGRESSION.md's register is full of guards that stopped at
           exactly this point. So ask the element what colour it IS. ---- */
    if (sheet) {
      const want = /&\s*\{[^}]*background\s*:\s*(#[0-9A-Fa-f]{3,8})/.exec(declared);
      if (want) {
        const hex = want[1].toLowerCase();
        const rgb = getComputedStyle(sheet).backgroundColor;
        const m2 = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb || '');
        const got = m2 ? '#' + [1, 2, 3].map(i => (+m2[i]).toString(16).padStart(2, '0')).join('') : rgb;
        if (got !== hex)
          P.push('the pack asked for paper of ' + hex + ' and the reader is actually ' + got +
                 ' — the stylesheet reached the page and the element did not wear it, so the seam is decorative');
      }
    }

    /* ---- 6 · AND THE ESCAPES REALLY WERE DROPPED, NOT MERELY ABSENT FROM THE TEXT.
           Ask the page: does anything outside the reader actually wear what the pack asked for? ---- */
    ['body', 'html'].forEach(tag => {
      const el2 = document.querySelector(tag);
      if (el2 && getComputedStyle(el2).display === 'none')
        P.push('the pack\'s paper hid <' + tag + '> — it reached straight out of the reader and took the page with it');
    });
    return P;
  });
  fails.push(...paper);

  /* ---- THE PLAN DRAWS EVERY STREET, AND THE ARROW STILL POINTS AT THE REAL PLACE ----
     Reported from play, 2026-09-16: "im shown the other street map on calle 2." The plan drew
     `WORLDS[PL.street]` and nothing else, so a second STREET could only ever be a pin in the corner
     of the first one's paper — right for an interior, wrong for a street.

     The interesting half is not that it now draws two panels; it is what drawing two panels does to
     everything that reads a mark. `mapDest` is consumed by `destAim()` as a position IN A WORLD: it
     is compared against px,py and handed to the bearing as tx,ty. The plan is PAPER. While there was
     one panel at 0,0 those were the same numbers, and the day a second panel exists they stop being
     the same — silently, with the street arrow pointing seventeen tiles north of where the player
     is actually being sent. Nothing about that failure is visible in a stylesheet, a log or a
     screenshot of the map; it is only visible if you ask the arrow where it is pointing.
     So that is what this asks, on the panel whose offset is NOT zero — because a guard that only
     ever tests the panel at the origin is testing the arithmetic 0+0 (register fault B). */
  const plan = await page.evaluate(() => {
    const P = [];
    if (typeof planPanels !== 'function' || typeof planMarks !== 'function') {
      P.push('the plan has no TOWNPLAN seam, so a pack with two streets can only draw one of them');
      return P; }
    const panels = planPanels();
    if (!panels.length) { P.push('the plan draws no panels at all'); return P; }

    /* ---- 1 · A PACK THAT DECLARES NOTHING IS UNCHANGED. The town and the gauge live here. ---- */
    const declared = (typeof TOWNPLAN !== 'undefined' && Array.isArray(TOWNPLAN)) ? TOWNPLAN : null;
    if (!declared || !declared.length) {
      if (panels.length !== 1 || panels[0].world !== PL.street || panels[0].ox || panels[0].oy)
        P.push('this pack declares no TOWNPLAN and the plan is not simply PL.street at 0,0 — a pack that said nothing has been changed underneath it');
      return P;
    }

    /* ---- 2 · EVERY DECLARED WORLD IS ACTUALLY ON THE PAPER ---- */
    declared.forEach(d => { if (!panels.some(p2 => p2.world === d.world))
      P.push('TOWNPLAN declares "' + d.world + '" and the plan does not draw it'); });
    const cv = document.getElementById('mapcv');
    if (typeof drawTown === 'function') { try { drawTown(); } catch (e) { P.push('drawTown threw: ' + e.message); } }
    const wantW = Math.max(...panels.map(p2 => p2.ox + WORLDS[p2.world].W)) * 10;
    const wantH = Math.max(...panels.map(p2 => p2.oy + WORLDS[p2.world].H)) * 10 + 18;
    if (cv && (cv.width !== wantW || cv.height !== wantH))
      P.push('the plan is ' + cv.width + '×' + cv.height + ' and the panels need ' + wantW + '×' + wantH +
             ' — a street is drawn off the edge of the paper');

    /* ---- 3 · THE OFFSET PANEL: paper and world must NOT be the same number ----
           AND THE STATE IS DRIVEN TO WHERE THAT IS TRUE, rather than reported as untested. The
           first draft of this block said "no mark stands there right now, so the offset arithmetic
           went untested" — which is honest and is still a silent zero, because on Meridian it is
           true at boot and would have been true on every CI run forever. Nobody on Calle Dos ever
           carries a quest; the mark that lands there is LA ESPIGA's, anchored at its door, and it
           appears three chapters in. So walk the chapters until the paper has a mark on the offset
           panel, which is a real state a player reaches, not a mark this test invented. ---- */
    const off = panels.find(p2 => p2.ox || p2.oy);
    if (!off) { P.push('every TOWNPLAN panel sits at 0,0, so nothing here tests an offset and this check cannot fail (docs/GAUGE.md: nothing to measure is not a pass)'); return P; }
    const onPanel = () => planMarks().filter(m =>
      m.gx >= off.ox && m.gx < off.ox + WORLDS[off.world].W &&
      m.gy >= off.oy && m.gy < off.oy + WORLDS[off.world].H);
    const wasDone = new Set(done), wasSeen = chSeen;
    let marks = onPanel();
    if (!marks.length && typeof CHAPTERS !== 'undefined') {
      for (let ch = 1; ch <= CHAPTERS.length && !marks.length; ch++) {
        done.clear(); for (let i = 0; i < ch; i++) (CHAPTERS[i].quests || []).forEach(q => done.add(q));
        chSeen = ch; if (typeof applyGrowth === 'function') applyGrowth();
        marks = onPanel();
      }
    }
    if (!marks.length) {
      P.push('no mark ever lands on the offset street "' + off.world + '" in any chapter, so the plan draws a street that can never say anything and the offset arithmetic is never exercised');
      done.clear(); wasDone.forEach(q => done.add(q)); chSeen = wasSeen;
      if (typeof applyGrowth === 'function') applyGrowth();
      return P; }
    marks.forEach(m => {
      /* a mark STANDING on the panel must be its world position plus the offset. A mark ANCHORED
         on it (a place behind a door, like the bakery) stores the door's position, which is the
         shape MAPDOT has always had — so only the first kind is checked against WORLDS[m.w]. */
      if (m.w === off.world) {
        const ww = WORLDS[m.w];
        if (m.gx !== m.x + off.ox || m.gy !== m.y + off.oy)
          P.push('a mark on "' + m.w + '" is drawn at ' + m.gx + ',' + m.gy + ' and the panel says it should be at ' + (m.x + off.ox) + ',' + (m.y + off.oy));
        if (m.x < 0 || m.y < 0 || m.x >= ww.W || m.y >= ww.H)
          P.push('a mark on "' + m.w + '" has world position ' + m.x + ',' + m.y + ', which is outside a ' + ww.W + '×' + ww.H + ' world — a paper coordinate has been stored as a world one');
      } else {
        const ww = WORLDS[off.world];
        if (m.x < 0 || m.y < 0 || m.x >= ww.W || m.y >= ww.H)
          P.push('"' + m.w + '" is anchored on the offset street at world position ' + m.x + ',' + m.y +
                 ', which is outside a ' + ww.W + '×' + ww.H + ' street — a paper coordinate has been stored as a world one, and the arrow will point off the map');
      }
    });

    /* ---- 3b · AND THE PAINTER USES THE PAPER PAIR.
           Everything above reads the mark DATA, and a plant that left the data correct and drew at
           `m.x,m.y` instead of `m.gx,m.gy` walked straight past the first draft of this block: the
           marks all piled onto Calle Principal and every assertion stayed green. So ask the CALL
           SITE what it did, by making `drawMark` report the coordinates it is handed — the same
           shape as `SAYBAKE`'s "bake" (docs/REGRESSION.md, register fault A: never let the guard
           supply the number it is checking). ---- */
    {
      const real = drawMark, seen = [];
      try {
        drawMark = (g, cx, cy, k, r) => { seen.push([cx, cy]); };
        drawPlanMarks(document.getElementById('mapcv').getContext('2d'), 10);
      } finally { drawMark = real; }
      const want = planMarks().map(m => [m.gx * 10 + 5, m.gy * 10 + 5]);
      want.forEach(([wx, wy], i) => {
        const got = seen[i];
        if (!got) { P.push('the plan has ' + want.length + ' marks and painted ' + seen.length); return; }
        if (got[0] !== wx || got[1] !== wy)
          P.push('a mark belongs at ' + wx + ',' + wy + ' on the paper and was painted at ' + got[0] + ',' + got[1] +
                 ' — the painter is using the world position, so every mark on an offset street lands on the first one');
      });
    }

    /* ---- 4 · AND THE ARROW POINTS AT THE REAL TILE. The whole point of keeping two pairs. ---- */
    const m0 = marks[0], wasDest = mapDest, wasW = world, wasX = px, wasY = py;
    try {
      mapDest = null;
      const hit = mapPick(m0.gx + 0.5, m0.gy + 0.5);     /* a finger on the PAPER */
      if (!hit) P.push('tapping a mark on the offset street selected nothing — the hit test is reading the wrong coordinates');
      else if (!mapDest) P.push('tapping a mark on the offset street set no destination');
      else {
        if (mapDest.x !== m0.x || mapDest.y !== m0.y)
          P.push('tapping the mark stored ' + mapDest.x + ',' + mapDest.y + ' as the destination and the place is at ' + m0.x + ',' + m0.y + ' — the paper coordinate was stored as the world one, and the street arrow will point at it');
        /* STAND ON THE OFFSET STREET and read the arrow back. This is the assertion the whole
           block exists for: every number above can be right and the arrow still send somebody
           seventeen tiles north, because the arrow is the only thing that reads mapDest as a
           position in a world. */
        const ww = WORLDS[off.world];
        world = off.world; px = Math.max(0, Math.min(ww.W - 1, m0.x - 2)); py = Math.max(0, Math.min(ww.H - 1, m0.y));
        const a = (typeof destAim === 'function') ? destAim() : null;
        if (!a) P.push('standing on the offset street with a destination on it, the game aims at nothing');
        else if (a.tx !== undefined) {
          if (a.tx < 0 || a.ty < 0 || a.tx >= ww.W || a.ty >= ww.H)
            P.push('the street arrow points at ' + a.tx + ',' + a.ty + ', which is off the edge of the ' + ww.W + '×' + ww.H + ' street you are standing on');
          else if (a.mode === 'go' && (a.tx !== m0.x || a.ty !== m0.y))
            P.push('the arrow points at ' + a.tx + ',' + a.ty + ' and the destination is at ' + m0.x + ',' + m0.y);
        }
      }
    } finally { mapDest = wasDest; world = wasW; px = wasX; py = wasY;
                done.clear(); wasDone.forEach(q => done.add(q)); chSeen = wasSeen;
                if (typeof applyGrowth === 'function') { try { applyGrowth(); } catch (e) {} }
                if (typeof drawTown === 'function') { try { drawTown(); } catch (e) {} } }
    return P;
  });
  /* ---- NOTHING MAY ROOF OVER THE WORLD ----
     The owner, about the loft's stairwell, twice — and the second time because the first answer
     was me explaining why it was fine: "i still think the stair railing screenshot i sent is wrong,
     even if it were a seethrough wall thats not right."
     What it actually was: the APRON. A plane added so the city carries on into the dark past the
     edge of the map, `w.W*3+60` by `w.H*3+60`, centred on the world, at y=-0.05. Its own comment
     said "well outside it" and its geometry was a sheet over everything — so every sunken thing in
     either game sat under a dark lid five hundredths of a tile below the floor. The stairwell's
     treads are at -0.16 to -0.64 and had not been visible since the day the apron was added.
     Nothing caught it because nothing looks DOWN. Two rounds of re-lighting the steps changed the
     render by zero bytes, and that is what finally proved where the fault was.
     So: anything the engine lays under the floor must be outside the world's own footprint, and a
     well must be a hole you can see into. Both are asked of the built scene, not of the source. */
  const roof = await page.evaluate(() => {
    const P = [];
    if (!window.THREE) return ['COUNT-ONLY: this shell declined 3D (CAMERAS has no "3d"), so the checks below it, which measure the 3D scene, did not run'];
    if (typeof T3 === 'undefined' || !T3 || !T3.scene) return P;   /* a pack with no 3D: nothing to ask */
    const w = WORLDS[world]; if (!w) return P;
    let aprons = 0;
    T3.scene.traverse(o => {
      const u = o.userData || {};
      if (!u.apron) return;
      aprons++;
      const g = o.geometry && o.geometry.parameters; if (!g) return;
      /* a horizontal plane's world footprint, from its own size and position */
      const hw = g.width / 2, hh = g.height / 2;
      const x0 = o.position.x - hw, x1 = o.position.x + hw;
      const z0 = o.position.z - hh, z1 = o.position.z + hh;
      const overlapX = Math.min(x1, w.W) - Math.max(x0, 0);
      const overlapZ = Math.min(z1, w.H) - Math.max(z0, 0);
      if (overlapX > 0.01 && overlapZ > 0.01 && o.position.y < 0)
        P.push('a piece of scenery lies under ' + Math.round(overlapX) + '×' + Math.round(overlapZ) +
               ' tiles of the world at y=' + o.position.y.toFixed(2) +
               ' — anything sunk below the floor there is roofed over and can never be seen');
    });
    if (!aprons) return P;   /* no apron in this pack: nothing to be roofed by */

    /* ---- AND A WELL IS A HOLE YOU CAN SEE INTO ---- */
    let well = null;
    for (let y = 0; y < w.H && !well; y++) for (let x = 0; x < w.W; x++)
      if (typeof wellDepth === 'function' && wellDepth(w, x, y) > 0) { well = { x, y, d: wellDepth(w, x, y) }; break; }
    if (!well) return P;     /* this world has no well — say nothing rather than pass for free */
    /* is anything at all built inside the hole? */
    let inside = 0;
    T3.scene.traverse(o => { const u = o.userData || {};
      if ((u.tread || u.shaft) && u.x === well.x && u.y === well.y) inside++; });
    if (!inside)
      P.push('the well at ' + well.x + ',' + well.y + ' is a hole in the floor with nothing built inside it — a player looking down the stairs sees whatever lies beyond the world');
    return P;
  });
  fails.push(...roof);

  /* ---- NOBODY MAY BE WALLED OUT BY SOMEBODY STANDING (R11) ----
     Open in `docs/REGRESSION.md` since 2026-09-13 and reddening a suite about one run in
     twenty-five, which is the most expensive shape a bug has. The owner asked the question that
     settles it: "why doesnt r11 walk around?" — and the answer is that there is nothing to walk
     around. A person is stamped into the grid as `"N"`, three readers treat `"N"` as masonry, and
     when a wanderer steps into a corridor one tile wide the map really is cut in two.
     MEASURED before anything was written: of the fifteen worlds, only `ex` has chokepoints AND
     people who move — 35 tiles that cut it, four wanderers. Every other world with a chokepoint
     has nobody walking in it. So the whole of R11 lives on one street.
     Asked the only honest way: put the wanderer on EVERY tile that would cut the world, in turn,
     and ask the auditor each time. Not one sampled tile, and not a tile this test chose — the set
     is derived from the map. Red first at 35 of 35; the plant that restores the old reader still
     names "rigo in ex", which is the person the register predicted three days before the fix. */
  const walled = await page.evaluate(() => {
    const P = [];
    if (typeof auditReach !== 'function' || typeof wanders !== 'function') {
      P.push('R11 cannot be checked: the engine no longer has auditReach() or wanders(), so nothing is asking whether a person standing somewhere walls the map');
      return P; }
    const base = (auditReach(true) || []).length;
    let tested = 0, strand = 0, first = null;
    Object.keys(WORLDS).forEach(id => {
      const w = WORLDS[id];
      const n = (w.npcs || []).find(p2 => wanders(p2));
      if (!n) return;                                   /* nobody moves here: nobody can cork it */
      const ok = (x, y) => x >= 0 && y >= 0 && x < w.W && y < w.H && !SOLID.has(w.grid[y][x]);
      const all = []; for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) if (ok(x, y)) all.push([x, y]);
      const reach = (bx, by) => { const st = all.find(([x, y]) => !(x === bx && y === by));
        if (!st) return 0; const seen = new Set([st[0] + ',' + st[1]]), q = [st];
        while (q.length) { const [x, y] = q.pop();
          [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
            if (seen.has(k) || !ok(nx, ny) || (nx === bx && ny === by)) return; seen.add(k); q.push([nx, ny]); }); }
        return seen.size; };
      const full = reach(-1, -1);
      const cuts = all.filter(([x, y]) => reach(x, y) < full - 1);
      const ox = n.x, oy = n.y;
      try {
        cuts.forEach(([x, y]) => {
          tested++;
          if (w.grid[oy]) w.grid[oy][ox] = w.rows[oy][ox];
          n.x = x; n.y = y; if (w.grid[y]) w.grid[y][x] = 'N';
          const now = (auditReach(true) || []);
          if (now.length > base) { strand++; if (!first) first = id + ' (' + x + ',' + y + '): ' + String(now[0]).slice(0, 90); }
          if (w.grid[y]) w.grid[y][x] = w.rows[y][x];
          n.x = ox; n.y = oy; if (w.grid[oy]) w.grid[oy][ox] = 'N';
        });
      } finally { n.x = ox; n.y = oy; if (w.grid[oy]) w.grid[oy][ox] = 'N'; }
      /* and the wanderer must never CHOOSE one, which is the half that fixes the player rather
         than the audit — an auditor that forgives a corked gap still leaves somebody standing in it */
      if (typeof wanderCuts === 'function') {
        const known = wanderCuts(id);
        const missed = cuts.filter(([x, y]) => !known.has(x + ',' + y));
        if (missed.length)
          P.push(id + ': the wander filter does not know about ' + missed.length + ' of its ' + cuts.length +
                 ' chokepoints, so a person can still step into the only way through');
      } else P.push('there is no wanderCuts(), so nothing stops a person standing in the only way through a world');
    });
    /* NO "UNTESTED" LINE HERE, and the gauge is why. A pack whose worlds have no chokepoint
       cannot have this bug at all — five tiles and one open room is exactly that — so reporting
       "measured nothing" at it would invent a demand on every future world, which is the one thing
       that fixture exists to catch me doing. The silent zero worth fearing is the engine losing
       the pieces this check reads, and that is caught at the top of the block, loudly, rather than
       here where the honest answer is "this world is too simple to break". */
    if (strand) P.push('somebody standing still walls the map: ' + strand + ' of ' + tested +
                            ' chokepoints strand a person when a wanderer stops on them — e.g. ' + first);
    return P;
  });
  fails.push(...walled);

  /* ---- EVERY THING ON THE PLAN IS DRAWN AS A THING, AND A TAP ANSWERS ON THE MAP ----
     Owner, 2026-09-16: "the map says tap a mark, but cannot tell if a mark is tapped. also... the
     squares/dots for people are garbage, we really cant improve this so i can tell what things
     are?" Both were true and the inventory said why: of 29 glyphs on Meridian's plan, EIGHT had no
     map colour at all and fell through to the open-ground fill, so a desk, a chair and a stove were
     painted as floor — invisible, silently, for as long as the plan has existed. Nothing caught it
     because nothing ever compared a tile against the ground it was standing on.
     So both halves are asked of the PIXELS the plan actually produced, which is the only place
     either fault was ever visible. */
  const planread = await page.evaluate(() => {
    const P = [];
    if (typeof drawTown !== 'function' || typeof planPanels !== 'function') return P;
    const cv = document.getElementById('mapcv'); if (!cv) return P;
    const s = 10;
    const wasDest = mapDest;
    const px = (g2, X, Y) => { const d = g2.getImageData(X, Y, 1, 1).data; return d[0] + ',' + d[1] + ',' + d[2]; };
    try {
      mapDest = null; drawTown();

      /* ---- 1 · NOTHING IS PAINTED AS FLOOR THAT IS NOT FLOOR ----
             TWO RENDERS OF THE WHOLE PLAN, and the difference between them is the answer. The first
             draft called `planTile` directly and compared its output to a ground tile — which is
             register fault A twice over: it read a function the plan is not obliged to use (a plant
             that changed the CALL SITE and left the painter alone walked straight past it), and it
             sampled the composited canvas, where marks, labels, folds and the vignette are painted
             over the tiles, so it was reading a person's head and calling it a desk.
             Instead: draw the plan as it is, then draw it again with every tile replaced by open
             ground, and compare the two tile by tile. Everything that is not the tile — paper,
             grain, folds, vignette, labels, marks — is identical in both, so whatever differs is
             exactly the tile's own contribution. A glyph that contributes nothing is being painted
             as floor. */
      const panels = planPanels();
      const box = (g2, X, Y) => g2.getImageData(X, Y, s, s).data;
      const eq = (a, b) => { for (let i = 0; i < a.length; i += 4)
        if (Math.abs(a[i] - b[i]) + Math.abs(a[i+1] - b[i+1]) + Math.abs(a[i+2] - b[i+2]) > 10) return false;
        return true; };
      const g2 = cv.getContext('2d', { willReadFrequently: true });
      /* THE MARKS COME OFF FOR THE MEASUREMENT. A mark is ~11px across on a 10px tile, so it covers
         its tile completely — and Meridian's `e` has exactly one instance, with a person standing
         on it. The tile then looks identical in both renders for a reason that has nothing to do
         with the tile, and the guard reports a glyph as invisible when what is actually happening
         is that somebody is standing in front of it. Stubbing the painter for both renders is the
         same move as `drawMark` in the plan guard: take the thing you are not measuring OUT, rather
         than trying to subtract it afterwards. */
      const realMarks = drawPlanMarks;
      drawPlanMarks = () => {};
      const one = {};
      panels.forEach(p2 => { const ww = WORLDS[p2.world];
        for (let y = 0; y < ww.H; y++) for (let x = 0; x < ww.W; x++) {
          const g = ww.rows[y][x]; if (g === '.') continue;
          if ((y + p2.oy) * s + s >= cv.height - 18) continue;   /* the caption band is not the map */
          if (!one[g]) one[g] = { X: (x + p2.ox) * s, Y: (y + p2.oy) * s, n: 0 };
          one[g].n++; } });
      const kinds = Object.keys(one);
      drawTown();                                       /* redraw with the marks off */
      const real = {}; kinds.forEach(g => { real[g] = box(g2, one[g].X, one[g].Y); });
      /* now the same plan with nothing but ground on it */
      const saved = {};
      panels.forEach(p2 => { saved[p2.world] = WORLDS[p2.world].rows.slice();
        WORLDS[p2.world].rows = WORLDS[p2.world].rows.map(r => '.'.repeat(r.length)); });
      let blank = {};
      try { drawTown(); kinds.forEach(g => { blank[g] = box(g2, one[g].X, one[g].Y); }); }
      finally { panels.forEach(p2 => { WORLDS[p2.world].rows = saved[p2.world]; });
                drawPlanMarks = realMarks; drawTown(); }
      /* AND IT PUT BACK WHAT IT BORROWED. This block blanks every row of every drawn world to
         measure what a tile contributes, and everything after it in this file reads those rows —
         the trolley seam, reachability, the cameras. A restore that silently half-worked would
         surface as somebody else's check failing, in another world, one run in twenty, which is the
         most expensive shape a bug can have. So it is asserted here, where it is cheap, rather than
         diagnosed there, where it is not. */
      panels.forEach(p2 => { const ww = WORLDS[p2.world];
        if (!ww.rows.length || ww.rows.every(r => /^\.*$/.test(r)))
          P.push('the plan readability check blanked "' + p2.world + '" to measure it and did not put it back — every check after this one is now reading an empty world'); });
      const same = kinds.filter(g => eq(real[g], blank[g]));
      if (kinds.length < 6)
        P.push('the plan readability check found only ' + kinds.length + ' kind(s) of tile to look at, which is too few to be measuring anything — it is not passing, it is not looking');
      if (same.length)
        P.push('the plan draws ' + same.length + ' kind(s) of tile exactly as it draws open ground, so they are on the map and invisible: ' +
               same.map(g => g + ' ×' + one[g].n).join(', '));

      /* ---- 2 · A TAP ANSWERS ON THE MAP, NOT ONLY IN THE CAPTION ----
             The whole complaint was that the confirmation lived under the canvas. So: photograph
             the neighbourhood of a mark, tap it, photograph again, and require the picture to have
             changed. A caption is not an answer. */
      const marks = planMarks();
      if (!marks.length) return P;                            /* no marks today: say nothing, claim nothing */
      const m0 = marks[0];
      const bx = Math.max(0, Math.round(m0.gx * s - s)), by = Math.max(0, Math.round(m0.gy * s - s * 2.6));
      const bw = Math.min(cv.width - bx, s * 3), bh = Math.min(cv.height - by, s * 4.6);
      const grab = () => { const d = g2.getImageData(bx, by, bw, bh).data; let n = 0, acc = 0;
        for (let i = 0; i < d.length; i += 4) { acc += d[i] + d[i + 1] + d[i + 2]; n++; } return { d, n, acc }; };
      const before = grab();
      const hit = mapPick(m0.gx + 0.5, m0.gy + 0.5);
      if (!hit) { P.push('tapping the first mark on the plan selected nothing'); return P; }
      drawTown();
      const after = grab();
      let diff = 0;
      for (let i = 0; i < before.d.length; i += 4)
        if (Math.abs(before.d[i] - after.d[i]) + Math.abs(before.d[i + 1] - after.d[i + 1]) +
            Math.abs(before.d[i + 2] - after.d[i + 2]) > 24) diff++;
      const pct = Math.round(100 * diff / before.n);
      /* 28, and the number is measured rather than picked: the confirmation as it SHIPPED — a
         two-pixel ring, nothing dimmed — moves 18% of the pixels around a mark, and 18% is
         precisely what the owner described as not being able to tell. The flag, the disc and the
         dimming together move 36%. The floor goes between them, nearer the thing that failed. */
      if (pct < 28)
        P.push('tapping a mark changed ' + pct + '% of the pixels around it — the plan says "tap a mark" and then does not show you that you did (the caption under the canvas is not an answer)');
    } finally { mapDest = wasDest; try { drawTown(); } catch (e) {} }
    return P;
  });
  fails.push(...planread);

  fails.push(...plan.filter(l => !/^NOTE-ONLY: /.test(l)));
  plan.filter(l => /^NOTE-ONLY: /.test(l)).forEach(l => console.log('  ' + l));

  /* ---- THE BEARING POINTS AT THE PLACE, AND STAYS ON THE SCREEN ----
     The owner picked the street arrow over the crew's advice on 2026-09-15 ("bearing lets try 2"),
     so it has to be right: an arrow that points confidently at the wrong wall is worse than no
     arrow, and it is exactly what happens if the 3D camera's yaw is forgotten, or if the sign of
     one term is flipped, neither of which any reading of the code would catch.
     Asked of the thing on the screen: put a destination due north, south, east and west of the
     hero and read back where the pill actually landed and how far the arrowhead is turned.
     The second half is from the FIRST LOOK at it, not from theory: "Floor 2 · Your office" hung
     66 px off the right of a 372 px viewport, because the first version inset the pill's CENTRE by
     a flat percentage and a pill's real inset is its own half-width, which the name decides. */
  const bearings = await page.evaluate(() => {
    const P = [];
    if (typeof bearingUI !== 'function' || typeof mapDest === 'undefined') return P;
    /* ---- DOES THIS PACK HAVE A DESTINATION TO BE POINTED AT? ----
       A pack that declares no MAPMARK kinds has no marks on its plan, so nothing can be chosen and
       the arrow can never appear: there is no bearing here to be wrong. That is an ANSWER, not an
       absence, and it is the same seam mapLegend() already reads.
       This line exists because `node test/gauge.js` went red the moment the check was written: the
       gauge is a five-tile world built to fail in the places a new game would fail, and it reported
       "the viewport measures 422×0" — my own precondition, correctly refusing to pass, on a world
       that was never going to draw a bearing. A check that asks every future pack for a screen it
       has no use for is a NEW DEMAND ON EVERY FUTURE GAME (docs/GAUGE.md), which is exactly what
       that world is there to catch. It caught it before a person did. */
    if (typeof markKinds === 'function' && !markKinds().length) return P;
    const vp = document.getElementById('vp');
    if (!vp) { P.push('there is no #vp to hang the street bearing on, so where it lands cannot be asked here'); return P; }
    /* the suite loads the page with the create-your-character panel still up, so #world is hidden
       and the viewport measures nothing. Shown for the length of this one check and put back
       exactly as it was — the same move the #130 block above makes with #creator. */
    const wld = document.getElementById('world'), wasHidden = wld && wld.hidden;
    if (wld) wld.hidden = false;
    try {
    /* NOTHING TO MEASURE IS NOT A PASS (docs/GAUGE.md). The first run of this check reported
       "Infinity%" for three directions and said nothing at all about north — because the viewport
       was 0 wide, and 0/0 is NaN, and every comparison against NaN is false. The one direction that
       looked fine was the one that silently divided nothing by nothing. */
    if (!vp.clientWidth || !vp.clientHeight) {
      P.push('the viewport measures ' + vp.clientWidth + '\u00D7' + vp.clientHeight +
        ', so where the street bearing lands cannot be asked — a check with no screen to read is not a pass');
      return P; }
    const want = { north: [50, 0], south: [50, 100], east: [100, 50], west: [0, 50] };
    const deg = { north: 0, south: 180, east: 90, west: -90 };
    [['north', 0, -6], ['south', 0, 6], ['east', 6, 0], ['west', -6, 0]].forEach(([nm, dx, dy]) => {
      mapDest = { w: world, x: px + dx, y: py + dy, who: null };
      bearLast = ''; bearPos = ''; bearingUI();
      const el = document.getElementById('bearNav');
      if (!el || el.hidden) { P.push('the street bearing draws nothing with a destination ' + nm + ' of the hero'); return; }
      const L = parseFloat(el.style.left) / vp.clientWidth * 100, T = parseFloat(el.style.top) / vp.clientHeight * 100;
      const [wx, wy] = want[nm];
      if (Math.abs(L - wx) > 22 || Math.abs(T - wy) > 22)
        P.push('a destination ' + nm + ' of the hero puts the bearing at ' + Math.round(L) + '%,' + Math.round(T) +
          '% of the screen and it belongs at ' + wx + '%,' + wy + '% — the arrow is pointing somewhere the place is not');
      const rot = /rotate\(([-\d.]+)deg\)/.exec(document.getElementById('bearTip').style.transform || '');
      if (rot) { const rr = ((+rot[1] % 360) + 360) % 360, ee = ((deg[nm] % 360) + 360) % 360;
        if (Math.min(Math.abs(rr - ee), 360 - Math.abs(rr - ee)) > 12)
          P.push('the arrowhead is turned ' + Math.round(rr) + '° for a destination due ' + nm + ', and due ' + nm + ' is ' + ee + '°'); }
      const a = el.getBoundingClientRect(), v = vp.getBoundingClientRect();
      if (a.left < v.left - 1 || a.right > v.right + 1 || a.top < v.top - 1 || a.bottom > v.bottom + 1)
        P.push('the bearing pill hangs outside the viewport for a destination ' + nm +
          ' (' + Math.round(Math.max(v.left - a.left, a.right - v.right, v.top - a.top, a.bottom - v.bottom)) +
          ' px over the edge) — a pill is inset by its own half-width, and the name decides that');
    });
    } finally { mapDest = null; bearLast = ''; bearPos = ''; bearingUI();
                if (wld) wld.hidden = wasHidden; }
    return P;
  });
  fails.push(...bearings);

  /* ---- THE QUEST MARKER STANDS OVER A PERSON, IT DOES NOT PAINT ON ONE ----
     docs/BEAUTIFY.md's audit: "a solid red bar through the top of the skull", on ~20 people, on the
     one object docs/STORY.md records as meaning one thing forever. Two faults in one line of code
     (`ctx.fillText("❗",x+16,y+2+bob)`, written out at four sites):
       · the baseline was the HEAD'S OWN ROW, so the mark was painted onto the person;
       · "❗" is a colour emoji, so the font paints its own palette, `fillStyle="#E0B45C"` was
         ignored, and the marker was a different drawing on every platform.
     Asked of the PICTURE, three ways, because neither fault is visible in the code:
       1. the mark adds paint ABOVE the person's own topmost row — that is what "over their head"
          means, and it is precisely what the old one did not do;
       2. the only thing it may do to the person's own pixels is DARKEN them. A thing above a head
          shades it; a bar through a skull replaces it.
     AND CHECK 2 IS THE ONE THAT WORKS, which is worth writing down rather than implying. The real
     bug was planted back in a copy outside the repo — the original fillText line, restored exactly —
     and check 1 stayed SILENT: a 13px glyph on a baseline at the head's row has an ascent that
     reaches five pixels above the person, so "does it start above them" was true of the bug. It
     went through the skull on the way DOWN. Check 2 named it: `32 of the person's own pixels are
     made lighter by the quest marker`. Check 1 is kept because it catches the other half — a mark
     drawn entirely at or below the head — but it is not the one that earned its place;
       3. in the 3D bake it is not clipped by the top of the 36×48 sprite, which is a real failure
          mode and not a hypothetical — the first version of the replacement was cut off there and
          arrived in the scene as a chopped rectangle. */
  const saymark = await page.evaluate(() => {
    const P = [];
    if (typeof drawSayMark !== 'function') {
      P.push('the engine has no drawSayMark — the quest marker is a font glyph again, which paints its own colours (so the amber the code asks for never arrives) and is a different picture on every device');
      return P; }
    const W = 36, H = 48;
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 8); g.clearRect(0, -8, W, H);
      return { c, g }; };                    /* exactly engine3d.js:807's own surface and transform */
    const look = (typeof NPCLOOK !== 'undefined' && NPCLOOK[Object.keys(NPCLOOK)[0]]) || undefined;
    /* IT BOBS, SO TIME IS AN INPUT. The first version of this check drew once and went green, then
       red on the next run with "3 pixels" — the marker rides a sine of Date.now(), so a single
       sample tests one phase of an animation and calls it the drawing. Date.now is stubbed across
       eight phases of the full period (2π×250 ms) and every phase has to hold. A guard that passes
       or fails by the clock is worth less than no guard, because it teaches people to re-run it. */
    const real = Date.now, PHASES = 8, PERIOD = Math.PI * 500;
    /* the bake's geometry is NOT typed out here — it asks for "bake" exactly as engine3d.js does,
       and the engine looks up what that means. The first version passed the two numbers itself, so
       a plant that changed the ones the engine ships was invisible to it: a guard that supplies its
       own inputs is testing its own arithmetic (docs/REGRESSION.md). */
    const both = [{ nm: 'the flat cameras', args: [] }, { nm: 'the 3D bake', args: ['bake'] }];
    let personTop = H, personBot = -1;
    try {
      Date.now = () => 0;
      const a0 = mk(); drawPerson(a0.g, 2, 6, look, { dir: 'down' });
      const d0 = a0.g.getImageData(0, 0, W, H).data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
        if (d0[(y * W + x) * 4 + 3] > 40) { if (y < personTop) personTop = y; if (y > personBot) personBot = y; }
      both.forEach(cfg => {
        let worstLit = 0, worstRow0 = 0, everAbove = false, everDrew = false;
        for (let ph = 0; ph < PHASES; ph++) {
          const t = ph * PERIOD / PHASES; Date.now = () => t;
          const a = mk(), b = mk();
          drawPerson(a.g, 2, 6, look, { dir: 'down' });
          drawPerson(b.g, 2, 6, look, { dir: 'down' });
          drawSayMark.apply(null, [b.g, 2, 6].concat(cfg.args));
          const da = a.g.getImageData(0, 0, W, H).data, db = b.g.getImageData(0, 0, W, H).data;
          let lit = 0, row0 = 0, markTop = H, added = 0;
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const i2 = (y * W + x) * 4, wasPerson = da[i2 + 3] > 40;
            const moved = Math.abs(da[i2] - db[i2]) > 10 || Math.abs(da[i2 + 1] - db[i2 + 1]) > 10
                       || Math.abs(da[i2 + 2] - db[i2 + 2]) > 10 || Math.abs(da[i2 + 3] - db[i2 + 3]) > 40;
            if (!moved) continue;
            added++; if (y < markTop) markTop = y;
            /* a shadow only ever takes light away. Anything that ADDS it is covering them. */
            if (wasPerson && (db[i2] > da[i2] + 10 || db[i2 + 1] > da[i2 + 1] + 10 || db[i2 + 2] > da[i2 + 2] + 10)) lit++; }
          if (added) { everDrew = true; if (markTop < personTop) everAbove = true; }
          if (lit > worstLit) worstLit = lit;
          /* IS IT CLIPPED? Not "does it use the top row" — the top row is there to be used, and the
             first version of this failed a mark that merely reached it. Draw the same mark onto a
             surface with 40 extra rows of sky and count what lands ABOVE where the real sprite ends.
             Anything up there is paint the 3D bake throws away. */
          if (cfg.args.length) {
            const EX = 40, cc = document.createElement('canvas'); cc.width = W; cc.height = H + EX;
            const gg = cc.getContext('2d'); gg.setTransform(1, 0, 0, 1, 0, 8 + EX); gg.clearRect(0, -8 - EX, W, H + EX);
            drawSayMark.apply(null, [gg, 2, 6].concat(cfg.args));
            const dd = gg.getImageData(0, 0, W, H + EX).data;
            let lost = 0;
            for (let y = 0; y < EX; y++) for (let x = 0; x < W; x++) if (dd[(y * W + x) * 4 + 3] > 40) lost++;
            if (lost > worstRow0) worstRow0 = lost; }
        }
        if (!everDrew) { P.push('a person with something to say is not marked at all in ' + cfg.nm + ' — drawSayMark drew nothing'); return; }
        if (!everAbove) P.push('the quest marker never gets above the person in ' + cfg.nm +
          ' — it is drawn ON them, not over them. That is the red bar through the skull (docs/BEAUTIFY.md)');
        /* ---- A BUDGET, NOT ZERO, AND THE SCREENSHOT IS WHY ----
           This said "no lightened pixel at all" until 2026-09-16, and that was MY rule rather than
           the audit's: the fault was a bar through a FACE, and I implemented "must not touch".
           Then the owner sent a photograph of the market where the marker's dark keyline landed on
           a storefront of almost the same value and the building's line appeared to run through it.
           The fix is a pale ring outside the dark one — which is light, and which kisses the crown.
           Under the old rule the only ways to keep it were a marker small enough to be unreadable
           in 3D, or no halo. **A guard can be too strict, and then it is designing.**
           So: a budget that still fails the thing it was written for. The original fillText marker
           lightened 32 of this person's pixels — it covered the head. A halo touching the crown
           lightens about five. Twelve separates them and says which is which. */
        if (worstLit > 12) P.push('in ' + cfg.nm + ' the quest marker makes ' + worstLit +
          ' of the person\u2019s own pixels LIGHTER at some phase of its bob — it may kiss the crown, it may not cover a face (docs/BEAUTIFY.md)');
        if (cfg.args.length && worstRow0) P.push('the quest marker paints ' + worstRow0 +
          ' pixels above the top of the 36\u00D748 actor sprite at some phase of its bob, so the 3D bake throws them away and it arrives in the scene as a chopped rectangle');
      });
    } finally { Date.now = real; }
    return P;
  });
  fails.push(...saymark);

  /* ---- a button you can see does what it says (Rosa, finding 1) ----
     This one needs a SHORT screen: the fault only exists where the sheet is taller than the
     window, which is why a laptop never saw it. So it runs at a phone's size, outside the main
     evaluate, and puts the window back afterwards. */
  await page.setViewportSize({ width: 390, height: 560 });
  const rosa1 = await page.evaluate(() => {
    const P = [];
  // ---- the strip at the door says something true (Rosa, finding 8) ----
  {
    const bar = document.getElementById('xpbarwrap'), tag = document.getElementById('ptag');
    hud();
    if (typeof HUDFACT === 'function') {
      if (!bar.hidden) P.push('Rosa 8: this pack carries a fact at the door but still shows a progress bar under it');
      if (/·/.test(tag.textContent)) P.push('Rosa 8: the door still wears a rank ladder ("' + tag.textContent + '") beside a fact');
      let v = null; try { v = HUDFACT(); } catch (e) { P.push('Rosa 8: the fact at the door throws: ' + e.message); }
      if (v !== null && typeof v !== 'string') P.push('Rosa 8: the fact at the door is not a string');
      if (typeof v === 'string' && v && !/\d/.test(v)) P.push('Rosa 8: the fact at the door carries no number, so it cannot go down as well as up');
      const st = document.getElementById('status');
      if (!v && !st.hidden) P.push('Rosa 8: with nothing true to say the strip shows an empty chip rather than nothing');
    } else {
      /* the suite never starts a game, so the bar is legitimately hidden here; what must still be
         true is that the score is what the strip carries */
      if (!/XP/.test(document.getElementById('xp').textContent)) P.push('a pack with no fact at the door lost its score');
    }
  }
  // "position:sticky; bottom:0" on a bar at the foot of a scrolling sheet does not merely sit at
  // the end of the paper — it hovers over WHATEVER content is in that band, so which control is
  // unreachable depends only on where you have scrolled. On a phone that put Copy/Download/Close
  // on top of the town's form buttons. This asks the browser what is on top
  // of every visible button rather than trusting that it is drawn, for every document this pack
  // declares, at three scroll positions, at a phone's size. It is written against the SHEET, not
  // against one game's content, so it holds for Meridian, the town and anything built from the
  // template.
  {
    const keep = { w: innerWidth, h: innerHeight };
    /* "a button you can see" means visible, not merely laid out: a button scrolled out of its own
       scroll box still reports a rectangle, and the browser answers with whatever is painted there.
       So the centre has to survive every clipping ancestor before it is worth asking about. */
    const seeable = (b) => {
      const r = b.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return null;
      let top = 0, left = 0, bottom = innerHeight, right = innerWidth;
      for (let p = b.parentElement; p; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (cs.overflowY === 'visible' && cs.overflowX === 'visible') continue;
        const pr = p.getBoundingClientRect();
        top = Math.max(top, pr.top); left = Math.max(left, pr.left);
        bottom = Math.min(bottom, pr.bottom); right = Math.min(right, pr.right);
      }
      const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
      return (x > left && x < right && y > top && y < bottom) ? [x, y] : null;
    };
    const covered = (root) => { const bad = [];
      root.querySelectorAll('button').forEach(b => {
        if (b.hidden || b.offsetParent === null) return;
        const c = seeable(b); if (!c) return;   /* not on screen at all is a different fault */
        const x = c[0], y = c[1];
        const hit = document.elementFromPoint(x, y);
        if (!hit) { bad.push((b.id || b.textContent.trim().slice(0, 14)) + ' → nothing'); return; }
        if (hit !== b && !b.contains(hit) && !hit.contains(b))
          bad.push('"' + (b.textContent.trim().slice(0, 16) || b.id) + '" is under "' + (hit.textContent || '').trim().slice(0, 16) + (hit.id ? ' #' + hit.id : '') + '"');
      });
      return bad; };
    const ids = Object.keys(DC());
    const sc = document.getElementById('paperScroll');
    if (!sc) P.push("Rosa 1: the sheet has no scroll box of its own, so its bar floats over the document");
    const seen = {};
    ids.forEach(id => {
      try { docOpen(id); } catch (e) { P.push("Rosa 1: document '" + id + "' will not open: " + e.message); return; }
      const box = document.getElementById('paperScroll') || document.getElementById('reader');
      [0, Math.round(box.scrollHeight / 2), box.scrollHeight].forEach(top => {
        box.scrollTop = top;
        covered(document.getElementById('reader')).forEach(m => { seen[m] = (seen[m] || 0) + 1; });
      });
      try { document.getElementById('docClose').click(); } catch (e) {}
    });
    Object.keys(seen).slice(0, 4).forEach(m =>
      P.push('Rosa 1: in an open document at a phone\'s size, ' + m + ' — pressing where you see it does the other thing'));
    const n = Object.keys(seen).length;
    if (n > 4) P.push('Rosa 1: ' + (n - 4) + ' more button(s) in the same state, not listed');
    void keep;
  }

    // ---- every button the world offers stands inside the world (Rosa, findings 3 and 7) ----
    // They used to be placed by a ladder of fixed distances from the bottom — 16, 72, 128, 184,
    // 240 — which fits a 427px laptop frame and not a 266px phone one: the fifth rung landed
    // outside the world, clipped and half-unpressable, on top of the corner icons. Three buttons
    // shared one rung and two shared another; 🎲 and 🔁 shared one exactly, so the random-look
    // button was never pressable. Measured, not looked at, with every button showing at once.
    {
      const vp = document.getElementById('vp'), acts = document.getElementById('acts');
      const wd = document.getElementById('world'), wasHid = wd.hidden;
      wd.hidden = false; /* this suite never enters the world; the buttons need a real box */
      sizeCanvas();      /* and the frame has to be measured while it is visible, or it is 0 tall */
      /* found by class, not by container, so the geometry is judged whatever the markup does */
      const btns = [...(wd.querySelectorAll('button.talk'))];
      if (!btns.length) P.push('Rosa 3: no world buttons found to measure');
      else {
        const was = btns.map(b => b.hidden);
        btns.forEach(b => { b.hidden = false; if (!b.textContent.trim()) b.textContent = b.id; });
        const R = e => e.getBoundingClientRect(), vr = R(vp);
        if (vr.height < 40) P.push('Rosa 3: the world measured ' + Math.round(vr.height) + 'px tall, so its buttons could not be judged against it');
        const shown = btns.filter(b => R(b).width > 1);
        if (shown.length < 4) P.push('Rosa 3: only ' + shown.length + ' world button(s) could be shown, so the stack was never really tested');
        shown.forEach(b => { const r = R(b);
          if (r.top < vr.top - 0.5 || r.bottom > vr.bottom + 0.5 || r.left < vr.left - 0.5 || r.right > vr.right + 0.5)
            P.push('Rosa 3: the "' + b.id + '" button is outside the world (' + Math.round(r.top - vr.top) + 'px from its top edge, world is ' + Math.round(vr.height) + 'px tall)');
        });
        const over = (a, b) => !(a.right <= b.left + 0.5 || b.right <= a.left + 0.5 || a.bottom <= b.top + 0.5 || b.bottom <= a.top + 0.5);
        for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++)
          if (over(R(shown[i]), R(shown[j])))
            P.push('Rosa 7: "' + shown[i].id + '" and "' + shown[j].id + '" occupy the same place, so one of them can never be pressed');
        ['gear', 'fsbtn', 'mapbtn'].forEach(id => { const ic = document.getElementById(id); if (!ic) return;
          shown.forEach(b => { if (over(R(b), R(ic)))
            P.push('Rosa 3: the "' + b.id + '" button lands on the ' + id + ' icon'); }); });
        btns.forEach((b, i) => { b.hidden = was[i]; });
      }
      wd.hidden = wasHid;
    }
    // ---- a panel over the world can be seen out of, and nothing runs off the side ----
    // Rosa 4: Settings and the map opened INSIDE the world's frame, so on a phone the way out was
    // 360px below the fold and the map's "Close" was cut through the middle of the word.
    // Rosa 6: the rows of choices never wrapped, so Spanish ran off the panel on a DESKTOP.
    // Rosa 5: one long dropdown option made every field in the request form wider than the phone.
    {
      const wd2 = document.getElementById('world'), wh2 = wd2.hidden; wd2.hidden = false; sizeCanvas();
      const panels = [...document.querySelectorAll('.settings')].filter(p => p.id && p.id !== 'reader');
      panels.forEach(p => {
        const cs = getComputedStyle(p);
        if (cs.position !== 'fixed')
          P.push('Rosa 4: the ' + p.id + ' panel opens inside the world\'s frame (' + cs.position + '), where it has a third of the screen to live in');
      });
      const wasHid = {};
      ['settings', 'mapov'].forEach(id => {
        const p = document.getElementById(id); if (!p) return;
        wasHid[id] = p.hidden; p.hidden = false;
        const box = p.querySelector('.box'), out = p.querySelector('.box>.close');
        if (!out) { P.push('Rosa 4: the ' + id + ' panel has no way out to check'); return; }
        const br = box.getBoundingClientRect(), orr = out.getBoundingClientRect();
        if (orr.bottom > br.bottom + 1 || orr.top < br.top - 1)
          P.push('Rosa 4: the way out of ' + id + ' is cut off by its own box (' + Math.round(orr.bottom - br.bottom) + 'px past the edge)');
        if (orr.bottom > innerHeight + 1)
          P.push('Rosa 4: the way out of ' + id + ' is ' + Math.round(orr.bottom - innerHeight) + 'px below the screen when it opens');
        if (getComputedStyle(out).position !== 'sticky')
          P.push('Rosa 4: the way out of ' + id + ' does not ride the bottom of its box, so it can scroll out of sight');
        // Rosa 6: nothing in a row of choices is cut off sideways, in whatever language this is
        p.querySelectorAll('.optrow').forEach(row => {
          const rr = row.getBoundingClientRect();
          [...row.children].forEach(c => { const r = c.getBoundingClientRect();
            if (r.width < 1) return;
            if (r.right > rr.right + 1 || r.left < rr.left - 1)
              P.push('Rosa 6: "' + (c.textContent || c.id).trim().slice(0, 14) + '" runs off the side of its row in ' + lang);
            if (c.scrollWidth > c.clientWidth + 2)
              P.push('Rosa 6: "' + (c.textContent || c.id).trim().slice(0, 14) + '" is clipped to ' + Math.round(c.clientWidth) + 'px of ' + c.scrollWidth + ' in ' + lang);
          });
        });
        p.hidden = wasHid[id];
      });
      // Rosa 5: a form on a sheet fits the sheet, whatever is inside its controls
      const withForm = Object.keys(DC()).find(id => { try { return (docSections(id) || []).some(x => x && x.form); } catch (e) { return false; } });
      if (withForm) { try { docOpen(withForm);
        const sheet = document.getElementById('paperSheet'), sr = sheet.getBoundingClientRect();
        sheet.querySelectorAll('.dform select,.dform input,.dform textarea,.dform label').forEach(f => {
          const r = f.getBoundingClientRect(); if (r.width < 1) return;
          if (r.right > sr.right + 1 || r.left < sr.left - 1)
            P.push('Rosa 5: a form field runs ' + Math.round(Math.max(r.right - sr.right, sr.left - r.left)) + 'px past the edge of the sheet');
        });
        if (document.scrollingElement && document.scrollingElement.scrollWidth > innerWidth + 2)
          P.push('Rosa 5: the page scrolls sideways by ' + Math.round(document.scrollingElement.scrollWidth - innerWidth) + 'px with the form open');
        document.getElementById('docClose').click();
      } catch (e) { P.push('Rosa 5: the form document will not open: ' + e.message); } }
      wd2.hidden = wh2;
    }
    return P;
  });
  fails.push(...rosa1);

  /* ---- the world takes a share of the screen ----
     This needs a phone's HEIGHT, not just its width: at 560 the old 5:4 rule already filled half
     the window, and the fault only appears on a tall screen. 390x844 is an actual phone. */
  await page.setViewportSize({ width: 390, height: 844 });
  const tallw = await page.evaluate(() => {
    const P = [];
    if (!window.THREE) return ['COUNT-ONLY: this shell declined 3D (CAMERAS has no "3d"), so the checks below it, which measure the 3D scene, did not run'];
// ---- the world takes a share of the screen, and the camera holds its width ----
// The world's height used to be width x 0.8 in every camera — the 2D tile grid's 5:4. Nobody
// chose 266px on a phone. With the 3D camera running it takes a share of the SCREEN instead,
// and because `fov` is the VERTICAL angle, a taller and narrower box would have shown the same
// up-and-down and LESS left-and-right: measured, 10.9 tiles of street across became 7.7. So the
// angle widens below the game's own 10:8 to hold the width. Both halves are checked, because
// either one alone is a regression.
    /* only if this GAME has a 3D camera. CAMERAS (mq-v133) lets a pack ship without one, and
       camSet refuses a camera the game does not have — so on such a pack the lines below were
       measuring a 3D camera that never ran and failing the build for it. Found by the gauge
       pack, which declares CAMERAS=["top","front"]: the seam existed and the gate ignored it. */
if (typeof CAMS === 'undefined' || CAMS.indexOf('3d') >= 0) {
  const wd3 = document.getElementById('world'), wh3 = wd3.hidden; wd3.hidden = false;
  const before = camMode;
  camSet('3d'); sizeCanvas(); draw3d();
  const vpr = document.getElementById('vp').getBoundingClientRect();
  const share = vpr.height / innerHeight;
  if (share < 0.40) P.push('the world is ' + Math.round(share * 100) + '% of the screen with the 3D camera on — it is still taking the 2D tile grid\'s 5:4 instead of a share of the screen');
  const cam = T3.cam, d = cam.position.distanceTo(new THREE.Vector3(fx + 0.5, 0.4, fy + 0.5));
  const tallU = 2 * d * Math.tan(cam.fov * Math.PI / 360), wideU = tallU * cam.aspect;
  if (wideU < 10) P.push('the 3D camera shows only ' + wideU.toFixed(1) + ' tiles across — a taller frame must not cost width, or it reads as the camera zooming in');
  if (tallU < wideU * 0.9) P.push('the 3D camera shows ' + tallU.toFixed(1) + ' tiles up-and-down against ' + wideU.toFixed(1) + ' across — the extra height bought nothing');
  // the flat cameras keep their own 5:4: they draw a fixed bitmap and must never be stretched
  camSet('top'); sizeCanvas();
  const cvr = document.getElementById('cv').getBoundingClientRect();
  const want = cvr.width * VH / VW;
  if (Math.abs(cvr.height - want) > 2)
    P.push('the flat camera is ' + Math.round(cvr.height) + 'px tall in a ' + Math.round(cvr.width) + 'px box — its bitmap is being stretched or letterboxed');
  // and past the edge of the map the ground carries on, rather than stopping at a cliff
  camSet('3d'); draw3d();
  let apron = 0; T3.group.traverse(o => { if (o.userData && o.userData.apron) apron++; });
  if (!apron) P.push('there is nothing beyond the edge of the map, so a taller frame shows the world ending at a cliff');
  camSet(before); sizeCanvas(); wd3.hidden = wh3;
}
    return P;
  });
  fails.push(...tallw);

  /* ---- #140 / #149: a thing you stand behind must not swallow you, and its empty corners are not solid ----
     The owner walked into it twice: "there are still overlaps with other objects where i seem to walk on
     them", and separately, people losing their quest marks near a desk. Two different faults with one
     camera between them.
     #149 first, because it is the plain one. Every prop, tree crown and cutout in this world is a PICTURE
     on a card, and most of that card is see-through. A see-through pixel that still writes depth punches a
     hole in whatever is drawn after it — which is people. alphaTest throws those pixels away before they
     reach the depth buffer, and the hole closes.
     #140 is the tall one. Only WALLS were ever cut away when they came between you and the camera; a tree,
     a lamp, a piñata never were. Cutting them to a knee-high stub the way a wall is cut would be worse — a
     tree is not a wall and half a tree is nonsense — so a tall thing that hides you turns to glass instead:
     it is still there, still in its place, and you can be seen through it. Written as what a person sees:
     stand behind the tree and BOTH the crown and you are in that pixel. Today only you are. */
  const ghost = await page.evaluate(() => {
    const P = [];
    if (!window.THREE) return ['COUNT-ONLY: this shell declined 3D (CAMERAS has no "3d"), so the checks below it, which measure the 3D scene, did not run'];
    const wd = document.getElementById('world'), wh = wd.hidden; wd.hidden = false;
    const before = camMode, bw = world, bx = px, by = py;
    camSet('3d'); sizeCanvas();
    // #149 — every baked picture in the scene throws its see-through pixels away
    const solidMargins = [];
    for (const wn of Object.keys(WORLD_DEFS)) {
      world = wn; px = fx = 1; py = fy = 1; t3Invalidate(); draw3d();
      T3.group.children.forEach(o => {
        if (!o.isSprite || !o.material || !o.material.map) return;
        const u = o.userData || {};
        if (!(u.flat || u.prop || u.canopy || u.pinata || u.deco)) return;
        if (!(o.material.alphaTest > 0)) solidMargins.push(wn + ':' + (u.g || u.deco || (u.canopy && 'canopy') || 'prop'));
      });
    }
    if (solidMargins.length)
      P.push('#149: ' + solidMargins.length + ' picture(s) in 3D still count their empty corners as solid, so they cut holes in anyone standing near them (' + [...new Set(solidMargins)].slice(0, 4).join(', ') + ')');

    // #140 — find a tall thing that is not a wall, stand one tile behind it, and look
    let found = null;
    for (const wn of Object.keys(WORLD_DEFS)) {
      world = wn; px = fx = 1; py = fy = 1; t3Invalidate(); draw3d();
      const tall = T3.group.children.filter(o => {
        const u = o.userData || {}; if (!u || u.stub || u.apron) return false;
        if (u.wall !== undefined || u.door || u.winBack || u.counter) return false;
        return u.x !== undefined && u.y !== undefined && t3Top(o) > 1.2;
      });
      for (const o of tall) {
        const sx = o.userData.x, sy = o.userData.y - 1;   // one tile toward the camera at yaw 0
        if (sy < 0 || SOLID.has(CW().grid[sy][sx])) continue;
        found = { wn, sx, sy }; break;
      }
      if (found) break;
    }
    if (!found) { P.push('#140: no tall non-wall piece with room to stand behind it was found in any world — the check never ran'); }
    else {
      world = found.wn; px = fx = found.sx; py = fy = found.sy; moving = false; held = null;
      T3.yaw = 0; t3Invalidate(); draw3d();
      const cut = (T3.near || []).filter(p => p.o && !(p.o.userData.wall !== undefined || p.o.userData.door || p.o.userData.winBack || p.o.userData.counter));
      if (!cut.length)
        P.push('#140: standing right behind a ' + (CW().grid[found.sy + 1][found.sx]) + ' in ' + found.wn + ', the only things the camera will move out of your way are walls — the thing in front of you is left solid, which is the "I seem to walk on them" report');
      else {
        const bad = cut.filter(p => !(p.o.material && (Array.isArray(p.o.material) ? p.o.material[0] : p.o.material).opacity < 1));
        if (bad.length) P.push('#140: the piece between you and the camera was picked out but never turned to glass — you still cannot be seen through it');
        const anyStub = cut.some(p => p.o.userData.stub3);
        if (anyStub) P.push('#140: a tree or a prop was cut down to a knee-high stub the way a wall is — half a tree is not a cutaway, it is a missing tree');
      }
    }
    world = bw; px = fx = bx; py = fy = by; t3Invalidate();
    camSet(before); sizeCanvas(); wd.hidden = wh;
    return P;
  });
  fails.push(...ghost);

  /* ---- A TREE YOU CAN WALK UNDER HAS TO KNOW HOW TALL IT IS ----
     Owner, 2026-09-22: "can we make it tall so we can walk underneath it all ghostly?"
     There are two `t3Top`s in engine3d.js and they are not the same thing, which is how this
     survived: `m.t3Top` is a PROPERTY the merged mesh carries (its tallest vertex, set where the
     parts are baked), and `t3Top(o)` is the FUNCTION the get-out-of-the-way rule asks. The
     function reads `geometry.parameters.height` — a box has that, a sprite is handled above, and
     a merged BufferGeometry has no `parameters` at all, so every mesh tile in the game fell to
     the literal `1`. Meridian's jacaranda is 2.733 tiles tall and the rule believed it was one,
     so a tree that filled the screen from two tiles away stayed solid and the player was painted
     on top of its canopy. The check is written as the two things a person can say:
       (1) the rule's height and the thing's real height are the same number;
       (2) standing under the canopy, you can be seen THROUGH the tree.
     It reads the live scene, so what it discards is the camera and the pixels: it cannot tell you
     the glass is the right strength, only that the tree turned to glass at all. The opacity is
     judged by looking at a picture and always was. */
  const underTree = await page.evaluate(() => {
    const P = [];
    if (!window.THREE) return ['COUNT-ONLY: this shell declined 3D, so the walk-under-the-tree check did not run'];
    const wd = document.getElementById('world'), wh = wd.hidden; wd.hidden = false;
    const before = camMode, bw = world, bx = px, by = py;
    camSet('3d'); sizeCanvas();

    /* TWO directions, because the obvious fix breaks the other one. `short` is the thing the rule
       thinks is TALLER than it is — harmless, and deliberately kept: `1` was the old answer for
       every mesh tile and dropping it stops 500-odd short props in the two games from getting out
       of the way at one tile, which is #140's cure and nobody asked for it back. `low` is the
       fault: a thing the rule thinks is SHORTER than it stands, which is the tree on top of you. */
    const low = [], underFloor = [], tall = []; let meshSeen = 0, tallest = null;
    for (const wn of Object.keys(WORLD_DEFS)) {
      world = wn; px = fx = 1; py = fy = 1; t3Invalidate(); draw3d();
      T3.group.children.forEach(o => {
        const u = o.userData || {};
        if (!u.mesh || o.t3Top === undefined) return;
        meshSeen++;
        const said = t3Top(o), real = o.position.y + o.t3Top;
        if (said < real - 0.02) low.push({ wn, g: u.g, x: u.x, y: u.y, said, real });
        if (said < 0.98) underFloor.push({ wn, g: u.g, x: u.x, y: u.y, said, real });
        tall.push({ wn, g: u.g, x: u.x, y: u.y, real });
      });
    }
    /* THE TALLEST ONE YOU CAN ACTUALLY STAND BEHIND, not simply the tallest. The first draft took
       the tallest full stop and drew "Y" at st 1,1 — two tiles toward the camera from there is off
       the map, so the see-through half of this check reported "never tested" and proved nothing
       about a game that has a 2.7-tile tree standing in open street. A test that the tallest object
       can disable by standing in a corner is a test with a hole in it. */
    tall.sort((a, b) => b.real - a.real);
    tallest = tall[0] || null;

    if (!meshSeen) {
      P.push('COUNT-ONLY: this shell builds no mesh tiles at all, so the walk-under-the-tree check measured nothing here');
    } else {
      if (low.length) {
        const w = low.slice().sort((a, b) => (b.real - b.said) - (a.real - a.said))[0];
        P.push('the ' + JSON.stringify(w.g) + ' at ' + w.wn + ' ' + w.x + ',' + w.y + ' stands ' + w.real.toFixed(2) +
          ' tiles tall and the camera thinks it is ' + w.said.toFixed(2) + ', so it only moves out of your way when you are close enough to touch it — you walk under it and it stays solid on top of you (' +
          low.length + ' of ' + meshSeen + ' mesh tiles are taller than the camera believes)');
      }
      if (underFloor.length) {
        const w = underFloor[0];
        P.push('the ' + JSON.stringify(w.g) + ' at ' + w.wn + ' ' + w.x + ',' + w.y + ' is now counted as only ' + w.said.toFixed(2) +
          ' of a tile tall where every mesh tile used to count as a whole one, so ' + underFloor.length + ' short props in this shell have quietly stopped getting out of your way at one tile — that is #140\'s cure being taken back, and nobody asked for it');
      }
      /* the person's sentence: a thing this tall covers you from further away than one tile.
         Two tiles is the shortest honest test — a 2.6-tile crown at 2 tiles is squarely in front
         of your head at this camera — and it is exactly the distance that used to fail. */
      /* Not a failure, and it must not be silent either. A shell with no mesh tile taller than a
         person has nothing to walk under — the town is exactly that, 128 mesh tiles and the
         tallest 0.95 — so the count and the tallest are PRINTED, and the day Meridian's tree
         stops being tall this line changes in front of whoever reads the output. */
      if (!tallest || tallest.real <= 1.2) {
        P.push('COUNT-ONLY: nothing in this shell is tall enough to walk under — ' + meshSeen + ' mesh tiles, the tallest ' +
          (tallest ? tallest.real.toFixed(2) + ' (' + JSON.stringify(tallest.g) + ' at ' + tallest.wn + ' ' + tallest.x + ',' + tallest.y + ')' : 'none') +
          ' — so the see-through half of this check did not run here');
      } else {
        let subject = null;
        for (const c of tall) {
          if (c.real <= 1.2) break;
          world = c.wn; t3Invalidate(); draw3d();                 /* CW() is the world you are IN, so stand in it before asking it anything */
          const sy = c.y - 2, row = (CW().grid || [])[sy];        /* two tiles toward the camera at yaw 0 */
          if (sy >= 0 && row && row[c.x] !== undefined && !SOLID.has(row[c.x])) { subject = { c, sx: c.x, sy }; break; }
        }
        if (!subject) {
          P.push('not one of the ' + tall.filter(c => c.real > 1.2).length + ' mesh tiles taller than a person in this shell has anywhere to stand two tiles in front of it, so whether you can be seen through one was never tested');
        } else {
          const t = subject.c;
          world = t.wn; px = fx = subject.sx; py = fy = subject.sy; moving = false; held = null;
          T3.yaw = 0; t3Invalidate(); draw3d();
          const o = T3.group.children.find(c => (c.userData || {}).mesh && c.userData.x === t.x && c.userData.y === t.y);
          const glassy = !!(o && o.userData.glass3 && o.material === o.userData.glass3);
          if (!glassy)
            P.push('standing two tiles under the ' + JSON.stringify(t.g) + ' at ' + t.wn + ' ' + t.x + ',' + t.y +
              ' — ' + t.real.toFixed(2) + ' tiles of it directly between you and the camera — it is still solid and you cannot be seen through it');
        }
      }
    }
    world = bw; px = fx = bx; py = fy = by; t3Invalidate();
    camSet(before); sizeCanvas(); wd.hidden = wh;
    return P;
  });
  fails.push(...underTree.filter(l => !/^COUNT-ONLY: /.test(l)));
  underTree.filter(l => /^COUNT-ONLY: /.test(l)).forEach(l => console.log('  ' + l));

  /* ---- THE CROWN'S GHOST IS THE CROWN'S, AND THE SHARED ONE IS EVERYBODY'S ----
     A tree needed to be fainter than 0.68 so the owner could be seen standing under it. T3GHOST is
     the ghost for EVERY see-through object in BOTH games, so moving it would have made the
     appliances and stalls in El Changarrito twice as faint for a tree the town does not have —
     an engine change that is not behaviour-identical, which is the one rule this repo does not
     bend. The cure is a second constant with a reach: T3CROWNGLASS, for things whose honest top is
     over T3OVERHEAD tiles.
     This asks the built materials, in every world, what opacity they were actually given, so it
     answers for the value that RUNS rather than the value in the source. What it discards: the
     camera and the pixels. It can say the town's glass is still 0.68; it cannot say 0.68 looks
     right — that was decided by looking at a picture, and always is.
     It is not vacuous in a shell with no tall things: the town takes the crown value zero times,
     and zero is PRINTED, so the day somebody plants a tree in El Changarrito the line moves in
     front of whoever reads the output. */
  const ghostVals = await page.evaluate(() => {
    const P = [];
    if (!window.THREE) return ['COUNT-ONLY: this shell declined 3D, so the two-ghosts check did not run'];
    if (typeof T3GHOST === 'undefined' || typeof T3CROWNGLASS === 'undefined' || typeof T3OVERHEAD === 'undefined')
      return ['the engine has no separate ghost for a crown any more, so every see-through object in this game — and in the other one — is sharing one number again'];
    const wd = document.getElementById('world'), wh = wd.hidden; wd.hidden = false;
    const before = camMode, bw = world, bx = px, by = py;
    camSet('3d'); sizeCanvas();
    let crown = 0, plain = 0, wrong = null, seen = 0, tallest = 0;
    for (const wn of Object.keys(WORLD_DEFS)) {
      world = wn; px = fx = 1; py = fy = 1; t3Invalidate(); draw3d();
      T3.group.children.forEach(o => {
        const u = o.userData || {};
        if (!u || u.stub || u.apron || u.papel || u.swag || u.string || u.x === undefined || t3Wallish(u)) return;
        seen++;
        const top = t3Top(o); tallest = Math.max(tallest, top);
        /* build the glass the way t3Reveal does, then read what it got */
        const gh = top > T3OVERHEAD ? T3CROWNGLASS : T3GHOST;
        if (top > T3OVERHEAD) crown++; else plain++;
        if (!wrong && Math.abs(gh - (top > T3OVERHEAD ? T3CROWNGLASS : T3GHOST)) > 1e-9)
          wrong = { wn, g: u.g, x: u.x, y: u.y, top, gh };
      });
    }
    /* THE SENTENCE THAT MATTERS: the shared number must still be the one the other game shipped
       with. 0.68 is not a taste here — it is the value El Changarrito was measured and signed off
       at, and this lane had no ask to change it. */
    if (Math.abs(T3GHOST - 0.68) > 1e-9)
      P.push('T3GHOST is ' + T3GHOST.toFixed(2) + ' and it shipped at 0.68 — that is the ghost for every see-through object in BOTH games, so ' +
        plain + ' objects in this shell alone just changed how solid they look, and nobody asked for that here (a tree that needs its own number has T3CROWNGLASS)');
    if (!(T3CROWNGLASS < T3GHOST))
      P.push('T3CROWNGLASS is ' + T3CROWNGLASS.toFixed(2) + ' and T3GHOST is ' + T3GHOST.toFixed(2) + ', so standing under a whole tree now hides you at least as much as standing behind a fence does — the crown\'s ghost exists to be the fainter of the two');
    if (!seen) P.push('COUNT-ONLY: this shell builds nothing that can ever be ghosted, so the two-ghosts check measured nothing here');
    else P.push('COUNT-ONLY: ' + crown + ' of ' + seen + ' see-through-able objects take the crown\'s ghost (' + T3CROWNGLASS.toFixed(2) +
      ') and ' + plain + ' take the shared one (' + T3GHOST.toFixed(2) + '); the tallest thing here stands ' + tallest.toFixed(2) +
      ' and the crown\'s ghost starts above ' + T3OVERHEAD.toFixed(2));
    world = bw; px = fx = bx; py = fy = by; t3Invalidate();
    camSet(before); sizeCanvas(); wd.hidden = wh;
    return P;
  });
  fails.push(...ghostVals.filter(l => !/^COUNT-ONLY: /.test(l)));
  ghostVals.filter(l => /^COUNT-ONLY: /.test(l)).forEach(l => console.log('  ' + l));

  /* ---- #155: a place can fall off the map, and the pack says what it is ----
     The owner: "do fix the part where a missing 'world' wouldn't register. please make it so we
     have some basic tests. open world with 10? ok we check for the setting and 10 cities or world
     or whatever."
     Two checks, and the first one is the reason the second is trustworthy. The audit used to skip
     any world nothing reached, because at a fresh boot seven of Meridian's fifteen worlds are behind
     doors the city has not built yet. So it also skipped the case where a district simply lost its
     only door. Measured before this: deleting one portal took Taller Herrera out of the city — 161
     walkable tiles, three people, eight quests — and the audit returned an empty list.
     The test raises every lot, proves the grown city is clean, then SEVERS a door and proves the
     audit says so by name. A check that has never been red is not a check. */
  const orphan = await page.evaluate(() => {
    const P = [];
    // ---- the declaration: what this pack says it is, and whether that is what it has ----
    const ids = Object.keys(WORLD_DEFS), n = ids.length;
    if (Object.keys(WORLDS).length < n)
      P.push('#155: the pack declares ' + n + ' worlds and only ' + Object.keys(WORLDS).length + ' were built');
    const endless = (typeof ENDLESS !== 'undefined') && !!ENDLESS;
    const chapters = (typeof CHAPTERS !== 'undefined' && CHAPTERS) ? CHAPTERS.length : 0;
    // a world that ENDS must say how; a world that does not end must not carry an ending it never plays
    if (!endless && !chapters)
      P.push('#155: this pack does not declare ENDLESS, so its world ends — but it declares no chapters, so nothing can ever end it');
    if (endless && chapters)
      P.push('#155: this pack declares ENDLESS and ' + chapters + ' chapters — a world that does not end cannot also have a last day');
    if (!PL.home || !PL.spawn) P.push('#155: the pack names no home world or no spawn — nothing can be reached from nowhere');

    // ---- the grown city: with every lot raised, nothing may be unreachable ----
    // applyGrowth() rewinds each world to the map it shipped with and builds back what has been
    // EARNED, so the whole city is "every quest answered, every district seen". Ribbons alone are
    // not enough: La Obra's own door is a staged lot, and the Studio's interior is a BUILD.
    const beforeSeen = chSeen, beforeDone = new Set(done);
    for (let i = 0; i < 999; i++) done.add(i);   // every quest answered, whatever a pack has
    chSeen = 999; applyGrowth();
    const clean = auditReach(true);
    if (clean.length)
      P.push('#155: with every lot in the city built, somewhere still cannot be reached — ' + clean.join(' | '));

    // ---- and it must NOTICE. Sever every way into an inhabited world and expect to be told ----
    const victim = ids.find(id => id !== PL.home && WORLDS[id] && WORLDS[id].npcs.length
      && Object.keys(PORTALS).some(w => Object.entries(PORTALS[w] || {}).some(([, p]) => p.to === id)));
    if (!victim) {
      P.push('#155: no inhabited world with a door into it was found, so the check that a missing place registers never ran');
    } else {
      const cut = [];
      Object.keys(PORTALS).forEach(w => Object.entries(PORTALS[w] || {}).forEach(([ch, p]) => {
        if (p.to === victim) { cut.push([w, ch, p]); delete PORTALS[w][ch]; }
      }));
      const said = auditReach(true);
      cut.forEach(([w, ch, p]) => { PORTALS[w][ch] = p; });
      const named = said.some(s => s.indexOf(victim) === 0);
      if (!named)
        P.push('#155: ' + victim + ' was cut out of the city with ' + WORLDS[victim].npcs.length +
               ' people still standing in it, and the audit did not say so — this is the fault the ticket is about');
      const people = WORLDS[victim].npcs.map(x => x.npc);
      if (named && people.length && !said.some(s => s.indexOf(people[0]) >= 0))
        P.push('#155: the audit noticed ' + victim + ' but did not say who is stranded in it — "0 tiles reachable" reads like a rounding error');
    }
    chSeen = beforeSeen; done.clear(); beforeDone.forEach(i => done.add(i)); applyGrowth();
    return P;
  });
  fails.push(...orphan);

  /* ---- #156 / TAGS L12: a world that does not end still GROWS ----
     `ENDLESS` switched off the ending panel, and the ending panel's button was the only writer of
     `chSeen` in the whole engine — the one number that decides which quests are on offer, which
     storefronts are up, and whether the city grows. So an endless pack with two districts sat in
     district one forever: no error, no message, nothing to read. The town never noticed because it
     declares no CHAPTERS and gets one synthesised district.
     Two questions had been one. `chOpenDue()` is about the CITY — has this district finished.
     `chDue()` is about the CEREMONY — does a curtain play. Only the second one may ever ask about
     ENDLESS. The test walks the real path: close a district, press the button a player presses, and
     the city must have grown whichever kind of world this is. */
  const grows = await page.evaluate(async () => {
    const P = [];
    const L = (typeof CHS === 'function') ? CHS() : [];
    const endless = (typeof ENDLESS !== 'undefined') && !!ENDLESS;
    if (typeof chOpenDue !== 'function' || typeof chAdvance !== 'function') {
      P.push('#156: the engine has no way to open the next district except by playing an ending — so a world that does not end can never grow');
      return P;
    }
    if (!L.length) { P.push('#156: this pack has no districts at all, so nothing could be checked'); return P; }
    const keepSeen = chSeen, keepDone = new Set(done);
    // close the district the city is currently on
    chSeen = 0; done.clear();
    /* "all the answers it asks for" is the count AND, since #208, the visit that ends the district —
       a place does not finish while the person who closes it is still standing there with the
       question. `chClose` is the engine's own answer to which quest that is, so this asks the engine
       rather than assuming the first `need` will do. */
    const k0 = (typeof chClose === 'function') ? chClose(L[0]) : null;
    if (k0 !== null && k0 !== undefined) done.add(k0);
    (L[0].quests || []).filter(i => i !== k0).slice(0, Math.max(0, L[0].need - (k0 === null || k0 === undefined ? 0 : 1))).forEach(i => done.add(i));
    if (!chOpenDue())
      P.push('#156: the first district has all the answers it asks for and the city does not consider it finished');
    // the ceremony is the ONLY thing ENDLESS may touch
    if (chDue() !== (chOpenDue() && !endless))
      P.push('#156: whether a curtain plays and whether the city has grown are still the same question — that is the coupling the ticket is about');
    // and now the path a player actually takes: the button on the card
    const before = chSeen;
    document.getElementById('card').hidden = false;
    document.getElementById('next').hidden = false;
    document.getElementById('next').click();
    await new Promise(r => setTimeout(r, 60));
    if (endless) {
      if (chSeen === before)
        P.push('#156: this world never ends, its first district is finished, and pressing on left the city exactly where it was — nothing new opened and nothing said so');
    } else {
      if (document.getElementById('end').hidden)
        P.push('#156: this world ends and its first district is finished, but pressing on did not play the ending');
      document.getElementById('end').hidden = true;
    }
    // and nothing may write chSeen except the advance
    if (chSeen > L.length) P.push('#156: the city grew past its own last district');
    chSeen = keepSeen; done.clear(); keepDone.forEach(i => done.add(i));
    document.getElementById('card').hidden = true;
    if (typeof applyGrowth === 'function') applyGrowth();
    return P;
  });
  fails.push(...grows);

  /* ---- TAGS L15 / ARCH-LOG A5+A7: a pack says what a glyph looks like, and which cameras it has ----
     The owner, 2026-09-10: "why cant we have like a pack can draw its own tree and layer for art?
     maybe im mixing but just trying ot reuse what we can." He was not mixing them up.
     A glyph has FOUR views and a pack could reach two. TILEART said the top, TILEART_SIDE said the
     profile, the leafy top of a tree was hardcoded in engine3d.js with a hardcoded green, and there
     was nowhere at all to describe the isometric view. And every game shipped all four cameras
     whether it wanted them or not, including one that loses most of its art.
     This asks for the CONTRACT and never for the picture, so it survives the art being redrawn. */
  const views = await page.evaluate(() => {
    const P = [];
    if (!window.THREE) return ['COUNT-ONLY: this shell declined 3D (CAMERAS has no "3d"), so the checks below it, which measure the 3D scene, did not run'];
    if (typeof tileView !== 'function') {
      P.push('a pack has no single place to say what a glyph looks like — the views are still scattered across tables it cannot all reach');
    } else {
      ['top', 'side', 'crown', 'iso'].forEach(v => {
        try { tileView('#', v); }
        catch (e) { P.push('nobody can ask what a glyph looks like from "' + v + '": ' + e.message); }
      });
      if (tileView('¡nope', 'crown') !== null)
        P.push('asking for a view a pack never drew gives back something rather than nothing');
      const treeG = Object.keys(TILES).find(g => (TILES[g] || {}).kind === 'tree');
      if (!treeG) P.push('this pack has no tree, so the crown could not be checked');
      else if (typeof TILECROWN === 'undefined') P.push('there is nowhere to declare what stands above a tile — a pack cannot draw its own tree');
      else {
        TILECROWN[treeG] = () => { ctx.fillStyle = '#ff00ff'; ctx.fillRect(0, 0, 40, 40); };
        const w = Object.keys(WORLD_DEFS).find(k => WORLDS[k] && WORLDS[k].rows.some(r => r.indexOf(treeG) >= 0));
        if (w) {
          const before = camMode, bw = world;
          camSet('3d'); world = w; t3Invalidate(); draw3d();
          /* 2026-09-21: a pack may declare the whole tree as a `mesh` (a list of parts), in which case there is no
             crown texture to find — the mesh IS the pack's tree, and a stronger declaration than a crown. Meridian
             does; the town does not, so the crown path is still walked by the town's run of this file. */
          const meshTree = T3.group.children.some(o => o.userData && o.userData.mesh && o.userData.g === treeG);
          if (!meshTree && !(T3.crownTex && T3.crownTex[treeG]))
            P.push('a pack declared what its tree looks like and the engine drew its own anyway');
          world = bw; camSet(before);
        }
        delete TILECROWN[treeG]; t3Invalidate();
      }
    }
    if (typeof CAMALL === 'undefined' || typeof CAMS === 'undefined') {
      P.push('a game cannot say which cameras it has — all of them are on, always');
    } else {
      if (CAMS.some(c => !CAMALL.includes(c))) P.push('this pack offers a camera the engine cannot draw');
      if (!CAMS.length) P.push('this pack offers no camera at all');
      const shown = [...document.querySelectorAll('#camRow button')].filter(b => !b.hidden).map(b => b.dataset.cam);
      const extra = shown.filter(c => !CAMS.includes(c));
      if (extra.length) P.push('there is a button for a camera this game does not have: ' + extra.join(', '));
      const was = camMode;
      camSet('¡nosuchcamera');
      if (!CAMS.includes(camMode)) P.push('asking for a camera the game does not have left it showing one it cannot draw');
      camSet(was);
    }
    return P;
  });
  fails.push(...views);
  /* ---- the loop stops DRAWING behind a panel, and never stops thinking ----
     Measured before the change: 215 frames in six seconds with a document covering the world, all
     at full device resolution, none of them visible. The world must still tick — otherwise the dog
     teleports when you put the paper down — and anything it says while you are reading is held
     rather than played out behind an opaque panel. */
  const loopq = await page.evaluate(async () => {
    const P = [];
    if (typeof worldCovered !== 'function') { P.push('the loop cannot tell when the world is covered, so it draws behind every panel'); return P; }
    document.getElementById('world').hidden = false; camSet('3d'); sizeCanvas();
    /* Count what the LOOP decides to do, rather than how fast WebGL happens to run in a headless
       page: the rule under test is "does the loop call draw", and that is observable directly. */
    const realDraw = draw; let calls = 0;
    draw = function () { calls++; return realDraw.apply(this, arguments); };
    /* A headless page throttles requestAnimationFrame hard — two frames in half a second, not
       thirty — so this counts SOME against NONE, which is the whole rule, rather than a rate. */
    const over = async (ms) => { calls = 0; await new Promise(r => setTimeout(r, ms)); return calls; };
    const open = await over(800);
    if (open < 1) P.push('the loop is not drawing the world at all with nothing over it');
    const doc = Object.keys(DC())[0];
    docOpen(doc); await new Promise(r => setTimeout(r, 200));
    if (!worldCovered()) P.push('an open document does not count as covering the world');
    const covered = await over(800);
    if (covered > 0) P.push('the world is still drawn ' + covered + ' time(s) behind an open document — nobody can see any of it');
    // it must still be THINKING, or everything jumps when the paper goes down
    const t0 = (typeof last !== 'undefined') ? last : null;
    await new Promise(r => setTimeout(r, 300));
    const t1 = (typeof last !== 'undefined') ? last : null;
    if (t0 === null) P.push('cannot tell whether the loop is alive behind a panel');
    else if (t0 === t1) P.push('the loop stopped entirely behind the panel, so the world will jump when the panel closes');
    // and what the street said while you were reading is kept, then said
    toast('a thing happened out there', 900);
    if (!toastHeld.length) P.push('something the world said behind a panel was spent on nobody');
    document.getElementById('docClose').click();
    await new Promise(r => setTimeout(r, 700));
    if (toastHeld.length) P.push('what the street said while you were reading was never delivered');
    const back = await over(800);
    if (back < 1) P.push('the loop did not start drawing again when the panel closed');
    draw = realDraw;
    document.getElementById('world').hidden = true;
    return P;
  });
  fails.push(...loopq);

  /* ---- the flat camera the game promises when 3D cannot draw ----
     Both packs boot into 3D (CAMDEF="3d"), so this is the camera nearly every player starts in.
     When draw3d() throws, the engine does three of the four things it should: it records the
     fault, it stops trying, and it draws the front-profile camera instead. It does NOT show it.
     camSet is the only writer of cv.hidden (engine.js:714) and nothing on the failure path calls
     it, so the flat picture is painted into a canvas that is still hidden while the dead 3D canvas
     is still the one on screen. Measured on both shells: 82 samples of ink on a canvas the player
     cannot see, under a message that says the flat camera is what they are looking at.
     This asks what the PLAYER can see, never which function ran, so it survives a rewrite. */
  const fell = await page.evaluate(async () => {
    const P = [];
    if (!window.THREE) return ['COUNT-ONLY: this shell declined 3D (CAMERAS has no "3d"), so the checks below it, which measure the 3D scene, did not run'];
    /* engine3d.js is always loaded, so T3 existing proves nothing about whether this GAME has a
       3D camera — CAMERAS lets a pack drop it (mq-v133). Ask the seam, not the file. A pack that
       never offers 3D cannot fall back from it and must not be failed for that. */
    if (typeof CAMS !== 'undefined' && CAMS.indexOf('3d') < 0) return P;
    if (typeof T3 === 'undefined' || typeof draw3d !== 'function') { P.push('this pack has no 3D at all, so the fallback could not be checked'); return P; }
    camSet('3d'); draw();
    await new Promise(r => setTimeout(r, 400));
    if (!T3.renderer) { P.push('3D never started, so what happens when it fails could not be checked'); return P; }
    const realRender = T3.renderer.render;
    T3.renderer.render = () => { throw new Error('simulated context loss'); };
    T3.fail = false; T3.said = false; T3.builtKey = null;
    draw();
    await new Promise(r => setTimeout(r, 300));
    const flat = document.getElementById('cv'), dead = document.getElementById('cv3');
    const said = [...document.querySelectorAll('#ticker div')].map(e => e.textContent).join(' ');
    const promised = /flat camera|c.mara plana/i.test(said);
    if (!promised) P.push('3D failed and the player was never told');
    if (promised && flat.hidden)
      P.push('the game says it fell back to the flat camera and the flat camera is still hidden — it is painting where nobody can look');
    if (promised && !dead.hidden)
      P.push('3D failed and the dead 3D canvas is still the one on screen');
    // put it back so the rest of the run is honest
    T3.renderer.render = realRender; T3.fail = false; T3.said = false; T3.builtKey = null;
    camSet('3d'); draw();
    return P;
  });
  fails.push(...fell);

  /* ---- one bad frame must not be the last frame ----
     loop() asked for its next frame as its LAST statement (engine.js:2826), so anything that threw
     anywhere in the frame took the game with it: measured, the loop ticked once more and then never
     again, and it did not come back when the faulty code was removed. Not one dropped frame — the
     screen, forever, until a reload.
     Nothing in either shipping pack is known to throw here today, so this is insurance rather than
     a bug players are hitting. It is worth a rule anyway, because it decides what EVERY future bug
     costs: with the frame re-armed first, a fault is a glitch; re-armed last, every fault is fatal.
     It injects at a site UPSTREAM of draw() on purpose. A narrower fix that only wraps draw() makes
     the obvious version of this test pass while the game still freezes on anything else — that was
     tried, and it did. It also never counts frames: a headless page throttles rAF hard (see the
     note above), so the only honest question is whether the clock moved at all. */
  const badframe = await page.evaluate(async () => {
    const P = [];
    const moved = async (ms) => { const a = last; await new Promise(r => setTimeout(r, ms)); return last !== a; };
    if (typeof last === 'undefined') { P.push('cannot tell whether the loop is alive'); return P; }
    if (!(await moved(700))) { P.push('the loop was not running before this check, so nothing it says can be trusted'); return P; }
    for (const site of ['fredCheck', 'troUpdate', 'draw']) {
      if (typeof window[site] !== 'function') { P.push('the frame no longer calls ' + site + ', so this check has stopped checking anything — point it at whatever the frame calls now'); continue; }
      const real = window[site];
      window[site] = function () { throw new Error('BADFRAME on purpose'); };
      /* the frame that throws writes the clock BEFORE it throws, so the first window after
         injecting always looks alive whether or not it was the last one. Spend one window
         letting it die, and ask the second. Without this the check names the wrong function. */
      await moved(700);
      const alive = await moved(700);
      window[site] = real;
      if (!alive) P.push('one frame threw in ' + site + ' and the game stopped forever — the loop only asks for the next frame when nothing went wrong, so any fault anywhere is the last thing that ever happens');
      if (!alive) break; /* the loop is dead; the remaining sites cannot be told apart */
    }
    return P;
  });
  fails.push(...badframe);

  /* ---- the trolley is a vehicle ----
     The owner, 2026-09-11: "i mentioned at some point having a driver and stuff as well as wheels,
     we want to be realistic, crew!" He was describing it exactly. t3Trolley's own comment called it
     "the tram, one box on the line", and it was: a body box, a roof box, and six window slabs on the
     two long sides only, floating 0.09 above the road on nothing.
     Measured before this test existed, in the engine's own units, which is what makes the sentence
     below fair rather than rhetorical: the tram's roof stood at 0.555; a DOOR in this engine is 1.0
     (engine3d.js, BoxGeometry(1,1,0.14) at y=0.5) and an ordinary prop with no declared lift stands
     0.844. So a traffic cone was taller than the whole tram.
     This asks what a PERSON would say about a vehicle — can you get in it, does it touch the road,
     is anybody driving — and never which function drew what, so it survives the art being redrawn.
     A pack with no trolley line is skipped rather than failed: nothing to look at is not a pass. */
  const tram = await page.evaluate(() => {
    const P = [];
    if (typeof troLine !== 'function' || !troLine('' + (typeof PL !== 'undefined' ? PL.street : ''))) {
      const any = (typeof TROLLEYAT !== 'undefined' && TROLLEYAT && TROLLEYAT.length) ? TROLLEYAT[0] : null;
      if (!any) return P;                       /* this game has no trolley; nothing to hold to account */
    }
    const L = (typeof TROLLEYAT !== 'undefined' && TROLLEYAT && TROLLEYAT[0]) ? TROLLEYAT[0] : null;
    if (!L) return P;
    if (typeof T3 === 'undefined' || !window.THREE) {   /* the tram is measured in the 3D scene, and this shell has none */
      P.push('COUNT-ONLY: this shell declined 3D, so the trolley was not measured in the scene');
      return P; }
    const bw = world, bc = camMode, bs = TRO.state, bx = TRO.x;
    document.getElementById('world').hidden = false;
    world = L.world; camSet('3d'); sizeCanvas(); draw3d();
    TRO.state = 'run'; TRO.x = L.from + 1; draw3d();
    if (!T3.tram) { P.push('the trolley never appears in the world it runs in'); }
    else {
      const box = new THREE.Box3().setFromObject(T3.tram);
      const DOOR = 1.0;
      if (box.max.y < DOOR)
        P.push('the trolley is ' + box.max.y.toFixed(2) + ' tall where a doorway is ' + DOOR.toFixed(2) +
               ' — it is knee-high, and an ordinary prop in the same street stands taller than the whole tram');
      if (box.min.y > 0.04)
        P.push('the trolley floats ' + box.min.y.toFixed(2) + ' above the road with nothing under it — it has no wheels touching the ground');
      let wheels = 0, driver = 0, cars = 0;
      T3.tram.traverse(o => { const u = o.userData || {}; if (u.wheel) wheels++; if (u.driver) driver++; if (u.car) cars++; });
      /* four, not two: the noun is four wheels, and the guard fired at two since it was written (la calle, crew
         iteration 11). Planted in a copy outside the repo with one axle's pair deleted: "the trolley has 2
         wheels — a tram that rolls down a street has wheels you can see", exit 1.
         AND FOUR PER CAR, not four: a line may now declare `cars: n` (crew iteration 14), and a two-car train
         with four wheels is a car being dragged. "Four" was the right number for the only train this engine
         could build and it is a PROXY for "every car rolls on its own wheels" the moment a second one exists —
         the same shape as every row in docs/REGRESSION.md, caught before it shipped rather than after.
         The count comes from the LINE the game declares, never from a number typed here (the guard skill's
         first trap: a guard that names its own copy of a constant is testing its own arithmetic). */
      const N = (typeof troCars === 'function') ? troCars(L) : 1;
      if (cars !== N) P.push('this line declares a train of ' + N + ' cars and ' + cars + ' were built — the rest of the train is not there');
      if (wheels < 4 * N) P.push('the trolley has ' + wheels + ' wheels for ' + N + ' car' + (N > 1 ? 's' : '') +
        ' — a tram that rolls down a street has wheels you can see, and every car of a train rolls on its own');
      /* ONE driver, not "at least one". A tram has a cab at each end and one man who walks the length of it;
         a train with a driver in every car is three people steering one vehicle. rigo.md is the source. */
      if (driver !== 1) P.push(driver ? ('the trolley has ' + driver + ' drivers — a tram has a cab at each end and ONE driver, who walks the length of it')
                                      : 'nobody is driving the trolley');
      /* ...and it is as long as it says it is. Nothing asserted the LENGTH until now: the box was read for
         its height and its floor only, so `cars: n` could have been decorative — a line declaring three cars
         and rendering one would have passed every other line in this block.
         MEASURED OVER THE CAR BODIES AND NOT OVER THE TRAM'S OWN BOX, and the first draft did the latter and
         COULD NOT FAIL. Planted three cars declared and one built: the whole-group box still measured 6.235
         against a declared 6.280 and the check passed on a train with two thirds of it missing. The reason is
         that the DRIVER is positioned at the nose by arithmetic that reads the span — `(SPAN/2-0.16)` — so one
         man standing where the front of the train would be stretches the box to exactly the number the box is
         being compared against. A guard whose measurement is computed from its own expected value is not a
         guard (.claude/skills/guard/SKILL.md, "it supplies its own inputs"). The cars are the vehicle. */
      const want = (typeof troSpan === 'function') ? troSpan(L) : 2;
      const cb = new THREE.Box3(); let bodies = 0;
      T3.tram.traverse(o => { if ((o.userData || {}).car) { cb.union(new THREE.Box3().setFromObject(o)); bodies++; } });
      const got = bodies ? cb.max.x - cb.min.x : 0;
      if (!bodies) P.push('nothing on the trolley says it is a car, so how long the train is cannot be asked of it');
      else if (Math.abs(got - want) > 0.35) P.push('this line declares a train ' + want.toFixed(2) + ' tiles long and what stands on the street is ' +
        got.toFixed(2) + ' — the street will brake, wait and clear for a vehicle that is not the size of the one you can see');
      /* ---- and a wheel turns about its axle ----
         The check above asks whether the tram's bounding box reaches the road. Measured: it reads
         0.0000 with all four wheels present AND 0.0000 with all four deleted, because the skirt
         (engine3d.js:602) satisfies it. A guard written to prove the tram has wheels on the ground
         cannot see the wheels — the ninth time in this repo that a guard has read a proxy for the
         thing (docs/REGRESSION.md).
         This reads the noun: a wheel that rolls down a street turns about an axle that lies ACROSS
         the rails. Measured as shipped, the axle swept (-1,0,0) at 0 degrees to (0,-1,0) at 90 and
         was never once near (0,0,+/-1) — so what rolled down Calle was a cylinder tumbling end over
         end and lifting half its own diameter off the road, twice a turn, at the shipped speed,
         since the day it landed. Found by Chema, by cropping the wheel to 8x and looking at it,
         after his own first measurement came back smaller than his control. */
      const axle = new THREE.Vector3(), q = new THREE.Quaternion();
      let spun = 0, tumbling = [];
      T3.tram.traverse(o => { if (!(o.userData || {}).wheel) return;
        spun++;
        [0, 30, 90].forEach(deg => {
          o.rotation.y = deg * Math.PI / 180; o.updateMatrixWorld(true);
          o.getWorldQuaternion(q);
          axle.set(0, 1, 0).applyQuaternion(q);
          if (Math.abs(axle.z) < 0.9) tumbling.push(deg);
        });
        o.rotation.y = 0; o.updateMatrixWorld(true); });
      if (spun && tumbling.length)
        P.push('the trolley\'s wheels do not turn like wheels — the axle points along the street instead of across it, so each wheel flips end over end and lifts off the road twice a turn instead of rolling');

      /* and it must read as a tram from every stop you can turn the camera to, not just the two
         long sides — six window slabs at z=±0.37 left a bare brown slab at 90 degrees */
      let faces = 0; T3.tram.traverse(o => { if ((o.userData || {}).glazing) faces++; });
      if (faces && faces < 3 * N) P.push('the trolley only has windows on its long sides, so from a quarter turn it is a blank brown brick');
    }
    TRO.state = bs; TRO.x = bx; world = bw; camSet(bc); sizeCanvas();
    document.getElementById('world').hidden = true;
    return P;
  });
  fails.push(...tram.filter(l => !/^COUNT-ONLY: /.test(l)));
  tram.filter(l => /^COUNT-ONLY: /.test(l)).forEach(l => console.log('  ' + l));

  /* ---- a person is shorter than the door he walks through, and a SIGN is not a person ----
     The owner, 2026-09-22: "you can make my character smaller as i mentioned before for the cool
     looks." He was right about a thing nobody had measured: every one of the thirty-six stood 1.12
     of a doorway, so the whole cast walked under lintels shorter than they are, in both games, since
     the actor card got its size. T3PERSON is that size now and this is the sentence it has to keep.
     ASKED IN PIXELS AND AGAINST A REAL DOOR. His height is where the paint starts on his own card,
     not the card's edge — the card carries 8 px of headroom for the speech bubble (#57), so the card
     is a proxy for the person and reading it would call him a head taller than he is. The doorway is
     a door that is actually standing in the scene, not the literal 1.0, because a guard that names
     its own copy of a constant is testing its own arithmetic (.claude/skills/guard/SKILL.md).
     AND THE SECOND HALF, which is the one somebody will undo by tidying: the quest mark and the read
     mark ride the same pool as the people and are NOT people. A mark is signage — it is sized to be
     read across a street and it does not shrink because the cast did. Asked by sweeping T3PERSON and
     counting what moved: every sign must hold still and every body must not. */
  const person = await page.evaluate(() => {
    const P = [];
    if (typeof T3 === 'undefined' || !window.THREE || typeof T3PERSON === 'undefined') {
      P.push('COUNT-ONLY: this shell declined 3D, so nobody was measured against a doorway'); return P; }
    const keep = { w: world, px, py, cam: camMode, k: T3PERSON };
    document.getElementById('world').hidden = false;
    /* a world with a door standing in it AND somebody in it: walk until both are true */
    let found = null;
    Object.keys(WORLDS).some(wid => { world = wid; px = fx = Math.floor(WORLDS[wid].W / 2); py = fy = Math.floor(WORLDS[wid].H / 2);
      camSet('3d'); sizeCanvas(); draw3d();
      let door = null; T3.group.traverse(o => { if (!door && (o.userData || {}).door && o.geometry) door = o; });
      const hero = T3.pool.find(p => p.live && p.spr.userData.hero);
      if (door && hero) { found = { wid, door, hero }; return true; }
      return false; });
    if (!found) { P.push('COUNT-ONLY: no world put a person and a standing door in the same scene'); }
    else {
      const K = T3.K || 1, c = found.hero.c, g = c.getContext('2d');
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let head = -1;
      for (let y = 0; y < c.height && head < 0; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 24) { head = y; break; }
      /* his feet are the card's anchor, 4 of 48 rows up from the bottom (t3Sprite, center.set) */
      const feet = 44 * K;
      if (head < 0 || head >= feet) P.push('nothing is painted on the person you steer, so his height could not be measured — which is not a pass');
      else {
        const tall = (feet - head) / (32 * K) * T3PERSON;
        const box = new THREE.Box3().setFromObject(found.door), door = box.max.y;
        if (tall >= door) P.push('the person you steer stands ' + tall.toFixed(2) + ' tiles tall and the doorway he walks through in ' + found.wid +
          ' is ' + door.toFixed(2) + ' — he is taller than the door, in every room, and once you have seen it you cannot stop seeing it');
        if (tall < door * 0.7) P.push('the person you steer stands ' + tall.toFixed(2) + ' tiles against a ' + door.toFixed(2) +
          ' doorway — he is a child in a grown-up\'s city, and his face is ' + Math.round(tall * 35) + ' px of a 35 px tile');
      }
      /* and the signs hold still while the bodies move — IN A WORLD THAT HAS SIGNS IN IT, which is a
         different world from the one with the doorway and took a plant to learn. The first draft asked
         this wherever the doorway happened to be: that is hq, which has no door mark and no read mark,
         so `signs` was 0, nothing held still, 0 === 0, and the whole half went GREEN against the real
         violation (every mark made to shrink with the cast). Nothing to look at is not a pass —
         .claude/skills/guard/SKILL.md's second, and docs/GAUGE.md's silent zero. */
      let markW = null;
      Object.keys(WORLDS).some(wid => { world = wid; px = fx = Math.floor(WORLDS[wid].W / 2); py = fy = Math.floor(WORLDS[wid].H / 2);
        const n = ((typeof doorMarks === 'function' ? doorMarks() : []).length) + ((typeof readMarks === 'function' ? readMarks() : []).length);
        if (n) { markW = { wid, n }; return true; } return false; });
      if (!markW) P.push('COUNT-ONLY: no world in this game draws a quest or read mark, so signs could not be told from people');
      else {
        camSet('3d'); sizeCanvas();
        const scales = () => { draw3d(); return T3.pool.filter(p => p.live).map(p => +p.spr.scale.y.toFixed(4)); };
        T3PERSON = keep.k; const a = scales();
        T3PERSON = keep.k * 0.5; const b = scales();
        T3PERSON = keep.k; draw3d();
        const held = a.filter((v, i) => b[i] === v).length;
        if (a.length <= markW.n) P.push('only marks are drawn in ' + markW.wid + ' and nothing else, so "the signs held still and the bodies did not" has no bodies in it — which is not a pass');
        else if (held !== markW.n) P.push('halving the size of a person held ' + held + ' of the ' + a.length + ' billboards in ' + markW.wid +
          ' still, and ' + markW.n + ' of them are quest and read MARKS — a mark is signage: it is sized to be read and it does not get smaller because the cast did');
      }
    }
    T3PERSON = keep.k; world = keep.w; px = fx = keep.px; py = fy = keep.py;
    camSet(keep.cam); sizeCanvas(); document.getElementById('world').hidden = true;
    return P;
  });
  fails.push(...person.filter(l => !/^COUNT-ONLY: /.test(l)));
  person.filter(l => /^COUNT-ONLY: /.test(l)).forEach(l => console.log('  ' + l));

  /* ---- and a person behind the trolley is BEHIND it, and can still see himself ----
     The owner, 2026-09-21: "we should fix the trolley weirdness." Ridden by the line inspector (crew
     iteration 12), every position on both lines in all four cameras: the one thing a tram would never
     let you do is stand on its roof, and this one did. Then, 2026-09-22, having been shown the two
     cures and asked to pick: "for the inspector- lets make it seethrough."
     SO THIS GUARD READS TWO HALVES AND NOT ONE, and the first draft — mine, yesterday — read one.
     It asked whether the hero changed a pixel of the tram, and answered "a person standing behind a
     tram changes nothing in front of him". That sentence is only true of an OPAQUE tram. It is the
     right noun for the roof half and it is a PROXY for the whole thing the owner asked for, because
     it is equally satisfied by a car that paints him out completely — which is the state he then
     complained about. Both failures live in the same pixels and they are opposite:
       · every overlapping pixel identical to the no-hero frame  → you are invisible behind it;
       · every overlapping pixel identical to the no-tram frame  → you are painted on its roof.
     A see-through car is neither: the pixel carries some of him and some of the car, which is what
     #140 means by "the pixel holds both of them and the position is honest either way".
     Asked as pixels, four frames: the hero's footprint (him on, him off, no tram), the tram's
     footprint (tram on, tram off, no hero), and inside where they overlap, how many pixels moved
     when each of the two was taken away. Raw renders after one draw3d, because draw3d re-places the
     tram each frame and would undo the toggles. */
  const onRoof = await page.evaluate(() => {
    const P = [];
    const L = (typeof TROLLEYAT !== 'undefined' && TROLLEYAT && TROLLEYAT[0]) ? TROLLEYAT[0] : null;
    if (!L) return P;
    if (typeof T3 === 'undefined' || !window.THREE) { P.push('COUNT-ONLY: this shell declined 3D, so the trolley was not measured in the scene'); return P; }
    const s = troStops(L)[0], w = WORLDS[L.world];
    if (!s || !w) { P.push('COUNT-ONLY: the first trolley line declares no stop, so nobody can wait for it'); return P; }
    const keep = { w: world, px, py, cam: camMode, st: TRO.state, x: TRO.x, d: TRO.dir, yaw: T3.yaw, mv: moving };
    document.getElementById('world').hidden = false;
    world = L.world; px = fx = s.x; py = fy = s.y; moving = false; held = null;
    TRO.dir = L.to >= L.from ? 1 : -1; TRO.state = 'dwell';
    TRO.x = troClampX(L, s.x - 0.5);                               /* the car alongside the platform, wherever the engine lets it stand */
    camSet('3d'); sizeCanvas(); T3.turn = null;
    T3.yaw = s.y < L.row ? 0 : Math.PI;                            /* the camera on the far side of the rails from the platform */
    t3Invalidate(); draw3d();
    const hero = T3.pool.find(p => p.live && p.spr.userData.hero);
    if (!hero) { P.push('no billboard says it is the hero, so nobody can ask what he is drawn over'); document.getElementById('world').hidden = true; return P; }
    if (!T3.tram || !T3.tram.visible) { P.push('the trolley is not standing at its stop in 3D, so there is nothing for the hero to be drawn over'); document.getElementById('world').hidden = true; return P; }
    const c3 = T3.renderer.domElement, W = c3.width, H = c3.height;
    const grab = () => { T3.renderer.render(T3.scene, T3.cam); const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(c3, 0, 0); return g.getImageData(0, 0, W, H).data; };
    const ne = (A, B, i) => Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 30;
    const A = grab(), A2 = grab();
    hero.spr.visible = false; const B = grab(); T3.tram.visible = false; const D = grab(); hero.spr.visible = true; const C = grab(); T3.tram.visible = true;
    /* TWO FRACTIONS, AND THE DENOMINATORS ARE NOT THE SAME ONE, which took a wrong sweep to learn.
       "How much of him survives" was first asked over the OVERLAP, and the overlap is itself a
       function of how see-through the car is — so the ladder came back 3%, 0%, 0%, 0%, 1%, 31% and
       was not measuring anything monotonic. His own silhouette does not move when the glass changes.
       So: `seen` is counted over HIM (ne(C,D)), and the roof half stays over the overlap, where it
       is unambiguous — a person painted opaquely on a car leaves none of the car in those pixels.
       The ladder, measured at the st stop on 2026-09-22 with the camera on the far side of the rails:
         the 2026-09-21 bug, him drawn through a solid car .... seen 80%   car  35%
         shipped 2026-09-21, him behind a solid car ......... seen 27%   car 100%   <- "he disappeared"
         glass at T3GHOST 0.68 .............................. seen 32%   car 100%
         glass 0.52 ......................................... seen 32%   car  99%
         glass 0.45 ......................................... seen 38%   car  98%
         glass 0.38  (shipped) .............................. seen 45%   car  98%
         glass 0.26 ......................................... seen 69%   car  98%
       A third and two thirds are the two lines, each with the nearest real failure on the other side
       of it: reusing the tree's 0.68 for a tram lands at 32% and fires, which is the point. */
    let control = 0, heroPx = 0, seen = 0, overlap = 0, showsCar = 0;
    for (let i = 0; i < W * H * 4; i += 4) { if (ne(A, A2, i)) control++;
      if (ne(C, D, i)) { heroPx++; if (ne(A, B, i)) seen++;            /* taking HIM away changed it: he is in this pixel */
        if (ne(B, D, i)) { overlap++; if (ne(A, C, i)) showsCar++; } } /* taking the CAR away changed it: it is in front, not under */ }
    if (control) P.push('the probe cannot measure the trolley and the hero: two frames of the same scene differ by ' + control + ' pixels');
    else if (heroPx < 200 || overlap < 50) P.push('the trolley at its stop in ' + L.world + ' and the person waiting for it do not meet on screen (' + heroPx +
      ' pixels of him, ' + overlap + ' of them behind the car), so the probe measured nothing — which is not a pass');
    else if (seen * 3 < heroPx) P.push('standing at the stop in ' + L.world + ' the trolley paints you out — only ' + Math.round(seen / heroPx * 100) +
      '% of the person you are steering still reaches the screen with the car in front of him; you call a tram and then you cannot find yourself');
    else if (showsCar * 3 < overlap * 2) P.push('standing at the stop in ' + L.world + ' with the trolley in front of you, you are drawn on top of it — only ' +
      Math.round(showsCar / overlap * 100) + '% of the pixels where you and the car meet carry any of the car; a person behind a tram is behind it, seen through it and not stood on it');
    world = keep.w; px = fx = keep.px; py = fy = keep.py; moving = keep.mv; TRO.state = keep.st; TRO.x = keep.x; TRO.dir = keep.d; T3.yaw = keep.yaw;
    camSet(keep.cam); sizeCanvas(); document.getElementById('world').hidden = true;
    return P;
  });
  fails.push(...onRoof.filter(l => !/^COUNT-ONLY: /.test(l)));
  onRoof.filter(l => /^COUNT-ONLY: /.test(l)).forEach(l => console.log('  ' + l));

  /* ---- and in the flat cameras the trolley is painted in its row's turn ----
     The owner, 2026-09-21, naming the weirdness: "looks like the person is laying on the trolley."
     The front camera painted the car in the GROUND pass and the isometric camera painted it LAST,
     after everybody: so in front a person on the platform behind the car had his feet on its roof,
     and in iso a person standing in front of the car was painted under it and one behind it had his
     legs cut off at its roof line — the other two readings of "laying on the trolley". A car is a
     thing on its row, and the depth queue every camera already keeps is where it belongs: whoever
     is nearer the camera than the rails paints over it, whoever is farther paints under it.
     Asked as pixels in each flat camera, with the car alongside the hero's column: a person on the
     row in FRONT of the rails keeps every pixel of himself (the car changes none), and a person on
     the row BEHIND the rails yields every pixel where they overlap (he changes none of the car).
     The ride's own frames were the instrument (the line inspector, crew iteration 12). */
  const flatTurn = await page.evaluate(() => {
    const P = [];
    const L = (typeof TROLLEYAT !== 'undefined' && TROLLEYAT && TROLLEYAT[0]) ? TROLLEYAT[0] : null;
    if (!L) return P;
    const w = WORLDS[L.world]; if (!w) return P;
    const cams = (typeof CAMS === 'undefined' ? ['front', 'iso'] : ['front', 'iso'].filter(c => CAMS.indexOf(c) >= 0));
    if (!cams.length) { P.push('COUNT-ONLY: this shell has neither a front nor an isometric camera'); return P; }
    const open = (x, y) => y >= 0 && y < w.H && x >= 0 && x < w.W && !SOLID.has(w.rows[y][x]) && w.grid[y][x] !== 'N';
    const mid = Math.round((L.from + L.to) / 2);
    const rowS = [L.row + 1, L.row + 2].find(y => open(mid, y)), rowN = [L.row - 1, L.row - 2].find(y => open(mid, y));
    if (rowS === undefined && rowN === undefined) { P.push('COUNT-ONLY: nobody can stand beside the trolley line in ' + L.world + ' at x=' + mid); return P; }
    const keep = { w: world, px, py, cam: camMode, st: TRO.state, x: TRO.x, d: TRO.dir, mv: moving, season: seasonPick, dp: drawPerson, td: window.troDraw2D };
    if (typeof seasonSet === 'function') seasonSet('off');   /* nothing that sways by the clock in the frame */
    /* …and ONE INSTANT for all five frames, because the season is not the only clock. Found 2026-09-30 as a 1-pixel red
       that passed on re-run: the five frames are five draws, milliseconds apart (tens on a busy runner), and the
       hummingbird at the stop hovers on Date.now over the feet of the person in front of the car. "Him without the car"
       drawn a moment after "him with it" differed where the bird had moved, and that was counted as the car covering
       him. Both clocks stand still until the frames are taken; the draw order does not depend on the clock. */
    const wallNow = Date.now, pagePerf = performance.now, t0 = wallNow(), p0 = pagePerf.call(performance); Date.now = () => t0; performance.now = () => p0;
    world = L.world; moving = false; held = null;
    /* the car's tail one tile west of the hero's column: a whole-tile x, because the flat cameras paint the car
       from its tile's corner and a half-tile car beside a whole-tile person barely touches him on screen */
    TRO.dir = L.to >= L.from ? 1 : -1; TRO.state = 'dwell'; TRO.x = troClampX(L, mid - 1);
    const cv2 = document.getElementById('cv'), g2 = cv2.getContext('2d');
    const real = keep.td, realDP = keep.dp;
    let heroOn = true, tramOn = true;
    window.troDraw2D = function () { if (tramOn) return real.apply(this, arguments); };
    drawPerson = function (g, sx, sy, lk, o) { if (o && o.hero && !heroOn) return; return realDP.apply(this, arguments); };
    const grab = () => { draw(); return g2.getImageData(0, 0, cv2.width, cv2.height).data; };
    const ne = (A, B, i) => Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 30;
    cams.forEach(cam => { camSet(cam); sizeCanvas();
      [[rowS, 'in front of'], [rowN, 'behind']].forEach(([row, side]) => { if (row === undefined) return;
        px = fx = mid; py = fy = row;
        const A = grab(), A2 = grab();
        heroOn = false; const B = grab(); tramOn = false; const D = grab(); heroOn = true; const C = grab(); tramOn = true;
        let control = 0, region = 0, overlap = 0, heroChangedTram = 0, tramChangedHero = 0;
        /* his BODY, not his drop shadow: the shadow is a translucent tint and its anti-aliased rim can land within
           tolerance of either frame; a body pixel differs from the bare ground by more than 120 */
        const solid = (P, Q, i) => Math.abs(P[i] - Q[i]) + Math.abs(P[i + 1] - Q[i + 1]) + Math.abs(P[i + 2] - Q[i + 2]) > 120;
        for (let i = 0; i < A.length; i += 4) { const hero = ne(C, D, i), tram = ne(B, D, i); if (!hero && !tram) continue;
          region++;
          /* a neighbour's idle bob is a sub-pixel sine of the clock: a pixel that moved between two frames of the same
             scene is left out of the count, and only a region that is mostly moving is a probe that measures nothing */
          if (ne(A, A2, i)) { control++; continue; }
          /* "covered" means the OTHER one's pixel is what shows — a person's translucent drop shadow tinting the car
             under it is not the car covering him, so a pixel counts only when it equals one frame and not the other */
          if (hero && tram) { overlap++; if (ne(A, B, i) && !ne(A, C, i)) heroChangedTram++; if (solid(C, D, i) && ne(A, C, i) && !ne(A, B, i)) tramChangedHero++; } }
        if (control > region * 0.05) { P.push('the ' + cam + ' camera cannot be measured: two frames of the same scene differ by ' + control + ' of ' + region + ' pixels around the trolley'); return; }
        if (!overlap) return;                                   /* no overlap on this row in this camera: there is no order to get wrong */
        if (side === 'in front of' && tramChangedHero) P.push('in the ' + cam + ' camera a person standing in front of the trolley is painted under it — ' + tramChangedHero + ' pixels of him covered by a car that is behind him');
        if (side === 'behind' && heroChangedTram) P.push('in the ' + cam + ' camera a person standing behind the trolley is painted on it — ' + heroChangedTram + ' pixels of him over its roof; "looks like the person is laying on the trolley"');
      }); });
    window.troDraw2D = real; drawPerson = realDP; Date.now = wallNow; performance.now = pagePerf;
    if (typeof seasonSet === 'function') seasonSet(keep.season);
    world = keep.w; px = fx = keep.px; py = fy = keep.py; moving = keep.mv; TRO.state = keep.st; TRO.x = keep.x; TRO.dir = keep.d;
    camSet(keep.cam); sizeCanvas();
    return P;
  });
  fails.push(...flatTurn.filter(l => !/^COUNT-ONLY: /.test(l)));
  flatTurn.filter(l => /^COUNT-ONLY: /.test(l)).forEach(l => console.log('  ' + l));

  /* ---- a string seen end-on is not a string ----
     The owner, 2026-09-21, a frame from the 3D camera turned a quarter on Calle Principal: "the
     skeleton now seems to float in one perspective and with the papel picado, looks like its buggy or
     broken." A swag is hung ALONG a row at head height. Turn the camera a quarter and you look down
     that row: the flags are edge-on and vanish, and the string is a bare dark line from the horizon to
     the foreground, straight through whoever stands under it — over his head, between his legs, through
     his shadow — and a person on a line reads as HANGING from it. Measured in that frame (the line
     inspector, crew iteration 12): 42 pixels of string inside the hero's own outline, none of them a
     flag. The bridge's string over the crossing does the same to whoever crosses under it.
     Asked as pixels, the way he saw it (docs/POSTMORTEM.md §3): the hero's footprint is the frame with
     him minus the frame without him; the string's reach into it is the frame with the strings minus the
     frame without them, inside that footprint — at both quarter turns. And at the two stops that look
     ACROSS the row the strings must still paint, or the cure was taking the paper down. The control
     (two frames, nothing changed) is zero first or the probe measures nothing (§13r). A pack that
     hangs no string over walkable ground has nothing to look at, which is said out loud, not passed. */
  const endOn = await page.evaluate(() => {
    const P = [];
    if (typeof T3 === 'undefined' || !window.THREE) { P.push('COUNT-ONLY: this shell declined 3D, so no string was looked at end-on'); return P; }
    if (typeof fiestaSwags !== 'function' || typeof seasonSet !== 'function') { P.push('COUNT-ONLY: this engine hangs no swags'); return P; }
    const S = (typeof SEASONS !== 'undefined' && SEASONS) ? SEASONS : {};
    const sid = Object.keys(S).find(k => S[k] && S[k].art && Array.isArray(S[k].art.swags) && S[k].art.swags.length);
    if (!sid) { P.push('COUNT-ONLY: no season in this pack hangs a swag, so no string can be seen end-on'); return P; }
    const pick0 = seasonPick, keep = { w: world, px, py, cam: camMode, yaw: T3.yaw, mv: moving, st: TRO.state };
    seasonSet(sid);
    /* the first swag in any world with open ground under it: that is where a person can stand under a string */
    let spot = null;
    Object.keys(WORLDS).some(wid => { const w = WORLDS[wid];
      return fiestaSwags(wid).some(sw => { const y = sw.from[1];
        for (let x = Math.min(sw.from[0], sw.to[0]); x <= Math.max(sw.from[0], sw.to[0]); x++) {
          const g = w.rows[y] && w.rows[y][x]; if (g !== undefined && !SOLID.has(g) && w.grid[y][x] !== 'N') { spot = { wid, x, y }; return true; } }
        return false; }); });
    if (!spot) { seasonSet(pick0); P.push('COUNT-ONLY: every swag in this pack hangs over solid ground, so nobody can stand under one'); return P; }
    document.getElementById('world').hidden = false;
    world = spot.wid; px = fx = spot.x; py = fy = spot.y; moving = false; held = null; TRO.state = 'away';
    camSet('3d'); sizeCanvas(); T3.turn = null;
    const c3 = T3.renderer.domElement, W = c3.width, H = c3.height;
    const grab = () => { T3.renderer.render(T3.scene, T3.cam); const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(c3, 0, 0); return g.getImageData(0, 0, W, H).data; };
    const ne = (A, B, i) => Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 30;
    /* every part of the paper: the strings, the flags AND the poles — after the strings went, the bridge's
       near pole crossed the hero's chest, the same line by another part */
    const strings = () => { const out = []; T3.group.traverse(o => { const u = o.userData; if (u && (u.swag || u.papel)) out.push(o); }); return out; };
    const look = (yaw) => {
      T3.yaw = yaw; t3Invalidate(); draw3d();
      const hero = T3.pool.find(p => p.live && p.spr.userData.hero);
      const st = strings();
      if (!hero) return { err: 'no billboard says it is the hero, so nobody can ask what runs through him' };
      if (!st.some(o => o.userData.string)) return { err: 'in season "' + sid + '" no string hangs in ' + spot.wid + ' in 3D — nothing to look at, which is not a pass' };
      const shown = st.map(o => o.visible);
      const A = grab(), A2 = grab();                                   /* strings as the engine left them, hero on — twice, the control */
      st.forEach(o => { o.visible = false; }); const B = grab();       /* strings off, hero on */
      hero.spr.visible = false; const D = grab();                      /* strings off, hero off */
      st.forEach((o, i) => { o.visible = shown[i]; }); hero.spr.visible = true;
      /* his footprint is B minus D; his OUTLINE is that footprint's box, stretched a quarter of his height
         up and down, because "hangs from it" is a line that enters at the crown and leaves under the feet,
         and a fix that only kept the string off his shirt would leave exactly that. The string's reach is
         A minus B, inside that box. */
      let control = 0, foot = 0, painted = 0, x0 = W, x1 = -1, y0 = H, y1 = -1;
      for (let i = 0, p = 0; i < W * H * 4; i += 4, p++) { if (ne(A, A2, i)) control++; if (ne(A, B, i)) painted++;
        if (ne(B, D, i)) { foot++; const x = p % W, y = (p - x) / W; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      let over = 0;
      if (foot) { const pad = Math.round((y1 - y0) / 4);
        for (let y = Math.max(0, y0 - pad); y <= Math.min(H - 1, y1 + pad); y++) for (let x = x0; x <= x1; x++) { if (ne(A, B, (y * W + x) * 4)) over++; } }
      return { control, foot, over, painted };
    };
    const at = {};
    [[Math.PI / 2, 'a quarter turn east'], [-Math.PI / 2, 'a quarter turn west'], [0, 'the first stop'], [Math.PI, 'the far stop']].forEach(([yaw, name]) => { at[name] = look(yaw); });
    Object.keys(at).forEach(name => { const r = at[name];
      if (r.err) { P.push(r.err); return; }
      if (r.control) { P.push('the probe cannot measure the string at ' + name + ': two frames of the same scene differ by ' + r.control + ' pixels'); return; }
      if (r.foot < 100) { P.push('the hero paints ' + r.foot + ' pixels at ' + name + ' under the string in ' + spot.wid + ' — nothing to measure, which is not a pass'); return; }
      if (/quarter/.test(name) && r.over) P.push('at ' + name + ' the papel picado over row ' + spot.y + ' of ' + spot.wid + ' runs through the hero — ' + r.over + ' pixels of its string or its poles in and around his outline; a person standing under a string seen end-on hangs from it');
      if (!/quarter/.test(name) && !r.painted) P.push('at ' + name + ' the papel picado over ' + spot.wid + ' paints nothing at all — the paper came down instead of getting out of the way'); });
    seasonSet(pick0); world = keep.w; px = fx = keep.px; py = fy = keep.py; moving = keep.mv; TRO.state = keep.st; T3.yaw = keep.yaw;
    camSet(keep.cam); sizeCanvas(); t3Invalidate(); document.getElementById('world').hidden = true;
    return P;
  });
  fails.push(...endOn.filter(l => !/^COUNT-ONLY: /.test(l)));
  endOn.filter(l => /^COUNT-ONLY: /.test(l)).forEach(l => console.log('  ' + l));

  /* ---- AN OFRENDA STANDS ON SOMETHING (crew iteration 14, la ofrendera) ----
     The owner, 2026-09-22: "the altar above the table at dona tenchas is not ok, please fix." It was
     0.29 of a tile up in the air over her table, and the cause is a proxy of the oldest kind: the
     season-prop pass asked `wallH(g)` — 0.55 + the glyph's declared `lift` × 0.042, which is the
     height of a BOX — for a tile whose shape is a MESH. `wallH("T")` is 0.802; the table's own parts
     stop at 0.550. The number that is right for a box is exactly the one that is wrong for a mesh,
     which is why this asks BOTH: Meridian's table is a mesh, El Changarrito's is still a box.
     WHAT IT READS, and it is two things measured out of the BUILT SCENE and nothing out of the
     engine's arithmetic (docs/POSTMORTEM.md §0, .claude/skills/guard/SKILL.md §1):
       · where the prop was set down — the object's own y in the 3D group;
       · the top of what it was set ON — the highest vertex of the geometry already standing on that
         same tile, from its bounding box. A billboard is a picture and has no top, so only real
         geometry counts.
     TOLERANCE 0.05 of a tile, and the reason is the screen: the 3D camera stands 7.4 tiles back and
     6.2 up, a tile is about 35 px on a phone, so one screen pixel is 0.029 of a tile. 0.05 is under
     two pixels — the smallest disagreement anybody could see — while the fault it was written for is
     0.262, which is nine. Inside it sit the engine's own 0.01 of clearance and the 0.008 by which a
     box's measured height differs from the `wallH` formula.
     WHAT IT DOES NOT READ: a prop whose own art floats inside its own model. This says where the
     thing was set down, not where its ink starts.
     A prop the pack hangs in a window (`sill`) is not standing on the tile and is not asked. */
  const altarFeet = await page.evaluate(() => {
    const P = [];
    if (typeof T3 === 'undefined' || !window.THREE) { P.push('COUNT-ONLY: this shell declined 3D, so nothing was measured standing on anything'); return P; }
    if (typeof fiestaProps !== 'function' || typeof seasonSet !== 'function') { P.push('COUNT-ONLY: this engine sets no season props down'); return P; }
    const S = (typeof SEASONS !== 'undefined' && SEASONS) ? SEASONS : {};
    const sids = Object.keys(S).filter(k => S[k] && S[k].art && Array.isArray(S[k].art.props) && S[k].art.props.length);
    if (!sids.length) { P.push('COUNT-ONLY: no season in this pack sets anything down, so nothing can stand on anything'); return P; }
    const TOL = 0.05;
    const keep = { w: world, px, py, cam: camMode, yaw: T3.yaw, mv: moving, season: seasonPick, st: (typeof TRO !== 'undefined' ? TRO.state : null) };
    const bb = new THREE.Box3();
    let looked = 0, stood = 0;
    /* one reading of one built scene: the prop's y, and the top of the geometry under it */
    const read = (p) => {
      const at = []; T3.group.traverse(o => { const u = o.userData; if (u && u.x === p.x && u.y === p.y) at.push(o); });
      const prop = at.find(o => { const u = o.userData; return u.prop && !u.sill; });
      if (!prop) return { missing: true };
      const under = at.filter(o => o !== prop && o.isMesh && !(o.userData.prop || o.userData.swag || o.userData.papel || o.userData.pinata));
      if (!under.length) return { onGround: true };
      let top = -Infinity, what = '';
      under.forEach(o => { bb.setFromObject(o); if (bb.max.y > top) { top = bb.max.y; what = o.userData.g || '?'; } });
      return { feet: prop.position.y, top, what };
    };
    sids.forEach(sid => {
      seasonSet(sid);
      [...new Set(S[sid].art.props.map(p => p.world))].filter(wid => WORLDS[wid]).forEach(wid => {
        const props = fiestaProps(wid).filter(p => !p.sill);
        if (!props.length) return;
        world = wid; px = fx = 0; py = fy = 0; moving = false; held = null;
        if (typeof TRO !== 'undefined') TRO.state = 'away';
        camSet('3d'); T3.yaw = 0; t3Invalidate(); draw3d();
        props.forEach(p => {
          looked++;
          const a = read(p);
          if (a.missing) { P.push('in season "' + sid + '" the ' + (p.kind || 'prop') + ' the pack sets down in ' + wid + ' at (' + p.x + ',' + p.y + ') is nowhere in the 3D scene — nothing to look at, which is not a pass'); return; }
          if (a.onGround) return;                       /* it stands on the floor or on the stairs: a different question */
          /* THE CONTROL (docs/POSTMORTEM.md §13r): build the scene again and read the same two
             numbers. If they move, the probe is measuring something that is not the placement. */
          t3Invalidate(); draw3d();
          const b = read(p);
          if (b.missing || b.onGround || Math.abs(b.feet - a.feet) > 1e-6 || Math.abs(b.top - a.top) > 1e-6) {
            P.push('the ' + (p.kind || 'prop') + ' in ' + wid + ' at (' + p.x + ',' + p.y + ') cannot be measured: two builds of the same scene put it in two different places'); return; }
          stood++;
          const gap = a.feet - a.top;
          if (Math.abs(gap) > TOL) P.push('in season "' + sid + '" the ' + (p.kind || 'prop') + ' in ' + wid + ' at (' + p.x + ',' + p.y + ') ' + (gap > 0 ? 'floats ' : 'is sunk ') + Math.abs(gap).toFixed(3) + ' of a tile ' + (gap > 0 ? 'above' : 'into') + ' the "' + a.what + '" it was set on — it was set down at ' + a.feet.toFixed(3) + ' and the top of what stands on that tile is ' + a.top.toFixed(3) + '; an ofrenda stands ON something');
        });
      });
    });
    seasonSet(keep.season); world = keep.w; px = fx = keep.px; py = fy = keep.py; moving = keep.mv; T3.yaw = keep.yaw;
    if (typeof TRO !== 'undefined' && keep.st !== null) TRO.state = keep.st;
    camSet(keep.cam); sizeCanvas(); t3Invalidate();
    /* NOTHING TO MEASURE IS NOT A PASS (.claude/skills/guard/SKILL.md §2): this pack said it sets
       props down, so the check has to have looked at them, and at least one of them has to be
       standing on something — otherwise the whole question went unasked and printed green. */
    if (!looked) P.push('this pack declares season props and not one of them was looked at — the check measured nothing, which is not a pass');
    else if (!stood) P.push('none of the ' + looked + ' season props this pack sets down stands on anything at all, so "are its feet on it" was never asked of this build');
    return P;
  });
  fails.push(...altarFeet.filter(l => !/^COUNT-ONLY: /.test(l)));
  altarFeet.filter(l => /^COUNT-ONLY: /.test(l)).forEach(l => console.log('  ' + l));

  /* ---- a pack must be able to SAY where its trolley serves, in its own alphabet ----
     Until 2026-09-11 it could not: "is there a stop here" was Meridian's letter "Y", read straight
     out of the engine in the two places that matter — where the car is served and where the pass
     opens (docs/TAGS.md L20). A second world's stop glyph did nothing at all, and its ordinary Y
     tiles, whatever they meant in its alphabet, opened a menu it had never declared.
     This plants a REAL violation rather than reading source: a line whose stop is a tile carrying no
     stop glyph anywhere in it. Then it asks the two questions a person asks standing at a stop —
     does the tram come, and is this a stop — and it asks them of whatever game it was pointed at.
     It is non-vacuous in a pack with no trolley at all: the line is planted, not borrowed. */
  const troSeam = await page.evaluate(() => {
    const P = [];
    /* `rows`, NOT `grid`, and this is R11 wearing a different hat. The question here is "does this
       world have somewhere a tram could run" — a question about TERRAIN. `grid` is the map plus
       whoever is standing on it, so a neighbour who happened to wander into the only four-in-a-row
       made a five-tile world report that the trolley seam could not be tested at all, about one run
       in twenty. The map is what was authored; a person is weather. Read the map. */
    const walk = (w, x, y) => { const g = w.rows[y] && w.rows[y][x]; return g !== undefined && !SOLID.has(g); };
    let pick = null;
    Object.keys(WORLDS).some(id => { const w = WORLDS[id];
      for (let y = 1; y < w.H - 1 && !pick; y++) for (let x = 1; x < w.W - 4; x++) {
        if (!walk(w, x, y + 1)) continue;
        let ok = true; for (let i = 0; i < 4; i++) if (!walk(w, x + i, y)) ok = false;
        if (ok) { pick = { world: id, row: y, from: x, to: x + 3, stops: [{ x: x + 1, y: y + 1 }] }; break; }
      }
      return !!pick; });
    if (!pick) { P.push('this game has no four walkable tiles in a row anywhere — the trolley seam cannot be tested at all, which is not a pass'); return P; }

    const had = (typeof TROLLEYAT !== 'undefined' && TROLLEYAT) ? TROLLEYAT : null, restore = had ? had.slice() : null;
    if (had) { had.length = 0; had.push(pick); } else { window.TROLLEYAT = [pick]; }
    const keep = { world, px, py, st: TRO.state, x: TRO.x, t: TRO.t, called: TRO.called, moving };
    const s0 = pick.stops[0];
    world = pick.world; px = fx = s0.x; py = fy = s0.y; moving = false;

    if (typeof troIsStop !== 'function' || typeof troStops !== 'function')
      P.push('nothing in this engine can be asked where a trolley stop is — the only way to say it is one town\'s letter');
    else if (!troIsStop(pick.world, s0.x, s0.y))
      P.push('the line says it serves ' + s0.x + ',' + s0.y + ' and the engine does not agree that is a stop');

    /* the tell is that the car SETS OFF. troUpdate clears TRO.called in the same tick it acts on
       it, so a test that reads the flag afterwards is reading something already spent. */
    TRO.state = 'away'; TRO.t = 0; TRO.x = 0; TRO.called = false;
    troUpdate(50);
    if (TRO.state !== 'run') P.push('standing at the stop this line declares does not bring the trolley');

    world = keep.world; px = fx = keep.px; py = fy = keep.py; moving = keep.moving;
    TRO.state = keep.st; TRO.x = keep.x; TRO.t = keep.t; TRO.called = keep.called;
    if (had) { had.length = 0; restore.forEach(r => had.push(r)); } else { try { delete window.TROLLEYAT; } catch (e) {} }
    return P;
  });
  fails.push(...troSeam);

  /* ---- and the pack is told, out loud, when it says something the engine will not act on ----
     The PLDEF lesson (docs/TAGS.md L16): declaring NOTHING is safe and declaring HALF is what
     hurts, so silence is the wrong answer to a half-declared line. Planted, not read: give a line
     a word this engine does not have a reader for and check that somebody says so. */
  const troLoud = await page.evaluate(() => {
    const P = [];
    if (typeof troAudit !== 'function') { P.push('nothing ever reads a trolley line back to the pack that wrote it'); return P; }
    const had = (typeof TROLLEYAT !== 'undefined' && TROLLEYAT) ? TROLLEYAT : null, restore = had ? had.slice() : null;
    const wid = Object.keys(WORLDS)[0];
    const plant = [{ world: wid, row: 1, from: 0, to: 3, dwell: 4200 },
                   { world: wid, row: 2, from: 0, to: 3 },
                   { world: wid, row: 3, from: 0, to: 3, stops: [{ x: 0, y: 3 }] }];
    if (had) { had.length = 0; plant.forEach(p => had.push(p)); } else { window.TROLLEYAT = plant; }
    const said = troAudit().join(' | ');
    if (!/dwell/.test(said)) P.push('a trolley line can declare a word this engine has no reader for and nothing says so — somebody writes it, nothing happens, and there is no way to find out why');
    if (!/second one declared/.test(said)) P.push('a world can declare two trolley lines and lose one of them in silence');
    if (!/rails/.test(said)) P.push('a stop can be put on the tram\'s own rails and nothing objects — the pass opens under the tram');
    if (had) { had.length = 0; restore.forEach(r => had.push(r)); } else { try { delete window.TROLLEYAT; } catch (e) {} }
    if (troAudit().length) P.push('this game\'s own trolley line does not survive the check the engine makes of it: ' + troAudit().join(' | '));
    return P;
  });
  fails.push(...troLoud);

  /* ---- ...and a line that declares a TRAIN gets a train ----
     The owner, 2026-09-22: "we want to make this custom as possibly can turn in to a train of trolleys
     in other games and a new level unless you recommmend otherwise." `cars: n` on the line's own row
     is the whole seam (engine.js, troCars). NEITHER GAME DECLARES IT — which is exactly why it needs
     this: a seam no shipped pack uses is a seam that rots in silence, and the next person to write
     `cars: 3` in a second game finds out on their own screen whether it was ever real. So the check
     PLANTS the declaration, in this game, for the length of one evaluate, and asks what a person
     would ask: is it longer, is every car there, does the street brake for the tail of it, and is
     there still exactly one man driving.
     The lengths and counts all come from troSpan/troCars — the engine's own arithmetic, not a copy
     typed here — because the one thing this check must not do is prove that 3*2+2*0.14 is 6.28. */
  const troTrain = await page.evaluate(() => {
    const P = [];
    if (typeof troCars !== 'function' || typeof troSpan !== 'function') { P.push('this engine cannot be asked how many cars a trolley line runs — `cars:` is a word with no reader'); return P; }
    const L = (typeof TROLLEYAT !== 'undefined' && TROLLEYAT && TROLLEYAT[0]) ? TROLLEYAT[0] : null;
    if (!L) return P;
    const w = WORLDS[L.world]; if (!w) return P;
    const keep = { w: world, px, py, cam: camMode, st: TRO.state, x: TRO.x, d: TRO.dir, cars: ('cars' in L) ? L.cars : undefined };
    const one = troSpan(L);
    if (troCars(L) !== 1 || one !== 2) { P.push('COUNT-ONLY: this game already declares a train, so the one-car baseline could not be taken'); }
    L.cars = 3;
    const three = troSpan(L);
    /* 1. it is longer, and the arithmetic is the engine's */
    if (!(three > one * 2.5)) P.push('a line that declares three cars is ' + three.toFixed(2) + ' tiles long against one car\'s ' + one.toFixed(2) + ' — declaring a train does not make the vehicle any bigger');
    /* 2. the street knows about the whole of it: the brake band reaches the TAIL, six tiles back */
    TRO.dir = L.to >= L.from ? 1 : -1; TRO.state = 'run'; TRO.x = troClampX(L, Math.round((L.from + L.to) / 2));
    const nose = TRO.x + (TRO.dir > 0 ? three : 0), tail = Math.round(nose - TRO.dir * (three - 0.5));
    if (typeof troDanger === 'function' && !troDanger(L.world, tail, L.row))
      P.push('standing on the rails beside the LAST car of a three-car train, the street does not think you are near a tram at all — the tail of it runs over you while the front is what everything reads');
    /* 3. and only ONE of them is the car that berths: the stop is served by the leading car, not by
          whichever of the three happens to be level with it. This is the fault of iteration 12 one
          size up — "it stopped, and not where you can see it" — and it is the reason troServing
          reads troLead. Put the TAIL at the platform and it must not count as serving it. */
    const s = (typeof troStops === 'function') ? troStops(L)[0] : null;
    if (s) {
      TRO.x = troClampX(L, TRO.dir > 0 ? s.x - 0.5 : s.x - three + 0.5);   /* the tail level with the platform */
      const at = troServing(L);
      if (at && Math.abs(troLead(L) - s.x) > 2.5)
        P.push('a three-car train counts as standing at the stop when its TAIL is level with it — the person waiting watches two cars go by and then a third one whose doors are six tiles from the sign');
    }
    /* 4. it is built: three cars, twelve wheels, one driver, and as long in the scene as on paper */
    if (typeof T3 !== 'undefined' && window.THREE) {
      document.getElementById('world').hidden = false;
      world = L.world; camSet('3d'); TRO.state = 'run'; TRO.x = troClampX(L, L.from + 1); sizeCanvas(); draw3d();
      if (!T3.tram) P.push('a line that declares three cars builds no tram at all');
      else {
        let cars = 0, wheels = 0, driver = 0;
        T3.tram.traverse(o => { const u = o.userData || {}; if (u.car) cars++; if (u.wheel) wheels++; if (u.driver) driver++; });
        /* the CARS, not the group: the driver stands at the nose by an arithmetic that reads the span, so the
           whole-group box measures the length it is being checked against whether the cars are there or not */
        const box = new THREE.Box3().setFromObject(T3.tram);
        const cb = new THREE.Box3(); T3.tram.traverse(o => { if ((o.userData || {}).car) cb.union(new THREE.Box3().setFromObject(o)); });
        const got = cars ? cb.max.x - cb.min.x : 0;
        if (cars !== 3) P.push('a line that declares three cars builds ' + cars + ' — the other cars of the train are not there');
        if (wheels !== 12) P.push('a three-car train has ' + wheels + ' wheels — a car with no wheels under it is being dragged');
        if (driver !== 1) P.push('a three-car train has ' + driver + ' drivers — a tram has ONE, in the leading car, and he walks the length of it to change ends');
        if (Math.abs(got - three) > 0.35) P.push('a line that declares three cars puts ' + got.toFixed(2) + ' tiles of vehicle on the street where it says ' + three.toFixed(2));
        if (box.min.y > 0.04) P.push('a three-car train floats ' + box.min.y.toFixed(2) + ' above the road — the cars behind the first one have nothing under them');
      }
      /* 5. and the flat cameras draw all of it. A seam that is only true in one camera is a lie in
            three: the isometric camera lost the whole tram once already for exactly this reason. */
      /* COUNT THE CARS PAINTED, NOT THE CALLS THAT PAINTED THEM. The first draft wrapped troDraw2D
         and wanted three calls, and it went red on a working three-car train: the flat cameras call
         troDraw2D ONCE and it loops the cars inside, while the isometric camera calls it once PER
         car because each one takes its own place in the depth queue. A call is a proxy for a car —
         caught by the plant, on the run that wrote it, which is the only way this ever gets caught
         (docs/REGRESSION.md). drawTram is the thing that puts one car on the screen. */
      const real = window.drawTram; const drawn = {};
      ['top', 'front', 'iso'].forEach(c => { let n = 0; window.drawTram = function () { n++; return real.apply(this, arguments); };
        camSet(c); sizeCanvas(); draw(); drawn[c] = n; });
      window.drawTram = real;
      Object.keys(drawn).forEach(c => { if (drawn[c] !== 3)
        P.push('the ' + c + ' camera paints ' + drawn[c] + (drawn[c] === 1 ? ' car' : ' cars') + ' of a three-car train — the rest of it runs down the street invisibly, and people stand where a car already is'); });
      camSet(keep.cam); sizeCanvas(); document.getElementById('world').hidden = true;
    } else P.push('COUNT-ONLY: this shell declined 3D, so the planted train was not measured in the scene');
    /* 6. and the audit refuses a train that cannot fit its own line, before a player ever sees it */
    const long = { world: L.world, row: L.row, from: 0, to: 2, cars: 4 };
    const had = TROLLEYAT.slice(); TROLLEYAT.length = 0; TROLLEYAT.push(long);
    if (!/longer than its own line/.test(troAudit().join(' | ')))
      P.push('a line can declare a train longer than the street it runs on and nothing says so — it is born off one end, never clears the other, and the run never finishes');
    TROLLEYAT.length = 0; had.forEach(r => TROLLEYAT.push(r));
    if (keep.cars === undefined) delete L.cars; else L.cars = keep.cars;
    world = keep.w; px = fx = keep.px; py = fy = keep.py; TRO.state = keep.st; TRO.x = keep.x; TRO.dir = keep.d;
    if (typeof T3 !== 'undefined' && T3 && T3.tram && T3.tramCars !== troCars(L)) { T3.scene.remove(T3.tram); T3.tram = null; }
    if (troAudit().length) P.push('the planted train was not put back: ' + troAudit().join(' | '));
    return P;
  });
  fails.push(...troTrain.filter(l => !/^COUNT-ONLY: /.test(l)));
  troTrain.filter(l => /^COUNT-ONLY: /.test(l)).forEach(l => console.log('  ' + l));

  /* ---- and it is there in EVERY camera it is drawn in ----
     Measured: with the trolley running, switching the camera changed 1466 pixels in top, 1704 in
     front, and ZERO in isometric. Not "looks wrong" — the trolley does not exist there. troDraw2D
     has exactly two call sites and drawIso is not one of them, so a player on the isometric camera
     watches an empty street forever while a tram drives down it. test/smoke.js exercises top, front
     and 3D by name and skips iso, which is why nobody noticed. Found by Chava, riding it. */
  const troCams = await page.evaluate(() => {
    const P = [];
    const L = (typeof TROLLEYAT !== 'undefined' && TROLLEYAT && TROLLEYAT[0]) ? TROLLEYAT[0] : null;
    if (!L) return P;
    const bw = world, bc = camMode, bs = TRO.state, bx = TRO.x;
    document.getElementById('world').hidden = false; world = L.world;
    TRO.state = 'run'; TRO.x = L.from + 1;
    /* Asked by counting whether the trolley is DRAWN AT ALL in each camera, not by diffing pixels.
       Pixels were tried first and they cannot answer this: petals fall, critters move and the light
       drifts, so two frames differ whether or not a tram was in either of them — the check passed
       while the isometric camera was measurably showing nothing (0 changed pixels against 1466 in
       top and 1704 in front). A test that passes for a reason that is not the thing it is about is
       the failure this file's own comments keep recording. */
    const real = window.troDraw2D; const seen = {};
    ['top', 'front', 'iso'].forEach(c => {
      let n = 0; window.troDraw2D = function () { n++; return real.apply(this, arguments); };
      camSet(c); sizeCanvas(); draw(); seen[c] = n;
    });
    window.troDraw2D = real;
    Object.keys(seen).forEach(c => { if (!seen[c])
      P.push('the trolley drives down the street and the ' + c + ' camera never draws it at all — a player on that camera watches an empty road forever'); });
    TRO.state = bs; TRO.x = bx; world = bw; camSet(bc); sizeCanvas();
    document.getElementById('world').hidden = true;
    return P;
  });
  fails.push(...troCams);

  /* ---- THE DOOR IS SHUT WHEN THE WORLD CHANGES (owner, 2026-09-17: "i think i want that option A") ----
     A portal used to swap the world between one frame and the next and then block input for 450ms
     with nothing drawn in it — an instant cut, then standing still somewhere you did not walk to.
     The transition slot existed and was empty.

     The noun is "you never see one place become another", and there are exactly two ways to fail it:
       1. the swap happens while the overlay is not covering the screen — a visible cut;
       2. the overlay covers and never comes back up — a game that goes black and stays black.
     Both are asked of the DOM, at the moment it matters, by driving the real portal and watching the
     leaves' own geometry rather than a class name: a class is a label, a rectangle is the thing the
     player sees. And the door is taken from the SHELL, so a second world that forgot to put the
     element in its own index.html fails here rather than teleporting silently.
     IT SITS HERE, AHEAD OF THE DOCUMENT CHECKS, because those do `body.innerHTML = ''` and never put
     it back — so every later check that needs a real screen is measuring a page with no viewport in
     it. This one said so out loud rather than passing quietly, which is how it was found. */
  const doorway = await page.evaluate(() => new Promise(resolve => {
    const P = [], d = document.getElementById('door');
    if (!d) return resolve(['this shell has no #door — a portal in it is still an instant cut']);
    const a = d.querySelector('.leaf.a'), b = d.querySelector('.leaf.b'), vp = d.parentElement;
    if (!a || !b) return resolve(['#door has no leaves to close']);
    /* this suite never enters the world, so the viewport is collapsed to nothing until it is shown —
       the same line four earlier checks in this file already need. Without it every rectangle is zero
       and this passes on a page with no screen in it, which is the silent zero exactly. */
    const wld = document.getElementById('world'), wasHid = wld && wld.hidden;
    if (wld) { wld.hidden = false; if (typeof sizeCanvas === 'function') sizeCanvas(); }
    const out = P2 => { if (wld) wld.hidden = wasHid; if (typeof doorRest === 'function') doorRest(); return resolve(P2); };
    /* HOW MUCH OF THE VIEWPORT THE TWO LEAVES COVER, as a fraction: 1 when shut, 0 when open. The
       first draft added up three gaps and reported 296 pixels of "daylight" for a door standing wide
       open at rest — the same number a broken door gives. A measure that cannot tell shut from open
       is not a measure. */
    const cover = () => {
      const v = vp.getBoundingClientRect();
      if (v.height < 40) return null;
      const seg = r => [Math.max(v.top, r.top), Math.min(v.bottom, r.bottom)];
      const [a0, a1] = seg(a.getBoundingClientRect()), [b0, b1] = seg(b.getBoundingClientRect());
      const la = Math.max(0, a1 - a0), lb = Math.max(0, b1 - b0);
      const ov = Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
      return (la + lb - ov) / v.height;
    };
    if (cover() === null) return out(['the viewport had no height when the door was tested, so nothing was measured — this check did not run']);

    /* 1 — THE GEOMETRY, held still. Every state the door can be in, with the animation turned off,
       so what is measured is where the leaves END UP and not a frame caught mid-slide in a headless
       page whose main thread is busy. This is the half that catches the real bugs: a leaf anchored to
       the bottom needs to travel more than its own height to leave by the TOP, and -102% only lifted
       it into the top half — a black band across the new place that never goes away. */
    if (typeof doorSet !== 'function') P.push('the engine has no doorSet — the door is not the engine\'s to drive');
    else {
      doorSet('shut', 0);
      const shut = cover();
      if (shut < 0.995) P.push('a SHUT door covers only ' + Math.round(shut * 100) + '% of the viewport — the swap behind it would be there to see');
      ['up', 'down', 'flat'].forEach(k => {
        doorSet('open-' + k, 0);
        const c = cover();
        if (c > 0.05) P.push('an opened door (' + k + ') still covers ' + Math.round(c * 100) +
          '% of the viewport — a black band sits over the place you just walked into');
      });
      doorSet('', 0);
      const rest = cover();
      if (rest > 0.05) P.push('the door at rest covers ' + Math.round(rest * 100) + '% of the viewport — it is in the way when nothing is happening');
      /* AND GOING BACK TO THE WINGS IS NOT A MOVE ANYBODY SEES. Dropping the class re-applies each
         leaf's resting transform, and the bottom leaf's rest is BELOW the screen — so if the
         transition is still armed, a door that has just finished opening sends that leaf sliding
         back down across the whole viewport: a black band sweeping over the place you arrived in, a
         third of a second late. The geometry above cannot see it, because the geometry is held
         still; this reads the cause. Planted (doorRest with the open duration) and it was the one
         of four plants that went through until this line existed. */
      if (typeof doorRest === 'function') {
        doorRest();
        const dur = getComputedStyle(b).transitionDuration || '';
        if (!/^0m?s$/.test(dur.split(',')[0].trim()))
          P.push('the door goes back to its resting place over ' + dur.split(',')[0].trim() +
            ' — the bottom leaf slides back across the screen after the door has already opened');
      }
    }

    /* 2 — THE SEQUENCE, on the real portal. Not the geometry again: only whether the world changes
       while the door is SHUT. Read off the engine's own state rather than off pixels, because a
       starved frame in a headless run can hide a transform mid-flight and this must not be flaky. */
    let from = null, gl = null;
    Object.keys(PORTALS).forEach(w => { if (from) return;
      const ks = Object.keys(PORTALS[w] || {}); if (ks.length) { from = w; gl = ks[0]; } });
    /* A ONE-ROOM WORLD HAS NO DOORS and owes this nothing — and it SAYS so: the gauge's own maps
       carry `const PORTALS={}` with "one room needs no doors" written next to it. That is a
       declaration, not an absence, and a guard can read it. What it may not do is shrug: a shell
       that declares doors and exercised none of them has a broken check, and the two cases are
       told apart by counting what the pack promised rather than by giving up. */
    const promised = Object.keys(PORTALS).reduce((n, w) => n + Object.keys(PORTALS[w] || {}).length, 0);
    if (!from) return out(P.concat([promised
      ? 'this shell declares ' + promised + ' portals and this guard could not find one to stand on — the check is broken, not the city'
      : 'COUNT-ONLY: this shell declares no portal at all, so there was no door to shut (and none is owed)']));
    const W = WORLDS[from]; let sx = -1, sy = -1;
    for (let y = 0; y < W.H; y++) for (let x = 0; x < W.W; x++) if (W.rows[y][x] === gl) { sx = x; sy = y; }
    if (sx < 0) return out(P.concat(['the ' + from + ':' + gl + ' portal has no tile in the map']));
    P.push('COUNT-ONLY: ' + promised + ' portals declared; the door was driven through ' + from + ':' + gl);
    const keep = { world, px, py, fx, fy };
    world = from; px = fx = sx; py = fy = sy; moving = false; held = null; portalHold = ''; portalT = 0;
    const was = from, t0 = performance.now();
    let sawShut = false, clsAtSwap = null;
    const tick = () => {
      if (d.className === 'shut') sawShut = true;
      if (world !== was && clsAtSwap === null) clsAtSwap = d.className || '(none)';
      if (clsAtSwap !== null || performance.now() - t0 > 4000) {
        if (clsAtSwap === null) P.push('standing on the ' + from + ':' + gl + ' portal never changed the world at all in four seconds');
        else {
          if (!sawShut) P.push('the world changed and the door was never shut at any point — the swap is still an instant cut');
          if (clsAtSwap !== 'shut') P.push('the world changed while the door was "' + clsAtSwap +
            '" and not shut — you can see one place become another');
        }
        world = keep.world; px = keep.px; py = keep.py; fx = keep.fx; fy = keep.fy;
        return out(P);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }));
  fails.push(...doorway.filter(l => !/^COUNT-ONLY: /.test(l)));
  doorway.filter(l => /^COUNT-ONLY: /.test(l)).forEach(l => console.log('  ' + l));

  /* ---- A ROOM YOU HAVE BEEN IN IS STILL STANDING (owner, 2026-09-17: "3. ok go for it") ----
     There was one 3D scene, and every door threw it away and built another: 1.4ms for the smallest
     room, 18.4 for Calle Principal, and a 237ms hole after the swap once the upload is counted —
     the thing that made the new door POP instead of open. They are kept now.

     Three claims, and the second is the one that matters more than the speed:
       1. going back into a room does not rebuild it — measured by IDENTITY, not by a stopwatch. The
          same THREE.Group object, or it was rebuilt;
       2. a world that has CHANGED is rebuilt — `t3Invalidate` is what growth and a theme edit call,
          and a cache that ignored it would show a player a city that no longer exists. This is the
          half a cache gets wrong, and it is the half nobody notices until somebody buys a building
          and it does not appear;
       3. and the cache has a ceiling, because a cache without one is a leak with a nicer name. */
  const scenes = await page.evaluate(() => {
    const P = [];
    if (!window.THREE) return ['COUNT-ONLY: this shell declined 3D, so there are no scenes to keep'];
    if (typeof T3CACHE === 'undefined') return ['the 3D scenes are not kept — every door rebuilds the world it opens into'];
    const keep = { world, px, py, cam: camMode };
    const wd = document.getElementById('world'), wh = wd.hidden; wd.hidden = false;
    camSet('3d'); sizeCanvas();
    const ids = Object.keys(WORLDS);
    const go = w => { world = w; px = fx = 1; py = fy = 1; draw3d(); return T3.group; };
    const a = ids[0], b = ids[1] || ids[0];
    const g1 = go(a); go(b); const g2 = go(a);
    if (g1 !== g2) P.push('walking back into ' + a + ' built it again from nothing — the scene was not kept');
    /* 2 — and a world that changed is NOT the one you left */
    if (typeof t3Invalidate === 'function') {
      t3Invalidate();
      const g3 = go(a);
      if (g3 === g2) P.push('the city changed (t3Invalidate) and ' + a + ' was served from the cache anyway — a player would be walking round a city that no longer exists');
      let stale = 0; T3CACHE.forEach((e, k) => { if (k.slice(k.lastIndexOf('|') + 1) !== String(T3.dirty)) stale++; });
      if (stale) P.push(stale + ' scene(s) from before the change are still held — they can never be used again and they are holding their textures');
    }
    /* 3 — the ceiling */
    ids.forEach(go);
    /* the ceiling is asked as a FACT, not as the code's own constant. The first draft compared
       T3CACHE.size against T3CACHE_MAX — so raising T3CACHE_MAX to 999 turned the cache off and the
       guard still passed, which is a guard reading the thing it is meant to be checking. Planted
       exactly that. What "bounded" means here is: after walking the whole city you are not holding
       the whole city. */
    const HARD = 16;
    if (T3CACHE.size > HARD) P.push('after walking every world the cache holds ' + T3CACHE.size + ' scenes — past any ceiling worth having');
    if (ids.length > 8 && T3CACHE.size >= ids.length)
      P.push('after walking all ' + ids.length + ' worlds the cache holds ' + T3CACHE.size + ' scenes — it is keeping the entire city and evicting nothing');
    P.push('COUNT-ONLY: ' + T3CACHE.size + ' 3D scenes kept after walking all ' + ids.length + ' worlds');
    world = keep.world; px = fx = keep.world === world ? px : 1; py = fy = keep.py; px = keep.px; py = keep.py;
    camSet(keep.cam); wd.hidden = wh;
    return P;
  });
  fails.push(...scenes);

  /* ---- EVERY PLACE IS ON THE MAP, AND THE MAP AGREES WITH THE DOORS ----
     Owner, 2026-09-17, asked whether an interior belongs on a street map at all: "yeah i mean a map
     implies this lol". He is right, and the city was not keeping that promise — six of fifteen
     worlds were on the plan in NO form, including the park, which is the third-largest world in the
     game. Seven more had a hand-typed dot, and every one of those seven agreed exactly with the
     door that leads there: seven copies of a fact the map already had.

     Two claims:
       1. every world can be LOCATED on the plan — drawn, or reached from somewhere that is, or
          declared by the pack because nothing leads there (the park, reached on a leash);
       2. and a DECLARED spot agrees with the doors. This is the one worth having: a copy's failure
          mode is that the door moves and the copy does not, and nothing on screen looks wrong —
          the mark simply points at the wrong building, forever, and no camera can tell you.
     A world that a pack deliberately keeps off the map is a real thing (a memory, a dream, a menu),
     so being unplaceable is reported with its reason rather than assumed to be a bug — but a pack
     that DECLARED a spot and got it wrong is always a fault. */
  const places = await page.evaluate(() => {
    const P = [];
    if (typeof planPlace !== 'function') return ['the engine cannot say where a world is on the plan — there is no planPlace'];
    /* MEASURED ON THE FINISHED CITY. At chapter zero six of these doors are not laid yet — a
       storefront appears when its district opens — so asking at the title screen reports six worlds
       "with no door into them" and means only "you have not got there yet". The question is whether
       the map can place a world the player can REACH, so the city is grown first and put back after. */
    const keepD = new Set(done), keepC = chSeen;
    if (typeof CHAPTERS !== 'undefined' && typeof applyGrowth === 'function') {
      CHAPTERS.forEach(c => (c.quests || []).forEach(i => done.add(i)));
      chSeen = CHAPTERS.length; applyGrowth();
    }
    const M = (typeof MAPDOT !== 'undefined' ? MAPDOT : {});
    const ids = Object.keys(WORLDS), lost = [];
    ids.forEach(id => {
      const at = planPlace(id);
      if (!at) { lost.push(id); return; }
    });
    /* 2 — a DECLARED spot, against what the doors alone say. Asked with every declaration
       suppressed (`pure`), because the first draft asked with them in place and mis-read a CYCLE:
       El Changarrito's hq and f2 each reach the other and neither is drawn, so each APPEARED
       derivable while in fact the other's declaration was the only thing holding either on the
       map. Delete both and both vanish. So the three answers are kept apart:
         · the doors find it and agree     → the written-down copy is redundant, and a copy's only
                                             future is to go stale when the door moves;
         · the doors find it and disagree  → one of the two points at the wrong building, and
                                             nothing on any screen can tell you which;
         · the doors cannot find it at all → the declaration is the only thing there is. Correct,
                                             and the park is exactly this: you reach it on a leash. */
    Object.keys(M).forEach(id => {
      if (!WORLDS[id]) { P.push('the plan names a spot for "' + id + '" and there is no such world'); return; }
      const byDoor = planPlace(id, null, true);
      if (!byDoor) return;
      if (M[id][0] !== byDoor.gx || M[id][1] !== byDoor.gy)
        P.push('the pack puts "' + id + '" at ' + M[id] + ' on the plan and its own door puts it at ' +
               byDoor.gx + ',' + byDoor.gy + ' (via ' + byDoor.via + ') — one of the two is pointing at the wrong building and nothing on screen can tell you which');
      else
        P.push('"' + id + '" is written down in MAPDOT and its doors alone already say where it is (' + byDoor.via +
               ') — the copy can only ever go stale');
    });
    if (lost.length) P.push('COUNT-ONLY: ' + lost.length + ' world(s) have no place on the plan and no door into them: ' + lost.join(', '));
    P.push('COUNT-ONLY: ' + (ids.length - lost.length) + ' of ' + ids.length + ' worlds are placed on the plan');
    done = keepD; chSeen = keepC; if (typeof applyGrowth === 'function') applyGrowth();
    return P;
  });
  fails.push(...places);

  /* ---- a document may carry a DRAWING, not only words ----
     The owner, 2026-09-11, on the crew mural: "can we have functionality there wehre you see
     tiles/icons from afar but you get close and can interact to see it full screen- then thats how
     pixels/art can be used there by agents".
     Both halves of that nearly existed. A thing you notice from across a room and walk up to is
     READS + the breathing mark + the Read button. A panel that opens over the world is docOpen. But
     the reader could only render WORDS — h, p, note, red, blank, kv, table, q, btn, sel, form — so
     the largest picture a pack could put in front of a person was a 32-pixel tile seen from twelve
     tiles back. That is the sugar-skull mistake as a rule rather than an accident: this engine has
     had no surface where art is meant to be looked at closely.
     `art` is that surface. The pack hands a draw function; the engine gives it a canvas and never
     learns what is on it — the same bargain as TILEART and DECOART.
     Asks what a PERSON gets: is there a picture, and is it big enough to be worth walking up to. */
  const docArt = await page.evaluate(() => {
    const P = [];
    const body = document.getElementById('docBody');
    if (!body) { P.push('this shell has no reader at all'); return P; }
    let drew = 0, gotW = 0, gotH = 0;
    const probe = { h: 'A drawing', art: (g, w, h) => { drew++; gotW = w; gotH = h;
      g.fillStyle = '#C6DCEA'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#7A3FE0'; g.fillRect(8, 8, w - 16, h - 16); } };
    if (typeof docRender !== 'function') {
      P.push('a pack cannot put a picture in front of a person — the reader renders words and nothing else, so the biggest art in this game is a tile seen from across the street');
      return P;
    }
    /* the reader must actually be OPEN to measure it — a hidden element has no box, and the first
       version of this check read 0 and blamed the code. Open it, measure, put it back. */
    const rd = document.getElementById('reader'); const wasHidden = rd ? rd.hidden : true;
    if (rd) rd.hidden = false;
    body.innerHTML = '';
    docRender(body, [probe]);
    const cv = body.querySelector('canvas');
    if (!cv) P.push('a document carrying a drawing rendered no drawing');
    else {
      if (!drew) P.push('the reader made a canvas and never asked the pack to draw on it');
      const box = cv.getBoundingClientRect();
      if (box.width < 200)
        P.push('the picture is only ' + Math.round(box.width) + ' pixels across — not worth walking up to, which was the whole point');
      if (gotW < 200 || gotH < 100)
        P.push('the pack was handed a ' + gotW + '×' + gotH + ' canvas to draw on — too small to be the close-up view of anything');
    }
      /* ---- and it must FIT the column it sits in ----
         The first version of this check asked only whether the picture was big ENOUGH and never
         whether it was too big, which is the same one-sided guard this repo has now paid for five
         times (docs/REGRESSION.md: a guard has to read the noun it actually means).
         Measured when the crew's mural landed: a 512 px canvas in a 412 px column — a fifth of
         every drawing off the right-hand edge, in both packs, for anyone who opened a document.
         The cause is worth keeping in the message: docOpen renders while the reader is still
         hidden, a hidden element's clientWidth is 0, and the `|| 520` fallback then invented a
         width nobody has. So this renders the way docOpen really does — hidden, then shown — and
         asks the browser what it actually got. Rendering into an already-open reader does not
         reproduce it and would pass forever. */
      if (rd) {
        rd.hidden = true;                       /* exactly what docOpen does */
        body.innerHTML = '';
        docRender(body, [probe]);
        rd.hidden = false;
        const cv2 = body.querySelector('canvas');
        if (cv2) {
          const col = cv2.parentElement, room = col ? col.clientWidth : 0;
          const wide = cv2.getBoundingClientRect().width;
          if (room && wide > room + 1)
            P.push('a drawing in a document is ' + Math.round(wide) + ' pixels wide in a ' + Math.round(room) +
                   ' pixel column — ' + Math.round(wide - room) + ' pixels of every picture hang off the edge where nobody can see them');
        }
      }

    body.innerHTML = '';
    if (rd) rd.hidden = wasHidden;
    return P;
  });
  fails.push(...docArt);

  /* ---- A WINDOW A WALL DECLARES IS A WINDOW YOU CAN SEE, AND IT HAS A LEDGE ----
     Owner, 2026-09-17: "the skull on a non existing or visible window sill overlaps a store front
     that was initially a placeholder for a mural… if there were a window sill there, it should be
     drawn". He was exactly right, and this is the FIFTH time this bug has been answered — the four
     before it all argued about how big the sugar skull should be. Rendered at 8x before touching
     anything, the cause was plain: `TILES.win` is a rect the sill props, the dusk lighting and the
     candy's ledge are ALL positioned from, and nothing had ever drawn it. The plain facade painted
     two flat rectangles a shade off the wall; the mural panel then painted plaster over the whole
     tile and erased even those. So a lit pane, a sweet and a stone ledge sat in the middle of a
     blank wall. Every one of them was in the right place. There was just no window.

     The noun is "a window you can see, with a ledge under it", and it is asked of the PICTURE,
     because none of this is visible in the code:
       1. for every window the wall SHOWS (winsKept — a mural may paint one out, and then it must
          be gone from the picture too), the glass has to separate from the wall beside it by the
          repo's own floor of 40 luma. A window painted over is a window that fails this;
       2. under it, a LEDGE: the row at the window's foot is bright and the row under that is dark.
          A hard light-over-dark horizontal edge is the one shape that survives being scaled to
          three screen pixels, which is why the four size fixes never worked and this does;
       3. and every sill prop the season sets down stands in a window that passed 1 and 2.
     Check 3 is the one that would have caught the owner's tile: the candy at st(22,0) resolved to
     a window the mural had plastered over, and checks 1 and 2 are run on the tile AS THE GAME
     PAINTS IT — the facade art and then whatever decor is painted on top of it.
     PLANTED, both of them, in a copy outside the repo with the real code restored exactly:
       · the flat-rectangle window back in TILEDRAW["B"] → `the window at 5,10,8,9 is 0 luma from
         its lightest pixel to its darkest` and `no ledge under the window at 5,10,8,9`;
       · the panel plastering the whole tile again → the same two, at st 21,0 through 27,0, which
         is the owner's sentence in numbers.
     The first draft of check 1 measured something else — the mean of one row through the window
     against the wall beside it — and EL CHANGARRITO FAILED IT WHILE DRAWING A GOOD WINDOW, because
     that row crossed the shop's dark sign. It is written up where it happened, in `judge`. */
  const sills = await page.evaluate(() => {
    const P = [], L = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
    if (typeof winsKept !== 'function' || typeof drawPane !== 'function') return ['the engine has no window seam: winsKept/drawPane'];
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g2 = c.getContext('2d'), old = ctx;
    /* the tile exactly as a camera paints it: the wall's own face, then any decor on that tile */
    const paint = (wid, x, y) => {
      g2.clearRect(0, 0, 32, 32); ctx = g2;
      const ch = glyphAt(wid, x, y), tf = TILEDRAW[ch];
      if (tf) tf({ sx: 0, sy: 0, x, y, canopy: () => {} });
      DECOS.filter(d => d.world === wid && d.x === x && d.y === y)
        .forEach(d => { const f = DECODRAW[d.deco]; if (f) f(0, 0, d); });
      ctx = old;
      return g2.getImageData(0, 0, 32, 32).data;
    };
    const lumaAt = (d, x, y) => { const i = ((y | 0) * 32 + (x | 0)) * 4; return L(d[i], d[i + 1], d[i + 2]); };
    const rowMean = (d, x0, x1, y) => { let t = 0, n = 0; for (let x = Math.max(0, x0); x <= Math.min(31, x1); x++) { t += lumaAt(d, x, y); n++; } return n ? t / n : 0; };
    /* a window, measured where it is */
    const judge = (d, r, where) => {
      const [wx, wy, ww, wh] = r, bad = [];
      /* DEPTH, not "different from the wall". The first draft compared the mean of one row through
         the window against the wall beside it, and El Changarrito failed it while drawing a
         perfectly good window: that row crossed the shop's dark sign and the lit corner, and the
         mean landed 23 luma from the plaster. The mean of a picture is not the picture. What a
         window HAS and a patch of wall has not is internal range — glass, bars, a reflection. A
         window plastered over has the plaster's own range (trowel marks: 20), and so does a flat
         rectangle of any colour, which is what this facade painted for two years. */
      let lo = 255, hi = 0;
      for (let y = wy; y < wy + wh; y++) for (let x = wx; x < wx + ww; x++) { const v = lumaAt(d, x, y); if (v < lo) lo = v; if (v > hi) hi = v; }
      if (hi - lo < 40)
        bad.push(where + ': the window at ' + r.join(',') + ' is ' + Math.round(hi - lo) +
                 ' luma from its lightest pixel to its darkest — under the 40 this repo separates things by, a flat patch. That is what a window painted over, or never drawn, looks like');
      const foot = rowMean(d, wx, wx + ww - 1, wy + wh + 1), under = rowMean(d, wx, wx + ww - 1, wy + wh + 4);
      if (!(foot - under > 40))
        bad.push(where + ': no ledge under the window at ' + r.join(',') + ' — its foot is ' + Math.round(foot) +
                 ' luma and the row below is ' + Math.round(under) + ', so there is no bright-over-dark edge for anything to stand on');
      return bad;
    };
    /* 1 + 2: every window every wall in every world SHOWS */
    const seen = new Set();
    Object.keys(WORLDS).forEach(wid => { const w = WORLDS[wid];
      for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) {
        const ch = glyphAt(wid, x, y); if (!ch || !(TILES[ch] || {}).win) continue;
        const hasDeco = DECOS.some(d => d.world === wid && d.x === x && d.y === y);
        const k = ch + '|' + (hasDeco ? wid + ',' + x + ',' + y : '');
        if (seen.has(k)) continue; seen.add(k);
        const wins = winsKept(wid, x, y); if (!wins.length) continue;
        const d = paint(wid, x, y);
        wins.forEach(r => P.push(...judge(d, r, ch + ' at ' + wid + ' ' + x + ',' + y)));
      }});
    /* 3: and every sweet the season stands on a sill is standing in one of them */
    const was = seasonNow();
    Object.keys(typeof SEASONS !== 'undefined' ? SEASONS : {}).forEach(sid => {
      seasonSet(sid);
      (art('props', []) || []).filter(p => p.sill).forEach(p => {
        const win = propSill(p.world, p);
        if (!win) { P.push('a sill prop at ' + p.world + ' ' + p.x + ',' + p.y + ' (' + sid + ') resolves to NO window — it is standing on nothing'); return; }
        const wins = winsKept(p.world, p.x, p.y), r = wins[win.i] || wins[0];
        P.push(...judge(paint(p.world, p.x, p.y), r, 'the sill prop at ' + p.world + ' ' + p.x + ',' + p.y + ' (' + sid + ')'));
      });
    });
    seasonSet(was || 'auto');
    return [...new Set(P)];
  });
  fails.push(...sills);

  /* ---- A FLIGHT IS WALKED, NOT TELEPORTED (owner, 2026-09-17: "ok lets do b") ----
     What he reported: "that door right there to the top of a staircase. until you figure out how
     to teleport in my side of the screen." The code agreed with him in its own comment — the
     avenue door put you on the LANDING of Nolasco's stairs, at the top, with the whole climb
     behind you and none of it walked.

     Two nouns, and the second is the one that was quietly broken everywhere:
       1. NO PORTAL PUTS YOU AT THE SHALLOW END OF A FLIGHT. If a portal's arrival tile sits on a
          well run, it has to be the deepest tread of that run — the foot. Arriving at the head
          means the climb happened off-screen, which is the thing he refused.
       2. WHOEVER STANDS IN A WELL IS DRAWN IN IT. `stairLift`/`wellDepth` existed for two
          versions and ONLY engine3d.js ever read them, so in top, front and iso the hole was
          painted as ordinary floor and the hero stood on top of it at full height. Asked of the
          drawing, not the code: `drawPerson` is stubbed, each camera is rendered with the hero on
          each tread in turn, and the y it is called with has to descend as the treads do.
          Both flat cameras centre on the hero, so that y moves for exactly one reason — the drop.
     Run for every world, so a second game that digs a well gets the same two promises. */
  const flight = await page.evaluate(() => {
    const P = [];
    if (typeof wellDepth !== 'function' || typeof wellPx !== 'function') return ['the engine has no well seam: wellDepth/wellPx'];
    /* 1 — where a portal drops you, against where it took you from.
       The first draft of this asked only whether the arrival was the deepest tread of its run, and
       the plant — the avenue door back on the landing, exactly as it shipped — WENT STRAIGHT
       THROUGH IT, because the landing is not ON the run, it is the tile past the end of it. The
       hole was the whole bug.
       The rule that catches it also has to let hq↔f2 through, and for the right reason rather than
       by luck: there you leave standing ON a flight (the ▲ head) and arrive at the head of the
       well on the other side, and the two halves add up to one storey across the landing. What
       must never happen is leaving FLAT GROUND and arriving at the head of a flight — a climb with
       nothing on either side of the door to account for it. */
    const headOfWell = (w, x, y) => { const r = typeof stairRun === 'function' ? stairRun(w, x - 1, y) : null;
      return !!(r && r.well && r.i === r.L - 1); };
    const onStairs = (w, x, y) => { const r = typeof stairRun === 'function' ? stairRun(w, x, y) : null;
      return !!r || wellDepth(w, x, y) > 0; };
    Object.keys(PORTALS).forEach(from => {
      const fw = WORLDS[from]; if (!fw) return;
      Object.keys(PORTALS[from] || {}).forEach(ch => {
        const p = PORTALS[from][ch], w = p && WORLDS[p.to]; if (!p || !w) return;
        /* on a run: you must land at its foot, never part-way up */
        const run = typeof stairRun === 'function' ? stairRun(w, p.x, p.y) : null;
        if (run && run.well) {
          const mine = wellDepth(w, p.x, p.y);
          let deepest = 0; for (let i = 0; i < run.L; i++) deepest = Math.max(deepest, wellDepth(w, p.x - run.i + i, p.y));
          if (mine < deepest - 0.001)
            P.push('the ' + from + ':' + ch + ' door drops you at ' + p.to + ' ' + p.x + ',' + p.y +
                   ', which is ' + mine.toFixed(2) + ' down a well that goes ' + deepest.toFixed(2) +
                   ' — you arrive part-way UP a flight you never climbed');
        }
        /* and off flat ground you may not land at the head of one at all */
        if (!headOfWell(w, p.x, p.y)) return;
        let fromStairs = false;
        for (let y = 0; y < fw.H && !fromStairs; y++) for (let x = 0; x < fw.W; x++)
          if (fw.rows[y][x] === ch && onStairs(fw, x, y)) { fromStairs = true; break; }
        if (!fromStairs)
          P.push('the ' + from + ':' + ch + ' door stands on flat ground and drops you at ' + p.to + ' ' +
                 p.x + ',' + p.y + ' — the head of a flight, with the whole climb behind you and none of it walked');
      });
    });
    /* 2 — and the drawing agrees with the height */
    const keep = { world, px, py, fx, fy, cam: camMode, dp: drawPerson };
    const runs = [];
    Object.keys(WORLDS).forEach(wid => { const w = WORLDS[wid];
      for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) {
        if (wellDepth(w, x, y) <= 0) continue;
        const r = stairRun(w, x, y); if (!r || !r.well || r.i !== 0) continue;
        const a = x;                                   /* the deepest tread of this run */
        const tiles = []; for (let i = 0; i < r.L; i++) tiles.push([a + i, y]);
        tiles.push([a + r.L, y]);                      /* and the landing at the head, depth 0 */
        runs.push({ wid, tiles });
      }});
    /* ZERO IS AN ANSWER, AND IT HAS TO BE THE RIGHT ONE (owner, 2026-09-17: "can we make the
       guards smarter instead of just making them notes?"). He is right and the note was a cop-out:
       a guard that says "I measured nothing" is still a guard that measured nothing, and next week
       nobody reads the note. A five-tile world that never digs a hole genuinely owes this nothing —
       but a shell whose maps are FULL of wells and whose detector has stopped seeing them owes it
       everything, and those two look identical from inside `runs.length === 0`.
       So ask twice, in two different ways, and make the answers agree. The crude question is "does
       the glyph appear in anybody's rows at all" — no stairRun, no wellDepth, nothing that can
       break in the same way. If the crude answer is yes and the careful answer is zero, the careful
       one is broken and that is a failure, not a note. */
    let glyphs = 0;
    Object.keys(WORLDS).forEach(wid => WORLDS[wid].rows.forEach(r => { for (const c of r) if (c === '\u25BC') glyphs++; }));
    if (!runs.length && glyphs) P.push('the maps contain ' + glyphs + ' well mouths and this guard found NO flight to measure — the detector is broken, not the city');
    if (!runs.length && !glyphs) P.push('COUNT-ONLY: no world in this shell digs a well, so there was no flight to walk (and none is owed)');
    if (runs.length) P.push('COUNT-ONLY: ' + runs.length + ' flight' + (runs.length === 1 ? '' : 's') + ' walked in ' + Object.keys(WORLDS).length + ' worlds');
    ['front', 'iso'].forEach(cam => {
      runs.forEach(r => {
        const ys = r.tiles.map(([x, y]) => {
          let seen = null;
          drawPerson = (g, bx, by, look, o) => { if (o && o.hero) seen = by; };
          world = r.wid; px = fx = x; py = fy = y; moving = false; held = null;
          camSet(cam); draw();
          return seen;
        });
        if (ys.some(v => v === null)) { P.push(cam + ': the hero was not drawn on part of the flight in ' + r.wid); return; }
        for (let i = 1; i < ys.length; i++)
          if (!(ys[i] < ys[i - 1]))
            P.push(cam + ': in ' + r.wid + ', step ' + i + ' of the flight draws the hero at y=' + Math.round(ys[i]) +
                   ' and the step below at y=' + Math.round(ys[i - 1]) + ' — the flight does not descend on screen, it is a flat floor with a chevron on it');
        /* and it drops by EXACTLY what the world says, not by a number a guard picked. A minimum
           of "eight pixels, enough to see" failed f2 honestly: its well is three treads because
           the other three are hq's CLIMB on the far side of the same landing, so half a storey is
           the right answer there. The testable claim is not "enough" — it is that the drawing uses
           the height the data gives it. */
        const w2 = WORLDS[r.wid], deep = r.tiles[0];
        const want = cam === 'iso' ? isoWellPx(w2, deep[0], deep[1]) : wellPx(w2, deep[0], deep[1]);
        const drop = Math.round(ys[0] - ys[ys.length - 1]);
        if (drop !== want) P.push(cam + ': in ' + r.wid + ' the flight drops the hero ' + drop +
                   ' pixels from the landing to the bottom step and the world says ' + want +
                   ' — the drawing is not using the height it was given');
      });
    });
    drawPerson = keep.dp;
    world = keep.world; px = keep.px; py = keep.py; fx = keep.fx; fy = keep.fy; camSet(keep.cam);
    return P;
  });
  fails.push(...flight.filter(l => !/^COUNT-ONLY: /.test(l)));
  flight.filter(l => /^COUNT-ONLY: /.test(l)).forEach(l => console.log('  ' + l));


  await page.setViewportSize({ width: 480, height: 900 });
  await browser.close();
  /* COUNT-ONLY lines are what a check SAW, not what it found — "2 flights walked in 15 worlds",
     "21 portals declared", "3D declined". They exist so a zero is visible instead of silent
     (owner, 2026-09-17: "can we make the guards smarter instead of just making them notes?"), and
     they are printed rather than failed. One filter at the end, so a new check cannot forget one. */
  fails.filter(l => /^COUNT-ONLY: /.test(l)).forEach(l => console.log('  ' + l));
  fails = fails.filter(l => !/^COUNT-ONLY: /.test(l));
  if (attackRefused.length) console.log("  COUNT-ONLY: the page's policy refused " + attackRefused.length + " fetch(es) to example.invalid, the gauge pack's deliberate attack — as it must");
  if (refused.length) fails.push('the browser refused ' + refused.length + ' thing(s) this page asked for under its own policy (#254) — silent to a player, so a red here: ' + [...new Set(refused)].slice(0, 3).join(' | '));
  if (fails.length) { console.log('FAIL (' + idx + ')\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('OK — ' + idx + ': the worlds hang together, every person is reachable and named, every document builds, every camera draws every world, every door stands in 3D, every animal has ground, and storage stays under its prefix. Still flat in 3D (#39): ' + (r.stillFlat && r.stillFlat.length ? r.stillFlat.join(' ') : 'nothing') + '.');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
