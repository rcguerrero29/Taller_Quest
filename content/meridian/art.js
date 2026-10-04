/* ============================================================================
   MERIDIAN TILE ART — the pack's own glyphs (TILEART / TILEMETA)

   The engine's uppercase alphabet is spent, so new tiles are symbols and digits,
   declared HERE and read by the engine as data: TILEART adds a drawing, TILEMETA
   says what the tile IS (how tall it stands, what kind of thing it is). SOLIDX and
   MAPCOL in maps.js carry the same glyph. A pack that ships no art.js gets none of
   these tiles — the engine never learns them.

   First glyph, 2026-09-02 — la ventana del norte:
   "|"  a window IN a wall. Three of them sit in Floor 2's north wall, over the old
        lead's desk. Kind "wall", same lift as "#", so in 3D it is a wall block that
        wears this drawing on its faces and stands flush with the wall beside it.
        What it looks at is the only honest view north of HQ: the back lot, the road
        leaving the barrio, two rooftops and a pole, and on the horizon the graded
        line where the northbound trolley is being laid — Barrio Norte stays a
        promise you can now SEE. The sky takes the season through art("sky").
        The sill is the load-bearing detail: a framed rectangle without one reads as
        a picture on the wall; a sill reads as a window (cold read: test/tilesheet.js).

   Second glyph, 2026-09-02 — la mudanza:
   "□"  a taped moving box. The office opens MID-MOVE (owner: "for the move it should
        be mid"), and the only crate the engine had is El Mercado's produce crate — a
        tomato, a chile and a banana, which read as groceries. This one is cardboard:
        a taped cross over the seam and a label. One glyph, two silhouettes by tile
        parity (the engine's own idiom): even tiles a single box, odd tiles a shorter
        box with a smaller carton on top, so a stack never looks stamped. Solid, low
        (lift 5, like the crate) so it never blocks the view. No floor and no drop
        shadow here — the engine paints both under every prop. (Don Güero's spec.)
   ============================================================================ */
const TILEART={
  "|":rc=>{const{sx,sy}=rc;
    /* the wall itself, exactly like "#", so the run has no seam */
    ctx.fillStyle=tc(C.wall);ctx.fillRect(sx,sy,TS,TS);
    ctx.fillStyle=tc(C.wallTop);ctx.fillRect(sx,sy,TS,6);
    /* frame, recessed */
    ctx.fillStyle="#2B2536";ctx.fillRect(sx+4,sy+8,24,19);
    /* the pane: sky (the season's colour), a horizon a third down */
    ctx.fillStyle=art("sky","#A9C6E0");ctx.fillRect(sx+6,sy+10,20,15);
    ctx.fillStyle="#8C8470";ctx.fillRect(sx+6,sy+19,20,6);            /* the back lot */
    ctx.fillStyle="#B8B0A0";ctx.beginPath();                            /* the road out, narrowing north */
    ctx.moveTo(sx+12,sy+25);ctx.lineTo(sx+20,sy+25);ctx.lineTo(sx+17,sy+19);ctx.lineTo(sx+15,sy+19);ctx.closePath();ctx.fill();
    ctx.fillStyle="#C9A96E";ctx.fillRect(sx+6,sy+18.6,20,1);            /* the graded line on the skyline */
    ctx.fillStyle="#5F5A6E";ctx.fillRect(sx+7,sy+16.5,5,2.5);ctx.fillRect(sx+22,sy+15.5,4,3.5); /* two rooftops */
    ctx.fillStyle="#3A3546";ctx.fillRect(sx+24,sy+12,1,7);ctx.fillRect(sx+22.5,sy+13,4,1);       /* a power pole */
    /* mullion: one bar up, one across */
    ctx.fillStyle="#2B2536";ctx.fillRect(sx+15.5,sy+10,1.2,15);ctx.fillRect(sx+6,sy+17,20,1.2);
    /* the sill, overhanging, with its shadow */
    ctx.fillStyle="#8A8296";ctx.fillRect(sx+2,sy+27,28,3);
    ctx.fillStyle="#332C44";ctx.fillRect(sx+2,sy+30,28,1);},
  "□":rc=>{const{sx,sy,x,y}=rc;
    const stacked=((x|0)+(y|0))%2===1,t=stacked?4:0; /* odd tiles: a shorter box with a carton on top */
    ctx.fillStyle="#C8A277";ctx.fillRect(sx+4,sy+11+t,24,17-t);            /* the box */
    ctx.fillStyle="#A8814F";ctx.fillRect(sx+24,sy+11+t,4,17-t);            /* one corner turns, so it is a box not a card */
    ctx.fillStyle="#D8B589";ctx.fillRect(sx+4,sy+8+t,11,4);ctx.fillRect(sx+17,sy+8+t,11,4); /* two flaps; the gap is the seam */
    ctx.fillStyle="#EDE4D2";ctx.fillRect(sx+14.5,sy+7+t,3,9);ctx.fillRect(sx+4,sy+9.5+t,24,2.5); /* the taped cross — the whole read */
    ctx.fillStyle="#F6F2E8";ctx.fillRect(sx+8,sy+17+t,10,7-(stacked?1:0));  /* the label */
    ctx.fillStyle="#6B5B45";ctx.fillRect(sx+9,sy+19+t,8,1);ctx.fillRect(sx+9,sy+21+t,5,1); /* writing */
    if(stacked){ctx.fillStyle="#D0AC7C";ctx.fillRect(sx+7,sy+4,16,11);      /* the carton on top, one pixel off square */
      ctx.fillStyle="#B08E5E";ctx.fillRect(sx+7,sy+7.5,16,1.6);
      ctx.fillStyle="#EDE4D2";ctx.fillRect(sx+14,sy+4,2.5,7);}}
};
/* ---------- the four parcels, 2026-09-02 (Don Güero's plan; art per his notes) ----------
   "=" taller facade · "%" roll-up door · "6" Tacho's Caprice · "7" two-post lift with a car
   up · "8" red tool chest · "0" tire stack · "i" painted bay stripe (walkable) · "&" bakery
   facade · "!" cleaning-company facade · "▣" deck oven · "▯" file cabinet · "⊔" guest chair
   · "○" dog bed. Props are drawn from the front (they stand up as cutouts), so the same
   drawing serves as the side view. Every one goes through node test/tilesheet.js. */
const TILE_PROPS={
  "6":rc=>{const{sx,sy}=rc; /* Tacho's Caprice: a long burgundy sedan */
    ctx.fillStyle="#5E2222";ctx.fillRect(sx+8,sy+7,16,8);                    /* cabin */
    ctx.fillStyle="#BFD3E0";ctx.fillRect(sx+10,sy+8,5,6);ctx.fillRect(sx+17,sy+8,5,6); /* windows */
    ctx.fillStyle="#7A2E2E";ctx.fillRect(sx+2,sy+14,28,10);                   /* body */
    ctx.fillStyle="#C9CDD3";ctx.fillRect(sx+2,sy+22,28,1.5);                  /* chrome */
    ctx.fillStyle="#1E1E22";[8,24].forEach(px=>{ctx.beginPath();ctx.arc(sx+px,sy+25,4,0,7);ctx.fill();});
    ctx.fillStyle="#8E8E96";[8,24].forEach(px=>{ctx.beginPath();ctx.arc(sx+px,sy+25,1.6,0,7);ctx.fill();});},
  "7":rc=>{const{sx,sy}=rc; /* a two-post lift with a car up on it */
    ctx.fillStyle="#5A6470";ctx.fillRect(sx+5,sy+3,3,27);ctx.fillRect(sx+24,sy+3,3,27);ctx.fillRect(sx+5,sy+3,22,2);
    ctx.fillStyle="#8E98A3";ctx.fillRect(sx+8,sy+15,16,2);                    /* the arms */
    ctx.fillStyle="#3C5C8A";ctx.fillRect(sx+8,sy+9,16,6);ctx.fillStyle="#2C4468";ctx.fillRect(sx+11,sy+5,10,4);
    ctx.fillStyle="#BFD3E0";ctx.fillRect(sx+12,sy+6,3,3);ctx.fillRect(sx+17,sy+6,3,3);
    ctx.fillStyle="#1E1E22";[11,21].forEach(px=>{ctx.beginPath();ctx.arc(sx+px,sy+15,2.4,0,7);ctx.fill();});},
  "8":rc=>{const{sx,sy}=rc; /* the red rolling tool chest */
    ctx.fillStyle="#B3352B";ctx.fillRect(sx+5,sy+8,22,20);
    ctx.fillStyle="#7A1F17";for(let i=0;i<4;i++)ctx.fillRect(sx+5,sy+12+i*4,22,1);
    ctx.fillStyle="#C9CDD3";for(let i=0;i<4;i++)ctx.fillRect(sx+13,sy+9.5+i*4,6,1.4);
    ctx.fillStyle="#1E1E22";[8,24].forEach(px=>{ctx.beginPath();ctx.arc(sx+px,sy+29,2,0,7);ctx.fill();});
    ctx.fillStyle="#8E8E96";ctx.save();ctx.translate(sx+16,sy+6);ctx.rotate(-0.5);ctx.fillRect(-7,-1,14,2);ctx.restore();},
  "0":rc=>{const{sx,sy}=rc; /* a tire stack: a zero IS a tire */
    [24,17,10].forEach(py=>{ctx.fillStyle="#2E2E33";ctx.beginPath();ctx.ellipse(sx+16,sy+py,11,4.5,0,0,7);ctx.fill();
      ctx.fillStyle="#6B6B72";ctx.beginPath();ctx.ellipse(sx+16,sy+py-0.5,5,2,0,0,7);ctx.fill();});},
  "▣":rc=>{const{sx,sy}=rc; /* the deck oven */
    ctx.fillStyle="#4A4F57";ctx.fillRect(sx+3,sy+5,26,25);
    [10,19].forEach(py=>{ctx.fillStyle="#2A2E35";ctx.fillRect(sx+5,sy+py,22,7);
      ctx.fillStyle="#E8A24A";ctx.fillRect(sx+7,sy+py+2,18,2);ctx.fillStyle="#AEB6BE";ctx.fillRect(sx+7,sy+py+6,18,1);});},
  "▯":rc=>{const{sx,sy}=rc; /* the steel file cabinet, one drawer open */
    ctx.fillStyle="#7C8590";ctx.fillRect(sx+7,sy+4,18,26);
    ctx.fillStyle="#8E98A3";ctx.fillRect(sx+9,sy+9,14,9);ctx.fillRect(sx+9,sy+19,14,9);
    ctx.fillStyle="#E8D6B0";ctx.fillRect(sx+10,sy+7,12,3);                   /* folders peeking from the open drawer */
    ctx.fillStyle="#3A3F46";ctx.fillRect(sx+13,sy+13,6,1.5);ctx.fillRect(sx+13,sy+23,6,1.5);},
  "⊔":rc=>{const{sx,sy}=rc; /* a guest chair */
    ctx.fillStyle="#6E5334";ctx.fillRect(sx+7,sy+9,18,4);ctx.fillRect(sx+7,sy+9,3,8);ctx.fillRect(sx+22,sy+9,3,8);
    ctx.fillStyle="#8A6F4D";ctx.fillRect(sx+7,sy+16,18,6);
    ctx.fillStyle="#5E3B20";ctx.fillRect(sx+8,sy+22,3,8);ctx.fillRect(sx+21,sy+22,3,8);},
  /* the trolley stop. It lived in the engine, where its drawing spelled MQT — a pack name in
     engine code, which is the one thing the portability law forbids. Moved here 2026-09-04. */
  "Y":rc=>{const{sx,sy,x,y}=rc; /* trolley stop: pole + sign + bench — the town's transit spine */
      ctx.fillStyle="#3B3F45";ctx.fillRect(sx+6,sy+5,3,22);
      ctx.fillStyle="#C0392B";ctx.fillRect(sx+2,sy+2,15,9);
      ctx.strokeStyle="rgba(15,12,20,.4)";ctx.lineWidth=1;ctx.strokeRect(sx+2,sy+2,15,9);
      ctx.fillStyle="#F2E8D8";ctx.font="700 7px monospace";ctx.fillText("MQT",sx+4,sy+9);
      ctx.fillStyle="#8A6B3F";ctx.fillRect(sx+14,sy+21,15,3);
      ctx.fillRect(sx+15,sy+24,2,5);ctx.fillRect(sx+26,sy+24,2,5);},
  "○":rc=>{const{sx,sy}=rc; /* the dog bed */
    ctx.fillStyle="#7A5C8A";ctx.beginPath();ctx.ellipse(sx+16,sy+21,13,7,0,0,7);ctx.fill();
    ctx.fillStyle="#9A7CAA";ctx.beginPath();ctx.ellipse(sx+16,sy+21,9,4,0,0,7);ctx.fill();
    ctx.fillStyle="#F4F1EA";ctx.fillRect(sx+12,sy+20,8,2);[12,20].forEach(px=>{ctx.beginPath();ctx.arc(sx+px,sy+21,1.6,0,7);ctx.fill();});}
};
Object.assign(TILEART,TILE_PROPS,{
  "=":rc=>{const{sx,sy}=rc; /* taller facade: painted block, two slit windows, a red band */
    ctx.fillStyle=tc("#6E6A73");ctx.fillRect(sx,sy,TS,TS);ctx.fillStyle=tc("#5A5762");ctx.fillRect(sx,sy,TS,5);
    drawPanes(ctx,"=",sx,sy);                     /* two real slit windows, from TILES["="].win — they were two flat dark rectangles */
    ctx.fillStyle="#B3352B";ctx.fillRect(sx,sy+20,TS,4);},
  "%":rc=>{const{sx,sy}=rc; /* the roll-up door, half open */
    ctx.fillStyle="#3A3F46";ctx.fillRect(sx,sy,TS,TS);
    ctx.fillStyle="#8E98A3";ctx.fillRect(sx+2,sy,TS-4,20);
    ctx.fillStyle="#7C8590";for(let i=0;i<5;i++)ctx.fillRect(sx+2,sy+2+i*4,TS-4,1.2);
    ctx.fillStyle="#1E2126";ctx.fillRect(sx+2,sy+20,TS-4,12);                  /* the dark gap under it */
    ctx.fillStyle="#E0B45C";ctx.fillRect(sx+2,sy+19,TS-4,1.5);},
  "i":rc=>{const{sx,sy}=rc; /* a painted bay stripe on concrete — walkable */
    ctx.fillStyle="#E0B45C";ctx.fillRect(sx+4,sy+14,24,3);ctx.fillRect(sx+6,sy+9,2,5);ctx.fillRect(sx+24,sy+9,2,5);},
  "&":rc=>{const{sx,sy}=rc; /* bakery facade: cream front, striped awning, a round window with three conchas */
    ctx.fillStyle=tc("#F2E8D8");ctx.fillRect(sx,sy,TS,TS);ctx.fillStyle=tc("#D9A441");ctx.fillRect(sx,sy,TS,5);
    for(let i=0;i<8;i++){ctx.fillStyle=i%2?"#F2E8D8":"#D9A441";ctx.fillRect(sx+i*4,sy+9,4,4);}
    ctx.fillStyle="#8F6440";ctx.beginPath();ctx.arc(sx+16,sy+21,8.5,0,7);ctx.fill();
    ctx.fillStyle="#F8F0E0";ctx.beginPath();ctx.arc(sx+16,sy+21,7,0,7);ctx.fill();
    [["#D9A441",11,21],["#C98A2D",16,19],["#E8B85A",21,21]].forEach(c=>{ctx.fillStyle=c[0];ctx.beginPath();ctx.arc(sx+c[1],sy+c[2],2.6,0,7);ctx.fill();});},
  "!":rc=>{const{sx,sy}=rc; /* cleaning-company facade: white front, a sign band, a wide window with a mop and bucket */
    ctx.fillStyle=tc("#F4F1EA");ctx.fillRect(sx,sy,TS,TS);ctx.fillStyle=tc("#3FA3A0");ctx.fillRect(sx,sy,TS,5);ctx.fillRect(sx,sy+6,TS,4);
    ctx.fillStyle="#CFE9E8";ctx.fillRect(sx+5,sy+12,22,14);
    ctx.fillStyle="#3FA3A0";ctx.fillRect(sx+9,sy+19,7,5);ctx.fillRect(sx+20,sy+13,1.5,9);ctx.fillRect(sx+17,sy+21,8,3);
    drawPanes(ctx,"!",sx,sy,{glass:false});}
    /* "&" is deliberately NOT here: the bakery's window is a round ojo de buey, and a round window
       has no sill. Its `win` rect exists so the dusk lighting has something to warm. */
});
/* ---- the office wall: blank paper, and the paper that earned its place ----
   Both are WALL tiles like the window, so the 3D camera paints them on the wall face.
   `▭` hangs from day one and says nothing (owner's call, 2026-09-03: "blank paper,
   unlabelled"); a district's ribbon swaps it for `▤` when its document exists. */
TILEART["▭"]=rc=>{const{sx,sy}=rc;
  ctx.fillStyle=C.wall;ctx.fillRect(sx,sy,32,32);
  ctx.fillStyle="rgba(0,0,0,.22)";ctx.fillRect(sx+9,sy+8,15,19);
  ctx.fillStyle="#EFE7D2";ctx.fillRect(sx+8,sy+7,15,19);
  ctx.fillStyle="#DCD2B8";ctx.fillRect(sx+8,sy+7,15,2);};
TILEART["▤"]=rc=>{const{sx,sy}=rc;
  ctx.fillStyle=C.wall;ctx.fillRect(sx,sy,32,32);
  /* three sheets, stapled, the top one square to the wall */
  ctx.fillStyle="rgba(0,0,0,.25)";ctx.fillRect(sx+9,sy+7,16,20);
  ctx.fillStyle="#E4DAC0";ctx.fillRect(sx+7,sy+6,16,20);
  ctx.fillStyle="#EFE7D2";ctx.fillRect(sx+8,sy+5,16,20);
  ctx.fillStyle="#F7F2E4";ctx.fillRect(sx+8,sy+4,15,20);
  ctx.fillStyle="#2E5FA8";ctx.fillRect(sx+10,sy+6,11,2);            /* the header bar */
  ctx.fillStyle="#9A9384";                                           /* lines of type */
  [10,13,16,19].forEach((r,i)=>ctx.fillRect(sx+10,sy+r-0.5,(i%2?8:11),1));
  ctx.fillStyle="#C0392B";ctx.fillRect(sx+16,sy+19,5,3);             /* the stamp */
  ctx.fillStyle="#9AA1A8";ctx.fillRect(sx+9,sy+5,4,1.6);};           /* the staple */

/* ================================================================================================
   THE RUG, THE CRATE AND THE COUNTER — docs/BEAUTIFY.md's build order, items 1 and 2.

   All three are PACK art. The engine's own drawings for R, H and I stay where they are and every
   world that is not Meridian keeps them; this file overrides them for this pack only, which is why
   none of this bumps GAMEV and none of it can change what another world draws.

   What was wrong with each, in the words of the audit:
   · R — "four blank lavender squares, no thickness, no border, visible seam". The seam was literal:
     the engine drew `fillRect(sx+2,sy+2,TS-4,TS-4)`, so two rug tiles side by side left four pixels
     of floor showing between them and the rug read as a texture that failed to load.
   · H — "cutout, no side drawing" on the most box-shaped object in the game.
   · I — "cutout, four identical pictures in a row", so a counter run read as four counters.
   ============================================================================================== */

/* ---- THE RUG. ONE RUG, NOT FOUR SQUARES. ----
   A rug is one object that happens to cover several tiles, so the drawing asks its neighbours what
   they are and only puts a border where the rug actually ENDS. The weave is keyed on the tile's
   absolute position, never on sx/sy, so the pattern runs straight through the joins instead of
   restarting in every square — that restart is what makes tiled art read as tiles.
   Colour is derived from C.rug and passed through tc(), so a theme still repaints it exactly as it
   repainted the flat square. */
TILEART["R"]=rc=>{const{sx,sy,x,y}=rc;
  const w=CW(),rug=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return !!r&&r[gx]==="R";};
  const N=!rug(x,y-1),S=!rug(x,y+1),E=!rug(x+1,y),Wt=!rug(x-1,y);
  const field=tc(C.rug),
        deep =tc(mixHex(C.rug,"#2B2536",0.38)),      /* the border band */
        mid  =tc(mixHex(C.rug,"#2B2536",0.16)),      /* the weave, one step down */
        pale =tc(mixHex(C.rug,"#FFF6E4",0.34)),      /* the keyline, and the lit side of the pile */
        warm =tc(mixHex(C.rug,"#B0563A",0.34));      /* the motif — a wool rug is dyed, not printed */
  ctx.fillStyle=field;ctx.fillRect(sx,sy,TS,TS);     /* EDGE TO EDGE. The inset WAS the seam. */

  /* THE WEAVE, AND WHY IT IS NOT A GRID. The first pass ruled a tick every second pixel in both
     directions and the rug came back reading as graph paper: a regular lattice is what a TEXTURE
     looks like, and the fault being fixed was the rug reading as a texture. Wool is a warp you can
     see and a weft you can only half see, so the warp runs as broken pile in one direction only and
     the weft is a short dash that skips — which at 32 px is the difference between cloth and paper.
     Keyed on the tile's absolute position, never on sx/sy, so it runs straight through the joins. */
  const gx0=x*TS,gy0=y*TS;
  ctx.fillStyle=mid;
  for(let j=0;j<TS;j++){const ay=gy0+j;if(ay%3===0)for(let i=((ay>>1)+gx0)%3;i<TS;i+=6)
    ctx.fillRect(sx+i,sy+j,3,1);}                                   /* the weft, skipping */
  ctx.fillStyle="rgba(255,255,255,.07)";
  for(let i=0;i<TS;i++){if((gx0+i)%4===1)ctx.fillRect(sx+i,sy,1,TS);} /* the warp, only just there */
  /* the motif: a dyed diamond on every second tile of the run, on the absolute grid, so a run
     carries a repeat and one lone rug tile still carries one diamond. Wool takes dye — the audit's
     complaint was that the rug had no pattern, and a pattern you have to hunt for is no pattern. */
  if(((x+y)&1)===0){
    ctx.fillStyle=warm;
    ctx.beginPath();ctx.moveTo(sx+16,sy+6);ctx.lineTo(sx+26,sy+16);
    ctx.lineTo(sx+16,sy+26);ctx.lineTo(sx+6,sy+16);ctx.closePath();ctx.fill();
    ctx.fillStyle=deep;
    ctx.beginPath();ctx.moveTo(sx+16,sy+10);ctx.lineTo(sx+22,sy+16);
    ctx.lineTo(sx+16,sy+22);ctx.lineTo(sx+10,sy+16);ctx.closePath();ctx.fill();
    ctx.fillStyle=pale;
    ctx.beginPath();ctx.moveTo(sx+16,sy+13);ctx.lineTo(sx+19,sy+16);
    ctx.lineTo(sx+16,sy+19);ctx.lineTo(sx+13,sy+16);ctx.closePath();ctx.fill();}

  /* ---- the edge. Border band, keyline inside it, and a fringe on the two ends that are open. ---- */
  const B=3.5;
  ctx.fillStyle=deep;
  if(N)ctx.fillRect(sx,sy,TS,B);             if(S)ctx.fillRect(sx,sy+TS-B,TS,B);
  if(Wt)ctx.fillRect(sx,sy,B,TS);            if(E)ctx.fillRect(sx+TS-B,sy,B,TS);
  ctx.fillStyle=pale;
  if(N)ctx.fillRect(sx,sy+B,TS,1);           if(S)ctx.fillRect(sx,sy+TS-B-1,TS,1);
  if(Wt)ctx.fillRect(sx+B,sy,1,TS);          if(E)ctx.fillRect(sx+TS-B-1,sy,1,TS);
  /* THICKNESS. A rug is a few millimetres thick and the audit's word was "no thickness": the key is
     upper-left, so the lit edge goes on the north and west and the shade on the south and east. */
  ctx.fillStyle="rgba(255,255,255,.20)";
  if(N)ctx.fillRect(sx,sy,TS,1);             if(Wt)ctx.fillRect(sx,sy,1,TS);
  ctx.fillStyle="rgba(20,16,28,.26)";
  if(S)ctx.fillRect(sx,sy+TS-1,TS,1);        if(E)ctx.fillRect(sx+TS-1,sy,1,TS);
  /* fringe, on the open north and south ends only — the thing that says wool and not lino */
  ctx.fillStyle=pale;
  if(N)for(let i=2;i<TS-1;i+=3)ctx.fillRect(sx+i,sy,1,2);
  if(S)for(let i=2;i<TS-1;i+=3)ctx.fillRect(sx+i,sy+TS-2,1,2);
};

/* ---- THE PRODUCE CRATE. It is a box, so it stands as one. ----
   TILEMETA below marks it box:true and TILEART_SIDE gives it the front the box wears on all four
   faces; engine3d.js:259 needs BOTH or it stays a cutout. Top-down it keeps the engine's fruit — the
   quarrel was never with the tomato — and gains the rim, the slats and the inside wall that make the
   fruit sit IN something. Two silhouettes by tile parity, the engine's own idiom, so eight crates in
   a row are not one crate stamped eight times. */
TILEART["H"]=rc=>{const{sx,sy,x,y}=rc;const alt=(((x*3+y*5)%7)+7)%7;
  ctx.fillStyle="#7A5B36";ctx.fillRect(sx+2,sy+8,TS-4,TS-11);            /* the crate, from above */
  ctx.fillStyle="#9A7548";ctx.fillRect(sx+3,sy+9,TS-6,TS-13);            /* the inside wall, lit */
  ctx.fillStyle="#5E4527";ctx.fillRect(sx+4,sy+13,TS-8,TS-18);           /* the shadowed well */
  ctx.fillStyle="#B0895B";ctx.fillRect(sx+2,sy+8,TS-4,2.6);              /* the near rim, catching the key */
  ctx.fillStyle="rgba(255,255,255,.22)";ctx.fillRect(sx+2,sy+8,TS-4,1);
  ctx.fillStyle="#8B6A42";ctx.fillRect(sx+2,sy+TS-5,TS-4,2.2);           /* the far rim, in its own shade */
  ctx.fillStyle="#6B4F2E";ctx.fillRect(sx+2,sy+8,1.6,TS-11);ctx.fillRect(sx+TS-3.6,sy+8,1.6,TS-11);
  const F=alt<3?[[10,13,"tomato"],[17,11,"chile"],[23,14,"banana"]]
         :alt<5?[[11,12,"chile"],[18,14,"tomato"],[24,12,"tomato"]]
               :[[10,14,"banana"],[16,11,"tomato"],[22,13,"chile"]];
  F.forEach(f=>produce(sx+f[0],sy+f[1],f[2],1.3));
  ctx.fillStyle="rgba(20,14,8,.22)";ctx.fillRect(sx+4,sy+13,TS-8,1.4);   /* the rim's shadow on the fruit */
};

/* ---- THE SHOP COUNTER. Four tiles, ONE counter. ----
   The audit's words were "four identical pictures in a row", and the fix is the same as the rug's:
   ask the neighbours. The top is continuous across the run and only the two ENDS get a cap, the
   plank joins fall on the absolute grid so they do not restart in each tile, and the scale — the one
   object that must not appear four times — stands on the leftmost tile of the run and nowhere else. */
TILEART["I"]=rc=>{const{sx,sy,x,y}=rc;
  const w=CW(),cnt=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return !!r&&r[gx]==="I";};
  const Wt=!cnt(x-1,y),E=!cnt(x+1,y),head=Wt;                  /* the scale stands at the run's head */
  ctx.fillStyle="#8B6A42";ctx.fillRect(sx,sy+6,TS,TS-10);                /* the carcase */
  ctx.fillStyle="#A8825A";ctx.fillRect(sx,sy+6,TS,TS-13);                /* the top, lit */
  ctx.fillStyle="rgba(255,255,255,.16)";ctx.fillRect(sx,sy+6,TS,1.2);    /* the worn front edge */
  ctx.fillStyle="rgba(28,18,8,.30)";ctx.fillRect(sx,sy+TS-5,TS,1.4);     /* and the shade under the back */
  ctx.fillStyle="rgba(94,69,39,.55)";                                    /* plank joins, on the world grid */
  for(let gx=x*TS;gx<x*TS+TS;gx++)if(gx%11===0)ctx.fillRect(sx+(gx-x*TS),sy+6,1,TS-13);
  ctx.fillStyle="#6B4F2E";                                               /* END CAPS, and only there */
  if(Wt)ctx.fillRect(sx,sy+6,1.8,TS-10);
  if(E)ctx.fillRect(sx+TS-1.8,sy+6,1.8,TS-10);
  if(head){                                                              /* the scale — ONCE per run */
    ctx.fillStyle="rgba(20,16,10,.26)";ctx.beginPath();
    ctx.ellipse(sx+16,sy+21,8,2.4,0,0,7);ctx.fill();                     /* it sits ON the counter */
    ctx.fillStyle="#5F676F";ctx.fillRect(sx+15,sy+13,2,7);               /* post */
    ctx.fillStyle="#C9CDD2";ctx.fillRect(sx+9,sy+19,14,2.5);             /* tray */
    ctx.fillStyle="rgba(255,255,255,.35)";ctx.fillRect(sx+9,sy+19,14,1);
    ctx.fillStyle="#EEF0F2";ctx.beginPath();ctx.arc(sx+16,sy+10,4.4,0,7);ctx.fill();   /* dial */
    ctx.strokeStyle="#5F676F";ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx+16,sy+10,4.4,0,7);ctx.stroke();
    ctx.fillStyle="#C0392B";ctx.fillRect(sx+16,sy+7.4,1,3);              /* the needle, reading something */
    produce(sx+16,sy+17,"tomato",1.15);}
};

/* ---- THE STAIRWELL DIVIDER IS GLASS (owner, 2026-09-16) ----
   "the stairs appear on the other side of this wall... looks abstract artish but clearly
   fucked up stairs - want to spicy it up and make it a glass divider."

   THE INTERESTING PART IS THAT SEEING THE STAIRS THROUGH IT IS NOT A BUG. The engine's own rail
   is knee-high and see-through on purpose, so a flight below stays visible — that is correct, and
   it is why the stairs read "on the other side". What was wrong is that a timber rail with four
   balusters gives the eye a picket fence and then a stepped grey mass behind it, and at this size
   those two readings fight: the stairs come out as abstract slabs because nothing frames them.

   Glass does the same job and admits it. A full-height pane says LOOK THROUGH ME, the steel cap
   says WHERE THE EDGE IS, and the flight behind stops being an accident of transparency and
   becomes the thing on show. Same tile, same solidity, same lift — this is PACK ART, so the
   engine's own rail is untouched and every other world keeps the timber one.

   The pane is drawn with the light model this project already uses: one warm key upper-left, so a
   glass sheet takes a bright streak across the top corner and a cool sky tone down the shadow
   side, and the steel cap is the same stainless the kitchen uses (#B9BCC0, Δ106 from the room's
   own browns, which is why it reads at a glance). */
const GLASSCAP="#B9BCC0", GLASSCAPL="#D4D8DC", GLASSPOST="#5F676F";
TILEART["◺"]=rc=>{const{sx,sy}=rc;      /* from above: the cap rail, and the pane's own thin line */
  ctx.fillStyle="rgba(150,190,205,.22)";ctx.fillRect(sx,sy+10,TS,7);   /* the pane, edge on */
  ctx.fillStyle=GLASSPOST;[2,15,28].forEach(px=>ctx.fillRect(sx+px,sy+10,2.5,7));
  ctx.fillStyle=GLASSCAP;ctx.fillRect(sx,sy+12,TS,3.2);
  ctx.fillStyle=GLASSCAPL;ctx.fillRect(sx,sy+12,TS,1.2);
  ctx.fillStyle="rgba(20,16,28,.26)";ctx.fillRect(sx,sy+15.2,TS,1);};  /* its shade on the floor */
TILEART_SIDE_GLASS=rc=>{const{sx,sy}=rc; /* in elevation: a pane you see the flight through */
  const top=sy+6, bot=sy+30;
  ctx.fillStyle="rgba(10,8,14,.20)";ctx.fillRect(sx,bot-1,TS,2);        /* it meets the floor */
  ctx.fillStyle="rgba(158,196,210,.15)";ctx.fillRect(sx,top+3,TS,bot-top-3);
  /* the key catches the sheet: one broad streak across the upper corner, one thin one under it */
  ctx.save();ctx.beginPath();ctx.rect(sx,top+3,TS,bot-top-3);ctx.clip();
  ctx.fillStyle="rgba(255,252,240,.20)";
  ctx.beginPath();ctx.moveTo(sx-6,bot);ctx.lineTo(sx+13,top);ctx.lineTo(sx+20,top);
  ctx.lineTo(sx+1,bot);ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(255,252,240,.12)";
  ctx.beginPath();ctx.moveTo(sx+16,bot);ctx.lineTo(sx+27,top);ctx.lineTo(sx+30,top);
  ctx.lineTo(sx+19,bot);ctx.closePath();ctx.fill();
  ctx.restore();
  ctx.fillStyle=GLASSPOST;[1.5,15,28].forEach(px=>ctx.fillRect(sx+px,top+2,2.4,bot-top-2));
  ctx.fillStyle="rgba(255,255,255,.22)";[1.5,15,28].forEach(px=>ctx.fillRect(sx+px,top+2,.9,bot-top-2));
  ctx.fillStyle=GLASSCAP;ctx.fillRect(sx,top,TS,4);                     /* the steel cap rail */
  ctx.fillStyle=GLASSCAPL;ctx.fillRect(sx,top,TS,1.4);
  ctx.fillStyle="rgba(20,16,28,.34)";ctx.fillRect(sx,top+4,TS,1.2);     /* its own shadow on the pane */
};

const TILEART_SIDE=Object.assign({},TILE_PROPS);
TILEART_SIDE["Y"]=rc=>{const{sx,sy}=rc; /* THE TROLLEY STOP, STANDING. It was walkable with no TILES
      row and no profile, so the front camera and the 3D ground bake painted its top-down art flat
      onto the pavement — owner, 2026-09-04: "the bus stop is also just a painting on the floor."
      Same bug class as the stairs, same fix: a `stand` tile with a side view. What makes a stop
      read as TRANSIT and not as a lamp post is the sign held out ACROSS the pole, at head height,
      with a bench under it. */
  ctx.fillStyle="rgba(15,12,20,.18)";                                        /* CONTACT SHADOW — plants pole and bench on the pavement */
  ctx.beginPath();ctx.ellipse(sx+17,sy+30.2,13,2.1,0,0,7);ctx.fill();
  ctx.fillStyle="#6E5334";ctx.fillRect(sx+17,sy+23,2,7);ctx.fillRect(sx+27.5,sy+23,2,7); /* BENCH LEGS */
  ctx.fillStyle="#7A5C36";ctx.fillRect(sx+16.5,sy+15,1.8,7);ctx.fillRect(sx+28,sy+15,1.8,7); /* back uprights */
  ctx.fillStyle="#8A6B3F";ctx.fillRect(sx+16,sy+16,14,2.2);                  /* BACK RAIL */
  ctx.fillStyle="#8A6B3F";ctx.fillRect(sx+15,sy+21,15.5,2.6);                /* SEAT SLAT */
  ctx.fillStyle="rgba(255,255,255,.16)";ctx.fillRect(sx+15,sy+21,15.5,1);    /* the sun catches the seat edge — key light upper-left */
  ctx.fillStyle="rgba(15,12,20,.30)";ctx.fillRect(sx+15,sy+23.2,15.5,1);     /* shadow under the seat, so it is a plank and not a stripe */
  ctx.fillStyle="#3B3F45";ctx.fillRect(sx+8,sy+4,3.2,26);                    /* POLE */
  ctx.fillStyle="rgba(255,255,255,.18)";ctx.fillRect(sx+8,sy+4,1,26);        /* its lit edge */
  ctx.fillStyle="#2A2D33";ctx.fillRect(sx+6.5,sy+28.8,6,1.8);                /* the base plate it is bolted to */
  ctx.fillStyle="#2A2D33";ctx.fillRect(sx+2,sy+2,19,11.5);                   /* SIGN BACKING — gives the board thickness */
  ctx.fillStyle="#C0392B";ctx.fillRect(sx+2.6,sy+2.6,17.8,10.3);
  ctx.fillStyle="rgba(255,255,255,.14)";ctx.fillRect(sx+2.6,sy+2.6,17.8,1.2);
  ctx.fillStyle="#F2E8D8";ctx.font="700 7px monospace";ctx.fillText("MQT",sx+5,sy+10);
};
TILEART_SIDE["◺"]=TILEART_SIDE_GLASS;   /* the divider stands as glass in every camera that sees it stand */
TILEART_SIDE["□"]=TILEART["□"]; /* cardboard and tape read the same from the side — it stands as a real box in 3D */ /* the props stand up wearing the same drawing */

/* ---- THE CRATE AND THE COUNTER, STANDING. ----
   engine3d.js:259 makes a tile a BOX only if it is marked box:true AND the pack drew it a side; with
   one and not the other it stays a cutout, which is the state both of these were in. Drawn to the
   same light as everything else on this street: key upper-left, one contact shadow, the lit edge on
   the north and west and the shade on the south and east. */
TILEART_SIDE["H"]=rc=>{const{sx,sy,x,y}=rc;const alt=(((x*3+y*5)%7)+7)%7;
  ctx.fillStyle="rgba(15,12,20,.20)";ctx.beginPath();
  ctx.ellipse(sx+16,sy+30.4,12,2,0,0,7);ctx.fill();                      /* it stands on the floor */
  ctx.fillStyle="#8B6A42";ctx.fillRect(sx+3,sy+12,TS-6,18);              /* the body */
  ctx.fillStyle="#6B4F2E";ctx.fillRect(sx+3,sy+12,2.6,18);ctx.fillRect(sx+TS-5.6,sy+12,2.6,18); /* corner posts */
  ctx.fillStyle="#A87F4F";                                               /* three slats, gaps between */
  [14.5,20,25.5].forEach(t=>ctx.fillRect(sx+5.6,sy+t,TS-11.2,3.6));
  ctx.fillStyle="rgba(255,255,255,.18)";
  [14.5,20,25.5].forEach(t=>ctx.fillRect(sx+5.6,sy+t,TS-11.2,1));        /* each slat's lit top edge */
  ctx.fillStyle="rgba(20,14,8,.34)";
  [14.5,20,25.5].forEach(t=>ctx.fillRect(sx+5.6,sy+t+3.6,TS-11.2,0.9));  /* and the shade under it */
  ctx.fillStyle="#B0895B";ctx.fillRect(sx+2,sy+10,TS-4,2.6);             /* the top rim, in front */
  ctx.fillStyle="rgba(255,255,255,.24)";ctx.fillRect(sx+2,sy+10,TS-4,1);
  const F=alt<3?[[10,8,"tomato"],[17,6,"chile"],[23,9,"banana"]]         /* produce over the rim */
         :alt<5?[[11,7,"chile"],[18,9,"tomato"],[24,7,"tomato"]]
               :[[10,9,"banana"],[16,6,"tomato"],[22,8,"chile"]];
  F.forEach(f=>produce(sx+f[0],sy+f[1],f[2],1.3));
};
TILEART_SIDE["I"]=rc=>{const{sx,sy,x,y}=rc;
  const w=CW(),cnt=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return !!r&&r[gx]==="I";};
  const Wt=!cnt(x-1,y),E=!cnt(x+1,y),head=Wt;
  ctx.fillStyle="rgba(15,12,20,.20)";ctx.fillRect(sx,sy+29.6,TS,2);      /* it meets the floor in a line,
                                                                            not an ellipse — it is a run */
  ctx.fillStyle="#8B6A42";ctx.fillRect(sx,sy+13,TS,17);                  /* the front */
  ctx.fillStyle="#7A5B36";ctx.fillRect(sx,sy+26,TS,4);                   /* the kick, set back in shade */
  ctx.fillStyle="#A8825A";ctx.fillRect(sx,sy+11,TS,2.4);                 /* the worked top, seen edge-on */
  ctx.fillStyle="rgba(255,255,255,.22)";ctx.fillRect(sx,sy+11,TS,1);
  ctx.fillStyle="rgba(28,18,8,.32)";ctx.fillRect(sx,sy+13.4,TS,1);       /* the line under the top */
  ctx.fillStyle="rgba(94,69,39,.55)";                                    /* one panel line per tile, on
                                                                            the world grid so it runs */
  for(let gx=x*TS;gx<x*TS+TS;gx++)if(gx%11===0)ctx.fillRect(sx+(gx-x*TS),sy+15,1,10);
  ctx.fillStyle="#6B4F2E";
  if(Wt)ctx.fillRect(sx,sy+11,1.8,19);
  if(E)ctx.fillRect(sx+TS-1.8,sy+11,1.8,19);
  if(head){                                                              /* the scale, standing, once */
    ctx.fillStyle="#5F676F";ctx.fillRect(sx+15,sy+5,2,6);
    ctx.fillStyle="#C9CDD2";ctx.fillRect(sx+10,sy+9.4,12,2);
    ctx.fillStyle="#EEF0F2";ctx.beginPath();ctx.arc(sx+16,sy+3.4,3.6,0,7);ctx.fill();
    ctx.strokeStyle="#5F676F";ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx+16,sy+3.4,3.6,0,7);ctx.stroke();
    ctx.fillStyle="#C0392B";ctx.fillRect(sx+16,sy+1.4,1,2.4);
    produce(sx+16,sy+8,"tomato",1.1);}
};
/* ---- BEAUTIFY, FIRST SITTING — 2026-09-21. Three drawings, content only. ----
   docs/BEAUTIFY.md, "The contact sheet — 2026-09-21", rows 1–3. Drawn the way .claude/skills/how-its-made says:
   by the process that made the thing, with variation entering at the step it entered and nowhere
   earlier, and lit as everything else on this street — key upper-left, one contact shadow. */

/* THE SHELF, FROM THE FRONT. The engine's own side view stands nine 6×5 blocks in six primaries on a
   3×3 grid, which is a Rubik's cube in every camera that sees it. A shelf is a carcass a joiner made
   (two uprights, boards with a front edge that catches the light and a shadow under it) and then
   what a PERSON put on it: books go on in RUNS — pushed to an upright, spines of one series sharing
   a palette, the last one leaning on the run — with a gap where something was taken out, a stack
   lying flat, a carton on the bottom board. Which shelf has the gap and the stack is decided per
   tile, so a wall of them is a wall of shelves and not one picture repeated. */
TILEART_SIDE["S"]=rc=>{const{sx,sy,x,y}=rc;
  const sd=(((x*7+y*13)%6)+6)%6;
  const FAM=[["#8C3B2E","#A54A3A","#6E2E24"],["#3E5C86","#4F6E9A","#2F4868"],["#7C8F5A","#93A56A","#5E6E44"],
             ["#C9B68C","#D9C9A3","#A99570"],["#5C4A6E","#6E5A84","#463756"],["#B8763A","#C98A4C","#8E5A2C"]];
  ctx.fillStyle="rgba(15,12,20,.20)";ctx.beginPath();ctx.ellipse(sx+16,sy+30.4,13,2,0,0,7);ctx.fill(); /* it stands on the floor */
  ctx.fillStyle="#3F2E1E";ctx.fillRect(sx+2,sy+2,TS-4,28);                                   /* the back panel, in shade */
  ctx.fillStyle="#8A6F4D";ctx.fillRect(sx+2,sy+2,2.4,28);ctx.fillRect(sx+TS-4.4,sy+2,2.4,28); /* uprights */
  ctx.fillRect(sx+2,sy+2,TS-4,2.2);                                                           /* the top board */
  ctx.fillStyle="rgba(255,255,255,.22)";ctx.fillRect(sx+2,sy+2,TS-4,1);ctx.fillRect(sx+2,sy+2,1,28); /* lit north and west edges */
  const BOARD=[11.5,20.5,28];                                                                 /* three boards; the bottom one is the plinth */
  BOARD.forEach(b=>{ctx.fillStyle="#7E6446";ctx.fillRect(sx+4.4,sy+b,TS-8.8,2);
    ctx.fillStyle="rgba(255,255,255,.18)";ctx.fillRect(sx+4.4,sy+b,TS-8.8,0.8);              /* the front edge catches the key */
    ctx.fillStyle="rgba(15,12,20,.35)";ctx.fillRect(sx+4.4,sy+b+2,TS-8.8,0.9);});             /* every inside corner is dark */
  const run=(x0,base,h0,fam,n,lean)=>{let cx=x0;                                             /* spines, bottom on the board, pushed together */
    for(let i=0;i<n;i++){const wd=2+((i*3+sd)%3)*0.6,h=h0-((i*5+sd*3)%3)*0.7;
      ctx.fillStyle=fam[(i+sd)%fam.length];ctx.fillRect(sx+cx,sy+base-h,wd,h);
      ctx.fillStyle="rgba(255,255,255,.14)";ctx.fillRect(sx+cx,sy+base-h,0.7,h);cx+=wd+0.35;}
    if(lean){const h=h0-0.6,wd=2.4;ctx.fillStyle=fam[(n+sd)%fam.length];ctx.beginPath();     /* the last one leans on the run */
      ctx.moveTo(sx+cx,sy+base);ctx.lineTo(sx+cx+wd,sy+base);ctx.lineTo(sx+cx+wd+2.2,sy+base-h);ctx.lineTo(sx+cx+2.2,sy+base-h);ctx.closePath();ctx.fill();cx+=wd+2.4;}
    return cx;};
  const stack=(x0,base,fam,n)=>{for(let i=0;i<n;i++){const wd=7-i*0.8,h=1.6,yy=sy+base-(i+1)*h-i*0.2; /* lying flat: the one underneath is squashed */
    ctx.fillStyle=fam[(i+1)%fam.length];ctx.fillRect(sx+x0+i*0.4,yy,wd,h);
    ctx.fillStyle="rgba(255,255,255,.16)";ctx.fillRect(sx+x0+i*0.4,yy,wd,0.5);}};
  const carton=(x0,base,wd,h)=>{ctx.fillStyle="#B0895B";ctx.fillRect(sx+x0,sy+base-h,wd,h);
    ctx.fillStyle="rgba(255,255,255,.2)";ctx.fillRect(sx+x0,sy+base-h,wd,0.8);
    ctx.fillStyle="rgba(60,40,20,.35)";ctx.fillRect(sx+x0+wd*0.45,sy+base-h,0.8,h);           /* the tape */
    ctx.fillStyle="#F2E8D8";ctx.fillRect(sx+x0+1.2,sy+base-h*0.55,wd*0.4,1.4);};              /* the label */
  const fa=FAM[sd%6],fb=FAM[(sd+2)%6],fc=FAM[(sd+4)%6],fd=FAM[(sd+1)%6];
  if(sd%2===0){                                                                              /* layout one */
    let cx=run(4.8,11.5,6.2,fa,3+(sd%3===0?1:0),true);stack(cx+1.5,11.5,fb,2);
    run(4.8,20.5,6.0,fc,5,true);
    carton(4.8,28,9,4.6);run(15.5,28,4.6,fd,4,false);
  }else{                                                                                     /* layout two: the gap moved */
    run(4.8,11.5,6.2,fb,5,true);
    let cx=run(4.8,20.5,6.0,fa,3,true);stack(cx+1.2,20.5,fc,2);
    run(4.8,28,4.6,fd,3,true);carton(17.6,28,9,4.2);
  }
};

/* GRASS, FROM ABOVE. Three strokes on the pavement read as the letter Λ (docs/BEAUTIFY.md, 09-09).
   A tuft in a plaza is not planted; it GREW, from a seed in a crack, and what a grown thing leaves is
   asymmetry that follows a direction: the blades fan out from one root as a rosette, the ones toward
   the light longer and paler, one or two gone to straw. The crack it came from is still there.
   It stays paint on the floor because that is what a tuft is; standing it up as a sprite would put a
   new flat picture into the 3D scene, and test/engine.smoke.js #39 forbids that on purpose. */
TILEART["g"]=rc=>{const{sx,sy,x,y}=rc;
  const sd=(((x*7+y*13)%8)+8)%8,cx=sx+14+(sd%3)*1.6,cy=sy+16+((sd>>1)%3)*1.4,a0=sd*0.8;
  ctx.strokeStyle="rgba(40,32,28,.45)";ctx.lineWidth=0.9;ctx.lineCap="round";ctx.beginPath(); /* the crack */
  ctx.moveTo(cx-Math.cos(a0)*11,cy-Math.sin(a0)*11);ctx.lineTo(cx-Math.cos(a0)*4,cy-Math.sin(a0)*4+1);ctx.lineTo(cx,cy);
  ctx.lineTo(cx+Math.cos(a0+0.4)*5,cy+Math.sin(a0+0.4)*5);ctx.lineTo(cx+Math.cos(a0+0.2)*10,cy+Math.sin(a0+0.2)*10-1);ctx.stroke();
  ctx.fillStyle="rgba(90,70,45,.28)";ctx.beginPath();ctx.ellipse(cx,cy+0.5,4.5,3.2,0,0,7);ctx.fill(); /* the soil it holds */
  const n=8+(sd%3);
  for(let i=0;i<n;i++){const a=i*(Math.PI*2/n)+sd*0.35+(i%2)*0.18,lit=Math.cos(a+Math.PI*0.75)>0.2;
    const len=5.5+((i*3+sd)%4)*1.3+(lit?1:0);                                                 /* toward the light: longer */
    ctx.strokeStyle=tc(lit?"#8FCB72":"#4E8A58");ctx.lineWidth=i%3===0?1.7:1.3;
    const mx=cx+Math.cos(a)*len*0.5,my=cy+Math.sin(a)*len*0.5;
    const ex=cx+Math.cos(a)*len+Math.cos(a+1.3)*1.6,ey=cy+Math.sin(a)*len+Math.sin(a+1.3)*1.6;   /* the tip curls */
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.quadraticCurveTo(mx,my,ex,ey);ctx.stroke();}
  ctx.strokeStyle=tc("#C9B66E");ctx.lineWidth=1;const ad=sd*0.9+2;                            /* one blade gone to straw */
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.quadraticCurveTo(cx+Math.cos(ad)*3,cy+Math.sin(ad)*3,cx+Math.cos(ad+0.5)*7,cy+Math.sin(ad+0.5)*7);ctx.stroke();
};

/* THE FLOWER BED, AS A RAISED BED. It was paint — a brown square with three dots at 3D distance —
   because the tile was walkable and a walkable tile is baked into the floor. A marigold bed in a
   plaza is not something you walk through: it is a low painted-concrete curb with soil behind it and
   the cempasúchil mounding over the rim. So it is SOLID now (maps.js SOLIDX) and a box (TILEMETA):
   the lid is the bed seen from above, the sides are the curb with the heads over it. The plants are
   the engine's own drawBed, so a season that recolours the bridge's petals recolours these too. */
TILEART["b"]=rc=>{const{sx,sy,x,y}=rc;
  const w=CW(),bed=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return !!r&&r[gx]==="b";};       /* a run of beds shares one curb */
  const N=!bed(x,y-1),S=!bed(x,y+1),E=!bed(x+1,y),Wt=!bed(x-1,y);
  ctx.fillStyle=tc("#5E4630");ctx.fillRect(sx,sy,TS,TS);                                     /* soil, edge to edge: the lid never shows the map colour */
  drawBed(ctx,sx,sy,(((x*7+y*13)%5)+5)%5/5);
  ctx.fillStyle=tc("#B9B0A2");
  if(N)ctx.fillRect(sx,sy,TS,3);if(S)ctx.fillRect(sx,sy+TS-3,TS,3);if(Wt)ctx.fillRect(sx,sy,3,TS);if(E)ctx.fillRect(sx+TS-3,sy,3,TS);
  ctx.fillStyle="rgba(255,255,255,.22)";if(N)ctx.fillRect(sx,sy,TS,1);if(Wt)ctx.fillRect(sx,sy,1,TS);       /* the curb's lit edges */
  ctx.fillStyle="rgba(15,12,20,.28)";if(S)ctx.fillRect(sx,sy+TS-1,TS,1);if(E)ctx.fillRect(sx+TS-1,sy,1,TS);   /* and its shade */
  ctx.fillStyle="rgba(15,12,20,.18)";if(N)ctx.fillRect(sx+3,sy+3,TS-6,1.2);if(Wt)ctx.fillRect(sx+3,sy+3,1.2,TS-6); /* the curb casts onto the soil */
};
TILEART_SIDE["b"]=rc=>{const{sx,sy,x,y}=rc;
  const w=CW(),bed=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return !!r&&r[gx]==="b";};
  const Wt=!bed(x-1,y),E=!bed(x+1,y),sd=(((x*7+y*13)%5)+5)%5;
  const P=petalPal(),UNDER=P[1],BODY=P[3]||P[2],CROWN=P[5]||P[4];
  ctx.fillStyle="rgba(15,12,20,.20)";ctx.fillRect(sx,sy+29.6,TS,2);                          /* it meets the floor in a line — it is a run */
  ctx.fillStyle=tc("#5E4630");ctx.fillRect(sx,sy+19,TS,3);                                   /* the soil behind the curb */
  const heads=[[6,15,3.4],[15,13.5,3.9],[25,15.5,3.2],[11,18,2.4],[21,18.5,2.6]];
  heads.forEach(([hx,hy,r],i)=>{const px=sx+hx+((sd+i)%3-1)*0.8,py=sy+hy+((sd*i)%2)*0.6;
    ctx.strokeStyle=tc("#3E7C4F");ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px,py+r*0.4);ctx.lineTo(px,sy+21);ctx.stroke(); /* the stem, into the soil */
    ctx.fillStyle=UNDER;ctx.beginPath();ctx.ellipse(px,py+r*0.15,r,r*0.8,0,0,7);ctx.fill();                          /* the underside */
    ctx.fillStyle=BODY;ctx.beginPath();ctx.ellipse(px,py-r*0.1,r*0.95,r*0.78,0,0,7);ctx.fill();                      /* the head, wider than tall */
    ctx.fillStyle=CROWN;ctx.beginPath();ctx.ellipse(px-r*0.35,py-r*0.45,r*0.38,r*0.28,0,0,7);ctx.fill();});          /* the crown, where the key lands */
  ctx.fillStyle=tc("#3E7C4F");[[3,19.5],[18,20],[29,19.5]].forEach(([lx,ly])=>{ctx.beginPath();ctx.ellipse(sx+lx,sy+ly,2.2,1.1,-0.4,0,7);ctx.fill();}); /* leaves between */
  ctx.fillStyle=tc("#B9B0A2");ctx.fillRect(sx,sy+22,TS,8);                                   /* the curb: painted concrete, knee high */
  ctx.fillStyle=tc("#C9C1B3");ctx.fillRect(sx,sy+21,TS,1.6);                                 /* its top, edge-on, lit */
  ctx.fillStyle="rgba(15,12,20,.22)";ctx.fillRect(sx,sy+26.5,TS,3.5);                        /* the lower part in the ground's shade */
  ctx.fillStyle="rgba(60,50,40,.35)";ctx.fillRect(sx+((x*TS)%13)+2,sy+23,0.8,6);              /* one joint, on the world grid, so it runs */
  ctx.fillStyle="rgba(15,12,20,.3)";if(Wt)ctx.fillRect(sx,sy+21,1.2,9);if(E)ctx.fillRect(sx+TS-1.2,sy+21,1.2,9); /* the ends of the run */
};

/* LOOSE PETALS ON THE GROUND — THE TRAIL, WHICH IS NOT THE BED (owner, 2026-09-22: "ok can you
   try to lookinto making petals? that i can walk and interact through as if they were mounds of
   items piled up").
   `b` above is the raised bed: a box with a curb, and you do not walk through it. `✿` is what
   FALLS OUT of it — loose heads and torn petals, swept into low mounds and laid from the bed to
   the ofrenda, which is how the souls are shown the way. Two objects; they shared one letter for a
   day and the letter's curb made the arrow a wall (maps.js, the pk row 10 comment and SOLIDX).
   HOW IT IS MADE, AND THEREFORE HOW IT IS DRAWN (.claude/skills/how-its-made). Nothing here is
   planted, so nothing here is arranged: a head drops, it breaks up, and the pieces are PUSHED
   along the ground — which is where the variation enters, at the pushing and not at the growing.
   So: the same petal the bridge strews (engine.js petalShape) in the same six colours (petalPal),
   because it is the same flower off the same plant; dark at the foot and lit at the crown, because
   a heap needs a value range and what shows between petals is the dark that makes the orange sing;
   piled against whatever stopped it, the rule the bridge's own spill was tuned to on 2026-09-21;
   worn low down the middle of the lane where feet go through, which is the only thing that tells a
   laid path from a spill; and a few pieces that got away past the foot.
   YEAR-ROUND, on purpose, and this is a decision rather than an oversight. A map row cannot be
   seasonal without a seam nobody asked for — but the bed these fall from is on the map all year
   and blooms all year, and `petalPal()` deliberately "returns the marigold gradient WITH NO SEASON
   ON" (engine.js, drawBed). Petals under a flowering bed in March are just true. What the SEASON
   changes is what it has always changed: the six colours, and the ofrenda that the trail points at. */
const PETAL_LANE=(w,x,y)=>{ /* which way the trail runs through this tile — feet wear a lane along it */
  const at=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return !!r&&r[gx]==="✿";};
  const ew=at(x-1,y)||at(x+1,y),ns=at(x,y-1)||at(x,y+1);
  return ew&&!ns?"x":ns&&!ew?"z":null;};
const PETAL_BANK=(w,x,y)=>{ /* the side it was stopped on: a drift piles against a solid, never in the open */
  const sol=(gx,gy)=>{const r=w&&w.grid&&w.grid[gy];return !!r&&SOLID.has(r[gx]);};
  return [sol(x+1,y)?1:sol(x-1,y)?-1:0, sol(x,y+1)?1:sol(x,y-1)?-1:0];};
const PETAL_RND=s=>{let sd=(s|0)&0x7fffffff;return()=>{sd=(sd*1103515245+12345)&0x7fffffff;return sd/0x7fffffff;};};
TILEART["✿"]=rc=>{const{sx,sy,x,y}=rc;
  const P=petalPal(),w=CW(),lane=PETAL_LANE(w,x,y),bk=PETAL_BANK(w,x,y),rnd=PETAL_RND(x*911+y*271+29);
  const cx=sx+16+bk[0]*3.5,cy=sy+16+bk[1]*3.5;
  /* The damp under the drift — UNDER THE BANKS AND NOWHERE ELSE. The first cut laid one ellipse
     across the whole tile and at 5× it read as a grey stain on the pavement with petals on top,
     because a flat brown at a third alpha over this floor desaturates to concrete. A worn lane
     shows the GROUND, which is the pavement; the dark belongs where the petals are deep. */
  ctx.fillStyle="rgba(74,38,12,.30)";
  const lobe=(ox,oy,rx,ry)=>{ctx.beginPath();ctx.ellipse(cx+ox,cy+oy,rx,ry,0,0,7);ctx.fill();};
  if(lane==="x"){lobe(0,-6.5,12.5,4.6);lobe(0,6.5,12.5,4.6);}
  else if(lane==="z"){lobe(-6.5,0,4.6,12.5);lobe(6.5,0,4.6,12.5);}
  else lobe(0,1.4,11,8.6);
  for(let i=0;i<13;i++)petalShape(ctx,sx+2+rnd()*28,sy+2+rnd()*28,rnd()*6.2832,0.85,P[1+((i+1)%3)]);   /* the ones that got away, out on the grass */
  for(let i=0;i<70;i++){                                                                               /* the heap itself */
    const a=rnd()*6.2832,t=Math.sqrt(rnd());let px=Math.cos(a)*t*13,py=Math.sin(a)*t*10.5;
    if(lane){const across=lane==="x"?py:px;
      if(Math.abs(across)<4.5&&rnd()<0.55)continue;                                                    /* worn thin where the feet go */
      if(lane==="x")py*=1.12;else px*=1.12;}                                                           /* and banked up either side of them */
    const r=Math.min(1,Math.hypot(px/13,py/10.5));
    petalShape(ctx,cx+px,cy+py,rnd()*6.2832,0.95+(1-r)*0.25,P[1+Math.min(4,Math.floor((1-r)*4.2+rnd()*1.4))]);}
  const nh=2+((((x*7+y*13)%2)+2)%2);                                                                   /* two or three heads that never broke up */
  for(let i=0;i<nh;i++){const a=rnd()*6.2832,t=rnd()*0.55,hx=cx+Math.cos(a)*t*11,hy=cy+Math.sin(a)*t*9,r=2.6+rnd()*1.1;
    ctx.fillStyle="rgba(30,18,8,.30)";ctx.beginPath();ctx.ellipse(hx+0.6,hy+r*0.7,r*0.95,r*0.4,0,0,7);ctx.fill();
    ctx.fillStyle=P[1];ctx.beginPath();ctx.ellipse(hx,hy+r*0.18,r,r*0.8,0,0,7);ctx.fill();
    ctx.fillStyle=P[3]||P[2];ctx.beginPath();ctx.ellipse(hx,hy,r*0.95,r*0.76,0,0,7);ctx.fill();
    ctx.fillStyle=P[5]||P[4];ctx.beginPath();ctx.ellipse(hx-r*0.3,hy-r*0.35,r*0.4,r*0.3,0,0,7);ctx.fill();}
};
/* THE HEAP IN PROFILE. It is ANKLE high — about a quarter of a tile, where the bed's curb is knee
   high and its heads stand higher again — because that is the difference a person has to read at
   phone size between "I walk through this" and "I walk round that". A drift has an EDGE, so the
   silhouette is drawn first and every petal is cut by it; shallow sides, because loose light stuff
   will not stand steep. */
TILEART_SIDE["✿"]=rc=>{const{sx,sy,x,y}=rc;
  const P=petalPal(),rnd=PETAL_RND(x*577+y*193+11),base=sy+30,top=base-8.5;
  ctx.fillStyle="rgba(15,12,20,.20)";ctx.fillRect(sx,base-0.6,TS,2);                        /* it meets the floor in a line */
  ctx.save();ctx.beginPath();ctx.moveTo(sx-1,base+0.5);
  ctx.bezierCurveTo(sx+5,base-1,sx+8,top+0.6,sx+16,top);
  ctx.bezierCurveTo(sx+24,top+0.6,sx+27,base-1,sx+TS+1,base+0.5);
  ctx.closePath();ctx.fillStyle=P[0];ctx.fill();ctx.clip();
  for(let i=0;i<56;i++){const h=rnd();
    petalShape(ctx,sx+rnd()*TS,base-h*9.5,rnd()*6.2832,0.9,P[1+Math.min(4,Math.floor(h*4.2+rnd()*1.2))]);}
  ctx.fillStyle="rgba(15,12,20,.28)";ctx.fillRect(sx,base-2.8,TS,3.4);                      /* the foot, in the ground's own shade */
  ctx.restore();
  const head=(hx,hy,r)=>{
    ctx.fillStyle=P[1];ctx.beginPath();ctx.ellipse(hx,hy+r*0.16,r,r*0.82,0,0,7);ctx.fill();
    ctx.fillStyle=P[3]||P[2];ctx.beginPath();ctx.ellipse(hx,hy,r*0.94,r*0.76,0,0,7);ctx.fill();
    ctx.fillStyle=P[5]||P[4];ctx.beginPath();ctx.ellipse(hx-r*0.32,hy-r*0.36,r*0.38,r*0.28,0,0,7);ctx.fill();};
  head(sx+13,top+1.6,2.5);head(sx+20.5,top+2.8,2.1);head(sx+27,base-2,1.8);                 /* two on the crown, one rolled clear */
};

/* ---- BEAUTIFY, SECOND SITTING — 2026-09-21, the same day. SHAPES, NOT PICTURES. ----
   Owner: "i still see squares and not polygonal shapes … can we not try this finally?" The `mesh`
   view: a list of primitives per tile, in tile units (a tile is 1.0 wide, a person about 1.0 tall),
   y up from the floor, the tile's centre at (0,0). The engine merges them into one mesh with vertex
   colours. Drawn as .claude/skills/how-its-made says: by what the thing is made of. A marigold head is a
   pom-pom — a sphere. A pot was thrown — a tapered cylinder with a rim. A bookcase is a carcass of
   boards with what a person put on them. Colours go through tc() in the engine, so the theme and
   the time of day reach these like everything else. */
const TILEART_MESH={};
/* THE LETTERS THIS WORLD TAKES FROM THE ENGINE'S OWN SHAPES (engine/shapes.js, SHAPEBIND) — the three pieces of the
   park's agility course and nothing else (mq-v232). Meridian means by 3 4 5 exactly what the engine means — a
   hurdle, a tunnel and weave poles, the engine's own drawings, never redrawn here — so it takes the engine's shapes
   by name rather than writing a copy: the course is the same object in every world that lays it. Every other letter
   SHAPEBIND offers, Meridian answers for itself above and below (clause 1 of the gate), and is not named here. */
const SHAPETAKE="345";
/* A CEMPASÚCHIL HEAD IS A STACK OF WHORLS, NOT A BALL (la botánica, crew run 11, 2026-09-21, from the
   owner's three photographs). Tagetes erecta, the double kind sold for Día de Muertos: hundreds of ray
   florets on a domed receptacle, in whorls — the outermost the largest, splayed nearly flat with a wavy
   margin; each whorl inward shorter, steeper and more crinkled, to a crown of upright florets. ONE HUE
   PER PLANT, deepest at the floret's base and paler at its margin, so the outer whorl reads deeper than
   the crown. The green cup under it is the involucre: a narrow ribbed vase, not a ball. Built as three
   whorls of flattened lobes (a squashed sphere, long along the radius, its BASE on the receptacle and its
   tip lifted — outer 17°, middle 55°, inner 72°), a crown of three, the receptacle showing between them,
   and a tapered cylinder for the cup. Every head grows by the same rule; what the seed changes is the
   turn and the crimp of each floret — variation enters where it entered (how-its-made).
   `hue` picks the plant's colour from P — -1 deep red-brown, 0 rust, 1 orange (default), 2 gold —
   the whorls take P[hue+1], P[hue+2], P[hue+3] (the crown capped at P[4]); nothing here names an
   orange, so a season that recolours petals recolours these. Four steps because two touching heads in
   one family are ~5% apart under this light and merge (Pili, run 11): every value difference between
   heads is PAINTED. `lod` 0 drops the middle whorl, but ONLY on a bed-sized head — below r 0.10 the
   six-lobe branch never consults it and 0 does nothing (measured; see the count below). `lean` is [x,z]: the
   head sheared off its stem that much per unit of height — the outer stems of a bush splay toward
   the light. The first seven parameters are what the bed, the tree's garland and the altar's arch
   already pass.

   DEFINITION, THE FOURTH REPORT — 2026-09-22, la jardinera (owner: "the marigold decor is also not
   very well defined"). The head was not the fault; it reads at a 4× crop. TWO things were, and both
   are about what is NEXT TO the orange, not about the orange:

   (1) THE DARK. The light here has a 1.5:1 range and nothing more (DAY_AMB 0.66, DAY_SUN 0.42), so
   form cannot separate two orange things — only VALUE can, and value has to be painted in. In the
   bed it was, by accident: the near-black foliage mound sits under the heads. Everywhere the
   marigold is used as DECOR — the tree's garland, the altar's arch, the calaverita's lid — it hangs
   against pale plaster with nothing behind it, and twelve orange lobes with nothing dark at their
   rim average to a smear. The bakery found the same thing and the answer there was the PACKAGING:
   a polvorón reads because its white paper cup is WIDER than the cookie. So every head now carries
   its own dark: a near-black involucre collar, r*1.24 — wider than the petal mass's outer reach of
   about r*1.15 — flattened to sy 0.16 and set a little below the florets, so from the 40° camera it
   shows as a dark ring round the lower rim of every head and as dark in every gap between two heads
   that touch. #1B3521 lands at luma 43 on a lit face and 28 on a shaded one, against 127 for the
   body orange: the biggest value step anywhere on the flower, and it is the step the eye uses.

   (2) THE SUB-PIXEL FLORETS. A tile is ~35 px on a phone. A decor head at r 0.055 is 4 px across
   and was being built from 24 florets of r 0.019 — 0.65 px each. They cannot be seen; they can only
   be averaged, which is exactly what "not defined" looks like. Under r 0.10 the head is now built
   from SIX fat outer lobes and four inner ones instead of twenty-four small ones, so the outline is
   a rosette with six points instead of a circle.

   `collar:true` and `petal:true` mark the two kinds for `test/smoke.js`'s definition guard.
   COUNTED, by calling it rather than by reading it (the first draft of this comment said 26 and 13
   and both were wrong — it forgot that the crown whorl(3) sits OUTSIDE the small/else branch and is
   built either way): 27 parts at bed size with `lod` 1, 20 at bed size with `lod` 0, and 16 for any
   head under r 0.10. `lod` reaches only the bed's branch — a small head builds the same 16 parts
   whatever it is passed, which is why the marigold on the tamalera's pot lid (grep "a marigold on
   the lid in season") passes 0 and gets the same head as everything else. That is deliberate:
   there is nothing left to drop at 4 px. (It said "art.js:1866" and the call was never on that
   line; a line number in a comment is wrong the next time anything above it is edited, and this
   comment has now moved it twice. Name the thing, not the line.) */
const meshMarigold=(parts,hx,hy,hz,r,P,seed,hue,lod,lean)=>{
  const k=hue===undefined?1:hue,full=lod===undefined||lod>0,lx=lean?lean[0]:0,lz=lean?lean[1]:0;
  const small=r<0.10;                                                                                  /* a decor head: 6 px across, so fewer and fatter */
  const C0=P[Math.max(k+1,0)]||P[2],C1=P[Math.max(k+2,0)]||P[3],C2=P[Math.min(k+3,4)]||P[4],CUP="#4E8A58",COLLAR="#1B3521"; /* the crown stops at P[4]: a gold head is gold to the centre, not cream */
  const rnd=(i,j)=>{const v=Math.sin((seed+1)*12.9898+i*78.233+j*37.719)*43758.5453;return v-Math.floor(v);}; /* a hash, not Math.random: the same tile grows the same flower every frame */
  const put=p=>{p.x+=(p.y-hy)*lx;p.z+=(p.y-hy)*lz;parts.push(p);};
  put({s:"sph",x:hx,y:hy-r*0.12,z:hz,r:r*1.24,sy:0.16,c:COLLAR,collar:true});                          /* THE VALUE BREAK: the dark, and it is WIDER than the flower */
  put({s:"cyl",x:hx,y:hy-r*0.32,z:hz,rt:r*0.30,rb:r*0.20,h:r*0.5,c:CUP});                            /* the involucre */
  put({s:"sph",x:hx,y:hy+r*0.22,z:hz,r:r*0.55,sy:0.9,c:C1,petal:true});                                /* the receptacle, in the plant's own hue */
  const whorl=(n,rad,y,pr,sy,sz,tilt,c,j)=>{const off=rnd(j,0)*6.2832,hl=pr*sz;
    for(let i=0;i<n;i++){const a=off+i*6.2832/n+(rnd(i,j)-0.5)*0.4,t=tilt+(rnd(i,j+5)-0.5)*0.3,rr=rad+Math.cos(t)*hl;
      put({s:"sph",x:hx+Math.cos(a)*rr,y:y+Math.sin(t)*hl,z:hz+Math.sin(a)*rr,r:pr,sy,sz,rx:-t,ry:Math.PI/2-a,c,petal:true});}};
  if(small){whorl(6,r*0.26,hy,r*0.40,0.32,1.10,0.35,C0,1);                                             /* six fat lobes: at 6 px an outline with points beats a circle of crumbs */
            whorl(4,r*0.10,hy+r*0.26,r*0.32,0.42,1.0,1.20,C2,3);}
  else{whorl(8,r*0.30,hy,r*0.34,0.28,1.25,0.3,C0,1);                                                   /* outer: the largest florets, splayed, margins lifted */
       if(full)whorl(7,r*0.22,hy+r*0.14,r*0.30,0.32,1.1,0.95,C1,2);                                    /* middle: shorter, steeper */
       whorl(6,r*0.12,hy+r*0.28,r*0.26,0.4,1.0,1.25,C2,3);}                                            /* inner: near upright, crinkled */
  whorl(3,r*0.06,hy+r*0.55,r*0.2,0.8,1.0,1.4,C2,4);};                                                   /* the crown */
/* A STRING OF PAPEL PICADO between two points, sagging a little, with flags hung from it in the paper
   palette, alternating. Flags are boxes, thin as paper, a hair below the string. */
const meshPapel=(parts,x0,y0,z0,x1,y1,z1,pal,n,seed)=>{
  const mx=(x0+x1)/2,my=Math.min(y0,y1)-0.05,mz=(z0+z1)/2,ang=Math.atan2(z1-z0,x1-x0),len=Math.hypot(x1-x0,z1-z0);
  parts.push({s:"cyl",x:mx,y:my,z:mz,r:0.007,h:len,c:"#3A2E26",rz:Math.PI/2,ry:-ang});         /* the string */
  for(let i=0;i<n;i++){const t=(i+0.5)/n,fx=x0+(x1-x0)*t,fz=z0+(z1-z0)*t,fy=my-0.005-2*t*(1-t)*0.05;
    parts.push({s:"box",x:fx,y:fy-0.07,z:fz,w:0.11,h:0.13,d:0.006,c:pal[(i+seed)%pal.length],ry:-ang});}};
const MESH_FAM=[["#8C3B2E","#A54A3A","#6E2E24"],["#3E5C86","#4F6E9A","#2F4868"],["#7C8F5A","#93A56A","#5E6E44"],
                ["#C9B68C","#D9C9A3","#A99570"],["#5C4A6E","#6E5A84","#463756"],["#B8763A","#C98A4C","#8E5A2C"]];

/* THE RAISED BED. A painted-concrete curb with a rounded lip (a cylinder along each top edge — the
   mason ran a trowel round it), soil behind it, and a bush of cempasúchil in it. A run of beds shares
   one curb: the walls stand only where the run ends. Colours from petalPal, so a season recolours these too.
   THE MARIGOLDS, FOURTH TRY (la botánica, crew run 11, from the owner's photographs of one head, a bunch
   and a bush). Twelve heads from meshMarigold on a staggered grid, jittered, so they TOUCH — a bunch
   has no gaps — the middle of the bed standing higher and the edge heads leaning out, as a bush mounds
   and splays; every head from the same rule, and what differs is what differed in the field: the size
   (age), the turn (the seed), and the hue (the packet's mix, photo 2: six orange, three gold, two
   rust, one deep red-brown, laid so no two in a row share a step and turned per tile — two touching
   heads in one family merge under this light, so the difference between heads is painted, Pili's
   read). Under them the foliage as photo 3 has it: a near-black green mass UNDER the heads, never
   beside — fifty small masses on a jittered grid from the soil to knee height, darkest on top where
   they show between heads, a step greener low on the mound's outside where the sun reaches — and the
   soil darker than any petal's underside, so what shows between heads is the dark that makes the
   orange sing; stems only above the foliage, where they show; buds between the heads, the same plant
   younger. The seed is x AND y: the old (x*7+y*13)%7 was constant along a row, so three beds in a row
   were one bed three times. */
TILEART_MESH["b"]=({x,y})=>{
  const P=petalPal();
  const h=(((x*5+y*3)%7)+7)%7;
  const rnd=(i,j)=>{const v=Math.sin(x*12.9898+y*78.233+i*39.425+j*17.719)*43758.5453;return v-Math.floor(v);};
  const w=CW(),bed=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return !!r&&r[gx]==="b";};
  const N=!bed(x,y-1),S=!bed(x,y+1),E=!bed(x+1,y),Wt=!bed(x-1,y);
  const CURB="#B9B0A2",LIP="#CFC7B9",SOIL="#2F2216",LEAF="#27492F",LEAF2="#3E7C4F",LEAF3="#2E5A38",STEM="#5A9A62",CUP="#4E8A58";
  const parts=[];
  const wall=(px,pz,ww,dd)=>{parts.push({s:"box",x:px,y:0.11,z:pz,w:ww,h:0.22,d:dd,c:CURB});
    parts.push({s:"cyl",x:px,y:0.22,z:pz,r:0.045,h:Math.max(ww,dd),c:LIP,rz:ww>dd?Math.PI/2:0,rx:ww>dd?0:Math.PI/2});}; /* the lip */
  if(N)wall(0,-0.42,0.92,0.08);if(S)wall(0,0.42,0.92,0.08);if(Wt)wall(-0.42,0,0.08,0.92);if(E)wall(0.42,0,0.08,0.92);
  parts.push({s:"box",x:0,y:0.16,z:0,w:0.92,h:0.08,d:0.92,c:SOIL});                       /* the soil, a hand below the lip */
  const clamp=v=>Math.max(-0.37,Math.min(0.37,v));                                                  /* the foliage stays inside the curb */
  for(let i=0;i<40;i++){const gx=clamp(-0.36+(i%5)*0.18+(rnd(i,11)-0.5)*0.14),gz=clamp(-0.36+((i/5|0)%5)*0.18+(rnd(i,12)-0.5)*0.14+(i>=25?0.09:0)),gy=0.2+rnd(i,13)*0.14,lr=0.055+rnd(i,14)*0.04; /* the foliage mound, on a jittered grid so it has no holes */
    parts.push({s:"sph",x:gx,y:gy,z:gz,r:lr,sx:1.4,sy:0.45,sz:0.7,ry:rnd(i,15)*3.14,c:gy>0.3?LEAF3:(Math.abs(gx)>0.28||Math.abs(gz)>0.28?LEAF2:LEAF)});} /* dark on top; the sunlit green only low on the outside */
  for(let i=0;i<10;i++){const gx=-0.32+(i%5)*0.16+(rnd(i,16)-0.5)*0.08,gz=(i<5?-0.16:0.16)+(rnd(i,17)-0.5)*0.06;  /* and a top layer between the rows of heads, where the soil showed: the darkest green, under, never beside */
    parts.push({s:"sph",x:gx,y:0.35,z:gz,r:0.08,sx:1.4,sy:0.4,sz:0.8,ry:rnd(i,18)*3.14,c:i%2?LEAF3:LEAF});}
  const heads=[[-0.34,-0.3],[-0.11,-0.31],[0.11,-0.3],[0.34,-0.31],[-0.3,0],[-0.08,0.01],[0.14,-0.01],[0.36,0],[-0.34,0.3],[-0.11,0.31],[0.11,0.3],[0.34,0.31]];
  const HUES=[1,2,1,0, 2,1,-1,1, 1,0,1,2];                                                          /* the packet's mix, row by row: no two beside each other in one family */
  heads.forEach(([hx,hz],i)=>{const j=(h+i)%12,hue=HUES[j],r=0.12+rnd(i,21)*0.035+(hue===0?0.015:0),
    px=hx+(rnd(i,23)-0.5)*0.07,pz=hz+(rnd(i,24)-0.5)*0.07,d=Math.hypot(px,pz),
    hy=0.40+(1-Math.min(1,d/0.5))*0.12+rnd(i,22)*0.05;                                                /* the middle mounds higher */
    parts.push({s:"cyl",x:px,y:(0.3+hy)/2,z:pz,r:0.012,h:hy-0.3,c:STEM});                          /* the stem, from inside the foliage */
    meshMarigold(parts,px,hy,pz,r,P,h*3+i,hue,1,[px/0.5*0.22,pz/0.5*0.22]);});                        /* the edge heads lean out toward the light */
  [[-0.22,-0.15],[0.23,0.15],[-0.2,0.16],[0.22,-0.16]].forEach(([bx,bz],i)=>{const by=0.42+rnd(i,31)*0.05; /* buds: a green egg on a stem, the colour just showing */
    parts.push({s:"cyl",x:bx,y:(0.3+by)/2,z:bz,r:0.01,h:by-0.3,c:STEM});
    parts.push({s:"cyl",x:bx,y:by,z:bz,rt:0.03,rb:0.02,h:0.07,c:CUP});
    parts.push({s:"sph",x:bx,y:by+0.045,z:bz,r:0.028,sy:1.2,c:P[2+i%2]});});
  return parts;};

/* THE MOUND OF LOOSE PETALS, IN 3D. The bed above is a planted thing and is built from the ground
   up — curb, soil, foliage, heads on stems. NOTHING HERE IS ON A STEM. Everything in this heap has
   fallen and then been pushed, so it is built in that order and in no other: the damp dark it lies
   on, the broken pieces heaped at the shallow angle loose light stuff actually stands at, the two
   or three heads that never broke up sitting on top because they landed last, and the few that got
   away past the foot. A petal is a flattened ellipsoid — that is a petal seen from any side — and
   the colours are petalPal's six, the same six on the bridge's spill and in the bed, because it is
   the same flower. Crown at 0.19 of a tile: the cast now stands 0.92, so this is mid-shin, which is
   what a mound of swept flowers looks like and is well under the bed's knee-high curb. */
TILEART_MESH["✿"]=({x,y})=>{
  const P=petalPal(),w=CW(),lane=PETAL_LANE(w,x,y),bk=PETAL_BANK(w,x,y);
  const rnd=(i,j)=>{const v=Math.sin(x*12.9898+y*78.233+i*39.425+j*17.719)*43758.5453;return v-Math.floor(v);};
  const ox=bk[0]*0.09,oz=bk[1]*0.09,H=0.175;                                    /* it piles against whatever stopped it */
  /* the damp, under the BANKS. One disc the width of the tile read as a brown dish with petals
     sitting in it at 4× — the shadow was wider than what casts it. Same correction as the top art. */
  const parts=[];
  const lobe=(lx,lz,r)=>parts.push({s:"cyl",x:ox+lx,y:0.005,z:oz+lz,r:r,h:0.01,c:"#3A1C0A"});
  if(lane==="x"){lobe(0,-0.16,0.25);lobe(0,0.16,0.25);}
  else if(lane==="z"){lobe(-0.16,0,0.25);lobe(0.16,0,0.25);}
  else lobe(0,0,0.34);
  for(let i=0;i<112;i++){
    const a=rnd(i,1)*6.2832,t=Math.sqrt(rnd(i,2));let px=Math.cos(a)*t*0.42,pz=Math.sin(a)*t*0.42;
    if(lane){const across=lane==="x"?pz:px;
      if(Math.abs(across)<0.13&&rnd(i,3)<0.5)continue;                          /* worn thin down the lane */
      if(lane==="x")pz*=1.1;else px*=1.1;}                                      /* banked either side of it */
    const r=Math.min(1,Math.hypot(px,pz)/0.42);
    parts.push({s:"sph",x:ox+px,y:0.014+H*(1-r*r)*(0.55+rnd(i,4)*0.45),z:oz+pz,
      r:0.058+rnd(i,5)*0.03,sx:1.25,sy:0.26,sz:0.8,ry:rnd(i,6)*3.1416,rx:(rnd(i,7)-0.5)*0.5,
      c:P[1+Math.min(4,Math.floor((1-r)*4.2+rnd(i,8)*1.3))]});}
  for(let i=0;i<3;i++){const a=rnd(i,11)*6.2832,t=rnd(i,12)*0.5;                /* the heads that never broke up */
    meshMarigold(parts,ox+Math.cos(a)*t*0.34,0.03+H*0.72+rnd(i,13)*0.03,oz+Math.sin(a)*t*0.34,
      0.055+rnd(i,14)*0.012,P,(x*3+y*7+i)|0,1+(i%2),0);}
  for(let i=0;i<7;i++){const a=rnd(i,21)*6.2832,rr=0.44+rnd(i,22)*0.055;        /* and the ones that got away */
    parts.push({s:"sph",x:Math.cos(a)*rr,y:0.012,z:Math.sin(a)*rr,r:0.048,sx:1.25,sy:0.2,sz:0.8,ry:rnd(i,23)*3.1416,c:P[1+(i%3)]});}
  return parts;};

/* THE POTTED PLANT. Twenty of them, every one the same picture until tonight (docs/BEAUTIFY.md,
   P ×20). Thrown on a wheel: a tapered pot, a rim, soil in it, a stem, and a head of five leaf
   masses turned per tile so a row of them is a row and not one plant repeated. */
TILEART_MESH["P"]=({x,y})=>{const h=(((x*7+y*13)%5)+5)%5,a=h*1.26,c=Math.cos(a),s=Math.sin(a);
  const POT="#B4633F",RIM="#C97A52",SOIL="#4A3524",G1="#3E7C4F",G2="#4E9A5E";
  const parts=[{s:"cyl",x:0,y:0.13,z:0,rt:0.2,rb:0.15,h:0.26,c:POT},{s:"cyl",x:0,y:0.27,z:0,r:0.22,h:0.04,c:RIM},
               {s:"cyl",x:0,y:0.295,z:0,r:0.17,h:0.02,c:SOIL},{s:"cyl",x:0,y:0.41,z:0,r:0.02,h:0.24,c:G1}];
  [[0,0.62,0,0.19],[0.13,0.52,0.06,0.15],[-0.12,0.54,-0.05,0.14],[0.02,0.5,-0.14,0.13],[-0.03,0.48,0.14,0.12]].forEach(([px,py,pz,r],i)=>
    parts.push({s:"sph",x:px*c-pz*s,y:py,z:px*s+pz*c,r,c:i%2?G2:G1}));
  return parts;};

/* THE SHELF, AS A CARCASS. Two uprights, a back, four boards with real depth, and on them what
   TILEART_SIDE["S"] paints from the front — runs of spines, one leaning, a stack, a carton — now as
   boxes you can see between. It faces the first open side (south, then east, west, north), so a
   shelf against any wall shows its front to the room. */
TILEART_MESH["S"]=({x,y})=>{
  const w=CW(),solid=(gx,gy)=>{const r=w&&w.grid&&w.grid[gy];return !r||r[gx]===undefined||SOLID.has(r[gx]);};
  const ry=!solid(x,y+1)?0:!solid(x+1,y)?Math.PI/2:!solid(x-1,y)?-Math.PI/2:Math.PI;
  const sd=(((x*7+y*13)%6)+6)%6,WOOD="#8A6F4D",DARK="#5A4530",BACK="#3F2E1E";
  const parts=[{s:"box",x:0,y:0.5,z:-0.2,w:0.9,h:1.0,d:0.04,c:BACK},
    {s:"box",x:-0.43,y:0.5,z:0,w:0.05,h:1.0,d:0.42,c:WOOD},{s:"box",x:0.43,y:0.5,z:0,w:0.05,h:1.0,d:0.42,c:WOOD}];
  [0.03,0.34,0.66,0.98].forEach(by=>parts.push({s:"box",x:0,y:by,z:0,w:0.9,h:0.035,d:0.42,c:by>0.9?WOOD:DARK}));
  const run=(x0,base,n,fam,lean)=>{let cx=x0;for(let i=0;i<n;i++){const bw=0.05+((i*3+sd)%3)*0.015,bh=0.24-((i*5+sd*3)%3)*0.025;
      parts.push({s:"box",x:cx+bw/2,y:base+bh/2,z:0.02,w:bw,h:bh,d:0.28,c:fam[(i+sd)%fam.length]});cx+=bw+0.008;}
    if(lean){const bw=0.055,bh=0.22;parts.push({s:"box",x:cx+bw/2+0.03,y:base+bh/2-0.012,z:0.02,w:bw,h:bh,d:0.28,c:fam[(n+sd)%fam.length],rz:-0.28});cx+=bw+0.06;}
    return cx;};
  const stack=(x0,base,fam)=>[0,1].forEach(i=>parts.push({s:"box",x:x0+0.1,y:base+0.025+i*0.05,z:0,w:0.2-i*0.02,h:0.045,d:0.26,c:fam[(i+1)%fam.length]}));
  const carton=(x0,base)=>parts.push({s:"box",x:x0+0.13,y:base+0.11,z:0,w:0.26,h:0.22,d:0.3,c:"#B0895B"});
  const fa=MESH_FAM[sd%6],fb=MESH_FAM[(sd+2)%6],fc=MESH_FAM[(sd+4)%6],fd=MESH_FAM[(sd+1)%6];
  const B1=0.05,B2=0.36,B3=0.68;                                                         /* the top of each board */
  if(sd%2===0){const cx=run(-0.4,B3,3,fa,true);stack(cx+0.03,B3,fb);run(-0.4,B2,5,fc,true);carton(-0.4,B1);run(-0.1,B1,4,fd,false);}
  else{run(-0.4,B3,5,fb,true);const cx=run(-0.4,B2,3,fa,true);stack(cx+0.03,B2,fc);run(-0.4,B1,3,fd,true);carton(0.1,B1);}
  const cr=Math.cos(ry),sr=Math.sin(ry);                                                  /* turn the whole carcass to face the room */
  return parts.map(p=>({...p,x:p.x*cr+p.z*sr,z:-p.x*sr+p.z*cr,ry:(p.ry||0)+ry}));};

/* ---- LA ESPIGA'S GOODS — crew iteration 12, la panadera (#227). Owner: "can we also add more sweeet
   bread and baked goods please?" ----
   The four `S` tiles along the bakery's north wall are "bread racks" (maps.js, the `pa:` comment) and
   were drawing the notary's books — docs/BEAUTIFY.md row 1: one drawing, six businesses. In a Mexican
   panadería the customer takes a charola and pinzas and walks to the racks; the racks ARE the display.
   So the goods live on them and nowhere else: the shelf's mesh, side and top are wrapped below with a
   branch that fires only in `pa`, and every other world keeps the bookcase it had, byte for byte.
   Built the way .claude/skills/how-its-made says — one dough, one tray, one oven. An exhibidor is a
   frame with sheet pans slid in at a tilt, the same seasoned pans the goods came out of the oven on;
   each pan holds ONE kind off one sheet, so its pieces are siblings: one size, one cutter, shingled the
   way a hand sets them down. Variation enters at the step it entered and nowhere earlier — the concha's shell colour
   per BATCH (a pan is vanilla or it is chocolate), the bake colour per piece where the oven ran hot,
   the lean of a standing oreja per piece. Which kind sits on which pan is decided per RACK by a seed
   that reads both axes: the shelf's own (x*7+y*13)%6 is 3,5,1,3 along this row, so the first and last
   rack were one picture. Pan de muerto takes the top pan of every second rack in season, never out of it.
   The names are the story's: bolillos ("forty bolillos at five", docs.js; the cat in the flour bin),
   the concha ("concha, ten weeks"), and the bag of pan de ayer at the door.
   SECOND PASS, crew iteration 13, 2026-09-22. The owner looked at the racks and said "i can only see
   conchas and maybe some ojos de buey". He was right twice over: the concha read, and the OTHER thing he
   could see was the polvorón — a coloured round sat in a white paper cup, which from the camera is a pale
   ring round a contrasting centre, and that is an ojo de buey. Nothing else read, and the fault was COUNT
   before it was shape: six, eight and twelve to a pan made pieces three to five pixels across, and at that
   size a bolillo is a beige lozenge and a cuerno is lace. Every kind but the concha is now THREE to a pan,
   shingled so dark pan shows between them, laid in the pan's FRONT half (the shelf above overhangs the
   back of every pan but the top one) with the front piece over the lip. The concha was not touched,
   because it was the evidence. */
const PAN={frame:"#5A3E28",frameL:"#7C5A3A",pan:"#3B3836",panL:"#5A5552",
  crust:"#D19A4C",crustD:"#B0762C",crumb:"#F0D9A8",vanilla:"#F2E7CB",vanillaD:"#D6C49A",choc:"#6B4130",chocD:"#4A2A1E",
  wicker:"#8F6A3A",wickerD:"#6C4B24",caramel:"#C27C34",caramelL:"#EAC57E",caramelD:"#8A4E14",
  pink:"#EFA3B5",vain:"#F1E3BE",cocoa:"#7E5237",cup:"#F8F6F0",sugar:"#F1DCAF"};
const PA_KINDS=["concha-v","concha-c","bolillo","cuerno","oreja","polvoron"];
const paHere=()=>typeof world!=="undefined"&&world==="pa";
const paMuertos=()=>typeof seasonNow==="function"&&seasonNow()==="muertos"; /* the season by its id: SEASONS.muertos.art has no bread key, and config.js is not this lane's */
/* one rack, decided ONCE for every camera: its seed, and the kind on each pan, top pan first */
const paRack=(x,y)=>{const s=(((x*5+y*3)%7)+7)%7;
  const trays=[PA_KINDS[(s+1)%6],PA_KINDS[(s+3)%6],PA_KINDS[(s+5)%6]];
  if(paMuertos()&&s%2===0)trays[0]="muerto";
  return {s,trays};};
/* THE GOODS, AS PARTS. `put(part,u,v,h)` sets a part on a pan: u across, v toward the room, h above the
   sheet — the pan is tilted and put() does the trigonometry, so each kind is written flat. */
const paGoods=(kind,s,ti,put)=>{const R=PAN,hot=(s+ti)%6;                                  /* the one the oven's hot corner caught */
  if(kind==="concha-v"||kind==="concha-c"){const cap=kind==="concha-v"?R.vanilla:R.choc;let i=0;
    for(let r=0;r<2;r++)for(let c=0;c<3;c++,i++){const u=-0.29+c*0.29,v=-0.11+r*0.22;
      put({s:"cyl",r:0.145,h:0.06,c:i===hot?R.crustD:R.crust},u,v,0.03);                    /* the dough: one cutter, six times */
      put({s:"sph",r:0.14,sy:0.62,c:cap},u,v,0.062);}}                                        /* the shell: one batch, one colour */
  else if(kind==="bolillo"){                                                                  /* THREE, not eight. The basket is gone: the pan is the container */
    const bol=(u,v,h,L,r,i)=>{const c=i===hot%3?R.crustD:R.crust;
      put({s:"cyl",r,h:L,rz:Math.PI/2,c},u,v,h);                                              /* the body, laid across so you see the one thing that is not round about it: its length */
      put({s:"cone",r,h:0.075,rz:-Math.PI/2,c},u+L/2+0.037,v,h);put({s:"cone",r,h:0.075,rz:Math.PI/2,c},u-L/2-0.037,v,h); /* the two points the roll was tapered to */
      put({s:"box",w:L*0.90,h:0.02,d:r*0.60,c:R.crustD},u,v-r*0.34,h+r*0.74);                 /* the cut's shaded lip, behind the split */
      put({s:"box",w:L*0.86,h:0.024,d:r*0.72,c:R.crumb},u,v+r*0.10,h+r*0.80);};               /* LA GREÑA: the one slash, opened in the oven — a pale ridge, the only mark that names it */
    bol(-0.145,-0.05,0.095,0.26,0.085,0);bol(0.125,0.06,0.095,0.26,0.085,1);                  /* shingled three deep, each offset across, so dark pan shows between them */
    bol(-0.065,0.17,0.095,0.26,0.085,2);}                                                      /* all in the pan's front half: the shelf above overhangs the back of every pan but the top one */
  else if(kind==="cuerno"){                                                                    /* THREE, shingled the way the bolillos are — a row of them merged into lace, a stack into one blob */
    const cue=(u,v,h,i)=>{const c=i===hot%3?R.crustD:R.crust;
      put({s:"torus",r:0.14,t:0.068,arc:Math.PI*1.26,rx:Math.PI/2,ry:Math.PI+(((s+i)%3)-1)*0.34,c},u,v,h);}; /* the rolled triangle curved to a horn: a 4.8px tube round a 4.5px hole */
    cue(-0.17,-0.03,0.075,0);cue(0.16,0.09,0.075,1);cue(-0.06,0.19,0.085,2);}                  /* forward of the shelf above, which was cutting the back two in half */
  else if(kind==="oreja"){                                                                     /* TWO laid FACE UP, shingled like the bolillos. Stood on edge they were clipped by the shelf
                                                                                                  above and read as wedges; the cut face IS the object, so the face goes up. TWO, not three, because
                                                                                                  the owner read the sparse tray as the story it is: this is the kind that sells out, and the empty
                                                                                                  front of the pan says so louder than a third piece ever said "bakery" (docs/ASKS.md, 2026-09-22) */
    const ore=(u,v,i)=>{const hotOne=i===hot%2,c=hotOne?R.caramel:R.caramelL;
      put({s:"box",w:0.21,h:0.05,d:0.105,c:R.caramelD},u,v-0.078,0.026);                       /* the back of the slice, where the sheet's two rolls meet, dark off the tray */
      put({s:"cyl",r:0.104,h:0.050,c:R.caramelD},u-0.108,v,0.041);                             /* the outer turn of each curl, the edge that caramelises hardest on the tray */
      put({s:"cyl",r:0.104,h:0.050,c:R.caramelD},u+0.108,v,0.041);                             /* set proud on the OUTSIDE, so it reads as a dark rim and never as a hole */
      put({s:"cyl",r:0.105,h:0.058,c},u-0.090,v,0.049);                                        /* the cut face: the two curls the sheet was rolled into, sliced across the roll */
      put({s:"cyl",r:0.105,h:0.058,c},u+0.090,v,0.049);};                                      /* one roll, sliced, so both sit the same way on every piece */
    ore(-0.17,-0.03,0);ore(0.16,0.085,1);}                                                     /* the two that were laid at the back; the pan's whole front is bare, where the light is */
  else if(kind==="polvoron"){const col=[R.pink,R.vain,R.cocoa];                                /* THREE, half again as big. The white rim stays: it is why this pan reads at all */
    [-0.30,0,0.30].forEach((u,i)=>{const v=0.02;
      put({s:"cyl",rt:0.16,rb:0.125,h:0.05,c:R.cup},u,v,0.025);                                /* the capacillo */
      put({s:"cyl",r:0.142,h:0.058,c:col[(i+s)%3]},u,v,0.079);});}                             /* the polvorón: a fat disc; three doughs pressed on one tray, set down in turn */
  else if(kind==="muerto"){let i=0;for(let r=0;r<2;r++)for(let c=0;c<2;c++,i++){const u=-0.2+c*0.4,v=-0.11+r*0.22;
      put({s:"cyl",r:0.16,h:0.05,c:i===hot%4?R.crustD:R.crust},u,v,0.025);
      put({s:"sph",r:0.16,sy:0.7,c:R.crust},u,v,0.05);                                        /* the round */
      put({s:"torus",r:0.135,t:0.048,arc:Math.PI,c:R.sugar},u,v,0.06);                        /* the bones, two arches crossed over it — fattened from 0.028, which was one pixel */
      put({s:"torus",r:0.135,t:0.048,arc:Math.PI,ry:Math.PI/2,c:R.sugar},u,v,0.06);
      put({s:"sph",r:0.055,c:R.sugar},u,v,0.2);}}};                                            /* the knob, sugared */
/* THE RACK: four posts, the rails, three pans slid in at a tilt with a lip at the front, and on each
   pan what paRack() said. Faces its first open side like the bookcase it replaces. */
const paRackMesh=({x,y})=>{
  const {s,trays}=paRack(x,y),parts=[],TILT=0.34,PW=0.9,PD=0.46;                            /* the pans lean a fifth of a turn toward the room, as an exhibidor's do */
  [[-0.44,-0.2],[0.44,-0.2],[-0.44,0.2],[0.44,0.2]].forEach(([px,pz])=>parts.push({s:"box",x:px,y:0.5,z:pz,w:0.055,h:1.0,d:0.055,c:PAN.frame}));
  [-0.44,0.44].forEach(px=>parts.push({s:"box",x:px,y:0.985,z:0,w:0.04,h:0.03,d:0.44,c:PAN.frameL}));
  parts.push({s:"box",x:0,y:0.985,z:-0.2,w:0.92,h:0.03,d:0.04,c:PAN.frame});
  [0.88,0.55,0.22].forEach((ty,ti)=>{const ca=Math.cos(TILT),sa=Math.sin(TILT);
    const put=(p,u,v,h)=>parts.push({...p,x:u,y:ty+h*ca-v*sa,z:h*sa+v*ca,rx:(p.rx||0)+TILT});
    [-0.435,0.435].forEach(u=>put({s:"box",w:0.03,h:0.03,d:PD,c:PAN.frameL},u,0,-0.03));     /* the runners it slides on */
    put({s:"box",w:PW,h:0.02,d:PD,c:PAN.pan},0,0,-0.01);                                      /* the pan, seasoned steel */
    put({s:"box",w:PW,h:0.05,d:0.02,c:PAN.panL},0,PD/2,0.015);                                /* the lip, so nothing slides off */
    paGoods(trays[ti],s,ti,put);});
  return meshTurned(parts,meshFacing(x,y));};
/* THE RACK FROM THE FRONT (the camera the owner plays most). The pans read as a dark band of surface
   under a lit lip; the goods stand on the band. Same kinds, same pans, same seed as the mesh. */
const paGoods2D=(kind,s,ti,x0,base)=>{const R=PAN,hot=(s+ti)%6,tri=i=>x0+3.9+i*7.8;
  if(kind==="concha-v"||kind==="concha-c"){const cap=kind==="concha-v"?R.vanilla:R.choc,sc=kind==="concha-v"?R.vanillaD:R.chocD;
    for(let i=0;i<3;i++){const cx=tri(i);
      ctx.fillStyle=(i+3)===hot?R.crustD:R.crust;ctx.beginPath();ctx.ellipse(cx,base-1.4,3.5,1.6,0,0,7);ctx.fill();   /* the dough */
      ctx.fillStyle=cap;ctx.beginPath();ctx.ellipse(cx,base-2.2,3.5,3.4,0,Math.PI,0);ctx.fill();                       /* the shell, a dome */
      ctx.strokeStyle=sc;ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(cx-2.2,base-2.6);ctx.lineTo(cx+2.2,base-4.6);   /* its score, two cuts */
      ctx.moveTo(cx-2.2,base-4.6);ctx.lineTo(cx+2.2,base-2.6);ctx.stroke();}}
  else if(kind==="bolillo"){                                                                                             /* the basket went with the mesh's: the pan is the container */
    [[x0+6.4,base-1.9,0],[x0+16.8,base-1.9,1],[x0+11.6,base-4.6,2]].forEach(([cx,cy,i])=>{                              /* two in front, one on the heap */
      ctx.fillStyle=i===hot%3?R.crustD:R.crust;ctx.beginPath();ctx.ellipse(cx,cy,5.2,2.1,0,0,7);ctx.fill();
      ctx.fillStyle=R.crumb;ctx.fillRect(cx-2.7,cy-1.4,5.4,1.1);});}                                                     /* la greña */
  else if(kind==="cuerno"){for(let i=0;i<3;i++){const cx=tri(i);ctx.strokeStyle=(i+3)===hot?R.crustD:R.crust;ctx.lineWidth=2.6;
      ctx.beginPath();ctx.arc(cx,base-1.2,3,Math.PI*1.08,Math.PI*1.92);ctx.stroke();}}                                    /* a crescent, horns to you */
  else if(kind==="oreja"){[0,2].forEach((i,n)=>{const cx=tri(i),cy=base-2.4;                                            /* TWO, at the two ends of the pan, so the gap in the middle is bare pan:
                                                                                                                             the piece that was between them is the one somebody bought */
      ctx.fillStyle=R.caramelD;ctx.beginPath();ctx.arc(cx-2.5,cy,2.9,0,7);ctx.arc(cx+2.5,cy,2.9,0,7);ctx.fill();        /* the caramelised outer turn of each curl */
      ctx.fillStyle=n===hot%2?R.caramel:R.caramelL;ctx.beginPath();ctx.arc(cx-2.1,cy-0.3,2.5,0,7);ctx.arc(cx+2.1,cy-0.3,2.5,0,7);ctx.fill(); /* the two curls, sliced across the roll */
      ctx.fillStyle=R.caramelD;ctx.fillRect(cx-3.2,cy+2.2,6.4,1.1);});}                                                  /* the foot it spread over on the tray */
  else if(kind==="polvoron"){const col=[R.pink,R.vain,R.cocoa];for(let i=0;i<3;i++){const cx=tri(i);
      ctx.fillStyle=R.cup;ctx.beginPath();ctx.moveTo(cx-3.7,base-3);ctx.lineTo(cx+3.7,base-3);ctx.lineTo(cx+2.9,base);ctx.lineTo(cx-2.9,base);ctx.closePath();ctx.fill(); /* the capacillo */
      ctx.fillStyle=col[(i+3+s)%3];ctx.fillRect(cx-3.3,base-4.4,6.6,1.6);ctx.beginPath();ctx.ellipse(cx,base-4.4,3.3,1.3,0,0,7);ctx.fill();}}  /* the fat disc */
  else if(kind==="muerto"){[x0+6,x0+17.2].forEach((cx,i)=>{
      ctx.fillStyle=(i+2)===hot%4?R.crustD:R.crust;ctx.beginPath();ctx.ellipse(cx,base-2.2,5.2,4,0,Math.PI,0);ctx.fill();ctx.fillRect(cx-5.2,base-2.2,10.4,2.2);
      ctx.strokeStyle=R.sugar;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(cx-4.4,base-3.2);ctx.quadraticCurveTo(cx,base-8,cx+4.4,base-3.2);ctx.stroke(); /* the bones over the round */
      ctx.beginPath();ctx.moveTo(cx-1.6,base-2.6);ctx.quadraticCurveTo(cx,base-7.4,cx+1.6,base-2.6);ctx.stroke();
      ctx.fillStyle=R.sugar;ctx.beginPath();ctx.arc(cx,base-6.6,1.4,0,7);ctx.fill();});}};                                /* the knob */
const paRackSide=rc=>{const{sx,sy,x,y}=rc,{s,trays}=paRack(x,y),R=PAN;
  ctx.fillStyle="rgba(15,12,20,.20)";ctx.beginPath();ctx.ellipse(sx+16,sy+30.4,13,2,0,0,7);ctx.fill();   /* it stands on the floor */
  ctx.fillStyle=R.frame;ctx.fillRect(sx+2,sy+1,2.4,29);ctx.fillRect(sx+TS-4.4,sy+1,2.4,29);ctx.fillRect(sx+2,sy+1,TS-4,1.6); /* uprights and the top rail */
  ctx.fillStyle="rgba(255,255,255,.18)";ctx.fillRect(sx+2,sy+1,1,29);ctx.fillRect(sx+2,sy+1,TS-4,0.7);
  [8,17,26].forEach((lip,ti)=>{                                                                          /* three pans tilted toward you: a band of surface, then the lip */
    ctx.fillStyle=R.pan;ctx.fillRect(sx+4.4,sy+lip-3,TS-8.8,3);
    ctx.fillStyle=R.panL;ctx.fillRect(sx+4.4,sy+lip,TS-8.8,1.4);
    ctx.fillStyle="rgba(15,12,20,.35)";ctx.fillRect(sx+4.4,sy+lip+1.4,TS-8.8,0.8);                        /* every inside corner is dark */
    paGoods2D(trays[ti],s,ti,sx+4.4,sy+lip-1);});};
/* THE RACK FROM ABOVE: the frame, and the top pan with its goods seen from over them. */
const paRackTop=rc=>{const{sx,sy,x,y}=rc,{s,trays}=paRack(x,y),R=PAN,kind=trays[0],hot=(s+0)%6;
  ctx.fillStyle=R.frame;ctx.fillRect(sx+2,sy+6,TS-4,2.2);ctx.fillRect(sx+2,sy+24,TS-4,2.2);ctx.fillRect(sx+2,sy+6,2.2,20);ctx.fillRect(sx+TS-4.2,sy+6,2.2,20);
  ctx.fillStyle=R.pan;ctx.fillRect(sx+3,sy+8,TS-6,16);ctx.fillStyle=R.panL;ctx.fillRect(sx+3,sy+23,TS-6,1);   /* the top pan, its lip toward the room */
  const gx=(c,n)=>sx+16+(c-(n-1)/2)*8.6,gy=r=>sy+12+r*8;
  if(kind==="concha-v"||kind==="concha-c"){const cap=kind==="concha-v"?R.vanilla:R.choc,sc=kind==="concha-v"?R.vanillaD:R.chocD;let i=0;
    for(let r=0;r<2;r++)for(let c=0;c<3;c++,i++){const cx=gx(c,3),cy=gy(r);
      ctx.fillStyle=i===hot?R.crustD:R.crust;ctx.beginPath();ctx.arc(cx,cy,4.3,0,7);ctx.fill();
      ctx.fillStyle=cap;ctx.beginPath();ctx.arc(cx,cy,3.7,0,7);ctx.fill();
      ctx.strokeStyle=sc;ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(cx-2.4,cy-2.4);ctx.lineTo(cx+2.4,cy+2.4);ctx.moveTo(cx-2.4,cy+2.4);ctx.lineTo(cx+2.4,cy-2.4);ctx.stroke();}}
  else if(kind==="bolillo"){                                                                                             /* three, shingled, the same three the mesh lays */
    [[sx+10.4,sy+12.4],[sx+21.4,sy+15.6],[sx+14.6,sy+19.6]].forEach(([cx,cy],i)=>{
      ctx.fillStyle=i===hot%3?R.crustD:R.crust;ctx.beginPath();ctx.ellipse(cx,cy,6,2.4,0,0,7);ctx.fill();
      ctx.fillStyle=R.crumb;ctx.fillRect(cx-3,cy-0.9,6,1.4);});}                                                         /* la greña, seen from over it */
  else if(kind==="cuerno"){[[sx+10.4,sy+12.6],[sx+21.4,sy+15.8],[sx+14.6,sy+19.8]].forEach(([cx,cy],i)=>{
      ctx.strokeStyle=i===hot%3?R.crustD:R.crust;ctx.lineWidth=3.4;                                                      /* three, fat enough to have a hole */
      ctx.beginPath();ctx.arc(cx,cy,4.4,Math.PI*1.02,Math.PI*1.98);ctx.stroke();});}
  else if(kind==="oreja"){[[sx+10.4,sy+12.6],[sx+21.4,sy+15.8]].forEach(([cx,cy],i)=>{                                    /* TWO face up, the same two the mesh keeps: the front of the pan is bare */
      ctx.fillStyle=R.caramelD;ctx.beginPath();ctx.arc(cx-3,cy,3.4,0,7);ctx.arc(cx+3,cy,3.4,0,7);ctx.fill();            /* the caramelised outer turn of each curl */
      ctx.fillStyle=i===hot%2?R.caramel:R.caramelL;ctx.beginPath();ctx.arc(cx-2.5,cy-0.4,2.9,0,7);ctx.arc(cx+2.5,cy-0.4,2.9,0,7);ctx.fill();});}
  else if(kind==="polvoron"){const col=[R.pink,R.vain,R.cocoa];for(let c=0;c<3;c++){const cx=gx(c,3),cy=sy+16;           /* three, half again as big, in one row as the mesh lays them */
      ctx.fillStyle=R.cup;ctx.beginPath();ctx.arc(cx,cy,5.2,0,7);ctx.fill();ctx.fillStyle=col[(c+s)%3];ctx.beginPath();ctx.arc(cx,cy,4.5,0,7);ctx.fill();}}
  else if(kind==="muerto"){let i=0;for(let r=0;r<2;r++)for(let c=0;c<2;c++,i++){const cx=gx(c,2)+ (c?1:-1)*1.2,cy=gy(r);
      ctx.fillStyle=i===hot%4?R.crustD:R.crust;ctx.beginPath();ctx.arc(cx,cy,5.4,0,7);ctx.fill();
      ctx.strokeStyle=R.sugar;ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(cx-4.4,cy);ctx.lineTo(cx+4.4,cy);ctx.moveTo(cx,cy-4.4);ctx.lineTo(cx,cy+4.4);ctx.stroke();
      ctx.fillStyle=R.sugar;ctx.beginPath();ctx.arc(cx,cy,1.5,0,7);ctx.fill();}}};
/* the engine's own TILEDRAW["S"], verbatim (engine/engine.js, grep `shelving: three loaded shelves`): a pack's
   TILEART entry REPLACES the engine's top view for every world (Object.assign(TILEDRAW,TILEART)), so the
   five other businesses' shelves are drawn here, unchanged, by the pack that displaced them. */
const shelfTopEngine=rc=>{const{sx,sy}=rc;
  ctx.fillStyle="#8A6F4D";ctx.fillRect(sx+2,sy+2,TS-4,TS-4);
  ctx.fillStyle="#6E5638";[6,14,22].forEach(yy=>ctx.fillRect(sx+2,sy+yy,TS-4,2));
  ctx.fillStyle="#D9C9A3";[[6,3],[13,3],[20,3],[6,11],[15,11],[9,19],[18,19]].forEach(b=>ctx.fillRect(sx+b[0],sy+b[1],5,4));};
{const SHELF_SIDE=TILEART_SIDE["S"],SHELF_MESH=TILEART_MESH["S"];               /* the bookcase, kept whole for every world but the bakery */
 TILEART_SIDE["S"]=rc=>paHere()?paRackSide(rc):SHELF_SIDE(rc);
 TILEART_MESH["S"]=p=>paHere()?paRackMesh(p):SHELF_MESH(p);
 TILEART["S"]=rc=>paHere()?paRackTop(rc):shelfTopEngine(rc);}

/* ---- BEAUTIFY, THIRD SITTING — 2026-09-21, later still. Owner: "lets try the grass and the cones,
   dog house, and altar … can we also do the tree with its decor?" Five more shapes through the same
   seam, drawn by what each thing is made of. */

/* GRASS, STANDING. A tuft is blades from one root — cones, leaning outward, the ones toward the
   light longer and paler, one gone to straw — on a fist of soil. The tile is `stand` now, so the 3D
   camera asks for the shape; it has no side art, so the front and iso cameras keep painting it. */
TILEART_MESH["g"]=({x,y})=>{const h=(((x*7+y*13)%8)+8)%8,n=8+(h%3);
  const parts=[{s:"cyl",x:0,y:0.006,z:0,r:0.13,h:0.012,c:"#5A4632"}];                       /* the soil it holds */
  for(let i=0;i<n;i++){const a=i*(Math.PI*2/n)+h*0.35,lit=Math.cos(a+Math.PI*0.75)>0.2;
    const len=0.18+((i*3+h)%4)*0.04+(lit?0.04:0),lean=0.35+((i*5+h)%3)*0.15;              /* toward the light: longer */
    const bx=Math.cos(a)*0.045,bz=Math.sin(a)*0.045;
    parts.push({s:"cone",x:bx+Math.cos(a)*Math.sin(lean)*len*0.5,y:Math.cos(lean)*len*0.5,z:bz+Math.sin(a)*Math.sin(lean)*len*0.5,
      r:0.022,h:len,c:lit?"#A6DB8C":"#5E9E66",rx:Math.sin(a)*lean,rz:-Math.cos(a)*lean});}
  const a=h*0.9+2,len=0.16,lean=0.9;                                                        /* one blade gone to straw, nearly flat */
  parts.push({s:"cone",x:Math.cos(a)*Math.sin(lean)*len*0.5,y:Math.cos(lean)*len*0.5,z:Math.sin(a)*Math.sin(lean)*len*0.5,r:0.018,h:len,c:"#C9B66E",rx:Math.sin(a)*lean,rz:-Math.cos(a)*lean});
  return parts;};

/* THE TRAFFIC CONE. Moulded: a square base with a lip, the cone itself, and the reflective band —
   a slightly wider slice of cone, white, where the band is wrapped. A cone is the same from every
   side, which is why it was the one flat thing that never looked flat; it is a cone now anyway. */
TILEART_MESH["C"]=()=>[
  {s:"box",x:0,y:0.015,z:0,w:0.3,h:0.03,d:0.3,c:"#2A2D33"},                                 /* the base: black rubber, a thing on the tile, not paint on it (owner: "it overwrites/paints tiles") */
  {s:"box",x:0,y:0.04,z:0,w:0.2,h:0.02,d:0.2,c:"#3A3F46"},                                  /* the step the cone is moulded onto */
  {s:"cone",x:0,y:0.04+0.24,z:0,r:0.15,h:0.48,c:"#E0662B"},                                 /* the cone */
  {s:"cyl",x:0,y:0.24,z:0,rt:0.089,rb:0.108,h:0.06,c:"#F4F1EA"}];                           /* the band, wrapped where the cone is that wide */

/* THE DOGHOUSE. Built like a shed: a box body, two roof slabs meeting at a ridge, a dark arched
   door on the front, and the bone over it. The front faces the first open side. */
TILEART_MESH["9"]=({x,y})=>{
  const w=CW(),solid=(gx,gy)=>{const r=w&&w.grid&&w.grid[gy];return !r||r[gx]===undefined||SOLID.has(r[gx]);};
  const ry=!solid(x,y+1)?0:!solid(x+1,y)?Math.PI/2:!solid(x-1,y)?-Math.PI/2:Math.PI;
  const WALL="#8A6F4D",ROOF="#C0392B",RIDGE="#8E2A20",DOOR="#3E2F1E",BONE="#F6F2E8",pitch=0.62;
  const parts=[{s:"box",x:0,y:0.26,z:0,w:0.7,h:0.52,d:0.62,c:WALL},
    {s:"box",x:-0.19,y:0.62,z:0,w:0.46,h:0.035,d:0.74,c:ROOF,rz:pitch},{s:"box",x:0.19,y:0.62,z:0,w:0.46,h:0.035,d:0.74,c:ROOF,rz:-pitch},
    {s:"box",x:0,y:0.74,z:0,w:0.06,h:0.05,d:0.76,c:RIDGE},                                  /* the ridge cap */
    {s:"box",x:0,y:0.15,z:0.3,w:0.26,h:0.3,d:0.04,c:DOOR},{s:"cyl",x:0,y:0.3,z:0.3,r:0.13,h:0.04,c:DOOR,rx:Math.PI/2}, /* the arched door */
    {s:"box",x:0,y:0.47,z:0.32,w:0.14,h:0.03,d:0.02,c:BONE},{s:"sph",x:-0.08,y:0.47,z:0.32,r:0.028,c:BONE},{s:"sph",x:0.08,y:0.47,z:0.32,r:0.028,c:BONE}]; /* the bone */
  const cr=Math.cos(ry),sr=Math.sin(ry);
  return parts.map(p=>({...p,x:p.x*cr+p.z*sr,z:-p.x*sr+p.z*cr,ry:(p.ry||0)+ry}));};

/* THE TREE, WITH ITS DRESS. Grown: a bole that tapers off a root flare, five scaffold limbs fanning
   out of the fork, a flat crown of leaf masses in three greens laid on the limb ends, jacaranda
   blossom on the crown's outer skin in the season's bloom colour. Dressed for the night when the
   season says so — canopyDress's recipe, in parts: a garland of marigolds slung across the front,
   papel picado above it, three streamers hanging below and one sugar-skull lantern on a thread.
   One; three is a Christmas tree. Nothing without a season.

   A TREE YOU WALK UNDER — 2026-09-22, la jardinera. The owner asked first for "bigger", and when
   he was shown a tree of about two and three quarter tiles he said what he had actually wanted:
   "can we make it tall so we can walk underneath it all ghostly?" So it does not come down. The
   canopy goes OVERHEAD and wide enough that the tile you stand on is under it, and the engine
   turns the whole tile see-through while you are there (engine/engine3d.js, t3Top and
   T3CROWNGLASS — the crown has its own ghost, because the town shares T3GHOST and asked for
   nothing).

   It was never too SHORT. The shipped tree's top stood 1.800 against 1.096 for a shop front
   (wallH at lift 13) and 0.92 for a person (T3PERSON) — already the tallest thing on the street.
   It was too NARROW and too LOW-SLUNG: a ball 1.235 across whose foliage began at 0.780, below a
   person's head. A jacaranda is an UMBRELLA — a flat crown WIDER THAN THE TREE IS TALL, held high
   on a clear bole — and that is the shape that has an underneath at all.

   Both columns were measured the same way, by baking each part on its own through the engine's own
   t3MeshOf and reading the real transformed vertex bounds, so a rotated limb and a squashed sphere
   are measured as they are drawn. (Measured, not estimated, and not measured by two different
   methods either: an earlier draft of this table compared an exact disc integration against a
   box sample and the two are not the same number.)

     foliage bottom  0.780 -> 1.982   the leaves start at twice a person's height
     lowest of ANY   0.648 -> 1.925   part that is not the trunk — this is the headroom
     max reach       0.617 -> 1.414   from the trunk's axis. PAST the next tile's centre, which is
                                      the whole point: under 1.0 there is no tile you can stand on
                                      and have leaves above your head
     overhang        0.117 -> 0.914   past the tile edge, onto the pavement you walk on
     crown width     1.235 -> 2.828   wider than the tree is tall, which is a jacaranda
     plan area       1.069 -> 6.282 tiles²   +488%, and that is the number the eye reads as "bigger"
     top             1.800 -> 2.733   +52%
     parts, dressed    229 ->   152   BIGGER and CHEAPER: a ring of 6 heads, not a line of 7, and
                                      the tree stopped wearing a second papel picado of its own

   THE CANOPY WAS EATING THE PAPEL PICADO, and that is what set the height. The season strings real
   papel jacaranda-to-jacaranda (content/meridian/config.js `swags`; engine/engine3d.js hangs two
   flag rows at PH-0.11 = 1.79 and PH-0.33 = 1.57, each strip 0.22 tall, so the flags are y
   1.46-1.90; the two strings are 0.02-tall boxes centred at 1.90 and 1.68, so the HIGHEST thing in
   the whole swag is the top string's upper face at 1.91) and it runs along z = the tree tile's own
   centre — straight through the trunk's axis, the worst line there is. ELEVEN of the twelve
   jacarandas in the game are a swag endpoint, so this is not an edge case, it is the season. The
   twelfth is pk 19,8, which ends no swag and is left ending none: a swag is a ROW, the park has no
   second tall thing in row 8 to tie one to, and the engine plants a pole wherever an end is not
   tall (kind wall/facade/tree, or lift 9 or more — the park's fence is lift 5). So a swag there
   would put a new pole on the park's east fence, and the owner has written in twice about poles
   (2026-09-10, one at the bridge mouth he walked into; 2026-09-21, "poles with the paper picado").
   He asked for a bigger tree, not for more bunting. Measured: 41 poles in the game before this
   change and the same 41 after, on the same tiles.

   WHAT IS IN THE BAND, MEASURED OVER EVERY PART AND NOT JUST THE GREEN ONES — the earlier claim
   here was "0.000 eaten" and it had measured four green hexes, leaving out the bole, the limbs and
   the blossom, which is how a true sentence becomes a false one:

     shipped   0.822 of a tile   two crown spheres, one blossom AND the bole
     now       0.418 of a tile   THE BOLE, AND NOTHING ELSE

   The canopy, the five limbs and all seventeen blossoms clear the band completely: the lowest
   thing above the trunk is a limb at 1.925 and the swag's highest face is 1.91, which is a
   clearance of 0.015 of a tile — half a pixel at 35 px a tile. It reads clean in the frame and it
   is not a margin to spend: anything that drops a limb, or raises PH, closes it. What is left is the
   trunk itself, 0.418 wide where the flags cross it — and the engine skips the pole at a tree
   because a tree can hold a string, so that IS the thing the string is tied to. A street ties one
   to a bare bole under the leaves. (Both figures are upper bounds: each part is measured by the
   box around it, so a round thing is over-reported. A zero is therefore a true zero.)

   Three greens, not two, and the DARKEST on the skirt under the crown: one ambient 0.66 and one sun
   0.42 give a Lambert face 1.00 / 0.88 / 0.78 / 0.66 and no more, so the depth of a canopy has to
   be painted into the parts or it is not there. And the blossom was ten spheres of r 0.055 — under
   4 px on a phone, which is why a tree in flower read as a plain green one; it is seventeen
   flattened clusters of r 0.105-0.115 laid on the crown's outer skin — ten round the rim at radius
   1.18, where the silhouette is, and seven on top, where a jacaranda is seen from a window.

   AND THE BOLE IS THICKER, because it has to be. A crown 2.828 across on the old 0.34-wide trunk
   is a mushroom, not a tree: the trunk is 0.30 at the flare and 0.44 at the ground now, and the
   garland ring moved out from 0.24 to 0.29 to sit ON it rather than in it.

   THE DRESS. It used to hang at 0.84-1.02 inside foliage that came down to 0.780, so the tree wore
   its ofrenda where the leaves were. With the crown up at 1.982 the whole bole is clear, and the
   dress is hung on it the way a trunk is actually dressed: the garland is a RING of six marigolds
   round the bole at 1.10 rather than a line strung across the front of the tile with nothing to
   tie it to, two streamers hang either side, and the calaverita hangs BETWEEN them at 0.74 — in
   front of the bole, so the one white thing on this tree has its own dark behind it too. The
   tree's own two little papel strings are GONE: the real papel picado now passes this tree
   unbroken above the garland, and a second miniature one below it was competing with the thing it
   was imitating. */
TILEART_MESH["J"]=({x,y})=>{const h=(((x*7+y*13)%6)+6)%6,a0=h*1.05;
  const BARK="#6E4A2C",BARK2="#7C5636",G1="#5A9C66",G2="#86C48E",G3="#33663F",BLOOM=art("bloom","#B08FE0"); /* three steps: a lit mesh shades itself but only 1.5:1, so the canopy's own depth is painted */
  const parts=[{s:"cyl",x:0,y:0.09,z:0,rt:0.22,rb:0.30,h:0.18,c:BARK},                      /* the root flare — a tree meets the ground in one */
    {s:"cyl",x:0,y:1.20,z:0,rt:0.115,rb:0.22,h:2.04,c:BARK}];                                /* the bole: 0.18 to 2.22, and nothing else is attached to it below 1.925 (the lowest limb) — the papel picado passes under the leaves */
  for(let i=0;i<5;i++){const a=a0+i*1.2566+0.2;                                              /* five scaffold limbs, flat enough to stay above the flag band and long enough to be worth seeing */
    parts.push({s:"cyl",x:Math.cos(a)*0.16,y:2.20,z:Math.sin(a)*0.16,rt:0.030,rb:0.062,h:0.90,c:i%2?BARK2:BARK,rz:-1.05,ry:-a});}
  const lay=(n,rad,y,r,sy,c,off)=>{for(let i=0;i<n;i++){const a=a0+off+i*6.2832/n;
    parts.push({s:"sph",x:Math.cos(a)*rad,y,z:Math.sin(a)*rad,r,sy,c:typeof c==="function"?c(i):c});}};
  lay(8,1.00,2.15,0.42,0.40,G3,0.45);                                                         /* the skirt: the underside, the darkest green, and the thing you stand under */
  lay(8,0.76,2.30,0.50,0.42,i=>i%2?G2:G1,0);                                                  /* the crown proper, flattened: an umbrella, not a ball */
  lay(4,0.32,2.44,0.46,0.42,i=>i%2?G1:G2,0.4);
  parts.push({s:"sph",x:0,y:2.54,z:0,r:0.42,sy:0.46,c:G2});                                   /* the crest, palest: the sun lands on the top of a canopy */
  for(let i=0;i<10;i++){const a=a0+i*0.6283+0.35;                                              /* blossom on the OUTER SKIN — the rim, where the silhouette is */
    parts.push({s:"sph",x:Math.cos(a)*1.18,y:2.22+(i%3)*0.07,z:Math.sin(a)*1.18,r:0.115,sy:0.6,c:BLOOM});}
  for(let i=0;i<7;i++){const a=a0+i*0.8976+0.9,rad=0.18+(i%3)*0.26;                            /* and on the top, where a jacaranda is seen from a window */
    parts.push({s:"sph",x:Math.cos(a)*rad,y:2.60+(i%2)*0.06,z:Math.sin(a)*rad,r:0.105,sy:0.55,c:BLOOM});}
  const pal=art("papel",null);
  if(pal){const P=petalPal();                                                                  /* THE DRESS, FOURTH TRY — wrapped round the bole, in the clear air UNDER the street's papel */
    for(let i=0;i<6;i++){const a=a0*0.7+i*1.0472;                                               /* the garland is a RING round the trunk now, not a line hung on nothing */
      meshMarigold(parts,Math.cos(a)*0.29,1.10+Math.sin(a*2)*0.02,Math.sin(a)*0.29,0.085,P,h+i);}  /* ring RADIUS 0.29, not 0.24: the bole's radius at this height is 0.173 (it is 0.345 of a tile wide), so a ring at 0.29 sits ON the bark rather than inside it */
    [-0.34,0.34].forEach((dx,i)=>{parts.push({s:"cyl",x:dx,y:1.00,z:0.42,r:0.006,h:0.20,c:"#3A2E26"}); /* the thread, off the ring's widest point */
      parts.push({s:"box",x:dx,y:0.74,z:0.42,w:0.16,h:0.32,d:0.008,c:pal[(i+2)%pal.length]});         /* the streamer, hanging clear below the garland */
      parts.push({s:"box",x:dx,y:0.555,z:0.42,w:0.16,h:0.05,d:0.008,c:pal[(i+5)%pal.length]});});     /* its scalloped hem, a second colour */
    parts.push({s:"cyl",x:0,y:0.90,z:0.30,r:0.006,h:0.24,c:"#3A2E26"});                                /* one lantern: a calaverita on a thread, hung BETWEEN the streamers */
    parts.push({s:"sph",x:0,y:0.74,z:0.30,r:0.085,c:"#F6F2E8"});                                       /* and against the BOLE, which is 0.382 of a tile wide here (radius 0.191) against a skull of radius 0.085: a white skull needs a dark behind it too */
    parts.push({s:"sph",x:-0.035,y:0.758,z:0.375,r:0.018,c:"#3A2E26"},{s:"sph",x:0.035,y:0.758,z:0.375,r:0.018,c:"#3A2E26"}); /* the eyes */
    parts.push({s:"sph",x:0,y:0.818,z:0.33,r:0.025,c:"#E8478F"});}                                     /* the flower on its brow */
  return parts;};

/* LA OFRENDA, AS A THING ON A TABLE. A season prop, not a tile: the key is "prop:ofrenda" and the
   engine asks for it where the season sets the altar down. The 2D drawing's parts, built: the lower
   cloth, the upper tier, the arch as a torus with marigolds along it, three candles with flames, the
   empty frame at the top, pan de muerto, a calaverita, two cups of water, and cut paper along the
   front. Nothing without a season. */
TILEART_MESH["prop:ofrenda"]=()=>{const P=petalPal(),pal=art("papel",["#E8478F","#2FA5A0","#F2B705"]);
  /* SECOND TRY (owner: "add more detail to the altar"). Three tiers, as an ofrenda is built — earth, the
     middle, heaven — a cloth over each, an arch of ruffled marigolds, seven candles in glass, sugar
     skulls, two pan de muerto, oranges, a glass of water and a dish of salt, copal in its burner, the
     empty frame at the top, cut paper across the front of every tier and across the arch, and a path
     of loose petals on the ground in front, which is how the way is shown. */
  const parts=[{s:"box",x:0,y:0.14,z:0.02,w:0.96,h:0.28,d:0.56,c:"#5A2E7A"},{s:"box",x:0,y:0.285,z:0.02,w:0.96,h:0.01,d:0.56,c:"#7B4BA8"},   /* tier one: the cloth */
    {s:"box",x:0,y:0.39,z:-0.08,w:0.7,h:0.2,d:0.36,c:"#E2620F"},{s:"box",x:0,y:0.495,z:-0.08,w:0.7,h:0.01,d:0.36,c:"#F2870F"},              /* tier two */
    {s:"box",x:0,y:0.6,z:-0.17,w:0.44,h:0.2,d:0.2,c:"#2FA5A0"},{s:"box",x:0,y:0.705,z:-0.17,w:0.44,h:0.01,d:0.2,c:"#7BD3F7"},                /* tier three: heaven */
    {s:"torus",x:0,y:0.62,z:-0.24,r:0.46,t:0.028,arc:Math.PI,c:"#7A2E12"},                                                                /* the arch */
    {s:"cyl",x:-0.46,y:0.31,z:-0.24,r:0.028,h:0.62,c:"#7A2E12"},{s:"cyl",x:0.46,y:0.31,z:-0.24,r:0.028,h:0.62,c:"#7A2E12"}];               /* its legs, to the ground */
  for(let i=0;i<9;i++){const t=Math.PI*(0.06+0.88*i/8);meshMarigold(parts,Math.cos(t)*0.46,0.62+Math.sin(t)*0.46,-0.24,0.062,P,i);}       /* the arch's marigolds */
  meshPapel(parts,-0.42,0.62,-0.22,0.42,0.62,-0.22,pal,7,2);                                                                              /* cut paper across the arch */
  [[-0.4,0.29,0.18],[-0.25,0.29,0.22],[0.25,0.29,0.22],[0.4,0.29,0.18],[-0.2,0.5,0],[0.2,0.5,0],[0,0.71,-0.12]].forEach(([cx,cy,cz],i)=>{ /* seven veladoras */
    parts.push({s:"cyl",x:cx,y:cy+0.055,z:cz,r:0.03,h:0.11,c:i%2?"#F6F2E8":"#FBB024"});parts.push({s:"cyl",x:cx,y:cy+0.115,z:cz,r:0.032,h:0.01,c:"#FFF3C0"});
    parts.push({s:"cone",x:cx,y:cy+0.15,z:cz,r:0.014,h:0.05,c:"#FFC300"});});
  parts.push({s:"box",x:0,y:0.86,z:-0.2,w:0.22,h:0.2,d:0.03,c:"#3A2E26"},{s:"box",x:0,y:0.86,z:-0.18,w:0.16,h:0.14,d:0.01,c:"#F6F2E8"});   /* the empty frame, nobody named */
  [[-0.14,0.29,0.14],[0.14,0.29,0.14]].forEach(([px,py,pz])=>{parts.push({s:"sph",x:px,y:py+0.06,z:pz,r:0.065,sy:0.8,c:"#B8722E"});       /* two pan de muerto */
    parts.push({s:"box",x:px,y:py+0.115,z:pz,w:0.02,h:0.02,d:0.12,c:"#E8B86A"},{s:"box",x:px,y:py+0.115,z:pz,w:0.12,h:0.02,d:0.02,c:"#E8B86A"},{s:"sph",x:px,y:py+0.125,z:pz,r:0.02,c:"#E8B86A"});});
  [[-0.3,0.5,-0.04],[0.3,0.5,-0.04],[0.1,0.71,-0.2]].forEach(([px,py,pz],i)=>{parts.push({s:"sph",x:px,y:py+0.055,z:pz,r:0.055,c:"#F6F2E8"}); /* three calaveritas */
    parts.push({s:"sph",x:px-0.02,y:py+0.065,z:pz+0.05,r:0.011,c:"#3A2E26"},{s:"sph",x:px+0.02,y:py+0.065,z:pz+0.05,r:0.011,c:"#3A2E26"},{s:"sph",x:px,y:py+0.105,z:pz+0.02,r:0.016,c:i?"#2FA5A0":"#E8478F"});});
  [[-0.05,0.5,0.06],[0.03,0.5,0.1]].forEach(([px,py,pz])=>parts.push({s:"sph",x:px,y:py+0.045,z:pz,r:0.045,c:"#F2870F"}));                 /* oranges */
  parts.push({s:"cyl",x:-0.32,y:0.325,z:0.08,r:0.03,h:0.07,c:"#DDEBF2"},{s:"cyl",x:-0.32,y:0.35,z:0.08,r:0.028,h:0.01,c:"#9CC7E0"});      /* a glass of water */
  parts.push({s:"cyl",x:0.34,y:0.3,z:0.06,r:0.045,h:0.02,c:"#8A6F4D"},{s:"cyl",x:0.34,y:0.315,z:0.06,r:0.03,h:0.012,c:"#F6F2E8"});        /* salt in a dish */
  parts.push({s:"cyl",x:0,y:0.31,z:0.2,rt:0.04,rb:0.03,h:0.05,c:"#4A3524"},{s:"sph",x:0,y:0.36,z:0.2,r:0.018,c:"#E2620F"});               /* copal in its burner, lit */
  for(let i=0;i<3;i++)parts.push({s:"sph",x:0.01*i,y:0.42+i*0.06,z:0.2,r:0.02+i*0.01,c:"#C9C1B3"});                                        /* its smoke */
  meshPapel(parts,-0.46,0.28,0.31,0.46,0.28,0.31,pal,7,0);meshPapel(parts,-0.34,0.49,0.11,0.34,0.49,0.11,pal,5,3);                        /* cut paper across each tier's front */
  for(let i=0;i<14;i++){const t=i/14;parts.push({s:"sph",x:-0.3+Math.sin(i*2.1)*0.14,y:0.012,z:0.32+t*0.16,r:0.02,sy:0.4,c:P[2+(i%4)]});}   /* the petal path, on the ground in front */
  return parts;};

/* THE TABLE (owner: "tables too"). What the 2D drawing says it is: a round table with a gingham cloth,
   two plates, a chair either side. Built as it is made: a pedestal on a foot, the top, the cloth as a
   check of red squares laid on cream inside the circle, two plates, and two chairs — a seat on four
   legs with a back — facing each other across it. */
TILEART_MESH["T"]=({x,y})=>{const sd=(((x*7+y*13)%4)+4)%4,WOOD="#5E3B20",CLOTH="#F2E8D8",CHECK="#C0392B",PLATE="#FFFFFF",RIM="#C9CDD2";
  const parts=[{s:"cyl",x:0,y:0.015,z:0,r:0.16,h:0.03,c:WOOD},{s:"cyl",x:0,y:0.26,z:0,r:0.04,h:0.46,c:WOOD},                              /* the foot and the pedestal */
    {s:"cyl",x:0,y:0.505,z:0,r:0.34,h:0.03,c:CLOTH}];                                                                                    /* the top, under the cloth */
  for(let i=-3;i<3;i++)for(let j=-3;j<3;j++){if((i+j+8)%2)continue;const cx=(i+0.5)*0.1,cz=(j+0.5)*0.1;if(Math.hypot(cx,cz)>0.29)continue;
    parts.push({s:"box",x:cx,y:0.522,z:cz,w:0.1,h:0.004,d:0.1,c:CHECK});}                                                                 /* the gingham, a check clipped to the circle */
  [[-0.14,0],[0.14,0]].forEach(([px,pz])=>{parts.push({s:"cyl",x:px,y:0.53,z:pz,r:0.09,h:0.012,c:PLATE},{s:"cyl",x:px,y:0.537,z:pz,r:0.055,h:0.004,c:RIM});}); /* two plates */
  [[-0.43,0],[0.43,Math.PI]].forEach(([px,ry])=>{const cr=Math.cos(ry),sr=Math.sin(ry),at=(lx,lz)=>({x:px+lx*cr+lz*sr,z:-lx*sr+lz*cr});   /* two chairs, facing the table */
    let q=at(0,0);parts.push({s:"box",x:q.x,y:0.28,z:q.z,w:0.22,h:0.03,d:0.22,c:WOOD,ry});
    q=at(-0.1,0);parts.push({s:"box",x:q.x,y:0.42,z:q.z,w:0.03,h:0.26,d:0.22,c:WOOD,ry});                                                /* the back, on the far side */
    [[-0.09,-0.09],[0.09,-0.09],[-0.09,0.09],[0.09,0.09]].forEach(([lx,lz])=>{const l=at(lx,lz);parts.push({s:"cyl",x:l.x,y:0.13,z:l.z,r:0.014,h:0.26,c:WOOD});});});
  return parts;};

/* ---- LA MESA DE ALTAR (owner, 2026-09-22: "dona tenchas table is too small. take it out when its
   dia de los muertos or alebrijes mode and replae it with a bigger table for the altar. please") ----

   MEASURED, NOT FELT. Out of the built geometry: the ofrenda is 0.834 wide by 0.639 deep once the
   engine has scaled it to 0.8, and the round table's cloth is a disc of radius 0.34 — 0.68 across.
   THE ALTAR IS WIDER THAN THE TABLE IT STANDS ON, by 0.154, which is why its base hangs in the air
   either side and why the only thing you can see under it is a pedestal. He is right and it is a
   number, not an impression.

   WHAT A HOUSE DOES. You do not balance an ofrenda on the round table you eat at. You carry in the
   long table, and you CLEAR it — so the round table's own two chairs go with it. The two chairs
   still in the room are the `⊔` tiles at (4,2) and (3,3); they are somebody else's tiles and they
   are not touched.

   THE THREE THINGS THAT WERE THIS LANE'S TO ASK AND ARE NOT OPEN ANY MORE. They were put to the
   owner as questions and he answered all three the same day (docs/ASKS.md, 2026-09-22, third
   window), so they are settled and nobody re-opens them from this file:
     · the cloth is CREAM WITH THE MARIGOLD BORDER, not purple and not white with a runner — "ok on
       the altar";
     · the round table's TWO CHAIRS DO GO AWAY while the altar is up — "ok thats cool";
     · the table is the SAME HEIGHT and wider only — "yeah same height of the altar table". That one
       is also why `TOP` below is 0.550 to the thousandth and not a round number: it is the height
       the altar already stood at, so `TILES.T.lift` of 6 stays honest for the cameras that never ask
       a shape how tall it is.

   AND ONE MEASUREMENT HIS ANSWER OVERRULES, WRITTEN DOWN SO IT IS NOT REDISCOVERED AS A BUG. Between
   this lane's first round and its second, every person in both games was rescaled from 1.12 to 0.92
   (`T3PERSON`, engine/engine3d.js:1263). NOTHING IN THIS TABLE WAS SIZED AGAINST A PERSON — its top
   was sized against the altar's own standing height and its width against the altar's measured
   footprint — but the RATIO moved underneath it all the same: 0.550 was 0.49 of a person and is now
   0.60 of one, so against the new cast this table reads nearer the chest than the hip. He was asked
   the height question directly and said "yeah same height of the altar table", so it stays at 0.550.
   If he ever says it looks high, the number to change is `TOP` here and nothing else — but it is HIS
   to say, and a lane that lowered it on a ratio would be overruling him with arithmetic.

   WHERE THIS TABLE ACTUALLY STOPS, corrected 2026-09-22 after a reader measured it. ±0.477 is the
   MANTEL'S LIP (`MW = HW + 0.022`) and that is the number this comment used to give. It is not the
   number the mesh produces: the pleat panels stand `out` = 0.006 proud of the lip and are 0.016
   thick, and each hem border is drawn `bw + 0.008`, so the BUILT shape runs x -0.491..0.491 and
   z -0.361..0.501 — which in the room is x 3.009..3.991, z 2.139..3.001, and means the table crosses
   its own tile's far edge by 0.001 into the chair's tile at (3,3). The clearance claim survives the
   correction and is now a measurement rather than an inference: chair(4,2) starts at x 4.300, a gap
   of 0.309; chair(3,3) starts at z 3.300, a gap of 0.299; no Box3 intersection with either, in both
   seasons. Nothing grows through a chair — but the number offered as proof was the wrong number, and
   in this repository a comment is the record.

   SCOPED TO THE TILE THE ALTAR IS ON, NEVER TO THE SEASON. There are EIGHT `T` tiles in this game
   and SEVEN of them are not hers: La Cocina's four dinner tables (lc 3,3 · 7,3 · 11,3 · 15,3), La
   Panadería's two (pa 15,5 · 13,7) and one in the lobby (lo 11,5) — that last one is the eighth, and
   an earlier draft of this comment said "eight" and then named six, which is how a census that nobody
   counted reads. A season-wide swap would set a funeral table under four restaurant dinners, in both
   seasons, and nobody would have found it until he did. So the question the pack asks is the true
   one — *is there an ofrenda standing on THIS tile* — which `fiestaProps` answers out of the season
   the prop is declared in. Out of season it returns nothing, every table in the game is the one it
   has always been, and this file has added one comparison to the round table's path and no pixels.

   WHAT IT COSTS, MEASURED, because the first draft of this comment called it a wash and it is not.
   The round table is 31 parts; this one is 94 (4 legs + 4 rails + plank + mantel + two 11-pleat sides
   at 23 each + two 9-pleat sides at 19 each). The tile's own geometry goes 2376 -> 3384 vertices, so
   792 -> 1128 triangles, and the whole casa-w scene goes 25356 -> 25692 in muertos AND in alebrije:
   an INCREASE of 336 triangles, about 1.3% of the room, and only while the season is on. That is a
   price worth paying and it is small, but it is a price. (The renderer's own INFO line is no use for
   this — it reports the LAST frame drawn, so in a flat camera it still shows the 3D frame before it,
   which is how the first draft came to report a decrease. Sum `position.count/3` over the group.)

   THE HEIGHT IS DELIBERATELY UNCHANGED. `TILES.T.lift` is 6 and `wallH` turns that into 0.802 for
   the cameras that do not ask a shape how tall it is; a taller table in 3D would be a lie in those.
   The cloth's upper face is the last ink in this mesh at 0.550 — the same 0.550 `t3Top` handed the
   engine before — so the altar arrives at exactly the height it arrived at yesterday. What changed
   is what is under it: 0.550 used to be the top of TWO CHAIR BACKS (the cloth stopped at 0.520), so
   the altar was standing on two 0.03-thick slats with a table's width of air between them. Now it
   is standing on a table.

   Built in the order one is built: four legs, the rails that stop a long table racking, the plank,
   the mantel over it, and the marigold hem somebody sewed on the mantel. NOTHING IS SET ON IT — it
   was cleared for the altar, which is also what keeps the cloth the tallest ink in the mesh. */
const TABLE_ROUND=TILEART_MESH["T"];
const altarOnTile=(x,y)=>(typeof fiestaProps==="function"?fiestaProps(typeof world!=="undefined"?world:"")
  :[]).some(p=>p.kind==="ofrenda"&&p.x===x&&p.y===y);
const meshMesaAltar=()=>{
  const LEG="#4A2E19",PLANK="#5E3B20",MANTEL="#F2E8D8",HEM="#F2870F";
  const HW=0.455,HD=0.395,CZ=0.07;                 /* the top's half-width, half-depth, and how far forward it sits:
                                                      the altar's own footprint is centred at z 0.07, not at the tile's middle,
                                                      because its petal path lies on the cloth in front of it */
  const TOP=0.550,CL=0.016,PLK=0.036,UND=TOP-CL-PLK; /* cloth face, cloth, plank, and the plank's underside at 0.498 */
  const IN=0.055,parts=[];
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>parts.push(                                    /* 1 · four legs, squared stock, set in from the corners */
    {s:"box",x:sx*(HW-IN),y:UND/2,z:CZ+sz*(HD-IN),w:0.052,h:UND,d:0.052,c:LEG}));
  parts.push({s:"box",x:0,y:UND-0.055,z:CZ-(HD-IN),w:2*(HW-IN),h:0.05,d:0.03,c:LEG},              /* 2 · the rails that tie them */
             {s:"box",x:0,y:UND-0.055,z:CZ+(HD-IN),w:2*(HW-IN),h:0.05,d:0.03,c:LEG},
             {s:"box",x:-(HW-IN),y:UND-0.055,z:CZ,w:0.03,h:0.05,d:2*(HD-IN),c:LEG},
             {s:"box",x:HW-IN,y:UND-0.055,z:CZ,w:0.03,h:0.05,d:2*(HD-IN),c:LEG});
  parts.push({s:"box",x:0,y:UND+PLK/2,z:CZ,w:2*HW,h:PLK,d:2*HD,c:PLANK});                          /* 3 · the plank, air under it */
  const MW=HW+0.022,MD=HD+0.022,HANG=TOP-CL;                                                       /*    the mantel's lip, and the height the cloth falls from */
  parts.push({s:"box",x:0,y:TOP-CL/2,z:CZ,w:2*MW,h:CL,d:2*MD,c:MANTEL});                           /* 4 · the mantel — the last ink in the mesh, and what the altar stands on */
  /* 5 · THE CLOTH FALLS IN PLEATS, because a mantel is gathered over a table and not painted on it:
        one panel per pleat, its face stepped in or out by a thread's width and shaded for the fold,
        and the hem cut in teeth — which is the only part of this that survives being looked at from
        across a room, because at that size a table is a silhouette and two colours. */
  const PLEAT=[MANTEL,"#DCCBB0"],TIP=0.034,side=(bx,bz,bw,bd,n,along)=>{
    for(let i=0;i<n;i++){const t=(i+0.5)/n-0.5,out=(i%2?0.006:0),lo=(i%2?0.215:0.175);            /*    teeth: every other pleat hangs 0.040 lower */
      const px=along?bx+t*bw:bx+(bx<0?-out:out),pz=along?bz+(bz<CZ?-out:out):bz+t*bd;
      const pw=along?bw/n:0.016,pd=along?0.016:bd/n;
      parts.push({s:"box",x:px,y:(HANG+lo+TIP)/2,z:pz,w:pw,h:HANG-lo-TIP,d:pd,c:PLEAT[i%2]});      /*    the cream mantel */
      parts.push({s:"box",x:px,y:lo+TIP/2,z:pz,w:pw,h:TIP,d:pd,c:HEM});}                           /*    and the marigold cloth UNDER it, showing at the tooth */
    parts.push({s:"box",x:bx,y:HANG-0.030,z:bz,w:bw+0.008,h:0.042,d:bd+0.008,c:HEM});};            /*    the same cloth's border, sewn under the table's edge */
  side(0,CZ-MD,2*MW,0.016,11,true); side(0,CZ+MD,2*MW,0.016,11,true);
  side(-MW,CZ,0.016,2*MD,9,false);  side(MW,CZ,0.016,2*MD,9,false);
  return parts;};
TILEART_MESH["T"]=p=>altarOnTile(p.x,p.y)?meshMesaAltar():TABLE_ROUND(p);

/* ---- THE SAME TABLE IN THE OTHER THREE CAMERAS ----
   The first round of this change was a 3D-camera change only, and the reader was right to call it
   two-thirds of the ask: in top, front and iso the altar still stood over the ROUND table. It is
   worth being exact about what those cameras were showing, because "the altar is on bare floor" is
   not quite it and the difference is what makes this fixable from the pack:

     · FRONT — `TILESIDE["T"]` IS drawn, under the ofrenda sprite, which the engine lifts 10px on a
       solid tile. What shows below and either side of the sprite is the round table's profile: two
       thin dark legs and a gingham edge. A table, and the wrong one.
     · TOP — `TILEDRAW["T"]` is drawn first and the sprite paints over it, but the ofrenda's marigold
       ARCH is an arch: you see the tile's own art through it. What you see through it is red gingham.
     · ISO — and this one is NOT fixable from here, so it is written down rather than claimed. The
       isometric camera never draws a solid tile's art at all: `drawIso` builds `ISOCOL`
       (engine/engine.js:862) and paints `T` as one flat colour, `#C9A96A`. Before this change and
       after it, iso shows a coloured block under the ofrenda. Giving it the drawing is an engine
       change and belongs to whoever owns that camera. THE OWNER HAS SINCE TABLED THE ISO CAMERA —
       "can we table it iso?" (docs/ASKS.md, 2026-09-22), filed as issue #233 — so the flat block
       under this table in that one camera is a known, filed gap and not an oversight of this lane.

   So FRONT and TOP were already drawing this table and neither had been told it changed. Two drawings
   fix both, and no engine file is touched.

   HOW THE ROUND TABLE SURVIVES THIS. Its 2D art belongs to the ENGINE (`TILEDRAW["T"]`,
   `TILESIDE["T"]`) and not to this pack, unlike its mesh, which is ours at the top of this section.
   A pack's usual move is a flat override — `TILEART["T"]=fn` — and here that would throw the engine's
   round table away for La Cocina's four dinner tables and La Panadería's two as well, or force a copy
   of the engine's drawing into this file to hand back to them, which is a second copy to go stale.
   Neither is acceptable for six tables nobody asked about.

   So this takes the engine's own drawing and puts itself in front of it. `TILEART`/`TILEART_SIDE` are
   merged into the engine's tables by `Object.assign` (engine/engine.js:1961 and :2186) — which READS
   each source key and then WRITES it — so a getter on "T" is handed the engine's original at exactly
   the moment before it is replaced, keeps it, and returns a wrapper that calls it for every tile that
   is not Doña Tencha's. `__mesaAltar` is there so it can never capture itself.

   THE ONE-LINE BUG THIS USED TO HAVE, AND WHY IT IS WRITTEN OUT IN FULL. The first draft built the
   wrapper on the FIRST get and kept it — `if(!fn){ …capture…; fn=…; }` — so whatever the capture
   found on that first read was frozen for the life of the page, INCLUDING FINDING NOTHING. The read
   that matters is the engine's `Object.assign`, but it is not the only read there can be: anything
   that so much as touches `TILEART.T` before engine.js has built `TILEDRAW` — a line further down
   this file, a second pack file, a future tool that enumerates the pack's art — fires the getter
   while `TILEDRAW` is still a ReferenceError, the catch swallows it, `round` is frozen null, and
   from then on THE WRAPPER DRAWS NOTHING for every tile that is not the altar's. That is not a
   near-miss. Planted on 2026-09-22 as one added line (`void TILEART.T;` between the two installs),
   it erased La Cocina's four dinner tables, La Panadería's two and the lobby's one from the top
   camera — bare floor where seven tables were — and `node test/smoke.js` printed
   "OK — 60 quests, maxXP 880, all invariants hold." The picture is in the lane's before/after.

   THE FIX IS THAT A FAILED CAPTURE IS NEVER REMEMBERED. The wrapper is built once, so its identity
   is stable for anyone comparing it; `round` is filled by the first capture that actually SUCCEEDS
   and every get before that tries again. An early read now costs nothing, because the engine's own
   `Object.assign` comes afterwards and that is the read that finds the original. A late read is
   harmless too: by then `TILEDRAW.T` is this wrapper and `__mesaAltar` sends it away. There is one
   failure this cannot repair — this file parsed AFTER engine.js — and it is not this seam's to
   repair, because then `typeof TILEART!=="undefined"` is false at engine.js:1961 and the pack's
   ENTIRE art table is dropped, altar and all. The guard in test/smoke.js is red for both: it asserts
   that the altar's tile is drawn DIFFERENTLY in season (which catches a wrapper that never got
   installed) and that every table in the game is drawn AS SOMETHING AT ALL (which catches a wrapper
   installed with nothing behind it — the blank-equals-blank hole the old guard passed). */
const wrapTableArt=(tbl,peek,mine)=>{let round=null;
  const fn=rc=>altarOnTile(rc.x,rc.y)?mine(rc):(round?round(rc):undefined);
  fn.__mesaAltar=true;
  Object.defineProperty(tbl,"T",{configurable:true,enumerable:true,get(){
    if(!round){try{const e=peek();if(typeof e==="function"&&!e.__mesaAltar)round=e;}catch(err){}}
    return fn;}});};

/* FROM ABOVE. The numbers are the built mesh's own, so the drawing and the shape cannot drift: the
   mantel measures x -0.491..0.491 and z -0.361..0.501 of its tile, which on a 32px tile is x 0.3..31.7
   and y 4.4..32.0 — wider than the round table's 24px gingham disc on every side, and running off the
   near edge because the table stands forward in its tile. Cream, a marigold border, the pleats ticked
   along the near edge, and NOTHING SET ON IT: it was cleared for the altar. */
const drawMesaTop=rc=>{const{sx,sy}=rc,X0=sx+0.3,X1=sx+31.7,Y0=sy+4.4,Y1=sy+32,W=X1-X0;
  ctx.fillStyle="#E8952A";ctx.fillRect(X0,Y0,W,Y1-Y0);                                    /* the marigold border, seen as the lip all round */
  ctx.fillStyle="#F2E8D8";ctx.fillRect(X0+1.8,Y0+1.8,W-3.6,Y1-Y0-1.8);                    /* the mantel's face */
  ctx.fillStyle="rgba(150,130,100,.16)";
  for(let i=1;i<11;i+=2)ctx.fillRect(X0+1.8+i*(W-3.6)/11,Y0+1.8,(W-3.6)/11,Y1-Y0-1.8);    /* the pleats, from above */
  ctx.fillStyle="#E8952A";for(let i=0;i<11;i+=2)ctx.fillRect(X0+i*W/11,Y1-2.2,W/11,2.2);};/* the toothed hem on the near edge */

/* FROM THE FRONT. The tabletop stays at sy+13 — the height the engine's round table has always drawn
   it at — because the altar's standing height did not move and a camera that drew it lower would be
   the lie the brief warned about. Below it the cloth falls in pleats to a toothed marigold hem, and the
   legs show in the last few pixels. Full tile width, against the round table's 26. */
const drawMesaSide=rc=>{const{sx,sy}=rc;
  ctx.fillStyle="#4A2E19";ctx.fillRect(sx+3,sy+26,3.5,5.5);ctx.fillRect(sx+25.5,sy+26,3.5,5.5); /* the two front legs, showing below the hem */
  ctx.fillStyle="#F2E8D8";ctx.fillRect(sx+0.3,sy+13,31.4,3);                                /* the mantel over the edge of the plank */
  ctx.fillStyle="#FFFFFF";ctx.fillRect(sx+0.3,sy+13,31.4,1);                                /* light on the fold */
  ctx.fillStyle="#EFE2CE";ctx.fillRect(sx+1,sy+16,30,10.2);                                 /* the cloth falling */
  ctx.fillStyle="rgba(150,130,100,.22)";
  for(let i=1;i<11;i+=2)ctx.fillRect(sx+1+i*30/11,sy+16,30/11,10.2);                        /* its pleats */
  ctx.fillStyle="#E8952A";ctx.fillRect(sx+1,sy+24.6,30,1.6);                                /* the marigold border, sewn round */
  for(let i=0;i<11;i++)ctx.fillRect(sx+1+i*30/11,sy+26.2,30/11,i%2?2.6:1.3);};              /* and the hem, cut in teeth */

wrapTableArt(TILEART,()=>TILEDRAW.T,drawMesaTop);
wrapTableArt(TILEART_SIDE,()=>TILESIDE.T,drawMesaSide);

/* ---- BEAUTIFY, CREW ITERATION 11 — el taller ---- 2026-09-21. The interiors and the garage. Owner:
   "computers, … desks, … coffee machines, fridge, … car lifts, tires, car, and tool boxes." Seven shapes
   through the same seam, each built from what its own 2D drawing says it is made of (TILEDRAW / TILESIDE
   in the engine, TILE_PROPS above), in the order a person made it. VALUES ARE PAINTED, NOT LEFT TO THE
   LIGHT: with the day's ambient and sun a Lambert face gets 1.00 on top, 0.88 east, 0.78 south and 0.66
   west and north (Pili, from engine3d.js), so a step you want between two parts goes into their colours,
   and the darkest thing in a room is dark because it was painted dark. WHAT THESE REPLACE: an engine box
   wore its top-down drawing on its lid and took its height from the tallest ink in its side drawing
   (engine3d.js, t3BoxMats) — so a cup lay on its back on every counter tile, a second monitor sat on every
   desk's lid, the tool chest wore its drawers on top, and the counter run stepped up at machine tiles. All
   of that goes with the box. Two helpers: which way a thing faces (the shelf's rule — the first open
   side, south, east, west, north) and the turn that puts it there. */
const meshFacing=(x,y)=>{const w=CW(),solid=(gx,gy)=>{const r=w&&w.grid&&w.grid[gy];return !r||r[gx]===undefined||SOLID.has(r[gx]);};
  return !solid(x,y+1)?0:!solid(x+1,y)?Math.PI/2:!solid(x-1,y)?-Math.PI/2:Math.PI;};
const meshTurned=(parts,ry)=>{const cr=Math.cos(ry),sr=Math.sin(ry);return parts.map(p=>({...p,x:p.x*cr+p.z*sr,z:-p.x*sr+p.z*cr,ry:(p.ry||0)+ry}));};

/* THE DESK (owner: "computers", "desks"). What TILEDRAW["D"] and TILESIDE["D"] say it is: a slab on a
   left leg and a drawer unit on the right, an apron under it, three drawers with pulls, a monitor on a
   stand, a sheet of paper. Made in that order: the leg panel and the pedestal, the slab over them with
   AIR under it and the floor showing between, its underside painted dark (the shade under any top), a
   lit front edge, the three drawer faces and their pulls, then what was set on the slab — the monitor
   toward the back, a thin panel on a stalk on a foot disc, the screen the lightest thing on the desk; a
   keyboard under it (a monitor with nothing under it is a television); the paper on the left. Nothing
   reaches past ±0.46: HQ lays desks side by side. Faces the first open side, like the shelf. */
TILEART_MESH["D"]=({x,y})=>{
  const WOOD=C.desk,TOP=C.deskTop,UNDER="#3A2E26",EDGE="#C4A878",INK="#23272C",KEYS="#2F343A",SCREEN="#7FB3D5",PAPER="#F4F1EA",PULL="#D9C9A3";
  const parts=[{s:"box",x:-0.41,y:0.215,z:0,w:0.05,h:0.43,d:0.54,c:WOOD},                 /* the leg panel, left */
    {s:"box",x:0.27,y:0.215,z:-0.03,w:0.34,h:0.43,d:0.48,c:WOOD},                         /* the drawer pedestal, right, its faces set back from the slab's edge */
    {s:"box",x:0,y:0.455,z:0,w:0.9,h:0.04,d:0.6,c:TOP},                                   /* the slab, air under it */
    {s:"box",x:0,y:0.425,z:0,w:0.86,h:0.02,d:0.56,c:UNDER},                               /* its underside, painted dark */
    {s:"box",x:0,y:0.47,z:0.297,w:0.9,h:0.012,d:0.012,c:EDGE}];                           /* the lit front edge */
  [0.08,0.215,0.35].forEach(dy=>{parts.push({s:"box",x:0.27,y:dy,z:0.215,w:0.3,h:0.11,d:0.012,c:WOOD}); /* a drawer face */
    parts.push({s:"box",x:0.27,y:dy+0.062,z:0.214,w:0.34,h:0.012,d:0.006,c:UNDER});        /* the seam over it, dark */
    parts.push({s:"box",x:0.27,y:dy,z:0.228,w:0.09,h:0.02,d:0.016,c:PULL});});            /* its pull */
  parts.push({s:"cyl",x:0,y:0.481,z:-0.12,r:0.07,h:0.012,c:INK},                          /* the monitor's foot, a disc */
    {s:"box",x:0,y:0.53,z:-0.12,w:0.03,h:0.1,d:0.03,c:INK},                               /* the stalk, daylight either side of it */
    {s:"box",x:0,y:0.69,z:-0.12,w:0.34,h:0.22,d:0.03,c:INK},                              /* the panel, thin */
    {s:"box",x:0,y:0.695,z:-0.101,w:0.31,h:0.19,d:0.008,c:SCREEN},                        /* the screen, on its front face: the lightest thing here */
    {s:"box",x:0,y:0.483,z:0.09,w:0.26,h:0.015,d:0.1,c:KEYS},                             /* the keyboard, lying on the slab */
    {s:"box",x:-0.27,y:0.478,z:0.06,w:0.16,h:0.005,d:0.2,c:PAPER,ry:0.18});               /* the sheet of paper, not quite square to the edge */
  return meshTurned(parts,meshFacing(x,y));};

/* THE CAFÉ COUNTER (owner: "coffee machines"). What TILESIDE["K"] says it is: a counter body under a
   steel top with two dark panels on the front, and on it "a coffee machine on every third tile … the
   rest carry a cup and a napkin stand". K is laid in RUNS, so the carcass is the full tile wide and a
   run reads as one counter with no seam and one height; an end panel stands only where the run ends.
   The top is dead flat with a nosing along the front edge. The front faces the open side ACROSS the run
   (south, else north; east, else west). The machine, as one is built and as Pili reads it: a bright
   steel drip tray at its foot, the body, a narrower hopper on top (the wide-to-narrow step is the
   read), the group head hanging off the front with AIR between it and the cup under it (no air is a
   microwave), the portafilter locked in with its handle out, one warm light. The machine is the darkest
   thing in the room; the counter keeps the theme's counter colour. */
TILEART_MESH["K"]=({x,y})=>{
  const w=CW(),isK=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return !!r&&r[gx]==="K";};
  const solid=(gx,gy)=>{const r=w&&w.grid&&w.grid[gy];return !r||r[gx]===undefined||SOLID.has(r[gx]);};
  const E=isK(x+1,y),Wt=isK(x-1,y),N=isK(x,y-1),S=isK(x,y+1),alongX=E||Wt||!(N||S);
  /* the whole run agrees on its front: walk the run to both ends and count which side across it has
     more open floor — one tile with a plant behind it must not turn its panels the other way */
  const run=[];if(alongX){let a=x;while(isK(a-1,y))a--;for(;isK(a,y);a++)run.push([a,y]);}else{let a=y;while(isK(x,a-1))a--;for(;isK(x,a);a++)run.push([x,a]);}
  const open=(dx,dy)=>run.filter(([gx,gy])=>!solid(gx+dx,gy+dy)).length;
  const ry=alongX?(open(0,1)>=open(0,-1)?0:Math.PI):(open(1,0)>=open(-1,0)?Math.PI/2:-Math.PI/2);
  const endA=ry===0?!Wt:ry===Math.PI?!E:ry===Math.PI/2?!S:!N,endB=ry===0?!E:ry===Math.PI?!Wt:ry===Math.PI/2?!N:!S; /* which local end is the run's end */
  const BODY=C.counter,TOPC="#AAB4C0",NOSE="#C9CFD6",PANEL="#5E6874",END="#6E7884",MACH="#2F343B",HOP="#23272C",TRAY="#C9CDD2",LIGHT="#E0662B",CUP="#F4F1EA",NAP="#C9B7A0";
  const parts=[{s:"box",x:0,y:0.265,z:0,w:1.0,h:0.53,d:0.8,c:BODY},                     /* the carcass, the full tile so the run is one counter */
    {s:"box",x:0,y:0.545,z:0.01,w:1.0,h:0.03,d:0.84,c:TOPC},                             /* the top, dead flat */
    {s:"cyl",x:0,y:0.545,z:0.43,r:0.02,h:1.0,c:NOSE,rz:Math.PI/2},                        /* the nosing along the front edge */
    {s:"box",x:-0.24,y:0.25,z:0.405,w:0.26,h:0.2,d:0.014,c:PANEL},{s:"box",x:0.24,y:0.25,z:0.405,w:0.26,h:0.2,d:0.014,c:PANEL}]; /* the two front panels */
  if(endA)parts.push({s:"box",x:-0.5,y:0.265,z:0,w:0.02,h:0.51,d:0.78,c:END});           /* the end panels, where the run stops */
  if(endB)parts.push({s:"box",x:0.5,y:0.265,z:0,w:0.02,h:0.51,d:0.78,c:END});
  const cup=(cx,cy,cz)=>{parts.push({s:"cyl",x:cx,y:cy+0.028,z:cz,r:0.034,h:0.056,c:CUP});parts.push({s:"torus",x:cx+0.042,y:cy+0.03,z:cz,r:0.018,t:0.007,c:CUP,ry:Math.PI/2});}; /* a cup with its handle to the right */
  if((((x|0)+(y|0))%3+3)%3===2){                                                            /* the espresso machine, on every third tile */
    parts.push({s:"box",x:0,y:0.57,z:0.1,w:0.34,h:0.02,d:0.16,c:TRAY},                    /* the drip tray at its foot, bright steel */
      {s:"box",x:0,y:0.71,z:-0.08,w:0.44,h:0.3,d:0.3,c:MACH},                            /* the body, 0.56 to 0.86 */
      {s:"box",x:0,y:0.91,z:-0.1,w:0.3,h:0.1,d:0.24,c:HOP},                              /* the hopper on top, narrower: the step */
      {s:"cyl",x:0,y:0.74,z:0.11,r:0.04,h:0.05,c:HOP},                                   /* the group head, hanging off the front */
      {s:"cyl",x:0,y:0.708,z:0.11,r:0.046,h:0.014,c:TRAY},                               /* the portafilter locked in */
      {s:"box",x:0,y:0.708,z:0.2,w:0.02,h:0.018,d:0.12,c:HOP},                           /* its handle, out toward the barista's hand */
      {s:"box",x:-0.15,y:0.8,z:0.077,w:0.05,h:0.04,d:0.014,c:LIGHT});                    /* the one warm light: it is on */
    cup(0,0.58,0.11);}                                                                     /* a cup under the group, air between: top 0.636, group 0.715 */
  else{cup(-0.2,0.56,0.1);                                                                 /* a cup, and a napkin stand */
    parts.push({s:"box",x:0.2,y:0.62,z:0.04,w:0.18,h:0.12,d:0.07,c:NAP},{s:"box",x:0.2,y:0.7,z:0.04,w:0.13,h:0.08,d:0.03,c:CUP});}
  return meshTurned(parts,ry);};

/* THE FRIDGE (owner: "fridge"). What TILEDRAW["W"] says it is: a light-grey box the height of the tile,
   a horizontal seam a bit above the middle, two dark vertical handles on the right of each door. Made:
   a dark plinth at the floor, the carcass on it — the tallest furniture in the room, and the floor
   showing round it — the two door faces a hair proud and a step lighter than the carcass, the seam
   between them set back, the two handles proud on the same side, and one warm note under a magnet.
   Faces its first open side. */
TILEART_MESH["W"]=({x,y})=>{
  const CARC="#AEB6BE",DOOR="#BCC4CC",SEAM="#5A6068",HANDLE="#5A6068",PLINTH="#2F343A",MAG="#E0B45C";
  const parts=[{s:"box",x:0,y:0.025,z:0,w:0.6,h:0.05,d:0.53,c:PLINTH},                    /* the plinth */
    {s:"box",x:0,y:0.5,z:0,w:0.62,h:0.9,d:0.55,c:CARC},                                   /* the carcass, 0.05 to 0.95 */
    {s:"box",x:0,y:0.785,z:0.28,w:0.6,h:0.31,d:0.01,c:DOOR},                              /* the freezer door, 0.63 to 0.94 */
    {s:"box",x:0,y:0.345,z:0.28,w:0.6,h:0.55,d:0.01,c:DOOR},                              /* the fridge door, 0.07 to 0.62 */
    {s:"box",x:0,y:0.625,z:0.276,w:0.6,h:0.01,d:0.006,c:SEAM},                            /* the seam, set back */
    {s:"box",x:0.24,y:0.78,z:0.295,w:0.03,h:0.22,d:0.02,c:HANDLE},                        /* the freezer handle, proud */
    {s:"box",x:0.24,y:0.4,z:0.295,w:0.03,h:0.22,d:0.02,c:HANDLE},                         /* the fridge handle, the same side */
    {s:"box",x:-0.12,y:0.86,z:0.288,w:0.05,h:0.035,d:0.006,c:MAG}];                        /* a magnet: one warm note */
  return meshTurned(parts,meshFacing(x,y));};

/* THE RED ROLLING TOOL CHEST (owner: "tool boxes"). What TILE_PROPS["8"] says it is: a red body on
   black casters, four drawer seams with a chrome pull on each, a chrome bar up at the top. Made: four
   casters, the carcass floated over them with the floor showing round it, a genuinely dark seam under
   each drawer face and its pull, the steel top plate, and the push handle — two uprights and a
   crossbar — up one end. On the plate, a rag and a wrench, where the last hand left them. Faces its
   first open side. */
TILEART_MESH["8"]=({x,y})=>{
  const RED="#B3352B",SEAM="#5E1810",PULL="#C9CDD3",STEEL="#B9BEC4",BLACK="#2A2D33",RAG="#C9553F";
  const parts=[];
  [[-0.2,-0.14],[0.2,-0.14],[-0.2,0.14],[0.2,0.14]].forEach(([cx,cz])=>parts.push({s:"cyl",x:cx,y:0.04,z:cz,r:0.04,h:0.04,c:BLACK,rz:Math.PI/2})); /* four casters, axles across */
  parts.push({s:"box",x:0,y:0.43,z:0,w:0.55,h:0.62,d:0.42,c:RED});                       /* the carcass, 0.12 to 0.74, a gap over the casters */
  for(let i=0;i<4;i++){const dy=0.2+i*0.125;
    parts.push({s:"box",x:0,y:dy-0.0675,z:0.213,w:0.55,h:0.012,d:0.01,c:SEAM});           /* the seam under each drawer face, dark */
    parts.push({s:"box",x:0,y:dy,z:0.22,w:0.16,h:0.022,d:0.018,c:PULL});}                 /* the pull, centred */
  parts.push({s:"box",x:0,y:0.75,z:0,w:0.57,h:0.02,d:0.44,c:STEEL});                     /* the steel top plate */
  parts.push({s:"box",x:0.1,y:0.77,z:0.05,w:0.16,h:0.02,d:0.12,c:RAG});                   /* a rag, dropped */
  parts.push({s:"box",x:-0.1,y:0.768,z:-0.08,w:0.22,h:0.014,d:0.03,c:PULL,ry:0.4});       /* a wrench, where it was put down */
  parts.push({s:"cyl",x:-0.3,y:0.81,z:-0.13,r:0.012,h:0.12,c:PULL},{s:"cyl",x:-0.3,y:0.81,z:0.13,r:0.012,h:0.12,c:PULL}, /* the push handle's uprights */
    {s:"cyl",x:-0.3,y:0.87,z:0,r:0.013,h:0.3,c:PULL,rx:Math.PI/2});                       /* and its crossbar */
  return meshTurned(parts,meshFacing(x,y));};

/* THE TIRE STACK (owner: "tires"). What TILE_PROPS["0"] says it is: THREE tires, one above the other,
   each with its hub hole — "a zero IS a tire". One mould made all three, so they are the same tire
   (.claude/skills/how-its-made: variation enters at the step it entered, and nowhere earlier); they were thrown
   on the pile one at a time, so the top one landed a little off, and the ones underneath carry the
   weight. The top one is painted a step lighter — the two below sit in its shade — and the rim of the
   top tire shows through its hole, the one light value in the stack. */
TILEART_MESH["0"]=({x,y})=>{const h=(((x*7+y*13)%5)+5)%5,TYRE="#26262B",TOPT="#3A3A41",RIM="#6B6B72",a=h*0.7+2.4;
  const parts=[];
  for(let i=0;i<3;i++){const off=i===2?0.03:0;
    parts.push({s:"torus",x:Math.cos(a)*off,y:0.06+i*0.11,z:Math.sin(a)*off,r:0.22,t:0.075,c:i===2?TOPT:TYRE,rx:Math.PI/2});}
  parts.push({s:"cyl",x:Math.cos(a)*0.03,y:0.27,z:Math.sin(a)*0.03,r:0.14,h:0.012,c:RIM}); /* the rim, seen through the top hole */
  return parts;};

/* TACHO'S CAPRICE (owner: "car"). What TILE_PROPS["6"] says it is: "a long burgundy sedan" — a body
   the length of the tile and more, a darker cabin set back on it, glass, a chrome strip low along the
   body, wheels with grey hubs. Made: four wheels on their hubs, touching the ground and proud of the
   body; the under-body, dark; the long low body over it; the cabin set back with its front edge at
   the body's midpoint — a long hood is what makes it a Caprice; one continuous band of glass round
   the cabin, brighter than anything else on it; four pillars; the roof painted a step lighter than the
   body; the chrome strip along each side. No lamps, no grille, no handles: at 35 px a tile they are
   noise. A tile and a half long — parts are not clipped and nothing of its kind is laid beside it —
   parked along x, parallel to the taller's front. */
/* THE PAINT, 2026-09-22 (the owner: "the cars are not following pilis edit/note, can we edit?"). Her rule,
   now in her own file: this renderer's light gives 1.5:1 and nothing else, so every value difference you
   want has to be PAINTED into the part's own colour and asked for about a fifth wider than you want it,
   because tc() mixes 16% of the theme into every hex by day and 22% at night. Both cars were built with
   a roof one step off the body — #7A2E2E against #8A3636 is sixteen points of luma before the tint, which
   lands at thirteen — so from seven tiles back a car was one slab with a windscreen. They carry a real
   ladder now, and it is Rigo's paint rule for the tram applied to a car: a DARK skirt below the waist, the
   body, a lighter shoulder, the roof lighter again, never two mid-tones, with the shut line dark between
   them. Luma, before the tint: 29 · 50 · 69 · 100 · 134 · 205 for the glass. */
TILEART_MESH["6"]=()=>{
  const SKIRT="#4A1A1A",BODY="#7A2E2E",SHOULDER="#A8524A",ROOF="#C0705E",SHUT="#3A1414",
        CABIN="#5E2222",GLASS="#BFD3E0",CHROME="#C9CDD3",TYRE="#1E1E22",HUB="#8E8E96",UNDER="#1A1D22";
  const parts=[];
  [[-0.5,-0.3],[0.5,-0.3],[-0.5,0.3],[0.5,0.3]].forEach(([wx,wz])=>{parts.push({s:"cyl",x:wx,y:0.1,z:wz,r:0.1,h:0.08,c:TYRE,rx:Math.PI/2}); /* a wheel */
    parts.push({s:"cyl",x:wx,y:0.1,z:wz,r:0.045,h:0.086,c:HUB,rx:Math.PI/2});});                                                        /* its hub */
  parts.push({s:"box",x:0,y:0.135,z:0,w:1.4,h:0.03,d:0.56,c:UNDER},                       /* the under-body, the darkest thing on it */
    {s:"box",x:0,y:0.192,z:0,w:1.5,h:0.085,d:0.62,c:SKIRT},                               /* the skirt, below the waist: dark */
    {s:"box",x:0,y:0.262,z:0,w:1.5,h:0.055,d:0.622,c:BODY},                               /* the body */
    {s:"box",x:0,y:0.296,z:0,w:1.5,h:0.014,d:0.624,c:SHOULDER},                           /* the shoulder, where the light sits along the top of the flank */
    {s:"box",x:-0.275,y:0.34,z:0,w:0.55,h:0.08,d:0.5,c:GLASS},                            /* the glass band, 0.30 to 0.38, all the way round */
    {s:"box",x:-0.275,y:0.383,z:0,w:0.56,h:0.012,d:0.51,c:SHUT},                          /* the shut line under the roof: the dark that makes the roof read as a lid */
    {s:"box",x:-0.275,y:0.404,z:0,w:0.55,h:0.04,d:0.52,c:ROOF},                           /* the roof, two steps lighter than the body */
    {s:"box",x:0.28,y:0.302,z:0,w:0.9,h:0.012,d:0.6,c:SHOULDER});                         /* the hood, lit: a long bonnet is what says Caprice from above */
  [[-0.535,-0.235],[-0.015,-0.235],[-0.535,0.235],[-0.015,0.235]].forEach(([px,pz])=>parts.push({s:"box",x:px,y:0.34,z:pz,w:0.03,h:0.08,d:0.03,c:CABIN})); /* the pillars */
  [-0.316,0.316].forEach(pz=>parts.push({s:"box",x:0,y:0.17,z:pz,w:1.5,h:0.02,d:0.012,c:CHROME}));                                 /* the chrome strip, low along each side */
  return parts;};

/* THE TWO-POST LIFT WITH A CAR UP (owner: "car lifts"). What TILE_PROPS["7"] says it is: two grey posts
   with a beam across the top, the arms, and a BLUE car — a customer's, not the Caprice — up on them
   with its wheels hanging. Made as one is installed: two dark bases bolted to the slab, a post on each
   with its warning stripe, the overhead beam tying them (that is what makes it a lift), the arms
   reaching in from each post to the car's lift points, a pad at the end of each, and the car up on
   the pads at half height, its under-body the darkest thing in the bay. The bay is `i7i`, so the car
   runs along x and the posts stand north and south of it; the car sits a little east of the posts so
   they hold it at its lift points and do not cut it in half from the door. */
TILEART_MESH["7"]=()=>{
  /* the same ladder as the Caprice (2026-09-22, Pili's rule): a dark skirt, the body, a lit shoulder, the
     roof two steps up, a dark shut line between roof and glass. On a car UP ON A LIFT the ladder does more
     work than usual, because the thing under it is the bay floor and the thing above it is nothing. */
  const POST="#6A7480",BASE="#2F353C",ARM="#9EA8B3",STRIPE="#E0B45C",UNDER="#1A1D22",
        SKIRT="#24406A",BODY="#3C5C8A",SHOULDER="#6E92C4",ROOF="#8FB0DC",SHUT="#1B2F4E",
        CABIN="#2C4468",GLASS="#BFD3E0",TYRE="#1E1E22",HUB="#8E8E96";
  const parts=[],CX=0.12;                                                                  /* the car's centre, east of the posts */
  [-0.31,0.31].forEach(pz=>{const sg=Math.sign(pz);
    parts.push({s:"box",x:0,y:0.1,z:pz,w:0.16,h:0.2,d:0.14,c:BASE});                       /* the base, dark */
    parts.push({s:"box",x:0,y:0.7,z:pz,w:0.11,h:1.0,d:0.11,c:POST});                       /* the post, 0.2 to 1.2 */
    parts.push({s:"box",x:0,y:0.33,z:pz,w:0.114,h:0.05,d:0.114,c:STRIPE});                 /* its warning stripe */
    [CX-0.25,CX+0.25].forEach(qx=>{const z0=pz-sg*0.055,z1=sg*0.16,dx=qx,dz=z1-z0,L=Math.hypot(dx,dz); /* an arm from the post's face to a lift point */
      parts.push({s:"cyl",x:dx/2,y:0.5,z:(z0+z1)/2,r:0.03,h:L,c:ARM,rx:Math.PI/2,ry:Math.atan2(dx,dz)});
      parts.push({s:"box",x:qx,y:0.515,z:z1,w:0.07,h:0.02,d:0.07,c:UNDER});});});          /* its pad */
  parts.push({s:"box",x:0,y:1.16,z:0,w:0.12,h:0.08,d:0.73,c:POST});                        /* the overhead beam, tying the posts */
  [[CX-0.3,-0.21],[CX+0.3,-0.21],[CX-0.3,0.21],[CX+0.3,0.21]].forEach(([wx,wz])=>{parts.push({s:"cyl",x:wx,y:0.5,z:wz,r:0.08,h:0.06,c:TYRE,rx:Math.PI/2}); /* a wheel, hanging */
    parts.push({s:"cyl",x:wx,y:0.5,z:wz,r:0.036,h:0.066,c:HUB,rx:Math.PI/2});});
  parts.push({s:"box",x:CX,y:0.535,z:0,w:0.86,h:0.03,d:0.4,c:UNDER},                       /* the car's under-body, the darkest thing in the bay */
    {s:"box",x:CX,y:0.592,z:0,w:0.9,h:0.084,d:0.44,c:SKIRT},                                /* the skirt, dark */
    {s:"box",x:CX,y:0.660,z:0,w:0.9,h:0.052,d:0.442,c:BODY},                                /* the body */
    {s:"box",x:CX,y:0.692,z:0,w:0.9,h:0.012,d:0.444,c:SHOULDER},                            /* the shoulder, lit */
    {s:"box",x:CX-0.17,y:0.73,z:0,w:0.42,h:0.08,d:0.36,c:GLASS},                            /* the glass band */
    {s:"box",x:CX-0.17,y:0.773,z:0,w:0.43,h:0.010,d:0.37,c:SHUT},                           /* the shut line under the roof */
    {s:"box",x:CX-0.17,y:0.792,z:0,w:0.42,h:0.04,d:0.38,c:ROOF});                           /* the roof, two steps up */
  [[CX-0.365,-0.17],[CX+0.025,-0.17],[CX-0.365,0.17],[CX+0.025,0.17]].forEach(([px,pz])=>parts.push({s:"box",x:px,y:0.73,z:pz,w:0.03,h:0.08,d:0.03,c:CABIN})); /* the pillars */
  return parts;};

/* ---- BEAUTIFY, CREW ITERATION 11 — la calle ----
   Owner: "lets do a crew mode to try to fix as many things … rails, fences, … bridge, petals, trolley,
   … fruit stands". The street and the park, built the way each thing was built (.claude/skills/how-its-made):
   a picket fence is posts set in the ground, two rails and pickets nailed on; a balustrade is a shoe,
   panes, posts and a cap; a crate is a slatted box and what a hand set in it; a counter is one carcase
   the length of its run. Same seam as the sittings above, colours a step paler than the pictures they
   replace, because a lit mesh shades itself (docs/3D-LOG.md 2026-09-21). The bridge and the tram are
   the engine's (scratchpad: bridge-parts.md, trolley-parts.md) — the hook never reaches `^`. */

/* A CREST OF PETALS. Content cannot change the ground bake's density (engine.js, petalSpill: a function
   of distance from the bridge only); what it can add is the line where a drift meets something — a
   fence's foot, a curb — a dark under and six to ten petals standing a hair proud of it. A petal at
   this scale is a flattened ellipsoid; the fan and the rib are the picture's job. Colours from
   petalPal(), the dark end kept for the under. In season only; the caller asks petalsOn(). (Pili) */
const meshPetalCrest=(parts,n,seed,ax,a,b,off,y0)=>{const P=petalPal();let sd=((seed|0)*7919+13)&0x7fffffff;const rnd=()=>{sd=(sd*1103515245+12345)&0x7fffffff;return sd/0x7fffffff;};
  const at=(al,o)=>ax==="x"?{x:al,z:o}:{x:o,z:al};let q=at((a+b)/2,off);
  parts.push({s:"box",x:q.x,y:y0+0.006,z:q.z,w:(b-a)*0.92,h:0.012,d:0.11,c:"#5A2E12",ry:ax==="x"?0:Math.PI/2});        /* the dark under the drift */
  for(let i=0;i<n;i++){q=at(a+0.06+rnd()*(b-a-0.12),off+(rnd()-0.5)*0.07);
    parts.push({s:"sph",x:q.x,y:y0+0.02,z:q.z,r:0.05,sx:1.2,sy:0.25,c:P[1+((i+(seed|0))%(P.length-1))],ry:rnd()*Math.PI});}};

/* THE PICKET FENCE. One post a tile, at the tile's centre — a rail bay wants a post every six feet, and
   a tile is about that; two rails on the yard side running post to post THROUGH the tile edges, so each
   tile's rail spans the whole tile and butts its neighbour's; four pickets a bay on the street side, cut
   from one stock on one jig — one width, one point — and nailed on by hand, which is where the variation
   enters: a hair higher or lower, one leaning a degree, three weathered shades. The rails a step darker
   than the pickets: that behind-value is the depth (Pili). A corner is two runs meeting at the corner
   post; a run ends at its post and nothing overhangs; the post's cut top is lit. A neighbour is the same
   GLYPH: the barricade beside the crew pen is kind `fence` too, and reading the kind is what stood the
   engine's panels at 90° in mid-air there (docs/BEAUTIFY.md, row F). The park's sixty tiles are one
   fence and the site's are the same fence, because this pack draws one F in every other camera. In
   season, a crest of petals along its foot on the park side within three tiles of the bridge. */
TILEART_MESH["F"]=({x,y})=>{
  const w=CW(),F=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return !!r&&r[gx]==="F";};
  const open=(gx,gy)=>{const r=w&&w.grid&&w.grid[gy];return !!r&&r[gx]!==undefined&&!SOLID.has(r[gx]);};
  const N=F(x,y-1),S=F(x,y+1),E=F(x+1,y),Wt=F(x-1,y),h=(((x*7+y*13)%5)+5)%5;
  const PICK=["#A87F4F","#B08A58","#9E7748"],TIP="#B99464",RAIL="#6B4F2E",POST="#6B4F2E",CAPC="#B08E5E",H=0.72;
  const parts=[],runs=[],corner=(E||Wt)&&(N||S);
  /* a run: at a corner each run stops at the corner post in the tile's centre; a straight bay spans the
     tile; a run's END spans the tile too and gets an end post at the edge of the gap, so a gate opening
     is the open tile and not the open tile and a half */
  if(E||Wt)runs.push({ax:"x",a:corner&&!Wt?0:-0.5,b:corner&&!E?0:0.5,end:corner?0:!Wt?-1:!E?1:0,s:open(x,y+1)?1:open(x,y-1)?-1:1}); /* rails face the yard: the open side */
  if(N||S)runs.push({ax:"z",a:corner&&!N?0:-0.5,b:corner&&!S?0:0.5,end:corner?0:!N?-1:!S?1:0,s:open(x+1,y)?1:open(x-1,y)?-1:1});
  if(!runs.length)runs.push({ax:"x",a:-0.5,b:0.5,end:2,s:open(x,y+1)?1:-1});                   /* alone, a whole bay east-west, a post at each end */
  const pet=typeof petalsOn==="function"&&petalsOn()&&typeof bridgeDist==="function"&&bridgeDist(w,x,y)<=3;
  let px=0,pz=0;
  const post=(qx,qz)=>{parts.push({s:"box",x:qx,y:0.41,z:qz,w:0.09,h:0.82,d:0.09,c:POST});
    parts.push({s:"box",x:qx,y:0.83,z:qz,w:0.11,h:0.02,d:0.11,c:CAPC});};                       /* a post, its cut top lit */
  runs.forEach(({ax,a,b,end,s},ri)=>{const ry=ax==="x"?0:Math.PI/2,at=(al,off)=>ax==="x"?{x:al,z:off}:{x:off,z:al};
    if(ax==="x")pz=s*0.04;else px=s*0.04;                                                      /* the post stands behind the rails */
    [0.24,0.56].forEach(yy=>{const q=at((a+b)/2,-s*0.01);parts.push({s:"box",x:q.x,y:yy,z:q.z,w:b-a,h:0.05,d:0.03,c:RAIL,ry});});
    [-0.38,-0.13,0.13,0.38].forEach((al,i)=>{if(al<a-0.01||al>b+0.01)return;
      const q=at(al,-s*0.037),k=(i+h+ri)%3,ph=H-0.07-k*0.014,lean=((i*7+h)%3-1)*0.012;
      parts.push({s:"box",x:q.x,y:0.05+ph/2,z:q.z,w:0.13,h:ph,d:0.025,c:PICK[k],ry,rz:lean});    /* the board, a hair off the ground */
      parts.push({s:"cone",x:q.x,y:0.05+ph+0.04,z:q.z,r:0.072,h:0.08,c:TIP,sz:0.36,ry});});      /* its point, off the jig */
    if(end===2||end===-1){const q=at(-0.455,s*0.04);post(q.x,q.z);}                             /* the end post, at the edge of the gap */
    if(end===2||end===1){const q=at(0.455,s*0.04);post(q.x,q.z);}
    if(pet)meshPetalCrest(parts,6+(h%4),x*31+y*17+ri,ax,a,b,s*0.13,0);});                       /* the drift, against the foot on the park side */
  post(px,pz);                                                                                  /* the bay post, one a tile */
  return parts;};

/* THE RAIL ROUND THE WELL. In this pack it is a glass divider (owner, 2026-09-16: "make it a glass
   divider"; TILEART_SIDE_GLASS above) — but a vertex-coloured Lambert mesh has no alpha, and a pane drawn
   as a pale sheet was rendered and looked at: a bathtub wall that hid the flight, which is the one thing
   the divider exists to show. So the 3D camera builds what a glazier fits round an opening MINUS the
   glass: the shoe channel bolted along the lip, the posts, and the cap rail — one bar the length of the
   run, unbroken, dark over the pale floor with a light strip on top (Pili: a light cap over this floor
   is Δ38 after tint and fails). It stands on the LIP of the well and faces it — wellDepth of the four
   neighbours says which lip, the engine's own rule for a rail beside a well — and it is waist-high,
   which is what a guard rail is. A post at the near edge and the centre; the far edge is the next
   tile's near post, or an end post where the run ends. The pane has its alpha now — `a:` in the mesh view
   (crew iteration 11): 0.45, so the flight shows through it, and the frame says where the edge is. */
TILEART_MESH["◺"]=({x,y})=>{
  const w=CW(),wl=(gx,gy)=>typeof wellDepth==="function"&&wellDepth(w,gx,gy)>0;
  const R=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return !!r&&r[gx]==="◺";};
  const lip=wl(x,y+1)?[0,0.44,0]:wl(x,y-1)?[0,-0.44,0]:wl(x+1,y)?[0.44,0,Math.PI/2]:wl(x-1,y)?[-0.44,0,Math.PI/2]:[0,0,0];
  const ry=lip[2],ax=ry?"z":"x",ends=ax==="x"?!R(x+1,y):!R(x,y+1);
  const at=(al,off)=>ax==="x"?{x:lip[0]+al,z:lip[1]+off}:{x:lip[0]+off,z:lip[1]+al};
  const CAP="#3A3F46",CAPL="#8E98A3",POST="#4A5058",H=0.62,parts=[];
  let q=at(0,0);
  parts.push({s:"box",x:q.x,y:H-0.03,z:q.z,w:1,h:0.06,d:0.07,c:CAP,ry});                       /* the cap rail: one line, the whole run */
  parts.push({s:"box",x:q.x,y:H+0.004,z:q.z,w:1,h:0.008,d:0.07,c:CAPL,ry});                    /* its top, where the key lands */
  parts.push({s:"box",x:q.x,y:(H-0.06)/2,z:q.z,w:1,h:H-0.08,d:0.02,c:"#D6E6EC",a:0.45,ry});      /* the pane: glass at 0.45, the flight shows through it (a: in the mesh view, crew iteration 11) */
  [-0.475,0].concat(ends?[0.475]:[]).forEach(al=>{q=at(al,0);parts.push({s:"box",x:q.x,y:(H-0.06)/2,z:q.z,w:0.05,h:H-0.06,d:0.05,c:POST,ry});});
  return parts;};                                                                              /* no shoe at the floor: with a bottom bar it rendered as a ladder on its side */

/* THE PRODUCE CRATE. A slatted box nailed from one pattern — four corner posts standing a thumb proud of
   the slats (that is what says crate and not box), three slats a side with a gap between, a rim — so
   every crate is the same crate; what differs is what a grocer set in it, ONE KIND to a crate, by hand,
   so it mounds and touches and spills over the front. The picture mixes a tomato, a chile and a banana
   in each; that is a diagram of the word "produce". Which crate holds what follows the picture's own
   parity, so the plan and the shape agree. The crate goes dark and the mouth darkest so the fruit reads
   against it, and the fruit keeps the picture's saturation (Pili). Tomatoes are siblings off one plant:
   one radius, a pack on the bottom, a second layer in the hollows, one on the peak, each with its green
   star where the stem was, tumbled a little. A chile is a thin cone bent at the tip, lying every which
   way. A hand of bananas is four fingers on one stem, each finger three short cylinders in a curve. */
const meshTomato=(parts,tx,ty,tz,r,seed,col)=>{const a=seed*1.7,dx=Math.cos(a)*r*0.25,dz=Math.sin(a)*r*0.25;
  parts.push({s:"sph",x:tx,y:ty,z:tz,r,sy:0.9,c:col});
  parts.push({s:"sph",x:tx+dx,y:ty+r*0.82,z:tz+dz,r:r*0.34,sy:0.3,c:"#4E9A3E"});                /* the star, where the stem was */
  parts.push({s:"cyl",x:tx+dx,y:ty+r*0.9,z:tz+dz,r:r*0.07,h:r*0.3,c:"#3E7A34"});};
TILEART_MESH["H"]=({x,y})=>{const alt=(((x*3+y*5)%7)+7)%7,kind=alt<3?"tomato":alt<5?"chile":"banana";
  let sd=(x*131+y*71+7)|0;const rnd=()=>{sd=(sd*1103515245+12345)&0x7fffffff;return sd/0x7fffffff;};
  const POSTC="#6B4F2E",SLAT="#7A5B36",SLATL="#8A6A42",MOUTH="#3A2A18",parts=[],T=0.44,FILL=0.34;
  [[-0.37,-0.29],[0.37,-0.29],[-0.37,0.29],[0.37,0.29]].forEach(([cx,cz])=>parts.push({s:"box",x:cx,y:(T+0.05)/2,z:cz,w:0.06,h:T+0.05,d:0.06,c:POSTC})); /* four posts, proud by a thumb */
  [0.08,0.2,0.32].forEach(sy=>{[-0.3,0.3].forEach(z=>parts.push({s:"box",x:0,y:sy,z,w:0.74,h:0.1,d:0.03,c:SLAT}));                   /* three slats a side, a gap between */
    [-0.385,0.385].forEach(xx=>parts.push({s:"box",x:xx,y:sy,z:0,w:0.03,h:0.1,d:0.58,c:SLAT}));});
  [[0,-0.3,0.74,0.03],[0,0.3,0.74,0.03],[-0.385,0,0.03,0.58],[0.385,0,0.03,0.58]].forEach(([cx,cz,ww,dd])=>parts.push({s:"box",x:cx,y:T-0.03,z:cz,w:ww,h:0.06,d:dd,c:SLATL})); /* the rim, lit */
  parts.push({s:"box",x:0,y:FILL-0.05,z:0,w:0.72,h:0.1,d:0.56,c:MOUTH});                                                            /* the mouth: the darkest thing on the street, the fruit against it */
  if(kind==="tomato"){const r=0.095,RED=["#D4382A","#C9331F","#DE4232"];let i=0;
    const one=(tx,ty,tz)=>{meshTomato(parts,tx+(rnd()-0.5)*0.016,ty,tz+(rnd()-0.5)*0.016,r,i+alt,RED[(i++ +alt)%3]);};
    [-0.2,0,0.2].forEach(tx=>{one(tx,FILL+r,-0.19);one(tx,FILL+r,0);one(tx,FILL+r+0.03,0.25);});                                    /* the bottom, packed; the front row tumbled onto the rim, spilling over it */
    [[-0.1,-0.1],[0.1,-0.1],[-0.1,0.1],[0.1,0.1]].forEach(([tx,tz])=>one(tx,FILL+r+0.15,tz));                                        /* the hollows */
    one(0,FILL+r+0.29,0);}                                                                                                          /* the peak */
  else if(kind==="chile"){const GRN="#5FB24A",GRND="#2F6B27",RED="#C8342A",REDD="#7A1E18",CAP="#3E6E2E";
    /* CREW 12 (el ebanista, #226; owner: "how do we fix the bananas and chiles?"): nine fat chiles heaped ABOVE the
       rim, the front ones with their tips out over the edge and drooping — fourteen thin ones lay flat in the crate's
       shadow and read as green stuff; two turned red the way a chile crate does; every one a lit cone over a dark
       cone a hair lower, the value break the light will not give; a cap and a stem at the fat end. */
    const LAY=[[-0.18,0.06,0.10,0.15],[0.05,0.06,0.12,-0.25],[0.24,0.06,0.02,0.5],[-0.10,0.06,-0.14,1.9],[0.16,0.06,-0.12,2.5],
               [-0.06,0.16,0.16,-0.1],[0.12,0.16,0.0,0.35],[-0.16,0.15,-0.02,1.1],[0.02,0.25,0.06,0.05]];                 /* [x, y over the fill, z, turn]: laid by hand, not by a loop */
    LAY.forEach(([cx,cy,cz,a],i)=>{const red=(i+alt)%4===0,c=red?RED:GRN,cd=red?REDD:GRND,y=FILL+cy+(rnd()-0.5)*0.01,t=a+(rnd()-0.5)*0.2,ux=Math.sin(t),uz=Math.cos(t),tilt=cz>0.08?0.25:0;
      parts.push({s:"cone",x:cx,y,z:cz,r:0.05,h:0.26,c,rx:Math.PI/2+tilt,ry:t});                                           /* the body, fat, tip out */
      parts.push({s:"cone",x:cx,y:y-0.016,z:cz,r:0.048,h:0.25,c:cd,rx:Math.PI/2+tilt,ry:t});                                /* its underside, dark */
      const by=y+Math.sin(tilt)*0.13;
      parts.push({s:"cyl",x:cx-ux*0.13,y:by,z:cz-uz*0.13,r:0.03,h:0.035,c:CAP,rx:Math.PI/2,ry:t});                          /* the cap */
      parts.push({s:"cyl",x:cx-ux*0.16,y:by+0.005,z:cz-uz*0.16,r:0.01,h:0.05,c:CAP,rx:Math.PI/2,ry:t});});}                 /* the stem */
  else{const YEL="#EAC63E",YELD="#B8962A",RIDGE="#A87F22",TIPC="#4A3A16",STEMC="#8A6B3A";
    /* CREW 12 (el ebanista): two big hands of five, curving UP over the rim — three small hands of four lay in the
       crate as tiny cylinders of one yellow. A finger is a bent pair: the lower length rising from the crown, the
       upper steeper, a brown ridge along its back, a dark tip; each length a lit cylinder over a darker one a hair
       lower. The front hand's tips reach out over the rim; the back hand curves away, higher. Three loose fingers
       on the floor of the crate, siblings of the same hand, so it is full. */
    const hand=(hx,hy,hz,ha,n,seed)=>{const c=Math.cos(ha),s=Math.sin(ha),at=(lx,ly,lz)=>({x:hx+lx*c-lz*s,y:hy+ly,z:hz+lx*s+lz*c});
      let q=at(-0.03,0.03,0);parts.push({s:"cyl",x:q.x,y:q.y,z:q.z,r:0.045,h:0.07,c:STEMC,rz:Math.PI/2,ry:-ha});          /* the crown they hang from */
      for(let f=0;f<n;f++){const fz=(f-(n-1)/2)*0.074,fy=-Math.abs(f-(n-1)/2)*0.012,b1=0.3+((seed+f)%3)*0.05,b2=0.85+((seed*3+f)%3)*0.06,L1=0.13,L2=0.12;
        const e1x=L1*Math.cos(b1),e1y=L1*Math.sin(b1);
        [[L1/2*Math.cos(b1),L1/2*Math.sin(b1),L1,b1],[e1x+L2/2*Math.cos(b2),e1y+L2/2*Math.sin(b2),L2,b2]].forEach(([lx,ly,len,b])=>{q=at(lx,fy+ly,fz);
          parts.push({s:"cyl",x:q.x,y:q.y,z:q.z,r:0.036,h:len,c:YEL,rz:b-Math.PI/2,ry:-ha});                               /* a length of the finger, lit */
          parts.push({s:"cyl",x:q.x,y:q.y-0.015,z:q.z,r:0.033,h:len*0.95,c:YELD,rz:b-Math.PI/2,ry:-ha});                   /* its underside, darker */
          parts.push({s:"cyl",x:q.x,y:q.y+0.03,z:q.z,r:0.009,h:len*0.9,c:RIDGE,rz:b-Math.PI/2,ry:-ha});});                  /* the ridge along its back */
        q=at(e1x+L2*Math.cos(b2)+0.01,fy+e1y+L2*Math.sin(b2)+0.01,fz);parts.push({s:"sph",x:q.x,y:q.y,z:q.z,r:0.028,c:TIPC});}}; /* the dark tip */
    [[-0.22,0.02,-0.16,0.3],[0.10,0.02,-0.18,2.9],[0.20,0.02,0.10,1.4]].forEach(([lx,ly,lz,la])=>{                          /* the loose fingers on the floor */
      parts.push({s:"cyl",x:lx,y:FILL+ly+0.03,z:lz,r:0.036,h:0.16,c:YEL,rz:Math.PI/2,ry:la});
      parts.push({s:"cyl",x:lx,y:FILL+ly+0.016,z:lz,r:0.033,h:0.15,c:YELD,rz:Math.PI/2,ry:la});});
    hand(-0.02,FILL+0.06,0.10,Math.PI/2,5,alt);                                                                             /* the front hand, tips out over the rim */
    hand(0.06,FILL+0.13,-0.14,-2.2,5,alt+1);}                                                                               /* the back hand, curving away, higher */
  return parts;};

/* THE COUNTER. One carcase the length of the run: a plinth set back at the foot, the body, a worked
   top a hair proud of the face, plank joins on the WORLD grid so they run through the tiles as the
   picture's do, end panels only where the run ends — and the scale ONCE, at the head of the run, on the
   top and not in the texture. (As a box the head tile stood taller than the other three, because the
   baker measured the scale's dial into the box's height.) A cast base, a column, a pan, a dial face on a
   stalk behind the pan, a red needle reading something, one tomato on the pan. */
TILEART_MESH["I"]=({x,y})=>{
  const w=CW(),cnt=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return !!r&&r[gx]==="I";};
  const Wt=!cnt(x-1,y),E=!cnt(x+1,y),head=Wt,H=0.6;
  const BODY="#9C7A4E",TOP="#B8925F",TOPL="#C9A46E",KICK="#7A5B38",CAP="#7A5B38",JOIN="#5E4527";
  const parts=[{s:"box",x:0,y:0.03,z:0.02,w:1,h:0.06,d:0.58,c:KICK},                            /* the plinth, set back */
    {s:"box",x:0,y:0.06+(H-0.1)/2,z:0,w:1,h:H-0.1,d:0.66,c:BODY},                                /* the carcase, tile to tile */
    {s:"box",x:0,y:H-0.02,z:0,w:1,h:0.04,d:0.72,c:TOP},                                          /* the worked top, a hair proud */
    {s:"box",x:0,y:H+0.001,z:0,w:1,h:0.004,d:0.72,c:TOPL}];                                      /* its lit face */
  for(let gx=x*32;gx<x*32+32;gx++)if(gx%11===0){const lx=(gx-x*32)/32-0.5+1/64;parts.push({s:"box",x:lx,y:0.06+(H-0.1)/2,z:0.331,w:0.012,h:H-0.12,d:0.008,c:JOIN});}
  if(Wt)parts.push({s:"box",x:-0.49,y:H/2-0.01,z:0,w:0.03,h:H-0.02,d:0.7,c:CAP});
  if(E)parts.push({s:"box",x:0.49,y:H/2-0.01,z:0,w:0.03,h:H-0.02,d:0.7,c:CAP});
  if(head){const y0=H+0.003,STEEL="#6F777F",PAN="#D3D7DC",FACE="#F2F4F5";
    parts.push({s:"cyl",x:0,y:y0+0.01,z:0.02,r:0.1,h:0.02,c:STEEL},{s:"box",x:0,y:y0+0.09,z:0.02,w:0.05,h:0.14,d:0.05,c:STEEL});  /* the base and the column */
    parts.push({s:"cyl",x:0,y:y0+0.165,z:0.02,r:0.13,h:0.015,c:PAN},{s:"cyl",x:0,y:y0+0.176,z:0.02,rt:0.135,rb:0.12,h:0.008,c:"#E8EBEE"}); /* the pan and its lip */
    parts.push({s:"box",x:0,y:y0+0.23,z:-0.1,w:0.03,h:0.22,d:0.03,c:STEEL});                                                        /* the stalk behind the pan */
    parts.push({s:"cyl",x:0,y:y0+0.34,z:-0.1,r:0.1,h:0.025,c:STEEL,rx:Math.PI/2},{s:"cyl",x:0,y:y0+0.34,z:-0.086,r:0.085,h:0.004,c:FACE,rx:Math.PI/2}); /* the dial, facing the shop */
    parts.push({s:"box",x:0.014,y:y0+0.36,z:-0.082,w:0.007,h:0.06,d:0.004,c:"#D0402F",rz:-0.5});                                  /* the needle, reading something */
    meshTomato(parts,0.01,y0+0.25,0.03,0.075,x+y,"#D4382A");}
  return parts;};

/* WHAT STANDS ON THE BRIDGE. The deck, the rib and the rails are the engine's (test/smoke.js reads them); the
   pack answers "prop:bridge" with what a builder adds to a plank bridge once the deck is down: a stringer
   beam under each open side — the dark line that says the deck has a thickness and is not a rug — a
   nosing along the top edge where boots wear it pale, and in season the crest where the petal heap meets
   the rail line, the same recipe as the fence's foot. Deck-local: x along the crossing, y up from the
   deck's top, z ±0.5 the two sides; `edges` names the open sides (−1, +1), `h` the deck's thickness.
   (la calle's parts list; Pili's two, the beam and the nosing.) */
TILEART_MESH["prop:bridge"]=({x,y,h,edges,pet})=>{const parts=[],H=h||0.22;
  (edges||[]).forEach(sd=>{
    parts.push({s:"box",x:0,y:-H*0.65,z:sd*0.485,w:1,h:H*0.35,d:0.03,c:"#5A4330"});         /* the stringer, along the bottom of the side */
    parts.push({s:"box",x:0,y:0.005,z:sd*0.49,w:1,h:0.02,d:0.04,c:"#B08E5E"});              /* the nosing, worn pale along the top edge */
    if(pet)meshPetalCrest(parts,8+((((x+y)%3)+3)%3),x*31+y*17+sd*5,"x",-0.5,0.5,sd*0.4,0);});/* the heap's edge, inside the rail line */
  return parts;};

/* THE TROLLEY'S BODY. The engine keeps the wheels (it spins them) and the driver (he changes ends); the pack
   answers "prop:tram" with the body, built the way a tram is: an underframe skirt full length over the
   bogies, a dark panel to the waist and a light band round the windows (Rigo's paint rule — never two
   mid-tones), the glazing in the band, a roof that OVERHANGS the body with a drip lip under it, a raised
   clerestory, and the trolley pole leaning back against the travel — twelve pixels of line above the roof
   that say tram and not bus (Pili). Then the tram's own paperwork: a headlamp at each end, a bell under
   the roof at the platform, a fender leaning out low at each end, a grab rail on each open platform.
   +x is the direction of travel; the engine flips the body with TRO.dir. `len` is TRO_LEN, `h` the roof
   height (a door is 1.0), `fl` the floor, `cab` the open platform at each end. (la calle's parts list.) */
TILEART_MESH["prop:tram"]=({len,h,fl,cab})=>{const L=len||2,H=h||1.02,FL=fl||0.20,CAB=cab||0.15;
  const SKIRT="#6B2E1E",BAND="#E8D6B0",ROOF="#8E4230",GLASS="#D8E6F0",IRON="#3A3F46",LAMP="#FFE9A8",BELL="#C9A227";
  const BW=L-0.1-CAB*2,bandY0=FL+0.31,bandH=(H-0.06)-bandY0,parts=[
    {s:"box",x:0,y:(FL+0.10)/2,z:0,w:L-0.06,h:FL+0.10,d:0.74,c:SKIRT},                        /* the underframe skirt, full length */
    {s:"box",x:0,y:FL+0.17,z:0,w:BW,h:0.28,d:0.72,c:SKIRT},                                   /* the dark panel, to the waist */
    {s:"box",x:0,y:bandY0+bandH/2,z:0,w:BW,h:bandH,d:0.72,c:BAND},                             /* the light band the windows sit in */
    {s:"box",x:0,y:H-0.03,z:0,w:L+0.10,h:0.06,d:0.92,c:ROOF},                                 /* the roof, overhanging by 0.06 all round */
    {s:"box",x:0,y:H-0.07,z:0,w:L+0.10,h:0.02,d:0.94,c:SKIRT},                                /* the drip lip under the overhang */
    {s:"box",x:0,y:H+0.05,z:0,w:L-0.5,h:0.10,d:0.5,c:ROOF},                                   /* the clerestory */
    {s:"cyl",x:0.06,y:H+0.12,z:0,r:0.05,h:0.04,c:IRON},                                       /* the pole's swivel base */
    {s:"cyl",x:0.06,y:H+0.31,z:0,r:0.02,h:0.35,c:IRON,rz:0.35},                               /* the trolley pole, leaning back against the travel */
    {s:"sph",x:L/2-0.12,y:H-0.12,z:0.3,r:0.04,c:BELL}];                                       /* the bell, under the roof edge at the platform */
  [-0.55,0,0.55].forEach(dx=>[-1,1].forEach(sd=>parts.push({s:"box",x:dx*(BW/1.6),y:bandY0+bandH*0.45,z:sd*0.37,w:0.42*(BW/1.6),h:bandH*0.6,d:0.02,c:GLASS}))); /* six lights a side */
  [-1,1].forEach(ed=>{parts.push({s:"box",x:ed*(BW/2+0.005),y:bandY0+bandH*0.45,z:0,w:0.02,h:bandH*0.6,d:0.50,c:GLASS});   /* the windscreen at each end of the saloon */
    parts.push({s:"cyl",x:ed*(L/2-0.03),y:0.45,z:0,r:0.05,h:0.03,c:LAMP,rx:Math.PI/2});                                     /* a headlamp at each end, low, on the dash */
    parts.push({s:"box",x:ed*(L/2-0.01),y:0.14,z:0,w:0.06,h:0.16,d:0.6,c:IRON,rz:-ed*0.35});                                /* the fender, leaning out low */
    [-1,1].forEach(sd=>{parts.push({s:"box",x:ed*(L/2-0.05-CAB/2),y:0.75,z:sd*0.36,w:CAB,h:0.03,d:0.02,c:IRON});             /* the grab rail on the open platform */
      parts.push({s:"cyl",x:ed*(L/2-0.06),y:(FL+0.10+0.75)/2,z:sd*0.36,r:0.012,h:0.75-(FL+0.10),c:IRON});});});                /* its stanchion, floor to rail */
  return parts;};

/* ---- CREW ITERATION 12, el ebanista (#226), 2026-09-21. Owner: "a couple more to beautify and shape …
   cabinet in my office could be, this nolasco desk, the chair outside dona tenchas, im guessing what
   the oven is supposed to be in the espiga … there are limpeza things i dont know what they are and
   lets fix the mqt station now with beautify as well." Six shapes through the same seam, each built the
   way the thing is built (.claude/skills/how-its-made); the 2D drawing is the bill of materials. The
   "desk" in his frame of the notary was the pair of guest chairs `⊔` beside the rug — boxes wearing the
   chair's front elevation on their lids — and `D` was already a mesh. Every mesh below is judged by the
   frame at 35 px a tile: silhouette first, the values painted into the parts, the light only 1.5:1. ---- */

/* WHICH WAY A CHAIR FACES. A chair is pulled up to a table or a desk and faces it; otherwise its BACK goes
   to the wall — the first solid neighbour, north first, so a chair against a house wall faces the street
   and the notary's two face the rug — and it faces away; with nothing round it, south. Returns the turn
   in meshFacing's convention (south 0, east π/2, west −π/2, north π). */
const meshChairFacing=(x,y)=>{const w=CW(),at=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return r?r[gx]:undefined;},
    solid=(gx,gy)=>{const r=w&&w.grid&&w.grid[gy];return !r||r[gx]===undefined||SOLID.has(r[gx]);};
  const SIDES=[[0,-1,Math.PI],[0,1,0],[-1,0,-Math.PI/2],[1,0,Math.PI/2]];                     /* N, S, W, E: [dx,dy, the turn that faces that way] */
  for(const [dx,dy,ry] of SIDES){const g=at(x+dx,y+dy);if(g==="T"||g==="D")return ry;}
  for(const [dx,dy,ry] of SIDES)if(solid(x+dx,y+dy))return ry+Math.PI;
  return 0;};

/* LA SILLA — the chair outside Doña Tencha's door (the casa's yard pick), the notary's two guest chairs,
   the barbería's, the taller's: one chair, a silla de palma, the chair outside every door on a street like
   Calle Dos. Made: four turned legs, the back pair running up as the uprights; the seat frame joined to
   them; the palm seat woven INTO the frame — the one pale thing on it, with the weave's cross a step down;
   two back rails, the top one the yoke, wider than the uprights; stretchers low between the legs (a stool
   has none, a chair does). Seat 0.27 (0.45 m), yoke 0.56 (0.95 m): small beside a person, as a chair is.
   Values painted in: legs and stretchers darkest, the frame, the rails, the straw lightest. */
TILEART_MESH["⊔"]=({x,y})=>{
  const LEG="#54321B",FRAME="#6E5334",RAIL="#7E5F38",YOKE="#8A6B3F",STRAW="#DCC47C",STRAWD="#B89A55",SY=0.27;
  const parts=[];
  [[-0.17,0.17],[0.17,0.17]].forEach(([lx,lz])=>parts.push({s:"cyl",x:lx,y:SY/2,z:lz,rt:0.022,rb:0.027,h:SY,c:LEG}));        /* the front legs, turned: a hair wider at the foot */
  [[-0.17,-0.17],[0.17,-0.17]].forEach(([lx,lz])=>parts.push({s:"cyl",x:lx,y:0.29,z:lz,rt:0.022,rb:0.027,h:0.58,c:LEG}));      /* the back legs run up as the uprights */
  parts.push({s:"box",x:0,y:SY,z:0,w:0.40,h:0.036,d:0.40,c:FRAME});                                                             /* the seat frame */
  parts.push({s:"box",x:0,y:SY+0.026,z:0,w:0.33,h:0.016,d:0.33,c:STRAW});                                                       /* the palm seat, woven into the frame */
  parts.push({s:"box",x:0,y:SY+0.035,z:0,w:0.33,h:0.004,d:0.05,c:STRAWD},{s:"box",x:0,y:SY+0.035,z:0,w:0.05,h:0.004,d:0.33,c:STRAWD}); /* the weave's cross, a step down */
  parts.push({s:"box",x:0,y:0.41,z:-0.17,w:0.36,h:0.045,d:0.026,c:RAIL});                                                       /* the lower back rail */
  parts.push({s:"box",x:0,y:0.545,z:-0.17,w:0.42,h:0.06,d:0.032,c:YOKE});                                                       /* the yoke: wider than the uprights, the top of the silhouette */
  parts.push({s:"box",x:0,y:0.11,z:0.17,w:0.32,h:0.02,d:0.02,c:LEG});                                                           /* the front stretcher */
  [-0.17,0.17].forEach(sx=>parts.push({s:"box",x:sx,y:0.09,z:0,w:0.02,h:0.02,d:0.32,c:LEG}));                                   /* the side stretchers */
  return meshTurned(parts,meshChairFacing(x,y));};

/* EL ARCHIVERO — the notary's steel filing cabinets, what TILEDRAW["▯"] draws: a grey body, drawer fronts,
   folders peeking from an open drawer, pulls. Four-drawer units from one factory, siblings: two side by
   side make a bank, each shifted toward its `▯` neighbour so the pair stands touching. Made: a dark plinth,
   the carcase, four drawer fronts a step lighter on the open face with a dark reveal between them, a pull
   and a label holder on each. What the clerk did: ONE drawer left pulled out — which one by the tile — its
   box proud of the face with hanging folders in it, tabs staggered. Faces the first open side. 0.86 tall:
   chest height on a person, over the desk's 0.47. The open drawer is what breaks the box. */
TILEART_MESH["▯"]=({x,y})=>{
  const w=CW(),cab=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return !!r&&r[gx]==="▯";};
  const BODY="#6E7883",FRONT="#98A3AE",REVEAL="#2E3339",PULL="#2E3339",LABEL="#EAD9B4",PLINTH="#23272C",TRAY="#5A626C",FOLD=["#E8D6B0","#D9C29A","#EBDDBE"];
  const H=0.86,W=0.54,D=0.62,open=(((x*5+y*3)%4)+4)%4;
  let parts=[{s:"box",x:0,y:0.02,z:0,w:W-0.06,h:0.04,d:D-0.06,c:PLINTH},                               /* the plinth, set back, dark */
    {s:"box",x:0,y:0.04+(H-0.04)/2,z:0,w:W,h:H-0.04,d:D,c:BODY}];                                        /* the carcase */
  [0,1,2,3].forEach(i=>{const dy=0.13+i*0.19,out=i===open?0.20:0;                                       /* four drawers, the open one out by 0.20 */
    if(out){parts.push({s:"box",x:0,y:dy,z:D/2+out/2-0.01,w:W-0.08,h:0.15,d:out,c:TRAY});                /* the drawer's box, riding out on its rails */
      FOLD.forEach((c,f)=>{const fz=D/2+0.03+f*0.055;parts.push({s:"box",x:0,y:dy+0.01,z:fz,w:W-0.14,h:0.13,d:0.012,c});   /* hanging folders */
        parts.push({s:"box",x:-0.12+f*0.12,y:dy+0.085,z:fz,w:0.09,h:0.025,d:0.012,c});});}                 /* their tabs, staggered */
    parts.push({s:"box",x:0,y:dy,z:D/2+out+0.012,w:W-0.06,h:0.17,d:0.024,c:FRONT});                       /* the drawer front, a step lighter */
    parts.push({s:"box",x:0,y:dy+0.098,z:D/2+0.008,w:W,h:0.014,d:0.012,c:REVEAL});                        /* the reveal over it, dark */
    parts.push({s:"box",x:0,y:dy-0.03,z:D/2+out+0.03,w:0.13,h:0.024,d:0.02,c:PULL});                      /* the pull */
    parts.push({s:"box",x:0,y:dy+0.035,z:D/2+out+0.026,w:0.09,h:0.032,d:0.006,c:LABEL});});                /* the label holder */
  parts=meshTurned(parts,meshFacing(x,y));
  const sh=0.22,dx=cab(x+1,y)?sh:cab(x-1,y)?-sh:0,dz=cab(x,y+1)?sh:cab(x,y-1)?-sh:0;                       /* a bank: shift toward the neighbour so the two touch */
  return parts.map(p=>({...p,x:p.x+dx,z:p.z+dz}));};

/* EL HORNO DE PISO — La Espiga's oven, what TILEDRAW["▣"] draws: a dark steel box with TWO decks, each an
   orange slit and a steel bar. The owner could not tell what it was; a deck oven is what bolillo comes out
   of. Two modular units side by side, a bank, each with its own flue. Made: a plinth, the carcase, two
   doors on the front hinged at the bottom — a frame, a glass slit glowing from inside, a bar handle on two
   brackets — a control strip at the right with three knobs and a red pilot, the hood on top and the flue
   rising out of the back, capped: the flue is the silhouette above the box. One unit (by parity) has its
   lower door swung DOWN open, the mouth dark and the deck glowing at the back of it — the baker has just
   pulled a tray (the goods are another builder's). Faces the first open side. */
TILEART_MESH["▣"]=({x,y})=>{
  const STEEL="#585E67",DARK="#2A2E35",MOUTH="#17181C",GLOW="#E8A24A",EMBER="#C8601E",BAR="#B4BCC4",PLINTH="#1E2126",PILOT="#D0402F";
  const W=0.96,H=1.12,D=0.80,F=D/2,ajar=(((x+y)%2)+2)%2===1;
  const parts=[{s:"box",x:0,y:0.04,z:-0.02,w:W-0.08,h:0.08,d:D-0.08,c:PLINTH},                          /* the plinth */
    {s:"box",x:0,y:0.08+H/2,z:0,w:W,h:H,d:D,c:STEEL},                                                     /* the carcase */
    {s:"box",x:0,y:0.08+H+0.05,z:-0.12,w:W,h:0.10,d:D-0.24,c:DARK},                                       /* the hood, set back */
    {s:"cyl",x:0.24,y:0.08+H+0.10+0.27,z:-0.20,r:0.065,h:0.54,c:DARK},                                    /* the flue */
    {s:"cyl",x:0.24,y:0.08+H+0.10+0.55,z:-0.20,r:0.10,h:0.03,c:DARK},                                     /* its cap */
    {s:"box",x:0.40,y:0.08+H/2,z:F+0.008,w:0.11,h:H-0.16,d:0.016,c:DARK}];                                /* the control strip, right */
  [0.30,0.55,0.80].forEach(ky=>parts.push({s:"cyl",x:0.40,y:ky,z:F+0.024,r:0.02,h:0.016,c:BAR,rx:Math.PI/2}));   /* three knobs */
  parts.push({s:"box",x:0.40,y:1.02,z:F+0.02,w:0.03,h:0.03,d:0.01,c:PILOT});                                    /* the pilot light: on */
  [0.40,0.84].forEach((dy,i)=>{const open=ajar&&i===0;
    if(open){parts.push({s:"box",x:-0.06,y:dy,z:F-0.02,w:0.74,h:0.30,d:0.06,c:MOUTH});                            /* the mouth: the darkest thing in the bakery */
      parts.push({s:"box",x:-0.06,y:dy-0.10,z:F-0.05,w:0.62,h:0.03,d:0.03,c:EMBER});                              /* the deck glowing at the back of it */
      parts.push({s:"box",x:-0.06,y:dy-0.16,z:F+0.16,w:0.74,h:0.025,d:0.32,c:DARK});                             /* the door, swung down flat on its hinge */
      parts.push({s:"cyl",x:-0.06,y:dy-0.16,z:F+0.31,r:0.014,h:0.60,c:BAR,rz:Math.PI/2});}                        /* its bar, now at the front edge */
    else{parts.push({s:"box",x:-0.06,y:dy,z:F+0.012,w:0.74,h:0.30,d:0.024,c:DARK});                               /* the door, closed, proud of the face */
      parts.push({s:"box",x:-0.06,y:dy+0.02,z:F+0.026,w:0.54,h:0.07,d:0.006,c:GLOW});                             /* the glass slit, lit from inside */
      [-0.28,0.16].forEach(bx=>parts.push({s:"box",x:bx,y:dy-0.08,z:F+0.04,w:0.03,h:0.03,d:0.04,c:BAR}));          /* two brackets */
      parts.push({s:"cyl",x:-0.06,y:dy-0.08,z:F+0.06,r:0.014,h:0.60,c:BAR,rz:Math.PI/2});}});                     /* the bar handle across them */
  return meshTurned(parts,meshFacing(x,y));};

/* EL PIZARRÓN DE TURNOS — Limpieza Velázquez's `U`. The engine's `U` is its blueprint wall (a plan pinned
   with four gold pins, engine.js TILEDRAW["U"]) — right in La Obra's studio and unreadable on a cleaning
   company's wall; it is the "limpieza thing" the owner could not name. In `li` the wall stays a wall — the
   mesh carries the wall body in C.wall and its top band in C.wallTop, the two colours the `#` beside it
   bakes — and wears on its open face the crew's schedule board: a dark frame, the white board, a teal
   header band, rows ruled across and the day-columns ruled THROUGH the run (two `U` side by side are one
   board; the frame's end stands only where the run ends), magnets in the cells by the tile, a marker
   tray at the foot with two markers in it. Anywhere else the function answers [] and the blueprint wall
   stands as it did (engine3d.js t3MeshTile: an empty list is "draw it the old way"). */
TILEART_MESH["U"]=({x,y})=>{
  if(typeof world==="undefined"||world!=="li")return [];
  const w=CW(),isU=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return !!r&&r[gx]==="U";};
  const WH=0.55+13*0.042,BAND=0.20,ry=meshFacing(x,y);
  const parts=[{s:"box",x:0,y:WH/2,z:0,w:1,h:WH,d:1,c:C.wall},{s:"box",x:0,y:WH-BAND/2,z:0,w:1.004,h:BAND,d:1.004,c:C.wallTop}]; /* the wall itself, and its top band */
  const ax=Math.round(-Math.cos(ry)),az=Math.round(Math.sin(ry)),endA=!isU(x+ax,y+az),endB=!isU(x-ax,y-az);       /* does the run end at the board's local −x / +x */
  const FR="#3A3F46",WHITE="#F2F4F5",LINE="#8A929B",HEAD="#3FA3A0",MAG=["#E0B45C","#D0402F","#3FA3A0","#2E5FA8"];
  const F=0.5,BY=0.66,BH=0.46,x0=endA?-0.43:-0.5,x1=endB?0.43:0.5,wx0=x0+(endA?0.03:0),wx1=x1-(endB?0.03:0),ww=wx1-wx0,wx=(wx0+wx1)/2,top=BY+BH/2;
  parts.push({s:"box",x:(x0+x1)/2,y:BY,z:F+0.015,w:x1-x0,h:BH+0.06,d:0.03,c:FR});                                  /* the frame's backing */
  parts.push({s:"box",x:wx,y:BY,z:F+0.034,w:ww,h:BH,d:0.01,c:WHITE});                                             /* the board */
  parts.push({s:"box",x:wx,y:top-0.035,z:F+0.042,w:ww,h:0.06,d:0.006,c:HEAD});                                    /* the header band, the company's teal */
  [0.17,0.27,0.37].forEach(r=>parts.push({s:"box",x:wx,y:top-r,z:F+0.042,w:ww,h:0.007,d:0.006,c:LINE}));           /* three rows ruled across */
  const cy0=BY-BH/2,cy1=top-0.065;
  for(let lx=-0.4;lx<=0.41;lx+=0.2)if(lx>wx0+0.01&&lx<wx1-0.01)parts.push({s:"box",x:lx,y:(cy0+cy1)/2,z:F+0.042,w:0.007,h:cy1-cy0,d:0.006,c:LINE}); /* day-columns, on the world grid so they run through the join */
  const sd=(((x*5+y*3)%7)+7)%7;
  for(let i=0;i<5;i++){const col=(i*2+sd)%5,row=(i*3+sd+i)%4,mx=-0.4+col*0.2+0.1+((sd+i)%3-1)*0.03,my=top-0.115-0.1*row;            /* magnets in the cells: who is on what */
    if(mx>wx0+0.04&&mx<wx1-0.04)parts.push({s:"box",x:mx,y:my,z:F+0.046,w:0.05,h:0.04,d:0.008,c:MAG[(i+sd)%4]});}
  parts.push({s:"box",x:wx,y:cy0-0.02,z:F+0.05,w:Math.min(ww,0.5),h:0.02,d:0.05,c:FR});                            /* the marker tray */
  parts.push({s:"cyl",x:wx-0.08,y:cy0-0.003,z:F+0.05,r:0.009,h:0.12,c:"#D0402F",rz:Math.PI/2});                     /* two markers lying in it */
  parts.push({s:"cyl",x:wx+0.06,y:cy0-0.003,z:F+0.058,r:0.009,h:0.12,c:"#2E5FA8",rz:Math.PI/2});
  return meshTurned(parts,ry);};

/* EL ANAQUEL DE LIMPIEZA — Limpieza Velázquez's `S`. The engine's S is a bookcase and el taller's mesh fills
   it with books and cartons, right everywhere but here: a cleaning company's shelves hold what the crew
   takes out in the morning. The carcase as the bookcase has it (back, uprights, four boards, the same turn
   to the room); on it: spray bottles in a row on the top board — a body, a neck, a trigger head nosing to
   the room — folded cloths stacked (the ones underneath squashed) and two jugs on the middle, a bucket with
   its handle up and a big jug at the foot; and a broom and a mop LEANING on the uprights, which is the read
   from seven tiles back. Wrapped round the bookcase, not edited into it: another builder has the bakery's
   racks in that function this run. */
const meshShelfLimpieza=({x,y})=>{
  const w=CW(),solid=(gx,gy)=>{const r=w&&w.grid&&w.grid[gy];return !r||r[gx]===undefined||SOLID.has(r[gx]);};
  const ry=!solid(x,y+1)?0:!solid(x+1,y)?Math.PI/2:!solid(x-1,y)?-Math.PI/2:Math.PI;
  const sd=(((x*5+y*3)%7)+7)%7,WOOD="#8A6F4D",DARK="#5A4530",BACK="#3F2E1E";
  const parts=[{s:"box",x:0,y:0.5,z:-0.2,w:0.9,h:1.0,d:0.04,c:BACK},
    {s:"box",x:-0.43,y:0.5,z:0,w:0.05,h:1.0,d:0.42,c:WOOD},{s:"box",x:0.43,y:0.5,z:0,w:0.05,h:1.0,d:0.42,c:WOOD}];
  [0.03,0.34,0.66,0.98].forEach(by=>parts.push({s:"box",x:0,y:by,z:0,w:0.9,h:0.035,d:0.42,c:by>0.9?WOOD:DARK}));
  const B1=0.05,B2=0.36,B3=0.68;                                                                        /* the top of each board */
  const BOT=["#3FA3A0","#E0B45C","#F2F4F5","#2E5FA8","#52B8B4"],HEAD="#2A2E35",CLOTH=["#F2EFE6","#9FC4D8","#F2EFE6","#E8DCC4"],JUG="#E8ECEF",CAP="#3FA3A0",BUCKET="#E0B45C",BUCKETD="#B8902E";
  for(let i=0;i<5;i++){const bx=-0.32+i*0.14+((i*2+sd)%3-1)*0.01,c=BOT[(i+sd)%5];                        /* the top board: five spray bottles, pushed together the way they come off the van */
    parts.push({s:"cyl",x:bx,y:B3+0.075,z:0.02,rt:0.036,rb:0.04,h:0.15,c});                               /* the body, a hair wider at the foot */
    parts.push({s:"cyl",x:bx,y:B3+0.17,z:0.02,rt:0.014,rb:0.02,h:0.04,c});                                 /* the neck */
    parts.push({s:"box",x:bx,y:B3+0.21,z:0.03,w:0.035,h:0.035,d:0.06,c:HEAD});}                            /* the trigger head, nose to the room */
  for(let i=0;i<4;i++)parts.push({s:"box",x:-0.25+((i+sd)%3-1)*0.012,y:B2+0.02+i*0.032,z:0.02,w:0.22,h:i<3?0.026:0.03,d:0.2,c:CLOTH[(i+sd)%4]}); /* the middle: cloths folded and stacked */
  [0.08,0.27].forEach((jx,j)=>{parts.push({s:"box",x:jx,y:B2+0.10,z:0.02,w:0.14,h:0.2,d:0.13,c:JUG});parts.push({s:"cyl",x:jx-0.02,y:B2+0.215,z:0.02,r:0.025,h:0.03,c:CAP});
    parts.push({s:"box",x:jx,y:B2+0.10,z:0.087,w:0.09,h:0.07,d:0.004,c:BOT[(j+sd)%5]});});                  /* two jugs, a label each */
  parts.push({s:"cyl",x:-0.22,y:B1+0.12,z:0.02,rt:0.13,rb:0.11,h:0.24,c:BUCKET},{s:"torus",x:-0.22,y:B1+0.24,z:0.02,r:0.125,t:0.012,c:BUCKETD,rx:Math.PI/2}); /* the foot: a bucket, its rim */
  parts.push({s:"torus",x:-0.22,y:B1+0.24,z:0.02,r:0.11,t:0.008,c:"#6B6F76",arc:Math.PI});                  /* its handle, up */
  parts.push({s:"box",x:0.14,y:B1+0.13,z:0.0,w:0.2,h:0.26,d:0.18,c:JUG},{s:"cyl",x:0.14,y:B1+0.275,z:0,r:0.03,h:0.03,c:BOT[(sd+2)%5]}); /* and the big jug */
  parts.push({s:"cyl",x:0.51,y:0.50,z:0.15,r:0.012,h:0.96,c:"#C9A46E",rz:0.105});                           /* the broom, leaning on the upright */
  parts.push({s:"box",x:0.565,y:0.07,z:0.15,w:0.07,h:0.14,d:0.045,c:"#B8763A",rz:0.105});                  /* its bristles */
  parts.push({s:"box",x:0.567,y:0.012,z:0.15,w:0.075,h:0.025,d:0.05,c:"#8E5A2C",rz:0.105});                /* worn dark where they meet the floor */
  parts.push({s:"cyl",x:-0.51,y:0.50,z:0.18,r:0.012,h:0.96,c:"#8E969E",rz:-0.105});                         /* the mop, the other side */
  parts.push({s:"sph",x:-0.565,y:0.06,z:0.18,r:0.055,sy:0.7,c:"#C9CDD2"});                                 /* its head, the strings bunched */
  [[-0.03,0.03],[0.03,0.02],[0,-0.04]].forEach(([ox,oz])=>parts.push({s:"cyl",x:-0.565+ox,y:0.025,z:0.18+oz,r:0.008,h:0.05,c:"#AEB6BE",rz:ox*4})); /* three strings loose */
  return meshTurned(parts,ry);};
{const base=TILEART_MESH["S"];TILEART_MESH["S"]=a=>(typeof world!=="undefined"&&world==="li")?meshShelfLimpieza(a):base(a);}

/* LA PARADA — the MQT stop, standing. The 2D is a pole, a red sign that spells MQT and a bench, and in the
   3D camera it stood as a picture (FLAT_BY_GAME, test/engine.smoke.js). A stop is a shelter: two steel
   posts at the back on base plates, two braces, a roof cantilevered over a bench with a back, and the route's
   name-board in red round BOTH long edges of the roof — the `ex` stop faces its road to the north, so the
   default camera sees its back, and a board on one edge only would be blank from the street. M, Q and T
   are boxes and a torus in cream, thick strokes, on both boards, each reading from its own side: the mesh
   builder has no text, so letters that ride a face are made of parts. Faces the tram line (`≈` or `-`
   beside it), else south. */
TILEART_MESH["Y"]=({x,y})=>{
  const w=CW(),at=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return r?r[gx]:undefined;},rail=g=>g==="≈"||g==="-";
  const ry=rail(at(x,y-1))?Math.PI:rail(at(x,y+1))?0:rail(at(x+1,y))?Math.PI/2:rail(at(x-1,y))?-Math.PI/2:0;
  const POST="#3B3F45",ROOF="#2A2D33",ROOFT="#4A4F57",RED="#C0392B",REDD="#8E2A20",CREAM="#F2E8D8",SEAT="#8A6B3F",SEATL="#A5865A",SEATD="#4A3520",LEG="#6E5334";
  const RH=1.85,parts=[];
  [-0.42,0.42].forEach(px=>{parts.push({s:"cyl",x:px,y:RH/2,z:-0.30,r:0.032,h:RH,c:POST});                      /* the posts, at the back */
    parts.push({s:"box",x:px,y:0.015,z:-0.30,w:0.12,h:0.03,d:0.12,c:ROOF});                                      /* bolted to a base plate */
    parts.push({s:"box",x:px,y:RH-0.30,z:-0.02,w:0.03,h:0.03,d:0.62,c:POST,rx:-0.55});});                      /* the brace, post to the roof's front edge */
  parts.push({s:"box",x:0,y:RH,z:0.02,w:1.0,h:0.05,d:0.80,c:ROOF},{s:"box",x:0,y:RH+0.03,z:0.02,w:1.0,h:0.012,d:0.80,c:ROOFT}); /* the roof, its top a step lighter */
  const letters=(z,dir)=>{const T=0.042,LY=RH-0.145,LH=0.17,put=(lx,ly,bw,bh,rz)=>parts.push({s:"box",x:dir*lx,y:ly,z,w:bw,h:bh,d:0.012,c:CREAM,rz:rz?dir*rz:0});
    put(-0.36,LY,T,LH);put(-0.22,LY,T,LH);put(-0.325,LY+0.035,T,0.12,0.72);put(-0.255,LY+0.035,T,0.12,-0.72);      /* M: two stems and a V */
    parts.push({s:"torus",x:0,y:LY,z,r:0.062,t:0.021,c:CREAM});put(0.05,LY-0.065,0.06,T,0.7);                        /* Q: a ring and its tail */
    put(0.29,LY+LH/2-T/2,0.17,T);put(0.29,LY,T,LH);};                                                               /* T: a bar and a stem */
  [[0.40,1],[-0.36,-1]].forEach(([bz,dir])=>{parts.push({s:"box",x:0,y:RH-0.145,z:bz,w:1.0,h:0.23,d:0.03,c:RED});    /* the name-board, front and back */
    parts.push({s:"box",x:0,y:RH-0.26,z:bz,w:1.0,h:0.012,d:0.032,c:REDD});                                           /* its dark lower edge */
    letters(bz+dir*0.022,dir);});
  parts.push({s:"box",x:0,y:0.42,z:-0.02,w:0.72,h:0.04,d:0.30,c:SEAT},{s:"box",x:0,y:0.445,z:0.13,w:0.72,h:0.01,d:0.02,c:SEATL}, /* the seat, its front edge catching the light */
    {s:"box",x:0,y:0.395,z:-0.02,w:0.70,h:0.012,d:0.28,c:SEATD});                                                     /* the shade under it */
  [-0.32,0.32].forEach(lx=>{parts.push({s:"box",x:lx,y:0.20,z:-0.02,w:0.04,h:0.40,d:0.26,c:LEG});                   /* the leg frames */
    parts.push({s:"box",x:lx,y:0.56,z:-0.15,w:0.03,h:0.26,d:0.03,c:LEG});});                                          /* the back uprights */
  parts.push({s:"box",x:0,y:0.66,z:-0.15,w:0.72,h:0.06,d:0.03,c:SEAT});                                               /* the back rail */
  return meshTurned(parts,ry);};

/* ---- CREW ITERATION 12, la mueblería ---- 2026-09-21. The owner, asked whether he wanted a filing
   cabinet added to his own office: "no i was just trying to make sure all furniture and this type of
   item". So the ask is COVERAGE, and these five are what was left when the other lanes had done the
   ones he named by sight: the drafting table `A`, the stove `V`, the barricade `G`, the dog bed `○`
   and the moving carton `□`. Each is built the way the thing is built (.claude/skills/how-its-made),
   from what its own 2D drawing says it is made of, and judged in a frame at 35 px a tile: silhouette
   first, the value differences PAINTED into the parts because the light only gives 1.00 top / 0.88
   east / 0.78 south / 0.66 west-north (Pili, from engine3d.js). Every seed reads BOTH axes — the
   marigold bed's (x*7+y*13)%7 was constant along a row, and x*5%5 is constant everywhere, so it is
   (x*5+y*3)%7 here; La Obra's three tables come out 3, 0, 4 and the site's seven barricades come out
   all seven different. ---- */

/* LA MESA DE DIBUJO — La Obra's three drafting tables and the one on the empty lot. What
   TILEDRAW["A"] (engine.js, grep TILEDRAW\["A"\]) says it is: a pedestal, a board drawn as a
   parallelogram — a board that TILTS — a blueprint sheet on it and three drawn lines. It had no side
   view, so it stood as one upright quad wearing its plan: a blue postcard on a brown stick, and the
   only glyph of the owner's own flat-audit list that is furniture. Made as a drafting table is made:
   two feet that run front-to-back (what stops a board tipping when you lean on it), a column on each,
   a stretcher between them, the pivot brackets, and the BOARD across them at 23° — the rake is the
   whole silhouette, and it is the one thing that tells this from a desk at 35 px. Then what the
   draughtsman did: the pencil rail along the low edge (a board without one drops its pencils), the
   sheet taped down, its lines, the parallel rule laid across with its head overhanging the left edge,
   and a pencil in the rail. THE FRAMES ARE SIBLINGS — three tables from one shop are identical, and
   variation enters where it entered: at the hand. What the seed changes is the draughtsman's, not the
   joiner's — whether a sheet is pinned at all, where the rule was pushed to, whether the pencil was
   put back. Faces the first open side, like the desk. */
TILEART_MESH["A"]=({x,y})=>{
  const h=(((x*5+y*3)%7)+7)%7;
  const T=0.40,ct=Math.cos(T),st=Math.sin(T),CY=0.575;                   /* the rake, and the board's centre: front edge 0.458, back edge 0.692 */
  const at=(v,n)=>({y:CY-v*st+n*ct,z:v*ct+n*st});                        /* board-local: v runs down the board toward the low edge, n out of its face */
  const LEG="#7A6040",FOOT="#5E4830",BOARD="#B08B5A",UNDER="#6B5230",RAIL="#C4A06A",
        SHEET="#2E5FA8",LINE="#DDE8F5",RULE="#E6E0D2",PENCIL="#E0B45C",LEAD="#3A3546";
  const parts=[];
  [-0.27,0.27].forEach(lx=>{
    parts.push({s:"box",x:lx,y:0.022,z:0.02,w:0.075,h:0.044,d:0.46,c:FOOT});         /* the foot, running front to back */
    parts.push({s:"cyl",x:lx,y:0.27,z:0.06,rt:0.026,rb:0.034,h:0.46,c:LEG});         /* the column, turned: wider at the floor */
    parts.push({s:"box",x:lx,y:0.525,z:0.05,w:0.055,h:0.07,d:0.06,c:LEG});});        /* the pivot bracket the board rests on */
  parts.push({s:"cyl",x:0,y:0.17,z:0.06,r:0.018,h:0.52,c:LEG,rz:Math.PI/2});         /* the stretcher */
  let q=at(0,0);      parts.push({s:"box",x:0,y:q.y,z:q.z,w:0.86,h:0.032,d:0.60,c:BOARD,rx:T});      /* THE BOARD */
  q=at(0,-0.022);     parts.push({s:"box",x:0,y:q.y,z:q.z,w:0.82,h:0.016,d:0.56,c:UNDER,rx:T});      /* its underside, painted dark — the shade under any top */
  q=at(0.295,0.034);  parts.push({s:"box",x:0,y:q.y,z:q.z,w:0.86,h:0.030,d:0.036,c:RAIL,rx:T});      /* the pencil rail along the low edge, lit */
  if(h%3!==2){                                                                        /* h%3===2: the board was cleared — no sheet today */
    q=at(0.02,0.024); parts.push({s:"box",x:0,y:q.y,z:q.z,w:0.62,h:0.006,d:0.44,c:SHEET,rx:T});      /* the sheet, taped down */
    [[-0.12,0.44],[-0.04,0.44],[0.04,0.30]].forEach(([v,lw])=>{q=at(v,0.031);
      parts.push({s:"box",x:0,y:q.y,z:q.z,w:lw,h:0.004,d:0.014,c:LINE,rx:T});});                     /* what is drawn on it: three lines, as the picture has them, up where the drawing is */
  }
  const rv=0.12+(h%3)*0.07;                                                           /* where the rule was pushed to — down the board, below the drawing, which is where it is parked */
  q=at(rv,0.042);     parts.push({s:"box",x:0,y:q.y,z:q.z,w:0.92,h:0.012,d:0.038,c:RULE,rx:T});      /* the parallel rule, its blade wider than the board */
  q=at(rv,0.042);     parts.push({s:"box",x:-0.445,y:q.y,z:q.z,w:0.045,h:0.012,d:0.10,c:RULE,rx:T}); /* its head, overhanging the left edge — the one thing that is not a rectangle in plan */
  if(h%4!==1){        q=at(0.295,0.058);
    parts.push({s:"cyl",x:-0.12+(h%5)*0.07,y:q.y,z:q.z,r:0.014,h:0.20,c:PENCIL,rz:Math.PI/2,rx:T});  /* the pencil, put back in the rail */
    parts.push({s:"cyl",x:-0.22+(h%5)*0.07,y:q.y,z:q.z,r:0.012,h:0.03,c:LEAD,rz:Math.PI/2,rx:T});}   /* its lead */
  return meshTurned(parts,meshFacing(x,y));};

/* LA ESTUFA — Chuy's range in La Cocina, beside the walk-in `W` (already a shape). Two drawings, and
   they are the bill of materials between them: TILEDRAW["V"] in plan is a dark body with burners and
   an orange strip at the back; TILESIDE["V"] in elevation is "burners over the edge, knobs, the oven
   window" — a cooktop lip that overhangs the body, four knobs on a fascia, an oven cavity with a steel
   bar over it. IT STOOD AS A BOX and the box wore the PLAN on its lid, so the burners lay on top the
   size of dinner plates and the elevation's knobs were painted round all four sides. HOW MANY BURNERS:
   the plan draws four, the elevation draws three across, and the tile's own describe line — the
   paperwork the drawing sits on, which .claude/skills/how-its-made says to read first — says "Six
   burners of consommé diplomacy" (content/meridian/strings.js, grep "Six burners"). Three across by
   two deep is six, which is the only count that agrees with the elevation AND the words, and it is
   what a restaurant range is. **The owner settled it on 2026-09-22 and it is four**: "i dont care about
   the amount of burners now- do four if its easiest to be the most detailed with 4" — six across this
   deck gave each burner three pixels on a phone, and three pixels hold no detail at all. Four in a square,
   each with its drip bowl, its four-arm grate, its cap, and a ring of flame on the two that are lit.
   Made as one is welded: four feet
   with the floor showing between them, the body, the oven door proud with its window and its
   full-width bar handle on two brackets, the control fascia under the lip with four knobs, the cast
   deck OVERHANGING the body on every side (that lip is what says range and not cupboard), six open
   burners with their cast grates, and the riser at the back carrying the pilot — the riser and the
   stock pot are the silhouette above the box. Faces its first open side. */
TILEART_MESH["V"]=({x,y})=>{
  const STEEL="#4A5058",DOOR="#5E6874",DECK="#3A3F46",NOSE="#6E7A86",DARK="#23272C",GLASS="#1B1E22",
        EMBER="#C8601E",KNOB="#AEB6BE",BAR="#B9BEC4",ORANGE="#E0662B",POT="#B9BEC4",POTL="#CCD2D8",FOOT="#2A2D33";
  const parts=[];
  [[-0.25,-0.21],[0.25,-0.21],[-0.25,0.21],[0.25,0.21]].forEach(([fx,fz])=>
    parts.push({s:"cyl",x:fx,y:0.045,z:fz,r:0.024,h:0.09,c:FOOT}));                              /* four feet, the floor showing under it */
  parts.push({s:"box",x:0,y:0.30,z:0,w:0.62,h:0.42,d:0.54,c:STEEL},                              /* the body, 0.09 to 0.51 */
    {s:"box",x:0,y:0.27,z:0.275,w:0.56,h:0.28,d:0.016,c:DOOR},                                   /* the oven door, proud and a step lighter */
    {s:"box",x:0,y:0.29,z:0.286,w:0.38,h:0.15,d:0.006,c:GLASS},                                  /* its window, the darkest thing on it */
    {s:"box",x:0,y:0.235,z:0.290,w:0.30,h:0.016,d:0.004,c:EMBER},                                /* and what is on in there */
    {s:"box",x:0,y:0.485,z:0.278,w:0.62,h:0.060,d:0.014,c:DARK});                                /* the control fascia, under the lip */
  [-0.22,0.22].forEach(bx=>parts.push({s:"box",x:bx,y:0.435,z:0.292,w:0.028,h:0.032,d:0.036,c:BAR})); /* two brackets */
  parts.push({s:"cyl",x:0,y:0.435,z:0.318,r:0.016,h:0.56,c:BAR,rz:Math.PI/2});                   /* the bar handle across them */
  [-0.21,-0.07,0.07,0.21].forEach(kx=>parts.push({s:"cyl",x:kx,y:0.485,z:0.298,r:0.022,h:0.020,c:KNOB,rx:Math.PI/2})); /* four knobs, as the elevation has them */
  parts.push({s:"box",x:0,y:0.528,z:0,w:0.68,h:0.036,d:0.60,c:DECK},                             /* the cast deck, overhanging the body all round */
    {s:"box",x:0,y:0.545,z:0.298,w:0.68,h:0.008,d:0.012,c:NOSE});                                /* its front edge, catching the light */
  /* FOUR BURNERS, not six (the owner, 2026-09-22: "i dont care about the amount of burners now- do four
     if its easiest to be the most detailed with 4"). Six across a 0.68 deck left each burner 0.085 of a
     tile — three pixels on a phone — and three pixels cannot hold a grate, a cap and a ring of flame.
     Four in a square give each one half as much again, and the detail goes in: the drip bowl under it,
     the cast grate as four arms rather than a ring (a ring at this size is a doughnut), the burner cap
     with its dark centre, and on the two that are lit a ring of flame. Which two are lit is decided by
     the tile, so the kitchen is a kitchen somebody is working in and not a showroom. */
  [[-0.155,-0.13],[0.155,-0.13],[-0.155,0.13],[0.155,0.13]].forEach(([bx,bz],bi)=>{
    const lit=((((x*5+y*3)%4)+4)%4+bi)%4<2;                                                       /* two of the four are on */
    parts.push({s:"cyl",x:bx,y:0.548,z:bz,r:0.115,h:0.010,c:"#6A727C"});                          /* the drip bowl, pressed steel, catching the light */
    parts.push({s:"cyl",x:bx,y:0.554,z:bz,r:0.098,h:0.010,c:DARK});                               /* the well inside it, dark */
    [0,Math.PI/2].forEach(a=>parts.push({s:"box",x:bx,y:0.566,z:bz,w:0.20,h:0.016,d:0.022,c:"#2F343B",ry:a})); /* the cast grate: four arms, a cross */
    parts.push({s:"cyl",x:bx,y:0.566,z:bz,r:0.040,h:0.018,c:"#3A4048"});                          /* its centre ring, where the pot sits */
    parts.push({s:"cyl",x:bx,y:0.560,z:bz,r:0.046,h:0.016,c:STEEL});                              /* the burner cap */
    parts.push({s:"cyl",x:bx,y:0.569,z:bz,r:0.022,h:0.006,c:"#1B1E22"});                          /* its dark centre */
    if(lit)parts.push({s:"torus",x:bx,y:0.562,z:bz,r:0.050,t:0.010,rx:Math.PI/2,c:"#2E86C8"});});  /* the ring of flame, blue, on the two that are on */
  parts.push({s:"box",x:0,y:0.612,z:-0.275,w:0.68,h:0.130,d:0.045,c:STEEL},                      /* the riser at the back */
    {s:"box",x:0,y:0.680,z:-0.275,w:0.68,h:0.010,d:0.045,c:NOSE},                                /* its lit top */
    {s:"box",x:0,y:0.612,z:-0.250,w:0.13,h:0.030,d:0.008,c:ORANGE});                             /* the pilot, the one warm note the plan draws */
  parts.push({s:"cyl",x:-0.21,y:0.662,z:-0.135,r:0.105,h:0.19,c:POT},                            /* the stock pot, on the back-left burner */
    {s:"cyl",x:-0.21,y:0.764,z:-0.135,r:0.112,h:0.016,c:POTL},                                   /* its lid */
    {s:"sph",x:-0.21,y:0.780,z:-0.135,r:0.024,c:FOOT});                                          /* and the lid's knob */
  [-0.118,0.118].forEach(hx=>parts.push({s:"torus",x:-0.21+hx,y:0.700,z:-0.135,r:0.030,t:0.011,c:POTL,ry:Math.PI/2})); /* two handles */
  return meshTurned(parts,meshFacing(x,y));};

/* LA VALLA — the construction barricade, seven on the empty lot and six on Calle Principal at the
   street's opening stage. What TILEDRAW["G"] (engine.js, grep "a construction barricade") says it is:
   an orange BOARD with three white stripes, on two legs, with a lower rail — and its own comment says
   the version before it "stood up in 3D as a ladder (owner)". It is kind `fence`, and the engine turns
   a fence panel along its run BY KIND (engine3d.js, the kd==="fence" branch, grep `const fk=`): the
   barricade at ex (11,7) has a picket fence tile directly south of it, so the engine reads a
   north-south run and stands the barricade EDGE ON — in the frame it is a thin orange streak, which is
   docs/BEAUTIFY.md row F happening today. A BARRICADE IS NOT FENCE. It is a free-standing A-frame:
   two folding frames whose feet splay front-to-back, a brace between them, and one board bolted
   across the top. The stripes came off one stencil at the factory, so every barricade's are identical
   and lean the same way, and they are painted on BOTH faces (the default camera sees the back of half
   of them). What differs between barricades is what happened after: they were carried into the yard
   and set down — no two of the thirteen touch another one, so none of them is a run and each is
   turned its own way — one has had a leg kicked out, and the feet are dirty by how long they have
   stood there. */
TILEART_MESH["G"]=({x,y})=>{
  const h=(((x*5+y*3)%7)+7)%7;
  const ORANGE="#E0662B",LIT="#F08A4B",LEGC="#C25A1E",BRACE="#A8481A",WHITE="#F4F1EA",DIRT="#6B4A2E";
  const parts=[];
  [-0.29,0.29].forEach((lx,i)=>[[1,0.085],[-1,-0.085]].forEach(([s,lz])=>{
    const kick=(h%3===0&&i===0&&s>0)?0.13:0;                                                     /* one frame has had a leg kicked out */
    parts.push({s:"box",x:lx,y:0.233,z:lz,w:0.050,h:0.470,d:0.042,c:LEGC,rx:-s*(0.26+kick)});    /* the leg: its foot splays, its top meets its pair */
    parts.push({s:"box",x:lx,y:0.014,z:s*(0.145+kick*0.22),w:0.062,h:0.028+(h%4)*0.006,d:0.056,c:DIRT});}));  /* the foot, and how long it has stood in the dirt */
  parts.push({s:"box",x:0,y:0.175,z:0,w:0.62,h:0.045,d:0.032,c:BRACE});                          /* the brace between the frames */
  parts.push({s:"box",x:0,y:0.545,z:0,w:0.86,h:0.200,d:0.038,c:ORANGE});                         /* THE BOARD, 0.445 to 0.645 */
  parts.push({s:"box",x:0,y:0.648,z:0,w:0.86,h:0.012,d:0.042,c:LIT});                            /* its top edge, where the key lands */
  [[0.021,1],[-0.021,-1]].forEach(([bz,dir])=>[-0.26,0,0.26].forEach(sx=>
    parts.push({s:"box",x:sx,y:0.545,z:bz,w:0.076,h:0.215,d:0.008,c:WHITE,rz:dir*0.62})));        /* three stripes off one stencil, on both faces, each reading from its own side */
  return meshTurned(parts,(h-3)*0.20);};                                                          /* set down by hand: seven barricades, seven angles, none of them square to the world */

/* LA CAMA DEL PERRO — what Tacho sends up to the office when his district is done (a gift, not a map
   letter: content/meridian/config.js, grep "gift-ta" — it lands in f2 at (14,11), on the floor where a
   packing box used to be, and it is the only `○` in the game). What TILEART["○"] above draws: a purple
   ring, a paler middle, and a white bar with a knob at each end lying in it — a bone. It stood as a
   billboard, so a thing that lies on the floor was standing up in front of the player like a sign.
   Made as a dog bed is made: a base the cover is sewn over, a flat cushion, and ONE stuffed tube sewn
   into a ring round it — so the bolster is a torus, squashed, and the inside corner where it meets the
   cushion is the dark that makes the ring read. Then what the dog did: the front of the ring is
   crushed where she climbs in, and the bed is dragged, so it lies where it was left and not square to
   the room. 0.15 tall on purpose — a dog bed is a low ring on the floor, and that is the silhouette. */
TILEART_MESH["○"]=({x,y})=>{
  const h=(((x*5+y*3)%7)+7)%7;
  const BOLST="#7A5C8A",BOLSTL="#8E6E9E",CUSH="#9A7CAA",DARK="#4E3A5C",CRUSH="#6B4E7C",BONE="#F4F1EA";
  const parts=[
    {s:"cyl",x:0,y:0.016,z:0,r:0.300,h:0.032,c:DARK},                                     /* the base the cover is sewn over */
    {s:"cyl",x:0,y:0.044,z:0,r:0.255,h:0.030,c:CUSH},                                     /* the cushion inside the ring */
    {s:"torus",x:0,y:0.046,z:0,r:0.222,t:0.030,rx:Math.PI/2,sz:0.5,c:DARK},               /* the seam where they meet: every inside corner is dark */
    {s:"torus",x:0,y:0.062,z:0,r:0.252,t:0.092,rx:Math.PI/2,sz:0.62,c:BOLST},             /* the bolster: one stuffed tube, sewn into a ring — fat across, flat on top, as a stuffed tube sits */
    {s:"torus",x:0,y:0.098,z:0,r:0.252,t:0.058,rx:Math.PI/2,sz:0.30,c:BOLSTL},            /* its top, where the light lands */
    {s:"sph", x:0,y:0.052,z:0.235,r:0.130,sx:1.5,sy:0.30,c:CRUSH},                        /* the front, crushed flat where she climbs in */
    {s:"cyl",x:0.01,y:0.064,z:0.03,r:0.024,h:0.17,c:BONE,rz:Math.PI/2}];                  /* the bone, where she left it */
  [-0.085,0.085].forEach(bx=>[-0.027,0.027].forEach(bz=>
    parts.push({s:"sph",x:0.01+bx,y:0.064,z:0.03+bz,r:0.031,c:BONE})));                   /* its four knobs */
  return meshTurned(parts,(h-3)*0.30);};                                                   /* dragged: it lies where it was left */

/* LAS CAJAS DE LA MUDANZA — the taped boxes of the mid-move office (f2, four of them until the
   districts clear them) and the two in Limpieza Velázquez. `□` is `box:true` on purpose, and the
   owner is right that it IS a box — but a carton is not a cube, and the engine's box wore the carton's
   own FRONT ELEVATION on its LID: at 3× the top of every box in his office is a taped cross with a
   label lying face-up on it, on a body nearly as tall as a desk. Made the way a carton is made: ONE
   die-cut sheet, scored and folded into four walls; two inner flaps folded first, two outer flaps over
   them; tape down the centre seam where the outer two meet and a tab down each side — the H — and the
   label written on the SIDE, which is the side you can read in a stack. Sizes are a carton's, about
   half a tile, not a cupboard's. A stack is TWO CARTONS, not one tall one: the one underneath carries
   the weight, so it is squatter and wider, and the one on top was set down by hand, so it is askew
   and one of its flaps never quite went flat. Which tile stacks follows the picture's own parity, so
   the plan and the shape agree. And two cartons on neighbouring tiles were carried in together and
   dumped together, so they lean toward each other and TOUCH, the way the filing cabinets do. */
const meshCarton=(W,D,H,sd,openFlap)=>{
  const CARD="#C8A277",FLAP="#D8B589",SEAM="#8A6A45",TAPE="#EDE4D2",LABEL="#F6F2E8",INK="#6B5B45";
  const p=[{s:"box",x:0,y:H/2,z:0,w:W,h:H,d:D,c:CARD},                                     /* the four walls: one sheet, scored and folded */
    {s:"box",x:0,y:H-0.005,z:0,w:W-0.03,h:0.010,d:D-0.03,c:SEAM}];                         /* the two inner flaps, folded first and mostly covered */
  [-1,1].forEach(s=>{const lift=(openFlap&&s>0)?0.17:0;                                    /* one outer flap never quite went flat */
    p.push({s:"box",x:0,y:H+0.006+(lift?0.020:0),z:s*(D/4+0.004),w:W,h:0.012,d:D/2-0.010,c:FLAP,rx:-s*lift});});
  p.push({s:"box",x:0,y:H+0.014,z:0,w:W-0.02,h:0.006,d:0.042,c:TAPE});                     /* the tape down the centre seam */
  [-1,1].forEach(s=>p.push({s:"box",x:s*(W/2+0.004),y:H-0.038,z:0,w:0.009,h:0.078,d:0.042,c:TAPE})); /* and a tab down each side: the H */
  p.push({s:"box",x:0,y:H*0.42,z:D/2+0.005,w:W*0.46,h:H*0.34,d:0.006,c:LABEL});            /* the label, on the side you read in a stack */
  p.push({s:"box",x:-W*0.04,y:H*0.47,z:D/2+0.010,w:W*0.30,h:0.011,d:0.004,c:INK});         /* what somebody wrote on it */
  p.push({s:"box",x:-W*0.10,y:H*0.36,z:D/2+0.010,w:W*0.18,h:0.011,d:0.004,c:INK});
  return p;};
TILEART_MESH["□"]=({x,y})=>{
  const stacked=((((x|0)+(y|0))%2)+2)%2===1,h=(((x*5+y*3)%7)+7)%7;
  const w=CW(),bx=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return !!r&&r[gx]==="□";};
  let parts;
  if(stacked){
    parts=meshTurned(meshCarton(0.54,0.50,0.32,h,false),(h-3)*0.05);                       /* the one underneath: squatter and wider, because it carries the weight */
    parts=parts.concat(meshTurned(meshCarton(0.42,0.38,0.30,h+2,true),(h%3-1)*0.34)
      .map(p=>({...p,x:p.x+0.05,y:p.y+0.325,z:p.z-0.03})));                                /* the one on top, set down by hand */
  }else parts=meshTurned(meshCarton(0.50,0.46,0.42,h,h%3===1),0);
  parts=meshTurned(parts,meshFacing(x,y)+(h-3)*0.09);                                      /* the label toward the room, and nobody ever put a box down square */
  const sh=0.21,dx=bx(x+1,y)?sh:bx(x-1,y)?-sh:0,dz=bx(x,y+1)?sh:bx(x,y-1)?-sh:0;           /* carried in together, dumped together: the pair touches */
  return dx||dz?parts.map(p=>({...p,x:p.x+dx,z:p.z+dz})):parts;};

/* EL BOTE DE DOÑA MECHE — the tamale cart at the stop. NOT in the brief for this lane: it came out of
   sweeping every glyph Meridian lays against its kind and asking which still had no shape, which is
   what "all furniture and this type of item" actually asks for. It is kind `appliance`, it is one tile
   on the empty lot, and it stood as a BOX — so a two-wheeled handcart with a steel bote on it was a
   cupboard wearing its own lid-drawing on its lid. Its own comment says "A box in 3D with a side view,
   never a cutout", which was the best answer the day it was written and is not the best answer now.
   What the two drawings say it is made of (TILEART["ʘ"] and TILEART_SIDE["ʘ"] below): a wooden cart
   body, two wheels with pale hubs, a steel pot with a lighter body and a dark rim, a ladle, steam
   always, and a marigold on the lid in season. Made the way a handcart is made: an axle with a wheel
   on each end, the body planked on over it, a prop leg at the front so it stands still when it is
   parked, two push handles at the back; then the bote set down in the well of the deck, its domed lid
   with a rim and a knob, two ears to lift it by, and the ladle hooked over the side where the hand
   goes. The steam is three puffs at `a:` 0.3 — the glass path in t3MeshOf, which is the only way a
   vertex-coloured Lambert can be see-through. The marigold is la botánica's head (meshMarigold), so
   the season reaches this the same way it reaches the beds. */
TILEART_MESH["ʘ"]=({x,y})=>{
  const BODY="#8A6F4D",BODYD="#6E5638",TYRE="#3A3A44",HUB="#8A8F98",POT="#8A8F98",POTL="#B0B4BC",
        RIM="#6E7278",DARK="#3A3A44",STEAM="#F4F4F8";
  const parts=[];
  parts.push({s:"cyl",x:0,y:0.165,z:0.02,r:0.016,h:0.68,c:DARK,rz:Math.PI/2});                  /* the axle, across the cart */
  [-0.31,0.31].forEach(wx=>{parts.push({s:"cyl",x:wx,y:0.165,z:0.02,r:0.165,h:0.050,c:TYRE,rz:Math.PI/2});  /* a wheel */
    parts.push({s:"cyl",x:wx,y:0.165,z:0.02,r:0.055,h:0.056,c:HUB,rz:Math.PI/2});});            /* its pale hub */
  parts.push({s:"cyl",x:0,y:0.14,z:0.21,r:0.017,h:0.28,c:DARK});                                 /* the prop leg: a parked handcart stands on it */
  parts.push({s:"box",x:0,y:0.360,z:0,w:0.66,h:0.150,d:0.44,c:BODYD},                            /* the body, planked over the axle */
    {s:"box",x:0,y:0.368,z:0.225,w:0.62,h:0.120,d:0.014,c:BODY},                                 /* its front board, lit */
    {s:"box",x:0,y:0.438,z:0,w:0.68,h:0.022,d:0.46,c:BODY});                                     /* the deck */
  [-0.24,0.24].forEach(hx=>parts.push({s:"cyl",x:hx,y:0.520,z:-0.270,r:0.019,h:0.30,c:BODY,rx:0.45})); /* the two push handles */
  parts.push({s:"cyl",x:0,y:0.605,z:0,r:0.200,h:0.310,c:POT},                                    /* the bote, standing in the deck's well: 0.45 to 0.76 */
    {s:"cyl",x:0,y:0.640,z:0,r:0.206,h:0.055,c:POTL},                                            /* the band round it, where the light lands */
    {s:"torus",x:0,y:0.758,z:0,r:0.199,t:0.020,rx:Math.PI/2,c:RIM},                              /* the rim the lid sits in */
    {s:"sph",x:0,y:0.770,z:0,r:0.196,sy:0.34,c:POTL},                                            /* the domed lid */
    {s:"cyl",x:0,y:0.828,z:0,r:0.032,h:0.030,c:RIM});                                            /* its knob */
  [-0.205,0.205].forEach(ex=>parts.push({s:"torus",x:ex,y:0.660,z:0,r:0.040,t:0.013,c:RIM,ry:Math.PI/2})); /* two ears, to lift it by */
  parts.push({s:"cyl",x:0.252,y:0.680,z:0.10,r:0.012,h:0.32,c:DARK,rz:0.20},                     /* the ladle, hooked over the rim and leaning on the pot */
    {s:"sph",x:0.285,y:0.528,z:0.10,r:0.048,sy:0.5,c:DARK});                                     /* its bowl, down where the hand does not go */
  [[-0.04,0.90,0.075],[0.03,0.99,0.062],[0.09,1.07,0.048]].forEach(([sx2,sy2,r])=>
    parts.push({s:"sph",x:sx2,y:sy2,z:-0.02,r,sx:1.5,sy:0.8,c:STEAM,a:0.35}));                   /* steam, always — the one thing on this cart that is never off */
  if(typeof petalsOn==="function"&&petalsOn()&&typeof meshMarigold==="function")
    meshMarigold(parts,0.095,0.815,-0.06,0.055,petalPal(),3,1,0);                                /* a marigold on the lid in season, the same head the beds grow */
  return meshTurned(parts,meshFacing(x,y));};

const TILEMETA={"▭":{lift:13,kind:"wall"},"▤":{lift:13,kind:"wall"},
  /* H and I were cutouts in 3D (docs/BEAUTIFY.md: "the most box-shaped object in the game"). These
     two rows and the two TILEART_SIDE drawings above are the whole fix, and neither reaches the
     engine's own H and I — a world with no art.js still gets those. lift and kind are left exactly
     as the engine set them; only `box` is added. */
  "H":{box:true},"I":{box:true},
  
  "|":{lift:13,kind:"wall"},
  "□":{lift:5,kind:"prop",box:true},
  "=":{lift:13,kind:"facade",win:[[6,8,7,6],[19,8,7,6]]},
  "6":{lift:8,kind:"prop"},"7":{lift:12,kind:"prop"},"8":{lift:9,kind:"furniture"},"0":{lift:6,kind:"prop"},
  "&":{lift:13,kind:"facade",win:[[7,12,18,11]],awn:9},
  "!":{lift:13,kind:"facade",win:[[5,12,22,14]]},  /* was [5,11,22,12]; the art paints (5,12,22,14) and the two have to agree — the joinery, the dusk light and any sill prop all come off this rect */
  "▣":{lift:10,kind:"appliance"},"▯":{lift:9,kind:"furniture"},"⊔":{lift:6,kind:"furniture"},"○":{lift:3,kind:"prop"},
  "Y":{lift:13,kind:"transit",stand:true},   /* walkable, but a real object: nothing reads lift for a stand tile, it is a height class */
  "b":{lift:3,kind:"nature",box:true},       /* the raised bed (2026-09-21): solid via SOLIDX, a box because TILEART_SIDE draws its curb */
  "✿":{lift:2,kind:"nature",stand:true,petals:true}, /* loose petals: WALKABLE and standing, so the 3D camera asks for the heap's shape while the flat cameras keep painting it. Deliberately NOT in SOLIDX — the bed keeps its curb and the trail does not get one. `petals:true` is the engine seam: a tile a world declares as loose petals sheds on whoever walks through it (engine.js, petalDrop) — the engine never learns which glyph that is. */
  "g":{stand:true,kind:"nature"}             /* grass stands (2026-09-21): walkable, a mesh in 3D; no side art, so front and iso still paint it */
};

/* ---------- DECOART — the mural on Calle Principal ----------
   Nacho's wall, east of HQ's door. Seven tiles: his own Meridian Quest piece, then one panel
   per business. A panel nobody has worked yet is BABY BLUE PLASTER — the owner's call
   (2026-09-03): comforting, part of the painting, and it never reads as a list of things you
   have not done. When you begin a district the panel gets its colour; how bright it is comes
   from the grade the engine hands over in worldFlags(). Paint only ever goes on.

   All of this is content: the engine renders decor in four cameras and knows nothing about
   bakeries. [partner]'s pack draws its own wall, or declares no DECOR at all and has a plain one. */

const PLASTER="#C6DCEA";               /* baby blue — the wall under everything */
const PLASTER_D="#AFCADC";

function muralGround(sx,sy){
  ctx.fillStyle=PLASTER;ctx.fillRect(sx,sy,32,32);
  /* trowel marks, so it reads as plaster and not a flat rectangle */
  ctx.fillStyle=PLASTER_D;
  [[2,5,11,1],[16,9,9,1],[6,17,13,1],[19,24,8,1],[3,28,10,1]].forEach(q=>ctx.fillRect(sx+q[0],sy+q[1],q[2],q[3]));
  ctx.fillStyle="rgba(255,255,255,.18)";ctx.fillRect(sx,sy,32,3);
}
/* how loud a panel is painted: 0 = not begun (plaster only), 1 = pale, 2 = solid, 3 = full */
const muralInk=(hex,g)=>{
  if(g>=3)return hex;
  const m=/^#(..)(..)(..)$/.exec(hex);if(!m)return hex;
  const mix=g>=2?0.22:0.48;                                  /* toward the plaster */
  const p=[0xC6,0xDC,0xEA];
  return "#"+[1,2,3].map(i=>Math.round(parseInt(m[i],16)*(1-mix)+p[i-1]*mix).toString(16).padStart(2,"0")).join("");
};
const MURAL_K=0.72; /* the emblem, into the field the kept window leaves: its own (16,16) lands at (9.5,17.5). A transform, not six redrawings — the composition around the window is the owner's open call above. */
const muralGrade=id=>{try{const f=worldFlags();return (f.grade&&f.grade[id])|0;}catch(e){return 0;}};

/* the panel pictograms — one per business, drawn inside a 32x32 tile on the plaster */
const PANELART={
  principal:(sx,sy,c)=>{ /* Meridian Labs: a tower and a window grid */
    ctx.fillStyle=c;ctx.fillRect(sx+9,sy+8,14,19);
    ctx.fillStyle=PLASTER;[0,1,2].forEach(r=>[0,1].forEach(k=>ctx.fillRect(sx+12+k*6,sy+11+r*5,3,3)));},
  mercado:(sx,sy,c)=>{ /* El Mercado: a basket of produce */
    ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(sx+8,sy+16);ctx.lineTo(sx+24,sy+16);
    ctx.lineTo(sx+21,sy+27);ctx.lineTo(sx+11,sy+27);ctx.closePath();ctx.fill();
    ctx.fillStyle=PLASTER;[10,14,18].forEach((x,i)=>ctx.fillRect(sx+x,sy+19+(i%2),3,5));
    ctx.fillStyle=c;[[12,12],[16,10],[20,12]].forEach(q=>{ctx.beginPath();ctx.arc(sx+q[0],sy+q[1],3,0,7);ctx.fill();});},
  taller:(sx,sy,c)=>{ /* Taller Herrera: a wrench across a wheel */
    ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx+16,sy+18,7,0,7);ctx.stroke();
    ctx.lineWidth=4;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(sx+9,sy+26);ctx.lineTo(sx+23,sy+9);ctx.stroke();
    ctx.fillStyle=c;ctx.beginPath();ctx.arc(sx+23,sy+8,4,0,7);ctx.fill();
    ctx.fillStyle=PLASTER;ctx.beginPath();ctx.arc(sx+24,sy+6,2,0,7);ctx.fill();},
  espiga:(sx,sy,c)=>{ /* La Espiga: a wheat ear over a loaf */
    ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(sx+16,sy+24,9,4,0,0,7);ctx.fill();
    ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx+16,sy+19);ctx.lineTo(sx+16,sy+6);ctx.stroke();
    ctx.fillStyle=c;[0,1,2,3].forEach(i=>{[-1,1].forEach(k=>{
      ctx.beginPath();ctx.ellipse(sx+16+k*4,sy+8+i*3,3,1.8,k*0.7,0,7);ctx.fill();});});},
  velazquez:(sx,sy,c)=>{ /* Limpieza Velázquez: a bucket and a mop */
    ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(sx+7,sy+16);ctx.lineTo(sx+19,sy+16);
    ctx.lineTo(sx+17,sy+27);ctx.lineTo(sx+9,sy+27);ctx.closePath();ctx.fill();
    ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx+13,sy+15,6,Math.PI,0);ctx.stroke();
    ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx+24,sy+6);ctx.lineTo(sx+24,sy+22);ctx.stroke();
    ctx.fillStyle=c;ctx.fillRect(sx+21,sy+22,7,5);},
  esquina:(sx,sy,c)=>{ /* La esquina: Doña Meche's pot on a folding table — what is actually on that
    corner, not a symbol for it. The other six are a tower, a basket, a wrench, a wheat ear, a bucket
    and a stamp; hers is the pot, because a woman who has been there since before the rails is known
    by the thing she carries out every afternoon. Added 2026-09-17: the panel existed in DECOR from
    the day la esquina shipped and there was no drawing for it, so her wall was blank plaster at
    every grade, forever, and nothing said so. There is a guard for that now (test/smoke.js). */
    ctx.fillStyle=c;                                                      /* the pot */
    ctx.beginPath();ctx.moveTo(sx+9,sy+13);ctx.lineTo(sx+23,sy+13);ctx.lineTo(sx+21,sy+22);ctx.lineTo(sx+11,sy+22);ctx.closePath();ctx.fill();
    ctx.fillRect(sx+8,sy+10.5,16,2.5);                                    /* the lid */
    ctx.fillRect(sx+15,sy+7.5,2,3);                                       /* its knob */
    ctx.fillStyle=PLASTER;ctx.fillRect(sx+12,sy+16,8,1.4);                /* the band round the belly */
    ctx.fillStyle=c;[11,16,21].forEach((x,i)=>ctx.fillRect(sx+x,sy+1.5+(i%2)*1.8,1.6,4.5)); /* steam */
    ctx.fillRect(sx+6,sy+23,20,2);                                        /* the folding table */
    ctx.fillRect(sx+8,sy+25,1.8,4);ctx.fillRect(sx+22,sy+25,1.8,4);},     /* and its legs */
  nolasco:(sx,sy,c)=>{ /* Nolasco: a stamp coming down on a page */
    ctx.fillStyle=c;ctx.fillRect(sx+8,sy+15,14,12);
    ctx.fillStyle=PLASTER;[18,21,24].forEach((y,i)=>ctx.fillRect(sx+10,sy+y-2,10-i*2,1.4));
    ctx.fillStyle=c;ctx.fillRect(sx+12,sy+7,10,4);ctx.fillRect(sx+15,sy+3,4,4);},
};

const DECOART={
  /* Nacho's own piece: the city's name on the wall, always here, never earned */
  mural:(sx,sy)=>{
    muralGround(sx,sy);
    ctx.fillStyle="#E8A24A";ctx.beginPath();ctx.arc(sx+16,sy+13,7,Math.PI,0);ctx.fill();   /* a sun over the street */
    ctx.fillStyle="#C0392B";ctx.fillRect(sx+4,sy+20,24,3);
    ctx.fillStyle="#2E5FA8";ctx.fillRect(sx+4,sy+24,24,3);
    ctx.fillStyle="#4E8A58";ctx.fillRect(sx+4,sy+28,24,2);
    /* 7 units, the floor for in-scene text (SCENE_MIN): at 6 the word arrived around five CSS
       pixels tall on a phone and read as a smudge on the mural rather than the town's name.
       "MERIDIAN" is nine characters across 24 units, so it is condensed rather than shrunk. */
    ctx.fillStyle="#3A2F17";ctx.font="700 7px sans-serif";ctx.textAlign="center";
    ctx.save();ctx.translate(sx+16,sy+7.5);ctx.scale(0.88,1);
    ctx.fillText("MERIDIAN",0,0);ctx.restore();ctx.textAlign="start";},
  /* one panel per business: plaster until you begin, then colour that brightens with the grade.
     THE WALL KEEPS ITS WINDOWS (owner, 2026-09-17: "the store front icon or mural can go around
     it"). This painted plaster over the whole 32x32 and then the sill props were drawn on top of
     it, so at st(22,0) a lit pane, a sugar skull and a stone ledge sat in the middle of a blank
     wall with no window anywhere near them — which is exactly what he was looking at when he wrote
     "the skull on a non existing or visible window sill". A mural is painted ON a building; the
     windows are holes and holes do not take paint. So: plaster, the shop's emblem, and then the
     wall's own windows back through the paint, from the glyph's own TILES.win — never a copy of
     those numbers here, or the mural and the sill drift apart the first time one of them moves. */
  panel:(sx,sy,d)=>{
    muralGround(sx,sy);
    /* ONE window kept, the right-hand one, and it is the wall's own — winsOf reads TILES, so the
       glass, the ledge and the sugar skull are all placed from the same numbers and cannot drift.
       The other window is plastered over, which is what a muralist does with a window they do not
       want: the wall is the canvas and you paint out what is in the way. The DECOR row says so
       (`wins:[1]`) rather than this drawing deciding on its own, so the sill props and the dusk
       lighting paint out the same window this does. That also hands the emblem
       a clear field, which is the whole reason the two-window version was unreadable — rendered at
       8x on 2026-09-17, the basket and the wrench came out as ribbons between the panes.
       OPEN, and the owner's own call ("while we figure it out"): the emblem drawn AROUND the window
       instead of beside it — the skull on the sill as part of the picture. That is six drawings,
       one per business, and it is design, not plumbing. */
    const wins=winsKept(d.world,d.x,d.y),keep=wins[wins.length-1];  /* what this panel's DECOR row leaves (maps.js: wins:[1]) — the same list propSill and the dusk lighting read */
    const g=muralGrade(d.id),f=PANELART[d.id];
    if(g&&f){                               /* not begun: comforting blue, and nothing else */
      const ink=muralInk(d.c||"#C0392B",g);
      if(keep){ctx.save();ctx.translate(sx+9.5,sy+17.5);ctx.scale(MURAL_K,MURAL_K);ctx.translate(-16,-16);f(0,0,ink);ctx.restore();}
      else f(sx,sy,ink);                    /* a wall with no windows gets the whole tile, as before */
      if(g>=3){ctx.fillStyle="rgba(255,255,255,.5)";ctx.fillRect(sx+3,sy+5,2,2);ctx.fillRect(sx+15,sy+7,2,2);}}
    if(keep)drawPane(ctx,sx+keep[0],sy+keep[1],keep[2],keep[3]);},
};

/* ---------- the casita vocabulary — what Don Güero builds from ----------
   Three faces of a small Calle Dos house. A template composes them; adding a fourth here is
   how the street gets more variety, with no engine change and no new code anywhere.
   Solid, wall-tall, so 3D wraps the art onto the box like every other facade. */
const CASA_WALL="#C9A77C", CASA_TRIM="#8A6B48", CASA_ROOF="#9E5442";
/* the clay: three firings of the same barrel tile, the gap between them, and the dark paint a
   Calle Dos house wears to the knee so the damp does not show on the render */
const CASA_TEJA="#B0563F", CASA_TEJA2="#C4664A", CASA_TEJAD="#71382A", CASA_PLINTH="#6E5238";
const CASA_SILL="#E4D3B4";  /* cast concrete: the palest thing on the house, which is why a ledge reads */
/* THE ROOF IS THE POINT, and it is drawn here so all three faces share ONE roofline — two windows
   beside a door beside a lamp wall have to read as one building, not three boxes standing together
   (the owner, 2026-09-22, looking at exactly that). Drawn the way a roof is LAID, not the way it
   looks: the dark of the gaps first, a barrel of fired clay over each gap, the lit crown along each
   barrel's back, a cap along the ridge, and under the whole thing the eave shadow — the line that
   says the roof oversails the wall. The barrels are on a 4 px pitch, which divides 32 exactly, so
   the course runs THROUGH the join between two tiles instead of restarting at it. */
/* THE COURSE ITSELF, on its own, because the front door needs it too and a roof drawn twice
   in two places is a roof that will come apart. The phase is taken from `sx` on a 4 px pitch
   and 32/4 = 8, so every tile of the run starts the course at the same place in the barrel and
   it reads THROUGH the join rather than restarting at it. 8 px of clay, then 2 px of the eave's
   shadow on whatever is below it — which on the door tile is the head of the door. */
function casaRoof2D(sx,sy){
  ctx.fillStyle=CASA_TEJAD;ctx.fillRect(sx,sy,32,8);                /* the gaps the barrels lap over */
  for(let i=0;i<8;i++){const bx=sx+i*4;
    ctx.fillStyle=(i%2)?CASA_TEJA:CASA_TEJA2;ctx.fillRect(bx+0.3,sy+1,3.4,7);
    ctx.fillStyle="rgba(255,255,255,.17)";ctx.fillRect(bx+0.6,sy+1,1.1,7);}
  ctx.fillStyle=CASA_ROOF;ctx.fillRect(sx,sy,32,2.2);               /* the ridge cap, running through */
  ctx.fillStyle="rgba(255,255,255,.14)";ctx.fillRect(sx,sy,32,0.8);
  ctx.fillStyle="rgba(0,0,0,.34)";ctx.fillRect(sx,sy+8,32,2);       /* the eave's shadow on the wall */
}
/* ❗AND IT RUNS THROUGH THE FRONT DOOR. `⌂` is drawn by the ENGINE — one door body shared by
   every door in both games — and it fills its whole tile, so before this the roofline stopped
   dead at Doña Tencha's doorway and her house read as two stubs with a grey gap between them.
   `cap` is the engine's seam for exactly this (engine/engine.js, the DOORSET body): a door may
   say what the BUILDING above it wears, the body is drawn in the 8 px it has left, and a door
   that says nothing is untouched — which is every other door in Meridian and all of El
   Changarrito's, none of which is a `⌂`. Every `⌂` in this game is stamped by BUILDTPL.casa,
   so this cap and that template are the same decision written twice.
   Deliberately NOT in the 3D bake: the engine passes `rc.bake` there and skips the cap, because
   in 3D the roof is real geometry standing OVER the door slab and a second one painted onto the
   slab would hang inside the house.

   ❗AND IT ASKS WHERE THE DOOR STANDS, NOT WHAT LETTER IT IS. `⌂` is the front door of every casa
   and it is ALSO the way out of the room behind it — `CASA_ROOM` ends "#####⌂####", and so do the
   barbería's and the caseta's. Keyed on the glyph alone, this cap painted a course of terracotta
   roof tiles across the top of the door INSIDE Doña Tencha's living room. Three rooms, three
   indoor roofs, green in every suite, and it was found by looking at the picture.
   A roof runs over a door when the BUILDING runs up to it, so that is the question: is there a
   casa face beside this tile? Inside, the neighbours are `#` and the answer is 0 — the engine's
   own door, not one pixel changed. This is also why the seam takes a function: a door glyph is
   not a place, and only the pack knows which of its doorways has a house on top of it. */
const CASA_FACE="▩▨▦◫";  /* ◫ is the barbería's shopfront (#241): the same house, with a trade in it */
const casaRoofOver=(x,y)=>{const w=CW(),r=w&&w.rows&&w.rows[y];
  if(!r||x===undefined)return false;
  const L=r[x-1],R=r[x+1];
  return (L!==undefined&&CASA_FACE.indexOf(L)>=0)||(R!==undefined&&CASA_FACE.indexOf(R)>=0);};
if(typeof DOORLOOK!=="undefined"&&DOORLOOK["⌂"]){
  DOORLOOK["⌂"].capH=rc=>casaRoofOver(rc.x,rc.y)?8:0;
  DOORLOOK["⌂"].cap=rc=>casaRoof2D(rc.sx,rc.sy);
}
function casaBase(sx,sy,wall){
  ctx.fillStyle=wall||CASA_WALL;ctx.fillRect(sx,sy,32,32);
  casaRoof2D(sx,sy);
  ctx.fillStyle=CASA_PLINTH;ctx.fillRect(sx,sy+27,32,5);            /* the plinth, painted to the knee */
  ctx.fillStyle="rgba(255,255,255,.10)";ctx.fillRect(sx,sy+27,32,1);
  ctx.fillStyle=CASA_TRIM;ctx.fillRect(sx,sy+29,32,3);              /* the wet line at the bottom */
}
TILEART["▦"]=rc=>{const{sx,sy}=rc;                                   /* the REJA — a closed gate (#9, 2026-09-07) */
  /* It drew a door with a handle and a step, and the tile is a wall: "i cant enter the houses".
     The paperwork was right (kind: facade), the paint lied. Now it is honestly closed: the dark
     recess stays, iron bars over it, a chain and a padlock, the step kept so it is the same house.
     The template part is still called `door`; that names which tile carries the front. */
  casaBase(sx,sy);
  ctx.fillStyle="#3E2716";ctx.fillRect(sx+10,sy+13,12,16);            /* the recess */
  ctx.fillStyle="#2A2A30";ctx.fillRect(sx+9,sy+12,14,2);              /* the lintel bar */
  ctx.fillStyle="#3A3A44";[11,14,17,20].forEach(x=>ctx.fillRect(sx+x,sy+13,1.6,16)); /* the bars */
  ctx.fillStyle="rgba(255,255,255,.22)";[11,14,17,20].forEach(x=>ctx.fillRect(sx+x,sy+13,0.6,16));
  ctx.fillStyle="#2A2A30";ctx.fillRect(sx+9,sy+27,14,1.4);            /* the bottom rail */
  ctx.strokeStyle="#8A8A94";ctx.lineWidth=1.1;ctx.beginPath();        /* the chain, looped through two bars */
  ctx.moveTo(sx+14.5,sy+19);ctx.quadraticCurveTo(sx+16,sy+22.5,sx+17.8,sy+19);ctx.stroke();
  ctx.fillStyle="#E0B45C";ctx.fillRect(sx+14.8,sy+21,2.6,2.8);        /* the padlock, brass */
  ctx.fillStyle="#2A2A30";ctx.fillRect(sx+15.7,sy+22.2,0.8,0.8);
  ctx.fillStyle="#F2E8D8";ctx.fillRect(sx+9,sy+29,14,3);};           /* the step, kept: same house */
TILEART["▩"]=rc=>{const{sx,sy}=rc;                                   /* the window */
  /* An opening in a block wall is CAST, top and bottom: a lintel over it and a sill under it, both
     wider than the hole and both projecting, so the rain runs off the render instead of down it.
     The sill is the part that matters and the repository knows why — docs/POSTMORTEM.md §1: four
     fixes went to the SIZE of a sugar skull before anybody noticed there was no ledge under it. A
     ledge is a hard bright horizontal edge with a dark line beneath it, and that is the one shape
     that survives being three screen pixels tall. */
  casaBase(sx,sy);
  ctx.fillStyle="#5C4029";ctx.fillRect(sx+6,sy+10,20,16);            /* the reveal, in shadow */
  ctx.fillStyle=CASA_TRIM;ctx.fillRect(sx+7,sy+11,18,14);            /* the frame */
  ctx.fillStyle="#A9C6E0";ctx.fillRect(sx+9,sy+13,14,10);
  ctx.fillStyle="#C8DCEE";ctx.fillRect(sx+9.5,sy+13.5,4,4);          /* the sky in the left light */
  ctx.fillStyle=CASA_TRIM;ctx.fillRect(sx+15,sy+13,2,10);            /* the bar down the middle */
  ctx.fillStyle=CASA_SILL;ctx.fillRect(sx+4,sy+9,24,2);              /* the cast lintel */
  ctx.fillStyle=CASA_SILL;ctx.fillRect(sx+4,sy+25,24,2.2);           /* THE SILL: wider than the opening */
  ctx.fillStyle="rgba(0,0,0,.32)";ctx.fillRect(sx+4,sy+27.2,24,1.2); /* the shadow it throws */
  ctx.fillStyle="#B4633A";ctx.fillRect(sx+13,sy+21,6,4);             /* the pot, thrown, standing on it */
  ctx.fillStyle="#C9754A";ctx.fillRect(sx+12.4,sy+20.4,7.2,1.4);     /* its rim */
  ctx.fillStyle="#5F8A42";[[12.6,17.6,3.4,3.4],[15.4,16.8,3.6,4.2],[17.6,18,3.2,3]].forEach(q=>ctx.fillRect(sx+q[0],sy+q[1],q[2],q[3]));};
/* ◫ — EL ESCAPARATE (#241). The barbería is the same small house as the ones beside it, and that
   is the truth to keep: a barber rented a front room and fitted it out. So it is built in the order
   the fitting-out happened (.claude/skills/how-its-made): the house first, untouched (casaBase and,
   in 3D, casaShell); then the window knocked wider into one pane so the street can see the chair;
   then a canvas awning over it; then ONE pole on a bracket beside the door. The pole is the outline
   change (.claude/skills/shaping §1): it stands off the wall, so it survives being 35 px wide.
   Which tile carries the pole is asked of the street, not written into the tile: the one whose east
   neighbour is a door. On Calle Dos that is the west window, and the east window is the map's edge,
   so it can only happen once. */
const BARB_RED="#C8423A", BARB_BLUE="#2F4F8F", BARB_CANVAS="#F1ECE2", BARB_GLASS="#F4F4F4", BARB_STEEL="#B8B8B8";
TILEART["◫"]=rc=>{const{sx,sy,x,y}=rc;
  casaBase(sx,sy);
  const w=CW(),r=w&&w.rows&&w.rows[y],pole=!!(r&&typeof DOORSET!=="undefined"&&DOORSET.has(r[x+1]));
  const R=pole?25:29;                                                /* the shopfront stops short of the pole */
  for(let i=0;sx+3+i*3<sx+R;i++){                                    /* the awning's canvas, striped */
    ctx.fillStyle=i%2?BARB_CANVAS:BARB_RED;ctx.fillRect(sx+3+i*3,sy+10,Math.min(3,R-3-i*3),4);}
  ctx.fillStyle=BARB_BLUE;ctx.fillRect(sx+3,sy+14,R-3,1.6);          /* its valance */
  ctx.fillStyle="rgba(0,0,0,.30)";ctx.fillRect(sx+3,sy+15.6,R-3,1);  /* the shade it throws */
  ctx.fillStyle="#5C4029";ctx.fillRect(sx+4,sy+16.6,R-5,9);          /* the opening, knocked wider */
  ctx.fillStyle=CASA_TRIM;ctx.fillRect(sx+5,sy+17,R-7,8.2);          /* one frame, no bar: a shop pane */
  ctx.fillStyle="#7FA3C4";ctx.fillRect(sx+6,sy+18,R-9,6.4);          /* glass with a room behind it */
  ctx.fillStyle="#B89B6A";ctx.fillRect(sx+7.5,sy+18.5,5,5.4);        /* the mirror's frame, on the back wall */
  ctx.fillStyle="#E6EEF4";ctx.fillRect(sx+8.3,sy+19.2,3.4,4);        /* the mirror */
  ctx.fillStyle="#6A2626";ctx.fillRect(sx+15.5,sy+19,3,1.4);         /* the chair's headrest */
  ctx.fillStyle="#7A2E2E";ctx.fillRect(sx+14.5,sy+20.4,5,4);         /* the chair's back, facing the mirror */
  ctx.fillStyle=CASA_SILL;ctx.fillRect(sx+3,sy+25.2,R-3,1.8);        /* the sill, kept from the house */
  if(!pole)return;
  ctx.fillStyle="#8C8C8C";ctx.fillRect(sx+26,sy+17.5,5,1.2);ctx.fillRect(sx+26,sy+23.5,5,1.2);  /* two brackets */
  ctx.fillStyle=BARB_STEEL;ctx.fillRect(sx+27,sy+15.2,4.6,1.8);ctx.fillRect(sx+27,sy+24.6,4.6,1.8);  /* the caps */
  ctx.fillStyle="#D8D8D8";ctx.fillRect(sx+28.2,sy+13.6,2.2,1.6);     /* the globe on top */
  for(let j=0;j<8;j++)for(let c=0;c<4;c++){                           /* the glass, banded on the slant */
    ctx.fillStyle=[BARB_RED,BARB_GLASS,BARB_BLUE,BARB_GLASS][Math.floor((j+c)/2)%4];
    ctx.fillRect(sx+27.3+c,sy+17+j*0.95,1,0.95);}
};
TILEART["▨"]=rc=>{const{sx,sy,x,y}=rc;                               /* the blank wall, with a lamp */
  /* A blank wall is where a house keeps its fittings: the lamp on its bracket, and the meter with
     its conduit running down to the ground. Nothing says "somebody pays a bill here" faster.
     ONE METER PER HOUSE — `casaMeterHere` — or El Portero's two cheeks are identical twins. */
  casaBase(sx,sy,"#BE9A72");
  const jt=(((x*7+y*13)%5)+5)%5, lx=(jt-2)*1.1, ly=(jt%2)*0.7;       /* no two brackets at one height */
  ctx.fillStyle=CASA_TRIM;ctx.fillRect(sx+14.6+lx,sy+11+ly,2.8,3.4); /* the back plate and the arm */
  ctx.fillStyle="#6E5238";ctx.fillRect(sx+12+lx,sy+14+ly,8,1.6);     /* the hood, seen edge-on */
  ctx.fillStyle=CASA_TRIM;ctx.fillRect(sx+12.6+lx,sy+14.4+ly,6.8,1.6);
  ctx.fillStyle="#F2E0AE";ctx.beginPath();ctx.arc(sx+16+lx,sy+17.4+ly,2.6,0,7);ctx.fill();  /* the globe */
  ctx.fillStyle="rgba(242,224,174,.22)";ctx.beginPath();ctx.arc(sx+16+lx,sy+18.6+ly,5.4,0,7);ctx.fill();
  if(casaMeterHere(x,y)){
    ctx.fillStyle="#8A8F98";ctx.fillRect(sx+24.4,sy+19,1.2,8);       /* the conduit, down to the plinth */
    ctx.fillStyle="#C9CDD2";ctx.fillRect(sx+22,sy+13,6,7);           /* the meter box */
    ctx.fillStyle="#6E7278";ctx.fillRect(sx+23,sy+14,4,3.4);
    ctx.fillStyle="#E8EDF2";ctx.fillRect(sx+23.4,sy+14.6,3.2,1.2);}};/* its little window */
/* ʘ — Doña Meche's bote: a steel tamale pot on a cart at the trolley stop on Calle Dos (Nacho,
   2026-09-07: "tamales are sold at the transit stop in every barrio on earth"). A box in 3D with a
   side view, never a cutout; steam always, a marigold on the lid in season (art("bloom")). */
TILEART["ʘ"]=rc=>{const{sx,sy}=rc; /* from above: the round lid, the cart's edge, steam */
  ctx.fillStyle="#6E5638";ctx.fillRect(sx+4,sy+6,24,22);ctx.fillStyle="#8A6F4D";ctx.fillRect(sx+5,sy+7,22,20);
  ctx.fillStyle="#8A8F98";ctx.beginPath();ctx.arc(sx+16,sy+17,9,0,7);ctx.fill();ctx.fillStyle="#B0B4BC";ctx.beginPath();ctx.arc(sx+16,sy+17,7,0,7);ctx.fill();
  ctx.fillStyle="#6E7278";ctx.fillRect(sx+14,sy+16,4,2);
  const bl=art("bloom",null);if(bl){ctx.fillStyle=bl;ctx.beginPath();ctx.arc(sx+20,sy+13,2,0,7);ctx.fill();}
  ctx.fillStyle="rgba(255,255,255,.28)";const ph=Math.sin(Date.now()/500);[[-4,-9],[0,-11],[4,-8]].forEach((q,i)=>{ctx.beginPath();ctx.arc(sx+16+q[0]+ph*(i-1),sy+17+q[1]-ph,1.6,0,7);ctx.fill();});};
TILEART_SIDE["ʘ"]=rc=>{const{sx,sy}=rc; /* from the front: the cart, two wheels, the pot on top, steam, a ladle */
  ctx.fillStyle="rgba(15,12,20,.18)";ctx.beginPath();ctx.ellipse(sx+16,sy+30,12,2,0,0,7);ctx.fill();
  ctx.fillStyle="#6E5638";ctx.fillRect(sx+5,sy+16,22,9);ctx.fillStyle="#8A6F4D";ctx.fillRect(sx+6,sy+17,20,7);
  ctx.fillStyle="#3A3A44";[9,23].forEach(x=>{ctx.beginPath();ctx.arc(sx+x,sy+27,3,0,7);ctx.fill();});ctx.fillStyle="#8A8F98";[9,23].forEach(x=>{ctx.beginPath();ctx.arc(sx+x,sy+27,1.1,0,7);ctx.fill();});
  ctx.fillStyle="#8A8F98";ctx.fillRect(sx+9,sy+7,14,10);ctx.fillStyle="#B0B4BC";ctx.fillRect(sx+10,sy+8,12,8);ctx.fillStyle="#6E7278";ctx.fillRect(sx+8,sy+6,16,2);
  ctx.fillStyle="#3A3A44";ctx.fillRect(sx+22,sy+3,1.2,6);ctx.fillRect(sx+21,sy+2.5,3,1.4); /* the ladle */
  const bl=art("bloom",null);if(bl){ctx.fillStyle=bl;ctx.beginPath();ctx.arc(sx+12,sy+5.5,2,0,7);ctx.fill();}
  ctx.fillStyle="rgba(255,255,255,.3)";const ph=Math.sin(Date.now()/500);[[-3,2],[0,-1],[3,1]].forEach((q,i)=>{ctx.beginPath();ctx.arc(sx+16+q[0]+ph*(i-1),sy+q[1]-ph,1.5,0,7);ctx.fill();});};
Object.assign(TILEMETA,{
  "ʘ":{lift:8,kind:"appliance"},
  "▦":{lift:13,kind:"facade"},
  "▩":{lift:13,kind:"facade"},
  "◫":{lift:13,kind:"facade"},   /* casaWH reads lift: anything but 13 puts a step in the roof */
  "▨":{lift:13,kind:"facade"},
});

/* ---------- THE CASITA IN THREE DIMENSIONS — a house, not a box wearing a drawing ----------
   (el albañil, crew iteration 14. The owner, 2026-09-22: "should we shape and beautify buildings?
   lets not over do it since we are limited in tokens but if you decide to start the buildings -
   start with the small houses that we can create with don gueros help eventually even within game
   right? i think dona tenchas was one of those. dont do all buildings, just do one or two and show
   me." Two faces: ▩ the window and ▨ the lamp wall. ▦ the reja is the third and is deliberately
   NOT shaped — see the note at the foot of this block.)

   HOW A CALLE DOS HOUSE IS ACTUALLY BUILT, which is the order these parts go on
   (.claude/skills/how-its-made — draw a thing by the process that made it): a footing, then a
   plinth painted dark to the knee so the damp does not show on the paint; block walls rendered and
   painted; a cast lintel over every opening and a cast sill under it, both wider than the hole and
   both projecting so the rain falls clear of the render; a ring beam at the head of the wall; the
   VIGAS laid across it and oversailing it; and on the vigas the TEJA — barrel tiles of fired clay,
   laid in courses, each lapping the one below, a cap along the ridge. The variation entered AT THE
   TILE, because the tiles were made one at a time over a former and fired in a heap: so what
   differs between two barrels here is the colour of the clay and a hair of its lay, and nothing
   above that step differs. The wall is one pour, so the wall does not vary.

   ❗THE ONE NUMBER THAT MAY NOT MOVE, and it is why this file measures instead of typing 1.096.
   A mesh BEATS the wall box — engine3d.js t3MeshTile, whose own comment is "the mesh view beats
   box, billboard and even wall" — and four places in the engine still compute against `wallH(g)`,
   the box formula over the glyph's declared `lift`, for a facade: the door's lintel, a person
   working in a window, wall decor, and the sill pane. Not one of them asks the shape how tall it
   is. So THE WALL PLANE OF THIS HOUSE STOPS AT EXACTLY `wallH`, and everything that makes it a
   house instead of a box — the eave, the teja, the ridge — stands ABOVE that line and hangs
   OUTSIDE the tile. Doña Tencha's front door borrows its lintel height from the wall beside it;
   move that line and a slot of daylight opens along the top of her door. The guard is
   test/smoke.js, grep `const casa3d` (the block; its failure sentence begins `the shaped house at`).
   (`li`'s U mesh — the only other wall with a shape — writes `const WH=0.55+13*0.042` by hand.
   That is right today and nothing guards it. Here the height is read from the glyph's own `lift`,
   so an edit to TILEMETA moves the shape with the engine instead of away from it.) */
const casaWH=g=>0.55+(((typeof TILES!=="undefined"&&TILES[g])||{}).lift|0)*0.042;
const CASA_CAP="#8E4335",     /* the ridge cap: older clay off another roof, weathered darker */
      CASA_SOFFIT="#6E5238";  /* the vigas and the plinth: timber and dark paint */
/* WHICH WAY THE HOUSE FACES, and it is NOT meshFacing. meshFacing takes the first open side —
   south, east, west, north — and the casa template sweeps its sidewalk at y+1 and then stands a
   pot or the guest chair ON that sidewalk. So at Doña Tencha's window tile the south is the guest
   chair (solid) and the first open side is EAST: her own front door. meshFacing would have turned
   her house to face its own doorway. A casa faces the row the template swept, and a thing standing
   in the yard is IN FRONT of the house, not beside it. */
const CASA_YARD="P⊔";
const casaFront=(x,y)=>{const w=CW(),free=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];
    if(!r||r[gx]===undefined)return false;const g=r[gx];
    return !SOLID.has(g)||(typeof DOORSET!=="undefined"&&DOORSET.has(g))||CASA_YARD.indexOf(g)>=0;};
  return free(x,y+1)?0:free(x,y-1)?Math.PI:0;};
/* ❗ONE METER PER HOUSE, NOT ONE PER WALL — the rule both the drawing and the shape ask. El
   Portero's hut is two blank walls with the door between them, and hanging the same lamp and the
   same meter on both made two identical cheeks: the tell `.claude/skills/how-its-made` warns about
   whenever several of the same thing stand together. The variation has to enter where it entered in
   life — the electricity company fits ONE meter to a house and fits it once — so the meter stands
   only where the house's run ENDS, and every other blank wall keeps the lamp alone. */
const casaMeterHere=(x,y)=>{const w=CW(),ry=casaFront(x,y),
  ax=Math.round(Math.cos(ry)),az=Math.round(-Math.sin(ry)),
  r=w&&w.rows&&w.rows[y+az],g=r&&r[x+ax]!==undefined?r[x+ax]:null;
  return !(g!==null&&(CASA_FACE.indexOf(g)>=0||(typeof DOORSET!=="undefined"&&DOORSET.has(g))));};
/* THE SHELL EVERY CASA FACE SHARES — plinth, wall, ring beam, vigas, eave and teja. Built once,
   here, because that is what makes three tiles one building: the courses are on a pitch that
   divides the tile exactly, so a barrel run carries THROUGH the join, and the roof carries over
   the front door (which is a `⌂` and has no mesh of its own) half a tile from either side. */
const casaShell=(g,x,y,ry)=>{
  const WH=casaWH(g),wall=g==="▨"?"#BE9A72":CASA_WALL,P=[];
  const w=CW(),at=(gx,gy)=>{const r=w&&w.rows&&w.rows[gy];return r&&r[gx]!==undefined?r[gx]:null;};
  const ax=Math.round(Math.cos(ry)),az=Math.round(-Math.sin(ry));  /* the mesh's own +x, in world steps */
  const isCasa=c=>c!==null&&CASA_FACE.indexOf(c)>=0;   /* the ONE list — a second copy here left ◫ out of the roof (#241) */
  const isDoor=c=>c!==null&&typeof DOORSET!=="undefined"&&DOORSET.has(c);
  const gE=at(x+ax,y+az),gW=at(x-ax,y-az);
  const ovE=isDoor(gE)?0.5:isCasa(gE)?0:0.07,ovW=isDoor(gW)?0.5:isCasa(gW)?0:0.07;
  const endE=!isCasa(gE)&&!isDoor(gE),endW=!isCasa(gW)&&!isDoor(gW);
  const EO=0.62,EH=0.04,RH=0.30;                  /* eave 0.12 proud of the wall; ridge 0.30 over its head */
  const x0=-0.5-ovW,x1=0.5+ovE,RX=(x0+x1)/2,RW=x1-x0;
  const th=Math.atan2(RH-EH,EO),L=Math.hypot(RH-EH,EO),ct=Math.cos(th),st=Math.sin(th);
  const rnd=(k,j)=>{const v=Math.sin(x*12.9898+y*78.233+k*39.425+j*17.719)*43758.5453;return v-Math.floor(v);};
  P.push({s:"box",x:0,y:0.055,z:0,w:1,h:0.11,d:1.03,c:CASA_SOFFIT});          /* 1 · the plinth */
  P.push({s:"box",x:0,y:WH/2,z:0,w:1,h:WH,d:1,c:wall});                       /* 2 · the wall — ❗its top is wallH */
  P.push({s:"box",x:0,y:WH-0.035,z:0,w:1,h:0.07,d:1,c:CASA_TRIM});            /* 3 · the ring beam at its head */
  [-0.31,0,0.31].forEach(vx=>                                                 /* 4 · the vigas, oversailing */
    P.push({s:"box",x:vx,y:WH+0.05,z:0.24,w:0.055,h:0.05,d:0.72,c:CASA_SOFFIT}));
  [1,-1].forEach(sd=>{                                                        /* 5 · the sheathing, two slopes */
    P.push({s:"box",x:RX,y:WH+(RH+EH)/2,z:sd*EO/2,w:RW,h:0.035,d:L,c:CASA_TEJAD,rx:sd*th});
    const NB=7,PIT=1/NB,br=PIT*0.56;                                          /* 6 · the teja, 7 to the tile */
    const k0=Math.round((x0+0.5)/PIT),k1=Math.round((x1+0.5)/PIT)-1;
    for(let k=k0;k<=k1;k++){const bx=-0.5+(k+0.5)*PIT;if(bx<x0-0.01||bx>x1+0.01)continue;
      const off=br+0.016,jt=rnd(k,sd);
      P.push({s:"cyl",x:bx,y:WH+(RH+EH)/2+off*ct,z:sd*(EO/2+off*st),r:br*(0.94+jt*0.12),h:L+0.03,
              c:[CASA_TEJA,CASA_TEJA2,CASA_ROOF][((k%3)+3)%3],rx:sd*(Math.PI/2+th)});}
    P.push({s:"box",x:RX,y:WH+EH-0.015,z:sd*(EO+0.012),w:RW,h:0.055,d:0.028,c:CASA_CAP});});  /* 7 · the fascia */
  P.push({s:"cyl",x:RX,y:WH+RH+0.028,z:0,r:0.048,h:RW,c:CASA_CAP,rz:Math.PI/2});              /* 8 · the ridge cap */
  /* 9 · where the run ENDS, the roof has a gable to close: the triangle between the wall's head and
        the two slopes, in the wall's own render, stepped in five courses the way it was laid up. */
  const gable=gx=>{for(let i=0;i<5;i++){const t=(i+0.5)/5;
    P.push({s:"box",x:gx,y:WH+EH+(RH-EH)*t,z:0,w:0.07,h:(RH-EH)/5+0.012,d:2*EO*(1-t*0.92),c:wall});}};
  if(endE)gable(0.5-0.03); if(endW)gable(-0.5+0.03);
  return P;};
/* ▩ — LA VENTANA. Three of these stand on Calle Dos today: one is the whole west half of Doña
   Tencha's front, and two are the Barbería El Espejo's, which is the same small house with a
   different trade in it. The opening is the rectangle the 2D face draws, because the front camera
   still shows that drawing and the two must be the same window.
   ❗NOT to the pixel, and the last round's comment here said it was. The drawing is stretched over a
   wall 1.096 tall and these parts are written in tile units, so the mesh window sits about 0.03 of a
   tile — one screen pixel at the face's own size — higher than the drawn one. Measured, not fixed:
   correcting it would move the cast sill, which is now pinned by how far the engine hangs a sugar
   skull's lit pane (see the note at THE CAST WORK below), and one pixel is not worth that. */
/* ❗A WINDOW HERE IS A RELIEF, NOT A HOLE. The wall is one solid box and nothing subtracts from it,
   so every part of the opening stands PROUD of the wall face and the recess is painted, not cut.
   The first draft of this inset the frame and the glass to z = F−0.02, which is INSIDE the wall:
   rendered, the window was a black rectangle and the reveal's front face z-fought the render. Found
   by looking at the picture, in the first frame, exactly as docs/POSTMORTEM.md §2 promises. */
TILEART_MESH["▩"]=({x,y})=>{const ry=casaFront(x,y),P=casaShell("▩",x,y,ry),F=0.5;
  P.push({s:"box",x:0,y:0.49,z:F+0.006,w:0.62,h:0.52,d:0.012,c:"#4A3220"});     /* the opening, in shadow */
  P.push({s:"box",x:0,y:0.49,z:F+0.014,w:0.56,h:0.44,d:0.010,c:CASA_TRIM});     /* the frame */
  [-0.143,0.143].forEach(px=>{
    P.push({s:"box",x:px,y:0.49,z:F+0.022,w:0.235,h:0.385,d:0.010,c:"#A9C6E0"});     /* the two lights */
    P.push({s:"box",x:px-0.05,y:0.565,z:F+0.030,w:0.10,h:0.13,d:0.006,c:"#C8DCEE"});}); /* sky in the glass */
  P.push({s:"box",x:0,y:0.49,z:F+0.030,w:0.035,h:0.41,d:0.012,c:CASA_TRIM});    /* the bar down the middle */
  /* ❗HOW FAR THE CAST WORK MAY STAND OUT, and it is not a matter of taste. When a sweet stands on
     a sill in season the engine hangs the lit pane at 0.12 of a tile proud of the wall face and its
     ledge at 0.17 (engine3d.js, `SILL_PROUD`) — a flat Sprite, so anything of this house's that
     reaches further does not share the space with it, it EATS it. The first draft's sill reached
     0.127 and sat 0.007 in front of the pane: invisible today only because ▩ declares no `win`, and
     the day somebody gives this window one — which the drawn ledge invites — the sweet's pane would
     have been clipped along its bottom edge by the very ledge that was built to hold it. Pulled to
     0.115, measured against the pane the engine actually places, and guarded in test/smoke.js
     (grep `the pane a sweet stands in`). The ledge loses four tenths of a screen pixel. */
  P.push({s:"box",x:0,y:0.745,z:F+0.048,w:0.74,h:0.065,d:0.11,c:CASA_SILL});    /* the cast lintel, proud */
  P.push({s:"box",x:0,y:0.243,z:F+0.052,w:0.76,h:0.048,d:0.125,c:CASA_SILL});   /* THE SILL: a hard bright edge */
  P.push({s:"box",x:0,y:0.204,z:F+0.042,w:0.76,h:0.030,d:0.11,c:"#4A3220"});    /* and the shadow under it */
  /* ❗WHAT VARIES BETWEEN TWO WINDOWS ON ONE HOUSE, and what does not. The frame, the sill and the
     lintel were made by one joiner and cast in one form on one morning, so two openings on one
     front ARE the same and drawing them different would be the lie. THE POT IS NOT: somebody
     carried it out and stood it there, one at a time, years apart. So the variation enters at the
     pot — its clay, its size, where it sits on the ledge, and whether there is one at all — and
     nowhere above it (.claude/skills/how-its-made). Before this, the Barbería's two windows and
     Doña Tencha's seedB pair were the same window twice, which is what a stamped street looks like
     when nobody asks at which step the difference entered. */
  const pt=(((x*7+y*13)%6)+6)%6, PC=["#B4633A","#9E5442","#B4633A","#8A6B48","#A8552F","#B4633A"][pt];
  if(pt!==3){const ps=0.92+(pt%3)*0.09, po=-0.02+((pt%4)-1.5)*0.045;
    P.push({s:"cyl",x:po,y:0.310+0.012*ps,z:F+0.075,rt:0.072*ps,rb:0.052*ps,h:0.10*ps,c:PC});   /* thrown */
    P.push({s:"cyl",x:po,y:0.362+0.024*ps,z:F+0.075,r:0.077*ps,h:0.018,c:"#C9754A"});           /* its rim */
    [[-0.06,0.115,0.052],[0.02,0.145,0.056],[0.07,0.108,0.046]].forEach((q,i)=>
      P.push({s:"sph",x:po+q[0]*ps,y:0.310+(q[1]+0.012)*ps,z:F+0.075,r:q[2]*ps,sy:0.82,
              c:["#5F8A42","#4E7A38","#6E9A4E"][(pt+i)%3]}));}                    /* what is growing in it */
  else{P.push({s:"cyl",x:0.06,y:0.315,z:F+0.072,r:0.030,h:0.10,c:"#4E6E4A"});      /* or nobody planted one, */
       P.push({s:"cyl",x:0.06,y:0.372,z:F+0.072,r:0.014,h:0.030,c:"#4E6E4A"});}    /* and a bottle stands there */
  return meshTurned(P,ry);};
/* ◫ — EL ESCAPARATE in 3D. The same fitting-out, in the same order, on the same shell. Every part
   stands PROUD of the wall, as the window's do (a window here is a relief, not a hole). The awning
   stops over its own window and never crosses the door: the door slab is a full tile tall
   (engine3d.js, BoxGeometry(1,1,0.14) at y 0.5), and canvas at 0.8–0.97 would run through it. */
TILEART_MESH["◫"]=({x,y})=>{const ry=casaFront(x,y),P=casaShell("◫",x,y,ry),F=0.5;
  const w=CW(),ax=Math.round(Math.cos(ry)),az=Math.round(-Math.sin(ry));
  const r=w&&w.rows&&w.rows[y+az],gE=r&&r[x+ax]!==undefined?r[x+ax]:null;
  const pole=gE!==null&&typeof DOORSET!=="undefined"&&DOORSET.has(gE);    /* the door is on my +x: the pole is mine */
  const WX=pole?-0.04:0,WW=0.66;                                          /* the shopfront steps aside for it */
  P.push({s:"box",x:WX,y:0.47,z:F+0.006,w:WW+0.06,h:0.56,d:0.012,c:"#4A3220"});   /* the opening, knocked wider */
  P.push({s:"box",x:WX,y:0.47,z:F+0.014,w:WW,h:0.50,d:0.010,c:CASA_TRIM});         /* one frame */
  P.push({s:"box",x:WX,y:0.47,z:F+0.022,w:WW-0.06,h:0.44,d:0.010,c:"#7FA3C4"});    /* one pane, a room behind it */
  P.push({s:"box",x:WX-0.13,y:0.52,z:F+0.027,w:0.17,h:0.25,d:0.006,c:"#B89B6A"});  /* the mirror's frame */
  P.push({s:"box",x:WX-0.13,y:0.52,z:F+0.030,w:0.13,h:0.21,d:0.006,c:"#E6EEF4"});  /* the mirror */
  P.push({s:"box",x:WX+0.10,y:0.39,z:F+0.027,w:0.14,h:0.17,d:0.006,c:"#7A2E2E"});  /* the chair's back */
  P.push({s:"box",x:WX+0.10,y:0.50,z:F+0.027,w:0.08,h:0.045,d:0.006,c:"#6A2626"}); /* its headrest */
  [-0.16,-0.08,0,0.08,0.16].forEach(lx=>                                           /* the name, painted on the glass */
    P.push({s:"box",x:WX+lx,y:0.655,z:F+0.030,w:0.05,h:0.022,d:0.004,c:"#F4F1EA"}));
  P.push({s:"box",x:WX,y:0.755,z:F+0.048,w:WW+0.08,h:0.06,d:0.11,c:CASA_SILL});    /* the lintel, proud */
  P.push({s:"box",x:WX,y:0.215,z:F+0.052,w:WW+0.10,h:0.048,d:0.125,c:CASA_SILL});  /* the sill, proud */
  P.push({s:"box",x:WX,y:0.178,z:F+0.042,w:WW+0.10,h:0.030,d:0.11,c:"#4A3220"});   /* and its shadow */
  /* the awning: canvas on two arms, from the wall at 0.97 down and out to 0.82, 0.30 proud.
     ❗ITS LOW EDGE IS SET BY THE CAMERA, not by taste. A sugar skull's pane hangs in this window in
     season (0.31–0.59 up, 0.12 proud — measured off one the engine really placed), and the camera
     looks down at about 40°, so anything standing further out than the pane hides its top edge
     unless it is higher than the pane's top by (how much further out) × tan 40°. At 0.80 the
     valance grazed it; at 0.82 it clears. test/smoke.js (10) checks exactly this sightline. */
  const AW=0.78,AY0=0.97,AY1=0.82,AZ=0.30,th=Math.atan2(AY0-AY1,AZ),L=Math.hypot(AY0-AY1,AZ),NS=7;
  for(let i=0;i<NS;i++)P.push({s:"box",x:WX-AW/2+(i+0.5)*AW/NS,y:(AY0+AY1)/2,z:F+AZ/2,w:AW/NS+0.002,h:0.018,d:L,
                               c:i%2?BARB_CANVAS:BARB_RED,rx:th});
  P.push({s:"box",x:WX,y:AY1-0.025,z:F+AZ+0.004,w:AW,h:0.05,d:0.012,c:BARB_BLUE});  /* the valance */
  [-1,1].forEach(sd=>P.push({s:"box",x:WX+sd*AW/2,y:(AY0+AY1)/2,z:F+AZ/2,w:0.014,h:0.014,d:L,c:"#5A5A5A",rx:th}));  /* the arms */
  if(pole){const PX=0.43,PZ=F+0.15;                                       /* THE POLE: glass on a wall bracket */
    [0.42,0.74].forEach(by=>P.push({s:"box",x:PX,y:by,z:F+0.075,w:0.03,h:0.03,d:0.15,c:"#8C8C8C"}));  /* brackets */
    P.push({s:"cyl",x:PX,y:0.35,z:PZ,r:0.07,h:0.05,c:BARB_STEEL});                /* bottom cap */
    P.push({s:"cyl",x:PX,y:0.575,z:PZ,r:0.055,h:0.40,c:BARB_GLASS});              /* the glass */
    for(let i=0;i<6;i++)P.push({s:"cyl",x:PX,y:0.41+i*0.065,z:PZ,r:0.058,h:0.022,  /* the stripe, on the slant */
                                 c:i%2?BARB_BLUE:BARB_RED,rz:0.5});
    P.push({s:"cyl",x:PX,y:0.80,z:PZ,r:0.07,h:0.05,c:BARB_STEEL});                /* top cap */
    P.push({s:"sph",x:PX,y:0.855,z:PZ,r:0.045,c:"#D8D8D8"});}                     /* and its globe */
  return meshTurned(P,ry);};
/* ▨ — EL MURO CIEGO. The blank wall is where a house keeps its fittings: the lamp on its bracket,
   and the meter with its conduit running down to the plinth. Three stand on Calle Dos — the east
   end of Doña Tencha's, and both cheeks of El Portero's site hut, which is the same small building
   with a clipboard in it. */
TILEART_MESH["▨"]=({x,y})=>{const ry=casaFront(x,y),P=casaShell("▨",x,y,ry),F=0.5;
  /* the same fittings the 2D face draws, and by the same rule: one meter per house (casaMeterHere),
     a lamp on every blank wall, and no two brackets hung at exactly the same height. */
  const meter=casaMeterHere(x,y);
  const jt=(((x*7+y*13)%5)+5)%5, lx=-0.02+(jt-2)*0.035, ly=(jt%2)*0.022;
  P.push({s:"box",x:lx,y:0.845+ly,z:F+0.006,w:0.09,h:0.12,d:0.02,c:CASA_TRIM});          /* the back plate */
  P.push({s:"box",x:lx,y:0.858+ly,z:F+0.078,w:0.028,h:0.028,d:0.16,c:CASA_TRIM});        /* the arm */
  P.push({s:"cone",x:lx,y:0.788+ly,z:F+0.148,r:0.102,h:0.10,c:CASA_TRIM,rx:Math.PI});    /* the hood, mouth down */
  P.push({s:"sph",x:lx,y:0.726+ly,z:F+0.148,r:0.052,c:"#F2E0AE"});                       /* the globe */
  if(meter){
    P.push({s:"box",x:0.31,y:0.605,z:F+0.026,w:0.14,h:0.18,d:0.05,c:"#C9CDD2"});         /* the meter box */
    P.push({s:"box",x:0.31,y:0.622,z:F+0.053,w:0.09,h:0.085,d:0.008,c:"#6E7278"});       /* its face */
    P.push({s:"box",x:0.31,y:0.636,z:F+0.058,w:0.07,h:0.030,d:0.006,c:"#E8EDF2"});       /* its little window */
    P.push({s:"box",x:0.31,y:0.300,z:F+0.014,w:0.022,h:0.44,d:0.022,c:"#8A8F98"});}      /* the conduit down */
  return meshTurned(P,ry);};
/* ❗▦ — LA REJA IS DELIBERATELY NOT SHAPED, and this is the note so nobody is surprised later.
   The owner said "just do one or two and show me", and the reja stands on NO street today: it is
   used only by BUILDTPL.casita, and no row of BUILDS uses that template (the comment over BUILDS:
   "NO LOTS ARE BUILT"). Shaping it would have been an hour spent on a tile nobody can walk to.
   It shares the 2D roofline above, so the front camera already reads it as the same house. THE DAY
   A CASITA LOT GOES UP, give it `TILEART_MESH["▦"] = ({x,y})=>{const ry=casaFront(x,y); return
   meshTurned(casaShell("▦",x,y,ry).concat(<the gate>),ry);}` — because until it has one, a reja
   standing next to a shaped ▩ is a flat-lidded box in the middle of a pitched roof. */

/* ---------- BUILDTPL — the templates themselves ----------
   `casita`: a four-tile house front on Calle Dos with a swept strip of sidewalk in front.
   What varies: which tile holds the door, whether the far end is a window or a blank wall
   with a lamp, and what the family left out front. Later parts can read earlier ones — the
   yard only appears when the door is not on the very edge, because nobody puts a pot where
   the door swings. */
const BUILDTPL={
  casita:{
    id:"casita", size:{w:3,h:2},
    parts:[
      {id:"shell", tiles:[[0,0,"▩"],[0,1,"▩"],[0,2,"▩"],
                          [1,0,"."],[1,1,"."],[1,2,"."]]},
      {id:"door", pick:[
        {id:"middle", w:3, tiles:[[0,1,"▦"]]},
        {id:"left",   w:2, tiles:[[0,0,"▦"]]},
        {id:"right",  w:2, tiles:[[0,2,"▦"]]},
      ]},
      {id:"end", pick:[
        {id:"window", w:2, tiles:[]},
        {id:"lamp",   w:1, tiles:[[0,2,"▨"]]},
      ]},
      /* nobody puts a pot where the door swings, so the yard reads what the door chose */
      {id:"yard", when:c=>c.pick.door!=="left", pick:[
        {id:"none",  w:2, tiles:[]},
        {id:"plant", w:2, tiles:[[1,0,"P"]]},
        {id:"chair", w:1, tiles:[[1,0,"⊔"]]},   /* "⊔" is the guest chair; this said "C", which is the TRAFFIC CONE — inert only because BUILDS is empty, and a kickable cone in somebody's front yard once it is not (found 2026-09-04) */
      ]},
    ],
  },
};

/* ---------- `casa` — a home you can ENTER (#10, the owner: "lets take this on don guero!") ----------
   The same three-tile front as the casita, but the middle tile is a real front door ⌂ that the
   template LINKS to a room it carries: a small living room with a table, a rug, a shelf, a plant,
   a north window, and a neighbour with three lines. The engine stamps the room as a world of its
   own per lot (named after the lot), keyed by where the door stands, so this template can go up
   on as many lots as Calle Dos has and every door still opens. Homes get neighbours, never
   quests: a business is a parcel and comes through Don Güero and Nacho (his guardrail, #10). */
const CASA_ROOM={
  rows:["####|#####",
        "#S......P#",
        "#..T⊔....#",
        "#..⊔.....#",
        "#.c......#",
        "#R.......#",
        "#........#",
        "#####⌂####"],
  people:{c:{npc:"tencha",q:[],chat:1}}, /* Doña Tencha — Hortensia — forty years on Calle Dos, the first house Don Güero built with the door in the middle because she asked (Nacho, 2026-09-07; she was "chelo" for a day and collided with the mercado's Chelo Robles) */
  locs:{en:"Doña Tencha's, Calle Dos",es:"Casa de Doña Tencha, Calle Dos"},
  arrive:{en:"Doña Tencha's front room. The radio is on low.",es:"La sala de Doña Tencha. El radio, bajito."}
};
BUILDTPL.casa={
  id:"casa", size:{w:3,h:2},
  parts:[
    {id:"shell", tiles:[[0,0,"▩"],[0,1,"▩"],[0,2,"▩"],
                        [1,0,"."],[1,1,"."],[1,2,"."]]},
    {id:"door", tiles:[[0,1,"⌂"]], link:{door:[0,1],landing:[5,6],exit:[5,7],interior:CASA_ROOM}},
    {id:"end", pick:[
      {id:"window", w:2, tiles:[]},
      {id:"lamp",   w:1, tiles:[[0,2,"▨"]]},
    ]},
    {id:"yard", pick:[
      {id:"none",  w:2, tiles:[]},
      {id:"plant", w:2, tiles:[[1,0,"P"]]},
      {id:"chair", w:1, tiles:[[1,0,"⊔"]]},
    ]},
  ],
};

/* ---------- `barberia` — Barbería y Estética El Espejo, Naye's chair (owner, 2026-09-07) ----------
   "open the ability to change our character outfit and haircut after start. maybe have a small barber."
   Nacho: Naye Robles, 29, Doña Chelo's niece, Xochi's apprentice — the other half of Xochi's line, a head
   for every outfit. Two mirrors on the north wall, a chair under each, the waiting chair, the counter.
   The chair is a service, not a district: no quests (❗La silla in CITY.md says whether that changes). */
const BARBER_ROOM={
  rows:["####|#|###",
        "#S.⊔.⊔..P#",
        "#..b.....#",
        "#⊔......D#",
        "#........#",
        "#........#",
        "#........#",
        "#####⌂####"],
  people:{b:{npc:"naye",q:[],chat:1}},
  locs:{en:"Barbería El Espejo, Calle Dos",es:"Barbería El Espejo, Calle Dos"},
  arrive:{en:"El Espejo. Two chairs, two mirrors, a photo strip of half the barrio's haircuts.",es:"El Espejo. Dos sillas, dos espejos, una tira de fotos con medio barrio recién cortado."}
};
BUILDTPL.barberia={
  id:"barberia", size:{w:3,h:2},
  parts:[
    {id:"shell", tiles:[[0,0,"◫"],[0,1,"◫"],[0,2,"◫"],[1,0,"."],[1,1,"."],[1,2,"."]]},  /* ◫, not ▩: #241 */
    {id:"door", tiles:[[0,1,"⌂"]], link:{door:[0,1],landing:[5,6],exit:[5,7],interior:BARBER_ROOM}},
  ],
};

/* ---------- `caseta` — the site hut, where El Portero keeps the gate (#8) ----------
   Owner: "he can be in a room so that way he does have activity where he brings up oh 4 stopped
   attempts - lets talk to review root cause... i need him to highlight the amount of issues and
   if any critical ones - that can be highlighted in red." A hut at the water's edge on Calle Dos,
   two lamp walls and a door; inside, a desk with the gate sheet on it and the tin man himself. */
const CASETA_ROOM={
  rows:["###|####",
        "#D.....#",
        "#..r...#",
        "#......#",
        "#......#",
        "###⌂####"],
  people:{r:{npc:"portero",q:[],chat:1}},
  reads:[{x:1,y:1,doc:"portero"}],
  locs:{en:"The site hut, Calle Dos",es:"La caseta de obra, Calle Dos"},
  arrive:{en:"The site hut. A tin man with a clipboard. He does not look up.",es:"La caseta de obra. Un hombre de lata con su tablilla. No levanta la vista."}
};
BUILDTPL.caseta={
  id:"caseta", size:{w:3,h:2},
  parts:[
    {id:"shell", tiles:[[0,0,"▨"],[0,1,"▨"],[0,2,"▨"],[1,0,"."],[1,1,"."],[1,2,"."]]},
    {id:"door", tiles:[[0,1,"⌂"]], link:{door:[0,1],landing:[3,4],exit:[3,5],interior:CASETA_ROOM}},
  ],
};

/* the lots Don Güero has been given. Same template, different seeds, different houses. */
/* NO LOTS ARE BUILT. The ability is the thing that was asked for — "it is just an ability"
   (owner, 2026-09-03) — and two casitas went up on Calle Dos that nobody asked for and that
   you cannot walk into. A house with a door you cannot open is the same unrealistic shortcut
   as a trolley that stops on a second floor. The template, the glyphs and the engine seam all
   stay, tested; when a parcel is genuinely developed, the house gets an interior and a portal
   FIRST, and then it goes in this list. Restoring the two casitas is two lines:
     {id:"casita-w", tpl:"casita", world:"ex", x:0,  y:0, seed:"calle-dos-poniente"},
     {id:"casita-e", tpl:"casita", world:"ex", x:21, y:0, seed:"calle-dos-oriente"},  */
/* 2026-09-07 (#10): the rule above is kept — a lot goes in WITH a room and a door that opens —
   and the first lot that meets it is Doña Chelo's casa at the water's edge on Calle Dos: the
   `casa` template links its front door to the room it carries, and Doña Chelo lives there. */
const BUILDS=[
  {id:"casa-w", tpl:"casa", world:"ex", x:4, y:2, seed:"calle-dos-4"},
  {id:"caseta", tpl:"caseta", world:"ex", x:16, y:2, seed:"la-caseta"}, /* El Portero's hut, by the site (#8) */
  {id:"barberia", tpl:"barberia", world:"ex", x:21, y:0, seed:"el-espejo"}, /* Naye's chair, the east end of the north frontage — clear of Yola (17,0) and the piñata (18,0) */
];
