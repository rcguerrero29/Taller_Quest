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
               between, as My kitchen's wall always had them, unless the layout has gaps on (below).
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
                 moveTo(layout, i, col, wall)  the place put on column `col` of a wall, which has room for it: an empty
                                          column for any piece, or, for a piece that is not tall, a column with no tall
                                          piece and its own row free there. `wall` left out is the back wall; a number is
                                          a side wall, its index in the layout's `sides` (below). Only on a wall with gaps
                                          (a tap on an empty square).
               GAPS (2026-10-30, `gaps` in the layout: true, and nothing else, turns them on; a world sets it for its own
               kitchen, and nothing kept on a device may). With gaps on, a piece may stand anywhere on the wall, with
               empty columns before it: no rule numbers the columns again, so a column a move or a remove leaves empty
               stays empty, and nothing along the wall shifts to close it; left and right step to the next square, a
               piece that is not tall still skipping a tall piece's column but stopping on an empty one; a tall piece
               moves onto an empty square, or swaps with the column beside it as before; nothing moves left of the first
               column; an added piece takes the first column from the left with room for it (a tall one, the first
               empty column); compact changes nothing; and no column is past the wall's squares: as many as its
               `wall` and `free` lists hold together, when the layout has them (the engine's layout does), and 40
               otherwise. A refusal then may also say `gaps` (moveTo on a wall without them), `square` (a column off the
               wall), `taken` (no room there) or `room` (no square left). With gaps off, or left out, every rule is
               exactly as it was before gaps: My kitchen's packed wall.
               SIDE WALLS (sprint 7 of the 3D kitchen: an L or a U along walls, never an island). On a wall with gaps, a
               layout may name up to 2 side walls, `sides: [{squares, face}, …]`, and a place on one says `side`, that
               wall's index in the list, with `col` counted along that wall's own squares from 0 (a place that names no
               `side` stands on the back wall, as every place did before). Each side wall has as many squares as
               its `squares` list holds. Every rule keeps a piece on its own wall: left and right step along it and stop
               at its ends, up and down stay in its column, and only moveTo, naming a wall, puts it on another. An added
               piece takes the first column with room on the back wall, and then on each side wall in order. The corner
               where two walls meet is on neither wall's list, so no piece ever stands there: it is left empty. `sides`
               is read only with gaps on and only as a list: without gaps, or without side walls, every rule is exactly
               as it was before them.

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
  const SIDES = ['left', 'right', 'up', 'down'], COLS = 40, SIDESMOST = 2;
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
  /* ON ONE WALL (sprint 7): `on` says whether a place stands on the wall being asked about; left out, every place does,
     which is every layout with no side walls */
  const ALL = () => true;
  const tallIn = (P, c, on) => P.find(p => p.col === c && p.row === 'tall' && (on || ALL)(p)) || null;
  const cellOf = (P, row, c, on) => P.find(p => p.col === c && (p.row === 'tall' || p.row === row) && (on || ALL)(p)) || null;
  /* no empty column is left on the wall: the columns are numbered again from the left, in their order */
  function compact(P) {
    const used = Array.from(new Set(P.map(p => p.col))).sort((a, b) => a - b);
    P.forEach(p => { p.col = used.indexOf(p.col); });
    return P;
  }
  const sig = P => P.map((p, i) => i + ':' + p.row + ':' + p.col + (Number.isInteger(p.side) ? ':' + p.side : '')).sort().join('|');
  /* GAPS: on only when the layout says `gaps: true`; then how many squares the wall has, its wall's and its free squares
     together where it lists them, 40 where it does not */
  const gapsOf = L => !!L && typeof L === 'object' && own(L, 'gaps') && L.gaps === true;
  const roomOf = L => (Array.isArray(L.wall) ? Math.min(COLS, L.wall.length + (Array.isArray(L.free) ? L.free.length : 0)) : COLS);
  /* SIDE WALLS (sprint 7): read only with gaps on, and only from a list; each side wall's squares, as many as it lists, at
     most 40. A place's wall is its `side`, an index into that list, or the back wall (-1) when it names none */
  const sidesOf = L => (gapsOf(L) && Array.isArray(L.sides) ? L.sides.slice(0, SIDESMOST).map(w => Math.min(COLS, w && typeof w === 'object' && Array.isArray(w.squares) ? w.squares.length : 0)) : []);
  const BACK = -1, wallKey = p => (Number.isInteger(p.side) && p.side >= 0 ? p.side : BACK);
  const wallOf = L => { if (!gapsOf(L)) return null; const S = sidesOf(L);
    return { room: roomOf(L), sides: S, key: S.length ? wallKey : () => BACK, roomOn: k => (k === BACK ? roomOf(L) : (S[k] || 0)) }; };
  /* the places on one place's wall: every place, on a layout with no side walls */
  const mates = (G, p) => { if (!G || !G.sides.length) return ALL; const k = G.key(p); return q => G.key(q) === k; };
  /* the wall made tidy after a change: packed with gaps off, left as it is with them on */
  const after = (P, G) => (G ? P : compact(P));
  /* A MOVE, on the copy P: true when it was made (whether it changes anything is canMove's). G is the wall with gaps on
     (its room), or null for a packed wall */
  function step(P, i, side, G) {
    const p = P[i], on = mates(G, p), n = G ? G.roomOn(G.key(p)) : colsOf(P);   /* along its own wall, and no other (sprint 7) */
    if (side === 'left' || side === 'right') {
      const d = side === 'left' ? -1 : 1;
      if (p.row === 'tall') {
        const c1 = p.col, c2 = c1 + d;
        if (c2 < 0 || c2 >= n) return false;
        P.forEach(x => { if (x.col === c2 && on(x)) x.col = c1; });
        p.col = c2;
        return true;
      }
      let c2 = p.col + d;
      while (c2 >= 0 && c2 < n && tallIn(P, c2, on)) c2 += d;
      if (G && (c2 < 0 || c2 >= n)) return false;   /* with gaps, the wall's own squares and no further */
      if (c2 < 0) { P.forEach(x => { x.col += 1; }); p.col = 0; }
      else if (c2 >= n) p.col = n;
      else { const o = cellOf(P, p.row, c2, on); if (o) o.col = p.col; p.col = c2; }
      return true;
    }
    if (p.row === 'tall') return false;
    const r2 = ROWS[ROWS.indexOf(p.row) + (side === 'up' ? -1 : 1)];
    if (!r2) return false;
    const o = cellOf(P, r2, p.col, on);
    if (o) o.row = p.row;
    p.row = r2;
    return true;
  }
  const copy = P => P.map(p => Object.assign({}, p));
  function canMove(L, i, side) {
    const P = read(L);
    if (!P || named(P, i) || SIDES.indexOf(side) < 0) return false;
    const G = wallOf(L), now = after(copy(P), G), sim = copy(P);
    if (!step(sim, i, side, G)) return false;
    after(sim, G);
    return sig(sim) !== sig(now);
  }
  function move(L, i, side) {
    const P = read(L); if (!P) return NOT();
    const bad = named(P, i); if (bad) return bad;
    if (SIDES.indexOf(side) < 0) return no('side', 'a piece moves left, right, up or down, and not ' + said(side));
    if (!canMove(L, i, side)) return no('still', 'moving the ' + P[i].kind + ' ' + side + ' would change nothing on the wall');
    const G = wallOf(L), from = { row: P[i].row, col: P[i].col };
    step(P, i, side, G); after(P, G);
    return made(L, P, { i, did: 'moved', side, from, to: { row: P[i].row, col: P[i].col } });
  }
  /* PUT ON A SQUARE (a tap on an empty one): only with gaps on, onto a column on a wall that has room for it: the back
     wall, or (sprint 7) the side wall `wall` names, an index into the layout's `sides` */
  function moveTo(L, i, col, wall) {
    const P = read(L); if (!P) return NOT();
    const bad = named(P, i); if (bad) return bad;
    if (!gapsOf(L)) return no('gaps', 'a piece is put on a square of its own only on a wall with gaps');
    const G = wallOf(L), p = P[i], to = wall === undefined || wall === null ? BACK : wall;
    if (to !== BACK && !(Number.isInteger(to) && to >= 0 && to < G.sides.length)) return no('square', 'there is no side wall ' + said(wall) + ' in a layout with ' + G.sides.length);
    const room = G.roomOn(to), on = q => G.key(q) === to;
    if (!Number.isInteger(col) || col < 0 || col >= room) return no('square', 'there is no column ' + said(col) + ' on a wall of ' + room + ' squares');
    if (p.col === col && G.key(p) === to) return no('still', 'the ' + p.kind + ' stands in column ' + col + ' already');
    const there = P.filter(q => q !== p && q.col === col && on(q));
    if (p.row === 'tall' ? there.length : (there.some(q => q.row === 'tall') || there.some(q => q.row === p.row)))
      return no('taken', 'the ' + p.kind + ' has no room in column ' + col + (p.row === 'tall' ? ': a tall piece stands on an empty square' : ''));
    const from = { row: p.row, col: p.col }; if (G.key(p) !== BACK) from.side = G.key(p);
    p.col = col;
    if (to === BACK) delete p.side; else p.side = to;
    const at = { row: p.row, col }; if (to !== BACK) at.side = to;
    return made(L, P, { i, did: 'moved', side: null, from, to: at });
  }
  function add(L, kind) {
    const P = read(L); if (!P) return NOT();
    if (typeof kind !== 'string' || !own(KINDS, kind)) return no('kind', 'there is no kind of place called ' + said(kind));
    if (P.length >= MOST) return no('most', 'a kitchen holds at most ' + MOST + ' pieces, and this one has ' + P.length);
    const G = wallOf(L), home = KINDS[kind], n = colsOf(P);
    let col = G ? -1 : n, onto = BACK;
    /* with gaps: the first column with room for it, a tall one the first empty one, on the back wall, and then (sprint 7)
       on each side wall in its order */
    if (G) for (const k of [BACK].concat(G.sides.map((_, s) => s))) {
      const on = q => G.key(q) === k;
      for (let c = 0; c < G.roomOn(k); c++) {
        if (home === 'tall' ? P.some(p => p.col === c && on(p)) : (tallIn(P, c, on) || cellOf(P, home, c, on))) continue;
        col = c; break;
      }
      if (col >= 0) { onto = k; break; }
    }
    else if (home !== 'tall') for (let c = 0; c < n; c++) {
      if (tallIn(P, c)) continue;
      if (!cellOf(P, home, c)) { col = c; break; }
    }
    if (col < 0) return no('room', 'there is no square left on this wall for a ' + kind);
    P.push(onto === BACK ? { kind, row: home, col } : { kind, row: home, col, side: onto });
    after(P, G);
    return made(L, P, { i: P.length - 1, did: 'added', column: col >= n ? 'new' : 'old' });
  }
  function remove(L, i) {
    const P = read(L); if (!P) return NOT();
    const bad = named(P, i); if (bad) return bad;
    const gone = P.splice(i, 1)[0];
    after(P, wallOf(L));
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
    coat(P[i], finish); after(P, wallOf(L));
    return made(L, P, { i, did: 'painted', finish });
  }
  function paintAll(L, finish) {
    const P = read(L); if (!P) return NOT();
    const bad = finishBad(finish); if (bad) return bad;
    const to = P.filter(p => UNFINISHED.indexOf(p.kind) < 0 && finishOf(p) !== finish);
    if (!to.length) return no('still', 'every piece a finish goes on is ' + finish + ' already');
    to.forEach(p => coat(p, finish)); after(P, wallOf(L));
    return made(L, P, { i: null, did: 'painted', finish, n: to.length });
  }

  function tidy(L) {
    const P = read(L); if (!P) return NOT();
    after(P, wallOf(L));
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
    rules: { add, move, canMove, moveTo, remove, paint, paintAll, compact: tidy },
  };
  /* frozen all the way down: every object, list and function in it, not only the top (each frozen before what it holds,
     so a function's prototype, which names the function again, is not walked twice) */
  const freeze = o => { Object.freeze(o); Object.getOwnPropertyNames(o).forEach(k => { const v = o[k]; if (v && (typeof v === 'object' || typeof v === 'function') && !Object.isFrozen(v)) freeze(v); }); return o; };
  return freeze(all);
})();
