import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const $ = id => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { paused:reducedMotion, kmh:18, distance:0, time:0, wheelRear:0, wheelFront:0, view:0, sunset:false, lightBlend:0, hornTime:-10, frames:0 };
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false, powerPreference:'high-performance' });
} catch(error) {
  $('loading').style.display='none'; $('error').style.display='grid';
  console.error(error);
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('scene').appendChild(renderer.domElement);
renderer.domElement.setAttribute('aria-label','猫咪沿海骑电动车的三维画面，可拖动旋转视角');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#bfdfe2');
scene.fog = new THREE.Fog('#bfdfe2',65,190);
const camera = new THREE.PerspectiveCamera(39,innerWidth/innerHeight,.1,750);
const controls = new OrbitControls(camera,renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .08;
controls.enablePan = false;
controls.minDistance = 4.2;
controls.maxDistance = 28;
controls.maxPolarAngle = Math.PI*.475;
controls.minPolarAngle = .12;
controls.target.set(0,1.65,1.5);
const hemi = new THREE.HemisphereLight('#eff8e6','#bea27f',2.5);
scene.add(hemi);
const sunLight = new THREE.DirectionalLight('#fff4d4',3.6);
sunLight.position.set(12,22,8);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048,2048);
Object.assign(sunLight.shadow.camera,{left:-23,right:23,top:23,bottom:-23,near:.5,far:70});
sunLight.shadow.bias=-.0004;
sunLight.shadow.normalBias=.022;
sunLight.shadow.radius=3;
scene.add(sunLight);

const mat = (color,roughness=.75,metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
const M = {
  mint:mat('#6fbca6',.35), mintDark:mat('#307b6c',.45), cream:mat('#fff1cb'),
  orange:mat('#e59746'), stripe:mat('#b76e32'), muzzle:mat('#fff0d4'), pink:mat('#ed978c'),
  tire:mat('#28383a'), hub:mat('#ccd3c0',.3,.55), metal:mat('#789b97',.33,.65),
  dark:mat('#203e40'), seat:mat('#a65e43'), scarf:mat('#d76a4f'), shirt:mat('#fff4d6'),
  sand:mat('#e7ce99'), grass:mat('#9bb581'), grassDark:mat('#74946b'), wood:mat('#b88a57'),
  woodLight:mat('#d6b283'), leaf:mat('#659675'), leafLight:mat('#87ae7e'),
  white:mat('#fff6e1'), rock:mat('#a9b7a2'), peach:mat('#e6ac8d'), teal:mat('#71ada7'),
  glass:mat('#d3e9df',.1,.12), red:new THREE.MeshStandardMaterial({color:'#d05a40',emissive:'#b23c21',emissiveIntensity:.35}),
  lamp:new THREE.MeshStandardMaterial({color:'#fff0c1',emissive:'#ffc36f',emissiveIntensity:.25}),
  eyes:mat('#192f32',.2), glint:new THREE.MeshBasicMaterial({color:'#fffdf6'})
};

function mesh(geometry,material,parent,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0],shadow=true) {
  const obj = new THREE.Mesh(geometry,material);
  obj.position.set(...pos); obj.scale.set(...scale); obj.rotation.set(...rot);
  obj.castShadow = shadow; obj.receiveShadow = shadow;
  parent.add(obj); return obj;
}
function box(parent,material,pos,size,r=.04,rot=[0,0,0]) {
  return mesh(new RoundedBoxGeometry(...size,2,r),material,parent,pos,[1,1,1],rot);
}
function ball(parent,material,pos,scale,segments=20) {
  return mesh(new THREE.SphereGeometry(1,segments,14),material,parent,pos,scale);
}
function rod(parent,material,a,b,r=.035,r2=r,sides=10) {
  const A=new THREE.Vector3(...a), B=new THREE.Vector3(...b), v=B.clone().sub(A);
  const o=mesh(new THREE.CylinderGeometry(r2,r,v.length(),sides),material,parent,A.clone().add(B).multiplyScalar(.5).toArray());
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()); return o;
}
function tube(parent,material,points,r=.03) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  return mesh(new THREE.TubeGeometry(curve,Math.max(10,points.length*7),r,7,false),material,parent);
}
function flatTriangle(parent,material,vertices,thickness=.035) {
  const shape=new THREE.Shape(); shape.moveTo(vertices[0][0],vertices[0][1]);
  shape.lineTo(vertices[1][0],vertices[1][1]); shape.lineTo(vertices[2][0],vertices[2][1]); shape.closePath();
  return mesh(new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.014,bevelThickness:.014}),material,parent);
}
function seeded(n) {
  let s=(n+1)*987231;
  return () => { s=(s*1664525+1013904223)>>>0; return s/4294967296; };
}

// Procedural textures keep the delivered HTML fully offline.
const asphaltCanvas = document.createElement('canvas');
asphaltCanvas.width=asphaltCanvas.height=128;
const ac=asphaltCanvas.getContext('2d'), ai=ac.createImageData(128,128), ar=seeded(77);
for(let i=0;i<ai.data.length;i+=4) {
  const v=100+ar()*16; ai.data[i]=v*.83; ai.data[i+1]=v*.94; ai.data[i+2]=v; ai.data[i+3]=255;
}
ac.putImageData(ai,0,0);
const asphaltTexture=new THREE.CanvasTexture(asphaltCanvas);
asphaltTexture.colorSpace=THREE.SRGBColorSpace;
asphaltTexture.wrapS=asphaltTexture.wrapT=THREE.RepeatWrapping;
asphaltTexture.repeat.set(220,5);
const roadMaterial=new THREE.MeshStandardMaterial({map:asphaltTexture,roughness:.97,color:'#b1b7ad'});
mesh(new THREE.PlaneGeometry(520,8),roadMaterial,scene,[0,-.015,0],[1,1,1],[-Math.PI/2,0,0]);
box(scene,M.sand,[0,-.28,-10.55],[520,.4,11.1],.01);
box(scene,M.grass,[0,-.21,50],[520,.4,92],.01);
box(scene,M.cream,[0,.015,-5.85],[520,.16,3.7],.02);
box(scene,M.woodLight,[0,-.02,-8.2],[520,.12,1.1],.01);
box(scene,M.sand,[0,-.07,4.35],[520,.12,.65],.01);

