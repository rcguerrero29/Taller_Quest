# Genre rules — what other games already proved, written as a rule you can build against

*Opened 2026-09-11 at the owner's word: "dont worry about the cooking game too much but have agents
learn about it so we can ensure we prepare to build one in the near future - have this documented as
well as the research for other game genres, best practices, etc. **all agents much learn -
countinuous improvement and learning is important**"*

**This file is two pages on purpose.** It holds the *rule* and the *trap*. It does not hold the
history — the history is in `docs/research/`, linked at the bottom, and it is worth reading if you
are a person with an evening. **If you are an agent about to build something, the rule and the trap
are the whole of what you need**, and a twenty-page sweep you do not open is the same as no sweep.

### The distinction this file is built on

| A person reading about a genre wants | An agent about to build wants |
|---|---|
| How Diner Dash invented time-management in 2004 | **That the clock is an inherited default, not a property of cooking — so removing it is declining one invention, not vandalising a genre** |
| That Cook, Serve, Delicious! 3 shipped a Chill Mode | **That the studio could find nothing to put in its place and capped the medal instead — so "remove the timer" is only half an answer and the other half is yours to produce** |
| Which games are good | **Which of them is a trap we are structurally likely to walk into, and what the tell is** |

A rule here earns its place by being *actionable without its story*. If you cannot state it as
"do this / never do that / here is the tell", it belongs in the sweep, not here.

---

## ❗ The line to read before you propose a calm anything

> **Cook, Serve, Delicious! 3's Chill Mode removed customer impatience and walkouts entirely — and
> the studio, a decade into this genre, could find nothing to put in the hole. So it capped the
> reward instead: with Chill Mode on, gold medals are off the table and silver is the ceiling.
> That is an admission that the score WAS the content.**
>
> `[WEB]` https://www.thexboxhub.com/cook-serve-delicious-3-review/ and
> https://butwhytho.net/2020/10/review-cook-serve-delicious-3-brings-a-new-structure-to-familiar-gameplay/

**What it obliges you to do:** if you remove the pressure, you must positively answer *"what now
generates interest?"* before you build. **"The player enjoys the freedom" is not an answer** and is
the exact sentence that produces a beautiful empty room. The five real answers are R1–R5 below.

---

## The rules

`[WEB]` unless marked. Each carries its trap, because a rule without its trap gets half-applied.

**R1 · Comprehension — the thing you removed the clock from is now a puzzle about UNDERSTANDING.**
Venba's recipe book is damaged in the migration; lines are smudged out or torn away and the ramp is
the damage getting worse until a page is only diagrams. No timer, no fail state. *The absent thing
generates pull without generating pressure.*
**Trap:** incompleteness has to be *true* — a hole invented for difficulty reads as a contrivance.
The reason Venba's works is that a handed-down recipe genuinely is incomplete: the woman writing it
knew the missing part by heart and did not think it was a step.
`[WEB]` https://www.gamespot.com/reviews/venba-review-tourist-to-your-own-culture/1900-6418096/ ·
https://intoindiegames.com/walkthroughs/venba-walkthrough-all-recipes/

**R2 · Reading a person — the made thing IS the dialogue choice.**
In VA-11 HALL-A you do not choose what Jill says, you choose how she mixes; that steers the
conversation, what stories get told, and later conversations. A "wrong" drink *triggers extra
dialogue* and some scenes are reachable only that way.
**Trap:** if a wrong answer subtracts, it is a punishment. Here it adds. **A mistake is only a
punishment if it SUBTRACTS.**
`[WEB]` https://www.gamedeveloper.com/design/a-breakdown-of-the-drink-choice-mechanic-in-sukeban-games-i-va-11-hall-a-

**R3 · Fit — a light constraint that yields instead of punishing.**
Unpacking: no scores, no timers, no fail states; objects snap to plausible surfaces and you simply
cannot put a cutting board in a bookcase.
**Trap:** it is the expensive one. Unpacking's calm is bought with ~1,000 authored objects and
14,000 foley files, and in this engine it needs an inventory we do not have. Budget one shelf of it,
never a house.
`[WEB]` https://gdcvault.com/play/1029400/-Unpacking-Zen-Designing-a

