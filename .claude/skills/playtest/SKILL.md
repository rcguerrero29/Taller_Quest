---
name: playtest
description: Guide the owner through playtesting Meridian Quest and triage what they report. Use when the user says /playtest, asks where or how to test the game, reports something they saw while playing (a bug, a visual oddity, "the colors don't change", "I got stuck"), or asks what a feature should look like in play.
---

# Playtest guide for Meridian Quest

The walkthrough lives in `docs/PLAYTEST.md` — the "Week One tour", 11 numbered stops,
each with **what to do** and **what you should see**, plus which engine/content area
it exercises. Read it first, then:

## Guiding a test session

- Give the user the next stop (or the one they ask for) in one short message: the
  action, then the expected result. Don't paste the whole tour at once.
- The live game is at https://rcguerrero29.github.io/meridian-quest/ (deploys from
  `main`, ~1 min lag; installed PWAs need one refresh — the page auto-reloads once
  when the new service worker takes control).

## Triaging a report

Map the stop number (or symptom) to code before guessing:

| Symptom area | Look in |
|---|---|
| Theme/colors, particles, world tint | `engine/engine.js` — `setCanvasTint`, `tc()`, `npcWhimsy`, `drawAmbient`, `THEMES` |
| Stuck / walled in / construction | `engine/engine.js` — `applyStaged`, `growthReach`; stage data in `content/meridian/maps.js` (`OBRA`), wired by `GROWTH` in `config.js` |
| Quest logic, XP, hearts, retries | `engine/engine.js` — `pick`, `awardXP`; quest text in `content/meridian/quests.{en,es}.js` |
| Trees, beds, map layout, critter spawns | `content/meridian/maps.js` (glyphs: `J` tree, `b` bed, `g` grass; `CRITTERS`) |
| Animal behavior/drawing | `engine/engine.js` — DOG/CAT/PIG/LORO blocks, `critUpdate`, `drawButterfly/Colibri/Gato` |
| Any player-facing text | `content/meridian/strings.js` (keep EN and ES in lockstep) |

Reproduce with `node test/smoke.js` (headless, needs `npm install playwright-core`)
before and after any fix; bump `CACHE` in `sw.js` when shipping. Full process:
`docs/HANDOFF.md`.

## House rules that explain "weird" behavior

- Retry-until-correct: wrong answers never reveal the right one; ❗ stays until solved.
- Only La Obra quests (12, 13) grow the construction site — two stages, the first
  subtle. Other quests don't change the map (yet).
- Landmark props (doors, cones, storefronts) intentionally ignore the theme tint.
- The player's own outfit, all skin/hair, and animal fur never take the whimsy tint.

## Two habits, both learned the hard way (2026-09-03)

**1 · Walk in from the door.** Build the thing, then stand on the tile the game actually
puts the player on and ask whether it announces itself. This exact bug shipped twice in one
day: the stairs to the office wore no marker, and then the office posters were pinned,
working, and invisible from the arrival tile because their marker only reached three tiles.
A feature that works and cannot be found has not shipped. `test/smoke.js` §28 is the
generalised guard — for every world, from every way in, everything readable must be marked,
the place must name itself in both languages, and a door with somebody waiting behind it
must say so. **Add to that audit whenever a new kind of affordance appears.**

**2 · Quote the ask, then log it.** Every request in the owner's message gets a verbatim row
in `docs/ASKS.md` before building starts, and only leaves the open table when it ships or
the owner is told plainly why not. Paraphrase is how requirements die: *"the activity record
should only delete after two activities"* is a rule; "improve the ticker" is a mood.

## Contradictions are reported, never absorbed

Owner's standing rule (`docs/OWNER.md`, 2026-09-01): **"we need all these brought up at
all times - all agents and skills for this should let the owner/me know."**

If you find a rule signed in `docs/` that the code does not implement, two docs that
disagree, a doc that disagrees with the code, or a plan that assumes something the
engine cannot do — **say so in your reply**, naming what conflicts, which side is true,
and either the fix or the question. Do not quietly fix it, do not quietly plan around
it, and do not bury it in a file the owner has to go find. A short reply that hid a
contradiction is a worse reply.