const skyUniforms={top:{value:new THREE.Color('#7ebcc9')},bottom:{value:new THREE.Color('#fff0cb')}};
const sky = mesh(new THREE.SphereGeometry(500,32,20),new THREE.ShaderMaterial({
  side:THREE.BackSide, depthWrite:false, uniforms:skyUniforms,
  vertexShader:'varying vec3 vPos; void main(){vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 top; uniform vec3 bottom; varying vec3 vPos; void main(){float h=clamp(normalize(vPos).y*2.5+.1,0.,1.); gl_FragColor=vec4(mix(bottom,top,pow(h,.6)),1.); #include <tonemapping_fragment> \n #include <colorspace_fragment> }'
}),scene,[0,0,0],[1,1,1],[0,0,0],false);
// Shader chunks must begin on their own line.
sky.material.fragmentShader=sky.material.fragmentShader.replace(' #include','\n #include');
const sun=mesh(new THREE.SphereGeometry(12,32,20),new THREE.MeshBasicMaterial({color:'#fff4ca',fog:false}),scene,[-95,38,-245],[1,1,1],[0,0,0],false);
const oceanUniforms={time:{value:0},lightBlend:{value:0}};
const oceanMaterial=new THREE.ShaderMaterial({
  uniforms:oceanUniforms,
  vertexShader:`uniform float time; varying vec3 vPos; varying float vWave;
    void main(){vec3 p=position; float w=sin(p.x*.12+time*.8)*.14+sin(p.z*.22-time*1.25+p.x*.06)*.14;
    p.y+=w; vPos=p; vWave=w; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform float time; uniform float lightBlend; varying vec3 vPos; varying float vWave;
    void main(){float shore=1.-smoothstep(-55.,-16.,-vPos.z); float shallow=smoothstep(-70.,-12.,vPos.z);
    vec3 blue=mix(vec3(.08,.49,.59),vec3(.29,.77,.72),shallow);
    float ribbons=sin(vPos.z*.47+sin(vPos.x*.065+time*.3)*1.8-time*1.2);
    blue+=pow(max(ribbons,0.),14.)*.045;
    float sparkle=pow(max(0.,sin(vPos.x*3.1+time*.8)*sin(vPos.z*5.7-time*.8)),25.);
    blue+=sparkle*.32*smoothstep(-220.,-30.,vPos.z);
    blue=mix(blue,blue*vec3(1.12,.78,.78)+vec3(.12,.05,.035),lightBlend*.7);
    float mist=smoothstep(95.,300.,length(vPos.xz)); blue=mix(blue,mix(vec3(.7,.83,.81),vec3(.88,.7,.58),lightBlend),mist);
    gl_FragColor=vec4(blue,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`
});
const oceanGeo=new THREE.PlaneGeometry(900,500,100,65); oceanGeo.rotateX(-Math.PI/2); oceanGeo.translate(0,-.24,-266);
const ocean=mesh(oceanGeo,oceanMaterial,scene,[0,0,0],[1,1,1],[0,0,0],false);
const foam=[];
for(let k=0;k<4;k++) {
  const n=130, ps=[], indices=[];
  for(let i=0;i<=n;i++) { const x=(i/n-.5)*420; ps.push(x,-.09,-16-k*.75,x,-.09,-16.18-k*.75); if(i<n){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);} }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(ps,3));g.setIndex(indices);g.computeVertexNormals();
  const f=mesh(g,new THREE.MeshBasicMaterial({color:'#e4f2d7',transparent:true,opacity:.57-k*.09,side:THREE.DoubleSide,depthWrite:false}),scene,[0,0,0],[1,1,1],[0,0,0],false);
  foam.push(f);
}

