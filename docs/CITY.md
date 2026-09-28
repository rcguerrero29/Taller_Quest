# The City Ledger 🏗️

Don Güero's single source of truth. **Read `docs/OWNER.md` first** — the owner's
standing rules; anything Settled there is a permit, not a question. The `/don-guero` skill reads this, plans the
next phase on Opus 5, and brings open decisions to the owner as side quests. Every
signed decision gets logged here — a recorded decision is a permit, not a suggestion.

**Phase: 2.5 — la obra de albañilería (construction standard)** · Ledger · *deployed version: see `CACHE` in `sw.js`, which is the source of truth*

*(Corrected 2026-09-04. This line read "Phase: 2 — Taller Herrera … NOT built" while the
growth history below recorded all four parcels written and wired at `mq-v51` and the deployed
pin was `mq-v61`. The words "NOT built" were load-bearing and false: anyone planning from
this header would have planned a city that already exists.)*
opened 2026-08-30. **Deployed: `mq-v61` on `main`, 2026-09-03** (the four parcels written and wired at v51; six playtest fixes at v52 — IDEAS §15.13).

## Purpose

The city is a career gym. Every new business is **Hispanic-owned** and doubles as a
**practice pack for an AI role**:
AI implementation lead · AI product manager · AI solutions/prompt engineer ·
automation consultant · AI ops analyst. Quests = that industry's real AI judgment
calls, in the game's codex style (bilingual EN/ES, retry-until-correct).

## Districts (built)

| District | Map | What's there |
|---|---|---|
| Meridian Labs HQ + Floor 2 | `hq`, `f2` | The office. 8 quest NPCs, Frederick. |
| Calle Principal | `st` | La Cocina storefronts, La Obra site → **finished Studio** (`lo`), trolley west terminus, jacarandas, flower beds. |
| La Cocina | `lc` | Doña Rosa's restaurant. 2 quests, Canela. |
| The Studio | `lo` | Xochi's design studio (unlocks after La Obra quests). |
| Calle Dos | `ex` | Construction crew pen (Beto, Kike, Mari), Yola's cart, canal trees, street cat, trolley east terminus. |
| El Mercado Robles | `me` | Doña Chelo's abarrotes on the st SW lot. 8 AI-PM quests (16-23), 4 NPCs, Frijol the bodega cat. |
| Taller Herrera | `ta` | Tacho's shop off Calle Principal. AI-ops practice. Written and wired `mq-v51`. |
| Panadería La Espiga | `pa` | Licha's bakery off Calle Dos. Forecasting and drift. Written and wired `mq-v51`. |
| Limpieza Velázquez | `li` | Chente's crew off Calle Dos. Adoption and rollout. Written and wired `mq-v51`. |
| Nolasco Tax & Notario | `no` | Bere and the licenciado, upstairs off the avenue. Scope and refusal. Written and wired `mq-v51`. |

*(Rows added 2026-09-04. The table ended at El Mercado while four more districts were written,
wired and deployed; "Opens Monday of Week Two" was also left over from before weeks were
retired. **None of the four has ever been human-played** — that is the open gate, not the wiring.)*

## Open parcels

*(Corrected 2026-09-05, Don Güero. Three of the four entries below described lots that were
developed at `mq-v51` and are in `maps.js` today — a planner reading this list would have built
on top of a business that already exists.)*

