# Starting a new world — the template

*Opened 2026-09-05. Owner: "i want to make sure we have a template for any other custom game in
case we want to start a new 'world'/town/city." Everything below was read off the tree at
`mq-v64`, not from memory; where the engine is not yet ready for a second world, it says so.*

A world is **a folder**. The engine never changes. Meridian is the worked example sitting next
to you — copy any file out of `content/meridian/` and edit it.

---

## 0 · Before a single file: the interview

Run `/game-brief` for the person whose world it is. It produces `docs/for-<name>/` — a README
written *to* them, `QUESTIONS.md`, and `AFFECTED.md` (which answer moves which file, and how
big the ask is). `docs/for-partner/` is the reference. **Do not skip this to "just start building":**
every expensive reversal in Meridian's history was a thing nobody had asked for.

Then open a bible and a ledger on day one, empty:
- `docs/<name>/STORY.md` — who the player is, what the town wants from them, endings.
- `docs/<name>/CITY.md` — districts, open parcels, pending ❗ decisions, decision log.
- `docs/ASKS.md` — **every owner ask, quoted verbatim, logged before building.** This is the
  single practice that stopped requirements from falling through here.
- `docs/OWNER.md` — the owner's standing rules. Meridian's are a good default; the ones that
  travel to any story are marked *(travels)* below.

**One question the interview must ask, every time (2026-09-05): "does this world have a star dog?"**
A star dog is a pack's choice, never the engine's: a pack marks him in `CRITTERS` with `role:"star"`, and
may declare `DOGNAMES`, a pool a new player's star dog is named from; the player may rename him (#264). A
world for someone else gets its own dog, or none. Ask before declaring a new world's `CRITTERS`.

## 0½ · Does your world END? — ask this before anything else (2026-09-09)

**The owner's decision, signed:** whether a world ends is the pack's choice, and **the template's
default is that it ends.** A pack that says nothing gets a last day, an epilogue and a grade.

    const ENDLESS = true;    // in the pack's config.js — this world never ends

Ask it first, because every later answer depends on it, and because getting it wrong is not a
setting you notice — it is Meridian's goodbye speech printing itself into somebody else's game.
That already happened to a second world before this flag existed.

| | **A world that ENDS** (the default) | **A world that does not** |
|---|---|---|
| Declares | `CHAPTERS`, and nothing else | `ENDLESS = true`, and **no** `CHAPTERS` |
| Has | a last day, an epilogue panel, a grade | none of those |
| Story shape | an arc with a last visit | people you keep returning to |
| Good for | a course, an engagement, a season | a place you inhabit; a backlog; a comfort world |

**Do not keep the chapter skeleton with the lesson removed.** Nacho's warning, and it is the whole
trap: *a last visit with nothing to graduate from is a countdown to nothing.* Pick one shape.

**✅ The fault this section used to warn about is FIXED — the warning itself had gone stale, which
is why it is rewritten rather than deleted.** `ENDLESS = true` once froze district progression: the
ending ceremony and the city's growth were the same switch, so an endless pack with two or more
districts sat in district one forever with no error. The two were **split** (`chOpenDue()` at
`engine/engine.js:311` is the city, `chDue()` at `:312` is the ceremony, and `chAdvance()` at `:315`
runs from the Next handler whether or not the world ends). L12's own recommendation — *split, not
rename* — is what shipped.

**This paragraph spent an unknown number of days telling a new world a fixed bug was unfixed, with
two line numbers that no longer pointed at anything.** That is the failure mode this whole file
exists to prevent, and it is recorded rather than quietly corrected: a doc that describes a game we
do not have has now cost this project time three times.

**❗ What IS still true, and it is a different fault.** The *engine* now handles endless-with-districts;
the **shared suite still forbids shipping it.** `test/engine.smoke.js:794` (`if (endless && chapters)`) fails any pack that
declares `ENDLESS` and `CHAPTERS` together — *"a world that does not end cannot also have a last
day"* — which was right before the split and is wrong after it, because `CHAPTERS` does double duty:
it is both **the endings** and **the districts**. A world that never ends may still have a second
neighbourhood. Until that assertion is corrected, the table below stands as written, not because the
engine cannot do it but because the gate will not let it out. Registered as L12 in `docs/TAGS.md`.

## 0¾ · How do people SEE your world? — the second question (2026-09-10)

Ask this right after *does your world end?*. Those two decide more downstream than anything else:
one shapes the story, the other shapes everything you will ever draw. **Ask it as a feel question,
never a technical one** — "which cameras do you want" is unanswerable before somebody has seen their
game, and it invites *all of them, why not*.

> **How do you want people to see your world?**
>
> **a — Face to face.** You walk up to someone and see their face. Rooms have walls you look past,
> things stand up and cast shadows. Warmer, and more to draw.
>
> **b — From above.** You see the whole room at once, laid out like a board. Clearer, calmer, less
> to build — and you still see people's faces here, they just do not turn to you.
>
> **c — Both, and let the player pick.** What Meridian does.

Then the follow-up that does the real work:

> **Is there anything in your world you would want somebody to lean in and look at?**

Yes means depth. No means the board. That question gets a true answer out of somebody who has never
thought about cameras, which is the point. **Tell them it can change later — it costs art, not
architecture.**

    const CAMERAS = ["top","front"];   // in the pack's config.js — say nothing and you get all four

A camera a pack does not declare has **no button** and cannot be reached, however it is asked for —
including by a saved choice from before a pack dropped one.

### And what a glyph looks like — one entry, FIVE slots

A glyph has five views. It used to be describable in two, with two holes: the leafy top of a tree
was hardcoded in the engine, and there was nowhere at all to describe the isometric view.

    TILEART["J"] = { top: fn, side: fn, crown: fn, iso: fn, mesh: fn }

Fill in the views you care about; the rest come back empty and the renderer decides. **A bare
function still means `top`**, so nothing already written changes. `crown` is what stands *above* the
tile — a tree's canopy, a lamp globe, a market umbrella.

`mesh` (2026-09-21) is the 3D one: a list of parts the camera merges into a single shape, so a
glyph that has one is never a box and never a picture. **Five primitives, and the fifth is
`torus`:**

    { s:"box"|"sph"|"cyl"|"cone"|"torus",
      x,y,z,            // tile units, y up from the floor, the tile's centre at (0,0)
      w,h,d,            // box
      r, rt,rb, h,      // sph / cone / cyl (rt,rb taper a cylinder into a thrown pot)
      r, t, arc,        // torus: ring radius, tube, and how much of the ring
      rx,ry,rz, sx,sy,sz,
      c:"#RRGGBB",
      a: 0.55 }         // ANY `a` under 1 is GLASS — a second, transparent mesh under the tile's

`torus` is easy to miss and it is the one that stops things looking printed: a ring on a stove, an
arch over a door, the bones on a pan de muerto, the handle of a cup. The engine's own comment said
"box, sphere, cylinder, cone" for a year while the code had five; it says five now.

### What the engine already has a shape for — and the ONE line you write to take it

`engine/shapes.js` ships nineteen shapes **named by what they are**, not by a letter:

    plant · tree · desk · table · crate · shelving · fridge · stove
    counter · draftingTable · picketFence · wellRail · doghouse
    hurdle · tunnel · weavePoles · planter · grass · siteSign

`SHAPEBIND` in that file is the engine's reading of its own letters (`P J D T H S W V K A F ◺ 9 3 4 5 b g X`).
`3 4 5` are the park's agility course; each is turned to the line the dog runs through it, which the
engine reads off the order the gear is laid on your park's map (mq-v232). `b g X` are the marigold
planter, a tuft of grass and the site sign (mq-v233).

