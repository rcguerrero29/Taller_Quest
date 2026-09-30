# The vocabulary — Toño's ledger

*Opened 2026-09-09 at the owner's word: "a new character persona who ensures all the tags for all
aspects of the stories, buildings and graphics can be reuseable for custom games — i guess this to be
more specific is an open world template."*

**This file is the register of the words**, not of the code. A tag — a tile `kind`, a glyph, a
chapter field, a seam name — is the joint between the shared `engine/` and a per-game content pack.
If the vocabulary is Meridian's, the template is a lie however good the engine is.

Read it before proposing any tag. Append to it whenever you find a word that does not travel,
**whether or not anyone is going to fix it today** — the register is the deliverable; a fix is a
ticket.

Everything below was verified against the code on 2026-09-09 by three agents working in parallel,
and the sharpest claims were re-checked by hand. Line numbers are as of that day.

---

## The two rules

They came from two people who never spoke to each other, about opposite halves of the problem, and
they turned out to be the same rule: **describe the mechanism, not the meaning.**

**1 · Name the geometry, not the noun** — for anything that gets drawn. It is a `kind` only if you
can finish this about every tile that will ever carry it, without using the object's name:

> *"This is a **box / billboard / floor paint**, it stands **N tiles** tall from its feet, it is
> **solid / walkable**, and it shows art on **four faces / two / one**."*

Four answers, one tag. If you cannot answer all four it is a **label**, not a kind — put it in a
different field, because `kind` is what the renderer obeys and a label it silently ignores.

**2 · Write it for a world with no lesson and no career** — for anything with words. Fill the field
in for a game about something else entirely. **If the honest value is blank, or a borrowed lie, the
tag is Meridian's word, not the template's.**

| Passes rule 2 | Fails rule 2 |
|---|---|
| `tags` · `chapter` · `need` · `late` · `season` · `ok/mid/bad` | `role` · `industry` · `concept` · `codex` |

**3 · One part, one name; one name, one part.** See *Collisions* below. This is not a style
complaint: it is why nobody can write a validator, a form, or a document that says what a tag *is*.

---

## The inventory

| Category | Defined in | Size |
|---|---|---|
| Solid glyphs | `engine/engine.js:48` `SOLID`, extended by pack `SOLIDX` | 17 + 24 Meridian + 5 town |
| Door glyphs | `engine/engine.js:51` `DOORSET` (default `"+ELO"`), pack `DOORS` | 4 / 9 / 8 |
| Tile `kind` | `engine/engine.js:1327–1355`, merged with pack `TILEMETA` at `:1356` | 16 |
| Tile flags | same block | `lift` `stand` `light` `win` `awn` `vary` `box` |
| Critter `kind` | `engine/engine.js:639–644` (+`1491`, `1590`) | 6, **closed** |
| Animal slots | `engine/engine.js:1684` `ANIDEF` | 4, **closed** |
| Dog commands | `engine/engine.js:4599–4612` | 5, **closed** |
| Decal `kind` | `engine/engine.js:1398–1403` | 2, **closed** |
| Decor `deco` | `DECODRAW` + pack `DECOART` | 2 + 8 |
| Fiesta prop `kind` | `content/meridian/config.js:147–152` | 3, **closed** |
| Portal `mark` | `engine/engine.js:2919` | 1 named |
| Chapter ids | `content/meridian/config.js:209–248` | 6 |
| World ids | `content/meridian/maps.js:3` | 12 |
| Answer grade `r` | `engine/engine.js:3174–3189` | `ok` `mid` `bad` |
| Hair `style` | `engine/engine.js:2426–2527` | 18 (a pack uses 7) |
| Doc `tmpl` | `content/meridian/docs.js` | 7 bare numbers, no registry |
| Doc block kinds | `engine/engine.js`, grep `function docRender` | 13 (`h p note red blank kv t q btn sel form docs art`) |
| Doc `art` modifiers | same block | `aspect` `wide` `cap` `grab` — `grab` added 2026-09-23, registered below |
| Pack seams | 40 `typeof X!=="undefined"` guards in `engine/engine.js` | see NEW-WORLD.md |

### What is genuinely reusable

Glyph→meaning really is data. `SOLIDX`, `DOORS`, `DOORLOOK`, `TILEMETA` (`lift`/`kind`/`win`/`awn`),
`MAPCOL`, `MAPDOT`, `TOWNLBL`, `TILEART`/`TILEART_SIDE`, `DECOART`, world ids, portal keys, NPC
letters, `PLACES`, `STOREPFX`, the `SEASONS` key set, `BUILDTPL` part ids, and the `ok/mid/bad`
grade. **The town proves it:** `changarrito/content/art.js:6` adds one glyph with a `TILEMETA` row
and no engine change at all.

---

## The leak register — tags that look universal and are not

*This is the part of the file that earns its keep. A second game breaks on exactly these.*

**2026-09-10 — the register stopped guessing.** Every leak L1–L15 was found by *reading code*, and
nobody had ever built a second game to check which one a real pack hits first. So one was built: five
tiles, two people, one room, booted against the unmodified engine, driven through a quest, and run
against the shared suite. **The order it hit them is not the order they were written in.**

| | |
|---|---|
| **Blocks a five-tile pack** | `L7` `L11` `L13` — and `L16`, which is hit *first* and was not on the register at all |
| **Annoys** | `L1` `L2` `L6` `L10` `L14` |
| **Never tripped at that size** | `L3` `L4` `L5` `L8` `L9` |
| **Already fixed, register was stale** | `L12` |

