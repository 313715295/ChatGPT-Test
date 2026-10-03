import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// All geometry, textures, sounds, and the Three.js runtime are embedded in the final HTML.
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2, V = (x,y,z) => new THREE.Vector3(x,y,z);
let seed = 47053;
const rand = () => ((seed = Math.imul(seed,1664525)+1013904223|0)>>>0)/4294967296;
const between = (a,b) => a+(b-a)*rand();
const scene = new THREE.Scene();
scene.background = new THREE.Color('#e9ecd9');
scene.fog = new THREE.Fog('#e9ecd9',30,88);
let renderer;
try { renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'}); }
catch(e) { $('loading').innerHTML='<b>这段旅程需要 WebGL 2</b><p>请用支持硬件加速的现代浏览器打开此文件。</p>'; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute('aria-label','水獭沿河骑行的可交互三维场景，拖动可旋转视角，滚轮可缩放');
renderer.domElement.tabIndex=0;
$('stage').appendChild(renderer.domElement);
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.1,180);
const initialCamera=V(6.5,5.5,11.0), initialTarget=V(-.12,2.2,0);
camera.position.copy(initialCamera);
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.copy(initialTarget); controls.enableDamping=true; controls.dampingFactor=.065;
controls.enablePan=false; controls.minDistance=6.4; controls.maxDistance=27;
controls.minPolarAngle=.25; controls.maxPolarAngle=Math.PI*.49;
controls.update();
const hemi=new THREE.HemisphereLight('#fff4d9','#718354',2.2);scene.add(hemi);
const sun=new THREE.DirectionalLight('#ffe4b9',3.1);sun.position.set(-3,11,7);
sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-17,right:17,top:16,bottom:-16,near:.5,far:38});
sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;sun.shadow.radius=3;scene.add(sun);
const rim=new THREE.DirectionalLight('#c4e8e2',1.25);rim.position.set(2,6,-7);scene.add(rim);
const pmrem=new THREE.PMREMGenerator(renderer), room=new RoomEnvironment();
const env=pmrem.fromScene(room,.025);scene.environment=env.texture;
room.dispose();pmrem.dispose();scene.environmentIntensity=.30;

const mats={};
function mat(name,color,roughness=.72,metalness=0){return mats[name]=new THREE.MeshStandardMaterial({color,roughness,metalness});}
const fur=mat('fur','#80512f'), furLight=mat('furLight','#a16c43'), cream=mat('cream','#efcf9f'),
  muzzleMat=mat('muzzle','#f7dfb8'), dark=mat('dark','#2d2720',.45), eye=mat('eye','#191d1b',.18),
  white=mat('white','#fff7e3'), pink=mat('pink','#cd987c'), teal=mat('teal','#398e85',.35,.24),
  tealLight=mat('tealLight','#7cb9a6',.4,.1), chrome=mat('chrome','#c5c8b5',.26,.72),
  tire=mat('tire','#303b37'), leather=mat('leather','#704a32'), coral=mat('coral','#d95442'),
  paper=mat('paper','#cba46a'), paperLight=mat('paperLight','#e5c38b'), twine=mat('twine','#f2dfac'),
  grass=mat('grass','#a4b977'),grassDark=mat('grassDark','#6e975e'),grassMid=mat('grassMid','#86a46b'),
  roadMat=mat('road','#dfc99d'), verge=mat('verge','#c4c796'), stone=mat('stone','#b9bba4'),
  bark=mat('bark','#807052'), leaf=mat('leaf','#739665'),leafLight=mat('leafLight','#a5b57c'),
  yellow=mat('yellow','#efbf62'), roofMat=mat('roof','#b56f51'), wallMat=mat('wall','#eadcc0'),
  reedMat=mat('reed','#577f61'), reedTip=mat('reedTip','#8a6742'), flowerPink=mat('flowerPink','#da8c86');

const geoSphere=new THREE.SphereGeometry(1,24,16), geoCylinder=new THREE.CylinderGeometry(1,1,1,12),
  geoBox=new THREE.BoxGeometry(1,1,1), geoRound=new RoundedBoxGeometry(1,1,1,3,.11);
function mesh(g,m,p,x=0,y=0,z=0,sx=1,sy=sx,sz=sx){
  const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);
  o.castShadow=true;o.receiveShadow=true;p.add(o);return o;
}
const ell=(p,m,x,y,z,sx,sy,sz)=>mesh(geoSphere,m,p,x,y,z,sx,sy,sz);
const box=(p,m,x,y,z,sx,sy,sz,round=false)=>mesh(round?geoRound:geoBox,m,p,x,y,z,sx,sy,sz);
function rod(p,m,a,b,r=.04,r2=r){
  const g=r===r2?geoCylinder:new THREE.CylinderGeometry(r2/r,1,1,12);
  const o=mesh(g,m,p);placeRod(o,a,b,r);return o;
}
const up=V(0,1,0), tmp=new THREE.Vector3();
function placeRod(o,a,b,r){tmp.subVectors(b,a);o.position.copy(a).addScaledVector(tmp,.5);o.scale.set(r,tmp.length(),r);o.quaternion.setFromUnitVectors(up,tmp.normalize());}
function tube(p,m,points,r=.035,segments=30){const c=new THREE.CatmullRomCurve3(points);return mesh(new THREE.TubeGeometry(c,segments,r,8,false),m,p);}
function ring(p,m,r,t,x,y,z){const o=mesh(new THREE.TorusGeometry(r,t,10,64),m,p,x,y,z);return o;}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const furGrain=canvasTex(256,256,(c,w,h)=>{c.fillStyle='#888';c.fillRect(0,0,w,h);for(let i=0;i<7000;i++){const tone=Math.floor(between(65,180));c.strokeStyle=`rgb(${tone},${tone},${tone})`;const x=rand()*w,y=rand()*h;c.beginPath();c.moveTo(x,y);c.lineTo(x+between(-.8,.8),y+between(1,4));c.stroke();}});
furGrain.colorSpace=THREE.NoColorSpace;furGrain.wrapS=furGrain.wrapT=THREE.RepeatWrapping;furGrain.repeat.set(4,3);
for(const m of [fur,furLight,cream,muzzleMat]){m.bumpMap=furGrain;m.bumpScale=.012;m.roughness=.88;}

