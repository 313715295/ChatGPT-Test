/* River Post — all geometry, textures and audio are generated locally.
   Three.js r160.1 is embedded under its MIT license. No network requests. */
(() => {
'use strict';
const T = THREE, $ = id => document.getElementById(id);
const V = (x=0,y=0,z=0) => new T.Vector3(x,y,z);
const clamp = T.MathUtils.clamp, TAU = Math.PI * 2;
let seed = 48271;
function rand(a=0,b=1){seed=(seed*16807)%2147483647;return a+(b-a)*(seed/2147483647);}
let renderer;
try {
 renderer = new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
} catch(e) {
 $('loading').innerHTML='<strong>需要开启浏览器的 3D 支持</strong><p>请在 Chrome 或 Edge 中开启硬件加速后重新打开。</p>';
 return;
}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;
$('scene').appendChild(renderer.domElement);
renderer.domElement.tabIndex=0;
const scene = new T.Scene();
scene.background=new T.Color('#e9e7d0');
scene.fog=new T.Fog('#e1e4ce',24,85);
const camera=new T.PerspectiveCamera(35,innerWidth/innerHeight,.1,220);
const cameraState={theta:.28,phi:1.39,size:8.3,target:V(0,1.6,-2.6)};
const cameraGoal={theta:.28,phi:1.39,size:8.3,target:V(0,1.6,-2.6)};
const hemi=new T.HemisphereLight('#fff3dd','#7f9b75',1.8);scene.add(hemi);
const sunLight=new T.DirectionalLight('#ffe1ae',2.8);
sunLight.position.set(-7,11,6);sunLight.target.position.set(0,0,-2);
sunLight.castShadow=true;sunLight.shadow.mapSize.set(2048,2048);
Object.assign(sunLight.shadow.camera,{left:-17,right:17,top:15,bottom:-15,near:.5,far:45});
sunLight.shadow.normalBias=.035;sunLight.shadow.bias=-.00018;
scene.add(sunLight,sunLight.target);
const fill=new T.DirectionalLight('#d4ebe2',.65);fill.position.set(7,5,-8);scene.add(fill);

const materialCache=new Map();
function mat(c,roughness=.78,metalness=0){const key=c+':'+roughness+':'+metalness;if(!materialCache.has(key))materialCache.set(key,new T.MeshStandardMaterial({color:c,roughness,metalness}));return materialCache.get(key);}
const M={fur:mat('#805338'),furLight:mat('#946244'),cream:mat('#e7cda3'),muzzle:mat('#f4dfb5'),nose:mat('#352820',.42),eye:mat('#201c18',.21),pink:mat('#c27c62'),teal:mat('#3d8b80',.32,.27),trim:mat('#ebcf8c',.3,.55),tire:mat('#343d39'),rim:mat('#d2cab4',.36,.7),spoke:mat('#9aada0',.38,.72),leather:mat('#7f4a34'),scarf:mat('#cc654c'),scarfLight:mat('#e6996a'),wood:mat('#997153'),woodDark:mat('#674f40'),stone:mat('#cdc5aa'),grass:mat('#8f9a6f'),bank:mat('#bdc1a0')};
const sphereGeo=new T.SphereGeometry(1,28,20), smallSphereGeo=new T.SphereGeometry(1,14,10), boxGeo=new T.BoxGeometry(1,1,1), cylGeo=new T.CylinderGeometry(1,1,1,12);
function mesh(parent,geo,material,x=0,y=0,z=0,sx=1,sy=1,sz=1,shadow=true){const o=new T.Mesh(geo,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=shadow;o.receiveShadow=shadow;parent.add(o);return o;}
function ell(parent,m,p,s,small=false,shadow=true){return mesh(parent,small?smallSphereGeo:sphereGeo,m,...p,...s,shadow);}
function box(parent,m,p,s,shadow=true){return mesh(parent,boxGeo,m,...p,...s,shadow);}
function rod(parent,a,b,r,m,shadow=true){a=Array.isArray(a)?V(...a):a;b=Array.isArray(b)?V(...b):b;const o=mesh(parent,cylGeo,m,0,0,0,r,a.distanceTo(b),r,shadow);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());return o;}
function tube(parent,points,r,m,segments=32,shadow=true){const curve=new T.CatmullRomCurve3(points.map(p=>Array.isArray(p)?V(...p):p));return mesh(parent,new T.TubeGeometry(curve,segments,r,8,false),m,0,0,0,1,1,1,shadow);}
const roundCache=new Map();
function roundGeo(w,h,d,r=.06){const key=[w,h,d,r].join(',');if(roundCache.has(key))return roundCache.get(key);r=Math.min(r,w/2,h/2,d/2);const s=new T.Shape();const x=-w/2,y=-h/2;
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
 const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r*.55,bevelSegments:3,steps:1,curveSegments:5});g.translate(0,0,-d/2+r);roundCache.set(key,g);return g;
}
function rounded(parent,m,p,s,r=.06){return mesh(parent,roundGeo(...s,r),m,...p);}
const moving=[];
function drift(group,x,span=96){group.position.x=x;moving.push({group,x,span});return group;}
function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return tex;}

