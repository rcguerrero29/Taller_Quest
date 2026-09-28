/* ---------- SHAPES — the engine's own shape library for the 3D camera ----------
   Owner, 2026-09-22: "why didnt we update the items we updated in meridian for the
   engine/changarrito? we should all across the template and the two please"

   Meridian spent four crew iterations turning its furniture from pictures into SHAPES — parts with
   a size and a colour, merged into one mesh per tile (`TILEART_MESH`, the `mesh` view). Every one
   of them lived in `content/meridian/art.js`, so El Changarrito — the same engine, the same
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

  /* ---------- TABLE (T) — four legs, an apron, a top, and one turn off square ----------
     The plain one. A table is made by joining four legs to an apron and laying a top on it, so the
     apron is set IN from the top's edge on every side and the legs sit under its corners — that
     inset is the whole difference between a table and a block of wood seen from across a room.
     Turned a few degrees by its own number: nobody ever pushed a table back exactly square. */
  const table=({x,y})=>{const WOOD="#5E3B20",TOP="#7A4E2B",UNDER="#3A2413",lg=0.31;
    const parts=[];
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>
      parts.push({s:"box",x:sx*lg,y:0.24,z:sz*lg,w:0.055,h:0.48,d:0.055,c:WOOD}));
    parts.push({s:"box",x:0,y:0.44,z:0,w:0.68,h:0.05,d:0.68,c:WOOD},        /* the apron, set in */
      {s:"box",x:0,y:0.5,z:0,w:0.78,h:0.045,d:0.78,c:TOP},                  /* the top, overhanging it */
      {s:"box",x:0,y:0.474,z:0,w:0.74,h:0.012,d:0.74,c:UNDER});             /* the shade under the top */
    return turned(parts,seed(x,y,4)*0.09-0.13);};

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

  /* ---------- SHELVING (S) — a carcass you can see INTO ----------
     Two uprights, a thin back, four boards with real depth, and on the boards runs of spines with
     one leaning into the gap the way a shelf actually looks. The books are one box per run, not
     one per book: at tile size a run of spines reads as a run of spines, and thirty boxes reads as
     thirty draw calls. Faces the first open side, so a shelf against a wall opens to the room. */
  const shelving=({x,y})=>{
    /* THE SPINES ARE WHY ANYBODY LOOKS AT A SHELF. The first version put them in the back half of
       a 0.34-deep carcass in five muted colours, and a picture showed what the count could not: the
       town's shop shelves went from a bright billboard of books to a dark brown cupboard. They sit
       forward now, in colours that survive a lambert in shade. */
    const CASE="#6B4A2C",BACK="#4A3220",BOARD="#8A6340",SP=["#C0392B","#2F6FB0","#3E9B6A","#E0A32E","#8E5BB5","#C86A3A"];
    const parts=[{s:"box",x:-0.3,y:0.5,z:0,w:0.06,h:1.0,d:0.34,c:CASE},
                 {s:"box",x:0.3,y:0.5,z:0,w:0.06,h:1.0,d:0.34,c:CASE},
                 {s:"box",x:0,y:0.5,z:-0.16,w:0.6,h:1.0,d:0.03,c:BACK},
                 {s:"box",x:0,y:0.99,z:0,w:0.66,h:0.04,d:0.36,c:CASE}];
    [0.02,0.27,0.52,0.77].forEach((by,i)=>{
      parts.push({s:"box",x:0,y:by,z:0,w:0.6,h:0.035,d:0.34,c:BOARD});
      if(i===3)return;                                                       /* the top shelf left empty: a shelf is never full */
      const n=2+((seed(x,y,3)+i)%2);                                         /* two runs, sometimes three */
      for(let k=0;k<n;k++){const bw=0.15+((seed(x+k,y+i,3))*0.03);
        parts.push({s:"box",x:-0.26+k*0.19+bw/2,y:by+0.13,z:0.055,w:bw,h:0.22,d:0.2,c:SP[(seed(x,y,6)+k+i)%6]});}
      parts.push({s:"box",x:0.2,y:by+0.12,z:0.055,w:0.055,h:0.21,d:0.19,c:SP[(seed(x,y,6)+i+2)%6],rz:0.34}); /* the leaner */
    });
    return turned(parts,facing(x,y));};

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

  /* ---------- STOVE (V) — FOUR burners, and the door is a door ----------
     Four, because four is what a domestic range has and what four rings can be told apart at this
     size (the owner, this week, on Meridian's: "four burners"). A body, a hob plate set on top of
     it, four rings as flat tori — a ring reads as a ring and a disc reads as a hotplate — a oven
     door that is INSET with a bar handle standing off it on two stubs, a glass window you can see
     through, four knobs on the fascia and a splashback up the wall behind. */
  const stove=({x,y})=>{
    const BODY="#D8DBDF",STEEL="#AEB6BE",DARK="#2F343A",RING="#4A4F55",GLASS="#3A4046",KNOB="#8E969E",FLAME="#E07A2F";
    const parts=[{s:"box",x:0,y:0.02,z:0,w:0.6,h:0.04,d:0.52,c:DARK},        /* the recess it stands in */
      {s:"box",x:0,y:0.42,z:0,w:0.64,h:0.76,d:0.56,c:BODY},
      {s:"box",x:0,y:0.815,z:0,w:0.66,h:0.03,d:0.58,c:STEEL},                /* the hob plate */
      {s:"box",x:0,y:0.9,z:-0.3,w:0.66,h:0.2,d:0.03,c:STEEL}];               /* the splashback */
    [[-0.15,-0.13],[0.15,-0.13],[-0.15,0.13],[0.15,0.13]].forEach(([bx,bz],i)=>{
      parts.push({s:"torus",x:bx,y:0.836,z:bz,r:0.1,t:0.018,rx:Math.PI/2,c:RING});
      if(i===seed(x,y,4))parts.push({s:"torus",x:bx,y:0.845,z:bz,r:0.07,t:0.012,rx:Math.PI/2,c:FLAME});}); /* one ring lit */
    parts.push({s:"box",x:0,y:0.36,z:0.276,w:0.54,h:0.46,d:0.012,c:STEEL},   /* the oven door, inset */
      {s:"box",x:0,y:0.38,z:0.283,w:0.4,h:0.26,d:0.006,c:GLASS,a:0.55},      /* and you can see in */
      {s:"box",x:0,y:0.6,z:0.315,w:0.5,h:0.028,d:0.028,c:STEEL},             /* the bar handle, standing off */
      {s:"box",x:-0.2,y:0.6,z:0.297,w:0.02,h:0.02,d:0.04,c:DARK},
      {s:"box",x:0.2,y:0.6,z:0.297,w:0.02,h:0.02,d:0.04,c:DARK});
    [-0.21,-0.07,0.07,0.21].forEach(kx=>parts.push({s:"cyl",x:kx,y:0.73,z:0.293,r:0.032,h:0.022,c:KNOB,rx:Math.PI/2}));
    return turned(parts,facing(x,y));};

  /* ---------- COUNTER (K) — laid in RUNS, so it has ends and not edges ----------
     The carcass is the full tile wide and dead flat along the top, so a run of five reads as ONE
     counter at one height with no seam in it; an end panel and a returned nosing stand only where
     the run actually stops. That is the whole trick, and it is why this one reads the grid. Two
     recessed panels on the front, a nosing along the serving edge, and a shadow gap at the floor
     so it does not look poured into the slab. */
  const counter=({x,y})=>{const g=glyphAt(x,y);
    const BODY=C.counter,TOP="#C9CDD2",PANEL="#6C7681",NOSE="#DDE2E6",DARK="#3A4046";
    const ew=same(x-1,y,g)||same(x+1,y,g),ns=same(x,y-1,g)||same(x,y+1,g);
    /* which way the run goes, and which way it faces across itself: a counter you serve over
       faces the open side ACROSS the run, never along it. */
    const along=ew&&!ns?0:ns&&!ew?Math.PI/2:facing(x,y);
    const parts=[{s:"box",x:0,y:0.03,z:0,w:0.92,h:0.06,d:0.5,c:DARK},        /* the shadow gap at the foot */
      {s:"box",x:0,y:0.42,z:0,w:1.0,h:0.72,d:0.56,c:BODY},
      {s:"box",x:0,y:0.795,z:0,w:1.0,h:0.05,d:0.6,c:TOP},                    /* the top, proud of the body */
      {s:"box",x:0,y:0.79,z:0.302,w:1.0,h:0.07,d:0.02,c:NOSE},               /* the nosing along the front */
      {s:"box",x:-0.26,y:0.42,z:0.283,w:0.4,h:0.5,d:0.012,c:PANEL},
      {s:"box",x:0.26,y:0.42,z:0.283,w:0.4,h:0.5,d:0.012,c:PANEL}];
    /* an END PANEL where the run stops — one per open end, and a standalone counter gets both */
    [-1,1].forEach(sd=>{const nx=x+(ew?sd:0),ny=y+(ns&&!ew?sd:0);
      if((ew||ns)&&same(nx,ny,g))return;
      parts.push({s:"box",x:sd*0.49,y:0.42,z:0,w:0.04,h:0.78,d:0.58,c:PANEL});});
    return turned(parts,along);};

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
     Ninety-three tiles of El Changarrito were a double-sided PLANE with a picture of a fence
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
       not a rail, it is a row of bollards. The nine rails upstairs in the town sit at 1.0 apart
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

  return {plant,tree,desk,table,crate,shelving,fridge,stove,counter,draftingTable,picketFence,wellRail,doghouse};
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

   THREE LETTERS ARE REFUSED, and the three refusals are three different mechanisms, which is the
   whole lesson: ONE LETTER CAN MEAN TWO OBJECTS, and each time it has, it slipped past the lock
   built for the time before.

   `I` — the engine's `I` is El Mercado's grocery counter, waist high; El Changarrito re-declares it
   as a STOREFRONT FACE at wall height (`changarrito/content/art.js:10`). **It is simply not in the
   table below, and that — not any clause in the gate — is what keeps a counter out of twelve of
   the town's shops.** This comment used to credit the gate's `TILEMETA` clause for that, which was
   false: the clause would indeed refuse `I`, but it never gets the chance, because the letter is
   not offered. The repair is this paragraph. (The clause stays; it is right in general and it is
   labelled untested in the gate, because nothing in either game currently reaches it.)

   `H` — the one that got through, and the reason `SHAPETAKE` exists. The engine's `H` is an open
   PRODUCE CRATE (`TILEDRAW["H"]` in engine/engine.js). El Changarrito lays six of them inside
   houses and its own map calls them RACKS (`changarrito/content/maps.js`, grep "racks"). The town
   has never drawn `H` itself — it takes the engine's drawing — so every clause in the gate that
   asks "did the pack say something?" answers NO, correctly, and the wrong object stands up anyway.
   **No table in this engine records what a world MEANS by a letter it has never drawn.** That is
   not a hole to be plugged with a sixth clause; it is the reason a world has to ask.

   `b` — Meridian's marigold bed, and the instructive one. `b` is not solid and does not stand, so
   it could never REACH a shape; but the ground bake's contact pad
   (`engine/engine3d.js`, grep "THE PAD") asks only whether a glyph HAS a mesh, with no solidity
   test at all. Bind `b` and ten tiles of the town get a soft radial shadow painted on the pavement
   with nothing standing on them — baked into a texture, so a scene-graph dump reports "identical"
   and the street quietly has smudges on it. That is what the gate's solidity clause is for. */
