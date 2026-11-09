/* =========================================================
   THE KITCHEN ROOM — the kitchen wall, its things, its hand, its closet and its builder (sprint 8a, 2026-11-02)
   Moved here, byte for byte apart from four var declarations kept in engine.js, out of engine/engine.js, so the kitchen's tools (sprint 8a) have a file of their own and
   engine.js stops growing. NOTHING CHANGES FOR A PLAYER: every shape and every page is the same, held by test/engine.smoke.js.
   It is written by engine/boot.js AFTER engine.js and before engine3d.js, in the same global scope, as engine3d.js is: what
   engine.js runs at load and needs from here is a `var` read unset (kitBuildReady, kitEmptyAt, KITHAND), and the kitchens a
   world declares (KITCHENWALLS) are laid at the foot of this file, once the rooms stand as the device last left them.
   Sections, by name: WHERE THE READER STANDS, THE KITCHEN LAYOUT, THE THINGS IN A PLACE, THE HAND, THE CLOSET, THE KITCHEN BUILDER.
   ========================================================= */
/* WHERE THE READER STANDS (sprint 6; his confirmed goal of 2026-10-31, point 1: a kitchen place's page opened in full screen
   stays inside the view). The reader is a panel OUTSIDE #vp, at the top of the page, and has always been: a quest hides #world,
   and a document handed over in a quest must not go with it. In full screen the browser shows #vp and what is inside it and
   nothing else, so a page outside it could only be seen by leaving full screen, which resized the canvas and left the room
   dark. So, and only for a kitchen place's page opened while #vp is full screen, the reader stands INSIDE #vp for as long as
   the page is open; every other page, and every other moment, finds it where it always was. It goes home when the page is put
   down, when a card or a quest takes the screen, and when full screen is left. A page, the keys and the quest card are
   untouched; Meridian has no kitchen page, so for it this is never called with `true`. */
let readerHome=null;
function readerSeat(inside){const r=$("reader"),vp=$("vp");if(!r||!vp)return;
  if(inside){if(r.parentNode!==vp){if(!readerHome)readerHome={parent:r.parentNode,next:r.nextSibling};vp.appendChild(r);}return;}
  if(!readerHome)return;
  const h=readerHome;readerHome=null;
  if(r.parentNode===vp&&h.parent&&h.parent.isConnected)h.parent.insertBefore(r,h.next&&h.next.parentNode===h.parent?h.next:null);}
/* IS THE ROOM IN VIEW BESIDE THE KITCHEN PAGE? True while a kitchen place's page is open and the reader's own box is the
   narrower part of the view (a shell docks it at the right, sprint 5), so the world is still drawn, live, in what is left
   of the view. Measured when asked after the page opens, the window changes or full screen does; never on a page that has
   no kitchen. A page that covers the view (a phone) is not beside anything, and the world is not drawn under it. */
let docBesideV=null;
function kitBeside(){const r=$("reader");if(!kitNow||!r||r.hidden||!r.dataset.kit)return false;
  if(docBesideV===null){const a=r.getBoundingClientRect(),v=$("vp").getBoundingClientRect();docBesideV=v.width>0&&a.width>0&&a.width<v.width*0.75;}
  return docBesideV;}
window.addEventListener("resize",()=>{docBesideV=null;});
document.addEventListener("fullscreenchange",()=>{docBesideV=null;});
/* ═══════════ THE KITCHEN LAYOUT (2026-10-30) — a room's kitchen wall, built from what a world says stands in it ═══════════
   A world says where its kitchen wall stands and what places it has, and the engine builds it: every column of the wall is
   one square of the map, and that square is one shape stacking its places' pieces in their bands, as engine/kitchen.js
   says (`KITCHEN`). Standing in front of a column offers Open where Read is offered; a tap on a place in the 3D picture
   opens it too. Opening swings its doors or slides its drawers out by themselves, and then the reader shows what the world
   hands it for that place. The engine never learns what is kept in a kitchen: the world's `page` draws it.

   HOW A WORLD SAYS IT. `KITCHENWALLS = { <room id>: layout }` in its content, or `kitchenLay(<room id>, layout)` at any
   time (a game that turns its own save into a room each time the room opens). A layout:
     wall    the columns' squares, in order, `[[x,y], …]`: column 0 is the first. At most 40. Each square holds `◧` in the
             map (one letter for "a kitchen column", whatever is in it), and no square in the room holds `◧` that is not one
             of them or one of its free squares. A column's Open is offered on the first side of it a person can stand
             at, south, east, west, north, as a piece turns to face the room, read off the map as the room stands when it is laid; a column
             with no such side (something set down in front of it) is built and tapped, and offers no Open.
     free    optional (2026-10-30): squares of the wall that hold no place yet, `[[x,y], …]`, in the order the wall grows
             into them: a column added past the wall's end stands on the first. Each holds `◧` in the map, and the wall and
             its free squares are at most 40 together. Nobody stands on one; in 3D it shows the fitter's tape on the floor.
     sides   optional (sprint 7 of the 3D kitchen: an L or a U, along walls only): up to 2 side walls, `[{squares, face}]`,
             each its squares in order along it, `[[x,y], …]`, every one a `◧` in the map, and the way it faces the room,
             one of `north`, `south`, `east`, `west` (KITFACE). Only on a wall with gaps (below): every square of a side wall
             is a column that may stand empty, drawn with the fitter's tape. A piece on one is turned to face the room its
             wall's way, its back on that wall (engine/shapes.js, `face`), and its Open is offered from the square it faces.
             The back wall, its free squares and every side wall are at most 40 squares together, and no square is named by
             two. THE CORNER where two walls meet is on neither wall's list, so no piece ever stands in it: it is left empty
             (the map has floor there, or whatever the world draws). A layout with no side walls is exactly as before.
     places  `[{kind, row, col, side, name, full, finish, id}]`: a kind and a row from `KITCHEN` (a tall kind in the tall row,
             every other in one of `KITCHEN.rows`, as My kitchen saves them), its column, on a side wall that wall's
             index in `sides` (`side`) with its column counted along that wall from 0, and optionally a name (text, at
             most 30 characters, nothing that cannot be shown), how full it is (one of `KITCHEN.fulls`), what it is
             finished in (one of `KITCHEN.finishes` by name, never a colour, and none on a kind `KITCHEN.unfinished`
             names; left out it is wood, as every kitchen was before), and an id (the world's own name for the place, 1 to
             30 letters, digits, - or _, no two alike: carried through every change the builder makes, so what a world
             keeps in a place follows it when it moves; the engine never reads it). At most 120. In a layout that hands
             `things` and `keep`, a place laid with no id is given one (grep "EVERY PLACE THAT KEEPS THINGS HAS AN ID").
             What `page` is handed counts a side wall's columns on past the back wall's, the engine's own count, and
             says `side`.
     page    optional: `(place, lang) => sections`, the reader's own blocks for that place. `place` is a frozen copy of
             what was checked, with `i`, its index in `places`.
     store   optional (2026-10-30): `(layout) => …`, where the world keeps a change the builder makes, handed a plain copy
             of the new layout, `{wall, free, places}`, and `sides` when it has them. A layout with a store may be changed in builder mode (grep "THE
             KITCHEN BUILDER"); one with none never is. The engine keeps no kitchen of its own.
     gaps    optional (sprint 5 of the 3D kitchen): `true` turns gaps on for this wall, as engine/kitchen.js's rules read
             it: a column of the wall may stand empty, a move leaves the column it left empty, a piece steps onto empty
             squares, and in builder mode a tap on an empty square puts the piece picked there. Set by the world, in its
             own code; never handed to `store`, so nothing a world keeps carries it. Left out, or false, the wall is
             packed as it always was, and a column with nothing in it is refused. An empty column is drawn as a free
             square is: the fitter's tape on the floor.
     things, keep   optional (sprint 5): what a place keeps, drawn in 3D inside it and taken in hand (grep "THE THINGS IN A
             PLACE" and "THE HAND").
   EVERY LAYOUT IS CHECKED AT THE EDGE, BEFORE ANYTHING IS BUILT, AND ONE THAT FAILS IS REFUSED WHOLE: a sentence in the log
   (kind `kitchen`, always critical) and no kitchen at all in that room, never part of one. Refused: anything not a plain
   object or list where one is meant, a key a layout does not have, a kind or a row off the closed lists, a column off the
   wall, two places in one spot, a tall piece with anything else in its column, two pieces whose bands overlap in one
   column, a column with nothing in it (unless gaps are on), gaps that are not true or false, a name that is not text or is too long, a fullness off the list, a finish off the
   list or on a kind that takes none, an id that is not one or is used twice, a wall or free square that is not `◧` or is
   off the map or named twice, a `◧` neither on the wall nor free, a page or a store that is not a function. A name is
   only ever shown as text.

   WHERE OPEN STANDS, AND HOW IT SHARES READ'S PLACE: one slot, one button. The Read button is the slot; standing in front
   of a kitchen column it says Open and the place's name, and a column with more than one place says each name and offers
   each on a short page of its own. Anywhere else the slot is the closet's beside one (grep "THE CLOSET"), and otherwise
   Read, exactly as before. A card a world placed on a column's own square, which nobody can stand beside but its front,
   is shown at the end of every page that column opens, so Open never hides one; a card whose READS entry names a `row`
   is about the place in that row, and ends that place's page only, while a place stands in that row there (once none
   does, the builder having moved it, it ends every page of its column again). A world that declares no layout and lays
   no closet gets Read, and only Read, from the very same code. */
const KITCOLS=40,KITPLACES=120,KITNAME=30,KITSWING=420,KITSIDES=2;
const KITFACE={north:[0,-1],south:[0,1],east:[1,0],west:[-1,0]};   /* the way a side wall faces the room, and the square in front of it (sprint 7) */
const KITID=/^[A-Za-z0-9_-]{1,30}$/;   /* a place's id: the world's own name for it, carried through every change and never read by the engine */
const KITUNSAFE=/[\u0000-\u001F\u007F-\u009F\u061C\u200B-\u200F\u2028\u2029\u202A-\u202E\u2066-\u2069\uFEFF]/;   /* what may not be shown in a name: My kitchen's UNSAFE, the same characters */
/* the engine's own letter for each kind's piece, so a flat camera draws a column as its places' own drawings; held equal
   to SHAPEBIND and KITCHEN.pieces by test/engine.smoke.js */
const KITLETTER={fridge:"W",freezer:"▉","upper-cupboards":"⬒","lower-cupboards":"⬓",drawers:"☷",shelves:"⊤",counter:"━"};
const KITOPEN={};let kitBusy=false;   /* kitNow is a var of engine.js (it is read while that file loads) */
var kitBuildReady=false;   /* the builder's state stands only from its own section down (grep "THE KITCHEN BUILDER") */
function kitchenCheck(id,L){
  const K=typeof KITCHEN==="object"&&KITCHEN,w=WORLDS[id],own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const plain=o=>!!o&&typeof o==="object"&&!Array.isArray(o)&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
  const why=t=>({why:t});
  if(!K||!plain(K.kinds)||!Array.isArray(K.rows)||!plain(K.bands)||!Array.isArray(K.fulls))return why("this page has no KITCHEN to check it against (engine/kitchen.js is loaded before the engine, or not at all)");
  if(!w)return why("there is no room called "+JSON.stringify(String(id).slice(0,40)));
  if(!plain(L))return why("a layout is an object with a wall and places");
  const extra=Object.keys(L).find(k=>!["wall","free","sides","places","page","store","gaps","things","keep","tools"].includes(k));
  if(extra!==undefined)return why("a layout has a wall, free squares, side walls, places, a page, a store, gaps, things and a keep, and this one says "+JSON.stringify(extra.slice(0,30))+" (and `tools`, which a layout with things and a keep may add)");
  if(own(L,"page")&&typeof L.page!=="function")return why("its page is not a function");
  if(own(L,"store")&&typeof L.store!=="function")return why("its store is not a function");
  if(own(L,"gaps")&&L.gaps!==true&&L.gaps!==false)return why("its gaps are "+JSON.stringify(String(L.gaps).slice(0,20))+", and gaps are on (true) or off (false)");
  if(own(L,"things")&&typeof L.things!=="function")return why("its things are not a function");
  if(own(L,"keep")&&typeof L.keep!=="function")return why("its keep is not a function");
  if(own(L,"tools")){const T0=L.tools;   /* the kitchen's tools (sprint 8a, grep "THE KITCHEN'S TOOLS"): the game's own items and the one place it keeps a change */
    if(!plain(T0)||Object.keys(T0).some(k=>!["own","keep","signs","amount","loose","rename"].includes(k))||typeof T0.own!=="function"||typeof T0.keep!=="function")return why("its tools are not an object with an own and a keep, both functions (and perhaps `signs`)");
    if(own(T0,"signs")&&typeof T0.signs!=="boolean")return why("its tools' `signs` is not true or false");
    if(own(T0,"amount")&&typeof T0.amount!=="boolean")return why("its tools' `amount` is not true or false");
    if(own(T0,"rename")&&typeof T0.rename!=="boolean")return why("its tools' `rename` is not true or false");
    if(own(T0,"loose")&&typeof T0.loose!=="function")return why("its tools' `loose` is not a function");
    if(typeof L.things!=="function"||typeof L.keep!=="function")return why("it has tools and no things or no keep, and the tools work on what a place keeps");}
  const gaps=L.gaps===true;
  const W=L.wall;
  if(!Array.isArray(W)||!W.length)return why("its wall names no column");
  if(W.length>KITCOLS)return why("its wall has "+W.length+" columns, and a wall has at most "+KITCOLS);
  const cols=[],at={};
  for(let c=0;c<W.length;c++){const q=W[c];
    if(!Array.isArray(q)||q.length!==2||!Number.isInteger(q[0])||!Number.isInteger(q[1]))return why("column "+c+" of its wall is not a square [x,y]");
    const[x,y]=q;
    if(x<0||y<0||x>=w.W||y>=w.H)return why("column "+c+" of its wall, ("+x+","+y+"), is off the map");
    if(w.rows[y][x]!==KITCOL)return why("column "+c+" of its wall, ("+x+","+y+"), is not a kitchen column ("+KITCOL+") in the map");
    if(at[x+","+y]!==undefined)return why("columns "+at[x+","+y]+" and "+c+" of its wall are one square, ("+x+","+y+")");
    at[x+","+y]=c;
    const fr=[[0,1],[1,0],[-1,0],[0,-1]].find(([dx,dy])=>{const fx=x+dx,fy=y+dy;
      return fx>=0&&fy>=0&&fx<w.W&&fy<w.H&&!shutToPeople(w.rows[fy][fx])&&!DOORSET.has(w.rows[fy][fx]);});
    cols.push(fr?{x,y,fx:x+fr[0],fy:y+fr[1]}:{x,y,fx:-1,fy:-1});}   /* nowhere to stand (a thing set down in front of it): no Open, and a tap still opens it */
  /* THE FREE SQUARES (2026-10-30, grep "THE KITCHEN BUILDER"): squares of the wall that hold no place yet, in the order
     the wall grows into them, each a `◧` in the map; the wall and its free squares together at most KITCOLS */
  const F=own(L,"free")?L.free:[],free=[];
  if(!Array.isArray(F))return why("its free squares are not a list");
  if(W.length+F.length>KITCOLS)return why("its wall and its free squares are "+(W.length+F.length)+" squares, and a wall has at most "+KITCOLS);
  for(let f=0;f<F.length;f++){const q=F[f];
    if(!Array.isArray(q)||q.length!==2||!Number.isInteger(q[0])||!Number.isInteger(q[1]))return why("free square "+f+" is not a square [x,y]");
    const[x,y]=q;
    if(x<0||y<0||x>=w.W||y>=w.H)return why("free square "+f+", ("+x+","+y+"), is off the map");
    if(w.rows[y][x]!==KITCOL)return why("free square "+f+", ("+x+","+y+"), is not a kitchen column ("+KITCOL+") in the map");
    if(at[x+","+y]!==undefined)return why("free square "+f+", ("+x+","+y+"), is "+(typeof at[x+","+y]==="number"?"column "+at[x+","+y]+" of its wall":"free square "+at[x+","+y].slice(1))+" already");
    at[x+","+y]="f"+f;free.push(Object.freeze([x,y]));}
  /* THE SIDE WALLS (sprint 7, grep "SIDE WALLS" above): on a wall with gaps, at most KITSIDES, each its squares in order and
     the way it faces, from a closed list; every square a `◧`, none named twice by any wall, and every wall's squares and
     the free ones at most KITCOLS together. Their columns are numbered on past the back wall's, in the engine's own count */
  const S=own(L,"sides")?L.sides:[],sides=[],back=cols.length;
  if(!Array.isArray(S))return why("its side walls are not a list");
  if(S.length&&!gaps)return why("it has side walls and its gaps are off, where a kitchen along more than one wall has gaps on");
  if(S.length>KITSIDES)return why("it has "+S.length+" side walls, and a kitchen has at most "+KITSIDES);
  let all=W.length+F.length;
  for(let s=0;s<S.length;s++){const sw=S[s],it="side wall "+s;
    if(!plain(sw))return why(it+" is not a wall of squares and a way it faces");
    const ex=Object.keys(sw).find(k=>!["squares","face"].includes(k));
    if(ex!==undefined)return why(it+" says "+JSON.stringify(ex.slice(0,30))+", and a side wall has squares and a way it faces");
    if(typeof sw.face!=="string"||!own(KITFACE,sw.face))return why(it+" faces "+JSON.stringify(String(sw.face).slice(0,20))+", and a wall faces "+Object.keys(KITFACE).join(", "));
    const Q=sw.squares;
    if(!Array.isArray(Q)||!Q.length)return why(it+" names no square");
    all+=Q.length;if(all>KITCOLS)return why("its walls and its free squares are "+all+" squares or more, and a kitchen has at most "+KITCOLS);
    const d=KITFACE[sw.face],from=cols.length;
    for(let k=0;k<Q.length;k++){const q=Q[k];
      if(!Array.isArray(q)||q.length!==2||!Number.isInteger(q[0])||!Number.isInteger(q[1]))return why("square "+k+" of "+it+" is not a square [x,y]");
      const[x,y]=q;
      if(x<0||y<0||x>=w.W||y>=w.H)return why("square "+k+" of "+it+", ("+x+","+y+"), is off the map");
      if(w.rows[y][x]!==KITCOL)return why("square "+k+" of "+it+", ("+x+","+y+"), is not a kitchen column ("+KITCOL+") in the map");
      if(at[x+","+y]!==undefined)return why("square "+k+" of "+it+", ("+x+","+y+"), is named by a wall already");
      at[x+","+y]="s"+s;
      const fx=x+d[0],fy=y+d[1],ok=fx>=0&&fy>=0&&fx<w.W&&fy<w.H&&!shutToPeople(w.rows[fy][fx])&&!DOORSET.has(w.rows[fy][fx]);   /* Open is offered from the square it faces */
      cols.push(Object.assign(ok?{x,y,fx,fy}:{x,y,fx:-1,fy:-1},{side:s,face:sw.face}));}
    sides.push(Object.freeze({face:sw.face,from,squares:Object.freeze(Q.map(q=>Object.freeze([q[0],q[1]])))}));}
  for(let y=0;y<w.H;y++)for(let x=0;x<w.W;x++)if(w.rows[y][x]===KITCOL&&at[x+","+y]===undefined)
    return why("the map has a kitchen column at ("+x+","+y+") that its wall does not name, nor its free squares"+(sides.length?", nor its side walls":""));
  const P=L.places;
  if(!Array.isArray(P)||!P.length)return why("it has no places");
  if(P.length>KITPLACES)return why("it has "+P.length+" places, and a kitchen has at most "+KITPLACES);
  const places=[],spot={},byCol=cols.map(()=>[]),ids=new Set();
  for(let i=0;i<P.length;i++){const p=P[i],it="place "+i;
    if(!plain(p))return why(it+" is not a place");
    const ex=Object.keys(p).find(k=>!["kind","row","col","side","name","full","finish","id"].includes(k));
    if(ex!==undefined)return why(it+" says "+JSON.stringify(ex.slice(0,30))+", and a place has a kind, a row, a column, a side wall, a name, a fullness, a finish and an id");
    if(own(p,"side")&&!(Number.isInteger(p.side)&&p.side>=0&&p.side<sides.length))return why(it+" stands on side wall "+JSON.stringify(p.side)+", and "+(sides.length?"the layout's side walls are 0 to "+(sides.length-1):"the layout has none"));
    const sw=own(p,"side")?sides[p.side]:null,n=sw?sw.squares.length:back;   /* a place on a side wall: its column along that wall */
    if(own(p,"id")){if(typeof p.id!=="string"||!KITID.test(p.id))return why(it+"'s id is not an id: 1 to 30 letters, digits, - or _");
      if(ids.has(p.id))return why("two places have the id "+JSON.stringify(p.id));ids.add(p.id);}
    if(typeof p.kind!=="string"||!own(K.kinds,p.kind))return why(it+" is of a kind there is none of ("+JSON.stringify(String(p.kind).slice(0,30))+")");
    if(K.kinds[p.kind]==="tall"?p.row!=="tall":!K.rows.includes(p.row))return why(it+", the "+p.kind+", stands in the row "+JSON.stringify(String(p.row).slice(0,20))+", where "+(K.kinds[p.kind]==="tall"?"a tall piece stands in the tall row":"it stands in one of "+K.rows.join(", ")));
    if(!Number.isInteger(p.col)||p.col<0||p.col>=n)return why(it+", the "+p.kind+", is in column "+JSON.stringify(p.col)+", and "+(sw?"side wall "+p.side+" has squares":"the wall has columns")+" 0 to "+(n-1));
    const gc=sw?sw.from+p.col:p.col;   /* its column in the engine's own count: the back wall's first, then each side wall's */
    if(own(p,"name")&&!(typeof p.name==="string"&&!KITUNSAFE.test(p.name)&&p.name===p.name.trim()&&p.name!==""&&Array.from(p.name).length<=KITNAME))
      return why(it+"'s name is not a name: text, trimmed, 1 to "+KITNAME+" characters, nothing that cannot be shown");
    if(own(p,"full")&&!K.fulls.includes(p.full))return why(it+" is "+JSON.stringify(String(p.full).slice(0,20))+" full, and a place is "+K.fulls.join(", ")+" or not said");
    if(own(p,"finish")){const FS=plain(K.finishes)?K.finishes:{};   /* a name on the list, never a colour (engine/kitchen.js, `finishes`) */
      if(typeof p.finish!=="string"||!own(FS,p.finish))return why(it+" is finished in "+JSON.stringify(String(p.finish).slice(0,20))+", and a finish is one of "+(Object.keys(FS).join(", ")||"none on this page"));
      if(Array.isArray(K.unfinished)&&K.unfinished.includes(p.kind))return why(it+", the "+p.kind+", is finished in "+p.finish+", and a "+p.kind+" takes no finish");}
    const k=gc+"|"+p.row;if(spot[k]!==undefined)return why("places "+spot[k]+" and "+i+" are in one spot, column "+p.col+(sw?" of side wall "+p.side:"")+", "+p.row);spot[k]=i;
    const q={kind:p.kind,row:p.row,col:gc,i};if(sw)q.side=p.side;if(own(p,"name"))q.name=p.name;if(own(p,"full"))q.full=p.full;if(own(p,"finish"))q.finish=p.finish;if(own(p,"id"))q.id=p.id;
    places.push(Object.freeze(q));byCol[gc].push(q);}
  for(let c=0;c<cols.length;c++){const ps=byCol[c];
    if(!ps.length){if(gaps)continue;return why("column "+c+" has nothing in it");}   /* an empty column, on a wall with gaps (sprint 5) */
    if(ps.length>1&&ps.some(p=>p.row==="tall"))return why("column "+c+" holds a tall piece and something else; a tall piece stands alone");
    for(let a=0;a<ps.length;a++)for(let b=a+1;b<ps.length;b++){const A=K.bands[ps[a].kind],B=K.bands[ps[b].kind];
      if(!A||!B||(A.lo<B.hi-0.001&&B.lo<A.hi-0.001))return why("in column "+c+" the "+ps[a].kind+" and the "+ps[b].kind+" would stand in each other");}}
  const out={id,cols:Object.freeze(cols.map(c=>Object.freeze(c))),free:Object.freeze(free),places:Object.freeze(places),page:typeof L.page==="function"?L.page:null,store:typeof L.store==="function"?L.store:null,
    gaps,things:typeof L.things==="function"?L.things:null,keep:typeof L.keep==="function"?L.keep:null,tools:own(L,"tools")?L.tools:null};
  if(sides.length){out.back=back;out.sides=Object.freeze(sides);}   /* only a kitchen along more than one wall says so */
  return {wall:Object.freeze(out)};
}
/* EVERY PLACE THAT KEEPS THINGS HAS AN ID (sprint 7; his confirmed goal of 2026-10-31, a thing in hand put in a piece just
   added): a kitchen kept before sprint 6 has pieces the builder added with no id, and a place with none keeps nothing
   (kitCanHold). So a layout that hands `things` and `keep` is laid with every plain place that has no id given the first of
   n1, n2, … that no place has and that passes KITID, in the places' order, as a piece added is given one (kitGiveId): the
   same layout is given the same ids every time it is laid, and the world keeps them with the layout it is handed at the
   builder's next change, or at once (the town does, on reading its kept kitchen back). Anything else is handed on as it
   came, for the check to answer; a layout with no things is never given one (My kitchen's kind) */
