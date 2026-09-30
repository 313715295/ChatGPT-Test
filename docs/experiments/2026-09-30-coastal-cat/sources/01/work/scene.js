import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// A fresh, procedural scene. +X is forward; Y is up; the sea lies on -Z.
const $ = id => document.getElementById(id);
const PI = Math.PI, TAU = 2 * PI;
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#b9dbda', 50, 155);
const camera = new THREE.PerspectiveCamera(39,innerWidth/innerHeight,.1,260);
const hemi = new THREE.HemisphereLight('#e4f8ff','#c5ae82',2.5); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff2cd',3.5); sun.position.set(-10,17,8); scene.add(sun);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-18,right:18,top:16,bottom:-16,near:.5,far:65});
sun.shadow.bias=-.00035;sun.shadow.normalBias=.035;
const fill=new THREE.DirectionalLight('#bdefff',.65);fill.position.set(10,5,-15);scene.add(fill);

let rngState=92381;
function rand(a=0,b=1){rngState=(Math.imul(rngState,1664525)+1013904223)>>>0;return a+(rngState/4294967296)*(b-a)}
function mat(color, roughness=.72, metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness})}
const M={mint:mat('#6bcbb6',.3,.15),mintDark:mat('#419582',.4,.12),cream:mat('#fff4d5',.55),orange:mat('#eaa04c',.92),orangeLight:mat('#ffc976'),stripe:mat('#bd6a30'),pink:mat('#e9a297'),nose:mat('#804a3e'),eye:mat('#252d31',.2),white:mat('#fff8e8'),rubber:mat('#28383a',.9),rubberLight:mat('#3f5050'),metal:mat('#b7d1cd',.28,.8),seat:mat('#885640',.85),seatEdge:mat('#654938'),red:mat('#e46347'),yellow:mat('#ffcf78'),asphalt:mat('#626b6d'),sand:mat('#ead3a2'),wetSand:mat('#d0c8a1'),grass:mat('#89b481'),green:mat('#418c6d'),leaf:mat('#68ab72'),leafLight:mat('#9ac778'),trunk:mat('#a78561'),rock:mat('#abbcac'),fence:mat('#faf3d5'),blue:mat('#73bfc7'),navy:mat('#356d75')};
M.leaf.side=THREE.DoubleSide;M.leafLight.side=THREE.DoubleSide;
const sphereGeo = new THREE.SphereGeometry(1,28,20);
const lowSphereGeo = new THREE.IcosahedronGeometry(1,1);
const boxGeo = new THREE.BoxGeometry(1,1,1);
function mesh(g,m,p,x=0,y=0,z=0,cast=true){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;p.add(o);return o}
function ell(p,m,x,y,z,sx,sy,sz,low=false){const o=mesh(low?lowSphereGeo:sphereGeo,m,p,x,y,z);o.scale.set(sx,sy,sz);return o}
function box(p,m,x,y,z,sx,sy,sz,r=0){const g=r?new RoundedBoxGeometry(sx,sy,sz,3,r):boxGeo;const o=mesh(g,m,p,x,y,z);if(!r)o.scale.set(sx,sy,sz);return o}
function rod(p,m,a,b,r=.04,r2=r){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const o=mesh(new THREE.CylinderGeometry(r2,r,d.length(),10),m,p);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o}
function tube(p,m,points,r=.04,segments=24){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),segments,r,8,false),m,p)}
function group(p,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g}
function textTexture(text,bg='#fff1d5',color='#2d6460',w=512,h=192){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`600 ${Math.round(h*.35)}px "Segoe UI","Microsoft YaHei",sans-serif`;ctx.fillText(text,w/2,h/2);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex}

