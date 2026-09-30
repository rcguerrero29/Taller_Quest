/* Meridian Quest — camera #4: true 3D (the HD-2D school, IDEAS §14).
   The world model never changed. This file is one more READER of the same glyph
   grids, TILES metadata and actor data: TILEDRAW bakes the textures, drawPerson
   and friends paint the billboards, so every pixel of the 2D art survives in 3D.
   Requires vendor/three.min.js — the only dependency this project has ever taken
   (owner-confirmed 2026-08-31). No WebGL → draw() falls back to the front camera. */
"use strict";
const DAY_AMB=0.66,DAY_SUN=0.42;   /* see the note at the lights: these two numbers are what gives a building faces */
const T3={renderer:null,scene:null,cam:null,group:null,amb:null,sun:null,lastW:0,
  builtKey:"",dirty:0,fail:false,lastH:0,turn:null,yaw:0,pool:[],tintables:[],tint:null,glows:[],K:1}; /* yaw 0 = camera south of the hero, north up — the 2D map's mental model */
function t3Invalidate(){T3.dirty++;} /* growth, theme edits — anything that reshapes tiles */
/* ---------- the error log (#24) ----------
   Four places swallowed a 3D failure and left no trace: a decor artist, an actor artist, init,
   render. Every one now lands here — once per distinct message in the console, the last one
   under the pack's prefix (err3d) so a session can read what the owner's browser saw — and a
   fall-back to the flat camera says so on screen instead of quietly switching. */
T3.errors=[];
function t3Note(where,e){const msg=String((e&&e.message)||e||"?").slice(0,160),key=where+"|"+msg;
  if(!T3.errors.some(x=>x.key===key)){T3.errors.push({key,where,msg,at:Date.now()});if(T3.errors.length>20)T3.errors.shift();if(typeof mqwarn==="function")mqwarn("3d",where+": "+msg,false);else console.warn("3D "+where+": "+msg);}
  try{localStorage.setItem(SK("err3d"),JSON.stringify({where,msg,at:Date.now(),v:typeof GAMEV==="string"?GAMEV:""}));}catch(err){}}
function t3Fell(){if(T3.said)return;T3.said=true;const last=T3.errors[T3.errors.length-1];
  if(typeof mqwarn==="function")mqwarn("3d","fell to the flat camera"+(last?" — "+last.where+": "+last.msg:""),true); /* critical: the camera the game boots into could not draw (#8) */
  /* and ACTUALLY fall. draw() already paints the front profile when 3D cannot draw — but camSet is
     the only thing that ever shows the flat canvas, and nothing on this path called it. Measured on
     both shells: the fallback painted a full picture into a canvas still marked hidden while the
     dead 3D canvas stayed on screen, under a message telling the player they were looking at the
     flat camera. The drawing was never the broken part; being seen was. Both packs boot into 3D,
     so this is the camera nearly every player starts in.
     The camera is taken from what the PACK declared (CAMS), never assumed: a game that ships only
     3D has nothing to fall back to and is told that, instead of being promised a view it does not
     have. */
  const CS=((typeof CAMS!=="undefined"&&Array.isArray(CAMS))?CAMS:[]).filter(c=>c!=="3d");
  /* prefer "front": draw() already paints the front profile on the frame 3D fails (engine.js:1605),
     so settling there means the picture the player is shown and the camera the buttons claim are
     the same one. Any other flat camera the pack has will do if it has no front. */
  const flat=CS.indexOf("front")>=0?"front":CS[0];
  if(flat&&typeof camSet==="function"){try{camSet(flat);}catch(err){}}
  const es=typeof lang!=="undefined"&&lang==="es";
  const head=flat?(es?"El 3D no pudo dibujar — cámara plana. ":"3D could not draw — flat camera instead. ")
                 :(es?"El 3D no pudo dibujar y este juego no tiene otra cámara. ":"3D could not draw, and this game has no other camera. ");
  try{toast(head+(last?last.where+": "+last.msg:""),5200);}catch(err){}}
/* ---------- which way is screen-right? ----------
   Billboards always show their painted face to the camera, but the painters mirror an
   animal by its WORLD facing (`face` = ±x). Turn the camera to the north stop and a dog
   trotting to world +x is painted facing screen-right while +x is now screen-LEFT — so
   the ball he carries, placed at world +x, sat behind him (a playtest of 2026-09-03: the dog
   was picking up the ball with his butt). Facing is a screen-space fact; derive it from the
   camera stop and the actor's velocity, not from the map. */
const t3Q=()=>((Math.round(T3.yaw/(Math.PI/2))%4)+4)%4;
/* one hex→hex mix, so a value ramp can be written where it is read instead of as six constants */
function t3Mix(a,b,t){const h=c=>parseInt(c,16),A=[1,3,5].map(i=>h(a.slice(i,i+2))),B=[1,3,5].map(i=>h(b.slice(i,i+2)));
  return "rgb("+A.map((v,k)=>Math.round(v+(B[k]-v)*Math.max(0,Math.min(1,t)))).join(",")+")";}
const T3RIGHT=[[1,0],[0,-1],[-1,0],[0,1]]; /* screen-right in world units at stops 0..3: +x, north, -x, south */
function t3ScreenFace(a){
  const q=t3Q(),[rx,rz]=T3RIGHT[q],v=(a.dx||0)*rx+(a.dy||0)*rz;
  if(v)return v>0?1:-1;
  return q===2?-(a.face||1):(a.face||1); /* standing still: mirror only at the opposite stop */
}
function t3ScreenDir(d){let n=(4-t3Q())%4;while(n-->0)d=TURN[d];return d;} /* a world direction as the camera sees it */
/* THE BLUR (IDEAS §15.1, measured): every texture was baked at 32px a tile while the
   renderer output at up to 3x device pixels — a 2.9x–4.0x magnification of the art.
   Raising the output resolution and adding mipmaps (the two earlier fixes) cannot
   sharpen a texture that is being magnified. K is the one factor: bake everything at
   K× and draw through a K× transform, so the 2D artists never know. It follows the
   renderer's real pixel ratio, clamped to what the GPU can hold: the largest world's
   ground is one texture, and it must fit maxTextureSize and a sane texel budget. */
function t3Factor(){
  if(!T3.renderer)return 1;
  let K=Math.min(3,Math.max(1,Math.round(T3.renderer.getPixelRatio()||1)));
  const cap=T3.renderer.capabilities,maxTex=(cap&&cap.maxTextureSize)||2048;
  let maxW=0,maxA=0;Object.values(WORLDS).forEach(w=>{maxW=Math.max(maxW,w.W*32,w.H*32);maxA=Math.max(maxA,w.W*w.H*1024);});
  while(K>1&&(maxW*K>maxTex||maxA*K*K>6e6))K--; /* 6M texels ≈ 24MB RGBA before mipmaps */
  return K;
}
function t3CheckK(){ /* a DPR change (fullscreen, a window dragged between monitors) re-bakes */
  const K=t3Factor();
  if(K===T3.K)return;
  T3.K=K;T3.dirty++;
  if(T3.canopyTex){T3.canopyTex.dispose();T3.canopyTex=null;}
  /* 48, not 40: t3Sprite bakes these 36×48 (8px of headroom for the bubble, #57) and every
     artist paints through a transform that assumes it. A DPR change — fullscreen, a window
     dragged to a second monitor — re-cut them 40 tall, which threw away the bottom rows and
     then stretched what was left over the sprite's full height. Every person in the world went
     soft and short until the next reload. Part of #134. */
  T3.pool.forEach(p=>{p.c.width=36*K;p.c.height=48*K;p.tex.needsUpdate=true;});
}
/* bake a glyph's art through TILEDRAW by borrowing the global ctx.
   raw: fill the base UNtinted — door art paints its own C.doorFrame untinted, and a
   tinted base behind it showed as a 2px theme-coloured border round every 3D door.
   t: a pinned clock for the artist (rc.t). An animated glyph — the door's pulsing
   light — bakes the same frame every build, at its brightest; the pulse itself is
   animated in 3D by t3Glow, not frozen at whatever the bake happened to catch. */
function t3BakeGlyph(g,opaque,base,raw,side,frame,x,y){
  const K=T3.K,c=document.createElement("canvas");c.width=32*K;c.height=32*K;
  const old=ctx;ctx=c.getContext("2d");ctx.setTransform(K,0,0,K,0,0);
  try{
    if(opaque){ctx.fillStyle=raw?(base||C.wall):tc(base||C.wall);ctx.fillRect(0,0,32,32);}
    /* a standing cutout wears its SIDE view (TILESIDE), never its top-down drawing. x,y
       reach the artist so a drawing that varies by tile (a box stacked on odd tiles, a
       coffee machine every third counter tile) varies here too. */
    /* `bake:true` says out loud what the pinned clock only implied: this drawing is being
       TEXTURED onto something standing in 3D, not painted into a 2D camera. A pack that
       draws a thing the 3D scene already builds in geometry — a casa's roof over its door —
       asks here and leaves it out, instead of painting it twice at two different heights. */
    const tf=side?sideArt(g):TILEDRAW[g];if(tf)tf({sx:0,sy:0,x:x|0,y:y|0,t:380*Math.PI/2,bake:true,canopy:()=>{}});
    /* a light frame baked around a door face, so it reads against a dark wall from across
       the room (owner, 2026-09-02: "hard to see some doors") */
    if(frame){ctx.fillStyle=frame;ctx.fillRect(0,0,32,3);ctx.fillRect(0,29,32,3);ctx.fillRect(0,0,3,32);ctx.fillRect(29,0,3,32);}
  }finally{ctx=old;}
  return c;
}
const DOORLIGHT="#E8D6B0"; /* the door frame colour in 3D: warm sand against the dark wall */
/* #134 "things are looking a bit blurry". Measured, not guessed: a 3D shot of the street
   scored by the mean absolute Laplacian of its pixels — edge energy, which is what sharpness
   IS. Baseline 2.26. The mip pyramid was never the blur; the LINEAR blend was. Every texture
   in the scene sampled with a linear filter somewhere: the ground blended between mip levels
   (LinearMipmapLinear), and all 559 standing tiles blended between texels (LinearFilter, no
   pyramid at all). Both smear a pixel grid whose whole point is that it does not smear.
     mips everywhere, linear   1.94–2.13   softer still
     baseline                  2.26
     nearest, no mips anywhere 2.77   sharpest — and it shimmers, nothing damps the distance
     NEAREST MIPMAP NEAREST    2.74   the same crispness WITH the pyramid
   So: nearest between texels AND between mip levels. The pyramid stays and keeps the far half
   from crawling; the blend that softened it is gone. Anisotropy still earns its keep at the
   glancing angles this camera looks down. Raising the bake factor K on top of this bought
   nothing measurable (2.75 at K=3 against 2.77 at K=2), so K is left where it is and the
   memory with it.
   live: a sprite repainted every frame cannot afford a pyramid rebuilt every frame — it gets
   nearest with no mips, which is the crisp end of the trade anyway.
   The pyramid is asked for only under WebGL2. On a WebGL1 fallback a non-power-of-two texture
   with mipmaps renders BLACK, and every texture here is sized to the world, never to a power
   of two — the old ground had that hole open. */
function t3Tex(c,ground,live){const t=new THREE.CanvasTexture(c);
  t.magFilter=THREE.NearestFilter; /* crisp pixels up close */
  t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;
  const cap=T3.renderer&&T3.renderer.capabilities;
  if(!live&&cap&&cap.isWebGL2){
    t.generateMipmaps=true;t.minFilter=THREE.NearestMipmapNearestFilter;
    t.anisotropy=cap.getMaxAnisotropy();
  }
  return t;}
const T3FOV=50;  /* the camera's vertical angle at the game's own 10:8; it only ever widens from here */
function t3Resize(){ /* The 2D canvases render tiny on purpose (pixel art, CSS-stretched with
   image-rendering:pixelated). 3D must NOT — it renders at the element's real on-screen size,
   full device resolution.
   FULLSCREEN (owner, 2026-09-08: "its still blurry in full screen"). This used to take the
   element's WIDTH and derive its height as the game's 10:8, which is right in a window — the
   shell sizes the 3D canvas to match the 2D one — and wrong the moment `.viewport.fs` says
   `height:100% !important`. The buffer then had the game's aspect while the element had the
   screen's, and `object-fit:contain` quietly rescaled the whole render to fit: at 1440x900 a
   2880x2304 buffer was resampled down to 1125x900 before anyone saw it. That is a 0.39x
   resample of every pixel, and it cost more GPU than rendering it right would have.
   A 3D camera has no fixed frame to protect. Measure the box it is actually given and render
   THAT: the aspect follows the screen, contain becomes a no-op, and nothing is resampled. */
  if(!T3.renderer)return;
  const c3=T3.renderer.domElement;
  c3.style.imageRendering="auto";
  const box=c3.getBoundingClientRect();
  const wCss=Math.round(box.width)||c3.clientWidth||document.getElementById("vp").clientWidth||360;
  const hCss=Math.round(box.height)||c3.clientHeight||Math.round(wCss*VH/VW);
  T3.renderer.setPixelRatio(Math.min(3,window.devicePixelRatio||1));
  T3.renderer.setSize(wCss,hCss,false);
  if(T3.cam){T3.cam.aspect=wCss/hCss;
    /* HOLD THE HORIZONTAL FIELD. `fov` is the VERTICAL angle, so a taller, narrower box shows the
       same up-and-down and LESS left-and-right: measured on a phone, giving the world 380px
       instead of 266 cut the visible street from 10.9 tiles across to 7.7. The camera would look
       like it had zoomed in, which is not what anyone asked for. So below the game's own 10:8 the
       vertical angle widens to keep the same width on screen, and the extra height buys extra
       world instead of taking some away. Above 10:8 nothing changes — a wide screen already gains
       width, which is what fullscreen does. Capped: past 78° the edges of the frame start to
       stretch. */
    const ref=VW/VH,asp=wCss/hCss;
    T3.cam.fov=asp<ref?Math.min(78,2*Math.atan(Math.tan(T3FOV*Math.PI/360)*ref/asp)*180/Math.PI):T3FOV;
    T3.cam.updateProjectionMatrix();}
}
function t3Init(){
  const c3=document.getElementById("cv3");
  T3.renderer=new THREE.WebGLRenderer({canvas:c3,antialias:true});
  t3Resize();
  T3.scene=new THREE.Scene();
  T3.scene.background=new THREE.Color(0x241F2E);
  T3.cam=new THREE.PerspectiveCamera(T3FOV,VW/VH,0.1,120);
  /* DAY_AMB/DAY_SUN: with the old 0.95/0.5 the Lambert sum came out top 1.35, east 1.21,
     south 1.10 — all clipped to white — and west and north both exactly 0.95. Every face of
     every building in the city rendered the same value, which is why they read as painted
     flats. 0.66/0.42 lands them at 1.00 / 0.88 / 0.78 / 0.66: a real ladder, nothing clipped,
     and no art touched. Night already had a ladder and is left alone. */
  T3.amb=new THREE.AmbientLight(0xffffff,DAY_AMB);
  T3.sun=new THREE.DirectionalLight(0xfff2dd,DAY_SUN);
  T3.sun.position.set(14,22,8);
  T3.scene.add(T3.amb,T3.sun);
  T3.tint=new THREE.Color(0xffffff);
}
function t3Dispose(obj){
  obj.traverse(o=>{
    if(o.geometry)o.geometry.dispose();
    const ms=Array.isArray(o.material)?o.material:o.material?[o.material]:[];
    ms.forEach(m=>{if(m.map)m.map.dispose();m.dispose();});
  });
}
/* ---------- THE SCENES ARE KEPT (owner, 2026-09-17: "3. ok go for it") ----------
   There was exactly ONE built scene. Walking through a door threw it away and made another, and
   the first frame after that had to upload the new geometry as well as draw it — traced on
   2026-09-17 while building the doorway, a 237ms hole right after the swap, in which the door did
   not open, it vanished. Measured per world: 1.4ms for the smallest room to 18.4 for Calle
   Principal, 111ms for all fifteen. So build each one once and keep it.

   What a built scene OWNS is four things — the group, and the three lists the frame loop walks
   (tintables for the time-of-day wash, glows for the door lights, pinatas for the sway). Parking
   the group without its lists would leave the wash writing into a scene nobody is looking at.

   EVICTION, because a cache with no ceiling is a leak with a nice name. The key carries `T3.dirty`,
   which growth and a theme edit bump — so every entry from a previous `dirty` is stale the moment
   one lands, and those are disposed first. Then LRU down to eight, which is more than the five
   rooms anyone crosses in a minute and less than every world at once. The active group is never
   evicted, whatever the order says. */
