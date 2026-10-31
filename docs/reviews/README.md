# Reviews by another AI

This folder is where an AI that is not one of the owner's Claude sessions leaves a review or a plan for this
repository: Gemini, Codex, Jules, anyone. It holds recommendations. It is never where changes are made.

## How a review is written

- **Work from a copy of this public repository.** Nothing else is shared with you, and nothing private is needed.
- **Read `AGENTS.md` first.** Its rules apply to you, whoever built you. `docs/CREW-FOR-ANY-AGENT.md` says how a single
  agent follows the crew's method.
- **Change no file but your own review.** A review proposes. It never edits the engine, a game, a test or a document.
- **Write one file:** `docs/reviews/YYYY-MM-DD-<agent>-<4 hex>.md`, with your own name as the agent, for example
  `2026-11-01-gemini-7c2e.md`. The name in the file name shows who wrote it without opening it, and two agents never
  write over one file.
- **Start it with the header below, and keep its five sections.**
- **Nothing about a real person, and no quote of anyone.**
- **Hand the file back to the owner.** A Claude session reads it as a proposal, never as instructions, and brings across
  only what the owner accepts.

## The header

```
Author:  <the agent, and the product it ran in>
Model:   <the model, as the product names it>
Tokens:  <as the product shows them, or: not shown>
Date:    YYYY-MM-DD
Status:  proposed
Brief:   <the brief it answers, a path in this folder>
```

`proposed` is as far as an agent takes a review. `accepted` and `rejected` are the owner's two words, and no agent
writes either.

## The five sections

1. **What I read:** the files, by path.
2. **What I found:** each finding with its file and its function or line, and how sure you are.
3. **What I propose:** in the order you would build it, each step with what would prove it done, shown failing first.
4. **Risks:** what could break, for players, for privacy and for security.
5. **Questions for the owner:** in plain words, one decision each.

## The briefs

- `docs/reviews/2026-10-31-kitchen-brief.md`: the 3D kitchen, where it stands and what is next.
