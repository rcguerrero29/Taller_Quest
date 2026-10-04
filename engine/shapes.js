/* ---------- SHAPES — the engine's own shape library for the 3D camera ----------
   Owner, 2026-09-22: the things Meridian's furniture learned belong to the engine, for the
   template and for every world built on it.

   Meridian spent four crew iterations turning its furniture from pictures into SHAPES — parts with
   a size and a colour, merged into one mesh per tile (`TILEART_MESH`, the `mesh` view). Every one
   of them lived in `content/meridian/art.js`, so a second world — the same engine, the same
   letters, the same furniture — kept standing its desks up as boxes with a photograph of a desk
   printed on the side, and so would any world built tomorrow. A shape that is true of the LETTER
   and not of the world is engine work; it was in a pack only because that is where it was written.

   WHAT THIS FILE IS. Two plain globals and nothing else. It assigns into no engine table, patches
   nothing, and runs no code at load: `SHAPES` is the shapes, **named by what they ARE** — a pack
   can read `SHAPES.desk` without knowing which letter this engine spells a desk with — and
   `SHAPEBIND` is the engine binding its own letters to them, sitting right here in the open so a
   pack can read it and refuse it. `engine/engine.js` does the binding, once, after `TILES` exists,
   and only for a letter the pack has said nothing about. The whole of the gate is five refusals
   and every one was bought with a measurement; it is commented where it stands.

   THE FENCE THIS LIBRARY IS KEPT BEHIND (Toño's, and it is mechanical, not a judgement):
     (a) the engine already draws that glyph in its own `TILEDRAW`/`TILESIDE` source, and
     (b) the function body names NOTHING defined in `content/`.
   (b) is why `facing` and `turned` are down there as private helpers instead of imported. Meridian
   declares its own `meshFacing`/`meshTurned` at `content/meridian/art.js:959,961` — an engine
   MECHANISM living in a pack, which Toño calls the reverse leak. The obvious repair, lifting those
   two names into the engine, does not work and it is worth writing down why: both files are
   classic scripts, top-level `const` goes into ONE shared global lexical scope, and a second
   `const meshFacing` is a duplicate declaration. Measured, not reasoned — planted in a copy of the
   tree outside the repository, and the sentence it printed was
       page errors: Identifier 'meshFacing' has already been declared
   with `node test/smoke.js` red and Meridian not booting at all. **The file passed `node --check`
   on its own**, which is the part worth carrying away: a duplicate lexical declaration across two
   classic scripts is invisible to every per-file syntax check in this repository and only appears
   when a browser loads both. So the engine keeps its own copy, private, under its own names;
   Meridian keeps its; and nobody's file has to change to ship this.

   WHAT A PLAIN SHAPE IS FOR. These are not Meridian's. Meridian's crate carries tomatoes, its
   jacaranda carries papel picado and a sugar-skull lantern, its table is laid for Día de Muertos —
   that is a FESTIVAL, and a festival is a choice a world makes. What is left when you take the
   festival off is a crate, a tree and a table, and those are true of the letter. So: the plain one
   lives here, the dressed one stays in the pack, and because a pack's own `mesh` view beats this
   table at the gate, **Meridian changes by zero bytes and renders byte-identically.**

   UNITS, exactly as `TILEART_MESH` already takes them: one tile is 1.0, y is up from the floor,
   the tile's centre is (0,0), and a part is {s,x,y,z,w,h,d,r,rt,rb,t,arc,rx,ry,rz,sx,sy,sz,c,a}.
   Five primitives: box (the default), cyl, sph, cone and torus. `a:` under 1 is glass. The engine
   merges a tile's parts into ONE mesh with vertex colours, so a picket fence costs one draw call
   and not eleven. Low segment counts on purpose — this is a pixel world, and a ten-sided pot reads
   as MADE. Nothing here names a colour a pack owns: theme colours come through `C`, which the
   engine tints, so a shape follows the world's palette instead of insisting on its own.

   Precached in `sw.js`. Downloaded only by a world that asked for a 3D camera (`engine/boot.js`).
   The gate tests `typeof SHAPES==="object"` rather than a bare name for that reason, and for one
   more: `test/public.js` checks that everything LISTED in `sw.js` ships, and nothing checks the
   other direction — forget the row and the online game is perfect while the owner's second,
   OFFLINE visit gets a street full of boxes, with CI green the whole time. */
