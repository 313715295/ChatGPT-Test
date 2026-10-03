(() => {
'use strict';
const T = THREE, TAU = Math.PI * 2, $ = id => document.getElementById(id);
const V = (x=0,y=0,z=0) => new T.Vector3(x,y,z);
const clamp = T.MathUtils.clamp, lerp = T.MathUtils.lerp;
let seed = 6103;
function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function between(a,b){return a+(b-a)*rand();}
const mount=$('scene');
let renderer;
try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch(e){
  $('loading').style.display='none';$('error').style.display='flex';$('error').innerHTML='<div>这段河岸旅程需要浏览器支持 WebGL。<br>请使用开启硬件加速的 Chrome、Edge 或 Firefox 重新打开。</div>';return;
}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
mount.appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#e7ece1');
scene.fog=new T.Fog('#e7ece1',55,110);
const camera=new T.PerspectiveCamera(38,innerWidth/innerHeight,.1,350);
const hemi=new T.HemisphereLight('#e8f4f5','#8d9972',1.85);scene.add(hemi);
const sun=new T.DirectionalLight('#fff0d4',3.0);sun.position.set(-8,20,12);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-24,right:24,top:21,bottom:-21,near:1,far:65});
sun.shadow.bias=-.0005;sun.shadow.normalBias=.025;sun.shadow.radius=3;scene.add(sun);
const fill=new T.DirectionalLight('#d0edf5',.65);fill.position.set(6,8,-10);scene.add(fill);
const mats={};
function material(key,color,roughness=.78,metalness=0){return mats[key]=new T.MeshStandardMaterial({color,roughness,metalness});}
material('grass','#9fb97a');material('island','#acc383');material('earth','#a28f69');material('edge','#c5ba96');
material('path','#ddc8a5');material('pathEdge','#c5ad84');material('trunk','#927052');material('bark','#70533f');
material('leaf','#6e9a69');material('leafLight','#93b876');material('leafDark','#4f8063');material('reed','#668a53');
material('rock','#b5b3a0');material('rockLight','#d1cbb7');material('white','#f9efd5');material('yellow','#efc760');
material('petal','#e3b3aa');material('wood','#b48a5a');material('woodDark','#765c43');material('roof','#648a76');
material('roofEdge','#496b5c');material('wall','#efe0bd');material('window','#729b94',.2);material('cream','#e5c69b');
material('fur','#886049',.92);material('furLight','#a77b58',.93);material('muzzle','#dcc09a');material('nose','#392f2a',.35);
material('eye','#211f1b',.13);material('shine','#fffdf0',.16);material('innerEar','#bb8769');
material('bike','#4e8f83',.38,.36);material('metal','#c5c9ba',.33,.72);material('tire','#3b4642',.85);
material('tireSide','#b9b69d',.8);material('saddle','#7a533c');material('red','#c65a45');material('redDark','#a84736');
material('parcel','#bf9361');material('parcelLight','#d5ae77');material('string','#ede2c5');material('lamp','#f6cc77');
const sphereGeo=new T.SphereGeometry(1,24,16), smallSphere=new T.SphereGeometry(1,10,7), cylGeo=new T.CylinderGeometry(1,1,1,10), lowSphere=new T.IcosahedronGeometry(1,1);
function mesh(geo,mat,parent=scene,x=0,y=0,z=0,shadow=true){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;}
function ell(mat,parent,x,y,z,sx,sy,sz,low=false){const m=mesh(low?lowSphere:sphereGeo,mat,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
function box(w,h,d,mat,parent,x=0,y=0,z=0){return mesh(new T.BoxGeometry(w,h,d),mat,parent,x,y,z);}
function rounded(w,h,d,r,mat,parent,x=0,y=0,z=0){
 const b=Math.min(r*.36,d*.22), hw=(w-2*b)/2,hh=(h-2*b)/2,rr=Math.min(r-b,hw,hh),s=new T.Shape();
 s.moveTo(-hw+rr,-hh);s.lineTo(hw-rr,-hh);s.quadraticCurveTo(hw,-hh,hw,-hh+rr);s.lineTo(hw,hh-rr);s.quadraticCurveTo(hw,hh,hw-rr,hh);s.lineTo(-hw+rr,hh);s.quadraticCurveTo(-hw,hh,-hw,hh-rr);s.lineTo(-hw,-hh+rr);s.quadraticCurveTo(-hw,-hh,-hw+rr,-hh);
 const g=new T.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:b,bevelThickness:b,curveSegments:5});g.translate(0,0,-d/2+b);
 return mesh(g,mat,parent,x,y,z);
}
const UP=V(0,1,0);
function setRod(m,a,b,r1,r2=r1){const d=V().subVectors(b,a);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(UP,d.clone().normalize());m.scale.set(r1,d.length(),r2);}
function softLimb(parent,r0,r1){
 const n=18,rings=10,geo=new T.BufferGeometry(),idx=[];geo.setAttribute('position',new T.BufferAttribute(new Float32Array((n+1)*(rings+1)*3),3).setUsage(T.DynamicDrawUsage));
 for(let i=0;i<n;i++)for(let j=0;j<rings;j++){const a=i*(rings+1)+j;idx.push(a,a+1,a+rings+1,a+1,a+rings+2,a+rings+1);}geo.setIndex(idx);
 const m=mesh(geo,mats.fur,parent);m.frustumCulled=false;return{geo,n,rings,r0,r1};
}
function shapeLimb(l,a,b,c){const curve=new T.CatmullRomCurve3([a,b,c],false,'centripetal'),p=l.geo.attributes.position;
 for(let i=0;i<=l.n;i++){const u=i/l.n,pt=curve.getPoint(u),t=curve.getTangent(u),normal=V(-t.y,t.x,0).normalize(),binormal=V().crossVectors(t,normal).normalize(),r=lerp(l.r0,l.r1,u)+Math.sin(Math.PI*u)*.013;
  for(let j=0;j<=l.rings;j++){const angle=j/l.rings*TAU,v=pt.clone().addScaledVector(normal,Math.cos(angle)*r).addScaledVector(binormal,Math.sin(angle)*r);p.setXYZ(i*(l.rings+1)+j,v.x,v.y,v.z);}}
 p.needsUpdate=true;l.geo.computeVertexNormals();
}
function rod(a,b,r,mat,parent=scene){const m=mesh(cylGeo,mat,parent);setRod(m,V(...a),V(...b),r);return m;}
function tube(points,r,mat,parent=scene,segments=24){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>V(...p))),segments,r,7,false),mat,parent);}
function torus(radius,width,mat,parent,x,y,z){return mesh(new T.TorusGeometry(radius,width,10,64),mat,parent,x,y,z);}
function ellipsePoint(rx,rz,a,y=0){return V(rx*Math.cos(a),y,rz*Math.sin(a));}
function ringGeo(rx,rz,ix,iz,y,segments=160){
 const pos=[],uv=[],idx=[];for(let i=0;i<=segments;i++){let a=i/segments*TAU;for(let j=0;j<2;j++){let x=(j?ix:rx)*Math.cos(a),z=(j?iz:rz)*Math.sin(a);pos.push(x,y,z);uv.push(x/40+.5,z/28+.5);}}
 for(let i=0;i<segments;i++){let k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function disk(rx,rz,y,mat,parent=scene){const m=mesh(new T.CylinderGeometry(1,1,.16,128),mat,parent,0,y-.08,0);m.scale.set(rx,1,rz);m.castShadow=false;return m;}
// A complete island diorama. All textures are generated in this file.
const base=mesh(new T.CylinderGeometry(1,1,.7,128),mats.earth,scene,0,-.37,0);base.scale.set(19.5,1,13.4);
const rim=mesh(new T.CylinderGeometry(1,1,.18,128),mats.edge,scene,0,-.035,0);rim.scale.set(19.55,1,13.45);
const ground=disk(19.48,13.38,.1,mats.grass);
const grassCanvas=document.createElement('canvas');grassCanvas.width=256;grassCanvas.height=256;
const gc=grassCanvas.getContext('2d');gc.fillStyle='#abbf81';gc.fillRect(0,0,256,256);
for(let i=0;i<6000;i++){gc.fillStyle=rand()>.5?'rgba(67,98,48,.06)':'rgba(255,248,192,.08)';gc.fillRect(rand()*256,rand()*256,between(1,4),between(1,3));}
const grassTex=new T.CanvasTexture(grassCanvas);grassTex.wrapS=grassTex.wrapT=T.RepeatWrapping;grassTex.repeat.set(14,10);grassTex.colorSpace=T.SRGBColorSpace;mats.grass.map=grassTex;mats.grass.color.set('#f0edc3');
mesh(ringGeo(12.75,8.02,7.65,3.72,.12),mats.pathEdge).castShadow=false;
const waterUniforms={uTime:{value:0},uDusk:{value:0}};
const waterMat=new T.ShaderMaterial({uniforms:waterUniforms,side:T.DoubleSide,
 vertexShader:`varying vec3 vP;uniform float uTime;void main(){vec3 p=position;p.y+=sin(p.x*1.4+p.z*.8+uTime*.8)*.012+sin(p.z*2.7-uTime*1.1)*.008;vP=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
 fragmentShader:`varying vec3 vP;uniform float uTime;uniform float uDusk;
 float noise(vec2 p){return sin(p.x*1.2+sin(p.y*.8))*sin(p.y*1.7+sin(p.x*.6));}
 void main(){vec2 p=vP.xz;float n=noise(p*.6+vec2(uTime*.055,-uTime*.035));
 float ripple=sin(p.y*14.+sin(p.x*1.8+uTime*.7)*1.8-uTime*1.9);
 float streak=pow(max(0.,ripple),32.)*.045*(.55+.45*sin(p.x*1.8+p.y*.4));
 float shine=pow(max(0.,sin(p.x*4.+p.y*7.+n*3.-uTime*.65)),38.)*.016;
 vec3 col=mix(vec3(.045,.19,.17),vec3(.11,.35,.28),.5+n*.23);col+=streak+shine;
 float r=length(vec2(p.x/12.6,p.y/7.9));float ri=length(vec2(p.x/7.85,p.y/3.85));
 float shore=smoothstep(.976,.996,r)+1.-smoothstep(1.005,1.055,ri);
 col=mix(col,vec3(.38,.50,.32),min(shore*.63,.63));col=mix(col,col*vec3(.73,.8,.9)+vec3(.03,.007,.002),uDusk);
 gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`
});
const water=mesh(ringGeo(12.58,7.85,7.82,3.86,.17),waterMat);water.castShadow=false;water.receiveShadow=false;
disk(7.82,3.86,.27,mats.island);
mesh(ringGeo(16.03,10.56,13.61,8.34,.14),mats.pathEdge).castShadow=false;
mesh(ringGeo(15.92,10.45,13.72,8.45,.165),mats.path).castShadow=false;
// Subtle stones in the cycle path, batched into a single draw call.
const grit=new T.InstancedMesh(lowSphere,new T.MeshStandardMaterial({color:'#b99e7c',roughness:1}),420);
const dummy=new T.Object3D();
for(let i=0;i<420;i++){const a=rand()*TAU,off=between(-.8,.8),p=ellipsePoint(14.82+off,9.45+off,a,.179);dummy.position.copy(p);dummy.scale.set(between(.016,.038),.007,between(.012,.026));dummy.rotation.set(0,rand()*TAU,0);dummy.updateMatrix();grit.setMatrixAt(i,dummy.matrix);}scene.add(grit);
// Reeds, grass tufts and flowers are instanced for smooth rendering.
const bladeGeo=new T.ConeGeometry(.022,.28,3);bladeGeo.translate(.014,.14,0);
const blades=new T.InstancedMesh(bladeGeo,mats.reed,2200);let bladeCount=0;
function addGrass(x,z,num=6){for(let k=0;k<num;k++){if(bladeCount>=2200)return;dummy.position.set(x+between(-.15,.15),.14,z+between(-.15,.15));dummy.rotation.set(between(-.25,.25),rand()*TAU,between(-.3,.3));dummy.scale.set(1,between(.55,1.5),1);dummy.updateMatrix();blades.setMatrixAt(bladeCount++,dummy.matrix);}}
for(let i=0;i<280;i++){let a=rand()*TAU,p;if(i<145)p=ellipsePoint(between(12.85,13.4),between(8.04,8.3),a);else p=ellipsePoint(between(16.25,18.9),between(10.6,12.8),a);addGrass(p.x,p.z,6);}
blades.count=bladeCount;scene.add(blades);
const flowerHeads=new T.InstancedMesh(smallSphere,mats.white,180),flowerCenters=new T.InstancedMesh(smallSphere,mats.yellow,180);
for(let i=0;i<180;i++){let a=rand()*TAU,p=ellipsePoint(between(16.45,18.1),between(10.8,12.4),a);dummy.position.set(p.x,.31,p.z);dummy.scale.set(.085,.025,.085);dummy.rotation.set(between(-.3,.3),0,between(-.3,.3));dummy.updateMatrix();flowerHeads.setMatrixAt(i,dummy.matrix);dummy.position.y+=.025;dummy.scale.set(.026,.022,.026);dummy.updateMatrix();flowerCenters.setMatrixAt(i,dummy.matrix);}
scene.add(flowerHeads,flowerCenters);
const treeCrowns=[];
function tree(x,z,h=3,s=1,kind=0){const g=new T.Group();g.position.set(x,.18,z);scene.add(g);
 const trunk=rod([0,0,0],[.06,h*.65,0],.105*s,mats.trunk,g);
 rod([.04,h*.38,0],[-.36*s,h*.72,.08],.058*s,mats.trunk,g);rod([.02,h*.4,0],[.39*s,h*.69,-.12],.049*s,mats.trunk,g);
 const crown=new T.Group();crown.position.set(0,h*.61,0);g.add(crown);
 if(kind===1){for(let k=0;k<3;k++){let leaf=mesh(new T.ConeGeometry(.8*s*(1-k*.21),1.2*s,9),k===1?mats.leaf:mats.leafDark,crown,0,k*.53*s,0);leaf.rotation.y=k*.6;}}
 else{ell(mats.leaf,crown,0,.38*s,0,.84*s,.92*s,.76*s,true);ell(mats.leafLight,crown,-.43*s,.55*s,.22*s,.64*s,.72*s,.59*s,true);ell(mats.leaf,crown,.48*s,.25*s,-.16*s,.64*s,.66*s,.64*s,true);ell(mats.leafDark,crown,.05,-.02*s,-.36*s,.63*s,.57*s,.58*s,true);}
 treeCrowns.push({g:crown,phase:rand()*TAU});return g;
}
for(let i=0;i<17;i++){const a=i/17*TAU+.14;const p=ellipsePoint(17.5,11.75,a);if(p.z>8&&p.x>3)continue;tree(p.x,p.z,between(2.5,3.5),between(.75,1.2),i%4===0?1:0);}
tree(-5.5,-.8,3.15,1.1);tree(4.4,-1.2,3.65,1.23);tree(5.2,1.35,2.75,.9);tree(-4.5,1.45,2.55,.75);
const bushes=[];for(let i=0;i<20;i++){const a=rand()*TAU,p=ellipsePoint(18,12,a);let g=new T.Group();g.position.copy(p);scene.add(g);for(let k=0;k<3;k++)ell(k===1?mats.leafLight:mats.leaf,g,k*.28,.37+rand()*.15,rand()*.15,.44,.36,.38,true);bushes.push(g);}
for(let i=0;i<45;i++){let a=rand()*TAU;let inner=i%3===0,p=ellipsePoint(inner?7.83:12.74,inner?3.83:7.98,a,.18);const m=ell(i%2?mats.rock:mats.rockLight,scene,p.x,p.y,p.z,between(.14,.38),between(.08,.2),between(.13,.32),true);m.rotation.y=rand()*TAU;}
const reedGroups=[];
for(let i=0;i<24;i++){const a=i/24*TAU+.2,p=ellipsePoint(12.37,7.66,a,.13),g=new T.Group();g.position.copy(p);scene.add(g);for(let k=0;k<4;k++){let x=between(-.16,.16),z=between(-.15,.15),h=between(.45,.82);rod([x,0,z],[x+.04,h,z+.07],.017,mats.reed,g);ell(mats.bark,g,x+.04,h+.04,z+.07,.035,.115,.035);const l=ell(mats.reed,g,x-.08,h*.44,z,.027,h*.32,.045);l.rotation.z=-.33;}reedGroups.push({g,phase:rand()*TAU});}
// A little riverside post office on the inner island.
const office=new T.Group();office.position.set(-1.9,.27,-.7);office.rotation.y=-.14;scene.add(office);
rounded(3,1.9,2.1,.1,mats.wall,office,0,1.0,0);
box(3.13,.14,2.2,mats.wood,office,0,.1,0);
const roofShape=new T.Shape();roofShape.moveTo(-1.75,1.87);roofShape.lineTo(0,2.93);roofShape.lineTo(1.75,1.87);roofShape.closePath();
const roofGeo=new T.ExtrudeGeometry(roofShape,{depth:2.55,bevelEnabled:false});roofGeo.translate(0,0,-1.275);
mesh(roofGeo,mats.roof,office);rod([-1.75,1.9,1.29],[0,2.94,1.29],.065,mats.roofEdge,office);rod([0,2.94,1.29],[1.75,1.9,1.29],.065,mats.roofEdge,office);
for(let k=0;k<8;k++){let z=-1.19+k*.34;rod([-1.7,1.92,z],[0,2.945,z],.013,mats.roofEdge,office);rod([0,2.945,z],[1.7,1.92,z],.013,mats.roofEdge,office);}
rounded(.58,1.23,.08,.08,mats.woodDark,office,.29,.75,1.09);rounded(.4,.43,.04,.055,mats.window,office,.29,1.05,1.15);ell(mats.metal,office,.49,.66,1.155,.028,.028,.018);
function windowAt(x){rounded(.72,.71,.07,.05,mats.white,office,x,1.15,1.095);rounded(.59,.58,.06,.025,mats.window,office,x,1.15,1.14);box(.045,.61,.055,mats.white,office,x,1.15,1.18);box(.63,.045,.055,mats.white,office,x,1.15,1.18);box(.89,.085,.22,mats.wood,office,x,.76,1.17);}
windowAt(-.82);windowAt(1.08);
const signCanvas=document.createElement('canvas');signCanvas.width=512;signCanvas.height=128;const sc=signCanvas.getContext('2d');sc.fillStyle='#f3e7c9';sc.fillRect(0,0,512,128);sc.strokeStyle='#829078';sc.lineWidth=6;sc.strokeRect(8,8,496,112);sc.fillStyle='#526b56';sc.font='bold 44px Georgia';sc.textAlign='center';sc.fillText('RIVER POST',256,82);const signTex=new T.CanvasTexture(signCanvas);signTex.colorSpace=T.SRGBColorSpace;const sign=mesh(new T.PlaneGeometry(1.63,.4075),new T.MeshStandardMaterial({map:signTex,roughness:.8}),office,-.13,1.71,1.107);
box(.28,.5,.33,mats.wood,office,.83,2.83,-.45);box(.4,.08,.43,mats.roofEdge,office,.83,3.1,-.45);
const smokeMat=new T.MeshBasicMaterial({color:'#edf0de',transparent:true,opacity:.22,depthWrite:false});const smoke=[];
for(let i=0;i<4;i++){const m=ell(smokeMat,office,.83,3.3+i*.28,-.45,.14+i*.04,.17+i*.06,.14+i*.04);m.castShadow=false;smoke.push(m);}
// Footbridge and little dock.
const bridge=new T.Group();bridge.position.set(0,.22,-5.8);scene.add(bridge);
for(let i=0;i<17;i++){let z=-2.15+i*.27,y=.06+.19*Math.sin(i/16*Math.PI);rounded(1.42,.09,.235,.025,mats.wood,bridge,0,y,z);}
for(let side of [-1,1]){const points=[];for(let i=0;i<=8;i++){let z=-2.3+i*.575,y=.08+.18*Math.sin(i/8*Math.PI);rod([side*.76,y,z],[side*.76,y+.63,z],.045,mats.woodDark,bridge);points.push([side*.76,y+.63,z]);}tube(points,.032,mats.woodDark,bridge);}
const dock=new T.Group();dock.position.set(8.7,.21,2.7);dock.rotation.y=-.48;scene.add(dock);
for(let k=0;k<9;k++)box(1.35,.09,.21,mats.wood,dock,0,0,k*.235-.94);
for(let x of [-.64,.64])for(let z of [-1,.95]){rod([x,-.24,z],[x,.38,z],.05,mats.woodDark,dock);ell(mats.wood,dock,x,.4,z,.075,.04,.075);}
const bench=new T.Group();bench.position.set(16.9,.2,1.8);bench.rotation.y=-Math.PI/2+.12;scene.add(bench);
for(let k=0;k<3;k++)box(1.5,.06,.12,mats.wood,bench,0,.48,k*.15-.15);
for(let k=0;k<2;k++)box(1.5,.12,.065,mats.wood,bench,0,.74+k*.16,-.3);
for(let x of [-.55,.55]){rod([x,0,-.21],[x,.92,-.29],.035,mats.woodDark,bench);rod([x,0,.2],[x,.49,.2],.035,mats.woodDark,bench);}
// A red mailbox near the bridge.
const mailbox=new T.Group();mailbox.position.set(-1.8,.2,-11.65);mailbox.rotation.y=.13;scene.add(mailbox);rod([0,0,0],[0,1.03,0],.07,mats.woodDark,mailbox);rounded(.5,.46,.68,.18,mats.red,mailbox,0,1.12,0);box(.35,.025,.035,mats.bark,mailbox,0,1.14,.357);rod([.28,1.12,0],[.28,1.48,0],.016,mats.metal,mailbox);box(.2,.11,.025,mats.yellow,mailbox,.37,1.44,0);
// Small river birds and their soft ripples.
const ducks=[];
for(let i=0;i<3;i++){const g=new T.Group();scene.add(g);ell(mats.white,g,0,.04,0,.26,.16,.16);ell(mats.white,g,.2,.2,0,.135,.14,.12);ell(mats.yellow,g,.33,.17,0,.095,.035,.065);ell(mats.eye,g,.252,.24,.099,.015,.019,.012);ell(mats.eye,g,.252,.24,-.099,.015,.019,.012);ell(mats.cream,g,-.045,.12,.1,.14,.056,.035);const r=torus(.35,.008,new T.MeshBasicMaterial({color:'#c0d9b1',transparent:true,opacity:.42}),g,-.07,-.04,0);r.rotation.x=Math.PI/2;r.scale.y=.6;g.traverse(o=>o.castShadow=false);ducks.push({g,ring:r,offset:i*.09,phase:rand()*TAU});}
// The bicycle uses actual axle, crank and pedal geometry.
const vehicle=new T.Group();scene.add(vehicle);const bike=new T.Group();vehicle.add(bike);
const axRear=[-1.06,.71,0],axFront=[1.06,.71,0],crankPoint=[-.16,.82,0],seatPoint=[-.44,1.57,0],headTop=[.68,1.55,0],headBottom=[.79,1.26,0];
for(let [a,b] of [[axRear,seatPoint],[seatPoint,crankPoint],[crankPoint,axRear],[seatPoint,headTop],[headBottom,crankPoint],[headTop,headBottom]])rod(a,b,.035,mats.bike,bike);
for(let z of [-.1,.1]){rod([.78,1.32,z],[1.06,.71,z],.028,mats.bike,bike);rod([-.44,1.57,z],[-1.06,.71,z],.022,mats.bike,bike);rod([-.16,.82,z],[-1.06,.71,z],.021,mats.bike,bike);}
rod([-.44,1.5,0],[-.47,1.73,0],.025,mats.metal,bike);rounded(.42,.1,.28,.06,mats.saddle,bike,-.47,1.74,0);
rod([.68,1.53,0],[.74,1.79,0],.026,mats.metal,bike);tube([[.74,1.79,0],[.85,1.83,0],[.91,1.83,.23],[.77,1.8,.35]],.023,mats.metal,bike,16);tube([[.85,1.83,0],[.91,1.83,-.23],[.77,1.8,-.35]],.023,mats.metal,bike,16);
for(let z of [-.34,.34])rod([.76,1.8,z],[.92,1.81,z],.034,mats.saddle,bike);
const wheels=[];
for(let x of [-1.06,1.06]){const g=new T.Group();g.position.set(x,.71,0);bike.add(g);torus(.612,.061,mats.tire,g,0,0,0);torus(.611,.041,mats.tireSide,g,0,0,.034);torus(.562,.025,mats.metal,g,0,0,0);const points=[];
 for(let i=0;i<28;i++){const a=i/28*TAU;points.push(0,0,i%2?.045:-.045,.55*Math.cos(a),.55*Math.sin(a),0);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));g.add(new T.LineSegments(geo,new T.LineBasicMaterial({color:'#bdc4b7'})));const hub=mesh(new T.CylinderGeometry(.065,.065,.22,14),mats.metal,g);hub.rotation.x=Math.PI/2;wheels.push(g);
 const mud=[];for(let i=0;i<=28;i++){let a=Math.PI*.08+i/28*Math.PI*.84;mud.push([x+.702*Math.cos(a),.71+.702*Math.sin(a),0]);}tube(mud,.034,mats.bike,bike,32);
}
const chainGeo=new T.BufferGeometry(),chainPts=[];for(let i=0;i<=60;i++){let a=i/60*TAU;chainPts.push(-.62+.59*Math.cos(a),.78+.128*Math.sin(a),.14);}chainGeo.setAttribute('position',new T.Float32BufferAttribute(chainPts,3));bike.add(new T.Line(chainGeo,new T.LineBasicMaterial({color:'#646a5b'})));
const crank=new T.Group();crank.position.set(-.16,.82,0);bike.add(crank);const chainwheel=torus(.176,.018,mats.metal,crank,0,0,.13);for(let i=0;i<5;i++){let a=i/5*TAU;rod([0,0,.13],[.17*Math.cos(a),.17*Math.sin(a),.13],.01,mats.metal,crank);}
const pedals=[];
for(let side of [-1,1]){const a=side===1?0:Math.PI;rod([0,0,side*.16],[.23*Math.cos(a),.23*Math.sin(a),side*.32],.02,mats.metal,crank);const p=new T.Group();p.position.set(.23*Math.cos(a),.23*Math.sin(a),side*.34);crank.add(p);rounded(.23,.058,.19,.018,mats.tire,p,0,0,0);pedals.push(p);}
// Rear rack, securely tied parcels and a hand-addressed envelope.
rounded(.87,.055,.62,.025,mats.metal,bike,-1.1,1.49,0);for(let z of [-.25,.25])rod([-1.42,1.48,z],[-1.06,.75,z],.018,mats.metal,bike);
const cargo=new T.Group();cargo.position.set(-1.2,1.52,0);bike.add(cargo);rounded(.71,.45,.57,.035,mats.parcel,cargo,0,.24,0);rounded(.49,.22,.43,.024,mats.parcelLight,cargo,-.055,.574,-.035);
for(let z of [-.1,.11]){box(.728,.018,.025,mats.string,cargo,0,.471,z);box(.025,.46,.03,mats.string,cargo,.368,.243,z);box(.025,.46,.03,mats.string,cargo,-.368,.243,z);}
box(.025,.019,.58,mats.string,cargo,-.045,.473,0);box(.025,.459,.012,mats.string,cargo,-.045,.245,.293);box(.5,.014,.027,mats.red,cargo,-.055,.69,-.035);box(.023,.224,.444,mats.red,cargo,-.055,.579,-.035);
const labelCanvas=document.createElement('canvas');labelCanvas.width=256;labelCanvas.height=128;const lc=labelCanvas.getContext('2d');lc.fillStyle='#f4e9cd';lc.fillRect(0,0,256,128);lc.fillStyle='#956d4c';lc.font='italic 23px Georgia';lc.fillText('with love',31,51);lc.fillStyle='#b79d78';lc.fillRect(31,69,127,3);lc.fillRect(31,81,95,3);lc.strokeStyle='#c17457';lc.lineWidth=3;lc.strokeRect(193,17,41,47);lc.font='24px Georgia';lc.fillStyle='#b16e53';lc.fillText('♡',200,49);const labelTex=new T.CanvasTexture(labelCanvas);labelTex.colorSpace=T.SRGBColorSpace;mesh(new T.PlaneGeometry(.33,.165),new T.MeshStandardMaterial({map:labelTex}),cargo,.08,.275,.294);
const envelope=rounded(.35,.22,.03,.012,mats.white,cargo,.17,.53,.29);envelope.rotation.z=-.15;
tube([[.03,.62,.311],[.17,.52,.311],[.33,.62,.311]],.006,mats.parcel,cargo,8);ell(mats.red,cargo,.17,.52,.313,.025,.025,.008);
// Headlamp and bell.
const frontLamp=ell(mats.metal,bike,1.1,1.43,0,.12,.108,.115);ell(mats.lamp,bike,1.196,1.438,0,.028,.081,.085);rod([1.08,1.35,0],[1.08,1.47,0],.018,mats.metal,bike);
const bellMesh=ell(mats.metal,bike,.86,1.882,.2,.063,.039,.06);rod([.88,1.9,.23],[.94,1.9,.24],.015,mats.metal,bike);
// Otter: rounded anatomical volumes, muzzle, tiny ears, whiskers and a tapering tail.
const rider=new T.Group();bike.add(rider);
const torso=ell(mats.fur,rider,-.31,2.07,0,.36,.53,.29);torso.rotation.z=-.2;
const belly=ell(mats.muzzle,rider,-.065,2.08,.005,.155,.385,.244);belly.rotation.z=-.22;
ell(mats.fur,rider,-.5,1.77,0,.32,.26,.29);
const head=new T.Group();head.position.set(.015,2.6,0);rider.add(head);
ell(mats.fur,head,0,0,0,.41,.385,.347);
for(let side of [-1,1]){const ear=ell(mats.fur,head,-.09,.29,side*.284,.095,.104,.083);ell(mats.innerEar,head,-.032,.3,side*.296,.051,.062,.052);ell(mats.muzzle,head,.322,-.102,side*.115,.155,.112,.145);
 const eye=ell(mats.eye,head,.258,.094,side*.252,.049,.058,.041);ell(mats.shine,head,.283,.116,side*.276,.014,.018,.01);eye.userData.eye=true;
 tube([[.18,.174,side*.273],[.244,.192,side*.254],[.294,.174,side*.222]],.011,mats.furLight,head,10);
 for(let k=0;k<3;k++){let yy=-.077-k*.041;tube([[.4,yy,side*.164],[.5,yy+.018*(k-1),side*.32],[.55,yy+.04*(k-1),side*(.46-k*.018)]],.0045,mats.cream,head,12);}
 for(let k=0;k<3;k++)ell(mats.furLight,head,.45,-.105+k*.036,side*(.14+k*.017),.008,.008,.008);
}
ell(mats.nose,head,.456,-.061,0,.076,.054,.071);ell(mats.shine,head,.505,-.044,.011,.008,.011,.026);
tube([[.457,-.108,0],[.46,-.163,0]],.008,mats.nose,head,6);for(let s of [-1,1])tube([[.46,-.163,0],[.451,-.185,s*.047],[.422,-.172,s*.083]],.0065,mats.nose,head,10);
// Tapered tail with a gently curved centre line.
function tailGeometry(){const centers=[[-.54,1.73,.05],[-.93,1.5,.17],[-1.34,1.24,.29],[-1.7,1.08,.39],[-1.94,1.06,.42]];const curve=new T.CatmullRomCurve3(centers.map(p=>V(...p))),frames=curve.computeFrenetFrames(30,false),pos=[],idx=[];
 for(let i=0;i<=30;i++){let u=i/30,p=curve.getPoint(u),r=.18*Math.pow(1-u,.78)+.016;for(let j=0;j<=12;j++){let a=j/12*TAU,q=p.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r);pos.push(q.x,q.y,q.z);}}
 for(let i=0;i<30;i++)for(let j=0;j<12;j++){let k=i*13+j;idx.push(k,k+1,k+13,k+1,k+14,k+13);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
const tail=mesh(tailGeometry(),mats.fur,rider);
const legs=[];for(let side of [-1,1]){let g=new T.Group();bike.add(g);const limb=softLimb(g,.138,.084),paw=ell(mats.furLight,g,0,0,0,.175,.092,.126);const toes=[];for(let k=0;k<3;k++)toes.push(ell(mats.fur,g,0,0,0,.045,.041,.033));legs.push({side,limb,paw,toes});}
const arms=[];for(let side of [-1,1]){const limb=softLimb(bike,.102,.069),paw=ell(mats.furLight,bike,0,0,0,.115,.077,.093);arms.push({side,limb,paw});}
const collar=torus(.253,.074,mats.red,rider,-.055,2.343,0);collar.rotation.x=Math.PI/2;collar.scale.set(1.06,.94,.88);ell(mats.redDark,rider,-.273,2.35,.16,.087,.095,.087);
function makeScarf(length,width,z,phase){const seg=30,rows=4,pos=new Float32Array((seg+1)*(rows+1)*3),colors=new Float32Array(pos.length),idx=[];
 for(let i=0;i<=seg;i++)for(let j=0;j<=rows;j++){let k=(i*(rows+1)+j)*3,c=new T.Color(i>seg-4?'#e5af79':(i>seg-6?'#a84434':'#ca6248'));colors[k]=c.r;colors[k+1]=c.g;colors[k+2]=c.b;}
 for(let i=0;i<seg;i++)for(let j=0;j<rows;j++){let k=i*(rows+1)+j;idx.push(k,k+1,k+rows+1,k+1,k+rows+2,k+rows+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3).setUsage(T.DynamicDrawUsage));geo.setAttribute('color',new T.BufferAttribute(colors,3));geo.setIndex(idx);const mat=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.95});const m=mesh(geo,mat,rider);m.frustumCulled=false;
 const stitchGeo=new T.BufferGeometry();stitchGeo.setAttribute('position',new T.BufferAttribute(new Float32Array((seg+1)*3*2),3).setUsage(T.DynamicDrawUsage));const stitch=new T.LineSegments(stitchGeo,new T.LineBasicMaterial({color:'#e1a57f',transparent:true,opacity:.55}));rider.add(stitch);stitch.frustumCulled=false;
 return{geo,length,width,z,phase,seg,rows,stitchGeo};}
const scarves=[makeScarf(1.47,.22,.2,0),makeScarf(1.05,.18,-.015,1.5)];
const blinkEyes=[];head.traverse(o=>{if(o.userData.eye)blinkEyes.push(o);});
// Floating leaves catch gusts; little drifting pollen gives the scene depth.
const leafMesh=new T.InstancedMesh(new T.SphereGeometry(1,7,5),mats.leafLight,36),leafData=[];scene.add(leafMesh);
for(let i=0;i<36;i++)leafData.push({x:between(-18,18),z:between(-11,11),y:between(1.2,5),phase:rand()*TAU,s:between(.035,.09)});
const pollenGeo=new T.BufferGeometry(),pollenPos=[];for(let i=0;i<120;i++)pollenPos.push(between(-18,18),between(.4,4.8),between(-12,12));pollenGeo.setAttribute('position',new T.Float32BufferAttribute(pollenPos,3));const pollen=new T.Points(pollenGeo,new T.PointsMaterial({color:'#fff0c1',size:.032,transparent:true,opacity:.64,depthWrite:false}));scene.add(pollen);
const floor=mesh(new T.PlaneGeometry(240,240),new T.MeshStandardMaterial({color:'#e7e9db',roughness:1}),scene,0,-.82,0,false);floor.rotation.x=-Math.PI/2;
// Compact, locally synthesized bell. Sound only starts after a deliberate click.
let audio=null,toastTimer,paused=false,simTime=0,travel=0,routeAngle=.39,rideSpeed=1,gust=0,gustTarget=0,waveUntil=-1,dusk=0,duskTarget=0,mode='follow',cameraReady=false;
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),1700);}
function ringBell(){
 try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const now=audio.currentTime;for(let hit=0;hit<2;hit++)for(let [freq,vol] of [[1760,.15],[2638,.065],[3527,.027]]){const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,now);gain.gain.setValueAtTime(0,now);gain.gain.setValueAtTime(vol,now+hit*.14+.002);gain.gain.exponentialRampToValueAtTime(.0001,now+hit*.14+1.2);osc.connect(gain);gain.connect(audio.destination);osc.start(now+hit*.14);osc.stop(now+hit*.14+1.25);}}catch(e){}
 waveUntil=simTime+2.1;toast('叮铃 —— 给你一个沿途的问候');
}
function blowWind(){gustTarget=1.9;toast('风来了，围巾也想去旅行');}
function togglePause(){paused=!paused;$('pause').innerHTML=paused?'<svg viewBox="0 0 24 24"><path d="m9 6 9 6-9 6z" fill="currentColor" stroke="none"/></svg>':'<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12" stroke-width="2.8"/></svg>';$('pause').setAttribute('aria-label',paused?'继续动画':'暂停动画');}
let orbitYaw=0,orbitPitch=0,zoom=1,orbitYawTarget=0,orbitPitchTarget=0,zoomTarget=1;
function resetView(){orbitYawTarget=0;orbitPitchTarget=0;zoomTarget=1;}
function setView(v){mode=v;resetView();document.querySelectorAll('[data-view]').forEach(b=>{const on=b.dataset.view===v;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});}
$('pause').onclick=togglePause;$('bell').onclick=ringBell;$('wind').onclick=blowWind;
$('speed').oninput=e=>{rideSpeed=+e.target.value;$('speedText').value=rideSpeed.toFixed(1)+'×';};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
$('day').onclick=()=>{duskTarget=duskTarget?0:1;document.body.classList.toggle('night',!!duskTarget);toast(duskTarget?'暮色落在河面上':'又是一个晴朗的好日子');};
$('helpToggle').onclick=()=>{const on=$('help').style.display!=='block';$('help').style.display=on?'block':'none';$('helpToggle').setAttribute('aria-expanded',String(on));};
window.addEventListener('keydown',e=>{if(e.target.matches('input,button')&&e.code==='Space')return;if(e.target.matches('input'))return;if(e.code==='Space'){e.preventDefault();togglePause();}if(e.code==='KeyB')ringBell();if(e.code==='KeyW')blowWind();if(e.code==='KeyR')resetView();if(e.code==='Digit1')setView('follow');if(e.code==='Digit2')setView('wide');if(e.code==='Digit3')setView('close');});
// Pointer orbit, pinch zoom and a raycast greeting.
const pointers=new Map();let downX=0,downY=0,dragDistance=0,lastPinch=0;
mount.addEventListener('pointerdown',e=>{mount.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});downX=e.clientX;downY=e.clientY;dragDistance=0;if(pointers.size===2){const p=[...pointers.values()];lastPinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}});
mount.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId),dx=e.clientX-prev.x,dy=e.clientY-prev.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});dragDistance+=Math.abs(dx)+Math.abs(dy);if(pointers.size===2){const p=[...pointers.values()],dist=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(lastPinch>0)zoomTarget=clamp(zoomTarget*lastPinch/Math.max(dist,10),.55,1.85);lastPinch=dist;}else{orbitYawTarget-=dx*.007;orbitPitchTarget=clamp(orbitPitchTarget+dy*.0045,-.34,.72);}});
const raycaster=new T.Raycaster();
mount.addEventListener('pointerup',e=>{if(dragDistance<7&&pointers.size===1){raycaster.setFromCamera(new T.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);if(raycaster.intersectObject(vehicle,true).length)ringBell();}pointers.delete(e.pointerId);lastPinch=0;});
mount.addEventListener('pointercancel',e=>pointers.delete(e.pointerId));mount.addEventListener('dblclick',resetView);mount.addEventListener('wheel',e=>{e.preventDefault();zoomTarget=clamp(zoomTarget*Math.exp(e.deltaY*.001),.55,1.85);},{passive:false});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));});
const dayBg=new T.Color('#e7ece1'),duskBg=new T.Color('#686f7f'),daySun=new T.Color('#fff0d4'),duskSun=new T.Color('#ffb475'),dayHemi=new T.Color('#e8f4f5'),duskHemi=new T.Color('#9bb8c4');
const target=V(),camDesired=V(),camLook=V(),smoothLook=V(),lastRide=V();let lastStamp=performance.now(),frames=0,frameMs=16;
function updateScarf(s,t,wind){const p=s.geo.attributes.position;for(let i=0;i<=s.seg;i++){const u=i/s.seg,flutter=Math.sin(t*5.1-u*9+s.phase),cross=Math.sin(t*3.9-u*7.6+s.phase);for(let j=0;j<=s.rows;j++){const v=j/s.rows-.5,idx=i*(s.rows+1)+j;const hang=(1-wind*.16)*u*u*.06;p.setXYZ(idx,-.28-s.length*u,2.37+u*(.16+gust*.12)+flutter*u*(.065+wind*.026)+v*s.width-hang,s.z+cross*u*(.07+wind*.038)+Math.sin(v*6+u*8-t*4)*.019*u);}}
 p.needsUpdate=true;s.geo.computeVertexNormals();const st=s.stitchGeo.attributes.position;for(let i=0;i<s.seg;i++){const k=i*(s.rows+1),j=(i+1)*(s.rows+1);st.setXYZ(i*2,p.getX(k),p.getY(k)+.013,p.getZ(k)+.005);st.setXYZ(i*2+1,p.getX(j),p.getY(j)+.013,p.getZ(j)+.005);}st.needsUpdate=true;
}
function updateOtter(t){
 const phase=-travel/.76,roll=Math.sin(phase*2)*.012,bob=Math.cos(phase*2)*.013;
 rider.position.y=bob;torso.rotation.z=-.2+roll;head.rotation.z=.025*Math.sin(t*.8)+roll*.5;head.rotation.y=.055*Math.sin(t*.65);
 const blinkPhase=t%5.3,blink=blinkPhase>4.9&&blinkPhase<5.12?Math.max(.08,Math.abs((blinkPhase-5.01)/.11)):1;for(let e of blinkEyes)e.scale.y=.058*blink;
 tail.rotation.x=Math.sin(t*1.8)*.013;
 crank.rotation.z=phase;for(let p of pedals)p.rotation.z=-phase;
 for(let l of legs){const s=l.side,a=phase+(s===1?0:Math.PI),foot=V(-.16+.23*Math.cos(a),.82+.23*Math.sin(a)+.09,s*.34),hip=V(-.45,1.76+bob,s*.225);
  const d=foot.clone().sub(hip),dist=Math.hypot(d.x,d.y),len1=.585,len2=.575,along=(len1*len1-len2*len2+dist*dist)/(2*dist),height=Math.sqrt(Math.max(.0001,len1*len1-along*along)),knee=V(hip.x+d.x/dist*along-d.y/dist*height,hip.y+d.y/dist*along+d.x/dist*height,s*.31);
  shapeLimb(l.limb,hip,knee,foot);l.paw.position.copy(foot);l.paw.rotation.z=.07*Math.sin(a);for(let k=0;k<3;k++)l.toes[k].position.set(foot.x+.126,foot.y-.015,foot.z+(k-1)*.048);
 }
 const wave=waveUntil-t;
 const lift=wave>0?Math.min(1,(2.1-wave)/.28,wave/.28):0;
 for(let arm of arms){const s=arm.side,shoulder=V(-.08,2.275+bob,s*.255),rest=V(.84,1.817,s*.335),el=V(.3,2.025+bob,s*.343),hand=rest.clone();
  if(s===1&&lift>0){hand.lerp(V(.25,2.98+bob,.56+Math.sin(t*12)*.095),lift);el.lerp(V(.14,2.55+bob,.43),lift);}shapeLimb(arm.limb,shoulder,el,hand);arm.paw.position.copy(hand);arm.paw.rotation.z=lift>0&&s===1?-.3+Math.sin(t*12)*.18:0;
 }
 cargo.rotation.z=Math.sin(phase*2+.3)*.009;
 const wind=.8+rideSpeed*.3+gust;for(let s of scarves)updateScarf(s,t,wind);
 wheels.forEach(w=>w.rotation.z=-travel/.673);
}
function updateWorld(t){
 for(let c of treeCrowns){c.g.rotation.z=Math.sin(t*1.25+c.phase)*(.022+gust*.013);c.g.rotation.x=Math.sin(t*.95+c.phase)*.015;}
 for(let r of reedGroups)r.g.rotation.z=Math.sin(t*2.4+r.phase)*(.04+gust*.018);
 for(let i=0;i<ducks.length;i++){const d=ducks[i],a=.8+t*.025-d.offset,p=ellipsePoint(10.25,5.68,a,.27);d.g.position.copy(p);d.g.rotation.y=Math.atan2(-5.68*Math.cos(a),-10.25*Math.sin(a));d.g.rotation.z=Math.sin(t*2+d.phase)*.03;d.ring.scale.set(1+Math.sin(t*2+d.phase)*.06,.65,1);}
 for(let i=0;i<smoke.length;i++){const u=(t*.13+i*.25)%1;smoke[i].position.set(.83+u*.3,3.17+u*1.5,-.45+Math.sin(t*.4+i)*.04);smoke[i].scale.setScalar(.12+u*.19);}
 for(let i=0;i<leafData.length;i++){const l=leafData[i];dummy.position.set(((l.x+t*(.16+gust*.1)+20)%40)-20,l.y+Math.sin(t*.7+l.phase)*.26,l.z+Math.sin(t*.5+l.phase)*.7);dummy.rotation.set(t*.7+l.phase,t*.5,t*.9+l.phase);dummy.scale.set(l.s*1.3,l.s*.17,l.s*.65);dummy.updateMatrix();leafMesh.setMatrixAt(i,dummy.matrix);}leafMesh.instanceMatrix.needsUpdate=true;
 pollen.rotation.y=Math.sin(t*.075)*.015;pollen.position.y=Math.sin(t*.4)*.06;
}
function updateCamera(dt){
 const ease=1-Math.exp(-dt*5);orbitYaw=lerp(orbitYaw,orbitYawTarget,ease);orbitPitch=lerp(orbitPitch,orbitPitchTarget,ease);zoom=lerp(zoom,zoomTarget,ease);
 const narrow=innerWidth/innerHeight<.85,aspectScale=narrow?(mode==='close'?1.95:1.6):1;
 if(mode==='wide'){target.set(0,.5,0);let a=.8+orbitYaw,r=48*zoom*Math.max(1,1.2/camera.aspect),elev=.73+orbitPitch;camDesired.set(Math.sin(a)*Math.cos(elev)*r,Math.sin(elev)*r,Math.cos(a)*Math.cos(elev)*r);}
 else{target.copy(vehicle.position).add(V(0,mode==='close'?1.88:1.55,0));const r=(mode==='close'?6.6:10.8)*zoom*aspectScale,elev=clamp((mode==='close'?.19:.29)+orbitPitch,.08,1.22),local=V(Math.sin(.5+orbitYaw)*Math.cos(elev)*r,Math.sin(elev)*r,Math.cos(.5+orbitYaw)*Math.cos(elev)*r);local.applyAxisAngle(UP,vehicle.rotation.y);camDesired.copy(target).add(local);}
 camLook.copy(target);if(!cameraReady){camera.position.copy(camDesired);smoothLook.copy(camLook);cameraReady=true;}else{camera.position.lerp(camDesired,1-Math.exp(-dt*3.8));smoothLook.lerp(camLook,1-Math.exp(-dt*5.2));}camera.lookAt(smoothLook);scene.fog.near=mode==='wide'?Math.max(55,camera.position.length()*.9):55;scene.fog.far=scene.fog.near+65;
}
function tick(stamp){requestAnimationFrame(tick);const raw=(stamp-lastStamp)/1000,dt=Math.min(Math.max(raw,0),.05);lastStamp=stamp;
 const animDt=paused?0:dt;simTime+=animDt;const dist=2.3*rideSpeed*animDt;travel+=dist;const deriv=Math.hypot(14.82*Math.sin(routeAngle),9.45*Math.cos(routeAngle));routeAngle=(routeAngle+dist/deriv)%TAU;
 const p=ellipsePoint(14.82,9.45,routeAngle,.128);vehicle.position.copy(p);const tangent=V(-14.82*Math.sin(routeAngle),0,9.45*Math.cos(routeAngle));vehicle.rotation.y=Math.atan2(-tangent.z,tangent.x);bike.rotation.x=.023*rideSpeed*rideSpeed;bike.rotation.z=Math.sin(travel/.76*2)*.005;
 gustTarget=Math.max(0,gustTarget-animDt*.35);gust=lerp(gust,gustTarget,1-Math.exp(-animDt*2.5));dusk=lerp(dusk,duskTarget,1-Math.exp(-dt*1.4));waterUniforms.uTime.value=simTime;waterUniforms.uDusk.value=dusk;
 scene.background.copy(dayBg).lerp(duskBg,dusk);scene.fog.color.copy(scene.background);sun.color.copy(daySun).lerp(duskSun,dusk);sun.intensity=lerp(3,1.35,dusk);hemi.color.copy(dayHemi).lerp(duskHemi,dusk);hemi.intensity=lerp(1.85,1.2,dusk);fill.intensity=lerp(.65,.4,dusk);floor.material.color.copy(dayBg).lerp(duskBg,dusk);mats.lamp.emissive.set('#ffd88d');mats.lamp.emissiveIntensity=lerp(.2,1.4,dusk);mats.window.emissive.set('#ffc777');mats.window.emissiveIntensity=lerp(0,.65,dusk);
 updateOtter(simTime);updateWorld(simTime);updateCamera(dt);renderer.render(scene,camera);frames++;frameMs=lerp(frameMs,raw*1000,.025);
 if(frames===2){$('loading').style.opacity='0';setTimeout(()=>$('loading').remove(),650);}
}
document.addEventListener('visibilitychange',()=>{lastStamp=performance.now();});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();toast('画面暂时休息了，请重新打开文件');});
// Read-only diagnostics used for final offline and interaction verification.
window.__riverPost={get state(){return{paused,mode,speed:rideSpeed,time:simTime,travel,angle:routeAngle,gust,dusk,frames,frameMs,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,revision:T.REVISION};},scene,camera,renderer,vehicle};
requestAnimationFrame(tick);
})();
