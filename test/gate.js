#!/usr/bin/env node
/* THE GATE NAMES EVERY PART (2026-11-13). The public check runs in parts, and the job named `smoke` is the gate: the
   main line waits for it alone, and it fails unless every part passed. That holds only for the parts the gate is told
   about. A part added to the workflow and left out of the gate's `needs`, or taken out of the list its first step
   asks about, would run, could fail, and would block nothing: no red anywhere. This reads the workflow and fails
   unless
     · the first job is the gate, and it is the job the gate's step runs in;
     · the gate runs whatever the parts did (`if: ${{ always() }}`), because a required job that is skipped counts as
       passed on GitHub;
     · every other job in the workflow is in the gate's `needs`, and nothing is in `needs` that is not a job;
     · the list the gate's first step asks about is the same list as `needs`.
   It reads the file as text, with no YAML library, so what it cannot read is a red, never a pass.
     node test/gate.js              reads .github/workflows/ci.yml
     node test/gate.js --selftest   its own red cases, on copies of the real file held in memory */
const fs = require('fs'), path = require('path');
const FILE = '.github/workflows/ci.yml';

function judge(src) {
  const P = [], say = s => P.push(s);
  if (typeof src !== 'string' || !src.trim()) return [FILE + ' could not be read, so nobody can say the gate names every part'];
  const lines = src.split('\n'), at = lines.findIndex(l => /^jobs:\s*$/.test(l));
  if (at < 0) return [FILE + ' has no `jobs:` this check can find, so the gate could not be read'];
  const jobs = [];
  for (let i = at + 1; i < lines.length; i++) {
    const m = /^ {2}([A-Za-z_][\w-]*):\s*$/.exec(lines[i]);
    if (m) jobs.push({ id: m[1], from: i, to: lines.length }); else if (/^\S/.test(lines[i]) && lines[i].trim() && !lines[i].startsWith('#')) break;
  }
  jobs.forEach((j, k) => { if (jobs[k + 1]) j.to = jobs[k + 1].from; });
  if (jobs.length < 2) return [FILE + ' names ' + jobs.length + ' job(s); the gate and at least one part are expected, so the workflow was not read as it is'];
  const gate = jobs[0], body = lines.slice(gate.from, gate.to), parts = jobs.slice(1).map(j => j.id);
  if (gate.id !== 'smoke') say('the first job in ' + FILE + ' is `' + gate.id + '`, where the gate named `smoke` is expected first: the main line waits for the first job');
  const needsLine = body.filter(l => /^ {4}needs:/.test(l));
  if (needsLine.length !== 1) { say('the gate has ' + needsLine.length + ' `needs:` line(s) this check can read (one, written `needs: [a, b]`, is expected), so which parts it waits for is not known'); return P; }
  const nm = /^ {4}needs:\s*\[([^\]]*)\]\s*$/.exec(needsLine[0]);
  if (!nm) { say('the gate\'s `needs:` is not written as a list on one line (`needs: [a, b]`), so this check cannot read which parts it waits for'); return P; }
  const needs = nm[1].split(',').map(s => s.trim()).filter(Boolean);
  if (!body.some(l => /^ {4}if:\s*\$\{\{\s*always\(\)\s*\}\}\s*$/.test(l))) say('the gate does not run whatever the parts did (`if: ${{ always() }}` is missing or changed): a part that fails would leave the gate skipped, and a skipped required job counts as passed');
  parts.filter(p => !needs.includes(p)).forEach(p => say('the part `' + p + '` is not in the gate\'s `needs`, so it can fail and block nothing'));
  needs.filter(n => !parts.includes(n)).forEach(n => say('the gate waits for `' + n + '`, which is not a job in ' + FILE));
  const wl = body.filter(l => /const want\s*=\s*\[/.test(l));
  if (wl.length !== 1) { say('the gate\'s first step has ' + wl.length + ' list(s) of the parts it asks about (`const want = [...]`), where one is expected'); return P; }
  const want = (/\[([^\]]*)\]/.exec(wl[0])[1].match(/"([^"]+)"/g) || []).map(s => s.slice(1, -1));
  needs.filter(n => !want.includes(n)).forEach(n => say('the gate waits for `' + n + '` and its first step does not ask whether it passed'));
  want.filter(n => !needs.includes(n)).forEach(n => say('the gate\'s first step asks about `' + n + '`, which the gate does not wait for'));
  if (!body.some(l => /PARTS:\s*\$\{\{\s*toJSON\(needs\)\s*\}\}/.test(l))) say('the gate\'s first step is no longer handed the parts\' results (`PARTS: ${{ toJSON(needs) }}`), so it cannot tell a red part from a green one');
  return P;
}

const root = path.join(__dirname, '..');
let real; try { real = fs.readFileSync(path.join(root, FILE), 'utf8'); } catch (e) { real = null; }

if (process.argv.includes('--selftest')) {
  const bad = [];
  const expect = (name, src, re) => { const P = judge(src); if (re === null ? P.length : !P.some(s => re.test(s))) bad.push(name + ': ' + (re === null ? 'expected no finding, got: ' + P.join(' | ') : 'expected a finding like ' + re + ', got: ' + (P.join(' | ') || 'none'))); };
  if (typeof real !== 'string') { console.log('FAIL — ' + FILE + ' could not be read, so the red cases have nothing to be planted in'); process.exit(1); }
  const rep = (a, b) => { if (!real.includes(a)) { bad.push('the plant could not be made: the real file no longer holds ' + JSON.stringify(a)); return real; } return real.replace(a, b); };
  expect('the real workflow', real, null);
  expect('nothing to read', '', /could not be read/);
  expect('a part left out of needs', rep('needs: [content, engine, gauge, horno, site]', 'needs: [content, engine, gauge, horno]'), /`site` is not in the gate's `needs`/);
  expect('a new part nobody listed', real + '\n  extra:\n    runs-on: ubuntu-latest\n    steps:\n      - run: "true"\n', /`extra` is not in the gate's `needs`/);
  expect('a part the step does not ask about', rep('const want = ["content", "engine", "gauge", "horno", "site"];', 'const want = ["content", "engine", "gauge", "horno"];'), /waits for `site` and its first step does not ask/);
  expect('always() taken off', rep('    if: ${{ always() }}\n', ''), /does not run whatever the parts did/);
  expect('the gate renamed', rep('\n  smoke:\n', '\n  check:\n'), /first job .* is `check`/);
  expect('needs written another way', rep('needs: [content, engine, gauge, horno, site]', 'needs:\n      - content'), /`needs:`/);
  expect('the results not handed in', rep('PARTS: ${{ toJSON(needs) }}', 'PARTS: ""'), /no longer handed the parts' results/);
  expect('a need that is no job', rep('needs: [content, engine, gauge, horno, site]', 'needs: [content, engine, gauge, horno, site, ghost]'), /waits for `ghost`, which is not a job/);
  if (bad.length) { console.log('FAIL — the gate check\'s own red cases:'); bad.forEach(b => console.log('- ' + b)); process.exit(1); }
  console.log('OK — the gate check went red for each of 9 plants, with its sentence, and green on the workflow as it is.');
  process.exit(0);
}
const P = judge(real);
if (P.length) { console.log('FAIL — the gate does not name every part:'); P.forEach(s => console.log('- ' + s)); process.exit(1); }
console.log('OK — the gate named smoke is first, runs whatever the parts did, waits for every other job in the workflow, and asks about each of them.');
