#!/usr/bin/env node
/* THE KITCHEN'S THREE SEAMS (sprint 9 of the 3D kitchen): the amount (`tools.amount`), the hand from outside (`tools.loose`) and Rename in
   the builder (`tools.rename`), engine/kitchen-room.js (grep "THE AMOUNT, AND THE HAND FROM OUTSIDE" and "kitBuildRename"). What a person would
   notice, each in its own sentence: an amount said wrongly ("2 bottles", "none left", no number for a thing not counted); a thing with a unit
   accepted in a kitchen that did not ask for amounts, or the engine's − and + still there where the game counts; a Not-put-away-yet drawer that
   is missing, or a thing from it that cannot be taken, shown or put; a Rename that is offered where a game did not ask, that keeps a name
   too long, or that is not undone; and a kitchen that did not turn any of it on saying anything differently from before ("Egg × 3", − and +).
   Run:  node test/kitchen-seams.js   (CHROMIUM_PATH if Chromium is not where Playwright looks). Red first: each fault is planted in a copy of
   the tree outside the repository and must turn it red, with its sentence. */
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const { chromium } = require('playwright-core');
const CANDIDATES = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].filter(Boolean);
const exe = CANDIDATES.find(p => { try { return fs.statSync(p).isFile() || fs.statSync(p).isDirectory(); } catch (e) { return false; } });
const HERE = path.resolve(__dirname, '..');

