import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

// Everything is generated here; the final HTML needs no network or model files.
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xb8e1ea);
scene.fog=new THREE.Fog(0xb8e1ea,55,165);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,450);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
document.querySelector('#scene').appendChild(renderer.domElement);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.querySelector('#error').style.display='block';});
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.065;controls.enablePan=false;
controls.minDistance=4.7;controls.maxDistance=23;
controls.minPolarAngle=.28;controls.maxPolarAngle=Math.PI/2-.05;
const hemi=new THREE.HemisphereLight(0xd7f8ff,0x9d8662,2.8);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffefd3,3.8);sun.position.set(-15,26,-12);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-16;sun.shadow.camera.right=16;
sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;sun.shadow.camera.far=90;
sun.shadow.normalBias=.035;sun.shadow.bias=-.0001;sun.shadow.radius=3;scene.add(sun);
const fill=new THREE.DirectionalLight(0xa3ecf0,1.0);fill.position.set(10,7,5);scene.add(fill);

const palette={fur:0xec9b43,cream:0xffe4b5,stripe:0xb66b2f,pink:0xd17e7d,ink:0x203a42,mint:0x54bcb0,darkMint:0x287f7d,ivory:0xfff6de,coral:0xec795f};
const mats={};
function mat(color,roughness=.7,metalness=0){const key=color+'_'+roughness+'_'+metalness;return mats[key]??=(new THREE.MeshStandardMaterial({color,roughness,metalness}));}
function mesh(geo,color,parent=scene,x=0,y=0,z=0,rough=.7,metal=0){const m=new THREE.Mesh(geo,typeof color==='number'?mat(color,rough,metal):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const sphereGeo=new THREE.SphereGeometry(1,28,20);
const boxGeo=new THREE.BoxGeometry(1,1,1);
function ball(parent,color,x,y,z,sx,sy=sx,sz=sx){const m=mesh(sphereGeo,color,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
function box(parent,color,x,y,z,sx,sy,sz){const m=mesh(boxGeo,color,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
function rod(parent,a,b,r,color,r2=r){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);const d=end.clone().sub(start);const m=mesh(new THREE.CylinderGeometry(r2,r,d.length(),10),color,parent);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
function tube(parent,points,r,color,segments=32){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,r,8,false),color,parent);}
function group(parent=scene){const g=new THREE.Group();parent.add(g);return g;}
function triangle(parent,vertices,color){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();const material=mat(color).clone();material.side=THREE.DoubleSide;return mesh(geo,material,parent);}
let randomSeed=771;function random(){randomSeed=(randomSeed*16807)%2147483647;return(randomSeed-1)/2147483646;}

// A wide, gently shaded sky, with clouds modeled as soft volumes.
const sky=mesh(new THREE.SphereGeometry(380,32,20),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(0x68b7d9)},bottom:{value:new THREE.Color(0xe3f1de)}},vertexShader:'varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying vec3 vPos;void main(){float h=normalize(vPos).y;vec3 col=mix(bottom,top,smoothstep(-.04,.65,h));gl_FragColor=vec4(col,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'.replace(';#include',';\n#include')}));sky.castShadow=false;sky.receiveShadow=false;
const sunDisk=ball(scene,new THREE.MeshBasicMaterial({color:0xfff1bd}),-80,52,90,9);sunDisk.castShadow=false;
const cloudMaterial=mat(0xfffcf1);const clouds=[];
for(let i=0;i<10;i++){const c=group();c.position.set(-75+random()*120,17+random()*18,-90+random()*210);for(let j=0;j<5;j++){const b=ball(c,cloudMaterial,j*2.2,Math.sin(j)*.5,random()*1.7,3+random(),1.3+random()*.8,1.8);b.castShadow=false;}clouds.push(c);}

