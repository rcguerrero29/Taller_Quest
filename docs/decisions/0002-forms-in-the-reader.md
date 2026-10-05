# 0002 · Every popup becomes a form inside the reader

**Date:** 2026-09-06 · **Status:** settled, built (`mq-v76` engine, `ch-v14` town) ·
**Files:** `engine/engine.js`, a second world's `record.js` and its own smoke test

## Asked

> *"show me what you mean for #2 please"* · *"5. ok i think that works"*

`[OWNER]`, 2026-09-06, quoted verbatim in `docs/ASKS.md` (the PR-2-of-3 row). These are the owner
approving item 2 of eight proposals he had been offered; the proposal itself was the session's.

## Decided

Anything in a world that needs the player to **type or choose something** is drawn as a form on the
paper the reader already opens — every field visible at once, beside the paperwork it belongs to,
with a Cancel that costs nothing. Not a browser prompt, and not a chain of them.

The engine grew the ability; the pack decides what the forms are.

## Because

Before this, filing a request in the town was a run of `window.prompt()` calls: title, then plain
words, then notes, then done-when, then kind, then weight. Six modal boxes, each one showing you
nothing but its own question.

- **You cannot see what you are filling in.** The paperwork you are filing *about* is behind the
  prompt. Every answer is from memory.
- **Cancel is destructive.** Escape on prompt four throws away one, two and three. There is no way
  to go back a field.
- **A prompt cannot offer a choice.** Kind and weight are closed sets; a prompt makes you type
  `normal` correctly, and silently accepts `normla`.
- **It is not the town's voice.** The town is a place where you walk up to a counter and are handed
  a sheet. A grey browser box on top of that is the program admitting it is a program.

**What was rejected, and why:**

| Option | Rejected because |
|---|---|
| Keep the prompts | See above. It was the state of the world and the owner asked to be shown something else |
| A custom modal panel in the shell | Two shells, so two copies of it — and `docs/NEW-WORLD.md` §8's shell-copy problem is real (see §8's 2026-09-10 correction). The reader already exists in both shells and is already the town's voice |
| One field per sheet, navigated with Next/Back | Same memory problem as the prompts, with more clicks. **"Every field visible beside the paperwork" is the point**, not "not a prompt" |

**The generalisation that made it worth an engine change rather than a town hack:** the reader
collects the values and hands them to the pack; **it never learns what any of them mean.** The
engine does not know what a request is. That is what makes it a seam a third world inherits.

## Touched

- `engine/engine.js:2954-2975` — the `form` block: `fields` of type `text`, `password`, `area`,
  `select`, `checks`; a `submit`, a `cancel`, an `onCancel`, and `noFocus` for a form that must not
  steal focus (the index's search box).
- `engine/engine.js:2967` — `read()`, which is where "the reader collects, content acts" is
  literally true: it builds a plain `{k: value}` object and hands it to `f.run`.
- `engine/engine.js:2939-2953` — the `btn` and `sel` blocks, the same decision applied to a single
  action and a single choice.
- `engine/engine.js:2883` — `docDef()` returns the object itself when handed one, so a form sheet can
  be built on the spot and never registered in `DOCS`.
- a second world's `record.js`: file a request, narrow the street, comment, labels, decide.
- **The guard:** `test/town.smoke.js:26` fails the build if `window.prompt` or `prompt(` ever returns
  to the town's content. The rule is enforced, not remembered.

## Ledger

- `docs/ASKS.md`, 2026-09-06 — "PR 2 of 3 built (`mq-v76`, `ch-v14`)".
- Shipped with #42's dropdowns (`ch-v9`) already in place; the Decide sheet (`:458`) came in the same
  part, answering the owner's *"your pic should open up a comment right?"* (quoted in that
  world's `record.js`).
- **Not in `docs/NEW-WORLD.md` until 2026-09-10** (§9.3). A second world reading the template would
  have found one line — *"docs.js … the paper the world produces (optional)"* — and no idea the
  reader could take input at all.