Three corrections came out of it, and they matter more than the ranking: **`L12` was fixed in the
engine and the register never said so**; **the fix is still forbidden by the shared suite**, which is
a failure mode this file had not seen — *a leak can be closed in the engine and stay shut by the
gate*; and **the first thing a new pack actually hits (`L16`) was unregistered**, because it lives in
a default rather than in a name.

### L1 · The engine carries Meridian's alphabet
`engine/engine.js:1329–1355` pre-assigns about **thirty glyphs** — `# B Q Z D K T A S H I W V F G C
X P J ~ ^ 1 ⊓ ≡ ▲ ▼ ◺ 3 4 5` — each with a kind, a height, window rectangles. A new game inherits
thirty opinions before writing a line.
**The file says so about itself.** Inside that block a comment explains that a hardcoded `"345"`
glyph list was removed from `engine3d.js` because *"engine code naming a pack's glyphs is the
portability law wearing a different hat"* — three lines above `"3"`, `"4"`, `"5"` being named in
engine code. The rule was seen, written down, applied once, and the surrounding table never held to
it. `test/smoke.js` scans for business and NPC names, not glyphs, so this passes CI today.

### L2 · The merge is a spread, not a replacement
`engine/engine.js:1356` — `TILES[g]={...(TILES[g]||{}),...m}`. A pack that redeclares a glyph the
engine pre-owns **inherits fields it never asked for**. Redeclare `C` as a facade and you keep
`stand:true, light:true` — a storefront you walk through and kick. Redeclare `B` as furniture and
`win:[[5,10,8,9],[19,10,8,9]]` rides along. No warning.

### L3 · Six enums are closed engine if-chains
Critter species, animal slots, dog commands, decal types, fiesta props, hair styles. They look like
data and are hardcoded branches. A new game gets butterflies and beagles or nothing — and
`beagle`/`lab`/`chi` exist because of one dog, `gato`/`colibri`/`loro` are Spanish words in engine
code.

### L4 · `ANIDEF` bakes Meridian's map into the engine
`engine/engine.js:1684` — `dog:{world:"hq",x:12,y:5}, cat:{world:"lc",x:16,y:9},
pig:{world:"st",x:4,y:1}, loro:{world:"st",x:17,y:5}`. World **ids and coordinates**, as engine
defaults. There is a pack seam (`ANIMALS`) to override it, which is not a defence: a new game
inherits Meridian's geography until it discovers it needs to.

### L5 · Five glyphs are known by literal
`⊓ ≡ ▲ ▼ ◺` appear about **29 times as string literals** across `engine.js` and `engine3d.js`.
`docs/NEW-WORLD.md:127` already admits this ("The engine owns five glyphs") — registered here so it
is counted, not re-discovered.

### L6 · `"N"` is the hardcoded NPC glyph
About 20 places in `engine/engine.js`. A pack cannot rename it. `"9"` (a doghouse) is likewise
hardcoded in engine walkability.

### L7 · Half the tile kinds do nothing
Eight drive geometry — `wall facade fence tree water bridge furniture appliance`. Seven are inert
labels no renderer reads — `prop marker site nature gear transit stair` — surviving only in
`test/engine.smoke.js`'s allow-list. `"site"` means *La Obra, the construction site*: Meridian's
noun in what claims to be a class. Stair geometry does not come from `kind:"stair"` at all; it comes
from the glyph literals of L5.

> **2026-09-29: `gear` has a reader now, and it is not a renderer.** The park dog's agility course is
> every `kind:"gear"` tile in the park's own map, in the order you read it (`engine/engine.js`, grep
> `function agilityCourse`). It replaced `const AGILITY`, three of Meridian's tile coordinates the
> engine carried, which sent every park's dog round Meridian's course whatever its park held; that
> was L4's class and was never on this register. So **deleting `kind:"gear"` from a tile takes that
> piece off the course**, and trimming this entry's list would take Meridian's dog off its own. Six
> inert kinds remain. Held by `test/engine.smoke.js` (grep `A PARK DOG RUNS THE COURSE`) and
> `test/smoke.js` (grep `out.agility`).

### L8 · `bridge` and `water` are one specific bridge and one specific river
`engine.js:1004–1011`, `1242–1255`, `engine3d.js:334–368` — the geometry is the rainbow bridge, and a
comment cites the owner asking for it. `kind:"water"` is floor paint, a blue rug: the mechanism for
real depth exists but is welded to the well glyphs. `light:true` on `C` means *the ball you kick*.

### L9 · Quests have no identifiers
They are **array indices**, everywhere: `CHAPTERS[].quests:[24,25…]`, `GROWTH.staged.quests:[12,13]`,
`wardrobeQuest:15`, `WNPC` `q:[24,28,30]`. Insert a quest in the middle and you renumber a world.
Meridian never noticed because its quest list is finished; a template's never is. **This is the
single largest blocker to an open-world template.**

### L10 · The town already fails the test, visibly
`changarrito/content/config.js:1–3` declares the pack *"trains no role, carries no curriculum and
awards no grade that means anything about the player."* `changarrito/content/strings.js:32` ships
`levels:["Junior","Delivery Lead","Senior Lead","AI LEGEND"]` and `:76` ships
`repL.roles:"Roles practiced"`. Meridian's career ladder, copied whole into a world that explicitly
disclaims having one. Nobody decided it; it rode along in a copied file. **The config is the true
side.**

### L11 · Retry-until-correct is compiled in
`engine.js:3195` completes a quest only when `o.r==="ok"`. An open world's choices are often
preferences, not answers. The only ungraded conversation today is `INTERVIEW`, which is not a quest
and pays nothing.

### L12 · `ENDLESS` is the district-advance switch, not a story flag — **HALF CLOSED 2026-09-10**