**The desk, table, bookcase, counter and stove are the engine's own drawings, standing up** (mq-v233).
Each is built from what its letter's `TILEDRAW`/`TILESIDE` draws — the round table under a woven gingham
cloth with two plates and two chairs, the counter at a person's waist with the espresso machine on every
third tile, the charcoal range on feet, the bookcase against its wall with a dark gap over every row of
books — and says so on the shape (`.drawing`). Take them by name like any other letter. Until mq-v233
the gate refused all five, because the library's versions were plainer objects than their drawings, and a
world that laid them got boxes with a photograph of the thing on each face — which reads as 2D.
**It is an offer, not a default.** You take it by naming the letters you agree with, in one string
in your `art.js`:

    const SHAPETAKE = "PF◺AWJ9";        // the letters the engine may shape for me

**No `SHAPETAKE` means no shapes.** That is deliberate and it cost something to learn: the first
version of this gate bound every letter a pack had not spoken about, reading silence as agreement.
But a world that never mentioned a letter has not agreed about it — it has said nothing. A
second world lays six `H` and calls them RACKS in its houses; the engine's `H` is an open PRODUCE
CRATE. That world had never drawn `H` at all, so every question the gate knew how to ask ("did this
pack draw it? declare it? give it a mesh?") answered *no*, correctly, and six crates of tomatoes
stood up in the bedrooms. **Nothing in this engine records what a world MEANS by a letter it has
never drawn.** Only you know that, so only you can say it.

The gate in `engine/engine.js` then also refuses a letter you named if:

- you gave it a `mesh`, a `TILEART`, a `TILEART_SIDE` or a `TILEMETA` row — you already answered;
- it is walked across in your world and its shape is not one that stands on a walked tile — see the
  contact-shadow note below. The planter and the grass are (`.walk`): taken, the gate marks the letter
  as standing in your world, so the shape stands and its shadow has something on it. If you mean your
  beds to be walked round rather than through, put `b` in your `SOLIDX`;
- **it is already drawn standing up and the library's shape is not that drawing.** A solid with a
  `side` drawing is built as a box that wears its top-down art on its lid and its side art round its
  four faces. The `mesh` view has no texture channel at all — a part is a primitive, a place, a size,
  a colour and an alpha — so a shape that is not the drawing would DELETE it and put a different
  object where it stood. Since mq-v233 every library shape for such a letter is that letter's drawing
  and says so, so this refuses nothing the engine offers; it stays for the next one.

If you want a VARIANT of a library shape, write the mesh yourself and the first clause lets it
straight through — a table cleared for whatever your world sets on it, for instance:

    const TILEART_MESH = { T: o => SHAPES.table({ ...o, cleared: somethingOnIt(o) }) };

**Your world means something else by a letter?** One line, in your `art.js`, and it is the same
line whichever way you go:

    TILEMETA["I"] = { lift:13, kind:"facade" };   // MY I is a shopfront, not a grocery counter

That is a real example. A second world's `I` is a storefront face at wall height; the engine's `I`
is a waist-high counter. Without that row that world would have a counter standing inside twelve of
its shops.

**And to borrow a shape for a letter the engine spells differently:**

    const TILEART_MESH = { "▯": o => SHAPES.shelving(o) };  // my shelving is spelled ▯

**The arrow is mandatory and it is not style.** `engine/boot.js` is the last script tag in both
shells and it is what loads `engine/shapes.js`, so your pack file is evaluated BEFORE `SHAPES` and
`TILEMESH` exist. `TILEMESH["K"] = SHAPES.counter` throws *"TILEMESH is not defined"*, and even
`TILEART["K"] = { mesh: SHAPES.counter }` throws *"SHAPES is not defined"*, because the object
literal is built the moment your file runs. The arrow defers the lookup to draw time. **And you
must DECLARE the table**: a world that has never written a mesh has no `TILEART_MESH` to add a key
to, so `TILEART_MESH["K"] = …` throws *"TILEART_MESH is not defined"*. All three wrong forms and the
right one were planted against a second world on 2026-09-22 and only the right one printed OK. This
is written here because the eager form was documented in five places and not one of them ran.

**Why it is a line you write and not a default you inherit — three reasons, and all three were
bought.** *One:* a letter means what a WORLD says it means, and a default that overrode you would
be the engine deciding what your alphabet is. *Two:* a default cannot tell agreement from silence,
and the difference between them is six crates of produce in somebody's bedroom (above). *Three:* a
shape you did not ask for is not free even when it is invisible. The 3D ground bakes a soft contact shadow under any tile that HAS a mesh, without
asking whether that tile can stand — so binding a shape to a walkable letter paints a smudge on the
pavement with nothing over it, baked into a texture where no scene-graph dump will ever find it.

### A world with NO `mesh` anywhere, in 3D — so you can leave it blank on purpose

You do not have to draw a single part. Here is exactly what you get:

| what you laid | how it stands in 3D with no `mesh` |
|---|---|
| a wall or a facade (`kind:"wall"/"facade"`) | a full-height box wearing your `top` drawing on its face |
| any other solid (`kind:"furniture"`, `"appliance"`, `"prop"`…) with a `side` drawing | a box as tall as its `lift`, your side art on all four faces |
| a solid with NO side drawing | **a billboard — a flat picture standing in the street, turning to face the camera.** This is the thing `#39` exists to hunt |
| a tree (`kind:"tree"`) | a trunk box with a canopy billboard over it |
| a fence (`kind:"fence"`) | an upright plane with your drawing on both sides |
| a walkable tile | painted flat into the floor, as in every other camera |

**That is a real, shippable world** — it is what Meridian looked like until 2026-09-21 and what a
second world looked like until 2026-09-22. It reads as a board game with cardboard standees, which
for some worlds is exactly right. Choose it on purpose, and know that `test/engine.smoke.js` will
list every letter still standing as a picture (`Still flat in 3D (#39): …`) every single run, so
the cost is always in front of you and never a surprise.

**The recipe for giving a thing a shape yourself — from the 2D drawing to a frame at phone size,
and what the marigold taught — is `.claude/skills/shapes/SKILL.md`. Its step 0 is "look in `SHAPES`
first", because the cheapest shape is the one already written.**

**Three keys in the same table are not glyphs but KINDS** — things the engine builds itself and asks the pack to
dress: `prop:ofrenda` (the season's altar), `prop:bridge` (what stands on a plank deck — the engine keeps its deck
and rails and ADDS the pack's parts, laid at the deck's height and slope; the function gets `{x,y,ew,cam,slp,h,edges,pet}`)
and `prop:tram` (the trolley's body; the function gets `{len,h,fl,cab}`, +x is the direction of travel, and the
wheels and the driver stay the engine's). A part with `a:` under 1 is glass: a second, transparent mesh hung under
the tile's. A pack that answers none of them gets the boxes it always got. (Crew iteration 11, 2026-09-21.)

**A layer costs nothing to have.** It costs one drawing wherever you want to differ, and partial is
normal: a second world runs a whole map on **nine drawings** across 45 glyphs, and Meridian has
18 solid glyphs with no side drawing at all.

## 0⅞ · If the world is meant to be CALM, say what replaces the pressure — before you build (2026-09-11)

**This is the third question, and it is the one a new world is most likely to skip**, because
"relaxing" sounds like a description of a mood rather than a specification.

`[WEB]` Cook, Serve, Delicious! 3 shipped a Chill Mode that removed customer impatience and walkouts
entirely. The studio — a decade into the genre — **could find nothing to put in the hole, so it
capped the medal at silver instead.** That is an admission that the score was the content.
(https://www.thexboxhub.com/cook-serve-delicious-3-review/)

**So a world briefed as calm owes an answer to one question before a file is written: *what now
generates interest?* "The player enjoys the freedom" is not an answer.** The five that other games
have shipped are in `docs/GENRE-RULES.md` R1–R5, each with its trap: **comprehension** (the thing is
incomplete and you reconstruct it), **reading a person** (what you make is the reply, and it changes
what they say next), **fit** (a light constraint that yields instead of punishing — the expensive
one, it needs an inventory this engine does not have), **unrushable duration with abundance**, and
**tactility** (spend it last, on two or three objects).

Three rules that travel with this, and each is cheap to honour and expensive to retrofit:

- **`[CODE]` A pack that declares nothing inherits no stakes.** `STK()` defaults to `{mode:"none"}`
  (`engine/engine.js:359`) and `stakesCfg()` reads stakes **per chapter** (`:362`), so *"a calm world
  with exactly one scored thing in one district"* is already a seam. **The calm version is the cheap
  version here, which is unusual — do not spend engine work buying it.**
- **Never build a day budget.** `[WEB]` It is how a timer comes back wearing cozy clothes: it never
  counts down in front of you, it just makes every action cost something scarce. `[CODE]` The engine
  reads the real clock for light only (`drawDaylight`) and nothing in it spends a day. **That is a
  property to preserve, not an omission to fix.**
- **Decide what a mistake MEANS, and write it down.** Eight shipped answers are in
  `docs/research/2026-09-11-cooking-games.md` §3. The two cheapest: *the mistake becomes dialogue you
  would not otherwise have seen*, and *a named, blameless skip* ("Let It Be"). **A mistake is only a
  punishment if it SUBTRACTS.**

## 1 · The folder — nine files, and which ones the engine actually needs

```
content/<name>/
  strings.js     UI            — every word on screen, en + es (or one language)
  quests.en.js   QEN, FQEN     — the quests; FQ* is the pet's side quest
  quests.es.js   QES, FQES     — the mirror; the test suite holds them in lockstep
  npcs.js        NPCE NPCN NPCLOOK WNPC …   — who lives there, what they look like, where they stand
  maps.js        WORLD_DEFS PORTALS …       — the town as rows of characters
  art.js         TILEART TILEART_SIDE TILEMETA DECOART BUILDTPL …  — the pack's own drawings
  config.js      GAMEV MAXXP LEVELS CHAPTERS …  — version, progression, districts
  room.js        INTERVIEW     — the office intake (Meridian-specific; optional)
  docs.js        DOCS READS DOCUI  — the paper the world produces (optional)
```

**Nine is Meridian's number, not the engine's.** A pack may drop files and add its own — a
second world has no `room.js` and adds `record.js` (its `RECORDSRC`, §9). Two rules that only
became visible once a second world existed:

- **Dropping a file means dropping its `<script>` tag too.** A second world's shell loaded
  `content/room.js` for weeks with no such file behind it — a 404 on every load of that world since
  the folder was made. It was harmless (`INTERVIEW` stays undefined and the engine does less, which
  is the intended off state) and that is exactly why nothing noticed: a browser does not throw for
  a `<script>` that 404s, so `pageerror` never fires and an aborted-request harness never sees it.
  **Both halves are fixed and this paragraph is kept because the SHAPE of it recurs.** The tag is
  gone (in that world's `index.html`, where it stood there is now a comment saying why), and the check
  now exists: `test/engine.smoke.js` reads the shell's HTML **off disk** and fails on any
  `<script src=` with no file behind it — *"this shell loads "…" and there is no such file — every
  load of it is a 404 nobody sees"*. It runs against both shells on every CI build.
- **A file the shell loads before `engine/engine.js` may reference nothing from the engine at load
  time.** The town's `record.js` is loaded last of the content files and still only *defines* an
  object; everything that touches `WORLDS`, `SK()` or `docOpen` runs inside `boot()`, which the
  engine calls (`engine/engine.js:5129`).

**Required — the engine reads these bare and dies without them** (verified: no `typeof` guard):

| global | file | what it is |
|---|---|---|
| `WORLD_DEFS` | maps.js | every room, as rows of glyphs |
| `PORTALS` | maps.js | which glyph in which world leads where |
| `WNPC` | maps.js/npcs.js | which glyph in which world is which person |
| `NPCE` `NPCN` `NPCLOOK` | npcs.js | emoji, names (en/es), and the look of every person |
| `QEN` `QES` `FQEN` `FQES` | quests.*.js | the quests, both languages |
| `UI` | strings.js | every UI string — **about eighty keys, not one line.** `applyLang()` bare-dereferences ~82 of them; a missing key is a crash on the title screen, not a blank label. Copy Meridian's file whole and edit the words (measured 2026-09-10, `docs/GAUGE.md`) |
| `MAXXP` `LEVELS` | config.js | how far the game goes and the level bands |
| `GAMENAME` `GAMEV` | config.js | the name and the version. **Both are required by the shared suite** — `test/engine.smoke.js:64-65` fails the build without either, and `:67` fails if the title screen does not print `GAMEV`. This file listed `GAMEV` as optional until 2026-09-10; it was wrong |

**Optional — guarded by `typeof`, the engine simply does less without them:**
`CAMDEF CAMERAS STAKES GROWTH SEASONS CHAPTERS ENDLESS INTERVIEW CRITTERS DOGNAMES EGGS CHATTER CHILL NPCACT TRV
DECOR DECOART READS DOCS DOCUI BUILDTPL BUILDS TILEART TILEART_SIDE TILEMETA MAPCOL MAPDOT
TOWNLBL DOORS DOORLOOK SOLIDX PETPASS PLACES FLOORS ANIMALS READERLOOK RECORDSRC HUDFACT TROLLEYAT` — and a template part's `link`
(`{door:[dy,dx], landing:[x,y], exit:[x,y], interior:{rows, people, locs, arrive}}`, #10): the
build stamps the interior as a world named after the lot and keys both doors by place
(`PORTALSAT`), so one template can be stamped on many lots and every door opens — and, since `mq-v65`, **`STOREPFX`** (config.js): the prefix on
every storage key. Optional in the engine, **required in practice for any second world served
from the same origin**, or it loads the first world's save and overwrites it (§8). A world with none of these is a walkable town with people and
quests. Everything else is a layer you add when its answer arrives.

**`PETPASS`** (maps.js, a string, mq-v232) — letters an animal walks through and a person cannot: `const PETPASS="4";`
makes the agility tunnel a tube the dog runs through that nobody can walk into. Animals keep asking `SOLID`; everything
that decides where a person may stand (the player's step, a neighbour's wander, the reach audits, where a door or a
chat sets somebody down) asks the engine's `shutToPeople` instead. Say nothing and nothing changes. Before you
declare a letter, make sure it is not the only way anywhere: `test/engine.smoke.js` (grep `pets-only`) declares it on
a page of its own and fails if the player is cut off from a tile he could reach with it open.

**`TROLLEYAT` — the one optional seam with a boot audit of its own, so it is worth its own paragraph.**
One entry per line: `{world, row, from, to, stops}`. `stops` is a **list of platform tiles — the tile
a person stands on to be served — beside the rails, never on them**, and it is a list rather than a
number because two different readers need it: *is this tile a stop* (the travel panel opens there)
and *which stop is the car's doors at* (the car waits there). Declare no `stops` and the line has
none: nothing calls the car, nothing opens the pass, and it simply runs. **Declaring half is what
hurts** (`docs/TAGS.md` L16), so `troAudit()` warns at boot about a second line in one world, any key
with no reader, and a stop that is off the map, inside something, **on the rails**, out of reach, or
past the end of the run. Read your console the first time.

Three behaviours come free and none of them is a Meridian choice: it **brakes** for anything alive on
the rails ahead (`TRO_LOOK` tiles); **critters keep clear of it themselves** (`TRO_SHY` tiles, and
`TRO_SHY > TRO_LOOK` is an invariant with a guard on it — reverse them and the car and the critter
deadlock for ever); and it **waits at a platform** for up to `TRO_DWELL` while somebody is within
`TRO_REACH` of it, then goes. All four are engine constants, deliberately not pack keys: `troAudit`
refuses a line that declares a word no reader exists for, so a `dwell:` key with no seam behind it
would be a promise the engine does not keep. If your game needs its own numbers, that is one seam,
added once, with an audit entry each.

## 1½ · Your world's PAPER — the tenth thing, and it is optional (2026-09-16)

*Added the day `ARCH-LOG.md` A15 was closed. Read this before you design a single document, because
the day it was written cost somebody an afternoon of drawing food inside a surface that could not be
changed.*

**A pack ships nine JavaScript files. The tenth thing it may declare is `PAPER` — a string of CSS —
and it is what stops your documents looking like Meridian's municipal paperwork.**

```js
const PAPER = `
  & { background:#0E1A24; color:#D9E6EF; font-family:Georgia,serif; }
  .dkv b { color:#7FB2CE; text-transform:none; letter-spacing:0; }
  .dnote { background:#14242F; border-left-color:#3E7FA6; font-style:normal; }
`;
```

- **`&` means the sheet itself.** Everything else is a selector inside it.
- **Omit it entirely and nothing changes.** Meridian declares none. This is not a thing you must
  answer at the start; it is a thing you will want on the afternoon your first document looks wrong.
- **The engine re-roots every selector at the reader.** You cannot style the HUD, the chrome, the
  world canvas or the page — not because we ask you not to, but because a selector that tries comes
  out the other side matching nothing. `docs/BOUNDARY.md`, "The paper seam", says exactly how.
- **`@import`, `@font-face`, `@keyframes` and `@property` are dropped**, and the log says so. They
  register a *global name* or fetch, and a name cannot be scoped to a subtree. (`@import` is never
  even fetched: the engine parses your paper in a constructed stylesheet, which drops it unread.)
  Use faces the system already has (`Georgia`, `ui-serif`, `ui-monospace`) — that is enough to stop
  looking like a form.
- **`position:fixed` is stripped**, for the same reason: it escapes the reader and can cover the HUD.

**The two questions A15 says to keep apart forever, and this is the template's copy of them:**

- *"Can the engine's reader draw this?"* — answer it by rendering in the reader.
- *"Would the person this is for want to open it?"* — **never answer this one with the reader.**
  Design the surface first, then judge. Three specialist reviewers measured, cold-read and corrected
  a drawing for a whole day and not one said the surface was a form, because every brief pointed at
  the picture.

## 2 · The switch — honest state: there is no pack selector

The pack is hardcoded in **three places**, and a new world means touching all three:

1. `index.html` lines ~604–612 — nine `<script src="content/meridian/…">` tags.
2. `sw.js` — `ASSETS` lists the same nine paths, and `CACHE` must equal `GAMEV`
   (the suite enforces the lockstep).
3. `manifest.webmanifest` — `name`, `short_name`, icons, colours.

Today the honest procedure is **copy the repo** (or a branch) and edit those three. A `?pack=`
switch or a build step that stamps them is a real piece of work nobody has asked for; log it
the day two worlds need to live in one deploy.

## 3 · The engine debt a second world will hit — say it now, not in month two

- ~~**Sixty-two hardcoded world ids in `engine/engine.js`.**~~ **Paid 2026-09-06 (`mq-v71`, #25).**
  The engine reads its rooms as ROLES from the pack's `PLACES` table: `home` and `spawn`
  (where a new game and a broken save land), `street` (the map dot follows you there), `park`
  with `parkIn` / `parkDog` / `parkDogHome` / `parkAdopt` (the leash, the dogs), `friends` (the
  worlds whose people a dog may befriend — only worlds you have), `upstairs` (the map's ⇧), `eateries`
  (the places that serve food, and who works there: a dog sings at the door and they bring him water).
  Pavement colours per world come from `FLOORS`. A pack that declares neither gets Meridian's
  table byte for byte; a pack with its own names declares its own, in its
  own `config.js`. The smoke fails the build if a world id is ever spelled in `engine/`
  again, and `test/engine.smoke.js` checks that every role a pack declares points at a real,
  walkable place. **The full table, every role the engine reads** (owner, 2026-09-07: *"update
  here and meridian and template so we have a good amount of metadata that includes these"*;
  both packs carry it with a note per line, and Meridian's must equal the defaults key for key):

  | role | type | the engine uses it for | default (Meridian) |
  |---|---|---|---|
  | `home` | world id | where a new game and a broken save land | `hq` |
  | `spawn` | `[x,y]` | the tile in `home` you land on — must be walkable | `[10,11]` |
  | `street` | world id | the map's world; the 📍 dot follows you only here | `st` |
  | `park` | world id | the room the leash leads to; the park recap plays when you leave it | `pk` |
  | `parkIn` | `[x,y,dir]` | where you arrive in the park and which way you face | `[2,6,"right"]` |
  | `parkDog` | `[x,y]` | where the dog you brought stands on arrival | `[3,6]` |
  | `parkDogHome` | `[x,y]` | where that dog drifts back to while you play | `[8,6]` |
  | `parkAdopt` | `[[x,y],…]` | free spots an adopted dog may take, tried in order | six spots |
  | `friends` | world ids | the worlds whose people a dog may befriend; a world you do not have is skipped | `st me lc lo` |
  | `upstairs` | world id | the floor the map marks ⇧ | `f2` |
  | `eateries` | `[{world,who},…]` | places that serve food: a dog who sings at one's door is brought a bowl of water by `who` (a person who works in `world`; left out, the first person there). A world you do not have is skipped, so a pack with none gets none | `[{world:"lc"}]` (the first person there is Doña Rosa) |

  A role you leave out falls back to the default. Declare all eleven anyway: the table is the
  world's metadata, and a reader should not have to open the engine to learn what the engine
  will assume. Everything a pack may declare is listed in §2 (`PLACES FLOORS ANIMALS …`).
- **The name blocklist** in `test/smoke.js` (the portability guard) is Meridian's proper nouns.
  A new world adds its own list, or the guard becomes generic (scan the pack for capitalised
  names and forbid them in `engine/`).
- **The smoke suite is Meridian's**: 33 sections, ~113 lines naming Meridian people and
  places, ~101 hardcoded world ids. Roughly a third of it is *engine* invariants that every
  world wants (portability, the four cameras, stand tiles, the light ladder, the reader's
  geometry, EN/ES lockstep, reachability, discoverability). **Separating those into
  `test/engine.smoke.js` is the first task of a second world**, so the second pack gets a
  suite it didn't have to write.
- `room.js` (the office intake) and `docs.js` (deliverables, templates) are Meridian's
  career layer. Fully removable; drop them and nothing else breaks (`docs/for-partner/AFFECTED.md`).

### 3¾ · A staircase — the template (#4, 2026-09-07)

The engine owns five glyphs for a flight that runs EAST: `⊓` the stair mass (solid, wall-height,
wears the flight in profile — bake per tile), `≡` a tread (walkable), `▲` the head, the way up
(a portal, `mark:"up"`), `▼` the way down (a portal, the deepest tile of a well), `◺` a rail
(solid, knee-high; beside a well it stands on the lip and faces it). A climbing flight's treads
rise toward `▲` and lift whoever stands on them; a well's treads sink toward `▼`, the floor is
cut away over them, and you sink as you go down (`stairRun`, `wellDepth`, `stairLift`). Lay them
as these four rows at the bottom of a 20-wide floor and its upstairs; nothing above them moves:

```
ground  ##########+⊓⊓⊓⊓#####     the door into the room at x10 · the mass x11–14 behind the flight
        #..........≡≡≡▲#####     the landing x10 · treads 11–13 · the head ▲ at x14 → upstairs (14, same row)
        #..................#     a lobby
        ##########E#########     the front door; the street lands you on the landing
upstairs #.........◺◺◺◺.....#    the rail, north side
        #........◺▼≡≡≡.....#     the rail at the head of the well · ▼ → ground (10, same row) · treads · (14,row) is the floor you step off onto
        #.........◺◺◺◺.....#     the rail, south side
        ####################
```

`PORTALS`: ground `"▲":{to:up,x:14,y:R,dir:"left",mark:"up"}`, upstairs `"▼":{to:ground,x:10,y:R,dir:"right"}`,
and the street's door lands on `(10,R)`. Meridian's HQ/f2 and the town's stall/loft carry exactly
this; `test/engine.smoke.js` checks the portals land on walkable tiles in any pack.

### 3⅞ · Seasons — the template (2026-09-08, owner: "we should have in both and template")

A season is ONE block in `SEASONS` in the pack's config. The engine reads its keys and does less without any of
them; nothing else in the engine knows a holiday's name. Two packs carry the same two seasons today (Día de
Muertos with dates, Noche de alebrijes by name only); a third holiday is a third block, placed on the new
world's own maps, no engine change. The keys, all optional:

| Key | What the engine does with it |
|---|---|
| `label:{en,es}`, `from:[m,d]`, `to:[m,d]` | the Settings → Season button; the dates make it automatic ("By the calendar"); no dates = by name only |
| `bridge:[6 hexes, dark first]`, `bridgeStyle:"petals"` | the park's crossing: six bands year-round, a heap of cempasúchil in season (`^` tiles; the trail and the spill are the bridge's) |
| `papel:[hexes]`, `papelBridge:[hexes]` | the cut paper's palette; the marigold cut over the crossing |
| `swags:[{world,from:[x,y],to:[x,y]}]` | a string of cut paper by place — five to nine tiles, a gap between, tied to walls or trees, a pole where it ends on open ground; never over a door |
| `hangs:[{world,x,y,kind:"pinata"}]` | a piñata over open ground |
| `props:[{world,x,y,kind:"calaverita",sill:true,w,foil}]`, `[{world,x,y,kind:"ofrenda"}]` | sugar skulls on a facade's own window (`TILEMETA[g].win`; `w` picks the second window); the ofrenda at the foot of the bridge and on a table (it stands on a solid's top) |
| `bloom:"#hex"` | every planter and the jacarandas bloom |
| `sky:"#hex"` | the north window's dusk |
| `facepaint:true` or `{looks:[5]}` | calavera paint on everyone (the engine's five, or the pack's) |
| `alebrije:{looks:[5]}` | every animal tinted, marked and (the wingless) winged, keeping its silhouette |

Copy Meridian's `muertos` block from `content/meridian/config.js`, keep the palettes, and re-place every
`world/x/y` on your maps. A `props` entry with `sill:true` lands on a window of the facade it names: the
engine picks which window (`w` in the entry names one; without it, several candies on one front take
that front's windows in turn) and cuts the candy to two thirds of the pane, so it never covers the glass
(#131). A facade with narrow windows therefore gets a smaller sweet for free — nothing to hand-size. The smoke proves: every base world strung, every calaverita on a window, an ofrenda at
the bridge and on a table, the planters bloom, the bridge two tiles wide, and the ofrenda standing in 3D.

### 3⅚ · The world's height, and what `fov` costs you (2026-09-08)

The world used to be **width × 0.8** in every camera — the 2D tile grid's 5:4. Nobody chose that;
it fell out of ten-by-eight tiles, and on a phone it left the world 266px tall, **31% of the
screen**, with every panel and button hand-placed against it. A 3D camera has no picture to
protect, so when it is running the world takes a **share of the screen** instead (`svh`, so it does
not jump when the address bar slides away) — about 45%. The flat cameras keep their 5:4: they draw
a fixed bitmap, and stretching or letterboxing it would be worse than the crowding.

**The trap:** three.js's `fov` is the **vertical** angle. Make the box taller and narrower and you
get the same up-and-down and **less left-and-right** — measured here, 10.9 tiles of street across
became 7.7, which reads as the camera zooming in. Below the game's own aspect the vertical angle
must widen to hold the width. Above it, leave it alone: a wide screen already gains width.

**The apron.** Past the edge of the map the ground stopped and the background showed through. A
taller frame shows far more of that, so a dim plane in the world's floor colour sits a hair below
the ground and well outside it: the city carries on into the dark rather than ending at a cliff.

### 3¾½ · A bar that floats over a sheet (Rosa, 2026-09-08)

`position:sticky; bottom:0` on a bar at the foot of a scrolling panel does **not** merely sit at the
end of the paper. It hovers over whatever content happens to be in that band, so *which* control is
unreachable depends only on where the reader has scrolled. On a laptop the sheet fits and nothing
happens; on a phone it parked Copy/Download/Close on top of the town's three write buttons, and a
tap went to Copy with no sign anything was wrong.

Reserving space at the foot does not fix it — the overlap moves with the scroll. The panel has to be
a **column**: the content scrolls in its own box (`flex:1; min-height:0; overflow-y:auto` — without
`min-height:0` a flex child refuses to shrink and the column just grows past the screen), and the bar
sits under it in normal flow, where it cannot be on top of anything.

The same shape is the cure for a panel taller than the window generally — it is what §3⅝'s sibling
fix did for the barber's chair (#126). `test/engine.smoke.js` opens every document a pack declares at
390×560 and asks the browser what is on top of each visible button, so a new world gets the guard for
free.

### 3⅔ · What gets out of your way, and how (#140/#149, 2026-09-09)

A third-person camera has to answer one question over and over: *the player is behind that thing —
now what?* This template answers it twice, because a wall and a tree are not the same kind of thing.

**A wall is a plane you are meant to see over.** The nearest wall that hides you drops to a knee-high
stub in its own top colour. That reads as a cutaway. It has been the rule since #65, and the owner
signed it: only the nearest one, never automatically turning the camera.

**A tree, a lamp, a piñata is an object.** Half a tree is not a cutaway, it is a missing tree, and the
room stops making sense. A tall object that hides you turns to glass instead: still there, still in
its place, drawn at `T3GHOST` (0.55) with `depthWrite` off and a render order above the people, so
the crown is painted *over* you at 55% and one pixel holds both of you.

Two things this depends on, both easy to lose:

- **Ask about height, never about kind.** The old rule listed kinds — walls, facades, lintels, doors,
  window pieces — so a tree crown could never be considered no matter how much of you it covered.
  Worse, it read `geometry.parameters.height`, which a billboard does not have. `t3Top(o)` answers
  for a box and for a sprite; use it, and the list of kinds only ever decides *which cure*, not
  *whether*.
- **A see-through pixel must not write depth.** Every prop in 3D is a picture on a card and most of
  that card is empty. Empty pixels that still write depth punch holes in whatever is drawn after
  them — which is people. Every baked billboard carries `alphaTest: T3ALPHA` for that reason. A new
  world that bakes its own billboard and forgets it will lose quest marks near furniture and never
  work out why; `test/engine.smoke.js` fails the build instead.

Materials can be shared between pieces of one glyph, so the glass copy is made once **per piece** and
kept beside the solid one. Edit a material in place and one tree will fog its whole row.

### 3⅝ · How 3D samples a pixel grid — free, and easy to lose (#134, 2026-09-08)

A new world inherits this from `engine/engine3d.js` and never sets it; it is written down because it
is the kind of thing a later change quietly undoes.

The art is a pixel grid. **Nothing may be sampled through a linear filter** — not between texels
(`magFilter`, `minFilter`), not between mip levels. Linear blending is what "blurry" means here; the
owner reported it and a measurement confirmed it (mean absolute Laplacian of a rendered street:
2.26 blurred, 2.72 fixed).

The **mip pyramid stays**. It was never the blur; drop it and the far half of the street crawls as you
walk. `NearestMipmapNearestFilter` plus max anisotropy gets both: the texel grid intact up close, a
smaller level chosen honestly at distance.

Ask for the pyramid **only under WebGL2** (`renderer.capabilities.isWebGL2`). Every texture here is
sized to its world, never to a power of two, and a non-power-of-two texture with mipmaps renders
**black** on a WebGL1 fallback.

A texture repainted every frame (the actor sprites) carries **no** pyramid — rebuilding one per frame
costs more than it buys — but it is still nearest at both ends.

`test/engine.smoke.js` holds all of this for any pack, so a new world gets the guard for free.

### 3½ · Two looks for the reader

`READERLOOK="night"` in a pack's config turns the reader's cream paper purple-dark (the town's
choice, 2026-09-06); leave it out and the paper stays cream (Meridian's). Both shells carry both
looks in CSS; the engine adds one class to the sheet. A new world picks either in one line.

## 4 · The rules that travel to any story *(from `docs/OWNER.md`)*

- **Nothing is ever taken away from the player.** No progress, no city, no save, no access.
- **Never a quest log or a to-do list that finds the player.** Markers in the world, yes.
- **Nothing goes into the world the player cannot use.** A house you cannot enter is scenery
  pretending to be a place — and now the engine's `buildSafe()` is meant to enforce it.
- **The world must be realistic — "not perfect but so if needed it can be upgraded."**
- **Four cameras or it doesn't exist.** Top, front, iso, 3D. A test counts which drawing each
  camera calls.
- **Build the ability, not the thing — unless the thing was asked for.**
- **Every ask is quoted verbatim before building.** Paraphrase is how requirements die.
- **Contradictions are reported, never absorbed.**
- **Every new test assertion is proven to fail against broken code before it is kept.**

## 5 · Build order for a new world, smallest first

| step | what lands | proves |
|---|---|---|
| 1 | `docs/for-<name>/` from `/game-brief`; empty bible, ledger, ASKS | you know what they want, in their words |
| 2 | `content/<name>/` with only the **required** globals: one map, three people, one quest in one language; the three switch files | the engine boots a world that is not Meridian |
| 3 | `test/engine.smoke.js` split out; a new-world smoke with its own name list and invariants | the gate is real before anything is built on it |
| 4 | `node test/tilesheet.js` on any new glyph — the cold read | a stranger can name every tile |
| 5 | the second language, held in lockstep by the test | EN/ES cannot drift |
| 6 | the optional layers, one at a time, each with its answer from the interview: critters, growth, docs, decor, templates | each layer is a decision, not a default |
| 7 | `node test/shots.js --cams` on three spots; look at them | four cameras, actually looked at |
| 8 | a human plays it | the only gate that counts — Meridian's four newest districts have never passed it |

## 6 · The people you bring

`/nacho` (story), `/don-guero` (city), `/pili` (readability) and `/meeting-of-da-minds` are
written for Meridian, but the shape is the template: **one agent per discipline, each reading
the same bible and ledger, each returning ONE recommendation with a file it touched, never
writing code.** A new world either gives them a new bible to read or gets its own trio with
the same rules. The meeting skill's procedure — ground truth first, positions in parallel,
feasibility by someone loyal only to the code, synthesis, learning — is world-agnostic.

## 7 · What is free

The character creator, the wardrobe, day-and-night light, themes with contrast auto-fix, the
trolley, device saves, the offline installable app, QR save transfer, procedural music, name
easter eggs, pettable animals, a dog who follows you through doors, light props you can kick,
the stapled-paper reader, build templates with seeded variation, and the admin tools for
placing townsfolk by hand. None of it needs a line written for a second world.

**One line takes the builder's drone** (#271): `const BUILDER={};` in your `config.js`. B — or a row
the engine adds to Settings, for a phone — lifts a small drone off the person you play; the keys fly it tile by tile, over walls but never off the map;
the camera goes with it; a card names the tile under it; Escape flies it home. The person you play
stays exactly where he stood, and nothing about a flight is ever saved. It is a builder's tool, so it
is off until a pack asks for it, and Meridian does not. `name:{en:"…",es:"…"}` renames it; nothing
else in `BUILDER` is read, and the engine says so at boot if you write anything else.

## 8 · What 2026-09-05 added to this template *(a private pack, the first world built from it)*

A private pack is the first second world, and building
its foundations changed four answers above. A world started after this date inherits them.

- **`STOREPFX` is the first line of a new `config.js`.** `mq-v65` put every storage key the
  engine touches (51 sites) behind `SK()`. Meridian's prefix is `"mq"`; a second world
  declares its own (`"ch"` for the town) or, on the same origin, it opens the first world's
  hero and then overwrites that save. GitHub Pages serves every project site on an account
  from **one origin**; `localStorage` is per-origin. The guarantee test fails a literal key.
- **The switch is a folder.** §2 said there is no pack selector; the chosen answer is a
  second `index.html` in its own folder that loads `../engine/` and its own
  `content/`. One CI covers both, and the first world's index is untouched.

  **⚠️ "Nothing is copied" was written of the engine and the content, and it is false of the
  shell.** Corrected 2026-09-10 by reading both files. That world's `index.html` is 791 lines
  against the public shell's 803, and roughly 770 of them are the same CSS and markup —
  including the comments that record *why* each rule is there (Rosa's findings, #126, #127, #130
  appear verbatim in both). The differences are real but small: there is no manifest and no service worker (`:788`), the title
  and script paths change, and the town adds `.dred` / `#toast.crit` for the red category (#8).

  **The only guard on those 770 lines is a line count**, one-directional:
  `test/town.smoke.js:23` fails when the town's index is more than 20 lines *shorter* than the
  public one. A CSS rule fixed in one shell and not the other changes no line count and is not
  detected. This is the exact rot `docs/GAUGE.md:53-58` describes, and the gauge pack chose the
  other answer for the same reason: **generate the shell from `index.html` and assert that every
  edit actually matched**, because "a `String.replace` that stops matching returns the input
  unchanged and would otherwise print success while testing the wrong thing." A third world
  should generate its shell. The town predates that decision and has not been converted;
  converting it is a real piece of work, not a documentation fix.
- **A service worker is per world, and optional.** A world that ships to players carries its
  own `sw.js` with its own `CACHE` name and its own `PFX` — the worker now deletes only caches
  it owns, serves only its own origin, and never stores a non-ok response. A world that runs
  only on `localhost` for one person **registers no worker at all**.
- **The public build's guarantee is a test, and it is the first world's.** `test/smoke.js`
  asserts the tracked shell of the *public* game mentions no API host or token, reads no URL
  query, keeps a pinned CSP, and that no URL flag turns admin on. A second world that widens
  its own CSP (to read GitHub, say) does it in **its** index, never the public one.
- **Three parts, not nine steps, when the world is tooling.** Foundations that ship to the
  first world behaviour-identical → the world itself, read-only → the world talks back. Each
  part is a PR that ends green. The nine steps of §5 still apply inside part two.
- **The rule of weight travels.** If the world reads a ledger (issues, a task list), a label
  picks the body: a named person carries a real task, townsfolk a small one, a note on a board
  the rest, and animals nothing.
- **What a second world must never do to the first** — five rules:
  the first world's purpose is fixed; every engine change is behaviour-identical for it and
  proven the same day; its content is never edited for another world's sake; its public build
  knows nothing about a personal one; sittings are ranked by the owner, not by the new world.
- **Two reviews before a word of code.** An engineering feasibility pass and a threat model,
  both against the real code with file:line, both adversarial to the plan. They found the
  storage collision, the cache poisoning and the hosting mistake the plan had written in. Run
  them for any world that touches a network.

---

## 9 · A world that is not a story — the five seams the town runs on *(added 2026-09-10)*

*Written after an audit that did the exercise the owner asked for: pretend the second world does not
exist and rebuild it from this file alone. Everything in §0–§8 was reachable. **Nothing below was.**
Every one of these is a real, guarded, tested engine seam that a stranger following this template
could only have found by reading `engine/engine.js`.*

**This is the shape of the gap.** §0–§8 describe a *story* world: districts, quests, chapters,
seasons, cameras. The second world is not a story, it is **a live view of something outside the game**,
and the engine already has seams for exactly that — they were simply never written down here.

### 9.1 · `RECORDSRC` — where a world's people come from something that is not a map

> `engine/engine.js:376-383`. A pack may declare `RECORDSRC = {enabled, boot()}`. The engine calls
> `boot()` **once**, after `NET`, and never again (`engine.js:5129`, inside a `try`). What the record
> holds and where it comes from is entirely the pack's business — a same-origin file, or an API the
> **pack's own** `index.html` allows in its CSP. The public build's CSP allows neither, by test.

This is the whole of the second world: its `record.js` declares it, and everything
else in that 649-line file hangs off `boot()`. Without this seam in the template, a second world that
wants to show live data has no idea the engine will hand it a starting gun at the right moment, and
would try to run at script-load time — before `WORLDS` exists.

**The ask this seam answers is not in §0's interview.** Add two questions to it:
*"Does your world show something that changes when you are not playing?"* and, if yes,
*"Can the player change it back?"* The first is `RECORDSRC`; the second is a token, a CSP entry, and
the two reviews above.

### 9.2 · `HUDFACT` — a world with no score

> `engine/engine.js:393-411`. A pack may declare `HUDFACT()`, a function returning a string. When it
> exists, the strip at the door prints that string instead of `NAME · RANK` and `N XP`, the XP bar is
> hidden (`:405`, and `:3468` / `:5102` hide the wrapper at boot and after a chapter), and the chip in
> the corner of the world carries the same fact. Return `""` and the strip stays **empty** rather than
> lying.

The reasoning is the part worth keeping, and it lives only in a code comment today
(`engine.js:393-400`, and again in the second world's `record.js`): *whatever XP counts, it
teaches* — and in a backlog neither filing more nor closing more is reliably good, while a permanent
`0 XP` is a verdict delivered at the door every session. **The rule: a fact must be able to go DOWN as
well as up, and neither direction is praised.** The town's is `HUDFACT()` at `record.js:638-648` —
*"14 waiting · 3 moved"*.

**Pair this with §0½.** A world that answers *"it does not end"* almost certainly also wants
`HUDFACT`, because the same argument applies: a place you inhabit does not grade you. §0½ never says
so, and the town shipped Meridian's rank ladder — Rookie to AI LEGEND — on its front door until
somebody looked (GitHub #154).

### 9.3 · The reader is an application surface, not a sheet of paper

§1 gives `DOCS READS DOCUI` one line — *"the paper the world produces (optional)"*. That is true of
Meridian and badly incomplete. The reader renders **thirteen** block kinds
(`h p note red blank kv t q btn sel form docs art`, `engine.js`, grep `function docRender`; `art` is a real canvas the pack draws on), and four of them are live:

| block | what it is | engine |
|---|---|---|
| `{btn, run}` | a button. The reader never learns what it does; content does | `engine.js:2939-2943` |
| `{sel, opts, value, run}` | a dropdown, options optionally grouped by `o.g` | `:2944-2953` |
| `{form:{fields, submit, cancel, onCancel, run, noFocus}}` | a whole form — `text`, `password`, `area`, `select`, `checks` — every field on one screen beside the paperwork. The reader collects the values and hands them to `run(v)` | `:2954-2975` |
| `{red}` | a line in red, for what is critical | `:2923` |
| `{art, aspect, wide, cap, grab}` | **a real canvas the pack draws on**, at 240–560 CSS px — or at its own `wide` width inside its own scroller, for a picture you walk along. `aspect` may be a function of the width. `grab:true` gives that canvas the POINTER: `touch-action:none`, a grab cursor and a place in the tab order | `engine.js`, grep `A DRAWING. The pack draws` and `A PICTURE MAY TAKE THE POINTER` |

And the two that make it composable:

- **A document may be an object, not an id.** `docDef()` returns `id` itself when `id` is an object
  (`engine.js:2883`), so `docOpen(self.commentDoc(i))` opens a sheet that was built one line earlier
  and never registered in `DOCS`. That is how the town gets a comment box per person
  (`record.js:434-436`).
- **`build()` runs on every open** (`engine.js:2884-2885`), so a document is *live*: the town's
  people cycle through three lines because `doc(i).build()` advances a counter each time
  (`record.js:503-506`).

**Why this matters more than it looks:** `docMarkdown()` (`engine.js:2887`) exports `h p note blank
kv t q docs` and deliberately **not** `btn sel form red`. So the Copy/Download buttons on any sheet
silently drop every interactive part. That is correct — a button is not text — but a new world that
promises "copy this document" has to know its form will not be in the copy.

#### 9.3a · A canvas in the reader is where a MECHANIC goes, and it is the only zoom this engine has

A tile is about 35 screen pixels and `T3CAMD`/`T3CAMH`/`T3FOV` are engine constants no pack can set,
so **there is no camera a world can pull in with.** The reader's canvas is the answer: 240–560 CSS px
against that 35, which is seven to sixteen times the linear size for free, and the owner's own words
for it are printed in the engine beside the code — *"you see tiles/icons from afar but you get close
and can interact to see it full screen."* A thing whose content is TEXTURE or a GESTURE — dough
coming together, a seam, a photograph, a wiring diagram — belongs there and cannot work on a tile.

Four things a second world needs to know before it builds one, all of them paid for once already:

1. **Say `grab:true` or lose every vertical drag.** `.dart` carries no `touch-action` rule in either
   shell, so on a phone a downward swipe on an un-`grab`bed canvas scrolls the sheet. It is opt-in
   because a wall of pictures you scroll PAST is the commoner case, and an engine that took the
   pointer from all of them would wall the page off behind them.
2. **Map the pointer with `getBoundingClientRect()`, never `offsetX`.** The non-`wide` branch CSS-scales
   the canvas (`cv.style.height="auto"`), so its layout box and its backing box are different sizes.
3. **Start any loop with `requestAnimationFrame`, never a direct call.** At `art()` time the canvas is
   not in the document yet — `docRender` appends it *after* it hands the pack the context — so a
   synchronous first frame measures an element with no box.
4. **Never refresh the card by calling `docOpen` again.** It re-runs `exitFsForCard`, which records
   `wasFs=false` because the first open already stripped `.fs`, and a fullscreen player is dropped out
   of fullscreen for good. A canvas that repaints itself has no such problem, which is why a live
   surface should carry its own changing sentence rather than rely on a paragraph beside it.

`content/horno/` is the worked example of all four: `docs.js`'s `masa` card and `art.js`, grep
`THE CARD'S SURFACE`.

### 9.4 · People who arrive and leave while the game is running

> `addChill(c)` → `engine.js:154`, returns a key or `null`. `removeChill(key)` → `:166`, *"the
> inverse `addChill` never had"*. §1 lists `CHILL` as an optional global — a **static** list read once
> at `:172` — and never says the pair exists.

Four rules the town paid for, none of them in this file until now:

1. **A placed person may carry a `doc`, and then behaves differently**: they wear the mark, stand
   still instead of wandering, and open the document when talked to (`engine.js:376-382`, and
   the second world's `record.js` sets `n.doc`, `n.tier`, `n.issue`).
2. **Placing a person writes `"N"` into the grid, and removing them must give the tile back.** Get
   this wrong and the map grows permanent invisible walls. `test/town.smoke.js:76` walks every tile of
   every world and fails on any `"N"` with nobody on it — **that check belongs in the shared suite,
   not the town's**, because it is a property of `addChill`/`removeChill` and not of a backlog.
3. **Anything you place at runtime can wall the player in, and there is a function that says so.**
   `auditReach(grown)` (`engine.js:219`) returns the places you can no longer reach; the engine runs
   it once at boot (`:252`) and the town runs it again after every placement
   (`record.js:624`). A world that adds people, props or buildings after boot **must** call it.
4. **Check the tile first.** `record.js:616` refuses to place on a solid or on an existing `"N"`.
   `addChill` does not do this for you.

### 9.5 · Decor is baked in 3D — changing content data does nothing until you say so

The engine draws `DECOR` entries through `DECODRAW`; `sign` prints `d.text`, **capped at four
characters** (`engine.js:1480-1484`). A pack may mutate `d.text` at runtime — the town's signs count
the open issues of each house (`record.js:182-186`).

**The trap, and it is a whole class of bug:** the 3D scene bakes its decor at build time, so the
mutation is invisible until `t3Invalidate()` is called. The town calls it, guarded, and only when
something actually changed (`record.js:184-186`, and again in `goBeside` at `:149`). A new world that
animates any content data and forgets this will see it work in three cameras and not in the fourth,
which reads as "3D is broken" rather than "the scene is stale".

### 9.6 · What this audit could NOT settle

Named rather than smoothed over, per the rule at the top of `docs/OPEN.md`:

- **Whether these five should stay pack seams or become template defaults.** `HUDFACT` in particular
  looks like it wants to be the default for `ENDLESS` worlds. That is a design decision nobody has
  made; it is not written down here as if it had been.
- **Whether the town's shell should be generated like the gauge's** (§8). Costed at "a real piece of
  work", not costed in hours.
- **Whether a pack that stores a credential needs an engine rule.** [An example from a private tool was taken out.] [An example from a private tool was taken out.] Nothing in the engine or the shared suite would stop a third world getting it wrong.

---

## The north star for this document — the owner, 2026-09-15

> *"we will learn from these for templates but we want templates to one day be made off of one prompt
> or from one questionaire."*

**Where this document is going.** Today a new world is built by a person reading this file and making
a few hundred decisions in the right order. The destination is that a world is built from **one
prompt, or one answered questionnaire** — the questions carrying the decisions this file currently
explains.

Two rules follow from it, and they are what a session should check itself against:

1. **What a round of questions TEACHES belongs here. What the person ANSWERED does not.** [What the first questionnaire’s person answered stays with them.] What belongs here is the *shape* that produced it — that "do you want people
   in it?" is a question worth asking early, because the answer reorganises a whole chapter.
2. **Every decision this file explains in prose is a question somebody could be asked instead.** When a
   section is written or repaired, the useful question is not only "is this still true" but "what would
   we have to ASK to stop needing this paragraph." The questionnaire template
   (`docs/templates/questionnaire/`) is where those questions accumulate; the two rounds [partner] answered
   are its first evidence, and the comment box under every choice earned its keep in both rounds.

**A world will stay special-cased for a long time, and that is fine** — *"we may veer off with mini
games and this is going to be a special case"*. The template is not a cage; it is what is left after a
special case is built and somebody asks which half of it was general.

---

## Before you fill the reader: your world gets a surface, not just content

*Added 2026-09-15, from a day that cost one. The full account is `docs/ARCH-LOG.md` A15 and
`docs/BEAUTIFY.md`, "The surface carries the screen".*

A new world arrives here and starts declaring content — quests, people, maps, documents. That is the
right order for everything **except how your documents look**, and this file has never said so.

**What you inherit whether you want it or not.** A pack ships **nine JavaScript files and no CSS**.
The shell owns every typeface, size, colour and margin in the reader. The blocks (`h · p · note ·
blank · kv · t · q · form · art · docs`) are shapes and they transfer honestly — a key/value pair is a
key/value pair in any world. **Their styling does not transfer: it is Meridian's civic-form voice**,
uppercase monospace labels and all, and today a second world has no way to decline it.

**So the first thing to know about your documents is this:** if your world's paperwork is a recipe
book, a ship's log, a sticker album or a court filing, **the reader will make it look like a permit
office**, and no amount of work on the *content* of a page will change that. Plan for it:

1. **Design your surface somewhere you control** — a page, a mock, anything — *before* deciding your
   documents are wrong. The same content laid out properly usually is not wrong.
2. **Judge the two questions separately.** *"Can the engine's reader draw this?"* is answered by
   rendering in the reader and is genuinely worth knowing. *"Would the person this is for want to open
   it?"* is **never** answered there.
3. **Set your content the way its own world sets it.** Dot leaders and tabular quantities for a recipe;
   a case number and a date stamp for a filing. The blocks allow far more than the default styling
   suggests, and the specific convention is what makes a surface belong to your world rather than to
   Meridian's.
4. **Read the decisions already taken before you draw.** A day was lost drawing on cream paper for a
   world whose owner had chosen night three days earlier. The register is faster than the argument.

**If your world needs its own paper**, say so early and loudly: the seam does not exist yet, it is
costed in A15 as one stylesheet scoped to the reader, and **you will be the first pack to meet this
wall on your first afternoon.** *(Built 2026-09-16 — §1½ above. This paragraph is kept as written
because the shape of the problem is the point: a wall you meet on your first afternoon is worth
saying out loud before you meet it.)*

**And the second half of that method, which took another day to name.** Designing the surface
somewhere you control is only half a technique. The other half is **porting it back through the
seam** — the [cooking world] recipe pages were designed as a page, and then expressed as `PAPER` + reader
blocks, and *that round trip is why the fifth attempt worked when four attempts at the drawing had
not*. Neither half works alone: design in the reader and you are designing a form; design outside it
and never port back and you have a picture nobody can open.

## How a thing gets drawn here

*Added 2026-09-17 on the owner's instruction — "why dont we have beautify everywhere?" Everything
this project has learned about drawing lived in `docs/BEAUTIFY.md`, which is **Meridian's own**
register, full of Meridian's file names. A person building a second world reads THIS file and never
that one. These five are the ones that are true of any world, in the plainest words they fit into.*

**1 · A rectangle in the data is not a thing on the screen.**
When several drawings position themselves off one number and **nobody paints the number itself**,
every one of them is correct and the picture is wrong — and the fault is invisible in the code,
because each drawing reads right on its own. *Meridian declared two windows per facade, painted two
flat rectangles, and then hung a lit pane, a sugar skull and a stone ledge off the rect. All three
were in exactly the right place. There was no window. Four fixes argued about the size of the skull.*
**Grep who DRAWS a field before you tune anything that is placed by it.**

**2 · Grep every camera for a function's name before you believe the world has that fact.**
A height, a depth, a slope. `wellDepth` and `stairLift` returned the right answers for two versions
and only the 3D camera ever called them — so a stairwell was a flat floor with a chevron on it, and a
bridge was paint on the water. **The same rule as 1, with a number instead of a rect**, and it is the
fourth register entry on that one shape.

**3 · Draw a thing by the process that made it.** `.claude/skills/how-its-made` — load it before
drawing, modelling or texturing anything that was cooked, rolled, cut, cast, thrown, woven, welded,
printed, grown or assembled, and **always** when several of the same thing appear together. The rule
that fixes most of it: *variation enters at the step it actually entered, and nowhere earlier.* Six
slices of one roll are siblings, not strangers. And a made thing is made of made things — a carrot in
a roll was julienned, so it is not square.

**4 · Measure an accent against the ground it is painted on, not against the other accents.**
Doña Meche's shop emblem was 1.4 luma from the plaster it was painted on and was, in practice, not
there. A note in the map file defended the colour by comparing it to the other six emblems. **The
ground is what you can see it against.** Meridian's floor is 90 luma for an accent, 40 for two things
that must read as separate.

**5 · Render it and look, at 8×, before you tune anything.**
This one is embarrassing and it is the cheapest of the five. Four fixes to a sugar skull argued about
its size; one render at 8× said there was no window. If you are on the second attempt at a drawing
and somebody still says "off", **stop adjusting and take a picture of it.**

**And the one about people rather than pixels:** on the second attempt, say you cannot see the gap
and ask for a reference. *(Owner, 2026-09-16: "it still doesnt look right. how can you make something
you dont know what it looks like?" Three versions went out called "better". Eight photographs fixed
in one pass what three passes of reasoning had not.)*