function kitIdsGiven(L){const plain=o=>!!o&&typeof o==="object"&&!Array.isArray(o)&&[Object.prototype,null].includes(Object.getPrototypeOf(o)),own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  if(!plain(L)||typeof L.things!=="function"||typeof L.keep!=="function"||!Array.isArray(L.places))return L;
  const bare=p=>plain(p)&&!own(p,"id");if(!L.places.some(bare))return L;
  const taken=new Set(L.places.map(p=>plain(p)&&own(p,"id")?p.id:undefined));let n=0;
  return Object.assign({},L,{places:L.places.map(p=>{if(!bare(p))return p;let id;do{id="n"+(++n);}while(taken.has(id)||!KITID.test(id));taken.add(id);return Object.assign({},p,{id});})});}
/* lay it, or refuse it whole and say why; the answer is the sentence, or null when it stands */
function kitchenLay(id,L){L=kitIdsGiven(L);const r=kitchenCheck(id,L);
  if(r.why){const had=!!KITWALL[id];delete KITWALL[id];
    mqwarn("kitchen",JSON.stringify(String(id).slice(0,40))+" is refused whole: "+r.why,true);
    if(had)kitDirty();return r.why;}
  KITWALL[id]=r.wall;
  if(!TILEMESH[KITCOL])TILEMESH[KITCOL]=o=>kitColumnParts(o);   /* the column's shape, unless the pack gave the letter its own */
  kitDirty();return null;}
function kitDirty(){if(typeof t3Invalidate==="function")t3Invalidate();if(typeof checkTalk==="function"&&$("world")&&!$("world").hidden)checkTalk();
  if(kitBuildReady)kitBuildShow();kitHandShow();kitToolsShow();}
/* the column at a square of the room you stand in, while the map still has its letter there */
function kitColAt(x,y){const K=KITWALL[world],w=CW();if(!K||!w||!w.grid[y]||w.grid[y][x]!==KITCOL)return -1;
  return K.cols.findIndex(c=>c.x===x&&c.y===y);}
const kitOpenOf=(id,i)=>{const v=KITOPEN[id+"|"+i];return typeof v==="number"?v:0;};
/* a free square of the wall of the room you stand in (grep "THE KITCHEN BUILDER"), while the map still has its letter there;
   and, on a wall with gaps (sprint 5), a column of it with nothing in it, which is drawn exactly as a free square is */
function kitFreeAt(x,y){const K=KITWALL[world],w=CW();if(!K||!K.free||!w||!w.grid[y]||w.grid[y][x]!==KITCOL)return false;
  if(K.free.some(q=>q[0]===x&&q[1]===y))return true;
  if(!K.gaps)return false;
  const c=K.cols.findIndex(q=>q.x===x&&q.y===y);return c>=0&&!K.places.some(p=>p.col===c);}
/* A FREE SQUARE IN 3D: nothing stands there yet, so what shows is what a fitter leaves where a piece will go: four strips of
   blue tape on the floor round the square, laid by hand, so no two quite line up. Never nothing, which the camera would
   build as a plain box (`t3MeshTile`), and nothing a person could take for a piece. */
const KITTAPE="#3E7CB1";
function kitTape(x,y){const out=[],L=0.86,T=0.035,H=0.004,j=k=>((((x|0)*5+(y|0)*3+k*7)%5)-2)*0.006;
  [[0,-L/2,L,T],[0,L/2,L,T],[-L/2,0,T,L],[L/2,0,T,L]].forEach(([cx,cz,w,d],k)=>out.push({s:"box",x:cx+j(k),y:H/2,z:cz+j(k+2),w,h:H,d,c:KITTAPE,tape:1}));
  return out;}
function kitColumnParts({x,y}){const c=kitColAt(x,y);if(typeof SHAPES!=="object"||!SHAPES||typeof SHAPES.kitchenColumn!=="function")return [];
  if(c<0)return kitFreeAt(x,y)?kitTape(x,y):[];
  const ps=KITWALL[world].places.filter(p=>p.col===c);
  if(!ps.length)return kitFreeAt(x,y)?kitTape(x,y):[];   /* an empty column of a wall with gaps: the tape, as a free square */
  const arg={x,y,places:ps.map(p=>p.finish===undefined?{kind:p.kind,open:kitOpenOf(world,p.i)}:{kind:p.kind,open:kitOpenOf(world,p.i),finish:p.finish})};
  if(KITWALL[world].cols[c].face)arg.face=KITWALL[world].cols[c].face;   /* a side wall's column faces the room its wall's way (sprint 7) */
  const out=SHAPES.kitchenColumn(arg).map(q=>({...q,place:ps[q.place].i}));
  /* what each place keeps, standing in it where its inside shows (grep "THE THINGS IN A PLACE"); nothing, in a layout with no things */
  if(KITWALL[world].things)ps.forEach(p=>{kitThingParts(world,p,out.filter(q=>q.place===p.i)).forEach(q=>out.push(q));});
  /* the place the builder has picked, framed (grep "THE KITCHEN BUILDER"); nothing, with the builder off */
  const sel=kitBuildReady?kitBuildSel():null;
  if(sel!==null&&ps.some(p=>p.i===sel)){const col=KITWALL[world].cols[c];out.push(...kitFrame(out.filter(q=>q.place===sel&&!q.thing),col.fx<0?0:col.fx-x,col.fx<0?1:col.fy-y));}
  /* the places that hold what is searched for, framed in the same gold while the results show (sprint 8a, grep "THE KITCHEN'S TOOLS") */
  if(KTOOLS.glow.size){const col=KITWALL[world].cols[c];ps.forEach(p=>{if(KTOOLS.glow.has(p.i))out.push(...kitFrame(out.filter(q=>q.place===p.i&&!q.thing&&!q.picked&&!q.faced&&!q.glow),col.fx<0?0:col.fx-x,col.fx<0?1:col.fy-y).map(q=>({...q,glow:1,glowOf:p.i})));});}
  /* at a corner, the column the hero faces, framed in the same gold (sprint 8a, grep "AT A CORNER") */
  if(kitFacedWas===world+"|"+c){const col=KITWALL[world].cols[c],fdx=col.fx<0?0:col.fx-x,fdy=col.fx<0?1:col.fy-y,mine=out.filter(q=>!q.thing&&!q.picked&&!q.glow);
    out.push(...kitFrame(mine,fdx,fdy).concat(kitFaceMark(mine,fdx,fdy)).map(q=>({...q,faced:1})));}
  return out;}
/* A FRAME ROUND A PICKED PIECE: four gold bars just outside the face it turns to the room, measured off its own parts as they
   stand (each turned a quarter or not at all), so it fits a fridge and a shelf alike */
function kitFrame(ps,dx,dy){if(!ps.length)return [];
  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity,z0=Infinity,z1=-Infinity;
  ps.forEach(p=>{const w=p.w!==undefined?p.w:2*(p.r||p.rb||0.03),d=p.d!==undefined?p.d:2*(p.r||p.rb||0.03),h=p.h!==undefined?p.h:2*(p.r||0.03),
    a=Math.abs(Math.cos(p.ry||0)),b=Math.abs(Math.sin(p.ry||0)),hx=a*w/2+b*d/2,hz=b*w/2+a*d/2;
    x0=Math.min(x0,p.x-hx);x1=Math.max(x1,p.x+hx);z0=Math.min(z0,p.z-hz);z1=Math.max(z1,p.z+hz);y0=Math.min(y0,p.y-h/2);y1=Math.max(y1,p.y+h/2);});
  const T=0.04,G="#F2C230",out=[],my=(y0+y1)/2,hy=y1-y0+2*T,lo=Math.max(T/2,y0-T/2);
  if(dy){const z=dy>0?z1+0.012:z0-0.012,mx=(x0+x1)/2,wx=x1-x0+2*T;
    out.push({s:"box",x:mx,y:y1+T/2,z,w:wx,h:T,d:0.012,c:G},{s:"box",x:mx,y:lo,z,w:wx,h:T,d:0.012,c:G},
      {s:"box",x:x0-T/2,y:my,z,w:T,h:hy,d:0.012,c:G},{s:"box",x:x1+T/2,y:my,z,w:T,h:hy,d:0.012,c:G});}
  else{const x=dx>0?x1+0.012:x0-0.012,mz=(z0+z1)/2,wz=z1-z0+2*T;
    out.push({s:"box",x,y:y1+T/2,z:mz,w:0.012,h:T,d:wz,c:G},{s:"box",x,y:lo,z:mz,w:0.012,h:T,d:wz,c:G},
      {s:"box",x,y:my,z:z0-T/2,w:0.012,h:hy,d:T,c:G},{s:"box",x,y:my,z:z1+T/2,w:0.012,h:hy,d:T,c:G});}
  return out.map(q=>({...q,picked:1}));}
/* THE FACED PIECE, SEEN FROM ABOVE (review round, 2026-11-02): the builder's frame is a hairline on the piece's front, and the camera sees a front on a side
   wall almost edge-on, so the piece faced at a corner did not read. Two more marks in the same gold, which the camera does see: a thick rim along the
   piece's top edges, and a ring on the floor square in front of it (the square he stands on), as wide as the fitter's tape and twice as bright */
function kitFaceMark(ps,dx,dy){if(!ps.length)return [];
  let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity,y1=-Infinity;
  ps.forEach(p=>{const w=p.w!==undefined?p.w:2*(p.r||p.rb||0.03),d=p.d!==undefined?p.d:2*(p.r||p.rb||0.03),h=p.h!==undefined?p.h:2*(p.r||0.03),
    a=Math.abs(Math.cos(p.ry||0)),b=Math.abs(Math.sin(p.ry||0)),hx=a*w/2+b*d/2,hz=b*w/2+a*d/2;
    x0=Math.min(x0,p.x-hx);x1=Math.max(x1,p.x+hx);z0=Math.min(z0,p.z-hz);z1=Math.max(z1,p.z+hz);y1=Math.max(y1,p.y+h/2);});
  const G="#F2C230",W=0.08,H=0.03,out=[],ty=y1+H/2-0.004,mx=(x0+x1)/2,mz=(z0+z1)/2;
  out.push({s:"box",x:mx,y:ty,z:z0+W/2,w:x1-x0,h:H,d:W,c:G},{s:"box",x:mx,y:ty,z:z1-W/2,w:x1-x0,h:H,d:W,c:G},
    {s:"box",x:x0+W/2,y:ty,z:mz,w:W,h:H,d:z1-z0,c:G},{s:"box",x:x1-W/2,y:ty,z:mz,w:W,h:H,d:z1-z0,c:G});   /* the top's rim */
  const L=0.9,T=0.08,fy=0.012;
  [[0,-L/2,L,T],[0,L/2,L,T],[-L/2,0,T,L],[L/2,0,T,L]].forEach(([cx,cz,w,d])=>out.push({s:"box",x:dx+cx,y:fy/2,z:dy+cz,w,h:fy,d,c:G}));   /* the floor ring in front */
  return out;}
/* the letters a flat camera draws a column with, lowest first; and the iso camera's height and colour for it */
function kitLetters(x,y){const c=kitColAt(x,y);if(c<0||typeof KITCHEN!=="object")return [];
  return KITWALL[world].places.filter(p=>p.col===c).sort((a,b)=>KITCHEN.rank[b.row]-KITCHEN.rank[a.row]).map(p=>KITLETTER[p.kind]).filter(Boolean);}
function kitIso(w,x,y){if(w!==CW())return null;const gs=kitLetters(x,y);if(!gs.length)return null;
  const top=gs.reduce((a,g)=>(IZH[g]||0)>=(IZH[a]||0)?g:a,gs[0]);return {h:Math.max(...gs.map(g=>IZH[g]||9)),c:ISOCOL&&ISOCOL[top]||C.desk};}
/* a place's name in a language: its own, else the world's word for its kind, else the kind */
function kitName(p,lg){return p.name||(((UI[lg]||UI.en||{}).kitKinds)||{})[p.kind]||p.kind;}
/* the places a person standing at (x,y) is in front of, every column whose front this is */
function kitFront(x,y){const K=KITWALL[world];if(!K)return null;
  const cs=K.cols.map((c,i)=>i).filter(i=>K.cols[i].fx===x&&K.cols[i].fy===y&&kitColAt(K.cols[i].x,K.cols[i].y)===i);
  if(!cs.length)return null;
  const f=kitFacedCol(x,y,cs);   /* at a corner, the column the hero faces alone (sprint 8a); both, facing neither, as before */
  return K.places.filter(p=>f>=0?p.col===f:cs.includes(p.col)).sort((a,b)=>a.col-b.col||KITCHEN.rank[a.row]-KITCHEN.rank[b.row]);}
/* AT A CORNER, THE PIECE FACED (sprint 8a; his confirmed goal of 2026-11-02: at a corner, the piece the hero faces is outlined in
   gold and the slot names it, turning toward the other moves both). A corner is a square in front of more than one column (the
   square beside the back wall's end and the side wall's first, where the two walls meet). Of those columns the one on the square
   the hero looks at (`dir`) is the faced one: it alone is offered (the slot names its places, a press opens them), and a gold
   frame stands round it in 3D, the builder's (kitFrame). Facing neither, or standing anywhere that is in front of one column
   only, nothing is faced and every place in front is offered, as it always was. The frame follows a turn and a step
   (kitFaceTrack, asked each time the slot is). Held by test/engine.smoke.js, grep "AT A CORNER". */
function kitFacedCol(x,y,cs){if(!cs||cs.length<2||x!==px||y!==py)return -1;const K=KITWALL[world],d=DIRS[dir];if(!K||!d)return -1;
  const f=cs.find(i=>K.cols[i].x===x+d[0]&&K.cols[i].y===y+d[1]);return f===undefined?-1:f;}
var kitFacedWas=null;   /* the column framed now, "<room>|<column>", or null */
function kitFaceTrack(){const K=KITWALL[world];let now=null;
  if(K&&!$("world").hidden&&!moving){const cs=K.cols.map((c,i)=>i).filter(i=>K.cols[i].fx===px&&K.cols[i].fy===py&&kitColAt(K.cols[i].x,K.cols[i].y)===i),f=kitFacedCol(px,py,cs);
    if(f>=0)now=world+"|"+f;}
  if(now===kitFacedWas)return;
  const was=kitFacedWas;kitFacedWas=now;
  [was,now].forEach(k=>{if(!k)return;const[r,c]=k.split("|"),W=KITWALL[r],col=W&&W.cols[+c];
    if(col&&r===world&&typeof t3Reshape==="function"&&typeof T3==="object"&&String(T3.builtKey||"").indexOf(world+"|")===0)t3Reshape(col.x,col.y);});}
/* the page a place opens: the world's blocks for it, then every card placed on its column's square — a card that names the
   row of the place it is about (`row` on its READS entry, one of the column's rows) at the end of that place's page alone */
function kitDoc(id,p){const K=KITWALL[id],c=K.cols[p.col];
  const title={};Object.keys(UI).forEach(lg=>{title[lg]=kitName(p,lg);});
  return {title,kit:{id,i:p.i},build:()=>{let secs=kitHandOffer(id,p);   /* with a thing in hand, putting it here comes first (grep "THE HAND") */
    if(K.page){try{const r=K.page(p,lang);if(Array.isArray(r))secs=secs.concat(r);}catch(e){mqwarn("kitchen","the page of place "+p.i+" in "+id+" failed: "+String(e&&e.message||e),false);}}
    secs=secs.concat(kitThingGrid(id,p));   /* what it keeps, each a button that takes it in hand (grep "THE THINGS IN A PLACE"); nothing, in a layout with no things */
    secs=secs.concat(kitToolsPage(id,p));   /* how full, and each thing's count and date (grep "THE KITCHEN'S TOOLS"); nothing, in a layout with no tools */
    kitCards(id,p).forEach(r=>{secs.push({h:docTitle(r.doc)});secs.push(...(docSections(r.doc)||[]));});
    return secs;}};}
/* the cards placed on a place's column that end its page: a card whose row no place in this column stands in any more (a builder moved it) ends every page here, so Open never hides it */
function kitCards(id,p){const K=KITWALL[id],c=K.cols[p.col],rows=K.places.filter(q=>q.col===p.col).map(q=>q.row);
  return RD().filter(r=>r.world===id&&r.x===c.x&&r.y===c.y&&DC()[r.doc]&&(r.row===undefined||r.row===p.row||!rows.includes(r.row)));}
/* SWINGING IT: `open` from where it is to `to` over KITSWING ms, eased so it starts and ends at rest, and set to exactly `to`
   at the end; at once for a person who asked for less motion. Each step rebuilds that one column in the 3D picture. */
function kitSwing(id,i,to,done){const key=id+"|"+i,from=kitOpenOf(id,i),K=KITWALL[id],c=K&&K.places[i]&&K.cols[K.places[i].col];
  const shape=()=>{if(c&&id===world&&typeof t3Reshape==="function"&&typeof T3==="object"&&String(T3.builtKey||"").indexOf(world+"|")===0)t3Reshape(c.x,c.y);};
  let still=false;try{still=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);}catch(e){}
  if(still||from===to){KITOPEN[key]=to;shape();if(done)done();return;}
  const t0=performance.now();
  const step=()=>{const u=Math.min(1,(performance.now()-t0)/KITSWING),e=u*u*(3-2*u);
    KITOPEN[key]=u>=1?to:from+(to-from)*e;shape();
    if(u<1)requestAnimationFrame(step);else if(done)done();};
  requestAnimationFrame(step);}
