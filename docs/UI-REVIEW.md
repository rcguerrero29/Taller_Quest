# UI review — how a mock-up is reviewed before anything is built

*Opened 2026-09-14 at the owner's word: "make sure we have a ui review process where we include
engineers, our agents, UI, story, QA, and this is for mockups yes." The process is Lupe's, from crew
run 8 (`docs/meetings/2026-09-14-la-cuadrilla-run-8.md`, her return), written here so that seven
people who are not QA can sign it. Mock findings live HERE, never in `docs/QA-PASS.md` — that file's
own preamble says it grows from real escapes and from nothing else.*

*The first review under it is the journey mock-ups for [cooking world] (§6, block 1). The pictures it
reviews are in `docs/mocks/2026-09-14-cooking-world/journey/` with their tickets in `manifest.json`.*

## 0 · Why this exists, in one sentence

A mock-up is the cheapest thing on this project to be **accurate about and wrong with**, because the picture and the screen are different objects and nothing in the picture says which one you are looking at. That is `docs/POSTMORTEM.md` §13 *"3 and 9, extended"* wearing a different hat: there a canvas drew in an empty room; here a picture is taken of a document with its scroll box switched off.

---

## 1 · THE ADMISSION TICKET — what a mock must carry to be reviewable

**A mock without all six is refused at the door, unreviewed.** Not failed — *refused*, which costs the maker ten minutes and costs the eight reviewers nothing. Every one of these exists because the current mock page is missing it.

| # | It must carry | Why — the failure it prevents |
|---|---|---|
| **A1** | **The row of the matrix it was drawn at**, by name, not by a number somebody typed. `390×844`, not "360". If it is not one of the five rows, it is not a size, it is a preference | The current page's `m4-…-560-…` was rendered at a **640-wide window** with a **620-wide sheet** (`render.js:44`; measured 1240 device px ÷ dsf 2). Three numbers, none of them equal |
| **A2** | **Whether the screen's own scroll/clip was left ON.** One word: `unmodified` or `unrolled` — and an `unrolled` picture may illustrate, never decide | `render.js:24-26` sets `height:auto; maxHeight:none; overflow:visible` on the reader before every shot. Every picture on the page is `unrolled` and none of them says so |
| **A3** | **The fold line drawn on the picture**, if the thing is taller than its box, plus the two numbers: document height and visible height | Without it a reviewer signs off a screen having seen 100% of a thing a person sees 54% of |
| **A4** | **What is real and what is drawn.** Per element: shipped / faked / not-yet-a-thing. A fake that looks shipped is the most expensive line in a review | Beto and Yaz cannot answer "is it buildable" about a picture that will not say which half already is |
| **A5** | **The before**, when the screen replaces one. Same row, same language, same shell, same word on A2 | `docs/POSTMORTEM.md` §5: when you diff two pictures, change one thing |
| **A6** | **EN and ES, and the shell it lives in** (cream or night). If the owner asked for night — he did, for [partner]'s questionnaire — a cream picture is not the screen | The current page: **1 of 8 pictures in Spanish, 1 of 8 in night**, and the night one is the recipe, not the thing he asked for in night |

**And one rule about the file name, because it is the field a reviewer trusts without checking:**
`<id>-<screen>-<WxH row>-<lang>-<shell>-<unmodified|unrolled>.png`. A name that disagrees with the picture is a lie a register will repeat for a week.

---

## 2 · WHAT "PASS" MEANS FOR A MOCK

A mock is not code and must not be graded like code. **A mock passes when the picture answers the question it was drawn for, at every size a person will hold it, and a reviewer can say what they would build from it.**

Four verdicts only, and they are not "approved / rejected":

- **ANSWERS** — the picture settles the question. Build from it.
- **ANSWERS, WITH A NOTE** — settled; a named, costed change to make on the way to code. The note is written down, not remembered.
- **DOES NOT ANSWER** — the picture is fine and the question is still open. **This is not a failure of the mock.** Say what extra picture would answer it.
- **REFUSED** — missing an admission ticket field, or drawn at a size nobody holds. Ten minutes, back to the maker.

