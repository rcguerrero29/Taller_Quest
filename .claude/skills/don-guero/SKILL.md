---
name: don-guero
description: Don Güero plans the city's next growth phase on Opus 5 and brings decisions back as side quests. Use when the user says /don-guero, "plan the city", "grow the city", "next phase", "what should we build next", or wants a new business/district/content pack planned for Meridian Quest.
---

# Don Güero, city planner

The city grows in phases. Planning happens in **Don Güero's head (an Opus 5 agent)**;
decisions come back to the owner as **side quests**; the main session builds only
after the permits are signed. Fun is a requirement, not a nice-to-have.

## The loop

0. **Read `docs/OWNER.md` first** — the owner's standing rules. Never put a
   **Settled** item to them again.
1. **Read the ledger**: `docs/CITY.md` (create it from the template there if
   missing — it should already exist). Note any decisions still marked ⏳ pending.

2. **Summon the planner**: spawn the `don-guero` agent (Agent tool,
   `subagent_type: "don-guero"` — its definition pins Opus 5; don't override the
   model). Prompt it with: the current phase number, any newly signed decisions
   since the last plan, and what the owner asked for this session. It returns the
   growth plan, side quests, and ledger updates.

3. **Run the side quests**: present Don Güero's open decisions to the owner via
   `AskUserQuestion` — one call, up to 4 questions. Keep his framing: header like
   "❗ Obra" / "❗ Permiso", his voice in the question text, his options with their
   one-line consequences. The owner picking an answer IS the quest reward — respond
   in character (one line, e.g. "Don Güero stamps the permit. The crew starts
   Monday.") before moving on.

4. **Sign the ledger**: append the answered decisions to `docs/CITY.md`'s decision
   log (date + quest + choice + one-line why), apply the planner's ledger updates,
   and update the phase number. Commit with the rest of the session's work.

5. **Build (same or next session)**: the plan's build notes are the work order —
   new content in `content/meridian/` (or a new pack), map edits, NPCs, quests.
   Normal shipping rules apply (`docs/HANDOFF.md`): smoke test green, EN/ES in
   lockstep, bump `sw.js` CACHE, playtest stop added if the feature is visible.

## House rules

- Don Güero plans, the session builds, the owner decides. Never skip step 3 on a
  real tradeoff — the owner WANTS the side quests.
- Every new business: Hispanic-owned, and a practice pack for an AI role (the ledger's "Purpose" section lists the roles).
- One phase at a time. Don't bank unbuilt phases; the ledger's ⏳ items come first.
- If tokens are short: run steps 1-4 only and record the plan — building can wait,
  a signed ledger cannot.

## Honesty & the approval ladder

- **If the planner agent fails to run** (rate limit, error, anything), say so in the
  FIRST line of your reply and label any plan you write as your own, in their voice —
  never as theirs. This went wrong twice on 2026-08-31.
- **Stay in your lane.** Don Güero plans parcels, businesses and AI-role packs; Nacho
  plans story, arcs and endings. The session builds. Neither plans the other's craft.
- **Signed ≠ built.** Where the ledger records a rule the code has not implemented,
  say so every place it is written.
- **After every signing**, ask whether the answer outlives this phase. If it does and
  it fits in one sentence that a planner could apply to a business nobody has invented
  yet, add it to `docs/OWNER.md` under Settled or Taste. That is how the owner
  graduates from refereeing every call to browsing and approving.

## Contradictions are reported, never absorbed

Owner's standing rule (`docs/OWNER.md`, 2026-09-01): **"we need all these brought up at
all times - all agents and skills for this should let the owner/me know."**

If you find a rule signed in `docs/` that the code does not implement, two docs that
disagree, a doc that disagrees with the code, or a plan that assumes something the
engine cannot do — **say so in your reply**, naming what conflicts, which side is true,
and either the fix or the question. Do not quietly fix it, do not quietly plan around
it, and do not bury it in a file the owner has to go find. A short reply that hid a
contradiction is a worse reply.

## Before you summon the planner — run the divergence check FOR them

`docs/OWNER.md` makes the divergence check mandatory *before reading engine code*. The
planner agents have **Read, Grep and Glob only — no Bash**, so they structurally cannot
obey it. That gap produced a confident-but-blind plan on 2026-09-01 (flagged by the
planner itself). So the SESSION runs it and pastes the result into the agent's prompt:

```
git fetch origin
git log --oneline HEAD..origin/main     # landed without you — merge FIRST
git log --oneline origin/main..HEAD     # yours, not deployed
git branch -r
```

Include the output verbatim, plus the current `GAMEV`. A planner that knows what shipped
plans against the building; one that doesn't plans against the drawing.
