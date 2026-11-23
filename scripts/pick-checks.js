#!/usr/bin/env node
/* PICK THE CHECKS A CHANGE TOUCHES (the owner's confirmed goal of 2026-11-23 on running checks by hand).

   Every check below runs on GitHub on every pull request, all of them, for now, as today. This is for the checks a
   person or an agent runs BY HAND before opening one: only the checks that read what the change touches, picked from
   ONE table rather than from memory.

     node scripts/pick-checks.js [--base origin/main]          what would run, and why; what is skipped, and why
     node scripts/pick-checks.js [--base origin/main] --run    run them one at a time, rerun each failure once alone,
                                                               and print the list a pull request carries
     node scripts/pick-checks.js --selftest                    its own red cases

   HOW A CHECK IS PICKED. Each row of CHECKS names the file the check is (`self`), the command that runs it, and what it
   reads (`reads`: folders ending in "/" and files). A check runs when a changed file is one it reads, its own file, or a
   module its own file requires. Its self-test (`selftest`) runs when its own file or a module it requires changed, or
   any file its own file names (its planted faults are written into copies of those files, so a change to one can break
   the plant); a row that lists its `plants` is read by that list instead. A row marked `quick` (it takes seconds) runs
   on every change: listing what it reads still matters, because that is how a changed file is known at all.
   THE SAFE DEFAULT. A changed file that no row reads, and that no check is or requires, is a file the table does not
   know: then EVERY check runs, and the file is named, so the gap costs time and never a missed check. The same when the
   workflow that lists the checks changes. A change to this table runs its own red cases (its row below), which prove
   how it picks; the files the same change touches pick the rest as any change's do.
   THE GUARD. Every check the workflow names (.github/workflows/ci.yml) must be a row here, and every row's file must
   exist; otherwise nothing is picked and it exits 2, so a new check cannot be skipped without anyone noticing.
   A check that fails is run once more, alone, before it counts as a failure (a busy machine fails some of them). */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const WORKFLOW = '.github/workflows/ci.yml';
const SELF = 'scripts/pick-checks.js';

/* what the published site is made of (scripts/build-site.sh copies these, and test/public.js reads the copy) */
const SITE = ['index.html', 'shell.css', 'sw.js', 'sw-register.js', 'frame-guard.js', 'qr.js', 'manifest.webmanifest', 'icon-192.png',
  'icon-512.png', 'engine/', 'vendor/', 'content/', 'scripts/build-site.sh'];
const GAME = ['engine/', 'vendor/', 'index.html', 'shell.css', 'sw.js', 'sw-register.js', 'frame-guard.js', 'manifest.webmanifest'];
const NOTES = ['docs/', '.claude/', '.github/', 'AGENTS.md', 'CLAUDE.md', 'README.md', 'CONTRIBUTING.md', 'SECURITY.md', 'LICENSING.md',
  'LICENSE', 'LICENSE-ART-AND-WRITING.txt', '.gitignore'];

/* THE ONE TABLE. `run`: how it is run by hand (a base ref is put where {base} stands). `gh`: it needs what only the
   GitHub run hands it, so by hand it is listed, not run, with that reason. */