**Three things a mock review may never do**, each because it has cost this project before:

1. **It may not pass a screen on one picture.** Same rule as the code (`docs/QA-PASS.md`, the rule at the top). A picture from one size is not a result.
2. **It may not grade the drawing's quality** — that is Pili's signature line, and only hers.
3. **It may not become a test.** A mock is a proposal. Pinning it as an assertion is `docs/QA-PASS.md` E2 in advance: a bodyguard for a decision nobody has taken.

---

## 3 · THE CHECKLIST — eight signature lines

**A signature line is a sentence that can be FALSE.** "Reviewed by Rosa" is a ritual. "Every control on this screen can be pressed at 844×390 without scrolling" is a signature. If you cannot imagine the sentence being false, it is not a signature and it goes back.

**Run order matters: QA (row 6) runs FIRST**, because the other seven are reviewing pictures and my job is to say whether the pictures are of anything. Then art, story, words, UI, engineers, play, ledger.

| # | Role | Who | The line they sign | What makes it FALSE |
|---|---|---|---|---|
| **6** | **QA — runs first** | **Lupe** | *"Every picture in this review carries its admission ticket, was taken with the screen's own clip ON, and exists at all five rows of the matrix in both orientations; where a screen is taller than its box I have drawn the fold and stated the two numbers."* | any picture `unrolled` and not labelled; any row missing; any size in a filename that is not the size in the picture |
| 1 | **Engineers** | Beto, Yaz | *"Every element on every screen is either shipped today — named with `file:line` — or listed as new work with a cost; nothing in these pictures is a capability the engine does not have and nobody has priced."* | one element nobody can point at, in either column |
| 2 | **Art** | Pili | *"Each screen reads at 360 CSS px wide as the one thing it is, and no mark carrying meaning survives only because I already knew what it meant."* | a mark she has to explain; a meaning carried by a fill instead of a silhouette (§13j) |
| 3 | **Story** | Nacho | *"Each screen says ONE thing a person reads without being told, and I can write that thing in one sentence under the picture."* | two sentences needed; or the sentence is about the feature, not about the person |
| 4 | **Words** | Paty | *"Every string exists in EN and ES, both fit at the narrowest row without sideways scroll or truncation, and no label is a bare glyph."* | ES overflow; `scrollWidth > clientWidth`; a button whose label is `✕` alone |
| 5 | **UI** | Rosa | *"Every control is reachable, ≥44×44 px, has a visible pressed/disabled/empty state, and no screen is a dead end: from each one I can name the way back."* | a control below the fold with no affordance saying so; a screen with no exit |
| 7 | **Play** | Chava | *"I opened this cold, in order, at phone size, and I can say what I thought it wanted from me — and here is where I was wrong."* | he cannot say; or he was wrong and nobody wrote it down |
| 8 | **Ledger** | Remedios | *"Every finding above is in the ticket shape — `In plain words:` · `Notes:` · `Questions to consider:` · `Areas affected:` · `Done when:` — and each names a screen, a row and a verdict."* | a finding that lives only in the review text |

**The genre line, signed by whoever holds the pen, on every screen without exception:**
> *"There is no clock, no countdown, no day budget, no streak that can break, and nothing on this screen counts down."* (`docs/GENRE-RULES.md` R10, R11, R15; the owner: *"no timer, we chill"*.)

It is here rather than in a role's row because it is the one rule the owner stated twice, and a rule with no signature line is a rule nobody runs.

---

## 4 · WHERE THE FINDINGS GO — recommendation

**Recommend: a new `docs/UI-REVIEW.md`. Do NOT put mock findings in `docs/QA-PASS.md`.**

Three reasons, and the first is the only one that matters:

