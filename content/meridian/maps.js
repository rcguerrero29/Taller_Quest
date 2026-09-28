/* Meridian Quest content pack — worlds, portals, construction stages, trolley stops. */
/* ---------- worlds (multi-map: HQ, Floor 2, Street) ---------- */
const WORLD_DEFS={
 hq:["####################",
     "#......#........#..#",
     "#.p..D.#.D....D.#c.#",
     "#......+........+..#",
     "#.j..D.#........####",
     "#......#..RR...#...#",
     "####+###..RR...#.l.#",
     "#......#.......+...#",
     "#.t.K..+...m...#####",
     "#......#.......#...#",
     "####+###...P...#.h.#",
     "#......#.......+...#",
     "#.a....+.......#####",
     "##########+⊓⊓⊓⊓#####",
     "#..........≡≡≡▲#####",
     "#..................#",
     "##########E#########"],
 /* Floor 2 opens BARE, as signed (STORY.md ❗La oficina, 2026-09-02): the old lead's
    desk alone under the north wall, the stairs, and nothing else — the barrio furnishes
    it one piece per business, and the two neighbours who ask what goes in it are placed
    by content/meridian/room.js, not by a letter here. The north window (three "|"
    panes over the desk, declared in art.js) looks north: the road out of the barrio
    and the line being laid — Nacho + Don Güero, 2026-09-02. */
 /* MID-MOVE since 2026-09-02 (owner: "for the move it should be mid"): four taped boxes
    (□, art.js), one of Don Güero's cones and a plant still in its pot. The arrival tile
    (14,14) and the sight line from the top of the flight to the window stay clear — Nacho's
    "nothing in the way" is an answer a player can pick, so it has to be true. */
 f2:["##▭#▭#▭##|||#▭#▭#▭##",
     "#.........D........#",
     "#.................P#",
     "#..................#",
     "#..................#",
     "#..............□...#",
     "#..................#",
     "#..................#",
     "#..................#",
     "#...............C..#",
     "#................□□#",
     "#.............□....#",
     "#..................#",
     "#.........◺◺◺◺.....#",
     "#........◺▼≡≡≡.....#",
     "#.........◺◺◺◺.....#",
     "####################"],
 st:["BBBBBBBBBBBBBBEBBBBBBBBBBBBBBB",
     ".Y...........................2",
     "≈≈≈≈≈≈≈≈≈≈≈≈≈--≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈",
     "≈≈≈≈≈≈≈≈≈≈≈≈≈--≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈",
     "....C...b........b.......C....",
     "QQQQQQLQQQQQQ..FFFFFF.FFFFFFFF",
     "..............F..G....G...G..F",
     "..............F............e.F",
     "..............F.G...GX...G...F",
     "..............FFFFFFFFFFFFFFFF",
     "..............................",
     "....P....................P....",
     "........g............g........",
     "...XX....................XX...",
     "..J.........J.....J.......J...",
     "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"],
 ex:["...J.....J.....J....J...",
     "≈≈≈≈≈-≈≈≈≈≈≈≈≈≈≈≈-≈≈≈≈≈≈",
     "....................Y...",
     "2..................q.m..",
     "..FFFFFFFFF.FFFFFFFFFʘ..",
     "..F..G...G....G...G..F..",
     "..F.w....A....x...z..F..",
     "..F.g.G....G....G....F..",
     "..FFFFFFFFFFFFFFFFFFF...",
     ".....g......J.....g.....",
     "FFFFFFFFFFFFFFFFFFFFFFFF"],
 lo:["####################",
     "#UU..UU..UU..UU..UU#",
     "#..................#",
     "#..A....A....A.....#",
     "#..................#",
     "#....RR....T.d.....#",
     "#..................#",
     "#..P..........P....#",
     "#..................#",
     "##########O#########"],
 /* El Mercado Robles — Doña Chelo's abarrotes. Shelves (S) and crates (H) line the
    walls, the counter (I) runs west, the carnicería sits mid-floor. Stations:
    n Nando · s Chelo · u Perla · v Chava. */
 me:["####################",
     "#..................#",
     "#.SS...SS....SS..S.#",
     "#..................#",
     "#..H...H....H...H..#",
     "#.....H......H.....#",
     "#...n.....s....u...#",
     "#..................#",
     "#.IIII...H...v..H..#",
     "#..................#",
     "#..P............P..#",
     "##########M#########"],
 lc:["####################",
     "#.P..............P.#",
     "#..................#",
     "#..T...T...T...T...#",
     "#..................#",
     "#....RR............#",
     "#..................#",
     "#KKKKKKK...KKKKKKK.#",
     "#WV................#",
     "#..r..........y....#",
     "#..................#",
     "##########L#########"],
 /* El Parque 🌈 — Sonny's park, reached only on the leash (no street door).
    A river (~) runs down the west side; the rainbow bridge (^) crosses it at the
    exit row. The doghouse (9) is where adoptions happen. This map is the preview
    of the pet-care spin-off (IDEAS §13) and its future starting map. */
 /* ---------- the four parcels (Don Güero, 2026-09-02) ---------- */
 /* Taller Herrera: three lifts with painted bays along the north, parts wall NE, Yesenia
    two steps inside the door with her counter, the office nook SW, a waiting corner SE. */
 ta:["####################",
     "#.............SSSS.#",
     "#i7i.i7i.i7i.......#",
     "#..................#",
     "#...t......m.....8.#",
     "#8.................#",
     "#..................#",
     "#S.................#",
     "#D........yKKK.RR..#",
     "#..............⊔⊔P.#",
     "#..................#",
     "##########%#########"],
 /* Panadería La Espiga: ovens NW, bread racks along the north, the proofing fridge NE,
    the counter west with Sol at its end, two café tables. */
 pa:["####################",
     "#▣▣.....S.S.S.S...W#",
     "#..................#",
     "#..l.........t.....#",
     "#..................#",
     "#KKKK..........T...#",
     "#....s.............#",
     "#..P.........T...P.#",
     "#..................#",
     "##########@#########"],
 /* Limpieza Velázquez: schedule boards on the north wall, two desks, supply shelves,
    supply boxes and a wet-floor cone, Chente on the floor with the crew. */
 li:["####################",
     "#UU.UU.......S.S.S.#",
     "#..................#",
     "#.D......D.........#",
     "#.k......v.........#",
     "#..................#",
     "#...........□□.C...#",
     "#.RR....c..........#",
     "#.P..............P.#",
     "##########*#########"],
 /* Nolasco Tax & Notario: a walkup. Cabinets and the licenciado's desk NW, a north
    window, the waiting corner SW. The avenue door `$` is the FOOT of the stairs; you come up
    unseen and appear at the top, in the stair room east of the office (#7, the owner's plan,
    2026-09-07): a door at (15,2) between the rooms, the engine's railed well at (16–20,4) with
    ▼ at (17,4) the way down. The office itself did not move. */
 /* THE FLIGHT IS WALKED NOW (owner, 2026-09-17: "then that door right there to the top of a
    staircase… until you figure out how to teleport in my side of the screen"; ARCH-LOG A16, option
    B, signed "ok lets do b"). It was ▼ at 16 with three treads and the landing at 21-22, and the
    avenue door put you on the LANDING — at the top, with the whole climb behind you, having walked
    none of it. Two things changed and neither is an engine change:
      · the run is FIVE treads against a wall 1.1 tiles high, so the well is now 0.96 deep
        (wellDepth: STAIRH×6 at the ▼). Three treads dropped 0.64 and read as a dip in the floor,
        not as a storey. The rails follow the run for its whole length, which they did not before;
      · you arrive on the BOTTOM TREAD facing up it (PORTALS.st["$"] below), because that is where
        a person who has just come in off the avenue is standing.
    Arriving one tile east of the ▼ rather than on it is deliberate: the engine warns about a spawn
    on a portal tile and portalHold would have made it safe, but the bottom step is the truer place
    to put somebody who has just opened a street door, and it costs no argument with a guard. */
 no:["#######|################",
     "#▯▯.D....S.S...#.......#",
     "#...n..........+.......#",
     "#............P.#◺◺◺◺◺◺.#",
     "#..............#▼≡≡≡≡≡.#",
     "#KK......RR....#◺◺◺◺◺◺.#",
     "#Pe......⊔⊔....#.......#",
     "########################"],
 pk:["FFF~~FFFFFFFFFFFFFFFFFFF",
     "F..~~...g....J.....b...F",
     "F..~~..................F",
     "F..~~....b....g...9....F",
     "F..~~..................F",
     "F..^^.....P......g.....F",
     "2..^^..................F",
     "F..~~....g....b........F",
     "F..~~....3.4.5.g...J...F",
     "F..~~..J...............F",
     "F..~~......g.....b✿✿...F"   /* (17,10) is `b`, the raised BED. (18,10) (19,10) are `✿`, loose
     cempasúchil laid on the ground from that bed to the ofrenda at 20. Marigolds are how the souls
     are shown the way — the flower IS the arrow, which is the one the owner said the altar in the
     corner needed, and it is the historically correct one. Walkable, so it cannot cork the park
     (R11). Pili, 2026-09-16.
     THE TWO OBJECTS WERE ONE LETTER, AND THE SENTENCE ABOVE WAS FALSE FOR A DAY. On 2026-09-21 all
     three tiles were `b` and `b` went into SOLIDX so the bed could have a curb (the line below,
     and docs/BEAUTIFY.md row 3) — which turned the trail solid too, so the arrow that shows the
     souls the way was a wall you walked around, while this comment went on saying "Walkable". A
     raised bed and a scatter of loose petals are not the same thing and may not share a name.
     la florista, 2026-09-22 — the owner's words: "can you try to lookinto making petals? that i
     can walk and interact through as if they were mounds of items piled up". */,
     "FFF~~FFFFFFFFFFFFFFFFFFF"]
};
/* la caja de escalera (#4, Don Güero's candidate B, walked in the town first, 2026-09-06): HQ grew
   three rows south — a lobby at the front door, a stair hall behind the door at (10,13), the
   flight east with its head ▲ at (14,14) the way up; the loft's ▼ at (10,14) the way down, the
   deepest tile of a railed well. Coming in from the street you land on the landing (10,14). */
