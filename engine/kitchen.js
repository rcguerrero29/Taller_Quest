/* ---------- KITCHEN — the kinds of place a kitchen wall has, the rows they stand in, where a kitchen starts, its finishes, and the rules for where a piece goes ----------
   One copy, for every game that has a kitchen. A game's own page reads it; the engine's 3D camera builds each kind with
   the shape named here (engine/shapes.js, grep "THE KITCHEN WALL"), and the engine's builder changes a kitchen by the
   rules here (engine/engine.js, grep "THE KITCHEN BUILDER").

   WHAT THIS FILE IS. One global, `KITCHEN`, and nothing else: data and pure functions, frozen all the way down, so nothing
   that reads it can change it for anything else that reads it. Loading it reads no global, touches no page and runs
   nothing but its own freeze. Its rules, when called, read only what they are handed and the language's own built-ins
   (Array, Number, Math, Object, Set, String); they touch no page, keep nothing, store nothing and change nothing they are
   handed. It is held on every build (test/engine.smoke.js, grep "THE KITCHEN'S ONE COPY" and "THE KITCHEN'S RULES").

   WHAT IT HOLDS.
     kinds     each kind of place, and the row it stands in. A TALL kind stands the wall's whole height on its own; every
               other kind has a home row, one of `rows`.
     order     the kinds in the order a list of them is offered.
     rows      the wall's rows that are not tall, top to bottom: hung above the counter, at the counter, below it.
     rank      where each row stands, top to bottom, the tall row first: a column is read in this order.
     template  where a kitchen starts, as it stands on a wall: the fridge at one end, the upper cupboards over the counter
               over the drawers, the shelves over the lower cupboards, the freezer at the other end. Each place is a kind,
               a row and a column. These are the seven Simmer's My kitchen page started every kitchen from on 2026-10-29,
               moved here unchanged when this file was made, so a kitchen already saved reads as it did.
     pieces    the shape each kind is built with in 3D, by its name in SHAPES.
     bands     how high each kind's piece stands, from the floor (lo) to its top (hi), in tiles. Pieces of different rows
               built in one square stack inside their bands and never touch: a lower piece on the floor, the worktop on it
               at a person's waist, an upper piece hung at head height over that; a tall piece covers all three. Every
               piece is held inside its band, shut and open, by test/engine.smoke.js.
     fulls     how full a place may be said to be, in the order a choice offers them: some room, almost full, full. Unset
               means nobody said. The words My kitchen's FULLS had on 2026-10-30, so a place saved there with one reads the
               same here; the engine checks a layout's fullness against this list (engine/engine.js, grep "THE KITCHEN
               LAYOUT"). Like `kinds`, a word is added here and never taken away.
     finishes  WHAT A PIECE IS FINISHED IN (2026-10-30: a short list, never a colour typed
               in, built to grow), in the order a choice offers them; the first, `wood`, is what a place that names none
               is finished in, so every kitchen laid before there were finishes looks exactly as it did. Each finish says:
                 body   the 3D colour of a cabinet's carcass: its two sides and its top, the parts a joiner cuts from the
                        board and that show once it is hung;
                 front  the 3D colour of what you touch: the doors' frames and their panels (a shade darker, sunk), the
                        drawers' fronts, and the whole of an open wall shelf, cheeks, top and planks;
                 goods  the white goods' enamel, `{body, front}`: the fridge's and the freezer's shell, and their doors or
                        drawer fronts. `null` is the white goods' own, the steel fridge and the frost-pale freezer they
                        always were: a wooden kitchen keeps its steel fridge. Their plinth, seals, handles, liners and
                        baskets are never painted;
                 flat   the one colour a 2D wall paints the piece in (Simmer's My kitchen, sprint 6 of the 3D plan): a
                        cabinet's front as the 3D camera shows it in the day's light, facing the room, measured off a lower
                        door in a test kitchen (about 0.77 of `front`; docs/3D-LOG.md, 2026-10-30), so the two
                        views agree.
               Inside a cabinet nothing is painted: its shelf on pins, its back and its floor stay the board they are, and a
               drawer's box stays pale wood. A finish is added here and never taken away: a kitchen kept with one would not
               read again.
     unfinished  the kinds no finish goes on: the counter is a stone slab and a tiled splash, cut and laid, not painted.
               The engine refuses a layout that paints one, and its builder offers it no paint.
     most      how many pieces a kitchen holds: My kitchen's PIECES_MAX on 2026-10-30, 40.
     rules     WHERE A PIECE GOES (2026-10-30: the same moving rules My kitchen has, one
               copy). Simmer's My kitchen page made these rules and its wall still uses them, through here; the engine's
               builder changes a kitchen by them and by nothing else. Each takes a layout, `{places: [{kind, row, col,
               …}]}` (anything else in the layout, and anything else in a place, is carried over as it is), and gives back a
               new one and what happened, `{layout, i, did, …}`, or a refusal, `{why, code}`: `why` a sentence saying why,
               `code` one word a page can answer in its own language (`layout`, `place`, `kind`, `most`, `side`, `still`,
               `finish`, `bare`). What it is handed is never changed. A place is named by `i`, its index in `places`, and
               keeps its index through a move or a paint; an added place comes last, and a removed one leaves the rest in
               their order. Every layout given back has its columns numbered again from the left, with no empty column
               between, as My kitchen's wall always had them.
                 add(layout, kind)        a piece of that kind in the first column from the left whose place in the
                                          kind's row is free and that no tall piece stands in; a tall kind, or no such
                                          column, in a new column at the right end. Refused at `most` pieces.
                 move(layout, i, side)    left or right: a tall piece swaps columns with the column beside it; any other
                                          piece goes to the next column that is not a tall one's, in its row, swapping
                                          with what is there, and past either end of the wall it opens a column of its
                                          own there. Up or down: the next row in its column, swapping with what is
                                          there; a tall piece has none. Refused when it would change nothing.
                 canMove(layout, i, side) true when that move would change where anything stands: a move is offered
                                          only then.
                 remove(layout, i)        the place taken off the wall. What was kept in it is the game's to put back.
                 paint(layout, i, finish) that place in that finish; `wood`, the finish left out, is written by leaving it
                                          out. Refused for a kind no finish goes on, and when nothing would change.
                 paintAll(layout, finish) every place a finish goes on, in that finish ("paint the whole kitchen").
                 compact(layout)          the columns numbered again from the left with no empty column between, and
                                          nothing else: what a page does to a kitchen it reads, before it shows it.

   A kind taken off `kinds` makes every kitchen saved with one in it unreadable to a page that checks a save against
   this list, so a kind is added here and never taken away; the check pins all seven. */
