/* El Faro — the gauge pack. NOT a game. It is the smallest thing that can be a world, and it
   exists to MEASURE what the engine demands of a pack rather than to be played. See docs/GAUGE.md.

   MEASUREMENT, and the reason this file is the size it is: the engine bare-dereferences about
   eighty UI keys in applyLang() alone (engine/engine.js:3946+). docs/NEW-WORLD.md lists `UI` as
   ONE row of a table. The placeholders below are deliberately the key's own name: a pack that has
   not thought about a string should LOOK like a pack that has not thought about it, and anything
   here that shows up on screen reading "lbHairC" is the engine telling us it demanded a string a
   five-tile world has no opinion about. */
const G_REQUIRED={
  add:"add",
  admOff:"admOff",
  admOn:"admOn",
  begin:"begin",
  brushes:"brushes",
  cam:"cam",
  cam3d:"cam3d",
  camFront:"camFront",
  camIso:"camIso",
  camTop:"camTop",
  closeSet:"closeSet",
  crLooksLb:"crLooksLb",
  crTitle:"crTitle",
  ease:"ease",
  easeNames:"easeNames",
  exDl:"exDl",
  exIcs:"exIcs",
  exTabCare:"exTabCare",
  exTabJson:"exTabJson",
  exTabRep:"exTabRep",
  expBtn:"expBtn",
  expCopy:"expCopy",
  expHint:"expHint",
  expTitle:"expTitle",
  in1:"in1",
  in2:"in2",
  in3:"in3",
  in4:"in4",
  joyB:"joyB",
  langQuick:"langQuick",
  lbAdm:"lbAdm",
  lbAle:"lbAle",
  lbCam:"lbCam",
  lbCtl:"lbCtl",
  lbEase:"lbEase",
  lbHairC:"lbHairC",
  lbHairS:"lbHairS",
  lbLang:"lbLang",
  lbMusic:"lbMusic",
  lbName:"lbName",
  lbOutfit:"lbOutfit",
  lbPattern:"lbPattern",
  lbSeason:"lbSeason",
  lbShirt:"lbShirt",
  lbSkin:"lbSkin",
  lbStakes:"lbStakes",
  lbTheme:"lbTheme",
  mapTitle:"mapTitle",
  mpBtn:"mpBtn",
  musOff:"musOff",
  musOn:"musOn",
  nextBack:"nextBack",
  openLab:"openLab",
  padB:"padB",
  replay:"replay",
  setTitle:"setTitle",
  stkHearts:"stkHearts",
  stkNone:"stkNone",
  swipeB:"swipeB",
  teFix:"teFix",
  teFrom:"teFrom",
  teModeLb:"teModeLb",
  teOpen:"teOpen",
  teTitle:"teTitle",
  tlApply:"tlApply",
  tlClose:"tlClose",
  tlFindPh:"tlFindPh",
  tlHint:"tlHint",
  tlTitle:"tlTitle",
  tpBtn:"tpBtn",
  undoLb:"undoLb",
  wdBtn:"wdBtn",
};
const G_EN=Object.assign({},G_REQUIRED,{
  levels:["Keeper"],
  locs:{lamp:"The lamp room"},
  arrive:{lamp:"The lamp room. Salt on the glass."},
  flavor:{},
  grades:["kept","bright","blinding"],
  /* FORCED: the shared suite requires these three style ids by name (test/engine.smoke.js:150),
     so a lighthouse keeper is offered an afro whether or not the pack draws one. docs/TAGS.md L3. */
  styles:[["crop","Cropped"],["long","Long"],["beard","Beard"],["afro","Afro"]],
  outfits:[["coat","Oilskin"]],
  tunes:[["hum","The hum"]],
  brushes:[["salt","Salt"]],
  patterns:[["plain","Plain"]],
  easeNames:["still"],
  /* FORCED: the engine's own THEMES table has a key literally named `meridian`
     (engine/engine.js:3608) and the shell's buttons are keyed to it. docs/TAGS.md L17. */
  themes:{meridian:"Dusk"},
  /* FORCED: the shell hardcodes these three data-c keys (index.html:386-388) AND the engine
     hardcodes their shirt colours (SHIRTS, engine/engine.js:341), AND applyLang reads pair[0]
     with no guard (:3950) — so omitting any one of them is a boot crash, not a missing label.
     A lighthouse has one job and the engine insists it has three careers. docs/TAGS.md L17. */
  classes:{architect:["Keeper","the one who climbs"],diplomat:["Wick","the one who trims"],operator:["Glass","the one who cleans"]},
  contBtn:(n)=>"Back to the lamp, "+n,
  repHead:(n)=>"# "+n,
  repL:{foot:"-"}
});
const G_ES=Object.assign({},G_REQUIRED,{
  levels:["Farero"],
  locs:{lamp:"La linterna"},
  arrive:{lamp:"La linterna. Sal en el vidrio."},
  flavor:{},
  grades:["cuidada","brillante","cegadora"],
  styles:[["crop","Corto"],["long","Largo"],["beard","Barba"],["afro","Afro"]],
  outfits:[["coat","Impermeable"]],
  tunes:[["hum","El zumbido"]],
  brushes:[["salt","Sal"]],
  patterns:[["plain","Liso"]],
  easeNames:["quieto"],
  themes:{meridian:"Atardecer"},
  classes:{architect:["Farero","el que sube"],diplomat:["Mecha","el que recorta"],operator:["Vidrio","el que limpia"]},
  contBtn:(n)=>"De vuelta a la linterna, "+n,
  repHead:(n)=>"# "+n,
  repL:{foot:"-"}
});
const UI={en:G_EN,es:G_ES};