function palm(parent,x,z,height=5,phase=0) {
  const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);
  tube(g,M.wood,[[0,0,0],[.07,height*.34,0],[.36,height*.67,.05],[.55,height,.03]],.12);
  for(let i=1;i<9;i++) mesh(new THREE.TorusGeometry(.12,.013,5,10),M.woodLight,g,[.55*(i/9)**2,height*i/9,0],[1,1,1],[Math.PI/2,0,-.08]);
  const crown=new THREE.Group();crown.position.set(.55,height,.03);crown.rotation.y=phase;g.add(crown);
  for(let j=0;j<7;j++) {
    const angle=j*Math.PI*2/7, p=[], ind=[];
    for(let k=0;k<=9;k++) {
      const t=k/9, l=t*2.5, y=Math.sin(t*Math.PI)*.52-t*t*.72, w=Math.sin(Math.PI*t)*.34;
      p.push(Math.cos(angle)*l-Math.sin(angle)*w,y,Math.sin(angle)*l+Math.cos(angle)*w);
      p.push(Math.cos(angle)*l,y+.075*Math.sin(Math.PI*t),Math.sin(angle)*l);
      p.push(Math.cos(angle)*l+Math.sin(angle)*w,y,Math.sin(angle)*l-Math.cos(angle)*w);
      if(k<9) { const a=k*3;ind.push(a,a+3,a+1,a+1,a+3,a+4,a+1,a+4,a+2,a+2,a+4,a+5); }
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setIndex(ind);geo.computeVertexNormals();
    const material=(j%2?M.leaf:M.leafLight);material.side=THREE.DoubleSide;
    mesh(geo,material,crown);
  }
  for(let j=0;j<3;j++) ball(crown,M.wood,[.2*Math.cos(j*2),-.12,.2*Math.sin(j*2)],[.17,.21,.16],10);
}
function bench(parent,x,z) {
  for(let i=0;i<4;i++)box(parent,M.woodLight,[x,.65,z+i*.14],[1.8,.1,.11],.015);
  for(let i=0;i<3;i++)box(parent,M.woodLight,[x,.94+i*.15,z-.12],[1.8,.12,.08],.01,[0,0,0]);
  for(const dx of [-.63,.63]) {box(parent,M.dark,[x+dx,.33,z+.2],[.08,.61,.46],.015);rod(parent,M.dark,[x+dx,.5,z-.12],[x+dx,1.3,z-.12],.035);}
}
function streetLamp(parent,x,z) {
  rod(parent,M.metal,[x,0,z],[x,4.25,z],.055,.04);
  tube(parent,M.metal,[[x,3.9,z],[x,4.3,z],[x,4.4,z+.4],[x,4.2,z+.72]],.044);
  mesh(new THREE.ConeGeometry(.28,.18,12),M.dark,parent,[x,4.15,z+.72]);
  ball(parent,M.lamp,[x,4.06,z+.72],[.17,.055,.17],12);
}
function umbrella(parent,x,z,color) {
  rod(parent,M.wood,[x,-.02,z],[x,2.17,z],.035);
  const cover=mesh(new THREE.ConeGeometry(1.55,.55,10,1,true),color,parent,[x,2.04,z]); cover.material.side=THREE.DoubleSide;
  for(let i=0;i<10;i++) {const a=i*Math.PI*2/10;rod(parent,M.cream,[x,2.31,z],[x+1.53*Math.cos(a),1.77,z+1.53*Math.sin(a)],.018);}
  ball(parent,M.cream,[x,2.36,z],[.08,.1,.08],10);
  for(const s of [-1,1]) {
    const g=new THREE.Group();g.position.set(x+s*.6,0,z+1.1);g.rotation.y=-.12;parent.add(g);
    box(g,M.woodLight,[0,.3,0],[.55,.1,1.1],.015);box(g,M.cream,[0,.43,-.53],[.52,.09,.8],.015,[-.55,0,0]);
    rod(g,M.wood,[-.2,0,.3],[-.2,.32,-.3],.025);rod(g,M.wood,[.2,0,.3],[.2,.32,-.3],.025);
  }
}
function roadSign(parent,x,z,type) {
  rod(parent,M.metal,[x,0,z],[x,2.9,z],.042);
  const cv=document.createElement('canvas');cv.width=384;cv.height=192;const ctx=cv.getContext('2d');
  ctx.fillStyle='#397b70';ctx.fillRect(0,0,384,192);ctx.strokeStyle='#f7edce';ctx.lineWidth=5;ctx.strokeRect(10,10,364,172);
  ctx.fillStyle='#f7edce';ctx.textAlign='center';ctx.font='600 43px Microsoft YaHei, sans-serif';ctx.fillText(type===0?'海岸线 →':'海风充电站',192,87);
  ctx.font='20px Segoe UI, sans-serif';ctx.fillText(type===0?'COASTAL ROAD':'TAKE IT SLOW',192,137);
  const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;
  const board=mesh(new THREE.BoxGeometry(2.55,1.25,.09),[M.wood,M.wood,M.wood,M.wood,new THREE.MeshStandardMaterial({map:texture,roughness:.8}),M.wood],parent,[x,2.7,z]);
  board.rotation.y=.25;
}
function mergeStatic(group) {
  group.updateMatrixWorld(true);
  const byMat=new Map(),old=[];
  group.traverse(o=>{
    if(o.isMesh && !Array.isArray(o.material)) {
      const key=o.material.uuid;
      if(!byMat.has(key))byMat.set(key,{material:o.material,geometries:[]});
      const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrixWorld);
      // All merged geometry uses position, normal and uv attributes.
      if(!geo.attributes.uv)geo.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(geo.attributes.position.count*2).fill(0),2));
      byMat.get(key).geometries.push(geo);old.push(o);
    }
  });
  for(const o of old)o.parent.remove(o);
  for(const b of byMat.values()) {const geo=mergeGeometries(b.geometries,false);if(geo){const m=mesh(geo,b.material,group);m.frustumCulled=true;} b.geometries.forEach(g=>g.dispose());}
  for(const o of old)o.geometry.dispose();
}
const tiles=[],tileLength=48,tileCount=7;
for(let t=0;t<tileCount;t++) {
  const g=new THREE.Group(),rnd=seeded(t+121);scene.add(g);
  for(let x=-24;x<24;x+=6)box(g,M.cream,[x,.006,0],[2.7,.02,.11],.006);
  for(const z of [-3.6,3.6])box(g,M.cream,[0,.007,z],[48,.02,.10],.005);
  for(let x=-24;x<24;x+=3) {
    box(g,M.white,[x,.31,-4.55],[.065,.65,.09],.015);
    if((x+24)%6===0)box(g,M.sand,[x,.055,-4.1],[.8,.15,.23],.01);
  }
  for(const h of [.32,.61])box(g,M.white,[0,h,-4.55],[48,.06,.075],.01);
  for(let x=-22;x<24;x+=24) {palm(g,x,-7.35,4.8+rnd()*.7,t);streetLamp(g,x+10,-4.7);}
  bench(g,-3,-6.15);
  for(let j=0;j<6;j++) {
    const x=-23+rnd()*46,z=7+rnd()*5;
    ball(g,j%2?M.grassDark:M.grass,[x,.3,z],[.8+rnd()*.7,.35+rnd()*.4,.65+rnd()],10);
    for(let k=0;k<3;k++)rod(g,M.grassDark,[x+(k-1)*.13,0,z],[x+(k-1)*.3,.7+rnd()*.5,z-.15],.028,.005,5);
  }
  palm(g,18,11,5.6,t+.5);
  for(let j=0;j<4;j++)mesh(new THREE.DodecahedronGeometry(1,0),M.rock,g,[-20+rnd()*40,-.11,-12-rnd()*3],[.2+rnd()*.6,.2+rnd()*.35,.3+rnd()*.7],[0,rnd()*6,0]);
  if(t%2===0)umbrella(g,-12,-11.5,t%3===0?M.peach:M.teal);
  if(t===1||t===5)roadSign(g,7,-7.45,t===1?0:1);
  if(t===3) {
    box(g,M.peach,[3,1.65,20],[7,3.3,4.3],.05);
    box(g,M.cream,[3,3.4,20],[7.5,.26,4.8],.025);
    for(const dx of [-2.2,0,2.2]) {box(g,M.teal,[3+dx,1.9,22.17],[1.25,1.6,.08],.01);box(g,M.white,[3+dx,1.9,22.24],[.06,1.65,.04],.005);}
    box(g,M.teal,[3,2.5,23.1],[7.3,.16,2.3],.025,[-.1,0,0]);
    for(const dx of [-3.4,3.4])rod(g,M.white,[3+dx,0,23.5],[3+dx,2.5,23.5],.05);
  }
  mergeStatic(g); tiles.push(g);
}

