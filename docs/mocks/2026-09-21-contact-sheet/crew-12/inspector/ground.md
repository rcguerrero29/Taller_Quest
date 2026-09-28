# ground.md — el inspector de línea, crew iteration 12, issue #228

Worktree: /home/user/meridian-quest/.claude/worktrees/agent-a456ec9e07a1506bd — the tool gave it at 8313766, one
docs-only commit BEHIND the 498c923 the brief names; reset to 498c923 before touching anything (git reset --hard,
no local changes existed). All line numbers below are from 498c923.

## PRE-FLIGHT (written before opening a source file)
1. I will reproduce bug 1 from the owner's frame with a scratch shot before reading any theory, then read the front
   camera's draw order the way I read a rail — from the ground up, in the order the frame is painted — and for bug 2 I
   will ride both lines end to end, every stop, both directions, four cameras, and look at every frame.
2. The trade equips me with a fixed list of what a tram must do at a stop, at the end of a line and under a wire, so
   I know wrong on a vehicle without being told; and the habit of walking the whole length rather than the reported metre.
3. It falls short on cameras: a 2D draw order and a three.js scene graph are not rails, and I expect to be fooled by a
   frame that is right from one camera and wrong from another, and by a fault that is the season's dressing, not the tram's.

## The owner's frame — READ FIRST
docs/mocks/2026-09-21-owner-reports/street-front-skeleton-floats-string-through-him.png: the road VERTICAL, the skeleton
over the pavement with a thin dark vertical line through him, a calaverita at his right, the MQ stop's table and a papel
strip at the top. That is NOT the front camera (its road is horizontal: drawFront maps x to screen x, engine.js:2217).
It is the 3D camera turned a quarter (T3.yaw = +π/2, camera east, looking west along row 1) — my frame
shots/r1/st-5-1-3d-yE.png matches it element for element; front/top/iso at the same spot are clean.

## [CODE] — verified this hour
- content/meridian/maps.js:48-49 st rows 0-1: `BBBB…E…B` / `Y............................2`; rows 2-3 the lane; :340 TROLLEYAT
  st row 2 from 0 to 29 stops [{x:0,y:1}]; ex row 1 from 20 to 0 stops [{x:20,y:2}].
- content/meridian/config.js:138/:175 swags: st row 1 (1..8, 10..18), and more worlds (hq row 15 is the first the guard finds).
- engine/engine.js:1249 fiestaSwags accepts ONLY sw.from[1]===sw.to[1] — there is no north–south swag in any camera.
- engine/engine.js:2255 drawFront calls fiestaDraw2D BEFORE the R depth queue (actors at :2320) — in the front camera the
  string is UNDER the hero; draw() :2374 the same for top; drawIso :969 after R (strings over people there, not this bug).
- engine/engine3d.js:739-753 the swag pass: string box at PH=1.9 (and 1.68) along the row, flags t3PapelStrip, poles at
  the ends on open ground; :606-616 the bridge hangs its own string along the crossing (userData papel).
- engine/engine3d.js:1023 the hero sprite hero:true; :1065 depthTest=!a.hero||lift<0 → the hero draws through everything.
- engine/engine3d.js:1095 the camera: hx+sin(yaw)*7.4, 6.2 up, lookAt (hx,0.4,hz); T3CAMD 7.4 T3CAMH 6.2 (:1121).
- engine/engine.js:3562 yaw is quarter turns (worldDir); engine3d.js:1224-1240 t3Turn/t3TurnTick; the ↻ button.
- engine/engine.js:1567 TRO; :1672-1687 troUpdate: born at L.from-dir*TRO_LEN, "away" past L.to+dir*TRO_LEN — there is
  NO turn-round; :1661 troServing window [TRO.x-0.5, TRO.x+TRO_LEN+0.5]; :1723-1731 rideStart puts the car at s.x-(dir>0?LEN:0).
- engine/engine3d.js:847-925 t3Trolley (pack body via tileView("prop:tram","mesh"), engine wheels/driver, body scale.x=dir).
- engine/engine.js:1764-1780 drawTram/troDraw2D: the 2D tram, drawn at toScreen(TRO.x,L.row).
- test/engine.smoke.js:1845-1924 "the trolley is a vehicle"; :1996-2030 every camera draws it; test/smoke.js:4262-4312 the
  dwell guard (reads TRO.state and TRO.x's stillness only); .github/workflows/ci.yml:27 smoke, :31-33 engine smoke both shells.
- vendor/three.min.js; the town: CAMDEF "3d" (changarrito/content/config.js:14), swags on st row 1 (:55), NO TROLLEYAT.

## [MEMORY] in the brief that the code contradicts
- "the front camera … a string that runs north–south becomes a VERTICAL LINE" — no such swag exists (:1249) and the front
  camera draws strings under people (:2255 before :2320). The vertical line is a 3D string seen END-ON.
- "the states and the turn-round are around :1672–1690 and :1760" — :1686-1687 ends the run with state "away"; the car is
  reborn at the same end with the same dir. There is no turn-round; Rigo's file (row 26) is right.
