/* EL HORNO — the drawings. Six glyphs, four cameras, ONE decision.

   THE ONE IDEA THIS PACK IS FOR. The tray is drawn three times — from above, from the front, and
   as a shape in 3D — and all three read the same glyph out of the grid. So the sheet's button does
   not "update the picture": it changes what the tile IS (propSet), and the three painters were
   already drawing whatever that is. One decision, four cameras, no synchronising.

   `put(part,u,v,h)` IS THE REUSABLE THING, and it is COPIED here, never imported.
   content/meridian/art.js builds its bakery racks with a closure that takes a part written FLAT —
   u across the pan, v toward the room, h above the sheet — and does the trigonometry for a tilted
   surface. That is a tray, a board, a griddle, a counter, any surface at any angle, for free, and
   it is the most reusable thing that pack produced. A second world may not reach into Meridian's
   files at runtime (docs/story/el-changarrito.md §7½), so the eight-line closure lives here too.
   Copying it is the RULE, not a shortcut: the day Meridian re-tilts its racks, this kitchen does
   not silently re-tilt with them.

   HOW IT IS MADE (.claude/skills/how-its-made): one dough, divided by hand, rounded, proved,
   pasted, baked on one sheet. Variation enters at the step it actually entered and nowhere
   earlier — the three rounds differ in SIZE because a hand divided them; the shell is ONE colour
   across the tray because it came off one batch of paste; exactly one piece is darker because the
   oven has a hot corner and the tray sat in it. Nothing is randomised per frame: the same tray
   looks the same from every camera and after every re-bake. */

const SOLIDX="whfpvcm";      /* the tray in all three states is solid, so a bake can never change what you can walk on */

const TILEMETA={
  w:{lift:13,kind:"wall"},
  h:{lift:12,kind:"appliance"},
  f:{lift:7,kind:"furniture",box:true},
  p:{lift:7,kind:"furniture",box:true},
  v:{lift:7,kind:"furniture",box:true},
  c:{lift:7,kind:"furniture",box:true},
  m:{lift:7,kind:"furniture",box:true}      /* the dough bench: the same bench as the tray's, so the same lift */
};

/* ---- THE PALETTE. A kitchen at nine in the morning: lime-washed wall, scorched brick, seasoned
   steel, and three colours of bread that a person could name out loud. ---- */
const B={
  wall:"#E6DCC8", wallTop:"#F2EADA", wallD:"#C9BCA2",
  brick:"#9C4B32", brickD:"#7A3722", brickL:"#B45F42", iron:"#3A3330", ironL:"#564C46", ember:"#E08A3C",
  leg:"#6B4A2E", top:"#8A6238", topL:"#A67B4C",
  pan:"#3E3A37", panL:"#5E5853",                     /* seasoned steel: dark, with a lit lip */
  cloth:"#D8CDB6",                                    /* the rolled cloth the back of the pan rests on */
  dough:"#EFE3C6", doughD:"#DCCDA9",                  /* proved dough: pale, matte, soft-edged */
  crust:"#D19A4C", crustD:"#A9732E",                  /* baked */
  vanilla:"#F4EAD2", vanillaD:"#DCCBA4",
  choc:"#5E3A2A", chocD:"#3F2418",
  sack:"#D9C9A4", sackD:"#B9A57C", flour:"#F6F1E4"
};

/* ---- LA MASA — THE ONE THING IN THIS WORLD THAT THE GRID CANNOT HOLD ----

   docs.js says it plainly about the tray: the renderers read the grid, so does the card, and never
   a variable beside the grid that could drift out of step with it. That rule stands and this does
   not break it. A GLYPH IS ONE LETTER PER TILE, and what a kneaded dough is, is a SURFACE — which
   patch of it your hand has been over and which it has not. There is no letter for that. So the
   grid keeps everything it can keep (where the dough is, what is on the tray, whether it is baked)
   and the field below keeps the one thing it cannot. It is the only state in this pack outside the
   grid, and anything that can be a glyph must stay a glyph.

   IT IS DELIBERATELY NOT SAVED. Nothing here writes to storage. You come back to a fresh lump,
   which is what a bakery is: docs/GENRE-RULES.md's abundance — there is always more dough — and
   the one honest reason a repeated action can be offered with no reward, because the dough was
   never a resource you were spending.

   SIX BY SIX, and the number is a guess that a render may overturn: it wants to be coarse enough
   that one stroke of a thumb plainly changes something, and fine enough that kneading the left of
   the dough and not the right is visible as exactly that. */
const H_GRID=6;
const H_MASA={cover:new Array(H_GRID*H_GRID).fill(0),push:null};
const hMasaReset=()=>{H_MASA.cover=new Array(H_GRID*H_GRID).fill(0);H_MASA.push=null;};
/* work a patch, and its neighbours a little, because a hand is wider than a square */
const hWork=(c,r,amt)=>{
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    const rr=r+dr,cc=c+dc;if(rr<0||cc<0||rr>=H_GRID||cc>=H_GRID)continue;
    const f=(dr||dc)?0.34:1;const i=rr*H_GRID+cc;
    H_MASA.cover[i]=Math.min(1,H_MASA.cover[i]+amt*f);}
};
const hDev=()=>H_MASA.cover.reduce((a,b)=>a+b,0)/H_MASA.cover.length;
/* HOW EVENLY, not how much. Standard deviation of the field, scaled by the most it can be for that
   mean (sqrt(m(1-m)), at most 0.5) — so 1 means you worked the whole dough and 0 means one corner
   of it is silk and the rest has not been touched. */
const hEven=()=>{const m=hDev();if(m<=0||m>=1)return 1;
  const v=H_MASA.cover.reduce((a,b)=>a+(b-m)*(b-m),0)/H_MASA.cover.length;
  return Math.max(0,Math.min(1,1-Math.sqrt(v)/0.5));};
/* FOUR BANDS, and the boundaries are a guess for a render to overturn — Pili's call, not mine.
   Never a count, never a percentage, never a bar: the dough is the display. */
const hBand=()=>{const d=hDev();return d<0.10?0:d<0.42?1:d<0.80?2:3;};

/* ---- WHERE YOUR HAND WENT, SURVIVING INTO THE BREAD ----
   The three rounds come off three parts of one dough — left, middle, right — so the two columns of
   the field each round was divided out of are the two columns that decide what it does in the oven.
   Knead only the left and the left-hand concha stands up and the other two do not, in every camera,
   for the rest of the session. That is the whole reason this is a surface and not a counter.

   NEITHER END OF IT IS THE CORRECT ONE, and the numbers are chosen so that neither reads as broken.
   A dough that went to the sheet as it was spreads and comes out with an open crumb; a worked one
   holds its gas and stands up close and even. Both are bread somebody sells, and a player who never
   finds the dough bench gets the first one, which is a real bread and not a penalty.

   SO AN UNTOUCHED DOUGH REPRODUCES THE SHIPPED TRAY EXACTLY — hRise(0)=1 and hSpread(0)=1, to the
   byte, verified by running `node test/horno.js` with this whole knead stashed and diffing its four
   numbers against the same run with it in: 224 / 149 / 915 / 49, identical either way. The first
   draft of these two lines put the baseline at 0.94 and 1.06 and moved all four, which is the knead
   charging a player who never finds this bench for a decision it has nothing to do with.
   (An earlier version of this paragraph said that draft took 3D from 76 pixels to 52. Both halves
   were wrong and the way they were wrong is worth the line: 76 came from the iso paragraph below,
   which quotes a run on a different tree, and the real before was 49. A number you did not take
   yourself today is not a measurement, however carefully it is copied.)
   Every effect below is MONOTONE in a field
   that only ever grows, which is how the no-punishment rule (docs/NEW-WORLD.md, grep
   `punishment if it SUBTRACTS`) is kept by construction rather than by care: there is no sequence of
   strokes that can leave this dough worse than you found it. */
