#!/usr/bin/env node
/* THE SHAPE GATE — every literal part the games write builds the same through the shape builder, byte for
   byte, and is drawn with the same material (#316, lane L0). Plain node, no browser. Specified by Beto (the
   engine keeper) on 2026-10-02 and built to that spec:

     1. The shape builder is loaded twice — from the working tree, and from the engine as it stands on the
        base (origin/main unless you name another) — through test/lib/parts.js, each against ITS OWN
        three.js (the base's vendor/three.min.js for the base), so a library upgrade is compared with the
        library it replaces and not with itself. Both are handed the same colour theme, one that is not the
        identity (parts.js, THEME_TC), so a mesh that drops the theme is seen.
     2. Every literal part is collected from engine/shapes.js and from every pack's art.js. A part whose
        size is computed escapes; a computed place or colour is left at the builder's default.
     3. Each part is built by t3MeshOf([part], tag) on both — as written, and turned to face each door —
        and the position, normal and colour bytes, how tall it stands and how far it reaches, the
        material it is drawn with (type, vertex colours, see-through, opacity, depth, and whether
        T3.tintables holds it, which is how the time of day reaches it), its tag, and the same for its
        glass, must be identical. Then all of them at once, as one mesh. Then t3BakeParts — the
        builder's name a test can call — against the same bytes.
     4. A COLLISION PASS, which the per-part builds cannot do: each built part has its own fresh cache,
        so a field missing from the cache key is invisible to them. Here every part is built one after
        another in ONE builder, and for every key the builder reads, a twin differing only in that key is
        built right after it in the same builder and compared with the twin built fresh. A key the
        cache forgot hands the twin the first one's shape, and this says so.
     5. It prints how many parts it collected and fails below a floor, because a harvest of zero passes
        every comparison there is. The primitives it expects are read out of the builder (kindsOf), and
        it fails when the harvest holds none of one, so a primitive learnt tomorrow is not skipped.
     6. It reads .github/workflows/ci.yml and fails when CI no longer runs this file's self-test and its
        comparison, because a gate nobody runs protects nothing.

   WHAT IT DOES NOT READ, so nobody takes its OK for more: the shape library's own code in
   engine/shapes.js (facing, the seeds, the runs: which parts a tile gets and where) is read only as
   text for its literal parts, and its `turned` only to check that the gate turns a part the way it does
   (a change there is a red that asks for the gate's copy to follow, not a comparison with the base);
   the 138 parts written with a computed size; everything in engine3d.js outside the builder's sentinels
   (lights, camera, t3Build, how a tile is placed); and the browser. Those are the smoke suites' job.

   Run:  node test/prims.js                      compare the working tree with origin/main
         node test/prims.js <base-ref>           … with another commit (CI passes the pull request's base)
         node test/prims.js --old-file <path>    … with an engine3d.js on disk (a copy, a mockup's engine)
         node test/prims.js --selftest           plant each way the builder can break and watch it go red

   WHEN IT IS RED ON PURPOSE: a change that MEANS to change how some shape is built (a new segment count,
   say, or a three.js upgrade) will turn this red for exactly those shapes, and the sentence names them.
   That is the gate working: say in the pull request which shapes changed and why, and the reviewer reads
   the list. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const P = require('./lib/parts.js');
const ROOT = P.ROOT;

/* THE FLOOR. Measured 2026-10-03 at mq-v229: 436 distinct parts — 80 written in engine/shapes.js,
   373 in Meridian's art, 23 in El Horno's (gauge declares no shapes), some written more than once — and
   138 that escape because their size is computed. Set about a tenth under, so deleting a little art is not a red and a harvest that
   lost its way is. Lower it on purpose, in a commit that says what art went. */
const FLOOR = { distinct: 390, files: { 'engine/shapes.js': 70, 'content/meridian/art.js': 340, 'content/horno/art.js': 20 } };
const NAME = { box: ['box', 'boxes'], cyl: ['cylinder', 'cylinders'], sph: ['sphere', 'spheres'], cone: ['cone', 'cones'], torus: ['torus', 'tori'] };
const nameOf = k => NAME[k] || [k, k + 's'];   /* a primitive learnt after this file was written still gets a sentence */
const kind = p => p.s || 'box';
const said = n => n === 1 ? 'one' : String(n);
const where = h => h.file + ':' + h.line + ' ' + (h.text.length > 110 ? h.text.slice(0, 107) + '...' : h.text);

