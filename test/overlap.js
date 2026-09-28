#!/usr/bin/env node
/* test/overlap.js — which other branch is holding a file this one touches.

   Written 2026-09-20 at the owner's word: "ensure to review prs for conflicts." With two AIs on one
   engine the expensive failure is not a merge conflict — git announces those. It is two agents each
   changing the same function in different ways, each green on its own branch, and the second merge
   quietly undoing the first's intent while every suite stays green.

     node test/overlap.js                 this branch against every other
     node test/overlap.js <branch>        a named one
     node test/overlap.js --all           every pair of live branches that overlaps — the owner's view

   ALWAYS EXITS 0, and that is deliberate. "Somebody else is holding this file" is not a state the
   author can clear by editing, and a gate nobody can satisfy is a gate people learn to force past —
   the same argument test/leaves.js makes for its routing half. What this buys is that you read the
   other branch BEFORE you both push, instead of resolving it afterwards with half the context gone.

   GIT ALONE — no token, no API, no permissions. Not a shortcut: test/leaves.js fails the build if
   any workflow asks for a `write` scope, so nothing in CI may comment on a pull request, and that
   rule is correct (a bad dependency in CI holding a write token can push to main). So this is a tool
   an agent runs before it opens the PR (AGENTS.md §4), not a CI gate.

   AND IT REFUSES RATHER THAN LIES. GitHub's checkout is shallow (depth 1), so in CI there is no
   merge-base to compute and the honest answer is "I cannot see", not an empty list that reads as
   "nothing overlaps" — docs/GAUGE.md: nothing to measure is not a pass, and docs/REGRESSION.md's
   boot-warning filter matched zero characters for weeks while printing a clean result. */
const { execFileSync } = require('child_process'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const git = (...a) => { try { return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
                        catch (e) { return null; } };

const BASE = (git('rev-parse', '--verify', '-q', 'origin/main') ? 'origin/main'
           : git('rev-parse', '--verify', '-q', 'main') ? 'main' : null);

/* every branch that is NOT already in main — a merged branch overlaps nothing that matters */
function live() {
  const raw = git('for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin');
  if (raw === null) return null;
  return raw.split('\n').map(s => s.trim()).filter(Boolean)
    .filter(b => b !== 'origin/main' && b !== 'origin/HEAD' && !/^origin\/HEAD/.test(b))
    .filter(b => { const mb = git('merge-base', BASE, b); const tip = git('rev-parse', b); return mb && tip && mb !== tip; });
}

function files(ref) {
  const mb = git('merge-base', BASE, ref);
  if (!mb) return null;
  const out = git('diff', '--name-only', mb, ref);
  return out === null ? null : out.split('\n').filter(Boolean);
}

function here() {
  const b = process.env.GITHUB_HEAD_REF || git('rev-parse', '--abbrev-ref', 'HEAD');
  if (!b || b === 'HEAD') return null;
  return git('rev-parse', '--verify', '-q', 'origin/' + b) ? 'origin/' + b : b;
}

function main() {
  const arg = process.argv.slice(2).filter(a => a !== '--all')[0];
  const all = process.argv.includes('--all');
  if (!BASE) { console.log('overlap: there is no main to measure against in this checkout, so this said nothing — that is not "no overlap".'); return 0; }
  const L = live();
  if (L === null) { console.log('overlap: git could not list remote branches here, so this said nothing — that is not "no overlap".'); return 0; }

  const F = {}; let blind = 0;
  L.forEach(b => { const f = files(b); if (f === null) blind++; else F[b] = f; });
  if (blind) console.log('overlap: ' + blind + ' branch(es) have no merge-base in this checkout (a shallow clone: run `git fetch --unshallow`). They were NOT compared.');

  if (all) {
    const names = Object.keys(F).sort(); let hits = 0;
    for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
      const s = new Set(F[names[j]]), both = F[names[i]].filter(f => s.has(f));
      if (!both.length) continue;
      hits++;
      console.log('\n⚠ ' + names[i] + '  ×  ' + names[j] + '  — ' + both.length + ' file(s) in both:');
      both.forEach(f => console.log('    ' + f));
    }
    console.log('\noverlap: ' + names.length + ' live branch(es) compared, ' + hits + ' overlapping pair(s).' +
                (hits ? ' Read the other branch before either of you pushes again; git will merge these cleanly and still lose an intent.' : ''));
    return 0;
  }

  const me = arg ? (git('rev-parse', '--verify', '-q', 'origin/' + arg) ? 'origin/' + arg : arg) : here();
  if (!me) { console.log('overlap: could not tell which branch this is (detached HEAD?), so this said nothing.'); return 0; }
  const mine = files(me);
  if (mine === null) { console.log('overlap: no merge-base for ' + me + ' in this checkout (shallow clone: `git fetch --unshallow`), so this said nothing — that is not "no overlap".'); return 0; }
  if (!mine.length) { console.log('overlap: ' + me + ' changes nothing against ' + BASE + '. 0 of ' + Object.keys(F).length + ' live branch(es) compared.'); return 0; }

  let hits = 0;
  Object.keys(F).sort().forEach(b => {
    if (b === me) return;
    const s = new Set(F[b]), both = mine.filter(f => s.has(f));
    if (!both.length) return;
    hits++;
    console.log('\n⚠ ' + b + ' is holding ' + both.length + ' of your ' + mine.length + ' file(s):');
    both.forEach(f => console.log('    ' + f));
  });
  console.log('\noverlap: ' + me + ' — ' + mine.length + ' file(s) changed, compared against ' +
              (Object.keys(F).length - (F[me] ? 1 : 0)) + ' other live branch(es), ' + hits + ' overlapping.' +
              (hits ? '\nNot a failure, and nothing you can edit your way out of. Read those branches, and say in your PR that you did.' : ''));
  return 0;
}
if (require.main === module) process.exit(main());
module.exports = { live, files };
