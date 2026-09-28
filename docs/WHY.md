# Why it is built this way

This repository is the public half of a project. The day-to-day log, the backlog, the meeting notes
and everything about the real people who shaped the game stay private. Many design choices here were
made in those notes, so this page keeps the *reasons*, in a line each, without the diary around them.

**Square brackets are stand-ins.** Where a document says `[partner]`, `[city]`, `[state]`, `[brand]`,
`[another project]` or `[a time]`, a real detail about a real person was replaced before publishing.
A sentence in brackets, like *[An example about food was taken out of the public copy…]*, marks a
passage that was taken out, and says what it was for. Links and issue numbers (`#123`) that lead
nowhere point at the private side; the reasoning they carried is summarised below.

## The game

- **It is practice for AI roles.** Every business in the city is a practice pack for one AI job —
  implementation lead, AI product manager, solutions engineer, automation consultant, AI operations —
  and its quests are the real judgment calls of that trade. That purpose is fixed; everything else
  serves it.
- **Retry until correct, and no way to lose.** A wrong answer explains itself and you try again. The
  point is the judgment, not a score to protect.
- **English and Spanish in lockstep.** Every line exists in both and says the same thing in the same
  voice; the tests fail when they drift.

## The engine

- **One engine, many small games.** Meridian was the first world built on a shared engine; a second
  world is a folder of data (`content/<game>/`), never a fork. So a rule goes in the engine, and
  anything a world might want differently becomes a *seam* the pack answers.
- **Built for customisation, on purpose — and wary of too much of it.** Some seams exist because a
  real person's needs were used as examples: a food to avoid, a room they would design, a fashion
  option, a pet that should look a certain way. The examples stay private; the seams are general.
  The owner's own caution, kept here: heavy customisation is easy to over-build, so each seam must
  earn its place.
- **The off-switch law: a feature that cannot be switched off is built wrong.** A pack that declares
  nothing gets nothing — no people, no tab, no stored key. That is why optional features are
  declarations, not defaults.
- **A season may dress the world, never rebuild it.** Holidays change props and colours, not maps.
- **Four cameras, one set of drawings.** The 3D view is built from the same tile art as the 2D ones,
  so a world is drawn once.

## Privacy and security

- **Like a console game, it lives on the device.** Players will want privacy, so saves stay in the
  browser, there are no accounts and no server, and a save moves only when the player carries it.
- **Closed by default.** The page runs only its own script files, asks no other website for
  anything (the fonts are served from here), makes no background connections, sends no referrer,
  and refuses to be framed. `SECURITY.md` has the whole list, and the tests enforce each line.
- **Nothing about a real person is published as said.** The originals stay private; this copy is
  made from them by a private map, and a tool reads the result back and fails if any mapped detail
  survives. Real details that have no fixed wording are caught by a person reading, not by the tool.

## How the work is done

- **A guard is not trusted until it has been broken on purpose.** Every check in `test/` was shown a
  real violation and went red before it was believed — a green check that never saw a failure proves
  nothing. `docs/REGRESSION.md` keeps the register of checks that once measured the wrong thing.
- **A crew of AI reviewers, each with one job.** The personas in `.claude/agents/` — the engine, the
  vocabulary, readability, rooms, the city, the story, both languages, release, QA, security — review
  every change from their own side; an agent may propose anything, and only a reviewed change lands.
- **The owner decides.** Agents write proposals, plans and code; the person who owns the game merges.
