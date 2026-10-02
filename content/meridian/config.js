/* game version — MUST match sw.js CACHE (the smoke test enforces the lockstep) */
const GAMENAME="Meridian Quest"; /* the engine prints the name; the pack owns it */
const GAMEV="mq-v228";
/* Meridian Quest content pack — game tuning: level thresholds, total XP, chapters. */
const LEVELS=[0,45,90,120];
/* default camera for this pack. TRUE 3D as of 2026-09-01 (owner: "please make 3d
   default"); front-profile 2.5D was the previous default (owner + [partner], 2026-08-31)
   and is still one tap away. A device's own Settings choice always wins, and the
   renderer falls back to front-profile by itself if 3D cannot run on the device. */
const CAMDEF="3d";
const MAXXP=880;   /* +50 for la esquina: 10 a quest x4, and 10 for the one choice that carries `next` */
/* Which of this world's rooms play which ROLE for the engine (#25, the PLACES seam). The engine
   never assumes a room name; it asks this table. Meridian's answer is the engine's default table,
   key for key (the smoke fails the build if they drift), written out here so the metadata lives
   with the content — owner, 2026-09-07: "update here and meridian and template so we have a
   good amount of metadata that includes these". A role you leave out falls back to the default.
   The town's copy is changarrito/content/config.js; the template is docs/NEW-WORLD.md §3. */
const PLACES={
  home:"hq",                 /* the room a new game and a broken save land in */
  spawn:[10,11],             /* the tile in `home` you land on — must be walkable */
  street:"st",               /* the map's world: the 📍 dot follows you here */
  park:"pk",                 /* the room the leash leads to; nothing else happens there */
  parkIn:[2,6,"right"],      /* where you arrive in the park, and which way you face */
  parkDog:[3,6],             /* where the dog you brought stands when you arrive */
  parkDogHome:[8,6],         /* where that dog drifts back to while you play */
  eateries:[{world:"lc"}],   /* the places that serve food: a dog who sings at the door is brought a bowl of water
                                by whoever works there (owner, 2026-09-29: "awooing infront of a restaurant and a
                                worker brings them a water bowl"). `who` may name the person; left out, it is the
                                first one who works there — in La Cocina, Doña Rosa. A pack that names none: the
                                dog never sings at a door, and that roll passes quietly. */
  parkAdopt:[[17,4],[19,4],[17,2],[19,2],[16,3],[20,3]], /* free spots an adopted dog may take, tried in order */
  friends:["st","me","lc","lo"], /* the worlds whose people a dog may befriend — only worlds you have */
  upstairs:"f2"              /* the floor the map marks ⇧ */
};
/* Districts: a district's quest pack, and how many answers play its ending.
   `need` is deliberately LOWER than the pack size — the city is a template, so the
   bar is data, not a constant in the engine. Retune it here.
   `need` closes nothing: it is the bar for the ENDING BEAT, after which the district
   stays open and its remaining quests stay answerable (docs/OWNER.md — no practice
   is ever missed). Reaching it breaks ground on the next lot; it never locks a door. */
/* Stakes — an OPTIONAL layer on top of the grade, declared in content so a pack
   picks its own and a district can override the pack (a relaxed town can still hold
   one scored mini-game). Modes:
     none    — the open-world default: nothing is ever lost
     hearts  — lives, as Meridian shipped them; admin can toggle this on for a challenge
     budget  — ARCHITECTURE ONLY. Named so the seam exists if a realistic teaching
               scenario is ever wanted. Deliberately NOT implemented; the engine
               treats it as `none`. See docs/OWNER.md before building it.
   Underneath every mode the GRADE is always on and never blocks anything. */