/* OPEN ONE PLACE: its doors swing, then its page; one at a time */
function kitOpen(id,i){const K=KITWALL[id],p=K&&K.places[i];if(!p||kitBusy)return false;
  if(KITDATE&&typeof performance==="object"&&performance.now()-KITDATE.at>5000)KITDATE=null;   /* a date typed and refused is kept for the page opened again straight after, not for a visit later */
  if(KTOOLS.open)kitToolsClose();   /* the kitchen panel and a place's page stand in the same place (sprint 8a) */
  if(kitNow)kitShut();
  if(kitEmptyAt)kitEmptyOff(kitEmptyAt.id===id&&kitEmptyAt.i===i);   /* another empty place's line goes first; this same place stays open and says it again */
  const empty=kitIsEmpty(id,p);   /* asked before the doors swing, so the answer is the one the hero was standing there for */
  kitBusy=true;held=null;
  kitSwing(id,i,1,()=>{kitBusy=false;
    if(empty){kitEmptySay(id,p);return;}   /* an empty place: its doors, a line, and no page (grep "AN EMPTY PLACE") */
    const d=kitDoc(id,p);kitNow={id,i,doc:d};docOpen(d);checkRead();   /* the slot reads Close from here (sprint 6) */
    if(KITHAND){const b=$("docBody")&&$("docBody").querySelector(".dbtn");if(b)b.focus();}});   /* with a thing in hand, the keys go to putting it here */
  return true;}
/* the page is put down: the place shuts again, and the slot reads Open again */
function kitShut(){const n=kitNow;if(!n)return;kitNow=null;kitSwing(n.id,n.i,0);checkRead();}
/* AN EMPTY PLACE SAYS IT IS EMPTY (sprint 6; his confirmed goal of 2026-10-31, point 4, and his answer that it is for kitchen
   places). In a layout that hands `things`, a place that keeps nothing and has no card of its own on its page swings its doors
   and says one short line in the world's words (`kitEmptyLine` in UI, below), and opens no page: there is nothing on it to
   read. The doors shut again when the line is gone (KITSAYS ms) or when the hero steps away or leaves the room. With a thing in
   hand the page opens as it does for any place, offering to put it there; a layout without `things` opens its page as ever;
   a place whose things the world could not give (`bad`) is not said to be empty, since nobody knows. The line stands in #vp,
   so it is seen in full screen, and is a status for a screen reader. Held by test/engine.smoke.js, grep "AN EMPTY PLACE". */
const KITSAYS=2600;
var kitEmptyAt=null,kitEmptyT=null;   /* vars, so a caller earlier in the boot reads them unset rather than throwing */
function kitIsEmpty(id,p){const K=KITWALL[id];if(!K||typeof K.things!=="function")return false;
  if(KITHAND&&KITHAND.id===id)return false;
  const got=kitThingsOf(id,p.i);return !got.bad&&!got.list.length&&!kitCards(id,p).length;}
/* the line: the world's word for this kind of place (a kind to a sentence), or its one sentence with {name}, or "{name}: empty." */
function kitEmptyText(p){const t=T()||{},L=t.kitEmptyLine,has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  let s=null;
  if(typeof L==="string")s=L;
  else if(L&&typeof L==="object"&&!Array.isArray(L))s=(!p.name&&has(L,p.kind)&&typeof L[p.kind]==="string")?L[p.kind]:(has(L,"*")&&typeof L["*"]==="string"?L["*"]:null);
  if(typeof s!=="string"||!s)s="{name}: empty.";
  return kitFill(s,{name:kitName(p,lang)});}
function kitEmptySay(id,p){const vp=$("vp");if(!vp)return;
  let b=$("kitSays");
  if(!b){b=document.createElement("div");b.id="kitSays";b.setAttribute("role","status");b.setAttribute("aria-live","polite");b.hidden=true;
    Object.assign(b.style,{position:"absolute",left:"50%",transform:"translateX(-50%)",bottom:"112px",zIndex:"6",maxWidth:"86%",textAlign:"center",pointerEvents:"none",
      background:"rgba(20,16,30,.88)",color:"#EDE9F5",borderRadius:"999px",padding:"8px 14px",font:"500 13px 'IBM Plex Sans', system-ui, sans-serif",boxSizing:"border-box"});
    vp.appendChild(b);}
  b.textContent=kitEmptyText(p);b.hidden=false;
  kitEmptyAt={id,i:p.i,x:px,y:py};
  clearTimeout(kitEmptyT);kitEmptyT=setTimeout(()=>kitEmptyOff(),KITSAYS);}
/* the line is gone: its doors shut (unless they are to stay as they are, `stay`) */
function kitEmptyOff(stay){const n=kitEmptyAt;kitEmptyAt=null;clearTimeout(kitEmptyT);kitEmptyT=null;
  const b=$("kitSays");if(b){b.hidden=true;b.textContent="";}
  if(n&&!stay&&KITWALL[n.id])kitSwing(n.id,n.i,0);}
/* the slot's press, standing in front: one place opens; several are offered, each on its own button. While one of them is
   open the press shuts it, page and doors (sprint 6) */
function kitPress(){const ps=kitFront(px,py);if(!ps||!ps.length)return;
  if(kitNow&&kitNow.id===world&&ps.some(p=>p.i===kitNow.i)){
    if($("reader")&&!$("reader").hidden)$("docClose").click();else{kitShut();checkTalk();}
    return;}
  if(ps.length===1){kitOpen(world,ps[0].i);return;}
  const id=world,title={};Object.keys(UI).forEach(lg=>{title[lg]=((UI[lg]||{}).kitWhich)||((UI[lg]||{}).kitOpen)||"Open";});
  docOpen({title,build:()=>ps.map(p=>({btn:kitName(p,lang),run:()=>{$("docClose").click();kitOpen(id,p.i);}}))});}
/* A TAP ON A PLACE IN THE 3D PICTURE: the engine's first ray test, the 3D library's own (t3Pick, engine/engine3d.js). The
   nearest thing under the finger has to be a kitchen column; which of its places was touched is told by the height of the
   point, each piece standing in a band of its own. False when nothing opened, so a world with no kitchen keeps its tap. */
function kitTap(cx,cy){if(!KITWALL[world]||camMode!=="3d"||$("world").hidden||worldCovered()||typeof t3Pick!=="function")return false;
  const build=kitBuildReady&&kitBuildOn();   /* in builder mode a tap PICKS a piece, and a tap on nothing puts the pick down (grep "THE KITCHEN BUILDER") */
  const h=t3Pick(cx,cy);
  /* with a piece picked, on a wall with gaps, a tap on an empty square puts it there (sprint 5) */
  if(build&&KITWALL[world].gaps&&kitBuildSel()!==null){const sq=kitSquareAt(h);if(sq!==-1)return kitBuildPlace(sq);}   /* a column, or a side wall's {col, side} (sprint 7) */
  if(!h||!h.object||!h.object.userData||h.object.userData.g!==KITCOL)return build?kitBuildPick(null):false;
  const c=kitColAt(h.object.userData.x,h.object.userData.y);if(c<0)return build?kitBuildPick(null):false;
  const ps=KITWALL[world].places.filter(p=>p.col===c);if(!ps.length)return build?kitBuildPick(null):false;
  const y=h.point.y,band=p=>KITCHEN.bands[p.kind];
  const p=ps.find(q=>y>=band(q).lo-0.01&&y<=band(q).hi+0.01)||ps.reduce((a,q)=>Math.abs(y-(band(q).lo+band(q).hi)/2)<Math.abs(y-(band(a).lo+band(a).hi)/2)?q:a);
  return build?kitBuildPick(p.i):kitOpen(world,p.i);}
/* ═══════════ THE THINGS IN A PLACE (sprint 5 of the 3D kitchen) — what a world keeps in a place, standing in it in 3D ═══════════
   A layout may hand `things: (place, lang) => [thing, …]`, what that place keeps as the world answers it at that moment
   (the engine asks again every time it draws, and remembers nothing of the answer). Each thing is
     id     the world's own name for it (letters, digits, - or _, 1 to 30): only ever compared, never read;
     n      how many, a whole number from 1 to KITMANY;
     name   its name in `lang`, text of at most KITTHINGNAME characters, shown as text and nothing else;
     parts  optional: one of it in 3D, at most KITPARTS parts, each a part the engine already draws (`box`, `sph`, `cyl`,
            `cone` or `torus`, as engine/engine3d.js's t3Prim builds them) with only the keys a part has (`s`, `x`,`y`,`z`,
            `w`,`h`,`d`, `r`,`rt`,`rb`,`t`,`arc`, `rx`,`ry`,`rz`, `sx`,`sy`,`sz`, `c` and `cb`: the engine's one list but
            glass, grep "WHAT A THING'S PART MAY SAY"): each held by its kind on that list (grep "HOW FAR A THING'S PART MAY
            GO"): numbers finite and within a piece (x and z within KITREACH, half a tile, of the thing's middle, y from just
            under what it stands on to a tile over it; sizes above 0 and at most KITSIZE, a tile; turns within a full turn;
            stretches above 0 and at most 4), a colour `#rrggbb`, and a second colour `#rrggbb` if it has one, in TILE UNITS
            as every shape is; a key of a kind this file holds no bound for is refused;
     stand  optional: how many copies of it stand in 3D, 1 to KITCOPIES (left out, one), and never more than n: twelve eggs
            need not be twelve eggs;
     pic    optional: `(g, px)`, the world's own picture of it, drawn on a square canvas px wide (its page and the hand).
   CHECKED AT THE EDGE, EVERY TIME: a list that is not one, or a thing that fails any of the above, is refused, the thing
   whole and never part of it, with one sentence in the log (kind `kitchen`, said once per sentence a visit); a thing past
   KITTHINGS in a place is refused the same way. A refused thing is not drawn, not listed and not taken, and a place
   holding one gives nothing and takes nothing (THE HAND), so nothing a world keeps is lost by a put.
   SHOWN IN 3D where its piece shows its inside: a piece with doors or drawers while it is open (the swing included, so
   the things come into view as the doors turn), and a piece with nothing to open (the open shelf, the counter) always.
   They stand on its shelves, its drawers' floors and its top, measured off engine/shapes.js's pieces (KITINSIDE), spread
   over them in order, as many to a shelf as there is room for; each made smaller, never larger, until it fits where it
   stands; its copies side by side, siblings off one shape that differ only by how each came to rest. Its parts join its
   column's own and are built in that tile (`t3Reshape`), so nothing else in the room is touched. Held by
   test/engine.smoke.js, grep "THE THINGS IN A PLACE". */
const KITTHINGS=24,KITPARTS=24,KITMANY=999,KITCOPIES=3,KITTHINGNAME=40,KITREACH=0.5,KITSIZE=1,KITUNIT=20;
const KITPRIM=["box","sph","cyl","cone","torus"],KITHEX=/^#[0-9a-fA-F]{6}$/;
/* WHAT A THING'S PART MAY SAY, AND WHAT IS MADE SMALLER SO IT FITS: both read off the shape builder's one list (engine/engine3d.js,
   grep "THE ONE LIST OF WHAT A PART MAY SAY"), in its order, on the first part checked, since this file loads before that one. A
   thing's part may say every key of it but how see-through it is (`a`: nothing a place keeps is glass); what is made smaller to
   fit where it stands is its sizes, while where it stands is worked out again and its turns and stretches are kept */
let KITKEYS=null;
const kitKeys=()=>KITKEYS||(KITKEYS=Object.freeze({say:Object.freeze(Object.keys(PARTKEYS).filter(k=>PARTKEYS[k]!=="glass")),
  sizes:Object.freeze(Object.keys(PARTKEYS).filter(k=>PARTKEYS[k]==="size"))}));
/* HOW FAR A THING'S PART MAY GO, one bound for each kind of key on the one list, the key handed in for the three that differ
   within a kind: a place within the thing (x and z within KITREACH of its middle, y from just under what it stands on to a tile
   over it), a size above 0 and at most KITSIZE (a cylinder's end, rt or rb, may close to 0), an angle within a full turn either
   way (an arc, how much of a ring, above 0), a stretch above 0 and at most 4. Each answers null, or why not. A colour is
   #rrggbb, checked beside it. A key the list gains is held by its kind's bound the day it is added; a key of a kind with no
   bound here is refused with a sentence until one is written (closed by default), and a size this file's fit does not count
   (kitReach) is a red in test/engine.smoke.js, grep "THE ONE LIST OF WHAT A PART MAY SAY". */
const KITBOUND=Object.freeze({
  place:(k,v)=>k==="y"?(v<-0.05||v>1?"outside the thing":null):(Math.abs(v)>KITREACH?"past "+KITREACH+" from the thing's middle":null),
  size:(k,v)=>k==="rt"||k==="rb"?(v>=0&&v<=KITSIZE?null:"where a radius is 0 to "+KITSIZE):(v>0&&v<=KITSIZE?null:"where a size is above 0 and at most "+KITSIZE),
  angle:(k,v)=>k==="arc"?(v>0&&v<=Math.PI*2?null:"where an arc is above 0 and at most a full turn"):(Math.abs(v)>Math.PI*2?"past a full turn":null),
  stretch:(k,v)=>v>0&&v<=4?null:"where a stretch is above 0 and at most 4"});
/* WHERE THINGS STAND IN EACH KIND, in the piece's own frame before it is turned to the room: each level a floor (y, the top
   of what they stand on), the clear height over it (h), its width (w) and depth (d) about z, and how far it comes out
   with its drawer when open (pull). `bare`: nothing to open, so its things always show. Measured off engine/shapes.js:
   the fridge's floor and glass shelves, the cupboards' floors and shelves on pins, the open shelf's three planks, the
   worktop's slab, and the top drawer of the freezer and of the drawers: their drawers all come out together, so what a
   lower one held would stand under the one above it, out of sight; what they keep stands in the top one, in the part of
   it that comes out past the carcass, where the camera sees over its front. */
const KITINSIDE={
  fridge:{levels:[{y:0.07,h:0.17},{y:0.266,h:0.155},{y:0.446,h:0.15},{y:0.64,h:0.13},{y:0.791,h:0.13}].map(l=>({...l,w:0.5,d:0.4,z:-0.01,pull:0}))},
  freezer:{levels:[{y:0.677,h:0.24,w:0.48,d:0.22,z:0.1,pull:0.343}]},
  "upper-cupboards":{levels:[{y:0.72,h:0.115},{y:0.859,h:0.115}].map(l=>({...l,w:0.9,d:0.26,z:-0.01,pull:0}))},
  "lower-cupboards":{levels:[{y:0.08,h:0.2},{y:0.309,h:0.2}].map(l=>({...l,w:0.9,d:0.5,z:-0.01,pull:0}))},
  drawers:{levels:[{y:0.431,h:0.1,w:0.86,d:0.4,z:0,pull:0.378}]},
  shelves:{bare:1,levels:[{y:0.722,h:0.064},{y:0.811,h:0.064},{y:0.901,h:0.07}].map(l=>({...l,w:0.9,d:0.22,z:0.005,pull:0}))},
  counter:{bare:1,levels:[{y:0.57,h:0.3,w:0.9,d:0.46,z:0.04,pull:0}]},
};
const KITSAID=new Set();
function kitThingWarn(s){if(KITSAID.has(s)||KITSAID.size>200)return;KITSAID.add(s);mqwarn("kitchen",s,false);}
/* ONE PART, checked: null when it may be drawn, else why not */
function kitPartBad(p){const plain=!!p&&typeof p==="object"&&!Array.isArray(p)&&[Object.prototype,null].includes(Object.getPrototypeOf(p));
  if(!plain)return "a part is not a part";
  const KEYS=kitKeys().say;
  const ex=Object.keys(p).find(k=>!KEYS.includes(k));
  if(ex!==undefined)return Object.prototype.hasOwnProperty.call(PARTKEYS,ex)&&PARTKEYS[ex]==="glass"?"a part says "+JSON.stringify(ex)+", which makes the part glass, and nothing a place keeps is glass":"a part says "+JSON.stringify(ex.slice(0,20))+", which a part has not";
  if(!KITPRIM.includes(p.s))return "a part is a "+JSON.stringify(String(p.s).slice(0,20))+", and the engine draws "+KITPRIM.join(", ");
  if(typeof p.c!=="string"||!KITHEX.test(p.c))return "a part's colour is "+JSON.stringify(String(p.c).slice(0,20))+", not #rrggbb";
  for(const k of KEYS){if(k==="s"||k==="c"||p[k]===undefined)continue;const v=p[k],kind=PARTKEYS[k];
    if(kind==="colour"){if(typeof v!=="string"||!KITHEX.test(v))return "a part's "+k+" is "+JSON.stringify(String(v).slice(0,20))+", not #rrggbb";continue;}
    if(!Object.prototype.hasOwnProperty.call(KITBOUND,kind))return "a part says "+JSON.stringify(k)+", which the engine's one list calls a "+JSON.stringify(String(kind).slice(0,20))+", and a kitchen holds no bound for that kind";
    if(typeof v!=="number"||!isFinite(v))return "a part's "+k+" is not a number";
    const why=KITBOUND[kind](k,v);if(why)return "a part's "+k+" is "+v+", "+why;}
  return null;}
/* A PLACE'S THINGS AS THE WORLD ANSWERS THEM NOW, each checked whole: {list, bad}, bad true when anything was refused */
function kitThingsOf(id,i){const K=KITWALL[id],p=K&&K.places[i],out={list:[],bad:false};
  if(!p||typeof K.things!=="function")return out;
  const at="the things of place "+i+" in "+JSON.stringify(String(id).slice(0,40));
  let r;try{r=K.things(p,lang);}catch(e){kitThingWarn(at+" could not be asked: "+String(e&&e.message||e).slice(0,80));out.bad=true;return out;}
  return kitThingsFromList(K,r,at,out);}
/* A LIST OF THINGS AS A WORLD ANSWERS IT, each checked whole (a place's things, and the tools' `loose`, grep "THE AMOUNT AND THE HAND FROM OUTSIDE") */
function kitThingsFromList(K,r,at,out,cap){cap=cap||KITTHINGS;
  const AM=!!(K.tools&&K.tools.amount===true);
  if(r===undefined||r===null)return out;
  if(!Array.isArray(r)){kitThingWarn(at+" are not a list");out.bad=true;return out;}
  const seen=new Set();
  r.forEach((t,k)=>{const it=at+", thing "+k;let bad=null;
    if(k>=cap)bad="is past the "+cap+" a list holds";
    else if(!t||typeof t!=="object"||Array.isArray(t))bad="is not a thing";
    else if(Object.keys(t).some(q=>!["id","n","name","parts","stand","pic","date","own","unit","uncounted"].includes(q)))bad="says "+JSON.stringify(Object.keys(t).find(q=>!["id","n","name","parts","stand","pic","date","own","unit","uncounted"].includes(q)).slice(0,20))+", which a thing has not";
    else if(typeof t.id!=="string"||!KITID.test(t.id))bad="has no id: 1 to 30 letters, digits, - or _";
    else if(seen.has(t.id))bad="is "+t.id+" a second time";
    else if(!Number.isInteger(t.n)||t.n<(AM&&typeof t.unit==="string"?0:1)||t.n>KITMANY)bad="is "+JSON.stringify(t.n)+" of it, where a count is whole, from 1 to "+KITMANY;
    else if(!(typeof t.name==="string"&&!KITUNSAFE.test(t.name)&&t.name===t.name.trim()&&t.name!==""&&Array.from(t.name).length<=KITTHINGNAME))bad="has a name that is not a name: text, trimmed, 1 to "+KITTHINGNAME+" characters";
    else if(t.stand!==undefined&&!(Number.isInteger(t.stand)&&t.stand>=1&&t.stand<=KITCOPIES))bad="stands "+JSON.stringify(t.stand)+" copies, where 1 to "+KITCOPIES+" stand";
    else if(t.pic!==undefined&&typeof t.pic!=="function")bad="has a picture that is not a function";
    else if(t.date!==undefined&&!kitDayOk(t.date))bad="has a date that is not one: "+JSON.stringify(String(t.date).slice(0,20))+", where a date is YYYY-MM-DD and a day that exists";
    else if(t.unit!==undefined&&!(AM&&typeof t.unit==="string"&&!KITUNSAFE.test(t.unit)&&t.unit===t.unit.trim()&&t.unit!==""&&Array.from(t.unit).length<=KITUNIT))bad="has a unit that is not one: text, trimmed, 1 to "+KITUNIT+" characters, in a kitchen whose tools count amounts";
    else if(t.uncounted!==undefined&&!(AM&&t.uncounted===true&&t.n===1&&t.unit===undefined))bad="says it is uncounted with something that is not true, or with a count or a unit, or in a kitchen whose tools do not count amounts";
    else if(t.own!==undefined&&typeof t.own!=="boolean")bad="says whether it is the player's own with something that is not true or false";
    else if(t.parts!==undefined){if(!Array.isArray(t.parts))bad="has parts that are not a list";
      else if(t.parts.length>KITPARTS)bad="has "+t.parts.length+" parts, and a thing has at most "+KITPARTS;
      else for(const q of t.parts){const w=kitPartBad(q);if(w){bad=w;break;}}}
    if(bad){kitThingWarn(it+" is refused whole: "+bad);out.bad=true;return;}
    seen.add(t.id);
    out.list.push(Object.freeze({id:t.id,n:t.n,name:t.name,stand:t.stand===undefined?1:Math.max(1,Math.min(t.stand,t.n)),pic:t.pic||null,date:t.date||null,own:t.own===true,unit:t.unit===undefined?null:t.unit,uncounted:t.uncounted===true,
      parts:Object.freeze((t.parts||[]).map(q=>Object.freeze(Object.assign({},q))))}));});
  /* IN A KITCHEN WITH TOOLS, the things near or past their date come first, the soonest first; the rest stay in the world's order (sprint 8a) */
  if(K.tools&&out.list.some(t=>t.date)){const t0=kitDayNum(kitToday()),near=t=>!!t.date&&kitDayNum(t.date)-t0<=KITSOON;
    out.list=out.list.map((t,k)=>({t,k})).sort((a,b)=>{const na=near(a.t),nb=near(b.t);if(na!==nb)return na?-1:1;return na?kitDayNum(a.t.date)-kitDayNum(b.t.date)||a.k-b.k:a.k-b.k;}).map(x=>x.t);}
  return out;}
