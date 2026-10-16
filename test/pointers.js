#!/usr/bin/env node
/* THE POINTERS — every "grep these words in that file" still finds its line.
   The documents and the crew's persona files point a reader at a line by its words instead of its number,
   because numbers slide. Words slide too. When the line is reworded the pointer finds nothing, and nothing
   says so: on 2026-10-16 two of them already sent their reader nowhere. This reads every tracked text file
   for every spelling this repository writes a pointer in, and a pointer whose words are on no line of that
   file fails the build, named by its own file:line and the file it names.

   The spellings, the file always in backticks: (<file>, grep <words>), grep <words> in <file> and
   <file> (grep <words>), the words in backticks or in double quotes. A pointer may be broken over one line
   break, and the next line may go on inside a quote (> ).

   Which pointers it can check, decided here:
   - The file named is tracked here: its words must be on one line of it, as whole words (a name is not
     found inside a longer name: function toast is not on the line of function toastShow). grep reads one
     line at a time, so words that are in the file only broken over two lines find nothing, and are red.
     A pointer into its own file does not count its own lines: a pointer always finds itself.
   - The file named is not tracked here. Since the split some pointers name a file in the private
     repository, which this check cannot read: those files are named in ELSEWHERE below, and a pointer to
     one of them is LISTED as not checkable, never red and never guessed. So is a bare name with no folder
     (it names no file exactly; write the path from the root to make it checkable).
   - Any other path with a folder that is not tracked here is red, whatever the folder: a file that moved
     or was renamed, here or in a folder both repositories keep. Closed by default: a pointer to another
     private file is red until somebody adds that file to ELSEWHERE.
   - A pointer whose "file" is not a file name (grep <words> in <a function>) is not read as a pointer.
   Reading nothing is a red, not a pass: no pointer found, or none that could be checked, fails.

   Run:  node test/pointers.js              (the tracked files)
         node test/pointers.js --selftest   (made-up files and words; no pointer is written in this file) */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');

/* the files the private repository holds that pointers here name today, by their path from the root: a pointer to
   one of these is listed as not checkable. Any other path with a folder that this repository does not track is red */
const ELSEWHERE = ['docs/POSTMORTEM.md', 'docs/meetings/2026-09-14-la-cuadrilla-run-8.md', 'test/town.smoke.js'];

const T = '`';
const GAP = '(?:[ \\t]+|[ \\t]*\\n[ \\t>]*)';              // a space, or one line break and the indent (or quote) after it
const BREAK = /[ \t]*\n[ \t>]*/g;                          // that line break, as grep would read the words: one space
const WORDS = q => q + '([^' + q + '\\n]+(?:\\n[^' + q + '\\n]+)?)' + q;   // the words in backticks or double quotes, broken over one line at most
const FILE = T + '([^`\\s]+)' + T;                         // the file: a code span with no space in it
const FORMS = [T, '"'].flatMap(q => [
  { re: new RegExp('\\bgrep' + GAP + WORDS(q) + GAP + 'in' + GAP + FILE, 'gi'), words: 1, file: 2 },   // grep <words> in <file>
  { re: new RegExp(FILE + ',' + GAP + 'grep' + GAP + WORDS(q), 'gi'), words: 2, file: 1 },             // (<file>, grep <words>)
  { re: new RegExp(FILE + GAP + '\\(grep' + GAP + WORDS(q), 'gi'), words: 2, file: 1 },                // <file> (grep <words>)
]);
const isFileName = f => /^[\w.\/-]*[\w-]\.[A-Za-z0-9]+$/.test(f);

/* every pointer in the files: where it is (from its first line to its last), the file it names and the words,
   joined as grep would read them */
function find(files) {
  const out = [];
  files.forEach(({ file, text }) => {
    if (text == null) return;
    FORMS.forEach(({ re, words, file: fi }) => {
      re.lastIndex = 0; let m;
      while ((m = re.exec(text))) {
        if (!isFileName(m[fi])) continue;
        const from = text.slice(0, m.index).split('\n').length;
        out.push({ at: file + ':' + from, file, from, to: from + (m[0].match(/\n/g) || []).length, names: m[fi], words: m[words].replace(BREAK, ' ') });
      }
    });
  });
  return out;
}

