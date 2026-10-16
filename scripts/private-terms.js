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
   own, FAIL too: a check that read nothing must not look like a pass. So does a rule with a key the tool does
   not know or in the wrong case ("CI" for "ci"), or a known key holding the wrong kind of value, which would be
   ignored or read another way, or a key written twice, of which only the last would be read; a rule whose "files"
   limit matches none of the files whose text was read, which would look for its words nowhere, or holds a glob's
   /*, which matches by chance; a kind that holds a detail of the list, which every line about its rule prints; and
   a map holding a fenced block beside its list, whose first ```json block would be read in the list's place. Every
   entry git lists is read, a link by the text git stores for it and UTF-16 text as text. The OK line counts only
   the rules that look for something.

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
  const cc = tool();
  /* the list is the map's only fenced block (cc.listText): beside an example above it, the first ```json block
     would be read in its place */
  const list = cc.listText(text);
  if (list === null) throw new Error('the private list holds a fenced block beside its ```json list (an example, or a second list), and only the first ```json block would be read; nothing was checked');
  let rules;
  try { rules = JSON.parse(list); } catch (e) { throw new Error('the private list could not be read (it is not valid JSON); nothing was checked'); }
  if (!Array.isArray(rules)) throw new Error('the private list holds no rule to check; nothing was checked');
  const twice = cc.dupKeyAt(list);
  if (twice >= 0) throw new Error(cc.ruleName(rules[twice], twice) + ' has a key written twice, and only the last would be read; nothing was checked');
  /* every rule is read, not only counted: one written slightly wrong ("Replace", "CI" for "ci", or a word list
     left empty) would check less than it says while the rest of the list passed. Its keys and their kinds are
     read by the copy's own ruleFault. A rule is named by its number, never by its words. */
  const word = s => typeof s === 'string' && s.trim() !== '';
  rules.forEach((r, i) => {
    const at = cc.ruleName(r, i), fault = cc.ruleFault(r);
    if (fault) throw new Error(at + ' ' + fault + '; nothing was checked');
    if (!r || !['keep', 'replace', 'drop'].includes(r.rule)) throw new Error(at + ' is not keep, replace or drop, so it would check nothing; nothing was checked');
    const list = k => r[k] === undefined || (Array.isArray(r[k]) && r[k].every(word));
    if (r.rule !== 'keep' && !(list('find') && list('pattern') && (r.find || []).concat(r.pattern || []).length)) throw new Error(at + ' is a ' + r.rule + ' rule without a word or pattern to look for (or with an empty one); nothing was checked');
  });
  if (!rules.some(r => r.rule === 'replace' || r.rule === 'drop')) throw new Error('the private list holds no rule to check; nothing was checked');
  let C;
  try { C = cc.compile(rules); }
  /* the copy's own refusals (a kind or a note holding a term) name rules by number and quote nothing; Node's do */
  catch (e) { throw new Error(e.plain ? e.message + '; nothing was checked' : 'the private list has a rule that cannot be compiled (a pattern or a note is malformed); nothing was checked'); }
  if (!C.reps.length && !C.drops.length) throw new Error('the private list has rules, but not one word or pattern to look for; nothing was checked');
  return rules;
}

function trackedFiles(root) {
  const cc = tool();
  const list = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean);
  /* every entry git lists is read by its name; a link by the text git stores for it, never by what it points at
     (on any machine but the owner's that can be nothing); one that cannot be opened (a submodule's folder) keeps
     its name and has no text. Text marked as UTF-16 is text (cc.textOf). n: its place in git ls-files order, the
     only way a report names a file whose name holds a term */
  return list.map((file, i) => {
    const p = path.join(root, file);
    let buf; try { buf = fs.lstatSync(p).isSymbolicLink() ? fs.readlinkSync(p, { encoding: 'buffer' }) : fs.readFileSync(p); } catch (e) { return { file, n: i + 1, text: null }; }
    return { file, n: i + 1, text: cc.textOf(buf) };
  });
}