/* HOW FAR ONE PART REACHES, from its middle, along x, y and z: generous for a turned part, which may reach any way. Every size
   on the engine's one list must be counted here, or a thing made smaller to fit where it stands still sticks out of it:
   test/engine.smoke.js measures each key of the list against what the engine draws (grep "THE REACH A PART IS FITTED BY") */
function kitReach(p){const sx=p.sx||1,sy=p.sy||1,sz=p.sz||1,s=p.s;
  let a,b,c;
  if(s==="box"){a=(p.w||0.1)/2;b=(p.h||0.1)/2;c=(p.d||0.1)/2;}
  else if(s==="sph"){a=b=c=p.r||0.1;}
  else if(s==="cyl"){const R=Math.max(p.rt!==undefined?p.rt:(p.r||0.1),p.rb!==undefined?p.rb:(p.r||0.1));a=c=R;b=(p.h||0.1)/2;}
  else if(s==="cone"){a=c=p.r||0.1;b=(p.h||0.2)/2;}
  else{a=b=(p.r||0.2)+(p.t||0.03);c=p.t||0.03;}
  a*=sx;b*=sy;c*=sz;
  if(p.rx||p.ry||p.rz){const m=Math.hypot(a,b,c);return [m,m,m];}
  return [a,b,c];}
/* ONE THING'S PARTS, STANDING IN ITS PLACE: on level L of the piece, in a slot sw wide about sx, `copies` of it side by
   side, made smaller until they fit and never larger; then into the piece's frame: out with its drawer, back to its wall,
   turned to the room as the piece is (shift, ry: read off the piece's own parts). k is the thing's index, for its turn */
function kitStand(t,L,sx,sw,open,shift,ry,k){const ps=t.parts;if(!ps.length)return [];
  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity,z0=Infinity,z1=-Infinity;
  ps.forEach(p=>{const [a,b,c]=kitReach(p),x=p.x||0,y=p.y||0,z=p.z||0;x0=Math.min(x0,x-a);x1=Math.max(x1,x+a);y0=Math.min(y0,y-b);y1=Math.max(y1,y+b);z0=Math.min(z0,z-c);z1=Math.max(z1,z+c);});
  const n=t.stand,W=x1-x0,H=y1-y0,D=z1-z0,gap=0.15*W;
  const f=Math.min(1,(sw*0.94)/(n*W+(n-1)*gap),(L.h*0.94)/H,(L.d*0.94)/D);
  const cx=(x0+x1)/2,cz=(z0+z1)/2,lz=L.z+L.pull*open,out=[],cr=Math.cos(ry),sr=Math.sin(ry);
  for(let j=0;j<n;j++){
    const ox=sx+(j-(n-1)/2)*(W+gap)*f,turn=((((k+1)*5+(j+1)*3)%7)-3)*0.12;   /* how each copy came to rest: its own small turn, on both of its numbers */
    const ct=Math.cos(turn),st=Math.sin(turn);
    ps.forEach(p=>{const q={...p};
      const lx=((p.x||0)-cx)*f,lzz=((p.z||0)-cz)*f;
      const px2=ox+lx*ct+lzz*st,pz2=lz+(-lx*st+lzz*ct)+shift;
      q.x=px2*cr+pz2*sr;q.z=-px2*sr+pz2*cr;q.y=L.y+((p.y||0)-y0)*f;
      kitKeys().sizes.forEach(s=>{if(q[s]!==undefined)q[s]*=f;});
      q.ry=(p.ry||0)+turn+ry;out.push(q);});}
  return out;}
/* EVERY THING OF ONE PLACE in its column's parts, `piece` the piece's own parts as built (so its turn and its wall are
   read off it, never worked out again); none where its inside does not show, and none for the thing in hand */
function kitThingParts(id,p,piece){const IN=KITINSIDE[p.kind],K=KITWALL[id];if(!IN||!K||typeof K.things!=="function")return [];
  const open=kitOpenOf(id,p.i);if(!IN.bare&&!(open>0))return [];
  const ref=piece.find(q=>q.carcass||q.slab);if(!ref)return [];
  const ry=ref.ry||0,cr=Math.cos(ry),sr=Math.sin(ry),shift=(ref.x||0)*sr+(ref.z||0)*cr;   /* where its middle stands, back on its wall, before it is turned */
  const held=KITHAND&&KITHAND.id===id&&KITHAND.from===p.i?KITHAND.thing.id:null;
  const ts=kitThingsOf(id,p.i).list.filter(t=>t.id!==held&&t.parts.length);if(!ts.length)return [];
  const Ls=IN.levels,n=ts.length,out=[];
  let k=0;
  Ls.forEach((L,j)=>{const m=Math.floor(n/Ls.length)+(j<n%Ls.length?1:0);   /* spread over the levels in order, as evenly as they go */
    const sw=L.w/Math.max(1,m);
    for(let s=0;s<m;s++,k++)kitStand(ts[k],L,-L.w/2+sw*(s+0.5),sw,open,shift,ry,k).forEach(q=>out.push({...q,place:p.i,thing:k+1}));});
  return out;}
/* ═══════════ THE HAND (sprint 5 of the 3D kitchen) — a thing taken from a place's page, and put in another ═══════════
   A layout with `things` and `keep: (change) => …` lets a person move what a place keeps, the way a 2D kitchen wall does it:
   on a place's page each thing is a button (its picture, its name, how many); a press or a tap TAKES it in hand, and the
   page is put down. In hand it is shown over the room (its picture, its name, how many) with a way to put it back; the
   thing taken is not drawn in its place meanwhile. Opening another place, by Open or a tap, offers PUT IT HERE first on
   that place's page; a press moves the thing whole there, joining the same thing's count if the place has it. Opening the
   place it came from offers putting it back, as does a press on it again, ✕, or Escape.
   TAKING CHANGES NOTHING KEPT: the hand is the engine's for the visit, in memory, and nothing else; leaving the room, or
   reloading, puts it back. PUTTING IS ONE CHANGE: the two places' new lists, `{<place id>: [{id, n}, …], <place id>:
   […]}`, handed once to the world's `keep`, and only when that returns is it laid: the page drawn again from what the world
   now answers, and both places built again in 3D where they stand. A keep that throws makes no change, and says so. THE
   ENGINE NEVER KEEPS CONTENTS: it remembers no list, writes no storage, and asks the world again every time it draws. A
   place with no id, or holding a thing the engine refused, gives nothing and takes nothing; a put past KITTHINGS things
   or KITMANY of one thing is refused in a sentence. Words are the world's (`kh…` in UI), English when it gives none.
   Held by test/engine.smoke.js, grep "THE HAND". */
var KITHAND=null;   /* a var, so a caller earlier in the boot reads it unset rather than throwing */
const kitHandW=(k,d)=>{const t=T()||{};return typeof t[k]==="string"&&t[k]?t[k]:d;};
function kitCanHold(id,i){const K=KITWALL[id],p=K&&K.places[i];return !!p&&typeof K.things==="function"&&typeof K.keep==="function"&&typeof p.id==="string";}
/* ═══════════ THE AMOUNT, AND THE HAND FROM OUTSIDE (sprint 9 of the 3D kitchen) — two small seams, each on only where a game turns it on ═══════════
   `tools.amount: true`: a thing may carry `unit` (the game's own word, already in the language asked and already one or many: "2 bottles"),
   may be counted 0 when it has a unit (said as `ktNoneLeft`, "none left"), and may be `uncounted: true` (a thing the player has not
   counted: no number is said). Where a game turns it on the engine's own − and + on a place's page give way to the amount said as
   text, since the game edits the amount itself; a thing with none of these is said as it always was ("× 3"). Left out, nothing here runs.
   `tools.loose(lang)`: the things the game keeps that stand in no place yet, answered like `things` (checked the same way), shown
   in the Kitchen panel under "Not put away yet", each a button that takes it in hand (`kitHandStart`); a place then takes it by
   the hand's own put, and the game's `keep` is handed that one place (the thing named there was in none). `tools.rename: true`
   adds Rename to the builder's bar (grep "kitBuildRename"). Held by test/kitchen-seams.js. */
/* A GAME'S OWN SENTENCE FOR A REFUSED CHANGE: an error its `keep`, `store` or tools' `keep` throws may carry `say`, text already in the player's language (at most 160 characters); it is shown where the change was made, instead of "could not be kept on this device", and the ticker is not written again (the game has said it) */
/* a refusal is the game's own sentence, shown once on the toast and not written to the ticker; a plain failure goes the old way (toast, ticker) */
function kitSayRefusal(sd,plain){
  /* with a page over the world the toast is held and would say it a second time when the page is put down: the ticker, which shows over the page, says it now and the held copy is dropped */
  if(sd&&typeof worldCovered==="function"&&worldCovered()&&typeof toast==="function"){const n=typeof toastHeld!=="undefined"?toastHeld.length:0;toast(sd,2600);if(typeof toastHeld!=="undefined"&&toastHeld.length>n)toastHeld.length=n;return;}
  if(sd&&typeof toastShow==="function")toastShow(sd,2600);else if(typeof toast==="function")toast(sd||plain,2600);}
function kitRefused(e){return e&&typeof e==='object'&&typeof e.say==='string'&&e.say.trim()?String(e.say).replace(new RegExp(KITUNSAFE.source,'g'),'').slice(0,160):null;}
function kitAmtOn(K){return !!(K&&K.tools&&K.tools.amount===true);}
/* a thing's amount as words: "" for an uncounted thing, "none left", "2 bottles", or the usual "× 3" */
function kitAmt(t){if(t.uncounted)return "";if(t.n===0)return kitW("ktNoneLeft","none left");return t.unit?t.n+" "+t.unit:"× "+t.n;}
const kitAmtPlain=t=>!t.uncounted&&!t.unit&&t.n>0;
/* a thing's name with its amount, as a line says it: "Egg × 3" as ever, "Milk · 2 bottles", "Rice · none left", "Salt" */
function kitNameAmt(t){return kitAmtPlain(t)?t.name+" × "+t.n:t.name+(kitAmt(t)?" · "+kitAmt(t):"");}
/* a thing's picture on a canvas of its own, px wide; nothing drawn when the world gave none or it failed */
function kitPic(t,css){const cv=document.createElement("canvas"),K=Math.min(3,window.devicePixelRatio||1),px=Math.round(css*K);
  cv.width=cv.height=px;cv.style.width=cv.style.height=css+"px";cv.style.display="block";
  if(t.pic){try{t.pic(cv.getContext("2d"),px);}catch(e){kitThingWarn("a thing's picture failed: "+String(e&&e.message||e).slice(0,80));}}
  else{const g=cv.getContext("2d");g.fillStyle="rgba(237,233,245,.16)";g.beginPath();g.arc(px/2,px/2,px*0.4,0,Math.PI*2);g.fill();   /* no picture yet (a thing of the player's own): its first letter */
    g.fillStyle="#EDE9F5";g.font="600 "+Math.round(px*0.42)+"px system-ui, sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(Array.from(t.name||"?")[0].toUpperCase(),px/2,px/2+px*0.03);}
  return cv;}
/* TAKE: from place i of the room's kitchen, the thing with that id; the page is put down and the hand shown */
function kitTake(i,tid){const id=world,K=KITWALL[id];if(!kitCanHold(id,i))return false;
  if(KITHAND&&KITHAND.id===id&&KITHAND.from===i&&KITHAND.thing.id===tid){kitHandBack();kitRepage();return true;}   /* the same thing pressed again: put back */
  const got=kitThingsOf(id,i);if(got.bad)return false;
  const t=got.list.find(q=>q.id===tid);if(!t)return false;
  const was=KITHAND;KITHAND={id,from:i,thing:t};
  if(was&&was.id===id)kitReshapeAt(id,was.from);
  if(kitNow&&$("reader")&&!$("reader").hidden)$("docClose").click();else kitReshapeAt(id,i);
  kitHandShow();const b=$("khBack");if(b)b.focus();return true;}
/* PUT BACK: the hand emptied, nothing kept changed; the place it came from drawn with it again */
function kitHandBack(){const h=KITHAND;if(!h)return false;KITHAND=null;if(h.from!==null)kitReshapeAt(h.id,h.from);kitHandShow();return true;}
/* A THING TAKEN IN HAND FROM OUTSIDE ANY PLACE (a game's `tools.loose`): checked like any thing, held with no place it came from (`from` null), and
   put by the hand's own put; a thing already held is put back first. False when the room has no tools with `loose`, or the thing is refused */
function kitHandStart(thing){const K=kitToolsK();if(!K||!K.tools||typeof K.tools.loose!=="function"||world==="")return false;
  const got=kitThingsFromList(K,[thing],"the thing taken in hand in "+JSON.stringify(String(world).slice(0,40)),{list:[],bad:false});
  if(got.bad||got.list.length!==1)return false;
  const was=KITHAND;KITHAND={id:world,from:null,thing:got.list[0]};
  if(was&&was.id===world&&was.from!==null)kitReshapeAt(world,was.from);
  if(KTOOLS.open)kitToolsClose();
  kitHandShow();const b=$("khBack");if(b)b.focus();return true;}
/* PUT: the thing in hand moved whole into place i, ONE change handed to the world, then laid */
function kitPut(i){const id=world,K=KITWALL[id],h=KITHAND;if(!h||h.id!==id)return false;
  if(h.from===i){kitHandBack();kitRepage();return true;}
  const say=s=>{if(KITHAND){KITHAND.said=s;kitHandShow();}else kitSayRefusal(s,s);return false;};   /* a game that laid its kitchen anew on a refusal has dropped the hand: the sentence is then said as a refusal is */
  if(!kitCanHold(id,i)||(h.from!==null&&!kitCanHold(id,h.from)))return say(kitHandW("khNoId","That place keeps nothing yet."));
  const A=h.from===null?{list:[h.thing],bad:false}:kitThingsOf(id,h.from),B=kitThingsOf(id,i);
  if(A.bad||B.bad)return say(kitHandW("khUnread","Something in one of these places could not be read, so nothing is moved."));
  const t=A.list.find(q=>q.id===h.thing.id);if(!t){KITHAND=null;kitHandShow();return false;}   /* gone from where it was: the world changed it */
  const there=B.list.find(q=>q.id===t.id);
  if(!there&&B.list.length>=KITTHINGS)return say(kitFill(kitHandW("khFull","That place holds {n} things already."),{n:String(KITTHINGS)}));
  if(there&&there.n+t.n>KITMANY)return say(kitFill(kitHandW("khMany","A place holds at most {n} of one thing."),{n:String(KITMANY)}));
  const from=A.list.filter(q=>q.id!==t.id).map(kitEntry),to=B.list.map(q=>{const e=kitEntry(q);if(q.id===t.id){e.n=q.n+t.n;const d=[q.date,t.date].filter(Boolean).sort()[0];if(d)e.date=d;else delete e.date;}return e;});   /* a date goes with the thing; two dates, the earlier (sprint 8a) */
  if(!there)to.push(kitEntry(t));
  const change={};if(h.from!==null)change[K.places[h.from].id]=from;change[K.places[i].id]=to;
  try{K.keep(JSON.parse(JSON.stringify(change)));}
  catch(e){const sd=kitRefused(e);if(!sd)mqwarn("kitchen","a thing put in "+JSON.stringify(String(id).slice(0,40))+" was not kept: "+String(e&&e.message||e).slice(0,80),false);
    return say(sd||kitHandW("khNotKept","That could not be kept on this device, so nothing was moved."));}
  KITHAND=null;if(h.from!==null)kitReshapeAt(id,h.from);kitReshapeAt(id,i);kitHandShow();kitRepage();return true;}
/* a place built again where it stands, and the page of the place open drawn again from what the world answers now */
function kitReshapeAt(id,i){const K=KITWALL[id],p=K&&K.places[i];if(!p||id!==world||typeof t3Reshape!=="function"||typeof T3!=="object"||String(T3.builtKey||"").indexOf(world+"|")!==0)return;
  const c=K.cols[p.col];if(c)t3Reshape(c.x,c.y);}
function kitRepage(){const n=kitNow;if(!n||!$("reader")||$("reader").hidden)return;const K=KITWALL[n.id],p=K&&K.places[n.i];if(!p)return;
  const d=kitDoc(n.id,p);n.doc=d;docOpen(d);}
/* THE PAGE'S OWN BLOCKS for place p: the offer first, with a thing in hand; then, after the world's, its things */
function kitHandOffer(id,p){const h=KITHAND;if(!h||h.id!==id||!kitCanHold(id,p.i))return [];
  const nm=h.thing.name,n=String(h.thing.n),plain=kitAmtPlain(h.thing),nm2=kitNameAmt(h.thing);
  if(h.from===p.i)return [{btn:plain?kitFill(kitHandW("khPutBack","Put it back: {name} × {n}"),{name:nm,n}):kitFill(kitHandW("khPutBackPlain","Put it back: {name}"),{name:nm2}),run:()=>{kitHandBack();kitRepage();}}];
  return [{btn:plain?kitFill(kitHandW("khPutHere","Put it here: {name} × {n}"),{name:nm,n}):kitFill(kitHandW("khPutHerePlain","Put it here: {name}"),{name:nm2}),run:()=>kitPut(p.i),first:1}];}
function kitThingGrid(id,p){const K=KITWALL[id];if(!K||typeof K.things!=="function")return [];
  const got=kitThingsOf(id,p.i),can=kitCanHold(id,p.i)&&!got.bad,h=KITHAND;
  if(!got.list.length)return [];
  return [{grid:got.list.map(t=>{const held=!!h&&h.id===id&&h.from===p.i&&h.thing.id===t.id;
    return {pic:t.pic?css=>kitPic(t,css):null,label:t.name,sub:kitAmt(t),on:held,
      aria:t.name+(kitAmt(t)?", "+(kitAmtPlain(t)?t.n:kitAmt(t)):"")+(can?" — "+(held?kitHandW("khInHand","in hand"):kitHandW("khTake","take it in hand")):""),
      run:can?()=>kitTake(p.i,t.id):null};})}];}
/* THE HAND ON THE SCREEN: built once, the first time something is taken, over the room's picture */
function kitHandShow(){let b=$("kitHand");const h=KITHAND;
  if(h&&(h.id!==world||!KITWALL[h.id]||(h.from!==null&&!kitCanHold(h.id,h.from)))){KITHAND=null;if(b)b.hidden=true;return;}   /* left the room: it is put back */
  if(!h){if(b)b.hidden=true;return;}
  const vp=$("vp");if(!vp)return;
  if(!b){b=document.createElement("div");b.id="kitHand";b.setAttribute("role","group");
    Object.assign(b.style,{position:"absolute",left:"12px",top:"12px",zIndex:"4",display:"flex",alignItems:"center",gap:"10px",maxWidth:"calc(100% - 88px)",
      background:"rgba(20,16,30,.86)",color:"#EDE9F5",borderRadius:"12px",padding:"6px 8px 6px 6px",font:"500 13px 'IBM Plex Sans', system-ui, sans-serif",boxSizing:"border-box"});
    vp.appendChild(b);}
  b.hidden=false;b.textContent="";b.setAttribute("aria-label",kitHandW("khTitle","In your hand"));
  const pic=kitPic(h.thing,44);pic.style.borderRadius="8px";pic.style.background="rgba(255,255,255,.08)";
  const txt=document.createElement("div");Object.assign(txt.style,{display:"flex",flexDirection:"column",lineHeight:"1.25",minWidth:"0"});
  const a=document.createElement("span");a.textContent=kitHandW("khTitle","In your hand");Object.assign(a.style,{fontSize:"11px",opacity:"0.8"});
  const nm=document.createElement("b");nm.textContent=kitNameAmt(h.thing);
  txt.append(a,nm);
  if(h.said){const s=document.createElement("span");s.textContent=h.said;Object.assign(s.style,{fontSize:"12px",color:"#F2C230"});s.setAttribute("aria-live","polite");txt.appendChild(s);}
  const x=document.createElement("button");x.type="button";x.id="khBack";x.textContent="✕";
  x.setAttribute("aria-label",kitHandW("khBack","Put it back"));x.title=kitHandW("khBack","Put it back");
  Object.assign(x.style,{minWidth:"44px",height:"44px",border:"none",borderRadius:"10px",background:"rgba(237,233,245,.16)",color:"#EDE9F5",font:"600 16px system-ui, sans-serif",cursor:"pointer"});
  x.addEventListener("click",e=>{e.preventDefault();kitHandBack();kitRepage();});
  b.append(pic,txt,x);}
/* Escape puts it back, before anything else hears it, while a thing is in hand */
function kitHandKey(e){if(!KITHAND||e.key!=="Escape"||e.ctrlKey||e.metaKey||e.altKey)return false;
  const t=e.target;if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.tagName==="SELECT"||t.isContentEditable))return false;
  e.preventDefault();kitHandBack();kitRepage();return true;}
/* ═══════════ THE CLOSET (2026-10-30) — a wardrobe, and the character creator behind its doors ═══════════
   A world that lays `⎕` has a closet there: a piece of its own (engine/shapes.js, `SHAPES.wardrobe`, which a world takes in
   SHAPETAKE like any shape), and standing beside it the slot offers the creator over the world with the name kept, by the
   barber's own path (`openChair`), so whatever the creator offers the closet changes. Its words are the world's: `closet`
   on the button, `closetTitle` over the creator, `closetDone` on its way out, `closetAfter` said once it is closed. A world
   that lays none gets nothing here. */
