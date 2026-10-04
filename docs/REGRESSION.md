# The regression map — what the suites hold, what they missed, what to add

*Opened 2026-09-05 at the owner's ask: "lorenzo is floating my friend lol some regression
tests are missing. make sure regression tests are updated for meridian quest original and for
templates." This file is the map: every suite, what it holds, what the last five days' findings
should have been caught by, and the assertions to add. Nothing here is built.*

## 1 · The suites today

| Suite | Runs where | Holds |
|---|---|---|
| `test/smoke.js` — Meridian | CI, every push and PR | ~40 sections: boot with no errors or validator warnings; static invariants; the retry/XP flow; chapters and endings; hearts as a layer; WCAG contrast on every theme; the theme editor; the NET stub; the care pack and the decision report; hostile save payloads; the Trolley Pass round-trip; TILES metadata and the dog program; the park (leash → bridge → chill → recap); screen-relative swipes; door plausibility and cooldown; 3D doors and wall faces; bake resolution; seasons; furniture per camera; the button priority; fences in 3D; door markers; per-district endings; looks keyed by id; the whole city raised; the record's growth; multi-storefront; the room upstairs and its off switch; the version on the opening page; the camera round-trip; **the portability guard**; the owner's 2026-09-03 reports; **the public build's guarantee** (Part 1) |
| `test/town.smoke.js` — El Changarrito | CI, after Meridian's | the town's index is a known diff of the public one; own prefix; own name and the engine's version (the value, since 2026-09-13); the park, the faces, the clerk with her document, the board; the record's fixture: people by tier, plain words, the three-line cycle, per-label stands, leaving and restoring the tile, **a claimed person wearing the mark and the house board saying who has what**; the dog; the animals' tiles walkable. **And the crew-process guards, because the crew lives in the town:** the mural ledger, the flight-notes ledger, **the nineteen personas' shared block (first, once, one person, identical, names the post-mortem and this register)**, and `test/leaves.js`'s soundness half — a persona file fault reports under this step's name, so its sentence starts with the path |
| `test/leaves.js` | in `town.smoke.js` (soundness + completeness), by hand with a base ref (routing). **Its eighteen red cases (`--selftest`) run NOWHERE** — not CI, not `town.smoke.js`; same for `test/closes.js --selftest` | `docs/BOUNDARY.md` is sound — every path real, every reviewer a persona, every row dated, **no persona citing a PATH that was never written** (it calls `fs.existsSync` on the path only — **the line number inside a citation is not read**, and three in `.claude/agents/pili.md` are 400+ lines stale), no workflow a label or a comment can start, every derivable edge covered by a row. With a base: which boundary paths a change touches and who must see it, exit 0 always |
| `test/engine.smoke.js --index <shell>` | CI, against **both** indexes (`ci.yml`, step *"Engine smoke, against both games"*); by hand | R4 — the engine's own invariants against either game: the worlds hang together, every person reachable and named, every document builds, every camera draws every world, every door stands in 3D, every animal has ground, storage under the pack's prefix |
| `test/gauge.js` | CI | the smallest thing that can be a world, run against the shared suite — what the engine demands of a brand-new pack, measured by building one (`docs/GAUGE.md`) |
| `test/public.js <dir>` | CI on every push and PR, against a box built by `scripts/build-site.sh`, **and again in the deploy after `status.json` is written into it** (`pages.yml`) | R10 — what we would publish is only the public game |
| `test/closes.js` | CI, **pull requests only**; `--selftest` by hand and by nothing else | R3 — every `Closes #N` names an open issue the PR actually talks about |
| `test/bump.js <base> [head]` | CI on a pull request **and on a push** (added 2026-09-12 because most of this repo's history never saw a PR); by hand on the desk | an engine change that never reaches a returning player is not shipped — `GAMEV` and `CACHE` must have **moved**, not merely match |
| `test/record.js _site/status.json` | **`pages.yml` only — after the merge, on `main`** | the city record is what a clerk can read (#14). A check that runs only in the deploy cannot stop the commit that breaks it |
| `docs/templates/build-branded.js --check` | CI | the branded copies of the docs templates match the neutral ones plus `brand.yml` |
| `test/shots.js` (`--cams`, `--index`, `--spots`) | **nobody** — by hand | four-camera screenshots of named spots; the only pixel-level look at the game |
| `test/tilesheet.js` | by hand | the cold read of every glyph |
| `test/scenecost.js` (`--worlds`, `--season`, `--rate`, `--index`) | **nobody** — by hand, before and after any lane that adds geometry (#317) | per world, at the machine's speed and with the page's processor slowed: draw calls and triangles in one frame, triangles in the whole scene, the build and the first frame, and frame time over 120 frames, each frame's 3D context proved alive by its pixel read and the frame proved sent by the renderer's draw-call count for it. A stand-in, not a phone; it asserts no budget, so its times are figures to compare by date in `docs/3D-LOG.md`, and it is red only when there was nothing true to measure |

**No suite in this repository runs either game in a landscape viewport** (checked 2026-09-13): every
run is 480×900, 390×560 or 390×844. `docs/QA-PASS.md`'s matrix has had a landscape row since
2026-09-09 and nothing can run it — see `docs/POSTMORTEM.md` §13o and QA-PASS E12.

## 2 · What the last five days found, and what should have caught it

| Finding | Found by | Should have been caught by |
|---|---|---|
| Lorenzo floats in the town (10.1) | the owner, walking | **R1** — an animal's tile carries its perch; no pinned animal in an undeclared world |
| twenty literal storage keys (#26) | the engineering review | the guarantee (now holds it) |
| the SW caches non-ok responses (#28) | the engineering review | the guarantee (now holds it, on the source) |
| `innerHTML` with pack text (#27) | the security review | the guarantee (now holds it) |
| `PEERS` not drawn in iso (#32) | the engineering review | **R2** — every actor kind is drawn by every camera (the camera loop already exists for tiles: `shots.js --cams`; nothing asserts it for actors) |
| the mercado "never played" (docs) | reading `IDEAS.md` | not a test — a ledger rule, now in `CLAUDE.md` |
| a stale F row, a wrong "Closes #" | reading | **R3** — a PR's "Closes" list is checked against the issues it names (a CI step that reads the PR body) |

## 3 · The gaps, each with its assertion and cost

> **The rule R10 was bought with, and it costs nothing to apply everywhere:** *a guard has to read
> the noun it actually means.* **None of the instances below was discovered by review. Every one was
> discovered by planting a real violation and watching it pass.** So: for every assertion in this
> file, plant one before you believe it.

### The register of guards that read a proxy — the table is the count, and it keeps growing

*Opened 2026-09-11, because by then it had happened eight times in five days and the pattern was
costing more than any individual bug in it. **This is the most expensive recurring mistake in this
repository.** It is not carelessness: every one of these was written deliberately, by somebody
trying to close a real hole, and every one looked correct on the page.*

| # | The guard | It asked | It meant | Found by |
|---|---|---|---|---|
| 1 | R8, the exposure scan | what `index.html` loads | **what we publish** | the town being on the public internet |
| 2 | the mutant-marker net | the source with comments stripped | **every line** — and a marker *is* a comment | planting a marker |
| 3 | the version test | are these two strings **equal** | did one **move** | planting an unbumped engine change |
| 4 | the portability guard (TAGS L20) | is the pack's **brand** in the engine | is the pack's **glyph** in the engine — `Y` appears five times, three lines below a comment saying exactly this | Toño's gap analysis |
| 5 | the look check | did a look **come back** | is the look **hers** — two npcs resolved to one object for four days | Pili, counting letters by hand |
| 6 | `validateWorlds`' spawn check | is this tile **solid** | is it **safe to appear here** — it passed four arrivals standing on live tram rails, every boot | Beto, walking out of the bakery door |
| 7 | both suites' boot-warning filters | `/^(WORLD\|PORTAL\|REACH\|ROOM)/` | `"CRIT " + **lowercase** kind + ":"` — **zero characters matched, ever**, so #6 could not have been heard even if it had fired | planting a spawn-in-a-wall |
| 8 | `.gitignore` | `shots/` | **any scratch directory** — `shots.tmp/` walked past it | the stop hook |
| 9 | the tram's ground check | does the **bounding box** reach the road | do the **wheels** — it returns 0.0000 with all four wheels deleted, because the skirt satisfies it | Chema, asking the scene graph |
| 10 | the fauna guard's **first draft** | is **any** critter in that world | is **this animal** one the tram stops for — it went green because the hummingbird is on the same street | the session, one commit later |
| 11 | **`test/bump.js`, the version guard itself** | what the **commits** changed (`git diff base...HEAD`) | **what is about to ship** — so every run on somebody's desk, which is where a person actually runs it, was decorative. Planted an engine change with the CACHE string reverted, sitting in the working tree, and it printed *"this change touches nothing the offline app has already cached"* | the session, planting at it on the way past |
| 11½ | **the CI step that runs #11** | *(it ran at all)* | **it carried `if: github.event_name == 'pull_request'`, so a push ran the whole suite and skipped this check entirely** — and this repository's history is mostly direct commits. Yaz went looking for the damage and found none: ten engine-touching commits since the guard was written and all ten moved `CACHE`, **by hand, because somebody remembered**. The board was green because people remembered, which is exactly why the green was worth nothing | Yaz, refusing to relay a finding she had not re-run |
| 12 | **the ride guard, first draft (mine, same day)** | does `rideStart()` work | does **picking a destination in the pass** give you a ride — it called `rideStart()` directly, so cutting the pass's own wiring out of `openTravel()` left it green | planting the cut |
| 13 | **the window-sill guard, first draft (mine, one hour after writing up 11 and 12)** | the shape of `SEASONS` in one config file | **what the engine thinks is on a sill** — `props` is nested under `art` in this pack, so the lookup found nothing, took an early return and went green against THREE planted violations, including *"there is no sill at all"*, which is the state that had shipped through four owner reports | planting them |
| 13½ | **its second and third drafts, also mine** | is another OBJECT in the way (a raycast, then a per-tile probe) | **do the pixels arrive** — both were correct about the scene graph and both went green against the real bug, because the occluder is not an object: a sprite is a billboard that turns to face the camera, the camera looks down at the street, so the lower half of a tall billboard tilts back INTO the wall it hangs on. Only reading the framebuffer could answer it | planting the real bug twice and watching two clever checks pass |
| 14 | **the flight-notes ledger guard, first draft** (2026-09-11) | how many `### <agent>` headings the file has | **how many proposals it has** — every heading in that file is the anonymised literal `### (agent)`, so it counted zero and went green on a file with three un-actioned proposals in it. Reading the `**Proposed persona edit**` heading the template guarantees turned it red | Rosa, finding her own un-actioned proposal; then the guard, once it read the noun |
| 15 | **the town's version check** (`test/town.smoke.js`, until 2026-09-13) | does the title screen match `/engine mq-v/` | **is it the engine that is running** — bump Meridian to `mq-v159` and the town keeps claiming `mq-v158` with every suite green. A shape is not a value; #3's mistake inverted. Reads the value now | Yaz, costing a town-only version bump |
| 16 | **the hostile-save test's `protoClean` assertion** (`test/smoke.js`, still open) | is `Object.prototype` unpolluted after the payload | **does the prototype clause in `sanitizeSave` hold** — the payload puts `__proto__` in `qa`, which numeric coercion filters anyway, and carries no `bl` key at all, which is the loop the clause guards. It asserts that a pollution nobody attempted did not occur. The three-line plant is `docs/BOUNDARY.md` G2 | Zeni, reading the extraction step |
| 17 | **the shared-block check the calling session ran by hand** (2026-09-13; ad-hoc, never a committed guard) | are the nineteen **extracted** blocks byte-identical | **is each persona one person, with that block first and once** — they *were* identical, and `.claude/agents/rigo.md` also held a second copy at line 84 with Toño's whole persona under it, while `don-guero.md` opened with a section above it. **The extraction discarded position before the comparison began**, so the answer was true and the published claim was not the question | Beto, extracting the same block to design a guard on it; Chuy, independently, reading a file to its end for a roster line |
| 18 | **the personas guard, first draft** (`test/town.smoke.js`, written the morning of 2026-09-13, beaten that afternoon) | how many `You are **…**` lines the file has | **which person it hands the model** — `You are **Toño**` in `rigo.md` is a count of one and it passed: the exact fault the guard had been written for that morning, one keystroke to the left. Reads the name now (grep `the person it hands the model is somebody else`) | Melo, a one-word replacement |
| 19 | **(the same guard)** | is the shared block **byte-identical across all nineteen** | **does it still say the things it was bought with** — the four paid-for rules and *ASK HIM* deleted from all nineteen at once hashes identical and the suite printed OK. #3 across copies instead of across time: *equal* says nothing about *right*. Eight spine strings are pinned by content now (grep `the post-mortem — .claude/skills`) | Melo, editing nineteen files |
| 20 | **`test/leaves.js`'s permissions check, first draft** (2026-09-13) | is there a line `  <scope>: write` under `permissions:` | **what may this token write** — `permissions: write-all` has no indent and no scope name and passed; so did `contents: write   # to push the release tag` (a trailing comment after an end-anchored pattern) and the inline `{contents: write}` | Melo, three legal spellings |
| 21 | **(the same script) the trigger check** (2026-09-13) | does a line begin `on:` | **what can start this workflow** — yamllint's truthy rule teaches people to write `"on":`, so `/^on:/` matched nothing, the scan ran over the empty string, and the check **printed its pass sentence about a file it had failed to parse**. Not finding the key is a red, not a pass | Melo, one quoted key |
| 22 | **`test/leaves.js`'s ledger check, first draft** (2026-09-13) | are the rows it has **sound** — paths real, reviewers real, dated | **does every edge have a row** — delete the row for the file that holds the owner's key and it printed OK; add a script that POSTs to `api.github.com` with a bearer and it printed OK. `docs/BOUNDARY.md` called what it read *completeness*. `completeness()` derives three sets now (grep `function completeness`) | Melo; written up by Zeni, `docs/POSTMORTEM.md` §13b |
| 23 | **the claim-mark pixel probe** (Lupe, 2026-09-13; a measurement, not a committed guard) | what pixels are in the canvas's **backing buffer** | **what a person sees on a screen** — the town boots to its creator with `#world` hidden, so `#vp` was `0 × 0`; the buffer is sized from constants and `draw()` fills it with no layout box, so twenty-eight rows returned real, correct, meaningless pixels and every one "passed" | a screenshot, three hours in |
| 24 | **the wall's "one painter, one stretch" check** (`test/town.smoke.js`, 2026-09-13) | do the panels `murPainter` groups together sit in one bay | **is each person one bay** — both sides of its comparison are `murPainter`, so when that function named Doña Cuca "Cuca" and Don Güero "Don-guero" (an agent's `by` has no honorific, accent or hyphen) each got a second bay and the check was green; the first repair compared `by` to the whole of `who` and split "Melo Garduño" from "Melo" instead, and the first draft of the new guard compared whole names and missed that too. The key is a first name now (`murKey`), and a second guard folds every bay's *name* to one and insists no two agree | the calling session, three plants in a lab copy, 2026-09-14 |
| 25 | **the icon probe's `suspect` flag** (`docs/mocks/2026-09-15-cooking-book/measure-openings.js`; a prompt, never a committed guard) | is the measured box **roughly circular** (`aspect>1.15 \|\| aspect<0.85`) | **is it an opening** — it fired on the one wrong row for the right reason by accident, and it will fire on every correct one too: that icon's camera is near front-on, so the bowl's TRUE mouth measures rx 0.371 against ry 0.086, an aspect near **4.3**. A flag that cannot tell a front-on vessel from a mismeasurement is a reason to *go and look*, which is exactly what it was written to be, and it is not a test — nothing may ever promote it to one. The machine check drafted beside it (how much of the opening the repaint covers) scores the picture the owner called **broken** at **99.5%**, so no threshold a sane person would pick rejects it | Beto, measuring the same icon in order to paint it |

| 26 | **the shape gate's solidity clause, and the guard written for it, both first drafts** (`engine/engine.js` + `test/engine.smoke.js`, crew iteration 14) | can this tile **stand up** — asked as `standsUp(g)` | **can this tile ever show a MESH** — `standsUp` additionally demands a SIDE drawing, because it answers a question for the flat FRONT camera (`engine.js:924, :2281, :2312`). The 3D camera's walkable-object branch (`engine3d.js:447`) asks plain `stands`. Meridian's grass `g` is `stand:true` with no side art (`content/meridian/art.js:1829`): its mesh renders perfectly and `standsUp` would have refused it one, while the guard built on the same word reported six of its tiles as faults on art nobody had touched. **A brief handed both the gate and the guard the same wrong noun, so the guard agreed with the bug** | el repartidor, on a red he had not planted (docs/POSTMORTEM.md §13g) |
| 27 | **this lane's own "Meridian is byte-identical" dump** (a measurement, not a committed guard, 2026-09-22) | the hash of **the last `PlaneGeometry` in the group**, called "the ground" | **the world's baked floor** — `st` has TWENTY-TWO PlaneGeometry objects, because every door spills a light pool that is also one. It hashed a door's glow and reported the street's floor unchanged when the floor had in fact changed. Fixed by taking the plane whose `parameters` are the world's own width and height. **#17 exactly, committed by the person writing it, in the hour he was writing the entry about extraction steps** | el repartidor, because the town's `st` was the one world the tally said had not changed and the street is the one thing a player walks |
| 28 | **the shape gate's own verdict line** (`test/engine.smoke.js`, crew iteration 14, round two) | `Object.keys(SHAPEBIND).filter(g => TILEMESH[g])` — **does this letter have any mesh at all** | **which letters the ENGINE supplied a shape for.** The line runs long after the gate has written into `TILEMESH`, so it cannot tell a pack's own art from an engine default. On Meridian it printed `the engine's shapes stand 331 of 331 tiles` when the true number is ZERO — all 331 are Meridian's own `TILEART_MESH`, refused by clause 1. **The headline number of an entire lane was a proxy for a different question, and it was the number in the report.** Fixed by having the gate write down what it handed over (`SHAPEGIVEN`); a number nobody can check is not a measurement | the adversarial reader, who ran the patched suite instead of reading it |
| 29 | **the contact-shadow probe's own positive control** (`test/engine.smoke.js`, same lane) | `reals.length && !padSeen.lit && padSeen.worlds === 1` — **could the probe see a pad in the FIRST world drawn** | **can it see one in THIS world.** `padSeen.lit` is a running total across worlds and the `worlds === 1` term asks the question once, so a game whose first ground bakes readably and whose later ones do not would get silence about every world after the first — and silence is this probe's pass. Planted with a blind `padAt`: the old form named ONE world, the per-world form named all ten. **A control that runs once is not a control, it is an anecdote** | the adversarial reader |
| 30 | **the well rail's guard** (`test/town.smoke.js`, same lane) | height, lip offset and run direction of **one rail tile at a time** | **does the rail read as a rail.** Every one of the nine tiles passed all three while the loft showed a doubled post at every joint, because **the fault is made of two tiles and the guard only ever held one.** Now it collects the newel caps across the whole run and fails on any two closer than half a tile. It went red on the FIXED code too, at a corner nobody had reported — two perpendicular runs meeting diagonally, where neither tile can see the other along its own axis | the adversarial reader found the joints; the guard found the corner |
| 31 | **the sweet's-pane guard, check (10)** (`test/smoke.js`, 2026-09-24, #241) | is a wide part standing further out than the pane **anywhere between 12% and 92% of the wall's height** | **does it stand between the pane and the camera.** The band was the wall's, not the pane's: an awning over a shop window — a roof over the window, as the eave is over the house — read as a buried sill. It reads the pane's top edge and the camera's pitch off the scene now, as it already read the pane's depth; four plants outside the repository (a grazing valance, a valance in front of the pane, a sill past the pane, the old band against the awning) all red. |
| 32 | **the trolley draw-order probe** (`test/engine.smoke.js`, `flatTurn`; found 2026-09-30) | `seasonSet('off')`, **is the season off** | **is the clock still.** Its five frames are five draws, milliseconds apart; the hummingbird at the stop hovers on `Date.now` over the feet of the person in front of the car, and its movement between frames was counted as the car covering him: "1 pixels", about one run in seven, green on a re-run (165 of 7,590 clock phases red in a sweep). **Its control compared frames 1 and 2 only, which vouches for nothing about frames 3 to 5.** Fixed by holding both clocks still for the five frames; the 2026-09-21 plant (the car at depth `Infinity`) is still red at every phase | Yaz, who reproduced it on demand with a planned clock instead of re-running it |
| 33 | **the drone's sound check** (`test/engine.smoke.js`, 2026-09-30, #271) | were any voices made while the drone took off, flew a tile and landed | **did the DRONE make them.** It counted the dogs' howls, and on its second draft the tune a pressed B had restarted (`musPoke` listens to keydown) — green, both times, on the slice where the drone had no voice at all. Now every other sound in the street is held quiet for the length of the check | running it red-first against the commit before the sound existed, and it came back green |
| 34 | **the drone's flight tile** (same block) | a floor tile with nobody within a tile of it | **a tile the hero can be SEEN on, in every camera.** The pick moved with the wandering neighbours and sometimes landed right behind the gauge's south wall, where the iso block in front hides the hero: "the hero could not be measured (0%)", one run in four. Now: nothing solid in front of either tile, nobody on it or in front of it, and the neighbours held still for the block | the gauge going red once and green three times |
| 35 | **the drone card on a phone** (same block) | is the card clear of the drone, the dpad and the icons **at five places** | **is it EVER over them while you fly.** A first fix with a band of give between two thresholds passed all five and, in a frame, sat on the drone's rotor after the drone had flown back from a corner — it stayed where the last place had sent it. The check now sweeps the drone across two rows, and that version turns red on the sweep | a picture taken for the report, not the guard |
| 36 | **the scene-cost frame's pixel read** (`test/scenecost.js`, #317, 2026-10-03) | did a one-pixel read seeded with alpha 0 come back **255** | **did THIS frame draw.** The seed was put there to catch a lost 3D context, and it does: a lost context leaves the seed. It was then written down in three places, this register among them, as proof that the frame drew. A skipped draw leaves the last frame in the buffer, so the read returns 255 off a frame that never happened: with `renderer.render` made a no-op from frame 52 of the park, the run was green with a ×4 frame median of 1.3 ms against 82.5 unslowed (Yaz's copy: 1.3 against 194). **The read proves the context lives; the renderer's draw-call count for the frame, read after the timed span, proves it was sent.** No engine path skips today, so no figure was wrong; the sentence was, and a "don't redraw when nothing moved" saving is exactly the change this tool is there to measure | Yaz, on the recheck, planting against the fix's own wording |
| 37 | **the alebrije wing guard** (`test/smoke.js`, 2026-09-07 to mq-v232) | does the winged look add **at least 40 pixels** outside one standing dog, at one frozen clock, in **three colours** | **does the wing sit on the animal, small, in every pose.** It was a floor on size, the opposite of what the night was asked for (the dog still himself, perhaps with tiny wings: the comment over `ALEB_DEF` in `engine/engine.js`), and its three colours were any anti-aliased edge. Green while, over the hurdle, the wings stayed where the dog had been standing, 16 px below his back; lying down, the colour round his eye sat on his brow; inside the tunnel his wings showed where the tube hid him; every wing in the world beat on `Date.now()`, together, asleep or awake; and the office dog's eye ring went round his nose. The painters move the body themselves and the alebrije layer was pinned to the standing pose. Replaced in mq-v234 by a sweep of every winged and ringed kind, every pose, both facings, every eighth of a step, the park's own hurdle and tunnel, clock held and then swept, every answer read from drawn pixels; ten plants outside the repository, each red | rendering every dog kind in every pose at 8× before believing the code, and the brief that said to replace it |
### The other half: four ways a guard fools its author without reading a proxy

*Added 2026-09-15. Every row in the table above is a guard that asked one thing and meant another.
These four asked the RIGHT question and still could not answer it, and all four were written in a
single day by the session writing that day's entries — which is the register's own standing joke and
also its point. They live as a pre-flight in `.claude/skills/guard/SKILL.md`, because this file is
where a lesson goes to be true and a skill is where it goes to be READ.*

| | It looked like | It actually was | Found by |
|---|---|---|---|
| **A** | a guard on the 3D marker's geometry | it baked the sprite with a lift and a scale **it had typed out itself**, so changing the numbers `engine3d.js` ships walked past it silently. Fixed by giving the call site a name (`"bake"`) instead of numbers, so there is one place the geometry exists | planting the shipped constant |
| **B** | a guard on where the street bearing lands | `Infinity%` for three directions and **silence** on the fourth: the viewport was `0×0` behind the character panel, and `0/0` is `NaN`, and every comparison against `NaN` is false. The direction that looked fine was the one dividing nothing by nothing | its own first run |
| **C** | a guard on the quest marker | it read `Date.now()` through a bobbing mark, so it tested one phase of an animation and called it the drawing — green, then red with "3 pixels" on the next run. Stubbed across eight phases now | running it twice |
| **D** | a clip test | it asked *"does the mark touch row 0 of the sprite"*, and the top row is there to be used: it failed good art and would have passed a mark wanting to paint five rows higher. Draw onto a surface with forty rows of extra sky and count what lands above the real top | a plant it should have caught |

**B is the one to keep.** It is `#11½`'s shape in a single expression: the check did not fail, it
**evaporated**, and the one case that looked healthiest was the emptiest. Nothing to measure is not
a pass.

**#11 is the one to read twice.** It is the guard for the rule `CLAUDE.md` states in its own words —
*bump `GAMEV` and `CACHE` together whenever `engine/` changes* — and it could not see an unbumped
engine change in the working tree it was being asked about. It compared two commits, and the moment
anybody actually runs it is **before** the commit. It had been green for every change this repository
has shipped since it was written.

**#12 was written by the session writing the entry for #11, one hour later. #13 and #13½ were written
by the same session, in the same hour, in the guard FOR the bug it was fixing — and #13½ happened
TWICE, two different clever checks, both correct about the scene graph and both green against the
real fault.** That is now five times in one session — **and twenty-five rows in the table above**, a
number the prose is kept level with on purpose (Lupe, 2026-09-13; #24 on 2026-09-14, #25 on 2026-09-15) — and the count is the point:
knowing about the mistake, writing the register entry for the mistake, and making the mistake are not
mutually exclusive activities.

**#13½ is the one to keep, because it is the only entry here where the proxy was more sophisticated
than the noun.** A raycast through the scene is a better piece of engineering than counting pale
pixels in a framebuffer. It is also the wrong question. *"Hidden" is a fact about pixels* — it is the
owner's own word, he used it three times across four days, and no check in this repository read it
until one did the obvious stupid thing and looked at the screen.

**Two of those are guards written by the session that had just found the first eight** (#10, and #14 —
the mural-ledger guard that split on `### <agent>` headings when every heading in that file is the
anonymised literal `### (agent)`, so it went green on a file with three un-actioned proposals in it).
**Knowing about the mistake does not stop you making it.** That is the single most useful line in
this register.

**What they have in common, stated so it can be checked against a new guard before it lands:**

1. **The proxy is always cheaper to read than the thing.** A filename, a string equality, a bounding
   box, a membership test. The correct noun usually needs a behaviour to be exercised.
2. **The proxy is usually correct *today*.** #4 named the right brand; #9's box really did reach the
   road. They fail when the world grows a second case.
3. **A green guard is not evidence.** Eight of these ran green for days or weeks. **The only thing
   that distinguishes a working guard from a decorative one is a planted violation** — which is why
   `melo` exists and why step 5½ of `/crew-fix` asks it of every change.
4. **The extraction step is a proxy before the comparison is** (added 2026-09-13, from #17 and #19).
   The hash that compared nineteen persona blocks was correct; what it hashed had already been lifted
   out of the file, so position, count and neighbours were gone before anything was compared. **Ask
   what your check normalised away to make the comparison easy** — a hash throws away position, a sort
   throws away order, a trim throws away the blank line that separated two people. The committed guard
   survives only because three **shape** assertions run before the hash: how many copies, who the file
   hands the model, and what is read first.
5. **A red guard is not evidence either** (added 2026-09-13). `test/leaves.js`' first run named five
   persona citations of files that did not exist; **two were invented by its own pattern**, because a
   regex alternation takes the first branch that matches and it listed `.js` before `.json`. The remedy
   those two names prescribed was *edit two files that were already correct*. **Point a new guard at one
   case whose answer you already know before you carry its output anywhere — red or green.**

**Rows 17–23 were all added on 2026-09-13, and five of them were guards written that morning and
walked past that afternoon**, by the agent whose only job is walking past them; fourteen other plants
that day were locked out by guards that said something a person would say. All five are closed and each
fix carries the plant that bought it in a comment. **Four of the five read an aggregate — a count, a
hash, a shape — where the noun was an identity or a content.** That is the shape to look for first in a
new guard, and the morning-to-afternoon gap is the shortest this register has recorded: **a guard's most
dangerous hour is the one right after it first goes green.**

**One suspicion filed here as prose and deliberately NOT as a row, because nobody planted at it.** Pili,
2026-09-13: the claim guard (`test/town.smoke.js`, grep `the hard hat is the mark`) has a failure
sentence about the claimed person's **outline** and an assertion that reads `lk.hat !== 'hard'` — a
string in a look object. Blanking the hard-hat drawing branch, or drawing the hat inside the skull the
way the other caps are clipped, would leave the field `"hard"` and the silhouette identical to
everybody else's. **That reasoning is from the extraction step, not from a fired plant. Plant it before
you believe it — and if it fires, that is the finding and this paragraph is wrong.**

**The question to ask of any new guard, before it lands:** *if I break the thing this is for, in the
smallest and most plausible way, does it print a sentence a person would say?* If you have not run
that, the guard is untested no matter how green the suite is.

**And the question under it, bought on 2026-09-13:** *what does this guard print when it cannot read its
subject at all?* #21 answered that with its pass sentence — a positive claim about triggers, about a
file it had just failed to parse. **Not finding the thing is a RED. Silence about a file you failed to
parse is a claim you did not check.**

### The empty catch: a guard the code writes against itself — 2026-09-16

*Added when the owner asked "how do we fix the save failing silently?" — which is the same question
this file asks of tests, asked of the shipping code instead.*

`try{localStorage.setItem(k,v)}catch(e){}` appeared **nineteen times** in `engine/engine.js`. Every
one of them is a promise the code makes and then quietly declines to keep: the player's progress is
written, the write fails, and the game carries on drawing as though it had worked. A phone with a
full disk, a private window, a browser with site data blocked — the save is gone and the only thing
that ever knows is the `catch`.

**This is the register's fault in the other direction.** A guard that reads a proxy *answers a
question nobody asked*; an empty catch *refuses to answer the question the code itself asked*. Both
end the same way: a green screen and an untrue one.

**The fix is a shape, not a patch.** One writer, `mqStore(k,v,critical)`, is now the only thing in
the engine that touches `localStorage`, so there is exactly one place the failure can be handled and
exactly one place a future session can get it wrong. It separates the two failures that need
different answers — *out of room* (drop the debug log, retry once, and tell the player only if the
retry also fails) from *not allowed to write at all* (tell them straight away, there is nothing to
free). The message is throttled to once every 180 seconds, because a save that fails fails every few
seconds and a toast per attempt is its own bug.

**And the fallback lives in the engine, which the gauge forced.** The first version read the warning
out of the pack's strings, so a world that had not written a `save:` block would fail silently
exactly as before — the guard would have been green for Meridian and meaningless for the next world.
`SAVE_FALLBACK` is in `engine/engine.js`; a pack may say it better, but no pack can make it say
nothing.

**Red first**, in a copy outside the repository: the original swallowed `catch` planted back in
`lab8`, all four assertions fired.

**The standing rule this leaves:** *an empty catch is a decision to lie, and it needs a reason in
writing beside it or it does not ship.* `test/engine.smoke.js` holds the four assertions; the next
one added anywhere in the engine has to get past them.

### The five guards added after the register was opened, and the eight violations planted at them

*2026-09-11, `mq-v149` — the critters-keep-off-the-rails rule and the tram that waits at its stop.
Listed here rather than in the table above because **none of them is in the table**: each was written,
then broken on purpose in a copy outside the repository, and each printed a sentence a person would
say. That is the whole procedure and it takes about ten minutes.*

| Guard | What was planted at it | What it printed |
|---|---|---|
| every critter clears the rails in time | the rule's one call site disabled | *"the colibri never leaves the trolley line in st — standing on the rails while the tram comes, waiting for the tram to stop instead of getting out of the way"* |
| (same) | the escape step turned to run **along** the line instead of across it | the same sentence — a pigeon correctly fleeing down the rails for ever is indistinguishable from one that never moved |
| (same) | the shy radius dropped **below** the brake's | the same sentence, by deadlock: the tram stops before it is frightening, so nothing is ever frightened |
| `TRO_SHY > TRO_LOOK` | `TRO_SHY=2` | *"…the car and the critter stand in the street looking at each other for ever"* |
| a **cornered** critter still stops the tram | the brake's critter clause disabled | *"a butterfly, walled in on the trolley line in st, cannot get off it and the tram drives straight through — getting out of the way has quietly become being ignored"* |
| the tram waits at its stop | the dwell never fires | *"the trolley runs straight past its own stop in st with somebody standing on it: you call it, it comes, and it does not stop for you"* |
| …and the waiting **ends** | the dwell budget removed | *"…stands at the stop for 9900 ms and shows no sign of leaving — one person on a platform can park the line for ever"* |
| …and it does not wait for an **empty** platform | the "is anyone near" test removed | *"…stands at the stop for 3200 ms with nobody anywhere near it — it is not waiting for a passenger, it is just slow"* |

**Two of the eight are the interesting ones and neither was on the list when the guards were written.**
The *along-the-line* plant and the *radii-reversed* plant both produce the identical failure sentence
as simply deleting the rule — three completely different mistakes, one symptom. A guard that had
asked *"did the critter move?"* would have gone green for two of the three. It asks *"was the line
clear before the brake had to fire?"*, which is the noun, and that is the only reason it survives all
three. **The proxy version of this guard was one word away and the word was "move".**

The third guard in that list — the cornered one — is the register's own lesson turned into a test.
This branch had already lost a pigeon to *getting out of the way* quietly becoming *being ignored*,
by species. The rule that keeps critters off the rails is exactly the pressure that makes the brake
look like dead code, so the brake now has a test that fails without it.


| # | Gap | Assertion to add | Where | Cost |
|---|---|---|---|---|
| ~~**R1**~~ **built 2026-09-06 (mq-v68)** — the `ANIMALS` seam; both suites assert something under every animal, Meridian's defaults byte-identical | pinned animals have no test that the tile under them carries what they need, and appear in any world with the right id | for every animal the engine draws: the world's pack declared it (or the engine's pin is opt-in), and the drawn foot height equals the declared `lift` of its tile, in all four cameras. **Red first on the town** | `smoke.js` + `town.smoke.js` | a quarter sitting, after the engine change in §10.1 |
| **R2** | actors (people, animals, peers) are asserted per camera only for tiles and doors | count the draw calls per actor kind per camera (the pattern `mq-v64` used for tiles: "smoke now counts which drawing each camera calls") | `smoke.js` | a quarter |
| ~~**R3**~~ **built 2026-09-06** — `test/closes.js`, a CI step on every pull request; `--selftest` holds the 2026-09-05 mistake and seven more cases | a PR can close the wrong issue | a CI step: every `#N` after "Closes" in the PR body is an open issue whose title appears in the PR body or the diff | `ci.yml` | minutes |
| ~~**R4**~~ **built 2026-09-06** — `test/engine.smoke.js --index <shell>`, run in CI against both indexes: the worlds hang together, every person reachable and named, every document builds, every camera draws every world, every door stands in 3D, every animal has ground, storage under the prefix | the engine smoke was never split from Meridian's (NEW-WORLD §3) — the town got its own suite instead of a shared one, so engine invariants are asserted once, against Meridian only | `test/engine.smoke.js` — the portability guard, the guarantee, the four cameras, stand tiles, the light ladder, the reader's geometry, reachability, discoverability — run against **both** indexes | new file; `ci.yml` | one sitting |
| ~~**R5**~~ **built 2026-09-06** — every `doc:` a quest hands over exists, builds, and names a template file; EN and ES hand over the same set | the generated templates (06 the taller's, 07 Nolasco's) are checked for brand only; nothing checks that the quest that hands one over still names it | for each `doc:"id"` in the quests, `DOCS[id]` exists, builds, and its `tmpl` matches a file in `docs/templates/` | `smoke.js` | minutes |
| ~~**R9**~~ **found and built 2026-09-06 (mq-v69)** — the town smoke renders the street in 3D and counts the counter, the back wall and the roof strip on her tile; `winAt()` answers null one tile in front | a person's station was asserted by coordinates only: la ventanilla "at (9,0)" passed while every camera drew a hole in city hall where her map letter had been (the owner: *"how did this pass a test for a teller?"*). Placement is not a picture | for every station a pack marks `win`, the 3D scene holds the wall's three pieces at that tile and no full box; the 2D pass draws the wall's face under her and a counter over her legs | `town.smoke.js` | done |
| **R6** | the town's index is held to a line count | a diff assertion: the town index equals the public one under a fixed set of allowed substitutions (CSP line, title, script paths, no SW, no manifest) and nothing else | `town.smoke.js` | a quarter |
| **R7** | four-camera pixels are looked at by nobody | `shots.js --cams` in CI, uploading the PNGs as an artifact; a "looked at" step is still a person. Optional: a per-spot pixel-hash baseline that fails on drift | `ci.yml` | a quarter; the baseline is a sitting |
| ~~**R8**~~ **built 2026-09-06 — and its mechanism caused R10. See below.** — the shell is derived from the public index's script tags | the guarantee scans `content/` for Meridian only; a second public pack would go unscanned | scan every pack folder the public index loads, derived from the script tags, not a hardcoded list | `smoke.js` | minutes |
| **R10** — **built 2026-09-10, `test/public.js`, wired into `pages.yml`** | **El Changarrito — the owner's private backlog tool — was published on GitHub Pages and reachable at `/changarrito/` by anyone who guessed the path.** The deploy used a *denylist* of three names and shipped the whole repository. **R8 was built to close this exact class and could not see it**, because "derive the shell from the index's script tags" is blind to anything the index does not load. The fix for the last exposure was the cause of this one | **Do not derive. Read the directory we are about to upload and ask what is in it.** Five sections, each proved by planting a real violation: nothing whose *presence* is private (named, not derived, so a folder added tomorrow is private by default); nothing that *carries* a credential surface (the four forbidden words, plus token/key *shapes*); nothing the page may *reach* (CSP, off-origin scripts, script tags with no file); the offline app must actually *install* (`addAll` is all-or-nothing, and the shipped cache string must equal the shipped version); and the game must actually *be there* | `test/public.js` + `pages.yml` | **done** |
| ~~**R11**~~ — found 2026-09-13 by Yaz and Lupe, **BUILT 2026-09-16** — the wander filter refuses any tile that would cut the world (`wanderCuts`), the auditor reads a wanderer as passable and a `still` person as masonry, and the trolley seam reads `rows` instead of `grid`. Red first at **35 of 35 chokepoints**; the plant that restores the old reader still names *"rigo in ex"*, the person this row predicted three days before the fix. The owner's question settled it: *"why doesnt r11 walk around?"* — there was nothing to walk around | **a person standing on a tile is a wall, and nothing re-audits after a wander step.** A person is stamped into the grid as `"N"` — at boot, by `addChill`, and on every wander step — and `"N"` is impassable both to `isSolid` and to `auditReach`'s own `walk`. The wander filter asks about solidity, doors and tram danger and never asks whether the step cuts the map in two. In `ex`, a neighbour in the one-tile gap at (19,1) puts 35 tiles and Doña Meche out of reach **of the player as well as the audit**. Reds `test/smoke.js` about **one run in twenty-five**, and has for longer than the branch that found it. (Backlog row 8 is the *spawn* half of this; this is the *wander* half, which is every second of play) | nobody may be walled out by somebody standing: with every wanderer pinned in turn to each single-width gap, `auditReach` reports nothing and every NPC keeps a reachable neighbour. **Red first by occupying `ex` (19,1) on purpose.** The fix site is the stamp or the auditor's read of it — **not a person-check; neither reader looks at people at all** | `engine/engine.js` + `smoke.js` | a quarter, plus the engine decision: does a person block, or do you walk around them (`docs/ARCH-LOG.md`) |

### The gap nothing guards: everything shipped is not everything listed — 2026-09-22

`test/public.js` (grep `ASSETS`) checks that every file **listed** in `sw.js`'s `ASSETS` is present
in the built box. **Nothing checks the other direction.** Ship a new engine file, forget the `ASSETS`
row, and: CI is green, `test/public.js` is green, the online game is perfect, and the **second,
offline** visit gets the old cache with the file missing. The one person who meets that is the owner,
on a phone, on a plane, and there is no error to read — the engine simply does less.

This is not hypothetical bookkeeping: `engine/shapes.js` landed today and its `ASSETS` row was added
by hand, by somebody remembering, which is `#11½`'s whole lesson about why a green that costs nothing
is worth nothing. It is why the gate in `engine/engine.js` tests `typeof SHAPES==="object"` and not a
bare name — a missing library must fall back to boxes, not throw.

**The assertion to add** (not built this round, and named here so it is not rediscovered): for the
built box, every `.js` under `engine/` and `vendor/` that the shell can reach must appear in `ASSETS`,
or the check names the file and says *"this file ships and the offline app will never have it."*
The cheap plant is deleting one row from `ASSETS` and watching the suite stay green, which it does.

### And one fact about the game found while establishing a control — 2026-09-22

The 3D ground bake is deterministic in fourteen of Meridian's fifteen worlds and **not** in `pk`:
`TILEDRAW["~"]` (`engine/engine.js:1235`) drifts the water's glints off `Date.now()`, and the 3D
camera BAKES the walkable art into one texture. So the park's floor carries one frozen phase of a
water animation and which phase depends on the millisecond the scene was built — row **C**'s shape
(a guard that read `Date.now()` through a bobbing mark), here in the game rather than in a test. Two
runs of untouched code disagreed on `pk` and on nothing else in 1455 objects. Whether a player can
see it is a question for a person with a screen; **what is certain is that no before/after
measurement of that world means anything until the clock is frozen**, and the first number of any
such probe must be the control (docs/POSTMORTEM.md §13r).

## 4 · Order

R3 and R5 and R8 first (minutes each, and R3 would have caught a mistake made today). Then
R1 with the engine change it needs. Then R4, which is the template's promise finally kept.
R2, R6, R7 as the town's next parts land. Each red first — a test that was never red proves
nothing (`OWNER.md`).

## The proxy register — 2026-09-17, five more, and they all went red on a working game

A heavy day for this register, and the pattern in every one of them is the same: **the guard asked
about the thing that happens to be near the noun, and the noun moved.**

| the guard | the proxy it read | the noun it meant | how it surfaced |
|---|---|---|---|
| "an unbegun panel is plain plaster" (`test/smoke.js`) | **every colour in the whole 32×32 tile** | the EMBLEM has not been painted yet | went red the moment a mural kept the wall's own window — glass, a lintel and a stone ledge counted as "the panel painted something". Now measures the emblem's own field |
| "the town loads the shared engine" (`test/town.smoke.js`) | **the literal string `../engine/engine.js` in the shell's text** | the town runs the shared engine, not a copy | went red the day the path moved into `engine/boot.js`, while the town was running the shared engine perfectly. Now reads what the browser fetched |
| "this house is on the town plan" (`test/town.smoke.js`) | **`MAPDOT[world][0]`** | the plan can show me where the house is | went red when the hand-typed copies were deleted, while the plan could place every house from its own door. Now asks `planPlace` |
| "the 3D scene cache has a ceiling" (`test/engine.smoke.js`) | **`T3CACHE_MAX`, the cache's own constant** | you do not end up holding the whole city | **passed a plant that set the constant to 999**, which turns the cache off. A ceiling is a fact about behaviour, not a number to read back |
| "the door covers the screen when the world changes" (`test/engine.smoke.js`) | **three added-up gaps between the leaves** | the door is shut | reported *296 pixels of daylight* for a door standing wide open at rest — the same number a broken door gives. **A measure that cannot tell shut from open is not a measure.** Now one coverage fraction: 1 when shut, 0 when open |

**And the one that is not a proxy but belongs beside them:** the first version of the doorway guard
held the door still and measured its geometry, which is stable and catches most of it — and could
never see **a move that only happens on the way back to rest**. A leaf slid back across the whole
screen a third of a second after the door had opened, and the plant went straight through. It is
caught now by reading the cause (the reset's transition duration) rather than the symptom.

**The rule this adds to "a guard has to read the noun it actually means":** *a guard that reads a
number the code under test owns is reading the code, not the behaviour.* `T3CACHE_MAX`, `MAPDOT[id]`,
a literal path in a file the change is allowed to edit — all three are the same mistake, and all
three passed while the thing they guard was broken.


## 2026-09-23 — a guard written FOR this register, and the two shapes it had to avoid

El Horno grew a second verb: you push a lump of dough on a canvas and it comes together **where your
hand went.** That sentence is the mechanic, and it is also the hardest kind of thing this register has
a name for, because every cheap way to check it reads something near the noun instead of the noun.

**Two proxies were available and both were refused, in writing, in `test/horno.js`:**

| the cheap check | what it would have read | why it is the wrong noun |
|---|---|---|
| `hDev() > 0` after a drag | the dough, **on average**, moved | a knead that spread over the whole lump from one stroke would pass it — and that is the exact bug that would make the three rounds on the tray unable to differ from each other, which is the whole point of the mechanic. **The guard works one third of the lump and requires the far third to come back at exactly 0**, not small |
| the changed box in 3D contains the tray | something in the frame moved **near** the tray | the dough's own tile is two tiles from the tray, and a bounding box that contains both proves nothing about either. **The guard counts changed pixels within 18 px of where three.js says the TRAY's tile projects** — 40 of 67, on the run that shipped |

**And the split that is the real lesson.** The field is arithmetic and the drawing is pixels, and the
guard checks both **without either standing in for the other**, because each discards exactly what the
other keeps: the field check would pass a dough drawn as a grey disc, and the pixel checks say
something changed at the tray and never that it is bread. Six of the eight new assertions were planted
against — `grab` removed, the reader's old render-then-show order restored, `hWork` spread to the whole
field, `hRise`/`hSpread` flattened, `t3Invalidate` removed from the settle, the way-out button deleted
— and every one printed a sentence naming what a player would lose. The plants ran in a copy outside
the repository, on a tree whose HEAD is recorded beside them.

### And the plant that WALKED STRAIGHT PAST all of it — the seventh, run after the other six had fired

The six plants above each printed a sentence a person would say. A seventh was run for completeness —
**the dough bench deleted from the map**, `"w.m.p...w"` back to `"w...p...w"` — and `test/horno.js` came
back **green**, and printed its whole pass line, the one that says *"you walk to the other bench, push the
dough with a real drag, and it comes together WHERE THE HAND WENT."* There was no bench.

**Why, and every pack inherits this.** `READS` declares a COORDINATE; `readAt` matches world, x, y and
whether the document exists, and **never asks what is standing there.** So the mark floats over bare
floor, the Read button lights, the card opens — and the knead's state lives in the pack (`H_MASA`) and
reaches the tray through `hRise`/`hSpread`, neither of which is a tile. Delete the object and nothing any
of the eight assertions could see had changed.

**This is not a proxy. It is a shape this register did not have a name for: every assertion was about
BEHAVIOUR and not one was about PRESENCE.** A proxy reads the wrong noun; this read the right nouns and
there was simply no assertion that the thing existed. It is the same hole as `docs/POSTMORTEM.md` §13t —
five fixes about how well a window read, and the window was never drawn — arriving from the other end:
there, nobody asked whether it was on the paper; here, nobody asked whether it was in the room.

**The question that catches it, and it is one line:** *delete the OBJECT, not the behaviour — does
anything go red?* Section 2c¼ is that question as a guard: every read this pack declares must stand on a
glyph with a mesh in `TILEART` and a place in `SOLIDX`, checked through the registries rather than a list
of letters typed into the test. The engine's own sentence beside `readAt` was already the rule — *"a thing
you can read is a place"* — and it had never been anything but prose.

**One number in that lane belongs here too, because a guard did not catch it and a stash did.** The
knead had to be behaviour-identical for a player who never finds the dough bench, and the only thing
that proved it was running the suite with the whole feature stashed and diffing its four camera
figures against the same run with it in — 224 / 149 / 915 / 49 either way. The comment in the file had
said 228 / 155 / 76 / 915 for a week. `docs/POSTMORTEM.md` §13u has that one.


## 2026-09-23 (second) — the register's own subject, twice in one guard, and the second one was green

Building El Espejo needed `test/smoke.js`'s quest-assignment check widened first. **It read `WNPC` — the
table declaring which letter on which map is which person — as a proxy for "somebody asks this quest",
and that proxy stopped being true in two different directions.** Both were planted before anything was
changed, in a copy outside the repository:

| planted | the OLD guard said | which is |
|---|---|---|
| a real quest moved off a station person and onto **Naye, who lives in a template-built room** and genuinely asks it | `quest 13 unassigned` | a **false red** — it costs a build |
| a station letter changed to **one that appears in no map**, so that person is never placed and the quest can be started by nobody | `OK — 60 quests, maxXP 880, all invariants hold.` | a **false green** — it ships a quest no player can reach |

**The false green is the one that matters, and it is the one nobody was looking for.** The brief that
predicted this fault predicted only the first direction; the second was found by asking the register's
own question in the other direction — *what does this guard say when the thing is MISSING rather than
misfiled?*

Both are the same root and both predate ❗La llave (2026-09-07), the day a person gained a second place
to stand: `buildInterior` takes a room's people from the interior's own `people` and never touches
`WNPC` (`engine/engine.js`, grep `wnpcs.push` — two call sites, one of them reads `WNPC`).

**The fix reads the people standing in the worlds**, which is what the engine itself asks when it decides
who is in front of you. No growth pass is needed: `applyBuilds()` runs unconditionally at load and
`BLDS()` is not gated on `chSeen`. Green on unchanged code — all sixty askers found — and red on all
three plants afterwards, the third being a new one the old guard also could not phrase:

```
quest 10 is asked by nobody — no person standing in any world carries it, so a player can never start it.
lupe in st asks quest 999, and there is no such quest
```

### And the plant found a live design constraint nobody had

Plant one stopped saying `unassigned` — and started failing two **other** guards: *the chair did not open*.
Giving Naye an unanswered quest makes the barbería's chair unreachable, and the cause is one line:
`checkTalk` (`engine/engine.js`, grep `tb.dataset.qi=qi`) sets the Talk button to the QUEST and **deletes
`dataset.chatn`**, which is the only thing the chair path reads. So while she has any open quest, Talk
starts the quest and the chair is gone — the chair the owner asked for on 2026-09-07 (*"open the ability
to change our character outfit and haircut after start. maybe have a small barber"*).

**The plan for El Espejo had Naye carrying all four quests.** That is now a decision and not a detail, and
it was surfaced by a plant written for something else entirely. That is the argument for planting: the
guard was the target, the constraint was the find.
