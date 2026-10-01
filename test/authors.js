#!/usr/bin/env node
/* NO PERSONAL ADDRESS LEAVES TOWN — not in a commit, not in a file.
   The owner, 2026-09-24: "whattt you forget about targetted phishing attacks ... i thought we had a
   cybersecurity expert in our engine... someones failing."

   What happened. Every commit carries an author name and address, and a committer, to a public server
   on every push — and none of it is in a diff, so no review, no persona and no guard ever looked. [Personal addresses once reached commit metadata; this guard is why that cannot happen again.] An address
   tied to his name, his account and a public record of which tools he uses is what a targeted phishing
   email is built from. docs/BOUNDARY.md row 13½ is this edge.

   THE RULE IS AN ALLOW-LIST, CLOSED BY DEFAULT. The only addresses that may appear are no-reply ones —
   GitHub's per-account no-reply (…@users.noreply.github.com, bots included), GitHub's own
   (noreply@github.com), Claude's (noreply@anthropic.com) — and the reserved example domains (RFC 2606).
   Anything else is red, whoever wrote it. A new agent that commits under its own address stays red
   until somebody decides, here, that its address may be public.

   What it reads:
   - every commit about to ship: author, committer, and every address in the message (a
     Co-authored-by trailer is an address too);
   - every text file in the working tree, tracked or not — an uncommitted file leaks the moment it is
     pushed. No file is exempt, this one included: its fixtures build their addresses at run time.
   It never prints an address. CI logs on a public repository are public, so it names the commit, the
   field and the DOMAIN only.

   What it cannot do: take back what is already public. The range never reaches the commits above.

   Run:  node test/authors.js                   commits not yet on origin/main, and the working tree
         node test/authors.js <base> [head]     commits in base..head, and the working tree
         node test/authors.js --selftest        fixtures, no git, no network */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');

/* an address in running text: a local part, an @, and a dotted domain ending in letters — so
   `playwright@1.63.0` and `user@localhost` are not addresses, and a two-part country domain is */
const EMAIL = /[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,24}(?![A-Za-z0-9-])/g;
const ALLOWED = [
  /^(?:[0-9]+\+)?[A-Za-z0-9-]+(?:\[bot\])?@users\.noreply\.github\.com$/i,
  /^noreply@github\.com$/i,
  /^noreply@anthropic\.com$/i,
  /^[^@\s]+@example\.(?:com|org|net)$/i,
];
const allowed = a => ALLOWED.some(re => re.test(a));
const domain = a => (a.split('@').pop() || '').toLowerCase();

/* commits: [{ sha, author, committer, body }] → sentences a person would say, never an address */
function judgeCommits(commits) {
  const P = [];
  commits.forEach(c => {
    const short = (c.sha || '').slice(0, 7);
    [['author', c.author], ['committer', c.committer]].forEach(([field, a]) => {
      if (a && !allowed(a))
        P.push('commit ' + short + ': its ' + field + ' address is at ' + domain(a) + ', not a no-reply one — every push publishes it, and it stays in the history for good');
    });
    (String(c.body || '').match(EMAIL) || []).filter(a => !allowed(a)).forEach(a =>
      P.push('commit ' + short + ': its message carries an address at ' + domain(a) + ' — a trailer or a signature is published with the commit'));
  });
  return P;
}

/* files: [{ file, text }] → the same, per line */
function judgeFiles(files) {
  const P = [];
  files.forEach(({ file, text }) => {
    String(text).split('\n').forEach((line, i) => {
      (line.match(EMAIL) || []).filter(a => !allowed(a)).forEach(a =>
        P.push(file + ':' + (i + 1) + ' holds an address at ' + domain(a) + ' — this repository is public, so it is already readable once pushed'));
    });
  });
  return P;
}

/* A script that ASKS git for a name or an address will sooner or later print one, and CI logs on a
   public repository are public: test/runs.js printed the owner's full name and a personal address in a
   NOTE eleven times a run from 2026-09-23 to 2026-09-24, and nothing here could see it, because the
   address was never in a file — it was in the log. So no script under test/, .github/ or scripts/ may
   put a name or address placeholder in a git format string. The one exception is THIS file, named here
   rather than hidden: asking is its job, it prints a domain and never an address, and its self-test
   fails the day it prints one (the "it printed the address" cases). */