const hPieceDev=i=>{let s=0,n=0;const c0=i*2;
  for(let r=0;r<H_GRID;r++)for(let c=c0;c<c0+2;c++){s+=H_MASA.cover[r*H_GRID+c];n++;}
  return n?s/n:0;};
const hRise=d=>1+0.12*d;         /* how tall it stands: the shipped round at 0, 12% taller worked through */
const hSpread=d=>1-0.08*d;       /* and how far it spread on the sheet instead of standing up */

/* ---- THE TRAY. THREE ROUNDS OFF ONE DIVISION. ---- */
const H_TILT=0.30;                /* the pan leans toward the room, as a pan on a rolled cloth does */
const H_U=[-0.21,0,0.21];         /* three across the sheet */
const H_K=[1.00,0.93,1.06];       /* hand-divided: three masses off one dough, and that is the ONLY thing that varies by piece before the oven */
const H_HOT=2;                    /* the oven's hot corner caught the right-hand one. One piece, every camera, for ever */

/* THE PIECES, AS PARTS ON A TILTED SHEET. `put` is the closure above; every kind is written FLAT.
   kind: "p" three plain rounds · "v" vanilla shells · "c" chocolate shells */
const hGoods=(kind,put)=>{
  const dough=kind==="p";
  const cap=kind==="v"?B.vanilla:B.choc;
  H_U.forEach((u,i)=>{
    /* k is the HAND DIVISION — three masses off one dough, and it never changes. ri and sp are the
       KNEAD, read off the two columns of the field this round was divided out of (hPieceDev). Two
       different steps of the same morning, and they are kept as two numbers because they are. */
    const k=H_K[i], hot=i===H_HOT, d=hPieceDev(i), ri=hRise(d), sp=hSpread(d);
    if(dough){
      put({s:"cyl",r:0.098*k*sp,h:0.040,c:B.doughD},u,0,0.020);        /* where it sat down on the sheet and spread — a slack dough spreads further */
      put({s:"sph",r:0.096*k,sy:0.74*ri,c:B.dough},u,0,0.042);         /* the round itself: proved, matte, no mark on it at all */
      return;
    }
    put({s:"cyl",r:0.104*k*sp,h:0.046,c:hot?B.crustD:B.crust},u,0,0.023); /* the baked foot — the one the hot corner caught is darker */
    put({s:"sph",r:0.102*k,sy:0.72*ri,c:cap},u,0,0.047);               /* THE SHELL: one batch of paste, so one colour across the whole tray */
    /* THE SCORE. The paste is cut with the cutter BEFORE the oven and the cuts OPEN as the dough
       rises under it, so what you see is not a line drawn on the shell — it is the crust coming
       through it. That is why the crack is the crust's colour in both flavours: on vanilla it
       reads as a darker line, on chocolate as a pale one. One colour, two readings, both true. */
    [0,1,2,3].forEach(j=>put({s:"box",w:0.168*k,h:0.020,d:0.024,ry:j*Math.PI/4,c:hot?B.crustD:B.crust},u,0,0.088*k*ri));
  });
};

/* THE TRAY AS A SHAPE (the 3D camera). A trestle table, a rolled cloth under the back edge of the
   sheet, the sheet, its lip, and what hGoods said.

   HOW HIGH THE BENCH STANDS, AND THE MEASUREMENT THAT WAS OF THE WRONG THING.
   A previous pass raised this bench from 0.502 to 0.696 on the sentence "what stands above the
   floor is (44/48)*(48/32)*0.92 = 1.265 world units". THAT NUMBER IS THE TOP EDGE OF THE CARD,
   NOT THE TOP OF THE PERSON. A person in 3D is a 36x48 billboard scaled by T3PERSON
   (engine3d.js, grep `p.spr.scale.set`), and the card carries 8px of headroom above her head for
   a speech bubble (engine3d.js, grep `headroom for the bubble`, #57) plus 4px of clearance under
   her feet. Nothing is ever DRAWN in that headroom, so sizing furniture against 1.265 sizes it
   against empty air.
   WHAT A PERSON ACTUALLY IS, measured rather than derived — painted into her own card through
   engine3d.js's own transform and scanned for her topmost opaque row (row 12, with the floor at
   row 44 because the sprite's anchor is 4/48 up): (44-12)/48 * 1.38 = 0.92. A person's drawn
   height IS T3PERSON. The doorway beside her is 1.0. That is the ruler, and test/horno.js now
   paints her and scans her rather than trusting this paragraph.
   HER LANDMARKS, in the same units, off drawPerson's own coordinates (engine.js, grep
   `function drawPerson`): feet 0.09, hip 0.29, shoulder (the top row of her shirt) 0.60, chin
   0.53, the middle of her head 0.72, the top of her head 0.92. She is a cartoon with a large
   head, so human percentages do not transfer and these are the only ones that mean anything here.
   SO: the bench top face sits at 0.502, which is 54.6% of her — the baker's-bench proportion,
   between her hip and her chin, the height you can get your weight over. At 0.696 it stood ABOVE
   HER SHOULDER, the dough on it reached 0.8075 — level with her face — and the pan cut the sign
   on the wall behind it in half. Rendered both ways at 390x844, standing her beside it, before
   and after.
   The FLAT painters below are left alone on purpose: in top and front a tile's height on screen is
   set by which ROW it is in far more than by what is drawn inside it, and both were looked at at
   390x844 and read correctly. Only the 3D camera puts a bench and a person in the same space. */
/* THE BENCH ITSELF, factored out because there are two of them in this kitchen now and a dough
   bench and a tray bench in the same room must be the SAME bench, built by the same carpenter, or
   the room reads as two rooms. Every number below is the measurement in the paragraph above; moving
   any of them moves both benches at once, which is the point of the function. */
const hBench=()=>{const parts=[];
  [[-0.31,-0.21],[0.31,-0.21],[-0.31,0.21],[0.31,0.21]].forEach(([lx,lz])=>
    parts.push({s:"box",x:lx,y:0.235,z:lz,w:0.055,h:0.47,d:0.055,c:B.leg}));      /* four legs */
  parts.push({s:"box",x:0,y:0.30,z:0,w:0.70,h:0.035,d:0.46,c:B.leg});             /* the stretcher between them, low, where a boot goes */
  parts.push({s:"box",x:0,y:0.478,z:0,w:0.82,h:0.048,d:0.58,c:B.top});            /* the bench top: 0.502 at its face, 54.6% of a person — hip-to-chin */
  parts.push({s:"box",x:0,y:0.503,z:0,w:0.82,h:0.006,d:0.58,c:B.topL});           /* floured, so the top face is lighter than the edge */
  return parts;};
