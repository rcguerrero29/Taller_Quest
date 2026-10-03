/* THE SHAPE BUILDER, LOADED FROM A SOURCE TEXT — for tests and mockups, in plain node, no browser.
   (#316, lane L0.) Until this file, every mockup that wanted the engine's part builder cut it out of
   engine/engine3d.js by finding a line that started a certain way and counting on to the next one, and
   the day somebody wrote a comment between two of those lines the cut came back short and nobody was
   told. The builder now stands between two sentinel comments in engine3d.js (grep `shape-builder:begin`)
   and this is the one place that knows how to read them.

   What it gives you:
     cutBuilder(src, label)     → { code, how }   the builder's own lines, for a page that injects them
                                                  (how is "sentinels", or "markers" for an engine older
                                                  than the sentinels: `const meshGeo={}` up to
                                                  `function t3Build`, which is how the first gate cut it)
     pageScript(src, label)     → the same lines as a script a page can inject before it loads (a mockup's
                                  addInitScript): it defines T3, tc and t3Note only if the page has not,
                                  and leaves t3Prim, t3MeshOf, t3BakeParts and meshGeo on window
     loadBuilder(src, label, three)
                                → a factory; each call to .fresh() is a builder with its OWN shape cache:
                                  { t3Prim, t3MeshOf, t3BakeParts, meshGeo, notes, T3, tc }. `three` is
                                  the text of the three.js to build on, the working tree's when left out
     harvest(src, file, keys, kinds)
                                → every literal part written in a pack's art.js or engine/shapes.js
     kindsOf(code)              → the primitives a builder knows, read out of its code (box, and every
                                  s==="…" it tests for)
     partsOf(mesh, T3)          → a built mesh as plain bytes and numbers, ready to compare: its vertices,
                                  and what it is drawn WITH (its material, whether T3.tintables holds it,
                                  its tag), the same for each pane of glass hung on it

   The builder is evaluated against a three.js in a node vm context. It may read THREE, T3.tintables, tc
   and t3Note from outside its boundary and nothing else; anything more and loading it says so in a
   sentence. tc is the player's colour theme (engine/engine.js, grep `const tc=`), and here it is THEME_TC:
   the engine's own mix toward one fixed accent, the same on both sides, so a change that drops the theme
   from a mesh changes its colours and is seen (the default theme's tc is the identity, and an identity
   here would hide exactly that). The time-of-day wash is not tc: it is applied later to the materials in
   T3.tintables, and partsOf reads whether each material is there. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');

const BEGIN = 'shape-builder:begin', END = 'shape-builder:end';

/* ---- the cut ---- */
function count(src, s) { let n = 0, i = -1; while ((i = src.indexOf(s, i + 1)) >= 0) n++; return n; }
function cutBuilder(src, label) {
  label = label || 'the engine';
  if (typeof src !== 'string' || !src.length) throw new Error(label + ' is empty, so there is no shape builder in it to load.');
  const nb = count(src, BEGIN), ne = count(src, END);
  if (nb || ne) {
    if (nb !== 1 || ne !== 1) throw new Error(label + ' marks the shape builder\'s boundary ' + nb + ' time(s) at the start and ' + ne + ' at the end; it must be once each, or nobody can say which lines are the builder.');
    const b = src.indexOf(BEGIN), close = src.indexOf('*/', b), e = src.indexOf(END);
    const open = src.lastIndexOf('/*', e);
    if (close < 0 || open < 0 || !(close < open)) throw new Error(label + ' has the shape builder\'s end mark before its start mark, or a mark outside a comment.');
    return { code: src.slice(close + 2, open), how: 'sentinels' };
  }
  /* an engine from before the sentinels (origin/main until this lands): Beto's cut */
  const lines = src.split('\n');
  const a = lines.findIndex(l => l.startsWith('const meshGeo={}'));
  const z = lines.findIndex((l, i) => i > a && l.startsWith('function t3Build('));
  if (a < 0 || z < 0) throw new Error(label + ' has neither the shape builder\'s boundary comments nor the lines an older engine started and ended it with (`const meshGeo={}` … `function t3Build`), so the builder cannot be found in it.');
  return { code: lines.slice(a, z).join('\n'), how: 'markers' };
}

function pageScript(src, label) {
  const { code } = cutBuilder(src, label);
  return 'var T3=window.T3||{tintables:[]},tc=window.tc||(h=>h),t3Note=window.t3Note||(()=>{});\n' + code +
    '\n;window.t3Prim=t3Prim;window.t3MeshOf=t3MeshOf;window.meshGeo=meshGeo;' +
    'window.t3BakeParts=typeof t3BakeParts==="function"?t3BakeParts:undefined;\n';
}