/* what differs between two built meshes, in words. A missing attribute is said as missing ("the mesh has
   no normals"); anything else that differs is said as "their X changed" by the caller. */
const same = (x, y) => x === y || (!!x && !!y && x.equals(y));
const ATTRS = [['position', 'vertex positions', 'vertex positions'], ['normal', 'normals (how light falls on them)', 'normals (how light falls on it)'], ['color', 'colours', 'vertex colours']];
const LACKS = /^the (mesh|glass) has no /;
function matDiff(a, b) {
  if (!a || !b) return a === b ? '' : (b ? 'a material where there was none' : 'no material at all');
  return Object.keys({ ...a, ...b }).filter(k => !Object.is(a[k], b[k])).map(k => k + ' ' + a[k] + ' → ' + b[k]).join(', ');
}
function geoDiff(a, b, who, d) {
  const lack = ATTRS.filter(([k]) => a[k] && !b[k]);
  lack.forEach(([, , l]) => d.push('the ' + who + ' has no ' + l));
  if (a.count !== b.count) { d.push((who === 'glass' ? 'glass (its ' : '') + 'number of corners (' + b.count + ' vertices where there were ' + a.count + ')' + (who === 'glass' ? ')' : '')); return; }
  ATTRS.forEach(([k, n]) => { if (!lack.some(l => l[0] === k) && !same(a[k], b[k])) d.push(who === 'glass' ? 'glass (its ' + n + ')' : n); });
}
function differs(a, b) {
  const d = [];
  geoDiff(a.main, b.main, 'mesh', d);
  if (!Object.is(a.top, b.top)) d.push('height (t3Top, what anything set on them stands on)');
  if (JSON.stringify(a.span) !== JSON.stringify(b.span)) d.push('reach (t3Span, how far they stand over their neighbours)');
  const m = matDiff(a.material, b.material); if (m) d.push('material (' + m + ')');
  if (a.tag !== b.tag) d.push('tag (userData ' + a.tag + ' → ' + b.tag + ')');
  const ga = a.glass, gb = b.glass;
  if (ga.length !== gb.length) d.push('glass (' + gb.length + ' panes where there were ' + ga.length + ')');
  else ga.forEach((g, i) => {
    const h = gb[i], gd = [];
    geoDiff(g, h, 'glass', gd);
    const gm = matDiff(g.material, h.material); if (gm) gd.push('glass material (' + gm + ')');
    if (g.tag !== h.tag) gd.push('glass tag (userData ' + g.tag + ' → ' + h.tag + ')');
    gd.forEach(x => { if (!d.includes(x)) d.push(x); });
  });
  return d;
}
/* a list of differences as one clause: "the mesh has no normals …; their colours, material (…) changed" */
const phrase = (d, their) => {
  const lacks = d.filter(x => LACKS.test(x)), rest = d.filter(x => !LACKS.test(x));
  return [...lacks, ...(rest.length ? [their + rest.join(', ') + ' changed'] : [])].join('; ');
};
/* the tag a tile hands t3MeshOf: not empty, so a builder that drops it is seen */
const TAG = { mesh: true, gate: 'the shape gate' };
const build = (B, list) => P.partsOf(B.t3MeshOf(list, TAG), B.T3);

/* a twin differing only in key k */
function twin(p, k, kinds) {
  const q = { ...p };
  if (k === 's') q.s = kinds[(kinds.indexOf(kind(p)) + 1) % kinds.length];
  else if (k === 'c') q.c = p.c === '#123456' ? '#654321' : '#123456';
  else q[k] = typeof p[k] === 'number' ? +(p[k] * 1.25 + 0.05).toFixed(6) : 0.37;
  return q;
}

/* ---- the gate itself: inputs in, sentences out. --selftest calls this with planted inputs ---- */
/* engine/shapes.js's own `turned`, cut out of its text and run: the doors below are turned by the gate's
   copy (`turn`), and this says when the library's turn and the gate's no longer agree */
function libraryTurned(text) {
  const at = text.indexOf('const turned='), arrow = at < 0 ? -1 : text.indexOf('=>', at);
  if (at < 0 || text.indexOf('const turned=', at + 1) >= 0) return { error: 'engine/shapes.js has ' + (at < 0 ? 'no' : 'more than one') + ' `const turned=`, so the gate cannot check that it turns a part to face a door the way the library does' };
  const open = text.indexOf('{', arrow), span = P.objectSpans(text).find(([a]) => a === open);
  if (!span) return { error: 'engine/shapes.js\'s `turned` has no body the gate can find' };
  try { return { fn: vm.runInNewContext('(' + text.slice(text.indexOf('(', at), span[1] + 1) + ')', {}, { filename: 'engine/shapes.js (turned)' }) }; }
  catch (e) { return { error: 'engine/shapes.js\'s `turned`, cut out and run, throws: ' + String(e.message || e).slice(0, 120) }; }
}