- ~~**st southwest lot**~~ — **built 2026-08-31**: El Mercado Robles.
- ~~**st southeast lot**~~ — **built 2026-09-02**: Taller Herrera (ribbon on row 13, x18–28).
- ~~**Calle Dos frontage, `ex` row 0**~~ — **built 2026-09-02**: La Espiga (x4–8) and Limpieza
  Velázquez (x10–14). ~~A short gap remains at x15–23.~~ Corrected 2026-09-07 (Nacho's read): x15 and
  x20 are jacarandas, Yola the paletera stands at (17,0) and the season hangs the piñata at (18,0) — that
  corner is hers, not a lot. **x21–23 built 2026-09-07 (`mq-v105`): Barbería El Espejo**, Naye's chair
  (3 wide, the door at (22,0) onto the trolley bed). Nothing open remains on the north frontage.
- **`ex` row 10 — the south map fence**, entered from the lane at row 9. The largest
  *(It said "the canal-side south frontage" until 2026-09-22. It is not canal-side; it is the
  farthest row from the water. The correction was written into the ❗El camino leftovers entry
  below on 2026-09-08 and never applied to THIS list, which is the one a planner actually reads —
  so for two weeks the ledger offered a waterfront lot that does not exist. Found by Don Güero,
  2026-09-22, who planned no lot that session and so was not caught by it.)*
  genuinely open parcel left. (The old entry said "rows 0/9"; row 9 is the *street*, not a lot.)
  ⏳ ❗El solar.
- **`st` row 15 — the south fence line**, entered from row 14 between the jacarandas.
- **New maps** — the engine takes new worlds as data (`WORLD_DEFS` + portal); a
  bigger business can be its own interior, like La Cocina.

## Growth history

- 2026-08-31 — Hearts stopped wiping the city (owner ask): zero hearts now ends the
  chapter instead of the run, restart moved to Settings behind a confirm, and the
  save is never deleted out from under a player.
- 2026-08-31 — Replay fixed (owner ask): the city is now a pure function of progress.
  "New game +" rewinds Calle Principal to its shipped map and rebuilds only what the
  run has earned — no Studio you did not raise, Lupe back at her post. Predates
  Phase 1; El Mercado made it visible.
- 2026-08-31 — **Phase 1 built**: El Mercado Robles opened on the SW lot (`me` interior,
  storefront ribbon, Chelo/Nando/Perla/Chava + Frijol), 8 AI-PM quests EN+ES (16-23,
  5 needed to close), chapters became data, the Week Two handover shipped, the
  decision-report export landed, and the DOORS/TOWNLBL/MAPDOT/MAPCOL/SOLIDX seam moved
  the city's buildings out of the engine. MAXXP 230 → 350, sw `mq-v17`.
- 2026-08-30 — La Obra completed: two-stage construction (quests 12+13) raised the
  Studio; Lupe moved streetside; Xochi's quest + wardrobe opened.
- 2026-08-30 — Nature pass: jacarandas, flower beds, grass, butterflies, colibrí,
  street cat; themes now reach the world; ambient particles.
- 2026-08-30 — Townsfolk: Nacho (muralist) and Yola (paletera) moved in; owner can
  create up to 12 chill characters (admin 🧍); 39 name eggs live.

## Growth history (append)

- 2026-09-02 — **The room upstairs (S2 v1)**: Floor 2 relaid bare; the room-interview
  seam (`INTERVIEW` in `content/meridian/room.js`, read by the engine as shapes only);
  Nacho moved upstairs; the ❗ rule extended to "has something to say" in every camera;
  Export gained *The room*; the version on the opening page. Shipped with S0 at `mq-v46`.
- 2026-09-02 — **La ventana del norte**: `f2` got its window. Three panes of a new `|`
  glyph in `f2` row 0 above the old lead's desk, declared pack-side in the FIRST
  `content/meridian/art.js` (TILEART + TILEMETA + SOLIDX + MAPCOL) — no engine change for
  the tile, and a pack that ships no art.js gets no window. The pane looks north: the back
  lot, the road out of the barrio and the graded line on the horizon — Barrio Norte stays
  a promise you can now SEE. Sky takes the season through `art()`. Güero's `window` step
  stopped promising and started asking what you want framed, and its "the street" option
  — impossible on a north wall — was replaced. "Who is the room for" opens his form. On
  the branch at `mq-v47`.
- 2026-09-02 — **La mudanza (`f2` a medio mudar)**: the office stopped opening bare.
  Four taped moving boxes (`□`, the pack's SECOND glyph, `content/meridian/art.js` — one
  drawing, two silhouettes by tile parity), one of Don Güero's cones (`C`) and a plant
  still in its pot (`P`). The desk, the stairs and the three panes never moved. The sight
  line from the stairs to the window stays clear (Nacho's "nothing in the way" is an
  answer a player can pick, so it has to be true), the arrival tile (17,11) stays clear,
  and every walkable tile stays reachable. Owner: *"i think for the move it should be
  mid and we can have don guero provide estimates and possible furniture to furnish"* —
  the furniture catalogue with per-piece estimates is `docs/BACKLOG.md` §6.
- 2026-09-02 — **Se acabó el tope**: the city stopped stopping at one storefront and
  the record stopped forgetting. `GROWTH.ribbons[]` with a shim so the singular `ribbon`
  still works, each storefront carrying its own `doorstep`; and the play log keeps EVERY
  decision instead of its last 200. Owner: *"I thought we fixed this 200 entries thing
  and not stopping at a certain amount of store fronts"* — it was not fixed when they
  said it; it is now. Both under test.
- 2026-09-02 — **Muebles de frente**: the front and 3D cameras stop standing top-down art
  up like cardboard signs. `TILESIDE` holds a second drawing per prop for the cameras that
  see it standing (table, counter with a coffee machine every third tile, stove), the
  barricade `G` is an orange board with white stripes instead of a ladder, and every door
  in 3D wears a light frame with a bigger pool of light under it. Owner's report:
  "hard to see some doors" and "the table and fences and the coffee machine". IDEAS §15.11.
- 2026-08-31 — **World upgrade wave 1**: draw() tile chain became the TILEDRAW
  registry (28 glyphs + doors as data; content packs override via TILEART) — the
  entities-as-data law now covers ART. Visible: per-tile floor variation, walls cast
  shadows, walk-cycle arm swing, per-person blinking, doors glow underneath. Plus:
  /nacho story director, tune picker, NPC activity emotes, NPC edit panel.

- 2026-09-01 — **The open city SHIPPED, and the story caught up with it.** `qOpen`
  had `c>=chSeen`, which closed every district behind the player; it is now `c<=chSeen`
  — districts open and stay open, forever. `need` for the first district dropped 16→12
  so its last visit plays with quests still on the board. 24 `late` reframe lines (EN+ES)
  give a neighbour one line when you answer them long after. Nine continuity breaks
  fixed; nine strings rewritten (the three "Roll credits" and the intro card that
  threatened a reset that cannot happen). **`GROWTH` moved Meridian's names OUT of the
  engine** — quests 12/13 raising La Obra, quest 15 opening the wardrobe and "district 1
  is El Mercado" were all hardcoded, so [partner]'s pack would have inherited them; a smoke
  guard now fails the build if any content name reappears in `engine/`. 3D is the
  default camera; movement follows the camera when you rotate (it never consulted it
  before); the mercado's produce is identifiable; the ticker keeps two messages.
  Three test tools now exist: `smoke.js`, `shots.js` (scene screenshots) and
  `tilesheet.js` (**the cold read** — every tile alone, labelled only by its glyph).

- 2026-09-01 — **Phase 2 parcel planned: Taller Herrera**, `st` southeast lot. Ribbon
  row 13 x18-28 with a roll-up door `%` at x23, apron props on row 14 (Tacho's Caprice
  at x19, tires at x25 — positions forced by the reachability audit, not taste).
  Interior `ta` 20x12: three lift bays, a parts wall, Yesenia's counter two steps inside
  the door, the office nook, a waiting corner. Cast `t`/`y`/`m`, Tuerca moved in from
  Calle Dos. Quests 24-31, `need` 5, role: automation / solutions consultant. Seven new
  glyphs (`= % 6 7 8 0 i`), all pack-side in a NEW `content/meridian/art.js` — the first
  real use of the TILEART/TILEMETA seam.

- 2026-09-02 — **Las cuatro puertas: all four parcels written and wired.** The four lots
  Don Güero laid in the morning carry their packs by night: 32 quests (24-55) EN+ES in the
  mercado's shape, `need` 5 each, 120 XP a pack (`MAXXP` 350 → 830). CHAPTERS declares
  `taller`, `espiga`, `velazquez`, `nolasco` with their own three endings, burnout and
  next-lot toast (`tepi`/`eepi`/`vepi`/`nepi`, `*goEpi`, `espigaToast` …); the mercado's
  last visit now announces the taller instead of the placeholder "city is yours" line.
  Stations: Tacho 24/28/30, Yesenia 27/29/31, Moy 25/26 · Licha 32/36/39, Sol 33/35/38,
  Tito 34/37 · Vero 40/44/45/47, Chente 41/43/46, Karla 42 · Nolasco 48/50/52/55, Bere
  49/51/53/54. ❗El recado (two taller quests played off the lot) is NOT built — every quest
  stands at its own person's station; a second station for a person elsewhere is the seam,
  priced later. `industry:` is built beside `role:`; the report prints *industry · role*.
  The cats took Nacho's names (Bolillo, Pelusa, Timbre). Templates 06 and 07 written,
  01 and 04 assigned. The smoke test now fails a district whose last visit is missing a
  string in either language.

### Verified 2026-09-04 — a walkable tile could never be drawn standing

The front camera (`engine.js`) and the 3D ground bake (`engine3d.js`) painted every non-solid
tile with its **top-down** art flat on the floor, and the iso depth pass skipped it entirely. So
anything walkable that should have height — a stair, a ramp, a low platform, a kerb — had no path
at all, and `IZH["1"]=10` sat being read by nothing. **Partly closed the same day** by a third
tile category (`stand:true`, IDEAS §15.25): a walkable tile that is an object, drawn standing
from a profile drawing. What is still open is genuine elevation (§15.10) — walking *up* a flight
in view, rooftops, the fire escape. A portal stair does not need it, because it is only ever
seen from the side.

## ⚠️ THE CEILING — the roadmap promises four more businesses; the code holds two

**AMENDED 2026-09-02: the code now holds six districts.** Every item below that
blocked a third district is struck; what remains (a grade the world can read, the tile
alphabet) shapes what a pack may promise, not whether it can exist.

Verified in the engine on 2026-09-01, not inferred. The ledger's "one business per
phase, Phases 2-5" cannot run as written until three things generalize:

- ~~**`finish()` has exactly two epilogue sets.**~~ **Lifted 2026-09-02:** a district declares
  `epi`/`go`/`open` in CHAPTERS; the old two-set rule is the fallback. Was `engine/engine.js:2000` —
  `const E=last?[t.mepi1,t.mepi2,t.mepi3]:[t.epi1,t.epi2,t.epi3]`. Add a third district
  and the taller prints the mercado's ending while the mercado prints Week One's.
  → every district declares its own `epi:[k3,k2,k1]` and `open:"<toastKey>"`.
- ~~**The handover doorstep is hardcoded to the mercado's front step.**~~ **Lifted 2026-09-02:**
  each ribbon declares its `doorstep`; the engine walks you nowhere of its own choosing.
- ~~**`GROWTH.ribbon` is singular.**~~ **Lifted 2026-09-02:** `ribbons[]`, one per storefront,
  each rising on its own district, with the `g.ribbons||(g.ribbon?[g.ribbon]:[])` shim so
  [partner]'s pack and older declarations keep working. The record's 200-entry cap went the same day.
- **STILL OPEN, new (Don Güero, 2026-09-02):** the town plan's `flags` carry ONE boolean for
  all storefronts, so a second lot cannot have its own label until each storefront carries
  an `id`. A sixteenth of a sitting. Anchor by the function, not the line — they drift.

None of these name the taller, so they stay legal under "the engine may never name a
pack's content" — they are the seam that has to be paid once, exactly like the
DOORS/TOWNLBL extraction was for El Mercado. **This is the real cost of Phase 2, and it
is bigger than the shop.**

Also from the same measuring pass, smaller but real: the uppercase tile alphabet is
**fully consumed** (A-Z), so new glyphs are digits and symbols from here; and `NPCLOOK`
is keyed by station **letter, globally**, with 20 of 23 usable letters spent — Phase 3
would have none left unless looks key by npc instead.

## Pending proposals (⏳ = needs an owner decision via side quest)

- ⏳ **❗La ofrenda** *(Nacho, 2026-09-07, with the fiesta)* — where the barrio sets its table for
  Día de Muertos and whose photo is on it. His recommendation: one at the foot of the marigold
  bridge in the park and one on Doña Tencha's table at home (the casa's neighbour — Doña Tencha since 2026-09-07; she was a second "chelo"), with a petal path from her door; an
  EMPTY frame, nobody named ("That one's for whoever needs it") — never the old AI lead, who
  vanished and did not die. Not built: the fiesta shipped the swags, the piñata and Doña Meche;
  the ofrendas wait on this word.