// A warm sky with a soft, painted horizon.
const sky=new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
  uniforms:{top:{value:new THREE.Color('#a6c9c3')},bottom:{value:new THREE.Color('#f4eed5')}},
  vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying vec3 p;void main(){float h=smoothstep(-.04,.62,normalize(p).y);gl_FragColor=vec4(mix(bottom,top,h),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));
scene.add(sky);
// A very soft contact shadow, independent of hardware shadow filtering.
const contactTexture=canvasTex(128,128,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w*.49);g.addColorStop(0,'rgba(37,49,28,.3)');g.addColorStop(.4,'rgba(37,49,28,.17)');g.addColorStop(1,'rgba(37,49,28,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
const contact=mesh(new THREE.PlaneGeometry(5.7,2.4),new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false}),scene,0,.018,0);
contact.rotation.x=-Math.PI/2;contact.castShadow=false;
box(scene,grass,0,-.48,3.8,190,.85,18);
box(scene,roadMat,0,-.065,0,190,.12,4.4);
box(scene,verge,0,-.04,-2.4,190,.10,.4);
box(scene,grassMid,0,-.35,-17.9,190,.6,7.4);

// River: animated small waves, luminous streaks, and a gentle colour gradient.
const waterUniform={value:0};
const waterMat=new THREE.MeshStandardMaterial({color:'#5caea4',roughness:.33,metalness:.12});
waterMat.onBeforeCompile=s=>{s.uniforms.riverTime=waterUniform;
  s.vertexShader='uniform float riverTime;varying vec3 riverPosition;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.y += sin(position.x*.85+riverTime*.6)*cos(position.z*1.6+riverTime*.35)*.024; riverPosition=transformed;');
  s.fragmentShader='uniform float riverTime;varying vec3 riverPosition;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float r=sin(riverPosition.x*2.7+riverPosition.z*10.+riverTime*.9)*sin(riverPosition.x*.46-riverTime*.3);
    float shine=smoothstep(.94,.997,r);
    float band=.035*sin(riverPosition.z*1.8+riverPosition.x*.2+riverTime*.3);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.74,.88,.76),shine*.56)+band;`);
};
const waterGeo=new THREE.PlaneGeometry(190,11.8,180,24);waterGeo.rotateX(-Math.PI/2);
const water=mesh(waterGeo,waterMat,scene,0,-.12,-8.85);water.castShadow=false;
const sparkles=new THREE.InstancedMesh(geoBox,new THREE.MeshBasicMaterial({color:'#e0e8c9',transparent:true,opacity:.35}),200);
const dummy=new THREE.Object3D();
for(let i=0;i<200;i++){dummy.position.set(between(-75,95),-.078,between(-3.5,-14.4));dummy.scale.set(between(.15,.85),.008,.014);dummy.updateMatrix();sparkles.setMatrixAt(i,dummy.matrix);}scene.add(sparkles);

// The bicycle is built from actual frame tubes, spokes, drivetrain, rack and fenders.
const rider=new THREE.Group();scene.add(rider);
const bike=new THREE.Group();rider.add(bike);
const wheelRadius=.76, rearX=-1.34, frontX=1.34, wheelY=.80;
const wheels=[];
for(const x of [rearX,frontX]){
  const w=new THREE.Group();w.position.set(x,wheelY,0);bike.add(w);wheels.push(w);
  ring(w,tire,wheelRadius,.067,0,0,0);ring(w,paperLight,.714,.016,0,0,.036);ring(w,chrome,.682,.023,0,0,0);
  for(let i=0;i<28;i++){const a=i/28*TAU;rod(w,chrome,V(0,0,i%2?.043:-.043),V(Math.cos(a)*.675,Math.sin(a)*.675,0),.008);}
  const hub=rod(w,chrome,V(0,0,-.13),V(0,0,.13),.055);
  for(const a of [0,Math.PI]){const f=box(w,paperLight,Math.cos(a)*.53,Math.sin(a)*.53,.043,.11,.038,.017,true);f.rotation.z=a;}
}
const crankCenter=V(-.14,1.03,0), saddleTube=V(-.64,2.12,0), headTop=V(.97,2.13,0), headBottom=V(1.16,1.64,0);
for(const [a,b] of [[V(rearX,wheelY,0),saddleTube],[saddleTube,crankCenter],[crankCenter,V(rearX,wheelY,0)],[saddleTube,headTop],[crankCenter,headBottom],[headTop,headBottom]])rod(bike,teal,a,b,.052);
for(const side of [-1,1]){
  rod(bike,teal,V(rearX,wheelY,side*.115),V(-.64,2.12,side*.065),.032);
  rod(bike,teal,V(rearX,wheelY,side*.115),V(-.14,1.03,side*.09),.034);
  rod(bike,teal,V(frontX,wheelY,side*.11),V(1.05,1.97,side*.075),.043);
  const pts=[];for(let i=0;i<=24;i++){const a=.10+(Math.PI-.20)*i/24;pts.push(V(Math.cos(a)*.85,Math.sin(a)*.85,0));}
  if(side===1){for(const x of [rearX,frontX]){const f=tube(bike,tealLight,pts,.031,36);f.position.set(x,wheelY,0);}}
}
rod(bike,chrome,V(-.64,2.04,0),V(-.65,2.39,0),.044);
const saddle=box(bike,leather,-.65,2.4,0,.58,.14,.43,true);saddle.rotation.z=-.08;
rod(bike,chrome,headTop,V(.98,2.66,0),.041);
tube(bike,chrome,[V(.98,2.66,-.58),V(1.09,2.7,-.43),V(1.10,2.71,0),V(1.09,2.7,.43),V(.98,2.66,.58)],.028);
for(const z of [-.54,.54]){rod(bike,leather,V(.87,2.66,z),V(1.11,2.66,z),.044);rod(bike,chrome,V(.88,2.62,z),V(.79,2.58,z),.015);}
const bellGroup=new THREE.Group();bellGroup.position.set(1.04,2.73,.35);bike.add(bellGroup);
ell(bellGroup,chrome,0,0,0,.10,.066,.10);rod(bellGroup,leather,V(-.08,0,0),V(-.12,.03,0),.015);
const lamp=ell(bike,paperLight,1.23,2.25,0,.12,.13,.14);ell(bike,chrome,1.18,2.25,0,.13,.14,.16);
ell(bike,white,1.31,2.25,0,.03,.095,.10);
const reflector=ell(bike,coral,-1.89,1.7,0,.035,.06,.07);
const drivetrain=new THREE.Group();drivetrain.position.set(crankCenter.x,crankCenter.y,.20);bike.add(drivetrain);
ring(drivetrain,chrome,.23,.023,0,0,0);
for(let i=0;i<5;i++){const a=i*TAU/5;rod(drivetrain,chrome,V(0,0,0),V(Math.cos(a)*.22,Math.sin(a)*.22,0),.015);}
ring(wheels[0],chrome,.167,.017,0,0,.20);
const chainTexture=canvasTex(32,8,(c)=>{c.fillStyle='#323c35';c.fillRect(0,0,32,8);c.fillStyle='#969c83';c.fillRect(4,1,7,6);c.fillRect(20,1,7,6);});
chainTexture.wrapS=THREE.RepeatWrapping;chainTexture.repeat.set(38,1);
const chainMat=new THREE.MeshStandardMaterial({map:chainTexture,roughness:.5,metalness:.5});
const chain=tube(bike,chainMat,[V(-.15,1.26,.20),V(-1.34,.967,.20),V(-1.48,.895,.20),V(-1.504,.80,.20),V(-1.46,.69,.20),V(-1.34,.633,.20),V(-.15,.80,.20),V(.07,.94,.20),V(.09,1.06,.20),V(.02,1.20,.20),V(-.15,1.26,.20)],.014,72);
const crankArms=[],pedals=[];
for(const side of [-1,1]){crankArms.push(rod(bike,chrome,crankCenter,crankCenter.clone().add(V(.32,0,side*.30)),.027));pedals.push(box(bike,dark,0,0,side*.37,.24,.07,.20,true));}
for(const side of [-1,1]){rod(bike,chrome,V(-1.65,.83,side*.16),V(-1.73,1.86,side*.30),.023);rod(bike,chrome,V(-.87,1.34,side*.13),V(-.9,1.86,side*.30),.022);}
box(bike,leather,-1.37,1.85,0,1.13,.065,.70,true);
for(const z of [-.33,.33])rod(bike,chrome,V(-1.94,1.9,z),V(-.80,1.9,z),.028);
const parcels=new THREE.Group();parcels.position.set(-1.40,1.91,0);bike.add(parcels);
const parcel=box(parcels,paper,0,.37,0,.84,.73,.70,true);
box(parcels,paperLight,0,.75,0,.82,.025,.68);
box(parcels,twine,0,.37,.358,.031,.73,.017);box(parcels,twine,0,.765,0,.033,.022,.71);
box(parcels,twine,-.429,.37,0,.018,.73,.032);box(parcels,twine,0,.765,0,.85,.024,.031);
const labelTex=canvasTex(256,192,(c,w,h)=>{c.fillStyle='#f2e6c9';c.fillRect(0,0,w,h);c.strokeStyle='#918568';c.lineWidth=2;c.strokeRect(12,12,w-24,h-24);c.fillStyle='#4e705c';c.font='bold 21px Georgia';c.fillText('RIVER POST',24,47);c.font='16px sans-serif';c.fillStyle='#918568';c.fillText('with a little kindness',24,77);for(let i=0;i<3;i++){c.fillRect(25,108+i*17,115-i*20,2);}c.fillStyle='#ba7352';c.fillRect(181,97,46,57);c.strokeStyle='#eee0ba';c.strokeRect(186,102,36,47);c.font='26px serif';c.fillStyle='#f4e0b9';c.fillText('✿',190,138);});
const label=mesh(new THREE.PlaneGeometry(.50,.38),new THREE.MeshStandardMaterial({map:labelTex,roughness:.9}),parcels,.015,.40,.361);label.castShadow=false;
const smallParcel=box(parcels,paperLight,.05,.89,-.03,.60,.24,.51,true);smallParcel.rotation.y=-.12;
box(parcels,twine,.05,1.015,-.03,.055,.02,.52).rotation.y=-.12;
// Bow on the top parcel.
tube(parcels,twine,[V(.06,1.03,-.03),V(-.11,1.12,-.12),V(-.15,1.12,.03),V(.06,1.03,-.03),V(.22,1.12,.05),V(.24,1.12,-.12),V(.06,1.03,-.03)],.012,36);

// Otter: a long body, small rounded ears, broad whiskered muzzle, and a tapered tail.
const body=new THREE.Group();rider.add(body);
const torso=ell(body,fur,-.38,3.00,0,.56,.78,.46);torso.rotation.z=-.24;
const belly=ell(body,cream,-.035,2.99,0,.34,.60,.398);belly.rotation.z=-.22;
ell(body,fur,-.58,2.54,0,.50,.36,.44);
const head=new THREE.Group();head.position.set(.00,3.91,0);body.add(head);
const eyeGroups=[];
ell(head,fur,.13,.14,0,.63,.58,.505);
ell(head,furLight,.48,-.10,0,.43,.29,.445);
ell(head,muzzleMat,.62,-.07,.18,.255,.22,.265);ell(head,muzzleMat,.62,-.07,-.18,.255,.22,.265);
ell(head,cream,.37,-.30,0,.32,.12,.34);
ell(head,dark,.844,.03,0,.105,.073,.136);ell(head,white,.873,.055,.034,.016,.009,.025);
for(const side of [-1,1]){
  const ear=ell(head,fur,-.075,.48,side*.452,.150,.145,.114);ear.rotation.x=side*.2;
  ell(head,pink,-.023,.491,side*.50,.079,.080,.053);
  const eyeGroup=new THREE.Group();eyeGroup.position.set(.436,.256,side*.405);head.add(eyeGroup);eyeGroups.push(eyeGroup);
  const e=ell(eyeGroup,eye,0,0,0,.085,.101,.055);e.rotation.y=side*.35;
  ell(eyeGroup,white,.036,.033,side*.041,.028,.030,.014);ell(eyeGroup,white,-.013,-.031,side*.046,.010,.012,.008);
  tube(head,furLight,[V(.31,.37,side*.40),V(.40,.401,side*.43),V(.49,.365,side*.425)],.028,12);
  ell(head,pink,.62,-.13,side*.386,.072,.048,.019);
  for(let j=0;j<3;j++){
    const yy=-.08-j*.065;
    tube(head,twine,[V(.68,yy,side*.33),V(.77,yy+.02,side*.51),V(.74,yy+.02+(j-1)*.055,side*.76)],.009,12);
    ell(head,furLight,.713,yy,side*.356,.012,.012,.013);
  }
  tube(head,dark,[V(.81,-.09,side*.02),V(.76,-.20,side*.14),V(.65,-.205,side*.23)],.014,14);
}
tube(head,dark,[V(.848,-.016,0),V(.838,-.104,0),V(.805,-.134,0)],.013,10);
for(let i=0;i<3;i++){const tuft=ell(head,furLight,-.055+i*.12,.664-i*.008,-.06,.095,.13,.073);tuft.rotation.z=-.5+i*.17;}
// A sculpted taper follows a curved otter tail (the tip is deliberately slender).
function tailGeometry(){const c=new THREE.CatmullRomCurve3([V(-.68,2.56,.20),V(-1.02,2.09,.57),V(-1.44,1.49,.68),V(-1.91,1.07,.59),V(-2.14,1.10,.50)]);
  const frames=c.computeFrenetFrames(36,false),pos=[],normal=[],uv=[],idx=[];
  for(let i=0;i<=36;i++){const f=i/36,p=c.getPointAt(f),r=.245*Math.pow(1-f,1.2)+.012;
    for(let j=0;j<=12;j++){const a=j/12*TAU,n=frames.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i],Math.sin(a));pos.push(p.x+n.x*r,p.y+n.y*r,p.z+n.z*r);normal.push(n.x,n.y,n.z);uv.push(j/12,f);if(i<36&&j<12){const k=i*13+j;idx.push(k,k+13,k+1,k+1,k+13,k+14);}}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return g;
}
const tail=mesh(tailGeometry(),fur,rider);
// Limbs use a two-bone solution. Hands stay on the grips and feet stay on the pedals.
const arms=[],legs=[];
for(const side of [-1,1]){
  const upper=rod(rider,fur,V(0,0,0),V(0,1,0),.15,.12),lower=rod(rider,fur,V(0,0,0),V(0,1,0),.119,.085);
  const joint=ell(rider,fur,0,0,0,.123,.123,.123),paw=ell(rider,furLight,.94,2.66,side*.54,.175,.10,.11);
  for(let j=0;j<3;j++)tube(rider,fur,[V(.89+j*.048,2.636,side*.62),V(.90+j*.048,2.612,side*.634)],.009,6);
  arms.push({side,upper,lower,joint,paw});
  legs.push({side,upper:rod(rider,fur,V(0,0,0),V(0,1,0),.235,.175),lower:rod(rider,fur,V(0,0,0),V(0,1,0),.175,.105),joint:ell(rider,fur,0,0,0,.18,.18,.18),foot:ell(rider,furLight,0,0,0,.225,.115,.15)});
}
function kneeIK(a,b,l1,l2,bend){const d=b.clone().sub(a),len=THREE.MathUtils.clamp(d.length(),.001,l1+l2-.001);d.normalize();const along=(l1*l1-l2*l2+len*len)/(2*len),height=Math.sqrt(Math.max(0,l1*l1-along*along));const n=bend.clone().addScaledVector(d,-bend.dot(d)).normalize();return a.clone().addScaledVector(d,along).addScaledVector(n,height);}

// Woven scarf texture is generated on the spot, so file:// needs no external assets.
const scarfTexture=canvasTex(512,128,(c,w,h)=>{c.fillStyle='#d85b47';c.fillRect(0,0,w,h);c.fillStyle='#f3c79b';for(const x of [441,454,475])c.fillRect(x,0,5,h);c.globalAlpha=.13;for(let x=0;x<w;x+=3){c.strokeStyle=x%2?'#522f28':'#fff1d1';c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=0;y<h;y+=3){c.strokeStyle='#ffe9c9';c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}});
const scarfMat=new THREE.MeshStandardMaterial({map:scarfTexture,side:THREE.DoubleSide,roughness:.95});
const scarfNeck=ring(body,coral,.39,.106,-.07,3.53,0);scarfNeck.rotation.x=Math.PI/2;scarfNeck.scale.set(1.13,1,1);
ell(body,coral,-.30,3.56,.415,.16,.15,.13);
const ribbons=[];
for(let r=0;r<2;r++){
  const n=36,g=new THREE.BufferGeometry(),positions=new Float32Array((n+1)*2*3),uv=new Float32Array((n+1)*4),indices=[];
  for(let i=0;i<=n;i++){uv.set([i/n,0,i/n,1],i*4);if(i<n){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}
  g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(indices);
  const ribbon=mesh(g,scarfMat,body);ribbon.frustumCulled=false;
  const fringes=[];for(let j=0;j<7;j++)fringes.push(rod(body,j%3===0?twine:coral,V(0,0,0),V(0,.1,0),.012));
  ribbons.push({g,n,r,fringes});
}
function ribbonPoint(u,v,r,t,speed){const len=r?1.17:1.70,width=(r?.19:.30)*(1-.16*u),flutter=(.08+.20*u)*(0.55+.45*speed);
  const ang=.4+Math.sin(t*3.1-u*5+r)*.42*u;
  return V(-.32-len*u,3.55+(r?-.12:0)-u*.18+Math.sin(t*4.7-u*7+r)*flutter*u+v*width*Math.cos(ang),.40+(r?-.16:0)+Math.sin(t*3.5-u*5.5+r)*.14*u+v*width*Math.sin(ang));
}

// Scenery is built in six seamless chunks and merged by material for low draw-call cost.
const chunks=[],chunkLength=28,chunkCount=6,span=chunkLength*chunkCount;
function tree(p,x,z,s=1,type=0){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);p.add(g);
  rod(g,bark,V(0,0,0),V(.12,3.0,0),.12,.07);rod(g,bark,V(.08,1.6,0),V(-.64,2.9,.10),.067,.028);rod(g,bark,V(.1,2.0,0),V(.73,3.1,-.12),.063,.027);
  if(type===1){for(let i=0;i<3;i++)mesh(new THREE.ConeGeometry(1.0-i*.16,1.7,8),i%2?leaf:grassDark,g,.05,2.1+i*.7,0);}
  else {for(const [a,b,c,d] of [[-.55,3.0,0,.78],[.57,3.2,-.05,.84],[0,3.67,.12,.98],[-.22,3.27,.56,.74],[.1,3.1,-.65,.75]])ell(g,rand()>.45?leaf:leafLight,a,b,c,d,d*.9,d*.86);}
}
function reeds(p,x,z,s=1){for(let j=0;j<5;j++){const xx=x+between(-.22,.22),zz=z+between(-.22,.22),h=between(.6,1.2)*s;rod(p,reedMat,V(xx,0,zz),V(xx+.08,h,zz),.018);rod(p,reedTip,V(xx+.08,h*.8,zz),V(xx+.09,h,zz),.043);for(let k=0;k<2;k++){const a=mesh(new THREE.ConeGeometry(.04,h*.7,4),grassDark,p,xx+(k?-.07:.12),h*.37,zz);a.rotation.z=k?.35:-.4;}}}
function flower(p,x,z,size=1,color=white){const y=between(.18,.43)*size;rod(p,grassDark,V(x,0,z),V(x,y,z),.013*size);ell(p,yellow,x,y,z,.045*size,.026*size,.045*size);for(let i=0;i<5;i++){const a=i*TAU/5;ell(p,color,x+Math.cos(a)*.065*size,y,z+Math.sin(a)*.065*size,.060*size,.019*size,.038*size).rotation.y=-a;}}
function cottage(p,x,z,s=1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);p.add(g);box(g,wallMat,0,.85,0,2.15,1.7,1.8,true);
  const a=box(g,roofMat,-.58,1.95,0,1.39,.15,2.15);a.rotation.z=.48;const b=box(g,roofMat,.58,1.95,0,1.39,.15,2.15);b.rotation.z=-.48;
  const tri=new THREE.Shape();tri.moveTo(-1.08,0);tri.lineTo(1.08,0);tri.lineTo(0,.60);tri.closePath();mesh(new THREE.ShapeGeometry(tri),wallMat,g,0,1.68,.903);
  box(g,leather,-.25,.5,.93,.46,1.0,.06,true);for(const xx of [-.74,.61]){box(g,teal,xx,.97,.92,.38,.49,.05,true);box(g,paperLight,xx,.97,.955,.29,.40,.02);rod(g,white,V(xx-.145,.97,.975),V(xx+.145,.97,.975),.017);rod(g,white,V(xx,.77,.975),V(xx,1.17,.975),.017);}
  box(g,wallMat,.66,2.25,-.35,.26,.8,.31);box(g,stone,.66,2.65,-.35,.34,.10,.4);
}
function bridge(p,x){const g=new THREE.Group();g.position.set(x,0,0);p.add(g);
  // A low timber footbridge connects both banks, in the background of the riding path.
  for(let i=0;i<27;i++){const z=-2.9-i*.44,y=.23+Math.sin(i/26*Math.PI)*.77;box(g,paper,0,y,z,2.2,.14,.42);}
  for(const xx of [-1.12,1.12]){
    const pts=[];for(let i=0;i<9;i++){const z=-2.9-i*1.43,y=.23+Math.sin(i/8*Math.PI)*.77;rod(g,leather,V(xx,y,z),V(xx,y+.85,z),.047);pts.push(V(xx,y+.83,z));if(i===2||i===6)rod(g,bark,V(xx,-.32,z),V(xx,y+.2,z),.115);}
    tube(g,leather,pts,.045,40);
  }
}
function mergeStatic(group){group.updateMatrixWorld(true);const byMat=new Map();group.traverse(o=>{if(o.isMesh){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);const n=g.index?g.toNonIndexed():g; if(g!==n)g.dispose();if(!byMat.has(o.material))byMat.set(o.material,[]);byMat.get(o.material).push(n);}});
  group.clear();for(const [m,gs] of byMat){const g=mergeGeometries(gs,false);const o=new THREE.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;group.add(o);gs.forEach(x=>x.dispose());}
}
for(let c=0;c<chunkCount;c++){
  const group=new THREE.Group();
  // Embankment stones form an irregular but continuous edge to the river.
  for(let i=0;i<40;i++){const x=-14+i*.72;const o=ell(group,stone,x,-.015,-2.81+between(-.06,.06),between(.29,.43),between(.17,.27),between(.22,.37));o.rotation.y=rand()*TAU;}
  for(let i=0;i<28;i++){const x=between(-14,14),z=between(2.48,7.5);for(let k=0;k<3;k++){const t=mesh(new THREE.ConeGeometry(.025,between(.15,.36),3),i%3?grassDark:grassMid,group,x+k*.055,.08,z);t.rotation.z=between(-.38,.38);}if(i<15)flower(group,x,z,between(.8,1.2),i%6===0?flowerPink:white);}
  for(let i=0;i<9;i++)reeds(group,between(-14,14),-2.98+between(-.12,.08),between(.6,.9));
  for(let i=0;i<5;i++){const x=between(-13,13),z=between(-15.9,-19.5);tree(group,x,z,between(1.0,1.6),i===0?1:0);}
  tree(group,between(-9,9),13.0,between(.65,.82));tree(group,between(-13,13),17.5,between(.8,1.15),1);
  for(let i=0;i<5;i++)ell(group,grassMid,between(-14,14),.23,between(3.5,8),between(.4,.7),.40,.55);
  if(c%2===0)cottage(group,between(-8,8),-18,1.2);
  if(c===2)bridge(group,1.8);
  // Road pebbles, tiny warm flecks rather than a flat plane.
  for(let i=0;i<50;i++)ell(group,verge,between(-14,14),.005,between(-1.98,1.98),between(.015,.045),.008,between(.015,.035));
  // Distance markers.
  if(c%2===1){rod(group,leather,V(9,0,2.6),V(9,1.3,2.6),.045);box(group,paperLight,9,1.29,2.6,.74,.30,.065,true);}
  mergeStatic(group);group.position.x=(c-2)*chunkLength;scene.add(group);chunks.push({group,base:(c-2)*chunkLength});
}
// Distant rolling hills, behind the far bank.
const hillMat=mat('hills','#afbd93');
for(let i=0;i<12;i++){const o=ell(scene,hillMat,-72+i*13,-1.8,-31-between(0,9),between(9,15),between(5,9),between(5,10));o.castShadow=false;}
// Delicate cotton clouds.
const cloudMat=new THREE.MeshBasicMaterial({color:'#f7f1dc',transparent:true,opacity:.52});
for(let i=0;i<9;i++){const g=new THREE.Group();g.position.set(-58+i*15,between(15,20),between(-35,-23));scene.add(g);for(let j=0;j<3;j++)ell(g,cloudMat,j*1.8,Math.sin(j)*.7,0,2.3,1,1.1).castShadow=false;}
// Ducks and lily pads add life on the river without competing with the rider.
const ducks=[];
for(let i=0;i<6;i++){
  const g=new THREE.Group();const x=-17+i*8,z=between(-6.1,-9.8);g.position.set(x,-.015,z);scene.add(g);
  ell(g,i%3?yellow:white,0,.11,0,.19,.135,.125);ell(g,i%3?yellow:grassDark,.17,.23,0,.094,.10,.092);
  const beak=mesh(new THREE.ConeGeometry(.034,.12,4),roofMat,g,.27,.215,0);beak.rotation.z=-Math.PI/2;
  ell(g,eye,.20,.257,.074,.014,.015,.008);
  const wake=ring(g,new THREE.MeshBasicMaterial({color:'#e7edce',transparent:true,opacity:.35}),.23,.009,-.03,.007,0);wake.rotation.x=-Math.PI/2;wake.scale.set(1.5,1,1);
  ducks.push({g,x,z,wake});
}
const lilyMat=mat('lily','#598e66');
for(let i=0;i<23;i++){const p=mesh(new THREE.CircleGeometry(between(.15,.3),20,0,TAU-.3),lilyMat,scene,between(-60,70),-.064,between(-13.8,-12.5));p.rotation.x=-Math.PI/2;p.rotation.z=rand()*TAU;p.castShadow=false;}
// A few golden motes drift above the flowers.
const motePositions=new Float32Array(45*3);for(let i=0;i<45;i++)motePositions.set([between(-20,20),between(.5,3.5),between(1.5,6.0)],i*3);
const moteGeo=new THREE.BufferGeometry();moteGeo.setAttribute('position',new THREE.BufferAttribute(motePositions,3));
const moteTex=canvasTex(32,32,(c,w,h)=>{const gr=c.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(255,240,166,1)');gr.addColorStop(.2,'rgba(255,240,166,.6)');gr.addColorStop(1,'rgba(255,240,166,0)');c.fillStyle=gr;c.fillRect(0,0,w,h);});
scene.add(new THREE.Points(moteGeo,new THREE.PointsMaterial({color:'#ffe3a1',map:moteTex,size:.12,transparent:true,depthWrite:false})));

// Small, meaningful interactions and keyboard shortcuts.
let paused=false,speed=1,wind=1,travel=0,simTime=0,phase=0,nightMix=0,nightWanted=false,viewMode='follow';
let bellAt=-100,audioContext=null,audioEnabled=false,ambientGain=null;
const toast=$('toast');let toastTimer;
function notify(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2300);}
function togglePause(){paused=!paused;$('pause').innerHTML=paused?icons.play:icons.pause;$('pause').setAttribute('aria-label',paused?'继续骑行':'暂停骑行');$('pause').title=paused?'继续骑行 · 空格':'暂停骑行 · 空格';$('status').textContent=paused?'在河边歇一会儿':'小小包裹，慢慢送达';$('live-dot').classList.toggle('rest',paused);}
const icons={pause:'<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>',play:'<svg viewBox="0 0 24 24"><path d="m9 5 10 7-10 7z"/></svg>'};
$('pause').addEventListener('click',togglePause);
$('speed').addEventListener('input',e=>{speed=+e.target.value;$('speed-value').textContent=speed.toFixed(1)+'×';});
$('wind').addEventListener('input',e=>{wind=+e.target.value;$('wind-value').textContent=wind<.7?'轻柔':wind>1.3?'起风':'微风';});
function resetView(){viewMode='follow';camera.position.copy(initialCamera);controls.target.copy(initialTarget);controls.update();document.querySelectorAll('[data-view]').forEach(e=>e.classList.toggle('active',e.dataset.view==='follow'));}
$('reset').addEventListener('click',()=>{resetView();notify('回到水獭身边');});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{
  viewMode=b.dataset.view;document.querySelectorAll('[data-view]').forEach(e=>e.classList.toggle('active',e===b));
  if(viewMode==='follow'){camera.position.copy(initialCamera);controls.target.copy(initialTarget);}
  if(viewMode==='portrait'){camera.position.set(5.8,4.3,7.3);controls.target.set(-.05,2.75,0);}
  if(viewMode==='river'){camera.position.set(11.8,11.0,18.3);controls.target.set(0,1.1,-3.5);}
  controls.update();
}));
$('light').addEventListener('click',()=>{nightWanted=!nightWanted;$('light').setAttribute('aria-pressed',String(nightWanted));$('light-label').textContent=nightWanted?'晨光':'黄昏';notify(nightWanted?'让河岸染上一点黄昏':'晨风又吹起来了');});
function startAudio(){if(!audioContext){audioContext=new (window.AudioContext||window.webkitAudioContext)();}
  if(audioContext.state==='suspended')audioContext.resume();return audioContext;
}
function ringBell(){bellAt=simTime;try{const ac=startAudio();const now=ac.currentTime;for(const delay of [0,.16])for(const [hz,vol] of [[1640,.085],[3280,.028],[4520,.009]]){
  const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=hz;o.connect(g);g.connect(ac.destination);g.gain.setValueAtTime(.0001,now+delay);g.gain.exponentialRampToValueAtTime(vol,now+delay+.006);g.gain.exponentialRampToValueAtTime(.0001,now+delay+1.2);o.start(now+delay);o.stop(now+delay+1.3);
  }}catch(e){}notify('叮铃，借过一下！');}
$('bell').addEventListener('click',ringBell);
function toggleSound(){try{const ac=startAudio();if(!ambientGain){const seconds=4,buffer=ac.createBuffer(1,ac.sampleRate*seconds,ac.sampleRate),d=buffer.getChannelData(0);let b=0;for(let i=0;i<d.length;i++){b=(b+between(-1,1)*.028)/1.028;d[i]=b*2.6;}
  const source=ac.createBufferSource();source.buffer=buffer;source.loop=true;const filter=ac.createBiquadFilter();filter.type='lowpass';filter.frequency.value=750;ambientGain=ac.createGain();ambientGain.gain.value=0;source.connect(filter);filter.connect(ambientGain);ambientGain.connect(ac.destination);source.start();}
  audioEnabled=!audioEnabled;ambientGain.gain.setTargetAtTime(audioEnabled?.13:0,ac.currentTime,.7);$('sound').setAttribute('aria-pressed',String(audioEnabled));$('sound-label').textContent=audioEnabled?'声音开':'声音关';
}catch(e){notify('当前浏览器无法播放声音');}}
$('sound').addEventListener('click',toggleSound);
$('help').addEventListener('click',()=>$('help-panel').classList.toggle('visible'));
$('help-close').addEventListener('click',()=>$('help-panel').classList.remove('visible'));
addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select'))return;if(e.code==='Space'){e.preventDefault();togglePause();}if(e.key.toLowerCase()==='b')ringBell();if(e.key.toLowerCase()==='r')resetView();if(e.key==='Escape')$('help-panel').classList.remove('visible');});
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerDown;
renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{if(!pointerDown||Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>5)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);if(raycaster.intersectObjects(bellGroup.children,true).length)ringBell();else if(raycaster.intersectObjects(parcels.children,true).length)notify('包裹里，装着给朋友的小小惊喜。');});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('loading').classList.remove('hidden');$('loading').innerHTML='<b>画面暂时休息了</b><p>请重新打开文件，继续这段骑行。</p>';});
const dawnBg=new THREE.Color('#e9ecd9'),duskBg=new THREE.Color('#f3d9be'),dawnSky=new THREE.Color('#a6c9c3'),duskSky=new THREE.Color('#baa4a0');
let last=performance.now(),frameCount=0,frameWindow=0,frameElapsed=0;
function animate(now){requestAnimationFrame(animate);const elapsed=Math.max(0,(now-last)/1000),realDt=Math.min(elapsed,.05);last=now;const dt=paused?0:realDt;simTime+=dt;const velocity=3.25*speed;travel+=dt*velocity;
  // The compact bicycle has a 1.38:1 gear ratio. Wheel speed matches the path exactly.
  phase-=dt*velocity/(wheelRadius*1.38);drivetrain.rotation.z=phase;chainTexture.offset.x=travel*.18;
  const bob=Math.sin(phase*2)*.028,roll=Math.sin(phase)*.012;
  rider.position.y=bob;rider.rotation.x=roll;rider.rotation.z=Math.sin(phase*2)*.006;
  body.position.y=Math.sin(phase*2+.5)*.013;
  head.rotation.y=Math.sin(simTime*.42)*.045;head.rotation.z=Math.sin(simTime*.65)*.024;
  const blink=Math.pow(Math.max(0,Math.cos(simTime*1.31)),38);
  eyeGroups.forEach(o=>o.scale.y=1-.86*blink);
  tail.rotation.y=Math.sin(phase+.6)*.027;
  wheels.forEach(w=>w.rotation.z=-travel/wheelRadius);
  for(let i=0;i<2;i++){
    const side=i===0?-1:1,a=phase+i*Math.PI,foot=V(crankCenter.x+Math.cos(a)*.325,crankCenter.y+Math.sin(a)*.325,side*.40);
    pedals[i].position.copy(foot);placeRod(crankArms[i],V(crankCenter.x,crankCenter.y,side*.2),V(foot.x,foot.y,side*.31),.027);
    const l=legs[i],hip=V(-.57,2.49+Math.sin(phase*2+.5)*.013,side*.30),ankle=foot.clone().add(V(-.03,.12,side*.02));
    const knee=kneeIK(hip,ankle,.88,.88,V(1,0,side*.10));placeRod(l.upper,hip,knee,.225);placeRod(l.lower,knee,ankle,.162);l.joint.position.copy(knee);l.foot.position.copy(foot).add(V(.075,.095,0));l.foot.rotation.z=Math.sin(a)*.16;
    const ar=arms[i],shoulder=V(-.15,3.37+body.position.y,side*.36),wrist=V(.94,2.68,side*.54);
    const elbow=kneeIK(shoulder,wrist,.66,.66,V(-.1,-.8,side*.7));placeRod(ar.upper,shoulder,elbow,.15);placeRod(ar.lower,elbow,wrist,.116);ar.joint.position.copy(elbow);
  }
  for(const r of ribbons){const a=r.g.attributes.position;for(let i=0;i<=r.n;i++)for(let j=0;j<2;j++){const p=ribbonPoint(i/r.n,j-.5,r.r,simTime,wind*speed);a.setXYZ(i*2+j,p.x,p.y,p.z);}a.needsUpdate=true;r.g.computeVertexNormals();for(let j=0;j<7;j++){const p=ribbonPoint(1,(j/6-.5)*.94,r.r,simTime,wind*speed),q=p.clone().add(V(-.12,Math.sin(simTime*5+j)*.023,Math.cos(simTime*3+j)*.017));placeRod(r.fringes[j],p,q,.011);}}
  parcels.rotation.z=Math.sin(phase*2-.4)*.011;
  const sinceBell=simTime-bellAt;bellGroup.rotation.z=sinceBell<.55?Math.sin(sinceBell*60)*.12*(1-sinceBell/.55):0;
  chunks.forEach(({group,base})=>{group.position.x=((base-travel+70)%span+span)%span-70;});
  ducks.forEach((d,i)=>{d.g.position.x=((d.x-travel+simTime*.09+66)%132+132)%132-66;d.g.position.y=-.015+Math.sin(simTime*1.6+i)*.014;d.g.position.z=d.z+Math.sin(simTime*.22+i)*.10;d.wake.scale.x=1.4+Math.sin(simTime*1.3+i)*.10;});
  waterUniform.value=simTime;sparkles.position.x=-travel%3;
  const a=moteGeo.attributes.position;for(let i=0;i<45;i++){a.array[i*3]-=dt*velocity*.5;if(a.array[i*3]<-20)a.array[i*3]=20;a.array[i*3+1]+=Math.sin(simTime*.8+i)*dt*.08;}a.needsUpdate=true;
  nightMix=THREE.MathUtils.damp(nightMix,nightWanted?1:0,1.5,realDt);
  scene.fog.color.copy(dawnBg).lerp(duskBg,nightMix);sky.material.uniforms.top.value.copy(dawnSky).lerp(duskSky,nightMix);sky.material.uniforms.bottom.value.copy(dawnBg).lerp(duskBg,nightMix);
  sun.color.set('#ffe4b9').lerp(new THREE.Color('#ffbb83'),nightMix);sun.intensity=3.1-nightMix*.8;hemi.intensity=2.2-nightMix*.65;renderer.toneMappingExposure=1.12-nightMix*.08;
  controls.update();renderer.render(scene,camera);
  frameWindow++;frameElapsed+=elapsed;
  if(frameCount++%30===0){$('distance').textContent=(travel/1000).toFixed(2);$('pace').textContent=(velocity*3.6).toFixed(1);renderer.domElement.dataset.frame=String(frameCount);renderer.domElement.dataset.time=simTime.toFixed(3);renderer.domElement.dataset.travel=travel.toFixed(3);}
  if(frameElapsed>2){renderer.domElement.dataset.fps=(frameWindow/frameElapsed).toFixed(1);renderer.domElement.dataset.drawCalls=String(renderer.info.render.calls);frameWindow=0;frameElapsed=0;}
  if(frameCount===3){$('loading').classList.add('hidden');$('app').classList.add('ready');}
}
requestAnimationFrame(animate);
