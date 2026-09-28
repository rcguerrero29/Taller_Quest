# The contact sheet — every world, every camera, 2026-09-21

*The owner: "can we consider beautifying across the
worlds?" `docs/BEAUTIFY.md`'s standing rule is **contact sheet first, list second, redraw third.** This
folder is the sheet. The list is the dated section at the end of that register. Nothing was redrawn.*

## What is here

Twelve strips, one per world, **top · front · iso · 3d** left to right, each panel 844×676 at the
real screen size the phone plays at (`test/shots.js`, no scaling). Rendered from the branch at
`2f7ae64`, game `mq-v176`, the default theme, no season.

| file | world |
|---|---|
| `hq.png` | HQ, ground floor — the room a new game lands in |
| `f2.png` | HQ, floor 2 |
| `st.png` | the street |
| `ex.png` | La Obra — the site |
| `lo.png` | the loft |
| `me.png` | El Mercado |
| `lc.png` | La Cocina |
| `ta.png` | the Taller |
| `pa.png` | the bakery |
| `li.png` | the library |
| `no.png` | the notary |
| `pk.png` | the park |

`spots.json` is the spot list that reproduces them — 48 spots, one tile per world, the four cameras.
Copy it beside `test/shots.js` and run `node test/shots.js --spots spots.json` (the flag resolves
relative to `test/`).

## Two things about the harness, found while making it

1. **The first 48 shots had the tutorial bubble over the top third of every room.** `#ticker` opens
   on boot and nothing in the harness closes it. These strips were taken with the ticker cleared
   before each shot, through a patched copy of the harness kept out of the repository. A `--quiet`
   flag on `test/shots.js` that does the same is a test change, noted in the register, not built.
2. **`--spots` resolves relative to `test/`, not the working directory.** The path in the README
   above is written the way it works.

## How to read a strip

Left to right is the same tile, the same second, through four cameras. What changes between panels is
the renderer, not the world — so a thing that reads in three panels and not the fourth is a camera
fault, and a thing that reads in none is a drawing fault. That distinction is the whole list.

## After the first sitting — `after-first-sitting/`

Six frames from the same spots, rendered after rows 1–3 of the list were drawn (`mq-v177`), with the
spot list that reproduces them. Compare each against its strip above:

| after | against | what changed |
|---|---|---|
| `me-3d.png`, `no-front.png`, `ta-3d.png` | `me.png`, `no.png`, `ta.png` | the shelf is a bookcase — runs of spines, a stack lying flat, a carton — not a Rubik's cube |
| `pk-top.png`, `pk-front.png`, `pk-3d.png` | `pk.png` | grass is a tuft in a crack; the flower bed is a raised bed with a curb, a box in 3D and in front |

## After the second sitting — `after-second-sitting/`

Four frames, default camera, after the `mesh` view landed (`mq-v178`): the raised bed with a lip and
pom-pom marigolds (`pk-3d.png`), the shelves as carcasses with insides (`me-3d.png`, `no-3d.png`), the
potted plant as a thrown pot (`hq-3d.png`, `no-3d.png`). Compare against `after-first-sitting/` for
the same spots, where the same things were boxes wearing pictures.

## After the third sitting — `after-third-sitting/`

Six frames, default camera, `mq-v179`: the grass standing, the doghouse, a tree, the cone, and two with
Día de Muertos switched on — the altar in the park's far corner and a tree in its dress. `spots.json`
carries a `season` field the shipped harness does not read; the scratch copy that took these did.

## After the fourth sitting — `after-fourth-sitting/`

Six frames, default camera, `mq-v180`: the beds as mounds of ruffled marigolds, the altar in detail with
the season on, a dressed tree, the street's strings on poles, La Cocina's tables, the cone on its base.