const PORTALS={hq:{"▲":{to:"f2",x:14,y:14,dir:"left",mark:"up"},"E":{to:"st",x:14,y:1,dir:"down"}},   /* the only flight in the city that CLIMBS — its arrow says so */
               f2:{"▼":{to:"hq",x:10,y:14,dir:"right"}},
               st:{"E":{to:"hq",x:10,y:14,dir:"up"},"L":{to:"lc",x:10,y:10,dir:"up"},"O":{to:"lo",x:10,y:8,dir:"up"},"M":{to:"me",x:10,y:10,dir:"up"},"2":{to:"ex",x:1,y:3,dir:"right"}},
               ex:{"2":{to:"st",x:28,y:1,dir:"left"}},
               lc:{"L":{to:"st",x:6,y:4,dir:"up"}},
               lo:{"O":{to:"st",x:21,y:4,dir:"up"}},
               me:{"M":{to:"st",x:6,y:12,dir:"up"}},
               pk:{"2":{to:"st",x:22,y:10,dir:"down"}},
               /* the four parcels: each street door → its interior; each interior door → its doorstep */
               ta:{"%":{to:"st",x:23,y:12,dir:"up"}},
               pa:{"@":{to:"ex",x:7,y:2,dir:"up"}},
               li:{"*":{to:"ex",x:12,y:2,dir:"up"}},
               /* #7 (owner, 2026-09-07: "expand the building for meridian in the right side and add the
                  staircase through a door from that room"): the office grew EAST; a door at (15,2) opens into
                  a stair room whose railed well goes down to the avenue — the last old `1` left the city */
               no:{"▼":{to:"st",x:25,y:1,dir:"down"}}};