// An atmospheric backdrop, without external images.
const sky=new T.Mesh(new T.SphereGeometry(140,24,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#b8d2c5')},bottom:{value:new T.Color('#f6e8c9')}},vertexShader:'varying float vY; void main(){vY=position.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying float vY;void main(){float h=smoothstep(-10.,72.,vY);gl_FragColor=vec4(mix(bottom,top,h),1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));
// Shader include directives must start on their own line.
sky.material.fragmentShader=sky.material.fragmentShader.replace(';#include',';\n#include');scene.add(sky);
const sun=mesh(scene,new T.SphereGeometry(3.4,32,16),new T.MeshBasicMaterial({color:'#fff0bc'}),0,8,-54,1,1,.2,false);
const cloudMat=mat('#f7eedb');
for(let k=0;k<8;k++){const g=new T.Group();g.position.set(rand(-45,45),rand(9,16),rand(-55,-35));for(let j=0;j<4;j++)ell(g,cloudMat,[j*1.35,Math.sin(j)*.3,0],[1.9,rand(.4,.75),.7],true,false);scene.add(g);}
const hillColors=['#b3bea1','#a8b79a','#9eae90'];
for(let i=0;i<14;i++)ell(scene,mat(hillColors[i%3]),[-65+i*10,-1.4,-40-rand(0,8)],[rand(8,14),rand(3,6),rand(5,8)],false,false);

// River, towpath, meadow and the continuous stone edge.
box(scene,mat('#9fa782'),[0,-.37,4.6],[240,.55,13]);
box(scene,mat('#b1b58b'),[0,-.24,-1.65],[240,.3,1.2]);
box(scene,mat('#a3ad88'),[0,-.29,-19],[240,.42,13.2]);
const pathTexture=canvasTexture(512,256,(c,w,h)=>{c.fillStyle='#d4c5a5';c.fillRect(0,0,w,h);for(let i=0;i<4800;i++){const v=rand(0,1);c.fillStyle=v>.5?'rgba(114,98,76,.075)':'rgba(255,251,225,.17)';c.fillRect(rand(0,w),rand(0,h),rand(1,3),rand(1,3));} });
pathTexture.wrapS=pathTexture.wrapT=T.RepeatWrapping;pathTexture.repeat.set(55,1);
const pathMat=new T.MeshStandardMaterial({map:pathTexture,roughness:1});
box(scene,pathMat,[0,-.055,0],[240,.1,3.1]);
const riverUniforms={time:{value:0},shift:{value:0},light:{value:new T.Color('#afc9ad')},deep:{value:new T.Color('#578f8a')}};
const water=new T.Mesh(new T.PlaneGeometry(240,10.4,90,15),new T.ShaderMaterial({uniforms:riverUniforms,vertexShader:`uniform float time; varying vec3 vP; void main(){vec3 p=position;p.z+=sin(p.x*.55+time*.8)*.015+cos(p.y*1.5+time*.6)*.016;vP=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float time;uniform float shift;uniform vec3 light;uniform vec3 deep;varying vec3 vP;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
 void main(){vec2 p=vP.xy;p.x+=shift*.2;float waves=sin(p.y*7.+sin(p.x*.75+time*.7)*.65+time*.9);float fine=sin(p.y*23.+p.x*2.+time*1.7);float mask=smoothstep(-.1,.8,sin(p.x*.8+p.y*.9)*cos(p.x*.25-p.y*.4));float stripe=smoothstep(.96,1.,waves)*mask*.44;float caustic=smoothstep(.96,1.,fine)*mask*.06;float n=hash(floor(p*9.))* .02;vec3 c=mix(deep,light,.31+.065*sin(p.y*.9+p.x*.12)+stripe+caustic+n);gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`}));
water.rotation.x=-Math.PI/2;water.position.set(0,-.245,-7.4);scene.add(water);
const edge=new T.Group();
for(let i=0;i<480;i++){const b=box(edge,M.stone,[-120+i*.5,-.08,-2.05],[.48,.34,.34],false);b.rotation.y=rand(-.045,.045);}
drift(edge,0,80);scene.add(edge);
const farEdge=new T.Group();
for(let i=0;i<330;i++)box(farEdge,M.bank,[-132+i*.8,-.18,-12.73],[.78,.29,.5],false);
drift(farEdge,0,88);scene.add(farEdge);

// A real bicycle: two wheels, frame triangles, crank, chain, fenders, rack.
const bike=new T.Group();bike.position.set(0,.028,0);bike.scale.setScalar(1.23);scene.add(bike);
const wheelRadius=.55, rearX=-.9, frontX=.94, axleY=.565;
const wheels=[];
function makeWheel(x){const root=new T.Group();root.position.set(x,axleY,0);bike.add(root);
 const tire=mesh(root,new T.TorusGeometry(wheelRadius,.043,12,64),M.tire);tire.receiveShadow=true;
 mesh(root,new T.TorusGeometry(wheelRadius-.033,.009,6,64),M.rim);
 mesh(root,new T.TorusGeometry(wheelRadius-.016,.004,4,64),mat('#dac99b'));
 for(let i=0;i<20;i++){const a=i/20*TAU;rod(root,[0,0,(i%2?.021:-.021)],[Math.cos(a)*.509,Math.sin(a)*.509,0],.0045,M.spoke,false);}
 const hub=rod(root,[0,0,-.09],[0,0,.09],.032,M.rim);
 const reflector=rounded(root,mat('#eccb71'),[.35,0,.012],[.082,.025,.026],.008);
 wheels.push(root);return root;
}
makeWheel(rearX);makeWheel(frontX);
const rear=V(rearX,axleY,0),front=V(frontX,axleY,0),crank=V(-.1,.66,0),seatStem=V(-.42,1.26,0),headBottom=V(.65,1.10,0),headTop=V(.58,1.37,0);
for(const [a,b] of [[rear,crank],[crank,seatStem],[seatStem,rear],[seatStem,headTop],[headBottom,crank],[headBottom,headTop]])rod(bike,a,b,.028,M.teal);
for(const z of [-.062,.062]){rod(bike,[rearX,axleY,z],[-.42,1.26,z],.019,M.teal);rod(bike,[.65,1.1,z],[frontX,axleY,z],.022,M.teal);}
rod(bike,[-.42,1.24,0],[-.48,1.4,0],.02,M.rim);
rounded(bike,M.leather,[-.46,1.415,0],[.4,.082,.25],.035);
rod(bike,[.58,1.37,0],[.55,1.53,0],.022,M.rim);
tube(bike,[[.55,1.51,-.29],[.67,1.54,-.22],[.55,1.53,0],[.67,1.54,.22],[.55,1.51,.29]],.019,M.rim,24);
for(const z of [-.29,.29]){rod(bike,[.55,1.515,z],[.75,1.515,z],.03,M.leather);}
const bellDome=ell(bike,M.trim,[.58,1.58,.18],[.046,.038,.046]);
rod(bike,[.76,1.20,0],[.9,1.2,0],.028,M.rim);
ell(bike,M.trim,[.91,1.20,0],[.075,.083,.068]);
ell(bike,mat('#fff0c6'),[.966,1.20,0],[.025,.052,.052]);
for(const x of [rearX,frontX]){const pts=[];for(let i=0;i<=28;i++){const a=.16+(Math.PI-.32)*i/28;pts.push([x+Math.cos(a)*.619,axleY+Math.sin(a)*.619,0]);}tube(bike,pts,.028,M.teal,30);for(const z of [-.07,.07])rod(bike,[x,axleY,z],[x-.37,axleY+.48,z],.008,M.rim);}
// Cargo rack is behind the saddle, leaving the legs free.
rounded(bike,M.wood,[-1.07,1.27,0],[.68,.065,.42],.02);
for(const z of [-.18,.18]){rod(bike,[-.9,.57,z],[-1.34,1.24,z],.012,M.teal);rod(bike,[-.9,.57,z],[-.77,1.24,z],.012,M.teal);}
ell(bike,mat('#ba513a'),[-1.43,1.22,0],[.025,.041,.047]);
const chainPoints=[];for(let i=0;i<=20;i++){const a=-Math.PI/2+Math.PI*i/20;chainPoints.push([-.1+Math.cos(a)*.125,.66+Math.sin(a)*.125,.085]);}for(let i=0;i<=20;i++){const a=Math.PI/2+Math.PI*i/20;chainPoints.push([-.9+Math.cos(a)*.065,.565+Math.sin(a)*.065,.085]);}chainPoints.push(chainPoints[0]);tube(bike,chainPoints,.006,mat('#767c67',.45,.5),42,false);
const chainRing=mesh(bike,new T.TorusGeometry(.118,.012,8,32),M.trim,-.1,.66,.095);
const crankGroup=new T.Group();crankGroup.position.copy(crank);bike.add(crankGroup);
for(const side of [-1,1])rod(crankGroup,[0,0,side*.15],[side*.205,0,side*.15],.016,M.rim);
const pedals=[];
for(const side of [-1,1])pedals.push(rounded(bike,M.woodDark,[0,0,side*.215],[.17,.035,.16],.01));

// Hand-wrapped parcels and a stamped address label.
const cargo=new T.Group();cargo.position.set(-1.08,1.30,0);bike.add(cargo);
const parcelMat=mat('#d9aa6c');
rounded(cargo,parcelMat,[0,.205,0],[.6,.40,.39],.024);
rounded(cargo,mat('#e6bf82'),[.035,.485,-.025],[.44,.16,.31],.018);
box(cargo,mat('#b97749'),[0,.205,0],[.027,.414,.406]);
box(cargo,mat('#b97749'),[0,.205,0],[.61,.414,.019]);
box(cargo,mat('#c09661'),[.035,.485,-.025],[.028,.174,.321]);
const labelTex=canvasTexture(256,160,(c,w,h)=>{c.fillStyle='#f5e6bd';c.fillRect(0,0,w,h);c.strokeStyle='#756b4f';c.lineWidth=2;c.strokeRect(7,7,w-14,h-14);c.fillStyle='#685b41';c.font='17px Georgia';c.fillText('TO: A DEAR FRIEND',19,40);c.fillRect(20,67,125,2);c.fillRect(20,84,94,2);c.fillRect(20,101,113,2);c.strokeStyle='#ab6650';c.beginPath();c.arc(201,96,27,0,TAU);c.stroke();c.font='13px Georgia';c.fillStyle='#ab6650';c.fillText('POST',184,101);});
const label=new T.Mesh(new T.PlaneGeometry(.25,.145),new T.MeshStandardMaterial({map:labelTex,roughness:.9}));label.position.set(-.09,.24,.209);cargo.add(label);
// A loop and knot on top.
tube(cargo,[[-.13,.572,-.045],[-.14,.61,-.10],[0,.59,-.025],[.15,.617,.055],[.15,.575,.06],[0,.584,-.025]],.009,mat('#91764e'),28);
ell(cargo,mat('#91764e'),[.02,.588,-.025],[.027,.02,.02],true);

// The otter: soft silhouette, small round ears, full muzzle and tapered tail.
const rider=new T.Group();bike.add(rider);
const torso=ell(rider,M.fur,[-.35,1.73,0],[.365,.49,.30]);torso.rotation.z=-.23;
const tummy=ell(rider,M.cream,[-.12,1.71,.005],[.16,.34,.254]);tummy.rotation.z=-.3;
ell(rider,M.fur,[-.46,1.41,0],[.3,.24,.32]);
const head=new T.Group();head.position.set(-.04,2.28,0);rider.add(head);
ell(head,M.furLight,[0,0,0],[.43,.397,.345]);
ell(head,M.cream,[.225,-.15,0],[.276,.239,.283]);
for(const s of [-1,1]){
 const ear=ell(head,M.fur,[-.16,.255,s*.266],[.104,.103,.063]);ear.rotation.x=s*.25;
 ell(head,M.pink,[-.151,.267,s*.32],[.055,.056,.012]);
 ell(head,M.muzzle,[.358,-.106,s*.083],[.158,.117,.127]);
}
const nose=ell(head,M.nose,[.482,-.049,0],[.076,.052,.075]);nose.rotation.z=.12;
ell(head,mat('#7d6250'),[.495,-.022,.026],[.015,.008,.015],true,false);
const eyes=[];
for(const s of [-1,1]){
 const eyeRoot=new T.Group();eyeRoot.position.set(.248,.080,s*.288);head.add(eyeRoot);
 ell(eyeRoot,M.eye,[0,0,0],[.034,.051,.029]);
 ell(eyeRoot,mat('#fff9df'),[.010,.022,s*.025],[.010,.012,.007],true,false);
 eyes.push(eyeRoot);
 tube(head,[[.182,.174,s*.257],[.22,.185,s*.260],[.253,.176,s*.263]],.009,M.fur,12,false);
 ell(head,mat('#c28768'),[.254,-.138,s*.25],[.055,.026,.013],true,false);
 for(let j=0;j<3;j++){const y=-.101-j*.042;tube(head,[[.38,y,s*.10],[.32,y+.005,s*.31],[.20-j*.032,y+.025-j*.025,s*.43]],.0035,mat('#5a4436'),8,false);}
}
tube(head,[[.46,-.104,0],[.415,-.191,0],[.345,-.198,0]],.007,M.nose,12,false);
// The tail is built as a continuous tapered mesh and flexed gently every frame.
const tailSeg=24, tailSides=14, tailPos=[],tailIndices=[];
for(let i=0;i<=tailSeg;i++)for(let j=0;j<=tailSides;j++)tailPos.push(0,0,0);
for(let i=0;i<tailSeg;i++)for(let j=0;j<tailSides;j++){const a=i*(tailSides+1)+j,b=a+tailSides+1;tailIndices.push(a,b,a+1,b,b+1,a+1);}
const tailGeo=new T.BufferGeometry();tailGeo.setAttribute('position',new T.Float32BufferAttribute(tailPos,3));tailGeo.setIndex(tailIndices);
const tail=mesh(rider,tailGeo,M.fur);tail.frustumCulled=false;
function updateTail(time){const arr=tailGeo.attributes.position.array;let n=0;for(let i=0;i<=tailSeg;i++){const t=i/tailSeg,rr=.205*Math.pow(1-t,.9)+.010;const cx=-.51-t*1.12,cy=1.43-.78*Math.sin(t*Math.PI*.53),cz=-.08+Math.sin(time*1.8-t*3)*.05*t;for(let j=0;j<=tailSides;j++){const a=j/tailSides*TAU;arr[n++]=cx;arr[n++]=cy+Math.cos(a)*rr*.77;arr[n++]=cz+Math.sin(a)*rr;}}tailGeo.attributes.position.needsUpdate=true;tailGeo.computeVertexNormals();}

// Two-bone leg IK keeps each ankle fixed to its moving pedal.
const legParts=[];
for(const side of [-1,1]){
 const upper=ell(rider,M.fur,[0,0,0],[.15,.3,.13]);
 const lower=ell(rider,M.fur,[0,0,0],[.115,.25,.11]);
 const knee=ell(rider,M.fur,[0,0,0],[.145,.145,.135]);
 const foot=ell(rider,M.fur,[0,0,0],[.183,.085,.115]);
 const claws=[];for(let j=0;j<3;j++)claws.push(ell(rider,mat('#cfb59a'),[0,0,0],[.022,.011,.010],true,false));
 legParts.push({side,upper,lower,knee,foot,claws});
}
function limbBetween(o,a,b,r){o.position.copy(a).add(b).multiplyScalar(.5);o.scale.set(r,a.distanceTo(b)*.58,r*.92);o.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());}
const arms=[];
for(const side of [-1,1]){
 const shoulder=V(-.13,1.99,side*.255),elbow=V(.19,1.67,side*.30),wrist=V(.62,1.54,side*.295);
 const upper=ell(rider,M.fur,[0,0,0],[1,1,1]);limbBetween(upper,shoulder,elbow,.13);
 const lower=ell(rider,M.fur,[0,0,0],[1,1,1]);limbBetween(lower,elbow,wrist,.092);
 ell(rider,M.fur,[elbow.x,elbow.y,elbow.z],[.108,.105,.108]);
 const paw=ell(rider,M.fur,[wrist.x+.024,wrist.y-.005,wrist.z],[.122,.078,.075]);
 for(let j=0;j<3;j++)ell(rider,M.furLight,[wrist.x+.070,wrist.y-.054,wrist.z-.041+j*.039],[.041,.023,.012],true);
 arms.push({upper,lower,paw,side});
}

// Knitted neck wrap and a moving ribbon, with curved width and striped hems.
const scarfWrap=ell(rider,M.scarf,[-.055,2.035,0],[.31,.092,.305]);scarfWrap.rotation.z=-.14;
const scarfKnot=ell(rider,M.scarf,[-.23,2.053,.27],[.125,.116,.105]);
const scarfSeg=40, scarfCols=6, scarfPos=[],scarfUV=[],scarfIndex=[];
for(let i=0;i<=scarfSeg;i++)for(let j=0;j<=scarfCols;j++){scarfPos.push(0,0,0);scarfUV.push(i/scarfSeg,j/scarfCols);}
for(let i=0;i<scarfSeg;i++)for(let j=0;j<scarfCols;j++){const a=i*(scarfCols+1)+j,b=a+scarfCols+1;scarfIndex.push(a,b,a+1,b,b+1,a+1);}
const scarfTex=canvasTexture(512,128,(c,w,h)=>{c.fillStyle='#c75c45';c.fillRect(0,0,w,h);c.fillStyle='#eaa176';for(const x of [w*.71,w*.77,w*.85,w*.91])c.fillRect(x,0,9,h);for(let x=0;x<w;x+=4){c.fillStyle=x%8?'rgba(255,230,183,.08)':'rgba(94,35,24,.07)';c.fillRect(x,0,1,h);}for(let y=0;y<h;y+=4){c.fillStyle='rgba(246,197,150,.06)';c.fillRect(0,y,w,1);}c.fillStyle='#efa97b';c.fillRect(0,0,w,4);c.fillRect(0,h-4,w,4);});
const scarfGeo=new T.BufferGeometry();scarfGeo.setAttribute('position',new T.Float32BufferAttribute(scarfPos,3));scarfGeo.setAttribute('uv',new T.Float32BufferAttribute(scarfUV,2));scarfGeo.setIndex(scarfIndex);
const scarf=mesh(rider,scarfGeo,new T.MeshStandardMaterial({map:scarfTex,roughness:.95,side:T.DoubleSide}));scarf.frustumCulled=false;
const fringe=[];for(let j=0;j<7;j++)fringe.push(rod(rider,[0,0,0],[.01,.01,.01],.008,M.scarfLight,false));
function scarfPoint(t,q,time,speed){const gust=Math.sin(time*2.5-t*8)*t*.11+Math.sin(time*4.1-t*13)*t*.035;const lift=.07+speed*.085,roll=.7+Math.sin(time*2.2-t*5)*.5*t,width=.25-.035*t;return V(-.25-t*1.40,2.06+Math.sin(t*Math.PI*.78)*lift+gust-t*t*.10+q*width*Math.sin(roll),.28+Math.sin(time*2-t*6)*.067*t+q*width*Math.cos(roll));}
function updateScarf(time,speed){const arr=scarfGeo.attributes.position.array;let n=0;for(let i=0;i<=scarfSeg;i++)for(let j=0;j<=scarfCols;j++){const p=scarfPoint(i/scarfSeg,j/scarfCols-.5,time,speed);arr[n++]=p.x;arr[n++]=p.y;arr[n++]=p.z;}scarfGeo.attributes.position.needsUpdate=true;scarfGeo.computeVertexNormals();for(let j=0;j<fringe.length;j++){const a=scarfPoint(1,j/(fringe.length-1)-.5,time,speed),b=a.clone().add(V(-.082,-.027+Math.sin(time*5+j)*.01,.008*Math.sin(j+time)));const o=fringe[j];o.position.copy(a).add(b).multiplyScalar(.5);o.scale.set(.008,a.distanceTo(b),.008);o.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());}}

