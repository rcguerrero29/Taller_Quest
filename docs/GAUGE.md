# The gauge — a world built to be measured, not played

*Built 2026-09-10 at the owner's word: "ok try the proof pack sure."*

`content/gauge/` is **El Faro**: five tiles, two people, one room, one quest, no doors. It is not a
game and is never linked from one. Its only job is to **fail in the places a new game would fail**,
out loud, on every CI run.

## Why it exists

Every leak in `docs/TAGS.md` — all eighteen — was found by **reading the engine**. Nobody had ever
built a second world to find out which one a real pack hits *first*. The register was the only part
of this project still running on inspection instead of measurement, and inspection had already been
wrong three times: `L12` was fixed and the register did not know; `NEW-WORLD.md` was telling every
new world to avoid a bug that no longer existed; and the thing a new pack actually hits first
(`L16`) was not on the register at all.

## What it found, in the order it hit them

| # | What stopped it | Where it lives | Registered as |
|---|---|---|---|
| 1 | **A pack cannot choose its careers, and omitting Meridian's crashes it.** The shell hardcodes `data-c="architect\|diplomat\|operator"`, the engine hardcodes their shirt colours (`SHIRTS`, `engine.js:431` on 2026-09-14 — this row said `:341`), and `applyLang` reads `pair[0]` bare (`:3950`). A lighthouse has one job; the engine insists it has three | engine **and** shell | `L17` |
| 2 | **`UI` is about eighty required keys, not one row of a table.** `applyLang` bare-dereferences ~82 of them. `docs/NEW-WORLD.md` §1 lists `UI` as a single line: *"every word on screen"* | engine | **new — see below** |
| 3 | **`GAMENAME` is required and undocumented.** `test/engine.smoke.js:64` fails without it; `NEW-WORLD.md` mentions it **zero** times | the suite | **new** |
| 4 | **The engine's own theme table has a key named `meridian`** (`engine.js:3608`), and the shell's buttons are keyed to it | engine | `L17` |
| 5 | **Three hair styles are required by name** — `long`, `beard`, `afro` (`test/engine.smoke.js:150`) — so a keeper is offered an afro whether or not the pack draws one | the suite | `L3` |
| 6 | **There is no `kind:"flat"`.** A patch of grass has to be called `water` or it ships as a cardboard cutout and fails the build | engine | `L13` |
| 7 | **A partial `PLACES` is worse than none** — declaring `home` and `spawn` inherits four of Meridian's world ids | engine | `L16` |

**The one that had to be fixed on the spot** was mine, from the same morning: `CAMERAS` lets a pack
ship without a 3D camera, and **two blocks of the shared suite tested 3D anyway** — measuring a
camera `camSet` had correctly refused to switch to, and failing the build for it. The seam existed
and the gate ignored it. A seam nothing enforces is a promise, not a feature.

## What it still fails, on purpose

Six lines, recorded in `content/gauge/expected.txt`. Every one of them is the suite failing this
pack **for being small rather than for being wrong** — *"no facade in this pack has two windows"*,
*"no tall non-wall piece was found"*, *"the check never ran"*. They are honest about it and they
fail the build anyway.

**That is the finding, and it is the biggest one here.** `docs/NEW-WORLD.md` §5 makes a minimal pack
step 2 and the shared suite step 3 — *"the gate is real before anything is built on it"*. Today the
gate rejects what step 2 produces. A second world's first green run is not available at any size
below Meridian's.

Left unfixed deliberately. Making those checks *skip* would weaken Meridian's own gate, and the
right answer — fail only when a pack **has** the thing and gets it wrong — is a real piece of design
that deserves its own ticket rather than being smuggled in behind a fixture.

## How it works, and the one rule for changing it

`node test/gauge.js`. It **generates** the shell from `index.html` rather than keeping a copy,
because roughly 770 of that file's ~800 lines must be identical — the shared suite reads about twenty
element ids straight out of the shell — and a copy would rot silently the first time `index.html`
changed. Every edit the generator makes asserts that it actually matched: a `String.replace` that
stops matching returns the input unchanged and would otherwise print success while testing the wrong
thing. The generated shell is gitignored; **never commit one by hand.**

**The gauge does not chase green.** It pins what a new world is up against and fails when that
*changes*:

- **A line appears** → somebody made the engine harder to write a second game for, and it says so
  the day it happens instead of in somebody's month two.
- **A line disappears** → the template got easier. Delete it from `expected.txt` and say so in the
  commit.

That is the whole point: the leak register now has something underneath it that runs.

## 2026-09-17 — a demand disappeared, and this time it was supposed to

**`#140: no tall non-wall piece with room to stand behind it was found in any world — the check never
ran`** left `content/gauge/expected.txt`, and the gauge did exactly what it exists to do: stopped the
build and made somebody say why.

**Why it is right.** That line was itself a report of a silent zero — a check that had nothing to
measure and said so. It only existed because the gauge, a world that declares `CAMERAS=["top",
"front"]` and wants no 3D camera at all, was **downloading and running the entire 3D engine anyway**
and being held to 3D demands it had declined. Since `engine/boot.js`, a pack that does not list "3d"
does not fetch Three.js — a quarter of the download — and the 3D checks now say, once,
`COUNT-ONLY: this shell declined 3D`, instead of listing a demand nobody owed.

**The template did get easier, for exactly one kind of world, on purpose.** A world that wants a 3D
camera is held to every one of those checks as before; the gauge proved that in the same run, by
planting a shell that asks for 3D and does not get it: *"this shell lists a 3D camera and the 3D
engine never loaded"*.

## COUNT-ONLY — what replaced the note

Owner, 2026-09-17: *"can we make the guards smarter instead of just making them notes?"* He is right,
and a `NOTE-ONLY` was a shrug: **a guard that says "I measured nothing" is still a guard that measured
nothing**, and next week nobody reads the note.

The shape that replaced it, and it is the general one:

1. **Derive the demand from what the pack itself declares.** The gauge's maps carry `const
   PORTALS={}` with *"one room needs no doors"* written beside them. That is a declaration, not an
   absence, and a guard can read it. A world with no doors owes the door check nothing.
2. **Cross-check the careful answer with a crude one that cannot break the same way.** "Are there any
   wells" is asked twice: once through `stairRun`/`wellDepth`, and once by looking for the glyph in
   the raw rows. **If the crude answer is yes and the careful answer is zero, the detector is broken
   and that is a failure** — planted by blinding `wellDepth`, and it says so.
3. **Print the count either way.** `COUNT-ONLY: 2 flights walked in 15 worlds` · `21 portals
   declared` · `3D declined, 3D engine absent`. A zero is then visible instead of silent, which is
   the whole of what this register is for, and it is filtered out of the failures in one place at the
   end so a new check cannot forget to do it.

