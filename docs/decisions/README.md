# The decisions folder — one file per settled thing

*Opened 2026-09-10, during the audit that rebuilt a second world from `docs/NEW-WORLD.md` on paper
to find out what the template could not say.*

## Why this exists

A decision that lives only in a table row survives as an **answer**. What a reader needs six months
later is the **reasoning**, and above all **what was rejected and why** — because the rejected option
is the one the next person is about to propose again.

`docs/ASKS.md` is the ledger of asks: *what was requested, verbatim, and where it landed.* It is
excellent at that and it is not a decision store — its rows are one dense cell each, and the reason
behind an answer is usually a clause. **Until this folder is populated, `ASKS.md` is still where most
decisions actually live.** Saying otherwise would be the third kind of stale document this project
has already paid for, so it is said here plainly instead.

## The form

One file, `NNNN-a-short-name.md`, five headings, in this order:

| heading | what goes in it |
|---|---|
| **Asked** | the owner's words, **verbatim**, with a date and where the quote is from. If the only surviving copy of the quote is a code comment, say so — a comment is a `[CODE]` source, not a transcript |
| **Decided** | one paragraph a stranger can understand before they meet a file name |
| **Because** | the reasoning — **including every option that was rejected, with the reason and any measurement.** *"We use nearest-mipmap-nearest"* is a fact; *"we tried mipmaps everywhere and measured it softer, 1.94 against 2.26"* is memory |
| **Touched** | `file:line` for every place the decision lives in code, and the test that pins it |
| **Ledger** | issue and PR numbers, the version it shipped in, and the row in `docs/ASKS.md` it corresponds to |

## Two rules

1. **Never invent a decision that was not made.** If the record is thin, the file says the record is
   thin and stops. A file that guesses at reasoning is worse than no file, because it will be quoted.
2. **Correct rather than accumulate.** When a decision supersedes an older one, say so **in both
   files** — a header line at the top of the old one, where a reader hits it first.

## Index

| # | Decision | Date | Superseded by |
|---|---|---|---|
| [0001](0001-the-strip-carries-a-fact.md) | The strip at the door carries a **fact**, not a score (`HUDFACT`) | not recorded; ≥ 2026-09-08 | — |
| [0002](0002-forms-in-the-reader.md) | Every popup becomes a **form inside the reader**; no browser prompts | 2026-09-06 | — |
| [0003](0003-the-town-reads-on-demand.md) | The town reads its list **on open, after a write, and on ↻** — no clock | 2026-09-06 | — |
