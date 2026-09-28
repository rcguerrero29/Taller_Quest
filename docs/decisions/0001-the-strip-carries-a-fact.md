# 0001 · The strip at the door carries a fact, not a score

**Date:** not recorded — **2026-09-08 or later**, since it answers Rosa's review and her first
finding is dated 2026-09-08 (`index.html:730`). Do not repeat a date this file does not have.
**Status:** settled, built · **Files:** `engine/engine.js`, `changarrito/content/record.js`

## Asked

> *"ok go for the facts then"*

`[OWNER]`, quoted at `changarrito/content/record.js:630`. **The only copy of this quote in the repo
is that code comment** — there is no row for it in `docs/ASKS.md` and no transcript here. It is
recorded as `[CODE]`-sourced for that reason; a later session that finds the original should say so
and upgrade the tag.

The question the owner was answering came from Rosa's review of the town's front door.

## Decided

A world may replace the score strip at the top of the screen — the one that says *name, rank,
`0 XP`* and draws a progress bar — with **one sentence that is true right now**. El Changarrito's
says things like *"14 waiting · 3 moved"*. A world that says nothing about it keeps the score
exactly as before; Meridian is a quest game and nothing changed for it.

The mechanism is a pack global, `HUDFACT`, a function returning a string.

## Because

**The town was wearing Meridian's front door.** It carried a rank ladder from Rookie to *AI LEGEND*
and a permanent `0 XP` that nothing in the town could ever award, in a pack whose own header
disclaims a curriculum (`changarrito/content/config.js:1-3`, and GitHub #154).

Rosa's argument, and it is the part worth keeping:

- **Whatever XP counts, it teaches.** A score is a statement about what the player should do more
  of. In a backlog, **neither filing more nor closing more is reliably good** — a person who files
  ten requests has not achieved anything, and a person who closes ten may have closed them wrongly.
  There is no honest thing for a number to count.
- **A permanent zero is a verdict delivered at the door, every session.** Not neutral. Worse than
  absent.

**What was rejected, and why:**

| Option | Rejected because |
|---|---|
| Keep the XP bar and award XP for filing or closing | See above: it would teach the wrong thing, and it is the option that looks cheapest, so it is the one that will be proposed again |
| Hide the strip entirely for the town | Loses a real place to say something useful, and it is a shell change rather than a pack seam — no second world would inherit it |
| Give the town a *different score* — issues closed this week, say | Still a score. Still praises a direction. A backlog going *up* is not failure |
| Let the fact be empty-but-present | Rejected inside the seam itself: `HUDFACT` returning `""` hides the chip rather than printing an empty one, *"so before the ledger has been read there is nothing true to say, and nothing is said"* (`engine/engine.js:406-408`) |

**The rule that came out of it, and travels:** *a fact must be able to go DOWN as well as up, and
neither direction is praised.*

## Touched

- `engine/engine.js:393-400` — the seam's reasoning, in the comment.
- `engine/engine.js:401-411` — `hud()`. When `HUDFACT` is a function: the fact goes in `#xp`, the bar
  wrapper is hidden (`:405`), and the corner chip is hidden when the fact is empty (`:408`).
- `engine/engine.js:3468` and `:5102` — `$("xpbarwrap").hidden=(typeof HUDFACT==="function")` at the
  two other places the HUD is shown. **A pack seam that only one call site honours is a bug**; this
  one has three.
- `changarrito/content/record.js:630-648` — the town's `HUDFACT()`, and the reasoning repeated for a
  reader who is in the pack rather than the engine.
- `docs/NEW-WORLD.md` §9.2 — added 2026-09-10. **It was missing from the template for three days**,
  which is why this file exists.

## What this did NOT fix — say it before somebody closes #154

`HUDFACT` fixes **the strip**. It does not touch **the door**. Verified 2026-09-10:

- `changarrito/index.html:384-388` still offers The Architect / The Diplomat / The Operator as the
  first thing the town asks you, in a pack whose own header says it *"trains no role"*
  (`changarrito/content/config.js:1-3`).
- `changarrito/content/strings.js:32` and `:240` still carry `levels:["Junior","Delivery
  Lead","Senior Lead","AI LEGEND"]` in both languages. `lvlName()` is simply no longer printed.

**And the town cannot fix it in the pack.** The three careers are hardcoded in the shell's markup,
in the engine's `SHIRTS` table (`engine/engine.js:341`) and in `applyLang`, which reads `pair[0]`
bare (`:3950`) — `docs/TAGS.md` L17, measured by `docs/GAUGE.md` as the **first** thing a brand-new
pack hits. Closing #154 on the strength of `HUDFACT` alone would close it on half the fault.

## Ledger

- GitHub #154 (the town's career ladder in a pack that disclaims one).
- `docs/OPEN.md` §2 listed #154 as decided-not-built with no mention that half of it shipped; that
  row was corrected 2026-09-10 to say which half.
- No dedicated `docs/ASKS.md` row. Recorded here as thin.
