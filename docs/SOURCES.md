# Where a finding comes from

*Opened 2026-09-09 at the owner's word: "tell me how youre getting or where you get the info from and
log it so we can check later or publish findings."*

**Every claim in this project's registers carries one of four tags.** Not because the rules are
strict, but because the four kinds of claim have wildly different worth, and until now they have all
been written in the same voice.

| Tag | Means | Can you check it? |
|---|---|---|
| **`[CODE]`** | Read out of this repository, cited `file:line` **with the identifier beside the number** | **Yes — if you grep the identifier.** A bare line number is `[CODE]` the moment it is written and `[TRAINING]` an hour later: on 2026-09-13, **31 of `docs/BOUNDARY.md`'s 172 citations had slid within the hour** they were written (`docs/POSTMORTEM.md` §8-extended), and three in a persona file were **400+ lines** off with every suite green |
| **`[WEB]`** | From a source outside this repo, cited with a URL | **Yes.** Follow the link |
| **`[TRAINING]`** | What a model knows about games, design or craft, with no citation | **No.** It is a considered opinion and nothing more |
| **`[OWNER]`** | The owner said it, quoted verbatim | **Yes.** It is in `docs/ASKS.md` |

**Nothing in `.claude/agents/` is a source.** A persona is one agent's instructions, and the line
numbers inside one are guarded by nothing: `test/leaves.js` calls `fs.existsSync` on the **path** in a
citation (grep `sends its reader to`) and never reads the line, so a citation that points at a real
file at a line saying something else entirely is green for ever. Measured 2026-09-13:
`.claude/agents/pili.md` sends every reader to `drawPerson` at `engine/engine.js:2520` — `drawPerson`
is at `:2955`, and 2520 is inside a dog's neighbour search — and cites `lookOf` and `npcWhimsy` about
458 lines short of where they are. **The line half of every citation in this repository is unguarded.
Grep the identifier; never paste the number.**

## The honest state of what has been published so far

Every register opened this week — `docs/TAGS.md`, `docs/3D-LOG.md`, `docs/BEAUTIFY.md`,
`docs/QA-PASS.md`, and the junta note — is **`[CODE]` and `[TRAINING]` mixed together with no
labels.** The `[CODE]` half is genuinely strong: agents grep the real files, cite `file:line`, and
the sharpest claims were re-verified by hand before they reached the owner. **Two were wrong and
were caught that way** — Yola's position, and a junta note that went stale in four hours.

The `[TRAINING]` half is the problem for publishing. When Tavo says *"a mini-game with a score is a
career ladder with a costume on"*, that is a good sentence and it is **not evidence**. Nobody
measured it. It is what a model believes about game design.

**Until 2026-09-09, no agent in this project had web access**, so nothing was ever `[WEB]`. Every
"best practice" any persona has ever stated was `[TRAINING]`. That was never disclosed, because
nobody asked until now.

## The rule from here

1. **Tag every claim** in a register or a meeting note.
2. **`[WEB]` needs the URL inline**, not a bibliography at the bottom nobody reads.
3. **`[TRAINING]` is allowed and useful** — it is what expertise sounds like — but it may never be
   dressed as a finding. A design opinion is a design opinion.
4. **Anything published outside this repo carries the tags.** If a claim cannot be tagged, it does
   not go out.
5. **A `[CODE]` claim that turns out wrong gets corrected in place, visibly**, with who caught it.
   That has happened twice and both corrections are still standing where the error was.

## What the crew can actually reach

| Who | Reads | Can search the web? |
|---|---|---|
| The session (me) | everything | **yes**, `WebSearch` / `WebFetch` |
| Beto, Rosa, Chema, Yaz, Chava, Toño, Lupe | the repo, and can run the game headless | no |
| Nacho, Pili, Cuca, Tavo, Don Güero, Mari, Paty, Remedios, Chuy | the repo | no |

So **the personas cannot produce `[WEB]`.** When a question needs outside evidence, a research agent
with web access runs alongside them and its findings are handed over with URLs attached. That is the
shape used for the first time on 2026-09-09, on the open-world quest question.