**R4 · Duration you cannot shorten, with abundance so that waiting costs nothing.**
Wanderstop's cup-washer takes as long as it takes and there is nothing you can do to speed it up —
*and there are always more cups*. Coziness implemented rather than declared. The kitchen version is
older than games: a steep, a marinade, a rested dough, a nixtamal that wants eight to eighteen
hours. **A timer punishes slowness; a steep forbids haste.**
**Trap:** duration without abundance is scarcity, and scarcity is the other engine of pressure. If
you delete the clock and ration the ingredients you have rebuilt the tension with extra steps.
`[WEB]` https://aftermath.site/wanderstop-review/ · https://www.tastingtable.com/1171123/the-process-of-nixtamalization-explained/

**R5 · Tactility — the stroke, the pour, the sizzle, pleasurable with no score attached.**
Cooking Mama's gesture is genuinely pleasant independent of the medal, and the medal is removable
without the gesture collapsing.
**Trap:** it cannot be the whole dish. Nour is the honest control case — no goal, no score, no
timer, gorgeous, worth twenty minutes, nothing being decided. **Spend this LAST, on two or three
objects, never on a whole room.**
`[WEB]` https://en.wikipedia.org/wiki/Nour:_Play_with_Your_Food

**R6 · The decoy is COLLECTION.** An unlock ladder as its own reward is what turns a calm game into
a chore list. `[TRAINING]` — this ranking is the sweep's synthesis, unmeasured, and says so.

**R7 · The dividing line, and it is one question:
*is the player DECIDING something, or only PERFORMING something?*** Every real answer above has a
decision in it that is not about speed. Every pretty menu has only performance. **"Chill" and "thin"
are not the same axis.** `[TRAINING]` for the classification; `[WEB]` for the cases it classifies.

**R8 · Cozy is three things, not one.** Project Horseshoe 2017 defines it as *safety, abundance and
softness*. "No fail state" buys **safety only** — the cheapest third. **Abundance is the one
everybody forgets** and the one a cooking game gets almost free.
**Trap:** a game that removes the timer and spends nothing on abundance or softness will feel empty
and nobody will be able to say why.
`[WEB]` https://www.projecthorseshoe.com/reports/ph17/ph17r2.htm · https://lostgarden.com/2018/01/24/cozy-games/
*(Both domains were blocked to the researching agent's fetcher; the claim rests on a search extract,
not on a read of the page. Read the primary before anything ships on it.)*

**R9 · Busywork is the critique that actually lands, and it has a test.** *Could this action be
automated or skipped entirely with no loss?* If yes, it is a chore, and no warm palette rescues it.
Chopping onions in a no-timer game is a chore. Choosing which of your grandmother's two versions to
make is not. `[WEB]` https://www.whatgamesare.com/2011/06/busywork-is-not-fun-design.html

**R10 · The day budget is how the timer sneaks back in wearing cozy clothes.** Chef RPG is warm
pixel art over precise rhythm-and-timing minigames and a day that wears on; reviews call it
"fabulous looking… unfocused and underwhelming in its core gameplay". **The day clock never counts
down in front of you — it just makes every action cost something scarce.** This is our most likely
way to fail, because we can produce the warm half convincingly.
`[WEB]` https://game8.co/articles/reviews/chef-rpg-review-early-access
**The planner's version of the same trap, and its tell** *(added 2026-09-14 from the cooking-game
sweep)*: a week sheet where you write what you mean to cook is an implementation intention, the
best-evidenced behaviour-change technique in that whole sweep (d = 0.65 on getting started, 94
studies). **The same sheet with a red X on Thursday is a day budget.** **Tell: any surface where
YESTERDAY can change colour.** Plan forward, never mark backward — and an unfilled slot is not
"empty", it is a slot nobody put anything in. Three lines is a full week.
`[WEB]` Gollwitzer & Sheeran 2006 — https://cancercontrol.cancer.gov/sites/default/files/2020-06/goal_intent_attain.pdf ·
`[TRAINING]` for the tell.

**R11 · No punishment for stepping away mid-session** is the sharpest line in the cozy literature and
the one a cooking game violates by default — a pot on the stove is a session-length commitment by
its nature. If she can put the phone down mid-recipe and come back to exactly what she left, it is
chill. If the onions brown while she answers the door, it is not.
`[WEB]` https://en.wikipedia.org/wiki/Cozy_game

**R12 · Attribution is a person or it is nothing.** There is no *the* mole; there are twenty and each
belongs to somebody. Name the person in the fiction and write down how her sister does it
differently. Read together, Soleil Ho (people of colour not allowed to talk about their own food)
and Gustavo Arellano (the fetish of authenticity) give one rule: **be specific to particular people
rather than representative of a cuisine.** A game about one household cannot be wrong about a
nation. `[WEB]` https://www.bitchmedia.org/article/craving-the-other-0 ·
https://lataco.com/the-fetish-of-authenticity-gustavo-arellano-on-the-perils-of-cultural-appropriation

