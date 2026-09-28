# ground.md — la panadera, #227, before a line is drawn (2026-09-21)

Worktree HEAD `8313766`; the brief's `498c923` is one commit past it on `claude/upbeat-planck-0718c6`
and touches only `docs/ASKS.md` and `docs/NEXT-SESSION.md` (`git diff --stat 8313766 498c923`), so a
patch to `content/meridian/art.js` made here applies to `498c923`.

## Every glyph on `pa` (content/meridian/maps.js:133-142)

```
#▣▣.....S.S.S.S...W#     row 1
#..................#
#..l.........t.....#     row 3
#..................#
#KKKK..........T...#     row 5
#....s.............#     row 6
#..P.........T...P.#     row 7
```
- `▣▣` (1,1),(2,1) — the ovens. In `SOLIDX` (maps.js:268). Another builder's.
- `S` ×4 at (8,1),(10,1),(12,1),(14,1) — "bread racks along the north" (maps.js:131 comment). Engine SOLID
  (engine.js:117); top `TILEDRAW["S"]` engine.js:1201 (brown square, three bars, seven cream blocks); side
  `TILESIDE["S"]` engine.js:1901 overridden by `TILEART_SIDE["S"]` art.js:427 (books); mesh
  `TILEART_MESH["S"]` art.js:639 (a bookcase carcass with spines, a stack and a carton; faces its first open side).
- `W` (18,1) — the proofing fridge; mesh art.js:869.
- `l` (3,3) Licha · `t` (13,3) Tito · `s` (5,6) Sol — NPC stations, `content/meridian/npcs.js:13`
  (`pa:{l:{npc:"licha"…},t:{npc:"tito"…},s:{npc:"sol"…}}`). Not furniture. The brief called them unknown.
- `KKKK` (1..4,5) — the counter; mesh art.js:832, side engine.js:1912. Machine rule `((x+y)%3)===2` in both →
  (3,5) has an espresso machine. CONFIRMED in the frame (r0/pa-counter-3d.png: the dark box on the counter).
- `T` (15,5),(13,7) — café tables (mesh art.js:768). `P` (3,7),(17,7) — potted plants.
- The cat Bolillo at (2,3) "lives in the flour bin" (maps.js:350) — (2,3) is `.`; there is no flour bin glyph.

## How the shelf tells worlds apart — IT DOES NOT

- `TILEART_SIDE["S"]` art.js:427 reads `sd=(((x*7+y*13)%6)+6)%6` and nothing else. No `world`, no `CW()`.
- `TILEART_MESH["S"]` art.js:639 reads `CW()` only to find its open side; the goods are `MESH_FAM` book spines.
- `docs/BEAUTIFY.md:624` row 1 says the opposite of what the brief remembers: *"the same grid is books in the
  notary, bread in the bakery, produce in the market and parts in the garage"* — a COMPLAINT that one drawing
  serves six businesses; its fix column: *"one drawing; one per business if Toño gives each its own glyph"*.
- Along row 1 the seed `(x*7+13)%6` at x=8,10,12,14 is 3,5,1,3 — the first and last rack are the same picture.

## The seam, checked
- `t3MeshTile` (engine3d.js:386) calls the pack with `{x,y}`; `world` (engine.js:121, top-level `let`) is
  readable; scene cache key is `world|themeName|T3.dirty` (engine3d.js:1091) so a world branch is safe.
- Front camera: `sideArt(ch)` → `TILESIDE` (engine.js:2284) with `{sx,sy,x,y,canopy}`.
- Top camera: `TILEDRAW["S"]` — the engine's; a pack `TILEART["S"]` REPLACES it for every world
  (`Object.assign(TILEDRAW,TILEART)` engine.js:1872; art.js loads before the engine, index.html:831/837),
  so a bakery branch in the top view must carry the bookshelf for the other five worlds itself.
- Iso camera: a SOLID prop is `isoBlock(...ISOCOL[gch]...)` (engine.js:895) — a coloured slab, never art.
  Only `stand` tiles billboard their side art (engine.js:924). The racks CANNOT carry goods in iso.
- Light: `DAY_AMB` 0.66 / `DAY_SUN` 0.42 (engine3d.js:8). `t3Light()` reads `new Date().getHours()`
  (engine3d.js:1071) — at [a time] every 3D frame is the night wash; the harness gets `--noon`.
- Season: `seasonNow()` engine.js:4833 returns the id (`"muertos"`, config.js:131) or null; `art(key,fb)`
  reads `SEASONS[id].art[key]` — there is no bread key and config.js is not mine, so the season is read by
  its id. `seasonSet` bumps `t3Invalidate()` so the 3D scene rebuilds when it turns.
- Primitives: sphere 8×6, cyl 10, cone 8, torus 6×14 with `arc` (engine3d.js:243-246); Euler YXZ, so a
  part's `rx` (tilt) is applied before the rack's `ry` (facing) — a tilted tray turns with its rack.

## BEFORE frames (r0-noon/): four bookcases of books along the bakery's north wall, in 3D and front;
brown squares in top; brown slabs in iso. An espresso machine on the counter's third tile.
