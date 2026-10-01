#!/usr/bin/env node
/* R10 — WHAT WE ARE ABOUT TO PUBLISH. The security gate, run on the built artifact.
   (docs/REGRESSION.md §3. Registered 2026-09-10 after El Changarrito was found on the public
   internet. Owner: "this is a major risk and it could keep ya healthy too.")

   WHY THIS EXISTS AND WHY IT IS NOT R8. R8 was built on 2026-09-06 to close exactly this class —
   its stated gap was "a second public pack would go unscanned" — and the mechanism it chose was
   "derive the shell from the public index's script tags." That mechanism is what made it blind:
   changarrito/ is not loaded by index.html, so it was never in the scanned set, and the town shipped to GitHub Pages behind a green suite.
   **The fix for the last exposure was the cause of this one.** So R10 does not derive anything.
   It reads the directory we are about to upload and asks what is in it.

   THE RULE THIS FILE ENFORCES, in one line: the only honest question is what is inside the box,
   so check the box — never the recipe for packing it, and never the source tree it came from.

   Run:  node test/public.js _site
   Build the box first (the same commands .github/workflows/pages.yml runs):
     mkdir -p _site
     cp index.html shell.css sw.js sw-register.js frame-guard.js qr.js manifest.webmanifest icon-192.png icon-512.png _site/
     cp -r engine vendor _site/
     mkdir -p _site/content && cp -r content/meridian _site/content/                              */
const fs = require('fs'), path = require('path');
const site = process.argv[2];
if (!site) { console.error('usage: node test/public.js <site dir>'); process.exit(2); }
const fails = [], notes = [];

const walk = (d, base = '') => { let out = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const rel = base ? base + '/' + e.name : e.name;
    out = out.concat(e.isDirectory() ? walk(path.join(d, e.name), rel) : [rel]);
  } return out; };

let files = [];
try { files = walk(site); }
catch (e) { console.error('FAIL — there is no site to check at ' + site + ': ' + e.message); process.exit(1); }
const has = f => files.includes(f);
const read = f => fs.readFileSync(path.join(site, f), 'utf8');
const textFiles = files.filter(f => /\.(js|html|json|webmanifest|md|txt|css|svg)$/.test(f));

/* ---- 1 · nothing whose PRESENCE is private ------------------------------------------------- */
// Named rather than derived, because deriving is what failed. A directory added to this repo
// tomorrow is private by default: it is not on the allowlist in pages.yml, so it never arrives.
const NEVER = ['changarrito', 'docs', 'test', '.github', '.git', 'node_modules', '.claude', 'scripts'];
NEVER.forEach(d => { const hit = files.filter(f => f === d || f.startsWith(d + '/'));
  if (hit.length) fails.push('the upload contains ' + d + '/ — ' + hit.length + ' file(s), e.g. ' + hit[0]); });
/* ---- 1a · WHICH WORLDS ARE MEANT TO BE OUT HERE, by name --------------------------------------
   Added 2026-09-22, the day El Horno shipped and this file said "the upload is the public game and
   nothing else" about an upload holding TWO games. Everything above is a BLOCKLIST of six folder
   names; nothing here could see a whole new world arrive. The comment three lines up even reasons
   it away -- "a directory added tomorrow is private by default: it is not on the allowlist in
   pages.yml" -- which is a statement about the packing script, not a check on the box, and this
   file's own header says to check the box and never the recipe.
   So: name them. A pack under content/ that is not on this list is a world somebody published
   without deciding to, which is the exact shape of the fault that once put the private town on the
   internet. Adding a name here is the decision; the diff is where it gets noticed. */
const PUBLIC_WORLDS = ['meridian', 'horno'];
{
  const shipped = [...new Set(files.filter(f => f.startsWith('content/')).map(f => f.split('/')[1]).filter(Boolean))];
  if (!shipped.length) fails.push('the upload contains no content/ pack at all, so there is no game in it — and every check below about "the game" measured nothing');
  shipped.filter(w => !PUBLIC_WORLDS.includes(w))
    .forEach(w => fails.push('the upload publishes the world "' + w + '" and nobody put it on the public list — ' +
      'content/' + w + '/ is in the box and PUBLIC_WORLDS in test/public.js does not name it. Either it was meant to go out, and this list is where you say so, or the packing script grew a line nobody meant'));
  PUBLIC_WORLDS.filter(w => !shipped.includes(w))
    .forEach(w => fails.push('the public list names the world "' + w + '" and the upload does not contain it — either the packing script dropped it or it should come off this list'));
}

