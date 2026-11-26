#!/usr/bin/env node
/* THE PUBLISH, IN TWO JOBS (the owner's confirmed goal of 2026-11-26).
   The game is published by .github/workflows/pages.yml. It used to upload the site and ask GitHub to publish it as two
   steps of ONE job, back to back, and the publish step asked for the upload less than half a second after it was stored:
   on four of eleven merges GitHub had not listed its own upload yet, the step found nothing to publish, and the live game
   stayed one or two versions behind with the build check green. So the upload and the publish are two jobs, the second
   waiting for the first, and this check reads the workflow as text and says so in words when any of that is not so.

     node test/publish.js              read .github/workflows/pages.yml
     node test/publish.js <file>       read another copy (a planted one)
     node test/publish.js --selftest   its own red cases: each sentence planted in a copy of the real file held in
                                       memory (or of <file>, when one is given), and the real file green

   What it asks:
   A  one job uploads the site and does not publish it; another publishes and does not upload
   B  the job that publishes waits for the job that uploads (`needs:`)
   C  the job that publishes declares the environment `github-pages`, the one the owner's approval gates; no other job does
   D  only the job that publishes holds the right to publish (`pages: write`, `id-token: write`): not the workflow, not another job;
      and no other job writes anything at all (every scope it says is `read` or `none`), so the build never pushes a commit.
      Read closed: `write-all` is the right to publish, a quoted "write" is write, and a workflow that says no access
      at its top leaves a job that says none of its own with the repository's default, which is red too
   E  the job that publishes runs none of this repository's code: no checkout, no `run:` step
   F  in the job that uploads, the check of what is uploaded (`node test/public.js _site`) is the step just before the
      upload, after the record is written into it, with no step of any kind between them; and the upload uploads that
      same folder (`path: _site`), so the box that is checked is the box that leaves
   G  nothing here may be skipped or fail quietly: no `if:`, no `continue-on-error`, no `|| true` (nor `|| :`, `|| exit 0`)
   H  the workflow runs on a push to main and on nothing else
   I  every action is pinned to a full commit */
'use strict';
const fs = require('fs'), path = require('path');
const FILE = process.argv.slice(2).filter(x => x !== '--selftest')[0] || path.resolve(__dirname, '..', '.github', 'workflows', 'pages.yml');
const REL = '.github/workflows/pages.yml';
function read(file) {
  let txt; try { txt = fs.readFileSync(file, 'utf8'); } catch (e) { return { fatal: 'could not be read (' + e.code + '), so nobody can say how the game is published' }; }
  return parse(txt);
}
/* access as GitHub reads it: a map of scopes, or one word for all of them (`write-all`, `read-all`, `{}` for none);
   a value in quotes is the same value. The word `all` stands for every scope the line did not name. */