// Soft gradient sky, the sun, and wind-stretched clouds.
const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{uDusk:{value:0}},vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vP;uniform float uDusk;void main(){vec3 d=normalize(vP);float h=smoothstep(-.07,.72,d.y);vec3 top=mix(vec3(.39,.73,.84),vec3(.44,.46,.69),uDusk);vec3 bottom=mix(vec3(.91,.92,.77),vec3(1.,.66,.43),uDusk);vec3 c=mix(bottom,top,h);vec3 sd=normalize(vec3(-.46,.24,-1.));float a=dot(d,sd);c+=vec3(1.,.77,.40)*pow(max(a,0.),80.)*.2;c=mix(c,vec3(1.,.97,.78),smoothstep(.9983,.9988,a));gl_FragColor=vec4(c,1.);#include <colorspace_fragment>\n}`.replace('#include','\n#include')});
mesh(new THREE.SphereGeometry(210,40,24),skyMat,scene,0,0,0,false);
const cloudMat=mat('#fff9e9');
const clouds=[];
for(let i=0;i<11;i++){const c=group(scene,rand(-90,90),rand(15,30),rand(-95,-38));const s=rand(1,2.5);for(let j=0;j<5;j++)ell(c,cloudMat,(j-2)*2,Math.sin(j*1.9)*.4,0,rand(2.2,3.5),rand(.5,1),rand(1,2));c.scale.setScalar(s);mergeStatic(c);clouds.push({g:c,x:c.position.x,phase:rand(0,TAU)});}

// Ocean is real geometry with animated wave displacement and layered foam.
const oceanUniforms={uTime:{value:0},uTravel:{value:0},uDusk:{value:0}};
const waterMat=new THREE.ShaderMaterial({uniforms:oceanUniforms,vertexShader:`uniform float uTime;varying vec3 vP;void main(){vec3 p=position;vec4 world=modelMatrix*vec4(p,1.);world.y+=sin(world.x*.25+world.z*.41+uTime*.9)*.065+sin(world.z*.83-uTime*1.2)*.025;vP=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,fragmentShader:`uniform float uTime;uniform float uTravel;uniform float uDusk;varying vec3 vP;void main(){vec2 p=vP.xz;float depth=clamp((-p.y-8.)/55.,0.,1.);vec3 shallow=vec3(.27,.76,.72);vec3 deep=vec3(.15,.48,.61);vec3 c=mix(shallow,deep,depth);float wave=sin(p.y*2.5+sin(p.x*.14+uTravel*.04)*1.3+uTime*1.4);float broken=sin(p.x*.83+sin(p.y*.39)+uTravel*.13);float foam=smoothstep(.85,1.,wave)*smoothstep(-.2,.6,broken);c=mix(c,vec3(.77,.94,.84),foam*(1.-depth)*.4);float glint=pow(max(0.,sin(p.x*2.7+p.y*3.4+uTime)*sin(p.x*1.3-p.y*1.8-uTime)),18.);c+=glint*.24;float sunpath=exp(-pow((p.x+18.)/(10.+depth*25.),2.));c+=vec3(.23,.2,.09)*sunpath*glint;c=mix(c,c*vec3(1.08,.8,.86)+vec3(.05,.01,0.),uDusk);float fog=smoothstep(50.,160.,length(vP.xz));c=mix(c,mix(vec3(.70,.83,.81),vec3(.91,.67,.49),uDusk),fog);gl_FragColor=vec4(c,1.);\n#include <colorspace_fragment>\n}`});
const ocean=mesh(new THREE.PlaneGeometry(330,190,160,100),waterMat,scene,0,-.42,-103,false);ocean.rotation.x=-PI/2;
box(scene,M.sand,0,-.3,-5.7,240,.55,4.6);
box(scene,M.wetSand,0,-.37,-8.65,240,.32,1.6);
const foamMat=new THREE.MeshBasicMaterial({color:'#f3fff0',transparent:true,opacity:.55,depthWrite:false});
const foams=[];
for(let k=0;k<4;k++){const geo=new THREE.PlaneGeometry(230,.10+k*.04,110,1);const a=geo.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,a.getY(i)+Math.sin(a.getX(i)*.15+k)*.16);const o=mesh(geo,foamMat.clone(),scene,0,-.15,-8.2-k*.7,false);o.rotation.x=-PI/2;foams.push(o)}
box(scene,M.grass,0,-.4,27,240,.6,45);
box(scene,M.sand,0,-.1,4.4,240,.17,1.9);

// Asphalt noise is generated locally; it scrolls at exactly the travelled distance.
const asphaltCanvas=document.createElement('canvas');asphaltCanvas.width=asphaltCanvas.height=256;const ac=asphaltCanvas.getContext('2d');ac.fillStyle='#60686a';ac.fillRect(0,0,256,256);for(let i=0;i<6500;i++){const v=Math.floor(rand(77,119));ac.fillStyle=`rgba(${v},${v+7},${v+8},.35)`;ac.fillRect(rand(0,256),rand(0,256),rand(.5,1.5),1)}
const asphaltTex=new THREE.CanvasTexture(asphaltCanvas);asphaltTex.wrapS=asphaltTex.wrapT=THREE.RepeatWrapping;asphaltTex.repeat.set(80,2.2);asphaltTex.colorSpace=THREE.SRGBColorSpace;
const asphaltMat=mat('#ffffff');asphaltMat.map=asphaltTex;
box(scene,asphaltMat,0,-.09,0,240,.16,6.9);
for(const z of [-3.15,3.15])box(scene,M.cream,0,.003,z,240,.012,.09);
for(const z of [-.12,.12])box(scene,M.yellow,0,.004,z,240,.012,.065);
const roadMarks=[];
for(let i=0;i<35;i++){const o=box(scene,M.cream,i*6-102,.006,0,2.3,.015,.085);o.visible=false;roadMarks.push(o)}

// Distant landforms and small sailboats.
for(let i=0;i<9;i++){const island=ell(scene,i%2?M.rock:M.green,rand(-130,130),-1.9,rand(-105,-68),rand(5,18),rand(2.5,6),rand(4,10),true);island.rotation.y=rand(0,3);}
function sailboat(x,z,s){const g=group(scene,x,-.2,z);g.scale.setScalar(s);const hull=ell(g,M.cream,0,.15,0,1.5,.28,.55);rod(g,M.trunk,[0,.2,0],[0,3.4,0],.035);const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute([.08,.45,0,.08,3.25,0,1.55,.55,0,-.1,.6,0,-.1,2.65,0,-1.15,.6,0],3));geom.computeVertexNormals();const sailMat=mat('#fff7db');sailMat.side=THREE.DoubleSide;mesh(geom,sailMat,g);return g}
const boats=[sailboat(-18,-33,1.1),sailboat(30,-53,.75),sailboat(60,-76,1.3)];

// Repeated road sections keep the journey continuous without resetting the rider.
const sections=[];
function palm(parent,x,z,height=5.3){const p=group(parent,x,0,z);const bend=rand(-.5,.5);tube(p,M.trunk,[[0,0,0],[.1,height*.35,0],[bend,height*.72,.12],[bend+.2,height,.15]],.15,10);for(let k=1;k<9;k++){const y=k/9*height;const ring=mesh(new THREE.TorusGeometry(.153,.013,5,12),M.seat,p,bend*(y/height),y,.06);ring.rotation.x=PI/2;}
  for(let j=0;j<8;j++){const angle=j*TAU/8+rand(-.18,.18);const length=rand(2,3.1);const vertices=[],idx=[];for(let k=0;k<=8;k++){const t=k/8;const r=length*t;const yy=height+.55*Math.sin(t*PI)-1.3*t*t;const width=Math.sin(t*PI)*.4;for(const side of [-1,1])vertices.push(bend+.2+Math.cos(angle)*r+Math.sin(angle)*width*side,yy+(side===1?.02:0),.15+Math.sin(angle)*r-Math.cos(angle)*width*side);if(k<8){const n=k*2;idx.push(n,n+1,n+2,n+1,n+3,n+2)}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(idx);geo.computeVertexNormals();const lm=(j%2?M.leaf:M.leafLight);mesh(geo,lm,p);}
  for(let k=0;k<3;k++)ell(p,M.seat,bend+rand(-.25,.35),height-.2,rand(-.22,.22),.18,.22,.18);return p;
}
function parasol(parent,x,z,color){const p=group(parent,x,0,z);rod(p,M.cream,[0,0,0],[0,2,0],.035);const geom=new THREE.ConeGeometry(1.22,.6,10,1,true);const mats=[color,M.cream];geom.clearGroups();for(let i=0;i<10;i++)geom.addGroup(i*3,3,i%2);const canopy=mesh(geom,mats,p,0,1.85,0);canopy.rotation.y=.3;ell(p,M.cream,0,2.16,0,.07,.09,.07);const towel=box(p,color,.9,.025,.6,.65,.035,1.7,.02);towel.rotation.y=.3;}
function sign(parent,x,z){const s=group(parent,x,0,z);rod(s,M.metal,[0,0,0],[0,2.1,0],.06);box(s,M.mintDark,0,1.75,0,1.65,.63,.10,.08);const sm=new THREE.MeshBasicMaterial({map:textTexture('海岸公路  01','#418a78','#fff6dc',512,160)});mesh(new THREE.PlaneGeometry(1.52,.5),sm,s,0,1.75,.057);}
function mergeStatic(root){root.updateMatrixWorld(true);const inv=root.matrixWorld.clone().invert(),byMaterial=new Map(),sources=[];root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const g=o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(g.index){const ng=g.toNonIndexed();g.dispose();byMaterial.has(o.material)||byMaterial.set(o.material,[]);byMaterial.get(o.material).push(ng)}else{byMaterial.has(o.material)||byMaterial.set(o.material,[]);byMaterial.get(o.material).push(g)}sources.push(o)});for(const o of sources)o.removeFromParent();for(const[m,geos]of byMaterial){const merged=mergeGeometries(geos,false);if(merged){mesh(merged,m,root)}geos.forEach(g=>g.dispose())}}
for(let s=0;s<5;s++){const g=group(scene,(s-2)*40,0,0);for(let i=0;i<10;i++){const x=i*4-18;box(g,M.fence,x,.43,-3.78,.14,.85,.14,.025);box(g,M.fence,x+2,.60,-3.78,4.1,.11,.10,.02);box(g,M.fence,x+2,.30,-3.78,4.1,.08,.08,.015);}
  // Inland palms frame the horizon without obscuring the cat.
  palm(g,-14,7.2,rand(5,6.5));palm(g,5,8.8,rand(5.5,7));palm(g,16,-5.7,rand(4,5.2));
  for(let j=0;j<8;j++){const x=rand(-19,19),z=rand(8,21);ell(g,M.green,x,.3,z,rand(.6,1.5),rand(.6,1.2),rand(.7,1.4),true);ell(g,M.leaf,x+.5,.3,z+.5,.8,.7,.9,true)}
  for(let j=0;j<7;j++){const x=rand(-19,19);ell(g,M.rock,x,.13,-6.8,rand(.16,.5),rand(.15,.3),rand(.17,.4),true)}
  if(s%2===0){parasol(g,-7,-6,M.red);parasol(g,-3.5,-6.5,M.blue);sign(g,10,-4.65)}
  if(s===1||s===4){const h=group(g,0,0,14);box(h,M.cream,0,1.4,0,5,2.8,3,.15);box(h,M.blue,0,2.9,0,5.8,.25,3.8,.08);box(h,M.navy,.8,1.2,1.55,2,1.5,.1,.04);box(h,M.mintDark,-1.5,1.05,1.55,.8,2.05,.1,.04);const labelMat=new THREE.MeshBasicMaterial({map:textTexture('SEA SALT','#fff4dc','#36776e',512,128)});mesh(new THREE.PlaneGeometry(3.2,.7),labelMat,h,0,2.45,1.6);}
  mergeStatic(g);sections.push({g,base:(s-2)*40});}

// A mint electric scooter, built as mechanical assemblies around the wheel axes.
const ride=group(scene,0,0,1.42);
const scooter=group(ride);
const wheelRadius=.40, rearX=-.94,frontX=1.0;
const wheels=[];
for(const x of [rearX,frontX]){const w=group(scooter,x,wheelRadius+.008,0);const tire=mesh(new THREE.TorusGeometry(.30,.10,12,36),M.rubber,w);
  const hub=mesh(new THREE.CylinderGeometry(.20,.20,.19,24),M.metal,w);hub.rotation.x=PI/2;
  for(const z of [-.105,.105]){const rim=mesh(new THREE.TorusGeometry(.25,.035,8,28),M.cream,w,0,0,z);for(let i=0;i<6;i++){const a=i*TAU/6;rod(w,M.mintDark,[Math.cos(a)*.075,Math.sin(a)*.075,z],[Math.cos(a)*.22,Math.sin(a)*.22,z],.025)}const cap=mesh(new THREE.CylinderGeometry(.095,.095,.03,20),M.mintDark,w,0,0,z*1.18);cap.rotation.x=PI/2;}
  for(let i=0;i<18;i++){const a=i*TAU/18;const tread=box(w,M.rubberLight,Math.cos(a)*.398,Math.sin(a)*.398,0,.018,.036,.12,.005);tread.rotation.z=a}
  wheels.push(w);}
box(scooter,M.mint,-.02,.56,0,1.78,.18,.69,.085);
box(scooter,M.rubberLight,.01,.66,0,.91,.045,.56,.02);
for(let i=0;i<6;i++)box(scooter,M.rubber,-.37+i*.14,.688,0,.04,.013,.48,.005);
ell(scooter,M.mint,-.75,.88,0,.66,.40,.43);
ell(scooter,M.mintDark,-.78,.85,.423,.36,.20,.025);
ell(scooter,M.mintDark,-.78,.85,-.423,.36,.20,.025);
box(scooter,M.seatEdge,-.60,1.22,0,1.17,.15,.79,.075);
box(scooter,M.seat,-.60,1.30,0,1.19,.16,.80,.08);
box(scooter,M.cream,-.58,1.275,0,1.19,.025,.81,.01);
const shield=box(scooter,M.mint,.66,1.05,0,.28,1.05,.75,.13);shield.rotation.z=.21;
const innerShield=box(scooter,M.mintDark,.49,1.09,0,.09,.73,.62,.04);innerShield.rotation.z=.21;
ell(scooter,M.mint,1.0,.80,0,.46,.18,.24);
rod(scooter,M.metal,[.97,.43,-.16],[.76,1.39,-.16],.052);
rod(scooter,M.metal,[.97,.43,.16],[.76,1.39,.16],.052);
rod(scooter,M.mintDark,[-.94,.43,.19],[-.54,1.03,.23],.07);
rod(scooter,M.metal,[-.94,.43,-.19],[-.54,1.03,-.23],.055);
rod(scooter,M.mint,[.72,1.34,0],[.60,1.79,0],.10);
const cockpit=group(scooter,.58,1.80,0);
box(cockpit,M.mint,0,0,0,.37,.20,.74,.09);
rod(cockpit,M.metal,[0,0,-.62],[0,0,.62],.043);
for(const z of [-.56,.56]){const grip=mesh(new THREE.CylinderGeometry(.065,.065,.25,14),M.rubber,cockpit,0,0,z);grip.rotation.x=PI/2;rod(cockpit,M.metal,[.11,-.02,z-.07],[.13,-.02,z+.07],.018);rod(cockpit,M.metal,[0,.02,z*.7],[.09,.40,z*1.13],.025);const mirror=ell(cockpit,M.mintDark,.10,.43,z*1.16,.09,.13,.14);ell(cockpit,M.metal,.145,.43,z*1.16,.015,.10,.115);}
const headlight=mesh(new THREE.CylinderGeometry(.15,.16,.12,32),M.cream,cockpit,.21,.02,0);headlight.rotation.z=-PI/2;
const lampMat=new THREE.MeshStandardMaterial({color:'#fff1b5',emissive:'#ffcf66',emissiveIntensity:.5,roughness:.2});const lens=mesh(new THREE.CylinderGeometry(.12,.12,.018,24),lampMat,cockpit,.28,.02,0);lens.rotation.z=-PI/2;
box(scooter,M.red,-1.32,1.02,0,.075,.13,.27,.025);
box(scooter,M.cream,-1.37,.73,0,.035,.18,.26,.015);
for(const z of [-.3,.3])ell(scooter,M.yellow,.82,1.36,z,.08,.045,.06);
const dash=box(cockpit,M.rubber,-.12,.09,0,.11,.025,.26,.015);dash.rotation.z=.3;
const dashMap=textTexture('24','#173e40','#a6f2d7',128,64);const dashScreen=mesh(new THREE.PlaneGeometry(.15,.085),new THREE.MeshBasicMaterial({map:dashMap}),cockpit,-.11,.112,0);dashScreen.rotation.x=-PI/2;
// Lightning badge makes the electric drivetrain visually explicit.
const badgeGeo=new THREE.Shape();badgeGeo.moveTo(-.045,.10);badgeGeo.lineTo(.035,.10);badgeGeo.lineTo(0,.02);badgeGeo.lineTo(.065,.02);badgeGeo.lineTo(-.035,-.12);badgeGeo.lineTo(-.015,-.015);badgeGeo.lineTo(-.07,-.015);badgeGeo.closePath();const bolt=mesh(new THREE.ShapeGeometry(badgeGeo),M.cream,scooter,-.72,.9,.451);bolt.scale.setScalar(1.25);
// Small travel satchel behind the seat.
box(scooter,M.yellow,-1.08,1.52,0,.39,.32,.54,.08);
box(scooter,M.seat,-1.09,1.54,0,.42,.055,.57,.022);
rod(scooter,M.seat,[-1.14,1.67,-.10],[-1.14,1.72,.10],.018);
// Merge rigid meshes while preserving independently rotating wheel groups.
for(const wheel of wheels){wheel.removeFromParent();mergeStatic(wheel)}
mergeStatic(scooter);
for(const wheel of wheels)scooter.add(wheel);

// The tabby rider. Paws are attached to grips; feet rest on the scooter floor.
const cat=group(ride);
ell(cat,M.orange,-.48,1.78,0,.34,.52,.33);
ell(cat,M.cream,-.18,1.80,0,.12,.33,.24);
ell(cat,M.orange,-.67,1.40,0,.36,.22,.33);
for(const side of [-1,1]){const z=side*.29;ell(cat,M.orange,-.43,1.29,z,.25,.25,.18);rod(cat,M.orange,[-.32,1.31,z],[.04,.92,side*.34],.14,.18);rod(cat,M.orange,[.04,.94,side*.34],[.18,.75,side*.34],.12);ell(cat,M.cream,.23,.73,side*.34,.20,.105,.13);
  const shoulder=[-.37,2.08,side*.27],elbow=[.00,1.94,side*.39],paw=[.55,1.83,side*.55];rod(cat,M.orange,shoulder,elbow,.13,.15);ell(cat,M.orange,...elbow,.135,.13,.13);rod(cat,M.orange,elbow,paw,.105,.12);ell(cat,M.cream,...paw,.135,.10,.105);for(let k=0;k<2;k++)tube(cat,M.stripe,[[.16+k*.1,1.91-k*.025,side*.43],[.18+k*.1,1.98-k*.025,side*.42],[.22+k*.1,1.99-k*.025,side*.41]],.017,5);}
const headPivot=group(cat,-.29,2.52,0);
headPivot.rotation.y=-.12;
ell(headPivot,M.orange,0,0,0,.46,.43,.44);
ell(headPivot,M.orangeLight,.14,-.13,0,.35,.28,.37);
function ear(z){const sh=new THREE.Shape();sh.moveTo(-.22,-.11);sh.lineTo(-.10,.20);sh.quadraticCurveTo(-.075,.27,-.035,.20);sh.lineTo(.21,-.10);sh.quadraticCurveTo(0,-.15,-.22,-.11);const geo=new THREE.ExtrudeGeometry(sh,{depth:.12,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:3,steps:1});const e=mesh(geo,M.orange,headPivot,-.02,.35,z);e.rotation.y=PI/2;const inset=new THREE.Shape();inset.moveTo(-.15,-.07);inset.lineTo(-.068,.155);inset.lineTo(.135,-.07);inset.closePath();mesh(new THREE.ShapeGeometry(inset),M.pink,e,0,0,.147);return e}
ear(-.32);ear(.32);
for(const z of [-.17,.17])ell(headPivot,M.cream,.389,-.13,z,.14,.15,.18);
const nose=ell(headPivot,M.nose,.51,-.073,0,.049,.037,.06);
tube(headPivot,M.nose,[[.508,-.104,0],[.513,-.16,0],[.49,-.18,.065]],.009,8);
tube(headPivot,M.nose,[[.513,-.16,0],[.49,-.18,-.065]],.009,8);
const eyes=[];
for(const side of [-1,1]){const eye=ell(headPivot,M.eye,.362,.035,side*.29,.052,.086,.072);eye.rotation.y=side*.48;eyes.push(eye);ell(headPivot,M.white,.403,.065,side*.296,.014,.024,.017);ell(headPivot,M.pink,.35,-.115,side*.322,.023,.055,.075);for(let k=0;k<3;k++)tube(headPivot,M.cream,[[.385,-.13+k*.03,side*.28],[.42,-.14+k*.07,side*.48],[.38,-.16+k*.09,side*.61]],.007,8);}
for(const side of [-1,1])for(let k=0;k<3;k++){const mark=ell(headPivot,M.stripe,-.03-k*.11,.01-k*.08,side*.408,.037,.09,.016);mark.rotation.z=-.35;}
// Open-face helmet: ears remain visible, and a chin strap stays attached.
const helmet=mesh(new THREE.SphereGeometry(.475,32,16,0,TAU,0,PI*.44),M.cream,headPivot,-.01,.08,0);
helmet.scale.set(1.04,.94,1.04);
const helmetBand=mesh(new THREE.TorusGeometry(.475,.028,8,40),M.mintDark,headPivot,-.01,.17,0);helmetBand.rotation.x=PI/2;helmetBand.scale.set(1,.96,1);
const helmetStripe=mesh(new THREE.SphereGeometry(.48,20,16,-.105,.21,0,PI*.44),M.mint,headPivot,-.01,.08,0);helmetStripe.scale.set(1.045,.948,1.045);
box(headPivot,M.mint,.34,.23,0,.29,.045,.67,.022);
for(const side of [-1,1])tube(headPivot,M.seat,[[-.02,.12,side*.45],[.05,-.21,side*.40],[.16,-.37,side*.20],[.25,-.33,0]],.022,16);
// Scarf collar and a flexible ribbon, animated as geometry rather than a flat sprite.
const collar=mesh(new THREE.TorusGeometry(.235,.073,10,28),M.red,cat,-.29,2.21,0);collar.rotation.x=PI/2;
ell(cat,M.red,-.49,2.19,.19,.105,.1,.12);
const scarfGeo=new THREE.PlaneGeometry(1.12,.23,18,2);scarfGeo.rotateY(PI/2);const scarfMat=M.red.clone();scarfMat.side=THREE.DoubleSide;const scarf=mesh(scarfGeo,scarfMat,cat);const scarfBase=scarfGeo.attributes.position.array.slice();
// Tail has a smooth curling silhouette and moving tip; rings are part of the tail.
const tail=group(cat,-.75,1.43,-.13);
const tailPoints=[[0,0,0],[-.42,.06,0],[-.73,.30,.03],[-.87,.65,.06],[-.79,.9,.08],[-.57,1,.10]];
tube(tail,M.orange,tailPoints,.105,32);
for(const t of [.35,.60,.81]){const curve=new THREE.CatmullRomCurve3(tailPoints.map(v=>new THREE.Vector3(...v)));const p=curve.getPoint(t),dir=curve.getTangent(t);const ring=mesh(new THREE.TorusGeometry(.107,.022,6,16),M.stripe,tail,p.x,p.y,p.z);ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),dir);}
ell(tail,M.cream,-.57,1,.10,.11,.105,.106);

