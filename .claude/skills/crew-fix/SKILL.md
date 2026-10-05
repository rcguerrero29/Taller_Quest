---
name: crew-fix
description: Put the city's crew to work on real bugs — agents diagnose, write the failing test FIRST, then fix, and Claude reviews every line before it lands. Use when the user says /crew-fix, hands over a list of bugs or play reports, says "have the agents fix it", "use the crew", "let the city fix this", or when several findings need fixing and each wants a different specialist. Never lands anything unreviewed.
---

# Crew fix — the city fixes its own bugs, and nothing lands unreviewed

*Opened 2026-09-10 at the owner's word: "why dont you have agents use the city to also fix the bugs
and you review these and have agents write tests and you review all that too? is this in the game?
add it as a skill."*

## The idea, in one line

**The crew already are the city** — Beto's engine room, Toño's ferretería, Chuy's paper shop, Pili's
paint shop, Cuca's works, Remedios' annex, Nacho's kitchen. They have been used to *advise*. This
skill puts them to **work**: they diagnose, they write the failing test, they fix, and the session
that called them **reviews every line before it lands.**

## Before anything: two files, and the second one is new

**Every agent on a crew run reads `docs/POSTMORTEM.md` first.** Opened 2026-09-12 at the owner's
word — *"make sure we are documenting and informing all agents of your findings, be them silly or
not, so they can make sure not to make your mistake"*. It is every way the sessions have actually got
it wrong, with what each one cost, including the stupid ones. It is short, it is specific, and three
of the mistakes in it were made *by the session that was writing up the previous one*.

Then `docs/REGRESSION.md`'s proxy register, before you write any guard.

**And one thing about how you check.** If your check **extracts** before it compares — a hash, a sort,
a trim, a regex capture — it has already thrown away position, order and neighbours, and **it cannot
report on any of them.** That is how nineteen persona files were verified byte-identical on 2026-09-13
while one of them carried a second copy of the shared block with another agent's whole persona
underneath it; it was live on `main` for two days and a published nineteen-file verification could not
see it (`docs/POSTMORTEM.md` §13c). **Name what your extraction discarded, in the same breath as the
result.**

## The rule that makes it safe

> **An agent may propose anything. Only a reviewed change lands.**

This is not ceremony. In this project, agents have already: cited a line number two off and pointed a
fix at the wrong function; claimed a clean tree while a file was modified; measured frame rates in a
browser the suites do not use and built a failure message on the number; and written a test that
passed under a *wrong* fix. Every one of those was caught by reading. **None would have been caught
by trusting.**

## The loop

    1. GROUND      one agent establishes what is actually true, in code, with file:line
    2. RED         one agent writes the FAILING test — and proves it fails on today's code
    2½. MOCK       what DONE looks like — RENDERED in the real game, never drawn. Before and after
    3. REVIEW      ← you. Does the test test the right thing? Would a wrong fix pass it?
    4. FIX         one agent makes it green, smallest change that removes the class
    5. REVIEW      ← you. Read the diff. Run every suite yourself. Look at it if it is visual.
    5½. WHAT GOES OUT  ask it of EVERY change, not the ones that look security-shaped
    ✋  ASK HIM       any time two things contradict — at whatever step it appears
    6. RECORD      the finding goes in a register, not only in a reply

**Steps 3 and 5 are not optional and are not delegable.** If you find yourself approving a diff you
have not read, stop: that is the failure mode this skill exists to prevent.

## Who to call

| Bug is about | Call | They own |
|---|---|---|
| engine correctness, a seam, what a change breaks in six months | `beto` | `engine/` |
| a tag, a glyph, a kind, whether a second game could say it | `tono` | `docs/TAGS.md` |
| it looks wrong / flat / hard to tell apart | `pili` | readability, silhouette, palette |
| the 3D looks fake, blurry, wrong depth | `chema` | `docs/3D-LOG.md`, and he MEASURES |
| a control cannot be reached, understood or escaped | `rosa` | interface, at real sizes |
| it worked on one screen and not another; proving a fix | `lupe` | `docs/QA-PASS.md`, the checklist |
| a room, a doorway, a sight line, furniture that blocks | `cuca` | interiors |
| the city's shape, which parcel, which business | `don-guero` | `docs/CITY.md` |
| words, a quest's voice, an ending | `nacho` | the story |
| EN and ES saying the same thing in the same voice | `paty` | both languages |
| CI red, a stale cache, a deploy that misbehaves | `yaz` | build and release |
| does this mechanic survive the tenth time | `tavo` | design |
| a doc that no longer tells the truth | `chuy` | `docs/`, the template |
| what is actually next, is the backlog honest | `remedios` | the ledger |
| would a player even notice | `chava` | he plays it, badly, on purpose |
| starting a whole new pack | `mari` | idea → first playable |
| **what this change lets OUT — every time, not when somebody remembers** | **`zeni`** | **the register of every edge, what we promised there, and which guard reads that exact noun** |
| **proving a guard actually fires** | **`melo`** | **planting real violations. He does not review a guard, he tries to walk past it** |

