/* VISUAL SMOKE — the eyeball pass the automated suite cannot do.
 *
 * The owner's ask (2026-09-01): "can you run basic 'manual' smoke tests like oh this
 * looks like a door or store or restaurant or construction site". node smoke.js proves
 * the maps are STRUCTURALLY sound; it cannot tell you a door is lying on the floor.
 * This drops the hero at a list of spots, screenshots the viewport in the named camera,
 * and writes shots/*.png for a human (or a model) to look at.
 *
 * Run:  node test/shots.js        (from the repo root)
 * Edit: test/spots.json — {name, w:world, x, y, cam:"3d"|"front"|"top"|"iso", yaw?}
 * Then: open shots/ and actually look. Findings go in docs/IDEAS.md.
 */
const { chromium } = require('playwright-core');
const fs = require('fs'); const path = require('path');
const CAND=[process.env.CHROMIUM_PATH,'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell','/opt/pw-browsers/chromium','/usr/bin/chromium'].filter(Boolean);
(async () => {
  let exe; try{const p=chromium.executablePath(); if(p&&fs.existsSync(p))exe=p;}catch(e){}
  if(!exe)exe=CAND.find(p=>{try{return fs.existsSync(p)&&fs.statSync(p).isFile();}catch(e){return false;}});
  const b = await chromium.launch({ executablePath: exe });
  const pg = await b.newPage({ viewport:{width:480,height:900}, deviceScaleFactor:2 });
  await pg.route('**', r => r.request().url().startsWith('file://') ? r.continue() : r.abort());
  /* --index <file> --spots <file>: shoot another world on the same engine (El Changarrito) */
  const arg=(k,d)=>{const i=process.argv.indexOf(k);return i>0&&process.argv[i+1]?process.argv[i+1]:d;};
  await pg.goto('file://' + path.resolve(__dirname,'..',arg('--index','index.html')));
  await pg.waitForTimeout(1200);
  await pg.click('.classes button[data-c="architect"]');
  await pg.click('#begin');
  await pg.waitForTimeout(400);
  // open the whole city so storefronts exist
  await pg.evaluate(()=>{ if(typeof CHAPTERS!=='undefined'&&CHAPTERS.length&&typeof applyGrowth==='function'){CHAPTERS[0].quests.forEach(i=>done.add(i)); chSeen=1; applyGrowth();} });
  const SPOTS = JSON.parse(fs.readFileSync(path.resolve(__dirname,path.basename(arg('--spots','spots.json'))),'utf8'));
  const OUT=path.resolve(__dirname,'..','shots');fs.mkdirSync(OUT,{recursive:true});
  /* --cams: shoot EVERY spot in all four cameras instead of the one it names.
     The game boots in 3D, and anything drawn in only some cameras is invisible where it
     counts — the mural sat on Calle Principal for days, drawn only top-down and front.
     One flag turns the whole spot list into a four-camera sweep, which is how that class
     of bug gets caught instead of rediscovered (la junta, 2026-09-03). */
  const ALLCAMS = process.argv.includes('--cams');
  const CAMS = ['top','front','iso','3d'];
  for (const s of SPOTS) {
    const shots = ALLCAMS ? CAMS.map(c=>({cam:c, name:`${s.name}--${c}`})) : [{cam:s.cam, name:s.name}];
    for (const sh of shots) {
      await pg.evaluate(([w,x,y,cam,yaw,ch])=>{
        if(ch!==undefined){chSeen=ch;applyGrowth();} /* a spot may raise the city further (ch = districts opened) */
        camSet(cam); world=w; px=fx=x; py=fy=y; moving=false; held=null; dir='down';
        if(cam==='3d'&&typeof T3!=='undefined'&&T3) T3.yaw=yaw;
        setWorldTag(); checkTalk();
      }, [s.w,s.x,s.y,sh.cam,s.yaw||0,s.ch]);
      await pg.waitForTimeout(700);
      const el = await pg.$('#vp');
      await el.screenshot({ path:path.join(OUT,`${sh.name}.png`) });
      console.log('shot', sh.name);
    }
  }
  await b.close();
})();