// Soft contact shadow complements directional shadows.
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d');const grad=sc.createRadialGradient(64,64,8,64,64,64);grad.addColorStop(0,'rgba(18,39,37,.36)');grad.addColorStop(1,'rgba(18,39,37,0)');sc.fillStyle=grad;sc.fillRect(0,0,128,128);const contact=mesh(new THREE.PlaneGeometry(3.8,1.8),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}),scene,0,.011,1.42,false);contact.rotation.x=-PI/2;

// Gulls flap their wings and bank over the water.
const gulls=[];
for(let i=0;i<6;i++){const g=group(scene,rand(-35,35),rand(7,13),rand(-30,-10));ell(g,M.white,0,0,0,.18,.10,.085);const wings=[];for(const side of [-1,1]){const w=group(g,0,0,0);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([-.10,0,0,.12,0,0,-.08,.06,side*.68,.12,0,0,.03,.02,side*.55,-.08,.06,side*.68],3));geo.computeVertexNormals();const wm=M.white.clone();wm.side=THREE.DoubleSide;mesh(geo,wm,w);wings.push(w)}gulls.push({g,wings,base:g.position.clone(),phase:i*1.7})}

let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
let speedFactor=1, distance=0, simTime=0, last=performance.now(), lastUI=0;
let dusk=false,duskMix=0,cameraMode='coast';
const cameraTarget=new THREE.Vector3(0,1.40,1.42);
const viewPresets={coast:{theta:1.05,phi:1.39,r:12.9,target:new THREE.Vector3(0,1.40,1.42)},close:{theta:.86,phi:1.40,r:7.5,target:new THREE.Vector3(-.05,1.70,1.42)},wide:{theta:1.1,phi:.78,r:24,target:new THREE.Vector3(0,.8,-1.8)}};
let theta=1.05,phi=1.39,radius=12.9,desiredTheta=theta,desiredPhi=phi,desiredRadius=radius;
let dragging=false,lastPointer={x:0,y:0},userOrbit=false;
const pointerPositions=new Map();let pinchDistance=0;
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),1800)}
function syncPause(){ $('play-label').textContent=paused?'继续骑行':'暂停';$('play').setAttribute('aria-label',paused?'继续骑行':'暂停骑行');$('play').setAttribute('aria-pressed',String(paused));$('play-icon').innerHTML=paused?'<path d="m8 4 12 8-12 8Z"/>':'<path d="M9 5v14M15 5v14"/>';$('ride-state').textContent=paused?'停下来，看会儿海':'沿海巡航中';$('speedometer').textContent=paused?'0':String(Math.round(24*speedFactor));}
function setPaused(value){paused=value;syncPause()}
function setView(mode){cameraMode=mode;userOrbit=false;const p=viewPresets[mode];desiredTheta=p.theta;desiredPhi=p.phi;desiredRadius=p.r;for(const b of document.querySelectorAll('[data-camera]'))b.setAttribute('aria-pressed',String(b.dataset.camera===mode));}
$('play').addEventListener('click',()=>setPaused(!paused));
$('speed').addEventListener('input',e=>{speedFactor=Number(e.target.value);$('speed-label').textContent=speedFactor.toFixed(1)+'×';syncPause()});
for(const b of document.querySelectorAll('[data-camera]'))b.addEventListener('click',()=>setView(b.dataset.camera));
$('light').addEventListener('click',()=>{dusk=!dusk;$('light').setAttribute('aria-pressed',String(dusk));$('light').setAttribute('aria-label',dusk?'切换晴日光线':'切换日落光线');toast(dusk?'日落慢一点，海风再吹一会儿':'阳光正好，继续出发')});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('当前浏览器暂不支持全屏')}catch{toast('当前窗口暂不支持全屏')}});
window.addEventListener('keydown',e=>{if(e.target.matches('input,button'))return;if(e.code==='Space'){e.preventDefault();setPaused(!paused)}if(e.key==='1')setView('coast');if(e.key==='2')setView('close');if(e.key==='3')setView('wide')});
canvas.addEventListener('pointerdown',e=>{pointerPositions.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);dragging=true;lastPointer={x:e.clientX,y:e.clientY};userOrbit=true;if(pointerPositions.size===2){const p=[...pointerPositions.values()];pinchDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}});
canvas.addEventListener('pointermove',e=>{if(!pointerPositions.has(e.pointerId))return;pointerPositions.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointerPositions.size===2){const p=[...pointerPositions.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);desiredRadius=THREE.MathUtils.clamp(desiredRadius*pinchDistance/d,5.8,34);pinchDistance=d}else if(dragging){desiredTheta-=(e.clientX-lastPointer.x)*.005;desiredPhi=THREE.MathUtils.clamp(desiredPhi-(e.clientY-lastPointer.y)*.004,.28,1.49)}lastPointer={x:e.clientX,y:e.clientY};});
function endPointer(e){pointerPositions.delete(e.pointerId);dragging=pointerPositions.size>0;if(dragging)lastPointer=[...pointerPositions.values()][0];}canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);
canvas.addEventListener('wheel',e=>{e.preventDefault();desiredRadius=THREE.MathUtils.clamp(desiredRadius*Math.exp(e.deltaY*.001),5.8,34);userOrbit=true},{passive:false});
window.addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
document.addEventListener('visibilitychange',()=>{last=performance.now()});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();setPaused(true);$('error-message').textContent='3D 画面暂时中断，请点击“重新出发”恢复场景。';$('error').style.display='flex'});