const T3CACHE=new Map(), T3CACHE_MAX=8;
function t3Park(e){if(e.grp===T3.group)return;T3.scene.remove(e.grp);t3Dispose(e.grp);}
function t3Trim(){
  const now=String(T3.dirty),stale=[];
  T3CACHE.forEach((e,k)=>{if(k.slice(k.lastIndexOf("|")+1)!==now)stale.push(k);});
  stale.forEach(k=>{const e=T3CACHE.get(k);T3CACHE.delete(k);t3Park(e);});
  while(T3CACHE.size>T3CACHE_MAX){const k=T3CACHE.keys().next().value,e=T3CACHE.get(k);T3CACHE.delete(k);t3Park(e);}}
function t3Reuse(key){
  const e=T3CACHE.get(key);if(!e||!e.grp)return false;
  if(T3.group&&T3.group!==e.grp)T3.scene.remove(T3.group);
  T3.group=e.grp;T3.tintables=e.tintables;T3.glows=e.glows;T3.pinatas=e.pinatas;
  if(!e.grp.parent)T3.scene.add(e.grp);
  T3.builtKey=key;T3CACHE.delete(key);T3CACHE.set(key,e);   /* re-inserting is the LRU touch: a Map keeps insertion order */
  return true;}
/* ---- A MESH FROM PARTS: the `mesh` view (2026-09-21, owner: "i still see squares and not
   polygonal shapes … can we not try this finally?"). A pack answers "what shape is this tile"
   with a LIST OF PRIMITIVES — box, sphere, cylinder, cone and TORUS (`s:"torus"`, with `t` for the
   tube and `arc` for a part-ring: an arch, a ring of a stove, the bones on a pan de muerto; the
   fifth has been implemented four lines below since the day this shipped and this sentence said
   four until 2026-09-22) — each with a place, a size and a
   colour, in tile units with y up from the floor and the tile's centre at (0,0). The engine
   merges them into ONE mesh per tile with vertex colours, so a bed of six marigolds costs one
   draw call and not fifteen. Nothing here names a glyph or a colour: a pack that says nothing
   gets the box or the billboard it always got, so the town is untouched. Segment counts are low
   on purpose — this is a pixel world, and a ten-sided pot reads as made, not as smooth. The
   rotation order is yaw-first-in-the-world (YXZ), so a part can lean (rz) and the whole thing
   can still be turned to face a door (ry). The 3D-realism audit (#39) counts nothing here as
   flat, which is the point. */
const meshGeo={};
const t3Prim=p=>{const s=p.s||"box",n=v=>v===undefined?"":+v;
  const key=s+"|"+[p.w,p.h,p.d,p.r,p.rt,p.rb,p.t,p.arc].map(n).join("|");
  if(meshGeo[key])return meshGeo[key];
  let g;
  if(s==="sph")g=new THREE.SphereGeometry(p.r||0.1,8,6);
  else if(s==="cyl")g=new THREE.CylinderGeometry(p.rt!==undefined?p.rt:(p.r||0.1),p.rb!==undefined?p.rb:(p.r||0.1),p.h||0.1,10);
  else if(s==="cone")g=new THREE.ConeGeometry(p.r||0.1,p.h||0.2,8);
  else if(s==="torus")g=new THREE.TorusGeometry(p.r||0.2,p.t||0.03,6,14,p.arc||Math.PI*2); /* an arch is a torus with an arc, standing in the XY plane */
  else g=new THREE.BoxGeometry(p.w||0.1,p.h||0.1,p.d||0.1);
  return meshGeo[key]=g.toNonIndexed();};
const t3MeshOf=(parts,tag)=>{
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sc=new THREE.Vector3(),tr=new THREE.Vector3(),c=new THREE.Color();
  /* HOW TALL THIS THING IS, and it is the parts that say so (crew iteration 14, la ofrendera).
     `wallH` answers that question for a BOX — a formula over the glyph's declared `lift` — and a
     mesh has never had a lift, so anything set down at `wallH` on a mesh tile is set down at the
     height the tile would have had if it were still a box. Doña Tencha's table is 0.55 tall and
     `wallH("T")` is 0.802: the altar stood 0.29 of a tile up in the air. Measured here because
     every vertex is already being transformed one line below — the top costs one comparison. */
  let top=-Infinity;
  /* AND HOW FAR IT REACHES SIDEWAYS, measured in the same loop for the same reason. `t3Top`
     answers "how tall is the thing standing on this tile"; nothing answered "what does it
     stand OVER". A roof oversails — that is what makes a roof a roof — and the first shaped
     casita carried its roof half a tile across Doña Tencha's front door and swallowed the ❗
     the player presses, because the door marker is lifted to a constant 1.0 chosen against a
     flat lid. Four numbers, three comparisons a vertex, at build time. */
  let sx0=Infinity,sx1=-Infinity,sz0=Infinity,sz1=-Infinity;
  const bake=list=>{const pos=[],nor=[],col=[];
    list.forEach(p=>{
      e.set(p.rx||0,p.ry||0,p.rz||0,"YXZ");q.setFromEuler(e);sc.set(p.sx||1,p.sy||1,p.sz||1);tr.set(p.x||0,p.y||0,p.z||0);
      m4.compose(tr,q,sc);
      const gg=t3Prim(p).clone().applyMatrix4(m4);
      const pa=gg.attributes.position.array,na=gg.attributes.normal.array;
      c.set(tc(p.c||"#888888"));
      for(let i=0;i<pa.length;i+=3){pos.push(pa[i],pa[i+1],pa[i+2]);nor.push(na[i],na[i+1],na[i+2]);col.push(c.r,c.g,c.b);
        if(pa[i+1]>top)top=pa[i+1];
        if(pa[i]<sx0)sx0=pa[i]; if(pa[i]>sx1)sx1=pa[i];
        if(pa[i+2]<sz0)sz0=pa[i+2]; if(pa[i+2]>sz1)sz1=pa[i+2];}
      gg.dispose();});
    const geo=new THREE.BufferGeometry();
    geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));
    geo.setAttribute("normal",new THREE.Float32BufferAttribute(nor,3));
    geo.setAttribute("color",new THREE.Float32BufferAttribute(col,3));
    return geo;};
  /* GLASS (crew iteration 11, la calle): a part with `a:` — an alpha under 1 — is a pane you see through.
     A vertex-coloured Lambert has no per-vertex alpha, so the panes of one tile become a second mesh,
     transparent, drawn without writing depth, hung as a CHILD of the tile's mesh: still one object per tile
     to everything that walks the group, one draw call more only where there is glass. */
  const solid=parts.filter(p=>!(p.a<1)),glass=parts.filter(p=>p.a<1);
  const mat=new THREE.MeshLambertMaterial({vertexColors:true}); /* white × the vertex colour; the tint multiplies it like a texture */
  T3.tintables.push(mat);
  const m=new THREE.Mesh(bake(solid),mat);m.userData=tag;
  if(glass.length){const byA={};glass.forEach(p=>{(byA[p.a]=byA[p.a]||[]).push(p);});
    Object.keys(byA).forEach(a=>{const gm=new THREE.MeshLambertMaterial({vertexColors:true,transparent:true,opacity:+a,depthWrite:false});
      T3.tintables.push(gm);const gmesh=new THREE.Mesh(bake(byA[a]),gm);gmesh.userData={glass:true,a:+a};m.add(gmesh);});}
  m.t3Top=top===-Infinity?0:top; /* the tallest ink in the thing itself, glass included — what anything set on it stands on */
  m.t3Span=top===-Infinity?null:[sx0,sx1,sz0,sz1]; /* and how far out it reaches, in the mesh's own frame */
  return m;};