// Small stitched mail bag strapped beside the rack.
const mailbag=new T.Group();mailbag.position.set(-1.10,1.06,-.26);bike.add(mailbag);
rounded(mailbag,mat('#759381'),[0,0,0],[.4,.44,.17],.065);
rounded(mailbag,mat('#89a28a'),[.005,.135,.006],[.4,.20,.185],.035);
box(mailbag,M.trim,[0,.1,.10],[.042,.072,.014]);
tube(bike,[[-.96,1.09,-.36],[-.95,1.53,-.3],[-1.20,1.53,-.3],[-1.26,1.06,-.36]],.012,M.leather,22);

// Procedural plants and trees; deterministic variations keep the world coherent.
const plantGroups=[];
const canopyMats=['#819371','#91a06e','#b1aa67','#c5ad72','#cc9874'].map(c=>mat(c));
function tree(x,z,size=1,kind=0){const g=new T.Group();g.position.set(0,-.085,z);g.scale.setScalar(size);
 const h=kind===1?2.2:2.65;
 rod(g,[0,0,0],[.035,h,0],.10,M.woodDark);
 for(let i=0;i<4;i++){const a=i*2.4;rod(g,[.01,h*.49,0],[Math.sin(a)*.65,h*.8,Math.cos(a)*.48],.04,M.wood);}
 const crown=new T.Group();crown.position.y=h*.86;g.add(crown);
 for(let j=0;j<8;j++){const a=j*2.4,r=j===0?0:rand(.25,.66);ell(crown,canopyMats[(kind+j%2)%canopyMats.length],[Math.cos(a)*r,rand(-.04,.68),Math.sin(a)*r],[rand(.54,.85),rand(.65,.94),rand(.5,.73)],true);}
 if(kind===0){for(let j=0;j<6;j++){const a=j/6*TAU;const pts=[];for(let i=0;i<5;i++)pts.push([Math.cos(a)*(.42+i*.10),h+.22-i*.26,Math.sin(a)*(.42+i*.10)]);tube(g,pts,.047,canopyMats[0],12);}}
 plantGroups.push({crown,phase:rand(0,TAU)});scene.add(g);drift(g,x,96);return g;
}
for(let i=0;i<12;i++)tree(-46+i*8,-1.88-rand(0,.07),rand(.65,1.05),i%4);
for(let i=0;i<14;i++)tree(-49+i*7.1,-15.8-rand(0,4),rand(.7,1.25),i%5);