> **The engine half shipped and nobody updated this entry.** `chOpenDue()` (`engine/engine.js:311`,
> the city) and `chDue()` (`:312`, the ceremony) are split, and `chAdvance()` (`:315`) runs from the
> Next handler whether or not the world ends. The recommendation below — *split, not rename* — is
> exactly what was built. **Everything after this box describes the world before that fix**; the line
> numbers `:303` and `:3439` no longer point at anything. It is left standing rather than deleted
> because the reasoning is still the best statement of why the coupling was wrong.
>
> **The half still open is in the TEST, not the engine.** `test/engine.smoke.js:734` fails any pack
> declaring `ENDLESS` and `CHAPTERS` together. That assertion was correct while the two were one
> switch; after the split it forbids the exact configuration the engine was taught to handle, because
> `CHAPTERS` does double duty — it is both **the endings** and **the districts**, and a world that
> never ends may still have a second neighbourhood. **A leak can be fixed in the engine and stay shut
> by the gate**, which is a failure mode this register had not seen before and should now look for.
>
> Found by building a real two-district endless pack and pressing Next, not by reading — `chSeen`
> went 0→1 with no ending panel. It is measured, not inferred.

`engine/engine.js:303`, `:3439`, `changarrito/content/config.js:10`. It reads as "skip the epilogue."
It is not. `chDue()` returns false when `ENDLESS` is set, so the ending panel never opens — and
`$("endGo")`'s click handler is the **only** writer of `chSeen` in the engine. `chSeen` gates which
quests are on offer (`:291`), which storefronts are up (`ribbonUp`, `:305`) and `GROWTH` staging.
**An endless pack with two or more districts never opens the second, silently.** El Changarrito is
immune only because it declares no `CHAPTERS` and receives one synthesised district.
It is two settings wearing one coat — *"does an ending panel play"* and *"how does this world open
its next district"* — and the second has no tag at all. The recommendation on the register is to
**split, not rename**: `ENDING:false` for the panel, and give the advance its own trigger, which is
also what `docs/OWNER.md`'s *"a day may end, it may never close anything"* has been asking for.

### L13 · `flat` does not exist, and `water` is doing its job under a noun
`engine/engine3d.js:401` is the only path that renders a **solid tile with no standing geometry**,
and it is reached by `kind==="water"`. A pack wanting a flower bed, a plot, a puddle or a rug either
walks through it or gets a cardboard cutout (`:461`). The honest kind is `flat` — *drawn into the
ground plane, zero height, no standing geometry* — which is `water` with the noun taken out;
solidity keeps coming from `SOLIDX`, because **`kind` has never set walkability.**
Register the coupling too: `kind:"water"` triggers Meridian's marigold petal spill (`engine.js:585`,
`:1427`) and the bridge's orientation test (`:1005`), so `~` keeps `water` as an alias until those
move to a flag. That is the migration.

### L14 · `kind` does not decide walkability, and half the vocabulary assumes it does
`SOLID`/`SOLIDX` decides. `engine3d.js:399` skips every non-solid glyph **before `kind` is ever
read**. The renderer knows exactly five shapes — box (`wall`/`facade`), billboard panel (`fence`),
trunk-plus-canopy (`tree`), freestanding box (`box:true`, and only with a `TILEART_SIDE` drawing),
and floor paint (`water`) — and everything else falls through to a cardboard cutout. Anyone planning
by `kind` alone is planning against nothing. This is the mechanism behind L7 and the reason the seven
inert kinds went unnoticed for so long.

### L15 · A game cannot choose which cameras it has — **CLOSED 2026-09-10**
> **Built.** `CAMERAS` is a pack seam: a camera a game does not declare has no button and cannot be
> reached, even by a stale saved choice. **And the art half closed with it** — `TILEART` now takes
> `{top, side, crown, iso}` — and `mesh` since 2026-09-21, a list of primitives for the 3D camera — so a pack can draw its own tree, its own isometric view, and its own shapes.
> **A thing the engine builds itself is asked for by KIND through the same table** — `prop:ofrenda` (the season's altar; 2026-09-21), `prop:bridge` (what stands on a deck: the engine adds the pack's parts to its own deck and rails and never replaces them) and `prop:tram` (the trolley's body; the wheels and the driver stay the engine's) — crew iteration 11, 2026-09-21. A part with `a:` under 1 is glass, drawn as a second transparent mesh under the tile's.
> **Still open, deliberately:** Meridian's jacaranda is still the engine's *default* crown. The seam
> exists and nothing is forced through it yet; moving that drawing into the pack is step two, in
> `docs/ARCH-LOG.md` A5.
`engine/engine.js:575` — `const CAMS=["top","front","iso","3d"];` — **hardcoded in the engine.**
`CAMDEF` lets a pack pick its *default* camera (`:576`), and that is all: every pack ships all four,
and the button row offers all four whether or not the game wants them.

**The owner found this, 2026-09-09:** *"why do we have to lose the art for the isometric? cant it
switch out depending on the goal? maybe a game doesnt need 3d."* Both halves are right and they are
one fault.

A 2D-only game still ships the whole 3D renderer, still shows a ⛰ button, and still exposes ◆
isometric — which `docs/BEAUTIFY.md` records as losing about **90% of the art**: trees become a
brown box with three green circles glued on the top face, and the bridge, the playground props and
the doghouse **disappear entirely**. A pack has no way to say *"this game is played from above"* and
be spared all of it.

**The seam is two things, not one.** *Which cameras does this game offer* (a list, defaulting to all
four so nothing changes for either shipping game), and *what does this glyph look like in each*
(already half-solved — `TILEART` and `TILEART_SIDE` exist; there is no third for iso, which is
exactly why iso falls back to extruding a box and losing the drawing).

