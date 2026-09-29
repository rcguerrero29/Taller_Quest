#!/usr/bin/env node
/* THE SESSION GUARD ON MAIN — no Claude session pushes to `main`, forced or not.
   The owner, 2026-09-28, choosing the free plan for the private repository (#260): GitHub's free plan
   enforces the main lock on public repositories only, so once this repository is private nothing at
   GitHub's end stops a push to its `main`. This is the part we can build ourselves: every session in
   this project runs it before a push (.claude/settings.json), and it refuses one that lands on `main`:
   `main`, `HEAD:main`, `+main`, `:main`, `refs/heads/main`, `--delete main`, `--mirror`, `--all`, or a bare
   `git push` while standing on `main`. A push to any other branch passes, a forced one included (a
   session's own branch may need it). It guards sessions only: a person at a terminal, or another tool,
   is not stopped by it. The alarm that notices anything that gets past is test/mainwatch.js.
   ONE EXCEPTION (2026-09-28, the art reference's first commit, and runbook step 7 after it): a push may CREATE
   `main` in a repository that has no branches at all. There is nothing there to overwrite, and a new
   repository's first commit has nowhere else to go. It is asked of the remote itself (`git ls-remote --heads`),
   and a remote that cannot be read, or that has any branch at all, is refused as before.

   Run:  node test/pushguard.js --hook       (Claude Code's PreToolUse hook: reads the command on stdin)
         node test/pushguard.js --selftest */
const { execFileSync } = require('child_process');
const { isPush } = require('./authors.js');

/* the words of a command, with simple quotes removed; good enough for the shapes a push takes */
const words = s => (s.match(/"[^"]*"|'[^']*'|\S+/g) || []).map(w => w.replace(/^["']|["']$/g, ''));

/* every `git ... push ...` in a command line, as its words after `push` plus any -C directory */
function pushes(cmd) {
  const out = [];
  String(cmd || '').split(/&&|\|\||;|\||\n/).forEach(seg => {
    if (!isPush(seg)) return;
    const w = words(seg), g = w.indexOf('git');
    if (g < 0) return;
    let i = g + 1, dir = null;
    while (i < w.length && w[i] !== 'push') { if (w[i] === '-C') dir = w[i + 1]; i++; }
    if (w[i] === 'push') out.push({ args: w.slice(i + 1), dir });
  });
  return out;
}

/* why one push lands on main, or null; branchOf(dir) answers "which branch is checked out there", and
   headsOf(dir, remote) lists the remote's branches (it throws when the remote cannot be read) */
function verdict(p, branchOf, headsOf) {
  const flags = p.args.filter(a => a.startsWith('-')), pos = p.args.filter(a => !a.startsWith('-'));
  if (flags.some(f => f === '--mirror')) return 'a --mirror push rewrites every branch on the remote, main included';
  if (flags.some(f => f === '--all')) return 'an --all push sends every local branch, main included';
  const refspecs = pos.slice(1);
  for (const r of refspecs) {
    const dest = (r.includes(':') ? r.slice(r.lastIndexOf(':') + 1) : r).replace(/^\+/, '').replace(/^refs\/heads\//, '');
    if (dest === 'main') {
      if (r.startsWith(':') || flags.some(f => f === '--delete' || f === '-d')) return 'this deletes main';
      let heads = null; try { heads = headsOf ? headsOf(p.dir, pos[0]) : null; } catch (e) { heads = null; }
      if (Array.isArray(heads) && heads.length === 0) continue;   /* the first commit of an empty repository */
      return 'this pushes to main (' + r + ')';
    }
  }
  if (!refspecs.length) {
    let b = null; try { b = branchOf(p.dir); } catch (e) { b = null; }
    if (b === 'main') return 'a bare push while main is checked out pushes to main';
    if (b == null) return 'a bare push from a checkout whose branch could not be read; name the branch you mean';
  }
  return null;
}

const gitHeads = (dir, remote) => execFileSync('git', (dir ? ['-C', dir] : []).concat(['ls-remote', '--heads', remote]), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000 })
  .split('\n').filter(Boolean);
