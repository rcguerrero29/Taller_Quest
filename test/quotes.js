#!/usr/bin/env node
/* THE QUOTE-SHAPE CHECK — the owner's words are not quoted in this public repository.
   His confirmed goal, logged privately on 2026-10-16: his quotes are removed before anything goes
   public, and nothing of his words is newly published. A cleanup took several hundred quoted lines
   of his out of these files; before it, nothing went red when one came back, and a quote planted in
   a file every player downloads passed every step of CI. This is the step that goes red.

   It reads every tracked text file for the SHAPES a quote credited to him took here. A word list
   cannot know his words, so it looks for the credit beside a quote mark instead:
   - CREDIT, THEN QUOTE. A credit (the owner, the owner's word / ask / request / note and the like,
     he said, he asked, he wrote, his words) and then an OPENING quote mark within WINDOW characters,
     or within DATED characters when a date stands between them, as in a credit, a date and a colon.
     A date just before the credit makes it a dated hit too.
   - CREDIT, DATE, QUOTE. A date and straight away an opening quote mark, with a credit in the line
     or the line before, even a sentence earlier. And his ask, his note, his instruction (any of the
     nouns above after his) with a date and straight away a quote: the persona files credited him
     that way, and putting one of those lines back was green until this shape was read.
   - QUOTE, THEN CREDIT. A closing quote mark and then, after a dash, a comma or an opening bracket,
     the credit as the quote's ATTRIBUTION: followed by a date, by said or asked, or by nothing more
     in its clause (a closing bracket, a full stop, a comma, an issue number, the end of a comment, or
     the end of a line when the next line does not go on with the sentence). The decision, and why:
     this repository wrote its credited quotes both ways round, and the last one a review found was
     of this kind (a quote, a comma, the credit and a date), so a credit after the quote is red. When
     the credit after a dash begins a clause of its own, as in a sentence that goes on to say what he
     had already decided about the quoted thing, it is a sentence about him rather than a credit of
     the words, and it stays green: the after-quote shape is kept to attributions so that ordinary
     prose is not red. Four more ways round are always attributions and are red: the comma or full
     stop inside the closing mark and then the owner said (or said the owner); a date straight after
     the quote and then the credit; he said, he asked or his words after a dash, a comma or a
     bracket, whatever follows them; and a code string whose trailing comment holds the credit and a
     date.
   - CREDIT, THEN ITALICS. A credit, within the same window, a colon and straight away a run in
     italics: a quote written without its marks. Bold is not italics, but bold beside the italics does
     not hide them: a label in bold that closes right after the colon, then italics, is red, and so is
     a run in bold italics. This run, and the bold one below, opens on a letter or a digit, accented or
     not, on a Spanish opening mark, or on a dash or an ellipsis (three dots, not one, so a glob after
     a colon stays green).
   - CREDIT, DATE, BOLD INSIDE ITALICS. A credit, a date, a colon and straight away a run in bold,
     inside an italic line (an odd number of single asterisks, or of underscores outside a word, before
     the credit, in its line and every line above it in the same paragraph, leaving out what stands in
     a code span): an italic note that sets his words in bold. Bold outside italics, bold later in the
     line, and a bold heading that closes right after the colon stay green.
   - CREDIT, DATE, QUOTE OVER LINES. A credit, a date and an opening quote mark in ONE sentence that
     runs over up to BREAKS line breaks and LONG characters, with no blank line in it: a quote whose
     credit stands two lines above it.
   - A CREDIT BESIDE A REVIEWED LINE. A reviewed line that is no hit itself (game text, below) turns
     red when a credit is put on the line just above it or just below it: the credit would make the
     reader take that line for his words.
   A window crosses at most one line break (with one blank line, so a quoted block under a heading is
   read) and never a quote mark, a table cell, the end of a sentence or the end of a comment: a
   credit and a quote in two sentences are two things. An opening quote mark is a curly or straight
   double quote, a guillemet, a low double quote or a curly single opening mark, after a space, an
   opening bracket or a dash, with a word right after it, and it may be escaped with a backslash, as
   it is inside a JSON string. Marks written as HTML entities, by name or by number, are read as the
   marks they stand for. A straight quote that closes a code string, one right after a colon with no
   space (a code key), and one inside a code span in backticks are not opening ones, which is why game
   text in code strings, where a character is a shop's owner, stays green. Straight single quotes are
   not read: code is full of them, and none of the several hundred quotes of his that were taken out
   used them. The curly single closing mark is not read either, because it is also the apostrophe.

   A hit fails the build, named by file:line and by shape, NEVER by the quoted words: printing them in
   a public log would publish them again.

   THE REVIEWED LIST (REVIEWED below) holds the lines that may stay: each is a file, a short
   fingerprint of the line (of every line the hit spans), and the reason a person gave. Editing the
   line changes its fingerprint, so the edited line is judged again, and the stale entry is red too
   until it is taken off: the list can only describe lines that are really there. To review a line:
   node test/quotes.js --list prints each hit with its fingerprint (never its words).

   BEFORE THE PUSH. CI reads a branch after a push has already published it, and a quote added in one
   commit and taken out in the next stays in the public history and in the pull request's refs, with
   the tip green. So the plain run reads the untracked files git would add as well as the tracked
   ones, and --unpushed reads what a push would publish: the working tree, and every commit on HEAD
   that no remote-tracking branch holds, where a commit counts only the hits that none of its parents
   held in the same file (those are already public, or are judged as commits of their own). A stale
   entry on the reviewed list publishes nothing, so --unpushed does not count it; the plain run does.
   THE HOOK (.claude/settings.json, beside the address hook) hands every Bash command to --hook before
   it runs: anything but a git push passes untouched, and a push is refused (exit 2) when --unpushed is
   red, or when it has not finished in LIMIT_S seconds. Its sentence names file:line, never the words.
   It reads this checkout, the one that holds this file, whichever repository the push names.
   ON A PULL REQUEST. --range <a>..<b> reads what a pull request brings in the same way: every commit
   <b> holds and <a> does not, where a commit counts only the hits none of its parents held, and the
   files at <b>, its tip. CI runs it from the merge's first parent to its second (HEAD^1..HEAD^2), so a
   quote added in one commit and taken out in the next is red there too. CI reads after the push, so a
   red there means the quote is already public; the hook is what stops it first. A range with no
   commit in it, or one git cannot read, is a red with a sentence, never a pass, and so is a range
   asked of a shallow clone, whose history stops at its cut.

   What it cannot do: catch his words without a credit beside them, or a paraphrase. Those are a
   person's reading. It cannot see a push made by another program, or a write through a connector.
   And it cannot take back what is already in the public history.

   Run:  node test/quotes.js              (the tracked files, and the untracked ones git would add)
         node test/quotes.js --list       (every hit, its fingerprint, and whether it is reviewed)
         node test/quotes.js --rev <ref>  (the tracked files of another commit, e.g. origin/main)
         node test/quotes.js --unpushed   (what a push would publish: the working tree and every commit no remote holds)
         node test/quotes.js --range <a>..<b>  (what a pull request brings: every commit in the range, and the files at its tip)
         node test/quotes.js --hook       (Claude Code's PreToolUse hook: the command on stdin; a push --unpushed finds red is refused)
         node test/quotes.js --selftest   (made-up text, assembled at run time, none of it in this file; and the
                                           hook and the range, each run on a repository the self-test makes in a
                                           temporary folder) */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');

const WINDOW = 32;          /* characters between the credit and the quote mark, a line break aside */
const DATED = 56;           /* the same when a date stands between them, as in a credit, a date and a colon */
const BEFORE = 30;          /* how far before a credit a date still makes the hit a dated one */
const LONG = 400;           /* the longest sentence the over-lines shape reads, from a credit to a quote mark */
const BREAKS = 3;           /* and the most line breaks in it */

/* the pieces, written as plain strings so that no line of this file is itself a hit */
const QCH = '"“«„';            /* the opening marks: straight, curly, guillemet, low */
const CCH = '"”»';                  /* the closing marks */
const OCH = QCH + '‘';                        /* a curly single opening mark opens a quote too; it never closes one (that is the apostrophe) */
/* a window never crosses a quote mark, a table cell, a line end, the end of a comment, or the end of
   a sentence (a credit and a quote in two sentences are two things); a code span in backticks is
   one step of it, so a quote mark inside code is never an opening one */
