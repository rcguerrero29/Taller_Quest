#!/usr/bin/env node
/* THE PRIVATE-TERM CHECK — no personal detail enters the public repository in new work.
   The owner, 2026-09-28: the game's work moves to the public repository and "at least wont have info
   about my peronal life". The clean copy was made once, by the private map (scripts/clean-copy.js). This
   is what keeps it clean afterwards: every file and every file name in the repository is read against
   the same map's terms on every push and pull request, and any hit fails the build.

   THE TERMS ARE NEVER IN THIS REPOSITORY. CI hands them in as an encrypted repository secret
   (PRIVATE_TERMS: the map's JSON rules, exactly as its ```json block holds them). GitHub masks a secret's
   whole value in logs, not the pieces of it, so this file prints only a rule's number, its kind and a
   file:line (a file whose name holds a term as a reader would read it, in any case and without its accents,
   is named instead by its place in git ls-files order and a fingerprint of its path, never by any part of
   its name), and it never lets an error message through: Node's own JSON and regular-expression errors
   quote their input, which here would be the owner's details on a public log.

   Where the secret is absent (a pull request from a fork gets no secrets), this FAILS rather than passing
   on nothing: a fork's work is brought into a branch of this repository by a session that reviews it,
   and the check runs there (docs/PRIVACY.md). A run that read no file, a list with no word or pattern to
   look for, and a single rule that is not exactly keep, replace or drop, or has no word or pattern of its
   own, FAIL too: a check that read nothing must not look like a pass. The OK line counts only the rules
   that look for something.

   Run:  PRIVATE_TERMS="$(cat map.json)" node scripts/private-terms.js
         node scripts/private-terms.js --map <file outside the repository>
         node scripts/private-terms.js --selftest */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
/* the rules are read and applied by the clean-copy tool itself, so the check can never drift from the copy */
let CC = null;
try { CC = require('./clean-copy.js'); } catch (e) { CC = null; }
const tool = () => { if (!CC) throw new Error('scripts/clean-copy.js is missing, and this check reads the list with it; nothing was checked'); return CC; };

/* read the rules without ever echoing them: every failure becomes one fixed sentence */
function rulesFrom(text) {
  let rules;
  try {
    const m = String(text).match(/```json\s*\n([\s\S]*?)```/);
    rules = JSON.parse(m ? m[1] : text);
  } catch (e) { throw new Error('the private list could not be read (it is not valid JSON); nothing was checked'); }
  if (!Array.isArray(rules)) throw new Error('the private list holds no rule to check; nothing was checked');
  /* every rule is read, not only counted: one written slightly wrong ("Replace", or a word list left empty)
     would check nothing while the rest of the list passed. A rule is named by its number, never by its words. */
  const word = s => typeof s === 'string' && s.trim() !== '';
  rules.forEach((r, i) => {
    const at = r && Number.isInteger(r.id) ? 'rule #' + r.id : 'rule number ' + (i + 1) + ' in the list';
    if (!r || !['keep', 'replace', 'drop'].includes(r.rule)) throw new Error(at + ' is not keep, replace or drop, so it would check nothing; nothing was checked');
    const list = k => r[k] === undefined || (Array.isArray(r[k]) && r[k].every(word));
    if (r.rule !== 'keep' && !(list('find') && list('pattern') && (r.find || []).concat(r.pattern || []).length)) throw new Error(at + ' is a ' + r.rule + ' rule without a word or pattern to look for (or with an empty one); nothing was checked');
  });
  if (!rules.some(r => r.rule === 'replace' || r.rule === 'drop')) throw new Error('the private list holds no rule to check; nothing was checked');
  const cc = tool();
  let C;
  try { C = cc.compile(rules); }
  catch (e) { throw new Error('the private list has a rule that cannot be compiled (a pattern or a note is malformed); nothing was checked'); }
  if (!C.reps.length && !C.drops.length) throw new Error('the private list has rules, but not one word or pattern to look for; nothing was checked');
  return rules;
}

function trackedFiles(root) {
  const list = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean);
  return list.map((file, i) => {
    let buf; try { buf = fs.readFileSync(path.join(root, file)); } catch (e) { return null; }
    /* n: its place in git ls-files order, the only way a report names a file whose name holds a term */
    return { file, n: i + 1, text: buf.subarray(0, 8000).includes(0) ? null : buf.toString('utf8') };
  }).filter(Boolean);
}