- ✅ **❗La silla — BUILT as a service (`mq-v105`, 2026-09-07).** Owner: *"we should really open the
  ability to change our character outfit and haircut after start. maybe have a small barber we can
  share with meridian quest as some could be hispanic businesses and they have the ability to help
  with the fit. see if any of our characters would like to do that or if they train another agent."*
  Nacho: nobody in the cast has a fit-and-style streak except Xochi, and Xochi's thread is clothing
  the barrio one business at a time — so **Xochi trains a new one**: **Naye Robles, 29**, Doña Chelo's
  niece, eleven years cutting hair between the crates of her tía's abarrotes. **Barbería y Estética El
  Espejo**, `ex` (21–23, 0), built from a `barberia` template like the casa: two mirrors, a chair under
  each, the waiting chair, the counter. Talk to Naye and the creator reopens over the world with the name
  locked (`GROWTH.barberNpc`, `openChair`); outfit, shirt, skin, hair and — in season — the calavera;
  saved on the way out, progress untouched. Don Güero's siting (x16–19) was moved east: it sat on Yola
  and the piñata. **Two picks still the owner's:**
  - ⏳ **❗La silla, the second half** — stays a *service* (no quests, like the casa and the caseta —
    recommended by Don Güero and Nacho both) or becomes a *district* with a practice pack. Nacho's
    sketch for the pack if it ever does: *"La foto"* — the brief is not the request; intake asks for
    the photo, the last cut and the time; Naye confirms at the mirror before anything is cut.
  - ⏳ **❗La fachada** — the shop wears the casa's facade today. A barbershop glyph of its own (a pole,
    the mirror wall from the sidewalk) needs one cold read; or keep the facade and hang a sign.
- ✅ **❗El camino — ANSWERED A, WITH A REAL TROLLEY (`mq-v114`/`ch-v56`, 2026-09-08).** Owner: *"do the street
  with a troley at the end or build the trolley that comes in periodically and ther is no building, person or
  house in the way, or it stops for people crossing or if i call it."* Calle Dos becomes one lane (`ex` row 1)
  with the sidewalk its two houses stand on below it (row 2, was bed — Doña Tencha's casa and El Portero's
  caseta were literally stamped in the road), and a crossing at each of their doors. Calle Principal keeps both
  lanes and its crossing. **El trolley** (`TROLLEYAT` in the pack, `TRO`/`troUpdate` in the engine): **⚠️ this paragraph described a
  game we do not have; corrected 2026-09-11 against measurement.** What is TRUE: it is never a wall, you may
  stand where it will pass, and it brakes for the hero, the world's people and one class of creature. What was
  FALSE: it does **not** come "every nineteen seconds" — standing within one tile of a stop re-summons it the
  moment the last one leaves, and sixty seconds of standing still produced **eight** trams. It does **not**
  wait for "an animal" — the rails check is blind to the pigeon, the dog, the cat and the parrot, so it brakes
  for the hummingbird and runs over Paloma, who crosses that road unprompted. And it does not stop at the stop
  **at all** — the stop is not in the trolley's logic; standing there summons it and it then runs the length of
  the street and off the far end without slowing.
  Found by Chava riding it and by Rigo reading this line against his own measurements. **This is the fourth
  time a doc in this repo has described a game that does not exist** (`docs/QA-PASS.md`; `docs/TAGS.md` L12),
  which is why the correction is left visible rather than tidied away. Drawn in both flat cameras (`troDraw2D`) and as a car in 3D (`t3Trolley`). The smoke fails if a
  wall, a lot, a person or a door stands anywhere on a line — proven red against the old map, which named all
  six tiles of the two houses. Still open below: what the strip is *called* in the ledger.
- ⏳ **❗El camino, the leftovers** — Don Güero's four ledger lines are still wrong (CITY.md calls `ex` row 10
  "canal-side"; CITY.md says Naye's door opens onto the bed; OWNER.md says the papel picado hangs "over the
  crossing"; the leash still moves you town-to-park with no gate and the park's door is one-way out). And the
  original review, for the record:
- ⏳ **❗El camino — what is that grey strip, and where do people cross it?** *(Don Güero, 2026-09-08; owner:
  "the road in meridian doesnt make sense at the moment - don guero has to review")* — **In plain words:** one
  strip runs along the top of both maps and nobody agrees what it is. The ledger calls it a trolley bed, Doña
  Tencha calls it the water's edge, and the paint says road — `TILEDRAW["≈"]` is grey asphalt with a lane line,
  walkable end to end, and the only marking on it is a crosswalk at st (13–14, 2–3). It does not read as a
  street: nothing ever drives on it (the Pass is a menu), there is no kerb, and sidewalk, lot and shop floor are
  all the same tile. **What he found walking it:** Calle Principal's crossing at x13–14 is the one good bone —
  it lines up with HQ's door, the arrival tile and the gap in row 5. **Calle Dos has no crossing at all**, yet
  the bakery, Velázquez, Naye's chair, Yola's cart and the piñata all sit on the far side of the bed from where
  the corner sets you down. Doña Meche at ex (21,3) with her pot at (21,4) and the pen fence at (20,4) plugs the
  lane, so the short way to her trolley stop is over the bed (the reach audit still passes on a long detour).
  The walk from HQ's door east to the corner never touches the bed and is clean.
  - **A — It's a street. Say so.** *(Don Güero recommends; one PR, content only)* Crosswalk tiles at each ribbon
    on Calle Dos (x6–7, x12–13, x22) plus one at the corner facing (1,3); one kerb glyph along both bed edges
    (one cold read); Doña Meche steps to (22,4) keeping her pot and her stop, and the lane opens end to end.
  - **B — Make it the canal.** The bed becomes water, bridges at st x13–14 and on Calle Dos, poured landings for
    every north door. Honest with Tencha and worth four quests — but it is a map rewrite, and **her house already
    stands in it** (ex row 2, x4–6).
  - **C — Crossings only.** Stripes and the corner, no kerb, no name. Half a PR; the street still reads as a
    plaza with a stripe painted on it.
  **Four ledger lines he found wrong, not absorbed:** CITY.md calls ex row 10 "canal-side" (it is the south map
  fence, the farthest tile from the strip); CITY.md says Naye's door opens "onto the trolley bed" (the template
  pours pavement at row 1, x21–23 — the code is better than the ledger); OWNER.md says Muertos hangs papel
  picado "over the crossing" (the swags hang over st row 1, the facade); and the leash moves you town-to-park
  with no gate while the park's only door is one-way out — the 2026-09-03 train-to-a-floor rule wearing a collar.

