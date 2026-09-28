/* THE COLD-READ SHEET — "would someone new to videogames know what this is?"
 *
 * Owner's ask (2026-09-01): "the test we are missing is acting as a person new to
 * videogames going through the store fronts or building fronts". smoke.js checks
 * structure; shots.js shows scenes in context, where surroundings give the answer
 * away. This renders EVERY tile at 4x, labelled ONLY by its glyph, so the art has to
 * carry the meaning on its own with no context and no caption.
 *
 * Run:  node test/tilesheet.js   ->  shots/13-all-tiles.png, then LOOK at it and
 * write down what each tile says to you BEFORE checking what it was meant to be.
 * Findings go in docs/IDEAS.md.
 */
const { chromium } = require('playwright-core');
const fs=require('fs'),path=require('path');
const CAND=[process.env.CHROMIUM_PATH,'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell','/opt/pw-browsers/chromium','/usr/bin/chromium'].filter(Boolean);
(async()=>{
  let exe;try{const p=chromium.executablePath();if(p&&fs.existsSync(p))exe=p;}catch(e){}
  if(!exe)exe=CAND.find(p=>{try{return fs.existsSync(p)&&fs.statSync(p).isFile();}catch(e){return false;}});
  const b=await chromium.launch({executablePath:exe});
  const pg=await b.newPage({viewport:{width:900,height:760},deviceScaleFactor:2});
  await pg.route('**',r=>r.request().url().startsWith('file://')?r.continue():r.abort());
  await pg.goto('file://'+path.resolve(__dirname,'..','index.html'));
  await pg.waitForTimeout(1000);
  await pg.evaluate(()=>{
    const glyphs=Object.keys(TILEDRAW);
    const COLS=8,CELL=108,PAD=10;
    const rows=Math.ceil(glyphs.length/COLS);
    const c=document.createElement('canvas');c.id='sheet';
    c.width=COLS*CELL+PAD*2;c.height=rows*CELL+PAD*2;
    c.style.cssText=`position:fixed;left:0;top:0;z-index:99999;background:#EFE9DE;image-rendering:pixelated;width:${c.width}px;height:${c.height}px;`;
    document.body.appendChild(c);
    const g=c.getContext('2d');g.imageSmoothingEnabled=false;
    const old=ctx;
    glyphs.forEach((gl,i)=>{
      const cx=PAD+(i%COLS)*CELL, cy=PAD+Math.floor(i/COLS)*CELL;
      const t=document.createElement('canvas');t.width=32;t.height=32;
      ctx=t.getContext('2d');
      try{ TILEDRAW[gl]({sx:0,sy:0,x:1,y:1,canopy:()=>{}}); }catch(e){}
      ctx=old;
      g.fillStyle='#FFF';g.fillRect(cx+4,cy+4,84,84);
      g.drawImage(t,0,0,32,32,cx+6,cy+6,80,80);
      g.fillStyle='#221F2B';g.font='700 16px monospace';
      g.fillText(JSON.stringify(gl),cx+6,cy+104);
    });
    ctx=old;
  });
  await pg.waitForTimeout(400);
  await (await pg.$('#sheet')).screenshot({path:path.resolve(__dirname,'..','shots','13-all-tiles.png')});
  /* the side views — what the front and 3D cameras stand up. Same cold read: name it alone. */
  await pg.evaluate(()=>{
    document.getElementById('sheet').remove();
    const glyphs=Object.keys(TILESIDE);
    const COLS=8,CELL=108,PAD=10,rows=Math.max(1,Math.ceil(glyphs.length/COLS));
    const c=document.createElement('canvas');c.id='sheet';
    c.width=COLS*CELL+PAD*2;c.height=rows*CELL+PAD*2;
    c.style.cssText=`position:fixed;left:0;top:0;z-index:99999;background:#EFE9DE;image-rendering:pixelated;width:${c.width}px;height:${c.height}px;`;
    document.body.appendChild(c);
    const g=c.getContext('2d');g.imageSmoothingEnabled=false;
    const old=ctx;
    glyphs.forEach((gl,i)=>{
      const cx=PAD+(i%COLS)*CELL, cy=PAD+Math.floor(i/COLS)*CELL;
      const t=document.createElement('canvas');t.width=32;t.height=32;
      ctx=t.getContext('2d');
      try{ TILESIDE[gl]({sx:0,sy:0,x:1,y:1,canopy:()=>{}}); }catch(e){}
      ctx=old;
      g.fillStyle='#FFF';g.fillRect(cx+4,cy+4,84,84);
      g.drawImage(t,0,0,32,32,cx+6,cy+6,80,80);
      g.fillStyle='#221F2B';g.font='700 16px monospace';
      g.fillText(JSON.stringify(gl)+' side',cx+6,cy+104);
    });
    ctx=old;
  });
  await pg.waitForTimeout(300);
  await (await pg.$('#sheet')).screenshot({path:path.resolve(__dirname,'..','shots','13b-side-tiles.png')});
  await b.close();console.log('sheet written');
})();