/* ---- three.js, once per text per process: 608 KB of minified code is evaluated one time for each
   different three.js asked for (the working tree's, and the base's when a change upgrades it) ---- */
const CTX = new Map();
const threeText = () => fs.readFileSync(path.join(ROOT, 'vendor', 'three.min.js'), 'utf8');
function threeContext(text, label) {
  text = text || threeText(); label = label || 'vendor/three.min.js';
  const id = require('crypto').createHash('sha256').update(text).digest('hex');
  if (CTX.has(id)) return CTX.get(id);
  const ctx = vm.createContext({ console });
  vm.runInContext(text, ctx, { filename: label });
  if (!ctx.THREE || typeof ctx.THREE.BoxGeometry !== 'function') throw new Error(label + ' loaded and did not define THREE, so no shape can be built in node.');
  CTX.set(id, ctx);
  return ctx;
}

/* ---- the colour theme a builder is handed: engine/engine.js's mixHex toward an accent, at the 0.16 a
   light theme mixes at (grep `const tc=` there). The accent is forest's; any fixed one would do, as long
   as it is not a channel swap or anything else that leaves #888888 grey, the colour most parts draw in. */
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = r => '#' + r.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mixHex = (h, t2, amt) => { const tr = hex2rgb(t2); return rgb2hex(hex2rgb(h).map((v, i) => v + (tr[i] - v) * amt)); };
const THEME_ACCENT = '#2E7D4F';
const THEME_TC = h => mixHex(h, THEME_ACCENT, 0.16);

/* ---- the load ---- */
function loadBuilder(src, label, three, threeLabel) {
  label = label || 'the engine';
  const { code, how } = cutBuilder(src, label);
  const ctx = threeContext(three, threeLabel);
  const wrap = '(function(T3,tc,t3Note){\n' + code + '\n;return {' +
    'meshGeo:typeof meshGeo!=="undefined"?meshGeo:undefined,' +
    't3Prim:typeof t3Prim==="function"?t3Prim:undefined,' +
    't3MeshOf:typeof t3MeshOf==="function"?t3MeshOf:undefined,' +
    't3BakeParts:typeof t3BakeParts==="function"?t3BakeParts:undefined};})';
  let factory;
  try { factory = vm.runInContext(wrap, ctx, { filename: label + ' (shape builder)' }); }
  catch (e) { throw new Error('the shape builder cut from ' + label + ' is not code that runs: ' + String(e.message || e).slice(0, 160)); }
  const fresh = () => {
    const notes = [], T3 = { tintables: [] };
    let b;
    try { b = factory(T3, THEME_TC, (where, e) => notes.push(where + ': ' + String((e && e.message) || e))); }
    catch (e) { throw new Error('the shape builder from ' + label + ' failed as it loaded: ' + String(e.message || e).slice(0, 160) + ' — it may only read THREE, T3, tc and t3Note from outside its boundary.'); }
    if (!b.t3MeshOf) throw new Error('the shape builder from ' + label + ' has no t3MeshOf, so nothing can ask it for a shape.');
    return Object.assign(b, { notes, T3, tc: THEME_TC });
  };
  return { how, code, fresh };
}

/* ---- a built mesh as plain bytes, and what it is drawn with ----
   An attribute the mesh does not carry is null, not a throw: a mesh with no normals is the builder's
   doing, and the sentence says so instead of blaming the builder for an error this file raised. */
const bytes = a => Buffer.from(new Uint8Array(a.buffer, a.byteOffset, a.byteLength));
const MATERIAL_FIELDS = ['type', 'vertexColors', 'transparent', 'opacity', 'depthWrite'];
function partsOf(m, T3) {
  const attr = (g, k) => g && g.attributes && g.attributes[k] && g.attributes[k].array ? bytes(g.attributes[k].array) : null;
  const geo = g => ({
    position: attr(g, 'position'), normal: attr(g, 'normal'), color: attr(g, 'color'),
    count: g && g.attributes && g.attributes.position ? g.attributes.position.count : null,
  });
  /* the material as the fields that decide how it draws, and whether the time-of-day wash reaches it */
  const drawn = mat => {
    if (!mat) return null;
    const o = {}; MATERIAL_FIELDS.forEach(k => { o[k] = mat[k]; });
    o.tinted = !!(T3 && T3.tintables && T3.tintables.includes(mat));
    return o;
  };
  const tag = u => { try { return JSON.stringify(u); } catch (e) { return 'a tag that cannot be written out: ' + e.message; } };
  return {
    main: geo(m.geometry), top: m.t3Top, span: m.t3Span === null || m.t3Span === undefined ? null : Array.from(m.t3Span),
    material: drawn(m.material), tag: tag(m.userData),
    glass: m.children.map(k => ({ ...geo(k.geometry), material: drawn(k.material), tag: tag(k.userData),
      opacity: k.material && k.material.opacity, a: k.userData && k.userData.a })),
  };
}