const distant=new THREE.Group();scene.add(distant);
for(const [x,z,size] of [[-90,-155,1.1],[68,-185,1.5],[125,-125,.7]]) {
  const island=new THREE.Group();island.position.set(x,-.8,z);distant.add(island);
  mesh(new THREE.ConeGeometry(23*size,14*size,7),M.grassDark,island,[0,2,0],[1,.6,.55],[0,.3,0],false);
  mesh(new THREE.ConeGeometry(18*size,18*size,6),M.rock,island,[12*size,4,0],[1,.5,.55],[0,.6,0],false);
}
const lighthouse=new THREE.Group();lighthouse.position.set(39,-.2,-67);distant.add(lighthouse);
mesh(new THREE.DodecahedronGeometry(6,0),M.rock,lighthouse,[0,-1,0],[1,.45,.65],[0,0,.15],false);
mesh(new THREE.CylinderGeometry(1.05,1.6,7,12),M.white,lighthouse,[0,3.1,0],[1,1,1],[0,0,0],false);
mesh(new THREE.CylinderGeometry(1.13,1.2,1.2,12),M.scarf,lighthouse,[0,4.8,0],[1,1,1],[0,0,0],false);
mesh(new THREE.CylinderGeometry(1.1,1.1,1.3,12),M.glass,lighthouse,[0,7.1,0],[1,1,1],[0,0,0],false);
mesh(new THREE.ConeGeometry(1.7,1.1,12),M.scarf,lighthouse,[0,8.25,0],[1,1,1],[0,0,0],false);
box(lighthouse,M.dark,[0,.9,1.38],[.6,1.6,.1],.04);
const boats=[];
for(let i=0;i<3;i++) {
  const g=new THREE.Group();g.position.set(-36+i*38,-.12,-45-i*24);g.rotation.y=.5+i*.8;distant.add(g);
  ball(g,i%2?M.peach:M.teal,[0,0,0],[1.45,.35,.55],12);
  rod(g,M.wood,[0,0,0],[0,4.1,0],.038);
  const sail=flatTriangle(g,M.white,[[.05,.9],[.05,3.95],[2.1,.9]],.02);sail.position.z=.01;
  const sail2=flatTriangle(g,M.cream,[[-.08,1.1],[-.08,3.8],[-1.05,1.1]],.02);
  boats.push(g);
}
const clouds=[];
for(let i=0;i<8;i++) {
  const g=new THREE.Group();g.position.set(-190+i*56,24+(i%3)*7,-200-(i%2)*70);scene.add(g);
  for(let j=0;j<5;j++)ball(g,M.white,[(j-2)*3.3,Math.sin(j*1.4)*1.5,0],[5,2.2+Math.sin(j)*.6,2.3],12);
  g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}}); clouds.push(g);
}
const gulls=[];
for(let i=0;i<7;i++) {
  const g=new THREE.Group();scene.add(g);
  ball(g,M.white,[0,0,0],[.25,.12,.085],12);
  const wings=[];
  for(const s of [-1,1]) {const pivot=new THREE.Group();g.add(pivot);const wing=flatTriangle(pivot,M.white,[[0,0],[s*.8,-.12],[s*.16,-.23]],.018);wing.rotation.x=Math.PI/2;wings.push(pivot);}
  gulls.push({g,wings,phase:i*1.7});
}

// Vehicle and rider are built below; wheel spin is driven by travelled distance.
const vehicle=new THREE.Group();scene.add(vehicle);
const chassis=new THREE.Group();vehicle.add(chassis);
const wheelRadius=.36,wheelbase=1.75;
function wheel(parent,x) {
  const g=new THREE.Group();g.position.set(x,wheelRadius,0);parent.add(g);
  mesh(new THREE.TorusGeometry(.285,.075,12,32),M.tire,g);
  mesh(new THREE.CylinderGeometry(.235,.235,.12,24),M.metal,g,[0,0,0],[1,1,1],[Math.PI/2,0,0]);
  for(const z of [-.067,.067]) {
    mesh(new THREE.TorusGeometry(.218,.018,6,24),M.hub,g,[0,0,z]);
    for(let k=0;k<6;k++) {
      const a=k*Math.PI/3;
      rod(g,M.hub,[Math.cos(a)*.035,Math.sin(a)*.035,z],[Math.cos(a+.16)*.2,Math.sin(a+.16)*.2,z],.021,.014,6);
    }
    mesh(new THREE.CylinderGeometry(.06,.06,.017,16),M.cream,g,[0,0,z*1.15],[1,1,1],[Math.PI/2,0,0]);
    for(let k=0;k<12;k++) {const a=k*Math.PI/6;box(g,M.tire,[Math.cos(a)*.3,Math.sin(a)*.3,z*.73],[.05,.018,.018],.003,[0,0,a]);}
  }
  return g;
}
const rearWheel=wheel(vehicle,-.87);
const steering=new THREE.Group();steering.position.set(.88,0,0);vehicle.add(steering);
const frontWheel=wheel(steering,0);
// Rounded battery enclosure, floorboard and rear bodywork.
box(chassis,M.mint,[-.55,.69,0],[1.03,.59,.72],.20);
box(chassis,M.mint,[.04,.49,0],[1.7,.16,.70],.07);
box(chassis,M.dark,[.02,.59,0],[.95,.055,.53],.02);
for(let i=0;i<7;i++)box(chassis,M.mintDark,[-.35+i*.1,.621,0],[.018,.009,.40],.002);
box(chassis,M.seat,[-.52,1.025,0],[.89,.18,.71],.08);
box(chassis,M.cream,[-.52,.953,0],[.91,.045,.68],.02);
box(chassis,M.mintDark,[-.91,.78,0],[.43,.07,.77],.03);
rod(chassis,M.metal,[-.83,.43,.20],[-.56,.88,.20],.06);
rod(chassis,M.metal,[-.83,.43,-.20],[-.56,.88,-.20],.06);
box(chassis,M.red,[-1.09,.85,0],[.065,.15,.28],.035);
box(chassis,M.dark,[-1.12,.63,0],[.055,.21,.34],.015,[0,0,-.18]);
box(chassis,M.cream,[-1.155,.64,0],[.012,.12,.26],.01,[0,0,-.18]);
// Small electric badge: a geometric lightning bolt on each side.
for(const s of [-1,1]) {
  const emblem=flatTriangle(chassis,M.cream,[[-.10,.07],[.07,.07],[-.07,-.07]],.01);
  emblem.position.set(-.58,.71,s*.367);if(s<0)emblem.rotation.y=Math.PI;
  const emblem2=flatTriangle(chassis,M.cream,[[.06,.07],[.10,-.07],[-.07,-.07]],.01);
  emblem2.position.copy(emblem.position);emblem2.rotation.copy(emblem.rotation);
  // Rear luggage rail.
  tube(chassis,M.hub,[[-.87,1.01,s*.40],[-1.10,1.12,s*.4],[-1.13,1.14,0]],.025);
}
const basket=new THREE.Group();basket.position.set(-1.10,1.27,0);chassis.add(basket);
box(basket,M.woodLight,[0,0,0],[.40,.27,.52],.03);
for(let i=0;i<4;i++)for(const s of [-1,1])box(basket,M.wood,[-.14+i*.092,0,s*.265],[.021,.25,.015],.003);
box(basket,M.cream,[.02,.135,0],[.25,.11,.36],.04);
// A little baguette and beach towel in the rear basket.
ball(basket,M.sand,[-.04,.25,.06],[.07,.25,.07],12).rotation.z=-.4;
for(let i=0;i<3;i++)box(basket,M.woodLight,[-.04+i*.045,.27+i*.055,.123],[.08,.018,.01],.005,[0,0,.45]);
box(basket,M.teal,[.05,.21,-.13],[.29,.16,.13],.05);

