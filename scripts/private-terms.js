#!/usr/bin/env node
/* THE PRIVATE-TERM CHECK — no personal detail enters the public repository in new work.
   The owner, 2026-09-28: the game's work moves to the public repository and carries nothing about
   his personal life. The clean copy was made once, by the private map (scripts/clean-copy.js). This
   is what keeps it clean afterwards: every file and every file name in the repository is read against
   the same map's terms on every push and pull request, and so is every commit the push or the pull request brings
   (--range: its message, who made it, and every line it adds, which stay in the repository's history after a later
   commit takes them out), and any hit fails the build.

   THE TERMS ARE NEVER IN THIS REPOSITORY. CI hands them in as an encrypted repository secret
   (PRIVATE_TERMS: the map's JSON rules, exactly as its ```json block holds them). GitHub masks a secret's
   whole value in logs, not the pieces of it, so this file prints only a rule's number and where it was found: a
   file by its place in git ls-files order and a fingerprint of its path, a commit by its hash, never a file's name or
   a rule's kind, however either is spelt (a name holding a word of the list, in any case and without its accents,
   whole or glued onto other letters or a digit, is a red too). And it never lets an error message through: Node's own JSON and regular-expression errors
   quote their input, which here would be the owner's details on a public log.

   Where the secret is absent (a pull request from a fork gets no secrets), this FAILS rather than passing
   on nothing: a fork's work is brought into a branch of this repository by a session that reviews it,
   and the check runs there (docs/PRIVACY.md). A run that read no file, a list with no word or pattern to
   look for, and a single rule that is not exactly keep, replace or drop, or has no word or pattern of its
   own, FAIL too: a check that read nothing must not look like a pass. So does a rule with a key the tool does
   not know or in the wrong case ("CI" for "ci"), or a known key holding the wrong kind of value, which would be
   ignored or read another way, or a key written twice, of which only the last would be read; a rule whose "files"
   limit matches none of the files whose text was read, which would look for its words nowhere, or holds a glob's
   /* or a star right after a letter, which matches by chance; a term holding a no-break space, an invisible character
   or a tab, and a pattern with its backslashes written twice, which match no ordinary text; a kind that holds a detail
   of the list; a map holding a fenced block beside its list, or rule text outside it, whose first ```json block would
   be read in the list's place; a range of commits that holds none; and a run on CI not told which commits to read.
   Every entry git lists is read by what git stores for it, whatever its name's bytes (a link by its target), and by
   its copy on disk where that differs; UTF-16 text is text, with its mark or without. The OK line counts only the
   rules that look for something.

   Run:  PRIVATE_TERMS="$(cat map.json)" node scripts/private-terms.js --range <base> <head>     (as CI runs it)
         node scripts/private-terms.js --map <file outside the repository> [--range <base> <head>]
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
  /* the list is the map's only fenced block and its only rule text (cc.listText): beside an example above it, or
     pasted outside the block under one, the first ```json block would be read in its place */
  const list = cc.listText(text);
  if (list === null) throw new Error('the private list holds a fenced block beside its ```json list (an example, or a second list), or rule text outside it, and only the first ```json block would be read; nothing was checked');
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

