#!/usr/bin/env node
/* THE PRIVATE-TERM CHECK — no personal detail enters the public repository in new work.
   The owner, 2026-09-28: the game's work moves to the public repository and "at least wont have info
   about my peronal life". The clean copy was made once, by the private map (scripts/clean-copy.js). This
   is what keeps it clean afterwards: every file and every file name in the repository is read against
   the same map's terms on every push and pull request, and any hit fails the build.

   THE TERMS ARE NEVER IN THIS REPOSITORY. CI hands them in as an encrypted repository secret
   (PRIVATE_TERMS: the map's JSON rules, exactly as its ```json block holds them). GitHub masks a secret's
   whole value in logs, not the pieces of it, so this file prints only a rule's number, its kind and a
   file:line, and it never lets an error message through: Node's own JSON and regular-expression errors
   quote their input, which here would be the owner's details on a public log.

   Where the secret is absent (a pull request from a fork gets no secrets), this FAILS rather than passing
   on nothing: a fork's work is brought into a branch of this repository by a session that reviews it,
   and the check runs there (docs/PRIVACY.md).

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
  if (!Array.isArray(rules) || !rules.some(r => r && (r.rule === 'replace' || r.rule === 'drop'))) throw new Error('the private list holds no rule to check; nothing was checked');
  const cc = tool();
  try { cc.compile(rules); }
  catch (e) { throw new Error('the private list has a rule that cannot be compiled (a pattern or a note is malformed); nothing was checked'); }
  return rules;
}

function trackedFiles(root) {
  const list = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean);
  return list.map(file => {
    let buf; try { buf = fs.readFileSync(path.join(root, file)); } catch (e) { return null; }
    return { file, text: buf.subarray(0, 8000).includes(0) ? null : buf.toString('utf8') };
  }).filter(Boolean);
}

function check(text, files) {
  const rules = rulesFrom(text);
  let hits;
  const cc = tool();
  try { hits = cc.survivors(files, rules); }
  catch (e) { throw new Error('the private list could not be applied (a rule is malformed); nothing was checked'); }
  return { rules: rules.length, files: files.length, hits };
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
  const leak = (fn, what) => { let msg = ''; try { fn(); } catch (e) { msg = e.message; } mark(msg && msg.indexOf(T.who) < 0 && msg.indexOf(T.town) < 0 && /nothing was checked/.test(msg), what, msg || 'it did not fail'); };
  leak(() => check('[{"id":3,"rule":"replace","find":["' + T.who + '"],"to":"x"', []), 'a broken list fails without quoting any of it (Node\'s own message would)');
  leak(() => check(JSON.stringify([{ id: 9, kind: 'k', rule: 'replace', pattern: ['(' + T.who], to: 'x' }]), []), 'a malformed pattern fails without quoting it');
  leak(() => check(JSON.stringify([{ id: 1, kind: 'k', rule: 'keep', find: [T.who] }]), []), 'a list with nothing to check is a red, not a pass');
  leak(() => check('', []), 'an empty secret is a red, not a pass');
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
    r.hits.slice(0, 50).forEach(h => console.log('- ' + h));
    process.exit(1);
  }
  console.log('OK: ' + r.files + ' files and their names read against ' + r.rules + ' private rules; nothing personal found. (The rules are never printed.)');
}

module.exports = { rulesFrom, check };
