# The engine, for a stranger — technical specifications you can hand to anyone

*Opened 2026-09-25, owner: "can you provide a stranger safe way to provide the answers for the
technical specifications". True at game version `mq-v200`; if the game is newer, a number below
may be too.*

**What "stranger safe" means here, so the next session keeps it that way.** This page names no
person, no account, no address, no pet, no place anyone lives. It lists **no open weakness** — an
unfixed security item is told to the owner, never to the world — and no repository or deploy
setting. It says what the engine *is*, not how this project is run. Anything you add must pass the
same three tests: would I say it to a stranger, does it help someone attack this, does it name a
real person. If in doubt, leave it out.

---

## In one paragraph

A small, bilingual (English/Spanish) role-playing game engine that runs entirely in the browser.
No build step, no framework, no server, no accounts. It installs to a phone's home screen and plays
fully offline. The engine is shared; each game is a folder of data (maps, characters, quests, art,
words), so a new game is new content, not new code. Three games run on it today.

## Platform

| | |
|---|---|
| Languages | Plain HTML, CSS and JavaScript (classic scripts, no modules). No transpiler, no bundler, no package install to play |
| Hosting | Any static file host; also runs opened straight from disk |
| App | Installable PWA: web-app manifest, 192/512 px icons, cache-first service worker, full offline play |
| Dependencies | **One:** three.js r149 (MIT), vendored and hash-pinned, loaded only by games that use the 3D camera. A small MIT QR-code library, also hash-pinned. Three typefaces (SIL Open Font License), served from the game's own site and hash-pinned too |
| Size | Engine ≈ 9,200 lines / 680 KB uncompressed. 3D library ≈ 150 KB compressed |
| Browsers | Modern evergreen browsers, desktop and mobile. No WebGL → the game falls back to a flat camera and says so |

## Architecture

- **Engine / content split.** `engine/` never names anything from a particular game. A game declares
  its world as plain global data; about a dozen items are required, about forty more are optional
  and the engine simply does less without them.
- **Seams, not forks.** A game chooses its cameras, stakes (none, lives), progression, seasons,
  growth of the city, what its places are for, and whether it keeps a score at all — as data.
- **Worlds are text.** Every room is rows of characters; each character is a tile with metadata
  (solid, walkable, how it is drawn in each camera).
- **Four cameras, one world:** top-down, front elevation, isometric, and true 3D. All four are drawn
  from the same tile art; the 3D view builds real shapes from it.
- **Boot loader** fetches only what a game asked for — a game without 3D never downloads the 3D
  library.

## Player-facing systems

Movement (keyboard, swipe, virtual joystick, d-pad) · doors and stairs between rooms · characters
who wander, talk and hand you documents · branching quests with retry-until-correct scoring and XP
that cannot be farmed · pets with a wardrobe · character creation and a mirror to change your look ·
a town map with directions · a tram you can ride · seasonal dressing by date · comfort colour themes
(light and dark) · procedurally generated music (Web Audio, offline) · full English/Spanish with
both languages held in lockstep by tests · an in-game map editor for the author.

## Data and privacy

- **Everything stays on the device.** Saves live in browser storage under a per-game prefix, so two
  games on one site never overwrite each other. No analytics, no tracking, no server.
- **A failed save is never silent** — the game frees its own diagnostic space, retries, and tells the
  player in their language.
- **Moving a save between devices** is a link or QR code the player carries themselves. Every save
  that arrives from outside is rebuilt field by field against known-good shapes: numbers clamped,
  colours validated, text length-capped, unknown keys dropped.
- **The diagnostic log** keeps at most 30 entries / 16 KB and never records anything a player typed.
- **Networking** exists only as an empty, switched-off hook for a future version.

## Security posture (design, not status)

- Closed by default: a content-security policy limits scripts, styles, fonts and pictures to the game's
  own site and allows no background connections at all; no script is written inside the page and no
  inline event handlers; no remote code. The page asks no other company for anything (the fonts are
  its own), sends no referrer, and hides itself inside another site's frame.
- The service worker caches only the game's own files — never another site's response, never another
  world on the same site, never an error page — and deletes only caches it owns.
- Text is drawn as text: player-visible strings from data go through the DOM as text or onto the
  canvas, never parsed as HTML.
- Continuous integration runs with read-only permissions and third-party build steps pinned to exact
  versions.

## Quality

Every change runs headless-browser suites against the real game in CI: map integrity and
reachability, English/Spanish parity, XP arithmetic, retry rules, every camera drawing every world,
a brand-new blank world booting on the shared engine, and checks that the published site contains
only the public game. Engine changes must leave every game's behaviour identical and bump the
version and the offline cache together, so no returning player is left on a stale copy.

## Content today (the flagship game)

A game that teaches practical judgment for AI roles — when to use retrieval or fine-tuning, where a
human stays in the loop, how to put guardrails on an agent, build or buy. 60 quests plus a secret
side quest, 37 characters, 15 worlds (12 drawn by hand, 3 building interiors stamped from
templates), and 15 in-game documents handed to you mid-quest. Counted from the booted game.
