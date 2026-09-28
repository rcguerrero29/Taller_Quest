# The trolley as parts — for the engine sitting (el herrero, crew iteration 11)

`t3Trolley()` in `engine/engine3d.js` (search `function t3Trolley`) builds ONE `THREE.Group` of boxes
and moves it. It is engine, not a tile; nothing here was edited. This is the parts list a mesh tram
would be built from, in the same primitive vocabulary as `TILEART_MESH` (`{s, x,y,z, w,h,d | r | rt,rb,h,
c, rx,ry,rz, sx,sy,sz}`, tile units, y up, the group's origin at road level under the body's centre,
+x along the line), and the seam that would let the pack answer it.

## The seam

In `t3Trolley`, where the body/floor/roof/glazing boxes are built (the `if(!T3.tram){` block), ask the
pack first, the way the season-prop pass asks for the ofrenda (`engine3d.js`, search
`tileView("prop:ofrenda","mesh")`):

```js
const pm=(typeof tileView==="function")&&tileView("prop:tram","mesh");
let body=null;
if(pm){try{const parts=typeof pm==="function"?pm({len:TRO_LEN}):pm;
  if(Array.isArray(parts)&&parts.length)body=t3MeshOf(parts,{tram:true,mesh:true,body:true});}catch(e){t3Note("mesh prop:tram",e);}}
if(body)g.add(body); else { /* the boxes as today */ }
```

`t3MeshOf` is a closure inside the world builder today (`const t3MeshOf=` inside the build function);
the seam needs it hoisted to file scope, or `t3Trolley` needs its own copy of the ten-line merge. That
is the one real engine change.

**What stays ENGINE, whatever the pack answers:** the four WHEELS (cylinders, `userData.wheel`, turned
`rotation.x=Math.PI/2`, spun by `rotation.y=-TRO.x/0.115` each frame) and the DRIVER (`userData.driver`,
moved to the leading end). A merged mesh has one `userData` and cannot spin a part, and the guard reads
those two nouns (`test/engine.smoke.js`, "the trolley is a vehicle": counts `u.wheel`, checks the axle
lies across the rails at 0/30/90°, counts `u.driver`, bounding box `max.y ≥ 1.0`, `min.y ≤ 0.04`).
**Do not re-litigate the wheel rotation** — `engine3d.js`, the comment at the wheels: two cures refused
by measurement (Pili). The wheel guard fires at `wheels < 2`; the noun is FOUR — whoever touches the
tram raises it to 4 and plants it first (delete two wheels in a copy, read the sentence).

## The body, as a tram is built (Pili's six + the rest, marked)

Paint by Rigo's rule (A14): a DARK panel below the waist, a LIGHT band round the windows, never two
mid-tones. Roof `#8E4230`, skirt `#6B2E1E`, window band `#E8D6B0`, glass `#D8E6F0`, pole and ironwork
`#3A3F46`, lamp `#FFE9A8`. `L = TRO_LEN` (2 today), `H = 1.02` (a door is 1.0), `FL = 0.20` (the floor
rides above the wheels), `CAB = 0.15` (the open platform at each end).

| # | part | primitive | why | Pili |
|---|---|---|---|---|
| 1 | underframe / skirt | `box` x0 y(FL+0.10)/2 z0 w L-0.06 h FL+0.10 d 0.74 c #6B2E1E | the dark panel below the waist, full length, over the bogies | ✓ |
| 2 | body, lower panel | `box` y FL+0.17 w L-0.1-2·CAB h 0.28 d 0.72 c #6B2E1E | dark to the waist | ✓ |
| 3 | body, window band | `box` y FL+0.31+0.20 w L-0.1-2·CAB h 0.36 d 0.72 c #E8D6B0 | the light band the windows sit in | ✓ |
| 4 | glazing ×6 | `box` x ∈{-0.55,0,0.55} z ±0.37 y 0.62 w 0.42 h 0.26 d 0.02 c #D8E6F0 | as today, on the band | — |
| 5 | end glazing ×2 | `box` x ±(L/2-0.05) y 0.66 w 0.02 h 0.30 d 0.50 c #D8E6F0 | as today | — |
| 6 | roof | `box` y H-0.03 w L+0.10 h 0.06 d 0.92 c #8E4230 | **overhangs the body by 0.06** all round | ✓ |
| 7 | roof lip | `box` y H-0.06 w L+0.10 h 0.02 d 0.94 c #6B2E1E | the drip edge under the overhang — the lip that reads at 35 px | ✓ |
| 8 | clerestory | `box` y H+0.05 w L-0.5 h 0.10 d 0.5 c #8E4230 | the raised roof centre an old tram has | opt. |
| 9 | **trolley pole** | `cyl` x 0 y H+0.18 z 0 r 0.02 h 0.35 c #3A3F46 rz 0.35 (leans BACK 20° from vertical, against the direction of travel) | 12 px of line above the roof: the cheapest thing that says tram, not bus | ✓ |
| 10 | pole base | `cyl` x 0 y H+0.02 r 0.05 h 0.04 c #3A3F46 | the swivel it stands in | opt. |
| 11 | headlamp ×2 | `cyl` x ±(L/2-0.02) y 0.45 rx π/2 r 0.05 h 0.03 c #FFE9A8 | one at each end, low, on the dash | opt. |
| 12 | bell | `sph` x L/2-0.3 y H-0.08 z 0.3 r 0.04 c #C9A227 | under the roof edge at the platform | opt. |
| 13 | fender / cowcatcher ×2 | `box` x ±(L/2) y 0.14 w 0.06 h 0.16 d 0.6 c #3A3F46 rz ∓0.35 | leans out low at each end | opt. |
| 14 | platform rail ×2 | `box` x ±(L/2-CAB/2) y 0.75 w CAB h 0.03 d 0.02 c #3A3F46 (both sides, z ±0.36) | the grab rail on the open platform | opt. |

Pili's six are 1–3 (the paint rule), 6–7 (the overhanging roof with a lip) and 9 (the pole). The rest
are the tram's own paperwork and cost a box each; nobody asked for passengers, and none are listed.

The pole leans back 20°: with `+x` the direction of travel and `TRO.dir` flipping, the seam mirrors
`rz` with the driver (`T3.tramDriver.position.x` is set per frame; the body mesh would need `scale.x =
TRO.dir` or two baked bodies). Cheapest: bake once, and flip the whole body group's `scale.x` with the
direction — the wheels and driver are outside it.
