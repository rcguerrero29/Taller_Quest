# Two plans, 2026-09-17 — the `/stairs` skill, and the drawing lessons into the template

*Written to be read, argued with, and signed or refused. Nothing in here is built. The owner's own
words for the first one:* **"lets just plan a fix skill for stairs and world so it makes 'sense' thus
the map also can help us map our world through portals to keep track of this - update template too
please."**

---

## Plan 1 · `/stairs` — a skill for a world that has an up and a down

### Why a skill and not a document

This project has now got the same class of thing wrong four times in two days, and each time the
lesson was written into a register and then not read by the next person to touch the code:

| what went wrong | where the lesson went | did it stop the next one |
|---|---|---|
| a sugar skull on a window sill nobody had drawn | `docs/BEAUTIFY.md` | no — the mural erased the same window |
| the mural erasing the window | `docs/BEAUTIFY.md` | no — the height numbers were still unread |
| a door that put you at the top of a staircase | `docs/ARCH-LOG.md` A16 | — |
| three cameras that never read `wellDepth` | `docs/BEAUTIFY.md` | — |

**A skill is listed to every session; a document is not.** That is the whole of the argument, and it
is the owner's own from 2026-09-16 (*"did you write any skills or updates for agents to avoid these
four faults"*), which is how `.claude/skills/guard/` exists.

### What the skill is FOR

Not "how to draw stairs". **Whether a place makes sense when you walk into it.** Three things have to
agree and today nothing checks that they do:

1. **The flight** — how far it drops, over how many treads, drawn in which cameras.
2. **The portal** — where a door puts you, and at which end of the flight.
3. **The map** — where the plan says that place IS, relative to the place you came from.

Number 3 is the one nobody has looked at, and it is the owner's own addition to this plan: *"thus
the map also can help us map our world through portals to keep track of this."*

### The finding that makes 3 worth building

`TOWNPLAN` (`content/meridian/maps.js`) lays worlds on the plan by hand:

```js
const TOWNPLAN=[{world:"st",ox:0,oy:0},{world:"ex",ox:0,oy:17}];
```

Two worlds, two offsets somebody typed. Seven more get a hand-placed **dot** and nothing else
(`MAPDOT={ta,no,hq,f2,lc,lo,me}`) — and `hq` and `f2`, the two floors of one office, share the same
dot, which is the plan admitting in one line that it has no idea what a floor is. **Six of the
city's fifteen worlds are on the plan in no form at all**: `pa`, `li`, `pk`, `casa-w`, `caseta`,
`barberia` — and `pk` is the third-largest world in the game.

And every one of those numbers is typed, not derived. Nothing checks that `ex` sitting seventeen
rows below `st` agrees with where the `2` portal actually leads, that two worlds do not overlap, or
that a door on the east wall of one world opens onto the west edge of its neighbour.

**So the plan is a drawing of the city and not a model of it**, and a door can be moved without the
map ever disagreeing. That is exactly the failure that let the avenue door put you at the top of a
staircase for two versions: *nothing in the project knows where anything is relative to anything
else.*

### What the skill would carry

**A · The five questions, asked before a door or a flight is built or moved.**

1. *Where does this door come out, and what is under your feet when you arrive?* — a portal's arrival
   is a tile with a height. Off flat ground you may not arrive at the head of a flight.
2. *Which end of the flight is the door at?* — a street door is at the foot. A landing door is at the
   head. The fiction says which; the data has to match it.
3. *How far does it drop, and is that a storey?* — `STAIRH` is 0.16 and a wall is about 1.1, so seven
   treads is a floor. Three is a dip. Five is a storey you will believe.
4. *Which cameras can show that drop?* — all four have to be named out loud, including the ones that
   correctly show nothing. `wellDepth` existed for two versions and only `engine3d.js` read it.
5. *And where is the place you arrived in, on the map?* — if the plan cannot say, the plan is a
   picture.

**B · The three facts about this engine that a person will otherwise learn the hard way.**

- `stairRun` scans **a row**. A flight runs east–west or it does not exist. A north–south staircase
  is an engine change, not a map edit.
- A world is **one grid**. Two floors are two worlds, so the two ends of a staircase are never on
  screen together, and the join is always a portal.
