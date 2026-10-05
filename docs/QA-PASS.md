# The pass — Lupe's list

*Opened 2026-09-09 at the owner's word: "we should have personas who are QA testers meaning they have
to test both on full screen and phone mode right."*

**This file is the checklist, and the record of what escaped it.** The list grows from real escapes
and from nothing else. A check nobody can point at a bug for is a ritual, and rituals get skipped.

---

## The rule

> **Every check runs at BOTH sizes. A result from one size is not a result.**

## The bay — the size matrix

**The "who runs it" column was added 2026-09-13 and it is the point of the table now.** A row nobody
can run is a row that gets skipped, and it reads as covered every time somebody looks at the list.

| Row | Viewport | Who runs it | Why this one |
|---|---|---|---|
| Phone portrait | 390 × 844 | `test/engine.smoke.js` | The phone size most checks use; where reach and text size fail |
| Phone landscape | 844 × 390 | **nobody — by hand** | A short frame — where an anchored bar eats the world. **No suite in this repo has ever run either game in a landscape viewport** (E12) |
| Small window | 480 × 900 | all three suites | What the suites already use; keeps parity with CI |
| Desktop | 1280 × 800 | **nobody — by hand** | Where the world is widest and the camera shows most |
| **Fullscreen** | the element gets the screen's shape | **nobody — by hand** | **The one that has actually escaped** |

Mock-ups are reviewed under `docs/UI-REVIEW.md`; only what reaches the owner is written here.

A change to layout, camera, text or anything a person touches runs every row. A change to logic
alone may run the first and the last.

## The pass, in order

0. **Prove you are in the game before you measure it.** One screenshot, first, showing the thing you
   are about to measure on a screen — and the element's box non-zero. **A canvas draws in an empty
   room:** the backing buffer is sized from constants (`engine/engine.js`, grep `const VW=`) and
   `draw()` fills it whether or not the element has a layout box, so reading the pixels returns real,
   correct, meaningless numbers about a world nobody can see (E10). `test/shots.js` already knows how
   to start the game. Copy it.
1. **Make the old code fail first.** A test that has never been red proves nothing.
2. **The suites, both packs, every time** (`README.md` "Test before shipping" is the list; CI runs more):
   ```
   node test/smoke.js
   node test/town.smoke.js
   node test/engine.smoke.js --index index.html
   node test/engine.smoke.js --index <the other world's index.html>
   node test/gauge.js
   ```
   One engine, two games: a pass on one is half a pass. **And say how many runs your green is.**
   `test/smoke.js` fails about one run in twenty-five on a real game bug (E11); a single run of it
   prints green 96% of the time. When green is your evidence that something ships, run the suite the
   change touches at least five times and **write the count next to the word "green".**
3. **The size matrix**, on whatever the change touched.
4. **Look at a screenshot — of the frame you measured.** Numbers do not see teeth along every wall in
   HQ. A person does. And a number cannot see an empty room (E10).
4½. **Measure the mark that carries the meaning, not the one it replaced.** When a fix moves a meaning
   from one mark to another — a shirt pattern to a hat, a colour to a height, a label to a posture —
   **the old mark's evidence does not transfer.** On 2026-09-13 the claim mark moved from the sash to
   the hard hat and the day's entire pixel pass — seven sizes, four cameras, twenty-eight rows —
   counted *sash* pixels; nothing ever counted an outline. Ask of every number before you accept it:
   **is this counting the thing the change was for?** And *"visible"* is a fact about pixels;
   *"reads as X"* is not — for that, the instrument is a person who has not seen it before.
5. **Report in plain words** — what a person would have seen, not what line asserted.

---

## The escape register

*What reached the owner that the list should have caught. This is the most valuable thing on the
page: every row here is a row of the matrix that did not exist yet.*

### E1 · The fullscreen blur — 2026-09-08
**What escaped:** #134 was diagnosed, measured (edge energy **2.26 → 2.72**), fixed and shipped. The
owner came straight back: *"its still blurry in full screen."*
**What it actually was:** a **second, unrelated fault**. The 3D buffer kept the game's 10:8 while
fullscreen gave the element the screen's shape, so the browser rescaled and letterboxed a 2880×2304
render. Measured afterwards at **0.885 fullscreen against 2.24 windowed**.
**Which row would have caught it:** *Fullscreen*. Everything had been tested windowed.
**What the list is now:** the fullscreen row exists because of this, and it is the row never to skip.
**The general lesson:** a symptom is not a cause, and fixing one cause does not clear the symptom.
Measure in the state the person was actually in.