/* ---- the harvest: every part written out as an object literal ----
   A part is an object literal whose keys are all part keys and which says what it is: an `s:` naming a
   primitive, or a box's size. A value the file computes (a variable, a call, `i*0.2`) is not literal.
   Size fields (the cache key) must be literal or the part escapes the harvest and is counted as escaped;
   a computed place or colour is left at the builder's default, because the shape is still the shape. */
const SHAPES = ['box', 'cyl', 'sph', 'cone', 'torus'];   /* today's; the gate reads its list out of the builder with kindsOf */
const kindsOf = code => [...new Set(['box', ...[...String(code).matchAll(/\bs\s*===\s*"(\w+)"/g)].map(m => m[1])])];
const PART_KEYS = ['s', 'x', 'y', 'z', 'w', 'h', 'd', 'r', 'rt', 'rb', 't', 'arc', 'rx', 'ry', 'rz', 'sx', 'sy', 'sz', 'c', 'a'];
const SIZE_KEYS = ['s', 'w', 'h', 'd', 'r', 'rt', 'rb', 't', 'arc'];
/* where it stands, how it turns, what colour and how see-through: the shape is the same shape without them */
const PLACE_KEYS = ['x', 'y', 'z', 'rx', 'ry', 'rz', 'sx', 'sy', 'sz', 'c', 'a'];

/* braces in code only: strings, template literals, comments and regular expressions are stepped over */
function objectSpans(src) {
  const spans = [], stack = [];
  let i = 0, prev = '';   /* prev: the last significant character, to tell a regex from a division */
  const KW = /(?:^|[^\w$])(return|typeof|case|in|of|void|delete|new|else|do|throw|yield|await)$/;
  const skipString = q => { i++; while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; } i++; };
  const skipTemplate = () => {
    i++;
    while (i < src.length && src[i] !== '`') {
      if (src[i] === '\\') { i += 2; continue; }
      if (src[i] === '$' && src[i + 1] === '{') {
        i += 2; let depth = 1;
        while (i < src.length && depth) {
          const ch = src[i];
          if (ch === '"' || ch === "'") { skipString(ch); continue; }
          if (ch === '`') { skipTemplate(); continue; }
          if (ch === '{') depth++; else if (ch === '}') depth--;
          i++;
        }
        continue;
      }
      i++;
    }
    i++;
  };
  while (i < src.length) {
    const ch = src[i], nx = src[i + 1];
    if (ch === '/' && nx === '/') { const e = src.indexOf('\n', i); i = e < 0 ? src.length : e; continue; }
    if (ch === '/' && nx === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue; }
    if (ch === '"' || ch === "'") { skipString(ch); prev = 'a'; continue; }
    if (ch === '`') { skipTemplate(); prev = 'a'; continue; }
    if (ch === '/') {
      const before = src.slice(Math.max(0, i - 12), i).replace(/\s+$/, '');
      if (!prev || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || KW.test(before)) {   /* a regular expression */
        i++; let cls = false;
        while (i < src.length && (cls || src[i] !== '/')) { if (src[i] === '\\') i++; else if (src[i] === '[') cls = true; else if (src[i] === ']') cls = false; i++; }
        i++; while (/[a-z]/i.test(src[i] || '')) i++;
        prev = 'a'; continue;
      }
    }
    if (ch === '{') stack.push(i);
    else if (ch === '}') { const s = stack.pop(); if (s !== undefined) spans.push([s, i]); }
    if (!/\s/.test(ch)) prev = ch;
    i++;
  }
  return spans;
}