/* git, its output as bytes; nothing it says on its error stream is printed (it can quote a name) */
const git = (root, args, input) => execFileSync('git', args, { cwd: root, input, maxBuffer: 1024 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
const splitAt = (b, c) => { const out = []; let a = 0; for (let i = b.indexOf(c); i >= 0; i = b.indexOf(c, a)) { out.push(b.subarray(a, i)); a = i + 1; } if (a < b.length) out.push(b.subarray(a)); return out; };
const split0 = b => splitAt(b, 0);
/* what git stores under each id (git cat-file --batch), as bytes; an id git does not have is left out */
function readBlobs(root, ids) {
  const want = [...new Set(ids)], got = new Map();
  if (!want.length) return got;
  const out = git(root, ['cat-file', '--batch'], want.join('\n') + '\n');
  let at = 0;
  for (const id of want) {
    const nl = out.indexOf(10, at);
    if (nl < 0) break;
    const head = out.subarray(at, nl).toString('latin1').split(' ');
    at = nl + 1;
    if (head.length !== 3 || !/^\d+$/.test(head[2])) continue;
    const size = Number(head[2]);
    got.set(id, out.subarray(at, at + size)); at += size + 1;
  }
  return got;
}
/* a name as git stores it is bytes: read for its words as UTF-8, or as Latin-1 where it is not UTF-8 (what unzipping
   an archive made on Windows leaves); its fingerprint is taken from it read as UTF-8 (from), as FIND_HINT's lookup reads it */
const nameOf = b => { const s = b.toString('utf8'); return Buffer.from(s, 'utf8').equals(b) ? s : b.toString('latin1'); };

function trackedFiles(root) {
  const cc = tool();
  /* every entry git lists (git ls-files -s: its mode, the id of what git stores, its name as bytes) is read by what git
     stores for it, whatever its name's bytes and whatever it is checked out as (a working-tree-encoding line turns the
     UTF-8 git stores, which GitHub shows, into UTF-16 or UTF-32 on disk): a link by its target, never by what it points
     at, and a submodule (160000) by its name alone. Where the copy on disk differs (an edit not yet staged, or text
     checked out in another encoding) that copy is read too, under the same place. Text in UTF-16 is text (cc.textOf).
     n: its place in git ls-files order, the only way a report names a file */
  const entries = split0(git(root, ['ls-files', '-z', '-s'])).filter(b => b.length).map(b => {
    const tab = b.indexOf(9), [mode, id] = b.subarray(0, tab).toString('latin1').split(' ');
    return { mode, id, name: b.subarray(tab + 1) };
  });
  const stored = readBlobs(root, entries.filter(e => e.mode !== '160000').map(e => e.id));
  const files = [];
  entries.forEach((e, i) => {
    const file = nameOf(e.name), from = e.name.toString('utf8'), n = i + 1, blob = e.mode === '160000' ? null : stored.get(e.id) || null;
    files.push({ file, from, n, text: blob ? cc.textOf(blob) : null });
    let disk = null;
    try { const p = Buffer.concat([Buffer.from(root + '/'), e.name]), st = fs.lstatSync(p); disk = st.isSymbolicLink() ? fs.readlinkSync(p, { encoding: 'buffer' }) : st.isFile() ? fs.readFileSync(p) : null; } catch (err) { disk = null; }
    if (disk && !(blob && disk.equals(blob))) files.push({ file, from, n, text: cc.textOf(disk), nameRead: false, again: true, label: 'the copy on disk of file ' + n + ' in git ls-files order, fingerprint ' + cc.fingerprint(from) });
  });
  return files;
}

/* EVERY CHANGE a push or a pull request brings (base..head), not only the tree it ends at: a detail said only in a
   commit's message, or in its author's or committer's name, or added by one commit and taken out by the next, stays in
   the repository's history. Each commit's message is read, and who made it (its author's and committer's name and
   address), and each file it adds or changes as that commit left it, by what git stores, for the lines it added (a line
   none of its parents held: a merge adds only what no side had, and a line a commit kept was read where it was added);
   a file a commit adds is read by its name too. A "files" limit reads the files it names, and no message or name of
   who made a commit.
   A BASE WITH NO PARENT is the first commit of a history: the build hands it in on a repository's first push, when
   there is no earlier commit (.github/workflows/ci.yml). base..head leaves its base out, and a new repository's first
   commit is the whole game, so then every commit the head holds is read, the base among them; a one-commit first push
   (base and head both that commit) is read, not refused as holding none (planted 2026-10-18). A base with a
   parent is read as before, base..head: what came before it was read when it arrived. Whether the base has a parent is
   asked of the commit itself, with replace refs off, not of git's walk: a shallow clone's cut point has parents the
   clone does not hold, the walk calls it parentless, and a base at a cut was read again as a first commit (planted
   2026-10-18) */
function historyFiles(root, base, head) {
  const cc = tool(), short = sha => sha.slice(0, 8);
  const obj = git(root, ['--no-replace-objects', 'cat-file', 'commit', '--end-of-options', base + '^{commit}']).toString('latin1'), end = obj.indexOf('\n\n');
  const first = !/^parent /m.test(end < 0 ? obj : obj.slice(0, end));
  const range = first ? head : base + '..' + head;
  const revs = git(root, ['rev-list', '--reverse', '--parents', '--end-of-options', range]).toString('latin1').split('\n').filter(Boolean).map(l => l.split(' '));
  const said = new Map(split0(git(root, ['log', '-z', '--no-show-signature', '--format=%H%n%B', '--end-of-options', range])).map(b => { const nl = b.indexOf(10); return [b.subarray(0, nl).toString('latin1'), b.subarray(nl + 1).toString('utf8')]; }));
  /* who made each commit: its author's name and address and its committer's, which are in no diff and stay in the
     history with it, read from the commit as git stores it (its author and committer lines, as UTF-8 or as Latin-1
     where they are not UTF-8), never printed. Not through a format string: test/authors.js is the one script that asks
     git for a name or an address that way, and it reads every other for one */
  const objects = readBlobs(root, revs.map(([sha]) => sha));
  const made = sha => {
    const b = objects.get(sha);
    if (!b) return '';
    const end = b.indexOf('\n\n'), out = [];
    splitAt(b.subarray(0, end < 0 ? b.length : end), 10).forEach(l => {
      const kw = l.indexOf(32), key = kw < 0 ? '' : l.subarray(0, kw).toString('latin1');
      if (key !== 'author' && key !== 'committer') return;
      const id = nameOf(l.subarray(kw + 1)), m = id.match(/^(.*) <([^>]*)> \d+ [+-]\d{4}$/);
      out.push(...(m ? [m[1], m[2]] : [id]));
    });
    return out.join('\n');
  };
  const raw = args => {
    const parts = split0(git(root, ['diff-tree', '-r', '-z', '--raw', '--no-abbrev', '--no-renames', '--no-commit-id', ...args])), m = new Map();
    for (let k = 0; k + 1 < parts.length; k += 2) { const [om, nm, oi, ni] = parts[k].toString('latin1').replace(/^:/, '').split(' '); m.set(parts[k + 1].toString('latin1'), { om, nm, oi, ni, name: parts[k + 1] }); }
    return m;
  };
  /* what each commit changed against every parent at once (a root commit, against nothing) */
  const changed = revs.map(([sha, ...parents]) => {
    const per = parents.length ? parents.map(p => raw([p, sha])) : [raw(['--root', sha])];
    return [...per[0]].filter(([key, x]) => x.nm !== '000000' && per.every(m => m.has(key))).map(([key, x]) => ({ name: x.name, mode: x.nm, id: x.ni, olds: per.map(m => ({ mode: m.get(key).om, id: m.get(key).oi })) }));
  });
  const isBlob = x => x.mode !== '000000' && x.mode !== '160000' && !/^0+$/.test(x.id);
  const blobs = readBlobs(root, changed.flat().flatMap(c => [c, ...c.olds]).filter(isBlob).map(x => x.id));
  const textAt = x => isBlob(x) && blobs.has(x.id) ? cc.textOf(blobs.get(x.id)) : null;
  const entries = [];
  revs.forEach(([sha], i) => {
    entries.push({ file: null, text: said.get(sha) || '', label: 'the message of commit ' + short(sha) });
    entries.push({ file: null, text: made(sha), label: 'the author or committer of commit ' + short(sha) });
    changed[i].forEach(c => {
      const text = textAt(c), added = c.olds.every(o => o.mode === '000000'), lines = new Set();
      if (text != null) {
        const kept = new Map();
        c.olds.forEach(o => { const seen = new Map(); (textAt(o) || '').split('\n').forEach(l => seen.set(l, (seen.get(l) || 0) + 1)); seen.forEach((v, l) => kept.set(l, Math.max(kept.get(l) || 0, v))); });
        text.split('\n').forEach((l, k) => { const left = kept.get(l) || 0; if (left) kept.set(l, left - 1); else lines.add(k + 1); });
      }
      if (!lines.size && !added) return;
      const from = c.name.toString('utf8');
      entries.push({ file: nameOf(c.name), from, text: lines.size ? text : null, lines, nameRead: added, label: 'the file commit ' + short(sha) + ' adds or changes, fingerprint ' + cc.fingerprint(from) });
    });
  });
  return { entries, commits: revs.length, first };
}

/* history: what historyFiles read, or null where no range was given (a run on a person's own clone) */
function check(text, files, history = null) {
  const rules = rulesFrom(text);
  if (!files.length) throw new Error('not one file was read (git listed none, or none could be opened); nothing was checked');
  if (history && !history.commits) throw new Error('the range of commits it was given holds no commit, so no change a push or a pull request brings was read; nothing was checked');
  const cc = tool();
  /* a rule limited by "files" looks for its words only in the text of the paths that limit matches: one that
     matches none of them looks nowhere. The copy refuses it by the same reading (cc.scopeFault) */
  const scope = cc.scopeFault(rules, files, 'files whose text was read', 'its words were looked for nowhere');
  if (scope) throw new Error(scope + '; nothing was checked');
  /* bare: every line names a file by its place and fingerprint and a rule by its number, never a name or a kind */
  let hits;
  try { hits = cc.survivors(files.concat(history ? history.entries : []), rules, true); }
  catch (e) { throw new Error('the private list could not be applied (a rule is malformed); nothing was checked'); }
  /* rules: only the ones that look for something; a keep rule records a decision and checks nothing. files: the
     entries git lists, each once (a copy on disk read beside one is not another) */
  return { rules: rules.filter(r => r.rule !== 'keep').length, files: files.filter(f => !f.again).length, commits: history ? history.commits : null, first: !!(history && history.first), hits };
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
  mark(r.hits.length === 1 && /^rule #3 survives at line 2 of file 1 in git ls-files order, fingerprint [0-9a-f]{8} \(no name is printed on a public log\)$/.test(r.hits[0]) && r.hits[0].indexOf(T.who.toLowerCase()) < 0, 'a term in new work is red, named by rule number, line and the file\'s place, never by the term', JSON.stringify(r.hits));
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
  mark(linked.files === 3 && linked.hits.length === 2 && /^rule #3: a file name carries it: file 3 in git ls-files order, fingerprint [0-9a-f]{8} /.test(linked.hits[1]) && linked.hits[0] === 'rule #3 survives at line 1 of file 2 in git ls-files order, fingerprint ' + CC.fingerprint('docs/notes.md') + ' (no name is printed on a public log)' && linked.hits.every(h => h.toLowerCase().indexOf(lo) < 0),
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
  const wideBare = ['docs/standup-be.txt', 'docs/standup.txt'].map((f, k) => 'rule #3 survives at line 2 of file ' + (k + 1) + ' in git ls-files order, fingerprint ' + CC.fingerprint(f) + ' (no name is printed on a public log)');
  mark(JSON.stringify(wide.hits) === JSON.stringify(wideBare) && JSON.stringify(wideCopy.left) === JSON.stringify(wideLines) && same,
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
  /* ROUND 3. The check read only the final tree: a detail said only in a commit's message, or added by one commit and
     taken out by the next, passed, though every commit a pull request brings stays in the repository's history. Run
     as CI runs it (--range), in a repository made here with the check's own two files in it */
  const sh = (dir, args, input) => execFileSync('git', ['-c', 'user.name=lab', '-c', 'user.email=lab@example.com', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args],
    { cwd: dir, env: Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_/.test(k))), input, encoding: 'utf8', stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'ignore'] }).trim();
  const HR = fs.mkdtempSync(path.join(os.tmpdir(), 'private-terms-history-')), hmap = path.join(os.tmpdir(), 'private-terms-history-' + process.pid + '.json');
  const hcli = (args, ci) => { const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_/.test(k) && k !== 'GITHUB_ACTIONS')); if (ci) env.GITHUB_ACTIONS = 'true';
    try { return { code: 0, out: execFileSync(process.execPath, [path.join(HR, 'scripts', 'private-terms.js'), '--map', hmap, ...args], { cwd: HR, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; }
    catch (e) { return { code: e.status, out: String(e.stdout || '') }; } };
  let hist = {}, who = {};
  try {
    fs.mkdirSync(path.join(HR, 'scripts')); fs.mkdirSync(path.join(HR, 'docs'));
    ['private-terms.js', 'clean-copy.js'].forEach(f => fs.copyFileSync(path.join(__dirname, f), path.join(HR, 'scripts', f)));
    fs.writeFileSync(hmap, JSON.stringify([{ id: 3, kind: 'partner', rule: 'replace', find: [T.who], to: '[partner]', ci: true }, { id: 4, kind: 'health', rule: 'drop', find: [sick], note: 'A health detail was raised.' },
      { id: 5, kind: 'place', rule: 'replace', find: [T.town], to: '[city]' }]));
    const city = path.join(HR, 'docs', 'CITY.md'), meal = path.join(HR, 'docs', 'dinner.md');
    fs.writeFileSync(city, '# The city\n'); sh(HR, ['init', '-q']); sh(HR, ['add', '-A']); sh(HR, ['commit', '-qm', 'the city']);
    const c0 = sh(HR, ['rev-parse', 'HEAD']);
    fs.appendFileSync(city, '\nTwo bridges.\n'); sh(HR, ['commit', '-qam', 'bridges']);
    const c1 = sh(HR, ['rev-parse', 'HEAD']);
    fs.appendFileSync(city, '\n- The guest room sleeps two.\n'); sh(HR, ['commit', '-qam', 'Guest room for ' + T.who + '\'s visit in ' + T.town]);
    const c2 = sh(HR, ['rev-parse', 'HEAD']);
    fs.writeFileSync(meal, '# Dinner\n\nDinner with ' + T.who + ' on Friday; she has ' + sick + ', so no shellfish.\n'); sh(HR, ['add', '-A']); sh(HR, ['commit', '-qm', 'dinner']);
    const c3 = sh(HR, ['rev-parse', 'HEAD']);
    fs.writeFileSync(meal, '# Dinner\n\nFriday.\n'); sh(HR, ['commit', '-qam', 'trim the dinner note']);
    /* clean: c0 is the first commit, so it is read with c1 (2026-10-18) */
    hist = { c2: c2.slice(0, 8), c3: c3.slice(0, 8), tree: hcli([]), clean: hcli(['--range', c0, c1]), red: hcli(['--range', c1, 'HEAD']), empty: hcli(['--range', 'HEAD', 'HEAD']), ci: hcli([], true) };
    /* ROUND 4. Who made a commit (its author's and committer's name and address) is in no diff and stays in the history
       with it, and was never read: a clean message and clean lines by an author or a committer named with a detail passed */
    const c4 = sh(HR, ['rev-parse', 'HEAD']);
    fs.appendFileSync(city, '\nA ferry on Sundays.\n'); sh(HR, ['commit', '-qam', 'ferry', '--author=' + T.who + ' from ' + T.town + ' <1+lab@users.noreply.github.com>']);
    const a1 = sh(HR, ['rev-parse', 'HEAD']);
    fs.appendFileSync(city, '\nA market on Mondays.\n'); sh(HR, ['-c', 'user.name=' + T.town + ' builds', 'commit', '-qam', 'market', '--author=lab <lab@example.com>']);
    const a2 = sh(HR, ['rev-parse', 'HEAD']);
    fs.appendFileSync(city, '\nA library on Tuesdays.\n'); sh(HR, ['commit', '-qam', 'library', '--author=lab <' + lo + '.home@example.com>']);
    const a3 = sh(HR, ['rev-parse', 'HEAD']);
    who = { a1: a1.slice(0, 8), a2: a2.slice(0, 8), a3: a3.slice(0, 8), run: hcli(['--range', c4, 'HEAD']) };
  } catch (e) { hist.err = e.message; } finally { fs.rmSync(HR, { recursive: true, force: true }); fs.rmSync(hmap, { force: true }); }
  const meant = hist.c2 ? ['rule #3 survives at line 1 of the message of commit ' + hist.c2, 'rule #5 survives at line 1 of the message of commit ' + hist.c2,
    'rule #3 survives at line 3 of the file commit ' + hist.c3 + ' adds or changes, fingerprint ' + CC.fingerprint('docs/dinner.md') + ' (no name is printed on a public log)',
    'rule #4 survives at line 3 of the file commit ' + hist.c3 + ' adds or changes, fingerprint ' + CC.fingerprint('docs/dinner.md') + ' (no name is printed on a public log)'] : [];
  const histOut = ['tree', 'clean', 'red', 'empty', 'ci'].map(k => (hist[k] || {}).out || '').join('\n');
  const hc = k => hist[k] || { code: null, out: '' };
  mark(hc('tree').code === 0 && hc('clean').code === 0 && /and the messages and changes of 2 commit\(s\) \(every commit the head holds, the first one included/.test(hc('clean').out) && hc('red').code === 1 && /^FAIL: 4 /m.test(hc('red').out) && meant.every(l => hc('red').out.split('\n').includes('- ' + l))
    && hc('empty').code === 1 && /holds no commit/.test(hc('empty').out) && hc('ci').code === 1 && /--range/.test(hc('ci').out) && histOut.toLowerCase().indexOf(lo) < 0 && histOut.indexOf(T.town) < 0 && histOut.indexOf(sick) < 0,
    'a detail said only in a commit\'s message, or added by one commit and taken out by the next, is a red when the check is given the commits (--range); an empty range, and a run on CI without one, are reds too',
    JSON.stringify({ err: hist.err, codes: ['tree', 'clean', 'red', 'empty', 'ci'].map(k => hc(k).code), red: histOut.replace(new RegExp(T.who, 'gi'), '<who>').replace(new RegExp(T.town, 'g'), '<town>').replace(new RegExp(sick, 'g'), '<sick>').split('\n').filter(l => /^(OK|FAIL|- rule)/.test(l)) }));
  const byWho = who.a1 ? ['rule #3 survives at line 1 of the author or committer of commit ' + who.a1, 'rule #5 survives at line 1 of the author or committer of commit ' + who.a1,
    'rule #5 survives at line 3 of the author or committer of commit ' + who.a2, 'rule #3 survives at line 2 of the author or committer of commit ' + who.a3] : [];
  const whoRun = who.run || { code: null, out: '' };
  mark(whoRun.code === 1 && /^FAIL: 4 /m.test(whoRun.out) && byWho.every(l => whoRun.out.split('\n').includes('- ' + l)) && /^A detail in a commit's message, in the name or address of who made it/m.test(whoRun.out)
    && whoRun.out.toLowerCase().indexOf(lo) < 0 && whoRun.out.toLowerCase().indexOf(T.town.toLowerCase()) < 0,
    'a detail in the name or address of a commit\'s author or committer, with a clean message and clean lines, is a red when the check is given the commits (--range), and is not printed',
    JSON.stringify({ err: hist.err, code: whoRun.code, out: whoRun.out.replace(new RegExp(T.who, 'gi'), '<who>').replace(new RegExp(T.town, 'gi'), '<town>').split('\n').filter(l => /^(OK|FAIL|- |A detail)/.test(l)).map(l => l.slice(0, 120)) }));
  /* ROUND 5 (2026-10-18). A first push: the build hands in the first commit as the base when there is no earlier commit, and
     base..head leaves its base out, so a new repository's first commit (its message, and a line it added that the next
     commit took out) was never read, and a one-commit first push was refused as holding no commit. In throwaway
     repositories made here, each with the check's own two files in its first commit, as a new repository's would be */
  const FR = fs.mkdtempSync(path.join(os.tmpdir(), 'private-terms-first-push-')), fmap = path.join(FR, 'map.json');
  const fcli = (dir, args) => { const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_/.test(k) && k !== 'GITHUB_ACTIONS'));
    try { return { code: 0, out: execFileSync(process.execPath, [path.join(dir, 'scripts', 'private-terms.js'), '--map', fmap, ...args], { cwd: dir, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; }
    catch (e) { return { code: e.status, out: String(e.stdout || '') }; } };
  let fpush = {};
  try {
    fs.writeFileSync(fmap, JSON.stringify([{ id: 3, kind: 'partner', rule: 'replace', find: [T.who], to: '[partner]', ci: true }, { id: 5, kind: 'place', rule: 'replace', find: [T.town], to: '[city]' }]));
    const game = '# A new game\n\nA kitchen and a board.\n';
    const fresh = (name, text, msg) => { const d = path.join(FR, name); fs.mkdirSync(path.join(d, 'scripts'), { recursive: true }); fs.mkdirSync(path.join(d, 'docs'));
      ['private-terms.js', 'clean-copy.js'].forEach(f => fs.copyFileSync(path.join(__dirname, f), path.join(d, 'scripts', f)));
      fs.writeFileSync(path.join(d, 'docs', 'GAME.md'), text); sh(d, ['init', '-q']); sh(d, ['add', '-A']); sh(d, ['commit', '-qm', msg]); return [d, sh(d, ['rev-parse', 'HEAD'])]; };
    const [one, r1] = fresh('one', game, 'the first commit');
    const [dirty, r2] = fresh('dirty', game, 'the first commit, made for ' + T.who);
    const [two, r3] = fresh('two', game + 'The first tasting is in ' + T.town + '.\n', 'the first commit, made for ' + T.who);
    fs.writeFileSync(path.join(two, 'docs', 'GAME.md'), game); sh(two, ['commit', '-qam', 'trim the note']);
    const b = sh(two, ['rev-parse', 'HEAD']);
    fpush = { r2: r2.slice(0, 8), r3: r3.slice(0, 8), one: fcli(one, ['--range', r1, r1]), dirty: fcli(dirty, ['--range', r2, r2]), two: fcli(two, ['--range', r3, 'HEAD']) };
    fs.appendFileSync(path.join(two, 'docs', 'GAME.md'), '\nA second board.\n'); sh(two, ['commit', '-qam', 'a second board']);
    fpush.later = fcli(two, ['--range', b, 'HEAD']);
    /* shallow (2026-10-18): the base is the cut point of a one-commit-deep clone, whose message holds the word; it has a
       parent the clone does not hold, so it is not a first commit, and only the commit after it is read */
    const [src] = fresh('src', game, 'the first commit');
    fs.appendFileSync(path.join(src, 'docs', 'GAME.md'), '\nA third board.\n'); sh(src, ['commit', '-qam', 'a board for ' + T.who]);
    const cut = path.join(FR, 'shallow'), tip = 'origin/' + sh(src, ['symbolic-ref', '--short', 'HEAD']);
    sh(FR, ['clone', '-q', '--depth', '1', 'file://' + src, cut]);
    fs.appendFileSync(path.join(cut, 'docs', 'GAME.md'), '\nA fourth board.\n'); sh(cut, ['commit', '-qam', 'a fourth board']);
    fpush.isShallow = sh(cut, ['rev-parse', '--is-shallow-repository']) === 'true' && /^parent /m.test(sh(cut, ['cat-file', 'commit', tip]));
    fpush.shallow = fcli(cut, ['--range', tip, 'HEAD']);
  } catch (e) { fpush.err = e.message; } finally { fs.rmSync(FR, { recursive: true, force: true }); }
  const fc = k => fpush[k] || { code: null, out: '' }, fpOut = ['one', 'dirty', 'two', 'later'].map(k => fc(k).out).join('\n');
  const fpWhy = () => JSON.stringify({ err: fpush.err, codes: ['one', 'dirty', 'two', 'later'].map(k => fc(k).code), out: fpOut.replace(new RegExp(T.who, 'gi'), '<who>').replace(new RegExp(T.town, 'gi'), '<town>').split('\n').filter(l => /^(OK|FAIL|- rule)/.test(l)).map(l => l.slice(0, 140)) }).replace(new RegExp(T.who, 'gi'), '<who>').replace(new RegExp(T.town, 'gi'), '<town>');
  const rootHits = fpush.r3 ? ['rule #3 survives at line 1 of the message of commit ' + fpush.r3,
    'rule #5 survives at line 4 of the file commit ' + fpush.r3 + ' adds or changes, fingerprint ' + CC.fingerprint('docs/GAME.md') + ' (no name is printed on a public log)'] : [];
  mark(fc('one').code === 0 && /and the messages and changes of 1 commit\(s\) \(every commit the head holds, the first one included/.test(fc('one').out)
    && fc('dirty').code === 1 && /^FAIL: 1 /m.test(fc('dirty').out) && fc('dirty').out.split('\n').includes('- rule #3 survives at line 1 of the message of commit ' + fpush.r2)
    && fc('two').code === 1 && /^FAIL: 2 /m.test(fc('two').out) && rootHits.every(l => fc('two').out.split('\n').includes('- ' + l))
    && fpOut.toLowerCase().indexOf(T.who.toLowerCase()) < 0 && fpOut.indexOf(T.town) < 0,
    'a first push is read in full when the build hands in the first commit as the base: a one-commit first push is read, not refused, and a detail in the first commit\'s message, or in a line it added that the next commit took out, is a red', fpWhy());
  mark(fc('later').code === 0 && /and the messages and changes of 1 commit\(s\),/.test(fc('later').out),
    'a base with a parent reads only the commits after it: the first commit, read when it arrived, is not read again', fpWhy());
  mark(fpush.isShallow === true && fc('shallow').code === 0 && /and the messages and changes of 1 commit\(s\),/.test(fc('shallow').out) && fc('shallow').out.toLowerCase().indexOf(T.who.toLowerCase()) < 0,
    'a shallow clone\'s cut point is not a first commit: a base at the cut reads only the commits after it, not the cut again',
    JSON.stringify({ err: fpush.err, isShallow: fpush.isShallow, code: fc('shallow').code, out: fc('shallow').out.split('\n').filter(l => /^(OK|FAIL|- rule)/.test(l)).map(l => l.slice(0, 140)) }).replace(new RegExp(T.who, 'gi'), '<who>'));
  /* a map whose list is not in a fence, under a ```json example (or the list indented four spaces, markdown's other
     code block): the example, the map's only fenced block, was read in the list's place, by the check and the copy */
  const ex12 = '```json\n[{"id": 0, "kind": "example", "rule": "replace", "find": ["Name Surname"], "to": "[a person]"}]\n```\n', listed = JSON.stringify(JSON.parse(map), null, 2);
  const v12 = ['# The private map, v12\n\nA new rule looks like this:\n\n' + ex12 + '\n## The list\n\n' + listed + '\n',
    '# The private map, v12\n\nA new rule looks like this:\n\n' + ex12 + '\n## The list\n\n' + listed.split('\n').map(l => '    ' + l).join('\n') + '\n'];
  const outside = v12.map(t => asMap(t, () => check(t, dinner))), outsideCopy = v12.map(t => asMap(t, f => tool().readMap(f))), plainList = check(map, dinner).hits;
  mark(outside.every(m => /rule text outside it/.test(m) && /nothing was checked/.test(m)) && outsideCopy.every(m => /rule text outside it/.test(m)) && plainList.length === 1 && outside.concat(outsideCopy).every(m => m.indexOf(T.who) < 0),
    'a map holding rule text outside its one fenced block (the list pasted as plain lines, or indented, under an example) is a red, in the check and in the copy; a plain JSON list still reads', JSON.stringify(outside.concat(outsideCopy).map(m => m || 'it did not fail').concat(plainList)));
  /* a term holding a no-break space (pasted from a word processor) or an invisible character matched only text holding
     the same one, and the OK line still counted its rule as one that looks for something */
  const isle = ['Zib', 'Marrow'], trip = [{ file: 'docs/trip.md', text: '# Trip\n\nWe sailed to ' + isle.join(' ') + ' in May.\n' }];
  const spaced = sp => ({ id: 6, kind: 'place', rule: 'replace', find: [isle.join(sp)], to: '[city]' });
  const unseen = [' ', '​', '\t'].map(sp => fails([good, spaced(sp)], trip)), unseenCopy = [' ', '​', '\t'].map(sp => tool().ruleFault(spaced(sp)));
  const plainSpace = check(JSON.stringify([good, spaced(' ')]), trip).hits;
  mark(unseen.every(m => /^rule #6 has find holding a no-break space/.test(m) && /nothing was checked/.test(m)) && unseenCopy.every(m => /^has find holding a no-break space/.test(m)) && plainSpace.length === 1 && /^rule #6 /.test(plainSpace[0]),
    'a term holding a no-break space, an invisible character or a tab is a red naming its rule, in the check and in the copy; the same term with a plain space still finds the text', JSON.stringify(unseen.concat(unseenCopy).map(m => m || 'it did not fail').concat(plainSpace)));
  /* UTF-16 written with no mark (what Python's utf-16-le writes) was still taken for a picture, and text git stores as
     UTF-8 but checks out in another encoding (a working-tree-encoding line) was read only as checked out, never as stored */
  const u32 = s => { const b = Buffer.alloc(s.length * 4); [...s].forEach((ch, k) => b.writeUInt32LE(ch.codePointAt(0), k * 4)); return b; };
  const bare16 = Buffer.from(say, 'utf16le'), UN = lab({ '.gitattributes': 'docs/stored/*.txt working-tree-encoding=UTF-32LE\n', 'docs/standup.txt': bare16, 'docs/standup-be.txt': Buffer.from(bare16).swap16(), 'docs/stored/standup.txt': u32(say) });
  const box16 = fs.mkdtempSync(path.join(os.tmpdir(), 'private-terms-copy-'));
  let unmarked = { hits: [] }, unmarkedCopy = { left: [] }, same16 = false;
  try {
    unmarked = check(map, noGit(() => trackedFiles(UN)));
    fs.writeFileSync(path.join(box16, 'map.json'), map); fs.writeFileSync(path.join(box16, 'allowed.txt'), '^docs/standup\n');
    unmarkedCopy = noGit(() => tool().run(path.join(box16, 'map.json'), path.join(box16, 'copy'), path.join(box16, 'allowed.txt'), UN));
    same16 = fs.readFileSync(path.join(box16, 'copy', 'docs', 'standup.txt')).equals(bare16);
  } catch (e) { unmarked.err = e.message; } finally { fs.rmSync(UN, { recursive: true, force: true }); fs.rmSync(box16, { recursive: true, force: true }); }
  const at16 = (k, f) => 'rule #3 survives at line 2 of file ' + k + ' in git ls-files order, fingerprint ' + CC.fingerprint(f) + ' (no name is printed on a public log)';
  mark(JSON.stringify(unmarked.hits) === JSON.stringify([at16(2, 'docs/standup-be.txt'), at16(3, 'docs/standup.txt'), at16(4, 'docs/stored/standup.txt')]) && same16
    && JSON.stringify(unmarkedCopy.left) === JSON.stringify(['rule #3 (partner) survives at docs/standup-be.txt:2 (a data file, never rewritten; decide it)', 'rule #3 (partner) survives at docs/standup.txt:2 (a data file, never rewritten; decide it)']),
    'UTF-16 with no mark is read as text by the check and the copy\'s read-back, either way round, and text is read as git stores it, whatever it is checked out as', JSON.stringify([unmarked.hits, unmarkedCopy.left, unmarked.err, 'same bytes ' + same16]));
  /* a tracked name that is not UTF-8 (what unzipping an archive made on Windows leaves) was decoded with U+FFFD, the
     file could not be opened by that name, and its text went unread; a name in Latin-1 is read as Latin-1 for its words */
  const acc = 'Bra' + 'ñoville', L1 = lab({ 'a.md': 'clean words' });
  const latin = [[Buffer.from('docs/' + acc + '-trip.md', 'latin1'), 'Two weeks away.\n'], [Buffer.from('docs/résumé-for-the-visa.md', 'latin1'), '# Notes\n\nDinner with ' + T.who + ' on Friday, then the visa office.\n']];
  let named1 = { hits: [] };
  try {
    latin.forEach(([name, body]) => { const id = sh(L1, ['hash-object', '-w', '--stdin'], body); execFileSync('git', ['update-index', '--add', '-z', '--index-info'], { cwd: L1, env: Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_/.test(k))), input: Buffer.concat([Buffer.from('100644 ' + id + '\t'), name, Buffer.from([0])]), stdio: ['pipe', 'ignore', 'ignore'] }); });
    named1 = check(JSON.stringify([good, { id: 6, kind: 'place', rule: 'replace', find: [acc], to: '[city]' }]), noGit(() => trackedFiles(L1)));
  } catch (e) { named1.err = e.message; } finally { fs.rmSync(L1, { recursive: true, force: true }); }
  const fpOf = b => CC.fingerprint(b.toString('utf8'));
  mark(JSON.stringify(named1.hits) === JSON.stringify(['rule #6: a file name carries it: file 2 in git ls-files order, fingerprint ' + fpOf(latin[0][0]) + ' (no name is printed on a public log)', 'rule #3 survives at line 3 of file 3 in git ls-files order, fingerprint ' + fpOf(latin[1][0]) + ' (no name is printed on a public log)']),
    'an entry whose name is not UTF-8 is read by what git stores, and its name is read for words as Latin-1', JSON.stringify([named1.hits, named1.err]));
  /* a glob with no folder star ("engine/engine*.js") read as a regular expression matches engine/engine.js by chance
     and no other engine file: a star right after a letter, a digit, _ or - is a glob's, and is refused */
  const glob2 = { id: 12, kind: 'work', rule: 'drop', find: [T.town + ' Labs'], note: 'An employer was named.', files: 'engine/engine*.js' };
  const globbed2 = fails([good, glob2], [{ file: 'engine/engine.js', text: 'x' }, { file: 'engine/engine3d.js', text: 'x\n// the fog tuning came from a call with the ' + T.town + ' Labs rendering team' }]);
  const keptRe = ['^docs/.*\\.md$', '\\.(md|txt)$', '^test/x\\d*\\.js$'].map(files => tool().ruleFault({ ...glob2, files }));
  mark(/^rule #12 has files holding the wrong kind of value/.test(globbed2) && /nothing was checked/.test(globbed2) && /^has files holding/.test(tool().ruleFault(glob2)) && keptRe.every(m => m === '') && globbed2.indexOf(T.town) < 0,
    'a "files" limit holding a glob\'s star after a letter is a red naming its rule, in the check and in the copy; a regular expression\'s star still reads', JSON.stringify([globbed2 || 'it did not fail', tool().ruleFault(glob2) || 'it did not fail'].concat(keptRe)));
  /* a pattern copied out of a JavaScript string into JSON keeps its backslashes doubled: "\\d" is a backslash and a d,
     which matches no time at all, and the rule was counted as one that looks for something */
  const timed = p => ({ id: 9, kind: 'schedule', rule: 'drop', pattern: [p], note: 'A time was given.' }), twice2 = '\\\\b\\\\d{1,2}:\\\\d{2} ?UTC\\\\b', once2 = '\\b\\d{1,2}:\\d{2} ?UTC\\b';
  const tuesday = [{ file: 'docs/standup/tuesday.md', text: '# Tuesday\n\nI am at the clinic until 0' + '9:30 UTC, then on.\n' }];
  const doubled = fails([good, timed(twice2)], tuesday), onceHits = check(JSON.stringify([good, timed(once2)]), tuesday).hits;
  mark(/^rule #9 has pattern holding a backslash written twice/.test(doubled) && /nothing was checked/.test(doubled) && /^has pattern holding a backslash written twice/.test(tool().ruleFault(timed(twice2))) && onceHits.length === 1 && /^rule #9 /.test(onceHits[0]),
    'a pattern with its backslashes written twice is a red naming its rule, in the check and in the copy; written once it still finds the text', JSON.stringify([doubled || 'it did not fail', tool().ruleFault(timed(twice2)) || 'it did not fail'].concat(onceHits)));
  /* a file named after a word of the list in another case passed: only a rule's own match turned a name red, while the
     same name was hidden as one holding a private detail */
  const moving = [{ file: 'docs/' + T.town.toLowerCase() + '-moving-day.md', text: '# Moving day\n\nBoxes, the van, and who carries the piano.\n' }];
  const movingHits = check(map, moving).hits, movingCopy = tool().survivors(moving, JSON.parse(map));
  mark(movingHits.length === 1 && /^rule #5: a file name carries it: file 1 in git ls-files order, fingerprint [0-9a-f]{8} /.test(movingHits[0]) && movingCopy.length === 1 && /^rule #5 \(place\): a file name carries it: file 1 /.test(movingCopy[0])
    && movingHits.concat(movingCopy).every(h => h.toLowerCase().indexOf(T.town.toLowerCase()) < 0),
    'a file name holding a word of the list whole, in any case, is a red in the check and in the copy, and is not printed', JSON.stringify(movingHits.concat(movingCopy)));
  /* names and kinds a reader would recognise were printed on the public log, each spelt a way the name reading did not
     fold: a pattern's two words glued, a pattern's word with an s on, ü written ue, ø written oe, the ʻokina left out */
  const zru = 'Zrü' + 'mbek', voe = 'Vø' + 'rlund', zaq = 'Zaʻ' + 'qumi';
  const shown7 = [good, { id: 5, kind: 'place', rule: 'replace', pattern: ['\\bZib[\\s-]+Marrow\\b'], to: '[city]', ci: true }, { id: 7, kind: 'partner', rule: 'replace', pattern: ['\\bZorbl[ae]x\\b'], to: '[partner]', ci: true },
    { id: 21, kind: 'place', rule: 'replace', find: [zru], to: '[city]', ci: true }, { id: 22, kind: 'place', rule: 'replace', find: [voe], to: '[city]' }, { id: 23, kind: 'place', rule: 'replace', find: [zaq], to: '[city]' },
    { id: 4, kind: 'health', rule: 'drop', find: [sick], note: 'A health detail was raised.' }, { id: 44, kind: 'zibmarrow-house', rule: 'drop', find: ['the deposit'], note: 'A sum was named.' },
    { id: 45, kind: 'zruembek-rent', rule: 'drop', find: ['the lease'], note: 'A sum was named.' }];
  const ill = '# A week\n\nWe packed.\n\nShe has ' + sick + ', so no feather pillows.\n';
  const names7 = ['docs/zibmarrow-trip.md', 'docs/zorblaxs-birthday.md', 'docs/zruembek-week.md', 'docs/voerlund-ferry.md', 'docs/zaqumi-beach-week.md'];
  const files7 = names7.map(file => ({ file, text: ill })).concat([{ file: 'docs/money.md', text: '# Money\n\nThe deposit is due, and the lease runs out.\n' }]);
  let seven = []; try { seven = check(JSON.stringify(shown7), files7).hits; } catch (e) { seven = [e.message]; }
  mark(seven.length === 7 && seven.every(h => /^rule #\d+(?: survives at line \d+ of|: a file name carries it:) file \d+ in git ls-files order, fingerprint [0-9a-f]{8} \(no name is printed on a public log\)$/.test(h)),
    'the check prints no file name and no kind, only rule numbers, places and fingerprints, however a name or a kind is spelt', JSON.stringify(seven));
  /* ROUND 4. A name holding a word of the list glued straight onto other letters or a digit, with nothing between (a
     town's map saved as "<town>map.png", a second photo as "<town>2.png", notes as "<who>notes.md"), or one word of the
     list written as two words of the name ("qwerty-ville"), was hidden from the report as one holding a private detail,
     and passed: only a rule's own match or a whole word turned a name red. A word of the list made only by chance across
     a separator, out of the end of one word of the name and the start of the next, is still not one */
  const tl = T.town.toLowerCase(), gluedNames = ['art/' + tl + 'map.png', 'art/' + tl + '2.png', 'docs/' + lo + 'notes.md', 'docs/' + tl.slice(0, 6) + '-' + tl.slice(6) + '-ferry.md'];
  const byChance = 'docs/' + tl.slice(0, 6) + '-' + tl.slice(6) + 'neuve.md';
  let gluedHits = [];
  try { gluedHits = check(map, [{ file: 'a.md', text: 'clean words' }].concat(gluedNames.map((file, k) => ({ file, text: k < 2 ? null : '# Notes\n\nThe ferry leaves at noon.\n' })), [{ file: byChance, text: 'clean words' }, { file: 'art/map.png', text: null }])).hits; }
  catch (e) { gluedHits = [e.message]; }
  mark(gluedHits.length === 4 && gluedHits.every((h, k) => h === 'a file name holds a private detail: file ' + (k + 2) + ' in git ls-files order, fingerprint ' + CC.fingerprint(gluedNames[k]) + ' (no name is printed on a public log)'),
    'a file name holding a word of the list glued onto other letters or a digit, or split into two of its words, is a red, and is not printed; one made by chance across a separator, and a clean name, still pass', JSON.stringify(gluedHits));
  /* who made a commit was first read through a format string asking git for names and addresses, which test/authors.js
     forbids every script but itself: whatever such a script prints lands in a public log. It is read from the commit as
     git stores it, and the address check's own reading of every script finds no such request here */
  let asks = ['test/authors.js could not be read'];
  try { asks = require(path.join(__dirname, '..', 'test', 'authors.js')).judgeScripts([{ file: 'scripts/private-terms.js', text: fs.readFileSync(__filename, 'utf8') }]); } catch (e) { /* asks stays red */ }
  mark(asks.length === 0 && (who.run || {}).code === 1, 'the check reads who made a commit without asking git for a name or an address in a format string, which only test/authors.js may do', JSON.stringify(asks.map(a => a.split(' asks ')[0])));
  if (bad.length) { console.log('FAIL: ' + bad.length + ' of ' + total); process.exit(1); }
  console.log('OK: ' + total + ' cases, made-up terms only.');
  process.exit(0);
}

if (require.main === module) {
  if (process.argv.includes('--selftest')) return void selftest();
  /* --range <base> <head>: the commits a push or a pull request brings, which CI hands in (.github/workflows/ci.yml);
     on CI, a run without them would read the tree alone and look like a pass */
  const ri = process.argv.indexOf('--range'), range = ri > 0 ? process.argv.slice(ri + 1, ri + 3) : null;
  if (range && (range.length < 2 || range.some(a => !a || a.startsWith('-')))) { console.log('FAIL: --range takes the base and the head of the commits to read (--range <base> <head>); nothing was checked'); process.exit(1); }
  if (!range && process.env.GITHUB_ACTIONS === 'true') { console.log('FAIL: on CI the check reads every commit a push or a pull request brings, and was not told which (--range <base> <head>, as .github/workflows/ci.yml passes them); nothing was checked'); process.exit(1); }
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
  try {
    let history = null;
    if (range) { try { history = historyFiles(ROOT, range[0], range[1]); } catch (e) { throw new Error('the commits from the base to the head it was given could not be read (git does not know one of them here: fetch it first); nothing was checked'); } }
    r = check(text, trackedFiles(ROOT), history);
  }
  catch (e) { console.log('FAIL: ' + (/nothing was checked/.test(e.message) ? e.message : 'the check could not run; nothing was checked')); process.exit(1); }
  if (r.hits.length) {
    console.log('FAIL: ' + r.hits.length + ' personal detail(s) from the private list are in this repository. Rephrase them or move them to the private repository; the list itself is never printed.');
    const shown = r.hits.slice(0, 50);
    shown.forEach(h => console.log('- ' + h));
    if (shown.some(h => /, fingerprint [0-9a-f]{8} /.test(h))) console.log(tool().FIND_HINT);
    if (shown.some(h => / commit [0-9a-f]{8}(?: |$)/.test(h))) console.log('A detail in a commit\'s message, in the name or address of who made it, or in a line a commit added, stays in the repository\'s history after a later commit takes it out: rewrite those commits (amend them, with --reset-author or --author for who made one, or squash the branch) before it merges. A file a commit adds or changes is found by the same lookup with git ls-tree -r -z --name-only --full-tree <commit> in place of git ls-files -z --full-name :/');
    process.exit(1);
  }
  console.log('OK: ' + r.files + ' files and their names' + (r.commits == null ? '' : ', and the messages and changes of ' + r.commits + ' commit(s)' + (r.first ? ' (every commit the head holds, the first one included: the base has no parent)' : '') + ',') + ' read against ' + r.rules + ' private rules, each with a word or pattern to look for; nothing personal found. (The rules are never printed.)');
}

module.exports = { rulesFrom, check, trackedFiles, historyFiles };
