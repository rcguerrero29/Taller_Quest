---
name: meeting-of-da-minds
description: Convene Meridian's expert agents — Nacho (story), Don Güero (city), Pili (3D and readability) plus invited guests — on a set of open questions, argue them against the real code, and come back with one recommendation per question, a build order, and what the project learned. Use when the user says /meeting-of-da-minds or "call a meeting", when several open questions touch each other, when a design needs more than one expert, or when the user asks for a review by a specialist the project does not have yet.
---

# Meeting of da minds — *la junta*

**Opened 2026-09-03**, owner's ask: *"i want another review from /don-guero and /nacho to
check with another agent who is an expert in 3d game design so we can setup for success
with this type of character … use it as a learning experience, not just for this exercise.
write it as a skill of meeting-of-da-minds … call it a meeting once you are all excited to
show me cool things."*

A meeting is what you call when the questions on the table are **entangled** — a story
beat that needs a building, a building that needs art, art that needs an engine seam — and
answering them one at a time produces four answers that do not fit together. One expert
gives you a good idea. A meeting gives you a plan that survives contact with the other
three.

## When to call one, and when not to

**Call a meeting when:**
- Two or more open questions touch each other, or touch different disciplines.
- The owner asks for a specialist review, or names an expert the project does not have.
- Something has been re-reported by the owner more than once — that is a design failure,
  not a bug, and design failures need more than one pair of eyes.
- A whole area is about to be built and getting it wrong is expensive to undo.

**Do not call a meeting for:** one bug with one cause · a change the owner already
specified · anything you could ship in the time the meeting would take. A meeting that
produces a plan for a three-line fix has cost more than it made.

## The standing cast

| Who | Decides | Never |
|---|---|---|
| **Nacho** (`/nacho`) | What a thing MEANS — story, voice, who says it, what it pays off | writes code |
| **Don Güero** (`/don-guero`) | What gets BUILT — parcels, businesses, sequencing, cost | writes code |
| **Pili** (`/pili`) | Whether anyone can TELL WHAT THEY ARE LOOKING AT — silhouette, volume, camera, markers | writes code |

**Guests.** Any lens the table is missing, invited for one meeting as a plain agent with a
written brief: a new-player lens (someone who has never played and must find their way), a
wayfinding lens, an accessibility lens, an engine lens whose only loyalty is to what the
code can actually do. A guest who earns their seat twice should be **recommended to the
owner as a standing expert** in the readout, with a one-line case. That is how this cast
grows; it is not for the meeting to appoint them.

## The procedure

**0 · The agenda is the owner's own words.** Quote each item verbatim in the brief. An
agenda item rewritten into project vocabulary is an agenda item that gets answered for the
wrong person. Number them; every later stage refers to the numbers.

**1 · Ground truth, before anybody has an opinion.** One pass over the actual code and
docs that answers, per agenda item: what exists today, in which file, and what does not
exist at all. Everyone at the table gets this. **A panel that reasons from memory of the
repo invents features it has already shipped and re-proposes them as new.**

**2 · Positions, in parallel, in writing.** Every expert answers every agenda item they
have standing on, and says plainly when they have none. Each position carries: the
proposal, why it works, the seam or file it touches, an honest cost, and the risk. **One
recommendation per item, never a survey** — the owner's standing rule.

**3 · Feasibility and cross-examination, in the same pass.** Each set of positions goes to
a reader whose only loyalty is the code: does this seam exist, is the cost honest, what
breaks, and what is the strongest argument against it. A proposal that cannot be built
today is not deleted — it comes back marked *needs this seam first*, because that seam is
itself a piece of work the owner may want.

**4 · Synthesis.** One recommendation per agenda item, chosen and defended — not a menu of
options with the choice pushed back to the owner. Where the experts disagreed, say who
disagreed and why the call went the way it did. Then a **build order**, smallest first,
with what each item unlocks.

**5 · The readout, and only then the excitement.** Take it to the owner when there is
something to be excited about: concrete, visual, and describable in one sentence each.
*"Call it a meeting once you are all excited to show me cool things."* A readout that is a
list of concerns is not a meeting, it is a status update.

## The rules that make it worth the tokens

1. **Grounded, always.** Every proposal names the file, function or data seam it touches.
   "We should make the world more alive" is not a proposal.
2. **Contradictions are reported, never absorbed.** A rule signed in `docs/` that the code
   does not implement, two docs that disagree, a plan that assumes something the engine
   cannot do — say so in the readout, name which side is true, and give the fix or the
   question. This is the owner's standing rule and it outranks tidiness.
3. **Honest costs.** Minutes, hours, a sitting, more than a sitting. A cost that turns out
   to be four times the estimate poisons the next meeting.
4. **Plain words.** The owner has asked twice for jargon to be explained. Write the readout
   for someone who is not in the code today.
5. **Nothing is built during a meeting.** The panel plans; the session builds afterwards,
   in the agreed order, with the owner's go.
6. **Stay on the requirements at hand.** *"while you are allowed to learn parallel skills to
   make them/you better for this project, please be consious of the requirements at hand."*
   A meeting may pick up a technique it needs; it may not turn into a research project. If
   the panel wants a tangent, it goes in the readout as a recommendation, not into the work.

## What a meeting leaves behind

- **Minutes:** `docs/meetings/YYYY-MM-DD-<topic>.md` — the agenda in the owner's words, each
  expert's position, the disagreements, the calls, the build order.
- **Decisions** appended to the ledger that owns them: story calls to `docs/STORY.md`,
  city and cost calls to `docs/CITY.md`, work items to `docs/BACKLOG.md`, art and render
  findings to `docs/IDEAS.md` §15.
- **The learning.** Every meeting writes down at least one thing the project now knows that
  outlives the topic — a principle, a rule of thumb, a trap with a name. That is the part
  the owner asked for: *"use it as a learning experience, not just for this exercise."*
  If a meeting produced no durable lesson, say that too; it is a finding about the meeting.
- **New experts,** recommended with a one-line case, never appointed.

## Running it

The panel runs as a workflow so the stages are deterministic and the experts genuinely do
not see each other's answers before writing their own — a panel that reads the first
answer converges on it, which is the failure this whole skill exists to avoid.

Shape: **ground truth** (one agent, a barrier — everyone needs it) → **positions**
(the cast plus guests, in parallel) → **feasibility and cross-examination** (pipelined per
expert, so a fast expert's positions are being checked while a slow one is still writing)
→ **synthesis** (one agent) → **completeness critic** (one agent: which agenda item got a
thin answer, which expert was not asked, what is missing).

Size it to the agenda: roughly one position-writer per discipline the agenda touches, and
do not exceed what the session's workflow guidance allows without saying why.
