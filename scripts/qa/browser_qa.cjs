const fs=require('fs'),path=require('path');
const {pathToFileURL}=require('url');
const {ROOT,QAOUT,data,serve,state,pause,setSpeed,changeView,launch}=require('./browser_common.cjs');
(async()=>{
const {server,url}=await serve();const browser=await launch();const results=[];
try{for(const s of data){
  const n=s.order,prefix=String(n).padStart(2,'0');const errors=[],externals=[];
  const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,reducedMotion:'no-preference'});
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.protocol==='file:'||u.hostname==='127.0.0.1')route.continue();else{externals.push(u.href);route.abort();}});
  await context.addInitScript(()=>{window.__qaFrames=0;function f(){window.__qaFrames++;requestAnimationFrame(f)}requestAnimationFrame(f);});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  const r={order:n,errors,externals};
  try{
    await page.goto(url+'/scenes/'+prefix+'.html',{waitUntil:'load',timeout:30000});
    await page.waitForFunction(()=>!!(window.__coast||window.__coastalCat||window.sceneState||window.__coastSnapshot||window.__coastalRide||window.__rideState),{timeout:20000});
    await page.waitForTimeout(750);
    r.controls=await page.locator('button,input').evaluateAll(el=>el.map(x=>({tag:x.tagName,id:x.id,text:x.textContent.trim().slice(0,80),dataView:x.dataset.view,dataCamera:x.dataset.camera,type:x.type,min:x.min,max:x.max,value:x.value,ariaLabel:x.getAttribute('aria-label')})));
    r.gl=await page.evaluate(()=>{const c=document.querySelector('canvas'),g=c.getContext('webgl2')||c.getContext('webgl');const e=g.getExtension('WEBGL_debug_renderer_info');return{renderer:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),vendor:e?g.getParameter(e.UNMASKED_VENDOR_WEBGL):g.getParameter(g.VENDOR),version:g.getParameter(g.VERSION)}});
    r.before=await state(page);const f0=await page.evaluate(()=>({frames:window.__qaFrames,now:performance.now()}));
    await page.waitForTimeout(2400);r.after=await state(page);const f1=await page.evaluate(()=>({frames:window.__qaFrames,now:performance.now()}));
    r.observed_fps=(f1.frames-f0.frames)*1000/(f1.now-f0.now);r.observed_wall_seconds=(f1.now-f0.now)/1000;
    r.motion_advanced=r.after.distance>r.before.distance;
    await page.screenshot({path:path.join(QAOUT,'evidence',prefix+'-default.png')});
    await pause(page,n);await page.waitForTimeout(200);r.pause_before=await state(page);await page.waitForTimeout(500);r.pause_after=await state(page);
    r.pause_froze_distance=Math.abs(r.pause_after.distance-r.pause_before.distance)<1e-6;
    r.pause_froze_time=Math.abs(r.pause_after.time-r.pause_before.time)<1e-6;
    await pause(page,n);await page.waitForTimeout(350);r.resume_after=await state(page);r.resume_advanced=r.resume_after.distance>r.pause_after.distance;
    const speedInput=page.locator('#'+(n===6?'speedControl':'speed'));const old=Number(await speedInput.inputValue());const max=Number(await speedInput.getAttribute('max'));const value=Math.min(max,old*1.5);await setSpeed(page,n,value);await page.waitForTimeout(200);r.speed_after=await state(page);r.speed_input_value=value;
    await setSpeed(page,n,old);
    await changeView(page,n,1);await page.waitForTimeout(700);r.view1=await state(page);await page.screenshot({path:path.join(QAOUT,'evidence',prefix+'-view1.png')});
    await changeView(page,n,2);await page.waitForTimeout(700);r.view2=await state(page);await page.screenshot({path:path.join(QAOUT,'evidence',prefix+'-view2.png')});
    const lightId=n===1||n===2?'light':n===6?'sunset':null;
    if(lightId){await page.locator('#'+lightId).click();await page.waitForTimeout(700);r.light_after=await state(page);await page.screenshot({path:path.join(QAOUT,'evidence',prefix+'-sunset.png')});}
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(700);r.mobile=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,height:innerHeight,canvas:document.querySelector('canvas').getBoundingClientRect().toJSON(),visibleControls:[...document.querySelectorAll('button,input')].map(x=>{const p=x.getBoundingClientRect();return{id:x.id,x:p.x,y:p.y,width:p.width,height:p.height,visible:p.width>0&&p.height>0,inViewport:p.left>=0&&p.right<=innerWidth&&p.top>=0&&p.bottom<=innerHeight}})}));
    await page.screenshot({path:path.join(QAOUT,'evidence',prefix+'-mobile.png')});
    await context.setOffline(true);
    const filePage=await context.newPage();filePage.on('pageerror',e=>errors.push('offline: '+String(e)));
    await filePage.goto(pathToFileURL(s.frozen_artifact).href,{waitUntil:'load',timeout:30000});await filePage.waitForTimeout(600);
    r.offline_file_state=await state(filePage);r.offline_file_runs=!!r.offline_file_state;
  }catch(e){r.failure=String(e);}
  results.push(r);fs.writeFileSync(path.join(QAOUT,'browser-results.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify({n,fps:r.observed_fps,errors:r.errors,motion:r.motion_advanced,pause:r.pause_froze_distance,resume:r.resume_advanced,offline:r.offline_file_runs,drawCalls:r.after?.drawCalls??r.after?.renderCalls,failure:r.failure}));
  await context.close();
}}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