/* the words on a line as grep finds them, except that a name is not found inside a longer one: an end of the words
   that is a word character (a letter, a digit, _ or $) must not touch another word character on the line */
const WCH = /[\p{L}\p{N}_$]/u;
function holds(line, words) {
  const edge = (inside, outside) => !WCH.test(inside) || !WCH.test(outside || '');
  for (let i = line.indexOf(words); i >= 0; i = line.indexOf(words, i + 1))
    if (edge(words[0], line[i - 1]) && edge(words[words.length - 1], line[i + words.length])) return true;
  return false;
}

/* the verdict on every pointer: checkable (and live or dead), or listed as not checkable, with its sentence */
function check(files, elsewhere = ELSEWHERE) {
  const text = new Map(files.map(f => [f.file, f.text]));
  const pointers = find(files), reds = [], unchecked = []; let checkable = 0;
  pointers.forEach(p => {
    const q = p.at + ' points at ' + p.names + ' for ' + T + p.words + T;
    if (text.has(p.names)) {
      checkable++;
      const body = text.get(p.names);
      if (body == null) { reds.push(q + ', and ' + p.names + ' is not a text file, so nothing can be found in it'); return; }
      /* a pointer into its own file does not find itself: its own lines are not the line it means */
      const lines = body.split('\n').filter((l, i) => p.file !== p.names || i + 1 < p.from || i + 1 > p.to);
      if (!lines.some(l => holds(l, p.words)))
        reds.push(q + ', and no line of ' + p.names + ' holds those words' + (holds(lines.join(' ').replace(/\s+/g, ' '), p.words)
          ? ': they are there only broken over two lines, and grep reads one line at a time. Point at a part that sits on one line.'
          : ': the line was reworded or removed. Re-point it to words that are on that line now.'));
      return;
    }
    const folder = p.names.includes('/');
    if (folder && !elsewhere.includes(p.names)) { checkable++; reds.push(q + ', and this repository does not track ' + p.names + ', and it is not one of the files the private repository holds (ELSEWHERE in test/pointers.js): the file moved or was renamed. Point it at the file the words are in now.'); return; }
    unchecked.push(p.at + ' names ' + p.names + ', which this repository does not track' + (folder ? ' (one of the files the private repository holds)' : ' (a bare name with no folder: write the path from the root to make it checkable)'));
  });
  if (!pointers.length) reds.push('no pointer was found in ' + files.length + ' tracked files, so nothing was checked; a check that read nothing is a red, not a pass');
  else if (!checkable) reds.push(pointers.length + ' pointers were found and none names a file this repository tracks, so nothing was checked; that is a red, not a pass');
  return { pointers: pointers.length, checkable, unchecked, reds };
}

function trackedFiles(root) {
  const list = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean);
  return list.map(file => {
    let buf; try { buf = fs.readFileSync(path.join(root, file)); } catch (e) { return null; }
    return { file, text: buf.subarray(0, 8000).includes(0) ? null : buf.toString('utf8') };
  }).filter(Boolean);
}