const SHAPES=(function(){
  /* ---- the two private helpers, and the tiny bit of arithmetic every shape wants ---- */
  /* WHICH WAY A THING FACES: the first open side — south, then east, west, north. A shelf against
     any wall shows its front to the room; a desk in the middle of a floor faces the way you came
     in. Off-map counts as wall, so a thing in a corner turns inward rather than into the void. */
  const facing=(x,y)=>{const w=(typeof CW==="function")&&CW();
    const solid=(gx,gy)=>{const r=w&&w.grid&&w.grid[gy];return !r||r[gx]===undefined||(typeof SOLID!=="undefined"&&SOLID.has(r[gx]));};
    return !solid(x,y+1)?0:!solid(x+1,y)?Math.PI/2:!solid(x-1,y)?-Math.PI/2:Math.PI;};
  /* THE TURN THAT PUTS IT THERE. Yaw-first (the bake's rotation order is YXZ), so a part that
     already leans keeps its lean and the whole thing still swings to face the door. */
  const turned=(parts,ry)=>{const cr=Math.cos(ry),sr=Math.sin(ry);
    return parts.map(p=>({...p,x:p.x*cr+p.z*sr,z:-p.x*sr+p.z*cr,ry:(p.ry||0)+ry}));};
  /* A TILE'S OWN NUMBER, stable across reloads and different for its neighbour. Nobody ever put
     two boxes down at the same angle; this is how a run of the same letter stops looking stamped. */
  const seed=(x,y,n)=>((((x|0)*7+(y|0)*13)%n)+n)%n;
  /* IS THE SAME LETTER NEXT DOOR — a fence and a counter are laid in RUNS, and a run needs to know
     where it ends. Reads the world grid, which is the only place the answer lives. */
  const same=(x,y,g)=>{const w=(typeof CW==="function")&&CW();const r=w&&w.grid&&w.grid[y];
    return !!r&&r[x]===g;};
  const glyphAt=(x,y)=>{const w=(typeof CW==="function")&&CW();const r=w&&w.grid&&w.grid[y];
    return r?r[x]:undefined;};
  /* A NUMBER FOR A TILE AND A PART, ON BOTH AXES. `seed` above is a step along a line: (x*7+y*13)%n gives the
     tile to the east the next value, so anything built from it is its neighbour shifted by one, and a run of
     bookcases was one bookcase stamped (measured 2026-10-04). This one is a hash of the tile and of WHICH part
     is asking, so a shelf index and a book index are multipliers of their own. */
  const rnd=(x,y,i,j)=>{const v=Math.sin((x|0)*12.9898+(y|0)*78.233+(i||0)*39.425+(j||0)*17.719)*43758.5453;return v-Math.floor(v);};
  const solidAt=(gx,gy)=>{const w=(typeof CW==="function")&&CW();const r=w&&w.grid&&w.grid[gy];
    return !r||r[gx]===undefined||(typeof SOLID!=="undefined"&&SOLID.has(r[gx]));};
  /* WHICH WAY A THING THAT STANDS AGAINST A WALL FACES — away from the wall, and across its own run. `facing`
     answers "the first open side", and the last bookcase of a run down a west wall has an open side to the
     SOUTH, so it turned to face along the run while its neighbours faced the room. A wall is solid and is not
     one of this run. `back` says a wall is behind it, so the thing is pushed back until it touches it. */
  const backToWall=(x,y)=>{const g=glyphAt(x,y),wall=(gx,gy)=>solidAt(gx,gy)&&!same(gx,gy,g);
    const ew=same(x-1,y,g)||same(x+1,y,g),ns=same(x,y-1,g)||same(x,y+1,g);
    const hit=[[0,-1,0],[-1,0,Math.PI/2],[1,0,-Math.PI/2],[0,1,Math.PI]]            /* a wall to the north: face south … */
      .filter(([dx,dy])=>ew&&!ns?dx===0:ns&&!ew?dy===0:true).find(([dx,dy])=>wall(x+dx,y+dy));
    return hit?{ry:hit[2],back:true}:{ry:facing(x,y),back:false};};
  const dim=(h,f)=>{const n=parseInt(h.slice(1),16),c=v=>Math.max(0,Math.min(255,Math.round(v*f)));
    return "#"+((1<<24)|(c(n>>16&255)<<16)|(c(n>>8&255)<<8)|c(n&255)).toString(16).slice(1);};

  /* ---------- PLANT (P) — a thrown pot, soil, a stem and five leaf masses ----------
     A pot is thrown on a wheel, so it is round and it tapers; the rim is a separate ring of clay
     folded over, which is why it stands proud. The leaves are spheres at five different radii
     round one stem and the whole head is rotated by the tile's own number, so a row of plants
     along a wall is a row of plants and not one plant printed five times. */
  const plant=({x,y})=>{const a=seed(x,y,5)*1.26,c=Math.cos(a),s=Math.sin(a);
    const POT=C.pot,RIM="#C97A52",SOIL="#4A3524",G1=C.plant,G2="#4E9A5E";
    const parts=[{s:"cyl",x:0,y:0.13,z:0,rt:0.2,rb:0.15,h:0.26,c:POT},
                 {s:"cyl",x:0,y:0.27,z:0,r:0.22,h:0.04,c:RIM},
                 {s:"cyl",x:0,y:0.295,z:0,r:0.17,h:0.02,c:SOIL},
                 {s:"cyl",x:0,y:0.41,z:0,r:0.02,h:0.24,c:G1}];
    [[0,0.62,0,0.19],[0.13,0.52,0.06,0.15],[-0.12,0.54,-0.05,0.14],[0.02,0.5,-0.14,0.13],[-0.03,0.48,0.14,0.12]]
      .forEach(([px,py,pz,r],i)=>parts.push({s:"sph",x:px*c-pz*s,y:py,z:px*s+pz*c,r,c:i%2?G2:G1}));
    return parts;};

  /* ---------- TREE (J) — grown, not stamped ----------
     Until today a tree in any world but Meridian was a box of trunk with a PICTURE of a canopy
     hung over it on a billboard — and a billboard turns to face the camera, so a row of trees
     swung round together every time you moved. Grown instead: a trunk that tapers because a trunk
     carries more weight at the bottom, two limbs leaving it at different heights on opposite sides
     (a tree does not fork symmetrically), and a crown of six masses in two greens, the lower ones
     wider and the top one smallest, all rotated by the tile's number. No blossom: blossom is a
     SEASON, and a season is a thing a world says. */
  const tree=({x,y})=>{const a0=seed(x,y,6)*1.05,BARK="#6E4A2C",BARK2="#7C573A",L1="#4E8A58",L2="#639C6C",L3="#3E7448";
    const parts=[{s:"cyl",x:0,y:0.46,z:0,rt:0.085,rb:0.15,h:0.92,c:BARK},
                 {s:"cyl",x:0,y:0.07,z:0,rt:0.15,rb:0.22,h:0.14,c:BARK2}];   /* the root flare */
    [[0.34,0.74,0.30],[-0.42,0.92,0.26]].forEach(([lean,ly,len],i)=>{
      const a=a0+i*2.3;
      parts.push({s:"cyl",x:Math.cos(a)*len*0.5,y:ly,z:Math.sin(a)*len*0.5,r:0.04,h:len,c:BARK,rz:lean,ry:a});});
    /* THE CROWN IS THE OBJECT. It replaced a billboard 1.05 tiles across, and the first version of
       this tree was measurably smaller than the picture it replaced — which a picture of it showed
       in one look and no count could have. Six masses: the widest low and to the sides, the
       smallest on top, two greens and a shadow green underneath so it is not one flat blob. */
    [[0,1.16,0,0.40,L1],[0.27,1.02,0.08,0.31,L2],[-0.25,1.05,-0.09,0.30,L1],
     [0.07,1.00,-0.27,0.27,L2],[-0.08,0.99,0.28,0.26,L3],[0,1.44,0,0.23,L2],
     [0,0.90,0,0.33,L3]]
      .forEach(([px,py,pz,r,c])=>{const c0=Math.cos(a0),s0=Math.sin(a0);
        parts.push({s:"sph",x:px*c0-pz*s0,y:py,z:px*s0+pz*c0,r,c});});
    return parts;};

  /* ---------- DESK (D) — a slab with AIR under it ----------
     The one thing that separates a desk from a filing cabinet is that you can see the floor
     between its legs, so the slab floats over a leg panel on one side and a drawer pedestal on the
     other, its underside painted dark (there is shade under any top) and its front edge lit. On it:
     a monitor on a stalk on a foot disc, a keyboard UNDER the monitor — a screen with nothing
     under it is a television — and a sheet of paper, never quite square to the edge.
     Nothing reaches past ±0.46, because desks get laid side by side. */
  const desk=({x,y})=>{
    const WOOD=C.desk,TOP=C.deskTop,UNDER="#3A2E26",EDGE="#C4A878",INK="#23272C",KEYS="#2F343A",SCREEN="#7FB3D5",PAPER="#F4F1EA",PULL="#D9C9A3";
    const parts=[{s:"box",x:-0.41,y:0.215,z:0,w:0.05,h:0.43,d:0.54,c:WOOD},
      {s:"box",x:0.27,y:0.215,z:-0.03,w:0.34,h:0.43,d:0.48,c:WOOD},
      {s:"box",x:0,y:0.455,z:0,w:0.9,h:0.04,d:0.6,c:TOP},
      {s:"box",x:0,y:0.425,z:0,w:0.86,h:0.02,d:0.56,c:UNDER},
      {s:"box",x:0,y:0.47,z:0.297,w:0.9,h:0.012,d:0.012,c:EDGE}];
    [0.08,0.215,0.35].forEach(dy=>{
      parts.push({s:"box",x:0.27,y:dy,z:0.215,w:0.3,h:0.11,d:0.012,c:WOOD},
                 {s:"box",x:0.27,y:dy+0.062,z:0.214,w:0.34,h:0.012,d:0.006,c:UNDER},
                 {s:"box",x:0.27,y:dy,z:0.228,w:0.09,h:0.02,d:0.016,c:PULL});});
    parts.push({s:"cyl",x:0,y:0.481,z:-0.12,r:0.07,h:0.012,c:INK},
      {s:"box",x:0,y:0.53,z:-0.12,w:0.03,h:0.1,d:0.03,c:INK},
      {s:"box",x:0,y:0.69,z:-0.12,w:0.34,h:0.22,d:0.03,c:INK},
      {s:"box",x:0,y:0.695,z:-0.101,w:0.31,h:0.19,d:0.008,c:SCREEN},
      {s:"box",x:0,y:0.483,z:0.09,w:0.26,h:0.015,d:0.1,c:KEYS},
      {s:"box",x:-0.27,y:0.478,z:0.06,w:0.16,h:0.005,d:0.2,c:PAPER,ry:0.18});
    return turned(parts,facing(x,y));};

  /* ---------- TABLE (T) — the engine's own table: round, under a woven cloth, laid for two ----------
     What `TILEDRAW["T"]` and `TILESIDE["T"]` in engine/engine.js say it is, and until 2026-10-04 the library said
     something else: a bare square table, so a world that took it lost the cloth, the plates and the chairs its own
     letter draws, and the gate refused it for that (a reason nobody had written down). Built in the order one is
     made and laid: a foot and a pedestal; the top; a gingham cloth laid by hand and falling over the edge all round;
     two plates set opposite; two chairs pushed in by the last people to sit there.
     THE CLOTH IS WOVEN, so it has three values and not two: red where a red warp thread crosses a red weft, a
     half-tone where only one of them passes, cream where neither does. A two-value checker is a PRINTED check, and a
     printed check with a ring round it is a pizza. The check runs to the edge — quartered at the rim so no ring is
     left — and over it as a drop of twelve panels with a level hem: the hem, with floor under it, is the tell.
     WHAT VARIES, AND AT WHICH STEP: the tables were bought as a set, identical and never turned; the cloth came off
     one bolt, one check size; it was laid by hand, so the check turns per table (both axes); the chairs were moved by
     whoever sat in them, so each pulls out up to 0.02 and turns up to 5°. Nothing reaches past 0.48 from the centre.
     CLEARED, for a world that sets something on a table (an altar, a cake): no plates, no chairs, and the cloth is the
     top of it, so what is set down stands on the cloth — `SHAPES.table({x,y,cleared:true})`. The tallest ink decides
     where a thing set on a shape stands, and two chair backs at 0.68 would hold it up in the air. */
  const table=({x,y,cleared})=>{
    const WOOD="#5E3B20",TOPW="#7A4E2C",CREAM="#F2E8D8",HALF="#D99082",RED="#C0392B",PLATE="#FFFFFF",WELL="#C9CDD2";
    const parts=[{s:"cyl",x:0,y:0.015,z:0,r:0.16,h:0.03,c:WOOD},                       /* the foot */
      {s:"cyl",x:0,y:0.26,z:0,r:0.04,h:0.46,c:WOOD},                                       /* the pedestal, 0.03 to 0.49 */
      {s:"cyl",x:0,y:0.505,z:0,r:0.34,h:0.03,c:TOPW},                                      /* the top, 0.49 to 0.52 */
      {s:"cyl",x:0,y:0.525,z:0,r:0.37,h:0.01,c:CREAM,cloth:1}];                            /* the cloth: cream, where no red thread runs */
    const CELL=0.12,R=0.35,a=rnd(x,y,1,1)*Math.PI/2,ca=Math.cos(a),sa=Math.sin(a);       /* laid by hand: the grid turns per table */
    const cell=(cx,cz,w,c)=>parts.push({s:"box",x:cx*ca+cz*sa,y:0.532,z:-cx*sa+cz*ca,w,h:0.004,d:w,c,ry:a,cloth:1});
    for(let i=-3;i<3;i++)for(let j=-3;j<3;j++){const warp=(i&1)===0,weft=(j&1)===0;if(!warp&&!weft)continue;
      const c=warp&&weft?RED:HALF,cx=(i+0.5)*CELL,cz=(j+0.5)*CELL;
      if(Math.hypot(Math.abs(cx)+CELL/2,Math.abs(cz)+CELL/2)<=R+0.01){cell(cx,cz,CELL,c);continue;}
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([u,v])=>{const qx=cx+u*CELL/4,qz=cz+v*CELL/4;   /* at the rim, in quarters: the check runs to the edge */
        if(Math.hypot(Math.abs(qx)+CELL/4,Math.abs(qz)+CELL/4)<=R+0.02)cell(qx,qz,CELL/2,c);});}
    for(let k=0;k<12;k++){const t=(k+0.5)/12*Math.PI*2+a;                                 /* the drop, all round, the warp running down it */
      parts.push({s:"box",x:Math.sin(t)*0.374,y:0.458,z:Math.cos(t)*0.374,w:0.196,h:0.144,d:0.008,c:k%2?RED:HALF,ry:t,drop:1});} /* hem level at 0.386 */
    if(cleared)return parts;
    [-0.15,0.15].forEach(px=>parts.push({s:"cyl",x:px,y:0.54,z:0,r:0.085,h:0.012,c:PLATE,plate:1},   /* two plates, on the chairs' line */
                                        {s:"cyl",x:px,y:0.547,z:0,r:0.05,h:0.004,c:WELL}));
    /* A CHAIR IS AIR: the back legs carry on up as the back's posts, which is how a chair is made, with a crest rail
       and one rail under it, and the floor showing between all four legs. Built facing the table from the east,
       then turned round for the west one. The seat slides in under the hem; the back stands about 0.15 over the cloth. */
    [1,-1].forEach((sd,k)=>{const pull=rnd(x,y,k,7)*0.02,turn=(rnd(x,y,k,8)-0.5)*0.17;
      const chair=[{s:"box",x:0,y:0.27,z:0,w:0.2,h:0.03,d:0.2,c:WOOD}];                        /* the seat, under the hem */
      [-0.085,0.085].forEach(lz=>chair.push({s:"box",x:-0.085,y:0.1275,z:lz,w:0.025,h:0.255,d:0.025,c:WOOD},   /* front legs */
                                            {s:"box",x:0.085,y:0.34,z:lz,w:0.025,h:0.68,d:0.025,c:WOOD}));     /* back legs, up to the crest */
      chair.push({s:"box",x:0.085,y:0.65,z:0,w:0.025,h:0.06,d:0.2,c:WOOD},{s:"box",x:0.085,y:0.48,z:0,w:0.02,h:0.03,d:0.2,c:WOOD});
      turned(chair,(sd>0?0:Math.PI)+turn).forEach(p=>parts.push({...p,x:p.x+sd*(0.345+pull),chair:k}));});
    return parts;};

  /* ---------- CRATE (H) — slats, and you can see between them ----------
     A crate is nailed from sawn slats onto four corner posts, so it has GAPS, and the gaps are the
     only thing that says crate rather than box. Four posts, three slats a side with daylight
     between, a floor, and a battened lid leaning against nothing — it is stacked open. Dropped
     where it was carried to, a few degrees off. */
  const crate=({x,y})=>{const SLAT="#B98C55",POST="#8A6335",DARK="#5C411F",W=0.62,H=0.42;
    const parts=[];
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>
      parts.push({s:"box",x:sx*W/2,y:H/2,z:sz*W/2,w:0.06,h:H,d:0.06,c:POST}));
    [0.08,0.21,0.34].forEach(sy=>{
      parts.push({s:"box",x:0,y:sy,z:W/2,w:W,h:0.085,d:0.03,c:SLAT},
                 {s:"box",x:0,y:sy,z:-W/2,w:W,h:0.085,d:0.03,c:SLAT},
                 {s:"box",x:W/2,y:sy,z:0,w:0.03,h:0.085,d:W,c:SLAT},
                 {s:"box",x:-W/2,y:sy,z:0,w:0.03,h:0.085,d:W,c:SLAT});});
    parts.push({s:"box",x:0,y:0.02,z:0,w:W,h:0.04,d:W,c:DARK});             /* the floor of it */
    return turned(parts,seed(x,y,5)*0.13-0.26);};

  /* ---------- SHELVING (S) — the engine's bookcase: against the wall, in runs, books bought one at a time ----------
     What `TILESIDE["S"]` says it is — two uprights, the boards, books and boxes on each, the dark inside — and what the
     library's last one was not: its books reached the board above them (no gap, so no dark line over the spines, which
     is the one thing that says bookcase at street size); every case was its neighbour shifted by one, because its seed
     stepped along a line; it floated a third of a tile off its wall; and its brown sat within a few values of a dark
     wall, so a run against one melted into it. Built in the order it is made:
       1 the carcass, flat-packed, one model — uprights, a top, a plinth set back so there is a shadow at the floor, and
         a plain back (nothing is painted on a back);
       2 the boards, cut on one jig and set at one pitch, so a run's board lines run straight through it;
       3 each case stood against the wall and pushed against its neighbour: the case is the full tile wide, so the
         uprights of two neighbours meet, and its back is on the wall wherever there is one;
       4 the books, bought one at a time and shelved in SERIES — siblings within a series (one height, one cloth, a
         volume or two shorter), strangers between them — with a gap of at least 0.05 over every row, one leaner at the
         end of a series, and a flat stack or a carton on one shelf: "books and boxes", as the drawing has it.
     The carcass and its boards are the theme's desk-top colour, as the desks are; the back is dark, so the gap over
     the spines reads. Nothing varies before step 4. */
  const shelving=({x,y})=>{
    const BOARD=C.deskTop,BACK="#3F2E1E",PLINTH="#2E241A",CARTON="#B0895B",
          SP=["#C0392B","#2F6FB0","#3E9B6A","#E0A32E","#8E5BB5","#C86A3A"];                  /* spines that survive a lambert in shade */
    const at=backToWall(x,y),D=0.34,T=0.04,IN=0.5-T,BT=0.035,BOT=[0.06,0.36,0.66],UNDER=[0.36,0.66,0.95];
    const parts=[{s:"box",x:-(0.5-T/2),y:0.5,z:0,w:T,h:1.0,d:D,c:BOARD},                    /* 1 · the uprights, at the tile's edges */
      {s:"box",x:0.5-T/2,y:0.5,z:0,w:T,h:1.0,d:D,c:BOARD},
      {s:"box",x:0,y:0.97,z:0,w:1.0,h:0.04,d:D,c:BOARD},                                     /*     the top */
      {s:"box",x:0,y:0.5,z:-D/2+0.01,w:2*IN,h:0.98,d:0.02,c:BACK},                           /*     the back, plain */
      {s:"box",x:0,y:0.03,z:-0.01,w:2*IN,h:0.06,d:D-0.04,c:PLINTH}];                         /*     the plinth, set back 0.02 */
    const ZB=D/2-0.02-0.12;                                                                   /* a spine 0.02 behind the board's edge, 0.24 deep */
    const lean=Math.floor(rnd(x,y,7,1)*3),box=(lean+1+Math.floor(rnd(x,y,7,2)*2))%3,carton=rnd(x,y,7,3)<0.4;
    BOT.forEach((b,i)=>{const floor=b+BT,cap=UNDER[i]-floor-0.05;                          /* 4 · the gap over every row is never under 0.05 */
      parts.push({s:"box",x:0,y:b+BT/2,z:0.01,w:2*IN,h:BT,d:D-0.02,c:BOARD});                /* 2 · one jig, one pitch */
      let cx=-IN+0.01+rnd(x,y,i,9)*0.03;
      const n=2+(rnd(x,y,i,1)<0.5?1:0);
      for(let k=0;k<n&&cx<IN-0.1;k++){const q=i*5+k,fam=SP[Math.floor(rnd(x,y,q,2)*SP.length)];
        const bh=Math.min(cap,0.15+rnd(x,y,q,3)*0.09),bw=0.035+rnd(x,y,q,4)*0.02,nb=Math.max(2,Math.round((0.12+rnd(x,y,q,5)*0.1)/(bw+0.004)));
        for(let j=0;j<nb&&cx+bw<IN-0.005;j++){const hj=bh-(j%3===1?0.012:0);                 /* siblings: one set, a volume or two shorter */
          parts.push({s:"box",x:cx+bw/2,y:floor+hj/2,z:ZB,w:bw,h:hj,d:0.24,c:j%2?dim(fam,0.84):fam});cx+=bw+0.004;}
        if(i===lean&&k===n-1&&cx+0.09<IN){const th=0.3,lh=Math.min(bh,cap)*0.97;            /* the leaner, at the end of its series */
          parts.push({s:"box",x:cx+0.005+(lh/2)*Math.sin(th)+(bw/2)*Math.cos(th),y:floor+(lh/2)*Math.cos(th)+(bw/2)*Math.sin(th),z:ZB,w:bw,h:lh,d:0.24,c:dim(fam,0.92),rz:th});
          cx+=bw+lh*Math.sin(th)+0.01;}
        cx+=0.02+rnd(x,y,q,6)*0.03;}
      if(i===box&&cx+0.17<IN){
        if(carton)parts.push({s:"box",x:cx+0.085,y:floor+0.07,z:ZB-0.01,w:0.16,h:0.14,d:0.22,c:CARTON});
        else [0,1,2].forEach(l=>parts.push({s:"box",x:cx+0.09+(rnd(x,y,i,20+l)-0.5)*0.02,y:floor+0.017+l*0.034,z:ZB,w:0.17-l*0.015,h:0.032,d:0.22,c:SP[Math.floor(rnd(x,y,i,30+l)*SP.length)]}));}});
    if(at.back)parts.forEach(p=>{p.z-=0.5-D/2;});                                            /* 3 · its back on the wall */
    return turned(parts,at.ry);};

  /* ---------- FRIDGE (W) — a white good, and white goods have a plinth ----------
     A body over a recessed plinth so it does not look glued to the floor, two doors with the seam
     between them set BACK (a seam that stands proud is a join, a seam that sits back is a door),
     two handles on the same side because a fridge opens one way, and one magnet — the single warm
     note on the coldest object in the room. */
  const fridge=({x,y})=>{
    const CARC="#AEB6BE",DOOR="#BCC4CC",SEAM="#5A6068",HANDLE="#5A6068",PLINTH="#2F343A",MAG="#E0B45C";
    const parts=[{s:"box",x:0,y:0.025,z:0,w:0.6,h:0.05,d:0.53,c:PLINTH},
      {s:"box",x:0,y:0.5,z:0,w:0.62,h:0.9,d:0.55,c:CARC},
      {s:"box",x:0,y:0.785,z:0.28,w:0.6,h:0.31,d:0.01,c:DOOR},
      {s:"box",x:0,y:0.345,z:0.28,w:0.6,h:0.55,d:0.01,c:DOOR},
      {s:"box",x:0,y:0.625,z:0.276,w:0.6,h:0.01,d:0.006,c:SEAM},
      {s:"box",x:0.24,y:0.78,z:0.295,w:0.03,h:0.22,d:0.02,c:HANDLE},
      {s:"box",x:0.24,y:0.4,z:0.295,w:0.03,h:0.22,d:0.02,c:HANDLE},
      {s:"box",x:-0.12,y:0.86,z:0.288,w:0.05,h:0.035,d:0.006,c:MAG}];
    return turned(parts,facing(x,y));};

  /* ---------- STOVE (V) — the engine's range: charcoal, on feet, a pale lip over it ----------
     `TILEDRAW["V"]` and `TILESIDE["V"]` draw a charcoal range (#3A3F46): burners over the edge, knobs, the oven
     window, one ring lit. The library's last one was WHITE — the floor's own value, four apart in luma — with its hob
     at 0.83, nearly a person's chin. Made as one is welded: four feet with the floor showing under it; the body; the
     oven door proud of it with its window and what is on in there; the fascia and its knobs under the lip; a bar
     handle on two brackets; the cast deck OVERHANGING the body all round (that lip is what says range and not
     cupboard) with a PALE edge, which is what draws its top line against a dark wall; four burners, each a drip bowl,
     a dark well, a cast grate as a cross, a cap; one of them lit; the riser at the back with its pilot. No pot: what is
     on the fire is the world's business. Ranges come off a line, so nothing varies but which burner is on (both axes). It
     stands with its back to the wall wherever there is one. */
  const stove=({x,y})=>{
    const BODY="#3A3F46",DOOR="#4A5058",DECK="#2F343B",LIP="#B9BEC4",DARK="#23272C",GLASS="#1B1E22",EMBER="#C8601E",
          KNOB="#AEB6BE",BOWL="#6A727C",CAP="#4A5058",PILOT="#E0662B",FOOT="#2A2D33",FLAME="#2E86C8";
    const at=backToWall(x,y),parts=[];
    [[-0.25,-0.21],[0.25,-0.21],[-0.25,0.21],[0.25,0.21]].forEach(([fx,fz])=>
      parts.push({s:"cyl",x:fx,y:0.045,z:fz,r:0.024,h:0.09,c:FOOT}));                       /* four feet */
    parts.push({s:"box",x:0,y:0.30,z:0,w:0.62,h:0.42,d:0.54,c:BODY},                         /* the body, 0.09 to 0.51 */
      {s:"box",x:0,y:0.27,z:0.275,w:0.56,h:0.28,d:0.016,c:DOOR},                             /* the oven door, proud */
      {s:"box",x:0,y:0.29,z:0.286,w:0.38,h:0.15,d:0.006,c:GLASS,a:0.55},                     /* its window: glass, the one pane in the library */
      {s:"box",x:0,y:0.235,z:0.290,w:0.30,h:0.016,d:0.004,c:EMBER},                          /* and what is on in there */
      {s:"box",x:0,y:0.485,z:0.278,w:0.62,h:0.060,d:0.014,c:DARK});                          /* the fascia, under the lip */
    [-0.22,0.22].forEach(bx=>parts.push({s:"box",x:bx,y:0.435,z:0.292,w:0.028,h:0.032,d:0.036,c:LIP}));
    parts.push({s:"cyl",x:0,y:0.435,z:0.318,r:0.016,h:0.56,c:LIP,rz:Math.PI/2});           /* the bar handle on its brackets */
    [-0.21,-0.07,0.07,0.21].forEach(kx=>parts.push({s:"cyl",x:kx,y:0.485,z:0.298,r:0.022,h:0.020,c:KNOB,rx:Math.PI/2}));
    parts.push({s:"box",x:0,y:0.528,z:0,w:0.68,h:0.036,d:0.60,c:DECK},                      /* the cast deck, 0.51 to 0.546, over the body all round */
      {s:"box",x:0,y:0.537,z:0.302,w:0.69,h:0.022,d:0.016,c:LIP},                            /* its pale lip, front */
      {s:"box",x:-0.342,y:0.537,z:0,w:0.012,h:0.022,d:0.60,c:LIP},                           /*   and sides */
      {s:"box",x:0.342,y:0.537,z:0,w:0.012,h:0.022,d:0.60,c:LIP});
    const lit=Math.floor(rnd(x,y,5,1)*4);
    [[-0.155,-0.13],[0.155,-0.13],[-0.155,0.13],[0.155,0.13]].forEach(([bx,bz],bi)=>{
      parts.push({s:"cyl",x:bx,y:0.548,z:bz,r:0.115,h:0.010,c:BOWL},                       /* the drip bowl, catching the light */
        {s:"cyl",x:bx,y:0.554,z:bz,r:0.098,h:0.010,c:DARK});                                 /* the well in it */
      [0,Math.PI/2].forEach(g=>parts.push({s:"box",x:bx,y:0.566,z:bz,w:0.20,h:0.016,d:0.022,c:DECK,ry:g})); /* the grate: a cross, not a ring */
      parts.push({s:"cyl",x:bx,y:0.560,z:bz,r:0.046,h:0.016,c:CAP});                       /* the cap */
      if(bi===lit)parts.push({s:"torus",x:bx,y:0.562,z:bz,r:0.050,t:0.010,rx:Math.PI/2,c:FLAME,flame:1});}); /* one on */
    parts.push({s:"box",x:0,y:0.612,z:-0.275,w:0.68,h:0.130,d:0.045,c:BODY},                 /* the riser */
      {s:"box",x:0,y:0.680,z:-0.275,w:0.68,h:0.010,d:0.045,c:LIP},                           /* its lit top */
      {s:"box",x:0,y:0.612,z:-0.250,w:0.13,h:0.030,d:0.008,c:PILOT});                        /* the pilot */
    if(at.back)parts.forEach(p=>{p.z-=0.2;});                                                /* the riser to the wall */
    return turned(parts,at.ry);};

  /* ---------- COUNTER (K) — the engine's café counter: waist high, in runs, the machine where the drawing puts it ----------
     `TILESIDE["K"]` draws a counter body under a steel top (#9AA4B0) with two panels on its front, and on it "a coffee
     machine on every third tile … the rest carry a cup and a napkin stand". The library's last one had neither, and
     its top stood at 0.82 — chin-high on a person of 0.92. This one is laid as counters are: the carcass the full tile
     wide, so a run is ONE counter with one top line at a person's waist (0.57); a toe-kick set back so it does not
     look poured into the floor; a top proud of the body with a nosing along the serving edge; an end panel only where
     the run stops; and the whole run agrees which way it serves — across itself, toward whichever side has more open
     floor along its length. On it, where the drawing says ((x+y)%3===2): the espresso machine — a bright drip tray, the
     body, a narrower hopper (the step is the read), the group head with AIR between it and the cup under it (no air is
     a microwave), the portafilter, its handle, one warm light. Everywhere else a cup and a napkin stand, and the cup's
     place is the only thing that varies: machines are identical and a run is one object. */
  const counter=({x,y})=>{const g=glyphAt(x,y);
    const BODY=C.counter,TOP="#9AA4B0",NOSE="#C9CFD6",PANEL="#6E7884",END="#5E6874",TOE="#2F343A",
          MACH="#3A3F46",HOP="#23272C",TRAY="#C9CDD2",LIGHT="#E0662B",CUP="#F4F1EA",NAP="#C9B7A0";
    const E=same(x+1,y,g),Wt=same(x-1,y,g),N=same(x,y-1,g),S=same(x,y+1,g),alongX=E||Wt||!(N||S);
    const run=[];if(alongX){let a=x;while(same(a-1,y,g))a--;for(;same(a,y,g);a++)run.push([a,y]);}
             else{let a=y;while(same(x,a-1,g))a--;for(;same(x,a,g);a++)run.push([x,a]);}
    const open=(dx,dy)=>run.filter(([gx,gy])=>!solidAt(gx+dx,gy+dy)).length;
    const ry=alongX?(open(0,1)>=open(0,-1)?0:Math.PI):(open(1,0)>=open(-1,0)?Math.PI/2:-Math.PI/2);
    const endA=ry===0?!Wt:ry===Math.PI?!E:ry===Math.PI/2?!S:!N,endB=ry===0?!E:ry===Math.PI?!Wt:ry===Math.PI/2?!N:!S;
    const T0=0.57,parts=[{s:"box",x:0,y:0.03,z:-0.02,w:1.0,h:0.06,d:0.72,c:TOE},             /* the toe-kick, set back */
      {s:"box",x:0,y:0.30,z:0,w:1.0,h:0.48,d:0.8,c:BODY},                                    /* the carcass, 0.06 to 0.54, the full tile */
      {s:"box",x:0,y:0.555,z:0.01,w:1.0,h:0.03,d:0.84,c:TOP},                                /* the top, 0.54 to 0.57, proud of it */
      {s:"cyl",x:0,y:0.555,z:0.43,r:0.018,h:1.0,c:NOSE,rz:Math.PI/2},                        /* the nosing along the serving edge */
      {s:"box",x:-0.24,y:0.3,z:0.405,w:0.3,h:0.26,d:0.012,c:PANEL},{s:"box",x:0.24,y:0.3,z:0.405,w:0.3,h:0.26,d:0.012,c:PANEL}];
    if(endA)parts.push({s:"box",x:-0.49,y:0.29,z:0,w:0.02,h:0.5,d:0.8,c:END});              /* an end panel where the run stops */
    if(endB)parts.push({s:"box",x:0.49,y:0.29,z:0,w:0.02,h:0.5,d:0.8,c:END});
    const cup=(cx,cy,cz)=>parts.push({s:"cyl",x:cx,y:cy+0.028,z:cz,r:0.034,h:0.056,c:CUP},
                                     {s:"torus",x:cx+0.042,y:cy+0.03,z:cz,r:0.018,t:0.007,c:CUP,ry:Math.PI/2});
    if((((x|0)+(y|0))%3+3)%3===2){
      parts.push({s:"box",x:0,y:T0+0.01,z:0.1,w:0.34,h:0.02,d:0.16,c:TRAY},                  /* the drip tray, bright steel */
        {s:"box",x:0,y:T0+0.15,z:-0.08,w:0.44,h:0.3,d:0.3,c:MACH},                           /* the body */
        {s:"box",x:0,y:T0+0.35,z:-0.1,w:0.3,h:0.1,d:0.24,c:HOP},                             /* the hopper, narrower: the step */
        {s:"cyl",x:0,y:T0+0.18,z:0.11,r:0.04,h:0.05,c:HOP},                                  /* the group head, off the front */
        {s:"cyl",x:0,y:T0+0.148,z:0.11,r:0.046,h:0.014,c:TRAY},                              /* the portafilter locked in */
        {s:"box",x:0,y:T0+0.148,z:0.2,w:0.02,h:0.018,d:0.12,c:HOP},                          /* its handle */
        {s:"box",x:-0.15,y:T0+0.24,z:0.077,w:0.05,h:0.04,d:0.014,c:LIGHT});                  /* the one warm light */
      cup(0,T0+0.02,0.11);}                                                                   /* under the group, air between */
    else{cup(-0.24+rnd(x,y,3,1)*0.2,T0,0.08+rnd(x,y,3,2)*0.08);                              /* a cup, where it was put down */
      parts.push({s:"box",x:0.2,y:T0+0.06,z:0.04,w:0.18,h:0.12,d:0.07,c:NAP},{s:"box",x:0.2,y:T0+0.14,z:0.04,w:0.13,h:0.08,d:0.03,c:CUP});}
    return turned(parts,ry);};

  /* ---------- DRAFTING TABLE (A) — the board is raked, and that is the object ----------
     Two feet, two columns, one stretcher between them, and a board raked back at about 23° with a
     pencil rail along its bottom edge so nothing rolls off, a sheet pinned to it and a parallel
     rule lying across. Everything about a drafting table is the rake: flat, it is a table. */
  const draftingTable=({x,y})=>{
    const LEG="#4A4F55",BOARD="#A98B62",SHEET="#F4F1EA",RAIL="#2F343A",RULE="#C9CDD2",rake=-0.40;
    const parts=[{s:"box",x:-0.3,y:0.02,z:0,w:0.07,h:0.04,d:0.5,c:LEG},
      {s:"box",x:0.3,y:0.02,z:0,w:0.07,h:0.04,d:0.5,c:LEG},
      {s:"box",x:-0.3,y:0.26,z:0,w:0.05,h:0.48,d:0.05,c:LEG},
      {s:"box",x:0.3,y:0.26,z:0,w:0.05,h:0.48,d:0.05,c:LEG},
      {s:"box",x:0,y:0.16,z:0,w:0.56,h:0.035,d:0.035,c:LEG},                 /* the stretcher */
      {s:"box",x:0,y:0.6,z:0,w:0.84,h:0.035,d:0.6,c:BOARD,rx:rake},
      {s:"box",x:0,y:0.612,z:0.012,w:0.66,h:0.006,d:0.44,c:SHEET,rx:rake},
      {s:"box",x:0,y:0.618,z:0.02,w:0.7,h:0.012,d:0.018,c:RULE,rx:rake},
      {s:"box",x:0,y:0.485,z:0.28,w:0.84,h:0.03,d:0.03,c:RAIL}];             /* the pencil rail */
    return turned(parts,facing(x,y));};

  /* ---------- PICKET FENCE (F) — the biggest single thing this library does ----------
     Ninety-three tiles of a second world were a double-sided PLANE with a picture of a fence
     printed on it, and a plane edge-on is nothing at all. Built the way a fence is built: two
     rails running the length of the tile, pickets nailed across them at a regular pitch with
     daylight between, each picket pointed at the top, and a POST only where the run ends — a
     fence has ends, not edges, and a post at every tile is a stockade. The pickets sit a hair off
     centre by the tile's own number, because they were nailed on by hand.
     A fence on the LIP of a well is a different object and the engine already knows it: knee-high,
     turned to face the hole. That one is `wellRail`. */
  const picketFence=({x,y})=>{const g=glyphAt(x,y);
    /* WEIGHT, not just correctness. The first version was five thin pickets in a pale cream and
       against a pale sand pavement it read as LESS fence than the billboard it replaced — sixty-
       three tiles of park that got more accurate and less legible in the same commit. Six pickets
       at a tighter pitch, thicker, deeper, and warmer than the floor they stand on. */
    const PICK="#C2A578",POST="#7A6340",RAIL="#9C8257",H=0.72,n=6;
    const ew=same(x-1,y,g)||same(x+1,y,g),ns=same(x,y-1,g)||same(x,y+1,g);
    const ry=(ns&&!ew)?Math.PI/2:0;
    const parts=[{s:"box",x:0,y:0.24,z:0,w:1.0,h:0.06,d:0.06,c:RAIL},
                 {s:"box",x:0,y:0.53,z:0,w:1.0,h:0.06,d:0.06,c:RAIL}];
    for(let i=0;i<n;i++){const px=-0.417+i*0.167,jig=(seed(x+i,y,3)-1)*0.005;
      parts.push({s:"box",x:px+jig,y:H/2,z:0,w:0.115,h:H,d:0.05,c:PICK},
                 {s:"cone",x:px+jig,y:H+0.04,z:0,r:0.082,h:0.1,c:PICK});}   /* the point on top */
    [-1,1].forEach(sd=>{const nx=x+(ew||!ns?sd:0),ny=y+((ns&&!ew)?sd:0);
      if(same(nx,ny,g))return;
      parts.push({s:"box",x:sd*0.47,y:0.43,z:0,w:0.1,h:0.86,d:0.1,c:POST},
                 {s:"cone",x:sd*0.47,y:0.9,z:0,r:0.073,h:0.09,c:POST});});
    return turned(parts,ry);};

  /* ---------- WELL RAIL (◺) — it stands on the LIP, not in the middle of the tile ----------
     The rail round the well over a staircase. Knee-high, two horizontals between stout newels, and
     it stands at the EDGE of the tile that touches the hole — a rail in the middle of its tile is
     a fence, and you would walk round it instead of up to it. Falls back to the tile's open side
     when there is no hole to find, so a pack that lays this letter anywhere still gets a rail. */
  const wellRail=({x,y})=>{
    const RAILC="#7A5233",NEWEL="#5C3B20",TOPC="#8F6440",H=0.56;
    const g=glyphAt(x,y);
    const w=(typeof CW==="function")&&CW();
    const hole=(ax,ay)=>!!w&&(typeof wellDepth==="function")&&ay>=0&&ay<w.H&&ax>=0&&ax<w.W&&wellDepth(w,ax,ay)>0;
    const lip=hole(x,y+1)?[0,0.42,0]:hole(x,y-1)?[0,-0.42,Math.PI]:hole(x+1,y)?[0.42,0,Math.PI/2]:hole(x-1,y)?[-0.42,0,-Math.PI/2]:null;
    const parts=[{s:"box",x:0,y:H,z:0,w:0.96,h:0.055,d:0.07,c:TOPC},         /* the handrail */
                 {s:"box",x:0,y:H*0.55,z:0,w:0.96,h:0.04,d:0.05,c:RAILC}];   /* the mid rail */
    /* A NEWEL ONLY WHERE THE RUN ENDS — the same rule `picketFence` above works to, and it was
       missing here. A newel is the STOP at the end of a handrail; one at every tile boundary is
       not a rail, it is a row of bollards. The nine rails upstairs in a second world sit at 1.0 apart
       with the posts inset to 0.44, so two abutting tiles put two 0.085-wide newels 0.12 apart
       with a 0.035 slot between them — read as a doubled post at every joint in the frame, where
       the guard (which measures height, lip offset and run direction) reported the rail correct.
       WHICH WAY THE RUN GOES is decided by the hole, not by the neighbours: a rail on the lip of a
       well runs ALONG the lip, so a lip to the north or south makes an east-west run. With no hole
       to find it falls back to the fence's own rule.
       AND A CORNER IS ALSO A JOINT. Writing only the straight-run rule left the loft with two
       posts 0.20 apart where the north rail turns into the west one — the two tiles are DIAGONAL
       neighbours, so neither could see the other by looking along its own run. A rail that turns a
       corner has ONE newel on the corner, so exactly one of the two tiles may claim it: the one
       nearer the top-left of the map keeps its post and the other drops it. An arbitrary rule,
       but it has to be arbitrary and it has to be the SAME arbitrary on both tiles, or they both
       keep it (two posts) or both drop it (a gap where the handrails should meet).
       WHICH TILE AN END POINTS AT is worked out through the TURN, not from `sd`. Doing it from
       `sd` alone is wrong for three of the four lips and it silently suppressed the post at the
       far end of the tile from the one that was doubled — the guard stayed red at the same 0.20
       and the code looked fixed. `turned` maps a part at (x,0) to (x·cos, −x·sin), so that is what
       decides which neighbour an end is leaning on. */
    const ry=lip?lip[2]:facing(x,y);
    const lipD=lip?(lip[0]!==0?[lip[0]>0?1:-1,0]:[0,lip[1]>0?1:-1]):null;
    const cr=Math.cos(ry),sr=Math.sin(ry),sgn=v=>Math.abs(v)<0.2?0:(v>0?1:-1);
    [-1,1].forEach(sd=>{
      const ex=x+sgn(sd*0.44*cr), ey=y+sgn(-sd*0.44*sr);                     /* the tile this end points at */
      if(same(ex,ey,g))return;                                               /* the run carries on: no stop here */
      if(lipD){const dx=ex+lipD[0],dy=ey+lipD[1];                            /* the tile round the corner */
        if(same(dx,dy,g)&&(dy<y||(dy===y&&dx<x)))return;}                    /* it owns the corner post, not me */
      parts.push({s:"box",x:sd*0.44,y:H/2,z:0,w:0.085,h:H,d:0.085,c:NEWEL},
                 {s:"sph",x:sd*0.44,y:H+0.055,z:0,r:0.055,c:TOPC});});       /* a newel has a cap on it */
    const out=turned(parts,ry);
    if(lip)out.forEach(p=>{p.x+=lip[0];p.z+=lip[1];});
    return out;};

  /* ---------- DOGHOUSE (9) — a little building, so it is built like one ----------
     Walls, two roof planes meeting at a real ridge with a cap over the join, and an arched
     opening: a rectangle with a half-round over it, because that is how you cut a door in a board
     with a jigsaw. Faces the first open side, so the dog can get in. */
  const doghouse=({x,y})=>{
    const WALL="#8A6F4D",ROOF="#C0392B",RIDGE="#8E2A20",DOOR="#3E2F1E",pitch=0.62;
    const parts=[{s:"box",x:0,y:0.26,z:0,w:0.7,h:0.52,d:0.62,c:WALL},
      {s:"box",x:-0.19,y:0.62,z:0,w:0.46,h:0.035,d:0.74,c:ROOF,rz:pitch},
      {s:"box",x:0.19,y:0.62,z:0,w:0.46,h:0.035,d:0.74,c:ROOF,rz:-pitch},
      {s:"box",x:0,y:0.74,z:0,w:0.06,h:0.05,d:0.76,c:RIDGE},
      {s:"box",x:0,y:0.15,z:0.3,w:0.26,h:0.3,d:0.04,c:DOOR},
      {s:"cyl",x:0,y:0.3,z:0.3,r:0.13,h:0.04,c:DOOR,rx:Math.PI/2}];
    return turned(parts,facing(x,y));};

  /* ---------- THE AGILITY COURSE (3 4 5) — three pieces of gear, each turned to the line the dog runs ----------
     Owner, 2026-09-29: "please also fix the dog agility course too - shape and beautify please". They were pictures
     that turned with the camera ("billboard on purpose" was a crew call; the owner reversed it that day). The plan,
     a winged hurdle with a striped bar in cups, a ribbed tunnel with dark mouths and sandbags, weave poles on a base
     rail — and each piece TURNED TO THE LINE THE DOG RUNS, which is the engine's own answer (`gearLine` in
     engine/engine.js, read here through `runTurn`), so a piece and the dog who takes it cannot disagree. Every piece
     is built with the dog running along +x and then turned; the camera rests only on quarter turns and so does this.
     Rendered in Meridian's park at both quarter turns before any of it was written (the mock, 2026-10-03), and what
     the mock found is said at each piece. Manufactured gear comes off a jig, so nothing varies between two hurdles;
     the only hand in the course is the one that filled and dropped the sandbags, and that is where it varies. */
  const runTurn=(x,y)=>{const L=typeof gearLine==="function"?gearLine(null,x,y):[1,0];   /* null: the world being built */
    return L[0]?0:Math.PI/2;};

  /* HURDLE (3) — a jump stand is built in this order: feet, the wing's frame, the boards set in it, the upright the
     cups clip onto, the cups, and last the bar laid in the cups. THE WINGS ARE SPLAYED 45°, back toward the run-up:
     the mock stood them flat in the bar's plane first, and from the camera that looks along the bar (yaw 0, which is
     where the jump reads best, side-on) the whole hurdle was two thin red sticks. Splayed, each wing shows most of its
     face at both quarter turns. Seen end-on it is still the weakest view of the three pieces — a stand with mass,
     read as a jump the moment the dog goes over it. The bar is at 0.30, under the top of his hop (DOGHOP). */
  const hurdle=({x,y})=>{
    const POST="#C0392B",CAP="#962C21",FRAME="#F2E8D8",BOARD=["#C0392B","#E8DCC8"],TAPE="#E0A430",CUP="#3A3440",FOOT="#8E8A84";
    const BARH=0.30,ZP=0.25,SPLAY=Math.PI/4,ca=Math.cos(SPLAY),sa=Math.sin(SPLAY);
    const parts=[];
    [-1,1].forEach(sd=>{
      /* one wing, built flat — z outward from its upright — then stood at its splay on its own side of the bar */
      const w0=0.03,w1=0.25,top0=0.60,top1=0.42,len=w1-w0,zc=(w0+w1)/2,fall=Math.atan2(top0-top1,len);
      const wing=[{s:"box",x:0,y:0.015,z:w1-0.02,w:0.30,h:0.03,d:0.045,c:FOOT},                          /* its foot */
        {s:"box",x:0,y:0.04,z:zc,w:0.04,h:0.04,d:len+0.02,c:FRAME},                                       /* bottom rail */
        {s:"box",x:0,y:(top0+top1)/2,z:zc,w:0.04,h:0.045,d:Math.hypot(len,top0-top1)+0.03,c:FRAME,rx:sd*fall},  /* top rail, falling away outward */
        {s:"box",x:0,y:top1/2,z:w1,w:0.045,h:top1,d:0.045,c:FRAME}];                                       /* outer stile */
      for(let i=0;i<3;i++){const z=w0+(i+0.5)*len/3,ht=top0+(top1-top0)*(z-w0)/len-0.04;                 /* three boards, each cut to the rail's fall */
        wing.push({s:"box",x:0,y:(ht+0.06)/2,z,w:0.028,h:ht-0.06,d:len/3*0.98,c:BOARD[i%2]});}
      wing.forEach(p=>parts.push({...p,x:(p.x||0)-p.z*sa,z:sd*(ZP+p.z*ca),ry:(p.ry||0)-sd*SPLAY}));
      parts.push({s:"box",x:0,y:0.015,z:sd*ZP,w:0.30,h:0.03,d:0.05,c:FOOT},                               /* the upright's foot */
                 {s:"cyl",x:0,y:0.32,z:sd*ZP,r:0.032,h:0.64,c:POST},                                       /* the upright */
                 {s:"sph",x:0,y:0.65,z:sd*ZP,r:0.038,c:CAP},
                 {s:"box",x:0,y:BARH-0.035,z:sd*(ZP-0.045),w:0.06,h:0.04,d:0.05,c:CUP});});                /* the cup, inside, at the bar */
    const L=2*(ZP-0.02);                                                                                    /* the bar: one pole, taped in five */
    for(let i=0;i<5;i++)parts.push({s:"cyl",x:0,y:BARH,z:-L/2+(i+0.5)*L/5,r:0.03,h:L/5+0.001,c:i%2?TAPE:FRAME,rx:Math.PI/2});
    return turned(parts,runTurn(x,y));};

  /* TUNNEL (4) — a FULL tube, shut overhead, that a dog runs through and a person cannot fit in (owner, 2026-10-03:
     "you had previously provided full tunnel - should also work for the pets to go through but i cant fit in it").
     Made the way one is: a vinyl sleeve over a spiral of wire, laid on the ground, held down with bags of sand. The
     sleeve is ten staves round an OPEN bore — a cylinder here would be capped, and a capped tube is a drum — with a
     near-black lining, so a mouth seen end-on is dark and the bore really is empty (the guard casts a ray down it).
     Value is painted in: the staves that face the sky paler, the belly darker, because one sun and one ambient are
     all the light there is. The wire shows as raised ribs, and each mouth has a hoop. 0.46 tall: a dog's head clears
     in, a person (0.92) does not. Two things the mock threw out: bags at the foot as round lumps read as WHEELS
     side-on (a blue cart), and saddle bags hung on straps read as a hand cart. Flat pillows lying along the foot,
     each tied at one end, read as sandbags at both quarter turns. */
  const tunnel=({x,y})=>{
    const R=0.23,L=0.94,N=10,LINER="#141220",RIB="#5C86C6",HOOP="#6C93D0",BAG=["#B09766","#9C8456"],TIE="#7A6440";
    const shade=th=>{const up=Math.cos(th);return up>0.6?"#4473BC":up>-0.2?"#2E5FA8":"#234A86";};
    const ap=Math.cos(Math.PI/N),side=2*R*Math.sin(Math.PI/N)+0.012,r2=R-0.028;
    const parts=[];
    for(let k=0;k<N;k++){const th=2*Math.PI*k/N;                                                            /* the sleeve, stave by stave */
      parts.push({s:"box",x:0,y:R+R*ap*Math.cos(th),z:R*ap*Math.sin(th),w:L,h:0.024,d:side,c:shade(th),rx:th},
                 {s:"box",x:0,y:R+r2*ap*Math.cos(th),z:r2*ap*Math.sin(th),w:L-0.01,h:0.012,d:2*r2*Math.sin(Math.PI/N)+0.01,c:LINER,rx:th});}
    for(let i=0;i<8;i++)parts.push({s:"torus",x:-L/2+0.07+i*(L-0.14)/7,y:R,z:0,r:R+0.012,t:0.02,c:RIB,ry:Math.PI/2});   /* the wire */
    [-1,1].forEach(sd=>parts.push({s:"torus",x:sd*(L/2-0.01),y:R,z:0,r:R+0.004,t:0.032,c:HOOP,ry:Math.PI/2}));            /* the mouths */
    /* the bags: filled and dropped by hand, so each lies at its own small angle — the one honest variation here */
    [[-0.25,1],[0.25,-1],[0.25,1],[-0.25,-1]].forEach(([bx,sd],i)=>{const t=(seed(x+i,y+2*i,5)-2)*0.04;
      parts.push({s:"box",x:bx,y:0.035,z:sd*(R+0.075),w:0.26,h:0.07,d:0.12,c:BAG[i%2],ry:t},
                 {s:"box",x:bx+0.1,y:0.035,z:sd*(R+0.075),w:0.03,h:0.074,d:0.124,c:TIE,ry:t});});
    return turned(parts,runTurn(x,y));};

  /* WEAVE POLES (5) — a steel base rail with feet across it, a socket for every pole, the poles, the tape. SIX, at
     GEARWEAVE's spacing (engine/engine.js), which is also where the dog weaves round them, so his line and these
     poles are one set of numbers. White poles with the tape at the top, red and blue by turns: at 35 px a tile the
     tops are what reads, and alternating them is what tells six poles from a fence. Seen down their own line (the
     quarter turn that looks along the run) they stand one behind another and read as one striped post — the mock
     says so plainly; the dog weaving left and right is what reads there. */
  const weavePoles=({x,y})=>{
    const G=(typeof GEARWEAVE==="object"&&GEARWEAVE)||{n:6,gap:0.16},RAIL="#7A7F88",RAILD="#5E636B",POLE="#F2E8D8",TAPE=["#C0392B","#2E5FA8"],PH=0.66;
    const parts=[{s:"box",x:0,y:0.018,z:0,w:0.96,h:0.035,d:0.07,c:RAIL}];
    [-0.46,0.46].forEach(fx=>parts.push({s:"box",x:fx,y:0.014,z:0,w:0.05,h:0.028,d:0.36,c:RAILD}));
    for(let k=0;k<G.n;k++){const px=(k-(G.n-1)/2)*G.gap;
      parts.push({s:"cyl",x:px,y:0.055,z:0,r:0.042,h:0.05,c:RAILD},
                 {s:"cyl",x:px,y:0.035+PH/2,z:0,r:0.03,h:PH,c:POLE},
                 {s:"cyl",x:px,y:0.035+PH-0.07,z:0,r:0.034,h:0.12,c:TAPE[k%2]},
                 {s:"sph",x:px,y:0.04+PH,z:0,r:0.032,c:TAPE[k%2]});}
    return turned(parts,runTurn(x,y));};

  /* ---------- PLANTER (b) — the marigold bed, raised, as Meridian built it ----------
     The engine draws `b` as a bed of cempasúchil (`drawBed`, engine/engine.js): soil with a lip, open heads wider than
     they are tall with a green cup under each, and buds — and until 2026-10-04 a world that laid it got exactly that,
     painted on the floor, because the only standing bed was in Meridian's own file. This is that construction, lifted
     and made plain: a painted-concrete curb with a rounded lip a mason's trowel ran round, soil a hand below the lip,
     a mound of near-black foliage, and the heads standing out of it, the middle of the bed higher and the edge heads
     lower. A run of beds shares one curb: walls stand only where the run ends. Every head is the same flower, made of
     the three marks that survive at tile size — a dark collar under it wider than the head (the value step the eye
     reads it by: an orange mass with dark under it is a flower, an orange mass alone is a traffic cone), the head
     itself flattened, and a paler crown. The colours are `petalPal()`, the engine's marigold, so the bed and its own
     petals are one flower; what differs between heads is what differed in the field — size, place and which of the
     packet's hues — seeded on both axes. A world's festival dress for it (papel picado, an ofrenda's arch) stays the
     world's. It stands on a tile a person may walk across (`.walk`), so the gate stands it there rather than refuse
     it; a world that wants its beds walked round says so in its own SOLIDX. */
  const planter=({x,y})=>{const g=glyphAt(x,y);
    const P=(typeof petalPal==="function"&&petalPal())||["#7A2E12","#B8410E","#E2620F","#F2870F","#FBB024","#FFD972"];
    const CURB="#B9B0A2",LIP="#CFC7B9",SOIL="#2F2216",LEAF="#27492F",LEAF2="#3E7C4F",COLLAR="#1B3521",BUD="#4E8A58";
    const N=!same(x,y-1,g),S=!same(x,y+1,g),E=!same(x+1,y,g),Wt=!same(x-1,y,g);
    const x0=Wt?-0.46:-0.5,x1=E?0.46:0.5,z0=N?-0.46:-0.5,z1=S?0.46:0.5,parts=[];
    const wall=(px,pz,ww,dd)=>parts.push({s:"box",x:px,y:0.11,z:pz,w:ww,h:0.22,d:dd,c:CURB},
      {s:"cyl",x:px,y:0.22,z:pz,r:0.045,h:Math.max(ww,dd),c:LIP,rz:ww>dd?Math.PI/2:0,rx:ww>dd?0:Math.PI/2});   /* the lip */
    if(N)wall((x0+x1)/2,-0.42,x1-x0,0.08);if(S)wall((x0+x1)/2,0.42,x1-x0,0.08);
    if(Wt)wall(-0.42,(z0+z1)/2,0.08,z1-z0);if(E)wall(0.42,(z0+z1)/2,0.08,z1-z0);
    const sx0=Wt?-0.38:-0.5,sx1=E?0.38:0.5,sz0=N?-0.38:-0.5,sz1=S?0.38:0.5;
    parts.push({s:"box",x:(sx0+sx1)/2,y:0.16,z:(sz0+sz1)/2,w:sx1-sx0,h:0.08,d:sz1-sz0,c:SOIL});     /* the soil, a hand below the lip */
    const cl=v=>Math.max(-0.3,Math.min(0.3,v));
    for(let i=0;i<9;i++)parts.push({s:"sph",x:cl(-0.28+(i%3)*0.28+(rnd(x,y,i,1)-0.5)*0.1),y:0.25+rnd(x,y,i,3)*0.05,
      z:cl(-0.28+((i/3)|0)*0.28+(rnd(x,y,i,2)-0.5)*0.1),r:0.1+rnd(x,y,i,4)*0.03,sx:1.35,sy:0.45,sz:0.9,ry:rnd(x,y,i,5)*3.14,c:i%3?LEAF:LEAF2}); /* the mound */
    [[-0.26,-0.25],[0.01,-0.27],[0.27,-0.24],[-0.13,0],[0.14,0.02],[-0.27,0.25],[0.02,0.27],[0.27,0.25]].forEach(([hx,hz],i)=>{
      const px=hx+(rnd(x,y,i,6)-0.5)*0.06,pz=hz+(rnd(x,y,i,7)-0.5)*0.06,r=0.075+rnd(x,y,i,8)*0.025,
            k=1+Math.floor(rnd(x,y,i,10)*3),hy=0.38+(1-Math.min(1,Math.hypot(px,pz)/0.42))*0.08+rnd(x,y,i,9)*0.03;
      parts.push({s:"sph",x:px,y:hy-r*0.2,z:pz,r:r*1.25,sy:0.18,c:COLLAR},                   /* the dark under it, wider than the head */
        {s:"sph",x:px,y:hy,z:pz,r,sy:0.7,c:P[k+1]},                                           /* the head, wider than tall */
        {s:"sph",x:px,y:hy+r*0.42,z:pz,r:r*0.55,sy:0.8,c:P[Math.min(5,k+2)]});});             /* its crown, paler */
    [[-0.14,-0.13],[0.15,0.15]].forEach(([bx,bz],i)=>parts.push({s:"cyl",x:bx,y:0.38,z:bz,rt:0.03,rb:0.02,h:0.07,c:BUD},   /* buds: the same plant, younger */
      {s:"sph",x:bx,y:0.425,z:bz,r:0.026,sy:1.2,c:P[2+i]}));
    return parts;};

  /* ---------- GRASS (g) — a tuft, standing ----------
     The engine draws `g` as four blades on the floor. Meridian stood it up and nobody else could: blades from one
     root, cones leaning outward, the ones toward the light longer and paler, one gone to straw, on a fist of soil.
     Lifted as it was. Walked through, so `.walk`; below a person's knee. */
  const grass=({x,y})=>{const h=Math.floor(rnd(x,y,0,1)*8),n=8+(h%3);
    const parts=[{s:"cyl",x:0,y:0.006,z:0,r:0.13,h:0.012,c:"#5A4632"}];                      /* the soil it holds */
    for(let i=0;i<n;i++){const a=i*(Math.PI*2/n)+h*0.35,lit=Math.cos(a+Math.PI*0.75)>0.2;
      const len=0.18+((i*3+h)%4)*0.04+(lit?0.04:0),lean=0.35+((i*5+h)%3)*0.15,bx=Math.cos(a)*0.045,bz=Math.sin(a)*0.045;
      parts.push({s:"cone",x:bx+Math.cos(a)*Math.sin(lean)*len*0.5,y:Math.cos(lean)*len*0.5,z:bz+Math.sin(a)*Math.sin(lean)*len*0.5,
        r:0.022,h:len,c:lit?"#9CD486":"#5FA86A",rx:Math.sin(a)*lean,rz:-Math.cos(a)*lean});}   /* the drawing's green, and a lit one */
    const a=h*0.9+2,len=0.16,lean=0.9;                                                        /* one blade gone to straw */
    parts.push({s:"cone",x:Math.cos(a)*Math.sin(lean)*len*0.5,y:Math.cos(lean)*len*0.5,z:Math.sin(a)*Math.sin(lean)*len*0.5,r:0.018,h:len,c:"#C9B66E",rx:Math.sin(a)*lean,rz:-Math.cos(a)*lean});
    return parts;};

  /* ---------- SITE SIGN (X) — a diamond on a stick ----------
     `TILEDRAW["X"]` draws a yellow board on a post, and in 3D it was that drawing on a billboard turning to face the
     camera — in every world, Meridian's five included, the last flat picture in it. Made as one is: a weighted foot,
     a steel post, a diamond plate bolted near the top and printed on BOTH faces (a site sign is read from both sides
     of the street) in the drawing's yellow, with a dark border round the print and one mark on it, a bar and a dot.
     Not the drawing's emoji — a picture of a picture — and no diagonal stripes, which read as "crossed out" here.
     WHICH WAY IT STANDS was measured, not chosen: turned to its first open side, as the first draft of it was, a
     sign with a fence to its south stood edge-on to the camera at its resting turn, a post and nothing else, in
     Meridian's street (2026-10-04, rendered). Printed on both faces, it reads the same from the north as from the
     south, so it always stands across the north-south line, and only its turn from that varies, a few degrees from
     where it was dropped; nothing else varies. */
  const siteSign=({x,y})=>{
    const FOOT="#2F343A",POST="#8E969E",FACE="#E7C25A",EDGE="#2B2410",BOLT="#C9CDD2",SIDE=0.36/Math.SQRT2,B=0.025,Z=0.03,MID=0.62;
    const parts=[{s:"box",x:0,y:0.03,z:0,w:0.30,h:0.06,d:0.20,c:FOOT},                       /* the weighted foot */
      {s:"cyl",x:0,y:0.42,z:0,r:0.02,h:0.72,c:POST},                                          /* the post, 0.06 to 0.78 */
      {s:"box",x:0,y:MID,z:Z,w:SIDE,h:SIDE,d:0.01,c:EDGE,rz:Math.PI/4},                       /* the plate, 0.36 across: its dark is the border */
      {s:"box",x:0,y:MID,z:Z+0.0065,w:SIDE-2*B,h:SIDE-2*B,d:0.003,c:FACE,rz:Math.PI/4},       /* printed on the front */
      {s:"box",x:0,y:MID,z:Z-0.0065,w:SIDE-2*B,h:SIDE-2*B,d:0.003,c:FACE,rz:Math.PI/4}];      /* and on the back */
    [1,-1].forEach(f=>parts.push({s:"box",x:0,y:MID+0.025,z:Z+f*0.0085,w:0.026,h:0.085,d:0.002,c:EDGE},   /* the mark, both faces */
                                 {s:"box",x:0,y:MID-0.05,z:Z+f*0.0085,w:0.026,h:0.026,d:0.002,c:EDGE}));
    [0.09,-0.09].forEach(dy=>parts.push({s:"cyl",x:0,y:MID+dy,z:Z-0.012,r:0.01,h:0.03,c:BOLT,rx:Math.PI/2}));   /* bolted to the post */
    return turned(parts,(rnd(x,y,2,2)-0.5)*0.34);};                                         /* ±10° from where it was dropped */

  /* WHAT EACH SHAPE CLAIMS, where the gate and the suite can read it. `drawing` is the letter whose engine drawing
     the shape was built from, part for part — the gate lets a world take a letter that already stands as a drawing
     only when its shape says this, and test/engine.smoke.js measures every such claim against that drawing (a claim
     with no measurement is a red there). `walk` says the shape may stand on a tile a person walks across, so the gate
     stands it instead of refusing it (engine/engine.js, the gate, clause 4). */
  desk.drawing="D";table.drawing="T";shelving.drawing="S";stove.drawing="V";counter.drawing="K";
  planter.drawing="b";grass.drawing="g";siteSign.drawing="X";
  planter.walk=true;grass.walk=true;

  return {plant,tree,desk,table,crate,shelving,fridge,stove,counter,draftingTable,picketFence,wellRail,doghouse,hurdle,tunnel,weavePoles,planter,grass,siteSign};
})();

