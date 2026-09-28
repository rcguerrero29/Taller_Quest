# The bridge — why content cannot reach it, and what the engine sitting would add

## Why the hook never reaches `^`

`^` is `{lift:0, kind:"bridge"}` (engine.js, search `"^":{lift:0,kind:"bridge"}`): NOT in `SOLID`, NOT
`stand`. In the 3D builder (`engine/engine3d.js`) the order per tile is:

1. `:410` `if(stands(w.rows[y][x])&&!SOLID.has(gch))` → `:412 t3MeshTile` — walkable stand tiles
2. `:523` `if((TILES[gch]||{}).kind==="bridge"){ … continue; }` — **the deck, rib, rails and papel are built here and the branch `continue`s**
3. `:588` `if(!SOLID.has(gch))continue;`
4. `:591` `if(t3MeshTile(gch,x,y,cx,cz))continue;` — the mesh hook for SOLID tiles

The bridge branch (2) sits BEFORE the mesh hook (4) and returns before it. `tileView("^","mesh")` is
never asked. A `TILEART_MESH["^"]` in the pack would be dead content, so none is written.

(The one content-side route — `TILEMETA["^"]={stand:true}` so branch (1) fires — was considered and
refused: the mesh would then REPLACE the engine's deck, and `test/smoke.js` reads that deck: four
`userData.bridge` decks, `bridgeRail` pieces ≥ 4 with `position.y > 0.2`, the petal-side material on
`material[0].map`, the camber. Four owner asks live in that geometry. Content must not delete them.)

## The seam (engine): ask the pack for what stands ON the deck, keep the deck

In the bridge branch, after the deck is added and before the rails:

```js
/* the pack may add parts on the deck — rails, a string beam, a heap of petals — placed at the deck's
   height and laid at its slope, so people (stairLift = BRIDGEH+cam) and parts agree */
const bm=(typeof tileView==="function")&&tileView("prop:bridge","mesh");
if(bm){try{const parts=typeof bm==="function"?bm({x,y,ew,cam,slp,edges:bridgeEdges(x,y),pet}):bm;
  if(Array.isArray(parts)&&parts.length){const m=t3MeshOf(parts,{bridgeMesh:true,mesh:true,x,y});
    m.position.set(cx,BRIDGEH+cam,cz);if(ew)m.rotation.z=Math.atan2(slp,1);else{m.rotation.y=Math.PI/2;m.rotation.z=Math.atan2(slp,1);}
    grp.add(m);}}catch(e){t3Note("mesh prop:bridge",e);}}
```

The engine's rails stay (the guard reads them). A pack that answers adds; it does not replace.

## What I would add through it (Pili's two, plus the season)

Out of season the one weak read is the deck's side as one flat `#8A6F4D`:

| part | primitive (deck-local, y=0 at the deck's top, x along the crossing) | Pili |
|---|---|---|
| string beam | `box` y -BRIDGEH·0.65 z ±0.5 w 1.0 h BRIDGEH·0.35 d 0.03 c #5A4330 — the dark beam along the bottom 0.35 of the side, on each OPEN side (`edges`), following the camber because the mesh is laid at the slope | ✓ |
| nosing | `box` y 0.005 z ±0.49 w 1.0 h 0.02 d 0.04 c #B08E5E — the light edge along the top of each open side | ✓ |

In season (`pet`), the crest where the heap meets the rail — the same recipe as the fence's foot
(`meshPetalCrest` in `content/meridian/art.js`, BEAUTIFY CREW ITERATION 11): a dark under `#5A2E12`
0.012 tall along each open edge, and 8–10 petals (`sph` r 0.05, sx 1.2, sy 0.25, `petalPal()[1..5]`)
standing 0.02 proud of it, inside the rail line at z ±0.4. +2 parts out of season, +12 in.

That is +2 per deck tile out of season, engine-side, because the deck is engine-built (engine3d.js:543).

## The ground bake's weighting (Pili, for the petal spill) — engine

`petalSpill` (engine.js, search `function petalSpill`) sets the count by distance from the bridge only
(`d===1?78:d===2?33:6`), which is why the spill reads as a circular stain. The bake already walks the
neighbours for the water/floor test (engine3d.js, the ground pass around `petalSpill(w,x,y,sx,sy)`): weight
the count by what stands beside the tile — ×2 against a SOLID neighbour (a drift banks against a fence,
a curb, a wall), ×0.4 in the open (four walkable neighbours). One multiplier at the `n=` line; the
seed and the palette unchanged, so `test/smoke.js`'s spill counts (`nw < 12`, `nf < 5`) still hold at
the water and floor tiles it samples — re-run them; the water tile beside the deck has the deck as a
non-walkable neighbour and would go UP.