**R13 · Waiting for a vehicle is never mandatory in a shipped game.** Cyberpunk's metro offers fast
travel *or* the real ride at the same platform and lets you abandon the ride mid-way; RDR2 keeps the
ticket (instant) and the rollable train (a world object) as two systems; Shenmue is the twenty-five
year cautionary tale and the named failure is not the wait — it is that **there was no way to
fast-forward**. `[WEB]` — full working with URLs in `docs/meetings/2026-09-11-la-parada.md` §1.

**R14 · Y-sort by the FEET, not by the sprite's top-left.** The named beginner error in every 2D
painter's-algorithm game, and it is the sentence *"I'm standing on things I'm standing behind"*
written in code. For a 3D camera, Baldur's Gate 3's answer is a **local** cutout around the player —
not a global transparency — run on a delay, ground separated from walls, faded gradually.
`[WEB]` — full working in `docs/meetings/2026-09-11-la-parada.md` §2. **Not re-verified against
today's engine by this file's author: treat it as an outside design rule, not as a claim about our
current sort order.**

**R15 · Count up, never to zero.** A streak that resets is loss aversion pointed at the player, and
the lapse is the moment most people quit. The primary study everyone cites *for* streaks says the
opposite: across 96 people repeating one eating or activity behaviour daily for twelve weeks,
*"missing one opportunity to perform the behaviour did not materially affect the habit formation
process."* The vendors who sell streaks ship "streak freezes" because they know what a reset does.
So if anything is counted, count **upward and cumulative** — *42 dinners cooked* — and never reset
it.
**Trap:** the reset does not have to be a number. A progress ring that empties overnight, a plant
that wilts, a pet that looks sad, an "on track / off track" badge — all the same mechanic wearing
softer clothes. **Tell: any surface that can show a smaller number, or a sadder picture, tomorrow
than it shows today.** The shipped counter-example is Finch, whose bird *"never dies if you skip a
day"* and which *"sends only encouragement"* after an absence.
`[WEB]` Lally et al. 2010 https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674 · self-compassion
after a lapse https://pubmed.ncbi.nlm.nih.gov/37619622/ · app abandonment
https://www.jmir.org/2024/1/e56897 · vendor: https://trophy.so/blog/streaks-feature-gamification-examples ·
https://www.aviewfromthecave.com/what-is-finch-app/ · `[TRAINING]` for the wording.
*(One number that circulates for this and must NOT be cited: a "78% of users who reach a 14-day
streak quit within 72 hours of a miss (UCSF)" figure on a product-marketing page with no traceable
study.)*

**R16 · In a game about a person's own habits, the marks go on the LOGISTICS, never on the person.**
A judgement call about the kitchen — how much chard one person eats before it turns, whether a plan
survives a Tuesday, which shelf the lentils live on — can be wrong, retried and marked. A judgement
call about what somebody ate can be none of those things without becoming a score on a body.
**Trap: the marks have to live somewhere, and the engine will not tell you they don't.** `[CODE]`
`gradeOf` (`engine/engine.js:374`, verified 2026-09-14) grades a district by the fraction of its
answered quests that landed first try and returns 3 when nothing has been answered (`:376`) — **so a
pack with no wrong answers anywhere grades 3 forever and ships with only its warmest ending
reachable, silently, with no test failing.** **Tell: if a wrong answer would make the player feel
they ate wrong, the mark is in the wrong place.**
`[WEB]` for the harm — Levinson 2017: of 105 people with an eating disorder, ~75% used MyFitnessPal
and 73% of those felt it contributed, https://pmc.ncbi.nlm.nih.gov/articles/PMC5700836/ (search
extract, not a page read). `[TRAINING]` for the wording.

**R17 · A model the player has to maintain decays, and the cost is not the typing.** R9's busywork
test has a second axis: it asks whether the *action* is still worth doing on day ten, and not whether
the *data* is still true on day ten. A pantry ledger passes the effort test — one tap, forever — and
fails anyway. `[WEB]` Three competing pantry vendors describe the same curve about each other: forty
items on day one, five on day two, forgotten by week two, and by week three *"every recipe suggestion
is based on food you no longer have… the app becomes worse than useless: it is actively giving you
wrong information."* **A model that is 80% right is worse than no model, because it lies with
confidence.**
**Trap:** the fix looks like better intake — barcodes, receipts, loyalty cards — and every one of
those has its own complaint list, needs a server we do not have, and still drifts. **The fix is to
need less of it:** log **by exception** (only when reality differed), or do not log. **Tell: any
feature whose value depends on the player having told the truth about something the game cannot
check.**
`[WEB]` vendor, and they are competitors describing each other:
https://www.pantrypersona.com/blog/best-pantry-inventory-apps-2026 ·
https://fango.fi/en/blog/best-pantry-inventory-app/ · https://recipyapp.com/blog/best-pantry-tracking-apps-2026 ·
`[TRAINING]` for the rule's wording and for the generalisation past food.