- ✅ **❗El espejo — ANSWERED B (owner, 2026-09-09: "if nacho recommends ill say yes"). NOT YET BUILT.**
  **CORRECTED 2026-09-17 (owner: "make the correction lol") — FOUR quests, `need:3`, not three and two.**
  *The shape as signed could never have played its own middle ending, and the arithmetic is the whole
  argument:* `gradeOf` grades on the fraction of ANSWERED quests that landed first try, and a
  district's last visit fires the instant `need` is met — so with `need:2` exactly two are answered
  and the fraction can only be 0, ½ or 1, which grades **1, 1, 3**. Grade 2 is unreachable. Whoever
  wrote El Espejo would have written three endings and shipped two, and nobody would have noticed
  because the missing one simply never appears. Four quests at `need:3` gives 0, ⅓, ⅔, 1 → **1, 1,
  2, 3**, all four reachable. `test/smoke.js` separately forbids `need === quests.length`, so 3-of-3
  was never an option either. **This is a rule every small district on this engine now inherits: a
  district needs at least four quests and a `need` of at least three, or one of its endings is
  fiction.** Found by Nacho while costing la esquina, 2026-09-16.
  **⚠️ "opening after Nolasco" is STALE and the code wins (corrected 2026-09-23, Don Güero, while siting it).**
  It was written when Nolasco WAS the last district; `esquina` was appended after Nolasco on 2026-09-17 and
  the same edit that fixed the quest count here left this word standing. **El Espejo opens after la esquina**
  — and it has to be APPENDED, never inserted, because `chSeen` is a saved integer index into `CHAPTERS`
  (`content/meridian/config.js`, grep `chSeen` is a SAVED INTEGER INDEX): insert anywhere but the end and
  every existing save points at a different district.
  **AND LA ESQUINA KEEPS THE CITY'S LAST WORD, at the owner's ruling, 2026-09-23:** *"i mean append- the
  first- why cant it be an expansion pack or something. the end is not a harsh rule in an open world model
  for us -maybe for other games yes but not her"*. The session and the planner had both assumed appending
  forces la esquina to hand off. **It does not: `open` is ONLY a toast key** (`engine/engine.js`, grep
  `function epiKeys`), and what opens a district is `qOpen`, which is `c<=chSeen`. So El Espejo's quests
  open the moment la esquina closes whatever the toast says, `esquina.open` stays `endStayToast`, and that
  line already reads *"The city is yours to walk. Whatever's still open stays open."* Discovery is Naye
  wearing a ❗ — template-room people ARE pushed into their world's npcs (`engine.js`, grep `wnpcs.push`),
  so the marker works, and this ledger already noted that Calle Dos has six people and not one has ever
  carried one. One fewer string changed than the planner's version, and no finale demoted.

  **WHO CARRIES THEM — settled 2026-09-23, owner: *"if option b is easiest, go for it."*** The four
  quests go to **Yaz, the apprentice**; **Naye keeps her chair.** This started as a way around a bug —
  a person with an unanswered quest could not also run a service, so quests on Naye switched off the
  barber's chair the owner asked for on 2026-09-07 — but **the engine was fixed first** (`svcKind`/
  `svcRun`, a person may be two things; `docs/POSTMORTEM.md` §13x), so this is now a free STORY choice
  and not a workaround. It is the better one either way: the district's closing lesson is that the
  handover is the spec and the name of the person who owns it, so the apprentice asking the questions
  ACTS that out instead of describing it. Naye is still why the district exists — she holds the tool
  that cannot be undone — and she is still the one you go to for a haircut.

  Four quests and a small `espejo` district, `need:3` — *La foto* (the brief is not the
  request), *Nomás tantito* (the confirm before the irreversible step), *La tía* (Chelo Robles). Naye is the only
  person in the city holding a tool that cannot be undone, and the beat she carries is human-in-the-loop with
  scissors. Next: Nacho writes the three quests EN+ES, Don Güero places the district, and the chapter block goes
  in `content/meridian/config.js` after `nolasco`. The original options are kept below for the record.