PORTALS.st["%"]={to:"ta",x:10,y:10,dir:"up"};
PORTALS.st["$"]={to:"no",x:17,y:4,dir:"right"}; /* the avenue door IS the foot of Nolasco's stairs, so you arrive on the bottom step with the door behind you and five treads in front — and you walk them. It used to land you at 21,4: the top of the flight, reached by opening a door at the bottom of it. */
PORTALS.ex["@"]={to:"pa",x:10,y:8,dir:"up"};
PORTALS.ex["*"]={to:"li",x:10,y:8,dir:"up"};
/* the four storefront ribbons — each rises when its district opens (GROWTH.ribbons) */
const TALLER=[[13,18,"="],[13,19,"="],[13,20,"="],[13,21,"="],[13,22,"="],[13,23,"%"],
              [13,24,"="],[13,25,"="],[13,26,"="],[13,27,"="],[13,28,"="],
              [14,19,"6"],[14,25,"0"]];                   /* the Caprice and the tire stack on the apron */
const ESPIGA=[[0,4,"&"],[0,5,"&"],[0,6,"@"],[0,7,"&"],[0,8,"&"],
              ];  /* NO sidewalk row. Until 2026-09-11 this stamped [1,4..8,"."] — ten cream tiles
                     painted across the tram's own lane (TROLLEYAT ex row 1), which is the only ground in
                     either game that lied about what it was, and [1,5,"."] painted out the neighbours'
                     zebra crossing at (5,1) that maps.js:277 promises. The north pavement is row 0 and
                     the storefront consumed it; the answer is a third row (Don Güero's La banqueta),
                     not paint in the carriageway. */