// Coastal water: animated swells, turquoise shallows, foam and sun glints.
const seaUniforms={time:{value:0}};
const sea=mesh(new THREE.PlaneGeometry(230,560,100,170),new THREE.ShaderMaterial({uniforms:seaUniforms,vertexShader:`uniform float time;varying vec3 vWorld;void main(){vec3 p=position;float swell=sin(p.x*.19+time*.9)*cos(p.y*.21+time*.7);p.z+=swell*.10;vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,fragmentShader:`uniform float time;varying vec3 vWorld;void main(){vec2 p=vWorld.xz;float shore=-9.2+.25*sin(p.y*.12);float d=shore-p.x;vec3 deep=vec3(.018,.38,.58);vec3 shallow=vec3(.12,.73,.71);vec3 col=mix(shallow,deep,smoothstep(0.,95.,d));float wave=sin(p.x*1.55+sin(p.y*.2+time*.35)*1.8+time*1.2);float wave2=sin(p.y*2.2+p.x*.38-time*.8);float glint=pow(max(0.,wave*wave2),18.);col+=glint*.28;float foam=smoothstep(.88,1.,sin(d*2.2-time*1.35+sin(p.y*.17)*.5))*(1.-smoothstep(0.,8.,d));col=mix(col,vec3(.89,.99,.9),foam*.8);float mist=smoothstep(55.,240.,length(p));col=mix(col,vec3(.64,.85,.88),mist*.67);gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`}),scene,-124,-.38,0);
sea.rotation.x=-Math.PI/2;sea.castShadow=false;sea.receiveShadow=false;
box(scene,0xe4cb91,-7,-.26,0,5.5,.25,500);
box(scene,0x738583,0.8,-.18,0,8,.34,500);
box(scene,0xcbbda2,-3.65,-.07,0,1.1,.25,500);
box(scene,0xdbd0ac,5.3,-.05,0,1.1,.28,500);
box(scene,0x8daf68,30,-.21,0,48,.35,500);
for(const x of[-2.95,4.55])box(scene,0xf9edd1,x,.008,0,.1,.012,500);
// Seaside low rail preserves the open ocean view.
for(const y of[.55,.95])box(scene,0xf1edd7,-4.12,y,0,.095,.11,500);

function palm(parent,x,z,scale=1){const g=group(parent);g.position.set(x,0,z);g.scale.setScalar(scale);
const height=4.7;rod(g,[0,0,0],[.15,2.3,.04],.19,0xa68a59,.145);rod(g,[.15,2.3,.04],[.5,height,0],.145,0xaa8b5a,.085);
for(let k=1;k<8;k++){const ring=mesh(new THREE.TorusGeometry(.14-k*.006,.024,5,9),0x8e7852,g,.12+k*.049,k*.58,0);ring.rotation.x=Math.PI/2;}
for(let j=0;j<8;j++){const a=j*Math.PI/4;const leaf=group(g);leaf.position.set(.5,height,0);leaf.rotation.y=a;
const pts=[0,0,0,.55,.3,.18,1.15,.26,.24,1.95,-.12,.12,2.55,-.9,0,1.8,-.18,-.24,1.08,.2,-.32,.5,.28,-.2];
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));geo.setIndex([0,1,7,1,2,7,2,6,7,2,3,6,3,5,6,3,4,5]);geo.computeVertexNormals();const m=mat(j%2?0x388e66:0x51a66b).clone();m.side=THREE.DoubleSide;mesh(geo,m,leaf);}
ball(g,0x777547,.52,height-.08,.14,.19);ball(g,0x857b48,.28,height-.12,-.12,.18);return g;}
function lamp(parent,x,z){const g=group(parent);g.position.set(x,0,z);rod(g,[0,0,0],[0,5.1,0],.065,0x547b7c);tube(g,[[0,4.8,0],[0,5.35,0],[-.5,5.5,0],[-.85,5.4,0]],.065,0x547b7c,12);ball(g,0xe9e1b9,-.85,5.33,0,.29,.09,.18);return g;}
function beachUmbrella(parent,x,z,color){const g=group(parent);g.position.set(x,-.1,z);rod(g,[0,0,0],[0,1.9,0],.035,0xeae3c7);const geo=new THREE.ConeGeometry(1.08,.42,12,1,true);const roof=mesh(geo,color,g,0,1.8,0);roof.material=roof.material.clone();roof.material.side=THREE.DoubleSide;box(g,0xf8e3ba,.5,.04,.3,.7,.035,1.3);return g;}
const chunks=[];const segmentLength=22,segmentCount=8;
for(let i=0;i<segmentCount;i++){const g=group();g.position.z=(i-4)*segmentLength;
for(let j=0;j<4;j++){box(g,0xffefb9,.8,.014,j*5.5,.115,.015,2.4);box(g,0xf1ecd7,-4.12,.51,j*5.5,.14,1.03,.14);}
palm(g,6.8+random(),3,1+random()*.18);if(i%2===0)palm(g,8.8,15,.85);
lamp(g,5.5,13);
for(let j=0;j<3;j++){const bush=ball(g,j%2?0x6d9f5a:0x7eac62,7.5+random()*9,.3+random()*.3,random()*22,.7+random(),.7,1.0);}
if(i%2===0)beachUmbrella(g,-7.2,9,i%4?0xeb9273:0xf9e3b2);
for(let j=0;j<2;j++){const rock=mesh(new THREE.DodecahedronGeometry(.4+random()*.4,0),0xa4ad98,g,-7.7+random(),-.07,random()*22);rock.scale.set(1,.7,1.3);rock.rotation.y=random()*3;}
chunks.push(g);}
// Distant green headlands and a lighthouse anchor the horizon.
for(let i=0;i<7;i++){const h=mesh(new THREE.SphereGeometry(1,16,9),0x7ea79d,scene,-30-i*9,-1,94+i*6);h.scale.set(12+i*2,3+random()*6,15);h.castShadow=false;}
const lighthouse=group();lighthouse.position.set(-41,.1,91);
mesh(new THREE.CylinderGeometry(.9,1.5,9,14),0xfff3d7,lighthouse,0,4.5,0);
mesh(new THREE.CylinderGeometry(1.05,1.13,1,14),0xeb8269,lighthouse,0,6.4,0);
mesh(new THREE.CylinderGeometry(1.4,1.4,.25,14),0x486c73,lighthouse,0,9.05,0);
mesh(new THREE.CylinderGeometry(.84,.84,1.2,10),0xc1dee1,lighthouse,0,9.7,0);
mesh(new THREE.ConeGeometry(1.3,.7,12),0xe18665,lighthouse,0,10.65,0);
for(let i=0;i<3;i++)ball(lighthouse,0x486c73,0,2.3+i*2,-1.22,.18,.28,.08);

const boat=group();boat.position.set(-28,-.1,25);
ball(boat,0xfff2d5,0,0,0,1.8,.26,.62);rod(boat,[0,.1,0],[0,3.7,0],.045,0xd5c598);triangle(boat,[0,3.6,0,0,.6,0,-1.8,.6,0],0xfff3d7);triangle(boat,[.1,3.1,0,.1,.6,0,1.3,.6,0],0xec8b75);

// Scooter modeled around the wheelbase, facing negative Z.
const vehicle=group();const wheels=[];
for(const z of[-1.02,.99]){const wheel=group(vehicle);wheel.position.set(0,.43,z);
const tire=mesh(new THREE.CylinderGeometry(.395,.395,.24,32),0x293b43,wheel);tire.rotation.z=Math.PI/2;
for(const x of[-.132,.132]){const rim=mesh(new THREE.CylinderGeometry(.255,.255,.025,24),mat(0xe0e8df,.35,.35),wheel,x,0,0);rim.rotation.z=Math.PI/2;
const hub=mesh(new THREE.CylinderGeometry(.11,.11,.035,20),palette.darkMint,wheel,x*1.13,0,0);hub.rotation.z=Math.PI/2;
for(let k=0;k<5;k++){const a=k*Math.PI*.4;rod(wheel,[x,.085*Math.cos(a),.085*Math.sin(a)],[x,.22*Math.cos(a),.22*Math.sin(a)],.023,0x7a9997);}}
wheels.push(wheel);}
ball(vehicle,palette.mint,0,.72,.85,.43,.43,.57);
ball(vehicle,palette.mint,0,.71,-1.01,.34,.18,.52);
box(vehicle,palette.darkMint,0,.46,-.05,.73,.13,1.45);
box(vehicle,0x405a5d,0,.537,-.08,.61,.018,.94);
for(let x=-.25;x<=.26;x+=.1)box(vehicle,0x849a91,x,.55,-.08,.021,.008,.8);
ball(vehicle,palette.mint,0,1.09,-.83,.43,.71,.235);
ball(vehicle,palette.ivory,0,1.18,-1.017,.27,.4,.045);
ball(vehicle,palette.darkMint,0,1.56,-.82,.18,.34,.16);
const seat=ball(vehicle,0x344b4c,0,1.14,.58,.45,.12,.65);
ball(vehicle,0x76584b,0,1.18,.58,.42,.06,.61);
rod(vehicle,[0,.5,-1.02],[0,1.75,-.77],.065,0xc5d6cb);
rod(vehicle,[-.57,1.79,-.79],[.57,1.79,-.79],.056,palette.darkMint);
for(const x of[-.53,.53]){const grip=mesh(new THREE.CylinderGeometry(.069,.069,.22,14),0x314648,vehicle,x,1.79,-.79);grip.rotation.z=Math.PI/2;
tube(vehicle,[[x,1.79,-.83],[x*1.27,1.98,-.89],[x*1.3,2.12,-.89]],.018,0xa1b9b5,8);
ball(vehicle,0x354e51,x*1.3,2.13,-.89,.13,.094,.035);ball(vehicle,0xcae6df,x*1.3,2.13,-.85,.11,.075,.013);}
ball(vehicle,palette.mint,0,1.79,-.91,.27,.2,.18);
const light=mesh(new THREE.CylinderGeometry(.158,.158,.08,32),mat(0xffedb9,.18),vehicle,0,1.79,-1.087);light.rotation.x=Math.PI/2;
const lampRim=mesh(new THREE.TorusGeometry(.17,.027,10,28),mat(0xd8e1cf,.25,.6),vehicle,0,1.79,-1.12);
for(const x of[-.29,.29])ball(vehicle,0xfbb262,x,1.33,-1.037,.073,.055,.052);
ball(vehicle,0xdc6758,0,.87,1.36,.22,.095,.04);
box(vehicle,palette.ivory,0,.63,1.385,.25,.16,.025);
rod(vehicle,[-.33,1.02,.97],[-.33,1.14,1.32],.027,0xb0c6b8);rod(vehicle,[.33,1.02,.97],[.33,1.14,1.32],.027,0xb0c6b8);rod(vehicle,[-.33,1.14,1.32],[.33,1.14,1.32],.027,0xb0c6b8);
// Round electric badge, with a tiny lightning mark.
ball(vehicle,palette.ivory,.422,.81,.71,.013,.14,.14);
tube(vehicle,[[.44,.9,.73],[.44,.82,.66],[.44,.82,.76],[.44,.72,.69]],.012,palette.darkMint,4);

// The rider: orange tabby, cream helmet, paws on the grips, feet on the deck.
const cat=group(vehicle);
ball(cat,palette.fur,0,1.62,.43,.38,.51,.34);
ball(cat,palette.cream,0,1.62,.12,.26,.36,.065);
for(const x of[-.3,.3]){
ball(cat,palette.fur,x,1.32,.33,.22,.27,.28);
tube(cat,[[x,1.35,.28],[x*1.18,1.0,.06],[x*1.3,.71,-.23]],.125,palette.fur,16);
ball(cat,palette.cream,x*1.3,.666,-.25,.145,.11,.23);
tube(cat,[[x*.8,1.91,.32],[x*1.35,1.75,-.18],[x*1.63,1.81,-.73]],.105,palette.fur,20);
ball(cat,palette.cream,x*1.63,1.8,-.78,.125,.1,.13);
}
const head=group(cat);head.position.set(0,2.3,.28);
ball(head,palette.fur,0,0,0,.51,.46,.45);
ball(head,palette.cream,-.145,-.155,-.37,.208,.16,.11);
ball(head,palette.cream,.145,-.155,-.37,.208,.16,.11);
// Ears remain clearly visible above the helmet.
for(const x of[-.35,.35]){const ear=mesh(new THREE.ConeGeometry(.205,.48,3),palette.fur,head,x,.415,.005);ear.rotation.y=x<0?.35:-.35;ear.rotation.z=x<0?.25:-.25;
triangle(head,[x-.115,.32,-.13,x+.11,.32,-.13,x+(x<0?-.035:.035),.65,-.03],palette.pink);
const eye=ball(head,palette.ink,x*.63,.027,-.408,.06,.081,.025);
ball(head,palette.ivory,x*.63-.014,.052,-.429,.018,.023,.008);
ball(head,0xe7a080,x*.98,-.126,-.322,.071,.041,.018);
for(let i=0;i<3;i++){rod(head,[x*.65,-.13-i*.045,-.446],[x*1.68,-.1-i*.076,-.42],.008,0x6c6555);}
}
ball(head,palette.pink,0,-.135,-.483,.057,.039,.022);
tube(head,[[0,-.156,-.486],[0,-.209,-.48],[-.055,-.23,-.459]],.009,0x795646,8);
tube(head,[[0,-.205,-.481],[.029,-.228,-.465],[.059,-.222,-.455]],.009,0x795646,8);
for(let i=-1;i<=1;i++){const stripe=ball(head,palette.stripe,i*.13,.225,-.35,.043,.13,.035);stripe.rotation.z=-i*.2;}
for(const x of[-.47,.47])for(let i=0;i<2;i++){const stripe=ball(head,palette.stripe,x,.0-i*.125,.0,.043,.048,.21);stripe.rotation.x=.15;}
const helmet=mesh(new THREE.SphereGeometry(.523,32,18,0,Math.PI*2,0,Math.PI/2),palette.ivory,head,0,.16,.018);helmet.scale.set(1,.8,1);
const helmetRim=mesh(new THREE.TorusGeometry(.522,.032,8,48),palette.darkMint,head,0,.158,.018);helmetRim.rotation.x=Math.PI/2;
// Helmet stripe runs over its crown.
tube(head,[[0,.21,-.5],[0,.47,-.35],[0,.575,.018],[0,.47,.36],[0,.2,.54]],.037,palette.mint,28);
for(const x of[-.44,.44])tube(head,[[x,.12,0],[x*.85,-.28,.04],[x*.45,-.39,-.05]],.025,palette.darkMint,12);
// Red neck scarf and a fluttering fabric tail.
const neck=mesh(new THREE.TorusGeometry(.24,.078,10,32),palette.coral,cat,0,2.01,.35);neck.rotation.x=Math.PI/2;
ball(cat,palette.coral,.19,2.02,.51,.12);
const scarfGeo=new THREE.PlaneGeometry(.22,1.15,3,18);const scarfPos=scarfGeo.attributes.position;
const scarf=new THREE.Mesh(scarfGeo,new THREE.MeshStandardMaterial({color:palette.coral,roughness:.9,side:THREE.DoubleSide}));cat.add(scarf);scarf.castShadow=true;
const tail=group(cat);tail.position.set(0,1.26,.64);
tube(tail,[[0,0,0],[.38,.02,.45],[.68,.21,.6],[.75,.58,.53],[.65,.75,.38]],.115,palette.fur,30);
ball(tail,palette.cream,.65,.75,.38,.119);
for(const [x,y,z]of[[.48,.07,.53],[.71,.31,.6],[.74,.52,.55]])ball(tail,palette.stripe,x,y,z,.116,.055,.112);
// A compact canvas satchel behind the rider.
ball(vehicle,0xd8b974,0,1.35,.94,.28,.24,.19);box(vehicle,0xe9cd91,0,1.45,.99,.49,.21,.16);box(vehicle,0x957453,0,1.4,1.085,.058,.24,.015);

const birds=[];
for(let i=0;i<7;i++){const b=group();b.position.set(-18-random()*24,7+random()*8,-20+random()*70);const left=group(b),right=group(b);tube(left,[[0,0,0],[-.42,.18,.01],[-.8,.03,.08]],.029,0xf7f6e2,10);tube(right,[[0,0,0],[.42,.18,.01],[.8,.03,.08]],.029,0xf7f6e2,10);ball(b,0xf6f6e9,0,0,0,.065,.06,.19);birds.push({b,left,right,phase:random()*6});}

let playing=!matchMedia('(prefers-reduced-motion: reduce)').matches;
let speed=24,elapsed=0,distance=0,last=performance.now(),cameraTransition=null,currentView='coast';
const presets={coast:{position:[7.5,3.8,-7.5],target:[0,1.4,0]},follow:{position:[4.6,3.0,6.9],target:[0,1.4,-1]},wide:{position:[14,10,-17],target:[-2,1,0]}};
function pose(name){const p=presets[name];const aspect=innerWidth/innerHeight;const factor=aspect<.8?1.23:1;return{position:new THREE.Vector3(...p.position).multiplyScalar(factor),target:new THREE.Vector3(...p.target)};}
function setView(name,instant=false){if(!presets[name])throw new Error('无效镜头');currentView=name;const p=pose(name);if(instant){camera.position.copy(p.position);controls.target.copy(p.target);controls.update();}else cameraTransition={from:camera.position.clone(),targetFrom:controls.target.clone(),to:p.position,targetTo:p.target,start:performance.now()};document.querySelectorAll('[data-view]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.view===name)));}
function setPlaying(value){playing=value;document.querySelector('#play').setAttribute('aria-label',playing?'暂停骑行':'继续骑行');document.querySelector('#play svg').innerHTML=playing?'<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>':'<path d="M7 3l14 9-14 9z"/>';document.querySelector('#pausedBadge').style.display=playing?'none':'block';}
function setSpeed(value){speed=value;document.querySelector('#speed').value=value;document.querySelector('#speedOutput').innerHTML='<strong>'+value+'</strong>km/h';}
document.querySelector('#play').addEventListener('click',()=>setPlaying(!playing));
document.querySelector('#speed').addEventListener('input',e=>setSpeed(Number(e.target.value)));
document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>setView(el.dataset.view)));
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!/INPUT|BUTTON|TEXTAREA/.test(e.target.tagName)){e.preventDefault();setPlaying(!playing);}});
controls.addEventListener('start',()=>{cameraTransition=null;document.querySelectorAll('[data-view]').forEach(el=>el.setAttribute('aria-pressed','false'));});
setView('coast',true);setPlaying(playing);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);setView(currentView,true);});
document.addEventListener('visibilitychange',()=>{last=performance.now();});
const state=()=>({playing,speed,camera:currentView,distanceKm:Number(distance.toFixed(3))});
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'set_coastal_ride',title:'调整海滨骑行',description:'控制小猫骑行动画的暂停、速度和镜头。',inputSchema:{type:'object',properties:{playing:{type:'boolean'},speed:{type:'integer',minimum:8,maximum:40},camera:{type:'string',enum:['coast','follow','wide']}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['playing','speed','camera'].includes(k)))throw new Error('参数无效');if(input.speed!==undefined&&(!Number.isInteger(input.speed)||input.speed<8||input.speed>40))throw new Error('速度必须为 8–40');if(input.playing!==undefined&&typeof input.playing!=='boolean')throw new Error('playing 必须为布尔值');if(input.camera!==undefined&&!presets[input.camera])throw new Error('镜头无效');if(input.playing!==undefined)setPlaying(input.playing);if(input.speed!==undefined)setSpeed(input.speed);if(input.camera!==undefined)setView(input.camera,true);return state();}})).catch(()=>{});}catch{}}
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;
if(playing&&!document.hidden){elapsed+=dt;distance+=speed*dt/3600;const travel=speed/3.6*dt;
for(const c of chunks){c.position.z+=travel;if(c.position.z>segmentCount*segmentLength/2)c.position.z-=segmentCount*segmentLength;}
for(const w of wheels)w.rotation.x-=travel/.395;
vehicle.position.y=Math.sin(elapsed*8)*.011;vehicle.rotation.z=Math.sin(elapsed*1.3)*.015;
head.rotation.y=Math.sin(elapsed*.65)*.10;head.rotation.z=Math.sin(elapsed*1.7)*.025;
tail.rotation.z=Math.sin(elapsed*2.1)*.14;
seaUniforms.time.value=elapsed;
boat.rotation.z=Math.sin(elapsed*1.1)*.06;boat.position.y=-.07+Math.sin(elapsed*.9)*.08;
for(const {b,left,right,phase}of birds){left.rotation.z=Math.sin(elapsed*3+phase)*.3;right.rotation.z=-Math.sin(elapsed*3+phase)*.3;b.position.z+=dt*.55;if(b.position.z>70)b.position.z=-50;}
for(const c of clouds){c.position.z+=dt*.06;if(c.position.z>130)c.position.z=-130;}
document.querySelector('#distance').textContent=distance.toFixed(2);
}
for(let i=0;i<scarfPos.count;i++){const row=Math.floor(i/4),col=i%4;const t=row/18;scarfPos.setXYZ(i,.15+(col/3-.5)*.22+Math.sin(t*9-elapsed*7)*.05*t,2.025+.13*Math.sin(t*5-elapsed*5)*t-.13*t,.55+t*.98);}scarfPos.needsUpdate=true;scarfGeo.computeVertexNormals();
if(cameraTransition){const t=Math.min((now-cameraTransition.start)/1050,1),ease=t*t*(3-2*t);camera.position.lerpVectors(cameraTransition.from,cameraTransition.to,ease);controls.target.lerpVectors(cameraTransition.targetFrom,cameraTransition.targetTo,ease);if(t===1)cameraTransition=null;}
controls.update();renderer.render(scene,camera);
}
renderer.compile(scene,camera);renderer.render(scene,camera);
document.querySelector('#loading').classList.add('done');
requestAnimationFrame(animate);