Every one of them opens with the same shared-memory block (see any file in `.claude/agents/`), so
they all read the registers before answering. **You still check them.**

## Writing the brief

An agent is only as good as what it was told. A brief that works here has five parts:

1. **The symptom in the owner's words**, verbatim. Not your summary of it.
2. **What is already known to be true**, with file:line — so they do not re-derive it or contradict it.
3. **What has already been tried and failed**, from the registers. The sugar skulls were "fixed"
   twice by changing a size and the owner came back twice; the third fix only worked because the
   brief said so.
4. **The constraint**: a RULE goes in the engine and must be behaviour-identical for both games; a
   CHOICE becomes a seam a pack answers. Red before green. Every engine change bumps `GAMEV` in each
   pack config **and** `CACHE` in `sw.js` together.
5. **What "done" looks like** — which suite, which message, what a person would see.

### ❗ The brief is evidence, not authority — and the session writing it is the least reliable part

*Added 2026-09-11, with two receipts from a single run.*

Part 2 above tells you to write down *"what is already known to be true, with file:line — so they do
not re-derive it or contradict it."* **That sentence is the most dangerous one in this file**, because
the session writing the brief is summarising a codebase it half-remembers, and an agent told not to
contradict will not.

On 2026-09-11 one brief carried two false facts under a heading reading *"verified by me at
file:line"*:

- *"the ruling that is already settled and may not be re-litigated… No summoning."* The owner had
  asked for the call **by name** three days earlier (`docs/ASKS.md:52`). **Beto refused the brief and
  went to the register.** Had he obeyed it, the run would have deleted a feature the owner requested,
  and the commit would have called it a ruling.
- *"The car reverses at the end of the line… a driver who changes ends (you specified that last run
  and it shipped)."* **It does not reverse.** `engine/engine.js` sets `TRO.dir` once from the
  line declaration (grep `TRO.dir=`) and nothing ever flips the sign. **Rigo read it instead of accepting it**,
  and found that the `engine3d.js` comment promising a reversal (grep `reverses`) describes something that does not exist — so shipped,
  drawn work is decoration.

**So: an agent who contradicts the brief with a `file:line` is doing the job, not failing to follow
it.** That is the single most valuable thing an agent can return, and it must never read as
insubordination. Two rules follow, and they are cheap:

- **Mark every line of your brief with where it came from.** `[CODE]` means the session opened the
  file this hour. `[MEMORY]` means the session believes it and did not check. **A brief with no
  `[MEMORY]` lines is a brief that has not been honest about itself.**
- **Never write "settled" over anything but a quote.** If you cannot paste the owner's words and the
  file they live in, it is your inference, and it must be labelled as one and put to him.

## Step 2½ — the MOCK: show what DONE looks like before you fix anything

*Owner, 2026-09-11: "mocks as goals to fix (this is newly mentioned but sounds like something we
should do if we dont already for all agents)."*

**We have done this once, ad hoc, and it was the best-run change on this board.** Asked to make a tall
thing turn to glass, the crew did not argue about a number — three panels were **rendered in the real
game** at today, depth-only, and ghost-at-0.55, and the owner picked by looking. One message, no
rounds. Everything else on this board has cost three.

**So it is a step now, between RED and FIX.**

### The rule that makes a mock worth anything

> **Render it. Do not draw it.**

A drawn mock can promise something the engine cannot do, and then the fix is measured against a
picture nobody can reach. A mock produced *by the real code* — even code you throw away ten minutes
later — is a promise the engine has already kept once.

Order of preference, and say which one you used:

1. **The real game, real screenshot**, with the change forced in by any hack you like (stub the
   update, pin a value, inject a function). Throw the hack away. Keep the picture.
2. **The real game, measured** — the numbers the fix must produce, taken from a forced state.
   A dwell of 4200 ms is a mock. A table of `TRO.state` over a full run is a mock.
3. **A canvas drawing**, only when the thing does not exist yet at all. Say so out loud.