---

## ❗ About the `file:line` in the sweeps — they drift, and they have already drifted

The 2026-09-11 cooking sweep cites engine lines throughout. **Spot-checked seven on the day it was
filed; two held and five were stale**, by 27 to 122 lines:

| The sweep said | Actually (`[CODE]`, 2026-09-11) |
|---|---|
| `INTERVIEW` `engine.js:208-214` | ✅ `engine/engine.js:208`, `:214` |
| grep "inventory" → 0 hits | ✅ still 0 |
| `STAKES` `:298-314` | ❌ `engine/engine.js:328` (comment), `:330` `STK`, `:333` `stakesCfg` |
| `handedDocs` `:378` | ❌ `engine/engine.js:405` |
| `petalMomentTick` `:1197` | ❌ `engine/engine.js:1224` |
| `docSections` `:2935` | ❌ `engine/engine.js:2962` |
| `docOpen` `:2960` | ❌ `engine/engine.js:3082` |

**So: grep the identifier, never paste the number.** The identifiers are stable and are the durable
part; the numbers were true for about a day. This is the repo's rule 1 applied to its own research.

**And they drifted again.** `[CODE]` 2026-09-14: `STK` is `engine/engine.js:359` (the table above
says `:330`), `stakesCfg` `:362`, `petalMomentTick` `:1558` (`docs/ARCH-LOG.md` A11 says `:1224` —
**334 lines**), `SHIRTS` `:431` (`docs/GAUGE.md` says `:341`), `docSections` `:3370`, `docOpen`
`:3513`, `drawPerson` `:2955`, `gradeOf` `:374`. The cooking-game sweep tripped this three separate
times in one run, once inside an agent's own persona file. **The table above is a record of a
spot-check on 2026-09-11, not a current index.**

---

## ❗ Anything alive near anything moving — the two rules, and the trap that is not the obvious one

> **RULE. Threat is asymmetric, and it must point the right way: the thing that gets hurt has to
> notice the vehicle FURTHER OUT than the vehicle notices it.** In ECO the player's threat circle
> *extends forward as velocity rises* and animals inside it flee — the reaction radius is deliberately
> larger than the collision one. Ours is the degenerate case (one axis, one speed), so it is two
> constants: `TRO_SHY` (how far up the line a critter reads the car) strictly greater than `TRO_LOOK`
> (how far ahead the car brakes).
>
> **THE TRAP — and it is not "it gets run over".** Put the two radii the wrong way round and nothing
> gets hurt at all: **the brake fires first, so the vehicle stops before it is ever close enough to
> frighten anything, so nothing ever moves, so the vehicle never starts again.** A deadlock, not a
> collision. It looks like a hang, it reads to a player as "the tram is broken", and it passes every
> test that asks "did anybody get run over".
>
> **THE TELL.** Two numbers, in two different functions, written weeks apart, that have to be ordered
> — and nothing in the file says so. Whenever you find a pair like that, the ordering is an invariant
> and it belongs in a test, not in a comment. `[WEB]` ECO / `[CODE]` `TRO_SHY`, `TRO_LOOK`, and the
> guard that compares them in `test/smoke.js`.

> **RULE. Evade the path, not the position — which on a grid means step SIDEWAYS, never along.**
> Reynolds' distinction: *flee* runs from where the threat is, *evade* runs from where it is going to
> be. Flee a tram and you get a cartoon pigeon sprinting down the rails in front of it, correctly
> fleeing, for ever. The short way out of a road is across it. **Tell:** if your escape move can ever
> keep the fleeing thing on the threat's path, you built flee and wanted evade.

> **RULE. Getting out of the way must never quietly become being ignored.** The moment an animal
> reliably steps clear, the brake looks like dead code and the next person deletes it — and then the
> one animal that is cornered, or asleep, or mid-animation, gets driven through. **Keep both, and
> write the test for the cornered one**: wall a critter in on the line and assert the vehicle still
> stops. `[CODE]` this repo did the species version of exactly this mistake on 2026-09-11 and it cost
> a pigeon; see the fauna row in `docs/REGRESSION.md`.

