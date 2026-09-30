const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const APP=path.join(ROOT,'docs/experiments/2026-09-30-coastal-cat');
const QAOUT=path.join(ROOT,'qa-results');fs.mkdirSync(path.join(QAOUT,'evidence'),{recursive:true});
const data=JSON.parse(fs.readFileSync(path.join(APP,'analysis-data.json'),'utf8')).subjects.map(s=>({...s,frozen_artifact:path.join(APP,'scenes',String(s.order).padStart(2,'0')+'.html')}));
function serve(){return new Promise(resolve=>{const server=http.createServer((req,res)=>{let f=path.join(APP,decodeURIComponent(req.url.split('?')[0]));if(req.url==='/favicon.ico'){res.writeHead(204);return res.end();}if(!f.startsWith(APP)){res.writeHead(403);return res.end();}if(fs.existsSync(f)&&fs.statSync(f).isFile()){res.setHeader('Content-Type',f.endsWith('.html')?'text/html;charset=utf-8':f.endsWith('.mp4')?'video/mp4':'application/octet-stream');res.end(fs.readFileSync(f));}else{res.writeHead(404);res.end();}});server.listen(0,'127.0.0.1',()=>resolve({server,url:'http://127.0.0.1:'+server.address().port}));});}
function snapshot(){
  if(window.__coast?.snapshot)return window.__coast.snapshot();
  if(window.__coastalCat?.snapshot)return window.__coastalCat.snapshot();
  if(window.sceneState)return {...window.sceneState};
  if(window.__coastSnapshot)return window.__coastSnapshot();
  if(window.__coastalRide)return {...window.__coastalRide};
  if(typeof window.__rideState==='function')return window.__rideState();
  if(window.__rideState)return {...window.__rideState};
  return null;
}
async function state(page){return page.evaluate(snapshot);}
const pauseIds={1:'play',2:'pause',3:'play',4:'pause',5:'play',6:'play',7:'pause'};
const speedIds={1:'speed',2:'speed',3:'speed',4:'speed',5:'speed',6:'speedControl',7:'speed'};
async function pause(page,n){await page.locator('#'+pauseIds[n]).click();}
async function setSpeed(page,n,v){await page.evaluate(({id,v})=>{const x=document.getElementById(id);x.value=String(v);x.dispatchEvent(new Event('input',{bubbles:true}));}, {id:speedIds[n],v});}
async function changeView(page,n,mode){
  await page.evaluate(({n,mode})=>{
    if(n===1){document.querySelector(`[data-camera="${['coast','close','wide'][mode]}"]`).click();}
    else if(n===5){const b=document.querySelectorAll('button[data-view]');if(b.length)b[mode].click();else document.querySelectorAll('button[data-camera]')[mode].click();}
    else document.getElementById(n===2?'camera':'view').click();
  },{n,mode});
}
function frameClock(){
  let now=0,next=1,queue=new Map();
  Object.defineProperty(performance,'now',{value:()=>now});
  window.requestAnimationFrame=cb=>{const id=next++;queue.set(id,cb);return id;};
  window.cancelAnimationFrame=id=>queue.delete(id);
  window.__captureClock={step:ms=>{now+=ms;const q=Array.from(queue.values());queue.clear();for(const cb of q)cb(now);return now;},get:()=>now};
}
async function launch(){return chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--enable-webgl','--ignore-gpu-blocklist','--disable-background-timer-throttling','--disable-renderer-backgrounding']});}
module.exports={ROOT,QAOUT,data,serve,state,snapshot,pause,setSpeed,changeView,frameClock,launch};