**Why it matters beyond tidiness:** it is the cheapest possible answer to "maybe a game does not need
3D." A pack that declares `top` and `front` only never pays for `engine3d.js`, never has an iso
button to be disappointed by, and never has to answer for art in a camera it does not use.

---

### L16 · `PLDEF` — the room roles fall back to Meridian's world ids, and a partial answer is worse than none
**Registered 2026-09-10. Found by MEASUREMENT: it is the FIRST thing a five-tile pack hits, before any
leak already on this register.**

`[CODE]` `const PLDEF={home:"hq",spawn:[10,11],street:"st",park:"pk",…,friends:["st","me","lc","lo"],
upstairs:"f2"}` (`engine/engine.js:37`), merged as `const PL=Object.assign({},PLDEF,PLACES||{})`
(`:39`).

The seam is real and it works. **The defaults are Meridian's**, and `Object.assign` merges
key-by-key, so a pack that declares the two roles it actually has —

    const PLACES={home:"room",spawn:[1,1]};

— silently inherits `street:"st"`, `park:"pk"`, `friends:["st","me","lc","lo"]` and `upstairs:"f2"`,
none of which exist in it. Measured: the shared suite fails immediately with *"PLACES.street names a
missing world st"* and *"no PLACES.friends world exists"*. **A pack that declares nothing at all is
in better shape than one that declares half**, which is the opposite of what a reader expects from a
table of optional settings.

**Why it is not caught by the portability guard:** `test/smoke.js:2225` deliberately exempts the line
matching `PLDEF=` / `ANIDEF=`, because those two tables are the one sanctioned home for a world id in
engine code. That exemption is correct. Its consequence — that Meridian's ids are the fallback for
every future game — is what was never written down.

**Why it matters more than it reads:** `docs/TAGS.md`'s own inventory lists `PLACES` under *"What is
genuinely reusable."* The **seam** is reusable. Its **defaults** are one town's proper nouns. This is
`L4` (`ANIDEF`) wearing a different name, and `L4` was registered while this one was not.

| Option | What it costs | Note |
|---|---|---|
| **Warn on a partial `PLACES`** ← *recommended* | small; one boot check naming the roles that fell back to a world the pack does not have | Turns a confusing suite failure into a sentence that says what to do |
| Empty defaults, every role required | a migration for both packs, and a longer first day for every new world | Honest, and hostile to the five-minute start |
| Fall back to `home` for every unset role | tiny | A world where the park and the street are the kitchen. Wrong, but never broken |
| Leave it | nothing | Every new pack's first hour is spent on an error about a town it has never heard of |

---

### L17 · The engine still names Meridian's career classes and its star dog
**Registered 2026-09-10. Both verified in live code, not comments.**

`[CODE]` `const SHIRTS={architect:"#E0A430",diplomat:"#8B5CF6",operator:"#2AA47C"}`
(`engine/engine.js:341`), read at `:3443`. Meridian's three career roles, with their colours, in the
shared engine. A pack whose people are not architects, diplomats and operators cannot rename them —
and the shell's character creator is keyed to the same three (`index.html:386-388`), so the town
carries them too, unused.

`[CODE]` `CRIT.find(c=>isDog(c)&&c.name==="Sonny")` (`engine/engine.js:4679`) — **the pack's star dog, by
name, in a conditional in the shared engine.** Not a comment. The paw menu's last-resort fallback.

**The part worth the entry:** `test/smoke.js:2204-2209` is a 38-name blocklist built exactly to catch
this, and it lists `chelo`, `nando`, `perla`, `pelusa`, `frijol` — and **not `sonny`**. The guard that
exists to stop one pack's names reaching the engine is missing the one name every player of this pack
meets first. `[TRAINING]` A blocklist is a list of the mistakes somebody already made; it can only ever be
as complete as yesterday. `docs/NEW-WORLD.md` §3 already says the honest fix is to make the scan
generic — *scan the pack for capitalised names and forbid them in `engine/`* — and this is the
evidence for doing it rather than adding a 39th word.

**The dog half, closed 2026-09-30 (#264, `mq-v204`).** The engine finds the star by `role:"star"` in
`CRITTERS` and names him from the pack's `DOGNAMES` pool; it never spells a name. `test/smoke.js` (grep
`the engine finds an animal by its role`) reads every name the pack gives an animal, and every name the
pool could give, off the page that ships, and fails the engine for spelling one in code — the generic
scan this entry asked for, for animals. **Planted 2026-09-30**, in a copy: the old name lookup put back
into the paw menu's fallback printed *"engine/engine.js:7019 names "Sonny" in code — the engine finds an
animal by its role, never by the name a pack gave it"*. It runs on every build. The career classes are
still open.

---

### L18 · A pack may not have more than 99 quests, and nothing says so
**Registered 2026-09-10.**

`[CODE]` `sanitizeSave` clamps every persisted quest index to **0–98** (`engine/engine.js:442`, `:445`,
`:452`) and keeps at most **64** `qa` keys (`:444`) and 64 `hd` entries (`:454`).

The clamps are right — they are the guard against a hand-edited or corrupted save — but the bound is a
**literal, undocumented, and lower than a real course**. A pack with 100 quests writes a save whose
hundredth quest is silently dropped on load: not an error, not a warning, a quietly shorter game.
Meridian has 56 and has never been near it.

It belongs on this register rather than in a bug list because it is a **template ceiling wearing a
sanitizer's clothes** — the number that decides how big a second world may be lives in a validation
helper, and the person who hits it will be reading their content files, not `sanitizeSave`.


## Collisions — one word, several jobs