function check(text, files) {
  const rules = rulesFrom(text);
  if (!files.length) throw new Error('not one file was read (git listed none, or none could be opened); nothing was checked');
  const cc = tool();
  /* a rule limited by "files" looks for its words only in the text of the paths that limit matches: one that
     matches none of them looks nowhere. The copy refuses it by the same reading (cc.scopeFault) */
  const scope = cc.scopeFault(rules, files, 'files whose text was read', 'its words were looked for nowhere');
  if (scope) throw new Error(scope + '; nothing was checked');
  let hits;
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
  /* a key the tool does not know is ignored, so its rule checks less than it says: "CI" for "ci" leaves a name in
     lower case unseen; a known key holding the wrong kind of value is quietly read another way (a "suffix" of one
     word instead of a list leaves the plural unseen, a "files" of true limits the rule to paths holding "true").
     Read by the check and by the copy alike, each is a red naming its rule, never what the key holds */
  const lower = [{ file: 'docs/b.md', text: 'we met ' + T.who.toLowerCase() + ', and two ' + T.who + 's' }];
  const keyed = [{ ...good, CI: true }, { ...good, suffix: 's' }, { ...good, files: true }, { ...good, ci: 'yes' }].map(r => fails([r], lower));
  const mapFile = path.join(require('os').tmpdir(), 'private-terms-keys-' + process.pid + '.json');
  let copied = '';
  try { fs.writeFileSync(mapFile, JSON.stringify([{ ...good, CI: true }])); tool().readMap(mapFile); } catch (e) { copied = e.message; } finally { fs.rmSync(mapFile, { force: true }); }
  mark(keyed.concat(copied).every(m => /^rule #3 /.test(m) && m.toLowerCase().indexOf(T.who.toLowerCase()) < 0) && keyed.every(m => /nothing was checked/.test(m)),
    'a rule key in the wrong case or unknown, or a known key holding the wrong kind of value, is a red naming the rule, in the check and in the copy', JSON.stringify(keyed.concat(copied).map(m => m || 'it did not fail')));
  /* a "files" limit that matches none of the files whose text was read (a glob written where a regular expression
     belongs, or one that matches only pictures) looks for its rule's words in no text at all, so they pass */
  const scopeOf = files => fails([good, { id: 6, kind: 'place', rule: 'replace', find: [T.town], to: '[city]', files }],
    [{ file: 'docs/moving-day.md', text: 'The new flat in ' + T.town + ' has two rooms.' }, { file: 'docs/moving-day.png', text: null }]);
  const nowhere = [scopeOf('docs/*.md'), scopeOf('\\.png$')];
  const scoped = check(JSON.stringify([good, { id: 6, kind: 'place', rule: 'replace', find: [T.town], to: '[city]', files: '^docs/.*\\.md$' }]), [{ file: 'docs/moving-day.md', text: 'in ' + T.town }]).hits;
  mark(nowhere.every(m => /^rule #6 /.test(m) && /nothing was checked/.test(m) && m.indexOf(T.town) < 0) && scoped.length === 1 && /^rule #6 /.test(scoped[0]),
    'a "files" limit that matches none of the files read is a red naming its rule; one that matches still checks', JSON.stringify(nowhere.map(m => m || 'it did not fail').concat(scoped)));
  /* a map document with an example in a fenced block above its list: only the first ```json block was read, so
     the check and the copy read the example and never the list (and a list in ~~~json was never read at all) */
  const os = require('os'), lo = T.who.toLowerCase(), sick = 'glim' + 'pox';
  const example = '```json\n[{"id": 0, "kind": "example", "rule": "replace", "find": ["Firstname Lastname"], "to": "[a person]"}]\n```\n';
  const v11 = ['# The private map, v11\n\nA new rule looks like this (copy it into the list below):\n\n' + example + '\n## The list\n\n```json\n' + map + '\n```\n',
    '# The private map\n\n' + example + '\n## The list\n\n~~~json\n' + map + '\n~~~\n'];
  const asMap = (text, fn) => { const f = path.join(os.tmpdir(), 'private-terms-map-' + process.pid + '.md'); try { fs.writeFileSync(f, text); fn(f); return ''; } catch (e) { return e.message; } finally { fs.rmSync(f, { force: true }); } };
  const dinner = [{ file: 'docs/dinner.md', text: '# Notes\n\nDinner with ' + T.who + ' on Friday.\n' }];
  const twice = v11.map(t => asMap(t, () => check(t, dinner))), twiceCopy = v11.map(t => asMap(t, f => tool().readMap(f)));
  mark(twice.every(m => /fenced block/.test(m) && /nothing was checked/.test(m)) && twiceCopy.every(m => /fenced block/.test(m)) && twice.concat(twiceCopy).every(m => m.indexOf(T.who) < 0),
    'a map holding a fenced block beside its list (an example above it) is a red, in the check and in the copy: only the first ```json block would be read', JSON.stringify(twice.concat(twiceCopy).map(m => m || 'it did not fail')));
  /* a repository made here, its git settings kept out (a hook's GIT_DIR would point git at another one) */
  const noGit = fn => { const saved = {}; Object.keys(process.env).filter(k => /^GIT_/.test(k)).forEach(k => { saved[k] = process.env[k]; delete process.env[k]; }); try { return fn(); } finally { Object.assign(process.env, saved); } };
  const lab = files => noGit(() => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'private-terms-lab-'));
    Object.entries(files).forEach(([f, v]) => { const p = path.join(dir, f); fs.mkdirSync(path.dirname(p), { recursive: true }); if (typeof v === 'object' && !Buffer.isBuffer(v)) fs.symlinkSync(v.link, p); else fs.writeFileSync(p, v); });
    execFileSync('git', ['init', '-q'], { cwd: dir, stdio: 'ignore' }); execFileSync('git', ['add', '-A'], { cwd: dir, stdio: 'ignore' });
    return dir;
  });
  /* a tracked entry the check could not open was dropped, name and all: a link to a file on the owner's own disk
     points nowhere on any other machine, and its name and the text git stores for it went unread */
  let linked = { hits: [] };
  const LK = lab({ 'a.md': 'clean words', ['docs/' + lo + '-recipes.md']: { link: '/nowhere/house/recipes.md' }, 'docs/notes.md': { link: '/nowhere/' + T.who + '/notes.md' } });
  try { linked = check(map, noGit(() => trackedFiles(LK))); } catch (e) { linked.err = e.message; } finally { fs.rmSync(LK, { recursive: true, force: true }); }
  mark(linked.files === 3 && linked.hits.length === 2 && /^rule #3 \(partner\): a file name carries it: file 3 in git ls-files order, fingerprint [0-9a-f]{8} /.test(linked.hits[1]) && linked.hits[0] === 'rule #3 (partner) survives at docs/notes.md:1' && linked.hits.every(h => h.toLowerCase().indexOf(lo) < 0),
    'a link git tracks is read by its name and by the text git stores for it, even where it points nowhere', JSON.stringify(linked));
  /* UTF-16 text (what Windows PowerShell 5.1's > writes) has a 0 in every other byte and was taken for a picture */
  const say = 'Standup notes\r\n' + T.who + ' starts at the clinic on Monday, so I am out Tuesday.\r\n';
  const le = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(say, 'utf16le')]), be = Buffer.concat([Buffer.from([0xfe, 0xff]), Buffer.from(say, 'utf16le').swap16()]);
  const UT = lab({ 'docs/standup.txt': le, 'docs/standup-be.txt': be }), box = fs.mkdtempSync(path.join(os.tmpdir(), 'private-terms-copy-'));
  let wide = { hits: [] }, wideCopy = { left: [] }, same = false;
  try {
    wide = check(map, noGit(() => trackedFiles(UT)));
    fs.writeFileSync(path.join(box, 'map.json'), map); fs.writeFileSync(path.join(box, 'allowed.txt'), '^docs/standup\n');
    wideCopy = noGit(() => tool().run(path.join(box, 'map.json'), path.join(box, 'copy'), path.join(box, 'allowed.txt'), UT));
    same = fs.readFileSync(path.join(box, 'copy', 'docs', 'standup.txt')).equals(le);
  } catch (e) { wide.err = e.message; } finally { fs.rmSync(UT, { recursive: true, force: true }); fs.rmSync(box, { recursive: true, force: true }); }
  const wideLines = ['rule #3 (partner) survives at docs/standup-be.txt:2 (a data file, never rewritten; decide it)', 'rule #3 (partner) survives at docs/standup.txt:2 (a data file, never rewritten; decide it)'];
  mark(JSON.stringify(wide.hits) === JSON.stringify(wideLines) && JSON.stringify(wideCopy.left) === JSON.stringify(wideLines) && same,
    'text that starts with a UTF-16 mark is read as text, by the check and by the copy\'s read-back, and copied byte for byte', JSON.stringify([wide.hits, wideCopy.left, wide.err, 'same bytes ' + same]));
  /* a glob read as a regular expression matches by chance: "engine/*.js" matches engine/engine.js through "engine"
     and a run of no slashes, and no other engine file, so the rule looked in one file and passed the rest */
  const glob = { id: 12, kind: 'work', rule: 'drop', find: [T.town + ' Labs'], note: 'An employer was named.', files: 'engine/*.js' };
  const globbed = fails([good, glob], [{ file: 'engine/engine.js', text: 'x' }, { file: 'engine/engine3d.js', text: 'x\n// the fog tuning came from a call with the ' + T.town + ' Labs rendering team' }]);
  const globCopy = tool().ruleFault(glob);
  mark(/^rule #12 has files holding the wrong kind of value .*not a glob/.test(globbed) && /nothing was checked/.test(globbed) && /^has files holding/.test(globCopy) && globbed.indexOf(T.town) < 0,
    'a "files" limit holding a glob\'s folder star is a red naming its rule, in the check and in the copy, even where it matches a file by chance', JSON.stringify([globbed || 'it did not fail', globCopy || 'it did not fail']));
  /* a key written twice in one rule: JSON keeps the last and drops the first without a word ("ci":true then
     "ci":false reads false, and a name in lower case passes); a renamed folder written twice keeps only the last */
  const dupe = ['[{"id":3,"kind":"partner","rule":"replace","find":["' + T.who + '"],"to":"[partner]","ci":true,"note":"nicknames too","ci":false}]',
    '[' + map.slice(1, -1) + ',{"id":8,"kind":"home","rule":"replace","find":["' + lo + '-den"],"to":"[home]","path":{"' + lo + '-den":"den","' + lo + '-den":"den2"}}]'];
  const dupes = dupe.map(t => { try { check(t, [{ file: 'docs/dinner.md', text: '# Notes\n\nDinner with ' + lo + ' on Friday.\n' }]); return ''; } catch (e) { return e.message; } });
  const dupesCopy = dupe.map(t => asMap(t, f => tool().readMap(f)));
  mark(/^rule #3 has a key written twice/.test(dupes[0]) && /^rule #8 has a key written twice/.test(dupes[1]) && dupes.every(m => /nothing was checked/.test(m)) && /^rule #3 has a key written twice/.test(dupesCopy[0]) && /^rule #8 /.test(dupesCopy[1]) && dupes.concat(dupesCopy).every(m => m.toLowerCase().indexOf(lo) < 0),
    'a key written twice in one rule is a red naming the rule, in the check and in the copy: only the last would be read', JSON.stringify(dupes.concat(dupesCopy).map(m => m || 'it did not fail')));
  /* a rule's kind is printed on every line about its rule, so a kind holding a word of the list prints it */
  const kinds = [lo + '-health', lo + '_health', 'health' + lo].map(kind => ({ id: 40, kind, rule: 'drop', find: [sick], note: 'A health detail was raised.' }));
  const kinded = kinds.map(k => fails([good, k], [{ file: 'docs/visiting-week.md', text: '# Visiting week\n\nShe has ' + sick + ', so no feather pillows.\n' }]));
  const kindCopy = kinds.map(k => { try { tool().compile([good, k]); return ''; } catch (e) { return e.message; } });
  mark(kinded.every(m => /^rule #40's kind holds a private detail/.test(m) && /nothing was checked/.test(m)) && kindCopy.every(m => /^rule #40's kind holds/.test(m)) && kinded.concat(kindCopy).every(m => m.toLowerCase().indexOf(lo) < 0)
    && check(JSON.stringify([good, { id: 9, kind: 'schedule', rule: 'drop', find: [sick] }]), [{ file: 'a.md', text: 'clean words' }]).hits.length === 0,
    'a kind that holds a word of the list, as a reader reads it, is a red naming its rule, in the check and in the copy; a kind holding none still checks', JSON.stringify(kinded.concat(kindCopy).map(m => m || 'it did not fail')));
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