### What a mock is, and is not

| A mock is | A mock is not |
|---|---|
| **Before and after, in one message** — the reader must be able to see the difference without being told it | An after with no before |
| **The smallest thing that shows it** — one tile, one panel, one frame | A tour of the feature |
| **Two or three options when the call is the owner's** — and you say which you recommend | One option presented as inevitable |
| **Honest about what is faked** — "the tram is pinned, the dwell is a literal" | A picture that implies more works than does |

### Why this is between RED and FIX, and not before RED

Because **a mock of the wrong thing is worse than no mock.** The red test is what proves you are
looking at the real defect; the mock is what proves you know what fixing it looks like. In that
order, the mock is a goal. In the other order, it is a guess with a picture attached.

**And it is what the owner reviews.** He reads code when he has to and pictures when he can. A run
that hands him three screenshots and one sentence costs him a minute; a run that hands him a diff
costs him an evening.

## Reviewing a test — the four questions

This project has shipped a test that pinned a bug and guarded it (`docs/QA-PASS.md` E2), and a
guarantee scan that could not see the thing it guarded (E5). Ask every time:

- **Is it red on unchanged code?** Make them show it. "It would fail" is not evidence.
- **Would a WRONG fix pass it?** The freeze test was first written injecting through `draw()` — a
  fix that only wrapped `draw()` made it green while the game still froze on everything else.
- **Does the failure message name what a PERSON would say?** Not the function that returned false.
- **Can it pass vacuously?** A check that needs content the pack lacks will pass by finding nothing.
  That is not a pass, and the gauge (`docs/GAUGE.md`) exists because six of them do it.

## Reviewing a fix — what to actually do

- **Read the whole diff.** Not the summary of the diff.
- **Run every suite yourself**, both shells: `test/smoke.js`, `test/town.smoke.js`,
  `test/engine.smoke.js --index index.html` (and `--index` on any other world it reaches), `test/gauge.js`,
  and `test/public.js` on a built artifact. `CHROMIUM_PATH=/opt/pw-browsers/chromium` where needed.
- **If it is visual, LOOK at it.** Take the screenshot. Twice now a number said a thing was fixed and
  the owner's eyes said it was not, and his eyes were right both times.
- **Check the version bump** if `engine/` moved. `test/bump.js` catches a missing one now; it exists
  because two engine changes shipped without it and no returning player ever got them.
- **Check nothing scratch is staged.** `git status --short` before every commit. Scratch has reached
  `main` four times in one day in this repo, every time by somebody being careful.

## The flight notes — every agent, before and after, every time

*Added 2026-09-11 at the owner's word: "lets try to get agents to be forced to document how they can
improve before they start the task and after too to try to keep improving themselves and their
persona based on their experience in the first iteration, they have to ensure their persona was
fitting or they modify it to plan or execute better."*

**Two short notes bracket every job.** They go in `docs/crew/FLIGHT-NOTES.md`, newest first, and the
next iteration READS THEM FIRST. That reading is the whole mechanism: without it, iteration two is
iteration one with a different random seed.

### Before — the pre-flight, three sentences

1. **How I intend to work this**, in one line.
2. **What my persona equips me for here** — the specific thing about being *this* person that helps.
3. **Where I expect my persona to fall short on this job**, named in advance.

That third one is the load-bearing sentence. An agent that cannot name a gap before it starts has not
read its own brief.

### After — the post-flight, four sentences

1. **What my persona got right**, with the moment it happened.
2. **Where it got in the way, or was simply silent** when I needed it.
3. **The gap I predicted — did it appear?** A wrong prediction is a finding, not a failure.
4. **The edit I propose to my own file**, as exact text, or *"none, and here is why not"*.

## Before you write a guard, read the register of proxies

`docs/REGRESSION.md` carries **a register of guards that read a proxy for the thing they meant** (its table holds the count) — the first eight
found in five days, and **two of them written by the session that had just found the other eight.**
That last fact is the useful one: **knowing about the mistake does not stop you making it.**

Four things they had in common, worth checking your own guard against before it lands:

1. **The proxy is always cheaper to read than the thing** — a filename, a string equality, a bounding
   box, a membership test. The correct noun usually needs a behaviour to be exercised.