const hTrayMesh=kind=>()=>{
  const parts=hBench(),ty=0.50,ca=Math.cos(H_TILT),sa=Math.sin(H_TILT),PW=0.72,PD=0.44;
  parts.push({s:"cyl",r:0.036,h:0.64,rz:Math.PI/2,x:0,y:0.537,z:-0.205,c:B.cloth});/* THE ROLLED CLOTH. This is why the pan is tilted, and it is the only honest way to tilt one */
  /* the closure, copied from content/meridian/art.js's rack and not imported */
  const put=(p,u,v,h)=>parts.push({...p,x:u,y:ty+h*ca-v*sa,z:h*sa+v*ca,rx:(p.rx||0)+H_TILT});
  put({s:"box",w:PW,h:0.018,d:PD,c:B.pan},0,0,0.009);                             /* the sheet, seasoned steel */
  put({s:"box",w:PW,h:0.046,d:0.020,c:B.panL},0,PD/2,0.028);                      /* the front lip, lit */
  put({s:"box",w:PW,h:0.046,d:0.020,c:B.pan},0,-PD/2,0.028);                      /* the back lip, in its own shadow */
  hGoods(kind,put);
  return parts;
};

/* THE TRAY FROM ABOVE. The bench, the sheet foreshortened by its tilt, three pieces. */
const hTrayTop=kind=>rc=>{const{sx,sy}=rc,dough=kind==="p",cap=kind==="v"?B.vanilla:B.choc,capD=kind==="v"?B.vanillaD:B.chocD;
  ctx.fillStyle=B.top;ctx.fillRect(sx+2,sy+3,TS-4,TS-6);
  ctx.fillStyle=B.topL;ctx.fillRect(sx+3,sy+4,TS-6,TS-8);
  ctx.fillStyle=B.cloth;ctx.fillRect(sx+4,sy+5,TS-8,2.4);                               /* the rolled cloth, seen end-on from above */
  ctx.fillStyle=B.pan;ctx.fillRect(sx+4,sy+7,TS-8,17);                                  /* the sheet: shorter than it is, because it leans away */
  ctx.fillStyle=B.panL;ctx.fillRect(sx+4,sy+23.4,TS-8,1.6);                             /* the lip nearest you catches the light */
  ctx.fillStyle="rgba(20,14,8,.28)";ctx.fillRect(sx+4,sy+7,TS-8,1.2);
  [8.4,16,23.6].forEach((cx,i)=>{const k=H_K[i],hot=i===H_HOT,sp=hSpread(hPieceDev(i)),r=4.6*k*sp,cy=sy+15.2;
    if(dough){ctx.fillStyle=B.doughD;ctx.beginPath();ctx.arc(sx+cx,cy+0.5,r,0,7);ctx.fill();
      ctx.fillStyle=B.dough;ctx.beginPath();ctx.arc(sx+cx,cy,r-0.5,0,7);ctx.fill();return;}
    ctx.fillStyle=hot?B.crustD:B.crust;ctx.beginPath();ctx.arc(sx+cx,cy,r,0,7);ctx.fill();          /* the crust, standing out past the shell */
    ctx.fillStyle=cap;ctx.beginPath();ctx.arc(sx+cx,cy,r-1,0,7);ctx.fill();                          /* the shell */
    ctx.strokeStyle=hot?B.crustD:B.crust;ctx.lineWidth=1;                                            /* the cuts, opened: four of them, the crust coming through */
    for(let j=0;j<4;j++){const a=j*Math.PI/4,dx=Math.cos(a)*(r-1),dy=Math.sin(a)*(r-1);
      ctx.beginPath();ctx.moveTo(sx+cx-dx,cy-dy);ctx.lineTo(sx+cx+dx,cy+dy);ctx.stroke();}
    ctx.strokeStyle=capD;ctx.lineWidth=0.7;ctx.beginPath();ctx.arc(sx+cx,cy,r-1.4,0,7);ctx.stroke();});
};

/* THE TRAY FROM THE FRONT. Legs, bench, the sheet's near edge as a band, three domes standing on it. */
const hTraySide=kind=>rc=>{const{sx,sy}=rc,dough=kind==="p",cap=kind==="v"?B.vanilla:B.choc,capD=kind==="v"?B.vanillaD:B.chocD;
  ctx.fillStyle="rgba(15,12,20,.20)";ctx.beginPath();ctx.ellipse(sx+16,sy+30.6,12,2,0,0,7);ctx.fill();
  ctx.fillStyle=B.leg;ctx.fillRect(sx+5,sy+16,2.6,14);ctx.fillRect(sx+TS-7.6,sy+16,2.6,14);ctx.fillRect(sx+6,sy+23,TS-12,1.6);
  ctx.fillStyle=B.top;ctx.fillRect(sx+3,sy+14,TS-6,2.6);
  ctx.fillStyle=B.topL;ctx.fillRect(sx+3,sy+14,TS-6,0.9);
  ctx.fillStyle=B.pan;ctx.fillRect(sx+4.5,sy+10.6,TS-9,3.4);                                  /* the sheet's surface, leaning back away from you */
  ctx.fillStyle=B.panL;ctx.fillRect(sx+4.5,sy+13.2,TS-9,1.3);                                 /* the lip */
  ctx.fillStyle="rgba(15,12,20,.35)";ctx.fillRect(sx+4.5,sy+14.5,TS-9,0.8);
  [8,16,24].forEach((cx,i)=>{const k=H_K[i],hot=i===H_HOT,d=hPieceDev(i),ri=hRise(d),sp=hSpread(d),
                             r=4.2*k*sp,base=sy+11.4;
    if(dough){ctx.fillStyle=B.dough;ctx.beginPath();ctx.ellipse(sx+cx,base,r,r*0.86*ri,0,Math.PI,0);ctx.fill();
      ctx.fillStyle=B.doughD;ctx.beginPath();ctx.ellipse(sx+cx,base,r,r*0.30,0,0,7);ctx.fill();                   /* where it sat down and spread — and the gap between rounds, so you can count three */
      return;}
    ctx.fillStyle=hot?B.crustD:B.crust;ctx.beginPath();ctx.ellipse(sx+cx,base,r,r*0.42,0,0,7);ctx.fill();          /* the crust foot */
    ctx.fillStyle=cap;ctx.beginPath();ctx.ellipse(sx+cx,base-0.8,r-0.4,r*0.92*ri,0,Math.PI,0);ctx.fill();         /* the shell, a dome — taller off a dough that was worked */
    /* THE CUTS, SEEN FROM THE FRONT. They were three near-vertical strokes and they read as bars
       across the loaf; a concha's cuts RADIATE from the top of the shell, so from the front they
       fan. Drawn from the apex outward and stopped short of the foot, which is what a cut that
       opened as the dough rose actually looks like from the side of the tray. */
    ctx.strokeStyle=hot?B.crustD:B.crust;ctx.lineWidth=0.9;ctx.lineCap="round";
    [-1,-0.38,0.38,1].forEach(o=>{ctx.beginPath();
      ctx.moveTo(sx+cx+o*r*0.20,base-r*0.86*ri);ctx.lineTo(sx+cx+o*r*0.80,base-r*0.16);ctx.stroke();});
    ctx.strokeStyle=capD;ctx.lineWidth=0.7;ctx.beginPath();ctx.moveTo(sx+cx-r+0.6,base-0.8);ctx.lineTo(sx+cx+r-0.6,base-0.8);ctx.stroke();});
};