// Instanced blades, clover flowers and gravel in repeating meadow tiles.
const bladeShape=new T.Shape();bladeShape.moveTo(-.026,0);bladeShape.quadraticCurveTo(-.01,.23,.03,.32);bladeShape.quadraticCurveTo(.055,.17,.026,0);bladeShape.closePath();
const bladeGeo=new T.ShapeGeometry(bladeShape);const bladeMat=new T.MeshStandardMaterial({color:'#7e9465',roughness:1,side:T.DoubleSide});
const dummy=new T.Object3D();
for(let tile=0;tile<5;tile++){
 const g=new T.Group();const count=370,blades=new T.InstancedMesh(bladeGeo,bladeMat,count);blades.receiveShadow=true;
 for(let i=0;i<count;i++){dummy.position.set(rand(-12,12),-.075,rand(1.65,6.8));dummy.rotation.set(0,rand(0,TAU),rand(-.25,.25));dummy.scale.setScalar(rand(.45,1.2));dummy.updateMatrix();blades.setMatrixAt(i,dummy.matrix);}
 g.add(blades);
 const stones=new T.InstancedMesh(smallSphereGeo,mat('#b7b49a'),90);
 for(let i=0;i<90;i++){dummy.position.set(rand(-12,12),-.006,rand(-1.45,1.45));dummy.rotation.set(0,rand(0,TAU),0);dummy.scale.set(rand(.011,.032),rand(.003,.015),rand(.015,.05));dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix);}g.add(stones);
 const flowerColors=['#e8ce92','#eed6b3','#c38667'];
 for(let c=0;c<3;c++){const flowers=new T.InstancedMesh(smallSphereGeo,mat(flowerColors[c]),50);for(let i=0;i<50;i++){dummy.position.set(rand(-12,12),rand(.08,.22),rand(1.95,5.5));dummy.rotation.set(0,0,0);dummy.scale.set(.026,.028,.026);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);}g.add(flowers);}
 scene.add(g);drift(g,(tile-2)*24,120);
}
// Riverside reeds, moss stones, lily pads and their flowers.
const reedMat=mat('#789374'),reedTip=mat('#8b6950');
for(let i=0;i<23;i++){
 const g=new T.Group();g.position.z=i%2?-12.3:-2.5;
 for(let j=0;j<5;j++){const x=rand(-.25,.25),z=rand(-.15,.15),h=rand(.25,.68);rod(g,[x,-.27,z],[x+.06,h-.27,z+.025],.012,reedMat,false);ell(g,reedTip,[x+.06,h-.21,z+.025],[.021,.08,.022],true,false);}
 scene.add(g);drift(g,-45+i*4.1,96);
}
const lilyMat=mat('#739681');
for(let i=0;i<32;i++){const g=new T.Group();g.position.set(0,-.215,i%2?rand(-11.3,-12):rand(-3,-3.8));const pad=mesh(g,new T.CircleGeometry(rand(.10,.25),20,0,TAU-.35),lilyMat);pad.rotation.x=-Math.PI/2;pad.rotation.z=rand(0,TAU);if(i%4===0){for(let j=0;j<5;j++){const a=j/5*TAU;const petal=ell(g,mat('#e9c5a0'),[Math.sin(a)*.04,.035,Math.cos(a)*.04],[.025,.06,.026],true,false);petal.rotation.x=Math.cos(a)*.6;petal.rotation.z=Math.sin(a)*.6;}ell(g,mat('#d8b76c'),[0,.05,0],[.02,.017,.02],true,false);}scene.add(g);drift(g,rand(-47,47),96);}