1. **`docs/QA-PASS.md`'s own preamble says the list grows from real escapes and from nothing else** (`docs/QA-PASS.md:6-7`). A mock finding is not an escape — nothing reached the owner. Filing one there dilutes the single register in this repository where every row was paid for, and a diluted escape register becomes the ritual its own preamble warns about.
2. **Seven of the eight signatories are not QA.** QA-PASS is "Lupe's list" by its title line; a wall Pili and Nacho sign needs a page that is nobody's.
3. It keeps the two questions apart: *what escaped* (QA-PASS) and *what we decided from a picture* (UI-REVIEW).

**The shape of `docs/UI-REVIEW.md`, as it stands:** §1 the admission ticket · §2 what pass means · §3 the eight signature lines · §4 this recommendation, kept as the record of why · §5 the red tests a mock inherits · §6 **the review ledger** — one block per review, per screen: the screen, the row, the verdict, the eight signatures with the date, and every finding in the ticket shape.

**Two cross-links, and nothing else moves:** a row in `docs/OPEN.md` §3's register table; one line under `docs/QA-PASS.md`'s matrix reading *"Mock-ups are reviewed under `docs/UI-REVIEW.md`; only what reaches the owner is written here."*

**The one thing that DOES belong in QA-PASS today** — filed on E4/E8/E10 precedent (near-misses that changed the list):

> **E13 · The review pictures were photographs of a document with its scroll box switched off — 2026-09-14 (mine, caught before the review, not an escape)**
> `docs/mocks/2026-09-14-cooking-world/render.js:24-26` sets `height:auto; maxHeight:none; overflow:visible` on the reader so the whole document fits one picture. Every picture on the review page is therefore a true photograph of a thing no screen shows. **Which row would have caught it: none — it would have passed at all five**, exactly like E10. **What the list is now:** step 0 gains a second clause — *prove you are in the game, AND prove the screen is still the shape the game gives it.* **The general lesson:** E10 was a canvas drawing in an empty room; this is a document photographed with the room's walls taken down.

---

## 5 · THE RED TESTS A MOCK INHERITS WHEN IT BECOMES CODE

Written now, at mock time, so the builder inherits them with the picture. **Each names the plant that must go red first** — a test that has never been red proves nothing (`docs/QA-PASS.md` step 1).

| # | The assertion | Plant it red by | Status today |
|---|---|---|---|
| **M1 · the fold** | The screen's primary action is reachable at 844×390 without a scroll the person must discover | shrink the scroll box to 207 px and assert the action is hit-testable | **RED ON THE SHIPPED READER.** At 844×390 the week strip's only button, *Copy the shopping list*, is below the fold |
| **M2 · the end-of-document lie** | A document taller than its box shows an affordance saying so, above the bar | load a doc 2× the box and assert the affordance exists | **RED.** The only mark between the last visible line and the bar is a dashed rule that reads as the end |
| **M3 · target size** | Every control ≥44×44 CSS px at 390×844 and 844×390 | shrink one control's padding by 4 px | green today (44–48 px measured everywhere) |
| **M4 · input zoom** | Every `input`/`textarea`/`select` in the reader has `font-size ≥ 16px` | set one to 15 px | **RED.** The reader's fields are `.85rem` = **13.6 px** (`index.html:191`, measured). On iOS Safari a focused field below 16 px zooms the page — `[TRAINING]`, not verified on a device |
| **M5 · both languages** | Every screen renders EN and ES with `scrollWidth ≤ clientWidth` | plant a 40-char ES label | unmeasured per row; ES exists for 1 of 8 screens |
| **M6 · both shells** | Every screen renders in cream and in night | render night only | green for the recipe; 1 of 8 screens has a night picture |
| **M7 · fullscreen is on at the shot** | `vp.classList.contains('fs')` is asserted **at the moment the picture is taken** | take the shot with the class added *before* opening the screen | see §6.4 — the obvious recipe silently produces a non-fullscreen picture |
| **M8 · no clock** | No screen's strings contain a countdown, a timer or a day budget | plant `"2:00 left"` | not written. `docs/GENRE-RULES.md` R10/R15 has no guard |

---


---

## 6 · THE REVIEW LEDGER — one block per review, per screen