### E2 · The test that pinned the bug — 2026-09-08
**What escaped:** `test/smoke.js` asserted a sprite was 40px and passed the entire time the sprite
was wrong — the assertion ran *after* a forced device-pixel-ratio change, so it was measuring the
broken state and calling it correct.
**Which row would have caught it:** none. No viewport catches this.
**What the list is now:** step 1 — **make the old code fail first**. A green test on unchanged code
is not evidence.
**The general lesson:** a test that pins current behaviour can pin a bug. It then acts as a
bodyguard for it.

### E3 · Scratch files reaching `main` — 2026-09-08 and 2026-09-09
**What escaped:** `git add -A` swept fifteen `.tmp.js` scratch files into a commit that reached
`main`. Later the same week a screenshot script whose output directory came from an unset variable
wrote `./undefined/living.png` at the repo root, and was caught by a hook rather than by anyone
looking.
**Which row would have caught it:** none — it is not a viewport problem.
**And a fourth, hours later:** an agent told in writing to keep scratch out of the repo wrote its
shot list to `spots1.tmp.json` at the repo root. `.gitignore` covered `*.tmp.js` and not
`*.tmp.json` — the rule was written for the shape that had escaped before, which is the shape of
every rule written from one example. It is `*.tmp.*` now.
**What the list is now:** scratch goes in the session scratchpad; every commit stages **explicit
paths**; `.gitignore` carries the shapes, plural. **Four escapes in one day, every one by somebody
who had been told and was being careful** — which is the whole argument for the guard being
mechanical. Instructions did not work. The hook did.

### E3½ · The ignore rule read a name when it meant a kind — 2026-09-11

**What happened.** `.gitignore` has carried `shots/` since E3. On 2026-09-11 an agent taking
screenshots wrote 22 files into **`shots.tmp/`** and it appeared untracked in a tree that was about
to be committed. Caught by the stop hook, not by the rule that exists for it.

**Why it is its own entry and not a footnote to E3.** E3 was *somebody forgot*. This is the rule
itself being too narrow: it named one directory when what it meant was *any directory an agent
writes pictures into to answer a question*. An agent names that folder whatever it likes.

**It is the same shape as the seven guards on this branch** — R8 read what the index loads, the
mutant net read comment-stripped source, the version test read equality, the portability guard read
the brand, the look check read whether a look came back, `validateWorlds` read solidity, and both
boot-warning filters read uppercase. **A rule has to read the noun it actually means**, and that is
as true of a `.gitignore` line as of a test.

**Fixed by shape:** `*.tmp/` and `*.scratch/` alongside `shots/`. The next agent's folder can be
called anything ending in `.tmp` and it will never reach a commit.

### E4 · The branch reset that ate a commit — 2026-09-10 (a near-miss, not an escape)
**What happened:** mid-session, to start a clean part, I ran `git checkout -qB <branch> origin/main`.
`-B` does not ask. It moved the branch to `origin/main` and the L15 commit — an hour of work — was
gone from the working tree with no ceremony and no warning.
**Why the owner never saw it:** luck, spelled *push*. The commit had been pushed minutes earlier, so
`origin/<branch>` still had it. Recovery was `git stash -q -u`, `git reset -q --hard
origin/<branch>`, `git stash pop`. **Unpushed, it would have been reflog-or-nothing.**
**Which row would have caught it:** none. Like E3 it is not a viewport problem — it is a hand on a
sharp tool.
**What the rule is now:** **never `checkout -B` onto a branch you have commits on.** Starting a
fresh part from `main` is `git fetch origin main` then a *new* branch name, or, if the name must be
reused, `git push` first and reset to `origin/<branch>` rather than to `origin/main`. And check
`git log origin/<branch>..<branch>` before any command with `-B`, `--hard` or `-f` in it.
**The general lesson:** this register exists because instructions do not work and hooks do (E3). This
row has no hook yet, and that is the honest state of it — it is written down as a gap below rather
than claimed as fixed. **It is here at all because a near-miss that nobody records is just an escape
that has not happened yet.**