const KITCHEN = (function () {
  const TEMPLATE = [
    { kind: 'fridge', row: 'tall', col: 0 },
    { kind: 'upper-cupboards', row: 'upper', col: 1 },
    { kind: 'counter', row: 'counter', col: 1 },
    { kind: 'drawers', row: 'lower', col: 1 },
    { kind: 'shelves', row: 'upper', col: 2 },
    { kind: 'lower-cupboards', row: 'lower', col: 2 },
    { kind: 'freezer', row: 'tall', col: 3 },
  ];
  const KINDS = { fridge: 'tall', freezer: 'tall', 'upper-cupboards': 'upper', 'lower-cupboards': 'lower', drawers: 'lower', shelves: 'upper', counter: 'counter' };
  const ROWS = ['upper', 'counter', 'lower'], MOST = 40;
  const FINISHES = {
    wood: { body: '#8A6F4D', front: '#A98B62', goods: null, flat: '#846C4B' },
    white: { body: '#D6D2CA', front: '#EAE7E0', goods: { body: '#D3D7DD', front: '#E8EBEF' }, flat: '#B4AFA8' },
    violet: { body: '#5F5089', front: '#7565A1', goods: { body: '#6A5B94', front: '#8070AB' }, flat: '#5C4E7B' },
    grey: { body: '#6E7179', front: '#868A93', goods: { body: '#5D6169', front: '#71767F' }, flat: '#67696F' },
  };
  const UNFINISHED = ['counter'];

  /* ---- THE RULES. My kitchen's own, moved here (Simmer's My kitchen page before 2026-10-30: move, canMove, compact,
     colsOf, cellOf, tallIn, sig, and addPiece's choice of column), worked on a copy of the places, never on what was
     handed in ---- */
  const own = (o, k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);
  const SIDES = ['left', 'right', 'up', 'down'];
  const no = (code, why) => ({ why, code });
  const said = v => '"' + String(v).slice(0, 30) + '"';
  /* the places a layout hands in, each copied: a list of plain objects, each of a kind on the list, in its own kind of
     row, in a column that is a whole number from 0; null when that is not what was handed in */
  function read(L) {
    if (!L || typeof L !== 'object' || !Array.isArray(L.places)) return null;
    const out = [];
    for (const p of L.places) {
      if (!p || typeof p !== 'object' || Array.isArray(p) || typeof p.kind !== 'string' || !own(KINDS, p.kind)) return null;
      if (KINDS[p.kind] === 'tall' ? p.row !== 'tall' : ROWS.indexOf(p.row) < 0) return null;
      if (!Number.isInteger(p.col) || p.col < 0) return null;
      out.push(Object.assign({}, p));
    }
    return out;
  }
  const NOT = () => no('layout', 'a layout has a list of places, each of a kind there is, in its own row and in a column from 0');
  const named = (P, i) => (Number.isInteger(i) && i >= 0 && i < P.length ? null : no('place', 'there is no place ' + said(i) + ' in a layout of ' + P.length));
  const made = (L, P, extra) => Object.assign({ layout: Object.assign({}, L, { places: P }) }, extra);
  const colsOf = P => P.reduce((n, p) => Math.max(n, p.col + 1), 0);
  const tallIn = (P, c) => P.find(p => p.col === c && p.row === 'tall') || null;
  const cellOf = (P, row, c) => P.find(p => p.col === c && (p.row === 'tall' || p.row === row)) || null;
  /* no empty column is left on the wall: the columns are numbered again from the left, in their order */
  function compact(P) {
    const used = Array.from(new Set(P.map(p => p.col))).sort((a, b) => a - b);
    P.forEach(p => { p.col = used.indexOf(p.col); });
    return P;
  }
  const sig = P => P.map((p, i) => i + ':' + p.row + ':' + p.col).sort().join('|');
  /* A MOVE, on the copy P: true when it was made (whether it changes anything is canMove's) */
  function step(P, i, side) {
    const p = P[i], n = colsOf(P);
    if (side === 'left' || side === 'right') {
      const d = side === 'left' ? -1 : 1;
      if (p.row === 'tall') {
        const c1 = p.col, c2 = c1 + d;
        if (c2 < 0 || c2 >= n) return false;
        P.forEach(x => { if (x.col === c2) x.col = c1; });
        p.col = c2;
        return true;
      }
      let c2 = p.col + d;
      while (c2 >= 0 && c2 < n && tallIn(P, c2)) c2 += d;
      if (c2 < 0) { P.forEach(x => { x.col += 1; }); p.col = 0; }
      else if (c2 >= n) p.col = n;
      else { const o = cellOf(P, p.row, c2); if (o) o.col = p.col; p.col = c2; }
      return true;
    }
    if (p.row === 'tall') return false;
    const r2 = ROWS[ROWS.indexOf(p.row) + (side === 'up' ? -1 : 1)];
    if (!r2) return false;
    const o = cellOf(P, r2, p.col);
    if (o) o.row = p.row;
    p.row = r2;
    return true;
  }
  const copy = P => P.map(p => Object.assign({}, p));
  function canMove(L, i, side) {
    const P = read(L);
    if (!P || named(P, i) || SIDES.indexOf(side) < 0) return false;
    const now = compact(copy(P)), sim = copy(P);
    if (!step(sim, i, side)) return false;
    compact(sim);
    return sig(sim) !== sig(now);
  }
  function move(L, i, side) {
    const P = read(L); if (!P) return NOT();
    const bad = named(P, i); if (bad) return bad;
    if (SIDES.indexOf(side) < 0) return no('side', 'a piece moves left, right, up or down, and not ' + said(side));
    if (!canMove(L, i, side)) return no('still', 'moving the ' + P[i].kind + ' ' + side + ' would change nothing on the wall');
    const from = { row: P[i].row, col: P[i].col };
    step(P, i, side); compact(P);
    return made(L, P, { i, did: 'moved', side, from, to: { row: P[i].row, col: P[i].col } });
  }
  function add(L, kind) {
    const P = read(L); if (!P) return NOT();
    if (typeof kind !== 'string' || !own(KINDS, kind)) return no('kind', 'there is no kind of place called ' + said(kind));
    if (P.length >= MOST) return no('most', 'a kitchen holds at most ' + MOST + ' pieces, and this one has ' + P.length);
    const home = KINDS[kind], n = colsOf(P);
    let col = n;
    if (home !== 'tall') for (let c = 0; c < n; c++) {
      if (tallIn(P, c)) continue;
      if (!cellOf(P, home, c)) { col = c; break; }
    }
    P.push({ kind, row: home, col });
    compact(P);
    return made(L, P, { i: P.length - 1, did: 'added', column: col === n ? 'new' : 'old' });
  }
  function remove(L, i) {
    const P = read(L); if (!P) return NOT();
    const bad = named(P, i); if (bad) return bad;
    const gone = P.splice(i, 1)[0];
    compact(P);
    return made(L, P, { i, did: 'removed', place: gone });
  }
  const FIRST = Object.keys(FINISHES)[0];
  const finishBad = f => (typeof f === 'string' && own(FINISHES, f) ? null : no('finish', 'a finish is one of ' + Object.keys(FINISHES).join(', ') + ', and not ' + said(f)));
  const finishOf = p => (own(p, 'finish') ? p.finish : FIRST);
  const coat = (p, f) => { if (f === FIRST) delete p.finish; else p.finish = f; };
  function paint(L, i, finish) {
    const P = read(L); if (!P) return NOT();
    const bad = named(P, i) || finishBad(finish); if (bad) return bad;
    if (UNFINISHED.indexOf(P[i].kind) >= 0) return no('bare', 'the ' + P[i].kind + ' takes no finish');
    if (finishOf(P[i]) === finish) return no('still', 'the ' + P[i].kind + ' is ' + finish + ' already');
    coat(P[i], finish); compact(P);
    return made(L, P, { i, did: 'painted', finish });
  }
  function paintAll(L, finish) {
    const P = read(L); if (!P) return NOT();
    const bad = finishBad(finish); if (bad) return bad;
    const to = P.filter(p => UNFINISHED.indexOf(p.kind) < 0 && finishOf(p) !== finish);
    if (!to.length) return no('still', 'every piece a finish goes on is ' + finish + ' already');
    to.forEach(p => coat(p, finish)); compact(P);
    return made(L, P, { i: null, did: 'painted', finish, n: to.length });
  }

  function tidy(L) {
    const P = read(L); if (!P) return NOT();
    compact(P);
    return made(L, P, { i: null, did: 'compacted' });
  }

  const all = {
    kinds: KINDS,
    order: ['fridge', 'freezer', 'upper-cupboards', 'lower-cupboards', 'drawers', 'shelves', 'counter'],
    rows: ROWS,
    rank: { tall: 0, upper: 1, counter: 2, lower: 3 },
    template: TEMPLATE,
    pieces: { fridge: 'fridge', freezer: 'freezer', 'upper-cupboards': 'upperCupboard', 'lower-cupboards': 'lowerCupboard', drawers: 'drawers', shelves: 'wallShelf', counter: 'worktop' },
    bands: {
      fridge: { lo: 0, hi: 1 }, freezer: { lo: 0, hi: 1 },                       /* tall: the floor to the top of the wall's rows */
      'upper-cupboards': { lo: 0.7, hi: 1 }, shelves: { lo: 0.7, hi: 1 },        /* hung at head height, over the splash */
      counter: { lo: 0.54, hi: 0.69 },                                            /* the slab on the counter's line, 0.57, and its splash */
      'lower-cupboards': { lo: 0, hi: 0.54 }, drawers: { lo: 0, hi: 0.54 },      /* on the floor, under the slab */
    },
    fulls: ['room', 'almost', 'full'],
    finishes: FINISHES,
    unfinished: UNFINISHED,
    most: MOST,
    rules: { add, move, canMove, remove, paint, paintAll, compact: tidy },
  };
  /* frozen all the way down: every object, list and function in it, not only the top (each frozen before what it holds,
     so a function's prototype, which names the function again, is not walked twice) */
  const freeze = o => { Object.freeze(o); Object.getOwnPropertyNames(o).forEach(k => { const v = o[k]; if (v && (typeof v === 'object' || typeof v === 'function') && !Object.isFrozen(v)) freeze(v); }); return o; };
  return freeze(all);
})();