const gitBranch = dir => execFileSync('git', dir ? ['-C', dir, 'rev-parse', '--abbrev-ref', 'HEAD'] : ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

function judge(cmd, branchOf, headsOf) {
  return pushes(cmd).map(p => verdict(p, branchOf, headsOf)).filter(Boolean);
}

function selftest() {
  let total = 0; const bad = [];
  const mark = (ok, what, why) => { total++; console.log((ok ? '  ok   ' : '  FAIL ') + what + (ok ? '' : '  (' + why + ')')); if (!ok) bad.push(what); };
  const on = b => () => b;
  const cases = [
    ['git push -u origin claude/upbeat-x', 'claude/upbeat-x', false],
    ['git push -q origin claude/upbeat-x', 'claude/upbeat-x', false],
    ['git push --force-with-lease origin claude/upbeat-x', 'claude/upbeat-x', false],
    ['git push origin mainline', 'mainline', false],
    ['git push origin feature:main-docs', 'feature', false],
    ['git push', 'claude/upbeat-x', false],
    ['git status && git log', 'main', false],
    ['git commit -m "notes"', 'main', false],
    ['git push origin main', 'claude/x', true],
    ['git push origin HEAD:main', 'claude/x', true],
    ['git push origin +main', 'claude/x', true],
    ['git push --force origin main', 'claude/x', true],
    ['git push -f origin HEAD:refs/heads/main', 'claude/x', true],
    ['git push origin :main', 'claude/x', true],
    ['git push origin --delete main', 'claude/x', true],
    ['git push --mirror origin', 'claude/x', true],
    ['git push --all origin', 'claude/x', true],
    ['cd /repo && git push origin main', 'claude/x', true],
    ['git -C /repo push origin main', 'claude/x', true],
    ['git fetch origin main && git push -u origin claude/x && git push origin main', 'claude/x', true],
    ['git push', 'main', true],
    ['git push origin', 'main', true],
  ];
  cases.forEach(([cmd, branch, want]) => {
    const got = judge(cmd, on(branch)).length > 0;
    mark(got === want, (want ? 'refused: ' : 'allowed: ') + cmd + (cmd.endsWith('push') || cmd.endsWith('origin') ? ' (standing on ' + branch + ')' : ''), 'got ' + (got ? 'refused' : 'allowed'));
  });
  const unknown = judge('git push', () => { throw new Error('no repository'); });
  mark(unknown.length === 1, 'a bare push whose branch cannot be read is refused, not waved through', JSON.stringify(unknown));
  /* the one exception: creating main in a repository with no branches at all */
  const heads = list => () => list, unreadable = () => { throw new Error('offline'); };
  const ex = [
    ['git push -u origin main', heads([]), false, 'creating main in an empty repository is allowed'],
    ['git push origin HEAD:main', heads([]), false, 'creating it by HEAD:main in an empty repository is allowed'],
    ['git push origin main', heads(['abc\trefs/heads/main']), true, 'a repository that has main is refused'],
    ['git push origin main', heads(['abc\trefs/heads/art']), true, 'a repository with any other branch is refused (main may have been deleted)'],
    ['git push origin main', unreadable, true, 'a remote that cannot be read is refused'],
    ['git push origin :main', heads([]), true, 'a delete is refused even there'],
    ['git push --mirror origin', heads([]), true, 'a mirror push is refused even there'],
  ];
  ex.forEach(([cmd, h, want, what]) => { const got = judge(cmd, on('claude/x'), h).length > 0; mark(got === want, what, 'got ' + (got ? 'refused' : 'allowed')); });
  if (bad.length) { console.log('FAIL: ' + bad.length + ' of ' + total); process.exit(1); }
  console.log('OK: ' + total + ' cases, no git, no network.');
  process.exit(0);
}

if (require.main === module) {
  if (process.argv.includes('--selftest')) return void selftest();
  if (process.argv.includes('--hook')) {
    let input = ''; try { input = require('fs').readFileSync(0, 'utf8'); } catch (e) {}
    let cmd = null, cwd = null;
    try { const j = JSON.parse(input) || {}; cmd = (j.tool_input || {}).command; cwd = j.cwd || null; } catch (e) {}
    if (typeof cmd !== 'string' || !isPush(cmd)) process.exit(0);
    let why;
    try { why = judge(cmd, dir => gitBranch(dir || cwd), (dir, remote) => gitHeads(dir || cwd, remote)); }
    catch (e) { why = ['the push could not be read, so it is not waved through']; }
    if (!why.length) process.exit(0);
    process.stderr.write('PUSH REFUSED by test/pushguard.js: ' + why.join('; ') + '.\n' +
      '`main` changes only through a pull request the owner merges (AGENTS.md; #260: on the free plan GitHub does not\n' +
      'enforce that for a private repository, so sessions enforce it themselves). Push your own branch and open a pull request.\n');
    process.exit(2);
  }
  console.log('usage: node test/pushguard.js --hook | --selftest');
}

module.exports = { pushes, verdict, judge };