function animatePose(){
  // One source of distance drives wheels, asphalt, and passing scenery.
  wheels.forEach(w=>w.rotation.z=-distance/wheelRadius);
  asphaltTex.offset.x=distance/3;
  for(const{g,base}of sections)g.position.x=THREE.MathUtils.euclideanModulo(base-distance+100,200)-100;
  const bob=Math.sin(distance*2.4)*.012+Math.sin(distance*5)*.004;
  scooter.position.y=bob;cat.position.y=bob;
  headPivot.rotation.z=Math.sin(simTime*1.6)*.025;
  headPivot.rotation.y=-.16+Math.sin(simTime*.5)*.07;
  const blinkPhase=simTime%5.5;const blink=blinkPhase>5.22?Math.max(.08,Math.abs(blinkPhase-5.36)/.14):1;
  eyes.forEach(e=>e.scale.y=.086*blink);
  tail.rotation.x=Math.sin(simTime*2.2)*.15;tail.rotation.y=Math.sin(simTime*1.3)*.08;
  const a=scarfGeo.attributes.position;
  for(let i=0;i<a.count;i++){const t=(scarfBase[i*3+2]/1.12)+.5;a.setXYZ(i,-.50-t*1.1,2.2+scarfBase[i*3+1]+Math.sin(t*9-simTime*7)*.095*t,.21+Math.sin(t*6-simTime*5)*.07*t)}a.needsUpdate=true;scarfGeo.computeVertexNormals();
  oceanUniforms.uTime.value=simTime;oceanUniforms.uTravel.value=distance;
  foams.forEach((o,i)=>{o.position.z=-8.2-i*.7+Math.sin(simTime*.65+i)*.23;o.material.opacity=.24+Math.sin(simTime*.65+i)*.12});
  gulls.forEach(({g,wings,base,phase})=>{g.position.set(base.x+Math.sin(simTime*.19+phase)*12,base.y+Math.sin(simTime*.65+phase)*.6,base.z+Math.cos(simTime*.2+phase)*3);g.rotation.y=Math.sin(simTime*.2+phase)*.4;wings[0].rotation.x=Math.sin(simTime*4+phase)*.4;wings[1].rotation.x=-Math.sin(simTime*4+phase)*.4});
  clouds.forEach(({g,x,phase})=>g.position.x=x+Math.sin(simTime*.025+phase)*5);
  boats.forEach((g,i)=>{g.rotation.z=Math.sin(simTime*.9+i)*.04;g.position.y=-.2+Math.sin(simTime+i)*.06;});
}
function updateCamera(dt){const ease=1-Math.exp(-dt*7);theta=THREE.MathUtils.lerp(theta,desiredTheta,ease);phi=THREE.MathUtils.lerp(phi,desiredPhi,ease);radius=THREE.MathUtils.lerp(radius,desiredRadius,ease);cameraTarget.lerp(viewPresets[cameraMode].target,ease);const responsive=innerWidth<600?1.35:1;const r=radius*responsive;camera.position.set(cameraTarget.x+r*Math.sin(phi)*Math.cos(theta),cameraTarget.y+r*Math.cos(phi),cameraTarget.z+r*Math.sin(phi)*Math.sin(theta));camera.lookAt(cameraTarget);}
function updateLighting(dt){duskMix=THREE.MathUtils.lerp(duskMix,dusk?1:0,1-Math.exp(-dt*2.2));skyMat.uniforms.uDusk.value=duskMix;oceanUniforms.uDusk.value=duskMix;sun.color.set('#fff2cd').lerp(new THREE.Color('#ffb478'),duskMix);sun.intensity=3.5-duskMix*.65;hemi.intensity=2.5-duskMix*.65;scene.fog.color.set('#b9dbda').lerp(new THREE.Color('#dba68c'),duskMix);lampMat.emissiveIntensity=.5+duskMix*1.5;}
let frames=0;
function frame(now){const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(!paused&&!document.hidden){simTime+=dt;distance+=(24/3.6)*speedFactor*dt;animatePose()}updateCamera(dt);updateLighting(dt);renderer.render(scene,camera);frames++;if(now-lastUI>120){$('distance').textContent=(distance/1000).toFixed(2);lastUI=now;}requestAnimationFrame(frame)}
syncPause();animatePose();updateCamera(1);updateLighting(1);renderer.render(scene,camera);
$('loading').style.opacity='0';setTimeout(()=>$('loading').remove(),500);
if(innerWidth<760)$('hint').textContent='单指环顾 · 双指缩放 · 轻触切换视角';
// Read-only diagnostics support actual behavior checks without exposing test controls.
window.__coast={snapshot:()=>({ready:true,three:THREE.REVISION,frames,paused,distance,time:simTime,speedFactor,wheelRadius,wheelAngle:wheels[0].rotation.z,frontWheelAngle:wheels[1].rotation.z,camera:cameraMode,cameraPosition:camera.position.toArray(),dusk,duskMix,sections:sections.map(s=>s.g.position.x),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,canvas:[canvas.width,canvas.height],networkFree:true})};
requestAnimationFrame(frame);