const VELAZQUEZ=[[0,10,"!"],[0,11,"!"],[0,12,"*"],[0,13,"!"],[0,14,"!"],
                 ];  /* same — see ESPIGA above */
const NOLASCO=[[0,25,"$"]];                                /* one door in the avenue wall; the climb is inside */
/* city growth: helping La Obra visibly advances the construction site */
const OBRA=[[],
 [[6,17,"#"],[6,22,"#"],[6,26,"#"],[8,16,"#"],[8,20,"#"],[8,25,"#"]],
 [[5,15,"B"],[5,16,"B"],[5,17,"B"],[5,18,"B"],[5,19,"B"],[5,20,"B"],[5,21,"O"],
  [5,22,"B"],[5,23,"B"],[5,24,"B"],[5,25,"B"],[5,26,"B"],[5,27,"B"],[5,28,"B"],[5,29,"B"],
  [6,14,"B"],[6,29,"B"],[7,14,"B"],[7,29,"B"],[8,14,"B"],[8,29,"B"],[8,21,"."],
  [9,14,"B"],[9,15,"B"],[9,16,"B"],[9,17,"B"],[9,18,"B"],[9,19,"B"],[9,20,"B"],[9,21,"B"],
  [9,22,"B"],[9,23,"B"],[9,24,"B"],[9,25,"B"],[9,26,"B"],[9,27,"B"],[9,28,"B"],[9,29,"B"]]];
/* El Mercado opens on the southwest lot once Week One's district has played its
   ending — the facade replaces the barricades, the door (M) drops into the middle of
   the ribbon. Opening the next district never closes this one: Week One's quests stay
   answerable forever (docs/OWNER.md — no practice is ever missed). */
const MERCADO=[[13,1,"Z"],[13,2,"Z"],[13,3,"Z"],[13,4,"Z"],[13,5,"Z"],[13,6,"M"],
               [13,7,"Z"],[13,8,"Z"],[13,9,"Z"],[13,10,"Z"],[13,11,"Z"]];
/* ---------- the content seam: what the engine draws, declared here ----------
   The engine hardcodes nothing about Meridian's buildings. A new business is a
   content edit: give it a door glyph, a mini-map colour, a label, and a dot.
   (The full per-glyph tile registry is queued with the graphics-prep refactor.) */
const DOORS="+ELOM%@*$⌂";                      /* glyphs painted as a door — ⌂ is a HOME's front door (#10): keyed by where it stands, not by its letter, so every casa may wear it */
/* DOORLOOK — what tells one door from another, by glyph. The engine draws one door
   body; this colours it for where it leads, so a shop entrance is not the same brown
   as an office door (the cold read, IDEAS §15.8, found all five pixel-identical).
   `glass` gives a door a window — shops have one, an interior door does not.
   A glyph not listed is the plain interior door. */