const GAP = '(?:`[^`\\n]*`|(?![.!?;][*_)\\]]*(?:\\s|$)|\\*\\/)[^' + QCH + CCH + '`|\\n])';
const PREFIX = '[ \\t]*(?:\\/\\/+|\\/?\\*+|#+|>+|-|\\+)?[ \\t]*';               /* a comment, quote or list prefix */
const BREAK = '(\\n(?:' + PREFIX + '\\n)?' + PREFIX + ')';      /* one line break, and at most one blank line with it */
/* an opening mark after a space, a bracket, a dash or the start; italics, and the backslash of a JSON string, may stand before it */
const OPEN = '(?<=[\\s(\\u2014\\u2013>]|^)[*_]*\\\\?[' + OCH + '](?![\\s,;.:)\\]}\'' + CCH + '\\\\])';
const CLOSE = '(?<=[^\\s' + QCH + '])[' + CCH + '](?<!\\\\.)[*_]*';
/* the first character of a run in italics or in bold: a letter or a digit, accented or not, an
   inverted opening mark (¡ ¿), a dash or an ellipsis (a quoted fragment, a line of Spanish dialogue).
   Without the u flag \w is ASCII only, so a run that opened on an accented capital or on ¿ was not read.
   Three dots count as an ellipsis, one dot does not, so a glob such as *.md after a colon stays green */
const RUN_START = '(?:[\\w\\u00A1\\u00BF\\u00C0-\\u024F\\u2014\\u2026]|\\.\\.\\.)';
const DATE = '\\b(?:19|20)\\d\\d-\\d\\d-\\d\\d\\b';
const NOUNS = 'word|words|wording|ask|asks|request|reply|answer|note|line|phrase|instruction|question|report|' +
  'call|ruling|verdict|pick|brief|order|comment|message|correction|wish|idea|rule|reason|complaint';
/* "owner", not a longer word and not a file name such as the rules document */
const OWNER = '\\b(?:the\\s+|our\\s+)?owner(?:[\'\\u2019]s(?:\\s+own)?(?:\\s+(?:' + NOUNS + ')\\b)?)?(?![\\w-]|\\.\\w)';
const HE = '\\bhe\\s+(?:said|asked|wrote|added|answered|replied|put\\s+it|called\\s+it)\\b|\\bhis\\s+(?:own\\s+)?words\\b|\\bas\\s+he\\s+put\\s+it\\b';
const CREDIT = '(?:' + OWNER + '|' + HE + ')';
const SAYS = '(?:said|asked|wrote|added|answered|replied)';
const hasDate = s => new RegExp(DATE).test(s);
/* the whole lines a match stands on, to look for its date */
const linesOf = (t, from, to) => { const e = t.indexOf('\n', to); return t.slice(t.lastIndexOf('\n', from - 1) + 1, e < 0 ? t.length : e); };
/* the window, measured: WINDOW characters, or DATED when a date stands in it */
const measured = (t, m, gap) => {
  const dated = hasDate(gap) || hasDate(t.slice(Math.max(0, m.index - BEFORE), m.index).split('\n').pop());
  return gap.length <= (hasDate(gap) ? DATED : WINDOW) ? { dated } : null;
};

/* The over-lines shape is read step by step, not by one long pattern (one pattern that long never
   finished on main). From the end of a credit, up to LONG characters and BREAKS line breaks, to an
   opening mark, crossing no blank line, no quote mark, no table cell and no end of a sentence or of a
   comment. A date in that span, or just before the credit in the same sentence, is needed. It says
   where the mark is. */
const OPEN_AT = new RegExp(OPEN, 'y');
const STOP_AT = /[.!?;][*_)\]]*(?:\s|$)|\*\//y;
const BLANK = new RegExp('^' + PREFIX + '$');
const dateJustBefore = (t, at) => {
  const back = t.slice(Math.max(0, at - BEFORE), at).split('\n').pop(), all = back.match(new RegExp(DATE, 'g'));
  return !!all && !/[.!?;][*_)\]]*(?:\s|$)|\*\//.test(back.slice(back.lastIndexOf(all[all.length - 1]) + 10));
};
function overLines(t, at, from) {
  const stop = Math.min(t.length, from + LONG);
  let breaks = 0;
  for (let i = from; i < stop; i++) {
    const c = t[i];
    if (c === '\n') {
      const j = t.indexOf('\n', i + 1);
      if (++breaks > BREAKS || BLANK.test(t.slice(i + 1, j < 0 ? t.length : j))) return null;
      continue;
    }
    if (c === '`') { const j = t.indexOf('`', i + 1); if (j < 0 || j >= stop || t.slice(i, j).includes('\n')) return null; i = j; continue; }
    if (c === '|') return null;
    STOP_AT.lastIndex = i; if (STOP_AT.test(t)) return null;
    if ('*_\\'.includes(c) || OCH.includes(c)) {
      OPEN_AT.lastIndex = i;
      if (OPEN_AT.test(t)) {
        return hasDate(t.slice(from, i)) || dateJustBefore(t, at) ? { dated: true, to: i } : null;
      }
    }
    if (QCH.includes(c) || CCH.includes(c)) return null;
  }
  return null;
}

/* whether a place stands inside italics: the single asterisks before it, or the underscores that stand
   outside a word, in its own line and in every line above it in the same paragraph (back to a blank
   line or the start of the file), are odd in number, however long the paragraph. Bold's pairs (** and
   __) are not counted, nor a mark inside a code span in backticks, where markdown reads no emphasis,
   nor a comment's, a quote's or a list's leading mark (a leading asterisk counts only with a word right
   after it). An underscore inside a word, as in a name, is not italics */