function t3Build(key){
  if(t3Reuse(key))return;                       /* already standing; walk back into it */
  T3.pinatas=[];
  T3.builtKey=key;
  if(T3.group)T3.scene.remove(T3.group);        /* parked in T3CACHE, not destroyed — t3Trim disposes it when it goes stale or falls off the end */
  T3.tintables=[];T3.glows=[];
  const grp=T3.group=new THREE.Group();
  const w=CW();
  /* the ground: the whole floor pass baked to one texture — checker, speckle,
     walkable art, water. Exactly the pixels the 2D cameras stand on. */
  const K=T3.K,gc=document.createElement("canvas");gc.width=w.W*32*K;gc.height=w.H*32*K;
  const old=ctx;ctx=gc.getContext("2d");ctx.setTransform(K,0,0,K,0,0);
  try{
    for(let y=0;y<w.H;y++)for(let x=0;x<w.W;x++){
      const ch=w.rows[y][x],sx=x*32,sy=y*32;
      {const fp=FLOORC[world];ctx.fillStyle=tc(fp?((x+y)%2?fp[0]:fp[1]):((x+y)%2?C.floor:C.floorAlt));}
      ctx.fillRect(sx,sy,32,32);
      const hsh=(x*374761393+y*668265263+world.charCodeAt(0)*69069)>>>0;
      if((hsh&7)<2){ctx.globalAlpha=0.05;ctx.fillStyle="#000";ctx.fillRect(sx,sy,32,32);ctx.globalAlpha=1;}
      const gch=w.grid[y][x],m=TILES[gch];
      const water=m&&m.kind==="water";
      if(!SOLID.has(gch)||water){
        if(!DOORSET.has(ch)&&!stands(ch)){const tf=TILEDRAW[ch]||(water?TILEDRAW[gch]:null);
          if(tf)tf({sx,sy,x,y,canopy:()=>{}});} /* a `stand` tile is drawn standing, not baked into the floor */
        if(typeof petalSpill==="function")petalSpill(w,x,y,sx,sy); /* petals off the bridge, onto water and floor */
        /* CONTACT SHADOW. Both 2D cameras darken the floor in front of a solid; the 3D ground
           never looked at its neighbours, so every building in the city met the pavement on a
           hard bright line and read as pasted on. Ambient light does not reach into the corner
           where a wall meets the ground — that gradient is most of what says "this thing is
           standing here". Baked into a texture already being built, so it costs no draw call. */
        const dark=(dx,dy)=>{
          const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w.W||ny>=w.H)return;
          if(!SOLID.has(w.grid[ny][nx]))return;
          const D=9;                                   /* how far the darkness reaches from the wall */
          /* run the gradient FROM the shared edge outward, so it is darkest in the corner */
          const ex=dx>0?sx+32:sx, ey=dy>0?sy+32:sy;
          const g2=ctx.createLinearGradient(ex,ey,ex+dx*-D,ey+dy*-D);
          g2.addColorStop(0,"rgba(15,12,20,.26)");g2.addColorStop(1,"rgba(15,12,20,0)");
          ctx.fillStyle=g2;
          ctx.fillRect(dx>0?sx+32-D:sx, dy>0?sy+32-D:sy, dx?D:32, dy?D:32);};
        dark(0,-1);dark(0,1);dark(-1,0);dark(1,0);   /* a wall on any side reaches onto this tile */
      }
      /* THE PAD (Pili, 2026-09-21, crew iteration 11): the gradient above darkened a tile from its solid
         neighbours and never a solid tile's OWN floor, so an object smaller than its tile — a pot, a cone,
         a plant, a shelf, a bed — stood on a bright square with darkness all round it. An object darkens
         the ground it stands on. A soft radial under any tile that carries a `mesh` view, solid or stand:
         hidden under a full-tile box, visible round anything smaller. A RULE: both games, no seam. */
      if(!water&&(typeof tileView==="function")&&(tileView(gch,"mesh")||tileView(ch,"mesh"))){
        const g3=ctx.createRadialGradient(sx+16,sy+16,3,sx+16,sy+16,17);
        g3.addColorStop(0,"rgba(15,12,20,.34)");g3.addColorStop(1,"rgba(15,12,20,0)");
        ctx.fillStyle=g3;ctx.fillRect(sx,sy,32,32);}
      if(wellDepth(w,x,y)>0)ctx.clearRect(sx,sy,32,32); /* the well is a HOLE in the floor: the sunken steps stand in it (#62) */
    }
  }finally{ctx=old;}
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(w.W,w.H),
    new THREE.MeshLambertMaterial({map:t3Tex(gc,true),alphaTest:0.5})); /* alphaTest: the cleared tiles are see-through, the rest untouched */
  ground.rotation.x=-Math.PI/2;ground.position.set(w.W/2,0,w.H/2);ground.userData={ground:true};
  grp.add(ground);
  /* THE APRON. Past the edge of the map the ground simply stopped and the background showed
     through, which reads as the world ending at a cliff. It was always true; giving the world a
     taller frame shows far more of it, so it is worth answering here rather than leaving a new
     hole for the player to find. A dim plane in this world's own floor colour, a hair below the
     ground and well outside it: the city carries on into the dark instead of stopping. Nothing
     stands on it, nothing walks on it — it is scenery for the corner of your eye. */
  /* ---- AND IT IS A FRAME, NOT A SHEET (owner, 2026-09-16, after asking twice) ----
     This plane was `w.W*3+60` by `w.H*3+60`, centred on the world, at y=-0.05 — so as well as
     carrying the city off into the dark it laid a dark lid across THE WHOLE MAP, five hundredths
     of a tile under the floor. Every sunken thing in either game was underneath it: the loft's
     stairwell treads sit at -0.16 to -0.64 and had been invisible since the apron was added, so a
     player looking into the well saw the apron and nothing else. That is the "clearly fucked up
     stairs" — a black rectangle where the stairs are, and no amount of lighting or geometry below
     it could ever have shown, which is what two rounds of re-colouring proved by changing the
     render by zero bytes.
     The comment above always said "well outside it" and the geometry never was. Four strips now,
     one on each side of the world's own footprint, so the apron is a frame with the city in the
     middle of it and nothing of the world is roofed over. */
  {
    const aw=w.W*3+60, ah=w.H*3+60, ox=w.W/2, oz=w.H/2;
    const am=new THREE.MeshBasicMaterial({color:new THREE.Color(tc(C.floor)).multiplyScalar(0.20)});
    const strip=(cw,ch,cx2,cz2)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(cw,ch),am);
      m.rotation.x=-Math.PI/2;m.position.set(cx2,-0.05,cz2);m.userData={apron:true};grp.add(m);};
    const pad=(ah-w.H)/2, padx=(aw-w.W)/2;
    strip(aw, pad, ox, -pad/2);                    /* north of the map */
    strip(aw, pad, ox, w.H+pad/2);                 /* south */
    strip(padx, w.H, -padx/2, oz);                 /* west */
    strip(padx, w.H, w.W+padx/2, oz);              /* east */
  }
  /* the standing world: boxes wear the facade art, everything else is a cutout */
  const faceTex={},flatTex={},wallMat={},boxMat={};
  /* WHAT STANDS ON THIS TILE, AND HOW TALL IT REALLY IS — keyed "x,y", filled as each tile is
     built, read by the season-prop pass below when it sets a thing down on top of one. A mesh
     tile answers with its own parts (`t3Top`); everything else is left out and falls back to
     `wallH`, which is the box formula and is exactly right for a box. */
  const topY={};
  /* WHAT HANGS OVER THIS TILE FROM SOMEWHERE ELSE — keyed "x,y" like topY, and a different
     question. topY asks how tall the thing STANDING here is; coverY asks what reaches ACROSS
     here from the tile next door. Only an oversailing mesh answers, and only for a tile whose
     CENTRE it covers — a 0.07 drip at the edge of a neighbour is not a roof over your head.
     Read by the door marker, which is the one thing in the scene that has to be above
     whatever is above the door. */
  const coverY={};
  grp.userData=grp.userData||{};grp.userData.cover=coverY; /* rides WITH the group, so a world walked back into (t3Reuse, from T3CACHE) still knows its own overhangs */
  const t3Cover=(cx,cz,sp,top)=>{
    for(let tx=Math.ceil(cx+sp[0]-0.5);tx<=Math.floor(cx+sp[1]-0.5);tx++)
      for(let tz=Math.ceil(cz+sp[2]-0.5);tz<=Math.floor(cz+sp[3]-0.5);tz++){
        const k=tx+","+tz;if(!(coverY[k]>=top))coverY[k]=top;}};
  /* Furniture, appliances and anything content marks `box:true` stand as a BOX when the
     pack drew a side view for them: the side art on all four faces (measured to the drawn
     height, so nothing floats), the top-down art on the lid. A cutout showed one face from
     every camera stop — a table looked the same walked around ("most art only have one
     display from any direction", owner 2026-09-03). Round or leggy things with no side view
     stay cutouts; that is the right shape for a plant, a cone, a pile of tires. */
  /* ONE DEFINITION, TWO READERS. This used to spell the test out here, and the gate in engine.js
     spelled its own idea of the same question out there — so the gate could hand a mesh to a
     letter this line was about to wear a drawing on, and nothing could notice. `wearsArt`
     (engine/engine.js, grep "ALREADY WEARING A DRAWING") is now the only copy; `m` stays in the
     signature because the caller has it, and it is the same object `wearsArt` looks up. */
  const t3Boxy=(g,m)=>wearsArt(g);
  const t3BoxMats=(g,x,y)=>{
    const vk=g+"|"+(((x+y)%6)+6)%6;if(boxMat[vk])return boxMat[vk];
    const sc=t3BakeGlyph(g,false,null,false,true,null,x,y);
    const d=sc.getContext("2d").getImageData(0,0,sc.width,sc.height).data;
    let top=sc.height;
    for(let r=0;r<sc.height&&top===sc.height;r++)for(let c2=0;c2<sc.width;c2++)if(d[(r*sc.width+c2)*4+3]>40){top=r;break;}
    const frac=Math.max(0.15,Math.min(1,(sc.height-top)/sc.height)),h=frac*1.05;
    const st=t3Tex(sc);st.repeat.set(1,frac); /* only the drawn rows wrap the box */
    const side=new THREE.MeshLambertMaterial({map:st,transparent:true,alphaTest:0.3});
    const lid=new THREE.MeshLambertMaterial({map:t3Tex(t3BakeGlyph(g,true,roofCol(g),false,false,null,x,y))});
    T3.tintables.push(side,lid);
    return boxMat[vk]={mats:[side,side,lid,side,side,side],h};
  };
  const t3MeshTile=(gch,x,y,cx,cz)=>{ /* true when the pack answered and the mesh stands; false = draw it the old way */
    const mv=(typeof tileView==="function")&&tileView(gch,"mesh");if(!mv)return false;
    let parts;try{parts=typeof mv==="function"?mv({x,y}):mv;}catch(e){t3Note("mesh "+gch,e);return false;}
    if(!Array.isArray(parts)||!parts.length)return false;
    try{const m=t3MeshOf(parts,{mesh:true,g:gch,x,y});m.position.set(cx,0,cz);topY[x+","+y]=m.t3Top;
      if(m.t3Span)t3Cover(cx,cz,m.t3Span,m.t3Top);
      grp.add(m);return true;}
    catch(e){t3Note("mesh "+gch,e);return false;}};
  const baseOf=g=>BASECOL[g]||(typeof MAPCOL!=="undefined"&&MAPCOL[g])||C.wall;
  const wallH=g=>0.55+((TILES[g]||{}).lift|0)*0.042; /* lift 13 ≈ 1.1 units tall */
  /* THE TOP OF WHAT IS ACTUALLY STANDING THERE. Ask the thing; fall back to the box formula only
     when nothing standing on that tile measured itself. `wallH` is a fact about a glyph's `lift`,
     not about a shape, and a season prop set down on a shape needs its feet on the shape. */
  const tileTop=(x,y,g)=>{const t=topY[x+","+y];return t!==undefined?t:wallH(g);};
  const wallMats=g=>wallMat[g]||(wallMat[g]={ /* one material set per glyph, shared by every box of it */
    side:new THREE.MeshLambertMaterial({color:new THREE.Color(shadeHex(baseOf(g),-0.22))}),
    top:new THREE.MeshLambertMaterial({color:new THREE.Color(tc(roofCol(g)))}),
    face:new THREE.MeshLambertMaterial({map:faceTex[g]=faceTex[g]||t3Tex(t3BakeGlyph(g,true,baseOf(g)))})});
  const sol=(ax,ay)=>ax<0||ay<0||ax>=w.W||ay>=w.H||SOLID.has(w.grid[ay][ax]); /* off-map counts as wall */
  for(let y=0;y<w.H;y++)for(let x=0;x<w.W;x++){
    const gch=w.grid[y][x];
    const cx=x+0.5,cz=y+0.5;
    if(DOORSET.has(w.rows[y][x])&&!SOLID.has(gch)){ /* a door stands IN its wall — you walk through it */
      const g=w.rows[y][x];
      flatTex[g]=flatTex[g]||t3Tex(t3BakeGlyph(g,true,C.doorFrame,true,false,DOORLIGHT));
      /* which way the wall runs: walls north and south of the door → the door faces east-west.
         The old plane had no rotation at all, so 6 of HQ's doors stood 90° off their wall. */
      const ns=sol(x,y-1)&&sol(x,y+1)&&!(sol(x-1,y)&&sol(x+1,y));
      /* a thin box, not a plane: edge-on at the two side stops a plane vanished; a slab
         shows its jamb. Art on both broad faces, frame colour on the four edges. */
      const jamb=new THREE.MeshLambertMaterial({color:new THREE.Color(DOORLIGHT)}); /* the jamb is the frame's edge — light, like the frame */
      const art=new THREE.MeshLambertMaterial({map:flatTex[g]});
      const door=new THREE.Mesh(new THREE.BoxGeometry(1,1,0.14),[jamb,jamb,jamb,jamb,art,art]);
      door.position.set(cx,0.5,cz);door.rotation.y=ns?Math.PI/2:0;
      door.userData={door:true,x,y};grp.add(door);
      /* the lintel: the wall beside the door is taller than the door, so without this a
         see-through slot ran along the top of every doorway */
      const nbG=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].map(([ax,ay])=>w.grid[ay]&&w.grid[ay][ax])
        .find(c=>c&&TILES[c]&&(TILES[c].kind==="wall"||TILES[c].kind==="facade"));
      if(nbG&&wallH(nbG)>1){const h=wallH(nbG),wm=wallMats(nbG);
        const lin=new THREE.Mesh(new THREE.BoxGeometry(1,h-1,1),[wm.side,wm.side,wm.top,wm.side,wm.side,wm.side]);
        lin.position.set(cx,(1+h)/2,cz);lin.userData={lintel:true,x,y};grp.add(lin);}
      /* light under the door — the 2D "this one opens" pulse, alive in 3D instead of
         baked at a random brightness */
      const gm=new THREE.MeshBasicMaterial({color:0xFFE9A8,transparent:true,opacity:0.5,depthWrite:false});
      const gl=new THREE.Mesh(new THREE.PlaneGeometry(ns?0.6:1.0,ns?1.0:0.6),gm); /* light spills out of a door — the pool is what you see from across a room */
      gl.rotation.x=-Math.PI/2;gl.position.set(cx,0.012,cz);gl.userData={glow:true,x,y};
      T3.glows.push(gm);grp.add(gl);
      continue;
    }
    if(stands(w.rows[y][x])&&!SOLID.has(gch)){ /* walkable cutouts: agility gear, and the stairs */
      const g=w.rows[y][x];
      if(t3MeshTile(g,x,y,cx,cz))continue;      /* a pack that gave it a shape gets the shape, not a picture */
      flatTex[g]=flatTex[g]||t3Tex(t3BakeGlyph(g,false,null,false,true));
      const s=new THREE.Sprite(new THREE.SpriteMaterial({map:flatTex[g],alphaTest:T3ALPHA}));
      s.center.set(0.5,0.06);s.scale.set(1.05,1.05,1);s.position.set(cx,0,cz);
      s.userData={flat:true,g,x,y}; /* a picture standing in the scene — the 3D-realism audit counts these (#39) */
      T3.tintables.push(s.material);grp.add(s);
      continue;
    }
    const wg=winAt(w,x,y);
    if(wg){ /* a person at work inside this wall: back slab, counter toward the street, roof strip
               over the opening — so she is seen behind her counter, not standing in a hole */
      const h=wallH(wg),{side,top,face}=wallMats(wg);
      const open=[[0,1],[0,-1],[1,0],[-1,0]].find(([dx,dz])=>!sol(x+dx,y+dz))||[0,1]; /* the street side */
      const [dx,dz]=open,ew=dx!==0; /* ew: the opening faces east or west, so the pieces turn */
      /* the pieces are thin and hug the street edge: a deep counter or a roof slab over her
         hid her from the raised camera (checked in shots, 2026-09-06) — the camera looks down,
         so anything above or in front of her must be shallow */
      const piece=(ht,dep,off,yc,tag,front)=>{
        const m=[side,side,top,side,side,side];if(front)m[ew?(dx>0?0:1):(dz>0?4:5)]=front;
        const b=new THREE.Mesh(new THREE.BoxGeometry(ew?dep:1,ht,ew?1:dep),m);
        b.position.set(cx+dx*off,yc,cz+dz*off);b.userData={[tag]:true,g:wg,x,y};grp.add(b);};
      piece(h,0.3,-0.35,h/2,"winBack",face);        /* the back wall: full height, wearing the storefront */
      piece(0.46,0.16,0.42,0.23,"counter");          /* the counter: waist high, at the street edge */
      if(h>1.02)piece(h-1,0.16,0.42,(1+h)/2,"winTop"); /* the roof line, a thin strip over the opening */
      continue;
    }
    { /* #62: a climbing flight's treads are LOW BOXES that rise east, the head the top step, so the
         stair stands and you rise with it (t3Actors lifts anyone on a tread). The loft's well is
         the same flight seen from the top: a hole in the floor (the ground is cleared there) with
         the steps SUNK in it, each a step deeper toward the ▼, so you look down into it and sink
         as you go (owner: "downstairs, not so much. still blocky, squares"). */
      const sr=stairRun(w,x,y),dep=wellDepth(w,x,y),g=w.rows[y][x];
      if((sr&&sr.up)||dep>0){const hh=dep>0?1.2:STAIRH*(sr.i+1); /* a sunken step is a tall box whose lid is below the floor; its sides are the risers you see */
        const tk=g+"|"+x+"|"+y,lid=wallMat[tk]||(wallMat[tk]=new THREE.MeshLambertMaterial({map:t3Tex(t3BakeGlyph(g,true,baseOf(g),false,false,null,x,y))}));
        /* THE WELL HAS TO READ AS STEPS GOING DOWN, NOT AS A BLACK TRENCH (owner, 2026-09-16:
           "i still think the stair railing screenshot i sent is wrong"). The geometry was already
           right — the treads really are sunk, -0.16 to -0.48 — and the LIGHT was the whole fault.
           A riser at #5E5852, in a hole, under a lambert light that is above it, returns almost no
           luma; against a cream floor at ~#E8DFC6 the entire opening came back as one black
           rectangle, and a black rectangle with a fence round it is a wall, which is exactly what
           he said he was seeing. The risers are raised to a value that still reads as "in shadow"
           next to the floor and no longer collapses to nothing, and — because the only light in a
           stairwell comes from the floor you are standing on — EACH STEP IS DARKER THAN THE ONE
           ABOVE IT, so the descent is legible as a descent instead of a uniform slab. */
        const rk=dep>0?("≡well"+dep.toFixed(2)):"≡side";
        const sink=dep>0?Math.min(1,dep/0.8):0;                 /* 0 at the lip, 1 at the bottom */
        const lit=dep>0?t3Mix("#B4AC9C","#4E4A46",sink):"#9F9783";
        /* a sunken riser is a vertical face in a hole: Lambert leaves it at almost nothing for the
           same reason as the shaft, so a well's risers are painted too. A climbing flight's sides
           stay Lambert — they are out in the room, where the light model is doing real work. */
        const rs=wallMat[rk]||(wallMat[rk]=dep>0
          ?new THREE.MeshBasicMaterial({color:new THREE.Color(lit)})
          :new THREE.MeshLambertMaterial({color:new THREE.Color(lit)}));
        const bx=new THREE.Mesh(new THREE.BoxGeometry(1,hh,1),[rs,rs,lid,rs,rs,rs]);
        const top=dep>0?-dep:hh;
        bx.position.set(cx,top-hh/2,cz);bx.userData={tread:true,well:dep>0,g,x,y,h:top};grp.add(bx);
        /* ---- AND THE HOLE NEEDS SIDES (owner, 2026-09-16, twice) ----
           The floor is cleared where a well is (`ctx.clearRect` above), and NOTHING was ever built
           to close the cut. So the opening was a hole onto the void: from the game's own camera the
           steps sit below the lip and are not visible at all, and what a player sees is a black
           rectangle in the floor with a rail round it — which is a walled-off pit, which is exactly
           what he reported and what I twice explained away.
           MEASURED, not guessed: re-colouring the risers changed the render by ZERO bytes, which is
           what proved the steps were never on screen and the fault was the missing shaft.
           So every edge of the cut that does not meet another well tile gets a wall, from the floor
           down to that step. The shaft is lighter at the lip and darker as it goes, because the only
           light in a stairwell falls in from the floor you are standing on. */
        if(dep>0){
          const wellAt=(ax,ay)=>ay>=0&&ay<w.H&&ax>=0&&ax<w.W&&wellDepth(w,ax,ay)>0;
          /* THE SHAFT GOES TO THE BOTTOM, NOT TO THIS STEP.
             MEASURED, after two wrong fixes: a ray fired from the game's own camera through the
             opening hit the fence, then the cleared ground, then the world's black APRON — it
             never touched a shaft wall or a tread. Both were below the sight line. A wall only as
             deep as its own step (0.16 at the shallow end) is a kerb, and the eye goes straight
             over it and out the far side into the void, which is why two rounds of re-colouring
             changed the render by zero bytes.
             A stairwell shaft is ONE box: its walls run from the floor to the deepest point of the
             well, and the steps sit inside it. Then the far wall is what you see when you look in,
             which is what you see looking into a real stairwell from across a room. */
          const deepest=(()=>{let m=dep,seen={},q=[[x,y]];
            while(q.length&&Object.keys(seen).length<64){const[ax,ay]=q.pop(),k=ax+","+ay;
              if(seen[k]||!wellAt(ax,ay))continue;seen[k]=1;
              m=Math.max(m,wellDepth(w,ax,ay));
              q.push([ax+1,ay],[ax-1,ay],[ax,ay+1],[ax,ay-1]);}
            return m;})();
          const sk=("shaft"+deepest.toFixed(2));
          /* UNLIT, and that is the whole point. MEASURED: as a Lambert material the shaft came back
             at luma 45 against a floor at 208 — a vertical plane under a light that is overhead
             receives almost nothing, so every value chosen here was being multiplied away and the
             opening rendered as the same black rectangle it was before the shaft existed. This
             engine paints its light rather than simulating it (every tile's art is already drawn
             lit), so the shaft says what value it is and means it. The ramp IS the lighting: bright
             at the lip where the floor's light falls in, dark at the bottom. */
          const sm=wallMat[sk]||(wallMat[sk]=new THREE.MeshBasicMaterial({
            color:new THREE.Color(t3Mix("#B9AF9B","#4A443D",Math.min(1,deepest/0.9)))}));
          [[0,-1,0,-0.5,0],[0,1,0,0.5,0],[-1,0,-0.5,0,Math.PI/2],[1,0,0.5,0,Math.PI/2]]
            .forEach(([dx,dy,ox,oz,rot])=>{
              if(wellAt(x+dx,y+dy))return;                      /* it opens onto more well: no wall */
              const q=new THREE.Mesh(new THREE.PlaneGeometry(1,deepest),sm);
              q.position.set(cx+ox,-deepest/2,cz+oz);q.rotation.y=rot;
              q.material.side=THREE.DoubleSide;
              q.userData={shaft:true,x,y};grp.add(q);});
          /* and a bottom, or it is still a box with no floor and the apron shows through it */
          if(dep>=deepest-0.001){
            const fm2=wallMat["shaftfloor"]||(wallMat["shaftfloor"]=new THREE.MeshBasicMaterial({color:new THREE.Color("#413C36")}));
            const fl=new THREE.Mesh(new THREE.PlaneGeometry(1,1),fm2);
            fl.rotation.x=-Math.PI/2;fl.position.set(cx,-deepest-0.001,cz);
            fl.userData={shaft:true,x,y};grp.add(fl);}
        }
        continue;} /* the head ▲ is the top step; its portal mark still floats above it */
    }
    if((TILES[gch]||{}).kind==="bridge"){ /* the rainbow bridge (IDEAS §15.4, asked for on
         2026-09-07 as an upgrade): it was two tiles of flat art that read as a smear on the floor. Now a
         plank DECK stands BRIDGEH over the water wearing the six bands on top, with a post-and-bar rail
         on each side of the crossing; whoever crosses stands on the deck (stairLift). The run follows
         the river: water north or south means the bridge runs east-west and the rails stand north and south. */
      const g=gch,tk=g+"|"+x+"|"+y;
      const lid=wallMat[tk]||(wallMat[tk]=new THREE.MeshLambertMaterial({map:t3Tex(t3BakeGlyph(g,true,baseOf(g),false,false,null,x,y))}));
      const pet=typeof petalsOn==="function"&&petalsOn();
      /* in season the deck's SIDES are a petal mass too (Pili: "skip it and you have a marigold rug on a
         lumber-yard box"): one baked strip — the heap's field, petals crowded in the top, sparse and dark
         below, six cut by the top edge so they read as spilling over — one material for every side */
      const plank=pet?(wallMat["^petalside"]||(wallMat["^petalside"]=new THREE.MeshLambertMaterial({map:t3Tex(t3PetalSide())})))
        :(wallMat["^plank"]||(wallMat["^plank"]=new THREE.MeshLambertMaterial({color:new THREE.Color("#8A6F4D")})));
      const rail=pet?(wallMat["^railp"]||(wallMat["^railp"]=new THREE.MeshLambertMaterial({color:new THREE.Color(petalPal()[1])})))
        :(wallMat["^rail"]||(wallMat["^rail"]=new THREE.MeshLambertMaterial({color:new THREE.Color("#6E5538")})));
      /* the arch: this tile's deck sits at its own camber and is laid at its own slope, so the crossing rises
         from bank to crown and falls again instead of lying flat over the river (owner, 2026-09-08) */
      const cam=(typeof bridgeCamber==="function")?bridgeCamber(w,x,y):0,slp=(typeof bridgeSlope==="function")?bridgeSlope(w,x,y):0;
      const wat=(ax,ay)=>ay>=0&&ay<w.H&&ax>=0&&ax<w.W&&(TILES[w.rows[ay][ax]]||{}).kind==="water";
      const ew=wat(x,y-1)||wat(x,y+1)||!(wat(x-1,y)||wat(x+1,y)); /* east-west unless the water runs beside it */
      const deck=new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(1,slp),BRIDGEH,1),[plank,plank,lid,plank,plank,plank]);
      deck.position.set(cx,BRIDGEH/2+cam,cz);
      if(ew)deck.rotation.z=Math.atan2(slp,1);else{deck.rotation.y=Math.PI/2;deck.rotation.z=Math.atan2(slp,1);}
      deck.userData={bridge:true,g,x,y,h:BRIDGEH+cam,arch:cam};grp.add(deck);
      /* one rib under each row of the crossing, following the same curve down to the water */
      const rr=(typeof bridgeRun==="function")?bridgeRun(w,x,y):null;
      if(rr&&rr.i===0){const R=rr.n/2,crown=BRIDGEH+BRIDGE_ARCH;
        const am=wallMat["^arch"]||(wallMat["^arch"]=new THREE.MeshLambertMaterial({color:new THREE.Color(pet?petalPal()[0]:"#6E5538")}));
        const rib=new THREE.Mesh(new THREE.TorusGeometry(R,0.055,6,26,Math.PI),am);
        rib.scale.y=Math.max(0.05,(crown-0.04)/R);
        rib.position.set(ew?cx-0.5+R:cx,0,ew?cz:cz-0.5+R);
        if(!ew)rib.rotation.y=Math.PI/2;
        rib.userData={arch:true,x,y}; /* a rib, not a deck: it carries no lid and nobody stands on it */grp.add(rib);}
      const RH=0.5,PW=0.07;
      const isB=(ax,ay)=>ay>=0&&ay<w.H&&ax>=0&&ax<w.W&&(TILES[w.rows[ay][ax]]||{}).kind==="bridge";
      [-1,1].forEach(sd=>{ /* one rail per OPEN side of the crossing: two posts and a bar; none between two deck tiles (the bridge may be two wide) */
        if(isB(x+(ew?0:sd),y+(ew?sd:0)))return;
        const off=0.5-PW/2;
        [-0.46,0.46].forEach(al=>{const post=new THREE.Mesh(new THREE.BoxGeometry(PW,RH,PW),rail);
          post.position.set(cx+(ew?al:sd*off),BRIDGEH+cam+RH/2+(ew?al:0)*slp,cz+(ew?sd*off:al)); /* the posts ride the arch */
          post.userData={bridgeRail:true,x,y};grp.add(post);});
        const bar=new THREE.Mesh(new THREE.BoxGeometry(ew?1:PW,0.05,ew?PW:1),rail);
        bar.position.set(cx+(ew?0:sd*off),BRIDGEH+cam+RH,cz+(ew?sd*off:0));
        if(ew)bar.rotation.z=Math.atan2(slp,1);
        bar.userData={bridgeRail:true,bar:true,x,y};grp.add(bar);});
      /* THE PACK MAY ADD TO THE DECK (crew iteration 11, la calle): what stands ON a bridge — a string beam
         under each open side, a nosing along the top edge, a heap of petals in season — through the `mesh`
         view under the key "prop:bridge", asked for by kind the way the ofrenda is. ADD, never replace: the
         deck and the rails above are the engine's and test/smoke.js reads them (four decks, the rails on the
         open sides, the camber). The parts are deck-local — x along the crossing, y up from the deck's top,
         z ±0.5 the two sides — and the mesh is laid at the deck's own height and slope. */
      const bm=(typeof tileView==="function")&&tileView("prop:bridge","mesh");
      if(bm){let parts=null;const edges=[-1,1].filter(sd=>!isB(x+(ew?0:sd),y+(ew?sd:0)));
        try{parts=typeof bm==="function"?bm({x,y,ew,cam,slp,h:BRIDGEH,edges,pet}):bm;}catch(e){t3Note("mesh prop:bridge",e);}
        if(Array.isArray(parts)&&parts.length){try{const bmm=t3MeshOf(parts,{bridgeMesh:true,mesh:true,x,y});
          bmm.position.set(cx,BRIDGEH+cam,cz);if(ew)bmm.rotation.z=Math.atan2(slp,1);else{bmm.rotation.y=Math.PI/2;bmm.rotation.z=Math.atan2(slp,1);}
          grp.add(bmm);}catch(e){t3Note("mesh prop:bridge",e);}}}
      /* papel picado (owner, 2026-09-07: "and papel picado"): when the season hands a palette
         through art("papel"), a string is hung ACROSS the crossing on each deck tile, high over
         the head, between two thin poles at the rails — five little cut-paper flags a string,
         both faces coloured, so it reads from every camera stop. Nothing without a season. */
      const pap=art("papelBridge",null)||art("papel",null); /* over the crossing the marigold cut, so it reads as one warm object (Pili) */
      if(pap&&pap.length){
        const PH=1.9,pole=wallMat["^pole"]||(wallMat["^pole"]=new THREE.MeshLambertMaterial({color:new THREE.Color("#5A4330")}));
        const strg=wallMat["^string"]||(wallMat["^string"]=new THREE.MeshBasicMaterial({color:new THREE.Color("#3A2E26")}));
        /* the string runs ALONG the crossing, so the flags face the way you walk and read from the
           default camera stop; a pole stands only where the run ends (the neighbour is not a deck) */
        [-1,1].forEach(sd=>{if(isB(x+(ew?sd:0),y+(ew?0:sd)))return;
          const pl=new THREE.Mesh(new THREE.BoxGeometry(0.05,PH,0.05),pole);
          pl.position.set(cx+(ew?sd*0.48:0),PH/2,cz+(ew?0:sd*0.48));pl.userData={papel:true,pole:true,x,y};grp.add(pl);});
        const st=new THREE.Mesh(new THREE.BoxGeometry(ew?1:0.02,0.02,ew?0.02:1),strg);
        st.position.set(cx,PH,cz);st.userData={papel:true,string:true,x,y,ew};grp.add(st); /* `ew`: which way it runs, for t3Fiesta's end-on rule */
        const fl=t3PapelStrip(pap,1,x+y,0);fl.position.set(cx,PH-0.11,cz);if(!ew)fl.rotation.y=Math.PI/2;
        fl.userData.papel=true;fl.userData.x=x;fl.userData.y=y;fl.userData.ew=ew;grp.add(fl);
      }
      continue;
    }
    if(!SOLID.has(gch))continue;
    const m=TILES[gch]||{lift:7,kind:"prop"},kd=m.kind;
    if(kd==="water")continue; /* painted into the ground */
    if(t3MeshTile(gch,x,y,cx,cz))continue; /* the `mesh` view beats box, billboard and even wall: the pack said what shape it is */
    if(kd==="wall"||kd==="facade"){
      const h=wallH(gch),wm=wallMats(gch),side=wm.side,top=wm.top;
      /* `vary`: the glyph draws itself differently per tile (the stair mass finds its place in
         its run), so its face is baked per tile instead of once per glyph */
      const vk=gch+"|"+x+"|"+y;
      const face=m.vary?(wallMat[vk]||(wallMat[vk]=new THREE.MeshLambertMaterial({map:t3Tex(t3BakeGlyph(gch,true,baseOf(gch),false,false,null,x,y))}))):wm.face;
      /* a wall wears its art on all four sides: it runs either way and is seen from any
         of the four camera stops — with art on ±Z only, every north-south wall in HQ was
         a bare slab. A facade keeps plain ends: those are a building's corners, not its
         front, and the storefront art is drawn for the street side. */
      const box=new THREE.Mesh(new THREE.BoxGeometry(1,h,1),
        kd==="wall"?[face,face,top,side,face,face]:[side,side,top,side,face,face]);
      box.position.set(cx,h/2,cz);box.userData={wall:kd==="wall",g:gch,x,y};grp.add(box);
    }else if(kd==="fence"){
      flatTex[gch]=flatTex[gch]||t3Tex(t3BakeGlyph(gch,false,null,false,true));
      /* a fence panel stands ALONG its run: a north-south run turns across X, a corner gets
         two panels. Every panel used to face south, so a north-south run showed as a row
         of edge-on slats "laying around" (owner, 2026-09-02). */
      const fk=(ax,ay)=>ay>=0&&ay<w.H&&ax>=0&&ax<w.W&&(TILES[w.rows[ay][ax]]||{}).kind==="fence";
      const nsRun=fk(x,y-1)||fk(x,y+1),ewRun=fk(x-1,y)||fk(x+1,y);
      const fm=new THREE.MeshLambertMaterial({map:flatTex[gch],side:THREE.DoubleSide,transparent:true,alphaTest:0.3});
      /* a RAIL beside a well (#62) is not a fence mid-tile: it stands on the LIP of the hole,
         knee-high, turned to face it — a north or south well turns it along X, an east or
         west well across X. Everything else keeps the fence's panel. */
      const wl=(ax,ay)=>ay>=0&&ay<w.H&&ax>=0&&ax<w.W&&wellDepth(w,ax,ay)>0;
      const lip=wl(x,y+1)?[0,0.44,0]:wl(x,y-1)?[0,-0.44,0]:wl(x+1,y)?[0.44,0,Math.PI/2]:wl(x-1,y)?[-0.44,0,Math.PI/2]:null;
      const panel=(rot,ph,ox,oz)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(1,ph),fm);
        p.position.set(cx+ox,ph/2,cz+oz);p.rotation.y=rot;p.userData={fence:true,x,y};grp.add(p);};
      if(lip){panel(lip[2],0.55,lip[0],lip[1]);}
      else{if(nsRun&&!ewRun)panel(Math.PI/2,0.8,0,0);else panel(0,0.8,0,0);
        if(nsRun&&ewRun)panel(Math.PI/2,0.8,0,0);}
    }else if(kd==="tree"){
      const trunk=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.7,0.16),
        new THREE.MeshLambertMaterial({color:0x6E4A2C}));
      trunk.position.set(cx,0.35,cz);grp.add(trunk);
      /* the crown: what stands above this tile. A pack that declares one draws its own tree
         (docs/ARCH-LOG.md A5) — the engine had this hardcoded, green and all, so every game on this
         engine got Meridian's jacaranda or no tree at all. Baked per glyph, because two packs may
         want two different trees. */
      const ownCrown=(typeof tileView==="function")&&tileView(gch,"crown");
      T3.crownTex=T3.crownTex||{};
      if(ownCrown&&!T3.crownTex[gch]){
        const cc=document.createElement("canvas");cc.width=40*K;cc.height=40*K;
        const o2=ctx;ctx=cc.getContext("2d");ctx.setTransform(K,0,0,K,0,0);
        try{ownCrown({sx:0,sy:0,x,y});}catch(e){t3Note("crown "+gch,e);}finally{ctx=o2;}
        T3.crownTex[gch]=t3Tex(cc);
      }
      if(!ownCrown&&!T3.canopyTex){ /* one jacaranda canopy, baked by hand */
        const cc=document.createElement("canvas");cc.width=40*K;cc.height=40*K;
        const g2=cc.getContext("2d");g2.scale(K,K);
        g2.fillStyle="#4E8A58";
        [[11,24,10],[29,24,10],[20,16,12]].forEach(q=>{g2.beginPath();g2.arc(q[0],q[1],q[2],0,7);g2.fill();});
        g2.fillStyle="#639C6C";
        [[16,20,8],[26,22,7]].forEach(q=>{g2.beginPath();g2.arc(q[0],q[1],q[2],0,7);g2.fill();});
        g2.fillStyle=art("bloom","#B08FE0");
        [[10,16],[22,8],[30,15],[16,28],[28,29],[20,20]].forEach(q=>{g2.beginPath();g2.arc(q[0],q[1],2,0,7);g2.fill();});
        if(typeof canopyDress==="function")canopyDress(g2,20,16); /* dressed in season; seasonSet drops the bake */
        T3.canopyTex=t3Tex(cc);
      }
      const cs=new THREE.Sprite(new THREE.SpriteMaterial({map:ownCrown?T3.crownTex[gch]:T3.canopyTex,alphaTest:T3ALPHA}));
      cs.scale.set(1.7,1.7,1);cs.position.set(cx,1.05,cz);
      cs.userData={flat:true,g:gch,x,y,canopy:true}; /* the canopy is a picture on a real trunk (#39) */
      T3.tintables.push(cs.material);grp.add(cs);
    }else if(t3Boxy(gch,m)){
      const b=t3BoxMats(gch,x,y);
      const box=new THREE.Mesh(new THREE.BoxGeometry(0.92,b.h,0.92),b.mats);
      box.position.set(cx,b.h/2,cz);box.userData={box:true,g:gch,x,y};grp.add(box);
    }else{ /* furniture, props, appliances, the doghouse: standing cutouts, drawn for the front.
              One bake per glyph AND per (x+y) mod 6 — enough for any parity an artist uses,
              at most six pictures per glyph — so a drawing that varies by tile still varies. */
      const vk=gch+"|"+(((x+y)%6)+6)%6;
      flatTex[vk]=flatTex[vk]||t3Tex(t3BakeGlyph(gch,false,null,false,true,null,x,y));
      const s=new THREE.Sprite(new THREE.SpriteMaterial({map:flatTex[vk],alphaTest:T3ALPHA}));
      s.center.set(0.5,0.06);s.scale.set(1.05,1.05,1);
      s.position.set(cx,0,cz);
      s.userData={flat:true,g:gch,x,y}; /* a cutout, not a solid — the 3D-realism audit counts these (#39) */
      T3.tintables.push(s.material);grp.add(s);
    }
  }
  /* Decor: the pack's landmarks. A flat thing declared on a SOLID tile is paint — it goes on
     that box's open face as a plane, so a mural stays on its wall from every camera stop.
     A decor on open ground is an object, so it gets a billboard. (Pili's rule: flat on walls,
     billboards for things that stand.) */
  if(typeof DECOS!=="undefined")DECOS.forEach(d=>{
    if(d.world!==world)return;
    const f=(typeof DECODRAW!=="undefined")&&DECODRAW[d.deco];if(!f)return;
    const c=document.createElement("canvas");c.width=32*K;c.height=32*K;
    const o2=ctx;ctx=c.getContext("2d");ctx.setTransform(K,0,0,K,0,0);
    try{f(0,0,d);}catch(e){t3Note("decor "+d.deco,e);}finally{ctx=o2;}
    const tex=t3Tex(c),cx=d.x+0.5,cz=d.y+0.5;
    const onWall=d.x>=0&&d.y>=0&&d.y<w.H&&d.x<w.W&&SOLID.has(w.grid[d.y][d.x]);
    if(onWall){
      const face=[[0,1,0],[0,-1,Math.PI],[1,0,Math.PI/2],[-1,0,-Math.PI/2]]
        .find(([ox,oz])=>{const nx=d.x+ox,ny=d.y+oz;
          return ny>=0&&ny<w.H&&nx>=0&&nx<w.W&&!SOLID.has(w.grid[ny][nx]);});
      if(!face)return;                       /* buried on all four sides: nobody can see it */
      const h=wallH(w.grid[d.y][d.x]);
      const m=new THREE.MeshLambertMaterial({map:tex,transparent:true,alphaTest:0.25,side:THREE.DoubleSide});
      const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.94,0.94),m);
      pl.position.set(cx+face[0]*0.505,Math.min(h-0.5,0.62),cz+face[1]*0.505);
      pl.rotation.y=face[2];
      pl.userData={deco:d.deco,x:d.x,y:d.y};
      T3.tintables.push(m);grp.add(pl);
    }else{
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,alphaTest:T3ALPHA}));
      sp.center.set(0.5,0.06);sp.scale.set(1.05,1.05,1);sp.position.set(cx,0,cz);
      sp.userData={deco:d.deco,x:d.x,y:d.y};
      T3.tintables.push(sp.material);grp.add(sp);
    }
  });

  /* LA FIESTA in 3D: the season's swags strung over the ground at head height and above, five flags a
     tile, poles only where an end stands on open ground (a tree or a facade at the end is what the
     string is tied to); the piñata on its rope, swaying in t3Fiesta. Nothing solid, nothing in a row. */
  if(typeof fiestaSwags==="function"){const pal=art("papel",null);
    if(pal&&pal.length){const PH=1.9,pole=wallMat["^pole"]||(wallMat["^pole"]=new THREE.MeshLambertMaterial({color:new THREE.Color("#5A4330")}));
      const strg=wallMat["^string"]||(wallMat["^string"]=new THREE.MeshBasicMaterial({color:new THREE.Color("#3A2E26")}));
      fiestaSwags(world).forEach(sw=>{const y=sw.from[1],x0=Math.min(sw.from[0],sw.to[0]),x1=Math.max(sw.from[0],sw.to[0]),L=x1-x0+1;
        const st=new THREE.Mesh(new THREE.BoxGeometry(L-0.1,0.02,0.02),strg);st.position.set(x0+L/2,PH,y+0.5);st.userData={swag:true,string:true,y};grp.add(st);
        [x0,x1].forEach(ex=>{const g=w.grid[y]&&w.grid[y][ex],m=g!==undefined&&TILES[g];
          /* tied to what stands there — IF it stands that high. A wall, a facade or a tree can hold a string
             at head height; a knee-high fence or a crate cannot, and the first version skipped the pole for
             any SOLID end, so the park's strings hung in the air above its fence (owner, 2026-09-21: "poles
             with the paper picado"). Tall means kind wall/facade/tree or a declared lift of 9 or more. */
          const tall=!!m&&(m.kind==="wall"||m.kind==="facade"||m.kind==="tree"||(m.lift|0)>=9);
          if(g!==undefined&&SOLID.has(g)&&tall)return;
          const pl=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.045,PH+0.12,8),pole);pl.position.set(ex+0.5,(PH+0.12)/2,y+0.5);pl.userData={swag:true,pole:true,y};grp.add(pl); /* `y`: its row, for t3Fiesta's end-on rule */
          const cap=new THREE.Mesh(new THREE.SphereGeometry(0.06,8,6),pole);cap.position.set(ex+0.5,PH+0.12,y+0.5);cap.userData={swag:true,pole:true,cap:true,y};grp.add(cap);});
        [0,1].forEach(row=>{const fl=t3PapelStrip(pal,L,x0+y,row);fl.position.set(x0+L/2+(row?0.07:0),PH-0.11-row*0.22,y+0.5);fl.userData.swag=true;fl.userData.y=y;grp.add(fl);});
        const st2=new THREE.Mesh(new THREE.BoxGeometry(L-0.1,0.02,0.02),strg);st2.position.set(x0+L/2,PH-0.22,y+0.5);st2.userData={swag:true,string:true,y};grp.add(st2);});
      (typeof fiestaProps==="function"?fiestaProps(world):[]).forEach(p=>{
        const g=w.grid[p.y]&&w.grid[p.y][p.x],up=g!==undefined&&(SOLID.has(g)||((TILES[g]||{}).lift|0)>=5);
        if(p.kind==="ofrenda"){ /* the ofrenda: a tile-wide picture standing where it was set, on a table's top if the tile is one */
          /* ...unless the pack gave it a SHAPE: the `mesh` view under the key "prop:ofrenda" — a season prop is not
             a glyph, so it is asked for by kind, through the same table and the same builder (2026-09-21). */
          const pm=(typeof tileView==="function")&&tileView("prop:ofrenda","mesh");
          if(pm){let parts=null;try{parts=typeof pm==="function"?pm({x:p.x,y:p.y}):pm;}catch(e){t3Note("mesh prop:ofrenda",e);}
            if(Array.isArray(parts)&&parts.length){try{const m=t3MeshOf(parts,{prop:true,ofrenda:true,mesh:true,x:p.x,y:p.y});
              const sc=up?0.8:1;m.scale.set(sc,sc,sc);m.position.set(p.x+0.5,(p.h!==undefined?p.h:(up?tileTop(p.x,p.y,g):stairLift(w,p.x,p.y)))+0.01,p.y+0.5);grp.add(m);return;}
              catch(e){t3Note("mesh prop:ofrenda",e);}}}
          const c=document.createElement("canvas");c.width=32*K;c.height=32*K;const g2=c.getContext("2d");g2.scale(K,K);drawOfrenda(g2,0,0);
          const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t3Tex(c),transparent:true,alphaTest:T3ALPHA}));sp.center.set(0.5,0.02);const sc=up?0.8:1;sp.scale.set(sc,sc,1);
          sp.position.set(p.x+0.5,(p.h!==undefined?p.h:(up?tileTop(p.x,p.y,g):stairLift(w,p.x,p.y)))+0.01,p.y+0.5);sp.userData={prop:true,ofrenda:true,x:p.x,y:p.y};grp.add(sp);return;}
        if(p.kind!=="calaverita")return;
        const SILL_PROUD=0.09;
        const win=typeof propSill==="function"?propSill(world,p):null;
        /* on a sill the candy is cut to the window it stands in (#131) — 7 tile-pixels of sweet in a
           7-pixel pane was the overlap. Off a sill it keeps its full 8. */
        const z=win?win.size:8;
        if(win){ /* THE WHOLE WINDOW is the sprite now, not just the sweet (#131, owner 2026-09-10:
            "skulls are still hidden"). Twice this was answered by resizing the candy and twice he
            came back. The arithmetic says why he was right: the sprite was z/32 world units, so an
            eight-pixel sweet is 0.25 of a unit on a wall about 1.1 high, seen from T3CAMD = 7.4
            units back. Three or four screen pixels of cream in a dark recess. No ratio fixes that.
            A LIT PANE is a big saturated shape at the same distance — it reads the way the papel
            picado reads, which is the thing in the same frame that never had this problem. The
            candy sits in front of the veladora, where it belongs, and is now what you find when you
            walk up rather than what you are asked to spot from across the street. */
          /* THE PANE, byte-for-byte what it was: this sprite has been right since mq-v133 and the
             owner's complaint was never about it. */
          const c=document.createElement("canvas");c.width=win.w*K;c.height=win.h*K;
          const g2=c.getContext("2d");g2.scale(K,K);
          if(typeof drawSillLit==="function")drawSillLit(g2,0,0,win.w,win.h);
          drawCalaverita(g2,(win.w-z)/2,win.h-z,p.foil,z);
          const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t3Tex(c),transparent:true,alphaTest:T3ALPHA}));
          sp.center.set(0.5,0.02);sp.scale.set(win.w/32,win.h/32,1);
          const H=wallH(g),paneBottom=H*(1-win.sill/32)+0.005;
          /* SILL_PROUD: a three.js Sprite is one quad at its ANCHOR's depth, and this one is anchored at its
             bottom — so every pixel above the anchor is drawn at the bottom's depth, where the wall above is
             nearer, and the wall wins. Three-quarters of the pane never reached the screen. Measured 2026-09-14
             (Chema, docs/3D-LOG.md): pane and ledge pushed out together, sweet pixels per skull
             +0.00 → 396 · +0.03 → 832 · +0.06 → 1301 · +0.09 → 1743 · +0.12 → 2066 · +0.18 → 2112 (and by then it
             hangs proud of its recess). The honest shape is the sprite's own height times the camera's pitch; the
             pane here is one fixed height, so it is one number, and the ledge keeps its 0.05 in front of it. */
          sp.position.set(p.x+win.cx/32,paneBottom,p.y+1.03+SILL_PROUD);
          /* ---- AND THE SILL ITSELF, hung under it as a SECOND sprite (mq-v154) ----
             The owner, four times now, most recently 2026-09-12: "another attempt at showing the
             window sills." Read literally, which the three previous attempts did not: there was never
             a sill. `propSill` has always computed a y called `sill` and nothing ever DREW one — the
             candy stood on the bottom edge of a hole in a wall.
             The three answers before this were all the same answer wearing different numbers: 8px of
             sweet, then 5, then 0.85 of the pane, then the whole pane lit. Each was measured and each
             was defensible and after each one he came back, because the missing thing was not a
             dimension. A ledge is a HARD HORIZONTAL EDGE, bright on top, dark underneath, throwing a
             shadow, and wider than the opening — the one kind of shape that survives being three
             screen pixels tall. It is why the papel picado in the same frame never had this problem.
             A second sprite rather than a bigger one, because the pane already worked and the surest
             way to lose it was to rebuild it. Measured before and after, side by side, at the same
             spot with the hero moved out of his own shot. */
          if(typeof drawSillLedge==="function"){
            const LW=sillBoxW(win.w),LH=sillLedgeH();
            /* supersampled 3x. Everything else on this wall is a 32-pixel tile stretched over a
               whole box, so it can afford K; a ledge is FIVE tile-pixels tall and at K it is five
               device pixels, which is not enough to hold a bright band, a dark lip and a shadow.
               The world size is unchanged — only the texture is sharper. */
            const KS=K*3;
            const c2=document.createElement("canvas");c2.width=Math.ceil(LW*KS);c2.height=Math.ceil(LH*KS);
            const g3=c2.getContext("2d");g3.scale(KS,KS);g3.imageSmoothingEnabled=false;drawSillLedge(g3,0,0,win.w);
            /* t3Tex's third argument turns MIPMAPS OFF. With them on, this texture is a three-pixel
               bright band over a three-pixel dark one, and every mip level box-filters the two
               together until the whole ledge is one dark smear — which is exactly what it looked
               like, and which no amount of changing the colours would have fixed. A stripe this thin
               cannot survive being averaged with its own shadow. */
            const le=new THREE.Sprite(new THREE.SpriteMaterial({map:t3Tex(c2,false,true),transparent:true,alphaTest:T3ALPHA}));
            le.center.set(0.5,0.02);le.scale.set(LW/32,LH/32,1);
            /* hung from the pane's own bottom, in WORLD units and not in fractions of the wall — the
               two are different lengths and mixing them is how a ledge ends up a third of a tile out */
            le.position.set(p.x+win.cx/32,paneBottom-LH/32,p.y+1.08+SILL_PROUD);
            le.userData={prop:true,sill:true,ledge:true,x:p.x,y:p.y,win:win.i}; /* NOT calaverita: a ledge is not a sweet, and the guard that counts sweets in 3D said so the moment this landed */grp.add(le);}
          sp.userData={prop:true,calaverita:true,sill:true,x:p.x,y:p.y,win:win.i};grp.add(sp);return;}
        const c=document.createElement("canvas");c.width=z*K;c.height=z*K;const g2=c.getContext("2d");g2.scale(K,K);drawCalaverita(g2,0,0,p.foil,z);
        const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t3Tex(c),transparent:true,alphaTest:T3ALPHA}));sp.center.set(0.5,0.02);sp.scale.set(z/32,z/32,1);
        const h=p.h!==undefined?p.h:(up?tileTop(p.x,p.y,g):stairLift(w,p.x,p.y));
        sp.position.set(p.x+(p.ox===undefined?0.5:p.ox),h+0.01,p.y+(p.oy===undefined?0.5:p.oy));sp.userData={prop:true,calaverita:true,x:p.x,y:p.y};grp.add(sp);});
      fiestaHangs(world).forEach(h=>{if(h.kind!=="pinata")return;
        const c=document.createElement("canvas");c.width=32*K;c.height=32*K;const o2=ctx;ctx=c.getContext("2d");ctx.setTransform(K,0,0,K,0,0);
        try{drawPinata(ctx,0,0,0);}finally{ctx=o2;}
        const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t3Tex(c),transparent:true,alphaTest:T3ALPHA}));sp.center.set(0.5,0.94);sp.scale.set(1,1,1);
        sp.position.set(h.x+0.5,PH+0.02,h.y+0.5);sp.userData={pinata:true,x:h.x,y:h.y};grp.add(sp);T3.pinatas=(T3.pinatas||[]);T3.pinatas.push(sp);});}}
  T3.scene.add(grp);
  T3CACHE.set(key,{grp,tintables:T3.tintables,glows:T3.glows,pinatas:T3.pinatas});
  t3Trim();
}
function t3Trolley(){ /* the tram on the line; it is never a wall — you may stand where it will pass, and it waits.
  The owner, 2026-09-11: "i mentioned at some point having a driver and stuff as well as wheels, we
  want to be realistic, crew!" He was describing it exactly. This was a body box, a roof box and six
  window slabs on the two LONG SIDES ONLY, floating 0.09 above the road on nothing — and the numbers
  say how bad that was in the engine's own units: the roof stood at 0.555, where a DOOR is 1.0 and an
  ordinary prop with no declared lift stands 0.844. A traffic cone was taller than the whole tram,
  and from a quarter turn of the camera it was a bare brown slab.
  So it is a vehicle now: it stands a door tall, its wheels touch the road, it is glazed on all four
  sides, and somebody is driving it. Every part carries userData the suite reads, because a test that
  counts wheels survives the tram being redrawn and a test that counts pixels does not. */
  const L=(typeof troLine==="function")?troLine():null;
  const CARS=(typeof troCars==="function")?troCars(L):1,SPAN=(typeof troSpan==="function")?troSpan(L):TRO_LEN;
  /* A TRAIN IS A NUMBER ON THE LINE, so the car count changes when you walk into another world, and
     this group is built once per page load into T3.scene where t3Invalidate cannot reach it (the
     junta noted exactly that on 2026-09-13). Rebuild when the count changes and only then — a line
     that says nothing about cars never trips it, and Meridian never rebuilds. */
  if(T3.tram&&T3.tramCars!==CARS){T3.scene.remove(T3.tram);T3.tram=null;T3.tramBody=null;T3.tramBodies=null;T3.tramDriver=null;}
  if(!T3.tram){const g=new THREE.Group();T3.tramCars=CARS;
    const DK=new THREE.MeshLambertMaterial({color:new THREE.Color("#8E4230")});
    const BD=new THREE.MeshLambertMaterial({color:new THREE.Color("#B0563A")});
    const H=1.02,FL=0.20;                     /* a door is 1.0; the floor rides above the wheels */
    /* the body stops short of both ends, leaving an open cab under the roof at each. Without that
       gap the driver was sealed INSIDE a solid box: the suite counted him and nobody could see him,
       which is a test passing for a reason that is not the thing it is about. Verified by looking. */
    const CAB=0.15;   /* an open driver's platform, the way an old tram has one — not a hole */
    /* THE BODY MAY BE THE PACK'S (crew iteration 11, la calle): the `mesh` view under "prop:tram" answers
       with the body's parts — skirt, panels, band, glazing, roof and its lip, the pole — in the same tile
       units, +x the direction of travel, y up from the road. The WHEELS and the DRIVER stay the engine's
       whatever the pack says: a merged mesh has one userData and cannot spin a part, and the suite counts
       both nouns. Baked once for travel toward +x; the body flips with the direction each frame (below). */
    const pm=(typeof tileView==="function")&&tileView("prop:tram","mesh");let mbody=null;
    if(pm){let parts=null;try{parts=typeof pm==="function"?pm({len:TRO_LEN,h:H,fl:FL,cab:CAB}):pm;}catch(e){t3Note("mesh prop:tram",e);}
      if(Array.isArray(parts)&&parts.length){try{mbody=t3MeshOf(parts,{tram:true,mesh:true,body:true});}catch(e){t3Note("mesh prop:tram",e);}}}
    const wm=new THREE.MeshLambertMaterial({color:new THREE.Color("#2B2B31")});
    const win=new THREE.MeshLambertMaterial({color:new THREE.Color("#D8E6F0")});
    /* ---- ONE CAR, CARS TIMES — a train of trolleys is trolleys (the owner, 2026-09-22) ----
       Each car is a group of its own at the coupling pitch TRO_LEN+TRO_GAP, holding the same
       assembly the single car has always held: the body (the pack's, or the engine's three boxes),
       four wheels and the glazing. The DRIVER is not in here — there is one of him for the whole
       train and he is in the LEADING car, which swaps ends with the direction, so he hangs on the
       train's own group below. For CARS=1 this loop runs once, the group sits at local x=0, and the
       tram is the object it has always been, part for part. */
    T3.tramBodies=[];
    for(let ci=0;ci<CARS;ci++){
    const g0=new THREE.Group();g0.position.x=(ci-(CARS-1)/2)*(TRO_LEN+TRO_GAP);g0.userData={car:true,i:ci};g.add(g0);
    if(mbody){const mb=ci?mbody.clone():mbody;g0.add(mb);T3.tramBodies.push(mb);}
    else{
    const body=new THREE.Mesh(new THREE.BoxGeometry(TRO_LEN-0.1-CAB*2,H-FL-0.06,0.72),BD);
    body.position.y=FL+(H-FL-0.06)/2;g0.add(body);
    const floor=new THREE.Mesh(new THREE.BoxGeometry(TRO_LEN-0.06,FL+0.10,0.74),DK);
    floor.position.y=(FL+0.10)/2;g0.add(floor);   /* the skirt over the wheels, full length, so the platform has a deck */
    const roof=new THREE.Mesh(new THREE.BoxGeometry(TRO_LEN-0.02,0.06,0.80),DK);
    roof.position.y=H-0.03;g0.add(roof);}
    /* WHEELS — four, on the ground, turned to roll along the line rather than across it */
    [-TRO_LEN/2+0.42,TRO_LEN/2-0.42].forEach(dx=>{[-1,1].forEach(sd=>{
      const w=new THREE.Mesh(new THREE.CylinderGeometry(0.115,0.115,0.07,12),wm);
      w.rotation.x=Math.PI/2;                  /* lay the disc onto its edge, axle across the rails. THAT IS ALL IT NEEDS.
         There was a second line here — `w.rotation.z=Math.PI/2`, commented "… then turn it to face
         along the rails" — and under the default XYZ Euler order it undid the line above it: the
         axle swept (-1,0,0) at 0° to (0,-1,0) at 90° and was never once across the rails. So :639's
         `rotation.y` did not spin a wheel, it TUMBLED a cylinder end over end, and the wheel lifted
         0.080 tiles — half its own 5.5px diameter — off the road twice every turn, at the shipped
         speed, since the day it landed. Measured, not reasoned: 160 changed pixels per frame inside
         a wheel strip whose four wheels total 168 pixels. It repainted itself every frame.
         Two cures were proposed and BOTH were refused by measurement, so do not try them again:
         more segments (12→24) gave 209 px/frame against 203 — it is not an aliasing fault; and
         scaling the visual rotation gave 39.9 against 41.0, no effect, and decouples the wheel from
         the ground it rolls on. docs/3D-LOG.md 2026-09-11. */
      w.position.set(dx,0.115,sd*0.34);w.userData={wheel:true};g0.add(w);});});
    /* GLAZING on all four sides, so a quarter turn still shows a tram and not a brick (the pack's body carries its own) */
    if(!mbody){
    [-0.55,0,0.55].forEach(dx=>{[-1,1].forEach(sd=>{
      const m=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.26,0.02),win);
      m.position.set(dx,0.62,sd*0.37);m.userData={glazing:true};g0.add(m);});});
    [-1,1].forEach(ed=>{const m=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.30,0.50),win);
      m.position.set(ed*(TRO_LEN/2-0.05),0.66,0);m.userData={glazing:true};g0.add(m);});}
    }
    T3.tramBody=T3.tramBodies[0]||null;
    /* THE DRIVER — a head and shoulders at the front window. ONE of him, for the whole train: he
       is at the end the train is travelling toward, and on a set of coupled cars that end is a
       different CAR each way round. A tram has a cab at each end and the driver walks the length of
       it; he never rides in the middle, and there is never a second one. */
    const drv=new THREE.Group();
    const sh=new THREE.Mesh(new THREE.BoxGeometry(0.10,0.16,0.30),new THREE.MeshLambertMaterial({color:new THREE.Color("#3B4A6B")}));
    sh.position.y=0.60;drv.add(sh);
    const hd=new THREE.Mesh(new THREE.BoxGeometry(0.11,0.13,0.14),new THREE.MeshLambertMaterial({color:new THREE.Color("#C08A5E")}));
    hd.position.y=0.755;drv.add(hd);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(0.13,0.05,0.16),DK);
    cap.position.y=0.835;drv.add(cap);
    drv.userData={driver:true};g.add(drv);T3.tramDriver=drv;
    g.userData={tram:true};T3.tram=g;T3.scene.add(g);}
  const on=!!(L&&L.world===world&&typeof TRO!=="undefined"&&TRO.state!=="away");
  T3.tram.visible=on;
  if(on){
    T3.tram.position.set(TRO.x+SPAN/2,0.0,L.row+0.5);
    /* he drives from the leading end of the whole set, whichever way it is going */
    if(T3.tramDriver)T3.tramDriver.position.x=(TRO.dir>0?1:-1)*(SPAN/2-0.16); /* on the platform, not behind a wall */
    (T3.tramBodies||[]).forEach(b=>{b.scale.x=TRO.dir>0?1:-1;});     /* the pack's body was baked for +x: its pole leans back against the travel, so every car turns round with the driver */
    /* and the wheels turn with the distance covered, so it rolls instead of sliding */
    T3.tram.traverse(o=>{if(o.userData&&o.userData.wheel)o.rotation.y=-TRO.x/0.115;});
  }
  /* ---- AND IT GOES TO GLASS WHEN IT IS BETWEEN YOU AND THE CAMERA ----
     The owner, 2026-09-22, choosing between two cures for a person who disappears at his own stop:
     "for the inspector- lets make it seethrough". Yesterday the cure was DEPTH — the car hid your
     legs, honestly, the way a tram does — and honest is not the same as usable: at the stop, in the
     camera both games boot into, the car covered him to the shoulders and at the corner stop it
     covered all of him. So the car takes the treatment #140 already gives a tree: it stays exactly
     where it is, at T3GHOST, drawn AFTER the people and writing no depth, so the pixel holds both
     of them and "he is behind it" is still the honest reading. A tram is the one object in this
     game for which that is not even a convention — it is glazed on four sides, and a person behind
     a real one IS half visible through the windows.
     Materials are shared between the cars (one wheel material, one glazing material, and the pack's
     body is cloned), so the glass copy is made once per PIECE and kept beside the solid one, never
     edited in place — one ghosted wheel would otherwise fog the whole train. t3Reveal does the same
     thing for the same reason. The tram lives in T3.scene and not T3.group, so t3Near never sees it
     and there is no cache key here to move: this runs every frame because the car does. */
  const glass=on&&t3TramNear();
  T3.tram.traverse(o=>{if(!o.material)return;const u=o.userData;
    if(!glass&&!u.solid3)return;                    /* never been glass and is not now: leave it alone */
    if(!u.solid3){u.solid3=o.material;
      const mk=q=>{const c=q.clone();c.transparent=true;c.opacity=T3TRAMGLASS;c.depthWrite=false;return c;};
      u.glass3=Array.isArray(o.material)?o.material.map(mk):mk(o.material);}
    o.material=glass?u.glass3:u.solid3;
    o.renderOrder=glass?1500:0;});}
