import * as THREE from 'three';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#bce7e8');
scene.fog = new THREE.Fog('#bce7e8',75,240);
const camera = new THREE.PerspectiveCamera(43,1,.1,500);
scene.add(new THREE.HemisphereLight('#e9fbff','#b5a67f',2.3));
const sun = new THREE.DirectionalLight('#fff1cd',3.5);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:.1,far:65});
sun.shadow.bias=-.0003;
sun.shadow.normalBias=.035;
scene.add(sun,sun.target);

const mat = (color,roughness=.65,metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
const M = {fur:mat('#eea758'),cream:mat('#fff0cc'),stripe:mat('#bb763c'),pink:mat('#e79589'),black:mat('#263846'),mint:mat('#5dc6b1',.28,.16),mintDark:mat('#278f86'),coral:mat('#ee715b',.3),jacket:mat('#f7d286'),rubber:mat('#29353d'),chrome:mat('#c7d7d8',.25,.6),seat:mat('#715344'),white:mat('#fff3d5'),trunk:mat('#ad8057'),leaf:mat('#389c75'),rock:mat('#b5b6a1'),sand:mat('#f1d7a4'),grass:mat('#97bd91'),road:mat('#647d85')};
const sphereGeo = new THREE.SphereGeometry(1,24,16);
const boxGeo = new THREE.BoxGeometry(1,1,1);
function mesh(g,m,parent=scene){const o=new THREE.Mesh(g,m); o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function ball(p,s,m,parent=scene){const o=mesh(sphereGeo,m,parent);o.position.set(...p);o.scale.set(...s);return o;}
function box(p,s,m,parent=scene){const o=mesh(boxGeo,m,parent);o.position.set(...p);o.scale.set(...s);return o;}
function bar(a,b,r,m,parent=scene){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const o=mesh(new THREE.CylinderGeometry(r,r,av.distanceTo(bv),10),m,parent);o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return o;}
function tube(points,r,m,parent=scene){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),Math.max(32,points.length*2),r,8,false),m,parent);}
function roundBox(p,s,r,m,parent){const shape=new THREE.Shape(),w=s[0]/2,h=s[1]/2;shape.moveTo(-w+r,-h);shape.lineTo(w-r,-h);shape.quadraticCurveTo(w,-h,w,-h+r);shape.lineTo(w,h-r);shape.quadraticCurveTo(w,h,w-r,h);shape.lineTo(-w+r,h);shape.quadraticCurveTo(-w,h,-w,h-r);shape.lineTo(-w,-h+r);shape.quadraticCurveTo(-w,-h,-w+r,-h);const geo=new THREE.ExtrudeGeometry(shape,{depth:s[2]-r*2,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r*.6,bevelThickness:r,curveSegments:8});geo.translate(0,0,-(s[2]-r*2)/2);const o=mesh(geo,m,parent);o.position.set(...p);return o;}
let seed=20260930;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
const RX=34,RZ=57;
const path = a=>new THREE.Vector3(RX*Math.cos(a),.16,RZ*Math.sin(a));
const outward = a=>new THREE.Vector3(Math.cos(a)/RX,0,Math.sin(a)/RZ).normalize();
const ridePath = a=>path(a).addScaledVector(outward(a),-1.55);
function ribbon(inner,outer,material,y=.1){const N=420,verts=[],indices=[];for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,p=path(a),n=outward(a);for(const d of [inner,outer])verts.push(p.x+n.x*d,y,p.z+n.z*d);if(i<N){let k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();const o=mesh(geo,material);o.castShadow=false;return o;}
// A continuous closed coast and road, with an arc-length table for constant riding speed.
ribbon(-12,8,M.sand,-.28);ribbon(-3.6,3.6,M.road,.12);ribbon(-3.62,-3.47,M.white,.13);ribbon(3.47,3.62,M.white,.13);
const land=mesh(new THREE.CylinderGeometry(1,1,.45,96),M.grass);land.scale.set(RX-9,1,RZ-9);land.position.y=-.36;land.castShadow=false;
for(let i=0;i<100;i++){const a=i/100*Math.PI*2,p=path(a),v=new THREE.Vector3(-RX*Math.sin(a),0,RZ*Math.cos(a)).normalize();const o=box([p.x,.137,p.z],[.11,.015,1.7],M.white);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),v);o.castShadow=false;}
const guard=mat('#e7e8d8',.5,.25);
for(let i=0;i<94;i++){const a=i/94*Math.PI*2,p=path(a).addScaledVector(outward(a),4.05);bar([p.x,.08,p.z],[p.x,.65,p.z],.04,guard);}
for(const h of [.48,.67]){const pts=[];for(let i=0;i<=300;i++){const a=i/300*Math.PI*2,p=path(a).addScaledVector(outward(a),4.05);pts.push([p.x,h,p.z]);}tube(pts,.035,guard).castShadow=false;}