*The shape: the screen · the row · the verdict · the eight signatures with the date · every finding in
the ticket shape (`In plain words:` · `Notes:` · `Questions to consider:` · `Areas affected:` ·
`Done when:`). A signature is a sentence that can be false; "reviewed by" is not one.*

### Block 1 · [cooking world], the journey — thirteen screens — opened 2026-09-14

**What was reviewed.** The page *[cooking world], the journey* (published as an artifact; its documents
are `docs/mocks/2026-09-14-cooking-world/journey/mockdocs2.js`, its camera `render2.js`, its tickets
`manifest.json`, thirty pictures). Screens: 0 the questionnaire · 1 the front door · 2 the street ·
3 the household · 4 a drawer · 5 the shifts board · 6 the recipe as the house reads it · 7 the
Collection · 8 the merge board · 9 making a dish by hand · 10 the house card · 11 the day nothing
happened · 12 the map before and after.

**The admission ticket, as the maker filed it.** A1 rows: phone portrait 390×844 and phone landscape
844×390 — **two of the five**, said on the page. A2: every picture is labelled `unmodified` or
`unrolled`. A3: the fold is drawn on every unrolled picture with the two numbers. A4: every screen
carries *what is real / what is drawn*. A5: the map carries its before. A6: EN and ES at 390×844,
night shell for every document; the front door, the street and the map are cream because that is the
shipped game.

**The genre line**, signed by the pen on every screen, 2026-09-14: *there is no clock, no countdown,
no day budget, no streak that can break, and nothing on this screen counts down.*

**The verdict table** (Doña Remedios, crew iteration 9 — counted from `manifest.json`: 30 pictures ·
2 of 5 matrix rows · EN 24 / ES 6 · night 26 / cream 4 · `unmodified` 24 / `unrolled` 6; ten screens have
a picture, three are drawings and have none).

| Screen | Rows it exists at | Verdict | Why, in six words |
|---|---|---|---|
| 0 · The questionnaire | 390×844 EN night (×2) | **ANSWERS, WITH A NOTE** | It is the degraded state, unlabelled |
| 1 · The front door | 390×844 EN cream + a live drawing | **DOES NOT ANSWER** | The relabelled doors have no size |
| 2 · The street | 390×844 EN cream | **ANSWERS** | Real game, untouched, whole |
| 3 · The household | none — a drawing | **REFUSED** | No row, no ticket, no file |
| 4 · A drawer | 390×844 EN+ES, unrolled EN, 844×390 EN | **ANSWERS, WITH A NOTE** | Sideways shows 207 of 783 |
| 5 · The shifts board | same three | **ANSWERS, WITH A NOTE** | Same fold; cards are drawn |
| 6 · The recipe at home | same three | **ANSWERS, WITH A NOTE** | 887 px document, 207 px window |
| 7 · The Collection | same three | **ANSWERS, WITH A NOTE** | Whole standing up, clipped sideways |
| 8 · The merge board | none — a drawing | **REFUSED** | No row, no ticket, no file |
| 9 · Making a dish by hand | none — a drawing | **REFUSED** | No row, no ticket, no file |
| 10 · The house card | same three | **ANSWERS, WITH A NOTE** | ES grows 500→553; still fits |
| 11 · The day nothing happened | same three | **ANSWERS, WITH A NOTE** | One rule above the bar, unreadable |
| 12 · The map, before and after | 390×844 EN cream, before + after | **ANSWERS, WITH A NOTE** | The after cannot be re-shot |

**The eight signatures.** Crew iteration 9, 2026-09-14. Every line is quoted in §3; the returns are
verbatim in `docs/meetings/2026-09-14-la-cuadrilla-run-9.md`.