/* is the car standing between the person you steer and the camera? One ray, the hero's feet, the
   train's own box — so a six-tile set answers for its whole length. Asked here and in t3Actors. */
function t3TramNear(){
  if(!T3.tram||!T3.tram.visible||!T3.cam)return false;
  const from=T3.cam.position,to=new THREE.Vector3(fx+0.5,0.1,fy+0.5),dv=to.clone().sub(from),len=dv.length();
  const hit=new THREE.Ray(from,dv.normalize()).intersectBox(new THREE.Box3().setFromObject(T3.tram),new THREE.Vector3());
  return !!hit&&hit.distanceTo(from)<len;}
function t3Fiesta(){ /* the piñata sways; it is never hit and gives nothing (Nacho's guardrail) */
  (T3.pinatas||[]).forEach(sp=>{if(!sp.parent)return;sp.material.rotation=Math.sin(Date.now()/700+sp.userData.x)*0.08;});
  /* A STRING SEEN END-ON IS NOT A STRING (the owner, 2026-09-21, a frame from a quarter turn on Calle
     Principal: "the skeleton now seems to float in one perspective and with the papel picado, looks like
     its buggy or broken"). A swag hangs ALONG its row at 1.9. Turn the camera a quarter and you look down
     that row: the flags are edge-on and vanish, and the string is a bare dark line from the horizon to the
     foreground, through whoever stands on the row — over his head, between his legs, through his shadow —
     so a person on it reads as hanging from it. Measured at st (5,1): 42 pixels of string inside the
     hero's outline and not one flag. So a string the camera looks along, on the hero's own row, is not
     drawn that frame — it would be a line and nothing else — and the same for the bridge's string, which
     runs the way you cross. Seen across, at the other two stops, nothing changes. The poles are things
     standing on the ground and stay — except a pole on that same line that stands on your tile or
     between you and the camera, which on that line can only be a line through you or a stub under your
     feet (the bridge's near pole crossed the hero's chest after the string had gone; measured, not
     reasoned). A pole behind you on the line stays: your body covers its foot and its top shows over
     your head, which is what a pole behind a person looks like. (The line inspector, crew iteration 12.) */
  if(T3.group){const q=((Math.round(T3.yaw/(Math.PI/2))%4)+4)%4,alongX=(q===1||q===3),row=Math.round(fy),col=Math.round(fx);
    const sx=Math.sin(T3.yaw),cz=Math.cos(T3.yaw),hx=fx+0.5,hz=fy+0.5;
    T3.group.children.forEach(o=>{const u=o.userData;if(!u||!(u.swag||u.papel))return;
      const runsX=u.swag?true:!!u.ew; /* a swag runs along its row; the bridge's string runs the way you cross */
      const onLine=runsX?(alongX&&u.y===row):(!alongX&&u.x===col);
      if(!u.pole){o.visible=!onLine;return;}
      o.visible=!(onLine&&(runsX?(o.position.x-hx)*sx:(o.position.z-hz)*cz)>=-0.01);});}}