const DOORLOOK={E:{wood:"#4F5474",wood2:"#5F6588",frame:"#2E3147",glass:true}, /* Meridian HQ: the office's blue-grey */
                L:{wood:"#B5432F",wood2:"#C9553F",frame:"#6E2A1E",glass:true}, /* La Cocina: terracotta */
                O:{wood:"#C98A2D",wood2:"#E0A430",frame:"#6B4A17",glass:true}, /* La Obra · Studio: site yellow */
                M:{wood:"#4E7A4A",wood2:"#5F8F5A",frame:"#2C4A2A",glass:true}, /* El Mercado: stall green */
                "%":{wood:"#7C8590",wood2:"#8E98A3",frame:"#3A3F46"},           /* Taller: steel — TILEART draws the roll-up over it */
                "@":{wood:"#D9A441",wood2:"#E8B85A",frame:"#7A4E17",glass:true}, /* La Espiga: wheat */
                "*":{wood:"#3FA3A0",wood2:"#52B8B4",frame:"#1F5A58",glass:true}, /* Velázquez: teal */
                "$":{wood:"#6E2F4A",wood2:"#84405E",frame:"#3A1728",glass:true}, /* Nolasco: burgundy, frosted */
               "⌂":{wood:"#8A5A2B",wood2:"#A26A35",frame:"#4A2E17",glass:false}}; /* a home on Calle Dos: plain pine, no glass */
const SOLIDX="ZSHI~9|□=6780&!▣▯⊔○▭▤▦▩▨◫ʘb";  /* b, the raised marigold BED, is not walked through: a knee-high box with a painted curb. docs/BEAUTIFY.md row 3 is where that came from and it is a sound citation: the row is marked as an assumption in the register's own form and its words are that a marigold bed is not walked through and that nobody decided it. (Those words are paraphrased here on purpose. Quoting the marker VERBATIM makes `test/assumed.js` report this closed assumption as a live one — it greps the token, and a comment recording a decision is not a decision waiting to be made. Do not "restore" the quote.) What was NOT sound is its SCOPE: row 3 decided about the bed, and a solid is applied to a LETTER, and that letter was also carrying the trail of loose petals laid to the ofrenda (the pk row above). One row's decision about one object silently annexed a second one and made the arrow a wall. The petals are `✿` now, they are walkable, and they are deliberately not in this string. One part, one name. (la florista, 2026-09-22) */        /* solid glyphs this pack adds (~ water, 9 doghouse, | window, □ box, and the four parcels' tiles) */
const MAPCOL={"1":"#E0B45C","⌂":"#8A5A2B","ʘ":"#8A8F98","▭":"#6E6A80","▤":"#E8DFC4","▦":"#9E5442","▩":"#C9A77C","▨":"#BE9A72","◫":"#C9A77C",  /* the legend says "doors & stairs in gold" and the plan painted them grey */
  Z:"#4E7A4A",S:"#8A6F4D",H:"#B0895B",I:"#A8825A",M:"#E0B45C","~":"#4A7FA8","9":"#8A6F4D",
              "|":"#6E638A",  /* window: shades to the wall-top colour, so 3D gives it no darker cap */
              "□":"#C8A277",  /* moving box: cardboard, paler than the produce crate so the map never confuses them */
              "✿":"#E2620F",  /* loose petals: cempasúchil orange, so the plan never draws the trail in the bed's pink. The park is not a panel the plan draws (TOWNPLAN below is st and ex), so this is here for the day one of them is — and if it ever is, the plan's `nature` symbol is a canopy on a trunk, which is the wrong mark for something lying on the ground */
              "=":"#6E6A73","%":"#E0B45C","6":"#7A2E2E","7":"#5A6470","8":"#B3352B","0":"#2E2E33",
              "&":"#D9A441","!":"#3FA3A0","▣":"#4A4F57","▯":"#7C8590","⊔":"#8A6F4D","○":"#7A5C8A"};