function closetBy(x,y){const w=CW();if(!w)return false;
  return [[0,-1],[0,1],[-1,0],[1,0]].some(([dx,dy])=>w.grid[y+dy]&&w.grid[y+dy][x+dx]===CLOSET);}
function closetOpen(){const t=T();openChair(null,{title:t.closetTitle,done:t.closetDone,after:t.closetAfter});}
/* ═══════════ THE KITCHEN BUILDER (2026-10-30) — builder mode on a kitchen wall: add, move, paint and remove a piece ═══════════
   In a world that has a builder (`BUILDER`), in builder mode (the 🛠️ in Settings, `admin`), in a room whose kitchen
   layout (grep "THE KITCHEN LAYOUT") declares a `store`, a bar stands at the foot of the picture, in every camera: pick a piece by a tap on it in 3D, by ‹ and ›, or
   by [ and ]; move it ◀ ▶ ▲ ▼ (or Shift and an arrow), and on a wall with gaps (the layout's `gaps`, sprint 5) onto any
   empty square, by the arrows or by a tap on the square (`kitBuildPlace`, the rules' moveTo), and on a kitchen along more
   than one wall (the layout's `sides`, sprint 7) by a tap on any empty square of any of its walls, the arrows stepping
   along the piece's own wall and, at its end, saying in one line that a tap on a square along the wall moves it further
   (`kbWallEnd`); Paint it in one of the engine's finishes, or the whole kitchen at
   once; Add a piece of a kind (a kind the kitchen has already asks first, as My kitchen does); Remove it (it asks first);
   and Undo (or Ctrl+Z). The piece picked is framed in gold in 3D.
   EVERY CHANGE GOES ONE WAY: the engine's rules (`KITCHEN.rules`, engine/kitchen.js) make the new layout from the one
   that stands, the wall's squares are handed out again (its columns, then its free squares, in order: a layout as many
   columns long as it now has stands on the first that many, and a new column needs a free square, or the change is
   refused in a sentence), the whole of it is checked (`kitchenCheck`), and then the world's `store(layout)` is called
   with a plain copy of it: `{wall, free, places}`. Only when that returns is it laid. A store that throws keeps the
   change from being made. THE ENGINE NEVER KEEPS A KITCHEN: it writes no storage for one, and what it remembers to undo
   is the layouts before each change, in memory, for the visit; an undo is a change like any other, through the check
   and the store.
   A world with no `BUILDER`, or a layout with no `store`, gets no bar, no keys and no pick: a tap opens a place as ever,
   and nothing here runs. Its words are the world's (`kb…` in UI), English when it gives none. Held by
   test/engine.smoke.js, grep "THE KITCHEN BUILDER". */
const KITB={sel:{},undo:{},mode:null,all:false,kind:null,said:"",key:"",was:false,draft:null},KITUNDO=60;
kitBuildReady=true;   /* from here on the bar may be asked for: a caller earlier in the boot reads the `var` (THE KITCHEN LAYOUT) unset, and asks nothing */
const kitW=(k,d)=>{const t=T()||{};return typeof t[k]==="string"&&t[k]?t[k]:d;};
const kitFill=(s,o)=>Object.keys(o).reduce((a,k)=>a.split("{"+k+"}").join(o[k]),s);
function kitBuildOn(){const K=KITWALL[world];return buildOK()&&admin&&!!K&&typeof K.store==="function"&&typeof KITCHEN==="object"&&!!KITCHEN&&!!KITCHEN.rules&&!!$("world")&&!$("world").hidden;}
function kitBuildSel(){if(!kitBuildOn())return null;const i=KITB.sel[world];return Number.isInteger(i)&&KITWALL[world].places[i]?i:null;}
/* the layout as it stands, as data: what the rules are handed, and what the world is handed to keep */
function kitData(K){const B=K.sides?K.back:K.cols.length,d={wall:K.cols.slice(0,B).map(c=>[c.x,c.y]),free:(K.free||[]).map(q=>[q[0],q[1]]),
  places:K.places.map(p=>{const q={kind:p.kind,row:p.row,col:p.col};
    if(p.side!==undefined){q.col=p.col-K.sides[p.side].from;q.side=p.side;}   /* a side wall's place, counted along its own wall (sprint 7) */
    ["name","full","finish","id"].forEach(k=>{if(p[k]!==undefined)q[k]=p[k];});return q;})};
  if(K.sides)d.sides=K.sides.map(w=>({squares:w.squares.map(q=>[q[0],q[1]]),face:w.face}));   /* only a kitchen along more than one wall has them */
  return d;}
/* the layout as the rules are asked it: as it stands, with the wall's gaps when the world turned them on (sprint 5). Never
   what the world is handed to keep: `gaps` is the world's own setting, not the kitchen's */
function kitAsk(K){const d=kitData(K);if(K.gaps)d.gaps=true;return d;}
/* THE SQUARE A TAP FELL ON (sprint 5): what the 3D library's ray hit, a kitchen column's own square or the floor under the
   point, read as a square of this wall that holds nothing: an empty column, or a free square (counted on from the wall's
   end, as the rules count it). -1 for anything else */
function kitSquareAt(h){const K=KITWALL[world];if(!K||!h)return -1;let x,y;
  const u=h.object&&h.object.userData;
  if(u&&u.g===KITCOL){x=u.x;y=u.y;}else if(h.point&&isFinite(h.point.x)&&isFinite(h.point.z)){x=Math.floor(h.point.x);y=Math.floor(h.point.z);}else return -1;
  const c=K.cols.findIndex(q=>q.x===x&&q.y===y);if(c>=0&&K.places.some(p=>p.col===c))return -1;
  const B=K.sides?K.back:K.cols.length;
  if(c>=0&&c<B)return c;
  if(c>=0){const w=K.cols[c].side;return {col:c-K.sides[w].from,side:w};}   /* an empty square of a side wall (sprint 7): its wall, and its column along it */
  const f=(K.free||[]).findIndex(q=>q[0]===x&&q[1]===y);return f>=0?B+f:-1;}
/* the places in the wall's order: column by column from the left, and down each column */
const kitWallOrder=K=>K.places.slice().sort((a,b)=>a.col-b.col||KITCHEN.rank[a.row]-KITCHEN.rank[b.row]);
function kitBuildSay(s){KITB.said=String(s||"");kitBuildShow();}
/* a picked piece is framed in 3D: its column, and the one picked before it, are built again where they stand */
function kitBuildPick(i){const id=world,K=KITWALL[id],was=KITB.sel[id];
  KITB.sel[id]=Number.isInteger(i)&&K.places[i]?i:null;KITB.mode=null;KITB.kind=null;KITB.said="";
  [was,KITB.sel[id]].forEach(j=>{const p=Number.isInteger(j)&&K.places[j];if(p&&typeof t3Reshape==="function"){const c=K.cols[p.col];t3Reshape(c.x,c.y);}});
  kitBuildShow();return true;}
function kitBuildPickBy(d){const K=KITWALL[world],o=kitWallOrder(K),sel=kitBuildSel();if(!o.length)return;
  const at=sel===null?(d>0?-1:o.length):o.findIndex(p=>p.i===sel);kitBuildPick(o[(at+d+o.length)%o.length].i);}
/* what a refusal of the rules says, in the world's words where it has them */
function kitBuildWhy(r){const c=r&&r.code;
  if(c==="most")return kitFill(kitW("kbMost","A kitchen holds at most {n} pieces."),{n:String(KITCHEN.most)});
  if(c==="bare")return kitW("kbBare","The counter is stone and tile, and takes no paint.");
  if(c==="still")return kitW("kbStill","That changes nothing.");
  if(c==="room")return kitW("kbNoRoom","There is no free square on this wall for a new column.");
  if(c==="taken")return kitW("kbTaken","There is no room for it on that square.");
  return (r&&r.why)||"?";}
/* ONE CHANGE: the rules, the squares, the check, the store, then laid; the layout before it kept to undo */
function kitBuildChange(rule,said,selOf){const id=world,K=KITWALL[id];
  if(!kitBuildOn()||kitBusy||kitNow||worldCovered())return false;
  const before=kitData(K);let r;try{r=rule(kitAsk(K));}catch(e){r={why:String(e&&e.message||e)};}
  if(!r||r.why){kitBuildSay(kitBuildWhy(r));return false;}
  const slots=before.wall.concat(before.free),P=r.layout.places,n=P.reduce((m,p)=>p.side===undefined?Math.max(m,p.col+1):m,0);   /* the back wall's squares; a side wall's stay its own (sprint 7) */
  if(!P.length){kitBuildSay(kitW("kbLast","A kitchen keeps one piece at least."));return false;}
  if(n>slots.length){kitBuildSay(kitW("kbNoRoom","There is no free square on this wall for a new column."));return false;}
  const next={wall:slots.slice(0,n),free:slots.slice(n),
    places:P.map(p=>{const q={kind:p.kind,row:p.row,col:p.col};if(before.sides&&Number.isInteger(p.side))q.side=p.side;["name","full","finish","id"].forEach(k=>{if(p[k]!==undefined)q[k]=p[k];});return q;})};
  if(before.sides)next.sides=before.sides;
  if(!kitBuildSet(id,next))return false;
  const u=KITB.undo[id]=KITB.undo[id]||[];u.push(before);if(u.length>KITUNDO)u.shift();
  KITB.sel[id]=selOf(r);KITB.mode=null;KITB.kind=null;kitBuildSay(said(r));return true;}
/* CHECKED, KEPT BY THE WORLD, LAID — in that order, or not at all */
function kitBuildSet(id,next){const K=KITWALL[id],L=Object.assign({},next,{store:K.store});if(K.page)L.page=K.page;
  if(K.gaps)L.gaps=true;if(K.things)L.things=K.things;if(K.keep)L.keep=K.keep;if(K.tools)L.tools=K.tools;   /* the world's own settings and seams go on with the wall, never into what it keeps */
  const r=kitchenCheck(id,L);
  if(r.why){mqwarn("kitchen","a builder's change to "+JSON.stringify(String(id).slice(0,40))+" was refused: "+r.why,false);kitBuildSay(r.why);return false;}
  try{K.store(JSON.parse(JSON.stringify(next)));}
  catch(e){const sd=kitRefused(e);if(!sd)mqwarn("kitchen","a builder's change to "+JSON.stringify(String(id).slice(0,40))+" was not kept: "+String(e&&e.message||e),false);
    kitBuildSay(sd||kitW("kbNotKept","That change could not be kept on this device, so it was not made."));return false;}
  KITWALL[id]=r.wall;Object.keys(KITOPEN).forEach(k=>{if(k.indexOf(id+"|")===0)delete KITOPEN[k];});
  kitEmptyOff(true);   /* every place is built shut again, so a line about an empty one is over (sprint 6) */
  kitDirty();return true;}
function kitBuildUndo(){const id=world,u=KITB.undo[id];
  if(!kitBuildOn()||kitBusy||kitNow||worldCovered())return false;
  if(!u||!u.length){kitBuildSay(kitW("kbNothing","Nothing to undo."));return false;}
  if(!kitBuildSet(id,u[u.length-1]))return false;
  u.pop();if(!KITWALL[id].places[KITB.sel[id]])KITB.sel[id]=null;KITB.mode=null;KITB.kind=null;kitBuildSay(kitW("kbUndone","Undone."));return true;}
const kitNameOf=p=>kitName(p,lang);
/* AT A WALL'S END (sprint 7; his confirmed goal of 2026-11-01, point 3): on a wall with gaps a step left or right is refused
   only at the end of the piece's own wall, so instead of nothing a short line says how to move it further: a tap on a square
   along the wall (`kbWallEnd`, the world's words, English when it gives none) */
const kitWallEnd=(K,i,side)=>!!K.gaps&&(side==="left"||side==="right")&&!KITCHEN.rules.canMove(kitAsk(K),i,side);
function kitBuildMove(side){const i=kitBuildSel();if(i===null){kitBuildSay(kitW("kbPick","Tap a piece, or press ] to pick one."));return false;}
  if(kitBuildOn()&&kitWallEnd(KITWALL[world],i,side)){kitBuildSay(kitW("kbWallEnd","That is the end of its wall: to move it further, tap a square along the wall."));return false;}
  const nm=kitNameOf(KITWALL[world].places[i]);
  return kitBuildChange(L=>KITCHEN.rules.move(L,i,side),()=>kitFill(kitW("kbMoved","{name} moved."),{name:nm}),r=>r.i);}
/* PUT ON AN EMPTY SQUARE, by a tap there, on a wall with gaps (sprint 5): the rules' moveTo, then the one way every change goes */
function kitBuildPlace(c){const i=kitBuildSel();if(i===null)return false;
  const nm=kitNameOf(KITWALL[world].places[i]),t=typeof c==="number"?{col:c}:c;   /* a column of the back wall, or {col, side} on a side wall (sprint 7) */
  kitBuildChange(L=>KITCHEN.rules.moveTo(L,i,t.col,t.side),()=>kitFill(kitW("kbMoved","{name} moved."),{name:nm}),r=>r.i);return true;}
function kitBuildPaint(f){const K=KITWALL[world],i=kitBuildSel(),fn=kitW("kbFin_"+f,f).toLowerCase();   /* the finish's name inside a sentence: "painted white" */
  if(KITB.all)return kitBuildChange(L=>KITCHEN.rules.paintAll(L,f),()=>kitFill(kitW("kbPaintedAll","The whole kitchen painted {finish}."),{finish:fn}),()=>i);
  if(i===null){kitBuildSay(kitW("kbPick","Tap a piece, or press ] to pick one."));return false;}
  const nm=kitNameOf(K.places[i]);
  return kitBuildChange(L=>KITCHEN.rules.paint(L,i,f),()=>kitFill(kitW("kbPainted","{name} painted {finish}."),{name:nm,finish:fn}),r=>r.i);}
/* RENAME (sprint 9; a game's tools `rename: true`): the picked piece's name, text, trimmed, at most KITNAME characters, nothing that cannot be shown; empty gives it its kind's own name back. Checked, kept by the world and laid like any builder change, and undone the same */
function kitBuildRename(v){const K=KITWALL[world],i=kitBuildSel();if(!kitBuildOn()||!K.tools||K.tools.rename!==true)return false;
  if(i===null){kitBuildSay(kitW("kbPick","Tap a piece, or press ] to pick one."));return false;}
  KITB.draft={id:world,i,text:String(v==null?"":v).slice(0,KITNAME)};   /* what he typed, held until the change is kept or the mode or the piece changes */
  const nm=String(v==null?"":v).replace(new RegExp(KITUNSAFE.source,"g"),"").replace(/\s+/g," ").trim();
  if(Array.from(nm).length>KITNAME){kitBuildSay(kitFill(kitW("kbRenameLong","A name is at most {n} characters."),{n:String(KITNAME)}));return false;}
  const was=kitNameOf(K.places[i]);
  return kitBuildChange(L=>({layout:Object.assign({},L,{places:L.places.map((q,k)=>{if(k!==i)return q;const c=Object.assign({},q);if(nm)c.name=nm;else delete c.name;return c;})}),i}),
    ()=>nm?kitFill(kitW("kbRenamed","{was} is now {name}."),{was,name:nm}):kitFill(kitW("kbRenamedBack","{was} has its own name again."),{was}),r=>r.i);}
function kitBuildAdd(kind,sure){const K=KITWALL[world];if(!kitBuildOn())return false;
  if(!sure&&K.places.some(p=>p.kind===kind)&&K.places.length<KITCHEN.most){KITB.mode="again";KITB.kind=kind;kitBuildShow();return false;}   /* a kind the kitchen has asks first */
  const nm=kitNameOf({kind});
  return kitBuildChange(L=>kitGiveId(K,KITCHEN.rules.add(L,kind)),()=>kitFill(kitW("kbAdded","{name} added."),{name:nm}),r=>r.i);}
/* A PIECE ADDED HOLDS THINGS (sprint 6; his confirmed goal of 2026-10-31, point 3): a place with no id keeps nothing (kitCanHold),
   and the rule that adds a piece (KITCHEN.rules.add, one copy for every game, My kitchen's too) gives it none. So here, and only
   for a layout that hands `things` and `keep`, the piece just added is given the first of n1, n2, … that no place on the wall has
   and that passes KITID. The world keeps the id with the layout it is handed, and reads it back through the check like any other. */
function kitGiveId(K,r){if(!r||r.why||typeof K.things!=="function"||typeof K.keep!=="function")return r;
  const P=r.layout&&r.layout.places,p=P&&P[r.i];if(!p||Object.prototype.hasOwnProperty.call(p,"id"))return r;
  const taken=new Set(P.map(q=>q.id));
  for(let n=1;n<=P.length+1;n++){const id="n"+n;if(!taken.has(id)&&KITID.test(id)){p.id=id;break;}}
  return r;}
function kitBuildRemove(){const K=KITWALL[world],i=kitBuildSel();if(i===null)return false;
  const o=kitWallOrder(K),at=o.findIndex(p=>p.i===i),nm=kitNameOf(K.places[i]);
  /* the pick goes to its neighbour on the wall: the piece after it in the wall's order, or before it at the end */
  const nb=o.filter(p=>p.i!==i),to=nb.length?nb[Math.min(at,nb.length-1)].i:null;
  return kitBuildChange(L=>KITCHEN.rules.remove(L,i),()=>kitFill(kitW("kbRemoved","{name} removed."),{name:nm}),()=>to===null?null:to>i?to-1:to);}
function kitBuildAsk(m){if(!kitBuildOn())return;
  if((m==="remove"||m==="rename")&&kitBuildSel()===null){kitBuildSay(kitW("kbPick","Tap a piece, or press ] to pick one."));return;}
  KITB.mode=KITB.mode===m?null:m;KITB.kind=null;KITB.said="";kitBuildShow();
  const f=$("kitBuild")&&$("kitBuild").querySelector("[data-first]");if(f)f.focus();}
/* THE KEYS, laptop first, only while the bar stands and the world has the keys: [ and ] pick, Shift and an arrow move,
   Delete asks to remove, Ctrl or ⌘ and Z undoes, Escape puts away a row the bar opened */