/* the petal trail in 3D: a pool of little flat planes, three per drop, lying on the ground where
   somebody walked in season, fading over a minute and a half (owner: "a trail forms behind characters") */
function t3PapelTex(pal,n,seed){ /* a string of n cut-paper flags baked once (Pili): flat colour, a scalloped hem, five punched
  holes you see the sky through — the difference between bunting and papel picado */
  const c=document.createElement("canvas");c.width=n*8;c.height=14;const g=c.getContext("2d");
  g.fillStyle="#3A2E26";g.fillRect(0,0,c.width,1);
  for(let i=0;i<n;i++){const col=pal[(i+seed)%pal.length],x=i*8+1;g.fillStyle=col;g.fillRect(x,1,6,10);
    g.beginPath();g.moveTo(x,11);g.lineTo(x+1.5,13);g.lineTo(x+3,11);g.lineTo(x+4.5,13);g.lineTo(x+6,11);g.closePath();g.fill();
    [[2.5,3],[4,3],[1,6],[4,6],[2.5,9]].forEach(h=>g.clearRect(x+h[0],h[1],1,1));}
  const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;return t;}
function t3PapelStrip(pal,L,seed,row){ /* one plane a string, seven flags a tile, the texture carries the cut; two draw calls a swag, not two hundred */
  const n=Math.max(1,Math.round(L*7)),m=new THREE.Mesh(new THREE.PlaneGeometry(L-0.1,0.22),new THREE.MeshBasicMaterial({map:t3PapelTex(pal,n,seed+(row?3:0)),transparent:true,alphaTest:0.3,side:THREE.DoubleSide}));
  m.userData={flag:true,flags:n,pal:pal.slice(),row:row|0};return m;}
