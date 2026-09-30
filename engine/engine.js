/* =========================================================
   MERIDIAN QUEST ENGINE — renderer, movement, portals, saves,
   validators, animals, themes, admin tools, the NET seam.
   Game data lives in content/<game>/ (strings, quests, npcs,
   maps, config), loaded BEFORE this file. A new gifted game is
   a new content folder — this file stays untouched.
   ========================================================= */
/* storage prefix — every localStorage key the engine touches goes through SK(). A pack may
   declare STOREPFX so two packs on one origin keep separate saves (GitHub Pages serves every
   project site on an account from ONE origin, and localStorage is per-origin, not per-path).
   Default "mq": Meridian's keys are unchanged, byte for byte. Guarded by the smoke suite:
   no literal key may remain in engine/. */
const SK=k=>((typeof STOREPFX==="string"&&STOREPFX)||"mq")+k;
/* ---------- THE LOG (#8, IDEAS §15.5 — owner: "efficient and low storage") ----------
   What went wrong, kept small: thirty entries under the pack's prefix, one per kind|message
   with a count and a last-seen instead of N copies, a 16 KB ceiling (halved once if crossed),
   private mode tolerated. `crit` marks what must be discussed sooner than later — a refused
   build, a portal to nowhere, an uncaught error — and El Portero and the teller print those in
   red. Never a player's free text: only the engine's own messages reach here. */
const LOGN=30,LOGKB=16*1024;let mqLog=[];
try{mqLog=JSON.parse(localStorage.getItem(SK("log"))||"[]");if(!Array.isArray(mqLog))mqLog=[];}catch(e){mqLog=[];}
function mqwarn(kind,msg,crit){const m=String(msg||"?").slice(0,160),key=kind+"|"+m,now=Date.now();
  let e=mqLog.find(x=>x.key===key);
  if(e){e.n++;e.at=now;if(crit)e.crit=true;}
  else{e={key,kind,msg:m,n:1,at:now,crit:!!crit,v:typeof GAMEV==="string"?GAMEV:""};mqLog.push(e);if(mqLog.length>LOGN)mqLog.shift();}
  try{let j=JSON.stringify(mqLog);if(j.length>LOGKB){mqLog=mqLog.slice(-Math.floor(LOGN/2));j=JSON.stringify(mqLog);}localStorage.setItem(SK("log"),j);}catch(err){}
  console.warn((crit?"CRIT ":"")+kind+": "+m);}
/* ---------- EVERY WRITE GOES THROUGH HERE, AND A FAILED ONE IS NOT SILENT (2026-09-16) ----------
   The owner asked: *"how do we fix the save failing silently?"* It was nineteen copies of
   `try{localStorage.setItem(...)}catch(e){}` — so when the device ran out of room the game went on
   playing perfectly and simply stopped remembering, with no error, no warning, and nothing in the
   log. A player would close the tab and find their afternoon gone. This is the shape `docs/GAUGE.md`
   calls a silent zero, in the one place where the thing lost belongs to a person.

   Three things a swallowed catch cannot do, and this does:

   1 · IT TELLS THE DIFFERENCE. Out of room is not the same failure as a browser refusing storage in
       a private window. The first is the player's disk and can be recovered from; the second is a
       setting and cannot. They need different sentences and only one of them is alarming.
   2 · IT RECOVERS FIRST. When the disk is full the engine's own diagnostics are the first thing to
       go — sixteen kilobytes of our notes about ourselves are never worth somebody's progress. The
       log is dropped and the write is retried ONCE before anybody is told anything.
   3 · IT SAYS SO, AND THEN STOPS SAYING SO. A critical write that fails puts a line on screen in
       the player's own language, at most once every three minutes, and says the one thing that
       matters: *what you do now is not being kept.* And when a later write succeeds, it says that
       too — because "it is working again" is information, and a game that only ever reports bad
       news teaches people to ignore it.

   mqwarn's own write stays raw and out of this, or a full disk would recurse.  */
let storeBad=false, storeToldAt=0;
/* `T` is a `const` three thousand lines below this one, and a `const` read before its line runs
   throws ReferenceError — `typeof` included, which is the half of the temporal dead zone people
   forget. A write during early boot would therefore throw INSIDE the handler for a failed write,
   the throw would escape the catch, and "the save failed quietly" would become "the game died
   while telling you the save failed". So the words are fetched defensively, and a pack that has
   not booted yet simply has none yet. */
function saveWords(){try{return (T().save)||{};}catch(e){return {};}}
function mqStore(k,v,critical){
  const ok=()=>{                                  /* one success path, however we got here */
    if(storeBad){storeBad=false;
      if(critical&&typeof toast==="function"){const t=saveWords();if(t.back)toast(t.back,4200);}}
    return true;
  };
  try{
    localStorage.setItem(k,v);
    return ok();
  }catch(e){
    const full=!!e&&(e.name==="QuotaExceededError"||e.name==="NS_ERROR_DOM_QUOTA_REACHED"
                     ||e.code===22||e.code===1014);
    if(full&&k!==SK("log")&&mqLog.length){        /* our notes go before their afternoon does */
      try{localStorage.removeItem(SK("log"));mqLog=[];localStorage.setItem(k,v);
        mqwarn("store","dropped the log to make room for "+k,true);return ok();}catch(e2){}
    }
    storeBad=true;
    mqwarn("store",(full?"full":"refused")+" "+k,!!critical);
    if(critical)storeTell(full);
    return false;
  }
}
/* THE ENGINE CARRIES WORDS HERE, WHICH IT ALMOST NEVER DOES, and the gauge is why.
   Every string a player reads belongs to the pack — that is this engine's whole bargain. But
   `node test/gauge.js` went red the moment this was written: a five-tile world that declares no
   `save` strings got a silent save back, because there was nothing to say. **A pack forgetting a
   word must not be able to reinstate the bug.** So the guarantee lives in the engine and the pack's
   own wording overrides it: a world that says nothing still tells the player, in English, that what
   they do now is not being kept. Better a sentence in the wrong language than an afternoon lost in
   silence. (docs/GAUGE.md: this is exactly the class of thing that world exists to find.) */
const SAVE_FALLBACK={
  full:"This device is out of room — what you do now is not being saved.",
  blocked:"This browser is not letting the game save. A private window does that."};
function storeTell(full){
  const now=Date.now();if(now-storeToldAt<180000)return;storeToldAt=now;
  const t=saveWords();
  const msg=full?(t.full||SAVE_FALLBACK.full):(t.blocked||SAVE_FALLBACK.blocked);
  if(msg&&typeof toast==="function")toast(msg,7000,true);
}
const logCrit=()=>mqLog.filter(e=>e.crit),logKind=k=>mqLog.filter(e=>e.kind===k);
function logClear(){mqLog=[];try{localStorage.removeItem(SK("log"));}catch(e){}}
window.addEventListener("error",e=>{try{mqwarn("error",(e&&e.message)||"error",true);}catch(x){}});
window.addEventListener("unhandledrejection",e=>{try{const r=e&&e.reason;mqwarn("promise",(r&&(r.message||String(r)))||"rejection",true);}catch(x){}});
/* ---------- the places seam (#25) ----------
   The engine used to spell Meridian's room ids in ~60 places: home base "hq" with (10,11)
   walkable, the street "st", the park "pk" with the leash landing at (2,6). A second world
   inherited them or crashed. Now the pack says which of its worlds play which ROLE, and the
   engine reads the role. A pack that says nothing gets Meridian's table, byte for byte. */
const PLDEF={home:"hq",spawn:[10,11],street:"st",park:"pk",parkIn:[2,6,"right"],parkDog:[3,6],parkDogHome:[8,6],eateries:[{world:"lc"}],
  parkAdopt:[[17,4],[19,4],[17,2],[19,2],[16,3],[20,3]],friends:["st","me","lc","lo"],upstairs:"f2"};
const PL=Object.assign({},PLDEF,(typeof PLACES==="object"&&PLACES)||{});
/* the pavement each world is painted with; a world not listed gets the pack's floor colours */
const FLOORDEF={st:["#C6C4BB","#BFBDB4"],lo:["#D9DCE0","#D1D5DA"]};
const FLOORC=(typeof FLOORS==="object"&&FLOORS)||FLOORDEF;
const FQ=()=>lang==="es"?FQES:FQEN;
const TS=32;
/* "C" (the traffic cone) left this set on 2026-09-04. Owner: "I think a cone shouldnt make me
   have to go around it. i should be able to kick it." A cone is not a wall — it is a thing one
   person moves with a foot. It is a `stand` tile now: walkable, still drawn standing. */
const SOLID=new Set(["#","D","K","P","B","F","G","X","T","W","V","A","U","Q","J","⊓","◺"]); /* ⊓ the stair mass, ◺ the rail — the engine's own flight (#4) */
/* the content seam: a pack adds its own solid glyphs and declares which are doors */
(typeof SOLIDX!=="undefined"?SOLIDX:"").split("").forEach(c=>SOLID.add(c));
const DOORSET=new Set((typeof DOORS!=="undefined"?DOORS:"+ELO").split(""));
let world=PL.home;
const WORLDS={};
Object.keys(WORLD_DEFS).forEach(id=>{
  const rows=WORLD_DEFS[id].slice(),grid=[],wnpcs=[],defs=WNPC[id]||{};
  rows.forEach((row,y)=>{grid.push(row.split(""));row.split("").forEach((ch,x)=>{
    if(defs[ch]){wnpcs.push({key:ch,x,y,...defs[ch]});grid[y][x]="N";}});});
  WORLDS[id]={rows,rows0:WORLD_DEFS[id].slice(),grid,npcs:wnpcs,W:rows[0].length,H:rows.length};
});
const CW=()=>WORLDS[world];
/* ---------- PORTALS by coordinate (#10, La llave) ----------
   PORTALS is keyed by glyph per world: one letter, one destination. That is why every house you
   can enter cost its own glyph and the alphabet ran out. PORTALSAT is keyed by WHERE the door
   stands — "x,y" per world — and is what a build writes when a template links a lot to an
   interior. portalAt() answers both, coordinate first; portalsOf() lists every portal a world
   has, either way. Every read site asks these two, never the tables. */
const PORTALSAT={};
function portalAt(id,x,y){const A=PORTALSAT[id];if(A&&A[x+","+y])return A[x+","+y];
  const w=WORLDS[id],P=PORTALS[id];if(!w||!P)return null;const ch=w.rows[y]&&w.rows[y][x];return (ch&&P[ch])||null;}
function portalsOf(id){const w=WORLDS[id],out=[];if(!w)return out;const P=PORTALS[id]||{},A=PORTALSAT[id]||{};
  for(let y=0;y<w.H;y++)for(let x=0;x<w.W;x++){const ch=w.rows[y][x];const p=A[x+","+y]||P[ch];if(p)out.push({x,y,ch,p});}
  return out;}
const isSolid=(x,y)=>{const w=CW();return x<0||y<0||x>=w.W||y>=w.H||SOLID.has(w.grid[y][x])||w.grid[y][x]==="N";};
/* the same question about a world you are not standing in — used by the discoverability audit */
const isSolidAt=(id,x,y)=>{const w=WORLDS[id];return !w||x<0||y<0||x>=w.W||y>=w.H||SOLID.has(w.grid[y][x])||w.grid[y][x]==="N";};
const glyphAt=(id,x,y)=>{const w=WORLDS[id];return (w&&w.rows[y]&&w.rows[y][x])||null;}; /* the glyph a tile is made of — what its art and its TILES row are looked up by. Decor that is painted ON a wall needs it (a mural has to know the wall has windows in it). */
/* ---------- townsfolk on the move ----------
   Anyone with NO quests drifts around their own corner. A quest-giver never moves: a person
   you are looking for has to be where you left them, which is the entire reason the doorstep
   nudge exists. Room hosts never move either. Owner, 2026-09-03: "why cant they walk around?
   then they can test our world for free" — the walking is for life; the free test is the boot
   check below, which is deterministic where a random walk would only be lucky.
   A wanderer stays within WANDER_R of where the pack put them, never steps onto a door, never
   onto the tile you are standing on, and holds still while you are beside them so a
   conversation is never a chase. */
const WANDER_R=3, WANDER_MS=420;
/* `roams:true` on a station lets a person who carries a document walk anyway — a crier with
   the news, not a clerk you have to find at her window. No Meridian station says it.
   `still:true` keeps a person where the map put them even with nothing to hand out — a
   vendor at her pot (Doña Meche); a wanderer stepping onto a trolley's landing would block it. */
function wanders(n){return !!n&&!n.still&&(!n.doc||n.roams)&&(!n.q||!n.q.length)&&
  !(typeof roomHosts!=="undefined"&&roomHosts&&roomHosts[n.npc]);}
function wanderInit(){Object.values(WORLDS).forEach(w=>w.npcs.forEach(n=>{
  n.fx=n.x;n.fy=n.y;n.hx=n.x;n.hy=n.y;n.wnext=0;n.mv=null;n.mt=0;n.face=1;}));}
/* ═══════════ NOBODY STANDS IN THE DOORWAY (R11, owner 2026-09-16) ═══════════
   He asked the right question: "why doesnt r11 walk around?" — and the answer is that there is
   nothing to walk around. A person is stamped into the grid as the literal character `"N"`, and
   three readers treat `"N"` exactly as they treat a wall: `isSolid`, `isSolidAt`, and
   `auditReach`'s own `walk`. None of them knows it is a person. So when a wanderer steps into a
   corridor ONE TILE WIDE, the map is genuinely cut in two — it is not a pathfinding failure, it is
   a gap with somebody in it, and there is no way round because there is no round.

   MEASURED, world by world, rather than argued about. Every tile whose occupant would cut the
   walkable graph, against the number of people who wander there:

       ex (Calle Dos)  176 walkable   32 chokepoints   4 wanderers   ← every red
       no               107            16              0
       hq               208            17              0
       st               356            14              0
       …every other world has chokepoints and NOBODY who moves.

   So the whole of R11 lives on one street, and the fix is manners: a person does not stand in the
   only way through. `wanderCuts` is the set of tiles that would cut the world; the wander filter
   refuses them, the same way it already refuses a tram's path. It is computed the first time a
   wanderer in that world wants to move — only four worlds ever have one — and thrown away when the
   city grows, because growth changes what a corridor is. */
function wanderCuts(id){
  const w=WORLDS[id];if(!w)return null;
  if(w._cuts)return w._cuts;
  const ok=(x,y)=>x>=0&&y>=0&&x<w.W&&y<w.H&&!SOLID.has(w.grid[y][x]);
  const all=[];for(let y=0;y<w.H;y++)for(let x=0;x<w.W;x++)if(ok(x,y))all.push([x,y]);
  const reach=(bx,by)=>{const st=all.find(([x,y])=>!(x===bx&&y===by));
    if(!st)return 0;const seen=new Set([st[0]+","+st[1]]),q=[st];
    while(q.length){const[x,y]=q.pop();
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{const nx=x+dx,ny=y+dy,k=nx+","+ny;
        if(seen.has(k)||!ok(nx,ny)||(nx===bx&&ny===by))return;seen.add(k);q.push([nx,ny]);});}
    return seen.size;};
  const base=reach(-1,-1),out=new Set();
  all.forEach(([x,y])=>{if(reach(x,y)<base-1)out.add(x+","+y);});
  w._cuts=out;return out;}
/* a person who wanders is a temporary obstacle; a person who never moves is furniture. The
   auditor needs to know the difference, and the grid only says "N", so ask the pack who is there. */
function whoAt(id,x,y){const w=WORLDS[id];if(!w)return null;
  return (w.npcs||[]).find(n=>n.x===x&&n.y===y)||null;}
function wanderUpdate(dt){
  const w=CW();if(!w||!$("card").hidden||!$("reader").hidden)return;
  const now=performance.now();
  w.npcs.forEach(n=>{
    if(n.mv){
      n.mt=Math.min(1,(n.mt||0)+dt/WANDER_MS);
      n.fx=n.x+(n.mv[0]-n.x)*n.mt;n.fy=n.y+(n.mv[1]-n.y)*n.mt;
      if(n.mt>=1){
        if(w.grid[n.y])w.grid[n.y][n.x]=w.rows[n.y][n.x]; /* #192: the glyph the map had, not "." —
          the same answer removeChill() gives seventy lines below. Nothing in Meridian is decorated
          inside a wander pen today, so this was invisible; it bites the first pack whose neighbour
          walks past a tree. */
        n.x=n.mv[0];n.y=n.mv[1];n.fx=n.x;n.fy=n.y;petalDrop(world,n.x,n.y,n);
        if(w.grid[n.y])w.grid[n.y][n.x]="N";
        n.mv=null;n.wnext=now+1600+Math.random()*3200;}
      return;}
    if(!wanders(n)||now<n.wnext)return;
    if(Math.abs(n.x-px)+Math.abs(n.y-py)<=1){n.wnext=now+1500;return;}
    const opts=[[1,0],[-1,0],[0,1],[0,-1]].map(d=>[n.x+d[0],n.y+d[1]]).filter(([x,y])=>
      x>=0&&y>=0&&x<w.W&&y<w.H&&!SOLID.has(w.grid[y][x])&&w.grid[y][x]!=="N"
      &&!DOORSET.has(w.rows[y][x])
      /* ...and not into the path of a tram. The owner, 2026-09-11: "lets make the road wider and
         RARELY have characters interrupt the tram." Rarely, not never — somebody already standing on
         the line when a car appears still stops it, and should. This is the other half: a person
         does not step in FRONT of one. Same question every animal in this engine now asks, and the
         last mover in the game that was not asking it. */
      &&!troDanger(world,x,y)
      /* ...and not into the only way through. R11: this filter asked four questions — solid?
         door? tram? in range? — and never asked whether the step CUTS THE MAP IN TWO, which is
         the one that strands a player behind somebody's back. */
      &&!(wanderCuts(world)||new Set()).has(x+","+y)
      &&Math.abs(x-n.hx)+Math.abs(y-n.hy)<=WANDER_R
      &&!(x===px&&y===py));
    if(!opts.length){n.wnext=now+2500;return;}
    const t=opts[(Math.random()*opts.length)|0];
    n.face=t[0]>n.x?1:t[0]<n.x?-1:n.face;
    n.mv=t;n.mt=0;
  });
}
/* the free test, made deterministic: a person the pack placed with nowhere to step is a map
   bug, and it is caught at boot rather than whenever a random walk happens to notice. */
function auditWander(){const bad=[];
  Object.entries(WORLDS).forEach(([id,w])=>w.npcs.forEach(n=>{
    if(!wanders(n))return;
    const ok=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const x=n.x+dx,y=n.y+dy;
      return x>=0&&y>=0&&x<w.W&&y<w.H&&!SOLID.has(w.grid[y][x])&&w.grid[y][x]!=="N";});
    if(!ok)bad.push(id+":"+(n.npc||n.key)+"@"+n.x+","+n.y);}));
  return bad;}
/* ---------- chill townsfolk ----------
   Chat-only characters with no quests — they just vibe. The content pack ships some
   (CHILL) and the owner can create more in admin mode (➕ brush, stored per device).
   Name one after somebody legendary and the barrio reacts: EGGS maps lowercase name
   triggers to reaction lines (and dog:true eggs join as a critter instead). */
const CHILLN={},CHILLEGG={};let chillSeq=0;
const EGGSAFE=typeof EGGS!=="undefined"?EGGS:{};
/* the star dog's name as it stands NOW (#264). An egg that declares star:true answers to it, whatever
   the pool or the player made it, instead of to fixed triggers. Set where he is named (boot) and renamed
   (the paw menu); null in a game that marks no star, where no such egg ever wakes. */
let starNow=null;
const DEFACT=["💬","☕"]; /* fallback activity emotes for anyone NPCACT does not name */
function drawEmote(n,sx,sy){ /* shared by every camera — townsfolk stay busy from any angle */
  /* a dog romping round their feet: they laugh, and for that long it is the one thing over their head
     (owner, 2026-09-29: "chasing after another character" — play, never a flight). Its clock is the
     loop's, the one the romp set it by, not the trade's; and it comes BEFORE the trade's window, which
     is left exactly as its own guard reads it (test/smoke.js, grep `the job-icon window`). */
  if(n.laughUntil>performance.now()){ctx.font="10px serif";ctx.textAlign="center";
    ctx.fillText("😄",sx+25,sy+1);ctx.textAlign="start";return;}
  const acts=(typeof NPCACT!=="undefined"&&NPCACT[n.npc])||DEFACT;
  const nw=Date.now(),ph=((nw/1000)+n.x*7.3+n.y*13.7)%13;
  /* Drawn BESIDE the ❗ now, never instead of it (owner, 2026-09-03: "its hard to tell
     people apart"). The `else` on all four camera paths meant the 28 people who give you
     work were the only ones in town whose trade you never saw. The window widened from
     2.4s of every 13 to 6s: this icon is now identity, not decoration. */
  if(ph>=6)return;
  const em=acts[Math.floor((nw/13000+n.x+n.y)%acts.length)];
  ctx.font="10px serif";ctx.textAlign="center";
  ctx.globalAlpha=ph<0.3?ph/0.3:ph>5.7?(6-ph)/0.3:1;
  ctx.fillText(em,sx+25,sy+1-Math.sin(ph*2.1)*1.6);
  ctx.globalAlpha=1;ctx.textAlign="start";
}
function eggFor(name){const n=String(name||"").toLowerCase();let hit=null;
  /* the star's own legend first, and by his WHOLE name: a short pool name must not wake inside a longer one */
  const s=starNow&&starNow.toLowerCase(),padded=" "+n.replace(/\s+/g," ")+" ";
  if(s)Object.entries(EGGSAFE).forEach(([k,e])=>{if(!hit&&e.star&&padded.includes(" "+s+" "))hit=k;});
  Object.entries(EGGSAFE).forEach(([k,e])=>{if(!hit&&!e.star&&(e.triggers||[]).some(t2=>n.includes(t2)))hit=k;});
  return hit;}
/* an egg's lines in this language; a line written as a function is said with the star's name as it is
   now (or, in a game with no star, the name of whoever woke it) */
function eggLines(k,who){const e=EGGSAFE[k];if(!e||!e.lines)return [];
  return (e.lines[lang]||[]).map(l=>typeof l==="function"?l(starNow||who||""):l);}
function addChill(c){ /* {name:{en,es},world,x,y,look} → chat NPC; returns key or null */
  const w=WORLDS[c.world];if(!w)return null;
  const x=c.x|0,y=c.y|0;
  if(x<0||y<0||x>=w.W||y>=w.H)return null; /* edge tiles are fine — worlds like ex have no wall border */
  if(SOLID.has(w.grid[y][x])||w.grid[y][x]==="N")return null;
  const key="~c"+(chillSeq++);
  CHILLN[key]={en:c.name.en,es:c.name.es};
  NPCLOOK[key]=c.look;
  const eg=eggFor(c.name.en);if(eg&&!EGGSAFE[eg].dog)CHILLEGG[key]=eg;
  w.npcs.push({key,x,y,npc:key,q:[],chat:1});
  w.grid[y][x]="N";
  return key;}
function removeChill(key){ /* the inverse addChill never had — a person the record placed goes home */
  for(const id of Object.keys(WORLDS)){const w=WORLDS[id],i=w.npcs.findIndex(n=>n.key===key);
    if(i<0)continue;const n=w.npcs[i];w.npcs.splice(i,1);
    if(w.grid[n.y]&&w.grid[n.y][n.x]==="N")w.grid[n.y][n.x]=w.rows[n.y][n.x]; /* the glyph the map had, not "." */
    delete CHILLN[key];delete NPCLOOK[key];delete CHILLEGG[key];return true;}
  return false;}
const CHILLAT={}; /* a caller's own id → {key,world,x,y}: what it has standing, so it can be MOVED */
function syncChill(want){
  /* The whole desired set at once, keyed by the caller's own stable id. Adds the new, removes the
     gone, and MOVES the ones whose tile changed. The third of those is why this exists: addChill
     and removeChill cannot express a move between them, so every caller hand-rolls the diff — and
     the first one to try it got it wrong in a way nothing could see.
     What it got wrong: it evicted a body when its ROOM changed and never when its SLOT did. So in
     El Changarrito, filing a second issue of the same tier put it first in the order, onto a tile
     the previous one was still standing on; addChill refuses a tile already marked "N"; and the
     newcomer landed NOWHERE, while people, HUDFACT and the console all went on reporting it
     standing. A reload cured it, so it survived unseen for weeks.
     THE ORDERING IS THE WHOLE POINT. Every removal happens before any addition, because a body
     still on a tile blocks whoever is moving onto it. Two loops, never interleaved.
     Returns {id: key} for everyone still standing, so a caller can decorate the npc it just
     placed. A pack that never calls this is untouched — CHILLAT stays empty and nothing moves. */
  const list=Array.isArray(want)?want.filter(c=>c&&c.id!==undefined&&c.name&&c.world):[];
  const by={};list.forEach(c=>{by[String(c.id)]=c;});
  Object.keys(CHILLAT).forEach(id=>{const at=CHILLAT[id],c=by[id],w=WORLDS[at.world];
    /* w.npcs is the truth; CHILLAT is only a hint. addChill and removeChill are still public verbs,
       so a pack may take one of these people off the map by hand. Trusting the hint left this
       function certain somebody was standing on a tile nobody was standing on: it skipped the add,
       handed back a key with no person behind it, and the caller recorded a placement for a body
       that did not exist — the same sentence as the bug this whole verb was written to remove.
       Found by Beto reviewing the first version of it, and measured: place, removeChill by hand,
       place the same set again, and the person never came back. */
    const here=!!(w&&w.npcs.some(n=>n.key===at.key));
    if(here&&c&&c.world===at.world&&(c.x|0)===at.x&&(c.y|0)===at.y)return;
    if(here)removeChill(at.key);
    delete CHILLAT[id];});
  const keys={};Object.keys(CHILLAT).forEach(id=>{keys[id]=CHILLAT[id].key;});
  list.forEach(c=>{const id=String(c.id);if(CHILLAT[id])return;
    const key=addChill(c);
    if(key){CHILLAT[id]={key,world:c.world,x:c.x|0,y:c.y|0};keys[id]=key;}});
  return keys;}
(typeof CHILL!=="undefined"?CHILL:[]).forEach(c=>addChill(c));
/* ---------- the room interview seam ----------
   A pack may declare INTERVIEW (content/<pack>/room.js): people who stand in a room and
   ask questions with no right answer, whose answers become a plain sheet the player
   can copy. The engine reads only SHAPES — hosts, steps, opts, ui — never a name. A
   pack that declares nothing gets nothing: no people, no tab, no storage key (the off-switch law). Owner, 2026-09-02: "[partner] can interact through the characters ... i dont want an
   api setup" — the sheet IS the back-and-forth. */
const RM=()=>(typeof INTERVIEW!=="undefined"&&INTERVIEW&&Array.isArray(INTERVIEW.hosts)&&INTERVIEW.ui)?INTERVIEW:null;
const RMU=()=>{const r=RM();return r?(r.ui[lang]||r.ui.en||{}):{};};
const roomHosts={}; /* chill key → host declaration */
let roomAns={};      /* "host:step" → {pick|text|out, hist[]} — per device, never in the save */
try{if(RM()){const r0=JSON.parse(localStorage.getItem(SK("room"))||"{}");
  if(r0&&typeof r0==="object"&&r0.a&&typeof r0.a==="object")roomAns=r0.a;}}catch(e){}
function roomPersist(){if(!RM())return;
  mqStore(SK("room"),JSON.stringify({v:1,a:roomAns}),true);}   /* CRITICAL: her own answers */
(RM()?RM().hosts:[]).forEach(h=>{const k=addChill(h);if(k)roomHosts[k]=h;
  else console.warn("ROOM host "+h.id+" cannot stand at "+h.world+" ("+h.x+","+h.y+") — solid or taken");});
const roomPending=n=>{const h=roomHosts[n.npc];return !!h&&h.steps.some(s=>!roomAns[h.id+":"+s.id]);};
const chillLines=k=>{
  if(CHILLEGG[k])return eggLines(CHILLEGG[k],CHILLN[k]&&CHILLN[k].en);
  if(String(k).startsWith("~c"))
    return T().chill.concat(typeof CHATTER!=="undefined"?CHATTER[lang]||[]:[]);
  return null;};
/* boot-time world integrity check — malformed maps and bad portals get caught HERE, never in play */
(function validateWorlds(){
  Object.entries(WORLD_DEFS).forEach(([id,rows])=>{
    const L=rows[0].length;
    rows.forEach((r,i)=>{if(r.length!==L)mqwarn("world",id+" row "+i+" width "+r.length+" != "+L,true);});
  });
  Object.keys(WORLDS).forEach(from=>portalsOf(from).forEach(({ch,p})=>{
    const w=WORLDS[p.to];
    if(!w){mqwarn("portal",from+":"+ch+" → missing world "+p.to,true);return;}
    const t=w.rows[p.y]&&w.rows[p.y][p.x];
    if(t===undefined||SOLID.has(t)||w.grid[p.y][p.x]==="N")mqwarn("portal",from+":"+ch+" spawn blocked at "+p.to+" ("+p.x+","+p.y+")",true);
    if(portalAt(p.to,p.x,p.y))mqwarn("portal",from+":"+ch+" spawns ON a portal tile — ping-pong risk",true);
  }));
})();
/* ---- ARRIVALS: every place the game itself STANDS a player ----
   An arrival is a PROMISE, not a tile. A pack declares it on the first byte, and the map does not
   carry it until the district that owns it opens (applyRibbon only stamps when ribbonUp is true),
   so nothing that reads w.rows can ever see one. That is why troBlocked returns [] both at boot and
   grown while four arrivals sit on the rails: it is a snapshot predicate and this is a declaration
   audit. Found by Beto, 2026-09-11, by walking out of the bakery's front door in the real game.
   And the guard that SHOULD have caught it already existed: validateWorlds at :239 asks "is this
   tile SOLID" when it means "is it safe to appear here" — the seventh time in this repo that a
   guard has read a proxy for the thing (docs/REGRESSION.md). */
function arrivals(){const out=[],add=(why,wid,x,y)=>{
    if(wid&&WORLDS[wid]&&x!=null&&y!=null)out.push({why:why,world:wid,x:x|0,y:y|0});};
  add("the hero's own spawn",PL.home,PL.spawn&&PL.spawn[0],PL.spawn&&PL.spawn[1]);
  if(PL.park&&PL.parkIn)add("the way into the park",PL.park,PL.parkIn[0],PL.parkIn[1]);
  ribbons().forEach(r=>{const d=r.doorstep;if(d)
    add((r.id||"a storefront")+"'s handover doorstep",d.world||r.world,d.x,d.y);});
  const gs=GRW().staged;if(gs&&gs.safe)add("the building site's step-out",gs.world,gs.safe.x,gs.safe.y);
  (typeof TRV!=="undefined"?TRV:[]).forEach(t=>add("the trolley pass stop in "+t.w,t.w,t.x,t.y));
  Object.keys(WORLDS).forEach(from=>portalsOf(from).forEach(function(e){
    add("the door "+from+":"+e.ch,e.p.to,e.p.x,e.p.y);}));
  return out;}
/* ...and none of them may stand you on a line a vehicle runs down. You appear in front of the tram,
   it brakes for you (troAhead), and troUpdate resets its hold timer every frame you are there — so
   it never starts again until you move, and nothing told you that you were the reason. */
function arrivalsOnRails(){return arrivals().filter(function(a){const L=troLine(a.world);
    return !!L&&a.y===L.row&&a.x>=Math.min(L.from,L.to)&&a.x<=Math.max(L.from,L.to);})
  .map(function(a){return a.why+" stands the player on the trolley's own line in "+a.world+
    " ("+a.x+","+a.y+") — you arrive on the rails, and the tram stops short of you and will not go on until you move";});}
/* ---- what the pack SAID about its trolley line, read back to it once, out loud ----
   The PLDEF lesson (docs/TAGS.md L16): a pack that declares NOTHING is in good shape, and a pack
   that declares HALF is the one that gets hurt — so an omitted `stops` is legal and silent, and
   every other way of getting it wrong is named here. A word this engine does not read is the
   loudest of all: it is the one where somebody wrote a line, saw nothing happen, and had no way to
   find out why. Every key added to the seam joins TROKEYS in the same commit as its reader. */
const TROKEYS=["world","row","from","to","stops","cars"];
function troAudit(){const out=[],lines=(typeof TROLLEYAT!=="undefined"&&TROLLEYAT)?TROLLEYAT:[],seen={};
  lines.forEach(function(L){if(!L||!L.world)return;
    const w=WORLDS[L.world],at=function(s){return L.world+" ("+s.x+","+s.y+")";};
    if(seen[L.world])out.push("the trolley line in "+L.world+" is the second one declared there, and only the first one ever runs");
    seen[L.world]=true;
    Object.keys(L).forEach(function(k){if(TROKEYS.indexOf(k)<0)
      out.push("the trolley line in "+L.world+" declares "+k+", which this engine does not read — whatever it was meant to do, nothing does it");});
    /* ...and a TRAIN says how many cars, in words a person wrote by hand and can get wrong. `cars`
       is read by troCars, which floors it and caps it at TRO_CARS_MAX so a typo cannot hang the line;
       this is the half of the seam that says so out loud instead of silently running a different
       train from the one that was declared. The length test is the one that matters: a train needs
       street enough to stand clear of both ends of its own run, and the run is what `from`/`to` say. */
    if("cars" in L){const c=L.cars;
      if(typeof c!=="number"||!isFinite(c)||c<1||Math.floor(c)!==c)
        out.push("the trolley line in "+L.world+" declares cars="+JSON.stringify(c)+", which is not a whole number of cars — it runs one car");
      else if(c>TRO_CARS_MAX)
        out.push("the trolley line in "+L.world+" declares a train of "+c+" cars and this engine couples at most "+TRO_CARS_MAX+" — the rest never appear");}
    if(!w)return;
    const a=Math.min(L.from,L.to),b=Math.max(L.from,L.to);
    if(troCars(L)>1&&troSpan(L)>b-a+1)
      out.push("the trolley line in "+L.world+" runs a train "+troSpan(L).toFixed(2)+" tiles long on a run of "+(b-a+1)+
               " — it is longer than its own line, so it can never stand clear of either end and the run never finishes");
    troStops(L).forEach(function(s){const g=w.grid[s.y]&&w.grid[s.y][s.x];
      if(g===undefined){out.push("the trolley stop in "+at(s)+" is off the edge of the map");return;}
      if(SOLID.has(g)||g==="N")out.push("the trolley stop in "+at(s)+" is inside something — nobody can stand at it");
      if(s.y===L.row)out.push("the trolley stop in "+at(s)+" stands on the trolley's own rails — the pass opens under the tram, and the tram brakes for whoever opened it");
      else if(Math.abs(s.y-L.row)>1||s.x<a-1||s.x>b+1)out.push("the trolley stop in "+at(s)+" is out of reach of the line it serves — nobody can tell what it is");
      if(s.x<a||s.x>b)out.push("the trolley stop in "+at(s)+" is past the end of the run its own line declares ("+a+" to "+b+")");});});
  return out;}
/* full-universe reachability audit: BFS from the hero's spawn across every world THROUGH portals.
   Guarantees: every walkable tile is reachable, and every character always has a reachable adjacent tile. */
/* `grown`: audit a city with every lot raised, where NOTHING may be unreachable. Left off, a world
   nothing reaches is skipped, because at a fresh boot seven of Meridian's fifteen worlds are behind
   doors the city has not built yet and that is correct. Left off FOREVER, which is what it was, the
   audit could not see a district fall off the map: delete one portal line and Taller Herrera leaves
   the city — 161 walkable tiles, three people, eight quests — and this function returned []. Worse,
   severing the door TILE instead reported "st: 5 walkable tiles unreachable", the leftover pocket of
   pavement, pointing away from the fault. (#155; the owner: "do fix the part where a missing world
   wouldn't register.") */
function auditReach(grown){
  const probs=[],seen={};Object.keys(WORLDS).forEach(k=>seen[k]=new Set());
  /* A PERSON WHO MOVES IS NOT A WALL. Reachability is a property of the ground, and `"N"` was
     being read as masonry by an auditor that has never looked at a person in its life — so one
     neighbour standing in a gap reported thirty-five tiles and a named woman as permanently
     unreachable, about one run in twenty-five. A wanderer is passable here because they will not
     be there in four seconds; somebody `still` is not, because they never move and the map really
     does have to work around them. */
  const walk=(id,x,y)=>{const w=WORLDS[id];
    if(x<0||y<0||x>=w.W||y>=w.H||SOLID.has(w.grid[y][x]))return false;
    if(w.grid[y][x]!=="N")return true;
    const n=whoAt(id,x,y);return !!n&&wanders(n);};
  /* seed EVERY declared arrival, not just the spawn. The park has no portal — the leash carries you
     there — so it had zero reached tiles at every boot and was therefore never audited at all. An
     arrival a pack declares is a way in, whether or not it is a door. */
  const q=[];
  const seed=(id,x,y)=>{if(WORLDS[id]&&walk(id,x,y)&&!seen[id].has(x+","+y)){seen[id].add(x+","+y);q.push([id,x,y]);}};
  seed(PL.home,PL.spawn[0],PL.spawn[1]);
  if(PL.park&&PL.parkIn)seed(PL.park,PL.parkIn[0],PL.parkIn[1]);
  while(q.length){const[idw,x,y]=q.shift();
    const pp=portalAt(idw,x,y);
    if(pp){const p=pp,key=p.x+","+p.y;
      if(!seen[p.to].has(key)&&walk(p.to,p.x,p.y)){seen[p.to].add(key);q.push([p.to,p.x,p.y]);}}
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{const nx=x+dx,ny=y+dy,key=nx+","+ny;
      if(!seen[idw].has(key)&&walk(idw,nx,ny)){seen[idw].add(key);q.push([idw,nx,ny]);}});}
  Object.entries(WORLDS).forEach(([id,w])=>{
    if(seen[id].size===0){
      /* nothing reaches it. Before the city is grown that is ordinary — the lot is not built yet.
         With every lot raised it means the place has fallen off the map, and it is said in the
         words a person would use, naming who is stranded, because "0 tiles reachable" reads like
         a rounding error and three people waiting does not. */
      if(grown){const who=w.npcs.map(n=>n.npc);
        probs.push(id+" is on the map and no way leads into it"+(who.length?" — "+who.join(", ")+" "+(who.length===1?"is":"are")+" in a room nobody can walk into":""));}
      return;}
    w.npcs.forEach(n=>{const ok=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>seen[id].has((n.x+dx)+","+(n.y+dy)));
      if(!ok)probs.push("NPC unreachable: "+n.npc+" in "+id);});
    let un=0;
    for(let y=0;y<w.H;y++)for(let x=0;x<w.W;x++)if(walk(id,x,y)&&!seen[id].has(x+","+y))un++;
    if(un)probs.push(id+": "+un+" walkable tiles unreachable");
  });
  return probs;
}
auditReach().forEach(p=>mqwarn("reach",p,true));
/* ---------- chapters ----------
   A chapter is a district's quest pack plus how many of them close it. Both live in
   content (config.js): `need` is deliberately lower than the pack size, so the city
   stays a template — retune the bar there, never here. */
const CHS=()=>(typeof CHAPTERS!=="undefined"&&CHAPTERS.length)
  ?CHAPTERS:[{id:"all",quests:QEN.map((_,i)=>i),need:QEN.length}];
/* A DISTRICT CLOSES ON A COUNT — AND, IF IT NAMES ONE, ON A PARTICULAR QUEST (#208).
   It was the count alone, so a district's LAST VISIT was optional: with `need:5` of 8, any five
   answers fired the ending while the closing quest stayed open with a ❗ over the person who asks
   it. La Espiga told you how its story ended and then Doña Licha was still standing there asking
   the question the ending had already answered — and the page the ending says is above the oven is
   pinned there in that quest's own outcome, so on a skip the ending claimed a thing nobody wrote.
   So a district closes on its count AND on the visit that ENDS it. You may still skip anything
   else — ❗La puerta's rule holds, a full sweep is never required, and HQ is still a place you can
   come back to. The quest that ends a district is the LAST ONE IT LISTS, which is a rule and not a
   guess: the array is the order the district is written in, and its last entry is its last visit in
   all seven of Meridian's. A pack that orders its quests some other way says `close:<index>`; a
   pack that wants the old pure count says `close:null`. Nothing is written down twice. */
const chClose=c=>c.close!==undefined?c.close:((c.quests&&c.quests.length)?c.quests[c.quests.length-1]:null);
const chClosed=c=>{const k=chClose(c);
  return c.quests.filter(i=>done.has(i)).length>=c.need&&(k===null||done.has(k));};
/* `chSeen` is how far the city has GROWN — the newest district that has opened.
   It is not a cursor that closes things behind you. A district reaching its `need`
   plays its ending beat and breaks ground on the next lot; its quests stay open
   forever. Owner's law (docs/OWNER.md, 2026-09-01): no practice is ever missed. */
/* ---------- stakes and the grade ----------
   The GRADE is always on: every attempt at a quest is counted, the counts make a
   district's grade, and the grade picks which ending it plays. It never blocks.
   STAKES are a separate optional layer on top — `none` by default. Neither may take
   progress, the city or the save, and neither may harm a character (docs/OWNER.md). */
const STK=()=>(typeof STAKES!=="undefined"&&STAKES)?STAKES:{mode:"none",hearts:3};
let stakesAdmin=null;                       /* admin override, per device, never in the save */
try{const m=localStorage.getItem(SK("stakes"));if(m)stakesAdmin={mode:m};}catch(e){}
function stakesCfg(){
  if(stakesAdmin)return{...STK(),...stakesAdmin};
  const L=CHS(),c=L[Math.min(chSeen,L.length-1)];
  return (c&&c.stakes)?{...STK(),...c.stakes}:STK();
}
/* `budget` is declared in content but not implemented — it reads as `none` until built */
const stakesMode=()=>{const m=stakesCfg().mode;return m==="hearts"?"hearts":"none";};
const livesOn=()=>stakesMode()==="hearts";
const startHearts=()=>stakesCfg().hearts||3;
/* marks: quest index -> attempts taken. 1 = first try. This is the grade's raw data. */
let marks={};
/* a district's grade out of 3, from how many of its answered quests landed first try */
function gradeOf(c){
  const ans=(c&&c.quests||[]).filter(i=>done.has(i));
  if(!ans.length)return 3;
  const clean=ans.filter(i=>(marks[i]||1)===1).length/ans.length;
  return clean>=0.9?3:clean>=0.6?2:1;
}
function gradeAll(){
  const ans=Object.keys(marks).map(Number).filter(i=>done.has(i));
  if(!ans.length)return 3;
  const clean=ans.filter(i=>marks[i]===1).length/ans.length;
  return clean>=0.9?3:clean>=0.6?2:1;
}
/* ENDLESS: a place you inhabit has no last visit (Nacho; the owner: "i dont think it ends").
   A pack may declare `ENDLESS=true` and the ending panel never fires — no epilogue, no title, no
   "claim your reward". This mattered more than it sounds: a pack that declares no CHAPTERS gets
   the synthesised one above, so El Changarrito — the owner's own backlog as a street, with a
   single quest in it — ran Meridian's LAST-DAY EPILOGUE the moment he answered Don Güero. Doña
   Chelo counting the drawer at El Mercado Robles, in a town that has no mercado and no Chelo.
   Meridian declares nothing and ends exactly as it always has. */
/* TWO questions, and they had been one. "Has this district finished, so the next should open?"
   is about the CITY. "Does a curtain play?" is about the CEREMONY. `ENDLESS` switched off the
   ceremony — and the ceremony was carrying the city, because the ending panel's button was the only
   writer of `chSeen` in the engine. So an endless pack with two districts sat in district one
   forever, silently: no quests from district two, no storefront, no growth, and no error to read.
   The town never noticed because it declares no CHAPTERS and gets one synthesised district.
   Tavo and Nacho reached the same first move independently, from opposite ends:
   "that is a coupling bug, not a design flaw in pushing." (#156, docs/TAGS.md L12.) */
const chOpenDue=()=>{const L=CHS();return chSeen<L.length&&((livesOn()&&hearts<=0)||chClosed(L[chSeen]));};
const chDue=()=>!(typeof ENDLESS!=="undefined"&&ENDLESS)&&chOpenDue();
/* the city grows by one district. The ONLY writer of chSeen outside loading a save and starting
   over — which is what makes the pair above safe to reason about. */
function chAdvance(){
  if(chSeen>=CHS().length)return false;
  chSeen=Math.min(chSeen+1,CHS().length);applyGrowth();return true;}
/* which district a quest belongs to; -1 for quests that belong to none */
const qChapter=qi=>{const L=CHS();for(let i=0;i<L.length;i++)if(L[i].quests.indexOf(qi)>=0)return i;return -1;};
/* Districts open and stay open. A quest is on offer once its district has opened
   (`c<=chSeen`) and from then on forever — answering it late is always allowed.
   `c<0` is a quest belonging to no district (Frederick's), always on offer.
   This was `c>=chSeen`, which had it backwards: it closed everything you walked
   past and left unopened districts nominally answerable. */
const qOpen=qi=>{const c=qChapter(qi);return c<0||c<=chSeen;};
/* Answering a quest long after its district played its last visit. Content may give any
   quest a `late` line for this — one line, in the NPC's voice, acknowledging only that
   time passed and never what happened in it (a reframe that names events goes stale
   itself). Quests belonging to no district (Frederick's) never count as late. */
const qLate=qi=>{const c=qChapter(qi);return c>=0&&c<chSeen;};
/* GROWTH is content's declaration of what the city builds as it is earned. The engine
   knows the mechanism and never the names — see content/meridian/config.js. */
const GRW=()=>(typeof GROWTH!=="undefined"&&GROWTH)?GROWTH:{};
/* a district's storefront ribbon is up once that district has opened. Was
   `mercadoOpen`, which named one pack's business inside the shared engine. */
const ribbons=()=>{const g=GRW();return g.ribbons||(g.ribbon?[g.ribbon]:[]);}; /* the old singular `ribbon` still works */
/* ribbonUp(r): is THIS storefront up; ribbonUp(): is ANY. It used to hold exactly one —
   the city stopped at one storefront (owner, 2026-09-02). */
const ribbonUp=r=>r?(!!(r&&r.tiles)&&chSeen>=r.district):ribbons().some(x=>ribbonUp(x));
/* ---------- state ---------- */
const SHIRTS={architect:"#E0A430",diplomat:"#8B5CF6",operator:"#2AA47C"};
let lang="en";try{lang=localStorage.getItem(SK("lang"))||"en";}catch(e){}
let chSeen=0,replayTimer=null;
let handedDocs=new Set(); /* paper a person has actually held out to you, so the office file
   records what you were GIVEN as exactly as it records what you wrote (saved as `hd`) */
let seenOpen=new Set(); /* opening toasts this save has heard, so a lot that opened while the phone was away is announced once (saved as `so`) */
let xp=0,hearts=3,cls="",heroName="Rookie",look={shirt:"#8B5CF6",skin:"#E5AC82",hair:"#26202B",style:"cap",outfit:"casual"},done=new Set(),cur=null,curQ=null,node=null,treats=0,fredQ=0,qLvl0=0;
/* retry-until-correct: `done` = answered right; `qa` maps quest -> best XP already
   awarded across attempts (retries only pay the difference, so nothing farms) + doubles
   as the "attempted" marker; runXP accumulates within the current attempt */
let qa={},runXP=0;
function awardXP(amt){runXP+=amt;const k=cur,prev=qa[k]||0;
  if(runXP>prev){xp+=runXP-prev;qa[k]=runXP;}else qa[k]=prev;}
let px=10,py=11,fx=10,fy=11,dir="down",moving=false,mt=0,held=null,bob=0;
let warpT=0,portalT=0; /* post-warp grace: warpT blocks input, portalT blocks re-triggering — kills door ping-pong */
let portalHold=""; /* the tile a warp SET YOU DOWN on ("world:x,y"): tryPortal ignores it until you step off */
/* Frederick's wardrobe — Xochi's collar line. Cosmetics are data; drawDog reads `wear`. */
const WEAR={bandana:["#C0392B","#7A3FE0","#E0B45C","#2AA47C","#3E8ED0"],
            collar:["#E0B45C","#C0392B","#7A3FE0","#2AA47C"],
            cape:["#7A3FE0","#C0392B","#2C5FA8"]};
let wear={bandana:null,collar:null,cape:null};
let wearCat={bandana:null,collar:null}; /* Canela: no cape — physics and dignity both object */
const $=id=>document.getElementById(id);
/* NET seam — the server pivot point. Deliberately empty: the cartridge model keeps
   everything on-device today, but a future game (multiplayer, cloud saves) plugs a
   backend in HERE and nowhere else. boot() = connect/auth once at startup;
   sync(state) = called after every save with the full save blob. See docs/IDEAS.md §4. */
const NET={enabled:false,boot(){},sync(state){}};
/* Co-presence hook: peers render like NPCs. Empty until NET fills it. Peer shape:
   {id,name,w,x,y,dir,look} — treat every field as UNTRUSTED network data: names are
   length-clamped and drawn as canvas text only (never DOM). NOTE (2026-09-05 review): looks
   are NOT validated on this path yet — `p.look` reaches drawPerson raw — so whatever fills
   PEERS must run each look through the save loader's colour checks first. PEERS are also not
   drawn in the iso camera. See docs/IDEAS.md §4 and docs/story/el-changarrito.md §4 B1. */
let PEERS=[];
/* RECORD seam — the city's record (docs/story/la-ventanilla.md §4, el-changarrito.md §4).
   A pack may declare RECORDSRC = {enabled, boot()}: the engine calls boot() once after NET and
   never again. What the record holds and where it comes from is the pack's business — a
   same-origin file, or an API the pack's OWN index allows (the public build's CSP allows
   neither, by test). People a record places come and go through addChill()/removeChill();
   a placed person may carry a `doc` (an inline document for docOpen) and then wears the mark,
   stands still, and opens it when talked to. The engine never learns what a permit is. */
const RECORD=(typeof RECORDSRC==="object"&&RECORDSRC)||{enabled:false,boot(){}};
/* the game's name is the pack's (config.js GAMENAME); the engine prints it and never owns it */
const GN=()=>typeof GAMENAME==="string"?GAMENAME:"";
const T=()=>UI[lang];
const AQ=()=>lang==="es"?QES:QEN;
const npcName=k=>CHILLN[k]?CHILLN[k][lang]:NPCN[lang][k];
const shortName=k=>String(npcName(k)||"").split(" ·")[0];   /* the name without its job title */
const sayAs=(k,line)=>{const n=shortName(k);return "💬 "+(n?n+": ":"")+line;}; /* every spoken line is signed */
const lvlIdx=()=>{let i=0;LEVELS.forEach((t2,j)=>{if(xp>=t2)i=j;});return i;};
const lvlName=()=>T().levels[lvlIdx()];
/* THE STRIP AT THE DOOR. A quest game earns a score; a place you inhabit does not. Rosa, on the
   town's front door describing Meridian: whatever XP counts, it teaches — and in a backlog neither
   filing more nor closing more is reliably good, while a permanent `0 XP` is a verdict delivered
   at the door every session. So a pack may declare `HUDFACT`, a function returning what is true
   right now instead of what you have earned. A fact must be able to go DOWN as well as up, and
   neither direction is praised. Return "" and the strip stays empty rather than lying.
   A pack with no HUDFACT keeps the score, the rank and the bar exactly as before — Meridian is a
   quest game and this changes nothing for it. */
function hud(){const hs=livesOn()?("❤".repeat(Math.max(0,hearts))+"♡".repeat(Math.max(0,startHearts()-Math.max(0,hearts)))):"";
  const fact=(typeof HUDFACT==="function")?(()=>{try{return String(HUDFACT()||"");}catch(e){return "";}})():null;
  if(fact!==null){
    $("ptag").textContent=heroName;$("hearts").textContent=hs;$("xp").textContent=fact;
    $("xpbarwrap").hidden=true;                      /* no bar: there is nothing to fill */
    /* and no empty chip in the corner of the world: before the ledger has been read there is
       nothing true to say, so nothing is said */
    $("status").textContent=fact;$("status").hidden=!fact;return;}
  $("ptag").textContent=`${heroName} · ${lvlName()}`;$("hearts").textContent=hs;$("xp").textContent=`${xp} XP`;
  $("xpfill").style.width=Math.min(100,xp/MAXXP*100)+"%";
  $("status").textContent=`${hs}  ${xp}XP`.trim();$("status").hidden=false;}
/* save */
function save(){const st={n:heroName,c:cls,lk:look,xp,he:hearts,d:[...done],px,py,tr:treats,fq:fredQ,w:world,wr:wear,wc:wearCat,qa,cs:chSeen,mk:marks,so:[...seenOpen],hd:[...handedDocs],bl:bldPicks,v:2,hairV:2};  /* hairV 2: "long" means long hair, not the beard it used to draw (#132) */
  const kept=mqStore(SK("1"),JSON.stringify(st),true);   /* CRITICAL: this is their afternoon */
  if(NET.enabled)NET.sync(st);
  return kept;}   /* callers can ask whether it actually went in; the guard does */
/* The ❗ on the world tag means what it means everywhere else: somebody in here has
   something to say. Never a count, never an age (docs/OWNER.md — no practice is ever
   missed, and a badge with a number on it is a backlog). It was hardcoded to hq, so
   the office kept promising a quest long after its last one was answered. */
const worldPending=id=>(WORLDS[id]?WORLDS[id].npcs:[]).some(n=>hasSay(n));
function setWorldTag(){$("worldTag").textContent=T().locs[world]+(worldPending(world)?" · ❗":"")+(typeof destBearing==="function"?destBearing():"");}
/* Boundary sanitizer: every save that crosses a trust boundary — Trolley Pass links
   today, NET payloads tomorrow — is coerced to known-good shapes here. Numbers clamp,
   strings trim, colors must be hex, unknown keys drop, non-numeric qa keys (e.g.
   "__proto__") are filtered. Local saves pass through it too: corruption-proofing. */
function sanitizeSave(s){
  if(!s||typeof s!=="object")return null;
  const num=(v,lo,hi,d2)=>{v=Number(v);return Number.isFinite(v)?Math.max(lo,Math.min(hi,Math.round(v))):d2;};
  const col=v=>(typeof v==="string"&&/^#[0-9A-Fa-f]{3,8}$/.test(v))?v:null;
  const str2=(v,m2,d2)=>(typeof v==="string"&&v)?v.slice(0,m2):d2;
  const n=str2(s.n,14,"");if(!n)return null;
  const lkIn=(s.lk&&typeof s.lk==="object")?s.lk:{};
  const lk={shirt:col(lkIn.shirt)||"#8B5CF6",skin:col(lkIn.skin)||"#E5AC82",hair:col(lkIn.hair)||"#26202B",
            style:str2(lkIn.style,12,"cap"),outfit:str2(lkIn.outfit,8,"casual"),pattern:str2(lkIn.pattern,10,"plain")};
  /* #132: "long" used to draw what everyone could see was a beard, and now names real long hair.
     A save that chose it chose the beard, so it keeps the beard — the face in the mirror does not
     change under anyone. Only saves written before this line carry the old meaning; from here on
     "long" is long. */
  if(lk.style==="long"&&!(s.hairV>=2))lk.style="beard";
  const wearIn=k2=>{const o=(s[k2]&&typeof s[k2]==="object")?s[k2]:{};
    return{bandana:col(o.bandana),collar:col(o.collar),cape:col(o.cape)};};
  const d=Array.isArray(s.d)?[...new Set(s.d.map(v=>num(v,0,98,-1)).filter(v=>v>=0))]:[];
  const qa={};
  if(s.qa&&typeof s.qa==="object")Object.keys(s.qa).slice(0,64).forEach(k2=>{
    const ki=num(k2,-1,98,null);if(ki!==null)qa[ki]=num(s.qa[k2],0,99,0);});
  /* cs (districts claimed), mk (grades) and so (opening toasts seen) were NOT carried
     through here, so every Continue reset the district counter to zero: the last ending
     played again on the next open and the grades vanished (owner, 2026-09-03: "it says
     out on the street again"). v stamps a save written after the fix. */
  const mk={};
  if(s.mk&&typeof s.mk==="object")Object.keys(s.mk).slice(0,128).forEach(k2=>{
    const ki=num(k2,0,98,null);if(ki!==null)mk[ki]=num(s.mk[k2],1,3,1);});
  const so=Array.isArray(s.so)?s.so.filter(v=>typeof v==="string").slice(0,32).map(v=>v.slice(0,32)):[];
  const hd=Array.isArray(s.hd)?s.hd.filter(v=>typeof v==="string").slice(0,64).map(v=>v.slice(0,40)):[];
  /* the faces of the houses already built: {buildId:{partId:optionId}}. Pinned so a template
     that gains options later does not reshape a street somebody already knows. */
  const bl={};
  if(s.bl&&typeof s.bl==="object")Object.keys(s.bl).slice(0,200).forEach(k=>{
    if(k==="__proto__"||k==="constructor"||k==="prototype")return; /* a #save= link may not reach the prototype */
    const v=s.bl[k];if(!v||typeof v!=="object")return;const o={};
    Object.keys(v).slice(0,32).forEach(pk=>{if(typeof v[pk]==="string")o[String(pk).slice(0,32)]=v[pk].slice(0,32);});
    o&&(bl[String(k).slice(0,40)]=o);});
  return{n,c:str2(s.c,24,""),lk,xp:num(s.xp,0,999,0),he:num(s.he,0,3,3),d,
    px:num(s.px,0,63,10),py:num(s.py,0,63,11),tr:num(s.tr,0,9999,0),fq:num(s.fq,0,3,0),
    w:str2(s.w,12,PL.home),wr:wearIn("wr"),wc:wearIn("wc"),qa,cs:num(s.cs,0,32,0),mk,so,hd,bl,
    v:s.v===undefined?undefined:num(s.v,0,99,0),
    /* hairV must survive the wash. It is the field that records what "long" MEANS (#132), and
       :473 reads it to decide whether a long-haired hero keeps their hair or is turned back into
       the beard the style used to draw. Dropping it here meant a sanitized save no longer carried
       its own meaning, so a hero who crossed on a Trolley Pass grew a beard on arrival. Found by
       the security crew reading sanitizeSave for injection and noticing a field that goes in and
       does not come out. */
    hairV:s.hairV===undefined?undefined:num(s.hairV,0,9,0)};
}
function loadSave(){try{return sanitizeSave(JSON.parse(localStorage.getItem(SK("1"))||""));}catch(e){return null;}}
/* belt & suspenders: flush progress when the tab is backgrounded or closed (only once a run exists) */
window.addEventListener("pagehide",()=>{if(!$("hud").hidden)save();});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"&&!$("hud").hidden)save();});
function clearSave(){try{localStorage.removeItem(SK("1"));}catch(e){}}
/* toasts */
let toastT=null,toastQ=[];
const tickerLines=[];
/* IS THE WORLD COVERED? The paperwork and every panel open over the page now, so when one is up
   the world behind it is scenery at best. Two things follow: it is not drawn (the loop), and
   nothing that happens out there is announced over the top of what you are reading (below). */
function worldCovered(){
  if(!$("reader").hidden)return true;
  const ps=document.querySelectorAll(".settings");
  for(let i=0;i<ps.length;i++)if(!ps[i].hidden)return true;
  return false;
}
let toastHeld=[],wasCovered=false;   /* what the street said while you were not looking */
function toast(msg,ms,crit){const el=$("toast");el.classList.toggle("crit",!!crit); /* red for what must be discussed sooner (#8) */
  /* The activity record mirrors recent messages so a short interaction can be re-read
     after the toast fades (owner ask). Owner, 2026-09-01: keep the last TWO. Owner,
     2026-09-03: "should only delete after two activities, the timer is too fast" — so
     there is NO timer at all now. A line leaves when two newer lines have pushed it out,
     or when the player taps the record away. It sits on the LEFT rail, under the XP pill,
     where the owner judged it does not crowd the screen. */
  const tk=$("ticker");
  tickerLines.push(msg);while(tickerLines.length>2)tickerLines.shift();
  tk.textContent="";
  tickerLines.forEach((m,i)=>{const d=document.createElement("div");d.textContent=m;
    if(i<tickerLines.length-1)d.className="prev";   /* the older one, dimmed */
    tk.appendChild(d);});
  tk.hidden=false;
  /* Owner: "capture events if happening in background." The trolley still comes and the dog still
     does what it does while you are reading a sheet — but a toast played out behind an opaque panel
     is a message delivered to nobody, and it takes its turn in the queue with it. Held instead, and
     said when you put the paper down. The record above has it either way. */
  if(worldCovered()){toastHeld.push([msg,ms,!!crit]);return;}
  if(el.classList.contains("on")){toastQ.push([msg,ms]);return;}
  el.textContent=msg;el.classList.add("on");
  clearTimeout(toastT);toastT=setTimeout(()=>{el.classList.remove("on");
    if(toastQ.length){const[m,d]=toastQ.shift();setTimeout(()=>toast(m,d),300);}},ms||2600);}
$("ticker").addEventListener("click",()=>{$("ticker").hidden=true;tickerLines.length=0;});
let lastBump=0;
const pendingAt=n=>n.q.find(qi=>!done.has(qi)&&qOpen(qi));
/* "this neighbour has something to say" — the ❗ means one thing forever (STORY.md), and
   a host with an unanswered question has something to say too */
const hasSay=n=>pendingAt(n)!==undefined||roomPending(n)||!!(n&&n.doc); /* a document to hand you counts as something to say */
/* ---------- canvas ---------- */
const cv=$("cv");let ctx=cv.getContext("2d"); /* let: the 3D baker borrows ctx to render tile art into textures */
const VW=10*TS,VH=8*TS;
/* THE FLOOR FOR IN-SCENE TEXT (Rosa's 3D note; the owner: "i say best practices").
   Text painted into the world is drawn in tile units — 32 to a tile — and then the camera decides
   how big that lands. Measured on a phone: one tile is about 90 device pixels in 3D and about 66
   in the flat cameras, so a unit is roughly 2.1–2.8 device pixels, or about one CSS pixel. A glyph
   authored at 5.5 units therefore arrives around FIVE CSS pixels tall, which is not small type, it
   is texture that used to be words.
   The rule this project follows, which is what the standards actually say once you separate the
   two cases:
     · Text that carries information may never exist ONLY in the scene. A sign is allowed to be
       unreadable at a distance the way a real sign is, but whatever it says must also be reachable
       by walking up to it, or on a board, or in the index. WCAG exempts incidental text and text
       that is part of a picture for exactly this reason — the obligation is on the information,
       not on the pixels.
     · Text that is MEANT to be read in the scene is authored at SCENE_MIN units or more. Below
       that the letters stop resolving in every camera and at every screen size we ship, so a
       smaller number is never a legitimate choice — it is a bug that looks like a style.
   Raising this floor at draw time would only overflow the tile, so it is enforced where the art is
   authored, and the smoke reads the source and fails the build on anything under it. */
const SCENE_MIN=7;
function sizeCanvas(){
  const w=$("vp").clientWidth,scale=window.devicePixelRatio||1;
  cv.style.height=(w*VH/VW)+"px";
  cv.width=VW*scale; cv.height=VH*scale;
  ctx.setTransform(scale,0,0,scale,0,0);
  /* The world's height used to be width x 0.8 in every camera — the 2D tile grid's 5:4. Nobody
     chose 266px on a phone; it fell out of ten-by-eight tiles, and then every panel and button was
     hand-placed against it. A 3D camera has no picture to protect (see t3Resize), so when it is
     the one running, the world takes a share of the SCREEN instead: about 45% of it rather than
     31%, and the camera takes the shape it is given. `svh` is the small viewport height, so the
     world does not jump when the browser's address bar slides away. The flat cameras are untouched
     — they draw a fixed bitmap and keep their 5:4, so nothing letterboxes and no pixel art is
     stretched. Never shorter than it is today. */
  const c3=$("cv3");
  if(c3){
    if(camMode==="3d"){
      const svh=(window.visualViewport&&window.visualViewport.height)||window.innerHeight||600;
      c3.style.height=Math.round(Math.max(w*VH/VW,Math.min(svh*0.46,560)))+"px";
    }else c3.style.height=cv.style.height;
  }
  if(typeof t3Resize==="function")try{t3Resize();}catch(e){}
}
window.addEventListener("resize",sizeCanvas);
const C={floor:"#E7DFC8",floorAlt:"#E1D8BE",rug:"#C9B7E8",wall:"#453D57",wallTop:"#5A5170",
        desk:"#8A6F4D",deskTop:"#A98B62",counter:"#7E8894",plant:"#3E7C4F",pot:"#B06A3C",
        doorWood:"#7A5233",doorWood2:"#8F6440",doorFrame:"#4A331F"};
let camXg=0,camYg=0;
/* ---------- isometric 2.5D camera (IDEAS §10, v1) ----------
   A second RENDERER over the same world — the entities-as-data payoff. Floors become
   diamonds, solids extrude into blocks colored from the mini-map tables, people and
   animals render as upright billboards at their projected feet, depth by painter's
   sort. Ships as a Settings camera toggle beside top-down; admin painting stays
   top-down-only (tap→tile math differs). */
/* the default camera is content's call (CAMDEF); a device's stored choice wins.
   ONE list, used for both — they were two hand-written whitelists and both omitted
   "3d", so camSet() happily SAVED a 3D choice that boot then refused to read back:
   picking 3D and reloading silently dropped you to another camera, and CAMDEF="3d"
   was ignored outright. */
/* WHICH cameras this game has — a pack's choice, not the engine's (docs/TAGS.md L15).
   The owner, 2026-09-10: "maybe a game doesnt need 3d." A pack declaring ["top","front"] shows two
   buttons, never offers a camera it has no art for, and never pays for a renderer it does not use.
   Say nothing and you get all four, so neither shipping game changes. Unknown names are dropped
   rather than trusted: a typo must not put a button on screen that leads nowhere. */
const CAMALL=["top","front","iso","3d"];
const CAMS=(typeof CAMERAS!=="undefined"&&Array.isArray(CAMERAS)&&CAMERAS.filter(c=>CAMALL.includes(c)).length)
  ?CAMALL.filter(c=>CAMERAS.includes(c)):CAMALL;
let camMode=(typeof CAMDEF!=="undefined"&&CAMS.includes(CAMDEF))?CAMDEF:"top";
try{const cm0=localStorage.getItem(SK("cam"));if(CAMS.includes(cm0))camMode=cm0;}catch(e){}
const ISW=44,ISH=22;
let ISOCOL=null;
/* No "1" here on purpose: drawIso's block pass runs only for SOLID glyphs, and the stairs are
   walkable, so IZH["1"]=10 sat here being read by nothing at all. Deleted 2026-09-04 rather
   than corrected — a number that disagrees with the drawing will be trusted by somebody. */
const IZH={"#":20,B:20,Q:17,Z:17,U:20,W:12,V:10,D:9,K:9,T:8,S:13,H:8,I:9,A:9,P:11,F:7,G:9,X:8,"~":2,"9":11};   /* C dropped 2026-09-04: it stopped being solid, and this pass runs for solids only */
/* a pack-declared tile takes its iso height from its declared lift (lift 13 ≈ 20px, the
   wall) — this table used to be the only source, so a content window stood 6px short */
const izh=g=>IZH[g]||((TILES[g]&&TILES[g].lift)?Math.round(TILES[g].lift*1.5):14);
const shadeHex=(h,amt)=>amt>=0?mixHex(h,"#FFFFFF",amt):mixHex(h,"#000000",-amt);
function isoDiamond(cx,cy,col){ctx.fillStyle=col;ctx.beginPath();
  ctx.moveTo(cx,cy-ISH/2);ctx.lineTo(cx+ISW/2,cy);ctx.lineTo(cx,cy+ISH/2);ctx.lineTo(cx-ISW/2,cy);
  ctx.closePath();ctx.fill();}
function isoBlock(cx,cy,base,h){
  const ty=cy-h;
  ctx.fillStyle=shadeHex(base,-0.32);ctx.beginPath(); /* left face */
  ctx.moveTo(cx-ISW/2,cy);ctx.lineTo(cx,cy+ISH/2);ctx.lineTo(cx,cy+ISH/2-h);ctx.lineTo(cx-ISW/2,ty);
  ctx.closePath();ctx.fill();
  ctx.fillStyle=shadeHex(base,-0.5);ctx.beginPath(); /* right face */
  ctx.moveTo(cx+ISW/2,cy);ctx.lineTo(cx,cy+ISH/2);ctx.lineTo(cx,cy+ISH/2-h);ctx.lineTo(cx+ISW/2,ty);
  ctx.closePath();ctx.fill();
  isoDiamond(cx,ty,tc(base));
  ctx.strokeStyle="rgba(15,12,20,.25)";ctx.lineWidth=.7;ctx.stroke();}
function drawIso(){
  const w=CW();
  ISOCOL=ISOCOL||{"#":C.wall,D:C.desk,K:C.counter,T:"#C9A96A",W:"#AEB6BE",V:"#3A3F46",A:"#B08B5A",U:C.wall,
    ...BASECOL,...(typeof MAPCOL!=="undefined"?MAPCOL:{})};
  const hx=(fx-fy)*ISW/2,hy=(fx+fy)*ISH/2;
  const ox=VW/2-hx,oy=VH/2-hy;
  ctx.fillStyle=tc("#241F2E");ctx.fillRect(0,0,VW,VH);
  const P=(x,y)=>[(x-y)*ISW/2+ox,(x+y)*ISH/2+oy];
  /* floor pass */
  for(let y=0;y<w.H;y++)for(let x=0;x<w.W;x++){
    const[cx,cy]=P(x,y);
    if(cx<-ISW||cx>VW+ISW||cy<-ISH-24||cy>VH+ISH+24)continue;
    const ch=w.rows[y][x];
    const fp=FLOORC[world];let fc=fp?((x+y)%2?fp[0]:fp[1]):((x+y)%2?C.floor:C.floorAlt);
    const hsh=(x*374761393+y*668265263)>>>0;
    if((hsh&7)<2)fc=shadeHex(fc,-0.045);
    isoDiamond(cx,cy,tc(fc));
    if(ch==="≈"){isoDiamond(cx,cy,tc("#54555B"));}
    if(petalsOn()&&(!SOLID.has(w.grid[y][x])||(TILES[w.grid[y][x]]||{}).kind==="water")&&bridgeDist(w,x,y)<=3){ctx.save();ctx.translate(cx-ISW/4,cy-ISH/4);ctx.scale(0.5,0.5);petalSpill(w,x,y,0,0,1);ctx.restore();}
    else if(ch==="-"){isoDiamond(cx,cy,tc("#8F9096"));}
    else if(ch==="R"){ctx.save();ctx.translate(cx,cy);ctx.scale(0.75,0.75);ctx.translate(-cx,-cy);isoDiamond(cx,cy,tc(C.rug));ctx.restore();}
    /* the isometric camera had its OWN hardcoded flower bed — three pink dots, three literal
       hexes, not a call to the tile's painter — so a pack overriding `b` got the new bed in three
       cameras and the old one here. Found by Pili, 2026-09-16, while costing the marigolds; it is
       the shape docs/ARCH-LOG A7 warned about, a renderer that never asks the question. It asks. */
    else if(ch==="b"){petalPal().slice(1,4).map((c,i)=>[[-7,0],[3,-3],[6,3]][i].concat(c)).forEach(f=>{
      ctx.fillStyle=f[2];ctx.beginPath();ctx.arc(cx+f[0],cy+f[1],2,0,7);ctx.fill();});}
    else if(ch==="g"){ctx.strokeStyle=tc("#5FA86A");ctx.lineWidth=1.4;ctx.lineCap="round";
      [[-6,0],[0,-2],[6,1]].forEach(q=>{ctx.beginPath();ctx.moveTo(cx+q[0],cy+q[1]+3);ctx.lineTo(cx+q[0]+1.5,cy+q[1]-5);ctx.stroke();});}
    else if(DOORSET.has(ch)||ch==="2"){ /* Y and 1 dropped 2026-09-04: they stand as real blocks now */
      if(DOORSET.has(ch)){ctx.save();ctx.translate(cx,cy);ctx.scale(0.55,0.55);ctx.translate(-cx,-cy);
        isoDiamond(cx,cy,"#E0B45C");ctx.restore();
        ctx.globalAlpha=0.25+0.2*Math.sin(Date.now()/380);isoDiamond(cx,cy,"#FFE9A8");ctx.globalAlpha=1;}
      else{ctx.save();ctx.translate(cx,cy);ctx.scale(0.45,0.45);ctx.translate(-cx,-cy);
        isoDiamond(cx,cy,ch==="Y"?"#C0392B":"#E0B45C");ctx.restore();}}
  }
  /* depth pass: blocks + actors, painter's order */
  const R=[];
  for(let y=0;y<w.H;y++)for(let x=0;x<w.W;x++){
    const gch=w.grid[y][x],wg=winAt(w,x,y);
    if(!SOLID.has(gch)&&!wg)continue;
    const[cx,cy]=P(x,y);
    if(cx<-ISW||cx>VW+ISW||cy<-ISH-40||cy>VH+ISH+40)continue;
    if(wg)R.push({d:x+y,f:()=>isoBlock(cx,cy,ISOCOL[wg]||C.wall,Math.round(izh(wg)*0.45))}); /* the counter she stands behind */
    else if(gch==="J")R.push({d:x+y,f:()=>{isoBlock(cx,cy,"#6E4A2C",12);
      const t2=Math.sin(Date.now()/900+x)*1.2;
      ctx.fillStyle=tc("#4E8A58");
      [[-9,-1,9],[9,-1,9],[0,-7,10]].forEach(q=>{ctx.beginPath();ctx.arc(cx+q[0]+t2,cy-16+q[1],q[2],0,7);ctx.fill();});
      ctx.fillStyle=art("bloom","#B08FE0");[[-8,-4],[4,-9],[8,0],[-2,-2]].forEach(q=>{
        ctx.beginPath();ctx.arc(cx+q[0]+t2,cy-16+q[1],1.6,0,7);ctx.fill();});canopyDress(ctx,cx+t2,cy-16);}});
    else R.push({d:x+y,f:()=>isoBlock(cx,cy,ISOCOL[gch]||ISOCOL[w.rows[y][x]]||C.wall,IZH[gch]||izh(w.rows[y][x]))});
  }
  /* THE WELL, LOOKED INTO (owner, 2026-09-17: "lets do b"). This camera drew the hole as ordinary
     floor with a chevron on it and stood the hero on top — the same fault the front camera had.
     It is drawn in the DEPTH pass rather than the floor pass on purpose: a sunken lid reaches
     half a diamond past its own tile, and in the floor pass the next row would paint over it.
     You see the two FAR walls of the shaft (the diamond's north edges, extruded down) and the
     tread at the bottom of them. */
  for(let y=0;y<w.H;y++)for(let x=0;x<w.W;x++){
    const dp=isoWellPx(w,x,y);if(dp<=0)continue;
    const[cx,cy]=P(x,y);
    if(cx<-ISW||cx>VW+ISW||cy<-ISH-40||cy>VH+ISH+40)continue;
    const g=w.rows[y][x];
    R.push({d:x+y-0.02,f:()=>{
      ctx.fillStyle=tc("#221C29");ctx.beginPath();
      ctx.moveTo(cx-ISW/2,cy);ctx.lineTo(cx,cy-ISH/2);ctx.lineTo(cx+ISW/2,cy);
      ctx.lineTo(cx+ISW/2,cy+dp);ctx.lineTo(cx,cy-ISH/2+dp);ctx.lineTo(cx-ISW/2,cy+dp);
      ctx.closePath();ctx.fill();
      isoDiamond(cx,cy+dp,tc(g==="▼"?"#8C8578":"#C2BAA6"));   /* the tread's lid — the one surface down there facing the light from the floor above */
      ctx.fillStyle="rgba(255,255,255,.16)";ctx.beginPath();  /* its nosing */
      ctx.moveTo(cx-ISW/2,cy+dp);ctx.lineTo(cx,cy-ISH/2+dp);ctx.lineTo(cx,cy-ISH/2+dp+2);ctx.lineTo(cx-ISW/2,cy+dp+2);ctx.closePath();ctx.fill();}});
  }
  /* STANDING TILES. A `stand` tile is walkable, so the block pass above skips it — and
     isoBlock paints flat faces and a diamond top, never the art, so routing them THERE turns a
     trolley stop into a coloured slab (tried it, 2026-09-04). They billboard their profile
     instead, exactly like an actor, between the blocks at this depth and the people. */
  for(let y=0;y<w.H;y++)for(let x=0;x<w.W;x++){
    const g=w.rows[y][x];if(!standsUp(g))continue;
    const[cx,cy]=P(x,y);
    if(cx<-ISW||cx>VW+ISW||cy<-ISH-40||cy>VH+ISH+40)continue;
    const tf=sideArt(g);if(!tf)continue;
    R.push({d:x+y+0.35,f:()=>tf({sx:cx-16,sy:cy-25,x,y,canopy:()=>{}})});
  }
  const bill=(gx,gy,fn)=>{const[cx,cy0]=P(gx,gy),cy=cy0+isoLiftPx(w,Math.round(gx),Math.round(gy));
    /* iso lifts the PERSON for all three heights; the raised TILE art is still flat here, because
       isoBlock paints faces and a diamond lid and never the art — routing the bridge's planks
       through it would turn the deck into a coloured slab, which this file already learned once
       with the trolley stop. Named rather than hidden. */
    if(cx>-ISW&&cx<VW+ISW&&cy>-40&&cy<VH+40)R.push({d:gx+gy+0.51,f:()=>fn(cx-16,cy-25)});};
  w.npcs.forEach(n=>bill(n.fx===undefined?n.x:n.fx,n.fy===undefined?n.y:n.fy,(bx,by)=>{
    drawPerson(ctx,bx,by,npcWhimsy(n),{dir:"down",idle:Math.sin(Date.now()/500+n.x)*0.8,who:n.npc||n.key});
    if(hasSay(n))drawSayMark(ctx,bx,by);
    drawEmote(n,bx,by);}));
  if(world===AW("dog"))bill(DOG.fx,DOG.fy,(bx,by)=>drawDog(ctx,bx,by));
  if(world===AW("cat"))bill(CAT.fx,CAT.fy,(bx,by)=>drawCat(ctx,bx,by));
  if(world===AW("pig"))bill(PIG.fx,PIG.fy,(bx,by)=>drawPigeon(ctx,bx,by));
  if(world===AW("loro"))bill(LORO.x,LORO.y,(bx,by)=>drawLoro(ctx,bx,by));
  CRIT.forEach(cr=>{if(cr.world!==world)return;
    bill(cr.fx,cr.fy,(bx,by)=>{
      if(cr.kind==="butterfly")drawButterfly(ctx,cr,bx,by);
      else if(cr.kind==="colibri")drawColibri(ctx,cr,bx,by);
      else if(cr.kind==="gato")drawGato(ctx,cr,bx,by);
      else if(cr.kind==="beagle")drawBeagle(ctx,cr,bx,by);
      else if(cr.kind==="lab")drawLab(ctx,cr,bx,by);
      else if(cr.kind==="chi")drawChi(ctx,cr,bx,by);});});
  if(BALL&&BALL.world===world)bill(BALL.fx,BALL.fy,(bx,by)=>drawBall(ctx,bx,by,BALL.phase,BALL.t));
  DOGTHINGS.forEach(o=>{if(o.world===world)bill(o.fx,o.fy,(bx,by)=>drawDogThing(ctx,bx,by,o));});
  bill(fx,fy,(bx,by)=>drawPerson(ctx,bx,by,look,{dir,bob:moving?Math.sin(bob)*2:0,moving,hero:true}));
  /* decor stands up here too. It used to be drawn ONLY top-down and front, so every landmark
     the pack declares — the mural among them — was invisible in the two cameras people play in
     (found at la junta, 2026-09-03). */
  DECOS.forEach(d=>{if(d.world!==world)return;const f=DECODRAW[d.deco];if(!f)return;
    bill(d.x,d.y,(bx,by)=>f(bx,by,d));});
  doorMarks().forEach(d=>bill(d.x,d.y,(bx,by)=>drawDoorMark(ctx,bx,by,0,d.mark)));
  readMarks().forEach(d=>bill(d.x,d.y,(bx,by)=>drawReadMark(ctx,bx,by,0)));
  /* The trolley, the petals and the papel picado are drawn in the top-down and front cameras and
     were drawn in NEITHER here — troDraw2D had exactly two call sites and this was not one of them.
     Measured with the tram running: 1466 pixels changed in top, 1704 in front, and ZERO in iso. Not
     "looks wrong" — a player on this camera watched an empty street while a tram drove down it, and
     test/smoke.js exercises top, front and 3D by name and skips iso, which is why nobody saw it.
     Found by Chava, riding it. `P` is this camera's own tile-to-screen, so the tram lands on the
     rails rather than on a guess.
     IN ITS ROW'S TURN, not last (the owner, 2026-09-21: "looks like the person is laying on the
     trolley"): painted after everybody, the car covered a person standing in FRONT of it — 86 pixels
     of him under a car that was behind him, measured. It is a thing on its row: it takes the depth
     queue at its own centre, so whoever is nearer the camera paints over it and whoever is farther
     paints under it, the way the people already do. (The line inspector, crew iteration 12.) */
  {const L=troLine(world);if(L&&TRO.state!=="away"){const n=troCars(L);
    for(let i=0;i<n;i++){const cx=TRO.x+i*(TRO_LEN+TRO_GAP);
      R.push({d:cx+TRO_LEN/2+L.row+0.5,f:(function(k){return function(){troDraw2D(world,P,false,k);};})(i)});}}}
  R.sort((a,b)=>a.d-b.d).forEach(r=>r.f());
  petalTrail(world,P);
  fiestaDraw2D(world,P,false);
  /* shared time-of-day wash (door spills are top-down-only for now) */
  const dnow=new Date(),hr=dnow.getHours()+dnow.getMinutes()/60;
  let wash=null;
  if(themeName==="sunset")wash="rgba(255,150,60,.10)";
  else if(hr>=20.5||hr<6)wash="rgba(28,38,92,.20)";
  else if(hr>=18||hr<8)wash="rgba(255,150,60,.07)";
  if(wash){ctx.fillStyle=wash;ctx.fillRect(0,0,VW,VH);}
}
function camSet(m){
  /* a game only has the cameras it declares (CAMS). Refusing here rather than trusting the caller
     is what makes the seam safe: a saved choice from before a pack dropped a camera, a stale button,
     a test, all land on something the game can actually draw instead of a blank canvas. */
  if(!CAMS.includes(m))m=CAMS.includes(camMode)?camMode:CAMS[0];
  camMode=m;
  mqStore(SK("cam"),m);
  document.querySelectorAll("#camRow button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.cam===camMode?"true":"false"));
  const is3=camMode==="3d",c3=$("cv3");
  if(c3)c3.hidden=!is3;
  cv.hidden=is3;
  sizeCanvas();  /* the world's height depends on which camera is running now */
  if($("rot3d"))$("rot3d").hidden=!is3;}
document.querySelectorAll("#camRow button").forEach(b=>b.addEventListener("click",()=>camSet(b.dataset.cam)));
/* and the row shows what the game HAS. A button for a camera this pack never declared is a promise
   the game cannot keep, so it is not on screen at all. */
document.querySelectorAll("#camRow button").forEach(b=>{if(!CAMS.includes(b.dataset.cam))b.hidden=true;});
document.querySelectorAll("#easeRow button").forEach(b=>b.addEventListener("click",()=>{if(typeof camEaseSet==="function")camEaseSet(b.dataset.ease);}));
/* ---------- tile renderer registry (graphics-prep, IDEAS §7 step 1) ----------
   Every glyph draws via TILEDRAW[ch](rc), rc={sx,sy,x,y,canopy}. Content packs
   may override or add art via TILEART (typeof-guarded, like CRITTERS/EGGS) —
   per-glyph art is data now, completing the entities-as-data law for the world. */
const TILEDRAW={};
TILEDRAW["#"]=rc=>{const{sx,sy,x,y}=rc;ctx.fillStyle=tc(C.wall);ctx.fillRect(sx,sy,TS,TS);ctx.fillStyle=tc(C.wallTop);ctx.fillRect(sx,sy,TS,6);};
TILEDRAW["B"]=rc=>{const{sx,sy,x,y}=rc;ctx.fillStyle=tc("#5C4A50");ctx.fillRect(sx,sy,TS,TS);ctx.fillStyle=tc("#6E5A60");ctx.fillRect(sx,sy,TS,5);
      drawPanes(ctx,"B",sx,sy);}; /* the two windows are TILES.B.win, drawn — see drawPane. They were two flat rectangles a shade off the wall until 2026-09-17, which is why every sill in this game stood on nothing. */
TILEDRAW["R"]=rc=>{const{sx,sy,x,y}=rc;ctx.fillStyle=tc(C.rug);ctx.fillRect(sx+2,sy+2,TS-4,TS-4);};
TILEDRAW["≈"]=rc=>{const{sx,sy,x,y}=rc;ctx.fillStyle=tc("#54555B");ctx.fillRect(sx,sy,TS,TS);
      if(y%2===0){ctx.fillStyle=tc("#6A6B72");ctx.fillRect(sx+4,sy+15,10,2);}};
TILEDRAW["-"]=rc=>{const{sx,sy,x,y}=rc;ctx.fillStyle=tc("#54555B");ctx.fillRect(sx,sy,TS,TS);
      ctx.fillStyle=tc("#D8D6CE");ctx.fillRect(sx+3,sy+4,TS-6,5);ctx.fillRect(sx+3,sy+14,TS-6,5);ctx.fillRect(sx+3,sy+24,TS-6,5);};
TILEDRAW["F"]=rc=>{const{sx,sy,x,y}=rc;ctx.fillStyle=tc("#A87F4F");for(let i=0;i<4;i++)ctx.fillRect(sx+2+i*8,sy+4,6,TS-8);
      ctx.fillStyle=tc("#8B6A42");ctx.fillRect(sx,sy+8,TS,3);ctx.fillRect(sx,sy+21,TS,3);};
TILEDRAW["J"]=rc=>{const{sx,sy,x,y}=rc; /* jacaranda: trunk here, canopy in a later pass so it overhangs */
      ctx.fillStyle="#6E4A2C";ctx.fillRect(sx+13,sy+12,6,17);
      ctx.fillStyle="#59391F";ctx.fillRect(sx+13,sy+12,2,17);
      rc.canopy(sx,sy);};
/* ═══════════ THE FLOWER BED IS CEMPASÚCHIL (owner, 2026-09-16: "add some marigolds please") ═══════
   Measured before drawing, and the measurements are the argument:
     · There is not one marigold FLOWER anywhere in this game. Everything named marigold is a
       PETAL — the bridge deck's heap, the trail, the ofrenda's arch, the garland — or a colour
       swap. A deck under tens of thousands of petals and no plant they came off. That is the
       `how-its-made` fault exactly: variation entering at a step that never happened. A petal is
       what is left after somebody pulled a head apart; drawing only the aftermath is why the
       season reads as confetti.
     · The one tile whose entire job is flowers could not see the season at all. Five hardcoded
       circles, pink, so six beds stayed pink ON THE DAY OF THE DEAD.
     · And two of its four hues were the same colour in greyscale: #D77FA8 is luma 158.0 and
       #E08A5A is 158.2. Δ0.2 of 255. The bed was one texture wearing four names.
   THE FLOWER, at 32px, is three marks and no more survive: WIDER THAN TALL (a circle reads as a
   ball or a fruit; the flattening is what says flower), a RAGGED RIM of six lobes (at 8px across
   the rim is ~25px of arc, so a lobe gets 4px — eight lobes becomes a stipple), and A GREEN CUP
   UNDER IT, which is the cheapest separator from every other orange thing in this city: an orange
   mass with green under it is a flower, an orange mass alone is a traffic cone.
   Three open heads and two buds, not five heads — same plant, different age, one sheet of soil, and
   that is what makes a bed read as GROWN rather than stamped. It costs nothing.
   The colours come from `petalPal()`, which returns the marigold gradient WITH NO SEASON ON and the
   identical array in season — so the flower and its own fallen petals are the same six colours, the
   bed looks the same in March as in October, and a season still changes only colour. */
function drawBed(g,sx,sy,seed){
  const P=petalPal();                                   /* [deep, undercut, body, lit, crown, pale] */
  const DEEP=P[0],UNDER=P[1],BODY=P[3]||P[2],CROWN=P[5]||P[4];
  g.fillStyle=tc("#7A5A3C");g.beginPath();g.roundRect(sx+3,sy+6,TS-6,TS-10,6);g.fill();
  g.fillStyle="rgba(24,16,8,.16)";g.beginPath();g.roundRect(sx+3,sy+6,TS-6,4,3);g.fill();  /* the soil has a lip */
  const head=(hx,hy,r)=>{
    g.fillStyle="rgba(30,18,8,.30)";                    /* it sits IN the soil */
    g.beginPath();g.ellipse(hx+0.5,hy+r*0.72,r*0.95,r*0.38,0,0,7);g.fill();
    g.strokeStyle=tc("#3E7C4F");g.lineWidth=1;          /* stem */
    g.beginPath();g.moveTo(hx,hy+r*0.5);g.lineTo(hx,hy+r*1.25);g.stroke();
    g.fillStyle=tc("#3E7C4F");                          /* the calyx cup — the separator */
    g.beginPath();g.ellipse(hx,hy+r*0.52,r*0.72,r*0.34,0,0,7);g.fill();
    g.fillStyle=UNDER;                                  /* the rim, six lobes, ragged by construction */
    for(let i=0;i<6;i++){const a=i*Math.PI/3+seed*0.7;
      g.beginPath();g.ellipse(hx+Math.cos(a)*r*0.62,hy+Math.sin(a)*r*0.46,r*0.42,r*0.34,a,0,7);g.fill();}
    g.fillStyle=BODY;                                   /* the head: WIDER THAN TALL */
    g.beginPath();g.ellipse(hx,hy,r,r*0.86,0,0,7);g.fill();
    g.fillStyle=CROWN;                                  /* the key is upper-left, so only those lobes lift */
    [[-0.42,-0.40],[0.06,-0.52],[-0.60,-0.02]].forEach(([dx,dy])=>{
      g.beginPath();g.ellipse(hx+dx*r,hy+dy*r,r*0.30,r*0.24,0,0,7);g.fill();});
    g.strokeStyle=DEEP;g.lineWidth=0.9;                 /* two notches, never a starburst */
    [-0.5,0.55].forEach(a=>{g.beginPath();g.moveTo(hx+Math.cos(a)*r*0.15,hy+Math.sin(a)*r*0.15);
      g.lineTo(hx+Math.cos(a)*r*0.8,hy+Math.sin(a)*r*0.7);g.stroke();});};
  const bud=(hx,hy,r)=>{                                /* same plant, younger: body only, no crown */
    g.strokeStyle=tc("#3E7C4F");g.lineWidth=1;
    g.beginPath();g.moveTo(hx,hy+r*0.4);g.lineTo(hx,hy+r*1.5);g.stroke();
    g.fillStyle=tc("#3E7C4F");g.beginPath();g.ellipse(hx,hy+r*0.5,r*0.7,r*0.42,0,0,7);g.fill();
    g.fillStyle=UNDER;g.beginPath();g.ellipse(hx,hy,r,r*0.92,0,0,7);g.fill();};
  head(sx+10,sy+14,4.2); head(sx+21,sy+12,3.8); head(sx+15,sy+21,4.0);
  bud(sx+25,sy+19,2.1);  bud(sx+6,sy+21,1.9);
}
TILEDRAW["b"]=rc=>{const{sx,sy,x,y}=rc;drawBed(ctx,sx,sy,((x*7+y*13)%5)/5);};
TILEDRAW["g"]=rc=>{const{sx,sy,x,y}=rc; /* grass tuft on the floor tile */
      ctx.strokeStyle=tc("#5FA86A");ctx.lineWidth=1.6;ctx.lineCap="round";
      [[8,0],[13,-2],[18,1],[23,-1]].forEach(p=>{ctx.beginPath();
        ctx.moveTo(sx+p[0],sy+24);ctx.quadraticCurveTo(sx+p[0]+p[1],sy+18,sx+p[0]+p[1]*1.6,sy+13);ctx.stroke();});};
TILEDRAW["G"]=rc=>{const{sx,sy,x,y}=rc; /* a construction barricade: an orange board with white stripes on
      two legs. It was an orange frame with two rails, which stood up in 3D as a ladder (owner). */
      ctx.fillStyle="#C25A1E";ctx.fillRect(sx+5,sy+14,4,15);ctx.fillRect(sx+23,sy+14,4,15);   /* legs */
      ctx.fillRect(sx+5,sy+21,22,2.5);                                                      /* the lower rail */
      ctx.fillStyle="#E0662B";ctx.fillRect(sx+2,sy+7,28,8);                                   /* the board */
      ctx.fillStyle="#F4F1EA";for(let i=0;i<3;i++){const x0=sx+5+i*8;ctx.beginPath();ctx.moveTo(x0,sy+15);ctx.lineTo(x0+4,sy+7);ctx.lineTo(x0+7,sy+7);ctx.lineTo(x0+3,sy+15);ctx.closePath();ctx.fill();}};
TILEDRAW["C"]=rc=>{const{sx,sy,x,y}=rc;ctx.fillStyle="#E0662B";ctx.beginPath();ctx.moveTo(sx+16,sy+8);ctx.lineTo(sx+23,sy+26);ctx.lineTo(sx+9,sy+26);ctx.closePath();ctx.fill();
      ctx.fillStyle="#F4F1EA";ctx.fillRect(sx+11.5,sy+17,9,3);};
TILEDRAW["X"]=rc=>{const{sx,sy,x,y}=rc;ctx.fillStyle="#E7C25A";ctx.fillRect(sx+4,sy+4,TS-8,TS-12);ctx.fillStyle="#6B5210";
      ctx.font="14px serif";ctx.textAlign="center";ctx.fillText("🚧",sx+16,sy+19);ctx.textAlign="start";
      ctx.fillStyle="#8B6A42";ctx.fillRect(sx+14,sy+24,4,6);};
TILEDRAW["1"]=rc=>{const{sx,sy}=rc; /* STAIRS, from above. Four flat grey bars between two brown
      posts read as a five-bar GATE — and as the trolley track "-" and the agility hurdle "3",
      which are the same shape: three glyphs, one shape language, three meanings. A flight reads
      in PLAN from three things and none of them is stripes: stringers that CONVERGE (two lines
      going away from you), a hard NOSING shadow under every tread, and a dark HEAD at the far
      end — the opening you climb into. This flight rises NORTH, up-screen. Since 2026-09-06 the
      engine also has a flight that runs EAST along a wall — ⊓ ≡ ▲ ▼ ◺ below (#4): a mass you
      walk beside, treads you walk on, a head that is the portal. Two conventions, each
      declared by its glyph; a pack picks one per flight. */
  ctx.fillStyle="rgba(15,12,20,.22)";ctx.fillRect(sx+4,sy+29.5,24,2);        /* the bottom step casts onto the floor */
  ctx.fillStyle="#241F2E";ctx.fillRect(sx+8,sy+3,16,7);                      /* HEAD — the dark opening at the top */
  const TR=["#C6BEAA","#B9B19D","#ACA490","#9F9783","#928A76"];              /* light at your feet, dark under the floor above */
  for(let i=0;i<5;i++){                                                      /* i=0 is the step nearest you */
    const t=i/4,ty=sy+26-i*4,ix=sx+5+t*3,iw=22-t*6;                          /* the run narrows as it goes away */
    ctx.fillStyle=TR[i];ctx.fillRect(ix,ty,iw,4);                            /* TREAD — the surface you stand on */
    ctx.fillStyle="rgba(15,12,20,.42)";ctx.fillRect(ix,ty+3,iw,1);           /* NOSING shadow — the one line that says "step" */
  }
  ctx.fillStyle="#7A5A32";ctx.beginPath();                                   /* STRINGER, left — lit; the city's key is upper-left */
  ctx.moveTo(sx+2,sy+30);ctx.lineTo(sx+5,sy+30);ctx.lineTo(sx+8.5,sy+8);ctx.lineTo(sx+6,sy+8);ctx.closePath();ctx.fill();
  ctx.fillStyle="#4A331F";ctx.beginPath();                                   /* STRINGER, right — shaded */
  ctx.moveTo(sx+30,sy+30);ctx.lineTo(sx+27,sy+30);ctx.lineTo(sx+23.5,sy+8);ctx.lineTo(sx+26,sy+8);ctx.closePath();ctx.fill();
  ctx.lineCap="round";
  ctx.strokeStyle="rgba(15,12,20,.28)";ctx.lineWidth=2;                      /* the handrail's shadow across the treads — the depth cue */
  ctx.beginPath();ctx.moveTo(sx+9,sy+26);ctx.lineTo(sx+11.5,sy+9);ctx.stroke();
  ctx.strokeStyle="#A88650";ctx.lineWidth=2;                                 /* HANDRAIL, one side only — two rails at 32px is noise */
  ctx.beginPath();ctx.moveTo(sx+7,sy+26);ctx.lineTo(sx+9.5,sy+9);ctx.stroke();
  ctx.lineCap="butt";ctx.lineWidth=1;                                        /* ctx is shared — hand it back clean */
};
TILEDRAW["2"]=rc=>{const{sx,sy,x,y}=rc;ctx.fillStyle="#E0B45C";ctx.font="700 15px sans-serif";ctx.textAlign="center";
      ctx.fillText("»",sx+16,sy+21);ctx.textAlign="start";};
TILEDRAW["Q"]=rc=>{const{sx,sy,x,y}=rc; /* restaurant storefront: terracotta facade + striped awning +
      a window with a steaming bowl in it. The cold read (IDEAS §15.8) saw "a red building,
      an awning, two blank windows" — the mullion split the window into two blanks and
      nothing said food. The mercado reads because it shows produce; this shows a meal. */
      ctx.fillStyle="#A8503A";ctx.fillRect(sx,sy,TS,TS);
      for(let i=0;i<4;i++){ctx.fillStyle=i%2?"#F2E8D8":"#C0392B";ctx.fillRect(sx+i*8,sy,8,7);}
      ctx.fillStyle="#7A3527";ctx.fillRect(sx,sy+7,TS,2);
      ctx.fillStyle="#F5DFA9";ctx.fillRect(sx+7,sy+11,18,14); /* one window */
      ctx.fillStyle="#C0392B";ctx.beginPath();ctx.arc(sx+16,sy+20,5,0,Math.PI);ctx.fill(); /* the bowl */
      ctx.fillStyle="#E8A05A";ctx.fillRect(sx+11.5,sy+19,9,1.6); /* what's in it */
      ctx.fillStyle="#F2E8D8";ctx.fillRect(sx+11,sy+19.6,10,1); /* rim */
      ctx.fillStyle="#B9B2A6";[13,16,19].forEach((wx,i)=>ctx.fillRect(sx+wx,sy+13+(i%2)*1.2,1.2,3.6)); /* steam */
      produce(sx+23,sy+14,"chile",0.75);
      drawPanes(ctx,"Q",sx,sy,{glass:false});};   /* the joinery: a reveal, a lintel and the sill two calaveritas stand on */
TILEDRAW["D"]=rc=>{const{sx,sy,x,y}=rc; /* a desk: top, two legs, a monitor on it, a sheet of paper.
      The cold read saw a cardboard box with a label. */
      ctx.fillStyle=tc(C.desk);ctx.fillRect(sx+5,sy+18,3,10);ctx.fillRect(sx+24,sy+18,3,10); /* legs */
      ctx.fillStyle=tc(C.deskTop);ctx.fillRect(sx+2,sy+13,TS-4,5); /* top */
      ctx.fillStyle=tc(C.desk);ctx.fillRect(sx+2,sy+18,TS-4,1.5); /* apron */
      ctx.fillStyle="#2B2F38";ctx.fillRect(sx+10,sy+3,12,9);ctx.fillRect(sx+15,sy+12,2,1.5);ctx.fillRect(sx+13,sy+13,6,1); /* monitor + stand */
      ctx.fillStyle="#7FB3D5";ctx.fillRect(sx+11,sy+4,10,7); /* screen */
      ctx.fillStyle="#DDE4EA";ctx.fillRect(sx+23,sy+14,5,3);}; /* paper */
TILEDRAW["K"]=rc=>{const{sx,sy,x,y}=rc;ctx.fillStyle=tc(C.counter);ctx.fillRect(sx+2,sy+6,TS-4,TS-10);ctx.font="12px serif";ctx.fillText("☕",sx+9,sy+22);};
TILEDRAW["P"]=rc=>{const{sx,sy,x,y}=rc;ctx.fillStyle=C.pot;ctx.fillRect(sx+10,sy+18,12,10);ctx.fillStyle=C.plant;
      ctx.beginPath();ctx.arc(sx+16,sy+13,8,0,7);ctx.fill();
      const bl=art("bloom",null);if(bl){ctx.fillStyle=bl; /* every planter blooms cempasúchil in season (Nacho: the cheapest way the season reaches every world) */
        [[-4,-3],[3,-4],[0,1],[-2,4],[4,3]].forEach(q=>{ctx.beginPath();ctx.arc(sx+16+q[0],sy+13+q[1],2.5,0,7);ctx.fill();});
        ctx.fillStyle="rgba(255,255,255,.35)";[[-4,-3],[3,-4],[0,1],[-2,4],[4,3]].forEach(q=>{ctx.beginPath();ctx.arc(sx+16+q[0]-0.5,sy+13+q[1]-0.5,0.6,0,7);ctx.fill();});}};
TILEDRAW["T"]=rc=>{const{sx,sy,x,y}=rc; /* a restaurant table: gingham cloth, two plates, a chair
      either side. The cold read saw a dartboard (cream disc, red dot); without the chairs
      the gingham disc could pass for a pizza. */
      ctx.fillStyle="#5E3B20";ctx.fillRect(sx+0.5,sy+11,3.5,10);ctx.fillRect(sx+28,sy+11,3.5,10); /* chairs */
      ctx.fillStyle="#7A4E2C";ctx.beginPath();ctx.arc(sx+16,sy+16,12,0,7);ctx.fill();
      ctx.save();ctx.beginPath();ctx.arc(sx+16,sy+16,10.5,0,7);ctx.clip();
      ctx.fillStyle="#F2E8D8";ctx.fillRect(sx+4,sy+4,24,24);
      ctx.fillStyle="#C0392B";for(let i=0;i<6;i++)for(let j=0;j<6;j++)if((i+j)%2===0)ctx.fillRect(sx+4+i*4,sy+4+j*4,4,4);
      ctx.restore();
      [[11,16],[21,16]].forEach(([qx,qy])=>{ctx.fillStyle="#FFF";ctx.beginPath();ctx.arc(sx+qx,sy+qy,3.6,0,7);ctx.fill();
        ctx.fillStyle="#C9CDD2";ctx.beginPath();ctx.arc(sx+qx,sy+qy,2.2,0,7);ctx.fill();});};
TILEDRAW["W"]=rc=>{const{sx,sy,x,y}=rc;ctx.fillStyle="#AEB6BE";ctx.fillRect(sx+4,sy+2,TS-8,TS-4);
      ctx.fillStyle="#8E969E";ctx.fillRect(sx+4,sy+14,TS-8,2);
      ctx.fillStyle="#5F676F";ctx.fillRect(sx+21,sy+5,3,7);ctx.fillRect(sx+21,sy+18,3,7);};
TILEDRAW["V"]=rc=>{const{sx,sy,x,y}=rc;ctx.fillStyle="#3A3F46";ctx.fillRect(sx+3,sy+4,TS-6,TS-8);
      ctx.fillStyle="#23272C";[[10,12],[22,12],[10,22],[22,22]].forEach(p=>{
        ctx.beginPath();ctx.arc(sx+p[0],sy+p[1],3.4,0,7);ctx.fill();});
      ctx.fillStyle="#E0662B";ctx.fillRect(sx+14,sy+6,4,2);};
TILEDRAW["A"]=rc=>{const{sx,sy,x,y}=rc; /* drafting table: tilted board, blueprint sheet, T-square */
      ctx.fillStyle="#8A6F4D";ctx.fillRect(sx+13,sy+20,6,8);
      ctx.fillStyle="#B08B5A";ctx.beginPath();ctx.moveTo(sx+4,sy+20);ctx.lineTo(sx+28,sy+16);ctx.lineTo(sx+28,sy+6);ctx.lineTo(sx+4,sy+10);ctx.closePath();ctx.fill();
      ctx.fillStyle="#2E5FA8";ctx.beginPath();ctx.moveTo(sx+7,sy+18.6);ctx.lineTo(sx+25,sy+15.4);ctx.lineTo(sx+25,sy+8);ctx.lineTo(sx+7,sy+11);ctx.closePath();ctx.fill();
      ctx.strokeStyle="#DDE8F5";ctx.lineWidth=0.8;
      ctx.beginPath();ctx.moveTo(sx+9,sy+12);ctx.lineTo(sx+22,sy+10);ctx.moveTo(sx+9,sy+14.5);ctx.lineTo(sx+22,sy+12.5);ctx.moveTo(sx+9,sy+17);ctx.lineTo(sx+18,sy+15.4);ctx.stroke();};
/* Produce silhouettes for the mercado. Five coloured dots of identical size read as
   "generic dots" at tile scale (owner, 2026-09-01: "the fruits are too general in
   shape"), so each item gets its own OUTLINE instead — the shape carries the meaning,
   not the colour. Sized for a 32px tile: simple, high-contrast, no interior detail. */
function produce(px,py,kind,scale){
  const g=ctx,k=scale||1;
  if(kind==="banana"){g.strokeStyle="#E8C33A";g.lineWidth=1.9*k;g.lineCap="round";
    g.beginPath();g.arc(px,py+1.2*k,3*k,Math.PI*0.12,Math.PI*0.92);g.stroke();g.lineCap="butt";return;}
  if(kind==="chile"){g.fillStyle="#4E9A3E";g.beginPath();g.moveTo(px-1*k,py-1.6*k);
    g.quadraticCurveTo(px+2.6*k,py+0.2*k,px+0.4*k,py+3.2*k);
    g.quadraticCurveTo(px-1.2*k,py+1*k,px-1*k,py-1.6*k);g.fill();
    g.fillStyle="#2F6B27";g.fillRect(px-2.2*k,py-2.8*k,3.2*k,1.4*k);return;}
  if(kind==="tomato"){g.fillStyle="#C0392B";g.beginPath();g.arc(px,py+0.6*k,2.5*k,0,7);g.fill();
    g.fillStyle="#3E7A34";g.fillRect(px-1.5*k,py-2.4*k,3*k,1.3*k);return;}
  if(kind==="carrot"){g.fillStyle="#E0662B";g.beginPath();g.moveTo(px-2*k,py-1*k);
    g.lineTo(px+2*k,py-1*k);g.lineTo(px,py+3.4*k);g.closePath();g.fill();
    g.fillStyle="#3E7A34";g.fillRect(px-1.7*k,py-2.8*k,3.4*k,1.5*k);return;}
  /* grapes: a cluster, which is unmistakable even at four pixels across */
  g.fillStyle="#8E5BA6";[[0,-1.2],[-1.7,0.5],[1.7,0.5],[0,2.1]].forEach(d=>{
    g.beginPath();g.arc(px+d[0]*k,py+d[1]*k,1.35*k,0,7);g.fill();});
}
TILEDRAW["Z"]=rc=>{const{sx,sy,x,y}=rc; /* El Mercado facade: green stall front, striped awning, produce window */
      ctx.fillStyle="#4E7A4A";ctx.fillRect(sx,sy,TS,TS);
      for(let i=0;i<4;i++){ctx.fillStyle=i%2?"#F2E8D8":"#C98A2D";ctx.fillRect(sx+i*8,sy,8,7);}
      ctx.fillStyle="#385C36";ctx.fillRect(sx,sy+7,TS,2);
      ctx.fillStyle="#EFE3C4";ctx.fillRect(sx+4,sy+12,24,13);
      /* THREE items, not five: at ~5px each five crowded the window into mush, the
         grape cluster collapsed into a purple diamond, and a second row put the banana
         and the carrot on top of each other. One row, bigger, fully spaced — legibility
         beats density at 32px. Verified by rendering the tile at 4x and looking. */
      [[9.5,18.5,"tomato"],[17,18.5,"banana"],[24.5,18.5,"chile"]]
        .forEach(f=>produce(sx+f[0],sy+f[1],f[2],1.3));
      drawPanes(ctx,"Z",sx,sy,{glass:false});};
TILEDRAW["S"]=rc=>{const{sx,sy,x,y}=rc; /* shelving: three loaded shelves */
      ctx.fillStyle="#8A6F4D";ctx.fillRect(sx+2,sy+2,TS-4,TS-4);
      ctx.fillStyle="#6E5638";[6,14,22].forEach(yy=>ctx.fillRect(sx+2,sy+yy,TS-4,2));
      ctx.fillStyle="#D9C9A3";[[6,3],[13,3],[20,3],[6,11],[15,11],[9,19],[18,19]].forEach(b=>
        ctx.fillRect(sx+b[0],sy+b[1],5,4));};
TILEDRAW["H"]=rc=>{const{sx,sy,x,y}=rc; /* produce crate */
      ctx.fillStyle="#B0895B";ctx.fillRect(sx+3,sy+10,TS-6,TS-14);
      ctx.fillStyle="#8B6A42";ctx.fillRect(sx+3,sy+16,TS-6,2);ctx.fillRect(sx+15,sy+10,2,TS-14);
      [[9,9,"tomato"],[16,7,"chile"],[23,9,"banana"]]
        .forEach(f=>produce(sx+f[0],sy+f[1],f[2],1.3));};
TILEDRAW["I"]=rc=>{const{sx,sy,x,y}=rc; /* shop counter: worn wood, and a produce scale you can read —
      dial with a needle, post, tray, a tomato on the tray. The cold read saw a brown box with a grey smudge. */
      ctx.fillStyle="#A8825A";ctx.fillRect(sx+2,sy+6,TS-4,TS-10);
      ctx.fillStyle="#8B6A42";ctx.fillRect(sx+2,sy+6,TS-4,3);
      ctx.fillStyle="#5F676F";ctx.fillRect(sx+15,sy+13,2,7); /* post */
      ctx.fillStyle="#C9CDD2";ctx.fillRect(sx+9,sy+20,14,2.5); /* tray */
      ctx.fillStyle="#EEF0F2";ctx.beginPath();ctx.arc(sx+16,sy+10,4.4,0,7);ctx.fill(); /* dial */
      ctx.strokeStyle="#5F676F";ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx+16,sy+10,4.4,0,7);ctx.stroke();
      ctx.strokeStyle="#C0392B";ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(sx+16,sy+10);ctx.lineTo(sx+18.6,sy+7.6);ctx.stroke(); /* needle */
      produce(sx+12.5,sy+18,"tomato",0.85);};
TILEDRAW["U"]=rc=>{const{sx,sy,x,y}=rc; /* blueprint wall panel */
      ctx.fillStyle=tc(C.wall);ctx.fillRect(sx,sy,TS,TS);ctx.fillStyle=tc(C.wallTop);ctx.fillRect(sx,sy,TS,6);
      ctx.fillStyle="#2E5FA8";ctx.fillRect(sx+4,sy+9,TS-8,18);
      ctx.strokeStyle="#DDE8F5";ctx.lineWidth=0.9;
      ctx.strokeRect(sx+8,sy+13,9,7);ctx.beginPath();ctx.moveTo(sx+8,sy+23);ctx.lineTo(sx+24,sy+23);ctx.moveTo(sx+20,sy+13);ctx.lineTo(sx+24,sy+17);ctx.stroke();
      ctx.fillStyle="#E0B45C";[[5,10],[26,10],[5,25],[26,25]].forEach(p=>ctx.fillRect(sx+p[0],sy+p[1],1.6,1.6));};
TILEDRAW["~"]=rc=>{const{sx,sy,x,y}=rc; /* river water: cool blue, drifting glints */
      ctx.fillStyle=tc("#4A7FA8");ctx.fillRect(sx,sy,TS,TS);
      ctx.fillStyle=tc("#5E93BC");
      const ph=Math.sin(Date.now()/900+x*3+y*5);
      ctx.fillRect(sx+4,sy+8+ph*2,11,2);ctx.fillRect(sx+17,sy+21-ph*2,10,2);
      ctx.fillStyle="rgba(255,255,255,.25)";ctx.fillRect(sx+7,sy+9+ph*2,4,1);};
const BRIDGE_BANDS=["#D95B5B","#E0A430","#E7C25A","#7A9A4E","#5E93BC","#8B6FC8"]; /* year-round */
/* ---------- petals off the bridge (owner, 2026-09-07: "it should be full of the petals, they spill
   into water and the floor and a trail forms behind characters") ----------
   petalSpill: every ground painter (top, front, iso, the 3D bake) calls it after a tile's own art;
   within three tiles of a bridge deck it strews petals, thickest beside the deck, thinning out —
   onto water and floor alike, deterministic per tile. petalDrop: whoever finishes a step in season
   leaves three petals on that tile; the trail fades over a minute and a half. Nothing without
   art("bridgeStyle")==="petals". */
/* ---------- LA FIESTA (owner, 2026-09-07: "lets hang papel picado all over. put a pinata in there
   as well as tamales"; Nacho's plan the same day: swags, not wallpaper — five flags a tile, a swag
   of five to nine tiles tied to something you can see it tied to; dress by what a place is FOR) ----------
   The season hands art("swags") — [{world,from:[x,y],to:[x,y]}] horizontal spans — and art("hangs")
   — [{world,x,y,kind:"pinata"}]. Never a map row: a string hangs above the ground and changes no
   tile. In 3D the builder strings them (poles where the end is open ground); the two flat cameras
   draw them here. Season off → art() falls back to nothing and nothing is left behind. */
function fiestaSwags(wid){return (art("swags",[])||[]).filter(sw=>sw.world===wid&&sw.from&&sw.to&&sw.from[1]===sw.to[1]);}
function fiestaHangs(wid){return (art("hangs",[])||[]).filter(h=>h.world===wid);}
function drawPinata(g,sx,sy,sway){ /* a seven-point star on a rope: a gold body, seven cones in the paper palette, tissue tabs at the tips */
  const pal=art("papel",null)||["#E8478F","#2FA5A0","#F2B705","#7B4BA8","#F07C24","#F6F2E8"],cx=sx+16,cy=sy+18;
  g.save();g.translate(cx,sy+2);g.rotate(sway||0);g.translate(-cx,-(sy+2));
  g.strokeStyle="#5A4330";g.lineWidth=1;g.beginPath();g.moveTo(cx,sy+1);g.lineTo(cx,cy-6);g.stroke(); /* the rope is the whole read */
  for(let k=0;k<7;k++){const a=-Math.PI/2+k*Math.PI*2/7,ex=cx+Math.cos(a)*11,ey=cy+Math.sin(a)*11;
    g.fillStyle=pal[k%pal.length];g.beginPath();g.moveTo(cx+Math.cos(a-0.5)*5.5,cy+Math.sin(a-0.5)*5.5);g.lineTo(ex,ey);g.lineTo(cx+Math.cos(a+0.5)*5.5,cy+Math.sin(a+0.5)*5.5);g.closePath();g.fill();
    g.fillStyle="#F6F2E8";[-0.25,0,0.25].forEach(t=>{g.fillRect(ex+Math.cos(a+t)*1.2-0.5,ey+Math.sin(a+t)*1.2-0.5,1,1.6);});}
  g.fillStyle="#F2B705";g.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3;g.lineTo(cx+Math.cos(a)*6,cy+Math.sin(a)*6);}g.closePath();g.fill();
  g.fillStyle="rgba(255,255,255,.3)";g.fillRect(cx-3,cy-4,3,1.4);g.restore();}
function fiestaDraw2D(wid,toScreen,front,defer){ /* toScreen(x,y) → the tile's top-left; front: the flags hang from the top of the row.
   defer(y,fn), front only: a prop standing on a SOLID tile is handed to the caller's depth queue for that row instead of
   being painted here, because here is the ground pass and the facade's own face is painted AFTER it. Measured 2026-09-14
   (Chema, docs/3D-LOG.md): drawSillBox was called eight times a frame in the front camera and delivered ZERO pixels —
   the window, the sweet and the ledge were drawn and then covered by the wall they hang on, every frame since they
   shipped, which is why four fixes about size and one about light changed nothing anyone could see. The papel picado
   never had this because it hangs over open rows. A prop on the floor still paints here, exactly as before. */
  let cur=null;const put=(solid,fn)=>{if(front&&defer&&solid){fn.y=cur;defer(fn);}else fn();};
  const pal=art("papel",null);if(!pal)return;
  fiestaSwags(wid).forEach(sw=>{const y=sw.from[1],x0=Math.min(sw.from[0],sw.to[0]),x1=Math.max(sw.from[0],sw.to[0]);
    const[sx0,sy0]=toScreen(x0,y),[sx1]=toScreen(x1+1,y),ly=sy0+(front?3:5);
    drawPapelRow(ctx,sx0,sx1,ly,pal,x0+y);});
  fiestaHangs(wid).forEach(h=>{const[sx,sy]=toScreen(h.x,h.y);if(h.kind==="pinata")drawPinata(ctx,sx,sy,Math.sin(Date.now()/700+h.x)*0.06);});
  fiestaProps(wid).forEach(p=>{cur=p.y;const[sx,sy]=toScreen(p.x,p.y);const ox=(p.ox===undefined?0.5:p.ox)*TS,oy=(p.oy===undefined?0.5:p.oy)*TS;
    if(p.kind==="ofrenda"){const solid=isSolidAt(wid,p.x,p.y);put(solid,()=>drawOfrenda(ctx,sx,sy-(front&&solid?10:0)));return;}
    if(p.kind!=="calaverita")return;
    const win=propSill(wid,p); /* on a window sill (owner: "as in human reality"): the facade's own window says where */
    if(win){const z=win.size; /* centred on its own window, standing on the sill, small enough to leave glass around it */
      if(front)put(true,()=>drawSillBox(ctx,sx+win.cx-sillBoxW(win.w)/2,sy+win.sill-win.h,win.w,win.h,p.foil,z)); /* a sill is always in a facade */
      else drawCalaverita(ctx,sx+win.cx-z/2,sy+TS-1-z,p.foil,z);
      return;}
    const solid=isSolidAt(wid,p.x,p.y);
    put(solid,()=>drawCalaverita(ctx,sx+ox-4,front?(solid||p.h?sy+2:sy+TS-9):sy+oy-4,p.foil));});}
/* Which window a sill prop stands in, and how big it may be there (#131, owner: "sugar skull on
   sills are overlapping"). Two faults lived in the one line this replaces.
   The candy is drawn 8px wide. Meridian's shopfront window is SEVEN, and the engine's is eight —
   so the sweet was as wide as the pane it stood in, or wider, and taller than the opening on a
   6px window. It read as a skull pasted over the glass, which is exactly what the owner saw. A
   candy on a sill has to be visibly smaller than the window behind it: two thirds of the opening,
   never wider than the art it is drawn from, never so small it stops reading as a skull.
   And a front with two windows only ever offered the first, so two candies set on one tile landed
   on the same pane. `w` in the content still names a window when it wants one; when it does not,
   the candies on a tile take its windows in turn, so nothing has to be hand-numbered to be spread.
   Returns {cx, sill, size, i, w, h, g} in tile pixels, or null. */
function sillWindow(wid,p,n){
  if(p.w!==undefined)return ((p.w|0)%n+n)%n;
  const mine=fiestaProps(wid).filter(q=>q.sill&&q.x===p.x&&q.y===p.y);
  const k=mine.indexOf(p);return (k<0?0:k)%n;}
function propSill(wid,p){
  /* winsKept, not TILES.win: a candy may only stand in a window the wall actually SHOWS. At
     st(22,0) the mural panel plasters the left one over, and reading the raw list put the sweet
     where a window used to be — which is the "non existing or visible window sill" the owner
     reported on 2026-09-17. `w:` in the content indexes what is left, not what was declared. */
  if(!p.sill)return null;const g=glyphAt(wid,p.x,p.y),wins=winsKept(wid,p.x,p.y);
  if(!wins.length)return null;
  const i=sillWindow(wid,p,wins.length),win=wins[i]||wins[0];
  /* #131 cut the candy from a flat 8 to two thirds of the pane, because at 8 in an 8-pixel window it
     filled the glass edge to edge and its crown poked over the frame. Two thirds was my number and it
     was too small: 8x8 to 5x5 is SIXTY-ONE PERCENT of the sweet gone, and on a wall 1.1 units high seen
     from twelve tiles back that is three screen pixels. The owner, 2026-09-09: "the skulls are still
     hidden on the sills." They were never hidden. They were shrunk, by me, fixing the opposite fault.
     0.85 leaves a pixel of glass each side — a sweet ON a sill, not a sweet AVOIDING one. */
  const size=Math.max(4,Math.min(8,Math.round(win[2]*0.85),Math.round(win[3]*0.9)));
  return {cx:win[0]+win[2]/2,sill:win[1]+win[3],size,i,w:win[2],h:win[3],g};}
/* ---------- THE SILL ITSELF — the fourth attempt, and the first one that is not about size ----------
   The owner has asked four times. 2026-09-08: the skulls share a sill. 2026-09-09 and 2026-09-10:
   "the skulls are still hidden on the sills." 2026-09-12: "another attempt at showing the WINDOW
   SILLS." Read that last one literally, because it is the clue the three previous fixes all missed:
   he is not only asking to see the candy. **There was never a sill.** `propSill` computes a y called
   `sill` and nothing has ever DRAWN one — the candy stood on the bottom edge of a hole in a wall.
   The three answers so far were all the same answer: 8px of sweet, then 5px, then 0.85 of the pane,
   then the whole pane lit. Each was measured, each was defensible, and after each one he came back,
   because the thing missing was not a dimension.
   What a sill is, and why it reads when a 7-pixel sweet does not: it is a HORIZONTAL EDGE, the full
   width of the opening and wider, bright on top and dark underneath, with a shadow cast on the wall
   below it. A hard light/dark horizontal boundary survives being scaled down to three pixels — it is
   the one shape that does — which is exactly why the papel picado in the same frame never had this
   problem and the candy did. And it gives the sweet a thing to stand ON and to silhouette against,
   instead of floating in a dark recess the same colour as itself.
   One drawing, used by the front camera and by the 3D sprite, so the two cannot drift. Top-down and
   iso get nothing: you cannot see a ledge from directly above, and pretending otherwise is the
   "drawn in some cameras" bug this repo already has a register entry for. */
/* WHOLE TILE-PIXELS, and the stone gets most of them. The first build of this ledge used 2.5 and
   2.5 with fractional bands inside them, and in 3D the sprite's canvas is FIVE DEVICE PIXELS TALL —
   so the pale stone came out one and a half pixels of antialiased mush under two and a half pixels
   of shadow, and the whole ledge read as a dark smear. Rendered, looked at, and only then believed.
   The stone is the thing that has to read; the shadow only has to say the stone is in front. */
const SILL_OUT=1.5, SILL_LIP=4, SILL_CAST=2;
const sillBoxW=w=>w+SILL_OUT*2, sillLedgeH=()=>SILL_LIP+SILL_CAST;
/* the ledge on its own, drawn from its own top-left. Separate from the pane on purpose: in 3D the
   pane is a sprite that has worked for two versions and the ledge is a SECOND sprite hung under it,
   so adding the sill cannot move, resize or dim the thing that was already right. That is not
   tidiness — the third attempt at this bug was lost exactly there, by rebuilding the sprite that
   worked in order to add the piece that was missing. */
function drawSillLedge(g,x,y,w){
  const W=sillBoxW(w);
  g.fillStyle="#F7F2E2";g.fillRect(x,y,W,3);                      /* the stone, lit from above: THREE whole pixels */
  g.fillStyle="#8A7F66";g.fillRect(x,y+3,W,1);                    /* its hard underside — the edge that does the work */
  g.fillStyle="rgba(16,12,22,.42)";g.fillRect(x+1,y+4,W-2,2);}    /* and what it throws on the wall */
/* ---------- AND THE WINDOW UNDER IT (owner, 2026-09-17) ----------
   "the skull on a non existing or visible window sill overlaps a store front that was initially a
   placeholder for a mural… if there were a window sill there, it should be drawn and then a skull
   can be included and then the store front icon or mural can go around it."

   Rendered at 8x before touching anything, which is the only reason this is the right fix: the
   plain facade `B` painted its two windows as ONE FLAT RECTANGLE each, a shade off the wall — no
   frame, no glass, no reveal, no ledge — and the mural panel then painted plaster over the whole
   32x32, erasing even those. What the owner was looking at is a lit pane, a sugar skull and a
   stone ledge floating in the middle of a blank wall, because every one of them is computed from a
   `win` rect in TILES that NOTHING HAS EVER DRAWN. Four fixes to this bug argued about the candy's
   size. The candy was never the fault: it was standing on data.

   So the window becomes a real thing, from the same `win` rect the sill props already read, in one
   drawing every camera goes through — and `drawSillLedge` here is the SAME function the prop uses,
   at the same coordinates (proved in drawSillBox: ox=win[0], by=win[1]+win[3]), so the tile's sill
   and the candy's sill are one ledge and cannot drift apart.

   `glass:false` is for a front that paints its own glass and only wants the joinery — El Mercado's
   produce window, La Cocina's bowl. They get a reveal, a lintel and a ledge; what is behind the
   pane stays theirs. */
const winsOf=ch=>((TILES[ch]||{}).win)||[];
/* A DECORATION PAINTED ON A WALL MAY PAINT OUT A WINDOW. A muralist does exactly this: the wall is
   the canvas and you plaster over the pane that is in the way. A DECOS row says which windows it
   LEAVES with `wins:[i,…]` (indices into the glyph's TILES.win); no `wins` means it leaves them all,
   `wins:[]` means the wall is now blank. Three readers go through here so a painted-out window
   cannot come back somewhere else: the decor's own art, the sill props that stand in windows, and
   the dusk lighting — which would otherwise light a window that is not there any more, at night,
   on a wall nobody would think to check. */
const DECOWIN=(()=>{const m={};(typeof DECOR!=="undefined"?DECOR:[]).forEach(d=>{if(d.wins)m[d.world+","+d.x+","+d.y]=d.wins;});return m;})();
function winsKept(world,x,y){const all=winsOf(glyphAt(world,x,y)),k=DECOWIN[world+","+x+","+y];
  return k?k.map(i=>all[i]).filter(Boolean):all;}
function drawPane(g,x,y,w,h,opts){ /* NOT drawWindows(w,camX,camY) two thousand lines down — that one lights rooms at dusk. This one builds the window. Naming them alike is how the first draft of this fix silently drew nothing: a second `function drawWindows` hoisted over mine and every call reached the wrong one, in total silence. */
  const o=opts||{},dark=tc("#241C24");
  if(o.glass===false){                                                /* the front paints its own glass — a reveal AROUND it, never over it */
    g.fillStyle=dark;g.fillRect(x-1,y-1,w+2,1);g.fillRect(x-1,y+h,w+2,1);g.fillRect(x-1,y,1,h);g.fillRect(x+w,y,1,h);
  }else{
    g.fillStyle=dark;g.fillRect(x-1,y-1,w+2,h+2);                     /* the reveal: a window is a hole before it is anything else */
    const gr=g.createLinearGradient(0,y,0,y+h);
    gr.addColorStop(0,"#7C9AB8");gr.addColorStop(0.42,"#3E4C60");gr.addColorStop(1,"#20293A"); /* sky at the head, the room at the foot */
    g.fillStyle=gr;g.fillRect(x,y,w,h);
    g.fillStyle="rgba(236,244,252,.26)";                              /* the one thing that says GLASS: a reflection that is not the sky */
    g.beginPath();g.moveTo(x,y);g.lineTo(x+w*0.62,y);g.lineTo(x,y+h*0.62);g.closePath();g.fill();
    g.fillStyle=tc("#2A2228");                                        /* the mullions — four panes, because two is a shape and four is a window */
    g.fillRect(x+w/2-0.5,y,1,h);g.fillRect(x,y+Math.round(h*0.42),w,1);}
  g.fillStyle=tc("#8A757C");g.fillRect(x-1.5,y-3,w+3,2);              /* the lintel it hangs from */
  g.fillStyle="rgba(255,255,255,.16)";g.fillRect(x-1.5,y-3,w+3,0.8);
  drawSillLedge(g,x-SILL_OUT,y+h,w);}                                 /* and the ledge, the one the candy stands on */                               /* and the ledge, the one the candy stands on */
/* every window a glyph declares, drawn where the glyph is. One call per facade, so a front that
   forgets is a front with no windows rather than a front with invisible ones. */
function drawPanes(g,ch,sx,sy,opts){winsOf(ch).forEach(r=>drawPane(g,sx+r[0],sy+r[1],r[2],r[3],opts));}
/* pane, candy and ledge together, for the one camera that can draw them in one go */
function drawSillBox(g,x,y,w,h,foil,z){
  const ox=x+SILL_OUT, by=y+h;
  drawSillLit(g,ox,y,w,h);
  if(z>0){const cx=ox+(w-z)/2;
    /* a soft dark halo, so cream sugar on a warm pane still has an edge at three screen pixels */
    g.save();g.fillStyle="rgba(26,20,32,.45)";g.fillRect(cx-0.8,by-z-0.8,z+1.6,z+0.8);g.restore();
    drawCalaverita(g,cx,by-z,foil,z);}
  drawSillLedge(g,x,by,w);}
function drawOfrenda(g,x,y){ /* la ofrenda (Nacho, 2026-09-07; the owner: "sounds like a good idea"): a tiered table under a marigold arch —
  the cloth, three candles, pan de muerto, a calaverita, and at the top an EMPTY frame, nobody named: "that one's for whoever needs it".
  The owner's own document with the basics refines this when it arrives. */
  const P=petalPal();
  g.fillStyle="#5A2E7A";g.fillRect(x+2,y+20,28,10);g.fillStyle="#7B4BA8";g.fillRect(x+2,y+20,28,2);      /* the lower cloth */
  g.fillStyle="#E2620F";g.fillRect(x+6,y+13,20,7);g.fillStyle="#F2870F";g.fillRect(x+6,y+13,20,1.5);        /* the upper tier */
  g.strokeStyle="#7A2E12";g.lineWidth=2.4;g.beginPath();g.arc(x+16,y+14,13,Math.PI*1.05,Math.PI*1.95);g.stroke(); /* the arch */
  for(let i=0;i<11;i++){const t=Math.PI*(1.08+0.84*i/10);petalShape(g,x+16+Math.cos(t)*13,y+14+Math.sin(t)*13,t+Math.PI/2,0.9,P[2+(i%4)]);}
  [[8,21],[16,14],[24,21]].forEach(([cx,cy],i)=>{g.fillStyle="#F6F2E8";g.fillRect(x+cx-1.2,y+cy-6,2.4,6);g.fillStyle="#FFC300";g.beginPath();g.ellipse(x+cx,y+cy-7,1,1.8,0,0,7);g.fill();}); /* candles */
  g.fillStyle="#3A2E26";g.fillRect(x+12,y+3,8,7);g.fillStyle="#F6F2E8";g.fillRect(x+13,y+4,6,5);         /* the empty frame */
  g.fillStyle="#B8722E";g.beginPath();g.arc(x+11,y+18,3,0,7);g.fill();g.fillStyle="#E8B86A";g.fillRect(x+10.5,y+15.5,1,5);g.fillRect(x+8.5,y+17.5,5,1); /* pan de muerto */
  drawCalaverita(g,x+18,y+12.5,"#E8478F");
  g.fillStyle="#F6F2E8";g.beginPath();g.arc(x+4,y+24,1.4,0,7);g.arc(x+28,y+24,1.4,0,7);g.fill();          /* two cups of water */
  drawPapelRow(g,x+2,x+30,y+25,art("papel",["#E8478F","#2FA5A0","#F2B705"]),3);}
function fiestaProps(wid){return (art("props",[])||[]).filter(p=>p.world===wid);} /* small things set down by place: {world,x,y,kind,ox,oy,h,foil} */
function drawPapelRow(g,x0,x1,ly,pal,seed){ /* a string of cut paper (Pili, 2026-09-07): little squares with a scalloped hem and a punched
  hole — paper, not bunting — in TWO rows, the second half a flag over; two rows is what makes a street look dressed */
  g.strokeStyle="#3A2E26";g.lineWidth=1;g.beginPath();g.moveTo(x0+2,ly);g.lineTo(x1-2,ly);g.moveTo(x0+4,ly+5.5);g.lineTo(x1-4,ly+5.5);g.stroke();
  [0,1].forEach(row=>{let k=row*3;for(let px=x0+3+row*2.3;px<x1-3;px+=4.6,k++){const col=pal[(k+seed)%pal.length],fy=ly+row*5.5;
    g.fillStyle=col;g.fillRect(px-1.8,fy,3.6,3.6);
    g.beginPath();g.moveTo(px-1.8,fy+3.6);g.lineTo(px-0.9,fy+4.8);g.lineTo(px,fy+3.6);g.lineTo(px+0.9,fy+4.8);g.lineTo(px+1.8,fy+3.6);g.closePath();g.fill();
    g.fillStyle="rgba(40,30,20,.55)";g.fillRect(px-0.4,fy+1.2,0.8,0.8);}});}
/* A LIT WINDOW behind a sill candy (#131 again, owner 2026-09-10: "skulls are still hidden").
   Twice now this was answered by changing the sweet's SIZE — 8px to 5px, then back up to 0.85 of
   the pane — and twice the owner came back saying he still could not see them. He was right both
   times, and the size was never the fault. A calaverita is eight pixels on a forty-pixel tile, on a
   wall about a unit high, seen from a dozen tiles back: at that distance it is three or four screen
   pixels of cream against a dark recess, and NO ratio makes three pixels read. Look at what does
   read in the same shot — the papel picado. Bright, saturated, repeated.
   So light the window instead of growing the candy. A warm pane among dark ones is a big saturated
   shape that carries all the way to the back of the street, and it is the true picture besides: a
   veladora is lit on the sill and the sugar skull sits in front of it. The candy stops being the
   thing you must see and becomes the thing you find when you walk up to it, which is the right job
   for an eight-pixel sweet. */
function drawSillLit(g,x,y,w,h){
  if(!(w>0&&h>0))return;
  g.save();
  const gr=g.createLinearGradient(0,y,0,y+h);
  gr.addColorStop(0,"#F2B705");gr.addColorStop(0.55,"#E8873A");gr.addColorStop(1,"#8A3F1E");
  g.fillStyle=gr;g.fillRect(x,y,w,h);
  g.fillStyle="rgba(255,241,200,.85)";g.fillRect(x+w/2-0.6,y+h*0.28,1.2,h*0.42); /* the veladora's flame */
  g.restore();}
function drawCalaverita(g,x,y,foil,size){ /* a calaverita de azúcar, 8×8 (Pili): white sugar, FOIL sockets — black would read Halloween, foil reads
  candy — an icing brow, dots across the crown, a line under the jaw so it sits instead of floats.
  size: draw it smaller than 8 when it has to fit a window (#131). The whole sweet scales; nothing
  in it is re-drawn, so a small one is the same candy seen from further away. */
  const sc=(size||8)/8;
  if(sc!==1){g.save();g.translate(x,y);g.scale(sc,sc);x=0;y=0;}
  try{
  g.fillStyle="#D9CFC0";g.fillRect(x+1,y+7.4,6,0.8);
  g.fillStyle="#F6F2E8";g.beginPath();g.roundRect(x,y,8,6,2.5);g.fill();g.fillRect(x+2,y+5.5,4,2);
  g.fillStyle=foil||"#E8478F";g.fillRect(x+1.5,y+2,2,2);g.fillRect(x+4.5,y+2,2,2);
  g.fillStyle="#FFFFFF";g.fillRect(x+1.5,y+2,0.8,0.8);g.fillRect(x+4.5,y+2,0.8,0.8);
  g.strokeStyle="#F2B705";g.lineWidth=0.8;g.beginPath();g.arc(x+4,y+2.6,2.8,Math.PI*1.15,Math.PI*1.85);g.stroke();
  g.fillStyle="#7B4BA8";[1.5,4,6.5].forEach(dx=>g.fillRect(x+dx-0.45,y+0.2,0.9,0.9));
  g.fillStyle="#2FA5A0";g.fillRect(x+3.5,y+3.7,1,1);
  g.fillStyle="#3A2E26";g.fillRect(x+3,y+5.7,0.5,1);g.fillRect(x+4.5,y+5.7,0.5,1);
  }finally{if(sc!==1)g.restore();}}
function canopyDress(g,cxT,cyT){ /* the trees dressed for the night (owner, 2026-09-07: "trees can be decorated"; Pili's recipe): a garland of
  petals slung across the canopy, three papel streamers hanging BELOW it into the trunk — hanging is what reads as decorated rather than
  repainted — and one sugar-skull lantern on a thread. One; three is a Christmas tree. Nothing without a season. */
  const pal=art("papel",null);if(!pal)return;const P=petalPal();
  g.strokeStyle=P[2];g.lineWidth=1.5;g.beginPath();g.moveTo(cxT-11,cyT+1);g.quadraticCurveTo(cxT,cyT+6,cxT+11,cyT+1);g.stroke();
  for(let i=0;i<9;i++){const t=(i+0.5)/9,x=cxT-11+22*t,y=cyT+1+2*t*(1-t)*5;petalShape(g,x,y,Math.PI+(i%3-1)*0.5,0.6,P[3+(i%3)]);}
  [-8,0,8].forEach((dx,i)=>{const col=pal[(i+2)%pal.length];g.fillStyle="#3A2E26";g.fillRect(cxT+dx-0.4,cyT+7,0.8,4);
    g.fillStyle=col;g.fillRect(cxT+dx-2,cyT+11,4,3.6);g.beginPath();g.moveTo(cxT+dx-2,cyT+14.6);g.lineTo(cxT+dx-1,cyT+15.8);g.lineTo(cxT+dx,cyT+14.6);g.lineTo(cxT+dx+1,cyT+15.8);g.lineTo(cxT+dx+2,cyT+14.6);g.closePath();g.fill();
    g.fillStyle="rgba(40,30,20,.55)";g.fillRect(cxT+dx-0.4,cyT+12.2,0.8,0.8);});
  g.fillStyle="#3A2E26";g.fillRect(cxT+4.6,cyT+9,0.8,4);drawCalaverita(g,cxT+1,cyT+13);}
const BRIDGE_PETALS=["#7A2E12","#B8410E","#E2620F","#F2870F","#FBB024","#FFD972"]; /* embers to pale gold, dark first: a heap needs a value range (Pili, 2026-09-07) */
function petalPal(){const b=art("bridge",null);return b&&b.length>=6?b:BRIDGE_PETALS;}
const PETAL_PATH=(()=>{try{const p=new Path2D();p.moveTo(0,0);p.quadraticCurveTo(-1.9,-1.6,-1.5,-3.4);p.lineTo(-0.5,-4.2);p.lineTo(0,-3.6);p.lineTo(0.5,-4.2);p.lineTo(1.5,-3.4);p.quadraticCurveTo(1.9,-1.6,0,0);p.closePath();
  const r=new Path2D();r.moveTo(0,-0.5);r.lineTo(0,-2.8);return {p,r};}catch(e){return null;}})();
function petalShape(g,px,py,a,s,col,rib){ /* one cempasúchil petal (Pili, 2026-09-07): "not a lentil" — a fan, narrow at the
  root, widening to a squared, notched tip, and a rib down the middle; the rib is what says petal.
  Tens of thousands of these bake a deck, so the path is built once (Path2D) and placed with one
  transform — no save/restore, no path rebuilt per petal. */
  const m=g.getTransform(),c=Math.cos(a)*s,sn=Math.sin(a)*s;
  g.transform(c,sn,-sn,c,px,py);
  if(PETAL_PATH){g.fillStyle=col;g.fill(PETAL_PATH.p);if(rib!==false){g.strokeStyle=rib||"rgba(60,20,5,.35)";g.lineWidth=0.6;g.stroke(PETAL_PATH.r);}}
  else{g.fillStyle=col;g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(-1.9,-1.6,-1.5,-3.4);g.lineTo(-0.5,-4.2);g.lineTo(0,-3.6);g.lineTo(0.5,-4.2);g.lineTo(1.5,-3.4);g.quadraticCurveTo(1.9,-1.6,0,0);g.fill();
    if(rib!==false){g.strokeStyle=rib||"rgba(60,20,5,.35)";g.lineWidth=0.6;g.beginPath();g.moveTo(0,-0.5);g.lineTo(0,-2.8);g.stroke();}}
  g.setTransform(m);}
const DECK_PETALS=[2000,1700,1100],DECK_DEEP=43200; /* a deck tile: fifty times the first cut at once (owner, 2026-09-07: "multiply the amount of
   leaves times 10", "do 50x the petals, it does look better"), then TEN times that ("definitely do like 10x the amount of petals for the
   bridge") filled in behind the frame — 48,000 a tile would stall a phone for seconds if baked in one go, so the rest is drawn in
   idle slices of twelve hundred (PETALDEEP) and the 3D lid re-bakes once when the last slice lands. Only the surface ever shows. */
const PETALDEEP=[];let petalDeepTimer=0;
function petalDeepQueue(c,seed,n,rn,rs){PETALDEEP.push({c,seed,left:n,done:0,y0:rn?2.5:0,y1:c.height-(rs?2.5:0)});petalDeepArm();}
function petalDeepArm(){if(petalDeepTimer||!PETALDEEP.length)return;
  const run=()=>{petalDeepTimer=0;petalDeepStep();if(PETALDEEP.length)petalDeepArm();else if(typeof t3Invalidate==="function")t3Invalidate();};
  petalDeepTimer=(typeof requestIdleCallback==="function")?requestIdleCallback(run,{timeout:300}):setTimeout(run,16);}
function petalDeepPending(){return PETALDEEP.reduce((a,j)=>a+j.left,0);}
function petalDeepStep(chunk){chunk=chunk||1200;const j=PETALDEEP[0];if(!j)return 0;
  const g=j.c.getContext("2d"),P=petalPal(),W=j.c.width;let sd=j.seed;const rnd=()=>{sd=(sd*1103515245+12345)&0x7fffffff;return sd/0x7fffffff;};
  const n=Math.min(chunk,j.left);g.save();g.beginPath();g.rect(0,j.y0,W,j.y1-j.y0);g.clip();
  for(let i=0;i<n;i++)petalShape(g,-3+rnd()*(W+6),-3+rnd()*(W+6),rnd()*Math.PI*2,1.0+rnd()*0.3,P[(j.done+i)%P.length]);
  g.restore();j.left-=n;j.done+=n;j.seed=sd;if(!j.left)PETALDEEP.shift();return n;}
const PETALCACHE=new Map();
function petalBake(key,W,H,paint,seed){ /* petals are many and never move: bake a tile once (per season), blit after */
  const k=seasonNow()+"|"+key;let c=PETALCACHE.get(k);if(c)return c;
  if(PETALCACHE.size>400)PETALCACHE.clear();
  c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");
  let sd=seed|0;const rnd=()=>{sd=(sd*1103515245+12345)&0x7fffffff;return sd/0x7fffffff;};
  paint(g,rnd);c.fresh=true;PETALCACHE.set(k,c);return c;}
function bridgeEdges(x,y){ /* "10"/"01"/"11"/"00": does a rail stand on the north edge, on the south edge — none where the next tile is deck too */
  const w=CW();const isB=(ax,ay)=>!!(w&&w.rows[ay]&&(TILES[w.rows[ay][ax]]||{}).kind==="bridge");
  if(!w)return "11";const ew=(TILES[(w.rows[y-1]||"")[x]]||{}).kind==="water"||(TILES[(w.rows[y+1]||"")[x]]||{}).kind==="water"||!((TILES[(w.rows[y]||"")[x-1]]||{}).kind==="water"||(TILES[(w.rows[y]||"")[x+1]]||{}).kind==="water");
  return ew?((isB(x,y-1)?"0":"1")+(isB(x,y+1)?"0":"1")):((isB(x-1,y)?"0":"1")+(isB(x+1,y)?"0":"1"));}
const PETALS=[],PETAL_N=90,PETAL_MS=90000;
function petalsOn(){return art("bridgeStyle","bands")==="petals";}
function bridgeDist(w,x,y){ /* Chebyshev distance to the nearest deck tile, up to 3; cached per world */
  if(!w._pd||w._pdW!==w.rows.join("\n")){w._pdW=w.rows.join("\n");const d={};
    const decks=[];for(let yy=0;yy<w.H;yy++)for(let xx=0;xx<w.W;xx++)if((TILES[w.rows[yy][xx]]||{}).kind==="bridge")decks.push([xx,yy]);
    decks.forEach(([bx,by])=>{for(let yy=by-3;yy<=by+3;yy++)for(let xx=bx-3;xx<=bx+3;xx++){const k=xx+","+yy,dd=Math.max(Math.abs(xx-bx),Math.abs(yy-by));if(d[k]===undefined||dd<d[k])d[k]=dd;}});
    w._pd=d;}
  const v=w._pd[x+","+y];return v===undefined?9:v;}
function petalSpill(w,x,y,sx,sy,scale){
  if(!petalsOn())return;const d=bridgeDist(w,x,y);if(d<1||d>3)return;
  const n0=d===1?78:d===2?33:6,sc=scale||1; /* three times the first cut, thickest beside the deck, a few three tiles out */
  /* A DRIFT BANKS AGAINST WHAT STANDS BESIDE IT (crew iteration 11, la calle from Pili): by distance alone the
     spill was a circular stain round the deck. Twice the count where a SOLID neighbour stops the petals —
     a fence, a curb, a wall — and four tenths of it in the open, where all four neighbours could be walked. */
  const gr=w.grid||w.rows,nb=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>{const r=gr[y+dy];return r?r[x+dx]:undefined;}).filter(g=>g!==undefined);
  const solidN=nb.filter(g=>SOLID.has(g)).length,openN=nb.filter(g=>!SOLID.has(g)&&(TILES[g]||{}).kind!=="water"&&(TILES[g]||{}).kind!=="bridge").length;
  const n=Math.max(1,Math.round(n0*(solidN?2:openN===4?0.4:1)));
  const c=petalBake("spill|"+x+"|"+y+"|"+sc+"|"+n,Math.ceil(TS*sc),Math.ceil(TS*sc),(g,rnd)=>{const P=petalPal();
    for(let i=0;i<n;i++){const px=rnd()*TS*sc,py=rnd()*TS*sc,a=rnd()*Math.PI*2;petalShape(g,px,py,a,1.0*sc,P[1+((i+d)%(P.length-1))]);}},((x|0)*911+(y|0)*271+3)|0);
  ctx.drawImage(c,sx,sy);}
/* ---------- el trolley (owner, 2026-09-08) — it comes on its own, it stops for anyone on the line, and it comes
   when you stand at a stop. Content declares the line in TROLLEYAT; the engine knows nothing about where. ---------- */
/* TRO_SPEED 3.4 -> 6.0, owner 2026-09-11 ("ok tram can be faster", then "do both the wheel and
   speed please"). At 3.4 the tram was 18% SLOWER than the hero's legs (240 ms/tile = 4.17 tiles/s),
   which is why it could never be transport and why "convenience, not transport" was the only
   coherent reading of it. At 6.0 it is 44% faster.
   The window, measured rather than argued. FLOOR 5.4: a person notices a speed difference at about
   30%, and "barely beats walking" is not convenience. CEILING ~7.9: the 3D window on that row is
   9.9 tiles and nose-in to tail-out is 11.9, and a vehicle must be on screen 1.5 s or it reads as a
   smear rather than a thing that arrived. (The 10.4 that circulated for a day was CSS width / TS and
   conflated CSS pixels with world tiles.) 6.0 sits inside rather than near an edge.
   The wagon-wheel worry that gated this is answered and it was never the risk: a 12-gon 5.5 CSS px
   across has a circular silhouette. The real wheel fault was a second rotation undoing the axle, it
   shipped in mq-v144, and this change is deliberately AFTER it so the faster tram is one with wheels
   on it. docs/3D-LOG.md 2026-09-11. */
const TRO_EVERY=19000,TRO_SPEED=6.0,TRO_LEN=2,TRO_HOLD=1400,TRO_LOOK=2.6;
/* TRO_GAP — the coupling gap between two car BODIES, in tiles, and it is an engine constant for the
   same reason TRO_DWELL is: a coupler is not anybody's taste. Rigo's file settles it in one line —
   a depot may repaint "the panel, the band, the roof, the lining, the crest, the blind", and never
   "the pole, the fender, the doors, the bogie, the length, the number of cabs", because each of
   those "is decided by the wire, the platform, the rails or the terminus, and not by anybody's
   preference" (.claude/agents/rigo.md). The gap is the coupler and the coupler is the rails'.
   DERIVED, not felt, the way that file demands: a tram coupler with its gangway is about 0.7 m; a
   tile here is a DOORWAY (the engine's 1.0, ~2.05 m), so 0.7 m is 0.34 tiles at full size — and the
   car itself is compressed, 2 tiles standing for a 9 m body, a factor of about 2.5. The same factor
   on the coupler gives 0.14. At 35 px a tile that is five pixels: a seam you can see and not a place
   a person could stand, which is what a coupler looks like from the kerb.
   TRO_CARS_MAX — a train longer than the street it runs on cannot stand clear of either end; the
   audit says so in words, and this stops a typo from hanging the line while it does. */
const TRO_GAP=0.14,TRO_CARS_MAX=8;
/* TRO_SHY — how far up the line a small living thing reads the car, in tiles. TRO_DWELL/TRO_REACH —
   how long the car stands at a platform for somebody walking up to it, and how close "walking up"
   is. All three are engine constants and not pack keys, like TRO_HOLD beside them: a tram waiting
   for a passenger is a RULE (every game with a tram wants it), and troAudit deliberately refuses a
   line that declares a word no reader exists for, so a `dwell:` key with no seam behind it would be
   a promise the engine does not keep. If a pack ever needs its own numbers they become one seam,
   once, with an audit entry each. docs/TAGS.md L16.
   ONE INVARIANT BINDS TWO OF THEM, AND IT IS CHECKED IN test/smoke.js rather than left to this
   comment: TRO_SHY > TRO_LOOK. If the critter reads the car later than the car reads the critter,
   the brake fires first, the car stops, it never gets close enough to frighten anything, and the two
   of them stand in the street looking at each other for ever. That is not a theory: it is the same
   deadlock the pigeon's lift threshold produced on 2026-09-11, found by a rendered mock and not by
   reading, and planting TRO_SHY=2 here reproduces it exactly — every critter in the city then fails
   the guard above with "never leaves the trolley line". */
const TRO_SHY=4,TRO_DWELL=3200,TRO_REACH=2;
const TRO={x:0,dir:1,state:"away",t:0,called:false,said:0,dwelt:0,dwellAt:null};
function troLine(wid){const L=(typeof TROLLEYAT!=="undefined"&&TROLLEYAT)?TROLLEYAT:[];return L.find(r=>r.world===(wid||world))||null;}
/* ---- WHERE THE LINE SERVES — the pack says it, in tile coordinates ----
   `stops` is a list of PLATFORM tiles: the tile a person stands on to be served. It is beside the
   rails, never on them, and it is a LIST, so a reader can ask both questions — "is this a stop"
   (troIsStop) and "where is the next one ahead of the car". The second is what braking needs and no
   amount of asking the first will ever give it to you.
   Omit `stops` and the line has none: nothing calls the car, nothing opens the pass, and the run is
   frame-for-frame what it was. Until 2026-09-11 this was one town's letter "Y", read straight out of
   the engine in two places (docs/TAGS.md L20). */
function troStops(L){return (L&&Array.isArray(L.stops))?L.stops.filter(function(s){return s&&typeof s.x==="number"&&typeof s.y==="number";}):[];}
function troIsStop(wid,x,y){return troStops(troLine(wid)).some(function(s){return s.x===x&&s.y===y;});}
/* ---- HOW MANY CARS — the one word a pack may say about a TRAIN, and why it is the only one ----
   The owner, 2026-09-22: "we want to make this custom as possibly can turn in to a train of trolleys
   in other games and a new level unless you recommmend otherwise."
   `cars: n` (omit it and it is 1) rides on the LINE's own row, not on the car, because the number of
   cars is not a livery: it is set by how long the platform is and how long the terminus track is, and
   both of those belong to the route. Rigo again, and he is the reason this is one key and not five.
   THE FOUR OTHER THINGS A TRAIN HAS AND THIS SEAM DELIBERATELY DOES NOT SAY, each with its reason,
   because docs/TAGS.md L16 is that a pack which declares HALF is the one that gets hurt:
   · the coupling distance — TRO_GAP above: a rule, identical in both games, not a choice;
   · which cars are powered — nothing in this engine has ever read power, and a key with no reader is
     "the one where somebody wrote a line, saw nothing happen, and had no way to find out why";
   · which car the driver is in — a rule, and the answer is the LEADING one, which is troLead: a tram
     has a cab at each end and one driver, who walks the length of it rather than the car turning round;
   · which car the doors open on — THERE ARE NO DOORS. The car is glazed on four sides and has an open
     cab at each end; nothing in either game opens, closes, or draws a door on it. A `doors:` key would
     be a promise the engine cannot keep, and troAudit exists to refuse exactly that.
   The whole train is ONE RIGID BODY at one speed on one straight row — which is all this engine has
   ever been able to be, and is honest for a street tram: it cannot bend, and the line it runs is a
   single `row`, so there is no curve for it to swing out on. */
function troCars(L){const n=L&&L.cars;
  return (typeof n==="number"&&isFinite(n)&&n>=1)?Math.min(TRO_CARS_MAX,Math.floor(n)):1;}
/* how much street the whole train occupies. ONE car is TRO_LEN exactly — every reader below is the
   expression it was before, to the bit, for a line that says nothing about cars. */
function troSpan(L){const n=troCars(L);return n*TRO_LEN+(n-1)*TRO_GAP;}
/* where the LEADING car starts — the one with the driver in it, and the one that berths at the
   platform. A train stops with its first car at the stop; the rest of it trails past, and the people
   in those cars walk forward. For one car this is TRO.x whichever way it points. */
function troLead(L){return TRO.dir>0?TRO.x+troSpan(L)-TRO_LEN:TRO.x;}
function troTiles(L){const a=Math.min(L.from,L.to),b=Math.max(L.from,L.to),out=[];for(let x=a;x<=b;x++)out.push([x,L.row]);return out;}
/* what stands on the line — a wall, a lot, a person, a door. The owner's rule: nothing may. */
function troBlocked(wid){const L=troLine(wid);if(!L)return [];const w=WORLDS[L.world];if(!w)return [];
  return troTiles(L).filter(([x,y])=>{const g=w.rows[y]&&w.rows[y][x],lg=w.grid[y]&&w.grid[y][x];
    return g===undefined||SOLID.has(g)||SOLID.has(lg)||lg==="N"||(typeof portalAt==="function"&&portalAt(L.world,x,y));})
    .map(([x,y])=>x+","+y);}
/* is anyone standing on the rails just ahead of the nose? then it waits */
/* `near` spans the car's WHOLE BODY plus the look-ahead: from the tail at -TRO_LEN to 2.6 ahead of
   the nose. It used to start at -0.6, which left the 1.4 tiles between the tram's own door and its
   own tail invisible to it — 30% of the span where anything can interact with the tram at all, and
   exactly where you end up if you step onto the rails just after the front of it goes past you.
   Chava filmed both halves of it in one trace: Paloma sat out the whole approach on the kerb and
   then stepped on at d=-0.70, a tenth of a tile past the edge, and six consecutive samples show her
   drawn inside the car with the tram still running; then he did it to himself at d=-1.13 and stood
   chest-deep in a moving tram for 230 ms. Both the brake AND the bird's lift keyed off the same
   -0.6, so a thing that steps on beside the door missed both at once.
   A ratio of distances, so it was identical at 3.4 and 6.0 — the speed neither caused it nor
   changed it, it only made the band sweep past twice as fast. */
/* ...and on a TRAIN the body the band covers is the WHOLE train, not the first car: the tail of a
   three-car set is six tiles behind the driver and a person standing beside it is standing beside a
   moving vehicle. `troSpan` is that length; for one car it is TRO_LEN and this line is unchanged. */
function troAhead(L){const sp=troSpan(L),nose=TRO.x+(TRO.dir>0?sp:0),near=v=>{const d=(v-nose)*TRO.dir;return d>=-sp&&d<=TRO_LOOK;};
  if(world===L.world&&Math.round(py)===L.row&&near(px))return true;
  const w=WORLDS[L.world];if(w&&w.npcs.some(n=>n.y===L.row&&near(n.x)))return true;
  if((typeof CRIT!=="undefined"?CRIT:[]).some(c=>c.world===L.world&&Math.round(c.y)===L.row&&near(c.x)))return true;
  /* ...and the animals the engine moves through their own globals rather than through CRITTERS.
     The owner, 2026-09-11: "braking for the hummingbird and running over the pigeon is not a policy,
     it is a blind spot." Meridian did exactly that, by species, by name — the colibri is declared in
     CRITTERS so the tram braked for her, and Paloma was a separate global so it drove through her.
     Chava filmed her being drawn INSIDE the tram's third window, twice inside sixty seconds of
     standing at the stop, on the same rails where the same tram stopped dead for him and waited
     fifty seconds. There is no species list here: one question, is there something alive on the
     rails, and the answer does not depend on what kind of thing it is. */
  return [["dog",typeof DOG!=="undefined"?DOG:null],["cat",typeof CAT!=="undefined"?CAT:null],
          ["pig",typeof PIG!=="undefined"?PIG:null]]
    .some(function(e){const a=e[1];
      /* ...and a bird that is ALREADY IN THE AIR is not on the rails. It is one condition and it is
         simply true, which is why it is here rather than in the lift's threshold.
         Lupe measured the alternative and it is the reason this line exists: the lift's lead was
         written as a fraction of the speed (TRO_SPEED*0.9) precisely so it would survive a speed
         change, and the comment above it said so — but she stays logically on the rails for the whole
         560 ms flight, so the lead must clear the brake window PLUS the flight, and 0.9v > 2.6+0.56v
         only holds above v=7.65. At 3.4 the tram never braked for her; at 6.0 it braked 83 ms before
         she was clear, so every fourth tram made a 1.4 s unexplained stop for a bird already flying
         away. Widening the threshold to 2.6+0.56v would also have worked and is a magic number that
         couples the bird to the brake window and rots the next time either moves. This does not:
         she is off the rails when she is off the ground, at any speed, forever.
         The brake is still the backstop. A bird that is standing there — because the lift could not
         fire, or because she never lifted — stops the tram exactly as the owner ruled. */
      if(a&&a===(typeof PIG!=="undefined"?PIG:null)&&a.lift)return false;
      return a&&AW(e[0])===L.world&&Math.round(a.y)===L.row&&near(a.x);});}
/* is the PLAYER at a stop — the player and nobody else. docs/TAGS.md L19: the tamale lady stands
   beside the ex stop for ever and she is not a passenger. Same 3x3 reach as the glyph sniff it
   replaces, over the tiles the line declares instead of over the tiles the map paints. */
function troAtStop(L){if(!L||world!==L.world)return false;
  return troStops(L).some(function(s){return Math.abs(s.x-px)<=1&&Math.abs(s.y-py)<=1;});}
/* ---- the rails are a road, and the things that live beside it know that ----
   troDanger answers one question with no side effects: is that tile a rail with a car close enough
   to matter? It is deliberately WIDER than the brake window (TRO_SHY against TRO_LOOK), so
   a critter is already moving by the time the tram would have had to stop, and the tram never has to.
   The owner, 2026-09-11: "i mean she should be small enough and smart enough to stay away from the
   tram please." That is the colibri, declared in CRITTERS at st(16,4) with a four-tile Manhattan
   wander around home — which reaches row 2, the rails — and she hovers, so she could stand there
   indefinitely, and did: three of six trams in four minutes stopped for a hummingbird.
   The shipped answer to this in other games is ECO's: the player (here, the vehicle) carries a
   threat radius that grows FORWARD with speed, and an animal inside it leaves. docs/research/
   2026-09-11-critters-in-play.md. Ours is the same shape with a fixed lead, because our vehicle has
   one speed and runs on one axis.
   The brake in troAhead is untouched and stays the backstop. This is not a way of IGNORING a critter
   on the rails — that is the blind spot this same tram had two days ago, by species, and it cost a
   pigeon. It is a reason for there not to be one. */
function troDanger(wid,x,y){const L=troLine(wid);
  if(!L||L.row!==y||TRO.state==="away")return false;
  const sp=troSpan(L),nose=TRO.x+(TRO.dir>0?sp:0),d=(x-nose)*TRO.dir;
  return d>=-sp&&d<=TRO_SHY;}
/* ---- which platform the car's doors are at, and whether it should stand there ----
   The train always spans [TRO.x, TRO.x+troSpan(L)] whichever way it is pointed — one car is TRO_LEN
   of that and is the whole of it; only the nose, and which car leads, swap ends.
   The owner, 2026-09-11: "why wouldnt they stop for me? if im walking close to the tram, it should
   wait if it is already at the tram stop, if i missed it then its ok, itll take me a second and then
   i should be at the stop anyhow and wont mind a second to arrive."
   Both halves of that sentence are in troDwell. It waits — and the waiting ENDS, TRO_DWELL per
   platform per run, so one person standing on a kerb can never park the line. The budget is keyed by
   platform (`dwellAt`) rather than by run, because a line with two stops must be patient at the
   second one having already been patient at the first; and it is cleared when a run begins, so the
   next tram is as patient as this one was. */
/* A CAR SERVES A STOP FROM THE STREET, never from beyond its end. It is born its own length past the end of
   its run so it can drive in, and a stop at the run's first tile sat inside the serving window before
   the car had entered the street: on Calle Principal it stood at x=-2, its whole body past the west
   edge — off-screen in the top and front cameras, hanging in the dark in 3D — ran its dwell out there,
   and then ran past the person it had stopped for. The dwell guard read "dwell" and was satisfied; a
   state is a proxy for a picture. (The owner, 2026-09-21: "the trolley weirdness"; ridden by the line
   inspector, crew iteration 12.) troClampX is the one fact — where a car may stand on this street — read
   by the two things that stand a car at a platform: serving, below, and the ride's bell in rideStart. */
function troClampX(L,x){const w=L&&WORLDS[L.world];return w?Math.max(0,Math.min(w.W-troSpan(L),x)):x;}
/* WHICH CAR IS AT THE PLATFORM, and it is the LEADING one — the fault above, one size up. A stop is
   one tile; a three-car train is six. "Is the stop anywhere inside the train" is true when the stop
   is at the tail, six tiles behind the driver, and the person waiting watches a car go past, then
   another, and then a door that is not level with them. Every real service stops the FIRST car at
   the marker. troLead is that car; for one car it is TRO.x and this window is the one it always was. */
function troServing(L){if(!L||TRO.state==="away"||troClampX(L,TRO.x)!==TRO.x)return null;
  const a=troLead(L);
  return troStops(L).find(function(s){return s.x>=a-0.5&&s.x<=a+TRO_LEN+0.5;})||null;}
function troDwell(L,dt){const s=troServing(L);
  if(!s||world!==L.world)return false;
  const k=s.x+","+s.y;
  if(TRO.dwellAt!==k){TRO.dwellAt=k;TRO.dwelt=0;}
  if(TRO.dwelt>=TRO_DWELL)return false;                       /* "if i missed it then its ok" */
  if(Math.abs(px-s.x)+Math.abs(py-s.y)>TRO_REACH)return false; /* nobody walking up: it does not dawdle */
  TRO.dwelt+=dt;return true;}
function troCall(){TRO.called=true;}
function troUpdate(dt){const L=troLine();
  if(!L){TRO.state="away";return;}
  if(TRO.state==="away"){
    if(troAtStop(L)&&!TRO.called){TRO.called=true;if(T().troCome)toast(T().troCome,2200);}
    TRO.t+=dt;
    if(TRO.called||TRO.t>=TRO_EVERY){TRO.called=false;TRO.t=0;TRO.dwelt=0;TRO.dwellAt=null;
      TRO.dir=L.to>=L.from?1:-1;TRO.x=L.from-TRO.dir*troSpan(L);TRO.state="run";}
    return;}
  if(troAhead(L)){TRO.state="hold";TRO.t=0;return;}          /* somebody is crossing: wait */
  /* ...and somebody walking up to the platform it is standing at: doors open, and they close. This
     is BELOW the brake on purpose — a person on the rails is a different rule with a different
     reason, and it must be the one that answers first. */
  if(troDwell(L,dt)){TRO.state="dwell";return;}
  if(TRO.state==="hold"){TRO.t+=dt;if(TRO.t<TRO_HOLD)return;TRO.t=0;}
  TRO.state="run";TRO.x+=TRO.dir*TRO_SPEED*dt/1000;
  const end=L.to+TRO.dir*troSpan(L);   /* the run is over when the LAST car is off the street, not the first */
  if((TRO.dir>0&&TRO.x>end)||(TRO.dir<0&&TRO.x<end)){TRO.state="away";TRO.t=0;}}
/* ---------- EL PASEO — you ride it, you do not blink and arrive ----------
   The owner has circled this for days. 2026-09-11: "lets have the teleport survive for now but maybe
   the tram goes quickly if im on it, honks and everyone gets out of the way and we zip by in a
   'slow' teleport or teleport with animation before it lol am i describing literal decoration?" And
   2026-09-12, closing it: "so we still need clarification on the trolley? lets just build one and
   i'll give you feedback."
   So: built, and built to be argued with. Picking a destination in the pass no longer swaps the
   world under you. The bell rings, the car you are standing at takes you, it runs the line at
   RIDE_ZIP instead of TRO_SPEED — "we zip by" — and the world changes at the END of the line, where
   a ride ends. Everything that must happen on arrival still goes through worldArrived(), the one
   place it lives, because the last time the trolley had its own arrival path it quietly skipped the
   dog you were walking.
   WHAT IS DELIBERATELY CHEAP, so the feedback is about the right thing:
   · The hero is not hidden and re-drawn inside the car. `fx`/`fy` are the DRAW position and the
     camera reads them, so putting him on the tram's tile rides him and pans the camera in all four
     cameras for nothing. `px`/`py` never move, which is why the tram does not brake for its own
     passenger and why talk, doors and the brake all still think he is on the platform.
   · A pack with no line still travels instantly. The ride is what a tram adds, not a new rule about
     how travel works.
   · The brake stays ON during a ride. A tram that runs somebody over because the player was in a
     hurry is a worse bug than a ride that pauses. The honk is the answer to that and the critters
     already clear for it: troDanger asks TRO.state !== "away", and a ride is not away.
   The open question for the owner, stated here so the next session does not have to rediscover it:
   the ride always runs to the END of the line, because a line does not know which of its stops
   corresponds to which TRV destination. Making it stop AT the destination's platform needs one more
   fact in the pack — a stop that names a world — and that is a seam, not a tweak. */
/* RIDE_STUCK — a passenger is never trapped. The brake stays on during a ride, which is right, but
   the thing it brakes for might be a neighbour who wanders once every 1.6 to 4.8 seconds and happens
   to be standing on the line; the tram then waits, correctly, and the PLAYER cannot get off, cannot
   move and cannot see why. A held ride gives up after this long and puts you down where you asked to
   go. It is a soft-lock guard, not a feature: if you see it, the line has something living on it that
   is not moving, and that is the bug to fix. */
const RIDE_ZIP=11.0,RIDE_BELL=700,RIDE_STUCK=6000;
const RIDE={on:false,phase:"",t:0,held:0,to:null,fromW:"",fromX:0,fromY:0};
function rideCan(){const L=troLine();return !!(L&&troStops(L).length);}
function rideStart(d){
  const L=troLine();
  if(!L||RIDE.on)return false;
  RIDE.on=true;RIDE.phase="bell";RIDE.t=0;RIDE.held=0;RIDE.to=d;
  RIDE.fromW=world;RIDE.fromX=px;RIDE.fromY=py;
  /* stand the car at the platform you are on, doors open, whatever it was doing elsewhere */
  const s=troStops(L).reduce(function(a,b){return (Math.abs(b.x-px)<Math.abs(a.x-px))?b:a;});
  TRO.dir=L.to>=L.from?1:-1;
  TRO.x=troClampX(L,s.x-(TRO.dir>0?troSpan(L):0));TRO.state="dwell";TRO.dwelt=0;TRO.dwellAt=null; /* on the street, even at a stop on its first tile; on a train the LEADING car's nose comes to you */
  held=null;moving=false;
  if(T().troRide)toast(T().troRide,1800);
  return true;}
function rideUpdate(dt){
  if(!RIDE.on)return;
  const L=troLine(RIDE.fromW);
  if(!L){rideArrive();return;}
  RIDE.t+=dt;
  if(RIDE.phase==="bell"){                       /* the honk: everything alive reads TRO.state */
    if(RIDE.t<RIDE_BELL)return;
    RIDE.phase="zip";RIDE.t=0;TRO.state="run";}
  if(troAhead(L)){TRO.state="hold";RIDE.held+=dt;   /* still brakes. the honk is not a licence */
    if(RIDE.held>=RIDE_STUCK)rideArrive();return;}
  RIDE.held=0;
  TRO.state="run";TRO.x+=TRO.dir*RIDE_ZIP*dt/1000;
  const end=L.to+TRO.dir*troSpan(L);
  if((TRO.dir>0&&TRO.x>end)||(TRO.dir<0&&TRO.x<end))rideArrive();}
/* one entry point for the car, whether it is running the timetable or carrying you. Named and
   separate from loop() so the suite can drive the real path rather than a re-implementation of it —
   the ride's whole tell is that px/py do NOT move while fx/fy do, and a test that ticked rideUpdate
   by hand would be asserting its own copy of the interesting line. */
function troTick(dt){
  if(!RIDE.on){troUpdate(dt);return;}
  rideUpdate(dt);
  if(RIDE.on){const L=troLine(RIDE.fromW);fx=(L?troLead(L):TRO.x)+(TRO_LEN-1)/2;fy=(L||{row:fy}).row;} /* you ride in the leading car, where the driver is */}
function rideArrive(){
  const d=RIDE.to;
  RIDE.on=false;RIDE.phase="";RIDE.t=0;RIDE.held=0;RIDE.to=null;
  TRO.state="away";TRO.t=0;TRO.called=false;TRO.dwelt=0;TRO.dwellAt=null;
  if(!d){fx=px;fy=py;return;}
  world=d.w;px=fx=d.x;py=fy=d.y;held=null;moving=false;dir=d.dir||"down";
  worldArrived(RIDE.fromW,RIDE.fromX,RIDE.fromY);}
/* ONE CAR. `lead` says this is the car at the front of the train, which is the only one that carries
   the signal lamp — a train does not say three different things at once, and the lamp is "the only
   sentence the vehicle can say" (rigo.md). Default true so a one-car line is the car it always was. */
function drawTram(g,sx,sy,front,lead){const W=TS*TRO_LEN,H=TS;if(lead===undefined)lead=true;
  g.fillStyle="rgba(0,0,0,.18)";g.fillRect(sx+3,sy+H-5,W-6,4);
  g.fillStyle="#B0563A";g.beginPath();g.roundRect(sx+2,sy+(front?2:5),W-4,H-(front?8:12),5);g.fill();
  g.fillStyle="#8E4230";g.fillRect(sx+2,sy+(front?2:5),W-4,3);
  g.fillStyle="#D8E6F0";for(let i=0;i<3;i++)g.fillRect(sx+8+i*(W-20)/3,sy+(front?7:9),(W-24)/3,front?9:7);
  g.fillStyle="#E0A430";g.fillRect(sx+W/2-4,sy+(front?2:5)-2,8,2);
  g.fillStyle="#2B2536";[0.22,0.78].forEach(t2=>{g.beginPath();g.arc(sx+W*t2,sy+H-6,2.6,0,7);g.fill();});
  if(lead&&(TRO.state==="hold"||TRO.state==="dwell"||(RIDE.on&&RIDE.phase==="bell"))){
    /* red: it has stopped BECAUSE OF YOU, get off the rails. amber: the doors are open, come on.
       white, flashing: the bell before a ride — the honk the owner asked for, drawn rather than heard
       because this game has never made a sound and is not going to start on a tram. */
    g.fillStyle=(RIDE.on&&RIDE.phase==="bell")?((Math.floor(RIDE.t/120)%2)?"#FFF6E0":"#E0A430")
      :TRO.state==="hold"?"#D9342B":"#E0A430";
    g.beginPath();g.arc(sx+(TRO.dir>0?W-5:5),sy+(front?5:8),2,0,7);g.fill();}}
/* every car of it, west to east, at the coupling pitch. `car` draws only one of them, which is what
   the isometric camera needs: a six-tile train takes its place in ONE depth queue per car, or the
   far end of it sorts in front of the people standing beside the near end. */
function troDraw2D(wid,toScreen,front,car){const L=troLine(wid);
  if(!L||L.world!==wid||TRO.state==="away")return;
  const n=troCars(L),lead=TRO.dir>0?n-1:0;
  for(let i=0;i<n;i++){if(car!==undefined&&car!==i)continue;
    const[sx,sy]=toScreen(TRO.x+i*(TRO_LEN+TRO_GAP),L.row);drawTram(ctx,sx,sy,front,i===lead);}}
const HEROFEET={}; /* what the hero's shoes carry off the deck */
/* the moment on the deck (owner, 2026-09-07: "if one hangs on the petals, the character picks one up and looks at it
   saying something like 'we will meet once again, love...'"): stand still on the bridge in season for a breath and you
   bend for a petal, hold it up, and say one of the pack's lines — once per crossing. The bridge is the park's; this is
   what it is for. */
let deckIdle=0,petalMoment=false,petalSaid=false;
function petalMomentTick(dt){const w=CW();
  if(!moving&&w&&petalsOn()&&bridgeDist(w,px,py)===0){deckIdle+=dt;
    if(deckIdle>=2200&&!petalSaid){petalSaid=true;petalMoment=true;const L=(T().petalLines||[]);if(L.length)toast(L[Math.floor(Math.random()*L.length)],4200);}}
  else{deckIdle=0;petalMoment=false;if(!w||bridgeDist(w,px,py)!==0)petalSaid=false;}}
const petalHeap=g=>!!(TILES[g]&&TILES[g].petals); /* a tile a world declares as LOOSE PETALS lying on the ground */
function petalDrop(wid,x,y,feet){ /* owner, 2026-09-07: the trail "for the bridge only" — a step on the deck scatters
  petals; the two steps after it still shed what the shoes carried; nowhere else does a step drop anything.
  AND SO DOES A HEAP OF LOOSE PETALS, WHATEVER THE SEASON (owner, 2026-09-22: "petals … that i can walk and
  interact through as if they were mounds of items piled up"). That is the whole of "interact through": you
  put a foot in a mound of flowers, some of it comes away with you, and it lies where you drop it until it
  fades — which is the owner's own picture of it from 2026-09-07, "a trail forms behind characters". It costs
  no new machinery: PETALS, petalTrail and t3Petals already carry it in all four cameras.
  IT IS A RULE AND NOT A LETTER. Any world may write `petals:true` in TILEMETA and its heaps behave this way;
  the engine never learns which glyph that is, nor the name of a season. The two clauses are deliberately
  separate and only one of them asks petalsOn(): a BRIDGE is strewn only in season, so its half stays gated,
  while a heap that is drawn on the map all year is walked through all year. For any tile no world declared,
  every branch below runs exactly as it did — `heap` is false, and the function is the one that shipped. */
  const w=WORLDS[wid];if(!w)return;const f=feet||HEROFEET;
  /* the heaps keep their OWN counter. The first draft of this shared `pc` with the deck and the
     suite caught it inside a minute: out of season, shoes charged on the bridge went on shedding
     the bridge's petals across a park that no longer had any ("out of season a step still drops
     petals", test/smoke.js). Two sources, two counters, and the deck's three lines below are the
     ones that shipped — for a world that declares no `petals:true` tile, `carry` is false for ever
     and every branch here runs exactly as it did. */
  const heap=petalHeap((w.grid[y]||[])[x]);
  const carry=heap||f.hc>0;                              /* the heap tile itself, and the two steps after it */
  if(heap)f.hc=2;else if(f.hc>0)f.hc--;
  let deck=false;
  if(petalsOn()){
    if(bridgeDist(w,x,y)===0){f.pc=2;deck=true;}
    else if(f.pc>0){f.pc--;deck=true;}
  }
  if(!carry&&!deck)return;
  PETALS.push({w:wid,x,y,t:Date.now(),s:((x*37+y*101+PETALS.length*13)|0)});if(PETALS.length>PETAL_N)PETALS.shift();}
function petalTrail(wid,toScreen){ /* toScreen(x,y) → [sx,sy] of the tile's top-left in this camera */
  if(!PETALS.length)return;const now=Date.now(),P=petalPal();
  PETALS.forEach(pt=>{if(pt.w!==wid)return;const age=(now-pt.t)/PETAL_MS;if(age>=1)return;
    const[sx,sy]=toScreen(pt.x,pt.y);let sd=pt.s;const rnd=()=>{sd=(sd*1103515245+12345)&0x7fffffff;return sd/0x7fffffff;};
    ctx.globalAlpha=1-age*age;
    for(let i=0;i<3;i++)petalShape(ctx,sx+6+rnd()*20,sy+6+rnd()*20,rnd()*Math.PI*2,1.1,P[1+((i+pt.s)%(P.length-1))]);
    ctx.globalAlpha=1;});}
TILEDRAW["^"]=rc=>{const{sx,sy,x,y}=rc; /* the rainbow bridge: walk the whole spectrum.
      The six bands are what a season recolours; planks and rails are design. One season may
      also STREW the deck (art("bridgeStyle")==="petals"): Día de Muertos lays cempasúchil petals
      over dark planks, the way petals are laid as a path for the souls to follow home — the
      owner's word, 2026-09-07: "marigold, and petals too". Deterministic per tile, so the
      3D bake and the four cameras agree on where each petal fell. */
      const bands=art("bridge",BRIDGE_BANDS);
      if(art("bridgeStyle","bands")==="petals"){ /* a bridge MADE of petals (owner, 2026-09-07: "the bridge turns
           into one mostly made out of the petals") — no plank shows. Pili's recipe: the heap's own shadow under
           everything, three passes of fan petals back to front (big and dark, then middle, then small and pale),
           a few dark blots between passes so the heap is deep, every angle on the wheel, drawn past the tile's
           edge and clipped so no seam bands the deck; the rails are the heap's colour with petals over the lip.
           Then the owner: "multiply the amount of leaves times 10" — DECK_PETALS, nine hundred and sixty a tile,
           baked ONCE a tile into petalBake() and blitted every frame after, so the frame stays cheap.
           A rail stands only on an edge with no deck beyond it: the bridge may be two tiles wide. */
        const c=petalBake("deck|"+x+"|"+y+"|"+bridgeEdges(x,y),TS,TS,(g,rnd)=>{const P=petalPal(),[rn,rs]=bridgeEdges(x,y).split("");
          g.save();g.beginPath();g.rect(0,0,TS,TS);g.clip();
          g.fillStyle=P[0];g.fillRect(0,0,TS,TS);
          const pass=(n,s,a,b)=>{for(let i=0;i<n;i++)petalShape(g,-3+rnd()*(TS+6),-3+rnd()*(TS+6),rnd()*Math.PI*2,s,P[a+((i*7+3)%(b-a+1))]);};
          const shade=()=>{g.globalAlpha=0.18;g.fillStyle="#5A1E0B";for(let i=0;i<6;i++){g.beginPath();g.arc(rnd()*TS,rnd()*TS,5,0,7);g.fill();}g.globalAlpha=1;};
          pass(DECK_PETALS[0],1.5,0,2);shade();pass(DECK_PETALS[1],1.25,2,4);shade();pass(DECK_PETALS[2],1.0,0,5); /* the top pass wears the whole range: with thousands of petals only the surface shows, and a surface of one colour is a rug */
          g.restore();
          g.fillStyle=P[0];if(rn==="1")g.fillRect(0,0,TS,2.5);if(rs==="1")g.fillRect(0,TS-2.5,TS,2.5); /* the rails, in the heap's colour */
          for(let i=0;i<8;i++){const north=i%2===1;if(north?rn!=="1":rs!=="1")continue;petalShape(g,rnd()*TS,(north?1.5:TS-1.5)+rnd()*1.5,rnd()*Math.PI*2,0.8,P[3+(i%3)]);}},
          ((x|0)*73+(y|0)*131+7)|0);
        if(c.fresh){c.fresh=false;const[rn,rs]=bridgeEdges(x,y).split("");petalDeepQueue(c,((x|0)*131+(y|0)*73+11)|0,DECK_DEEP,rn==="1",rs==="1");}
        ctx.drawImage(c,sx,sy);return;}
      ctx.fillStyle="#C9B99A";ctx.fillRect(sx,sy,TS,TS); /* plank base */
      bands.forEach((cc,i)=>{ctx.fillStyle=cc;ctx.fillRect(sx,sy+3+i*4.4,TS,4.4);});
      ctx.globalAlpha=0.22;ctx.fillStyle="#FFF";ctx.fillRect(sx,sy+3,TS,2);ctx.globalAlpha=1;
      const[rn,rs]=bridgeEdges(x,y).split("");ctx.fillStyle="#8A6F4D";if(rn==="1")ctx.fillRect(sx,sy,TS,2.5);if(rs==="1")ctx.fillRect(sx,sy+TS-2.5,TS,2.5); /* rails on the open edges */};
TILEDRAW["3"]=rc=>{const{sx,sy}=rc; /* agility hurdle: two posts, a bar to sail over */
      ctx.fillStyle="#C0392B";ctx.fillRect(sx+5,sy+8,3,20);ctx.fillRect(sx+24,sy+8,3,20);
      ctx.fillStyle="#F2E8D8";ctx.fillRect(sx+5,sy+12,22,3);
      ctx.fillStyle="#E0A430";ctx.fillRect(sx+12,sy+12,4,3);ctx.fillRect(sx+20,sy+12,4,3);};
TILEDRAW["4"]=rc=>{const{sx,sy}=rc; /* agility tunnel: a friendly arch */
      ctx.fillStyle="#2E5FA8";ctx.beginPath();ctx.arc(sx+16,sy+26,12,Math.PI,0);ctx.fill();
      ctx.fillStyle="#1F4278";ctx.beginPath();ctx.arc(sx+16,sy+26,7.5,Math.PI,0);ctx.fill();
      ctx.fillStyle="#141220";ctx.beginPath();ctx.arc(sx+16,sy+26,6,Math.PI,0);ctx.fill();};
TILEDRAW["5"]=rc=>{const{sx,sy}=rc; /* weave poles */
      ["#C0392B","#F2E8D8","#2E5FA8","#F2E8D8","#C0392B"].forEach((cc,i)=>{
        ctx.fillStyle=cc;ctx.fillRect(sx+4+i*6,sy+10,2.6,18);
        ctx.fillStyle="#8A6F4D";ctx.fillRect(sx+3+i*6,sy+26,4.6,2);});};
TILEDRAW["9"]=rc=>{const{sx,sy}=rc; /* the doghouse: red roof, dark door, a bone over the arch */
      ctx.fillStyle="#8A6F4D";ctx.fillRect(sx+4,sy+12,TS-8,TS-14);
      ctx.fillStyle="#C0392B";ctx.beginPath();ctx.moveTo(sx+2,sy+13);ctx.lineTo(sx+16,sy+3);ctx.lineTo(sx+30,sy+13);ctx.closePath();ctx.fill();
      ctx.fillStyle="#3E2F1E";ctx.beginPath();ctx.arc(sx+16,sy+23,6,Math.PI,0);ctx.fill();ctx.fillRect(sx+10,sy+23,12,7);
      ctx.fillStyle="#F6F2E8";ctx.fillRect(sx+13,sy+14.5,6,1.6);
      ctx.beginPath();ctx.arc(sx+12.6,sy+15.3,1.2,0,7);ctx.arc(sx+19.4,sy+15.3,1.2,0,7);ctx.fill();};
DOORSET.forEach(dch=>TILEDRAW[dch]=rc=>{const{sx,sy}=rc;
      /* one door body, shared; DOORLOOK (content) colours it for where it leads and may
         give it a window, so a shop entrance and an office door stop being the same brown
         (the cold read found all five pixel-identical). An unlisted glyph is the plain door. */
      const dl=(typeof DOORLOOK!=="undefined"&&DOORLOOK[dch])||{};
      /* ❗A HOUSE PUTS ITS ROOF OVER ITS DOOR, and until now it could not. A door body fills
         its WHOLE tile, so a facade that wears a roofline stopped dead at the doorway: two
         shaped casitas beside Doña Tencha's front door read as two roof stubs with a grey
         gap between them, which is louder than the flat lids they replaced (crew iteration
         14, shown two shaped houses and asked whether they read as ONE building).
         `cap` is the seam and it is a CHOICE, not a rule: a door may declare what the
         BUILDING wears above it, and the shared body is then drawn in the tile it has left.
         A door that declares nothing — every door in both games except the casa's ⌂ — takes
         no transform, no extra call and no new pixel. The transform maps sy→sy+cH and leaves
         sy+TS where it was, so the door still meets the floor.
         NOT in a 3D bake (`rc.bake`): there the roof is real geometry standing over the door
         slab, and a second one painted onto the slab would hang inside the house.

         ❗AND `capH` MAY BE A FUNCTION, BECAUSE A DOOR GLYPH IS NOT A PLACE. The first draft
         of this seam hung the cap on the GLYPH and nothing asked where the glyph STOOD, so
         `⌂` — which is the front door of every casa AND the way out of every room behind one
         — wore the terracotta course on both sides of itself: a strip of roof tiles across
         the top of the door INSIDE Doña Tencha's living room, and the same indoors at El
         Portero's hut and the barbería. The owner saw the outside and said the three houses
         "didnt seem to share a roof"; the inside is what that look was hiding. Photographed,
         not reasoned (docs/POSTMORTEM.md §2).
         So the question the engine asks is not "does this glyph wear something" but "how many
         pixels of THIS TILE belong to the building above it" — a number, or a function of the
         tile when only the pack can know. Zero is the engine's own door, untouched, and that
         is the answer at every door in both games except a casa's own front. */
      let cH=0;
      if(!rc.bake&&dl.cap){const ch=typeof dl.capH==="function"?dl.capH(rc):dl.capH;
        cH=Math.max(0,Math.min(TS-8,(ch===undefined?10:ch)|0));}
      const cap=cH>0&&dl.cap;
      if(cap){ctx.save();ctx.translate(0,sy+cH);ctx.scale(1,(TS-cH)/TS);ctx.translate(0,-sy);}
      ctx.fillStyle=dl.frame||C.doorFrame;ctx.fillRect(sx+2,sy,TS-4,TS);
      ctx.fillStyle=dl.wood||C.doorWood;ctx.fillRect(sx+4,sy+2,11,TS-4);
      ctx.fillStyle=dl.wood2||C.doorWood2;ctx.fillRect(sx+17,sy+2,11,TS-4);
      ctx.fillStyle="rgba(0,0,0,.15)";ctx.fillRect(sx+15,sy+2,2,TS-4);
      if(dl.glass){ctx.fillStyle="#D7E6EE";ctx.fillRect(sx+6,sy+5,7,9);ctx.fillRect(sx+19,sy+5,7,9);
        ctx.fillStyle="rgba(255,255,255,.55)";ctx.fillRect(sx+7,sy+6,2,7);ctx.fillRect(sx+20,sy+6,2,7);}
      ctx.fillStyle="#E0B45C";
      ctx.beginPath();ctx.arc(sx+12.5,sy+17,1.7,0,7);ctx.fill();
      ctx.beginPath();ctx.arc(sx+19.5,sy+17,1.7,0,7);ctx.fill();
      /* light under the door, gently pulsing: this one opens (doors were reading as walls).
         rc.t is a pinned clock for bakes (3D), so a baked door is the same frame every build */
      ctx.globalAlpha=0.25+0.2*Math.sin((rc.t!==undefined?rc.t:Date.now())/380);
      ctx.fillStyle="#FFE9A8";ctx.fillRect(sx+4,sy+TS-3,TS-8,2);
      ctx.globalAlpha=1;
      if(cap){ctx.restore();cap(rc,cH);} /* the building's own course, over the top cH px */
    });
if(typeof TILEART!=="undefined")Object.assign(TILEDRAW,TILEART);
/* ---------- TILESIDE — a tile drawn for the cameras that see it STANDING ----------
   The front-profile camera and the 3D cutouts used to stand the top-down drawing up
   like a cardboard sign: a gingham table became a dartboard, a counter a grey square
   with a cup (owner, 2026-09-02). HD-2D games draw every object from the front, never
   from above. A glyph without a side view falls back to its top-down art; a content
   pack adds or overrides through TILEART_SIDE. The cold-read sheet draws both. */
const TILESIDE={};
TILESIDE["T"]=rc=>{const{sx,sy}=rc; /* a restaurant table from the front: chair backs behind, gingham over the edge, plates, legs */
      ctx.fillStyle="#5E3B20";ctx.fillRect(sx+2,sy+7,5,15);ctx.fillRect(sx+25,sy+7,5,15);
      ctx.fillStyle="#F2E8D8";ctx.fillRect(sx+3,sy+13,26,4);
      ctx.fillStyle="#C0392B";for(let i=0;i<7;i+=2)ctx.fillRect(sx+3+i*4,sy+13,4,4);
      ctx.fillStyle="#E8DCC8";ctx.fillRect(sx+3,sy+17,26,6);
      ctx.fillStyle="#C0392B";for(let i=1;i<7;i+=2)ctx.fillRect(sx+3+i*4,sy+17,4,3);
      ctx.fillStyle="#FFFFFF";[10,22].forEach(px=>{ctx.beginPath();ctx.ellipse(sx+px,sy+12.5,4,1.6,0,0,7);ctx.fill();});
      ctx.fillStyle="#7A4E2C";ctx.fillRect(sx+5,sy+23,3,7);ctx.fillRect(sx+24,sy+23,3,7);};
TILESIDE["D"]=rc=>{const{sx,sy}=rc; /* a desk from the front (#39, the 3D-realism audit: "2d image looking
      objects"): a slab on two legs with a drawer unit on the right, the monitor standing on it, a
      sheet of paper. With a side view the desk is a BOX in 3D, walked around, not a cutout. */
      ctx.fillStyle="#2B2F38";ctx.fillRect(sx+9,sy+4,13,9);ctx.fillRect(sx+15,sy+13,2,2);ctx.fillRect(sx+12,sy+14.5,8,1.2); /* monitor, stand */
      ctx.fillStyle="#7FB3D5";ctx.fillRect(sx+10,sy+5,11,7); /* screen */
      ctx.fillStyle=tc(C.deskTop);ctx.fillRect(sx+2,sy+15.5,TS-4,3); /* the top slab */
      ctx.fillStyle="rgba(255,255,255,.18)";ctx.fillRect(sx+2,sy+15.5,TS-4,1); /* light on the edge */
      ctx.fillStyle=tc(C.desk);ctx.fillRect(sx+3,sy+18.5,3,11.5); /* left leg */
      ctx.fillRect(sx+18,sy+18.5,11,11.5); /* the drawer unit */
      ctx.fillStyle="rgba(15,12,20,.28)";[21,25].forEach(yy=>ctx.fillRect(sx+19,sy+yy,9,0.9)); /* drawer seams */
      ctx.fillStyle="#D9C9A3";[20.5,24.5,28].forEach(yy=>ctx.fillRect(sx+22,sy+yy,3,0.9)); /* handles */
      ctx.fillStyle="#DDE4EA";ctx.fillRect(sx+4,sy+14,6,1.6); /* the paper, on the slab */
      ctx.fillStyle="rgba(15,12,20,.18)";ctx.fillRect(sx+2,sy+29.5,TS-4,1);}; /* shadow at the floor */
TILESIDE["S"]=rc=>{const{sx,sy,x,y}=rc; /* shelving from the front: a bookcase — two uprights, three shelves,
      books and boxes on each, varying by tile so a wall of them is not one picture repeated (#39) */
      ctx.fillStyle="#8A6F4D";ctx.fillRect(sx+2,sy+2,TS-4,28); /* the case */
      ctx.fillStyle="#6E5638";ctx.fillRect(sx+2,sy+2,2.2,28);ctx.fillRect(sx+TS-4.2,sy+2,2.2,28); /* uprights */
      ctx.fillStyle="#5A4530";ctx.fillRect(sx+4,sy+4,TS-8,14);ctx.fillRect(sx+4,sy+19,TS-8,10); /* the dark inside */
      ctx.fillStyle="#6E5638";[10,18,26].forEach(yy=>ctx.fillRect(sx+2,sy+yy,TS-4,2)); /* shelves */
      const sd=((x|0)*7+(y|0)*13)%5,cols=["#D9C9A3","#C0392B","#2E5FA8","#E0B45C","#639C6C","#F2E8D8"];
      [[5,4,6],[12,4,6],[19,4,6],[5,12,6],[13,12,6],[21,12,6],[5,20,6],[12,20,6],[20,20,6]].forEach((b,i)=>{ /* books and boxes */
        const w=b[2]-(i%3===sd%3?2:0);ctx.fillStyle=cols[(i+sd)%cols.length];ctx.fillRect(sx+b[0],sy+b[1],w,b[1]<20?5:5.5);});
      ctx.fillStyle="rgba(255,255,255,.14)";ctx.fillRect(sx+2,sy+2,TS-4,1);
      ctx.fillStyle="rgba(15,12,20,.18)";ctx.fillRect(sx+2,sy+29.5,TS-4,1);};
TILESIDE["K"]=rc=>{const{sx,sy,x,y}=rc; /* a counter from the front. A coffee machine on every third
      tile (a run of fourteen machines is not a counter); the rest carry a cup and a napkin stand. */
      ctx.fillStyle=tc(C.counter);ctx.fillRect(sx+1,sy+16,30,14);
      ctx.fillStyle="#9AA4B0";ctx.fillRect(sx+1,sy+14,30,3);
      ctx.fillStyle="#6E7884";ctx.fillRect(sx+4,sy+21,8,6);ctx.fillRect(sx+20,sy+21,8,6);
      if(((x|0)+(y|0))%3===2){
        ctx.fillStyle="#3A3F46";ctx.fillRect(sx+9,sy+3,14,11);ctx.fillStyle="#23272C";ctx.fillRect(sx+9,sy+3,14,3);
        ctx.fillStyle="#E0662B";ctx.fillRect(sx+11,sy+7,2,2);
        ctx.fillStyle="#F4F1EA";ctx.fillRect(sx+14,sy+10,5,4);ctx.fillRect(sx+19,sy+11,1.5,2);}
      else{ctx.fillStyle="#F4F1EA";ctx.fillRect(sx+7,sy+10,5,4);ctx.fillRect(sx+12,sy+11,1.5,2);   /* a cup */
        ctx.fillStyle="#C9B7A0";ctx.fillRect(sx+19,sy+9,6,5);ctx.fillStyle="#F4F1EA";ctx.fillRect(sx+20,sy+7,4,3);}};
/* ---------- THE STAIR MASS IS A WALL, NOT A SECOND STAIRCASE (#4, owner 2026-09-16) ----------
   The owner, twice: "clearly fucked up stairs", and then — after I explained why they were fine —
   "i still think the stair railing screenshot i sent is wrong, even if it were a seethrough wall
   thats not right." He was right both times and the first answer was me defending the engine.

   WHAT WAS ACTUALLY WRONG, read off the map rather than argued about. Both games have this row:
       13  ##########+⊓⊓⊓⊓#####     the stair MASS
       14  #..........≡≡≡▲#####     the TREADS you actually walk on
   The treads are the staircase. The mass is the wall beside it. And the mass was drawing **a
   second full flight of steps** — its own treads, risers and nosings — one tile north of the real
   one, so the screen showed the same staircase twice, a tile apart. Worse, the two climbed at
   different rates: the mass invented `22/n` while the flight rises by `STAIRH` per tread, so the
   duplicate was not even parallel to the original. That is the whole of "abstract artish".

   And a third thing, which is why it looked wrong from every angle: with no `TILESIDE` entry, this
   one painter was used for the block's TOP face as well as its sides — a flight drawn in profile,
   lying flat on the roof of the mass.

   SO: the top is the top of a wall, and the side is the side of a wall — plaster, a skirting that
   RAKES WITH THE REAL FLIGHT, and the handrail mounted on it. Nothing here draws a tread, because
   the treads are one tile south and they are the actual stairs. The rake is read from the flight
   itself (`stairRun` on the tread row), so the line on the wall can no longer disagree with the
   steps it is beside. */
function stairMassRake(x,y){       /* where the flight beside this tile is, as a fraction 0..1 up */
  const w=CW();if(!w)return null;
  const r=(typeof stairRun==="function")?stairRun(w,x,y+1):null;   /* the treads are the row SOUTH */
  if(!r||!r.L)return null;
  return {a:r.i/r.L, b:(r.i+1)/r.L, up:r.up!==false};
}
TILEDRAW["⊓"]=rc=>{const{sx,sy}=rc;         /* the TOP of the mass: it is a wall, so it caps like one */
  ctx.fillStyle="#6B6470";ctx.fillRect(sx,sy,TS,TS);
  ctx.fillStyle="rgba(255,252,245,.05)";ctx.fillRect(sx,sy,TS,2);          /* the key catches the cap */
  ctx.fillStyle="rgba(15,12,20,.16)";ctx.fillRect(sx,sy+TS-2.5,TS,2.5);};  /* and the south edge falls away */
TILESIDE["⊓"]=rc=>{const{sx,sy,x,y}=rc;
  ctx.fillStyle="#6B6470";ctx.fillRect(sx,sy,TS,TS);                       /* the stairwell wall */
  const rk=stairMassRake(x,y);
  if(!rk){ctx.fillStyle="rgba(15,12,20,.12)";ctx.fillRect(sx,sy+TS-3,TS,3);return;}  /* no flight found: a plain wall, and no invented one */
  /* the flight climbs `rise` pixels over its whole run; this tile carries its own share of it */
  const RISE=21,FOOT=sy+TS-2;
  const yA=FOOT-RISE*(rk.up?rk.a:1-rk.a), yB=FOOT-RISE*(rk.up?rk.b:1-rk.b);
  ctx.fillStyle="#4E4854";ctx.beginPath();                                 /* SKIRTING: the raking board at the foot of the wall, parallel to the nosings */
  ctx.moveTo(sx,sy+TS);ctx.lineTo(sx,yA);ctx.lineTo(sx+TS,yB);ctx.lineTo(sx+TS,sy+TS);ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(255,252,245,.10)";ctx.lineWidth=1;                 /* its top edge takes the key */
  ctx.beginPath();ctx.moveTo(sx,yA);ctx.lineTo(sx+TS,yB);ctx.stroke();
  const RH=11;                                                             /* HANDRAIL: mounted ON the wall, parallel to the flight, on brackets */
  ctx.fillStyle="#3A3140";
  [[8,yA+(yB-yA)*0.25],[24,yA+(yB-yA)*0.75]].forEach(([bx,by])=>ctx.fillRect(sx+bx,by-RH,2,RH*0.55));
  ctx.strokeStyle="#A88650";ctx.lineWidth=2.2;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(sx,yA-RH);ctx.lineTo(sx+TS,yB-RH);ctx.stroke();
  ctx.strokeStyle="rgba(15,12,20,.22)";ctx.lineWidth=1.2;                  /* the rail's own shadow on the plaster, just under it */
  ctx.beginPath();ctx.moveTo(sx,yA-RH+2.6);ctx.lineTo(sx+TS,yB-RH+2.6);ctx.stroke();
  ctx.lineCap="butt";ctx.lineWidth=1;};
/* the run a tread belongs to: its index from the west, the run's length, and whether it CLIMBS
   (a ▲ head at the east end — the hall side) or is the WELL (a ▼ at the west end — the loft
   side, where you look down into it). Every camera and the 3D lift read this one function. */
const STAIRH=0.16; /* one step's rise, in tile units — three treads and a head climb 0.64 */
const BRIDGEH=0.22; /* the rainbow bridge's deck, in tile units: a plank deck over the river, not paint (IDEAS §15.4) */
function stairRun(w,x,y){const row=(w&&w.rows&&w.rows[y])||"";if(row[x]!=="≡"&&row[x]!=="▲")return null;
  let a=x;while(a-1>=0&&row[a-1]==="≡")a--;let b=x;while(b+1<row.length&&(row[b+1]==="≡"||row[b+1]==="▲"))b++;
  const up=row[b]==="▲",well=row[a-1]==="▼";const i=x-a,L=b-a+1;return {i,L,up:up&&!well,well};}
/* how far below the floor a tile of the WELL sits (#62, the way down): the ▼ is the deepest,
   each tread one step up toward the floor, the tile east of the last tread is the floor itself.
   A climbing flight's tiles are 0 here — they rise, they do not sink. */
function wellDepth(w,x,y){const row=(w&&w.rows&&w.rows[y])||"";
  if(row[x]==="▼"){let L=0;while(row[x+1+L]==="≡")L++;return L?STAIRH*(L+1):0;}
  const r=stairRun(w,x,y);if(!r||!r.well)return 0;return STAIRH*(r.L-r.i);}
/* THE SAME DROP, IN THE FLAT CAMERAS' OWN UNITS (owner, 2026-09-17: "lets do b").
   wellDepth is in tile units and only engine3d.js ever read it, so in top, front and iso the well
   was a flat floor with a chevron painted on it and the hero standing on top of the hole. What a
   unit of height is worth in pixels is already settled by the facades: a wall is `lift:13` and
   stands 1.1 units, so a unit is about twelve. One constant, derived rather than picked, and one
   reader — nothing may convert a height to pixels anywhere else. */
const UNITPX=12, ISOUNITPX=18;   /* iso is 1.5x the flat cameras, which is not a choice either: `izh` already converts a lift with `Math.round(lift*1.5)` */
const wellPx=(w,x,y)=>Math.round(wellDepth(w,x,y)*UNITPX);
const isoWellPx=(w,x,y)=>Math.round(wellDepth(w,x,y)*ISOUNITPX);
/* AND THE OTHER TWO KINDS OF HEIGHT (owner, 2026-09-17: "6. do it"). The first pass at this did
   wells only and said so; the owner took the follow-up. `stairLift` is the signed answer for all
   three — positive up a climbing tread or on the bridge's arched deck, negative down a well — and
   it was, like `wellDepth`, read by engine3d.js and by nothing else. So in the flat cameras the
   rainbow bridge was PAINT ON THE WATER: its deck stands 0.22 of a tile up in 3D and lies flat in
   the other three, and whoever crossed it walked at river level.
   Screen y grows downward, so the offset is the negation. One reader; a height may not be turned
   into pixels anywhere else. */
const liftPx=(w,x,y)=>Math.round(-stairLift(w,x,y)*UNITPX);
const isoLiftPx=(w,x,y)=>Math.round(-stairLift(w,x,y)*ISOUNITPX);
/* the height anyone standing on (x,y) stands at: up a climbing tread, DOWN a well tread */
/* the crossing ARCHES (owner, 2026-09-08: "for water, make the bridge a bit better, some arching and or
   dimesionality"): the deck rises from each bank to a crown over the middle of the water. The height at a
   point along the run is a half sine; a tile takes the average of its two edges, and the difference between
   them is the slope it is laid at. Everything else — the rails, the hero, the petals — reads the same two. */
const BRIDGE_ARCH=0.30;
function bridgeRun(w,x,y){const isB=(ax,ay)=>{const g=w.rows[ay]&&w.rows[ay][ax];return !!(g&&(TILES[g]||{}).kind==="bridge");};
  if(!isB(x,y))return null;
  const wat=(ax,ay)=>{const g=w.rows[ay]&&w.rows[ay][ax];return !!(g&&(TILES[g]||{}).kind==="water");};
  const ew=wat(x,y-1)||wat(x,y+1)||!(wat(x-1,y)||wat(x+1,y));
  const at=k=>ew?isB(k,y):isB(x,k);
  let a=ew?x:y,b=a;while(at(a-1))a--;while(at(b+1))b++;
  return {i:(ew?x:y)-a,n:b-a+1,ew};}
const bridgeH=(u)=>BRIDGE_ARCH*Math.sin(Math.PI*Math.max(0,Math.min(1,u)));
function bridgeCamber(w,x,y){const r=bridgeRun(w,x,y);if(!r)return 0;
  return (bridgeH(r.i/r.n)+bridgeH((r.i+1)/r.n))/2;}
function bridgeSlope(w,x,y){const r=bridgeRun(w,x,y);if(!r)return 0;
  return bridgeH((r.i+1)/r.n)-bridgeH(r.i/r.n);}
function stairLift(w,x,y){const r=stairRun(w,x,y);if(r&&r.up)return STAIRH*(r.i+1);
  const g=w.rows[y]&&w.rows[y][x];if(g&&(TILES[g]||{}).kind==="bridge")return BRIDGEH+bridgeCamber(w,x,y); /* on the bridge you stand on its deck, and the deck arches */
  return -wellDepth(w,x,y);}
TILEDRAW["≡"]=rc=>{const{sx,sy,x,y}=rc; /* a tread from above on a flight that runs east: two risers a tile,
  the nosing shadow on the east edge; a climbing flight lightens step by step, a well darkens */
  const r=stairRun(CW(),x,y)||{i:0,L:1,up:true,well:false};const t=r.L>1?r.i/(r.L-1):0;
  /* a well's treads were #8A8476→#7A7468: two dark greys a tenth apart, in a hole, which is how
     the whole opening came back as one black shape (owner, 2026-09-16). The lid of a sunken tread
     is the ONE surface in a well that faces the light coming down from the floor above, so it is
     the brightest thing in there — and it ramps DOWN as it descends, which is what tells you which
     way the flight goes without a single arrow. */
  const base=r.well?["#C2BAA6","#8C8578"]:["#B9B19D","#CEC6B2"];
  const mix=(a,b,t)=>{const h=c=>parseInt(c,16);const A=[1,3,5].map(i=>h(a.slice(i,i+2))),B=[1,3,5].map(i=>h(b.slice(i,i+2)));return "rgb("+A.map((v,k)=>Math.round(v+(B[k]-v)*t)).join(",")+")";};
  ctx.fillStyle=mix(base[0],base[1],t);ctx.fillRect(sx+1,sy+3,14,26);ctx.fillRect(sx+17,sy+3,14,26);
  ctx.fillStyle="rgba(255,255,255,.25)";ctx.fillRect(sx+1,sy+3,1.5,26);ctx.fillRect(sx+17,sy+3,1.5,26);
  ctx.fillStyle=r.well?"rgba(15,12,20,.45)":"rgba(15,12,20,.28)";ctx.fillRect(sx+13,sy+3,2,26);ctx.fillRect(sx+29,sy+3,2,26);};
TILEDRAW["▲"]=rc=>{const{sx,sy}=rc; /* the head of the flight: the dark opening you climb into, and the way it goes */
  ctx.fillStyle="#241F2E";ctx.fillRect(sx+2,sy+2,28,28);
  ctx.fillStyle="#C6BEAA";ctx.beginPath();ctx.moveTo(sx+16,sy+9);ctx.lineTo(sx+24,sy+20);ctx.lineTo(sx+8,sy+20);ctx.closePath();ctx.fill();};
TILEDRAW["▼"]=rc=>{const{sx,sy}=rc; /* the way DOWN: a light landing and a dark chevron — the one glyph that says a flight descends */
  ctx.fillStyle="#C6BEAA";ctx.fillRect(sx+2,sy+2,28,28);ctx.fillStyle="rgba(15,12,20,.22)";ctx.fillRect(sx+2,sy+28,28,2);
  ctx.fillStyle="#241F2E";ctx.beginPath();ctx.moveTo(sx+8,sy+11);ctx.lineTo(sx+24,sy+11);ctx.lineTo(sx+16,sy+22);ctx.closePath();ctx.fill();};
TILEDRAW["◺"]=rc=>{const{sx,sy}=rc; /* the rail from above: a handrail along the well, four balusters */
  ctx.fillStyle="#6E5334";[3,11,19,27].forEach(px=>ctx.fillRect(sx+px,sy+11,3,8));
  ctx.fillStyle="#8A6A3E";ctx.fillRect(sx,sy+13,TS,3);ctx.fillStyle="rgba(255,255,255,.2)";ctx.fillRect(sx,sy+13,TS,1);};
TILESIDE["◺"]=rc=>{const{sx,sy}=rc; /* the rail in elevation: posts and a handrail, knee-high, see-through */
  ctx.fillStyle="#6E5334";[3,11,19,27].forEach(px=>ctx.fillRect(sx+px,sy+10,2.5,22));
  ctx.fillStyle="#8A6A3E";ctx.fillRect(sx,sy+9,TS,3);ctx.fillStyle="rgba(255,255,255,.2)";ctx.fillRect(sx,sy+9,TS,1);};
TILESIDE["1"]=rc=>{const{sx,sy}=rc; /* STAIRS in profile — the stepped diagonal, a silhouette
      nothing else in this city has. It rises to the RIGHT and always will, at every camera stop:
      facing is a screen-space fact (t3ScreenFace), and a flight turned to match the map would
      climb into the camera at two of the four stops. The plan view recedes north, this one climbs
      right, and nobody ever sees both at once. Five steps, about 34° — a real pitch. The VALUE
      STACK is the read: light on the treads (they face the sky), mid on the risers, dark under
      every nosing. */
  ctx.fillStyle="rgba(15,12,20,.18)";                                        /* CONTACT SHADOW — without it the flight hovers */
  ctx.beginPath();ctx.ellipse(sx+16,sy+30.4,14,2.2,0,0,7);ctx.fill();
  for(let i=0;i<5;i++){
    const x0=sx+3+i*5,ty=sy+27-i*3.4,wd=i===4?7:5;                           /* the last step widens into the LANDING */
    ctx.fillStyle="#8A8474";ctx.fillRect(x0,ty,wd,sy+30-ty);                 /* RISER + the closed mass under it */
    ctx.fillStyle="#C6BEAA";ctx.fillRect(x0-1.5,ty,wd+1.5,2.2);              /* TREAD, overhanging 1.5px — that lip is the NOSING */
    ctx.fillStyle="rgba(15,12,20,.42)";ctx.fillRect(x0-1.5,ty+2.2,wd+1.5,1.1); /* the nosing's shadow on the riser below */
  }
  ctx.fillStyle="rgba(15,12,20,.14)";ctx.fillRect(sx+2,sy+26,28,4);          /* the flight darkens where it meets the floor */
  ctx.fillStyle="#5E4326";ctx.fillRect(sx+1.5,sy+17,2.5,13);                 /* NEWEL post — the bottom of a flight has a stop */
  ctx.strokeStyle="#6E5334";ctx.lineWidth=1.8;                               /* three balusters, on the nosings they stand on */
  [[4,19.3,27],[15,11.8,20.2],[26,4.4,13.4]].forEach(p=>{
    ctx.beginPath();ctx.moveTo(sx+p[0],sy+p[1]);ctx.lineTo(sx+p[0],sy+p[2]);ctx.stroke();});
  ctx.strokeStyle="#8A6A3A";ctx.lineWidth=2.4;ctx.lineCap="round";           /* HANDRAIL — parallel to the nosings */
  ctx.beginPath();ctx.moveTo(sx+2,sy+20.7);ctx.lineTo(sx+29,sy+2.3);ctx.stroke();
  ctx.lineCap="butt";ctx.lineWidth=1;
};
TILESIDE["C"]=rc=>{const{sx,sy}=rc; /* a cone from the side is the same cone — what the flat
      version was missing is a BASE and a shadow, which is all that ever said "standing on the road"
      instead of "painted on it". */
  ctx.fillStyle="rgba(15,12,20,.20)";
  ctx.beginPath();ctx.ellipse(sx+16,sy+29.4,10,2.4,0,0,7);ctx.fill();     /* CONTACT SHADOW */
  ctx.fillStyle="#C2541F";ctx.fillRect(sx+5,sy+26,22,3.4);                /* the square base, darker than the cone */
  ctx.fillStyle="#E0662B";ctx.beginPath();
  ctx.moveTo(sx+16,sy+5);ctx.lineTo(sx+23.5,sy+26);ctx.lineTo(sx+8.5,sy+26);ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(255,255,255,.16)";ctx.beginPath();                  /* the lit face — key light upper-left */
  ctx.moveTo(sx+16,sy+5);ctx.lineTo(sx+16,sy+26);ctx.lineTo(sx+8.5,sy+26);ctx.closePath();ctx.fill();
  ctx.fillStyle="#F4F1EA";ctx.fillRect(sx+10.5,sy+16,11,3.4);             /* the retroreflective band */
  ctx.fillStyle="rgba(15,12,20,.18)";ctx.fillRect(sx+10.5,sy+19.4,11,1);
};
TILESIDE["V"]=rc=>{const{sx,sy}=rc; /* a stove from the front: burners over the edge, knobs, the oven window */
      ctx.fillStyle="#3A3F46";ctx.fillRect(sx+3,sy+8,26,22);
      ctx.fillStyle="#23272C";ctx.fillRect(sx+3,sy+6,26,3);[[9,6],[16,6],[23,6]].forEach(p=>{ctx.beginPath();ctx.ellipse(sx+p[0],sy+p[1],3.2,1.4,0,0,7);ctx.fill();});
      ctx.fillStyle="#E0662B";ctx.fillRect(sx+14,sy+6,4,1.2);
      ctx.fillStyle="#AEB6BE";[8,13,19,24].forEach(px=>{ctx.beginPath();ctx.arc(sx+px,sy+12,1.6,0,7);ctx.fill();});
      ctx.fillStyle="#1B1E22";ctx.fillRect(sx+7,sy+16,18,10);ctx.fillStyle="#AEB6BE";ctx.fillRect(sx+7,sy+15,18,1.2);};
if(typeof TILEART_SIDE!=="undefined")Object.assign(TILESIDE,TILEART_SIDE);
/* ---------- ONE ENTRY PER GLYPH, WITH SLOTS — the view registry ----------
   A pack describes what a glyph looks like. It used to do that in two tables with two holes:
   TILEART said the top, TILEART_SIDE said the profile, the leafy top of a tree was hardcoded in
   engine3d.js with a hardcoded green, and there was nowhere at all to describe the isometric view.
   Four views of one object, in four unrelated shapes, two of which a content pack could not reach.
   The owner, 2026-09-10: "why cant we have like a pack can draw its own tree and layer for art?
   maybe im mixing but just trying ot reuse what we can." He was not mixing them up — they are one
   thing, and the fix is one list with slots rather than four more globals:

       TILEART["J"] = { top:fn, side:fn, crown:fn, iso:fn }   // fill in what you care about

   A bare function still means `top`, exactly as before, so nothing any pack has written changes.
   docs/TAGS.md L15, docs/ARCH-LOG.md A5+A7. */
const TILECROWN={},TILEISO={},TILEMESH={}; /* mesh: a list of primitives for the 3D camera (2026-09-21) */
const TILEVIEWS=["top","side","crown","iso","mesh"];
if(typeof TILEART!=="undefined")Object.entries(TILEART).forEach(([g,v])=>{
  if(typeof v==="function"||!v||typeof v!=="object")return;   /* a bare function is `top`, merged above */
  if(v.top)TILEDRAW[g]=v.top;
  if(v.side)TILESIDE[g]=v.side;
  if(v.crown)TILECROWN[g]=v.crown;
  if(v.iso)TILEISO[g]=v.iso;
  if(v.mesh)TILEMESH[g]=v.mesh;});
if(typeof TILEART_MESH!=="undefined")Object.assign(TILEMESH,TILEART_MESH); /* the flat form, like TILEART_SIDE */
/* the one question every renderer asks: what does this glyph look like from HERE. A view a pack
   never filled in comes back null, and the caller decides what to do about that — which is how a
   game that has no isometric camera pays nothing for isometric art. */
function tileView(g,view){
  const T={top:TILEDRAW,side:TILESIDE,crown:TILECROWN,iso:TILEISO,mesh:TILEMESH}[view];
  return (T&&T[g])||null;}
const sideArt=g=>TILESIDE[g]||TILEDRAW[g];
/* ---------- TILES: glyph-class metadata (IDEAS §10 step ①) ----------
   What a tile IS — one row per glyph — so any camera derives drawing from meaning
   instead of meaning living in one renderer's pixels. `lift` is how tall the tile
   stands in front-profile view (facade px above its grid row); `kind` is meaning
   for future renderers. Content packs override or add rows via TILEMETA. */
const TILES={};
SOLID.forEach(g=>TILES[g]={lift:7,kind:"prop"});
Object.assign(TILES,{
  "#":{lift:13,kind:"wall"},U:{lift:13,kind:"wall"},
  B:{lift:13,kind:"facade",win:[[5,10,8,9],[19,10,8,9]]},
  Q:{lift:13,kind:"facade",win:[[7,11,18,14]],awn:9},   /* was [8,14,16,10] — the rect the art actually paints is (7,11,18,14), and TWO sill props stand in this front (st 2,5 and 9,5). The declared window and the drawn window have to be the same rectangle or the candy, the ledge and the dusk light all land somewhere the glass is not. */
  Z:{lift:13,kind:"facade",win:[[4,12,24,13]],awn:9},   /* likewise: the produce window is drawn at (4,12,24,13) */
  D:{lift:6,kind:"furniture"},K:{lift:6,kind:"furniture"},T:{lift:6,kind:"furniture"},
  A:{lift:6,kind:"furniture"},S:{lift:9,kind:"furniture"},H:{lift:5,kind:"furniture"},
  I:{lift:6,kind:"furniture"},W:{lift:8,kind:"appliance"},V:{lift:8,kind:"appliance"},
  F:{lift:5,kind:"fence"},G:{lift:5,kind:"fence"},
  C:{lift:6,kind:"marker",stand:true,light:true},X:{lift:6,kind:"site"},   /* light: you kick it, you do not walk around it */
  P:{lift:6,kind:"nature"},J:{lift:0,kind:"tree"},
  "~":{lift:0,kind:"water"},"9":{lift:7,kind:"prop"},
  "^":{lift:0,kind:"bridge"}, /* walkable, flat art in 2D; in 3D a raised plank deck with rails (asked for on 2026-09-07: an upgraded rainbow bridge) */
  /* `stand`: walkable, but an OBJECT — not paint on the floor. The engine had exactly two
     categories, flat ground art or solid geometry, and a staircase is neither: you walk onto
     it and it has to stand up. Without this the front camera and the 3D ground bake paint a
     stair's top-down art flat onto the floor, which is why it read as a gate lying down
     (owner, 2026-09-04: "those stairs are trash"). Replaces a hardcoded "345" glyph list
     that lived in engine3d.js — engine code naming a pack's glyphs is the portability law
     wearing a different hat. */
  "1":{lift:9,kind:"stair",stand:true},
  /* the flight that runs EAST (#4, 2026-09-06): ⊓ the stair mass — a wall-height body that wears
     the flight in profile, one drawing per tile of its run (`vary`); ≡ a tread you walk on; ▲ the
     head, a portal up; ▼ the way down, a portal; ◺ the rail round the well upstairs, knee-high */
  "⊓":{lift:13,kind:"wall",vary:true},"≡":{lift:0,kind:"stair"},"▲":{lift:0,kind:"stair"},"▼":{lift:0,kind:"stair"},
  "◺":{lift:5,kind:"fence"},
  "3":{lift:8,kind:"gear",stand:true},"4":{lift:8,kind:"gear",stand:true},"5":{lift:8,kind:"gear",stand:true}});
if(typeof TILEMETA!=="undefined")Object.entries(TILEMETA).forEach(([g,m])=>TILES[g]={...(TILES[g]||{}),...m});
/* walkable, but drawn standing. `standsUp` also asks whether there IS a side drawing: a tile
   flagged `stand` with no profile has nothing to stand up, and the front camera leaves it
   exactly as it was rather than standing its floor plan on edge. */
const stands=g=>{const m=TILES[g];return !!(m&&m.stand);};
const standsUp=g=>stands(g)&&!!TILESIDE[g];
/* ---------- IS THIS LETTER ALREADY WEARING A DRAWING? ----------
   A tile of these kinds WITH a side drawing is not built as a plain block: `t3BoxMats`
   (`engine/engine3d.js`, grep "t3BoxMats") bakes the glyph's TOP-DOWN art onto the box's lid and
   wraps its SIDE art round the four faces. A game's counter can wear a machine drawn on its front
   and a cup on its top, a table a cloth with plates on it. Those are drawings, standing up, with
   volume already.

   And the `mesh` view has NO texture channel at all — `t3MeshOf` (`engine/engine3d.js`) bakes every
   part into ONE vertex-coloured geometry, and a part carries a primitive, a place, a size, a colour
   and an alpha. There is nothing in it that can name a drawing. So handing such a letter a default
   mesh does not improve the object: it DELETES the art and puts untextured geometry where it was.
   That is not an upgrade of the same thing, it is a different thing, and only the person who drew
   the art may make that trade — which they do by writing their own `TILEMESH` entry (clause 1).

   `t3Boxy` in engine3d.js calls THIS function, so the renderer and the gate cannot drift apart.
   That drift is the whole bug: a gate that counted triangles called deleting a coffee cup a win. */
const wearsArt=g=>{const m=TILES[g]||{lift:7,kind:"prop"};
  return !!((m.box||m.kind==="furniture"||m.kind==="appliance")&&typeof TILESIDE!=="undefined"&&TILESIDE[g]);};
/* ---------- THE GATE: the engine's own shapes, for a letter the pack said nothing about ----------
   `engine/shapes.js` holds SHAPES (shapes named by what they ARE) and SHAPEBIND (this engine's
   letters). Meridian built thirteen of these as `TILEART_MESH` and every other world on this
   engine kept standing its desks up as boxes with a photograph of a desk on the side. This is the
   one place that changes, and it is a GATE rather than a default because a default would be wrong
   five different ways. Each refusal below was bought with a measurement:

   THE RULE, in one sentence: **an engine default may only fill a hole — it may never replace a
   drawing, and it is never assumed, it is TAKEN.**

   That rule was written on 2026-09-22 after this gate was refuted, and both halves of it were
   bought by a letter that got past the first version:

   · **It is taken, not given** (clause 0). The first version bound a letter whenever the pack had
     said nothing about it, reading silence as consent. But a world that never mentioned a letter
     has not agreed with the engine about it — it has said nothing. Another game on this engine
     lays `H` as a different object altogether, and the engine's `H` is an open PRODUCE CRATE
     (`TILEDRAW["H"]` above). Nothing in any table in
     this engine records what a world MEANS by a letter it has never drawn, so no clause can ever
     catch that — which makes it the third time one letter has meant two objects here, after `I`
     and `b`. The only thing that can catch it is the world saying which letters it agrees with.
   · **It fills a hole, never a drawing** (clause 5). See `wearsArt` above. Seventy-one tiles of
     another game stand today as boxes wearing their own art, and the first version of this gate
     replaced all seventy-one with untextured geometry and counted it as seventy-one tiles fixed.

   1 · `TILEMESH[g]` — the pack already answered with a shape. Its answer wins, always. This is the
       line that makes Meridian byte-identical: it has its own mesh for every letter here. It is
       also the escape hatch: a pack that WANTS a mesh on a letter clause 5 refuses writes it here,
       as `const TILEART_MESH={K:o=>SHAPES.counter(o)};` — DECLARED by the pack and LATE-BOUND, and
       both halves are load-bearing. `engine/boot.js` is the
       last script tag in both shells and it is what loads `engine/shapes.js`, so a pack file runs
       before `SHAPES` and `TILEMESH` exist: the eager forms `TILEMESH["K"]=SHAPES.counter` and
       `TILEART["K"]={mesh:SHAPES.counter}` throw "TILEMESH is not defined" and "SHAPES is not
       defined" respectively. Both were documented in five places on 2026-09-22 and neither ran —
       a false mechanism in the record, in the round convened to cure a false mechanism in the
       record. And a pack that has never written a mesh has no `TILEART_MESH` to add to, so
       `TILEART_MESH["K"]=…` throws as well: it has to be declared. All three wrong forms and the
       right one were planted against El Changarrito on 2026-09-22 and only the right one printed OK.
   2 · `TILEART[g]` / `TILEART_SIDE[g]` — the pack DREW this letter itself. Standing a shape where
       somebody drew a picture throws their drawing away without telling them.
   3 · `TILEMETA[g]` — the pack said what this letter MEANS, so it means something else here. El
       Changarrito re-declares `I` as a storefront face at wall height (`changarrito/content/art.js`);
       the engine's `I` is a waist-high grocery counter. **`I` IS NOT IN `SHAPEBIND`, and that — not
       this clause — is what keeps a counter out of twelve of the town's storefronts.** The earlier
       version of this comment claimed the credit for clause 3 and it was false; a false sentence in
       the record is a bug here, and this is the repair. The clause stays because it is right for
       the general case, and it is honest about its own status: **no letter in either of this
       repository's two games is currently refused by clause 2 or clause 3, so both are untested in
       this tree.** They are reasoning, not measurement, and they are labelled as such.
   4 · solidity — `t3MeshTile` is only ever reached for a SOLID tile or a `stand` tile, so a glyph
       that is neither can never show a shape. It can still be harmed by one: the ground bake's
       contact pad (`engine/engine3d.js`, grep "THE PAD") asks only whether a glyph HAS a mesh, so
       binding one to a walkable letter paints a soft shadow on the pavement with nothing standing
       on it — baked into a texture, where a scene-graph dump reports "identical". Meridian's `b`,
       the marigold bed, is ten tiles of the town and exactly this case.
   5 · `wearsArt(g)` — it is already a drawing with volume. Above.

   `SHAPEGIVEN` is the list of letters this gate actually handed a shape to. It exists because the
   only way to ask that question afterwards was `Object.keys(SHAPEBIND).filter(g=>TILEMESH[g])`,
   which runs AFTER this block has mutated `TILEMESH` and so cannot tell a pack's own mesh from an
   engine-supplied one — it answered "does this letter have any mesh at all", and the suite printed
   that as the score. A number nobody can check is not a measurement.

   The `typeof SHAPES==="object"` test, rather than a bare name, is deliberate: a world with no 3D
   camera never downloads the file, and an offline visit where `sw.js` forgot to cache it must fall
   back to the boxes rather than throw. (docs/REGRESSION.md — nothing checks that everything
   SHIPPED is listed in `sw.js`, only the other direction.) */
const SHAPEGIVEN=[];
if(typeof SHAPES==="object"&&SHAPES&&typeof SHAPEBIND==="object"&&SHAPEBIND)
  Object.keys(SHAPEBIND).forEach(g=>{
    /* 0 · THE WORLD HAS TO ASK. `SHAPETAKE` is a plain string of the letters this pack agrees the
       engine may shape for it. No `SHAPETAKE` means no letters: silence is not consent. */
    if(typeof SHAPETAKE!=="string"||SHAPETAKE.indexOf(g)<0)return;
    if(TILEMESH[g])return;                                      /* the pack answered */
    if(typeof TILEART!=="undefined"&&TILEART[g])return;          /* …or drew this letter itself */
    if(typeof TILEART_SIDE!=="undefined"&&TILEART_SIDE[g])return;
    if(typeof TILEMETA!=="undefined"&&TILEMETA[g])return;        /* …or said what it means */
    /* IT COULD ONLY CAST A SHADOW. And the predicate is `stands`, not `standsUp` — measured, and
       the brief this was built from said `standsUp`. `standsUp` additionally demands a SIDE
       drawing, because it answers a question for the flat front camera (engine.js:924, :2281,
       :2312). The 3D camera's walkable-object branch (`engine/engine3d.js:447`) asks plain
       `stands`, so a letter declared `stand:true` with no side art — Meridian's grass `g` is
       exactly that (`content/meridian/art.js:1829`) — renders its mesh perfectly well and
       `standsUp` would have refused it one. A guard written with the same wrong noun reported six
       of Meridian's grass tiles as faults before the code was read. */
    if(!SOLID.has(g)&&!stands(g))return;
    /* IT IS ALREADY A DRAWING WITH VOLUME. The mesh has no texture channel, so this swap trades
       art for geometry and every meter in this repository reports it as a gain. */
    if(wearsArt(g))return;
    const fn=SHAPES[SHAPEBIND[g]];if(fn){TILEMESH[g]=fn;SHAPEGIVEN.push(g);}});
/* A person who works INSIDE a wall: a clerk at a window, a teller behind a counter. The pack
   marks the station with `win:"B"` — the glyph of the wall she stands in — and every camera
   draws that wall's counter in front of her and its roof over her, so the building keeps its
   line instead of opening a hole where the map letter became a person. Meridian marks no
   station this way, so this answers null for every one of its tiles. */
const winAt=(w,x,y)=>{if(!w||!w.grid[y]||w.grid[y][x]!=="N")return null;
  const n=w.npcs.find(m=>m.x===x&&m.y===y&&m.win),m=n&&TILES[n.win];
  return m&&(m.kind==="wall"||m.kind==="facade")?n.win:null;};
const roofCol=g=>({"#":C.wallTop,U:C.wallTop,B:"#6E5A60",Q:"#7A3527",Z:"#385C36",D:C.deskTop,K:C.counter,
  W:"#8E969E",V:"#23272C"})[g]||shadeHex(BASECOL[g]||(typeof MAPCOL!=="undefined"&&MAPCOL[g])||C.wall,-0.18);
/* ---------- DECOR: instance metadata (IDEAS §10 step ①b) ----------
   One-off place identity as content data: DECOR=[{world,x,y,deco,...}]. What used
   to live only in hand-drawn pixels becomes something every camera can honor.
   The engine ships a small vocabulary; packs add or override art via DECOART. */
const DECODRAW={
  sign:(sx,sy,d)=>{ctx.fillStyle="#3B3F45";ctx.fillRect(sx+14,sy+8,3,20);
    ctx.fillStyle=d.c||"#C0392B";ctx.fillRect(sx+6,sy+4,20,10);
    ctx.strokeStyle="rgba(15,12,20,.4)";ctx.lineWidth=1;ctx.strokeRect(sx+6,sy+4,20,10);
    ctx.fillStyle="#F2E8D8";ctx.font="700 7px monospace";ctx.textAlign="center";
    ctx.fillText(String(d.text||"").slice(0,4),sx+16,sy+11);ctx.textAlign="start";},
  mural:(sx,sy)=>{["#C0392B","#E0A430","#2E5FA8","#7A9A4E"].forEach((cc,i)=>{
    ctx.fillStyle=cc;ctx.fillRect(sx+3+i*7,sy+10,6,14);});},
};
if(typeof DECOART!=="undefined")Object.assign(DECODRAW,DECOART);
const DECOS=(typeof DECOR!=="undefined"?DECOR:[]);
function drawDecor(camX,camY){DECOS.forEach(d=>{if(d.world!==world)return;
  const f=DECODRAW[d.deco];if(!f)return;
  const sx=d.x*TS-camX,sy=d.y*TS-camY;
  if(sx<-TS||sy<-TS||sx>VW||sy>VH)return;f(sx,sy,d);});}
/* temporary ground marks — dug holes and the other thing; they fade on their own */
const DECALS=[];
function drawDecals(camX,camY){const nw=Date.now();
  for(let i=DECALS.length-1;i>=0;i--)if(DECALS[i].until<nw)DECALS.splice(i,1);
  DECALS.forEach(dc=>{if(dc.world!==world)return;
    const sx=dc.x*TS-camX,sy=dc.y*TS-camY;
    if(sx<-TS||sy<-TS||sx>VW||sy>VH)return;
    ctx.globalAlpha=Math.min(1,(dc.until-nw)/1500);
    if(dc.kind==="hole"){ctx.fillStyle="#5A4630";ctx.beginPath();ctx.ellipse(sx+16,sy+18,8,5,0,0,7);ctx.fill();
      ctx.fillStyle="#3E2F1E";ctx.beginPath();ctx.ellipse(sx+16,sy+18,5,3,0,0,7);ctx.fill();
      ctx.fillStyle="#6E5638";[[6,10],[25,12],[10,25],[23,24]].forEach(p=>ctx.fillRect(sx+p[0],sy+p[1],2.5,2));}
    else if(dc.kind==="poop"){ctx.font="11px serif";ctx.textAlign="center";ctx.fillText("💩",sx+16,sy+22);ctx.textAlign="start";}
    ctx.globalAlpha=1;});}
/* ---------- front-profile 2.5D (IDEAS §10 step ②) ----------
   The owner's steer, verbatim: "show us a profile from the front." Square grid,
   straight-on camera. Solids keep every painted pixel of their facades and grow a
   roof strip upward; rows render back-to-front so the town gets true depth without
   losing a door, an awning, or a fence. */
function drawFront(){
  const w=CW();
  const camX=Math.max(0,Math.min(w.W*TS-VW,fx*TS+TS/2-VW/2));
  const camY=Math.max(0,Math.min(Math.max(0,w.H*TS-VH),fy*TS+TS/2-VH/2));
  camXg=camX;camYg=camY;
  ctx.fillStyle=tc("#241F2E");ctx.fillRect(0,0,VW,VH);
  const x0=Math.floor(camX/TS),y0=Math.floor(camY/TS),trees=[];
  const queueCanopy=(cx2,cy2)=>trees.push([cx2,cy2]);
  const yEnd=Math.min(w.H-1,y0+9),xEnd=Math.min(w.W-1,x0+11);
  /* ground pass: floors, walkable art, and the shadow every facade casts */
  for(let y=y0;y<=yEnd;y++)for(let x=x0;x<=xEnd;x++){
    const ch=w.rows[y][x],sx=x*TS-camX,sy=y*TS-camY;
    {const fp=FLOORC[world];ctx.fillStyle=tc(fp?((x+y)%2?fp[0]:fp[1]):((x+y)%2?C.floor:C.floorAlt));}
    ctx.fillRect(sx,sy,TS,TS);
    const hsh=(x*374761393+y*668265263+world.charCodeAt(0)*69069)>>>0;
    if((hsh&7)<2){ctx.globalAlpha=0.05;ctx.fillStyle="#000";ctx.fillRect(sx,sy,TS,TS);ctx.globalAlpha=1;}
    if(hsh%11===3){ctx.globalAlpha=0.08;ctx.fillStyle="#FFF";ctx.fillRect(sx+(hsh>>3)%26+2,sy+(hsh>>5)%26+2,2,2);ctx.globalAlpha=1;}
    if(!SOLID.has(w.grid[y][x])&&!standsUp(ch)){const tf=TILEDRAW[ch],dp=liftPx(w,x,y);
      /* A WELL IN PROFILE. This camera looks along the row, and Nolasco's flight runs ACROSS one —
         so every tread is at the same screen row and differs only in height, which is exactly a
         staircase seen from the side. Sink each tread by its own drop and paint the shaft above it
         and the whole flight steps down the screen. Before this the front camera drew the hole as
         floor: five pale tiles, a chevron, and the hero standing on top of it at full height. */
      if(dp>0){ctx.fillStyle=tc("#241E2A");ctx.fillRect(sx,sy-2,TS,dp+4);                     /* the shaft you look into */
        ctx.fillStyle="rgba(15,12,20,.35)";ctx.fillRect(sx,sy-2,TS,2);                        /* its lip, where the floor ends */
        ctx.save();ctx.translate(0,dp);if(tf)tf({sx,sy,x,y,canopy:queueCanopy});ctx.restore();
        ctx.fillStyle="rgba(255,255,255,.14)";ctx.fillRect(sx,sy+dp,TS,1);}                   /* the nosing catching the light from above */
      else if(dp<0){const h=-dp;                                                              /* a tread that CLIMBS, or the bridge's arched deck: it stands proud and you see what is under it */
        ctx.save();ctx.translate(0,dp);if(tf)tf({sx,sy,x,y,canopy:queueCanopy});ctx.restore();
        ctx.fillStyle=tc("#3A3142");ctx.fillRect(sx,sy+TS-h,TS,h);                            /* the riser, or the deck's own shadowed under-edge */
        ctx.fillStyle="rgba(255,255,255,.16)";ctx.fillRect(sx,sy+TS-h,TS,1);
        ctx.fillStyle="rgba(15,12,20,.30)";ctx.fillRect(sx,sy+TS-1,TS,1);}
      else if(tf)tf({sx,sy,x,y,canopy:queueCanopy});}
    if(!SOLID.has(w.grid[y][x])||(TILES[w.grid[y][x]]||{}).kind==="water")petalSpill(w,x,y,sx,sy);
    if(y>0&&SOLID.has(w.grid[y-1][x])&&!SOLID.has(w.grid[y][x])){
      ctx.fillStyle="rgba(15,12,20,.16)";ctx.fillRect(sx,sy,TS,8);}
  }
  /* depth pass: facades, decor and actors interleaved by row, back to front. Declared before the
     fiesta is drawn because a prop on a solid tile is queued into it (fiestaDraw2D's `defer`) */
  const R=[];
  petalTrail(world,(x,y)=>[x*TS-camX,y*TS-camY]);troDraw2D(world,(x,y)=>[x*TS-camX,y*TS-camY],true);
  fiestaDraw2D(world,(x,y)=>[x*TS-camX,y*TS-camY],true,fn=>R.push({d:fn.y+0.05,f:fn})); /* after its row's facade, before actors — the same slot decor uses */
  drawDecals(camX,camY);
  DECOS.forEach(d=>{if(d.world!==world)return;const f=DECODRAW[d.deco];if(!f)return;
    const sx=d.x*TS-camX,sy=d.y*TS-camY;
    if(sx<-TS||sy<-TS||sx>VW||sy>VH)return;
    R.push({d:d.y+0.05,f:()=>f(sx,sy,d)});}); /* after its row's facade, before actors */
  for(let y=Math.max(0,y0-1);y<=yEnd;y++)for(let x=x0;x<=xEnd;x++){
    const gch0=w.grid[y][x],wg=winAt(w,x,y);if(!SOLID.has(gch0)&&!standsUp(gch0)&&!wg)continue;
    const gch=wg||gch0,ch=wg||w.rows[y][x],sx=x*TS-camX,sy=y*TS-camY;
    if(wg)R.push({d:y+0.7,f:()=>{ /* the counter: after the person at y+0.55, so her legs are behind it */
      ctx.fillStyle=tc(shadeHex(roofCol(wg),-0.25));ctx.fillRect(sx,sy+TS-9,TS,9);
      ctx.fillStyle="rgba(255,255,255,.18)";ctx.fillRect(sx,sy+TS-9,TS,1.5);
      ctx.fillStyle="rgba(15,12,20,.25)";ctx.fillRect(sx,sy+TS-1.5,TS,1.5);}});
    R.push({d:y,f:()=>{
      const m=TILES[gch]||TILES[ch]||{lift:7,kind:"prop"},L=m.lift|0,kd=m.kind;
      if(kd==="wall"||kd==="facade"||kd==="fence"){
        /* structure: a roof strip only where the run starts, so interior rows of a
           building connect cleanly instead of banding ([partner]: "walls are clunky") */
        if(L>0&&(y===0||!SOLID.has(w.grid[y-1][x]))){
          ctx.fillStyle=tc(roofCol(gch));ctx.fillRect(sx,sy-L,TS,L);
          ctx.fillStyle="rgba(255,255,255,.14)";ctx.fillRect(sx,sy-L,TS,1.5);
          ctx.fillStyle="rgba(15,12,20,.22)";ctx.fillRect(sx,sy-1.2,TS,1.2);}
      }else if(kd!=="water"){ /* an object stands ON the floor: contact shadow, never
                a slab ([partner]: tables and potted plants seemed to float). Water is flat. */
        ctx.fillStyle="rgba(15,12,20,.16)";
        ctx.beginPath();ctx.ellipse(sx+16,sy+27.5,11,3.2,0,0,7);ctx.fill();
      }
      const face=kd==="wall"||kd==="facade";
      const tf=face?(TILEDRAW[ch]||TILEDRAW[gch]):(sideArt(ch)||sideArt(gch)); /* a wall wears its face; a prop is seen standing */
      if(tf)tf({sx,sy,x,y,canopy:queueCanopy});
      if(m.awn)ctx.fillStyle="rgba(15,12,20,.18)",ctx.fillRect(sx,sy+m.awn,TS,3); /* the awning shades its facade */
      if(kd==="fence"){ /* posts where a run ends — a fence has ends, not edges */
        const post=pxx=>{ctx.fillStyle=tc("#6E5334");ctx.fillRect(pxx,sy-2,4.5,TS+2);
          ctx.fillStyle="rgba(255,255,255,.15)";ctx.fillRect(pxx,sy-2,4.5,1.5);};
        if(x===0||w.grid[y][x-1]!==gch)post(sx+0.5);
        if(x===w.W-1||w.grid[y][x+1]!==gch)post(sx+TS-5);
      }
    }});
  }
  const act=(gx,gy,fn)=>{const sx=gx*TS-camX,sy=gy*TS-camY+liftPx(w,Math.round(gx),Math.round(gy));
    /* +liftPx: you stand ON the tread, not over it — down a well, up a flight, or on the bridge's
       deck. Everyone goes through `act`, so the hero, the townsfolk and the animals all take the
       same height by the same number of pixels and cannot drift apart. */
    if(sx<-TS||sy<-TS-16||sx>VW||sy>VH)return;R.push({d:gy+0.55,f:()=>fn(sx,sy)});};
  w.npcs.forEach(n=>act(n.fx===undefined?n.x:n.fx,n.fy===undefined?n.y:n.fy,(sx,sy)=>{
    drawPerson(ctx,sx,sy,npcWhimsy(n),{dir:"down",idle:Math.sin(Date.now()/500+n.x)*0.8,who:n.npc||n.key});
    if(hasSay(n))drawSayMark(ctx,sx,sy);
    drawEmote(n,sx,sy);}));
  PEERS.forEach(p=>{if(p.w!==world)return;
    act(p.x,p.y,(sx,sy)=>{drawPerson(ctx,sx,sy,p.look||look,{dir:p.dir||"down",who:p.id||p.name||"peer"});
      ctx.font="600 8px monospace";ctx.textAlign="center";
      ctx.fillStyle="rgba(15,12,20,.75)";ctx.fillText(String(p.name||"").slice(0,12),sx+16.7,sy-1.3);
      ctx.fillStyle="#EDE9F5";ctx.fillText(String(p.name||"").slice(0,12),sx+16,sy-2);
      ctx.textAlign="start";});});
  if(world===AW("dog"))act(DOG.fx,DOG.fy,(sx,sy)=>drawDog(ctx,sx,sy));
  if(world===AW("cat"))act(CAT.fx,CAT.fy,(sx,sy)=>drawCat(ctx,sx,sy));
  if(world===AW("pig"))act(PIG.fx,PIG.fy,(sx,sy)=>drawPigeon(ctx,sx,sy));
  if(world===AW("loro"))act(LORO.x,LORO.y,(sx,sy)=>drawLoro(ctx,sx,sy));
  CRIT.forEach(cr=>{if(cr.world!==world)return;
    act(cr.fx,cr.fy,(sx,sy)=>{
      if(cr.kind==="butterfly")drawButterfly(ctx,cr,sx,sy);
      else if(cr.kind==="colibri")drawColibri(ctx,cr,sx,sy);
      else if(cr.kind==="gato")drawGato(ctx,cr,sx,sy);
      else if(cr.kind==="beagle")drawBeagle(ctx,cr,sx,sy);
    else if(cr.kind==="lab")drawLab(ctx,cr,sx,sy);
    else if(cr.kind==="chi")drawChi(ctx,cr,sx,sy);});});
  if(BALL&&BALL.world===world)act(BALL.fx,BALL.fy,(sx,sy)=>drawBall(ctx,sx,sy,BALL.phase,BALL.t));
  DOGTHINGS.forEach(o=>{if(o.world===world)act(o.fx,o.fy,(sx,sy)=>drawDogThing(ctx,sx,sy,o));});
  act(fx,fy,(sx,sy)=>drawPerson(ctx,sx,sy,look,{dir,bob:moving?Math.sin(bob)*2:0,moving,hero:true}));
  doorMarks().forEach(d=>act(d.x,d.y,(sx,sy)=>drawDoorMark(ctx,sx,sy,14,d.mark)));
  readMarks().forEach(d=>act(d.x,d.y,(sx,sy)=>drawReadMark(ctx,sx,sy,14)));
  R.sort((a,b)=>a.d-b.d).forEach(r=>r.f());
  CRIT.forEach(cr=>{if(cr.leashT>performance.now()&&cr.world===world)drawLeash(cr,camX,camY);});
  trees.forEach(([sx,sy])=>{ /* canopy pass, shared shape with top-down */
    const sw=Math.sin(Date.now()/900+sx)*1.2,cxT=sx+16+sw,cyT=sy+6;
    ctx.fillStyle=tc("#4E8A58");
    ctx.beginPath();ctx.arc(cxT-9,cyT+3,8.5,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(cxT+9,cyT+3,8.5,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(cxT,cyT-3,10,0,7);ctx.fill();
    ctx.fillStyle=tc("#639C6C");
    ctx.beginPath();ctx.arc(cxT-4,cyT-1,6.5,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(cxT+6,cyT+1,5.5,0,7);ctx.fill();
    ctx.fillStyle=art("bloom","#B08FE0");
    [[-8,-4],[3,-8],[9,-1],[-2,2],[-12,4],[12,5]].forEach(p=>{
      ctx.beginPath();ctx.arc(cxT+p[0],cyT+p[1],1.7,0,7);ctx.fill();});
    canopyDress(ctx,cxT,cyT);
  });
  drawAmbient(w,camX,camY);
  drawDaylight(w,camX,camY);
  drawWindows(w,camX,camY);
}
function draw(){
  if(camMode==="3d"){ /* camera #4 — falls back to front-profile if 3D can't run here */
    if(typeof draw3d==="function"&&window.THREE&&draw3d())return;
    drawFront();return;}
  if(camMode==="iso"){drawIso();return;}
  if(camMode==="front"){drawFront();return;}
  const w=CW();
  const camX=Math.max(0,Math.min(w.W*TS-VW,fx*TS+TS/2-VW/2));
  const camY=Math.max(0,Math.min(Math.max(0,w.H*TS-VH),fy*TS+TS/2-VH/2));
  camXg=camX;camYg=camY;
  ctx.fillStyle=tc("#241F2E");ctx.fillRect(0,0,VW,VH);
  const x0=Math.floor(camX/TS),y0=Math.floor(camY/TS),trees=[];
  const queueCanopy=(cx2,cy2)=>trees.push([cx2,cy2]);
  for(let y=y0;y<=Math.min(w.H-1,y0+9);y++)for(let x=x0;x<=Math.min(w.W-1,x0+11);x++){
    const ch=w.rows[y][x],sx=x*TS-camX,sy=y*TS-camY;
    {const fp=FLOORC[world];ctx.fillStyle=tc(fp?((x+y)%2?fp[0]:fp[1]):((x+y)%2?C.floor:C.floorAlt));}
    ctx.fillRect(sx,sy,TS,TS);
    /* wave-1 ground detail: per-tile hash variation (stable speckle) */
    const hsh=(x*374761393+y*668265263+world.charCodeAt(0)*69069)>>>0;
    if((hsh&7)<2){ctx.globalAlpha=0.05;ctx.fillStyle="#000";ctx.fillRect(sx,sy,TS,TS);ctx.globalAlpha=1;}
    if(hsh%11===3){ctx.globalAlpha=0.08;ctx.fillStyle="#FFF";ctx.fillRect(sx+(hsh>>3)%26+2,sy+(hsh>>5)%26+2,2,2);ctx.globalAlpha=1;}
    const tf=TILEDRAW[ch];if(tf)tf({sx,sy,x,y,canopy:queueCanopy});
    if(!SOLID.has(w.grid[y][x])||(TILES[w.grid[y][x]]||{}).kind==="water")petalSpill(w,x,y,sx,sy);
    /* walls cast down: a soft shadow on the walkable tile below any solid one */
    if(y>0&&SOLID.has(w.grid[y-1][x])&&!SOLID.has(w.grid[y][x])){
      ctx.fillStyle="rgba(15,12,20,.13)";ctx.fillRect(sx,sy,TS,6);}
  }
  petalTrail(world,(x,y)=>[x*TS-camX,y*TS-camY]);troDraw2D(world,(x,y)=>[x*TS-camX,y*TS-camY],false);fiestaDraw2D(world,(x,y)=>[x*TS-camX,y*TS-camY],false);
  drawDecals(camX,camY);drawDecor(camX,camY);
  trees.forEach(([sx,sy])=>{ /* canopy pass: overhangs neighboring tiles, sways gently */
    const sw=Math.sin(Date.now()/900+sx)*1.2,cxT=sx+16+sw,cyT=sy+6;
    ctx.fillStyle=tc("#4E8A58");
    ctx.beginPath();ctx.arc(cxT-9,cyT+3,8.5,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(cxT+9,cyT+3,8.5,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(cxT,cyT-3,10,0,7);ctx.fill();
    ctx.fillStyle=tc("#639C6C");
    ctx.beginPath();ctx.arc(cxT-4,cyT-1,6.5,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(cxT+6,cyT+1,5.5,0,7);ctx.fill();
    ctx.fillStyle=art("bloom","#B08FE0"); /* jacaranda blooms */
    [[-8,-4],[3,-8],[9,-1],[-2,2],[-12,4],[12,5]].forEach(p=>{
      ctx.beginPath();ctx.arc(cxT+p[0],cyT+p[1],1.7,0,7);ctx.fill();});
    canopyDress(ctx,cxT,cyT);
  });
  w.npcs.forEach(n=>{
    const sx=(n.fx===undefined?n.x:n.fx)*TS-camX,sy=(n.fy===undefined?n.y:n.fy)*TS-camY;
    if(sx<-TS||sy<-TS||sx>VW||sy>VH)return;
    drawPerson(ctx,sx,sy,npcWhimsy(n),{dir:"down",idle:Math.sin(Date.now()/500+n.x)*0.8,who:n.npc||n.key});
    if(hasSay(n))drawSayMark(ctx,sx,sy);
    drawEmote(n,sx,sy);
  });
  PEERS.forEach(p=>{
    if(p.w!==world)return;
    const sx=p.x*TS-camX,sy=p.y*TS-camY;
    if(sx<-TS||sy<-TS||sx>VW||sy>VH)return;
    drawPerson(ctx,sx,sy,p.look||look,{dir:p.dir||"down",who:p.id||p.name||"peer"});
    ctx.font="600 8px monospace";ctx.textAlign="center";
    ctx.fillStyle="rgba(15,12,20,.75)";ctx.fillText(String(p.name||"").slice(0,12),sx+16.7,sy-1.3);
    ctx.fillStyle="#EDE9F5";ctx.fillText(String(p.name||"").slice(0,12),sx+16,sy-2);
    ctx.textAlign="start";
  });
  if(world===AW("dog"))drawDog(ctx,DOG.fx*TS-camX,DOG.fy*TS-camY);
  if(world===AW("cat"))drawCat(ctx,CAT.fx*TS-camX,CAT.fy*TS-camY);
  if(world===AW("pig"))drawPigeon(ctx,PIG.fx*TS-camX,PIG.fy*TS-camY);
  if(world===AW("loro"))drawLoro(ctx,LORO.x*TS-camX,LORO.y*TS-camY);
  CRIT.forEach(cr=>{
    if(cr.world!==world)return;
    const sx=cr.fx*TS-camX,sy=cr.fy*TS-camY;
    if(sx<-TS||sy<-TS||sx>VW||sy>VH)return;
    if(cr.kind==="butterfly")drawButterfly(ctx,cr,sx,sy);
    else if(cr.kind==="colibri")drawColibri(ctx,cr,sx,sy);
    else if(cr.kind==="gato")drawGato(ctx,cr,sx,sy);
    else if(cr.kind==="beagle")drawBeagle(ctx,cr,sx,sy);
    else if(cr.kind==="lab")drawLab(ctx,cr,sx,sy);
    else if(cr.kind==="chi")drawChi(ctx,cr,sx,sy);
  });
  if(BALL&&BALL.world===world)drawBall(ctx,BALL.fx*TS-camX,BALL.fy*TS-camY,BALL.phase,BALL.t);
  DOGTHINGS.forEach(o=>{if(o.world===world)drawDogThing(ctx,o.fx*TS-camX,o.fy*TS-camY,o);});
  drawPerson(ctx,fx*TS-camX,fy*TS-camY,look,{dir,bob:moving?Math.sin(bob)*2:0,moving,hero:true});
  doorMarks().forEach(d=>drawDoorMark(ctx,d.x*TS-camX,d.y*TS-camY,0,d.mark)); /* the top camera draws its own people — the marker too */
  readMarks().forEach(d=>drawReadMark(ctx,d.x*TS-camX,d.y*TS-camY,0));
  CRIT.forEach(cr=>{if(cr.leashT>performance.now()&&cr.world===world)drawLeash(cr,camX,camY);});
  drawAmbient(w,camX,camY);
  drawDaylight(w,camX,camY);
  drawWindows(w,camX,camY);
}
/* wave-2 lighting: the world knows what time it is. Sunset theme keeps golden hour
   always; otherwise the device clock sets the mood — cool night wash with warm light
   spilling from doors and storefronts, a soft amber edge at dusk/dawn. Alpha stays
   ≤0.22 so themes remain comfortable and the ❗ markers stay readable. */
function drawDaylight(w,camX,camY){
  const dnow=new Date(),hr=dnow.getHours()+dnow.getMinutes()/60;
  const night=hr>=20.5||hr<6,edge=!night&&(hr>=18||hr<8);
  let wash=null;
  if(themeName==="sunset")wash="rgba(255,150,60,.10)";
  else if(night)wash="rgba(28,38,92,.20)";
  else if(edge)wash="rgba(255,150,60,.07)";
  if(!wash)return;
  ctx.fillStyle=wash;ctx.fillRect(0,0,VW,VH);
  if(night){ /* doors and storefronts spill warm light onto the pavement */
    const x0=Math.floor(camX/TS),y0=Math.floor(camY/TS);
    for(let y=y0;y<=Math.min(w.H-1,y0+9);y++)for(let x=x0;x<=Math.min(w.W-1,x0+11);x++){
      const ch=w.rows[y][x];
      if(!(DOORSET.has(ch)||ch==="Q"||ch==="Z"))continue;
      const sx=x*TS-camX,sy=y*TS-camY;
      const g2=ctx.createRadialGradient(sx+16,sy+30,2,sx+16,sy+30,22);
      g2.addColorStop(0,"rgba(255,214,130,.22)");g2.addColorStop(1,"rgba(255,214,130,0)");
      ctx.fillStyle=g2;ctx.fillRect(sx-8,sy+12,TS+16,TS+8);
    }
  }
}
/* lit windows: at dusk and after dark, tiles whose TILES row declares `win` rects
   glow warm — most of them; a hashed few stay dark because somebody is out. Runs
   after the night wash so the light punches through it. Shared by every camera. */
function drawWindows(w,camX,camY){
  const dnow=new Date(),hr=dnow.getHours()+dnow.getMinutes()/60;
  const night=hr>=20.5||hr<6,edge=!night&&(hr>=18||hr<8);
  if(!(night||edge||themeName==="sunset"))return;
  const a=night?0.5:0.28;
  const x0=Math.floor(camX/TS),y0=Math.floor(camY/TS);
  for(let y=y0;y<=Math.min(w.H-1,y0+9);y++)for(let x=x0;x<=Math.min(w.W-1,x0+11);x++){
    const wins=winsKept(world,x,y); /* `world` is the current world id and both call sites pass WORLDS[world] as `w` */
    if(!wins.length)continue;
    const hsh=(x*2654435761+y*40503)>>>0;
    if((hsh&7)<2)continue;
    const sx=x*TS-camX,sy=y*TS-camY;
    if(sx<-TS||sy<-TS||sx>VW||sy>VH)continue;
    ctx.globalAlpha=a*(0.85+0.15*Math.sin(Date.now()/700+hsh%13));
    wins.forEach(wn=>{ctx.fillStyle="#FFD98A";ctx.fillRect(sx+wn[0],sy+wn[1],wn[2],wn[3]);
      ctx.fillStyle="rgba(255,255,255,.35)";ctx.fillRect(sx+wn[0]+1,sy+wn[1]+1,wn[2]*0.35,2);});
    ctx.globalAlpha=1;
  }
}
/* ambient layer: a handful of drifting theme particles — fairy motes, forest petals,
   sunset fireflies. World-anchored so they parallax with the camera; ~14 points/frame. */
function drawAmbient(w,camX,camY){
  const kind=themeName==="fairy"?"mote":themeName==="forest"?"leaf":themeName==="sunset"?"fly":null;
  if(!kind)return;
  const t2=Date.now()/1000,WP=w.W*TS,HP=w.H*TS;
  for(let i=0;i<14;i++){
    const sd=i*127.31+i*i*7.7;
    const x=((sd*53+t2*(kind==="leaf"?26:14)*(1+(i%3)*0.3))%WP+WP)%WP;
    const y=kind==="leaf"?((sd*31+t2*(20+(i%4)*8))%HP+HP)%HP
                         :(((sd*31)%HP+HP)%HP+Math.sin(t2*0.7+i)*14);
    const sx=x-camX,sy=y-camY;
    if(sx<-8||sy<-8||sx>VW+8||sy>VH+8)continue;
    const tw=0.5+0.5*Math.sin(t2*(kind==="fly"?2.1:1.4)+i*2.4);
    ctx.globalAlpha=kind==="fly"?0.25+0.55*tw:0.2+0.4*tw;
    if(kind==="mote"){ctx.fillStyle=i%3?"#D9BFFF":"#FFF3B8";
      ctx.beginPath();ctx.arc(sx,sy,1.2+tw*0.9,0,7);ctx.fill();}
    else if(kind==="leaf"){ctx.fillStyle=i%4===0?"#D77FA8":"#5FA86A";
      ctx.save();ctx.translate(sx,sy);ctx.rotate(t2*1.5+i);ctx.fillRect(-2,-1.1,4,2.2);ctx.restore();}
    else{ctx.fillStyle="#FFD37A";ctx.beginPath();ctx.arc(sx,sy,1.4,0,7);ctx.fill();
      ctx.globalAlpha*=0.35;ctx.beginPath();ctx.arc(sx,sy,3.2,0,7);ctx.fill();}
  }
  ctx.globalAlpha=1;
}
/* ---------- the office Aussie ---------- */
/* ANIMALS seam — the engine's own four animals (the office dog, the bodega cat, the pigeon, the
   parrot) stand where a pack puts them. Meridian's places are the defaults, byte for byte; a pack
   declares ANIMALS={dog:{world,x,y}|null, cat, pig, loro} to move one or leave it out. A null
   animal is nowhere: never drawn, never greeted. (#38: Lorenzo floated in the town because he
   was pinned to a fence only Meridian has at (17,5).) Held by the smoke suites: something
   stands under every animal, and an animal appears only in the world its pack put it in. */
const ANIDEF={dog:{world:"hq",x:12,y:5},cat:{world:"lc",x:16,y:9},pig:{world:"st",x:4,y:1},loro:{world:"st",x:17,y:5}};
const ANI=k=>(typeof ANIMALS!=="undefined"&&ANIMALS&&Object.prototype.hasOwnProperty.call(ANIMALS,k))?ANIMALS[k]:ANIDEF[k];
const AW=k=>{const a=ANI(k);return a&&a.world&&WORLDS[a.world]?a.world:null;};
const aniXY=(k,o)=>{const a=ANI(k);if(a){o.x=a.x|0;o.y=a.y|0;if("fx" in o){o.fx=o.x;o.fy=o.y;}}return o;};
const DOG=aniXY("dog",{x:12,y:5,fx:12,fy:5,moving:false,mt:0,dx:0,dy:0,face:1,next:0,sit:false});
/* ---- one question, asked by every animal in the engine, however it happens to move ----
   troDanger is the noun. The four `…Free` predicates below and the follow path all had their own
   copy of "can I stand there", and the rails were absent from every one of them — which is how a
   dog walking at your heel strolled onto the line and parked the tram, found by test/smoke.js going
   intermittently red on a check about a traffic cone. A wander that avoids the rails and a FOLLOW
   that does not is not a rule, it is a coincidence: bfsStep goes where bfsStep wants. */
function dogFree(x,y){const w=WORLDS[AW("dog")];if(!w)return false;return !(x<0||y<0||x>=w.W||y>=w.H||SOLID.has(w.grid[y][x])||w.grid[y][x]==="N")&&!(world===AW("dog")&&x===px&&y===py)&&!troDanger(AW("dog"),x,y);}
function dogUpdate(dt,now){
  if(world!==AW("dog")&&!DOG.moving){DOG.next=now+800;return;}
  if(DOG.moving){
    DOG.mt+=dt/430;
    if(DOG.mt>=1){DOG.moving=false;DOG.fx=DOG.x;DOG.fy=DOG.y;}
    else{DOG.fx=DOG.x-DOG.dx*(1-DOG.mt);DOG.fy=DOG.y-DOG.dy*(1-DOG.mt);}
    return;
  }
  if(now<DOG.next)return;
  const r=Math.random();
  if(r<0.35){DOG.sit=r<0.15;DOG.next=now+900+Math.random()*2200;return;}
  DOG.sit=false;
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]].filter(d=>dogFree(DOG.x+d[0],DOG.y+d[1]));
  if(!dirs.length){DOG.next=now+1200;return;}
  const d=dirs[Math.floor(Math.random()*dirs.length)];
  DOG.dx=d[0];DOG.dy=d[1];if(d[0])DOG.face=d[0];
  DOG.x+=d[0];DOG.y+=d[1];DOG.moving=true;DOG.mt=0;
  DOG.next=now+600+Math.random()*1800;
  if(Math.abs(DOG.x-px)+Math.abs(DOG.y-py)===1&&Math.random()<0.35&&Date.now()-lastBump>2500){
    lastBump=Date.now();const L=T().dog;toast(L[Math.floor(Math.random()*L.length)],1800);}
}
function drawDog(g,sx,sy){
  const cx=sx+16,wob=DOG.moving?Math.sin(Date.now()/90)*0.8:0;
  g.save();g.translate(cx,0);g.scale(DOG.face,1);g.translate(-cx,0);
  g.fillStyle="rgba(0,0,0,.18)";g.beginPath();g.ellipse(cx,sy+27,8,3,0,0,7);g.fill();
  g.fillStyle="#4C4F58";
  g.fillRect(cx-7,sy+22+wob,2.4,4.5);g.fillRect(cx-2.5,sy+22-wob,2.4,4.5);
  g.fillRect(cx+1.5,sy+22+wob,2.4,4.5);g.fillRect(cx+5,sy+22-wob,2.4,4.5);
  g.fillStyle="#7B7E8A";g.beginPath();g.roundRect(cx-8.5,sy+15,16,9,4.5);g.fill();
  g.fillStyle="#4C4F58";g.beginPath();g.arc(cx-3,sy+18,2.4,0,7);g.fill();
  g.beginPath();g.arc(cx+3.4,sy+20.6,1.9,0,7);g.fill();
  g.fillStyle="#EDEDE8";g.beginPath();g.roundRect(cx+3.6,sy+16.4,4.4,7.2,2.2);g.fill();
  /* bobbed tail — small, always wagging, as requested by management */
  g.fillStyle="#7B7E8A";
  g.beginPath();g.ellipse(cx-9.6,sy+16.5+Math.sin(Date.now()/110)*1.4,2.3,1.7,-0.5,0,7);g.fill();
  if(DOG.sit){g.fillStyle="#7B7E8A";g.beginPath();g.roundRect(cx-9.5,sy+18,7,7,3);g.fill();}
  /* Xochi's wardrobe: cape over the back, bandana at the neck (collar comes after the head) */
  if(wear.cape){g.fillStyle=wear.cape;g.beginPath();g.roundRect(cx-7.8,sy+13.9,10,6.6,2.6);g.fill();
    g.fillStyle="rgba(255,255,255,.28)";g.fillRect(cx-7.8,sy+14.8,10,1);}
  if(wear.bandana){g.fillStyle=wear.bandana;g.beginPath();g.moveTo(cx+3.4,sy+15.6);g.lineTo(cx+10.4,sy+15.6);g.lineTo(cx+7,sy+20.2);g.closePath();g.fill();}
  g.fillStyle="#6E7280";g.beginPath();g.arc(cx+7.5,sy+13.5,4.6,0,7);g.fill();
  if(wear.collar){g.fillStyle=wear.collar;g.fillRect(cx+3.2,sy+16.5,6.2,1.8);
    g.fillStyle="#E0B45C";g.beginPath();g.arc(cx+6.3,sy+19.2,1.05,0,7);g.fill();}
  g.fillStyle="#4C4F58";
  g.beginPath();g.moveTo(cx+4.4,sy+10.6);g.lineTo(cx+6.4,sy+7.4);g.lineTo(cx+8,sy+10.2);g.closePath();g.fill();
  g.beginPath();g.moveTo(cx+8.6,sy+10);g.lineTo(cx+10.8,sy+7.6);g.lineTo(cx+11.6,sy+10.8);g.closePath();g.fill();
  g.fillStyle="#B5773A";g.beginPath();g.arc(cx+10.2,sy+15.2,1.7,0,7);g.fill();
  g.fillStyle="#EDEDE8";g.beginPath();g.arc(cx+11,sy+14.2,1.9,0,7);g.fill();
  g.fillStyle="#26202B";g.beginPath();g.arc(cx+12.1,sy+13.8,0.9,0,7);g.fill();
  g.fillRect(cx+8.2,sy+12.2,1.2,1.2);
  g.restore();
}
/* ---------- Canela, La Cocina's cat ---------- */
const CAT=aniXY("cat",{x:16,y:9,fx:16,fy:9,moving:false,mt:0,dx:0,dy:0,face:1,next:0,sit:true});
function catFree(x,y){const w=WORLDS[AW("cat")];if(!w)return false;return !(x<0||y<0||x>=w.W||y>=w.H||SOLID.has(w.grid[y][x])||w.grid[y][x]==="N")&&!(world===AW("cat")&&x===px&&y===py)&&!troDanger(AW("cat"),x,y);}
function catUpdate(dt,now){
  if(CAT.moving){CAT.mt+=dt/520;
    if(CAT.mt>=1){CAT.moving=false;CAT.fx=CAT.x;CAT.fy=CAT.y;}
    else{CAT.fx=CAT.x-CAT.dx*(1-CAT.mt);CAT.fy=CAT.y-CAT.dy*(1-CAT.mt);}return;}
  if(world!==AW("cat")){CAT.next=now+1000;return;}
  if(now<CAT.next)return;
  const r=Math.random();
  if(r<0.55){CAT.sit=r<0.4;CAT.next=now+1500+Math.random()*3500;return;}
  CAT.sit=false;
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]].filter(d=>catFree(CAT.x+d[0],CAT.y+d[1]));
  if(!dirs.length){CAT.next=now+1500;return;}
  const d=dirs[Math.floor(Math.random()*dirs.length)];
  CAT.dx=d[0];CAT.dy=d[1];if(d[0])CAT.face=d[0];
  CAT.x+=d[0];CAT.y+=d[1];CAT.moving=true;CAT.mt=0;
  CAT.next=now+900+Math.random()*2600;
  if(Math.abs(CAT.x-px)+Math.abs(CAT.y-py)===1&&Math.random()<0.3&&Date.now()-lastBump>2500){
    lastBump=Date.now();const L=T().cat;toast(L[Math.floor(Math.random()*L.length)],1800);}
}
function drawCat(g,sx,sy){
  const cx=sx+16,sw=Math.sin(Date.now()/300);
  g.save();g.translate(cx,0);g.scale(CAT.face,1);g.translate(-cx,0);
  g.fillStyle="rgba(0,0,0,.15)";g.beginPath();g.ellipse(cx,sy+27,6.5,2.6,0,0,7);g.fill();
  g.strokeStyle="#C97F3F";g.lineWidth=2.6;g.lineCap="round";
  g.beginPath();g.moveTo(cx-6.5,sy+21);g.quadraticCurveTo(cx-11,sy+18+sw*2,cx-9.5,sy+13+sw*3);g.stroke();
  g.fillStyle="#D98E4A";g.beginPath();g.roundRect(cx-7,sy+18,12.5,7.5,3.8);g.fill();
  g.fillStyle="#B96F31";g.fillRect(cx-4.5,sy+18.5,1.8,6);g.fillRect(cx-1,sy+18.5,1.8,6);
  if(!CAT.sit){g.fillStyle="#C97F3F";g.fillRect(cx-5.5,sy+24.5,2,3);g.fillRect(cx+2.5,sy+24.5,2,3);}
  if(wearCat.bandana){g.fillStyle=wearCat.bandana; /* neckerchief tucks behind the head */
    g.beginPath();g.moveTo(cx+2.2,sy+18.8);g.lineTo(cx+9.2,sy+18.8);g.lineTo(cx+5.7,sy+22.8);g.closePath();g.fill();}
  g.fillStyle="#D98E4A";g.beginPath();g.arc(cx+6,sy+17.5,4.2,0,7);g.fill();
  g.beginPath();g.moveTo(cx+3.2,sy+15);g.lineTo(cx+4.2,sy+11.6);g.lineTo(cx+6,sy+14);g.closePath();g.fill();
  g.beginPath();g.moveTo(cx+6.6,sy+13.8);g.lineTo(cx+8.6,sy+11.8);g.lineTo(cx+9,sy+15);g.closePath();g.fill();
  g.fillStyle="#F1E3CE";g.beginPath();g.arc(cx+7.3,sy+19.4,2,0,7);g.fill();
  g.fillStyle="#26202B";
  if(CAT.sit){g.fillRect(cx+5.2,sy+17,1.8,0.7);g.fillRect(cx+8,sy+17,1.8,0.7);}
  else{g.fillRect(cx+5.4,sy+16.6,1.1,1.1);g.fillRect(cx+8,sy+16.6,1.1,1.1);}
  g.fillStyle="#C4586B";g.fillRect(cx+9.2,sy+18,1.1,0.9);
  if(wearCat.collar){g.fillStyle=wearCat.collar;g.fillRect(cx+2.8,sy+20.6,5.2,1.4);
    g.fillStyle="#E0B45C";g.beginPath();g.arc(cx+5.4,sy+22.5,0.9,0,7);g.fill();}
  g.restore();
}
/* ---------- Paloma the pigeon (street) & Lorenzo the parrot (perched on the fence) ---------- */
const PIG=aniXY("pig",{x:4,y:1,fx:4,fy:1,moving:false,mt:0,dx:0,dy:0,face:1,next:0,peck:false});
function pigFree(x,y){const w=WORLDS[AW("pig")];if(!w)return false;return !(x<0||y<0||x>=w.W||y>=w.H||SOLID.has(w.grid[y][x])||w.grid[y][x]==="N")&&!(world===AW("pig")&&x===px&&y===py)&&!troDanger(AW("pig"),x,y);}
/* PALOMA GETS OUT OF THE WAY (owner, 2026-09-11: "paloma shouldnt be run over, can she be smart
   enough to jump away?"). A bird, not a rule: she hears it coming three tiles out and lifts off the
   rail — 560 ms, a sine arc about two thirds of a tile high, drifting a little downstream, landing
   on the kerb. Three things decide whether a player reads it as a bird or as a glitch, all three
   measured by Chava in a ten-minute hack before any of this was built: she must LEAVE THE GROUND
   (a tile change at the same height is a teleport, and this game already has a shape for that);
   she must go BEFORE the tram touches her, or one overlapping frame undoes it; and she must land
   somewhere a bird would land and then act normal.
   It fires roughly every fourth tram, forever — she stands on the rail row 22% of her life — so it
   is deliberately SMALL. A hop, not a flight across the street. And the tram still brakes if she is
   somehow still there: the lift is what means it rarely has to, never what excuses it. */
const PIGLIFT=560;
function pigFlee(now){
  if(PIG.lift)return;
  const L=(typeof troLine==="function")?troLine(AW("pig")):null;
  if(!L||TRO.state==="away"||Math.round(PIG.y)!==L.row)return;  /* a car on the line is a car on the line, whatever it is doing */
  const sp=troSpan(L),nose=TRO.x+(TRO.dir>0?sp:0),d=(PIG.x-nose)*TRO.dir;
  /* She must be GOING before the brake window, or the tram stops for her and she never learns why.
     Measured before this line existed: the brake fires at d<=2.6 and the lift triggered at d<=3.2,
     which is 0.6 tiles of lead — about 176 ms at the shipped speed — so in practice the tram entered
     the window first, held, and pigFlee's "state must be run" test then refused to fire at all. The
     result was a tram stopped in the street forever waiting for a bird with no reason to move.
     So: she goes at 5 tiles, comfortably outside the brake, and the lift is also allowed to fire
     while the tram is already holding, which is what unsticks that case rather than hiding it. */
  if(d<-sp||d>TRO_SPEED*0.9)return;   /* the same edge as the brake, moved with it */   /* she hears it ~0.9 s out, not ~5 tiles out: a lead measured
     in TIME survives the next speed change, and a lead measured in tiles does not. At 3.4 that was
     3.1 tiles and at 6.0 it is 5.4, and in both cases she is going before the brake window (2.6) is
     reached. She is still airborne when the tram first eases — deliberately. A car that checks, sees
     her go, and picks its power back up is what a driver actually does; a bird that leaves six tiles
     early reads as psychic. */
  const up=(PIG.y>0&&!SOLID.has((WORLDS[AW("pig")].grid[PIG.y-1]||"")[PIG.x]));
  PIG.lift={t:0,fromY:PIG.y,toY:up?PIG.y-1:PIG.y+1,fromX:PIG.x,drift:TRO.dir*0.35};
  PIG.moving=false;PIG.peck=false;PIG.next=now+PIGLIFT+400;}
function pigUpdate(dt,now){
  if(PIG.lift){const k=(PIG.lift.t+=dt)/PIGLIFT;
    if(k>=1){PIG.y=PIG.lift.toY;PIG.x=Math.max(0,Math.round(PIG.lift.fromX+PIG.lift.drift));
      PIG.fx=PIG.x;PIG.fy=PIG.y;PIG.hop=0;PIG.lift=null;return;}
    PIG.hop=20*Math.sin(Math.PI*k);                       /* the height is the tell */
    PIG.fy=PIG.lift.fromY+(PIG.lift.toY-PIG.lift.fromY)*k;
    PIG.fx=PIG.lift.fromX+PIG.lift.drift*k;return;}
  pigFlee(now);
  if(PIG.moving){PIG.mt+=dt/180;
    if(PIG.mt>=1){PIG.moving=false;PIG.fx=PIG.x;PIG.fy=PIG.y;}
    else{PIG.fx=PIG.x-PIG.dx*(1-PIG.mt);PIG.fy=PIG.y-PIG.dy*(1-PIG.mt);}return;}
  if(world!==AW("pig")){PIG.next=now+1000;return;}
  if(now<PIG.next)return;
  const r=Math.random();
  if(r<0.5){PIG.peck=r<0.3;PIG.next=now+500+Math.random()*1400;return;}
  PIG.peck=false;
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]].filter(d=>pigFree(PIG.x+d[0],PIG.y+d[1]));
  if(!dirs.length){PIG.next=now+900;return;}
  const d=dirs[Math.floor(Math.random()*dirs.length)];
  PIG.dx=d[0];PIG.dy=d[1];if(d[0])PIG.face=d[0];
  PIG.x+=d[0];PIG.y+=d[1];PIG.moving=true;PIG.mt=0;
  PIG.next=now+300+Math.random()*1200;
  if(Math.abs(PIG.x-px)+Math.abs(PIG.y-py)===1&&Math.random()<0.25&&Date.now()-lastBump>3000){
    lastBump=Date.now();const L=T().pigeon;toast(L[Math.floor(Math.random()*L.length)],1700);}
}
function drawPigeon(g,sx,sy){
  sy-=(PIG.hop||0);                                       /* mid-lift she is off the ground */
  const cx=sx+16,pk=PIG.peck?2.2:0;
  g.save();g.translate(cx,0);g.scale(PIG.face,1);g.translate(-cx,0);
  g.fillStyle="rgba(0,0,0,.12)";g.beginPath();g.ellipse(cx,sy+27,4.5,1.8,0,0,7);g.fill();
  g.fillStyle="#E0662B";g.fillRect(cx-1.5,sy+24.5,1,2.5);g.fillRect(cx+1,sy+24.5,1,2.5);
  g.fillStyle="#8B8F98";g.beginPath();g.ellipse(cx,sy+21.5,4.6,3.4,0,0,7);g.fill();
  g.fillStyle="#767A84";g.beginPath();g.ellipse(cx-1.5,sy+21,3,2.2,-.4,0,7);g.fill();
  g.fillStyle="#5E8F6E";g.beginPath();g.arc(cx+3.6,sy+18.6+pk,2.2,0,7);g.fill();
  g.fillStyle="#E0B45C";g.fillRect(cx+5.4,sy+18.2+pk,1.8,0.9);
  g.fillStyle="#26202B";g.fillRect(cx+3.9,sy+17.8+pk,0.9,0.9);
  g.restore();
}
const LORO=aniXY("loro",{x:17,y:5,next:0});
function loroTick(now){
  if(world!==AW("loro"))return;
  if(now<LORO.next)return;LORO.next=now+2000;
  if(Math.abs(LORO.x-px)+Math.abs(LORO.y-py)<=2&&Math.random()<0.45&&Date.now()-lastBump>2600){
    lastBump=Date.now();const L=T().loro;toast("🦜 "+L[Math.floor(Math.random()*L.length)],2000);}
}
function drawLoro(g,sx,sy){
  const bob=Math.sin(Date.now()/280)*1.1;
  g.fillStyle="#2F7D3E";g.beginPath();g.ellipse(sx+16,sy+10+bob*0.4,4,5.2,0,0,7);g.fill();
  g.fillStyle="#2C5FA8";g.fillRect(sx+14.6,sy+14,2.8,9);
  g.fillStyle="#C0392B";g.beginPath();g.arc(sx+16,sy+5.2+bob,2.8,0,7);g.fill();
  g.fillStyle="#F5D34C";g.beginPath();g.moveTo(sx+18.4,sy+5+bob);g.lineTo(sx+21,sy+6+bob);g.lineTo(sx+18.4,sy+7+bob);g.closePath();g.fill();
  g.fillStyle="#26202B";g.fillRect(sx+16.6,sy+4.4+bob,1,1);
  g.fillStyle="#F1E3CE";g.beginPath();g.ellipse(sx+15.2,sy+9.4+bob*0.4,1.6,2.4,0,0,7);g.fill();
}
/* ---------- ambient critters (IDEAS §5: critters as data) ----------
   The content pack declares spawns in CRITTERS [{kind,world,x,y,c}]; the engine owns
   the kinds. Critters wander a small radius around home, never block the hero, and
   the street cat is pettable via the same button as the named animals. */
const CRIT=(typeof CRITTERS!=="undefined"?CRITTERS:[]).map(c=>({...c,fx:c.x,fy:c.y,moving:false,mt:0,dx:0,dy:0,face:1,next:0,sit:false,holdT:0,stayT:0,home:[c.x,c.y]}));
function critFree(cr,x,y){const w=WORLDS[cr.world];
  return !(x<0||y<0||x>=w.W||y>=w.H||SOLID.has(w.grid[y][x])||w.grid[y][x]==="N")
    &&!(world===cr.world&&x===px&&y===py)
    &&!(typeof troDanger==="function"&&troDanger(cr.world,x,y))  /* nothing alive WALKS INTO a road with a car on it */
    &&Math.abs(x-cr.home[0])+Math.abs(y-cr.home[1])<=4;}
/* ---- ...and a thing that finds itself in the road leaves it ----
   Avoidance alone is not enough: the line is empty ground when no car is running, so a critter is
   free to cross it and will be standing on it when the next tram is summoned. Flight alone is not
   enough either: it would step straight back on. So the pair — critFree refuses the step in,
   critShy takes the step out — and between them a critter is on the rails only while it is crossing.
   Three things about the step out, each of which cost something to learn elsewhere in this file:
   · It is SIDEWAYS, never along the line. Running down the rails ahead of a tram is what a bird does
     in a cartoon; the short way out of a road is across it.
   · It ignores the four-tile leash to home. Getting out of the road beats being homesick, and a
     critter clamped to a radius that straddles the rails is exactly the colibri's case.
   · It does not clear `stayT`. A dog told to STAY steps off the rails and then goes on staying,
     beside them. The promise is about wandering off, not about being run over.
   · If both sides are blocked it returns false and does nothing, and troAhead brakes for it. That
     is the owner's original ruling and it is still the backstop: getting out of the way must never
     quietly become being ignored. */
function critShy(cr,now){
  if(typeof troDanger!=="function"||!troDanger(cr.world,cr.x,cr.y))return false;
  const w=WORLDS[cr.world];if(!w)return false;
  const ok=(x,y)=>!(x<0||y<0||x>=w.W||y>=w.H||SOLID.has(w.grid[y][x])||w.grid[y][x]==="N")
    &&!(world===cr.world&&x===px&&y===py)&&!troDanger(cr.world,x,y);
  const d=[[0,-1],[0,1]].filter(o=>ok(cr.x+o[0],cr.y+o[1]))[0];
  if(!d)return false;
  cr.sit=false;cr.dx=d[0];cr.dy=d[1];
  cr.x+=d[0];cr.y+=d[1];cr.moving=true;cr.mt=0;cr.next=now+260;
  return true;}
function critUpdate(dt,now){CRIT.forEach(cr=>{
  if(!cr.moving&&critShy(cr,now))return;   /* the road first: a critter does not wait its turn to live */
  if(cr.moving){cr.mt+=dt/(cr.kind==="gato"?520:cr.kind==="butterfly"?300:160);
    if(cr.mt>=1){cr.moving=false;cr.fx=cr.x;cr.fy=cr.y;}
    else{cr.fx=cr.x-cr.dx*(1-cr.mt);cr.fy=cr.y-cr.dy*(1-cr.mt);}return;}
  if(cr.task){if(world===cr.world)dogStep(cr,now);
    else{cr.task=null;if(BALL&&BALL.dog===cr)BALL=null;}return;}
  if(world!==cr.world){cr.next=now+1200;return;}
  if(now<cr.next)return;
  if(cr.stayT>now){cr.sit=true;return;} /* STAY means stay */
  if(cr.follow){ /* off-leash but loyal: keeps up MOST of the time (canon) */
    const d=Math.abs(cr.x-px)+Math.abs(cr.y-py);
    if(d>2){
      if(Math.random()<0.10){cr.next=now+700;return;} /* something smelled important */
      const st=bfsStep(cr,px,py);
      if(st&&(st[0]||st[1])&&!(cr.x+st[0]===px&&cr.y+st[1]===py)&&!troDanger(cr.world,cr.x+st[0],cr.y+st[1])){
        cr.dx=st[0];cr.dy=st[1];if(st[0])cr.face=st[0];cr.sit=false;
        cr.x+=st[0];cr.y+=st[1];cr.moving=true;cr.mt=0;cr.next=now+60;return;}}
  }
  if(isDog(cr)&&Math.random()<0.018){dogWhim(cr,now);return;}
  const r=Math.random(),idle=cr.kind==="gato"?0.55:0.3;
  if(r<idle){cr.sit=r<idle*0.7;cr.next=now+(cr.kind==="gato"?1500+Math.random()*3500:400+Math.random()*900);return;}
  cr.sit=false;
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]].filter(d=>critFree(cr,cr.x+d[0],cr.y+d[1]));
  if(!dirs.length){cr.next=now+900;return;}
  const d=dirs[Math.floor(Math.random()*dirs.length)];
  cr.dx=d[0];cr.dy=d[1];if(d[0])cr.face=d[0];
  cr.x+=d[0];cr.y+=d[1];cr.moving=true;cr.mt=0;
  cr.next=now+(cr.kind==="gato"?900+Math.random()*2600:250+Math.random()*900);
});}
/* ---------- the dog program (IDEAS §11) ----------
   Any beagle gets a real life: a ball he fetches exactly 4 times in 7 (a shuffled
   cycle, so it feels like a dog and not a coin), a howl, a proper lie-down, holes,
   and — infrequently — the other thing, which fades on its own until the day the
   city hires janitors. All engine-generic: name a dog and the program is his. */
const DOGK=new Set(["beagle","lab","chi"]); /* every kind that runs the dog program */
const isDog=cr=>!!cr&&DOGK.has(cr.kind);
let BALL=null; /* one ball at a time; the city is not a ball pit */
let LEASH=null; /* {cr,w,x,y} — the dog on the leash and where home is */
let PARK={f:0,t:0,h:0,d:0}; /* the park session's little memories: fetches, treats, howls, holes */
const FETCH_ODDS=[1,1,1,1,0,0,0];
const FED_ODDS=[1,1,1,1,1,1,0]; /* food-driven: a recent treat buys a 6-of-7 cycle */
const dogFed=cr=>!!cr.fedT&&performance.now()-cr.fedT<240000; /* ~4 min of motivation */
function fetchRoll(cr){ /* a fresh shuffled 7-cycle per dog — streaks stay dog-like */
  if(!cr.fseq||cr.fi>=7){cr.fseq=(dogFed(cr)?FED_ODDS:FETCH_ODDS).slice();
    for(let i=6;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cr.fseq[i],cr.fseq[j]]=[cr.fseq[j],cr.fseq[i]];}
    cr.fi=0;}
  return !!cr.fseq[cr.fi++];}
function taskFree(cr,x,y){const w=WORLDS[cr.world]; /* the home leash comes off on a job; the rails do not */
  return !(x<0||y<0||x>=w.W||y>=w.H||SOLID.has(w.grid[y][x])||w.grid[y][x]==="N")&&!troDanger(cr.world,x,y);}
/* real pathfinding for a dog with a job — greedy stepping wedged on walls
   (a playtest: sometimes the dog could not get to the ball). BFS floods from the target;
   the first tile to touch the dog is his next step. null = no path exists. */
function bfsStep(cr,tx,ty){
  const w=WORLDS[cr.world];
  if(cr.x===tx&&cr.y===ty)return[0,0];
  const seen=new Uint8Array(w.W*w.H),q=[[tx,ty]];
  seen[ty*w.W+tx]=1;
  while(q.length){
    const[cx,cy]=q.shift();
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=cx+dx,ny=cy+dy;
      if(nx<0||ny<0||nx>=w.W||ny>=w.H||seen[ny*w.W+nx])continue;
      if(nx===cr.x&&ny===cr.y)return[cx-nx,cy-ny];
      if(SOLID.has(w.grid[ny][nx])||w.grid[ny][nx]==="N")continue;
      seen[ny*w.W+nx]=1;q.push([nx,ny]);
    }
  }
  return null;
}
/* ---------- through the door with you ----------
   Asked for on 2026-09-04: the dog can follow the player anywhere; told to stay or sit, he stops
   following; and sometimes he follows just for fun.

   A critter in a world you are not standing in only idles (see the critter update), so a dog could
   never cross a threshold — the leash was the only thing that had ever moved one between worlds.
   This is that same move, decided by the dog instead of by a button. Three rules make it read as a
   dog rather than a mechanic: he has to have BEEN near the door (no teleporting from across town),
   a command to hold overrules it (a command the world ignores is not a command), and when he is
   not on follow he only tags along from right at your heel, and only sometimes. */
const FOLLOW_REACH=4;    /* how close to the door he had to be to notice you leaving */
const FOLLOW_WHIM=0.22;  /* off-duty: he just comes, because he felt like it */
/* somewhere beside you he could actually stand — reachable, not a wall, not your tile, not
   already taken by another dog coming through with him */
function dogSpotNear(tx,ty,taken){
  const w=CW(),rs=dogReach({world:world,x:tx,y:ty});
  const ok=(x,y)=>x>=0&&y>=0&&x<w.W&&y<w.H&&rs[y*w.W+x]&&!(x===tx&&y===ty)&&
    !(taken&&taken.some(t=>t[0]===x&&t[1]===y))&&!CRIT.some(c=>c.world===world&&c.x===x&&c.y===y);
  for(const[dx,dy]of[[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]])
    if(ok(tx+dx,ty+dy))return[tx+dx,ty+dy];
  for(let r=2;r<=5;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)
    if(Math.abs(dx)+Math.abs(dy)===r&&ok(tx+dx,ty+dy))return[tx+dx,ty+dy];
  return null;
}
function dogsFollow(fromW,fromX,fromY){
  const now=performance.now(),taken=[];
  CRIT.forEach(c=>{
    if(!isDog(c)||c.world!==fromW)return;
    if(c.holdT>now||c.stayT>now)return;      /* told to sit, lie down or stay: he holds, and you leave without him */
    const d=Math.abs(c.x-fromX)+Math.abs(c.y-fromY);
    if(c.follow?d>FOLLOW_REACH:!(d<=1&&Math.random()<FOLLOW_WHIM))return;
    const spot=dogSpotNear(px,py,taken);
    if(!spot)return;                          /* nowhere to put him — he waits where he is, never stranded in a wall */
    taken.push(spot);
    c.world=world;c.x=spot[0];c.y=spot[1];c.fx=c.x;c.fy=c.y;
    c.home=[c.x,c.y];c.task=null;c.sit=false;c.layT=0;c.moving=false;c.mt=0;c.next=now+340;
    if(BALL&&BALL.dog===c)BALL=null;          /* the ball stays in the room it was thrown in */
  });
}
/* ---------- light props: things you kick ----------
   Asked for on 2026-09-04: a cone should not make the player walk around it — the player can kick
   it, the dog can even rip it, and it simply reappears once the player leaves the screen.

   A light prop is walkable, so it can never block you and can never seal a room — the whole class
   of "a prop got kicked in front of a door" is impossible by construction rather than by a check.
   Edits are recorded so leaving the room puts every one of them back, which is the owner's own
   scope: FOR NOW, the street tidies itself the moment you are not looking. No save key. */
const isLight=g=>!!(TILES[g]&&TILES[g].light);
let propEdits=[];   /* [world,x,y,glyphBefore] — oldest first, replayed backwards to undo */
function propSet(wid,x,y,g){const w=WORLDS[wid];if(!w||!w.grid[y])return;
  propEdits.push([wid,x,y,w.grid[y][x]]);
  w.grid[y][x]=g;w.rows[y]=w.rows[y].slice(0,x)+g+w.rows[y].slice(x+1);
  if(typeof t3Invalidate==="function")t3Invalidate();}   /* the 3D floor is baked once per build */
function propsReset(){for(let i=propEdits.length-1;i>=0;i--){
    const [wid,x,y,g]=propEdits[i],w=WORLDS[wid];
    if(!w||!w.grid[y])continue;
    w.grid[y][x]=g;w.rows[y]=w.rows[y].slice(0,x)+g+w.rows[y].slice(x+1);}
  if(propEdits.length&&typeof t3Invalidate==="function")t3Invalidate();
  propEdits=[];}
/* somewhere a kicked prop can come to rest: open floor, nobody standing there, no door under it,
   and never on top of another prop */
function propFree(x,y){const w=CW();
  if(x<0||y<0||x>=w.W||y>=w.H)return false;
  const g=w.grid[y][x];
  if(SOLID.has(g)||g==="N"||isLight(g))return false;
  if(portalAt(world,x,y))return false;
  if(x===px&&y===py)return false;
  return !CRIT.some(c=>c.world===world&&c.x===x&&c.y===y);}
function kickProp(x,y,dx,dy){
  const w=CW(),g=w.grid[y]&&w.grid[y][x];
  if(!isLight(g))return;
  /* it skitters ahead of your foot; if that is blocked it squirts sideways; if everything is
     blocked it just stays put and you walk over it, which is what happens to a real cone. */
  const tries=[[dx,dy],[dy,dx],[-dy,-dx]];
  for(const t of tries){const tx=x+t[0],ty=y+t[1];
    if(propFree(tx,ty)){propSet(world,x,y,".");propSet(world,tx,ty,g);return;}}
}
function dogReach(cr){ /* every tile a dog can actually stand on — throws stay honest */
  const w=WORLDS[cr.world],seen=new Uint8Array(w.W*w.H),q=[[cr.x,cr.y]];
  seen[cr.y*w.W+cr.x]=1;
  while(q.length){
    const[cx,cy]=q.shift();
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=cx+dx,ny=cy+dy;
      if(nx<0||ny<0||nx>=w.W||ny>=w.H||seen[ny*w.W+nx])continue;
      if(SOLID.has(w.grid[ny][nx])||w.grid[ny][nx]==="N")continue;
      seen[ny*w.W+nx]=1;q.push([nx,ny]);
    }
  }
  return seen;
}
function dogWalk(cr,tx,ty){ /* one BFS step toward (tx,ty); false if no path or arrived */
  const st=bfsStep(cr,tx,ty);
  if(!st||(st[0]===0&&st[1]===0))return false;
  cr.dx=st[0];cr.dy=st[1];if(st[0])cr.face=st[0];
  cr.x+=st[0];cr.y+=st[1];cr.moving=true;cr.mt=0;return true;
}
function dogStep(cr,now){ /* the task router: every job a dog can hold */
  const tk=cr.task;
  if(tk.wait&&now<tk.wait)return; /* a job may pause (a song, a bowl being set down), and a pause is not a step */
  tk.steps=(tk.steps||0)+1;
  if(tk.steps>80){cr.task=null;if(BALL&&BALL.dog===cr&&BALL.phase!=="carried")BALL.until=Date.now()+4000;return;}
  if(tk.type==="fetch"){
    if(tk.phase==="go"&&!BALL){cr.task=null;return;}
    const tgt=tk.phase==="go"?[BALL.tx,BALL.ty]:[px,py];
    const d=Math.abs(cr.x-tgt[0])+Math.abs(cr.y-tgt[1]);
    if(tk.phase==="go"&&d===0){BALL.phase="carried";BALL.dog=cr;tk.phase="return";return;}
    if(tk.phase==="return"&&d<=1){
      BALL=null;cr.task=null;cr.sit=true;cr.next=now+2400;cr.happyT=now+1800;
      if(cr.world===PL.park)PARK.f++;
      const L=T().fetchYes||[];if(L.length)toast("🎾 "+L[Math.floor(Math.random()*L.length)],2600);
      return;}
    if(!dogWalk(cr,tgt[0],tgt[1])){cr.task=null;
      if(BALL&&BALL.phase!=="carried")BALL.until=Date.now()+4000;else BALL=null;}
    return;}
  if(tk.type==="come"){
    const d=Math.abs(cr.x-px)+Math.abs(cr.y-py);
    if(d<=1){cr.task=null;cr.sit=true;cr.happyT=now+2200;cr.next=now+2600;
      toast("🐶 "+(T().cmdOkCome||"!"),2400);return;}
    if(!dogWalk(cr,px,py))cr.task=null;
    return;}
  if(tk.type==="run"){ /* the agility course, taken at full commitment */
    const wp=tk.wp[tk.i];
    if(!wp){cr.task=null;cr.happyT=now+2200;return;}
    if(cr.x===wp[0]&&cr.y===wp[1]){tk.i++;return;}
    if(!dogWalk(cr,wp[0],wp[1]))cr.task=null;
    return;}
  if(tk.type==="stick"){ /* his own stick: run it down, then carry it home, very pleased with himself */
    const o=tk.o;
    if(!o||DOGTHINGS.indexOf(o)<0){cr.task=null;return;}
    const tgt=tk.phase==="go"?[o.tx,o.ty]:[tk.hx,tk.hy];
    if(cr.x===tgt[0]&&cr.y===tgt[1]){
      if(tk.phase==="go"){if(o.phase==="fly")return;
        o.phase="carried";tk.phase="back";tk.steps=0;return;}
      o.phase="ground";o.dog=null;o.fx=cr.x+0.34*cr.face;o.fy=cr.y+0.08;o.until=now+8000; /* put down beside him */
      cr.task=null;cr.sit=true;cr.happyT=now+2600;cr.next=now+2800;
      if(cr.world===world&&Math.random()<0.5&&T().stickToast)toast("🐶 "+T().stickToast,2400);
      return;}
    if(tk.phase==="back")cr.happyT=now+400;        /* the proud trot: tail up the whole way back */
    if(!dogWalk(cr,tgt[0],tgt[1])){cr.task=null;
      if(o.phase!=="ground"){o.phase="ground";o.fx=cr.x;o.fy=cr.y;}o.dog=null;o.until=now+4000;}
    return;}
  if(tk.type==="door"){ /* at a restaurant door: he sings, somebody who works there brings water */
    if(tk.phase==="go"){
      if(cr.x===tk.at[0]&&cr.y===tk.at[1]){
        tk.phase="sing";tk.steps=0;cr.sit=true;cr.face=Math.sign(tk.step[0]-cr.x)||cr.face;
        cr.howlT=now+2100;if(cr.world===world){try{musHowl();}catch(e){}}
        tk.wait=now+1800;return;}
      if(!dogWalk(cr,tk.at[0],tk.at[1]))cr.task=null;
      return;}
    if(tk.phase==="sing"){tk.bowl=bowlVisit(cr,tk,now);tk.steps=0;
      if(!tk.bowl){tk.phase="home";return;}          /* the step is taken, or nobody works there: he goes home dry */
      tk.phase="drink";tk.wait=now+1000;return;}      /* the time it takes to set a bowl down */
    if(tk.phase==="drink"){
      if(!tk.drank){tk.drank=true;tk.bowl.drinkUntil=now+3200;cr.sit=false;cr.happyT=now+3400;
        cr.face=Math.sign(tk.bowl.fx-cr.x)||cr.face;tk.wait=now+3200;return;}
      tk.phase="home";tk.steps=0;return;}
    /* home — a dog far from home cannot wander (critFree keeps him within four tiles of it) */
    if(Math.abs(cr.x-cr.home[0])+Math.abs(cr.y-cr.home[1])<=1||!dogWalk(cr,cr.home[0],cr.home[1])){
      cr.task=null;cr.sit=true;cr.next=now+1500;}
    return;}
  if(tk.type==="romp"){ /* round and round somebody's feet: they laugh, and nobody runs from him */
    const n=tk.n,w=WORLDS[cr.world];
    if(!n||w.npcs.indexOf(n)<0){cr.task=null;return;}
    n.wnext=Math.max(n.wnext||0,now+2400);           /* they see him coming and wait for him: nobody walks off */
    if(Math.max(Math.abs(cr.x-n.x),Math.abs(cr.y-n.y))>1){if(!dogWalk(cr,n.x,n.y))cr.task=null;return;}
    n.laughUntil=now+1800;cr.happyT=now+900;          /* at their feet: they laugh */
    if(tk.hops<=0){cr.task=null;cr.sit=true;cr.face=Math.sign(n.x-cr.x)||cr.face;cr.next=now+2200;return;}
    tk.hops--;
    /* one hop round them: to a tile still at their feet, next to where he is, never onto them */
    const ring=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]].map(([dx,dy])=>[n.x+dx,n.y+dy])
      .filter(([x,y])=>Math.abs(x-cr.x)+Math.abs(y-cr.y)===1&&taskFree(cr,x,y)&&!(cr.world===world&&x===px&&y===py));
    if(!ring.length){cr.task=null;cr.sit=true;cr.next=now+2200;return;}
    const[x,y]=ring[tk.hops%ring.length];cr.dx=x-cr.x;cr.dy=y-cr.y;if(cr.dx)cr.face=cr.dx;
    cr.x=x;cr.y=y;cr.moving=true;cr.mt=0;tk.wait=now+220;return;}
  if(tk.type==="sniff"){
    const o=tk.other;
    if(!o||o.world!==cr.world){cr.task=null;return;}
    const d=Math.abs(cr.x-o.x)+Math.abs(cr.y-o.y);
    if(d<=1){cr.task=null;cr.sit=true;cr.next=now+2000;o.sit=true;o.next=now+1600;
      cr.face=Math.sign(o.x-cr.x)||cr.face;
      if(Math.random()<0.4)toast("🐶 "+(T().sniff||"👃"),2200);
      return;}
    if(!dogWalk(cr,o.x,o.y))cr.task=null;
    return;}
  if(tk.type==="chase"||tk.type==="flee"){
    if(now>tk.until){cr.task=null;cr.happyT=now+1800;return;}
    if(tk.type==="chase"){const o=tk.other;
      if(!o||o.world!==cr.world){cr.task=null;return;}
      if(!dogWalk(cr,o.x,o.y)){cr.task=null;}return;}
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]].filter(dd=>taskFree(cr,cr.x+dd[0],cr.y+dd[1]));
    if(dirs.length){const dd=dirs[Math.floor(Math.random()*dirs.length)];
      cr.dx=dd[0];cr.dy=dd[1];if(dd[0])cr.face=dd[0];
      cr.x+=dd[0];cr.y+=dd[1];cr.moving=true;cr.mt=0;}
    return;}
  cr.task=null;
}
/* The agility course is whatever gear the park's own map lays down: every tile whose kind is
   "gear", in the order you read the map. Meridian's row 8 reads 3.4.5, so its dog runs hurdle,
   tunnel, weave, the course it always ran. Until 2026-09-29 the course was those three coordinates,
   written here, and every park's dog ran Meridian's course, across bare grass in a park that has no
   gear and off the map in a room smaller than Meridian's park. Read from `rows`, the map as drawn,
   not `grid`, where a person standing on the hurdle is stamped "N": somebody standing on a piece
   does not take it off the course. Asked at every whim and never cached, so a map changed while the
   game runs is the map the dog runs. */
function agilityCourse(wid){const w=WORLDS[wid],wp=[];if(!w)return wp;
  for(let y=0;y<w.H;y++)for(let x=0;x<w.W;x++)if((TILES[w.rows[y][x]]||{}).kind==="gear")wp.push([x,y]);
  return wp;}
function dogWhim(cr,now){ /* his own clock: mostly naps and songs. Digging was a
  puppy phase (canon) — it stays in the repertoire, barely. In the park:
  zoomies through its agility course, if it has one, and the ancient greeting between dogs. */
  const r=Math.random(),park=cr.world===PL.park;
  /* the cone (2026-09-04: the dog can even rip it). Checked before the rest of
     the repertoire so a cone right under his nose beats a nap — but it is one roll in twenty-five,
     so it stays a thing that happened once and not a thing he does. It comes back when you leave
     the room, like every other light prop. */
  if(typeof isLight==="function"&&Math.random()<0.04){
    const near=[[1,0],[-1,0],[0,1],[0,-1],[0,0]]
      .map(d=>[cr.x+d[0],cr.y+d[1]])
      .find(q=>{const w=WORLDS[cr.world];
        return w&&w.grid[q[1]]&&isLight(w.grid[q[1]][q[0]]);});
    if(near){propSet(cr.world,near[0],near[1],".");
      cr.face=Math.sign(near[0]-cr.x)||cr.face;cr.happyT=now+2200;cr.sit=false;cr.layT=0;cr.next=now+2600;
      if(cr.world===world)toast("🐶 "+(T().ripToast||"…"),2400);
      return;}}
  if(cr.friend&&cr.world===cr.friend.w){ /* beside the favorite person: mostly adoration */
    const f=(WORLDS[cr.world].npcs||[]).find(n=>n.key===cr.friend.key);
    if(f&&Math.abs(f.x-cr.x)+Math.abs(f.y-cr.y)<=2&&Math.random()<0.4){
      cr.happyT=now+2200;cr.face=Math.sign(f.x-cr.x)||cr.face;cr.sit=true;cr.next=now+2800;return;}}
  const other=park?CRIT.find(o=>o!==cr&&isDog(o)&&o.world===PL.park&&!o.task
    &&Math.abs(o.x-cr.x)+Math.abs(o.y-cr.y)<=7):null;
  /* THE ODDS: one band of the roll each, in this order: a nap, a song, the course, the greeting, a
     hole, and the other thing. Digging is canon: a puppy phase, kept to about 8% of what
     he does (canon round 2, 2026-09-01, docs/IDEAS.md:436: "~8% of whims, was ~25%"; and on
     2026-09-29, "ok make it about 8 percent yes").
     The course and the greeting only happen where they can, in a park with gear and with another dog
     near, and a band that cannot happen here PASSES QUIETLY: its roll never goes down the list. On
     2026-09-01 those two were slotted in above digging with their conditions in the else-if, so every
     roll they declined fell into the hole: away from the park he dug 22.5% of the time, and beside
     another dog 3.5%. One set of odds cannot land on exactly 8% in places where different whims
     apply, so digging is sized to sit between 7 and 9 in all of them; test/engine.smoke.js (grep
     `DIGS ABOUT 8%`) sweeps the roll in each place and prints the shares.
     Away from the park the course's roll goes to his own stick or a restaurant door, and the greeting's
     to a romp with somebody near (2026-09-29; see `more to do away from the park` below), and each
     passes in its turn when it cannot happen. */
  if(r<0.40){cr.layT=now+3800+Math.random()*3200;cr.sit=false;cr.next=cr.layT;}
  else if(r<0.71){cr.howlT=now+2100;cr.next=now+2800;
    if(park)PARK.h++;
    try{musHowl();}catch(e){} /* an actual tiny howl, when the sound is on */
    if(Math.random()<0.5)toast("🐶 "+(T().howl||"AWOOOOO…"),1800);}
  else if(r<0.83){if(park){const wp=agilityCourse(cr.world);
    /* no gear, no course: the whim passes */
    if(wp.length){cr.task={type:"run",wp,i:0};cr.sit=false;cr.layT=0;}}
    else if(r<0.77)dogStick(cr,now);  /* away from the park the course's roll is his own stick... */
    else dogDoor(cr,now);}           /* ...or a restaurant door; either passes if it cannot happen here */
  else if(r<0.90){if(other){ /* dogs being dogs: sniff, or a burst of chase; no other dog, it passes */
    if(Math.random()<0.55)cr.task={type:"sniff",other};
    else{cr.task={type:"chase",other,until:now+4200};
      other.task={type:"flee",until:now+4200};other.sit=false;other.layT=0;
      if(Math.random()<0.4)toast("🐶 "+(T().chaseToast||"!"),2200);}
    cr.sit=false;cr.layT=0;}
    else if(!park)dogRomp(cr,now);} /* away from the park the greeting's roll is a romp with somebody near */
  else if(r<0.97){cr.digT=now+1700;cr.next=now+2400; /* the rare nod to the puppy phase */
    if(park)PARK.d++;
    const hx=cr.x,hy=cr.y,hw=cr.world;
    setTimeout(()=>DECALS.push({world:hw,x:hx,y:hy,kind:"hole",until:Date.now()+34000}),1400);}
  else{DECALS.push({world:cr.world,x:cr.x,y:cr.y,kind:"poop",until:Date.now()+45000});cr.next=now+3000;}
}
/* ---------- more to do away from the park ----------
   Asked for on 2026-09-29: more to keep the dog busy — his own stick, other dog things, a romp after
   another character, a trip to the bed in the player's office, and a song at a restaurant door until
   a worker brings out a water bowl.
   Each fills a roll that used to pass away from the park (the course and the greeting cannot happen
   there), and each PASSES quietly when it cannot happen here: no room to throw a stick, no restaurant
   door he can reach, somebody already out on the step. So a nap, a song, a hole and the other thing
   keep exactly the share of his whims they had (test/engine.smoke.js, grep `DIGS ABOUT 8%`).
   DOGTHINGS is what he has thrown, carried or been given that is not the ball: it is drawn wherever
   the ball is drawn, in every camera, through drawDogThing — not through DECALS, which only the flat
   cameras paint. DOGVISIT is a person who stepped out to him: a copy of somebody who works there,
   standing on the step outside their own door, gone again on their own clock wherever you are. The
   clocks are the `now` the loop hands every update, never Date.now(), so a test can own them. */
const DOGTHINGS=[],DOGVISIT=[];
function dogSteps(cr,max){ /* how many steps every tile is from him on foot, out to `max`; -1 is further, or no way there */
  const w=WORLDS[cr.world],far=new Int16Array(w.W*w.H).fill(-1),q=[[cr.x,cr.y]];
  far[cr.y*w.W+cr.x]=0;
  while(q.length){const[cx,cy]=q.shift(),d0=far[cy*w.W+cx];if(d0>=max)continue;
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const x=cx+dx,y=cy+dy;
      if(x<0||y<0||x>=w.W||y>=w.H||far[y*w.W+x]>=0||SOLID.has(w.grid[y][x])||w.grid[y][x]==="N")continue;
      far[y*w.W+x]=d0+1;q.push([x,y]);}}
  return far;}
function dogStick(cr,now){ /* he finds a stick, flings it, and runs it down */
  if(DOGTHINGS.some(o=>o.dog===cr))return;
  /* three to five steps away BY WALKING, not as the crow flies: chosen by straight distance, the first
     one landed over La Obra's fence, four tiles off and seventeen steps round (looked at, 2026-09-29) */
  const w=WORLDS[cr.world],far=dogSteps(cr,5),opts=[];
  for(let y=0;y<w.H;y++)for(let x=0;x<w.W;x++){const d=far[y*w.W+x];
    if(d>=3&&!portalAt(cr.world,x,y)&&!troDanger(cr.world,x,y))opts.push([x,y]);}
  if(!opts.length)return;                                    /* no room to throw: the whim passes */
  const[tx,ty]=opts[Math.floor(Math.random()*opts.length)];
  const o={kind:"stick",world:cr.world,sx:cr.x,sy:cr.y,fx:cr.x,fy:cr.y,tx,ty,t:0,phase:"fly",dog:cr};
  DOGTHINGS.push(o);
  cr.task={type:"stick",phase:"go",o,hx:cr.x,hy:cr.y};cr.sit=false;cr.layT=0;cr.face=Math.sign(tx-cr.x)||cr.face;}
function dogRomp(cr,now){ /* the nearest person in reach, for a romp round their feet (owner: "chasing after another character") */
  /* near ON FOOT: within ten steps of their feet. By straight distance the first one picked a man behind
     a fence, three tiles off, and ran the long way round (looked at, 2026-09-29) */
  const w=WORLDS[cr.world],steps=dogSteps(cr,10);let best=null;
  (w.npcs||[]).forEach(n=>{if(String(n.key).indexOf("~bowl")===0)return; /* not somebody who only came out with water */
    let far=-1;[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{const x=n.x+dx,y=n.y+dy;
      if(x>=0&&y>=0&&x<w.W&&y<w.H){const d=steps[y*w.W+x];if(d>=0&&(far<0||d<far))far=d;}});
    if(far<0)return;
    if(!best||far<best.far)best={far,n};});
  if(!best)return;                                           /* nobody near: the whim passes */
  best.n.wnext=Math.max(best.n.wnext||0,now+2400);           /* from the moment he sets off, they stay put */
  cr.task={type:"romp",n:best.n,hops:4};cr.sit=false;cr.layT=0;}
function eateryWorker(e){ /* who comes out: the pack's `who`, or else the first person who works there */
  const inside=(e&&WORLDS[e.world]&&WORLDS[e.world].npcs)||[];
  return (e.who&&inside.find(n=>n.npc===e.who))||inside.find(n=>String(n.key).indexOf("~")!==0)||null;}
function eateryDoors(wid){ /* the steps outside every door in this world into a place the pack says serves food:
  every open tile beside the door, on either side of it. Not only where the way OUT lands you: La Cocina's
  lands you north of the building, the default 3D camera looks from the south, and a worker who came out on
  the far side of the building brought the water where nobody could see it (looked at, 2026-09-29). */
  const out=[],w=WORLDS[wid];if(!w)return out;
  (PL.eateries||[]).forEach(e=>{if(!e||!WORLDS[e.world])return;
    portalsOf(wid).forEach(({x,y,p})=>{if(p.to!==e.world)return;
      [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dx,dy])=>{const sx=x+dx,sy=y+dy;
        if(sx<0||sy<0||sx>=w.W||sy>=w.H||SOLID.has(w.rows[sy][sx])||portalAt(wid,sx,sy))return;
        out.push({step:[sx,sy],door:[x,y],eat:e});});});});
  return out;}
function dogDoor(cr,now){ /* a restaurant he can reach: he goes and sings at its door */
  if(DOGVISIT.length)return;                                 /* somebody is already out on a step */
  const w=WORLDS[cr.world],rs=dogReach(cr);let best=null;
  eateryDoors(cr.world).forEach(d=>{[[-1,0],[1,0],[0,-1],[0,1]].forEach(([dx,dy])=>{
    const x=d.step[0]+dx,y=d.step[1]+dy;
    if(x<0||y<0||x>=w.W||y>=w.H||!rs[y*w.W+x]||portalAt(cr.world,x,y)||troDanger(cr.world,x,y))return;
    if(cr.world===world&&x===px&&y===py)return;
    const far=Math.abs(x-cr.x)+Math.abs(y-cr.y);
    if(!best||far<best.far)best={far,at:[x,y],step:d.step,eat:d.eat};});});
  if(!best)return;                                           /* no restaurant door he can reach: the whim passes */
  cr.task={type:"door",phase:"go",at:best.at,step:best.step,eat:best.eat};cr.sit=false;cr.layT=0;}
function bowlVisit(cr,tk,now){ /* whoever the pack says works there steps out onto the step, with water */
  const e=tk.eat,w=WORLDS[cr.world],[x,y]=tk.step,who=eateryWorker(e);
  if(!who||SOLID.has(w.grid[y][x])||w.grid[y][x]==="N"||(cr.world===world&&x===px&&y===py)
    ||CRIT.some(c=>c!==cr&&c.world===cr.world&&c.x===x&&c.y===y))return null;
  const key="~bowl"+(chillSeq++);
  w.npcs.push({key,npc:who.npc,x,y,fx:x,fy:y,hx:x,hy:y,q:[],still:true,mv:null,mt:0,wnext:0,face:Math.sign(cr.x-x)||1});
  NPCLOOK[key]=lookOf(who); /* her own clothes: a look keyed by map letter would not follow a new key (removeChill clears it) */
  w.grid[y][x]="N";
  DOGVISIT.push({key,until:now+3600});
  const b={kind:"bowl",world:cr.world,fx:x+(cr.x-x)*0.55,fy:y+(cr.y-y)*0.55,phase:"ground",show:now+900,until:now+30000};
  DOGTHINGS.push(b);
  if(cr.world===world){const L=T().bowlToast;
    toast("🥣 "+(typeof L==="function"?L(npcName(who.npc).split(" ·")[0],cr.name||""):(L||"💧")),2800);}
  return b;}
function dogThingsUpdate(dt,now){ /* the stick flies and rides in his mouth; bowls and sticks fade; visitors go back in */
  for(let i=DOGTHINGS.length-1;i>=0;i--){const o=DOGTHINGS[i];
    if(o.world!==world||(o.until&&now>o.until)){DOGTHINGS.splice(i,1);continue;} /* you left: it was never going to wait */
    if(o.phase==="fly"){o.t=Math.min(1,o.t+dt/480);o.fx=o.sx+(o.tx-o.sx)*o.t;o.fy=o.sy+(o.ty-o.sy)*o.t;if(o.t>=1)o.phase="ground";}
    else if(o.phase==="carried"){const d=o.dog;
      if(!d||!d.task||d.task.o!==o||d.world!==o.world){o.phase="ground";o.dog=null;o.until=now+4000;}
      else{o.fx=d.fx+0.28*d.face;o.fy=d.fy-0.12;}}
    if(o.phase==="ground"&&!o.until&&!(o.dog&&o.dog.task&&o.dog.task.o===o))o.until=now+4000; /* dropped, then forgotten */
    o.hidden=!!(o.show&&now<o.show);
    o.fade=o.until?Math.max(0,Math.min(1,(o.until-now)/1500)):1;
    o.drinking=!!(o.drinkUntil&&now<o.drinkUntil);o.ph=now;}
  for(let i=DOGVISIT.length-1;i>=0;i--)if(now>DOGVISIT[i].until){removeChill(DOGVISIT[i].key);DOGVISIT.splice(i,1);}
}
function ballUpdate(dt,now){
  if(!BALL)return;
  if(BALL.world!==world&&BALL.phase!=="carried"){BALL=null;return;} /* you left; the ball stays a memory */
  if(BALL.phase==="fly"){BALL.t+=dt/480;
    if(BALL.t>=1){BALL.t=1;BALL.fx=BALL.tx;BALL.fy=BALL.ty;BALL.phase="ground";
      const dog=BALL.dog;
      if(dog&&dog.world===world&&!dog.task){
        if(fetchRoll(dog)){dog.task={type:"fetch",phase:"go"};dog.sit=false;dog.layT=0;dog.next=0;}
        else{dog.sit=true;dog.face=Math.sign(BALL.tx-dog.x)||dog.face;dog.next=now+2600;
          BALL.until=Date.now()+6000;
          const L=T().fetchNo||[];if(L.length)toast("🐶 "+L[Math.floor(Math.random()*L.length)],2600);}}
      else BALL.until=Date.now()+6000;}
    else{BALL.fx=BALL.sx+(BALL.tx-BALL.sx)*BALL.t;BALL.fy=BALL.sy+(BALL.ty-BALL.sy)*BALL.t;}}
  else if(BALL.phase==="ground"&&BALL.until&&Date.now()>BALL.until)BALL=null;
  else if(BALL.phase==="carried"&&BALL.dog){BALL.fx=BALL.dog.fx+0.28*BALL.dog.face;BALL.fy=BALL.dog.fy-0.12;}
}
function drawLeash(cr,camX,camY){ /* blue, like his collar — canon */
  const hx=fx*TS-camX+16,hy=fy*TS-camY+21;
  const dx=cr.fx*TS-camX+16,dy2=cr.fy*TS-camY+19;
  ctx.strokeStyle="#2E5FA8";ctx.lineWidth=1.6;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(hx,hy);
  ctx.quadraticCurveTo((hx+dx)/2,Math.max(hy,dy2)+7,dx,dy2);ctx.stroke();
}
function drawBall(g,sx,sy,phase,t){
  const arc=phase==="fly"?Math.sin(Math.PI*Math.min(1,t))*16:0;
  const cx=sx+16,cy=sy+20-arc;
  if(phase!=="carried"){g.fillStyle="rgba(0,0,0,.15)";g.beginPath();g.ellipse(cx,sy+24,3.4,1.4,0,0,7);g.fill();}
  g.fillStyle="#CBE04A";g.beginPath();g.arc(cx,cy,3.4,0,7);g.fill();
  g.strokeStyle="#F4F1EA";g.lineWidth=0.9;
  g.beginPath();g.arc(cx-1.4,cy,3.1,-1.1,1.1);g.stroke();
  g.beginPath();g.arc(cx+1.4,cy,3.1,Math.PI-1.1,Math.PI+1.1);g.stroke();
}
function drawDogThing(g,sx,sy,o){ /* the simplest honest drawing of each, for Pili to shape: a stick, a bowl of water */
  if(!o||o.hidden)return;
  const a=o.fade===undefined?1:o.fade;if(a<=0)return;
  g.globalAlpha=a;
  if(o.kind==="stick"){
    const arc=o.phase==="fly"?Math.sin(Math.PI*Math.min(1,o.t))*14:0,cx=sx+16,cy=sy+21-arc;
    if(o.phase!=="carried"){g.fillStyle="rgba(0,0,0,.15)";g.beginPath();g.ellipse(cx,sy+25,6,1.4,0,0,7);g.fill();}
    g.save();g.translate(cx,cy);g.rotate(o.phase==="carried"?0:o.phase==="fly"?o.t*6:0.35);
    g.fillStyle="#7A5230";g.fillRect(-7,-1.2,14,2.4);           /* the stick */
    g.fillStyle="#5E3E22";g.fillRect(-7,-1.2,2.4,2.4);g.fillRect(2,-4,1.3,3); /* the chewed end, a twig */
    g.restore();}
  else if(o.kind==="bowl"){const cx=sx+16,cy=sy+23;
    g.fillStyle="rgba(0,0,0,.15)";g.beginPath();g.ellipse(cx,cy+2.4,7.5,2,0,0,7);g.fill();
    g.fillStyle="#8C98A4";g.beginPath();g.ellipse(cx,cy,7,3.2,0,0,7);g.fill();      /* the steel bowl */
    g.fillStyle="#5FA8D8";g.beginPath();g.ellipse(cx,cy-0.4,5,2,0,0,7);g.fill();    /* the water */
    g.fillStyle="#DCEFFA";g.fillRect(cx-2.6,cy-1.3,2.2,0.8);                          /* a glint */
    if(o.drinking){const r=1+((o.ph||0)/180)%3.2;g.strokeStyle="#DCEFFA";g.lineWidth=0.6; /* he is lapping it up */
      g.beginPath();g.ellipse(cx+1,cy-0.4,r,r*0.4,0,0,7);g.stroke();}}
  g.globalAlpha=1;}
$("ball").addEventListener("click",()=>{
  if(BALL||!DOGK.has(petTarget)||!petCrit||petCrit.task)return;
  const w=CW(),rs=dogReach(petCrit),opts=[];
  for(let y=0;y<w.H;y++)for(let x=0;x<w.W;x++){
    const d=Math.abs(x-px)+Math.abs(y-py);
    if(d>=2&&d<=4&&rs[y*w.W+x])opts.push([x,y]);} /* only tiles the dog can reach */
  if(!opts.length){toast(T().ballNoRoom||"…",1800);return;}
  const [tx,ty]=opts[Math.floor(Math.random()*opts.length)];
  BALL={world,sx:px,sy:py,fx:px,fy:py,tx,ty,t:0,phase:"fly",dog:petCrit};
  $("ball").hidden=true;
});
function drawButterfly(g,cr,sx,sy){
  const t2=Date.now(),fl=Math.abs(Math.sin(t2/90)),bobY=Math.sin(t2/300+cr.home[0])*2.5;
  const cx=sx+16,cy=sy+13+bobY;
  g.save();g.translate(cx,0);g.scale(cr.face,1);g.translate(-cx,0);
  g.fillStyle=cr.c;
  g.beginPath();g.ellipse(cx-2.6,cy-1.5,3.1*fl+0.6,2.6,-.5,0,7);g.fill();
  g.beginPath();g.ellipse(cx+2.6,cy-1.5,3.1*fl+0.6,2.6,.5,0,7);g.fill();
  g.globalAlpha=.75;
  g.beginPath();g.ellipse(cx-2.2,cy+1.6,2.4*fl+0.5,2,-.4,0,7);g.fill();
  g.beginPath();g.ellipse(cx+2.2,cy+1.6,2.4*fl+0.5,2,.4,0,7);g.fill();
  g.globalAlpha=1;
  g.fillStyle="#26202B";g.fillRect(cx-0.7,cy-3,1.4,6.5);
  g.restore();
}
function drawColibri(g,cr,sx,sy){
  const t2=Date.now(),hov=Math.sin(t2/160)*1.6,wg=Math.abs(Math.sin(t2/55));
  const cx=sx+16,cy=sy+12+hov;
  g.save();g.translate(cx,0);g.scale(cr.face,1);g.translate(-cx,0);
  g.globalAlpha=.45;g.fillStyle="#9CB8AE"; /* wing blur */
  g.beginPath();g.ellipse(cx-1,cy-3,4.5*wg+1,2,-.9,0,7);g.fill();
  g.globalAlpha=1;
  g.fillStyle=cr.c;g.beginPath();g.ellipse(cx,cy,3.4,2.4,-.3,0,7);g.fill();
  g.fillStyle="#2C5FA8";g.beginPath();g.moveTo(cx-3,cy+1);g.lineTo(cx-6.5,cy+3.5);g.lineTo(cx-3.5,cy+2.6);g.closePath();g.fill();
  g.fillStyle="#C4586B";g.beginPath();g.arc(cx+3,cy-1.4,1.7,0,7);g.fill();
  g.fillStyle="#26202B";g.fillRect(cx+4.4,cy-1.8,4.4,0.8); /* the beak */
  g.fillRect(cx+3.2,cy-2.1,0.8,0.8);
  g.restore();
}
function drawBeagle(g,cr,sx,sy){ /* a lemon beagle: white coat, lemon saddle, floppy ears, working tail */
  const nw=performance.now(),lay=cr.layT>nw,howl=cr.howlT>nw,dig=cr.digT>nw,happy=cr.happyT>nw;
  const cx=sx+16,wag=Math.sin(Date.now()/(happy?70:130))*(happy?3.4:2.4),lemon="#E8C46A",white="#F6F2E8";
  const dy=lay?3:0,hy=howl?-3:0;
  g.save();g.translate(cx,0);g.scale(cr.face,1);g.translate(-cx,0);
  g.fillStyle="rgba(0,0,0,.15)";g.beginPath();g.ellipse(cx,sy+27,7,2.8,0,0,7);g.fill();
  g.strokeStyle=lemon;g.lineWidth=2.4;g.lineCap="round"; /* the tail: lemon, always going (slower when resting) */
  const wg=lay?wag*0.4:wag,tex2=cx-10+wg,tey=sy+11+dy;
  g.beginPath();g.moveTo(cx-7,sy+19.5+dy);g.quadraticCurveTo(cx-11,sy+15+dy+wg*0.5,tex2,tey);g.stroke();
  g.fillStyle=white;g.beginPath();g.arc(tex2,tey,1.5,0,7);g.fill(); /* the white tip — canon */
  g.fillStyle=white;g.beginPath();g.roundRect(cx-7.5,sy+17+dy,14,8,4);g.fill();
  g.fillStyle=lemon;g.beginPath();g.roundRect(cx-5,sy+16.5+dy,8,4.5,3);g.fill(); /* saddle */
  g.fillStyle=white; /* white freckles across the lemon coat */
  [[-4.4,17.2],[2.3,17.4],[-1.2,18.6],[1.6,20]].forEach(p=>{g.beginPath();g.arc(cx+p[0],sy+p[1]+dy,0.55,0,7);g.fill();});
  if(!cr.sit&&!lay){g.fillRect(cx-6,sy+24.5,2.2,3.2);g.fillRect(cx+3,sy+24.5,2.2,3.2);}
  if(lay)g.fillRect(cx+2,sy+24.8,7.5,2.2); /* front legs stretched out, professionally */
  if(dig){ /* paws at the ground, dirt flying */
    g.fillRect(cx+7,sy+22+Math.sin(Date.now()/70)*2,3,4);
    g.fillStyle="#6E5638";[[13,17],[16,13],[14,21]].forEach((p,i)=>{
      g.fillRect(cx+p[0]+Math.sin(Date.now()/90+i*2)*2.5,sy+p[1],2,2);});
    g.fillStyle=white;}
  g.beginPath();g.arc(cx+6.5,sy+16+dy+hy,4.6,0,7);g.fill(); /* head */
  g.fillStyle=cr.collar||"#2E5FA8"; /* the collar: blue to start, like his leash (canon) */
  g.beginPath();g.roundRect(cx+2.5,sy+18.6+dy,6,1.7,1);g.fill();
  if(cr.band){g.fillStyle=cr.band; /* a bandana from the park, worn with dignity over the collar */
    g.beginPath();g.moveTo(cx+2.4,sy+18.4+dy);g.lineTo(cx+8.2,sy+18.6+dy);g.lineTo(cx+5.2,sy+22+dy);
    g.closePath();g.fill();
    g.fillStyle="rgba(255,255,255,.3)";g.fillRect(cx+2.6,sy+18.4+dy,5.4,0.9);}
  g.fillStyle=lemon; /* lemon crown over the brow — a lemon beagle wears his color up top */
  g.beginPath();g.arc(cx+7,sy+14.4+dy+hy,3.7,Math.PI,Math.PI*2);g.fill();
  g.fillRect(cx+3.3,sy+14.4+dy+hy,7.4,1.6);
  g.fillStyle=white; /* beagle canon: the heart on his face — tip pointing to his nose,
     the two bumps back on either side. A perfect heart, just angled forward. */
  g.save();g.translate(cx+6.7,sy+13+dy+hy);g.rotate(-0.75);
  g.beginPath();g.arc(-0.62,-0.46,0.72,0,7);g.arc(0.62,-0.46,0.72,0,7);g.fill();
  g.beginPath();g.moveTo(-1.31,-0.17);g.lineTo(0,1.46);g.lineTo(1.31,-0.17);g.closePath();g.fill();
  g.restore();
  g.fillStyle=lemon; /* floppy ear */
  g.beginPath();g.roundRect(cx+2.2,sy+13.2+dy+hy,3.4,7.5,2);g.fill();
  g.fillStyle=white; /* ear freckles */
  [[3.4,15.2],[4.4,18.3]].forEach(p=>{g.beginPath();g.arc(cx+p[0],sy+p[1]+dy+hy,0.5,0,7);g.fill();});
  g.fillStyle="#26202B";
  if(lay&&!howl)g.fillRect(cx+6.2,sy+15.2+dy,1.9,0.7); /* eyes closed — do not disturb */
  else g.fillRect(cx+6.8,sy+14.6+dy+hy,1.2,1.2); /* eye */
  if(howl)g.beginPath(),g.arc(cx+9.6,sy+13.4+dy+hy,1.3,0,7),g.fill(); /* nose to the sky */
  else g.beginPath(),g.arc(cx+10.6,sy+17.2+dy,1.3,0,7),g.fill(); /* nose */
  g.restore(); /* text outside the mirror so it never flips */
  g.textAlign="center";
  if(howl){g.fillStyle="#8B6FC8";g.font="9px serif";
    g.fillText("♪",cx+3,sy+5+Math.sin(Date.now()/200)*2);}
  if(happy){g.fillStyle="#C4586B";g.font="8px serif";g.fillText("❤",cx-5,sy+9);}
  if(cr.loveT>nw){ /* you said it; he heard you */
    g.fillStyle="#C4586B";g.font="8px serif";
    [[-8,0],[0,-3],[8,1]].forEach((p,i)=>{
      g.globalAlpha=0.45+0.55*Math.abs(Math.sin(Date.now()/260+i*1.9));
      g.fillText("❤",cx+p[0],sy+8+p[1]-((Date.now()/150+i*30)%14)*0.5);});
    g.globalAlpha=1;}
  g.textAlign="start";
}
function dogOverlays(g,cr,cx,sy){ /* the shared feelings layer: note, hearts, love */
  const nw=performance.now();
  g.textAlign="center";
  if(cr.howlT>nw){g.fillStyle="#8B6FC8";g.font="9px serif";
    g.fillText("♪",cx+3,sy+5+Math.sin(Date.now()/200)*2);}
  if(cr.happyT>nw){g.fillStyle="#C4586B";g.font="8px serif";g.fillText("❤",cx-5,sy+9);}
  if(cr.loveT>nw){g.fillStyle="#C4586B";g.font="8px serif";
    [[-8,0],[0,-3],[8,1]].forEach((p,i)=>{
      g.globalAlpha=0.45+0.55*Math.abs(Math.sin(Date.now()/260+i*1.9));
      g.fillText("❤",cx+p[0],sy+8+p[1]-((Date.now()/150+i*30)%14)*0.5);});
    g.globalAlpha=1;}
  g.textAlign="start";
}
function drawLab(g,cr,sx,sy){ /* a lab: solid, square, permanently pleased */
  const nw=performance.now(),lay=cr.layT>nw,howl=cr.howlT>nw,dig=cr.digT>nw,happy=cr.happyT>nw;
  const cx=sx+16,wag=Math.sin(Date.now()/(happy?70:150))*(happy?3.2:2),co=cr.c||"#E0C070";
  const dk=shadeHex(co,-0.25),dy=lay?3:0,hy=howl?-3:0;
  g.save();g.translate(cx,0);g.scale(cr.face,1);g.translate(-cx,0);
  g.fillStyle="rgba(0,0,0,.15)";g.beginPath();g.ellipse(cx,sy+27,8,3,0,0,7);g.fill();
  g.strokeStyle=co;g.lineWidth=3;g.lineCap="round"; /* thick otter tail */
  g.beginPath();g.moveTo(cx-8,sy+20+dy);g.quadraticCurveTo(cx-12,sy+17+dy+wag*0.4,cx-11+wag,sy+13+dy);g.stroke();
  g.fillStyle=co;g.beginPath();g.roundRect(cx-8.5,sy+15.5+dy,16,9.5,4);g.fill(); /* barrel body */
  if(!cr.sit&&!lay){g.fillRect(cx-7,sy+24.5,2.8,3.4);g.fillRect(cx+3.5,sy+24.5,2.8,3.4);}
  if(lay)g.fillRect(cx+2,sy+24.8,8.5,2.4);
  if(dig){g.fillRect(cx+8,sy+22+Math.sin(Date.now()/70)*2,3,4);
    g.fillStyle="#6E5638";[[14,17],[17,13]].forEach((p,i)=>{
      g.fillRect(cx+p[0]+Math.sin(Date.now()/90+i*2)*2.5,sy+p[1],2,2);});g.fillStyle=co;}
  g.fillStyle=cr.collar||"#2E5FA8";
  g.beginPath();g.roundRect(cx+2.8,sy+17.6+dy,6.4,1.8,1);g.fill();
  if(cr.band){g.fillStyle=cr.band;
    g.beginPath();g.moveTo(cx+2.6,sy+17.5+dy);g.lineTo(cx+8.8,sy+17.7+dy);g.lineTo(cx+5.6,sy+21.4+dy);
    g.closePath();g.fill();}
  g.fillStyle=co;g.beginPath();g.roundRect(cx+3.5,sy+10.5+dy+hy,9.5,8,3.5);g.fill(); /* blocky head */
  g.fillStyle=dk;g.beginPath();g.roundRect(cx+2.6,sy+11+dy+hy,3,6.5,2);g.fill(); /* ear */
  g.fillStyle="#26202B";
  if(lay&&!howl)g.fillRect(cx+8,sy+13.4+dy,2,0.7);
  else g.fillRect(cx+8.4,sy+12.8+dy+hy,1.3,1.3);
  g.beginPath();g.arc(cx+12.4,sy+(howl?12:15)+dy+hy,1.5,0,7);g.fill(); /* big nose */
  g.restore();
  dogOverlays(g,cr,cx,sy);
}
function drawChi(g,cr,sx,sy){ /* a chihuahua: 4 pounds of dog, 40 pounds of opinion */
  const nw=performance.now(),lay=cr.layT>nw,howl=cr.howlT>nw,dig=cr.digT>nw,happy=cr.happyT>nw;
  const cx=sx+16,wag=Math.sin(Date.now()/(happy?60:120))*(happy?2.6:1.8),co=cr.c||"#C9975C";
  const dk=shadeHex(co,-0.22),dy=lay?2:0,hy=howl?-2.5:0;
  g.save();g.translate(cx,0);g.scale(cr.face,1);g.translate(-cx,0);
  g.fillStyle="rgba(0,0,0,.13)";g.beginPath();g.ellipse(cx,sy+27,5.5,2.2,0,0,7);g.fill();
  g.strokeStyle=co;g.lineWidth=1.8;g.lineCap="round"; /* thin curled tail */
  g.beginPath();g.moveTo(cx-4.5,sy+21.5+dy);g.quadraticCurveTo(cx-7.5,sy+18.5+dy+wag*0.4,cx-6+wag*0.6,sy+16.5+dy);g.stroke();
  g.fillStyle=co;g.beginPath();g.roundRect(cx-4.5,sy+20+dy,9.5,5.5,2.6);g.fill(); /* small body */
  if(!cr.sit&&!lay){g.fillRect(cx-3.5,sy+25,1.7,2.6);g.fillRect(cx+2,sy+25,1.7,2.6);}
  if(lay)g.fillRect(cx+1.5,sy+25,5.5,1.8);
  if(dig){g.fillRect(cx+4.5,sy+23.5+Math.sin(Date.now()/70)*1.6,2,3);
    g.fillStyle="#6E5638";g.fillRect(cx+9+Math.sin(Date.now()/90)*2,sy+20,1.6,1.6);g.fillStyle=co;}
  g.fillStyle=cr.collar||"#2E5FA8";
  g.beginPath();g.roundRect(cx+1.6,sy+19.4+dy,4.4,1.4,1);g.fill();
  if(cr.band){g.fillStyle=cr.band;
    g.beginPath();g.moveTo(cx+1.4,sy+19.3+dy);g.lineTo(cx+6.2,sy+19.5+dy);g.lineTo(cx+3.8,sy+22.2+dy);
    g.closePath();g.fill();}
  g.fillStyle=co;g.beginPath();g.arc(cx+5,sy+15.5+dy+hy,4.2,0,7);g.fill(); /* apple head */
  g.beginPath();g.moveTo(cx+1.2,sy+13+dy+hy);g.lineTo(cx+2.2,sy+8+dy+hy);g.lineTo(cx+4.6,sy+11.6+dy+hy);g.closePath();g.fill();
  g.beginPath();g.moveTo(cx+5.6,sy+11.4+dy+hy);g.lineTo(cx+8.2,sy+7.6+dy+hy);g.lineTo(cx+9,sy+12.6+dy+hy);g.closePath();g.fill();
  g.fillStyle=dk;
  g.beginPath();g.moveTo(cx+2.2,sy+12.2+dy+hy);g.lineTo(cx+2.7,sy+9.6+dy+hy);g.lineTo(cx+4,sy+11.4+dy+hy);g.closePath();g.fill();
  g.fillStyle="#26202B";
  if(lay&&!howl)g.fillRect(cx+4.4,sy+14.8+dy,1.8,0.6);
  else{g.fillRect(cx+3.6,sy+14.2+dy+hy,1.5,1.5);g.fillRect(cx+6.6,sy+14.2+dy+hy,1.5,1.5);} /* enormous eyes */
  g.beginPath();g.arc(cx+8.6,sy+(howl?14:16.6)+dy+hy,1,0,7);g.fill();
  g.restore();
  dogOverlays(g,cr,cx,sy);
}
function drawGato(g,cr,sx,sy){ /* the street cat: Canela's silhouette, alley palette, no collar — yet */
  const cx=sx+16,sw=Math.sin(Date.now()/300+7);
  g.save();g.translate(cx,0);g.scale(cr.face,1);g.translate(-cx,0);
  g.fillStyle="rgba(0,0,0,.15)";g.beginPath();g.ellipse(cx,sy+27,6.5,2.6,0,0,7);g.fill();
  g.strokeStyle="#6E7278";g.lineWidth=2.6;g.lineCap="round";
  g.beginPath();g.moveTo(cx-6.5,sy+21);g.quadraticCurveTo(cx-11,sy+18+sw*2,cx-9.5,sy+13+sw*3);g.stroke();
  g.fillStyle="#8B8F98";g.beginPath();g.roundRect(cx-7,sy+18,12.5,7.5,3.8);g.fill();
  g.fillStyle="#6E7278";g.fillRect(cx-4.5,sy+18.5,1.8,6);g.fillRect(cx-1,sy+18.5,1.8,6);
  if(!cr.sit){g.fillStyle="#7B7F88";g.fillRect(cx-5.5,sy+24.5,2,3);g.fillRect(cx+2.5,sy+24.5,2,3);}
  g.fillStyle="#8B8F98";g.beginPath();g.arc(cx+6,sy+17.5,4.2,0,7);g.fill();
  g.beginPath();g.moveTo(cx+3.2,sy+15);g.lineTo(cx+4.2,sy+11.6);g.lineTo(cx+6,sy+14);g.closePath();g.fill();
  g.beginPath();g.moveTo(cx+6.6,sy+13.8);g.lineTo(cx+8.6,sy+11.8);g.lineTo(cx+9,sy+15);g.closePath();g.fill();
  g.fillStyle="#D8DBE0";g.beginPath();g.arc(cx+7.3,sy+19.4,2,0,7);g.fill();
  g.fillStyle="#26202B";
  if(cr.sit){g.fillRect(cx+5.2,sy+17,1.8,0.7);g.fillRect(cx+8,sy+17,1.8,0.7);}
  else{g.fillRect(cx+5.4,sy+16.6,1.1,1.1);g.fillRect(cx+8,sy+16.6,1.1,1.1);}
  g.fillStyle="#C4586B";g.fillRect(cx+9.2,sy+18,1.1,0.9);
  g.restore();
}
/* El Portero (#8, Pili's first robot): a tin man with a clipboard, a shade too still. Square head,
   two amber lamps for eyes, an antenna with a red tip, a riveted barrel body, tread feet. He does
   not bob; he does not blink. Drawn wherever drawPerson would draw him, so every camera sees him. */
function drawRobot(g,sx,sy,lk,o){
  o=o||{};const d=o.dir||"down",tin=lk.shirt||"#9AA3AD",dark="#5B6470",lamp="#F2B705";
  g.fillStyle="rgba(0,0,0,.2)";g.beginPath();g.ellipse(sx+16,sy+28,8,3.5,0,0,7);g.fill();
  g.fillStyle=dark;g.fillRect(sx+9,sy+24,6,4);g.fillRect(sx+17,sy+24,6,4); /* tread feet */
  g.fillStyle=tin;g.beginPath();g.roundRect(sx+8,sy+11,16,13,3);g.fill(); /* the barrel */
  g.strokeStyle="rgba(15,12,20,.4)";g.lineWidth=.8;g.stroke();
  g.fillStyle=dark;[[11,14],[20,14],[11,21],[20,21]].forEach(r=>g.fillRect(sx+r[0],sy+r[1],1.4,1.4)); /* rivets */
  g.fillStyle="#DDE4EA";g.fillRect(sx+13,sy+15,6,7);g.fillStyle="#26202B";[16.5,18,19.5].forEach(yy=>g.fillRect(sx+14,sy+yy,4,0.7)); /* the clipboard, three lines on it */
  g.fillStyle=tin;g.fillRect(sx+5,sy+12,3,8);g.fillRect(sx+24,sy+12,3,8); /* arms, straight down */
  g.fillStyle=lk.skin||"#B8C0C8";g.beginPath();g.roundRect(sx+9.5,sy-1,13,12,2);g.fill(); /* the square head */
  g.strokeStyle="rgba(15,12,20,.4)";g.stroke();
  g.fillStyle=dark;g.fillRect(sx+15.4,sy-5,1.2,4.5);g.fillStyle="#D9342B";g.beginPath();g.arc(sx+16,sy-5.4,1.4,0,7);g.fill(); /* antenna, red tip */
  const ex=d==="left"?-1.5:d==="right"?1.5:0;
  if(d!=="up"){g.fillStyle="#2B2536";g.fillRect(sx+11.5+ex,sy+2.5,4,3.6);g.fillRect(sx+16.5+ex,sy+2.5,4,3.6);
    g.fillStyle=lamp;g.fillRect(sx+12.3+ex,sy+3.3,2.4,2);g.fillRect(sx+17.3+ex,sy+3.3,2.4,2); /* amber lamps */
    g.fillStyle="#2B2536";g.fillRect(sx+13,sy+8,6,1);} /* a slot for a mouth; it does not move */
}
const FACE_DEF={looks:[ /* the engine's own five, the same recipe as the packs': light base, black sockets, nose, stitches — always */
  {id:"clasica",name:{en:"Calaca clásica",es:"Calaca clásica"},base:"#F4F1EA",ring:"#2B2536",dark:"#2B2536",brow:"dots",mark:"#2B2536"},
  {id:"cempasuchil",name:{en:"Cempasúchil",es:"Cempasúchil"},base:"#FFF3D6",ring:"#FF6A00",dark:"#3A1F12",petals:true,brow:"dots",mark:"#FFC300"},
  {id:"catrina",name:{en:"Catrina",es:"Catrina"},base:"#F6F2E8",ring:"#1B1230",dark:"#1B1230",tall:true,brow:"tear",mark:"#8A3FE8",lip:"#C8102E"},
  {id:"turquesa",name:{en:"Turquesa",es:"Turquesa"},base:"#EAF7F5",ring:"#00B8C4",dark:"#12324A",brow:"dots",mark:"#00B8C4",chin:"#00B8C4"},
  {id:"corazon",name:{en:"Corazón",es:"Corazón"},base:"#FBEFEA",ring:"#D9342B",dark:"#2B2536",nose:"heart",mark:"#D9342B",brow:"web"}]};
function faceLooks(){const a=art("facepaint",null);if(!a)return null;
  if(a===true)return FACE_DEF.looks; /* a season may just say "yes" and take the engine's five (Día de Muertos does) */
  if(a.looks&&a.looks.length)return a.looks;if(a.base)return [{id:"pack",name:{en:"Calavera",es:"Calavera"},base:a.base,ring:a.accent||"#F28C28",dark:a.dark||"#2B2536"}];return FACE_DEF.looks;}
function faceLookFor(who,hero){const L=faceLooks();if(!L)return null;
  const i=hero?alePick.hero:(aleHash(who||"?")+alePick.off),lk=L[((i%L.length)+L.length)%L.length];
  const cu=hero&&alePick.custom&&alePick.custom.you;return cu?{...lk,...cu,id:lk.id}:lk;}
/* the shirt's pattern (owner, 2026-09-07: "[partner] is busy so she cant review fashion right now but keep making a couple
   more options"; #82: "flourish, patterns, stripes, etc to differentiate"): drawn INSIDE the shirt's rounded rectangle, in a
   darker or paler take on the shirt's own colour so any shirt wears any pattern. `plain` is the default and draws nothing.
   A pack may add patterns: SHIRT_PATTERNS[id]=(g,x,y,w,h,lk)=>{...} and a row in T().patterns. */
const SHIRT_PATTERNS={
  stripes:(g,x,y,w,h,lk)=>{g.fillStyle=hexDark(lk.shirt,0.72);for(let i=1;i<=3;i++)g.fillRect(x,y+2+i*2.8,w,1.1);},
  dots:(g,x,y,w,h,lk)=>{g.fillStyle="rgba(255,255,255,.55)";for(let r=0;r<3;r++)for(let c=0;c<3;c++){g.beginPath();g.arc(x+3+c*4+(r%2)*2,y+3.5+r*3.6,0.9,0,7);g.fill();}},
  flourish:(g,x,y,w,h,lk)=>{g.fillStyle="rgba(255,255,255,.5)";[[7,4],[5,7],[9,7],[7,10],[7,7]].forEach(([dx,dy],i)=>{g.beginPath();g.ellipse(x+dx,y+dy,i<4?1.4:1,i<4?2:1,i<4?(i*Math.PI/2):0,0,7);g.fill();});
    g.fillStyle=hexDark(lk.shirt,0.7);g.beginPath();g.arc(x+7,y+7,0.8,0,7);g.fill();}};
function shirtPattern(g,lk,x,y,w,h){const f=SHIRT_PATTERNS[lk.pattern];if(!f)return;g.save();g.beginPath();g.roundRect(x,y,w,h,4);g.clip();f(g,x,y,w,h,lk);g.restore();}
function drawPerson(g,sx,sy,lk,o){
  if(lk&&lk.robot)return drawRobot(g,sx,sy,lk,o);
  o=o||{};const b=o.bob||o.idle||0,d=o.dir||"down",bh=b*0.5;
  g.fillStyle="rgba(0,0,0,.2)";g.beginPath();g.ellipse(sx+16,sy+28,8,3.5,0,0,7);g.fill();
  g.fillStyle=lk.outfit==="formal"?"#23262E":"#2E3547";
  g.fillRect(sx+11,sy+20+b,4,7);g.fillRect(sx+17,sy+20-(o.moving?b:0),4,7);
  g.fillStyle=lk.shirt;
  g.beginPath();g.roundRect(sx+9,sy+9+bh,14,13,4);g.fill();
  shirtPattern(g,lk,sx+9,sy+9+bh,14,13); /* stripes, dots, a flourish — the fashion options (#82), plain by default */
  g.strokeStyle="rgba(15,12,20,.35)";g.lineWidth=.8;g.stroke();
  if(o.moving){ /* wave-1 walk cycle: arms swing opposite the legs */
    g.fillStyle=lk.shirt;
    g.beginPath();g.roundRect(sx+6.6,sy+11.5+bh+b*0.9,2.6,6.5,1.3);g.fill();
    g.beginPath();g.roundRect(sx+22.8,sy+11.5+bh-b*0.9,2.6,6.5,1.3);g.fill();
    g.strokeStyle="rgba(15,12,20,.3)";g.lineWidth=.7;
    g.beginPath();g.roundRect(sx+6.6,sy+11.5+bh+b*0.9,2.6,6.5,1.3);g.stroke();
    g.beginPath();g.roundRect(sx+22.8,sy+11.5+bh-b*0.9,2.6,6.5,1.3);g.stroke();
  }
  if(lk.outfit==="formal"){
    g.fillStyle="#F2F1EA";g.beginPath();g.moveTo(sx+13,sy+9+bh);g.lineTo(sx+19,sy+9+bh);g.lineTo(sx+16,sy+16+bh);g.closePath();g.fill();
    g.fillStyle="#8E2F3C";g.fillRect(sx+15.2,sy+10.5+bh,1.6,5.5);
  }
  if(o.hero&&petalMoment){ /* the arm comes up with a petal; you look at it */
    g.fillStyle=lk.shirt;g.beginPath();g.roundRect(sx+21.5,sy+3+bh,2.6,9,1.3);g.fill();g.strokeStyle="rgba(15,12,20,.3)";g.lineWidth=.7;g.stroke();
    g.fillStyle=lk.skin;g.beginPath();g.arc(sx+22.8,sy+3+bh,1.5,0,7);g.fill();
    petalShape(g,sx+23.6,sy+2.4+bh,Math.PI*0.85,1.6,petalPal()[3]);}
  g.fillStyle=lk.skin;g.beginPath();g.arc(sx+16,sy+5+bh,6.5,0,7);g.fill();
  g.strokeStyle="rgba(15,12,20,.3)";g.lineWidth=.8;g.stroke();
  const st=lk.style||"cap",hx=sx+16,hy=sy+5+bh;
  /* calavera paint for EVERYONE when the season hands art("facepaint") — owner, 2026-09-07: "everyone
     should also have that, not just me... have only a number of changes - 5 perhaps". Five looks, and
     every one keeps the four marks that make a skull at this size (a Día de Muertos makeup review,
     2026-09-07): a LIGHT base over the whole face, two big dark sockets (ringed in colour or petals,
     tall ovals for the Catrina), the nose (a heart in one look), the stitched grin (a red lip line in
     one). The extras go where there is room: dots or a web on a brow the hair leaves bare, a tear under
     the eye, a dot on the chin. Never a dark base — owner: "having one with all dark is a bit of a no
     no - not really even looking like a skeleton". The hero picks; a person's look comes from who they
     are, never from where they stand. Hair and eyes go on over it. */
  const fp=faceLookFor(o.who,!!o.hero);
  const paint=()=>{const brow=["buzz","fade","bald","flat"].includes(st);
    g.save();g.beginPath();g.arc(hx,hy,6.5,0,7);g.clip();
    g.fillStyle=fp.base;g.fillRect(hx-7,hy-7,14,14);
    g.fillStyle=fp.ring;[-2.8,2.8].forEach(dx=>{if(fp.petals){for(let k=0;k<6;k++){g.beginPath();g.arc(hx+dx+Math.cos(k*Math.PI/3)*1.9,hy+0.6+Math.sin(k*Math.PI/3)*1.9,0.9,0,7);g.fill();}}
      else{g.beginPath();g.arc(hx+dx,hy+0.6,2.2,0,7);g.fill();}});
    g.fillStyle=fp.dark;[-2.8,2.8].forEach(dx=>{g.beginPath();if(fp.tall)g.ellipse(hx+dx,hy+0.7,1.5,2.1,0,0,7);else g.arc(hx+dx,hy+0.6,1.6,0,7);g.fill();}); /* the sockets */
    if(fp.nose==="heart"){g.fillStyle=fp.mark||fp.ring;g.beginPath();g.arc(hx-0.6,hy+3,0.65,0,7);g.arc(hx+0.6,hy+3,0.65,0,7);g.fill();g.beginPath();g.moveTo(hx-1.2,hy+3.2);g.lineTo(hx+1.2,hy+3.2);g.lineTo(hx,hy+4.4);g.closePath();g.fill();}
    else{g.fillStyle=fp.dark;g.beginPath();g.moveTo(hx-0.9,hy+3.9);g.lineTo(hx+0.9,hy+3.9);g.lineTo(hx,hy+2.6);g.closePath();g.fill();}
    if(fp.lip){g.fillStyle=fp.lip;g.fillRect(hx-2.6,hy+4.5,5.2,1.1);} /* the Catrina's red mouth under the stitches */
    g.fillStyle=fp.dark;g.fillRect(hx-3.2,hy+5.2,6.4,0.8);[-2.2,-0.8,0.6,2].forEach(dx=>g.fillRect(hx+dx,hy+4.6,0.6,1.9)); /* the stitched grin, always dark */
    if(fp.chin){g.fillStyle=fp.chin;g.beginPath();g.arc(hx,hy+7,0.7,0,7);g.fill();}
    if(fp.brow==="tear"){g.fillStyle=fp.mark||fp.ring;g.beginPath();g.moveTo(hx-2.8,hy+2.9);g.lineTo(hx-2.1,hy+4.2);g.lineTo(hx-3.5,hy+4.2);g.closePath();g.fill();}
    else if(brow&&fp.brow==="dots"){g.fillStyle=fp.mark||fp.ring;[-1.8,0,1.8].forEach((dx,i)=>{g.beginPath();g.arc(hx+dx,hy-3.3-(i===1?0.6:0),0.55,0,7);g.fill();});}
    else if(brow&&fp.brow==="web"){g.strokeStyle=fp.mark||fp.ring;g.lineWidth=0.5;g.beginPath();g.moveTo(hx-2.2,hy-4.6);g.lineTo(hx+2.2,hy-2.4);g.moveTo(hx+2.2,hy-4.6);g.lineTo(hx-2.2,hy-2.4);g.moveTo(hx-2.4,hy-3.5);g.lineTo(hx+2.4,hy-3.5);g.stroke();}
    g.restore();g.fillStyle=lk.hair;};
  if(fp)paint();
  /* hair v3: clipped to the actual skull, so every style fits clean */
  const inHead=fn=>{g.save();g.beginPath();g.arc(hx,hy,6.5,0,7);g.clip();g.fillStyle=lk.hair;fn();g.restore();g.fillStyle=lk.hair;};
  g.fillStyle=lk.hair;
  const capFill=(h)=>{inHead(()=>{g.fillRect(hx-7,hy-8,14,h);
    g.beginPath();g.ellipse(hx,hy-8+h,7,1.3,0,0,Math.PI);g.fill();});}; /* soft hairline, no hard bar */
  if(st==="cap"){capFill(6.2);inHead(()=>{g.fillRect(hx-7,hy-3.2,2,4.4);g.fillRect(hx+5,hy-3.2,2,4.4);});}
  else if(st==="buzz"){g.globalAlpha=.9;capFill(4.6);g.globalAlpha=1;}
  else if(st==="beard"){ /* #132. This drawing used to be called "long", and the owner was right:
    a rounded mass that CLOSES under the chin, with the face punched out of it, is the silhouette
    of a beard, not of long hair. It keeps the drawing and takes the honest name — the game had no
    beard and now does. The paint is re-stamped inside the face window so the calavera still lands
    on the jaw, with the beard framing it. */
    g.beginPath();g.roundRect(hx-8.6,hy-7.6,17.2,17.6,7);g.fill();
    g.strokeStyle="rgba(15,12,20,.3)";g.lineWidth=.8;g.stroke();
    g.fillStyle=lk.skin;g.beginPath();g.arc(hx,hy+0.4,5.7,0,7);g.fill();if(fp)paint();
    g.fillStyle=lk.hair;capFill(5.2);}
  else if(st==="long"){ /* #132, the real one: the mass stays BESIDE and BEHIND the head and falls
    past the shoulders, and the jaw is left open — that open jaw is the whole difference between
    long hair and a beard. Two lengths down the sides, wider at the bottom than at the temple so it
    hangs rather than clamps, a soft crown over the top, and a darker inner edge so the near side
    reads in front of the far one. */
    const fall=(sx)=>{g.beginPath();
      g.moveTo(hx+sx*5.4,hy-5.2);            /* temple */
      g.quadraticCurveTo(hx+sx*8.6,hy-1.2,hx+sx*8.0,hy+5.0);   /* out over the ear, then down */
      g.quadraticCurveTo(hx+sx*7.6,hy+9.4,hx+sx*5.2,hy+10.6);  /* the tip, past the jaw */
      g.quadraticCurveTo(hx+sx*4.2,hy+6.0,hx+sx*4.4,hy+0.6);   /* back up the inside, clear of the chin */
      g.quadraticCurveTo(hx+sx*4.6,hy-3.0,hx+sx*5.4,hy-5.2);g.closePath();g.fill();};
    fall(-1);fall(1);
    g.strokeStyle="rgba(15,12,20,.28)";g.lineWidth=.7;
    [-1,1].forEach(sx=>{g.beginPath();g.moveTo(hx+sx*4.5,hy+0.2);
      g.quadraticCurveTo(hx+sx*4.3,hy+6.2,hx+sx*5.2,hy+10.2);g.stroke();});
    g.fillStyle=lk.hair;capFill(6.0);}
  else if(st==="curly"){ /* v5: dense curly wreath, ear to ear, with inner volume */
    for(let a=0;a<7;a++){const ang=Math.PI*(1.0+a/6);
      g.beginPath();g.arc(hx+6.3*Math.cos(ang),hy+6.0*Math.sin(ang),3.1,0,7);g.fill();}
    for(let a=0;a<5;a++){const ang=Math.PI*(1.08+a*0.21);
      g.beginPath();g.arc(hx+3.8*Math.cos(ang),hy-1.6+3.4*Math.sin(ang),2.6,0,7);g.fill();}
    g.strokeStyle="rgba(15,12,20,.22)";g.lineWidth=.7;
    g.beginPath();g.arc(hx,hy-1.2,7.2,Math.PI*1.02,-Math.PI*0.02);g.stroke();}
  else if(st==="spiky"){capFill(4.8);
    [[-4.4,-5.2],[-1.5,-6.6],[1.5,-6.6],[4.4,-5.2]].forEach(p=>{
      g.beginPath();g.moveTo(hx+p[0]-1.4,hy+p[1]+1.6);g.lineTo(hx+p[0],hy+p[1]-2.8);g.lineTo(hx+p[0]+1.4,hy+p[1]+1.6);g.closePath();g.fill();});}
  else if(st==="pony"){capFill(6.2);
    g.beginPath();g.arc(hx+5.6,hy-4.4,1.9,0,7);g.fill();
    g.beginPath();g.roundRect(hx+6.2,hy-4.2,2.6,9,1.3);g.fill();}
  else if(st==="afro"){ /* #133 "fro is also offf". Three flat circles at one brightness read as a
    helmet, not as hair: nothing said which part was nearer the light. Rebuilt on the lessons the
    petals taught — silhouette first, then a value range. A wider crown that clears the skull on
    both sides so the outline is unmistakable; a bumpy edge so it is hair and not a dome; a lit
    cap up and left and a shadow tucked under and right, both in the hair's own colour, so it has
    a near side and a far side. */
    /* Every circle goes into ONE path so the whole crown is a single silhouette, then that one
       shape is filled with a single gradient. Shading it with overlaid blobs left a hard lens
       across the mass that read as another object sitting on the hair; a gradient has no seam
       anywhere, because there is only one fill. */
    const crown=new Path2D();
    crown.arc(hx,hy-7.0,7.1,0,7);                                  /* the mass, proud of the head — its
                                                                      lower edge clears the eyes */
    [[-6.0,-5.4,2.9],[6.0,-5.4,2.9],[-4.6,-9.8,2.8],[4.6,-9.8,2.8],[0,-11.6,2.9]]
      .forEach(p=>{crown.moveTo(hx+p[0]+p[2],hy+p[1]);crown.arc(hx+p[0],hy+p[1],p[2],0,7);});
    const gr=g.createLinearGradient(hx-6,hy-13,hx+7,hy+0);
    gr.addColorStop(0,hexLite(lk.hair,0.26));                      /* the lit side, up and to the left */
    gr.addColorStop(0.55,lk.hair);
    gr.addColorStop(1,hexDark(lk.hair,0.62));                      /* the heavy side, under and to the right */
    g.fillStyle=gr;g.fill(crown);g.fillStyle=lk.hair;
    capFill(4.2);}
  else if(st==="mohawk"){ /* shaved sides, one jagged proud crest */
    g.globalAlpha=.3;capFill(3.2);g.globalAlpha=1;
    g.beginPath();g.moveTo(hx-2.3,hy-4.4);
    g.lineTo(hx-2.7,hy-9.2);g.lineTo(hx-1.2,hy-8.2);g.lineTo(hx-0.5,hy-12.8);
    g.lineTo(hx+0.9,hy-9.6);g.lineTo(hx+1.7,hy-12);g.lineTo(hx+2.7,hy-8.2);g.lineTo(hx+2.3,hy-4.4);
    g.closePath();g.fill();
    g.strokeStyle="rgba(15,12,20,.4)";g.lineWidth=.8;g.stroke();}
  else if(st==="edgar"){ /* the Edgar: dense straight fringe, crisp line — the bar is the point */
    inHead(()=>{g.fillRect(hx-7,hy-8,14,7.3);});
    g.globalAlpha=.35;inHead(()=>{g.fillRect(hx-7,hy-0.7,2.2,3.4);g.fillRect(hx+4.8,hy-0.7,2.2,3.4);});g.globalAlpha=1;}
  else if(st==="fade"){ /* taper fade: short top, sides melting away */
    capFill(4.4);
    g.globalAlpha=.5;inHead(()=>{g.fillRect(hx-7,hy-3.6,2.4,2.6);g.fillRect(hx+4.6,hy-3.6,2.4,2.6);});
    g.globalAlpha=.22;inHead(()=>{g.fillRect(hx-7,hy-1,2.4,2.6);g.fillRect(hx+4.6,hy-1,2.4,2.6);});g.globalAlpha=1;}
  else if(st==="mullet"){ /* v7: built like "long" — mane behind the head, collar-high in the center, party tails at the shoulders */
    g.beginPath();g.roundRect(hx-8.2,hy-6.8,16.4,12,6);g.fill();
    g.beginPath();
    g.moveTo(hx-8.2,hy+2);g.lineTo(hx-8.2,hy+9.5);g.lineTo(hx-6.4,hy+7);
    g.lineTo(hx-4.6,hy+10.5);g.lineTo(hx-3.2,hy+6.5);g.lineTo(hx+3.2,hy+6.5);
    g.lineTo(hx+4.6,hy+10.5);g.lineTo(hx+6.4,hy+7);g.lineTo(hx+8.2,hy+9.5);
    g.lineTo(hx+8.2,hy+2);g.closePath();g.fill();
    g.strokeStyle="rgba(15,12,20,.3)";g.lineWidth=.8;g.stroke();
    g.fillStyle=lk.skin;g.beginPath();g.arc(hx,hy+0.4,5.7,0,7);g.fill();if(fp)paint();
    g.fillStyle=lk.hair;capFill(4.8);}
  else if(st==="broccoli"){ /* fluffy high crown, clean sides */
    [[-3.4,-6.6],[0,-8],[3.4,-6.6],[-1.8,-5.2],[1.8,-5.2],[0,-5.8]].forEach(p=>{
      g.beginPath();g.arc(hx+p[0],hy+p[1],2.7,0,7);g.fill();});
    g.globalAlpha=.3;capFill(2.6);g.globalAlpha=1;}
  else if(st==="braids"){capFill(6.6);
    const seg=(x2,k)=>{g.fillStyle=lk.hair;g.beginPath();g.roundRect(x2,hy-0.6+k*3.1,3.2,3.5,1.6);g.fill();
      g.strokeStyle="rgba(15,12,20,.35)";g.lineWidth=.7;g.stroke();
      g.fillStyle="rgba(255,255,255,.14)";g.fillRect(x2+0.7,hy+0.1+k*3.1,1,1.4);};
    for(let k=0;k<3;k++){seg(hx-8.7+(k%2?0.9:0),k);seg(hx+5.5-(k%2?0.9:0),k);}
    g.fillStyle="#C0392B";
    g.beginPath();g.arc(hx-6.9,hy+9.7,1.25,0,7);g.fill();
    g.beginPath();g.arc(hx+6.9,hy+9.7,1.25,0,7);g.fill();
    g.fillStyle=lk.hair;}
  else if(st==="flat"){capFill(3.6);
    g.fillRect(hx-6.3,hy-11.6,12.6,6);
    g.fillRect(hx-6.9,hy-6.4,1.9,2.6);g.fillRect(hx+5,hy-6.4,1.9,2.6);}
  else if(st==="buns"){capFill(5.2);
    g.beginPath();g.arc(hx-5.4,hy-7.2,3,0,7);g.fill();
    g.beginPath();g.arc(hx+5.4,hy-7.2,3,0,7);g.fill();
    g.fillStyle="#C0392B";
    g.beginPath();g.arc(hx-5.4,hy-5,1,0,7);g.fill();
    g.beginPath();g.arc(hx+5.4,hy-5,1,0,7);g.fill();}
  /* bald: nothing at all */
  if(lk.hat==="hard"){ /* hard hat crew: safety first, hair second */
    g.fillStyle="#F2C230";g.beginPath();g.arc(hx,hy-0.4,6.9,Math.PI,0);g.closePath();g.fill();
    g.fillStyle="#D9A81C";g.fillRect(hx-8,hy-0.9,16,1.9);
    g.strokeStyle="rgba(15,12,20,.35)";g.lineWidth=.8;
    g.beginPath();g.arc(hx,hy-0.4,6.9,Math.PI,0);g.stroke();
  }
  const ex=d==="left"?-2:d==="right"?2:0, ey=d==="up"?-1:1;
  /* the occasional blink, offset per person so the crowd never blinks in unison */
  if(d!=="up"&&Math.floor(Date.now()/130+sx*0.7+sy)%37!==0){
    g.fillStyle="#26202B";g.fillRect(sx+13.5+ex,sy+4.5+ey+bh,1.6,1.6);g.fillRect(sx+17+ex,sy+4.5+ey+bh,1.6,1.6);}
}
/* ---------- ALEBRIJES (asked for on 2026-09-07: the dog still looks like himself, in different
   colours and perhaps tiny wings; Pili's direction the same day) ----------
   An alebrije is a real animal in impossible colours. The first cut striped the animal and the
   owner called it "crossed out". Now, inside the animal's own alpha mask (the silhouette is
   byte-identical, and the test says so): the coat is TINTED (source-atop, 62%, the contact shadow
   clipped out), the animal's own darks are pulled back (multiply with the untreated draw, so the
   eye stays an eye), at most five small marks go where the kind has room (a spine of dots on a
   saddle, scales on a flank, the inner ears, a chevron on a wing), the tips take the accent —
   and the wingless get tiny wings behind the shoulder, two crisp frames, drawn destination-over
   so they never cross the face. Five looks, the same five on every kind, so a park full of
   critters reads as one night. Colours are content's (art("alebrije") may hand {looks:[…]});
   the engine keeps a default. */
const ALEB_DEF={looks:[
  {id:"fuego",name:{en:"Ember",es:"Fuego"},tint:"#FF6A00",pat:"#FFC300",accent:"#FF2E88",wings:true},
  {id:"cielo",name:{en:"Sky",es:"Cielo"},tint:"#00D9E8",pat:"#FFE9F2",accent:"#8A3FE8",wings:true},
  {id:"selva",name:{en:"Jungle",es:"Selva"},tint:"#7CFF3D",pat:"#12B39B",accent:"#FFC300",wings:false},
  {id:"cempasuchil",name:{en:"Marigold",es:"Cempasúchil"},tint:"#FFC300",pat:"#FF6A00",accent:"#FF2E88",wings:false},
  {id:"medianoche",name:{en:"Midnight",es:"Medianoche"},tint:"#8A3FE8",pat:"#FF2E88",accent:"#00D9E8",wings:true}]};
function alebLooks(){const a=art("alebrije",null);if(!a)return null;
  if(Array.isArray(a))return ALEB_DEF.looks.map((l,i)=>({...l,tint:a[i%a.length]||l.tint}));
  return (a.looks&&a.looks.length)?a.looks:ALEB_DEF.looks;}
/* the player's picks: one per named animal, one for the hero, an offset that shifts the crowd */
let alePick={hero:0,off:0,animals:{},custom:{}};
/* `custom` is the seam for a later editor (owner, 2026-09-07: "leave it in the architecture to have the ability to
   upgrade to customize the look of the alebrije"): custom[key] = {tint,pat,accent,wings} for an animal by name, or
   custom.you = {base,ring,dark,...} for the face — laid over the picked look's fields. Nothing writes it yet. */
try{const a0=JSON.parse(localStorage.getItem(SK("ale"))||"{}");if(a0&&typeof a0==="object")alePick={hero:a0.hero|0,off:a0.off|0,animals:(a0.animals&&typeof a0.animals==="object")?a0.animals:{},custom:(a0.custom&&typeof a0.custom==="object")?a0.custom:{}};}catch(e){}
function alePersist(){mqStore(SK("ale"),JSON.stringify(alePick));}
const aleHash=str=>{let h=2166136261>>>0;for(let i=0;i<String(str).length;i++){h^=String(str).charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
function alebLookFor(kind,name){const L=alebLooks();if(!L)return null;
  const k=name||kind,i=alePick.animals[k]!==undefined?alePick.animals[k]:(aleHash(k)+alePick.off),lk=L[((i%L.length)+L.length)%L.length];
  const cu=alePick.custom&&alePick.custom[k];return cu?{...lk,...cu,id:lk.id}:lk;}
const wildTmp={a:null,b:null};
function wildScratch(which,W,H){let c=wildTmp[which];if(!c||c.width!==W||c.height!==H){c=wildTmp[which]=document.createElement("canvas");c.width=W;c.height=H;}return c;}
/* the marks each kind has room for, and where its wings root; cx is the sprite's centre column */
const ALEB_KIND={
  beagle:{wings:[[-1.5,15],[-3.5,18]],eye:[7.6,15.2,3.0],marks:(g,l,cx,sy)=>{g.fillStyle=l.pat;for(let i=0;i<4;i++){g.beginPath();g.arc(cx-4+i*2,sy+16.4,0.55,0,7);g.fill();}
    g.fillStyle=l.accent;g.fillRect(cx+3.4,sy+19.4,1.6,1.4);}}, /* spine on the saddle, the ear tip */
  lab:{wings:[[-1.5,13.5],[-3.5,16.5]],eye:[9,13.5,2.8],marks:(g,l,cx,sy)=>{g.strokeStyle=l.pat;g.lineWidth=0.8;[18,21].forEach((yy,r)=>{for(let i=0;i<3;i++){g.beginPath();g.arc(cx-5+i*3+(r?1.5:0),sy+yy,1.2,Math.PI,0);g.stroke();}});
    g.fillStyle=l.accent;g.fillRect(cx+3,sy+15.8,2,1.6);}}, /* scales on the flank, the ear tip */
  chi:{wings:[[-1,17],[-2.5,19.5]],small:true,eye:[5.9,15,2.8],marks:(g,l,cx,sy)=>{g.fillStyle=l.accent;g.fillRect(cx+2.4,sy+10.6,1.4,1.6);g.fillRect(cx+7,sy+10.2,1.4,1.6);
    g.fillStyle=l.pat;g.beginPath();g.arc(cx+3.1,sy+9.9,0.45,0,7);g.arc(cx+7.7,sy+9.5,0.45,0,7);g.fill();}}, /* the ears only */
  dog:{wings:[[-1,13.5],[-3,16.5]],eye:[12.1,13.8,2.6],marks:(g,l,cx,sy)=>{g.fillStyle=l.pat;g.beginPath();g.arc(cx-3,sy+18,2.4,0,7);g.fill();g.beginPath();g.arc(cx+3.4,sy+20.6,1.9,0,7);g.fill();
    g.fillStyle=l.accent;g.beginPath();g.arc(cx-9.6,sy+16.5,1.2,0,7);g.fill();}}, /* the merle patches, the tail tip */
  cat:{wings:[[-1.5,17],[-3.5,20]],eye:[6.9,17.1,3.2],marks:(g,l,cx,sy)=>{g.fillStyle=l.pat;g.fillRect(cx-4.5,sy+18.5,1.8,6);g.fillRect(cx-1,sy+18.5,1.8,6);
    g.fillStyle=l.accent;g.beginPath();g.arc(cx+4.2,sy+12.4,0.8,0,7);g.arc(cx+8.6,sy+12.6,0.8,0,7);g.fill();}}, /* the two bars, the ear tips */
  gato:{wings:[[-1.5,17],[-3.5,20]],eye:[6.9,17.1,3.2],marks:(g,l,cx,sy)=>{g.fillStyle=l.pat;g.fillRect(cx-4.5,sy+18.5,1.8,6);g.fillRect(cx-1,sy+18.5,1.8,6);
    g.fillStyle=l.accent;g.beginPath();g.arc(cx+4.2,sy+12.4,0.8,0,7);g.arc(cx+8.6,sy+12.6,0.8,0,7);g.fill();}},
  pigeon:{eye:[4.35,18.25,2.2],marks:(g,l,cx,sy)=>{g.strokeStyle=l.pat;g.lineWidth=0.9;g.beginPath();g.moveTo(cx-3.5,sy+21.5);g.lineTo(cx-1.5,sy+20);g.lineTo(cx+0.5,sy+21.5);g.stroke();}}, /* one chevron */
  loro:{tint:0.75,eye:[0.6,4.9,2.2],marks:(g,l,cx,sy)=>{g.strokeStyle=l.pat;g.lineWidth=0.9;[16,19].forEach(yy=>{g.beginPath();g.moveTo(cx-1.3,sy+yy+1);g.lineTo(cx,sy+yy);g.lineTo(cx+1.3,sy+yy+1);g.stroke();});}},
  butterfly:{tint:0.95,marks:(g,l,cx,sy)=>{g.fillStyle=l.pat;g.beginPath();g.arc(cx-2.6,sy+11.5,1,0,7);g.arc(cx+2.6,sy+11.5,1,0,7);g.fill();}}, /* an eye on each upper wing */
  colibri:{eye:[3.6,10.2,2.2],marks:(g,l,cx,sy)=>{g.fillStyle=l.accent;g.beginPath();g.arc(cx+3,sy+10.6,1.5,0,7);g.fill();}} /* the gorget */
};
/* hexDark multiplies toward black, which is right for a shadow and useless for a highlight:
   a near-black hair times 1.3 is still near-black. hexLite mixes toward white instead, so the
   lit side of dark hair actually lifts (#133). */
const hexLite=(h,f)=>{const n=parseInt(String(h).slice(1),16);if(isNaN(n))return h;
  const m=c=>Math.round(c+(255-c)*f);return "rgb("+m((n>>16)&255)+","+m((n>>8)&255)+","+m(n&255)+")";};
const hexDark=(h,f)=>{const n=parseInt(String(h).slice(1),16);if(isNaN(n))return h;return "rgb("+(((n>>16)&255)*f|0)+","+(((n>>8)&255)*f|0)+","+((n&255)*f|0)+")";};
function wildWings(g,l,K,cx,sy,small){ /* cut-paper wings, not feathers (Pili, 2026-09-07, after the owner's "wings look off"): a hindwing
  behind and a forewing over it, rooted at the shoulder just behind the head, swept back, big enough to break the silhouette —
  a wing that does not is a smudge. The accent filled flat, a darker edge all the way round, ribs in the pattern colour, three
  bites out of the trailing edge. Two frames: the flap folds the wing, it does not shrink it. */
  const fl=(Math.floor(Date.now()/110)&1),sc=(small?0.7:1)*1.3,edge=hexDark(l.accent,0.5);
  const wing=(dx,dy,fore)=>{g.save();g.translate(cx+dx*sc,sy+dy);g.rotate((fore?0.44:0.96)+(fl?0.15:0.55)); /* positive lifts the tip: back and UP, never into the legs */g.scale(sc,sc*(fl?0.45:1));
    g.beginPath();
    if(fore){g.moveTo(0,0);g.quadraticCurveTo(-3,-5,-8,-4.5);g.quadraticCurveTo(-5.5,-1.2,0,0);}            /* pointed tip */
    else{g.moveTo(0,0);g.quadraticCurveTo(-2.5,-3.6,-5.5,-3);g.quadraticCurveTo(-6.4,-1.4,-5,-0.3);g.quadraticCurveTo(-2.5,0.6,0,0);} /* rounded tip */
    g.closePath();g.fillStyle=l.accent;g.fill();g.lineWidth=1.2;g.strokeStyle=edge;g.stroke();
    g.strokeStyle=l.pat;g.lineWidth=0.7;g.globalAlpha=0.6;g.beginPath();
    (fore?[[-7.5,-4.2],[-6.5,-2.4],[-4.5,-1.2]]:[[-5,-2.6],[-4.5,-1.3]]).forEach(p=>{g.moveTo(-0.5,-0.3);g.lineTo(p[0],p[1]);});g.stroke();g.globalAlpha=1;
    g.fillStyle=edge;(fore?[[-6.5,-3],[-4.75,-1.75],[-2.5,-0.75]]:[[-2.5,0.2]]).forEach(p=>{g.beginPath();g.arc(p[0],p[1],0.9,0,7);g.fill();});
    g.restore();};
  wing(K[1][0],K[1][1],false);wing(K[0][0],K[0][1],true);}
function wildDraw(g,look,kind,fn,sx,sy,face){
  const T=g.getTransform(),x0=sx-6,y0=sy-12,BW=44,BH=44,W=Math.ceil(BW*T.a),H=Math.ceil(BH*T.d);
  const t=wildScratch("a",W,H),u=wildScratch("b",W,H),tg=t.getContext("2d"),ug=u.getContext("2d");
  const M=()=>[T.a,T.b,T.c,T.d,-(T.a*x0+T.c*y0),-(T.b*x0+T.d*y0)];
  tg.setTransform(1,0,0,1,0,0);tg.clearRect(0,0,W,H);tg.setTransform(...M());
  fn(tg); /* the animal, untreated */
  ug.setTransform(1,0,0,1,0,0);ug.clearRect(0,0,W,H);ug.drawImage(t,0,0); /* a copy of its own darks */
  const KD=ALEB_KIND[kind]||{},cx=sx+16;
  tg.save();tg.globalCompositeOperation="source-atop"; /* A: tint the coat, the shadow clipped out */
  tg.beginPath();tg.rect(x0,y0,BW,25+sy-y0);tg.clip();tg.globalAlpha=KD.tint||0.62;tg.fillStyle=look.tint;tg.fillRect(x0,y0,BW,BH);tg.restore();
  { /* B: the eye stays an eye — the animal's own darks pulled back by a multiply on the colour
       channels only. Done per pixel rather than with the "multiply" composite, which also thickens
       every anti-aliased edge and so moves the silhouette; the alpha channel is not touched. */
    const im=tg.getImageData(0,0,W,H),d=im.data,o=ug.getImageData(0,0,W,H).data;
    for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;d[i]=d[i]*(0.55+0.45*o[i]/255);d[i+1]=d[i+1]*(0.55+0.45*o[i+1]/255);d[i+2]=d[i+2]*(0.55+0.45*o[i+2]/255);}
    tg.save();tg.setTransform(1,0,0,1,0,0);tg.putImageData(im,0,0);tg.restore();}
  if(KD.marks){tg.save();tg.globalCompositeOperation="source-atop";tg.translate(cx,0);tg.scale(face||1,1);tg.translate(-cx,0);KD.marks(tg,look,cx,sy);tg.restore();} /* C: five marks at most */
  if(KD.eye){ /* C½: colour round the eyes (owner: "the color can be added like around the eyes or something") — two rings, the accent and
       a thinner one in the pattern colour outside it (Pili: two rings is the alebrije look, one is a bruise), centred ON the eye
       and wider than it, so the pupil stays a pupil; inside the silhouette like everything else */
    const[ex,ey,er]=KD.eye;tg.save();tg.globalCompositeOperation="source-atop";tg.translate(cx,0);tg.scale(face||1,1);tg.translate(-cx,0);
    tg.lineWidth=1.6;tg.globalAlpha=0.9;tg.strokeStyle=look.accent;tg.beginPath();tg.arc(cx+ex,sy+ey,er,0,7);tg.stroke();
    tg.lineWidth=0.7;tg.globalAlpha=0.6;tg.strokeStyle=look.pat;tg.beginPath();tg.arc(cx+ex,sy+ey,er+1.1,0,7);tg.stroke();tg.restore();}
  if(look.wings&&KD.wings){tg.save();tg.globalCompositeOperation="destination-over";tg.translate(cx,0);tg.scale(face||1,1);tg.translate(-cx,0);wildWings(tg,look,KD.wings,cx,sy,KD.small);tg.restore();} /* D: wings behind */
  g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(t,T.e+T.a*x0+T.c*y0,T.f+T.b*x0+T.d*y0);g.restore();
}
const wild=(fn,ai,kind,faceOf)=>function(g,...a){const L=alebLooks();if(!L)return fn(g,...a);
  const cr=ai?a[0]:null,look=alebLookFor(cr&&cr.kind||kind,cr&&cr.name);if(!look)return fn(g,...a);
  return wildDraw(g,look,cr&&cr.kind||kind,tg=>fn(tg,...a),a[ai],a[ai+1],faceOf?faceOf(cr):1);};
drawDog=wild(drawDog,0,"dog",()=>DOG.face);drawCat=wild(drawCat,0,"cat",()=>CAT.face);drawPigeon=wild(drawPigeon,0,"pigeon",()=>PIG.face);drawLoro=wild(drawLoro,0,"loro",()=>1);
drawBeagle=wild(drawBeagle,1,"beagle",c=>c.face);drawLab=wild(drawLab,1,"lab",c=>c.face);drawChi=wild(drawChi,1,"chi",c=>c.face);drawGato=wild(drawGato,1,"gato",c=>c.face);
drawButterfly=wild(drawButterfly,1,"butterfly",c=>c.face);drawColibri=wild(drawColibri,1,"colibri",c=>c.face);
/* ---------- movement ---------- */
const DIRS={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
/* One quarter-turn of the camera, as a rename of the four directions. */
const TURN={up:"left",left:"down",down:"right",right:"up"};
/* The 3D camera can be turned; the grid cannot. Input is screen-space intent ("I
   swiped up"), so it must be rotated into a WORLD direction by the camera's current
   quarter-turn — otherwise "up" keeps walking north no matter where you are standing.
   engine.js referenced T3 exactly zero times before this, which was the whole bug.
   Bare identifier on purpose: T3 is a top-level const in engine3d.js, so it is a
   lexical global and NOT a property of window — a `window.T3` guard reads undefined
   and fails silently. No-op in the 2D cameras and if 3D never initialised. */
function worldDir(d){
  if(camMode!=="3d"||typeof T3==="undefined"||!T3||T3.fail)return d;
  let q=((Math.round(T3.yaw/(Math.PI/2))%4)+4)%4;
  while(q-->0)d=TURN[d];
  return d;
}
function tryStep(){
  if(moving||!held||RIDE.on)return;   /* you cannot walk off a moving tram */
  if(performance.now()<warpT)return;
  /* `dir` becomes the WORLD direction, so sprite facing and the move interpolation
     at the bottom of loop() (which reads DIRS[dir]) stay in step with the actual move. */
  dir=worldDir(held);const[dx,dy]=DIRS[dir],nx=px+dx,ny=py+dy;
  if(isSolid(nx,ny)){
    const w=CW();
    const ch=(ny>=0&&ny<w.H&&nx>=0&&nx<w.W)?w.rows[ny][nx]:"#";
    const F=T().flavor;
    if(F[ch]&&Date.now()-lastBump>1800){lastBump=Date.now();
      toast(F[ch][Math.floor(Math.random()*F[ch].length)],2000);}
    return;
  }
  kickProp(nx,ny,dx,dy); /* a cone is a thing you nudge with a foot, not a wall to go around */
  moving=true;mt=0;px=nx;py=ny;
}
/* A door is checked whenever you are STANDING on it, not only on the frame a step ends.
   Before this, walking out of HQ and straight back in was swallowed: the step ended
   inside portalT's 900ms anti-ping-pong window, the tile was rejected once and never
   looked at again, and the door ignored you until you stepped off and back on.
   Ping-pong is still impossible: a warp records the tile it set you down on in
   portalHold, and that tile is ignored until you leave it — so this holds even for a
   pack whose doorstep IS a portal tile (validateWorlds only warns about that).
   Y, the trolley stop, deliberately stays step-only: a menu you dismissed must not
   reopen under your feet. Returns true if it warped. */
/* ---------- arriving somewhere ----------
   There are TWO ways the world changes under you: a door (tryPortal) and the trolley
   (openTravel). Everything that must happen on arrival lives here, in one place, because when it
   did not, the trolley quietly skipped it — you rode from Meridian Street to Calle Dos and the dog
   you had been walking with was still standing at the stop, still set to follow. */
/* ---------- THE DOORWAY (owner, 2026-09-17: "i think i want that option A") ----------
   `tryPortal` changed the world between one frame and the next — four assignments, no transition of
   any kind — and `worldArrived` then froze input for 450 milliseconds with NOTHING DRAWN in that
   window. The worst pairing available: an instant cut, and then standing still somewhere you did not
   walk to. The transition slot was there the whole time and it was empty.

   A cut with a reason reads as a cut; a cut with nothing in it reads as a bug. So the swap happens
   BEHIND a shut door, and the door opens in the direction you travelled — the movement is what says
   what happened, and it needs no words in either language.

   It is a DIV over the viewport, not paint on a canvas, for one reason worth writing down: the 3D
   camera renders to its own WebGL surface, so anything drawn into the 2D context is invisible there.
   One overlay covers all four cameras and cannot drift between them. `curtain()` above already
   proved the shape on the growth change (the owner, 2026-09-03: "a building appears ... not a smooth
   switch") — this is the same idea at a door, and faster, because you are walking.

   130ms to shut, 330 to open. Input is held for exactly as long as the door is moving and not one
   frame more, which is why worldArrived's 450 became the open: the old number outlasted the (absent)
   animation by a third of a second of standing still. */
const DOORMS={shut:110,hold:35,open:330};   /* hold: the swap waits 35ms past the shut, or it lands on a door that is still fifteen pixels open — measured, not guessed */
function doorSet(cls,ms){const d=$("door");if(!d)return null;
  d.style.setProperty("--doorT",(ms|0)+"ms");d.className=cls||"";void d.offsetWidth;return d;} /* the reflow is load-bearing: without it the browser coalesces the two writes and nothing moves */
/* BACK TO THE WINGS WITH THE TRANSITION OFF. Dropping the class re-applies each leaf's resting
   transform, and the bottom leaf's rest is BELOW the screen — so after a travelling-up door had
   finished opening, clearing it sent that leaf sliding back down across the whole viewport: a black
   band sweeping over the new place a third of a second after you arrived. Caught by the guard, on
   the frame trace, not by reading the rule. 0ms, and they snap back where nobody can see them. */
function doorRest(){doorSet("",0);}
function doorShut(){doorRest();doorSet("shut",DOORMS.shut);}
function doorOpen(kind){doorSet("shut",0);doorSet("open-"+(kind||"flat"),DOORMS.open);
  setTimeout(()=>{if($("door")&&/^open-/.test($("door").className))doorRest();},DOORMS.open+80);}
/* WHICH WAY YOU WENT, read off the map rather than off a label somebody typed. The tile you stepped
   ON says it: `▲` is the head of a climbing flight, `▼` is the foot of a well. Everything else is a
   door on the flat — including the avenue door into Nolasco's stair room, which is right: you have
   walked in off the street and not climbed anything yet. The climb is the five treads in front of
   you, and it is yours to walk. */
function doorKind(fromW,fromX,fromY){
  const a=WORLDS[fromW],g=a&&a.rows[fromY]&&a.rows[fromY][fromX];
  return g==="\u25B2"?"up":g==="\u25BC"?"down":"flat";}
function worldArrived(fromW,fromX,fromY){
  warpT=performance.now()+DOORMS.open;portalT=performance.now()+900;portalHold=world+":"+px+","+py;
  save();destCheck();{const ar=T().arrive[world];toast(typeof ar==="function"?ar():ar,2200);} /* a line may ask the season (Nacho, 2026-09-07) */
  propsReset();                    /* "they'll just reappear when i leave the screen" — the owner's scope */
  dogsFollow(fromW,fromX,fromY);   /* a dog at your heels comes with you */
  dogsRoam(world);                 /* unseen pups drift toward their favorite townsperson */
}
let warpPend=null;   /* a door that is shutting; the world swaps behind it */
function tryPortal(ts){
  const key=world+":"+px+","+py;
  if(portalHold&&portalHold!==key)portalHold="";
  if(warpPend){                                  /* the swap waits for the door, and for nothing else */
    if(ts<warpPend.at)return true;
    const q=warpPend;warpPend=null;
    world=q.p.to;px=fx=q.p.x;py=fy=q.p.y;held=null;dir=q.p.dir||"down";
    worldArrived(q.fromW,q.fromX,q.fromY);roomInvite();
    if(q.fromW===PL.park&&world!==PL.park)parkExit(); /* crossing back over the rainbow: the recap */
    /* BUILD THE NEW PLACE WHILE THE DOOR IS STILL SHUT. There is exactly one 3D scene (T3.builtKey)
       and changing world throws it away and makes another, and the first frame after that has to
       upload the geometry as well as draw it. Traced on 2026-09-17: in the flat cameras the leaves
       slide the whole way at frame rate, and in 3D there was a 237ms hole right after the swap
       during which the top leaf jumped from -5 to -154 — the door did not open, it vanished. The
       stall is real work and it is not going away; what it must not do is eat the animation. So it
       happens here, behind a closed door, which is the entire job a closed door has ever had, and
       the open starts on the next clean frame.
       ❗ This is also the measurement behind the memory question: cache the built scenes and the
       stall goes with them (docs/ARCH-LOG.md A16). */
    let started=false;
    const go=()=>{if(started)return;started=true;
      warpT=performance.now()+DOORMS.open;   /* input comes back when the DOOR is open, not when a guess says it should be — the stall above is unpredictable and worldArrived cannot know how long it took */
      doorOpen(q.kind);};
    if(camMode==="3d"&&typeof draw3d==="function"&&window.THREE){try{draw3d();}catch(e){}}
    if(typeof requestAnimationFrame==="function")requestAnimationFrame(go);else go();
    setTimeout(go,80);                               /* a tab that is not animating still opens its doors */
    return true;}
  const pp=portalAt(world,px,py);
  if(portalHold||ts<=portalT||!pp)return false;
  const p=pp,fromW=world,fromX=px,fromY=py;
  warpT=ts+DOORMS.shut+DOORMS.hold;              /* you cannot walk while the door is closing on you */
  warpPend={p,fromW,fromX,fromY,kind:doorKind(fromW,fromX,fromY),at:ts+DOORMS.shut+DOORMS.hold};
  doorShut();
  return true;
}
let last=0;
function loop(ts){
  /* ASK FOR THE NEXT FRAME FIRST. It used to be the last statement of this function, which meant
     the game only kept running when nothing went wrong: measured, one frame that threw ticked once
     more and then stopped forever, and it did not come back when the faulty code was taken away.
     Not a dropped frame — the screen, until a reload. Nothing in either pack is known to throw in
     here today, so this is not a bug players are hitting; it is what decides the PRICE of every
     future one. Re-armed first, a fault is a glitch. Re-armed last, every fault is fatal.
     It is safe to arm first because this function has no early return on any path, `last` is still
     written before anything reads it, and there are exactly two requestAnimationFrame call sites in
     the repo (here and the boot arm) with no cancelAnimationFrame anywhere — so nothing can
     double-schedule and nothing reorders. Measured identical frame rates before and after. */
  requestAnimationFrame(loop);
  const dt=Math.min(50,ts-last);last=ts;
  /* the street bearing follows the camera's own swing, so it is a frame job, not an event job.
     It writes to the DOM only when the pill actually moved — see bearingUI. */
  if(typeof bearingUI==="function")bearingUI();
  if(moving){
    mt+=dt/240;bob+=dt/70;
    if(mt>=1){moving=false;fx=px;fy=py;petalDrop(world,px,py,HEROFEET);
      if(tryPortal(ts)){}
      else if(troIsStop(world,px,py)&&ts>portalT){portalT=performance.now()+900;held=null;openTravel();}
      else{save();checkTalk();destCheck();tryStep();}
    }
    else{const[dx,dy]=DIRS[dir];fx=px-dx*(1-mt);fy=py-dy*(1-mt);}
  }else if(!tryPortal(ts))tryStep(); /* standing on a door whose cooldown just ran out: go through */
  petalMomentTick(dt);
  troTick(dt);
  dogUpdate(dt,ts);catUpdate(dt,ts);pigUpdate(dt,ts);loroTick(ts);critUpdate(dt,ts);ballUpdate(dt,ts);dogThingsUpdate(dt,ts);wanderUpdate(dt);fredCheck();
  /* The world keeps thinking behind a panel — the dog walks, the trolley comes, petals fall — so
     nothing jumps when you put the paper down. It is not DRAWN, though: measured at 215 frames in
     six seconds with a document covering the screen, every one of them at full device resolution
     and none of them visible. On a phone that is battery and heat for pixels nobody sees.
     The moment the cover lifts, whatever the street said while you were reading is said now. */
  const covered=worldCovered();
  if(covered!==wasCovered){
    wasCovered=covered;
    if(!covered&&toastHeld.length){const held=toastHeld;toastHeld=[];
      setTimeout(()=>held.forEach(([m,d,c],i)=>setTimeout(()=>toast(m,d,c),i*120)),260);}
  }
  if(!$("world").hidden&&!covered)draw();
}
/* the door marker — the third door affordance (owner, 2026-09-02: "i think we should have a
   marker"). Within three steps of a door that LEADS somewhere, a bouncing arrow floats over
   it in every camera. Doors that are only decoration (no portal) get nothing. */
/* Everything a document may read, handed over as plain data so a pack never reaches into
   engine internals — and so [partner]'s pack can build entirely different paper from the same play. */
function docCtx(){
  const L=CHS(),d=new Date(),p2=n=>String(n).padStart(2,"0");
  return {
    hero:heroName, lang,
    dateStr:d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate()),
    decisions:dlog.map(e=>({quest:e.quest,qi:e.qi,npc:e.npc,ask:e.ask,pick:e.pick,
                            concept:e.concept,why:e.why,result:e.result})),
    done:[...done], marks:{...marks}, handed:[...handedDocs],
    districts:L.map((c,i)=>({id:c.id,quests:(c.quests||[]).slice(),need:c.need,
      closed:chSeen>i, grade:gradeOf(c),
      role:c.role&&(c.role[lang]||c.role.en), industry:c.industry&&(c.industry[lang]||c.industry.en)})),
  };
}
/* sections → the page, and → markdown, from ONE description. Two renderers that can
   disagree are two documents. */
/* A document is named one of two ways: an id into the pack's DOCS (shared paper — a poster,
   the file on the desk), or the document itself, written where it is used (a one-off artifact a
   character hands over and nobody else ever sees). Everything downstream goes through here, so
   neither kind is a special case. */
function docDef(id){return id&&typeof id==="object"?id:(DC()[id]||null);}
function docSections(id){const d=docDef(id);if(!d||typeof d.build!=="function")return null;
  try{return d.build(docCtx())||[];}catch(e){console.warn("DOC: "+id+" failed to build",e);return [];}}
function docTitle(id){const d=docDef(id)||{};return (d.title&&(d.title[lang]||d.title.en))||(typeof id==="string"?id:"");}
function docMarkdown(id){
  const secs=docSections(id);if(!secs)return "";
  const d=docDef(id)||{},out=["# "+docTitle(id)];
  const sub=d.sub&&(d.sub[lang]||d.sub.en);if(sub)out.push("*"+sub+"*");
  if(d.tmpl)out.push("",(DCU().tmplLb?DCU().tmplLb(d.tmpl):"Template "+d.tmpl)+" · docs/templates/");
  out.push("");
  secs.forEach(s2=>{
    if(s2.h)out.push("## "+s2.h,"");
    else if(s2.p)out.push(s2.p,"");
    else if(s2.note)out.push("> "+s2.note,"");
    else if(s2.blank)out.push("**"+s2.blank+":** ___","");
    else if(s2.kv)out.push(...s2.kv.map(r=>"- **"+r[0]+":** "+(r[1]||"___")),"");
    else if(s2.t){out.push("| "+s2.t.head.join(" | ")+" |","|"+s2.t.head.map(()=>"---").join("|")+"|",
      ...s2.t.rows.map(r=>"| "+r.map(c=>String(c==null?"":c).replace(/\|/g,"\\|")).join(" | ")+" |"),"");}
    else if(s2.q){const q=s2.q;
      out.push("**"+q.ask+"**","",
        "> "+q.pick+(q.tries>1?"  _("+q.tries+" tries)_":""),"",
        (q.concept?"*"+q.concept+"* — ":"")+(q.why||""),"");}
    else if(s2.docs)out.push(...s2.docs.map(k=>"- "+docTitle(k)),"");
  });
  return out.join("\n");
}
/* THE READER'S BLOCKS, in one place, so the reader and the suite walk the same path. Lifted out
   of docOpen 2026-09-11 to add `art`: until then a pack could put WORDS in front of a person and
   nothing else, so the biggest picture this game could show was a 32-pixel tile seen from twelve
   tiles back. The owner: "you see tiles/icons from afar but you get close and can interact to see
   it full screen- then thats how pixels/art can be used there by agents."
   A block the reader does not know is skipped, exactly as before. */
function docRender(body,secs){
  const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;
    if(txt!==undefined)n.textContent=txt;body.appendChild(n);return n;};
  secs.forEach(s2=>{
    if(s2.art&&typeof s2.art==="function"){ /* A DRAWING. The pack draws; the engine never learns
       what is on it — the same bargain as TILEART and DECOART. It gets a real canvas at the width
       the reader actually has, because a picture worth walking up to must not be a thumbnail. */
      if(s2.h)el("h3","dh",s2.h);
      const cv=document.createElement("canvas");cv.className="dart";
      /* docOpen renders while the reader is still HIDDEN, and a hidden element's clientWidth is 0 —
         so the old `||520` fallback invented a width nobody has and every picture hung 100-190px off
         the right of its column, in both packs, for anyone who opened a document. Ask the column,
         then the reader, then the window, and take the first that is a real number. The CSS cap
         below is the belt: whatever this arithmetic decides, the drawing can never outgrow its box. */
      const room=(body.clientWidth||(body.parentElement&&body.parentElement.clientWidth)||
                  (document.documentElement&&document.documentElement.clientWidth)||520);
      /* ---- A PICTURE MAY BE WIDER THAN THE PAGE, AND YOU WALK ALONG IT ----
         The owner, 2026-09-12, on the crew's wall: "you get what a mural is right? this isnt going to
         be pages." A mural is one surface you walk along; a mural that fits in a phone column is a
         postcard. So a section may declare `wide` — a natural width in CSS pixels, or a function that
         returns one — and it is drawn at that width inside its own horizontal scroller instead of
         being squeezed into the column. Everything else in the reader is unchanged: a section with no
         `wide` is fitted to the column exactly as it always was.
         This is a RULE and not one town's mural: any pack with a long diagram, a timeline or a
         panorama wants it, and the alternative is every such pack inventing its own scroller. */
      const natural=(typeof s2.wide==="function")?s2.wide():(typeof s2.wide==="number"?s2.wide:0);
      const wide=natural>0&&natural>room-8;
      const W=wide?Math.round(natural):Math.max(240,Math.min(560,room-8));
      /* `aspect` may be a FUNCTION of the width. A picture whose shape depends on how wide it is
         drawn — a wall that reflows to two patches across on a phone and four on a laptop — cannot
         state its height as a constant, and the alternative is a pack reaching into the reader to
         measure the column itself. A number still means exactly what it meant. */
      const A=(typeof s2.aspect==="function")?s2.aspect(W):s2.aspect;
      const H=Math.round(W*((typeof A==="number"&&isFinite(A)&&A>0?A:0.55)));
      const K=Math.min(3,window.devicePixelRatio||1);
      cv.width=W*K;cv.height=H*K;cv.style.width=W+"px";cv.style.height=H+"px";
      cv.style.display="block";cv.style.margin="10px auto";cv.style.borderRadius="6px";
      /* ---- A PICTURE MAY TAKE THE POINTER: `grab` ----
         A drawing you push with your thumb is not a drawing you scroll past, and on a phone those
         two readings of the same downward swipe cannot both win. The browser resolves it from
         `touch-action`, and `.dart` declares none in either shell — so a gesture surface that does
         not say so loses every vertical drag to the paper's scroller and the player never reaches it.
         This is opt-in and must stay opt-in: the town's wall is thirty-odd pictures you scroll past,
         and an engine that took the pointer from all of them would wall the page off behind them.
         A section that says `grab:true` is saying "this one is worked, not read". */
      if(s2.grab){cv.style.touchAction="none";cv.style.cursor="grab";cv.setAttribute("tabindex","0");}
      if(wide){cv.style.maxWidth="none";cv.style.margin="10px 0";}
      else{cv.style.maxWidth="100%";cv.style.height="auto";}   /* it may be smaller than asked. It may never be wider than the column */
      const g=cv.getContext("2d");g.setTransform(K,0,0,K,0,0);g.imageSmoothingEnabled=false;
      try{s2.art(g,W,H);}catch(e){if(typeof mqwarn==="function")mqwarn("docart",String((e&&e.message)||e),false);}
      if(wide){const box=document.createElement("div");
        box.style.overflowX="auto";box.style.overflowY="hidden";box.style.maxWidth="100%";
        box.style.webkitOverflowScrolling="touch";box.style.borderRadius="6px";
        box.setAttribute("tabindex","0");                 /* a keyboard can walk the wall too */
        box.appendChild(cv);body.appendChild(box);}
      else body.appendChild(cv);
      if(s2.cap)el("p","dnote",s2.cap);
    }
    else
    if(s2.h)el("h3","dh",s2.h);
    else if(s2.p)el("p","dp",s2.p);
    else if(s2.note)el("p","dnote",s2.note);
    else if(s2.red)el("p","dred",s2.red); /* critical, in red — El Portero's sheet, the teller's category (#8) */
    else if(s2.blank){const r=el("p","dblank");
      r.innerHTML='<b></b> <span class="dline"></span>';r.querySelector("b").textContent=s2.blank+":";}
    else if(s2.kv){const t=el("div","dkv");
      s2.kv.forEach(row=>{const k=document.createElement("b"),v=document.createElement("span");
        k.textContent=row[0];v.textContent=row[1]||"—";t.appendChild(k);t.appendChild(v);});}
    else if(s2.t){const tb=document.createElement("table");tb.className="dtable";
      const hr=tb.insertRow();s2.t.head.forEach(h=>{const th=document.createElement("th");th.textContent=h;hr.appendChild(th);});
      s2.t.rows.forEach(r=>{const tr=tb.insertRow();r.forEach(c=>{const td=tr.insertCell();td.textContent=c==null?"":String(c);});});
      body.appendChild(tb);}
    else if(s2.q){const q=s2.q,w=el("div","dq"+(q.r==="ok"?" ok":q.r==="mid"?" mid":" bad"));
      const a=document.createElement("b");a.textContent=q.ask;w.appendChild(a);
      const pk=document.createElement("p");pk.className="dpick";
      pk.textContent=q.pick+(q.tries>1?"  ("+q.tries+")":"");w.appendChild(pk);
      if(q.why){const wy=document.createElement("p");wy.className="dwhy";
        wy.textContent=(q.concept?q.concept+" — ":"")+q.why;w.appendChild(wy);}}
    else if(s2.btn){ /* a button a pack's document may carry (the town's Done, its requests) —
       the reader never knows what it does; content does, and content is never Markdown-exported */
      const b=document.createElement("button");b.className="dbtn";b.type="button";b.textContent=s2.btn;
      b.addEventListener("click",()=>{try{if(typeof s2.run==="function")s2.run();}catch(err){console.warn("DOC: button failed",err);}});
      body.appendChild(b);}
    else if(s2.sel){ /* a dropdown a pack's document may carry (the town's filter and sort):
       a label, options (optionally grouped), the current value; content runs the change */
      const lab=el("label","dsel");lab.appendChild(document.createTextNode(s2.sel+" "));
      const se=document.createElement("select");const groups={};
      (s2.opts||[]).forEach(o=>{const op=document.createElement("option");op.value=String(o.v);op.textContent=String(o.t===undefined?o.v:o.t);
        if(String(o.v)===String(s2.value===undefined?"":s2.value))op.selected=true;
        if(o.g){if(!groups[o.g]){groups[o.g]=document.createElement("optgroup");groups[o.g].label=o.g;se.appendChild(groups[o.g]);}groups[o.g].appendChild(op);}
        else se.appendChild(op);});
      se.addEventListener("change",()=>{try{if(typeof s2.run==="function")s2.run(se.value);}catch(err){console.warn("DOC: select failed",err);}});
      lab.appendChild(se);body.appendChild(lab);}
    else if(s2.form){ /* a form a pack's document may carry (mq-v76): fields — text, password, area,
       select, checks — a submit and a cancel. The reader collects the values; content acts. Every
       field is on one screen beside the paperwork, so nothing is a chain of browser prompts. */
      const f=s2.form,box=el("div","dform"),inputs={};
      (f.fields||[]).forEach(fd=>{
        const lab=document.createElement("label");lab.className="dfl";lab.appendChild(document.createTextNode(fd.label||fd.k));
        let inp;
        if(fd.type==="area"){inp=document.createElement("textarea");inp.value=fd.value||"";}
        else if(fd.type==="select"){inp=document.createElement("select");(fd.opts||[]).forEach(o=>{const op=document.createElement("option");op.value=String(o.v);op.textContent=String(o.t===undefined?o.v:o.t);if(String(o.v)===String(fd.value===undefined?"":fd.value))op.selected=true;inp.appendChild(op);});}
        else if(fd.type==="checks"){inp=document.createElement("div");inp.className="dchecks";const on=new Set((fd.value||[]).map(String));
          (fd.opts||[]).forEach(o=>{const l2=document.createElement("label");const cb=document.createElement("input");cb.type="checkbox";cb.value=String(o.v);cb.checked=on.has(String(o.v));l2.appendChild(cb);l2.appendChild(document.createTextNode(" "+String(o.t===undefined?o.v:o.t)));inp.appendChild(l2);});}
        else{inp=document.createElement("input");inp.type=fd.type==="password"?"password":"text";inp.value=fd.value||"";if(fd.placeholder)inp.placeholder=fd.placeholder;}
        inputs[fd.k]={fd,inp};lab.appendChild(inp);box.appendChild(lab);});
      const read=()=>{const v={};Object.entries(inputs).forEach(([k,o])=>{v[k]=o.fd.type==="checks"?[...o.inp.querySelectorAll("input:checked")].map(c=>c.value):o.inp.value;});return v;};
      const row=document.createElement("div");row.className="dfrow";
      const ok=document.createElement("button");ok.type="button";ok.className="dbtn";ok.textContent=f.submit||"OK";
      ok.addEventListener("click",()=>{try{if(typeof f.run==="function")f.run(read());}catch(err){console.warn("DOC: form failed",err);}});
      row.appendChild(ok);
      if(f.cancel){const c=document.createElement("button");c.type="button";c.className="dbtn";c.textContent=typeof f.cancel==="string"?f.cancel:"✕";
        c.addEventListener("click",()=>{try{if(typeof f.onCancel==="function")f.onCancel();else $("docClose").click();}catch(err){console.warn("DOC: cancel failed",err);}});row.appendChild(c);}
      box.appendChild(row);
      if(!f.noFocus){const first=box.querySelector("input,textarea,select");if(first)setTimeout(()=>{try{first.focus();}catch(e){}},0);}}
    else if(s2.docs){const row=el("div","ddocs");
      s2.docs.forEach(k=>{if(!DC()[k])return;const b=document.createElement("button");
        b.className="opt";b.textContent=docTitle(k);
        b.addEventListener("click",()=>docOpen(k,docBack));row.appendChild(b);});}
  });
}
/* ═══════════ THE PAPER SEAM — a pack may design its own paper (ARCH-LOG A15) ═══════════
   The gap, found the hard way: a pack ships nine JavaScript files and NO CSS, so Meridian's
   civic-form typography — IBM Plex Mono, uppercase letter-spaced grey labels, dashed rules —
   was hardcoded into the engine for every world that will ever run on it. A recipe book, a
   ship's log and a court filing all got the same municipal paperwork, and the only lever a pack
   had was which blocks to stack. A whole day went into improving food drawings inside a surface
   that could not be designed, while the thing making the page look cheap was never the food.

   A pack now declares `PAPER` — a string of CSS. What it must NOT become, in A15's own words,
   is "a hole a pack can reach through to restyle the game's chrome, the HUD or the world", so
   the scoping here is ENFORCED, not requested. A pack that writes `body{display:none}` does not
   get a warning; it gets a rule that cannot match anything.

   FOUR THINGS MAKE THAT TRUE, and each is a thing a plant has been fired at (docs/BOUNDARY.md):

   1 · THE BROWSER PARSES IT, NOT ME. The text goes into a `media="not all"` <style> — parsed,
       never applied — and we walk the CSSOM the browser built. Hand-rolling a CSS parser is
       where this kind of code gets it wrong: every escape becomes a quoting trick I did not
       think of. The browser already has a correct parser and it is free.
   2 · EVERY SELECTOR IS RE-ROOTED. A CSS selector always selects its RIGHTMOST element, so
       prefixing with `.paper ` forces the thing being styled to be a descendant of the reader.
       `html`, `body` and `:root` need no special case — `.paper html` is a selector that
       matches nothing, which is exactly the right answer. `&` means the sheet itself.
   3 · WHAT CANNOT BE RE-ROOTED IS DROPPED, BY ALLOW-LIST. `@import` is a fetch; `@font-face`,
       `@keyframes` and `@property` each register a GLOBAL name — a pack's `@keyframes bob` would
       silently replace the engine's. A name is not a subtree, so only two shapes are let through
       (a style rule and a conditional group) and everything else is dropped, including at-rules
       CSS has not invented yet.
   4 · `position:fixed` IS STRIPPED, AND THE READER IS AN ISLAND. Fixed positioning escapes its
       containing block entirely: a descendant of `.paper` could still paint over the HUD. That
       declaration is removed, and `.paper` is given `isolation:isolate` in the shell so nothing
       inside it can raise itself above anything outside it either.

   Meridian declares no PAPER and is byte-identical. The gauge declares one, so the seam is
   exercised on every CI run by the smallest world that is a world. */
function paperReRoot(sel){
  /* Split on top-level commas only — `:is(a,b)` and `:has(x,y)` carry commas that are not
     selector separators, and splitting on those would produce two broken halves. */
  const parts=[]; let d=0, cur="";
  for(const ch of sel){
    if(ch==="(")d++; else if(ch===")")d--;
    if(ch===","&&d===0){parts.push(cur);cur="";} else cur+=ch;
  }
  parts.push(cur);
  return parts.map(x=>{
    const t=x.trim(); if(!t)return null;
    if(t==="&")return ".paper";                     /* the sheet itself */
    if(t.startsWith("&"))return ".paper"+t.slice(1); /* &.night → .paper.night */
    return ".paper "+t;
  }).filter(Boolean).join(", ");
}
/* AN ALLOW-LIST, NOT A DENY-LIST, and the difference is the whole security argument.
   The first draft keyed on `CSSRule.type`, a deprecated numeric field that returns 0 for every
   rule type added after it was frozen — `@property` came back as 0 and walked straight past a map
   that had 15 written in it. A deny-list also has to predict every at-rule CSS will ever gain; an
   allow-list drops tomorrow's escape today, without knowing its name. Two shapes can be scoped and
   nothing else may pass:
     · a style rule, whose selector we re-root, and
     · a conditional group (@media / @supports / @container), whose contents we recurse into.
   Everything else is named in the warning by its own text, so a pack author is told WHAT was
   dropped rather than being left to wonder why their font never loaded. */
function paperAtName(r){const t=(r.cssText||"").trim();const m=/^@[-\w]+/.exec(t);return m?m[0]:"a rule";}
function paperWalk(rules,out,warn){
  for(const r of rules){
    if(r.cssRules&&r.conditionText!==undefined){      /* @media, @supports, @container */
      const inner=[];paperWalk(r.cssRules,inner,warn);
      if(inner.length){
        const at=r.constructor&&/Media/.test(r.constructor.name)?"@media":
                 (r.constructor&&/Supports/.test(r.constructor.name)?"@supports":"@container");
        out.push(at+" "+r.conditionText+"{"+inner.join("\n")+"}");
      }
      continue;
    }
    if(r.style&&r.selectorText!==undefined){
      const sel=paperReRoot(r.selectorText); if(!sel)continue;
      /* read the declarations off the parsed rule, so a pack cannot smuggle a second rule
         through a declaration block that was never a declaration block */
      const decls=[];
      for(let i=0;i<r.style.length;i++){
        const prop=r.style[i], val=r.style.getPropertyValue(prop);
        if(prop==="position"&&/fixed/i.test(val)){warn("position:fixed would escape the reader");continue;}
        decls.push(prop+":"+val+(r.style.getPropertyPriority(prop)?" !important":""));
      }
      if(decls.length)out.push(sel+"{"+decls.join(";")+"}");
      continue;
    }
    /* Anything left registers a GLOBAL NAME or fetches: @import, @font-face, @keyframes,
       @property, @page, @layer — and whatever CSS adds next. A name is not a subtree and cannot
       be scoped to one, so none of it comes in. */
    warn(paperAtName(r)+" cannot be scoped to the reader, so it was dropped");
  }
}
function paperSkin(){
  const css=(typeof PAPER!=="undefined"&&typeof PAPER==="string")?PAPER:"";
  if(!css.trim())return "";              /* Meridian's path: nothing declared, nothing changes */
  const probe=document.createElement("style");
  probe.media="not all";                 /* parsed by the browser, applied to nothing */
  probe.textContent=css;
  document.head.appendChild(probe);
  const out=[],dropped={};
  const warn=why=>{dropped[why]=(dropped[why]||0)+1;};
  try{paperWalk(probe.sheet.cssRules,out,warn);}
  catch(e){mqwarn("paper","the pack's PAPER could not be parsed: "+(e&&e.message),true);}
  probe.remove();
  Object.entries(dropped).forEach(([why,n])=>mqwarn("paper","dropped "+n+" — "+why));
  if(!out.length)return "";
  const el2=document.createElement("style");
  el2.id="paperSkin";el2.textContent=out.join("\n");
  /* AFTER THE LAST STYLESHEET IN THE DOCUMENT, and `document.head` is not that place — the shell's
     own 34KB block lives in <body>, so appending to the head put the pack's paper FIRST and the
     engine won every tie at equal specificity. A seam that is perfectly safe and silently does
     nothing is still a broken seam; the gauge caught this on its first run. */
  const styles=document.querySelectorAll("style,link[rel=stylesheet]");
  const last=styles.length?styles[styles.length-1]:null;
  if(last&&last.parentNode)last.parentNode.insertBefore(el2,last.nextSibling);
  else (document.body||document.documentElement).appendChild(el2);
  return el2.textContent;
}
const PAPER_APPLIED=paperSkin();
function docOpen(id,from){
  const secs=docSections(id);if(!secs)return;
  const d=docDef(id)||{},body=$("docBody");
  docCur=id;docBack=from==="card"?"card":null;body.innerHTML="";
  $("docTitle").textContent=docTitle(id);
  /* ---- THE READER IS SHOWN BEFORE THE DOCUMENT IS DRAWN, AND THAT ORDER IS THE POINT ----
     It used to render first and unhide last, and a hidden element has no width: `display:none`
     makes `#docBody.clientWidth` exactly 0, so docRender's measuring chain below fell all the way
     through to `documentElement.clientWidth` — THE WINDOW — and every drawing in the game was sized
     to the window while sitting in a narrower column. Measured in docs/cooking-world.md: 382 drawn
     into a 322 box, which the CSS cap then scales down, throwing away 16.8% of the detail on a flat
     picture and 33.3% on a lit one. A picture you are meant to walk up to cannot afford either.
     Nothing flashes: this whole function is one synchronous block, the browser paints nothing until
     it returns, and `body.innerHTML=""` above already emptied the sheet. And the reader is
     `position:fixed; inset:0` OUTSIDE #vp, so its width does not depend on the `.fs` class that
     exitFsForCard strips a few lines below — showing it early cannot change what that call sees. */
  $("reader").hidden=false;held=null;   /* overlays the world, like Settings — hiding it collapses the panel's parent */
  docRender(body,secs);
  body.scrollTop=0;{const sc=$("paperScroll");if(sc)sc.scrollTop=0;}  /* the paper scrolls in its own box now, so that is what returns to the top */
  /* a document handed over inside a quest must NOT re-run exitFsForCard: questStart already
     ran it, and a second call records wasFs=false, so the player never gets fullscreen back. */
  if(docBack!=="card")exitFsForCard();
}
let docCur=null,docBack=null;   /* "card" while a document is being read inside a quest */
/* ---------- READS / DOCS — a thing you can read without talking to anybody ----------
   The city could only ever be read by finding the right person. A pack declares READS
   (where a readable thing stands) and DOCS (what it says), and the engine renders the
   sections; it never knows what a bakery is. A pack that declares neither gets no marker,
   no button and no panel — tested. Owner, 2026-09-03: "give us a way to interact with
   things ... obviously i would need a marker to know its interactive". */
const RD=()=>((typeof READS!=="undefined"&&Array.isArray(READS))?READS:[]).concat(bldReads||[]);
const DC=()=>(typeof DOCS!=="undefined"&&DOCS)?DOCS:{};
const DCU=()=>((typeof DOCUI!=="undefined"&&DOCUI[lang])||(typeof DOCUI!=="undefined"&&DOCUI.en)||{});
const readAt=(x,y)=>RD().find(r=>r.world===world&&r.x===x&&r.y===y&&DC()[r.doc]);
/* the mark NEVER clears once read: a mark that disappears when you tick it is a checklist
   painted on the world, and this city does not have those. A thing you can read is a place. */
/* Every readable thing in the room you are standing in wears its mark — no distance limit.
   Paper on a wall is visible from the doorway; that is what a wall is for. It used to be
   three tiles, which meant the owner walked into his own office, stood at the stairs where
   the game puts you, and saw nothing at all (2026-09-03: "i still couldnt find my posters
   and laptop... ive achieved things in the game"). A marker that only appears once you are
   already touching the thing is not a marker. The door arrow keeps its three tiles: a door
   is a place you walk to, not a thing you read. */
function readMarks(){const out=[];
  RD().forEach(r=>{if(r.world===world&&DC()[r.doc])out.push(r);});
  return out;}
/* ---- THE QUEST MARKER. ONE PAINTER, THREE CAMERAS. ----
   It was `ctx.fillText("❗",x+16,y+2+bob)` written out three times (the iso bill pass, the front
   pass and the top pass), and docs/BEAUTIFY.md's audit called what it drew "a solid red bar through
   the top of the skull". Both halves of that sentence were a bug and the second one is the
   interesting one:

   · THROUGH THE SKULL, because the baseline was `y+2` — the head's own row. drawReadMark, written
     later for the same job, sits at `y-6`. The marker was eight pixels lower than the mark the
     engine already knew how to place.
   · RED, although the line above it says `fillStyle="#E0B45C"`. "❗" is a COLOUR EMOJI: the font
     paints its own palette and fillStyle is ignored entirely, so the amber this engine has asked
     for since the day the marker was written has never once reached a screen. It also means the
     marker is a different picture on every platform — Apple's, Google's, Microsoft's and this
     Linux build's are four different drawings — and the one object docs/STORY.md records as
     meaning one thing forever was being drawn by whatever font the device happened to have.

   So it is geometry now, in this engine's own hand: a balloon over the head with a tail pointing
   down at the person, and the "!" built out of two rectangles rather than a glyph. Same meaning,
   same amber the code always named, same bob — and the same picture on every device.
   BOTH GAMES GET IT and neither changes what it MEANS: hasSay() is untouched, the world tag's
   "· ❗" is untouched, and every guard that reads those still reads them. */
/* `lift` and `k` exist for ONE caller: the 3D bake draws its people into a 36x48 sprite with six
   pixels of headroom (engine3d.js:741, "#57"), so the balloon the flat cameras hang nine pixels
   above a head would be cut off at the top of the sprite and arrive on the wall of the scene as a
   clipped rectangle. Same drawing, smaller and closer, rather than a second drawing — the mural's
   own lesson from the same day: one painter, two surfaces. */
/* THE GEOMETRY IS NOT FREE-HAND. The tail must stop AT the crown and never reach into a face (that
   is the whole complaint), and in the 3D bake the top must stay inside six pixels of headroom. Both
   are true at the ends of the bob, not just at rest, which is what the first numbers got wrong:
     top of the keyline, highest bob:  by - lift - 1.6k - 1.5k  >=  by - 14   (3D headroom)
     tip of the tail,   lowest  bob:   by - lift + 1.6k + 17k   <=  by        (clear of the person)
   which is lift >= 18.6k and lift <= 14 - 3.1k, so k <= 0.645 in the bake. 0.60 with lift 11.7 sits
   inside both with room; the flat cameras have no ceiling, so they take k 1 and lift 19.
   Guarded in test/engine.smoke.js against BOTH settings, at eight phases of the bob.
   THE TWO NUMBERS LIVE HERE, not at the call site, and that is a guard decision. The first version
   took `lift` and `k` as arguments and engine3d.js passed literals — so the check in the suite was
   testing a pair of numbers it had typed out itself, and a plant that changed the ones the engine
   actually ships went straight past it, silently. The bake asks for "bake" and the painter looks up
   what that means, so there is exactly one place the geometry exists and the guard reads it. */
const SAYBAKE={lift:11.0,k:0.60};   /* what fits the 36×48 actor sprite, derived above */
function drawSayMark(g,bx,by,mode){
  const bake=mode==="bake",k=bake?SAYBAKE.k:1,lift=bake?SAYBAKE.lift:19;
  const bob=Math.sin(Date.now()/250)*1.6*k, cx=bx+16, w=13*k, h=11*k, x=cx-w/2, y=by-lift+bob;
  g.save();
  const B=1.5*k;
  g.fillStyle="rgba(20,16,28,.22)";                       /* it sits over the head, so it shades it */
  g.beginPath();g.ellipse(cx,by+3*k,5.5*k,1.8*k,0,0,7);g.fill();
  /* A HALO, BECAUSE A DARK KEYLINE ON A DARK BUILDING IS NOT A KEYLINE (owner, 2026-09-16:
     "i see building line overlapping with the explamation mark animation").
     Measured before changing anything, because the obvious diagnosis was wrong: the mark is not
     floating up by the awning and it is not behind the wall. It sits ON the head — four pixels of
     overlap — and the occlusion is correct. What fails is SEPARATION: at the market the balloon's
     #2B2536 outline lands on a storefront of almost the same value, so the building's own line
     appears to run straight through it. One pale ring outside the dark one fixes it against every
     background there is, which is what a map label does and for the same reason. */
  g.fillStyle="rgba(247,242,228,.70)";
  const H2=B+1.6*k;
  g.beginPath();g.moveTo(x-H2,y-H2);g.lineTo(x+w+H2,y-H2);g.lineTo(x+w+H2,y+h+H2);
  g.lineTo(cx+3.5*k,y+h+H2);g.lineTo(cx-0.5*k,y+h+6*k+1.6*k);g.lineTo(cx-2.5*k,y+h+H2);
  g.lineTo(x-H2,y+h+H2);g.closePath();g.fill();
  g.fillStyle="#2B2536";                                  /* the keyline, so it reads on any wall */
  g.beginPath();g.moveTo(x-B,y-B);g.lineTo(x+w+B,y-B);g.lineTo(x+w+B,y+h+B);
  g.lineTo(cx+3.5*k,y+h+B);g.lineTo(cx-0.5*k,y+h+6*k);g.lineTo(cx-2.5*k,y+h+B);
  g.lineTo(x-B,y+h+B);g.closePath();g.fill();
  g.fillStyle="#E0B45C";                                  /* the amber the code has always named */
  g.beginPath();g.moveTo(x,y);g.lineTo(x+w,y);g.lineTo(x+w,y+h);
  g.lineTo(cx+2.5*k,y+h);g.lineTo(cx-0.5*k,y+h+3.6*k);g.lineTo(cx-1.5*k,y+h);
  g.lineTo(x,y+h);g.closePath();g.fill();
  g.fillStyle="rgba(255,246,220,.42)";g.fillRect(x,y,w,1.6*k);      /* key light, upper-left */
  g.fillStyle="#2B2536";                                  /* the mark itself: a bar and a dot */
  g.fillRect(cx-1.2*k,y+2.2*k,2.4*k,5.2*k);g.fillRect(cx-1.2*k,y+8.4*k,2.4*k,2.2*k);
  g.restore();}
function drawReadMark(g,bx,by,up){ /* a cream card that BREATHES — never the bouncing ❗ */
  const b=0.85+Math.sin(Date.now()/620)*0.15,w=13,h=10,x=bx+16-w/2,y=by-6-(up|0);
  g.save();g.globalAlpha=b;
  g.fillStyle="#2B2536";g.fillRect(x-1.5,y-1.5,w+3,h+3);
  g.fillStyle="#F6EFDC";g.fillRect(x,y,w,h);
  g.fillStyle="#B9AE95";g.fillRect(x+2,y+2.5,w-6,1);g.fillRect(x+2,y+5,w-4,1);g.fillRect(x+2,y+7.5,w-7,1);
  g.fillStyle="#C9BFA6";g.beginPath();g.moveTo(x+w-4,y);g.lineTo(x+w,y);g.lineTo(x+w,y+4);g.closePath();g.fill();
  g.restore();}
function doorMarks(){const w=CW(),out=[];
  for(let y=Math.max(0,py-3);y<=Math.min(w.H-1,py+3);y++)for(let x=Math.max(0,px-3);x<=Math.min(w.W-1,px+3);x++){
    const ch=w.rows[y][x],p=Math.abs(x-px)+Math.abs(y-py)<=3&&portalAt(world,x,y);if(p)out.push({x,y,ch,mark:p.mark||""});}
  /* It used to ask DOORSET.has(ch) as well, which is how the STAIRS — the only way to the
     office — ended up as the one portal in the city wearing no marker (owner, 2026-09-03:
     "it is hard knowing where to go"). P[ch] already means "this tile leads somewhere",
     which is the whole question. Adding the stair glyphs to DOORS instead would have
     repainted them as a brown door in five places, and stood a door slab in the stairwell. */
  return out;}
function drawDoorMark(g,bx,by,up,mark){ /* bx,by: the tile's top-left in that camera; up: extra lift above the wall */
  /* On a door the arrow points AT the tile — "this one". On a STAIRCASE the same arrow is
     read as direction, so a down arrow on a flight that climbs is the marker language
     contradicting itself in the first room anyone sees. A portal says which way it goes
     (`mark:"up"`); everything that does not say keeps pointing at itself. */
  const dy=Math.sin(Date.now()/300)*2.5,ar=mark==="up"?"⬆":"⬇";
  g.font="700 15px sans-serif";g.textAlign="center";g.lineWidth=3;g.lineJoin="round";
  g.strokeStyle="#2B2536";g.fillStyle="#FFE9A8";
  g.strokeText(ar,bx+16,by-4-(up|0)+dy);g.fillText(ar,bx+16,by-4-(up|0)+dy);g.textAlign="start";}
/* The doorstep nudge. The engine has always been able to answer "is somebody waiting in
   that room?" for ANY room — worldPending(id) — but it had only ever been asked about the
   room the player was already standing in. Asked about the room on the OTHER SIDE of a
   door you are standing beside, the stairwell tells you Nacho and Don Güero are up there,
   in the pack's own words, in every camera, with no new art. Said once per room per visit:
   a thing said once is a doorway; a thing said every time is a to-do list. */
let nudgeW="",nudged=new Set();
function portalNudge(){
  if($("world").hidden)return;
  if(nudgeW!==world){nudgeW=world;nudged=new Set();}
  const w=CW();
  for(let y=Math.max(0,py-1);y<=Math.min(w.H-1,py+1);y++)for(let x=Math.max(0,px-1);x<=Math.min(w.W-1,px+1);x++){
    if(Math.abs(x-px)+Math.abs(y-py)>1)continue;
    const pp=portalAt(world,x,y),d=pp&&pp.to;
    if(!d||!WORLDS[d]||nudged.has(d)||!worldPending(d))continue;
    nudged.add(d);
    /* if the waiting person is a room host, the pack's own invite names them */
    const I=RM(),hosts=(WORLDS[d].npcs||[]).some(n=>roomPending(n));
    const line=(hosts&&I&&I.invite)?(I.invite[lang]||I.invite.en)
              :(typeof T().waitingAt==="function"?T().waitingAt(T().locs[d]||d):"");
    if(line)toast(line,3400);
    return;
  }
}
/* ---------- A PERSON MAY BE TWO THINGS ----------
   For the whole life of this engine a person has been ONE thing. `checkTalk`'s chain below is
   else-if and a pending quest is its first branch, so a quest HID a service completely: it sets
   `dataset.qi` and deletes `dataset.chatn`, and `dataset.chatn` is the only thing the doc, the room,
   the fitting room and the chair are ever dispatched from. Nobody noticed because nobody had both.

   Found 2026-09-23 by a plant aimed at something else entirely: a quest was moved onto Naye to test
   an unrelated guard, and two other guards came back with "the chair did not open". The barber's
   chair is the owner's own ask (2026-09-07, *"open the ability to change our character outfit and
   haircut after start. maybe have a small barber"*) and the district being planned for her would have
   switched it off for its whole length, silently, with every suite green. docs/POSTMORTEM.md §13w.

   So: a person who has a quest AND runs something offers BOTH — the quest on Talk, the service on
   its own button beside it, the same way a readable thing beside you gets its own button. The two
   functions below are the ONE place the service is named and the ONE place it is opened; the click
   handler on Talk was a second copy of this chain and now calls svcRun instead, so they cannot drift.

   BEHAVIOUR-IDENTICAL FOR EVERYONE TODAY: no person in either game has a quest and a service at the
   same time, so `#serve` never appears until one does. A shell without the button (an older pack's
   own index.html) simply keeps today's behaviour — every use of it is guarded. */
function svcKind(who,n){
  const dn=n||(CW().npcs||[]).find(m=>m.npc===who);
  if(dn&&dn.doc)return "doc";                                  /* a person the record placed hands you a document */
  if(roomHosts[who])return "room";
  if(who===GRW().wardrobeNpc)return "wardrobe";                /* content nominates who runs the fitting room */
  if(who===GRW().barberNpc)return "chair";                     /* ...and who runs the chair */
  return null;
}
/* what the button SAYS. Separate from svcKind on purpose: the chair and the fitting room dispatch
   whether or not their hint string exists, and only the LABEL depends on it — which is exactly how
   the chain below has always behaved, and changing that would be a silent regression for a pack
   that ships no hint. */
function svcLabel(who,n){
  const k=svcKind(who,n),dn=n||(CW().npcs||[]).find(m=>m.npc===who);
  if(k==="doc")return docTitle(dn.doc);
  if(k==="room"){const rh=roomHosts[who];return (rh.talk&&(rh.talk[lang]||rh.talk.en))||"";}
  if(k==="wardrobe")return T().wdHint||"";
  if(k==="chair")return T().chairHint||"";
  return "";
}
function svcRun(who,n){
  const k=svcKind(who,n),dn=n||(CW().npcs||[]).find(m=>m.npc===who);
  if(k==="doc"){docOpen(dn.doc);return true;}
  if(k==="room"){roomStart(roomHosts[who],who);return true;}
  if(k==="wardrobe"){openWardrobe();return true;}
  if(k==="chair"){openChair(who);return true;}
  return false;
}
function checkTalk(){
  portalNudge();
  checkRead();
  const n=CW().npcs.find(n=>Math.abs(n.x-px)+Math.abs(n.y-py)===1&&(pendingAt(n)!==undefined||n.chat));
  if(n){const qi=pendingAt(n),tb=$("talk"),rh=roomHosts[n.npc];
    if(qi!==undefined){tb.textContent=`${T().talkPre}${npcName(n.npc).split(" ·")[0]} — “${AQ()[qi].title}”`;
      tb.dataset.qi=qi;delete tb.dataset.chatn;}
    else if(n.doc){ /* a person the record placed names the document they carry */
      tb.textContent=`${T().talkPre}${npcName(n.npc).split(" ·")[0]} — “${docTitle(n.doc)}”`;
      tb.dataset.chatn=n.npc;delete tb.dataset.qi;}
    else if(rh){ /* a host says what the talk is about, like a quest does */
      tb.textContent=`${T().talkPre}${npcName(n.npc).split(" ·")[0]} — “${rh.talk[lang]||rh.talk.en}”`;
      tb.dataset.chatn=n.npc;delete tb.dataset.qi;}
    else if(n.npc===GRW().barberNpc&&T().chairHint){ /* the bubble says what the chair changes (owner: "make it easy to tell... their thought bubble at least has a hint") */
      tb.textContent=`${T().talkPre}${npcName(n.npc).split(" ·")[0]} — “${T().chairHint}”`;tb.dataset.chatn=n.npc;delete tb.dataset.qi;}
    else if(n.npc===GRW().wardrobeNpc&&T().wdHint){ /* and what the fitting room changes: the animals' wear, never yours */
      tb.textContent=`${T().talkPre}${npcName(n.npc).split(" ·")[0]} — “${T().wdHint}”`;tb.dataset.chatn=n.npc;delete tb.dataset.qi;}
    else{tb.textContent=`${T().talkPre}${npcName(n.npc).split(" ·")[0]}`;
      tb.dataset.chatn=n.npc;delete tb.dataset.qi;}
    tb.hidden=false;
    /* the service, beside the quest and never instead of it */
    const sb=$("serve");
    if(sb){const k=(qi!==undefined)?svcKind(n.npc,n):null;
      if(k){const lb=svcLabel(n.npc,n);
        sb.textContent=lb?`“${lb}”`:`${T().talkPre}${npcName(n.npc).split(" ·")[0]}`;
        sb.dataset.svcn=n.npc;sb.hidden=false;}
      else{sb.hidden=true;delete sb.dataset.svcn;}}
  }
  else{$("talk").hidden=true;
    const sb=$("serve");if(sb){sb.hidden=true;delete sb.dataset.svcn;}}
}
/* the Read button: a readable thing one step away. It answers EVERY time it is pressed —
   silence reads as a broken control (owner, 2026-09-03: "even if they just say an npc line
   that way we know the button or key is working"). */
function checkRead(){
  const b=$("read");if(!b)return;
  let hit=null;
  if(!$("world").hidden&&!moving)
    [[0,0],[0,-1],[0,1],[-1,0],[1,0]].some(([dx,dy])=>{const r=readAt(px+dx,py+dy);if(r)hit=r;return !!r;});
  b.hidden=!hit;
  if(hit){b.dataset.doc=hit.doc;
    const d=DC()[hit.doc],t=(d.title&&(d.title[lang]||d.title.en))||"";
    b.textContent=(DCU().read||"📄")+(t?" — "+t.split(" — ")[0]:"");}
}
/* controls */
document.querySelectorAll(".dpad button[data-d]").forEach(b=>{
  const on=e=>{e.preventDefault();held=b.dataset.d;};
  const off=e=>{e.preventDefault();if(held===b.dataset.d)held=null;};
  b.addEventListener("pointerdown",on);b.addEventListener("pointerup",off);
  b.addEventListener("pointercancel",off);b.addEventListener("pointerleave",off);
});
const KEYS={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",w:"up",s:"down",a:"left",d:"right",
            W:"up",S:"down",A:"left",D:"right",KeyW:"up",KeyS:"down",KeyA:"left",KeyD:"right"};
const keyDir=e=>KEYS[e.key]||KEYS[e.code]; /* a laptop keyboard: arrows or WASD, whatever the layout or caps lock says */
window.addEventListener("keydown",e=>{
  const t2=e.target; /* typing a dog's name is not walking — "shadow" has a w, an a, an s and a d */
  if(t2&&(t2.tagName==="INPUT"||t2.tagName==="TEXTAREA"))return;
  if(!$("world").hidden&&keyDir(e)){held=keyDir(e);e.preventDefault();}
  if(e.key==="Enter"&&!$("talk").hidden&&!$("world").hidden)$("talk").click();
  /* Escape puts the paper down, wherever you have scrolled to */
  if(e.key==="Escape"&&!$("reader").hidden){e.preventDefault();$("docClose").click();return;}
  /* Rosa 4: and it leaves a panel, the way it does in every other program. Only a panel that
     ALREADY has a way out — a chooser you are meant to answer (the language at first boot) has
     none on purpose, and keeps you in it. */
  if(e.key==="Escape"){const w=panelWayOut(topPanel());if(w){e.preventDefault();w.click();}}});
/* the topmost panel open over the world. The reader keeps its own Escape, above. */
function topPanel(){const ps=[...document.querySelectorAll(".settings")].filter(p=>!p.hidden&&p.id!=="reader");
  return ps.length?ps[ps.length-1]:null;}
function panelWayOut(p){if(!p)return null;
  return [...p.querySelectorAll("button")].find(b=>!b.hidden&&b.offsetParent!==null&&
    (b.classList.contains("close")||/^(close|done|back)/i.test(b.id||"")));}
/* a tap on the dark outside is the same as pressing the way out — and only ever on the backdrop
   itself, never on a click that happened inside the box and bubbled up */
document.addEventListener("click",e=>{const p=topPanel();
  if(!p||e.target!==p)return;const w=panelWayOut(p);if(w)w.click();});
window.addEventListener("keyup",e=>{if(keyDir(e)&&held===keyDir(e))held=null;});
$("read").addEventListener("click",()=>{const id=$("read").dataset.doc;if(id)docOpen(id);});
$("npcDoc").addEventListener("click",()=>{if(npcHeld)docOpen(npcHeld,"card");});
$("docClose").addEventListener("click",()=>{$("reader").hidden=true;
  /* handed over by a person mid-quest: close returns to them, not to the street. checkTalk()
     here would light the talk button and nudge lines behind a card the player is still in. */
  if(docBack==="card"){docBack=null;window.scrollTo({top:0});return;}
  restoreFs();checkTalk();});
$("docCopy").addEventListener("click",()=>{const v=docMarkdown(docCur);
  (navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(v):Promise.reject())
    .then(()=>toast(DCU().copied||"✓",2000))
    .catch(()=>{try{const r=document.createRange();r.selectNodeContents($("docBody"));
      const sel=getSelection();sel.removeAllRanges();sel.addRange(r);}catch(e){}});});
$("docDl").addEventListener("click",()=>{
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([docMarkdown(docCur)],{type:"text/markdown"}));
  a.download=(String(docCur||"document").replace(/[^a-z0-9]+/gi,"-"))+".md";
  document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},400);});
$("talk").addEventListener("click",()=>{
  const tb=$("talk");
  if(tb.dataset.chatn){
    /* the document, the room, the fitting room and the chair all live in svcRun now — this was a
       second copy of that chain and the two could drift. A person with nothing to run falls through
       to their chat lines exactly as before. */
    if(svcRun(tb.dataset.chatn))return;
    const L=chillLines(tb.dataset.chatn)||(T().chat||{})[tb.dataset.chatn]||[];
    /* A line with nobody's name on it is a line you cannot place: half the barrio sounds
       alike on a phone screen (owner, 2026-09-03: "its hard to tell people apart, should
       they have their name when they speak?"). Tile flavour stays unsigned on purpose —
       the crosswalk is not a person. */
    if(L.length){let ln=L[Math.floor(Math.random()*L.length)];if(typeof ln==="function")ln=ln(); /* a line may be counted at the moment it is said (El Portero, #8) */
      const crit=!!(ln&&ln.crit);ln=(ln&&ln.t!==undefined)?ln.t:ln;toast(sayAs(tb.dataset.chatn,ln),2800,crit);}return;}
  questStart(+tb.dataset.qi);});
/* the service button. It only ever exists beside a quest, so it has exactly one job. */
{const sb=$("serve");
 if(sb)sb.addEventListener("click",()=>{const who=sb.dataset.svcn;if(who)svcRun(who);});}
let petTarget=null,petCrit=null;
function fredCheck(){ /* now the generic animal-interaction check: every creature is reachable and greetable */
  let tgt=null,label="";
  /* a person with a quest beside you wins the buttons — the pigeon wandered next to the
     player at Don Güero's side and her button took the tap meant for him (owner,
     2026-09-02: "logs of the crosswalk while im trying to talk"). Step away to pet her. */
  const personFirst=!$("talk").hidden&&$("talk").dataset.qi!==undefined;
  if(!$("world").hidden&&!moving&&!personFirst){
    if(world===AW("dog")&&!DOG.moving&&Math.abs(DOG.x-px)+Math.abs(DOG.y-py)===1){tgt="fred";label=T().treatLb;}
    else if(world===AW("cat")&&!CAT.moving&&Math.abs(CAT.x-px)+Math.abs(CAT.y-py)===1){tgt="cat";label=T().petCat;}
    else if(world===AW("pig")&&!PIG.moving&&Math.abs(PIG.x-px)+Math.abs(PIG.y-py)===1){tgt="pig";label=T().petPig;}
    else if(world===AW("loro")&&Math.abs(LORO.x-px)+Math.abs(LORO.y-py)<=2){tgt="loro";label=T().petLoro;}
    else{ /* every critter is interactive — cats and dogs get petted, fliers get admired */
      const g2=CRIT.find(cr=>cr.world===world&&
        ((cr.kind==="gato"||isDog(cr))?(!cr.moving&&Math.abs(cr.x-px)+Math.abs(cr.y-py)===1)
                                      :Math.abs(cr.x-px)+Math.abs(cr.y-py)<=1));
      if(g2){tgt=g2.kind;petCrit=g2;
        label=isDog(g2)?"🐾 "+(g2.name||"🐶")
             :g2.kind==="gato"?T().petGato
             :g2.kind==="butterfly"?T().petFly:T().petColi;}}
  }
  petTarget=tgt;$("treat").hidden=!tgt;
  if(tgt)$("treat").textContent=label;
  const dogT=DOGK.has(tgt);
  const ballOK=dogT&&!BALL&&petCrit&&!petCrit.task;
  $("ball").hidden=!ballOK;
  if(ballOK)$("ball").textContent=T().ballLb;
  /* park row: the leash (outside), the bandana (inside), the doghouse (inside) */
  const leashOK=dogT&&world!==PL.park&&!BALL&&petCrit&&!petCrit.task;
  $("leash").hidden=!leashOK;
  if(leashOK)$("leash").textContent=T().leashLb||"🦮";
  const bandOK=dogT&&world===PL.park;
  $("band").hidden=!bandOK;
  if(bandOK)$("band").textContent=T().bandLb||"🎀";
  const aleOn=!!alebLooks()||!!faceLooks();if($("aleRnd")){$("aleRnd").hidden=!aleOn;$("aleNext").hidden=!aleOn;} /* the looks: random, next — the animal you are beside, else your face; in Muertos the face alone */
  const loveOK=dogT; /* you can always tell him */
  $("love").hidden=!loveOK;
  if(loveOK)$("love").textContent=T().loveLb||"💗";
  /* 🐾 the paw menu: always on screen (owner ask) — commands reach the nearest
     dog here, or whistle the star dog across the whole city */
  $("cmd").hidden=false;
  $("cmd").textContent="🐾";
  let adoptOK=false;
  if(world===PL.park&&!moving&&!bandOK){const w9=CW();
    adoptOK=[[1,0],[-1,0],[0,1],[0,-1]].some(dd=>{const nx=px+dd[0],ny=py+dd[1];
      return nx>=0&&ny>=0&&nx<w9.W&&ny<w9.H&&w9.grid[ny][nx]==="9";});}
  $("adopt").hidden=!adoptOK;
  if(adoptOK)$("adopt").textContent=T().adoptLb||"🏠";
}
$("treat").addEventListener("click",()=>{
  if(petTarget==="fred"){
    treats++;save();
    toast(T().fredHeart,1200);DOG.sit=true;DOG.next=performance.now()+2600;
    if(fredQ===0&&treats>=3){fredQ=1;save();setTimeout(()=>toast(T().fredUnlock,3800),1400);
      setTimeout(()=>toast(T().carePackToast,3600),1600);}
    else if(fredQ===1){fredQuestStart();}
    return;
  }
  if(petTarget==="cat"){CAT.sit=true;CAT.next=performance.now()+3200;
    const L=T().cat;toast("❤ "+L[Math.floor(Math.random()*L.length)],2000);}
  else if(petTarget==="pig"){PIG.peck=true;PIG.next=performance.now()+2200;
    const L=T().pigeon;toast("❤ "+L[Math.floor(Math.random()*L.length)],2000);}
  else if(petTarget==="loro"){
    const L=T().loro;toast("🦜 "+L[Math.floor(Math.random()*L.length)],2200);}
  else if(DOGK.has(petTarget)){ /* a treat: the tail achieves liftoff, and he's FUELED */
    const g2=petCrit;
    if(g2){g2.sit=true;g2.next=performance.now()+3200;g2.happyT=performance.now()+2200;g2.layT=0;
      g2.fedT=performance.now();g2.fseq=null; /* food-driven: the next cycle rolls at 6/7 */
      if(world===PL.park)PARK.t++;}
    const L=(g2&&g2.egg&&EGGSAFE[g2.egg]&&Math.random()<0.35)?eggLines(g2.egg,g2.name)
           :(T().beagleTreat||T().gato);
    toast("🦴 "+L[Math.floor(Math.random()*L.length)],2400);}
  else if(petTarget==="gato"){
    const g2=petCrit;
    if(g2){g2.sit=true;g2.next=performance.now()+3200;}
    const L=(g2&&g2.egg&&EGGSAFE[g2.egg])?eggLines(g2.egg,g2.name):T().gato;
    toast("❤ "+L[Math.floor(Math.random()*L.length)],2200);}
  else if(petTarget==="butterfly"||petTarget==="colibri"){
    const g2=petCrit;
    if(g2){g2.sit=true;g2.moving=false;g2.next=performance.now()+2600;} /* it pauses for you */
    const L=petTarget==="butterfly"?T().mariposa:T().colibri;
    toast((petTarget==="butterfly"?"🦋 ":"🌺 ")+L[Math.floor(Math.random()*L.length)],2200);}
});
/* ---------- quest overlay ---------- */
let wasFs=false;
function exitFsForCard(){wasFs=$("vp").classList.contains("fs");
  if(wasFs){$("vp").classList.remove("fs");document.body.classList.remove("noscroll");
    if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});setTimeout(sizeCanvas,60);}}
function restoreFs(){if(wasFs){$("vp").classList.add("fs");document.body.classList.add("noscroll");setTimeout(sizeCanvas,60);}}
let qFirst=false,npcHeld=null;   /* the document the person on screen is holding out, if any */
function questStart(qi){cur=qi;curQ=AQ()[qi];node=curQ.start;qLvl0=lvlIdx();runXP=0;qFirst=qa[qi]===undefined;exitFsForCard();$("world").hidden=true;$("card").hidden=false;held=null;nodeShow();}
function fredQuestStart(){cur=-1;curQ=FQ();node=curQ.start;qLvl0=lvlIdx();runXP=0;qFirst=qa[-1]===undefined;exitFsForCard();$("world").hidden=true;$("card").hidden=false;held=null;nodeShow();}
function nodeShow(){
  const q=curQ,t=q.nodes[node];
  roomHide();$("codex").parentElement.hidden=false; /* a quest card never shows the interview's parts */
  $("qtag").textContent=`${T().quest}: ${q.title}${node!==q.start?T().followup:""}`;
  $("npcAv").textContent=NPCE[q.npc];$("npcName").textContent=npcName(q.npc);$("npcSay").textContent=t.say;
  /* one line before the opening node, and only there — never on a follow-up step */
  const late=(node===q.start&&q.late&&qLate(cur))?q.late:"";
  $("npcLate").textContent=late;$("npcLate").hidden=!late;
  /* some people do not describe the paperwork, they hand it to you. A node may name a document
     (an id into the pack's DOCS, or the document written inline) and the card holds it out. */
  const hd=t.doc&&docSections(t.doc)?t.doc:null;
  $("npcDoc").hidden=!hd;
  if(hd){const D=docDef(hd)||{},L=D.hand&&(D.hand[lang]||D.hand.en);
    /* the button says what the PAPER is, not what the person does — the player is the one
       pressing it, and the speaker is already named two lines above it on the card. */
    $("npcDoc").textContent=L||DCU().read||docTitle(hd);npcHeld=hd;
    if(typeof hd==="string"&&!handedDocs.has(hd)){handedDocs.add(hd);save();}}else npcHeld=null;
  $("cdxLb").textContent=T().codexLb;$("codex").textContent=t.codex;$("q").textContent=t.q;
  const box=$("choices");box.innerHTML="";
  const list=[...t.ch].sort(()=>Math.random()-0.5); /* shuffled every time — no more middle-answer tell */
  list.forEach(c=>{const b=document.createElement("button");b.textContent=c.t;
    b.addEventListener("click",()=>pick(c,b,{ch:list}));box.appendChild(b);});
  $("verdict").hidden=true;$("next").hidden=true;$("levelup").hidden=true;hud();
  window.scrollTo({top:0});
}
function pick(c,btn,t){
  if(c.next){[...$("choices").children].forEach(b=>b.disabled=true);btn.classList.add("right");
    /* a correct first-node call is still a decision — the report would be a lie without it */
    logDecision({r:"ok",concept:nodeConcept(),why:""},c);
    awardXP(10);hud();save();setTimeout(()=>{node=c.next;nodeShow();},550);return;}
  const o=c.out,before=qLvl0; /* level at quest START — a level crossed on a follow-up step still gets announced here */
  [...$("choices").children].forEach(b=>b.disabled=true);
  /* retries exist, so a miss explains itself but never reveals the right answer — the codex teaches, the shuffle re-tests */
  if(o.r==="ok")btn.classList.add("right");
  else btn.classList.add(o.r==="mid"?"midpick":"wrong");
  const xp0=xp;
  if(cur>=0)marks[cur]=(marks[cur]||0)+1;   /* the grade counts every attempt, always */
  if(o.r==="ok")awardXP(10);else if(o.r==="mid")awardXP(5);else{if(livesOn())hearts--;awardXP(0);}
  const gained=xp-xp0; /* the header claims only what this pick actually paid — retries after partial credit pay the difference */
  logDecision(o,c);
  const solved=o.r==="ok";
  const retryText=!solved&&(!livesOn()||hearts>0)?(cur>=0?T().retryNote:T().retryNoteFred):"";
  const v=$("verdict");
  v.className="verdict "+(o.r==="ok"?"ok":o.r==="mid"?"mid":"no");
  /* pack text is DATA: built with textContent so a quest's words can never become markup
     (the one place the engine used to interpolate pack strings into innerHTML) */
  v.replaceChildren();
  const el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;x.textContent=txt||"";v.appendChild(x);};
  el("h2",null,(o.r==="ok"?T().okH:o.r==="mid"?T().midH:T().badH)+(gained>0?` +${gained} XP`:""));
  el("span","concept",o.concept);el("p",null,o.why);el("p","beat",o.beat);
  if(retryText)el("p","beat",retryText);
  v.hidden=false;hud();
  if(o.r!=="bad"&&lvlIdx()!==before){$("levelup").textContent=T().lvlUp+lvlName();$("levelup").hidden=false;}
  if(cur>=0){
    if(solved){done.add(cur);
      {const g=GRW().staged;
       if(g&&g.quests.indexOf(cur)>=0)growthPend=true;}} /* applied behind the curtain when the card closes */
    if(cur===GRW().wardrobeQuest&&qFirst)setTimeout(()=>toast(T().wdUnlockToast,3400),700);}
  else if(solved&&node==="b"){fredQ=2;wear.bandana=wear.bandana||"#C0392B";setTimeout(()=>toast(T().fredDoneToast,3000),600);}
  save();
  $("next").textContent=(livesOn()&&hearts<=0)?T().nextDoom:(chDue()?T().nextEnd:T().nextBack);
  $("next").hidden=false;
}
$("next").addEventListener("click",()=>{
  if(chDue()){wasFs=false;finish(livesOn()&&hearts<=0);return;}
  /* A world that does not end still grows. No curtain, no goodbye, no grade, and nobody is moved
     to a doorstep — a place you inhabit does not stop to tell you a chapter closed. The street
     simply says what opened, which is the only announcement it owes you. */
  if(chOpenDue()){
    const L=CHS(),K=epiKeys(Math.min(chSeen,L.length-1),chSeen>=L.length-1);
    if(chAdvance()){seenOpen.add(K.open);setTimeout(()=>{toast(T()[K.open]||"",3600);ribbonSay();},600);}}
  $("card").hidden=true;showWorld();restoreFs();checkTalk();
  /* the site grows behind a short curtain, after the card — not mid-sentence */
  if(growthPend){growthPend=false;curtain(()=>{applyStaged();if(typeof t3Invalidate==="function")t3Invalidate();},()=>toast(T().growthUp,2800));}
});
/* ---------- the room interview: a card with no right answer ----------
   Same card the quests use, none of their machinery: no pick(), no XP, no marks, no play
   log, no verdict, no shuffle (there is no right answer to hide, and a phone user wants
   the escape button in the same place every time). A mis-tap costs nothing: Cancel is a
   no-op, an empty box over an earlier answer is ignored, and re-answering keeps the old
   answer as history — nothing the player made is taken away. */
let roomH=null,roomK=null,roomI=0;
const RMIDS=["rmWhy","rmLater","rmAsk","rmSheet","rmBar"];
function roomHide(){RMIDS.forEach(id=>{const el=$(id);if(el)el.hidden=true;});}
function roomStart(h,key){
  roomH=h;roomK=key;
  exitFsForCard();$("world").hidden=true;$("card").hidden=false;held=null;
  const i=h.steps.findIndex(s=>!roomAns[h.id+":"+s.id]);
  if(i<0)roomDone();else roomShow(i);
}
function roomCard(){ /* the quest card's parts a design talk never uses */
  $("verdict").hidden=true;$("next").hidden=true;$("levelup").hidden=true;$("npcLate").hidden=true;
  $("codex").parentElement.hidden=true;roomHide();
  const U=RMU(),h=roomH;
  $("qtag").textContent=U.tag||"";$("npcAv").textContent=h.emoji||"";$("npcName").textContent=h.name[lang]||h.name.en;
}
function roomShow(i){
  roomI=i;const h=roomH,s=h.steps[i],U=RMU(),L=k=>(k&&(k[lang]||k.en))||"",a=roomAns[h.id+":"+s.id];
  roomCard();
  $("npcSay").textContent=L(s.say);$("q").textContent=L(s.q);
  const box=$("choices");box.innerHTML="";
  s.opts.forEach((o,idx)=>{const b=document.createElement("button");b.textContent=L(o);
    if(a&&a.pick===idx)b.classList.add("was");
    b.addEventListener("click",()=>roomAnswer(idx));box.appendChild(b);});
  if(s.free!==false){const b=document.createElement("button");b.textContent=U.free||"…";b.className="free";
    if(a&&a.text)b.classList.add("was");
    b.addEventListener("click",()=>roomAsk());box.appendChild(b);}
  $("rmWhy").textContent=L(s.why);$("rmWhy").hidden=!L(s.why);
  $("rmLater").textContent=U.later||"";$("rmLater").hidden=false;
  hud();window.scrollTo({top:0});
}
function roomRecord(s,rec){
  const k=roomH.id+":"+s.id,old=roomAns[k];
  if(old&&(old.text||(old.pick!==undefined&&old.pick!==null))){
    rec.hist=(old.hist||[]).concat([old.text?{text:old.text}:{pick:old.pick}]).slice(-5);}
  roomAns[k]=rec;roomPersist();toast(RMU().noted||"✓",1200);
}
function roomNext(){const i=roomI+1;setTimeout(()=>{if(!roomH)return;if(i>=roomH.steps.length)roomDone();else roomShow(i);},350);}
function roomAnswer(idx){[...$("choices").children].forEach(b=>b.disabled=true);
  roomRecord(roomH.steps[roomI],{pick:idx});roomNext();}
function roomAsk(){const U=RMU(),a=roomAns[roomH.id+":"+roomH.steps[roomI].id];
  $("rmTitle").textContent=U.freeTitle||"";$("rmLb").textContent=U.freeLb||"";
  $("rmOk").textContent=U.ok||"OK";$("rmCancel").textContent=U.cancel||"×";
  $("rmText").value=(a&&a.text)||"";$("rmAsk").hidden=false;$("rmText").focus();
  try{$("rmAsk").scrollIntoView({block:"nearest"});}catch(e){}}
$("rmCancel").addEventListener("click",()=>{$("rmAsk").hidden=true;});
$("rmOk").addEventListener("click",()=>{
  if(!roomH)return;
  const s=roomH.steps[roomI],k=roomH.id+":"+s.id,text=sanLine($("rmText").value),old=roomAns[k];
  $("rmAsk").hidden=true;
  if(text){roomRecord(s,{pick:null,text});roomNext();return;}
  if(old)return;                                  /* an empty box over an earlier answer changes nothing */
  roomRecord(s,{pick:null,text:"",out:true});roomNext(); /* "I'll tell you this one out loud" */
});
$("rmText").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("rmOk").click();}});
$("rmLater").addEventListener("click",()=>roomEnd());
function roomDone(){
  const h=roomH,U=RMU();
  roomCard();
  $("npcSay").textContent=h.done[lang]||h.done.en;$("q").textContent="";$("choices").innerHTML="";
  $("rmSheet").textContent=roomSheet();$("rmSheet").hidden=false;
  $("rmCopy").textContent=U.copy||"Copy";$("rmAgain").textContent=U.again||"↻";$("rmBack").textContent=U.back||T().nextBack;
  $("rmBar").hidden=false;hud();window.scrollTo({top:0});
}
$("rmAgain").addEventListener("click",()=>{if(roomH)roomShow(0);});
$("rmBack").addEventListener("click",()=>roomEnd());
$("rmCopy").addEventListener("click",()=>{const v=roomSheet(),U=RMU();
  (navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(v):Promise.reject())
    .then(()=>toast(U.copied||"✓",2200))
    .catch(()=>{try{const r=document.createRange();r.selectNodeContents($("rmSheet"));const sel=getSelection();sel.removeAllRanges();sel.addRange(r);}catch(e){}
      toast(U.copyFail||"",2600);});});
function roomEnd(){roomH=null;roomHide();$("codex").parentElement.hidden=false;
  $("card").hidden=true;showWorld();restoreFs();checkTalk();}
/* the arrival nudge: while a host in this room still has a question, say who is waiting */
function roomInvite(){const I=RM();if(!I||!I.invite)return;
  const w=WORLDS[world];if(!w||!w.npcs.some(n=>roomPending(n)))return;
  setTimeout(()=>toast(I.invite[lang]||I.invite.en,3200),2300);}
/* the sheet: plain text, no Markdown marks — the player reads it on the card, the owner
   copies it. Labels follow the language; the player's own words are printed as typed. */
function roomSheet(){
  const I=RM();if(!I)return "";
  const U=RMU(),L=k=>(k&&(k[lang]||k.en))||"",out=[],miss=[];
  const first=n=>L(n).split(" ·")[0];
  out.push(L(I.title)+" — "+L(I.place));
  out.push(heroName+" · "+(U.by||"")+" "+I.hosts.map(h=>first(h.name)).join(" & ")+" · "+new Date().toLocaleDateString(lang==="es"?"es-MX":"en-US"));
  I.hosts.forEach(h=>{out.push("");out.push("== "+first(h.name)+" · "+L(h.talk)+" ==");
    h.steps.forEach(s=>{const a=roomAns[h.id+":"+s.id],q=L(s.q);
      if(!a){miss.push(q);return;}
      const ans=a.text?"“"+a.text+"”":a.out?(U.saidOut||""):(a.pick!==null&&a.pick!==undefined&&s.opts[a.pick])?L(s.opts[a.pick]):"";
      out.push(q);out.push("   "+ans);
      if(a.hist&&a.hist.length){const prev=a.hist.map(p=>p.text?"“"+p.text+"”":s.opts[p.pick]?L(s.opts[p.pick]):"").filter(Boolean);
        if(prev.length)out.push("   ("+(U.earlier||"earlier")+": "+prev.join(" / ")+")");}});});
  out.push("");out.push("== "+(U.unanswered||"")+" ==");
  out.push(miss.length?miss.map(q=>"· "+q).join("\n"):(U.none||""));
  out.push("");out.push(U.foot||"");
  return out.join("\n");
}
/* ---------- character creator ---------- */
const SWATCH={shirt:["#8B5CF6","#E0A430","#2AA47C","#C2543F","#3E8ED0","#B04A78"],
  skin:["#F1CDA9","#E5AC82","#C08356","#8C5A33"],
  hair:["#26202B","#7A4A22","#8E8E96","#C2543F"]};
function buildSwatches(){
  Object.entries(SWATCH).forEach(([part,colors])=>{
    const row=$("row"+part[0].toUpperCase()+part.slice(1));row.innerHTML="";
    colors.forEach(col=>{const b=document.createElement("button");
      b.className="sw";b.style.background=col;b.setAttribute("aria-label",part+" "+col);
      b.setAttribute("aria-pressed",look[part]===col?"true":"false");
      b.addEventListener("click",()=>{look[part]=col;
        [...row.children].forEach(x=>x.setAttribute("aria-pressed","false"));
        b.setAttribute("aria-pressed","true");pvDraw();});
      row.appendChild(b);});
  });
}
function buildOpts(rowId,list,key){
  const row=$(rowId);row.innerHTML="";
  list.forEach(([val,label])=>{const b=document.createElement("button");
    b.className="opt";b.textContent=label;
    b.setAttribute("aria-pressed",look[key]===val?"true":"false");
    b.addEventListener("click",()=>{look[key]=val;
      [...row.children].forEach(x=>x.setAttribute("aria-pressed","false"));
      b.setAttribute("aria-pressed","true");pvDraw();});
    row.appendChild(b);});
}
function pvDraw(){const g=$("pv").getContext("2d");g.setTransform(1.6,0,0,1.6,5,22);
  g.clearRect(-6,-16,70,80);drawPerson(g,0,0,look,{dir:"down",hero:true});}
$("pvtog").addEventListener("click",()=>{const bx=$("pvbox");bx.classList.toggle("dark");
  $("pvtog").textContent=bx.classList.contains("dark")?"☀️":"🌙";});
/* Every return to the street goes through here. A save that booted straight into an
   ending (Continue → the last visit → "Out to the street") never passed enterWorld, so the
   canvas kept its hidden-time height of 0px and the player stood in front of a blank
   viewport with only the control hint showing (owner, 2026-09-03). */
function showWorld(){$("world").hidden=false;sizeCanvas();}
function enterWorld(fresh){
  $("intro").hidden=true;$("creator").hidden=true;
  $("hud").hidden=false;$("xpbarwrap").hidden=(typeof HUDFACT==="function");showWorld();
  applyCtl();hud();setWorldTag();checkTalk();
  if(fresh){toast(T().tut1,3000);
    setTimeout(()=>toast(T().tut2,3800),3300);}
}
document.querySelectorAll(".classes button").forEach(b=>b.addEventListener("click",()=>{
  cls=b.querySelector("b").textContent;look.shirt=SHIRTS[b.dataset.c]||look.shirt;
  $("intro").hidden=true;$("creator").hidden=false;
  buildSwatches();buildOpts("rowStyle",T().styles,"style");buildOpts("rowOutfit",T().outfits,"outfit");if(T().patterns)buildOpts("rowPattern",T().patterns,"pattern");buildPaintRow();pvDraw();
}));
/* ---------- the chair (owner, 2026-09-07: "we should really open the ability to change our character
   outfit and haircut after start... a small barber") — the creator reopens over the world with the name locked;
   what you pick is saved on the way out. In season the calavera looks sit in the same panel. ---------- */
let chairOpen=false;
function buildPaintRow(){const row=$("rowPaint"),lb=$("lbPaint");if(!row)return;const F=faceLooks(),on=!!F;row.innerHTML="";row.hidden=!on;if(lb){lb.hidden=!on;lb.textContent=T().lbPaint||"Calavera";}
  if(!on)return;const cur=((alePick.hero%F.length)+F.length)%F.length;
  F.forEach((lk,i)=>{const b=document.createElement("button");b.className="opt";b.textContent=lk.name?(lk.name[lang]||lk.name.en):lk.id;b.setAttribute("aria-pressed",cur===i?"true":"false");
    b.addEventListener("click",()=>{alePick.hero=i;alePersist();[...row.children].forEach(x=>x.setAttribute("aria-pressed","false"));b.setAttribute("aria-pressed","true");pvDraw();if(typeof aleRowBuild==="function")aleRowBuild();});row.appendChild(b);});}
function openChair(who){const t=T();chairOpen=true;
  $("crTitle").textContent=t.chairTitle||t.crTitle;$("lbName").hidden=true;$("heroname").hidden=true;
  const note=$("crNote");if(note){const L=(t.chat||{})[who]||[];let ln=L.length?L[Math.floor(Math.random()*L.length)]:"";if(typeof ln==="function")ln=ln();ln=(ln&&ln.t!==undefined)?ln.t:ln;note.textContent=ln?sayAs(who,ln):"";note.hidden=!ln;}
  buildSwatches();buildOpts("rowStyle",t.styles,"style");buildOpts("rowOutfit",t.outfits,"outfit");if(t.patterns)buildOpts("rowPattern",t.patterns,"pattern");buildPaintRow();pvDraw();
  $("begin").textContent=t.chairDone||t.begin;$("world").hidden=true;$("creator").hidden=false;held=null;
  /* #126: the chair opens over the world, and the page was left scrolled wherever the world had it — so the panel
     could open entirely below the fold with its way out unreachable. Put it in view and start it at its own top. */
  const cp=$("creator");cp.scrollTop=0;
  try{window.scrollTo({top:0,behavior:"auto"});}catch(e){window.scrollTo(0,0);}
  try{cp.scrollIntoView({block:"start"});}catch(e){}}
function closeChair(){const t=T();chairOpen=false;$("creator").hidden=true;$("lbName").hidden=false;$("heroname").hidden=false;$("begin").textContent=t.begin;
  const note=$("crNote");if(note)note.hidden=true;
  save();showWorld();applyCtl();hud();checkTalk();if(t.chairAfter)toast(sayAs(GRW().barberNpc,t.chairAfter),2800);}
$("begin").addEventListener("click",()=>{
  if(chairOpen){closeChair();return;}
  heroName=($("heroname").value.trim()||"Rookie").slice(0,14);
  xp=0;hearts=startHearts();done=new Set();qa={};marks={};world=PL.home;px=fx=PL.spawn[0];py=fy=PL.spawn[1];dir="down";
  save();enterWorld(true);
  const eg=eggFor(heroName); /* a legendary name gets a nod once the tutorial clears */
  if(eg)setTimeout(()=>toast(eggLines(eg,heroName)[0],3600),7400);
});
/* ---------- start/end ---------- */
/* One curtain for every ending. `burnout` = the optional hearts layer ran out, which
   ends the district's ARC where it stands — it never closes the district's quests;
   they stay answerable forever and nothing is erased. The grade picks which ending
   plays. The last district does not roll credits: the city has none, it grows. */
function finish(burnout){
  $("card").hidden=true;$("world").hidden=true;
  const L=CHS(),i=Math.min(chSeen,L.length-1),last=i>=L.length-1;
  const t=T(),g=gradeOf(L[i]);   /* the grade picks the ending — hearts never did the work */
  /* THE LAST VISIT IS NOT A TROPHY (T3, la junta 2026-09-17). This printed `🏆 AI LEGEND` — the
     global rank — over the closing scene of a bakery, and it contradicted the game's own purpose in
     the one place a player looks hardest. The rank is the wrong thing twice over: it is not about
     the district you just finished, and it is reached at TWELVE clean answers of eighty-eight
     scoring decisions (LEVELS tops out at 120 XP against MAXXP 880), so it is already maximal for
     most of the game and says nothing at all by the third ending.
     What belongs there is what you just practised — "Bakery · Operations Analyst" — which is also
     the line a person would put on a CV, and is already what the decision report prints.
     A pack that declares no trade for the district falls back to the grade it just earned, which
     is at least ABOUT this district; nothing new is demanded of a future game. */
  $("endTitle").textContent=burnout?t.goTitle:(chTrade(i)||(t.grades&&t.grades[g-1])||"");
  $("endScore").textContent=burnout?t.goScore(xp,done.size,AQ().length)
                           :livesOn()?t.endScore(xp,MAXXP,Math.max(0,hearts))
                           :t.endGrade(xp,MAXXP,t.grades[g-1]);
  /* a district names its own ending strings (CHAPTERS[i].epi = the prefix of three keys,
     .go = the burnout key); with nothing declared the old two-set rule stands. The engine
     held exactly two sets, so a third district printed the wrong last visit. */
  const K=epiKeys(i,last),E=[t[K.pre+"1"],t[K.pre+"2"],t[K.pre+"3"]];
  $("epi").textContent = burnout?t[K.go] : g>=3?E[0] : g===2?E[1] : E[2];
  $("endGo").textContent=last?t.endStay:t.endGo;$("endGo").hidden=false;
  $("end").hidden=false;
}
/* Acknowledging an ending opens the next district and refills the optional stakes
   layer. It closes nothing: every quest you walked past is still on offer, and the
   district you just finished stays open behind you. After the last one you keep the
   city and wander it. */
function epiKeys(i,last){const c=CHS()[i]||{};
  return {pre:c.epi||(last?"mepi":"epi"),go:c.go||(c.epi?c.epi+"Go":(last?"mgoEpi":"goEpi")),
          open:c.open||(last?"endStayToast":"weekTwoToast")};}
$("endGo").addEventListener("click",()=>{
  const last=chSeen>=CHS().length-1;const K=epiKeys(Math.min(chSeen,CHS().length-1),last);
  chAdvance();hearts=startHearts();
  /* the handover doorstep: the storefront that just opened says where you stand. It was
     the mercado's front step, hardcoded here in the shared engine; with nothing declared
     you simply stay where you were. */
  const rd=ribbons().find(r=>r.district===chSeen&&r.doorstep);
  if(!last&&rd){const d=rd.doorstep;if(d.world&&WORLDS[d.world])world=d.world;px=fx=d.x|0;py=fy=d.y|0;dir=d.dir||"down";}
  if(isSolid(px,py)){world=PL.home;px=fx=PL.spawn[0];py=fy=PL.spawn[1];}
  wasFs=false;
  growthPend=false;seenOpen.add(K.open);
  save();$("end").hidden=true;showWorld();applyCtl();setWorldTag();hud();checkTalk();
  toast(T()[K.open]||(last?T().endStayToast:T().weekTwoToast),4000);
  ribbonSay();   /* and what landed while that the last visit played */
});
/* Wiping a city is never one tap. The story never sends you here — this is a tool. */
$("replay").addEventListener("click",()=>{
  if(!replayTimer){
    $("replay").textContent=T().replayArm;
    replayTimer=setTimeout(()=>{replayTimer=null;$("replay").textContent=T().replay;},4000);
    return;}
  clearTimeout(replayTimer);replayTimer=null;$("replay").textContent=T().replay;
  xp=0;hearts=startHearts();done=new Set();qa={};marks={};chSeen=0;world=PL.home;px=fx=PL.spawn[0];py=fy=PL.spawn[1];dir="down";
  applyGrowth();save();
  seenOpen=new Set();handedDocs=new Set();
  $("settings").hidden=true;$("end").hidden=true;$("card").hidden=true;showWorld();
  setWorldTag();hud();checkTalk();
  toast(T().replayToast(heroName),2500);});
/* ---------- the curtain ----------
   A map change the player is standing next to happens behind a short dark curtain: the
   build was applied the instant the pick landed, so the site had already changed when
   the card closed — "a building appears ... not a smooth switch" (owner, 2026-09-03). */
let growthPend=false;
function curtain(apply,after){const v=$("veil");
  if(!v){apply();if(after)after();return;}
  held=null;v.classList.add("on");
  setTimeout(()=>{try{apply();}finally{v.classList.remove("on");}if(after)setTimeout(after,450);},460);}
/* ---------- the settings drawers ----------
   A settings panel you have to scroll is a settings panel you stop reading. Four groups,
   each opening and closing like a drawer, and the phone remembers which ones YOU keep open
   (owner, 2026-09-03: "each setting can also just expand or close like a drawer ... use best
   gaming practices"). Controls opens by default because it is the one a new player needs;
   the action buttons underneath are not settings and never hide. */
const DRAWERS=["drwCtl","drwLook","drwSelf","drwSound","drwGame"];  /* drwSelf: appearance, its own subject (#127) */
function drawersInit(){
  let open={};try{open=JSON.parse(localStorage.getItem(SK("drawers"))||"null")||{drwCtl:true};}catch(e){open={drwCtl:true};}
  DRAWERS.forEach(id=>{const d=$(id);if(!d)return;
    d.open=!!open[id];
    d.addEventListener("toggle",()=>{
      const st={};DRAWERS.forEach(k=>{const e2=$(k);if(e2)st[k]=e2.open;});
      mqStore(SK("drawers"),JSON.stringify(st));});});
}
drawersInit();
/* ---------- controls scheme ---------- */
let ctl="swipe";try{ctl=localStorage.getItem(SK("ctl"))||"swipe";}catch(e){}
if(!["swipe","joy","pad"].includes(ctl))ctl="swipe";
function applyCtl(){
  $("joy").hidden=(ctl!=="joy");$("dpad").hidden=(ctl!=="pad");
  $("optSwipe").setAttribute("aria-pressed",ctl==="swipe"?"true":"false");
  $("optJoy").setAttribute("aria-pressed",ctl==="joy"?"true":"false");
  $("optPad").setAttribute("aria-pressed",ctl==="pad"?"true":"false");
  $("ctlHint").textContent=ctl==="swipe"?T().hintSwipe:(ctl==="joy"?T().hintJoy:T().hintPad);
  mqStore(SK("ctl"),ctl);
}
$("gear").addEventListener("click",()=>{
  /* the wardrobe is extra — any ATTEMPT at the quest content nominates opens it */
  {const wq=GRW().wardrobeQuest;
   $("openWd").hidden=!(wq!==undefined&&(done.has(wq)||qa[wq]!==undefined));}
  $("settings").hidden=false;held=null;});
$("openWd").addEventListener("click",()=>{$("settings").hidden=true;openWardrobe();});
$("closeSet").addEventListener("click",()=>{$("settings").hidden=true;});
$("optSwipe").addEventListener("click",()=>{ctl="swipe";applyCtl();});
$("optJoy").addEventListener("click",()=>{ctl="joy";applyCtl();});
$("optPad").addEventListener("click",()=>{ctl="pad";applyCtl();});
(function(){
  const joy=$("joy"),knob=$("knob");let active=null;
  function setFrom(e){
    const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    let dx=e.clientX-cx,dy=e.clientY-cy;
    const max=r.width/2-14,len=Math.hypot(dx,dy);
    if(len>max){dx=dx/len*max;dy=dy/len*max;}
    knob.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    if(Math.hypot(dx,dy)<16){held=null;return;}
    held=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");
  }
  function end(){active=null;held=null;knob.style.transform="translate(-50%,-50%)";}
  joy.addEventListener("pointerdown",e=>{e.preventDefault();active=e.pointerId;joy.setPointerCapture(e.pointerId);setFrom(e);});
  joy.addEventListener("pointermove",e=>{if(e.pointerId===active)setFrom(e);});
  joy.addEventListener("pointerup",end);joy.addEventListener("pointercancel",end);
})();
/* ---------- comfort themes ([partner]'s feedback): curated palettes, each with light+dark
   variants, applied over the CSS variables. Adding a theme = data only — and CI runs
   a WCAG contrast audit over every variant, so a palette that hurts eyes can't ship. */
const THEMES={
 meridian:null, /* the built-in palette from the stylesheet */
 forest:{
  light:{bg:"#EDF2E6",surface:"#FFFFFF",ink:"#1E2A1E",muted:"#54644E",line:"#CBD6C0",
         accent:"#2E7D4F","accent-ink":"#FFFFFF",chip:"#E2EAD8",bubble:"#E7F0DD","bubble-line":"#C4D6B0"},
  dark:{bg:"#121A12",surface:"#1B241B",ink:"#E6EEE2",muted:"#A3B49C",line:"#2E3C2E",
        accent:"#7FD8A0","accent-ink":"#0F2114",chip:"#243024",bubble:"#223022","bubble-line":"#3C503C"}},
 fairy:{
  light:{bg:"#F4EFFA",surface:"#FFFFFF",ink:"#2A2140",muted:"#665A82",line:"#DDD2EE",
         accent:"#8140CE","accent-ink":"#FFFFFF",chip:"#ECE3F7",bubble:"#F0E6FB","bubble-line":"#D8C4F0"},
  dark:{bg:"#171226",surface:"#221A35",ink:"#EFE8FA",muted:"#AC9FCA",line:"#3A2E58",
        accent:"#C9A2FF","accent-ink":"#241040",chip:"#2C2344",bubble:"#2A2145","bubble-line":"#4C3B70"}},
 sunset:{
  light:{bg:"#F7EFE3",surface:"#FFFDF8",ink:"#33261C",muted:"#776450",line:"#E2D4C0",
         accent:"#B34A14","accent-ink":"#FFFFFF",chip:"#EFE3D0",bubble:"#F3E7D3","bubble-line":"#DFC9A8"},
  dark:{bg:"#1D140E",surface:"#291D14",ink:"#F2E7DA",muted:"#BEA88F",line:"#443221",
        accent:"#F0A868","accent-ink":"#2A1505",chip:"#362718",bubble:"#342517","bubble-line":"#55402B"}}};
const THEME_KEYS=["bg","surface","ink","muted","line","accent","accent-ink","chip","bubble","bubble-line"];
/* custom theme: clone a preset in the admin theme editor, tweak freely, and the
   🪄 auto-fix button repairs contrast after lazy changes. Stored per device. */
function sanitizeTheme(t2){
  if(!t2||typeof t2!=="object")return null;
  const out={};
  ["light","dark"].forEach(m2=>{const src=t2[m2];if(!src||typeof src!=="object")return;
    const o={};THEME_KEYS.forEach(k2=>{const v=src[k2];
      if(typeof v==="string"&&/^#[0-9A-Fa-f]{6}$/.test(v))o[k2]=v;});
    if(Object.keys(o).length===THEME_KEYS.length)out[m2]=o;});
  return out.light&&out.dark?out:null;
}
/* palette wardrobe: several named custom palettes, reorderable, one active.
   mqpals=[{n,light,dark}...] + mqpal=active index; legacy mqcustom migrates in. */
let PALS=[],palIdx=0;
try{
  const raw=JSON.parse(localStorage.getItem(SK("pals"))||"null");
  if(Array.isArray(raw))raw.slice(0,8).forEach(e2=>{const t2=sanitizeTheme(e2);
    if(t2)PALS.push({n:String(e2.n||"Custom").slice(0,18),light:t2.light,dark:t2.dark});});
}catch(e){}
if(!PALS.length){try{const old=sanitizeTheme(JSON.parse(localStorage.getItem(SK("custom"))||"null"));
  if(old)PALS.push({n:"Custom 1",light:old.light,dark:old.dark});}catch(e){}}
try{palIdx=Math.min(PALS.length-1,Math.max(0,parseInt(localStorage.getItem(SK("pal"))||"0")||0));}catch(e){}
let customTheme=PALS[palIdx]||null;
let themeName="meridian";try{themeName=localStorage.getItem(SK("theme"))||"meridian";}catch(e){}
if(!THEMES.hasOwnProperty(themeName)&&themeName!=="custom")themeName="meridian";
const darkMq=window.matchMedia("(prefers-color-scheme: dark)");
/* canvas theming: the world follows the theme. Big-surface colors (floors, walls,
   water, fences, furniture bulk) mix toward the theme accent via tc(); landmark props
   (doors, the taco cones, storefronts) keep their identity. NPC shirts take a stronger
   whimsy mix; skin, hair, animals and the player's own chosen look never change. */
let tintCol=null,tintDark=false;const tintCache=new Map(),npcLookCache={};
function setCanvasTint(){
  tintCache.clear();Object.keys(npcLookCache).forEach(k2=>delete npcLookCache[k2]);
  const t2=themeName==="custom"?customTheme:THEMES[themeName];
  tintDark=darkMq.matches;
  tintCol=t2?(tintDark?t2.dark:t2.light).accent:null;
}
const tc=h=>{if(!tintCol)return h;let v=tintCache.get(h);
  if(!v){v=mixHex(h,tintCol,tintDark?0.22:0.16);tintCache.set(h,v);}return v;};
/* a person's look: by who they are (npc id) first, by their map letter second. NPCLOOK was
   one flat table keyed by letter, shared by every world — a fourth cast would have worn the
   first cast's colours. */
const lookOf=n=>(n&&n.npc&&NPCLOOK[n.npc])||NPCLOOK[n&&n.key!==undefined?n.key:n];
const npcWhimsy=n=>{const base=lookOf(n),k2=(n&&n.npc&&NPCLOOK[n.npc])?n.npc:(n&&n.key!==undefined?n.key:n);
  if(!tintCol)return base;let v=npcLookCache[k2];
  if(!v){v={...base,shirt:mixHex(base.shirt,tintCol,0.15)};npcLookCache[k2]=v;}return v;};
/* 0.4 mixed nearly half the theme colour into every shirt in town, which erased the one
   difference twenty neighbours had. 0.15 keeps the theme's mood and gives the shirts back. */
function applyTheme(){
  if(themeName==="custom"&&!customTheme)themeName="meridian";
  const t2=themeName==="custom"?customTheme:THEMES[themeName],root=document.documentElement;
  THEME_KEYS.forEach(k2=>root.style.removeProperty("--"+k2));
  if(t2){const set2=darkMq.matches?t2.dark:t2.light;
    Object.entries(set2).forEach(([k2,v])=>root.style.setProperty("--"+k2,v));}
  document.querySelectorAll("#themeRow button,#themeRow2 button[data-th]")
    .forEach(b=>b.setAttribute("aria-pressed",b.dataset.th===themeName?"true":"false"));
  $("thCustom").hidden=!customTheme;
  if(customTheme)$("thCustom").textContent="\u2728 "+customTheme.n;
  setCanvasTint();
  if(MUSIC.timer)musRetime(); /* tempo follows the theme */
  mqStore(SK("theme"),themeName);
}
try{darkMq.addEventListener("change",applyTheme);}catch(e){}
/* ---------- SEASONS: a second palette layer, for WORLD ART, kept apart from THEMES ----------
   THEMES tints a tile and SEASONS recolours one, and they are different layers doing different
   jobs. This comment used to say "THEMES is UI chrome and never reaches a tile", which was false
   the day it was written: tc() has always mixed the theme accent into every hex the world draws,
   and the mesh baker in engine3d.js runs every part colour through the same tc(). The owner
   settled it on 2026-09-22 by changing the RULE rather than the code (docs/OWNER.md, the theme
   entry). A theme may TINT; it may never REDESIGN. art(key, fallback) is how world art asks
   whether a season has recoloured it. The pack declares SEASONS (names, dates, colours);
   the engine never learns a name (the portability guard enforces it). seasonPick is the
   player's Settings choice: "auto" (by the calendar), "off" (year-round), or a season id.
   A pack with no SEASONS behaves exactly as before — art() always returns the fallback. */
let seasonPick="auto";try{seasonPick=localStorage.getItem(SK("season"))||"auto";}catch(e){}
const seasonMemo={day:"",id:null}; /* the calendar is read once a day, not once a tile */
const SEAS=()=>typeof SEASONS!=="undefined"&&SEASONS?SEASONS:{};
function seasonNow(now){ /* the current season id, or null. `now` is for tests. */
  const S=SEAS();
  if(seasonPick==="off")return null;
  if(seasonPick!=="auto")return S[seasonPick]?seasonPick:null;
  const d=now||new Date(),key=d.getFullYear()+"-"+d.getMonth()+"-"+d.getDate();
  if(!now&&seasonMemo.day===key)return seasonMemo.id;
  const m=d.getMonth()+1,dd=d.getDate(),md=m*100+dd;
  let id=null;
  Object.entries(S).some(([k,v])=>{if(!v.from||!v.to)return false;
    const a=v.from[0]*100+v.from[1],b=v.to[0]*100+v.to[1];
    const inW=a<=b?(md>=a&&md<=b):(md>=a||md<=b); /* a window may wrap the new year */
    if(inW)id=k;return inW;});
  if(!now){const was=seasonMemo.id;seasonMemo.day=key;seasonMemo.id=id;
    if(was!==id&&seasonMemo.day&&typeof t3Invalidate==="function")t3Invalidate();} /* it turned over at midnight */
  return id;
}
function art(key,fb){const id=seasonNow(),v=id&&SEAS()[id].art;return v&&v[key]!==undefined?v[key]:fb;}
function seasonSet(pick){
  seasonPick=pick;seasonMemo.day="";
  mqStore(SK("season"),pick);
  if(typeof t3Invalidate==="function")t3Invalidate();
  if(typeof T3!=="undefined"&&T3&&T3.canopyTex){T3.canopyTex.dispose();T3.canopyTex=null;} /* the canopy is baked once; the season dresses it */
  seasonRowBuild();if(typeof aleRowBuild==="function")aleRowBuild();
}
function seasonRowBuild(){ /* the row is built from content: auto, year-round, then each declared season by its own name */
  const row=$("seasonRow"),lb=$("lbSeason");if(!row)return;
  const S=SEAS(),ids=Object.keys(S),t=T();
  if(lb)lb.hidden=!ids.length;row.hidden=!ids.length;
  row.innerHTML="";
  [["auto",t.seasonAuto],["off",t.seasonOff]].concat(ids.map(k=>[k,(S[k].label&&(S[k].label[lang]||S[k].label.en))||k]))
    .forEach(([k,label])=>{const b=document.createElement("button");b.dataset.sn=k;b.textContent=label;
      b.setAttribute("aria-pressed",seasonPick===k?"true":"false");
      b.addEventListener("click",()=>seasonSet(k));row.appendChild(b);});
}
document.querySelectorAll("#themeRow button,#thCustom").forEach(b=>b.addEventListener("click",()=>{themeName=b.dataset.th;applyTheme();}));
/* --- contrast math (same WCAG formula the CI audit uses) --- */
const hex2rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const rgb2hex=r=>"#"+r.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");
const relLum=h=>{const c=hex2rgb(h).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const cRatio=(a,b)=>{const l1=relLum(a),l2=relLum(b);return(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);};
const mixHex=(h,t2,amt)=>{const tr=hex2rgb(t2);return rgb2hex(hex2rgb(h).map((v,i)=>v+(tr[i]-v)*amt));};
function fixFg(fg,bgs,min){ /* smallest nudge toward black or white that clears `min` vs every bg */
  const ok=h=>bgs.every(b=>cRatio(h,b)>=min);
  if(ok(fg))return fg;
  for(let a=0.05;a<=1.001;a+=0.05){
    const dk=mixHex(fg,"#000000",a);if(ok(dk))return dk;
    const lt=mixHex(fg,"#FFFFFF",a);if(ok(lt))return lt;
  }
  return bgs.every(b=>cRatio("#000000",b)>=cRatio("#FFFFFF",b))?"#000000":"#FFFFFF";
}
function autoFixTheme(){ /* backgrounds are the designer's; text adjusts to stay readable */
  ["light","dark"].forEach(m2=>{const p=customTheme[m2];
    p.ink=fixFg(p.ink,[p.bg,p.surface,p.chip,p.bubble],4.5);
    p.muted=fixFg(p.muted,[p.surface,p.bg],4.5);
    p["accent-ink"]=fixFg(p["accent-ink"],[p.accent],4.5);
  });
  saveCustom();applyTheme();teRender();toast(T().teFixed,2200);
}
/* --- theme editor (admin) --- */
/* open the editor on the variant the player is actually SEEING — editing the light
   palette while the phone displays dark reads as "my colors don't change" */
let teMode=darkMq.matches?"dark":"light";
function saveCustom(){mqStore(SK("pals"),JSON.stringify(PALS));
  mqStore(SK("pal"),String(palIdx));}
function meridianVars(mode){ /* read the built-in palette out of the stylesheet */
  const root=document.documentElement,prev=root.dataset.theme;
  THEME_KEYS.forEach(k2=>root.style.removeProperty("--"+k2));
  root.dataset.theme=mode;
  const cs=getComputedStyle(root),o={};
  THEME_KEYS.forEach(k2=>o[k2]=cs.getPropertyValue("--"+k2).trim());
  if(prev)root.dataset.theme=prev;else delete root.dataset.theme;
  return o;
}
function cloneTheme(name){ /* clone = save-as-new palette in the wardrobe */
  if(PALS.length>=8){toast(T().palFull,2400);return;}
  const src=name==="meridian"?{light:meridianVars("light"),dark:meridianVars("dark")}
    :JSON.parse(JSON.stringify(THEMES[name]));
  PALS.push({n:(T().palNames[name]||name)+" "+(PALS.length+1),light:src.light,dark:src.dark});
  palIdx=PALS.length-1;customTheme=PALS[palIdx];
  themeName="custom";saveCustom();applyTheme();teRender();
}
function palSelect(i){palIdx=i;customTheme=PALS[i];themeName="custom";saveCustom();applyTheme();teRender();}
function palRender(){ /* the wardrobe list: pick, reorder, evict */
  const box=$("tePals");box.innerHTML="";
  PALS.forEach((pal,i)=>{
    const row=document.createElement("div");row.className="palrow";
    const use=document.createElement("button");use.textContent=pal.n;use.className="palname";
    use.setAttribute("aria-pressed",themeName==="custom"&&i===palIdx?"true":"false");
    use.addEventListener("click",()=>palSelect(i));
    const up=document.createElement("button");up.textContent="\u25b2";up.disabled=i===0;
    up.addEventListener("click",()=>{[PALS[i-1],PALS[i]]=[PALS[i],PALS[i-1]];
      if(palIdx===i)palIdx=i-1;else if(palIdx===i-1)palIdx=i;
      customTheme=PALS[palIdx];saveCustom();teRender();});
    const dn=document.createElement("button");dn.textContent="\u25bc";dn.disabled=i===PALS.length-1;
    dn.addEventListener("click",()=>{[PALS[i+1],PALS[i]]=[PALS[i],PALS[i+1]];
      if(palIdx===i)palIdx=i+1;else if(palIdx===i+1)palIdx=i;
      customTheme=PALS[palIdx];saveCustom();teRender();});
    const del=document.createElement("button");del.textContent="\ud83d\uddd1";
    del.addEventListener("click",()=>{PALS.splice(i,1);
      if(palIdx>=PALS.length)palIdx=Math.max(0,PALS.length-1);
      customTheme=PALS[palIdx]||null;
      if(!customTheme&&themeName==="custom")themeName="meridian";
      saveCustom();applyTheme();teRender();});
    row.appendChild(use);row.appendChild(up);row.appendChild(dn);row.appendChild(del);
    box.appendChild(row);});
  $("teName").value=customTheme?customTheme.n:"";
  $("teName").placeholder=T().teNamePh;
}
$("teName").addEventListener("input",()=>{
  if(!customTheme)return;
  customTheme.n=$("teName").value.slice(0,18).trim()||"Custom";
  saveCustom();
  if(themeName==="custom")$("thCustom").textContent="\u2728 "+customTheme.n;
});
function teRender(){
  palRender();
  const box=$("teRows");box.innerHTML="";
  if(!customTheme)return;
  $("teLight").setAttribute("aria-pressed",teMode==="light"?"true":"false");
  $("teDark").setAttribute("aria-pressed",teMode==="dark"?"true":"false");
  THEME_KEYS.forEach(k2=>{
    const row=document.createElement("div");row.className="terow";
    const lb=document.createElement("span");lb.textContent=k2;
    const inp=document.createElement("input");inp.type="color";inp.value=customTheme[teMode][k2];
    inp.addEventListener("input",()=>{customTheme[teMode][k2]=inp.value;saveCustom();applyTheme();});
    row.appendChild(lb);row.appendChild(inp);box.appendChild(row);
  });
}
$("teOpen").addEventListener("click",()=>{
  if(!customTheme)cloneTheme(themeName==="custom"?"meridian":themeName);
  else{themeName="custom";applyTheme();}
  teRender();$("settings").hidden=true;$("themeEd").hidden=false;held=null;});
document.querySelectorAll("#teClone button").forEach(b=>b.addEventListener("click",()=>cloneTheme(b.dataset.cl)));
$("teLight").addEventListener("click",()=>{teMode="light";teRender();});
$("teDark").addEventListener("click",()=>{teMode="dark";teRender();});
$("teFix").addEventListener("click",autoFixTheme);
$("teClose").addEventListener("click",()=>{$("themeEd").hidden=true;
  if(customTheme)toast(T().teSaved,2000);});
/* ---------- music: procedural WebAudio — generative, theme-aware, $0, offline.
   No assets, no network, nothing to license: a sparse pentatonic melody wanders over
   a soft pad and bass, voiced per theme. Starts on the first user gesture (autoplay
   rules), sleeps when the tab hides, and lives behind 🎵 volume/mute in Settings. */
const MUSIC={ctx:null,master:null,timer:null,step:0,mel:2};
let musOn=true,musVol=0.6;
try{musOn=localStorage.getItem(SK("mus"))!=="0";}catch(e){}
try{const v=parseFloat(localStorage.getItem(SK("vol")));if(!isNaN(v))musVol=Math.min(1,Math.max(0,v));}catch(e){}
const MUSDEF={
 meridian:{bpm:76,root:57,scale:[0,3,5,7,10],lead:"triangle",pad:"sine",bright:900},  /* A min pent — lo-fi office */
 forest:{bpm:84,root:64,scale:[0,2,4,7,9],lead:"triangle",pad:"triangle",bright:1500},/* E maj pent — marimba woods */
 fairy:{bpm:64,root:73,scale:[0,2,4,7,9],lead:"sine",pad:"sine",bright:2800},         /* C#5 maj pent — little bells */
 sunset:{bpm:58,root:55,scale:[0,2,4,7,9],lead:"sine",pad:"sine",bright:800}};        /* G maj pent — warm dusk */
/* tune picker: Auto follows the theme; or pin one of the four tunes (owner ask) */
let musTune="default";try{musTune=localStorage.getItem(SK("tune"))||"default";}catch(e){}
if(!MUSDEF[musTune]&&musTune!=="default")musTune="default";
const musDef=()=>MUSDEF[musTune]||MUSDEF[themeName]||MUSDEF.meridian;
function musTuneSet(tn){musTune=tn;
  mqStore(SK("tune"),tn);
  document.querySelectorAll("#tuneRow button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.tn===musTune?"true":"false"));
  if(MUSIC.timer)musRetime();
  if(musOn)setTimeout(musChirp,120);}
document.querySelectorAll("#tuneRow button").forEach(b=>b.addEventListener("click",()=>musTuneSet(b.dataset.tn)));
const mtof=m=>440*Math.pow(2,(m-69)/12);
function musVoice(m,t0,dur,type,peak,bright){
  const c=MUSIC.ctx,o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();
  o.type=type;o.frequency.value=mtof(m);
  f.type="lowpass";f.frequency.value=bright;
  g.gain.setValueAtTime(0,t0);
  g.gain.linearRampToValueAtTime(peak,t0+Math.min(0.05,dur*0.2));
  g.gain.exponentialRampToValueAtTime(0.0008,t0+dur);
  o.connect(f);f.connect(g);g.connect(MUSIC.master);
  o.start(t0);o.stop(t0+dur+0.05);
}
function musTick(){
  const c=MUSIC.ctx,d=musDef(),t0=c.currentTime+0.08,st=MUSIC.step++;
  if(Math.random()<0.58){ /* melody: random walk on the pentatonic — dense enough to read as a tune */
    MUSIC.mel+=[1,-1,2,-2,1,-1,0][Math.floor(Math.random()*7)];
    MUSIC.mel=Math.max(-3,Math.min(9,MUSIC.mel));
    const deg=((MUSIC.mel%5)+5)%5,oct=Math.floor(MUSIC.mel/5);
    musVoice(d.root+12+oct*12+d.scale[deg],t0,0.55,d.lead,0.19,d.bright);
  }
  if(st%8===0)musVoice(d.root-12,t0,1.8,"sine",0.12,500);      /* bass root */
  if(st%16===4)musVoice(d.root-5,t0,1.6,"sine",0.08,500);      /* bass fifth */
  if(st%16===0)[0,7].forEach(iv=>musVoice(d.root+iv,t0,3.4,d.pad,0.05,d.bright*0.8)); /* pad swell */
}
function musRetime(){if(MUSIC.timer){clearInterval(MUSIC.timer);MUSIC.timer=null;}
  if(musOn&&MUSIC.ctx)MUSIC.timer=setInterval(()=>{
    if(!document.hidden&&MUSIC.ctx.state==="running")musTick();},30000/musDef().bpm);}
function musStart(){
  if(!musOn)return;
  if(!MUSIC.ctx){
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    try{MUSIC.ctx=new AC();}catch(e){return;}
    MUSIC.master=MUSIC.ctx.createGain();
    MUSIC.master.gain.value=0.55*musVol*musVol;
    MUSIC.master.connect(MUSIC.ctx.destination);
    /* iOS can suspend us behind our back (calls, Siri, control center) — heal it */
    MUSIC.ctx.onstatechange=()=>{
      if(musOn&&!document.hidden&&MUSIC.ctx.state==="suspended")MUSIC.ctx.resume().catch(()=>{});};
  }
  if(MUSIC.ctx.state==="suspended")MUSIC.ctx.resume().catch(()=>{});
  if(!MUSIC.timer)musRetime();
}
function musStop(){if(MUSIC.timer){clearInterval(MUSIC.timer);MUSIC.timer=null;}
  if(MUSIC.ctx&&MUSIC.ctx.state==="running")MUSIC.ctx.suspend().catch(()=>{});}
function musApply(){
  /* squared taper: linear sliders feel top-heavy for loudness */
  if(MUSIC.master)MUSIC.master.gain.value=musOn?0.55*musVol*musVol:0;
  $("musMute").textContent=musOn?T().musOn:T().musOff;
  $("musMute").setAttribute("aria-pressed",musOn?"true":"false");
  $("musVol").value=Math.round(musVol*100);
  mqStore(SK("mus"),musOn?"1":"0");mqStore(SK("vol"),String(musVol));
  if(musOn)musStart();else musStop();
}
function musChirp(){ /* instant audible proof the audio path works (owner: "no tune") */
  if(!MUSIC.ctx||MUSIC.ctx.state!=="running")return;
  const d=musDef(),t0=MUSIC.ctx.currentTime+0.03;
  [0,2,4].forEach((deg,i)=>musVoice(d.root+12+d.scale[deg],t0+i*0.09,0.4,d.lead,0.22,d.bright));}
function musHowl(){ /* a tiny beagle howl: one voice — up, hold, trail off. Awoo. */
  if(!MUSIC.ctx||MUSIC.ctx.state!=="running")return; /* muted dog stays a mime */
  const c=MUSIC.ctx,t0=c.currentTime+0.05;
  const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();
  o.type="sawtooth";f.type="lowpass";f.frequency.value=900;
  o.frequency.setValueAtTime(310,t0);
  o.frequency.exponentialRampToValueAtTime(620,t0+0.28);
  o.frequency.setValueAtTime(620,t0+0.55);
  o.frequency.exponentialRampToValueAtTime(430,t0+0.95);
  const v=c.createOscillator(),vg=c.createGain(); /* slow vibrato — the mournful part */
  v.frequency.value=5.5;vg.gain.value=12;v.connect(vg);vg.connect(o.frequency);
  g.gain.setValueAtTime(0,t0);
  g.gain.linearRampToValueAtTime(0.15,t0+0.12);
  g.gain.setValueAtTime(0.15,t0+0.6);
  g.gain.exponentialRampToValueAtTime(0.0008,t0+1.05);
  o.connect(f);f.connect(g);g.connect(MUSIC.master);
  o.start(t0);v.start(t0);o.stop(t0+1.15);v.stop(t0+1.15);
}
$("musMute").addEventListener("click",()=>{musOn=!musOn;musApply();if(musOn)setTimeout(musChirp,150);});
$("musVol").addEventListener("input",()=>{musVol=$("musVol").value/100;if(!musOn)musOn=true;musApply();});
$("musVol").addEventListener("change",()=>setTimeout(musChirp,100));
/* persistent, not once: the same cheap poke does the first-gesture unlock AND recovers
   from iOS interruption-suspends later; musStart early-returns when already running */
const musPoke=()=>{if(musOn)musStart();};
window.addEventListener("pointerdown",musPoke,{passive:true});
window.addEventListener("touchend",musPoke,{passive:true});
window.addEventListener("keydown",musPoke);
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="hidden")musStop();
  else if(musOn&&MUSIC.ctx)musStart();
});
/* ---------- language ---------- */
function applyLang(){
  const t=T();
  $("in1").textContent=t.in1;$("in2").textContent=t.in2;$("in3").textContent=t.in3;$("in4").textContent=t.in4;
  document.querySelectorAll(".classes button").forEach(b=>{
    const pair=t.classes[b.dataset.c];b.querySelector("b").textContent=pair[0];b.querySelector("small").textContent=pair[1];});
  $("crTitle").textContent=t.crTitle;$("lbName").textContent=t.lbName;$("lbOutfit").textContent=t.lbOutfit;
  $("lbShirt").textContent=t.lbShirt;$("lbSkin").textContent=t.lbSkin;$("lbHairC").textContent=t.lbHairC;$("lbHairS").textContent=t.lbHairS;
  $("begin").textContent=t.begin;
  setWorldTag();
  $("openExp").textContent=t.expBtn;$("exTitle").textContent=t.expTitle;$("exHint").textContent=t.expHint;
  /* the reader's look is the pack's choice (mq-v77): READERLOOK="night" for the purple dark paper;
     nothing declared keeps the cream. One class on the sheet; both shells carry both looks. */
  try{const pr=$("paperSheet");if(pr&&typeof READERLOOK==="string"&&/^[a-z]{1,16}$/.test(READERLOOK))pr.classList.add(READERLOOK);}catch(e){}
  {const u=DCU();$("docClose").textContent=u.close||"✕";$("docCopy").textContent=u.copy||"📋";
   $("docDl").textContent=u.dl||"⬇️";if(!$("read").hidden&&!$("world").hidden)checkRead();}
  $("exCopy").textContent=t.expCopy;$("exClose").textContent=t.tlClose;
  $("exTabJson").textContent=t.exTabJson;$("exTabCare").textContent=t.exTabCare;$("exIcs").textContent=t.exIcs;
  $("exTabRep").textContent=t.exTabRep;$("exDl").textContent=t.exDl;
  if(!replayTimer)$("replay").textContent=t.replay;
  $("mapTitle").textContent=t.mapTitle;$("mapClose").textContent=t.tlClose;
  ["Ctl","Look","Self","Sound","Game"].forEach(k=>{const el=$("drw"+k+"Lb");if(el)el.textContent=t["drw"+k]||k;});
  $("setTitle").textContent=t.setTitle;$("lbCtl").textContent=t.lbCtl;
  $("optSwipe").textContent=t.swipeB;$("optJoy").textContent=t.joyB;$("optPad").textContent=t.padB;
  $("lbLang").textContent=t.lbLang;$("lbAdm").textContent=t.lbAdm;$("admOff").textContent=t.admOff;$("admOn").textContent=t.admOn;
  $("lbStakes").textContent=t.lbStakes;$("stkNone").textContent=t.stkNone;$("stkHearts").textContent=t.stkHearts;
  if($("crLooksLb"))$("crLooksLb").textContent=t.crLooksLb||"How you look"; /* #130: the styling half says so */
  $("lbTheme").textContent=t.lbTheme;
  $("lbCam").textContent=t.lbCam;
  if($("lbSeason")){$("lbSeason").textContent=t.lbSeason;seasonRowBuild();}
  /* the camera-turn row only exists where there is a camera to turn */
  if($("lbEase")){const on=typeof T3EASE!=="undefined";
    $("lbEase").hidden=$("easeRow").hidden=!on;
    if(on){$("lbEase").textContent=t.lbEase||"Camera turn";
      const names=t.easeNames||["Instant","Quick","Easy","Slow"];
      document.querySelectorAll("#easeRow button").forEach((b,i)=>{b.textContent=names[i]||b.dataset.ease;
        b.setAttribute("aria-pressed",b.dataset.ease===camEase?"true":"false");});}}
  if($("lbAle")){$("lbAle").textContent=t.lbAle||"Alebrijes";aleRowBuild();}
  document.querySelectorAll("#camRow button").forEach(b=>{
    b.textContent=b.dataset.cam==="top"?t.camTop:b.dataset.cam==="front"?(t.camFront||"⬆ 2.5D")
                 :b.dataset.cam==="3d"?(t.cam3d||"⛰ 3D"):t.camIso;
    b.setAttribute("aria-pressed",b.dataset.cam===camMode?"true":"false");});
  $("lbMusic").textContent=t.lbMusic;
  document.querySelectorAll("#tuneRow button").forEach((b,i)=>{
    b.textContent=t.tunes[i];
    b.setAttribute("aria-pressed",b.dataset.tn===musTune?"true":"false");});
  $("musMute").textContent=musOn?t.musOn:t.musOff;
  $("musVol").value=Math.round(musVol*100);
  document.querySelectorAll("#themeRow button,#thCustom").forEach(b=>b.textContent=t.themes[b.dataset.th]);
  $("teOpen").textContent=t.teOpen;$("teTitle").textContent=t.teTitle;$("teFrom").textContent=t.teFrom;
  $("teModeLb").textContent=t.teModeLb;$("teFix").textContent=t.teFix;$("teClose").textContent=t.tlClose;
  $("openLab").textContent=t.openLab;$("closeSet").textContent=t.closeSet;$("openWd").textContent=t.wdBtn;$("openTp").textContent=t.tpBtn;$("openMp").textContent=t.mpBtn;
  $("tlTitle").textContent=t.tlTitle;$("tlHint").textContent=t.tlHint;$("tlApply").textContent=t.tlApply;$("tlClose").textContent=t.tlClose;
  document.querySelectorAll("#brushes button[data-b] .bl").forEach((el,i)=>el.textContent=t.brushes[i]);
  $("undoBtn").querySelector(".bl").textContent=t.undoLb;
  $("tlSearch").placeholder=t.tlFindPh;
  $("next").textContent=t.nextBack;$("replay").textContent=t.replay;
  $("optEn").setAttribute("aria-pressed",lang==="en"?"true":"false");
  $("optEs").setAttribute("aria-pressed",lang==="es"?"true":"false");
  $("langQuick").textContent=t.langQuick;
  applyText();
  if(!$("world").hidden){applyCtl();checkTalk();}
  if(!$("creator").hidden){buildOpts("rowStyle",t.styles,"style");buildOpts("rowOutfit",t.outfits,"outfit");if(t.patterns)buildOpts("rowPattern",t.patterns,"pattern");}
  if($("lbPattern")){$("lbPattern").textContent=t.lbPattern||"Pattern";$("lbPattern").hidden=!t.patterns;$("rowPattern").hidden=!t.patterns;}
  if(!$("hud").hidden)hud();
  mqStore(SK("lang"),lang);
}
$("optEn").addEventListener("click",()=>{lang="en";applyLang();});
$("optEs").addEventListener("click",()=>{lang="es";applyLang();});
$("langQuick").addEventListener("click",()=>{lang=(lang==="en"?"es":"en");applyLang();});
/* ---------- text lab (edit names, titles, bump lines) ---------- */
function labData(){return {npcNames:{...NPCN[lang]},titles:AQ().map(q=>q.title),flavor:JSON.parse(JSON.stringify(T().flavor))};}
/* JSON.parse keeps a "__proto__" key as an ordinary own property, and Object.assign then SETS it
   — which reaches the prototype setter and hands the target an object it never asked for. The lab
   is the owner pasting into his own machine (#193, low tier), and the cure is one copier both
   sites use rather than a rule everyone has to remember. */
function putAll(dst,src){if(!src||typeof src!=="object")return dst;
  Object.keys(src).forEach(k=>{if(k==="__proto__")return;dst[k]=src[k];});return dst;}
function applyText(){
  try{const o=JSON.parse(localStorage.getItem(SK("text_")+lang)||"null");if(!o)return;
    if(o.npcNames)putAll(NPCN[lang],o.npcNames);
    if(o.titles)AQ().forEach((q,i)=>{if(o.titles[i])q.title=o.titles[i];});
    if(o.flavor)putAll(UI[lang].flavor,o.flavor);
  }catch(e){}
}
$("openLab").addEventListener("click",()=>{
  $("settings").hidden=true;$("tlArea").value=JSON.stringify(labData(),null,1);$("textlab").hidden=false;});
$("tlClose").addEventListener("click",()=>{$("textlab").hidden=true;});
$("tlApply").addEventListener("click",()=>{
  try{const o=JSON.parse($("tlArea").value);
    localStorage.setItem(SK("text_")+lang,JSON.stringify(o));
    applyText();applyLang();$("textlab").hidden=true;toast(T().tlOk,2000);
  }catch(e){toast(T().tlErr,2600);}
});
function tlFindNext(){
  const q=$("tlSearch").value.toLowerCase();if(!q)return;
  const ta=$("tlArea"),v=ta.value,lo=v.toLowerCase();
  let idx=lo.indexOf(q,ta.selectionEnd||0);
  if(idx<0)idx=lo.indexOf(q,0);
  if(idx<0){toast(T().tlNoHit,1400);return;}
  ta.setSelectionRange(idx,idx+q.length);
  ta.blur();ta.focus(); /* blur+focus makes mobile Safari scroll the caret into view */
  const lh=parseFloat(getComputedStyle(ta).lineHeight)||15;
  const cols=Math.max(20,Math.floor(ta.clientWidth/7.2));
  let rows=0;v.slice(0,idx).split("\n").forEach(l=>{rows+=1+Math.floor(l.length/cols);});
  ta.scrollTop=Math.max(0,(rows-4)*lh);
}
$("tlFind").addEventListener("click",tlFindNext);
$("tlSearch").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();tlFindNext();}});
/* ---------- export skeleton (v1): play data → JSON; future: typed docs, email, convo export ---------- */
let dlog=[];try{dlog=JSON.parse(localStorage.getItem(SK("dlog"))||"[]");}catch(e){}
/* choices that advance carry no concept of their own — the node's siblings do */
function nodeConcept(){const n=(curQ&&curQ.nodes[node])||{},c=(n.ch||[]).find(x=>x.out&&x.out.concept);return c?c.out.concept:"";}
function logDecision(o,c){const n=(curQ&&curQ.nodes[node])||{};
  dlog.push({t:Date.now(),quest:curQ.title,qi:cur,npc:curQ.npc,ask:n.q||"",pick:c?c.t:"",
             concept:o.concept||"",why:o.why||"",result:o.r});
  /* the record keeps EVERY decision — it used to be cut to the last 200, which would have
     dropped a player's first districts from the portfolio without a word (owner,
     2026-09-02: "I thought we fixed this 200 entries thing"). If the phone refuses the
     write, the in-memory record stands and the failure is said once, not hidden. */
  /* the play log is the one write that was ALREADY honest about failing — it just told the
     console, which nobody reads. It goes through the same door as everything else now, and it is
     not critical: losing the log costs a record, not an afternoon. */
  if(!mqStore(SK("dlog"),JSON.stringify(dlog))&&!dlogWarned){dlogWarned=true;
    console.warn("RECORD: the phone refused to store the play log ("+dlog.length+" entries) — it stays in memory this session");}}
let dlogWarned=false;
/* WHAT A DISTRICT WAS PRACTICE FOR — "industry · role", in the player's language (❗El giro:
   industry leads, role follows, so five engagements read as five trades and not one title).
   One reader, because it is printed in two places now: the decision report, and the last visit's
   own title (T3, la junta 2026-09-17). A pack that declares neither gets null, and each caller
   decides what to do with nothing rather than this function inventing a word. */
function chTrade(i){const c=CHS()[i];if(!c||!c.role)return null;
  const ind=c.industry&&(c.industry[lang]||c.industry.en);
  return (ind?ind+" · ":"")+(c.role[lang]||c.role.en);}
/* Which job a quest was practice for. Chapters declare their role in content;
   entries logged before roles existed are matched back by title. */
function roleOf(e){
  const L=CHS();
  let qi=typeof e.qi==="number"?e.qi:-2;
  if(qi===-2){const i=AQ().findIndex(q=>q.title===e.quest);qi=i<0?-2:i;}
  if(qi<0)return null;
  for(let i=0;i<L.length;i++)if(L[i].quests.indexOf(qi)>=0&&L[i].role)return chTrade(i);
  return null;
}
/* The decision report: play data → a portfolio document. One section per quest, one
   block per decision point; the latest attempt is the answer of record, and the retry
   count stays visible because the second try is where the learning shows. */
function decisionReport(){
  const t=T(),L=t.repL,d=new Date(),p2=n2=>String(n2).padStart(2,"0");
  const stamp=d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate());
  const out=[t.repHead(heroName,lvlName(),xp,MAXXP,t.grades[gradeAll()-1],stamp),""];
  if(!dlog.length){out.push(t.repEmpty,"","---","*"+L.foot+"*");return out.join("\n");}
  const order=[],by={};
  dlog.forEach(e=>{const k=e.quest||"?";
    if(!by[k]){by[k]={quest:k,npc:e.npc,rows0:e,order:[],nodes:{}};order.push(k);}
    const g=by[k],nk=e.ask||"-";
    if(!g.nodes[nk]){g.nodes[nk]=[];g.order.push(nk);}
    g.nodes[nk].push(e);});
  let points=0,clean=0;
  order.forEach(k=>by[k].order.forEach(nk=>{const r=by[k].nodes[nk];points++;
    if(r.length===1&&r[0].result==="ok")clean++;}));
  out.push(t.repSum(dlog.length,order.length,Math.round(clean/points*100)),"");
  /* roles first: a hiring manager reads the job they are hiring for, then the detail */
  const rOrd=[],rBy={};
  order.forEach(k=>{const g=by[k],r=roleOf(g.rows0)||L.side;
    if(!rBy[r]){rBy[r]={quests:0,calls:0,clean:0,points:0};rOrd.push(r);}
    const a=rBy[r];a.quests++;
    g.order.forEach(nk=>{const rows=g.nodes[nk];a.points++;a.calls+=rows.length;
      if(rows.length===1&&rows[0].result==="ok")a.clean++;});});
  if(rOrd.length){
    out.push("## "+L.roles,"");
    rOrd.forEach(r=>{const a=rBy[r];
      out.push("- **"+r+"** — "+t.repRole(a.calls,a.quests,Math.round(a.clean/a.points*100)));});
    out.push("");}
  const seen=[];
  order.forEach(k=>{
    const g=by[k];
    out.push("## "+g.quest);
    if(g.npc&&NPCN[lang]&&NPCN[lang][g.npc])out.push("","*"+NPCN[lang][g.npc]+"*");
    out.push("");
    g.order.forEach(nk=>{
      const rows=g.nodes[nk],last=rows[rows.length-1],n=rows.length;
      if(nk!=="-")out.push("**"+L.question+":** "+nk);
      if(last.pick)out.push("**"+L.call+":** "+last.pick);
      out.push("**"+L.verdict+":** "+(L[last.result]||last.result)
        +(last.concept?" — *"+last.concept+"*":"")
        +(n>1?"  ("+n+" "+L.attempts+")":""));
      out.push("**"+L.why+":** "+(last.why||L.advanced),"");
      rows.forEach(r=>{if(r.concept&&seen.indexOf(r.concept)<0)seen.push(r.concept);});
    });
  });
  if(seen.length){out.push("## "+L.concepts,"");seen.forEach(c=>out.push("- "+c));out.push("");}
  out.push("---","*"+L.foot+"*");
  return out.join("\n");
}
function exportData(){return JSON.stringify({schema:"meridian-export-v1",exported:new Date().toISOString(),
  player:{name:heroName,class:cls,look},
  progress:{xp,level:lvlName(),stakes:stakesMode(),hearts:livesOn()?hearts:null,
            grade:gradeAll(),marks,questsDone:[...done],location:world},
  frederick:{name:"Frederick",treats,bandana:fredQ>=2,carePackUnlocked:fredQ>=1},
  decisions:dlog,
  futureExportTypes:["decision-report.docx","conversation-export.md","training-transcript.csv"]},null,1);}
/* Frederick's care pack: the secret quest's lesson as a real deliverable —
   a care sheet you can copy, plus recurring reminders as a downloadable .ics */
let exMode="json";
let petCfg={n:"Frederick",am:"07:30",pm:"18:00"};
try{const p=JSON.parse(localStorage.getItem(SK("pet"))||"null");if(p&&p.n)petCfg=p;}catch(e){}
function petSave(){mqStore(SK("pet"),JSON.stringify(petCfg));}
let petEggSeen=null;
["petName","petAm","petPm"].forEach((id,i)=>$(id).addEventListener("input",()=>{
  const v=$(id).value.trim();
  if(i===0)petCfg.n=v||"Frederick";else if(i===1)petCfg.am=v||"07:30";else petCfg.pm=v||"18:00";
  petSave();$("exArea").value=T().carePack(heroName,treats,petCfg);
  if(i===0){const eg=eggFor(petCfg.n); /* name the pet after a legend and the barrio knows */
    if(eg&&eg!==petEggSeen){petEggSeen=eg;toast(eggLines(eg,petCfg.n)[0],3200);}}
}));
function icsData(){
  const now=new Date(),p2=n2=>String(n2).padStart(2,"0");
  const stamp=now.getUTCFullYear()+p2(now.getUTCMonth()+1)+p2(now.getUTCDate())+"T000000Z";
  const day=d=>d.getFullYear()+""+p2(d.getMonth()+1)+p2(d.getDate());
  const month1=new Date(now.getFullYear(),now.getMonth()+1,1);
  const soon=new Date(now.getFullYear(),now.getMonth(),now.getDate()+14);
  const sat=new Date(now.getFullYear(),now.getMonth(),now.getDate()+((6-now.getDay()+7)%7||7));
  const ev=T().careEvents(petCfg.n);
  const rows=[[ev[0],month1,"FREQ=MONTHLY"],[ev[1],soon,"FREQ=WEEKLY;INTERVAL=8"],[ev[2],month1,"FREQ=MONTHLY;INTERVAL=3"],
              [ev[3],soon,"FREQ=YEARLY"],[ev[4],sat,"FREQ=MONTHLY"]];
  return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//"+GN()+"//Care Pack//ES-EN",
    ...rows.flatMap((r,i)=>["BEGIN:VEVENT","UID:mq-care-"+i+"@meridian-quest","DTSTAMP:"+stamp,
      "DTSTART;VALUE=DATE:"+day(r[1]),"RRULE:"+r[2],"SUMMARY:"+r[0],"END:VEVENT"]),
    "END:VCALENDAR"].join("\r\n");
}
function renderExport(){
  $("exArea").value=exMode==="care"?T().carePack(heroName,treats,petCfg)
                   :exMode==="rep"?decisionReport():exMode==="room"?roomSheet():exportData();
  $("exHint").textContent=exMode==="care"?T().careHint:exMode==="rep"?T().repHint:exMode==="room"?(RMU().hint||""):T().expHint;
  $("exTabRoom").setAttribute("aria-pressed",exMode==="room"?"true":"false");
  $("exTabJson").setAttribute("aria-pressed",exMode==="json"?"true":"false");
  $("exTabCare").setAttribute("aria-pressed",exMode==="care"?"true":"false");
  $("exTabRep").setAttribute("aria-pressed",exMode==="rep"?"true":"false");
  $("exIcs").hidden=exMode!=="care";
  $("exDl").hidden=exMode!=="rep";
  $("careForm").hidden=exMode!=="care";
  $("petName").value=petCfg.n;$("petName").placeholder=T().petPh;
  $("petAm").value=petCfg.am;$("petPm").value=petCfg.pm;
}
$("openExp").addEventListener("click",()=>{$("settings").hidden=true;
  $("exTabCare").hidden=fredQ<1;if(fredQ<1)exMode="json";
  /* the room tab exists only when the pack declares an interview; its label is content */
  const rm=!!RM();$("exTabRoom").hidden=!rm;if(rm)$("exTabRoom").textContent=RMU().tab||"";else if(exMode==="room")exMode="json";
  renderExport();$("exporter").hidden=false;});
$("exTabJson").addEventListener("click",()=>{exMode="json";renderExport();});
$("exTabCare").addEventListener("click",()=>{exMode="care";renderExport();});
$("exTabRep").addEventListener("click",()=>{exMode="rep";renderExport();});
$("exTabRoom").addEventListener("click",()=>{exMode="room";renderExport();});
$("exDl").addEventListener("click",()=>{
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([decisionReport()],{type:"text/markdown"}));
  a.download=(heroName.toLowerCase().replace(/[^a-z0-9]+/gi,"-")||"player")+"-decision-report.md";
  document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},400);
});
$("exIcs").addEventListener("click",()=>{
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([icsData()],{type:"text/calendar"}));
  a.download=(petCfg.n.toLowerCase().replace(/[^a-z0-9]+/gi,"-")||"pet")+"-care-reminders.ics";
  document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},400);
});
$("exClose").addEventListener("click",()=>{$("exporter").hidden=true;});
$("exCopy").addEventListener("click",()=>{const v=$("exArea").value;
  (navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(v):Promise.reject())
    .then(()=>toast(T().expCopied,1600))
    .catch(()=>{$("exArea").focus();$("exArea").select();});});
/* ---------- village map: a real town plan drawn from the actual streets ----------
   Tile colours, district labels and the you-are-here dot all come from the content
   pack (MAPCOL / TOWNLBL / MAPDOT). A new business shows up on the plan without a
   line of engine change. */
const BASECOL={"≈":"#4A4B52","-":"#9A9B9E",".":"#D5D2C6","B":"#5C4A50","Q":"#B0563A","F":"#B0895B","G":"#C98A2D","C":"#E0662B","X":"#E7C25A","P":"#3E7C4F","E":"#E0B45C","L":"#E0B45C","O":"#E0B45C","1":"#8A8474","⊓":"#6B6470","◺":"#8A6A3E","≡":"#B9B19D","▲":"#241F2E","▼":"#C6BEAA","2":"#E0B45C","Y":"#C0392B","J":"#639C6C","b":"#D77FA8","g":"#9DBB77"};
/* ---------- worldFlags — everything the world is allowed to know about your play ----------
   One place, handed to content: the town plan's labels read it, and so does any decor that
   changes with what you have done. `grade[id]` is 1-3 once you have answered ANYTHING in a
   district and **0 before that** — gradeOf() alone returns 3 for a district with nothing
   answered (a clean rate over zero calls), so a world reading it raw would paint an untouched
   city as flawless work. Not begun is not the same as done well. */
function worldFlags(){
  const gs=GRW().staged,L=CHS();
  const f={stage:gs?gs.quests.filter(i=>done.has(i)).length:0,ribbon:ribbonUp(),up:{},grade:{},closed:{},answered:{}};
  ribbons().forEach(r=>{if(r.id)f.up[r.id]=ribbonUp(r);}); /* one flag PER storefront, by the pack's own id */
  L.forEach((c,i)=>{const n=(c.quests||[]).filter(q=>done.has(q)).length;
    f.answered[c.id]=n;
    f.grade[c.id]=n?gradeOf(c):0;
    f.closed[c.id]=chSeen>i;});
  return f;
}
/* ---------- who is waiting, on the plan — and a destination you choose ----------
   #160, and the owner on 2026-09-15: "i like a hybrid approach, wehre i can choose my destination,
   and i like the marking of people with quests in different colors but its hard to tell unless you
   have a legend." The plan is docs/meetings/2026-09-14-el-mapa.md §7, and it says what a colour is
   allowed to mean here: WHICH KIND of person is waiting — never how many, how old, or how far
   through. A colour that counts is a list with the names removed (ARCH-LOG A3), and the mark that
   means one thing forever (OWNER.md) is the one the street already draws.
   Colour never travels alone: about one man in twelve cannot separate these hues, so every kind
   also carries its own SHAPE and the legend names both (WCAG 1.4.1 — and his own sentence).
   A pack OPTS IN with MAPMARK, whose ORDER is which kind wins when a person is more than one at
   once. No declaration, no marks: `hasSay`'s third clause — a document to hand you — never fires
   in Meridian and fires on every neighbour the town places, so a rule that lit every district
   would not be the same game for both packs. */
const MARKS={
  work:{c:"#E0662B",sh:"disc"},    /* somebody here has work for you — the street's own ❗, on the plan */
  host:{c:"#E8B94A",sh:"diamond"}, /* the host of this room still has a question for you.
    #E0A430 shipped first and was wrong by this project's own floor: luma 168.7 against work's 131.8
    is Δ37, under 40, so in greyscale the two marks leaned on their shapes alone. #E8B94A is 186.4 —
    Δ54.6 from work and Δ46.7 from the plan's own paper, clear both ways (Pili's rule, measured). */
  read:{c:"#F2E6C6",sh:"card"}     /* something to read — the cream card the rooms already draw */
};
const markKinds=()=>((typeof MAPMARK!=="undefined"&&Array.isArray(MAPMARK))?MAPMARK:[]).filter(k=>MARKS[k]);
function markOf(n){ /* one person, one kind, in the order the pack declared */
  const K=markKinds();if(!K.length||!n)return null;
  const has={work:pendingAt(n)!==undefined,host:roomPending(n),read:!!n.doc};
  return K.find(k=>has[k])||null;}
/* Every mark the plan can carry: the people standing on the world it draws, and the anchor of
   every other world somebody is waiting in. Several worlds share an anchor — pa, li and ex all
   stand at 29,1 — so an anchor carries ONE mark and remembers every world folded into it. */
/* A MARK CARRIES TWO PLACES AND THEY ARE NOT THE SAME NUMBER.
     · `x,y,w` — where the thing actually IS, in its own world. `destAim()` reads these and the
       street arrow points at them, so they must never be paper coordinates.
     · `gx,gy` — where it is DRAWN on the plan. The plan is paper and the paper has panels on it.
   They were identical while the plan drew one world at 0,0, which is why one field did both jobs
   and why the day a second panel appeared was the day the arrow would have started lying. */
/* ---------- WHERE A WORLD IS, ON THE PLAN (owner, 2026-09-17: "5. yeah i mean a map implies this") ----------
   Asked whether an interior belongs on a street map at all, that was his whole answer, and he is
   right: a map that cannot say where a place is is a picture of a street.

   A world is somewhere on the plan for one of three reasons, in this order:
     · the plan DRAWS it (TOWNPLAN gives it a panel and an offset);
     · a door leads into it from somewhere already placed — so an interior sits at its own address,
       which is exactly how a real map shows a shop. FOLLOWED RECURSIVELY, which is the part that was
       missing: `f2` is reachable only from `hq`, and `hq` is not drawn, so one hop found nothing and
       the pack had to write the answer down by hand;
     · the pack names a spot itself (MAPDOT) — for a place with no door at all. The park is the only
       one in this city: you reach it on a leash, not through a door, and no derivation can ever
       find it.
   MEASURED when this was written: every single hand-typed MAPDOT — hq, f2, lo, me, lc, ta, no —
   agreed exactly with what the doors already said, so all seven were copies of a fact the map
   already had. Five more worlds (pa, li, casa-w, caseta, barberia) were derivable and had no dot at
   all. A guard now holds a declared dot to the derived one, because the failure mode of a written-
   down copy is that the door moves and the copy does not. */
function planPlace(id,seen,pure){ /* pure: the doors ONLY, with the pack's own declarations ignored — how a guard asks whether a written-down spot is a copy or the only thing holding a world on the map */
  const panels=planPanels(),drawn=panels.find(p2=>p2.world===id);
  if(drawn)return {gx:drawn.ox,gy:drawn.oy,x:0,y:0,via:"drawn",panel:true};
  seen=seen||{};if(seen[id])return null;seen[id]=1;
  let best=null;
  Object.keys(WORLDS).forEach(from=>{
    if(best||from===id)return;
    (typeof portalsOf==="function"?portalsOf(from):[]).forEach(d=>{
      if(best||!d.p||d.p.to!==id)return;
      const home=planPlace(from,seen,pure);if(!home)return;
      /* A DOT HAS NO INSIDE. Adding the door's tile to a host that is DRAWN is right — the host's
         ox,oy is a panel origin and the door sits at a place on that paper. Adding it to a host
         that is itself only a dot is nonsense, and the first draft did exactly that: `f2` is
         reached from hq(14,14), hq is a dot at (14,0), and f2 landed at (28,14) — a spot on the
         street with no building under it. A world behind a world shares its address, which is also
         true of the thing being modelled: the second floor of the office IS the office. */
      best=home.panel?{gx:d.x+home.gx,gy:d.y+home.gy,x:d.x,y:d.y,via:from,panel:false}
                     :{gx:home.gx,gy:home.gy,x:home.x,y:home.y,via:from+" (behind it)",panel:false};});});
  if(best)return best;
  if(pure)return null;
  const M=(typeof MAPDOT!=="undefined"?MAPDOT:{});
  if(M[id])return {gx:M[id][0],gy:M[id][1],x:M[id][0],y:M[id][1],via:"declared",panel:false};
  return null;}
function planMarks(){
  const K=markKinds();if(!K.length)return[];
  const M=(typeof MAPDOT!=="undefined"?MAPDOT:{}),out=[],at={},panels=planPanels();
  const drawn={};panels.forEach(p2=>{drawn[p2.world]=p2;});
  /* 1 · anybody standing on a world the plan actually draws is drawn where they stand */
  panels.forEach(p2=>{((WORLDS[p2.world]||{}).npcs||[]).forEach(n=>{const k=markOf(n);
    if(k)out.push({x:n.x,y:n.y,gx:n.x+p2.ox,gy:n.y+p2.oy,k:k,w:p2.world,ws:[p2.world],who:n.npc});});});
  /* 2 · every other world is an ANCHOR on somebody else's paper: the pack's MAPDOT if it names
         one, else the door that leads there from a world the plan draws — which is how La Espiga
         and Velázquez find their place on Calle Dos without a pack having to write the offset
         down twice and keep the two copies agreeing. */
  Object.keys(WORLDS).forEach(id=>{
    if(drawn[id]||!WORLDS[id])return;
    let best=null;
    (WORLDS[id].npcs||[]).forEach(n=>{const k=markOf(n);
      if(k&&(!best||K.indexOf(k)<K.indexOf(best)))best=k;});
    if(!best)return;
    const at2=planPlace(id);if(!at2)return;             /* one reader now: doors first, the pack's own spot only where no door can say */
    const gx=at2.gx,gy=at2.gy,wx=at2.x,wy=at2.y;
    const key=gx+","+gy,e=at[key];
    if(e){e.ws.push(id);if(K.indexOf(best)<K.indexOf(e.k))e.k=best;return;}
    at[key]={x:wx,y:wy,gx,gy,k:best,w:id,ws:[id]};out.push(at[key]);});
  return out;}
function drawMark(g,cx,cy,k,r){ /* ONE painter, two surfaces: the plan and its own legend, so a
                                   swatch can never drift from the mark it explains */
  const m=MARKS[k];if(!m)return;
  /* IT SITS ON THE PAPER. A shape with no shadow at this size is a stain on the map; one soft
     ellipse under it and it is a pin somebody put there — the cheapest thing in the whole light
     model and the one that does the most (docs/BEAUTIFY.md, 2026-09-15). */
  g.save();g.fillStyle="rgba(58,44,20,.26)";
  g.beginPath();g.ellipse(cx+r*0.16,cy+r*0.62,r*0.92,r*0.38,0,0,7);g.fill();g.restore();
  /* ---- A MARK SAYS WHAT IT IS, AND AT NINE PIXELS THAT MEANS SILHOUETTE ----
     Owner, 2026-09-16: "the squares/dots for people are garbage, we really cant improve this so i
     can tell what things are?" He is right, and the arithmetic says why: `r` is `s*0.45` on a ten
     pixel tile, so `work` was a nine-pixel disc carrying an exclamation mark ONE AND A HALF PIXELS
     wide. Nothing was ever going to be legible inside it. Two of the three were the same idea —
     a coloured blob with a tiny tick — separated by a shape nobody could name.
     So the interior detail is gone and the OUTLINE carries the meaning, which is the only thing
     that survives at this size: somebody to see is a PERSON, somebody with a question is a SPEECH
     BUBBLE, something to read is a CARD. Three silhouettes you could tell apart in a thumbnail, in
     greyscale, or with the colour knocked out — which is the repo's own rule (`el-mapa` §7: colour
     never alone, every colour also differs in shape) finally being worth something.
     The colours are untouched: they were measured to Δ40 luma and that work still holds. */
  g.save();g.lineWidth=Math.max(1.2,r*0.30);g.strokeStyle="#FFF9EC";  /* a pale keyline, so it reads on paper OR on a dark building */
  g.fillStyle=m.c;
  const path=()=>{
    g.beginPath();
    if(m.sh==="disc"){                                  /* A PERSON: head and shoulders */
      g.arc(cx,cy-r*0.42,r*0.46,0,7);g.closePath();
      g.moveTo(cx-r*0.82,cy+r*1.02);
      g.quadraticCurveTo(cx-r*0.78,cy+r*0.1,cx,cy+r*0.1);
      g.quadraticCurveTo(cx+r*0.78,cy+r*0.1,cx+r*0.82,cy+r*1.02);
      g.closePath();
    }else if(m.sh==="diamond"){                         /* A SPEECH BUBBLE: somebody is asking you something */
      const w=r*1.9,h=r*1.45,x0=cx-w/2,y0=cy-h/2-r*0.16,rr=r*0.42;
      if(g.roundRect)g.roundRect(x0,y0,w,h,rr);else g.rect(x0,y0,w,h);
      g.moveTo(cx-r*0.46,y0+h);g.lineTo(cx-r*0.1,y0+h+r*0.78);g.lineTo(cx+r*0.28,y0+h);g.closePath();
    }else{                                              /* A CARD: a page with a folded corner */
      const w=r*1.7,h=r*2.0,x0=cx-w/2,y0=cy-h/2,f=r*0.55;
      g.moveTo(x0,y0);g.lineTo(x0+w-f,y0);g.lineTo(x0+w,y0+f);g.lineTo(x0+w,y0+h);
      g.lineTo(x0,y0+h);g.closePath();
    }
  };
  path();g.stroke();                                    /* the pale outline goes UNDER the fill, so it is a halo */
  path();g.fill();
  g.lineWidth=Math.max(0.8,r*0.16);g.strokeStyle="rgba(43,37,54,.75)";
  path();g.stroke();                                    /* and a dark keyline inside it: legible on cream paper too */
  if(m.sh==="card"){                                    /* two ruled lines, which is what makes a card a PAGE */
    g.strokeStyle="rgba(43,37,54,.45)";g.lineWidth=Math.max(0.7,r*0.14);
    [-0.18,0.28].forEach(f=>{g.beginPath();g.moveTo(cx-r*0.5,cy+r*f);g.lineTo(cx+r*0.5,cy+r*f);g.stroke();});}
  g.restore();}
let mapDest=null; /* {w,x,y} — ONE at a time, and never saved. A destination is what you are doing
                     right now; a saved one is the list A3 bans, wearing a compass. */
function drawPlanMarks(g2,s){
  /* while one mark is chosen the others step back, because "this one" is only visible against
     "not those" — the half of legibility that is always left out (owner, 2026-09-16) */
  const chosen=mapDest?(mapDest.gx+","+mapDest.gy):null;
  planMarks().forEach(m=>{const here=chosen===(m.gx+","+m.gy);
    if(here)return;                                     /* the chosen one is drawn last, on its flag */
    g2.save();if(chosen)g2.globalAlpha=0.38;
    drawMark(g2,m.gx*s+s/2,m.gy*s+s/2,m.k,s*0.56);      /* gx,gy: this is paper */
    g2.restore();});
  if(!mapDest)return;
  /* the ring is the destination HE chose. Nothing here nominates a "next" — that was the one call
     the plan left open and his hybrid answered it (el-mapa §7.3). */
  /* ---- AND YOU CAN SEE THAT YOU TAPPED IT (owner, 2026-09-16) ----
     "the map says tap a mark, but cannot tell if a mark is tapped." He was right twice over. The
     confirmation was a TWO-PIXEL RING in #7A3FE0 — which is the same purple as the you-are-here
     dot, so on the one occasion it did catch the eye it said "here" rather than "going there", and
     the only other feedback was a caption under the canvas he was not looking at.
     A tap now answers on the map itself, in three ways that survive a small screen: the chosen mark
     stands on a FLAG whose pole reaches the ground, it sits in a filled disc so it separates from
     the paper whatever is behind it, and every other mark on the plan is dimmed. The last one is
     the cheap half of legibility and the half that is always forgotten — "this one" is only ever
     visible against "not those". */
  const cx=(mapDest.gx===undefined?mapDest.x:mapDest.gx)*s+s/2,
        cy=(mapDest.gy===undefined?mapDest.y:mapDest.gy)*s+s/2;
  g2.save();
  const R=s*0.86;
  g2.fillStyle="rgba(122,63,224,.16)";                       /* a soft field, so the eye lands here first */
  g2.beginPath();g2.arc(cx,cy,R*1.5,0,7);g2.fill();
  g2.strokeStyle="rgba(58,44,20,.30)";g2.lineWidth=Math.max(2,s*0.22);  /* the pole, and its shadow */
  g2.beginPath();g2.moveTo(cx+1,cy+1);g2.lineTo(cx+1,cy-R*2.1+1);g2.stroke();
  g2.strokeStyle="#4A2A8E";g2.lineWidth=Math.max(1.4,s*0.16);
  g2.beginPath();g2.moveTo(cx,cy);g2.lineTo(cx,cy-R*2.1);g2.stroke();
  g2.fillStyle="#7A3FE0";                                     /* the flag itself */
  g2.beginPath();g2.moveTo(cx,cy-R*2.1);g2.lineTo(cx+R*1.5,cy-R*1.72);
  g2.lineTo(cx,cy-R*1.34);g2.closePath();g2.fill();
  g2.fillStyle="rgba(255,255,255,.34)";
  g2.beginPath();g2.moveTo(cx,cy-R*2.1);g2.lineTo(cx+R*1.5,cy-R*1.72);g2.lineTo(cx,cy-R*1.9);g2.closePath();g2.fill();
  g2.fillStyle="#F4F1EA";                                     /* the disc the mark stands in */
  g2.beginPath();g2.arc(cx,cy,R,0,7);g2.fill();
  g2.lineWidth=Math.max(2,s*0.22);g2.strokeStyle="#7A3FE0";
  g2.beginPath();g2.arc(cx,cy,R,0,7);g2.stroke();
  g2.restore();
  drawMark(g2,cx,cy,mapDest.k||((planMarks().find(m=>m.gx===mapDest.gx&&m.gy===mapDest.gy)||{}).k),s*0.56);}
/* The legend is REAL TEXT under the plan, built here rather than in the shell so a pack gets it
   without touching its own index.html. The line it stands beside is drawn at 8 canvas pixels —
   about 7.5 CSS px on a phone — which is what "its hard to tell" measures like. */
/* ---- THE LEGEND OPENS ITSELF ONCE, THEN GETS OUT OF THE WAY ----
   Owner, 2026-09-15, choosing between three: the key is open the FIRST time you see the plan and
   collapses to an `i` after that, and what you leave it as is what you get next time.
   The reason that shape and not "always open" is the phone: the plan is already the tightest thing
   in the game at 390px, and a key that is permanently three rows tall is three rows the map does
   not have. The reason it is not "behind an `i` from the start" is his own sentence — "its hard to
   tell unless you have a legend" — which is about the FIRST time, and a key you have to discover
   is no key at all on the one occasion it was needed. */
let legOpen=null;
function legSeen(){
  if(legOpen===null){let v=null;try{v=localStorage.getItem(SK("leg"));}catch(e){}
    legOpen=(v===null)?true:(v==="1");}                 /* never seen it → it opens itself */
  return legOpen;}
function legSet(v){legOpen=!!v;mqStore(SK("leg"),v?"1":"0");}
function mapLegend(){
  const host=$("mapNote");if(!host||!markKinds().length)return; /* a pack that declares no kinds
    gets no legend and no element: the town's plan is the same object it was yesterday */
  let box=$("mapLeg");
  if(!box){box=document.createElement("div");box.id="mapLeg";
    box.style.cssText="display:flex;flex-wrap:wrap;gap:8px 14px;margin:8px 0 0;align-items:center;font-size:.8rem;";
    host.parentNode.insertBefore(box,host);}
  /* IN THE ORDER THE PACK DECLARED THEM, not the order they happen to stand on the street. The
     first render read "has a question about this room" above "has work for you" because a host
     happened to be nearer the top of the map that minute — so the key re-ordered itself between
     openings, which is the one thing a key may never do. */
  const seen={},K=markKinds();
  planMarks().forEach(m=>{seen[m.k]=1;});
  const drawn=K.filter(k=>seen[k]);
  const t=(T().plan||{});
  box.innerHTML="";box.hidden=!drawn.length;
  if(!drawn.length)return;
  const open=legSeen();
  const tog=document.createElement("button");tog.id="mapLegTog";tog.type="button";
  tog.textContent=open?"i\u00A0\u2715":"i";
  tog.setAttribute("aria-expanded",open?"true":"false");
  tog.setAttribute("aria-label",t.key||"key");
  tog.style.cssText="flex:0 0 auto;min-width:26px;height:26px;border-radius:999px;cursor:pointer;"+
    "border:1.5px solid var(--line,#C9C3B4);background:var(--bg,#F2F1EA);color:inherit;"+
    "font:600 12px/1 ui-monospace,monospace;padding:0 7px;";
  tog.addEventListener("click",()=>{legSet(!legSeen());mapLegend();});
  box.appendChild(tog);
  if(!open){                                            /* collapsed: the key is one button */
    const hint=document.createElement("span");
    hint.style.cssText="opacity:.62;font-size:.75rem;";
    hint.textContent=t.key||"";box.appendChild(hint);return;}
  drawn.forEach(k=>{
    const row=document.createElement("span");row.setAttribute("data-kind",k);
    row.style.cssText="display:inline-flex;align-items:center;gap:6px;";
    const cv=document.createElement("canvas");cv.width=20;cv.height=20;cv.style.cssText="width:20px;height:20px;";
    drawMark(cv.getContext("2d"),10,10,k,6);
    row.appendChild(cv);row.appendChild(document.createTextNode(t[k]||k));
    box.appendChild(row);});}
function mapPick(tx,ty){ /* tile coords, fractional — it is a finger, not a cursor */
  let best=null,bd=1e9;
  /* the finger is on PAPER, so the hit test is against gx,gy — and what gets STORED is the
     world position, because that is what the street arrow will be pointed at */
  planMarks().forEach(m=>{const dx=m.gx+0.5-tx,dy=m.gy+0.5-ty,d=dx*dx+dy*dy;if(d<bd){bd=d;best=m;}});
  if(!best||bd>9)return false;  /* three tiles ≈ 30 canvas px ≈ a fingertip; a miss changes nothing */
  mapDest=(mapDest&&mapDest.w===best.w&&mapDest.x===best.x&&mapDest.y===best.y)
    ?null:{w:best.w,x:best.x,y:best.y,gx:best.gx,gy:best.gy,who:best.who||null};
  drawTown();setWorldTag();
  const t=(T().plan||{});
  mapNoteSet();
  return true;}
/* The bearing: a DIRECTION, never a lit path — Elden Ring's Guidance of Grace is the shape of it
   (el-mapa §7.3, and the sweep's sources). If the place is on this world, point at it; if it is
   behind a door on this world, point at the door; otherwise it is a tram ride and the tag says so. */
const BEARS=["↑","↗","→","↘","↓","↙","←","↖"];
/* What to call the place you are heading for. A mark standing on the world you can SEE is a
   person, and "Meridian Street" is not what you would call him when you are already standing on
   Meridian Street — the first render of this said exactly that, and looked ridiculous. */
function destName(){
  if(!mapDest)return "";
  return (mapDest.who&&npcName(mapDest.who))||(T().locs||{})[mapDest.w]||"";}
/* WHERE TO POINT, computed ONCE and read by both surfaces — the tag under the plan and the arrow
   in the street. Two copies of this arithmetic is how one of them ends up pointing somewhere the
   other does not, and the whole value of a bearing is that it does not lie. */
function destAim(){
  if(!mapDest)return null;
  if(mapDest.w===world){
    if(Math.abs(mapDest.x-px)<=1&&Math.abs(mapDest.y-py)<=1)return {mode:"here"};
    return {mode:"go",tx:mapDest.x,ty:mapDest.y};}
  let bd=1e9,tx=null,ty=null;
  portalsOf(world).forEach(p=>{if(!p.p||p.p.to!==mapDest.w)return;
    const dx=p.x-px,dy=p.y-py,d=dx*dx+dy*dy;if(d<bd){bd=d;tx=p.x;ty=p.y;}});
  if(tx!==null)return {mode:"door",tx,ty};
  /* no door on this world leads there, so it is a tram ride — and the tram STOP is a place you can
     be pointed at. Pointing at nothing and saying "take the tram" is the answer that leaves you
     standing where you were. */
  const w=CW();let sd=1e9,sx2=null,sy2=null;
  for(let y=0;y<w.H;y++)for(let x=0;x<w.W;x++){
    if(((TILES[w.rows[y][x]]||{}).kind)!=="transit")continue;
    const dx=x-px,dy=y-py,d=dx*dx+dy*dy;if(d<sd){sd=d;sx2=x;sy2=y;}}
  return sx2===null?{mode:"ride"}:{mode:"tram",tx:sx2,ty:sy2};}
const aimAngle=a=>Math.atan2(a.tx-px,-(a.ty-py));   /* radians clockwise from world north */
function destBearing(){
  if(!mapDest)return "";
  const name=destName(),a=destAim();
  if(!a)return "";
  if(a.mode==="ride")return "  ·  🚋 "+name;
  if(a.mode==="here")return "  ·  ◉ "+name;
  const i=((Math.round(aimAngle(a)/(Math.PI/4))%8)+8)%8;
  return "  ·  "+BEARS[i]+" "+name;}
/* ---- AND THE SAME BEARING IN THE STREET (owner, 2026-09-15: "bearing lets try 2") ----
   He chose the option the crew advised against, and the crew's objection was about CORNER MINIMAPS
   — a second screen you read instead of the place. This is one arrow on a destination YOU picked,
   it exists only while you have picked one, and it is gone the moment you arrive.
   IT IS DOM, NOT CANVAS, and that is the whole reason it works in all four cameras: the 3D view
   renders to its own WebGL canvas, so anything painted into the 2D context is simply not there in
   3D. A pill inside .viewport (which is already position:relative) sits over whichever canvas is
   showing. The engine builds it, like mapLegend, so no pack edits its own index.html.
   The arrowhead is a CSS triangle and not a glyph — today's lesson from the quest marker, which
   spent its whole life being painted by the device's emoji font in a colour nobody chose. */
let bearLast="",bearPos="";
function bearingUI(){
  const vp=$("vp");if(!vp)return;
  let el=document.getElementById("bearNav");
  const a=mapDest?destAim():null;
  const show=!!a&&a.mode!=="here";
  if(!show){if(el)el.hidden=true;bearLast="";return;}
  if(!el){
    el=document.createElement("div");el.id="bearNav";
    el.style.cssText="position:absolute;z-index:4;display:flex;align-items:center;gap:6px;"+
      "padding:4px 10px 4px 7px;border-radius:999px;background:rgba(20,16,28,.74);color:#F2F1EA;"+
      "font:600 11px/1 ui-monospace,ui-monospace,monospace;pointer-events:none;white-space:nowrap;"+
      "transform:translate(-50%,-50%);box-shadow:0 0 0 1.5px rgba(242,241,234,.22);";
    const tip=document.createElement("i");tip.id="bearTip";
    tip.style.cssText="display:block;width:0;height:0;border-left:5px solid transparent;"+
      "border-right:5px solid transparent;border-bottom:9px solid #E0B45C;";
    const lbl=document.createElement("span");lbl.id="bearLbl";
    lbl.style.cssText="max-width:38vw;overflow:hidden;text-overflow:ellipsis;";
    el.appendChild(tip);el.appendChild(lbl);vp.appendChild(el);}
  el.hidden=false;
  const name=destName();
  if(a.mode==="ride"){                                  /* nowhere to point: say so and stop */
    const key="ride|"+name;
    if(key!==bearLast){bearLast=key;
      document.getElementById("bearTip").style.display="none";
      document.getElementById("bearLbl").textContent=((T().plan||{}).ride||"tram")+" · "+name;
      el.style.left="50%";el.style.top="8%";}
    return;}
  document.getElementById("bearTip").style.display="block";
  /* the world angle, turned into a SCREEN angle. In 3D the camera swings around the hero, so world
     north is only screen-up at yaw 0 — an arrow that ignored that would point confidently at the
     wrong wall three turns out of four. */
  let th=aimAngle(a);
  if(camMode==="3d"&&typeof T3!=="undefined"&&T3&&typeof T3.yaw==="number")th-=T3.yaw;
  const sn=Math.sin(th),cs=-Math.cos(th);
  const deg=Math.round(th*180/Math.PI);
  const key=name+"|"+deg;
  const VWp=vp.clientWidth||1,VHp=vp.clientHeight||1;
  if(key!==bearLast){                                    /* the words only change when the place does */
    document.getElementById("bearTip").style.transform="rotate("+deg+"deg)";
    document.getElementById("bearLbl").textContent=name;}
  /* PUT IT ON THE EDGE THE ARROW POINTS AT — then keep the whole pill inside the frame.
     The first version placed the CENTRE on the edge with a flat percentage inset, and the first
     look at it had "Floor 2 · Your office" hanging 66 px off the right of a 372 px viewport: a
     pill's inset is its own half-width, which is not a constant, because the name is not. Measured
     from the element, clamped in pixels, and the label is capped so a long name can never take the
     screen: a bearing that covers the street is not a bearing. */
  const halfW=(el.offsetWidth||90)/2+6,halfH=(el.offsetHeight||20)/2+6;
  const tX=Math.abs(sn)<1e-6?1e9:(VWp/2-halfW)/Math.abs(sn),
        tY=Math.abs(cs)<1e-6?1e9:(VHp/2-halfH)/Math.abs(cs);
  const t=Math.max(0,Math.min(tX,tY));
  const Lp=Math.max(halfW,Math.min(VWp-halfW,VWp/2+sn*t)),
        Tq=Math.max(halfH,Math.min(VHp-halfH,VHp/2+cs*t));
  const pos=Math.round(Lp)+"|"+Math.round(Tq);
  if(key===bearLast&&pos===bearPos)return;               /* only touch the DOM when it moved */
  bearLast=key;bearPos=pos;
  el.style.left=Lp.toFixed(1)+"px";el.style.top=Tq.toFixed(1)+"px";}
function destCheck(){ /* you arrived: the destination is spent, and nothing remembers it */
  if(mapDest&&mapDest.w===world&&Math.abs(px-mapDest.x)<=1&&Math.abs(py-mapDest.y)<=1)mapDest=null;
  setWorldTag();bearingUI();}
/* ═══════════ TOWNPLAN — the plan draws every street, not one (el-mapa §3, run-8 §2.5) ═══════════
   Reported from play, 2026-09-16: *"im shown the other street map on calle 2."* He was standing on
   Calle Dos and the plan drew Calle Principal, with a pin in the corner saying CALLE DOS — the
   caption knew where he was while the picture showed somewhere else.

   The cause was one word: `WORLDS[PL.street]`. A pack could declare exactly ONE world as "the map",
   and every other outdoor world in the city had to be represented by a dot on it. That is right for
   an interior — you are inside the market, so the pin sits on the market's door — and wrong for a
   second STREET, which is not a room off the first one.

   `TOWNPLAN=[{world,ox,oy},…]` is the pack saying which worlds the plan draws and where they sit on
   the paper, in tiles. The LOOP is the engine's and the LAYOUT is the pack's, which is the split
   docs/TAGS.md asks of every seam. **A pack that declares no TOWNPLAN draws PL.street at 0,0 and is
   byte-identical** — the town and the gauge never notice this happened.

   THE ONE TRAP, and it is the reason marks carry two coordinate pairs. `mapDest` is read by
   `destAim()` as a position IN A WORLD: it compares against `px,py` and hands `tx,ty` to the
   bearing. The plan draws in PAPER coordinates. Today those are the same numbers because there is
   one panel at 0,0, and the day a second panel exists they stop being the same — silently, with
   the arrow in the street pointing at a place seventeen tiles north of the real one. So a mark now
   carries `x,y,w` (where the thing IS, unchanged) and `gx,gy` (where it is DRAWN), and nothing is
   allowed to use one for the other. */
/* ═══════════ THE PLAN IS A MAP, NOT A HEAT MAP (owner, 2026-09-16) ═══════════
   "the squares/dots for people are garbage, we really cant improve this so i can tell what things
   are?" — and the inventory says exactly why. Of the 29 glyphs on Meridian's plan:
     · 133 tiles of `F` were one solid #B0895B square each, so the crew pen and every hoarding came
       out as a brown MASS with no shape to it;
     ·   9 trees were green squares, indistinguishable from any other green square;
     ·   8 glyphs — a desk, a chair, a stove, a counter — had no colour at all and fell through to
       the OPEN-GROUND fill, so they were drawn as floor. Invisible, silently, for as long as the
       plan has existed.
   A tile was one flat fill and nothing else, which is a data visualisation of a city and not a map
   of one — the same fault `docs/BEAUTIFY.md` records about the paper, one layer in.

   So a tile is now drawn by WHAT IT IS. The engine already knows: `TILES[g].kind`. Symbols are read
   off the kind, never off the glyph, so a second world gets them for free and Meridian's letters
   stay Meridian's. A pack's MAPCOL still chooses every colour; this chooses the SHAPE.
   Two rules that do most of the work:
     · a FENCE is a line, not a block — it is a thing you cannot cross, not a thing that fills a
       square, and drawing it as a block is what turned a yard into a slab;
     · nothing falls through to the ground colour. A tile the pack never coloured is still a THING,
       and it gets the unknown-object mark rather than being painted as floor. */
const PLANINK="#3A2F17";
function planTile(g2,ww,x,y,sx,sy,s,col){
  const g=ww.rows[y][x], t=TILES[g]||{}, kind=t.kind||null;
  const named=col[g], ground=col["."]||"#D5D2C6";
  const at=(ax,ay)=>((ww.rows[ay]||"")[ax])||"";
  const sameKind=(ax,ay)=>{const k=(TILES[at(ax,ay)]||{}).kind;return !!k&&k===kind;};
  const ink=(a)=>{g2.fillStyle="rgba(58,47,23,"+a+")";};
  /* WHICH TILES GET A SYMBOL, and it is not "all of them" — the first draft drew an object on every
     tile that had no handled kind, and Meridian's canal is 75 tiles of `≈` with no kind at all, so
     a river came out as seventy-five little grey boxes. Worse than the squares it replaced.
     The rule that works: a glyph the pack gave a COLOUR is an AREA the pack has already decided how
     to show — water, road, pavement, a building — and it keeps its fill. A glyph with NO colour is
     a thing nobody ever thought about on this map, and those are the eight that were being painted
     as open floor. Symbols go to the kinds named below, which are things, not areas. */
  const SYMBOLIC={tree:1,nature:1,fence:1,transit:1,site:1,marker:1,furniture:1,appliance:1};
  if(!SYMBOLIC[kind]){                                  /* an area: exactly what the plan drew before */
    g2.fillStyle=named||(kind==="water"?"#4A4B52":ground);g2.fillRect(sx,sy,s,s);
    if(kind==="water"||g==="≈"){                        /* two ripples, so a canal is not a slab */
      g2.strokeStyle="rgba(255,255,255,.16)";g2.lineWidth=Math.max(0.7,s*0.07);
      [0.38,0.7].forEach(f=>{g2.beginPath();g2.moveTo(sx,sy+s*f);
        g2.quadraticCurveTo(sx+s*0.5,sy+s*(f-0.14),sx+s,sy+s*f);g2.stroke();});}
    if(!named&&g!=="."){                                /* no colour and no kind: a thing, drawn as one */
      g2.fillStyle="#A79B86";g2.fillRect(sx+s*0.26,sy+s*0.3,s*0.48,s*0.42);
      g2.fillStyle="rgba(255,255,255,.26)";g2.fillRect(sx+s*0.26,sy+s*0.3,s*0.48,Math.max(0.8,s*0.1));
      ink(.40);g2.fillRect(sx+s*0.26,sy+s*0.7,s*0.48,Math.max(0.8,s*0.09));}
    return;}
  g2.fillStyle=ground;g2.fillRect(sx,sy,s,s);           /* a thing stands ON the street, not in a tile of its own */

  if(kind==="fence"){                                   /* A LINE, NOT A BLOCK — the one that fixes 133 tiles */
    const ew=sameKind(x-1,y)||sameKind(x+1,y), ns=sameKind(x,y-1)||sameKind(x,y+1);
    g2.strokeStyle=named||"#8A6A3E";g2.lineWidth=Math.max(1.3,s*0.17);g2.lineCap="round";
    g2.beginPath();
    if(ew&&!ns){g2.moveTo(sx,sy+s/2);g2.lineTo(sx+s,sy+s/2);}
    else if(ns&&!ew){g2.moveTo(sx+s/2,sy);g2.lineTo(sx+s/2,sy+s);}
    else if(ew&&ns){g2.moveTo(sx,sy+s/2);g2.lineTo(sx+s/2,sy+s/2);g2.lineTo(sx+s/2,sy+s);}
    else{g2.moveTo(sx+s*0.2,sy+s/2);g2.lineTo(sx+s*0.8,sy+s/2);}
    g2.stroke();g2.lineCap="butt";g2.lineWidth=1;return;}

  if(kind==="tree"||kind==="nature"){                   /* a canopy and a trunk: it reads at ten pixels */
    ink(.30);g2.fillRect(sx+s*0.45,sy+s*0.52,Math.max(1,s*0.12),s*0.34);
    g2.fillStyle=named||"#639C6C";
    g2.beginPath();g2.arc(sx+s*0.5,sy+s*0.42,s*0.30,0,7);g2.fill();
    g2.fillStyle="rgba(255,255,255,.22)";
    g2.beginPath();g2.arc(sx+s*0.42,sy+s*0.34,s*0.12,0,7);g2.fill();return;}

  if(kind==="transit"){                                 /* a rail: two sleepers across the lane */
    g2.strokeStyle=named||"#C0392B";g2.lineWidth=Math.max(1,s*0.13);
    g2.beginPath();g2.moveTo(sx+s*0.5,sy);g2.lineTo(sx+s*0.5,sy+s);g2.stroke();
    ink(.45);[0.3,0.7].forEach(f=>g2.fillRect(sx+s*0.2,sy+s*f,s*0.6,Math.max(0.8,s*0.09)));return;}

  if(kind==="site"){                                    /* hazard: two bars on the diagonal */
    g2.fillStyle=named||"#E7C25A";g2.fillRect(sx+s*0.1,sy+s*0.1,s*0.8,s*0.8);
    ink(.55);g2.save();g2.beginPath();g2.rect(sx+s*0.1,sy+s*0.1,s*0.8,s*0.8);g2.clip();
    [-0.3,0.3].forEach(o=>{g2.beginPath();g2.moveTo(sx+s*(0.1+o),sy+s*0.9);
      g2.lineTo(sx+s*(0.6+o),sy+s*0.1);g2.lineTo(sx+s*(0.78+o),sy+s*0.1);
      g2.lineTo(sx+s*(0.28+o),sy+s*0.9);g2.closePath();g2.fill();});g2.restore();return;}

  if(kind==="marker"){                                  /* a pin */
    g2.fillStyle=named||"#E0662B";
    g2.beginPath();g2.arc(sx+s*0.5,sy+s*0.38,s*0.24,0,7);g2.fill();
    g2.beginPath();g2.moveTo(sx+s*0.5,sy+s*0.88);g2.lineTo(sx+s*0.32,sy+s*0.46);
    g2.lineTo(sx+s*0.68,sy+s*0.46);g2.closePath();g2.fill();return;}

  /* furniture and appliances: a small object, drawn as an object */
  const c=named||"#A79B86";
  g2.fillStyle=c;g2.fillRect(sx+s*0.24,sy+s*0.28,s*0.52,s*0.46);
  g2.fillStyle="rgba(255,255,255,.26)";g2.fillRect(sx+s*0.24,sy+s*0.28,s*0.52,Math.max(0.8,s*0.1));
  ink(.40);g2.fillRect(sx+s*0.24,sy+s*0.72,s*0.52,Math.max(0.8,s*0.09));
}
function planPanels(){
  const one=[{world:PL.street,ox:0,oy:0}];
  const T2=(typeof TOWNPLAN!=="undefined"&&Array.isArray(TOWNPLAN))?TOWNPLAN:null;
  if(!T2||!T2.length)return one;
  const ok=T2.filter(p2=>p2&&WORLDS[p2.world]).map(p2=>({world:p2.world,ox:p2.ox|0,oy:p2.oy|0}));
  return ok.length?ok:one;
}
const planPanelOf=id=>planPanels().find(p2=>p2.world===id)||null;
function drawTown(){
  const mc=$("mapcv"),g2=mc.getContext("2d"),s=10,panels=planPanels();
  const PW=Math.max(...panels.map(p2=>p2.ox+WORLDS[p2.world].W));
  const PH=Math.max(...panels.map(p2=>p2.oy+WORLDS[p2.world].H));
  const w={W:PW,H:PH};
  mc.width=PW*s;mc.height=PH*s+18;
  /* ---- THE PLAN IS A PIECE OF PAPER (2026-09-15) ----
     It was one flat #EFE9DA fill with flat squares on it, which is a data visualisation of a
     street and not a map of one — the same fault as every mock that day: the drawing was fine and
     the SURFACE was never designed (docs/BEAUTIFY.md, "the surface carries the screen").
     So: warm stock with a grain, two folds where a pocket map is folded, and a vignette, drawn
     UNDER the tiles so the paper shows through the streets rather than sitting on top of them.
     Every pixel of it is seeded, so the plan is the same plan every time it is opened. */
  const PG=g2.createLinearGradient(0,0,mc.width*0.4,mc.height);
  PG.addColorStop(0,"#F4EEDF");PG.addColorStop(0.55,"#EFE9DA");PG.addColorStop(1,"#E4DCC8");
  g2.fillStyle=PG;g2.fillRect(0,0,mc.width,mc.height);
  let ps=0x1F0A15;const prnd=()=>((ps=(ps*1103515245+12345)&0x7fffffff)/0x7fffffff);
  for(let i=0;i<Math.round(mc.width*mc.height*0.02);i++){
    g2.globalAlpha=0.03+prnd()*0.05;g2.fillStyle=prnd()<0.5?"#B6A883":"#FFFBF0";
    g2.fillRect(Math.floor(prnd()*mc.width),Math.floor(prnd()*mc.height),1,1);}
  g2.globalAlpha=1;
  const col={...BASECOL,...(typeof MAPCOL!=="undefined"?MAPCOL:{})};
  panels.forEach(p2=>{const ww=WORLDS[p2.world];
    for(let y=0;y<ww.H;y++)for(let x=0;x<ww.W;x++)
      planTile(g2,ww,x,y,(x+p2.ox)*s,(y+p2.oy)*s,s,col);});
  /* the folds: a shade on one side of the crease and a highlight on the other, because a fold is
     a ridge and a ridge has two sides. Over the tiles, since the paper is folded with the map on
     it — this is the one mark on the plan that is not a thing in the city. */
  [Math.round(mc.width/3),Math.round(mc.width*2/3)].forEach(fx2=>{
    g2.fillStyle="rgba(96,80,46,.13)";g2.fillRect(fx2,0,1,w.H*s);
    g2.fillStyle="rgba(255,250,235,.30)";g2.fillRect(fx2+1,0,1,w.H*s);});
  const vg=g2.createRadialGradient(mc.width/2,w.H*s/2,Math.min(mc.width,w.H*s)*0.32,
                                   mc.width/2,w.H*s/2,Math.max(mc.width,w.H*s)*0.62);
  vg.addColorStop(0,"rgba(58,44,20,0)");vg.addColorStop(1,"rgba(58,44,20,.16)");
  g2.fillStyle=vg;g2.fillRect(0,0,mc.width,w.H*s);
  const es=lang==="es";
  const flags=worldFlags();   /* the same facts the mural reads */
  g2.textAlign="center";
  (typeof TOWNLBL!=="undefined"?TOWNLBL:[]).forEach(l=>{
    if(l.when&&!l.when(flags))return;
    /* a label with no `world` belongs to the first panel, which is what every row meant before
       there was more than one — so an existing pack's labels do not move */
    const pn=l.world?planPanelOf(l.world):panels[0];if(!pn)return;
    g2.font="700 "+(l.s||10)+"px sans-serif";g2.fillStyle=l.c||"#3A2F17";
    g2.fillText(es?l.es:l.en,(l.x+pn.ox)*s+(l.dx||0),(l.y+pn.oy)*s);});
  /* the caption had 8px and no room. 9px, a letter of tracking and four more pixels of paper: it
     is the line that explains the two colours, and it was the smallest type in the game. */
  g2.fillStyle="rgba(58,44,20,.10)";g2.fillRect(0,w.H*s,mc.width,18);
  g2.fillStyle="#7B7361";g2.font="600 9px ui-monospace,monospace";
  if(g2.letterSpacing!==undefined)g2.letterSpacing="0.4px";
  g2.fillText(es?"puertas y escaleras en dorado · ◉ estás aquí":"doors & stairs in gold · ◉ you are here",mc.width/2,w.H*s+12);
  if(g2.letterSpacing!==undefined)g2.letterSpacing="0px";
  const M=typeof MAPDOT!=="undefined"?MAPDOT:{};
  drawPlanMarks(g2,s); /* the marks go UNDER the dot: you can always see yourself */
  const mine=planPanelOf(world);
  const dot=mine?[fx+mine.ox,fy+mine.oy]:(M[world]||null);
  if(dot){const dx2=dot[0]*s+s/2,dy2=dot[1]*s+s/2;
    const hal=g2.createRadialGradient(dx2,dy2,1,dx2,dy2,13);     /* you are a light on the paper */
    hal.addColorStop(0,"rgba(122,63,224,.34)");hal.addColorStop(1,"rgba(122,63,224,0)");
    g2.fillStyle=hal;g2.beginPath();g2.arc(dx2,dy2,13,0,7);g2.fill();
    g2.fillStyle="rgba(58,44,20,.30)";
    g2.beginPath();g2.ellipse(dx2+1,dy2+4,5.4,2.2,0,0,7);g2.fill();
    g2.fillStyle="#7A3FE0";g2.beginPath();g2.arc(dx2,dy2,5,0,7);g2.fill();
    g2.strokeStyle="#F2F1EA";g2.lineWidth=2;g2.stroke();
    g2.fillStyle="rgba(255,255,255,.40)";
    g2.beginPath();g2.arc(dx2-1.6,dy2-1.8,1.7,0,7);g2.fill();}
  mapLegend();
}
/* ---- WHAT THE PLAN SAYS UNDER ITSELF, AND IT MAY NOT SAY A FALSE THING ----
   Owner, 2026-09-16: "i guess there just arent quests left over, but can we remove the applicable
   legend if for example all quests are done then we dont mark." The legend already hid itself; the
   CAPTION did not. With every quest done and not one mark on the paper, the line under the map
   still read "tap a mark to make it your destination" — an instruction to do something that is not
   possible, which is the same fault as a save that fails quietly and a map that draws another
   street: a surface saying a thing that is not true. It says what is actually there now. */
function mapNoteSet(){
  const t=T(),pl=t.plan||{},n=$("mapNote");if(!n)return;
  if(mapDest){n.textContent="🎯 "+destName()+(pl.chosen?"  ·  "+pl.chosen:"");return;}
  const here="📍 "+t.locs[world]+(world===PL.upstairs?"  ·  ⇧":"");
  const any=planMarks().length;
  n.textContent=here+(any&&pl.tap?"  ·  "+pl.tap:(pl.none?"  ·  "+pl.none:""));
}
/* ---- AND SOMEWHERE TO GO WHEN NOBODY WANTS ANYTHING ----
   "we should also be able to point to a random destnation." Everything the plan could do was tied
   to a quest, so the moment the city had nothing left to ask of you the map became a picture. This
   is the first thing on it that is not about quests at all: pick a person, anywhere in the city,
   and the arrow in the street will take you to them. Chosen from the people the pack declared —
   never the one you are already standing next to, because being sent where you are is not an
   answer. */
function mapRandomDest(){
  const pool=[];
  Object.keys(WORLDS).forEach(id=>{(WORLDS[id].npcs||[]).forEach(n=>{
    if(id===world&&Math.abs(n.x-px)+Math.abs(n.y-py)<=2)return;   /* not where you already are */
    if(!npcName(n.npc))return;                                    /* it has to be nameable */
    pool.push({w:id,x:n.x,y:n.y,who:n.npc});});});
  if(!pool.length)return false;
  const p2=pool[(Math.random()*pool.length)|0];
  const pn=planPanelOf(p2.w);
  mapDest={w:p2.w,x:p2.x,y:p2.y,gx:pn?p2.x+pn.ox:undefined,gy:pn?p2.y+pn.oy:undefined,who:p2.who};
  drawTown();setWorldTag();mapNoteSet();
  return true;
}
function openMap(){
  drawTown();
  mapNoteSet();
  mapAnyBtn();
  $("mapov").hidden=false;held=null;
}
/* the button lives here rather than in the shell, so a pack gets it without touching its index */
function mapAnyBtn(){
  const host=$("mapNote");if(!host)return;
  let b=$("mapAny");
  if(!b){b=document.createElement("button");b.id="mapAny";b.type="button";
    b.style.cssText="display:block;width:100%;margin:2px 0 10px;padding:9px 12px;border-radius:10px;"+
      "border:1.5px solid var(--line,#C9C3B4);background:var(--bg,#F2F1EA);color:inherit;"+
      "font:600 .8rem/1.2 inherit;cursor:pointer;";
    b.addEventListener("click",()=>{mapRandomDest();mapAnyBtn();});
    host.parentNode.insertBefore(b,host.nextSibling);}
  const t=(T().plan||{});
  b.textContent=t.any||"Somewhere to go";
}
$("mapbtn").addEventListener("click",openMap);
/* tapping a mark is how a destination is chosen — the plan is the only place it can be, because
   the plan is the only place you can see them all at once (owner, 2026-09-15: "i can choose my
   destination"). A tap in open ground changes nothing: a miss must never clear what you picked. */
$("mapcv").addEventListener("click",e=>{
  const c=$("mapcv"),r=c.getBoundingClientRect();if(!r.width||!c.width)return;
  const sc=c.width/r.width,s=10;
  mapPick((e.clientX-r.left)*sc/s,(e.clientY-r.top)*sc/s);});
$("mapClose").addEventListener("click",()=>{$("mapov").hidden=true;});
function openTravel(){
  const t=T().pass,list=$("tvList");
  $("tvTitle").textContent=t.title;$("tvNote").textContent=t.note;$("tvClose").textContent=t.close;
  list.innerHTML="";
  TRV.forEach(d=>{const b=document.createElement("button");b.className="opt";
    b.textContent=(d.w===world?"◉ ":"🚋 ")+T().locs[d.w]+(d.w===world?" · "+t.here:"");
    if(d.w===world){b.disabled=true;b.style.opacity=".55";}
    else b.addEventListener("click",()=>{$("travel").hidden=true;
      /* a line with platforms gives you the ride; anything else still travels the way it always
         did. The ride is what a tram ADDS, not a new rule about how travel works, so a pack with no
         TROLLEYAT is byte-for-byte unchanged here. */
      if(rideCan()&&rideStart(d))return;
      const fromW=world,fromX=px,fromY=py;
      world=d.w;px=fx=d.x;py=fy=d.y;held=null;dir=d.dir;
      worldArrived(fromW,fromX,fromY);});
    list.appendChild(b);});
  const s=document.createElement("button");s.className="opt";s.disabled=true;s.style.opacity=".45";
  s.textContent="🏗️ "+t.soon;list.appendChild(s);
  $("travel").hidden=false;
}
$("tvClose").addEventListener("click",()=>{$("travel").hidden=true;
  /* step back off the stop so it can re-trigger later. TRV already declares where each stop
     stands you — reading it here means the engine stops naming this pack's two worlds. */
  const d=(typeof TRV!=="undefined"?TRV:[]).find(t=>t.w===world);
  if(d){px=fx=d.x;py=fy=d.y;dir=d.dir||"down";}
  checkTalk();});
/* ---------- Xochi's wardrobe: equippable pet cosmetics, unlocked by the Designer quest ---------- */
let wdPet="fred";
const wdState=()=>wdPet==="fred"?wear:wearCat;
function wdDraw(){
  const g=$("wdpv").getContext("2d");
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,66,44);
  if(wdPet==="fred"){g.setTransform(1.9,0,0,1.9,1,-13);drawDog(g,1,0);}
  else{g.setTransform(1.9,0,0,1.9,1,-16);drawCat(g,1,0);}
}
function buildWearRow(rowId,key){
  const row=$(rowId);row.innerHTML="";
  const st2=wdState();
  const mk=col=>{const b=document.createElement("button");b.className="sw";
    if(col){b.style.background=col;b.setAttribute("aria-label",key+" "+col);}
    else{b.textContent="✕";b.setAttribute("aria-label",key+": none");}
    b.setAttribute("aria-pressed",st2[key]===col?"true":"false");
    b.addEventListener("click",()=>{wdState()[key]=col;save();
      [...row.children].forEach(x2=>x2.setAttribute("aria-pressed","false"));
      b.setAttribute("aria-pressed","true");wdDraw();});
    row.appendChild(b);};
  mk(null);WEAR[key].forEach(mk);
}
function openWardrobe(){
  const t=T();
  $("wdTitle").textContent=t.wdTitle;$("wdNote").textContent=t.wdNote;
  $("wdLbBandana").textContent=t.wdBandana;$("wdLbCollar").textContent=t.wdCollar;$("wdLbCape").textContent=t.wdCape;
  $("wdClose").textContent=t.closeSet;
  $("wdTabF").setAttribute("aria-pressed",wdPet==="fred"?"true":"false");
  $("wdTabC").setAttribute("aria-pressed",wdPet==="cat"?"true":"false");
  const cape=wdPet==="fred"; /* Canela wears bandanas and collars only */
  $("wdLbCape").hidden=!cape;$("wdRowCape").hidden=!cape;
  buildWearRow("wdRowBandana","bandana");buildWearRow("wdRowCollar","collar");
  if(cape)buildWearRow("wdRowCape","cape");
  wdDraw();$("wardrobe").hidden=false;held=null;
}
$("wdTabF").addEventListener("click",()=>{wdPet="fred";openWardrobe();});
$("wdTabC").addEventListener("click",()=>{wdPet="cat";openWardrobe();});
$("wdClose").addEventListener("click",()=>{$("wardrobe").hidden=true;});
/* ---------- Trolley Pass: your save as a transit pass (cartridge model — the save
   lives on-device like a Game Boy battery save; the pass is the link cable).
   Share it to your other device, or scan the QR with its camera. ---------- */
const b64u=s2=>btoa(unescape(encodeURIComponent(s2))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const unb64u=s2=>decodeURIComponent(escape(atob(s2.replace(/-/g,"+").replace(/_/g,"/"))));
function passURL(){
  save();
  const blob={v:1,l:lang,s:loadSave()};
  return location.href.replace(/#.*$/,"")+"#save="+b64u(JSON.stringify(blob)); /* href, not origin — file:// has origin "null" */
}
function readPass(){
  const m=location.hash.match(/#save=([A-Za-z0-9\-_]+)/);
  if(!m)return null;
  try{const j=JSON.parse(unb64u(m[1]));
    if(j&&j.v===1){j.s=sanitizeSave(j.s);j.l=j.l==="es"?"es":"en";
      if(j.s)return j;}}catch(e){}
  return null;
}
function stripPassHash(){try{history.replaceState(null,"",location.pathname+location.search);}catch(e){}}
function openPass(){
  const t=T(),url=passURL();
  $("tpTitle").textContent=t.tpTitle;$("tpNote").textContent=t.tpNote;
  $("tpShare").textContent=t.tpShare;$("tpCopy").textContent=t.tpCopy;$("tpClose").textContent=t.closeSet;
  $("tpShare").hidden=!navigator.share;
  const cv2=$("tpqr");
  if(typeof qrcode!=="undefined"){
    const qr=qrcode(0,"L");qr.addData(url);qr.make();
    const n=qr.getModuleCount(),q=4,px2=n+q*2;
    cv2.width=px2;cv2.height=px2;
    const g=cv2.getContext("2d");
    g.fillStyle="#FFF";g.fillRect(0,0,px2,px2);
    g.fillStyle="#14121B";
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.isDark(y,x))g.fillRect(x+q,y+q,1,1);
    cv2.hidden=false;
  }else cv2.hidden=true;
  $("settings").hidden=true;$("tpass").hidden=false;held=null;
}
$("openTp").addEventListener("click",openPass);
$("openMp").addEventListener("click",()=>{const t=T();
  $("mpTitle").textContent=t.mpTitle;$("mpNote").textContent=t.mpNote;$("mpClose").textContent=t.closeSet;
  $("settings").hidden=true;$("mpanel").hidden=false;held=null;});
$("mpClose").addEventListener("click",()=>{$("mpanel").hidden=true;});
$("tpClose").addEventListener("click",()=>{$("tpass").hidden=true;});
$("tpShare").addEventListener("click",()=>{navigator.share({title:GN(),url:passURL()}).catch(()=>{});});
$("tpCopy").addEventListener("click",()=>{const u=passURL();
  (navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(u):Promise.reject())
    .then(()=>toast(T().tpCopied,1600)).catch(()=>{});});
/* ---------- fullscreen + admin ---------- */
let admin=false,brush="#";
$("fsbtn").addEventListener("click",()=>{
  const vp=$("vp"),fs=vp.classList.toggle("fs");
  document.body.classList.toggle("noscroll",fs);
  if(fs&&vp.requestFullscreen)vp.requestFullscreen().catch(()=>{});
  else if(!fs&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});
  setTimeout(sizeCanvas,80);
});
document.addEventListener("fullscreenchange",()=>{setTimeout(sizeCanvas,80);});
try{admin=localStorage.getItem(SK("admin"))==="1";}catch(e){}
function applyAdmin(){
  $("brushes").hidden=!admin;
  $("teOpen").hidden=!admin; /* the theme editor is admin-mode tooling; the ✨ Custom result is for everyone */
  $("stkRow").hidden=!admin;$("lbStakes").hidden=!admin;
  $("admOn").setAttribute("aria-pressed",admin?"true":"false");
  $("admOff").setAttribute("aria-pressed",admin?"false":"true");
  mqStore(SK("admin"),admin?"1":"0");
}
$("admOn").addEventListener("click",()=>{admin=true;applyAdmin();toast(T().admToast,3400);});
/* Stakes toggle — admin tooling. Hearts are off by default in an open world, but they
   stay one tap away for a mini-game or a challenge. Per device, never in the save. */
function applyStakes(){
  const on=stakesMode()==="hearts";
  $("stkRow").hidden=!admin;
  $("stkNone").setAttribute("aria-pressed",on?"false":"true");
  $("stkHearts").setAttribute("aria-pressed",on?"true":"false");
  hud();
}
function setStakes(m){
  stakesAdmin={mode:m};
  mqStore(SK("stakes"),m);
  if(m==="hearts"&&hearts<=0)hearts=startHearts();
  applyStakes();save();toast(T().stkToast(m),3000);
}
$("stkNone").addEventListener("click",()=>setStakes("none"));
$("stkHearts").addEventListener("click",()=>setStakes("hearts"));
$("admOff").addEventListener("click",()=>{admin=false;applyAdmin();});
document.querySelectorAll("#brushes button[data-b]").forEach(b=>{
  if(b.dataset.b===brush)b.setAttribute("aria-pressed","true");
  b.addEventListener("click",()=>{brush=b.dataset.b;
    document.querySelectorAll("#brushes button[data-b]").forEach(x=>x.setAttribute("aria-pressed",x===b?"true":"false"));});
});
function setTile(x,y,ch){
  const w=CW();
  if(x<=0||y<=0||x>=w.W-1||y>=w.H-1)return;
  if(w.grid[y][x]==="N")return;
  if(portalAt(world,x,y))return; /* never paint over stairs/exits */
  if(w.rows[y][x]==="Y")return; /* nor the trolley stop — transit infrastructure is sacred */
  const prev=w.rows[y][x];
  w.rows[y]=w.rows[y].slice(0,x)+ch+w.rows[y].slice(x+1);
  w.grid[y][x]=ch;
  try{const ed=JSON.parse(localStorage.getItem(SK("edits"))||"[]");ed.push({m:world,x,y,ch,prev});
    localStorage.setItem(SK("edits"),JSON.stringify(ed.slice(-400)));}catch(e){}
}
$("undoBtn").addEventListener("click",()=>{
  let ed=[];try{ed=JSON.parse(localStorage.getItem(SK("edits"))||"[]");}catch(e){}
  if(!ed.length){toast(T().undoEmpty,1500);return;}
  const e2=ed.pop(),w=WORLDS[e2.m||PL.home];
  const back=(e2.prev!==undefined&&e2.prev!==null)?e2.prev:w.rows0[e2.y][e2.x];
  w.rows[e2.y]=w.rows[e2.y].slice(0,e2.x)+back+w.rows[e2.y].slice(e2.x+1);
  if(w.grid[e2.y][e2.x]!=="N")w.grid[e2.y][e2.x]=back;
  mqStore(SK("edits"),JSON.stringify(ed));
  toast(T().undoToast,1200);
});
function paintAt(clientX,clientY){
  if(camMode==="iso"||camMode==="3d"){toast(T().isoEdit,2200);return;} /* tap→tile math is top-down */
  const r=cv.getBoundingClientRect();
  let dw=r.width,dh=r.height,ox=0,oy=0;const ar=VW/VH;
  if(dw/dh>ar){const w2=dh*ar;ox=(dw-w2)/2;dw=w2;}else{const h2=dw/ar;oy=(dh-h2)/2;dh=h2;}
  const gx=Math.floor(((clientX-r.left-ox)/dw*VW+camXg)/TS);
  const gy=Math.floor(((clientY-r.top-oy)/dh*VH+camYg)/TS);
  if(gx===px&&gy===py)return;
  if(brush==="npc"){npcAt(gx,gy);return;}
  setTile(gx,gy,brush);
}
/* swipe-to-move: touch anywhere on the game, drag = walk (floating direction), release = stop.
   In admin mode a TAP (no drag) paints; a drag still moves — best of both. */
let swActive=null,swSX=0,swSY=0,swMoved=false;
function swEnd(e){
  if(e.pointerId!==swActive)return;
  if(admin&&!swMoved)paintAt(e.clientX,e.clientY);
  if(ctl==="swipe")held=null;
  swActive=null;
}
[cv,$("cv3")].filter(Boolean).forEach(el=>{ /* both canvases: the 3D camera swapped
  the surface and took the swipe control with it (owner: "movement not working") */
  el.addEventListener("pointerdown",e=>{
    if($("world").hidden)return;
    swActive=e.pointerId;swSX=e.clientX;swSY=e.clientY;swMoved=false;
    try{el.setPointerCapture(e.pointerId);}catch(err){}
    e.preventDefault();
  });
  el.addEventListener("pointermove",e=>{
    if(e.pointerId!==swActive)return;
    const dx=e.clientX-swSX,dy=e.clientY-swSY;
    if(Math.hypot(dx,dy)>10)swMoved=true;
    if(ctl==="swipe"){
      if(Math.hypot(dx,dy)<14){held=null;return;}
      held=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");
    }
  });
  el.addEventListener("pointerup",swEnd);el.addEventListener("pointercancel",swEnd);
});
try{(JSON.parse(localStorage.getItem(SK("edits"))||"[]")).forEach(e2=>{
  const w=WORLDS[e2&&(e2.m||PL.home)];if(!w)return;
  if(e2&&w.grid[e2.y]&&w.grid[e2.y][e2.x]!=="N"&&!(e2.x<=0||e2.y<=0||e2.x>=w.W-1||e2.y>=w.H-1)){
    w.rows[e2.y]=w.rows[e2.y].slice(0,e2.x)+e2.ch+w.rows[e2.y].slice(e2.x+1);w.grid[e2.y][e2.x]=e2.ch;}});}catch(e){}
/* ---------- owner-created characters (admin ➕ brush) — per-device, like map edits.
   Records: {n:name, w:world, x, y, lk:{shirt,skin,hair,style}}. Names are data:
   length-clamped, rendered only via textContent/canvas. A name matching a dog egg
   (the star dog's name, as it is now) joins as a beagle critter instead of a person. */
const NPCSTYLES=["cap","long","curly","spiky","pony","afro","buzz","braids","buns","broccoli","fade","mullet"];
const sanName=s2=>String(s2||"").replace(/[\u0000-\u001f<>]/g,"").trim().slice(0,24);
/* a typed line for the room sheet: control characters out, everything else as typed —
   it is only ever shown through textContent, so a "<3" stays a "<3" */
const sanLine=s2=>String(s2||"").replace(/[\u0000-\u001f]/g,"").trim().slice(0,140);
const hexOK=v=>typeof v==="string"&&/^#[0-9A-Fa-f]{6}$/.test(v);
function randLook(){const pick=a=>a[Math.floor(Math.random()*a.length)];
  return {shirt:pick(SWATCH.shirt),skin:pick(SWATCH.skin),hair:pick(SWATCH.hair),style:pick(NPCSTYLES)};}
let myNpcs=[];
try{myNpcs=(JSON.parse(localStorage.getItem(SK("npcs"))||"[]")||[]).slice(0,12);}catch(e){}
function npcPersist(){mqStore(SK("npcs"),JSON.stringify(myNpcs.slice(0,12)));}
function spawnCustom(rec){
  const name=sanName(rec.n);if(!name)return false;
  const w=WORLDS[rec.w];if(!w)return false;
  const x=rec.x|0,y=rec.y|0;
  const eg=eggFor(name);
  if(eg&&EGGSAFE[eg].dog){ /* a legendary dog joins the critter pass */
    if(CRIT.some(c=>DOGK.has(c.kind)&&(c.name||"").toLowerCase()===name.toLowerCase()))
      return true; /* the star is already in town — there is one of him (a playtest finding) */
    if(x<0||y<0||x>=w.W||y>=w.H||SOLID.has(w.grid[y][x])||w.grid[y][x]==="N")return false;
    CRIT.push({kind:"beagle",world:rec.w,x,y,fx:x,fy:y,c:"#E8C46A",name,egg:eg,
      moving:false,mt:0,dx:0,dy:0,face:1,next:0,sit:false,home:[x,y]});
    return true;}
  const lk=rec.lk||{};
  const look=hexOK(lk.shirt)&&hexOK(lk.skin)&&hexOK(lk.hair)
    ?{shirt:lk.shirt,skin:lk.skin,hair:lk.hair,style:NPCSTYLES.includes(lk.style)?lk.style:"cap"}
    :randLook();
  return !!addChill({name:{en:name,es:name},world:rec.w,x,y,look});}
/* ---------- El Parque 🌈 (IDEAS §13 preview, owner-signed) ----------
   Leash a dog and HE takes YOU — over the rainbow bridge to the park. Chill
   session, no clock: fetch, treats, howls. Crossing back plays a little recap.
   The park holds the preview customization: bandanas, and adopting your own
   dog (who gets the full beagle program). All per-device, in `mqpark`. */
const parkPrefs={band:{},dogs:[],train:{}};
try{const p0=JSON.parse(localStorage.getItem(SK("park"))||"{}");
  if(p0&&typeof p0==="object"){parkPrefs.band=(p0.band&&typeof p0.band==="object")?p0.band:{};
    parkPrefs.dogs=Array.isArray(p0.dogs)?p0.dogs.slice(0,24):[]; /* no adoption limit (owner) — just a sanity ceiling */
    parkPrefs.train=(p0.train&&typeof p0.train==="object")?p0.train:{};
    /* #264: the star dog's kept name, and how many dogs have been stubborn about a new one. Neither is
       written until something happens to write it, so a game that never names a star stores exactly
       what it stored before. */
    if(p0.star&&typeof p0.star==="object"&&sanName(p0.star.n))parkPrefs.star={n:sanName(p0.star.n),r:p0.star.r?1:0,stub:p0.star.stub};
    if(p0.stubs)parkPrefs.stubs=Math.max(0,Math.min(2,p0.stubs|0));}}catch(e){}
function parkPersist(){mqStore(SK("park"),JSON.stringify(parkPrefs));}
/* ---------- the star dog (#264): found by his ROLE, named from the pack's POOL ----------
   A pack marks one dog in CRITTERS with role:"star": the one the paw menu reaches from any room and
   the whistle carries across the city. The engine never knows what he is called. A pack may also
   declare DOGNAMES, a pool: a brand-new device picks one name from it (seeded, below) and keeps it in
   the park record, and the player may rename him like any adopted dog — never rehome him, he lives on
   the street. A device that has played here before keeps the name it has always seen, the map's.
   A pack that declares neither changes nothing here at all: no pick, no record, no rename. */
const starDog=()=>CRIT.find(c=>c.role==="star"&&isDog(c))||null;
const DOGPOOL=(()=>{const seen=new Set();
  return (typeof DOGNAMES!=="undefined"&&Array.isArray(DOGNAMES)?DOGNAMES:[]).map(sanName)
    .filter(n=>{const l=n.toLowerCase();if(!n||seen.has(l))return false;seen.add(l);return true;});})();
/* the pick, a pure function a test can sweep: the seed modulo the pool's size, stepping past a name
   another dog here already has */
function dogNamePick(pool,seed,taken){const n=pool.length;if(!n)return null;const s0=(seed>>>0)%n;
  for(let i=0;i<n;i++){const nm=pool[(s0+i)%n];if(!taken.includes(nm.toLowerCase()))return nm;}
  return null;}
/* one 32-bit seed from the platform's generator — not the game's dice, which tests pin for other reasons */
function dogSeed(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0];}
  catch(e){return Math.floor(Math.random()*4294967296);}}
(function nameStar(){const s=starDog();if(!s)return;
  if(parkPrefs.star)s.name=parkPrefs.star.n;
  else if(DOGPOOL.length){
    /* only a device that has never played here is named from the pool: a park record or a save from an
       earlier visit keeps the name that player knows, and storage that cannot be read keeps it too — a
       name that could not be kept is not picked */
    let before=true;try{before=localStorage.getItem(SK("park"))!==null||localStorage.getItem(SK("1"))!==null;}catch(e){}
    const nm=before?null:dogNamePick(DOGPOOL,dogSeed(),CRIT.filter(c=>isDog(c)&&c!==s).map(c=>String(c.name||"").toLowerCase()));
    if(nm)s.name=nm;
    parkPrefs.star={n:s.name,r:0};parkPersist();}
  starNow=s.name||null;})();
/* people made in admin mode spawn once the star has his name, so one named after him finds him here */
myNpcs=myNpcs.filter(r=>{try{return spawnCustom(r);}catch(e){return false;}});
/* every adopted dog befriends one particular townsperson (owner ask) — and some
   dogs roam the city to hang out at their friend's side */
const FRIENDW=PL.friends.filter(w=>WORLDS[w]); /* a role the pack has no world for is simply skipped */
function pickFriend(){ /* only townsfolk with room beside them for a dog */
  for(let i=0;i<12;i++){
    if(!FRIENDW.length)return null;
    const w=FRIENDW[Math.floor(Math.random()*FRIENDW.length)];
    const ns=WORLDS[w].npcs;if(!ns.length)continue;
    const fr={w,key:ns[Math.floor(Math.random()*ns.length)].key};
    if(friendSpot(fr))return fr;
  }
  return null;}
function friendSpot(fr){
  const w=fr&&WORLDS[fr.w];if(!w)return null;
  const f=w.npcs.find(n=>n.key===fr.key);if(!f)return null;
  return [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]
    .map(d=>[f.x+d[0],f.y+d[1]])
    .find(([x,y])=>x>0&&y>0&&x<w.W-1&&y<w.H-1&&!SOLID.has(w.grid[y][x])&&w.grid[y][x]!=="N")||null;}
function dogRecord(cr){return cr&&cr.name?parkPrefs.dogs.find(d=>sanName(d.n)===cr.name):null;}
function dogPlace(cr,rec){ /* the park, or the friend's side */
  if((rec.rehomed||rec.out)&&rec.friend){
    const s=friendSpot(rec.friend);
    if(s){cr.world=rec.friend.w;cr.x=s[0];cr.y=s[1];cr.fx=s[0];cr.fy=s[1];cr.home=[s[0],s[1]];return;}}
  cr.world=PL.park;cr.x=rec.x|0;cr.y=rec.y|0;cr.fx=cr.x;cr.fy=cr.y;cr.home=[cr.x,cr.y];}
function dogsRoam(newW){ /* rolled at every door: unseen dogs drift between the park
  and their friend's side; rehomed dogs live with their friend for good */
  let dirty=false;
  CRIT.forEach(cr=>{const rec=isDog(cr)?dogRecord(cr):null;
    if(!rec||!rec.friend||cr.world===newW||cr.task||(LEASH&&LEASH.cr===cr))return;
    if(rec.rehomed){if(cr.world!==rec.friend.w)dogPlace(cr,rec);return;}
    if(Math.random()<0.3){rec.out=!rec.out;dogPlace(cr,rec);dirty=true;}});
  if(dirty)parkPersist();}
parkPrefs.dogs.forEach(d0=>{const n=sanName(d0.n);if(!n)return;
  const k=DOGK.has(d0.k)?d0.k:"beagle";
  if(!d0.friend)d0.friend=pickFriend(); /* older pups get a friend assigned */
  const cr={kind:k,world:PL.park,x:d0.x|0,y:d0.y|0,fx:d0.x|0,fy:d0.y|0,
    c:hexOK(d0.c)?d0.c:"#E8C46A",friend:d0.friend,
    name:n,egg:eggFor(n),moving:false,mt:0,dx:0,dy:0,face:1,next:0,sit:false,home:[d0.x|0,d0.y|0]};
  dogPlace(cr,d0);
  CRIT.push(cr);});
parkPersist();
CRIT.forEach(cr=>{if(cr.kind==="beagle"&&cr.name&&parkPrefs.band[cr.name])cr.band=parkPrefs.band[cr.name];});
$("leash").addEventListener("click",()=>{
  if(!DOGK.has(petTarget)||!petCrit||world===PL.park)return;
  const c=petCrit;
  LEASH={cr:c,w:c.world,x:c.home[0],y:c.home[1]};
  PARK={f:0,t:0,h:0,d:0};
  toast(T().leashToast(c.name||"🐶"),2400);
  setTimeout(()=>{
    world=PL.park;px=fx=PL.parkIn[0];py=fy=PL.parkIn[1];dir=PL.parkIn[2];held=null;
    c.world=PL.park;c.x=PL.parkDog[0];c.y=PL.parkDog[1];c.fx=c.x;c.fy=c.y;c.home=PL.parkDogHome.slice();c.follow=true;c.task=null;c.sit=false;
    c.leashT=performance.now()+6500; /* the leash shows for the bridge crossing, then he's loose */
    if(BALL)BALL=null;
    warpT=performance.now()+450;portalT=performance.now()+900;portalHold=world+":"+px+","+py;
    save();setWorldTag();hud();checkTalk();
    setTimeout(()=>toast(T().parkArrive,3400),700);
  },900);
});
function parkExit(){
  const led=LEASH&&LEASH.cr;
  if(LEASH){const c=LEASH.cr; /* the leashed dog trots home; adopted dogs LIVE here */
    c.follow=false;c.task=null;c.world=LEASH.w;c.x=LEASH.x;c.y=LEASH.y;c.fx=c.x;c.fy=c.y;
    c.home=[c.x,c.y];LEASH=null;}
  if(BALL&&BALL.world===PL.park)BALL=null;
  const t=T();
  $("pkTitle").textContent=t.parkTitle;
  $("pkSum").textContent=t.parkSum(PARK.f,PARK.t,PARK.h,PARK.d);
  $("pkLove").textContent=t.parkLove;
  const tz=t.parkTeaser,sd=starDog(); /* a line written as a function says the name he has now (#264) */
  $("pkTeaser").textContent=typeof tz==="function"?tz((sd&&sd.name)||(led&&led.name)||""):tz;
  $("pkClose").textContent=t.parkClose;
  $("parkCard").hidden=false;
}
$("pkClose").addEventListener("click",()=>{$("parkCard").hidden=true;});
const BANDCOLS=[null,"#C0392B","#2E5FA8","#E0A430","#D77FA8","#7A9A4E"];
$("band").addEventListener("click",()=>{
  if(!DOGK.has(petTarget)||!petCrit)return;
  const c=petCrit,i=(BANDCOLS.indexOf(c.band||null)+1)%BANDCOLS.length;
  c.band=BANDCOLS[i];
  if(c.name){if(c.band)parkPrefs.band[c.name]=c.band;else delete parkPrefs.band[c.name];parkPersist();}
  toast(c.band?T().bandToast:T().bandOff,1600);
});
/* the two alebrije buttons (owner: "a button for random, another to vary through the ones created for
   that animal"): they act on the animal you are beside (the same target as the treat and the bandana),
   else on your own face paint. Random never repeats the current look; the toast says the look's name,
   which is how five names get learned without a menu (Pili). */
function alePress(random){
  const L=alebLooks();
  const c=(L&&DOGK.has(petTarget)&&petCrit)?petCrit:null;
  if(c){const key=c.name||c.kind,cur=L.indexOf(alebLookFor(c.kind,c.name));let i=(cur+1)%L.length;
    if(random){do{i=Math.floor(Math.random()*L.length);}while(i===cur&&L.length>1);}
    aleSetPick(key,i);}
  else{const F=faceLooks();if(!F)return;const cur=alePick.hero%F.length;let i=(cur+1)%F.length;
    if(random){do{i=Math.floor(Math.random()*F.length);}while(i===cur&&F.length>1);}
    aleSetPick("you",i);}
}
/* one door for every pick — the buttons beside the bandana, the Settings menu, a barber's chair later */
function aleSetPick(key,i){
  if(key==="you"){const F=faceLooks();if(!F)return;alePick.hero=i;const lk=F[i];toast((T().youLb||"You")+" — "+(lk.name?(lk.name[lang]||lk.name.en):lk.id),1800);}
  else{const L=alebLooks();if(!L)return;alePick.animals[key]=i;const lk=L[i],c=CRIT.find(k=>(k.name||k.kind)===key);toast((c&&c.name||npcName(key)||key)+" — "+(lk.name?(lk.name[lang]||lk.name.en):lk.id),1800);}
  alePersist();aleRowBuild();}
/* Settings → Alebrijes (owner, 2026-09-07: "a menu to choose the different alebrije styles"): pick who — your
   face, or any animal with a name — then the look by its name. Built from content like the season row; hidden when
   the season hands out no looks. */
function aleSubjects(){const out=[];if(faceLooks())out.push(["you",T().aleYou||"You"]);
  if(alebLooks()){const seen=new Set();CRIT.forEach(c=>{const k=c.name||c.kind;if(seen.has(k))return;seen.add(k);out.push([k,c.name||npcName(c.kind)||c.kind]);});}
  return out;}
let aleWho="you";
function aleRowBuild(){const row=$("aleRow"),lb=$("lbAle");if(!row)return;
  const subs=aleSubjects();const on=subs.length>0;row.hidden=!on;if(lb)lb.hidden=!on;
  /* #127: the drawer goes with its contents. An empty drawer with a name and an arrow is a
     promise the menu cannot keep. */
  {const d=$("drwSelf");if(d)d.hidden=!on;}
  row.innerHTML="";if(!on)return;
  if(!subs.some(s=>s[0]===aleWho))aleWho=subs[0][0];
  const sel=document.createElement("select");sel.id="aleWho";subs.forEach(([k,label])=>{const o=document.createElement("option");o.value=k;o.textContent=label;if(k===aleWho)o.selected=true;sel.appendChild(o);});
  sel.addEventListener("change",()=>{aleWho=sel.value;aleRowBuild();});row.appendChild(sel);
  const L=aleWho==="you"?faceLooks():alebLooks();if(!L)return;
  const cur=aleWho==="you"?((alePick.hero%L.length)+L.length)%L.length:L.indexOf(alebLookFor(null,aleWho));
  L.forEach((lk,i)=>{const b=document.createElement("button");b.dataset.look=lk.id;b.textContent=lk.name?(lk.name[lang]||lk.name.en):lk.id;
    b.setAttribute("aria-pressed",i===cur?"true":"false");b.addEventListener("click",()=>aleSetPick(aleWho,i));row.appendChild(b);});}
if($("aleRnd")){$("aleRnd").addEventListener("click",()=>alePress(true));$("aleNext").addEventListener("click",()=>alePress(false));}
$("love").addEventListener("click",()=>{ /* a button to tell him you love him (asked for) */
  if(!DOGK.has(petTarget)||!petCrit)return;
  const c=petCrit;
  c.loveT=performance.now()+2800;c.happyT=performance.now()+2800;
  c.sit=true;c.layT=0;c.next=performance.now()+3000;
  try{musChirp();}catch(e){}
  const L=T().loveLines||[];if(L.length)toast("💗 "+L[Math.floor(Math.random()*L.length)],3200);
});
/* breeds and coats: a beagle is lemon by canon; labs and chihuahuas choose */
const BREEDS={beagle:["#E8C46A"],
  lab:["#E0C070","#6E4B2F","#33302C"],
  chi:["#C9975C","#EAD9BC","#33302C","#F2EDE4"]};
let adoptB="beagle",adoptC="#E8C46A";
function adoptPaint(){
  document.querySelectorAll("#adoptBreeds button").forEach(b=>{
    b.textContent=(T().breeds||{})[b.dataset.b]||b.dataset.b;
    b.setAttribute("aria-pressed",b.dataset.b===adoptB?"true":"false");});
  const row=$("adoptCoats");row.innerHTML="";
  $("lbCoat").hidden=$("adoptCoats").hidden=BREEDS[adoptB].length<2;
  BREEDS[adoptB].forEach(c=>{
    const b=document.createElement("button");
    b.style.cssText="width:34px;height:34px;border-radius:50%;border:2px solid "+(c===adoptC?"var(--accent)":"var(--line)")+";background:"+c+";cursor:pointer;";
    b.addEventListener("click",()=>{adoptC=c;adoptPaint();});
    row.appendChild(b);});
}
document.querySelectorAll("#adoptBreeds button").forEach(b=>b.addEventListener("click",()=>{
  adoptB=b.dataset.b;adoptC=BREEDS[adoptB][0];adoptPaint();}));
$("adopt").addEventListener("click",()=>{ /* no limit — the city rehomes, it never deletes */
  $("adoptTitle").textContent=T().adoptAsk;$("adoptGo").textContent=T().adoptGo;$("adoptX").textContent=T().adoptX;
  $("lbBreed").textContent=T().adoptBreed;$("lbCoat").textContent=T().adoptColor;
  adoptB="beagle";adoptC="#E8C46A";adoptPaint();
  $("adoptName").value="";$("adoptP").hidden=false;$("adoptName").focus();
});
$("adoptGo").addEventListener("click",()=>{
  const n=sanName($("adoptName").value);
  $("adoptP").hidden=true;
  if(!n)return;
  if(CRIT.some(c=>isDog(c)&&(c.name||"").toLowerCase()===n.toLowerCase())){
    toast(T().dupDog(n),2600);return;}
  const w9=WORLDS[PL.park];
  const spot=PL.parkAdopt.find(([x,y])=>
    !SOLID.has(w9.grid[y][x])&&!(x===px&&y===py)&&!CRIT.some(c=>c.world===PL.park&&c.x===x&&c.y===y))||PL.parkAdopt[0];
  const[ax,ay]=spot;
  const fr=pickFriend(); /* every pup gets one particular person in this city */
  CRIT.push({kind:adoptB,world:PL.park,x:ax,y:ay,fx:ax,fy:ay,c:adoptC,friend:fr,
    name:n,egg:eggFor(n),moving:false,mt:0,dx:0,dy:0,face:1,next:0,sit:false,home:[ax,ay]});
  parkPrefs.dogs.push({n,x:ax,y:ay,k:adoptB,c:adoptC,friend:fr});parkPersist();
  toast(T().adoptDone(n),3200);
});
$("adoptX").addEventListener("click",()=>{$("adoptP").hidden=true;});
/* ---------- 🎓 training: sit, down, stay, come, follow ----------
   Every rep makes the next one likelier to land; a recent treat helps a lot
   ("he should do a recall most of the time — especially after a treat"). */
function nearestDog(){let best=null,bd=1e9;
  CRIT.forEach(c=>{if(!isDog(c)||c.world!==world)return;
    const d=Math.abs(c.x-px)+Math.abs(c.y-py);if(d<bd){bd=d;best=c;}});
  /* nobody here? the paw menu still reaches the star dog, wherever he is — found by his role */
  return best||starDog()||CRIT.find(c=>isDog(c))||null;}
function dogCmd(kind){
  const c=nearestDog();if(!c)return;
  $("dogP").hidden=true;
  /* still getting used to a new name (#264): the next two calls go to a name he does not answer to
     yet, and the line says the one he does; the call after that, he comes round, as if it were his idea */
  const rr=dogRecord(c)||(c===starDog()?parkPrefs.star:null),st=rr&&rr.stub;
  if(st&&typeof st==="object"){const was=sanName(st.was),L=T().dogStubborn||[],left=Math.max(0,Math.min(2,st.left|0));
    if(left>0&&was&&L.length){st.left=left-1;parkPersist();
      const f=L[(2-left)%L.length];toast("🐶 "+(typeof f==="function"?f(c.name,was):f),2800);return;}
    delete rr.stub;parkPersist();
    if(typeof T().dogCameRound==="function")setTimeout(()=>toast("🐶 "+T().dogCameRound(c.name),2600),2000);}
  const key=c.name||"dog";
  parkPrefs.train[key]=parkPrefs.train[key]||{};
  const tr=parkPrefs.train[key],reps=tr[kind]||0;
  if(kind==="follow"){c.follow=!c.follow;c.stayT=0;c.holdT=0;
    toast("🐶 "+(c.follow?T().followOn:T().followOff),2400);return;}
  const p=(kind==="come"?0.7:0.5)+0.1*Math.min(4,reps)+(dogFed(c)?0.25:0);
  const now=performance.now();
  if(Math.random()>=p){const L=T().cmdNo||[];
    if(L.length)toast("🐶 "+L[Math.floor(Math.random()*L.length)],2600);return;}
  tr[kind]=reps+1;parkPersist();
  c.task=null;c.layT=0;
  /* holdT is what makes "stay and sit" mean he does NOT come through the door after you.
     Follow stays ON — you are not made to re-train him — he is simply holding right now. */
  if(kind==="sit"){c.sit=true;c.next=now+4500;c.holdT=now+4500;toast("🐶 "+T().cmdOkSit,2200);}
  else if(kind==="down"){c.layT=now+5200;c.next=c.layT;c.holdT=c.layT;toast("🐶 "+T().cmdOkDown,2200);}
  else if(kind==="stay"){c.stayT=now+9000;c.sit=true;c.holdT=c.stayT;toast("🐶 "+T().cmdOkStay,2200);}
  else if(kind==="come"){c.stayT=0;c.holdT=0;c.sit=false;
    if(c.world!==world){ /* the whistle carries across the whole city */
      const w=CW(),rs=dogReach({world,x:px,y:py}),opts=[];
      for(let y=0;y<w.H;y++)for(let x=0;x<w.W;x++){
        const d=Math.abs(x-px)+Math.abs(y-py);
        if(d>=3&&d<=6&&rs[y*w.W+x])opts.push([x,y]);}
      if(opts.length){const[wx,wy]=opts[Math.floor(Math.random()*opts.length)];
        c.world=world;c.x=wx;c.y=wy;c.fx=wx;c.fy=wy;c.home=[wx,wy];c.follow=false;}}
    c.task={type:"come"};}
  if(tr[kind]===3)setTimeout(()=>toast("🎓 "+T().cmdTrained(c.name||"🐶"),2600),2300);
}
$("cmd").addEventListener("click",()=>{
  const c=nearestDog();if(!c)return;
  $("dogPTitle").textContent="🎓 "+(c.name||"🐶");
  [["cmdSit","sit"],["cmdDown","down"],["cmdStay","stay"],["cmdCome","come"],["cmdFollow","follow"]]
    .forEach(([id])=>$(id).textContent=T()[id]);
  /* adopted dogs: rename and rehome. The star (#264): rename only — he lives on the street. Other
     dogs the map places: neither. */
  const rec=dogRecord(c),star=c===starDog();
  $("cmdRen").hidden=!(rec||star);$("cmdReh").hidden=!rec;
  if(rec||star)$("cmdRen").textContent=T().renameLb;
  if(rec)$("cmdReh").textContent=T().rehomeLb;
  $("dogPX").textContent=T().adoptX;
  $("dogP").hidden=false;
});
[["cmdSit","sit"],["cmdDown","down"],["cmdStay","stay"],["cmdCome","come"],["cmdFollow","follow"]]
  .forEach(([id,k])=>$(id).addEventListener("click",()=>dogCmd(k)));
$("dogPX").addEventListener("click",()=>{$("dogP").hidden=true;});
/* rename (adopted dogs and the star) and rehome (adopted dogs; nobody is ever deleted) */
let renTarget=null;
/* whose record a rename writes: an adopted dog's own, or the star's in the park record */
function renRec(c){const r=dogRecord(c);if(r)return r;
  if(c&&c===starDog()){if(!parkPrefs.star)parkPrefs.star={n:c.name,r:0};return parkPrefs.star;}
  return null;}
/* THE STUBBORN ONES (#264, a joke on purpose): after a rename, one or two dogs keep answering to
   the old name for the next two calls. Which ones is not a roll of the dice: the star, the first time
   he is renamed (the name he has had longest), and any other dog whose old name hashes to it — about
   one in three — and never more than two in a game. A pack with no pool, or no words for it, has no
   joke, and its renames are exactly what they were. */
function dogStubborn(rec,old,star){const t=T();
  if(!DOGPOOL.length||typeof t.renameStub!=="function"||!Array.isArray(t.dogStubborn)||!t.dogStubborn.length)return false;
  if((parkPrefs.stubs|0)>=2)return false;
  return star?!rec.r:aleHash(String(old||"").toLowerCase())%3===0;}
$("cmdRen").addEventListener("click",()=>{
  const c=nearestDog();if(!c||!(dogRecord(c)||c===starDog()))return;
  $("dogP").hidden=true;renTarget=c;
  $("renTitle").textContent=T().renameAsk;$("renGo").textContent=T().renGo;$("renX").textContent=T().adoptX;
  $("renName").value=c.name||"";$("renP").hidden=false;$("renName").focus();
});
$("renGo").addEventListener("click",()=>{
  const c=renTarget;renTarget=null;$("renP").hidden=true;
  if(!c)return;
  const n=sanName($("renName").value);
  if(!n||n===c.name)return;
  if(CRIT.some(o=>isDog(o)&&o!==c&&(o.name||"").toLowerCase()===n.toLowerCase())){
    toast(T().dupDog(n),2600);return;}
  const rec=renRec(c);if(!rec)return;
  const old=c.name,star=c===starDog();
  if(parkPrefs.band[old]!==undefined){parkPrefs.band[n]=parkPrefs.band[old];delete parkPrefs.band[old];}
  /* #277: the alebrije look goes with the dog, like the bandana: the one chosen for it or, if nobody chose, the one
     its old name gave it, and any custom look over that. Nothing stays under the old name. A stopgap: the picks are
     kept by name until dogs are given ids that never change. */
  {const A=alePick.animals,C=alePick.custom;A[n]=A[old]!==undefined?A[old]:aleHash(old)+alePick.off;delete A[old];
   if(C&&C[old]!==undefined){C[n]=C[old];delete C[old];}alePersist();if(aleWho===old)aleWho=n;}
  if(parkPrefs.train[old]!==undefined){parkPrefs.train[n]=parkPrefs.train[old];delete parkPrefs.train[old];}
  const stub=dogStubborn(rec,old,star);
  delete rec.stub;
  rec.n=n;c.name=n;if(star){rec.r=1;starNow=n;}c.egg=eggFor(n);
  if(stub){rec.stub={was:old,left:2};parkPrefs.stubs=(parkPrefs.stubs|0)+1;}
  parkPersist();
  aleRowBuild(); /* #277: and Settings → Alebrijes lists the dog by its new name, in the look that went with it */
  toast("✏️ "+(stub?T().renameStub(n,old):T().renameDone(n)),2800);
});
$("renX").addEventListener("click",()=>{renTarget=null;$("renP").hidden=true;});
$("cmdReh").addEventListener("click",()=>{
  const c=nearestDog(),rec=c&&dogRecord(c);if(!rec)return;
  $("dogP").hidden=true;
  if(!rec.friend)rec.friend=pickFriend();
  rec.rehomed=true;rec.out=false;parkPersist();
  if(LEASH&&LEASH.cr===c)LEASH=null;
  c.follow=false;c.task=null;
  dogPlace(c,rec);
  const fname=rec.friend?npcName(rec.friend.key).split(" ·")[0]:"…";
  toast("🏡 "+T().rehomeDone(c.name,fname),3600);
});
/* a save that closed the app mid-park: make sure a dog is there when it reopens */
function parkRescue(){
  if(world===PL.park&&!CRIT.some(c=>isDog(c)&&c.world===PL.park)){
    const s0=starDog()||CRIT.find(c=>isDog(c));
    if(s0){s0.world=PL.park;s0.x=PL.parkDog[0];s0.y=PL.parkDog[1];s0.fx=s0.x;s0.fy=s0.y;s0.home=PL.parkDogHome.slice();}
  }
}
npcPersist();
let nmPending=null,nmEdit=null;
function despawnAt(gx,gy){ /* lift a custom creation off the map (record untouched) */
  const w=CW();
  const i=w.npcs.findIndex(n=>n.x===gx&&n.y===gy&&String(n.key).startsWith("~c"));
  if(i>=0){w.grid[gy][gx]=w.rows[gy][gx];w.npcs.splice(i,1);return true;}
  return false;}
function npcAt(gx,gy){
  const w=CW();
  if(gx<0||gy<0||gx>=w.W||gy>=w.H)return;
  /* tap an existing creation to EDIT it: rename, re-roll the look, or move out */
  const i=w.npcs.findIndex(n=>n.x===gx&&n.y===gy&&String(n.key).startsWith("~c"));
  if(i>=0){
    const rec=myNpcs.find(r=>r.w===world&&(r.x|0)===gx&&(r.y|0)===gy);
    if(!rec){toast(T().npcLease,2200);return;} /* content townsfolk have a lease — they stay */
    nmEdit={rec,gx,gy};nmPending=null;
    $("nmTitle").textContent=T().nmEditTitle;$("nmLb").textContent=T().nmLb;
    $("nmOk").textContent=T().nmSave;$("nmCancel").textContent=T().nmCancel;
    $("nmLook").textContent=T().nmLook;$("nmOut").textContent=T().nmOut;
    $("nmLook").hidden=false;$("nmOut").hidden=false;
    $("nmName").value=rec.n;$("npcMaker").hidden=false;
    setTimeout(()=>$("nmName").focus(),60);return;}
  const ci=CRIT.findIndex(cr=>cr.kind==="beagle"&&cr.world===world&&cr.home[0]===gx&&cr.home[1]===gy);
  if(ci>=0){CRIT.splice(ci,1);
    myNpcs=myNpcs.filter(r=>!(r.w===world&&(r.x|0)===gx&&(r.y|0)===gy));npcPersist();
    toast(T().npcGone,1800);return;}
  if(SOLID.has(w.grid[gy][gx])||w.grid[gy][gx]==="N")return;
  if(myNpcs.length>=12){toast(T().npcFull,2400);return;}
  nmPending={w:world,x:gx,y:gy};nmEdit=null;
  $("nmTitle").textContent=T().nmTitle;$("nmLb").textContent=T().nmLb;
  $("nmOk").textContent=T().nmOk;$("nmCancel").textContent=T().nmCancel;
  $("nmLook").hidden=true;$("nmOut").hidden=true;
  $("nmName").value="";$("npcMaker").hidden=false;
  setTimeout(()=>$("nmName").focus(),60);
}
$("nmCancel").addEventListener("click",()=>{$("npcMaker").hidden=true;nmPending=null;nmEdit=null;});
$("nmLook").addEventListener("click",()=>{ /* re-roll the look, panel stays open — roll till it's them */
  if(!nmEdit)return;
  nmEdit.rec.lk=randLook();despawnAt(nmEdit.gx,nmEdit.gy);spawnCustom(nmEdit.rec);npcPersist();
  toast(T().npcLook,1400);});
$("nmOut").addEventListener("click",()=>{
  if(!nmEdit)return;
  despawnAt(nmEdit.gx,nmEdit.gy);
  myNpcs=myNpcs.filter(r=>r!==nmEdit.rec);npcPersist();
  $("npcMaker").hidden=true;nmEdit=null;toast(T().npcGone,1800);});
$("nmOk").addEventListener("click",()=>{
  if(nmEdit){ /* save edits: rename can even re-trigger an egg (name a neighbour after the star dog and a dog he is) */
    const name=sanName($("nmName").value);
    if(name){nmEdit.rec.n=name;despawnAt(nmEdit.gx,nmEdit.gy);spawnCustom(nmEdit.rec);npcPersist();
      const eg2=eggFor(name);toast(eg2?eggLines(eg2,name)[0]:T().npcSaved,eg2?3400:1800);}
    $("npcMaker").hidden=true;nmEdit=null;return;}
  const name=sanName($("nmName").value);
  if(!name||!nmPending){$("npcMaker").hidden=true;nmPending=null;return;}
  const rec={n:name,w:nmPending.w,x:nmPending.x,y:nmPending.y,lk:randLook()};
  if(spawnCustom(rec)){myNpcs.push(rec);npcPersist();
    const eg=eggFor(name);
    toast(eg?eggLines(eg,name)[0]:T().npcMade(name),eg?3400:2200);}
  $("npcMaker").hidden=true;nmPending=null;
});
$("nmName").addEventListener("keydown",e=>{if(e.key==="Enter")$("nmOk").click();});
/* city growth application: stages follow completed La Obra quests (12, 13) */
/* Rewind a world to the map it shipped with. Station NPCs go back to where the map
   put them (Lupe included); chill townsfolk — the content pack's and the owner's —
   keep the spots they were placed on. */
function rebuildWorld(id){
  const w=WORLDS[id],defs=WNPC[id]||{};
  w.rows=w.rows0.slice();
  w.grid=w.rows.map(r=>r.split(""));
  w.rows.forEach((row,y)=>[...row].forEach((ch,x)=>{
    if(defs[ch]){const n=w.npcs.find(m=>m.key===ch);if(n){n.x=x;n.y=y;}}}));
  w.npcs.forEach(n=>{if(w.grid[n.y]&&w.grid[n.y][n.x]!==undefined)w.grid[n.y][n.x]="N";});
}
/* The city is a pure function of progress: rewind the street, then build back
   exactly what has been earned. So "New game +" really does hand you an empty lot —
   no Studio you did not raise, no mercado you did not open. */
function applyGrowth(){
  const g=GRW();
  new Set([g.staged&&g.staged.world,...ribbons().map(r=>r.world)].filter(Boolean))
    .forEach(id=>{if(WORLDS[id])rebuildWorld(id);});
  applyStaged();applyRibbon();applyBuilds();
  Object.values(WORLDS).forEach(w=>{w._cuts=null;});   /* growth changes what a corridor is (R11) */
  if(typeof t3Invalidate==="function")t3Invalidate();} /* the 3D camera rebuilds its meshes */
function applyStaged(){
  const g=GRW().staged;if(!g||!g.tiles)return;
  const w=WORLDS[g.world];if(!w)return;
  const s=g.quests.filter(i=>done.has(i)).length;
  for(let k=1;k<=s;k++)(g.tiles[k]||[]).forEach(([y,x,ch])=>{
    if(w.grid[y][x]!=="N"&&w.rows[y][x]!=="L"){w.rows[y]=w.rows[y].slice(0,x)+ch+w.rows[y].slice(x+1);w.grid[y][x]=ch;}});
  if(s>=g.quests.length&&g.done){
    const mv=g.done.moveNpc;                  /* whoever content says steps out front */
    if(mv){const n=w.npcs.find(m=>m.key===mv.key);
      if(n&&!(n.x===mv.x&&n.y===mv.y)){
        if(w.grid[n.y]&&w.grid[n.y][n.x]==="N"){w.grid[n.y][n.x]="B";
          w.rows[n.y]=w.rows[n.y].slice(0,n.x)+"B"+w.rows[n.y].slice(n.x+1);}
        n.x=mv.x;n.y=mv.y;w.grid[mv.y][mv.x]="N";}}
    const sl=g.done.seal;                     /* the finished building becomes solid */
    if(sl)for(let y=sl.y0;y<=sl.y1;y++)for(let x=sl.x0;x<=sl.x1;x++){
      if(w.grid[y]&&w.grid[y][x]!==undefined&&w.grid[y][x]!=="N"){
        w.rows[y]=w.rows[y].slice(0,x)+sl.tile+w.rows[y].slice(x+1);w.grid[y][x]=sl.tile;}}
  }
  /* a stage can grow over the tile the hero stands on — step them out to the doorstep
     content nominated. Belt-and-braces: the same rescue fires if growth ever CUTS OFF
     that tile (walkable but enclosed), so no future stage can wall anyone in. */
  const sf=g.safe;
  if(sf&&world===g.world&&(isSolid(px,py)||!growthReach(px,py))){
    px=fx=sf.x;py=fy=sf.y;dir="down";held=null;moving=false;}
  if(SOLID.has(w.grid[PIG.y][PIG.x])){const pa=ANI("pig")||ANIDEF.pig;PIG.x=PIG.fx=pa.x|0;PIG.y=PIG.fy=pa.y|0;PIG.moving=false;} /* Paloma will not be bricked in — she goes back where her pack put her */
}
/* A storefront, a gift or a page on your wall may say ONE line the first time it lands.
   Nothing in the city announced its own deliveries: the owner finished districts, pages were
   pinned to his office wall exactly as designed, and he asked three times where they were
   (2026-09-03). A thing that arrives while you are looking at a different screen has to say
   so. Said once ever — the seen list is saved — and never as a list of what is left. */
function ribbonSay(){
  const lines=[];
  ribbons().forEach(r=>{
    if(!r.id||!r.say||!ribbonUp(r))return;
    const k="r:"+r.id;if(seenOpen.has(k))return;
    seenOpen.add(k);lines.push(r.say[lang]||r.say.en);});
  if(!lines.length)return;
  save();
  lines.slice(0,3).forEach((m,i)=>setTimeout(()=>toast(m,3800),1500+i*1100));
}
/* ---------- BUILDS — construction from a template, with variation ----------
   Don Güero is handed a template and builds from it, changing a few things each time
   (owner, 2026-09-03: "assign him a house template that he can build and just add some
   random customizations"). No network, no model: a template is content, and the engine
   only resolves choices and stamps tiles.

   Four architectural commitments, because this has to carry more than a casita later:

   1. DETERMINISTIC. Variation comes from a seeded generator, never Math.random. The same
      lot builds the same house on every device, every reload, every session — which is the
      only way saves, screenshots and a future multiplayer can agree on what the city looks
      like.
   2. RESOLVED PICKS ARE REMEMBERED (save key `bl`). Once a house is built, its choices are
      pinned, so a later content edit that adds options does NOT silently reshape houses
      somebody already lives beside. New lots get the new options; old lots keep their faces.
   3. PARTS RESOLVE IN ORDER AND SEE EACH OTHER. A part may declare `when(ctx)` and read
      `ctx.pick` (what earlier parts chose) and `ctx.flags` (worldFlags — district grades and
      all). That is the hook for "the roof depends on the door", "this block is richer once
      the taller opens", and anything else a pack invents later, with no engine change.
   4. NOTHING IS STAMPED THAT BREAKS THE CITY. Every build is validated before a single tile
      lands: inside the map, never over a person, never over a portal, never a door that opens
      onto nothing (#9), and no portal in that world may lose its last standable neighbour.
      A refused build is logged to the console and fails the smoke (§27); saying it in play is
      El Portero's job (#8, designed, not built).

   A template: {id, size:{w,h}, parts:[Part]}
   A Part:     {id, when?(ctx), tiles?:[[dy,dx,glyph]], reads?:[{x,y,doc}], pick?:[Option]}
   An Option:  {id, w?:weight, tiles?:[...], reads?:[...]}
   Tiles are relative to the build's own corner, so a template can be dropped anywhere. */
const BLD=()=>(typeof BUILDTPL!=="undefined"&&BUILDTPL)?BUILDTPL:{};
const BLDS=()=>(typeof BUILDS!=="undefined"&&Array.isArray(BUILDS))?BUILDS:[];
let bldPicks={};            /* buildId -> {partId: optionId}, saved so a house keeps its face */
let bldReads=[];            /* readable things a build put into the world */
let bldWarned=false;
/* the lots stand from the first frame, new game or old: builds are applied here at load (a save
   re-applies them with the faces it kept, through applyGrowth), so a room a template carries is a
   world before anyone can walk toward it (#10) */
applyBuilds();
function bldHash(s){let h=2166136261>>>0;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  return h>>>0;}
function bldRng(seed){let a=bldHash(String(seed))||1;
  return ()=>{a^=a<<13;a>>>=0;a^=a>>>17;a^=a<<5;a>>>=0;return a/4294967296;};}
/* a template plus a lot becomes a concrete list of tiles — and the list of choices that made it */
function resolveBuild(b){
  const T=BLD()[b.tpl];if(!T)return null;
  const rnd=bldRng(b.seed!==undefined?b.seed:(b.id+"|"+b.world+"|"+b.x+","+b.y));
  const saved=bldPicks[b.id]||null,pick={},tiles=[],reads=[],links=[];
  (T.parts||[]).forEach(part=>{
    const ctx={pick,build:b,tpl:T,flags:worldFlags()};
    if(typeof part.when==="function"){let ok=false;try{ok=!!part.when(ctx);}catch(e){ok=false;}if(!ok)return;}
    let src=part;
    if(part.pick&&part.pick.length){
      let opt=saved&&saved[part.id]&&part.pick.find(o=>o.id===saved[part.id]);
      if(!opt){const tot=part.pick.reduce((s,o)=>s+(o.w||1),0);let r=rnd()*tot;
        opt=part.pick.find(o=>(r-=(o.w||1))<0)||part.pick[part.pick.length-1];}
      pick[part.id]=opt.id;src=opt;
    }
    (src.tiles||[]).forEach(t=>tiles.push([b.y+t[0],b.x+t[1],t[2]]));
    (src.reads||[]).forEach(r=>reads.push({world:b.world,x:b.x+(r.x|0),y:b.y+(r.y|0),doc:r.doc}));
    /* `link` (#10): this part's door at [dy,dx] opens into an interior the template carries — rows,
       people, a name in both languages — and its exit tile leads back to the doorstep. One lot, one
       room of its own, keyed by where the door stands (PORTALSAT), so a template stamps as many
       homes as there are lots and every door still goes somewhere. */
    if(src.link&&src.link.interior)links.push({x:b.x+src.link.door[1],y:b.y+src.link.door[0],interior:src.link.interior,
      landing:src.link.landing,exit:src.link.exit,id:b.id});
  });
  return {id:b.id,world:b.world,tpl:b.tpl,pick,tiles,reads,links};
}
/* refuse anything that would wall the city in. Cheap, and it runs before a tile is written. */
function buildSafe(spec){
  const w=WORLDS[spec.world];if(!w)return "no such world: "+spec.world;
  for(const [y,x,ch] of spec.tiles){
    if(y<0||x<0||y>=w.H||x>=w.W)return "off the map at "+x+","+y;
    if(w.grid[y][x]==="N")return "somebody is standing at "+x+","+y;
    const over=DOORSET.has(w.rows[y][x])&&portalAt(spec.world,x,y);
    if(over&&over.by!==spec.id) /* a lot may be stamped again over its own door (applyGrowth re-applies every build) */
      return "it would build over the door at "+x+","+y;
    /* #9 (Don Güero, 2026-09-07): a build may not lay a tile the pack declares to be a DOOR
       (TILEMETA kind:"door") unless that door opens — walkable, or a portal on that glyph in this
       world. A painted door on a wall is the shortcut "nothing goes into the world the player
       cannot use" forbids; the engine refuses it instead of a session remembering to. */
    if((TILES[ch]||{}).kind==="door"&&SOLID.has(ch)&&!(PORTALS[spec.world]||{})[ch]&&!(spec.links||[]).some(l=>l.x===x&&l.y===y))
      return "the door at "+x+","+y+" would open onto nothing";
  }
  /* simulate, then check every portal in this world still has somewhere to stand */
  const g=w.grid.map(r=>r.slice()),rows=w.rows.slice();
  spec.tiles.forEach(([y,x,ch])=>{g[y][x]=ch;rows[y]=rows[y].slice(0,x)+ch+rows[y].slice(x+1);});
  const P=PORTALS[spec.world]||{},A=PORTALSAT[spec.world]||{};
  for(let y=0;y<w.H;y++)for(let x=0;x<w.W;x++){
    if(!P[rows[y][x]]&&!A[x+","+y])continue;
    const ok=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const nx=x+dx,ny=y+dy;
      return nx>=0&&ny>=0&&nx<w.W&&ny<w.H&&!SOLID.has(g[ny][nx])&&g[ny][nx]!=="N";});
    if(!ok)return "it would seal the door at "+x+","+y;
  }
  return null;
}
function applyBuilds(){
  bldReads=[];
  BLDS().forEach(b=>{
    const spec=resolveBuild(b);
    if(!spec){if(!bldWarned){bldWarned=true;mqwarn("build","no template named "+b.tpl,true);}return;}
    const bad=buildSafe(spec);
    if(bad){mqwarn("build","refused to build "+b.id+" — "+bad,true);return;}
    const w=WORLDS[spec.world];
    spec.tiles.forEach(([y,x,ch])=>{
      w.rows[y]=w.rows[y].slice(0,x)+ch+w.rows[y].slice(x+1);w.grid[y][x]=ch;});
    bldPicks[b.id]=spec.pick;
    spec.reads.forEach(r=>bldReads.push(r));
    (spec.links||[]).forEach(l=>buildInterior(spec.world,l));
  });
}
/* an interior a build carries becomes a WORLD of its own, named after the lot (an id is at most
   twelve characters — the save keeps that many), with its people, its name and its arrival line
   in both languages; the lot's door and the room's exit become coordinate portals to each other */
function buildInterior(from,l){
  const I=l.interior,id=String(l.id).slice(0,12);
  const rows=I.rows.slice(),grid=[],wnpcs=[],defs=I.people||{};
  rows.forEach((row,y)=>{grid.push(row.split(""));row.split("").forEach((ch,x)=>{
    if(defs[ch]){wnpcs.push({key:ch,x,y,...defs[ch]});grid[y][x]="N";}});});
  WORLDS[id]={rows,rows0:I.rows.slice(),grid,npcs:wnpcs,W:rows[0].length,H:rows.length,built:true};
  (I.reads||[]).forEach(r=>bldReads.push({world:id,x:r.x|0,y:r.y|0,doc:r.doc})); /* a sheet on a desk inside */
  Object.keys(UI).forEach(lg=>{const t=UI[lg];if(!t)return;t.locs=t.locs||{};t.arrive=t.arrive||{};
    if(I.locs)t.locs[id]=I.locs[lg]||I.locs.en||id;if(I.arrive)t.arrive[id]=I.arrive[lg]||I.arrive.en||"";});
  const ld=l.landing||[Math.floor(rows[0].length/2),rows.length-2],ex=l.exit||[Math.floor(rows[0].length/2),rows.length-1];
  (PORTALSAT[from]=PORTALSAT[from]||{})[l.x+","+l.y]={to:id,x:ld[0],y:ld[1],dir:"up",by:l.id};
  (PORTALSAT[id]=PORTALSAT[id]||{})[ex[0]+","+ex[1]]={to:from,x:l.x,y:l.y+1,dir:"down",by:l.id};
}
/* a district's storefront ribbon: dropped once that district has opened */
function applyRibbon(){
  ribbons().forEach(r=>{if(!r.tiles||!ribbonUp(r))return;
    const w=WORLDS[r.world];if(!w)return;
    r.tiles.forEach(([y,x,ch])=>{
      if(!w.grid[y]||w.grid[y][x]==="N")return;
      w.rows[y]=w.rows[y].slice(0,x)+ch+w.rows[y].slice(x+1);w.grid[y][x]=ch;});});
}
function growthReach(tx,ty){ /* BFS from the doorstep content nominated — open ground at every stage */
  const g=GRW().staged,sf=g&&g.safe;if(!sf)return true;
  const w=WORLDS[g.world];if(!w)return true;
  const seen=new Set([sf.x+","+sf.y]),q=[[sf.x,sf.y]];
  while(q.length){const[x,y]=q.shift();
    if(x===tx&&y===ty)return true;
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{const nx=x+dx,ny=y+dy,k=nx+","+ny;
      if(seen.has(k)||nx<0||ny<0||nx>=w.W||ny>=w.H||SOLID.has(w.grid[ny][nx])||w.grid[ny][nx]==="N")return;
      seen.add(k);q.push([nx,ny]);});}
  return false;
}
/* A lot that opened while this phone was away — an update landed, a pass was boarded —
   is announced once, with the toast its district would have played, and only while
   nobody there has been talked to yet. Never a list, never a count. */
function lateOpenToast(){
  if(chSeen<1)return;
  const L=CHS(),i=Math.min(chSeen,L.length)-1,K=epiKeys(i,i>=L.length-1),nx=L[chSeen];
  if(!nx||seenOpen.has(K.open)||nx.quests.some(q=>done.has(q)))return;
  seenOpen.add(K.open);save();
  setTimeout(()=>toast(T()[K.open]||"",4200),1400);
}
/* ---------- boot ---------- */
wanderInit();
{const bad=auditWander();if(bad.length)mqwarn("world","nowhere to walk for "+bad.join(" | "),false);}
arrivalsOnRails().forEach(function(m){mqwarn("arrival",m,true);});
troAudit().forEach(function(m){mqwarn("trolley",m,true);});
const SV=loadSave();
if(SV&&SV.n){$("continueBtn").hidden=false;
  $("continueBtn").textContent=T().contBtn(SV.n,SV.xp,SV.d.length);
  $("continueBtn").addEventListener("click",()=>{
    heroName=SV.n;cls=SV.c||"";look=SV.lk||look;xp=SV.xp||0;hearts=SV.he??3;done=new Set(SV.d||[]);
    treats=SV.tr||0;fredQ=SV.fq||0;chSeen=SV.cs||0;seenOpen=new Set(SV.so||[]);handedDocs=new Set(SV.hd||[]);
    bldPicks=(SV.bl&&typeof SV.bl==="object")?SV.bl:{};   /* the houses keep the faces they were built with */
    /* a save written before v2 lost cs on every Continue. Rebuild it from what was played:
       a district counts as claimed when its need is met AND the next district has been
       started — so a last visit never seen is still played, and one seen is not replayed. */
    if(SV.v===undefined){const L=CHS();let n=0;
      for(let i=0;i<L.length;i++){const c=L[i],nx=L[i+1];
        if(c.quests.filter(q=>done.has(q)).length<c.need)break;
        if(!nx||!nx.quests.some(q=>done.has(q)))break;n=i+1;}
      chSeen=Math.max(chSeen,n);}
    marks=(SV.mk&&typeof SV.mk==="object")?SV.mk:{}; /* pre-grade saves start unmarked */
    wear=(SV.wr&&typeof SV.wr==="object")?{bandana:null,collar:null,cape:null,...SV.wr}
        :{bandana:fredQ>=2?"#C0392B":null,collar:null,cape:null}; /* pre-wardrobe saves: keep the earned red bandana */
    qa=(SV.qa&&typeof SV.qa==="object")?SV.qa:{}; /* pre-retry saves: done quests stay done, credited as-is */
    wearCat=(SV.wc&&typeof SV.wc==="object")?{bandana:null,collar:null,...SV.wc}:{bandana:null,collar:null};
    world=WORLDS[SV.w]?SV.w:PL.home;
    px=fx=SV.px??10;py=fy=SV.py??11;
    applyGrowth();parkRescue();
    if(px>=CW().W||py>=CW().H||isSolid(px,py)){world=PL.home;px=fx=PL.spawn[0];py=fy=PL.spawn[1];}
    if(chDue()){finish(livesOn()&&hearts<=0);$("intro").hidden=true;$("hud").hidden=false;$("xpbarwrap").hidden=(typeof HUDFACT==="function");applyCtl();hud();}
    else{enterWorld(false);lateOpenToast();ribbonSay();}   /* anything that arrived while the phone was away */
  });
}
/* Trolley Pass arrival: a #save= hash offers to board; never overwrites without the tap */
(function(){
  const pass=readPass();
  if(!pass)return;
  const t=T();
  $("tpFoundLb").textContent=t.tpFoundLb;
  $("tpFoundTx").textContent=t.tpFoundTx(pass.s.n,pass.s.xp||0,(pass.s.d||[]).length,QEN.length)+(SV&&SV.n?" "+t.tpReplace(SV.n):"");
  $("tpBoard").textContent=t.tpBoard;$("tpSkip").textContent=t.tpSkip;
  $("tpFound").hidden=false;
  $("tpBoard").addEventListener("click",()=>{
    /* CRITICAL: taking a pass onto this device IS the save. If this one fails silently the
       reload lands you back where you were with no idea why the pass did nothing. */
    if(!mqStore(SK("1"),JSON.stringify(pass.s),true))return;
    if(pass.l)mqStore(SK("lang"),pass.l);
    stripPassHash();location.reload();
  });
  $("tpSkip").addEventListener("click",()=>{stripPassHash();$("tpFound").hidden=true;});
})();
applyAdmin();applyStakes();applyLang();applyCtl();applyTheme();camSet(camMode);
/* the version shows on the opening page AND in Settings (owner 2026-09-02: "so i know
   which im using") — the number a phone actually loaded, not the one a branch claims */
[$("verTag"),$("verIntro")].forEach(el=>{if(el)el.textContent=GN()+" · "+(typeof GAMEV!=="undefined"?GAMEV:"dev");});
try{if(sessionStorage.getItem(SK("upd"))==="1"){sessionStorage.removeItem(SK("upd"));
  setTimeout(()=>toast("⬆️ "+(typeof GAMEV!=="undefined"?GAMEV:"")+" — "+T().updToast,3200),900);}}catch(e){}
if(NET.enabled)NET.boot();
if(RECORD.enabled){try{RECORD.boot();}catch(err){console.warn("RECORD: boot failed",err);}}
requestAnimationFrame(ts=>{last=ts;loop(ts);});
sizeCanvas();
