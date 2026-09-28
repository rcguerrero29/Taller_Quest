# Meridian Quest ⚔️

A bilingual (EN/ES) mini-RPG for practising AI roles. You play the new AI lead at Meridian Labs:
roam the office and the barrio, take quests from coworkers (and one very good dog), and make the
calls — RAG vs fine-tuning, human-in-the-loop thresholds, agent guardrails, build vs buy — with XP,
reputation hearts, and consequences.

**Play it:** <https://rcguerrero29.github.io/meridian-quest/> — on a phone, add it to the home screen
and it plays offline.

## Private by design

Meridian is built like a console game: it lives on your device.

- **Your game stays on your device.** Saves live in your browser's own storage. There is no account,
  no server, no analytics and no tracking.
- **The page asks no other website for anything.** Scripts, styles, fonts and pictures all come from
  this site, and the page's own security policy switches background connections off entirely. It sends
  no referrer, and it hides itself if another site tries to show it inside a frame.
- **It works offline** once it has been opened, and updates itself with one refresh.
- **A save only moves when you move it.** The 🎫 Trolley Pass carries a save to another device as a
  QR code or a link that you share yourself.

`SECURITY.md` says what the site promises and how to report a problem.

## What it is made of

Everything is static files with no build step: 15 worlds, 37 people, 60 quests plus a secret side
quest, documents a character hands you mid-quest, retry-until-correct progression, a pet wardrobe, a
barber's chair that changes your look, full English/Spanish localisation, mobile controls, and an
in-game map editor.

**Four cameras, one world.** Top-down, front elevation, isometric, and a real 3D view (three.js) —
the same maps and the same 2D art, drawn four ways.

**Seasons.** A content pack can dress its world by date or by name without rebuilding it.

The code is split into a shared **engine** and per-game **content packs**:

```
index.html            ← the shell: CSS, DOM chrome, script tags
engine/engine.js      ← renderer, movement, saves, validators (shared)
engine/engine3d.js    ← the 3D camera, built from the same tile art (shared)
content/meridian/     ← this game as data: strings, quests (EN/ES), npcs, maps, art, config
content/horno/        ← a second, one-room world on the same engine
sw.js                 ← the offline worker (bump CACHE with GAMEV when shipping)
```

A new game is a new `content/<game>/` folder and a shell pointing at it; the engine stays untouched.
`docs/NEW-WORLD.md` is the step-by-step. `docs/SPEC.md` is the technical specification.

## Develop and test

Open `index.html` in a browser; there is nothing to install to play. To run the tests, install
`playwright-core@1.63.0` and set `CHROMIUM_PATH` if Chromium is not in a standard place:

```
node test/smoke.js                              # Meridian's own content
node test/engine.smoke.js --index index.html    # the engine, against the pack
node test/horno.js && node test/gauge.js        # the second world, and a brand-new one
node test/offline.js                            # the built site installs, plays offline, updates once
bash scripts/build-site.sh /tmp/_site && node test/public.js /tmp/_site   # what would be published
```

## What is not here, and why

This repository is the public half of a project whose working notes are private: the day-to-day log,
the backlog, and anything about the real people who shaped the game. A few documents here mention a
file or an issue number that lives on the private side. `docs/WHY.md` keeps the reasoning those notes
recorded, so the design still makes sense without them. A word in square brackets — `[partner]`,
`[city]`, `[a time]` — stands in for a real detail that stays private.

## Licence

Free to play, read, change and share, as long as nobody makes money from it. The code is under
[PolyForm Noncommercial 1.0.0](LICENSE); the art and the writing (the worlds, the notes, the crew) are under
[CC BY-NC-SA 4.0](LICENSE-ART-AND-WRITING.txt). Other people's work keeps its own licence: three.js and the QR
library are MIT, and the three typefaces in `vendor/fonts/` are under the SIL Open Font License. Which licence
covers which file, and what they allow: [LICENSING.md](LICENSING.md). To contribute: [CONTRIBUTING.md](CONTRIBUTING.md).