files.filter(f => /^(CLAUDE|README|AGENTS)\.md$|\.sh$|^\.env|(^|\/)\.[^/]+$/.test(f))
  .forEach(f => fails.push('the upload contains ' + f + ', which is the repository\'s business and nobody else\'s'));
files.filter(f => /\.map$|\.bak$|\.tmp|~$|\.orig$/.test(f))
  .forEach(f => fails.push('the upload contains ' + f + ' — a build leftover has no business on a public site'));

/* ---- 2 · nothing that CARRIES a credential surface ------------------------------------------ */
// The same four words test/smoke.js scans the source for, asked of what actually ships. A guard on
// the source cannot vouch for the artifact; that difference is the whole of E5.
const WORDS = ['api.github.com', 'net.local', 'github_pat', 'Authorization'];
textFiles.forEach(f => { const src = read(f);
  WORDS.forEach(w => { if (src.includes(w)) fails.push('the upload\'s ' + f + ' mentions "' + w + '" — the public build must not'); }); });
// and nothing that LOOKS like a secret even if it is not one of those four: the same list test/keys.js
// reads every committed file against (2026-09-28), so the site and the source are asked one question
textFiles.forEach(f => { const src = read(f);
  require('./keys.js').KEYS
    .forEach(([re, what]) => { if (re.test(src)) fails.push('the upload\'s ' + f + ' contains what looks like ' + what); }); });

/* ---- 3 · no page may REACH anywhere it should not, or run what it was not shipped as ----------
   A page with no token in it can still be a door. Each page's policy (CSP) is the wall.
   Until 2026-09-27 this read index.html ALONE — the bakery's shell (content/horno/index.html) shipped
   too and nobody read its policy — and it held Google Fonts on a list of "declared" hosts, so the one
   request every player's device made to another company was a permission, not a finding. #254 and the
   owner's "make sure that we dont go out with open doors" closed both: the fonts are served from this
   site, and EVERY .html page in the box is read here. For each, the policy must be exactly this site
   and nothing else, no script may be written inside the page, no link may carry code, and nothing
   may leave for another host. Reading no page at all is a red, not a pass. */
const pages = files.filter(f => /\.html?$/.test(f));
if (!pages.length) fails.push('the upload holds no .html page, so no policy was read — there is nothing here to call safe');
/* An off-origin host is not forbidden by nature — it is a DECISION, and the rule is that it has to be
   a declared one, here, with the reason. Since 2026-09-27 there is none. */
const DECLARED_OFF_ORIGIN = {};
const WANT = { 'script-src': "'self'", 'style-src': "'self'", 'font-src': "'self'", 'img-src': "'self'", 'connect-src': "'none'",
  'default-src': "'self'", 'base-uri': "'self'", 'form-action': "'none'", 'object-src': "'none'" };
