#!/usr/bin/env node
/* THE SESSION GUARD ON MAIN — no Claude session pushes to `main`, forced or not.
   The owner, 2026-09-28, choosing the free plan for the private repository (#260): GitHub's free plan
   enforces the main lock on public repositories only, so once this repository is private nothing at
   GitHub's end stops a push to its `main`. This is the part we can build ourselves: every session in
   this project runs it before a push (.claude/settings.json), and it refuses one that lands on `main`:
   `main`, `HEAD:main`, `+main`, `:main`, `refs/heads/main` or git's shorthand `heads/main`, `--delete main`, `--mirror`, `--all`, or a bare
   `git push`, `git push origin HEAD` or `git push origin @` while standing on `main`. A push to any other branch passes, a forced one included (a
   session's own branch may need it). It guards sessions only: a person at a terminal, or another tool,
   is not stopped by it. The alarm that notices anything that gets past is test/mainwatch.js.
   ONE EXCEPTION (2026-09-28, the art reference's first commit, and runbook step 7 after it): a push may CREATE
   `main` in a repository that has no branches at all. There is nothing there to overwrite, and a new
   repository's first commit has nowhere else to go. It is asked of the remote itself (`git ls-remote --heads`),
   and a remote that cannot be read, or that has any branch at all, is refused as before.

   AND NOWHERE ELSE WITH THIS REPOSITORY'S HISTORY (2026-10-18). A push carries every commit behind what it
   sends, so a branch of this checkout pushed to any repository but its own would publish the whole history
   with it, back to the first commit and whatever was written before anything was cleaned. Until this day the
   checks before a push read only the commits that are new against this checkout's own main, so that route
   looked green, and the empty-repository exception above even let it create a new repository's `main`. Now a
   push is read for where it really goes and what it really carries:
   - WHERE, by git's own answer: the repository word (a remote, a URL or a path; `--repo`; for a bare push the
     remote git picks: branch.<b>.pushRemote, remote.pushDefault, branch.<b>.remote, else origin) and, for a
     remote, every URL git would push to (`git remote get-url --push --all`, so a pushurl, a pushInsteadOf or
     insteadOf rewrite and several URLs are read), asked with the push's own `-c` settings of remote., url.,
     branch. and push. It goes to this checkout's own repository only when it names a remote and every one of
     those URLs is the fetch URL of origin in the repository this file is in. A URL or a path typed into the
     push is never own, this repository's included: push to it by its remote's name.
   - WHAT: the commits it sends (each refspec's source, or every ref there when it names none, a pattern, `:`,
     `--all`, `--mirror` or `--tags`), read in the repository the push leaves from, replacement refs off. It
     carries this repository's history when one of them is a commit of this checkout's main (origin/main, or
     HEAD where there is none): it reaches this repository's first commit. Where the push leaves from a shallow
     clone, the parents its history was cut at count too.
   - A push to another repository that carries none of it passes (a fresh history, which is what a clean copy
     starts), and so does one that only deletes there. One that carries any is refused, and so is one this cannot
     read: a directory the words do not tell, a word only the run knows, settings given another way, a source it
     cannot find. The refusal says what to do instead: seed the new repository from a clean copy.
   WHAT STILL PASSES, said plainly: origin itself repointed (`git remote set-url origin <elsewhere>`), since own is
   what origin says; a fresh commit of this repository's files (`git checkout --orphan`, `git commit-tree`), which
   carries no history and leaves its contents to the other checks; a branch made only of commits older than a
   shallow checkout holds, pushed from a deeper clone; and a push made by another program (test/authors.js).
   The empty-repository question above is still asked of origin's fetch URL, not the URL a push goes to.

   Run:  node test/pushguard.js --hook       (Claude Code's PreToolUse hook: reads the command on stdin)
         node test/pushguard.js --selftest   (stubs, then throwaway repositories in the system's temporary folder; no network) */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
/* every `git ... push ...` in a command line, as its words after `push` and the directory it runs in. The
   reader is test/authors.js's, shared so the two hooks cannot read one command two ways (2026-10-16: it
   lived here until then; it now also finds git by full path or in quotes, follows `cd`, `env -C`,
   `--git-dir` and GIT_DIR=, reads `sh -c` scripts, and marks a directory it cannot tell as unknown). Found in
   the branch's review, the same day: a command substitution is one word only the run knows, so `git -C $(echo DIR)`
   is a directory this cannot tell, a remote or branch built that way (`git push origin $(echo main)`) may be
   main and is refused, and so is a push whose git or command is built at run time (`$(which git) push`) */
const { isPush, pushes, liveAlias } = require('./authors.js');
const ROOT = path.join(__dirname, '..');

/* why one push lands on main, or null; branchOf(dir) answers "which branch is checked out there", and
   headsOf(dir, remote) lists the remote's branches (it throws when the remote cannot be read) */
