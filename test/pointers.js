#!/usr/bin/env node
/* THE POINTERS — every "grep these words in that file" still finds its line.
   The documents and the crew's persona files point a reader at a line by its words instead of its number,
   because numbers slide: (<file>, grep <words>) and grep <words> in <file>, both words and file in
   backticks. Words slide too. When the line is reworded the pointer finds nothing, and nothing says so:
   on 2026-10-16 two of them already sent their reader nowhere. This reads every tracked text file for the
   two forms that name their file, and a pointer whose words are on no line of that file fails the build,
   named by its own file:line and the file it names.

   Which pointers it can check, decided here:
   - The file named is tracked here: its words must be on one line of it. grep reads one line at a time,
     so words that are in the file only broken over two lines find nothing, and are red.
   - The file named is not tracked here. Since the split some pointers name a file in the private
     repository, which this check cannot read; those are LISTED as not checkable, never red and never
     guessed. That holds for a path in a folder the private repository keeps too (SHARED below), and for a
     bare name with no folder (it names no file exactly; write the path from the root to make it checkable).
   - Unless the path is inside one of THIS repository's own folders: every folder tracked here that is not
     in SHARED (engine/, content/, vendor/ today). They hold the game, and the game is read here, so a
     missing file there is a file that moved or was renamed, and its pointer is red. Closed by default: a
     folder added later counts as this repository's own until somebody adds it to SHARED and says why.
   - A pointer whose "file" is not a file name (grep <words> in <a function>) is not read as a pointer.
   Reading nothing is a red, not a pass: no pointer found, or none that could be checked, fails.

   Run:  node test/pointers.js              (the tracked files)
         node test/pointers.js --selftest   (made-up files and words; no pointer is written in this file) */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');

/* the folders the private repository keeps too: its docs (the owner's log and handoff), its tests (the
   town's guards), its scripts (the allowed list the public copy is made from), its skills and its CI */
const SHARED = ['docs', 'test', 'scripts', '.claude', '.github'];

const T = '`';
const GAP = '(?:[ \\t]+|[ \\t]*\\n[ \\t]*)';             // a space, or one line break and the indent after it
const WORDS = T + '([^`\\n]+(?:\\n[^`\\n]+)?)' + T;        // the words: a code span, broken over one line at most
const FILE = T + '([^`\\s]+)' + T;                         // the file: a code span with no space in it
const FORMS = [
  { re: new RegExp('\\bgrep' + GAP + WORDS + GAP + 'in' + GAP + FILE, 'gi'), words: 1, file: 2 },
  { re: new RegExp(FILE + ',' + GAP + 'grep' + GAP + WORDS, 'gi'), words: 2, file: 1 },
];
const isFileName = f => /^[\w.\/-]*[\w-]\.[A-Za-z0-9]+$/.test(f);

/* every pointer in the files: where it is, the file it names and the words, joined as grep would read them */
function find(files) {
  const out = [];
  files.forEach(({ file, text }) => {
    if (text == null) return;
    FORMS.forEach(({ re, words, file: fi }) => {
      re.lastIndex = 0; let m;
      while ((m = re.exec(text))) {
        if (!isFileName(m[fi])) continue;
        out.push({ at: file + ':' + text.slice(0, m.index).split('\n').length, names: m[fi], words: m[words].replace(/[ \t]*\n[ \t]*/g, ' ') });
      }
    });
  });
  return out;
}

/* the verdict on every pointer: checkable (and live or dead), or listed as not checkable, with its sentence */
function check(files) {
  const text = new Map(files.map(f => [f.file, f.text]));
  const own = new Set(files.map(f => f.file.split('/')).filter(p => p.length > 1).map(p => p[0]).filter(d => !SHARED.includes(d)));
  const pointers = find(files), reds = [], unchecked = []; let checkable = 0;
  pointers.forEach(p => {
    const q = p.at + ' points at ' + p.names + ' for ' + T + p.words + T;
    if (text.has(p.names)) {
      checkable++;
      const body = text.get(p.names);
      if (body == null) reds.push(q + ', and ' + p.names + ' is not a text file, so nothing can be found in it');
      else if (!body.split('\n').some(l => l.includes(p.words)))
        reds.push(q + ', and no line of ' + p.names + ' holds those words' + (body.replace(/\s+/g, ' ').includes(p.words)
          ? ': they are there only broken over two lines, and grep reads one line at a time. Point at a part that sits on one line.'
          : ': the line was reworded or removed. Re-point it to words that are on that line now.'));
      return;
    }
    const top = p.names.includes('/') ? p.names.split('/')[0] : null;
    if (top && own.has(top)) { checkable++; reds.push(q + ', and this repository does not track ' + p.names + ' although ' + top + '/ is one of its own folders: the file moved or was renamed. Point it at the file the words are in now.'); return; }
    unchecked.push(p.at + ' names ' + p.names + ', which this repository does not track' + (top ? ' (it may be in the private repository)' : ' (a bare name with no folder: write the path from the root to make it checkable)'));
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
  const run = (...files) => check(files);

  let r = run(doc('the turn is ' + inB('engine/quill.js', 'function zorbleck')), code);
  mark(r.pointers === 1 && r.checkable === 1 && !r.reds.length, 'a live pointer is green', JSON.stringify(r));
  r = run(doc('see ' + inA('VELLUM=3', 'engine/quill.js')), code);
  mark(r.pointers === 1 && r.checkable === 1 && !r.reds.length, 'the other form, grep <words> in <file>, is read and green', JSON.stringify(r));
  r = run(doc('the turn is ' + inB('engine/quill.js', 'function quandary')), code);
  mark(r.reds.length === 1 && /^docs\/n\.md:2 points at engine\/quill\.js /.test(r.reds[0]) && /no line of engine\/quill\.js holds/.test(r.reds[0]), 'a dead pointer is red, named by its own file:line and the file it names', JSON.stringify(r.reds));
  r = run(doc(inB('engine/quill.js', 'zorbleck') + ' and ' + inB('docs/LEDGER.md', 'the tamarind row') + ' and ' + inB('quill.js', 'zorbleck')), code);
  mark(!r.reds.length && r.pointers === 3 && r.checkable === 1 && r.unchecked.length === 2 && /^docs\/n\.md:2 names docs\/LEDGER\.md, which this repository does not track/.test(r.unchecked[0]) && /bare name/.test(r.unchecked[1]),
    'a pointer to a file this repository does not track is listed as not checkable, not red (a shared folder, and a bare name)', JSON.stringify(r));
  r = run(doc(inB('engine/quill.js', 'zorbleck') + ' and ' + inB('engine/gone.js', 'zorbleck')), code);
  mark(r.reds.length === 1 && /docs\/n\.md:2 points at engine\/gone\.js .*engine\/ is one of its own folders/.test(r.reds[0]), 'a missing file inside one of this repository\'s own folders is red, not listed', JSON.stringify(r));
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

module.exports = { SHARED, find, check };