const unq = v => v.replace(/^(['"])(.*)\1$/, '$2');
function access(head, body) {
  const v = unq((head.match(/permissions:\s*(.*)$/) || [])[1] || '');
  if (v === 'write-all') return { all: 'write' };
  if (v === 'read-all') return { all: 'read' };
  if (v === '{}') return {};
  if (v) return { all: 'unread: ' + v };             /* a form this check does not know: never read as no access */
  const out = {}; body.forEach(o => { const m = o.l.match(/^\s*([a-z-]+):\s*(\S+)/); if (m) out[m[1]] = unq(m[2]); }); return out;
}
function parse(txt) {
  const lines = txt.split('\n').map(l => l.replace(/\s+$/, ''));
  const code = l => l.replace(/\s+#.*$/, '');                       /* a line without its trailing comment */
  const real = lines.map((l, i) => ({ l: code(l), i })).filter(o => o.l.trim() && !/^\s*#/.test(o.l));
  const top = k => real.findIndex(o => new RegExp('^' + k + ':').test(o.l));
  const block = (from, indent) => { const out = []; for (let k = from + 1; k < real.length; k++) { const ind = real[k].l.match(/^ */)[0].length; if (ind <= indent) break; out.push(real[k]); } return out; };
  const ji = top('jobs'); if (ji < 0) return { fatal: 'has no `jobs:`' };
  const jobs = []; const jl = block(ji, 0);
  jl.forEach((o, k) => { const m = o.l.match(/^  ([A-Za-z0-9_-]+):\s*$/); if (m) jobs.push({ name: m[1], lines: [] }); else if (jobs.length) jobs[jobs.length - 1].lines.push(o); });
  const perms = ls => { const k = ls.findIndex(o => /^    permissions:/.test(o.l)); if (k < 0) return null; const body = [];
    for (let q = k + 1; q < ls.length; q++) { const o = ls[q], i2 = o.l.match(/^ */)[0].length; if (i2 <= 4) break; body.push(o); } return access(ls[k].l, body); };
  const pi = top('permissions'), wperm = pi < 0 ? null : access(real[pi].l, block(pi, 0));
  const oi = top('on'), on = oi < 0 ? [] : block(oi, 0).map(o => o.l.trim());
  jobs.forEach(j => { const L = j.lines;
    j.uses = L.map(o => (o.l.match(/^\s*(?:-\s*)?uses:\s*(\S+)/) || [])[1]).filter(Boolean);
    j.runs = L.filter(o => /^\s*(?:-\s*)?run:/.test(o.l)).map(o => o.l.replace(/^\s*(?:-\s*)?run:\s*/, ''));
    j.steps = L.filter(o => /^\s*(?:-\s*)?(uses|run):/.test(o.l)).map(o => o.l.replace(/^\s*(?:-\s*)?/, ''));
    j.needs = (L.map(o => (o.l.match(/^    needs:\s*(.+)$/) || [])[1]).filter(Boolean)[0] || '').replace(/[\[\]\s]/g, '').split(',').filter(Boolean);
    j.env = L.some(o => /^    environment:/.test(o.l)) ? (L.map(o => (o.l.match(/^\s*name:\s*(\S+)/) || o.l.match(/^    environment:\s*(\S+)/) || [])[1]).filter(Boolean)[0] || '') : null;
    { const k = L.findIndex(o => /^\s*(?:-\s*)?uses:\s*actions\/upload-pages-artifact@/.test(o.l)); j.upPath = null;
      if (k >= 0) for (let q = k + 1; q < L.length && !/^\s*-\s/.test(L[q].l); q++) { const m = L[q].l.match(/^\s*path:\s*(.+)$/); if (m) j.upPath = unq(m[1].trim()); } }
    j.perms = perms(L); j.quiet = L.filter(o => /^\s*(?:-\s*)?(if|continue-on-error):/.test(o.l) || /\|\|\s*(true|:|exit\s+0)(\s|;|$)/.test(o.l)).map(o => o.l.trim()); });
  return { jobs, wperm, on, quietTop: real.filter(o => /^(if|continue-on-error):/.test(o.l)).map(o => o.l) };
}
function judge(w) {
  if (w.fatal) return [REL + ' ' + w.fatal];
  const out = [], say = s => out.push(s), has = (j, re) => j.uses.some(u => re.test(u));
  const up = w.jobs.filter(j => has(j, /^actions\/upload-pages-artifact@/)), dep = w.jobs.filter(j => has(j, /^actions\/deploy-pages@/));
  const writes = p => !!p && [p.pages || p.all, p['id-token'] || p.all].some(v => v !== undefined && v !== 'read' && v !== 'none');
  if (up.length !== 1 || dep.length !== 1) { say('A · ' + REL + ' has ' + up.length + ' job(s) that upload the site and ' + dep.length + ' that publish it, where one of each is asked'); return out; }
  const U = up[0], D = dep[0];
  if (U === D) { say('A · the site is uploaded and published by one job (`' + U.name + '`), back to back, so the publish can ask for the upload before GitHub lists it: the upload and the publish are two jobs'); return out; }
  if (!D.needs.includes(U.name)) say('B · the job that publishes (`' + D.name + '`) does not wait for the job that uploads (`needs: ' + U.name + '`), so it can start before there is anything to publish');
  if (D.env !== 'github-pages') say('C · the job that publishes (`' + D.name + '`) does not declare the environment `github-pages`, so the owner\'s approval of a deploy would gate nothing');
  w.jobs.filter(j => j !== D && j.env !== null).forEach(j => say('C · the job `' + j.name + '` declares an environment and is not the one that publishes: the approval belongs to the publish alone'));
  if (writes(w.wperm)) say('D · the whole workflow holds the right to publish (`pages: write` or `id-token: write` at its top), so every job does: only the job that publishes may');
  w.jobs.filter(j => j !== D && writes(j.perms)).forEach(j => say('D · the job `' + j.name + '` holds the right to publish and does not publish'));
  w.jobs.filter(j => j !== D && j.perms && !writes(j.perms)).forEach(j => Object.keys(j.perms).filter(k => !['read', 'none'].includes(j.perms[k])).forEach(k => say('D · the job `' + j.name + '` holds `' + k + ': ' + j.perms[k] + '`: only the job that publishes writes anything, so the build never pushes a commit')));
  if (w.wperm === null) w.jobs.filter(j => j !== D && j.perms === null).forEach(j => say('D · neither the workflow\'s top nor the job `' + j.name + '` says what access it holds, so it takes the repository\'s default, which can hold the right to publish: say `permissions:` at the top'));
  if (!D.perms || D.perms.pages !== 'write' || D.perms['id-token'] !== 'write') say('D · the job that publishes (`' + D.name + '`) does not say its own `permissions:` with `pages: write` and `id-token: write`');
  else Object.keys(D.perms).filter(k => k !== 'pages' && k !== 'id-token').forEach(k => say('D · the job that publishes holds `' + k + ': ' + D.perms[k] + '`, which publishing does not need'));
  if (D.runs.length || D.uses.some(u => !/^actions\/deploy-pages@/.test(u))) say('E · the job that publishes runs more than the publish itself (' + D.steps.filter(s => !/^uses:\s*actions\/deploy-pages@/.test(s)).join(' | ').slice(0, 160) + '): it runs none of this repository\'s code');
  { const s = U.steps, ui = s.findIndex(x => /^uses:\s*actions\/upload-pages-artifact@/.test(x)), runsBefore = s.slice(0, ui).filter(x => /^run:/.test(x)), last = runsBefore[runsBefore.length - 1] || '';
    const prev = ui > 0 ? s[ui - 1] : '';
    if (/^run:\s*node test\/public\.js _site\s*$/.test(last) && prev !== last) say('F · in the job that uploads, a step stands between the check of what is uploaded and the upload (`' + prev.slice(0, 80) + '`): nothing may come between them');
    if (U.upPath !== '_site') say('F · the job that uploads uploads `' + (U.upPath === null ? '(no path said)' : U.upPath) + '`, where the folder the check read (`_site`) is asked: the box that is checked must be the box that leaves');
    if (!/^run:\s*node test\/public\.js _site\s*$/.test(last)) say('F · in the job that uploads, the last `run:` step before the upload is `' + last.replace(/^run:\s*/, '').slice(0, 80) + '`, where the check of what is uploaded (`node test/public.js _site`) is asked: the box is checked after the last thing is put in it');
    if (s.slice(ui + 1).some(x => /^run:/.test(x))) say('F · in the job that uploads, a `run:` step comes after the upload'); }
  w.jobs.forEach(j => j.quiet.forEach(q => say('G · the job `' + j.name + '` holds `' + q.slice(0, 80) + '`: a step that is skipped or fails quietly leaves the live game stale with every light green')));
  w.quietTop.forEach(q => say('G · the workflow holds `' + q + '` at its top'));
  if (w.on.join(' | ') !== 'push: | branches: [main]') say('H · the workflow runs on `' + w.on.join(' ').slice(0, 100) + '`, where a push to main and nothing else is asked');
  w.jobs.forEach(j => j.uses.filter(u => !/@[0-9a-f]{40}$/.test(u)).forEach(u => say('I · the job `' + j.name + '` uses `' + u + '`, which is not pinned to a full commit')));
  return out;
}
/* ---------- its own red cases: each sentence planted in a copy of the real file, held in memory ---------- */
function selftest(file) {
  let real; try { real = fs.readFileSync(file, 'utf8'); } catch (e) { console.log('FAIL — ' + REL + ' could not be read (' + e.code + '), so the red cases have nothing to be planted in'); process.exit(1); }
  const bad = []; let n = 0;
  const rep = (from, to) => { if (!real.includes(from)) { bad.push('the plant could not be made: the real file no longer holds ' + JSON.stringify(from.slice(0, 70))); return null; } return real.replace(from, to); };
  const expect = (name, src, re) => { n++; if (src === null) return; const o = judge(parse(src));
    if (re === null ? o.length : !o.some(l => re.test(l))) bad.push(name + ': ' + (re === null ? 'expected no finding, got: ' + o.join(' | ') : 'expected a finding like ' + re + ', got: ' + (o.join(' | ') || 'none'))); };
  const RECORD_PERMS = '    permissions:\n      contents: read', PUB_PERMS = '    permissions:\n      pages: write';
  const RECORD_BLOCK = /    permissions:\n      contents: read[^\n]*\n      pull-requests: read[^\n]*\n      checks: read[^\n]*\n/;
  const block = to => { if (!RECORD_BLOCK.test(real)) { bad.push('the plant could not be made: the real file no longer holds the upload job\'s three lines of access'); return null; } return real.replace(RECORD_BLOCK, to); };
  expect('the real workflow', real, null);
  expect('no jobs at all', 'name: Pages\non:\n  push:\n    branches: [main]\n', /has no `jobs:`/);
  /* A */ expect('A · one job uploads and publishes', rep('      - uses: actions/upload-pages-artifact@', '      - uses: actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e\n      - uses: actions/upload-pages-artifact@').replace(/\n  publish:[\s\S]*$/, '\n'), /^A · the site is uploaded and published by one job/);
  /* A */ expect('A · nothing publishes', rep('uses: actions/deploy-pages@', 'uses: actions/some-other@'), /^A · .* 1 job\(s\) that upload the site and 0 that publish/);
  /* B */ expect('B · the publish does not wait', rep('    needs: record\n', ''), /^B · the job that publishes \(`publish`\) does not wait/);
  /* B */ expect('B · the publish waits for another job', rep('    needs: record\n', '    needs: [other]\n'), /^B · /);
  /* C */ expect('C · the publish declares no environment', rep('    environment:\n      name: github-pages\n      url: ${{ steps.deployment.outputs.page_url }}\n', ''), /^C · the job that publishes \(`publish`\) does not declare the environment/);
  /* C */ expect('C · another environment', rep('      name: github-pages\n', '      name: github-pages-preview\n'), /^C · the job that publishes/);
  /* C */ expect('C · the upload declares it too', rep(RECORD_PERMS, '    environment: github-pages\n' + RECORD_PERMS), /^C · the job `record` declares an environment/);
  /* D */ expect('D · the right to publish at the top', rep('permissions: {}\n', 'permissions:\n  pages: write\n'), /^D · the whole workflow holds the right to publish/);
  /* D */ expect('D · write-all at the top', rep('permissions: {}\n', 'permissions: write-all\n'), /^D · the whole workflow holds the right to publish/);
  /* D */ expect('D · the upload holds id-token', rep(RECORD_PERMS, RECORD_PERMS.replace('contents: read', 'id-token: write\n      contents: read')), /^D · the job `record` holds the right to publish/);
  /* D */ expect('D · the upload holds write-all', block('    permissions: write-all\n'), /^D · the job `record` holds the right to publish/);
  /* D */ expect('D · a quoted write', rep(RECORD_PERMS, RECORD_PERMS.replace('contents: read', 'pages: "write"\n      contents: read')), /^D · the job `record` holds the right to publish/);
  /* D */ expect('D · nothing said, so the default', (block('') || '').replace('permissions: {}\n', ''), /^D · neither the workflow's top nor the job `record` says/);
  /* D */ expect('D · the publish says no access of its own', rep(PUB_PERMS + '      # to publish the uploaded site\n      id-token: write   # deploy-pages proves to Pages which run it is\n', ''), /^D · the job that publishes \(`publish`\) does not say its own `permissions:`/);
  /* D */ expect('D · the publish holds more', rep(PUB_PERMS, PUB_PERMS + '\n      contents: write'), /^D · the job that publishes holds `contents: write`/);
  /* E */ expect('E · the publish checks out the code', rep('      - id: deployment\n', '      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262\n      - id: deployment\n'), /^E · the job that publishes runs more than the publish itself/);
  /* E */ expect('E · the publish runs a script', rep('      - id: deployment\n', '      - run: node scripts/anything.js\n      - id: deployment\n'), /^E · .*node scripts\/anything\.js/);
  /* F */ expect('F · a step after the check of the box', rep('        run: node test/public.js _site\n', '        run: node test/public.js _site\n      - run: echo late >> _site/late.txt\n'), /^F · in the job that uploads, the last `run:` step before the upload is `echo late/);
  /* F */ expect('F · the box not checked', rep('        run: node test/public.js _site\n', '        run: echo skipped\n'), /^F · .*`echo skipped`/);
  /* F */ expect('F · a step after the upload', rep('          path: _site\n', '          path: _site\n      - run: node test/record.js _site/status.json\n'), /^F · in the job that uploads, a `run:` step comes after the upload/);
  /* F */ expect('F · another folder uploaded', rep('          path: _site\n', '          path: .\n'), /^F · the job that uploads uploads `\.`/);
  /* F */ expect('F · a step of another kind in between', rep('      - uses: actions/upload-pages-artifact@', '      - uses: actions/configure-pages@983d7736d9b0ae728b81ab479565c72886d7745b\n      - uses: actions/upload-pages-artifact@'), /^F · in the job that uploads, a step stands between/);
  /* D */ expect('D · the upload writes the repository', rep(RECORD_PERMS, '    permissions:\n      contents: write'), /^D · the job `record` holds `contents: write`: only the job that publishes writes/);
  /* G */ expect('G · a step that may be skipped', rep('      - id: deployment\n', '      - id: deployment\n        if: ${{ false }}\n'), /^G · the job `publish` holds `if:/);
  /* G */ expect('G · a step that may fail', rep('        run: node test/record.js _site/status.json\n', '        run: node test/record.js _site/status.json\n        continue-on-error: true\n'), /^G · the job `record` holds `continue-on-error: true`/);
  /* G */ expect('G · a check that cannot fail', rep('run: node test/record.js _site/status.json', 'run: node test/record.js _site/status.json || true'), /^G · the job `record` holds `run: node test\/record\.js _site\/status\.json \|\| true`/);
  /* G */ expect('G · a job that may be skipped', rep('  publish:\n    needs: record\n', '  publish:\n    needs: record\n    if: github.ref == \'refs/heads/other\'\n'), /^G · the job `publish` holds `if: github\.ref/);
  /* H */ expect('H · a hand-made run', rep('  push:\n    branches: [main]\n', '  push:\n    branches: [main]\n  workflow_dispatch:\n'), /^H · the workflow runs on .*workflow_dispatch/);
  /* H */ expect('H · every branch', rep('    branches: [main]\n', '    branches: [main, "*"]\n'), /^H · /);
  /* I */ expect('I · an action on a tag', rep('actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e', 'actions/deploy-pages@v4'), /^I · the job `publish` uses `actions\/deploy-pages@v4`, which is not pinned/);
  /* I */ expect('I · an action on a short commit', rep('actions/checkout@11d5960a326750d5838078e36cf38b85af677262', 'actions/checkout@11d5960'), /^I · the job `record` uses `actions\/checkout@11d5960`/);
  if (bad.length) { console.log('FAIL — the publish check\'s own red cases:'); bad.forEach(l => console.log('- ' + l)); process.exit(1); }
  console.log('OK — the publish check went red for each of ' + (n - 1) + ' plants, with its sentence (A to I), and green on ' + REL + ' as it is.');
  process.exit(0);
}
if (process.argv.includes('--selftest')) selftest(process.argv.filter(x => x !== '--selftest')[2] || FILE);
const fails = judge(read(FILE));
if (fails.length) { console.log('FAIL'); fails.forEach(f => console.log('- ' + f)); process.exit(1); }
console.log('OK — the game is uploaded by one job and published by another that waits for it, declares the owner\'s environment, alone holds the right to publish and runs none of this repository\'s code; what is uploaded is checked last; nothing is skipped quietly; a push to main is the only way in; every action is pinned.');