- `▼` is always at the **west** end of a well, because `stairRun` decides `well` by looking at
  `row[a-1]`. A flight that descends to the east cannot be authored today.

**C · The guards it points at, so nobody writes them twice.** The two built on 2026-09-17
(`test/engine.smoke.js`, "A FLIGHT IS WALKED, NOT TELEPORTED") and Meridian's own in `test/smoke.js`.

**D · The plan-agreement check, which does not exist yet and is the real new work.** A world's
offset on the plan must be *derivable from its portals* rather than typed: if `st:"2"` leads to
`ex(1,3)` and `ex:"2"` leads back to `st(28,1)`, the two worlds' relative position is determined, and
the hand-written `ox/oy` should be checked against it. Where a world has no such pair, say so rather
than guessing — that is the honest version of "the map keeps track".

### Cost, honestly

| piece | cost |
|---|---|
| A + B + C — the skill file, from what is already known and measured | **one sitting** |
| D — the plan-agreement check, as a guard | **one sitting**, and it will find things |
| putting the thirteen missing worlds on the plan | **more than a sitting**, and it is a design question first: does an interior belong on a street map at all, or does the plan need a second mode |

**Recommended: A+B+C+D now, and the thirteen worlds as a separate decision**, because "should an
office appear on the street plan" is a question for the owner and not a defect.

---

## Plan 2 · The drawing lessons, and the design round-trip, into the template

### What is already done, so nobody redoes it

- **`PAPER`** — a pack may declare its own document CSS. Built 2026-09-16, scoped to `.paper`,
  enforced by four mechanisms with six violations planted at it. `docs/NEW-WORLD.md` §1½ carries it.
- **"Your world gets a surface, not just content"** — `docs/NEW-WORLD.md`, near the end.

### What is missing, and it is one sentence

**Every drawing lesson this project has learned lives in `docs/BEAUTIFY.md`, which is Meridian's own
register — and a person building a second world never reads it.** `NEW-WORLD.md` is what they read,
and it says almost nothing about how a thing gets drawn.

The lessons that should travel, all of them paid for:

1. **A rectangle in the data is not a thing on the screen.** When several drawings position
   themselves off one number and nobody paints the number itself, every one of them is correct and
   the picture is wrong. *(The sill, 2026-09-17. The fourth register entry on this shape — `gradeOf`,
   `d.sub`, the tile rect, the height.)*
2. **Grep every camera for a function's name before you believe the world has that fact.** Three of
   the four had never heard of `wellDepth`. *(2026-09-17.)*
3. **`how-its-made`** — variation enters at the step it actually entered; a made thing is made of made
   things; draw order is part of the lighting; commit to a kind. *(The [a dish], 2026-09-16. Today it
   is a skill carried by two agents and is invisible to a world-builder.)*
4. **Measure an accent against the ground it is painted on, not against the other accents.** *(Doña
   Meche's wall, 1.4 luma from its own plaster while a note in the map file defended the choice by
   comparing it to the other six panels. 2026-09-17.)*
5. **Render it and look, at 8×, before you tune anything.** Four fixes to the sugar skull argued about
   its size; one render said there was no window.

### And the technique nobody wrote down

The [cooking world] book pages were designed **on a surface I fully controlled** — a page, not the game's
reader — and only then expressed back through `PAPER` into the engine. That round trip is the method,
and it is why the fifth attempt worked when four attempts at the drawing had not. `NEW-WORLD.md`
gestures at "design your surface somewhere you control" without saying that the port back is the
second half and that the seam is what makes it possible.

### Shape of the work

One new section in `docs/NEW-WORLD.md` — **"How a thing gets drawn here"** — carrying the five
lessons in the owner's plain words, the round-trip as a named two-step method, and a pointer to
`how-its-made` so a builder knows the skill exists. Plus one line in `docs/OPEN.md` so the index
knows about it.

**Cost: one sitting. No code. No risk.**

---

## What the two plans have in common, which is the finding underneath both

**A lesson in a register is a lesson for whoever already knows it is there.** Both plans are the same
move: take something this project has paid for and put it where the next person will actually meet
it — a skill, because a skill is listed to every session; and the template, because the template is
what a second world reads. Neither is new knowledge. Both are about *placement*.