// Timber railing, benches and wayfinding boards along the towpath.
function fence(x,z=-1.72){const g=new T.Group();g.position.z=z;
 for(let j=0;j<5;j++){const xx=j*.74-1.48;rounded(g,M.wood,[xx,.28,0],[.068,.6,.075],.02);ell(g,M.wood,[xx,.59,0],[.05,.037,.05],true);}
 for(const y of [.28,.49])rod(g,[-1.5,y,0],[1.5,y,0],.027,M.wood,false);
 scene.add(g);drift(g,x,96);}
for(const x of [-35,-22,-8,5,20,34,46])fence(x);
function bench(x){const g=new T.Group();g.position.z=2.65;
 for(let j=0;j<3;j++)rounded(g,M.wood,[0,.45,j*.12-.12],[1.25,.06,.09],.012);
 for(const y of [.74,.90])rounded(g,M.wood,[0,y,-.22],[1.25,.11,.05],.012);
 for(const xx of [-.47,.47]){rod(g,[xx,0,-.20],[xx,.95,-.22],.025,M.woodDark);rod(g,[xx,0,.16],[xx,.43,.16],.03,M.woodDark);}
 scene.add(g);drift(g,x,96);}
bench(-13);bench(28);
const signTexture=canvasTexture(512,256,(c,w,h)=>{c.fillStyle='#e4d6ad';c.fillRect(0,0,w,h);c.strokeStyle='#789079';c.lineWidth=6;c.strokeRect(10,10,w-20,h-20);c.fillStyle='#3e635a';c.font='bold 42px Georgia';c.textAlign='center';c.fillText('RIVER POST',w/2,91);c.font='23px Georgia';c.fillText('NEXT DELIVERY  →',w/2,150);c.font='20px Georgia';c.fillText('Take the scenic route',w/2,202);});
for(const x of [-27,23]){const g=new T.Group();g.position.z=-1.5;rod(g,[0,0,0],[0,1.28,0],.043,M.woodDark);rounded(g,M.wood,[0,1.13,0],[.78,.4,.062],.025);const face=new T.Mesh(new T.PlaneGeometry(.72,.36),new T.MeshStandardMaterial({map:signTexture}));face.position.set(0,1.13,.036);g.add(face);scene.add(g);drift(g,x,96);}

// A gently arched footbridge spans the entire river.
const bridge=new T.Group();scene.add(bridge);drift(bridge,5.6,96);
function bridgeY(t){return .03+Math.sin(t*Math.PI)*1.16;}
const bridgeN=38;
for(let i=0;i<bridgeN;i++){const t=(i+.5)/bridgeN,z=-2.28-t*10.55,y=bridgeY(t);const plank=box(bridge,M.wood,[0,y,z],[1.40,.095,10.55/bridgeN*.94]);plank.rotation.x=-Math.atan(Math.cos(t*Math.PI)*1.16*Math.PI/10.55);}
for(const x of [-.64,.64]){
 const rail=[];for(let j=0;j<=48;j++){const t=j/48;rail.push([x,bridgeY(t)+.68,-2.28-t*10.55]);}tube(bridge,rail,.032,M.woodDark,48);
 const lowRail=rail.map(p=>[p[0],p[1]-.39,p[2]]);tube(bridge,lowRail,.022,M.woodDark,48);
 for(let j=0;j<=12;j++){const t=j/12,z=-2.28-t*10.55,y=bridgeY(t);rod(bridge,[x,y,z],[x,y+.69,z],.029,M.woodDark);}
 const beam=[];for(let j=0;j<=48;j++){const t=j/48;beam.push([x,bridgeY(t)-.15,-2.28-t*10.55]);}tube(bridge,beam,.085,M.woodDark,48);
}
for(const z of [-3.7,-6.5,-9.6,-12.2]){for(const x of [-.55,.55])rod(bridge,[x,-.45,z],[x,bridgeY((-2.28-z)/10.55)-.14,z],.078,M.woodDark);}