pages.forEach(p => { const html = read(p);
  const csp = (html.match(/<meta[^>]+http-equiv="Content-Security-Policy"[^>]+content="([^"]*)"/i) || [])[1];
  if (!csp) { fails.push(p + ' declares no Content-Security-Policy — nothing limits where that page may talk to'); return; }
  const dirs = Object.fromEntries(csp.split(';').map(s => s.trim()).filter(Boolean).map(s => { const [k, ...v] = s.split(/\s+/); return [k, v.join(' ')]; }));
  Object.entries(WANT).forEach(([k, v]) => { if (dirs[k] !== v)
    fails.push(p + '\'s policy has ' + k + ' "' + (dirs[k] === undefined ? '(missing)' : dirs[k]) + '" and the public pages are held to "' + v + '" — a wider value reopens a door ' + (k === 'style-src' ? '#256' : '#254') + ' closed'); });
  Object.keys(dirs).filter(k => !(k in WANT)).forEach(k => fails.push(p + '\'s policy adds ' + k + ', which no public page has — say why here before it ships'));
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g)].length + [...html.matchAll(/<[a-z][^>]*\son[a-z]+\s*=/gi)].length;
  if (inline) fails.push(p + ' carries ' + inline + ' script(s) written inside the page — the policy blocks them silently, so they are dead code or a door being reopened');
  /* #256: and no style written inside the page either. Under style-src 'self' the browser refuses a <style> block
     or a style="…" attribute without a sound, and the element simply loses that look: a silent visual break on a
     player's phone, or the first step to reopening the door. Counted, so the sentence says how much is affected. */
  const live = html.replace(/<!--[\s\S]*?-->/g, '');   /* a comment that SAYS "<style>" is prose, not a block the browser applies */
  const css = [...live.matchAll(/<style[\s>]/gi)].length, attr = [...live.matchAll(/<[a-z][^>]*\sstyle\s*=/gi)].length;
  if (css + attr) fails.push(p + ' carries ' + css + ' <style> block(s) and ' + attr + ' style="…" attribute(s) written inside the page — the policy refuses every one, so a player sees that page without them');
  if (!/<meta name="referrer" content="no-referrer">/.test(html)) fails.push(p + ' has no no-referrer tag, so a link out would tell the next site where the player came from');
  if (!/<script src="(?:\.\.\/)*frame-guard\.js"><\/script>/.test(html.split('</head>')[0])) fails.push(p + ' does not load frame-guard.js in its <head>, so another site could show it inside a frame and cover it with its own buttons');
  [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]).forEach(u => {
    const m = u.match(/^(?:https?:)?\/\/([^/]+)/);
    if (m) { if (!DECLARED_OFF_ORIGIN[m[1]])
      fails.push(p + ' reaches ' + m[1] + ' and nothing in this repo says that was decided — if it is deliberate, declare it in test/public.js with the reason'); return; }
    if (/^javascript:/i.test(u)) { fails.push(p + ' has a javascript: link — code in a link is a script written inside the page'); return; }
    if (/^(data|mailto|blob):|^#/.test(u)) return;
    const f = path.posix.normalize(path.posix.join(path.posix.dirname(p), u.replace(/^\.\//, '').split(/[?#]/)[0]));
    if (f && f !== '.' && !has(f)) fails.push(p + ' loads "' + u + '" and it is not in the upload — every visitor gets a 404'); });
});
/* and the stylesheets the pages load: a font or an @import from another host is the same door */
files.filter(f => /\.css$/.test(f)).forEach(f => { const css = read(f);
  [...css.matchAll(/(?:@import\s+(?:url\()?|url\()\s*['"]?((?:https?:)?\/\/[^'")\s]+)/g)].forEach(m =>
    fails.push(f + ' reaches ' + m[1].replace(/^(?:https?:)?\/\/([^/]+).*/, '$1') + ' — a stylesheet that pulls from another host sends every player there')); });

/* ---- 4 · the offline app must actually install --------------------------------------------- */
// sw.js addAll() is ALL-OR-NOTHING: one missing path and the install rejects, the worker never
// activates, and every already-installed device stays pinned to the version it has, silently.
if (has('sw.js')) { const sw = read('sw.js');
  const listed = [...sw.matchAll(/"\.\/([^"]*)"/g)].map(m => m[1]).filter(Boolean);
  listed.forEach(a => { if (!has(a)) fails.push('sw.js caches "' + a + '" and it is not in the upload — addAll is all-or-nothing, so the app would never install'); });
  const cache = (sw.match(/CACHE\s*=\s*"([^"]+)"/) || [])[1];
  if (has('content/meridian/config.js')) { const v = (read('content/meridian/config.js').match(/GAMEV\s*=\s*"([^"]+)"/) || [])[1];
    if (cache && v && cache !== v) fails.push('the shipped sw.js caches "' + cache + '" while the shipped game says it is "' + v + '" — they must be the same string'); }
}

/* ---- 5 · and the game is actually there ----------------------------------------------------- */
// An allowlist that drops a file is the other way to fail, and it is silent too.
['index.html', 'shell.css', 'sw.js', 'sw-register.js', 'frame-guard.js', 'vendor/fonts/fonts.css', 'qr.js', 'manifest.webmanifest', 'engine/engine.js', 'engine/engine3d.js',
 'vendor/three.min.js', 'content/meridian/config.js', 'content/meridian/maps.js', 'content/meridian/strings.js']
  .forEach(f => { if (!has(f)) fails.push('the upload is MISSING ' + f + ' — the allowlist has dropped part of the game'); });

if (notes.length) notes.forEach(n => console.log('note: ' + n));
if (fails.length) { console.log('FAIL — what we are about to publish is not only the public game\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('OK — R10: the upload is ' + (PUBLIC_WORLDS.length === 1 ? 'the public game' : 'the ' + PUBLIC_WORLDS.length + ' worlds this repo publishes (' + PUBLIC_WORLDS.join(', ') + ')') + ' and nothing else. ' + files.length + ' files; no private tool, no registers, ' +
            'no credential surface, no off-origin script, the worker\'s asset list resolves, and the game is complete.');
