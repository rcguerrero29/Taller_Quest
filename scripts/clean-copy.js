#!/usr/bin/env node
/* THE CLEAN COPY — the public repository, made from the originals by an allowed list and a private map.
   The owner, 2026-09-24: "create another internal document that maps the verbatim, thus we basically
   just duplicate it, and programatically replace ... and for other personal details dont mention them
   if not needed and summarize". And 2026-09-25, after the first copy leaked and broke things: keep the
   diaries private, and "Yes, go" to a split made from an allowed list.

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
      detail anywhere is a red, named by rule id and file:line and never by the term. A detail in a code
      STRING is red on purpose: whether to change what a player sees is a decision, not a find-and-replace.

   No real term is in this file; the self-test makes up its own.

   Run:  node scripts/clean-copy.js --map <file outside the repo> --out <new or empty folder outside the repo>
                                    [--manifest <another allowed list>]      (default: scripts/public-manifest.txt)
         The output folder is emptied first, so it must be new, empty, or an earlier clean copy (it holds
         engine/engine.js and scripts/clean-copy.js); any other folder is refused, never emptied.
         node scripts/clean-copy.js --selftest

   The map is JSON, or markdown holding one ```json block — a list of rules:
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
   listed so the map says what was decided. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const OVERLAY = 'public-overlay';

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const words = f => esc(f).replace(/ +/g, '\\s+');   // a two-word term is still found across a line break
const W = '\\p{L}\\p{N}_';                            // a word character in any alphabet
/* a whole-word match; a term that starts or ends with a space or a mark is bounded by that, not by a letter */
const wordRe = (body, flags, open = true, shut = true) => new RegExp((open ? '(?<![' + W + '])' : '') + '(?:' + body + ')' + (shut ? '(?![' + W + '])' : ''), flags + 'u');
const isWordEdge = ch => /[\p{L}\p{N}_]/u.test(ch || '');
const inside = (p, root) => { const r = path.relative(root, path.resolve(p)); return r === '' || (!r.startsWith('..') && !path.isAbsolute(r)); };

/* how a file is cleaned: prose a paragraph at a time; code in its comments only; anything else not at all
   (it is still read back, so a detail in it is a red, not a pass) */
const kindOf = f => /\.(md|markdown)$/i.test(f) ? 'prose'
  : /\.(js|mjs|cjs)$/i.test(f) ? 'js' : /\.css$/i.test(f) ? 'css' : /\.html?$/i.test(f) ? 'html'
  : /\.(ya?ml|sh)$/i.test(f) ? 'hash' : 'data';

function readMap(file) {
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/```json\s*\n([\s\S]*?)```/);
  const rules = JSON.parse(m ? m[1] : src);
  if (!Array.isArray(rules) || !rules.length) throw new Error('the map holds no rules');
  rules.forEach((r, i) => {
    if (!['keep', 'replace', 'drop'].includes(r.rule)) throw new Error('rule #' + (r.id || i) + ' has no known rule (keep, replace, drop)');
    if (r.rule === 'replace' && (!(Array.isArray(r.find) || Array.isArray(r.pattern)) || typeof r.to !== 'string')) throw new Error('replace rule #' + r.id + ' needs find[] or pattern[], and to');
    if (r.rule === 'drop' && !(Array.isArray(r.find) || Array.isArray(r.pattern))) throw new Error('drop rule #' + r.id + ' needs find[] or pattern[]');
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
    if (d.re.test(r.note)) throw new Error('rule #' + r.id + '\'s note holds a term rule #' + d.r.id + ' drops');
  }));
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

/* the read-back: every replace and drop term and pattern, anywhere in the copy (code strings included)
   and in every file name — reported as rule id + kind + file:line, never the term */
