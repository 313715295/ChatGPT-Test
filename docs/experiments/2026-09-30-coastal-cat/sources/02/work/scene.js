(() => {
'use strict';
const $=id=>document.getElementById(id),T=THREE,TAU=Math.PI*2;
let renderer;
try { renderer=new T.WebGLRenderer({canvas:$('scene'),antialias:true,alpha:false,powerPreference:'high-performance'}); }
catch(e){$('loading').hidden=true;$('error').hidden=false;return;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;
const scene=new T.Scene();scene.background=new T.Color('#b9e2e8');scene.fog=new T.Fog('#b9e2e8',100,290);
const camera=new T.PerspectiveCamera(43,1,.1,550);
const hemi=new T.HemisphereLight('#e5fbff','#b5a573',2.5);scene.add(hemi);
const sun=new T.DirectionalLight('#fff0d2',3.35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-19;sun.shadow.camera.right=19;sun.shadow.camera.top=19;sun.shadow.camera.bottom=-19;sun.shadow.camera.near=1;sun.shadow.camera.far=85;sun.shadow.bias=-.00022;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun,sun.target);
const fill=new T.DirectionalLight('#d9faff',.45);fill.position.set(0,15,-30);scene.add(fill);
let seed=7341;const rand=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
const mat=(c,rough=.72,metal=0)=>new T.MeshStandardMaterial({color:c,roughness:rough,metalness:metal});
const M={sand:mat('#efdab0'),grass:mat('#9fbd78'),grassDark:mat('#759b6d'),hill:mat('#81a77b'),road:mat('#626f73'),edge:mat('#eee9d5'),white:mat('#fff8e6'),bark:mat('#b38759'),leaf:mat('#5b9a75'),leafLight:mat('#8aba76'),rock:mat('#a9b7a3'),coral:mat('#e58767'),mint:mat('#65c9b6',.31,.08),mintDark:mat('#318779',.5),rubber:mat('#303d41'),rim:mat('#e4eadd',.35,.5),chrome:mat('#a4c6c3',.22,.65),seat:mat('#755849'),orange:mat('#e9a151'),stripe:mat('#bc7037'),cream:mat('#fff0d5'),pink:mat('#d38980'),dark:mat('#313b3b'),scarf:mat('#e87550'),helmet:mat('#f4ecd8',.38),window:mat('#709a9a',.3),roof:mat('#c98065')};
const environment=new T.Group();scene.add(environment);
function mesh(geo,material,parent,x=0,y=0,z=0){const o=new T.Mesh(geo,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function ball(p,m,x,y,z,sx,sy=sx,sz=sx,detail=20){const o=mesh(new T.SphereGeometry(1,detail,14),m,p,x,y,z);o.scale.set(sx,sy,sz);return o;}
function box(p,m,x,y,z,sx,sy,sz,r=0){let g;if(r){const s=new T.Shape(),w=sx/2,h=sy/2;s.moveTo(-w+r,-h);s.lineTo(w-r,-h);s.quadraticCurveTo(w,-h,w,-h+r);s.lineTo(w,h-r);s.quadraticCurveTo(w,h,w-r,h);s.lineTo(-w+r,h);s.quadraticCurveTo(-w,h,-w,h-r);s.lineTo(-w,-h+r);s.quadraticCurveTo(-w,-h,-w+r,-h);g=new T.ExtrudeGeometry(s,{depth:sz-2*r,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r,bevelThickness:r,curveSegments:5});g.translate(0,0,-(sz-2*r)/2);}else g=new T.BoxGeometry(sx,sy,sz);return mesh(g,m,p,x,y,z);}
function rod(p,m,a,b,r=.08,r2=r,n=10){a=new T.Vector3(...a);b=new T.Vector3(...b);const o=mesh(new T.CylinderGeometry(r2,r,a.distanceTo(b),n),m,p);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());return o;}
function curve(p,m,pts,r=.08){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(a=>new T.Vector3(...a))),32,r,8,false),m,p);}
function flatRing(p,m,rx,rz,width,y){const pos=[],norm=[],idx=[],N=360;for(let i=0;i<=N;i++){const t=i/N*TAU;for(const side of [-1,1]){pos.push((rx+side*width/2)*Math.sin(t),y,(rz+side*width/2)*Math.cos(t));norm.push(0,1,0);}if(i<N){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));g.setIndex(idx);return mesh(g,m,p);}
function disk(p,m,rx,rz,y){const o=mesh(new T.CylinderGeometry(1,1,.22,120),m,p,0,y-.11,0);o.scale.set(rx,1,rz);return o;}
const RX=48,RZ=33,ROAD=.34;
disk(environment,M.sand,57.4,42.4,.13);disk(environment,M.grass,45,30,.27);
flatRing(environment,M.edge,RX,RZ,7.4,.29);flatRing(environment,M.road,RX,RZ,6.7,ROAD);
flatRing(environment,M.white,RX-2.92,RZ-2.92,.09,ROAD+.018);flatRing(environment,M.white,RX+2.92,RZ+2.92,.09,ROAD+.018);
for(let i=0;i<99;i++){const t=i/99*TAU,x=RX*Math.sin(t),z=RZ*Math.cos(t);const d=box(environment,M.edge,x,ROAD+.015,z,1.3,.012,.105);d.rotation.y=Math.atan2(RZ*Math.sin(t),RX*Math.cos(t));}
// Low grassy dunes keep the coast visible from the riding camera.
for(let i=0;i<19;i++){const t=rand()*TAU,r=Math.sqrt(rand())*.76;ball(environment,i%2?M.hill:M.grassDark,Math.sin(t)*35*r,.08,Math.cos(t)*21*r,5+rand()*7,1.5+rand()*5,4+rand()*6,12);}
// Ocean: animated light ripples and a shallow turquoise shelf around the island.
const seaUniforms={uTime:{value:0},uWarm:{value:0},uSky:{value:new T.Color('#b9e2e8')}};
const seaMaterial=new T.ShaderMaterial({uniforms:seaUniforms,vertexShader:`varying vec3 vWorld;void main(){vec4 w=modelMatrix*vec4(position,1.0);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,fragmentShader:`uniform float uTime;uniform float uWarm;uniform vec3 uSky;varying vec3 vWorld;void main(){vec2 p=vWorld.xz;float coast=length(p/vec2(57.4,42.4));float depth=smoothstep(1.0,2.6,coast);vec3 col=mix(vec3(.29,.77,.72),vec3(.12,.56,.67),depth);float a=sin(p.x*.77+p.y*.47+uTime*.75);float b=sin(p.x*.39-p.y*.71-uTime*.62);float c=sin(p.x*2.6+p.y*1.9+uTime*1.3);float sparkle=pow(max(0.,a*b*c),12.);col+=sparkle*.32;col+=sin(p.x*.3+p.y*.57+uTime*.9)*.012;float crest=sin((coast-1.)*110.-uTime*1.5+sin(atan(p.x,p.y)*19.)*.5);float foam=smoothstep(.92,1.,crest)*(1.-smoothstep(1.02,1.14,coast))*.4;col=mix(col,vec3(.89,.96,.85),foam);col=mix(col,col*vec3(1.18,.86,.79),uWarm*.55);float fog=smoothstep(100.,300.,distance(cameraPosition,vWorld));gl_FragColor=vec4(mix(col,uSky,fog),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
const sea=mesh(new T.PlaneGeometry(1200,1200),seaMaterial,scene,0,-.045,0);sea.rotation.x=-Math.PI/2;sea.castShadow=false;sea.receiveShadow=false;
// Sea foam and pebbles on the tide line.
const foamMat=new T.MeshBasicMaterial({color:'#f4f5d8',transparent:true,opacity:.5,depthWrite:false});
const surf=[];for(let k=0;k<3;k++){const o=flatRing(scene,foamMat.clone(),57.1+k*.58,42.1+k*.58,.16,.005+k*.003);o.castShadow=false;surf.push(o);}
for(let i=0;i<68;i++){const t=rand()*TAU;const r=53+rand()*3;ball(environment,i%3?M.rock:M.white,Math.sin(t)*r,.13,Math.cos(t)*(r-15),.25+rand()*.55,.12+rand()*.24,.25+rand()*.6,8);}
function palm(x,z,height=4.7,angle=0){const g=new T.Group();environment.add(g);g.position.set(x,.2,z);g.rotation.y=angle;curve(g,M.bark,[[0,0,0],[.08,height*.35,0],[.38,height*.73,.04],[.62,height,.1]],.13);for(let j=0;j<7;j++){const t=j/7*TAU;const points=[],indices=[];for(let k=0;k<=8;k++){const u=k/8,d=u*2.4,w=Math.sin(Math.PI*u)*.39,y=height+.15+Math.sin(u*Math.PI)*.34-u*.75;for(const s of [-1,1])points.push(.62+Math.cos(t)*d+Math.sin(t)*w*s,y,.1+Math.sin(t)*d-Math.cos(t)*w*s);if(k<8){let a=k*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.setIndex(indices);geo.computeVertexNormals();const leaf=mesh(geo,j%2?M.leaf:M.leafLight,g);leaf.material.side=T.DoubleSide;}for(let j=0;j<3;j++)ball(g,M.bark,.45+j*.13,height-.1,.13,.18,.22,.18,10);}
for(let i=0;i<25;i++){const t=i/25*TAU+.025;const outer=i%4===0;const rx=outer?53:37.5,rz=outer?38:22.5;palm(Math.sin(t)*rx,Math.cos(t)*rz,3.7+rand()*1.8,rand()*TAU);}
// Painted roadside bollards, with space between them to see the beach.
for(let i=0;i<64;i++){const t=i/64*TAU;const x=51.9*Math.sin(t),z=36.9*Math.cos(t);rod(environment,M.white,[x,.2,z],[x,1.0,z],.09);rod(environment,M.mintDark,[x,.65,z],[x,.8,z],.095);}
// A little lighthouse and houses are landmarks as the cat circles the island.
function lighthouse(x,z){const g=new T.Group();environment.add(g);g.position.set(x,.14,z);mesh(new T.CylinderGeometry(2.3,2.5,.25,24),M.white,g,0,.12,0);for(let k=0;k<5;k++)mesh(new T.CylinderGeometry(1.02-k*.085,1.1-k*.085,1.07,20),k%2?M.coral:M.white,g,0,.7+k*1.07,0);mesh(new T.CylinderGeometry(1.02,1.02,.16,24),M.white,g,0,5.68,0);mesh(new T.CylinderGeometry(.7,.7,.87,12),M.window,g,0,6.17,0);for(let i=0;i<8;i++){const t=i/8*TAU;rod(g,M.white,[Math.sin(t)*.73,5.78,Math.cos(t)*.73],[Math.sin(t)*.73,6.61,Math.cos(t)*.73],.036);}mesh(new T.ConeGeometry(1.08,.67,16),M.coral,g,0,6.9,0);ball(g,M.white,0,7.27,0,.12);box(g,M.mintDark,0,.8,1.05,.5,1.1,.05,.035);}
lighthouse(50*Math.sin(.64),37.5*Math.cos(.64));
function house(x,z,rot,color){const g=new T.Group();environment.add(g);g.position.set(x,.3,z);g.rotation.y=rot;const hmat=mat(color);box(g,hmat,0,1.15,0,3.4,2.3,2.7,.07);const roof=mesh(new T.ConeGeometry(2.7,1.3,4),M.roof,g,0,2.8,0);roof.rotation.y=Math.PI/4;roof.scale.z=.85;for(const v of [-.95,.95]){box(g,M.white,v,1.25,1.39,.8,1.03,.1);box(g,M.window,v,1.25,1.46,.58,.81,.03);}box(g,M.mintDark,0,.85,1.39,.6,1.65,.08);box(g,M.white,0,.17,1.7,3.4,.18,.6);}
house(-20,13,.7,'#f5ddaa');house(-25,7,.95,'#e8bc97');house(16,-17,2.4,'#e8e8c6');
function umbrella(x,z,color){const g=new T.Group();environment.add(g);g.position.set(x,.14,z);rod(g,M.white,[0,0,0],[0,2.1,0],.035);const mm=mat(color);const top=mesh(new T.ConeGeometry(1.15,.55,12),mm,g,0,2.03,0);box(g,M.white,.4,.13,1.12,.72,.07,1.7);box(g,mm,.4,.172,1.12,.63,.02,1.5);}
umbrella(-10,39,'#e5a56c');umbrella(-14,38.7,'#83b8aa');umbrella(39,-25,'#e5a56c');
const boats=[];function boat(x,z,s=1){const g=new T.Group();scene.add(g);g.position.set(x,0,z);g.scale.setScalar(s);ball(g,M.white,0,.18,0,1.65,.27,.58,16);rod(g,M.bark,[0,.4,0],[0,4,0],.04);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-.08,.6,0,-.08,3.8,0,-1.6,.6,0,.08,.65,.01,.08,3.6,.01,1.25,.65,.01],3));geo.computeVertexNormals();const sailMat=M.cream.clone();sailMat.side=T.DoubleSide;mesh(geo,sailMat,g);g.rotation.y=-.3;boats.push({g,x,z});}
boat(-21,79,1.4);boat(59,61,.95);boat(-71,-48,1.2);
for(let i=0;i<7;i++){const t=i/7*TAU+.3;const x=Math.sin(t)*160,z=Math.cos(t)*140;ball(environment,mat(i%2?'#91b6aa':'#9dbfb3'),x,-.9,z,10+rand()*12,3+rand()*8,7+rand()*11,9);}
const cloudMaterial=new T.MeshBasicMaterial({color:'#f6faf0',fog:true});
for(let i=0;i<15;i++){const t=i/15*TAU;const x=Math.sin(t)*140,z=Math.cos(t)*140,y=27+rand()*16;for(let j=0;j<4;j++)ball(environment,cloudMaterial,x+j*3.1,y+Math.sin(j)*1.2,z,4+rand()*1.4,1.2+rand()*1.6,2,12);}
// Close seagulls have actual wing motion.
const gulls=[];for(let i=0;i<6;i++){const g=new T.Group();scene.add(g);ball(g,M.white,0,0,0,.21,.13,.4,10);const wings=[];for(const s of [-1,1]){const pivot=new T.Group();g.add(pivot);const w=ball(pivot,M.white,s*.44,0,0,.54,.045,.21,10);w.rotation.y=s*.22;wings.push(pivot);}gulls.push({g,wings,phase:rand()*TAU,r:63+rand()*15});}
// Scooter: a step-through electric moped, independent rotating wheels and steering assembly.
const ride=new T.Group(),chassis=new T.Group();scene.add(ride);ride.add(chassis);
const wheelRadius=.455,wheelbase=2.25;
function wheel(parent,x){const pivot=new T.Group();parent.add(pivot);pivot.position.set(x,wheelRadius,0);mesh(new T.TorusGeometry(.354,.101,12,36),M.rubber,pivot);mesh(new T.CylinderGeometry(.292,.292,.16,32),M.rim,pivot).rotation.x=Math.PI/2;mesh(new T.CylinderGeometry(.19,.19,.18,24),M.mintDark,pivot).rotation.x=Math.PI/2;mesh(new T.CylinderGeometry(.074,.074,.24,20),M.chrome,pivot).rotation.x=Math.PI/2;for(let i=0;i<6;i++){const a=i/6*TAU;for(const s of [-1,1])rod(pivot,M.white,[Math.sin(a)*.09,Math.cos(a)*.09,s*.095],[Math.sin(a)*.26,Math.cos(a)*.26,s*.095],.023);}return pivot;}
const rearWheel=wheel(chassis,-1.13),steer=new T.Group();chassis.add(steer);steer.position.x=1.12;const frontWheel=wheel(steer,0);
function fender(parent,x,material){const o=mesh(new T.TorusGeometry(.51,.075,8,32,Math.PI),material,parent,x,.455,0);o.scale.z=2.1;return o;}
fender(chassis,-1.13,M.mint);fender(steer,0,M.mint);
box(chassis,M.mint,-.89,.96,0,1.35,.7,.67,.16);box(chassis,M.mintDark,-.65,.63,0,.7,.19,.6,.07);
box(chassis,M.mint,.15,.64,0,1.49,.15,.78,.06);box(chassis,M.rubber,.14,.735,0,1.04,.04,.66,.014);
for(let i=0;i<5;i++)box(chassis,M.mintDark,.05+i*.11,.759,0,.025,.005,.55);
const shield=box(chassis,M.mint,.92,1.15,0,.27,1.0,.84,.11);shield.rotation.z=-.19;
box(chassis,M.white,1.075,1.23,0,.038,.62,.31,.015).rotation.z=-.19;
box(chassis,M.seat,-.73,1.4,0,1.2,.21,.8,.10);box(chassis,M.cream,-.73,1.32,0,1.14,.06,.78,.025);
rod(steer,M.chrome,[0,.47,-.18],[-.26,1.86,-.18],.055);rod(steer,M.chrome,[0,.47,.18],[-.26,1.86,.18],.055);
rod(steer,M.mint,[-.27,1.76,0],[-.27,2.0,0],.11);
rod(steer,M.chrome,[-.32,1.98,-.63],[-.32,1.98,.63],.048);
for(const s of [-1,1]){rod(steer,M.rubber,[-.32,1.98,s*.4],[-.32,1.98,s*.65],.073);curve(steer,M.chrome,[[-.31,2.0,s*.37],[-.25,2.25,s*.48],[-.14,2.32,s*.58]],.024);const mir=ball(steer,M.mint,-.13,2.35,s*.61,.105,.12,.19);ball(steer,M.chrome,-.189,2.35,s*.61,.045,.097,.16);}
ball(steer,M.mint,-.17,1.89,0,.26,.22,.32);
const lampmat=new T.MeshStandardMaterial({color:'#fff1c5',emissive:'#ffe4a0',emissiveIntensity:.6,roughness:.3});
const lightRing=mesh(new T.TorusGeometry(.155,.028,10,28),M.chrome,steer,.063,1.9,0);lightRing.rotation.y=Math.PI/2;
ball(steer,lampmat,.08,1.9,0,.025,.145,.145);
for(const s of [-1,1])ball(steer,M.coral,.005,1.8,s*.34,.065,.055,.058);
box(chassis,M.coral,-1.58,1.03,0,.045,.15,.28,.014);
box(chassis,M.white,-1.59,.75,0,.028,.15,.33,.01);
for(const s of [-1,1]){box(chassis,M.cream,-.95,.97,s*.349,.39,.035,.014);box(chassis,M.cream,-.95,.88,s*.349,.29,.025,.014);}
// A small travel case on the rear rack.
rod(chassis,M.chrome,[-1.15,1.18,-.3],[-1.69,1.18,-.3],.028);rod(chassis,M.chrome,[-1.15,1.18,.3],[-1.69,1.18,.3],.028);
box(chassis,M.coral,-1.48,1.51,0,.39,.5,.66,.065);for(const s of [-1,1])box(chassis,M.cream,-1.48,1.515,s*.22,.402,.51,.041,.007);
curve(chassis,M.seat,[[-1.56,1.76,-.13],[-1.56,1.85,-.13],[-1.56,1.85,.13],[-1.56,1.76,.13]],.027);
// Cat rider. Hands stay at the grips, feet stay on the scooter floor.
const torso=new T.Group();chassis.add(torso);torso.position.set(-.53,1.73,0);
ball(torso,M.orange,0,.36,0,.46,.63,.39);ball(torso,M.cream,.34,.37,0,.14,.44,.30);
const head=new T.Group();torso.add(head);head.position.set(.11,1.19,0);
ball(head,M.orange,0,0,0,.59,.56,.54,28);
// Triangular ears have separate pink inserts.
function ear(z){const shape=new T.Shape();shape.moveTo(-.23,-.04);shape.lineTo(.19,-.04);shape.lineTo(.05,.48);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:.14,bevelEnabled:true,bevelSize:.05,bevelThickness:.04,bevelSegments:2,steps:1});const e=mesh(geo,M.orange,head,-.035,.37,z);e.rotation.y=Math.PI/2;e.rotation.x=z>0?.14:-.14;const inner=mesh(new T.ConeGeometry(.115,.28,3),M.pink,head,.07,.60,z+.02);inner.rotation.y=Math.PI/2;inner.scale.z=.30;}
ear(-.37);ear(.37);
const snout1=ball(head,M.cream,.477,-.14,-.145,.19,.19,.21),snout2=ball(head,M.cream,.477,-.14,.145,.19,.19,.21);
ball(head,M.pink,.648,-.09,0,.065,.055,.07);
curve(head,M.dark,[[.659,-.15,0],[.646,-.22,0],[.62,-.245,.08]],.011);curve(head,M.dark,[[.646,-.22,0],[.62,-.245,-.08]],.011);
const eyes=[];for(const s of [-1,1]){const eye=ball(head,M.dark,.492,.105,s*.29,.052,.103,.062);eye.rotation.y=s*.32;eyes.push(eye);ball(head,M.white,.536,.14,s*.30,.017,.027,.018);ball(head,M.pink,.448,-.10,s*.395,.034,.075,.09);for(let j=0;j<3;j++)rod(head,M.seat,[.55,-.12-j*.06,s*.28],[.53,-.12+(j-1)*.13,s*(.78+j*.025)],.009, .005,6);}
// Tabby markings on the forehead and cheeks.
for(const z of [-.19,0,.19]){const s=ball(head,M.stripe,.32,.39,z,.17,.055,.043,12);s.rotation.z=.6;}
for(const s of [-1,1])for(let j=0;j<2;j++){const o=ball(head,M.stripe,-.12+j*.20,.08-j*.12,s*.508,.10,.044,.022,12);o.rotation.z=-.55;}
const helmet=mesh(new T.SphereGeometry(.588,28,16,0,TAU,0,Math.PI*.47),M.helmet,head,-.07,.18,0);helmet.scale.set(1, .87,.93);
const band=mesh(new T.TorusGeometry(.577,.033,8,40),M.mintDark,head,-.07,.225,0);band.rotation.x=Math.PI/2;band.scale.y=.93;
box(head,M.mint,-.06,.690,0,.60,.025,.11,.014);
for(const s of [-1,1])curve(head,M.seat,[[-.12,.25,s*.49],[.07,-.42,s*.46],[.24,-.47,s*.30]],.023);
ball(head,M.chrome,.20,-.42,-.40,.048,.045,.016);
const collar=mesh(new T.TorusGeometry(.26,.093,10,24),M.scarf,torso,.02,.87,0);collar.rotation.x=Math.PI/2;collar.scale.x=1.1;
const arms=[],legs=[];for(const s of [-1,1]){const upper=rod(chassis,M.orange,[-.5,2.45,s*.31],[.07,2.12,s*.44],.14),lower=rod(chassis,M.orange,[.07,2.12,s*.44],[.77,1.99,s*.51],.115);const paw=ball(chassis,M.cream,.78,2.01,s*.52,.155,.12,.125);arms.push({s,upper,lower,paw});ball(chassis,M.orange,-.60,1.77,s*.36,.30,.31,.26);rod(chassis,M.orange,[-.55,1.72,s*.38],[-.08,1.16,s*.47],.20,.23);rod(chassis,M.orange,[-.08,1.16,s*.47],[.12,.81,s*.44],.135,.16);const foot=ball(chassis,M.cream,.27,.81,s*.44,.25,.12,.16);legs.push(foot);}
const tailSegments=[];for(let i=0;i<14;i++){const o=rod(chassis,i>11?M.cream:(i%3===0?M.stripe:M.orange),[0,0,0],[0,.15,0],.105-i*.003);tailSegments.push(o);}
const scarfGeo=new T.BufferGeometry(),scarfPos=new Float32Array(17*2*3),scarfIdx=[];for(let i=0;i<16;i++){const a=i*2;scarfIdx.push(a,a+1,a+2,a+1,a+3,a+2);}scarfGeo.setAttribute('position',new T.BufferAttribute(scarfPos,3));scarfGeo.setIndex(scarfIdx);const scarfMat=M.scarf.clone();scarfMat.side=T.DoubleSide;const scarf=mesh(scarfGeo,scarfMat,torso);
// A subtle contact shadow below the wheels remains readable on the asphalt.
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=64;const sc=shadowCanvas.getContext('2d');const grad=sc.createRadialGradient(64,32,2,64,32,32);grad.addColorStop(0,'rgba(30,49,43,.27)');grad.addColorStop(1,'rgba(30,49,43,0)');sc.fillStyle=grad;sc.fillRect(0,0,128,64);const shadowTexture=new T.CanvasTexture(shadowCanvas);const contact=mesh(new T.PlaneGeometry(4.2,1.55),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}),ride,0,.018,0);contact.rotation.x=-Math.PI/2;contact.castShadow=false;
// Merge static geometry by material to keep the animated scene light.
function mergeStatic(root){root.updateMatrixWorld(true);const bins=new Map();root.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(Array.isArray(m))return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);let b=bins.get(m);if(!b)bins.set(m,b={p:[],n:[]});b.p.push(g.attributes.position.array);b.n.push(g.attributes.normal.array);g.dispose();});const merged=new T.Group();for(const [m,b] of bins){const join=arrays=>{const out=new Float32Array(arrays.reduce((s,a)=>s+a.length,0));let off=0;for(const a of arrays){out.set(a,off);off+=a.length;}return out;};const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(join(b.p),3));g.setAttribute('normal',new T.BufferAttribute(join(b.n),3));g.computeBoundingSphere();mesh(g,m,merged);}scene.remove(root);root.traverse(o=>{if(o.isMesh)o.geometry.dispose();});scene.add(merged);}
mergeStatic(environment);
const pathPts=[];for(let i=0;i<256;i++){const t=i/256*TAU;pathPts.push(new T.Vector3((RX+1.48)*Math.sin(t),ROAD+.015,(RZ+1.48)*Math.cos(t)));}
const path=new T.CatmullRomCurve3(pathPts,true,'centripetal');path.arcLengthDivisions=4096;const pathLength=path.getLength();
const state={time:0,distance:0,speed:1,paused:matchMedia('(prefers-reduced-motion: reduce)').matches,camera:0,sunset:false,heading:0,steering:0};
const baseSpeed=6.6667,startOffset=pathLength*.028;
const camNames=['伴骑视角','迎风视角','海岸全景'];let orbitYaw=0,orbitPitch=0,zoom=1,lastFrame=performance.now(),needsSnap=true,uiAccumulator=0;
const target=new T.Vector3(),camWant=new T.Vector3(),localCamera=new T.Vector3(),lookWant=new T.Vector3(),smoothLook=new T.Vector3();
function setRod(o,a,b){const av=new T.Vector3(...a),bv=new T.Vector3(...b),length=av.distanceTo(bv);o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());o.scale.y=length/o.geometry.parameters.height;}
function updatePose(){const u=((state.distance+startOffset)%pathLength)/pathLength,p=path.getPointAt(u),tan=path.getTangentAt(u);ride.position.copy(p);state.heading=Math.atan2(-tan.z,tan.x);ride.rotation.y=state.heading;
const ahead=path.getTangentAt((u+.001)%1);const curvature=Math.atan2(tan.x*ahead.z-tan.z*ahead.x,tan.dot(ahead))/(pathLength*.001);state.steering=Math.atan(wheelbase*curvature);steer.rotation.y=-state.steering;
rearWheel.rotation.z=-state.distance/wheelRadius;frontWheel.rotation.z=-frontDistance/wheelRadius;
chassis.rotation.x=-Math.min(.07,baseSpeed*baseSpeed*state.speed*state.speed*Math.abs(curvature)/9.81)*Math.sign(curvature);
const t=state.time,bob=Math.sin(t*5.0)*.018;torso.position.y=1.73+bob;head.rotation.y=.045*Math.sin(t*.7);head.rotation.z=.025*Math.sin(t*1.2);
const blink=Math.pow(Math.max(0,Math.sin(t*1.07+1.9)),32);for(const eye of eyes)eye.scale.y=.103*(1-blink*.91);
for(const arm of arms){const s=arm.s;const shoulder=[-.50,2.45+bob,s*.31],elbow=[.04,2.14+bob*.5,s*.47];const hand=new T.Vector3(-.32,2.01,s*.52).applyAxisAngle(new T.Vector3(0,1,0),steer.rotation.y).add(new T.Vector3(1.12,0,0));setRod(arm.upper,shoulder,elbow);setRod(arm.lower,elbow,hand.toArray());arm.paw.position.copy(hand);}
const tailPoints=[];for(let i=0;i<=14;i++){const u=i/14;tailPoints.push([-.87-u*1.28,1.81+Math.sin(u*Math.PI*.9)*.65,.12+Math.sin(u*3.5+t*1.65)*u*.21]);}for(let i=0;i<14;i++)setRod(tailSegments[i],tailPoints[i],tailPoints[i+1]);
for(let i=0;i<=16;i++){const u=i/16;for(let s=0;s<2;s++){const k=(i*2+s)*3;scarfPos[k]=-.13-u*1.40;scarfPos[k+1]=.87+.09*Math.sin(u*7-t*4)*u+.04*u;scarfPos[k+2]=-.15+Math.sin(u*5-t*3)*.11*u+(s-.5)*(.24-.06*u);}}scarfGeo.attributes.position.needsUpdate=true;scarfGeo.computeVertexNormals();scarfGeo.computeBoundingSphere();
seaUniforms.uTime.value=t;surf.forEach((o,i)=>{const phase=(t*.15+i/3)%1;o.scale.setScalar(1+phase*.022);o.material.opacity=Math.sin(phase*Math.PI)*.38;});
boats.forEach((b,i)=>{b.g.position.y=Math.sin(t*.9+i)*.09;b.g.rotation.z=Math.sin(t*.7+i)*.04;});
gulls.forEach((b,i)=>{const a=t*.045+b.phase;b.g.position.set(Math.sin(a)*b.r,8+Math.sin(t*.4+i)*1.3+i*.5,Math.cos(a)*(b.r*.75));b.g.rotation.y=a+Math.PI/2;b.wings[0].rotation.z=Math.sin(t*3.6+i)*.28;b.wings[1].rotation.z=-Math.sin(t*3.6+i)*.28;});
sun.position.copy(p).add(new T.Vector3(-17,28,15));sun.target.position.copy(p);
}
let frontDistance=0;
function updateCamera(dt){target.copy(ride.position).add(new T.Vector3(0,1.6,0));const aspect=camera.aspect,portrait=aspect<.8;
if(state.camera===2){camWant.set(96*zoom,84*zoom,103*zoom);camWant.applyAxisAngle(new T.Vector3(0,1,0),orbitYaw);lookWant.set(0,0,0);}
else{const angle=(state.camera===0?-1.07:.53)+orbitYaw;const radius=(state.camera===0?10.2:9.5)*zoom*(portrait?1.33:1);const height=(state.camera===0?3.35:2.6)+orbitPitch*5;localCamera.set(Math.cos(angle)*radius,Math.max(.65,height*zoom),Math.sin(angle)*radius);localCamera.applyAxisAngle(new T.Vector3(0,1,0),ride.rotation.y);camWant.copy(target).add(localCamera);lookWant.copy(target).add(new T.Vector3(.0,.28,0));}
const blend=needsSnap?1:1-Math.exp(-dt*6);camera.position.lerp(camWant,blend);smoothLook.lerp(lookWant,blend);camera.lookAt(smoothLook);needsSnap=false;
}
function updateUi(){const speed=state.paused?0:24*state.speed;$('speedRead').textContent=Math.round(speed);$('tripRead').textContent=(state.distance/1000).toFixed(2);Object.assign($('scene').dataset,{distance:state.distance.toFixed(6),time:state.time.toFixed(6),rearRotation:rearWheel.rotation.z.toFixed(6),frontRotation:frontWheel.rotation.z.toFixed(6),frontDistance:frontDistance.toFixed(6),paused:String(state.paused),speed:String(state.speed),camera:String(state.camera),sunset:String(state.sunset),calls:String(renderer.info.render.calls)});}
function pauseUI(){$('pause').innerHTML=state.paused?'<span class="icon">▶</span>继续':'<span class="icon">Ⅱ</span>暂停';$('pause').setAttribute('aria-label',state.paused?'继续动画':'暂停动画');updateUi();}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),1900);}
function togglePause(){state.paused=!state.paused;pauseUI();}
function changeCamera(){state.camera=(state.camera+1)%3;orbitYaw=orbitPitch=0;zoom=1;needsSnap=true;$('camera').textContent=camNames[state.camera];toast(camNames[state.camera]);}
function changeLight(){state.sunset=!state.sunset;const warm=state.sunset;scene.background.set(warm?'#ecc6b0':'#b9e2e8');scene.fog.color.copy(scene.background);seaUniforms.uSky.value.copy(scene.background);seaUniforms.uWarm.value=warm?1:0;sun.color.set(warm?'#ffc494':'#fff0d2');sun.intensity=warm?2.9:3.35;hemi.color.set(warm?'#eed4ce':'#e5fbff');hemi.intensity=warm?2.0:2.5;$('weatherText').textContent=warm?'日落 · 让风慢一点':'晴 · 海风刚好';$('light').textContent=warm?'切换晴天':'切换日落';$('light').setAttribute('aria-pressed',String(warm));}
$('pause').addEventListener('click',togglePause);$('camera').addEventListener('click',changeCamera);$('light').addEventListener('click',changeLight);
$('speed').addEventListener('input',e=>{state.speed=Number(e.target.value);$('speedOut').value=state.speed.toFixed(1)+'×';updateUi();});
$('reset').addEventListener('click',()=>{state.time=0;state.distance=frontDistance=0;state.speed=1;state.camera=0;state.paused=matchMedia('(prefers-reduced-motion: reduce)').matches;orbitYaw=orbitPitch=0;zoom=1;needsSnap=true;$('speed').value='1';$('speedOut').value='1.0×';$('camera').textContent=camNames[0];if(state.sunset)changeLight();updatePose();pauseUI();toast('从海岸起点重新出发');});
document.addEventListener('keydown',e=>{if(['INPUT','BUTTON'].includes(document.activeElement.tagName))return;if(e.code==='Space'){e.preventDefault();togglePause();}if(e.code==='KeyC')changeCamera();});
const pointers=new Map();let pinchDistance=0;
$('scene').addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});$('scene').setPointerCapture(e.pointerId);if(pointers.size===2){const a=[...pointers.values()];pinchDistance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);}});
$('scene').addEventListener('pointermove',e=>{const old=pointers.get(e.pointerId);if(!old)return;const dx=e.clientX-old.x,dy=e.clientY-old.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(d>0&&pinchDistance>0)zoom=T.MathUtils.clamp(zoom*pinchDistance/d,.62,2.2);pinchDistance=d;}else{orbitYaw-=dx*.007;orbitPitch=T.MathUtils.clamp(orbitPitch+dy*.005,-.37,1.2);}});
function release(e){pointers.delete(e.pointerId);pinchDistance=0;}for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('scene').addEventListener(ev,release);
$('scene').addEventListener('wheel',e=>{e.preventDefault();zoom=T.MathUtils.clamp(zoom*Math.exp(e.deltaY*.001),.62,2.2);},{passive:false});
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);needsSnap=true;}addEventListener('resize',resize);resize();
document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();});
let contextLost=false;$('scene').addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;$('errorText').textContent='图形渲染已暂时中断，请点击重新加载恢复场景。';$('error').hidden=false;});
pauseUI();updatePose();updateCamera(0);renderer.render(scene,camera);$('loading').hidden=true;
function animate(now){requestAnimationFrame(animate);const dt=Math.min(Math.max((now-lastFrame)/1000,0),.05);lastFrame=now;if(document.hidden||contextLost)return;
if(!state.paused){state.time+=dt;const ds=baseSpeed*state.speed*dt;state.distance+=ds;frontDistance+=ds/Math.cos(state.steering);updatePose();}updateCamera(dt);renderer.render(scene,camera);uiAccumulator+=dt;if(uiAccumulator>.12){uiAccumulator=0;updateUi();}}
requestAnimationFrame(animate);
window.__coastalCat={snapshot:()=>({ready:true,three:T.REVISION,time:state.time,distance:state.distance,frontDistance,paused:state.paused,speed:state.speed,camera:state.camera,sunset:state.sunset,wheelRadius,rearWheel:rearWheel.rotation.z,frontWheel:frontWheel.rotation.z,steering:state.steering,position:ride.position.toArray(),heading:ride.rotation.y,renderCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,canvas:[renderer.domElement.width,renderer.domElement.height]}),setPaused:value=>{state.paused=!!value;pauseUI();},renderAt:(d,t=state.time)=>{state.distance=d;state.time=t;frontDistance=d;updatePose();needsSnap=true;updateCamera(0);renderer.render(scene,camera);updateUi();}};
})();
