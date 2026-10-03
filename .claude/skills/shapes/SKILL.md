---
name: shapes
description: Give a thing a SHAPE in the 3D camera — the `mesh` view recipe, from the 2D drawing to a rendered frame at phone size — and what the marigold taught. Load before drawing any object as parts, before re-doing one that "still looks like a box", and before briefing an agent to do either.
---

# Shapes — the polygonal recipe, and what the marigold taught

*Opened 2026-09-21, when the owner asked "i still see squares and not polygonal shapes … can we
not try this finally?" and then, five sittings later, "did you log how we can recreate this new
polygonal update for all these and what we or you learned from marigolds?" This is that log. The
sittings themselves are in `docs/3D-LOG.md` (the four entries of 2026-09-21) and the register is
`docs/BEAUTIFY.md`; this file is the method, so the next thing takes one sitting and not five.*

**THE PORTABLE HALF OF THIS FILE LIVES IN `shaping`.** Silhouette before colour, the light's range,
variation that moves on both axes, render-and-look, "wrong three times means rebuild not re-tune",
and how to brief somebody else — none of that is about this engine, and `.claude/skills/shaping/SKILL.md`
carries it with no file paths in it so it can be installed into any project (`./install-skills.sh`).
**This file is THIS engine's version**: the seam, the library, the guards, the suites and the bump.
Where the two overlap, the craft is stated once, there; where they differ, here is the one that knows
what `TILEART_MESH` is.

## What the seam is, in one paragraph

