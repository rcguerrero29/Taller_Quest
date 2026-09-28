# Two visible storeys — what it costs, from Doña Cuca

*Asked by the owner, 2026-09-12: **"the building is supposed to be multiple stories...we have room
for that in theory, just another thing to fix with don guero. do we need help building skyscrapers?
we wont need them most likely but a thought for 2 floors to be visible in this changarrito to test
for the rest."***

**Nothing here is built.** This is the answer and its price, checked against the code, so the
decision is his and the next session does not re-derive it. Every `file:line` was read on the day;
**grep the identifier, never paste the number** (`docs/GENRE-RULES.md`).

## The short answer

**Yes, and it needs no engine change — but the camera will take most of it back, and that is the
real price.** No to skyscrapers, and the owner's own instinct there is right.

## The one distinction to settle before anything is built

**"A building that is two storeys" and "a building with a room upstairs" are different objects, and
this repository already has the second one.**

- `hq` → `f2` is a portal between two separate 20×17 worlds through `⊓ ≡ ▲ ▼`. Nothing ties that loft
  to the street facade. **The loft is bigger than the whole block it stands on.**
- A second *visible* storey is a picture with no room in it. A room upstairs is a room with no
  picture on the street.
- **Making the upstairs window you see from the street actually BE the loft's window is a third
  thing**, nobody has costed it, and the owner may well be asking for that one.

That question is his to answer and it changes everything below.

## How height works today

There is exactly one knob: `lift` per glyph → `wallH = 0.55 + lift*0.042` (`engine3d.js`). Every
facade ships `lift:13` ≈ **1.10 units**. A person is 0.84 and a door box is exactly 1.0 — **today's
"building" is barely taller than its own door.**

A pack can already do two storeys with no engine change: `TILEMETA` merges into `TILES`, and the town
already declares its own facades that way (`changarrito/content/art.js`). `lift:~30` gives ≈1.81
units. The cheapest honest version is **one new pack glyph whose `TILEART` draws two storeys inside
its own 32×32** — ground band, floor line, upper windows — on a doorless run. Content only. In 3D
that one bake is stretched over the whole box, which is what makes it work at all.

## What it costs the player, not the programmer

1. **The cutaway, and this is the real price.** `t3Hides(h,d) = h > 0.65*d + 0.3`. A 1.10 wall hides
   you only within 1.2 tiles; a **1.81 wall hides you at 2.3**, and only the nearest hider is cut to
   a 0.28 stub. **The closer you stand to your own second floor, the less of it exists.** It is a
   thing you see from across the street and lose by walking up to it.
2. **Resolution.** 32 baked pixels stretched over two storeys ≈ 16px a floor. Windows and a floor
   band read; nothing finer does.
3. **The lintel is blank.** Over a door the engine puts a box of height `h-1` in the wall's *side*
   colour **with no face art**. At two storeys that is a full storey of flat grey above every door in
   the run. So the test building must be a run with **no door in it and no door orthogonally
   adjacent** — and the neighbour search takes west first, so it is order-dependent and fragile.
4. **Not on `B`.** La ventanilla works inside city hall's wall, and her roof strip is also `h-1` deep
   — two storeys hangs a full-storey curtain over the one person on the street you can talk to.
5. **The flat front camera gains nothing.** The extra height is `lift` pixels of plain roof colour
   above the tile; the art stays in its 32px square. On `st` row 0 that band is drawn above y=0 with
   `camY` clamped to 0 — **clipped off the top of the canvas entirely.** Two floors is a **3D-only**
   effect. 3D is the default camera, so that is acceptable; it has to be said out loud rather than
   discovered.

## Where to put the test

**The north rank, `st` row 0.** It is the backdrop from the south stop, visible from the whole
street, and it only stands between you and the camera when you are on row 1 facing north.

**The middle block at row 8 is the wrong test** — it has walkable street on both sides, so two
storeys there eats the street from two of the four stops.

Don Güero picks the exact run. The constraint is: **3+ tiles, no door in it or beside it, north
rank.**

## Skyscrapers: no

Anything tall is permanently stubbed when you are near it and blocks the map when you are far from
it, the face bake gives up past two storeys, and there is no genuine elevation in the grid at all
(`docs/CITY.md`, verified 2026-09-04: *a walkable tile could never be drawn standing*). **Two is the
honest ceiling and it is enough to test the rest.**

## Handoffs

| Who | What |
|---|---|
| **Don Güero** | the parcel, and whether a doorless 3-tile run exists on `st` row 0 |
| **Pili** | whether 16px-a-storey still reads at phone size |
| **Nacho** | whether the upper floor is *somebody's* — an upstairs nobody lives in is the scenery-pretending-to-be-a-place rule wearing a new hat |
| **The owner** | the distinction at the top: a picture, a room, or the two joined |
