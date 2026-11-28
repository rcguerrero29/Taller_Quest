/* WHAT EACH GAME HAS (the owner's confirmed goal of 2026-11-25 on the checks that can find nothing and pass, rule 3: in a
   world that has the thing, finding nothing is a red; in a world without it the check says so, and the world is named in a
   list). This is that list. A check that finds none of a thing says so as `ABSENT <thing>: <what was not asked>`, and the
   engine's check settles it at the end against this list:
     the game has it here (true)   a red: the thing went missing and the check would have passed on nothing;
     the game has none (false)     a counted line naming the game;
     the game is not on the list   a counted line saying so; a game that runs these checks adds its own row.
   A thing is named by what a player would miss. Rows are added as the checks that read them are mended; a thing not named
   for a game is read as not on the list for it. */
'use strict';
const HAS = Object.freeze({
  'Meridian Quest': Object.freeze({
    trolley: true,         /* a trolley line, its car, its stops and its ride (content/meridian/maps.js, TROLLEYAT) */
    'animals-by-the-trolley': true,   /* animals that live on the trolley's street (CRITTERS in st) */
    'map-spots': true,     /* places the town plan marks by a spot of their own (MAPDOT) */
    'map-markers': true,   /* the map marks who is waiting, and a click or tap chooses a marker (markKinds) */
    'interview-room': true,   /* a room whose questions show as a marker at its door (RM, roomStart) */
  }),
  'El Horno': Object.freeze({ trolley: false, 'animals-by-the-trolley': false, 'map-markers': false, 'interview-room': false }),   /* one kitchen (content/horno/) */
  'El Faro': Object.freeze({ trolley: false, 'animals-by-the-trolley': false, 'map-markers': false, 'interview-room': false }),    /* the gauge's worlds (content/gauge/), each a few rooms */
});
/* true, false, or null when the game or the thing is not on the list */
function has(game, thing) {
  const row = Object.prototype.hasOwnProperty.call(HAS, game) ? HAS[game] : null;
  if (!row || !Object.prototype.hasOwnProperty.call(row, thing)) return null;
  return row[thing] === true;
}
/* one line of a check's findings, settled: an ABSENT line becomes a red or a counted line; any other line is as it was */
function settle(game, line) {
  const m = /^ABSENT ([a-z][a-z0-9-]*): (.+)$/.exec(String(line));
  if (!m) return line;
  const h = has(game, m[1]);
  if (h === true) return (game || 'this game') + ' has ' + m[1] + ' (test/has.js), and none was found: ' + m[2];
  if (h === false) return 'COUNT-ONLY: ' + (game || 'this game') + ' has no ' + m[1] + ', so ' + m[2];
  return 'COUNT-ONLY: ' + (game || 'this game') + ' is not on the list of what each game has for ' + m[1] + ' (test/has.js), so ' + m[2];
}
module.exports = { HAS, has, settle };