const STAKES={mode:"none",hearts:3};
/* GROWTH — what the city builds as the player earns it, DECLARED BY CONTENT.
   The engine knows the mechanism — raise staged tiles, seal a finished facade, move an
   NPC out of the way, drop a district's storefront ribbon — and none of the names.
   It used to hardcode that quests 12 and 13 raise La Obra, that quest 15 opens Xochi's
   fitting room, that the estimator is NPC "e" who ends up at 7,7, and that district 1
   is El Mercado. A different pack with different quests at those indices would have
   built Meridian's construction site (docs/OWNER.md — entities as data; if a feature
   cannot be turned off for [partner], it is built wrong). A pack with no GROWTH never grows.
   Declared after maps.js so it can point straight at OBRA and MERCADO. */
const GROWTH={
  /* a staged build: the Nth of `quests` answered raises stage N of `tiles` */
  staged:{world:"st",quests:[12,13],tiles:OBRA,
    /* where the hero is stepped out to if a stage grows over or encloses them */
    safe:{x:21,y:4},
    /* applied once every stage is up */
    done:{moveNpc:{key:"e",x:7,y:7},                 /* Lupe moves streetside */
          seal:{y0:6,y1:8,x0:15,x1:28,tile:"B"}}},   /* the finished building is solid */
  /* a district's storefront ribbon, applied once that district has opened. `doorstep`
     is where the handover stands you — the mercado's front step. A pack may declare
     `ribbons:[…]` instead (one per storefront); this singular form still works. */
  ribbons:[
   {id:"me",world:"st",district:1,tiles:MERCADO,  doorstep:{world:"st",x:6, y:12,dir:"down"}},
   {id:"ta",world:"st",district:2,tiles:TALLER,   doorstep:{world:"st",x:23,y:12,dir:"down"}},
   {id:"pa",world:"ex",district:3,tiles:ESPIGA,   doorstep:{world:"ex",x:7, y:2, dir:"up"}},
   {id:"li",world:"ex",district:4,tiles:VELAZQUEZ,doorstep:{world:"ex",x:12,y:2, dir:"up"}},
   /* Both moved off ex row 1 on 2026-09-11: row 1 is the trolley's line, so the handover was
      standing the player on live rails and the tram then braked and would not start again.
      Row 2 is the south pavement, and `dir:"up"` faces the storefront that just opened instead of
      away from it — the old "down" was copied from the two shops on st whose doors are on the other
      side of the street. Deleting the doorsteps outright was the first fix and test/smoke.js refused
      it: a ribbon without one "lands somewhere you are not standing — that one has to say where",
      and neither of these says anything. The rule was right and the fix was lazy. */
   {id:"no",world:"st",district:5,tiles:NOLASCO,  doorstep:{world:"st",x:25,y:1, dir:"down"}},
   /* gifts upstairs — a delivery IS a storefront aimed at f2. Two land where a box stood
      (Tacho's, Nolasco's), Vero's crew hauls two boxes away, and Chelo's corner and Licha's
      chair land on open floor (BACKLOG §6; corrected 2026-09-05 — this comment used to say
      each one lands on a box). No doorstep on a gift, so the handover never stands you upstairs. */
 /* the wall: blank paper from day one, and a district's last visit pins its own page over it.
    The document behind it is DOCS[<id>] in content/meridian/docs.js. */
 {id:"poster-labs",world:"f2",district:1,tiles:[[0,2,"▤"]],
  say:{en:"Somebody pinned your Meridian Labs decision log to the office wall upstairs. Go up the stairs in HQ and read it.",es:"Alguien prendió tu bitácora de Meridian Labs en la pared de la oficina de arriba. Sube las escaleras en HQ y léela."}},
 {id:"poster-me",world:"f2",district:2,tiles:[[0,4,"▤"]],
  say:{en:"Your memo for El Mercado went up on the office wall — second sheet from the left, upstairs.",es:"Tu memo de El Mercado ya está en la pared de la oficina — la segunda hoja de la izquierda, arriba."}},
 {id:"poster-ta",world:"f2",district:3,tiles:[[0,6,"▤"]],
  say:{en:"Tacho's process map is on your office wall now. Third sheet, upstairs.",es:"El mapa de proceso de Tacho ya está en la pared de tu oficina. Tercera hoja, arriba."}},
 {id:"poster-pa",world:"f2",district:4,tiles:[[0,13,"▤"]],
  say:{en:"La Espiga's discovery notes are pinned upstairs, first sheet right of the window.",es:"Las notas de La Espiga están prendidas arriba, primera hoja a la derecha de la ventana."}},
 {id:"poster-li",world:"f2",district:5,tiles:[[0,15,"▤"]],
  say:{en:"Vero's pilot review is on your wall upstairs, right of the window.",es:"La revisión del piloto de Vero está en tu pared de arriba, a la derecha de la ventana."}},
 {id:"poster-no",world:"f2",district:6,tiles:[[0,17,"▤"]],
  say:{en:"Nolasco's three lists are pinned upstairs — the last sheet on the wall.",es:"Las tres listas de Nolasco están prendidas arriba — la última hoja de la pared."}},
   {id:"gift-me",world:"f2",district:2,tiles:[[11,2,"K"],[11,3,"K"]],
  say:{en:"Doña Chelo sent a coffee corner up to your office.",es:"Doña Chelo mandó un rincón de café a tu oficina."}},
   {id:"gift-ta",world:"f2",district:3,tiles:[[11,14,"○"]],
  say:{en:"Tacho sent something up to the office. It is on the floor where a box used to be.",es:"Tacho mandó algo a la oficina. Está en el piso donde había una caja."}},
   {id:"gift-pa",world:"f2",district:4,tiles:[[2,11,"⊔"]],
  say:{en:"Doña Licha sent a chair up to your office, so whoever comes to see you can sit.",es:"Doña Licha mandó una silla a tu oficina, para que quien te visite se pueda sentar."}},
   {id:"gift-li",world:"f2",district:5,tiles:[[5,15,"."],[10,18,"."]],
  say:{en:"Vero's crew went up to the office and took the empty boxes away. That was the gift.",es:"La cuadrilla de Vero subió a la oficina y se llevó las cajas vacías. Ese era el regalo."}},
   {id:"gift-no",world:"f2",district:6,tiles:[[10,17,"▯"]],
  say:{en:"A file cabinet is standing in your office where the last box was. Nolasco sent it up.",es:"Hay un archivero en tu oficina donde estaba la última caja. Lo mandó Nolasco."}}  /* the file cabinet lands ON the last box Nolasco's crew left at (17,10) — a box becomes a cabinet, nothing clears; it used to land on bare floor and clear the box instead (#4: the stairs are moving, so this no longer says "by the stairs") */
  ],
  /* any attempt at this quest opens the wardrobe — the extra, not the quest */
  wardrobeQuest:15,
  /* and who runs the fitting room once it is open */
  wardrobeNpc:"xochi",
  barberNpc:"naye" /* who runs the chair: outfit, hair and the calavera after the start (owner, 2026-09-07) */
};
/* SEASONS — a season changes COLOUR, never design (owner, 2026-09-01: "if someone
   changes the palette, it can change but keep the general design"), with one signed
   exception: Día de Muertos may DRESS the bridge (owner, 2026-09-07: "marigold, and petals
   too and papel picado - do it alll!!!"). The engine knows only that there is a current
   season and that it may override world-art keys through art(key, fallback); the names,
   dates and colours live here. Arrives on its own by the calendar (`from`/`to` are
   [month, day], inclusive, and may wrap the new year); Settings offers "by the calendar",
   "year-round", or any season by name — the by-name switch is the owner's way to test it
   before October ("a manual way too because i will want to test").
   Keys the engine reads: `bridge` (the six bands), `bridgeStyle` ("petals" strews the deck
   with cempasúchil instead of bands), `papel` (a palette hangs papel picado over the
   crossing in 3D), `sky` (the north window's dusk). `papelBridge` (the cut hung over the
   crossing, marigold so the bridge reads as one warm object). Palette SIGNED 2026-09-07 ("marigold"), re-cut the same day on Pili's read — a real value range, embers to pale gold, dark first, so the heap has depth:
   a cempasúchil gradient, gold to deep orange, after the marigold bridge of Día de Muertos —
   the petals laid as a path so the souls find their way home. */
