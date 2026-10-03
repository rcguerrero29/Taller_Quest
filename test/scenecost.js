#!/usr/bin/env node
/* WHAT THE 3D SCENE COSTS — measured headless, as a STAND-IN for a phone and never as a phone (#317).

   Nobody had measured how hard the 3D view works while the shapes grew about tenfold in triangles
   (docs/3D-LOG.md: "Not measured today: frame time on a phone"). This opens a shell in headless
   Chromium at a phone's screen (390×844 CSS pixels, device scale factor 3, touch), raises the whole
   city, and for every world the 3D camera can show prints:
     - draw calls and triangles in one frame, read off the renderer (`renderer.info`) — what the
       camera actually sent to the GPU from the spot the hero stands on;
     - triangles in the whole world, counted off the scene from the same spot — every triangle whose
       object and parents are visible, culled or not (the cutaway hides walls by where the hero
       stands, so a wall it hides there is not counted);
     - how long the world's meshes take to build (`t3Build`, timed where draw3d calls it), and the
       first frame after it, which is when the new geometry is uploaded;
     - frame time over at least 120 frames (median and 95th percentile), each frame being draw3d and
       a one-pixel read that waits until the frame is really finished. A frame counts only when two
       things hold. The read proves the 3D CONTEXT is alive: the pixel is seeded with alpha 0 first,
       and this canvas has no alpha, so a live read returns 255 — on a lost context three.js skips the
       draw and the read returns at once, which would otherwise be timed as a nearly free frame. It
       does not prove THIS frame drew: a skipped draw leaves the last frame in the buffer, and the read
       returns 255 off that. So the renderer's draw-call count for the frame (`renderer.info`, read
       after the timed span) proves the renderer sent it; a frame with none is red.
   Twice: once at the machine's own speed, once with the page's processor slowed through the DevTools
   protocol (Emulation.setCPUThrottlingRate, ×4 unless --rate says otherwise).

   WHAT A STAND-IN CANNOT TELL YOU, said where the figures are printed and not only here: on a machine
   with no GPU, headless Chromium draws WebGL with SwiftShader, in software, in the browser's GPU
   process (the renderer's own name is printed, and the note follows it) — and the slow-down only
   reaches the PAGE's processor. So the slowed figures are the game's own
   per-frame script at a phone's pace plus the drawing at this machine's pace. The script share is
   printed separately for that reason. A phone has a GPU and a slower everything else; read these as
   numbers to compare against each other (before and after a lane), not as a phone's frame rate.

   RED, NOT A NUMBER (docs/REGRESSION.md row B: "Nothing to measure is not a pass"): a shell with no 3D engine, a
   world that draws no triangles, a world that was served from the cache instead of built, a frame
   that did not reach the renderer, a timed frame for which the renderer sent no draw call, a 3D
   context lost while frames were timed, fewer frames than asked, a slow-down that did not take, a
   page that crashed or closed or a browser that went away (each naming the world it was drawing),
   or no world measured at all — each one exits 1 with the sentence a person would say.
   Every one was planted in a copy outside the repository and went red (docs/3D-LOG.md, 2026-10-03).

   Run:  node test/scenecost.js                                   (Meridian, every world, both speeds)
         node test/scenecost.js --index <shell> --worlds st,pk --frames 240 --season muertos --rate 6
   --season is `off` (year-round) by default, so two runs on different dates measure the same city.
   NOT A CI STEP (docs/3D-LOG.md, 2026-10-03, says why); the last line says how long the run took.
   Run it by hand before and after any lane that adds geometry, and put the figures in
   docs/3D-LOG.md with their date. */
const path = require('path');
const fs = require('fs');
const os = require('os');

const W = 390, H = 844, DSF = 3;
console.log('A STAND-IN, NOT A PHONE: headless Chromium at ' + W + '×' + H + ', device scale factor ' + DSF +
  ', the page\'s processor slowed on purpose and no phone\'s GPU under its WebGL — compare these figures with each other, never with a phone\'s frame rate.');

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d; };
const IDX = arg('--index', 'index.html');
const FRAMES = parseInt(arg('--frames', '120'), 10);
const RATE = parseFloat(arg('--rate', '4'));
const SEASON = arg('--season', 'off');
const ONLY = args.includes('--worlds') ? String(arg('--worlds', '')).split(',').map(s => s.trim()).filter(Boolean) : null;
const WARM = 5;   /* frames drawn and not counted after the first, so a lazily made texture is not one world's p95 */

