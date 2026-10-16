#!/usr/bin/env node
/* EVERY CONNECTOR WRITE IS READ BEFORE IT LEAVES — no private term, no personal address, no sharing.
   Found 2026-10-16 by a read-only privacy review, and filed by the owner the same day: the two hooks in
   .claude/settings.json read Bash commands only, and only `git push` in them. A session also holds direct
   connector tools — GitHub's (push files, create or update a file, open, edit and merge a pull request,
   comment, fork, create a repository), Google Drive's (create, copy, update, trash and SHARE a file),
   Docs, Sheets, Slides and more — and not one of them passed through any check. A session could have sent
   the owner's private words to the public repository, or shared a file with anyone, and nothing would
   have stopped it. Nothing is known to have left that way.

   TWO LAYERS, both in .claude/settings.json:
   1. `permissions.deny` refuses outright six GitHub tools no reading can make safe: merge (the owner
      merges), fork and create a repository (a new place to publish), delete a file, and push files or
      create or update a file (a commit straight onto a branch, from no checkout any hook reads).
   2. This file, the PreToolUse hook on every tool whose name starts with mcp__. CLOSED BY DEFAULT:
      - A tool is a READ only if the last part of its name is a read's SHAPE: one read verb (get, list,
        search, read or download), then only words of READ_WORDS below, the things a read reads (file,
        issues, pull requests, commits, me and the rest); or it is one of NAMED_READS below, named with its
        server and its reason. A read passes untouched. Everything else is a WRITE: a connective (and,
        then, or, plus), a second verb, any word READ_WORDS has not met, and a name never seen.
      - Sharing is refused on any server: a name with the word `share` in it (Drive's share_file), and a
        write that changes who can see a thing (collaborators, permissions). It is the owner's to do.
      - A write's EVERY string is read, at any depth, field names too — not a list of named fields, which
        a new tool would walk round. A string that is base64 of text is read decoded as well, and a number
        or a yes/no as its text. The strings are also read JOINED, every two of them each way round and all
        of them in order, with nothing and with a space between them, so a term split between a title and a
        body is found wherever the two sit in the call (it is named `across fields`). A write whose strings
        are too many to join every two inside the hook's time is refused (split it). A write with no
        string at all (numbers, yes/no or nothing) says nothing of what it does, so it is refused.
      - An address that is not a no-reply one, anywhere in a write, refuses it: test/authors.js's rule,
        asked of test/authors.js (judgeFiles, EMAIL, allowed), not typed again. An address split between
        two fields, or three in order, refuses it too.
      - The private-term check reads the owner's list from the file PRIVATE_TERMS_FILE names, else
        ~/.private-terms/map.md, outside every repository (a list inside one is refused), in the shape
        `--map` reads: markdown holding one ```json block. scripts/private-terms.js reads it (rulesFrom) and
        scripts/clean-copy.js applies it (survivors), the two halves of the public repository's own check,
        so this check cannot drift from it. With no list, or one that cannot be read, EVERY write is refused, with how to
        load it.
        · A GitHub write whose every repository field names a repository of this checkout's own owner
          (its `origin`) whose WHOLE name is a term of the list (one `find`, case as its rule reads it) is
          a write to a private repository: the term check is skipped there. A name that only contains
          one (`<name>-public`) is not. The address check is never skipped.
        · Every other write, GitHub or not, is refused if any string hits any rule. A file the write
          names (an object with a `path` and a `content`) is read as that file, scopes and all, exactly
          as the public repository's CI would read it there; every other string — a comment, a title, a
          message — has no path to scope by, so it is read against every rule with its `files` scope
          taken off.
   It never prints the payload, a term, or an address: a refusal names the rule NUMBER and the field
   path (`files[1].content line 2`), and a field name that is not a plain name, or that itself hits,
   prints as `…`.

   FOUND IN THE BRANCH'S REVIEW, the same day: a prefix alone made a read (and query, fetch and export were
   prefixes), so export_repository, fetch_and_overwrite and query_then_post passed as reads; a term split
   between two fields, or a detail in a number field, passed; and the hook had no time limit of its own.
   FOUND IN ITS SECOND REVIEW: a read verb and then a write verb no list of write words held
   (search_and_replace, get_and_publish) passed as a read; a public repository whose name contained the
   private one's skipped the term check; a term split between two fields that were not next to each other
   (a pull request's title and body, with head and base between them) passed; and an address split
   between two fields passed. FOUND MERGING IT WITH THE WORD CHECK'S BRANCH: its check() reads a whole tree,
   so a one-file write outside a docs-only rule's folder was refused, and every refusal lost its field (hitsIn).

   THE TIME LIMIT. Claude Code stops a hook at the `timeout` .claude/settings.json gives it (30 s) and then
   lets the call THROUGH. So the reading runs in a child process (`--decide`) that the hook stops at
   LIMIT_MS (20 s), well under that cap, and a check stopped there refuses, in its own sentence. A read is
   told by its name alone, before any child starts.

   What it does not stop, said plainly: a write that names itself a read, a read verb and then only words
   READ_WORDS holds (a get_release that publishes one); what a read sends out in its own arguments (a
   search query, a fetched address); a term spelled another way, split three ways or more out of order,
   split with more than 512 characters of it on one side, or encoded any way but base64; an address
   glued onto a no-reply one in the next field (`noreply@anthropic.com` then `.evil.test`); a session
   that edits .claude/settings.json, or runs with hooks off; a hook that cannot start at all, or a
   machine so loaded that even the 20 s refusal misses the 30 s cap (Claude Code then lets the call through). Claude Code from 2.1.295 takes `"onFailure": "block"` on a
   hook, which refuses even then; it is the owner's to set, because which version his laptop runs is not
   known here. The switches that hold regardless are the owner's.

   Run:  node test/toolguard.js --hook       (Claude Code's PreToolUse hook: reads the call on stdin)
         node test/toolguard.js --decide     (the hook's child: the call on stdin, its decision on stdout)
         node test/toolguard.js --selftest   (made-up terms and addresses, assembled at run time) */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..');

/* what reads the rules and the addresses: loaded only for a write, so a read costs nothing but the parse */
let PT = null, AU = null, CC = null;
const terms = () => PT || (PT = require(path.join(ROOT, 'scripts', 'private-terms.js')));
const copy = () => CC || (CC = require(path.join(ROOT, 'scripts', 'clean-copy.js')));
const authors = () => AU || (AU = require('./authors.js'));
/* the list's hits in a call's strings, handed as { file, text }: the rules read by scripts/private-terms.js (rulesFrom,
   with every refusal of a list written wrong) and applied by scripts/clean-copy.js (survivors), the two halves the
   public check is made of, each rule with its own "files" limit, each hit worded `<file>:<line>`. Not that check's
   check(): it reads a whole TREE. Found by merging this branch with the word check's (2026-10-16), whose check()
   refuses a rule whose limit takes none of the files it is handed, as a one-file write outside docs/ is to a docs-only
   rule, and names a file by its place in git ls-files order, which says nothing of a call's fields: every such file
   write was refused, and every refusal said `in a field`. Read in its two halves, a call is read the same either way */
const hitsIn = (text, files) => copy().survivors(files, terms().rulesFrom(text));

/* mcp__<server>__<tool>: the tool part decides read or write; the server part, GitHub or not */
function partsOf(name) {
  const p = String(name || '').split('__');
  return p[0] === 'mcp' && p.length >= 3 ? { server: p[1], tool: p.slice(2).join('__') } : { server: '', tool: p[p.length - 1] };
}
/* a READ, by its shape: the tool part is ONE read verb (get, list, search, read or download), then only words
   on READ_WORDS, the things a read reads and the words that say which (latest, recent, my, by, for). A
   connective (and, then, or, plus), a second verb, or any word this list has not met makes a write. Found in
   the branch's second review (2026-10-16): until then a read was the verb with no word of a list of WRITE
   words after it, and a denylist names only the verbs already met: search_and_replace, get_and_publish and
   download_and_sync passed as reads, unread. A read this shape does not take costs nothing: it is read as a write.
   Words split at _ - and a capital (get_fileAndDelete is get, file, and, delete); `pull requests` is one
   word (pull alone is a git verb, requests alone is not a thing a read here reads), and `run` and `check`
   are not on the list (get_check_run is a named read below) */
