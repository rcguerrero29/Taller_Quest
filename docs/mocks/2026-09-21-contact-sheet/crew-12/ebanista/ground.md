# GROUND — el ebanista, crew iteration 12 (#226): the interiors and the stop

Every glyph named in the brief, what it IS, with the line that says so. Worktree HEAD is `8313766`
(the brief said `498c923`; the two differ only in `docs/ASKS.md` and `docs/NEXT-SESSION.md`, so a
patch to `content/` and `test/` applies to either). A tile is 1.0, a person ≈ 1.0 (≈1.7 m), y up,
the tile's centre (0,0). Light: top 1.00 / east 0.88 / south 0.78 / west-north 0.66.

## The glyphs, grounded

| glyph | what it is | where it is laid (grown rows, dumped from the booted game) | 2D drawing | 3D today |
|---|---|---|---|---|
| `▯` | the steel file cabinet, one drawer open, folders peeking | `no` (1,1),(2,1) only (`maps.js:174`) | `art.js:96` — body 18×26, two drawer fronts, a cream folder strip, two pulls | a BOX (SOLIDX, `TILEMETA "▯":{lift:9,kind:"furniture"}` `art.js:1173`): the front elevation baked on all four faces AND the lid |
| `⊔` | a guest chair — "a kitchen chair" | `no` (9,6),(10,6); **`ex` (4,3)** — the casa-w yard pick `chair` (`art.js:1424`, `BUILDS` `art.js:1498`); `casa-w` room (4,2),(3,3); `barberia` (3,1),(5,1),(1,3); `ta` | `art.js:101` — back rail, two uprights, a seat, two legs: a chair from the FRONT, used as the plan | a BOX (`"⊔":{lift:6,kind:"furniture"}`): the chair drawing on the lid = the owner's "desk" |
| `D` | the office desk with a monitor | `no` (4,1) | engine `TILEDRAW["D"]` `engine.js:1130` | **already a mesh** — `TILEART_MESH["D"]` `art.js:804` (el taller, run 11) |
| `n` | **a person**: Nolasco's station | `no` (4,2) — `npcs.js:16` `no:{n:{npc:"nolasco"…}` | — | — |
| `R` | the rug | `no` (9,5),(10,5); `li` (2,7),(3,7) | `TILEART["R"]` `art.js:190` — border only where the rug ends, a woven field | paint on the floor (not SOLID, not `stand`) — stays paint |
| `▣` | the deck oven | `pa` (1,1),(2,1) only | `art.js:92` — a dark steel box 26×25, TWO decks each with an orange window line and a steel handle line | a BOX (`"▣":{lift:10,kind:"appliance"}`) wearing the elevation on every face and the lid |
| `U` | **the engine's blueprint wall panel** — a WALL glyph (`engine.js:2136` `U:{lift:13,kind:"wall"}`, in the engine's `SOLID`) with a blue drawing pinned by four gold pins (`engine.js:1221`) | `li` (1,1),(2,1),(4,1),(5,1); `lo` (La Obra studio, where blueprints belong) | blue panel, white plan lines, gold pins | a WALL box with the blueprint baked on its faces. **This is what the owner cannot name in Limpieza**: a cleaning company with floor plans pinned to its wall |
| `k` `v` `c` | **people**: Karla, Vero, Chente (`npcs.js:15` `li:{v:vero,c:chente,k:karla}`) | `li` (2,4),(9,4),(8,7) | — | — |
| `S` | shelving (engine furniture) — books and cartons in every world | `li` (13,1),(15,1),(17,1); also me, ta, pa, no, casa-w, barberia | `TILEART_SIDE["S"]` `art.js:427` books, a stack, a carton | **already a mesh** `art.js:639` — a bookcase; in Limpieza it holds BOOKS |
| `□` | the taped moving box | `li` (12,6),(13,6) | `art.js:51` | a BOX with the 2D on it (`box:true`) — reads as a carton; left alone |
| `C` | the traffic cone | `li` (15,6) | engine | **already a mesh** `art.js:680` |
| `Y` | the trolley stop: pole + MQT sign + bench | `st` (0,1); `ex` (20,2) | `art.js:107` top; `TILEART_SIDE["Y"]` `art.js:343` standing | a **billboard sprite** (`stand:true`, not SOLID → `engine3d.js:430–434`; on `FLAT_BY_GAME` `test/engine.smoke.js:527`) |
| `q` `m` | **people**: Rigo and Doña Meche at the stop (`npcs.js:14`) | `ex` (19,3),(21,3) | — | — |
| `w` `x` `z` | **people**: Beto, Kike, Mari — in THE CREW PEN (`TOWNLBL` "THE CREW PEN / EL PATIO" at ex 11.5,6.4, `maps.js:294`) | `ex` rows 5–7 | — | — |
| `ʘ` | Meche's steam pot | `ex` (21,4) | `art.js` | a box; not in the lane |
| `K` | the café counter (el taller's mesh) | `no` (1,5),(2,5) — a notary's reception counter carries a cup and a napkin stand | — | a mesh; not in the lane, reported |
| `H` | the produce crate | `me` ×8 | `TILEART_SIDE["H"]` | **a mesh** `art.js:1064` (la calle) — chiles lie flat inside, bananas are nine tiny cylinders |

## Who reaches the mesh hook (engine3d.js, [CODE])
- SOLID tiles: `:623` `if(t3MeshTile(gch,…))continue;` before wall/facade — so a WALL glyph (`U`) can be a mesh, and the mesh then has to BE the wall too.
- `stand:true` and not SOLID: `:430–432` — `Y` reaches it. An empty list returns `false` (`:389`) and the old drawing stands — so a per-world branch returns `[]` where it declines.
- The `world` the builder runs for: `CW()` = `WORLDS[world]` (`engine.js:129`); `world` is a global string (`engine.js:121`).

## How each is made (how-its-made), and what its silhouette must say at 35 px
1. **La silla — `⊔`.** One chair for five worlds: a *silla de palma* — the chair outside every door on
   a street like Calle Dos. Made: four turned legs, the two back legs run up as the uprights; a seat
   frame joined to them; the palm seat woven INTO the frame (pale straw, the only light thing on it);
   two back rails — the top one the yoke, wider than the uprights; stretchers low between the legs
   (a stool has none; a chair does). Seat at 0.27 (0.45 m), yoke at 0.56 (0.95 m). Faces: a chair
   faces the table or desk beside it; else its BACK goes to the first solid neighbour (N, S, W, E)
   and it faces away; else south. Read: legs + a plane + two uprights and a bar.
2. **El archivero — `▯`.** A four-drawer steel filing cabinet from one factory: two siblings side by
   side, a bank — each shifted 0.22 toward its `▯` neighbour so they touch. Made: a plinth, the
   carcase, four drawer fronts on the open face with a dark reveal between, a pull and a label
   holder each. What the clerk did: ONE drawer pulled out (which one by `(x*5+y*3)%4`), its box
   proud of the face, hanging folders in it with staggered tabs. Read: the open drawer breaking the
   box; the four horizontal reveals.
3. **El horno de piso — `▣`.** Two modular deck-oven units side by side, sold as a bank. Made: a
   plinth, the steel carcase, two doors on the front — hinged at the bottom, each with a glass slit
   (the orange line in the 2D) and a steel bar handle on brackets — a control strip at the right
   with knobs and a red pilot, a hood on top and the FLUE rising from the back. One unit (by parity)
   has its lower door swung DOWN open, the mouth dark and a warm glow inside — the baker has just
   pulled a tray. Read: the flue pipe above the box; two bright slits and two bars.
4. **El pizarrón de turnos — `U` in `li` only.** The wall stays a wall (the mesh carries the wall
   body in `C.wall` and its top band in `C.wallTop` — the same two colours the `#` next to it bakes)
   and on its open face a crew schedule board: a dark frame, a white board, a teal header band,
   rows and day-columns ruled through the run (two `U` side by side are ONE board, frame only at
   the run's ends), magnets in the cells by seed, a marker tray at the foot. Elsewhere (`lo`) the
   function returns `[]` and the blueprint wall stands as it did. Read: a white rectangle with a
   coloured header and rows.
5. **El anaquel de limpieza — `S` in `li` only.** The bookcase carcase as el taller made it (back,
   uprights, four boards), holding what a cleaning crew keeps: spray bottles in a row on the top
   board (a body, a neck, a trigger head), folded cloths stacked and two jugs on the middle, a
   bucket and a big jug at the foot — and a broom and a mop LEANING on the outer upright, which is
   the read. Elsewhere the bookcase stays (`TILEART_MESH["S"]` is not edited — a wrapper after it).
6. **La parada — `Y`.** A cantilevered shelter: two steel posts at the back, two braces, a roof, a
   red name-board round BOTH long edges of the roof (the camera sees the back of an `ex` shelter
   that faces its road to the north), M·Q·T built from boxes and a torus in cream on both boards,
   and a bench with a back under the roof. Faces the tram line (`≈`/`-` north or south), else
   south. Read: a roof on posts over a bench, a red band with three pale marks.
7. **The crates — `H`** (if budget): chiles heaped ABOVE the rim, fewer and fatter, tips out over
   the front edge, some red; two big hands of five bananas curving up over the rim; every cone and
   finger a lit part over a dark part.

## What the brief got wrong (each with the line)
- "one of `q`/`m`/`w`/`x`/`z` is the chair" — all five are PEOPLE (`npcs.js:14`), and rows 4–8 of
  `ex` are the crew pen, not her yard (`maps.js:294`). Her chair is `⊔` at (4,3), laid by the casa
  template's yard pick (`art.js:1424`, seed `calle-dos-4`, `art.js:1498`).
- "`U`, `k`, `v`, `c` … each becomes a shape" — `k`, `v`, `c` are Karla, Vero and Chente
  (`npcs.js:15`); `U` is the engine's blueprint WALL (`engine.js:1221`, `:2136`), not a board.
- The desk in his frame is not `D`: it is the pair of `⊔` guest chairs at (9,6),(10,6) as boxes
  wearing their plan on the lid, seen from a side camera stop (my `r0/no-rug-yE.png` matches his
  frame); `D` is already a mesh on this branch (`art.js:804`).