2. **The proxy is usually correct today.** They fail when the world grows a second case.
3. **A green guard is not evidence.** Eight ran green for days or weeks.
4. **A red guard is not evidence either.** `test/leaves.js`' first run named five persona citations of
   files that did not exist; **two of the five were invented by its own pattern**, because a regex
   alternation takes the first branch that matches and it listed `.js` before `.json`, so `test/spots.json`
   was read as a file that has never existed (`docs/POSTMORTEM.md` §13g). The remedy those two names
   prescribed was *edit two files that were already correct*. **Before you carry a new guard's output
   anywhere — red or green — point it at one case whose answer you already know.**

**The question, and it is not optional:** *if I break the thing this is for, in the smallest and most
plausible way, does it print a sentence a person would say?* **If you have not run that, the guard is
untested however green the suite is** — which is what `melo` is for, and what step 5½ asks of every
change. **Load the `guard` skill before writing the assertion** (2026-09-15): it carries the four
ways a guard fools its author while asking the right question — it supplies its own inputs, it has
nothing to measure and passes anyway, it reads the clock, or it measures the container instead of
the thing. All four were written in one day by a session that had just finished writing up the
register warning about them.

**And the second question, which is cheaper: what does this guard print when it cannot read the file
at all?** If the answer is its pass sentence, it is not a guard, it is a claim. A quoted `"on":` key
made the workflow check report *"no workflow can be started by a label or a comment"* about a file it
had just failed to parse (`docs/POSTMORTEM.md` §13f). **Not finding the thing is a RED.**

**And when the plant lands, wire it.** A plant proves the guard fired once, against one draft, on one
afternoon; what keeps it true is a case that runs on every push. **Say which step runs it, by name.**
On 2026-09-13 six plants against `test/leaves.js`'s workflow check were written up in a register as
its self-test, and `node test/leaves.js --selftest` is invoked by no workflow and no suite — so each
of the six regressions they were bought against can quietly return (`docs/POSTMORTEM.md` §13h,
`docs/BOUNDARY.md` G9).

**And the lab has a timestamp.** A plant runs in a copy of the tree *outside* the repository, and the
branch does not stop while you work: on 2026-09-13 two commits landed under a five-hour lab, so every
result in it was a claim about a tree that no longer existed. `git diff <snapshot>..HEAD` showing
"none of the guards moved" is reasoning, not evidence — re-sync, re-establish green, and **re-run every
plant that GOT PAST**, because those are the only ones whose answer an upstream change can flip.

**If your evidence is a number taken off a page, the plant is not enough.** Take the screenshot too,
and check the element you measured had a non-zero box. A measurement of an unmounted element is green
and true and about nothing (`docs/POSTMORTEM.md`, grep `the pixel instrument measured a canvas in an
empty room`; `docs/QA-PASS.md` step 0 and E10).

## Persona edits: proposed by the agent, decided by the session

*Settled 2026-09-21, the owner: "yeah update the older ones so you can make the decison to update personas."*
An agent proposes an edit to its own file in its post-flight; the run writes that proposal to
`docs/personas/proposed/<persona>/<RUN-ID>.md` — always, because it is the record — and **the calling
session then applies it to `.claude/agents/` or refuses it, in writing**, in the run file and in the
ledger at the top of `docs/crew/FLIGHT-NOTES.md`. No agent edits any persona file, its own included.
The owner overrules any of it at any time.

## The mural — one panel per agent, in your own hand

*Owner, 2026-09-11: "i want the mural please" → then "can be more creative and if its that way one
per agent but they can collaborate with one too" → then "remind them to be creative and that it
doesnt have to be a report, just to reflect what is the persona - good representation so they have to
keep adding to the mural in the same amount of effort, if possible."*

**Every agent on a run proposes one mural panel.** It goes on the crew's wall, which
lives in a private pack — you propose it, the calling session paints it, exactly like a
persona edit. It is not optional and it is not a summary of your report.

> **2026-09-14, the owner, after the cooking-game run painted nothing:** *"ensure any crew mode
> creates a mural entry"* and *"agents need to be more creative please."* That run's brief was
> written by hand for a workflow and dropped this section, so seven designers returned and the wall
> got nothing. **Two rules from it.** (1) **A brief is never written by hand.** Copy this section into
> the brief verbatim, for every agent, every run; `test/town.smoke.js` fails the build when an
> iteration numbered 8 or later in `docs/crew/FLIGHT-NOTES.md` has no panel with its number on the
> wall. (2) **Your hand is a MATERIAL, not a style.** Chava read the whole wall the same day and could
> name every painter from their *subject* and none from their *hand*: the palette, the stroke, the
> monospace lettering and the cream ground are the same on all thirty-two panels — one draughtsman's
> notebook, not eighteen people. So choose what your panel is *made of* — chalk on slate, newsprint,
> a wet photograph, a punched card, a napkin, a signwriter's enamel, a customs stamp, a rolling-road
> printout — and paint it in **a palette of your own**. `MURPAL` is the wall's, for the ground and
> the dado; it is not yours. A panel that could have been painted by anyone on the crew is not yours.

