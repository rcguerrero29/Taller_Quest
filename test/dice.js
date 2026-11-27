#!/usr/bin/env node
/* THE GAME'S OWN DICE, CHECKED (grep "THE GAME'S OWN DICE" in engine/dice.js for the owner's four rules).
   Plain node: the dice are loaded from the file itself into a fresh context, with no browser.

     node test/dice.js              read this repository
     node test/dice.js --selftest   its own red cases: each planted, one at a time, in a copy held in memory, and each red;
                                    then the real tree, green

   What it asks:
   A  the dice load, every line in the list rolls, and a line that is not in the list is refused
   B  one starting number gives each line the same rolls every time (a run can be played again)
   C  EACH LINE APART: rolling one line any number of times leaves every other line's rolls as they were,
      and a line counts its own rolls and nobody else's
   D  two starting numbers give different rolls, and two lines from one starting number are not the same rolls
   E  a roll is a number from 0 up to, not including, 1, spread evenly (ten bands, each within 3% of a tenth over
      200,000 rolls), as the browser's own number was, so a system moved onto its line plays the same
   F  EVEN SWEEPS KEPT: a line given a check's own numbers rolls exactly those and the other lines do not move;
      taking it off puts the line back on its own rolls; a number outside 0 to 1 is refused; a new starting number
      takes every stub off
   G  a starting number that is not a whole number from 0 to 4294967295 is refused
   H  IN PLAY THE STARTING NUMBER IS NEW EACH TIME: two loads give two different starting numbers, and the dice read
      nothing a player can set (the page's address, its storage, its cookies)
   I  ONLY CHECKS MAY SET IT: no file outside test/ calls `reseed` or `stub`
   J  every roll names its line as a plain name from the list, so a typo cannot open a line of its own
   K  THE OLD ROLLS ARE COUNTED: the game's own files still ask the browser for a number OLDROLLS times and the checks
      replace the browser's number STUBS times. Each count may only go down, and when one does, its number here goes
      down with it in the same change, so the count is always the truth. The dice file itself asks twice: its fallback
      when the browser has no strong source, and the bridge (M) while it stands; once the bridge is out, once
   L  the dice load in every world, before the engine, and the game offline has them
   M  THE BRIDGE: while the checks still replace the browser's number (STUBS above 0), a line with no stub follows a
      replaced number, a line with a stub rolls its stub, and with the browser's own number every line rolls its own; once
      STUBS is 0, the bridge is gone from the dice */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const OLDROLLS = 0, STUBS = 194;

/* the tree this check reads: every file git tracks under the folders it asks about, as text */
function tree() {
  const out = {};
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  files.filter(f => /\.(js|html)$/.test(f)).forEach(f => { try { out[f] = fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { /* a file git lists and the disk does not have is no part of the game */ } });
  return out;
}
/* the dice loaded from a file's text into a context of their own. `crypto` is the context's own unless given. */
function load(src, opts) {
  const o = opts || {}, ctx = { module: { exports: {} }, Math: Object.create(Math), Uint32Array, Error, Object, Number, String };
  if (o.crypto !== null) ctx.crypto = o.crypto || require('crypto').webcrypto;
  if (o.location) ctx.location = o.location;
  load.last = ctx.Math; vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename: 'engine/dice.js' });
  return ctx.module.exports;
}
/* a file's code without its comments: a comment that says how a roll used to be written is not a roll */
const bare = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
const rolls = (D, name, n) => Array.from({ length: n }, () => D.roll(name));
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