// Far bank cottages, awnings and a tiny mail depot.
function house(x,z,w=2.1,h=1.7,c='#e2c8a0',roofColor='#b97758'){
 const g=new T.Group();g.position.z=z;
 rounded(g,mat(c),[0,h/2,0],[w,h,1.75],.06);
 const roofShape=new T.Shape();roofShape.moveTo(-w/2-.2,0);roofShape.lineTo(0,.8);roofShape.lineTo(w/2+.2,0);roofShape.closePath();
 const roofGeo=new T.ExtrudeGeometry(roofShape,{depth:2.04,bevelEnabled:false});roofGeo.translate(0,h-.04,-1.02);mesh(g,roofGeo,mat(roofColor));
 for(let j=0;j<8;j++){const xx=-w/2+j*w/7;const yy=h+.8-Math.abs(xx)/(w/2+.2)*.8;tube(g,[[xx,yy+.015,-1.03],[xx,yy+.015,1.03]],.014,mat('#c08a67'),4,false);}
 rounded(g,M.woodDark,[0,.45,.9],[.42,.89,.065],.025);rounded(g,mat('#698e82'),[0,.49,.946],[.32,.73,.03],.02);ell(g,M.trim,[.10,.45,.969],[.021,.022,.012],true);
 for(const xx of [-w*.29,w*.29]){rounded(g,M.woodDark,[xx,h*.60,.9],[.48,.58,.056],.012);box(g,mat('#7faca7',.28),[xx,h*.60,.94],[.38,.48,.015]);box(g,mat('#ece1c1'),[xx,h*.60,.955],[.027,.50,.016]);box(g,mat('#ece1c1'),[xx,h*.60,.955],[.4,.027,.016]);for(const side of [-1,1])rounded(g,mat('#78977f'),[xx+side*.27,h*.60,.93],[.12,.61,.045],.012);rounded(g,M.wood,[xx,h*.60-.36,1.0],[.57,.13,.20],.025);for(let k=0;k<6;k++)ell(g,mat(k%2?'#dfae88':'#809c73'),[xx-.21+k*.083,h*.60-.27,1.01],[.055,.08,.045],true);}
 rounded(g,mat('#e9d9b5'),[0,.04,1.03],[.62,.12,.39],.02);
 rounded(g,mat(roofColor),[w*.25,h+.62,-.20],[.26,.77,.29],.015);box(g,M.stone,[w*.25,h+1.03,-.20],[.32,.08,.35]);
 scene.add(g);drift(g,x,96);return g;
}
house(-17,-16,2.05,1.7,'#dfc59b','#af7258');house(-14.3,-16.4,2.1,2,'#e7d6b3','#83917b');house(1,-16.4,2.8,2.2,'#d7c19b','#ab7557');house(22,-15.5,2.2,1.8,'#e7cba7','#b8765c');house(25,-16.3,2,2.1,'#d3d0aa','#7c9384');house(40,-16.1,2.4,1.9,'#e1c798','#aa7156');

// A little jetty and a moored boat.
const dock=new T.Group();dock.position.z=-12.9;scene.add(dock);drift(dock,-6,96);
for(let i=0;i<12;i++)box(dock,M.wood,[0,-.10,.13+i*.18],[1.15,.09,.168]);
for(const xx of [-.52,.52])for(const z of [.22,1.96])rod(dock,[xx,-.7,z],[xx,.12,z],.055,M.woodDark);
const boat=new T.Group();boat.position.set(0,-.2,-10.1);scene.add(boat);drift(boat,-6.8,96);
const boatShape=new T.Shape();boatShape.moveTo(-1.0,0);boatShape.quadraticCurveTo(-.8,-.46,0,-.51);boatShape.quadraticCurveTo(.8,-.46,1.15,0);boatShape.quadraticCurveTo(.8,.46,0,.51);boatShape.quadraticCurveTo(-.8,.46,-1,0);
const boatGeo=new T.ExtrudeGeometry(boatShape,{depth:.20,bevelEnabled:true,bevelSize:.075,bevelThickness:.06,bevelSegments:3,steps:1});boatGeo.rotateX(-Math.PI/2);
mesh(boat,boatGeo,M.wood);ell(boat,M.woodDark,[0,.215,0],[.88,.055,.41]);for(const xx of [-.46,.29])box(boat,M.wood,[xx,.26,0],[.14,.046,.73]);
rod(boat,[-.45,.31,-.5],[.8,.3,.65],.023,M.woodDark);ell(boat,M.wood,[.88,.30,.75],[.18,.026,.09],true);
tube(dock,[[.5,.08,2],[.65,-.05,2.4],[.9,-.1,2.5]],.010,M.cream,14,false);

// Ducks leave animated rings on the water.
const ducks=[];
for(let i=0;i<4;i++){
 const g=new T.Group();g.position.z=-5.5-i*.36;g.scale.setScalar(i===0?.72:.45);
 ell(g,mat('#e6d7b3'),[0,0,0],[.28,.16,.15]);ell(g,mat('#708b71'),[.17,.15,0],[.112,.13,.11]);ell(g,mat('#bd8c56'),[.29,.13,0],[.08,.027,.052]);ell(g,M.eye,[.218,.18,.080],[.012,.012,.01],true,false);ell(g,mat('#aa9d78'),[-.015,.055,.11],[.16,.09,.052],true,false);
 const ring=mesh(g,new T.RingGeometry(.28,.288,48),new T.MeshBasicMaterial({color:'#c0d5ba',transparent:true,opacity:.5,side:T.DoubleSide}),0,-.05,0,1,1,1,false);ring.rotation.x=-Math.PI/2;ring.scale.set(1.6,1,1);
 scene.add(g);drift(g,-3.5-i*.7,96);ducks.push({g,phase:i});
}

// A few leaves and butterflies make the air feel alive.
const leafShape=new T.Shape();leafShape.moveTo(0,-.08);leafShape.quadraticCurveTo(-.06,-.04,-.02,.035);leafShape.lineTo(0,.1);leafShape.quadraticCurveTo(.07,.04,0,-.08);
const leafGeo=new T.ShapeGeometry(leafShape),leafMats=['#c89460','#d4b66b','#a6ad79'].map(c=>new T.MeshStandardMaterial({color:c,side:T.DoubleSide,roughness:.9}));
const leaves=[];for(let i=0;i<22;i++){const l=mesh(scene,leafGeo,leafMats[i%3],rand(-12,12),rand(.5,5),rand(-4,4),1,1,1,false);leaves.push({l,x:l.position.x,y:l.position.y,z:l.position.z,phase:rand(0,TAU),rate:rand(.28,.8)});}
const butterflies=[];
for(let i=0;i<4;i++){const g=new T.Group();const wings=[];for(const s of [-1,1]){const w=ell(g,mat('#edc48b'),[0,0,s*.04],[.042,.01,.064],true,false);w.rotation.x=s*.3;wings.push(w);}ell(g,M.woodDark,[0,0,0],[.025,.015,.009],true,false);scene.add(g);butterflies.push({g,wings,phase:rand(0,TAU),x:rand(-7,7),z:rand(1.8,4)});}

