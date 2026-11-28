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
     · the list the gate's first step asks about is the same list as `needs`;
     · PRIVACY FIRST (the owner's confirmed goal of 2026-11-25): a part named `privacy` runs the privacy scans and waits for
       nothing, and every other part waits for it (`needs: [privacy]`), so nothing starts until they are green;
     · THE ENGINE IN ITS PARTS (the same goal): the part `engine` runs, side by side and none stopping the others, exactly the
       parts test/engine.smoke.js has (`--part`), each handed to it, so a part added to the file is never left unrun.
   It reads the file as text, with no YAML library, so what it cannot read is a red, never a pass.
     node test/gate.js              reads .github/workflows/ci.yml
     node test/gate.js --selftest   its own red cases, on copies of the real file held in memory */
const fs = require('fs'), path = require('path');
const FILE = '.github/workflows/ci.yml';

function judge(src, engineParts) {
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
  const job = id => jobs.find(j => j.id === id), jl = j => lines.slice(j.from, j.to);
  const pv = job('privacy');
  if (!pv) say('there is no part named `privacy`, so nothing makes the other parts wait for the privacy scans');
  else {
    if (jl(pv).some(l => /^ {4}needs:/.test(l))) say('the part `privacy` waits for another part, where it runs first');
    jobs.slice(1).filter(j => j.id !== 'privacy').forEach(j => { const n = jl(j).filter(l => /^ {4}needs:/.test(l)), m = n.length === 1 ? /^ {4}needs:\s*\[([^\]]*)\]\s*$/.exec(n[0]) : null;
      if (!m || !m[1].split(',').map(x => x.trim()).includes('privacy')) say('the part `' + j.id + '` does not wait for the privacy scans (`needs: [privacy]`), so it can start before they are green'); });
    ['scripts/private-terms.js', 'test/authors.js', 'test/vendored.js', 'test/keys.js', 'test/quotes.js'].forEach(f => { if (!jl(pv).some(l => l.includes(f) && !/^\s*#/.test(l))) say('the part `privacy` does not run ' + f); });
  }
  const en = job('engine');
  if (!en) say('there is no part named `engine`');
  else if (!Array.isArray(engineParts) || !engineParts.length) say('test/engine.smoke.js names no parts this check can read, so whether the part `engine` runs them all is not known');
  else { const b = jl(en), ml = b.find(l => /^ {8}part:\s*\[/.test(l)), mp = ml ? /\[([^\]]*)\]/.exec(ml)[1].split(',').map(x => x.trim()).filter(Boolean) : null;
    if (!mp) say('the part `engine` does not run in parts (no `part: [...]` in its matrix), where test/engine.smoke.js has ' + engineParts.join(', '));
    else { engineParts.filter(x => !mp.includes(x)).forEach(x => say('the engine\'s part `' + x + '` is never run: the part `engine` runs ' + mp.join(', ')));
      mp.filter(x => !engineParts.includes(x)).forEach(x => say('the part `engine` runs a part `' + x + '` that test/engine.smoke.js does not have')); }
    if (!b.some(l => /^ {6}fail-fast:\s*false\s*$/.test(l))) say('the part `engine` stops its other parts when one fails (`fail-fast: false` is missing), so a red in one hides what the others find');
    if (!b.some(l => /--part\s+"\$PART"/.test(l)) || !b.some(l => /PART:\s*\$\{\{\s*matrix\.part\s*\}\}/.test(l))) say('the part `engine` does not hand its part to test/engine.smoke.js (`--part "$PART"`, with PART from matrix.part), so each leg would run the whole file'); }
  return P;
}

const root = path.join(__dirname, '..');
let real; try { real = fs.readFileSync(path.join(root, FILE), 'utf8'); } catch (e) { real = null; }
/* the engine check's parts, as the file itself lists them (the list it refuses any other part by) */
let EP = null; try { const m = /!\[([^\]]*)\]\.includes\(part\)/.exec(fs.readFileSync(path.join(root, 'test', 'engine.smoke.js'), 'utf8')); if (m) EP = (m[1].match(/'([^']+)'/g) || []).map(x => x.slice(1, -1)); } catch (e) { EP = null; }

if (process.argv.includes('--selftest')) {
  const bad = [];
  const expect = (name, src, re, ep) => { const P = judge(src, ep || EP); if (re === null ? P.length : !P.some(s => re.test(s))) bad.push(name + ': ' + (re === null ? 'expected no finding, got: ' + P.join(' | ') : 'expected a finding like ' + re + ', got: ' + (P.join(' | ') || 'none'))); };
  if (typeof real !== 'string') { console.log('FAIL — ' + FILE + ' could not be read, so the red cases have nothing to be planted in'); process.exit(1); }
  const rep = (a, b) => { if (!real.includes(a)) { bad.push('the plant could not be made: the real file no longer holds ' + JSON.stringify(a)); return real; } return real.replace(a, b); };
  expect('the real workflow', real, null);
  expect('nothing to read', '', /could not be read/);
  expect('a part left out of needs', rep('needs: [privacy, content, engine, gauge, horno, site]', 'needs: [privacy, content, engine, gauge, horno]'), /`site` is not in the gate's `needs`/);
  expect('a new part nobody listed', real + '\n  extra:\n    needs: [privacy]\n    runs-on: ubuntu-latest\n    steps:\n      - run: "true"\n', /`extra` is not in the gate's `needs`/);
  expect('a part the step does not ask about', rep('const want = ["privacy", "content", "engine", "gauge", "horno", "site"];', 'const want = ["privacy", "content", "engine", "gauge", "horno"];'), /waits for `site` and its first step does not ask/);
  expect('always() taken off', rep('    if: ${{ always() }}\n', ''), /does not run whatever the parts did/);
  expect('the gate renamed', rep('\n  smoke:\n', '\n  check:\n'), /first job .* is `check`/);
  expect('needs written another way', rep('needs: [privacy, content, engine, gauge, horno, site]', 'needs:\n      - content'), /`needs:`/);
  expect('the results not handed in', rep('PARTS: ${{ toJSON(needs) }}', 'PARTS: ""'), /no longer handed the parts' results/);
  expect('a need that is no job', rep('needs: [privacy, content, engine, gauge, horno, site]', 'needs: [privacy, content, engine, gauge, horno, site, ghost]'), /waits for `ghost`, which is not a job/);
  expect('a part that starts before the privacy scans', rep('\n  content:\n    needs: [privacy]\n', '\n  content:\n'), /`content` does not wait for the privacy scans/);
  expect('a new part that does not wait for them', real + '\n  extra:\n    runs-on: ubuntu-latest\n    steps:\n      - run: "true"\n', /`extra` does not wait for the privacy scans/);
  expect('no privacy part', rep('\n  privacy:\n', '\n  scans:\n'), /no part named `privacy`/);
  expect('the privacy part waiting for another', rep('\n  privacy:\n    runs-on:', '\n  privacy:\n    needs: [site]\n    runs-on:'), /`privacy` waits for another part/);
  expect('a privacy scan dropped', rep('run: node test/keys.js\n', 'run: "true"\n'), /`privacy` does not run test\/keys\.js/);
  expect('the engine in one piece', rep('        part: [map, body, rest]\n', ''), /does not run in parts/);
  expect('an engine part never run', rep('        part: [map, body, rest]\n', '        part: [map, body]\n'), /part `rest` is never run/);
  expect('an engine part the file does not have', rep('        part: [map, body, rest]\n', '        part: [map, body, rest, ghost]\n'), /runs a part `ghost` that/);
  expect('a part added to the file and not run', real, /part `extra` is never run/, ['map', 'body', 'rest', 'extra']);
  expect('one red stopping the others', rep('      fail-fast: false\n      matrix:\n        part:', '      matrix:\n        part:'), /stops its other parts when one fails/);
  expect('the part not handed', rep('--part "$PART"', ''), /does not hand its part/);
  if (bad.length) { console.log('FAIL — the gate check\'s own red cases:'); bad.forEach(b => console.log('- ' + b)); process.exit(1); }
  console.log('OK — the gate check went red for each of 20 plants, with its sentence, and green on the workflow as it is.');
  process.exit(0);
}
const P = judge(real, EP);
if (P.length) { console.log('FAIL — the gate does not name every part:'); P.forEach(s => console.log('- ' + s)); process.exit(1); }
console.log('OK — the gate named smoke is first, runs whatever the parts did, waits for every other job in the workflow, and asks about each of them; the privacy scans run first and every other part waits for them; the engine runs its parts (' + (EP || []).join(', ') + ') side by side.');