/* mini-map labels. `when` reads the city's flags: obra 0-2, mercado bool. */
const TOWNLBL=[
 {x:15,y:0.75,s:10,c:"#F2E8D8",en:"MERIDIAN HQ  (⇧ FLOOR 2)",es:"MERIDIAN HQ  (⇧ PISO 2)"},
 {x:6.5,y:5.75,s:10,c:"#F2E8D8",en:"LA COCINA",es:"LA COCINA"},
 {x:22,y:7.7,s:10,c:"#3A2F17",en:"🚧 SITE",es:"🚧 OBRA",when:f=>f.stage<2},
 {x:22,y:7.7,s:10,c:"#F2E8D8",en:"LA OBRA · STUDIO",es:"LA OBRA · ESTUDIO",when:f=>f.stage>=2},
 {x:6,y:13.7,s:9,c:"#6B5210",en:"LOT: EL MERCADO",es:"LOTE: EL MERCADO",when:f=>!(f.up&&f.up.me)},
 {x:6,y:13.75,s:9,c:"#F2E8D8",en:"EL MERCADO ROBLES",es:"EL MERCADO ROBLES",when:f=>f.up&&f.up.me},
 {x:25.5,y:13.7,s:9,c:"#6B5210",en:"RESERVED LOT",es:"LOTE RESERVADO",when:f=>!(f.up&&f.up.ta)},
 {x:23,y:13.75,s:9,c:"#F2E8D8",en:"TALLER HERRERA",es:"TALLER HERRERA",when:f=>f.up&&f.up.ta},
 {x:25.5,y:0.75,s:8,c:"#F2E8D8",en:"NOTARIO ⇧",es:"NOTARIO ⇧",when:f=>f.up&&f.up.no},
 {x:27,y:1.7,s:8,c:"#6B5210",en:"CALLE DOS →",es:"CALLE DOS →"},
 {x:0.5,y:1.8,s:8,c:"#6B5210",dx:3,en:"🚋",es:"🚋"},
 /* ---- CALLE DOS, now that the plan draws it (TOWNPLAN above). A row carries `world` and the
    engine offsets it; a row without one belongs to the first panel, as every row did before. ---- */
 /* the street's own name goes ON the carriageway in the light ink, because the carriageway is
    the dark shape — the first draft used the dark ink and it was unreadable on its own road */
 {world:"ex",x:12,y:1.85,s:10,c:"#F2E8D8",en:"CALLE DOS",es:"CALLE DOS"},
 {world:"ex",x:5.5,y:0.8,s:8,c:"#F2E8D8",en:"LA ESPIGA",es:"LA ESPIGA",when:f=>f.up&&f.up.pa},
 {world:"ex",x:14,y:0.8,s:8,c:"#F2E8D8",en:"VELÁZQUEZ",es:"VELÁZQUEZ",when:f=>f.up&&f.up.li},
 {world:"ex",x:11.5,y:6.4,s:9,c:"#6B5210",en:"THE CREW PEN",es:"EL PATIO"},
 {world:"ex",x:2,y:1.85,s:8,c:"#F2E8D8",dx:-4,en:"🚋",es:"🚋"}
];
/* "you are here" on the town plan, for worlds that are interiors of the street */
/* Which kinds of "somebody is waiting" this plan carries, strongest first — the order is also
   which one wins when a person is two at once (engine: MAPMARK). Meridian declares work and host
   because those are the two that happen here; no neighbour in this city hands you a document, so
   "read" is not declared and a person who only had one would carry no mark at all. */
const MAPMARK=["work","host"];
/* THE PLAN DRAWS TWO STREETS (engine TOWNPLAN, 2026-09-16). The owner, from play: "im shown the
   other street map on calle 2" — he was standing on Calle Dos and the plan drew Calle Principal
   with a pin in the corner. Calle Principal is 30x16 and Calle Dos is 24x11, so Dos sits at oy 17
   and the row of paper between them reads as the block between two streets. */
