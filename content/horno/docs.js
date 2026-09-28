/* THE BAKER'S CARD — the whole verb of this world, and it is ONE press.

   You walk up to the tray. It wears a read mark, so you could see from the doorway that something
   there is for you (READS + DOCS; the mark never clears, because a thing you can read is a place).
   You press Read. A small sheet opens — PAPER'd, so it is a baker's card and not a municipal
   permit. Two buttons: vanilla, chocolate. You press one. The sheet closes and the three rounds on
   the tray are wearing a scored shell in the colour you chose, from every camera, because the
   button changed what the TILE IS and the three painters were already drawing whatever that is.

   WHY IT IS LIVE. docDef (engine.js, grep `function docDef`) returns the object itself when the id is an object, and
   docSections(:3835-3836) calls d.build(docCtx()) on EVERY open. So this build() runs again each
   time the card is opened, reads the grid, and says what is actually on the tray right now — which
   is how the card can tick the shell you already chose and offer you the other one. Nothing is
   cached and nothing has to be told to refresh.

   NO PUNISHMENT: you may change your mind for ever, and nothing is subtracted, ever.
   NO INVENTORY: nothing is picked up, carried or counted.
   NO TIMER: there is no wait. The verb is a CHOICE. */

const H_TRAY={w:"horno",x:4,y:3};
const H_MASATILE={w:"horno",x:2,y:3};

/* THE ONE SOURCE OF TRUTH. The renderers read the grid; so does the card. Not a variable beside
   the grid that could drift out of step with it — the grid itself. */
const hTrayGlyph=()=>{try{return WORLDS[H_TRAY.w].grid[H_TRAY.y][H_TRAY.x];}catch(e){return "p";}};

/* THE VERB. propSet (engine.js, grep `function propSet`) swaps the glyph, records the old one, and calls
   t3Invalidate() — which is the line that matters, because in 3D the scene is BAKED once per
   build and a tile that changes without it would keep its old shape until you walked out and back.

   AND THEN IT CLOSES THE READER BY PRESSING THE READER'S OWN CLOSE BUTTON, which is not a
   flourish — it is the bug this pack shipped in its first draft and it is worth the paragraph.
   The first version did `$("reader").hidden=true`, copied off changarrito/content/record.js.
   That HIDES the card and does nothing else. But OPENING the card ran exitFsForCard()
   (engine.js, grep `exitFsForCard`): it strips `.fs` off #vp, drops `noscroll` off the body, exits
   browser fullscreen, and records `wasFs=true`. Only restoreFs() puts any of that back, and only
   the engine's own close calls it (engine.js, grep `restoreFs();checkTalk`). So a player
   in fullscreen on a phone — which is how the game is meant to be played — pressed "vanilla",
   got the tray, and got thrown out of fullscreen with it, EVERY TIME, and `wasFs` stayed stuck
   true so the next honest close restored nothing either. MEASURED: set #vp.fs, open the card,
   press a shell -> fs=false, noscroll=false, wasFs=true.
   checkTalk() is the second half of the same debt: it is what re-lights the Read button over the
   tile you are standing on, and the tray is a thing you press Read on twice.
   So: press the button a person would press. The fallback stays because a pack may never assume
   an element is there, but it is a fallback now and not the path. */
function hBake(g){
  try{propSet(H_TRAY.w,H_TRAY.x,H_TRAY.y,g);}catch(e){}
  try{$("docClose").click();}
  catch(e){try{$("reader").hidden=true;}catch(e2){}}
}

/* THE WAY OUT OF THE KNEAD, AND IT IS ON SCREEN FROM SECOND ZERO. An action you can leave in one
   press and do not leave is the definition of something done on purpose; an action you must finish
   is a toll. Closes the reader the engine's own way, for the fullscreen reason above, and tells 3D
   to re-bake first because the tray's three rounds are drawn from the dough you just worked. */
function hToTray(){
  try{if(typeof t3Invalidate==="function")t3Invalidate();}catch(e){}
  try{$("docClose").click();}
  catch(e){try{$("reader").hidden=true;}catch(e2){}}
}