- ⏳ **❗El espejo — does the chair get a story, and when** *(Nacho, 2026-09-07; owner: "barber - cool
  can we reuse for MQ then for the story, nacho?")* — **In plain words:** Naye cuts hair on Calle Dos
  and nobody in Meridian has said a word about her yet. She is the only person in the city holding a
  tool that cannot be undone. The beat she carries is the one the taller only half-taught: the brief is
  not the request, and somebody confirms before the irreversible step. A customer brings a photo of a
  stranger's head; Naye asks twice at the mirror — Xochi taught her that — and only then cuts. Human in
  the loop, with scissors.
  - **A — Service only, one thread.** Three lines tying her to Xochi and tía Chelo, one existing NPC
    quotes the mirror rule. Free; teaches nothing new.
  - **B — Three quests, a small `espejo` district, `need:2`, opens after Nolasco** ← **Nacho recommends.**
    *La foto* (brief vs request), *Nomás tantito* (the confirm before the cut), *La tía* (Chelo Robles
    phones Naye — the referral chain finally runs inside a family). Industry: personal services; role:
    the prompt engineer's second room, which proves the skill transfers. Half a sitting of writing.
  - **C — A full eight-quest district** with a mural panel — the five signed roles are spent, and a
    sixth trade before la inauguración moves the finale further away.
  Nacho's bible lines are on STORY.md already (the arc and Xochi's line); the quests wait on the pick.
  ~~Not absorbed: Nacho found `chelo` declared twice in `npcs.js`~~ **Fixed 2026-09-07 (owner: "nacho/you
  fix it and choose a new name that fits with the story"):** the mercado keeps Chelo Robles (older canon,
  Naye's tía); the casa's neighbour is **Doña Tencha** — Hortensia, forty years on Calle Dos, the first
  house Don Güero built with the door in the middle because she asked, no relation to the Robles; her
  lines are unchanged (she was already the woman who says "take a plant when you go"). The smoke now
  fails a cast key declared twice. "Wardrobe / Vestidor" still names the animals' fitting room; the
  chair never uses that word.
  **❗La silla, the second half — DECIDED 2026-09-07 (owner: "la silla - you choose but all these may need
  architecture to grow right?"):** a *service* today, and yes, the architecture to grow it is already
  there and named: a template room's `people` carry `q:[...]` like any station, so Naye takes quests the
  day a `CHAPTERS` entry names an `espejo` district — nothing in the engine changes for that. Nacho's
  plan for what those quests are is ❗El espejo below.
- ✅ **❗La piñata / ❗El tamal — BUILT the owner's way (`mq-v98`, 2026-09-07).** Owner: *"put a
  pinata in there as well as tamales, etc."* Nacho's picks taken: the piñata hangs over the
  paletera's corner on Calle Dos and only sways — never hit, gives nothing; Doña Meche, a new
  neighbour with a pot at the trolley stop, three lines in both languages and a fourth that
  asks the season, permanent and never a parcel. Kike says he hung the piñata; Doña Tencha sets
  her table. Three things Nacho found and did not absorb: Yola the paletera has a name and no
  voice (chill folk share one line pool); Doña Tencha's "water's edge" is the trolley bed — the
  canal is a doc that never became a tile; a season cannot add a person, which is why Doña
  Meche is year-round.

- ✅ **❗El zaguán — BUILT the owner's way (`mq-v92`, 2026-09-07).** Owner on #7: *"i think you
  expand the building for meridian in the right side and add the staircase through a door from
  that room."* Not the well in the corner: Nolasco's office grew EAST by a stair room (16×8 →
  24×8), a doorway `+` at (15,2) between the rooms, the engine's railed well at (16–20,4) with
  `▼` at (17,4) the way down to the avenue; the office's desks, cabinets, rug and chairs did not
  move. The avenue door `$` is the foot of the stairs — you come up unseen and appear at the top
  (21,4), facing the well. The last old `1` left the city; the stand-tile smoke (§31) now proves
  its category on the street's cone. ❗El despacho chico is moot: nothing in the office was
  displaced.
- ✅ **❗La reja — BUILT (`mq-v91`, 2026-09-07).** Owner on #9: *"work on this please."* The
  casita's `▦` no longer draws a door on a wall: it is a closed reja — the recess, iron bars, a
  chain and a padlock, the step kept so it is the same house; the template part is still `door`,
  the name of the tile that carries the front. `buildSafe()` refuses any build that lays a tile
  the pack declares `kind:"door"` unless it opens (walkable, or a portal on it in that world),
  and the smoke fails on any declared lot the engine refuses. Proven red first; inert in the
  town (no `BUILDTPL`). Open with it: ❗La cuadra (do the two casitas go back on Calle Dos as
  homes) and ❗El portero (the owner's design on #8: a room, counts, red for critical).
- ✅ **❗La llave — PAID (`mq-v93`, 2026-09-07).** Owner on #10: *"lets take this on don guero!"*,
  *"lets start this fix too. templates will help us and the game grow without having to build
  with you."* Portals are keyed by WHERE a door stands as well as by its letter: `PORTALSAT`,
  `portalAt(id,x,y)`, `portalsOf(id)` — every read site in the engine asks those, never the
  tables. A template part may `link` its door to an interior the template carries (rows, people,
  a name and an arrival line in both languages); the build stamps that room as a world of its own
  named after the lot, the door and the room's exit become portals to each other, and the lots
  are applied at load so the room exists before anyone walks toward it. **❗Quién vive ahí** is
  answered his way: a neighbour with three lines. The first lot is Doña Tencha's casa at the
  water's edge on Calle Dos (`casa` template, `BUILDS`), a home, never a business. Still his:
  Don Güero saying a line about what he built (Meridian has no Don Güero station yet).
- ✅ **❗La caja de escalera — BUILT, town first (`mq-v75`/`ch-v12`), then Meridian (`mq-v81`, 2026-09-07).**
  Don Güero's candidate B, the owner's *"sounds good don Guerito, go for it"* on #4, then *"the
  stairs going up looks good"* after walking the town, then *"send the stairs to templates and MQ"*.
  HQ and Floor 2 grew three rows SOUTH: a lobby at the front door (10,16), a stair hall behind the
  door at (10,13), a four-tile mass at (11–14,13) carrying the flight in profile, three rising
  treads and the head ▲ at (14,14) that is the portal up; upstairs a railed well — a hole in the
  floor with the steps sunk toward the way DOWN ▼ at (10,14), railed on three sides (#62). Rows
  0–12 untouched; the old `1` left Dana's closet (❗El escalón de Dana closes with a yes: she
  stays). Coming in from the street lands on the landing (10,14). Five engine glyphs (`⊓ ≡ ▲ ▼ ◺`),
  so every pack gets a real flight; the template is NEW-WORLD.md §3¾. Nolasco's `1` stays the
  standing staircase down to the street — ❗El zaguán below is still his. The meeting notes:
  `docs/meetings/2026-09-06-la-caja-de-escalera.md`.
- ✅ *(closed 2026-09-07 with ❗El zaguán above — the stair room)* **❗El zaguán** *(Don Güero, 2026-09-04)* — Nolasco is a walkup, and today its street door
  and its staircase are the same connection wearing two different clothes: you go **up** through
  a door and come back **down** through stairs. `maps.js` records the rule it breaks, thirty
  lines below the code that breaks it. His recommendation: draw the climb at both ends (half an
  hour) rather than build a stair-hall world (a third of a sitting).
- ⏳ **❗La cortina** *(Don Güero, 2026-09-04)* — a roll-up gate that comes down at night is the
  most realistic thing on his list and the first that could take something away from the player.
  His recommendation: **art only, never solid** — the gate drops in the picture, the door still
  opens, the light still spills.
- ⏳ **❗El local** *(Don Güero, 2026-09-04)* — `BUILDTPL.local`, a 6×3 storefront with `interior`
  and `link` parts and `buildSafe()` **refusing any build with no way in**, which turns "nothing
  goes into the world the player cannot use" from a rule a session must remember into one the
  engine enforces. Ships as an ability; whether a lot is developed with it is the owner's call.
  Honest limit he named: a template cannot invent a world — `WORLDS` is built at load, so the
  pack declares the interior shell up front.

- ✅ **❗La oficina** — signed 2026-09-02: the barrio furnishes it, one piece per
  business. Built the same day (S2 v1), with the interview. ⚠️ **AMENDED 2026-09-02 by
  the owner: the office opens MID-MOVE, not bare** (*"i think for the move it should be
  mid"*). The furnishing rule is untouched; only the day-one state changed. Retires owner
  call #2 in `docs/rooms/partner-office.md` §8.
- ✅ **La vía que se acerca** — approved in principle 2026-09-02 (owner: *"I do like the
  idea of seeing a neighborhood incoming"*). Content-only on top of the built window, a
  third of a sitting; still **waits on S1**, because it cannot be tested until districts
  close.
- ✅ **Furniture deliveries may be GROUPS** — answered by architecture, not by a build: a
  storefront's `tiles` has always been a list. What remains open is ART for a piece wider
  than one tile (❗El sillón).
- ⏳ **❗El reparto** — which business sends which piece: assign all nine now (Don Güero's
  pick; the catalogue in `docs/BACKLOG.md` §6 is the proposal) or let each pack pick.
- ⏳ **❗El sillón** — the couch: one tile (a loveseat, an eighth) or two (a real one, a
  quarter, and the city's first group delivery).
- ⏳ **❗La caja** — gifts land ON the box tiles as the room fills (Don Güero's pick; free).
- ✅ **❗La ventana** — signed and built 2026-09-02. ⚠️ The ❗La oficina entry in the
  decision log read "a north window onto the trolley line"; the trolley runs SOUTH of HQ.
  Amended in place with a dated note.
- ⏳ **La vía que se acerca** — the window's view advancing a stage per finished business
  (the second progress bar beside Nacho's mural). Content-only on top of the built tile;
  a third of a sitting. **Waits on S1**, because it is not testable until districts close.
- ⏳ **Furniture deliveries may be GROUPS, not single tiles** — surfaced by "who is the
  room for": ❗La oficina's "one piece per business" is a *set* for a team room (a table
  and its chairs). One line in S1's furniture registry; expensive to retrofit after five
  packs have declared their piece.
- ✅ **❗La palabra** — signed 2026-09-02: the word is the reward. Under ❗El giro the five
  terms become the TRADE's vocabulary, not the role's.
- ✅ **❗El papel** — signed 2026-09-02: template **06 Process & Exception Map** gets
  written. ⚠️ `docs/templates/README.md` already assigns template 01 to the taller's
  process map — **two templates would claim one artifact.** Nacho's read is that they are *(Stale since 2026-09-02: the README freed 01 the same day; 01 is the panadería's now, 06 the taller's — struck by Nacho's reading.)*
  genuinely different documents (01 is what you write BEFORE you understand the work; 06
  is what you hand over AFTER) and both should exist, but the README's "Taught by" column
  must be corrected and 06 given a row. **Flagged, not guessed.**
- ✅ **❗La despedida** — signed 2026-09-02 (owner deferred the call to /nacho): a
  district's last visit is a goodbye at the door, declared per district as
  `ending:{mode:"doorstep"|"panel"|"quiet"}`. `panel` is kept so nothing regresses.
  **Hard build-order dependency: needs the office. No office, no doorstep.**
- ✅ **❗El giro** — signed 2026-09-02: **industry leads, role follows.** `industry:` is
  ADDED beside `role:`. This dissolves the `principal`/Limpieza collision rather than
  patching it — the same craft appearing in two very different rooms is PROOF the skill
  transfers, which is the most valuable thing a portfolio can show.

- ✅ **El Mercado** — signed 2026-08-31. Full build + engine seam, AI PM pack.
  See "Phase 1 plan (SIGNED)" below.
- ✅ **Which AI role first** — signed 2026-08-31: **AI product manager** leads.
  Full ranking in the decision log.
- **Hispanic-business brainstorm** (owner ask, 2026-08-30): panadería, salon/barbería,
  auto shop, landscaping, cleaning company, real-estate/property mgmt, trucking,
  dental/clinic, event planning/quinceañeras, tax prep/notario. Don Güero curates
  per phase — one at a time.
- ✅ **Week Two** — signed 2026-08-31: El Mercado *is* chapter one. The arc now
  has a Monday; later phases extend it rather than inventing it.
- Fandom eggs round 2 + mechanics (IDEAS §9) — waiting on [partner]'s picks.
- ✅ **What zero hearts costs in an open city** — signed 2026-08-31, lands with the
  open-city refactor in Phase 2. See the decision log.
- **Full tile registry** — DOORS/SOLIDX/MAPCOL are the seam Phase 1 needed; the
  per-glyph `TILES` table (solid + colour + renderer, all as data) belongs with the
  queued graphics-prep refactor, not a second content pass.

## The open city — Phases 2-5 (planned 2026-08-31)

Owner retired weeks as the organizing principle ("we dont have to follow weeks any
longer") and asked for all four remaining businesses planned at once. Weeks One and
Two stay in the fiction — they are written and shipped — but nothing new is gated
behind a calendar.

**The model.** `CHAPTERS` becomes **districts**: each declares its quests, a `need`
below its pack size, the AI role it trains, and what opens its lot. Districts do
**not** close behind you — every opened business stays available and the player
roams. Closing a district plays its own ending beat and breaks ground on the next
lot (Don Güero's job, in fiction). The city itself has no credits; it keeps growing.

**One business per phase.** Four packs of ~8 quests is ~32 quests of writing — that
is four sittings, not one. Order follows the owner's signed role ranking.

| Phase | Business | Parcel · map | Role trained | Cast |
|---|---|---|---|---|
| 2 | **Taller Herrera** (auto shop) | st southeast lot · `ta` | Automation / solutions consultant | Don Tacho (master mechanic, refuses the tablet), Yesenia (service writer, runs a paper book), Moy (apprentice, already using AI on his phone) |
| 3 | **Panadería La Espiga** | Calle Dos frontage west · `pa` | AI ops analyst | Doña Licha (baker), Tito (night baker), Sol (counter) |
| 4 | **Limpieza Velázquez** | Calle Dos frontage east · `li` | Implementation lead | Doña Vero (owner), Chente (crew lead), Karla (scheduler) |
| 5 | **Nolasco Tax & Notario** | walkup off Calle Principal · `no` | Prompt / solutions engineer | Lic. Nolasco, Bere (intake) |

**What each pack teaches**

- **Taller Herrera — automation consultant.** Where automation actually pays and
  where it must not go. Intake and estimates from a photo; parts ordering; the
  master mechanic who will not touch the tablet (the lever is the workflow, not the
  person); what an AI estimate commits you to when it is wrong; and the one thing
  that stays human — diagnosis. The counterweight to El Mercado: there the answer
  was usually "build the small thing", here it is often "do not automate this".
- **Panadería La Espiga — AI ops analyst.** The forecast El Mercado could not
  build yet, now that invoice data exists. Waste against stockout, the 4am
  decision, holiday spikes, drift when a competitor opens, and measuring a model
  against the pan dulce that did not sell.
- **Limpieza Velázquez — implementation lead.** Rolling a tool out to crews who do
  not sit at desks: phased pilots, training, the crew that quietly ignores the app,
  and measuring adoption rather than logins.
- **Nolasco Tax & Notario — prompt / solutions engineer.** Designing what a system
  must refuse. Grounding answers in the actual form instructions, PII in document
  intake, escalation paths, and the **notario false-friend** — in Mexico a notario
  público is a senior lawyer; in the US a notary is not, and the confusion has cost
  real families real money. A quest about an assistant that must refuse to give
  immigration advice and hand off to a human is the sharpest "know the limits of
  the tool" lesson in the city.

**Hearts, in one sentence (signed 2026-08-31).** *Hearts are the grade on a
business's ending, scoped per business, and they never block anything.* Three at
each business; bad calls spend them; the count remaining picks which ending that
business plays (flawless / strong / survived / burned through their patience).
Zero stops nothing — you keep answering, you have simply already earned your
ending. Walk into another business and you start fresh at three.

This is deliberately a **template rule, not a Meridian rule**: it is one sentence,
it never takes anything away, and it reads the same in any story the engine is
reused for. It replaces "zero hearts ends the week" — which is what ships today and
stays live until the Phase 2 refactor lands.

## Decision log

*(format: date · quest title · choice · one-line why — append only)*

- 2026-09-02 · ❗El cuarto de arriba: what stands in Floor 2 on day one · **bare, as
  signed** — one desk, the stairs, and Nacho and Don Güero placed by content, not by a
  map letter · Don Güero's moving-in debris was declined for now because the only crate
  tile is El Mercado's produce crate (it reads as groceries), and the window because no
  window tile exists; both are owner calls in `docs/rooms/partner-office.md` §8. His geography
  correction stands: the trolley runs south of HQ, so a north window cannot look "onto
  the trolley line".
- 2026-09-02 · ❗La ventana: how much window on the north wall · **three panes, season
  sky** (Don Güero's pick, Nacho agreed; owner delegated: "maybe /nacho and /don-guero can
  work something cool out") · one pane is invisible from the stairs and the staged version
  cannot be tested until districts close — the band grows into it later as a content edit,
  with no new glyph and no redraw. The floor light under it was skipped: content cannot
  wrap the engine's floor drawing without a seam for it.
- 2026-09-02 · ❗Quién sube: whose room is it · **Don Güero asks it, first line of his
  form** (owner: "that should be a question in the creation - who is the room for") · the
  answer changes the furniture math, not the mood, so it belongs to the builder — and it
  RETIRES owner call #4 in docs/rooms/partner-office.md §8, because the sheet now states whose
  room it is instead of the build session guessing.
- 2026-09-02 · ❗La mudanza: bare or mid-move · **MID-MOVE, and Don Güero prices the
  furniture** (owner: *"i think for the move it should be mid and we can have don guero
  provide estimates and possible furniture to furnish"*) · supersedes the "opens bare"
  half of ❗La oficina and retires owner call #2. One new glyph `□` (the taller's
  reservations `0 6 7 8 = % i` are NOT spent), four boxes, a cone, a plant; the window
  sight line and the arrival tile stay clear. Nacho's talk title became *Before you
  unpack* (Güero's suggestion; Nacho may rename).
- 2026-09-02 · ❗Quién sube (asked again): whose office is it · **the owner's own room —
  and still a template** (owner: *"In this case it is mine but of course this is to be a
  template for the skill"*) · `f2` is the owner's office in Meridian's pack;
  `content/<pack>/room.js` stays the copyable interview so [partner]'s pack asks its own person.
- 2026-09-02 · ❗La vía que se acerca: the window's view advancing · **approved in
  principle** (owner: *"I do like the idea of seeing a neighborhood incoming"*) · four
  drawings, four cold reads, content-only; held until districts close so it can be tested.
- 2026-09-01 · ❗El taller: the shop's footprint · **shop plus an apron** — one door and
  one interior like the mercado, and the ribbon also drops the Caprice and a tire stack
  on the sidewalk · it reads as an auto shop before you open anything, and the sitting
  stays spent on the eight quests.
- 2026-09-01 · ❗El recado: do the taller's jobs leave the shop · **six inside, two out**
  — the parts run to Calle Dos, the cousin's software demo where Doña Chelo can overhear
  · uses maps that already exist and makes the referral run both ways: she vouched for
  you, now she is watching.
- 2026-09-01 · ❗El papel: the document the taller hands you · **a process-and-exception
  map** — how work flows, where a human must sign, which step cannot be taken back ·
  it carries "never automate the irreversible step" out of the game and into a meeting,
  and no other business in the city teaches it.
- 2026-09-02 · ❗La oficina · **SIGNED — the office opens bare and the barrio furnishes
  it.** `f2` (20x14, portal already wired from HQ) opens with two things: the old AI
  lead's empty desk and a north window onto the road out of the barrio *(amended
  2026-09-02: it was signed as "onto the trolley line", but the trolley runs SOUTH of HQ —
  Don Güero's correction; the decision-log entry of that date is the record)*. Each business then ships
  ONE piece of furniture with its own pack, declared in that district's own data so
  nobody re-opens `f2`'s map five times. Supersedes the counter-proposal below.
- 2026-09-01 · ❗La pared: where the record lives · **counter-proposal, now SIGNED above
  as ❗La oficina.** Original note kept: Owner: *"i think an office should become mine
  somewhere so i can access these."* Supersedes the mural-wall-only option. For whoever
  specs it: **`f2` already exists** — "Floor 2 · Expansion", portal wired from HQ at
  `PORTALS.hq["1"]` *(since `mq-v81` it is `PORTALS.hq["▲"]`, the head of the flight — the smoke
  forbids `hq["1"]` from existing; Don Güero's correction, 2026-09-07)*, arrive text *"Quiet up here… for now."* An empty floor with a door,
  waiting for a purpose. Fits Settled "HQ is the onboarding", and gives the terminology
  work (glossary, filled deliverable drafts) a room rather than a menu. Nacho's mural
  keeps the CITY's record; the office is the player's own. **Needs a parcel spec from
  /don-guero before it can be built.**
- 2026-09-01 · ❗Orden (Don Güero's call, not a survey) · **the 3D/world sitting ships
  BEFORE Taller Herrera** · new storefront art must not be judged against a renderer
  that lays doors on the floor, and two branches repainting tiles at once is a merge
  that eats a session.
- 2026-08-30 · Cartridge model · saves stay on-device, Trolley Pass is the link
  cable · zero-maintenance rule. *(imported from HANDOFF)*
- 2026-08-30 · Retry-until-correct · quests complete only on the right answer ·
  teaching game, not a quiz show. *(imported from HANDOFF)*
- 2026-08-31 · ❗Permiso: which trade first · **AI product manager** leads; then
  automation/solutions consultant, AI ops analyst, implementation lead, prompt
  engineer.
- 2026-08-31 · ❗Obra: how much mercado · **full build + engine seam** — storefront
  ribbon, `me` interior, and the DOORS/TOWNLBL/MAPDOT extraction · pay the seam
  once so every future shop is data, not code.
- 2026-08-31 · ❗Planos: quest depth · **write the full pack, don't skimp; gate
  completion on fewer** — required-to-complete count lives in config as data ·
  this mercado is the open-world template, so the threshold must be tunable later.
- 2026-08-31 · ❗Papeles: decision-report export · **build it in Phase 1, first,
  accept a longer session** · the portfolio artifact is the point of the gym.
- 2026-08-31 · ❗Semana: when is the mercado · **Monday of Week Two — chapter one**
  · the epilogues already promise Week Two; this cashes that check.
- 2026-08-31 · ❗Corazones: what zero hearts costs · ~~the week, not the city — the
  chapter ends where it stands, unanswered quests stay unanswered and close for good~~
  · **SUPERSEDED 2026-09-01 by "no practice is ever missed"** (docs/OWNER.md → Settled):
  ending a district's arc never closes its quests. Only the "never delete the gym" half
  survives, and it is now absolute.
- 2026-08-31 · ❗Botón: where restart lives · **⚙️ Settings, behind a two-tap confirm**
  · the story never sends you there; it is a testing tool, so it stops sitting next to
  the button that continues the story.
- 2026-08-31 · ❗Negocio: the southeast lot · **plan all four remaining businesses**
  — taller, panadería, limpieza, tax/notario, one per phase · the owner wants the
  city grown, not a single storefront.
- 2026-08-31 · ❗Semana: weekly chapters · **retired** — "we dont have to follow weeks
  any longer" · districts open and stay open; the city has no credits, it grows.
- 2026-08-31 · ❗Reporte: two jobs in one report · **role summary on top, chronological
  detail underneath** · a hiring manager reads the job they are hiring for. BUILT.
- 2026-08-31 · ❗Corazones (open city): what three bad calls cost · **hearts are the
  grade on a business's ending, scoped per business, and never block anything** ·
  owner: "this is for story mode so no big deal just so i learn, and we can reuse the
  same for other stories" — so the rule is one sentence and takes nothing away.
- 2026-08-31 · ❗Siguiente: build order · **front-profile 2.5D first, then close the
  signed-not-built gap (open-city refactor + per-business hearts), then build the four
  packs** · owner set the order directly.
- 2026-08-31 · ❗Mando: who wins when Nacho and Don Güero disagree · **the owner
  referees, every time — for now** · with a stated goal of graduating to browse-and-
  approve, so every standing preference now gets written to `docs/OWNER.md`.
- 2026-08-31 · ❗Orden: what to build now · **the plan only** · roadmap signed, report
  shipped, no new district this session.
- 2026-08-31 · ❗Entrada: a staging area for new players · **skipped — Meridian Labs HQ
  is the onboarding** · Priya, Frederick and the early quests already do that job.

- 2026-09-02 · ❗Las cuatro puertas (ledger side) · **all four parcels carry their packs
  the same day they were laid** · the owner asked for the rest of the story now; the seam
  work of the morning (per-district endings, looks by npc id, ribbons, doorsteps) is what
  made "wire four districts" a content change. What is NOT built and is written down as
  such: ❗El recado (a quest played away from its lot), the grade-read world (Tuerca on the
  Caprice is words only, Nacho's H), the view advancing per finished business.
- 2026-09-02 · The mercado gate · **waived for the writing, not for the playing** · S4 was
  gated on a human playing the mercado; the owner's "now please" wrote the packs anyway.
  *(Corrected 2026-09-05: the mercado WAS played; the `mq-v52` save bug erased the record.
  The first human play of the four newer packs is the gate, and they will be revised against it.)*

## Phase 1 plan (drafted 2026-08-30 · **SIGNED 2026-08-31**)

**El Mercado Robles** on the st SW lot + interior world `me`. Cast: Doña Chelo
(owner), Nando (receiving, half-automates everything), Perla (counter, accidental
analyst), Chava (carnicero, chat-only, rings everything as "chile"), optional
bodega cat Frijol. Role: **AI ops analyst**. Quests 16-20: "Everything is chile"
(data quality at source), "Tamal season" (drift + actionable alerting), "The
abuela test" (proxy vs guardrail metrics), "The camera guy" (root-cause before
tooling; consent), "The Monday number" (business KPI vs model metric; honest
review). Core = 1,2,5 (MAXXP→290); stretch 3,4 (→330). Full build notes incl. map
rows, portals (`M` door), stations s/n/u/v, and the DOORS/TOWNLBL/MAPDOT engine
extraction are in this session's Don Güero plan — reproduce via /don-guero if lost.

**Owner directives given 2026-08-30 (recorded verbatim intent):**
- Balance built-out vs player-built; mix per business; expand via quests.
- **Standing law — entities as data**: every character/critter/tile/building is
  declared as data (type, look, placement, behavior) so graphics can be re-rendered
  wholesale (2D today → richer/3D someday) without changing what things are. [partner]'s
  upgrade waves depend on this.

**As signed 2026-08-31 — these override the 2026-08-30 draft above:**
- **Role: AI product manager**, not ops analyst. The mercado's quests become PM
  judgment calls — scoping, prioritization, saying no, shipping the small version —
  with Doña Chelo wanting everything at once and the player deciding what actually
  gets built. The drafted ops-analyst beats are not discarded: they stay in the pack
  as the operational half of the same story.
- **Quest depth: full pack, lower bar.** Write every quest properly; the number
  required to "complete" El Mercado is smaller than the number available, and that
  threshold is **data in config**, not a constant in code — this business is the
  template for the open world, so a later phase retunes it without a rewrite.
- **Build: full** — storefront ribbon on the st SW lot, `me` interior world, the
  full cast, AND the DOORS/TOWNLBL/MAPDOT engine extraction. Growth registry queued
  so Phase 2+ parcels can be player-built.
- **Decision-report export: in Phase 1, built first.** Owner accepted a longer
  session for it. Prints the player's quest answers as a portfolio artifact.
- **Week framing: Monday of Week Two, chapter one.** The epilogues' promise gets
  kept. Content-only — the calendar lives in quest text and signage, not the engine.

## Merge note (2026-08-31)

Two sessions built Phase 1 in parallel; the owner's /don-guero session signed later
(AI-PM pack, 8 quests, chapters-as-data, export built, hearts-end-the-week) and WINS.
This session's 5-quest **AI ops analyst pack** ("Everything is chile" ... "The Monday
number") is preserved in git history (commit 00fc1aa) and returns with a future
ops-analyst business — the concepts don't expire. Also landed in the merge: theme
editor edits the visible variant, every animal interactive, door under-glow, activity
ticker, music chirp + denser melody, admin NPC editing (rename / re-roll look / move
out), Calle Dos got its south fence.

## Owner playtest feedback — iso round (2026-08-31, logged for next session)

Diamond-iso v1 verdict: generic surfaces, hidden entrance, doors/walls/fences/
trolley-stop all lost identity, emotes missing. Owner steer: front profile, not
angled. Full plans: IDEAS §10 (TILES+DECOR metadata architecture, front-profile
renderer, camera rotate/wall fade), §11 (Sonny's program — fetch 4/7, feed, howl,
lay, dig, 💩→ future janitor pack), §12 (emote regression). Only plans were made,
per owner instruction — nothing built this round.


## ⏳ Phase 6 proposal — El Zócalo de Meridian (Don Güero, 2026-09-09) — NOT BUILT

*The owner: "it seems crowded. it wouldnt pass in [state]. we really cant do better for these
cities? ... please make/grow the world ... beautiful gardens or fountains or something."*

**Measured, not asserted.** `st`'s southern half is **178 contiguous walkable tiles — 37% of the
street map — holding ten objects** (two pots, two grass tufts, four jacarandas, a Caprice, a tire
pile). One in eighteen. It carries **one NPC** (Lupe) and **nothing to read**: all seven of the
pack's `READS` are upstairs in `f2`, behind a stair, in a room you enter on purpose. And the whole
of it — La Cocina's door, El Mercado's door, Taller Herrera's door — hangs off **one tile**: (13,5)
is the only walkable continuation south, because (14,5) dead-ends on the fence at (14,6).

**Don Güero's correction to the brief:** `st` is not crowded, it is a barbell — its edges are 100%
built and its middle is a parking lot. **`ex` is the crowded one**, ~1 object per 9 tiles.

**The plan — content only. No engine, no `GROWTH`, no resize.** A fountain at `st` (12–14, 11) and
(12–14, 12) as one basin across six tiles (new pack glyph, solid, knee-high, reading its neighbours
the way `⊓` already does); benches at (10,11)(10,12) and (16,11)(16,12); jacarandas at (11,10) and
(15,10); beds and grass between. The spine already lands on it: HQ's door (14,0) → the crossing →
the notch at (13,5) → straight down x13, and at row 10 the room opens with the basin dead-centre.

**La placa** — a plaque on the basin's north rim at (13,11), `DECOR` + `READS`, and **Meridian's
first readable thing outdoors.** It builds from the play record: every business you opened, in the
order you opened them, in dry municipal prose, gaining a line each time a district closes. It never
lists what you have not done. Zero engine work — `READS`/`DOCS` shipped 2026-09-03 and Meridian
never used it on the street.

**What comes out, all of it his own:** the two traffic cones at (4,4) and (25,4) — La Obra finished
a week ago and the cones are still barricading an open street — the tire stack at (25,14), and the
two lone pots. **Net −5, +22. Object density 1-in-18 → 1-in-6.6.**

**The rule he proposes for any city on this engine — *la regla del doce y el octavo*:** no walkable
tile is more than **twelve steps** from something you can stop at, and **between 1 in 8 and 1 in 5**
walkable tiles is furniture, planting or water. *Under 1 in 8 it is a parking lot; over 1 in 5 it is
furniture storage.* Twelve is a Manhattan count, because this engine walks one press one step.

**The honest limits he named:** worlds are fixed-size string grids and widening `st` would rewrite
every coordinate pointing into it (HQ grew three rows once and it cost a full ticket) — **nothing
here needs that**. Nobody can sit; there is no sit verb, so a bench is a thing you stand beside and
the copy must not promise otherwise. The stand-still petal moment is welded to the bridge and Día de
Muertos, so it cannot be pointed at a fountain without a new seam. And there is no multi-tile object
— six tiles bake as six fountains unless the art reads its neighbours.

**Four decisions are open** — the plaque's content, who inhabits the plaza, permission to cut his own
five objects, and whether the rule of twelve is promoted to `docs/OWNER.md` for every world.