function selftest() {
  let total = 0; const bad = [];
  const mark = (ok, what, why) => { total++; console.log((ok ? '  ok   ' : '  FAIL ') + what + (ok ? '' : '  (' + why + ')')); if (!ok) bad.push(what); };
  /* made-up files and words, assembled here so that no line of this file is a pointer */
  const inB = (f, w) => '(' + T + f + T + ', grep ' + T + w + T + ')';
  const inA = (w, f) => 'grep ' + T + w + T + ' in ' + T + f + T;
  const code = { file: 'engine/quill.js', text: 'const a=1;\nfunction zorbleck(n){ return n; }\nconst VELLUM=3;\n' };
  const doc = body => ({ file: 'docs/n.md', text: 'one\n' + body + '\n' });
  const run = (...files) => check(files, ['docs/LEDGER.md']);

  let r = run(doc('the turn is ' + inB('engine/quill.js', 'function zorbleck')), code);
  mark(r.pointers === 1 && r.checkable === 1 && !r.reds.length, 'a live pointer is green', JSON.stringify(r));
  r = run(doc('see ' + inA('VELLUM=3', 'engine/quill.js')), code);
  mark(r.pointers === 1 && r.checkable === 1 && !r.reds.length, 'the other form, grep <words> in <file>, is read and green', JSON.stringify(r));
  r = run(doc('the turn is ' + inB('engine/quill.js', 'function quandary')), code);
  mark(r.reds.length === 1 && /^docs\/n\.md:2 points at engine\/quill\.js /.test(r.reds[0]) && /no line of engine\/quill\.js holds/.test(r.reds[0]), 'a dead pointer is red, named by its own file:line and the file it names', JSON.stringify(r.reds));
  r = run(doc(inB('engine/quill.js', 'zorbleck') + ' and ' + inB('docs/LEDGER.md', 'the tamarind row') + ' and ' + inB('quill.js', 'zorbleck')), code);
  mark(!r.reds.length && r.pointers === 3 && r.checkable === 1 && r.unchecked.length === 2 && /^docs\/n\.md:2 names docs\/LEDGER\.md, which this repository does not track/.test(r.unchecked[0]) && /bare name/.test(r.unchecked[1]),
    'a pointer to a file this repository does not track is listed as not checkable, not red (a named private file, and a bare name)', JSON.stringify(r));
  r = run(doc(inB('engine/quill.js', 'zorbleck') + ' and ' + inB('engine/gone.js', 'zorbleck')), code);
  mark(r.reds.length === 1 && /docs\/n\.md:2 points at engine\/gone\.js .*does not track engine\/gone\.js/.test(r.reds[0]), 'a missing file inside one of this repository\'s own folders is red, not listed', JSON.stringify(r));
  r = run(doc(inB('engine/quill.js', 'zorbleck') + ' and ' + inB('test/quill.smoke.js', 'zorbleck')), code);
  mark(r.reds.length === 1 && /points at test\/quill\.smoke\.js .*not one of the files the private repository holds/.test(r.reds[0]) && !r.unchecked.length,
    'a file renamed in a folder both repositories keep is red, not listed: only the named private files are listed', JSON.stringify(r));
  /* every spelling this repository writes a pointer in, each with either quote mark round the words */
  const spell = [(f, w) => '(' + f + ', grep ' + w + ')', (f, w) => 'grep ' + w + ' in ' + f, (f, w) => f + ' (grep ' + w + ')'];
  const every = w => [T, '"'].flatMap(q => spell.map(s => s(T + 'engine/quill.js' + T, q + w + q))).join(' and\n');
  r = run(doc(every('VELLUM=3')), code);
  const live = r; r = run(doc(every('VELLUM=4')), code);
  mark(live.pointers === 6 && live.checkable === 6 && !live.reds.length && r.pointers === 6 && r.reds.length === 6,
    'every spelling is read, with backticks or double quotes round the words: live is green and dead is red, six of each', JSON.stringify([live, r]));
  r = run(doc('> (' + T + 'engine/quill.js' + T + ', grep\n> ' + T + 'function quandary' + T + ')\n> and grep ' + T + 'function\n> zorbleck' + T + ' in ' + T + 'engine/quill.js' + T), code);
  mark(r.pointers === 2 && r.reds.length === 1 && /for `function quandary`/.test(r.reds[0]), 'a pointer continued on a quoted line (> ) is read: the dead one is red and the live one green', JSON.stringify(r));
  r = run(doc(inB('engine/quill.js', 'function zorble') + ' and ' + inB('engine/quill.js', 'zorbleck(n)')), code);
  mark(r.pointers === 2 && r.reds.length === 1 && /for `function zorble`.*reworded or removed/.test(r.reds[0]), 'the words stand as whole words: function zorble is not found inside function zorbleck', JSON.stringify(r));
  r = run(doc('see further down ' + inB('docs/n.md', 'the zorbleck row')), code);
  mark(r.pointers === 1 && r.reds.length === 1 && /reworded or removed/.test(r.reds[0]), 'a pointer into its own file does not find its own line', JSON.stringify(r));
  r = run(doc('see further down ' + inB('docs/n.md', 'the zorbleck row') + '\nthe zorbleck row is here'), code);
  mark(r.pointers === 1 && !r.reds.length, 'and finds the line it means there', JSON.stringify(r));
  r = run(doc('no pointer here, only the word grep and a ' + T + 'span' + T), code);
  mark(r.pointers === 0 && r.reds.length === 1 && /^no pointer was found in 2 tracked files, so nothing was checked/.test(r.reds[0]), 'zero pointers found is red: a check that read nothing', JSON.stringify(r));
  r = run(doc(inB('docs/LEDGER.md', 'the tamarind row')), code);
  mark(r.pointers === 1 && r.reds.length === 1 && /none names a file this repository tracks/.test(r.reds[0]), 'pointers that are all not checkable are red too: still nothing was checked', JSON.stringify(r));
  r = run(doc(inB('engine/quill.js', 'return n; } const')), code);
  mark(r.reds.length === 1 && /broken over two lines/.test(r.reds[0]), 'words in the file only across a line break are red: grep reads one line', JSON.stringify(r.reds));
  r = run(doc('the turn is (' + T + 'engine/quill.js' + T + ', grep ' + T + 'function\n  zorbleck' + T + ')'), code);
  mark(r.pointers === 1 && !r.reds.length, 'a pointer broken over a line break in its own document is still read, as one line of words', JSON.stringify(r));
  r = run(doc(inA('VELLUM', 'drawQuill') + ' and ' + inB('engine/quill.js', 'zorbleck')), code);
  mark(r.pointers === 1, 'grep <words> in <a function name> is not read as a pointer to a file', JSON.stringify(r));
  r = run(doc('Grep ' + T + 'VELLUM' + T + ' in ' + T + 'engine/quill.js' + T + ' first.'), code);
  mark(r.pointers === 1 && !r.reds.length, 'Grep at the start of a sentence is read', JSON.stringify(r));
  r = run(doc(inB('img/quill.png', 'zorbleck')), code, { file: 'img/quill.png', text: null });
  mark(r.reds.length === 1 && /not a text file/.test(r.reds[0]), 'a pointer into a binary file is red', JSON.stringify(r.reds));
  r = run({ file: 'test/pointers.js', text: fs.readFileSync(__filename, 'utf8') }, code);
  mark(r.pointers === 0, 'this file holds no pointer of its own, so the real run reads only what others wrote', JSON.stringify(r));
  if (bad.length) { console.log('FAIL: ' + bad.length + ' of ' + total); process.exit(1); }
  console.log('OK: ' + total + ' cases, made-up files and words only.');
  process.exit(0);
}

if (require.main === module) {
  if (process.argv.includes('--selftest')) return void selftest();
  let files;
  try { files = trackedFiles(ROOT); }
  catch (e) { console.log('FAIL: the tracked files could not be listed, so no pointer was read; that is a red, not a pass'); process.exit(1); }
  const r = check(files);
  if (r.unchecked.length) { console.log('Not checkable here (' + r.unchecked.length + '), listed and not red:'); r.unchecked.forEach(u => console.log('- ' + u)); }
  if (r.reds.length) {
    console.log('Red (' + r.reds.length + '):');
    r.reds.forEach(h => console.log('- ' + h));
    console.log('FAIL: ' + r.reds.length + ' pointer(s) find nothing, of ' + r.pointers + ' read (' + r.checkable + ' checkable, ' + r.unchecked.length + ' not). A pointer that finds nothing sends its reader nowhere.');
    process.exit(1);
  }
  console.log('OK: ' + r.pointers + ' pointers read in ' + files.length + ' tracked files; ' + r.checkable + ' checkable, and each finds its line; ' + r.unchecked.length + ' not checkable (listed above).');
}

module.exports = { ELSEWHERE, find, holds, check };