const TOWNPLAN=[{world:"st",ox:0,oy:0},{world:"ex",ox:0,oy:17}];
/* MAPDOT is where a world that the plan does NOT draw gets its mark, in PAPER coordinates.
   Three names left this table when Calle Dos became a panel of its own:
     · `ex` — it is drawn now, so a pin pointing at it from Calle Principal is a pin at itself.
     · `pa` and `li` — La Espiga and Velázquez open off Calle Dos, and both were anchored at
       [29,1], a doorway on Calle PRINCIPAL. Their marks are found from the doors that actually
       lead to them (ESPIGA stamps `@` at ex 6,0 and VELAZQUEZ stamps `*` at ex 12,0), so the
       offset is written down once, in TOWNPLAN, instead of twice here and kept in agreement. */
/* ALL SEVEN OF THEM LEFT ON 2026-09-17, and the reason is the same one the note above gives for
   the first three — only this time it was measured rather than argued. Every hand-typed row here
   agreed EXACTLY with the door that leads to that world: ta 23,13 · no 25,0 · hq 14,0 · f2 14,0 ·
   lc 6,5 · lo 21,5 · me 6,13. Seven copies of a fact the map already had, and the failure mode of a
   copy is that the door moves and the copy does not. `planPlace` in the engine follows the doors
   now, recursively, so `f2` (reachable only from `hq`, which is itself only a dot) shares the
   office's address instead of needing its own line — which is also true of the building.
   Five worlds that had no row at all and no dot on the plan are placed for free by the same walk:
   `pa`, `li`, `casa-w`, `caseta`, `barberia`.
   WHAT STAYS, and this is what the table is actually for: a place with NO DOOR INTO IT. You reach
   the park on a leash, not through a portal, so nothing can ever derive it and the pack has to say.
   A guard holds every other declaration to the doors (test/engine.smoke.js). */
const MAPDOT={pk:[22,10]};
/* ---------- trolley fast travel: the streets never dead-end, they connect ---------- */
/* Where the Trolley Pass can put you: STREET STOPS ONLY. A trolley does not stop on the
   second floor of a building — the office came off this list on 2026-09-03 ("i dont like that
   i go from a train to a floor. dont do that. i asked to make the world realistic"). You reach
   the office the way you would reach an office: through the front door and up the stairs. */
/* ❗El camino, the owner's pick (2026-09-08): "do the street with a troley at the end or build the trolley that
   comes in periodically and ther is no building, person or house in the way, or it stops for people crossing or
   if i call it." The line the tram runs, per world: the row, and the ends it enters and leaves by. Calle
   Principal keeps both lanes and its crossing at x13–14; Calle Dos is one lane (row 1) with the sidewalk its
   two houses stand on below it (row 2) and a crossing at each door. The smoke fails if anything stands on a
   line: a wall, a person, a lot or a door. */
/* The stop moved from x:0 to x:1 on 2026-09-22 — the owner, in three words: "ok move one tile east."
   A car standing at a platform on the line's very FIRST tile can only stand at x=0 (troClampX keeps
   it on the street), so its body ran 0..2 and the platform sat at its west END: it presented its tail
   door to the person waiting, and at a quarter turn the car was between him and everything. One tile
   east and the same standing car — it still stops at x=0, nothing else changed — has the platform at
   its CENTRE. The `Y` on row 1 of the st map moved with it in the same commit: the map's stop glyph
   and the line's declared stops are one fact said twice and test/smoke.js fails if they disagree. */
const TROLLEYAT=[{world:"st",row:2,from:0,to:29,stops:[{x:1,y:1}]},
                 {world:"ex",row:1,from:20,to:0,stops:[{x:20,y:2}]}];
const TRV=[{w:"st",x:1,y:1,dir:"right"},{w:"ex",x:22,y:3,dir:"left"}];
/* ambient critters: kinds live in the engine (butterfly, colibri, gato); spawns are
   content. Each wanders a small radius around home; the gato is pettable. */