| # | Role | Who | Signed | What makes it false, named |
|---|---|---|---|---|
| 6 | QA (runs first) | Lupe | **FALSE** | rows three, four and five do not exist (480×900, 1280×800, fullscreen); the tickets pass A1, A2, A4; A3 the fold was drawn by the page, not in the PNG; A6 no cream document. M1 red on a phone (*Take a shift* at 691 in a 661 box), M3 red (13-px checkboxes, a 19-px select), M4 red in the reader |
| 1 | Engineers | Beto | **FALSE** | one element in each column: the reader's checkboxes wear the settings panel's uniform (unpriced), and the doors are half a seam — the half that is missing is in the save. Priced: careers seam RULE; the listening canvas RULE with two unpriced things under it (touch, persistence); `pendingAt` on the map two lines; the ring a different kind of question |
| 2 | Art | Pili | **FALSE** | the avoid-list ticks are iOS blue on a violet app; the household's drawer ladder contradicted the drawer screen's; the merge board is four colours of one object; six screens carry the engine's violet-label rule |
| 3 | Story | Nacho | **FALSE** | the one sentence per screen is written on the page and shown on none of the pictures; the questionnaire made two opposite promises one above the other; three of four kitchens are a flag with an apostrophe |
| 4 | Words | Paty | **FALSE** | the questionnaire has no Spanish (REFUSED under A6 — by the owner's own word, *"English is fine"*, so recorded, not built); six of the set's best sentences are `sub` lines the reader never shows; the drawer captions collided in both languages; *"[a dish], de dos"* |
| 5 | UI | Rosa | **FALSE** | sideways, four documents put their primary action under the 207-px box behind a mark that reads as the end; the house card's only switch is 19 px tall; on the questionnaire at 844×390 the bar sat on the third answer, so a tap there pressed Next |
| 7 | Play | Chava | **TRUE** | for all thirteen, with three places he was wrong written down (screens 4, 5, 8); the genre line TRUE on all fourteen pictures — everything that moves counts up |
| 8 | Ledger | Doña Remedios | **FALSE → TRUE for ten** | as the set stood: findings section empty, no per-screen verdict, three screens unsizeable; with the table above pasted it is TRUE for ten screens and stays FALSE for the three drawings |

**The genre line**, signed by all eight and the pen: TRUE on every picture. The only date anywhere is
one the player typed, and nothing compares it to today.

**Fixed the same day, in the sources, before this block was written** — each re-rendered or
republished; no picture was edited by hand:
- Rosa F1 · the questionnaire is a fixed frame where only the question list scrolls; proven at both
  phone rows with an answer already selected (`elementFromPoint` on every option answers that option).
- Nacho F2 · the questionnaire's body promise now follows the same truth as the amber banner: with no
  store it says so, in one voice.
- Paty's table · every row applied to `mockdocs2.js` — *[a dish], dos rellenos*; *Aquí nada lleva
  cuenta, nada corre y nada se apaga*; *Grades on the plate*; *Pepper*; *twice · once*; curly apostrophes throughout the English. Nacho's F5 (*Sal* in the English
  list) is overruled by her F2: the names match the parent document.
- Pili F4, F5, F9 · the drawer you are in is open, not painted; the household's counter carries the
  drawer screen's own ladder (4 : 6 : 9 = 10 : 16 : 24); the captions are one short line each, in both
  languages, with a measurable gap.
- Lupe A3 / Remedios F7 · the fold is measured on the live document and drawn INTO the unrolled PNG by
  the camera, so the picture carries it wherever it travels.
- Remedios F2 · the three drawings say their size on their ticket (drawn at up to 560 CSS px, no
  matrix row). Remedios F6 · this file's section numbers corrected.

**Findings index** — every finding is in the ticket shape in the meeting file under its reviewer; here
only the title, screen, row and verdict, ranked as each reviewer ranked them.

