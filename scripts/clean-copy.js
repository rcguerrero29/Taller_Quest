#!/usr/bin/env node
/* THE CLEAN COPY — the public repository, made from the originals by an allowed list and a private map.
   The owner, 2026-09-24: a second, internal document maps what is said word for word, so the copy is
   a duplicate with the mapped terms replaced by program; other personal details are left out where
   they are not needed, or summarised. And 2026-09-25, after the first copy leaked and broke things: keep the
   diaries private, and he approved a split made from an allowed list.

   In order:
   1. ALLOWED LIST (scripts/public-manifest.txt, or the one --manifest names): a tracked file is copied only
      if its path matches a line there. Closed by default: a new file stays private until somebody adds a
      line and says why in the commit. There is no run without a list (2026-09-28: leaving the flag off
      used to copy every file, and only the read-back stopped it).
   2. MAP (--map, read from OUTSIDE the repository; one inside it is refused): each personal detail becomes
      its stand-in ("replace"), or its sentence is taken out and a bracketed note says why it mattered
      ("drop"). Prose is cleaned a PARAGRAPH at a time, so a sentence broken over lines is one sentence.
      In CODE only comments change, never a string and never code, so a game behaves exactly as before
      (scripts/clean-copy-diff.js proves that with a real JavaScript parser).
   3. OVERLAY (public-overlay/): files written for the public copy (its README, its security policy, the
      "why we built it this way" note) are copied in last at the same path, and cleaned like the rest.
   4. READ-BACK: the whole copy is read again, code strings included, and every file name too. A mapped
      detail anywhere is a red, named by rule id and file:line and never by the term; in a name, so is a word of
      the list in any case and without its accents, whole or glued onto other letters or a digit (a file whose name
      holds one as a reader would read it
      is named by its place in git ls-files order and a fingerprint of its path, never by any part of its name, on
      every line this tool prints, the diff check's list included). A detail in a code STRING is red on purpose:
      whether to change what a player sees is a decision, not a find-and-replace.

   No real term is in this file; the self-test makes up its own.

   Run:  node scripts/clean-copy.js --map <file outside the repo> --out <new or empty folder outside the repo>
                                    [--manifest <another allowed list>]      (default: scripts/public-manifest.txt)
         The output folder is emptied first, so it must be new, empty, or an earlier clean copy (it holds
         engine/engine.js and scripts/clean-copy.js); any other folder is refused, never emptied.
         node scripts/clean-copy.js --selftest

   The map is JSON, or markdown holding one ```json block as its only fenced block and its only rule text (beside an
   example above it, or with the list pasted outside the block, only the first ```json block would be read, so such a
   map is refused) — a list of rules:
     {"id":3, "kind":"partner", "rule":"replace", "find":["..."], "to":"[partner]", "ci":true, "suffix":["s"],
      "path":{"old-name":"new-name"}}
     {"id":4, "kind":"health", "rule":"drop", "find":["..."], "with":["..."], "note":"...", "files":"^docs/"}
     {"id":9, "kind":"schedule", "rule":"drop", "pattern":["<regex>"], "files":"^docs/.*\\.md$"}
     {"id":1, "kind":"pet-name", "rule":"keep", "find":["..."]}
   replace: whole words (any alphabet: a letter with an accent counts as part of the word), case as
   written unless "ci"; "suffix" also catches the term followed by one of those endings, and keeps it.
   drop: anywhere, any case; the sentence around it goes. A sentence ends at . ! ? before a space or line
   break, at a table cell's |, or at a blank line. "with" limits a drop to sentences that also hold one of
   those words (any case). "files" limits a rule to paths matching that regex. keep: does nothing; it is
   listed so the map says what was decided.
   A rule carries no key but id kind rule find pattern to ci path files with suffix note, each once and holding its
   own kind of value (ruleFault below; "files" a regular expression, never a glob's star): a key in the wrong case or
   unknown ("CI" for "ci"), written twice, or holding the wrong kind would be ignored or read another way, so the map
   is refused instead, naming the rule by its number. So is a term holding a no-break space or an invisible
   character, and a pattern with its backslashes written twice, either of which matches no ordinary text; a kind
   holding a detail of the list, which is printed; and a "files" limit that matches none of the copy's text files,
   which cleans nothing. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const OVERLAY = 'public-overlay';

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const words = f => esc(f).replace(/ +/g, '\\s+');   // a two-word term is still found across a line break
const W = '\\p{L}\\p{N}_';                            // a word character in any alphabet
/* a whole-word match; a term that starts or ends with a space or a mark is bounded by that, not by a letter */
const wordRe = (body, flags, open = true, shut = true) => new RegExp((open ? '(?<![' + W + '])' : '') + '(?:' + body + ')' + (shut ? '(?![' + W + '])' : ''), flags + 'u');
const isWordEdge = ch => /[\p{L}\p{N}_]/u.test(ch || '');
const inside = (p, root) => { const r = path.relative(root, path.resolve(p)); return r === '' || (!r.startsWith('..') && !path.isAbsolute(r)); };
/* a name as a reader reads it: any case, no accents, and every run of anything but a letter or a digit one
   space ("docs/Brañoville_Trip2.md" reads "docs branoville trip2 md"); a letter Unicode does not take apart reads
   as its plain letters ("Ølstad" reads "olstad", "Großweil" reads "grossweil") */
const BARE = { ß: 'ss', æ: 'ae', œ: 'oe', ø: 'o', ł: 'l', đ: 'd', ð: 'd', ħ: 'h', ı: 'i', þ: 'th' };
const fold = s => String(s).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[ßæœøłđðħıþ]/g, c => BARE[c]).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const glue = s => fold(s).replace(/ /g, '');
/* a file's text, or null for a picture. UTF-16 text has a 0 in every other byte and is text all the same: when it starts
   with a UTF-16 mark (what Windows PowerShell 5.1's > writes), and when it has none (what Python's utf-16-le writes)
   but, in its first 8000 bytes, more than 90% of the bytes on one side are 0 and fewer than 5% on the other. wide()
   says which: 'le' or 'be' after a mark, 'le-' or 'be-' without one, '' for anything else. Anything else with a 0 in its
   first 8000 bytes is a picture (UTF-16 with no mark in a script whose letters are not one byte wide is one too: a
   limit of this reading; the private-term check reads what git stores, beside it) */
function wide(b) {
  if (b.length > 1 && b[0] === 0xff && b[1] === 0xfe) return 'le';
  if (b.length > 1 && b[0] === 0xfe && b[1] === 0xff) return 'be';
  const head = b.subarray(0, 8000), half = head.length >> 1;
  if (!half || !head.includes(0)) return '';
  let even = 0, odd = 0;
  for (let i = 0; i + 1 < head.length; i += 2) { if (head[i] === 0) even++; if (head[i + 1] === 0) odd++; }
  return odd > 0.9 * half && even < 0.05 * half ? 'le-' : even > 0.9 * half && odd < 0.05 * half ? 'be-' : '';
}
const utf16 = b => !!wide(b);
const textOf = b => {
  const w = wide(b);
  if (!w) return b.subarray(0, 8000).includes(0) ? null : b.toString('utf8');
  const body = b.subarray(w.endsWith('-') ? 0 : 2), even = body.subarray(0, body.length - (body.length % 2));
  return w.startsWith('le') ? even.toString('utf16le') : Buffer.from(even).swap16().toString('utf16le');
};
/* a file's fingerprint: the first 8 hex digits of the sha256 of its path. Its place in git ls-files order is
   right only on the tree that was read (a pull request is read as its merge, where another file can come
   before it); the fingerprint is the same on any tree. FIND_HINT says how to turn it back into a name, from any
   folder of the clone: "--full-name :/" lists every tracked file by its path from the top, wherever it is run
   (plain git ls-files lists only the folder it is run in, by paths relative to it, and finds nothing). */
const fingerprint = p => crypto.createHash('sha256').update(p, 'utf8').digest('hex').slice(0, 8);
const FIND = String.raw`git ls-files -z --full-name :/ | node -e "require('fs').readFileSync(0,'utf8').split('\0').filter(Boolean).forEach(f=>console.log(require('crypto').createHash('sha256').update(f).digest('hex').slice(0,8),f))" | grep '^<fingerprint> '`;
const FIND_HINT = 'A file named by its place and fingerprint: the place is its line in git ls-files on the tree this run read (a pull request is read as its merge, so on your own branch the place can be off); the fingerprint, the first 8 hex digits of the sha256 of its path, is the same on any tree. Run anywhere in your own clone, this prints its name (put the fingerprint in place of <fingerprint>):\n  '
  + FIND + '\nNever paste that name into an issue or a log.';

/* how a file is cleaned: prose a paragraph at a time; code in its comments only; anything else not at all
   (it is still read back, so a detail in it is a red, not a pass) */
const kindOf = f => /\.(md|markdown)$/i.test(f) ? 'prose'
  : /\.(js|mjs|cjs)$/i.test(f) ? 'js' : /\.css$/i.test(f) ? 'css' : /\.html?$/i.test(f) ? 'html'
  : /\.(ya?ml|sh)$/i.test(f) ? 'hash' : 'data';

/* THE KEYS a rule may carry, each with the kind of value it must hold. A key this tool does not know ("CI" for
   "ci") is ignored, and a known one holding the wrong kind is read another way (a "suffix" of "s" instead of ["s"]
   is skipped, a "files" of true limits the rule to paths holding "true"): either way the rule quietly checks less
   than it says. ruleFault names what is wrong by the key, never by what the key holds, and the private-term
   check reads every rule with it too. */
const isTerms = v => Array.isArray(v) && v.every(s => typeof s === 'string' && s.trim() !== '');
const isText = v => typeof v === 'string';
const RULE_KEYS = {
  id: Number.isInteger, kind: isText, rule: isText, find: isTerms, pattern: isTerms, to: isText, ci: v => typeof v === 'boolean',
  path: v => !!v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).every(s => typeof s === 'string' && s.trim() !== ''),
  /* a regular expression, never a glob: "engine/*.js" read as one matches "engine" and a run of no slashes, and
     "engine/engine*.js" matches "engin", any number of e, any character and "js", so each looks in the one file that
     happens to match and passes the rest; a folder's star, and a star right after a letter, a digit, _ or - that is
     not escaped, is refused ("\\d*", ".*" and "[a-z]*" are a regular expression's, and still read) */
  files: v => { if (typeof v !== 'string' || v.trim() === '' || /\/\*/.test(v) || /(?:^|[^\\])[\p{L}\p{N}_-]\*/u.test(v)) return false; try { new RegExp(v); return true; } catch (e) { return false; } },
  with: isTerms, suffix: isTerms, note: isText,
};
const ruleName = (r, i) => r && Number.isInteger(r.id) ? 'rule #' + r.id : 'rule number ' + (i + 1) + ' in the list';
function ruleFault(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return 'is not a rule (a rule is an object of keys)';
  const keys = Object.keys(r);
  const unknown = keys.filter(k => !Object.prototype.hasOwnProperty.call(RULE_KEYS, k)).length;
  if (unknown) return 'has ' + unknown + ' key(s) this tool does not know, so they would be ignored (a name misspelt or in the wrong case; the keys are ' + Object.keys(RULE_KEYS).join(' ') + ')';
  const wrong = keys.filter(k => !RULE_KEYS[k](r[k]));
  if (wrong.length) return 'has ' + wrong.join(', ') + ' holding the wrong kind of value (id is a whole number; kind, rule, to and note are text; find, pattern, with and suffix are lists of words; ci is true or false; path is an object of new names; files is a regular expression, not a glob, so never /* or a star right after a letter)';
  /* a term holding a no-break space (pasted from a word processor), an invisible character (a zero-width space, a soft
     hyphen) or a control character (a tab) matches only text holding the same one: it would be counted as a rule that
     looks for something, and find nothing in ordinary text */
  const unseen = ['find', 'pattern', 'with', 'suffix'].filter(k => Array.isArray(r[k]) && r[k].some(t => /(?! )[\p{Zs}\p{Cf}\p{Cc}]/u.test(t)));
  if (unseen.length) return 'has ' + unseen.join(', ') + ' holding a no-break space, an invisible character or a tab, which matches only text holding the same one';
  /* a pattern copied out of a JavaScript string into JSON keeps its backslashes doubled: "\\\\d" is a backslash and a d,
     never a digit, so the rule looks for a backslash that ordinary text never holds */
  if (Array.isArray(r.pattern) && r.pattern.some(p => /\\\\[bBdDsSwW]/.test(p))) return 'has pattern holding a backslash written twice before a letter (as a JavaScript string writes it), which looks for a backslash in the text, never a word edge, a digit, a space or a letter';
  return '';
}