box(chassis,M.mint,[.57,1.0,0],[.26,.87,.66],.11,[0,0,.10]);
box(chassis,M.cream,[.715,1.0,0],[.025,.52,.40],.03,[0,0,.10]);
box(chassis,M.mintDark,[.72,1.13,0],[.03,.11,.25],.02,[0,0,.10]);
for(const s of [-1,1])rod(steering,M.metal,[0,.36,s*.15],[-.14,1.37,s*.15],.042);
// Front fender is a true curved arch over the rotating tire.
mesh(new THREE.TorusGeometry(.40,.061,9,24,Math.PI),M.mint,steering,[0,.35,0],[1,1,2.0]);
mesh(new THREE.TorusGeometry(.4,.055,8,20,Math.PI),M.mint,chassis,[-.87,.35,0],[1,1,2]);
rod(steering,M.metal,[-.14,1.2,0],[-.18,1.59,0],.047);
box(steering,M.mint,[-.11,1.48,0],[.38,.26,.50],.095);
mesh(new THREE.CylinderGeometry(.16,.16,.08,24),M.hub,steering,[.095,1.49,0],[1,1,1],[0,0,-Math.PI/2]);
mesh(new THREE.CylinderGeometry(.137,.137,.035,24),M.lamp,steering,[.145,1.49,0],[1,1,1],[0,0,-Math.PI/2]);
ball(steering,M.glint,[.172,1.49,0],[.018,.104,.104],16);
rod(steering,M.hub,[-.18,1.59,-.49],[-.18,1.59,.49],.038);
const gripPoints=[];
for(const s of [-1,1]) {
  rod(steering,M.dark,[-.18,1.59,s*.35],[-.18,1.59,s*.51],.052);
  rod(steering,M.hub,[-.14,1.55,s*.38],[-.035,1.55,s*.47],.016);
  tube(steering,M.metal,[[-.16,1.59,s*.35],[-.14,1.8,s*.50],[-.11,1.91,s*.55]],.017);
  ball(steering,M.mint,[-.1,1.95,s*.55],[.07,.105,.14],16);
  ball(steering,M.glass,[-.073,1.95,s*.55],[.048,.083,.112],16);
  const gp=new THREE.Object3D();gp.position.set(-.18,1.61,s*.44);steering.add(gp);gripPoints.push(gp);
}
box(steering,M.dark,[-.26,1.62,0],[.14,.05,.20],.03,[0,0,.2]);
box(steering,M.teal,[-.26,1.655,0],[.095,.012,.14],.02,[0,0,.2]);

const rider=new THREE.Group();chassis.add(rider);
const torso=ball(rider,M.shirt,[-.40,1.52,0],[.34,.47,.30],24);torso.rotation.z=-.13;
ball(rider,M.orange,[-.51,1.12,0],[.31,.23,.29],20);
// Hoodie trim and central zipper.
tube(rider,M.mintDark,[[-.35,1.17,-.27],[-.20,1.19,0],[-.35,1.17,.27]],.025);
tube(rider,M.woodLight,[[-.08,1.32,0],[-.045,1.55,0],[-.10,1.76,0]],.008);
for(const s of [-1,1]) {
  ball(rider,M.orange,[-.26,1.06,s*.24],[.28,.17,.15],18).rotation.z=-.4;
  rod(rider,M.orange,[-.05,.89,s*.27],[.24,.57,s*.28],.105,.12,14);
  ball(rider,M.muzzle,[.28,.56,s*.29],[.19,.09,.14],18);
  for(let j=0;j<2;j++)tube(rider,M.stripe,[[.33,.60,s*.27+(j-.5)*.08],[.41,.595,s*.27+(j-.5)*.08]],.007);
}
const head=new THREE.Group();head.position.set(-.17,2.08,0);rider.add(head);
ball(head,M.orange,[0,0,0],[.43,.43,.39],28);
ball(head,M.orange,[.05,-.19,0],[.38,.24,.37],24);
// Forward-facing cream muzzle, glossy eyes, nose, mouth and whiskers.
for(const s of [-1,1]) {
  ball(head,M.muzzle,[.365,-.115,s*.115],[.13,.12,.15],20);
  ball(head,M.eyes,[.347,.105,s*.206],[.065,.12,.092],24);
  ball(head,M.glint,[.407,.152,s*.203],[.020,.030,.023],14);
  ball(head,M.glint,[.409,.080,s*.23],[.012,.015,.012],10);
  ball(head,M.pink,[.315,-.11,s*.288],[.02,.04,.06],14);
  for(let j=0;j<3;j++) {
    const y=-.14+(j-1)*.048;
    tube(head,M.dark,[[.414,y,s*.20],[.425,y+(j-1)*.025,s*.37],[.391,y+(j-1)*.054,s*.52]],.006);
  }
  for(let j=0;j<2;j++)tube(head,M.stripe,[[.16,.01-j*.115,s*.355],[.04,-.015-j*.115,s*.385],[-.04,-.04-j*.10,s*.373]],.027);
  const ear=new THREE.Group();ear.position.set(.01,.29,s*.39);head.add(ear);
  const e=flatTriangle(ear,M.orange,[[-.19,0],[.19,0],[-s*.06,.34]],.075);e.rotation.y=Math.PI/2;e.position.x=.0;
  const inner=flatTriangle(ear,M.pink,[[-.12,.045],[.12,.045],[-s*.044,.27]],.008);inner.rotation.y=Math.PI/2;inner.position.x=.083;
  ball(head,M.orange,[.01,.29,s*.36],[.12,.12,.16],16);
}
ball(head,M.pink,[.494,-.05,0],[.041,.027,.047],16);
tube(head,M.dark,[[.497,-.073,0],[.490,-.132,0]],.009);
for(const s of [-1,1])tube(head,M.dark,[[.49,-.13,0],[.475,-.157,s*.05],[.45,-.141,s*.08]],.007);
// Forehead tabby markings peek below the helmet rim.
for(const s of [-1,1])tube(head,M.stripe,[[.31,.27,s*.08],[.36,.23,s*.115],[.35,.20,s*.135]],.023);
const helmet=mesh(new THREE.SphereGeometry(.456,32,20,0,Math.PI*2,0,Math.PI*.47),M.cream,head,[0,.145,0],[1,1,.97]);
mesh(new THREE.TorusGeometry(.451,.024,8,32),M.mintDark,head,[0,.189,0],[1,1,.97],[Math.PI/2,0,0]);
tube(head,M.mintDark,[[-.43,.21,0],[-.34,.45,0],[0,.602,0],[.34,.45,0],[.43,.21,0]],.038);
for(const s of [-1,1])tube(head,M.seat,[[-.04,.15,s*.4],[-.03,-.15,s*.34],[.05,-.30,s*.14],[.11,-.32,0]],.018);
box(head,M.metal,[.10,-.315,.13],[.07,.05,.10],.014);