### What a panel is

| It is | It is not |
|---|---|
| The one thing you found that cost something to find | A list of what you did |
| **A drawing** — the idea, in a picture, at reading size | A caption with a rectangle behind it |
| Drawn **the way YOU see** — your trade's own paper | The house style |
| Short words that sting | A paragraph of findings |

**Your hand is the point.** The wall already has a drawing-office blueprint, a dimension drawing with
the lie hatched in, a depot signwriter's board, a wall of labelled drawers, a cross-section with a
scale rule, a race with the gap dimensioned, and the one with steam in it. **Nobody should have to
read the label to know whose panel they are looking at.** If your trade has paper — a plan, a ticket,
a spec sheet, a sample card, a proof — draw on that paper.

**And it does not have to be a report.** A joke lands. A single object lands. The thing you refused
lands hardest of all. The owner asked for the harsh ones by name.

### The effort bar, in his words

> *"good representation so they have to keep adding to the mural in the same amount of effort, if possible"*

**The same effort as the work.** A panel dashed off in four lines while the report ran to four
thousand words is the wall telling the truth about what you thought mattered, and it is the wrong
truth. Budget for it.

### What you return

```
MURAL PANEL
id:     <agent>-<three-or-four-words-in-spanish-or-english>
by:     "<agent>"          (lowercase; the wall files the panel in that painter's bay)
title:  {en, es}
said:   {en, es}   — the sentence. Yours. Short enough to sting
state:  {en, es}   — where you are NOW, as a position held today, not a feeling
who:    {en, es}   — you, in one clause, in the third person
cap:    {en, es}   — what it cost to find. Two or three sentences, no file paths
aspect: <height as a fraction of width, 0.40–0.50>
art:    (g,W,H)=>{ ... }   — real canvas 2D. Use MURPAL, murGround/murPaper/murDim/murBody/murTram
```

### The three rules that bind it — the ruler, and the two that make the wall a wall