const READ_VERB = new Set(['get', 'list', 'search', 'read', 'download']);
const READ_WORDS = new Set(('account agent agents assets attachment attachments branches by code collaborators commit commits ' +
  'content contents doc documentation drives environments fields file files folders for info issue issues items job label latest ' +
  'logs me meeting meetings members metadata my objects overview page permissions portfolio portfolios presentation project ' +
  'projects pull_request pull_requests recent recording release releases repos repositories repository resource session sessions ' +
  'shared slide spreadsheet status stories tag tags task tasks team teams thumbnail transcript triggers types user users values ' +
  'workspace').split(' '));
const wordsOf = tool => String(tool).replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  .reduce((w, x) => (w.length && w[w.length - 1] === 'pull' && /^requests?$/.test(x) ? w.splice(-1, 1, 'pull_' + x) : w.push(x), w), []);
const readShape = tool => { const w = wordsOf(tool); return w.length >= 2 && READ_VERB.has(w[0]) && /^[a-z]+_/.test(tool) && w.slice(1).every(x => READ_WORDS.has(x)); };
/* the server as NAMED_READS names it: lower case, with the claude.ai connector prefix taken off, so the owner's
   laptop's mcp__claude_ai_GitHub__ is the same `github` as a cloud session's mcp__github__ */
const serverKey = server => String(server || '').toLowerCase().replace(/^claude_ai_/, '');
/* plain reads the rule above does not take, one by one, by server and name, each with why it only reads. A
   name here on any other server is not a read: `export` or `search` elsewhere is whatever that server made it */
const NAMED_READS = {
  'github/issue_read': 'GitHub: one issue, its comments, labels, parent or sub-issues (its method is one of a fixed list of gets)',
  'github/pull_request_read': 'GitHub: one pull request, its diff, files, reviews, comments or checks (a fixed list of gets)',
  'github/actions_get': 'GitHub: one workflow, run, job or artifact',
  'github/actions_list': 'GitHub: workflows, runs, jobs or artifacts',
  'github/get_check_run': 'GitHub: one CI check run and its output (its `run` is the check, not an order to run one)',
  'claude_docs/read': 'Claude Docs: the text of a doc',
  'claude_docs/guide': 'Claude Docs: its own instructions',
  'claude_docs/query': 'Claude Docs: a doc\'s or a tab\'s comment history, listed',
  'claude_docs/export': 'Claude Docs: one tab handed back inline, as base64; nothing is stored or sent anywhere else',
  'fireflies/fireflies_fetch': 'Fireflies: one meeting\'s transcript, by its id',
  'granola/query_granola_meetings': 'Granola: a question about his meetings, answered from his notes; nothing is stored',
  'zoom_for_claude/search': 'Zoom: its search, marked read-only by Zoom; results come back, nothing is stored',
  'zoom_for_claude/search_describe_capabilities': 'Zoom: what its search can look in, described; nothing is stored',
};
const SHARE = /(?:^|_)share(?:_|$)|shareable/;
const WHO_SEES = /collaborator|permission/;
function kindOf(name) {
  const { server, tool } = partsOf(name);
  if (SHARE.test(tool)) return 'share';
  if (Object.prototype.hasOwnProperty.call(NAMED_READS, serverKey(server) + '/' + tool)) return 'read';
  if (readShape(tool)) return 'read';
  if (WHO_SEES.test(tool)) return 'share';
  return 'write';
}

/* every string in a call's input, at any depth — values and field names — each with where it sits; a number
   or a yes/no as its text, marked `num` */
function stringsOf(input) {
  const out = [];
  const walk = (v, at) => {
    if (typeof v === 'string') out.push({ at, s: v });
    else if (typeof v === 'number' || typeof v === 'boolean') out.push({ at, s: String(v), num: true });
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, at.concat(i)));
    else if (v && typeof v === 'object') Object.keys(v).forEach(k => { out.push({ at: at.concat(k), s: k, key: true }); walk(v[k], at.concat(k)); });
  };
  walk(input, []);
  return out;
}

/* a string that is base64 of text, decoded; anything else, null */
const B64 = /^[A-Za-z0-9+/]{16,}={0,2}$/;
function decoded(s) {
  const t = s.replace(/\s+/g, '');
  if (t.length % 4 || !B64.test(t)) return null;
  const buf = Buffer.from(t, 'base64');
  if (!buf.length || buf.subarray(0, 8000).includes(0)) return null;
  const text = buf.toString('utf8');
  return Buffer.from(text, 'utf8').equals(buf) ? text : null;
}

/* where a string sits, as a person finds it — `files[1].content` — with any field name that is not a plain
   name, or that is itself hidden, as `…`. Shallow: only the top field, for when nothing can say which
   deeper names are safe to print (no list loaded) */
const PLAIN = /^[A-Za-z_][A-Za-z0-9_]{0,40}$/;
function fieldOf(item, hidden, shallow) {
  if (item.across !== undefined) return 'across fields (' + (item.across ? fieldOf(item.across[0], hidden, shallow) + ' and ' + fieldOf(item.across[1], hidden, shallow) : 'the strings read joined, in order') + ')';
  const at = shallow ? item.at.slice(0, 1) : item.at;
  let out = '';
  at.forEach(k => {
    if (typeof k === 'number') out += '[' + k + ']';
    else out += (out ? '.' : '') + (PLAIN.test(k) && !hidden.has(k) ? k : '…');
  });
  if (shallow && item.at.length > 1) return (out || 'the input') + ' (somewhere inside)';
  return (out || 'the input itself') + (item.key ? ' (a field name)' : '') + (item.decoded ? ' (read decoded from base64)' : '');
}
const ruleNo = id => /^\d+(?:\.\d+)?$/.test(String(id)) ? 'rule #' + id : 'a rule with no number';

const hasAddress = s => authors().judgeFiles([{ file: 'x', text: s }]).length > 0;

/* the owner's list: { text } or { why }. Never inside a repository, and never echoed */
const LIST_DEFAULT = () => path.join(os.homedir(), '.private-terms', 'map.md');
function insideRepository(file, exists) {
  let d = path.dirname(path.resolve(file));
  for (;;) { if (exists(path.join(d, '.git'))) return true; const up = path.dirname(d); if (up === d) return false; d = up; }
}
function loadList(env, exists) {
  const named = !!env.PRIVATE_TERMS_FILE, file = env.PRIVATE_TERMS_FILE || LIST_DEFAULT();
  const where = named ? 'the file PRIVATE_TERMS_FILE names' : '~/.private-terms/map.md';
  if (insideRepository(file, exists || fs.existsSync)) return { why: 'the private list (' + where + ') sits inside a git repository, and it must never be in one' };
  let text; try { text = fs.readFileSync(file, 'utf8'); } catch (e) { return { why: 'the owner\'s private list is not loaded (' + where + ' is absent or unreadable)' }; }
  try { terms().rulesFrom(text); }
  catch (e) { return { why: 'the private list (' + where + ') could not be used: ' + (/nothing was checked/.test(e.message) ? e.message : 'it could not be read') }; }
  return { text };
}
const HOW_TO_LOAD = 'Load it for this session: read the owner\'s list from where he keeps it, with a read-only tool ' +
  '(read or download; never copy, share or move it), write it to ~/.private-terms/map.md, outside every repository ' +
  '(or to a file PRIVATE_TERMS_FILE names), and delete that file when the session ends. Never put the list in a ' +
  'repository, a comment, a message or a log.';

/* this checkout's own owner on GitHub, from its origin; null when it cannot be read (then no write is private) */
function ownerFromUrl(url) {
  const m = /github\.com[:/]+([^/\s]+)\/[^/\s]+?(?:\.git)?\/?$/i.exec(String(url || '').trim());
  return m ? m[1].toLowerCase() : null;
}
function ownerOf(root) {
  try { return ownerFromUrl(execFileSync('git', ['-C', root, 'remote', 'get-url', 'origin'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 })); }
  catch (e) { return null; }
}

/* every repository a call names: { owner, name } from `repo`-like fields, with the `owner` beside them */
const REPO_KEY = /^(?:repo|repository|repo_?name|repository_?name|full_?name)$/i;
function reposOf(input) {
  const out = [];
  const walk = v => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== 'object') return;
    Object.keys(v).forEach(k => {
      if (REPO_KEY.test(k) && typeof v[k] === 'string') {
        const r = v[k], slash = r.indexOf('/');
        out.push(slash >= 0 ? { owner: r.slice(0, slash), name: r.slice(slash + 1) } : { owner: typeof v.owner === 'string' ? v.owner : null, name: r });
      }
      walk(v[k]);
    });
  };
  walk(input);
  return out;
}

