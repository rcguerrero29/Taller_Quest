# GROUND — la calle, crew iteration 11 (el herrero)

What each of the six is made of and how it was made. The process is the shape (how-its-made).
Coordinates for the mesh: a tile 1.0, y up, x east, z south, centre (0,0).

## 1 · The picket fence — `F` (park perimeter, the crew pen on st, the site on ex)
- **Posts** 4×4 timber, set in holes at a bay's pitch (a tile ≈ 1.7 m ≈ a 6 ft bay). Taller than
  the pickets by a hand. Shared by two bays: ONE post per tile, at the tile centre, so the rails
  of the tile west and east both reach it.
- **Rails** two 2×4s on the flat, nailed to the posts on the YARD side, running post to post
  THROUGH the tile edges — a rail is never cut at a tile line, so each tile's rail spans the full
  1.0 and butts the neighbour's.
- **Pickets** 1×4 boards, all cut from one stock on one jig: one width, one point. Nailed to the
  rails on the STREET side with a gap. Four to a bay. Variation enters AFTER the jig: each is
  nailed a hair higher or lower, one leans a degree, three weathered shades.
- **Corner** two rail runs meet at the corner post; the pickets of each run stop at it.
- **End** a run ends at its post; nothing overhangs.
- **Who is a neighbour**: the same GLYPH. A barricade (`G`, kind fence too) beside a fence is not
  more fence — the engine's kind-based run is what stood panels at 90° over the crew pen
  (docs/BEAUTIFY.md row F: "crossing at 90° in mid-air").
- Height: pickets 0.62, posts 0.74 (waist to chest on a 1.0 person — a garden fence, not a wall).

## 2 · The glass balustrade — `◺` (the loft's well, Nolasco's stair room)
- What a glazier fits: a **shoe channel** bolted along the lip of the opening, **toughened panes**
  standing in it, **stainless posts** between panes, a **cap rail** (a channel) along the top.
- Stands on the LIP of the well, facing it (the engine's own rule for a rail beside a well —
  `wellDepth` of the four neighbours says which lip). Waist-high (1.1 m ≈ 0.66), not knee-high.
- Pane per tile, full width; post at the centre and at the far edge; a post at the near edge only
  where the run starts. Panes butt through the tile edge → one balustrade.
- A vertex-coloured Lambert mesh has no alpha: the pane is a pale sheet, the frame says where the
  edge is. (Tested by looking — see the frames — and reported under NEEDS ENGINE if it hides the
  flight.)

## 3 · The produce crate — `H` (El Mercado, eight of them)
- A **slatted box**: four corner posts, three slats a side with a gap between, a rim, a slatted
  bottom nobody sees. Nailed from one pattern → the box is the same every time; what differs is
  what was put in it.
- **Produce set down by hand, one kind per crate** — a grocer does not mix tomatoes with bananas
  in one crate. The 2D picture does; the picture is a diagram of the name. Kind by the same parity
  the picture uses (`(x*3+y*5)%7`): tomatoes / chiles / bananas → 4 / 2 / 2 across the eight.
- **Tomatoes**: siblings from one plant, one radius ±hair. A bottom layer packed 4×3 in the box,
  a second layer in the hollows, one or two on the peak — it MOUNDS. Each wears its green star
  where the stem was, and they tumble a little so the stars are not all up.
- **Chiles**: a thin cone with a bend at the tip (a second cone at 25°) and a dark cap, LYING every
  which way in the crate, two layers.
- **Bananas**: a hand is five fingers on one stem, fanned; a finger is three short cylinders in a
  curve with a dark tip. Three hands to a crate, laid over each other.
- Lit a step paler than the paintings they replace (a lit mesh shades itself).

## 4 · The counter — `I` (El Mercado, one run of four)
- A **carcase** of boards the length of the run: a plinth set back at the foot, the body, a worked
  top a hair proud of the face. **Plank joins on the world grid** (every 11 px, as the picture
  draws them) so they do not restart at every tile.
- **End panels only at the two ends** of the run. The middle tiles have none → one counter.
- **The scale**, ONCE, at the head of the run (west end, as the picture has it): a cast base, a
  column, a pan, a dial face on a stalk behind the pan, a red needle reading something, and one
  tomato on the pan. On the top, not in the texture — the old box measured the scale's height into
  the head tile and made it taller than the rest of the run.
- Height 0.6 (≈1 m): a person stands over it, a child does not.

## 5 · The bridge — `^` (the park, two by two)
- Two **beams** bank to bank, **planks** across, **posts** into the beams, a **top rail** and a
  mid rail. Arched: every post rides the camber, the rails follow the slope.
- In season: the heap is petals **poured** from baskets — a mound with a value range, dark at the
  bottom of the heap, pale on top; the heap spills over the deck's edge onto the bank.
- The engine's deck stays (its top is where people stand: `BRIDGEH + bridgeCamber`). Only the
  rails, posts and the heap are mesh. **The hook never reaches `^`** — see NEEDS ENGINE.

## 6 · The trolley (engine, `t3Trolley`)
- A **body** on **two bogies** of wheels (four wheels visible), a **roof** with a clerestory, an
  open **driver's platform** at each end under the roof, **glazing** on four sides, a **pole** to
  the wire, a **bell**, a **headlamp** at each end, a **cowcatcher**/fender low at the ends, a
  number board. Painted by the rule: a dark panel below the waist, a light band round the windows.
- Wheels and the driver stay ENGINE objects (the guard counts `userData.wheel`, checks the axle,
  counts `userData.driver`; a merged mesh cannot carry per-part userData or spin). The body is the
  mesh. See `trolley-parts.md`.