function gate({ engineNew, engineOld, oldLabel, sources, threeNew, threeOld, threeOldLabel }) {
  const fails = [], info = [];
  let NEW, OLD;
  try { NEW = P.loadBuilder(engineNew, 'engine/engine3d.js', threeNew, 'vendor/three.min.js'); } catch (e) { fails.push(e.message); return { fails, info }; }
  if (NEW.how !== 'sentinels') fails.push('engine/engine3d.js has no boundary around the shape builder (the ' + P.BEGIN + ' and ' + P.END +
    ' comments), so tests and mockups would have to cut it out by line again — and the first comment somebody writes between two of those lines would cut it short without a word.');
  let probe;
  try { probe = NEW.fresh(); } catch (e) { fails.push(e.message); return { fails, info }; }
  if (!probe.t3BakeParts) fails.push('the shape builder in engine/engine3d.js has no t3BakeParts, so a test cannot ask it for the bytes of a list of parts without standing a whole mesh up in a scene.');
  try { OLD = P.loadBuilder(engineOld, oldLabel, threeOld, threeOldLabel || oldLabel + ':vendor/three.min.js'); OLD.fresh(); } catch (e) { fails.push(e.message + ' (the builder to compare against)'); return { fails, info }; }

  info.push('the builder found in the working tree by ' + (NEW.how === 'sentinels' ? 'its boundary comments' : 'the old marker lines') + ', and on ' + oldLabel + ' by ' + (OLD.how === 'sentinels' ? 'its boundary comments' : 'the old marker lines (const meshGeo={} to function t3Build)'));
  const tOld = threeOld || P.threeText(), tNew = threeNew || P.threeText();
  info.push('three.js: ' + (threeOldLabel || oldLabel + ':vendor/three.min.js') + ' for ' + oldLabel + ', the working tree\'s for the working tree' + (tOld === tNew ? ' (the same file)' : ' (they differ, so a library change shows here)'));

  /* the keys the builder actually reads: a key added tomorrow (arc0, seg) is harvested and twinned without anybody editing this file */
  const reads = [...new Set([...NEW.code.matchAll(/\bp\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]))];
  const keys = [...new Set([...P.PART_KEYS, ...reads])];
  /* and the primitives it knows, read the same way: a primitive added tomorrow is harvested and must be drawn */
  const kinds = P.kindsOf(NEW.code);

  /* ---- the harvest ---- */
  const seen = new Map(), perFile = {}; let escaped = 0;
  for (const { file, text } of sources) {
    const h = P.harvest(text, file, keys, kinds);
    perFile[file] = h.parts.length; escaped += h.escaped.length;
    h.parts.forEach(x => { const id = JSON.stringify(x.part); if (!seen.has(id)) seen.set(id, x); });
  }
  const parts = [...seen.values()];
  const byKind = {}; parts.forEach(x => { byKind[kind(x.part)] = (byKind[kind(x.part)] || 0) + 1; });
  info.push('harvested ' + parts.length + ' distinct parts (' + kinds.map(k => (byKind[k] || 0) + ' ' + nameOf(k)[1]).join(', ') + ') from ' +
    sources.length + ' files [' + sources.map(s => s.file + ' ' + (perFile[s.file] || 0)).join(', ') + ']; ' + escaped + ' more are written with a computed size and escape a literal harvest');
  if (!parts.length) { fails.push('the gate found no parts at all to build in ' + sources.map(s => s.file).join(', ') + ' — a harvest of zero would pass every comparison, so it is a red.'); return { fails, info }; }
  if (parts.length < FLOOR.distinct) fails.push('the gate collected only ' + parts.length + ' distinct parts and the floor is ' + FLOOR.distinct + ': either art was deleted (lower FLOOR in test/prims.js and say what went) or the harvest stopped reading the files, and every shape it lost is a shape nobody checks.');
  Object.entries(FLOOR.files).forEach(([f, n]) => {
    if (!sources.some(s => s.file === f)) fails.push(f + ' was not read at all, and the floor expects ' + n + ' parts from it.');
    else if ((perFile[f] || 0) < n) fails.push(f + ' gave the gate ' + (perFile[f] || 0) + ' parts and its floor is ' + n + ', so shapes written there are no longer being checked.');
  });
  kinds.forEach(k => { if (!byKind[k]) fails.push('the harvest holds no ' + nameOf(k)[0] + ', a primitive the builder knows' + (k === 'box' ? '' : ' (it tests s==="' + k + '")') + ', so a change to how a ' + nameOf(k)[0] + ' is built would pass unseen.'); });

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
  /* the gate's copy against the library's own: if they disagree, the door turns below are not the game's */
  {
    const lib = sources.find(s => s.file === 'engine/shapes.js');
    const L = lib ? libraryTurned(lib.text) : { error: 'engine/shapes.js was not given to the gate' };
    if (L.error) fails.push(L.error + '.');
    else {
      const probe = [{ x: 0.3, y: 0.2, z: -0.45, ry: 0.2 }, { x: -0.12, y: 0, z: 0.31, rz: 0.1 }];
      const off = [...DOORS.slice(1).map(d => d[0]), 0.37].find(ry => {
        let got; try { got = L.fn(probe, ry); } catch (e) { return true; }
        return probe.some((p, i) => { const w = turn(p, ry), g = got && got[i]; return !g || ['x', 'z', 'ry'].some(k => g[k] !== w[k]); });
      });
      if (off !== undefined) fails.push('engine/shapes.js\'s `turned` no longer turns a part the way this gate turns it (seen at a turn of ' + off.toFixed(3) +
        '), so the door turns checked here are not the ones the game makes. If the library\'s turn changed on purpose, change the gate\'s copy (test/prims.js, grep `const turn =`) to match, and say in the pull request which shapes now face another way.');
    }
  }
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
      if (d.length) { const k = kind(x.part) + '|' + d.join('\u0001'); (bad[k] = bad[k] || []).push({ x, how }); break; }
    }
  }
  if (compared < Math.min(FLOOR.distinct, parts.length)) fails.push('only ' + compared + ' of the ' + parts.length + ' parts could be built on ' + oldLabel +
    ' as well (it threw on ' + oldThrew + '), so only ' + compared + ' were compared and the floor is ' + FLOOR.distinct + ' — a comparison that never ran is not a pass.');
  Object.entries(bad).forEach(([k, xs]) => {
    const s = k.slice(0, k.indexOf('|')), what = k.slice(k.indexOf('|') + 1).split('\u0001'), total = byKind[s] || xs.length;
    fails.push((total === 1 ? 'the one ' + nameOf(s)[0] : said(xs.length) + ' of the ' + total + ' ' + nameOf(s)[1]) + ' the games draw would look different from ' + oldLabel +
      ': ' + phrase(what, 'their ') + '. The first is ' + where(xs[0].x) + xs[0].how + '.');
  });
  /* all at once: the solid parts and the glass in one mesh, which is how a tile is built */
  {
    const list = parts.map(x => x.part);
    const a = builtOn(oldLabel, OLD.fresh(), list), b = builtOn('the working tree', NEW.fresh(), list);
    if (b.error) fails.push('the working tree\'s builder throws when every part is built together as one mesh: ' + b.error);
    else if (!a.error) { const d = differs(a, b); if (d.length) fails.push('built all together as one mesh, the way a tile is built, the parts no longer come out as they do on ' + oldLabel + ': ' + phrase(d, 'the ') + '.'); }
  }
  /* the name a test can call gives the bytes the engine draws */
  if (probe.t3BakeParts) {
    const off = [];
    for (const x of parts) {
      if (x.part.a < 1) continue;
      const b = fresh.get(x); if (!b || b.error) continue;
      const B = NEW.fresh();
      let r; try { r = B.t3BakeParts([x.part], B.tc); } catch (e) { off.push(x); continue; }
      const f = a => Buffer.from(new Float32Array(a).buffer);
      if (!r || !same(f(r.pos), b.main.position) || !same(f(r.nor), b.main.normal) || !same(f(r.col), b.main.color) || !Object.is(r.top, b.top)
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
      const q = twin(x.part, k, kinds);
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
const CI = '.github/workflows/ci.yml';

/* ---- does CI still run this gate? (Melo, #316) ----
   Nothing else reads ci.yml for it: a deleted line there would stop the gate's red cases, or its
   comparison, from running anywhere, and every check would stay green. So the smoke job must hold a step,
   with no `if:` and no `continue-on-error`, that runs both `node test/prims.js --selftest` and
   `node test/prims.js "origin/$BASE_REF"`. Both the self-test and the comparison read it, so deleting
   either line is a red from the other. (Deleting the whole step is caught by neither: that is a person's
   reading of ci.yml, as test/protect.js says of the other suites.) */
const SELF_LINE = 'node test/prims.js --selftest', COMPARE_LINE = 'node test/prims.js "origin/$BASE_REF"';
function ciRuns(yml) {
  if (typeof yml !== 'string' || !yml.trim()) return [CI + ' could not be read, so nobody can say CI runs the shape gate.'];
  const lines = yml.split('\n');
  const job = lines.findIndex(l => /^\s{2}smoke:\s*$/.test(l));
  if (job < 0) return [CI + ' has no job named smoke, so the shape gate runs in no check a pull request must pass.'];
  let end = lines.findIndex((l, i) => i > job && /^\s{2}[A-Za-z_][\w-]*:\s*$/.test(l)); if (end < 0) end = lines.length;
  const first = lines.findIndex((l, i) => i > job && i < end && /^\s*- /.test(l));
  if (first < 0) return [CI + '\'s smoke job has no steps, so the shape gate runs nowhere.'];
  const ind = /^(\s*)/.exec(lines[first])[1].length, steps = [];
  for (let i = first; i < end; i++) {
    const l = lines[i], lead = /^(\s*)/.exec(l)[1].length;
    if (lead === ind && /^\s*- /.test(l)) steps.push([]);
    if (steps.length) steps[steps.length - 1].push(l);
  }
  /* the commands a step runs: each line, out of `run:` and split at &&, comments left out */
  const cmds = s => s.flatMap(l => l.replace(/^\s*-?\s*run:\s*\|?\s*/, '').split('&&').map(c => c.trim())).filter(c => c && !c.startsWith('#'));
  const keyed = (s, k) => s.some(l => new RegExp('^\\s{' + ind + '}(?:- |  )' + k + ':').test(l));
  const fails = [];
  const want = (line, what) => {
    const at = steps.find(s => cmds(s).includes(line));
    if (!at) fails.push(CI + ' no longer runs `' + line + '` in the smoke job, so ' + what + ' — and the next change that blinds the gate lands green and stays green.');
    else if (keyed(at, 'if') || keyed(at, 'continue-on-error')) fails.push(CI + ' runs `' + line + '` only in a step with an `if:` or `continue-on-error`, so it can be skipped or ignored and ' + what + '.');
    return at;
  };
  const a = want(SELF_LINE, 'the shape gate\'s own red cases run nowhere');
  const b = want(COMPARE_LINE, 'no pull request is compared with its base');
  if (a && b && a !== b) fails.push(CI + ' runs the shape gate\'s self-test and its comparison in two different steps; keep them in one, so neither is moved or dropped without the other being seen.');
  return fails;
}

function report(r, okLine) {
  r.info.forEach(l => console.log('  ' + l));
  if (r.fails.length) { console.log('FAIL — the shape gate:'); r.fails.forEach(f => console.log('- ' + f)); return 1; }
  console.log(okLine); return 0;
}

function main(argv) {
  let oldLabel, engineOld, threeOld, threeOldLabel;
  const git = args => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'pipe'] });
  const gitSaid = e => String(e.stderr || e.message).trim().split('\n')[0];
  const at = argv.indexOf('--old-file');
  if (at >= 0) {
    const f = argv[at + 1];
    if (!f || !fs.existsSync(f)) { console.log('FAIL — the shape gate was asked to compare against ' + (f || 'a file it was not given') + ' and there is no such file.'); return 1; }
    engineOld = fs.readFileSync(f, 'utf8'); oldLabel = path.basename(f) + ' (from --old-file)';
    /* the three.js that engine was drawn with: beside it, or in the vendor/ of the tree it sits in */
    const dir = path.dirname(path.resolve(f)), near = [path.join(dir, 'three.min.js'), path.join(dir, '..', 'vendor', 'three.min.js')].find(p => fs.existsSync(p));
    if (near) { threeOld = fs.readFileSync(near, 'utf8'); threeOldLabel = 'the three.min.js ' + (path.dirname(near) === dir ? 'beside ' : 'in the vendor/ next to ') + path.basename(f); }
    else threeOldLabel = 'the working tree\'s three.js, held there because none was found beside ' + path.basename(f) + ' (so a library change is not compared)';
  } else {
    const base = argv.find(a => !a.startsWith('--')) || 'origin/main';
    oldLabel = base;
    try { engineOld = git(['show', base + ':engine/engine3d.js']); }
    catch (e) {
      console.log('FAIL — the shape gate could not read engine/engine3d.js as it stands on ' + base + ' (git said: ' + gitSaid(e) +
        '), so it has nothing to compare the builder against. Fetch it (git fetch origin main) or name another base.');
      return 1;
    }
    try { threeOld = git(['show', base + ':vendor/three.min.js']); threeOldLabel = base + ':vendor/three.min.js'; }
    catch (e) {
      console.log('FAIL — the shape gate could not read vendor/three.min.js as it stands on ' + base + ' (git said: ' + gitSaid(e) +
        '), so it cannot build the base\'s shapes the way the base drew them.');
      return 1;
    }
  }
  const r = gate({ engineNew: read('engine/engine3d.js'), engineOld, oldLabel, sources: readSources(), threeOld, threeOldLabel });
  let yml; try { yml = read(CI); } catch (e) { yml = null; }
  r.fails.push(...ciRuns(yml));
  /* the sentence says only what was read: the literal parts, through the builder (the head of this file says what is not) */
  return report(r, 'OK — every literal part written in engine/shapes.js and the packs\' art, built through the shape builder in engine/engine3d.js, comes out byte for byte and drawn with the same materials as on ' +
    oldLabel + ', and the shape cache tells every twin apart.');
}