/* the rules as a comment reads them: every rule, its `files` scope taken off */
const unscoped = text => JSON.stringify(terms().rulesFrom(text).map(r => { const c = Object.assign({}, r); delete c.files; return c; }));
/* a repository the list names: the WHOLE name is one `find` of a replace or drop rule, case as that rule reads
   it (`ci`). Found in the branch's second review (2026-10-16): until then a name that only CONTAINED a listed
   one, word-bounded (<name>-public, my-<name>, <name>.backup), was taken for it, and a write to that public
   companion skipped the term check. Any rule's, whatever its kind: a list need not file its repositories under
   one kind. A pattern never names a repository here */
const listedName = (rules, name) => rules.some(r => (r.rule === 'replace' || r.rule === 'drop') && Array.isArray(r.find) &&
  r.find.some(f => typeof f === 'string' && (r.ci ? f.toLowerCase() === name.toLowerCase() : f === name)));

function privateWrite(name, input, listText, pin) {
  if (!/github/i.test(partsOf(name).server)) return false;
  const R = reposOf(input);
  if (!R.length) return false;
  const rules = terms().rulesFrom(listText);
  return R.every(r => {
    if (!r.owner || !r.name) return false;
    const mine = pin();
    return !!mine && r.owner.toLowerCase() === mine && listedName(rules, r.name);
  });
}

/* THE EDGES two strings meet at: the end of one (its last EDGE characters) and the start of another (its first),
   each cut back to a whole word so a cut makes no word edge that is not there. A split term's halves sit there.
   Several strings with the same edge are read once, under the first two different strings that have it */
const EDGE = 512, SEP = '\u0000\n\n';                 /* SEP: no word, no space, a blank line: nothing reads across it */
const WORD = /[\p{L}\p{N}_]/u;                      /* a word character, as scripts/clean-copy.js reads one */
const tailOf = s => { if (s.length <= EDGE) return s; const w = s.slice(-EDGE); let i = 0; while (i < w.length && WORD.test(w[i])) i++; return w.slice(i); };
const headOf = s => { if (s.length <= EDGE) return s; const w = s.slice(0, EDGE); let i = w.length; while (i > 0 && WORD.test(w[i - 1])) i--; return w.slice(0, i); };
function edgesOf(values, tail, head) {
  const tails = new Map(), heads = new Map(), put = (m, k, i) => { const l = m.get(k); if (l) l.push(i); else m.set(k, [i]); };
  values.forEach((it, i) => { put(tails, (tail || tailOf)(it.s), i); put(heads, (head || headOf)(it.s), i); });
  return { tails, heads };
}
/* two DIFFERENT strings, one with this end and one with this start: [i, j], or null when the only string with
   both is one and the same */
const twoOf = (It, Ih) => { let i = It[0], j = Ih.find(x => x !== i); if (j === undefined) { j = Ih[0]; i = It.find(x => x !== j); } return i === undefined ? null : [i, j]; };
/* what reading every two strings joined costs, in characters, before any is joined; over PAIRS_CHARS the write
   is refused (split it), not read in part */
const PAIRS_CHARS = 16 * 1024 * 1024;
function pairCost(values) {
  const { tails, heads } = edgesOf(values), sum = m => [...m.keys()].reduce((n, k) => n + k.length, 0);
  return 2 * (heads.size * sum(tails) + tails.size * sum(heads)) + tails.size * heads.size * (1 + 2 * SEP.length);
}

/* AN ADDRESS SPLIT BETWEEN FIELDS (the branch's second review, 2026-10-16): `reach me at someone@` in a title and
   `example.test` in the body is an address in neither, and passed. So every two strings are read joined, each way
   round, and all of them in order, by test/authors.js's own pattern and allow-list, nothing between them (an
   address holds no space). Only the run of address characters at the end of the one and the start of the other
   can meet in an address, and only where one of them holds the @. A join counts when its address crosses from
   one string into the other, is not a no-reply one, and no piece of it is an address on its own: that one was
   judged where it stands, and a join only glues a neighbour's letters onto it (`Author` beside a no-reply
   address in the next cell is not a new address). A run is read by a loop, at most 320 characters (the longest
   an address can be): a pattern ending `*$` takes seconds on a long word */
const ADDR_CH = /[A-Za-z0-9._%+@-]/, RUN = 320;
const runEnd = s => { let i = s.length; while (i > 0 && s.length - i < RUN && ADDR_CH.test(s[i - 1])) i--; return s.slice(i); };
const runStart = s => { let i = 0; while (i < s.length && i < RUN && ADDR_CH.test(s[i])) i++; return s.slice(0, i); };
function addressAcross(values) {
  const { EMAIL, allowed } = authors(), whole = s => new RegExp(EMAIL.source).test(s), found = [];
  if (!values.some(it => it.s.indexOf('@') >= 0)) return found;
  const crosses = (J, cuts) => {                       /* cuts: where each string after the first starts in J, in order */
    const re = new RegExp(EMAIL.source, 'g'); let m;
    while ((m = re.exec(J))) {
      const s = m.index, e = s + m[0].length, inside = [];
      let a = 0, b = cuts.length;
      while (a < b) { const c = (a + b) >> 1; if (cuts[c] <= s) a = c + 1; else b = c; }
      for (let k = a; k < cuts.length && cuts[k] < e; k++) inside.push(cuts[k]);
      if (!inside.length || allowed(m[0])) continue;
      const bounds = [s].concat(inside, [e]);
      if (!bounds.slice(1).some((x, k) => whole(J.slice(bounds[k], x)))) return true;
    }
    return false;
  };
  const { tails, heads } = edgesOf(values, runEnd, runStart);
  const T = [...tails].filter(([t]) => t), H = [...heads].filter(([h]) => h), named = new Set();
  const pair = ([t, It], [h, Ih]) => {
    const ij = twoOf(It, Ih);
    if (ij && crosses(t + h, [t.length]) && !named.has(ij.join())) { named.add(ij.join()); found.push({ across: [values[ij[0]], values[ij[1]]] }); }
  };
  const Ha = H.filter(([h]) => h.indexOf('@') >= 0);
  T.forEach(x => (x[0].indexOf('@') >= 0 ? H : Ha).forEach(y => pair(x, y)));
  if (found.length || values.length < 3) return found;
  const cuts = [];
  const all = values.reduce((J, it, k) => { if (k) cuts.push(J.length); return J + it.s; }, '');
  return crosses(all, cuts) ? [{ across: null }] : [];
}