/* ---- EL HORNO. The room's one other landmark: brick, an arched mouth, an iron door ajar. ---- */
const hOvenMesh=()=>[
  {s:"box",x:0,y:0.42,z:0,w:0.94,h:0.84,d:0.90,c:B.brick},
  {s:"box",x:0,y:0.86,z:0,w:1.00,h:0.06,d:0.96,c:B.brickL},              /* the capping course */
  {s:"box",x:0,y:0.30,z:0.455,w:0.52,h:0.44,d:0.05,c:B.ironL},           /* the door frame */
  {s:"box",x:0,y:0.30,z:0.472,w:0.44,h:0.36,d:0.03,c:B.iron},            /* the door */
  {s:"torus",r:0.22,t:0.035,arc:Math.PI,x:0,y:0.30,z:0.478,c:B.brickD},  /* the arch over the mouth */
  {s:"box",x:0,y:0.17,z:0.492,w:0.30,h:0.05,d:0.02,c:B.ember},           /* the light under the door: the oven is ON, and that is the whole story */
  {s:"cyl",r:0.045,h:0.10,rz:Math.PI/2,x:0,y:0.30,z:0.495,c:B.ironL},    /* the handle */
  {s:"cyl",r:0.10,h:0.34,x:-0.28,y:1.06,z:-0.28,c:B.brickD}              /* the flue */
];
const hOvenTop=rc=>{const{sx,sy}=rc;
  ctx.fillStyle=B.brick;ctx.fillRect(sx,sy,TS,TS);
  ctx.fillStyle=B.brickL;ctx.fillRect(sx+1,sy+1,TS-2,TS-2);
  ctx.fillStyle=B.brickD;for(let r=0;r<4;r++)ctx.fillRect(sx+1,sy+2+r*7.4,TS-2,1);
  ctx.fillStyle=B.iron;ctx.beginPath();ctx.arc(sx+8,sy+8,4.2,0,7);ctx.fill();          /* the flue, from above */
  ctx.fillStyle=B.ironL;ctx.beginPath();ctx.arc(sx+8,sy+8,2.6,0,7);ctx.fill();};
const hOvenSide=rc=>{const{sx,sy}=rc;
  ctx.fillStyle=B.brick;ctx.fillRect(sx+1,sy+5,TS-2,26);
  ctx.fillStyle=B.brickL;ctx.fillRect(sx+0.4,sy+3.4,TS-0.8,2.4);
  ctx.fillStyle=B.brickD;for(let r=0;r<4;r++)ctx.fillRect(sx+1,sy+9+r*5.4,TS-2,0.9);
  ctx.fillStyle=B.ironL;ctx.fillRect(sx+8,sy+13,16,13);
  ctx.fillStyle=B.iron;ctx.fillRect(sx+9.4,sy+14.4,13.2,10.2);
  ctx.fillStyle=B.ember;ctx.fillRect(sx+10,sy+24.8,12,1.6);                            /* the line of fire under the door */
  ctx.fillStyle=B.ironL;ctx.fillRect(sx+14,sy+18.4,4,1.6);
  ctx.fillStyle=B.brickD;ctx.fillRect(sx+3,sy+0,5,4);};                                /* the flue */

/* ---- THE FLOUR BIN. A sack in a wooden bin, open, with a scoop's worth spilled on the rim. ---- */
const hBinMesh=()=>[
  {s:"box",x:0,y:0.16,z:0,w:0.74,h:0.32,d:0.62,c:B.leg},
  {s:"box",x:0,y:0.33,z:0,w:0.78,h:0.04,d:0.66,c:B.top},
  {s:"cyl",rt:0.29,rb:0.24,h:0.40,x:0,y:0.52,z:0,c:B.sack},                            /* the sack, slumped: wider at the mouth than at the foot */
  {s:"cyl",r:0.27,h:0.05,x:0,y:0.71,z:0,c:B.sackD},                                    /* the roll of the folded-down top */
  {s:"sph",r:0.24,sy:0.34,x:0,y:0.73,z:0,c:B.flour},                                   /* what is in it */
  {s:"sph",r:0.10,sy:0.22,x:0.26,y:0.36,z:0.18,c:B.flour}                              /* and what went over the side */
];
const hBinTop=rc=>{const{sx,sy}=rc;
  ctx.fillStyle=B.leg;ctx.fillRect(sx+2,sy+3,TS-4,TS-6);
  ctx.fillStyle=B.sack;ctx.beginPath();ctx.arc(sx+16,sy+16,10,0,7);ctx.fill();
  ctx.fillStyle=B.sackD;ctx.beginPath();ctx.arc(sx+16,sy+16,8.6,0,7);ctx.fill();
  ctx.fillStyle=B.flour;ctx.beginPath();ctx.arc(sx+16,sy+16,7.2,0,7);ctx.fill();
  ctx.fillStyle=B.flour;ctx.beginPath();ctx.ellipse(sx+25,sy+22,3.2,2,0,0,7);ctx.fill();};
const hBinSide=rc=>{const{sx,sy}=rc;
  ctx.fillStyle="rgba(15,12,20,.20)";ctx.beginPath();ctx.ellipse(sx+16,sy+30.4,11,2,0,0,7);ctx.fill();
  ctx.fillStyle=B.leg;ctx.fillRect(sx+5,sy+20,22,10);
  ctx.fillStyle=B.top;ctx.fillRect(sx+4,sy+18.6,24,1.8);
  ctx.fillStyle=B.sack;ctx.beginPath();ctx.moveTo(sx+8,sy+19);ctx.lineTo(sx+24,sy+19);ctx.lineTo(sx+25,sy+8);ctx.lineTo(sx+7,sy+8);ctx.closePath();ctx.fill();
  ctx.fillStyle=B.sackD;ctx.fillRect(sx+6.6,sy+6.6,18.8,2.4);
  ctx.fillStyle=B.flour;ctx.beginPath();ctx.ellipse(sx+16,sy+6.8,8.2,1.8,0,Math.PI,0);ctx.fill();
  ctx.fillStyle=B.flour;ctx.fillRect(sx+24,sy+17.4,4,1.4);};

/* ---- LA MASA ON THE BENCH. One glyph, and it does not try to show development at all. ----
   A tile is ~35 screen pixels and the whole content of a knead is SURFACE — shaggy, smooth, silk.
   There is no version of that which reads at tile size, and the owner has already said so about
   this exact object: "you can barely see what they are since they are so small even at my full
   screen" (docs/ASKS.md, grep `barely see what they are`). So the tile says ONE true thing you can
   read from across the room — there is dough on that bench and it is yours to work — and everything
   the knead actually changes happens in the card, where the same surface is drawn twenty to fifty
   times the area. The lump does slump and stand up with hDev(), because a lump that never changed
   at all would make the tile a lie; you are not meant to be able to grade it from there. */
