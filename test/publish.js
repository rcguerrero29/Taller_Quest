#!/usr/bin/env node
/* THE PUBLISH, IN TWO JOBS (the owner's confirmed goal of 2026-11-26).
   The game is published by .github/workflows/pages.yml. It used to upload the site and ask GitHub to publish it as two
   steps of ONE job, back to back, and the publish step asked for the upload less than half a second after it was stored:
   on four of eleven merges GitHub had not listed its own upload yet, the step found nothing to publish, and the live game
   stayed one or two versions behind with the build check green. So the upload and the publish are two jobs, the second
   waiting for the first, and this check reads the workflow as text and says so in words when any of that is not so.

     node test/publish.js              read .github/workflows/pages.yml
     node test/publish.js <file>       read another copy (a planted one)

   What it asks:
   A  one job uploads the site and does not publish it; another publishes and does not upload
   B  the job that publishes waits for the job that uploads (`needs:`)
   C  the job that publishes declares the environment `github-pages`, the one the owner's approval gates; no other job does
   D  only the job that publishes holds the right to publish (`pages: write`, `id-token: write`): not the workflow, not another job
   E  the job that publishes runs none of this repository's code: no checkout, no `run:` step
   F  in the job that uploads, the check of what is uploaded (`node test/public.js _site`) is the last `run:` step before
      the upload, after the record is written into it
   G  nothing here may be skipped or fail quietly: no `if:`, no `continue-on-error`
   H  the workflow runs on a push to main and on nothing else
   I  every action is pinned to a full commit */