function kitBuildKey(e){if(!kitBuildOn()||!keyForWorld(e)||e.altKey)return false;
  const k=e.key,mod=e.ctrlKey||e.metaKey,side={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down"}[k];let did=true;
  if(k==="]"&&!mod)kitBuildPickBy(1);
  else if(k==="["&&!mod)kitBuildPickBy(-1);
  else if(side&&e.shiftKey&&!mod)kitBuildMove(side);
  else if((k==="Delete"||k==="Backspace")&&!mod)kitBuildAsk("remove");
  else if(mod&&!e.shiftKey&&(k==="z"||k==="Z"))kitBuildUndo();
  else if(k==="Escape"&&KITB.mode){KITB.mode=null;KITB.kind=null;kitBuildShow();}
  else did=false;
  if(did){e.preventDefault();held=null;}
  return did;}
/* THE BAR: built once, the first time a room offers it, and shown, hidden and filled from the state above */
function kitBuildBar(){let b=$("kitBuild");if(b)return b;const vp=$("vp");if(!vp)return null;
  const el=(t,css,txt)=>{const e=document.createElement(t);if(css)Object.assign(e.style,css);if(txt!==undefined)e.textContent=txt;return e;};
  b=el("div",{position:"absolute",left:"12px",bottom:"12px",maxWidth:"calc(100% - 88px)",zIndex:"4",background:"rgba(20,16,30,.84)",color:"#EDE9F5",
    borderRadius:"12px",padding:"8px 10px",display:"flex",flexDirection:"column",gap:"6px",font:"500 13px 'IBM Plex Sans', system-ui, sans-serif",boxSizing:"border-box"});
  b.id="kitBuild";b.setAttribute("role","group");b.hidden=true;
  const head=el("div",{display:"flex",gap:"8px",alignItems:"baseline",flexWrap:"wrap"});head.id="kbHead";
  const row=el("div",{display:"flex",gap:"5px",flexWrap:"wrap"});row.id="kbRow";
  const more=el("div",{display:"flex",gap:"5px",flexWrap:"wrap",alignItems:"center"});more.id="kbMore";
  const said=el("div",{fontSize:"12px",opacity:"0.9",minHeight:"16px"});said.id="kbSaid";said.setAttribute("aria-live","polite");
  [["prev","‹"],["next","›"],["left","◀"],["right","▶"],["up","▲"],["down","▼"],["paint","🎨"],["rename","✎"],["add","➕"],["remove","🗑"],["undo","↩"]].forEach(([a,g])=>{
    const bt=el("button",null);bt.type="button";bt.dataset.kb=a;bt.dataset.glyph=g;row.appendChild(bt);});
  b.append(head,row,more,said);
  b.addEventListener("click",e=>{const t=e.target.closest("button");if(!t||!b.contains(t))return;e.preventDefault();
    const a=t.dataset.kb,v=t.dataset.v;
    if(a==="prev")kitBuildPickBy(-1);else if(a==="next")kitBuildPickBy(1);
    else if(["left","right","up","down"].includes(a))kitBuildMove(a);
    else if(a==="paint"||a==="add"||a==="remove"||a==="rename")kitBuildAsk(a);
    else if(a==="renameYes"){const f=$("kbRenameIn");kitBuildRename(f?f.value:"");}
    else if(a==="undo")kitBuildUndo();
    else if(a==="finish")kitBuildPaint(v);
    else if(a==="all"){KITB.all=!KITB.all;kitBuildShow();}
    else if(a==="kind")kitBuildAdd(v,false);
    else if(a==="againYes"){const k=KITB.kind;KITB.mode=null;KITB.kind=null;if(k)kitBuildAdd(k,true);}
    else if(a==="removeYes"){KITB.mode=null;kitBuildRemove();}
    else if(a==="no"){KITB.mode=null;KITB.kind=null;kitBuildShow();}});
  vp.appendChild(b);return b;}
const KBBTN={height:"36px",minWidth:"36px",padding:"0 9px",border:"1.5px solid transparent",borderRadius:"8px",background:"rgba(237,233,245,.14)",color:"#EDE9F5",
  font:"500 13px 'IBM Plex Sans', system-ui, sans-serif",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"6px"};
function kitBuildShow(){
  const on=kitBuildOn(),b=on?kitBuildBar():$("kitBuild");
  if(on!==KITB.was){KITB.was=on;if(typeof t3Invalidate==="function")t3Invalidate();}   /* the frame round a picked piece comes and goes with the bar */
  if(!b)return;
  const br=$("brushes");if(br)br.hidden=!admin||(on&&camMode==="3d");   /* in 3D the bar is the builder's tools; the brushes paint only from above */
  if(!on){b.hidden=true;KITB.key="";return;}
  const id=world,K=KITWALL[id],sel=kitBuildSel(),p=sel===null?null:K.places[sel],data=kitData(K),undo=(KITB.undo[id]||[]).length,dp=$("dpad");
  const key=[id,sel,KITB.mode,KITB.all,KITB.kind,undo,KITB.said,lang,camMode,dp&&!dp.hidden,JSON.stringify(data)].join("|");
  if(key===KITB.key&&!b.hidden)return;
  KITB.key=key;b.hidden=false;b.style.bottom=dp&&!dp.hidden?"160px":"12px";
  {const kb=KTOOLS.btn,off=kb&&!kb.hidden&&kb.offsetWidth?kb.offsetWidth+24:12;b.style.left=off+"px";b.style.maxWidth="calc(100% - "+(off+76)+"px)";}   /* the Kitchen button stands at the foot of the view too: the bar begins past it (sprint 9) */
  b.setAttribute("aria-label",kitW("kbTitle","Kitchen builder"));
  if(KITB.mode!=="rename")KITB.draft=null;
  const head=$("kbHead");head.textContent="";
  const t=document.createElement("b");t.textContent="🛠️ "+kitW("kbTitle","Kitchen builder");head.appendChild(t);
  const nm=document.createElement("span");nm.id="kbName";nm.textContent=p?kitNameOf(p)+(p.finish&&p.finish!=="wood"?" · "+kitW("kbFin_"+p.finish,p.finish):""):kitW("kbNone","nothing picked");nm.style.opacity=p?"1":"0.75";head.appendChild(nm);
  const style=(bt,pressed)=>{Object.assign(bt.style,KBBTN);bt.style.opacity=bt.disabled?"0.4":"1";bt.style.cursor=bt.disabled?"default":"pointer";
    if(pressed!==undefined){bt.setAttribute("aria-pressed",pressed?"true":"false");bt.style.borderColor=pressed?"#E0B45C":"transparent";bt.style.background=pressed?"rgba(224,180,92,.25)":KBBTN.background;}};
  const words={prev:kitW("kbPrev","Previous piece"),next:kitW("kbNext","Next piece"),left:kitW("kbLeft","Move left"),right:kitW("kbRight","Move right"),up:kitW("kbUp","Move up"),down:kitW("kbDown","Move down"),
    paint:kitW("kbPaint","Paint"),rename:kitW("kbRename","Rename"),add:kitW("kbAdd","Add"),remove:kitW("kbRemove","Remove"),undo:kitW("kbUndo","Undo")};
  [...$("kbRow").children].forEach(bt=>{const a=bt.dataset.kb;   /* each a sign with its name for the pointer and the screen reader, so the row fits the picture */
    bt.textContent=bt.dataset.glyph;bt.setAttribute("aria-label",words[a]);bt.title=words[a];
    if(a==="rename"){bt.hidden=!(K.tools&&K.tools.rename===true);if(bt.hidden)return;}   /* Rename is on only where a game's tools turn it on (sprint 9) */
    bt.disabled=["left","right","up","down"].includes(a)?!(sel!==null&&(KITCHEN.rules.canMove(kitAsk(K),sel,a)||kitWallEnd(K,sel,a))):a==="remove"?sel===null:a==="undo"?!undo:false;   /* at a wall's end ◀ ▶ say how to go on (sprint 7) */
    style(bt,a==="paint"||a==="add"||a==="remove"||a==="rename"?KITB.mode===a:undefined);});
  const more=$("kbMore");more.textContent="";more.hidden=!KITB.mode;
  const btn=(a,txt,v,first)=>{const bt=document.createElement("button");bt.type="button";bt.dataset.kb=a;if(v!==undefined)bt.dataset.v=v;if(first)bt.dataset.first="1";bt.textContent=txt;more.appendChild(bt);return bt;};
  const line=txt=>{const s=document.createElement("span");s.textContent=txt;s.style.marginRight="4px";more.appendChild(s);return s;};
  if(KITB.mode==="paint"){const bare=!KITB.all&&p&&KITCHEN.unfinished.includes(p.kind),now=p&&(p.finish||"wood");
    Object.keys(KITCHEN.finishes).forEach((f,k)=>{const bt=btn("finish","",f,k===0),sw=document.createElement("span");
      Object.assign(sw.style,{width:"14px",height:"14px",borderRadius:"3px",background:KITCHEN.finishes[f].flat,boxShadow:"0 0 0 1px rgba(237,233,245,.5)"});
      bt.append(sw,document.createTextNode(kitW("kbFin_"+f,f)));bt.disabled=bare||(!KITB.all&&!p);style(bt,!KITB.all&&now===f);});
    const all=btn("all",kitW("kbWhole","The whole kitchen"));style(all,KITB.all);
    if(bare)line(kitW("kbBare","The counter is stone and tile, and takes no paint."));}
  else if(KITB.mode==="add"){const full=K.places.length>=KITCHEN.most;
    KITCHEN.order.forEach((k,n)=>{const bt=btn("kind",kitNameOf({kind:k}),k,n===0);bt.disabled=full;style(bt);});
    if(full)line(kitFill(kitW("kbMost","A kitchen holds at most {n} pieces."),{n:String(KITCHEN.most)}));}
  else if(KITB.mode==="rename"){if(!p){KITB.mode=null;more.hidden=true;}
    else{const f=document.createElement("input");f.type="text";f.id="kbRenameIn";f.maxLength=KITNAME;f.value=KITB.draft&&KITB.draft.id===world&&KITB.draft.i===kitBuildSel()?KITB.draft.text:(p.name||"");f.setAttribute("aria-label",kitW("kbRename","Rename"));f.placeholder=kitNameOf({kind:p.kind});
      Object.assign(f.style,{height:"36px",padding:"0 8px",borderRadius:"8px",border:"1.5px solid rgba(237,233,245,.4)",background:"rgba(255,255,255,.1)",color:"#EDE9F5",font:"500 13px 'IBM Plex Sans', system-ui, sans-serif",minWidth:"140px"});
      f.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();e.stopPropagation();kitBuildRename(f.value);}else if(e.key==="Escape"){e.preventDefault();e.stopPropagation();KITB.mode=null;kitBuildShow();}else e.stopPropagation();});
      more.appendChild(f);style(btn("renameYes",kitW("ktSave","Save")));style(btn("no",kitW("kbNo","No")));setTimeout(()=>{const g=$("kbRenameIn");if(g&&KITB.mode==="rename"){g.focus();g.select();}},0);}}
  else if(KITB.mode==="again"){const t=T()||{},byKind=(o,d)=>o&&typeof o==="object"&&typeof o[KITB.kind]==="string"?o[KITB.kind]:d;   /* a world may word it kind by kind, as My kitchen does */
    line(byKind(t.kbAgainKinds,kitFill(kitW("kbAgain","There is a {name} already. Add another?"),{name:kitNameOf({kind:KITB.kind})})));
    style(btn("againYes",byKind(t.kbAgainYesKinds,kitW("kbAgainYes","Add another")),undefined,true));style(btn("no",kitW("kbNo","No")));}
  else if(KITB.mode==="remove"){if(!p){KITB.mode=null;more.hidden=true;}
    else{line(kitFill(kitW("kbRemoveAsk","Remove the {name}?"),{name:kitNameOf(p)}));style(btn("removeYes",kitW("kbRemoveYes","Remove"),undefined,true));style(btn("no",kitW("kbNo","No")));}}
  $("kbSaid").textContent=KITB.said||(p?kitW("kbKeys","[ ] pick · Shift+arrows move · Delete remove · Ctrl+Z undo"):kitW("kbPick","Tap a piece, or press ] to pick one."));}
/* ═══════════ THE KITCHEN'S TOOLS (sprint 8a of the 3D kitchen) — a Kitchen button, a search, the dates, a thing of one's own ═══════════
   His confirmed goal of 2026-11-02 (sprint 8a), borrowed from My kitchen's own code where it fits (its today, dueText, dueItems,
   startOwn, saveOwn, startOwnRename, askOwnRemove, setFullness and searched), written once here so every game on the engine can
   turn them on and no game writes them again. NOTHING PRIVATE ENTERS THE ENGINE: no food, id or word of a library; the game keeps its data, as with `store` and `keep`.
   A GAME TURNS THEM ON with one more key in its layout, beside `things` and `keep` (it needs both):
     tools   `{own, keep, signs?, amount?, loose?, rename?}` (`amount`, `loose` and `rename` are sprint 9's, grep "THE AMOUNT, AND THE HAND FROM OUTSIDE"; `signs: true` turns on the signs, grep "THE SIGNS", words `ktSign`, `ktSignWords`, `ktSoonAt`): `own()` answers `{<id>: <name>}`, the things of the player's own the game keeps (text, at most
             KITTHINGNAME characters, ids `o-1`, `o-2`, … that pass KITID); `keep(change)` is handed ONE change, a plain
             copy, `{places: {<place id>: [{id, n, date?}, …]}, own: {<id>: <name>}}`, either key left out when it does not change,
             and keeps it whole or throws (then nothing changes). A thing a game answers through `things` may carry `date`
             (`YYYY-MM-DD`, a day that exists, else the thing is refused whole) and `own: true`; a thing with no `parts` is
             simply not drawn in 3D (an item of his own has no picture yet).
   WHAT THE PLAYER GETS, in a game that turns them on:
     · A KITCHEN BUTTON (🍳) inside the view (#vp, so full screen keeps it), or the K key, opens the kitchen panel: beside the
       room where the view is wide, over it where it is not; Escape or its ✕ shuts it.
     · A SEARCH at its top, across every place: text only, at most KITSEARCH characters, never a pattern. Each result names its
       place; the places that hold a result glow in gold in 3D while the results show (kitFrame); a pick opens that place.
     · A closed drawer just below it, "Past their date (N)", opening to list those, the longest past first.
     · USE SOON: the things whose date is within KITSOON days, today included, the soonest first (day 30 is in, day 31 is out).
     · ADD YOUR OWN ITEM: a name (trimmed, at most KITTHINGNAME characters, text, never one that is on the page already, in either
       language) and a place; an item of his own is renamed, moved and removed (asking first).
     · ON EACH PLACE'S PAGE: "How full?" (Not set and `KITCHEN.fulls`, kept with the layout through `store`), and each thing's count
       (whole, 1 to KITTOOLMANY) and its optional date, set, changed or cleared; the things near or past their date first.
     · DATES SHOWN BOTH WAYS: "Nov 20 · in 18 days", "Nov 2 · 3 days ago", "today" (the words are the game's, `kt…` in UI).
   THE CLOCK IS READ IN ONE PLACE, kitToday(), once a time it is asked; nothing else here reads it, and test/engine.smoke.js
   holds that. A DATE IS A GUIDE, NOT A DEADLINE: it sorts and it is said, and nothing is hidden, spoiled or removed by it.
   Held by test/engine.smoke.js, grep "THE KITCHEN'S TOOLS". */
const KITSEARCH=40,KITSOON=30,KITTOOLMANY=99,KITOWNS=200,KITLOOSE=120,KITLOOSEMAX=400;
function kitToolsK(){const K=KITWALL[world];return K&&K.tools&&typeof K.things==="function"&&typeof K.keep==="function"?K:null;}
/* THE ONE READ OF THE CLOCK: the device's own date, as YYYY-MM-DD */
function kitToday(){const d=new Date();return [d.getFullYear(),d.getMonth()+1,d.getDate()].map((n,i)=>String(n).padStart(i?2:4,"0")).join("-");}
const KITDAY=/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
function kitDayOk(v){const m=typeof v==="string"?KITDAY.exec(v):null;if(!m)return false;const y=+m[1],mo=+m[2],d=+m[3];
  if(y<1000||mo<1||mo>12||d<1)return false;
  return d<=[31,(y%4===0&&y%100!==0)||y%400===0?29:28,31,30,31,30,31,31,30,31,30,31][mo-1];}
const kitDayNum=v=>{const m=KITDAY.exec(v);return Math.round(Date.UTC(+m[1],+m[2]-1,+m[3])/86400000);};
const kitDaysLeft=v=>kitDayNum(v)-kitDayNum(kitToday());
const KITMONTHS={en:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]};
/* "Nov 20 · in 18 days", "Nov 2 · 3 days ago", "today"; the year too when it is not this year's */
function kitDueText(v){if(!kitDayOk(v))return "";
  const n=kitDaysLeft(v);if(n===0)return kitW("ktToday","today");
  const t=T()||{},M=Array.isArray(t.ktMonths)&&t.ktMonths.length===12?t.ktMonths:KITMONTHS.en,m=KITDAY.exec(v),y=+m[1],thisY=+kitToday().slice(0,4);
  const day=kitFill(y===thisY?kitW("ktDate","{month} {d}"):kitW("ktDateY","{month} {d}, {y}"),{month:String(M[+m[2]-1]),d:String(+m[3]),y:String(y)});
  const rel=n>0?(n===1?kitW("ktInOne","in 1 day"):kitFill(kitW("ktIn","in {n} days"),{n:String(n)})):(n===-1?kitW("ktAgoOne","1 day ago"):kitFill(kitW("ktAgo","{n} days ago"),{n:String(-n)}));
  return day+" · "+rel;}
/* a thing as the world keeps it: its id, its count and its date when it has one */
const kitEntry=q=>q.date?{id:q.id,n:q.n,date:q.date}:{id:q.id,n:q.n};
/* every thing in every place that can hold one, with where it is */
function kitAllThings(K){const out=[];K.places.forEach(p=>{if(typeof p.id!=="string")return;kitThingsOf(world,p.i).list.forEach(t=>out.push({p,t}));});return out;}
/* WHAT IS PAST ITS DATE AND WHAT IS DUE SOON: dated things only, the longest past first, then the soonest first */
function kitDue(K){const all=kitAllThings(K).filter(r=>r.t.date).map(r=>({p:r.p,t:r.t,left:kitDaysLeft(r.t.date)}));
  const by=(a,b)=>a.left-b.left||a.t.name.localeCompare(b.t.name);
  return {past:all.filter(r=>r.left<0).sort(by),soon:all.filter(r=>r.left>=0&&r.left<=KITSOON).sort(by)};}
/* THE SEARCH: text only. The query is lower-cased and looked for as it is in each thing's name; no part of it is ever a pattern */
function kitSearchRows(K,q){const s=Array.from(String(q||"")).slice(0,KITSEARCH).join("").trim().toLowerCase();if(!s)return [];
  return kitAllThings(K).filter(r=>r.t.name.toLowerCase().indexOf(s)>=0);}
let KITDATE=null;   /* the use-by date he typed on a place's page, held until it is kept or cleared: {key:"place|thing",text,at} */
const KTOOLS={open:false,q:"",say:"",loose:false,edit:null,glow:new Set(),el:null,btn:null,past:false,only:null};
/* the places that glow, built again where they stand when the set changes */
function kitGlowSet(set){const K=KITWALL[world];if(!K)return;const was=KTOOLS.glow;
  if(set.size===was.size&&[...set].every(i=>was.has(i)))return;
  KTOOLS.glow=set;
  new Set([...was,...set]).forEach(i=>{const p=K.places[i],c=p&&K.cols[p.col];
    if(c&&typeof t3Reshape==="function"&&typeof T3==="object"&&String(T3.builtKey||"").indexOf(world+"|")===0)t3Reshape(c.x,c.y);});}
const kh=(tag,css,txt,at)=>{const n=document.createElement(tag);if(css)Object.assign(n.style,css);if(txt!==undefined)n.textContent=txt;if(at)Object.keys(at).forEach(k=>n.setAttribute(k,at[k]));return n;};
const KT_FONT="'IBM Plex Sans', system-ui, sans-serif";
const KT_BTN={minHeight:"36px",minWidth:"36px",padding:"0 10px",border:"1.5px solid rgba(237,233,245,.3)",borderRadius:"8px",background:"rgba(237,233,245,.12)",color:"inherit",font:"600 13px "+KT_FONT,cursor:"pointer"};
const KT_IN={minHeight:"36px",padding:"0 8px",border:"1.5px solid rgba(237,233,245,.35)",borderRadius:"8px",background:"rgba(0,0,0,.25)",color:"inherit",font:"500 14px "+KT_FONT,boxSizing:"border-box",maxWidth:"100%"};
const kitBtn=(txt,run,css,at)=>{const b=kh("button",Object.assign({},KT_BTN,css||{}),txt,Object.assign({type:"button"},at||{}));b.addEventListener("click",e=>{e.preventDefault();run();});return b;};
/* a place's name on a pick list: its own, and its number when two share one */
function kitPlaceNames(K){const out={},seen={};K.places.forEach(p=>{if(typeof p.id!=="string")return;const nm=kitName(p,lang);seen[nm]=(seen[nm]||0)+1;out[p.i]=nm;});
  const n={};K.places.forEach(p=>{if(out[p.i]===undefined)return;const nm=out[p.i];if(seen[nm]>1){n[nm]=(n[nm]||0)+1;out[p.i]=nm+" ("+n[nm]+")";}});return out;}
/* ONE CHANGE, handed whole to the game's keep: false (and a line) when it throws, else the places built again and the page drawn again */
function kitToolsKeep(change,focus){const K=kitToolsK();if(!K)return false;
  try{K.tools.keep(JSON.parse(JSON.stringify(change)));}
  catch(e){const sd=kitRefused(e);if(!sd)mqwarn("kitchen","a change to the kitchen's tools was not kept: "+String(e&&e.message||e).slice(0,80),false);
    KTOOLS.say=sd||kitW("ktNotKept","That could not be kept on this device, so nothing changed.");if(KTOOLS.open)kitToolsRender();else kitSayRefusal(sd,KTOOLS.say);return false;}
  KSIGN.stale=true;
  Object.keys(change.places||{}).forEach(pid=>{const p=K.places.find(q=>q.id===pid);if(p)kitReshapeAt(world,p.i);});
  kitRepage();if(KTOOLS.open)kitToolsRender();
  if(focus){const n=document.querySelector('[data-kt="'+focus+'"]');if(n)n.focus();}
  return true;}
/* ---- the names ---- */
function kitOwnName(v){let s=String(v==null?"":v);s=s.replace(new RegExp(KITUNSAFE.source,"g"),"").replace(/\s+/g," ").trim();return Array.from(s).length>KITTHINGNAME?null:s;}
function kitNameTaken(K,name,except){const n=name.toLowerCase(),langs=Object.keys(UI);
  for(const p of K.places){if(typeof p.id!=="string")continue;
    for(const lg of langs){let r;try{r=K.things(p,lg);}catch(e){continue;}
      if(Array.isArray(r)&&r.some(t=>t&&t.id!==except&&typeof t.name==="string"&&t.name.toLowerCase()===n))return true;}}
  let o={};try{o=K.tools.own()||{};}catch(e){}
  return Object.keys(o).some(id=>id!==except&&typeof o[id]==="string"&&o[id].toLowerCase()===n);}
function kitOwnMap(K){let o={};try{o=K.tools.own()||{};}catch(e){return {};}
  const out={};if(o&&typeof o==="object"&&!Array.isArray(o))Object.keys(o).forEach(id=>{if(KITID.test(id)&&typeof o[id]==="string")out[id]=o[id];});return out;}
const kitWhere=(K,id)=>K.places.find(p=>typeof p.id==="string"&&kitThingsOf(world,p.i).list.some(t=>t.id===id));
/* ADD: a name and a place; one of it, no date, in that place */
function kitOwnAdd(name,pid){const K=kitToolsK();if(!K)return false;const say=s=>{KTOOLS.say=s;kitToolsRender();return false;};
  const v=kitOwnName(name);
  if(v===null)return say(kitFill(kitW("ktLong","A name is at most {n} characters."),{n:String(KITTHINGNAME)}));
  if(!v)return say(kitW("ktEmptyName","Give it a name."));
  const own=kitOwnMap(K);if(Object.keys(own).length>=KITOWNS)return say(kitFill(kitW("ktMost","You can keep at most {n} things of your own."),{n:String(KITOWNS)}));
  if(kitNameTaken(K,v,null))return say(kitW("ktTaken","There is a thing called that already."));
  const p=K.places.find(q=>q.id===pid);if(!p)return say(kitW("ktPickPlace","Choose a place."));
  const list=kitThingsOf(world,p.i).list;if(list.length>=KITTHINGS)return say(kitFill(kitW("khFull","That place holds {n} things already."),{n:String(KITTHINGS)}));
  let n=1;while(own["o-"+n])n++;const id="o-"+n;if(!KITID.test(id))return say(kitW("ktNotKept","That could not be kept on this device, so nothing changed."));
  const places={};places[p.id]=list.map(kitEntry).concat([{id,n:1}]);const o2=Object.assign({},own);o2[id]=v;
  KTOOLS.say="";   /* his search is cleared only once the add is kept: a refusal leaves it as he typed it */
  const ok=kitToolsKeep({places,own:o2});if(ok){KTOOLS.q="";KTOOLS.say=kitFill(kitW("ktAdded","{name} is in {place}."),{name:v,place:kitName(p,lang)});kitToolsRender();}return ok;}