/* ---------- SHAPEBIND — the engine binding its own letters, in the open ----------
   The engine spells a desk "D" and a fence "F". That is the ENGINE's spelling, not a law: a pack
   that means something else by a letter says so — a `mesh` of its own, a `TILEART` drawing, a
   `TILEMETA` row — and the gate in `engine/engine.js` leaves that letter alone. This table is
   readable BY a pack for the same reason it is a table and not a switch: a world can look at what
   the engine would do to its letters before it lays one.

   THIS TABLE IS AN OFFER, NOT AN INSTRUCTION. Nothing here reaches a world until that world names
   the letter in its own `SHAPETAKE` string. Silence is not consent — see the gate in
   `engine/engine.js` (grep "THE GATE") for why that had to become the rule.

   THREE LETTERS TAUGHT THIS TABLE ITS RULES, by three different mechanisms, which is the whole
   lesson: ONE LETTER CAN MEAN TWO OBJECTS, and each time it has, it slipped past the lock built for
   the time before.

   `I` — the engine's `I` is El Mercado's grocery counter, waist high; a second world re-declares it
   as a STOREFRONT FACE at wall height. **It is simply not in the
   table below, and that — not any clause in the gate — is what keeps a counter out of twelve of
   that world's shops.** This comment used to credit the gate's `TILEMETA` clause for that, which was
   false: the clause would indeed refuse `I`, but it never gets the chance, because the letter is
   not offered. The repair is this paragraph. (The clause stays; it is right in general and it is
   labelled untested in the gate, because nothing in either game currently reaches it.)

   `H` — the one that got through, and the reason `SHAPETAKE` exists. The engine's `H` is an open
   PRODUCE CRATE (`TILEDRAW["H"]` in engine/engine.js). A second world lays six of them inside
   houses and its own map calls them RACKS. That world
   has never drawn `H` itself — it takes the engine's drawing — so every clause in the gate that
   asks "did the pack say something?" answers NO, correctly, and the wrong object stands up anyway.
   **No table in this engine records what a world MEANS by a letter it has never drawn.** That is
   not a hole to be plugged with a sixth clause; it is the reason a world has to ask.

   `b` — the marigold bed, and the instructive one. The engine's `b` is walked across: it is neither solid nor
   `stand`, so a shape bound to it could never be STOOD by the 3D camera; but the ground bake's contact pad
   (`engine/engine3d.js`, grep "THE PAD") asks only whether a glyph HAS a mesh, with no solidity test at all. Bind
   `b` naively and every tile of a world that lays it gets a soft radial shadow on the pavement with nothing standing
   on it — baked into a texture, so a scene-graph dump reports "identical" and the street quietly has smudges on
   it. It IS offered now (2026-10-04, with `g`): its shape says it may stand on a walked tile (`.walk`), and when a
   world takes it by name the gate marks the letter as standing in that world, so the shape stands on the pad and
   the pad is the shadow of something. A world that never names `b` keeps its bed painted on the floor, unchanged. */