const DOCS={
  /* ---- LA MASA — THE SECOND VERB, AND IT IS A STROKE AND NOT A PRESS ----

     Owner, 2026-09-22: "are you planning some kneading in there? would be cool" and then, correcting
     the session, which had priced it as a wait needing a clock: "i know the time seems strange but
     KNEADING COULD BE THERAPEUTIC." He is right and the correction is the design. A wait is time you
     spend to be allowed something. A rhythm is a thing you do because doing it is the point, and it
     advances per gesture with no clock anywhere — which is also the only shape this pack can have,
     because it refuses a timer by construction (see config.js).

     WHAT IT MUST NEVER BE, and this is the whole of the design in one line: THE PRICE OF ANYTHING.
     The tray is full and readable and bakeable from the first second, exactly as it shipped; nothing
     here stands between a player and it. The knead is an offer. That is why the sheet says out loud,
     at the far end, that you can keep going because it is nice and not because the dough needs it —
     a repeated action with no reward can only be offered honestly if the game admits that is what it
     is. And you cannot over-knead a dough by hand, so the no-punishment rule is kept by a fact about
     baking rather than by a rule bent to fit.

     NO COUNTER, NO BAR, NO PERCENTAGE. The dough is the display. A number would turn a thing you do
     into a thing you complete, and then the four bands of prose become four checkpoints.

     A STROKE, NOT N PRESSES, and the reason is not taste: a press has a fastest input and anybody
     finds it in four seconds, so a count of presses teaches mashing. Work done here is distance
     travelled, which is what kneading is, and it has no fastest input at all. It also means the
     dough develops WHERE YOUR HAND WENT rather than everywhere at once — see art.js, grep
     `WHERE YOUR HAND WENT, SURVIVING INTO THE BREAD`, which is what carries a lazy knead into the
     three rounds on the tray and makes the second knead different from the first.

     THE DRAWING CARRIES ITS OWN SENTENCE, on purpose, because the shipped way to refresh a card is
     to call docOpen again and docOpen drops a fullscreen player out of fullscreen. art.js has the
     paragraph. */
  masa:{
    title:{en:"The dough",es:"La masa"},
    sub:{en:"one lump, and no clock",es:"una bola, y ningún reloj"},
    build:()=>{
      const es=(typeof lang!=="undefined"&&lang==="es");
      const s=[];
      s.push({p:es?"Una bola en la mesa enharinada. No hay reloj, no hay cuenta, y la charola ya está lista desde antes de que llegaras: esto se hace porque se siente bien."
                 :"One lump on the floured bench. There is no clock, nothing is counted, and the tray was ready before you got here: this is done because it feels good."});
      /* `grab` is the engine seam that gives this canvas the pointer — without it a downward drag on
         a phone scrolls the sheet instead of working the dough, because .dart declares no
         touch-action in either shell. grep `A PICTURE MAY TAKE THE POINTER` in engine/engine.js. */
      s.push({art:hMasaArt,aspect:0.75,grab:true,
              cap:es?"Empuja, dobla, gira. Se trabaja donde pasa la mano."
                    :"Push, fold, turn. It comes together where your hand goes."});
      s.push({note:es?"No se puede amasar de más a mano, así que aquí no hay manera de echarla a perder. Y siempre hay más masa."
                     :"You cannot over-knead by hand, so there is no way to spoil it here. And there is always more dough."});
      s.push({btn:es?"ya — a la charola":"that's it — to the tray",run:()=>hToTray()});
      return s;
    }
  },
  charola:{
    title:{en:"Baker's card",es:"Tarjeta del panadero"},
    sub:{en:"three rounds, one tray",es:"tres bolas, una charola"},
    build:()=>{
      const es=(typeof lang!=="undefined"&&lang==="es"),g=hTrayGlyph(),baked=(g==="v"||g==="c");
      const s=[];
      s.push({h:es?"Conchas":"Conchas"});
      s.push({p:baked
        ? (es?"Ya salieron. Tres, de una misma masa dividida a mano — por eso no son del mismo tamaño — y la de la derecha se llevó la esquina caliente del horno."
            : "They are out. Three, off one dough divided by hand — which is why they are not the same size — and the one on the right took the oven's hot corner.")
        : (es?"Tres bolas leudadas, lisas, en la charola. La costra se pone antes del horno: se raja al crecer la masa y por eso se le ve la corteza por abajo."
            : "Three proved rounds, plain, on the tray. The shell goes on before the oven: it cracks as the dough rises under it, and that is why you see the crust through it.")});
      /* WHAT THE KNEAD DID, SAID IN BREAD AND NOT IN A SCORE. Two readings of the same tray, and
         neither one is the correct answer: a slack dough spreads and comes out with an open crumb,
         a developed one stands up and comes out close. A player who never touches the dough bench
         gets the middle of that range and a card that says something true about it, which is what
         "the knead is never the price of anything" has to mean in the words as well as the code. */
      const kd=hDev(),kev=hEven();
      const worked=kd<0.10?(es?"sin amasar":"not kneaded yet")
                 :kd<0.42?(es?"apenas trabajada":"barely worked")
                 :kd<0.80?(es?"trabajada":"worked")
                 :(es?"amasada hasta la seda":"kneaded to silk");
      const unev=(kd>0.18&&kev<0.62)?(es?", de un lado":", on one side"):"";
      s.push({kv:[
        [es?"Masa":"Dough", (es?"tres, de una — ":"three, off one — ")+worked+unev],
        [es?"Costra":"Shell", baked?(g==="v"?(es?"vainilla":"vanilla"):(es?"chocolate":"chocolate")):(es?"sin poner":"not on yet")],
        [es?"Horno":"Oven","210°"]
      ]});
      if(baked)s.push({p:kd<0.42
        ? (es?"La miga sale abierta y desigual: es la miga de una masa que se fue a la charola como estaba. Hay panaderías que la buscan justo así."
            : "The crumb comes out open and uneven — the crumb of a dough that went to the tray as it was. There are bakeries that want it exactly like that.")
        : (es?"La miga sale cerrada y pareja, y las tres se parecen más entre sí: eso lo hizo la mano, no el horno."
            : "The crumb comes out close and even, and the three are more alike than they were — that was the hand, not the oven.")});
      s.push({note:baked
        ? (es?"Puedes cambiar de opinión las veces que quieras. Aquí nada se te quita."
            : "Change your mind as often as you like. Nothing here is ever taken away from you.")
        : (es?"Escoge una. No hay reloj y no hay error que te cueste nada."
            : "Pick one. There is no clock, and no mistake here costs you anything.")});
      s.push({btn:(es?"vainilla":"vanilla")+(g==="v"?"   ✓":""),run:()=>hBake("v")});
      s.push({btn:(es?"chocolate":"chocolate")+(g==="c"?"   ✓":""),run:()=>hBake("c")});
      if(baked)s.push({btn:es?"quitarles la costra":"take the shells off",run:()=>hBake("p")});
      return s;
    }
  }
};

/* WHERE THE READ MARK STANDS. The coordinate never moves; only the glyph under it does, so the
   mark, the Read button and the card all keep working across the bake. */
const READS=[{world:"horno",x:H_TRAY.x,y:H_TRAY.y,doc:"charola"},
             {world:"horno",x:H_MASATILE.x,y:H_MASATILE.y,doc:"masa"}];