The 3D camera builds a tile from a LIST OF PARTS when the pack declares one: `TILEART_MESH[g]` in
**your pack's** `art.js` (`content/meridian/art.js`, `changarrito/content/art.js`, or whatever
`content/<world>/art.js` you are building — this seam belongs to every pack, not to Meridian), or
equivalently `TILEART[g].mesh`, a function `({x,y}) => parts` or a plain list.
A part is `{s:"box"|"sph"|"cyl"|"cone"|"torus", x,y,z, w,h,d | r | rt,rb,h | r,t,arc, c:"#hex",
rx,ry,rz, sx,sy,sz, a}` in TILE UNITS — a tile is 1.0, a person is about 1.0 tall, y is up, the
tile's centre is (0,0). The engine (`engine/engine3d.js`, `t3MeshOf`) merges the parts into ONE mesh
per tile with vertex colours and one Lambert material, low-poly on purpose (sphere 8×6, cylinder 10,
cone 8). Rotation order is YXZ: a part can lean (`rz`) and the whole thing can still be turned to face
a door (`ry`). A part with `a:` under 1 is glass — a second, transparent mesh hung under the tile's.
Three keys are not glyphs but KINDS the engine builds itself and asks the pack to dress:
`prop:ofrenda`, `prop:bridge` (the engine keeps its deck and rails and ADDS the pack's parts) and
`prop:tram` (the body; the wheels and the driver stay the engine's). `docs/NEW-WORLD.md` and
`docs/TAGS.md` L15 say the same.

**Who gets a shape:** a SOLID tile (the hook runs before wall, box and billboard — `t3MeshTile`), or
a tile with `stand:true` in `TILEMETA` (grass). A tile that is neither — water, the bridge deck `^`,
a door — never reaches the hook; the bridge got its own key for that reason. If your thing is not
SOLID and you add it to `SOLIDX` in your pack's `maps.js` (Meridian's is
`content/meridian/maps.js`, the town's is `changarrito/content/maps.js`), say `ASSUMED:` in the comment —
nobody decided people cannot walk through it, the drawing needed a box.

## Step 0 — LOOK IN `SHAPES` FIRST, before you draw anything

*Added 2026-09-22, crew iteration 14, when the engine got a shape library.*

`engine/shapes.js` holds the engine's own shapes, **named by what they are** rather than by a
letter: `plant · tree · desk · table · crate · shelving · fridge · stove · counter ·
draftingTable · picketFence · wellRail · doghouse · hurdle · tunnel · weavePoles`. `SHAPEBIND` in the same file says which letters
this engine reads them as (`P J D T H S W V K A F ◺ 9 3 4 5`). The last three are turned by the line the
park dog runs, not by `facing` (mq-v232).

**THE RULE, and it is the one thing to carry out of this step: an engine default may only fill a
hole. It never replaces a drawing, and it is never assumed — it is TAKEN.** A pack names the
letters it accepts in a `SHAPETAKE` string; saying nothing takes nothing. The gate in
`engine/engine.js` then still refuses a letter you named if you already answered for it (`mesh`,
`TILEART`, `TILEART_SIDE`, `TILEMETA`), if it can never stand, or if it is **already drawn standing
up** — a solid with a `side` drawing is built as a box wearing its own art on the lid and four
faces, and the `mesh` view has no texture channel, so a shape there deletes the drawing.

Both halves were bought on 2026-09-22 by the same mistake in two shapes:

- **Silence is not consent.** The engine's `H` is an open produce crate; El Changarrito means a
  RACK by `H` and had never drawn it, so every "did the pack say something?" question answered *no*
  and six crates of tomatoes stood up in the bedrooms. One letter, two objects — the third time,
  after `I` (counter vs storefront) and `b` (marigold bed vs a shadow with nothing over it).
- **A shape is not automatically better than a picture.** Binding `K` and `T` replaced a counter
  with a coffee machine on its front and a table with a gingham cloth and two plates with bare
  vertex-coloured blocks — 71 tiles — and the guard that was watching counted triangles and scored
  it as 71 tiles fixed.

So, before step 1:

1. **Is the thing you are about to draw already in `SHAPES`?** If it is, and your world means the
   same object by it, you are done and you write nothing at all. Check by NAME, not by letter —
   your world may spell shelving `▯`, and `const TILEART_MESH={"▯":o=>SHAPES.shelving(o)};` is the whole job.
   **The arrow is mandatory.** `engine/boot.js` is the last script tag in both shells and it is what
   loads `engine/shapes.js`, so your file runs BEFORE `SHAPES` exists: `{mesh:SHAPES.shelving}` is
   built at pack-evaluation time and throws "SHAPES is not defined". The arrow defers the lookup to
   draw time, which is long after. **And you must DECLARE the table** — a world that has never
   written a mesh has no `TILEART_MESH`, so `TILEART_MESH["▯"]=…` throws too. Both halves were
   planted against El Changarrito on 2026-09-22; the eager form, the undeclared form and
   `{mesh:SHAPES.x}` all failed, and only the line above printed OK. It was documented wrong in five
   places first.
1½. **Does your world mean the same OBJECT by that letter?** Not the same kind of thing — the same
   thing. A rack and a produce crate are both furniture you put goods on, and they are not the same
   object, and no test in this repository can tell them apart. Only you can. If the answer is no,
   leave the letter out of `SHAPETAKE` and say so in a comment there.
2. **Is the LETTER already bound?** If `SHAPEBIND` names your letter and you draw it anyway, **you
   are writing an OVERRIDE** — the gate will step aside and your art will win, silently. That is
   often right: Meridian overrides eleven of the thirteen because its crate carries tomatoes and
   its jacaranda carries papel picado. But it is a decision, so **say why in the comment above your
   function**, in one sentence, naming what your version has that the plain one does not. "It is a
   festival" is a good reason. "I did not look" is the one this step exists to stop.
3. **If the engine's shape is nearly right, fix it in the ENGINE, not in your pack.** A crate that
   needs deeper slats needs deeper slats in every world. A crate that needs tomatoes in it is
   yours. The test is whether the change is true of the OBJECT or true of your WORLD.

The plain shapes are deliberately plain: the festival, the season and the local colour live in the
pack, and what is left when you take those off is what belongs to the letter.

## The recipe — ten steps, in order

1. **Read the 2D drawing as the bill of materials.** `TILEDRAW[g]` and `TILEART_SIDE[g]` say what
   the thing is made of, in what colours, and which way it faces. Count the parts on the drawing
   before you write a line — the mechanic found a blue customer's car where the brief said the
   Caprice, and three tires where it said four, by counting.
2. **Build it the way it was built** (`.claude/skills/how-its-made/SKILL.md`). A fence is posts set in
   the ground, rails nailed on, pickets nailed to the rails; a crate is corner posts, slats and a rim,
   and then what a hand set in it. Assemble in that order and the joints come out right. Variation
   enters at the step it entered and nowhere earlier: pickets off one jig are one width, one point,
   and differ only by how they were nailed.
3. **A run is one object.** A counter four tiles long is one carcase: plank joins on the WORLD grid so
   they run through the tile edges, end panels only where the run ends, the scale ONCE at its head.
   Read the neighbours through `CW().rows` — by the same GLYPH, not by kind (the barricade beside the
   crew pen is kind `fence` too, and reading the kind stood panels at 90° in mid-air). A shape that
   continues into the next tile must reach the tile line; `test/smoke.js`'s fence guard checks
   exactly that, per direction, and a run's end stops at its post.
4. **Know the light before you pick a colour.** One ambient 0.66 and one sun 0.42: a Lambert face is
   top 1.00 / east 0.88 / south 0.78 / west-north 0.66, and that is ALL the shading you get. So paint
   the value differences INTO the parts — rails a step darker than pickets, foliage near-black under
   the heads, the crate's mouth darkest — and plan a difference of 50 to land 40, because `tc()` tints
   every part with the day and the night. A sphere under r 0.12 reads as a hexagon. A lit mesh takes
   paler mid-tones than the sprite it replaces, and keeps the sprite's saturation.
5. **Silhouette first, then value, then colour.** At the default camera (7.4 tiles back, 6.2 up,
   40°) a tile is about 35 px on a phone. What reads at 35 px is the outline: a head with petals, a
   crate whose contents mound ABOVE the rim, a tram with a pole over its roof. What does not read is
   detail inside the outline. If a thing "still looks like a box", its silhouette is still a box.
6. **The seed reads both axes.** `(x*7+y*13)%7` is constant along a row, so three beds in a row were
   one bed pressed three times in every frame the owner had seen. Use two coprime multipliers that
   move on both axes (`(x*5+y*3)%7`), and crop the row at 3×: if two tiles match pixel for pixel, the
   seed is not reading both.
7. **Render, in the real game, at phone size — and look.** A scratch copy of `test/shots.js` with a
   spots list; the shot goes under `docs/mocks/<date>-…/`. Twice a number said a thing was fixed and
   the owner's eyes said it was not, and his eyes were right both times. Look at the frame BEFORE
   you reason about it (the round-1 pane looked right in the code and was a bathtub wall in the
   frame).
8. **Run both engine smokes and the pack's suites.** `node test/engine.smoke.js --index index.html`,
   `--index changarrito/index.html`, `test/smoke.js`, `test/town.smoke.js`, `test/gauge.js`. The
   known-flat list in `test/engine.smoke.js` (`FLAT_BY_GAME`) only shrinks: take your glyph out of it,
   red first. If you wrote a guard, plant its violation in a copy OUTSIDE the repository and quote what
   it printed (`.claude/skills/guard/SKILL.md`).
9. **Bump.** Your pack's `art.js` and `engine/shapes.js` are both precached (see `sw.js` ASSETS); `test/bump.js` in CI compares each push with the
   previous one, so every push that touches it moves `GAMEV` in both pack configs and `CACHE` in
   `sw.js` together — even the second push of the same branch.
10. **Write it down where the next person looks:** an entry in `docs/3D-LOG.md` (what the ask was,
    what was made, the cost in triangles and draw calls, what was not done), the register row in
    `docs/BEAUTIFY.md`, the frames under `docs/mocks/`.

## What the marigold taught — five sittings, in the order they were learned

- **A bigger ball is still a ball.** Six spheres read as dots; eight bigger ones as balls; nine lobes
  as popcorn. Three tries changed a SIZE. The fourth changed the CONSTRUCTION: a cempasúchil is a
  stack of whorls, florets with their base on the receptacle and their tips lifted by whorl, and it
  read as a marigold at the first crop. When a thing is wrong three times, the number is not the
  fault; the way it was built is (`docs/mocks/2026-09-21-contact-sheet/crew-11/botanica-marigold-design.md`).
- **Ask the person who knows the thing, with the photographs.** The botanist knew what a head IS —
  whorls, calyx, the deeper base and the paler ruffled margin — and that got the shape in one round.
  She did not know what an 8×6 sphere under this light reads as at 35 px, and said so before she
  started; the fix for that was exaggeration (twelve heads packed to touch), not botany. Both were
  needed, and they are two different people's knowledge.
- **Variation at its own step.** Hue is decided per PLANT at sowing (a cultivar mix, so heads differ
  between plants and not within a rule), value per WHORL by growth, the turn per HEAD by the seed.
  Put each at the step it entered and twelve heads are siblings; put them anywhere else and they are
  clones or strangers.
- **The magnifier finds what the expert cannot.** The row-constant seed was found by cropping a
  frame at 3×, not by knowing flowers. Do both.
- **Triangles are the cost, draw calls are not.** The park went 11,662 → 33,502 → ~153,000
  triangles across the sittings; draw calls did not move, because one mesh per tile is still one
  mesh per tile. No phone has been measured. A cheaper head for distant beds is the fix if one
  stutters.

## The two findings that explained the most

- **The lid.** Every engine BOX wears its top-down drawing on its lid and takes its height from the
  tallest ink in its side drawing (`t3BoxMats` → `t3BakeGlyph(g,true,…)`). That is why the café
  counter's cups lay face-up on the counter top the size of chairs, and why four of the owner's
  fourteen looked wrong at once. A mesh deletes the lid; nothing else does.
- **The pad.** The ground bake darkened a tile from its SOLID neighbours and never a solid tile's own
  floor, so every object smaller than its tile stood on a bright square. An object darkens the ground
  it stands on — an engine rule now, for every mesh tile in both games.

## Before you brief an agent to do this

Mark every line of the brief `[CODE]` (you opened the file this hour) or `[MEMORY]` (you believe it).
On the crew run that built the fourteen, every one of four agents found a false line in their brief
and was right to contradict it: the camera ("four tiles back at 35°" — it is 7.4, 6.2, 40°), two
"boxes" that were sprites, eight beds that were six, a bridge that "goes through the same hook" and
does not. **An agent who contradicts the brief with a `file:line` is doing the job.** Give them the
photographs, the light's numbers, the seam's real shape, the guards they will hit, and the rule that
the frame decides — and copy the mural section of `.claude/skills/crew-fix/SKILL.md` in verbatim.