const SEASONS={
  muertos:{label:{en:"Día de Muertos",es:"Día de Muertos"},from:[10,18],to:[11,3],
    art:{bridge:["#7A2E12","#B8410E","#E2620F","#F2870F","#FBB024","#FFD972"],
         bridgeStyle:"petals",
         papel:["#E8478F","#2FA5A0","#F2B705","#7B4BA8","#F07C24","#F6F2E8","#7BD3F7","#C5E86C","#FF4D4D","#3D5AFE"],papelBridge:["#FBB024","#F2870F","#E2620F","#F6F2E8"], /* cut paper: pink, teal, gold, purple, orange, white */
         /* LA FIESTA (Nacho, 2026-09-07): dress by what a place is for — Calle Principal is dressed, Calle Dos is
            the party, the park is the remembering, workplaces get nothing. Swags, not wallpaper: five to nine
            tiles, a gap of sky between, each tied to a tree or a facade you can see. Never a map row. */
         swags:[{world:"st",from:[1,1],to:[8,1]},{world:"st",from:[10,1],to:[18,1]},          /* HQ's facade row; nothing east of x18 — that wall is the mural's */
                {world:"st",from:[0,4],to:[6,4]},{world:"st",from:[7,4],to:[12,4]},{world:"st",from:[15,4],to:[21,4]}, /* the awning line, the Studio front */
                {world:"st",from:[2,14],to:[12,14]},{world:"st",from:[18,14],to:[26,14]},    /* jacaranda to jacaranda; the middle left open */
                {world:"ex",from:[3,0],to:[9,0]},{world:"ex",from:[9,0],to:[15,0]},{world:"ex",from:[15,0],to:[20,0]}, /* the four jacarandas */
                {world:"ex",from:[5,3],to:[17,3]},                                            /* Doña Tencha's roofline to El Portero's caseta — the neighbours tied it */
                {world:"ex",from:[4,6],to:[18,6]},                                            /* inside the crew pen: it's their yard */
                {world:"pk",from:[13,1],to:[19,1]},{world:"pk",from:[7,9],to:[13,9]},{world:"pk",from:[8,3],to:[15,3]}   /* was [6,4]-[13,4]: its west pole was planted at the bridge's east mouth, so you walked into it and through it (owner, 2026-09-10). Moved two tiles east and one north — the strings now run PARALLEL to the crossing instead of ending in it. */, /* the park: tree to tree, and one across the path NORTH of the bridge so you walk under it — never in a row the deck is in, or the two cuts tangle (owner, 2026-09-08: "overlay issues still in the park") */
                {world:"hq",from:[0,15],to:[9,15]},                                           /* one short swag over the lobby, tied to the west wall; the offices stay offices */
                {world:"me",from:[0,1],to:[8,1]},{world:"me",from:[11,1],to:[19,1]},           /* El Mercado: along the awning line */
                {world:"lc",from:[0,1],to:[7,1]},{world:"lc",from:[12,1],to:[19,1]},           /* La Cocina: the same */
                /* everywhere (owner, 2026-09-07: "the papel picado can be everywhere and more colorful") — the offices too, under the north wall */
                {world:"hq",from:[0,1],to:[7,1]},{world:"hq",from:[8,1],to:[16,1]},{world:"f2",from:[0,1],to:[9,1]},{world:"f2",from:[10,1],to:[19,1]},
                {world:"lo",from:[0,2],to:[9,2]},{world:"lo",from:[10,2],to:[19,2]},{world:"li",from:[0,2],to:[9,2]},{world:"li",from:[10,2],to:[19,2]},
                {world:"ta",from:[0,1],to:[9,1]},{world:"ta",from:[10,1],to:[19,1]},{world:"pa",from:[0,1],to:[9,1]},{world:"pa",from:[10,1],to:[19,1]},
                {world:"no",from:[0,1],to:[11,1]},{world:"no",from:[12,1],to:[23,1]},{world:"ex",from:[0,9],to:[11,9]},{world:"ex",from:[12,9],to:[23,9]},
                {world:"st",from:[0,12],to:[8,12]},{world:"st",from:[20,12],to:[29,12]}],
         props:[ /* calaveritas de azúcar on window sills (owner, 2026-09-07: "probably better in a window sill, as in human reality") — sill:true, the facade's own window says where */
                {world:"st",x:2,y:0,kind:"calaverita",sill:true},{world:"st",x:6,y:0,kind:"calaverita",sill:true,foil:"#2FA5A0"},{world:"st",x:10,y:0,kind:"calaverita",sill:true,foil:"#7B4BA8"},{world:"st",x:12,y:0,kind:"calaverita",sill:true,foil:"#F2B705"},
                {world:"st",x:17,y:0,kind:"calaverita",sill:true},{world:"st",x:22,y:0,w:1,kind:"calaverita",sill:true,foil:"#2FA5A0"},{world:"st",x:2,y:5,kind:"calaverita",sill:true,foil:"#7B4BA8"},{world:"st",x:9,y:5,kind:"calaverita",sill:true}, /* HQ's second window, La Cocina's awning windows */
                /* ❗La ofrenda (Nacho; owner: "sounds like a good idea"): one at the foot of the marigold bridge, one on Doña Tencha's table — an empty frame, nobody named */
                {world:"pk",x:20,y:10,kind:"ofrenda"} /* the far south-east corner (owner, 2026-09-10: "the altar in the park is in a very buy area, put it in the corner that is further away and has little happening"). It was at (6,2), two tiles off the bridge mouth, stacked with a papel picado pole — the busiest square in the park. Nothing else is out here: no swag, no adoption spot, no crossing. */,{world:"casa-w",x:3,y:2,kind:"ofrenda"}],
         hangs:[{world:"ex",x:18,y:0,kind:"pinata"}],                                         /* over the paletera's corner, where the kids are; Kike hung it */
         bloom:"#F59E1B",                                                                     /* every planter blooms cempasúchil */
         facepaint:true, /* the calavera in Día de Muertos too (owner, 2026-09-07) — the engine's five looks */
         sky:"#E8A24A"}}, /* the north window's sky at dusk — Don Güero, 2026-09-02 */
  /* NOCHE DE ALEBRIJES — the owner's second mode (2026-09-07: "another mode where they turn into
     little alebrije colors and i get a dia de los muertos face paint color"). No dates: picked by
     name in Settings → Season, never by the calendar. Carries the Muertos dressing, and adds
     `alebrije` (five looks every animal is tinted and marked in, keeping its silhouette — an
     alebrije is a real animal in impossible colours; the wingless get tiny wings) and `facepaint`
     (five calavera looks for everyone; the hero picks, a person's comes from who they are). */
  alebrije:{label:{en:"Noche de alebrijes",es:"Noche de alebrijes"},
    art:{bridge:["#7A2E12","#B8410E","#E2620F","#F2870F","#FBB024","#FFD972"],bridgeStyle:"petals",
         papel:["#E8478F","#2FA5A0","#F2B705","#7B4BA8","#F07C24","#F6F2E8","#7BD3F7","#C5E86C","#FF4D4D","#3D5AFE"],papelBridge:["#FBB024","#F2870F","#E2620F","#F6F2E8"],sky:"#E8A24A",
         /* LA FIESTA (Nacho, 2026-09-07): dress by what a place is for — Calle Principal is dressed, Calle Dos is
            the party, the park is the remembering, workplaces get nothing. Swags, not wallpaper: five to nine
            tiles, a gap of sky between, each tied to a tree or a facade you can see. Never a map row. */
         swags:[{world:"st",from:[1,1],to:[8,1]},{world:"st",from:[10,1],to:[18,1]},          /* HQ's facade row; nothing east of x18 — that wall is the mural's */
                {world:"st",from:[0,4],to:[6,4]},{world:"st",from:[7,4],to:[12,4]},{world:"st",from:[15,4],to:[21,4]}, /* the awning line, the Studio front */
                {world:"st",from:[2,14],to:[12,14]},{world:"st",from:[18,14],to:[26,14]},    /* jacaranda to jacaranda; the middle left open */
                {world:"ex",from:[3,0],to:[9,0]},{world:"ex",from:[9,0],to:[15,0]},{world:"ex",from:[15,0],to:[20,0]}, /* the four jacarandas */
                {world:"ex",from:[5,3],to:[17,3]},                                            /* Doña Tencha's roofline to El Portero's caseta — the neighbours tied it */
                {world:"ex",from:[4,6],to:[18,6]},                                            /* inside the crew pen: it's their yard */
                {world:"pk",from:[13,1],to:[19,1]},{world:"pk",from:[7,9],to:[13,9]},{world:"pk",from:[8,3],to:[15,3]}   /* was [6,4]-[13,4]: its west pole was planted at the bridge's east mouth, so you walked into it and through it (owner, 2026-09-10). Moved two tiles east and one north — the strings now run PARALLEL to the crossing instead of ending in it. */, /* the park: tree to tree, and one across the path NORTH of the bridge so you walk under it — never in a row the deck is in, or the two cuts tangle (owner, 2026-09-08: "overlay issues still in the park") */
                {world:"hq",from:[0,15],to:[9,15]},                                           /* one short swag over the lobby, tied to the west wall; the offices stay offices */
                {world:"me",from:[0,1],to:[8,1]},{world:"me",from:[11,1],to:[19,1]},           /* El Mercado: along the awning line */
                {world:"lc",from:[0,1],to:[7,1]},{world:"lc",from:[12,1],to:[19,1]},           /* La Cocina: the same */
                /* everywhere (owner, 2026-09-07: "the papel picado can be everywhere and more colorful") — the offices too, under the north wall */
                {world:"hq",from:[0,1],to:[7,1]},{world:"hq",from:[8,1],to:[16,1]},{world:"f2",from:[0,1],to:[9,1]},{world:"f2",from:[10,1],to:[19,1]},
                {world:"lo",from:[0,2],to:[9,2]},{world:"lo",from:[10,2],to:[19,2]},{world:"li",from:[0,2],to:[9,2]},{world:"li",from:[10,2],to:[19,2]},
                {world:"ta",from:[0,1],to:[9,1]},{world:"ta",from:[10,1],to:[19,1]},{world:"pa",from:[0,1],to:[9,1]},{world:"pa",from:[10,1],to:[19,1]},
                {world:"no",from:[0,1],to:[11,1]},{world:"no",from:[12,1],to:[23,1]},{world:"ex",from:[0,9],to:[11,9]},{world:"ex",from:[12,9],to:[23,9]},
                {world:"st",from:[0,12],to:[8,12]},{world:"st",from:[20,12],to:[29,12]}],
         props:[ /* calaveritas de azúcar on window sills (owner, 2026-09-07: "probably better in a window sill, as in human reality") — sill:true, the facade's own window says where */
                {world:"st",x:2,y:0,kind:"calaverita",sill:true},{world:"st",x:6,y:0,kind:"calaverita",sill:true,foil:"#2FA5A0"},{world:"st",x:10,y:0,kind:"calaverita",sill:true,foil:"#7B4BA8"},{world:"st",x:12,y:0,kind:"calaverita",sill:true,foil:"#F2B705"},
                {world:"st",x:17,y:0,kind:"calaverita",sill:true},{world:"st",x:22,y:0,w:1,kind:"calaverita",sill:true,foil:"#2FA5A0"},{world:"st",x:2,y:5,kind:"calaverita",sill:true,foil:"#7B4BA8"},{world:"st",x:9,y:5,kind:"calaverita",sill:true}, /* HQ's second window, La Cocina's awning windows */
                /* ❗La ofrenda (Nacho; owner: "sounds like a good idea"): one at the foot of the marigold bridge, one on Doña Tencha's table — an empty frame, nobody named */
                {world:"pk",x:20,y:10,kind:"ofrenda"} /* the far south-east corner (owner, 2026-09-10: "the altar in the park is in a very buy area, put it in the corner that is further away and has little happening"). It was at (6,2), two tiles off the bridge mouth, stacked with a papel picado pole — the busiest square in the park. Nothing else is out here: no swag, no adoption spot, no crossing. */,{world:"casa-w",x:3,y:2,kind:"ofrenda"}],
         hangs:[{world:"ex",x:18,y:0,kind:"pinata"}],                                         /* over the paletera's corner, where the kids are; Kike hung it */
         bloom:"#F59E1B",                                                                     /* every planter blooms cempasúchil */
         alebrije:{looks:[ /* Pili's five, the same five on every animal so the night reads as one; wings on the wingless */
           {id:"fuego",name:{en:"Ember",es:"Fuego"},tint:"#FF6A00",pat:"#FFC300",accent:"#FF2E88",wings:true},
           {id:"cielo",name:{en:"Sky",es:"Cielo"},tint:"#00D9E8",pat:"#FFE9F2",accent:"#8A3FE8",wings:true},
           {id:"selva",name:{en:"Jungle",es:"Selva"},tint:"#7CFF3D",pat:"#12B39B",accent:"#FFC300",wings:false},
           {id:"cempasuchil",name:{en:"Marigold",es:"Cempasúchil"},tint:"#FFC300",pat:"#FF6A00",accent:"#FF2E88",wings:false},
           {id:"medianoche",name:{en:"Midnight",es:"Medianoche"},tint:"#8A3FE8",pat:"#FF2E88",accent:"#00D9E8",wings:true}]},
         facepaint:{looks:[ /* five calavera looks for everyone. Every one keeps what makes a face read as a
           skull at twelve pixels: a light base, black sockets, the nose, the stitched grin (a review of Día de
           Muertos makeup, 2026-09-07: white bone + black voids IS the symbol; a dark base reads as a mask —
           owner: "having one with all dark is a bit of a no no"). The looks differ in the first thing the eye
           catches: black outlines only · marigold petal rings · a purple tear and red lips · teal rings and
           dots · a red heart nose and a web on the brow. */
           {id:"clasica",name:{en:"Calaca clásica",es:"Calaca clásica"},base:"#F4F1EA",ring:"#2B2536",dark:"#2B2536",brow:"dots",mark:"#2B2536"},
           {id:"cempasuchil",name:{en:"Cempasúchil",es:"Cempasúchil"},base:"#FFF3D6",ring:"#FF6A00",dark:"#3A1F12",petals:true,brow:"dots",mark:"#FFC300"},
           {id:"catrina",name:{en:"Catrina",es:"Catrina"},base:"#F6F2E8",ring:"#1B1230",dark:"#1B1230",tall:true,brow:"tear",mark:"#8A3FE8",lip:"#C8102E"},
           {id:"turquesa",name:{en:"Turquesa",es:"Turquesa"},base:"#EAF7F5",ring:"#00B8C4",dark:"#12324A",brow:"dots",mark:"#00B8C4",chin:"#00B8C4"},
           {id:"corazon",name:{en:"Corazón",es:"Corazón"},base:"#FBEFEA",ring:"#D9342B",dark:"#2B2536",nose:"heart",mark:"#D9342B",brow:"web"}]}}}
};
const CHAPTERS=[
 /* need:12 of 16 — ANY twelve, from anywhere in the district. week1 is not "the
    office": it spans HQ (0-9, 14), La Cocina (10, 11), La Obra (12, 13) and the
    Studio (15), so the twelve never have to be office quests. Dropped from 16 on
    2026-09-01 (❗La puerta) because 16/16 meant Week One's ending only fired on a
    full sweep — making HQ the one place in Meridian you could not come back to, in
    the city whose law is that you always can. */
 /* epi: the prefix of this district's three ending strings in strings.js (epi1..3);
    go: its burnout ending; open: the toast when the next lot opens. Declared here so a
    third district never prints another one's last visit. */
 {id:"principal",quests:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],need:12,
  epi:"epi",go:"goEpi",open:"weekTwoToast",
  industry:{en:"Enterprise IT",es:"TI empresarial"},
  role:{en:"AI Implementation Lead",es:"Líder de Implementación de IA"}},
 {id:"mercado",quests:[16,17,18,19,20,21,22,23],           need:5,
  epi:"mepi",go:"mgoEpi",open:"tallerToast",
  industry:{en:"Grocery retail",es:"Abarrotes"},
  role:{en:"AI Product Manager",es:"Product Manager de IA"}},
 /* Las cuatro puertas (2026-09-02): each district's last visit phones the next lot from
    inside its own ending strings (the engine cannot grade a toast), and its `open`
    toast announces the lot. The last door opens nothing — la inauguración is later.
    `industry` is the room the role is practised in (❗El giro): the report prints
    "industry · role" so five engagements read as five trades, not one title. */
 {id:"taller",quests:[24,25,26,27,28,29,30,31],need:5,
  epi:"tepi",go:"tgoEpi",open:"espigaToast",
  industry:{en:"Auto repair",es:"Taller mecánico"},
  role:{en:"AI Solutions Architect",es:"Arquitecto de Soluciones de IA"}},
 {id:"espiga",quests:[32,33,34,35,36,37,38,39],need:5,
  epi:"eepi",go:"egoEpi",open:"velazquezToast",
  industry:{en:"Bakery",es:"Panadería"},
  role:{en:"Operations Analyst",es:"Analista de Operaciones"}},
 {id:"velazquez",quests:[40,41,42,43,44,45,46,47],need:5,
  epi:"vepi",go:"vgoEpi",open:"nolascoToast",
  industry:{en:"Commercial cleaning",es:"Limpieza comercial"},
  role:{en:"AI Adoption Lead",es:"Líder de Adopción de IA"}},
 {id:"nolasco",quests:[48,49,50,51,52,53,54,55],need:5,
  epi:"nepi",go:"ngoEpi",open:"esquinaToast",
  industry:{en:"Tax & notary",es:"Impuestos y notaría"},
  role:{en:"Prompt & Solutions Engineer",es:"Ingeniero de Prompts y Soluciones"}},
 /* ❗La esquina (2026-09-17, owner: "ok please with meche then"). APPENDED, and it has to be:
    `chSeen` is a SAVED INTEGER INDEX into this array, and GROWTH.ribbons compare hardcoded
    district numbers against it — insert a district anywhere but the end and every existing save
    points at a different district and every ribbon and poster moves. Same trap as quest indices
    (docs/OPEN.md §4), one level up.
    FOUR quests and need:3, never three and two: `gradeOf` grades the first-try fraction of
    ANSWERED quests and the last visit fires the instant `need` is met, so a two-answer bar can
    only ever produce grades 1 and 3 — the middle ending would be written and never played.
    Calle Dos had six people and not one of them ever carried a ❗, in any chapter state. */
 {id:"esquina",quests:[56,57,58,59],need:3,
  epi:"esqepi",go:"esqgoEpi",open:"endStayToast", /* was "esquinaToast" — finishing la esquina announced la esquina. It is the LAST district, so what opens after it is the city: "whatever's still open stays open." */
  industry:{en:"Street food",es:"Comida en la calle"},
  role:{en:"AI Product Manager",es:"Product Manager de IA"}}
];
