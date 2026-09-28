/* ONE ROOM. Nine by seven, and the tray is the only thing in it you do anything to.

   Seven glyphs, and not one of them is a letter the engine already owns (docs/TAGS.md L1 lists the
   ~thirty it pre-assigns: # B Q Z D K T A S H I W V F G C X P J ~ ^ 1 ⊓ ≡ ▲ ▼ ◺ 3 4 5, plus N for
   a standing person and + E L O for doors). Every one here is lower case and free.

     w  the whitewashed wall
     .  the floor
     h  el horno — the oven, brick, with its mouth and its iron door
     f  the flour bin
     m  LA MASA — the dough bench, one lump on a floured board   <- the other readable thing
     p  THE TRAY, with three plain rounds of dough on it        <- the readable thing
     v  THE TRAY, baked, vanilla shells   (the tile p becomes)
     c  THE TRAY, baked, chocolate shells (the tile p becomes)

   m IS A SECOND BENCH, not a second room. It is one tile west of the tray with a floor tile between
   them, on purpose: they are drawn from the same hBench() so they are the same carpenter's bench,
   and the tile between them is where a baker stands to work at both. Adjacent would have been worse
   — two 0.82-wide tops butted against a 1.0 tile pitch leave a visible gap in what the eye is being
   asked to read as one surface, and a gap in the middle of one bench is a bug you cannot unsee.
   You read the dough from (2,4), the tile under it, which is where holding the left button from
   beside the tray brings you to a stop.
   AND MARI MOVED ONE TILE WEST FOR IT, from (2,4) to (1,4). She was standing directly south of the
   dough bench, which is between it and the camera: rendered at 390x844 from the spawn, the baker's
   own body hid the dough completely in the 3D view, so the second verb was invisible from the one
   place every player starts. She is beside her dough now instead of in front of it — still hers,
   and the tile below the bench is free for a player to stand on and read it.

   p, v and c are the SAME tray in three states. They are all in SOLIDX, so the swap can never
   change what a person can walk on: the room is exactly as reachable after the bake as before it.
   NO PORTALS. One room needs no doors — and it also means propsReset() (engine.js, grep `function propsReset`, which
   fires only in worldArrived) can never run, so the bake stands for the whole session. That is a
   property of having one room, not a property of the bake; see docs note in docs.js. */
const WORLD_DEFS={
  horno:[
    "wwwwwwwww",
    "whh....fw",
    "w.......w",
    "w.m.p...w",
    "wM....Y.w",
    "w.......w",
    "wwwwwwwww"
  ]
};
const PORTALS={};
/* `still:true` ON TITO, AND IT IS NOT A STYLE CHOICE — IT IS A FLAKE THAT WAS CAUGHT.
   wanders(n) (engine.js, grep `wanders=`) is `!n.still && (!n.doc||n.roams) && (!n.q||!n.q.length)`. Mari has
   a quest so she never moves. Tito has `q:[]`, so he paced — and a standing person is stamped
   into the grid as "N", which is impassable to the reachability audit and to the player. In a
   room nine tiles wide, PLACES.parkDog, parkDogHome and parkAdopt all sit on floor he can reach,
   so on the third run of test/horno.js the shared suite came back with `the dog's park home (6,5)
   is blocked` — a red that had been green twice. That is docs/POSTMORTEM.md "7, extended" in a
   kitchen: a world with a random mover in it is its own fuzzer, and the red was true. A man
   leaning on the wall of a one-room panaderia was never supposed to be walking over the dog's
   corner anyway, so the fix is the man, not the check. */
const WNPC={horno:{M:{npc:"mari",q:[0]},Y:{npc:"tito",q:[],still:true}}};