const water = new THREE.ShaderMaterial({uniforms:{time:{value:0},waterA:{value:new THREE.Color('#55c7c8')},waterB:{value:new THREE.Color('#238fbb')}},vertexShader:`varying vec3 p;uniform float time;void main(){p=position;vec3 q=position;q.y+=sin(q.x*.24+time)*.08+cos(q.z*.22+time*.8)*.06;gl_Position=projectionMatrix*modelViewMatrix*vec4(q,1.);}`,fragmentShader:`varying vec3 p;uniform float time;uniform vec3 waterA,waterB;void main(){float wave=sin(p.x*.57+p.z*.17-time*1.8)*sin(p.z*.37+time*.8);float rip=pow(max(0.,sin(p.x*1.7+p.z*.34+sin(p.z*.24-time)*1.4)),20.);float dist=clamp(length(p.xz)/190.,0.,1.);vec3 c=mix(waterA,waterB,dist*.8)+wave*.023+rip*.065;gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
const seaGeo=new THREE.PlaneGeometry(900,900,130,130);seaGeo.rotateX(-Math.PI/2);const sea=mesh(seaGeo,water);sea.position.y=-.65;sea.castShadow=false;sea.receiveShadow=false;
const foamMat=new THREE.MeshBasicMaterial({color:'#d2f8ec',transparent:true,opacity:.53,side:THREE.DoubleSide});
const foams=[ribbon(8.05,8.45,foamMat,-.46),ribbon(9.2,9.36,foamMat,-.53)];
// Beach stones, palm trees and little inland cottages.
const palms=[];
function palm(a,d,height){const base=path(a).addScaledVector(outward(a),d);const g=new THREE.Group();g.position.copy(base);g.position.y=-.15;scene.add(g);palms.push(g);const bend=.5; tube([[0,0,0],[.2,height*.4,.1],[bend,height,.2]],.13,M.trunk,g);for(let i=1;i<9;i++){const ring=mesh(new THREE.TorusGeometry(.132,.018,4,10),M.stripe,g);ring.rotation.x=Math.PI/2;ring.position.set(bend*i/9,height*i/9,.2*i/9);}for(let j=0;j<8;j++){const an=j*Math.PI/4;const v=[],ind=[];for(let k=0;k<=9;k++){const t=k/9,len=2.55*t,width=.35*Math.sin(Math.PI*t),y=height+.35*Math.sin(t*Math.PI)-t*t*.95;for(const side of [-1,1])v.push(bend+Math.cos(an)*len+Math.sin(an)*width*side,y,.2+Math.sin(an)*len-Math.cos(an)*width*side);if(k<9){const q=k*2;ind.push(q,q+1,q+2,q+1,q+3,q+2);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex(ind);geo.computeVertexNormals();const leaf=mesh(geo,new THREE.MeshStandardMaterial({color:j%2?'#448d6c':'#61a77a',side:THREE.DoubleSide}),g);}for(let k=0;k<3;k++)ball([bend+(k-1)*.17,height-.1,.2],[.18,.22,.18],M.trunk,g);return g;}
for(let i=0;i<32;i++)palm(i/32*Math.PI*2,-6.5-rand()*4,3.2+rand()*1.8);
for(let i=0;i<16;i++)palm((i+.5)/16*Math.PI*2,6.15,3.0+rand()*1.1);
for(let i=0;i<74;i++){const a=rand()*Math.PI*2,d=4.9+rand()*2.3,p=path(a).addScaledVector(outward(a),d);const r=.2+rand()*.45;const o=mesh(new THREE.DodecahedronGeometry(r,0),M.rock);o.position.set(p.x,-.17,p.z);o.scale.set(1.5,.65,1);}
for(let i=0;i<13;i++){const a=i/13*Math.PI*2,p=path(a).addScaledVector(outward(a),-18);const g=new THREE.Group();g.position.copy(p);g.position.y=-.2;g.rotation.y=-a;scene.add(g);const color=mat(['#f7e6c2','#e8b49d','#d3e2ce'][i%3]);box([0,.85,0],[3,1.8,2.5],color,g);const roof=mesh(new THREE.ConeGeometry(2.5,1,4),M.coral,g);roof.rotation.y=Math.PI/4;roof.position.y=2.25;box([0,.75,1.265],[.55,1.4,.06],M.mintDark,g);for(const x of [-.9,.9]){box([x,1.05,1.27],[.5,.6,.055],M.white,g);box([x,1.05,1.31],[.38,.48,.02],M.mintDark,g);}}
for(let i=0;i<6;i++){const o=mesh(new THREE.IcosahedronGeometry(1,1),mat(i%2?'#80ad96':'#97b69a'));o.position.set((rand()-.5)*28,1,(rand()-.5)*50);o.scale.set(8+rand()*7,3+rand()*4,7+rand()*7);}
// Distant islands and clouds make the horizon feel open.
for(let i=0;i<10;i++){const a=i/10*Math.PI*2,p=path(a).addScaledVector(outward(a),85+rand()*45);const o=mesh(new THREE.IcosahedronGeometry(1,1),mat('#84bab6'));o.position.set(p.x,-.2,p.z);o.scale.set(12+rand()*12,3+rand()*5,7+rand()*10);o.castShadow=false;}
const clouds=[];
for(let i=0;i<24;i++){const g=new THREE.Group();g.position.set((rand()-.5)*320,18+rand()*17,(rand()-.5)*320);scene.add(g);const cm=new THREE.MeshBasicMaterial({color:'#f6fbec'});for(let k=0;k<5;k++){const o=ball([(k-2)*2.2,Math.sin(k*2)*.5,0],[2.8,1.1+rand()*.8,1.3],cm,g);o.castShadow=false;}clouds.push(g);}
const sunDisc=ball([105,39,-100],[7,7,7],new THREE.MeshBasicMaterial({color:'#fff4cb'}));sunDisc.castShadow=false;

const ride=new THREE.Group();scene.add(ride);
const scooter=new THREE.Group();ride.add(scooter);
const wheels=[];
for(const z of [-.87,.91]){const w=new THREE.Group();w.position.set(0,.34,z);scooter.add(w);wheels.push(w);const tire=mesh(new THREE.TorusGeometry(.263,.079,12,36),M.rubber,w);tire.rotation.y=Math.PI/2;const hub=mesh(new THREE.CylinderGeometry(.193,.193,.145,32),M.chrome,w);hub.rotation.z=Math.PI/2;for(const side of [-1,1]){const disc=mesh(new THREE.CylinderGeometry(.105,.105,.012,24),M.mintDark,w);disc.rotation.z=Math.PI/2;disc.position.x=side*.081;for(let j=0;j<5;j++){const a=j/5*Math.PI*2;bar([side*.089,.065*Math.sin(a),.065*Math.cos(a)],[side*.089,.17*Math.sin(a+.25),.17*Math.cos(a+.25)],.016,M.white,w);}}const pts=[];for(let k=0;k<=16;k++){const a=k/16*Math.PI;pts.push([0,.34+.43*Math.sin(a),z+.43*Math.cos(a)]);}tube(pts,.055,M.mint,scooter);}
roundBox([0,.53,-.03],[.86,.13,1.58],.05,M.mint,scooter);
roundBox([0,.65,-.62],[.66,.46,.62],.13,M.mint,scooter);
ball([0,.91,-.68],[.37,.27,.49],M.mint,scooter);
roundBox([0,1.16,-.45],[.64,.18,.77],.065,M.seat,scooter);
bar([0,.58,-.3],[0,1.12,-.4],.11,M.mintDark,scooter);
const shield=roundBox([0,1,.64],[.64,.86,.23],.12,M.mint,scooter);shield.rotation.x=-.16;
roundBox([0,1.04,.788],[.38,.47,.065],.075,M.white,scooter);
bar([0,.48,.91],[0,1.56,.58],.05,M.chrome,scooter);
bar([-.5,1.6,.57],[.5,1.6,.57],.042,M.chrome,scooter);
for(const side of [-1,1]){bar([side*.32,1.6,.57],[side*.54,1.6,.57],.056,M.rubber,scooter);bar([side*.36,1.61,.57],[side*.5,1.94,.64],.018,M.chrome,scooter);ball([side*.51,1.97,.64],[.105,.075,.035],M.chrome,scooter);}
ball([0,1.52,.77],[.185,.145,.095],M.mint,scooter);
const lightMat=new THREE.MeshStandardMaterial({color:'#fff9dd',emissive:'#ffe7a9',emissiveIntensity:.5,roughness:.2});
ball([0,1.52,.84],[.139,.11,.055],lightMat,scooter);
for(const x of [-.26,.26])ball([x,1.31,.79],[.06,.046,.035],M.coral,scooter);
box([0,.8,-1.09],[.24,.11,.045],M.coral,scooter);
roundBox([0,.64,-1.115],[.26,.13,.025],.015,M.white,scooter);
for(let i=0;i<3;i++)box([.336,.72+i*.065,-.71],[.012,.019,.25],M.mintDark,scooter);
// The rider is built in full 3D, including attached paws, tail, helmet and facial details.
const cat=new THREE.Group();ride.add(cat);
ball([0,1.58,-.38],[.32,.46,.29],M.jacket,cat);
ball([0,1.37,-.49],[.32,.22,.31],M.jacket,cat);
box([0,1.63,-.09],[.025,.49,.02],M.coral,cat);
for(const side of [-1,1]){tube([[side*.22,1.33,-.38],[side*.34,.92,-.06],[side*.31,.65,.18]],.105,M.jacket,cat);ball([side*.31,.685,.21],[.14,.09,.22],M.cream,cat);bar([side*.24,1.83,-.34],[side*.38,1.59,.04],.11,M.jacket,cat);bar([side*.38,1.59,.04],[side*.43,1.61,.56],.085,M.fur,cat);ball([side*.43,1.61,.57],[.115,.09,.1],M.cream,cat);}
const head=new THREE.Group();head.position.set(0,2.19,-.29);cat.add(head);
ball([0,.06,0],[.48,.43,.4],M.fur,head);
ball([-.155,-.065,.327],[.21,.145,.12],M.cream,head);ball([.155,-.065,.327],[.21,.145,.12],M.cream,head);
ball([0,.002,.449],[.072,.049,.043],M.pink,head);
const eyes=[];
for(const side of [-1,1]){const eye=ball([side*.215,.14,.342],[.058,.079,.034],M.black,head);eyes.push(eye);ball([side*.206,.168,.371],[.016,.019,.008],M.white,head);ball([side*.31,-.023,.328],[.062,.027,.02],M.pink,head);for(let k=0;k<3;k++)bar([side*.28,-.05-k*.034,.415],[side*(.58+k*.023),-.018-k*.055,.37],.006,M.seat,head);}
tube([[0,-.028,.456],[0,-.08,.453],[-.06,-.105,.446]],.009,M.seat,head);tube([[0,-.08,.453],[.06,-.105,.446]],.009,M.seat,head);
for(const side of [-1,1]){const ear=mesh(new THREE.ConeGeometry(.19,.5,3),M.fur,head);ear.position.set(side*.35,.55,-.035);ear.rotation.z=-side*.15;ear.rotation.y=Math.PI;const inner=mesh(new THREE.ConeGeometry(.12,.33,3),M.pink,head);inner.position.set(side*.35,.565,.054);inner.rotation.z=-side*.15;inner.rotation.y=Math.PI;}
for(const x of [-.15,0,.15]){const stripe=ball([x,.29,.28],[.035,.09,.019],M.stripe,head);stripe.rotation.z=x*1.4;}
const helmet=mesh(new THREE.SphereGeometry(.5,32,16,0,Math.PI*2,0,Math.PI*.47),M.coral,head);helmet.position.set(0,.25,-.028);helmet.scale.set(1.04,.68,1.04);
const helmetStripe=mesh(new THREE.SphereGeometry(.505,8,14,Math.PI*.46,.23,0,Math.PI*.47),M.white,head);helmetStripe.position.copy(helmet.position);helmetStripe.scale.copy(helmet.scale);
ball([0,.26,.385],[.4,.038,.12],M.coral,head);
for(const side of [-1,1])bar([side*.44,.2,0],[side*.24,-.25,.08],.016,M.seat,head);
const tailRoot=new THREE.Group();tailRoot.position.set(.1,1.32,-.66);cat.add(tailRoot);
tube([[0,0,0],[.4,.05,-.32],[.55,.4,-.66],[.47,.7,-.82],[.21,.75,-.88]],.087,M.fur,tailRoot);ball([.21,.75,-.88],[.09,.09,.09],M.cream,tailRoot);
for(let i=0;i<3;i++)ball([.5,.3+i*.13,-.58-i*.09],[.092,.045,.092],M.stripe,tailRoot);
const scarf=mesh(new THREE.TorusGeometry(.22,.055,8,28),M.coral,cat);scarf.rotation.x=Math.PI/2;scarf.position.set(0,1.98,-.31);
const scarfGeo=new THREE.PlaneGeometry(.22,.86,2,12);scarfGeo.rotateX(-Math.PI/2);scarfGeo.translate(0,0,-.43);
const scarfFlap=mesh(scarfGeo,new THREE.MeshStandardMaterial({color:'#ef745d',side:THREE.DoubleSide}),cat);scarfFlap.position.set(-.18,1.96,-.48);const scarfBase=Float32Array.from(scarfGeo.attributes.position.array);
// A tiny rear travel bag.
roundBox([0,1.12,-.95],[.47,.38,.25],.07,M.white,scooter);box([0,1.12,-1.092],[.04,.35,.012],M.coral,scooter);

const birds=[];for(let i=0;i<9;i++){const g=new THREE.Group();scene.add(g);const bm=new THREE.MeshBasicMaterial({color:'#fdf9e8',side:THREE.DoubleSide});for(const side of [-1,1]){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,side*.45,.07,.03,side*.16,0,.15],3));const wing=mesh(geo,bm,g);wing.userData.side=side;wing.castShadow=false;}birds.push(g);}
const samples=2400,arc=[0];let prev=ridePath(0);for(let i=1;i<=samples;i++){const p=ridePath(i/samples*Math.PI*2);arc.push(arc[i-1]+p.distanceTo(prev));prev=p;}
const total=arc[samples];function angleAt(distance){const d=((distance%total)+total)%total;let lo=0,hi=samples;while(lo+1<hi){const mid=(lo+hi)>>1;if(arc[mid]<d)lo=mid;else hi=mid;}return (lo+(d-arc[lo])/(arc[hi]-arc[lo]))/samples*Math.PI*2;}
let distance=4,time=0,speed=4.8,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,mode=0,zoom=1,yaw=0,pitch=0,drag=null,last=performance.now(),frame=0;
const viewNames=['伴骑视角','追风视角','海岸全景'];
const pauseBtn=document.querySelector('#pause'),viewBtn=document.querySelector('#view'),speedInput=document.querySelector('#speed');
function updatePause(){pauseBtn.textContent=paused?'▶ 继续骑行':'Ⅱ 暂停骑行';pauseBtn.setAttribute('aria-pressed',String(paused));document.querySelector('#status').textContent=paused?'稍作停留':'正在沿海骑行';}
function togglePause(){paused=!paused;updatePause();}
pauseBtn.onclick=togglePause;
viewBtn.onclick=()=>{mode=(mode+1)%3;viewBtn.textContent=viewNames[mode];yaw=0;pitch=0;};
speedInput.oninput=()=>{speed=Number(speedInput.value);document.querySelector('#speedLabel').textContent=(speed/4.8).toFixed(1)+'×';};
document.querySelector('#reset').onclick=()=>{distance=4;time=0;speed=4.8;speedInput.value=4.8;speedInput.oninput();mode=0;viewBtn.textContent=viewNames[0];zoom=1;yaw=0;pitch=0;};
window.addEventListener('keydown',e=>{if(e.code==='Space'&&!['INPUT','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();togglePause();}if(e.code==='KeyC')viewBtn.click();});
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';});
canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.006,-.3,.75);drag={x:e.clientX,y:e.clientY};});
const endDrag=()=>{drag=null;canvas.style.cursor='grab';};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom*Math.exp(e.deltaY*.001),.65,2.2);},{passive:false});
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();updatePause();
document.addEventListener('visibilitychange',()=>last=performance.now());
let lost=false;canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;document.querySelector('#loading').hidden=false;document.querySelector('#loading').textContent='画面恢复中…';});canvas.addEventListener('webglcontextrestored',()=>{lost=false;document.querySelector('#loading').hidden=true;last=performance.now();});
const cameraOffset=new THREE.Vector3(),cameraTarget=new THREE.Vector3();
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;if(lost||document.hidden)return;if(!paused){time+=dt;distance+=speed*dt;}
 const a=angleAt(distance);ride.position.copy(ridePath(a));ride.position.y=.122;const tangent=ridePath(a+.0001).sub(ridePath(a-.0001)).normalize();ride.rotation.y=Math.atan2(tangent.x,tangent.z);
 for(const w of wheels)w.rotation.x=distance/.342;
 tailRoot.rotation.z=Math.sin(time*2.7)*.1;tailRoot.rotation.y=Math.sin(time*2.1)*.12;
 head.rotation.y=Math.sin(time*.55)*.055;head.rotation.z=Math.sin(time*1.5)*.022;
 const blink=time%5.3;for(const eye of eyes)eye.scale.y=.079*(blink>4.95&&blink<5.12?.14:1);
 const pos=scarfGeo.attributes.position;for(let i=0;i<pos.count;i++){const z=scarfBase[i*3+2];pos.array[i*3+1]=Math.sin(time*9+z*9)*.065*(-z/.86);pos.array[i*3]=scarfBase[i*3]+Math.sin(time*6+z*5)*.04*(-z/.86);}pos.needsUpdate=true;scarfGeo.computeVertexNormals();
 water.uniforms.time.value=time;foams.forEach((f,i)=>{f.position.y=Math.sin(time*1.2+i)*.026;f.material.opacity=.45+Math.sin(time*.75)*.08;});
 birds.forEach((b,i)=>{const ba=a+i*.04-.1;b.position.copy(path(ba).addScaledVector(outward(ba),12+i*2));b.position.y=8+i*.45+Math.sin(time+i)*.3;b.rotation.y=ride.rotation.y;b.children.forEach(w=>w.rotation.z=Math.sin(time*4+i)*.45*w.userData.side);});
 if(mode===2){cameraOffset.set(-20,29,32);cameraTarget.copy(ride.position).multiplyScalar(.65);cameraTarget.y=0;}else{const mobile=innerWidth<650;cameraOffset.set(...(mode===0?[-5.1,2.25,6.8]:[3.9,2.8,-6.5]));if(mobile)cameraOffset.multiplyScalar(1.28);cameraOffset.y+=pitch*6;cameraOffset.applyAxisAngle(new THREE.Vector3(0,1,0),ride.rotation.y+yaw);cameraTarget.copy(ride.position).add(new THREE.Vector3(0,1.45,0));}
 if(mode===2)cameraOffset.applyAxisAngle(new THREE.Vector3(0,1,0),yaw);camera.position.copy(cameraTarget).add(cameraOffset.multiplyScalar(zoom));camera.lookAt(cameraTarget);
 // Keep nearby foliage from passing through the following camera.
 for(const palm of palms)palm.visible=mode===2||Math.hypot(palm.position.x-camera.position.x,palm.position.z-camera.position.z)>8.5;
 sun.position.copy(ride.position).add(new THREE.Vector3(-12,25,12));sun.target.position.copy(ride.position);
 renderer.render(scene,camera);frame++;
 if(frame%12===0){document.querySelector('#distance').textContent=(distance/1000).toFixed(2);document.querySelector('#kph').textContent=String(Math.round(paused?0:speed*3.6));}
}
window.__rideState=()=>({distance,time,paused,speed,mode,angle:angleAt(distance),wheelRotation:wheels[0].rotation.x,wheelRadius:.342,position:ride.position.toArray(),frame,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles});
document.querySelector('#loading').hidden=true;
requestAnimationFrame(animate);


