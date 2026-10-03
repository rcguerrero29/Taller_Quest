#!/usr/bin/env node
/* THE SHAPE GATE — every part the games draw still builds the same, byte for byte (#316, lane L0).
   Plain node, no browser. Specified by Beto (the engine keeper) on 2026-10-02 and built to that spec:

     1. The shape builder is loaded twice — from the working tree, and from the engine as it stands on the
        base (origin/main unless you name another) — through test/lib/parts.js, against vendor/three.min.js.
     2. Every literal part is collected from engine/shapes.js and from every pack's art.js. A part whose
        size is computed escapes; a computed place or colour is left at the builder's default.
     3. Each part is built by t3MeshOf([part]) on both — as written, and turned to face each door — and
        the position, normal and colour bytes, how tall it stands and how far it reaches, and its glass,
        must be identical. Then all of them at once, as one mesh. Then t3BakeParts — the builder's name a
        test can call — against the same bytes.
     4. A COLLISION PASS, which the per-part builds cannot do: each built part has its own fresh cache,
        so a field missing from the cache key is invisible to them. Here every part is built one after
        another in ONE builder, and for every key the builder reads, a twin differing only in that key is
        built right after it in the same builder and compared with the twin built fresh. A key the
        cache forgot hands the twin the first one's shape, and this says so.
     5. It prints how many parts it collected and fails below a floor, because a harvest of zero passes
        every comparison there is.

   Run:  node test/prims.js                      compare the working tree with origin/main
         node test/prims.js <base-ref>           … with another commit (CI passes the pull request's base)
         node test/prims.js --old-file <path>    … with an engine3d.js on disk (a copy, a mockup's engine)
         node test/prims.js --selftest           plant each way the builder can break and watch it go red

   WHEN IT IS RED ON PURPOSE: a change that MEANS to change how some shape is built (a new segment count,
   say) will turn this red for exactly those shapes, and the sentence names them. That is the gate
   working: say in the pull request which shapes changed and why, and the reviewer reads the list. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const P = require('./lib/parts.js');
const ROOT = P.ROOT;

/* THE FLOOR. Measured 2026-10-03 at mq-v229: 436 distinct parts — 80 written in engine/shapes.js,
   373 in Meridian's art, 23 in El Horno's (gauge declares no shapes), some written more than once — and
   138 that escape because their size is computed. Set about a tenth under, so deleting a little art is not a red and a harvest that
   lost its way is. Lower it on purpose, in a commit that says what art went. */
const FLOOR = { distinct: 390, files: { 'engine/shapes.js': 70, 'content/meridian/art.js': 340, 'content/horno/art.js': 20 } };
const NAME = { box: ['box', 'boxes'], cyl: ['cylinder', 'cylinders'], sph: ['sphere', 'spheres'], cone: ['cone', 'cones'], torus: ['torus', 'tori'] };
const kind = p => p.s || 'box';
const said = n => n === 1 ? 'one' : String(n);
const where = h => h.file + ':' + h.line + ' ' + (h.text.length > 110 ? h.text.slice(0, 107) + '...' : h.text);

/* what differs between two built meshes, in words */
function differs(a, b) {
  const d = [];
  if (a.main.count !== b.main.count) d.push('number of corners (' + b.main.count + ' vertices where there were ' + a.main.count + ')');
  else {
    if (!a.main.position.equals(b.main.position)) d.push('vertex positions');
    if (!a.main.normal.equals(b.main.normal)) d.push('normals (how light falls on them)');
    if (!a.main.color.equals(b.main.color)) d.push('colours');
  }
  if (!Object.is(a.top, b.top)) d.push('height (t3Top, what anything set on them stands on)');
  if (JSON.stringify(a.span) !== JSON.stringify(b.span)) d.push('reach (t3Span, how far they stand over their neighbours)');
  const ga = a.glass, gb = b.glass;
  if (ga.length !== gb.length || ga.some((g, i) => !g.position.equals(gb[i].position) || !g.normal.equals(gb[i].normal)
      || !g.color.equals(gb[i].color) || g.opacity !== gb[i].opacity || g.a !== gb[i].a)) d.push('glass');
  return d;
}
const build = (B, list) => P.partsOf(B.t3MeshOf(list, { mesh: true }));