| Word | How many meanings | Where |
|---|---|---|
| `kind` | **six** — tile class, critter species, decal type, fiesta prop, dog command, sign subtype | `engine.js:1329`, `:1839`, `:1398`, `config.js:148`, `:4599`, `changarrito/content/maps.js:192` |
| `mark` | **four** — portal direction, calavera accent colour, per-quest attempt tally, `kind:"marker"` | `maps.js:185`, `engine.js:2345`, `:261`, `:1338` |
| one district | **four names** — chapter id `mercado`, world id `me`, ribbon id `me`, DOCS key `mercado`, plus a 1-based `district:` number inferred from array position | `config.js:213/66/78`, `docs.js:119` |
| walkability | **three overlapping tags** — `SOLID`, `stand`, `standsUp`, plus `kind:"door"` duplicating `DOORSET` | `engine.js:1359–1360`, `:4882` |
| `box` | **three spellings of one geometry** — `m.box \|\| m.kind==="furniture" \|\| m.kind==="appliance"`, and the only one named for the geometry is the flag. `furniture` and `appliance` are Meridian's nouns for the same box and no renderer can tell them apart | `engine3d.js:241` |

---

## Gaps — what a new game needs and cannot say

- **An id on a quest** (L9). Everything else here is smaller than this one.
- **A tag a pack can invent** for a critter, decal, dog command, fiesta prop, or animal — all six are
  closed engine enums (L3).
- **Metadata on `deco`.** It has art but no height, no solidity, no kind — so decor never occludes
  correctly.
- **Tile kinds that do not exist:** a vehicle (the tram is hand-built boxes driven by `TRO`), a thing
  that hangs at a height (piñatas are welded to a seasonal seam), a thing you climb, a roof or
  ceiling, a liquid other than water, a window in a floor.
- **A cast vocabulary.** The town had to invent "named person / townsfolk / note / animal" in prose
  (`docs/story/el-changarrito.md` §1) because no field says what a person *is*.
- **A choice that sets world state.** The only thing an answer can change is index-keyed `GROWTH`.
  No flags: nothing can remember that you took the money.
- **Declared unlock relations.** Meridian's order lives in *prose* — Chelo phones Tacho inside a
  quest node. A second world needs the graph as data.
- **Ambient lines with a `when`.** `docs/STORY.md` open item 4 is filed as Meridian-only; with a
  second world it is a template blocker.
- ~~**A wall cannot say which of its windows a decoration leaves.**~~ **CLOSED 2026-09-17** — a
  `DECOS` row may carry `wins:[i,…]`, the indices of its glyph's `TILES.win` that survive whatever is
  painted on the tile; no `wins` leaves them all, `wins:[]` blanks the wall. One reader, `winsKept`,
  and three things go through it — the decor's own art, `propSill` (where a sill prop may stand), and
  the dusk lighting. Registered because it is the first time a *decoration* has been allowed to
  change what the *tile* is, and that is exactly the kind of power a second world will reach for.
  Bought by the owner's fifth report of the same bug: a sugar skull on a window a mural had painted
  over. See `docs/BEAUTIFY.md`, "The data was right for two years and nobody drew it".
- ~~**A pack cannot design its own paper.**~~ **CLOSED 2026-09-16** — `PAPER`, a string of CSS the
  engine re-roots at `.paper` and injects. It passes this file's standing test (*name the geometry,
  not the noun*) the only way a style seam can: **the pack names its own geometry and the engine
  names none of it.** The tag is registered here because a second world will look for it: it is
  optional, a pack that omits it gets today's behaviour exactly, and what it may touch is
  `docs/BOUNDARY.md`, "The paper seam", not prose. `ARCH-LOG.md` A15.
- **A named `tmpl`.** `"01"`–`"07"` are bare numbers with no registry.
- `STAKES.mode:"budget"` is a declared tag with **no implementation** (`config.js:45`).

---

## Contradictions found on the way, reported rather than absorbed

1. `docs/OWNER.md` says *"the engine may never name a pack's content."* L1, L4, L5 and L6 are the
   engine naming a pack's content. The rule is right; the code has not been held to it.
2. `docs/NEW-WORLD.md` §1's nine-file list is stale — the town has no `room.js` and adds `record.js`.
3. `docs/IDEAS.md` §15.25 declares three tile categories; the code has three *walkability* categories
   and **eight** *shape* behaviours, and no document states the second list. This file is now the
   first place it is written down.
4. `test/smoke.js`'s portability blocklist is still Meridian's proper nouns. **A vocabulary role
   cannot enforce anything until that scan is generic** — that is the first thing to build if this
   register is ever to become a test.

### L19 · A fixture standing beside a stop holds the vehicle forever

**The tag.** `still:true` on an NPC (`content/meridian/npcs.js:10`) means *this person does not
wander*. It is a perfectly portable tag and it is not the leak.

**The leak** is that `troAtStop` (`engine/engine.js:1190-1192`) sniffs a 3×3 block for a stop glyph
and asks *"is somebody at the stop"* — and the obvious generalisation, from the player to anyone,
silently turns every permanent fixture next to a stop into a passenger who never boards.

**The live case, which is why this is a register entry and not a hypothetical.** Doña Meche is
declared `still:true` at `ex` and her `m` stands at column 21 row 3 (`content/meridian/maps.js:67`) —
**diagonally adjacent to the only `ex` stop at (20,2), permanently.** The day anyone widens that sniff
beyond the player, she holds the tram on every pass for the rest of the game, and the symptom is *"the
trolley is broken"*, not *"the tamale lady is standing too close."*

**Found by** Rigo, 2026-09-11, grounding the boarding job — not by running anything, by knowing that
a stop is a place and asking who is standing at it.