function t3PetalSide(){ /* the deck's side, baked once a season: 64×14, the field and the heap's edge */
  const P=petalPal(),c=document.createElement("canvas");c.width=64;c.height=14;const g=c.getContext("2d");
  let sd=977;const rnd=()=>{sd=(sd*1103515245+12345)&0x7fffffff;return sd/0x7fffffff;};
  g.fillStyle=P[0];g.fillRect(0,0,64,14);
  for(let i=0;i<5;i++)petalShape(g,rnd()*64,7+rnd()*7,rnd()*6.28,0.7,P[1]);           /* sparse and dark below */
  for(let i=0;i<20;i++)petalShape(g,rnd()*64,rnd()*5.6,rnd()*6.28,0.9,P[2+(i%4)]);      /* crowded in the top 40% */
  for(let i=0;i<6;i++)petalShape(g,4+i*10.5+rnd()*3,-1+rnd()*2,Math.PI+(rnd()-0.5)*0.8,1,P[3+(i%3)]); /* cut by the edge: spilling over */
  return c;}
function t3PetalTex(){ /* one white petal with alpha, tinted per drop by the material colour */
  if(T3.petalTex)return T3.petalTex;const c=document.createElement("canvas");c.width=16;c.height=20;const g=c.getContext("2d");
  petalShape(g,8,19,0,4,"#FFFFFF","rgba(0,0,0,.35)");const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;return T3.petalTex=t;}
function t3Petals(){
  T3.petals=T3.petals||[];const L=(typeof PETALS!=="undefined")?PETALS:[],now=Date.now(),bands=(typeof petalPal==="function")?petalPal():BRIDGE_BANDS;
  let i=0;
  L.forEach(pt=>{if(pt.w!==world)return;const age=(now-pt.t)/PETAL_MS;if(age>=1)return;
    let sd=pt.s;const rnd=()=>{sd=(sd*1103515245+12345)&0x7fffffff;return sd/0x7fffffff;};
    const lift=stairLift(CW(),pt.x,pt.y);
    for(let k=0;k<3;k++){
      let p=T3.petals[i];
      if(!p){p=new THREE.Mesh(new THREE.PlaneGeometry(0.13,0.16),new THREE.MeshBasicMaterial({color:0xffffff,map:t3PetalTex(),transparent:true,alphaTest:0.3,side:THREE.DoubleSide,depthWrite:false}));
        p.rotation.x=-Math.PI/2;p.userData={petal:true};T3.petals[i]=p;T3.scene.add(p);}
      p.material.color.set(bands[1+((k+pt.s)%(bands.length-1))]);p.material.opacity=1-age*age;
      p.position.set(pt.x+0.18+rnd()*0.64,0.012+lift,pt.y+0.18+rnd()*0.64);p.rotation.z=rnd()*Math.PI;
      p.visible=true;i++;}});
  for(;i<T3.petals.length;i++)T3.petals[i].visible=false;
}
/* what the dog leaves on the ground (#267). A hole LIES on the floor: a plane a hair above it, carrying the
   top camera's own painting of the hole (drawDecal, baked once per kind at this density), faded by the same
   clock as every other camera (decalsNow → material opacity), and lit as a Lambert surface like the ground
   it lies on, so evening darkens both together. The other thing stands, and rides the actor pool
   (t3Actors) the way the ball does. A pool like the petals: nothing is made or thrown away per frame. */
function t3DecalTex(kind){
  if(T3.decalK!==T3.K){Object.values(T3.decalTex||{}).forEach(t=>t.dispose());T3.decalTex={};T3.decalK=T3.K;}
  if(T3.decalTex[kind])return T3.decalTex[kind];
  const K=T3.K,c=document.createElement("canvas");c.width=c.height=32*K;
  const g=c.getContext("2d");g.setTransform(K,0,0,K,0,0);drawDecal(g,0,0,{kind},1);
  return T3.decalTex[kind]=t3Tex(c,true);}
function t3Decals(){
  T3.decals=T3.decals||[];const w=CW();let i=0;
  decalsNow(Date.now()).forEach(({dc,a})=>{if(!DECALFLAT[dc.kind])return;
    let p=T3.decals[i];
    if(!p){p=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshLambertMaterial({transparent:true,depthWrite:false}));
      p.rotation.x=-Math.PI/2;T3.decals[i]=p;T3.scene.add(p);}
    const tex=t3DecalTex(dc.kind);
    if(p.material.map!==tex){p.material.map=tex;p.material.needsUpdate=true;}
    p.material.opacity=a;
    p.position.set(dc.x+0.5,0.011+stairLift(w,dc.x,dc.y),dc.y+0.5);
    p.userData={decal:dc.kind,x:dc.x,y:dc.y};p.visible=true;i++;});
  for(;i<T3.decals.length;i++)T3.decals[i].visible=false;}
/* actors: a pool of live-canvas sprites, repainted by the 2D artists every frame */
function t3Sprite(i){
  let p=T3.pool[i];
  if(!p){
    const c=document.createElement("canvas");c.width=36*T3.K;c.height=48*T3.K; /* 8px of headroom for the bubble (#57) */
    const tex=t3Tex(c,false,true); /* live: repainted every frame, so no pyramid */
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true}));
    spr.center.set(0.5,4/48); /* feet 4px above the card's bottom, as before */
    p=T3.pool[i]={c,g:c.getContext("2d"),tex,spr,live:false};
    T3.scene.add(spr);
  }
  return p;
}
/* where a wall poster hangs (#45): the wall's first open side — south, north, east, west, the
   street side first — at six tenths of the wall's height, the card drawn centred on its anchor.
   A billboard leans back with the camera (it looks down at ~40°), so a card flush with the face
   would sink its top half into the wall: it stands 0.16 out, and the lean tucks its top edge
   back to the face. Nothing for a tile that is not a wall or facade, or a wall with no open side. */
function t3ReadFace(w,x,y){
  const g=w.grid[y][x],m=TILES[g]||{};
  if(m.kind!=="wall"&&m.kind!=="facade")return null;
  const wh=0.55+(m.lift|0)*0.042;
  for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){
    const nx=x+dx,ny=y+dy;
    if(ny<0||ny>=w.H||nx<0||nx>=w.W||SOLID.has(w.grid[ny][nx]))continue;
    return {ox:dx*0.66,oz:dy*0.66,h:Math.max(0.3,wh*0.6)};}
  return null;}
