# Two storeys, with a mural on them — the costed answer, 2026-09-13

*The owner, 2026-09-13: **"we sure about 2 floors? could make murals way cool"**. Cuca, Don Güero and
Pili answered against the code; the raw returns are in `docs/meetings/2026-09-13-la-cuadrilla-disena.md`.
This note is what they settle and what is his. Nothing is built.*

## The finding that reframes it (Cuca)

**A readable thing has no height; it has a floor-plan address.** A wall document opens from a tile
(`READS` in `changarrito/content/docs.js`, `readAt` in the engine, first match wins). So an upstairs
mural is reachable **from the street, trivially, and only from the street** — never from the loft,
which is a different world — and **two documents cannot share a tile**: a facade column carries a
ground-floor sign *or* an upstairs mural, not both.

**And the mural already has storeys.** The wall grows *upward*, one course per visit — the owner's own
caption: *"a stretch never gets wider — it gets taller."* What the street lacks is not a second storey;
it is a tile that says the painting goes up.

## What each camera does to a taller building

| Camera | A second storey | The mural on it |
|---|---|---|
| top | ignores `lift` | a two-storey drawing squashed into one tile of plan |
| front | a blank band of roof colour, no face art; on the north row it clips off the top of the canvas | nothing |
| iso | grows with `lift`, but `isoBlock` never draws the art | a taller plain slab, no painting |
| 3D | the only camera where it is a building | **the cutaway takes it away**: at `lift 30` the wall is stubbed from two tiles back instead of one, and the stub wears the box's *top* material, not its face |

And Pili's readability fact: a mural upstairs is read at a steep rake from the camera's low angle;
roughly half its painted height arrives.

## The three objects, costed

| | What | Cost | Verdict |
|---|---|---|---|
| **A · a picture upstairs** | one new pack glyph, `lift ~30`, art drawing two storeys in its own 32 × 32; content only | one sitting of art, one of camera fallout | **possible; it needs a parcel** |
| B · a room upstairs | already shipped (`f2`) | 0 | closed |
| C · the two joined | no shared frame between two worlds; a hand-kept coordinate promise with no guard | a full ticket minimum | do not open |

**Object A has no parcel on the town's street** (Cuca): every three-tile doorless run on row 0 is either
the hoarding reserved for block two or the west neighbour of a door, which would hang a blank lintel
over it. **Meridian has one** (Don Güero): `st` row 0, x19–x23 — doorless, the map edge behind it, no
clerk in the wall, no papel picado (the config already reserves that wall for a mural), and Meridian has
no mural glyph yet, so it pays no lintel.

## The rule that makes "no skyscrapers" arithmetic (Don Güero)

> **La regla de la banqueta.** A facade may stand no taller than `0.65 × W + 0.3` world units, where W
> is the number of walkable rows between it and the next solid thing on the side you look from — in
> `lift`, `lift ≤ (0.65·W − 0.25) ÷ 0.042`. A second storey only on a rank with its back to something.
> The ceiling is two: 32 baked pixels over two storeys is 16 a floor, and the bake gives up past that.

## What is recommended, and what is his

**Recommended (Cuca, one sitting): the taller wall inside the document.** Repaint the town's mural tile
so the limewash reads as a *tall* wall — a second, smaller register of paint above the tram band —
`lift` stays 13, no new glyph, no engine change, and the mural keeps its whole height in every camera.

**If he wants the street itself taller: Meridian `st` x19–x23 first** (Don Güero's Phase 2.6, *La planta
alta*), a picture upstairs, content only — **after** one engine fix: the sill sprite's height does not
scale with the wall's (`engine3d.js`, the sprite's position is multiplied by `H` and its height is not),
so raising a facade pulls the lit pane off its window. That is one expression, behaviour-identical at
`lift 13` to within three screen pixels, and it must go first or the first two-storey wall will show a
stretched window hole with a small lit rectangle floating in it.

**His, in `docs/OPEN.md` §1:** taller wall inside the document, or taller building on the street? And
if the street, Meridian first (recommended) or the town's city hall (the most satisfying picture and the
worst wall: a door in the middle, a teller four tiles west, a skull pinned by a guard).