/* split an object literal's inside at its top-level commas, leaving out comments written between fields */
function segments(inner) {
  const out = []; let depth = 0, cur = '', q = null;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (q) { cur += ch; if (ch === '\\') { cur += inner[++i] || ''; continue; } if (ch === q) q = null; continue; }
    if (ch === '/' && inner[i + 1] === '*') { const e = inner.indexOf('*/', i + 2); i = e < 0 ? inner.length : e + 1; cur += ' '; continue; }
    if (ch === '/' && inner[i + 1] === '/') { const e = inner.indexOf('\n', i); i = e < 0 ? inner.length : e; cur += ' '; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { q = ch; cur += ch; continue; }
    if ('([{'.includes(ch)) depth++; else if (')]}'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

/* a constant: a quoted string, or arithmetic over number literals and Math.PI. Checked by pattern
   BEFORE anything is evaluated, so no text from a file is ever run as code. */
function constant(text) {
  const t = text.trim();
  let m;
  if ((m = /^"([^"\\]*)"$/.exec(t)) || (m = /^'([^'\\]*)'$/.exec(t))) return { ok: true, v: m[1] };
  const ar = t.replace(/Math\.PI/g, '(3.141592653589793)');
  /* every number literal stands for 0 in this test, and what is left must be operators and brackets */
  if (!/\d/.test(ar) || !/^[0+\-*/()\s]+$/.test(ar.replace(/(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi, '0'))) return { ok: false };
  let v; try { v = Function('"use strict";return (' + ar + ');')(); } catch (e) { return { ok: false }; }
  return typeof v === 'number' && Number.isFinite(v) ? { ok: true, v } : { ok: false };
}

function lineFinder(src) {
  const starts = [0]; for (let i = 0; i < src.length; i++) if (src.charCodeAt(i) === 10) starts.push(i + 1);
  return at => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= at) lo = mid; else hi = mid - 1; } return lo + 1; };
}

/* keys: the part keys to accept, PART_KEYS unless the caller read more out of the builder (a key added
   tomorrow, like arc0, is then harvested too). Any key that is not a place is treated as a size.
   kinds: the primitives a part may name, SHAPES unless the caller read them out of the builder (kindsOf),
   so a primitive the builder learns tomorrow is harvested too instead of dropping out without a word. */
function harvest(src, file, keys, kinds) {
  keys = keys || PART_KEYS; kinds = kinds || SHAPES;
  const parts = [], escaped = [], lineOf = lineFinder(src);
  for (const [a, z] of objectSpans(src)) {
    const inner = src.slice(a + 1, z);
    if (!inner.trim() || inner.length > 600) continue;
    const segs = segments(inner).map(s => s.trim()).filter(Boolean);
    const fields = []; let shapeLike = true;
    for (const s of segs) {
      const kv = /^([A-Za-z_$][\w$]*)\s*:\s*([\s\S]+)$/.exec(s);
      if (kv) { fields.push([kv[1], kv[2]]); continue; }
      const short = /^([A-Za-z_$][\w$]*)$/.exec(s);
      if (short) { fields.push([short[1], short[1]]); continue; }
      shapeLike = false; break;   /* a spread, a method, a statement: not a part written out */
    }
    if (!shapeLike || !fields.length) continue;
    const names = fields.map(f => f[0]);
    if (new Set(names).size !== names.length) continue;
    const sField = fields.find(f => f[0] === 's'), sVal = sField && constant(sField[1]);
    const named = sVal && sVal.ok && kinds.includes(sVal.v);
    /* a key the builder never reads (a marker like petal:true) changes nothing it builds: a part that names
       its shape keeps the rest and drops it; anything else carrying a stranger key is not a part */
    if (!names.every(k => keys.includes(k)) && !named) continue;
    for (let i = fields.length - 1; i >= 0; i--) if (!keys.includes(fields[i][0])) fields.splice(i, 1);
    const boxy = !sField && ['w', 'h', 'd'].every(k => names.includes(k));   /* not `size:{w:3,h:2}`, which is a footprint */
    const where = { file, line: lineOf(a), text: src.slice(a, z + 1).replace(/\s+/g, ' ') };
    if (sField && !(sVal && sVal.ok)) { escaped.push({ ...where, why: 'its s is computed' }); continue; }
    if (!named && !boxy) continue;   /* it does not say what it is */
    const part = {}, computed = [];
    for (const [k, v] of fields) {
      const c = constant(v);
      if (c.ok && (k === 's' || k === 'c' ? typeof c.v === 'string' : typeof c.v === 'number')) part[k] = c.v;
      else computed.push(k);
    }
    const sizeComputed = computed.filter(k => !PLACE_KEYS.includes(k));
    if (sizeComputed.length) { escaped.push({ ...where, why: 'its ' + sizeComputed.join(', ') + ' ' + (sizeComputed.length > 1 ? 'are' : 'is') + ' computed' }); continue; }
    parts.push({ ...where, part, computed });
  }
  return { parts, escaped };
}

/* the files the games draw parts from: the engine's shape library and every pack's art */
function shapeSources(root) {
  root = root || ROOT;
  const out = ['engine/shapes.js'];
  const content = path.join(root, 'content');
  if (fs.existsSync(content)) fs.readdirSync(content, { withFileTypes: true })
    .filter(d => d.isDirectory() && fs.existsSync(path.join(content, d.name, 'art.js')))
    .map(d => 'content/' + d.name + '/art.js').sort().forEach(f => out.push(f));
  return out;
}

module.exports = { BEGIN, END, cutBuilder, pageScript, loadBuilder, partsOf, harvest, kindsOf, objectSpans, constant, shapeSources, threeText, THEME_TC, MATERIAL_FIELDS, SHAPES, PART_KEYS, SIZE_KEYS, PLACE_KEYS, ROOT };