const hMasaMesh=()=>{const parts=hBench(),d=hDev();
  parts.push({s:"box",x:0,y:0.508,z:0.03,w:0.62,h:0.010,d:0.40,c:B.flour});        /* the floured patch, where a hand has been */
  /* IT HAS TO BE A DIFFERENT OBJECT FROM THE TRAY AT ROOM DISTANCE, not a smaller one. Rendered at
     390x844 from the spawn: at r 0.175 and sy 0.46 the two benches read as the same bench twice, a
     pale slab on each, and a player has no reason to walk to the second one. A MOUND beside a FLAT
     TRAY OF THREE is a silhouette you can tell apart across a nine-tile room, which is all this tile
     is asked to do — everything the knead actually changes is in the card. */
  const ri=0.84+0.40*d;                                                            /* a shaggy lump slumps wide; a worked one stands up round */
  parts.push({s:"sph",r:0.205-0.022*d,sy:0.60*ri,x:-0.03,y:0.516,z:0.02,c:d>0.42?B.dough:B.doughD});
  if(d>0.62)parts.push({s:"cyl",r:0.062,h:0.022,rz:Math.PI/2,x:-0.03,y:0.516+0.112*ri,z:0.02,c:B.doughD}); /* the seam, folded under — only a dough that has been folded has one */
  parts.push({s:"box",x:0.28,y:0.512,z:0.20,w:0.15,h:0.008,d:0.10,ry:0.42,c:B.panL});/* the bench scraper, laid down where she put it */
  parts.push({s:"sph",r:0.055,sy:0.16,x:0.20,y:0.510,z:-0.16,c:B.flour});          /* the little heap she dips into */
  return parts;};
const hMasaTop=rc=>{const{sx,sy}=rc,d=hDev();
  ctx.fillStyle=B.top;ctx.fillRect(sx+2,sy+3,TS-4,TS-6);
  ctx.fillStyle=B.topL;ctx.fillRect(sx+3,sy+4,TS-6,TS-8);
  ctx.fillStyle=B.flour;ctx.fillRect(sx+5,sy+7,TS-10,TS-14);                       /* the floured patch */
  ctx.fillStyle=B.doughD;ctx.beginPath();ctx.ellipse(sx+14.5,sy+17,7.4-0.6*d,6.4,0,0,7);ctx.fill();
  ctx.fillStyle=d>0.42?B.dough:B.doughD;ctx.beginPath();ctx.ellipse(sx+14.5,sy+16.4,6.6-0.6*d,5.6,0,0,7);ctx.fill();
  ctx.fillStyle=B.panL;ctx.fillRect(sx+23,sy+22,6,3.4);                            /* the scraper */
  ctx.fillStyle=B.flour;ctx.beginPath();ctx.ellipse(sx+24,sy+9,2.6,2,0,0,7);ctx.fill();};
const hMasaSide=rc=>{const{sx,sy}=rc,d=hDev();
  ctx.fillStyle="rgba(15,12,20,.20)";ctx.beginPath();ctx.ellipse(sx+16,sy+30.6,12,2,0,0,7);ctx.fill();
  ctx.fillStyle=B.leg;ctx.fillRect(sx+5,sy+16,2.6,14);ctx.fillRect(sx+TS-7.6,sy+16,2.6,14);ctx.fillRect(sx+6,sy+23,TS-12,1.6);
  ctx.fillStyle=B.top;ctx.fillRect(sx+3,sy+14,TS-6,2.6);
  ctx.fillStyle=B.topL;ctx.fillRect(sx+3,sy+14,TS-6,0.9);
  ctx.fillStyle=B.flour;ctx.fillRect(sx+5,sy+13.4,TS-10,1.0);
  const r=7.2-0.8*d,h=r*(0.50+0.30*d);                                             /* it stands up as it comes together */
  ctx.fillStyle=B.doughD;ctx.beginPath();ctx.ellipse(sx+14,sy+13.6,r,h*0.34,0,0,7);ctx.fill();
  ctx.fillStyle=d>0.42?B.dough:B.doughD;ctx.beginPath();ctx.ellipse(sx+14,sy+13.4,r-0.5,h,0,Math.PI,0);ctx.fill();
  ctx.fillStyle=B.panL;ctx.fillRect(sx+23.4,sy+12.2,5.4,1.4);};

/* ---- THE CARD'S SURFACE — where the knead actually happens ----

   ONE DRAWING THAT REPAINTS ITSELF, AND IT CARRIES ITS OWN SENTENCE. The state line is painted ON
   the bench rather than set as a paragraph under it, and that is not decoration: the shipped way a
   pack refreshes a card is to call docOpen again, and docOpen re-runs exitFsForCard, which records
   wasFs=false because the first open already stripped .fs — so any in-card refresh permanently drops
   a fullscreen player out of fullscreen (content/horno/docs.js already pays a paragraph for the same
   fault in its other costume). A surface that repaints itself never calls docOpen, so it cannot have
   that bug. One canvas, one truth, and the words change with the dough.

   NOTHING IS RANDOMISED PER FRAME. Every speck and every ragged edge below comes out of hN(), a hash
   of its own index, so the same dough looks the same every time the card is opened and a stroke
   changes exactly what the stroke changed. Same rule as the tray: see HOW IT IS MADE at the top. */
const hN=(i,k)=>{const x=Math.sin(i*127.1+k*311.7)*43758.5453;return x-Math.floor(x);};
const H_CARD={W:0,H:0};                       /* what the card is actually being drawn at, for the handlers */
/* THE LUMP'S PLACE ON THE BENCH, and the bottom quarter is not its to have: the sentence that
   changes as you knead is painted on the canvas (see the paragraph above) and the first render of
   this card put a lump straight through it — the shadow cut off, the last line of dough behind the
   words. So the drawing reserves H*0.26 for the band and sizes the lump into what is left. One
   function, used by the painter, the two handlers and the guard alike, so they cannot disagree. */
const H_BAND=0.26;
const hGeom=()=>{const W=H_CARD.W,av=H_CARD.H*(1-H_BAND);
  /* IT SITS ON THE BENCH; IT IS NOT THE BENCH. Rendered at 390x844 twice: at 0.30/0.44 the lump ran
     off both sides and under the hint, which reads as a texture filling the frame rather than an
     object you could put your hand on. There has to be bench visible all the way round it. */
  const ry=Math.min(W*0.255,av*0.375);
  return {cx:W*0.50,cy:av*0.54,rx:ry*1.40,ry};};
const hCell=p=>[Math.max(0,Math.min(H_GRID-1,Math.floor((p.u+1)/2*H_GRID))),
                Math.max(0,Math.min(H_GRID-1,Math.floor((p.v+1)/2*H_GRID)))];
const hCoverAt=(u,v)=>{const c=hCell({u,v});return H_MASA.cover[c[1]*H_GRID+c[0]];};
/* how far the dough is pushed out of shape at a point, and it RELAXES BACK — which is the one thing
   that makes this a dough and not a paint program. The push decays in the loop; nothing is permanent
   except the working itself. */