function survivors(files, rules) {
  const checks = [];
  rules.forEach(r => {
    if (r.rule === 'replace') {
      (r.find || []).forEach(f => { if (!(r.path && r.path[f])) checks.push({ r, re: replaceRe(r, f, ''), files: filesRe(r) }); });
      (r.pattern || []).forEach(p => checks.push({ r, re: patternRe(r, p, ''), files: filesRe(r) }));
    }
    if (r.rule === 'drop') dropRes(r).forEach(re => checks.push({ r, re, with: withRe(r), files: filesRe(r) }));
    if (r.path) Object.keys(r.path).forEach(k => checks.push({ r, re: new RegExp('(?<![A-Za-z0-9_])' + esc(k) + '(?![A-Za-z0-9_])', r.ci ? 'i' : '') }));
  });
  const P = [];
  files.forEach(({ file, text }) => {
    /* a file name: each folder and file name read with - _ . as spaces; a rule's "files" scope does not
       apply here, because a name is published whatever the rule was written for */
    checks.forEach(c => {
      const hit = seg => c.re.test(seg) || c.re.test(seg.replace(/[-_.]+/g, ' '));
      if (file.split('/').some(hit)) P.push('rule #' + c.r.id + ' (' + c.r.kind + '): a file name carries it: ' + file.split('/').map(s => hit(s) ? '…' : s).join('/'));
    });
    if (text == null) return;
    checks.forEach(c => {
      if (c.files && !c.files.test(file)) return;
      const g = new RegExp(c.re.source, c.re.flags.replace('g', '') + 'g');
      let m;
      while ((m = g.exec(text))) {
        if (m[0] === '') { g.lastIndex++; continue; }
        if (c.with) { const [x, y] = sentenceSpan(text, m.index); if (!c.with.test(text.slice(x, y))) continue; }
        P.push('rule #' + c.r.id + ' (' + c.r.kind + ') survives at ' + file + ':' + text.slice(0, m.index).split('\n').length
          + (kindOf(file) === 'prose' ? '' : ' (' + (kindOf(file) === 'data' ? 'a data file, never rewritten' : 'in code: a string or code is never rewritten') + '; decide it)'));
      }
    });
  });
  return P;
}

function run(mapFile, outDir, manifestFile) {
  if (!mapFile || !outDir) throw new Error('usage: --map <file outside the repo> --out <folder outside the repo> [--manifest <file>]');
  if (inside(mapFile, ROOT)) throw new Error('the map is inside the repository: it must never be, not even untracked');
  if (inside(outDir, ROOT)) throw new Error('the output folder is inside the repository: put it outside');
  /* the folder is emptied below, so only a new one, an empty one, or an earlier copy may be named */
  if (inside(ROOT, outDir)) throw new Error('the output folder holds this repository: emptying it would delete the originals');
  if (fs.existsSync(outDir)) {
    const st = fs.statSync(outDir);
    const earlier = st.isDirectory() && fs.existsSync(path.join(outDir, 'engine', 'engine.js')) && fs.existsSync(path.join(outDir, 'scripts', 'clean-copy.js'));
    if (!st.isDirectory() || (fs.readdirSync(outDir).length && !earlier)) throw new Error('the output folder is not empty and is not an earlier clean copy, so it is not emptied: name a new folder');
  }
  const rules = readMap(mapFile);
  const allow = readManifest(manifestFile || path.join(ROOT, 'scripts', 'public-manifest.txt'));
  const C = compile(rules);
  const counts = {};
  const tally = (r, what) => { const k = '#' + r.id + ' ' + r.kind + ' ' + what; counts[k] = (counts[k] || 0) + 1; };
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean);
  const overlay = tracked.filter(f => f.startsWith(OVERLAY + '/'));
  const list = tracked.filter(f => !f.startsWith(OVERLAY + '/') && allow.some(re => re.test(f)));
  const unused = allow.filter(re => !tracked.some(f => re.test(f))).map(re => re.source);
  fs.rmSync(outDir, { recursive: true, force: true });
  const written = new Map();
  let binaries = 0, changed = 0;
  const put = (rel, dest) => {
    let buf; try { buf = fs.readFileSync(path.join(ROOT, rel)); } catch (e) { return; }
    fs.mkdirSync(path.dirname(path.join(outDir, dest)), { recursive: true });
    if (buf.subarray(0, 8000).includes(0)) { fs.writeFileSync(path.join(outDir, dest), buf); binaries++; written.set(dest, { from: rel, text: null }); return; }
    const src = buf.toString('utf8');
    const out = cleanText(src, dest, C, tally);
    if (out !== src || dest !== rel) changed++;
    fs.writeFileSync(path.join(outDir, dest), out);
    try { fs.chmodSync(path.join(outDir, dest), fs.statSync(path.join(ROOT, rel)).mode); } catch (e) {}
    written.set(dest, { from: rel, text: out });
  };
  list.forEach(rel => put(rel, renamePath(rel, rules)));
  overlay.forEach(rel => put(rel, rel.slice(OVERLAY.length + 1)));
  const files = [...written].map(([file, w]) => ({ file, text: w.text }));
  return { rules, counts, tracked: tracked.length, copied: list.length, overlay: overlay.length, changed, binaries, unused,
    pairs: [...written].map(([file, w]) => ({ file, from: w.from })), left: survivors(files, rules) };
}