function kitOwnRename(id,name){const K=kitToolsK();if(!K)return false;const say=s=>{KTOOLS.say=s;kitToolsRender();return false;};
  const own=kitOwnMap(K);if(!own[id])return false;const v=kitOwnName(name);
  if(v===null)return say(kitFill(kitW("ktLong","A name is at most {n} characters."),{n:String(KITTHINGNAME)}));
  if(!v)return say(kitW("ktEmptyName","Give it a name."));
  if(kitNameTaken(K,v,id))return say(kitW("ktTaken","There is a thing called that already."));
  const o2=Object.assign({},own);o2[id]=v;KTOOLS.edit=null;KTOOLS.say="";return kitToolsKeep({own:o2},"own-rename-"+id);}
function kitOwnMove(id,pid){const K=kitToolsK();if(!K)return false;const from=kitWhere(K,id),to=K.places.find(q=>q.id===pid);
  if(!from||!to||from.i===to.i)return false;
  const A=kitThingsOf(world,from.i).list,B=kitThingsOf(world,to.i).list,t=A.find(q=>q.id===id);
  if(B.length>=KITTHINGS){KTOOLS.say=kitFill(kitW("khFull","That place holds {n} things already."),{n:String(KITTHINGS)});kitToolsRender();return false;}
  const places={};places[from.id]=A.filter(q=>q.id!==id).map(kitEntry);places[to.id]=B.map(kitEntry).concat([kitEntry(t)]);
  KTOOLS.say="";return kitToolsKeep({places},"own-move-"+id);}
function kitOwnRemove(id){const K=kitToolsK();if(!K)return false;const own=kitOwnMap(K);if(!own[id])return false;
  const places={};K.places.forEach(p=>{if(typeof p.id!=="string")return;const L=kitThingsOf(world,p.i).list;if(L.some(t=>t.id===id))places[p.id]=L.filter(t=>t.id!==id).map(kitEntry);});
  const o2=Object.assign({},own);delete o2[id];KTOOLS.edit=null;KTOOLS.say="";return kitToolsKeep({places,own:o2});}
/* A COUNT OR A DATE CHANGED on place p's page: that place's whole list, handed once */
function kitSetThing(p,tid,patch,focus){const K=kitToolsK();if(!K||typeof p.id!=="string")return false;
  const L=kitThingsOf(world,p.i).list;if(!L.some(t=>t.id===tid))return false;
  const places={};places[p.id]=L.map(t=>{if(t.id!==tid)return kitEntry(t);const q=kitEntry(t);
    if(patch.n!==undefined)q.n=patch.n;if(patch.date!==undefined){if(patch.date)q.date=patch.date;else delete q.date;}return q;});
  return kitToolsKeep({places},focus);}
/* a use-by date typed: held while the write is tried, dropped once it is kept */
function kitDateSet(p,tid,dk,v){KITDATE=v?{key:dk,text:v,at:(typeof performance==="object"?performance.now():0)}:null;const ok=kitSetThing(p,tid,{date:v},"date-"+tid);if(ok)KITDATE=null;return ok;}
/* HOW FULL, kept with the layout through `store`, never through `keep` */
function kitSetFull(p,v){const K=kitToolsK();if(!K||typeof K.store!=="function"||(v!==null&&!KITCHEN.fulls.includes(v)))return false;
  const next=kitData(K);if(v===null)delete next.places[p.i].full;else next.places[p.i].full=v;
  const L=Object.assign({},next,{store:K.store,tools:K.tools});if(K.page)L.page=K.page;if(K.gaps)L.gaps=true;L.things=K.things;L.keep=K.keep;
  const r=kitchenCheck(world,L);if(r.why){mqwarn("kitchen","how full a place is was refused: "+r.why,false);return false;}
  try{K.store(JSON.parse(JSON.stringify(next)));}
  catch(e){const sd=kitRefused(e);if(!sd)mqwarn("kitchen","how full a place is was not kept: "+String(e&&e.message||e).slice(0,80),false);kitSayRefusal(sd,kitW("ktNotKept","That could not be kept on this device, so nothing changed."));return false;}
  KITWALL[world]=r.wall;kitDirty();kitRepage();
  const n=document.querySelector('[data-kt="full-'+(v||"none")+'"]');if(n)n.focus();return true;}
/* THE PLACE'S PAGE: how full, and each thing's count and date */
function kitToolsPage(id,p){const K=KITWALL[id];if(!K||!K.tools||typeof p.id!=="string"||id!==world)return [];
  const out=[];
  if(typeof K.store==="function")out.push({node:box=>{
    box.appendChild(kh("h3",null,kitW("kitHowFull","How full?"),{class:"dh"}));
    const row=kh("div",{display:"flex",flexWrap:"wrap",gap:"6px",margin:"4px 0 10px"},undefined,{role:"group","aria-label":kitW("kitHowFull","How full?")});
    [null].concat(KITCHEN.fulls).forEach(v=>{const on=(p.full||null)===v,lab=v===null?kitW("kitNotSet","Not set"):(((T()||{}).kitFull||{})[v]||v);
      const b=kitBtn(lab,()=>kitSetFull(p,v),on?{borderColor:"#E0B45C",background:"rgba(224,180,92,.25)"}:{},{"aria-pressed":on?"true":"false","data-kt":"full-"+(v||"none")});row.appendChild(b);});
    box.appendChild(row);}});
  const L=kitThingsOf(id,p.i).list;
  if(L.length)out.push({node:box=>{
    box.appendChild(kh("h3",null,kitW("ktThings","Count and date"),{class:"dh"}));
    L.forEach(t=>{const card=kh("div",{display:"flex",flexDirection:"column",gap:"6px",padding:"8px",margin:"6px 0",borderRadius:"10px",background:"rgba(255,255,255,.07)"});
      const top=kh("div",{display:"flex",justifyContent:"space-between",gap:"8px",flexWrap:"wrap"});
      top.appendChild(kh("b",null,t.name));
      if(t.date){const left=kitDaysLeft(t.date);top.appendChild(kh("span",{color:left<0?"#F2A07A":left<=KITSOON?"#F2C230":"inherit",fontSize:"13px"},kitDueText(t.date),{"data-kt":"due-"+t.id}));}
      card.appendChild(top);
      const row=kh("div",{display:"flex",alignItems:"center",flexWrap:"wrap",gap:"6px"});
      if(kitAmtOn(K)){const a=kitAmt(t);if(a)row.appendChild(kh("span",{minWidth:"34px",font:"600 14px "+KT_FONT},a,{"aria-live":"polite","data-kt":"count-"+t.id}));}   /* the game edits an amount itself (tools.amount) */
      else{row.appendChild(kitBtn("−",()=>{if(t.n>1)kitSetThing(p,t.id,{n:t.n-1},"minus-"+t.id);},{},{"aria-label":kitW("ktLess","One fewer")+": "+t.name,"data-kt":"minus-"+t.id}));
      row.appendChild(kh("span",{minWidth:"34px",textAlign:"center",font:"600 14px "+KT_FONT},String(t.n),{"aria-live":"polite","data-kt":"count-"+t.id}));
      row.appendChild(kitBtn("+",()=>{if(t.n<KITTOOLMANY)kitSetThing(p,t.id,{n:t.n+1},"plus-"+t.id);},{},{"aria-label":kitW("ktMore","One more")+": "+t.name,"data-kt":"plus-"+t.id}));}
      const lab=kh("label",{display:"flex",alignItems:"center",gap:"6px",marginLeft:"6px",font:"500 13px "+KT_FONT});
      lab.appendChild(document.createTextNode(kitW("ktUseBy","Use by")));
      const inp=kh("input",KT_IN,undefined,{type:"date","data-kt":"date-"+t.id,"aria-label":kitW("ktUseBy","Use by")+": "+t.name});const dk=p.id+"|"+t.id;inp.value=KITDATE&&KITDATE.key===dk?KITDATE.text:(t.date||"");
      inp.addEventListener("change",()=>{const v=inp.value;if(v==="")kitDateSet(p,t.id,dk,"");else if(kitDayOk(v))kitDateSet(p,t.id,dk,v);else{inp.value=t.date||"";if(typeof toast==="function")toast(kitW("ktBadDate","That is not a date."),2200);}});
      lab.appendChild(inp);row.appendChild(lab);
      if(t.date)row.appendChild(kitBtn(kitW("ktClearDate","Clear date"),()=>{KITDATE=null;kitSetThing(p,t.id,{date:""},"date-"+t.id);},{},{"data-kt":"cleardate-"+t.id}));
      card.appendChild(row);box.appendChild(card);});}});
  return out;}
/* ---- THE PANEL ---- */
function kitToolsPlace(){const el=KTOOLS.el,vp=$("vp");if(!el||!vp)return;
  const r=vp.getBoundingClientRect(),wide=r.width>=760,margin=!wide&&window.innerWidth-r.right>=372&&!vp.classList.contains("fs");
  /* beside the room: inside a wide view at its right; or, where the page leaves room at the view's right (a laptop), in that room, fixed to the window; over the view otherwise (a phone) */
  if(margin)Object.assign(el.style,{position:"fixed",top:"0",bottom:"0",left:"auto",right:"0",width:"360px"});
  else Object.assign(el.style,wide?{position:"absolute",top:"0",bottom:"0",left:"auto",right:"0",width:"min(380px,44%)"}:{position:"absolute",top:"0",bottom:"0",right:"0",left:"0",width:"100%"});}
window.addEventListener("resize",()=>kitToolsPlace());document.addEventListener("fullscreenchange",()=>kitToolsPlace());
function kitToolsBuild(){if(KTOOLS.el)return KTOOLS.el;const vp=$("vp");if(!vp)return null;
  const el=kh("div",{position:"absolute",top:"0",right:"0",bottom:"0",zIndex:"7",overflowY:"auto",boxSizing:"border-box",padding:"12px",background:"rgba(20,16,30,.96)",color:"#EDE9F5",font:"500 14px "+KT_FONT,
    display:"flex",flexDirection:"column",gap:"10px"},undefined,{id:"kitPanel",role:"dialog","aria-label":"Kitchen"});el.hidden=true;
  const head=kh("div",{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px"});   /* the title has its own flexible space (it may wrap) beside a ✕ that keeps its size, top right */
  head.appendChild(kh("b",{fontSize:"17px",flex:"1 1 auto",minWidth:"0",overflowWrap:"anywhere"},"",{id:"kpTitle"}));
  head.appendChild(kitBtn("✕",()=>kitToolsClose(),{flex:"0 0 auto"},{id:"kpClose"}));el.appendChild(head);
  const q=kh("input",Object.assign({},KT_IN,{width:"100%"}),undefined,{id:"kpSearch",type:"text",maxlength:String(KITSEARCH),autocomplete:"off",spellcheck:"false"});
  q.addEventListener("input",()=>{KTOOLS.q=q.value;kitToolsRender();});
  q.addEventListener("keydown",e=>{if(e.key==="Enter"){const K=kitToolsK(),r=K?kitSearchRows(K,q.value):[];if(r.length){e.preventDefault();kitToolsPick(r[0].p.i);}}});
  el.appendChild(q);
  el.appendChild(kh("div",null,undefined,{id:"kpResults","aria-live":"polite"}));
  const det=kh("details",{border:"1px solid rgba(237,233,245,.25)",borderRadius:"8px",padding:"6px 8px"},undefined,{id:"kpPast"});
  det.appendChild(kh("summary",{cursor:"pointer",font:"600 14px "+KT_FONT},"",{id:"kpPastSum"}));det.appendChild(kh("div",null,undefined,{id:"kpPastList"}));
  det.addEventListener("toggle",()=>{KTOOLS.past=det.open;});el.appendChild(det);
  el.appendChild(kh("div",null,undefined,{id:"kpSoon"}));
  const add=kh("form",{display:"flex",flexDirection:"column",gap:"6px",borderTop:"1px solid rgba(237,233,245,.2)",paddingTop:"8px"},undefined,{id:"kpAdd"});
  add.appendChild(kh("b",null,"",{id:"kpAddTitle"}));
  add.appendChild(kh("input",Object.assign({},KT_IN,{width:"100%"}),undefined,{id:"kpName",type:"text",maxlength:String(KITTHINGNAME),autocomplete:"off"}));
  add.appendChild(kh("select",Object.assign({},KT_IN,{width:"100%"}),undefined,{id:"kpPlace"}));
  add.appendChild(kitBtn("",()=>kitOwnAdd($("kpName").value,$("kpPlace").value),{},{id:"kpAddBtn",type:"submit"}));   /* Enter in the name clicks it (the form's own default button) */
  add.addEventListener("submit",e=>{e.preventDefault();kitOwnAdd($("kpName").value,$("kpPlace").value);});
  el.appendChild(add);
  el.appendChild(kh("div",{minHeight:"1.3em",color:"#F2C230",fontSize:"13px"},undefined,{id:"kpSay",role:"status","aria-live":"polite"}));
  el.appendChild(kh("div",null,undefined,{id:"kpOwn"}));
  el.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();kitToolsClose();}});
  vp.appendChild(el);KTOOLS.el=el;kitToolsPlace();return el;}
/* NOT PUT AWAY YET (sprint 9; a game's `tools.loose`): the things the game keeps that stand in no place, a closed drawer in the panel; each a button
   that takes it in hand (kitHandStart) and puts the panel down. The panel's search narrows it, by name, as text. Nothing is built where the game gave no `loose` */
function kitToolsLoose(K,el,t){let lo=t("kpLoose");
  if(typeof K.tools.loose!=="function"){if(lo)lo.remove();return;}
  if(!lo){lo=kh("details",{border:"1px solid rgba(237,233,245,.25)",borderRadius:"8px",padding:"6px 8px"},undefined,{id:"kpLoose"});
    lo.appendChild(kh("summary",{cursor:"pointer",font:"600 14px "+KT_FONT},"",{id:"kpLooseSum"}));lo.appendChild(kh("div",null,undefined,{id:"kpLooseList"}));
    lo.addEventListener("toggle",()=>{KTOOLS.loose=lo.open;});el.insertBefore(lo,t("kpAdd"));}
  let r=[];try{r=K.tools.loose(lang);}catch(e){kitThingWarn("the tools' loose could not be asked: "+String(e&&e.message||e).slice(0,80));r=null;}
  const got=kitThingsFromList(K,r,"the loose things in "+JSON.stringify(String(world).slice(0,40)),{list:[],bad:false},KITLOOSEMAX);
  const q=Array.from(String(KTOOLS.q||"")).slice(0,KITSEARCH).join("").trim().toLowerCase(),all=got.list.filter(x=>!q||x.name.toLowerCase().includes(q)),list=all.slice(0,KITLOOSE);   /* the search narrows BEFORE the cut, so a thing past the cut is found by its name */
  t("kpLooseSum").textContent=kitW("ktLoose","Not put away yet");
  const ul=t("kpLooseList");ul.textContent="";
  if(got.bad)ul.appendChild(kh("p",{margin:"4px 0",color:"#F2C230"},kitW("ktLooseBad","Some of these could not be read, so they are not listed.")));
  if(!list.length)ul.appendChild(kh("p",{margin:"4px 0",opacity:"0.85"},kitW("ktLooseNone","Nothing here.")));
  else list.forEach(x=>{const b=kitBtn(kitNameAmt(x),()=>{kitHandStart(Object.assign({},x,{parts:x.parts.map(q=>Object.assign({},q)),pic:x.pic||undefined,date:x.date||undefined,unit:x.unit||undefined,uncounted:x.uncounted||undefined,own:x.own||undefined}));},{display:"block",width:"100%",textAlign:"left",margin:"3px 0",minHeight:"44px"},{"data-kt":"loose-"+x.id});ul.appendChild(b);});
  if(all.length>list.length)ul.appendChild(kh("p",{margin:"4px 0",color:"#F2C230"},kitFill(kitW("ktLooseCut","Showing {shown} of {all}: type a name above to find the rest."),{shown:String(list.length),all:String(all.length)}),{"data-kt":"loose-cut"}));
  if(lo.open!==!!KTOOLS.loose)lo.open=!!KTOOLS.loose;}
/* each part of the panel shown as it was built or put away, its own display kept for when it comes back (the add form and the head are flex boxes) */
function kitPanelParts(el,keep){[...el.children].forEach(c=>{if(keep(c)){if(c.dataset.kd!==undefined){c.style.display=c.dataset.kd;delete c.dataset.kd;}}else if(c.dataset.kd===undefined){c.dataset.kd=c.style.display;c.style.display="none";}});}
/* THE PANEL NARROWED TO ONE COLUMN (a sign's tap): its title names the pieces that have things due (top to bottom), and only those things stand in it, grouped by piece (a small heading per piece when more than one has things due), soonest first in each; the search, the drawer and the rest are put away until the panel is shut. One piece with things due: the panel is the single piece's, title and all */
function kitToolsNarrow(K,names,c){const el=KTOOLS.el,t=n=>$(n);
  kitPanelParts(el,x=>x.id==="kpSoon"||x===t("kpTitle").parentElement);
  const by={};kitDue(K).soon.filter(r=>r.p.col===c).forEach(r=>{(by[r.p.i]=by[r.p.i]||[]).push(r);});
  const ps=kitColTops(K,c).order.filter(i=>by[i]),first=kitColTops(K,c).order[0];
  t("kpTitle").textContent=kitFill(kitW("ktSoonAt","Use soon · {place}"),{place:(ps.length?ps:[first]).map(i=>names[i]).join(", ")});t("kpClose").setAttribute("aria-label",kitW("ktClose","Close"));
  kitGlowSet(new Set(ps));
  const so=t("kpSoon");so.textContent="";
  if(!ps.length)so.appendChild(kh("p",{margin:"4px 0",opacity:"0.85"},kitFill(kitW("ktSoonNone","Nothing is due in the next {n} days."),{n:String(KITSOON)})));
  else ps.forEach(i=>{if(ps.length>1)so.appendChild(kh("div",{font:"700 13px "+KT_FONT,margin:"10px 0 2px",opacity:"0.9"},names[i],{"data-kt":"group-"+i}));by[i].forEach(r=>so.appendChild(kitToolsRow(K,names,r,true)));});}
/* a result or a due line: the thing, its place, its date when it has one; a press opens that place */
function kitToolsRow(K,names,r,dated){const b=kitBtn("",()=>kitToolsPick(r.p.i),{display:"flex",flexDirection:"column",alignItems:"flex-start",width:"100%",textAlign:"left",margin:"4px 0",padding:"6px 10px",minHeight:"44px"},{"data-kt":"pick-"+r.p.i+"-"+r.t.id});
  b.appendChild(kh("b",null,kitFill(kitW("ktResult","{name} — {place}"),{name:kitAmtOn(K)?kitNameAmt(r.t):r.t.name+(r.t.n>1?" × "+r.t.n:""),place:names[r.p.i]||kitName(r.p,lang)})));
  if(dated&&r.t.date)b.appendChild(kh("span",{fontSize:"12px",opacity:"0.85"},kitDueText(r.t.date)));return b;}