/* ---- the self-test: each way the builder can break, planted in memory, never on disk ---- */
function selftest() {
  const engine = read('engine/engine3d.js'), sources = readSources(), three = P.threeText(), out = [];
  const plant = (src, from, to, what) => { if (!src.includes(from)) throw new Error('the text this plant changes (' + from + ') is no longer in ' + (what || 'engine/engine3d.js') + ', so the case tests nothing — update the plant'); return src.split(from).join(to); };
  const plantFile = (s, file, from, to) => { if (!s.some(x => x.file === file)) throw new Error(file + ' is not among the sources, so the plant tests nothing'); return s.map(x => x.file === file ? { ...x, text: plant(x.text, from, to, file) } : x); };
  /* a sixth primitive, learnt by the builder (Beto's plant): with `seg` cap segments */
  const capsule = seg => e => plant(e, 'if(s==="sph")', 'if(s==="capsule")g=new THREE.CapsuleGeometry(p.r||0.1,p.h||0.2,' + seg + ',8);\n  else if(s==="sph")');
  const drawsCapsule = s => s.map(x => x.file === 'content/meridian/art.js' ? { ...x, text: x.text + '\n/* planted */ const PLANTED_CAPSULE=[{s:"capsule",r:0.12,h:0.3,c:"#B0895B"}];\n' } : x);
  const GLASS = '{vertexColors:true,transparent:true,opacity:+a,depthWrite:false}';
  const cases = [
    { name: 'nothing planted' },
    { name: 'a sphere with nine segments round instead of eight', neu: e => plant(e, 'SphereGeometry(p.r||0.1,8,6)', 'SphereGeometry(p.r||0.1,9,6)'), want: /spheres the games draw would look different/ },
    { name: 'a cache key that forgot rb (a cone-shaped pot and a straight one share a shape)', neu: e => plant(e, 'p.rt,p.rb,', 'p.rt,'), want: /differ only in rb came out the same/ },
    { name: 'parts turned in another order, XYZ', neu: e => plant(e, '"YXZ"', '"XYZ"'), want: /would look different/ },
    { name: 'the default grey one shade lighter', neu: e => plant(e, '"#888888"', '"#898989"'), want: /colours changed/ },
    { name: 'the mesh drawn with a tint t3BakeParts is not given', neu: e => plant(e, 't3BakeParts(list,tc)', 't3BakeParts(list,h=>h==="#888888"?"#898989":tc(h))'), want: /t3BakeParts — the name tests call — gives different bytes/ },
    { name: 'the mesh drops the theme (t3BakeParts(list,tc) → t3BakeParts(list)) and the bake\'s default is the identity', neu: e => plant(plant(e, 't3BakeParts(list,tc)', 't3BakeParts(list)'), 'tint=tint||tc;', 'tint=tint||(h=>h);'), want: /their colours changed/ },
    { name: 'the mesh forgets to pass tc (t3BakeParts(list,tc) → t3BakeParts(list)) and the bake\'s default keeps the theme — GREEN, which is why the default is tc', neu: e => plant(e, 't3BakeParts(list,tc)', 't3BakeParts(list)') },
    { name: 'how tall a thing stands, off by a hair', neu: e => plant(e, 'm.t3Top=top===-Infinity?0:top', 'm.t3Top=top===-Infinity?0:top+1e-6'), want: /their height \(t3Top/ },
    { name: 'glass drawn a little more solid', neu: e => plant(e, 'opacity:+a,', 'opacity:+a+0.01,'), want: /glass material \(opacity/ },
    { name: 'every mesh drawn without its vertex colours (white)', neu: e => plant(e, 'MeshLambertMaterial({vertexColors:true})', 'MeshLambertMaterial({vertexColors:false})'), want: /material \(vertexColors true → false\)/ },
    { name: 'the solid material never handed to T3.tintables (the time of day never reaches it)', neu: e => plant(e, 'T3.tintables.push(mat);', ''), want: /material \(tinted true → false\)/ },
    { name: 'the tag never reaching userData', neu: e => plant(e, 'm.userData=tag;', 'm.userData={};'), want: /tag \(userData \{"mesh":true/ },
    { name: 'glass that writes depth', neu: e => plant(e, GLASS, '{vertexColors:true,transparent:true,opacity:+a,depthWrite:true}'), want: /glass material \(depthWrite false → true\)/ },
    { name: 'glass drawn solid (transparent taken out)', neu: e => plant(e, GLASS, '{vertexColors:true,opacity:+a,depthWrite:false}'), want: /glass material \(transparent true → false\)/ },
    { name: 'a mesh baked without its normals', neu: e => plant(e, 'geo.setAttribute("normal",new THREE.Float32BufferAttribute(b.nor,3));', ''), want: /the mesh has no normals \(how light falls on it\)/, never: /builder throws/ },
    { name: 'three.js upgraded by the book (legacyMode off, as r152 made the default) on the working tree only', three: t => plant(t, 'Vt={legacyMode:!0,', 'Vt={legacyMode:!1,', 'vendor/three.min.js'), want: /their colours changed/ },
    { name: 'a capsule the builder learns and no art draws', neu: capsule(4), want: /the harvest holds no capsule/ },
    { name: 'a capsule the builder learns and the art draws, which the base draws as a box', neu: capsule(4), src: drawsCapsule, want: /capsules? the games draw would look different/ },
    { name: 'the capsule\'s cap segments 4 → 6', neu: capsule(6), old: capsule(4), oldLabel: 'an engine with a four-segment capsule', src: drawsCapsule, want: /capsules? the games draw would look different/ },
    { name: 'an old engine whose builder throws on every part', old: e => plant(e, 'let g;\n', 'let g;throw new Error("planted");\n'), oldLabel: 'a broken old engine', want: /a comparison that never ran is not a pass/ },
    { name: 'the boundary comments taken out', neu: e => plant(plant(e, P.BEGIN, 'shape builder start'), P.END, 'shape builder stop'), want: /no boundary around the shape builder/ },
    { name: 'a builder that reaches outside its boundary', neu: e => plant(e, 'const meshGeo={};', 'const meshGeo={};const someWorld=CW();'), want: /failed as it loaded/ },
    { name: 't3BakeParts gone under another name', neu: e => e.split('t3BakeParts').join('t3Bake2'), want: /has no t3BakeParts/ },
    { name: 'the shape library\'s turn mirrored (engine/shapes.js `turned`, one sign)', src: s => plantFile(s, 'engine/shapes.js', 'x:p.x*cr+p.z*sr,z:-p.x*sr+p.z*cr', 'x:p.x*cr-p.z*sr,z:p.x*sr+p.z*cr'), want: /`turned` no longer turns a part the way this gate turns it/ },
    { name: 'nothing to harvest', src: s => s.map(x => ({ ...x, text: '' })), want: /found no parts at all/ },
    { name: 'the shape library not read', src: s => s.filter(x => x.file !== 'engine/shapes.js'), want: /engine\/shapes\.js was not read at all/ },
    { name: 'every torus gone from the art', src: s => s.map(x => ({ ...x, text: x.text.split('s:"torus"').join('s:"tor"') })), want: /holds no torus/ },
  ];
  let bad = 0;
  for (const c of cases) {
    let r;
    try {
      r = gate({ engineNew: c.neu ? c.neu(engine) : engine, engineOld: c.old ? c.old(engine) : engine, oldLabel: c.oldLabel || 'the unplanted engine',
        sources: c.src ? c.src(sources) : sources, threeNew: c.three ? c.three(three) : three, threeOld: three, threeOldLabel: 'the unplanted three.js' }); }
    catch (e) { out.push('FAIL — ' + c.name + ': ' + e.message); bad++; continue; }
    if (!c.want) {
      if (r.fails.length) { out.push('FAIL — ' + c.name + ': the gate should be green here and is red, ' + (c.neu ? 'so the case below it proves nothing: ' : 'so every red below proves nothing: ') + r.fails[0]); bad++; }
      else out.push('ok  green — ' + c.name + (c.neu ? '' : ' — ' + (r.info.find(l => l.startsWith('harvested')) || r.info[0])));
      continue;
    }
    const hit = r.fails.find(f => c.want.test(f)), wrong = c.never && r.fails.find(f => c.never.test(f));
    if (!hit) { out.push('FAIL — planted ' + c.name + ' and the gate ' + (r.fails.length ? 'went red for another reason: ' + r.fails[0] : 'stayed green') + '.'); bad++; }
    else if (wrong) { out.push('FAIL — planted ' + c.name + ' and the gate went red, but it also blames the wrong thing: ' + wrong.slice(0, 200)); bad++; }
    else out.push('ok  red — ' + c.name + ': ' + (hit.length > 200 ? hit.slice(0, 197) + '...' : hit));
  }
  /* Beto's point, held: a dropped key field is invisible to fresh per-part builds and seen only by the collision pass */
  {
    const r = gate({ engineNew: plant(engine, 'p.rt,p.rb,', 'p.rt,'), engineOld: engine, oldLabel: 'the unplanted engine', sources });
    if (r.fails.some(f => /would look different|as one mesh/.test(f))) { out.push('FAIL — a forgotten cache field showed up in the fresh per-part builds, so the selftest no longer proves the collision pass is what catches it.'); bad++; }
    else out.push('ok  the forgotten rb is invisible to fresh per-part builds and caught only by the collision pass');
  }
  /* CI runs this file: the real ci.yml must pass, and each way of dropping it must not */
  {
    let yml = null; try { yml = read(CI); } catch (e) { /* said below */ }
    const real = ciRuns(yml);
    if (real.length) { out.push('FAIL — ' + real[0]); bad++; }
    else out.push('ok  green — ' + CI + ' runs the self-test and the comparison in one unconditional step of the smoke job');
    const drop = (line) => { const ls = (yml || '').split('\n'), kept = ls.filter(l => l.trim() !== line); if (kept.length === ls.length) throw new Error('the line `' + line + '` is not in ' + CI + ', so the plant tests nothing'); return kept.join('\n'); };
    const ciCases = [
      ['the self-test line deleted from ci.yml', () => drop(SELF_LINE), /no longer runs `node test\/prims\.js --selftest`/],
      ['the comparison line deleted from ci.yml', () => drop(COMPARE_LINE), /no longer runs `node test\/prims\.js "origin\/\$BASE_REF"`/],
      ['the step made conditional', () => plant(yml || '', '        run: |\n          node test/prims.js --selftest', '        if: false\n        run: |\n          node test/prims.js --selftest', CI), /only in a step with an `if:`/],
    ];
    for (const [name, mk, want] of ciCases) {
      let f; try { f = ciRuns(mk()); } catch (e) { out.push('FAIL — ' + name + ': ' + e.message); bad++; continue; }
      const hit = f.find(x => want.test(x));
      if (!hit) { out.push('FAIL — planted ' + name + ' and the check ' + (f.length ? 'went red for another reason: ' + f[0] : 'stayed green') + '.'); bad++; }
      else out.push('ok  red — ' + name + ': ' + (hit.length > 200 ? hit.slice(0, 197) + '...' : hit));
    }
  }
  out.forEach(l => console.log(l));
  console.log(bad ? 'FAIL — ' + bad + ' of the gate\'s own cases did not come out as they should.' : 'OK — the shape gate went red for every plant, with its sentence, and green where nothing that changes a drawn byte was planted.');
  return bad ? 1 : 0;
}

if (require.main === module) process.exit(process.argv.includes('--selftest') ? selftest() : main(process.argv.slice(2)));
module.exports = { gate, ciRuns, FLOOR };