const hPushAt=(u,v)=>{const P=H_MASA.push;if(!P)return[0,0];
  const dd=(u-P.u)*(u-P.u)+(v-P.v)*(v-P.v),f=Math.exp(-dd/0.22)*P.t;
  return [P.du*f*0.34,P.dv*f*0.34];};

const H_WORDS={
  en:[["It sticks to everything. Your hand comes away wearing it."],
      ["It has stopped sticking to the bench."],
      ["Smooth, and it springs back when you press it."],
      ["Silk. It will not get any better than this — you can keep going because it is nice, not because it needs it."]],
  es:[["Se pega a todo. La mano sale vestida de masa."],
      ["Ya dejó de pegarse a la mesa."],
      ["Lisa, y regresa cuando la aprietas."],
      ["Seda. Ya no va a mejorar — puedes seguir porque se siente bonito, no porque le falte."]],
  unevenEn:["the left of it has not been touched","the middle of it has not been touched","the right of it has not been touched"],
  unevenEs:["el lado izquierdo no lo has tocado","el centro no lo has tocado","el lado derecho no lo has tocado"],
  hintEn:"Push it with your thumb. Arrow keys work too.",
  hintEs:"Empújala con el pulgar. Las flechas también sirven."
};
/* the least-worked third, named — because "uneven" is useless and "the right side" is a thing you
   can act on. Only said once there is enough difference to see. */
const hThin=()=>{const d=[0,1,2].map(hPieceDev);return d.indexOf(Math.min(...d));};

function hMasaDraw(g,W,H){
  H_CARD.W=W;H_CARD.H=H;
  const es=(typeof lang!=="undefined"&&lang==="es"),G=hGeom(),d=hDev(),ev=hEven(),band=hBand();
  /* ---- the bench, close up: planed wood across, under a dusting of flour ---- */
  /* THE BENCH IS THE BACKGROUND AND HAS TO BEHAVE LIKE ONE. The first version banded it light/dark
     at half a plank each and the wood read as a deckchair — stripes competing with the one object on
     the canvas. Planks now, with a hairline seam and a grain that sits just off the ground colour. */
  g.fillStyle=B.top;g.fillRect(0,0,W,H);
  const plank=Math.max(18,Math.round(H/5));
  for(let y=0;y<H;y+=plank){
    g.fillStyle="rgba(255,244,222,.10)";g.fillRect(0,y,W,Math.round(plank*0.45));
    g.fillStyle="rgba(58,38,18,.22)";g.fillRect(0,y+plank-1,W,1);
    g.fillStyle="rgba(58,38,18,.07)";
    for(let k=0;k<3;k++)g.fillRect(0,y+4+k*Math.round(plank/4),W,1);}
  g.globalAlpha=0.45;g.fillStyle=B.flour;
  for(let i=0;i<60;i++){const x=hN(i,1)*W,y=hN(i,2)*H,r=0.8+hN(i,5)*2.0;
    g.beginPath();g.ellipse(x,y,r*1.7,r,0,0,7);g.fill();}
  g.globalAlpha=1;
  /* ---- the lump. Its edge is ragged where it has not been worked and taut where it has ---- */
  /* LOBES, NOT SPIKES, and this is a render finding and not a preference. The first version put an
     independent hash on each of 72 vertices with an amplitude of 0.095, and a lump of dough came out
     as a cartoon star — every vertex free to jump makes a sawtooth, whatever the amplitude. A dough
     that has not been worked is LOW-frequency: a few big soft bulges where the gluten has not pulled
     it together. So three harmonics with fixed phases, each one fading out as the dough near that
     angle comes in, plus one tiny constant wobble so a silk dough is still hand-made and not a
     circle drawn with a compass. */
  const N=72,pt=[];
  for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,uu=Math.cos(a),vv=Math.sin(a);
    const slack=1-hCoverAt(uu*0.80,vv*0.80);
    const rr=1+slack*(0.090*Math.sin(a*2+0.9)+0.058*Math.sin(a*3-1.7)+0.034*Math.sin(a*5+2.4))
              +0.016*Math.sin(a*4+0.3);
    const o=hPushAt(uu*rr,vv*rr);
    pt.push([G.cx+(uu*rr+o[0])*G.rx,G.cy+(vv*rr+o[1])*G.ry]);}
  const path=()=>{g.beginPath();pt.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();};
  g.fillStyle="rgba(40,26,12,.22)";                                     /* it sits on the bench, so it casts */
  g.beginPath();g.ellipse(G.cx+G.rx*0.05,G.cy+G.ry*0.86,G.rx*0.94,G.ry*0.22,0,0,7);g.fill();
  path();g.fillStyle="#D5C49C";g.fill();          /* a slack dough is duller and greyer than a worked one; B.doughD was too near the silk */
  g.save();path();g.clip();
  /* WHERE YOUR HAND WENT. One soft patch per cell, alpha from how much that patch has been worked,
     so the smoothing is the shape of the strokes and not a level on a bar. */
  for(let r=0;r<H_GRID;r++)for(let c=0;c<H_GRID;c++){
    const cov=H_MASA.cover[r*H_GRID+c];if(cov<=0.01)continue;
    const u=(c+0.5)/H_GRID*2-1,v=(r+0.5)/H_GRID*2-1,o=hPushAt(u,v);
    const px=G.cx+(u+o[0])*G.rx,py=G.cy+(v+o[1])*G.ry,rad=G.rx*(1.5/H_GRID)*1.9;
    const gr=g.createRadialGradient(px,py,0,px,py,rad);
    gr.addColorStop(0,"rgba(248,240,220,"+(0.92*cov).toFixed(3)+")");
    gr.addColorStop(1,"rgba(248,240,220,0)");
    g.fillStyle=gr;g.beginPath();g.arc(px,py,rad,0,7);g.fill();
  }
  /* ONE SHEEN, OVER THE PART THAT HAS BEEN WORKED — and it is one because the first version put a
     highlight in every worked cell and thirty-six identical ovals on a grid made the dough read as a
     golf ball at silk. Light does not come per cell. It comes from one place, and what moves is
     WHERE the dough is smooth enough to take it: the highlight sits at the centroid of the work, so
     a lump worked down one side shines down that side, which is the whole mechanic in one gradient. */
  let wx=0,wy=0,ww=0;
  for(let r=0;r<H_GRID;r++)for(let c=0;c<H_GRID;c++){const cov=H_MASA.cover[r*H_GRID+c];
    wx+=((c+0.5)/H_GRID*2-1)*cov;wy+=((r+0.5)/H_GRID*2-1)*cov;ww+=cov;}
  if(ww>0.6){const ux=wx/ww,uy=wy/ww,rad=G.rx*(0.42+0.46*Math.min(1,ww/(H_GRID*H_GRID*0.7)));
    const hx=G.cx+(ux-0.26)*G.rx,hy=G.cy+(uy-0.34)*G.ry;
    const sg=g.createRadialGradient(hx,hy,0,hx,hy,rad);
    sg.addColorStop(0,"rgba(255,252,242,"+(0.46*Math.min(1,d*1.6)).toFixed(3)+")");
    sg.addColorStop(0.55,"rgba(255,252,242,"+(0.16*Math.min(1,d*1.6)).toFixed(3)+")");
    sg.addColorStop(1,"rgba(255,252,242,0)");
    g.fillStyle=sg;g.beginPath();g.arc(hx,hy,rad,0,7);g.fill();}
  /* and where it has not: flour still sitting on it in clumps, and the little tears of a shaggy dough */
  for(let r=0;r<H_GRID;r++)for(let c=0;c<H_GRID;c++){
    const cov=H_MASA.cover[r*H_GRID+c];if(cov>0.55)continue;
    const u=(c+0.5)/H_GRID*2-1,v=(r+0.5)/H_GRID*2-1,o=hPushAt(u,v);
    const px=G.cx+(u+o[0])*G.rx,py=G.cy+(v+o[1])*G.ry,k=1-cov/0.55,i=r*H_GRID+c;
    g.globalAlpha=0.55*k;g.fillStyle=B.flour;
    for(let j=0;j<3;j++){const a=hN(i,7+j)*6.283,rr=hN(i,11+j)*G.rx*0.1;
      g.beginPath();g.arc(px+Math.cos(a)*rr,py+Math.sin(a)*rr,1+hN(i,17+j)*2.2,0,7);g.fill();}
    g.globalAlpha=0.30*k;g.fillStyle="#B79C72";
    for(let j=0;j<2;j++){const a=hN(i,23+j)*6.283,rr=hN(i,29+j)*G.rx*0.09;
      g.beginPath();g.ellipse(px+Math.cos(a)*rr,py+Math.sin(a)*rr,2.2,0.9,a,0,7);g.fill();}
    g.globalAlpha=1;
  }
  g.restore();
  g.strokeStyle="rgba(146,112,64,"+(0.26+0.30*(1-d)).toFixed(3)+")";g.lineWidth=1.2;path();g.stroke();
  /* ---- the cursor, for a hand that is a keyboard ---- */
  if(H_MASA.key&&typeof document!=="undefined"&&document.activeElement===g.canvas){
    const u=(H_MASA.key[0]+0.5)/H_GRID*2-1,v=(H_MASA.key[1]+0.5)/H_GRID*2-1;
    g.strokeStyle="#8A4B1E";g.lineWidth=2;g.beginPath();
    g.arc(G.cx+u*G.rx,G.cy+v*G.ry,G.rx*(1.1/H_GRID),0,7);g.stroke();}
  /* ---- the sentence, on the bench where the dough is ---- */
  let line=H_WORDS[es?"es":"en"][band][0];
  if(d>0.18&&ev<0.62)line+=es?" — pero "+H_WORDS.unevenEs[hThin()]+"."
                            :" — but "+H_WORDS.unevenEn[hThin()]+".";
  const wrap=fs=>{g.font="italic "+fs+"px Georgia, 'Times New Roman', serif";
    const rows=[];let cur="";line.split(" ").forEach(w=>{const t=cur?cur+" "+w:w;
      if(g.measureText(t).width>W-26&&cur){rows.push(cur);cur=w;}else cur=t;});
    if(cur)rows.push(cur);return rows;};
  /* THE FONT GIVES WAY, NOT THE BAND. The band is a fixed share of the canvas (hGeom reserves it)
     because the lump is sized against what is left; so a long sentence — the fourth one is long on
     purpose — shrinks its type until it fits rather than growing upward into the dough. */
  let fs=Math.max(11,Math.min(15,Math.round(W*0.041))),rows=wrap(fs);
  while(rows.length>2&&fs>10){fs--;rows=wrap(fs);}
  const bh=Math.max(H*H_BAND,rows.length*(fs*1.30)+fs*0.85);
  g.textBaseline="alphabetic";
  g.fillStyle="rgba(251,243,228,.90)";g.fillRect(0,H-bh,W,bh);
  g.fillStyle="rgba(201,188,162,.9)";g.fillRect(0,H-bh,W,1);
  g.fillStyle="#5A3D20";
  rows.forEach((t,i)=>g.fillText(t,13,H-bh+fs*1.55+i*fs*1.30));
  if(d<0.02){const hs=Math.max(10,Math.round(W*0.031)),txt=es?H_WORDS.hintEs:H_WORDS.hintEn;
    g.font=hs+"px Georgia, serif";const tw=g.measureText(txt).width;
    g.fillStyle="rgba(251,243,228,.88)";
    g.fillRect(9,hs*0.5,tw+16,hs*1.9);                    /* on its own slip of paper, or it is illegible on wood */
    g.fillStyle="#7A5A32";g.fillText(txt,17,hs*1.85);}
}