const IDENTITY = /%[ac][nNeElL](?![A-Za-z])|%\((?:author|committer|tagger)(?:name|email)/;
const FORMATS = /--(?:format|pretty)\b|\b(?:format|pretty)=|for-each-ref/;
const READER = 'test/authors.js';
function judgeScripts(files) {
  const P = [];
  files.filter(({ file }) => /^(?:test|\.github|scripts)\//.test(file) && file !== READER).forEach(({ file, text }) => {
    String(text).split('\n').forEach((line, i) => {
      if (FORMATS.test(line) && IDENTITY.test(line))
        P.push(file + ':' + (i + 1) + ' asks git for a name or an address — whatever it prints lands in a public CI log; ask for the hash and the message, and let test/authors.js be the one reader');
    });
  });
  return P;
}

/* `git log --format=%H%x00%ae%x00%ce%x00%B%x1e` */
function parseLog(out) {
  return String(out).split('\x1e').map(s => s.replace(/^\n+/, '')).filter(Boolean).map(rec => {
    const [sha, author, committer, ...body] = rec.split('\x00');
    return { sha, author, committer, body: body.join('\x00') };
  });
}

function readCommits(base, head) {
  const out = execFileSync('git', ['log', '--format=%H%x00%ae%x00%ce%x00%B%x1e', base + '..' + head],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  return parseLog(out);
}

/* what git could ship: every tracked file, and every untracked one that is not ignored — an
   uncommitted file leaks the moment somebody adds and pushes it. Ignored paths (a local worktree, the
   built site) are not read: git will not carry them. */
function readFiles(root) {
  const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const files = [];
  [...new Set(out.split('\0').filter(Boolean))].forEach(rel => {
    let buf; try { buf = fs.readFileSync(path.join(root, rel)); } catch (err) { return; }   // deleted, not yet staged
    if (buf.subarray(0, 8000).includes(0)) return;   // binary: an image, a font
    files.push({ file: rel, text: buf.toString('utf8') });
  });
  return files;
}

/* THE HOOK (.claude/settings.json): Claude Code hands every Bash command to this before it runs.
   Anything but a `git push` passes untouched; a push runs the whole check first and is refused
   (exit 2) if it is red — so an address is stopped on the machine, before it is published, which
   CI cannot do: by the time CI reads a commit, the push has already made it public. */
const PUSH = /(?:^|[\s;&|(])git(?:\s+(?:-C\s+\S+|-c\s+\S+|--[\w-]+(?:=\S+)?))*\s+push\b/;
const isPush = cmd => PUSH.test(String(cmd || ''));

function selftest() {
  /* every address here is assembled at run time, so this file holds none for the scan to find */
  const at = (u, d) => u + '@' + d;
  const SECRET = 'someone.private';                 // the local part that must never be printed
  const personal = at(SECRET, 'gmail.com');
  const claude = at('noreply', 'anthropic.com'), gh = at('noreply', 'github.com');
  const ok = (a, b, body) => ({ sha: 'a'.repeat(40), author: a, committer: b, body: body || 'a message\n' });
  const cases = [
    ['a Claude commit merged on GitHub is green', [ok(claude, gh)], 0],
    ['a commit under a GitHub per-account no-reply is green', [ok(at('12345+somebody', 'users.noreply.github.com'), gh)], 0],
    ['a bot\'s no-reply is green', [ok(at('41898282+github-actions[bot]', 'users.noreply.github.com'), gh)], 0],
    ['case does not matter to an address', [ok(at('NoReply', 'Anthropic.com'), gh)], 0],
    ['a Claude co-author trailer is green', [ok(claude, claude, 'x\n\nCo-Authored-By: Claude <' + claude + '>\n')], 0],
    ['an example address in a message is green', [ok(claude, claude, 'write to ' + at('someone', 'example.com'))], 0],
    ['no commits at all is green — nothing is about to ship', [], 0],
    ['a personal author', [ok(personal, gh)], 1],
    ['a personal committer only', [ok(claude, personal)], 1],
    ['a personal co-author trailer', [ok(claude, claude, 'x\n\nCo-authored-by: Somebody <' + personal + '>\n')], 1],
    ['a look-alike: the Claude address with a domain on the end', [ok(at('noreply', 'anthropic.com.attacker.test'), gh)], 1],
    ['a look-alike: GitHub\'s no-reply with a domain on the end', [ok(at('1+x', 'users.noreply.github.com.attacker.test'), gh)], 1],
    ['a work address is red too — the rule is no-reply or nothing', [ok(at('someone', 'some-company.mx'), gh)], 1],
  ];
  const fileCases = [
    ['a file with no address is green', [{ file: 'a.md', text: 'plain words\n' }], 0],
    ['a version pin is not an address', [{ file: 'ci.yml', text: 'npm install playwright' + '@' + '1.63.0\n' }], 0],
    ['a host with no dot is not an address', [{ file: 'a.md', text: 'ssh ' + at('me', 'localhost') + '\n' }], 0],
    ['the Claude trailer written into a doc is green', [{ file: 'a.md', text: 'Co-Authored-By: Claude <' + claude + '>\n' }], 0],
    ['a personal address in a doc', [{ file: 'docs/ASKS.md', text: 'one\ntwo ' + personal + ' three\n' }], 1],
    ['a personal address in a string in the game', [{ file: 'content/x.js', text: 'say:"write to ' + personal + '"' }], 1],
  ];
  const bad = [];
  const mark = (good, what, why) => { console.log((good ? '  ok   ' : '  FAIL ') + what + (good ? '' : '  (' + why + ')')); if (!good) bad.push(what); };
  const leaks = P => P.some(p => p.indexOf(SECRET) >= 0);
  cases.forEach(([what, commits, want]) => {
    const P = judgeCommits(commits), got = P.length ? 1 : 0;
    mark(got === want && !leaks(P), what, leaks(P) ? 'it printed the address' : 'wanted ' + (want ? 'red' : 'green') + ', got ' + (got ? 'red' : 'green'));
  });
  fileCases.forEach(([what, files, want]) => {
    const P = judgeFiles(files), got = P.length ? 1 : 0;
    mark(got === want && !leaks(P), what, leaks(P) ? 'it printed the address' : 'wanted ' + (want ? 'red' : 'green') + ', got ' + (got ? 'red' : 'green'));
  });
  /* a script that asks git for identities is red wherever it sits, except the one reader */
  const scriptCases = [
    ['the old runs.js line, asking for a name and an address', [{ file: 'test/runs.js', text: "gitLines(['log', '-1', '--format=%H%x00%an%x00%ae%x00%B'])" }], 1],
    ['a workflow asking for the committer\'s address', [{ file: '.github/workflows/x.yml', text: 'run: git log -1 --pretty=%ce' }], 1],
    ['a for-each-ref asking for the author', [{ file: 'scripts/x.sh', text: 'git for-each-ref --format="%(authoremail)" refs/heads' }], 1],
    ['asking for the hash and the message is green', [{ file: 'test/runs.js', text: "gitLines(['log', '-1', '--format=%H%x00%B'])" }], 0],
    ['a URL-encoded byte with no format is green', [{ file: 'test/x.js', text: "const u = 'a%aeb';" }], 0],
    ['the same line in a doc is not a script', [{ file: 'docs/x.md', text: '--format=%an' }], 0],
    ['the one reader may ask', [{ file: 'test/authors.js', text: "'--format=%H%x00%ae'" }], 0],
  ];
  scriptCases.forEach(([what, files, want]) => {
    const got = judgeScripts(files).length ? 1 : 0;
    mark(got === want, what, 'wanted ' + (want ? 'red' : 'green') + ', got ' + (got ? 'red' : 'green'));
  });
  /* the red sentence names the line, so a person can find it */
  const where = judgeFiles([{ file: 'docs/ASKS.md', text: 'one\ntwo ' + personal + '\n' }]);
  mark(where.length === 1 && where[0].indexOf('docs/ASKS.md:2 ') === 0, 'a red names the file and the line', JSON.stringify(where));
  /* git's own output, as the reader sees it: two commits, one message with a blank line inside */
  const log = ['a'.repeat(40), claude, gh, 'one\n\nbody\n'].join('\x00') + '\x1e\n' + ['b'.repeat(40), personal, gh, 'two\n'].join('\x00') + '\x1e\n';
  const parsed = parseLog(log);
  mark(parsed.length === 2 && parsed[1].author === personal && parsed[0].body.indexOf('body') > 0, 'git\'s log is read as two commits with their fields', JSON.stringify(parsed.map(c => c.sha.slice(0, 1))));
  /* the hook's reading of a command: only a push is stopped */
  const pushCases = [
    ['git push -u origin claude/x', true], ['cd /repo && git push origin main', true],
    ['git -C /repo push', true], ['git -c core.x=y push --force-with-lease', true],
    ['git status && git log', false], ['echo pushing', false], ['npm run push', false],
    // a push named inside a message is over-read: that only runs the check, which is the safe side
    ['git commit -m "about git push"', true],
  ];
  pushCases.forEach(([cmd, want]) => mark(isPush(cmd) === want, 'the hook reads "' + cmd + '" as ' + (want ? 'a push' : 'not a push'), 'got ' + isPush(cmd)));
  const total = cases.length + fileCases.length + 2 + pushCases.length + scriptCases.length;
  if (bad.length) { console.log('FAIL — ' + bad.length + ' of ' + total); process.exit(1); }
  console.log('OK — ' + total + ' cases, on fixtures, no git, no network.');
  process.exit(0);
}

if (require.main === module) {
  if (process.argv.includes('--selftest')) return void selftest();
  if (process.argv.includes('--hook')) {
    let input = ''; try { input = fs.readFileSync(0, 'utf8'); } catch (e) {}
    /* input it cannot read is not waved through: it runs the check, which passes in a fraction of a
       second when there is nothing to find (Zeni, 2026-09-24) */
    let cmd = null; try { cmd = ((JSON.parse(input) || {}).tool_input || {}).command; } catch (e) {}
    if (typeof cmd === 'string' && !isPush(cmd)) process.exit(0);
    /* A check that never finishes refuses; it does not wave a push through (#279). The check below
       takes 0.2 s here (measured 2026-09-30). 45 s is far above that and under the 60 s that
       .claude/settings.json gives this whole hook, so the refusal is this file's own, in its own words. */
    const LIMIT_S = 45, t0 = Date.now();
    const { spawnSync } = require('child_process');
    const r = spawnSync(process.execPath, [__filename], { cwd: ROOT, encoding: 'utf8', timeout: LIMIT_S * 1000, killSignal: 'SIGKILL' });
    if (r.error && r.error.code === 'ETIMEDOUT') {
      process.stderr.write('PUSH REFUSED by test/authors.js — the address check (node test/authors.js) was still running after ' +
        Math.round((Date.now() - t0) / 1000) + ' s, where it normally takes under a second, so it was stopped and cannot say what this push would publish.\n' +
        'Run `node test/authors.js` by hand to see where it sticks.\n');
      process.exit(2);
    }
    if (r.status === 0) process.exit(0);
    process.stderr.write('PUSH REFUSED by test/authors.js — this push would publish an address that is not a no-reply one.\n' + (r.stdout || '') + (r.stderr || '') +
      'If the commit it names is already on main, run `git fetch origin main` and try again.\n');
    process.exit(2);
  }
  const base = process.argv[2] || 'origin/main', head = process.argv[3] || 'HEAD';
  let commits;
  try { commits = readCommits(base, head); }
  catch (e) {
    console.log('FAIL\n- could not read the commits in ' + base + '..' + head + ' (' + String(e.message).split('\n')[0] + '), so this check cannot say which addresses are about to be published — that is a red, not a pass');
    process.exit(1);
  }
  let files;
  try { files = readFiles(ROOT); }
  catch (e) { console.log('FAIL\n- could not read the working tree (' + e.message + ') — that is a red, not a pass'); process.exit(1); }
  if (!files.length) { console.log('FAIL\n- found no text files to read at all — that is a red, not a pass'); process.exit(1); }
  const P = judgeCommits(commits).concat(judgeFiles(files), judgeScripts(files));
  if (P.length) {
    console.log('FAIL');
    P.forEach(p => console.log('- ' + p));
    console.log('Fix a commit with `git commit --amend --reset-author` (or a rebase) BEFORE it is pushed, after\n`git config user.email` is set to a no-reply address. Once pushed, it is public: see docs/BOUNDARY.md row 13½.');
    process.exit(1);
  }
  console.log('OK — ' + commits.length + ' commit(s) in ' + base + '..' + head + ' and ' + files.length + ' text files: every address is a no-reply one.');
  process.exit(0);
}

module.exports = { judgeCommits, judgeFiles, judgeScripts, parseLog, allowed, isPush };