async function run(root, browser) {
  const fails = [], say = s => fails.push(s), file = path.join(root, 'index.html');
  const p = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' }), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**', r => (r.request().url().startsWith('file://') ? r.continue() : r.abort()));
  await p.addInitScript({ content: 'window.KITCHEN=(function(){' + fs.readFileSync(path.join(root, 'engine', 'kitchen.js'), 'utf8') + '\n;return KITCHEN;})();' });
  await p.goto('file://' + file);
  await p.waitForFunction(() => typeof kitchenLay === 'function' && typeof KITCHEN === 'object' && document.readyState === 'complete', null, { timeout: 15000 });
  await p.evaluate(() => {
    Object.assign(UI.es, { ktNoneLeft: 'ya no queda' });
    const R = ['############', '#' + KITCOL.repeat(4) + '.....##', '#..........#', '#..........#', '#..........#', '############'];
    const mk = id => { WORLDS[id] = { rows: R.slice(), rows0: R.slice(), grid: R.map(r => r.split('')), npcs: [], W: 12, H: 6 }; };
    window.__st = { p1: [{ id: 'milk', n: 2, unit: 'bottles' }, { id: 'salt', n: 1, uncounted: true }, { id: 'tuna', n: 0, unit: 'cans' }, { id: 'egg', n: 3 }], p3: [], p4: [], p6: [], p7: [] };
    window.__keeps = []; window.__stored = []; window.__loose = [{ id: 'flour', n: 1, uncounted: true, name: 'Flour' }, { id: 'sugar', n: 1, name: 'Sugar' }];
    const NM = { milk: 'Milk', salt: 'Salt', tuna: 'Tuna', egg: 'Eggs' };
    const things = pl => (window.__st[pl.id] || []).map(t => Object.assign({ name: NM[t.id] || t.id }, t));
    const places = KITCHEN.template.map((t, k) => ({ kind: t.kind, row: t.row, col: t.col, id: 'p' + (k + 1) }));
    window.__mk = tools => ({ wall: [[1, 1], [2, 1], [3, 1], [4, 1]], places: places.map(q => Object.assign({}, q)), things, gaps: true,
      keep: ch => { window.__keeps.push(JSON.parse(JSON.stringify(ch))); Object.keys(ch).forEach(pid => { window.__st[pid] = ch[pid].map(t => Object.assign({}, t)); }); },
      store: l => { window.__stored.push(JSON.parse(JSON.stringify(l))); }, tools });
    window.__tools = o => Object.assign({ own: () => ({}), keep: () => {} }, o);
    window.__ids = ['__s9_am', '__s9_plain']; window.__ids.forEach(mk);
    const a = kitchenLay('__s9_am', window.__mk(window.__tools({ amount: true, rename: true, loose: lg => window.__loose.map(t => Object.assign({}, t, { name: lg === 'es' ? t.name + 'ES' : t.name })) })));
    if (a) throw new Error('the amount kitchen was refused: ' + a);
    const b = kitchenLay('__s9_plain', window.__mk(window.__tools({})));
    if (b) throw new Error('the plain kitchen was refused: ' + b);
    window.__go = (id, x, y) => { world = id; px = fx = x; py = fy = y; dir = 'up'; enterWorld(false); camSet('3d'); document.querySelectorAll('.settings').forEach(q => { q.hidden = true; }); checkTalk(); };
    window.__open = (id, kind) => kitOpen(id, KITWALL[id].places.find(q => q.kind === kind).i);
    window.__grid = () => [...document.querySelectorAll('#reader [data-kit-thing], #reader .dgrid *')].length;
  });
  const warnsOf = () => p.evaluate(() => (typeof mqLog === 'object' ? mqLog.filter(e => e.kind === 'kitchen').map(e => e.msg) : []));
  const page9 = () => p.evaluate(() => { const r = document.getElementById('reader'); return r ? r.innerText : ''; });
  /* 1 · AMOUNTS, where a game turned them on */
  await p.evaluate(() => { window.__go('__s9_am', 2, 2); window.__open('__s9_am', 'fridge'); });
  await p.waitForFunction(() => !document.getElementById('reader').hidden, null, { timeout: 4000 }).catch(() => {});
  let T = await page9();
  if (!/Milk[\s\S]{0,40}2 bottles/.test(T)) say('a thing counted 2 with the unit "bottles" is not said "2 bottles" on its place\'s page (' + JSON.stringify(T.replace(/\s+/g, ' ').slice(0, 160)) + ')');
  if (!/Tuna[\s\S]{0,40}none left/.test(T)) say('a thing counted 0 with a unit is not said "none left"');
  if (/Salt\s*×\s*\d/.test(T) || /Salt[^A-Za-z]{0,8}\d/.test(T.replace(/\s+/g, ' '))) say('a thing not counted says a number');
  if (!/Eggs[\s\S]{0,20}× 3/.test(T)) say('a thing with no unit in a kitchen that counts amounts is not said "× 3" as ever');
  const ctl = await p.evaluate(() => ({ minus: !!document.querySelector('[data-kt^="minus-"]'), plus: !!document.querySelector('[data-kt^="plus-"]') }));
  if (ctl.minus || ctl.plus) say('in a kitchen whose game counts amounts itself the engine still offers − and + on the page');
  await p.evaluate(() => { lang = 'es'; applyLang(); kitRepage(); });
  T = await page9();
  if (!/ya no queda/.test(T)) say('"none left" is not said in Spanish from the game\'s own word (' + JSON.stringify(T.replace(/\s+/g, ' ').slice(0, 120)) + ')');
  await p.evaluate(() => { lang = 'en'; applyLang(); const d = document.getElementById('docClose'); if (d) d.click(); });
  /* the same things, where nobody asked for amounts: a unit is refused, and the page says "× 3" with − and + */
  const bad = await p.evaluate(() => { window.__st.p1 = [{ id: 'milk', n: 2, unit: 'bottles' }, { id: 'egg', n: 3 }]; window.__go('__s9_plain', 2, 2); const g = kitThingsOf('__s9_plain', KITWALL.__s9_plain.places.findIndex(q => q.kind === 'fridge')); return { bad: g.bad, ids: g.list.map(t => t.id).join() }; });
  if (!bad.bad) say('a thing with a unit was accepted in a kitchen whose tools did not turn amounts on');
  await p.evaluate(() => { window.__st.p1 = [{ id: 'egg', n: 3 }]; window.__open('__s9_plain', 'fridge'); });
  await p.waitForFunction(() => !document.getElementById('reader').hidden, null, { timeout: 4000 }).catch(() => {});
  T = await page9();
  if (!/Eggs[\s\S]{0,20}× 3/.test(T)) say('a kitchen that did not turn amounts on no longer says "× 3"');
  await p.evaluate(() => { const d = document.getElementById('docClose'); if (d) d.click(); });
  /* 2 · THE HAND FROM OUTSIDE */
  await p.evaluate(() => { window.__st.p1 = [{ id: 'egg', n: 3 }]; window.__go('__s9_am', 2, 2); });
  await p.evaluate(() => kitToolsOpen());
  const L = await p.evaluate(() => ({ sum: (document.getElementById('kpLooseSum') || {}).textContent, rows: [...document.querySelectorAll('[data-kt^="loose-"]')].map(b => b.textContent) }));
  if (L.sum !== 'Not put away yet' || L.rows.join('|') !== 'Flour|Sugar × 1') say('the Kitchen panel\'s "Not put away yet" drawer lists ' + JSON.stringify(L.rows) + ' under ' + JSON.stringify(L.sum) + ', where it lists the game\'s two loose things');
  await p.evaluate(() => { const d = document.getElementById('kpLoose'); d.open = true; });
  await p.click('[data-kt="loose-flour"]'); await p.waitForTimeout(100);
  const H = await p.evaluate(() => ({ hand: KITHAND ? KITHAND.thing.id + ':' + KITHAND.from : null, shown: (document.getElementById('kitHand') || {}).innerText || '', panel: !document.getElementById('kitPanel').hidden }));
  if (H.hand !== 'flour:null') say('a thing picked in the "Not put away yet" drawer is not taken in hand (' + JSON.stringify(H.hand) + ')');
  if (H.panel) say('the Kitchen panel stays over the room after a thing is taken in hand from it');
  if (!/Flour/.test(H.shown)) say('the hand does not show the thing taken from the drawer');
  await p.evaluate(() => { window.__keeps.length = 0; window.__open('__s9_am', 'counter'); });
  await p.waitForFunction(() => !document.getElementById('reader').hidden, null, { timeout: 4000 }).catch(() => {});
  await p.evaluate(() => { const b = [...document.querySelectorAll('#reader button')].find(x => /Put it here/.test(x.textContent)); if (b) b.click(); });
  await p.waitForTimeout(100);
  const K = await p.evaluate(() => ({ keeps: window.__keeps, hand: !!KITHAND }));
  if (K.keeps.length !== 1 || Object.keys(K.keeps[0]).join() !== 'p3' || !K.keeps[0].p3.some(t => t.id === 'flour')) say('putting a thing taken from the drawer in the counter handed the game ' + JSON.stringify(K.keeps) + ', where it is one change naming only the counter, with the thing in it');
  if (K.hand) say('the hand is not empty after the thing was put in a place');
  await p.evaluate(() => { const d = document.getElementById('docClose'); if (d) d.click(); });
  const refused = await p.evaluate(() => kitHandStart({ id: 'x', n: 1, name: 'X', evil: 1 }));
  if (refused) say('a thing with a key a thing has not was taken in hand from outside');
  const noLoose = await p.evaluate(() => { window.__go('__s9_plain', 2, 2); return kitHandStart({ id: 'x', n: 1, name: 'X' }); });
  if (noLoose) say('a thing was taken in hand from outside in a kitchen whose tools have no loose');
  /* 3 · RENAME IN THE BUILDER */
  const rn = await p.evaluate(() => { window.BUILDER = window.BUILDER || { name: 'Probe' }; admin = true; applyAdmin(); window.__go('__s9_am', 2, 2); checkTalk();
    const i = KITWALL.__s9_am.places.findIndex(q => q.kind === 'drawers'); kitBuildPick(i);
    const on = kitBuildOn(), btn = document.querySelector('#kitBuild [data-kb="rename"]');
    const r1 = kitBuildRename('  Spice   rack '), n1 = (window.__stored[window.__stored.length - 1] || { places: [] }).places[i];
    const long = kitBuildRename('x'.repeat(31)), r3 = kitBuildRename(''), n3 = (window.__stored[window.__stored.length - 1] || { places: [] }).places[i];
    const sub = KITWALL.__s9_am.places[i].name;
    return { on, btn: !!btn && !btn.hidden, r1, name1: n1 && n1.name, long, r3, name3: n3 && n3.name, sub, said: document.getElementById('kbSaid').textContent, undo: (KITB.undo.__s9_am || []).length }; });
  if (!rn.on || !rn.btn) say('Rename is not on the builder\'s bar where the game turned it on');
  if (!rn.r1 || rn.name1 !== 'Spice rack') say('a piece renamed "  Spice   rack " was handed to the game as ' + JSON.stringify(rn.name1) + ', where it is "Spice rack"');
  if (rn.long) say('a name of 31 characters was kept, where at most 30 are');
  if (!rn.r3 || rn.name3 !== undefined) say('an empty name did not give the piece its kind\'s own name back (' + JSON.stringify(rn.name3) + ')');
  if (rn.undo !== 2) say('Rename is not one undoable change like the builder\'s others (' + rn.undo + ' steps kept, where two renames were made)');
  const un = await p.evaluate(() => { kitBuildUndo(); return KITWALL.__s9_am.places.find(q => q.kind === 'drawers').name || null; });
  if (un !== 'Spice rack') say('undo after clearing a name did not bring "Spice rack" back (' + JSON.stringify(un) + ')');
  const off = await p.evaluate(() => { window.__go('__s9_plain', 2, 2); const L = window.__mk(window.__tools({})); L.tools.rename = false; kitchenLay('__s9_plain', L); checkTalk(); kitBuildPick(0); const b = document.querySelector('#kitBuild [data-kb="rename"]'); return { hidden: !b || b.hidden || getComputedStyle(b).display === 'none' || b.getBoundingClientRect().width === 0, did: kitBuildRename('Nope') }; });
  if (!off.hidden || off.did) say('Rename is offered or works in a kitchen whose tools did not turn it on');
  /* the builder's bar stands clear of the Kitchen button at the foot of the view */
  const ov = await p.evaluate(() => { window.BUILDER = window.BUILDER || { name: 'Probe' }; admin = true; applyAdmin(); window.__go('__s9_am', 2, 2); checkTalk(); kitBuildShow(); const b = document.getElementById('kitBuild'), k = document.getElementById('kitBtn'); const ok = b && k && !b.hidden && !k.hidden; const x = ok ? b.getBoundingClientRect() : null, y = ok ? k.getBoundingClientRect() : null; admin = false; applyAdmin(); if (!ok) return null; return { over: x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top }; });
  if (ov && ov.over) say('the builder\'s bar covers the Kitchen button at the foot of the view');
  /* 4 · A LONG LIST OF LOOSE THINGS: every one is listed (no cap of a place's 24), a search finds one past the cut, the cut is said, Spanish comes from the game */
  const lng = await p.evaluate(() => { const mkL = n => Array.from({ length: n }, (_, i) => ({ id: 'l' + i, n: 1, uncounted: true, name: 'Thing ' + i }));
    window.__loose = mkL(60); window.__go('__s9_am', 2, 2); kitToolsOpen(); document.getElementById('kpLoose').open = true; kitToolsRender();
    const rows60 = document.querySelectorAll('[data-kt^="loose-l"]').length, cut60 = !!document.querySelector('[data-kt="loose-cut"]');
    window.__loose = mkL(130); kitToolsRender();
    const rows130 = document.querySelectorAll('[data-kt^="loose-l"]').length, cut = (document.querySelector('[data-kt="loose-cut"]') || {}).textContent || '';
    KTOOLS.q = 'thing 125'; kitToolsRender(); const found = [...document.querySelectorAll('[data-kt^="loose-l"]')].map(b => b.textContent).join('|');
    KTOOLS.q = ''; window.__loose = mkL(5).concat([{ id: 'bad', n: 1, name: 'Bad', evil: 1 }]); kitToolsRender(); const badLine = /could not be read/.test(document.getElementById('kpLooseList').textContent);
    Object.assign(UI.es, { ktLoose: 'Todavía sin guardar' }); lang = 'es'; kitToolsRender(); const es = document.getElementById('kpLooseSum').textContent; lang = 'en';
    window.__loose = []; kitToolsClose(); return { rows60, cut60, rows130, cut, found, badLine, es }; });
  if (lng.rows60 !== 60 || lng.cut60) say('60 loose things list ' + lng.rows60 + ' rows' + (lng.cut60 ? ' and say the list is cut' : '') + ', where all 60 are listed');
  if (lng.rows130 !== 120 || !/120 of 130/.test(lng.cut)) say('130 loose things list ' + lng.rows130 + ' rows and say ' + JSON.stringify(lng.cut) + ', where 120 are listed and the line says "Showing 120 of 130"');
  if (!/Thing 125/.test(lng.found)) say('a search for a loose thing past the cut finds ' + JSON.stringify(lng.found) + ', where the search narrows the list before the cut');
  if (!lng.badLine) say('a loose thing the engine refuses is dropped without a word, where the drawer says some could not be read');
  if (lng.es !== 'Todavía sin guardar') say('the drawer\'s title is ' + JSON.stringify(lng.es) + ' in Spanish, where it is the game\'s own word');
  /* 5 · A REFUSED CHANGE SAYS THE GAME'S OWN SENTENCE, once: the engine shows it where the change was made and does not write the ticker */
  const ref = await p.evaluate(() => { const L = window.__mk(window.__tools({ amount: true, loose: () => [] })); L.tools.keep = () => { const e = new Error('plain'); e.say = 'Another tab changed your kitchen.'; throw e; }; kitchenLay('__s9_am', L); window.__go('__s9_am', 2, 2);
    const TT = []; window.toast = m => { TT.push(String(m)); }; const n0 = (typeof mqLog === 'object' ? mqLog.filter(e => e.kind === 'kitchen').length : 0); kitToolsKeep({ places: { p1: [] } }); const n1 = (typeof mqLog === 'object' ? mqLog.filter(e => e.kind === 'kitchen').length : 0);
    const toasted = TT.join('|'); const L2 = window.__mk(window.__tools({ amount: true })); L2.tools.keep = () => { throw new Error('disk'); }; kitchenLay('__s9_am', L2); window.__go('__s9_am', 2, 2); TT.length = 0; kitToolsKeep({ places: { p1: [] } });
    return { toasted, ticker: n1 - n0, plain: TT.join('|') }; });
  if (!/Another tab changed your kitchen\./.test(ref.toasted)) say('a refused change says ' + JSON.stringify(ref.toasted) + ', where it says the game\'s own sentence');
  if (ref.ticker !== 0) say('a refused change the game has already said is written to the ticker too');
  if (!/could not be kept on this device/.test(ref.plain)) say('a change that fails with no sentence of the game\'s says ' + JSON.stringify(ref.plain) + ', where it says it could not be kept on this device');
  /* 5b · the same for how full a place is (kept through store): the game's sentence, never the generic one */
  const fu = await p.evaluate(() => { const L = window.__mk(window.__tools({ amount: true })); L.store = () => { const e = new Error('plain'); e.say = 'Another tab changed your kitchen.'; throw e; }; kitchenLay('__s9_am', L); window.__go('__s9_am', 2, 2);
    const TT = []; window.toast = m => { TT.push(String(m)); }; const ok = kitSetFull(KITWALL.__s9_am.places[0], KITCHEN.fulls[0]); return { ok, said: TT.join('|') }; });
  if (fu.ok || !/Another tab changed your kitchen\./.test(fu.said) || /could not be kept/.test(fu.said)) say('a refused how-full says ' + JSON.stringify(fu.said) + ', where it says the game\'s own sentence');
  errs.forEach(m => say('the page threw: ' + m.split('\n')[0]));
  await p.close();
  return fails;
}