/* ---- THE HAND. Pointer and keyboard, bound to the canvas the reader just made ----
   Everything here is measured off getBoundingClientRect and NEVER off offsetX/offsetY, because the
   non-wide branch of docRender CSS-scales this canvas (`cv.style.height="auto"`) — so its layout
   box and its backing box are different sizes and offsetX is in the wrong one.
   The listeners die with the canvas: docRender builds a new one on every open (body.innerHTML="")
   and never reuses this one, so nothing accumulates and nothing has to be unbound. */
let hAnim=0;
function hMasaBind(cv,g){
  if(cv.dataset.masa)return;cv.dataset.masa="1";
  const at=e=>{const b=cv.getBoundingClientRect(),G=hGeom();
    if(!b.width||!b.height)return null;
    const x=(e.clientX-b.left)/b.width*H_CARD.W,y=(e.clientY-b.top)/b.height*H_CARD.H;
    return {u:(x-G.cx)/G.rx,v:(y-G.cy)/G.ry};};
  let down=false,last=null;
  const loop=()=>{if(H_MASA.push){H_MASA.push.t*=0.86;if(H_MASA.push.t<0.03)H_MASA.push=null;}
    hMasaDraw(g,H_CARD.W,H_CARD.H);
    if(down||H_MASA.push)requestAnimationFrame(loop);else{hAnim=0;hSettle();}};
  /* START A LOOP WITH requestAnimationFrame AND NEVER WITH A DIRECT CALL: at art() time this canvas
     is not in the document yet (docRender appends it after it hands the pack the context), so a
     synchronous first frame measures an element with no box at all. */
  const wake=()=>{if(!hAnim){hAnim=1;requestAnimationFrame(loop);}};
  const workAt=(p,amt,du,dv)=>{const c=hCell(p);hWork(c[0],c[1],amt);
    H_MASA.push={u:p.u,v:p.v,du:du||0,dv:dv||0,t:1};};
  cv.addEventListener("pointerdown",e=>{const p=at(e);if(!p)return;
    down=true;last=p;try{cv.setPointerCapture(e.pointerId);}catch(x){}
    workAt(p,0.06,0,0.5);e.preventDefault();wake();});
  cv.addEventListener("pointermove",e=>{if(!down)return;const p=at(e);if(!p||!last)return;
    /* WORK DONE IS DISTANCE TRAVELLED, which is what kneading is and is the reason this is a drag.
       A press has a fastest input and any child finds it; a stroke does not have one. */
    const du=p.u-last.u,dv=p.v-last.v,dist=Math.sqrt(du*du+dv*dv);
    if(dist<0.01)return;
    workAt(p,Math.min(0.30,dist*0.55),du/dist,dv/dist);last=p;e.preventDefault();wake();});
  const up=e=>{if(!down)return;down=false;last=null;
    try{cv.releasePointerCapture(e.pointerId);}catch(x){}wake();};
  cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
  /* A HAND THAT IS A KEYBOARD. The engine's `grab` puts this canvas in the tab order; a surface you
     can only reach with a thumb is a surface some people cannot reach at all. */
  cv.addEventListener("keydown",e=>{
    const K={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
    if(!H_MASA.key)H_MASA.key=[Math.floor(H_GRID/2),Math.floor(H_GRID/2)];
    if(K){H_MASA.key=[Math.max(0,Math.min(H_GRID-1,H_MASA.key[0]+K[0])),
                      Math.max(0,Math.min(H_GRID-1,H_MASA.key[1]+K[1]))];
      const u=(H_MASA.key[0]+0.5)/H_GRID*2-1,v=(H_MASA.key[1]+0.5)/H_GRID*2-1;
      hWork(H_MASA.key[0],H_MASA.key[1],0.20);
      H_MASA.push={u,v,du:K[0],dv:K[1],t:1};e.preventDefault();wake();return;}
    if(e.key===" "||e.key==="Enter"){
      hWork(H_MASA.key[0],H_MASA.key[1],0.20);
      const u=(H_MASA.key[0]+0.5)/H_GRID*2-1,v=(H_MASA.key[1]+0.5)/H_GRID*2-1;
      H_MASA.push={u,v,du:0,dv:0.6,t:1};e.preventDefault();wake();}
  });
  cv.addEventListener("blur",()=>hMasaDraw(g,H_CARD.W,H_CARD.H));
  cv.addEventListener("focus",()=>{if(!H_MASA.key)H_MASA.key=[Math.floor(H_GRID/2),Math.floor(H_GRID/2)];
    hMasaDraw(g,H_CARD.W,H_CARD.H);});
}
/* THE TRAY HAS TO HEAR ABOUT IT. In 3D the scene is baked once per build, so a tile whose shape
   changed keeps the old one until something invalidates it — and both the dough AND the three
   rounds on the tray are drawn from this field. Called when the hand comes off, not per frame. */
function hSettle(){try{if(typeof t3Invalidate==="function")t3Invalidate();}catch(e){}}
const hMasaArt=(g,W,H)=>{H_CARD.W=W;H_CARD.H=H;hMasaBind(g.canvas,g);hMasaDraw(g,W,H);};

/* ---- THE WALL. Lime wash over stone: nothing clever, and it should not be. ---- */
const hWallTop=rc=>{const{sx,sy}=rc;
  ctx.fillStyle=B.wall;ctx.fillRect(sx,sy,TS,TS);
  ctx.fillStyle=B.wallTop;ctx.fillRect(sx,sy,TS,6);
  ctx.fillStyle=B.wallD;ctx.fillRect(sx,sy+TS-2,TS,2);};
const hWallSide=rc=>{const{sx,sy}=rc;
  ctx.fillStyle=B.wall;ctx.fillRect(sx,sy,TS,TS);
  ctx.fillStyle=B.wallTop;ctx.fillRect(sx,sy,TS,3);
  ctx.fillStyle=B.wallD;ctx.fillRect(sx,sy+18,TS,1.2);};

/* ---- THE ISOMETRIC CAMERA, AND WHAT IT COST TO FIND OUT ----

   MEASURED, not reasoned. The bake was photographed in all four cameras and diffed against a
   zero control, and the isometric camera came back with EXACTLY ZERO changed pixels while the
   other three moved. (`node test/horno.js` printed top 224, front 149, iso 915 and 3D 49 on
   2026-09-23, before and after the knead landed, on both sides of a stash. The 915 is this
   workaround, and before it that figure was 0. TWO earlier write-ups of this lane are wrong and
   are left here as the receipt they are not: one quoted 825 / 446 / 126 / 0 off a different probe
   on a different tree, and the version of THIS paragraph that replaced it quoted 228 / 155 / 76 /
   915 as "what the shipped guard prints today", which it did not print on the day it was written
   either. A third pass then copied the 76 into a paragraph above as the before-figure of its own
   change. That is three sessions in a row, and the cost each time was a comment that reads like a
   measurement. Numbers in a comment are a receipt: they name the run that produced them, or they
   are decoration that somebody downstream will do arithmetic on.)

   WHY. drawIso's depth pass (engine/engine.js, grep `isoBlock(cx,cy,ISOCOL`) paints every SOLID
   glyph as a coloured slab — `ISOCOL[gch]||ISOCOL[w.rows[y][x]]||C.wall` — and never calls the
   tile's painter. Only a `stand` tile (walkable, `standsUp`) gets its `side` art billboarded
   there. So a bench with bread on it is a grey box in one of the four cameras, and p, v and c all
   resolve to the same `C.wall` fallback, which is why the number is zero and not small.

   AND THE SLOT THAT WAS MEANT TO ANSWER THIS IS WRITE-ONLY. The view registry has an `iso` slot,
   engine.js (grep `TILEART["J"] = { top`) advertises it in its own comment — `TILEART["J"] = { top:fn, side:fn, crown:fn,
   iso:fn }` — engine.js (grep `if(v.iso)TILEISO`) fills TILEISO from it and `tileView` will look it up. **Nothing
   in the engine ever calls tileView(g,"iso").** A grep of engine/ for TILEISO returns the
   declaration, the write and the lookup table, and no reader. A pack can fill that slot today and
   nothing will ever draw it.

   WHAT A PACK CAN ACTUALLY DO, which is this. MAPCOL is a real seam and drawIso merges it into
   ISOCOL (engine.js, grep `ISOCOL`) — so the tray can at least be its own colour there, and a DIFFERENT
   colour per state, which is enough for the decision to read in all four cameras even where the
   shape cannot. It is a colour where the other three cameras get an object, and that is the
   honest description of it. The same table also colours the map (engine.js, grep `ISOCOL` again, in the map painter), so this is not
   a hack bolted on for one camera. */
const MAPCOL={
  w:B.wall, h:B.brick, f:B.sack,
  m:B.flour,        /* the floured bench, in the one camera that draws no object */
  p:B.dough,        /* pale: proved and plain */
  v:B.crust,        /* gold */
  c:B.choc          /* brown */
};

const TILEART={
  w:{top:hWallTop,side:hWallSide},
  h:{top:hOvenTop,side:hOvenSide,mesh:hOvenMesh},
  f:{top:hBinTop,side:hBinSide,mesh:hBinMesh},
  p:{top:hTrayTop("p"),side:hTraySide("p"),mesh:hTrayMesh("p")},
  v:{top:hTrayTop("v"),side:hTraySide("v"),mesh:hTrayMesh("v")},
  c:{top:hTrayTop("c"),side:hTraySide("c"),mesh:hTrayMesh("c")},
  m:{top:hMasaTop,side:hMasaSide,mesh:hMasaMesh}
};