function t3Actors(){
  const list=[];
  const w=CW();
  /* the other thing the dog leaves stands, like the ball, painted by the flat cameras' own painter (#267) — first
     in the list, so somebody standing on the same tile is drawn over it, as in the flat cameras */
  decalsNow(Date.now()).forEach(({dc,a})=>{if(!DECALFLAT[dc.kind])list.push({x:dc.x,y:dc.y,f:g=>drawDecal(g,2,6,dc,a)});});
  w.npcs.forEach(n=>list.push({x:n.fx===undefined?n.x:n.fx,y:n.fy===undefined?n.y:n.fy,f:(g)=>{
    drawPerson(g,2,6,npcWhimsy(n),{dir:"down",idle:Math.sin(Date.now()/500+n.x)*0.8,who:n.npc||n.key});
    /* the SAME painter the flat cameras use, smaller and closer because this sprite has six pixels
       of headroom — see drawSayMark. It was its own copy of the fillText until 2026-09-15, which is
       how "three engine sites" turned out to be four. */
    if(hasSay(n))drawSayMark(g,2,6,"bake");
    drawEmote(n,2,6); /* the trade is drawn BESIDE the mark here too, never instead of it */
  }}));
  PEERS.forEach(p=>{if(p.w===world)list.push({x:p.x,y:p.y,f:g=>drawPerson(g,2,6,p.look||look,{dir:t3ScreenDir(p.dir||"down"),who:p.id||p.name||"peer"})});});
  if(world===AW("dog"))list.push({x:DOG.fx,y:DOG.fy,fc:DOG,f:g=>drawDog(g,2,6)});
  if(world===AW("cat"))list.push({x:CAT.fx,y:CAT.fy,fc:CAT,f:g=>drawCat(g,2,6)});
  if(world===AW("pig"))list.push({x:PIG.fx,y:PIG.fy,fc:PIG,f:g=>drawPigeon(g,2,6)});
  if(world===AW("loro"))list.push({x:LORO.x,y:LORO.y,f:g=>drawLoro(g,2,6)});
  CRIT.forEach(cr=>{if(cr.world!==world)return;
    list.push({x:cr.fx,y:cr.fy,fc:cr,f:g=>{
      if(cr.kind==="butterfly")drawButterfly(g,cr,2,6);
      else if(cr.kind==="colibri")drawColibri(g,cr,2,6);
      else if(cr.kind==="gato")drawGato(g,cr,2,6);
      else if(cr.kind==="beagle")drawBeagle(g,cr,2,6);
      else if(cr.kind==="lab")drawLab(g,cr,2,6);
      else if(cr.kind==="chi")drawChi(g,cr,2,6);}});});
  if(BALL&&BALL.world===world)list.push({x:BALL.fx,y:BALL.fy,f:g=>drawBall(g,2,6,BALL.phase,BALL.t)});
  DOGTHINGS.forEach(o=>{if(o.world===world)list.push({x:o.fx,y:o.fy,f:g=>drawDogThing(g,2,6,o)});});
  /* hero:true — drawn through whatever stands between them and the camera (#22: "a wall between
     you and the camera hides you in 3D"). The four camera stops put a wall in front of the hero
     often; the person you are steering must never vanish behind one. */
  list.push({x:fx,y:fy,hero:true,f:g=>drawPerson(g,2,6,look,{dir:t3ScreenDir(dir),bob:moving?Math.sin(bob)*2:0,moving,hero:true})});
  /* the door marker rides the same pool, lifted above the wall line so the door slab
     does not hide it — and above whatever the BUILDING carries over the door, which until
     crew iteration 14 nothing in this engine could answer. 1.0 was chosen against a flat
     lid at wallH≈1.096; the first shaped casita ran a ridge across the doorway at 1.47 and
     ate the arrow. `cover` is the highest mesh that reaches over this tile from a
     neighbour, and 0.20 is the clearance the ARROW needs: the glyph's baked bottom sits
     0.175 below the sprite's centre (drawDoorMark's baseline, on a 48-px card scaled by
     T3SIGN), so cover+0.20 puts the whole mark clear of the ridge and nothing else moves.
     A tile nothing reaches over keeps 1.0 exactly — every door in both games but the
     casa's, measured door by door. */
  const t3cov=(T3.group&&T3.group.userData&&T3.group.userData.cover)||{};
  doorMarks().forEach(d=>list.push({x:d.x,y:d.y,h:Math.max(1.0,(t3cov[d.x+","+d.y]||0)+0.20),sign:true,mark:"door",
    f:g=>drawDoorMark(g,2,30,0,d.mark)})); /* mark:"door" so a guard can find the arrow and read where it ACTUALLY ended up, instead of doing this line's arithmetic a second time and agreeing with itself */
  /* a poster on a WALL hangs on the wall's open face, mid-height, and is not pulled toward the
     camera (that would push it inside the wall). It used to float 1.15 up wherever it stood, which
     put the board beside la ventanilla above city hall's roof (#45: "poster next to teller is off,
     a bit too high"). A readable thing that is not a wall (the desk) keeps the float. */
  if(typeof readMarks==="function")readMarks().forEach(d=>{
    const face=t3ReadFace(w,d.x,d.y);
    if(face)list.push({x:d.x,y:d.y,h:face.h,ox:face.ox,oz:face.oz,fixed:true,mark:"read",sign:true,f:g=>drawReadMark(g,2,30,-7)}); /* up:-7 centres the card on its anchor */
    else list.push({x:d.x,y:d.y,h:1.15,mark:"read",sign:true,f:g=>drawReadMark(g,2,30,0)});});
  /* A TRAM BETWEEN YOU AND THE CAMERA used to take your depth back: the car hid your legs, the way a
     tram does, because the person waiting at the platform had been painted ON it, feet on the roof,
     for the whole dwell (the owner, 2026-09-21: "the trolley weirdness"; ridden by the line
     inspector, crew iteration 12). That reading was right and the picture was still wrong — at the
     stop the car covered him to the shoulders — and the owner chose the other cure on 2026-09-22:
     "lets make it seethrough". So the CAR goes to glass (t3Trolley) and the hero keeps drawing
     through walls (#22), which is the treatment #140 gives every tall object that is not a wall.
     Nothing here has to know about the tram any more, and the depth flag below is back to the two
     things it was always about: the hero, and being down a hole (#92). */
  const old=ctx;
  list.forEach((a,i)=>{
    const p=t3Sprite(i);
    p.g.setTransform(T3.K,0,0,T3.K,0,8*T3.K);p.g.clearRect(0,-8,36,48); /* every artist paints 8px lower; the bubble above the head is no longer cut off (#57) */
    ctx=p.g; /* the 2D artists paint straight onto the billboard */
    if(a.fc){const f0=a.fc.face;a.fc.face=t3ScreenFace(a.fc); /* painted for the camera, not the map */
      try{a.f(p.g);}catch(e){t3Note("actor",e);}a.fc.face=f0;}
    else{try{a.f(p.g);}catch(e){t3Note("actor",e);}}
    ctx=old;
    p.tex.needsUpdate=true;
    /* pull each billboard a step toward the camera so heads stop sinking into the
       wall behind them (owner: "head disappearance near walls") */
    const ax=a.x+0.5,az=a.y+0.5;
    const ddx=T3.cam.position.x-ax,ddz=T3.cam.position.z-az,dl=Math.hypot(ddx,ddz)||1;
    const lift=stairLift(CW(),Math.round(a.x),Math.round(a.y)); /* on a climbing tread you stand that much higher (#62) */
    if(a.fixed)p.spr.position.set(ax+(a.ox||0),(a.h||0)+lift,az+(a.oz||0)); /* pinned to a wall: stays put (#45) */
    else p.spr.position.set(ax+ddx/dl*0.34,(a.h||0)+lift,az+ddz/dl*0.34);
    p.spr.userData.mark=a.mark||"";
    const cs=a.sign?T3SIGN:T3PERSON;
    p.spr.scale.set(36/32*cs,48/32*cs,1);
    p.spr.material.color.copy(T3.tint);
    /* billboards draw in order of distance from the camera, farthest first, all of them after the
       scene's transparent pieces: whoever stands nearer the camera than you draws over you. The hero
       used to draw LAST, over everyone, so behind a person you stood on their head (owner,
       2026-09-07: "when we walk behind people it seems like im walking on them"). The hero still
       ignores depth, so a wall never hides them (#22) — a person can. */
    /* #92 (owner: "when im going downstairs, im walking on the wall again"): drawn through everything,
       a hero sunk in a well read as standing ON the rail and the floor's lip in front of them. Below the
       floor the hero respects depth — the lip and the knee-high rail hide their legs, which is what going
       down into a hole looks like — and the tall wall on the camera side is the one the near-wall rule
       already minimizes. On the floor and on a climbing flight they still draw through walls (#22). */
    p.spr.material.depthTest=!a.hero||lift<0;p.spr.renderOrder=1000-Math.round(dl*10);
    p.spr.userData.hero=!!a.hero; /* so a guard can find the person you steer without reading a rendering flag for it */
    p.spr.visible=true;p.live=true;
  });
  for(let i=list.length;i<T3.pool.length;i++){T3.pool[i].spr.visible=false;T3.pool[i].live=false;}
}
function t3Light(){
  const dnow=new Date(),hr=dnow.getHours()+dnow.getMinutes()/60;
  const night=hr>=20.5||hr<6,edge=!night&&(hr>=18||hr<8);
  let ambI=DAY_AMB,ambC=0xffffff,sunI=DAY_SUN,tint=0xffffff,bg=0x241F2E;
  if(themeName==="sunset"||edge){ambC=0xffe3c4;tint=0xfff0dd;ambI=DAY_AMB-0.06;sunI=DAY_SUN+0.08;bg=0x2E2130;} /* a low sun rakes harder, and still must not clip */
  if(night){ambI=0.6;ambC=0xaebbe8;tint=0xc7cfea;sunI=0.15;bg=0x14121F;}
  T3.amb.intensity=ambI;T3.amb.color.set(ambC);
  T3.sun.intensity=sunI;
  T3.tint.set(tint);
  T3.scene.background.set(bg);
  T3.tintables.forEach(m=>m.color.copy(T3.tint));
}
function draw3d(){ /* returns true when it rendered; false → caller falls back */
  if(T3.fail)return false;
  if(!T3.renderer){try{t3Init();}catch(e){T3.fail=true;t3Note("init",e);t3Fell();return false;}}
  try{
    const c3=T3.renderer.domElement;
    /* height too, not just width: going fullscreen can keep the width and change the shape */
    if(Math.abs((c3.clientWidth||0)-T3.lastW)>2||Math.abs((c3.clientHeight||0)-T3.lastH)>2){
      T3.lastW=c3.clientWidth||0;T3.lastH=c3.clientHeight||0;t3Resize();}
    t3CheckK();
    const key=world+"|"+themeName+"|"+T3.dirty;
    if(T3.builtKey!==key)t3Build(key);
    t3TurnTick();
    const hx=fx+0.5,hz=fy+0.5;
    T3.cam.position.set(hx+Math.sin(T3.yaw)*T3CAMD,T3CAMH,hz+Math.cos(T3.yaw)*T3CAMD);
    T3.cam.lookAt(hx,0.4,hz);
    t3Light();
    t3Glow();
    t3Reveal();
    t3Trolley();   /* the car first: the people ask where it stands (t3Actors, tramBetween) */
    t3Actors();
    t3Petals();
    t3Decals();
    t3Fiesta();
    t3Leash();
    T3.renderer.render(T3.scene,T3.cam);
    return true;
  }catch(e){T3.fail=true;t3Note("render",e);t3Fell();return false;}
}
/* #61: a wall between the camera and the hero vanishes for that frame — the cutaway every third-
   person camera does. Standing in the lobby with the south wall behind you, the wall used to fill
   the screen and the hero (drawn through walls) read as standing ON it, while the dog, drawn in the
   scene, was hidden behind it. Now that wall is simply not there while it is in the way. Walls,
   facades, lintels, doors and the window pieces cut; treads, rails, props and decor do not. */
/* #65, the owner's word after [partner] walked it: "[partner] prefers the minimized wall but limit it to one
   near the person... the view change was too confusing - lets keep that manual." The camera
   never turns by itself; ↻ is the only turn. A wall HIDES you only when it is close and tall:
   the camera looks down from T3CAMH high and T3CAMD back, so a wall d tiles in front of you
   covers your feet up to ~0.84·d — t3Hides counts it once it reaches above your shins
   (0.65·d+0.3). Of the walls that hide you, only the NEAREST is minimized — the piece in front
   of you and its two neighbours drop to a knee-high stub in the wall's top colour (t3Reveal);
   everything else, the far wall included, stays whole. */
const T3CAMD=7.4,T3CAMH=6.2,T3STUB=0.28,T3GHOST=0.68;
/* ---- and how see-through a thing you stand UNDER is, which is not T3GHOST ----
   T3GHOST IS SHARED AND STAYS WHERE IT IS. It is the ghost for every ghosted object in both games
   — the appliances, the stalls, the lintels, the door glows. Round three of this lane moved it to
   0.34 for the tree's sake, which would have made every see-through thing in the owner's town
   twice as faint, with no ask there and no measurement there. An engine change is
   behaviour-identical for both games or it is not an engine change. The pattern to avoid it is one
   constant below: T3TRAMGLASS exists because a tram needed a different number from a tree's and
   the tram lane did not move the tree's.

   SO THE CROWN GETS ITS OWN, AND T3OVERHEAD SAYS WHO IT IS FOR. The reach is not a taste: it is
   t3Hides read back at THREE tiles. A thing is given the crown's ghost when it is tall enough to
   be going see-through while you are still three tiles away from it — which is the definition of
   something you are UNDERNEATH rather than beside, and it is the engine's own rule rather than a
   number somebody liked.
   Measured, with the reach applied: TWELVE objects in Meridian take it and they are the twelve
   jacarandas. IN THE TOWN IT IS NONE. Everything else in either game keeps T3GHOST, and the
   running totals are not written here on purpose — they move whenever any lane adds a prop, and a
   count copied into prose is how the round-three draft of this comment came to be wrong three
   times. The guard in test/engine.smoke.js prints them per shell on every build; that is the
   number to read.
   THE MARGIN WAS CHECKED RATHER THAN ASSUMED, and it is why this is 2.25 and not the round 2.00
   the first draft used. El Changarrito has jacarandas of its own (pk 13,1 / 19,8 / 7,9, drawn
   flat, 1.90 tall) and a season prop at st 12,2 that stands 1.98. At 2.00 the town cleared this
   rule by two hundredths of a tile — near enough that raising one prop in the other game would
   have silently handed it a tree's ghost. At 2.25 it clears by 0.27, and Meridian's tree sits 0.48
   above. The frames agree with the arithmetic: El Changarrito at pp 18,0 yaw 0, head against this
   patch, is identical pixel for pixel in both seasons.

   THE LADDER, because 0.68 was never measured either. Owner: "can we make it tall so we can walk
   underneath it all ghostly?" The hero was stood on the tile Meridian's jacaranda overhangs and
   the ghost swept; each rung was rendered twice, once with his billboard visible and once hidden,
   so every differing pixel is one he put on the screen.

                   ONE TILE UNDER          TWO TILES BACK
     ghost 0.00 ..... 3653  100%             3946  100%   the tile is simply gone
     ghost 0.18 ..... 3640  100%             3714   94%
     ghost 0.26 ..... 3638  100%             3605   91%
     ghost 0.34 ..... 3629   99%             3211   81%   HE READS WHOLE at one tile — face, arms,
                                                          yellow shirt — AND IT IS STILL A TREE
     ghost 0.42 ..... 3561   97%             2738   69%   his head starts washing into the canopy
     ghost 0.52 ..... 3273   90%             2066   52%
     ghost 0.68 ..... 2547   70%             1711   43%   SHIPPED, AND HE IS NOT THERE. Look at the
                                                          frame: at either distance, no hero at all
     ghost 1.00 ..... 1342   37%             1336   34%   opaque — and still a third, because his
                                                          legs hang below the canopy

   THE COUNT IS NOT THE ANSWER AND SAYS SO: at full opacity it still reports a third of him,
   because it counts a pixel he merely TINTS as a pixel you can see him in, and because the part of
   him below the crown was never covered. It ranks the rungs; the picture picks between them, and
   the picture picks 0.34.

   WHY THE LINE IS AT TWO TILES AND NOT LOWER — this was rendered too, not chosen. The next tallest
   thing either game can ghost is the "Y" market stall at ex 20,2, 1.886 tall. At 0.68 the stall is
   a stall and the hero's shirt already reads through it; at 0.34 the painted sign it carries
   washes out and it stops being a stall. The crown's number is not the stall's number. Between
   1.886 and the jacaranda's 2.733 the only thing either game has is the town's 1.98 prop, and the
   reach clears it by 0.27.

   AND THE HONEST LIMIT: each crown sphere is its own transparent surface, so at two tiles, with
   the deepest part of the canopy on the ray, 0.34 stacks toward opaque and he is a yellow SHAPE
   rather than a face (81% by the count, and the frame is what says "shape"). That is strictly
   better than what shipped, where at two tiles he is gone — but it is weaker than "ghostly", and
   fixing it properly means one depth-sorted glass pass per tile, which is engine surgery and was
   not this lane's to do. A `let`, for the same reason T3PERSON and T3TRAMGLASS are: the ladder
   sweeps this value, and a number nobody can sweep is a number nobody re-measures. */