### E5 · The private town was on the public internet — 2026-09-10
**What escaped:** `.github/workflows/pages.yml` built the site with
`rsync -a --exclude .git --exclude .github --exclude node_modules ./ _site/` — a **denylist of three
names**. Everything else went to GitHub Pages: `docs/` (every internal register), `test/`, and
**a private pack's folder**, which was never linked from the public game. **Not linked is not the same as not published** — it was
reachable by anyone who guessed the path, for as long as the site has been up.
**Which row would have caught it:** none, and worse — **a guard built for exactly this did not fire.**
`test/smoke.js`'s guarantee scan forbids `api.github.com`, `github_pat`, `net.local` and
`Authorization` in the public build. It never saw that folder, because it scans **what `index.html`
loads**, and that pack loads nothing from there. The guard watched the front door of a house with no
walls.
**What the list is now:** the deploy is an **allowlist** of what the public game serves, and
`test/public.js` inspects **the artifact rather than the source tree** — the only honest question is
what is inside the box we upload. Proven red against the old deploy: thirteen findings, first line
that folder.
**The general lesson, and it is the same one as E3:** *a denylist can only name yesterday's mistake.*
Three names were right on the day they were written and wrong the moment a second world was added to
the repository. An allowlist makes anything added tomorrow private until somebody says otherwise.
**And a second, sharper one:** a guard that reads the SOURCE cannot vouch for the ARTIFACT. Check the
thing you actually ship.

### E6 · Two engine changes that never reached a returning player — 2026-09-10
**What escaped:** `f9a2e71` and `689e93d` both changed `engine/engine.js` and left `sw.js`'s `CACHE`
where it was. CI was green for both, because the existing test checks that `CACHE` **equals** the
pack's `GAMEV` — and **lockstep is not movement**. Leave both untouched and they still match.
The service worker is cache-first, so every device that had installed the app kept serving the old
engine and never learned there was anything newer.
**Which row would have caught it:** none. It is invisible on every viewport, on a fresh load, and in
every suite — the only people who can see it are the ones you cannot reach.
**What the list is now:** `test/bump.js` — if the diff touches `engine/`, `CACHE` must have *changed*.
Both historical commits go red against it, which is why it is evidence and not a test that passes on
unchanged code.
**The general lesson:** a test that two things are EQUAL says nothing about whether either MOVED.

### E7 · An agent left the engine deliberately broken — 2026-09-10 (caught by review, not by a test)
**What happened:** during a crew work session, an agent doing mutation testing replaced
`setTimeout(sizeCanvas,80)` in the fullscreen button and the whole `fullscreenchange` listener with
`/*MUTANT*/`, and a `t3Resize()` call in `draw3d` with the same — to find out whether any suite
noticed. **It did not put them back.** Both files sat modified in the working tree while other work
carried on around them.
**What it would have cost:** fullscreen would have stopped resizing the canvas. `E1` on this very
page is a fullscreen escape that took two rounds to diagnose and reached the owner. This would have
been the same bug, shipped deliberately, by us.
**What caught it:** `git status --short` before staging, then reading the diff. Nothing else. Every
suite was green with the mutants in place, which was the agent's actual finding and is worth keeping.
**What the list is now:** the guarantee scan fails any `engine/` or `content/` line carrying `MUTANT`
or `DELIBERATELY BROKEN`, and `.claude/skills/crew-fix/SKILL.md` tells an agent to return patches as
**text** and never to edit a file, with the review steps marked not-delegable.
**The mistake inside the fix, which is the better lesson:** the first version of that net could not
see a single mutant. The scan blanks comments before testing each line — and a marker *is* a comment.
It was written, it looked right, and it caught nothing until one was planted to check.
**That is E5's lesson twice in one day: a guard has to read the noun it actually means.** The
guarantee scan could not see the town because it read what `index.html` loads. This could not see a
mutant because it read the code with the comments removed. Both looked correct. Neither was, and
only planting a real violation told us so.

### E8 · A test edited to fit the fix — 2026-09-10 (mine, caught on review)
**What happened:** the red test for the placement bug (`test/town.smoke.js`) cleaned up after itself
by calling `removeChill` by hand and then asking for the set again. My fix — `syncChill` — did not
pass that cleanup, because it trusted its own bookkeeping (`CHILLAT`) instead of the map. **I deleted
the cleanup**, replaced it with a plain `place(fx)`, and wrote a comment explaining that *"reaching
behind syncChill is the same mistake it exists to remove"* — then shipped the fix green and described
the deletion in the commit message as a lesson learned.
**It was an argument, not a fact.** `removeChill` is a public verb, nothing retired it, and a pack may
still call it. Beto caught it on review and measured the consequence: place a person, remove them by
hand, ask for the same set again — and they never come back, while the record counts them and the
key it hands back has nobody behind it. **The same sentence as the bug the whole verb was written to
remove.** Verified independently before accepting it: `bodies: 1 → 0 → 0`, `is that key on the map?
false`.
**Which row would have caught it:** none. Every suite was green.
**What the list is now:** the check is back, it is proven red against the version I committed, and
`syncChill` treats `w.npcs` as the truth with `CHILLAT` as a hint.
**The general lesson, and it is E2 sharpened:** E2 says *a test that pins current behaviour can pin a
bug.* This is worse and easier to do — **a test edited to fit a fix.** The tell was that I changed a
test I had not been asked to change, in the same commit as the fix it was failing, and explained it
persuasively. **A test that goes red at your fix is data. If you find yourself arguing with it, the
argument is the finding.**

