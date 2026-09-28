#!/usr/bin/env node
/* THE VENDORED FILES — every third-party byte a player runs, checked against its recorded fingerprint.
   Moved out of test/leaves.js on 2026-09-28 so the PUBLIC repository can run it too: leaves.js also reads
   private documents, and this check must not stay behind with them. leaves.js still calls it, unchanged.

   Run:  node test/vendored.js */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

/* ---- CI-4 (2026-09-21): vendor/three.min.js is 608 KB of minified code and qr.js runs in every
   player's browser; a one-line change in either is invisible in a diff. test/vendor.sha256 is the
   thing a reviewer can check, and this recomputes it. It lives under test/ and not vendor/ because
   scripts/build-site.sh copies vendor/ whole into the public box — the first draft shipped a README
   and a hash file to every player (21 files in the box, not 19).
   Updating a library: replace the file, `sha256sum vendor/three.min.js qr.js > test/vendor.sha256`,
   and say in the commit where the new bytes came from. */
function vendored(root) {
  root = root || ROOT; const P = [], sums = path.join(root, 'test', 'vendor.sha256');
  if (!fs.existsSync(path.join(root, 'vendor')) && !fs.existsSync(path.join(root, 'qr.js'))) return P;   /* nothing vendored here (a fixture) */
  if (!fs.existsSync(sums)) { P.push('test/vendor.sha256 is missing — the two third-party files every player runs have no recorded hash'); return P; }
  const crypto = require('crypto');
  /* 2026-09-27 (#254, Zeni's audit): a list that names nothing checked nothing and passed, a line it could
     not read was skipped without a word, and a file dropped into vendor/ that nobody listed was never read.
     All three are reds now: every file under vendor/ is named here, and every line here is a hash and a path. */
  const named = new Set();
  const lines = fs.readFileSync(sums, 'utf8').split('\n').filter(l => l.trim());
  if (!lines.length) P.push('test/vendor.sha256 names no file at all — the third-party files every player runs are checked against nothing');
  lines.forEach(line => {
    const [want, rel] = line.trim().split(/\s+/);
    if (!/^[0-9a-f]{64}$/.test(want || '') || !rel) { P.push('test/vendor.sha256 has a line that is not a hash and a path: "' + line.trim().slice(0, 60) + '"'); return; }
    named.add(rel);
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) { P.push('test/vendor.sha256 names ' + rel + ' and there is no such file'); return; }
    const got = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
    if (got !== want) P.push(rel + ' does not match test/vendor.sha256 — the vendored bytes changed; if that was meant, re-run sha256sum and say in the commit where the new bytes came from');
  });
  const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
  walk(path.join(root, 'vendor')).map(f => path.relative(root, f).split(path.sep).join('/')).filter(rel => !named.has(rel))
    .forEach(rel => P.push(rel + ' is under vendor/, ships to every player, and test/vendor.sha256 does not name it — add its hash and say in the commit where the bytes came from'));
  return P;
}

if (require.main === module) {
  const P = vendored(ROOT);
  if (P.length) { console.log('FAIL\n- ' + P.join('\n- ')); process.exit(1); }
  const n = fs.readFileSync(path.join(ROOT, 'test', 'vendor.sha256'), 'utf8').split('\n').filter(l => l.trim()).length;
  console.log('OK: ' + n + ' third-party files match their recorded fingerprints, and nothing under vendor/ is unlisted.');
}

module.exports = { vendored };