let T3CROWNGLASS=0.34;
const T3OVERHEAD=0.65*3+0.3;   /* = 2.25: exactly the height t3Hides starts ghosting at three tiles */
/* ---- HOW BIG A PERSON IS, and why it is two numbers and not one ----
   The owner, 2026-09-22: "you can make my character smaller as i mentioned before for the cool looks."
   Every actor rides a 36x48 card and this is what that card is worth in tiles: the sprite's anchor is
   a FRACTION of the card (`center.set(0.5,4/48)`, his feet), so changing this scales him about his own
   shoes and nothing floats. A person's drawn height is about 32 of the 48 rows, so his height in tiles
   is very nearly this number itself — which is how the size can be argued instead of felt:
     · a DOORWAY in this engine is 1.0 (engine3d.js, the door slab is BoxGeometry(1,1,0.14) at y=0.5);
     · a real person is about 1.70 m and a real doorway about 2.05 m, so a person is 0.83 of a door;
     · at 1.12 the cast was 1.12 of a door — every one of the thirty-six walked under a lintel shorter
       than they are, which is the sort of thing you stop seeing after a week and cannot unsee after.
   The FLOOR, the thing that does not compress: a tile is about 35 px on a phone, so at 1.12 a person
   is 39 px and his face is two of them. Take too much off and the barrio is thirty-six silhouettes —
   and Pili measured on 2026-09-22 that twenty-six of the thirty-six already share one of two outlines,
   so the face is not spare capacity. The ladder 1.12 / 1.00 / 0.92 / 0.84 was rendered at phone width,
   on the street and in HQ, and the frame chose 0.92 — an 18% cut:
     1.12  his head crosses the shop windows' band on Calle Principal, and four people fill an office;
     1.00  exactly a doorway, which is the size of the LINTEL and not of a person;
     0.92  under the lintel, clear of the window band, the face still two eyes and a mouth at 32 px;
     0.84  the arithmetic's own answer, and the floor bites: he is level with a DESK PLANT in HQ, and
           a person the same height as the thing on the desk is a ruler that has stopped ruling.
   So the honest ratio is 0.84 and the shipped number is 0.92, and the reason is legibility, not taste.
   EVERY BODY, not only the hero (the owner said "my character"): thirty-six people walk under the
   same lintels, and shrinking one of them makes him a child standing next to the tamalera rather than
   making the street bigger. The size of a person is the size of the world.
   A `let`, not a `const`, for one reason: the ladder is rendered by sweeping THIS value, and the guard
   reads THIS value. A guard that names its own copy of a number is testing its own arithmetic
   (.claude/skills/guard/SKILL.md, the first of the four).
   T3SIGN is the quest mark and the read mark, which ride the same pool and are NOT people. A mark is
   signage: it is sized to be read at arm's length across a street, and it does not shrink because the
   cast did. Rigo's rule for the one painted thing on a tram that is still not livery — "the signal
   lamp... is the only sentence the vehicle can say, and it is not on anybody's menu" — is the same
   rule, and the marks are this game's signal lamp. */
let T3PERSON=0.92;
const T3SIGN=1.12;
/* ---- and how see-through the TRAM is, which is not T3GHOST and here is the measurement ----
   (Written 2026-09-22 when this said "T3GHOST is a TREE's number". It no longer is: the crown took
   its own constant the same day, T3CROWNGLASS above, and T3GHOST went back to being what it has
   always actually been — the ghost for everything ordinary, in both games. The argument below is
   unchanged, because it was never about trees.) A ghosted crown has to still read as a tree, and
   what stands behind a tree is a whole person-sized silhouette. A ghosted TRAM has a person behind it, 39 px tall, most of
   him dark clothes against a dark road — and at 0.68 the four-frame probe found 3% of the pixels
   where he and the car meet carrying any of him at all: his face, and nothing else. "See-through" was
   true of the material and false of the picture, which is docs/REGRESSION.md's whole subject.
   Swept 0.68 / 0.60 / 0.52 / 0.45 / 0.38 / 0.30 and looked at every frame (crew iteration 14). A
   `let` for the same reason as T3PERSON: the ladder sweeps this value and the guard reads it. */
let T3TRAMGLASS=0.30;
/* #149: every prop, tree crown and cutout in 3D is a PICTURE on a card, and most of that card is
   see-through. A see-through pixel that still writes depth punches a hole in whatever is drawn after
   it — which is people: a quest mark beside a desk simply went missing, and nobody could see why,
   because the thing eating it was invisible. alphaTest throws those pixels away before they reach
   the depth buffer. 0.25 is low enough to keep a soft edge and high enough to drop the margin. */
const T3ALPHA=0.25;
function t3Hides(h,d){return h>0.65*d+0.3;}
/* #140: how high the top of a piece stands, whatever KIND of piece it is. The near-wall rule used to
   read `geometry.parameters.height`, which a sprite does not have — so a tree crown, a lamp or a
   piñata could never be considered tall no matter how much of you it covered. A box stands on its
   own half-height; a billboard hangs from its centre point. */
/* A MERGED MESH KNOWS ITS OWN HEIGHT AND WAS NEVER ASKED (owner, 2026-09-22: "can we make it tall
   so we can walk underneath it all ghostly?"). There are two `t3Top`s and they are not the same
   thing, which is how this lasted: `m.t3Top` is a PROPERTY the merged mesh carries — its tallest
   vertex, measured where the parts are baked — and `t3Top(o)` is this FUNCTION. A box answers from
   `geometry.parameters.height` and a sprite is caught on the line above, but a merged
   BufferGeometry has no `parameters` at all, so EVERY mesh tile in both games fell through to the
   literal `1`. Meridian's jacaranda is 2.733 tiles tall; the rule believed it was one, and
   `t3Hides` only fires for a 1-tile thing within 1.08 tiles — so the tree went see-through on the
   single tile touching its trunk and stayed solid everywhere else, with the player painted on top
   of its canopy two tiles away. Measured before this line, in the shipped build: EVERY mesh tile
   in both games answered 1.000 — 396 of them in Meridian in season, 395 out of it, and 128 in the
   town — while 29 of Meridian's are genuinely taller than a tile (28 out of season), the tallest
   of each being "J" 2.733, "Y" 1.886, "▣" 1.865, "7" 1.200, "S" 1.159, the ofrenda prop 1.149,
   "ʘ" 1.108, "U" 1.096, "I" 1.043 — and the town's tallest is 0.950 ("W" at pp 18,1), so the town
   has none. THE COUNT IS PER OBJECT AND SAYS SO, because the round-three draft of this comment
   said 49 and that number came from a probe that grouped by GLYPH and then credited all 21 "S"
   with the tallest "S"'s height. The guard in test/engine.smoke.js counts the same objects and
   prints "29 of 396" when the line below is removed; if the two ever disagree, the guard is right,
   because it is the one that runs.
   THE FLOOR IS DELIBERATE AND IS THE WHOLE COMPATIBILITY STORY. `1` was the old answer for every
   mesh tile, and honest heights ALONE would quietly stop 349 + 128 short things — a bed of
   marigolds, a traffic cone, the town's stalls — from getting out of the way at one tile, which is
   the cure the owner asked for in #140 ("there are still overlaps with other objects where i seem
   to walk on them") and nobody asked to have taken back. Those two figures are the guard's own,
   quoted off the run that planted the fault: drop the `Math.max` and it prints "349 short props in
   this shell" for Meridian and "128" for the town. So a mesh tile is at least as tall as the box
   it replaced, and its real height when it is taller than that. Short things behave exactly as
   they did today; only things that are genuinely taller than a tile change, which is the ask. */
function t3Top(o){
  if(o.isSprite)return o.position.y+o.scale.y*(1-((o.center&&o.center.y)||0));
  if(o.t3Top!==undefined)return Math.max(1,o.position.y+o.t3Top);
  const g=o.geometry&&o.geometry.parameters;
  return g&&g.height!==undefined?o.position.y+g.height/2:1;
}
function t3Wallish(u){return u&&(u.wall!==undefined||u.door||u.winBack||u.counter);}
function t3Near(x,y,yaw,fake){ /* the pieces nearest (x,y) that hide you at this camera stop; `fake`=[[x,y,h]] for a test */
  const hx=x+0.5,hz=y+0.5,ux=Math.sin(yaw),uz=Math.cos(yaw);
  /* #140: it used to be a list of KINDS — walls, facades, lintels, doors, window pieces — so a tree,
     a lamp or a piñata was never considered no matter how much of you it covered (owner: "there are
     still overlaps with other objects where i seem to walk on them"). A kind list cannot answer the
     question being asked. The question is only ever "is this thing tall enough, and is it standing
     between me and the camera", so that is what is asked now, of everything that has a footprint. */
  const pieces=fake?fake.map(([ax,ay,h])=>({x:ax+0.5,z:ay+0.5,h,o:null}))
    :T3.group.children.filter(o=>{const u=o.userData;
      return u&&!u.stub&&!u.apron&&!u.papel&&!u.swag&&!u.string&&(t3Wallish(u)||u.x!==undefined);})
      .map(o=>({x:o.position.x,z:o.position.z,h:t3Top(o),o}));
  const hits=[];pieces.forEach(p=>{const dx=p.x-hx,dz=p.z-hz,d=dx*ux+dz*uz,side=Math.abs(dz*ux-dx*uz);
    if(d>0.4&&d<T3CAMD&&side<0.9&&t3Hides(p.h,d))hits.push({p,d});});
  if(!hits.length)return [];
  const dmin=Math.min(...hits.map(e=>e.d)); /* the nearest thing; its neighbours one tile either side, in the same row */
  return pieces.filter(p=>{const dx=p.x-hx,dz=p.z-hz,d=dx*ux+dz*uz,side=Math.abs(dz*ux-dx*uz);
    return Math.abs(d-dmin)<0.55&&side<1.6&&t3Hides(p.h,Math.max(d,0.4));});}
/* #140: TWO ways out of the way, because a wall and a tree are not the same thing.
   A wall is a plane you are meant to see over: dropping it to a knee-high stub in its own top colour
   reads as a cutaway, which is what every third-person camera does, and it is what the owner already
   signed off on in #65. A tree, a lamp, a piñata is an OBJECT: half a tree is not a cutaway, it is a
   missing tree, and the room stops making sense. So a tall object turns to GLASS instead — still
   there, still in its place, drawn see-through so you can be seen through it — at T3CROWNGLASS if
   it is something you are underneath, at T3GHOST otherwise.
   The glass is drawn AFTER the people and writes no depth, which is why the hero can keep drawing
   through walls (#22, #92) and still read as being BEHIND the tree: the crown is painted over him at
   T3CROWNGLASS, so the pixel holds both of them and the position is honest either way. (This
   sentence said "at 55%" from the day it was written and the constant beside it has never been
   0.55. A number repeated in prose drifts from the number that runs; the name does not — so it is
   a name here now, and the value lives in one place.)
   Materials can be shared between pieces of one glyph, so the glass copy is made once per PIECE and
   kept beside the solid one — never edited in place, or one tree would fog the whole row. */
function t3Reveal(){
  const key=world+"|"+px+"|"+py+"|"+t3Q()+"|"+T3.builtKey;
  if(T3.nearKey!==key){T3.nearKey=key;T3.near=t3Near(px,py,Math.round(T3.yaw/(Math.PI/2))*(Math.PI/2));}
  const cut3=new Set((T3.near||[]).map(p=>p.o).filter(Boolean));
  T3.group.children.slice().forEach(o=>{const u=o.userData;if(!u||u.stub)return;
    const cut=cut3.has(o);
    if(t3Wallish(u)){
      if(cut&&!u.stub3){const g=o.geometry.parameters||{},m=o.material,top=Array.isArray(m)?m[2]:m;
        const st=new THREE.Mesh(new THREE.BoxGeometry(g.width||1,T3STUB,g.depth||1),top);
        st.position.set(o.position.x,o.position.y-(g.height||1)/2+T3STUB/2,o.position.z);st.rotation.y=o.rotation.y;
        st.userData={stub:true,x:u.x,y:u.y};T3.group.add(st);u.stub3=st;}
      o.visible=!cut;if(u.stub3)u.stub3.visible=cut;return;}
    if(!cut&&!u.solid3)return;               /* never been glass and is not now: leave it alone */
    if(!u.solid3){u.solid3=o.material;
      /* a thing you stand UNDER gets the crown's ghost; everything else keeps the one it has had
         since #140. t3Top is the honest height now, so the question can finally be asked. */
      const gh=t3Top(o)>T3OVERHEAD?T3CROWNGLASS:T3GHOST;
      const mk=q=>{const c=q.clone();c.transparent=true;c.opacity=gh;c.depthWrite=false;return c;};
      u.glass3=Array.isArray(o.material)?o.material.map(mk):mk(o.material);}
    o.material=cut?u.glass3:u.solid3;
    o.renderOrder=cut?1500:0;                /* after the people, so it tints them instead of hiding them */
  });}
function t3Glow(){ /* the light under every door breathes — same clock as the 2D art */
  const a=0.25+0.2*Math.sin(Date.now()/380);
  T3.glows.forEach(m=>{m.opacity=a;});
}
function t3Leash(){ /* the blue leash exists in 3D too, while it's on */
  const dog=CRIT.find(c=>c.leashT>performance.now()&&c.world===world);
  if(!dog){if(T3.leashLn)T3.leashLn.visible=false;return;}
  if(!T3.leashLn){
    const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
    T3.leashLn=new THREE.Line(g,new THREE.LineBasicMaterial({color:0x2E5FA8}));
    T3.scene.add(T3.leashLn);
  }
  const pos=T3.leashLn.geometry.attributes.position;
  pos.setXYZ(0,fx+0.5,0.5,fy+0.5);
  pos.setXYZ(1,dog.fx+0.5,0.35,dog.fy+0.5);
  pos.needsUpdate=true;T3.leashLn.visible=true;
}
/* ↻ — the camera-flip wish from the iso playtest. QUARTER turns, four stops: N/E/S/W
   as originally planned (docs/IDEAS.md). It shipped as eight 45° stops, and a 4-way
   movement grid cannot be driven from a 45°-rotated camera — at those four odd stops
   NO swipe the player can make corresponds to a straight move on screen, which is
   exactly why the owner reported "some directions are broken when i rotate". */
/* THE TURN, EASED (Rosa's 3D note; the owner picked "your choice, ready to change, maybe in
   settings"). The camera used to jump a quarter turn in one frame. [partner] called the old AUTOMATIC
   turn "too confusing" (#65) and the cure then was to make it manual — but the confusion was never
   that it turned, it was that the turn had no motion to follow, so the eye had to re-find the
   whole street from scratch. A move you can watch is a move you can follow.
   300ms with an ease-in-out is the middle of the range interface work lands on for a change of
   view: fast enough not to feel like waiting, slow enough to be followed. It is a setting, not a
   constant, because it is taste — Settings → Picture → Camera turn offers instant, quick, easy and
   slow, and instant is exactly the old behaviour for anyone who wants it back. */
const T3EASE={instant:0,quick:150,easy:300,slow:520};
let camEase="easy";
try{const v=localStorage.getItem(SK("camease"));if(v&&T3EASE[v]!==undefined)camEase=v;}
catch(e){t3Note("camease",e);}   /* storage can be refused; the default stands, but it is never silent (#24) */
function camEaseSet(k){if(T3EASE[k]===undefined)return;camEase=k;
  try{localStorage.setItem(SK("camease"),k);}catch(e){t3Note("camease",e);}
  document.querySelectorAll("#easeRow button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.ease===k?"true":"false"));}
function t3TurnTick(){                    /* called once a frame, before the camera is placed */
  const T=T3.turn;if(!T)return;
  const ms=T3EASE[camEase]||0;
  if(ms<=0){T3.yaw=T.to;T3.turn=null;return;}
  const u=Math.min(1,(performance.now()-T.t0)/ms);
  const e=u<0.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;   /* ease in, ease out — a move with a shape */
  T3.yaw=T.from+(T.to-T.from)*e;
  if(u>=1)T3.turn=null;
}
function t3Turn(by){                      /* one quarter, from wherever the last one got to */
  const from=T3.turn?T3.turn.to:T3.yaw;
  T3.turn={from:T3.yaw,to:from+by,t0:performance.now()};
  if(!(T3EASE[camEase]>0)){T3.yaw=T3.turn.to;T3.turn=null;}
}
(function(){
  const b=document.getElementById("rot3d");
  if(b)b.addEventListener("click",()=>t3Turn(Math.PI/2)); /* the only turn there is (#65: "lets keep that manual") */
})();