**The rule.** **Only the player is a passenger.** A second world that puts a bench, a vendor, a
statue or a sleeping dog beside a transit tile hits this the same way; nothing in the vocabulary
distinguishes *waiting here* from *living here*, and the two look identical to a 3×3 scan. Any engine
question of the form *"is somebody at X"* must say which somebodies count, in the code, at the point
it asks.

### L20 · The engine guards the transit **brand** and not the transit **glyph** — **CLOSED 2026-09-11**

> **Closed by the `stops` seam.** Both mechanism sites moved together, as this entry demanded: the
> stop query and the travel-panel trigger now read `troIsStop`, which reads what the line *declares*
> rather than what the map *paints*. The three art/mural sites stay and are L1's, not this entry's.
> **And the citations below had all slid again by the time it was closed** — a register that cites
> line numbers rots faster than the code it cites. Grep the identifier.


**The guard that exists.** `test/smoke.js:3283-3288` fails the build if `\bMQT\b` appears in
`engine/engine.js` or `engine/engine3d.js`, with the message *"a pack name in engine code is the one
thing the portability law forbids."* It is a good guard. It passes.

**The thing it cannot see.** `"Y"` — Meridian's stop glyph, declared by the pack at
`content/meridian/art.js:198` — appears in `engine/engine.js` **five times**: `:706` (isometric
colour), `:1216` (`troAtStop`, *where the vehicle serves*), `:2982` (stepping here opens the travel
panel), `:4400` (`BASECOL`), `:4601` (a mural may not paint here). Nothing objects. **Three lines
below a comment in the same test saying a hardcoded pack glyph list was deleted because engine code
naming a pack's glyphs is the portability law wearing a different hat.**

**This is the fourth time in this repository.** `docs/REGRESSION.md` R8 read *what `index.html`
loads* when it meant *what we publish*; the mutant net read source with comments stripped when it
meant *every line*; the version test asked whether two strings were **equal** when what mattered was
that one **moved**. Now the portability guard reads a **name** when it means a **glyph**. Same shape,
fourth instance, and the rule bought with the last one is at the top of `REGRESSION.md`: **a guard has
to read the noun it actually means.**

**What a second game hits.** Its own stop glyph does nothing — no braking, no travel panel, no
colour — while its map's `Y`s, whatever they mean in its alphabet, come out red, are protected from
murals, and open a menu it never declared.

**The fix, and the part of it that is not negotiable.** Two of the five sites are **mechanism** and
they are *the same fact said twice*: `:1191` asks where the vehicle serves, `:2890` asks where the
pass opens. **They move to the seam together or not at all** — splitting them ships an engine that
locates a stop one way for the tram and another way for the panel, which is two names for one part
created deliberately inside the change whose whole purpose is to stop having two. `:679` and `:4300`
are art and are already L1. `:4501` is the interesting leftover: after this change it is the only
trolley-shaped `Y` left in the engine **and it is not trolley-shaped at all** — it is a mural rule
wearing a transit glyph, and it wants a `protect:true` flag in the tile, not a letter.

**And the tag on the tile fails rule 1.** `"Y":{lift:13,kind:"transit",stand:true}`. Run it out loud:
it is a **billboard**, it stands **1.3 tiles**, it is **walkable**, it shows art on **two faces**
(`art.js:107`, `:166`). Four clean geometry answers and not one of them is the word *transit*.
`kind:"transit"` has **zero readers in the repository** — verified by grep, the declaration is its
only occurrence. L7 predicted it; it is now confirmed live. **It is not a kind, it is a label**, and
it should not survive the change that gives the stop a real home.

**Found by** Toño, 2026-09-11, on the gap analysis the owner asked for by name.

### L21 · One world, one line — `.find()` is the ceiling, and three dead words are inside it

**`engine/engine.js:1152`** — `const L=TROLLEYAT.find(r=>r.world===(wid||world))`. **A pack that
declares two lines in one world silently loses the second.** No error, no warning. And `TROLLEYAT`
entries carry no `id`, so nothing anywhere can refer to a line in order to complain about it.

Dead vocabulary found in the same block, all verified by grep:

- **`troCall()` (`engine/engine.js:1167`) has zero callers in the entire repository** — its own
  definition is its only occurrence. Summoning happens inline at `:1171`. **The verb the owner asked
  for by name** (`docs/ASKS.md:52`, *"or if i call it"*) **exists as an unreachable function.**
- **`TRO.said` (`:1151`)** is declared and never read.
- **`kind:"transit"`** — see L20.

And `TROLLEYAT` is **absent from `docs/NEW-WORLD.md`'s optional-seam list** while `TRV` is on it: a
new world is told about the menu and not about the line.

**The related collision, four lines apart in one file:** `TROLLEYAT` uses `world`
(`content/meridian/maps.js:281`) and `TRV` uses `w` (`:282`). One part, two names. `world` is the
name that keeps.

### L22 · `TRO_LEN` is not merely undeclared — it is unrepresentable

Three of the four trolley constants (`TRO_SPEED`, `TRO_EVERY`, `TRO_HOLD`, `engine/engine.js:1150`)
are engine-wide values a pack cannot set; a second world's tram runs at Meridian's speed on
Meridian's headway. That is an ordinary seam gap.

**`TRO_LEN` is worse in kind.** It is read at **mesh build time**, inside `if(!T3.tram)` —
`engine/engine3d.js:601` `BoxGeometry(TRO_LEN-0.1-CAB*2,…)`, `:603` `(TRO_LEN-0.06,…)`, `:605`
`(TRO_LEN-0.02,…)`, plus `:619` and `:637`. The geometry is baked once and cached. **So a second
length is not undeclared, it is unrepresentable without rebuilding the mesh** — a distinction no
amount of asking a second pack would ever have surfaced, because the town declares no tram at all.

