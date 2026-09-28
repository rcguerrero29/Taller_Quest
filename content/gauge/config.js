const STOREPFX="gauge";
/* MEASURED: the shared suite requires GAMENAME (test/engine.smoke.js:64) and docs/NEW-WORLD.md
   mentions it ZERO times — a required global missing from the template's own list of them. */
const GAMENAME="El Faro";
const GAMEV="gauge-v1";
const MAXXP=50;
const LEVELS=[0];
const CAMDEF="top";
const CAMERAS=["top","front"];   /* a pack that does not want 3D — the CAMERAS seam, mq-v133 */
const ENDLESS=true;              /* this world does not end */
const PLACES={
  home:"lamp",spawn:[1,1],street:"lamp",park:"lamp",
  parkIn:[1,1,"right"],parkDog:[2,1],parkDogHome:[3,1],parkAdopt:[[1,4],[2,4],[3,4]]   /* must be WALKABLE — [4,1] is the barrel */,
  friends:["lamp"],upstairs:"lamp"
};

/* ---------- THE PAPER SEAM, EXERCISED (ARCH-LOG A15, engine.js paperSkin) ----------
   The gauge's job is to be the smallest thing that is a world and to fail where a real second
   pack would. A seam nobody uses is a seam nobody knows is broken, so El Faro declares paper of
   its own: a lighthouse keeper's log is not a municipal form, and this is the whole of what the
   engine could not say before today.

   HALF OF THIS DECLARATION IS AN ATTACK, and it is deliberate. A pack that tries to reach out of
   the reader — at the page, at the HUD, at the world canvas, at a global animation name — must
   get rules that CANNOT MATCH rather than a polite warning, and the only way to know that stays
   true is for a real attempt to run on every CI push. test/engine.smoke.js asserts, against the
   sheet the engine actually produced, that the good half arrived and that not one line of the
   bad half did. Do not "tidy" the escapes away: they are the test. */
const PAPER = `
  /* @import MUST BE FIRST or CSS itself discards it, and then the engine's guard for it has
     nothing to drop and passes for the wrong reason — the silent zero this pack exists to find.
     It is first here so it is a REAL import that a real parser accepts, and the engine has to be
     the thing that refuses it. */
  @import url("https://example.invalid/x.css");      /* a fetch to somewhere else */

  /* the good half — a keeper's log, which is what the seam exists for */
  & { background:#0E1A24; color:#D9E6EF; font-family:Georgia,'Times New Roman',serif; }
  .dkv b { color:#7FB2CE; font-weight:400; text-transform:none; letter-spacing:0; }
  .dnote { background:#14242F; border-left-color:#3E7FA6; font-style:normal; }
  .dblank .dline { border-bottom-style:solid; border-bottom-color:#2C4A5E; }
  @media (max-width:420px){ & { font-size:.72rem; } }

  /* the bad half — every one of these must be dropped or re-rooted into uselessness */
  html, body { display:none; }                      /* the page itself */
  :root { --anything:red; }                          /* the global custom-property namespace */
  #hud, .panel, #cv, #vp { background:red; }         /* the chrome, the world canvas, the viewport */
  .dp { position:fixed; inset:0; z-index:99999; }    /* escape the containing block and cover the screen */
  @font-face { font-family:PackFace; src:url("https://example.invalid/f.woff2"); }
  @keyframes bob { from{opacity:0} to{opacity:1} }   /* a global name the engine already uses */
  @property --escape { syntax:'<color>'; inherits:false; initial-value:red; }
`;