// A contact shadow under the cyclist supplements the soft sun shadow.
const shadowTex=canvasTexture(128,128,(c,w,h)=>{const grd=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);grd.addColorStop(0,'rgba(48,49,29,.25)');grd.addColorStop(.45,'rgba(48,49,29,.14)');grd.addColorStop(1,'rgba(48,49,29,0)');c.fillStyle=grd;c.fillRect(0,0,w,h);});
const contact=mesh(scene,new T.PlaneGeometry(3.6,1.5),new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}),-.25,.002,0,1,1,1,false);contact.rotation.x=-Math.PI/2;

// Batch static parts by material. Moving joints, cloth and instanced plants stay separate.
function dynamic(o){o.userData.dynamic=true;}
function batchStatic(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),buckets=new Map();
 function collect(o){if(o!==root&&o.userData.dynamic)return;if(o.isMesh&&!o.isInstancedMesh&&!Array.isArray(o.material)){
  const key=o.material.id+'|'+o.castShadow+'|'+o.receiveShadow;
  if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);
 }for(const c of o.children)collect(c);}
 collect(root);
 for(const objects of buckets.values()){
  if(objects.length<2)continue;const geometries=[];let count=0;
  for(const o of objects){const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld));if(!g.attributes.normal)g.computeVertexNormals();geometries.push(g);count+=g.attributes.position.count;}
  const p=new Float32Array(count*3),n=new Float32Array(count*3),uv=new Float32Array(count*2);let posOffset=0,uvOffset=0;
  for(const g of geometries){p.set(g.attributes.position.array,posOffset);n.set(g.attributes.normal.array,posOffset);if(g.attributes.uv)uv.set(g.attributes.uv.array,uvOffset);posOffset+=g.attributes.position.array.length;uvOffset+=g.attributes.position.count*2;g.dispose();}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('normal',new T.BufferAttribute(n,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.computeBoundingSphere();
  const first=objects[0],merged=new T.Mesh(g,first.material);merged.castShadow=first.castShadow;merged.receiveShadow=first.receiveShadow;objects.forEach(o=>o.parent.remove(o));root.add(merged);
 }
}
eyes.forEach(dynamic);batchStatic(head);dynamic(head);
for(const o of [torso,tail,scarf,...fringe])dynamic(o);
for(const p of legParts){for(const o of [p.upper,p.lower,p.knee,p.foot,...p.claws])dynamic(o);}
batchStatic(rider);dynamic(rider);
batchStatic(cargo);dynamic(cargo);
for(const w of wheels){batchStatic(w);dynamic(w);}
dynamic(crankGroup);pedals.forEach(dynamic);batchStatic(bike);dynamic(bike);
for(const p of plantGroups){batchStatic(p.crown);dynamic(p.crown);}
for(const item of moving){batchStatic(item.group);dynamic(item.group);}
dynamic(water);leaves.forEach(p=>dynamic(p.l));butterflies.forEach(b=>dynamic(b.g));
batchStatic(scene);

// Interaction: orbit, pinch/wheel zoom, camera presets, speed, pause and greeting.
let playing=!matchMedia('(prefers-reduced-motion: reduce)').matches, speed=1, rideTime=0, distance=0, crankAngle=0, viewMode=0, greeting=0, hidden=false;
const presets=[
 {theta:.28,phi:1.39,size:8.3,target:V(0,1.6,-2.6),name:'旅伴视角'},
 {theta:.48,phi:1.16,size:15.8,target:V(0,.7,-5.5),name:'河岸全景'},
 {theta:.52,phi:1.36,size:4.7,target:V(-.2,1.68,-.02),name:'水獭特写'}
];
function preset(i){viewMode=i;Object.assign(cameraGoal,presets[i]);cameraGoal.target=presets[i].target.clone();$('viewLabel').textContent=presets[i].name;}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),2400);}
function updatePlay(){ $('playIcon').innerHTML=playing?'<path d="M5 3h3v14H5zM12 3h3v14h-3z"/>':'<path d="M5 2l13 8L5 18z"/>'; $('play').setAttribute('aria-label',playing?'暂停动画':'继续动画');$('play').title=playing?'暂停（空格）':'继续（空格）';}
function togglePlay(){playing=!playing;updatePlay();}
$('play').addEventListener('click',togglePlay);updatePlay();
$('speed').addEventListener('input',e=>{speed=+e.target.value;$('speedValue').textContent=(speed<.65?'慢慢':speed>1.4?'轻快':'悠然')+' · '+speed.toFixed(1)+'×';});
$('view').addEventListener('click',()=>preset((viewMode+1)%3));
$('reset').addEventListener('click',()=>{preset(0);toast('回到熟悉的河岸视角');});
$('help').addEventListener('click',()=>{const open=$('helpPanel').classList.toggle('open');$('help').setAttribute('aria-expanded',String(open));});
let audioContext;
function ringBell(){greeting=1;toast('叮铃！愿你今天也有好心情。');try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();const t=audioContext.currentTime;for(const delay of [0,.17])for(const freq of [1568,3136,4694]){const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,t+delay);gain.gain.setValueAtTime(0,t+delay);gain.gain.linearRampToValueAtTime(freq===1568?.12:.022,t+delay+.005);gain.gain.exponentialRampToValueAtTime(.0001,t+delay+.9);osc.connect(gain);gain.connect(audioContext.destination);osc.start(t+delay);osc.stop(t+delay+1);}}catch(e){/* A visual greeting remains available if audio is disabled. */}}
$('bell').addEventListener('click',ringBell);
const ui=document.querySelectorAll('.heading,.top-actions,.postmark,.journey,.controls,.hint,.help-panel');
function toggleUI(){hidden=!hidden;ui.forEach(el=>el.style.visibility=hidden?'hidden':'');if(hidden)toast('按 H 再次显示操作界面');}
addEventListener('keydown',e=>{if(e.target.matches('input,textarea')||e.ctrlKey||e.altKey||e.metaKey)return;if(e.code==='Space'){e.preventDefault();togglePlay();}else if(e.key.toLowerCase()==='v')preset((viewMode+1)%3);else if(e.key.toLowerCase()==='r')preset(0);else if(e.key.toLowerCase()==='b')ringBell();else if(e.key.toLowerCase()==='h')toggleUI();else if(e.key==='Escape'){$('helpPanel').classList.remove('open');$('help').setAttribute('aria-expanded','false');}});
const pointers=new Map();let lastPinch=0,clickStart=null,dragged=false;
const canvas=renderer.domElement;
canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);clickStart={x:e.clientX,y:e.clientY};dragged=false;if(pointers.size===2){const a=[...pointers.values()];lastPinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);}});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId);const dx=e.clientX-prev.x,dy=e.clientY-prev.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(Math.abs(dx)+Math.abs(dy)>2)dragged=true;if(pointers.size===1){cameraGoal.theta-=dx*.005;cameraGoal.phi=clamp(cameraGoal.phi-dy*.004,.40,1.47);}else if(pointers.size===2){const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(lastPinch>0)cameraGoal.size=clamp(cameraGoal.size*lastPinch/Math.max(1,d),3.5,18);lastPinch=d;}});
const raycaster=new T.Raycaster();
canvas.addEventListener('pointerup',e=>{pointers.delete(e.pointerId);lastPinch=0;if(!dragged&&clickStart&&Math.hypot(e.clientX-clickStart.x,e.clientY-clickStart.y)<6){raycaster.setFromCamera(new T.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);if(raycaster.intersectObject(bike,true).length)ringBell();}clickStart=null;});
canvas.addEventListener('pointercancel',e=>pointers.delete(e.pointerId));
canvas.addEventListener('wheel',e=>{e.preventDefault();cameraGoal.size=clamp(cameraGoal.size*Math.exp(e.deltaY*.001),3.5,18);},{passive:false});
let width=innerWidth,height=innerHeight;
function resize(){width=innerWidth;height=innerHeight;renderer.setSize(width,height);renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));}addEventListener('resize',resize);
function updateCamera(dt){const k=1-Math.exp(-dt*9);cameraState.theta+= (cameraGoal.theta-cameraState.theta)*k;cameraState.phi+=(cameraGoal.phi-cameraState.phi)*k;cameraState.size+=(cameraGoal.size-cameraState.size)*k;cameraState.target.lerp(cameraGoal.target,k);const aspect=width/height,t=cameraState.target.clone(),r=13,p=cameraState.phi,a=cameraState.theta;if(aspect<1)t.x-=.65;camera.position.set(t.x+r*Math.sin(p)*Math.sin(a),t.y+r*Math.cos(p),t.z+r*Math.sin(p)*Math.cos(a));camera.lookAt(t);
 const fit=aspect<1?1/Math.max(.58,aspect):1;camera.aspect=aspect;camera.fov=T.MathUtils.radToDeg(2*Math.atan(cameraState.size*fit/(2*r)));camera.updateProjectionMatrix();}

