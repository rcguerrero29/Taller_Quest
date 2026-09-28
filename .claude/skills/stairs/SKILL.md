---
name: stairs
description: The pre-flight for a door, a staircase, a floor or a world boundary — anywhere a player leaves one place and arrives in another. Use when the user says /stairs, before adding or moving a portal, a flight, a level or a room, when somebody reports that a place "doesn't make sense" to walk through, and whenever the map and the world disagree about where something is. Carries the five questions, the three facts about this engine a person otherwise learns the hard way, and the guards that already exist so nobody writes them twice.
---

# Stairs — does this place make sense to walk through?

*Opened 2026-09-17 on the owner's instruction: **"lets just plan a fix skill for stairs and world so
it makes 'sense' thus the map also can help us map our world through portals to keep track of this."**
It exists because the same class of mistake was made four times in two days, and each time the lesson
was written into a register that the next person to touch the code did not read. **A skill is listed
to every session; a document is not.***

---

## The five questions, before a door or a flight is built or moved

**1 · Where does this door come out, and what is under your feet when you arrive?**
A portal's arrival is a tile, and a tile has a height. **Off flat ground you may not arrive at the
head of a flight** — that is a climb that happened off-screen, and it is the thing the owner refused:
*"that door right there to the top of a staircase. until you figure out how to teleport in my side of
the screen."*

**2 · Which end of the flight is the door at?**
A street door is at the **foot**. A landing door is at the **head**. The fiction says which; the data
has to match it. Nolasco's avenue door said "foot" in its own comment and put you at the top for two
versions.

**3 · How far does it drop, and is that a storey?**
`STAIRH` is `0.16` and a wall is about `1.1`. Three treads drop `0.64` and read as **a dip in the
floor**. Five drop `0.96` and read as a storey. Seven is a floor exactly. Pick the number for what it
should feel like, then check it against the wall beside it.

**4 · Which cameras can show that drop — all four, named out loud, including the ones that correctly
show nothing?**
This is the one that bites. `wellDepth` and `stairLift` returned the right answer for two versions
and **only `engine3d.js` ever called them**, so in top, front and iso a stairwell was a flat floor
with a chevron painted on it, the hero stood on top of the hole, and the rainbow bridge was paint on
the water. *Top-down correctly shows no drop* — you cannot see one from directly above — and saying
that out loud is part of the answer, not an omission.

**5 · And where is the place you arrived in, on the map?**
If the plan cannot say, the plan is a picture of a street. `planPlace(world)` answers it: drawn by
`TOWNPLAN`, or found through a door from somewhere already placed, or declared by the pack for a
place **no door reaches**. If you are adding a place, ask this before you finish.

---

## Three facts about this engine, which a person will otherwise learn the hard way

- **`stairRun` scans a ROW.** A flight runs east–west or it does not exist. A north–south staircase is
  an engine change, not a map edit — and the front camera's free win goes with it: that camera looks
  along a row, so a flight running *across* one is a staircase in profile for nothing.
- **A world is ONE grid.** Two floors are two worlds, so the two ends of a staircase are never on
  screen together and the join is always a portal. Making floors real is 208 call sites of
  `w.rows[y][x]` / `w.grid[y][x]`, the map format every pack ships, all four cameras, the plan, the
  save, and every reach audit — which are all 2D flood fills. Costed in `docs/ARCH-LOG.md` A16 as
  option C and recommended against.
- **`▼` is always at the WEST end of a well**, because `stairRun` decides `well` by looking at
  `row[a-1]`. A flight that descends to the east cannot be authored today.

---

## What already exists, so nobody writes it twice

| the promise | where |
|---|---|
| a flight is walked, not teleported; whoever stands in a well is drawn in it | `test/engine.smoke.js` |
| Nolasco's flight is deep enough to be a storey, and the avenue door lands at its foot | `test/smoke.js` |
| the world changes behind a shut door, and the door opens the way you travelled | `test/engine.smoke.js` |
| every world is placed on the plan, and a declared spot agrees with the doors | `test/engine.smoke.js` + `test/smoke.js` |
| `UNITPX` / `ISOUNITPX` — the only place a height becomes pixels | `engine/engine.js` |

**Not done, and named rather than left to be discovered:** raised TILE art in the iso camera (the
person lifts, the planks stay flat, because `isoBlock` paints faces and a lid and never the art).

---

## Two rules that came out of getting this wrong

**A rectangle in the data is not a thing on the screen.** When several drawings position themselves
off one number and nobody paints the number itself, every one of them is correct and the picture is
wrong — and the fault is invisible in the code, because each drawing reads right on its own. *(The
sugar skull stood on a `win` rect that nothing had ever drawn. Four fixes argued about the size of
the skull.)*

**Grep every camera for a function's name before you believe the world has that fact.** A height, a
depth, a slope — three of the four cameras had never heard of `wellDepth`.

---

## And when you write the guard for it

Load `.claude/skills/guard/SKILL.md`. Two shapes from this work are worth carrying over:

- **Ask the picture, and ask it twice in different ways.** The window check asks whether the glass has
  40 luma of internal range *and* whether there is a bright-over-dark edge under it; the flat-rectangle
  plant and the painted-over plant each defeat one of them.
- **Zero is an answer and it has to be the right one.** A shell with no wells owes nothing; a shell
  whose maps are full of them and whose detector has gone blind owes everything, and those two look
  identical from inside `runs.length === 0`. Cross-check the careful question with a crude one that
  cannot break the same way — and **print the count either way** (`COUNT-ONLY:`), so a zero is
  visible instead of silent.
