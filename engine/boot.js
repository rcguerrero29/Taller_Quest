/* ---------- BOOT — which of the engine's own files this world actually needs ----------
   Owner, 2026-09-17: "4. fine make sure that it is customizeable."

   `vendor/three.min.js` is 594KB raw and 149KB gzipped — TWENTY-FOUR PER CENT of the whole
   download — and it was fetched, parsed and executed on every boot of every world, including a
   world that had already said in its own config that it does not want a 3D camera. The gauge
   declares `CAMERAS=["top","front"]` and paid for all of it anyway.

   `CAMERAS` is the customisation and it already existed (the seam, mq-v133): list "3d" and you get
   the 3D camera and its library; leave it out and neither is downloaded. A pack that says nothing
   gets 3D, so Meridian and El Changarrito are byte-identical — which is what this repo requires of
   every engine change.

   WHY THIS IS A FILE AND NOT AN INLINE SCRIPT, and it cost a run to find out: El Changarrito's
   shell ships a STRICTER policy than Meridian's — `script-src 'self'` with no `'unsafe-inline'`,
   because the town reaches another site (the public shell may not even NAME that host — test/smoke.js R8 scans every file the public index loads, and it caught this comment). An inline loader parsed fine there, appeared in
   `document.scripts`, and never executed; CSP refusals are not page errors, so nothing threw and
   nothing was logged. The town's whole engine simply did not load. Caught because the suites run
   against both shells, and by nothing else.

   `document.write`, deliberately: this file is parser-inserted, so a script it writes blocks and
   keeps its order exactly as the three static tags it replaces did. An appended `<script
   async=false>` does not block the parser, so `engine.js` would run before THREE existed and the
   first seconds of a 3D world would fall back to the flat camera for no reason.

   The base is taken from this script's own URL so the two shells can sit at different depths —
   `engine/boot.js` for Meridian, `../engine/boot.js` for the town — without either of them
   knowing anything about the other. */
(function(){
  var want=(typeof CAMERAS==="undefined")||(Array.isArray(CAMERAS)&&CAMERAS.indexOf("3d")>=0);
  var me=(document.currentScript&&document.currentScript.src)||"";
  var base=me.replace(/engine\/boot\.js(\?.*)?$/,"");
  function w(p){document.write('<script src="'+base+p+'"><\/script>');}
  if(want){w("vendor/three.min.js");
    /* the shape library (crew iteration 14). It is only ever read by the 3D camera, so a world
       that did not ask for one does not download it — same bargain as Three, four kilobytes
       instead of a hundred and forty-nine. It loads BEFORE engine.js because engine.js binds it
       to its own letters as it builds TILES, and `document.write` from a parser-inserted script
       keeps that order exactly. */
    w("engine/shapes.js");}
  w("engine/engine.js");
  /* engine3d.js ALWAYS loads, and only the library is conditional. It is 31KB gzipped against
     Three's 149, so the saving is nearly all in the library — and it declares `T3`, `t3Invalidate`
     and `draw3d`, which the rest of the engine and both suites reach for by bare name. A bare name
     that is not there THROWS, where a `draw3d()` with no THREE under it simply returns false and
     the flat camera takes over, which is a path this engine has had since mq-v133 and tests.
     Found by the gauge in one run: dropping the file too turned "this world has no 3D" into
     "this world cannot be checked at all". */
  w("engine/engine3d.js");
})();
