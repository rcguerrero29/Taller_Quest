#!/usr/bin/env node
/* NO PERSONAL ADDRESS LEAVES TOWN — not in a commit, not in a file.
   The owner, 2026-09-24: targeted phishing had been forgotten, though the engine was meant to have a
   security expert, and somebody had failed.

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
         node test/authors.js --dir <d> [...]   the same, in the repository that holds <d> (the hook's way)
         node test/authors.js --selftest        fixtures, no git, no network */
const fs = require('fs');
const os = require('os');
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
/* Reading a whole commit object (git cat-file -p, or --batch, or cat-file commit) hands back its author and
   committer lines, the same name and address a format string asks for, so it is the same question asked another
   way. Only the readers named here may ask it, each for the reason beside it; `cat-file -e` and `-t` only ask
   whether an object exists and what it is, and stay green. */
const OBJECTS = /\bcat-file\b(?![^\n]*['"\s]-[et]\b)/;
const OBJECT_READERS = {
  'test/authors.js': 'the one reader of addresses',
  'scripts/private-terms.js': 'reads who made each commit only to look for words of the private list in it, and prints rule numbers, line numbers and hashes, never a name or an address',
};
function judgeScripts(files) {
  const P = [];
  files.filter(({ file }) => /^(?:test|\.github|scripts)\//.test(file) && file !== READER).forEach(({ file, text }) => {
    String(text).split('\n').forEach((line, i) => {
      if (FORMATS.test(line) && IDENTITY.test(line))
        P.push(file + ':' + (i + 1) + ' asks git for a name or an address — whatever it prints lands in a public CI log; ask for the hash and the message, and let test/authors.js be the one reader');
      else if (OBJECTS.test(line) && !OBJECT_READERS[file])
        P.push(file + ':' + (i + 1) + ' reads whole git objects, which hands back who made each commit, name and address — ask for the hash and the message instead, or name this file in OBJECT_READERS with its reason');
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

function readCommits(base, head, root) {
  const out = execFileSync('git', ['log', '--format=%H%x00%ae%x00%ce%x00%B%x1e', base + '..' + head],
    { cwd: root || ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
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
   CI cannot do: by the time CI reads a commit, the push has already made it public.

   WHICH PUSH, FROM WHICH REPOSITORY (2026-10-16). Until then the hook knew `git` only as a bare word and
   always checked this checkout: `/usr/bin/git push`, `"git" push` and `git --git-dir … push` were not read
   as pushes at all, and `git -C <another repository> push`, `cd <it> && git push` or a push from another
   worktree was checked against the wrong repository. Now a command line is split the way a shell splits
   it (quotes, backslashes, `;` `&&` `||` `|` `&`, new lines, `( )`, `$( )`, backticks; redirections
   dropped), and in it:
   - git is found by its name wherever it stands: by full path, quoted, escaped, after `command`, `env`,
     `sudo`, `timeout`, `nohup`, `exec` or an assignment; `git-push` too;
   - the directory is the one test/pushguard.js's hook already read (`-C`, else the hook's own `cwd`), and
     further: `cd` and `pushd` (inside `( )` only until the `)`, and not out of a pipeline), `env -C`,
     several `-C`, `--git-dir` / `--work-tree`, GIT_DIR= / GIT_WORK_TREE=;
   - the script of `sh -c` / `bash -lc` and the words after `eval` are read again as a command line;
   - a directory the words cannot tell (`cd -`, `popd`, a `$VARIABLE`, a command substitution) is
     refused, never guessed.
   - A COMMAND SUBSTITUTION, `$( … )` or backticks, is ONE word whose value only the run knows (found in
     the branch's review, the same day: until then the reader split a word at its `$(`, so `git -C $(echo DIR) push`
     was read as no push at all and `cd $(echo DIR)` as a bare `cd`, home; both hooks then checked the wrong
     directory and let the push through). The command inside an unquoted one is read as a command line of
     its own. And git, or its command, built at run time — `$(which git) push`, `$GIT push`,
     `git $(echo push)` — is a push this reader cannot read, so it is refused.
   One reader, shared: test/pushguard.js asks it the same question.
   - A GIT ALIAS (2026-10-18: `git ship origin x` with `alias.ship = push` was no push to any hook, and neither
     was `alias.x = !git push …`). A hook that hands the reader `liveAlias` gets git's own answer for each git
     command git does not run itself: an alias is read as what it stands for (a shell alias as the command
     line it runs), several deep, and one it cannot read (from a directory the words do not tell, or under
     settings given another way) is a push it cannot read, so it is refused. The `-c` settings before a
     push's command stay with it (`cfg`); settings given in a way this cannot read (`--config-env`,
     `--exec-path`, GIT_CONFIG…=, HOME=, XDG_CONFIG_HOME=, GIT_EXEC_PATH= or GIT_COMMON_DIR= before git, or
     `env -i` / `-u`) mark it `cfgUnread`. test/pushguard.js asks git where the push goes with the same `-c`.
   WHAT STILL PASSES, said plainly: a push
   made by another program — a node or python one-liner, a script file, a `sh -c` script built
   at run time — a push inside a QUOTED command substitution (`"$(git push …)"`: its inside is not read as
   commands, because a commit message written as `-m "$(cat <<EOF … EOF)"` would then be), `git subtree push`,
   and every `gh`
   write (`gh pr merge`, `gh issue comment`, `gh api`). None of those is `git push` in the words; only CI
   reads what they published, after. Still read as before: the range
   is origin/main..HEAD of the repository the push leaves from, so a repository with no origin/main is
   refused (its commits cannot be ranged), and a push of a branch that is not checked out is read by
   HEAD's commits. The connector tools (GitHub's, Drive's) are test/toolguard.js's. */
const PUSH = /(?:^|[\s;&|(])git(?:\s+(?:-C\s+\S+|-c\s+\S+|--[\w-]+(?:=\S+)?))*\s+push\b/;
/* the wide net, on the raw text: the word git (by any path, in any quotes) and, anywhere after it, the
   word push. It over-reads (`git log --grep push` counts); an over-read only runs the check */
const WIDE = /(?:^|[^A-Za-z0-9_.-])git(?:\.exe)?(?![A-Za-z0-9_-])[\s\S]*?(?<![A-Za-z0-9_])push(?![A-Za-z0-9_])|(?:^|[^A-Za-z0-9_.-])git-push(?![A-Za-z0-9_-])/;
const isPush = (cmd, o) => { const s = String(cmd || ''); return PUSH.test(s) || WIDE.test(s) || pushes(s, o).length > 0; };

/* a command substitution that starts at s[i], `$( … )` or a backtick pair: { inner: the command line inside
   it, end: the index just past it }. An unclosed one runs to the end of the line */
function substitution(s, i) {
  if (s[i] === '`') {
    let j = i + 1, inner = '';
    while (j < s.length && s[j] !== '`') {
      if (s[j] === '\\' && j + 1 < s.length) { inner += '$`\\'.includes(s[j + 1]) ? s[j + 1] : s[j] + s[j + 1]; j += 2; continue; }
      inner += s[j++];
    }
    return { inner, end: Math.min(j + 1, s.length) };
  }
  let j = i + 2, depth = 1;
  while (j < s.length) {
    const c = s[j];
    if (c === '\\') { j += 2; continue; }
    if (c === "'") { const k = s.indexOf("'", j + 1); j = k < 0 ? s.length : k + 1; continue; }
    if (c === '"') { j++; while (j < s.length && s[j] !== '"') j += s[j] === '\\' ? 2 : 1; j++; continue; }
    if (c === '(') depth++;
    else if (c === ')' && !--depth) break;
    j++;
  }
  return { inner: s.slice(i + 2, Math.min(j, s.length)), end: Math.min(j + 1, s.length) };
}

/* a command line as a shell splits it: words, with quotes and backslashes removed (`dyn` when a `$` or a
   backtick in it means its value is known only at run time), and operators. A redirection and its target
   are dropped, so `2>&1` is neither an operator nor an argument. A command substitution stays inside its
   word, which is then `dyn`; the command line inside an unquoted one follows as a `sub` token */
function shellTokens(cmd) {
  const s = String(cmd || ''), out = [];
  let i = 0, w = null, dyn = false, skip = false;
  const end = () => { if (w !== null) { if (skip) skip = false; else out.push({ w, dyn }); } w = null; dyn = false; };
  const op = o => { end(); skip = false; out.push({ op: o }); };
  const add = c => { w = (w === null ? '' : w) + c; };
  while (i < s.length) {
    const c = s[i];
    if (c === '\\') { if (s[i + 1] !== '\n') add(s[i + 1] || ''); i += 2; continue; }
    if (c === "'") { const j = s.indexOf("'", i + 1), k = j < 0 ? s.length : j; add(s.slice(i + 1, k)); i = k + 1; continue; }
    if (c === '"') {
      let j = i + 1, buf = '';
      while (j < s.length && s[j] !== '"') {
        if (s[j] === '\\' && j + 1 < s.length && '"\\$`\n'.includes(s[j + 1])) { buf += s[j + 1]; j += 2; continue; }
        if ((s[j] === '$' && s[j + 1] === '(') || s[j] === '`') { const x = substitution(s, j); buf += s.slice(j, x.end); dyn = true; j = x.end; continue; }
        if (s[j] === '$') dyn = true;
        buf += s[j++];
      }
      add(buf); i = j + 1; continue;
    }
    if ((c === '$' && s[i + 1] === '(') || c === '`') { const x = substitution(s, i); add(s.slice(i, x.end)); dyn = true; out.push({ sub: x.inner }); i = x.end; continue; }
    if (c === '$') { dyn = true; add(c); i++; continue; }
    if (c === '>' || c === '<' || (c === '&' && s[i + 1] === '>')) {
      if (w !== null && /^\d+$/.test(w)) { w = null; dyn = false; } else end();
      i++; while (i < s.length && '<>&|'.includes(s[i])) i++;
      skip = true; continue;
    }
    if (c === '&' || c === '|') { const two = s[i + 1] === c; op(two ? c + c : c); i += two ? 2 : 1; continue; }
    if (c === ';' || c === '\n' || c === '(' || c === ')') { op(c); i++; continue; }
    if (/\s/.test(c)) { end(); i++; continue; }
    if (c === '#' && w === null) { const j = s.indexOf('\n', i); i = j < 0 ? s.length : j; continue; }
    if (c === '~' && w === null && (i + 1 >= s.length || /[/\s;&|)]/.test(s[i + 1]))) { add(os.homedir()); i++; continue; }
    add(c); i++;
  }
  end();
  return out;
}

const KEYWORDS = new Set(['if', 'then', 'else', 'elif', 'do', 'while', 'until', '{', '}', '!', 'time']);
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh']);
const ASSIGN = /^[A-Za-z_][A-Za-z0-9_]*=/;
const nameOf = w => String(w).replace(/\/+$/, '').split('/').pop();
const assigned = x => { const i = x.w.indexOf('='); return [x.w.slice(0, i), { w: x.w.slice(i + 1), dyn: x.dyn }]; };
/* one change of directory: an absolute one is known; a relative one is as known as where it starts */
const step = (at, word) => !word || word.dyn ? { dir: at.dir, unknown: true }
  : path.isAbsolute(word.w) ? { dir: path.normalize(word.w), unknown: false }
  : { dir: at.dir == null ? word.w : path.join(at.dir, word.w), unknown: at.unknown };

/* settings that reach git another way than `-c`, so its remotes, its URL rewrites and its aliases may not be what the
   repository's own files and the command's `-c` say: an assignment of one of these before git (2026-10-18) */
const CONFIG_ENV = /^(?:GIT_CONFIG(?:_[A-Za-z0-9_]+)?|HOME|XDG_CONFIG_HOME|GIT_EXEC_PATH|GIT_COMMON_DIR)$/;
const configEnv = e => Object.keys(e).some(n => CONFIG_ENV.test(n));
/* where a git command runs, once --git-dir or --work-tree is read */
const place = (at, gitDir, workTree) => {
  if (workTree) return step(at, workTree);
  if (!gitDir) return at;
  const g = step(at, gitDir);
  return { dir: g.dir != null && nameOf(g.dir) === '.git' ? path.dirname(g.dir) : g.dir, unknown: g.unknown };
};
/* a word handed on to a shell alias: quoted as written, unless only the run knows it (then it stays a word it cannot read) */
const handOn = x => x.dyn ? x.w : "'" + x.w.replace(/'/g, "'\\''") + "'";

/* one simple command: the pushes it runs go to `out`; the state it leaves (cd, an exported GIT_DIR) is returned.
   `o.alias`, when a hook gives it, answers whether a git command is an alias and what for (liveAlias below) */
function readSimple(W, s, out, o) {
  let k = 0;
  while (k < W.length && KEYWORDS.has(W[k].w)) k++;
  const env = {};
  while (k < W.length && ASSIGN.test(W[k].w)) { const [n, v] = assigned(W[k]); env[n] = v; k++; }
  const keep = e => Object.assign({}, s, e.GIT_DIR ? { gitDir: e.GIT_DIR } : {}, e.GIT_WORK_TREE ? { workTree: e.GIT_WORK_TREE } : {}, configEnv(e) ? { cfgEnv: true } : {});
  if (k >= W.length) return keep(env);                       /* assignments alone stay for what follows */
  const head = W[k].w;
  if (head === 'export' || head === 'declare' || head === 'typeset') {
    const e = {}; W.slice(k + 1).filter(x => ASSIGN.test(x.w)).forEach(x => { const [n, v] = assigned(x); e[n] = v; });
    return keep(e);
  }
  if (head === 'cd' || head === 'pushd') {
    const t = W.slice(k + 1).find(x => !/^-[A-Za-z]+$/.test(x.w));
    if (!t) return Object.assign({}, s, { dir: os.homedir(), unknown: false });
    return Object.assign({}, s, t.w === '-' ? { unknown: true } : step(s, t));
  }
  if (head === 'popd') return Object.assign({}, s, { unknown: true });
  for (let i = k; i < W.length; i++) {
    const name = nameOf(W[i].w);
    if (SHELLS.has(name)) {                                   /* sh -c '…': its own shell, so what it changes stays there */
      const c = W.slice(i + 1).findIndex(x => /^-[A-Za-z]*c[A-Za-z]*$/.test(x.w));
      if (c >= 0 && W[i + 2 + c]) readLine(W[i + 2 + c].w, keep(env), out, o);
      return s;
    }
    if (W[i].w === 'eval') { readLine(W.slice(i + 1).map(x => x.w).join(' '), keep(env), out, o); return s; }
    if (name !== 'git' && name !== 'git.exe' && name !== 'git-push') continue;
    let at = { dir: s.dir, unknown: s.unknown }, gitDir = env.GIT_DIR || s.gitDir || null, workTree = env.GIT_WORK_TREE || s.workTree || null;
    const cfg = (s.cfgFrom || []).slice();   /* git hands its -c on to the git commands a shell alias runs */
    let cfgUnread = !!s.cfgEnv || configEnv(env);
    for (let j = k; j < i; j++) {                             /* what stands before git: env GIT_DIR=…, env -C <dir> */
      const x = W[j].w, runner = W.slice(k, j).some(y => nameOf(y.w) === 'env');
      if (/^GIT_DIR=/.test(x)) gitDir = assigned(W[j])[1];
      else if (/^GIT_WORK_TREE=/.test(x)) workTree = assigned(W[j])[1];
      else if (ASSIGN.test(x) && CONFIG_ENV.test(x.slice(0, x.indexOf('=')))) cfgUnread = true;
      else if (x === '--chdir' || (x === '-C' && runner)) { at = step(at, W[j + 1]); j++; }
      else if (x.startsWith('--chdir=')) at = step(at, { w: x.slice(8), dyn: W[j].dyn });
      else if (nameOf(x) === 'sudo' || (runner && /^(?:-[A-Za-z]*[iu][A-Za-z]*|-|--unset(?:=.*)?|--ignore-environment)$/.test(x))) cfgUnread = true;
    }
    let j = i + 1, sub = name === 'git-push' ? 'push' : null, subDyn = false;
    while (!sub && j < W.length) {                            /* git's own options, up to its command */
      const x = W[j].w;
      if (x === '-C') { at = step(at, W[j + 1]); j += 2; }
      else if (x === '--git-dir') { gitDir = W[j + 1] || { w: '', dyn: true }; j += 2; }
      else if (x === '--work-tree') { workTree = W[j + 1] || { w: '', dyn: true }; j += 2; }
      else if (x.startsWith('--git-dir=')) { gitDir = { w: x.slice(10), dyn: W[j].dyn }; j++; }
      else if (x.startsWith('--work-tree=')) { workTree = { w: x.slice(12), dyn: W[j].dyn }; j++; }
      else if (x === '-c') { const v = W[j + 1]; if (!v || v.dyn) cfgUnread = true; else cfg.push(v.w); j += 2; }
      else if (x === '--config-env') { cfgUnread = true; j += 2; }
      else if (x.startsWith('--config-env=') || x.startsWith('--exec-path=')) { cfgUnread = true; j++; }
      else if (x === '--namespace' || x === '--super-prefix') j += 2;
      else if (x.startsWith('-')) j++;
      else { sub = x; subDyn = W[j].dyn; j++; }
    }
    const where = () => place(at, gitDir, workTree);
    const record = (extra) => Object.assign({ args: W.slice(j).map(x => x.w), dyn: W.slice(j).map(x => x.dyn), dir: where().dir, unknown: where().unknown, cfg: cfg.slice(), cfgUnread }, extra || {});
    /* `push` in any case: on a filesystem that ignores case, git may find its own git-push program for `git Push` */
    const isPushWord = sub != null && String(sub).toLowerCase() === 'push';
    if (!isPushWord && subDyn) { out.push(record({ unknown: true, unread: true })); return s; }
    if (!isPushWord) {
      /* a git alias (2026-10-18): what it stands for, read in its place; one this cannot read is a push it cannot read */
      const exp = o && o.alias && sub ? o.alias({ dir: where().dir, unknown: where().unknown, cfg: cfg.slice(), cfgUnread, name: sub }) : null;
      const depth = (o && o.depth) || 0;
      if (exp === false || (typeof exp === 'string' && depth >= 8)) { out.push(record({ unknown: true, unread: true, alias: sub })); return s; }
      if (typeof exp === 'string') {
        const deeper = Object.assign({}, o, { depth: depth + 1 }), e = exp.trim();
        if (e.startsWith('!')) {                              /* a shell alias: git runs it with sh, at the top of the repository, the words after it appended */
          const rest = W.slice(j).map(handOn).join(' ');
          readLine(e.slice(1) + (rest ? ' ' + rest : ''), Object.assign({}, keep(env), { dir: where().dir, unknown: where().unknown, gitDir: null, workTree: null, cfgEnv: cfgUnread, cfgFrom: cfg.slice() }), out, deeper);
          return s;
        }
        const t = shellTokens(e);
        if (!t.length || t.some(x => x.w == null)) { out.push(record({ unknown: true, unread: true, alias: sub })); return s; }
        return readSimple(W.slice(0, j - 1).concat(t, W.slice(j)), s, out, deeper);
      }
      i = j - 1; continue;
    }
    out.push(record());
    return s;
  }
  /* git, or its command, built at run time (`$(which git) push`, `$GIT push`): a word only the run knows,
     before a plain word `push`. A push this reader cannot read */
  const p = W.findIndex((x, n) => n > k && x.w === 'push' && !x.dyn);
  if (p > k && W.slice(k, p).some(x => x.dyn)) out.push({ args: W.slice(p + 1).map(x => x.w), dyn: W.slice(p + 1).map(x => x.dyn), dir: s.dir, unknown: true, unread: true, cfg: [], cfgUnread: true });
  return s;
}

/* a whole command line: `&&` `||` `;` carry a cd forward; `( )` keeps it inside; a pipeline's parts and a
   `&` run in their own shells, so what they change is dropped */
function readLine(cmd, s0, out, o) {
  const stack = [];
  let s = s0, before = s0, piped = false, cur = [];
  const done = op => {
    if (cur.length) s = readSimple(cur, s, out, o);
    cur = [];
    if (op === '|' || op === '&' || piped) s = before;
    piped = op === '|';
    if (op === '(') stack.push(s);
    else if (op === ')' && stack.length) s = stack.pop();
    if (!piped) before = s;
  };
  /* the command inside an unquoted substitution runs in a shell of its own, from where this one stands */
  shellTokens(cmd).forEach(t => { if (t.op) done(t.op); else if (t.sub != null) readLine(t.sub, s, out, o); else cur.push(t); });
  done(null);
  return out;
}

/* every `git push` in a command line: { args: the words after push, dyn: which of them only the run knows,
   dir: where it runs (null: the hook's cwd; relative: from there), unknown: true when the words cannot tell
   the directory, unread: true when they cannot tell git or its command either, cfg: the `-c` settings before
   its command, cfgUnread: true when settings reach it another way this cannot read, alias: the alias it came
   from, when it is one this cannot read }. `o.alias` (optional): see readSimple */
const pushes = (cmd, o) => readLine(cmd, { dir: null, unknown: false, gitDir: null, workTree: null }, [], o);

/* the repositories a command line's pushes leave from, absolute against the hook's cwd. No push found
   (an over-read of the wide net): the cwd itself, so the over-read still runs the check */
function pushDirs(cmd, cwd, o) {
  const P = pushes(cmd, o), at = d => path.resolve(cwd, d == null ? '.' : d);
  return { pushes: P.length, unknown: P.some(p => p.unknown), unread: P.some(p => p.unread), alias: P.some(p => p.alias), dirs: [...new Set((P.length ? P.map(p => p.dir) : [null]).map(at))] };
}

/* git's own answer to "is <name> an alias, and for what", for a hook whose cwd is `cwd` (2026-10-18). As in git, a
   name git runs itself (a builtin, or a git-<name> program it finds) is never an alias, and `-c alias.<name>=…` on the
   command line comes before the repository's settings. Returns the alias's text, null when <name> is not one, or false
   when this cannot tell (a directory the words do not tell, settings given another way, git not answering) */
function liveAlias(cwd) {
  let own;
  return ({ dir, unknown, cfg, cfgUnread, name }) => {
    if (own === undefined) {
      try { own = new Set(execFileSync('git', ['--list-cmds=builtins,main,others'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10000 }).split('\n').filter(Boolean)); }
      catch (e) { own = null; }
    }
    if (own && own.has(name)) return null;
    if (unknown || cfgUnread) return false;
    const key = 'alias.' + String(name).toLowerCase();
    const given = (cfg || []).filter(c => (c.includes('=') ? c.slice(0, c.indexOf('=')) : c).toLowerCase() === key).pop();
    if (given !== undefined) return given.includes('=') ? given.slice(given.indexOf('=') + 1) : false;
    try { return execFileSync('git', ['-C', path.resolve(cwd || process.cwd(), dir == null ? '.' : dir), 'config', '--get', key], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10000 }).replace(/\n$/, ''); }
    catch (e) { return e.status === 1 ? null : false; }
  };
}

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
    ['another script reading a commit object whole is red', [{ file: 'test/x.js', text: "git(['cat-file', '-p', sha])" }], 1],
    ['a batch read of objects in a workflow is red', [{ file: '.github/workflows/x.yml', text: 'run: git cat-file --batch < ids' }], 1],
    ['asking only whether an object exists is green', [{ file: 'test/prims.js', text: "git(['cat-file', '-e', sha + '^{commit}'])" }], 0],
    ['asking only an object\'s type is green', [{ file: 'scripts/x.sh', text: 'git cat-file -t "$sha"' }], 0],
    ['the private-word check is a named reader of objects', [{ file: 'scripts/private-terms.js', text: "git(root, ['cat-file', '--batch'], ids)" }], 0],
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
    // 2026-10-16: git by full path, quoted, escaped, or with its repository named by an option; each of
    // the first six was read as no push at all before
    ['/usr/bin/git push origin claude/x', true], ['"git" push', true], ["'/usr/bin/git' -C /repo push", true],
    ['\\git push', true], ['git --git-dir /repo/.git push', true], ['git -C "/a b" push', true],
    ['command git push', true], ['env GIT_TRACE=1 git push', true], ['git status | grep pushed', false],
  ];
  pushCases.forEach(([cmd, want]) => mark(isPush(cmd) === want, 'the hook reads "' + cmd + '" as ' + (want ? 'a push' : 'not a push'), 'got ' + isPush(cmd)));
  /* the repository a push leaves from: the hook checks that one, not this checkout (2026-10-16) */
  const P0 = '/proj';
  const dirCases = [
    ['a push from another worktree (the hook\'s own cwd)', 'git push', '/home/x/wt/a', ['/home/x/wt/a']],
    ['git -C <another repository> push', 'git -C /other push', P0, ['/other']],
    ['cd <dir> && git push', 'cd /other && git push origin x', P0, ['/other']],
    ['cd, then a relative -C', 'cd sub && git -C ../x push', P0, ['/proj/x']],
    ['a cd inside ( ) ends at the )', '(cd /a && make); git push', P0, ['/proj']],
    ['a cd in a pipeline stays there', 'cd /a | true; git push', P0, ['/proj']],
    ['/usr/bin/git -C <another repository> push', '/usr/bin/git -C /other push', P0, ['/other']],
    ['--git-dir names the repository', 'git --git-dir=/other/.git push', P0, ['/other']],
    ['GIT_DIR= names the repository', 'GIT_DIR=/other/.git git push', P0, ['/other']],
    ['an exported GIT_DIR names it for what follows', 'export GIT_DIR=/other/.git; git push', P0, ['/other']],
    ['env -C names the directory', 'env -C /other git push', P0, ['/other']],
    ['the script of bash -c is read too', 'bash -c "cd /a && git push origin x"', P0, ['/a']],
    ['two pushes, two repositories', 'git -C /a push && git -C /b push', P0, ['/a', '/b']],
    ['~ is the home folder', 'cd ~/r && git push', P0, [path.join(os.homedir(), 'r')]],
    ['an over-read with no push in it checks the cwd', 'git commit -m "about git push"', P0, ['/proj']],
    /* the branch's review (2026-10-16): a command substitution is one word whose value is known only at run
       time, and the command inside an unquoted one is read as a command line of its own */
    ['a push inside an unquoted command substitution', 'echo $(git -C /a push)', P0, ['/a']],
    ['a push inside backticks', 'echo `git -C /a push`', P0, ['/a']],
    ['a push whose branch is a substitution: its directory is still known', 'git -C /a push origin $(git branch --show-current)', P0, ['/a']],
  ];
  dirCases.forEach(([what, cmd, cwd, want]) => { const r = pushDirs(cmd, cwd); mark(!r.unknown && JSON.stringify(r.dirs) === JSON.stringify(want), 'the hook checks the repository of ' + what, JSON.stringify(r)); });
  const unknownCases = ['cd $REPO && git push', 'cd - && git push', 'git -C "$(pwd)/x" push', 'popd; git push',
    /* the branch's review: each of these checked the hook's cwd, exit 0, before */
    'git -C $(echo /other) push', 'git -C `echo /other` push', 'git -C /a$(echo /b) push', 'cd $(echo /other) && git push',
    '$(echo git) push origin x', '`which git` push origin x', '"$(which git)" push origin x', 'git $(echo push) origin x'];
  unknownCases.forEach(cmd => { const r = pushDirs(cmd, P0); mark(r.unknown, 'a directory the words cannot tell is refused, not guessed: ' + cmd, JSON.stringify(r)); });
  /* what test/pushguard.js reads as the push's arguments: a redirection is not a refspec */
  const args = pushes('git push origin claude/x 2>&1 | tail -2');
  mark(args.length === 1 && JSON.stringify(args[0].args) === '["origin","claude/x"]', 'a redirection is not an argument of the push', JSON.stringify(args));
  const total = cases.length + fileCases.length + 2 + pushCases.length + scriptCases.length + dirCases.length + unknownCases.length + 1;
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
    let cmd = null, cwd = null;
    try { const j = JSON.parse(input) || {}; cmd = (j.tool_input || {}).command; if (typeof j.cwd === 'string' && j.cwd) cwd = j.cwd; } catch (e) {}
    /* a git alias is read as what it stands for (2026-10-18): `git ship` with alias.ship = push is a push */
    const live = { alias: liveAlias(cwd || ROOT) };
    if (typeof cmd === 'string' && !isPush(cmd, live)) process.exit(0);
    /* the repository the push leaves from, not this checkout (2026-10-16): -C, cd, a worktree, the hook's cwd */
    const from = pushDirs(typeof cmd === 'string' ? cmd : '', cwd || ROOT, live);
    if (from.unknown) {
      process.stderr.write('PUSH REFUSED by test/authors.js — ' + (from.alias
        ? 'this command runs a git alias this check cannot read (from a directory its words do not tell, or with git settings given another way), so it cannot say whether it pushes, nor which repository it would publish.\n'
        : from.unread
        ? 'this command builds git, or its command, at run time (a $VARIABLE or a command substitution), so this check cannot read the push, nor which repository it would publish.\n'
        : 'this command pushes from a directory its words do not tell (`cd -`, `popd`, a $VARIABLE or a command substitution), so this check cannot say which repository it would publish.\n') +
        'Write it out: `git -C <directory> push …`.\n');
      process.exit(2);
    }
    /* A check that never finishes refuses; it does not wave a push through (#279). The check below
       takes 0.2 s here (measured 2026-09-30). 45 s is far above that and under the 60 s that
       .claude/settings.json gives this whole hook, so the refusal is this file's own, in its own words.
       Several repositories share the 45 s (2026-10-16). */
    const LIMIT_S = 45, t0 = Date.now();
    const { spawnSync } = require('child_process');
    const red = [];
    for (const dir of from.dirs) {
      const left = Math.max(1, LIMIT_S * 1000 - (Date.now() - t0));
      const r = spawnSync(process.execPath, [__filename, '--dir', dir], { cwd: ROOT, encoding: 'utf8', timeout: left, killSignal: 'SIGKILL' });
      if (r.error && r.error.code === 'ETIMEDOUT') {
        process.stderr.write('PUSH REFUSED by test/authors.js — the address check (node test/authors.js) was still running after ' +
          Math.round((Date.now() - t0) / 1000) + ' s, where it normally takes under a second, so it was stopped and cannot say what this push would publish.\n' +
          'Run `node test/authors.js` by hand to see where it sticks.\n');
        process.exit(2);
      }
      if (r.status !== 0) red.push('from ' + dir + ':\n' + (r.stdout || '') + (r.stderr || ''));
    }
    if (!red.length) process.exit(0);
    process.stderr.write('PUSH REFUSED by test/authors.js — this push would publish an address that is not a no-reply one.\n' + red.join('') +
      'If the commit it names is already on main, run `git fetch origin main` and try again.\n');
    process.exit(2);
  }
  /* --dir <d>: the repository that holds <d>, as the hook asks; without it, this checkout */
  const argv = process.argv.slice(2), di = argv.indexOf('--dir');
  const pos = di < 0 ? argv : argv.slice(0, di).concat(argv.slice(di + 2));
  let root = ROOT;
  if (di >= 0) {
    try { root = execFileSync('git', ['-C', argv[di + 1] || '', 'rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
    catch (e) { console.log('FAIL\n- ' + (argv[di + 1] || 'no directory') + ' is not inside a git working tree, so this check cannot say what a push from there would publish — that is a red, not a pass'); process.exit(1); }
  }
  const base = pos[0] || 'origin/main', head = pos[1] || 'HEAD';
  let commits;
  try { commits = readCommits(base, head, root); }
  catch (e) {
    console.log('FAIL\n- could not read the commits in ' + base + '..' + head + ' (' + String(e.message).split('\n')[0] + '), so this check cannot say which addresses are about to be published — that is a red, not a pass');
    process.exit(1);
  }
  let files;
  try { files = readFiles(root); }
  catch (e) { console.log('FAIL\n- could not read the working tree (' + e.message + ') — that is a red, not a pass'); process.exit(1); }
  if (!files.length) { console.log('FAIL\n- found no text files to read at all — that is a red, not a pass'); process.exit(1); }
  const P = judgeCommits(commits).concat(judgeFiles(files), judgeScripts(files));
  if (P.length) {
    console.log('FAIL');
    P.forEach(p => console.log('- ' + p));
    console.log('Fix a commit with `git commit --amend --reset-author` (or a rebase) BEFORE it is pushed, after\n`git config user.email` is set to a no-reply address. Once pushed, it is public: see docs/BOUNDARY.md row 13½.');
    process.exit(1);
  }
  console.log('OK — ' + commits.length + ' commit(s) in ' + base + '..' + head + ' and ' + files.length + ' text files' + (root === ROOT ? '' : ' in ' + root) + ': every address is a no-reply one.');
  process.exit(0);
}

/* EMAIL too, so test/toolguard.js finds an address split between two fields by this file's own pattern, not a copy */
module.exports = { judgeCommits, judgeFiles, judgeScripts, parseLog, allowed, EMAIL, isPush, pushes, pushDirs, shellTokens, liveAlias };