const CHECKS = [
  { self: SELF, selftest: 'node scripts/pick-checks.js --selftest', quick: true, reads: [] },
  { self: 'test/keys.js', run: 'node test/keys.js', selftest: 'node test/keys.js --selftest', quick: true, reads: ['*'] },
  { self: 'test/authors.js', run: 'node test/authors.js {base} HEAD', selftest: 'node test/authors.js --selftest', quick: true, reads: ['*'] },
  { self: 'test/vendored.js', run: 'node test/vendored.js', quick: true, reads: ['vendor/', 'qr.js', 'test/vendor.sha256'] },
  { self: 'test/quotes.js', run: 'node test/quotes.js --range {base}..HEAD', selftest: 'node test/quotes.js --selftest', quick: true, reads: ['*'] },
  { self: 'test/pointers.js', run: 'node test/pointers.js', selftest: 'node test/pointers.js --selftest', quick: true, reads: NOTES },
  { self: 'test/gate.js', run: 'node test/gate.js', selftest: 'node test/gate.js --selftest', quick: true, reads: ['.github/'] },
  { self: 'test/protect.js', selftest: 'node test/protect.js --selftest', quick: true, reads: ['.github/'] },
  { self: 'test/pushguard.js', selftest: 'node test/pushguard.js --selftest', quick: true, reads: ['.claude/'] },
  { self: 'scripts/clean-copy.js', selftest: 'node scripts/clean-copy.js --selftest', quick: true, reads: [] },
  { self: 'scripts/private-terms.js', selftest: 'node scripts/private-terms.js --selftest', quick: true, reads: ['*'],
    gh: 'its run over a range needs the private list of terms, which a session runs among its scans before every push' },
  { self: 'test/toolguard.js', selftest: 'node test/toolguard.js --selftest', quick: true, reads: ['.claude/', 'docs/'] },
  { self: 'test/bump.js', run: 'node test/bump.js {base}', quick: true, reads: ['engine/', 'content/meridian/config.js', 'content/horno/config.js', 'content/gauge/', 'sw.js'] },
  { self: 'test/prims.js', run: 'node test/prims.js --ci', selftest: 'node test/prims.js --selftest', reads: ['content/meridian/', 'content/horno/', 'engine/engine3d.js', 'engine/shapes.js', 'vendor/'] },
  { self: 'test/smoke.js', run: 'node test/smoke.js', reads: ['content/meridian/'].concat(GAME) },
  { self: 'test/kitchen-seams.js', run: 'node test/kitchen-seams.js', reads: GAME },
  { self: 'test/engine.smoke.js', run: 'node test/engine.smoke.js --index index.html', reads: ['content/', 'docs/REGRESSION.md'].concat(GAME) },
  { self: 'test/gauge.js', run: 'node test/gauge.js --world plain && node test/gauge.js --world 3d && node test/gauge.js --world lib', reads: ['content/gauge/', 'content/meridian/'].concat(GAME) },
  { self: 'test/horno.js', run: 'node test/horno.js', reads: ['content/horno/', 'content/meridian/'].concat(GAME) },
  { self: 'test/offline.js', run: 'node test/offline.js', reads: ['content/horno/', 'content/meridian/'].concat(GAME) },
  { self: 'test/public.js', run: 'bash scripts/build-site.sh /tmp/_site && node test/public.js /tmp/_site', reads: SITE },
];