**Which is the register's own lesson this round:** the town can answer **yes**, **no**, or **nothing
at all**, and *silence is not a pass.* A tag the town never declares has not been tested by the town;
it has been skipped by it. Say **untested**, not *travels*.

### L23 · A pack may hand `syncChill` the whole cast, and cannot change anybody already standing

*Added 2026-09-13 from Beto's run; the mechanism re-verified against the code 2026-09-14.*

`syncChill` takes the entire desired set as data (`engine/engine.js`, grep `function syncChill`) and
reads like a declarative API: hand it the cast, it makes the world match. **It does not.** `addChill`
bakes `NPCLOOK[key]=c.look` **once** (grep `NPCLOOK[key]=c.look`), along with the name (`CHILLN[key]`)
and the egg (`CHILLEGG[key]`), and `syncChill` returns early for any body already standing on its tile
(grep `if(here&&c&&c.world===at.world`). So **`look`, `name` and `egg` are write-once per id.** Only
the fields a pack decorates itself afterwards are live: El Changarrito re-writes `doc`, `tier` and
`issue` on every `place()` (`changarrito/content/record.js`, grep `n.doc=this.doc(i)`), which is
exactly why a document change lands on a person already standing and a shirt change does not.

**What a second pack hits.** Any state it wants to *show* on a person — claimed, sick, on shift,
holding something — must be **part of the id**, or the world is right after a reload and wrong for the
whole session. El Changarrito pays this in `bodyId` (`changarrito/content/record.js`, grep
`bodyId(i,slot)`), which concatenates the claim into the id so `syncChill` sends the old body home and
spawns a new one on the same tile.

**Untested by Meridian, but not for the reason first written.** Meridian *does* declare a chill cast —
`const CHILL=[…]` in `content/meridian/npcs.js` (Yola la paletera) — and the engine places it once at
boot (grep `.forEach(c=>addChill(c))`). What Meridian never does is call `syncChill`: it never asks a
person already standing to become different. **Silence here is still not a pass**, and the first draft
of this entry said "Meridian declares no chill cast at all", which is false — corrected here rather
than quietly, per `docs/SOURCES.md` rule 5.

**Measured, not inferred, 2026-09-13:** place the same issue twice, the second time with
`taken: beto` — `{"pattern":null,"sameKey":true}`.


---

## Leak register · near-miss, 2026-09-13 — **a crew persona, caught at plan time**

**Proposed:** make Meridian's tram driver *Rigo the tranviario* — the `changarrito` crew persona,
forty-one years on the trolleys, nine as line inspector.

**Refused before a file was touched**, by Nacho, on the rule in `CLAUDE.md`: Meridian's content is
never edited for another world's sake. **Never written. Zero occurrences in `engine/`; four in
`content/meridian/`, all of them Don Tacho's cousin, who is a different man and nine days older.**

**Logged here and NOT in `docs/QA-PASS.md`.** That file's escape register is for what reached the
owner; this reached nobody. Putting a near-miss in a register of escapes is a false entry, and a
register that cries wolf stops being read.

> **The rule this near-miss actually establishes, and it is the useful part:
> THE NAME IS NOT THE LEAK. A BIOGRAPHY IS.**
> Eight of the nineteen crew personas share a name with a shipped Meridian NPC — *because they were
> named after the cast*, not the reverse. Name overlap between the crew and the city is the house
> pattern. What may never cross is a persona's **history**: Rigo's forty-one years, Melo's bicycle,
> Chema's negatives. Those belong on the wall that records how we work.
>
> **Check before you call one a leak:** `grep -rnw "<Name>" content/ engine/` — word-boundary and
> case-sensitive. `grep -i` on a short name matches inside other words; the first run of this very
> check was finding **"marigold"**. See `docs/POSTMORTEM.md` §11½.

### L24 · The exporter is one dog's care sheet, and the engine's export schema says "meridian"
**Registered 2026-09-14 by Toño, verifying the brief for the eating-habits game (filed by the
session from his return, `docs/meetings/2026-09-14-cooking-world-disena.md`). Extends L17 — same
shape, two more instances, and this one reaches the player's files.**

`[CODE]` `treats` and `fredQ` are **engine globals** (`engine/engine.js:437`), persisted as save keys
`tr` and `fq` (`:503`), clamped in `sanitizeSave` (`:553`). `exportData()` emits
`schema:"meridian-export-v1"` (`:4684`) and a top-level key
`frederick:{name:"Frederick",treats,bandana:fredQ>=2,carePackUnlocked:fredQ>=1}` (`:4688`).
`icsData()` (`:4706`) emits **exactly five events** on fixed RRULEs, stamps every one
`UID:mq-care-<i>@meridian-quest` (`:4716`), and the download is named `…-care-reminders.ics`
(`:4753`). The tab is gated `$("exTabCare").hidden=fredQ<1` (`:4735`) — a Meridian quest counter
deciding whether an engine UI exists.

**What a second game hits.** A pack that wants reminders — *"Sunday, soak the beans"*, seven
dinners, [a cooking day] — gets one pet's five-row schedule it cannot change, gated behind a quest it
does not have, and every calendar entry it hands the player is stamped with another game's name. Its
JSON export claims to be a Meridian export.