const CRITTERS=[
 {kind:"butterfly",world:"st",x:6,y:12,c:"#E4A7D8"},
 {kind:"butterfly",world:"ex",x:13,y:3,c:"#8FC7E8"},
 {kind:"colibri",world:"st",x:16,y:4,c:"#3FA88F"},
 {kind:"gato",world:"st",x:22,y:14,c:"#8B8F98",name:"Tuerca"}, /* the street cat picked the taller's lot before the shop did */
 {kind:"gato",world:"pa",x:2,y:3,c:"#E3C08A",name:"Bolillo"}, /* he lives in the flour bin */
 {kind:"gato",world:"li",x:16,y:7,c:"#F2F0EA",name:"Pelusa"}, /* she rides in the van */
 {kind:"gato",world:"no",x:2,y:2,c:"#3A3A40",name:"Timbre"} /* she sits where the doorbell would be */,
 {kind:"gato",world:"me",x:15,y:9,c:"#7A6A55"},  /* Frijol — the bodega cat, pettable */
 {kind:"beagle",world:"st",x:22,y:11,c:"#E8C46A",name:"Sonny",egg:"sonny"} /* the star himself */
];
/* one-off place identity as data (IDEAS §10): the engine's DECODRAW vocabulary
   (sign, mural) renders these in ALL FOUR cameras: top (engine.js drawDecor), front (the
   depth pass), iso (the billboard pass) and 3D (engine3d.js, a plane on the wall's first open
   face). (This comment claimed every camera, was corrected on 2026-09-03 to say iso and 3D
   were "queued" — and the two passes then shipped at `mq-v56` without the comment being
   updated again. Re-checked against the code 2026-09-05: all four exist.)
   Packs can add art via DECOART. */
const DECOR=[
 {world:"st",x:20,y:0,deco:"mural",wins:[]},   /* Nacho's own piece — the city's name, never earned. wins:[] — his piece takes the whole wall, so the two windows the `B` facade declares are plastered over and stay plastered over, at dusk too. */
 /* one panel per business, east of it along the same wall. Baby blue plaster until you begin
    that district; the colour brightens with the grade (art.js → DECOART.panel). */
 {world:"st",x:21,y:0,deco:"panel",id:"principal",c:"#7A5FE0",wins:[1]},
 {world:"st",x:22,y:0,deco:"panel",id:"mercado",  c:"#C0392B",wins:[1]},
 {world:"st",x:23,y:0,deco:"panel",id:"taller",   c:"#3B4650",wins:[1]},
 {world:"st",x:24,y:0,deco:"panel",id:"espiga",   c:"#A8691A",wins:[1]},  /* was #C98A2D, luma 146 on plaster at 215: 69 apart, under the 90 floor. Found by the same guard that caught la esquina, in the same run — I had gone looking for one fault and there were two. Crust amber, luma 115. */
 {world:"st",x:25,y:0,deco:"panel",id:"velazquez",c:"#2E8AA8",wins:[1]},
 {world:"st",x:26,y:0,deco:"panel",id:"nolasco",  c:"#4E7A4A",wins:[1]},
 /* ❗La esquina. Toasted masa — the colour she actually cooks, and it had to move.
    IT WAS #E8D5A8, masa cream, chosen "because the other six panels are luma 96–146 and this is
    213.6, so the newest district reads first on a crowded wall". That reasoning compared her
    colour to the OTHER PANELS and never to THE WALL IT IS PAINTED ON: PLASTER is #C6DCEA, luma
    215, so her emblem sat 1.4 luma from its own ground and was invisible at every grade — worse
    at 1 and 2, where muralInk mixes it further toward the plaster. Rendered at 6x on 2026-09-17
    beside the other six and it is not subtle; it is not there. #6B4226 is luma 75, a hundred and forty
    clear of the plaster and inside the band the other six live in. Measured against the right
    thing this time, and there is a guard on it now (test/smoke.js). Piloncillo rather than a
    darker masa cream, because La Espiga's amber had to darken in the same pass and two toasted
    golds three tiles apart is one colour twice — and piloncillo is in the pot anyway. */
 {world:"st",x:27,y:0,deco:"panel",id:"esquina",  c:"#6B4226",wins:[1]}
];