// Time-based animation is independent of display refresh rate.
let last=performance.now(),frames=0,first=true,uiTimer=0;
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;updateCamera(dt);
 if(playing){const travelSpeed=2.10*speed;rideTime+=dt;distance+=dt*travelSpeed;crankAngle+=dt*travelSpeed/(wheelRadius*1.23)/1.55;
  wheels.forEach(w=>w.rotation.z=-distance/(wheelRadius*1.23));crankGroup.rotation.z=-crankAngle;
  for(let i=0;i<legParts.length;i++){const part=legParts[i],side=part.side,a=-crankAngle+(side===1?0:Math.PI);const px=-.1+Math.cos(a)*.205,py=.66+Math.sin(a)*.205,z=side*.246;
   pedals[i].position.set(px,py,side*.21);
   const hip=V(-.43,1.405,z),ankle=V(px-.035,py+.081,z);const dir=ankle.clone().sub(hip),d=Math.min(dir.length(),1.015),l1=.53,l2=.52;dir.normalize();const along=(l1*l1-l2*l2+d*d)/(2*d),bend=Math.sqrt(Math.max(.0001,l1*l1-along*along));const perpendicular=V(-dir.y,dir.x,0),knee=hip.clone().addScaledVector(dir,along).addScaledVector(perpendicular,bend);
   limbBetween(part.upper,hip,knee,.145);limbBetween(part.lower,knee,ankle,.107);part.knee.position.copy(knee);part.foot.position.copy(ankle).add(V(.055,-.014,0));part.foot.rotation.z=.10*Math.sin(a);for(let j=0;j<3;j++)part.claws[j].position.copy(part.foot.position).add(V(.152,-.010,-.060+j*.055));
  }
  bike.rotation.x=Math.sin(crankAngle*2)*.010;bike.rotation.y=Math.sin(rideTime*.7)*.013;
  const bounce=Math.sin(crankAngle*2)*.009;torso.position.y=1.73+bounce;head.position.y=2.28+bounce;
  cargo.rotation.z=Math.sin(crankAngle*2-.4)*.013;cargo.rotation.x=Math.sin(rideTime*2)*.006;
  const blinkCycle=rideTime%4.7;const blink=blinkCycle<.16?Math.max(.08,Math.abs(blinkCycle-.08)/.08):1;eyes.forEach(e=>e.scale.y=blink);
  head.rotation.y=Math.sin(rideTime*.6)*.055-greeting*.22;head.rotation.z=Math.sin(rideTime*.85)*.017;
  updateTail(rideTime);updateScarf(rideTime,speed);
  riverUniforms.time.value=rideTime;riverUniforms.shift.value=distance;
  pathTexture.offset.x=(distance/(240/55))%1;
  for(const item of moving){item.group.position.x=((item.x-distance+item.span/2)%item.span+item.span)%item.span-item.span/2;}
  for(const p of plantGroups){p.crown.rotation.z=Math.sin(rideTime*.85+p.phase)*.015;}
  boat.rotation.x=Math.sin(rideTime*1.1)*.02;boat.rotation.z=Math.sin(rideTime*.8)*.015;boat.position.y=-.20+Math.sin(rideTime*.95)*.02;
  for(const d of ducks){d.g.position.y=-.12+Math.sin(rideTime*2+d.phase)*.012;d.g.rotation.y=Math.sin(rideTime*.5+d.phase)*.08;d.g.position.x+=Math.sin(rideTime*.12)*.4;}
  for(const p of leaves){p.l.position.set(((p.x-distance*.65-rideTime*p.rate+14)%28+28)%28-14,p.y+Math.sin(rideTime*.8+p.phase)*.35,p.z+Math.sin(rideTime*.6+p.phase)*.35);p.l.rotation.set(rideTime*.8+p.phase,rideTime*.6+p.phase,Math.sin(rideTime+p.phase));}
  for(const b of butterflies){b.g.position.set(((b.x-distance*.4+12)%24+24)%24-12,.65+Math.sin(rideTime*1.7+b.phase)*.22,b.z+Math.sin(rideTime*.8+b.phase)*.7);b.g.rotation.y=Math.sin(rideTime+b.phase);for(let j=0;j<2;j++)b.wings[j].rotation.x=(j===0?-1:1)*Math.sin(rideTime*19+b.phase)*.9;}
 }
 if(greeting>0)greeting=Math.max(0,greeting-dt*.8);
 uiTimer+=dt;if(uiTimer>.2){uiTimer=0;$('distance').textContent=String(Math.floor(distance)).padStart(3,'0');$('journeyBar').style.width=(20+(distance%120)/120*80)+'%';}
 renderer.render(scene,camera);frames++;
 if(first){first=false;$('loading').classList.add('hide');setTimeout(()=>$('loading').remove(),900);}
}
// Initialize even when reduced motion starts the film paused.
updateTail(0);updateScarf(0,1);
const initialPlaying=playing;playing=true;animate(performance.now()+16);playing=initialPlaying;updatePlay();
document.addEventListener('visibilitychange',()=>{last=performance.now();});
// A read-only diagnostic object is useful for verifying the delivered file.
window.riverPost={get state(){return {playing,speed,distance,view:viewMode,frames,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,three:T.REVISION};}};
})();
