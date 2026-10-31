# The 3D kitchen: where it stands, and what is next

*A brief for a review, written 2026-10-31 by a Claude session. It asks a second AI to review the work and propose a
plan, under `docs/reviews/README.md`. Nothing here is private. The owner's goals behind the work are kept privately, and
are given here in engine terms only.*

## What the engine has

Built in four engine steps, versions mq-v241 to mq-v244. Each is something a world may ask for; Meridian asks for none
of them and plays exactly as before, and every shape it had builds the same on the new engine.

1. **The pieces.** A fridge, a freezer, upper and lower cupboards, drawers, a wall shelf and a worktop, each shut and
   open, and a wardrobe for the closet. In `engine/shapes.js`, above `kitchenColumn`.
2. **One copy of what a kitchen is.** Its kinds, rows (tall, upper, counter, lower), starter template, height bands,
   fullness words, finishes and rules, in `engine/kitchen.js`.
3. **A kitchen wall from a layout.** A world hands in a layout. It is checked at the edge and, when it fails, refused
   whole with one sentence. A place opens by a press or a tap (the engine's ray test), its doors swing, the 3D camera
   zooms, and the closet opens the character creator. In `engine/engine.js` (grep "THE KITCHEN LAYOUT") and
   `engine/engine.js` (grep "THE CLOSET").
4. **Builder mode.** Pick a piece; move it; paint it in one of four finishes, or paint the whole kitchen; add a piece;
   remove one; undo, for the visit. Every change goes through the rules, then the check, then the world's own `store`,
   and only then is laid. The engine keeps no kitchen of its own. In `engine/engine.js` (grep "THE KITCHEN BUILDER").
5. **Gaps.** A wall may keep empty columns, so a piece, tall ones included, moves onto any empty square, by the arrows
   or by a tap. With gaps off, the packed wall is exactly as it was. In `engine/kitchen.js` (grep "GAPS"), with the rule
   `moveTo`.
6. **Things in a place.** A world hands each place's things: an id, a count, a name, a picture and 3D parts. Each is
   checked whole at the edge (a closed list of part kinds, capped sizes and counts, `#rrggbb` colours), and stands on
   the piece's shelves while its inside shows. In `engine/engine.js` (grep "THE THINGS IN A PLACE").
7. **The hand.** Take a thing from a place's page, see it in hand over the room, and put it in another place. The put is
   one change handed to the world's `keep`. The engine keeps no contents. In `engine/engine.js` (grep "THE HAND").

**Who uses it:** a private world on this engine lays a test kitchen with all of it, and a private cooking game will take
the same seams later, with no engine change. Their food pictures and 3D food shapes are private and are not in this
repository.

## What is planned next

- **A. Full screen.** A kitchen place's page opens inside the full-screen view, at the right, and the room stays drawn
  beside it. Today the page sits outside the full-screen element (`#vp`), so the engine leaves full screen, and the
  room is not drawn again while a page counts as covering it (`function worldCovered`), so it shows dark. Kitchen pages
  only.
- **B. Open, then Close.** While a place is open, its button reads Close with the place's name, and closes it.
- **C. New pieces hold things.** A piece added in builder mode gets an id, so it can hold things. Today
  `function kitCanHold` needs an id, and the add rule gives none.
- **D. L- and U-shaped kitchens.** Pieces stand along a room's side walls as well as its back wall, each turned to face
  the room, with the corner where two walls meet handled. Along walls only: no island in the middle of the room.
- **Later:** more foods, a few at a time; the private cooking game taking the room, the builder and the things, its save
  read before anything writes to it; undo reaching a put; foods as bought, whole, and cut.

## What to read

- `AGENTS.md` and `docs/CREW-FOR-ANY-AGENT.md`: the rules.
- `engine/kitchen.js`: whole, about 300 lines.
- `engine/engine.js`: by its sections, not whole (it is about 9,300 lines). Search for "THE KITCHEN LAYOUT", "THE
  KITCHEN BUILDER", "THE THINGS IN A PLACE", "THE HAND" and "THE CLOSET", and for `function worldCovered`,
  `function kitTap` and `function docOpen`.
- `engine/shapes.js`: `kitchenColumn` and the kitchen pieces above it.
- `engine/engine3d.js`: `function t3Pick` and `function t3Reshape`.
- `test/engine.smoke.js`: the kitchen's checks, by the same section names.
- `docs/3D-LOG.md` and `docs/TAGS.md`.

## What we would like from the review

- **A plan for A to D:** the order, which seams change, what each check must prove (shown failing before the fix), and
  the risks. D most of all: how a layout names a second wall, how a piece is turned to face the room, and what happens
  at a corner.
- **Anything in the seven built parts that looks wrong or fragile:** the edge checks, the rules with and without gaps,
  the one-change seams (`store`, `keep`), performance (triangles; one tile rebuilt at a time), and whether the builder's
  bar and the hand can be reached and understood by keys and by touch.
- **Security first:** anything a world hands the engine that is not checked, and anything that could leave the device.

Write the review as one file in this folder, by `docs/reviews/README.md`, and hand it back. Propose only.