const arms=[];
for(const s of [-1,1]) {
  const shoulder=new THREE.Vector3(-.27,1.74,s*.285);
  const upper=mesh(new THREE.CylinderGeometry(.105,.12,1,14),M.shirt,rider);
  const fore=mesh(new THREE.CylinderGeometry(.073,.09,1,14),M.orange,rider);
  const elbow=ball(rider,M.orange,[0,0,0],[.09,.09,.09],16);
  const hand=ball(rider,M.muzzle,[0,0,0],[.115,.10,.105],20);
  const cuff=ball(rider,M.mintDark,[0,0,0],[.107,.07,.107],16);
  arms.push({s,shoulder,upper,fore,elbow,hand,cuff,target:new THREE.Vector3()});
}
function placeLimb(obj,a,b) {
  const dir=new THREE.Vector3().subVectors(b,a),length=dir.length();
  obj.position.copy(a).add(b).multiplyScalar(.5);obj.scale.set(1,length,1);
  obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());
}
const tailGeo=new THREE.BufferGeometry(),tailPos=[],tailIndex=[],tailN=25,tailR=8;
for(let i=0;i<=tailN;i++)for(let j=0;j<tailR;j++)tailPos.push(0,0,0);
for(let i=0;i<tailN;i++)for(let j=0;j<tailR;j++){const a=i*tailR+j,b=i*tailR+(j+1)%tailR;tailIndex.push(a,a+tailR,b,b,a+tailR,b+tailR);}
tailGeo.setAttribute('position',new THREE.Float32BufferAttribute(tailPos,3));tailGeo.setIndex(tailIndex);
const tail=mesh(tailGeo,M.orange,rider);
const tailBands=[];
for(let j=0;j<4;j++) {const ring=mesh(new THREE.TorusGeometry(.079,.017,6,12),M.stripe,rider);ring.rotation.y=Math.PI/2;tailBands.push(ring);}
function tailCenter(u,t) {return new THREE.Vector3(-.62-u*.92,1.20+Math.sin(u*2.7)*.31,.29+Math.sin(t*2+u*3)*u*.17);}
function animateTail(t) {
  const p=tailGeo.attributes.position;
  for(let i=0;i<=tailN;i++) {
    const u=i/tailN,c=tailCenter(u,t),rad=.086*(1-u*.67);
    for(let j=0;j<tailR;j++){const a=j/tailR*Math.PI*2;p.setXYZ(i*tailR+j,c.x,c.y+Math.cos(a)*rad,c.z+Math.sin(a)*rad);}
  }
  p.needsUpdate=true;tailGeo.computeVertexNormals();
  for(let j=0;j<4;j++){const u=.35+j*.17,c=tailCenter(u,t);tailBands[j].position.copy(c);tailBands[j].scale.setScalar(1-u*.67);}
}
// Wind-blown scarf is a deformed ribbon, not a prerecorded texture.
tube(rider,M.scarf,[[-.33,1.79,-.25],[-.07,1.82,0],[-.33,1.79,.25]],.073);
ball(rider,M.scarf,[-.51,1.82,.27],[.11,.10,.10],14);
const scarfGeo=new THREE.BufferGeometry(),scarfPos=[],scarfIx=[];
for(let i=0;i<=18;i++){scarfPos.push(0,0,0,0,0,0);if(i<18){const a=i*2;scarfIx.push(a,a+1,a+2,a+1,a+3,a+2);}}
scarfGeo.setAttribute('position',new THREE.Float32BufferAttribute(scarfPos,3));scarfGeo.setIndex(scarfIx);
const scarfMat=M.scarf.clone();scarfMat.side=THREE.DoubleSide;
const scarf=mesh(scarfGeo,scarfMat,rider);
function animateScarf(t) {
  const p=scarfGeo.attributes.position;
  for(let i=0;i<=18;i++) {const u=i/18,x=-.49-u*.88,y=1.82+.07*Math.sin(t*5-u*5)*u+.10*u,z=.27+u*.1,w=.105*(1-u*.22);p.setXYZ(i*2,x,y-w,z);p.setXYZ(i*2+1,x,y+w,z+.025);}
  p.needsUpdate=true;scarfGeo.computeVertexNormals();
}
const hornRings=[];
for(let i=0;i<3;i++) {const m=mesh(new THREE.TorusGeometry(.20,.015,6,28),new THREE.MeshBasicMaterial({color:'#fff6c3',transparent:true,opacity:0,depthWrite:false}),steering,[.25,1.5,0],[1,1,1],[0,Math.PI/2,0],false);m.visible=false;hornRings.push(m);}