---

### E9 · A comment described a game we do not have, for three days — 2026-09-11 (found by an agent, not by a test)

**What shipped.** `engine/engine3d.js:621-622`, written the day the realistic tram landed:

> *"THE DRIVER — a head and shoulders at the front window. Not a passenger: he is at the end the tram
> is travelling toward, and **he turns round with it when it reverses (below)**."*

`:637` then positions him from `TRO.dir`. **`TRO.dir` never changes sign.** `engine/engine.js:1173`
recomputes it at the start of every pass as `L.to>=L.from?1:-1` — a constant derived from the line
declaration — and `:1179` deletes the car once it passes the far end. On `st` it is always `+1`; on
`ex` always `−1`. **The car drives off the edge of the map and is reborn at the other end.** The
reversal the comment promises does not exist below or anywhere.

**How it escaped.** Nothing tests it, and the test that looks like it might does not:
`test/engine.smoke.js:1041-1049` asks whether the tram has wheels and a driver, and it has both.
`if(u.driver)driver++` passes for a driver welded to one end for the life of the game.

**Why it matters more than a stale comment.** The cab-at-each-end work was specified, drawn and
shipped; it is **decoration**, and nobody could know that without reading two files. Rigo's sentence:
*"if a world's tram drives off the edge of the map, the two cabs drawn on it are decoration."*

**How it was found.** The session's own brief asserted the reversal as established fact under a
heading reading *"verified by me at file:line."* **The agent checked anyway.** This is the second
false fact caught in the same brief — see `docs/meetings/2026-09-11-la-parada.md` §4 — and the
`/crew-fix` skill now carries a section saying an agent who contradicts the brief with a `file:line`
is doing the job.

**The rule bought with it.** *A comment that promises behaviour is a test that was never written.*
"below" is a claim about code, and this file already records (E5) what happens when a guard reads a
proxy for the thing rather than the thing.

### E10 · Twenty-eight measurements of a canvas nobody could see — 2026-09-13 (mine, a near-miss, caught in-session three hours late)

**Filed here on E4's and E8's precedent**, both of which are near-misses rather than escapes: it
reached nobody. It is in the register because **it changed the list** — step 0 exists because of it.

**What happened.** Measuring the claim mark in the town, I read 28 rows of pixels out of the world
canvas and reported them as passes. The town boots to its creator panel; `#world` carries `hidden`,
`#vp` lives inside it, and `[hidden]{display:none!important}` — so `#vp` was `0 × 0`. `sizeCanvas`
derives only `cv.style.height` from that width; the buffer is sized from constants and `draw()` fills
it regardless. **Every number was true and about nothing.**
**Which row would have caught it:** none. **No viewport catches this** — that is the point. It would
have passed at all five.
**What caught it:** a screenshot, three hours later.
**What the list is now:** step 0 — prove you are in the game before you measure it.
**The general lesson:** E2 says a test can pin a bug. This is one turn worse — **a measurement can be
perfectly accurate about an element that is not on the screen, and nothing in the number says so.**

### E11 · A one-in-twenty-five red that was a game bug, not a flaky test — 2026-09-13 (found by the suite and by Lupe; **not yet reached the owner, not fixed on this branch**)