const fails = [];
let at = '';   /* the world being drawn, at module level so even the last catch can name it */
const firstLine = e => String(e && e.message || e).split('\n')[0];
const die = msg => { console.log('FAIL\n- ' + msg); process.exit(1); };
if (!(FRAMES >= 120)) die('asked for ' + arg('--frames') + ' frames — fewer than 120 is a glance, not a frame time');
if (!(RATE > 1)) die('asked to slow the processor by ×' + arg('--rate') + ' — that is not a slow-down, so there would be nothing standing in for a phone');

let chromium;
try { ({ chromium } = require('playwright-core')); } catch (e) { die('playwright-core is not installed, so no browser can be opened and nothing was measured'); }
const CANDIDATES = [
  process.env.CHROMIUM_PATH,
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
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

const med = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; };
const p95 = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.ceil(0.95 * s.length) - 1] : NaN; };
const ms = v => (Number.isFinite(v) ? v.toFixed(1) : '—');
const num = v => (Number.isFinite(v) ? Math.round(v).toLocaleString('en-US') : '—');
const pad = (s, n, left) => { s = String(s); return left ? s.padEnd(n) : s.padStart(n); };

(async () => {
  const t00 = Date.now();
  const exe = findChromium();
  if (!exe) die('no Chromium found — set CHROMIUM_PATH, or install one of: ' + CANDIDATES.join(', '));
  const file = path.resolve(__dirname, '..', IDX);
  if (!fs.existsSync(file)) die('there is no shell at ' + IDX + ', so there is nothing to open');
  const browser = await chromium.launch({ executablePath: exe });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DSF, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  await page.route('**', r => r.request().url().startsWith('file://') ? r.continue() : r.abort());
  await page.goto('file://' + file);
  await page.waitForTimeout(1500);

  /* ---- is there a 3D camera here at all? Asked before anything is clicked, and absent is a red ---- */
  const has = await page.evaluate(() => ({
    wants: (typeof CAMS !== 'undefined' && Array.isArray(CAMS) ? CAMS : ['3d']).indexOf('3d') >= 0,
    engine: typeof T3 !== 'undefined' && typeof draw3d === 'function' && typeof t3Build === 'function' && !!window.THREE,
    gamev: typeof GAMEV === 'string' ? GAMEV : '?',
  }));
  if (!has.wants) { await browser.close(); die('this shell lists no 3D camera — there is no 3D scene here to cost, and a cost of nothing is not a pass'); }
  if (!has.engine) { await browser.close(); die('this shell lists a 3D camera and the 3D engine never loaded — no world can be drawn, so nothing was measured'); }

  /* ---- into the game the way a player gets there: a role, then Begin ---- */
  const role = await page.$('.classes button');
  if (role) await role.click();
  const begin = await page.$('#begin');
  if (begin) await begin.click();
  await page.waitForTimeout(600);

  const setup = await page.evaluate(([season]) => {
    const out = { P: [] };
    if (document.getElementById('world').hidden) { out.P.push('the game never opened its world after Begin, so the 3D canvas has no size and nothing it draws is what a player sees'); return out; }
    /* the whole city raised, every lot and every stage — the most a player's phone will ever be asked to draw */
    if (typeof GROWTH !== 'undefined' && GROWTH && GROWTH.staged && Array.isArray(GROWTH.staged.quests)) GROWTH.staged.quests.forEach(q => done.add(q));
    chSeen = 99; applyGrowth();
    /* the season is PINNED, never read off the calendar: the same command on two dates must measure the same city */
    const S = typeof SEASONS !== 'undefined' && SEASONS ? SEASONS : {};
    if (season !== 'off' && season !== 'auto' && !S[season]) { out.P.push('this shell has no season called "' + season + '" — it has ' + (Object.keys(S).join(', ') || 'none') + ', or off, or auto'); return out; }
    if (typeof seasonSet === 'function') seasonSet(season);
    out.season = (typeof seasonNow === 'function' ? seasonNow() : null) || 'none (year-round)';
    camSet('3d'); sizeCanvas();
    const ok = draw3d();
    if (!ok || T3.fail || !T3.renderer) { out.P.push('the 3D camera could not draw at all here' + (T3.errors && T3.errors.length ? ' — ' + T3.errors[T3.errors.length - 1].where + ': ' + T3.errors[T3.errors.length - 1].msg : '') + ', so there is no scene to cost'); return out; }
    window.__sceneCostSeen = new WeakSet([T3.group]);   /* this first scene too: a world handed back as THIS one was not built */
    /* a lost 3D context, as the browser reports it. The event arrives after the frame loop yields, so it is
       read after each world; the flag stays set even if the context is later restored. */
    window.__sceneCostLost = null; window.__sceneCostAt = { id: 'before any world', frame: 0 };
    T3.renderer.domElement.addEventListener('webglcontextlost', () => { window.__sceneCostLost = window.__sceneCostLost || Object.assign({}, window.__sceneCostAt); });
    const gl = T3.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    out.gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    out.gl2 = !!T3.renderer.capabilities.isWebGL2;
    out.aa = !!(gl.getContextAttributes() || {}).antialias;   /* read off the context the game made, not typed here */
    const c3 = T3.renderer.domElement, r = c3.getBoundingClientRect();
    out.css = [Math.round(r.width), Math.round(r.height)]; out.buf = [c3.width, c3.height];
    out.dpr = window.devicePixelRatio; out.ratio = T3.renderer.getPixelRatio();
    out.worlds = Object.keys(WORLDS);
    return out;
  }, [SEASON]);
  if (setup.P.length) { await browser.close(); die(setup.P.join('\n- ')); }
  if (setup.dpr !== DSF) fails.push('the page sees a device pixel ratio of ' + setup.dpr + ', not ' + DSF + ' — these figures are not at a phone\'s density');
  if (!(setup.buf[0] > 0 && setup.buf[1] > 0)) fails.push('the 3D canvas is ' + setup.buf.join('×') + ' pixels — there is nothing on screen for a frame to cost');

  const worlds = ONLY ? setup.worlds.filter(w => ONLY.includes(w)) : setup.worlds;
  if (ONLY) ONLY.filter(w => !setup.worlds.includes(w)).forEach(w => fails.push('asked to measure "' + w + '" and this shell has no world by that name'));
  if (!worlds.length) { await browser.close(); fails.push('no world was measured — a cost report with nothing in it is not a pass'); die(fails.join('\n- ')); }

  console.log('when: ' + new Date().toISOString().slice(0, 10) + ' · shell: ' + IDX + ' (' + has.gamev + ') · season: ' + setup.season + ' · the whole city raised');
  /* a busy machine slows the software drawing and nothing else in this report says so — the load is part of the figure */
  const load = () => os.loadavg()[0].toFixed(1);
  console.log('machine: ' + os.cpus().length + ' cores, load average ' + load() + ' at the start (a figure taken on a busy machine is slower for that reason alone)');
  const soft = /swiftshader|llvmpipe|software|softpipe/i.test(String(setup.gpu));
  console.log('WebGL' + (setup.gl2 ? '2' : '1') + ' renderer: ' + setup.gpu + (soft ? ' — drawn in SOFTWARE on this machine\'s processor, which the slow-down does not reach' : ' — this machine\'s own GPU, not a phone\'s'));
  console.log('3D canvas: ' + setup.css.join('×') + ' CSS px → ' + setup.buf.join('×') + ' px buffer (pixel ratio ' + setup.ratio + ') · antialias ' + (setup.aa ? 'on' : 'off') + ' · ' + FRAMES + ' frames a world, after ' + WARM + ' not counted');

  /* ---- one world, measured: placed, built fresh, drawn once, then FRAMES times ---- */
  const measure = id => page.evaluate(([id, N, WARM]) => {
    const r = { id, P: [] };
    const w = WORLDS[id];
    /* where the hero stands: the walkable tile nearest the world's middle, so the camera sees what a person in the room sees */
    const walk = (x, y) => !SOLID.has(w.grid[y][x]) && w.grid[y][x] !== 'N';
    let best = null, bd = Infinity;
    for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) if (walk(x, y)) { const d = (x + 0.5 - w.W / 2) ** 2 + (y + 0.5 - w.H / 2) ** 2; if (d < bd) { bd = d; best = [x, y]; } }
    if (!best) { r.P.push(id + ' has no tile a person can stand on, so no camera could be put in it'); return r; }
    r.spot = best;
    world = id; px = fx = best[0]; py = fy = best[1]; moving = false; T3.yaw = 0; T3.turn = null;
    const gl = T3.renderer.getContext(), pix = new Uint8Array(4);
    /* waits for the frame to be drawn, not just asked for. Seeded with alpha 0 first: this canvas has no alpha
       channel, so a real read returns 255, and a read on a lost context leaves the seed where it was */
    const finish = () => { pix[3] = 0; gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pix); return pix[3] !== 0 && !gl.isContextLost() && !window.__sceneCostLost; };
    const lost = n => id + ': the 3D context was lost at frame ' + n + ' — the frames after it drew nothing, so their times are not a cost';
    if (window.__sceneCostLost || gl.isContextLost()) { r.P.push(id + ': the 3D context was already lost before its first frame' + (window.__sceneCostLost ? ' (lost at frame ' + window.__sceneCostLost.frame + ' of ' + window.__sceneCostLost.id + ')' : '') + ' — nothing after it drew, so there is no cost to read'); r.lost = true; return r; }
    const info = T3.renderer.info;
    /* the build, timed where draw3d itself calls it: a world that is not built here was served from the cache */
    const realBuild = window.t3Build; let built = NaN, builds = 0;
    window.t3Build = function () { const t0 = performance.now(); try { return realBuild.apply(this, arguments); } finally { built = performance.now() - t0; builds++; } };
    try {
      t3Invalidate();
      info.reset(); const f0 = info.render.frame;
      window.__sceneCostAt = { id, frame: 1 };
      const t0 = performance.now(); const ok = draw3d(); const live = finish(); const t1 = performance.now();
      if (!live) { r.P.push(lost(1)); r.lost = true; return r; }
      if (!ok || T3.fail) { r.P.push(id + ' did not draw in 3D' + (T3.errors && T3.errors.length ? ' — ' + T3.errors[T3.errors.length - 1].where + ': ' + T3.errors[T3.errors.length - 1].msg : '')); return r; }
      if (builds !== 1) { r.P.push(id + ' was ' + (builds ? 'built ' + builds + ' times' : 'never built — it came out of the cache') + ' on its first frame, so its build time is not a build time'); return r; }
      /* and built NEW: t3Build hands back a kept scene when it has one, which is the same call taking no time. Asked by identity */
      const seen = window.__sceneCostSeen;
      if (seen.has(T3.group)) { r.P.push(id + ' came back as the very scene drawn before — it was served from the cache, so its build time is not a build time'); return r; }
      seen.add(T3.group);
      r.build = built; r.first = t1 - t0 - built;
      if (info.render.frame === f0) { r.P.push(id + ': draw3d said it drew and the renderer never ran — there is no frame to count'); return r; }
      r.calls = info.render.calls; r.tris = info.render.triangles;
      /* the whole world, from this spot: every triangle whose object and parents are visible, culled or not —
         the cutaway hides walls by where the hero stands, and a hidden wall is not counted */
      let all = 0;
      const shown = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
      T3.scene.traverse(o => { if (!(o.isMesh || o.isSprite) || !o.geometry || !shown(o)) return;
        const g = o.geometry, n = g.index ? g.index.count : (g.attributes.position ? g.attributes.position.count : 0); all += n / 3; });
      r.all = all;
      const frame = [], script = [];
      for (let i = 0; i < WARM + N; i++) {
        info.reset();
        window.__sceneCostAt = { id, frame: i + 2 };
        const a = performance.now(); const ok2 = draw3d(); const b = performance.now(); const live2 = finish(); const c = performance.now();
        if (!live2) { r.P.push(lost(i + 2)); r.lost = true; return r; }
        if (!ok2 || T3.fail) { r.P.push(id + ' stopped drawing at frame ' + (i + 2)); return r; }
        /* read after the timed span, so it costs nothing per frame: the pixel read proves the context lives, and
           only this count proves the renderer sent THIS frame — a skipped draw leaves the last frame in the buffer */
        if (!(info.render.calls > 0)) { r.P.push(id + ': the renderer sent nothing at frame ' + (i + 2) + ' — draw3d said it drew and no draw call went out, so its time is not a cost'); return r; }
        /* and the SAME frame: each row prints frame 1's calls and triangles beside these frames' times, so a frame that
           sent less (a redraw of only what moved, say) would print figures from two different frames. Yaz, #317's
           second recheck: in 30 of 30 world-passes every timed frame sent exactly frame 1's counts, so this costs no
           false red today, and a lane that really draws less must print its timed frames' own counts. */
        if (info.render.calls !== r.calls || info.render.triangles !== r.tris) { r.P.push(id + ': frame ' + (i + 2) + ' sent ' + info.render.calls + ' draw calls and ' + info.render.triangles + ' triangles where the first frame sent ' + r.calls + ' and ' + r.tris + ' — the row would print one frame\'s counts beside another frame\'s times'); return r; }
        if (i >= WARM) { frame.push(c - a); script.push(b - a); }
      }
      r.frame = frame; r.script = script;
      if (builds !== 1) r.P.push(id + ' was rebuilt ' + (builds - 1) + ' time(s) while its frames were being timed, so the frame times include a build');
      return r;
    } finally { window.t3Build = realBuild; }
  }, [id, FRAMES, WARM]);

  /* the same fixed piece of script, timed in each pass: the measured slow-down, not the asked-for one */
  const calibrate = () => page.evaluate(() => { const t0 = performance.now(); let s = 0; for (let i = 0; i < 4e6; i++) s += Math.sqrt(i) % 7; return [performance.now() - t0, s]; }).then(v => v[0]);

  /* each world's row is printed the moment it is measured, so a run that dies part-way still leaves what it got */
  const head = pad('world', 10, true) + pad('calls', 6) + pad('triangles', 11) + pad('whole world', 13) + pad('build ms', 10) + pad('1st frame', 11) + pad('frame median', 14) + pad('p95', 8) + pad('script median', 15);
  const report = (r, pass) => {
    fails.push(...r.P.map(p => p + ' (' + pass + ')'));
    if (!Array.isArray(r.frame)) { console.log(pad(r.id, 10, true) + '  RED — ' + (r.P[0] || 'no figures came back')); return; }
    if (!(r.tris > 0) || !(r.calls > 0)) fails.push(r.id + ' drew ' + num(r.calls) + ' draw calls and ' + num(r.tris) + ' triangles from the middle of the room (' + pass + ') — a 3D frame with nothing in it is a world nobody can see, not a cheap one');
    if (!(r.all > 0)) fails.push(r.id + ' has no triangles anywhere in its scene (' + pass + ') — it was built empty');
    if (r.frame.length !== FRAMES || !r.frame.every(Number.isFinite)) fails.push(r.id + ': ' + r.frame.length + ' frames were timed where ' + FRAMES + ' were asked (' + pass + ')');
    console.log(pad(r.id, 10, true) + pad(num(r.calls), 6) + pad(num(r.tris), 11) + pad(num(r.all), 13) + pad(ms(r.build), 10) + pad(ms(r.first), 11) +
      pad(ms(med(r.frame)), 14) + pad(ms(p95(r.frame)), 8) + pad(ms(med(r.script)), 15));
  };
  /* a page that dies, closes, or loses its browser part-way: each names the world it was drawing */
  let diedAt = '', pageCrashed = false, measuring = true;
  const died = () => { if (measuring && !diedAt) diedAt = at || 'before any world'; };
  page.on('crash', () => { pageCrashed = true; died(); });
  page.on('close', died);
  browser.on('disconnected', died);
  const cdp = await ctx.newCDPSession(page);
  /* the measured slow-down: the same fixed piece of script, unslowed and then slowed, back to back, so the
     ratio is the throttle and not whatever the machine's neighbours did in between */
  const speed = async rate => {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    if (rate === 1) return 1;
    const cal0 = (await calibrate() + await calibrate()) / 2;
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    return ((await calibrate() + await calibrate()) / 2) / cal0;
  };
  let lostAt = '';
  try {
    for (const [name, rate] of [['at this machine\'s speed', 1], ['processor slowed ×' + RATE, RATE]]) {
      if (lostAt) break;
      at = 'the speed check (' + name + ')';
      const slow = await speed(rate);
      if (rate > 1 && !(slow >= RATE * 0.5)) fails.push('the processor was asked to slow ×' + RATE + ' and the same piece of script took ×' + slow.toFixed(2) + ' its unslowed time — the slowed figures would be the unslowed ones under another name');
      console.log('');
      console.log('— ' + name + (rate > 1 ? ' (measured ×' + slow.toFixed(1) + ' on a fixed piece of script, taken just before; ' + (soft ? 'the software drawing is not slowed, so read the script column' : 'the GPU is not slowed') + ')' : '') + ' —');
      console.log(head);
      const rows = [];
      for (const id of worlds) {
        at = id + ' (' + name + ')';
        const r = await measure(id);
        /* the browser's own word that the context was lost reaches the page only after the frame loop yields */
        const late = await page.evaluate(() => window.__sceneCostLost);
        if (late && !r.lost) { r.P.push(late.id + ': the 3D context was lost at frame ' + late.frame + ' (the browser said so once its frames were done) — the frames after it drew nothing, so their times are not a cost'); delete r.frame; }
        rows.push(r); report(r, name);
        if (r.lost || late) { lostAt = at; break; }
      }
      const ok = rows.filter(r => Array.isArray(r.frame) && r.frame.length);
      if (ok.length) {
        const worst = ok.reduce((a, b) => (p95(b.frame) > p95(a.frame) ? b : a));
        const heavy = ok.reduce((a, b) => (b.tris > a.tris ? b : a));
        console.log('  slowest frame: ' + worst.id + ' (p95 ' + ms(p95(worst.frame)) + ' ms) · most triangles in view: ' + heavy.id + ' (' + num(heavy.tris) + ') · all builds together ' + ms(ok.reduce((s, r) => s + r.build, 0)) + ' ms');
      }
    }
    if (lostAt) fails.push('measuring stopped at ' + lostAt + ': a lost 3D context draws nothing in any world after it, so the worlds after it were not measured');
    at = 'the end of the run';
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  } catch (e) {
    /* the listeners can arrive after the rejection, and a page's close before its browser's disconnect: let them settle, then say which */
    await new Promise(r => setTimeout(r, 500));
    if (!diedAt && (page.isClosed() || !browser.isConnected())) diedAt = at;
    if (!diedAt) throw e;
    const how = !browser.isConnected() ? 'the browser went away' : pageCrashed ? 'the page crashed' : 'the page closed';
    fails.push(how + ' while drawing ' + diedAt + ' — on a phone that is the tab reloading in the middle of play; the worlds after it were never measured (' + firstLine(e) + ')');
  }
  measuring = false;
  await browser.close().catch(() => {});
  if (pageErrors.length) fails.push('the page threw while it was being measured: ' + [...new Set(pageErrors)].slice(0, 3).join(' | '));
  const took = Math.round((Date.now() - t00) / 1000);
  console.log('');
  console.log('  NOTE: load average ' + load() + ' at the end · hero on the walkable tile nearest each world\'s middle, camera at its first stop; "whole world" counts every triangle whose object and parents are visible from that spot, culled or not; "script" is draw3d alone, before the wait for pixels.');
  console.log('  took ' + Math.floor(took / 60) + ' min ' + (took % 60) + ' s');
  if (fails.length) { console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('OK — ' + worlds.length + ' worlds measured at two speeds');
})().catch(e => { console.log('FAIL\n- the measurement itself broke' + (at ? ' while drawing ' + at : '') + ', so nothing it printed can be trusted: ' + firstLine(e)); process.exit(1); });