/* THE LIST a map holds: its ```json block, or the whole file when it is JSON (the check's secret). The list is the
   map's ONLY fenced block and its only rule text: beside another block (an example above it, or the list itself in
   ~~~json), or with a rule outside the block (the list pasted as plain lines, or indented four spaces, under a fenced
   example), the first ```json block would be read in the list's place, so null is returned and the map is refused */
function listText(src) {
  const s = String(src), m = s.match(/```json\s*\n([\s\S]*?)```/);
  if (m && ((s.match(/```|~~~/g) || []).length > 2 || /"rule"\s*:/.test(s.slice(0, m.index) + s.slice(m.index + m[0].length)))) return null;
  return m ? m[1] : s;
}
/* the place in the list of the first rule that writes a key twice in one object, or -1. JSON keeps the last and
   drops the first without a word ("ci":true, ... "ci":false reads false). Read only from text that has parsed. */
function dupKeyAt(json) {
  const s = String(json), open = [];
  let at = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      let j = i + 1; while (j < s.length && s[j] !== '"') j += s[j] === '\\' ? 2 : 1;
      let k = j + 1; while (/\s/.test(s[k] || '')) k++;
      const keys = open[open.length - 1];
      if (keys && s[k] === ':') { const key = JSON.parse(s.slice(i, j + 1)); if (keys.has(key)) return at; keys.add(key); }
      i = j;
    } else if (c === '{') open.push(new Set());
    else if (c === '[') open.push(null);
    else if (c === '}' || c === ']') open.pop();
    else if (c === ',' && open.length === 1) at++;
  }
  return -1;
}

function readMap(file) {
  const src = fs.readFileSync(file, 'utf8');
  const list = listText(src);
  if (list === null) throw new Error('the map holds a fenced block beside its ```json list (an example, or a second list), or rule text outside it, and only the first ```json block would be read: keep the list as its only block and its only rules');
  const rules = JSON.parse(list);
  if (!Array.isArray(rules) || !rules.length) throw new Error('the map holds no rules');
  const twice = dupKeyAt(list);
  if (twice >= 0) throw new Error(ruleName(rules[twice], twice) + ' has a key written twice, and only the last would be read');
  rules.forEach((r, i) => {
    const fault = ruleFault(r);
    if (fault) throw new Error(ruleName(r, i) + ' ' + fault);
    if (!['keep', 'replace', 'drop'].includes(r.rule)) throw new Error(ruleName(r, i) + ' has no known rule (keep, replace, drop)');
    if (r.rule === 'replace' && (!(Array.isArray(r.find) || Array.isArray(r.pattern)) || typeof r.to !== 'string')) throw new Error('replace ' + ruleName(r, i) + ' needs find[] or pattern[], and to');
    if (r.rule === 'drop' && !(Array.isArray(r.find) || Array.isArray(r.pattern))) throw new Error('drop ' + ruleName(r, i) + ' needs find[] or pattern[]');
  });
  return rules;
}

function readManifest(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n').map(l => l.trim()).filter(l => l && l[0] !== '#');
  if (!lines.length) throw new Error('the allowed list is empty: nothing would be published, which is a red, not a pass');
  return lines.map(l => new RegExp(l));
}

const filesRe = r => r.files ? new RegExp(r.files) : null;
const withRe = r => Array.isArray(r.with) && r.with.length ? wordRe(r.with.map(words).join('|'), 'i') : null;
const replaceRe = (r, f, flags) => {
  const suf = Array.isArray(r.suffix) && r.suffix.length ? '(' + r.suffix.map(esc).join('|') + ')?' : '()';
  return wordRe('(' + words(f) + ')' + suf, flags + (r.ci ? 'i' : ''), isWordEdge(f[0]), isWordEdge(f[f.length - 1]));
};
/* a replace rule may also carry "pattern": regular expressions whose every match becomes the stand-in, which
   may keep a group of the match as $1..$9 ("(\\d{4}-\\d{2}-\\d{2}),? night" to "$1" keeps the date, drops the hour) */
const patternRe = (r, p, flags) => new RegExp(p, flags + (r.ci ? 'i' : ''));
const dropRes = r => (r.find || []).map(f => new RegExp(words(f), 'i')).concat((r.pattern || []).map(p => new RegExp(p, 'i')));

/* an error this tool wrote, which names rules by number and quotes nothing: the check may print it as it is */
const plainError = m => Object.assign(new Error(m), { plain: true });

/* compile once: longest spelling first, so "for-x" is replaced before "x" */
function compile(rules) {
  const reps = [], drops = [];
  rules.forEach(r => {
    if (r.rule === 'replace') {
      (r.find || []).forEach(f => {
        /* a folder or file name the map renames gets its new name, not the stand-in; a possessive keeps its 's */
        const to = (r.path && r.path[f]) || (/'s$/.test(f) && !/'s$/.test(r.to) ? r.to + "'s" : r.to);
        reps.push({ r, f, to, files: filesRe(r), re: replaceRe(r, f, 'g'), keepSuffix: true });
      });
      (r.pattern || []).forEach(p => reps.push({ r, f: p, to: r.to, files: filesRe(r), re: patternRe(r, p, 'g') }));
    }
    if (r.rule === 'drop') dropRes(r).forEach(re => drops.push({ r, re, with: withRe(r), files: filesRe(r) }));
  });
  /* a note that holds its own drop term would be dropped again forever: refuse the map instead */
  rules.filter(r => r.note && r.rule === 'drop').forEach(r => drops.forEach(d => {
    if (d.re.test(r.note)) throw plainError('rule #' + r.id + '\'s note holds a term rule #' + d.r.id + ' drops');
  }));
  /* a rule's kind is printed on every line about its rule, by the check and by the copy: a kind that holds a detail
     of the list, read the way a name is read, would print it, so the map is refused instead */
  const sees = seenIn(rules, checksOf(rules));
  rules.forEach((r, i) => {
    if (typeof r.kind === 'string' && sees(r.kind)) throw plainError(ruleName(r, i) + '\'s kind holds a private detail of the list, as a reader reads it, and a kind is printed on every line about its rule');
  });
  reps.sort((a, b) => b.f.length - a.f.length);
  return { reps, drops };
}

/* the sentence around index i: bounded by . ! ? before whitespace, by a table cell's |, by a blank line,
   and by the text's own ends. Marks that close a sentence after its stop (bold, italics, a quote, a bracket,
   a backtick) belong to the sentence they close: "**Done.** Next" ends after the second *. */
const CLOSER = /[*_"'\u201d\u2019)\]`]/;
function sentenceSpan(text, i) {
  let a = i;
  while (a > 0) {
    const c = text[a - 1];
    if (c === '|' || (c === '\n' && text[a - 2] === '\n')) break;
    if (/\s/.test(text[a] || ' ')) { let j = a - 1; while (j > 0 && CLOSER.test(text[j])) j--; if (/[.!?]/.test(text[j])) break; }
    a--;
  }
  while (a < i && /\s/.test(text[a])) a++;
  let b = i;
  while (b < text.length) {
    const c = text[b];
    if (c === '|' || (c === '\n' && text[b + 1] === '\n')) break;
    if (/[.!?]/.test(c)) { let j = b + 1; while (j < text.length && CLOSER.test(text[j])) j++; if (j >= text.length || /\s/.test(text[j])) { b = j; break; } }
    b++;
  }
  return [a, b];
}

/* clean one unit of prose: a paragraph, a table row, the inside of a comment */
function cleanProse(text, C, tally) {
  for (let guard = 0; guard < 500; guard++) {
    let hit = null, a = 0, b = 0;
    for (const d of C.drops) {
      const re = new RegExp(d.re.source, 'gi');
      let m;
      while ((m = re.exec(text))) {
        const [x, y] = sentenceSpan(text, m.index);
        if (!d.with || d.with.test(text.slice(x, y))) { hit = d; a = x; b = y; break; }
        if (m[0] === '') re.lastIndex++;
      }
      if (hit) break;
    }
    if (!hit) break;
    const before = text.slice(0, a);
    let after = text.slice(b), mid = hit.r.note ? '[' + hit.r.note.replace(/[[\]]/g, '') + ']' : '';
    if (mid) { if (before && !/\s$/.test(before)) mid = ' ' + mid; if (after && !/^\s/.test(after)) mid += ' '; }
    else if (!before || /\s$/.test(before)) after = after.replace(/^[ \t]+/, '');
    text = before + mid + after;
    tally(hit.r, 'dropped');
  }
  C.reps.forEach(x => {
    text = text.replace(x.re, (...m) => {
      tally(x.r, 'replaced');
      if (x.keepSuffix) return x.to + (typeof m[2] === 'string' ? m[2] : '');
      /* a pattern's stand-in may keep a part of what it matched: "$1" is the first group */
      const groups = m.slice(1, m.findIndex(v => typeof v === 'number'));
      return x.to.replace(/\$(\d)/g, (s, n) => typeof groups[n - 1] === 'string' ? groups[n - 1] : '');
    });
    /* a stand-in read as a word: "a [partner]" becomes "a [partner]" when the word inside starts with a consonant */
    if (/^\[[b-df-hj-np-tv-z]/i.test(x.to)) text = text.replace(new RegExp('\\b([Aa])n(\\s+)' + esc(x.to), 'g'), '$1$2' + x.to);
  });
  return text;
}

/* a run of lines that each carry a prefix (a quote's >, a comment's #): cleaned as one unit, re-prefixed */
function cleanRun(lines, prefixRe, C, tally) {
  const pre = lines.map(l => (l.match(prefixRe) || [''])[0]);
  const out = cleanProse(lines.map((l, i) => l.slice(pre[i].length)).join('\n'), C, tally).split('\n');
  return out.map((l, j) => pre[Math.min(j, pre.length - 1)] + l);
}

/* PROSE (markdown): a paragraph runs to a blank line or to a line that starts a new block. A heading, a
   rule, a table row and a line inside a code fence are units of their own; a list item keeps its marker; a
   quote's lines are one unit; front matter at the top is cleaned a line at a time so its keys survive. */
const MARKER = /^\s*(?:[-*+]|\d+[.)]|#{1,6})\s+/;
function cleanMarkdown(text, C, tally) {
  const lines = text.split('\n'), out = [];
  let para = [], quote = [], fence = false, i = 0;
  const flushPara = () => {
    if (!para.length) return;
    const pre = (para[0].match(MARKER) || [''])[0];
    out.push(...(pre + cleanProse(para.join('\n').slice(pre.length), C, tally)).split('\n'));
    para = [];
  };
  const flushQuote = () => { if (quote.length) { out.push(...cleanRun(quote, /^\s*>\s?/, C, tally)); quote = []; } };
  if (lines[0] === '---') {
    const end = lines.indexOf('---', 1);
    if (end > 0) { for (; i <= end; i++) out.push(cleanProse(lines[i], C, tally)); }
  }
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) { flushPara(); flushQuote(); fence = !fence; out.push(line); continue; }
    if (fence) { out.push(cleanProse(line, C, tally)); continue; }
    if (/^\s*>/.test(line)) { flushPara(); quote.push(line); continue; }
    flushQuote();
    if (!line.trim()) { flushPara(); out.push(line); continue; }
    if (/^\s*#{1,6}\s/.test(line) || /^\s*\|/.test(line) || /^\s*([-*_]\s*){3,}$/.test(line)) {
      flushPara();
      const pre = (line.match(MARKER) || [''])[0];
      out.push(pre + cleanProse(line.slice(pre.length), C, tally));
      continue;
    }
    if (MARKER.test(line)) flushPara();
    para.push(line);
  }
  flushPara(); flushQuote();
  return out.join('\n');
}

/* CODE: split into comment and non-comment pieces. JavaScript strings, template literals and regular
   expressions are stepped over so a // or /* inside them is never taken for a comment. */
const KEYWORDS_BEFORE_REGEX = /(?:^|[^\w$])(?:return|typeof|case|do|else|in|of|new|delete|void|throw|instanceof|yield|await)$/;
function jsPieces(text) {
  const P = [];
  let i = 0, from = 0, last = '';
  const push = (a, b, comment) => { if (b > a) P.push({ t: text.slice(a, b), comment }); };
  const skipString = (j) => {
    const q = text[j]; j++;
    while (j < text.length) {
      const c = text[j];
      if (c === '\\') { j += 2; continue; }
      if (q === '`' && c === '$' && text[j + 1] === '{') {
        let depth = 1; j += 2;
        while (j < text.length && depth) {
          const d = text[j];
          if (d === '"' || d === "'" || d === '`') { j = skipString(j); continue; }
          if (d === '{') depth++; else if (d === '}') depth--;
          j++;
        }
        continue;
      }
      if (c === q) return j + 1;
      if (c === '\n' && q !== '`') return j;
      j++;
    }
    return j;
  };
  const regexHere = (j) => {
    if (last === '' || /[(,=:[!&|?{};+\-*%<>~^]/.test(last)) return true;
    if (/[\w$]/.test(last)) return KEYWORDS_BEFORE_REGEX.test(text.slice(Math.max(0, j - 12), j).replace(/\s+$/, ''));
    return false;
  };
  const skipRegex = (j) => {
    let k = j + 1, cls = false;
    while (k < text.length) {
      const c = text[k];
      if (c === '\n') return j + 1;           // not a regular expression after all: a division
      if (c === '\\') { k += 2; continue; }
      if (c === '[') cls = true; else if (c === ']') cls = false;
      else if (c === '/' && !cls) { k++; while (/[a-z]/i.test(text[k] || '')) k++; return k; }
      k++;
    }
    return j + 1;
  };
  while (i < text.length) {
    const c = text[i], n = text[i + 1];
    if (c === '/' && n === '/') { push(from, i, false); let j = text.indexOf('\n', i); if (j < 0) j = text.length; push(i, j, true); i = from = j; continue; }
    if (c === '/' && n === '*') { push(from, i, false); let j = text.indexOf('*/', i + 2); j = j < 0 ? text.length : j + 2; push(i, j, true); i = from = j; continue; }
    if (c === '"' || c === "'" || c === '`') { i = skipString(i); last = 'a'; continue; }
    if (c === '/' && regexHere(i)) { i = skipRegex(i); last = 'a'; continue; }
    if (!/\s/.test(c)) last = c;
    i++;
  }
  push(from, text.length, false);
  return P;
}
function blockPieces(text, open, close) {
  const P = []; let last = 0, i;
  while ((i = text.indexOf(open, last)) >= 0) {
    let j = text.indexOf(close, i + open.length); j = j < 0 ? text.length : j + close.length;
    if (i > last) P.push({ t: text.slice(last, i), comment: false });
    P.push({ t: text.slice(i, j), comment: true }); last = j;
  }
  if (last < text.length) P.push({ t: text.slice(last), comment: false });
  return P;
}
/* A page: its <!-- --> notes, and the CSS notes inside its <style> blocks (2026-09-28: a note there described a
   private tool, and the page's style block was read as code the copy never changes). A <script> block stays code. */
const STYLE = /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi;
function htmlPieces(text) {
  const P = []; let last = 0, m;
  STYLE.lastIndex = 0;
  while ((m = STYLE.exec(text))) {
    const s = m.index + m[1].length, e = s + m[2].length;
    P.push(...blockPieces(text.slice(last, s), '<!--', '-->'), ...blockPieces(text.slice(s, e), '/*', '*/'));
    last = e;
  }
  P.push(...blockPieces(text.slice(last), '<!--', '-->'));
  return P;
}
const codePieces = (text, kind) => kind === 'js' ? jsPieces(text) : kind === 'css' ? blockPieces(text, '/*', '*/') : kind === 'html' ? htmlPieces(text) : blockPieces(text, '<!--', '-->');

function cleanComment(t, C, tally) {
  const open = t.startsWith('<!--') ? '<!--' : t.startsWith('/**') ? '/**' : '/*';
  const close = open === '<!--' ? '-->' : '*/';
  const shut = t.endsWith(close) && t.length >= open.length + close.length;
  return open + cleanProse(t.slice(open.length, shut ? t.length - close.length : t.length), C, tally) + (shut ? close : '');
}
function cleanCode(text, kind, C, tally) {
  if (kind === 'hash') {
    /* YAML and shell: only whole comment lines, each run of them as one unit; a trailing # is left alone */
    const lines = text.split('\n'), out = [];
    for (let i = 0; i < lines.length;) {
      if (/^\s*#(?!!)/.test(lines[i])) { const run = []; while (i < lines.length && /^\s*#(?!!)/.test(lines[i])) run.push(lines[i++]); out.push(...cleanRun(run, /^\s*#/, C, tally)); }
      else out.push(lines[i++]);
    }
    return out.join('\n');
  }
  const P = codePieces(text, kind), out = [];
  for (let k = 0; k < P.length; k++) {
    const p = P[k];
    if (!p.comment) { out.push(p.t); continue; }
    if (!p.t.startsWith('//')) { out.push(cleanComment(p.t, C, tally)); continue; }
    /* a run of // lines is one unit, so a sentence wrapped over them goes whole */
    const run = [p.t], seps = [];
    while (k + 2 < P.length && !P[k + 1].comment && /^\n[ \t]*$/.test(P[k + 1].t) && P[k + 2].comment && P[k + 2].t.startsWith('//')) { seps.push(P[k + 1].t); run.push(P[k + 2].t); k += 2; }
    const cleaned = cleanProse(run.map(t => t.slice(2)).join('\n'), C, tally).split('\n');
    out.push(cleaned.map((l, j) => (j ? seps[j - 1] : '') + '//' + l).join(''));
  }
  return out.join('');
}

function cleanText(text, file, C0, tally) {
  const C = { reps: C0.reps.filter(x => !x.files || x.files.test(file)), drops: C0.drops.filter(x => !x.files || x.files.test(file)) };
  if (!C.reps.length && !C.drops.length) return text;
  const kind = kindOf(file);
  return kind === 'prose' ? cleanMarkdown(text, C, tally) : kind === 'data' ? text : cleanCode(text, kind, C, tally);
}

function renamePath(rel, rules) {
  let out = rel;
  rules.filter(r => r.path).forEach(r => Object.entries(r.path).forEach(([from, to]) => {
    out = out.split('/').map(seg => seg === from ? to : seg).join('/');
  }));
  return out;
}

/* every replace and drop term and pattern, and every folder name the map renames, as the check the read-back runs */
function checksOf(rules) {
  const checks = [];
  rules.forEach(r => {
    if (r.rule === 'replace') {
      (r.find || []).forEach(f => { if (!(r.path && r.path[f])) checks.push({ r, re: replaceRe(r, f, ''), files: filesRe(r) }); });
      (r.pattern || []).forEach(p => checks.push({ r, re: patternRe(r, p, ''), files: filesRe(r) }));
    }
    if (r.rule === 'drop') dropRes(r).forEach(re => checks.push({ r, re, with: withRe(r), files: filesRe(r) }));
    if (r.path) Object.keys(r.path).forEach(k => checks.push({ r, re: new RegExp('(?<![A-Za-z0-9_])' + esc(k) + '(?![A-Za-z0-9_])', r.ci ? 'i' : '') }));
  });
  return checks;
}

/* whether a name (or a rule's kind, which is printed too) holds a private detail the way a reader reads it, not
   only by a rule's own match: every replace and drop word and every folder name the map renames, folded and with
   every space and apostrophe taken out, anywhere in the name read the same way (so a digit or another word glued on
   still holds it, and so does a term of two words, or with an apostrophe, written as one), and so does anything
   else given (what the checks found in the text: a pattern's match, glued); and every check again in any case (a
   pattern too) in each folder and file name, read with - _ . as spaces and with a word broken where a capital or a
   digit starts ("OakHollow2" reads "Oak Hollow 2"). found: folded, as fold() leaves them.
   strict, where a name is a red for it (survivors): a word of the list glued onto other letters or a digit inside the
   name's words, its own spaces and apostrophes written or left out, or written as whole words of the name in a row
   ("oak-hollow" for "Oakhollow"); never one made by chance across a separator of the name, out of the end of one of
   its words and the start of the next, which gluing the whole name together finds: that hides the name (a harmless
   excess) but is no word a reader reads. Every check in any case is the same in both readings */
const nearRe = t => new RegExp(esc(t).replace(/ /g, ' ?'));
const wholeRun = (words, g) => words.some((w, i) => { let s = ''; for (let j = i; j < words.length && s.length < g.length; j++) { s += words[j]; if (s === g) return true; } return false; });
function seenIn(rules, checks) {
  const terms = rules.filter(r => r.rule === 'replace' || r.rule === 'drop').flatMap(r => Array.isArray(r.find) ? r.find : [])
    .concat(rules.flatMap(r => r.path && typeof r.path === 'object' ? Object.keys(r.path) : [])).filter(t => typeof t === 'string').map(fold).filter(Boolean);
  const plain = terms.map(t => t.replace(/ /g, '')), near = terms.map(nearRe), nearOf = new Map();
  const anyCase = checks.map(c => new RegExp(c.re.source, c.re.flags.replace(/[gi]/g, '') + 'i'));
  const views = seg => { const sp = seg.replace(/[-_.]+/g, ' '); return [seg, sp, sp.replace(/\p{Ll}(?=\p{Lu})|\p{L}(?=\p{N})|\p{N}(?=\p{L})/gu, '$& ')]; };
  return (name, found = [], strict = false) => {
    const segs = String(name).split('/');
    if (anyCase.some(re => segs.some(seg => views(seg).some(v => re.test(v))))) return true;
    if (!strict) { const flat = glue(name); return plain.some(t => flat.includes(t)) || found.some(t => flat.includes(t.replace(/ /g, ''))); }
    const folded = fold(name), words = folded.split(' '), re = t => { if (!nearOf.has(t)) nearOf.set(t, nearRe(t)); return nearOf.get(t); };
    return near.some(x => x.test(folded)) || found.some(t => re(t).test(folded)) || plain.concat(found.map(t => t.replace(/ /g, ''))).some(g => wholeRun(words, g));
  };
}

/* the read-back: every replace and drop term and pattern, anywhere in the copy (code strings included)
   and in every file name — reported as rule id + kind + file:line, never the term.
   bare (the private-term check, whose lines land on a public log): every file is named by its place and fingerprint
   and every rule by its number alone, so no line holds anything read from a name or a kind, however it is spelt.
   An entry may also carry: label, where it is when it is not a file of the tree read (a commit's message, which has no
   file and no name; a file as a commit left it), said in place of its place; lines, the only line numbers whose
   matches count (the lines a commit added: a line it kept was read where it was added); and nameRead: false, for a
   name that is not new there. The list returned carries masked: each file whose name is not printed, by the path
   its fingerprint is taken from, so no other line about the copy prints it either */
function survivors(files, rules, bare = false) {
  const checks = checksOf(rules);
  /* first every match in every file's text, so what a pattern found anywhere is known before any name is printed */
  const found = files.map(({ file, text, lines }) => {
    const H = [];
    if (text == null) return H;
    checks.forEach(c => {
      /* a "files" limit names paths, and a commit's message is not one */
      if (c.files && (file == null || !c.files.test(file))) return;
      const g = new RegExp(c.re.source, c.re.flags.replace('g', '') + 'g');
      let m;
      while ((m = g.exec(text))) {
        if (m[0] === '') { g.lastIndex++; continue; }
        if (c.with) { const [x, y] = sentenceSpan(text, m.index); if (!c.with.test(text.slice(x, y))) continue; }
        const line = text.slice(0, m.index).split('\n').length, last = line + m[0].split('\n').length - 1;
        if (lines) { let added = false; for (let k = line; k <= last && !added; k++) added = lines.has(k); if (!added) continue; }
        H.push({ c, m: m[0], line });
      }
    });
    return H;
  });
  const sees = seenIn(rules, checks), matched = [...new Set(found.flat().map(h => fold(h.m)).filter(Boolean))];
  /* a name holds a word of the list the way a reader reads it: in any case, without its accents, with anything but a
     letter or a digit as a space, and the word whole (a place's name in lower case in "docs/<place>-moving-day.md").
     Whole words only, for the rule it names: a word glued onto other letters or a digit is found below, as a name the
     reading hides, and is a red there too */
  const readerWords = rules.filter(r => r && (r.rule === 'replace' || r.rule === 'drop')).flatMap(r => (Array.isArray(r.find) ? r.find : []).map(t => ({ r, t: fold(t) })))
    .filter(x => x.t).map(x => ({ r: x.r, re: new RegExp('(?:^| )' + esc(x.t) + '(?: |$)') }));
  const P = [];
  P.masked = new Map();
  files.forEach((e, i) => {
    const { file, n, from, label } = e;
    /* a file name: each folder and file name read with - _ . as spaces; a rule's "files" scope does not
       apply here, because a name is published whatever the rule was written for. A rule's own match is a red, and
       so, where no rule's own match is, is a word of the list whole as a reader reads it (readerWords). A name that
       holds ANY rule's detail as a reader would read it (seenIn), or anything a check found in any file's text, is
       never printed, not even in part and not on the lines about its text: every line about that file names it by
       its place in git ls-files order (n, or its place in the list given) and the fingerprint of its path (from:
       the original a copied file was made from), which FIND_HINT turns back into its name */
    const read = file != null && e.nameRead !== false, segs = read ? file.split('/') : [];
    let named = checks.filter(c => segs.some(seg => c.re.test(seg) || c.re.test(seg.replace(/[-_.]+/g, ' '))));
    if (read && !named.length) named = readerWords.filter(x => x.re.test(fold(file))).slice(0, 1);
    const hidden = file != null && (named.length > 0 || sees(file, matched));
    if (hidden && !label) P.masked.set(file, from || file);
    const place = label || 'file ' + (n || i + 1) + ' in git ls-files order, fingerprint ' + fingerprint(from || file);
    const where = bare ? place + (file != null ? ' (no name is printed on a public log)' : '') : label ? place : hidden ? place + ' (its name holds a private detail, so it is not printed)' : null;
    const rule = c => 'rule #' + c.r.id + (bare ? '' : ' (' + c.r.kind + ')');
    named.forEach(c => P.push(rule(c) + ': a file name carries it: ' + where));
    /* a name the reading above hides, where no rule's own match and no whole word named it and nothing in its text, is
       a red by seenIn's strict reading: a word of the list glued straight onto other letters or a digit inside one of
       the name's words ("<place>map.png", "<place>2.png"), what a check finds in it in any case, or what a check found
       in any text. Only a word made by chance across a separator of the name, out of the end of one word and the start
       of the next, is hidden and not a red. A short word of the list inside a longer one ("ab" in "tabs") is a red
       too: rename the file, or make the word in the list longer */
    if (read && hidden && !named.length && !found[i].length && sees(file, matched, true)) P.push('a file name holds a private detail: ' + where);
    found[i].forEach(({ c, line }) => P.push(rule(c) + ' survives at ' + (where ? 'line ' + line + ' of ' + where : file + ':' + line)
      + (bare || label || kindOf(file) === 'prose' ? '' : ' (' + (kindOf(file) === 'data' ? 'a data file, never rewritten' : 'in code: a string or code is never rewritten') + '; decide it)')));
  });
  return P;
}

/* a rule limited by "files" looks only in the text of the paths that limit matches: one that matches none of the
   files whose text was read (written wrong, or matching only pictures) cleans nothing and looks for its words
   nowhere. The check and the copy refuse it by this one reading, each in its own words; '' when no rule does */
function scopeFault(rules, files, where, so) {
  const texts = files.filter(f => f.text != null);
  const i = rules.findIndex(r => r.rule !== 'keep' && r.files !== undefined && !texts.some(f => new RegExp(r.files).test(f.file)));
  return i < 0 ? '' : ruleName(rules[i], i) + ' is limited by "files" to paths that match none of the ' + texts.length + ' ' + where + ', so ' + so;
}

/* root: the repository the copy is made from; only the self-test names another one, a repository it makes itself */
function run(mapFile, outDir, manifestFile, root = ROOT) {
  if (!mapFile || !outDir) throw new Error('usage: --map <file outside the repo> --out <folder outside the repo> [--manifest <file>]');
  if (inside(mapFile, root)) throw new Error('the map is inside the repository: it must never be, not even untracked');
  if (inside(outDir, root)) throw new Error('the output folder is inside the repository: put it outside');
  /* the folder is emptied below, so only a new one, an empty one, or an earlier copy may be named */
  if (inside(root, outDir)) throw new Error('the output folder holds this repository: emptying it would delete the originals');
  if (fs.existsSync(outDir)) {
    const st = fs.statSync(outDir);
    const earlier = st.isDirectory() && fs.existsSync(path.join(outDir, 'engine', 'engine.js')) && fs.existsSync(path.join(outDir, 'scripts', 'clean-copy.js'));
    if (!st.isDirectory() || (fs.readdirSync(outDir).length && !earlier)) throw new Error('the output folder is not empty and is not an earlier clean copy, so it is not emptied: name a new folder');
  }
  const rules = readMap(mapFile);
  const allow = readManifest(manifestFile || path.join(root, 'scripts', 'public-manifest.txt'));
  const C = compile(rules);
  const counts = {};
  const tally = (r, what) => { const k = '#' + r.id + ' ' + r.kind + ' ' + what; counts[k] = (counts[k] || 0) + 1; };
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean);
  const overlay = tracked.filter(f => f.startsWith(OVERLAY + '/'));
  const list = tracked.filter(f => !f.startsWith(OVERLAY + '/') && allow.some(re => re.test(f)));
  const unused = allow.filter(re => !tracked.some(f => re.test(f))).map(re => re.source);
  fs.rmSync(outDir, { recursive: true, force: true });
  const written = new Map();
  let binaries = 0, changed = 0;
  const put = (rel, dest) => {
    let buf; try { buf = fs.readFileSync(path.join(root, rel)); } catch (e) { return; }
    fs.mkdirSync(path.dirname(path.join(outDir, dest)), { recursive: true });
    /* a picture, and text in UTF-16, are copied byte for byte and never rewritten; what the UTF-16 says is still read back */
    const src = textOf(buf);
    if (src === null || utf16(buf)) { fs.writeFileSync(path.join(outDir, dest), buf); if (src === null) binaries++; written.set(dest, { from: rel, text: src }); return; }
    const out = cleanText(src, dest, C, tally);
    if (out !== src || dest !== rel) changed++;
    fs.writeFileSync(path.join(outDir, dest), out);
    try { fs.chmodSync(path.join(outDir, dest), fs.statSync(path.join(root, rel)).mode); } catch (e) {}
    written.set(dest, { from: rel, text: out });
  };
  list.forEach(rel => put(rel, renamePath(rel, rules)));
  overlay.forEach(rel => put(rel, rel.slice(OVERLAY.length + 1)));
  const at = new Map(tracked.map((f, i) => [f, i + 1]));   /* a masked name is reported by its original's place */
  const files = [...written].map(([file, w]) => ({ file, text: w.text, n: at.get(w.from), from: w.from }));
  const scope = scopeFault(rules, files, 'text files in the copy', 'it cleaned nothing and its words were looked for nowhere');
  if (scope) throw new Error(scope);
  return { rules, counts, tracked: tracked.length, copied: list.length, overlay: overlay.length, changed, binaries, unused,
    pairs: [...written].map(([file, w]) => ({ file, from: w.from })), left: survivors(files, rules) };
}

/* THE DIFF CHECK (--check-code <path to acorn>): proves the copy changed no code. It does not trust this
   file's own comment-finder: JavaScript is read by a real parser (acorn, installed OUTSIDE the repository,
   never a dependency of it) and every token outside comments must match the original, in order, and so must
   whether a line break stands before it (2026-10-16: a comment rewrapped after a return passed as comments only,
   and the function then returned nothing). CSS, HTML, YAML and shell must match once their comments are
   stripped; data and images must match byte for byte. Prose is reported by how many lines changed, never by
   what they said. */
function checkCode(pairs, outDir, acornPath) {
  const acorn = require(path.resolve(acornPath));
  /* each token is its kind and value, led by a line break when a line terminator (\n, \r, U+2028, U+2029) stands
     between it and the token before, in whitespace or inside a comment: a line break can end a statement, so a
     comment that gains or loses one there is a change to the code, not to a comment */
  const toks = src => {
    for (const sourceType of ['script', 'module']) {
      try {
        let end = null;
        return [...acorn.tokenizer(src, { ecmaVersion: 'latest', sourceType, allowHashBang: true, allowReturnOutsideFunction: true })].map(t => {
          const br = end !== null && /[\n\r\u2028\u2029]/.test(src.slice(end, t.start));
          end = t.end;
          return (br ? '\n' : '') + t.type.label + ':' + JSON.stringify(t.value);
        });
      }
      catch (e) { /* try the other kind of file */ }
    }
    return null;
  };
  const HEREDOC = /(?<!<)<<(?!<)-?[ \t]*(?:'([^'\n]+)'|"([^"\n]+)"|\\?([\w-]+))/;   // its word: quoted, escaped or bare
  const strip = {
    css: t => t.replace(/\/\*[\s\S]*?\*\//g, ''),
    html: t => t.replace(STYLE, (x, a, b, c) => a + b.replace(/\/\*[\s\S]*?\*\//g, '') + c).replace(/<!--[\s\S]*?-->/g, ''),
    /* a # line is a comment only where YAML or the shell reads one, and every other line is kept, so a copy that
       rewrites it is code changed. In a YAML file the text of a block (key: | or key: >) is kept whole, unless the key
       is run:, whose text is a script (2026-10-16: a heading in an env: block was rewritten and called comments only).
       In a script, a line inside a heredoc is kept: from the line that opens it (<<WORD, <<-WORD, <<'WORD', <<"WORD";
       a <<< here-string opens none) to the line that is its word alone after any indent, and one that never closes
       keeps every line. So is a line inside a quoted string that runs over lines (the same day, a heading in an
       echo "…" over three lines) */
    hash: (t, file) => {
      const yml = /\.ya?ml$/i.test(file || '');
      let block = yml ? null : { col: -1, sh: true }, end = null, q = [];
      return t.split('\n').filter(l => {
        if (block && yml && l.trim() && l.search(/\S/) <= block.col) { block = null; end = null; q = []; }
        if (!block) {
          const b = l.match(/^(\s*(?:-\s+)?)(?:([\w.-]+)\s*:\s*)?[|>][-+0-9]*\s*(?:#.*)?$/);
          if (b && (b[2] || /-\s+$/.test(b[1]))) block = { col: b[2] ? b[1].length : b[1].indexOf('-'), sh: b[2] === 'run' };
          return !/^\s*#(?!!)/.test(l);
        }
        if (!block.sh) return true;
        if (end !== null) { if (l.replace(/^\s+/, '') === end) end = null; return true; }
        const top = () => q[q.length - 1], inside = q.length > 0 && top() !== '(';
        if (!inside && /^\s*#/.test(l)) return /^\s*#!/.test(l);
        for (let i = 0; i < l.length; i++) {      // the quotes still open, and $( … ) inside them, which quotes anew
          const c = l[i], o = top();
          if (o === "'") { if (c === "'") q.pop(); }
          else if (c === '\\') i++;
          else if (c === '$' && l[i + 1] === '(') { q.push('('); i++; }
          else if (o === '"') { if (c === '"') q.pop(); }
          else if (c === "'" || c === '"') q.push(c);
          else if (o === '(' && (c === '(' || c === ')')) { if (c === '(') q.push(c); else q.pop(); }
          else if (c === '#' && (i === 0 || /[\s;|&()]/.test(l[i - 1]))) break;
        }
        const h = !inside && l.match(HEREDOC); if (h) end = h[1] || h[2] || h[3];
        return true;
      }).join('\n');
    },
  };
  const R = { same: 0, codeOk: 0, unparsed: [], codeChanged: [], dataChanged: [], prose: [], added: 0 };
  pairs.forEach(({ file, from }) => {
    const a = fs.readFileSync(path.join(ROOT, from)), b = fs.readFileSync(path.join(outDir, file));
    /* a file written for the public copy is checked like the rest: the copy rewrites its comments too */
    const added = from.startsWith(OVERLAY + '/');
    if (added) R.added++;
    if (a.equals(b)) { if (!added) R.same++; return; }
    const kind = kindOf(file), A = a.toString('utf8'), B = b.toString('utf8');
    if (kind === 'prose') {
      const seen = new Map(); A.split('\n').forEach(l => seen.set(l, (seen.get(l) || 0) + 1));
      const n = B.split('\n').filter(l => { const k = seen.get(l) || 0; if (k) { seen.set(l, k - 1); return false; } return true; }).length;
      R.prose.push({ file, lines: n }); return;
    }
    if (kind === 'js') {
      const ta = toks(A), tb = toks(B);
      if (!ta) { R.unparsed.push(file); return; }
      if (!tb || ta.length !== tb.length || ta.some((t, i) => t !== tb[i])) R.codeChanged.push(file); else R.codeOk++;
      return;
    }
    if (strip[kind]) { if (strip[kind](A, file) === strip[kind](B, file)) R.codeOk++; else R.codeChanged.push(file); return; }
    R.dataChanged.push(file);
  });
  return R;
}

function selftest() {
  const bad = [];
  let total = 0;
  const mark = (ok, what, why) => { total++; console.log((ok ? '  ok   ' : '  FAIL ') + what + (ok ? '' : '  (' + why + ')')); if (!ok) bad.push(what); };
  /* made-up terms, assembled here so no real one is ever in this file */
  const T = { who: 'Zo' + 'rblax', town: 'Qwerty' + 'ville', sick: 'glim' + 'pox', pet: 'Bis' + 'cuit', ini: 'Z' + 'Q' };
  const lo = T.who.toLowerCase();
  const rules = [
    { id: 1, kind: 'pet-name', rule: 'keep', find: [T.pet] },
    { id: 3, kind: 'partner', rule: 'replace', find: [T.who, 'for-' + lo], to: '[partner]', path: { ['for-' + lo]: 'for-partner' } },
    { id: 31, kind: 'partner', rule: 'replace', find: [T.ini], to: '[partner]', ci: true, suffix: ['s'] },
    { id: 4, kind: 'health', rule: 'drop', find: [T.sick], note: 'A household restriction was raised as an example.' },
    { id: 5, kind: 'place', rule: 'replace', find: [T.town, 'Two Words'], to: '[city]' },
  ];
  const C = compile(rules);
  const clean = (s, f) => cleanText(s, f || 'a.md', C, () => {});
  const NOTE = '[A household restriction was raised as an example.]';
  let o;
  o = clean('We met ' + T.who + ' in ' + T.town + '.');
  mark(o === 'We met [partner] in [city].', 'a name and a place become their stand-ins', o);
  o = clean(T.who + "'s idea");
  mark(o === "[partner]'s idea", 'a possessive keeps its shape', o);
  o = clean('Mega' + T.who + 'X stays');
  mark(o === 'Mega' + T.who + 'X stays', 'a replace matches whole words only', o);
  o = clean('ask ' + T.ini.toLowerCase() + ' and ' + T.ini[0] + T.ini[1].toLowerCase() + ' and ' + T.ini);
  mark(o === 'ask [partner] and [partner] and [partner]', 'a case-free rule catches every capitalisation', o);
  o = clean(T.ini + 's game');
  mark(o === '[partner]s game', 'a listed ending (a plural with no apostrophe) is caught, and kept', o);
  o = clean(T.ini.toLowerCase() + 'á stays');
  mark(o === T.ini.toLowerCase() + 'á stays', 'a letter with an accent is part of the word: a longer word is not cut into', o);
  o = clean('Good start. She has ' + T.sick + ' so avoid it. Then more.');
  mark(o === 'Good start. ' + NOTE + ' Then more.', 'a drop takes out only its sentence and leaves a bracketed note', o);
  o = clean('Good start. She has\n' + T.sick + ' so we\navoid it. Then more.\n\nNext paragraph.');
  mark(o === 'Good start. ' + NOTE + ' Then more.\n\nNext paragraph.', 'a sentence broken over lines is dropped whole, and the paragraph break stays', JSON.stringify(o));
  o = clean('- She has ' + T.sick + '\n  at home\n- Next item.');
  mark(o === '- ' + NOTE + '\n- Next item.', 'a list item keeps its marker, and the next item is untouched', JSON.stringify(o));
  o = clean('## Why ' + T.sick + '\nShe avoids it.');
  mark(o === '## ' + NOTE + '\nShe avoids it.', 'a heading is its own unit: a drop in it never eats the paragraph below', JSON.stringify(o));
  o = clean('---\nname: x\ndescription: when ' + T.who + ' asks\n---\nBody.');
  mark(o === '---\nname: x\ndescription: when [partner] asks\n---\nBody.', 'front matter keeps every key', JSON.stringify(o));
  o = clean('> She has\n> ' + T.sick + ' at home.\n> Fine.');
  mark(o === '> ' + NOTE + '\n> Fine.', 'a quote wrapped over lines is one unit and keeps its >', JSON.stringify(o));
  o = clean('| 2026 | she has ' + T.sick + ' | done |');
  mark(o === '| 2026 | ' + NOTE + ' | done |', 'a drop inside a table stays inside its cell', o);
  o = clean('const x = "' + T.who + '"; // asked by ' + T.who + '\n/* ' + T.town + ' */ f();', 'x.js');
  mark(o === 'const x = "' + T.who + '"; // asked by [partner]\n/* [city] */ f();', 'in code only comments change, a string never does', o);
  o = clean('x();\n  // She has\n  // ' + T.sick + ' at home.\n  // Fine.\ny();', 'x.js');
  mark(o === 'x();\n  // ' + NOTE + '\n  // Fine.\ny();', 'a sentence wrapped over // lines goes whole, and the code around it is untouched', JSON.stringify(o));
  o = clean('const r = /["\'/]/g; const s = "// ' + T.who + '"; // ' + T.who, 'x.js');
  mark(o === 'const r = /["\'/]/g; const s = "// ' + T.who + '"; // [partner]', 'a regular expression and a // inside a string are never taken for a comment', o);
  o = clean('const t = `a ${f("/*")} b`; /* ' + T.town + ' */', 'x.js');
  mark(o === 'const t = `a ${f("/*")} b`; /* [city] */', 'a template literal is stepped over whole', o);
  o = clean('url: "a"  # by ' + T.town + '\n# made in ' + T.town + '\n#!/bin/sh', 'w.yml');
  mark(o === 'url: "a"  # by ' + T.town + '\n# made in [city]\n#!/bin/sh', 'yaml: a whole comment line is cleaned; a trailing comment and a value are not', o);
  o = clean('<p>' + T.town + '</p><!-- ' + T.town + ' -->', 'p.html');
  mark(o === '<p>' + T.town + '</p><!-- [city] -->', 'html: only comments change', o);
  o = clean('<style>\n.a{color:red} /* made in ' + T.town + ' */\n.' + T.town + '{}\n</style><p>' + T.town + '</p>', 'p.html');
  mark(o === '<style>\n.a{color:red} /* made in [city] */\n.' + T.town + '{}\n</style><p>' + T.town + '</p>', 'html: a note inside a style block is cleaned; the style rules and the page text are not', o);
  const leftS = survivors([{ file: 'p.html', text: '<style>.' + T.town + '{}</style>' }], rules);
  mark(leftS.length === 1 && /p\.html:1 \(in code/.test(leftS[0]), 'html: a detail in a style RULE is red, not rewritten', JSON.stringify(leftS));
  o = clean('{"a":"' + T.town + '"}', 'd.json');
  mark(o === '{"a":"' + T.town + '"}', 'a data file is never rewritten', o);
  const left0 = survivors([{ file: 'x.js', text: 'const x = "' + T.who + '";' }, { file: 'd.json', text: '{"a":"' + T.town + '"}' }], rules);
  mark(left0.length === 2 && /x\.js:1 \(in code/.test(left0[0]) && /d\.json:1 \(a data file/.test(left0[1]) && left0.every(l => l.indexOf(T.who) < 0 && l.indexOf(T.town) < 0), 'a detail left in code or data is red, and named without the term', JSON.stringify(left0));
  o = clean('the pet ' + T.pet + ' stays');
  mark(o === 'the pet ' + T.pet + ' stays', 'a keep rule changes nothing', o);
  o = renamePath('docs/for-' + lo + '/A.md', rules);
  mark(o === 'docs/for-partner/A.md', 'a folder is renamed by the map', o);
  o = clean('see docs/for-' + lo + '/A.md');
  mark(o === 'see docs/for-partner/A.md', 'a link to the renamed folder follows it', o);
  const lp = survivors([{ file: 'docs/rooms/' + T.ini.toLowerCase() + '-office.md', text: 'fine' }], rules);
  mark(lp.length === 1 && lp[0].indexOf(T.ini.toLowerCase() + '-') < 0, 'a mapped name inside a file name is red, and the name is not printed whole', JSON.stringify(lp));
  const lb = survivors([{ file: 'a.md', text: 'fine' }, { file: 'docs/' + T.town + '/notes.md', text: 'about ' + T.sick, n: 7 }], rules);
  mark(lb.length === 2 && lb.every(l => l.indexOf(T.town) < 0 && l.indexOf(T.sick) < 0 && /file 7 in git ls-files order/.test(l)), 'a file whose name and text both hold a detail is named by its place in git ls-files order on every line, never by its name', JSON.stringify(lb));
  /* names a rule's own match misses and a reader does not: lower case, no accent, a digit glued on, a renamed folder in another case */
  const acc = 'Bra' + 'ñoville', den = 'plo' + 'vik-den';
  const RN = rules.concat([{ id: 6, kind: 'place', rule: 'replace', find: [acc], to: '[city]' }, { id: 8, kind: 'home', rule: 'replace', find: [den], to: '[home]', path: { [den]: 'den' } }]);
  const ln = survivors([{ file: 'docs/rooms/' + T.town.toLowerCase() + '-office.md', text: '# The ' + T.town + ' office' }, { file: 'docs/bra' + 'noville-trip.md', text: 'We drove to ' + acc + ' on Sunday.' },
    { file: 'docs/letters/' + lo + '2.md', text: 'Dear ' + T.who + ',' }, { file: 'docs/Plo' + 'vik_Den/notes.md', text: 'about ' + T.who }, { file: 'docs/b.md', text: 'about ' + T.who }], RN);
  const plainLow = s => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  const carried = ln.filter(l => /: a file name carries it: /.test(l)).map(l => (l.match(/ file (\d+) in git ls-files order/) || [])[1]).join(',');
  mark(ln.length === 8 && carried === '1,2,4' && ln.slice(0, 7).every(l => / file [1-4] in git ls-files order/.test(l) && [T.town, 'bra' + 'noville', lo, 'plo' + 'vik'].every(t => plainLow(l).indexOf(plainLow(t)) < 0)) && /docs\/b\.md:1$/.test(ln[7]),
    'a name a reader would recognise is not printed, whatever its case, accents, separators or a digit glued on, and one holding a word of the list whole is red; a name with nothing in it still is printed', JSON.stringify(ln));
  /* a term of two words, or with an apostrophe in it, glued together in a name: a reader still reads it there */
  const two = 'Zib' + ' Marrow', apo = 'O\'Va' + 'rrix', glued = s => s.replace(/[ ']/g, '');
  const RG = [{ id: 11, kind: 'place', rule: 'replace', find: [two], to: '[city]' }, { id: 12, kind: 'partner', rule: 'replace', find: [apo], to: '[partner]', ci: true }];
  const lg = survivors([{ file: 'docs/' + glued(two) + '-notes.md', text: 'We sailed to ' + two + '.' }, { file: 'docs/letters/' + glued(apo).toLowerCase() + '.md', text: 'Dear ' + apo + ',' },
    { file: 'docs/b.md', text: 'about ' + two }], RG);
  mark(lg.length === 3 && lg.slice(0, 2).every((l, k) => l.indexOf('file ' + (k + 1) + ' in git ls-files order') > 0 && [two, apo].every(t => l.toLowerCase().indexOf(glued(t).toLowerCase()) < 0)) && /docs\/b\.md:1$/.test(lg[2]),
    'a term of two words or with an apostrophe, glued together in a name, still keeps the name from print; a clean name with the term only in its text is still printed', JSON.stringify(lg));
  /* the printed lookup turns a fingerprint back into a name from any folder of the clone, not only from its top */
  const clone = fs.mkdtempSync(path.join(require('os').tmpdir(), 'clean-copy-find-'));
  const noGitEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_/.test(k)));
  let found = '';
  try {
    fs.mkdirSync(path.join(clone, 'a')); fs.mkdirSync(path.join(clone, 'b'));
    fs.writeFileSync(path.join(clone, 'a', 'x.md'), 'x'); fs.writeFileSync(path.join(clone, 'b', 'y.md'), 'y');
    execFileSync('git', ['init', '-q'], { cwd: clone, env: noGitEnv, stdio: 'ignore' });
    execFileSync('git', ['add', '.'], { cwd: clone, env: noGitEnv, stdio: 'ignore' });
    found = execFileSync('/bin/sh', ['-c', FIND.replace('<fingerprint>', fingerprint('b/y.md'))], { cwd: path.join(clone, 'a'), env: noGitEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (e) { /* the lookup found nothing (grep exits 1), or git is missing: either way nothing was found */ }
  finally { fs.rmSync(clone, { recursive: true, force: true }); }
  mark(found === fingerprint('b/y.md') + ' b/y.md', 'the printed lookup finds a name from any folder of the clone, by its full path', found || 'it found nothing');
  const left2 = survivors([{ file: 'b.md', text: 'x\nabout ' + T.sick + ' y' }], rules);
  mark(left2.length === 1 && left2[0].indexOf('b.md:2') > 0 && left2[0].indexOf(T.sick) < 0, 'a surviving detail is named by rule and line, never by the term', JSON.stringify(left2));
  const left3 = survivors([{ file: 'c.md', text: 'we met in Two\nWords' }], rules);
  mark(left3.length === 1 && /c\.md:1/.test(left3[0]), 'a two-word term broken over a line is still found by the read-back', JSON.stringify(left3));
  o = clean('- **Rule one.** *Added from ' + T.who + '.* She has ' + T.sick + ' at home. More.');
  mark(o === '- **Rule one.** *Added from [partner].* ' + NOTE + ' More.', 'a stop inside bold or italics still ends its sentence: a drop never eats the one before', o);
  o = clean('an ' + T.ini + ' pack and An ' + T.ini + ' pack');
  mark(o === 'a [partner] pack and A [partner] pack', 'an article before a stand-in is corrected: "an" becomes "a"', o);
  const R4 = [{ id: 7, kind: 'work', rule: 'replace', find: [' the owner wants ' + T.town], to: '' },
    { id: 9, kind: 'schedule', rule: 'replace', pattern: ['\\b\\d{1,2}:\\d{2} ?UTC\\b'], to: '[a time]' }];
  const C4 = compile(R4), c4 = s => cleanText(s, 'a.md', C4, () => {});
  o = c4('a practice pack for a role the owner wants ' + T.town + ' (the ledger lists them)');
  mark(o === 'a practice pack for a role (the ledger lists them)', 'a phrase that starts with a space is taken out whole, leaving the sentence around it', o);
  o = c4('at 20:52 UTC every frame is night; the harness gets noon.');
  mark(o === 'at [a time] every frame is night; the harness gets noon.', 'a pattern in a replace rule becomes its stand-in and nothing more', o);
  const R5 = [{ id: 93, kind: 'schedule', rule: 'replace', pattern: ['(\\d{4}-\\d{2}-\\d{2}),? (?:night|evening)\\b'], to: '$1' }];
  /* assembled at run time, like the made-up names above: a date and an hour written out here would match
     the owner's own schedule rule, and the private-term check would rightly stop this file */
  const hour = 'ni' + 'ght', day = '1999' + '-01-02';
  o = cleanText('(owner, ' + day + ', ' + hour + ': "go") and day and ' + hour + '.', 'a.md', compile(R5), () => {});
  mark(o === '(owner, ' + day + ': "go") and day and ' + hour + '.', 'a pattern stand-in keeps the group it names ($1) and nothing it does not', o);
  mark(survivors([{ file: 'a.md', text: 'seen 20:52 UTC' }], R4).length === 1 && survivors([{ file: 'a.md', text: 'a role the owner wants ' + T.town }], R4).length === 1, 'the read-back checks a replace rule\'s patterns and space-bounded phrases', 'it missed one');
  /* conditional and scoped rules */
  const R2 = [{ id: 41, kind: 'health', rule: 'drop', find: [T.sick], with: [T.who, 'she'], note: 'N.' }];
  const C2 = compile(R2), c2 = s => cleanText(s, 'a.md', C2, () => {});
  o = c2('Packs list ' + T.sick + ' for players.');
  mark(o === 'Packs list ' + T.sick + ' for players.', 'a conditional drop leaves general design talk alone', o);
  o = c2('Intro. And She has ' + T.sick + ' at home. End.');
  mark(o === 'Intro. [N.] End.', 'a conditional drop takes the sentence about the person, in any case', o);
  mark(survivors([{ file: 'r.md', text: 'Packs list ' + T.sick + '.' }], R2).length === 0 && survivors([{ file: 'r.md', text: 'she has ' + T.sick }], R2).length === 1, 'the read-back applies the same condition', 'it disagreed with the drop');
  const R3 = [{ id: 9, kind: 'schedule', rule: 'drop', pattern: ['\\b\\d{1,2}:\\d{2} ?UTC\\b'], files: '^docs/.*\\.md$' }];
  const C3 = compile(R3), fx = "exp: '2026-09-16 15:26:57 UTC'";
  o = cleanText(fx, 'test/x.js', C3, () => {});
  mark(o === fx && survivors([{ file: 'test/x.js', text: fx }], R3).length === 0, 'a rule scoped to notes never touches a test fixture', o);
  o = cleanText('At 03:48 UTC we met. Ok.', 'docs/a.md', C3, () => {});
  mark(o === 'Ok.', 'and still cleans the notes it is scoped to, leaving no gap', JSON.stringify(o));
  let e0 = ''; try { compile([{ id: 7, kind: 'x', rule: 'drop', find: ['loop'], note: 'a loop' }]); } catch (e) { e0 = e.message; }
  mark(/holds a term/.test(e0), 'a note that holds its own drop term is refused, not looped on', e0);
  /* the code check reads a line break between tokens (2026-10-16): a comment rewrapped after a return passed as
     comments only, while the function then returned nothing, because a line break there ends the statement. The
     cases run on a stand-in for acorn written here, so they run where acorn is not installed (CI does not install
     it); --selftest --check-code <path to acorn> runs them on the real parser instead */
  const cc = fs.mkdtempSync(path.join(require('os').tmpdir(), 'clean-copy-code-'));
  /* names, numbers and single marks, with whitespace and comments stepped over; this note stays outside the
     function, because its source text is what the stand-in file is written from */
  function* standIn(s) {
    const re = /\s+|\/\*[\s\S]*?\*\/|\/\/.*|([\w$]+|\S)/g; let m;
    while ((m = re.exec(s))) if (m[1]) yield { type: { label: /^[\w$]+$/.test(m[1]) ? 'name' : m[1] }, value: m[1], start: m.index, end: re.lastIndex };
  }
  fs.writeFileSync(path.join(cc, 'stand-in.cjs'), 'exports.tokenizer = ' + standIn.toString() + ';\n');
  const parser = (i => i > 0 ? process.argv[i + 1] : path.join(cc, 'stand-in.cjs'))(process.argv.indexOf('--check-code'));
  const verdict = (a, b) => {
    fs.mkdirSync(path.join(cc, 'out'), { recursive: true });
    fs.writeFileSync(path.join(cc, 'a.js'), a); fs.writeFileSync(path.join(cc, 'out', 'a.js'), b);
    const D = checkCode([{ file: 'a.js', from: path.relative(ROOT, path.join(cc, 'a.js')) }], path.join(cc, 'out'), parser);
    return D.codeChanged.length ? 'code changed' : D.codeOk ? 'comments only' : JSON.stringify(D);
  };
  try {
    const plant = 'function f(x) {\n  return /* a */ x;\n}\n';
    const breaks = ['\n', '\r', '\u2028', '\u2029'].map(nl => verdict(plant, plant.replace('/* a */', '/* a,' + nl + ' b */')))
      .concat(verdict(plant, plant.replace('/* a */ x', '/* a */\n  x')));
    mark(breaks.every(v => v === 'code changed'), 'the code check reads a line break: a comment rewrapped after a return, which then returns nothing, is code changed', breaks.join(', '));
    const own = 'function f(x) {\n  /* a */\n  return x;\n}\n';
    o = verdict(own, own.replace('/* a */', '/* a, reworded\n     over two lines */'));
    mark(o === 'comments only', 'a comment reworded on its own line, over two lines now, is still comments only', o);
    /* a # line inside a heredoc is the text the heredoc writes, not a comment (2026-10-16: a step summary's heading
       was rewritten and the check said comments only); a # line outside one is still a comment */
    const sh = (name, a, b) => {
      fs.mkdirSync(path.join(cc, 'out'), { recursive: true });
      fs.writeFileSync(path.join(cc, name), a); fs.writeFileSync(path.join(cc, 'out', name), b);
      const D = checkCode([{ file: name, from: path.relative(ROOT, path.join(cc, name)) }], path.join(cc, 'out'), parser);
      return D.codeChanged.length ? 'code changed' : D.codeOk ? 'comments only' : JSON.stringify(D);
    };
    const here = "cat > notes.md <<'EOF'\n# a heading the file keeps\nEOF\n# a note\n";
    const step = 'steps:\n  - run: |\n      cat <<-"END-NOTE" > notes.md\n      # a heading the file keeps\n      END-NOTE\n      # a note\n';
    const bare = 'cat <<\\END-X > notes.md\n# a heading the file keeps\nEND-X\n# a note\n';
    const reword = (name, t, line) => sh(name, t, t.replace(line, line + ', reworded'));
    o = [reword('a.sh', here, '# a heading the file keeps'), reword('a.yml', step, '# a heading the file keeps'), reword('c.sh', bare, '# a heading the file keeps')].join(', ');
    mark(o === 'code changed, code changed, code changed', 'a # line inside a heredoc is the text it writes: rewording it is code changed (<<\'EOF\', <<-"END-NOTE" in a step, <<\\END-X)', o);
    o = [reword('a.sh', here, '# a note'), reword('a.yml', step, '# a note'), reword('c.sh', bare, '# a note'), reword('b.sh', 'tr a-z A-Z <<< word\n# a note\n', '# a note')].join(', ');
    mark(o === 'comments only, comments only, comments only, comments only', 'a # comment outside a heredoc, after its end or after a <<< here-string, is still comments only', o);
    /* a # line in a YAML block of text, or inside a quoted string over lines, is text too; and a file written for
       the public copy is read like the rest (2026-10-16, round 2: each was rewritten and called comments only) */
    const env = 'steps:\n  - env:\n      SUMMARY: |\n        # a heading the summary shows\n        more text\n    run: echo "$SUMMARY"\n# a note\n';
    const quoted = 'echo "\n# a heading the summary shows\nmore text" >> out.md\n# a note, it\'s a comment\n';
    const stepq = 'steps:\n  - run: |\n      echo "\n      # a heading the summary shows\n      more text" >> out.md\n      # a note\n';
    o = [reword('d.yml', env, '# a heading the summary shows'), reword('d.sh', quoted, '# a heading the summary shows'), reword('e.yml', stepq, '# a heading the summary shows')].join(', ');
    mark(o === 'code changed, code changed, code changed', 'a # line in a YAML block of text (env: | …), or in a quoted string over lines (in a script and in a run: step), is text: rewording it is code changed', o);
    const subst = 'v="$(sed -n \'s/^v="\\([^"]*\\)".*/\\1/p\' f)"\n# a note\n';
    o = [reword('d.yml', env, '# a note'), reword('d.sh', quoted, '# a note'), reword('e.yml', stepq, '# a note'), reword('f.sh', subst, '# a note')].join(', ');
    mark(o === 'comments only, comments only, comments only, comments only', 'a # comment after the block ends, after the string closes, or after a "$( … )" with quotes of its own, is still comments only', o);
    const over = (a, b) => {
      fs.writeFileSync(path.join(cc, 'o.yml'), a); fs.writeFileSync(path.join(cc, 'out', 'o.yml'), b);
      /* the path is read as a file written for the public copy, and resolves to the file just written */
      const D = checkCode([{ file: 'o.yml', from: OVERLAY + '/../' + path.relative(ROOT, path.join(cc, 'o.yml')) }], path.join(cc, 'out'), parser);
      return D.codeChanged.length ? 'code changed' : D.codeOk ? 'comments only' : JSON.stringify(D);
    };
    o = over(step, step.replace('# a heading the file keeps', '# a heading the file keeps, reworded'));
    mark(o === 'code changed', 'a file written for the public copy is checked like the rest: a heredoc line it rewrote is code changed', o);
  } finally { fs.rmSync(cc, { recursive: true, force: true }); }
  /* the refusals that keep the map and the copy out of the repository, and an empty list from publishing nothing */
  let e1 = ''; try { run(path.join(ROOT, 'map.json'), '/tmp/x'); } catch (e) { e1 = e.message; }
  mark(/inside the repository/.test(e1), 'a map inside the repository is refused', e1);
  let e2 = ''; try { run('/tmp/map.json', path.join(ROOT, 'out')); } catch (e) { e2 = e.message; }
  mark(/inside the repository/.test(e2), 'an output folder inside the repository is refused', e2);
  const empty = path.join(require('os').tmpdir(), 'clean-copy-empty-' + process.pid + '.txt');
  fs.writeFileSync(empty, '# only a comment\n\n');
  let e3 = ''; try { readManifest(empty); } catch (e) { e3 = e.message; } finally { fs.rmSync(empty, { force: true }); }
  mark(/empty/.test(e3), 'an allowed list with no lines is a red, not a copy of nothing', e3);
  const keep = fs.mkdtempSync(path.join(require('os').tmpdir(), 'clean-copy-keep-'));
  fs.writeFileSync(path.join(keep, 'notes.txt'), 'somebody else\'s file');
  let e4 = ''; try { run('/nonexistent/map.json', keep); } catch (e) { e4 = e.message; }
  const kept = fs.existsSync(path.join(keep, 'notes.txt')); fs.rmSync(keep, { recursive: true, force: true });
  mark(/not emptied/.test(e4) && kept, 'a folder that is not an earlier copy is refused, and nothing in it is deleted', e4 + (kept ? '' : ' (and the file was deleted)'));
  let e5 = ''; try { run('/nonexistent/map.json', path.dirname(ROOT)); } catch (e) { e5 = e.message; }
  mark(/holds this repository/.test(e5), 'a folder that holds the repository is refused', e5);
  /* a name a PATTERN finds, its two words glued or with a digit after its \b: the pattern misses the
     name, a reader does not. Nor does a reader miss it in lower case, glued, where another file's text holds it */
  const zib = 'Zib' + ' Marrow', zex = 'Zo' + 'rblex';
  const RP = [{ id: 5, kind: 'place', rule: 'replace', pattern: ['\\bZib[\\s-]+Marrow\\b'], to: '[city]', ci: true }, { id: 3, kind: 'partner', rule: 'replace', pattern: ['\\bZorbl[ae]x\\b'], to: '[partner]', ci: true },
    { id: 6, kind: 'place', rule: 'replace', find: [T.town], to: '[city]' }];
  const lpat = survivors([{ file: 'docs/' + glued(zib) + '-trip.md', text: 'x\n\nWe sailed to ' + zib + ' in May.' }, { file: 'docs/letters/' + zex.toLowerCase() + '2.md', text: 'Dear ' + zex + ',' },
    { file: 'docs/' + glued(zib).toLowerCase() + '.md', text: 'In ' + T.town + '.' }, { file: 'docs/b.md', text: 'Dear ' + zex + ',' }], RP);
  mark(lpat.length === 4 && lpat.slice(0, 3).every((l, k) => l.indexOf('line ' + [3, 1, 1][k] + ' of file ' + (k + 1) + ' in git ls-files order') > 0 && [glued(zib), zex].every(t => l.toLowerCase().indexOf(t.toLowerCase()) < 0)) && lpat[3] === 'rule #3 (partner) survives at docs/b.md:1',
    'a name holding what a pattern finds, glued, in any case or with a digit after it, is not printed; a clean name with the match only in its text still is', JSON.stringify(lpat));
  /* letters Unicode does not take apart (ø ł đ ß æ œ ı ħ þ): a name spelt with their plain letters reads the same */
  const bareNames = [['Ør' + 'blund', 'docs/orblund-summer.md'], ['Stra' + 'ßberg', 'docs/strassberg.md'], ['Æ' + 'lmsby', 'docs/Aelmsby.md'], ['Łu' + 'kowo', 'docs/lukowo-2.md'], ['Þ' + 'orvik', 'docs/thorvik.md']];
  const lbare = survivors(bareNames.map(([t, file]) => ({ file, text: 'Two weeks at ' + t + '.' })), bareNames.map(([t], k) => ({ id: 20 + k, kind: 'place', rule: 'replace', find: [t], to: '[city]', ci: true })));
  mark(lbare.length === 10 && bareNames.every((x, k) => /: a file name carries it: /.test(lbare[2 * k]) && lbare[2 * k].indexOf(' file ' + (k + 1) + ' in git ls-files order') > 0 && lbare[2 * k + 1].indexOf('line 1 of file ' + (k + 1) + ' in git ls-files order') > 0)
    && lbare.every(l => !/orblund|strassberg|aelmsby|lukowo|thorvik/i.test(l)),
    'a name spelt with the plain letters of ø ß æ ł þ and the rest is not printed, and is red', JSON.stringify(lbare));
  /* a name holding a word of the list glued straight onto other letters or a digit, with nothing between, was hidden by
     the read-back and not flagged, so the copy said OK and published the file under that name */
  const gn = ['docs/' + lo + 'notes.md', 'art/' + T.town.toLowerCase() + 'map.png'];
  const lglue = survivors([{ file: gn[0], text: '# Notes\n\nThe ferry leaves at noon.\n', n: 4, from: gn[0] }, { file: gn[1], text: null, n: 9, from: gn[1] }, { file: 'docs/b.md', text: 'fine' }], rules);
  mark(lglue.length === 2 && lglue.every((l, k) => l === 'a file name holds a private detail: file ' + [4, 9][k] + ' in git ls-files order, fingerprint ' + fingerprint(gn[k]) + ' (its name holds a private detail, so it is not printed)'),
    'the read-back fails a name holding a word of the list glued onto other letters or a digit, and does not print it; a clean name beside it still passes', JSON.stringify(lglue));
  /* a "files" limit that matches none of the copy's text files cleans nothing and is read back nowhere, so the copy
     printed OK over a detail it never looked for; the check refused the same list */
  const scopeRun = files => {
    const o = fs.mkdtempSync(path.join(require('os').tmpdir(), 'clean-copy-scope-'));
    fs.writeFileSync(path.join(o, 'map.json'), JSON.stringify([{ id: 7, kind: 'health', rule: 'drop', find: [T.sick], note: 'A health detail was raised.', files }]));
    fs.writeFileSync(path.join(o, 'allowed.txt'), '^scripts/clean-copy\\.js$\n');
    try { run(path.join(o, 'map.json'), path.join(o, 'copy'), path.join(o, 'allowed.txt')); return ''; } catch (e) { return e.message; } finally { fs.rmSync(o, { recursive: true, force: true }); }
  };
  const s0 = scopeRun('^nowhere/'), s1 = scopeRun('^scripts/');
  mark(/^rule #7 is limited by "files" to paths that match none of the \d+ text files in the copy, so it cleaned nothing/.test(s0) && s1 === '',
    'a "files" limit that matches none of the copy\'s text files is a red in the copy too; one that matches still copies', JSON.stringify([s0 || 'it did not fail', s1]));
  /* Node's own JSON and regular-expression errors quote what they could not read, which here is the map */
  const cli = text => {
    const o = fs.mkdtempSync(path.join(require('os').tmpdir(), 'clean-copy-cli-'));
    fs.writeFileSync(path.join(o, 'map.json'), text); fs.writeFileSync(path.join(o, 'allowed.txt'), '^scripts/clean-copy\\.js$\n');
    try { execFileSync(process.execPath, [__filename, '--map', path.join(o, 'map.json'), '--out', path.join(o, 'copy'), '--manifest', path.join(o, 'allowed.txt')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); return 'it did not fail'; }
    catch (e) { return String(e.stdout || '') + String(e.stderr || ''); } finally { fs.rmSync(o, { recursive: true, force: true }); }
  };
  const quoted = [cli('[{"id":3,"kind":"partner","rule":"replace","find":["' + T.who + '",],"to":"[partner]"}]'), cli('[{"id":3,"kind":"partner","rule":"replace","pattern":["(' + T.who + '|' + T.who.slice(0, 4) + 'i"],"to":"[partner]"}]')];
  mark(quoted.every(o => /^FAIL\n- the map or the allowed list holds JSON or a regular expression that does not parse/.test(o) && o.indexOf(T.who) < 0),
    'the copy\'s command line never passes on Node\'s own JSON or regular-expression error, which quotes the map', JSON.stringify(quoted.map(o => o.replace(new RegExp(T.who, 'g'), '<the made-up name>'))));
  /* the diff check's list (--check-code) printed every changed file by its name, though the read-back below it named
     the same file only by its fingerprint, because its name holds a private detail. Run as the command line runs it,
     from a repository made here with this file in it, and a stand-in for acorn (only prose is compared) */
  const CK = fs.mkdtempSync(path.join(require('os').tmpdir(), 'clean-copy-names-')), ckBox = fs.mkdtempSync(path.join(require('os').tmpdir(), 'clean-copy-names-box-'));
  const noted = 'docs/notes-for-' + lo + '.md';
  let listedOut = '';
  try {
    fs.mkdirSync(path.join(CK, 'scripts')); fs.mkdirSync(path.join(CK, 'docs'));
    fs.copyFileSync(__filename, path.join(CK, 'scripts', 'clean-copy.js'));
    fs.writeFileSync(path.join(CK, noted), '# Notes\n\nDinner with ' + T.who + ' on Friday.\n');
    fs.writeFileSync(path.join(CK, 'docs', 'dinner.md'), '# Dinner\n\nDinner with ' + T.who + ' on Friday.\n');
    execFileSync('git', ['init', '-q'], { cwd: CK, env: noGitEnv, stdio: 'ignore' }); execFileSync('git', ['add', '-A'], { cwd: CK, env: noGitEnv, stdio: 'ignore' });
    fs.writeFileSync(path.join(ckBox, 'map.json'), JSON.stringify([{ id: 3, kind: 'partner', rule: 'replace', find: [T.who], to: '[partner]', ci: true }]));
    fs.writeFileSync(path.join(ckBox, 'allowed.txt'), '^docs/\n');
    fs.writeFileSync(path.join(ckBox, 'acorn.js'), 'module.exports = { tokenizer: () => [] };\n');
    try { listedOut = execFileSync(process.execPath, [path.join(CK, 'scripts', 'clean-copy.js'), '--map', path.join(ckBox, 'map.json'), '--out', path.join(ckBox, 'copy'), '--manifest', path.join(ckBox, 'allowed.txt'), '--check-code', path.join(ckBox, 'acorn.js')],
      { cwd: CK, env: noGitEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { listedOut = String(e.stdout || ''); }
  } finally { fs.rmSync(CK, { recursive: true, force: true }); fs.rmSync(ckBox, { recursive: true, force: true }); }
  mark(listedOut.toLowerCase().indexOf(lo) < 0 && listedOut.split('\n').includes('  prose  a file whose name holds a private detail, fingerprint ' + fingerprint(noted) + ': 1 line(s) changed') && listedOut.split('\n').includes('  prose  docs/dinner.md: 1 line(s) changed'),
    'the diff check\'s list names a file whose name holds a private detail by its fingerprint, as the read-back does; a clean name is still listed', JSON.stringify(listedOut.replace(new RegExp(T.who, 'gi'), '<who>').split('\n').filter(l => /^ {2}prose|^FAIL|^OK|^- /.test(l))));
  if (bad.length) { console.log('FAIL: ' + bad.length + ' of ' + total); process.exit(1); }
  console.log('OK: ' + total + ' cases, made-up terms only, no map read.');
  process.exit(0);
}

if (require.main === module) {
  if (process.argv.includes('--selftest')) return void selftest();
  const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  let res;
  try { res = run(arg('--map'), arg('--out'), arg('--manifest')); }
  /* Node's own JSON and regular-expression errors quote what they could not read, which here is the map */
  catch (e) { console.log('FAIL\n- ' + (e instanceof SyntaxError ? 'the map or the allowed list holds JSON or a regular expression that does not parse (Node\'s own message quotes it, so it is not printed)' : e.message)); process.exit(1); }
  console.log('Copied ' + res.copied + ' of ' + res.tracked + ' tracked files' + (res.overlay ? ', plus ' + res.overlay + ' written for the public copy' : '')
    + ' (' + res.binaries + ' binary, copied as they are; images are not read); ' + res.changed + ' changed.');
  Object.keys(res.counts).sort().forEach(k => console.log('  ' + k + ': ' + res.counts[k]));
  let codeRed = false;
  /* a file the read-back names by its fingerprint, because its name holds a private detail, is named the same way here */
  const masked = res.left.masked || new Map();
  const show = f => masked.has(f) ? 'a file whose name holds a private detail, fingerprint ' + fingerprint(masked.get(f)) : f;
  if (arg('--check-code')) {
    const D = checkCode(res.pairs, arg('--out'), arg('--check-code'));
    console.log('Diff check: ' + D.same + ' files identical to the original; ' + D.codeOk + ' code files changed in comments only (JavaScript read by a parser, token for token); '
      + D.prose.length + ' prose files changed (' + D.prose.reduce((s, p) => s + p.lines, 0) + ' lines); ' + D.added + ' written for the public copy.');
    D.prose.forEach(p => console.log('  prose  ' + show(p.file) + ': ' + p.lines + ' line(s) changed'));
    D.codeChanged.forEach(f => console.log('  CODE CHANGED  ' + show(f)));
    D.dataChanged.forEach(f => console.log('  DATA CHANGED  ' + show(f)));
    D.unparsed.forEach(f => console.log('  NOT READ  ' + show(f) + ': the original does not parse, so its code cannot be compared'));
    codeRed = D.codeChanged.length + D.dataChanged.length + D.unparsed.length > 0;
  } else console.log('Diff check NOT RUN: pass --check-code <path to acorn> to prove no code changed.');
  if (codeRed) { console.log('FAIL: the copy changed code or data, which the clean copy must never do.'); process.exit(1); }
  if (res.unused.length) { console.log('FAIL: ' + res.unused.length + ' line(s) of the allowed list match no tracked file (a typo publishes nothing, silently):'); res.unused.forEach(u => console.log('- ' + u)); process.exit(1); }
  if (res.left.length) {
    const shown = res.left.slice(0, 80);
    console.log('FAIL: ' + res.left.length + ' mapped detail(s) survived:'); shown.forEach(p => console.log('- ' + p)); if (res.left.length > 80) console.log('- … and ' + (res.left.length - 80) + ' more');
    if (shown.some(p => /, fingerprint [0-9a-f]{8} /.test(p))) console.log(FIND_HINT);
    process.exit(1);
  }
  console.log('OK: no mapped detail survives in the copy.');
  process.exit(0);
}

module.exports = { readMap, readManifest, listText, dupKeyAt, textOf, scopeFault, ruleFault, ruleName, compile, cleanText, renamePath, survivors, fingerprint, FIND_HINT, sentenceSpan, jsPieces, kindOf, run, checkCode };