function check(T) {
  const red = [], say = (k, s) => red.push(k + '  ' + s);
  /* the two counts as this tree writes them, so a planted copy of this file is read as it stands */
  const mine = T['test/dice.js'] || '', num = k => { const m = mine.match(new RegExp('\\b' + k + ' = (\\d+)')); return m ? +m[1] : NaN; };
  const OLDROLLS = num('OLDROLLS'), STUBS = num('STUBS');
  if (!Number.isInteger(OLDROLLS) || !Number.isInteger(STUBS)) { say('K', 'test/dice.js gives no OLDROLLS or STUBS to count against'); return red; }
  const src = T['engine/dice.js'];
  if (typeof src !== 'string') { say('A', 'engine/dice.js is not in the repository, so the game has no dice of its own'); return red; }
  let M;
  try { M = load(src); } catch (e) { say('A', 'engine/dice.js does not load (' + e.message + ')'); return red; }
  const D = M && M.DICE, LINES = M && M.DICELINES;
  if (!D || !Array.isArray(LINES) || !LINES.length) { say('A', 'engine/dice.js gives no DICE and no list of lines'); return red; }
  /* A */
  LINES.forEach(n => { try { const v = D.roll(n); if (typeof v !== 'number') say('A', 'the line ' + n + ' rolled ' + v + ', not a number'); } catch (e) { say('A', 'the line ' + n + ' does not roll (' + e.message + ')'); } });
  let threw = false; try { D.roll('no-such-line'); } catch (e) { threw = true; }
  if (!threw) say('A', 'a roll on a line that is not in the list was given a number instead of being refused');
  if (!Object.isFrozen(D)) say('A', 'the dice can be changed by anything on the page (DICE is not frozen)');
  /* B */
  const a = LINES[0], b = LINES[1] || LINES[0];
  D.reseed(12345); const b1 = rolls(D, a, 50); D.reseed(12345); const b2 = rolls(D, a, 50);
  if (!same(b1, b2)) say('B', 'the same starting number gave the line ' + a + ' different rolls the second time');
  /* C */
  D.reseed(777); const c1 = rolls(D, b, 40);
  D.reseed(777); rolls(D, a, 1000); const c2 = rolls(D, b, 40);
  if (!same(c1, c2)) say('C', 'a thousand rolls on the line ' + a + ' changed the rolls on the line ' + b);
  D.reseed(777); rolls(D, a, 7); rolls(D, b, 3);
  if (D.count(a) !== 7 || D.count(b) !== 3) say('C', 'after 7 rolls on ' + a + ' and 3 on ' + b + ' the lines count ' + D.count(a) + ' and ' + D.count(b));
  /* D */
  D.reseed(1); const d1 = rolls(D, a, 20); D.reseed(2); const d2 = rolls(D, a, 20);
  if (same(d1, d2)) say('D', 'the starting numbers 1 and 2 gave the line ' + a + ' the same rolls');
  for (let i = 0; i < LINES.length; i++) for (let j = i + 1; j < LINES.length; j++) {
    D.reseed(99); const x = rolls(D, LINES[i], 20); D.reseed(99); const y = rolls(D, LINES[j], 20);
    if (same(x, y)) say('D', 'the lines ' + LINES[i] + ' and ' + LINES[j] + ' roll the same numbers from one starting number');
  }
  /* E */
  D.reseed(4242); const N = 200000, band = new Array(10).fill(0); let out = 0;
  for (let i = 0; i < N; i++) { const v = D.roll(a); if (!(v >= 0 && v < 1)) out++; else band[Math.floor(v * 10)]++; }
  if (out) say('E', out + ' of ' + N + ' rolls were not a number from 0 up to 1');
  /* a roll of exactly 1 comes once in four billion rolls, too seldom to find by rolling: the division that keeps every roll
     under 1 is read instead (the state's largest value, 4294967295, divided by 4294967296) */
  const nx = (src.match(/function next\(L\)\{[\s\S]*?\/(\d+);\}/) || [])[1];
  if (nx !== '4294967296') say('E', 'a roll is not divided by 4294967296 (it is divided by ' + (nx || 'nothing found') + '), so its largest value is not under 1');
  band.forEach((c, i) => { if (Math.abs(c / N - 0.1) > 0.003) say('E', 'the band ' + i / 10 + ' to ' + (i + 1) / 10 + ' held ' + (100 * c / N).toFixed(2) + '% of the rolls, where a tenth is 10%'); });
  /* F */
  D.reseed(5); const f0 = rolls(D, b, 10);
  D.reseed(5); let k = 0; const sweep = Array.from({ length: 10 }, (_, i) => (i + 0.5) / 10);
  D.stub(a, () => sweep[k++ % sweep.length]);
  const f1 = rolls(D, a, 10), f2 = rolls(D, b, 10);
  if (!same(f1, sweep)) say('F', 'a line given an even sweep did not roll exactly those numbers');
  if (!same(f2, f0)) say('F', 'a sweep on the line ' + a + ' moved the line ' + b);
  D.stub(a, null); D.reseed(5); const f3 = rolls(D, a, 5); D.reseed(5); D.stub(a, () => 0.5); D.stub(a, null); const f4 = rolls(D, a, 5);
  if (!same(f3, f4)) say('F', 'a line taken off its sweep did not go back to its own rolls');
  D.reseed(5); const f5 = rolls(D, a, 5); D.reseed(5); D.stub(a, () => 0.5); rolls(D, a, 10); D.stub(a, null); const f6 = rolls(D, a, 5);
  if (!same(f5, f6)) say('F', 'ten rolls of a sweep moved the line ' + a + ' under it, so the line did not go on from where it was');
  let bad = false; D.stub(a, () => 1); try { D.roll(a); } catch (e) { bad = true; }
  if (!bad) say('F', 'a sweep that gave 1 (outside 0 up to 1) was rolled instead of refused');
  D.stub(a, () => 0.25); D.reseed(5); if (D.roll(a) === 0.25) say('F', 'a new starting number left a sweep on the line ' + a);
  /* G */
  [-1, 1.5, 4294967296, NaN, '7', null].forEach(n => { let t = false; try { D.reseed(n); } catch (e) { t = true; } if (!t) say('G', 'the starting number ' + String(n) + ' was taken'); });
  /* H */
  try { const s1 = load(src).DICE.start, s2 = load(src).DICE.start; if (s1 === s2) say('H', 'two loads began from the same starting number (' + s1 + ')'); } catch (e) { say('H', 'the dice did not load twice (' + e.message + ')'); }
  try { const p = load(src, { crypto: null }).DICE; p.roll(a); } catch (e) { say('H', 'with no strong source the dice did not load (' + e.message + ')'); }
  try { const s1 = load(src, { location: { search: '?seed=1', hash: '#seed=1' } }).DICE.start, s2 = load(src, { location: { search: '?seed=1', hash: '#seed=1' } }).DICE.start; if (s1 === s2) say('H', 'two loads with the same address began from the same starting number'); } catch (e) { say('H', 'the dice did not load with an address (' + e.message + ')'); }
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  ['location', 'localStorage', 'sessionStorage', 'cookie', 'URLSearchParams', 'indexedDB', 'fetch', 'XMLHttpRequest', 'postMessage'].forEach(w => {
    if (new RegExp('\\b' + w + '\\b').test(code)) say('H', 'engine/dice.js names ' + w + ', and the dice read nothing a player can set');
  });
  /* M */
  try {
    const Dm = load(src).DICE, mathOf = load.last, own = mathOf.random;
    Dm.reseed(31); const m0 = rolls(Dm, a, 3);
    mathOf.random = () => 0.125; const m1 = rolls(Dm, a, 3); Dm.stub(b, () => 0.75); const m2 = Dm.roll(b); Dm.stub(b, null);
    mathOf.random = own; Dm.reseed(31); const m3 = rolls(Dm, a, 3);
    const bridged = m1.every(v => v === 0.125);
    if (STUBS > 0 && !bridged) say('M', 'with the browser\'s number replaced, the line ' + a + ' rolled ' + m1.join(', ') + ', not the replaced number: the ' + STUBS + ' checks that still replace it steer nothing');
    if (STUBS === 0 && bridged) say('M', 'no check replaces the browser\'s number any more, and the dice still follow a replaced one: take the bridge out');
    if (m2 !== 0.75) say('M', 'a line with a stub rolled ' + m2 + ' while the browser\'s number was replaced, not its stub');
    if (!same(m0, m3)) say('M', 'with the browser\'s own number, the line ' + a + ' did not roll its own rolls');
  } catch (e) { say('M', 'the bridge could not be asked (' + e.message + ')'); }
  /* I, J, K */
  const game = Object.keys(T).filter(f => !/^test\//.test(f));
  let old = 0, stubs = 0, inDice = 0;
  game.forEach(f => {
    const t = T[f], lines = t.split('\n');
    lines.forEach((l, i) => {
      if (/\bDICE\s*\.\s*(reseed|stub)\s*\(/.test(l) && f !== 'engine/dice.js') say('I', f + ':' + (i + 1) + ' sets the dice, and only a check may');
      const re = /\bDICE\s*\.\s*(roll|below|pick|count)\s*\(\s*([^,)]*)/g; let m;
      while ((m = re.exec(l))) { const arg = m[2].trim(), lit = arg.match(/^(["'])([^"']*)\1$/);
        if (!lit) say('J', f + ':' + (i + 1) + ' rolls on a line named by ' + (arg || 'nothing') + ', not a plain name from the list');
        else if (!LINES.includes(lit[2])) say('J', f + ':' + (i + 1) + ' rolls on the line "' + lit[2] + '", which is not in the list'); }
    });
    if (/^(engine|content)\//.test(f)) { const n = (bare(t).match(/Math\.random\s*\(/g) || []).length; if (f === 'engine/dice.js') inDice = n; else old += n; }
  });
  Object.keys(T).filter(f => /^test\/.*\.js$/.test(f) && f !== 'test/dice.js').forEach(f => { stubs += (bare(T[f]).match(/Math\.random\s*=(?!=)/g) || []).length; });
  const want = STUBS > 0 ? 2 : 1;   /* its fallback, and the bridge while it stands */
  if (inDice !== want) say('K', 'engine/dice.js asks the browser for a number ' + inDice + ' times, where its fallback' + (STUBS > 0 ? ' and the bridge are twice' : ' is once'));
  if (old > OLDROLLS) say('K', 'the game asks the browser for a number ' + old + ' times, more than the ' + OLDROLLS + ' counted: a new roll goes on a line of the dice');
  if (old < OLDROLLS) say('K', 'the game asks the browser for a number ' + old + ' times now, fewer than the ' + OLDROLLS + ' counted: lower OLDROLLS in test/dice.js to ' + old + ' in this change');
  if (stubs > STUBS) say('K', 'the checks replace the browser\'s number ' + stubs + ' times, more than the ' + STUBS + ' counted: a new check sets a line of the dice instead');
  if (stubs < STUBS) say('K', 'the checks replace the browser\'s number ' + stubs + ' times now, fewer than the ' + STUBS + ' counted: lower STUBS in test/dice.js to ' + stubs + ' in this change');
  /* L */
  const boot = T['engine/boot.js'] || '', at = s => boot.indexOf('w("engine/' + s + '")');
  if (!(at('dice.js') >= 0 && at('engine.js') > at('dice.js'))) say('L', 'engine/boot.js does not load engine/dice.js before engine.js, so the engine would roll on dice that are not there');
  const pre = boot.slice(0, Math.max(0, at('dice.js'))), opened = (pre.match(/\{/g) || []).length - (pre.match(/\}/g) || []).length;
  if (at('dice.js') >= 0 && opened !== 1) say('L', 'engine/boot.js loads engine/dice.js inside a condition, and every world rolls');
  const sw = T['sw.js'] || ''; if (!sw.includes('"./engine/dice.js"')) say('L', 'the service worker does not keep engine/dice.js, so the game offline would have no dice');
  return red;
}

/* ---- the red cases: each planted in a copy held in memory ---- */
const PLANTS = [
  ['A', 'an unknown line given a number', 'engine/dice.js', 'if(!L)throw new Error("DICE: no line named "+String(name)+" (the lines are named in DICELINES)");return L;', 'return L||lines.world;'],
  ['A', 'the dice left open to change', 'engine/dice.js', 'return Object.freeze({', 'return ({'],
  ['B', 'a starting number that does not start the lines again', 'engine/dice.js', 'start=n>>>0;reset();},', 'start=n>>>0;},'],
  ['C', 'one state shared by every line', 'engine/dice.js', 'function reset(){DICELINES.forEach(n=>{lines[n]={s:mix(start,n),n:0,stub:null};});}', 'function reset(){const one={s:mix(start,""),n:0,stub:null};DICELINES.forEach(n=>{lines[n]=one;});}'],
  ['C', 'a roll not counted', 'engine/dice.js', 'function roll(name){const L=line(name);L.n++;', 'function roll(name){const L=line(name);'],
  ['D', 'the line\'s name left out of its start', 'engine/dice.js', 'for(let i=0;i<name.length;i++){h^=name.charCodeAt(i);h=Math.imul(h,0x01000193);}', ''],
  ['D', 'the starting number left out', 'engine/dice.js', 'let h=0x811c9dc5^(start>>>0);', 'let h=0x811c9dc5;'],
  ['E', 'a roll not brought under 1', 'engine/dice.js', 'return ((t^(t>>>14))>>>0)/4294967296;}', 'return ((t^(t>>>14))>>>0)/4294967295;}'],
  ['E', 'rolls bunched at the bottom', 'engine/dice.js', 'return ((t^(t>>>14))>>>0)/4294967296;}', 'const u=((t^(t>>>14))>>>0)/4294967296;return u*u;}'],
  ['F', 'a sweep not taken off by a new starting number', 'engine/dice.js', 'lines[n]={s:mix(start,n),n:0,stub:null};', 'lines[n]={s:mix(start,n),n:0,stub:lines[n]?lines[n].stub:null};'],
  ['F', 'a sweep\'s number not checked', 'engine/dice.js', 'if(!(v>=0&&v<1))throw new Error("DICE: the stub on "+name+" gave "+v+", not a number from 0 up to 1");', ''],
  ['F', 'a sweep that moves the line under it', 'engine/dice.js', 'if(L.stub){const v=+L.stub();', 'if(L.stub){next(lines.' + 'dog);const v=+L.stub();'],
  ['G', 'any starting number taken', 'engine/dice.js', 'if(!(Number.isInteger(n)&&n>=0&&n<=4294967295))throw new Error("DICE: a starting number is a whole number from 0 to 4294967295");', ''],
  ['H', 'the same start every load', 'engine/dice.js', 'let start=fresh();', 'let start=1;'],
  ['H', 'a start read from the address', 'engine/dice.js', 'let start=fresh();', 'let start=(typeof location==="object"&&/seed=(\\d+)/.test(location.search))?+RegExp.$1:fresh();'],
  ['I', 'the game setting its own dice', 'engine/engine.js', 'const SK=k=>', 'DICE.reseed(1);const SK=k=>'],
  ['I', 'a world sweeping a line', 'content/meridian/config.js', '\n', '\nDICE.stub("dog",()=>0.5);\n'],
  ['J', 'a line misspelt', 'engine/engine.js', 'const SK=k=>', 'const dgo=()=>DICE.roll("dgo");const SK=k=>'],
  ['J', 'a line worked out', 'engine/engine.js', 'const SK=k=>', 'const any=n=>DICE.pick(n,[1,2]);const SK=k=>'],
  ['K', 'a new old-style roll', 'engine/engine.js', 'const SK=k=>', 'const coin=()=>Math.random()<0.5;const SK=k=>'],
  ['K', 'the count left high after an old roll went', 'test/dice.js', /OLDROLLS = \d+/, 'OLDROLLS = 1'],
  ['K', 'a new check replacing the browser\'s number', 'test/smoke.js', null, s => s + '\nMath.random = () => 0.5;\n'],
  ['K', 'a second old roll in the dice file', 'engine/dice.js', 'let start=fresh();', 'let start=fresh();Math.random();'],
  ['M', 'no bridge while the checks still replace the number', 'engine/dice.js', 'if(!L.stub&&Math.random!==NATIVE)return Math.random();', ''],
  ['M', 'a bridge over a stub', 'engine/dice.js', 'if(!L.stub&&Math.random!==NATIVE)return Math.random();', 'if(Math.random!==NATIVE)return Math.random();'],
  ['M', 'a bridge that is always on', 'engine/dice.js', 'if(!L.stub&&Math.random!==NATIVE)return Math.random();', 'if(!L.stub)return Math.random();'],
  ['M', 'the bridge left in after the last check moved', 'test/dice.js', /STUBS = \d+;/, 'STUBS = 0;'],
  ['L', 'the dice loaded after the engine', 'engine/boot.js', null, s => s.replace('  w("engine/dice.js");\n', '').replace('  w("engine/kitchen-room.js");', '  w("engine/dice.js");\n  w("engine/kitchen-room.js");')],
  ['L', 'the dice only in a world with 3D', 'engine/boot.js', null, s => s.replace('  w("engine/dice.js");\n', '').replace('w("engine/shapes.js");}', 'w("engine/shapes.js");w("engine/dice.js");}')],
  ['L', 'the game offline with no dice', 'sw.js', '"./engine/dice.js", ', ''],
];
function plant(T, p) {
  const [, , file, from, to] = p, copy = Object.assign({}, T), was = copy[file];
  if (typeof was !== 'string') return { why: file + ' is not in the tree' };
  const now = typeof to === 'function' ? to(was) : was.replace(from, to);
  if (now === was) return { why: 'the line it plants on is not in ' + file };
  copy[file] = now; return { tree: copy };
}

const T = tree();
if (process.argv.includes('--selftest')) {
  let bad = 0;
  PLANTS.forEach(p => {
    const r = plant(T, p);
    if (r.why) { bad++; console.log('PLANT DID NOT TAKE  ' + p[0] + '  ' + p[1] + ': ' + r.why); return; }
    const got = check(r.tree), hit = got.filter(s => s.startsWith(p[0] + ' '));
    if (!hit.length) { bad++; console.log('GREEN, SHOULD BE RED  ' + p[0] + '  ' + p[1] + (got.length ? ' (red only for ' + got.map(s => s.slice(0, 1)).join('') + ')' : '')); }
    else console.log('red as it should be  ' + p[0] + '  ' + p[1] + ': ' + hit[0].slice(3));
  });
  const real = check(T);
  if (real.length) { bad++; console.log('the real tree is red:\n- ' + real.join('\n- ')); }
  if (bad) { console.log('FAIL — ' + bad + ' of ' + (PLANTS.length + 1) + ' red cases did not hold'); process.exit(1); }
  console.log('OK — all ' + PLANTS.length + ' planted faults red, each for its own sentence, and the real tree green');
  process.exit(0);
}
const red = check(T);
if (red.length) { console.log('FAIL — the dice\n- ' + red.join('\n- ')); process.exit(1); }
console.log('OK — the dice: ' + require(path.join(ROOT, 'engine', 'dice.js')).DICELINES.length + ' lines from one starting number, each apart, new each load, set by checks only; ' + OLDROLLS + ' old rolls in the game and ' + STUBS + ' old stubs in the checks still to move onto them');
