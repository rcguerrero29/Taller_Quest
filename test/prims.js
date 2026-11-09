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
        material it is drawn with (all of it, as three.js's toJSON writes it out, and whether
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
     5½. THE ONE LIST: the builder keeps one list of what a part may say (PARTKEYS, grep `THE ONE LIST OF WHAT A PART
        MAY SAY`), which every other reader of parts takes its own keys from; without it the gate stops, because it reads
        parts with it. It must be frozen, call every key a kind a reader knows, and name exactly the keys the builder reads
        (every `p.<key>` in its lines, and every key it asks of a part while it builds one, through a Proxy), no more and no
        fewer; and each key must be drawn as its kind says, read off what the builder draws when that key alone changes
        (WHAT KIND EACH KEY IS, below), never off the list itself. The harvest reads its keys and which of them are text
        from the list (and is asked, key by key, to read a part written with each), and a colour key is twinned with a colour.
     5¾. THE ONE PLACE A CORNER'S TWO COLOURS ARE MIXED: every corner of a part with a second colour takes its colour from
        t3CornerMix, which is told where the thing stands; today it uses the part's own two colours alone and reads nothing of
        where. Asked of a part of every primitive the builder knows, one leaning, and a pane of glass, through the mesh the scene
        is handed, with t3CornerMix's body rewritten in memory: as it is, they come out the same in six places (two worlds, two
        columns, two rows, null and nothing); a stand-in for a room's light given only here shades the solid and the glass
        differently at x 2 and at x 5; and a sentinel body reaches every corner in all six, so nothing else works out a mix.
        And every call of t3MeshOf in engine/engine3d.js says where the thing it builds stands (a place, or null).
     6. It reads .github/workflows/ci.yml and fails when CI no longer runs this file's self-test and then
        its --ci comparison, exactly, in one step a red can fail, because a gate nobody runs protects
        nothing. Which commit CI compares with is decided here (--ci), not in ci.yml, so the self-test
        can plant every branch of that choice.

   WHAT IT DOES NOT READ, so nobody takes its OK for more: the shape library's own code in
   engine/shapes.js (facing, the seeds, the runs: which parts a tile gets and where) is read only as
   text for its literal parts, and its `turned` only to check that the gate turns a part the way it does
   (a change there is a red that asks for the gate's copy to follow, not a comparison with the base);
   the 138 parts written with a computed size; everything in engine3d.js outside the builder's sentinels
   (lights, camera, t3Build, how a tile is placed), but for each call of t3MeshOf, read as text for whether it says where
   the thing stands; and the browser. Those are the smoke suites' job.

   Run:  node test/prims.js                      compare the working tree with origin/main
         node test/prims.js <base-ref>           … with another commit (CI passes the pull request's base)
         node test/prims.js --old-file <path>    … with an engine3d.js on disk (a copy, a mockup's engine)
         node test/prims.js --selftest           plant each way the builder can break and watch it go red
         node test/prims.js --ci                 what CI runs: reads EVENT, BASE_REF and BEFORE from the
                                                 environment and picks the base (grep `function ciPlan`)

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
/* two materials (parts.js partsOf: the whole toJSON, and whether the wash reaches it) as the keys that
   differ and nothing else: "wireframe undefined → true", "blending undefined → 2, side undefined → 2" */
function matDiff(a, b) {
  if (!a || !b) return a === b ? '' : (b ? 'a material where there was none' : 'no material at all');
  const out = [];
  if (a.json !== b.json) {
    const ja = JSON.parse(a.json), jb = JSON.parse(b.json), say = v => v === undefined ? 'undefined' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    Object.keys({ ...ja, ...jb }).sort().forEach(k => { if (JSON.stringify(ja[k]) !== JSON.stringify(jb[k])) out.push(k + ' ' + say(ja[k]) + ' → ' + say(jb[k])); });
  }
  if (a.tinted !== b.tinted) out.push('tinted ' + a.tinted + ' → ' + b.tinted);
  return out.join(', ');
}
/* the object's own placement and showing, named field by field like the material (see partsOf) */
function objDiff(a, b) {
  if (a === b) return '';
  if (!a || !b) return b ? 'an object where there was none' : 'no object at all';
  const ja = JSON.parse(a), jb = JSON.parse(b), say = v => v === undefined ? 'undefined' : JSON.stringify(v);
  return Object.keys({ ...ja, ...jb }).sort().filter(k => JSON.stringify(ja[k]) !== JSON.stringify(jb[k]))
    .map(k => k + ' ' + say(ja[k]) + ' → ' + say(jb[k])).join(', ');
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
  const o = objDiff(a.object, b.object); if (o) d.push('object (' + o + ')');
  const ga = a.glass, gb = b.glass;
  if (ga.length !== gb.length) d.push('glass (' + gb.length + ' panes where there were ' + ga.length + ')');
  else ga.forEach((g, i) => {
    const h = gb[i], gd = [];
    geoDiff(g, h, 'glass', gd);
    const gm = matDiff(g.material, h.material); if (gm) gd.push('glass material (' + gm + ')');
    if (g.tag !== h.tag) gd.push('glass tag (userData ' + g.tag + ' → ' + h.tag + ')');
    const go = objDiff(g.object, h.object); if (go) gd.push('glass object (' + go + ')');
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

/* a twin differing only in key k; a colour key (the one list's kind `colour`) is twinned with another colour */
function twin(p, k, kinds, colours) {
  const q = { ...p };
  if (k === 's') q.s = kinds[(kinds.indexOf(kind(p)) + 1) % kinds.length];
  else if (colours.has(k)) q[k] = p[k] === '#123456' ? '#654321' : '#123456';
  else q[k] = typeof p[k] === 'number' ? +(p[k] * 1.25 + 0.05).toFixed(6) : 0.37;
  return q;
}

/* ---- WHAT KIND EACH KEY IS, read off what the builder draws, never off the list being checked ----
   Every reader of parts goes by the one list's kind for a key: the kitchen makes a size smaller to fit a shelf and takes a colour
   only as #rrggbb, the harvest reads a colour as text. So each key of the list is asked the way its kind is, alone on a part of a
   primitive with nothing else set, each part through a builder of its own (its bake with the colours as asked, or for glass its
   mesh), and what comes out must be what that kind does:
     shape    each primitive's name: each builds corners of its own
     colour   two colours: the colours change, and the corners neither move nor turn
     glass    0.5: the part is drawn as a pane of glass apart from the solid
     place    0, then 0.1: every corner moves 0.1 along one axis, and nothing else changes
     stretch  1, then 2: on every primitive, one coordinate of every corner doubles and the other two stay
     size     0.2, 0.4, 0.6: the corners move evenly with it, not all alike, and it is no stretch
     angle    0.2, 0.4, 0.6: the corners move, and not evenly (it turns a part, or bends a ring)
   A key the list calls the wrong kind (a colour called a size, an arc called a size) is drawn as it is, and is red here. */
/* the kinds of key a reader of parts knows, each with the values it is asked with (a shape, with each primitive's name) */
const ASKED = { shape: null, colour: ['#123456', '#654321'], glass: [0.5], place: [0, 0.1], stretch: [1, 2], size: [0.2, 0.4, 0.6], angle: [0.2, 0.4, 0.6] };
/* what a reader does with a key of each kind, for the sentence when a key is not drawn as its kind says */
const BY_KIND = { shape: 'the kitchen takes only the primitives it knows', place: 'the kitchen works out again where each part stands',
  size: 'the kitchen makes every size smaller to fit a shelf', angle: 'the kitchen keeps an angle as it is when it fits a thing',
  stretch: 'the kitchen keeps a stretch as it is when it fits a thing', colour: 'the kitchen takes a colour only as #rrggbb, and the harvest reads it as text',
  glass: 'the kitchen refuses glass' };
function kindsDrawn(B, LIST, kinds) {
  const fails = [], E = 1e-5, a_ = w => /^[aeiou]/.test(w) ? 'an ' + w : 'a ' + w;
  const bake = p => { try { const r = B.fresh().t3BakeParts([p], h => h); return { pos: r.pos, nor: r.nor, col: r.col }; } catch (e) { return null; } };
  const eq = (x, y) => x.length === y.length && x.every((v, i) => v === y[i]);
  const same = (x, y) => !!x && !!y && eq(x.pos, y.pos) && eq(x.nor, y.nor) && eq(x.col, y.col);
  Object.keys(LIST).forEach(k => {
    const kind = LIST[k]; if (!Object.prototype.hasOwnProperty.call(ASKED, kind)) return;   /* a kind no reader knows is a red of its own */
    const A = ASKED[kind], no = why => fails.push('the one list of what a part may say calls `' + k + '` ' + a_(kind) + ', but the builder does not draw it as one: ' + why + '; and every reader of parts goes by the list (' + BY_KIND[kind] + ').');
    if (kind === 'shape') { const b = kinds.map(s => bake({ [k]: s })); if (b.some((x, i) => !x || b.some((y, j) => j < i && same(x, y)))) no('the primitives named in it (' + kinds.join(', ') + ') do not each build corners of their own'); return; }
    if (kind === 'glass') { let m = null; try { m = B.fresh().t3MeshOf([{ s: 'box', [k]: A[0] }], { gate: 'a kind' }, null); } catch (e) { /* said below */ }
      if (!m || m.geometry.attributes.position.count !== 0 || m.children.length !== 1) no('a box whose ' + k + ' is ' + A[0] + ' is not drawn as a pane of glass apart from the solid'); return; }
    const s = kinds.find(t => { const x = bake({ s: t, [k]: A[0] }), y = bake({ s: t, [k]: A[1] }); return x && y && !same(x, y); });
    if (!s) { no('a part whose ' + k + ' alone goes from ' + JSON.stringify(A[0]) + ' to ' + JSON.stringify(A[1]) + ' is drawn the same on every primitive'); return; }
    const x = bake({ s, [k]: A[0] }), y = bake({ s, [k]: A[1] }), n = x.pos.length / 3, P = nameOf(s)[0];
    if (kind === 'colour') { if (!eq(x.pos, y.pos) || !eq(x.nor, y.nor)) no('a ' + P + ' whose ' + k + ' goes from one colour to another moves or turns, where a colour changes only how it is coloured'); return; }
    if (kind === 'place') {
      const moved = [0, 1, 2].some(ax => x.pos.every((v, i) => Math.abs(y.pos[i] - v - (i % 3 === ax ? A[1] - A[0] : 0)) <= E));
      if (!moved || !eq(x.nor, y.nor) || !eq(x.col, y.col)) no('a ' + P + ' whose ' + k + ' alone goes from ' + A[0] + ' to ' + A[1] + ' does not just move ' + (A[1] - A[0]) + ' along one axis'); return; }
    const stretches = kinds.every(t => { const u = bake({ s: t, [k]: 1 }), v = bake({ s: t, [k]: 2 });
      return !!u && !!v && u.pos.length === v.pos.length && [0, 1, 2].some(ax => u.pos.every((w, i) => Math.abs(v.pos[i] - (i % 3 === ax ? 2 * w : w)) <= E)); });
    if (kind === 'stretch') { if (!stretches) no('going from 1 to 2 it does not stretch every primitive along one axis, the other two left as they were'); return; }
    if (stretches) { no('going from 1 to 2 it stretches every primitive along one axis, the other two left as they were, as a stretch does'); return; }
    const z = bake({ s, [k]: A[2] });
    const even = !!z && z.pos.length === x.pos.length && x.pos.every((v, i) => Math.abs((z.pos[i] - y.pos[i]) - (y.pos[i] - v)) <= E);
    const alike = [0, 1, 2].every(o => { const d0 = y.pos[o] - x.pos[o]; for (let v = 1; v < n; v++) if (Math.abs(y.pos[3 * v + o] - x.pos[3 * v + o] - d0) > E) return false; return true; });
    if (kind === 'size' && !even) no('as it goes 0.2, 0.4 and 0.6 a ' + P + '\'s corners do not move evenly with it, as they would with a length: it turns the part or bends it');
    else if (kind === 'size' && alike) no('as it goes 0.2, 0.4 and 0.6 every corner of a ' + P + ' moves alike, as when a part is moved, where a size changes its shape');
    else if (kind === 'angle' && even) no('as it goes 0.2, 0.4 and 0.6 a ' + P + '\'s corners move evenly with it, as they do with a length, where an angle turns a part or bends a ring');
  });
  return fails;
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

  /* the primitives the builder knows, read out of its code: a primitive added tomorrow is harvested and must be drawn */
  const kinds = P.kindsOf(NEW.code);
  /* the keys the builder reads off a part, two ways: every `p.<key>` written in its lines, and every key it asks of a part while
     it builds one of each primitive, plain, with a second colour and as glass, each part a Proxy that writes down what it is
     asked for, so a key read by destructuring, as `p?.k` or as `p["k"]` is seen as well. A key added tomorrow (arc0, seg) is
     harvested and twinned without anybody editing this file. */
  const asked = new Set();
  {
    const spy = o => new Proxy(o, { get: (t, k, r) => { if (typeof k === 'string') asked.add(k); return Reflect.get(t, k, r); },
      has: (t, k) => { if (typeof k === 'string') asked.add(k); return Reflect.has(t, k); } });
    try { NEW.fresh().t3MeshOf(kinds.flatMap(s => [{ s }, { s, c: '#C08040', cb: '#402010' }, { s, a: 0.5 }]).map(spy), TAG, null); }
    catch (e) { fails.push('the working tree\'s builder throws when it builds one part of each primitive, plain, with a second colour and as glass: ' + String(e.message || e).slice(0, 140)); return { fails, info }; }
  }
  const reads = [...new Set([...[...NEW.code.matchAll(/\bp\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]), ...asked])];
  /* ---- THE ONE LIST OF WHAT A PART MAY SAY and the builder agree ----
     engine/engine3d.js keeps one list of every key a part may carry and what kind of thing each is (grep `THE ONE LIST OF WHAT A
     PART MAY SAY`), and every other reader of parts takes its own from it: in this repository the kitchen (which keys a thing's
     part may say, how far each may go, which it makes smaller to fit) and this gate (which keys it harvests as written, which
     of them as text, and twins). So the list must name exactly what the builder reads: a key the builder reads and the list
     leaves out is refused by those readers, and a key the list names and the builder never reads is a promise that changes
     nothing. Every kind must be one a reader knows how to treat, and every key drawn as its kind says (kindsDrawn, above).
     Without the list the gate cannot read a part at all, so it stops there. */
  /* the kinds a reader of parts knows (ASKED, above), and a value of a key's kind for the gate to write when it asks about it */
  const KINDS = Object.keys(ASKED), sample = kind => kind === 'shape' ? 'sph' : ASKED[kind][ASKED[kind].length - 1];
  const LIST = probe.PARTKEYS;
  if (!LIST || typeof LIST !== 'object') { fails.push('the shape builder in engine/engine3d.js has no one list of what a part may say (`PARTKEYS`, grep `THE ONE LIST OF WHAT A PART MAY SAY`), so every reader of parts keeps a list of its own, and a key added to one of them is refused by the others; the gate reads parts with that list, so it stops here.'); return { fails, info }; }
  const listed = Object.keys(LIST);
  if (!Object.isFrozen(LIST)) fails.push('the one list of what a part may say is not frozen, so any script can add a key to it, or change one, for every reader of parts at once.');
  listed.filter(k => !KINDS.includes(LIST[k])).forEach(k => fails.push('the one list of what a part may say calls `' + k + '` a ' + JSON.stringify(String(LIST[k]).slice(0, 30)) + ', which is none of the kinds a reader of parts knows how to treat (' + KINDS.join(', ') + ').'));
  reads.filter(k => !listed.includes(k)).forEach(k => fails.push('the shape builder reads `' + k + '` off a part, which the one list of what a part may say does not name, so a kitchen refuses a thing whose part carries it.'));
  listed.filter(k => !reads.includes(k)).forEach(k => fails.push('the one list of what a part may say names `' + k + '`, which the shape builder never reads, so a part that carries it is drawn as if it did not.'));
  fails.push(...kindsDrawn(NEW, LIST, kinds));
  /* what the harvest and the twins read parts with: the list's keys and kinds, and any key the builder reads that the list
     leaves out (a red above), of no kind, so a part carrying it is still built */
  const list = Object.assign(Object.create(null), LIST); reads.forEach(k => { if (!listed.includes(k)) list[k] = undefined; });
  const keys = Object.keys(list), colours = new Set(keys.filter(k => list[k] === 'colour')), shape = P.shapeKeysOf(NEW.code);
  if (!shape) { fails.push('the gate cannot find t3Prim in the shape builder in engine/engine3d.js, so it cannot tell which of a part\'s keys its shape is built from and which only say where it stands, how it is turned or its colour.'); return { fails, info }; }
  /* every key of the list, written on a part as a literal of its kind, is read by the harvest as it is written: a key it took for
     computed (a colour read as a number, say) would drop every part the games write with that key out of every comparison below,
     and the OK would still be printed */
  {
    const lit = o => '{' + Object.keys(o).map(k => k + ':' + (typeof o[k] === 'string' ? JSON.stringify(o[k]) : String(o[k]))).join(',') + '}';
    const off = listed.filter(k => KINDS.includes(LIST[k])).filter(k => {
      const o = Object.assign({ s: 'box', y: 0.3, w: 0.2, h: 0.6, d: 0.2, c: '#FFFFFF' }, { [k]: sample(LIST[k]) });
      let h; try { h = P.harvest('const PROBE=[' + lit(o) + '];\n', 'the gate\'s own probe', list, kinds, shape); } catch (e) { h = { parts: [], escaped: [{ why: String(e.message || e).slice(0, 100) }] }; }
      const got = h.parts.length === 1 ? h.parts[0] : null;
      if (got && JSON.stringify(got.part) === JSON.stringify(o)) return false;
      fails.push('a part written with ' + k + ':' + (typeof o[k] === 'string' ? JSON.stringify(o[k]) : o[k]) + ' is not read by the gate as it is written (' +
        (got ? 'it comes back as ' + JSON.stringify(got.part) : h.escaped.length ? h.escaped[0].why : 'it is not collected at all') + '), so a part the games write with a `' + k + '` is never compared as the games draw it, and the gate would still say every literal part came out byte for byte.');
      return true;
    });
    if (!off.length) info.push('the harvest reads a part written with each of the list\'s ' + listed.length + ' keys as it is written');
  }

  /* ---- the harvest ---- */
  const seen = new Map(), perFile = {}; let escaped = 0;
  for (const { file, text } of sources) {
    const h = P.harvest(text, file, list, kinds, shape);
    perFile[file] = h.parts.length; escaped += h.escaped.length;
    h.parts.forEach(x => { const id = JSON.stringify(x.part); if (!seen.has(id)) seen.set(id, x); });
  }
  const parts = [...seen.values()];
  const byKind = {}; parts.forEach(x => { byKind[kind(x.part)] = (byKind[kind(x.part)] || 0) + 1; });
  info.push('harvested ' + parts.length + ' distinct parts (' + kinds.map(k => (byKind[k] || 0) + ' ' + nameOf(k)[byKind[k] === 1 ? 0 : 1]).join(', ') + ') from ' +
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

  /* ---- THE ONE PLACE A CORNER'S TWO COLOURS ARE MIXED (engine/engine3d.js, grep the same words) ----
     Every corner of a part with a second colour takes its colour from t3CornerMix, which is told where the thing stands, so a later
     light of the room has one place to come in; today it uses the part's own two colours alone. Asked of a part of every primitive
     the builder knows (kindsOf), one more leaning far over, and a pane of glass, through the mesh the scene is handed (t3MeshOf), the
     solid and the glass, in six places (two worlds, two columns, two rows, and standing nowhere, as null and as nothing at all), with
     the one place's body rewritten here, in memory, never on disk:
       today       the engine's own body reads nothing of where the thing stands (its fourth argument), and the parts come out byte
                   for byte the same in all six places;
       a light     a stand-in for a room's light, given only in this gate (half as bright at x 5): the solid and the glass each come
                   out differently at x 2 and at x 5, so the one place is told where the thing stands and the bake and the mesh hand
                   it on, to every part;
       a sentinel  a body that answers one colour: every corner of every part in all six places takes it, so nothing else works out
                   a mix, for any primitive, for glass, or for a thing that stands nowhere. */
  {
    const NAME = 'function t3CornerMix(', at0 = engineNew.indexOf(NAME), again = at0 < 0 ? -1 : engineNew.indexOf(NAME, at0 + 1);
    const open = at0 < 0 ? -1 : engineNew.indexOf('{', at0), body = open < 0 ? null : P.objectSpans(engineNew).find(([a]) => a === open);
    if (again >= 0) fails.push('the shape builder in engine/engine3d.js writes the one place a corner\'s two colours are mixed twice (`function t3CornerMix(` twice, grep `THE ONE PLACE A CORNER\'S TWO COLOURS ARE MIXED`): the later silently replaces the earlier, so which mix is drawn turns on the order of the lines, and a later light of the room could be written into the one that never runs.');
    else if (at0 < 0 || !body || typeof probe.t3CornerMix !== 'function') fails.push('the shape builder in engine/engine3d.js has no one place that works out a corner\'s mix of a part\'s two colours, told where the thing stands (`function t3CornerMix(`, grep `THE ONE PLACE A CORNER\'S TWO COLOURS ARE MIXED`), so a later light of the room would have to be written into every place that mixes them.');
    else {
      const withBody = b => engineNew.slice(0, open) + '{' + b + '}' + engineNew.slice(body[1] + 1);
      const STAND = 'const d=at&&at.x===5?0.5:1;out[0]=(foot.r+(top.r-foot.r)*k)*d;out[1]=(foot.g+(top.g-foot.g)*k)*d;out[2]=(foot.b+(top.b-foot.b)*k)*d;return out;';
      const SENT = 'out[0]=0.25;out[1]=0.5;out[2]=0.75;return out;', S3 = [0.25, 0.5, 0.75].map(Math.fround);
      const SHADED = [...kinds.map((s, i) => ({ s, x: -0.4 + 0.2 * i, y: 0.3, c: '#F0C040', cb: '#402010' })),
        { s: 'cyl', y: 0.3, r: 0.05, h: 0.6, rz: 1.2, ry: 0.4, c: '#80C0F0', cb: '#102030' },
        { s: 'box', x: 0.3, y: 0.2, w: 0.1, h: 0.4, d: 0.1, c: '#C0E0F0', cb: '#204060', a: 0.5 }];
      const N = SHADED.length + ' parts (one of each primitive, one leaning, a pane of glass)';
      const PLACES = [[{ world: 'the gate', x: 2, y: 3 }, 'at x 2'], [{ world: 'another world', x: 2, y: 3 }, 'in another world'], [{ world: 'the gate', x: 5, y: 3 }, 'at x 5'],
        [{ world: 'the gate', x: 2, y: 7 }, 'on another row'], [null, 'standing nowhere (null)'], [undefined, 'told nothing of where they stand']];
      const colours = (B, where) => { const m = B.t3MeshOf(SHADED, TAG, where); return [m, ...m.children].map(o => o.geometry.attributes.color.array); };
      const alike = (a, b) => a.length === b.length && a.every((x, i) => x.length === b[i].length && x.every((v, j) => v === b[i][j]));
      const params = engineNew.slice(engineNew.indexOf('(', at0) + 1, engineNew.indexOf(')', at0)).split(',').map(x => x.trim()), atName = params[3];
      if (atName && /^[A-Za-z_$][\w$]*$/.test(atName) && new RegExp('(^|[^\\w$.])' + atName.replace(/\$/g, '\\$') + '(?![\\w$])').test(engineNew.slice(open + 1, body[1])))
        fails.push('today\'s mix of a part\'s two colours reads where the thing stands (`' + atName + '`, in the body of t3CornerMix), where today it is to use the part\'s own two colours alone, so things would come out differently from one place to another.');
      let L, Z;
      try { const T = NEW.fresh(), here = colours(T, PLACES[0][0]), off = PLACES.slice(1).find(([w]) => !alike(here, colours(T, w)));
        if (off) fails.push('today\'s mix of a part\'s two colours changes with where the thing stands: the same ' + N + ' come out differently at x 2 and ' + off[1] + ', so things would no longer look as they do.'); }
      catch (e) { fails.push('the one place could not be asked on the working tree\'s builder: ' + String(e.message || e).slice(0, 140)); }
      try { L = P.loadBuilder(withBody(STAND), 'engine/engine3d.js with a stand-in for a room\'s light', threeNew, 'vendor/three.min.js').fresh(); Z = P.loadBuilder(withBody(SENT), 'engine/engine3d.js with a sentinel mix', threeNew, 'vendor/three.min.js').fresh(); }
      catch (e) { fails.push('the one place, rewritten in memory for a stand-in light, no longer loads: ' + String(e.message || e).slice(0, 140)); }
      if (L) {
        const x2 = colours(L, PLACES[0][0]), x5 = colours(L, PLACES[2][0]), still = x2.map((c, i) => alike([c], [x5[i]]));
        if (still.some(Boolean)) fails.push('a stand-in for a room\'s light, given only in this gate, shades ' + (still.every(Boolean) ? 'the same ' + N : still[0] ? 'the solid parts' : 'the pane of glass') + ' the same at x 2 and at x 5: the one place that mixes a corner\'s two colours is not told where the thing stands, or the bake or the mesh does not hand it on' + (still.every(Boolean) ? '' : ' to every part') + '.');
      }
      if (Z) {
        let n = 0, off = 0, first = null;
        PLACES.forEach(([w, how]) => colours(Z, w).forEach(a => { for (let i = 0; i < a.length; i += 3) { n++; if (a[i] !== S3[0] || a[i + 1] !== S3[1] || a[i + 2] !== S3[2]) { off++; first = first || how; } } }));
        if (!n) fails.push('the ' + N + ' with a second colour built no corner at all, so whether the one place mixes them could not be asked.');
        else if (off) fails.push(off + ' of the ' + n + ' corners of ' + N + ' with a second colour, built in six places, took their colour from somewhere other than the one place that mixes them (t3CornerMix), the first ' + first + ': a second place works out the mix, and a later light given there would miss them.');
        else info.push('the one place a corner\'s two colours are mixed: today it reads nothing of where a thing stands and is the same in six places; a stand-in light given only here shades the solid and the glass differently; a sentinel reached all ' + n + ' corners of ' + N + ' in all six');
      }
    }
  }
  /* ---- EVERY CALL SAYS WHERE THE THING IT BUILDS STANDS ----
     Each call of t3MeshOf in engine/engine3d.js (the tile's mesh, the bridge, the ofrenda, the trolley, a kitchen's column built
     again) hands it a third argument: the place ({world, x, y}), or null for a thing that stands nowhere. A call that hands none
     would be lit, once a light of the room comes in at the one place, as if it stood nowhere, and nothing drawn today would show
     it. Read as text, outside the builder too: the one thing this gate reads there. */
  {
    const spans = new Map(P.objectSpans(engineNew)), calls = [], call = /(^|[^\w$.])t3MeshOf\s*\(/g;
    let m;
    while ((m = call.exec(engineNew))) {
      const i = m.index + m[1].length, before = engineNew.slice(0, i);
      if (before.lastIndexOf('/*') > before.lastIndexOf('*/') || before.slice(before.lastIndexOf('\n') + 1).includes('//')) continue;   /* written in a comment */
      let args = 1, depth = 0, empty = true;
      for (let j = engineNew.indexOf('(', i) + 1; j < engineNew.length; j++) {
        const ch = engineNew[j];
        if (ch === '{' && spans.has(j)) { j = spans.get(j); empty = false; continue; }
        if (ch === '(' || ch === '[') depth++;
        else if (ch === ')' || ch === ']') { if (!depth) break; depth--; }
        else if (ch === ',' && !depth) args++;
        if (!/\s/.test(ch)) empty = false;
      }
      calls.push({ line: before.split('\n').length, args: empty ? 0 : args });
    }
    if (!calls.length) fails.push('the gate found no call of t3MeshOf in engine/engine3d.js, so whether the engine says where each thing it builds stands could not be asked.');
    calls.filter(c => c.args < 3).forEach(c => fails.push('engine/engine3d.js:' + c.line + ' builds a mesh without saying where the thing stands (t3MeshOf with ' + said(c.args) + ' argument' + (c.args === 1 ? '' : 's') + '; hand it the place, or null for a thing that stands nowhere), so a later light of the room would light it as if it stood nowhere.'));
    if (calls.length && calls.every(c => c.args >= 3)) info.push('every one of the ' + calls.length + ' calls of t3MeshOf in engine/engine3d.js says where the thing it builds stands');
  }

  /* ---- the collision pass: one builder, one cache, the whole harvest and every part's twins ---- */
  const shared = NEW.fresh(), crossed = [], forgot = {};
  let twins = 0;
  for (const x of parts) {
    const b = fresh.get(x); if (!b || b.error) continue;
    const s = builtOn('the working tree', shared, [x.part]);
    /* a part that already came back with another's shape has a poisoned cache under it: its twins would
       blame every key, x and c among them, which are not in the cache key at all (Beto, #316 recheck) */
    if (s.error || differs(s, b).length) { crossed.push(x); continue; }
    for (const k of keys) {
      const q = twin(x.part, k, kinds, colours);
      const one = builtOn('the working tree', shared, [q]), two = builtOn('the working tree', NEW.fresh(), [q]);
      if (one.error || two.error) continue;
      twins++;
      if (differs(one, two).length && !forgot[k]) forgot[k] = { x, from: x.part[k], to: q[k] };
    }
  }
  if (twins < parts.length - crossed.length) fails.push('the collision pass built only ' + twins + ' twins for ' + parts.length + ' parts, so a field missing from the shape cache\'s key could pass unseen.');
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

/* ---- does CI still run this gate? (Melo and Beto, #316) ----
   Nothing else reads ci.yml for it: a deleted line there would stop the gate's red cases, or its
   comparison, from running anywhere, and every check would stay green. So the smoke job must hold ONE
   step that runs exactly these two lines, in this order, and nothing else:
       node test/prims.js --selftest
       node test/prims.js --ci
   with no `if:`, no `continue-on-error`, no `shell:` of its own (GitHub's default runs bash -eo pipefail,
   so the first line's red stops the step), and no `set +e` or `|| true` in the run block, each of which
   turns a red self-test into a green step. Which base the comparison takes is not decided in ci.yml any
   more but here (ciPlan, below), because a branch written in shell is one this file cannot plant: a
   one-character slip in it (`pull-request`) used to stop every comparison while this check printed OK.
   The step must still hand --ci the three facts it decides on, so its env is read too.
   (Deleting the whole step is caught by none of this, since this file is what that step runs: a check of
   ci.yml from outside it, the way test/protect.js reads the repository's rules, is that guard's job.) */
const SELF_LINE = 'node test/prims.js --selftest', CI_LINE = 'node test/prims.js --ci';
const CI_ENV = { EVENT: '${{ github.event_name }}', BASE_REF: '${{ github.base_ref }}', BEFORE: '${{ github.event.before }}' };
function ciRuns(yml) {
  if (typeof yml !== 'string' || !yml.trim()) return [CI + ' could not be read, so nobody can say CI runs the shape gate.'];
  const lines = yml.split('\n');
  const lead = l => /^(\s*)/.exec(l)[1].length;
  const job = lines.findIndex(l => /^\s{2}smoke:\s*$/.test(l));
  if (job < 0) return [CI + ' has no job named smoke, so the shape gate runs in no check a pull request must pass.'];
  let end = lines.findIndex((l, i) => i > job && /^\s{2}[A-Za-z_][\w-]*:\s*$/.test(l)); if (end < 0) end = lines.length;
  const first = lines.findIndex((l, i) => i > job && i < end && /^\s*- /.test(l));
  if (first < 0) return [CI + '\'s smoke job has no steps, so the shape gate runs nowhere.'];
  const ind = lead(lines[first]), steps = [];
  for (let i = first; i < end; i++) {
    const l = lines[i];
    if (lead(l) === ind && /^\s*- /.test(l)) steps.push([]);
    if (steps.length) steps[steps.length - 1].push(l);
  }
  /* a step's keys sit at ind+2 (or after the "- " on its first line) */
  const keyAt = (s, k) => s.findIndex(l => new RegExp('^\\s{' + ind + '}(?:- |  )' + k + ':').test(l));
  /* its run block as lines, comments and blank lines left out: `run: |` and the lines indented under it,
     or the one line after `run:`, each split at && */
  const runOf = s => {
    const at = keyAt(s, 'run'); if (at < 0) return null;
    const head = s[at].replace(/^\s*-?\s*run:\s*/, '');
    let body;
    if (/^[|>][-+]?\s*$/.test(head)) {
      body = [];
      for (let i = at + 1; i < s.length && (!s[i].trim() || lead(s[i]) > ind + 2); i++) body.push(s[i]);
      if (head[0] === '>') body.unshift(head);   /* folded: the lines run as ONE command, which is not the pair */
    } else body = [head];
    return body.flatMap(l => l.split('&&')).map(c => c.trim()).filter(c => c && !c.startsWith('#'));
  };
  const fails = [];
  const mine = steps.filter(s => (runOf(s) || []).some(c => c.includes('test/prims.js')));
  if (!mine.length) return [CI + ' no longer runs `' + SELF_LINE + '` and then `' + CI_LINE + '` in the smoke job, so the shape gate\'s own red cases run nowhere and no pull request is compared with its base — and the next change that blinds the gate lands green and stays green.'];
  if (mine.length > 1) fails.push(CI + ' runs the shape gate in ' + mine.length + ' steps; keep its self-test and its comparison in one, so neither is moved or dropped without the other being seen.');
  const s = mine[0], cmds = runOf(s), body = s.slice(keyAt(s, 'run')).join('\n');
  if (/\bset\s+\+[a-z]*e|\bset\s+\+o\s+errexit/.test(body)) fails.push(CI + '\'s shape-gate step turns off stopping at the first red (`set +e`), so a red self-test runs on into the comparison and the step can come out green.');
  if (/\|\|/.test(body)) fails.push(CI + '\'s shape-gate step catches a red with `||` (`|| true`, say), so the gate can fail and the step still pass.');
  if (keyAt(s, 'if') >= 0 || keyAt(s, 'continue-on-error') >= 0) fails.push(CI + ' runs the shape gate only in a step with an `if:` or `continue-on-error`, so it can be skipped or ignored and no red from it stops a pull request.');
  if (keyAt(s, 'shell') >= 0) fails.push(CI + '\'s shape-gate step names a `shell:` of its own, so it may not be the bash -eo pipefail that stops at the first red; leave it to the default.');
  /* and the shell can come from `defaults: run: shell:` above the step, for the whole workflow or for the smoke
     job, which the step's own keys never show (Beto and Melo, #316 second recheck: three lines there and a red
     self-test ran on into an OK) */
  const jobsAt = lines.findIndex(l => /^jobs:\s*$/.test(l));
  lines.forEach((l, i) => {
    if (!/^\s*shell:/.test(l)) return;
    const where = jobsAt >= 0 && i < jobsAt ? 'the whole workflow' : (i > job && i < first ? 'the smoke job' : null);
    if (where) fails.push(CI + ' sets a default shell for ' + where + ' (line ' + (i + 1) + ': ' + l.trim() + '), so the shape-gate step may not run in the bash that stops at the first red; leave it to the default.');
  });
  if (cmds.length !== 2 || cmds[0] !== SELF_LINE || cmds[1] !== CI_LINE)
    fails.push(CI + '\'s shape-gate step must run exactly `' + SELF_LINE + '` and then `' + CI_LINE + '`, and nothing else; it runs ' + (cmds.length ? cmds.map(c => '`' + c + '`').join(', then ') : 'nothing') + '. Which base to compare with is decided by --ci, where the self-test can plant it, not in the step.');
  Object.entries(CI_ENV).forEach(([k, v]) => {
    if (!s.some(l => l.trim() === k + ': ' + v)) fails.push(CI + '\'s shape-gate step no longer hands --ci `' + k + ': ' + v + '`, so it cannot tell which commit to compare with.');
  });
  return fails;
}

/* ---- which commit CI compares with: the branching that used to be shell in ci.yml ----
   env: EVENT, BASE_REF and BEFORE as the step hands them. reachable(sha): whether git has that commit
   (git cat-file -e), a stub in --selftest. Returns { base } to compare with, { none: why } when there is
   nothing to compare (the self-test, on the line before in the same step, is then all that runs), or
   { fail: why }. Every value is checked before it reaches git, and a branch name or a commit is never
   allowed to start with "-", so nothing from the environment is read as an option. */
const ZERO = /^0+$/;
function ciPlan(env, reachable) {
  const ev = String(env.EVENT || '').trim(), ref = String(env.BASE_REF || '').trim(), before = String(env.BEFORE || '').trim();
  if (!ev) return { fail: 'EVENT is empty, so --ci cannot tell a pull request from a push; the step in ' + CI + ' must hand it `EVENT: ' + CI_ENV.EVENT + '`.' };
  if (ev === 'pull_request') {
    if (!ref) return { fail: 'this is a pull request and BASE_REF is empty, so there is no base to compare the shape builder with; the step must hand it `BASE_REF: ' + CI_ENV.BASE_REF + '`.' };
    if (!/^[A-Za-z0-9_.][A-Za-z0-9_./-]*$/.test(ref) || ref.includes('..')) return { fail: 'BASE_REF is not a branch name --ci will hand to git (' + JSON.stringify(ref.slice(0, 60)) + ').' };
    return { base: 'origin/' + ref, why: 'a pull request into ' + ref };
  }
  if (ev === 'push') {
    if (!before || ZERO.test(before)) return { none: 'this push has no earlier commit (the first push of a branch: BEFORE is ' + (before ? 'all zeros' : 'empty') + '), so there is nothing to compare the shape builder with' };
    if (!/^[0-9a-f]{40}([0-9a-f]{24})?$/.test(before)) return { fail: 'BEFORE is not a commit --ci will hand to git (' + JSON.stringify(before.slice(0, 60)) + ').' };
    if (!reachable(before)) return { none: 'the commit this push replaced (' + before.slice(0, 12) + ') is not in this clone, as after a force-push, so there is nothing to compare the shape builder with' };
    return { base: before, why: 'a push, against the commit it replaced' };
  }
  return { none: 'a ' + ev + ' run has no base of its own, so there is nothing to compare the shape builder with' };
}

function report(r, okLine) {
  r.info.forEach(l => console.log('  ' + l));
  if (r.fails.length) { console.log('FAIL — the shape gate:'); r.fails.forEach(f => console.log('- ' + f)); return 1; }
  console.log(okLine); return 0;
}

const git = args => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'pipe'] });
const reachable = sha => { try { git(['cat-file', '-e', sha + '^{commit}']); return true; } catch (e) { return false; } };

function main(argv) {
  if (argv.includes('--ci')) {
    const plan = ciPlan(process.env, reachable);
    if (plan.fail) { console.log('FAIL — the shape gate in CI: ' + plan.fail); return 1; }
    if (plan.none) {
      /* the CI step's other line still holds CI to it: it must run, and pass, before this one */
      let yml; try { yml = read(CI); } catch (e) { yml = null; }
      const f = ciRuns(yml);
      if (f.length) { console.log('FAIL — the shape gate in CI:'); f.forEach(x => console.log('- ' + x)); return 1; }
      console.log('OK — nothing to compare: ' + plan.none + '. The shape gate\'s own red cases ran on the line before this one, and that is all this run checks.');
      return 0;
    }
    console.log('  --ci: ' + plan.why + ', so the shape builder is compared with ' + plan.base);
    argv = [plan.base];
  }
  let oldLabel, engineOld, threeOld, threeOldLabel;
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
    if (base.startsWith('-')) { console.log('FAIL — the shape gate was asked to compare with ' + JSON.stringify(base) + ', which git would read as an option; name a branch or a commit.'); return 1; }
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
    { name: 'the mesh drawn with a tint t3BakeParts is not given', neu: e => plant(e, 't3BakeParts(list,tc,at)', 't3BakeParts(list,h=>h==="#888888"?"#898989":tc(h),at)'), want: /t3BakeParts — the name tests call — gives different bytes/ },
    { name: 'the mesh drops the theme (t3BakeParts(list,tc,at) → t3BakeParts(list,undefined,at)) and the bake\'s default is the identity', neu: e => plant(plant(e, 't3BakeParts(list,tc,at)', 't3BakeParts(list,undefined,at)'), 'tint=tint||tc;', 'tint=tint||(h=>h);'), want: /their colours changed/ },
    { name: 'the mesh forgets to pass tc (t3BakeParts(list,tc,at) → t3BakeParts(list,undefined,at)) and the bake\'s default keeps the theme — GREEN, which is why the default is tc', neu: e => plant(e, 't3BakeParts(list,tc,at)', 't3BakeParts(list,undefined,at)') },
    { name: 'the default grey one step redder in one channel (#888888 → #898888), which a theme that folds neighbours would hide', neu: e => plant(e, 'p.c||"#888888"', 'p.c||"#898888"'), want: /colours changed/ },
    { name: 'a wireframe left on the solid material', neu: e => plant(e, 'MeshLambertMaterial({vertexColors:true})', 'MeshLambertMaterial({vertexColors:true,wireframe:true})'), want: /material \(wireframe undefined → true\)/ },
    { name: 'an emissive glow on the solid material (night does not dim it)', neu: e => plant(e, 'MeshLambertMaterial({vertexColors:true})', 'MeshLambertMaterial({vertexColors:true,emissive:0x333333})'), want: /material \(emissive 0 → 3355443\)/ },
    { name: 'glass drawn double-sided and added instead of blended', neu: e => plant(e, GLASS, '{vertexColors:true,transparent:true,opacity:+a,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}'), want: /glass material \(blending undefined → 2, side undefined → 2\)/ },
    { name: 'how tall a thing stands, off by a hair', neu: e => plant(e, 'm.t3Top=top===-Infinity?0:top', 'm.t3Top=top===-Infinity?0:top+1e-6'), want: /their height \(t3Top/ },
    { name: 'glass drawn a little more solid', neu: e => plant(e, 'opacity:+a,', 'opacity:+a+0.01,'), want: /glass material \(opacity/ },
    { name: 'every mesh drawn without its vertex colours (white)', neu: e => plant(e, 'MeshLambertMaterial({vertexColors:true})', 'MeshLambertMaterial({vertexColors:false})'), want: /material \(vertexColors true → false\)/ },
    { name: 'the solid material never handed to T3.tintables (the time of day never reaches it)', neu: e => plant(e, 'T3.tintables.push(mat);', ''), want: /material \(tinted true → false\)/ },
    { name: 'the tag never reaching userData', neu: e => plant(e, 'm.userData=tag;', 'm.userData={};'), want: /tag \(userData \{"mesh":true/ },
    { name: 'the solid mesh hidden (visible set false where it is built)', neu: e => plant(e, 'm.userData=tag;', 'm.userData=tag;m.visible=false;'), want: /object \(visible true → false\)/ },
    { name: 'the solid mesh stretched half as tall again', neu: e => plant(e, 'm.userData=tag;', 'm.userData=tag;m.scale.y=1.5;'), want: /object \(scale \[1,1,1\] → \[1,1\.5,1\]\)/ },
    { name: 'glass that writes depth', neu: e => plant(e, GLASS, '{vertexColors:true,transparent:true,opacity:+a,depthWrite:true}'), want: /glass material \(depthWrite false → true\)/ },
    { name: 'glass drawn solid (transparent taken out)', neu: e => plant(e, GLASS, '{vertexColors:true,opacity:+a,depthWrite:false}'), want: /glass material \(transparent true → false\)/ },
    { name: 'a mesh baked without its normals', neu: e => plant(e, 'geo.setAttribute("normal",new THREE.Float32BufferAttribute(b.nor,3));', ''), want: /the mesh has no normals \(how light falls on it\)/, never: /builder throws/ },
    { name: 'three.js upgraded by the book (legacyMode off, as r152 made the default) on the working tree only', three: t => plant(t, 'Vt={legacyMode:!0,', 'Vt={legacyMode:!1,', 'vendor/three.min.js'), want: /their colours(, [^.]*)? changed/ },   /* and the material's colour as three.js writes it out (color 16777215 → 16711422) */
    { name: 'a capsule the builder learns and no art draws', neu: capsule(4), want: /the harvest holds no capsule/ },
    { name: 'a capsule the builder learns and the art draws, which the base draws as a box', neu: capsule(4), src: drawsCapsule, want: /capsules? the games draw would look different/ },
    { name: 'the capsule\'s cap segments 4 → 6', neu: capsule(6), old: capsule(4), oldLabel: 'an engine with a four-segment capsule', src: drawsCapsule, want: /capsules? the games draw would look different/ },
    { name: 'an old engine whose builder throws on every part', old: e => plant(e, 'let g;\n', 'let g;throw new Error("planted");\n'), oldLabel: 'a broken old engine', want: /a comparison that never ran is not a pass/ },
    { name: 'the boundary comments taken out', neu: e => plant(plant(e, P.BEGIN, 'shape builder start'), P.END, 'shape builder stop'), want: /no boundary around the shape builder/ },
    { name: 'a builder that reaches outside its boundary', neu: e => plant(e, 'const meshGeo={};', 'const meshGeo={};const someWorld=CW();'), want: /failed as it loaded/ },
    { name: 't3BakeParts gone under another name', neu: e => e.split('t3BakeParts').join('t3Bake2'), want: /has no t3BakeParts/ },
    { name: 'the one list of what a part may say taken out of the builder', neu: e => plant(e, 'const PARTKEYS=', 'const PARTKEYS_GONE='), want: /has no one list of what a part may say/ },
    { name: 'the one place a corner\'s two colours are mixed gone under another name', neu: e => e.split('t3CornerMix').join('t3Blend'), want: /has no one place that works out a corner's mix/ },
    { name: 'the one place written twice, the later one the one that runs', neu: e => plant(e, 'function t3CornerMix(', 'function t3CornerMix(top,foot,k,at,out){out[0]=top.r;out[1]=top.g;out[2]=top.b;return out;}\nfunction t3CornerMix('), want: /writes the one place a corner's two colours are mixed twice/ },
    { name: 'a second mix in the bake for cones alone', neu: e => plant(e, 'else{t3CornerMix(c,cb,span>0?(pa[i+1]-lo)/span:1,at,mix);', 'else if(p.s==="cone"){const k=span>0?(pa[i+1]-lo)/span:1;col.push(cb.r+(c.r-cb.r)*k,cb.g+(c.g-cb.g)*k,cb.b+(c.b-cb.b)*k);}else{t3CornerMix(c,cb,span>0?(pa[i+1]-lo)/span:1,at,mix);'), want: /took their colour from somewhere other than the one place that mixes them \(t3CornerMix\), the first at x 2/ },
    { name: 'a second mix in the bake for a thing that stands nowhere (the trolley\'s path)', neu: e => plant(e, 'else{t3CornerMix(c,cb,span>0?(pa[i+1]-lo)/span:1,at,mix);', 'else if(!at){const k=span>0?(pa[i+1]-lo)/span:1;col.push(cb.r+(c.r-cb.r)*k,cb.g+(c.g-cb.g)*k,cb.b+(c.b-cb.b)*k);}else{t3CornerMix(c,cb,span>0?(pa[i+1]-lo)/span:1,at,mix);'), want: /took their colour from somewhere other than the one place that mixes them \(t3CornerMix\), the first standing nowhere/ },
    { name: 'the glass baked without being told where the thing stands', neu: e => plant(plant(e, 'const bake=list=>{const b=t3BakeParts(list,tc,at);', 'const bake=(list,g)=>{const b=t3BakeParts(list,tc,g?null:at);'), 'new THREE.Mesh(bake(byA[a]),gm)', 'new THREE.Mesh(bake(byA[a],1),gm)'), want: /shades the pane of glass the same at x 2 and at x 5/ },
    { name: 'today\'s mix reading the world a thing stands in', neu: e => plant(e, 'out[0]=foot.r+(top.r-foot.r)*k;', 'out[0]=(foot.r+(top.r-foot.r)*k)*(at&&at.world!=="the gate"?0.9:1);'), want: /come out differently at x 2 and in another world/ },
    { name: 'today\'s mix reading the row a thing stands on', neu: e => plant(e, 'out[0]=foot.r+(top.r-foot.r)*k;', 'out[0]=(foot.r+(top.r-foot.r)*k)*(at&&at.y===3?0.9:1);'), want: /come out differently at x 2 and on another row/ },
    { name: 'today\'s mix reading where a thing stands without changing a colour', neu: e => plant(e, 'out[0]=foot.r+(top.r-foot.r)*k;', 'out[0]=foot.r+(top.r-foot.r)*k*(at&&at.world==="a world nobody plays"?0.9:1);'), want: /reads where the thing stands \(`at`, in the body of t3CornerMix\)/ },
    { name: 'the tile\'s mesh built without saying where it stands', neu: e => plant(e, 't3MeshOf(parts,{mesh:true,g:gch,x,y},{world,x,y})', 't3MeshOf(parts,{mesh:true,g:gch,x,y})'), want: /engine\/engine3d\.js:\d+ builds a mesh without saying where the thing stands \(t3MeshOf with 2 arguments/ },
    { name: 'a written part given a second colour (the soil of a planter), and the two colours drawn upside down', neu: e => plant(e, 't3CornerMix(c,cb,', 't3CornerMix(cb,c,'), src: s => plantFile(s, 'content/meridian/art.js', '{s:"cyl",x:0,y:0.006,z:0,r:0.13,h:0.012,c:"#5A4632"}', '{s:"cyl",x:0,y:0.006,z:0,r:0.13,h:0.012,c:"#5A4632",cb:"#2A1E14"}'), want: /cylinders the games draw would look different from the unplanted engine: their colours changed\. The first is content\/meridian\/art\.js:\d+ \{s:"cyl",x:0,y:0\.006,z:0,r:0\.13,h:0\.012,c:"#5A4632",cb:"#2A1E14"\}/ },
    { name: 'the mix worked out in the bake again, beside the one place', neu: e => plant(e, 'else{t3CornerMix(c,cb,span>0?(pa[i+1]-lo)/span:1,at,mix);col.push(mix[0],mix[1],mix[2]);}', 'else{const k=span>0?(pa[i+1]-lo)/span:1;col.push(cb.r+(c.r-cb.r)*k,cb.g+(c.g-cb.g)*k,cb.b+(c.b-cb.b)*k);}'), want: /took their colour from somewhere other than the one place/ },
    { name: 'the bake not telling the one place where the thing stands', neu: e => plant(e, 't3CornerMix(c,cb,span>0?(pa[i+1]-lo)/span:1,at,mix)', 't3CornerMix(c,cb,span>0?(pa[i+1]-lo)/span:1,null,mix)'), want: /shades the same \d+ parts \([^)]*\) the same at x 2 and at x 5/ },
    { name: 'the mesh not handing on where the thing stands', neu: e => plant(e, 't3BakeParts(list,tc,at)', 't3BakeParts(list,tc)'), want: /shades the same \d+ parts \([^)]*\) the same at x 2 and at x 5/ },
    { name: 'today\'s mix reading where the thing stands', neu: e => plant(e, 'out[0]=foot.r+(top.r-foot.r)*k;', 'out[0]=(foot.r+(top.r-foot.r)*k)*(at&&at.x>3?0.9:1);'), want: /today's mix of a part's two colours changes with where the thing stands/ },
    { name: 'the one list left open to change (not frozen)', neu: e => plant(e, 'const PARTKEYS=Object.freeze({', 'const PARTKEYS=({'), want: /is not frozen/ },
    { name: 'the builder reading a key the one list does not name (p.sw)', neu: e => plant(e, 'sc.set(p.sx||1,', 'sc.set(p.sx||p.sw||1,'), want: /reads `sw` off a part, which the one list of what a part may say does not name/ },
    { name: 'the builder reading a key the one list does not name by destructuring (a cylinder\'s seg), which no `p.<key>` shows', neu: e => plant(e, 'else if(s==="cyl")g=new THREE.CylinderGeometry(p.rt!==undefined?p.rt:(p.r||0.1),p.rb!==undefined?p.rb:(p.r||0.1),p.h||0.1,10);', 'else if(s==="cyl"){const {seg}=p;g=new THREE.CylinderGeometry(p.rt!==undefined?p.rt:(p.r||0.1),p.rb!==undefined?p.rb:(p.r||0.1),p.h||0.1,seg||10);}'), want: /reads `seg` off a part, which the one list of what a part may say does not name/ },
    { name: 'the builder reading a key the one list does not name as p?.sw', neu: e => plant(e, 'sc.set(p.sx||1,', 'sc.set(p.sx||p?.sw||1,'), want: /reads `sw` off a part/ },
    { name: 'a colour called a size on the one list (cb)', neu: e => plant(e, 'cb:"colour"', 'cb:"size"'), want: /calls `cb` a size, but the builder does not draw it as one/ },
    { name: 'an arc called a size on the one list', neu: e => plant(e, 'arc:"angle"', 'arc:"size"'), want: /calls `arc` a size, but the builder does not draw it as one: as it goes 0\.2, 0\.4 and 0\.6 a torus's corners do not move evenly/ },
    { name: 'a size called an angle on the one list (t, a torus\'s tube)', neu: e => plant(e, ',t:"size",', ',t:"angle",'), want: /calls `t` an angle, but the builder does not draw it as one/ },
    { name: 'a stretch called a size on the one list (sx)', neu: e => plant(e, 'sx:"stretch"', 'sx:"size"'), want: /calls `sx` a size, but the builder does not draw it as one: going from 1 to 2 it stretches every primitive/ },
    { name: 'a place called a size on the one list (y)', neu: e => plant(e, 'y:"place"', 'y:"size"'), want: /calls `y` a size, but the builder does not draw it as one: as it goes 0\.2, 0\.4 and 0\.6 every corner of a box moves alike/ },
    { name: 'the one list naming a key the builder never reads (q)', neu: e => plant(e, 'a:"glass"});', 'a:"glass",q:"size"});'), want: /names `q`, which the shape builder never reads/ },
    { name: 'a key of a kind no reader of parts knows ("see-through")', neu: e => plant(e, 'a:"glass"});', 'a:"see-through"});'), want: /calls `a` a "see-through", which is none of the kinds/ },
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
  /* the theme stand-in is one-to-one where it matters: every colour the games write, and each one step
     away in one channel, comes out a colour of its own, and none comes out as itself (Beto, #316 recheck) */
  {
    const step = (h, i, d) => { const v = parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16) + d; return v < 0 || v > 255 ? null : h.slice(0, 1 + 2 * i) + v.toString(16).padStart(2, '0') + h.slice(3 + 2 * i); };
    const ins = new Set();
    sources.forEach(x => (x.text.match(/#[0-9a-fA-F]{6}\b/g) || []).forEach(h => { h = h.toLowerCase(); ins.add(h); [0, 1, 2].forEach(i => [-1, 1].forEach(d => { const n = step(h, i, d); if (n) ins.add(n); })); }));
    ins.add('#888888'); ins.add('#898888');
    const outs = new Map(); let fold = null, still = null;
    ins.forEach(h => { const t = P.THEME_TC(h); if (t === h) still = still || h; if (outs.has(t) && !fold) fold = [outs.get(t), h, t]; outs.set(t, h); });
    if (fold || still) { out.push('FAIL — the colour theme the gate hands both builders (parts.js THEME_TC) ' + (fold ? 'sends ' + fold[0] + ' and ' + fold[1] + ' to the same ' + fold[2] : 'leaves ' + still + ' as it is') + ', so a change between them, or one that drops the theme, prints byte for byte.'); bad++; }
    else out.push('ok  the colour theme the gate hands both builders sends each of ' + ins.size + ' colours (every one the games write, and each one step away in one channel) to a colour of its own, never to itself');
  }
  /* which commit CI compares with, every branch, with git stubbed: no network, no clone needed */
  {
    const SHA = 'a'.repeat(40), GONE = 'b'.repeat(40), stub = sha => sha === SHA;
    const planCases = [
      ['a pull request into main', { EVENT: 'pull_request', BASE_REF: 'main' }, p => p.base === 'origin/main'],
      ['a pull request with no BASE_REF', { EVENT: 'pull_request', BASE_REF: '' }, p => p.fail && /BASE_REF is empty/.test(p.fail)],
      ['a pull request whose BASE_REF would be read as an option', { EVENT: 'pull_request', BASE_REF: '--output=x' }, p => p.fail && /not a branch name/.test(p.fail)],
      ['a push whose BEFORE git has', { EVENT: 'push', BEFORE: SHA }, p => p.base === SHA],
      ['a push whose BEFORE git does not have (a force-push)', { EVENT: 'push', BEFORE: GONE }, p => p.none && /not in this clone/.test(p.none)],
      ['a push whose BEFORE is all zeros (the first push)', { EVENT: 'push', BEFORE: '0'.repeat(40) }, p => p.none && /all zeros/.test(p.none)],
      ['a push with no BEFORE', { EVENT: 'push', BEFORE: '' }, p => p.none && /empty/.test(p.none)],
      ['a push whose BEFORE is not a commit', { EVENT: 'push', BEFORE: '-x' }, p => p.fail && /not a commit/.test(p.fail)],
      ['no EVENT at all', { BASE_REF: 'main' }, p => p.fail && /EVENT is empty/.test(p.fail)],
      ['a run by hand (workflow_dispatch)', { EVENT: 'workflow_dispatch' }, p => p.none && /no base of its own/.test(p.none)],
    ];
    for (const [name, env, ok] of planCases) {
      const pl = ciPlan(env, stub), said = pl.base ? 'compare with ' + pl.base : pl.none ? 'nothing to compare: ' + pl.none : 'FAIL: ' + pl.fail;
      if (ok(pl)) out.push('ok  --ci — ' + name + ' → ' + (said.length > 160 ? said.slice(0, 157) + '...' : said));
      else { out.push('FAIL — --ci on ' + name + ' decided: ' + said); bad++; }
    }
  }
  /* CI runs this file: the real ci.yml must pass, and each way of weakening the step must not */
  {
    let yml = null; try { yml = read(CI); } catch (e) { /* said below */ }
    const real = ciRuns(yml);
    if (real.length) { out.push('FAIL — ' + real[0]); bad++; }
    else out.push('ok  green — ' + CI + ' runs the self-test and then --ci in one unconditional step of the smoke job, and nothing else in it');
    const Y = yml || '';
    const drop = (line) => { const ls = Y.split('\n'), kept = ls.filter(l => l.trim() !== line); if (kept.length === ls.length) throw new Error('the line `' + line + '` is not in ' + CI + ', so the plant tests nothing'); return kept.join('\n'); };
    const RUN = '        run: |\n          node test/prims.js --selftest\n          node test/prims.js --ci\n';
    const ciCases = [
      ['`set +e` added at the head of the run block', () => plant(Y, RUN, '        run: |\n          set +e\n          node test/prims.js --selftest\n          node test/prims.js --ci\n', CI), /turns off stopping at the first red \(`set \+e`\)/],
      ['`|| true` after the self-test', () => plant(Y, RUN, '        run: |\n          node test/prims.js --selftest || true\n          node test/prims.js --ci\n', CI), /catches a red with `\|\|`/],
      ['the self-test line deleted', () => drop(SELF_LINE), /must run exactly `node test\/prims\.js --selftest` and then `node test\/prims\.js --ci`/],
      ['the --ci line deleted', () => drop(CI_LINE), /must run exactly .* it runs `node test\/prims\.js --selftest`\./],
      ['the two lines swapped', () => plant(Y, RUN, '        run: |\n          node test/prims.js --ci\n          node test/prims.js --selftest\n', CI), /must run exactly/],
      ['the old shell branch put back, with a one-character slip (pull-request)', () => plant(Y, RUN, '        run: |\n          node test/prims.js --selftest\n          if [ "$EVENT" = "pull-request" ]; then\n            node test/prims.js --ci\n          fi\n', CI), /must run exactly/],
      ['the step made conditional', () => plant(Y, RUN, '        if: false\n' + RUN, CI), /only in a step with an `if:`/],
      ['the step allowed to fail', () => plant(Y, RUN, '        continue-on-error: true\n' + RUN, CI), /`continue-on-error`/],
      ['the step given a shell that does not stop at a red', () => plant(Y, RUN, '        shell: bash {0}\n' + RUN, CI), /names a `shell:` of its own/],
      ['a default shell for the smoke job that does not stop at a red', () => plant(Y, '  smoke:\n', '  smoke:\n    defaults:\n      run:\n        shell: bash {0}\n', CI), /sets a default shell for the smoke job/],
      ['a default shell for the whole workflow that does not stop at a red', () => plant(Y, '\njobs:\n', '\ndefaults:\n  run:\n    shell: bash {0}\njobs:\n', CI), /sets a default shell for the whole workflow/],
      ['EVENT no longer handed to --ci', () => plant(Y, '          EVENT: ${{ github.event_name }}\n          BASE_REF: ${{ github.base_ref }}\n          BEFORE: ${{ github.event.before }}\n        run: |\n          node test/prims.js --selftest', '          EVENT: ${{ github.event_nam }}\n          BASE_REF: ${{ github.base_ref }}\n          BEFORE: ${{ github.event.before }}\n        run: |\n          node test/prims.js --selftest', CI), /no longer hands --ci `EVENT/],
    ];
    for (const [name, mk, want] of ciCases) {
      let f; try { f = ciRuns(mk()); } catch (e) { out.push('FAIL — ' + name + ': ' + e.message); bad++; continue; }
      const hit = f.find(x => want.test(x));
      if (!hit) { out.push('FAIL — planted ' + name + ' in ci.yml and the check ' + (f.length ? 'went red for another reason: ' + f[0] : 'stayed green') + '.'); bad++; }
      else out.push('ok  red — ' + name + ': ' + (hit.length > 200 ? hit.slice(0, 197) + '...' : hit));
    }
  }
  out.forEach(l => console.log(l));
  console.log(bad ? 'FAIL — ' + bad + ' of the gate\'s own cases did not come out as they should.' : 'OK — the shape gate went red for every plant, with its sentence, and green where nothing that changes a drawn byte was planted.');
  return bad ? 1 : 0;
}

if (require.main === module) process.exit(process.argv.includes('--selftest') ? selftest() : main(process.argv.slice(2)));
module.exports = { gate, ciRuns, ciPlan, FLOOR };