/* ---------- reading the table ---------- */
const covers = (pat, f) => pat === '*' || (pat.endsWith('/') ? f.startsWith(pat) : f === pat);
const exists = f => fs.existsSync(path.join(ROOT, f));
/* a check's own modules: what its file requires from this repository, and what those require */
function deps(file, seen) {
  seen = seen || new Set();
  if (seen.has(file) || !exists(file)) return seen;
  seen.add(file);
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8'), re = /require\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g;
  let m;
  while ((m = re.exec(src))) {
    let r = path.posix.normalize(path.posix.join(path.posix.dirname(file), m[1]));
    if (!/\.[a-z]+$/.test(r)) r += '.js';
    deps(r, seen);
  }
  return seen;
}
/* every file of this repository its own file names in a string: where its planted faults are written */
function named(file) {
  if (!exists(file)) return new Set();
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8'), out = new Set(), re = /['"`]((?:\.\.\/)*(?:[\w.-]+\/)+[\w.-]+\.[a-z0-9]+)/gi;
  let m;
  while ((m = re.exec(src))) { const f = m[1].replace(/^(\.\.\/)+/, ''); if (exists(f)) out.add(f); }
  return out;
}
/* the guard: the workflow's checks against the table */
function guard(table, workflowText) {
  const listed = new Set(), re = /node\s+((?:test|scripts|docs\/templates|\.github\/scripts)\/[\w.-]+\.js)/g;
  let m;
  while ((m = re.exec(workflowText))) listed.add(m[1]);
  const rows = new Set(table.map(c => c.self)), bad = [];
  listed.forEach(f => { if (!rows.has(f)) bad.push(`the workflow runs ${f}, and the table has no row for it: add one, saying what it reads`); });
  table.forEach(c => { if (!exists(c.self)) bad.push(`the table has a row for ${c.self}, which does not exist`); });
  return bad;
}
/* the pick: for each check, whether it runs and its self-test runs, and why; and the files nothing knows */
function pick(table, changed) {
  const always = changed.filter(f => f === WORKFLOW);
  const info = table.map(c => ({ c, own: deps(c.self), names: named(c.self) }));
  const planted = (c, names, f) => c.plants ? c.plants.some(p => covers(p, f)) : names.has(f);
  const known = f => info.some(({ c, own, names }) => c.reads.some(p => p !== '*' && covers(p, f)) || own.has(f) || planted(c, names, f));
  const unknown = changed.filter(f => !known(f) && !always.includes(f));
  const all = unknown.length > 0 || always.length > 0;
  const rows = info.map(({ c, own, names }) => {
    const hitRead = changed.find(f => c.reads.some(p => covers(p, f))), hitOwn = changed.find(f => own.has(f)), hitName = changed.find(f => planted(c, names, f));
    let main = null, self = null;
    if (c.run) main = all ? 'every check runs' : c.quick ? 'quick: it runs on every change' : hitOwn ? `its own file changed (${hitOwn})` : hitRead ? `it reads ${hitRead}` : null;
    if (c.selftest) self = all ? 'every check runs' : c.quick ? 'quick: it runs on every change' : hitOwn ? `its own file changed (${hitOwn})` : hitName ? `its planted faults are written into ${hitName}` : null;
    return { c, main, self };
  });
  return { rows, unknown, always, all };
}
function changedFiles(base) {
  const sh = a => cp.execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  const set = new Set(sh(['diff', '--name-only', base]).concat(sh(['ls-files', '--others', '--exclude-standard'])));
  return [...set].sort();
}
function report(p, changed) {
  const out = [`${changed.length} file(s) changed.`];
  if (p.always.length) out.push(`EVERY CHECK RUNS: the workflow that lists the checks changed (${p.always.join(', ')}).`);
  if (p.unknown.length) out.push(`EVERY CHECK RUNS: no row of the table reads ${p.unknown.join(', ')} — add what reads it, so the next change is picked.`);
  const run = [], skip = [];
  p.rows.forEach(({ c, main, self }) => {
    if (c.gh) { skip.push(`${c.self}: its run is not done by hand — ${c.gh}`); if (!c.selftest) return; }
    if (c.run) (main ? run : skip).push(main ? `${c.run}  — ${main}` : `${c.run}  — skipped: it reads none of the changed files`);
    if (c.selftest) (self ? run : skip).push(self ? `${c.selftest}  — ${self}` : `${c.selftest}  — skipped: neither it nor what it plants into changed`);
  });
  return { out, run, skip };
}