/* THE DIFF CHECK (--check-code <path to acorn>): proves the copy changed no code. It does not trust this
   file's own comment-finder: JavaScript is read by a real parser (acorn, installed OUTSIDE the repository,
   never a dependency of it) and every token outside comments must match the original, in order. CSS, HTML,
   YAML and shell must match once their comments are stripped; data and images must match byte for byte.
   Prose is reported by how many lines changed, never by what they said. */
function checkCode(pairs, outDir, acornPath) {
  const acorn = require(path.resolve(acornPath));
  const toks = src => {
    for (const sourceType of ['script', 'module']) {
      try { return [...acorn.tokenizer(src, { ecmaVersion: 'latest', sourceType, allowHashBang: true, allowReturnOutsideFunction: true })].map(t => t.type.label + ':' + JSON.stringify(t.value)); }
      catch (e) { /* try the other kind of file */ }
    }
    return null;
  };
  const strip = {
    css: t => t.replace(/\/\*[\s\S]*?\*\//g, ''),
    html: t => t.replace(STYLE, (x, a, b, c) => a + b.replace(/\/\*[\s\S]*?\*\//g, '') + c).replace(/<!--[\s\S]*?-->/g, ''),
    hash: t => t.split('\n').filter(l => !/^\s*#(?!!)/.test(l)).join('\n'),
  };
  const R = { same: 0, codeOk: 0, unparsed: [], codeChanged: [], dataChanged: [], prose: [], added: 0 };
  pairs.forEach(({ file, from }) => {
    const a = fs.readFileSync(path.join(ROOT, from)), b = fs.readFileSync(path.join(outDir, file));
    if (from.startsWith(OVERLAY + '/')) { R.added++; return; }
    if (a.equals(b)) { R.same++; return; }
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
    if (strip[kind]) { if (strip[kind](A) === strip[kind](B)) R.codeOk++; else R.codeChanged.push(file); return; }
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
  if (bad.length) { console.log('FAIL: ' + bad.length + ' of ' + total); process.exit(1); }
  console.log('OK: ' + total + ' cases, made-up terms only, no map read.');
  process.exit(0);
}

if (require.main === module) {
  if (process.argv.includes('--selftest')) return void selftest();
  const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  let res;
  try { res = run(arg('--map'), arg('--out'), arg('--manifest')); }
  catch (e) { console.log('FAIL\n- ' + e.message); process.exit(1); }
  console.log('Copied ' + res.copied + ' of ' + res.tracked + ' tracked files' + (res.overlay ? ', plus ' + res.overlay + ' written for the public copy' : '')
    + ' (' + res.binaries + ' binary, copied as they are; images are not read); ' + res.changed + ' changed.');
  Object.keys(res.counts).sort().forEach(k => console.log('  ' + k + ': ' + res.counts[k]));
  let codeRed = false;
  if (arg('--check-code')) {
    const D = checkCode(res.pairs, arg('--out'), arg('--check-code'));
    console.log('Diff check: ' + D.same + ' files identical to the original; ' + D.codeOk + ' code files changed in comments only (JavaScript read by a parser, token for token); '
      + D.prose.length + ' prose files changed (' + D.prose.reduce((s, p) => s + p.lines, 0) + ' lines); ' + D.added + ' written for the public copy.');
    D.prose.forEach(p => console.log('  prose  ' + p.file + ': ' + p.lines + ' line(s) changed'));
    D.codeChanged.forEach(f => console.log('  CODE CHANGED  ' + f));
    D.dataChanged.forEach(f => console.log('  DATA CHANGED  ' + f));
    D.unparsed.forEach(f => console.log('  NOT READ  ' + f + ': the original does not parse, so its code cannot be compared'));
    codeRed = D.codeChanged.length + D.dataChanged.length + D.unparsed.length > 0;
  } else console.log('Diff check NOT RUN: pass --check-code <path to acorn> to prove no code changed.');
  if (codeRed) { console.log('FAIL: the copy changed code or data, which the clean copy must never do.'); process.exit(1); }
  if (res.unused.length) { console.log('FAIL: ' + res.unused.length + ' line(s) of the allowed list match no tracked file (a typo publishes nothing, silently):'); res.unused.forEach(u => console.log('- ' + u)); process.exit(1); }
  if (res.left.length) { console.log('FAIL: ' + res.left.length + ' mapped detail(s) survived:'); res.left.slice(0, 80).forEach(p => console.log('- ' + p)); if (res.left.length > 80) console.log('- … and ' + (res.left.length - 80) + ' more'); process.exit(1); }
  console.log('OK: no mapped detail survives in the copy.');
  process.exit(0);
}

module.exports = { readMap, readManifest, compile, cleanText, renamePath, survivors, sentenceSpan, jsPieces, kindOf, run, checkCode };
