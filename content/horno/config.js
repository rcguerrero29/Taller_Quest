/* EL HORNO — one room, one bench, one tray. A choice, and a rhythm.
   Owner, 2026-09-22: "theoretically can we use these polygonal art for the cooking game? we can
   try a baking option lol" and, when a producer said no to the game half,
   "why no for the game? because we havent built it? we will soon".

   This is the smallest thing that is genuinely a baking THING YOU DO. It is its own pack — its
   own shell, its own prefix, its own storage — exactly the way content/gauge/ is, so it costs
   Meridian nothing and edits none of its files. docs/NEW-WORLD.md §8 governs a second
   world: it trains no role, carries no curriculum, is never a district of Meridian and never a
   chapter in its story. Nothing here reaches into content/meridian/ at runtime.

   TWO VERBS NOW, and the second one owes everything to the first one not needing it. The tray is
   full, readable and bakeable from the first second — walk three tiles, press Read, press a shell.
   Kneading is the other bench and it gates NOTHING: no step of the bake waits on it, it cannot be
   failed, and it can be left in one press. An action you could skip in a tap and do not is the
   definition of something done on purpose; an action you must finish is a toll. Owner, 2026-09-22,
   correcting this session, which had priced it as a wait needing a clock: "i know the time seems
   strange but kneading could be therapeutic." A wait is time you spend to be allowed something.
   A rhythm advances per gesture, with no clock anywhere — which is the only shape this pack could
   take, because it refuses a timer three lines below. See content/horno/docs.js, the `masa` card.

   THREE THINGS IT REFUSES BY CONSTRUCTION, and the refusal is the design:
     THE ADDRESSES ARE GREPS AND NOT LINE NUMBERS, and that is not a style choice: this file
     shipped on 2026-09-22 citing :143, :152-155 and :156-159, and by the end of the SAME DAY all
     three were about a hundred lines out, because a sibling lane rewrote that document's shape
     section and everything below it moved. Line 143 now lands in the middle of SHAPETAKE. The
     rules quoted below were correct; only the addresses rotted. Grep the sentence.
     - no inventory. Nothing is carried, counted or held. docs/NEW-WORLD.md prices it, grep
       `an inventory this engine does not have`.
     - no timer, no day budget. docs/NEW-WORLD.md, grep `nothing in it spends a day`: the engine
       reads the real clock for light only. The verb here is a CHOICE, not a wait.
     - no punishment. docs/NEW-WORLD.md, grep `punishment if it SUBTRACTS` (the phrase wraps a line, so grep the tail).
       You may change your mind about the shell colour for ever and lose nothing. */
const STOREPFX="horno";
const GAMENAME="El Horno";
const GAMEV="horno-v2";
const MAXXP=40;
const LEVELS=[0];
const CAMDEF="3d";                       /* the tray is a SHAPE; the shape camera is the one it is for */
const CAMERAS=["top","front","iso","3d"];
const ENDLESS=true;                      /* a kitchen does not end */
const PLACES={
  home:"horno",spawn:[4,5],street:"horno",park:"horno",
  parkIn:[4,5,"right"],parkDog:[5,5],parkDogHome:[6,5],parkAdopt:[[1,5],[2,5],[3,5]],
  friends:["horno"],upstairs:"horno"
};
/* THE PAPER SEAM (ARCH-LOG A15). A baker's card is not a municipal permit, and this string is the
   whole of the difference. Scoped by the engine to the reader; nothing here can reach the page. */
const PAPER = `
  & { background:#FBF3E4; color:#3B2A18; font-family:'Georgia','Times New Roman',serif; }
  .dh { color:#8A4B1E; font-family:'Georgia',serif; text-transform:none; letter-spacing:0; font-weight:700; }
  .dkv b { color:#9A6A3A; font-weight:400; text-transform:none; letter-spacing:.02em; }
  .dkv span { color:#3B2A18; }
  .dnote { background:#F4E4C6; border-left-color:#C98A3C; font-style:italic; color:#5A3D20; }
  .dp { color:#3B2A18; line-height:1.55; }
  /* MEASURED, not styled by eye. The first draft of this rule set padding .5rem and margin .25rem
     and the shared suite came straight back with: Rosa 2: "vanilla" and "chocolate" are 4px apart
     — a miss lands on the neighbour. The PAPER seam is a real hole a pack can fall through: it can
     restyle the buttons that CHANGE something, and a thumb-sized target is not a matter of taste.
     44px tall and never less than 8px from its neighbour, which is what test/engine.smoke.js
     (grep "a miss lands on the neighbour") demands of any sheet in any pack. */
  .dbtn { background:#E9CF9C; color:#4A2F14; border:1px solid #C09454; border-radius:8px;
          font-family:'Georgia',serif; font-size:1rem; padding:.7rem 1.3rem; margin:.7rem .8rem 0 0;
          min-height:44px; }
  @media (max-width:420px){ & { font-size:.82rem; } }
`;
