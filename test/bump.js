#!/usr/bin/env node
/* An engine change that never reaches a returning player is not shipped (R? — this file's reason).
   test/smoke.js already checks that sw.js's CACHE EQUALS the pack's GAMEV. That is a lockstep test,
   and lockstep is not the same as movement: leave both untouched while editing engine/ and the two
   strings still match, the suite stays green, and every device that already installed the app keeps
   serving the OLD engine out of its cache. Cache-first means those players never find out.
   Verified against this repo's own history rather than assumed — two commits on main changed
   engine/ and left CACHE where it was:
     f9a2e71  The world takes a share of the screen, and the camera holds its width
     689e93d  The bubble says what the chair changes; patterns on the shirt
   Both go red against this check, which is what makes it evidence rather than a test that passes
   on unchanged code.
   Run:  node test/bump.js <base-ref> [head-ref]     e.g. node test/bump.js origin/main
   The optional head lets it be pointed at any pair, which is how the two commits above were
   proved red rather than asserted red. */
const { execFileSync } = require('child_process');
const base = process.argv[2], head = process.argv[3] || 'HEAD';
if (!base) { console.error('usage: node test/bump.js <base-ref>'); process.exit(2); }
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });

/* WHAT IS ABOUT TO SHIP, not what has already been committed. Until 2026-09-12 this read
   `git diff base...HEAD`, which compares two COMMITS — so every run of this test before the commit
   was decorative, and that is the only time anybody runs it. Planted: an engine change plus a
   reverted CACHE string, sitting in the working tree, and it printed "this change touches nothing
   the offline app has already cached". The one guard whose whole job is the rule in CLAUDE.md
   ("bump GAMEV and CACHE together whenever engine/ changes") could not see an unbumped engine change
   in the tree it was being asked about. Proxy #11 in docs/REGRESSION.md: it asked what the COMMITS
   changed when it meant what the BUILD contains.
   With an explicit head it still compares two commits, which is what CI does and how the two
   historical reds in the comment above were proved. */
let changed;
const uncommitted = () => {
  let from = base;
  try { from = git('merge-base', base, 'HEAD').trim() || base; } catch (e) {}
  const tracked = git('diff', '--name-only', from).split('\n').filter(Boolean);
  let untracked = [];
  try { untracked = git('ls-files', '--others', '--exclude-standard').split('\n').filter(Boolean); } catch (e) {}
  return [...new Set([...tracked, ...untracked])];
};
if (head === 'HEAD') changed = uncommitted();
else { try { changed = git('diff', '--name-only', base + '...' + head).split('\n').filter(Boolean); }
       catch (e) { changed = git('diff', '--name-only', base, head).split('\n').filter(Boolean); } }

/* Everything the SERVICE WORKER PRECACHES, not just engine/ — read from sw.js's own ASSETS list so
   this can never drift from what is actually cached. The first version of this check watched
   engine/ alone, and sw.js precaches index.html and every content/meridian file too, all served
   cache-first with no revalidation: change a quest's words, ship it, and every installed device
   keeps the old words until some unrelated engine change happens to move CACHE. Found by Yaz, who
   committed a change to index.html and quests.en.js and watched this exit 0. */
const swSrc = require('fs').readFileSync('sw.js', 'utf8');
const precached = [...swSrc.matchAll(/"\.\/([^"]+)"/g)].map(m => m[1]).filter(Boolean);
const watched = changed.filter(f => f.startsWith('engine/') || precached.includes(f));
const touchedEngine = watched;

/* A second world on this engine keeps its own version string and its own check that it moved, in
   its own repository. This file guards what this repository serves, and nothing else. */
if (!watched.length) {
  console.log('OK — this change touches nothing the offline app has already cached, so no bump is owed.'); process.exit(0);
}

const cacheOf = (src) => (src.match(/CACHE\s*=\s*"([^"]+)"/) || [])[1] || null;
const was = cacheOf(git('show', base + ':sw.js'));
const now = cacheOf(head === 'HEAD' ? require('fs').readFileSync('sw.js', 'utf8') : git('show', head + ':sw.js'));

if (!now) { console.log('FAIL — sw.js no longer declares a CACHE this check can read.'); process.exit(1); }
if (was === now) {
  console.log('FAIL — this change edits something already sitting in every returning player\'s cache, and they would keep the old one.\n' +
    '- it touches ' + touchedEngine.join(', ') + ' — every one of those is precached by the service worker\n' +
    '- and sw.js CACHE is still "' + now + '"\n' +
    '- the service worker is cache-first, so an installed device serves what it already has and never\n' +
    '  learns there is anything newer. Bump CACHE in sw.js and GAMEV in every pack config together.');
  process.exit(1);
}
console.log('OK — engine/ changed and the cache moved with it: "' + was + '" → "' + now + '".');
