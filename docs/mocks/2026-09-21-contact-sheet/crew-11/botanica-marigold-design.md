# The cempasúchil, from the plant outward — la botánica, crew run 11 (2026-09-21)

## What a Tagetes erecta head IS
A *capitulum*: not one flower but hundreds of ray florets on a domed receptacle, held in an
**involucre** — a fused, ribbed, narrow green cup like a small vase, 1.5–2 cm long. The double
cultivars sold for Día de Muertos (the "African" or "Aztec" marigold) are fully double, 6–9 cm
across, **wider than tall** (the dome is about two thirds as tall as it is wide). The florets sit in
**whorls**: the outermost are the largest, splayed nearly flat with a wavy crimped margin; each
whorl inward is shorter, steeper and more crinkled, until the centre is a mass of upright florets.
**One hue per plant**, deepest at the base of each floret (the tube) and paler at the thin margin
that catches light — so the outer whorl reads deeper than the crown. (Photo 1.)

## What a bunch is (photo 2)
Heads packed until they touch, no soil between. The colour varies **between heads, not within a
rule**: a seed packet's mix gives rust-red, orange and yellow *plants* side by side, and every head
on one plant is that plant's colour. So: hue decided per plant (the seed), whorl gradient decided
by growth (shared by all).

## What a bush is (photo 3)
A 40–90 cm plant, bushy, with dense **feathery pinnate** dark-green foliage; heads held singly at the
end of stems **above** the foliage; the visible foliage about a third of the bush's height; buds
between the open heads (a green egg with the colour just showing at the tip); a field of orange with
a yellow rogue in every eight or so.

## Scale chosen
A real head is r 0.03–0.045 tile units (a tile = 1 m) — a 6 px dot at the default camera, where a
tile is ~110 px on the phone. The game exaggerates props and the owner accepted r 0.13–0.17 heads
without objecting to size, only to shape. I take **r 0.105–0.155** (21–31 cm), a little smaller
than the last try so ten fit a tile touching, and so a head is ~24 px across — enough to resolve
three whorls.

## Translation to primitives (all colours from `P`, the petal palette)
- Involucre: tapered cylinder, green.
- Receptacle: a squashed sphere in the plant's mid hue, seen only between florets.
- Three whorls of flattened lobes (squashed spheres, long along the radius, each with its BASE on
  the receptacle and its tip lifted: outer ~17°, middle ~52°, inner ~72°) + a crown of three.
- Whorl colours `P[hue+1]`, `P[hue+2]`, `P[hue+3]` — hue 0 rust, 1 orange, 2 yellow.
- Bed: ten heads on a staggered grid, touching; the middle higher; 7 orange / 2 yellow / 1 rust,
  the seed rotating which; a mound of 26 elongated green lumps for the foliage from the soil to
  0.40; stems only above the foliage; four buds. Curb, lip and soil as they were.
