/* El Horno — the words.

   MEASURED, and it is the second-biggest thing a new pack pays: the engine bare-dereferences
   about eighty UI keys in applyLang() and docs/NEW-WORLD.md lists `UI` as ONE row of a table.
   content/gauge/strings.js fills them with their own key names on purpose, because the gauge's
   job is to LOOK unfinished. This pack's job is to be sent to somebody, so every one of them is
   a real word here. The list itself is the gauge's measurement, kept in its order. */
const H_BASE={
  add:"Add", admOff:"Off", admOn:"On", begin:"Into the kitchen",
  brushes:"Brushes", cam:"View", cam3d:"3D", camFront:"Front", camIso:"Iso", camTop:"Top",
  closeSet:"Close", crLooksLb:"Looks", crTitle:"Who is baking today?",
  ease:"Ease", easeNames:"Ease",
  exDl:"Download", exIcs:"Calendar", exTabCare:"Notes", exTabJson:"Data", exTabRep:"Card",
  expBtn:"Export", expCopy:"Copy", expHint:"Take the card with you.", expTitle:"Your card",
  in1:"Walk with the stick or the arrows.",
  in2:"Stand next to the tray.",
  in3:"Press Read.",
  in4:"Pick a shell.",
  joyB:"Stick", langQuick:"ES",
  lbAdm:"Admin", lbAle:"Alebrijes", lbCam:"View", lbCtl:"Controls", lbEase:"Ease",
  lbHairC:"Hair colour", lbHairS:"Hair", lbLang:"Language", lbMusic:"Music", lbName:"Name",
  lbOutfit:"Apron", lbPattern:"Pattern", lbSeason:"Season", lbShirt:"Shirt", lbSkin:"Skin",
  lbStakes:"Stakes", lbTheme:"Theme",
  mapTitle:"The kitchen", mpBtn:"Map", musOff:"Off", musOn:"On", nextBack:"Back",
  openLab:"Open", padB:"Pad", replay:"Again", setTitle:"Settings",
  stkHearts:"Hearts", stkNone:"None", swipeB:"Swipe",
  teFix:"Fix", teFrom:"From", teModeLb:"Mode", teOpen:"Open", teTitle:"Colours",
  tlApply:"Apply", tlClose:"Close", tlFindPh:"Find…", tlHint:"Pick a tile.", tlTitle:"Tiles",
  tpBtn:"Pass", undoLb:"Undo", wdBtn:"Wide"
};
const H_BASE_ES=Object.assign({},H_BASE,{
  add:"Agregar", admOff:"No", admOn:"Sí", begin:"A la cocina",
  brushes:"Pinceles", cam:"Vista", camFront:"Frente", camTop:"Arriba",
  closeSet:"Cerrar", crLooksLb:"Facha", crTitle:"¿Quién hornea hoy?",
  ease:"Calma", easeNames:"Calma",
  exDl:"Descargar", exIcs:"Calendario", exTabCare:"Notas", exTabJson:"Datos", exTabRep:"Tarjeta",
  expBtn:"Exportar", expCopy:"Copiar", expHint:"Llévate la tarjeta.", expTitle:"Tu tarjeta",
  in1:"Camina con la palanca o las flechas.",
  in2:"Párate junto a la charola.",
  in3:"Aprieta Leer.",
  in4:"Escoge una costra.",
  joyB:"Palanca", langQuick:"EN",
  lbAle:"Alebrijes", lbCtl:"Controles", lbEase:"Calma",
  lbHairC:"Color de pelo", lbHairS:"Pelo", lbLang:"Idioma", lbMusic:"Música", lbName:"Nombre",
  lbOutfit:"Mandil", lbPattern:"Estampado", lbSeason:"Temporada", lbShirt:"Camisa", lbSkin:"Piel",
  lbStakes:"Apuesta", lbTheme:"Tema",
  mapTitle:"La cocina", mpBtn:"Mapa", musOff:"No", musOn:"Sí", nextBack:"Atrás",
  openLab:"Abrir", padB:"Cruz", replay:"Otra vez", setTitle:"Ajustes",
  stkHearts:"Corazones", stkNone:"Ninguna", swipeB:"Deslizar",
  teFix:"Arreglar", teFrom:"De", teModeLb:"Modo", teOpen:"Abrir", teTitle:"Colores",
  tlApply:"Aplicar", tlClose:"Cerrar", tlFindPh:"Buscar…", tlHint:"Escoge un mosaico.", tlTitle:"Mosaicos",
  tpBtn:"Pase", undoLb:"Deshacer", wdBtn:"Ancho"
});
const H_EN=Object.assign({},H_BASE,{
  levels:["Aprendiz"],
  locs:{horno:"The kitchen"},
  arrive:{horno:"The kitchen. Flour on everything."},
  flavor:{},
  grades:["warm","risen","golden"],
  /* FORCED: the shared suite requires these four style ids BY NAME (test/engine.smoke.js), so a
     baker is offered an afro whether or not the pack draws one. docs/TAGS.md L3. */
  styles:[["crop","Cropped"],["long","Long"],["beard","Beard"],["afro","Afro"]],
  outfits:[["apron","Apron"]],
  tunes:[["radio","The radio"]],
  brushes:[["flour","Flour"]],
  patterns:[["plain","Plain"]],
  easeNames:["steady"],
  /* FORCED: the engine's own THEMES table has a key literally named `meridian`, and the shell's
     buttons are keyed to it. docs/TAGS.md L17. */
  themes:{meridian:"Morning"},
  /* THE CREATOR-SCREEN WALL, WORKED AROUND AND NOT FIXED. Every shell hardcodes
     data-c="architect|diplomat|operator", the engine hardcodes SHIRTS for those three ids, and
     applyLang bare-dereferences t.classes[b.dataset.c] — so omitting one is a boot crash, not a
     missing label. A baking world whose creator screen offers "architect, diplomat, operator" is
     the joke landing the wrong way, so the three ids are kept and RENAMED to three jobs in a
     bakery. The ids are still the engine's; only the words are ours. This is a costume over a
     hardcoded seam, it is on docs/OPEN.md §2, and the real fix is a pack-declared roster. */
  classes:{architect:["Panadera","the one at the bench"],
           diplomat:["Hornero","the one at the oven"],
           operator:["Charolera","the one who carries the trays"]},
  contBtn:(n)=>"Back to the bench, "+n,
  repHead:(n)=>"# "+n,
  repL:{foot:"-"}
});
const H_ES=Object.assign({},H_BASE_ES,{
  levels:["Aprendiz"],
  locs:{horno:"La cocina"},
  arrive:{horno:"La cocina. Harina en todo."},
  flavor:{},
  grades:["tibia","leudada","dorada"],
  styles:[["crop","Corto"],["long","Largo"],["beard","Barba"],["afro","Afro"]],
  outfits:[["apron","Mandil"]],
  tunes:[["radio","El radio"]],
  brushes:[["flour","Harina"]],
  patterns:[["plain","Liso"]],
  easeNames:["parejo"],
  themes:{meridian:"Mañana"},
  classes:{architect:["Panadera","la de la mesa"],
           diplomat:["Hornero","el del horno"],
           operator:["Charolera","la que carga las charolas"]},
  contBtn:(n)=>"De vuelta a la mesa, "+n,
  repHead:(n)=>"# "+n,
  repL:{foot:"-"}
});
const UI={en:H_EN,es:H_ES};