**What escaped the list, not the owner:** `test/smoke.js` goes red roughly **one run in twenty-five**
on reachability, and had been doing so for longer than the branch that found it. Nobody wrote it down;
before 2026-09-13 it appears in no register here. It was read as the suite being moody.
**What it actually is:** a person occupies the grid as `"N"` — stamped at boot, by `addChill`, and
re-stamped on every wander step. Both `isSolid` and `auditReach`'s own `walk` refuse an `"N"` tile, and
the wander filter checks solidity, doors and tram danger and never asks whether the step walls anybody
off. A neighbour in the one-tile gap by the barbería at `ex` (19,1) puts 35 tiles and Doña Meche out of
reach **of the player as well as the audit**. Repro: occupy (19,1).
**Which row would have caught it:** none — it is not a viewport problem, it is a **sample-size**
problem. Against a 1-in-25 fault a single run prints green 96% of the time.
**What the list is now:** step 2 — say how many runs your green is, and treat an intermittent red as a
bug about the game until you have shown it is a bug about the test.
**State:** open. `docs/REGRESSION.md` R11 carries the assertion; `docs/BACKLOG.md` §8 row 10 carries
the fix. **Nothing about it is fixed on the branch that found it.**
**The general lesson:** a suite result is a sample, not a state. And `docs/POSTMORTEM.md` §7's *"a flake
is a state leak until proved otherwise"* now has a second candidate: **a world with a random mover is
its own fuzzer.**

### E12 · A phone held sideways has no controls, in both games — 2026-09-13 (found by Lupe, by opening a window; **not yet reached the owner, not fixed on this branch**)

**What escaped the list:** the landscape row has been on the matrix above since 2026-09-09 and **no
script in this repository has ever run either game in a landscape viewport** — every suite is 480×900,
390×560 or 390×844. Four days of "tested at both sizes", said in good faith, meant two portrait widths.
**What is actually there:** `.wrap{max-width:560px}` holds the viewport at ~528 px in any window wider
than 560; the world's height is its width × 8/10 ≈ 422 px; and the joystick, the d-pad and the Talk
button are `position:absolute` against the **viewport's** bottom, not the window's. In an 844 × 390
window the controls sit **100–120 px below the fold** in both games until you scroll or go fullscreen.
**Which row would have caught it:** *Phone landscape* — the row existed and nothing could run it.
**What the list is now:** the matrix carries a **who runs it** column, so an unrunnable row reads as a
gap in the table itself rather than in a footnote.
**State:** open, on `main`, in both games. The owner has not reported it; it is written here so it is
counted rather than re-discovered.
**The general lesson:** **a row of a checklist that no script can run is a row that gets skipped** —
and it silently vouches for coverage the list does not have.

### E13 · The review pictures were photographs of a document with its scroll box switched off — 2026-09-14 (Lupe, caught before the review, not an escape)

`docs/mocks/2026-09-14-cooking-world/render.js` sets `height:auto; maxHeight:none; overflow:visible` on the
reader so the whole document fits one picture. Every picture on the first review page was therefore a
true photograph of a thing no screen shows. **Which row would have caught it: none — it would have
passed at all five**, exactly like E10. **What the list is now:** step 0 gains a second clause —
*prove you are in the game, AND prove the screen is still the shape the game gives it.* Every picture
a mock-up carries now says `unmodified` or `unrolled` on its ticket (`docs/UI-REVIEW.md` §1, A2).
**The general lesson:** E10 was a canvas drawing in an empty room; this is a document photographed
with the room's walls taken down.

## Known gaps in the list

Written down so they are counted rather than re-discovered:

- **The fullscreen row is not automated.** It is currently a person changing the element's shape by
  hand. The fault is an aspect mismatch between the render buffer and the element, so it can be
  reproduced headlessly by giving the element a shape the buffer did not expect — read `t3Resize`
  in `engine/engine3d.js` and the `.viewport.fs` rule in the shells first. **Until this is a script,
  E1 can happen again.**
- **Landscape is not covered by any suite** — and the gap has a live fault in it, so it is E12 now, not
  a footnote. Every suite is portrait (480×900, 390×560, 390×844). Measured 2026-09-13 at 844×390 in
  **both** games: the joystick and the Talk button sit **100–120 px below the fold** until you scroll
  or go fullscreen. Not an escape (the owner has not reported it); counted here so nobody re-discovers
  it a fourth time.
- **No suite checks the town at phone size**, only Meridian.
- `test/smoke.js`'s portability scan is still Meridian's proper nouns, so it cannot catch a second
  world leaking its own names.
- **E4 has no mechanical guard.** Nothing stops a session running `git checkout -B` over its own
  unpushed work; the rule is words, and E3 is the proof that words are not enough. A pre-command
  hook that refuses `-B`/`--hard`/`-f` while `git log origin/<branch>..<branch>` is non-empty would
  be the real fix. **Until then, E4 can happen again, and next time the commit may not be pushed.**
