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
      - A tool is a READ only if the last part of its name starts with get_, list_, search_, read_,
        download_, query, fetch or export, or is one of NAMED_READS below, each with its reason. A read
        passes untouched. Everything else is a WRITE, a name this file has never seen included.
      - Sharing is refused on any server: a name with the word `share` in it (Drive's share_file), and a
        write that changes who can see a thing (collaborators, permissions). It is the owner's to do.
      - A write's EVERY string is read, at any depth, field names too — not a list of named fields, which
        a new tool would walk round. A string that is base64 of text is read decoded as well. A write with
        no string at all cannot be read, so it is refused.
      - An address that is not a no-reply one, anywhere in a write, refuses it: test/authors.js's rule,
        asked of test/authors.js (judgeFiles), not typed again.
      - The private-term check reads the owner's list from the file PRIVATE_TERMS_FILE names, else
        ~/.private-terms/map.md, outside every repository (a list inside one is refused), in the shape
        `--map` reads: markdown holding one ```json block. scripts/private-terms.js (rulesFrom, check)
        applies it, with scripts/clean-copy.js under it, so this check cannot drift from the public
        repository's own. With no list, or one that cannot be read, EVERY write is refused, with how to
        load it.
        · A GitHub write whose every repository field names a repository of this checkout's own owner
          (its `origin`) whose name is itself on the list is a write to a private repository: the term
          check is skipped there. The address check is not.
        · Every other write, GitHub or not, is refused if any string hits any rule. A file the write
          names (an object with a `path` and a `content`) is read as that file, scopes and all, exactly
          as the public repository's CI would read it there; every other string — a comment, a title, a
          message — has no path to scope by, so it is read against every rule with its `files` scope
          taken off.
   It never prints the payload, a term, or an address: a refusal names the rule NUMBER and the field
   path (`files[1].content line 2`), and a field name that is not a plain name, or that itself hits,
   prints as `…`.

   What it does not stop, said plainly: a tool whose read name hides a write (`export` is trusted as a
   read); what a read sends out in its own arguments (a search query, a fetched address); a term spelled
   another way, split across two strings, or encoded any way but base64; a session that edits
   .claude/settings.json, or runs with hooks off; a hook that cannot start or runs out of time (Claude
   Code then lets the call through). The switches that hold regardless are the owner's.

   Run:  node test/toolguard.js --hook       (Claude Code's PreToolUse hook: reads the call on stdin)
         node test/toolguard.js --selftest   (made-up terms and addresses, assembled at run time) */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');

/* what reads the rules and the addresses: loaded only for a write, so a read costs nothing but the parse */
let PT = null, AU = null;
const terms = () => PT || (PT = require(path.join(ROOT, 'scripts', 'private-terms.js')));
const authors = () => AU || (AU = require('./authors.js'));

/* mcp__<server>__<tool>: the tool part decides read or write; the server part, GitHub or not */
function partsOf(name) {
  const p = String(name || '').split('__');
  return p[0] === 'mcp' && p.length >= 3 ? { server: p[1], tool: p.slice(2).join('__') } : { server: '', tool: p[p.length - 1] };
}
const READ = /^(?:get_|list_|search_|read_|download_|query|fetch|export)/;
/* plain reads whose names do not start that way, one by one, each with why it only reads */
const NAMED_READS = {
  issue_read: 'GitHub: one issue, its comments, labels, parent or sub-issues (its method is one of a fixed list of gets)',
  pull_request_read: 'GitHub: one pull request, its diff, files, reviews, comments or checks (a fixed list of gets)',
  actions_get: 'GitHub: one workflow, run, job or artifact',
  actions_list: 'GitHub: workflows, runs, jobs or artifacts',
  read: 'Claude Docs: the text of a doc',
  search: 'a server-wide search: results come back, nothing is stored',
  guide: 'Claude Docs: its own instructions',
};
const SHARE = /(?:^|_)share(?:_|$)|shareable/;
const WHO_SEES = /collaborator|permission/;
function kindOf(name) {
  const { tool } = partsOf(name);
  if (SHARE.test(tool)) return 'share';
  if (READ.test(tool) || Object.prototype.hasOwnProperty.call(NAMED_READS, tool)) return 'read';
  if (WHO_SEES.test(tool)) return 'share';
  return 'write';
}

/* every string in a call's input, at any depth — values and field names — each with where it sits */
function stringsOf(input) {
  const out = [];
  const walk = (v, at) => {
    if (typeof v === 'string') out.push({ at, s: v });
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
const HOW_TO_LOAD = 'Load it for this session: read the owner\'s list from his Google Drive with a read-only tool ' +
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
const hitsText = (rulesText, s) => terms().check(rulesText, [{ file: 'repository.md', text: s }]).hits.some(h => h.indexOf(' survives at ') >= 0);

function privateWrite(name, input, listText, pin) {
  if (!/github/i.test(partsOf(name).server)) return false;
  const R = reposOf(input);
  if (!R.length) return false;
  const rules = unscoped(listText);
  return R.every(r => {
    if (!r.owner || !r.name) return false;
    const mine = pin();
    return !!mine && r.owner.toLowerCase() === mine && hitsText(rules, r.name);
  });
}

/* every hit of the list in a call: [{ id, item, line }] — never the term */
function termHits(items, input, listText) {
  const found = [], handled = new Set();
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
    terms().check(listText, [{ file: where.s, text: content.s }]).hits.forEach(h => {
      const id = (/^rule #(\S+)/.exec(h) || [])[1];
      const m = / survives at .*:(\d+)(?: \(.*\))?$/.exec(h);
      found.push(m ? { id, item: content, line: +m[1] } : { id, item: where, line: null });
    });
  });
  /* everything else at once, against every rule. The file names here are this file's own, so a hit on a
     NAME is not the payload's and is not counted; every other hit counts, even one this cannot place, so
     a change in how scripts/private-terms.js words a hit refuses rather than passes */
  const rest = items.filter(it => !handled.has(it));
  terms().check(unscoped(listText), rest.map((it, i) => ({ file: 's' + i + '.md', text: it.s }))).hits.forEach(h => {
    if (/: a file name carries it: /.test(h)) return;
    const at = h.lastIndexOf(' survives at s'), m = at < 0 ? null : /^ survives at s(\d+)\.md:(\d+)$/.exec(h.slice(at));
    found.push({ id: (/^rule #(\S+)/.exec(h) || [])[1], item: m ? rest[+m[1]] : null, line: m ? +m[2] : null });
  });
  return found;
}

const LIMIT_CHARS = 8 * 1024 * 1024;

/* one call → { ok } or { ok: false, why: [sentences] }. env: { list() → {text}|{why}, pin() → owner|null } */
function decide(name, input, env) {
  const kind = kindOf(name);
  if (kind === 'read') return { ok: true };
  if (kind === 'share') return { ok: false, why: ['sharing a file, or changing who can see one, is the owner\'s to do, on any server; a session never does it'] };
  const items = stringsOf(input);
  if (!items.some(it => !it.key)) return { ok: false, why: ['this write carries no text at all, so nothing in it can be read, and a write that cannot be read is refused'] };
  if (items.reduce((n, it) => n + it.s.length, 0) > LIMIT_CHARS) return { ok: false, why: ['this write is over 8 MB of text, too much to read inside the hook\'s time; split it'] };
  items.filter(it => !it.key).forEach(it => { const d = decoded(it.s); if (d != null) items.push({ at: it.at, s: d, decoded: true }); });
  const addressed = items.filter(it => hasAddress(it.s));
  const hidden = new Set(addressed.filter(it => it.key).map(it => it.s));
  const list = env.list();
  if (!list || typeof list.text !== 'string') {
    const why = addressed.map(it => 'an address that is not a no-reply one, in ' + fieldOf(it, hidden, true));
    why.push(((list && list.why) || 'the owner\'s private list is not loaded') + ', so no connector write can be read for it and every one is refused. ' + HOW_TO_LOAD);
    return { ok: false, why };
  }
  let found = [];
  const mine = privateWrite(name, input, list.text, env.pin);
  if (!mine) found = termHits(items, input, list.text);
  found.forEach(f => { if (f.item && f.item.key) hidden.add(f.item.s); });
  const why = [];
  addressed.forEach(it => why.push('an address that is not a no-reply one, in ' + fieldOf(it, hidden)));
  const seen = new Set();
  found.forEach(f => {
    const s = ruleNo(f.id) + ' of the private list, in ' + (f.item ? fieldOf(f.item, hidden) : 'a field') + (f.line && f.item && /\n/.test(f.item.s) ? ' line ' + f.line : '');
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
  const T = { who: 'Zo' + 'rblax', town: 'Qwerty' + 'ville', attic: 'qwerty' + '-attic', word: 'Plo' + 'ndrel' };
  const at = (u, d) => u + '@' + d;
  const SECRET = 'someone.private', MAILDOM = 'zorb' + '-mail.test', personal = at(SECRET, MAILDOM), noreply = at('noreply', 'anthropic.com');
  const SAID = 'said-only-' + 'here';                 /* a payload word that must never come back in a refusal */
  const RULES = [
    { id: 3, kind: 'partner', rule: 'replace', find: [T.who], to: '[partner]', ci: true },
    { id: 5, kind: 'place', rule: 'replace', find: [T.town], to: '[city]' },
    { id: 7, kind: 'repository', rule: 'replace', find: [T.attic], to: '[the private repository]' },
    { id: 9, kind: 'notes-only', rule: 'replace', find: [T.word], to: '[x]', files: '^docs/' },
  ];
  const LIST = '# a made-up list\n\n```json\n' + JSON.stringify(RULES) + '\n```\n';
  const OWNER = 'plant-owner';
  const NO_LIST = { why: 'the owner\'s private list is not loaded (~/.private-terms/map.md is absent or unreadable)' };
  const env = list => ({ list: () => list || { text: LIST }, pin: () => OWNER });
  const call = (name, input, e) => fromHook(JSON.stringify({ tool_name: name, tool_input: input }), e || env());
  const secrets = [T.who, T.who.toLowerCase(), T.town, T.attic, T.word, SECRET, MAILDOM, SAID];
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

  /* addresses: the same rule as test/authors.js, list or no list, private repository or not */
  expect('a comment holding a personal address is refused, and neither the address nor its domain is printed', call('mcp__github__add_issue_comment', { owner: 'o', repo: 'r', issue_number: 1, body: 'write to ' + personal }), false, /an address that is not a no-reply one, in body/);
  expect('a comment holding a no-reply address passes', call('mcp__github__add_issue_comment', { owner: 'o', repo: 'r', issue_number: 1, body: 'Co-Authored-By: Claude <' + noreply + '>' }), true);
  expect('a personal address in a private repository is still refused', call('mcp__github__add_issue_comment', { owner: OWNER, repo: T.attic, issue_number: 1, body: 'write to ' + personal }), false, /address/);
  expect('a personal address with no list loaded is named too', call('mcp__github__add_issue_comment', { owner: 'o', repo: 'r', issue_number: 1, body: personal }, env(NO_LIST)), false, /address .*in body.*not loaded/);

  /* no list: every write refused, with how to load it; a read still passes (above) */
  expect('with no list, a clean write is refused, saying how to load the list', call('mcp__github__add_issue_comment', { owner: 'o', repo: 'r', issue_number: 1, body: 'plain words' }, env(NO_LIST)), false, /not loaded.*Google Drive with a read-only tool.*delete that file when the session ends/);
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
  expect('a write too large to read in time is refused', call('mcp__x__do_thing', { a: 'x'.repeat(LIMIT_CHARS + 1) }), false, /8 MB/);
  mark(!fromHook('not json', env()).ok, 'a call that is not JSON is refused', 'allowed');
  mark(!fromHook(JSON.stringify({ tool_input: { body: 'x' } }), env()).ok, 'a call that names no tool is refused', 'allowed');

  /* the names: read only by the prefixes and the named reads; everything else is a write */
  const names = [['mcp__github__get_me', 'read'], ['mcp__github__list_issues', 'read'], ['mcp__github__search_issues', 'read'],
    ['mcp__github__issue_read', 'read'], ['mcp__github__pull_request_read', 'read'], ['mcp__Claude_Docs__read', 'read'],
    ['mcp__Claude_Docs__query', 'read'], ['mcp__Claude_Docs__export', 'read'], ['mcp__Google_Drive__download_file_content', 'read'],
    ['mcp__claude_ai_GitHub__get_commit', 'read'], ['mcp__Google_Drive__list_shared_drives', 'read'],
    ['mcp__github__merge_pull_request', 'write'], ['mcp__github__add_issue_comment', 'write'], ['mcp__github__update_pull_request', 'write'],
    ['mcp__github__run_secret_scanning', 'write'], ['mcp__Google_Drive__copy_file', 'write'], ['mcp__Google_Drive__trash_file', 'write'],
    ['mcp__x__getaway', 'write'], ['mcp__x__readme_write', 'write'], ['mcp__x__get_share_link', 'share'], ['mcp__x__update_permissions', 'share']];
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

if (require.main === module) {
  if (process.argv.includes('--selftest')) return void selftest();
  if (process.argv.includes('--hook')) {
    let input = ''; try { input = fs.readFileSync(0, 'utf8'); } catch (e) {}
    let pinned;
    const env = { list: () => loadList(process.env), pin: () => (pinned === undefined ? (pinned = ownerOf(ROOT)) : pinned) };
    let r;
    /* a check that throws refuses: it never says what it could not read, so only the error's kind is printed */
    try { r = fromHook(input, env); }
    catch (e) { r = { ok: false, tool: 'this call', why: ['the check itself failed (' + (e && e.name) + '), and a check that cannot finish refuses'] }; }
    if (r.ok) process.exit(0);
    process.stderr.write('TOOL CALL REFUSED by test/toolguard.js — ' + r.tool + ': ' + r.why.join('; ').replace(/\.?$/, '.') + '\n' +
      'Nothing of the call is printed here: a rule is named by its number and a field by its path. Rephrase it, or write it to the private repository; ' +
      'merging, sharing and changing who can see a file are the owner\'s.\n');
    process.exit(2);
  }
  console.log('usage: node test/toolguard.js --hook | --selftest');
}

module.exports = { kindOf, partsOf, stringsOf, decide, fromHook, loadList, ownerFromUrl, reposOf, NAMED_READS };
