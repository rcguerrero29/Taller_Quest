#!/usr/bin/env node
/* THE KEY SCAN — nothing that looks like a password or an access key is ever committed.
   The owner, 2026-09-28: "also key scan?" GitHub looks for keys by itself only in PUBLIC repositories on the
   free plan, so after the split the private repository has no scan unless it runs one (docs/SPLIT.md step 4b).
   This reads every tracked text file, and every file name, against KEYS below. A match fails the build,
   named by file:line and the kind of key, NEVER by the value: a key printed in a log is a key leaked twice.
   test/public.js asks the same question of the built site from this same list, so the two cannot drift.

   Run:  node test/keys.js              (the tracked files)
         node test/keys.js --selftest   (made-up keys, assembled at run time; none is in this file) */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');

const KEYS = [
  [/gh[pousr]_[A-Za-z0-9]{20,}/, 'a GitHub token'],
  [/github_pat_[A-Za-z0-9_]{20,}/, 'a GitHub fine-grained token'],
  [/AKIA[0-9A-Z]{12,}/, 'an AWS key id'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/, 'a Slack token'],
  [/AIza[0-9A-Za-z_-]{35}/, 'a Google API key'],
  [/sk-ant-[A-Za-z0-9_-]{20,}/, 'an Anthropic API key'],
];

/* every hit as "file:line — what it looks like", never the value */
function scan(files) {
  const hits = [];
  files.forEach(({ file, text }) => {
    KEYS.forEach(([re, what]) => { if (re.test(file)) hits.push(file + ' (its name) — looks like ' + what); });
    if (text == null) return;
    text.split('\n').forEach((line, i) => KEYS.forEach(([re, what]) => { if (re.test(line)) hits.push(file + ':' + (i + 1) + ' — looks like ' + what); }));
  });
  return hits;
}

function trackedFiles(root) {
  const list = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean);
  return list.map(file => {
    let buf; try { buf = fs.readFileSync(path.join(root, file)); } catch (e) { return null; }
    return { file, text: buf.subarray(0, 8000).includes(0) ? null : buf.toString('utf8') };
  }).filter(Boolean);
}

function selftest() {
  let total = 0; const bad = [];
  const mark = (ok, what, why) => { total++; console.log((ok ? '  ok   ' : '  FAIL ') + what + (ok ? '' : '  (' + why + ')')); if (!ok) bad.push(what); };
  /* made-up keys, built here so that no string in this file matches a pattern */
  const fake = {
    github: 'gh' + 'p_' + 'a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8',
    pat: 'github' + '_pat_' + '11ABCDEFG0123456789_abcdefghijklmnopqrstuvwxyz',
    aws: 'AK' + 'IA' + 'ABCDEFGHIJKLMNOP',
    pem: '-----BEGIN RSA ' + 'PRIVATE KEY-----',
    slack: 'xo' + 'xb-' + '1234567890-abcdefghij',
    google: 'AI' + 'za' + 'Sy' + 'A'.repeat(33),
    anthropic: 'sk-' + 'ant-' + 'api03-' + 'x'.repeat(24),
  };
  Object.entries(fake).forEach(([kind, value]) => {
    const hits = scan([{ file: 'docs/n.md', text: 'one\nthe value ' + value + ' here\n' }]);
    mark(hits.length === 1 && /^docs\/n\.md:2 — looks like /.test(hits[0]) && hits[0].indexOf(value) < 0, 'a ' + kind + ' key in a note is red, named by line and never by value', JSON.stringify(hits));
  });
  mark(scan([{ file: 'a.md', text: 'the word token, a github_pat mention, and AKIA alone' }]).length === 0, 'the words alone are not a key', 'a plain sentence was red');
  mark(scan([{ file: 'img/' + fake.github + '.png', text: null }]).length === 1, 'a key in a file name is red too', 'the name was not read');
  mark(scan([{ file: 'x.png', text: null }]).length === 0, 'a binary file with a plain name passes', 'it was red');
  const leak = scan([{ file: 'c.js', text: 'const t = "' + fake.github + '";' }]);
  mark(leak.length === 1 && leak[0].indexOf(fake.github) < 0 && leak[0].indexOf(fake.github.slice(4, 16)) < 0, 'the report never quotes any part of the key', JSON.stringify(leak));
  if (bad.length) { console.log('FAIL: ' + bad.length + ' of ' + total); process.exit(1); }
  console.log('OK: ' + total + ' cases, made-up keys only.');
  process.exit(0);
}

if (require.main === module) {
  if (process.argv.includes('--selftest')) return void selftest();
  let files;
  try { files = trackedFiles(ROOT); }
  catch (e) { console.log('FAIL: the tracked files could not be listed, so nothing was scanned; that is a red, not a pass'); process.exit(1); }
  if (!files.length) { console.log('FAIL: no tracked files at all, so nothing was scanned; that is a red, not a pass'); process.exit(1); }
  const hits = scan(files);
  if (hits.length) {
    console.log('FAIL: ' + hits.length + ' thing(s) that look like a password or an access key are committed. Remove each one, and if it was a real key, revoke it where it was issued: once pushed, it is in the history.');
    hits.slice(0, 50).forEach(h => console.log('- ' + h));
    process.exit(1);
  }
  console.log('OK: ' + files.length + ' tracked files and their names read against ' + KEYS.length + ' kinds of key; nothing found.');
}

module.exports = { KEYS, scan };
