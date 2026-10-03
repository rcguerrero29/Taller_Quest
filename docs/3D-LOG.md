# The 3D log — Chema's contact sheet

*Opened 2026-09-09 at the owner's word: "we should make sure that they document everything possible
so they can recreate it if needed and try to continuously improve depending on goal and past builds."*

**This file is the record of every attempt, not the record of the rules.** The rules — what the
engine does today and why — live in `docs/NEW-WORLD.md` §3⅝, §3⅚ and §3⅔. This file says what was
*tried*, what it *measured*, and above all **what was rejected and for what reason**, because a
rejected approach nobody wrote down gets tried again in three months by someone honest.

Read it before proposing anything about the 3D view. Append to it before moving on.

---

## The standing goal

> **A pixel world that obeys real light and real depth — without ever stopping being a pixel world.**

**And the second half of the goal, in the owner's words (2026-09-09):** *"the standing goal is also
supposed to keep in mind the customizeable and ability to use as template for other games with
technology."* Realism here is never Meridian's realism. Every rendering improvement must arrive as
one of two things and nothing else:

- **a RULE** — it belongs in `engine/`, it is behaviour-identical for Meridian, El Changarrito and
  any world built from the template, and it is proven the same day by every suite CI runs; or
- **a SEAM** — the engine asks, the content pack answers, and a pack that says nothing gets a sane
  default. `PLACES · GROWTH · SEASONS · CHAPTERS · ENDLESS · HUDFACT · TILEART · DECOART · CRITTERS ·
  BUILDTPL · BUILDS · READS · DOCS · INTERVIEW · TOWNLBL` is the existing list; a new one joins it.

A realism change that only makes sense for Meridian's art, Meridian's palette or Meridian's maps is
**not a realism change** — it is Meridian content wearing an engine's clothes, and it is refused.
Test for it: *could a game about something else entirely turn this on, turn it off, or set it to a
different value without touching the engine?* If not, find the seam before you find the fix. Every
rule in this log passes that test — nearest filtering, `alphaTest`, `t3Top`, the stub, the glass —
which is why they are engine rules and not Meridian's.

Three more sentences that follow from it, all of them already settled by shipped decisions:

1. **The grid is never softened.** Everything is sampled nearest. Realism here means correct
   *behaviour* — occlusion, depth, light, camera — never smoother pixels. Any proposal whose result
   is a blurrier frame is refused on sight.