const SHAPEBIND={P:"plant",J:"tree",D:"desk",T:"table",H:"crate",S:"shelving",
                 W:"fridge",V:"stove",K:"counter",A:"draftingTable",
                 F:"picketFence","◺":"wellRail","9":"doghouse"};
/* FIVE OF THOSE THIRTEEN ARE OFFERED AND WILL BE REFUSED ANYWAY, and they stay listed on purpose.
   `D T S K V` all have a `TILESIDE` drawing in this engine, so `wearsArt` is true for them in every
   world and the gate's clause 5 turns them down however loudly a pack asks. Listing them is not a
   lie, it is the clause's test fixture: seventy-one tiles of El Changarrito are exactly this case,
   so the refusal is a measurement that runs on every build rather than a paragraph nobody executes.
   A pack that genuinely wants one writes `const TILEART_MESH={K:o=>SHAPES.counter(o)};` itself and clause 1 lets it
   through. THE ARROW IS MANDATORY AND IS NOT STYLE: `engine/boot.js` is the last script tag in both
   shells and it is what writes THIS file, so a pack is evaluated before `SHAPES` and `TILEMESH`
   exist. `TILEMESH["K"]=SHAPES.counter` throws "TILEMESH is not defined" and
   `TILEART["K"]={mesh:SHAPES.counter}` throws "SHAPES is not defined" — both were documented here
   and in four other places on 2026-09-22 and neither ran. TWO THINGS ARE REQUIRED, not one: the
   table must be DECLARED by this pack (a town that has never written a mesh has no `TILEART_MESH`,
   so `TILEART_MESH["K"]=…` throws too) and the reference must be LATE-BOUND. All three forms were
   planted against El Changarrito on 2026-09-22; only the one above printed OK. A false mechanism
   in the record is the same bug this round was convened to cure, so it is written down twice.
   Clause 1 lets it
   through — which is the point: the trade is available, it just is not made on the pack's behalf. */