- **Type on this wall is absolute; your drawing is not.** Captions are set in pixels (`bold 11px`,
  `12px`) and every panel is drawn in **fractions of `W` and `H`**, so the two scales come apart the
  moment your panel is a different size from the one you copied. **Size your people against the
  LETTERING, not against the frame.** `murBody`'s height is the ruler and its width now follows it
  (the wall's own file, grep `function murBody`) — until 2026-09-13 it was five pixels
  wide at any height, which made one painter's crew ants under 12px type and another's clerk a pencil,
  and cost three repaints in an hour (`docs/POSTMORTEM.md` §13l).
- **Add and improve, never remove.** `docs/crew/MURAL-LEDGER.txt` fingerprints every panel's WORDS
  and the town suite fails the build if one goes missing, is renamed, reordered, or edited after the
  fact. **You may repaint. You may not rewrite.** So get the words right and feel free to improve the
  painting forever.
- **The past and the present only** (`docs/ARCH-LOG.md` A3). *"I read the code instead of the brief"*
  belongs on a wall. *"Somebody should fix the comment"* may never appear on one.

## Changing your own persona — the rules that make it safe

An agent editing its own definition can drift a long way in two iterations, quietly, and end up a
more agreeable version of itself. So:

- **You PROPOSE. You never edit `.claude/agents/*.md` yourself.** The calling session applies it, or
  does not, and says which.
- **Every proposed edit cites the moment in THIS run that motivated it.** "I would work better with
  more latitude" is not evidence. "I spent four tool calls rediscovering that raycasting was already
  rejected, because my file does not point at `docs/3D-LOG.md`'s rejected list" is.
- **You may not soften what you refuse.** Every persona here has one thing it will not do — Rigo will
  not call a toy realistic, Chuy will not touch code, Melo will not audit a guard instead of trying to
  walk past it. **That line is the point of the persona and it is the first thing pressure erodes.**
  Proposing to relax it is itself the finding, and the answer is no.
- **Additive beats rewriting.** A pointer to a register you kept re-deriving, a number you had to look
  up twice, a trap you fell into — those are good edits. Restating your whole character is not.
- **Every proposal gets a row in the ledger at the top of `docs/crew/FLIGHT-NOTES.md`, with a
  verdict, before the run closes.** Applied or refused, both in writing. This is not bookkeeping: on
  2026-09-11 a session wrote the rule "the calling session applies it or refuses, in writing" and then
  closed the run without doing it, and the proposal sat unactioned for a day — **because an un-applied
  proposal looks exactly like a declined one, and both look like nothing at all.** A blank row is
  visible. An absence is not.
- **"None, and here is why not" is a strong answer.** A persona that fitted is information. An agent
  that proposes an edit every round is performing improvement rather than improving.

## ✋ When two things contradict, ask him

*His instruction, 2026-09-11: "you should ask the owner or me when that arises… im here so feel free
to ask qs."*

**This is not a step in the loop. It interrupts whatever step you are on.** Iteration 1 is the
argument for it: the designer said the trolley line is worthless because both streets already touch
by a door; the tranviario said the menu should be killed outright and cited a settled rule to do it;
and the owner's actual answer was **neither** — *"if i can step into it its not about whether it
takes me to a new place i couldnt get to, but the convenience."* Two careful agents, both reasoning
from real evidence, and one sentence from him settled it. **Nobody could have derived that. They
could have asked.**

What a good question looks like: **both sides with `file:line`**, what each would have you build, and
the one thing you need from him. What a bad one looks like: a question you could have answered by
reading, or a summary that hides which two things actually collide.

And keep working while you wait. Do everything the answer does not change.

## Step 5½ — what does this change let out?

**Ask it of every change. That is the whole mechanism.** On 2026-09-10 the owner's private backlog
tool was found on the public internet, served
for as long as the site had been up. A guard existed for exactly that and could not see it, because
it read *what `index.html` loads* and the town loads nothing from there.

**Nobody had decided that change was security-relevant, and that is precisely why it got through.**
A step that only fires when somebody notices the risk is not a step, it is a hope.

So, three questions, on every change, cheap enough that skipping them saves nothing:

1. **Does this change what we publish?** Anything touching `.github/workflows/`, `scripts/build-site.sh`,
   `sw.js`, `manifest.webmanifest`, or adding a top-level folder. If yes → **`zeni`**, and R10 must
   have run on the built artifact, not on the source tree.
2. **Does this change a GUARD?** If the diff touches `test/`, ask what noun that guard now reads, and
   whether it is the noun it means. **The register in `docs/REGRESSION.md` §3 is the count, and it
   keeps growing** — R8 read what the index loads; the mutant net read the source with comments
   stripped; the version test asked whether two strings were *equal* when what mattered was that one
   *moved*; and on 2026-09-13 five guards written that morning were walked past the same afternoon,
   **four of them because they read an aggregate — a count, a hash, a shape — where the noun was an
   identity or a content**. **None was caught by review. Each was caught by planting a violation** →
   **`melo`**. **A guard's most dangerous hour is the one right after it first goes green.**
3. **Does this touch a credential, a save, or something a stranger's browser evaluates?**
   `sanitizeSave`, the QR transfer, anything written into the DOM, anything read from an API.

**A "no" to all three is a fine answer and takes ten seconds. The cost is asking, not answering.**

## Where the finding goes afterwards

A fix that leaves no trace teaches nobody. Route it:

- a tag/vocabulary problem a second game would hit → `docs/TAGS.md` leak register
- a decision NOT taken, with its options → `docs/ARCH-LOG.md`
- something that reached the owner that should not have → `docs/QA-PASS.md` escape register
- a 3D attempt, including a failed one → `docs/3D-LOG.md`
- outside-sourced research (`[WEB]`) → the full sweep to `docs/research/YYYY-MM-DD-<topic>.md`, tags
  and URLs intact, **and at least one rule to `docs/GENRE-RULES.md`** with its trap. A sweep that
  ends in a task output is a sweep nobody will ever read again
- the owner's words → `docs/ASKS.md`, verbatim, **before** the work starts
- what the engine demands of a new world → `docs/GAUGE.md`

## Is this in the game?

**Partly, and the gap is worth naming.** The crew are already buildings on the town's street, and
`docs/CITY.md` plans more. What the town does *not* yet show is **work happening** — you can visit
Beto's engine room, but you cannot see that Beto is mid-way through a fix, or that a test went red an
hour ago. `docs/ARCH-LOG.md` A3 settles what is allowed there: a record of the **past** and of the
**present** is fine, a list of the **future** is the banned thing. So "Beto is fixing this" is legal
and "Beto should fix that" is not. Not built; recorded here so it stops being re-proposed from
scratch.
