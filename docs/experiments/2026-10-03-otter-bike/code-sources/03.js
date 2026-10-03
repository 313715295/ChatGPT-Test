import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const $=id=>document.getElementById(id), TAU=Math.PI*2, L=64;
const clamp=THREE.MathUtils.clamp, lerp=THREE.MathUtils.lerp;
const v=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
let seed=12477;function rand(a=0,b=1){seed=(seed*1664525+1013904223)>>>0;return a+(b-a)*seed/4294967296;}
const renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;
const scene=new THREE.Scene();scene.background=new THREE.Color('#e8eee6');scene.fog=new THREE.Fog('#e8eee6',32,91);
const camera=new THREE.PerspectiveCamera(38,1,.1,220);
const hemi=new THREE.HemisphereLight('#fff5dc','#719287',2.3);scene.add(hemi);
const sun=new THREE.DirectionalLight('#fff0ce',3.2);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-16;sun.shadow.camera.right=16;sun.shadow.camera.top=16;sun.shadow.camera.bottom=-16;sun.shadow.camera.near=.2;sun.shadow.camera.far=75;sun.shadow.normalBias=.035;sun.shadow.bias=-.00012;sun.shadow.radius=3;scene.add(sun,sun.target);
const rim=new THREE.DirectionalLight('#d8efe7',.8);rim.position.set(-8,9,-14);scene.add(rim);
const fill=new THREE.DirectionalLight('#ffedcf',.85);fill.position.set(8,6,12);scene.add(fill);
const materials={};
function mat(name,color,roughness=.8,metalness=0){return materials[name]=new THREE.MeshStandardMaterial({color,roughness,metalness});}
const M={fur:mat('fur','#805341'),furDark:mat('furDark','#684632'),cream:mat('cream','#ddbd92'),inner:mat('inner','#b28061'),nose:mat('nose','#332e29',.32),eye:mat('eye','#1f2826',.14),glint:new THREE.MeshBasicMaterial({color:'#fff9e8'}),teal:mat('teal','#338b80',.34,.28),metal:mat('metal','#c2c8b4',.3,.65),rubber:mat('rubber','#3b4743'),tire:mat('tire','#dfd5b7'),seat:mat('seat','#5e4936'),scarf:mat('scarf','#c55536'),gold:mat('gold','#ce9e53',.4,.3),paper:mat('paper','#c59560'),paperLight:mat('paperLight','#dcc08b'),strap:mat('strap','#76593b'),wood:mat('wood','#a78456'),woodDark:mat('woodDark','#6c6043'),grass:mat('grass','#aac184'),grassDark:mat('grassDark','#80a472'),leaf1:mat('leaf1','#82ac79'),leaf2:mat('leaf2','#a3ba78'),leaf3:mat('leaf3','#69987e'),leaf4:mat('leaf4','#b9c38a'),trunk:mat('trunk','#877256'),rock:mat('rock','#a5afa0'),rockLight:mat('rockLight','#d2d0b4'),petal:mat('petal','#fff0c8'),purple:mat('purple','#b99cae'),pollen:mat('pollen','#e4b052'),post:mat('post','#b9573d'),white:mat('white','#efe6ce'),roof:mat('roof','#b97453'),glass:mat('glass','#668e85',.25,.1),duck:mat('duck','#e6dec2'),duckHead:mat('duckHead','#426a56'),beak:mat('beak','#d99a41')};
const sphereG=new THREE.SphereGeometry(1,24,16), lowG=new THREE.IcosahedronGeometry(1,2), boxG=new THREE.BoxGeometry(1,1,1), roundG=new RoundedBoxGeometry(1,1,1,3,.13), cylG=new THREE.CylinderGeometry(1,1,1,12);
function mesh(g,m,p,x=0,y=0,z=0,sx=1,sy=1,sz=1){const a=new THREE.Mesh(g,m);a.position.set(x,y,z);a.scale.set(sx,sy,sz);a.castShadow=true;a.receiveShadow=true;p.add(a);return a;}
const ell=(p,m,x,y,z,sx,sy,sz)=>mesh(sphereG,m,p,x,y,z,sx,sy,sz);
const box=(p,m,x,y,z,sx,sy,sz,r=false)=>mesh(r?roundG:boxG,m,p,x,y,z,sx,sy,sz);
function rod(p,m,a,b,r=.04,r2=r){let g=r===r2?cylG:new THREE.CylinderGeometry(r2/r,1,1,10);const o=mesh(g,m,p);placeRod(o,a,b,r);return o;}
const UP=v(0,1,0), tmp=v();
function placeRod(o,a,b,r){o.position.copy(a).add(b).multiplyScalar(.5);tmp.copy(b).sub(a);o.scale.set(r,tmp.length(),r);o.quaternion.setFromUnitVectors(UP,tmp.normalize());}
function curve(p,m,pts,r=.03,segments=28){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(q=>Array.isArray(q)?v(...q):q)),segments,r,8,false),m,p);}
function torus(p,m,x,y,z,R,r,rx=0,ry=0,rz=0,arc=TAU){const t=mesh(new THREE.TorusGeometry(R,r,8,56,arc),m,p,x,y,z);t.rotation.set(rx,ry,rz);return t;}
function taperedTube(p,m,points,radii){const c=new THREE.CatmullRomCurve3(points.map(q=>v(...q))),frames=c.computeFrenetFrames(40,false),pos=[],norm=[],uv=[],idx=[];for(let i=0;i<=40;i++){const t=i/40,a=c.getPointAt(t),u=t*(radii.length-1),j=Math.min(radii.length-2,Math.floor(u)),r=lerp(radii[j],radii[j+1],u-j);for(let k=0;k<=12;k++){const ang=k/12*TAU,n=frames.normals[i].clone().multiplyScalar(Math.cos(ang)).addScaledVector(frames.binormals[i],Math.sin(ang));pos.push(a.x+r*n.x,a.y+r*n.y,a.z+r*n.z);norm.push(n.x,n.y,n.z);uv.push(t,k/12);if(i<40&&k<12){const b=i*13+k;idx.push(b,b+13,b+1,b+1,b+13,b+14);}}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return mesh(g,m,p);}
function canvasMap(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function plaque(p,text,x,y,z,w,h,color='#f2e5c5',ink='#496d60'){const t=canvasMap(512,256,(c,W,H)=>{c.fillStyle=color;c.fillRect(0,0,W,H);c.strokeStyle=ink;c.lineWidth=6;c.strokeRect(12,12,W-24,H-24);c.fillStyle=ink;c.font='600 64px Georgia,serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,W/2,H/2);});return mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,roughness:.8}),p,x,y,z);}
const bank=x=>.95*Math.sin(x*TAU/L)+.28*Math.sin(x*TAU*2/L+.7);
const slope=x=>.95*TAU/L*Math.cos(x*TAU/L)+.28*TAU*2/L*Math.cos(x*TAU*2/L+.7);
const road=x=>bank(x)+5.25;

// A complete, continuous landscape. The three matching sections allow endless travel.
const landscape=new THREE.Group();scene.add(landscape);
const tile=new THREE.Group();
function ribbon(from,to,y,m,steps=160,rows=1,wobble=false){const pos=[],uv=[],idx=[];for(let i=0;i<=steps;i++){const x=-L/2+L*i/steps;for(let j=0;j<=rows;j++){const z=lerp(from,to,j/rows)+bank(x)+(wobble?.05*Math.sin(x*2):0);pos.push(x,y,z);uv.push(i/steps,j/rows);if(i<steps&&j<rows){const k=i*(rows+1)+j;idx.push(k,k+1,k+rows+1,k+1,k+rows+2,k+rows+1);}}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return mesh(g,m,tile);}
const grassTop=mat('grassTop','#afc58a'), sand=mat('sand','#d4c396'),trail=mat('trail','#e4d3ab');
ribbon(3.15,42,.06,grassTop,160,4);ribbon(-42,-3.15,.06,grassTop,160,4);
ribbon(2.95,3.44,.012,sand,160,1,true);ribbon(-3.44,-2.95,.012,sand,160,1,true);
ribbon(4.07,6.44,.077,sand);ribbon(4.12,6.39,.085,trail);
// Quiet procedural water: flowing ripples, pale shallows and small moving glints.
const waterUniforms={uTime:{value:0},uDusk:{value:0}};
const waterMat=new THREE.ShaderMaterial({uniforms:waterUniforms,side:THREE.DoubleSide,vertexShader:`varying vec2 vUv;varying vec3 vPos;uniform float uTime;void main(){vUv=uv;vec3 p=position;p.y+=sin(p.x*1.8+p.z*3.0+uTime*.8)*.013;vPos=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vPos,1.);}`,fragmentShader:`varying vec2 vUv;varying vec3 vPos;uniform float uTime;uniform float uDusk;void main(){float edge=pow(abs(vUv.y-.5)*2.,5.);vec3 deep=mix(vec3(.23,.56,.53),vec3(.31,.49,.46),uDusk);vec3 shallow=mix(vec3(.56,.73,.59),vec3(.64,.64,.46),uDusk);float a=sin(vPos.x*2.5+vPos.z*8.+sin(vPos.x*.7+uTime*.6)*1.2-uTime*1.2);float b=sin(vPos.x*1.7-vPos.z*4.2+uTime*.7);float wave=smoothstep(.94,1.,a)*smoothstep(.25,.9,b);float sparkle=pow(max(0.,sin(vPos.x*5.3+vPos.z*11.2-uTime*1.3)*sin(vPos.x*1.8-vPos.z*8.1+uTime*.4)),20.);vec3 col=mix(deep,shallow,edge*.8);col+=wave*.045+sparkle*.15;float sw=sin(vPos.x*.27+vPos.z*.9+uTime*.13);col+=sw*.015;gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
ribbon(-3.1,3.1,-.037,waterMat,200,12);

function tree(x,z,s=1,type=0){const p=new THREE.Group();p.position.set(x,.06,z+bank(x));p.scale.setScalar(s);tile.add(p);rod(p,M.trunk,v(0,0,0),v(.06,2.8,0),.16,.075);for(let j=0;j<3;j++){const a=j*2.4+.5;rod(p,M.trunk,v(0,1.4+j*.3,0),v(Math.cos(a)*.75,2.7+j*.28,Math.sin(a)*.75),.055,.022);}const colors=[M.leaf1,M.leaf2,M.leaf3,M.leaf4];if(type===1){for(let k=0;k<3;k++)mesh(new THREE.ConeGeometry(1.02-k*.18,1.9,9),colors[k%4],p,0,2+k*.8,0);}else{for(let j=0;j<7;j++){const a=j*2.399;mesh(lowG,colors[(j+type)%4],p,Math.cos(a)*(j? .67:0),2.8+(j%3)*.38,Math.sin(a)*(j?.61:0),.98+rand(-.1,.2),1.04+rand(-.1,.2),.92);}}}
for(let i=0;i<19;i++){const x=-31+i*3.4;tree(x,rand(-19,-12),rand(.9,1.7),i%3===0?1:0);}
for(const [x,z,s] of [[-24,-7,1.0],[-17,-9,1.15],[-9,-8,.9],[4,-12,1.3],[17,-9,1.05],[24,-7,1.0],[-18,19,1.2],[22,20,1.3],[32,22,1.4],[-30,20,1]])tree(x,z,s);
function tuft(p,x,z,s=.5){for(let j=0;j<4;j++){const a=j*2.39,tip=v(x+Math.cos(a)*s*.24,s*rand(.5,1.0),z+Math.sin(a)*s*.24);const blade=mesh(new THREE.ConeGeometry(.025,s,3),j%2?M.grassDark:M.grass,p);blade.position.copy(v(x,.08,z).add(tip).multiplyScalar(.5));blade.quaternion.setFromUnitVectors(UP,tip.sub(v(x,.08,z)).normalize());}}
for(let i=0;i<260;i++){const x=rand(-32,32),side=i%3===0?-1:1,z=bank(x)+(side<0?rand(-7.5,-3.35):(i%2?rand(3.45,3.95):rand(6.6,10)));tuft(tile,x,z,rand(.23,.57));}
for(let i=0;i<120;i++){const x=rand(-32,32),z=bank(x)+(i%2?rand(6.8,9.8):rand(-6,-3.4)),s=rand(.09,.32);mesh(lowG,i%3?M.rock:M.rockLight,tile,x,.03,z,s,s*.52,s*.8).rotation.set(rand(0,1),rand(0,6),rand(0,1));}
for(let i=0;i<170;i++){const x=rand(-32,32),z=bank(x)+rand(4.2,6.3);ell(tile,i%2?sand:M.paperLight,x,.09,z,rand(.012,.035),.006,rand(.015,.044));}
function flower(x,z,s,col){rod(tile,M.grassDark,v(x,.07,z),v(x,s,z),.012);for(let j=0;j<5;j++){const a=j/5*TAU;ell(tile,col,x+Math.cos(a)*.075,s,z+Math.sin(a)*.075,.063,.025,.045).rotation.y=-a;}ell(tile,M.pollen,x,s+.018,z,.04,.031,.04);}
for(let i=0;i<75;i++){const x=rand(-32,32),z=bank(x)+rand(6.7,9.6);flower(x,z,rand(.23,.45),i%4?M.petal:M.purple);}
for(let i=0;i<48;i++){const x=rand(-32,32),z=bank(x)+(i%2?-1:1)*rand(2.9,3.25),h=rand(.5,.95);rod(tile,M.grassDark,v(x,-.01,z),v(x+.045,h,z),.013);rod(tile,M.woodDark,v(x+.045,h-.16,z),v(x+.045,h+.08,z),.041);tuft(tile,x,z,.65);}
// Footbridge, with a gently arched deck and two continuous handrails.
const bx=17;function bridgeY(t){return .20+.58*Math.sin(Math.PI*t);}
for(let j=0;j<=24;j++){const t=j/24,z=bank(bx)-3.8+7.6*t,y=bridgeY(t);box(tile,M.wood,bx,y,z,1.63,.10,.285,true);}
for(const side of [-1,1]){const pts=[];for(let j=0;j<=24;j++){const t=j/24;pts.push(v(bx+side*.78,bridgeY(t)+.66,bank(bx)-3.8+t*7.6));if(j%4===0)rod(tile,M.woodDark,v(bx+side*.78,bridgeY(t),bank(bx)-3.8+t*7.6),pts[j],.055);}curve(tile,M.woodDark,pts,.048,48);curve(tile,M.woodDark,pts.map(q=>q.clone().add(v(0,-.34,0))),.027,48);}
// A tiny riverside post office, flower boxes and a red post box.
const house=new THREE.Group();house.position.set(3.5,.06,bank(3.5)-9.2);tile.add(house);
box(house,M.white,0,1.07,0,3.2,2.14,2.5,true);box(house,M.rock,0,.13,0,3.35,.25,2.65,true);
const roofShape=new THREE.Shape();roofShape.moveTo(-1.8,2.1);roofShape.lineTo(0,3.35);roofShape.lineTo(1.8,2.1);roofShape.closePath();const rg=new THREE.ExtrudeGeometry(roofShape,{depth:2.9,bevelEnabled:false});mesh(rg,M.roof,house,0,0,-1.45);
for(let i=0;i<12;i++){const z=-1.43+i*.26;rod(house,M.roof,v(-1.84,2.12,z),v(0,3.38,z),.035);rod(house,M.roof,v(0,3.38,z),v(1.84,2.12,z),.035);}
box(house,M.roof,.97,3.02,-.52,.37,1.03,.41,true);box(house,M.rockLight,.97,3.55,-.52,.48,.13,.5,true);
box(house,M.woodDark,-.68,.67,1.268,.62,1.34,.07,true);box(house,M.glass,-.68,.90,1.311,.41,.5,.035,true);ell(house,M.gold,-.45,.64,1.32,.04,.04,.027);
for(const x of [.62]){box(house,M.wood,x,1.15,1.3,1.05,.91,.13,true);box(house,M.glass,x,1.15,1.38,.89,.73,.03);box(house,M.white,x,1.15,1.4,.045,.75,.04);box(house,M.white,x,1.15,1.4,.9,.045,.04);box(house,M.post,x,.65,1.42,1.04,.22,.3,true);for(let j=0;j<6;j++)ell(house,j%2?M.petal:M.leaf2,x-.4+j*.16,.79,1.45,.12,.12,.12);}
plaque(house,'RIVER POST',0,1.9,1.3,1.4,.34);
for(let i=0;i<5;i++)box(tile,M.rockLight,2.9,.105,bank(3.5)-7.55+i*.6,.65,.035,.38,true);
const mail=new THREE.Group();mail.position.set(-7,0,bank(-7)+3.75);tile.add(mail);rod(mail,M.wood,v(0,.1,0),v(0,1.02,0),.075);box(mail,M.post,0,1.18,0,.43,.5,.4,true);box(mail,M.woodDark,0,1.25,.207,.28,.045,.016);plaque(mail,'POST',0,1.02,.21,.28,.13);box(mail,M.gold,.26,1.39,0,.06,.18,.025);
const sign=new THREE.Group();sign.position.set(-5,0,bank(-5)-4.15);tile.add(sign);rod(sign,M.woodDark,v(0,.02,0),v(0,1.42,0),.054);box(sign,M.wood,0,1.22,0,1.7,.45,.10,true);plaque(sign,'RIVERSIDE  →',0,1.23,.055,1.62,.37);
// Merge static scenery by material so the small details stay inexpensive to draw.
function mergeStatic(root){root.updateMatrixWorld(true);const groups=new Map();root.traverse(o=>{if(o.isMesh){let arr=groups.get(o.material);if(!arr){arr=[];groups.set(o.material,arr);}let geo=o.geometry.clone();geo.applyMatrix4(o.matrixWorld);if(geo.index)geo=geo.toNonIndexed();if(!geo.getAttribute('uv'))geo.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(geo.getAttribute('position').count*2).fill(0),2));for(const key of Object.keys(geo.attributes))if(!['position','normal','uv'].includes(key))geo.deleteAttribute(key);arr.push(geo);}});const group=new THREE.Group();for(const [m,gs] of groups){const merged=mergeGeometries(gs,false);if(merged){const o=mesh(merged,m,group);if(m===waterMat){o.castShadow=false;o.receiveShadow=false;}}for(const g of gs)g.dispose();}return group;}
const staticTile=mergeStatic(tile);for(const x of [-L,0,L]){const t=staticTile.clone();t.position.x=x;landscape.add(t);}

// The courier's bicycle: real rolling wheels, rotating spokes, chain and pedals.
const rider=new THREE.Group();scene.add(rider);
const bicycle=new THREE.Group();rider.add(bicycle);
const wheels=[];
for(const x of [-.96,1.00]){const w=new THREE.Group();w.position.set(x,.64,0);bicycle.add(w);wheels.push(w);torus(w,M.rubber,0,0,0,.552,.055);torus(w,M.tire,0,0,.016,.548,.032);torus(w,M.tire,0,0,-.016,.548,.032);torus(w,M.metal,0,0,0,.493,.023);rod(w,M.metal,v(0,0,-.105),v(0,0,.105),.066);for(let j=0;j<18;j++){const a=j/18*TAU;rod(w,M.metal,v(0,0,j%2?.035:-.035),v(Math.cos(a)*.494,Math.sin(a)*.494,0),.007);}torus(bicycle,M.teal,x,.64,0,.629,.030,0,0,.10,Math.PI-.20);}
const rear=v(-.96,.64,0),crank=v(-.14,.63,0),seat=v(-.4,1.46,0),headTop=v(.62,1.50,0),headBot=v(.71,1.23,0),front=v(1,.64,0);
for(const [a,b] of [[rear,seat],[seat,crank],[crank,rear],[seat,headTop],[crank,headBot],[headTop,headBot]])rod(bicycle,M.teal,a,b,.041);
for(const z of [-.075,.075]){rod(bicycle,M.teal,v(.66,1.42,z),v(1,.64,z),.030);rod(bicycle,M.teal,v(-.4,1.42,z),v(-.96,.64,z),.026);}
rod(bicycle,M.metal,seat,v(-.44,1.65,0),.03);ell(bicycle,M.seat,-.40,1.62,0,.31,.075,.21);
rod(bicycle,M.metal,headTop,v(.56,1.90,0),.028);curve(bicycle,M.metal,[[.56,1.89,-.44],[.68,1.93,-.32],[.70,1.92,0],[.68,1.93,.32],[.56,1.89,.44]],.028);
for(const z of [-.42,.42]){rod(bicycle,M.seat,v(.49,1.90,z),v(.68,1.93,z),.044);}
ell(bicycle,M.gold,.67,1.98,.24,.079,.046,.079);rod(bicycle,M.metal,v(.72,1.40,0),v(.86,1.53,0),.025);ell(bicycle,M.metal,.89,1.54,0,.102,.098,.10);ell(bicycle,M.petal,.965,1.555,0,.035,.078,.079);
curve(bicycle,M.rubber,[[.55,1.92,.18],[.87,1.85,.18],[.90,1.37,.16],[.97,.88,.08]],.010);
// Back rack and secure cargo.
box(bicycle,M.metal,-1.0,1.38,0,.77,.055,.53,true);for(const z of [-.25,.25]){rod(bicycle,M.metal,v(-1.33,1.37,z),v(-.96,.65,z),.019);rod(bicycle,M.metal,v(-.70,1.37,z),v(-.96,.65,z),.019);}
const cargo=new THREE.Group();cargo.position.set(-1.04,1.42,0);bicycle.add(cargo);
box(cargo,M.paper,0,.25,0,.73,.49,.57,true);box(cargo,M.paperLight,.045,.58,-.02,.58,.22,.49,true);
box(cargo,M.strap,0,.25,.292,.049,.51,.014);box(cargo,M.strap,0,.704,-.02,.05,.012,.50);box(cargo,M.strap,.045,.58,.235,.046,.25,.012);box(cargo,M.strap,0,.49,.0,.75,.013,.04);box(cargo,M.strap,.045,.584,-.272,.047,.24,.01);
const label=plaque(cargo,'WITH LOVE',-.13,.31,.297,.29,.15,'#f3dfb5','#88684b');label.rotation.z=.12;
curve(cargo,M.strap,[[0,.71,0],[-.14,.78,.02],[-.16,.76,.07],[0,.715,0],[.12,.78,.04],[.16,.75,.07],[0,.715,0]],.010,32);
for(const z of [-.075,.075]){curve(bicycle,M.rubber,[[-.96,.75,z],[-.14,.80,z],[.03,.64,z],[-.14,.46,z],[-.96,.54,z],[-1.05,.64,z],[-.96,.75,z]],.012);}
torus(bicycle,M.metal,-.14,.63,.10,.154,.025);torus(bicycle,M.metal,-.96,.64,.10,.096,.018);
const pedalMeshes=[],crankArms=[];
for(const s of [-1,1]){crankArms.push(rod(bicycle,M.metal,v(-.14,.63,s*.13),v(-.14,.92,s*.13),.024));pedalMeshes.push(box(bicycle,M.seat,0,0,s*.30,.24,.062,.23,true));}

// A rounded otter silhouette, cream muzzle, small ears, whiskers and a long tapered tail.
const otter=new THREE.Group();rider.add(otter);const torso=new THREE.Group();otter.add(torso);
ell(torso,M.fur,-.20,2.15,0,.46,.63,.37).rotation.z=-.25;
ell(torso,M.cream,.08,2.09,.0,.28,.49,.31).rotation.z=-.32;
ell(torso,M.fur,-.37,1.79,0,.41,.36,.35);
ell(torso,M.fur,.13,2.65,0,.29,.30,.29);
const head=new THREE.Group();head.position.set(.32,2.96,0);torso.add(head);
ell(head,M.fur,0,0,0,.55,.425,.425);
ell(head,M.cream,.22,-.22,0,.32,.22,.32);
for(const s of [-1,1]){ell(head,M.fur,-.30,.24,s*.315,.125,.132,.103);ell(head,M.inner,-.278,.25,s*.397,.075,.077,.021);ell(head,M.cream,.415,-.11,s*.125,.20,.14,.20);}
ell(head,M.nose,.551,-.058,0,.087,.066,.108);
const eyes=[];for(const s of [-1,1]){const e=new THREE.Group();e.position.set(.235,.071,s*.331);head.add(e);ell(e,M.furDark,-.012,0,0,.106,.123,.054);ell(e,M.eye,.013,0,s*.026,.061,.077,.038);ell(e,M.glint,.028,.029,s*.06,.019,.022,.009);eyes.push(e);curve(head,M.furDark,[[.41,-.16,s*.11],[.45,-.19,s*.08],[.51,-.15,0]],.012,12);for(let j=0;j<3;j++){curve(head,M.cream,[[.37,-.145,s*.19],[.38+(j-1)*.055,-.12+(j-1)*.061,s*.41],[.40+(j-1)*.09,-.13+(j-1)*.093,s*.61]],.006,12);ell(head,M.furDark,.468-j*.039,-.104+(j%2)*.035,s*(.156+j*.025),.010,.010,.010);}}
// Two little brow ridges and close-set fur tufts keep the face soft and expressive.
for(const s of [-1,1])curve(head,M.furDark,[[.14,.20,s*.32],[.22,.22,s*.32],[.29,.18,s*.31]],.016,12);
const tail=taperedTube(otter,M.fur,[[-.53,1.78,.1],[-.86,1.49,.38],[-1.19,1.07,.57],[-1.70,.78,.68],[-2.09,.72,.63]],[.22,.20,.15,.085,.012]);
const limbs=[];
for(const s of [-1,1]){const thigh=rod(otter,M.fur,v(),v(0,1,0),.162);const shin=rod(otter,M.fur,v(),v(0,1,0),.121);const knee=ell(otter,M.fur,0,0,0,.167,.167,.15);const foot=ell(otter,M.furDark,0,0,0,.215,.106,.14);limbs.push({s,thigh,shin,knee,foot});}
const arms=[];for(const s of [-1,1]){const upper=rod(otter,M.fur,v(),v(0,1,0),.123),lower=rod(otter,M.fur,v(),v(0,1,0),.10),joint=ell(otter,M.fur,0,0,0,.134,.136,.133),paw=ell(otter,M.furDark,.58,1.945,s*.42,.128,.099,.092);arms.push({s,upper,lower,joint,paw});for(let j=0;j<2;j++)curve(otter,M.furDark,[[.64,1.972,s*.42+(j-.5)*.035],[.68,1.94,s*.42+(j-.5)*.035]],.008,4);}
// Cloth ribbons are deformed as continuous surfaces, attached to a soft collar.
const clothTex=canvasMap(128,128,(c,w,h)=>{c.fillStyle='#d76b45';c.fillRect(0,0,w,h);c.fillStyle='#edb167';c.fillRect(0,8,w,5);c.fillRect(0,115,w,5);for(let j=0;j<h;j+=3){c.fillStyle=j%2?'#ffffff08':'#372c2108';c.fillRect(0,j,w,1);}for(let j=0;j<w;j+=4){c.fillStyle='#ffffff08';c.fillRect(j,0,1,h);}});
clothTex.wrapS=clothTex.wrapT=THREE.RepeatWrapping;clothTex.repeat.set(3,1);M.scarf.color.set('#ffffff');M.scarf.map=clothTex;M.scarf.side=THREE.DoubleSide;
const collar=torus(torso,M.scarf,.13,2.65,0,.287,.085,Math.PI/2,0,-.14);collar.scale.y=.87;ell(torso,M.scarf,-.085,2.67,.275,.14,.13,.12);
const scarves=[];for(let k=0;k<2;k++){const n=36,w=4,pos=[],uv=[],idx=[];for(let i=0;i<=n;i++)for(let j=0;j<=w;j++){pos.push(0,0,0);uv.push(i/n,j/w);if(i<n&&j<w){const q=i*(w+1)+j;idx.push(q,q+1,q+w+1,q+1,q+w+2,q+w+1);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);const scarf=mesh(geo,M.scarf,otter);scarf.frustumCulled=false;scarves.push({geo,n,w,k});}

// Ducks leave expanding rings on the water. Butterflies and swallows share the breeze.
const ducks=[];for(let i=0;i<5;i++){const d=new THREE.Group();scene.add(d);ell(d,M.duck,0,.115,0,.27,.17,.16);ell(d,M.duckHead,.17,.28,0,.13,.14,.12);ell(d,M.beak,.295,.245,0,.10,.038,.064);for(const s of [-1,1])ell(d,M.eye,.208,.304,s*.097,.019,.022,.012);ell(d,M.woodDark,-.08,.185,.11,.15,.07,.047).rotation.z=.1;ell(d,M.woodDark,-.08,.185,-.11,.15,.07,.047).rotation.z=.1;const rings=[];for(let j=0;j<2;j++){const r=torus(d,new THREE.MeshBasicMaterial({color:'#bfdace',transparent:true,opacity:.35,depthWrite:false}),-.13,-.105,0,.34,.008,Math.PI/2);rings.push(r);}ducks.push({d,rings,x:-3+i*9,z:-1.3+(i%3)*.8,phase:i*1.9});}
const butterflies=[];for(let i=0;i<7;i++){const p=new THREE.Group();scene.add(p);const wingMat=i%2?M.pollen:M.petal;const wings=[];for(const s of [-1,1]){const wing=ell(p,wingMat,0,0,s*.055,.065,.008,.07);wings.push(wing);}butterflies.push({p,wings,x:rand(-30,30),z:rand(3.3,8.7),phase:rand(0,6)});}
const birds=[];for(let i=0;i<4;i++){const g=new THREE.Group();scene.add(g);ell(g,M.woodDark,0,0,0,.11,.055,.052);const wings=[];for(const s of [-1,1]){const wing=new THREE.Group();g.add(wing);ell(wing,M.woodDark,-.04,0,s*.19,.10,.024,.23);wings.push({wing,s});}birds.push({g,wings,phase:i*1.8});}
// Sparse airborne seeds add depth without obscuring the courier.
const pollenG=new THREE.BufferGeometry(),pollenPos=new Float32Array(45*3);for(let i=0;i<45;i++){pollenPos[i*3]=rand(-15,15);pollenPos[i*3+1]=rand(.3,5);pollenPos[i*3+2]=rand(-7,12);}pollenG.setAttribute('position',new THREE.BufferAttribute(pollenPos,3));const pollen=new THREE.Points(pollenG,new THREE.PointsMaterial({color:'#fff5c5',size:.035,transparent:true,opacity:.62,depthWrite:false}));scene.add(pollen);

let running=!matchMedia('(prefers-reduced-motion: reduce)').matches,speed=1,currentSpeed=1,elapsed=0,distance=0,dusk=0,targetDusk=0;
let last=performance.now(),frames=0,viewIndex=0,azimuth=.43,elevation=.30,radius=11.8,targetAz=.43,targetEl=.30,targetRadius=11.8,clean=false;
const views=[{name:'跟骑视角',a:.43,e:.30,r:11.8},{name:'近景视角',a:.66,e:.23,r:7.8},{name:'河岸全景',a:.30,e:.61,r:19.5}];
let bellAt=-50,toastTimer=0,audioCtx=null,audioMaster=null,ambientOn=false,riverGain=null,windGain=null;
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2300);}
function setPlay(){ $('play').innerHTML=running?'<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12" stroke-width="3"/></svg>':'<svg viewBox="0 0 24 24"><path d="M9 5l10 7-10 7z" fill="currentColor" stroke="none"/></svg>';$('play').setAttribute('aria-label',running?'暂停动画':'继续动画');if(audioMaster&&ambientOn)audioMaster.gain.setTargetAtTime(running?.15:.045,audioCtx.currentTime,.3);}
function togglePlay(){running=!running;setPlay();}
$('play').addEventListener('click',togglePlay);setPlay();
$('speed').addEventListener('input',e=>{speed=Number(e.target.value);$('speedLabel').value=(speed<.8?'慢游':speed<1.5?'悠然':'轻快')+' · '+speed.toFixed(1)+'×';const pct=(speed-.4)/1.8*100;e.target.style.background=`linear-gradient(to right,#b86543 ${pct}%,#dce2d7 ${pct}%)`;});
$('light').addEventListener('click',()=>{targetDusk=targetDusk?0:1;$('light').querySelector('span').textContent=targetDusk?'河畔夕照':'午后晴日';$('light').setAttribute('aria-label',targetDusk?'切换到晴日':'切换到夕照');$('weatherText').innerHTML=targetDusk?'落日暖暖 · 归途不急<em>把最后一缕阳光，捎给你。</em>':'河风轻轻 · 邮路漫漫<em>沿着水声，再骑一小段。</em>';});
function setView(i){viewIndex=i;const q=views[i];targetAz=q.a;targetEl=q.e;targetRadius=q.r;$('view').querySelector('span').textContent=q.name;}
$('view').addEventListener('click',()=>setView((viewIndex+1)%3));
function toggleClean(){clean=!clean;document.body.classList.toggle('hidden-ui',clean);$('clean').setAttribute('aria-label',clean?'显示界面':'隐藏界面');}
$('clean').addEventListener('click',toggleClean);
function initAudio(){
 if(audioCtx){if(audioCtx.state==='suspended')audioCtx.resume();return;}
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 audioCtx=new AC();audioMaster=audioCtx.createGain();audioMaster.gain.value=0;audioMaster.connect(audioCtx.destination);
 const buffer=audioCtx.createBuffer(1,audioCtx.sampleRate*3,audioCtx.sampleRate),data=buffer.getChannelData(0);let smooth=0;
 for(let i=0;i<data.length;i++){smooth=(smooth+.022*(Math.random()*2-1))/1.022;data[i]=smooth*3.2;}
 const src=audioCtx.createBufferSource();src.buffer=buffer;src.loop=true;
 const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=950;filter.Q.value=.25;
 riverGain=audioCtx.createGain();riverGain.gain.value=.8;src.connect(filter).connect(riverGain).connect(audioMaster);src.start();
 const wind=audioCtx.createBufferSource();wind.buffer=buffer;wind.loop=true;wind.playbackRate.value=.73;
 const wf=audioCtx.createBiquadFilter();wf.type='bandpass';wf.frequency.value=340;wf.Q.value=.4;
 windGain=audioCtx.createGain();windGain.gain.value=.23;wind.connect(wf).connect(windGain).connect(audioMaster);wind.start();
}
$('audio').addEventListener('click',()=>{initAudio();if(!audioCtx){toast('当前浏览器暂不支持自然声');return;}ambientOn=!ambientOn;audioMaster.gain.setTargetAtTime(ambientOn?(running?.15:.045):0,audioCtx.currentTime,.5);$('audio').setAttribute('aria-label',ambientOn?'关闭自然声':'开启自然声');$('audio').setAttribute('aria-pressed',String(ambientOn));$('audio').innerHTML=ambientOn?'<svg viewBox="0 0 24 24"><path d="M10 5L5 9H2v6h3l5 4zM14 8q5 4 0 8m3-11q8 7 0 14"/></svg>':'<svg viewBox="0 0 24 24"><path d="M10 5L5 9H2v6h3l5 4zM15 9l6 6m0-6-6 6"/></svg>';toast(ambientOn?'听，风和河水的声音。':'自然声已关闭');});
function chirp(){if(!audioCtx||!ambientOn||!running)return;const t=audioCtx.currentTime;for(let j=0;j<2;j++){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(1900+j*310,t+j*.15);o.frequency.exponentialRampToValueAtTime(2800+j*180,t+j*.15+.08);g.gain.setValueAtTime(0,t+j*.15);g.gain.linearRampToValueAtTime(.10,t+j*.15+.012);g.gain.exponentialRampToValueAtTime(.001,t+j*.15+.13);o.connect(g).connect(audioMaster);o.start(t+j*.15);o.stop(t+j*.15+.16);}}
const bellRings=[];for(let i=0;i<3;i++){const m=new THREE.MeshBasicMaterial({color:'#fff2b2',transparent:true,opacity:0,depthWrite:false});const ring=torus(bicycle,m,.67,2.02,.24,.14,.008,Math.PI/2);ring.visible=false;bellRings.push(ring);}
function bell(){bellAt=performance.now()/1000;initAudio();if(audioCtx){const t=audioCtx.currentTime;for(const delay of [0,.17])for(const [f,gain,d] of [[1520,.14,1.5],[2230,.06,.65],[3040,.025,.4]]){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t+delay);g.gain.linearRampToValueAtTime(gain,t+delay+.004);g.gain.exponentialRampToValueAtTime(.0001,t+delay+d);o.connect(g).connect(audioCtx.destination);o.start(t+delay);o.stop(t+delay+d+.03);}}toast('叮铃——心意正在路上。');}
$('bell').addEventListener('click',bell);
function photograph(){renderer.render(scene,camera);const c=document.createElement('canvas');c.width=renderer.domElement.width;c.height=renderer.domElement.height;const ctx=c.getContext('2d');ctx.drawImage(renderer.domElement,0,0);const s=c.width/1440;ctx.fillStyle='#fffaf0dc';ctx.fillRect(0,c.height-61*s,c.width,61*s);ctx.fillStyle='#4e6657';ctx.font=`${12*s}px Georgia,serif`;ctx.textBaseline='middle';ctx.fillText('RIVER POST  /  A LITTLE JOURNEY',29*s,c.height-29*s);ctx.font=`${11*s}px "Microsoft YaHei",sans-serif`;ctx.textAlign='right';ctx.fillText('小小的心意，慢慢送到。',c.width-29*s,c.height-29*s);c.toBlob(b=>{if(!b){toast('暂时无法保存，请重试');return;}const url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='河岸邮差-纪念.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('这一刻，已存成一张明信片。');},'image/png');$('flash').style.opacity='.6';setTimeout(()=>$('flash').style.opacity='0',80);}
$('photo').addEventListener('click',photograph);
window.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select')||e.ctrlKey||e.altKey||e.metaKey)return;const k=e.key.toLowerCase();if(k===' '){e.preventDefault();togglePlay();}if(k==='b')bell();if(k==='v')setView((viewIndex+1)%3);if(k==='h')toggleClean();if(k==='p')photograph();if(k==='r'){setView(0);toast('镜头已回到跟骑视角');}if(k==='escape'&&clean)toggleClean();});
const canvas=$('world'),pointers=new Map();let pinch=0;
canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');if(pointers.size===2){const a=[...pointers.values()];pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);}});
canvas.addEventListener('pointermove',e=>{const old=pointers.get(e.pointerId);if(!old)return;const dx=e.clientX-old.x,dy=e.clientY-old.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){targetAz-=dx*.006;targetEl=clamp(targetEl+dy*.004,.09,1.13);}else if(pointers.size===2){const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch>1)targetRadius=clamp(targetRadius*pinch/Math.max(1,d),6.4,28);pinch=d;}});
function release(e){pointers.delete(e.pointerId);if(!pointers.size)canvas.classList.remove('dragging');pinch=0;}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
canvas.addEventListener('wheel',e=>{e.preventDefault();targetRadius=clamp(targetRadius*Math.exp(e.deltaY*.001),6.4,28);},{passive:false});canvas.addEventListener('dblclick',()=>setView(0));
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}window.addEventListener('resize',resize);resize();
document.addEventListener('visibilitychange',()=>{last=performance.now();if(audioCtx&&audioMaster&&ambientOn)audioMaster.gain.setTargetAtTime(document.hidden?0:(running?.15:.045),audioCtx.currentTime,.2);});

function moveLeg(leg,index,angle,bob){const s=leg.s,foot=v(-.14+.28*Math.cos(angle),.68+.28*Math.sin(angle),s*.31),hip=v(-.36,1.77+bob,s*.28);const dx=foot.x-hip.x,dy=foot.y-hip.y,d=Math.hypot(dx,dy),a=.69,b=.66,along=clamp((a*a-b*b+d*d)/(2*d),0,a),h=Math.sqrt(Math.max(0,a*a-along*along));const knee=v(hip.x+dx/d*along-dy/d*h,hip.y+dy/d*along+dx/d*h,s*.34);placeRod(leg.thigh,hip,knee,.151);placeRod(leg.shin,knee,foot,.110);leg.knee.position.copy(knee);leg.foot.position.copy(foot).add(v(.04,.018,0));leg.foot.rotation.z=.08*Math.sin(angle);pedalMeshes[index].position.set(foot.x,foot.y-.081,s*.31);placeRod(crankArms[index],v(-.14,.63,s*.14),v(foot.x,foot.y-.05,s*.14),.024);}
function moveScarf(q,t,pace,bob){const {geo,n,w,k}=q,a=geo.attributes.position.array,len=k?1.13:1.74;for(let i=0;i<=n;i++){const u=i/n,fade=u*u,phase=u*8.5-t*(4+pace*1.6)+k*1.7;const cx=-.12-len*u,cy=2.70+bob+.14*u+Math.sin(phase)*(.07+.065*pace)*fade,cz=.26-k*.35+.12*u+Math.sin(phase*.8+.7)*.15*fade;for(let j=0;j<=w;j++){const across=(j/w-.5)*(.26-.06*u)*(k?.75:1),twist=Math.sin(phase+u*3)*.55*u;const ix=(i*(w+1)+j)*3;a[ix]=cx+.025*Math.sin(u*12+across*9)*fade;a[ix+1]=cy+across*Math.cos(twist);a[ix+2]=cz+across*Math.sin(twist);}}geo.attributes.position.needsUpdate=true;geo.computeVertexNormals();}
const bgDay=new THREE.Color('#e8eee6'),bgDusk=new THREE.Color('#eee0c8'),sunDay=new THREE.Color('#fff0ce'),sunDusk=new THREE.Color('#ffca91'),skyDay=new THREE.Color('#fff5dc'),skyDusk=new THREE.Color('#f8dfbc');
let nextChirp=4;
function animate(now){requestAnimationFrame(animate);if(document.hidden)return;const dt=Math.min((now-last)/1000,.055);last=now;
 if(running){elapsed+=dt;currentSpeed=lerp(currentSpeed,speed,1-Math.exp(-dt*3));distance+=dt*2.1*currentSpeed;}
 const t=elapsed,x=((distance+L/2)%L+L)%L-L/2,z=road(x),yaw=-Math.atan(slope(x)),phase=-distance/.607*.625,bob=.015*Math.sin(phase*2);
 rider.position.set(x,.054,z);rider.rotation.set(.012*Math.sin(phase),yaw,0);for(const w of wheels)w.rotation.z=-distance/.607;
 torso.position.y=bob;torso.rotation.z=.008*Math.sin(phase*2);head.rotation.y=.04*Math.sin(t*.7);head.rotation.z=.025*Math.sin(t*.85);
 const blinkT=t%4.7,blink=(blinkT>4.37&&blinkT<4.57)?Math.max(.08,Math.abs((blinkT-4.47)/.1)):1;for(const eye of eyes)eye.scale.y=blink;
 tail.rotation.x=.035*Math.sin(t*1.9);tail.rotation.y=.018*Math.sin(t*1.5);
 limbs.forEach((leg,i)=>moveLeg(leg,i,phase+i*Math.PI,bob));
 for(const arm of arms){const s=arm.s,shoulder=v(.11,2.42+bob,s*.30),elbow=v(.27+.013*Math.sin(phase),2.13+bob*.4,s*.415),hand=v(.58,1.94,s*.42);placeRod(arm.upper,shoulder,elbow,.126);placeRod(arm.lower,elbow,hand,.10);arm.joint.position.copy(elbow);}
 cargo.rotation.x=.008*Math.sin(phase*2);cargo.rotation.z=.006*Math.cos(phase*2);for(const q of scarves)moveScarf(q,t,currentSpeed,bob);
 waterUniforms.uTime.value=t;
 for(let i=0;i<ducks.length;i++){const q=ducks[i],base=q.x+t*.13,dx=x+((base-x+96)%64)-32;q.d.position.set(dx,.038+Math.sin(t*1.8+q.phase)*.013,bank(dx)+q.z+.12*Math.sin(t*.32+q.phase));q.d.rotation.y=-.08*Math.cos(t*.32+q.phase);for(let j=0;j<2;j++){const r=q.rings[j],f=(t*.4+j*.5+q.phase)%1;r.scale.set(1+f*2.5,.7+f*.8,1);r.material.opacity=(1-f)*.25;}}
 for(const b of butterflies){const bx=x+((b.x+t*.21-x+96)%64)-32;b.p.position.set(bx+Math.sin(t*.8+b.phase)*.7,.9+Math.sin(t*1.4+b.phase)*.25,bank(bx)+b.z+Math.cos(t*.8+b.phase)*.4);b.p.rotation.y=t*.25+b.phase;b.wings.forEach((w,i)=>{w.rotation.x=(i?1:-1)*Math.sin(t*21+b.phase)*1.0;});}
 for(let i=0;i<birds.length;i++){const b=birds[i];b.g.position.set(x+Math.sin(t*.12+i)*10,7.5+Math.sin(t*.4+i)*.4,bank(x)-11-i*.7+Math.cos(t*.12+i)*5);b.g.rotation.y=-t*.12-i;b.wings.forEach(q=>q.wing.rotation.x=q.s*Math.sin(t*5+b.phase)*.35);}
 pollen.position.set(x+Math.sin(t*.2)*.6,Math.sin(t*.4)*.2,bank(x));pollen.rotation.y=Math.sin(t*.09)*.1;
 const since=now/1000-bellAt;for(let j=0;j<bellRings.length;j++){const r=bellRings[j],age=since-j*.13;r.visible=age>0&&age<1.05;if(r.visible){r.scale.setScalar(1+age*3);r.position.y=2.03+age*.35;r.material.opacity=(1-age/1.05)*.60;}}
 if(t>nextChirp){chirp();nextChirp=t+6+Math.random()*6;}
 if(windGain&&running)windGain.gain.setTargetAtTime(.16+currentSpeed*.10+.04*Math.sin(t*.45),audioCtx.currentTime,.3);
 dusk=lerp(dusk,targetDusk,1-Math.exp(-dt*1.3));waterUniforms.uDusk.value=dusk;scene.background.copy(bgDay).lerp(bgDusk,dusk);scene.fog.color.copy(scene.background);sun.color.copy(sunDay).lerp(sunDusk,dusk);hemi.color.copy(skyDay).lerp(skyDusk,dusk);hemi.intensity=lerp(2.3,1.65,dusk);sun.intensity=lerp(3.2,3.7,dusk);sun.position.set(x-9,lerp(15,8,dusk),z+6);sun.target.position.set(x,0,z-1);
 const cameraEase=1-Math.exp(-dt*7);azimuth=lerp(azimuth,targetAz,cameraEase);elevation=lerp(elevation,targetEl,cameraEase);radius=lerp(radius,targetRadius,cameraEase);const mobileScale=camera.aspect<1?lerp(1.35,1.0,clamp((camera.aspect-.45)/.55,0,1)):1,dist=radius*mobileScale;const focus=v(x,1.47,z-.2);camera.position.set(focus.x+Math.sin(azimuth)*Math.cos(elevation)*dist,focus.y+Math.sin(elevation)*dist,focus.z+Math.cos(azimuth)*Math.cos(elevation)*dist);camera.lookAt(focus);
 if(frames%12===0)$('distance').textContent=Math.floor(distance).toString().padStart(3,'0');
 renderer.render(scene,camera);frames++;
 if(frames===2){$('loading').classList.add('done');setTimeout(()=>$('loading').remove(),900);}
}
requestAnimationFrame(animate);
// Compact read-only diagnostics used to verify the self-contained deliverable.
window.__riverPost={getState:()=>({running,speed,currentSpeed,distance,elapsed,view:viewIndex,dusk,ambientOn,frames,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,three:THREE.REVISION,camera:{azimuth,elevation,radius}})};