const LEAD = /^[ \t]*(?:\/\/+|\/\*+|#+|>+|[-+]|\*+(?=[ \t]))?[ \t]*/;
function inItalics(t, at) {
  let from = t.lastIndexOf('\n', at - 1) + 1;
  while (from > 0) {
    const s = t.lastIndexOf('\n', from - 2) + 1;
    if (s >= from || BLANK.test(t.slice(s, from - 1))) break;
    from = s;
  }
  const back = t.slice(from, at).split('\n').map(l => l.replace(LEAD, '').replace(/`[^`]*`/g, '')).join('\n');
  return (back.replace(/\*\*/g, '').match(/\*/g) || []).length % 2 === 1 ||
    (back.replace(/__/g, '').match(/(?<!\w)_|_(?!\w)/g) || []).length % 2 === 1;
}

const SHAPES = [
  /* credit, a window, at most one line break, a window, an opening mark; the window is measured here */
  ['credit then quote', new RegExp(CREDIT + '(' + GAP + '{0,' + DATED + '}?)' + BREAK + '?(' + GAP + '{0,' + DATED + '}?)' + OPEN, 'gi'),
    (t, m) => measured(t, m, m[1] + m[3])],
  /* a date, then straight away a quote, with a credit just before the date (even a sentence before) */
  ['credit, date, quote', new RegExp(DATE + '[ \\t]*[:,\\u2014\\u2013-]?[ \\t]*' + BREAK + '?' + OPEN, 'gi'),
    (t, m) => {
      const back = t.slice(Math.max(0, m.index - BEFORE * 2), m.index).split('\n').slice(-2).join('\n');
      return new RegExp(CREDIT, 'i').test(back) ? { dated: true } : null;
    }],
  /* his ask, his note, his instruction (one of the nouns after his), a date, then straight away a quote */
  ['credit, date, quote', new RegExp('\\bhis\\s+(?:own\\s+)?(?:' + NOUNS + ')\\b[ \\t]*[,(]?[ \\t]*' + DATE + '[ \\t]*[:,)\\u2014-]*[ \\t]*' + BREAK + '?' + OPEN, 'gi'),
    () => ({ dated: true })],
  /* a closing mark, a comma, dash or bracket, and the credit as the attribution: a date, said or
     asked, or nothing more in its clause (the end of a line counts only when the next line does not
     go on with the sentence; before a closing bracket, the credit may carry a noun of its own) */
  ['quote then credit', new RegExp(CLOSE + '\\s*(?:,|\\u2014|\\u2013|--?|\\()\\s*\\(?' + CREDIT +
    '(?:[,\\s]*\\(?' + DATE + '|\\s+(?:said|asked)\\b|\\s*(?:[).,;\\]]|\\*\\/|#\\d|$(?!\\n' + PREFIX + '[a-z]))|(?:\\s+\\w+){1,2}\\s*(?:[)\\]]|\\*\\/))', 'gim'),
    (t, m) => ({ dated: hasDate(m[0]) })],
  /* a comma or a full stop inside the closing mark, then the owner said, or said the owner */
  ['quote then credit', new RegExp('[,.!?]' + CLOSE + '[ \\t]+(?:' + OWNER + '[ \\t]+' + SAYS + '\\b|said[ \\t]+' + OWNER + ')', 'gi'),
    (t, m) => ({ dated: hasDate(linesOf(t, m.index, m.index + m[0].length)) })],
  /* a closing mark, a date straight after it, then the credit */
  ['quote then credit', new RegExp(CLOSE + '[ \\t]*[(,\\u2014\\u2013-][ \\t]*' + DATE + '[, \\t]+' + CREDIT, 'gi'),
    () => ({ dated: true })],
  /* a closing mark, a comma, dash or bracket, then he said, he asked or his words, whatever follows */
  ['quote then credit', new RegExp(CLOSE + '[ \\t]*(?:,|\\u2014|\\u2013|--?|\\()[ \\t]*(?:' + HE + ')', 'gi'),
    (t, m) => ({ dated: hasDate(linesOf(t, m.index, m.index + m[0].length)) })],
  /* a code string, and a trailing comment that holds the credit and a date */
  ['quote then credit', new RegExp(CLOSE + '[ \\t]*[;),]*[ \\t]*(?:\\/\\/+|\\/\\*+|#)[ \\t]*' + CREDIT + '[, \\t]*\\(?' + DATE, 'gi'),
    () => ({ dated: true })],
  /* a credit, the same window, a colon and straight away italics (bold is not italics). Bold that closes
     right after the colon (a label in bold) or opens around the italics (bold italics) stands aside */
  ['credit then italics', new RegExp(CREDIT + '(' + GAP + '{0,' + DATED + '}?):(?:\\*\\*)?[ \\t]*(?:\\*\\*)?[*_](?![\\s*_])(?=' + RUN_START + ')', 'gi'),
    (t, m) => measured(t, m, m[1])],
  /* a credit, a date, a colon and straight away bold, inside an italic line: his words set in bold in
     an italic note. Bold outside italics, and a bold heading that closes after the colon, stay green */
  ['credit, date, bold inside italics', new RegExp(CREDIT + '(' + GAP + '{0,' + DATED + '}?):[ \\t]*\\*\\*(?![\\s*])(?=' + RUN_START + ')', 'gi'),
    (t, m) => { const k = measured(t, m, m[1]); return k && k.dated && inItalics(t, m.index) ? k : null; }],
  /* a credit, a date and an opening mark in one sentence, over up to BREAKS line breaks */
  ['credit, date, quote over lines', new RegExp(CREDIT, 'gi'),
    (t, m) => overLines(t, m.index, m.index + m[0].length)],
];

const fp = text => crypto.createHash('sha256').update(text).digest('hex').slice(0, 10);

/* marks written as HTML entities are read as the marks: by name, or by number when the number is a mark */
const NAMED = { ldquo: '“', rdquo: '”', quot: '"', laquo: '«', raquo: '»', bdquo: '„', lsquo: '‘' };
const ENTITY = /&(ldquo|rdquo|quot|laquo|raquo|bdquo|lsquo);|&#(?:[xX]([0-9a-fA-F]{1,6})|(\d{1,7}));/gi;
const MARKS = QCH + CCH + OCH;
const decode = s => s.indexOf('&') < 0 ? s : s.replace(ENTITY, (e, name, hex, dec) => {
  if (name) return NAMED[name.toLowerCase()];
  const n = hex != null ? parseInt(hex, 16) : parseInt(dec, 10);
  const c = n > 0 && n <= 0x10FFFF ? String.fromCodePoint(n) : '';
  return c && MARKS.includes(c) ? c : e;
});

/* REVIEWED: [file, fingerprint, reason]. A person adds an entry after reading the line; a session
   that adds one says so in its pull request. Game text needs no entry: a shop owner or a column
   label in a code string closes its string, so it is not an opening quote (the self-test holds it). */
const REVIEWED = [
  ['content/meridian/strings.js', '65cf250c85', 'game text players read (the petal lines, English); the owner decided on 2026-10-17 that it stays. Not a hit: kept here so the decision stays visible, and editing the line takes it off'],
  ['content/meridian/strings.js', '770bdb0196', 'the same game text in Spanish; it moves with the English line'],
  ['scripts/clean-copy.js', '6a22bec318', 'a self-test fixture: a made-up credit, date and word, built at run time'],
  ['scripts/clean-copy.js', 'c817b616bb', 'the same fixture, its expected result'],
  ['docs/rooms/2026-09-13-two-storeys-with-a-mural.md', 'aeac102307', 'a room note\'s opening line: what was asked and noted, reported in the third person with its date; the bold marks the note\'s summary, not a quote'],
  ['.claude/agents/lupe.md', '642c7a7c0e', 'a persona file\'s dated note of what was asked, set in italics after a colon; an existing line, kept as it is under the forward rule (new work is checked, and lines already on main are left as they stand); a new line of this shape is refused'],
  ['.claude/skills/stairs/SKILL.md', 'd7d93710ff', 'a skill\'s opening note, in italics, of the dated instruction it was opened on, its summary in bold; an existing line, kept as it is under the forward rule; a new line of this shape is refused'],
  ['docs/3D-LOG.md', 'feee5ed65e', 'a log entry\'s dated statement of the standing goal, in italics after a bold label; an existing line, kept as it is under the forward rule; a new line of this shape is refused'],
  ['docs/rooms/2026-09-12-two-visible-storeys.md', 'd693a200bc', 'a room note\'s opening line: what was asked, with its date, its summary in bold inside the italics; an existing line, kept as it is under the forward rule; a new line of this shape is refused'],
  ['engine/engine3d.js', '254386d015', 'a code comment that gives the dated reason for the side views, in quote marks with the credit after them; an existing line, kept as it is under the forward rule; a new line of this shape is refused'],
];

/* every hit in the files: { file, line, end, shape, dated, fp } — never the words. The shapes read the
   text with its entities decoded; a fingerprint is always of the lines as they stand in the file */
function find(files) {
  const hits = [];
  files.forEach(({ file, text: raw }) => {
    if (raw == null) return;
    const lines = raw.split('\n'), text = decode(raw);
    const starts = [0]; for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
    const lineOf = at => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= at) lo = mid; else hi = mid - 1; } return lo; };
    const seen = new Set();
    SHAPES.forEach(([shape, re, keep]) => {
      re.lastIndex = 0; let m;
      while ((m = re.exec(text))) {
        const k = keep(text, m);
        re.lastIndex = m.index + 1;
        if (!k) continue;
        const a = lineOf(m.index), b = lineOf(k.to != null ? k.to : m.index + Math.max(0, m[0].length - 1));
        if (seen.has(a)) continue;      /* one hit per line: the first shape that finds it names it */
        seen.add(a);
        hits.push({ file, line: a + 1, end: b + 1, shape, dated: k.dated, fp: fp(lines.slice(a, b + 1).join('\n')) });
      }
    });
  });
  return hits.sort((x, y) => x.file < y.file ? -1 : x.file > y.file ? 1 : x.line - y.line);
}

/* the verdict: the hits not on the list, and the entries that describe no line that is there. A
   reviewed line that is no hit itself, with a credit on the line above or below it, is a fresh hit */
function judge(files, reviewed) {
  const hits = find(files);
  const byFile = new Map(files.map(f => [f.file, f]));
  const ok = new Set(reviewed.map(([file, print]) => file + '\u0000' + print));
  const fresh = hits.filter(h => !ok.has(h.file + '\u0000' + h.fp));
  const credit = new RegExp(CREDIT, 'i');
  reviewed.forEach(([file, print]) => {
    const f = byFile.get(file);
    if (!f || f.text == null || hits.some(h => h.file === file && h.fp === print)) return;
    const lines = f.text.split('\n');
    lines.forEach((l, i) => {
      if (fp(l) !== print) return;
      const near = [lines[i - 1], lines[i + 1]].filter(x => x != null).join('\n');
      if (credit.test(decode(near)))
        fresh.push({ file, line: i + 1, end: i + 1, shape: 'a credit beside a reviewed line', dated: hasDate(near), fp: print });
    });
  });
  const stale = reviewed.filter(([file, print]) => {
    const f = byFile.get(file);
    if (!f || f.text == null) return true;
    if (hits.some(h => h.file === file && h.fp === print)) return false;
    return !f.text.split('\n').some(l => fp(l) === print);
  });
  fresh.sort((x, y) => x.file < y.file ? -1 : x.file > y.file ? 1 : x.line - y.line);
  return { hits, fresh, stale };
}

const say = h => h.file + ':' + h.line + (h.end > h.line ? '-' + h.end : '') + ' — ' + (h.dated ? 'a dated' : 'an undated') +
  ' quote credited to the owner (' + h.shape + ', fingerprint ' + h.fp + ')';

/* the files of a commit, or without one what git could ship: every tracked file, and every untracked
   one that is not ignored, because an untracked file is published the moment it is added and pushed */
function trackedFiles(root, rev) {
  const run = (...a) => execFileSync('git', a, { cwd: root, maxBuffer: 256 * 1024 * 1024 });
  const list = (rev ? run('ls-tree', '-r', '-z', '--name-only', rev) : run('ls-files', '-z', '--cached', '--others', '--exclude-standard')).toString('utf8').split('\0').filter(Boolean);
  return [...new Set(list)].map(file => {
    let buf;
    try { buf = rev ? run('show', rev + ':' + file) : fs.readFileSync(path.join(root, file)); } catch (e) { return null; }
    return { file, text: buf.subarray(0, 8000).includes(0) ? null : buf.toString('utf8') };
  }).filter(Boolean);
}

/* the commits rev-list names, each with the files it changed, as they stand in it and in each of its
   parents (a root commit: all of them) */
function commitsOf(root, revs) {
  const git = (...a) => execFileSync('git', a, { cwd: root, maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  /* git show of a blob gives its plain bytes, as trackedFiles reads them; it is asked that way, not with
     git's raw object reader, because test/authors.js counts any script that calls that as a reader of
     whole commits, which hand back who made them */
  const blob = (rev, file) => {
    let b; try { b = git('show', rev + ':' + file); } catch (e) { return null; }   // not in that commit
    return b.subarray(0, 8000).includes(0) ? null : b.toString('utf8');
  };
  return git('rev-list', '--parents', ...revs).toString('utf8').split('\n').filter(Boolean).map(row => {
    const [sha, ...parents] = row.split(' ');
    const names = parents.length
      ? parents.flatMap(p => git('diff-tree', '-r', '-z', '--name-only', '--no-renames', p, sha).toString('utf8').split('\0'))
      : git('ls-tree', '-r', '-z', '--name-only', sha).toString('utf8').split('\0');
    return { sha, files: [...new Set(names.filter(Boolean))].map(file => ({ file, text: blob(sha, file), before: parents.map(p => blob(p, file)) })) };
  });
}
/* the commits a push would publish: every commit on HEAD that no remote-tracking branch holds */
const unpushedCommits = root => commitsOf(root, ['HEAD', '--not', '--remotes']);

/* the commits a pull request brings, <a>..<b>: every commit <b> holds and <a> does not, and the files
   at <b>, its tip. Anything else (no two dots, a side git does not know, a side that is no commit, an
   option in place of a commit) is null, and the caller says so in a sentence: it is never read as
   a range of nothing */
function rangeOf(root, spec) {
  const sides = typeof spec === 'string' ? spec.split('..') : [];
  if (sides.length !== 2 || sides.some(x => !x || /^[-.^]/.test(x) || /\s/.test(x))) return null;
  const sha = rev => { try { return execFileSync('git', ['rev-parse', '--verify', '-q', rev + '^{commit}'], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8').trim(); } catch (e) { return null; } };
  const [a, b] = sides.map(sha);
  if (!a || !b) return null;
  return { a, b, commits: commitsOf(root, [b, '^' + a]), tip: trackedFiles(root, b) };
}

/* what a push would publish that is new, as sentences that name file:line and never the words: the
   working tree's fresh hits, and in each commit the fresh hits that none of its parents held in the
   same file. tree: [{ file, text }]; commits: [{ sha, files: [{ file, text, before: [text per parent] }] }].
   The range reads the same way, with the files at its tip in place of the working tree */
function unpushedVerdict(tree, commits, reviewed, where) {
  const P = judge(tree, reviewed).fresh.map(h => (where || 'the working tree') + ': ' + say(h));
  commits.forEach(c => {
    const was = new Set(), parents = Math.max(0, ...c.files.map(f => f.before.length));
    for (let k = 0; k < parents; k++)
      judge(c.files.map(f => ({ file: f.file, text: f.before[k] })), reviewed).fresh.forEach(h => was.add(h.file + '\u0000' + h.fp));
    judge(c.files.map(f => ({ file: f.file, text: f.text })), reviewed).fresh
      .filter(h => !was.has(h.file + '\u0000' + h.fp))
      .forEach(h => P.push('commit ' + c.sha.slice(0, 7) + ': ' + say(h)));
  });
  return P;
}

/* the made-up pieces every case is built from, put together at run time so that no line of this
   file is a hit */
function madeUp() {
  const q = String.fromCharCode(0x22), lq = String.fromCharCode(0x201C), rq = String.fromCharCode(0x201D);
  return { q, lq, rq, who: 'the ' + 'owner', day: '2001-02-03', words: 'paint the fence ' + 'teal' };
}

/* THE PLANTS: each way a review got past this check, as a made-up case that must be red at its line.
   They are exported, so a lab can run the same cases against an older copy of this file's judge(). */
function plants() {
  const { q, who, day, words } = madeUp();
  const bs = String.fromCharCode(0x5C), amp = String.fromCharCode(0x26);
  const at = (fix, what, text, line, file) => ({ fix, what, files: [{ file: file || 'docs/n.md', text }], reviewed: [], line });
  const game = '  petal: ' + q + words + q + ',';
  return [
    at('A', 'his instruction, a date and a quote, inside italics and a bracket', 'one\n*(H' + 'is instruction, ' + day + ': ' + q + words + '.' + q + ')*\n', 2, '.claude/agents/x.md'),
    at('A', 'his note with the date in brackets', 'one\nH' + 'is note (' + day + '): ' + q + words + q + '\n', 2),
    at('B', 'a comma inside the quote, then the owner said and a date', 'one\n' + q + words + ',' + q + ' ' + who + ' said on ' + day + '.\n', 2, 'engine/x.js'),
    at('B', 'the same in a test message, in a template string', 'one\nproblems.push(`' + q + words + ',' + q + ' ' + who + ' said on ' + day + ', and it is ${x}`);\n', 2, 'test/x.js'),
    at('B', 'a full stop inside the quote, then said the owner', 'one\n' + q + words + '.' + q + ' said ' + who + '.\n', 2),
    at('C', 'a quote, then a date in brackets, then the credit', 'one\n' + q + words + q + ' (' + day + ', ' + who + ').\n', 2),
    at('D', 'a quote, a dash, then he said with more words after it', 'one\n' + q + words + q + ' — h' + 'e said it twice that week.\n', 2),
    at('E', 'a dated credit, a colon and italics, in a comment', 'one\n// The ' + 'owner, ' + day + ': *' + words + '*.\n', 2, 'engine/x.js'),
    at('E', 'the same in a table cell, with an issue number after', 'one\n| a | ' + who + ', ' + day + ': *' + words + '* (#15) |\n', 2),
    at('F', 'a credit and a date, and the quote two line breaks below them', 'one\nAsked for by ' + who + ' on ' + day + ', after he had walked the\nplaza twice with the new tables standing in it, and came back\nwith ' + q + words + q + '.\n', 2),
    at('G', 'a code string with the credit and a date in its trailing comment', 'one\nconst ASKED = ' + q + words + q + '; // ' + who + ', ' + day + '\n', 2, 'test/x.js'),
    at('H', 'a curly single opening mark after a dated credit', 'one\n' + who + ', ' + day + ': ‘' + words + '’\n', 2),
    at('J', 'a quote escaped inside a JSON string', '{\n  ' + q + 'why' + q + ': ' + q + 'the round tables (' + who + ', ' + day + ': ' + bs + q + words + bs + q + ')' + q + ',\n}\n', 2, 'test/x.json'),
    at('K', 'marks written as named HTML entities, in a comment', 'one\n<!-- ' + who + ', ' + day + ': ' + amp + 'ldquo;' + words + amp + 'rdquo; -->\n', 2, 'index.html'),
    at('K', 'the same with numbered entities', 'one\n<!-- ' + who + ', ' + day + ': ' + amp + '#8220;' + words + amp + '#x201D; -->\n', 2, 'index.html'),
    at('L', 'a dated credit, a colon and a quote in bold, inside an italic line that runs on', 'one\n*Asked by ' + who + ', ' + day + ': **' + words + ', and the long\ntables under them.***\n', 2),
    { fix: 'R', what: 'a credit put on the line above a reviewed game-text line',
      files: [{ file: 'content/x/strings.js', text: 'one\n/* ' + who + "'s own words, " + day + '; the line stays as he wrote it */\n' + game + '\n' }],
      reviewed: [['content/x/strings.js', fp(game), 'game text, for this test']], line: 3 },
    { fix: 'R', what: 'a credit put on the line below it',
      files: [{ file: 'content/x/strings.js', text: 'one\n' + game + '\n// h' + 'is words, kept as he wrote them\n' }],
      reviewed: [['content/x/strings.js', fp(game), 'game text, for this test']], line: 2 },
  ];
}

/* The hook, end to end: a repository made in a temporary folder, with copies of this file and of the
   push reader it shares with test/authors.js, a remote-tracking branch standing in for a push already
   made, and a made-up quote planted in each of the ways the review's table names. Git runs with no
   hooks and no signing of its own, and with no GIT_ variable from outside, so it reads only the lab. */
function hookCases(mark) {
  const os = require('os'), { spawnSync } = require('child_process');
  const { q, who, day, words } = madeUp();
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_/.test(k)));
  let tmp = null;
  try {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quotes-hook-'));
    const lab = path.join(tmp, 'lab');
    fs.mkdirSync(path.join(lab, 'test'), { recursive: true });
    ['quotes.js', 'authors.js'].forEach(f => fs.copyFileSync(path.join(__dirname, f), path.join(lab, 'test', f)));
    const git = (...a) => execFileSync('git', ['-c', 'user.name=lab', '-c', 'user.email=lab' + '@' + 'example.com', '-c', 'commit.gpgsign=false',
      '-c', 'core.hooksPath=' + path.join(tmp, 'no-hooks'), ...a], { cwd: lab, env, stdio: ['ignore', 'pipe', 'pipe'] });
    const put = (rel, text) => { fs.mkdirSync(path.dirname(path.join(lab, rel)), { recursive: true }); fs.writeFileSync(path.join(lab, rel), text); };
    const run = (args, input) => spawnSync(process.execPath, [path.join(lab, 'test', 'quotes.js'), ...args], { cwd: lab, env, input: input || '', encoding: 'utf8', timeout: 90000 });
    const hook = cmd => run(['--hook'], JSON.stringify({ tool_input: { command: cmd } }));
    const quiet = r => { const all = String(r.stdout) + String(r.stderr); return all.indexOf(words) < 0 && all.indexOf('teal') < 0; };
    const why = r => 'exit ' + r.status + (r.error ? ', ' + r.error.code : '') + ': ' + String(r.stderr || r.stdout).split('\n')[0];
    git('init', '-q');
    put('docs/a.md', 'one\n');
    git('add', '-A'); git('commit', '-q', '-m', 'one');
    git('update-ref', 'refs/remotes/origin/main', 'HEAD');
    let r = hook('git push -u origin lab');
    mark(r.status === 0, 'the hook: a clean head, pushed, passes (exit 0)', why(r));
    put('docs/notes.md', 'one\n\n' + who + ', ' + day + ': ' + q + words + q + '.\n');
    r = hook('ls -la');
    mark(r.status === 0, 'the hook: a command that is no push passes untouched, even with a quote planted (exit 0)', why(r));
    r = run([]);
    mark(r.status === 1 && r.stdout.indexOf('docs/notes.md:3 ') >= 0 && quiet(r), 'the plain run: an untracked plant is red (exit 1), named by file:line and never by its words', why(r));
    r = hook('git add -A && git commit -m notes && git push');
    mark(r.status === 2 && r.stderr.indexOf('PUSH REFUSED by test/quotes.js') === 0 && r.stderr.indexOf('the working tree: docs/notes.md:3 ') >= 0 && quiet(r),
      'the hook: a plant not yet committed, in a command that commits and pushes it, is refused (exit 2)', why(r));
    git('add', '-A'); git('commit', '-q', '-m', 'two');
    const two = git('rev-parse', '--short=7', 'HEAD').toString().trim();
    r = hook('git push origin HEAD');
    mark(r.status === 2 && r.stderr.indexOf('PUSH REFUSED by test/quotes.js') === 0 && r.stderr.indexOf('commit ' + two + ': docs/notes.md:3 ') >= 0 && quiet(r),
      'the hook: a committed plant, pushed, is refused (exit 2), named by commit and file:line and never by its words', why(r));
    fs.unlinkSync(path.join(lab, 'docs', 'notes.md'));
    git('add', '-A'); git('commit', '-q', '-m', 'three');
    r = run([]);
    mark(r.stdout.indexOf('docs/notes.md') < 0, 'the plain run no longer sees a plant taken out in a later commit (why the hook is needed)', why(r));
    r = hook('git push origin HEAD');
    mark(r.status === 2 && r.stderr.indexOf('commit ' + two + ': docs/notes.md:3 ') >= 0 && quiet(r),
      'the hook: a plant added and then taken out, pushed, is refused (exit 2), named by the commit that holds it', why(r));
    r = run(['--hook'], 'not json');
    mark(r.status === 2, 'the hook: input it cannot read runs the check, and the planted commit is still refused', why(r));
  } catch (e) {
    mark(false, 'the hook cases ran on a repository made for them', String(e.message).split('\n')[0]);
  } finally {
    if (tmp) try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
  }
}

/* The range, end to end, the way CI reads a pull request: a repository made in a temporary folder
   with a copy of this file, a made-up quote added in one commit and taken out in the next, and a merge
   checked out as a pull request's is, its first parent the base and its second the branch. */
function rangeCases(mark) {
  const os = require('os'), { spawnSync } = require('child_process');
  const { q, who, day, words } = madeUp();
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_/.test(k)));
  let tmp = null;
  try {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quotes-range-'));
    const lab = path.join(tmp, 'lab');
    fs.mkdirSync(path.join(lab, 'test'), { recursive: true });
    fs.copyFileSync(__filename, path.join(lab, 'test', 'quotes.js'));
    const git = (...a) => execFileSync('git', ['-c', 'user.name=lab', '-c', 'user.email=lab' + '@' + 'example.com', '-c', 'commit.gpgsign=false',
      '-c', 'core.hooksPath=' + path.join(tmp, 'no-hooks'), ...a], { cwd: lab, env, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    const put = (rel, text) => { fs.mkdirSync(path.dirname(path.join(lab, rel)), { recursive: true }); fs.writeFileSync(path.join(lab, rel), text); };
    const commit = msg => { git('add', '-A'); git('commit', '-q', '-m', msg); return git('rev-parse', 'HEAD'); };
    const run = args => spawnSync(process.execPath, [path.join(lab, 'test', 'quotes.js'), ...args], { cwd: lab, env, encoding: 'utf8', timeout: 90000 });
    const quiet = r => { const all = String(r.stdout) + String(r.stderr); return all.indexOf(words) < 0 && all.indexOf('teal') < 0; };
    const why = r => 'exit ' + r.status + (r.error ? ', ' + r.error.code : '') + ': ' + String(r.stdout || r.stderr).split('\n')[0];
    git('init', '-q');
    put('docs/a.md', 'one\n');
    const base = commit('one');
    put('docs/b.md', 'two\n');
    const clean = commit('clean');
    put('docs/notes.md', 'one\n\n' + who + ', ' + day + ': ' + q + words + q + '.\n');
    const two = commit('two');
    fs.unlinkSync(path.join(lab, 'docs', 'notes.md'));
    const three = commit('three');
    mark(main(trackedFiles(lab), [], true) === 0 && run([]).stdout.indexOf('docs/notes.md') < 0,
      'the plain run: a quote added in one commit and taken out in the next is not seen at the tip (green)', 'it was seen');
    let r = run(['--range', clean + '..' + three]);
    mark(r.status === 1 && r.stdout.indexOf('FAIL: ') === 0 && r.stdout.indexOf('commit ' + two.slice(0, 7) + ': docs/notes.md:3 ') >= 0 && quiet(r),
      'the range: a quote added in one commit and taken out in the next is red (exit 1), named by commit and file:line and never by its words', why(r));
    r = run(['--range', base + '..' + clean]);
    mark(r.status === 0 && r.stdout.indexOf('OK: 1 commit(s) in ') === 0, 'the range: a clean range is green (exit 0)', why(r));
    r = run(['--range', three + '..' + three]);
    mark(r.status === 1 && r.stdout.indexOf('FAIL: the range ') === 0 && r.stdout.indexOf(' holds no commit') > 0, 'the range: an empty range is red (exit 1), with a sentence that says so', why(r));
    r = run(['--range', 'no-such-branch..' + three]);
    mark(r.status === 1 && r.stdout.indexOf('FAIL: the range ') === 0 && r.stdout.indexOf(' could not be read') > 0, 'the range: a range git does not know is red (exit 1), with a sentence that says so', why(r));
    r = run(['--range', three]);
    mark(r.status === 1 && r.stdout.indexOf('FAIL: the range ') === 0 && r.stdout.indexOf(' could not be read') > 0, 'the range: one commit with no two dots is red (exit 1), with a sentence', why(r));
    r = run(['--range']);
    mark(r.status === 1 && r.stdout.indexOf('FAIL: the range ') === 0, 'the range: --range with nothing after it is red (exit 1), with a sentence', why(r));
    r = run(['--range', 'HEAD^1..HEAD^2']);
    mark(r.status === 1 && r.stdout.indexOf(' could not be read') > 0, 'the range: HEAD^1..HEAD^2 on a commit that is no merge is red (exit 1), with a sentence', why(r));
    git('checkout', '-q', '-b', 'base-moved', base);
    put('docs/c.md', 'three\n');
    commit('the base moves on');
    git('merge', '-q', '--no-ff', '-m', 'the pull request, merged onto its base', three);
    r = run(['--range', 'HEAD^1..HEAD^2']);
    mark(r.status === 1 && r.stdout.indexOf('commit ' + two.slice(0, 7) + ': docs/notes.md:3 ') >= 0 && quiet(r),
      'the range CI reads, HEAD^1..HEAD^2 on a merge checked out like a pull request: the quote in a middle commit is red', why(r));
    /* the same merge in a clone cut at depth 2 (what a checkout with fetch-depth: 2 holds), and in one at full depth */
    const clone = (...a) => execFileSync('git', ['-c', 'core.hooksPath=' + path.join(tmp, 'no-hooks'), 'clone', '-q', ...a], { cwd: tmp, env, stdio: ['ignore', 'pipe', 'pipe'] });
    const runIn = (dir, args) => spawnSync(process.execPath, [path.join(dir, 'test', 'quotes.js'), ...args], { cwd: dir, env, encoding: 'utf8', timeout: 90000 });
    clone('--depth', '2', 'file://' + lab, path.join(tmp, 'shallow'));
    clone('file://' + lab, path.join(tmp, 'full'));
    r = runIn(path.join(tmp, 'shallow'), ['--range', 'HEAD^1..HEAD^2']);
    mark(r.status === 1 && r.stdout.indexOf('FAIL: this clone is shallow') === 0 && r.stdout.indexOf('OK') < 0 && quiet(r),
      'the range in a clone at depth 2 is refused (exit 1) with a sentence, not read short', why(r));
    r = runIn(path.join(tmp, 'full'), ['--range', 'HEAD^1..HEAD^2']);
    mark(r.status === 1 && r.stdout.indexOf('commit ' + two.slice(0, 7) + ': docs/notes.md:3 ') >= 0 && quiet(r),
      'the range in a clone at full depth is read, and the quote in a middle commit is red', why(r));
  } catch (e) {
    mark(false, 'the range cases ran on a repository made for them', String(e.message).split('\n')[0]);
  } finally {
    if (tmp) try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
  }
}

function selftest() {
  let total = 0; const bad = [];
  const mark = (ok, what, why) => { total++; console.log((ok ? '  ok   ' : '  FAIL ') + what + (ok ? '' : '  (' + why + ')')); if (!ok) bad.push(what); };
  /* made-up words and a made-up date, put together here so that no line of this file is a hit */
  const { q, lq, rq, who, day, words } = madeUp();
  const one = (text, file) => find([{ file: file || 'docs/n.md', text }]);
  const red = (text, what, line) => {
    const h = one(text);
    mark(h.length === 1 && h[0].line === (line || 2) && say(h[0]).indexOf(words) < 0 && say(h[0]).indexOf('teal') < 0,
      what + ' is red, named by file:line and never by its words', JSON.stringify(h));
    return h[0];
  };
  const green = (text, what, file) => { const h = one(text, file); mark(h.length === 0, what + ' stays green', JSON.stringify(h)); };

  const d1 = red('one\n' + who + ', ' + day + ': ' + q + words + q + '\n', 'a dated credited quote');
  mark(d1 && d1.dated, 'and it is reported as dated', JSON.stringify(d1));
  const u1 = red('one\nas ' + who + ' asked for ' + lq + words + rq + ', the fence changed\n', 'an undated credited quote');
  mark(u1 && !u1.dated, 'and it is reported as undated', JSON.stringify(u1));
  red('one\nOn ' + day + ' ' + who + ' wrote back: ' + q + words + q + '\n', 'a date, then the credit, then the quote');
  red('one\nthe fence (' + who + "'s ask, #12: " + q + words + q + ')\n', 'the owner’s ask with an issue number between');
  red('one\n/* ' + who + ', ' + day + ':\n   ' + q + words + q + ' */\n', 'a credit whose quote runs onto the next comment line');
  red('one\nand h' + 'e said: ' + q + words + q + '\n', 'a quote after he-said');
  red('one\n(' + q + words + q + ', ' + 'owner ' + day + ')\n', 'a quote, then the credit and a date (credit after the quote)');
  red('one\n> ' + q + words + q + ' — ' + who + '\n', 'a quote, then a dash and the credit alone (an attribution)');
  red('one\n/* ' + q + words + q + ' — ' + who + "'s scope */\n", 'a quote, then the credit with a noun of its own, in a comment');
  red('one\nH' + 'is words, ' + day + ':\n\n> *' + q + words + q + '*\n', 'a credit, a blank line and a quoted block');
  red('one\nThe ' + 'owner thought about it for a week. ' + day + ': ' + q + words + q + '\n', 'a credit, a full stop, then a date and the quote');
  green('one\n*' + q + words + q + '* — ' + who + ' had already picked another colour.\n', 'a quote, then a dash and a clause about him (not an attribution)');
  green('one\n*' + q + words + q + '* — ' + who + '\nhad already picked another colour.\n', 'the same clause, broken after the credit');
  green('const SHOP={' + 'owner:' + q + 'Vero' + q + ',door:' + q + 'east' + q + '};\n', 'a code key named owner');
  green('one\nOWNER' + '.md says the sign reads ' + q + words + q + '\n', 'the rules document named by its file name');
  green('const N={vero:' + q + 'Vero · Owner, Limpieza' + q + ',sol:' + q + 'Sol' + q + '};\n' +
        'out:{r:' + q + 'mid' + q + ',concept:' + q + "The owner's units" + q + ',why:' + q + 'True, and unusable.' + q + '}\n' +
        'DX(' + q + 'Owner of record' + q + ', ' + q + 'Responsable' + q + ')\n', 'game text in code strings, a shop owner and a column label', 'content/x/quests.en.js');
  green('one\nthe check looks at ' + who + ' near `' + 'kind:' + q + 'water' + q + '` in code\n', 'a quote mark inside a code span');
  green('one\n' + who + ' asked for a fence the colour of the sea\n', 'a credit with no quote');
  green('one\n' + q + words + q + ' is what the sign says\n', 'a quote with no credit');
  green('one\n' + who + 'ship of the gate\n', 'a longer word that only starts with the credit');

  /* every way a review got past this check (THE PLANTS): each is red at its line, never named by its words */
  plants().forEach(p => {
    const { fresh } = judge(p.files, p.reviewed);
    const said = fresh.map(say).join('\n');
    mark(fresh.length === 1 && fresh[0].line === p.line && said.indexOf(words) < 0 && said.indexOf('teal') < 0,
      'fix ' + p.fix + ': ' + p.what + ' is red, named by file:line and never by its words', JSON.stringify(fresh));
  });
  /* and what those shapes leave alone */
  const game = '  petal: ' + q + words + q + ',';
  const entity = String.fromCharCode(0x26) + 'ldquo;';
  green('one\n' + who + ', ' + day + ": '" + words + "'\n", 'straight single quotes (code is full of them)');
  green('one\n' + q + 'Come in,' + q + ' said the shopkeeper on ' + day + '.\n', 'a comma inside a quote, then somebody else said');
  green('one\n' + who + ', ' + day + ': **' + words + '**\n', 'a credit, a colon and bold (not italics)');
  red('one\n*A note gathered over the week, and\nasked for by ' + who + ', ' + day + ': **' + words + '***\n', 'a dated credit, a colon and bold, inside italics opened on the line above', 3);
  red('one\n*A note from the walk,\nwritten up the morning after,\nwith the stalls in order\nand the lamps counted twice, asked by\n' + who + ', ' + day + ': **' + words + '***\n', 'the same with the italics opened four lines above the credit', 6);
  red('one\n*A note gathered over the week from `cards/*.md`, and\nasked for by ' + who + ', ' + day + ': **' + words + '***\n', 'the same with an asterisk in a code span inside the italics (markdown reads no emphasis there)', 3);
  red('one\n_A note gathered over the week, and\nasked for by ' + who + ', ' + day + ': **' + words + '**_\n', 'the same with the italics written with underscores', 3);
  green('one\nThe cards in `cards/*.md` are read, and\n' + who + ', ' + day + ': **' + words + '**\n', 'an asterisk in a code span, in the same paragraph as bold outside italics');
  green('one\nThe FENCE_COUNT stays at two, and\n' + who + ', ' + day + ': **' + words + '**\n', 'an underscore inside a name, in the same paragraph as bold outside italics');
  green('one\n*Asked by ' + who + ', ' + day + ': the fence first, and **two** gates beside it.*\n', 'bold that is not a quote: one word in bold, later in an italic line');
  green('one\n* ' + who + ', ' + day + ': **' + words + '**\n', 'a list item: a bullet, a dated credit, a colon and bold (no italics)');
  red('one\n*Asked by ' + who + ', ' + day + ': **¿' + words + '?***\n', 'a dated credit, a colon and bold that opens on an inverted question mark, inside italics');
  red('one\n' + who + ', ' + day + ': *Éste, ' + words + '*\n', 'a dated credit, a colon and italics that open on an accented capital (credit then italics)');
  red('one\n' + who + ', ' + day + ': ***' + words + '***\n', 'a dated credit, a colon and a run in bold italics (credit then italics)');
  red('one\n**' + who + ', ' + day + ':** *' + words + '*\n', 'a credit and a date in a bold label that closes after the colon, then italics (credit then italics)');
  red('one\n*Asked by ' + who + ', ' + day + ': **...' + words + '***\n', 'a dated credit, a colon and bold that opens on three dots, inside italics');
  red('one\n' + who + ', ' + day + ': *—' + words + '*\n', 'a dated credit, a colon and italics that open on a dash (credit then italics)');
  red('one\n' + who + ', ' + day + ': *…' + words + '*\n', 'a dated credit, a colon and italics that open on an ellipsis character (credit then italics)');
  green('one\n' + who + ' asked for these: *.md and *.js\n', 'a credit, a colon and a glob that opens on one dot');
  green('one\n*From the notes. **' + who + ', ' + day + ':** the fence comes first.*\n', 'a bold heading: the credit and the date in bold, closing after the colon, inside an italic line');  green('one\nAsked for by ' + who + ' on ' + day + '. He walked the plaza twice and\ncame back with ' + q + words + q + '.\n', 'a credit, a date and a quote over lines, in two sentences');
  green('one\nAsked for by ' + who + ' on ' + day + ', after he had walked the\n\nplaza twice with the new tables standing in it, and came back with ' + q + words + q + '.\n', 'the same over a blank line');
  green('one\nAsked for by ' + who + ', after he had walked the plaza twice with the\nnew tables standing in it, and came back with ' + q + words + q + '.\n', 'the same over lines with no date anywhere');
  red('one\nOn ' + day + ' ' + who + ', after he had walked the plaza twice with the\nnew tables standing in it, came back with ' + q + words + q + '.\n', 'over lines, the date just before the credit in the same sentence');
  green('one\n/* the gate (a designer, ' + day + '; ' + who + ' agreed): a tall frame under an arch, and\n   at the top an empty sign that reads ' + q + words + q + '. */\n', 'over lines, the date in the sentence before the credit');
  green('one\nthe page prints ' + entity + 'x' + entity + ' for a mark, as ' + who + ' asked\n', 'an entity with no credit before it');
  const kLine = '<!-- ' + who + ', ' + day + ': ' + entity + words + ' -->';
  const k1 = judge([{ file: 'index.html', text: 'one\n' + kLine + '\n' }], []).fresh[0];
  mark(k1 && k1.fp === fp(kLine), 'a hit read through an entity is fingerprinted as the line stands in the file', JSON.stringify(k1));
  const rr = judge([{ file: 'content/x/strings.js', text: 'one\n// the petals, in English\n' + game + '\n' }], [['content/x/strings.js', fp(game), 'kept']]);
  mark(rr.fresh.length === 0 && rr.stale.length === 0, 'a reviewed game-text line with no credit beside it stays green', JSON.stringify(rr));

  /* the reviewed list: a listed line is green, the same line edited is red, and the stale entry too */
  const line = 'the fence (' + who + ': ' + q + words + q + ')';
  const listed = [['docs/n.md', fp(line), 'a made-up line, for this test']];
  const r1 = judge([{ file: 'docs/n.md', text: 'one\n' + line + '\n' }], listed);
  mark(r1.hits.length === 1 && r1.fresh.length === 0 && r1.stale.length === 0, 'a line on the reviewed list stays green', JSON.stringify(r1));
  const r2 = judge([{ file: 'docs/n.md', text: 'one\n' + line.replace('fence', 'gate') + '\n' }], listed);
  mark(r2.fresh.length === 1 && r2.stale.length === 1, 'the same line edited is red, and its entry is stale', JSON.stringify(r2));
  const r3 = judge([{ file: 'docs/m.md', text: 'one\n' + line + '\n' }], listed);
  mark(r3.fresh.length === 1, 'the entry covers its own file only', JSON.stringify(r3));
  const plain = 'a line with no shape at all, kept on the list until a person decides';
  const r4 = judge([{ file: 'docs/n.md', text: plain + '\n' }], [['docs/n.md', fp(plain), 'kept']]);
  mark(r4.fresh.length === 0 && r4.stale.length === 0, 'an entry for a line that is there but is no hit is not stale', JSON.stringify(r4));
  const r5 = judge([{ file: 'docs/n.md', text: plain + ' (edited)\n' }], [['docs/n.md', fp(plain), 'kept']]);
  mark(r5.stale.length === 1, 'and once that line is edited its entry is stale', JSON.stringify(r5));
  mark(one('x', 'a.png').length === 0 && find([{ file: 'b.png', text: null }]).length === 0, 'a binary file is skipped', 'it was read');
  mark(main([], REVIEWED, true) === 1, 'zero files read is a red, not a pass', 'it passed');

  /* what a push would publish, on fixtures: a commit counts only what its parents did not hold */
  const quoted = 'one\n' + who + ', ' + day + ': ' + q + words + q + '\n', clean = [{ file: 'docs/a.md', text: 'one\n' }];
  const c1 = { sha: 'a'.repeat(40), files: [{ file: 'docs/n.md', text: quoted, before: [null] }] };
  const c2 = { sha: 'b'.repeat(40), files: [{ file: 'docs/n.md', text: null, before: [quoted] }] };
  mark(unpushedVerdict(clean, [], []).length === 0, 'a clean tree and no commit to push: nothing to refuse', 'it refused');
  const v1 = unpushedVerdict(clean, [c2, c1], []);
  mark(v1.length === 1 && v1[0].indexOf('commit aaaaaaa: docs/n.md:2 ') === 0 && v1.join('').indexOf(words) < 0,
    'a quote added in one commit and taken out in the next is red, named by commit and file:line', JSON.stringify(v1));
  const c3 = { sha: 'c'.repeat(40), files: [{ file: 'docs/n.md', text: quoted + 'two\n', before: [quoted] }] };
  mark(unpushedVerdict(clean, [c3], []).length === 0, 'a hit its parent already held is not counted again (it is public, or judged in that commit)', 'it was counted');
  mark(unpushedVerdict([{ file: 'docs/n.md', text: quoted }], [], []).length === 1, 'a hit in the working tree is red before it is committed', 'it passed');

  /* THE HOOK, on a real repository the self-test makes, one case for each row of the review's table */
  hookCases(mark);
  /* THE RANGE, on a real repository the self-test makes: what CI reads of a pull request */
  rangeCases(mark);
  if (bad.length) { console.log('FAIL: ' + bad.length + ' of ' + total); process.exit(1); }
  console.log('OK: ' + total + ' cases, made-up text only.');
  process.exit(0);
}

/* the run: 0 green, 1 red */
function main(files, reviewed, quiet) {
  const out = quiet ? () => {} : console.log;
  if (!files.length) { out('FAIL: no tracked text files were read, so nothing was checked; that is a red, not a pass'); return 1; }
  const { hits, fresh, stale } = judge(files, reviewed);
  if (fresh.length || stale.length) {
    if (fresh.length) {
      out('FAIL: ' + fresh.length + ' line(s) have the shape of a quote credited to the owner. His words are not published here: say in plain words what was asked, keeping its date, and drop the quote. If a line is not his words, a person reviews it and adds its file, fingerprint and reason to REVIEWED in test/quotes.js.');
      fresh.slice(0, 50).forEach(h => out('- ' + say(h)));
      if (fresh.length > 50) out('- … and ' + (fresh.length - 50) + ' more (node test/quotes.js --list)');
    }
    if (stale.length) {
      out('FAIL: ' + stale.length + ' entr' + (stale.length === 1 ? 'y' : 'ies') + ' on the reviewed list describe a line that is no longer there (edited or gone). Take each off REVIEWED in test/quotes.js; if the new line is a hit, it is reviewed again.');
      stale.forEach(([file, print]) => out('- ' + file + ' (fingerprint ' + print + ')'));
    }
    return 1;
  }
  const read = files.filter(f => f.text != null).length;
  out('OK: ' + read + ' text files read (tracked, and untracked ones git would add) for the shape of a quote credited to the owner; ' + hits.length + ' line(s) have it and all are on the reviewed list (' + reviewed.length + ' entries).');
  return 0;
}

/* A hook that never finishes refuses; it does not wave a push through (the address hook's rule).
   Measured on this branch on 2026-10-17, five runs of each on a four-core machine: the plain run takes
   about 0.4 s; --unpushed, which the hook runs, about 1.9 s with seven commits no remote holds; --range
   about 3 s over the same seven commits and about 5.3 s over fifteen, since it reads the tip's files
   from git rather than from the disk. The last two grow with the commits they read, so a long branch
   takes longer. 45 s is far above all of these and under the 60 s .claude/settings.json gives this
   hook, so the refusal is this file's own, in its own words. */
const LIMIT_S = 45;

if (require.main === module) {
  const argv = process.argv.slice(2);
  if (argv.includes('--selftest')) return void selftest();
  if (argv.includes('--hook')) {
    let input = ''; try { input = fs.readFileSync(0, 'utf8'); } catch (e) {}
    /* input it cannot read, or a push reader it cannot load, is not waved through: it runs the check */
    let cmd = null; try { cmd = ((JSON.parse(input) || {}).tool_input || {}).command; } catch (e) {}
    let isPush = null; try { ({ isPush } = require('./authors.js')); } catch (e) {}
    if (typeof cmd === 'string' && typeof isPush === 'function' && !isPush(cmd)) process.exit(0);
    const t0 = Date.now(), { spawnSync } = require('child_process');
    const r = spawnSync(process.execPath, [__filename, '--unpushed'], { cwd: ROOT, encoding: 'utf8', timeout: LIMIT_S * 1000, killSignal: 'SIGKILL' });
    if (r.error && r.error.code === 'ETIMEDOUT') {
      process.stderr.write('PUSH REFUSED by test/quotes.js — the quote check (node test/quotes.js --unpushed) was still running after ' +
        Math.round((Date.now() - t0) / 1000) + ' s. It was measured at 1.8 to 2.0 s with seven or eight commits no remote holds (2026-10-17, four cores), and it grows with the commits it reads; it was stopped, and cannot say what this push would publish.\n' +
        'Run `node test/quotes.js --unpushed` by hand to see where it sticks.\n');
      process.exit(2);
    }
    if (r.status === 0) process.exit(0);
    process.stderr.write('PUSH REFUSED by test/quotes.js — this push would publish a line with the shape of a quote credited to the owner. Each is named by file and line, never by its words.\n' +
      (r.stdout || '') + (r.stderr || ''));
    process.exit(2);
  }
  if (argv.includes('--unpushed')) {
    let tree, commits;
    try { tree = trackedFiles(ROOT); commits = unpushedCommits(ROOT); }
    catch (e) { console.log('FAIL: the working tree, or the commits no remote holds yet, could not be read, so this check cannot say what a push would publish; that is a red, not a pass'); process.exit(1); }
    if (!tree.length) { console.log('FAIL: no text files were read, so nothing was checked; that is a red, not a pass'); process.exit(1); }
    const P = unpushedVerdict(tree, commits, REVIEWED);
    if (P.length) {
      console.log('FAIL: ' + P.length + ' line(s) a push would publish have the shape of a quote credited to the owner.');
      P.slice(0, 50).forEach(p => console.log('- ' + p));
      if (P.length > 50) console.log('- … and ' + (P.length - 50) + ' more');
      console.log('Say in plain words what was asked, keeping its date. A quote in a commit stays in the public history once it is pushed, so it comes out of that commit before the push: a new branch from the last pushed commit, with the work brought over without it.');
      process.exit(1);
    }
    console.log('OK: ' + tree.filter(f => f.text != null).length + ' text files in the working tree and ' + commits.length + ' commit(s) no remote holds yet: nothing a push would publish has the shape of a quote credited to the owner.');
    process.exit(0);
  }
  if (argv.includes('--range')) {
    const spec = argv[argv.indexOf('--range') + 1];
    if (spec == null) { console.log('FAIL: the range is missing: --range needs <a>..<b>, two commits git knows, so nothing was checked; that is a red, not a pass'); process.exit(1); }
    /* a shallow clone ends its history at the cut, so a range read there stops short and looks clean */
    let shallow = null;
    try { shallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8').trim(); } catch (e) {}
    if (shallow !== 'false') {
      console.log(shallow === 'true'
        ? 'FAIL: this clone is shallow, so the commits of ' + spec + ' below its cut cannot be read and the range would stop short; fetch the whole history (on CI, fetch-depth: 0). Nothing was checked; that is a red, not a pass'
        : 'FAIL: git could not say whether this clone holds its whole history, so the range ' + spec + ' might stop short. Nothing was checked; that is a red, not a pass');
      process.exit(1);
    }
    let R;
    try { R = rangeOf(ROOT, spec); }
    catch (e) { console.log('FAIL: the range ' + spec + ' could not be read through, so this check cannot say what it brings; that is a red, not a pass'); process.exit(1); }
    if (!R) { console.log('FAIL: the range ' + spec + ' could not be read: it must be <a>..<b>, two commits git knows (on a pull request, the merge\'s first parent and its second), so nothing was checked; that is a red, not a pass'); process.exit(1); }
    if (!R.commits.length) { console.log('FAIL: the range ' + spec + ' holds no commit, so nothing it brings was read; that is a red, not a pass'); process.exit(1); }
    if (!R.tip.some(f => f.text != null)) { console.log('FAIL: no text files were read at the tip of ' + spec + ', so nothing was checked; that is a red, not a pass'); process.exit(1); }
    const P = unpushedVerdict(R.tip, R.commits, REVIEWED, 'the tip (' + R.b.slice(0, 7) + ')');
    if (P.length) {
      console.log('FAIL: ' + P.length + ' line(s) the commits of ' + spec + ' bring have the shape of a quote credited to the owner.');
      P.slice(0, 50).forEach(p => console.log('- ' + p));
      if (P.length > 50) console.log('- … and ' + (P.length - 50) + ' more');
      console.log('Say in plain words what was asked, keeping its date. A quote in a middle commit stays in the history a pull request publishes, even when a later commit takes it out, so it comes out of that commit: a new branch from the base, with the work brought over without it.');
      process.exit(1);
    }
    console.log('OK: ' + R.commits.length + ' commit(s) in ' + spec + ' and the ' + R.tip.filter(f => f.text != null).length + ' text files at its tip: nothing they bring has the shape of a quote credited to the owner.');
    process.exit(0);
  }
  const at = argv.indexOf('--rev'), rev = at >= 0 ? argv[at + 1] : null;
  if (at >= 0 && !rev) { console.log('usage: node test/quotes.js --rev <ref>'); process.exit(2); }
  let files;
  try { files = trackedFiles(ROOT, rev); }
  catch (e) { console.log('FAIL: the tracked files could not be listed, so nothing was checked; that is a red, not a pass'); process.exit(1); }
  if (argv.includes('--list')) {
    const { hits, fresh } = judge(files, REVIEWED);
    const ok = new Set(REVIEWED.map(([f, p]) => f + '\u0000' + p));
    hits.forEach(h => console.log((ok.has(h.file + '\u0000' + h.fp) ? 'reviewed  ' : 'NEW       ') + say(h)));
    fresh.filter(h => !hits.includes(h)).forEach(h => console.log('NEW       ' + say(h)));
    console.log(hits.length + ' hit(s) in ' + files.length + ' files');
    process.exit(0);
  }
  process.exit(main(files, REVIEWED));
}

module.exports = { find, judge, fp, REVIEWED, plants };