**Why the guard does not see it.** `test/smoke.js:2228-2232` is the 39-name portability blocklist.
It contains `chelo`, `frijol`, `pelusa`, `bolillo` — and **neither `frederick` nor `meridian`**, the
pack's own folder name, which appears in engine code eleven times. L17 found the list missing
`sonny`; this is the same list missing the game. **A blocklist is a list of yesterday's mistakes** —
`docs/NEW-WORLD.md` §3's generic scan is the fix, and this is the second piece of evidence for it.

### L25 · A pack cannot put anything in the save, and the pass carries nothing a pack wrote
**Registered 2026-09-14. Extends L18, which found the 99-quest clamp in the same function and
stopped there. This is the larger half.**

`[CODE]` `save()` writes a **fixed twenty-key blob** (`engine/engine.js:503`). `sanitizeSave()` does
not filter a save — it **rebuilds one**, returning an object literal with exactly those twenty named
keys (`:553-563`), and `loadSave()` (`:565`) runs *every* local load through it. So a key a pack adds
is not merely unvalidated: **it is dropped on the next load, silently.** Two of the twenty (`wr`,
`wc`) are the dog's three cosmetic slots.

`passURL()` (`:4881`) serialises `{v:1,l:lang,s:loadSave()}` — **the engine's save and nothing
else.** Everything a pack persists goes through `SK()` (`:13`) into its own key, as the town does
(`changarrito/content/record.js:113`, `:494`, `SK("filter")`), and therefore **never crosses the
Trolley Pass, never appears in the export, and is never sanitised on arrival.** `SK("room")` — the
INTERVIEW answers, which `docs/OWNER.md` calls the design conversation with [partner] — is in that category
today.

**What a second game hits.** A pantry, a week's meal plan and a cookbook *are* an eating game's
save. All three land outside the save, outside the pass and outside the export, and the player who
scans the QR onto their second phone arrives with their character and without their kitchen. **The
gap is one seam: a pack-declared slot, sanitised by a schema the pack supplies** — G1 in
`docs/cooking-world.md` §5.

### L26 · The engine does not only name Meridian's alphabet — it draws Meridian's kitchen
**Registered 2026-09-14. L1 registered the metadata table; nobody registered the pictures.**

`[CODE]` `TILESIDE` (`engine/engine.js:1650`) holds engine-side profile drawings for Meridian's
glyphs, and four of them are the four objects a kitchen is made of: `TILESIDE["T"]` a restaurant
table with gingham and plates (`:1651`), `TILESIDE["S"]` shelving (`:1672`), `TILESIDE["K"]` a
counter *with a coffee machine on every third tile* (`:1683`), `TILESIDE["V"]` **a stove — burners,
knobs, an oven window** (`:1802`). `sideArt=g=>TILESIDE[g]||TILEDRAW[g]` (`:1836`) prefers the
engine's drawing; a pack reaches it only by overriding the same letter, which then trips L2 (the
merge is a spread, so `V` keeps `lift:8, kind:"appliance"`).

**What a second game hits.** A cooking pack inherits somebody else's stove, counter, shelf and table
before it draws anything — and they are drawn well enough that nobody notices they were never
chosen. **This is the most expensive instance of L1 precisely because it is the most useful one.**

### L27 · The index and the search are the town's, not the engine's
**Registered 2026-09-14, against a brief that called them an engine capability.**

`[CODE]` The engine supplies **widgets**: a dropdown with option groups (`s2.sel`,
`engine/engine.js:3475`), a form (`s2.form`, `:3485`), a table (`s2.t`, `:3457`). The **index** —
categories, tag search, sort, persistence, plain-language hits — is ~500 lines of *pack* code in
`changarrito/content/record.js` (`search` `:96`, `indexDoc()` `:248`, `setFilter/setSort`
`:492-497`). `tlFindNext` (`engine/engine.js:4592`) is find-in-a-textarea in the admin text lab, not
a search over content.

**What a second game hits.** "Find my recipe with beans" is not a seam it turns on; it is a thing it
writes again from scratch. Say **"a dropdown and one town's implementation"**, never "we have
search".

### L28 · `concept` is the rule-2 failure that lives in ENGINE code — and an eating game would entrench it
**Registered 2026-09-14, pre-emptively, which is the only time this entry is worth anything.**

`[CODE]` this file's own rule-2 table lists `concept` as failing. It is read in engine code at
`:3356`, `:3390`, `:3469`, `:3841`, `:4610`, `:4613`, and the decision report's *Concepts* section is
built out of it (`:4674`, `:4677`). It is not a pack field the engine ignores; it is load-bearing.

**The trap, and it is specific.** A nutrition game *has* concepts — nixtamalization,
*ichijū-sansai*, the *sa-shi-su-se-so* order. It would be **the first pack to make the word look
correct**, and that is exactly how a curriculum word becomes a template word with nobody deciding it.
The reusable field under it is *"the named thing this moment taught"*, which is blank in a game with
no lesson. **Register the entrenchment before it happens, because after it happens there are two
packs' worth of content behind it.**

### Amendment to L3 — it is SEVEN closed enums, not six
`[CODE]` `WEAR={bandana:[…],collar:[…],cape:[…]}` (`engine/engine.js:448`) — three fixed cosmetic
slots with **literal colour arrays in engine code**, read by the swatch builder (`:4858`), mirrored by
engine globals `wear`/`wearCat` (`:451`, `:452`), and written into the save contract by `wearIn`
inside `sanitizeSave`. It is not an owned-things seam and it must not be described as one: a pack
cannot add a slot, rename one, or change a colour. *(Toño, 2026-09-14.)*

**And one row for the Gaps list, filed here because that list is a table of its own date:** *a
clickable source on a document.* `docRender` has no `<a>`; the reader can show a note saying where a
claim came from and cannot let the player open it. Directly the owner's *"places to check about this
facts so we know where you get the info."*