function mainVerdict(p, branchOf, headsOf) {
  if (p.unread) return 'a push this check cannot read: git, or its command, is built at run time (a $VARIABLE or a command substitution); write the command out';
  const flags = p.args.filter(a => a.startsWith('-')), pos = p.args.filter(a => !a.startsWith('-'));
  if (flags.some(f => f === '--mirror')) return 'a --mirror push rewrites every branch on the remote, main included';
  if (flags.some(f => f === '--all')) return 'an --all push sends every local branch, main included';
  if (p.args.some((a, n) => !a.startsWith('-') && p.dyn && p.dyn[n]))
    return 'a push whose remote or branch only the run knows (a $VARIABLE or a command substitution) may land on main; name them: git push <remote> <branch>';
  const refspecs = pos.slice(1);
  for (const r of refspecs) {
    let dest = (r.includes(':') ? r.slice(r.lastIndexOf(':') + 1) : r).replace(/^\+/, '').replace(/^(?:refs\/)?heads\//, ''), here = '';
    /* refs/heads/main and heads/main are both git's names for main (the third review, 2026-10-16: `heads/main` was
       allowed); a branch really named heads/<x> is then read as <x>, which over-refuses heads/main only */
    /* HEAD or @ with no :<dst> updates the remote branch named like the one checked out where the push runs
       (the branch's second review, 2026-10-16: standing on main, `git push origin HEAD` was allowed) */
    if (!r.includes(':') && (dest === 'HEAD' || dest === '@')) {
      if (p.unknown) return 'a push of ' + dest + ' from a directory its words do not tell (cd -, a $VARIABLE); name it with git -C <directory>';
      let b = null; try { b = branchOf(p.dir); } catch (e) { b = null; }
      if (b == null) return 'a push of ' + dest + ' from a checkout whose branch could not be read; name the branch you mean';
      dest = b; here = ', with ' + b + ' checked out';
    }
    if (dest === 'main') {
      if (r.startsWith(':') || flags.some(f => f === '--delete' || f === '-d')) return 'this deletes main';
      let heads = null; try { heads = headsOf && !p.unknown ? headsOf(p.dir, pos[0]) : null; } catch (e) { heads = null; }
      if (Array.isArray(heads) && heads.length === 0) continue;   /* the first commit of an empty repository */
      return 'this pushes to main (' + r + here + ')';
    }
  }
  if (!refspecs.length) {
    if (p.unknown) return 'a bare push from a directory its words do not tell (cd -, a $VARIABLE); name it with git -C <directory>';
    let b = null; try { b = branchOf(p.dir); } catch (e) { b = null; }
    if (b === 'main') return 'a bare push while main is checked out pushes to main';
    if (b == null) return 'a bare push from a checkout whose branch could not be read; name the branch you mean';
  }
  return null;
}

/* THE WORDS AFTER `push`, AS GIT READS THEM (2026-10-18): the repository (the first word that is not an option, else
   --repo), the refspecs after it, and the options that change what is sent. An option that takes the next word
   takes it, so `-o ci.skip simmer x` goes to simmer */
const VALUED = new Set(['--repo', '--push-option', '--receive-pack', '--exec', '--recurse-submodules']);   /* and -o, read with the short options */
function pushArgs(args) {
  const a = { repo: null, refspecs: [], all: false, del: false }, pos = [];
  let repoOpt = null;
  for (let i = 0; i < args.length; i++) {
    const x = args[i];
    if (x === '--') { pos.push(...args.slice(i + 1)); break; }
    if (!x.startsWith('-') || x === '-') { pos.push(x); continue; }
    const eq = x.indexOf('='), name = eq > 0 ? x.slice(0, eq) : x;
    if (name === '--repo') { repoOpt = eq > 0 ? x.slice(eq + 1) : (args[++i] == null ? null : args[i]); continue; }
    if (VALUED.has(name)) { if (eq < 0) i++; continue; }
    if (name === '--all' || name === '--branches' || name === '--mirror' || name === '--tags') a.all = true;
    else if (name === '--delete') a.del = true;
    else if (/^-[A-Za-z]+$/.test(x)) {                       /* short options together: -d deletes; -o takes a value */
      const o = x.indexOf('o', 1);
      if ((o < 0 ? x : x.slice(0, o)).includes('d')) a.del = true;
      if (o === x.length - 1) i++;
    }
  }
  a.repo = pos.length ? pos[0] : repoOpt;
  a.refspecs = pos.slice(1);
  return a;
}

/* what a push sends: the names of the commits it starts from; null when that is every ref there (no refspec,
   a pattern, `:`, --all, --mirror, --tags, only negative refspecs); [] when it only deletes */
function sources(a) {
  if (a.del) return [];
  if (a.all || !a.refspecs.length) return null;
  const out = [];
  let positive = 0;
  for (const r of a.refspecs) {
    const x = r.replace(/^\+/, '');
    if (x.startsWith('^')) continue;                       /* a negative refspec sends nothing of its own */
    positive++;
    if (x === ':' || x.includes('*')) return null;
    const src = x.includes(':') ? x.slice(0, x.indexOf(':')) : x;
    if (src) out.push(src);                                /* :<dst> deletes <dst> there */
  }
  return positive ? out : null;
}

/* the settings of a push that change where it goes, handed back to git when it is asked; an include is a file of
   settings this does not read */
const WHERE_KEYS = /^(?:remote|url|branch|push)\./i;
const INCLUDE = /^include(?:if\..*)?\.path(?:=|$)/i;
const redact = u => String(u).replace(/^([A-Za-z][A-Za-z0-9+.-]*:\/\/)[^\/@\s]*@/, '$1');   /* a user or a token in a URL is not printed */

/* why one push would carry this repository's history to another repository, or null. reach (live() below, or a
   stub) answers: defaultRemote(dir, cfg), the remote a bare push goes to; dest(dir, repo, cfg), { own, shown }:
   whether that is this checkout's own repository; carries(dir, sources), how many commits of this repository's
   own history those sources hold (sources null: every ref there) */
function historyVerdict(p, reach) {
  if (!reach || typeof reach.dest !== 'function' || typeof reach.carries !== 'function' || typeof reach.defaultRemote !== 'function')
    return 'where this push goes was not read (the check was given nothing to read it with), so it is not waved through';
  if (p.unread) return null;                               /* mainVerdict has refused it already */
  if (p.unknown) return 'a push from a directory its words do not tell (cd -, a $VARIABLE) may go to any repository with any history; name the directory with git -C <directory>';
  if (p.cfgUnread || (p.cfg || []).some(c => INCLUDE.test(c)))
    return 'a push whose git settings are given in a way this check cannot read (--config-env, --exec-path, an include, env -i or -u, sudo, or GIT_CONFIG…, HOME=, XDG_CONFIG_HOME=, GIT_EXEC_PATH= before git) may go to another repository than its words say; push plainly';
  if (p.args.some((x, n) => p.dyn && p.dyn[n])) return 'a push with a word only the run knows (a $VARIABLE or a command substitution) may go to any repository; write it out';
  const a = pushArgs(p.args);
  let repo = a.repo, picked = false;
  if (repo == null) {
    picked = true;
    try { repo = reach.defaultRemote(p.dir, p.cfg || []); } catch (e) { repo = null; }
    if (!repo) return 'which repository this bare push goes to could not be read; name it: git push <remote> <branch>';
  }
  let d = null; try { d = reach.dest(p.dir, repo, p.cfg || []); } catch (e) { d = null; }
  if (!d || typeof d.own !== 'boolean') return 'where this push goes (' + redact(repo) + ') could not be read, so it is not waved through';
  if (d.own) return null;
  const src = sources(a);
  if (Array.isArray(src) && !src.length) return null;      /* it only deletes there: it sends no commit */
  const what = src ? src.join(', ') : 'what a push naming no single source sends (read as every branch and tag there)';
  const where = d.shown + (picked ? ', the repository a bare push goes to from there' : '') + ', which is not this checkout\'s own repository';
  let n;
  try { n = reach.carries(p.dir, src); }
  catch (e) { return 'this push sends ' + what + ' to ' + where + ', and what that holds could not be read (' + String((e && e.message) || e).split('\n')[0] + '), so it is not waved through'; }
  if (!Number.isInteger(n) || n < 0) return 'this push sends ' + what + ' to ' + where + ', and what that holds could not be counted, so it is not waved through';
  if (!n) return null;
  return 'this push sends ' + what + ' to ' + where + ', and that carries ' + n + ' commit' + (n === 1 ? '' : 's') + ' of this repository\'s own history';
}

const verdict = (p, branchOf, headsOf, reach) => mainVerdict(p, branchOf, headsOf) || historyVerdict(p, reach);

/* a URL as two of them are compared: file:// and a path read as the folder it names, then no trailing / or .git */
function norm(u, base) {
  let x = String(u == null ? '' : u).trim();
  if (/^file:\/\//i.test(x)) x = x.replace(/^file:\/\/(?:localhost)?/i, '');
  else if (!/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(x) && !/^[^\/]*:/.test(x)) x = path.resolve(base || '.', x);
  return x.replace(/\/+$/, '').replace(/\.git$/i, '').replace(/\/+$/, '');
}

/* the live answers, from git, for a hook whose cwd is `cwd`, in a checkout whose own repository is `root`'s origin */
function live(cwd, root) {
  const base = cwd || process.cwd();
  const at = dir => dir == null ? base : path.resolve(base, dir);
  const run = (args, env) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000, maxBuffer: 256 * 1024 * 1024, env: env || process.env });
  const lines = out => String(out).split('\n').map(x => x.trim()).filter(Boolean);
  const given = cfg => (cfg || []).filter(c => WHERE_KEYS.test(c)).flatMap(c => ['-c', c]);
  const said = m => Object.assign(new Error(m), { said: true });
  let own, history;
  const ownUrl = () => {
    if (own === undefined) { try { own = norm(run(['-C', root, 'remote', 'get-url', '--', 'origin']).trim(), root); } catch (e) { own = null; } }
    return own;
  };
  /* this repository's own history: every commit of its main (origin/main; HEAD where there is none) */
  const mine = () => {
    if (history) return history;
    let tip = '';
    for (const ref of ['refs/remotes/origin/main', 'HEAD']) {
      try { tip = run(['-C', root, 'rev-parse', '--verify', '--quiet', '--end-of-options', ref + '^{commit}']).trim(); } catch (e) { tip = ''; }
      if (tip) break;
    }
    if (!tip) throw said('this checkout\'s own history could not be read');
    history = new Set(lines(run(['--no-replace-objects', '-C', root, 'rev-list', tip, '--'])));
    if (!history.size) throw said('this checkout\'s own history holds no commit');
    return history;
  };
  return {
    branchOf: dir => run(['-C', at(dir), 'rev-parse', '--abbrev-ref', 'HEAD']).trim(),
    headsOf: (dir, remote) => lines(run(['-C', at(dir), 'ls-remote', '--heads', remote])),
    reach: {
      alias: liveAlias(base),
      defaultRemote(dir, cfg) {
        const where = at(dir), g = given(cfg);
        let b = null; try { b = run(['-C', where].concat(g, ['symbolic-ref', '--quiet', '--short', 'HEAD'])).trim() || null; } catch (e) { b = null; }
        const get = k => { try { return run(['-C', where].concat(g, ['config', '--get', k])).trim() || null; } catch (e) { if (e.status === 1) return null; throw e; } };
        return (b && get('branch.' + b + '.pushRemote')) || get('remote.pushDefault') || (b && get('branch.' + b + '.remote')) || 'origin';
      },
      dest(dir, repo, cfg) {
        const where = at(dir);
        let urls = null;
        try { urls = lines(run(['-C', where].concat(given(cfg), ['remote', 'get-url', '--push', '--all', '--', repo]))); } catch (e) { urls = null; }
        if (!urls) return { own: false, shown: redact(repo) };          /* a URL or a path typed into the push */
        const o = ownUrl();
        return { own: o != null && urls.length > 0 && urls.every(u => norm(u, where) === o), shown: repo + ' (' + urls.map(redact).join(', ') + ')' };
      },
      carries(dir, srcs) {
        const where = at(dir), H = mine();
        const tips = srcs == null ? ['--all'] : srcs.map(s => {
          let t = ''; try { t = run(['-C', where, 'rev-parse', '--verify', '--quiet', '--end-of-options', s + '^{commit}']).trim(); } catch (e) { t = ''; }
          if (!/^[0-9a-f]{40,64}$/.test(t)) throw said(s + ' names no commit there');
          return t;
        });
        let sent;
        try { sent = lines(run(['--no-replace-objects', '-C', where, 'rev-list'].concat(tips, ['--']))); } catch (e) { throw said('git could not list its commits there'); }
        if (!sent.length) throw said('it holds no commit at all');
        let n = sent.filter(c => H.has(c)).length;
        let shallow = ''; try { shallow = run(['-C', where, 'rev-parse', '--is-shallow-repository']).trim(); } catch (e) { throw said('git could not say whether that repository is shallow'); }
        if (!n && shallow === 'true') {                      /* a shallow clone: the parents its history was cut at count too */
          let cut;
          try { cut = new Set(lines(fs.readFileSync(path.resolve(where, run(['-C', where, 'rev-parse', '--git-path', 'shallow']).trim()), 'utf8'))); }
          catch (e) { throw said('where that shallow clone\'s history was cut could not be read'); }
          const whole = Object.assign({}, process.env, { GIT_SHALLOW_FILE: os.devNull });
          sent.filter(c => cut.has(c)).forEach(c => {
            let up = []; try { up = lines(run(['-C', where, 'rev-parse', c + '^@'], whole)); } catch (e) { throw said('the parents that shallow clone was cut at could not be read'); }
            n += up.filter(q => H.has(q)).length;
          });
        }
        return n;
      },
    },
  };
}

