#!/usr/bin/env node
/* WHAT THE 3D SCENE COSTS — measured headless, as a STAND-IN for a phone and never as a phone (#317).

   Nobody had measured how hard the 3D view works while the shapes grew about tenfold in triangles
   (docs/3D-LOG.md: "Not measured today: frame time on a phone"). This opens a shell in headless
   Chromium at a phone's screen (390×844 CSS pixels, device scale factor 3, touch), raises the whole
   city, and for every world the 3D camera can show prints:
     - draw calls and triangles in one frame, read off the renderer (`renderer.info`) — what the
       camera actually sent to the GPU from the spot the hero stands on;
     - triangles in the whole world, counted off the scene — the same number from any spot;
     - how long the world's meshes take to build (`t3Build`, timed where draw3d calls it), and the
       first frame after it, which is when the new geometry is uploaded;
     - frame time over at least 120 frames (median and 95th percentile), each frame being draw3d and
       a one-pixel read that waits until the frame is really finished.
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
   that did not reach the renderer, fewer frames than asked, a slow-down that did not take, a page
   that crashed, or no world measured at all — each one exits 1 with the sentence a person would say.
   Every one was planted in a copy outside the repository and went red (docs/3D-LOG.md, 2026-10-03).

   Run:  node test/scenecost.js                                   (Meridian, every world, both speeds)
         node test/scenecost.js --index <shell> --worlds st,pk --frames 240 --season muertos --rate 6
   --season is `off` (year-round) by default, so two runs on different dates measure the same city.
   NOT A CI STEP: it takes minutes, not seconds (the last line says how long). Run it by hand before
   and after any lane that adds geometry, and put the figures in docs/3D-LOG.md with their date. */
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
    const finish = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pix); /* waits for the frame to be drawn, not just asked for */
    const info = T3.renderer.info;
    /* the build, timed where draw3d itself calls it: a world that is not built here was served from the cache */
    const realBuild = window.t3Build; let built = NaN, builds = 0;
    window.t3Build = function () { const t0 = performance.now(); try { return realBuild.apply(this, arguments); } finally { built = performance.now() - t0; builds++; } };
    try {
      t3Invalidate();
      info.reset(); const f0 = info.render.frame;
      const t0 = performance.now(); const ok = draw3d(); finish(); const t1 = performance.now();
      if (!ok || T3.fail) { r.P.push(id + ' did not draw in 3D' + (T3.errors && T3.errors.length ? ' — ' + T3.errors[T3.errors.length - 1].where + ': ' + T3.errors[T3.errors.length - 1].msg : '')); return r; }
      if (builds !== 1) { r.P.push(id + ' was ' + (builds ? 'built ' + builds + ' times' : 'never built — it came out of the cache') + ' on its first frame, so its build time is not a build time'); return r; }
      /* and built NEW: t3Build hands back a kept scene when it has one, which is the same call taking no time. Asked by identity */
      const seen = window.__sceneCostSeen;
      if (seen.has(T3.group)) { r.P.push(id + ' came back as the very scene drawn before — it was served from the cache, so its build time is not a build time'); return r; }
      seen.add(T3.group);
      r.build = built; r.first = t1 - t0 - built;
      if (info.render.frame === f0) { r.P.push(id + ': draw3d said it drew and the renderer never ran — there is no frame to count'); return r; }
      r.calls = info.render.calls; r.tris = info.render.triangles;
      /* the whole world, from any spot: every visible triangle in the scene, culled or not */
      let all = 0;
      const shown = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
      T3.scene.traverse(o => { if (!(o.isMesh || o.isSprite) || !o.geometry || !shown(o)) return;
        const g = o.geometry, n = g.index ? g.index.count : (g.attributes.position ? g.attributes.position.count : 0); all += n / 3; });
      r.all = all;
      const frame = [], script = [];
      for (let i = 0; i < WARM + N; i++) {
        info.reset();
        const a = performance.now(); const ok2 = draw3d(); const b = performance.now(); finish(); const c = performance.now();
        if (!ok2 || T3.fail) { r.P.push(id + ' stopped drawing at frame ' + (i + 1)); return r; }
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
  /* a page that dies under the load is the finding, not an accident of the harness: on a phone it is the tab reloading */
  let crashed = '', at = '';
  page.on('crash', () => { crashed = crashed || at || 'before any world'; });
  const cdp = await ctx.newCDPSession(page);
  let cal0 = NaN;
  try {
    for (const [name, rate] of [['at this machine\'s speed', 1], ['processor slowed ×' + RATE, RATE]]) {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate });
      const cal = (await calibrate() + await calibrate()) / 2;
      if (rate === 1) cal0 = cal;
      const slow = cal / cal0;
      if (rate > 1 && !(slow >= RATE * 0.5)) fails.push('the processor was asked to slow ×' + RATE + ' and the same piece of script took ×' + slow.toFixed(2) + ' its unslowed time — the slowed figures would be the unslowed ones under another name');
      console.log('');
      console.log('— ' + name + (rate > 1 ? ' (measured ×' + slow.toFixed(1) + ' on a fixed piece of script; ' + (soft ? 'the software drawing is not slowed, so read the script column' : 'the GPU is not slowed') + ')' : '') + ' —');
      console.log(head);
      const rows = [];
      for (const id of worlds) { at = id + ' (' + name + ')'; const r = await measure(id); rows.push(r); report(r, name); }
      const ok = rows.filter(r => Array.isArray(r.frame) && r.frame.length);
      if (ok.length) {
        const worst = ok.reduce((a, b) => (p95(b.frame) > p95(a.frame) ? b : a));
        const heavy = ok.reduce((a, b) => (b.tris > a.tris ? b : a));
        console.log('  slowest frame: ' + worst.id + ' (p95 ' + ms(p95(worst.frame)) + ' ms) · most triangles in view: ' + heavy.id + ' (' + num(heavy.tris) + ') · all builds together ' + ms(ok.reduce((s, r) => s + r.build, 0)) + ' ms');
      }
    }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  } catch (e) {
    if (!crashed) throw e;
    fails.push('the page crashed while drawing ' + crashed + ' — on a phone that is the tab reloading in the middle of play; the worlds after it were never measured');
  }
  await browser.close().catch(() => {});
  if (pageErrors.length) fails.push('the page threw while it was being measured: ' + [...new Set(pageErrors)].slice(0, 3).join(' | '));
  const took = Math.round((Date.now() - t00) / 1000);
  console.log('');
  console.log('  NOTE: load average ' + load() + ' at the end · hero on the walkable tile nearest each world\'s middle, camera at its first stop; "whole world" counts every visible triangle in the scene, culled or not; "script" is draw3d alone, before the wait for pixels.');
  if (fails.length) { console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('OK — ' + worlds.length + ' worlds measured at two speeds in ' + Math.floor(took / 60) + ' min ' + (took % 60) + ' s' +
    (took > 60 ? ', which is why this is not a CI step' : ', short enough to be a CI step'));
})().catch(e => { console.log('FAIL\n- the measurement itself broke, so nothing it printed can be trusted: ' + (e && e.message || e)); process.exit(1); });