/* THE PLANTS: each is a copy of the tree with one fault, outside the repository, and must be red */
const PLANTS = [
  ['units accepted where amounts are off', 'engine/kitchen-room.js', 'const AM=!!(K.tools&&K.tools.amount===true);', 'const AM=true;', /unit was accepted in a kitchen whose tools did not turn amounts on/],
  ['zero not said as none left', 'engine/kitchen-room.js', 'if(t.n===0)return kitW("ktNoneLeft","none left");', 'if(t.n===0)return "0";', /counted 0 with a unit is not said "none left"/],
  ['the engine\'s − and + kept where the game counts', 'engine/kitchen-room.js', 'if(kitAmtOn(K)){const a=kitAmt(t)', 'if(false){const a=kitAmt(t)', /still offers − and \+/],
  ['a thing from outside cannot be put', 'engine/kitchen-room.js', 'if(h.from!==null)change[K.places[h.from].id]=from;change[K.places[i].id]=to;', 'change[K.places[h.from].id]=from;change[K.places[i].id]=to;', /putting a thing taken from the drawer/],
  ['the drawer cut at 24', 'engine/kitchen-room.js', ',KITLOOSEMAX);', ',24);', /list 24 rows|130 loose things list|60 loose things list/],
  ['the cut taken before the search', 'engine/kitchen-room.js', 'all=got.list.filter(x=>!q||x.name.toLowerCase().includes(q)),list=all.slice(0,KITLOOSE);', 'all=got.list.slice(0,KITLOOSE).filter(x=>!q||x.name.toLowerCase().includes(q)),list=all;', /search for a loose thing past the cut/],
  ['how full saying the generic sentence for a refusal', 'engine/kitchen-room.js', 'toast(sd||kitW("ktNotKept","That could not be kept on this device, so nothing changed."),2600);return false;}\n  KITWALL[world]=r.wall', 'toast(kitW("ktNotKept","That could not be kept on this device, so nothing changed."),2600);return false;}\n  KITWALL[world]=r.wall', /a refused how-full says/],
  ['a refusal not saying the game\'s sentence', 'engine/kitchen-room.js', 'KTOOLS.say=sd||kitW("ktNotKept"', 'KTOOLS.say=kitW("ktNotKept"', /a refused change says/],
  ['the bar over the Kitchen button', 'engine/kitchen-room.js', 'b.style.left=off+"px";', 'b.style.left="12px";', /covers the Kitchen button/],
  ['spaces in a name not folded', 'engine/kitchen-room.js', '.replace(/\\s+/g," ").trim();\n  if(Array.from(nm).length>KITNAME)', '.trim();\n  if(Array.from(nm).length>KITNAME)', /handed to the game as/],
  ['Rename offered without the game asking', 'engine/kitchen-room.js', 'bt.hidden=!(K.tools&&K.tools.rename===true);', 'bt.hidden=false;', /Rename is offered or works/],
  ['an uncounted thing says a number', 'engine/kitchen-room.js', 'function kitAmt(t){if(t.uncounted)return "";', 'function kitAmt(t){', /not counted says a number|page threw/],
];
(async () => {
  if (!exe) { console.error('No Chromium found. Set CHROMIUM_PATH'); process.exit(1); }
  const browser = await chromium.launch({ executablePath: exe });
  let bad = 0;
  const base = await run(HERE, browser);
  if (base.length) { console.log('FAIL\n- ' + base.join('\n- ')); bad++; } else console.log('  the three seams hold on the tree as it stands');
  if (!process.argv.includes('--no-plants')) {
    for (const [name, rel, from, to, want] of PLANTS) {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'seams-'));
      try {
        cp.execSync('cp -R "' + HERE + '/engine" "' + HERE + '/vendor" "' + HERE + '/index.html" "' + tmp + '/" 2>/dev/null; cp -R "' + HERE + '/content" "' + tmp + '/" 2>/dev/null; cp "' + HERE + '/qr.js" "' + HERE + '/icon-192.png" "' + HERE + '/frame-guard.js" "' + tmp + '/" 2>/dev/null || true');
        const f = path.join(tmp, rel), s = fs.readFileSync(f, 'utf8');
        if (!s.includes(from)) { console.log('FAIL plant "' + name + '": its text is not in ' + rel + ' (the plant is stale)'); bad++; continue; }
        fs.writeFileSync(f, s.replace(from, to));
        const got = await run(tmp, browser).catch(e => ['the run itself failed: ' + String(e.message).split('\n')[0]]);
        const hit = got.find(m => want.test(m));
        if (!hit) { console.log('FAIL plant "' + name + '" stayed green or red for another reason: ' + JSON.stringify(got.slice(0, 2))); bad++; } else console.log('  plant "' + name + '" is red: ' + hit.slice(0, 140));
      } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
    }
  }
  await browser.close();
  if (bad) process.exit(1);
  console.log('OK');
})();