/* every reason a command line's pushes are refused: { kind: 'main' | 'history', why } */
function reasons(cmd, branchOf, headsOf, reach) {
  const out = [];
  pushes(cmd, { alias: reach && reach.alias }).forEach(p => {
    const m = mainVerdict(p, branchOf, headsOf);
    if (m) out.push({ kind: 'main', why: m });
    const h = p.unread || (m && p.unknown) ? null : historyVerdict(p, reach);   /* one push its words cannot place is refused once */
    if (h) out.push({ kind: 'history', why: h });
  });
  return out;
}
const judge = (cmd, branchOf, headsOf, reach) => reasons(cmd, branchOf, headsOf, reach).map(r => r.why);

function selftest() {
  let total = 0; const bad = [];
  const mark = (ok, what, why) => { total++; console.log((ok ? '  ok   ' : '  FAIL ') + what + (ok ? '' : '  (' + why + ')')); if (!ok) bad.push(what); };
  const on = b => () => b;
  /* the cases from before 2026-10-18 ask about main alone: every destination there is this checkout's own */
  const OWN = { alias: () => null, defaultRemote: () => 'origin', dest: () => ({ own: true, shown: 'origin' }), carries: () => { throw new Error('a push to its own repository is never counted'); } };
  const J = (cmd, b, h, r) => judge(cmd, b, h, r === undefined ? OWN : r);
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
    /* 2026-10-16, the shared reader: each of these was allowed before */
    ['/usr/bin/git push origin main', 'claude/x', true],
    ['"git" push origin main', 'claude/x', true],
    ['git --git-dir /repo/.git push origin main', 'claude/x', true],
    /* the branch's review (2026-10-16): a command substitution in a push; each of these was allowed before */
    ['git -C $(echo /repo) push origin main', 'claude/x', true],
    ['git -C `echo /repo` push origin main', 'claude/x', true],
    ['$(echo git) push origin main', 'claude/x', true],
    ['git push origin $(echo main)', 'claude/x', true],
    ['git push `echo origin main`', 'claude/x', true],
    ['git push -u origin claude/x && echo $(date)', 'claude/x', false],
    /* the branch's second review (2026-10-16): HEAD, or @, names the branch checked out, and with no :<dst> the push
       updates the remote branch of that same name. Standing on main, each of these was allowed before */
    ['git push origin HEAD', 'main', true],
    ['git push origin @', 'main', true],
    ['git push origin +HEAD', 'main', true],
    ['git push -u origin HEAD', 'main', true],
    ['git push --force origin @', 'main', true],
    ['git push origin HEAD', 'claude/x', false],
    ['git push -u origin @', 'claude/x', false],
    ['git push origin HEAD:claude/x', 'main', false],
    /* the branch's third review (2026-10-16): `heads/main` is git's own shorthand for refs/heads/main (a
       dry run prints refs/heads/main for each), so each of these lands on main. From claude/x they were allowed */
    ['git push origin heads/main', 'claude/x', true],
    ['git push origin HEAD:heads/main', 'claude/x', true],
    ['git push origin +heads/main', 'claude/x', true],
  ];
  cases.forEach(([cmd, branch, want]) => {
    const got = J(cmd, on(branch)).length > 0;
    mark(got === want, (want ? 'refused: ' : 'allowed: ') + cmd + (/(?:push|origin|HEAD|@)$/.test(cmd) ? ' (standing on ' + branch + ')' : ''), 'got ' + (got ? 'refused' : 'allowed'));
  });
  mark(J('git push origin HEAD', () => { throw new Error('no repository'); }).length === 1, 'a push of HEAD from a checkout whose branch cannot be read is refused, not waved through', 'got allowed');
  mark(J('cd $SOMEWHERE && git push origin HEAD', on('claude/x')).length === 1, 'refused: a push of HEAD from a directory the words do not tell', 'got allowed');
  mark(J('cd /on-main && git push origin HEAD', d => d === '/on-main' ? 'main' : 'claude/x').length === 1, 'refused: cd /on-main && git push origin HEAD (HEAD is read where the push runs)', 'got allowed');
  const unknown = J('git push', () => { throw new Error('no repository'); });
  mark(unknown.length === 1, 'a bare push whose branch cannot be read is refused, not waved through', JSON.stringify(unknown));
  /* the branch is read where the push runs: after a cd, not in the hook's cwd (allowed before) */
  const onMain = d => d === '/on-main' ? 'main' : 'claude/x';
  mark(J('cd /on-main && git push', onMain).length === 1, 'refused: cd /on-main && git push (main checked out there, not here)', 'got allowed');
  mark(J('cd $SOMEWHERE && git push', on('claude/x')).length === 1, 'refused: a bare push from a directory the words do not tell', 'got allowed');
  mark(J('git -C $(echo /on-main) push', onMain).length === 1, 'refused: git -C $(echo /on-main) push (a directory a substitution builds is not known)', 'got allowed');
  mark(J('git -C `echo /on-main` push', onMain).length === 1, 'refused: git -C `echo /on-main` push (the backtick form)', 'got allowed');
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
  ex.forEach(([cmd, h, want, what]) => { const got = J(cmd, on('claude/x'), h).length > 0; mark(got === want, what, 'got ' + (got ? 'refused' : 'allowed')); });
  [['git push -u origin HEAD', heads([]), false, 'creating main by HEAD, standing on main, in an empty repository is allowed'],
    ['git push origin HEAD', heads(['abc\trefs/heads/main']), true, 'HEAD standing on main, to a repository that has main, is refused']]
    .forEach(([cmd, h, want, what]) => { const got = J(cmd, on('main'), h).length > 0; mark(got === want, what, 'got ' + (got ? 'refused' : 'allowed')); });

  /* 2026-10-18: ANOTHER REPOSITORY. A stub says which repository each word is (`origin` is own unless a -c moves its
     pushurl; any other word, `simmer` or a URL, is not) and how many of this repository's commits the sources carry */
  const asked = [];
  const away = (carried, more) => Object.assign({
    alias: () => null,
    defaultRemote: () => 'origin',
    dest: (dir, repo, cfg) => { asked.push({ repo, cfg }); return { own: repo === 'origin' && !cfg.some(c => /^remote\.origin\.pushurl=/i.test(c)), shown: repo }; },
    carries: (dir, srcs) => { asked.push({ srcs }); return typeof carried === 'function' ? carried(srcs) : carried; },
  }, more || {});
  const thrown = () => { throw new Error('unreadable'); };
  const far = [
    ['git push simmer claude/x', away(5), true, 'a branch to another repository, carrying this one\'s history, is refused'],
    ['git push simmer claude/x', away(0), false, 'a fresh history to another repository (what a clean copy starts) passes'],
    ['git push -u simmer HEAD', away(5), true, 'HEAD to another repository, carrying the history, is refused'],
    ['git push https://example.com/someone/simmer.git claude/x', away(5), true, 'a URL typed into the push is another repository'],
    ['git push --repo=simmer', away(5), true, 'a bare push with --repo=simmer goes to simmer'],
    ['git push', away(5, { defaultRemote: () => 'simmer' }), true, 'a bare push whose remote git picks is another repository is read there'],
    ['git push', away(5, { defaultRemote: thrown }), true, 'a bare push whose remote cannot be read is refused'],
    ['git push -o ci.skip simmer claude/x', away(5), true, 'an option that takes the next word (-o) does not hide the repository'],
    ['git push simmer --delete claude/x', away(5), false, 'a push that only deletes there sends no commit and passes'],
    ['git push simmer :claude/x', away(5), false, 'a :<dst> refspec only deletes there and passes'],
    ['git push simmer claude/x', away(thrown), true, 'what a push holds, unreadable, is refused, not waved through'],
    ['git push simmer claude/x', away(NaN), true, 'a count that is not a number is refused, not waved through'],
    ['git push simmer claude/x', away(5, { dest: thrown }), true, 'a destination that cannot be read is refused'],
    ['git push origin claude/x', away(5), false, 'a branch to this checkout\'s own repository passes, as before'],
    ['git -c remote.origin.pushurl=/elsewhere push origin claude/x', away(5), true, 'a -c that moves origin\'s pushurl is handed to git, and the push read where it goes'],
    ['HOME=/elsewhere git push origin claude/x', away(0), true, 'settings given another way (HOME= before git) are refused, not guessed'],
    ['env -i git push origin claude/x', away(0), true, 'env -i before git is settings this cannot read'],
    ['git -c include.path=/elsewhere/settings push origin claude/x', away(0), true, 'a -c include of another settings file is refused'],
    ['git --config-env=remote.origin.pushurl=X push origin claude/x', away(0), true, '--config-env is refused'],
    ['cd $SOMEWHERE && git push origin claude/x', away(0), true, 'a push from a directory the words do not tell is refused'],
    ['git push --repo=$R', away(0), true, 'a repository only the run knows (--repo=$R) is refused'],
    ['git push simmer HEAD:main', away(5), true, 'creating main in an empty repository does not carry this repository\'s history there', heads([])],
    ['git push simmer HEAD:main', away(0), false, 'creating main in an empty repository with a fresh history still passes (the clean route)', heads([])],
    ['git ship claude/x', away(5, { alias: ({ name }) => name === 'ship' ? 'push simmer' : null }), true, 'a git alias for push simmer is read as that push, and refused'],
    ['git ship claude/x', away(5, { alias: ({ name }) => name === 'ship' ? '!git push simmer' : null }), true, 'a shell alias that pushes to simmer is read, and refused'],
    ['git ship claude/x', away(5, { alias: ({ name }) => name === 'ship' ? '-c remote.origin.pushurl=/elsewhere push origin' : null }), true, 'an alias carrying its own -c is read with it'],
    ['git ship claude/x', away(5, { alias: ({ name }) => name === 'ship' ? 'push origin' : null }), false, 'an alias for a push to this checkout\'s own repository passes'],
    ['git ship claude/x', away(0, { alias: () => false }), true, 'an alias this cannot read is a push it cannot read, and refused'],
    ['git loop x', away(0, { alias: ({ name }) => name === 'loop' ? 'loop' : null }), true, 'an alias that never ends is refused, not followed for ever'],
    ['git lg', away(5, { alias: () => null }), false, 'a git command that is no alias and no push is not a push'],
  ];
  far.forEach(([cmd, reach, want, what, h]) => { const got = judge(cmd, on('claude/x'), h, reach).length > 0; mark(got === want, what, 'got ' + (got ? 'refused' : 'allowed') + ': ' + cmd); });
  mark(judge('git push simmer claude/x', on('claude/x'), undefined, null).length === 1, 'a check given nothing to read the destination with refuses, it does not pass', 'got allowed');
  /* what each push is read as sending */
  const sent = cmd => { asked.length = 0; judge(cmd, on('claude/x'), undefined, away(1)); const a = asked.find(x => 'srcs' in x); return a ? JSON.stringify(a.srcs) : 'not asked'; };
  [['git push simmer +claude/x:main other ^refs/heads/z', '["claude/x","other"]'], ['git push simmer HEAD', '["HEAD"]'],
    ['git push simmer', 'null'], ['git push simmer --tags claude/x', 'null'], ['git push --all simmer', 'null'],
    ['git push simmer "refs/heads/*:refs/heads/*"', 'null'], ['git push simmer :', 'null'], ['git push simmer ^refs/heads/z', 'null'],
    ['git push simmer -- claude/x', '["claude/x"]'], ['git push -fd simmer claude/x', 'not asked']]
    .forEach(([cmd, want]) => { const got = sent(cmd); mark(got === want, 'read as sending ' + want + ': ' + cmd, 'got ' + got); });
  const repoOf = cmd => { asked.length = 0; judge(cmd, on('claude/x'), undefined, away(1)); const a = asked.find(x => 'repo' in x); return a ? a.repo : 'not asked'; };
  [['git push -o ci.skip simmer x', 'simmer'], ['git push --push-option ci.skip simmer x', 'simmer'], ['git push -fo ci.skip simmer x', 'simmer'],
    ['git push --repo simmer', 'simmer'], ['git push --recurse-submodules=check simmer x', 'simmer']]
    .forEach(([cmd, want]) => { const got = repoOf(cmd); mark(got === want, 'read as going to ' + want + ': ' + cmd, 'got ' + got); });
  /* the shared reader, as the address hook reads a git alias (test/authors.js hands it the same liveAlias) */
  const { pushDirs } = require('./authors.js');
  const ship = { alias: ({ name, unknown }) => name !== 'ship' ? null : unknown ? false : 'push' };
  const d1 = pushDirs('git -C /a ship origin x', '/proj', ship), d2 = pushDirs('cd $X && git ship origin x', '/proj', ship), d3 = pushDirs('git -C /a ship origin x', '/proj');
  mark(d1.pushes === 1 && JSON.stringify(d1.dirs) === '["/a"]' && !d1.unknown, 'the address hook reads git ship (alias.ship = push) as a push from /a', JSON.stringify(d1));
  mark(d2.unknown && d2.alias, 'an alias from a directory the words do not tell is a push the address hook refuses', JSON.stringify(d2));
  mark(d3.pushes === 0, 'without the alias reader the same words are no push (so a hook must hand it in)', JSON.stringify(d3));

  /* THE SAME, ON REAL REPOSITORIES (2026-10-18): a made-up project with its own origin, an empty second repository,
     a clean copy, an unrelated repository, a full clone and a shallow clone, in the system's temporary folder, with
     git's own answers. Nothing is pushed; settings outside them are shut out */
  const T = fs.mkdtempSync(path.join(os.tmpdir(), 'pushguard-'));
  const saved = {}, ENV = { GIT_CONFIG_GLOBAL: path.join(T, 'no-settings'), GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'Someone', GIT_AUTHOR_EMAIL: 'someone@example.com',
    GIT_COMMITTER_NAME: 'Someone', GIT_COMMITTER_EMAIL: 'someone@example.com', GIT_TERMINAL_PROMPT: '0' };
  Object.keys(ENV).forEach(k => { saved[k] = process.env[k]; process.env[k] = ENV[k]; });
  try {
    fs.writeFileSync(ENV.GIT_CONFIG_GLOBAL, '');
    const P = n => path.join(T, n), g = (dir, args) => execFileSync('git', ['-C', dir].concat(args), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    const commit = (dir, file, text) => { fs.writeFileSync(path.join(dir, file), text); g(dir, ['add', file]); g(dir, ['commit', '-q', '-m', 'made up: ' + file]); };
    const init = dir => { fs.mkdirSync(dir, { recursive: true }); g(dir, ['init', '-q']); g(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']); };
    init(P('proj')); commit(P('proj'), 'notes.md', 'made-up notes\n'); commit(P('proj'), 'town.md', 'a made-up town\n'); commit(P('proj'), 'game.js', 'a game\n');
    execFileSync('git', ['clone', '-q', '--bare', P('proj'), P('own.git')]);
    g(P('proj'), ['remote', 'add', 'origin', P('own.git')]); g(P('proj'), ['fetch', '-q', 'origin']);
    g(P('proj'), ['checkout', '-q', '-b', 'claude/x']); commit(P('proj'), 'more.md', 'a session note\n');
    execFileSync('git', ['init', '-q', '--bare', P('empty.git')]); execFileSync('git', ['init', '-q', '--bare', P('copy.git')]);
    g(P('proj'), ['remote', 'add', 'simmer', P('empty.git')]);
    g(P('proj'), ['remote', 'add', 'both', P('own.git')]); g(P('proj'), ['config', '--add', 'remote.both.pushurl', P('own.git')]); g(P('proj'), ['config', '--add', 'remote.both.pushurl', P('empty.git')]);
    init(P('copy')); commit(P('copy'), 'game.js', 'a game\n'); g(P('copy'), ['remote', 'add', 'origin', P('copy.git')]);
    init(P('pub')); commit(P('pub'), 'a.md', 'public\n'); execFileSync('git', ['clone', '-q', '--bare', P('pub'), P('pub.git')]);
    g(P('pub'), ['remote', 'add', 'origin', P('pub.git')]); g(P('pub'), ['fetch', '-q', 'origin']); g(P('pub'), ['checkout', '-q', '-b', 'claude/y']); commit(P('pub'), 'b.md', 'more\n');
    /* this checkout's origin also keeps a parked copy of the unrelated repository's history, as the private one keeps
       branches parked from the public game: that is not this repository's own history */
    g(P('proj'), ['fetch', '-q', P('pub'), 'main:refs/remotes/origin/park/public-shape']);
    /* and the clean copy holds this repository's main under a tag, as a copy made by fetching would */
    g(P('copy'), ['fetch', '-q', P('proj'), 'refs/remotes/origin/main:refs/tags/old']);
    execFileSync('git', ['clone', '-q', '--no-local', P('proj'), P('clone')]);
    execFileSync('git', ['clone', '-q', '--depth', '1', 'file://' + P('own.git'), P('shallow')]); g(P('shallow'), ['remote', 'add', 'simmer', P('empty.git')]);
    execFileSync('git', ['clone', '-q', '--depth', '1', '--branch', 'claude/x', 'file://' + P('proj'), P('shallow2')]); g(P('shallow2'), ['remote', 'add', 'simmer', P('empty.git')]);
    /* nothing to measure is not a pass: the setup is checked before anything is asked of it */
    const pre = [g(P('proj'), ['rev-list', '--count', 'origin/main']) === '3', g(P('proj'), ['ls-remote', '--heads', 'simmer']) === '', g(P('copy'), ['rev-list', '--count', 'HEAD']) === '1',
      g(P('shallow'), ['rev-parse', '--is-shallow-repository']) === 'true', g(P('proj'), ['rev-parse', '--abbrev-ref', 'HEAD']) === 'claude/x',
      g(P('shallow2'), ['rev-list', '--count', 'HEAD']) === '1' && g(P('shallow2'), ['rev-parse', 'HEAD']) !== g(P('proj'), ['rev-parse', 'origin/main'])];
    mark(pre.every(Boolean), 'the throwaway repositories are what the cases below say (3 commits on main, an empty second repository, a one-commit copy, two shallow clones, one of a commit main does not hold)', JSON.stringify(pre));
    const L = live(P('proj'), P('proj')), J2 = (cmd, cwd) => { const l = cwd ? live(cwd, P('proj')) : L; return reasons(cmd, l.branchOf, l.headsOf, l.reach); };
    const cfgd = (pairs, f) => { pairs.forEach(([k, v]) => g(P('proj'), ['config', k, v])); try { return f(); } finally { pairs.forEach(([k]) => g(P('proj'), ['config', '--unset-all', k])); } };
    const C = 'git -C ' + P('proj') + ' ';
    const real = [
      [C + 'push simmer HEAD:main', 'history', 'creating main in an empty second repository from this checkout is refused'],
      [C + 'push simmer claude/x', 'history', 'a branch pushed to an empty second repository is refused'],
      ['cd ' + P('proj') + ' && git push -u simmer HEAD', 'history', 'HEAD pushed there with -u is refused'],
      [C + 'push file://' + P('empty.git') + ' claude/x', 'history', 'a file:// URL typed into the push is refused'],
      [C + 'push ' + P('empty.git') + ' claude/x:main', 'history', 'a path typed into the push, creating main there, is refused'],
      [C + 'push https://example.com/someone/simmer.git claude/x', 'history', 'an https URL typed into the push is refused, without asking it anything'],
      [C + 'push origin claude/x', 'history', 'origin with a pushurl to the empty repository is read where it goes, and refused', [['remote.origin.pushurl', P('empty.git')]]],
      [C + 'push origin claude/x', 'history', 'a pushInsteadOf that rewrites origin to the empty repository is read, and refused', [['url.' + P('empty.git') + '.pushInsteadOf', P('own.git')]]],
      [C + 'ship claude/x', 'history', 'a git alias (ship = push simmer) is read, and refused', [['alias.ship', 'push simmer']]],
      [C + 'shout claude/x', 'history', 'a shell alias (shout = !git push simmer) is read, and refused', [['alias.shout', '!git push simmer']]],
      [C + '-c alias.ship="push simmer" ship claude/x', 'history', 'an alias given by -c on the command line is read, and refused'],
      [C + '-c remote.origin.pushurl=' + P('empty.git') + ' push origin claude/x', 'history', 'a -c that moves origin\'s pushurl is read, and refused'],
      [C + 'push', 'history', 'a bare push whose branch pushes to simmer (branch.<b>.pushRemote) is refused', [['branch.claude/x.pushRemote', 'simmer']]],
      [C + 'push', 'history', 'a bare push under remote.pushDefault = simmer is refused', [['remote.pushDefault', 'simmer']]],
      ['git -C ' + P('clone') + ' push ' + P('empty.git') + ' claude/x', 'history', 'a full clone of this repository, elsewhere, pushing it to a new repository is refused'],
      ['git -C ' + P('clone') + ' push origin claude/x', 'history', 'that clone pushing back into this checkout is another repository too, and refused'],
      ['git -C ' + P('shallow') + ' push simmer main', 'history', 'a shallow clone (one commit deep) pushing its tip to a new repository is refused'],
      ['git -C ' + P('shallow2') + ' push simmer claude/x', 'history', 'a shallow clone whose one commit is new, cut at a commit of main, is refused (the parent it was cut at counts)'],
      [C + 'push both claude/x', 'history', 'a remote with two push URLs, this checkout\'s own and another, is refused'],
      ['git -C ' + P('copy') + ' push origin --tags', 'history', 'a copy pushing its tags, one of them this repository\'s main, is refused'],
      ['git -C ' + P('copy') + ' push origin', 'history', 'a bare push from that copy is read as every branch and tag there, and refused'],
      ['cd ' + P('copy') + ' && git push -u origin main', null, 'the clean route: a fresh copy creates main in its own new repository, and passes'],
      ['git -C ' + P('copy') + ' push ' + P('copy.git') + ' main', null, 'the clean route by path passes'],
      [C + 'push -u origin claude/x', null, 'a branch to this checkout\'s own origin passes, as before'],
      [C + 'push origin HEAD:main', 'main', 'main on this checkout\'s own origin is refused, as before (the main rule, not this one)'],
      ['git -C ' + P('pub') + ' push origin claude/y', null, 'an unrelated repository pushing to its own origin passes (the public game\'s shape)'],
      [C + 'lg', null, 'a git alias that is no push is not a push', [['alias.lg', 'log --oneline']]],
    ];
    real.forEach(([cmd, want, what, pairs]) => {
      let R; try { R = pairs ? cfgd(pairs, () => J2(cmd)) : J2(cmd); } catch (e) { R = [{ kind: 'error', why: String(e.message).split('\n')[0] }]; }
      const kinds = [...new Set(R.map(r => r.kind))].join(',') || null;
      const ok = want === null ? !R.length : R.some(r => r.kind === want);
      mark(ok, what, 'got ' + (R.length ? R.map(r => r.kind + ': ' + r.why.split(T).join('<tmp>')).join(' | ') : 'allowed') + (kinds === want ? '' : ''));
    });
    /* the sentence a person reads: where it goes and how much of this history it carries, never a token in a URL */
    const said = J2(C + 'push https://someone:t0ken-made-up@example.com/someone/simmer.git claude/x');
    mark(said.length === 1 && /to https:\/\/example\.com\/someone\/simmer\.git, which is not this checkout's own repository, and that carries 3 commits of this repository's own history$/.test(said[0].why) && said[0].why.indexOf('t0ken') < 0,
      'the refusal names where the push goes and counts what it carries (the 3 commits of main), without the token in the URL', JSON.stringify(said.map(r => r.why.split(T).join('<tmp>'))));
    mark(g(P('proj'), ['status', '--porcelain']) === '' && g(P('empty.git'), ['for-each-ref']) === '', 'nothing was pushed: the empty repository is still empty and the project unchanged', 'something moved');
  } catch (e) {
    mark(false, 'the throwaway repositories could be made and read', String(e.message).split('\n')[0]);
  } finally {
    Object.keys(ENV).forEach(k => { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; });
    fs.rmSync(T, { recursive: true, force: true });
  }
  if (bad.length) { console.log('FAIL: ' + bad.length + ' of ' + total); process.exit(1); }
  console.log('OK: ' + total + ' cases, on stubs and on throwaway repositories in the system\'s temporary folder; nothing pushed, no network.');
  process.exit(0);
}

if (require.main === module) {
  if (process.argv.includes('--selftest')) return void selftest();
  if (process.argv.includes('--hook')) {
    let input = ''; try { input = fs.readFileSync(0, 'utf8'); } catch (e) {}
    let cmd = null, cwd = null;
    try { const j = JSON.parse(input) || {}; cmd = (j.tool_input || {}).command; cwd = j.cwd || null; } catch (e) {}
    /* a relative cd or -C starts at the hook's cwd; this checkout's own repository is the one this file is in */
    const L = live(cwd, ROOT);
    if (typeof cmd !== 'string' || !isPush(cmd, { alias: L.reach.alias })) process.exit(0);
    let why;
    try { why = reasons(cmd, L.branchOf, L.headsOf, L.reach); }
    catch (e) { why = [{ kind: 'main', why: 'the push could not be read, so it is not waved through' }]; }
    if (!why.length) process.exit(0);
    process.stderr.write('PUSH REFUSED by test/pushguard.js: ' + why.map(r => r.why).join('; ') + '.\n' +
      (why.some(r => r.kind === 'main') ?
      '`main` changes only through a pull request the owner merges (AGENTS.md; #260: on the free plan GitHub does not\n' +
      'enforce that for a private repository, so sessions enforce it themselves). Push your own branch and open a pull request.\n' : '') +
      (why.some(r => r.kind === 'history') ?
      'A branch of this checkout goes to this checkout\'s own repository (its origin) and nowhere else: a push carries every\n' +
      'commit behind what it sends, so anywhere else it would publish this repository\'s whole history, back to its first commit.\n' +
      'To start a new repository, seed it from a clean copy instead: make the copy in a new folder outside this repository\n' +
      '(node scripts/clean-copy.js makes one), start a fresh history there (git init, one commit with a no-reply author), and\n' +
      'push that folder to the new repository. It shares no commit with this one, so this check lets it through.\n' : ''));
    process.exit(2);
  }
  console.log('usage: node test/pushguard.js --hook | --selftest');
}

module.exports = { pushes, verdict, judge, reasons, live, pushArgs, sources };