const SHAPEBIND={P:"plant",J:"tree",D:"desk",T:"table",H:"crate",S:"shelving",
                 W:"fridge",V:"stove",K:"counter",A:"draftingTable",
                 F:"picketFence","◺":"wellRail","9":"doghouse",
                 "3":"hurdle","4":"tunnel","5":"weavePoles",   /* the agility gear, mq-v232: walkable, `stand`, so the gate's solidity clause lets them through */
                 b:"planter",g:"grass",X:"siteSign"};           /* 2026-10-04: the planters, the grass and the site sign, so a world need not draw its own */
/* `D T S K V` ARE TAKEN LIKE ANY OTHER LETTER NOW, and why they were not is worth keeping. All five have a `TILESIDE`
   drawing in this engine, so `wearsArt` is true for them in every world: they stand as boxes wearing that drawing
   on four faces and the lid, which is the 2D the owner kept seeing. Until 2026-10-04 the gate's clause 5 refused
   them however loudly a world asked, and it was right to, for a reason nobody had written down: four of the five
   library shapes were not their letter's drawing (a bare square table, a chin-high counter with no machine, a white
   stove, a bookcase whose books touched the board above). Taking one deleted a drawing and put a different object
   where it stood. The library now carries each letter's own drawing, each shape says so (`.drawing`), the gate takes
   that sentence as the condition for clause 5, and test/engine.smoke.js measures every such sentence against the
   drawing on every build. So a world takes them by name in `SHAPETAKE`, and no longer has to keep a copy of its own.
   A pack that wants a VARIANT still writes its own mesh, `const TILEART_MESH={T:o=>SHAPES.table({...o,cleared:onIt(o)})};`,
   and clause 1 lets it through. THE ARROW IS MANDATORY AND IS NOT STYLE: `engine/boot.js` is the last script tag in
   every shell and it is what writes THIS file, so a pack is evaluated before `SHAPES` and `TILEMESH` exist.
   `TILEMESH["K"]=SHAPES.counter` throws "TILEMESH is not defined" and `TILEART["K"]={mesh:SHAPES.counter}` throws
   "SHAPES is not defined" — both were documented here and in four other places on 2026-09-22 and neither ran. TWO
   THINGS ARE REQUIRED, not one: the table must be DECLARED by the pack (a world that has never written a mesh has no
   `TILEART_MESH`, so `TILEART_MESH["K"]=…` throws too) and the reference must be LATE-BOUND. All three forms were
   planted against a second world on 2026-09-22; only the one above printed OK. */