function kitToolsRender(){const K=kitToolsK(),el=KTOOLS.el;if(!el||!K)return;
  const names=kitPlaceNames(K),t=n=>$(n),only=KTOOLS.only!==null&&K.cols[KTOOLS.only]?KTOOLS.only:null;
  if(only!==null){kitToolsNarrow(K,names,only);return;}
  kitPanelParts(el,()=>true);   /* the whole panel, as it is when it is not narrowed to one place */
  t("kpTitle").textContent=kitW("ktTitle","Kitchen");t("kpClose").setAttribute("aria-label",kitW("ktClose","Close"));
  const q=t("kpSearch");q.placeholder=kitW("ktSearchPh","Search every place");q.setAttribute("aria-label",kitW("ktSearch","Search every place"));if(q.value!==KTOOLS.q)q.value=KTOOLS.q;
  const rs=t("kpResults");rs.textContent="";const rows=kitSearchRows(K,KTOOLS.q);
  if(KTOOLS.q.trim()){if(!rows.length)rs.appendChild(kh("p",{margin:"4px 0",opacity:"0.85"},kitW("ktNone","Nothing found.")));
    else rows.forEach(r=>rs.appendChild(kitToolsRow(K,names,r,true)));}
  kitGlowSet(new Set(rows.map(r=>r.p.i)));
  const due=kitDue(K),det=t("kpPast");
  t("kpPastSum").textContent=kitFill(kitW("ktPast","Past their date ({n})"),{n:String(due.past.length)});
  const pl=t("kpPastList");pl.textContent="";
  if(!due.past.length)pl.appendChild(kh("p",{margin:"4px 0",opacity:"0.85"},kitW("ktPastNone","Nothing is past its date.")));else due.past.forEach(r=>pl.appendChild(kitToolsRow(K,names,r,true)));
  if(det.open!==KTOOLS.past)det.open=KTOOLS.past;
  const so=t("kpSoon");so.textContent="";so.appendChild(kh("b",null,kitW("ktSoon","Use soon")));
  if(!due.soon.length)so.appendChild(kh("p",{margin:"4px 0",opacity:"0.85"},kitFill(kitW("ktSoonNone","Nothing is due in the next {n} days."),{n:String(KITSOON)})));else due.soon.forEach(r=>so.appendChild(kitToolsRow(K,names,r,true)));
  kitToolsLoose(K,el,t);
  t("kpAddTitle").textContent=kitW("ktAdd","Add your own item");t("kpName").placeholder=kitW("ktName","Name");t("kpName").setAttribute("aria-label",kitW("ktName","Name"));
  const sel=t("kpPlace"),was=sel.value;sel.textContent="";sel.setAttribute("aria-label",kitW("ktPlace","Place"));
  K.places.forEach(p=>{if(names[p.i]===undefined)return;const o=document.createElement("option");o.value=p.id;o.textContent=names[p.i];sel.appendChild(o);});
  if(was&&[...sel.options].some(o=>o.value===was))sel.value=was;
  t("kpAddBtn").textContent=kitW("ktAddBtn","Add");
  t("kpSay").textContent=KTOOLS.say||"";
  const ow=t("kpOwn");ow.textContent="";const own=kitOwnMap(K),ids=Object.keys(own);
  if(ids.length){ow.appendChild(kh("b",null,kitW("ktOwn","Your own items")));
    ids.forEach(id=>{const at=kitWhere(K,id),row=kh("div",{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"6px",margin:"6px 0",padding:"6px",borderRadius:"8px",background:"rgba(255,255,255,.07)"});
      const ed=KTOOLS.edit&&KTOOLS.edit.id===id?KTOOLS.edit.mode:null;
      if(ed==="rename"){const f=kh("input",Object.assign({},KT_IN,{flex:"1 1 140px"}),undefined,{type:"text",maxlength:String(KITTHINGNAME),"data-kt":"own-rename-"+id,"aria-label":kitW("ktRename","Rename")});f.value=own[id];
        f.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();kitOwnRename(id,f.value);}else if(e.key==="Escape"){e.preventDefault();e.stopPropagation();KTOOLS.edit=null;kitToolsRender();}});
        row.appendChild(f);row.appendChild(kitBtn(kitW("ktSave","Save"),()=>kitOwnRename(id,f.value)));row.appendChild(kitBtn(kitW("ktCancel","Cancel"),()=>{KTOOLS.edit=null;kitToolsRender();}));
        ow.appendChild(row);setTimeout(()=>{if(KTOOLS.edit&&KTOOLS.edit.id===id){f.focus();f.select();}},0);return;}
      if(ed==="remove"){row.appendChild(kh("span",{flex:"1 1 160px"},kitFill(kitW("ktRemoveAsk","Remove {name}?"),{name:own[id]})));
        row.appendChild(kitBtn(kitW("ktYes","Yes, remove"),()=>kitOwnRemove(id),{},{"data-kt":"own-remove-yes-"+id}));
        row.appendChild(kitBtn(kitW("ktKeep","No, keep it"),()=>{KTOOLS.edit=null;kitToolsRender();},{},{"data-kt":"own-remove-no-"+id}));ow.appendChild(row);
        setTimeout(()=>{const n=document.querySelector('[data-kt="own-remove-no-'+id+'"]');if(n)n.focus();},0);return;}
      row.appendChild(kh("b",{flex:"1 1 120px"},own[id]));
      const mv=kh("select",Object.assign({},KT_IN,{maxWidth:"150px"}),undefined,{"data-kt":"own-move-"+id,"aria-label":kitW("ktMove","Move to")+": "+own[id]});
      K.places.forEach(p=>{if(names[p.i]===undefined)return;const o=document.createElement("option");o.value=p.id;o.textContent=names[p.i];if(at&&at.i===p.i)o.selected=true;mv.appendChild(o);});
      mv.addEventListener("change",()=>kitOwnMove(id,mv.value));row.appendChild(mv);
      row.appendChild(kitBtn(kitW("ktRename","Rename"),()=>{KTOOLS.edit={id,mode:"rename"};kitToolsRender();},{},{"data-kt":"own-rename-btn-"+id}));
      row.appendChild(kitBtn(kitW("ktRemove","Remove"),()=>{KTOOLS.edit={id,mode:"remove"};kitToolsRender();},{},{"data-kt":"own-remove-"+id}));
      ow.appendChild(row);});}}
function kitToolsOpen(only){const K=kitToolsK();if(!K||$("world").hidden||KTOOLS.open)return false;
  KTOOLS.only=Number.isInteger(only)&&K.cols[only]&&K.places.some(p=>p.col===only&&typeof p.id==="string")?only:null;   /* a sign's tap narrows the panel to that column's use-soon things (grep "THE SIGNS") */
  if(kitNow){kitShut();if($("reader")&&!$("reader").hidden)$("docClose").click();}
  if(!kitToolsBuild())return false;
  KTOOLS.open=true;KTOOLS.el.hidden=false;kitToolsPlace();kitToolsRender();kitToolsShow();
  const q=$("kpSearch");if(q)q.focus();return true;}
function kitToolsClose(){if(!KTOOLS.open)return false;KTOOLS.open=false;if(KTOOLS.el)KTOOLS.el.hidden=true;KTOOLS.edit=null;KTOOLS.say="";
  const was=KTOOLS.only;KTOOLS.only=null;kitGlowSet(new Set());kitToolsShow();
  if(was!==null){KSIGN.back=was;KSIGN.backW=world;return true;}   /* opened from a sign: focus goes back to that sign when it returns */
  const b=KTOOLS.btn;if(b&&!b.hidden)b.focus();return true;}
/* a pick: the panel is put down and that place opens (its doors, its page) */
function kitToolsPick(i){const id=world;kitToolsClose();KSIGN.back=null;return kitOpen(id,i);}
/* THE BUTTON follows the room: there while the room's kitchen turned the tools on, and the panel goes with it */
function kitToolsShow(){const K=kitToolsK(),vp=$("vp");let b=KTOOLS.btn;
  kitSignKick();   /* the signs follow the room too (grep "THE SIGNS"); nothing, where the tools turned none on */
  if(!K||$("world").hidden){if(KTOOLS.open){KTOOLS.open=false;if(KTOOLS.el)KTOOLS.el.hidden=true;kitGlowSet(new Set());}if(b)b.hidden=true;return;}
  if(!vp)return;
  if(!b){b=kh("button",{position:"absolute",left:"12px",bottom:"12px",zIndex:"5",minHeight:"44px",padding:"0 14px",border:"none",borderRadius:"22px",background:"rgba(20,16,30,.86)",color:"#EDE9F5",font:"600 14px "+KT_FONT,cursor:"pointer"},undefined,{id:"kitBtn",type:"button"});
    b.addEventListener("click",e=>{e.preventDefault();if(KTOOLS.open)kitToolsClose();else kitToolsOpen();});vp.appendChild(b);KTOOLS.btn=b;}
  b.hidden=false;b.textContent="🍳 "+kitW("ktBtn","Kitchen");b.setAttribute("aria-label",kitW("ktBtn","Kitchen"));b.setAttribute("aria-expanded",KTOOLS.open?"true":"false");
  if(KTOOLS.open)kitToolsRender();}
/* the K key opens and shuts the panel, where the world has the keys (not while typing in a box); Escape inside the panel is its own */
function kitToolsKey(e){if(!kitToolsK()||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return false;
  if((e.key==="k"||e.key==="K")&&keyForWorld(e)){e.preventDefault();if(KTOOLS.open)kitToolsClose();else kitToolsOpen();return true;}
  if(e.key==="Escape"&&KTOOLS.open){e.preventDefault();kitToolsClose();return true;}
  return false;}
/* ═══════════ THE SIGNS (sprint 8b of the 3D kitchen) — a small sign over each column of places that holds things to use soon ═══════════
   His confirmed goals of 2026-11-02 (sprint 8b and his picks from the rendered mocks). A GAME TURNS THEM ON with `signs: true` in its tools,
   beside `own` and `keep`; a game that says nothing has none, and nothing here runs for it.
   WHAT A SIGN SAYS: how many things are due within KITSOON days (kitDue, the panel's own Use soon: what is past its date is not counted
   here), "N use soon" (UI `ktSign`, `ktSignWords`); none for a column with nothing due. ONE SIGN PER COLUMN (his pick for crowded signs): the
   pieces stacked in one column of a wall (upper, counter, lower) share one sign with their total, a tall piece's column holds that piece
   alone, a side wall's columns work the same way; when more than one piece in the column has things due, the sign's accessible name names
   them top to bottom ("N use soon: Upper cupboards, Drawers", UI `ktSignIn`). WHEN: in the 3D camera, in a room whose
   kitchen turned them on, while nothing is picked, no page or panel is open and nothing covers the room; the flat cameras show none.
   WHERE: a real button inside #vp, set each frame from the place's own top-centre projected through the game's 3D camera (not painted into the
   room: it keeps its size at any zoom and screen, and a tap, Tab and Enter work as on any button). A tap or Enter opens the Kitchen panel
   narrowed to that column's use-soon things, grouped by piece top to bottom (a small heading per piece when more than one has things due),
   soonest first in each. WHERE A SIGN WOULD TOUCH a button or another sign it tries, in this order: its full form, its gold count alone (its
   words stay as its accessible name), the nearest clear spot inside the view; with none it is NOT SHOWN (`KSIGN.cut` names it), never laid over
   anything: the Kitchen button reaches everything. No sign covers the Kitchen button, the slot or the view's button columns.
   The hit area is at least 44 by 44 px on a phone. What it counts is read when the room is built again and four times a second after. */
const KSIGN={els:new Map(),on:false,tm:0,key:"",t:0,tally:null,back:null,backW:"",stale:true,cut:[]};
const KSIGN_AVOID="#kitBtn,#read,#talk,#serve,.acts,#rot3d,#zoomIn3d,#zoomOut3d,.gear";
/* a sign wanted at all: the game asked, and the room is the 3D camera's with nothing picked or open */
function kitSignWanted(){const K=kitToolsK();if(!K||!K.tools||K.tools.signs!==true)return null;
  if(camMode!=="3d"||typeof T3!=="object"||!T3||!T3.cam||T3.fail||typeof THREE!=="object"||$("world").hidden||$("cv3").hidden)return null;
  if(KTOOLS.open||kitNow||worldCovered()||(kitBuildReady&&kitBuildOn()))return null;   /* with builder mode on the signs stay away, picked piece or none: the bar and its frame are the room's business then */
  return K;}
/* the places of one column with their tops, the highest first (a piece's top is the top of its parts as they stand) */
const kitPartBox=q=>{const w=q.w!==undefined?q.w:2*(q.r||q.rb||0.03),d=q.d!==undefined?q.d:2*(q.r||q.rb||0.03),h=q.h!==undefined?q.h:2*(q.r||0.03),a=Math.abs(Math.cos(q.ry||0)),b=Math.abs(Math.sin(q.ry||0)),hx=a*w/2+b*d/2,hz=b*w/2+a*d/2;
  return {x0:q.x-hx,x1:q.x+hx,z0:q.z-hz,z1:q.z+hz,y1:q.y+h/2};};
function kitColTops(K,c){const col=K.cols[c];if(!col)return {order:[],box:null};
  const ps=kitColumnParts({x:col.x,y:col.y}).filter(q=>!q.thing&&!q.picked&&!q.glow&&!q.faced),top={};let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity,y1=-Infinity;
  ps.forEach(q=>{const b=kitPartBox(q);top[q.place]=Math.max(top[q.place]===undefined?-Infinity:top[q.place],b.y1);x0=Math.min(x0,b.x0);x1=Math.max(x1,b.x1);z0=Math.min(z0,b.z0);z1=Math.max(z1,b.z1);y1=Math.max(y1,b.y1);});
  const order=K.places.filter(p=>p.col===c&&typeof p.id==="string"&&top[p.i]!==undefined).sort((u,v)=>top[v.i]-top[u.i]||u.i-v.i).map(p=>p.i);
  return {order,box:ps.length?{wx:col.x+0.5+(x0+x1)/2,wy:y1,wz:col.y+0.5+(z0+z1)/2}:null};}
/* each column's use-soon count (its pieces' together) and where the top-centre of the column stands in the world, read again when the room or the language changes, when a change is kept, and a few times a second */
function kitSignTally(K,ts){const key=world+"|"+lang+"|"+String(T3.builtKey);
  if(KSIGN.tally&&!KSIGN.stale&&key===KSIGN.key&&ts-KSIGN.t<250)return KSIGN.tally;
  const n={};kitDue(K).soon.forEach(r=>{n[r.p.i]=(n[r.p.i]||0)+1;});const out=[];
  K.cols.forEach((col,c)=>{const t=kitColTops(K,c),ps=t.order.filter(i=>n[i]);if(!ps.length||!t.box)return;
    out.push({c,n:ps.reduce((a,i)=>a+n[i],0),ps,...t.box});});
  KSIGN.tally=out;KSIGN.key=key;KSIGN.t=ts;KSIGN.stale=false;return out;}
const kitSignBox=e=>{const r=e.getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom};};
const kitSignHit=(a,b)=>a.l<b.r&&a.r>b.l&&a.t<b.b&&a.b>b.t;
/* one sign, made once: a button (the hit area) holding the pill, the count and the words */
function kitSignMake(i){const e=kh("button",{position:"absolute",zIndex:"4",left:"0",top:"0",margin:"0",padding:"0",border:"none",background:"none",color:"#F6F1FF",cursor:"pointer",display:"flex",alignItems:"flex-end",justifyContent:"center",font:"700 12px "+KT_FONT,touchAction:"manipulation"},undefined,{type:"button","data-ksign":String(i)});
  const pill=kh("span",{position:"relative",display:"block",boxSizing:"border-box",border:"1.5px solid #F2C230",background:"rgba(20,16,30,.94)",textAlign:"center",whiteSpace:"nowrap",boxShadow:"0 1px 4px rgba(0,0,0,.5)",marginBottom:"6px",pointerEvents:"none"},undefined,{"aria-hidden":"true"});
  pill.appendChild(kh("b",{color:"#F2C230"},"",{"data-k":"n"}));pill.appendChild(kh("span",null,"",{"data-k":"w"}));
  pill.appendChild(kh("span",{position:"absolute",left:"50%",bottom:"-6px",width:"9px",height:"9px",background:"rgba(20,16,30,.94)",borderRight:"1.5px solid #F2C230",borderBottom:"1.5px solid #F2C230",transform:"translateX(-50%) rotate(45deg)"}));
  e.appendChild(pill);e.addEventListener("click",ev=>{ev.preventDefault();kitToolsOpen(i);});$("vp").appendChild(e);return e;}
/* a sign dressed as its words in full (one line in a wide view, two in a narrow one) or as its gold count alone */
function kitSignDress(e,n,full,wide,names){const pill=e.firstChild,c=pill.querySelector('[data-k="n"]'),w=pill.querySelector('[data-k="w"]'),label=names.length>1?kitFill(kitW("ktSignIn","{n} use soon: {places}"),{n:String(n),places:names.join(", ")}):kitFill(kitW("ktSign","{n} use soon"),{n:String(n)});
  e.setAttribute("aria-label",label);e.dataset.form=full?"full":"count";c.textContent=String(n);w.textContent=kitW("ktSignWords","use soon");
  const st=pill.style;
  if(!full){Object.assign(st,{borderRadius:"50%",width:"28px",height:"28px",padding:"0",lineHeight:"25px"});c.style.fontSize="15px";c.style.display="block";c.style.lineHeight="25px";w.style.display="none";}
  else if(wide){Object.assign(st,{borderRadius:"16px",width:"",height:"",padding:"7px 11px",lineHeight:"1"});c.style.fontSize="12px";c.style.display="inline";c.textContent=n+" ";w.style.display="inline";w.style.fontSize="12px";}
  else{Object.assign(st,{borderRadius:"11px",width:"",height:"",padding:"4px 8px",lineHeight:"1"});c.style.fontSize="16px";c.style.display="block";c.style.lineHeight="1";w.style.display="block";w.style.fontSize="10px";w.style.fontWeight="600";w.style.lineHeight="1.2";}}
function kitSignLoop(ts){KSIGN.on=false;const K=kitSignWanted();
  if(!K){KSIGN.els.forEach(e=>{e.hidden=true;});if(KSIGN.back!==null&&KSIGN.backW!==world)KSIGN.back=null;
    const k=kitToolsK();if(k&&k.tools.signs===true){KSIGN.on=true;KSIGN.tm=setTimeout(()=>{KSIGN.tm=0;requestAnimationFrame(kitSignLoop);},250);}return;}   /* nothing wanted now: they are put away and asked again four times a second, not every frame (so no place that changes what is wanted, the camera, the panel, a page, the builder, a room, can be missed) */
  KSIGN.on=true;requestAnimationFrame(kitSignLoop);
  const vp=$("vp"),vr=vp.getBoundingClientRect(),cr=$("cv3").getBoundingClientRect(),tally=kitSignTally(K,ts),wide=vr.width>=700,touch=vr.width<500||(window.matchMedia&&matchMedia("(pointer:coarse)").matches),min=touch?44:30;
  T3.cam.updateMatrixWorld();
  const seen=new Set(),pts=[];
  tally.forEach(a=>{const v=new THREE.Vector3(a.wx,a.wy,a.wz).project(T3.cam);if(v.z>1||v.z<-1)return;
    pts.push({a,x:(v.x+1)/2*cr.width+cr.left-vr.left,y:(1-v.y)/2*cr.height+cr.top-vr.top});});
  pts.sort((p,q)=>p.x-q.x||p.a.c-q.a.c);const nm=kitPlaceNames(K);KSIGN.cut=[];
  const avoid=[...document.querySelectorAll(KSIGN_AVOID)].filter(e=>!e.hidden&&e.offsetWidth>0).map(e=>{const b=kitSignBox(e);return {l:b.l-vr.left,t:b.t-vr.top,r:b.r-vr.left,b:b.b-vr.top};});
  const placed=[];
  pts.forEach(p=>{const i=p.a.c,pn=p.a.ps.map(j=>nm[j]||kitName(K.places[j],lang));let e=KSIGN.els.get(i);if(!e){e=kitSignMake(i);KSIGN.els.set(i,e);}e.hidden=false;e.dataset.kind=K.places[p.a.ps[0]].kind;e.dataset.kinds=p.a.ps.map(j=>K.places[j].kind).join(",");
    const rect=(full)=>{kitSignDress(e,p.a.n,full,wide,pn);const w=Math.max(min,e.firstChild.offsetWidth),h=Math.max(min,e.firstChild.offsetHeight+6);e.style.width=w+"px";e.style.height=h+"px";
      const x=Math.min(vr.width-w/2-2,Math.max(w/2+2,p.x)),y=Math.min(vr.height-2,Math.max(h+6,p.y-4));return {l:x-w/2,r:x+w/2,t:y-h,b:y,x};};
    const hits=r=>placed.some(o=>kitSignHit(r,o))||avoid.some(o=>kitSignHit(r,o));
    let r=rect(true);
    if(hits(r))r=rect(false);   /* where it would touch, a sign shrinks to its gold count alone */
    if(hits(r)){const w=r.r-r.l,h=r.b-r.t,c=[];   /* and if it still touches, it moves the shortest way to a clear place inside the view (up, or aside) */
      for(let dy=0;dy>=-h*4;dy-=6)for(let dx=-w*2;dx<=w*2;dx+=8)c.push([dx,dy]);
      c.sort((u,v)=>u[0]*u[0]+u[1]*u[1]-v[0]*v[0]-v[1]*v[1]);
      const f=c.map(([dx,dy])=>({l:r.l+dx,r:r.r+dx,t:r.t+dy,b:r.b+dy,x:r.x+dx})).find(q=>q.l>=2&&q.r<=vr.width-2&&q.t>=2&&!hits(q));
      if(f)r=f;else{e.hidden=true;KSIGN.cut.push(pn.join(", "));return;}}   /* nowhere clear: not shown, never laid over anything */
    const pl=e.firstChild,tl=pl.lastChild,pw=pl.offsetWidth;tl.style.left=Math.round(Math.max(9,Math.min(pw-9,p.x-(r.l+(r.r-r.l-pw)/2))))+"px";   /* its tail points at the place, wherever the sign had to stand */
    seen.add(i);placed.push(r);e.style.transform="translate("+Math.round(r.l)+"px,"+Math.round(r.t)+"px)";});
  KSIGN.els.forEach((e,i)=>{if(!seen.has(i))e.hidden=true;});
  if(KSIGN.back!==null){const e=KSIGN.els.get(KSIGN.back),ok=KSIGN.backW===world&&seen.has(KSIGN.back);KSIGN.back=null;if(ok&&e&&!e.hidden)e.focus();}}   /* focus goes back once, to the sign it came from, in the room it came from; a room that changed or a place with nothing due any more lets it go */
function kitSignKick(){if(KSIGN.tm){clearTimeout(KSIGN.tm);KSIGN.tm=0;requestAnimationFrame(kitSignLoop);return;}   /* a change that may make the signs wanted does not wait for the next look */
  if(KSIGN.on||!kitToolsK()||kitToolsK().tools.signs!==true){if(!KSIGN.on)KSIGN.els.forEach(e=>{e.hidden=true;});return;}KSIGN.stale=true;KSIGN.on=true;requestAnimationFrame(kitSignLoop);}
/* THE KITCHEN WALLS A WORLD DECLARES, laid once its rooms stand as this device last left them (the edits above), so a
   layout is checked against the map the person will walk in (grep "THE KITCHEN LAYOUT"). Nothing, for a world without. */
if(typeof KITCHENWALLS==="object"&&KITCHENWALLS)Object.keys(KITCHENWALLS).forEach(id=>kitchenLay(id,KITCHENWALLS[id]));
