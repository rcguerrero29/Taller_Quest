#!/usr/bin/env node
/* test/assumed.js — every place an agent said "ASSUMED:", in one list.

   Written 2026-09-20 at the owner's word: "start a request for labeling and organizing code so that
   a human can if they need to only- find any thing that may have been assumed by AI and not commented
   to show or delineate any specific features."

     node test/assumed.js          list every ASSUMED: marker in the tree, by file, and the count.
                                   ALWAYS EXITS 0 — an assumption is not a fault; an UNMARKED one is,
                                   and no grep can find those. That is the audit (AGENTS.md §10), a
                                   crew run with a run ID, not a check.

   The count is printed even when it is zero, and zero is not reassurance: it means either nothing
   was assumed or nothing was marked, and this tool cannot tell which (docs/GAUGE.md). */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
let files = [];
try { files = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean); }
catch (e) { console.log('assumed: git ls-files failed, so nothing was scanned — that is not "nothing assumed".'); process.exit(0); }
/* CODE ONLY — "labeling and organizing code" is what he asked for. A doc that mentions the marker
   (AGENTS.md defines it) is not an assumption in the code, and the first run of this listed the
   definition as three findings. Docs have their own registers. */
const CODE = /\.(js|mjs|html|css|sh|ya?ml|json)$/;
const SKIP = /^(vendor\/|node_modules\/|docs\/|\.claude\/)/;
const hits = [];
const scanned = files.filter(f => CODE.test(f) && !SKIP.test(f) && f !== 'test/assumed.js');
scanned.forEach(f => {
  let src; try { src = fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { return; }
  src.split('\n').forEach((line, i) => {
    const m = /ASSUMED:\s*(.*)$/.exec(line);
    if (m) hits.push({ f, n: i + 1, what: m[1].trim().slice(0, 110) });
  });
});
const byFile = {}; hits.forEach(h => (byFile[h.f] = byFile[h.f] || []).push(h));
Object.keys(byFile).sort().forEach(f => { console.log(f); byFile[f].forEach(h => console.log('  :' + h.n + '  ' + h.what)); });
console.log((hits.length ? '\n' : '') + 'assumed: ' + hits.length + ' marked assumption(s) in ' + Object.keys(byFile).length + ' file(s), ' + scanned.length + ' code files scanned (docs/ and .claude/ are not code and are not scanned).' +
            (hits.length ? '' : ' Zero means nothing was marked, not that nothing was assumed — the audit (AGENTS.md §10) finds the unmarked ones.'));
process.exit(0);