/* ---------- running them ---------- */
function runAll(cmds, base) {
  const res = [];
  const once = cmd => { const r = cp.spawnSync('bash', ['-c', cmd.replace(/\{base\}/g, base)], { cwd: ROOT, encoding: 'utf8', timeout: 25 * 60 * 1000, maxBuffer: 1 << 28 });
    const tail = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter(l => !/dbus|^\[pid=/.test(l)).slice(-3).join(' / ');
    return { code: r.status === null ? 'timed out' : r.status, tail }; };
  cmds.forEach(cmd => { process.stderr.write(`running ${cmd}\n`); res.push({ cmd, first: once(cmd) }); });
  res.filter(r => r.first.code !== 0).forEach(r => { process.stderr.write(`again, alone: ${r.cmd}\n`); r.again = once(r.cmd); });
  return res;
}

/* ---------- its own red cases ---------- */
function selftest() {
  const fails = [], ok = (cond, what) => { if (!cond) fails.push(what); };
  const has = (p, file, which) => p.rows.some(r => r.c.self === file && r[which]);
  let p = pick(CHECKS, ['engine/engine.js']);
  ok(has(p, 'test/smoke.js', 'main') && has(p, 'test/engine.smoke.js', 'main') && has(p, 'test/gauge.js', 'main'), 'a change to the engine runs the game\'s suites');
  ok(!p.all, 'a change to a file the table knows does not run every check');
  p = pick(CHECKS, ['content/horno/maps.js']);
  ok(has(p, 'test/horno.js', 'main') && !has(p, 'test/smoke.js', 'main'), 'a change to the oven world runs its checks and not Meridian\'s own');
  p = pick(CHECKS, ['docs/3D-LOG.md']);
  ok(!has(p, 'test/smoke.js', 'main') && !has(p, 'test/engine.smoke.js', 'main') && has(p, 'test/pointers.js', 'main'), 'a change to the notes runs only the checks that read them');
  p = pick(CHECKS, ['docs/REGRESSION.md']);
  ok(has(p, 'test/engine.smoke.js', 'main'), 'the one note the engine suite reads runs it');
  p = pick(CHECKS, ['newfolder/thing.txt']);
  ok(p.all && p.rows.every(r => !r.c.run || r.main), 'a file the table does not know runs every check');
  ok(p.unknown.includes('newfolder/thing.txt'), 'the file the table does not know is named');
  p = pick(CHECKS, [WORKFLOW]);
  ok(p.all, 'a change to the workflow that lists the checks runs every check');
  p = pick(CHECKS, [SELF]);
  ok(!p.all && has(p, SELF, 'self'), 'a change to the table runs its own red cases, not every check');
  p = pick(CHECKS, ['test/prims.js']);
  ok(has(p, 'test/prims.js', 'main') && has(p, 'test/prims.js', 'self'), 'a change to a check runs it and its self-test');
  const wf = fs.readFileSync(path.join(ROOT, WORKFLOW), 'utf8');
  ok(guard(CHECKS, wf).length === 0, 'the table has a row for every check the workflow runs: ' + guard(CHECKS, wf).join('; '));
  ok(guard(CHECKS.filter(c => c.self !== 'test/horno.js'), wf).some(s => /test\/horno\.js/.test(s)), 'a check the workflow runs with no row is caught');
  ok(guard(CHECKS.concat([{ self: 'test/no-such-check.js', reads: [] }]), wf).some(s => /no-such-check/.test(s)), 'a row for a file that does not exist is caught');
  if (fails.length) { console.log('RED — the check picker:\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('OK — the check picker: 13 cases, each as it should be.');
}

/* ---------- the command line ---------- */
if (require.main === module) {
  const a = process.argv.slice(2);
  if (a.includes('--selftest')) { selftest(); process.exit(0); }
  const bi = a.indexOf('--base'), base = bi >= 0 ? a[bi + 1] : 'origin/main';
  const bad = guard(CHECKS, fs.readFileSync(path.join(ROOT, WORKFLOW), 'utf8'));
  if (bad.length) { console.log('THE TABLE IS OUT OF DATE — nothing picked:\n- ' + bad.join('\n- ')); process.exit(2); }
  const changed = changedFiles(base), p = pick(CHECKS, changed), r = report(p, changed);
  console.log(r.out.join('\n'));
  if (!a.includes('--run')) { console.log(`\nTO RUN (${r.run.length}):\n- ` + r.run.join('\n- ') + `\n\nSKIPPED (${r.skip.length}):\n- ` + r.skip.join('\n- ')); process.exit(0); }
  const res = runAll(r.run.map(l => l.split('  — ')[0]), base);
  const failed = res.filter(x => x.first.code !== 0 && (!x.again || x.again.code !== 0));
  console.log(`\n### Checks run by hand (picked by scripts/pick-checks.js against ${base}; every check also runs on GitHub)\n`);
  res.forEach(x => console.log(`- \`${x.cmd.replace(/\{base\}/g, base)}\`: ${x.first.code === 0 ? 'passed' : x.again && x.again.code === 0 ? `failed (${x.first.code}), then passed run alone` : `FAILED (${x.first.code}${x.again ? `, and again alone: ${x.again.code}` : ''}) — ${(x.again || x.first).tail}`}`));
  console.log(`\nSkipped (${r.skip.length}):\n- ` + r.skip.join('\n- '));
  process.exit(failed.length ? 1 : 0);
}
module.exports = { CHECKS, pick, guard, deps, named };
