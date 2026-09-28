/* One room. Five tiles: s stone, . floor, b barrel, d desk, g grass.
   None of the five is a letter the engine already owns (docs/TAGS.md L1). */
const WORLD_DEFS={
  lamp:[
    "sssssssss",
    "s...b...s",
    "s.K...g.s",
    "s..d..M.s",
    "s.......s",
    "sssssssss"
  ]
};
const PORTALS={};                 /* one room needs no doors — a deliberate probe */
const WNPC={lamp:{K:{npc:"kepa",q:[0]},M:{npc:"mira",q:[]}}};