2. **Nothing that stands is a flat picture pretending otherwise.** `test/engine.smoke.js` fails the
   build if a new object ships as a flat picture (#39). Billboards are for round, leggy, organic
   things; boxes are for things with corners (Pili's rule).
3. **A person can always tell where they are.** Every occlusion cure — the wall stub, the glass —
   exists so that your own position stays legible. A cure that loses the player is not a cure.

**❗Open, needs the owner's word:** the goal above is my reading of what has already been signed
rather than something the owner has stated in those words. If it is wrong, everything measured
against it is measured against the wrong thing. — *Chema, 2026-09-09*

---

## How things are measured here

| What | Method | Why not the obvious thing |
|---|---|---|
| Sharpness | mean absolute Laplacian over a rendered frame | "Looks blurry to me" cannot be compared to last week |
| Occlusion | render twice, difference the buffers, count changed pixels | **Raycasting was tried and passes clean straight over a knee-high desk** |
| Screen share | rendered box height ÷ `innerHeight`, at 390×844 | At 560px tall the old rule already filled half the window; the fault only appears on a tall screen |
| World extent | `2·d·tan(fov/2)`, then × aspect | `fov` is the VERTICAL angle — a taller frame *costs* horizontal world |
| Loop cost | count the loop's `draw()` decisions | Headless throttles rAF to ~2 frames/500ms; a WebGL frame count proves nothing |
| Anything at all | **and then look at a screenshot** | A prototype here passed every pixel test while putting teeth along every wall in HQ |

---

## The log

### 2026-09-08 · #134 — "things are looking a bit blurry"
- **Goal served:** the grid is never softened.
- **Measured before:** edge energy of a rendered street **2.26**.
- **Diagnosis:** every texture was sampled through a linear filter somewhere. Linear *blending* is
  what "blurry" means for a pixel grid. The mip pyramid was **not** the cause.
- **Shipped:** nearest between texels *and* between mip levels; the pyramid kept.
- **Measured after:** **2.72**.
- **Rejected — dropping the mip pyramid.** It removes the blend between levels, but the far half of
  the street then crawls as you walk. Do not try this again.
- **Rejected — mipmaps unconditionally.** A non-power-of-two texture with mipmaps renders **black**
  on a WebGL1 fallback, and every texture here is sized to its world. Mipmaps are asked for only
  under WebGL2.
- **Also found:** the live sprites lost their 36×48 shape when the device pixel ratio changed, and
  the pool resize used `40*K` where the sprites are `48*K` tall.

### 2026-09-08 · fullscreen was a second, unrelated blur
- **Measured:** **0.885** fullscreen against **2.24** windowed — same build, same content.
- **Diagnosis:** the 3D buffer kept the game's 10:8 while fullscreen gave the element the screen's
  shape, so the browser rescaled and letterboxed a 2880×2304 render.
- **Shipped:** it renders the box it is given.
- **Lesson worth keeping:** two faults with the same symptom. Fixing #134 did not fix this, and the
  owner reported it again — correctly. *A symptom is not a cause; measure in the state the person
  was actually in.*

### 2026-09-08 · the world's share of the screen, and what `fov` costs
- **Measured before:** the world was **31%** of a 390×844 phone screen.
- **The repercussion, measured BEFORE building rather than after:** `fov` is the *vertical* angle,
  so a taller box would have shown the same up-and-down and **less** left-and-right — **10.9 tiles
  of street across would have become 7.7**. The angle widens below 10:8 to hold the width.
- **Shipped:** **46%** of the screen, and more world in both directions.
- **Second fault found by doing it:** at a map corner the ground stopped and the background showed
  through. An apron in the world's floor colour now carries the city into the dark.

### 2026-09-08 · the render loop behind a panel
- **Measured:** **215 frames in six seconds**, at full device resolution, with a document covering
  the world — none of them visible to anyone.
- **Shipped:** the loop stops *drawing* behind a panel and never stops *thinking*, so nothing jumps
  when the paper goes down; anything the street said while you were reading is held and delivered.
- **Note:** the test threshold was wrong at first (`< 5` frames) because headless throttles rAF to
  about two frames per 500ms. It asks *some vs none* now.

### 2026-09-08 · the camera turn
- **Shipped:** 300ms ease-in-out, offered as a setting (`instant / quick / easy / slow` =
  0 / 150 / 300 / 520ms). `instant` is exactly the old behaviour.
- **Reasoning worth keeping:** [partner] called the old *automatic* turn "too confusing" (#65) and the cure
  then was to make it manual. But the confusion was never that it turned — it was that the turn had
  no motion to follow, so the eye had to re-find the whole street from scratch. **A move you can
  watch is a move you can follow.**

### 2026-09-09 · #149 — a prop's empty margin was hiding people
- **Goal served:** a person can always tell where they are.
- **Measured before:** **76 pictures** across Meridian counted their see-through corners as solid.
- **Diagnosis:** every prop is a picture on a card and most of the card is empty. An empty pixel
  that still writes depth punches a hole in whatever is drawn after it — which is people. A quest
  mark beside a desk simply went missing and nothing on screen explained it.
- **Shipped:** `alphaTest` (0.25) on every baked billboard.
- **Proof used:** two renders of the HQ doorway, before and after. Three quest marks return.

### 2026-09-09 · #140 — "i seem to walk on them"
- **Goal served:** a person can always tell where they are.
- **Diagnosis, and the real lesson:** the near-wall rule was written as a list of *kinds* — walls,
  facades, lintels, doors, window pieces — and it measured height with `geometry.parameters.height`,
  **which a sprite does not have**. So a tree crown, a lamp or a piñata was never once considered no
  matter how much of you it covered. *A kind list cannot answer a question about height.*
- **Shipped:** `t3Top(o)` answers for a box and for a sprite alike; the rule asks about height, of
  everything with a footprint. A wall still becomes a knee-high stub; a tall **object** turns to
  glass at `T3GHOST` = 0.55, `depthWrite` off, drawn after the people.
- **Rejected — cutting a tree to a stub the way a wall is cut.** Half a tree is not a cutaway, it is
  a missing tree, and the room stops making sense.
- **Rejected — removing the hero's depth exemption.** It is the obvious fix and it is worse than the
  bug: the tree simply eats you. Shown to the owner as the middle of three panels. Drawing the glass
  *after* the people gives a pixel-identical result — 0.55·crown + 0.45·hero either way — and #22
  and #92 survive untouched.
- **Rejected — raycasting as the test.** Proven to pass clean over a knee-high desk. Silhouette
  diffing instead.
- **Watch out:** materials are shared per glyph. The glass copy is made once per PIECE and kept
  beside the solid one; edit one in place and a single tree fogs its whole row.

---

## Still open, in the order I would take them

1. **The trolley's art** — the owner: *"make the trolley more realistic, even the old one seemed cute
   and realistic though 2d."* The structural half of #125 shipped; this is the half that is a
   judgment about how it reads, and it wants Pili beside me.
2. **Rosa's remaining 3D notes**, chiefly her call that the world's height should stop being derived
   from the 2D tile grid — partly addressed by the screen-share change, not finished.
3. **Light.** Day/dusk/night tints exist. **Correction, 2026-09-09 (Pili, and she is right): contact
   shadows DO exist** — `engine3d.js:203–214` darkens a walkable tile that touches a solid neighbour,
   and this log said otherwise, which is the log being behind the code. What that mechanism reveals
   is sharper than the gap it filled: **a tile with no solid neighbour gets no gradient at all**, so
   an open plaza is one flat value edge to edge, and the eye reads a single flat value as absence.
   Still untouched: whether the sun should rake, and any lighting a pack can ask for.
4. **A named baseline.** Every number above was taken ad hoc. A `test/` script that renders the same
   six frames and prints the same six numbers would make "continuously improve" mean something
   arithmetic rather than something remembered.

### 2026-09-11 · the tram's wheels were never wheels — and the strobe that wasn't

- **Asked:** would raising `TRO_SPEED` 3.4 → 6.0 make a 12-segment wheel wagon-wheel? Derived answer,
  not looked at: 28.2°/frame today, 49.8° at 6.0, past the 30°/segment limit.
- **Measured instead, in the real game at 390×844, 3D, side on** — and the control came first:
  a screenshot diff with **nothing changed** read **1864 px** while the first "wheels vs no wheels"
  measurement read **1506**. The opening answer was smaller than its own noise floor. Everything
  below was taken after the control read **0**.
- **The wheel's world axle as `rotation.y` sweeps:** `(-1,0,0)` at 0°, `(-0.866,-0.5,0)` at 30°,
  `(0,-1,0)` at 90°. **A rolling wheel's axle is `(0,0,±1)`. It is never once near it.**
  `engine3d.js` set the axle correctly along Z and the very next line (`rotation.z=Math.PI/2`,
  commented *"turn it to face along the rails"*) undid it. So the per-frame `rotation.y` did not spin
  a wheel — **it tumbled a cylinder end over end.**
- **Per-frame changed pixels in the 3663-px wheel strip**, tram pinned, only the angle moving:
  **today 3.4 = 160 · today 6.0 = 204 · fixed 3.4 = 12 · fixed 6.0 = 41.** All four wheels together
  occupy **168 px**. At the shipped speed the wheel repainted itself completely, every frame.
- **Ground contact, from real vertices:** as shipped the wheel bobbed to **+0.080 tiles (2.66 CSS px)**
  twice a revolution, on a wheel **5.5 CSS px across** — half its own diameter, off the road.
  Reproduced independently by the calling session: **−0.0051 shipped, −0.0000 fixed.**
- **Shipped:** one line deleted. Guarded by a check that reads the **axle**, not a bounding box.
- **REJECTED — more segments (12 → 24).** Measured with the bug in place: **209 px/frame against
  203.** It is not an aliasing fault and more segments cannot touch it. **Do not try this again.**
- **REJECTED — scaling the visual rotation below 15°/frame.** With the real fix applied, 0.28× gave
  **39.9 against 41.0** — no measurable effect, and it decouples the wheel from the ground it rolls
  on, which is its own kind of fake.
- **The wagon-wheel effect is not a risk here at any speed under discussion.** A 12-gon 5.5 px across
  has a circular silhouette; six consecutive frames at 6.0 with the fix are identical discs.
- **Watch out — the guard could not see the wheels.** The old check read
  `Box3.setFromObject(T3.tram).min.y`: **0.0000 with four wheels, 0.0000 with all four deleted**,
  because the skirt satisfies it. Ninth guard in this repo to read a proxy for the thing.
- **Not done, logged:** `TRO_SPEED` stays 3.4 for now. Chema signs 6.0 and widens the readability
  ceiling to ~7.9 tiles/s (the 3D window on that row is **9.9 tiles**, not the 10.4 in circulation —
  that number was CSS width ÷ TS and conflated CSS with world). **The wheel ships alone first**, so
  that whatever anyone thinks of 6.0 afterwards, they are judging a tram with wheels on it.
- **Also logged, not proposed:** the tram goes full speed → zero **in one frame at any speed**, and
  the only sign it stopped is a red lamp drawn in **2D only** — `t3Trolley` has no hold state. At 6.0
  the look-ahead gives 433 ms and a 2-tile brake ramp needs 333 ms, so a ramp fits.

### 2026-09-14 · the skulls, measured in all four cameras — and the front camera renders zero

- **Goal served:** a person can always tell what is there. The owner, five reports: the sugar skulls
  on the sills cannot be found without an arrow.
- **Conditions:** #vp 528×423 CSS @ dpr2 (1056×846 device; his frame is 1172), season `muertos`
  forced on, clock pinned 22:00 so every night branch fires, Date.now/performance.now frozen,
  hero at st (5,2). **Control — render twice, change nothing — 0 changed pixels in all four
  cameras, every run.** Method: a thing's pixels are the pixels that change when its ONE painter
  is a no-op. Luminance Rec.709 on sRGB bytes.
- **Measured before, per skull:** front **0 px**. top 192–241 px, ΔL vs wall +44…+53, Weber
  0.39–0.50. iso 176–239 px, ΔL +45…+71, Weber 0.36–0.68. 3d **66–193 px** (16×5 device px far,
  25×9 near), ΔL +106…+139, Weber 1.45–3.04. On screen the flat buffers upscale ×2.72, so
  top/iso give ≈520–660 screen px a skull and 3D gives 66–193.
- **Diagnosis 1 — FRONT DRAWS THEM AND PAINTS OVER THEM.** `drawSillBox` is called 8 times a
  frame and delivers 0 px of sweet, 0 of ledge, 0 of pane, at five positions tested. The fiesta
  is drawn in the ground pass (`engine.js:1946`), the facade's own tile art runs later in the
  row-sorted depth pass (`engine.js:1976`). Suppress `TILEDRAW` for those tiles and the whole
  assembly appears: 992 / 1624 / 1281 px. Only props on SOLID tiles are affected, which is why
  the papel picado never had this and the sills always did.
- **Diagnosis 2 — 3D: the pane is three-quarters swallowed by its own wall.** A three.js Sprite is
  a quad at ONE view-space depth — its anchor's. The anchor is the pane's bottom
  (`engine3d.js:570`, `center.set(0.5,0.02)`) at `p.y+1.03` (`:572`), so every pixel above it is
  drawn at the bottom's depth and the nearer wall wins. 21 projected px tall, 5 arrive. The ledge
  already carries the cure at `p.y+1.08` (`:605`) — which is exactly why the ledge reads.
- **Measured after (not shipped — advisory run, crew mode off):** front 0 → **1006 px**, ΔL +106,
  by replaying the sill box after the facade art. 3d 396 → **1743 px (4.4×)** with pane and ledge
  moved out together +0.09; sweep 0/0.03/0.06/0.09/0.12/0.18/0.25 = 396/832/1301/1743/2066/2112/2083.
- **Recommendation — OCCLUSION, front camera first.** Both are engine RULES: (a) a prop on a solid
  tile joins that tile's row in the depth queue — the slot and its comment already exist at
  `engine.js:1953`; (b) a wall-hung billboard's offset is a function of its own height and the
  camera's pitch, not a constant tuned for one sprite.
- **REJECTED — light.** Measured at 12:00 against 22:00: pixel counts 1057/1066 top, 825/856 iso,
  396/396 3d. **The night wash changes no pixel count anywhere.** It costs top 31% of contrast
  (Weber 0.78 vs 1.13), costs iso nothing, and in 3D it slightly HELPS (1.10 vs 1.05) because the
  sill sprites are never added to `T3.tintables` (zero `tintables.push` in engine3d.js:549–611),
  so the sweet keeps full value while the wall is dimmed by `engine3d.js:834`. Do not chase light.
- **REJECTED — value / the sweet's palette.** It already measures L 158–184 against walls at
  46–127, the largest value separation in the frame; headroom to pure white is ≤ +70 L on a shape
  that is 66 device pixels. This would be the fifth fix of the same kind (POSTMORTEM §1).
  **One exception, logged not proposed: ISO is a genuine value fault** — Weber 0.11, Michelson
  0.054, day and night. Second job.
- **REJECTED — "the ledge is eating the sweet".** Plausible, and false: 396 px with the ledge,
  396 with `drawSillLedge` blanked. Identical. Do not spend time on it again.
- **Watch out — `engine/engine.js:1115` is DEAD CODE.** Four functions are declared twice
  (`drawOfrenda` 1081/1185, `fiestaProps` 1095/1199, `drawPapelRow` 1096/1200, `drawSillLit`
  1115/1219), byte-identical, on a clean `main`. Planted both ways in a lab outside the repo:
  magenta in the first copy → 0 px anywhere; magenta in the second → 160 in the bake, 600 on the
  street. `drawSillLit` is the fifth attempt's own function. A sixth attempt that edits 1115 will
  watch the street not change.
- **Watch out — the guard bought for the word "hidden" reads one camera and the wrong object.**
  `test/smoke.js` (grep `camSet('3d')` near the sill block, and `stone < 3`) counts the LEDGE's
  stone pixels in 3D only. In the front camera the ledge is at zero too and nothing asks.

### 2026-09-14 · the skulls, shipped: the front camera draws them after the wall, and the 3D pane stands proud

- **Shipped (mq-v159), the same day as the measurement above.** (a) **Front:** `fiestaDraw2D` takes a
  `defer` and hands every prop standing on a SOLID tile to the caller's depth queue at `y+0.05` — the
  slot decor already used — instead of painting it in the ground pass; the sill box, the ofrenda on a
  table and a free calaverita on a solid tile all go through it, a prop on the floor paints exactly as
  before. (b) **3D:** `SILL_PROUD=0.09` on the pane and the ledge together, the ledge keeping its 0.05.
  (c) The dead first copies of `drawOfrenda`/`fiestaProps`/`drawPapelRow`/`drawSillLit` are deleted.
- **Measured, front camera, hero at st (5,2), clocks frozen, control 0 px:** blanking `drawSillBox`
  changes **0 px before → 3,864 px after** (640×512 buffer). The suite asks the same question now
  (`test/smoke.js`, grep `frontSill`): the first draft of that check did not freeze the clocks, read
  703 px of tram-and-petal noise, and would have passed on a frame with no sill in it.
- **Not measured today:** the 3D count after +0.09 in the suite (Chema's 1743 stands as his number);
  whether the proud pane collides with a person on the pavement (it sits 0.12 into the pavement tile
  at window height; nobody has stood there and looked). **Not done:** Pili's socket redraw (the flat
  cameras' legibility) — the next fix, if the owner still wants one after this.

### 2026-09-21 · the `mesh` view: shapes from parts, and the first three — the bed, the pot, the shelf

- **The ask, in his words:** *"i still see squares and not polygonal shapes, i thought we logged a
  skill. can we not try this finally?"* The skill existed (how-its-made, which says *model* as well
  as draw); the seam did not. `engine3d.js` built the whole world from `BoxGeometry`, `PlaneGeometry`
  and `Sprite` — 24 boxes, 9 planes, 1 cylinder, 1 torus, counted — so a pack had exactly two answers
  to "what shape is this": a box wearing a picture, or a picture standing up.
- **Shipped (mq-v178): a SEAM, by the standing goal's own test.** `TILEART[g].mesh` (or the flat
  `TILEART_MESH[g]`) answers with a LIST OF PRIMITIVES — `box · sph · cyl · cone` — each with a place,
  a size, a colour and an optional turn or lean, in tile units, y up from the floor. The engine
  (`t3MeshOf`) merges a tile's parts into ONE mesh with vertex colours and one Lambert material, so a
  bed of six marigolds is one draw call; the material joins `tintables`, so the time of day reaches
  it like a texture. `t3MeshTile` is asked before wall, box or billboard, for SOLID tiles and for
  `stand` tiles both. A pack that says nothing gets what it always got: **the town's suite is green
  and its known-flat list is byte-for-byte what it was.** Rotation order is YXZ so a part can lean
  and the whole thing can still be turned to face the room (the shelf faces its first open side).
- **The three, in the pack** (`content/meridian/art.js`, BEAUTIFY, SECOND SITTING): the raised bed
  (curb walls only where the run ends, a cylinder lip along each, soil, six pom-pom heads on stems with
  the crown sphere upper-left, four flattened leaf spheres); the potted plant (a tapered pot, a rim,
  soil, five leaf masses turned per tile — twenty of them were one picture); the shelf (two uprights,
  a back, four boards with depth, and on them the same runs of spines, the leaning one, the stack and
  the carton the side art paints, as boxes you can see between).
- **Measured, default camera, hero at the sheet's spots, the harness reading `renderer.info` and
  counting `userData` in the scene.** Draw calls went DOWN everywhere a mesh replaced boxes or
  sprites, triangles went up by amounts a phone does not notice:

  | world | calls before → after | triangles before → after | mesh / flat / box after |
  |---|---|---|---|
  | pk | 76 → 61 | 162 → 5,904 | 7 / 7 / 0 |
  | me | 183 → 153 | 366 → 2,022 | 9 / 0 / 12 |
  | no | 292 → 282 | 584 → 1,694 | 4 / 0 / 7 |
  | hq | 466 → 466 | 932 → 1,490 | 1 / 0 / 5 |
  | ta | 235 → 215 | 470 → 1,574 | 6 / 3 / 8 |
  | st | 393 → 383 | 786 → 4,242 | 4 / 9 / 0 |

  **And then the screenshot** (`docs/mocks/2026-09-21-contact-sheet/after-second-sitting/`): the beds
  are beds with a lip you can see round, the pot is a pot, the shelves have insides.
- **The audit did its job first.** `test/engine.smoke.js` #39 went red the moment the art landed —
  *"P" is no longer flat in 3D — take it off this game's row* — and `P` came off Meridian's row. The
  list shrank because the guard said so, which is what it is for.
- **A rule in this log just changed, and is reported rather than absorbed:** sentence 2 of the
  standing goal — *"Billboards are for round, leggy, organic things; boxes are for things with
  corners (Pili's rule)"* — had two shapes because the engine had two. It has three now: **a mesh
  from parts for anything with a form** — round things included. Billboards remain right for leggy
  things (agility poles, a trolley sign) and for the tree's crown, which is the best prop in the game
  and was not touched. `docs/IDEAS.md`'s 2026-09 note that realism here comes from *"value structure
  and standing geometry, not from polygon count"* still holds: these are ten-segment primitives with
  flat colour, standing geometry by construction, and nothing here imports an organic mesh.
- **Not measured today:** frame time on a phone (the harness is headless); the seam's cost at a
  hundred meshes in one world — the shelf is 24 parts and the market has seven. **Not done:** the
  iso camera still draws every one of these as a coloured block (`docs/BEAUTIFY.md` row 5); the
  tree's trunk is a box and its crown a picture, by choice; the crates and counters stay textured
  boxes, which is what they are.

### 2026-09-21 · five more shapes: grass, the cone, the doghouse, the tree with its dress, the altar — and the marigolds back

- **The ask:** *"lets try the grass and the cones, dog house, and altar. we are now missing the marigold
  in the bushes though. can we also do the tree with its decor?"* — after playing the `mesh` view for
  ten minutes. Same seam, same builder; two small additions to the engine: a `torus` primitive (an
  arch is a torus with an arc) and a hook in the season-prop pass so a prop asked for BY KIND —
  `"prop:ofrenda"` — goes through the same table as a glyph. `mq-v179`.
- **What each is made of** (`content/meridian/art.js`, BEAUTIFY, THIRD SITTING): grass is blades from
  one root, cones leaning outward, the ones toward the light longer and paler, one gone to straw — the
  tile is `stand` now, so the 3D camera asks for the shape and the front and iso cameras keep their
  paint; the cone is a moulded base, a cone and a band that is a slice of the same cone in white;
  the doghouse is a shed — body, two roof slabs meeting at a ridge, an arched door, the bone — facing
  its first open side; the tree is a tapering trunk with two branches, six leaf masses, blossoms on
  the outside of the crown in the season's bloom colour, and in season the dress from `canopyDress`'s
  recipe in parts: a garland across the front, three papel streamers hanging below, one lantern; the
  ofrenda is the 2D drawing's parts built — cloth, tier, an arch of marigolds, three candles with
  flames, the empty frame, pan de muerto, a calaverita, two cups, cut paper along the front. The bed's
  marigolds went from six heads at r 0.075–0.10 to eight at r 0.11–0.15 with buds: **a scatter of dots
  became a mound**, which is the difference the owner saw on a phone.
- **Two things the lit shading taught.** A sprite is never shaded; a mesh is. The tree's and the
  grass's greens copied from the sprites came out a step too dark in daylight and were lifted once,
  by eye, after the first frame — the rule is *a lit mesh takes paler paint than the picture it
  replaces*. And the hero standing behind a mesh crown is occluded by it, where the sprite crown was
  a picture at one depth; nothing hides the player yet — noted, not fixed (the wall stub and the glass
  are the precedents, `docs/3D-LOG.md` 2026-09-09).
- **Measured, default camera, `renderer.info` and `userData` counted, eight frames** (in
  `docs/mocks/2026-09-21-contact-sheet/after-third-sitting/`):

  | frame | calls | triangles | mesh / flat / box |
  |---|---|---|---|
  | pk, the sheet's spot | 65 | 11,662 | 17 / 3 / 0 |
  | pk, beside the doghouse | 75 | 16,508 | 17 / 3 / 0 |
  | st, beside a tree | 499 | 7,824 | 12 / 3 / 0 |
  | li, beside the cone | 245 | 2,010 | 6 / 0 / 4 |
  | pk, the altar, Día de Muertos on | 108 | 20,544 | 18 / 3 / 0 |
  | st, the dressed tree, season on | 565 | 9,192 | 12 / 3 / 0 |

  Against the previous sitting's park frame (61 calls, 5,904 triangles): four more calls for the
  grass tufts now standing, twice the triangles for eight meshes more. The three `flat` left in the
  park are the agility gear, which is leggy and stays a billboard on purpose.
- **The audit did its job first, three times:** `9`, `C` and `J` named red the moment the shapes
  landed, and came off Meridian's row. The crown guard (*"a pack declared what its tree looks like
  and the engine drew its own anyway"*) went red too, because it looks for a crown texture and a
  mesh tree has none; it accepts a mesh tree now, and the crown path is still walked by the town's
  run of the same file, where no mesh is declared.
- **Known-flat in Meridian after tonight:** `3 4 5 7 A W X Y` — the agility gear, the car lift, the
  drafting table, the fridge, the site sign, the trolley stop. The town's list is untouched.
- **Not done:** the ofrenda shows only in season (Día de Muertos, 10/18–11/3, or the Settings pick);
  the hero behind a crown; the iso camera still draws every one of these as a block.

### 2026-09-21 · the second try on the marigolds and the dress; tables; poles; the altar in detail; the cone's base

- **The ask:** *"the marigolds can use another try and same with the decor. please update, tables too,
  poles with the paper picado and please try to add more detail to the altar. the cone looks better
  but it overwrites/paints tiles."* `mq-v180`.
- **A marigold is not a ball.** Eight spheres read as eight balls from a phone. A cempasúchil is a
  pom-pom of ruffled petals: `meshMarigold` builds a core wider than tall, nine lobes round its upper
  half — the lit side in the crown colour, the shaded side in the undercut — a crown sphere where the
  key lands, and the green calyx cup it sits in. One helper, so the bed, the tree's garland and the
  altar's arch grow the same flower. The bed's stems carry leaves in pairs, which is how the plant
  carries them. **The cost is triangles:** the park went from 11,662 to 33,502 and the frame beside the
  three beds to 52,908; the altar frame is 81,464. Trivial for WebGL on a phone, and the draw calls did
  not move (65, 75, 111) — one mesh per tile is still one mesh per tile.
- **The dress reads as decorated now, not repainted:** `meshPapel` strings a line between two points
  and hangs paper flags from it, so the tree wears a string of flags across the front of its crown and
  one down the side (the turn shows it), a chain of seven ruffled marigolds slung under the flags,
  three streamers hanging well below the crown with a scalloped hem in a second colour, and one
  calaverita lantern with eyes and a flower on its brow.
- **A string hangs from something at its own height — a RULE, in the engine.** The swag pass skipped
  the pole for any SOLID end, so the park's strings hung in the air above a knee-high fence. Tall now
  means kind wall/facade/tree or lift ≥ 9; anything else gets a pole — a cylinder with a ball cap.
  The town has swags and gets the same rule; its suites are green.
- **The tables** are round tables built as made: pedestal on a foot, the top, a check of red squares
  clipped to the circle for the gingham, two plates, two chairs facing each other with a seat, a back
  and four legs. La Cocina from the default camera: 203 calls, 6 meshes, 15 boxes (the counters).
- **The altar** has three tiers as an ofrenda is built, an arch of nine ruffled marigolds with cut
  paper across it and legs to the ground, seven veladoras in glass, three calaveritas, two pan de
  muerto, oranges, a glass of water, salt in a dish, copal lit in its burner with smoke, the empty
  frame at the top, cut paper across each tier's front, and a path of loose petals on the ground —
  the way is shown.
- **The cone's base** was dark orange and 0.34 wide: from above it read as paint on the tile. It is
  black rubber, 0.30, with the moulded step the cone stands on — a thing on the tile.
- **Not done:** the hero behind a mesh crown is still hidden by it; the iso camera; the marigold
  helper is nine lobes per head and the park has 64 heads, which is where triangles went — a cheaper
  head for distant beds is the next optimisation if a phone ever stutters, and none has been measured.


### 2026-09-21 · crew iteration 11: the marigold by a botanist, fourteen shapes by two builders, Pili's direction — and the lid

*The method these five sittings arrived at — the seam, the ten steps, what the marigold taught — is one
file now: `.claude/skills/shapes/SKILL.md` (owner, the same day: "did you log how we can recreate this
new polygonal update for all these and what we or you learned from marigolds?"). Merged as #224.*

- **The ask:** *"everything looks good except the marigolds. lets do a crew mode to try to fix as many
  things but lets have an expert on flora help the design on the marigolds so they are realistic …
  computers, rails, fences, coffee machines, fridge, bridge, petals, trolley, desks, fruit stands, car
  lifts, tires, car,and tool boxes. make sure even mural gets done please."* `mq-v182`. Run
  `docs/runs/2026-09-21-claude-d8e4.md`.
- **The lid (Pili).** An engine box wears its TOP-DOWN drawing on its lid (`t3BoxMats` → `t3BakeGlyph(g,true,…)`)
  and takes its height from the tallest ink in the side drawing. That is why the café counter's cups
  lay face-up on the counter top the size of chairs, and why four of the owner's fourteen looked wrong
  at once. A mesh deletes the lid. **The light** is one ambient 0.66 and one sun 0.42: a Lambert face
  comes out top 1.00 / east 0.88 / south 0.78 / west-north 0.66, so a value difference must be PAINTED
  into the parts (plan Δ50 to land Δ40 after `tc()`), and a sphere under r 0.12 reads as a hexagon.
- **A marigold is a stack of whorls, not a ball (la botánica).** Florets with their base on the
  receptacle and their tips lifted by whorl read as a marigold at the first crop; three tries of "a
  bigger ball" had not. Hue is decided per plant at sowing, value per whorl by growth, the turn per
  head by the seed — each at its own step. Twelve heads a bed, packed to touch; foliage near-black
  UNDER the heads. **And the bed's seed `(x*7+y*13)%7` was constant along a row**: three beds in a
  row were one bed pressed three times, in every frame the owner had seen. `(x*5+y*3)%7` now. Cost:
  the park frame 52,908 → ~153,000 triangles, draw calls unchanged.
- **The pad — a RULE, in the engine.** The ground bake darkens a tile from its solid neighbours and
  never a solid tile's own floor, so every mesh object stood on a bright square. A mesh tile now
  darkens the ground under it (a radial pad in the bake). Both games, same rule.
- **Seven shapes in the garage and the offices (el taller):** a desk with its monitor, keyboard and
  chair, facing the room the drawing faces (`meshFacing`); the café counter run-aware with the machine
  once, at the run's `(x+y)%3===2` tile; the fridge with its handle; the tool chest on casters; three
  tires as tori; the Caprice a tile and a half long; the two-post lift with a blue customer's car up
  on it (the drawing's hex, not the Caprice — the brief was wrong). `6` and `0` were never boxes but
  sprites the Taller's ribbon lays at district two, which the flat audit, walking at chapter zero,
  never counts: measured, the apron at `ch:2` reads `flat:3` without the meshes and `flat:1` with.
- **Four shapes in the street and the park (la calle):** the picket fence as one post a tile, two rails
  through the tile edges on the yard side, four pickets off one jig on the street side, a corner at the
  corner post, a run ending at its post, and the run by the same GLYPH — the barricade beside the crew
  pen is kind `fence` too, and the kind is what stood the engine's panels at 90° in mid-air there. The
  crate: four proud corner posts, three slats a side, a rim, and ONE kind of produce a crate (tomatoes
  mounded and spilling the front row; chiles lying; hands of bananas). The counter: one carcase the
  length of the run, plank joins on the world grid, end panels only at the ends, the scale once at the
  head. The rail round the well: a glazier's frame minus the glass — a pane drawn as a pale sheet was
  a bathtub wall that hid the flight. In season, a crest of petals along the fence's foot within three
  tiles of the bridge (`meshPetalCrest`: a dark under and flat petals standing a hair proud).
- **`tc()` tints every mesh part with no opt-out** — the persona rule that a tint must not touch
  identity colours is false in the mesh path. Recorded, not changed.
- **The engine half, built the same sitting from the smith's parts lists
  (`docs/mocks/2026-09-21-contact-sheet/crew-11/calle/`; frames under `…/crew-11/engine/`):**
  - **The bridge.** `^` is neither SOLID nor `stand` and the bridge branch `continue`s before the
    hook, so the seam lives inside the branch, after the deck and the rails: `tileView("prop:bridge","mesh")`
    gets `{x,y,ew,cam,slp,h,edges,pet}` and its parts are laid at the deck's own height and slope —
    ADD, never replace; `test/smoke.js` still reads four decks, the rails and the camber. The pack
    answers with a stringer beam along the bottom of each open side, a nosing worn pale along the top
    edge, and in season the crest inside the rail line.
  - **A drift banks against what stands beside it — a RULE, in `petalSpill`.** By distance alone the
    spill was a circular stain round the deck. Twice the count with a SOLID neighbour, four tenths in
    the open (all four neighbours walkable); the count is in the bake's key so the cache stays honest.
    Both games; `test/smoke.js`'s spill counts hold (the water beside the deck has the deck as a
    neighbour and is unchanged).
  - **Glass.** `t3MeshOf` is at file scope now (it was a closure inside the world builder) and a part
    with `a:` under 1 goes to a second mesh — transparent, no depth write — hung as a CHILD of the
    tile's mesh, so everything that walks the group still sees one object per tile. The rail round the
    well has its pane back at 0.45: the flight shows through it, and the frame says where the edge is.
  - **The trolley's body is the pack's.** `tileView("prop:tram","mesh")` gets `{len,h,fl,cab}`; the
    engine keeps the four WHEELS (it spins them) and the DRIVER (he changes ends) and adds the body
    mesh beside them, flipping its `scale.x` with `TRO.dir` each frame so the pole leans back
    against the travel whichever way it goes. Rigo's paint rule (a dark skirt and panel to the waist,
    a light band round the windows), a roof that overhangs with a drip lip, a clerestory, the pole,
    headlamps, a bell, fenders, grab rails on the open platforms. **The wheel guard fires at four now,
    not two** — planted first in a copy outside the repo with one axle's pair deleted: *"the trolley
    has 2 wheels — a tram that rolls down a street has wheels you can see"*, exit 1.

### 2026-09-24 · #241 — "The barbería on Calle Dos looks like somebody's house"

- **The ask** (the issue's own *Done when*): standing on the pavement at phone size, it reads as a
  barbershop and not as a house, in the top, front and 3D cameras; its door still opens into Naye's
  shop; the houses beside it unchanged.
- **What was made — `◫`, EL ESCAPARATE, in the order a barber fits out a front room.** The house
  first and untouched (`casaBase`, `casaShell`: it IS the same small house). Then the window knocked
  wider into one pane, with the chair's back and the mirror inside where the street can see them; a
  striped canvas awning over each window with a blue valance; and one pole on a wall bracket, standing
  0.15 off the wall, carried by whichever tile has the door as its east neighbour. The awning is the
  outline change that reads first; the pole is the one that says *which* trade.
- **What it cost:** about 60 parts on the pole's tile and 45 on the other, one mesh per tile as
  before; no draw calls added. No phone measured.
- **What it taught.** An outside agent's round (#244, closed) put two thin poles and bluer glass on an unchanged
  outline, then fixed the count of poles by turning one window back into a house. The outline was the
  whole job, and the fix for "two" is to ask the street which tile is beside the door, not to take a
  tile away.
- **A guard measured a stand-in, and the awning found it.** `test/smoke.js` (10), the sweet's pane,
  counted anything wide and proud between 12% and 92% of the wall as a buried sill. It now counts a
  part only where it stands between the pane and the camera: the pane's top edge and the camera's
  pitch are read off the scene, like the pane's depth already was. Four plants outside the repository
  stay red; `docs/REGRESSION.md` row 31. The awning's valance was raised 0.02 to clear that sightline.
- **Not done:** the iso camera still draws `◫` as a coloured slab (an engine limit #241 names). The
  flat cameras cannot centre the building — it is the last three tiles of the row — so there the
  corner buttons cover part of it; the awnings still read between them.
- Frames: `docs/mocks/2026-09-24-barberia/`.

### 2026-09-30 · #271 — the builder's drone: a thing in the air, and the ground under it

- **The drone is a billboard in the actor pool**, painted by the same `drawDrone` the flat cameras
  call, with depth testing off and drawn last (`renderOrder` 2000). It is in the air and it is what
  you steer, so it takes #22's rule — never hidden. While it flies, the hero is no longer the one you
  steer and stands behind walls like everyone else; with the drone down he is exactly as before.
- **Rejected: a drone with nothing on the ground.** Over a storefront row it read as a sticker on the
  facade behind it (frame, 2026-09-30). What fixed it: the lamp's four lit corners on its tile and a
  small contact shadow under it — two flat planes kept in the SCENE, not the group, because the group
  is rebuilt with every world. The corners sit on the tile's real top (`t3TileTop`: the floor, a
  tread, or `t3Top` of the tallest thing built on it).
- **The camera, the wall cutaway and the tram's see-through follow `focusXY()` / `focusTile()`,**
  which are the hero's own `fx,fy` / `px,py` whenever the drone is down — the reason both games draw
  exactly what they drew with the builder off.
- **Measured:** the drone covers 2–4% of the middle of its tile in 3D; the hero covers 43–63% of his,
  depending on the tile. Frames: the session scratchpad (`shots/after-*`), not committed.
- **Not measured:** the corners over a tall, thin mesh tile — `t3Top` is right for a box, and nobody
  has flown the drone over the jacaranda yet.

### 2026-10-03 · #317 — what the 3D scene costs, measured headless as a stand-in for a phone

- **The ask:** a number on record before the costlier lanes land, and the same measure after each.
- **Made:** `test/scenecost.js`. Headless Chromium at 390×844, device scale factor 3, touch; the whole
  city raised; the season pinned (`--season`, year-round by default, so two dates measure one city).
  For every world: draw calls and triangles in one frame (`renderer.info`, hero on the walkable tile
  nearest the middle, first camera stop), triangles in the whole scene from that spot (every
  triangle whose object and parents are visible — the cutaway's hidden walls are not counted),
  `t3Build` timed where `draw3d` calls it, and 120 frames of `draw3d` each followed by a one-pixel
  read so the frame is finished — at this machine's speed, then with the page's processor slowed ×4
  (`Emulation.setCPUThrottlingRate`; the slow-down is measured on a fixed piece of script unslowed and
  then slowed, back to back, just before the slowed pass). A frame counts only when two things hold:
  its read proves the 3D context lives (the pixel is seeded with alpha 0, and a live read of this
  canvas returns 255), and the renderer's draw-call count for that frame, read after the timed span,
  proves the renderer sent it — a skipped draw leaves the last frame in the buffer, so the read alone
  returns 255 off a frame that never happened. Its first printed line says it is a stand-in, not a phone.
- **What a stand-in is not.** There is no GPU here: WebGL is SwiftShader, software, in the browser's
  GPU process, and the ×4 does not reach it. So *frame* is mostly a CPU rasterising a 996×1164
  antialiased buffer; *script* (`draw3d` alone, before the wait for pixels) is the part the ×4 does
  slow. A phone has a GPU and a slower everything else. Compare runs with each other, never with a phone.
- **Figures, year-round, mq-v229** (the last of three runs that hour; times in ms):

  | world | calls | triangles in view | whole scene | build ×1 → ×4 | script ×1 → ×4 | frame ×1 median / p95 |
  |---|---|---|---|---|---|---|
  | hq | 451 | 2,866 | 3,826 | 26 → 104 | 3.2 → 14.8 | 53 / 74 |
  | f2 | 184 | 1,136 | 4,804 | 31 → 94 | 2.2 → 10.1 | 35 / 50 |
  | st | 366 | 65,606 | 86,190 | 171 → 609 | 2.2 → 9.8 | 83 / 108 |
  | ex | 151 | 28,978 | 43,364 | 72 → 272 | 2.2 → 9.9 | 72 / 94 |
  | lo | 215 | 2,282 | 3,800 | 13 → 45 | 1.3 → 6.6 | 38 / 50 |
  | me | 173 | 19,528 | 27,248 | 69 → 167 | 2.0 → 9.0 | 49 / 64 |
  | lc | 170 | 6,974 | 12,476 | 40 → 124 | 1.4 → 6.0 | 40 / 58 |
  | ta | 169 | 4,802 | 7,736 | 30 → 66 | 1.6 → 7.7 | 39 / 48 |
  | pa | 179 | 8,532 | 12,426 | 24 → 78 | 1.9 → 8.2 | 42 / 53 |
  | li | 179 | 5,980 | 8,302 | 28 → 69 | 1.5 → 7.2 | 44 / 65 |
  | no | 219 | 2,478 | 5,434 | 13 → 67 | 1.4 → 7.4 | 37 / 45 |
  | pk | 41 | 105,522 | 172,242 | 290 → 1,006 | 1.1 → 4.4 | 89 / 113 |
  | casa-w | 205 | 2,576 | 2,588 | 7 → 30 | 1.4 → 6.9 | 39 / 57 |
  | caseta | 160 | 586 | 586 | 3 → 14 | 1.1 → 5.8 | 29 / 35 |
  | barberia | 206 | 2,320 | 2,332 | 6 → 53 | 1.4 → 6.6 | 40 / 67 |

  **Día de Muertos** (`--season muertos`, same hour), whole scene: st 119,754, ex 85,226, pk 219,142,
  casa-w 18,632 (seven times its year-round); pk 121,842 in view; builds ×4 st 830, pk 912; script ×4
  hq 17.3 with 471 calls.
- **What they say** — each one relative, a world against a world or a season against the year, at the
  same slow-down; none of it is a phone's frame rate. (1) The page's per-frame work follows **draw
  calls far more than triangles**: hq, 451 calls and 2,866 triangles, costs about ×3.4 the park's
  script a frame (14.8 against 4.4 ms at ×4); the park has 41 calls and 105,522 triangles. In season hq
  gains 20 calls (451 → 471) and its script at ×4 read 17.3 against 14.8 — one run each, inside the
  run-to-run spread below, so a direction and not a size. (2) **The hitch is the build**: the first walk into the park
  or Calle Principal at ×4 holds 0.6–1.0 s of building, then 0.4–0.9 s of first frame here (kept
  afterwards, `T3CACHE`; the first frame is mostly the software upload). The figures in the comment
  above `T3CACHE` in `engine/engine3d.js` — 1.4 to 18.4 ms a world, 111 ms for all fifteen — are no
  longer what a build costs: all fifteen take 0.82–0.85 s at ×1 here (a different harness and a
  bigger city, so a trend, not a like-for-like). Recorded, not changed: this lane changes no engine.
  (3) Triangles are the GPU's cost, which this cannot see; the park carries the most by far.
- **How much to trust a time.** A shared four-core machine with other builders running: load 2.7 to
  9.9 across the runs that gave figures, printed at the start and end of each. Calls and triangles
  repeat exactly run to run (except a person walking into view: pa 178 or 179, li 179 or 180). Over
  three year-round runs the script medians at ×4 moved within a third (most under 15%); builds at ×4
  as much as ×2.4 (me 163 to 384); frames at ×4 most of all (pk median 113 to 240).
- **A crash, not explained.** The first `--season muertos` run died before printing a world (*Target
  page, context or browser has been closed*); the next two completed. The script now prints each world
  as it is measured; when the page crashes, the page closes or the whole browser goes away it says which
  of the three and the world it was drawing, and any other break names that world in its FAIL line.
- **Not a CI step:** about 5 min year-round, 6–7 min in season, where the whole CI job is 3 min 47 s;
  and it asserts no budget, so in CI it would print times that move with the neighbours into a log
  nobody reads. The script prints how long it took and decides nothing from it.
- **Red, not a number** — each planted in a copy outside the repository: the 3D library missing; a
  shell that declines 3D; a world whose scene draws nothing; a world that never reaches the renderer;
  a world that stops drawing part-way through its frames; every world served from the cache; the
  slow-down not sent; the page crashing mid-run; a world list that matches nothing; fewer than 120
  frames. After review, three more, all in the park as the last world measured. Two would otherwise
  have ended green: the 3D context lost at a frame part-way through (`forceContextLoss`); the
  browser's GPU process crashed (`Browser.crashGpuProcess`). The third, the whole browser killed
  (`Browser.crash`), was already red and named no world; it now names the park. The GPU-process crash
  was caught by the seeded pixel alone: at the frame that went red, `isContextLost()` was still false
  and no `webglcontextlost` event had arrived (a probe in a copy, Chromium 141). After the recheck, one
  more: from frame 52 of the park at ×4, `renderer.render` made a no-op while `draw3d` still said it
  drew — what a "don't redraw when nothing moved" saving would do. The pixel read went on returning 255
  off the frame before, the park's ×4 frame median read 1.3 ms and the run was green; with the
  draw-call count read after each timed frame it is red at frame 52 (*the renderer sent nothing*).
  Today's engine cannot reach it — `draw3d` calls the renderer on every path that says it drew — so no
  figure above is touched; what it corrected was the claim that the read proved a frame drew.
- **Rejected:** counting rAF frames (headless throttles rAF — this log's own table); timing `draw3d`
  without the pixel read (that times the asking, not the drawing).
- **Open:** a real phone's reading, and which slow-down stands for a mid phone (#317's question) —
  and with it whether hq's script at that slow-down sits under or over a 60-frames-a-second frame
  (16.7 ms): on this instrument, run to run, 14.8 to 16.0 year-round and 17.3 in season are one reading;
  camera stops other than the first; the town. *Still open* 4, the named baseline, is half done: the
  numbers are named, the frames are not looked at.