function check(text, files) {
  const rules = rulesFrom(text);
  if (!files.length) throw new Error('not one file was read (git listed none, or none could be opened); nothing was checked');
  let hits;
  const cc = tool();
  try { hits = cc.survivors(files, rules); }
  catch (e) { throw new Error('the private list could not be applied (a rule is malformed); nothing was checked'); }
  /* rules: only the ones that look for something; a keep rule records a decision and checks nothing */
  return { rules: rules.filter(r => r.rule !== 'keep').length, files: files.length, hits };
}

function selftest() {
  let total = 0; const bad = [];
  const mark = (ok, what, why) => { total++; console.log((ok ? '  ok   ' : '  FAIL ') + what + (ok ? '' : '  (' + why + ')')); if (!ok) bad.push(what); };
  const T = { who: 'Zo' + 'rblax', town: 'Qwerty' + 'ville' };   /* made-up terms, assembled here */
  const map = JSON.stringify([{ id: 3, kind: 'partner', rule: 'replace', find: [T.who], to: '[partner]', ci: true },
    { id: 5, kind: 'place', rule: 'replace', find: [T.town], to: '[city]' }]);
  let r = check(map, [{ file: 'a.md', text: 'clean words' }]);
  mark(r.hits.length === 0, 'a clean repository passes', JSON.stringify(r.hits));
  r = check(map, [{ file: 'docs/b.md', text: 'x\nwe met ' + T.who.toLowerCase() }]);
  mark(r.hits.length === 1 && /rule #3 \(partner\) survives at docs\/b\.md:2/.test(r.hits[0]) && r.hits[0].indexOf(T.who.toLowerCase()) < 0, 'a term in new work is red, named by rule and line, never by the term', JSON.stringify(r.hits));
  r = check(map, [{ file: 'art/' + T.town.toLowerCase() + '-map.png', text: null }]);
  mark(r.hits.length === 0 || r.hits.every(h => h.indexOf(T.town.toLowerCase()) < 0), 'a file name is read without printing the name', JSON.stringify(r.hits));
  r = check(map, [{ file: 'art/' + T.town + '-map.png', text: null }]);
  mark(r.hits.length === 1 && r.hits[0].indexOf(T.town) < 0, 'a term in a file name is red too', JSON.stringify(r.hits));
  r = check(map, [{ file: 'a.md', text: 'clean words' }, { file: 'docs/' + T.town + '-notes.md', text: 'x\nwe met ' + T.who }]);
  mark(r.hits.length === 2 && r.hits.every(h => h.indexOf(T.town) < 0 && h.indexOf(T.who) < 0 && /file 2 in git ls-files order/.test(h)), 'a file whose name and text both hold a term is named by its place in git ls-files order, never by its name', JSON.stringify(r.hits));
  r = check(map, [{ file: T.town + '/' + T.who + '.png', text: null }]);
  mark(r.hits.length === 2 && r.hits.every(h => h.indexOf(T.town) < 0 && h.indexOf(T.who) < 0), 'a name holding two terms prints neither, whichever rule the line is for', JSON.stringify(r.hits));
  const leak = (fn, what) => { let msg = ''; try { fn(); } catch (e) { msg = e.message; } mark(msg && msg.indexOf(T.who) < 0 && msg.indexOf(T.town) < 0 && /nothing was checked/.test(msg), what, msg || 'it did not fail'); };
  leak(() => check('[{"id":3,"rule":"replace","find":["' + T.who + '"],"to":"x"', []), 'a broken list fails without quoting any of it (Node\'s own message would)');
  leak(() => check(JSON.stringify([{ id: 9, kind: 'k', rule: 'replace', pattern: ['(' + T.who], to: 'x' }]), []), 'a malformed pattern fails without quoting it');
  leak(() => check(JSON.stringify([{ id: 1, kind: 'k', rule: 'keep', find: [T.who] }]), []), 'a list with nothing to check is a red, not a pass');
  leak(() => check('', []), 'an empty secret is a red, not a pass');
  leak(() => check(map, []), 'a run that read no file is a red, not a pass');
  leak(() => check(JSON.stringify([{ id: 2, kind: 'k', rule: 'replace', find: [], to: 'x' }, { id: 4, kind: 'k', rule: 'drop', pattern: [] }]), [{ file: 'a.md', text: 'clean words' }]), 'a list whose rules hold no word or pattern to look for is a red, not a pass');
  /* one rule written slightly wrong, beside good ones: "Replace" for "replace", or a word list left empty */
  const good = { id: 3, kind: 'partner', rule: 'replace', find: [T.who], to: '[partner]' };
  const fails = (rules, files) => { try { check(JSON.stringify(rules), files); return ''; } catch (e) { return e.message; } };
  const typo = fails([good, { id: 5, kind: 'place', rule: 'Replace', find: [T.town], to: '[city]' }], [{ file: 'docs/moving-day.md', text: 'The new flat in ' + T.town + ' has two rooms.' }]);
  const blank = fails([good, { kind: 'k', rule: 'drop', find: [''] }], [{ file: 'a.md', text: 'clean words' }]);
  const counted = check(JSON.stringify([{ id: 1, kind: 'pet-name', rule: 'keep', find: ['Bis' + 'cuit'] }, good]), [{ file: 'a.md', text: 'clean words' }]).rules;
  mark(/^rule #5 /.test(typo) && /^rule number 2 in the list /.test(blank) && [typo, blank].every(m => /nothing was checked/.test(m) && m.indexOf(T.town) < 0 && m.indexOf(T.who) < 0) && counted === 1,
    'a rule that is not exactly keep, replace or drop, or has no word to look for, is a red naming its number; the OK line counts only rules that look for something', JSON.stringify([typo || 'it did not fail', blank || 'it did not fail', 'counted ' + counted]));
  /* a place in git ls-files order is right only on the tree that was checked, and a pull request is checked as its merge */
  const masked = 'docs/' + T.town + '-notes.md', fp = require('crypto').createHash('sha256').update(masked).digest('hex').slice(0, 8);
  const onBranch = check(map, [{ file: 'a.md', text: 'x' }, { file: masked, text: 'we met ' + T.who }]).hits;
  const onMerge = check(map, [{ file: 'CHANGELOG.md', text: 'x' }, { file: 'a.md', text: 'x' }, { file: masked, text: 'we met ' + T.who }]).hits;
  mark(onBranch.length === 2 && onMerge.length === 2 && /file 2 /.test(onBranch[0]) && /file 3 /.test(onMerge[0]) && onBranch.concat(onMerge).every(h => h.indexOf('fingerprint ' + fp + ' ') > 0 && h.indexOf(T.town) < 0 && h.indexOf(T.who) < 0),
    'a file named by its place also carries a fingerprint of its path, the same whatever else the tree holds', JSON.stringify(onBranch.concat(onMerge)));
  if (bad.length) { console.log('FAIL: ' + bad.length + ' of ' + total); process.exit(1); }
  console.log('OK: ' + total + ' cases, made-up terms only.');
  process.exit(0);
}

if (require.main === module) {
  if (process.argv.includes('--selftest')) return void selftest();
  const i = process.argv.indexOf('--map');
  let text = null;
  if (i > 0) {
    const f = path.resolve(process.argv[i + 1] || '');
    const rel = path.relative(ROOT, f);
    if (!rel.startsWith('..') && !path.isAbsolute(rel)) { console.log('FAIL: the map is inside the repository; it must never be'); process.exit(1); }
    try { text = fs.readFileSync(f, 'utf8'); } catch (e) { console.log('FAIL: the map could not be read from outside the repository'); process.exit(1); }
  } else text = process.env.PRIVATE_TERMS || '';
  if (!text.trim()) {
    console.log('FAIL: the private list is not here (no PRIVATE_TERMS secret), so nothing was checked. A pull request from a fork gets no secrets: a session brings its commits into a branch of this repository, reviews them, and the check runs there.');
    process.exit(1);
  }
  let r;
  try { r = check(text, trackedFiles(ROOT)); }
  catch (e) { console.log('FAIL: ' + (/nothing was checked/.test(e.message) ? e.message : 'the check could not run; nothing was checked')); process.exit(1); }
  if (r.hits.length) {
    console.log('FAIL: ' + r.hits.length + ' personal detail(s) from the private list are in this repository. Rephrase them or move them to the private repository; the list itself is never printed.');
    const shown = r.hits.slice(0, 50);
    shown.forEach(h => console.log('- ' + h));
    if (shown.some(h => /, fingerprint [0-9a-f]{8} /.test(h))) console.log(tool().FIND_HINT);
    process.exit(1);
  }
  console.log('OK: ' + r.files + ' files and their names read against ' + r.rules + ' private rules, each with a word or pattern to look for; nothing personal found. (The rules are never printed.)');
}

module.exports = { rulesFrom, check };