**The reassurance, which is really a warning:** *Cyberpunk 2077* shipped a city where pedestrians
commonly let cars run them over, and the community fix was a mod that **changed the distance
thresholds**. A studio of that size, in public, with the same bug and the same fix. This class is
invisible in review and obvious in play — which is the entire argument for playing the thing.

## What we already have, and it is the surprising half

`[CODE]` **re-verified 2026-09-14 — the three numbers in this paragraph were stale by 29 lines and
are corrected here.** **The chill spec is already law in this engine, not a setting.**
`engine/engine.js:354-358` carries the comment that stakes *"may not take progress, the city
or the save, and neither may harm a character"*, `STK()` (`:359`) defaults to `{mode:"none"}`, and
`stakesCfg()` (`:362`) reads stakes **per chapter** — so *"a calm town with exactly one scored thing
inside it"* is already a seam and not a rule change. **A pack that declares nothing inherits
no-stakes**, which means here the chill version is the cheap version. There is **no inventory
anywhere** (grep: 0 hits) and that is the one real gap; it is the same gap `docs/GIFTED-GAMES.md` §4
already ranked first. Everything else the sweep needs — the declarative reader with blanks, tables,
dropdowns and real forms, a cast placed from data, the held beat, the occasion layer — is shipping.
See `docs/GIFTED-GAMES.md` §3 for that inventory, and re-grep every identifier before you use it.

---

## The archive — the long, fully sourced versions

| Sweep | Question it answered | Where |
|---|---|---|
| **Cooking games, 2026-09-11** | What is left to do when you remove the timer? And what does a mistake mean with no fail state? | `docs/research/2026-09-11-cooking-games.md` |
| **The cooking game, 2026-09-13** | What does the evidence actually support in a cooking game — habit science, gamification psychology, the pantry/meal-app landscape? What may such a game legally say, and where may its nutrition numbers come from? | `docs/research/2026-09-13-cooking-game.md` — rules out: **R10's planner tell, R15, R16, R17**. The plan built on it is `docs/cooking-world.md` |
| **Gifted games, 2026-09-10** | What genre survives being a gift played five times for eight minutes? | `docs/GIFTED-GAMES.md` |
| **Transit & occlusion, 2026-09-11** | How do shipped games handle "the vehicle is not here yet", and what is best practice for standing behind things? | `docs/meetings/2026-09-11-la-parada.md` §1–§2 |
| **Critters and vehicles, 2026-09-11** | Somebody must have a better answer for critters in gameplay — has this been solved, and what is the shape of the answer? | `docs/research/2026-09-11-critters-in-play.md` |

## Where the NEXT sweep goes — the convention, so nobody has to remember it

1. The full sourced text goes in **`docs/research/YYYY-MM-DD-<topic>.md`**, tags intact, URLs inline.
2. **Every sweep adds at least one rule to this file** and a row to the archive table above. A sweep
   that produces no rule produced nothing an agent can use, and that is worth knowing too — file it
   and say so.
3. A rule here is **actionable without its story**, carries its trap, and carries its tag.
4. **The transferable rule outranks the case.** Name the game once, then say the rule.

**Honest about the guard:** a check can be written that every file in `docs/research/` is cited by a
line in this file, and that this file is cited by `docs/OPEN.md` — that reads the filename, which
cannot be anonymised away. **It would catch "filed but unreachable". It cannot catch "never filed",**
because a sweep that lives only in a task output is invisible to every test in this repo. That half
has no guard and this sentence is the only thing standing in for one. See `docs/ARCH-LOG.md` A11.

**R18 · A plan marks the present: presence, never a count, a colour, an age or a rank.** The map is the
one screen that tempts every game into a to-do list. `[WEB]` (`docs/research/2026-09-14-map-and-questionnaires.md`)
The measured studies say a modal plan opened from a button costs the player nothing in memory and
keeps the eyes on the world; the eye-tracking extract says a corner minimap takes them off it; WCAG
2.5.8 says a target is a place at 24×24 CSS px, not a 9-px tile; and Duolingo's single lit "next"
removed *"not sure what to do next"* on its own test. One mark, one meaning — the same ❗ the street
draws — on every place where somebody has something to say. **Trap:** colour-by-state arrives as a
one-line improvement; a "next" that pulses is a to-do list with a heartbeat; a "3 places" line under
the plan is a list with the names removed. **Tell: any mark whose meaning changes when the world
has not.** (`docs/ARCH-LOG.md` A3 is the law this is the practice of.)
