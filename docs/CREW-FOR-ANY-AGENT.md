# The crew, for an agent that cannot call it

[The owner asked how an agent without subagents could follow the crew.] — **It had not been.**
`AGENTS.md` §5½ said the crew does not transfer but *"the method does,"* in one sentence, with nothing
to follow. This is the thing to follow.

**Who this is for:** any agent working this repository that cannot spawn Claude subagents — Jules,
Codex, anybody. Claude Code convenes the crew for real (`.claude/skills/crew-fix/SKILL.md`); everybody
else gets as close as a single agent can, and this file is honest about how close that is.

---

## 1 · What crew mode actually is, with the Claude plumbing taken off

Four working parts. Nothing else about it is essential.

| part | what it does | where it lives |
|---|---|---|
| **Specialists** | nineteen different LENSES — one sees readability, one sees what leaks out of the build, one plays the game badly on purpose | `.claude/agents/*.md` |
| **Independence** | each lens forms its view **before** seeing any other's | `.claude/skills/meeting-of-da-minds/SKILL.md` — *a panel that reads the first answer converges on it* |
| **The loop** | ground the facts → write the failing test → show what done looks like → fix → review → record | `.claude/skills/crew-fix/SKILL.md`, grep `1. GROUND` |
| **A reviewer who did not do the work** | nobody approves their own diff; every guard gets a real violation planted against it | `crew-fix` steps 3 and 5, and `melo` |

**Which lens to use for what** is the table in `crew-fix` (grep `Bug is about`). Nineteen rows; for
a given issue you usually want three or four.

---

## 2 · What transfers to one agent — and the one thing that does not

| part | transfers? | notes |
|---|---|---|
| Specialists | **yes, as lenses** | read the persona file and work the problem *as that person*. Use the BODY; **ignore the frontmatter** — `model: opus` and `tools: Read, Grep, Glob` are Claude's plumbing and mean nothing to you |
| The loop | **yes, completely** | it is a procedure, not a capability |
| Planting violations (`melo`) | **yes, completely** | copy the tree OUTSIDE the repository, break the thing the guard is for, run the guard, quote exactly what it printed. A guard that has not fired is a claim |
| **Independence** | **no — and it is the load-bearing part** | see below |
| A reviewer who did not do the work | **partly** | reviewing your own diff is the weakest review there is. Say so in the PR, and let the owner — or another agent — be the reviewer |

### Why independence is the part that matters, and why one agent loses it

Nineteen lenses are worth something only because they **disagree**. When Claude runs the crew, each
specialist is a separate agent that has not seen the others' answers, so their blind spots are
different. One agent wearing five hats in sequence has one set of blind spots, five times: the second
hat has already read the first hat's answer, and it drifts toward it. That is not a flaw in any
particular agent. It is what happens to any single mind, and it is the reason `meeting-of-da-minds`
runs its experts in parallel and forbids them from reading each other first.

**You cannot fully get it back. You can get most of it back** — §3 is how.

---

## 3 · The recipe — a crew pass, by one agent

**Every lens writes its position before any lens reads another's.** That single rule recovers most of
what independence gives. Order is everything.

1. **GROUND.** Read the code. Write down what is actually true, each line with `file:line`. Mark
   anything you believe but did not check `[MEMORY]` — the brief you were given may be wrong, and saying
   so with a citation is the job, not insubordination.
2. **Choose three or four lenses** from `crew-fix`'s table (grep `Bug is about`). A beautify task
   usually wants `pili` (does it read), `chema` (does the 3D look real, and he measures), `cuca` if it is
   a room; anything touching the build wants `zeni`; anything with a new guard wants `melo`.
3. **One lens at a time, and write it down before moving on.** Read `.claude/agents/<name>.md`, work
   the problem as that person, and write their position — proposal, reason, cost, risk — to
   `scratchpad/<you>/<name>.md`. **Do not open any other lens's file while you write this one.**
4. **Only when every position is written:** read them together. Name where they disagree, decide, and
   **say who disagreed and why the call went the way it did.** A synthesis that averages the views
   has thrown away the only reason for having them.
5. **RED** — the failing test, shown failing on today's code. **MOCK** — what done looks like,
   **rendered in the real game, never drawn**, before and after. **FIX** — the smallest change that
   removes the class of fault.
6. **Plant** (`melo`): against every guard you wrote, in a copy outside the repository. Quote what it
   printed. Include one plant against the thing EXISTING, not only against it WORKING — delete the
   object, not the logic — because that is the plant everybody forgets (`docs/POSTMORTEM.md` §13v).
7. **RECORD.** The run file under `docs/runs/`, with your agent's name in the ID, **and one line saying
   this was a single-agent crew pass** — so the study can compare it with a real crew run.

**If you can run separate tasks or sessions in parallel**, give each lens its own task, each writing
its own file, and one more to synthesise. That restores real independence, not an approximation of it.
Whether a given agent can do this is `[UNTESTED]` until it is tried — see `docs/AGENT-STUDY.md`.

**And notice who runs it, because it is not the agent.** When Claude runs the crew, the calling
session IS the manager: it starts every specialist, collects every answer, compares them, decides and
reviews. An agent that cannot spawn its own helpers cannot be that manager — so **the manager's job
moves to the person**. The owner starts each task, waits, and then reads the files himself or starts a
last task to compare them. [The owner asked how an agent without subagents could follow the crew.] — yes: separate tasks stand in for separate agents, and the person stands in for the session
that would have run them. **That is a real cost and the study measures it**: the Claude crew spends
tokens; this spends the owner's attention. A human team runs on the same trade.

---

## 4 · What NOT to replicate

- **Do not paint the mural.** Each Claude crew agent proposes a panel for the town's wall, and the
  wall lives in `changarrito/` — which `AGENTS.md` §7 lists among the things you may **never** touch
  without the owner's word. [A description of a private tool was taken out.] If you want to leave something, put the panel you would have painted
  in words in your PR, and the owner decides.
- **Do not edit a persona file** to fit how you work. Personas are signed; a change to one goes to
  `docs/personas/proposed/<persona>/<RUN-ID>.md` and a person decides (`AGENTS.md` §9).
- **Do not claim you "consulted Pili".** You read Pili's file and reasoned as her. Say that. The
  difference is exactly the independence this file is about, and the study needs it said plainly.

---

## 5 · This is an experiment, not only a recipe

**The same issue, as a single-agent crew pass and as a real Claude crew run, measures exactly what
independence is worth** — the question this file cannot answer by argument. It is written into
`docs/AGENT-STUDY.md` §3 as a hypothesis. If the single-agent pass comes out as good, the crew is
ceremony and we have learned something important. If it misses what the crew catches, we know what
the subagents are for. Either result is worth having.