| Reviewer | Finding | Screen · row | Verdict | Where it went |
|---|---|---|---|---|
| Lupe | A7, a new ticket field: what was switched off to take the picture — it cost her a false bug report | all | ANSWERS, WITH A NOTE | §1 gains A7 on the next revision |
| Lupe | M1–M8 as they stand: M1 red on the owner's phone, M2 the end-of-document lie has a new shape (a 2-px violet sliver), M3 red on inputs, M4 red in the reader, M5 green by a proxy | 4, 5, 6, 10, 11 | — | the red tests stand; M1/M2 are the fold, with Rosa F3 |
| Lupe | A5 · three things change between the map's before and after, not one | 12 | ANSWERS, WITH A NOTE | `docs/meetings/2026-09-14-el-mapa.md` |
| Rosa | F1 · a tap on the third answer submits the question | 0 · 844×390 | DOES NOT ANSWER → fixed | questionnaire v3 |
| Rosa | F2 · the house card's only switch is 19 px tall | 10 · both rows | ANSWERS, WITH A NOTE | the reader's `sel` block, engine — with M3 |
| Rosa | F3 · sideways, four screens put their primary action below a 207-px window, and the mark above it means "the end" | 4, 5, 10, 11 · 844×390 | ANSWERS, WITH A NOTE | #173 (the sideways row) and the reader's end-of-document affordance (M2) |
| Rosa | F4 · the primary button has no pressed state; the reader does not trap the keyboard | all documents | ANSWERS, WITH A NOTE | engine, red first |
| Rosa | F5 · every document writes a subtitle the reader never shows | all six | ANSWERS, WITH A NOTE | with Paty F6: the reader renders `sub` or the documents stop writing it |
| Rosa | F6 · the third checkbox comes loose from its own label | 10 | ANSWERS, WITH A NOTE | the reader's `checks` layout |
| Rosa | F7 · the checked state is Chromium's blue in a violet night app | 10 | ANSWERS, WITH A NOTE | one `accent-color` line in both shells (with Pili F1, Beto 1) |
| Rosa | F8 · the Collection's blank lines look like something you type into | 7 | ANSWERS, WITH A NOTE | Pili F7: outlines for the unmade, not underlines |
| Pili | F1 · the house card asks the player to tick foods to avoid, in iOS blue | 10 | ANSWERS, WITH A NOTE | as Rosa F7 |
| Pili | F2 · the merge board is four colours of the same object | 8 · drawing | DOES NOT ANSWER | drawn again when [partner] answers |
| Pili | F3 · the shift you took is marked with a 22-px corner you have to be told about | 5 | ANSWERS, WITH A NOTE | the taken state gets a second cue at 64 px |
| Pili | F4 · the drawer you are in is painted, not opened | 4 | fixed | mockdocs2.js |
| Pili | F5 · the household's drawer ladder contradicts the drawer screen's | 3 · drawing | fixed | the journey page |
| Pili | F6 · the map's markers differ only in hue, on a map whose legend already spends gold | 12 | ANSWERS, WITH A NOTE | the map plan: one mark, the street's own ❗ |
| Pili | F7 · the Collection shouts the blanks and whispers the dishes | 7 | ANSWERS, WITH A NOTE | as Rosa F8 |
| Pili | F8 · six screens, one engine line: every label is violet and every violet looks pressable | all | ANSWERS, WITH A NOTE | the shell's `kv` label colour — engine, both games, red first |
| Pili | F9 · the three drawer captions run into each other in Spanish | 4 · ES | fixed | mockdocs2.js |
| Pili | F10 · the questionnaire's loudest colour is its bookkeeping | 0 | ANSWERS, WITH A NOTE | the gold on the progress row; next revision of the page |
| Pili | F11 · the twins (submit and cancel) are not fixed; they are out of frame | 4, 6 | ANSWERS, WITH A NOTE | `engine/engine.js`, grep `c.className="dbtn"` — with run 8 |
| Beto | 1 · the reader's checkboxes are wearing the settings panel's uniform | 10 | ANSWERS, WITH A NOTE | one CSS line, both shells, priced |
| Beto | 2 · the doors are already half a seam, and the missing half is in the save | 1 | ANSWERS, WITH A NOTE | #154 — the careers seam must include the class in the save |
| Beto | 3 · the only button on two screens is under the fold, behind a mark that reads as the end | 4, 5 | ANSWERS, WITH A NOTE | as Rosa F3 |
| Beto | 4 · a canvas that listens: the claim and price are right; two things under it are not priced (touch, persistence) | 8, 9 | ANSWERS, WITH A NOTE | the build order, row 14 |
| Beto | 5 · the markers are two lines; the ring is a different kind of question | 12 | ANSWERS, WITH A NOTE | the map plan, §2 |
| Beto | 6 · a pack's own state survives a reload and dies on the Trolley Pass, and only one screen says so | 5, 10 | ANSWERS, WITH A NOTE | G1 in the build order |
| Beto | 7 · print | 6 | ANSWERS, WITH A NOTE | #196 |
| Nacho | F1 · the sentence that says what a screen means is written, and never shown | all | ANSWERS, WITH A NOTE | the page's `line` becomes the document's first line, or is dropped |
| Nacho | F2 · the questionnaire makes [partner] two opposite promises | 0 | fixed | questionnaire v4 |
| Nacho | F3 · the drawer is the artifact our own research says will lie to her by week three | 4 | DOES NOT ANSWER | R17; the plan's answer is that leftovers feed it — say so on the screen |
| Nacho | F4 · three of the four kitchens are a flag with an apostrophe | 5 | ANSWERS, WITH A NOTE | names are placeholders; the owner's decision 6 |
| Nacho | F5 · "Sal" is in the English recipe | 6 | overruled | Paty F2 |
| Nacho | F6 · the recipe appears to have no method | 6 · 390×844 | ANSWERS, WITH A NOTE | the method is below the fold; with the fold |
| Nacho | F7 · the shifts board says the same four dishes twice | 5 | ANSWERS, WITH A NOTE | the rows are the document; the drawing is labelled |
| Nacho | F8 · a blank line and the end of the document are the same mark | 7, 11 | ANSWERS, WITH A NOTE | with Rosa F8, M2 |
| Nacho | F9 · the front door in the picture is Meridian's, and the line under it is a promise | 1 | DOES NOT ANSWER | as the verdict table says |
| Nacho | F10 · the street explains itself twice, in the same frame | 2 | ANSWERS, WITH A NOTE | Meridian's own arrival text — not this world's |
| Paty | F1 · the questionnaire has no Spanish at all | 0 | REFUSED (A6) → recorded | the owner: *English is fine* (§12.1 #15) |
| Paty | F2–F5, F7–F9 · the table | 4, 5, 6, 7, 10 | ANSWERS, WITH A NOTE → applied | mockdocs2.js |
| Paty | F6 · six of the best sentences in the set are in no picture at all | all six | DOES NOT ANSWER | as Rosa F5 |
| Paty | F10 · the page is English, and the three inline drawings are English on purpose | the page | ANSWERS, WITH A NOTE | the page is the owner's reading copy; the game is both |
| Chava | where he was wrong: the drawer (thought the search was live), the shifts board (tapped a drawn card), the merge board (looked for the tap) | 4, 5, 8 | TRUE, written down | the "drawing" plate belongs nearer the picture |
| Remedios | F1 · the questionnaire picture is the broken-network version, and the ticket only confessed the fonts | 0 | ANSWERS, WITH A NOTE | the ticket now says what else fell back; re-shoot with a network when one exists |
| Remedios | F2 · three of thirteen screens cannot be refused because they never said how big they were | 3, 8, 9 | REFUSED → sized | the drawings' ticket now carries their width |
| Remedios | F3–F5 · sideways every picture is clipped with no companion; one document ends in two rules; Spanish at one row | 4–11 | ANSWERS, WITH A NOTE | the next camera pass |
| Remedios | F6 · the register's own section numbers are wrong inside the register | this file | fixed | §4 and §6 in this revision |
| Remedios | F7 · the fold on the picture is arithmetic, not a measurement | unrolled | fixed | the camera measures it and draws it |
| Remedios | F8 · "Skip" is a word between two buttons | 0 | ANSWERS, WITH A NOTE | with Rosa F4; next revision of the page |


