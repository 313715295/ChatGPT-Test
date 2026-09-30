const fs=require('fs'),path=require('path');
const {ROOT,QAOUT,data,serve,state,pause,changeView,frameClock,launch}=require('./browser_common.cjs');
(async()=>{const {server,url}=await serve();const browser=await launch();const results=[];
try{for(const s of data){
 const n=s.order,prefix=String(n).padStart(2,'0'),r={order:n};
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'no-preference'});await context.addInitScript(frameClock);const page=await context.newPage();
 await page.goto(url+'/scenes/'+prefix+'.html',{waitUntil:'load'});for(let i=0;i<40;i++)await page.evaluate(()=>window.__captureClock.step(50));await page.waitForTimeout(800);
 r.mobile_default=await state(page);await page.screenshot({path:path.join(QAOUT,'evidence',prefix+'-mobile-default.png')});
 for(const m of [1,2]){await changeView(page,n,m);for(let i=0;i<25;i++)await page.evaluate(()=>window.__captureClock.step(50));r['mobile_view'+m]=await state(page);await page.screenshot({path:path.join(QAOUT,'evidence',prefix+'-mobile-view'+m+'.png')});}
 r.mobile_bounds=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('button,input')].map(x=>{const p=x.getBoundingClientRect();return{id:x.id,text:x.textContent.trim(),visible:p.width>0&&p.height>0,inBounds:p.left>=0&&p.top>=0&&p.right<=innerWidth&&p.bottom<=innerHeight,width:p.width,height:p.height}})}));
 await page.setViewportSize({width:1280,height:720});
 await page.locator('canvas').click({position:{x:600,y:350}});await page.keyboard.press('Space');for(let i=0;i<10;i++)await page.evaluate(()=>window.__captureClock.step(50));r.keyboard_pause=await state(page);
 await page.keyboard.press('Space');for(let i=0;i<10;i++)await page.evaluate(()=>window.__captureClock.step(50));r.keyboard_resume=await state(page);
 await page.mouse.move(600,330);await page.mouse.down();await page.mouse.move(760,390,{steps:10});await page.mouse.up();for(let i=0;i<20;i++)await page.evaluate(()=>window.__captureClock.step(50));r.drag_state=await state(page);
 await page.screenshot({path:path.join(QAOUT,'evidence',prefix+'-drag.png')});await page.mouse.wheel(0,350);for(let i=0;i<20;i++)await page.evaluate(()=>window.__captureClock.step(50));r.zoom_state=await state(page);await page.screenshot({path:path.join(QAOUT,'evidence',prefix+'-zoom.png')});
 if(n===5){await page.reload();for(let i=0;i<40;i++)await page.evaluate(()=>window.__captureClock.step(50));await page.waitForTimeout(800);for(const m of [1,2]){await changeView(page,n,m);for(let i=0;i<25;i++)await page.evaluate(()=>window.__captureClock.step(50));r['desktop_view'+m]=await state(page);await page.screenshot({path:path.join(QAOUT,'evidence',prefix+'-view'+m+'.png')});}}
 await context.close();
 const reduced=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'reduce'});await reduced.addInitScript(frameClock);const rp=await reduced.newPage();await rp.goto(url+'/scenes/'+prefix+'.html',{waitUntil:'load'});for(let i=0;i<20;i++)await rp.evaluate(()=>window.__captureClock.step(50));r.reduced_state=await state(rp);await reduced.close();
 results.push(r);fs.writeFileSync(path.join(QAOUT,'extended-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({n,keyboardPaused:r.keyboard_pause?.paused??r.keyboard_pause?.running,keyboardResumed:r.keyboard_resume?.paused??r.keyboard_resume?.running,reduced:r.reduced_state?.paused??r.reduced_state?.running,view1:r.mobile_view1?.view??r.mobile_view1?.camera??r.mobile_view1?.mode}));
}}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