'use strict';
const fs = require('fs'), path = require('path');
const FILE = process.argv[2] || path.resolve(__dirname, '..', '.github', 'workflows', 'pages.yml');
const REL = '.github/workflows/pages.yml';
function read(file) {
  let txt; try { txt = fs.readFileSync(file, 'utf8'); } catch (e) { return { fatal: 'could not be read (' + e.code + '), so nobody can say how the game is published' }; }
  const lines = txt.split('\n').map(l => l.replace(/\s+$/, ''));
  const code = l => l.replace(/\s+#.*$/, '');                       /* a line without its trailing comment */
  const real = lines.map((l, i) => ({ l: code(l), i })).filter(o => o.l.trim() && !/^\s*#/.test(o.l));
  const top = k => real.findIndex(o => new RegExp('^' + k + ':').test(o.l));
  const block = (from, indent) => { const out = []; for (let k = from + 1; k < real.length; k++) { const ind = real[k].l.match(/^ */)[0].length; if (ind <= indent) break; out.push(real[k]); } return out; };
  const ji = top('jobs'); if (ji < 0) return { fatal: 'has no `jobs:`' };
  const jobs = []; const jl = block(ji, 0);
  jl.forEach((o, k) => { const m = o.l.match(/^  ([A-Za-z0-9_-]+):\s*$/); if (m) jobs.push({ name: m[1], lines: [] }); else if (jobs.length) jobs[jobs.length - 1].lines.push(o); });
  const perms = ls => { const k = ls.findIndex(o => /^\s*permissions:\s*$/.test(o.l)); if (k < 0) return null; const ind = ls[k].l.match(/^ */)[0].length, out = {};
    for (let q = k + 1; q < ls.length; q++) { const o = ls[q], i2 = o.l.match(/^ */)[0].length; if (i2 <= ind) break; const m = o.l.match(/^\s*([a-z-]+):\s*(\S+)/); if (m) out[m[1]] = m[2]; } return out; };
  const pi = top('permissions'), wperm = pi < 0 ? null : (() => { const out = {}; block(pi, 0).forEach(o => { const m = o.l.match(/^\s*([a-z-]+):\s*(\S+)/); if (m) out[m[1]] = m[2]; }); return out; })();
  const oi = top('on'), on = oi < 0 ? [] : block(oi, 0).map(o => o.l.trim());
  jobs.forEach(j => { const L = j.lines;
    j.uses = L.map(o => (o.l.match(/^\s*(?:-\s*)?uses:\s*(\S+)/) || [])[1]).filter(Boolean);
    j.runs = L.filter(o => /^\s*(?:-\s*)?run:/.test(o.l)).map(o => o.l.replace(/^\s*(?:-\s*)?run:\s*/, ''));
    j.steps = L.filter(o => /^\s*(?:-\s*)?(uses|run):/.test(o.l)).map(o => o.l.replace(/^\s*(?:-\s*)?/, ''));
    j.needs = (L.map(o => (o.l.match(/^    needs:\s*(.+)$/) || [])[1]).filter(Boolean)[0] || '').replace(/[\[\]\s]/g, '').split(',').filter(Boolean);
    j.env = L.some(o => /^    environment:/.test(o.l)) ? (L.map(o => (o.l.match(/^\s*name:\s*(\S+)/) || o.l.match(/^    environment:\s*(\S+)/) || [])[1]).filter(Boolean)[0] || '') : null;
    j.perms = perms(L); j.quiet = L.filter(o => /^\s*(?:-\s*)?(if|continue-on-error):/.test(o.l)).map(o => o.l.trim()); });
  return { jobs, wperm, on, quietTop: real.filter(o => /^(if|continue-on-error):/.test(o.l)).map(o => o.l) };
}
function judge(w) {
  if (w.fatal) return [REL + ' ' + w.fatal];
  const out = [], say = s => out.push(s), has = (j, re) => j.uses.some(u => re.test(u));
  const up = w.jobs.filter(j => has(j, /^actions\/upload-pages-artifact@/)), dep = w.jobs.filter(j => has(j, /^actions\/deploy-pages@/));
  const writes = p => p && (p.pages === 'write' || p['id-token'] === 'write');
  if (up.length !== 1 || dep.length !== 1) { say('A · ' + REL + ' has ' + up.length + ' job(s) that upload the site and ' + dep.length + ' that publish it, where one of each is asked'); return out; }
  const U = up[0], D = dep[0];
  if (U === D) { say('A · the site is uploaded and published by one job (`' + U.name + '`), back to back, so the publish can ask for the upload before GitHub lists it: the upload and the publish are two jobs'); return out; }
  if (!D.needs.includes(U.name)) say('B · the job that publishes (`' + D.name + '`) does not wait for the job that uploads (`needs: ' + U.name + '`), so it can start before there is anything to publish');
  if (D.env !== 'github-pages') say('C · the job that publishes (`' + D.name + '`) does not declare the environment `github-pages`, so the owner\'s approval of a deploy would gate nothing');
  w.jobs.filter(j => j !== D && j.env !== null).forEach(j => say('C · the job `' + j.name + '` declares an environment and is not the one that publishes: the approval belongs to the publish alone'));
  if (writes(w.wperm)) say('D · the whole workflow holds the right to publish (`pages: write` or `id-token: write` at its top), so every job does: only the job that publishes may');
  w.jobs.filter(j => j !== D && writes(j.perms)).forEach(j => say('D · the job `' + j.name + '` holds the right to publish and does not publish'));
  if (!D.perms || D.perms.pages !== 'write' || D.perms['id-token'] !== 'write') say('D · the job that publishes (`' + D.name + '`) does not say its own `permissions:` with `pages: write` and `id-token: write`');
  else Object.keys(D.perms).filter(k => k !== 'pages' && k !== 'id-token').forEach(k => say('D · the job that publishes holds `' + k + ': ' + D.perms[k] + '`, which publishing does not need'));
  if (D.runs.length || D.uses.some(u => !/^actions\/deploy-pages@/.test(u))) say('E · the job that publishes runs more than the publish itself (' + D.steps.filter(s => !/^uses:\s*actions\/deploy-pages@/.test(s)).join(' | ').slice(0, 160) + '): it runs none of this repository\'s code');
  { const s = U.steps, ui = s.findIndex(x => /^uses:\s*actions\/upload-pages-artifact@/.test(x)), runsBefore = s.slice(0, ui).filter(x => /^run:/.test(x)), last = runsBefore[runsBefore.length - 1] || '';
    if (!/^run:\s*node test\/public\.js _site\s*$/.test(last)) say('F · in the job that uploads, the last `run:` step before the upload is `' + last.replace(/^run:\s*/, '').slice(0, 80) + '`, where the check of what is uploaded (`node test/public.js _site`) is asked: the box is checked after the last thing is put in it');
    if (s.slice(ui + 1).some(x => /^run:/.test(x))) say('F · in the job that uploads, a `run:` step comes after the upload'); }
  w.jobs.forEach(j => j.quiet.forEach(q => say('G · the job `' + j.name + '` holds `' + q.slice(0, 80) + '`: a step that is skipped or fails quietly leaves the live game stale with every light green')));
  w.quietTop.forEach(q => say('G · the workflow holds `' + q + '` at its top'));
  if (w.on.join(' | ') !== 'push: | branches: [main]') say('H · the workflow runs on `' + w.on.join(' ').slice(0, 100) + '`, where a push to main and nothing else is asked');
  w.jobs.forEach(j => j.uses.filter(u => !/@[0-9a-f]{40}$/.test(u)).forEach(u => say('I · the job `' + j.name + '` uses `' + u + '`, which is not pinned to a full commit')));
  return out;
}
const fails = judge(read(FILE));
if (fails.length) { console.log('FAIL'); fails.forEach(f => console.log('- ' + f)); process.exit(1); }
console.log('OK — the game is uploaded by one job and published by another that waits for it, declares the owner\'s environment, alone holds the right to publish and runs none of this repository\'s code; what is uploaded is checked last; nothing is skipped quietly; a push to main is the only way in; every action is pinned.');
