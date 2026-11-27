/* ---------- THE GAME'S OWN DICE ----------
   Every chance in the game, an animal's whim, a person's next step, a tune's next note, is a roll. Until now
   each roll asked the browser for a number of its own, so a run could never be played again the same way,
   and a check that wanted one animal to do one thing had to replace the browser's number for the whole page
   at once, for every system at the same time.

   The owner's goal for the dice, as he confirmed it:
   1 · ONE STARTING NUMBER, MANY LINES. Each system rolls on a line of its own (the dog's, the cat's, the
       people's), and every line is worked out from one starting number. A roll on one line never moves
       another: the cat doing something new changes nothing the dog does.
   2 · IN PLAY THE STARTING NUMBER IS NEW EACH TIME. It is drawn once, when the page loads, and it is never
       read from the address, from storage or from anything a player can type.
   3 · ONLY CHECKS MAY SET IT. `reseed` and `stub` are for the checks; nothing in the game calls them, and
       test/dice.js is red when anything outside the checks names either.
   4 · EVEN SWEEPS ARE KEPT. A check that walks a roll through even steps (0.5/40, 1.5/40, ...) to see every
       band a whim can land in still can: `stub` hands one line the check's own numbers and leaves the rest.

   A LINE is named in DICELINES and nowhere else. An unknown name throws, and test/dice.js is red for a roll
   whose line is not written as a plain name from the list, so a typo cannot open a line of its own.
   The rolls themselves have the same shape as the browser's: a number from 0 up to, not including, 1. A
   system moved onto its line rolls exactly as often, at the same moments, as it did before, so a player
   sees the same game. */
const DICELINES=Object.freeze([
  "dog",       /* every dog: whims, steps, curls, routines, the course's pace, the stick, the howl, the follow, what he says */
  "cat",       /* every cat: steps, grooming, the bump */
  "pigeon",    /* every pigeon: its steps, its pecks, what is said when it is petted */
  "bird",      /* the parrot: its perch, what it says */
  "critter",   /* everything else in the street that moves on its own: the butterfly, the hummingbird */
  "ball",      /* where the ball is thrown */
  "body",      /* the small motions a body is drawn with (an ear's twitch): drawn each frame, so kept apart from what an
                  animal decides, which a run with the same starting number then repeats whatever the frame rate */
  "people",    /* a person's wander, a friend picked, a look, a routine's time, a line said */
  "music",     /* the tune's next note */
  "festival",  /* petals and ribbons */
  "world"      /* everything else that rolls once in a while: a destination on the map, a chair, a panel's way out */
]);
const DICE=(function(){
  /* the starting number in play: from the browser's own strong source when it has one, else its plain one.
     Never from the page's address or storage (rule 2): test/dice.js is red if this file reads either. */
  function fresh(){
    try{if(typeof crypto==="object"&&crypto&&typeof crypto.getRandomValues==="function"){
      const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]>>>0;}}catch(e){}
    return (Math.random()*4294967296)>>>0;}
  /* a line's own starting state: the starting number mixed with the line's name (FNV-1a, then a finaliser),
     so two lines from one start are unrelated and the same start always gives each line the same rolls */
  function mix(start,name){
    let h=0x811c9dc5^(start>>>0);
    for(let i=0;i<name.length;i++){h^=name.charCodeAt(i);h=Math.imul(h,0x01000193);}
    h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;
    return h>>>0;}
  /* one roll of a line (mulberry32): the state moves on by one, and the number is 0 up to, not including, 1 */
  function next(L){
    L.s=(L.s+0x6D2B79F5)>>>0;let t=L.s;
    t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;}
  let start=fresh();const lines={};
  /* THE BRIDGE, while the checks move onto their lines: until now a check steered a system by replacing the browser's number
     for the whole page. While any check still does (test/dice.js counts them), a line with no stub of its own follows a
     replaced number, so every such check still steers what it steered, in the same order, and means what it meant. In play
     the browser's number is the browser's own, so every line rolls on its own. When the last check has moved onto its
     line, the bridge comes out, and test/dice.js is red if it is still here then. */
  const NATIVE=Math.random;
  function reset(){DICELINES.forEach(n=>{lines[n]={s:mix(start,n),n:0,stub:null};});}
  reset();
  function line(name){const L=typeof name==="string"&&Object.prototype.hasOwnProperty.call(lines,name)?lines[name]:null;
    if(!L)throw new Error("DICE: no line named "+String(name)+" (the lines are named in DICELINES)");return L;}
  function roll(name){const L=line(name);L.n++;
    if(!L.stub&&Math.random!==NATIVE)return Math.random();
    if(L.stub){const v=+L.stub();if(!(v>=0&&v<1))throw new Error("DICE: the stub on "+name+" gave "+v+", not a number from 0 up to 1");return v;}
    return next(L);}
  return Object.freeze({
    lines:DICELINES,
    get start(){return start;},
    roll,
    /* a whole number from 0 up to, not including, n: the same as (Math.random()*n)|0 was */
    below(name,n){return (roll(name)*n)|0;},
    /* one thing from a list, the same as list[(Math.random()*list.length)|0] was */
    pick(name,list){return list[(roll(name)*list.length)|0];},
    /* how many rolls a line has made since the start (for the checks: a line moved by nobody else) */
    count(name){return line(name).n;},
    /* ---- FOR THE CHECKS ONLY (rule 3) ---- */
    /* a new starting number: every line starts again from it, and every stub is taken off */
    reseed(n){if(!(Number.isInteger(n)&&n>=0&&n<=4294967295))throw new Error("DICE: a starting number is a whole number from 0 to 4294967295");
      start=n>>>0;reset();},
    /* one line rolls the check's own numbers (an even sweep); null puts the line back on its own rolls */
    stub(name,fn){const L=line(name);if(fn!==null&&typeof fn!=="function")throw new Error("DICE: a stub is a function or null");L.stub=fn;}
  });
})();
if(typeof module==="object"&&module&&module.exports)module.exports={DICE,DICELINES};