/* a twin differing only in key k */
function twin(p, k) {
  const q = { ...p };
  if (k === 's') q.s = P.SHAPES[(P.SHAPES.indexOf(kind(p)) + 1) % P.SHAPES.length];
  else if (k === 'c') q.c = p.c === '#123456' ? '#654321' : '#123456';
  else q[k] = typeof p[k] === 'number' ? +(p[k] * 1.25 + 0.05).toFixed(6) : 0.37;
  return q;
}

/* ---- the gate itself: inputs in, sentences out. --selftest calls this with planted inputs ---- */
function gate({ engineNew, engineOld, oldLabel, sources }) {
  const fails = [], info = [];
  let NEW, OLD;
  try { NEW = P.loadBuilder(engineNew, 'engine/engine3d.js'); } catch (e) { fails.push(e.message); return { fails, info }; }
  if (NEW.how !== 'sentinels') fails.push('engine/engine3d.js has no boundary around the shape builder (the ' + P.BEGIN + ' and ' + P.END +
    ' comments), so tests and mockups would have to cut it out by line again — and the first comment somebody writes between two of those lines would cut it short without a word.');
  let probe;
  try { probe = NEW.fresh(); } catch (e) { fails.push(e.message); return { fails, info }; }
  if (!probe.t3BakeParts) fails.push('the shape builder in engine/engine3d.js has no t3BakeParts, so a test cannot ask it for the bytes of a list of parts without standing a whole mesh up in a scene.');
  try { OLD = P.loadBuilder(engineOld, oldLabel); OLD.fresh(); } catch (e) { fails.push(e.message + ' (the builder to compare against)'); return { fails, info }; }

  info.push('the builder found in the working tree by ' + (NEW.how === 'sentinels' ? 'its boundary comments' : 'the old marker lines') + ', and on ' + oldLabel + ' by ' + (OLD.how === 'sentinels' ? 'its boundary comments' : 'the old marker lines (const meshGeo={} to function t3Build)'));

  /* the keys the builder actually reads: a key added tomorrow (arc0, seg) is harvested and twinned without anybody editing this file */
  const reads = [...new Set([...NEW.code.matchAll(/\bp\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]))];
  const keys = [...new Set([...P.PART_KEYS, ...reads])];

  /* ---- the harvest ---- */
  const seen = new Map(), perFile = {}; let escaped = 0;
  for (const { file, text } of sources) {
    const h = P.harvest(text, file, keys);
    perFile[file] = h.parts.length; escaped += h.escaped.length;
    h.parts.forEach(x => { const id = JSON.stringify(x.part); if (!seen.has(id)) seen.set(id, x); });
  }
  const parts = [...seen.values()];
  const byKind = {}; parts.forEach(x => { byKind[kind(x.part)] = (byKind[kind(x.part)] || 0) + 1; });
  info.push('harvested ' + parts.length + ' distinct parts (' + Object.keys(NAME).map(k => (byKind[k] || 0) + ' ' + NAME[k][1]).join(', ') + ') from ' +
    sources.length + ' files [' + sources.map(s => s.file + ' ' + (perFile[s.file] || 0)).join(', ') + ']; ' + escaped + ' more are written with a computed size and escape a literal harvest');
  if (!parts.length) { fails.push('the gate found no parts at all to build in ' + sources.map(s => s.file).join(', ') + ' — a harvest of zero would pass every comparison, so it is a red.'); return { fails, info }; }
  if (parts.length < FLOOR.distinct) fails.push('the gate collected only ' + parts.length + ' distinct parts and the floor is ' + FLOOR.distinct + ': either art was deleted (lower FLOOR in test/prims.js and say what went) or the harvest stopped reading the files, and every shape it lost is a shape nobody checks.');
  Object.entries(FLOOR.files).forEach(([f, n]) => {
    if (!sources.some(s => s.file === f)) fails.push(f + ' was not read at all, and the floor expects ' + n + ' parts from it.');
    else if ((perFile[f] || 0) < n) fails.push(f + ' gave the gate ' + (perFile[f] || 0) + ' parts and its floor is ' + n + ', so shapes written there are no longer being checked.');
  });
  Object.keys(NAME).forEach(k => { if (!byKind[k]) fails.push('the harvest holds no ' + NAME[k][0] + ', so a change to how a ' + NAME[k][0] + ' is built would pass unseen.'); });

  /* ---- old against new, one part at a time, each with a fresh cache ----
     Each part as it is written, and turned to face each of the other three doors the way the shape
     library's `turned` turns a whole thing (engine/shapes.js, grep `const turned`): the turn is added to
     its own `ry` and its place swung round. No literal part carries two turns at once, so without the
     doors a change to the order turns are applied in (YXZ) would pass, and every leaning limb a tile
     turns to face its door would come out different in the game. */
  const t0 = Date.now(), fresh = new Map(), bad = {};
  let compared = 0, oldThrew = 0;
  const DOORS = [[0, ''], [Math.PI / 2, ', turned a quarter to face a door'], [-Math.PI / 2, ', turned a quarter the other way to face a door'], [Math.PI, ', turned round to face a door']];
  const turn = (p, ry) => { if (!ry) return p; const cr = Math.cos(ry), sr = Math.sin(ry), x = p.x || 0, z = p.z || 0;
    return { ...p, x: x * cr + z * sr, z: -x * sr + z * cr, ry: (p.ry || 0) + ry }; };
  const builtOn = (label, B, list) => { try { return build(B, list); } catch (e) { return { error: String(e.message || e).slice(0, 140), label }; } };
  for (const x of parts) {
    for (const [ry, how] of DOORS) {
      const q = turn(x.part, ry);
      const a = builtOn(oldLabel, OLD.fresh(), [q]), b = builtOn('the working tree', NEW.fresh(), [q]);
      if (!ry) fresh.set(x, b);
      if (b.error) { fails.push('the working tree\'s builder throws on ' + where(x) + how + ': ' + b.error); break; }
      if (a.error) { oldThrew++; break; }   /* the old engine could not build it; nothing to be identical to */
      if (!ry) compared++;
      const d = differs(a, b);
      if (d.length) { const k = kind(x.part) + '|' + d.join(', '); (bad[k] = bad[k] || []).push({ x, how }); break; }
    }
  }
  if (compared < Math.min(FLOOR.distinct, parts.length)) fails.push('only ' + compared + ' of the ' + parts.length + ' parts could be built on ' + oldLabel +
    ' as well (it threw on ' + oldThrew + '), so only ' + compared + ' were compared and the floor is ' + FLOOR.distinct + ' — a comparison that never ran is not a pass.');
  Object.entries(bad).forEach(([k, xs]) => {
    const [s, what] = k.split('|'), total = byKind[s] || xs.length;
    fails.push(said(xs.length) + ' of the ' + total + ' ' + NAME[s][total === 1 ? 0 : 1] + ' the games draw would look different from ' + oldLabel +
      ': their ' + what + ' changed. The first is ' + where(xs[0].x) + xs[0].how + '.');
  });
  /* all at once: the solid parts and the glass in one mesh, which is how a tile is built */
  {
    const list = parts.map(x => x.part);
    const a = builtOn(oldLabel, OLD.fresh(), list), b = builtOn('the working tree', NEW.fresh(), list);
    if (b.error) fails.push('the working tree\'s builder throws when every part is built together as one mesh: ' + b.error);
    else if (!a.error) { const d = differs(a, b); if (d.length) fails.push('built all together as one mesh, the way a tile is built, the parts no longer come out as they do on ' + oldLabel + ': the ' + d.join(', ') + ' changed.'); }
  }
  /* the name a test can call gives the bytes the engine draws */
  if (probe.t3BakeParts) {
    const off = [];
    for (const x of parts) {
      if (x.part.a < 1) continue;
      const b = fresh.get(x); if (!b || b.error) continue;
      let r; try { r = NEW.fresh().t3BakeParts([x.part]); } catch (e) { off.push(x); continue; }
      const f = a => Buffer.from(new Float32Array(a).buffer);
      if (!r || !f(r.pos).equals(b.main.position) || !f(r.nor).equals(b.main.normal) || !f(r.col).equals(b.main.color) || !Object.is(r.top, b.top)
          || JSON.stringify(Array.from(r.span || [])) !== JSON.stringify(b.span)) off.push(x);
    }
    if (off.length) fails.push('t3BakeParts — the name tests call — gives different bytes from the mesh the engine draws for ' + said(off.length) + ' parts, so a test reading it would be checking something players never see. The first is ' + where(off[0]) + '.');
  }

  /* ---- the collision pass: one builder, one cache, the whole harvest and every part's twins ---- */
  const shared = NEW.fresh(), crossed = [], forgot = {};
  let twins = 0;
  for (const x of parts) {
    const b = fresh.get(x); if (!b || b.error) continue;
    const s = builtOn('the working tree', shared, [x.part]);
    if (s.error || differs(s, b).length) crossed.push(x);
    for (const k of keys) {
      const q = twin(x.part, k);
      const one = builtOn('the working tree', shared, [q]), two = builtOn('the working tree', NEW.fresh(), [q]);
      if (one.error || two.error) continue;
      twins++;
      if (differs(one, two).length && !forgot[k]) forgot[k] = { x, from: x.part[k], to: q[k] };
    }
  }
  if (twins < parts.length) fails.push('the collision pass built only ' + twins + ' twins for ' + parts.length + ' parts, so a field missing from the shape cache\'s key could pass unseen.');
  if (crossed.length) fails.push('built one after another in one session, ' + said(crossed.length) + ' of the games\' parts came back with another part\'s shape — the shape cache files two different parts under one name. The first is ' + where(crossed[0]) + '.');
  Object.entries(forgot).forEach(([k, { x, from, to }]) => fails.push('two parts that differ only in ' + k + ' came out the same once both were built in one session: the shape cache does not tell them apart, so whichever is built first is what both look like. Seen with ' +
    where(x) + ', ' + k + ' ' + (from === undefined ? 'unset' : from) + ' and ' + to + '.'));
  info.push('built every part on ' + oldLabel + ' and on the working tree facing all four doors, all of them together, and ' + keys.length + ' twins each in one shared cache, in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  return { fails, info };
}

/* ---- inputs ---- */
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const readSources = () => P.shapeSources(ROOT).map(file => ({ file, text: fs.existsSync(path.join(ROOT, file)) ? read(file) : '' }));

function report(r, okLine) {
  r.info.forEach(l => console.log('  ' + l));
  if (r.fails.length) { console.log('FAIL — the shape gate:'); r.fails.forEach(f => console.log('- ' + f)); return 1; }
  console.log(okLine); return 0;
}

function main(argv) {
  let oldLabel, engineOld;
  const at = argv.indexOf('--old-file');
  if (at >= 0) {
    const f = argv[at + 1];
    if (!f || !fs.existsSync(f)) { console.log('FAIL — the shape gate was asked to compare against ' + (f || 'a file it was not given') + ' and there is no such file.'); return 1; }
    engineOld = fs.readFileSync(f, 'utf8'); oldLabel = path.basename(f) + ' (from --old-file)';
  } else {
    const base = argv.find(a => !a.startsWith('--')) || 'origin/main';
    oldLabel = base;
    try { engineOld = execFileSync('git', ['show', base + ':engine/engine3d.js'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) {
      console.log('FAIL — the shape gate could not read engine/engine3d.js as it stands on ' + base + ' (git said: ' + String(e.stderr || e.message).trim().split('\n')[0] +
        '), so it has nothing to compare the builder against. Fetch it (git fetch origin main) or name another base.');
      return 1;
    }
  }
  const r = gate({ engineNew: read('engine/engine3d.js'), engineOld, oldLabel, sources: readSources() });
  return report(r, 'OK — every part the games draw builds byte for byte as it does on ' + oldLabel + ', and the shape cache tells every twin apart.');
}

/* ---- the self-test: each way the builder can break, planted in memory, never on disk ---- */
function selftest() {
  const engine = read('engine/engine3d.js'), sources = readSources(), out = [];
  const plant = (src, from, to) => { if (!src.includes(from)) throw new Error('the text this plant changes (' + from + ') is no longer in engine/engine3d.js, so the case tests nothing — update the plant'); return src.split(from).join(to); };
  const cases = [
    ['nothing planted', null, null, null],
    ['a sphere with nine segments round instead of eight', e => plant(e, 'SphereGeometry(p.r||0.1,8,6)', 'SphereGeometry(p.r||0.1,9,6)'), null, /spheres the games draw would look different/],
    ['a cache key that forgot rb (a cone-shaped pot and a straight one share a shape)', e => plant(e, 'p.rt,p.rb,', 'p.rt,'), null, /differ only in rb came out the same/],
    ['parts turned in another order, XYZ', e => plant(e, '"YXZ"', '"XYZ"'), null, /would look different/],
    ['the default grey one shade lighter', e => plant(e, '"#888888"', '"#898989"'), null, /colours changed/],
    ['the mesh drawn with a tint t3BakeParts is not given', e => plant(e, 't3BakeParts(list,tc)', 't3BakeParts(list,h=>h==="#888888"?"#898989":tc(h))'), null, /t3BakeParts — the name tests call — gives different bytes/],
    ['how tall a thing stands, off by a hair', e => plant(e, 'm.t3Top=top===-Infinity?0:top', 'm.t3Top=top===-Infinity?0:top+1e-6'), null, /their height \(t3Top/],
    ['glass drawn a little more solid', e => plant(e, 'opacity:+a,', 'opacity:+a+0.01,'), null, /glass changed/],
    ['an old engine whose builder throws on every part', 'OLD', null, /a comparison that never ran is not a pass/],
    ['the boundary comments taken out', e => plant(plant(e, P.BEGIN, 'shape builder start'), P.END, 'shape builder stop'), null, /no boundary around the shape builder/],
    ['a builder that reaches outside its boundary', e => plant(e, 'const meshGeo={};', 'const meshGeo={};const someWorld=CW();'), null, /failed as it loaded/],
    ['t3BakeParts gone under another name', e => e.split('t3BakeParts').join('t3Bake2'), null, /has no t3BakeParts/],
    ['nothing to harvest', null, s => s.map(x => ({ ...x, text: '' })), /found no parts at all/],
    ['the shape library not read', null, s => s.filter(x => x.file !== 'engine/shapes.js'), /engine\/shapes\.js was not read at all/],
    ['every torus gone from the art', null, s => s.map(x => ({ ...x, text: x.text.split('s:"torus"').join('s:"tor"') })), /holds no torus/],
  ];
  let bad = 0;
  for (const [name, plantEngine, plantSources, want] of cases) {
    let r;
    try {
      const oldBroken = plantEngine === 'OLD' ? plant(engine, 'let g;\n', 'let g;throw new Error("planted");\n') : engine;
      r = gate({ engineNew: plantEngine && plantEngine !== 'OLD' ? plantEngine(engine) : engine, engineOld: oldBroken, oldLabel: plantEngine === 'OLD' ? 'a broken old engine' : 'the unplanted engine', sources: plantSources ? plantSources(sources) : sources }); }
    catch (e) { out.push('FAIL — ' + name + ': ' + e.message); bad++; continue; }
    if (!want) {
      if (r.fails.length) { out.push('FAIL — with nothing planted the gate is red, so every red below proves nothing: ' + r.fails[0]); bad++; }
      else out.push('ok  green with nothing planted — ' + (r.info.find(l => l.startsWith('harvested')) || r.info[0]));
      continue;
    }
    const hit = r.fails.find(f => want.test(f));
    if (!hit) { out.push('FAIL — planted ' + name + ' and the gate ' + (r.fails.length ? 'went red for another reason: ' + r.fails[0] : 'stayed green') + '.'); bad++; }
    else out.push('ok  red — ' + name + ': ' + (hit.length > 200 ? hit.slice(0, 197) + '...' : hit));
  }
  /* Beto's point, held: a dropped key field is invisible to fresh per-part builds and seen only by the collision pass */
  {
    const r = gate({ engineNew: plant(engine, 'p.rt,p.rb,', 'p.rt,'), engineOld: engine, oldLabel: 'the unplanted engine', sources });
    if (r.fails.some(f => /would look different|as one mesh/.test(f))) { out.push('FAIL — a forgotten cache field showed up in the fresh per-part builds, so the selftest no longer proves the collision pass is what catches it.'); bad++; }
    else out.push('ok  the forgotten rb is invisible to fresh per-part builds and caught only by the collision pass');
  }
  out.forEach(l => console.log(l));
  console.log(bad ? 'FAIL — ' + bad + ' of the gate\'s own cases did not come out as they should.' : 'OK — the shape gate went red for every plant, with its sentence, and green with none.');
  return bad ? 1 : 0;
}

if (require.main === module) process.exit(process.argv.includes('--selftest') ? selftest() : main(process.argv.slice(2)));
module.exports = { gate, FLOOR };