const eyeObjects=[];head.traverse(o=>{if(o.isMesh&&(o.material===M.eyes||o.material===M.glint))eyeObjects.push({o,sy:o.scale.y});});
let pausedByHidden=false, lastTime=performance.now(), toastTimer, dragging=false, audioContext;
const viewNames=['随行视角','侧面视角','海岸全景'];
const viewOffsets=[new THREE.Vector3(6.0,3.65,7.7),new THREE.Vector3(.1,3.05,9.2),new THREE.Vector3(9,10.5,17.5)];
const desiredCamera=new THREE.Vector3(),desiredTarget=new THREE.Vector3();
const mobile=()=>innerWidth<600;
function cameraOffset() {const v=viewOffsets[Math.max(0,state.view)].clone();if(mobile()){v.multiplyScalar(1.27);v.y+=.5;}return v;}
camera.position.copy(cameraOffset()).add(new THREE.Vector3(0,0,1.5));controls.update();
controls.addEventListener('start',()=>{dragging=true;state.view=-1;$('viewLabel').textContent='自由视角';$('view').setAttribute('aria-label','切换镜头，当前自由视角');});
controls.addEventListener('end',()=>{dragging=false;});
function toast(msg) {clearTimeout(toastTimer);$('toast').textContent=msg;$('toast').classList.add('visible');toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2200);}
function updatePlayUI() {
  $('play').setAttribute('aria-pressed',String(state.paused));
  $('play').setAttribute('aria-label',state.paused?'继续骑行':'暂停骑行');
  $('playIcon').innerHTML=state.paused?'<path d="m9 5 10 7-10 7z" fill="currentColor" stroke="none"/>':'<path d="M8 6v12M16 6v12" stroke-width="3"/>';
  $('weather').textContent=state.paused?'停一停，看看海':state.sunset?'落日兜风中':'海风正好';
  $('speedReadout').textContent=state.paused?'0':state.kmh;
}
$('play').addEventListener('click',()=>{state.paused=!state.paused;if(!state.paused){clearTimeout(toastTimer);$('toast').classList.remove('visible');}updatePlayUI();});
$('speedControl').addEventListener('input',e=>{state.kmh=Number(e.target.value);$('speedLabel').textContent=state.kmh+' km/h';e.target.setAttribute('aria-valuetext',state.kmh+' 千米每小时');updatePlayUI();});
$('view').addEventListener('click',()=>{state.view=(state.view+1)%3;$('viewLabel').textContent=viewNames[state.view];$('view').setAttribute('aria-label','切换镜头，当前'+viewNames[state.view]);toast(viewNames[state.view]+' · 拖动可自由环视');});
$('sunset').addEventListener('click',()=>{state.sunset=!state.sunset;$('sunset').setAttribute('aria-pressed',String(state.sunset));$('sunset').setAttribute('aria-label',state.sunset?'切换晴日':'切换黄昏');$('lightLabel').textContent=state.sunset?'黄昏':'晴日';updatePlayUI();});
async function horn() {
  state.hornTime=performance.now()/1000;toast('滴滴～海边借过！');
  try {
    audioContext??=new (window.AudioContext||window.webkitAudioContext)();await audioContext.resume();
    const start=audioContext.currentTime;
    for(let i=0;i<2;i++) {
      const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.setValueAtTime(i?660:550,start+i*.14);
      g.gain.setValueAtTime(0,start+i*.14);g.gain.linearRampToValueAtTime(.09,start+i*.14+.018);g.gain.exponentialRampToValueAtTime(.001,start+i*.14+.13);
      o.connect(g);g.connect(audioContext.destination);o.start(start+i*.14);o.stop(start+i*.14+.14);
    }
  } catch { /* The visual horn remains available if the browser disables sound. */ }
}
$('horn').addEventListener('click',horn);
window.addEventListener('keydown',e=>{
  if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(e.code==='Space'){e.preventDefault();$('play').click();}
  if(e.code==='KeyC')$('view').click();if(e.code==='KeyL')$('sunset').click();if(e.code==='KeyH')horn();
});
document.addEventListener('visibilitychange',()=>{pausedByHidden=document.hidden;lastTime=performance.now();});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();state.paused=true;updatePlayUI();$('errorMessage').textContent='浏览器的三维画面暂时中断。重新打开页面即可继续海岸骑行。';$('error').style.display='grid';});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
updatePlayUI();

