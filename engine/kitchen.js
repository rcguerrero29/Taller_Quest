/* ---------- KITCHEN — the kinds of place a kitchen wall has, the rows they stand in, and where a kitchen starts ----------
   One copy, for every game that has a kitchen. A game's own page reads it; the engine's 3D camera builds each kind with
   the shape named here (engine/shapes.js, grep "THE KITCHEN WALL").

   WHAT THIS FILE IS. One global, `KITCHEN`, and nothing else: data, frozen all the way down, so nothing that reads it can
   change it for anything else that reads it. It reads no global, touches no page and runs nothing but its own freeze.
   It is held on every build (test/engine.smoke.js, grep "THE KITCHEN'S ONE COPY").

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
  const all = {
    kinds: { fridge: 'tall', freezer: 'tall', 'upper-cupboards': 'upper', 'lower-cupboards': 'lower', drawers: 'lower', shelves: 'upper', counter: 'counter' },
    order: ['fridge', 'freezer', 'upper-cupboards', 'lower-cupboards', 'drawers', 'shelves', 'counter'],
    rows: ['upper', 'counter', 'lower'],
    rank: { tall: 0, upper: 1, counter: 2, lower: 3 },
    template: TEMPLATE,
    pieces: { fridge: 'fridge', freezer: 'freezer', 'upper-cupboards': 'upperCupboard', 'lower-cupboards': 'lowerCupboard', drawers: 'drawers', shelves: 'wallShelf', counter: 'worktop' },
    bands: {
      fridge: { lo: 0, hi: 1 }, freezer: { lo: 0, hi: 1 },                       /* tall: the floor to the top of the wall's rows */
      'upper-cupboards': { lo: 0.7, hi: 1 }, shelves: { lo: 0.7, hi: 1 },        /* hung at head height, over the splash */
      counter: { lo: 0.54, hi: 0.69 },                                            /* the slab on the counter's line, 0.57, and its splash */
      'lower-cupboards': { lo: 0, hi: 0.54 }, drawers: { lo: 0, hi: 0.54 },      /* on the floor, under the slab */
    },
  };
  /* frozen all the way down: every object and array in it, not only the top */
  const freeze = o => { Object.getOwnPropertyNames(o).forEach(k => { const v = o[k]; if (v && typeof v === 'object') freeze(v); }); return Object.freeze(o); };
  return freeze(all);
})();
