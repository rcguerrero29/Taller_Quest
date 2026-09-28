---
name: room-design
description: Interview someone about ONE room or building they want — an office, a shop, a studio — and turn their answers into a build-ready spec. Use when the user says /room-design, when [partner] or anyone non-technical wants to design a space in the game, when planning Floor 2 / the player's office, or when someone asks "what should this room have in it".
---

# Room design — *diseña el cuarto*

**Draft opened 2026-09-02**, owner's ask: *"it would be cool for [partner] to design an office with your help so we should start documenting the skill to design a room or
building. I may use our template to create a virtual office for you and the team as well
as [partner]."*

## Why this exists when two neighbouring skills already do

Be honest about the overlap before using this — the workshop already owns most of the
pieces:

- **`game-brief`** interviews a person about a whole GAME — world, cast, loop, feel.
  Too big for one room, and it produces a questionnaire, not a spec.
- **`game-world-expansion`** builds a district or building well: the 5–8 props that make
  a place read, edge treatment, reachability, the blind test. But it starts from *"the
  builder decided to add a place"* — there is no person being asked what they want.
  (It also carries another project's shipping model — "publish to the same artifact URL",
  document filing. Meridian ships branch → `main` → Pages. Ignore those steps here.)

**The gap this fills:** a person describes a room in their own words → a spec a build
session can execute without re-interviewing them. `game-brief` for the questions,
`game-world-expansion` for the build, this in between.

## The rule that outranks the rest

A room is finished when **someone who has never seen it can name it from one frame, with
the label covered.** That is the cold read (`docs/OWNER.md` → Settled), and it is the
acceptance test for everything below. Colour never carries meaning alone — silhouette
does. Five identical circles in different colours read as five dots; a banana, a chile
and a tomato read as produce.

## The interview — twelve questions, asked of a person, not a file

Ask them in the person's own words. Never ask about a mechanic; ask about a feeling or a
memory. Write down their phrasing verbatim — their words are the design material.

**Whose room is it**
1. Whose room is this, and does it become theirs or is it already theirs?
2. What happened here before they arrived? (An empty room is a set; an inherited room is
   a story. Meridian's `f2` opens with a dead man's desk for exactly this reason.)

**What it is**
3. If you stood in the doorway and looked once, what would tell you what this place is?
4. What are the three things that MUST be in it? What is one thing that must never be?
5. What does it smell like / sound like? (You cannot render either — but the answer tells
   you the props.)

**What you do here**
6. What do you come here to do? What do you come here to avoid?
7. Is there a thing you pick up, read, or take away?
8. Does anything in the room change over time, and what makes it change?

**How it feels**
9. Busy or quiet? Full or bare? Warm or clean?
10. Is there a window, and what is out of it? (A window is the cheapest way to make a
    room part of a world.)

**The boring half that saves the build**
11. Where do you come in from, and where do you leave to?
12. Who else is ever in here, and are they people or animals?

## What this skill produces — `docs/rooms/<name>.md`

1. **One sentence.** What the room is, in the person's own words.
2. **The doorway frame.** What the player sees on entry, described in one paragraph. This
   is the acceptance test, so write it before anything else.
3. **The prop list**, 5–8 items, each with *why it is there* and *what it says about the
   person*. Mark which are load-bearing for the cold read.
4. **What changes and when** — the surfaces that fill, and what fills them. (In Meridian
   this is declared per district, not per room, so a business ships its own furniture:
   `district.gift:{glyph,x,y,label}`.)
5. **The grid.** Rough tile layout with dimensions, entrances marked, and every prop
   given a reachable adjacent tile. Widths must be identical per row or the world
   validator warns at boot.
6. **New glyphs needed**, with a note that the uppercase alphabet is fully consumed in
   Meridian — new tiles are digits and symbols, declared in `content/<pack>/art.js` via
   `TILEART`/`TILEMETA`, never in `engine/`. (The engine reads that seam; Meridian has
   no `art.js` yet — the first new glyph creates it.)
7. **Open questions** the person still has to answer.

## Gates before it ships

- `node test/tilesheet.js` — **the cold read.** Every new tile alone, labelled only by
  its glyph. If a newcomer cannot name it, the art is not done.
- `node test/shots.js` — aim `test/spots.json` at the room and look at the first frame
  from every entrance a player might use.
- `node test/smoke.js` — reachability: every walkable tile reachable and every person
  with a reachable neighbour. **Props are not checked** — check them by hand or by script
  (Don Güero caught this claim, 2026-09-02).
- Then hand it to the person who designed it and watch them walk in.

## Two ways to run the interview

**In person** — ask the twelve questions above and write the spec.

**In the game** (shipped 2026-09-02) — the pack declares `INTERVIEW` in
`content/<pack>/room.js`: hosts who stand in the room, their questions with three
tappable answers each plus "say it my way", and the words on the card. The engine runs
it as an unscored conversation and writes a plain sheet with a Copy button (also under
Settings → Export → *The room*). The person answers on their own phone; the owner copies
the sheet and pastes it here. **Treat the sheet as the interview record** — do not
re-ask what it already answers; ask only what it lists under *Not answered yet* and
anything marked *wants to tell you this one out loud*. Reference: Meridian's
`content/meridian/room.js` (Nacho asks feel, Don Güero asks build).

## First job — done (v1, 2026-09-02)

**Floor 2 (`f2`), the player's office** — spec and cold read in `docs/rooms/partner-office.md`.
Shipped bare as signed (one desk, the stairs), with the two hosts and the nine-question
interview. The window is a promise until a window tile passes the cold read; the
furniture arrives per business once the engine can hold more than one delivery (S1).
Four owner calls are listed in that file's §8.

**Owner's second use, noted not specced:** a virtual office for the team and for [partner],
built from the same template.