const colorCache={
  fogDay:new THREE.Color('#bfdfe2'),fogNight:new THREE.Color('#e5b49a'),
  skyDay:new THREE.Color('#7ebcc9'),skyNight:new THREE.Color('#8da5be'),
  horizonDay:new THREE.Color('#fff0cb'),horizonNight:new THREE.Color('#ffc591'),
  lightDay:new THREE.Color('#fff4d4'),lightNight:new THREE.Color('#ffc29a'),
  hemiDay:new THREE.Color('#eff8e6'),hemiNight:new THREE.Color('#e5d6c5')
};
const armWorld=new THREE.Vector3();
let maxGripError=0;
function updateRider(t) {
  rider.position.y=.008*Math.sin(t*6.5);
  head.rotation.y=.06*Math.sin(t*.8);head.rotation.z=.012*Math.sin(t*1.7);
  const blinkPhase=t%5.1,blink=blinkPhase>4.85?Math.max(.09,Math.abs(blinkPhase-4.975)/.125):1;
  for(const {o,sy} of eyeObjects)o.scale.y=sy*blink;
  animateTail(t);animateScarf(t);
  vehicle.updateMatrixWorld(true);
  maxGripError=0;
  arms.forEach((a,i)=>{
    gripPoints[i].getWorldPosition(a.target);rider.worldToLocal(a.target);
    const elbow=new THREE.Vector3(.08,1.43+a.s*.01,a.s*.38);
    placeLimb(a.upper,a.shoulder,elbow);placeLimb(a.fore,elbow,a.target);
    a.elbow.position.copy(elbow);a.hand.position.copy(a.target);
    a.cuff.position.copy(a.shoulder).lerp(elbow,.66);
    a.hand.updateWorldMatrix(true,false);a.hand.getWorldPosition(armWorld);
    maxGripError=Math.max(maxGripError,armWorld.distanceTo(gripPoints[i].getWorldPosition(new THREE.Vector3())));
  });
}
function updateWorld(t) {
  const span=tileLength*tileCount;
  tiles.forEach((g,i)=>{g.position.x=((i*tileLength-state.distance+span*.5)%span+span)%span-span*.5;});
  asphaltTexture.offset.x=state.distance/520*220;
  const wavePhase=state.distance*.009;
  distant.position.x=-Math.sin(wavePhase)*9;
  oceanUniforms.time.value=t;oceanUniforms.lightBlend.value=state.lightBlend;
  foam.forEach((f,k)=>{
    const a=f.geometry.attributes.position;
    for(let i=0;i<a.count;i++){const x=a.getX(i);a.setY(i,-.10+Math.sin(x*.08+t*.85+k)*.035);a.setZ(i,-16-k*.86-(i%2)*(.14+k*.06)+Math.sin(x*.038+t*.38+k*.5)*.3+Math.sin(t*.75+k)*.38);}
    a.needsUpdate=true;f.material.opacity=(.45+Math.sin(t*.6+k)*.13)*(1-k*.15);
  });
  clouds.forEach((g,i)=>{g.position.x=-190+i*56+Math.sin(t*.035+i)*10;});
  boats.forEach((g,i)=>{g.position.y=-.12+Math.sin(t*.8+i)*.10;g.rotation.z=Math.sin(t*.9+i)*.025;});
  gulls.forEach(({g,wings,phase},i)=>{
    g.position.set(-20+Math.sin(t*.12+phase)*29,9+i%3*2+Math.sin(t*.4+phase),-24-Math.cos(t*.12+phase)*13-i*2);
    g.rotation.y=-t*.12-phase;g.rotation.z=.10*Math.cos(t*.12+phase);
    wings.forEach((w,j)=>{w.rotation.x=(j?1:-1)*(.2+Math.sin(t*4.5+phase)*.35);});
  });
  const elapsed=performance.now()/1000-state.hornTime;
  hornRings.forEach((m,i)=>{const p=elapsed-i*.14;m.visible=p>=0&&p<.7;if(m.visible){m.position.x=.24+p*.9;m.scale.setScalar(1+p*2);m.material.opacity=(1-p/.7)*.7;}});
}
function updateLighting(dt) {
  const target=state.sunset?1:0;
  state.lightBlend+= (target-state.lightBlend)*(reducedMotion?1:1-Math.exp(-dt*2.3));
  const k=state.lightBlend;
  skyUniforms.top.value.lerpColors(colorCache.skyDay,colorCache.skyNight,k);
  skyUniforms.bottom.value.lerpColors(colorCache.horizonDay,colorCache.horizonNight,k);
  scene.fog.color.lerpColors(colorCache.fogDay,colorCache.fogNight,k);
  scene.background.copy(scene.fog.color);
  sunLight.color.lerpColors(colorCache.lightDay,colorCache.lightNight,k);
  sunLight.intensity=3.6-k*1.1;sunLight.position.y=22-k*12;
  hemi.color.lerpColors(colorCache.hemiDay,colorCache.hemiNight,k);hemi.intensity=2.5-k*.65;
  sun.position.y=38-k*26;sun.material.color.set(k>.5?'#ffdb9c':'#fff4ca');
  M.lamp.emissiveIntensity=.25+k*1.2;
  renderer.toneMappingExposure=1.22-k*.06;
}
const probe={};
function recordState() {
  Object.assign(probe,{ready:true,paused:state.paused,kmh:state.kmh,distance:state.distance,time:state.time,
    rearWheelAngle:rearWheel.rotation.z,frontWheelAngle:frontWheel.rotation.z,wheelRadius,steering:steering.rotation.y,
    gripError:maxGripError,view:state.view,sunset:state.sunset,lightBlend:state.lightBlend,frames:state.frames,
    renderCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,webgl2:renderer.capabilities.isWebGL2,
    catPosition:vehicle.position.toArray(),camera:camera.position.toArray(),tailTip:tailCenter(1,state.time).toArray()});
  document.documentElement.dataset.distance=state.distance.toFixed(6);
  document.documentElement.dataset.wheelRotation=rearWheel.rotation.z.toFixed(6);
  document.documentElement.dataset.paused=String(state.paused);
  document.documentElement.dataset.time=state.time.toFixed(6);
  document.documentElement.dataset.frontWheelRotation=frontWheel.rotation.z.toFixed(6);
  document.documentElement.dataset.wheelRadius=String(wheelRadius);
  document.documentElement.dataset.gripError=maxGripError.toExponential(3);
  document.documentElement.dataset.view=String(state.view);
  document.documentElement.dataset.sunset=String(state.sunset);
  document.documentElement.dataset.lightBlend=state.lightBlend.toFixed(5);
  document.documentElement.dataset.frames=String(state.frames);
  document.documentElement.dataset.webgl=String(renderer.capabilities.isWebGL2);
  document.documentElement.dataset.drawCalls=String(renderer.info.render.calls);
}
window.__coastalRide=probe;
function animate(now) {
  requestAnimationFrame(animate);
  const dt=Math.max(0,Math.min((now-lastTime)/1000,.06));lastTime=now;
  const running=!state.paused&&!pausedByHidden;
  if(running) {
    const ds=state.kmh/3.6*dt;state.distance+=ds;state.time+=dt;
    const curvature=-.24/625*Math.sin(state.distance/25);
    const steer=Math.atan(wheelbase*curvature);
    state.wheelRear-=ds/wheelRadius;state.wheelFront-=ds/(wheelRadius*Math.cos(steer));
    steering.rotation.y=-steer;
  }
  const t=state.time;
  vehicle.position.z=1.5+.24*Math.sin(state.distance/25);
  vehicle.rotation.y=-Math.atan(.24/25*Math.cos(state.distance/25));
  vehicle.rotation.x=-.008*Math.sin(state.distance/25)*(state.kmh/18)**2;
  chassis.position.y=.006*Math.sin(t*6.5);
  rearWheel.rotation.z=state.wheelRear;frontWheel.rotation.z=state.wheelFront;
  updateRider(t);updateWorld(t);updateLighting(dt);
  if(state.view>=0&&!dragging) {
    desiredTarget.set(.1,state.view===2?1.3:1.65,vehicle.position.z);
    desiredCamera.copy(cameraOffset()).add(new THREE.Vector3(0,0,vehicle.position.z));
    const f=1-Math.exp(-dt*4);
    camera.position.lerp(desiredCamera,f);controls.target.lerp(desiredTarget,f);
  }
  controls.update();renderer.render(scene,camera);state.frames++;
  if(state.frames%6===0)recordState();
  if(state.frames===2){$('loading').classList.add('fade');setTimeout(()=>$('loading').remove(),650);if(reducedMotion&&state.paused)toast('已暂停 · 点播放开始海岸骑行');recordState();}
}
updateRider(0);updateWorld(0);recordState();requestAnimationFrame(animate);