/* every hit of the list in a call: [{ id, item, line }] — never the term */
function termHits(items, input, listText) {
  const found = [], handled = new Set(), alone = new Set();
  const free = unscoped(listText), idOf = h => (/^rule #(\S+)/.exec(h) || [])[1], NAME_HIT = /: a file name carries it: /;
  const byAt = new Map(items.filter(it => !it.key && !it.decoded).map(it => [JSON.stringify(it.at), it]));
  /* a file the write names is read as that file, at its path, scopes and all (as CI reads it) */
  const files = [];
  const walk = (v, at) => {
    if (Array.isArray(v)) return v.forEach((x, i) => walk(x, at.concat(i)));
    if (!v || typeof v !== 'object') return;
    if (typeof v.path === 'string' && typeof v.content === 'string') files.push(at);
    Object.keys(v).forEach(k => walk(v[k], at.concat(k)));
  };
  walk(input, []);
  files.forEach(at => {
    const content = byAt.get(JSON.stringify(at.concat('content'))), where = byAt.get(JSON.stringify(at.concat('path')));
    if (!content || !where) return;
    handled.add(content);
    hitsIn(listText, [{ file: where.s, text: content.s }]).forEach(h => {
      const id = (/^rule #(\S+)/.exec(h) || [])[1];
      const m = / survives at .*:(\d+)(?: \(.*\))?$/.exec(h);
      found.push(m ? { id, item: content, line: +m[1] } : { id, item: where, line: null });
    });
  });
  /* everything else at once, against every rule. The file names here are this file's own, so a hit on a
     NAME is not the payload's and is not counted; every other hit counts, even one this cannot place, so
     a change in how scripts/private-terms.js words a hit refuses rather than passes */
  const rest = items.filter(it => !handled.has(it));
  hitsIn(free, rest.map((it, i) => ({ file: 's' + i + '.md', text: it.s }))).forEach(h => {
    if (NAME_HIT.test(h)) return;
    const at = h.lastIndexOf(' survives at s'), m = at < 0 ? null : /^ survives at s(\d+)\.md:(\d+)$/.exec(h.slice(at));
    found.push({ id: idOf(h), item: m ? rest[+m[1]] : null, line: m ? +m[2] : null });
    alone.add(String(idOf(h)));
  });
  /* ACROSS FIELDS: a term split between two strings, a title and a body, is in neither. So the
     strings (field names left out, numbers as text) are read again: EVERY two of them, each way round, the
     end of the one joined to the start of the other, with nothing and with a space between them; and all of
     them in order, the same two ways, every rule with its scope off. Found in the branch's second review
     (2026-10-16): until then only a string and the NEXT one were joined, so a pull request's title and body,
     with head and base between them in the call, never met. Each way round, because the order of a call's
     fields is the caller's, not the reader's. A rule counts here only when no string holds it on its own (a
     file's content included, read with no scope), so a file's scoped term that CI passes still passes, and
     a term whole in one field is named there once. A hit this cannot place still counts, as across fields */
  const values = items.filter(it => !it.key && !it.decoded);
  if (values.length < 2) return found;
  if (handled.size) hitsIn(free, [...handled].map((it, i) => ({ file: 'f' + i + '.md', text: it.s }))).forEach(h => { if (!NAME_HIT.test(h)) alone.add(String(idOf(h))); });
  const { tails, heads } = edgesOf(values), pairs = [], starts = [], whose = [];
  let line = 1;
  for (const [t, It] of tails) for (const [h, Ih] of heads) {
    const ij = twoOf(It, Ih);
    if (ij) [t + h, t + ' ' + h].forEach(s => { starts.push(line); pairs.push(s); whose.push(ij); line += s.split('\n').length + 1; });
  }
  const pairOf = n => { let a = 0, b = starts.length - 1; while (a < b) { const c = (a + b + 1) >> 1; if (starts[c] <= n) a = c; else b = c - 1; } return whose[a]; };
  const all = values.map(it => it.s), byPair = new Set();
  const joined = hitsIn(free, [{ file: 'pairs.md', text: pairs.join(SEP) }, { file: 'joined.md', text: all.join('') }, { file: 'spaced.md', text: all.join(' ') }])
    .filter(h => !NAME_HIT.test(h) && !alone.has(String(idOf(h))));
  joined.forEach(h => {
    const m = / survives at pairs\.md:(\d+)$/.exec(h);
    if (!m) return;
    const [i, j] = pairOf(+m[1]);
    byPair.add(String(idOf(h)));
    found.push({ id: idOf(h), item: { across: [values[i], values[j]] }, line: null });
  });
  joined.forEach(h => { if (!/ survives at pairs\.md:\d+$/.test(h) && !byPair.has(String(idOf(h)))) found.push({ id: idOf(h), item: { across: null }, line: null }); });
  return found;
}

const LIMIT_CHARS = 8 * 1024 * 1024;

/* one call → { ok } or { ok: false, why: [sentences] }. env: { list() → {text}|{why}, pin() → owner|null } */
function decide(name, input, env) {
  const kind = kindOf(name);
  if (kind === 'read') return { ok: true };
  if (kind === 'share') return { ok: false, why: ['sharing a file, or changing who can see one, is the owner\'s to do, on any server; a session never does it'] };
  const items = stringsOf(input);
  if (!items.some(it => !it.key && !it.num)) return { ok: false, why: ['this write carries no text at all (numbers, yes/no or nothing), so nothing in it says what it does, and a write that cannot be read is refused'] };
  if (items.reduce((n, it) => n + it.s.length, 0) > LIMIT_CHARS) return { ok: false, why: ['this write is over 8 MB of text, too much to read inside the hook\'s time; split it'] };
  const values = items.filter(it => !it.key);
  if (values.length >= 2 && pairCost(values) > PAIRS_CHARS) return { ok: false, why: ['this write holds ' + values.length + ' strings, too many to read every two of them joined inside the hook\'s time; split it into smaller writes'] };
  items.filter(it => !it.key && !it.num).forEach(it => { const d = decoded(it.s); if (d != null) items.push({ at: it.at, s: d, decoded: true }); });
  const addressed = items.filter(it => hasAddress(it.s)).concat(addressAcross(values));
  const hidden = new Set(addressed.filter(it => it.key).map(it => it.s));
  const said = (it, shallow) => 'an address that is not a no-reply one, ' + (it.across !== undefined ? '' : 'in ') + fieldOf(it, hidden, shallow);
  const list = env.list();
  if (!list || typeof list.text !== 'string') {
    const why = [...new Set(addressed.map(it => said(it, true)))];
    why.push(((list && list.why) || 'the owner\'s private list is not loaded') + ', so no connector write can be read for it and every one is refused. ' + HOW_TO_LOAD);
    return { ok: false, why };
  }
  let found = [];
  const mine = privateWrite(name, input, list.text, env.pin);
  if (!mine) found = termHits(items, input, list.text);
  found.forEach(f => { if (f.item && f.item.key) hidden.add(f.item.s); });
  const why = [], seen = new Set();
  addressed.forEach(it => { const s = said(it); if (!seen.has(s)) { seen.add(s); why.push(s); } });
  found.forEach(f => {
    const s = ruleNo(f.id) + ' of the private list, ' + (!f.item ? 'in a field' : (f.item.across !== undefined ? '' : 'in ') + fieldOf(f.item, hidden)) + (f.line && f.item && /\n/.test(f.item.s) ? ' line ' + f.line : '');
    if (!seen.has(s)) { seen.add(s); why.push(s); }
  });
  if (!why.length) return { ok: true };
  if (why.length > 20) why.splice(20, why.length - 20, 'and ' + (why.length - 20) + ' more');
  return { ok: false, why };
}

/* the hook's whole reading: text on stdin → { ok, tool, why } */
function fromHook(text, env) {
  let j; try { j = JSON.parse(text); } catch (e) { j = undefined; }
  if (!j || typeof j !== 'object') return { ok: false, tool: 'a tool call', why: ['the call could not be read (its input is not JSON), and a call that cannot be read is refused'] };
  if (typeof j.tool_name !== 'string' || !j.tool_name) return { ok: false, tool: 'a tool call', why: ['the call names no tool, so it cannot be told read from write'] };
  const tool = /^[A-Za-z0-9_.-]{1,120}$/.test(j.tool_name) ? j.tool_name : 'a tool';
  return Object.assign({ tool }, decide(j.tool_name, j.tool_input, env));
}

function selftest() {
  let total = 0; const bad = [];
  const mark = (ok, what, why) => { total++; console.log((ok ? '  ok   ' : '  FAIL ') + what + (ok ? '' : '  (' + why + ')')); if (!ok) bad.push(what); };
  /* made-up terms and addresses, assembled here, so no string in this file is on any list */
  const T = { who: 'Zo' + 'rblax', town: 'Qwerty' + 'ville', attic: 'qwerty' + '-attic', word: 'Plo' + 'ndrel', two: 'Blo' + 'rp Fennick', num: '4242' + '1717',
    long: 'Wib' + 'bleton and the quiet heron of the marsh' };
  const at = (u, d) => u + '@' + d;
  const SECRET = 'someone.private', MAILDOM = 'zorb' + '-mail.test', personal = at(SECRET, MAILDOM), noreply = at('noreply', 'anthropic.com');
  const SAID = 'said-only-' + 'here';                 /* a payload word that must never come back in a refusal */
  const RULES = [
    { id: 3, kind: 'partner', rule: 'replace', find: [T.who], to: '[partner]', ci: true },
    { id: 5, kind: 'place', rule: 'replace', find: [T.town], to: '[city]' },
    { id: 7, kind: 'repository', rule: 'replace', find: [T.attic], to: '[the private repository]' },
    { id: 9, kind: 'notes-only', rule: 'replace', find: [T.word], to: '[x]', files: '^docs/' },
    { id: 11, kind: 'name', rule: 'replace', find: [T.two], to: '[a name]' },
    { id: 13, kind: 'number', rule: 'replace', find: [T.num], to: '[a number]' },
    { id: 15, kind: 'phrase', rule: 'replace', find: [T.long], to: '[a phrase]' },
  ];
  const LIST = '# a made-up list\n\n```json\n' + JSON.stringify(RULES) + '\n```\n';
  const OWNER = 'plant-owner';
  const NO_LIST = { why: 'the owner\'s private list is not loaded (~/.private-terms/map.md is absent or unreadable)' };
  const env = list => ({ list: () => list || { text: LIST }, pin: () => OWNER });
  const call = (name, input, e) => fromHook(JSON.stringify({ tool_name: name, tool_input: input }), e || env());
  const secrets = [T.who, T.who.toLowerCase(), T.town, T.attic, T.word, T.two, T.num, T.long, SECRET, MAILDOM, SAID];
  const leaked = r => (r.why || []).some(w => secrets.some(t => w.indexOf(t) >= 0));
  const expect = (what, r, ok, re) => mark(r.ok === ok && !leaked(r) && (!re || re.test((r.why || []).join(' | '))), what,
    leaked(r) ? 'it printed a term, an address or the payload' : (r.ok ? 'allowed' : 'refused: ' + (r.why || []).join(' | ')));
  const body = s => 'a line\n' + s + ' ' + SAID + '\n';

  /* reads pass, whatever they carry, list or no list */
  expect('a read passes with a term in it (get_file_contents)', call('mcp__github__get_file_contents', { owner: 'x', repo: 'y', path: T.who }), true);
  expect('a read passes with a term in it (issue_read)', call('mcp__github__issue_read', { method: 'get', owner: 'x', repo: 'y', issue_number: 3, note: T.town }), true);
  expect('a read passes with a term in it (search_code)', call('mcp__github__search_code', { query: T.who }), true);
  expect('a read passes with no list loaded', call('mcp__Google_Drive__read_file_content', { fileId: T.who }, env(NO_LIST)), true);

  /* the term check */
  const files = [{ path: 'a.md', content: 'clean words' }, { path: 'b.md', content: body(T.who) }];
  expect('push_files: a term in files[1].content is refused, by rule number, field and line', call('mcp__github__push_files', { owner: 'someone', repo: 'public-repo', branch: 'b', message: 'm', files }), false, /rule #3 of the private list, in files\[1\]\.content line 2/);
  expect('add_issue_comment: a term in the body is refused', call('mcp__github__add_issue_comment', { owner: 'someone', repo: 'public-repo', issue_number: 1, body: body(T.town) }), false, /rule #5 of the private list, in body line 2/);
  expect('the same comment to a repository of this owner whose name is on the list passes', call('mcp__github__add_issue_comment', { owner: OWNER, repo: T.attic, issue_number: 1, body: body(T.town) }), true);
  expect('the same, written owner/name in one field, passes', call('mcp__github__issue_write', { repo: OWNER + '/' + T.attic, title: T.who, body: body(T.town) }), true);
  expect('the same name under ANOTHER owner is not this owner\'s private repository: refused', call('mcp__github__add_issue_comment', { owner: 'someone-else', repo: T.attic, issue_number: 1, body: body(T.town) }), false, /rule #5/);
  /* the branch's second review: a repository whose name only CONTAINS the listed name (a public companion) was
     taken for the listed one, and its writes skipped the term check */
  [T.attic + '-public', T.attic + '-notes', 'my-' + T.attic, T.attic + '.backup', 'Qwerty-Attic'].forEach((n, i) =>
    expect('a repository of this owner whose name only contains the listed name is not the listed one: refused (' + ['-public', '-notes', 'my-', '.backup', 'another case, on a rule read case as written'][i] + ')',
      call('mcp__github__add_issue_comment', { owner: OWNER, repo: n, issue_number: 1, body: body(T.town) }), false, /rule #5 of the private list, in body line 2/));
  expect('a second repository field naming a public repository: refused', call('mcp__github__create_pull_request', { owner: OWNER, repo: T.attic, title: 't', body: body(T.town), head: { repo: 'public-repo' } }), false, /rule #5/);
  expect('a private repository\'s name on another server earns nothing: refused', call('mcp__Google_Drive__create_file', { owner: OWNER, repo: T.attic, title: 't', textContent: body(T.who) }), false, /rule #3/);
  expect('with no owner readable from origin, nothing is private: refused', call('mcp__github__add_issue_comment', { owner: OWNER, repo: T.attic, issue_number: 1, body: body(T.town) }, { list: () => ({ text: LIST }), pin: () => null }), false, /rule #5/);
  expect('a tool name never seen before, carrying a term, is a write: refused', call('mcp__brand_new__frobnicate', { note: T.town }), false, /rule #5 of the private list, in note/);
  expect('a tool name never seen before, with clean text, passes', call('mcp__brand_new__frobnicate', { note: 'plain words' }), true);
  expect('a term in a field NAME is refused, and the name prints as …', call('mcp__x__write_note', { notes: { [T.who]: 'fine words' } }), false, /rule #3 of the private list, in notes\.… \(a field name\)/);
  expect('a term deep inside arrays is found, and the path says where', call('mcp__x__write_note', { a: { b: [0, 1, { c: T.town }] } }), false, /in a\.b\[2\]\.c/);
  expect('a field name that is not a plain name prints as …', call('mcp__x__write_note', { ['some key ' + SAID]: T.town }), false, /in …$/);
  expect('a term in base64 content is read decoded', call('mcp__Google_Drive__create_file', { title: 't', base64Content: Buffer.from('a line about ' + T.town).toString('base64') }), false, /rule #5 .*base64Content \(read decoded from base64\)/);
  expect('Google Docs, Sheets, Slides and Claude Docs writes are read the same way', call('mcp__Google_Sheets__update_values', { spreadsheetId: 's', values: [['a', T.who]] }), false, /values\[0\]\[1\]/);
  /* a file is read at its path, as CI reads it; free text has no path, so a scoped rule applies everywhere */
  expect('a scoped rule\'s term in a file outside its scope passes, as CI would pass it', call('mcp__github__create_or_update_file', { owner: 'o', repo: 'r', branch: 'b', message: 'm', path: 'test/x.js', content: 'const a = "' + T.word + '";' }), true);
  expect('the same term in a file inside its scope is refused', call('mcp__github__create_or_update_file', { owner: 'o', repo: 'r', branch: 'b', message: 'm', path: 'docs/x.md', content: 'about ' + T.word }), false, /rule #9 .*in content/);
  expect('the same term in a comment is refused: a comment has no path to scope by', call('mcp__github__add_issue_comment', { owner: 'o', repo: 'r', issue_number: 1, body: 'about ' + T.word }), false, /rule #9 .*in body/);
  expect('a term in a file name is refused', call('mcp__github__push_files', { owner: 'o', repo: 'r', branch: 'b', message: 'm', files: [{ path: 'docs/' + T.who + '.md', content: 'clean' }] }), false, /rule #3 .*files\[0\]\.path/);
  /* the branch's review (2026-10-16): a term split between two fields is in neither, so the strings are also read
     joined, pair by pair and all in order, with nothing and with a space between them; a number or a yes/no is
     read as its text */
  expect('a term split between the title and the body is refused, as across fields', call('mcp__github__issue_write', { method: 'create', owner: 'o', repo: 'r', title: 'about ' + T.who.slice(0, 3), body: T.who.slice(3) + ' and more' }), false, /rule #3 of the private list, across fields \(title and body\)/);
  expect('a two-word term split between two fields is refused, read with a space between them', call('mcp__github__issue_write', { method: 'create', owner: 'o', repo: 'r', title: T.two.split(' ')[0], body: T.two.split(' ')[1] + ' wrote' }), false, /rule #11 of the private list, across fields \(title and body\)/);
  expect('a term split three ways is found in the strings read joined in order', call('mcp__x__write_note', { a: 'one. ', b: T.who.slice(0, 2), c: T.who.slice(2, 5), d: T.who.slice(5) + ' two' }), false, /rule #3 of the private list, across fields \(the strings read joined, in order\)/);
  expect('a term whole in one field is named by that field only, not again as across fields', call('mcp__github__add_issue_comment', { owner: 'o', repo: 'r', issue_number: 1, body: body(T.town) }), false, /^rule #5 of the private list, in body line 2$/);
  expect('a private number in a number field is refused', call('mcp__x__write_note', { note: 'clean', code: +T.num }), false, /^rule #13 of the private list, in code$/);
  /* the branch's second review (2026-10-16): a term split between two fields that are NOT next to each other in
     the call (a pull request puts head and base between its title and its body), or whose fields come in the
     other order (the order of a call's fields is the caller's, not the reader's), was missed */
  const prSplit = { owner: 'o', repo: 'r', title: T.town.slice(0, 6), head: 'feature', base: 'develop', body: T.town.slice(6) + ' is the rest' };
  expect('a term split between a title and a body with two fields between them is refused, as across fields', call('mcp__github__create_pull_request', prSplit), false, /rule #5 of the private list, across fields \(title and body\)/);
  expect('the same split with the body written before the title is refused too', call('mcp__github__create_pull_request', { body: prSplit.body, owner: 'o', repo: 'r', head: 'feature', base: 'develop', title: prSplit.title }), false, /rule #5 of the private list, across fields \(title and body\)/);
  expect('two clean fields far apart pass', call('mcp__github__create_pull_request', { owner: 'o', repo: 'r', title: 'Fix the stairs', head: 'feature', base: 'develop', body: 'ville is a word in no rule here' }), true);
  expect('a split term at the end of a long title and the start of a long body is refused (each read at its edge)', call('mcp__github__create_pull_request', { owner: 'o', repo: 'r', title: 'x '.repeat(400) + T.town.slice(0, 6), head: 'f', base: 'd', body: T.town.slice(6) + ' y'.repeat(400) }), false, /rule #5 of the private list, across fields \(title and body\)/);
  expect('a long phrase split in its middle, between two long fields, is refused', call('mcp__github__create_pull_request', { owner: 'o', repo: 'r', title: 'x '.repeat(400) + T.long.slice(0, 20), head: 'f', base: 'd', body: T.long.slice(20) + ' y'.repeat(400) }), false, /rule #15 of the private list, across fields \(title and body\)/);
  expect('a term whole where a long string\'s edge is cut, after a word it is part of, makes no word edge: passes', call('mcp__github__create_pull_request', { owner: 'o', repo: 'r', title: 'b'.repeat(600) + T.town + ' ' + 'c'.repeat(511 - T.town.length), head: 'f', base: 'd', body: 'clean' }), true);
  expect('a long word ending in half a term, then the rest, is no word edge: passes', call('mcp__github__create_pull_request', { owner: 'o', repo: 'r', title: 'b'.repeat(700) + T.town.slice(0, 6), head: 'f', base: 'd', body: T.town.slice(6) + ' is the rest' }), true);
  expect('one string is never joined to itself (its end and its own start)', call('mcp__x__write_note', { note: T.town.slice(6) + ' then ' + T.town.slice(0, 6), other: 'x' }), true);
  expect('a write with too many strings to join every two in time is refused, not read in part', call('mcp__Google_Sheets__update_values', { spreadsheetId: 's', values: Array.from({ length: 3000 }, (_, i) => ['cell ' + i]) }), false, /3001 strings, too many to read every two of them joined.*split it/);
  const nb = stringsOf({ a: true, b: 7 });
  mark(nb.some(it => it.s === 'true' && it.at[0] === 'a') && nb.some(it => it.s === '7' && it.at[0] === 'b'), 'a boolean and a number are read as their text', JSON.stringify(nb));
  /* merged with the word check's branch (2026-10-16): its check() reads a WHOLE TREE, so it refuses a rule whose "files"
     limit takes none of the files it is handed, and names each file by its place in git ls-files order, never by its
     name. A call is not a tree: a stand-in check() that does both may not change one decision or one field named */
  const realPT = terms();
  const treeCheck = (text, F) => {
    const off = realPT.rulesFrom(text).find(r => r.rule !== 'keep' && r.files && !F.some(f => f.text != null && new RegExp(r.files).test(f.file)));
    if (off) throw new Error('rule #' + off.id + ' is limited by "files" to paths that match none of the files read; nothing was checked');
    return { hits: realPT.check(text, F).hits.map(h => { const t = / survives at (.*):(\d+)(?: \(.*\))?$/.exec(h), id = /^rule #([^\s:]+)/.exec(h)[1];
      return 'rule #' + id + (t ? ' survives at line ' + t[2] + ' of' : ': a file name carries it:') + ' file ' + (t ? F.findIndex(f => f.file === t[1]) + 1 : 1) + ' in git ls-files order, fingerprint 00000000 (no name is printed on a public log)'; }) };
  };
  const tree = (name, input) => { PT = Object.assign({}, realPT, { check: treeCheck }); try { return call(name, input); } catch (e) { return { ok: false, why: ['it threw (' + e.name + ')'] }; } finally { PT = realPT; } };
  expect('with a check() that reads a whole tree, a file outside a docs-only rule\'s folder still passes', tree('mcp__github__create_or_update_file', { owner: 'o', repo: 'r', branch: 'b', message: 'm', path: 'test/x.js', content: 'const a = "' + T.word + '";' }), true);
  expect('with it, a term in files[1].content is still named by its field and line', tree('mcp__github__push_files', { owner: 'someone', repo: 'public-repo', branch: 'b', message: 'm', files }), false, /^rule #3 of the private list, in files\[1\]\.content line 2$/);
  expect('with it, a term in a comment is still named by its field and line', tree('mcp__github__add_issue_comment', { owner: 'o', repo: 'r', issue_number: 1, body: body(T.town) }), false, /^rule #5 of the private list, in body line 2$/);
  expect('with it, a term split between a title and a body is still named by its two fields', tree('mcp__github__create_pull_request', prSplit), false, /^rule #5 of the private list, across fields \(title and body\)$/);

  /* addresses: the same rule as test/authors.js, list or no list, private repository or not */
  expect('a comment holding a personal address is refused, and neither the address nor its domain is printed', call('mcp__github__add_issue_comment', { owner: 'o', repo: 'r', issue_number: 1, body: 'write to ' + personal }), false, /an address that is not a no-reply one, in body/);
  expect('a comment holding a no-reply address passes', call('mcp__github__add_issue_comment', { owner: 'o', repo: 'r', issue_number: 1, body: 'Co-Authored-By: Claude <' + noreply + '>' }), true);
  expect('a personal address in a private repository is still refused', call('mcp__github__add_issue_comment', { owner: OWNER, repo: T.attic, issue_number: 1, body: 'write to ' + personal }), false, /address/);
  expect('a personal address with no list loaded is named too', call('mcp__github__add_issue_comment', { owner: 'o', repo: 'r', issue_number: 1, body: personal }, env(NO_LIST)), false, /address .*in body.*not loaded/);
  /* the branch's second review: an address split between two fields was in neither, and passed */
  const half = personal.indexOf('@') + 1;
  expect('a personal address split between the title and the body is refused, as across fields', call('mcp__github__issue_write', { method: 'create', owner: 'o', repo: 'r', title: 'reach me at ' + personal.slice(0, half), body: personal.slice(half) + ' for details' }), false, /an address that is not a no-reply one, across fields \(title and body\)/);
  expect('the same split at the @ the other way, and with fields between, is refused', call('mcp__github__create_pull_request', { owner: 'o', repo: 'r', title: 'write to ' + SECRET, head: 'feature', base: 'develop', body: '@' + MAILDOM + ' today' }), false, /an address that is not a no-reply one, across fields \(title and body\)/);
  expect('a personal address split three ways is found in the strings read joined in order', call('mcp__x__write_note', { a: 'to ' + SECRET, b: '@' + MAILDOM.slice(0, 5), c: MAILDOM.slice(5) + ' now' }), false, /an address that is not a no-reply one, across fields \(the strings read joined, in order\)/);
  expect('a split address with no list loaded is named too', call('mcp__github__issue_write', { method: 'create', owner: 'o', repo: 'r', title: 'reach me at ' + personal.slice(0, half), body: personal.slice(half) }, env(NO_LIST)), false, /address .*across fields \(title and body\).*not loaded/);
  expect('a no-reply address split between two fields passes', call('mcp__github__issue_write', { method: 'create', owner: 'o', repo: 'r', title: 'Co-Authored-By: Claude <' + noreply.slice(0, 8), body: noreply.slice(8) + '>' }), true);
  expect('a no-reply address whole in one cell, a word in the next, passes (the join glues nothing onto it)', call('mcp__Google_Sheets__update_values', { spreadsheetId: 's', values: [['Author', noreply, 'Claude'], ['12345+someone@users.noreply.github.com', 'x']] }), true);

  /* no list: every write refused, with how to load it; a read still passes (above) */
  expect('with no list, a clean write is refused, saying how to load the list', call('mcp__github__add_issue_comment', { owner: 'o', repo: 'r', issue_number: 1, body: 'plain words' }, env(NO_LIST)), false, /not loaded.*from where he keeps it, with a read-only tool.*delete that file when the session ends/);
  expect('with no list, a private repository\'s comment is refused too: it cannot be known private', call('mcp__github__add_issue_comment', { owner: OWNER, repo: T.attic, issue_number: 1, body: 'plain words' }, env(NO_LIST)), false, /not loaded/);
  expect('with no list, a deep field name is not printed', call('mcp__x__write', { a: { [T.who]: personal } }, env(NO_LIST)), false, /in a \(somewhere inside\)/);

  /* sharing, and writes with nothing to read */
  expect('Drive share_file is refused, even clean and with the list', call('mcp__Google_Drive__share_file', { fileId: 'f', role: 'reader', emailAddress: noreply }), false, /owner's to do/);
  expect('share_file on any other server is refused', call('mcp__other__share_file', { fileId: 'f' }), false, /owner's to do/);
  expect('a meeting share is refused', call('mcp__Fireflies__fireflies_share_meeting', { id: 'm' }), false, /owner's to do/);
  expect('adding a collaborator is refused', call('mcp__Zoom_for_Claude__canvas_add_file_collaborators', { fileId: 'f' }), false, /owner's to do/);
  expect('reading who can see a file is a read, and passes', call('mcp__Google_Drive__get_file_permissions', { fileId: 'f' }), true);
  expect('a write with no string at all is refused', call('mcp__x__do_thing', { n: 3, flag: true }), false, /no text at all/);
  expect('a write with an empty input is refused', call('mcp__x__do_thing', {}), false, /no text at all/);
  expect('a write with no input is refused', call('mcp__x__do_thing', undefined), false, /no text at all/);
  expect('a write named like a read, carrying a term, is a write: refused', call('mcp__x__export_repository', { note: T.town }), false, /rule #5 of the private list, in note/);
  expect('search_and_replace, carrying a term, is a write: refused', call('mcp__Google_Docs__search_and_replace', { documentId: 'd', text: 'a line about ' + T.town + ' here' }), false, /rule #5 of the private list, in text/);
  expect('search_and_replace, carrying a personal address, is a write: refused', call('mcp__Google_Docs__search_and_replace', { documentId: 'd', text: 'mail me ' + personal }), false, /an address that is not a no-reply one, in text/);
  expect('a write too large to read in time is refused', call('mcp__x__do_thing', { a: 'x'.repeat(LIMIT_CHARS + 1) }), false, /8 MB/);
  mark(!fromHook('not json', env()).ok, 'a call that is not JSON is refused', 'allowed');
  mark(!fromHook(JSON.stringify({ tool_input: { body: 'x' } }), env()).ok, 'a call that names no tool is refused', 'allowed');

  /* the names: read only by a read's shape and the named reads; everything else is a write */
  const names = [['mcp__github__get_me', 'read'], ['mcp__github__list_issues', 'read'], ['mcp__github__search_issues', 'read'],
    ['mcp__github__issue_read', 'read'], ['mcp__github__pull_request_read', 'read'], ['mcp__Claude_Docs__read', 'read'],
    ['mcp__Claude_Docs__query', 'read'], ['mcp__Claude_Docs__export', 'read'], ['mcp__Google_Drive__download_file_content', 'read'],
    ['mcp__claude_ai_GitHub__get_commit', 'read'], ['mcp__Google_Drive__list_shared_drives', 'read'],
    ['mcp__github__merge_pull_request', 'write'], ['mcp__github__add_issue_comment', 'write'], ['mcp__github__update_pull_request', 'write'],
    ['mcp__github__run_secret_scanning', 'write'], ['mcp__Google_Drive__copy_file', 'write'], ['mcp__Google_Drive__trash_file', 'write'],
    ['mcp__x__getaway', 'write'], ['mcp__x__readme_write', 'write'], ['mcp__x__get_share_link', 'share'], ['mcp__x__update_permissions', 'share'],
    /* the branch's review: a read's prefix followed by a write word is a write, and so is query, fetch or export: a read the
       prefixes do not cover is named, with its server */
    ['mcp__x__export_repository', 'write'], ['mcp__x__fetch_and_overwrite', 'write'], ['mcp__x__query_then_post', 'write'],
    ['mcp__x__get_or_create_file', 'write'], ['mcp__x__list_and_delete_files', 'write'], ['mcp__x__download_then_upload', 'write'],
    ['mcp__x__read_and_send', 'write'], ['mcp__x__get_fileAndDelete', 'write'], ['mcp__x__export', 'write'], ['mcp__x__read', 'write'],
    ['mcp__x__search', 'write'], ['mcp__Fireflies__fireflies_fetch', 'read'], ['mcp__github__get_check_run', 'read'],
    ['mcp__claude_ai_GitHub__issue_read', 'read'], ['mcp__github__list_pull_requests', 'read'], ['mcp__Granola__query_granola_meetings', 'read'],
    ['mcp__Zoom_for_Claude__search', 'read'],
    /* the branch's second review: a read verb, then a write verb that no denylist named, was a read. Now a read is a
       read verb followed only by words this file knows as the things a read reads: a connective (and, then, or,
       plus) or any word it has not met makes a write */
    ['mcp__Google_Docs__search_and_replace', 'write'], ['mcp__x__get_and_publish', 'write'], ['mcp__x__download_and_sync', 'write'],
    ['mcp__x__read_and_apply', 'write'], ['mcp__x__get_and_commit', 'write'], ['mcp__x__search_replace', 'write'], ['mcp__x__get_file_plus_mail', 'write'],
    ['mcp__x__list_files_or_wipe', 'write'], ['mcp__x__get_reportandmail', 'write'], ['mcp__github__get_commit', 'read'], ['mcp__github__get_release_by_tag', 'read'],
    ['mcp__Asana__get_items_for_portfolio', 'read'], ['mcp__Google_Slides__read_slide_page_thumbnail', 'read'], ['mcp__Zoom_for_Claude__search_describe_capabilities', 'read'],
    ['mcp__x__get_pull', 'write'], ['mcp__x__get_requests', 'write'], ['mcp__x__get_run', 'write']];
  names.forEach(([n, want]) => mark(kindOf(n) === want, n + ' is a ' + want, 'got ' + kindOf(n)));

  /* the list file: absent, broken, inside a repository, good — and never echoed */
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'toolguard-'));
  try {
    const f = path.join(tmp, 'map.md'), noGit = () => false;
    let r = loadList({ PRIVATE_TERMS_FILE: f }, noGit);
    mark(!r.text && /not loaded .*absent or unreadable/.test(r.why), 'no list file: not loaded', JSON.stringify(r));
    fs.writeFileSync(f, '```json\n[{"id":3,"rule":"replace","find":["' + T.who + '"],"to":"x"\n```\n');
    r = loadList({ PRIVATE_TERMS_FILE: f }, noGit);
    mark(!r.text && /could not be used/.test(r.why) && r.why.indexOf(T.who) < 0, 'a broken list is refused without quoting it', JSON.stringify(r));
    fs.writeFileSync(f, LIST);
    r = loadList({ PRIVATE_TERMS_FILE: f }, noGit);
    mark(r.text === LIST, 'a good list is read', JSON.stringify(Object.keys(r)));
    r = loadList({ PRIVATE_TERMS_FILE: f }, p => p === path.join(path.dirname(tmp), '.git'));
    mark(!r.text && /inside a git repository/.test(r.why), 'a list inside a repository is refused', JSON.stringify(r));
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  /* the hook as Claude Code runs it, the call on stdin: exit 0 or 2. And its own time limit: Claude Code
     stops a hook at the 30 s .claude/settings.json gives it and then lets the call THROUGH, so the hook stops its
     check sooner and refuses in its own words. --limit-ms (only ever lower) and --stall (a check that never ends)
     are this self-test's, so the real limit need not be waited out */
  const hookTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'toolguard-hook-'));
  try {
    const lf = path.join(hookTmp, 'map.md'); fs.writeFileSync(lf, LIST);
    const hook = (input, extra) => spawnSync(process.execPath, [__filename, '--hook'].concat(extra || []), { input: JSON.stringify(input), encoding: 'utf8', timeout: 15000, env: Object.assign({}, process.env, { PRIVATE_TERMS_FILE: lf }) });
    const said = h => 'exit ' + h.status + ': ' + String(h.stderr || '').split('\n')[0].slice(0, 160);
    let h = hook({ tool_name: 'mcp__brand_new__frobnicate', tool_input: { note: 'plain words' } });
    mark(h.status === 0, 'the hook itself: a clean write exits 0', said(h));
    h = hook({ tool_name: 'mcp__brand_new__frobnicate', tool_input: { note: body(T.town) } });
    mark(h.status === 2 && /rule #5 of the private list, in note line 2/.test(h.stderr) && !secrets.some(t => String(h.stderr).indexOf(t) >= 0), 'the hook itself: a term exits 2, named by rule and field and never quoted', said(h));
    h = hook({ tool_name: 'mcp__github__get_file_contents', tool_input: { owner: 'x', repo: 'y', path: T.who } });
    mark(h.status === 0, 'the hook itself: a read exits 0', said(h));
    h = hook({ tool_name: 'mcp__Google_Docs__search_and_replace', tool_input: { documentId: 'd', text: 'a line about ' + T.town + ' here' } });
    mark(h.status === 2 && /rule #5 of the private list, in text/.test(h.stderr), 'the hook itself: a write named as a read verb and a write verb is not let through on its name', said(h));
    const t1 = Date.now();
    h = hook({ tool_name: 'mcp__brand_new__frobnicate', tool_input: { note: 'plain words' } }, ['--limit-ms', '1000', '--stall']);
    mark(h.status === 2 && /still running after 1 s/.test(h.stderr) && Date.now() - t1 < 10000, 'a check still running at the hook\'s own limit is stopped there and refused, in its own sentence', said(h));
  } finally { fs.rmSync(hookTmp, { recursive: true, force: true }); }
  mark(ownerFromUrl('https://github.com/Some-One/a-repo') === 'some-one' && ownerFromUrl(at('git', 'github.com:someone/r.git')) === 'someone' && ownerFromUrl('https://example.test/a/b') === null,
    'the owner is read from a GitHub origin, and from nothing else', 'misread');

  /* the settings this file is worth nothing without: the real .claude/settings.json, read as Claude Code
     reads a matcher (letters, digits, _ - , | and spaces: exact names; anything else: a JavaScript
     regular expression, unanchored). A deny list or a hook taken out of it is red on the next build */
  let S = null; try { S = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8')); } catch (e) { S = null; }
  const matches = (m, name) => m == null || m === '' || m === '*' ? true
    : /^[A-Za-z0-9_\-\s,|]*$/.test(m) ? m.split(/[|,]/).map(x => x.trim()).includes(name) : new RegExp(m).test(name);
  const pre = (S && S.hooks && S.hooks.PreToolUse) || [];
  const runs = (name, script) => pre.some(e => matches(e.matcher, name) && (e.hooks || []).some(h => h.type === 'command' && h.command.indexOf(script + '" --hook') >= 0));
  const DENY = ['merge_pull_request', 'fork_repository', 'create_repository', 'delete_file', 'push_files', 'create_or_update_file'].map(t => 'mcp__github__' + t);
  const deny = (S && S.permissions && S.permissions.deny) || [];
  DENY.forEach(t => mark(deny.includes(t), '.claude/settings.json denies ' + t + ' outright', 'it is not on permissions.deny'));
  ['mcp__github__add_issue_comment', 'mcp__Google_Drive__share_file', 'mcp__claude_ai_GitHub__issue_write', 'mcp__brand_new__frobnicate'].forEach(n =>
    mark(runs(n, 'test/toolguard.js'), '.claude/settings.json runs this hook before ' + n, 'no PreToolUse entry matching it runs test/toolguard.js --hook'));
  mark(!runs('Bash', 'test/toolguard.js'), 'and not before a Bash command, which is not a connector call', 'its matcher also takes Bash');
  mark(runs('Bash', 'test/authors.js') && runs('Bash', 'test/pushguard.js'), 'the Bash hooks are still there (test/authors.js and test/pushguard.js)', 'one of them is gone');

  if (bad.length) { console.log('FAIL: ' + bad.length + ' of ' + total); process.exit(1); }
  console.log('OK: ' + total + ' cases, made-up terms and addresses only, no network.');
  process.exit(0);
}

/* THE HOOK (.claude/settings.json): the call on stdin; exit 0, or a refusal on stderr and exit 2. A read is told
   by its name here; anything else is decided by a child (`--decide`) that this stops at its own limit, under
   Claude Code's 30 s, and a check stopped there refuses. --limit-ms (only ever lower) and --stall (a child that
   never answers) are the self-test's, so it need not wait 20 s */
const LIMIT_MS = 20000;
function hook(argv) {
  const t0 = Date.now(), li = argv.indexOf('--limit-ms');
  const limit = li >= 0 && +argv[li + 1] > 0 ? Math.min(LIMIT_MS, +argv[li + 1]) : LIMIT_MS;
  const refuse = (tool, why) => {
    try {
      fs.writeSync(2, 'TOOL CALL REFUSED by test/toolguard.js — ' + tool + ': ' + why.join('; ').replace(/\.?$/, '.') + '\n' +
        'Nothing of the call is printed here: a rule is named by its number and a field by its path. Rephrase it, or write it to the private repository; ' +
        'merging, sharing and changing who can see a file are the owner\'s.\n');
    } catch (e) {}
    process.exit(2);
  };
  const late = () => refuse('this call', ['the check was still running after ' + Math.round((Date.now() - t0) / 1000) + ' s, where it normally takes about a second, ' +
    'so it was stopped before Claude Code\'s own limit (which would let the call through); a check that cannot finish refuses']);
  const timer = setTimeout(late, limit);
  let input = '', started = false;
  const go = () => {
    if (started) return; started = true;
    let j = null; try { j = JSON.parse(input); } catch (e) { j = null; }
    if (j && typeof j === 'object' && typeof j.tool_name === 'string' && kindOf(j.tool_name) === 'read') process.exit(0);
    const left = limit - (Date.now() - t0);
    if (left <= 0) return late();
    const r = spawnSync(process.execPath, [__filename, '--decide'].concat(argv.includes('--stall') ? ['--stall'] : []),
      { input, encoding: 'utf8', timeout: left, killSignal: 'SIGKILL', maxBuffer: 4 * 1024 * 1024, stdio: ['pipe', 'pipe', 'ignore'] });
    clearTimeout(timer);
    if (r.error && r.error.code === 'ETIMEDOUT') return late();
    let out = null; try { out = JSON.parse(String(r.stdout || '').trim().split('\n').pop()); } catch (e) { out = null; }
    if (r.status !== 0 || !out || typeof out.ok !== 'boolean') return refuse('this call', ['the check itself failed (it ended without an answer), and a check that cannot finish refuses']);
    if (out.ok === true) process.exit(0);
    refuse(typeof out.tool === 'string' ? out.tool : 'this call', Array.isArray(out.why) && out.why.length ? out.why.map(String) : ['the check refused it']);
  };
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => { input += d; });
  process.stdin.on('end', go);
  process.stdin.on('error', go);
}

/* the child: the call on stdin, the decision on stdout as one line of JSON. It never prints the payload: a
   check that throws says only the error's kind */
function decideMain(argv) {
  let input = ''; try { input = fs.readFileSync(0, 'utf8'); } catch (e) {}
  if (argv.includes('--stall')) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);   /* the self-test's check that never ends */
  let pinned;
  const env = { list: () => loadList(process.env), pin: () => (pinned === undefined ? (pinned = ownerOf(ROOT)) : pinned) };
  let r;
  try { r = fromHook(input, env); }
  catch (e) { r = { ok: false, tool: 'this call', why: ['the check itself failed (' + (e && e.name) + '), and a check that cannot finish refuses'] }; }
  fs.writeSync(1, JSON.stringify(r) + '\n');
}

if (require.main === module) {
  if (process.argv.includes('--selftest')) return void selftest();
  if (process.argv.includes('--hook')) return void hook(process.argv);
  if (process.argv.includes('--decide')) return void decideMain(process.argv);
  console.log('usage: node test/toolguard.js --hook | --decide | --selftest');
}

module.exports = { kindOf, partsOf, stringsOf, decide, fromHook, loadList, ownerFromUrl, reposOf, NAMED_READS, READ_WORDS, LIMIT_MS };
