import * as THREE from 'three';
const $=id=>document.getElementById(id);
const scene=new THREE.Scene();scene.background=new THREE.Color('#b6e2e5');scene.fog=new THREE.Fog('#b6e2e5',55,150);
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.1,240);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;$('scene').appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe3f7ff,0xd7b683,2.7));const sun=new THREE.DirectionalLight(0xffedce,3.2);sun.position.set(15,25,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:65});sun.shadow.normalBias=.035;scene.add(sun,sun.target);
const mat=(color,roughness=.72,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const M={fur:mat('#e7a252'),lightFur:mat('#ffe5af'),stripe:mat('#b67539'),pink:mat('#e9a1a3'),black:mat('#273e42'),mint:mat('#64c6b1',.35,.15),mintLight:mat('#b2ebd8',.36),chrome:mat('#ddece8',.25,.55),rubber:mat('#31474a'),seat:mat('#e6caa7'),red:mat('#ee7058'),yellow:mat('#fff3ba'),white:mat('#fff6e6'),trunk:mat('#aa8053'),leaf:mat('#478f68'),leafLight:mat('#70ad78'),sand:mat('#e9d4a2'),grass:mat('#89b882'),road:mat('#63787b'),foam:mat('#d0f9ed')};
const sphere=new THREE.SphereGeometry(1,24,16),box=new THREE.BoxGeometry(1,1,1);
function mesh(g,m,p,s,parent=scene){const o=new THREE.Mesh(g,m);o.position.set(...p);if(s)o.scale.set(...s);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function ell(m,p,s,parent){return mesh(sphere,m,p,s,parent)}
function cube(m,p,s,parent){return mesh(box,m,p,s,parent)}
function rod(a,b,r,m,parent=scene,r2=r){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const o=mesh(new THREE.CylinderGeometry(r2,r,d.length(),10),m,av.clone().add(bv).multiplyScalar(.5).toArray(),null,parent);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
function line(points,r,m,parent){const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(new THREE.TubeGeometry(c,24,r,8,false),m,[0,0,0],null,parent);}
let seed=701;function rnd(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}
const tiles=[];const roadLength=224;
function tileWrap(g,base){tiles.push({g,base});}
for(let i=-7;i<7;i++){
 const g=new THREE.Group();g.position.x=i*16;scene.add(g);tileWrap(g,i*16);
 cube(M.road,[0,-.16,0],[16,.3,7.6],g);cube(M.sand,[0,-.29,-8],[16,.42,8.4],g);cube(M.grass,[0,-.25,8],[16,.4,8.4],g);
 cube(M.white,[0,.007,3.3],[16,.018,.085],g);cube(M.white,[0,.007,-3.3],[16,.018,.085],g);
 for(let x=-6;x<8;x+=4)cube(M.white,[x,.01,0],[1.9,.02,.11],g);
 for(let x=-7;x<8;x+=2){cube(M.sand,[x,.035,-3.85],[1.96,.18,.4],g);}
 for(let x=-6;x<8;x+=8){rod([x,.1,-4.4],[x,.85,-4.4],.045,M.chrome,g);cube(M.white,[x,.83,-4.4],[.18,.16,.14],g);}
 rod([-8,.64,-4.4],[8,.64,-4.4],.033,M.chrome,g);
 for(let j=0;j<2;j++){const rock=ell(M.sand,[-7+rnd()*14,.13,-7-rnd()*2],[.25+rnd()*.5,.2,.3+rnd()*.4],g);rock.rotation.y=rnd()*6;}
}
// Palm crowns use individually shaped, curved leaflets.
function palm(x,z,h){const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);tileWrap(g,x);
 const bend=.7;line([[0,0,0],[.12,h*.4,0],[.4,h*.8,.04],[bend,h,0]],.16,M.trunk,g);
 for(let k=1;k<9;k++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.16-k*.004,.017,5,12),M.trunk);ring.position.set(bend*(k/9)**1.7,h*k/9,0);ring.rotation.x=Math.PI/2;g.add(ring);}
 for(let k=0;k<9;k++){const a=k/9*Math.PI*2;const verts=[],idx=[];for(let t=0;t<=8;t++){let u=t/8,rad=u*2.45,w=Math.sin(u*Math.PI)*.36,yy=h+Math.sin(u*Math.PI)*.6-u*.65;for(let side of [-1,1])verts.push(bend+Math.cos(a)*rad+Math.sin(a)*w*side,yy,Math.sin(a)*rad-Math.cos(a)*w*side);if(t<8){let n=t*2;idx.push(n,n+1,n+2,n+1,n+3,n+2);}}
 const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geom.setIndex(idx);geom.computeVertexNormals();const leafmat=(k%2?M.leaf:M.leafLight).clone();leafmat.side=THREE.DoubleSide;mesh(geom,leafmat,[0,0,0],null,g);}
 for(let k=0;k<3;k++)ell(M.trunk,[bend+Math.cos(k*2)*.21,h-.13,Math.sin(k*2)*.21],[.17,.21,.17],g);
}
for(let i=-6;i<=6;i++){palm(i*17+3,13.3+(i%3+3)%3,3.8+(i%2+2)%2*.6);if(i%2===0)palm(i*17-6,-8.4,3.7);}
const seaMat=new THREE.MeshStandardMaterial({color:'#36bbb9',roughness:.32,metalness:.12});const sea=mesh(new THREE.PlaneGeometry(360,180,140,90),seaMat,[0,-.34,-101],null);sea.rotation.x=-Math.PI/2;sea.castShadow=false;sea.receiveShadow=true;const seaBase=sea.geometry.attributes.position.array.slice();
const foamLines=[];for(let i=0;i<5;i++){const g=new THREE.Group();scene.add(g);for(let j=-15;j<=15;j++){const f=ell(M.foam,[j*7+(i%2)*3,0,0],[2+rnd()*2,.012,.04+rnd()*.06],g);f.castShadow=false;}g.position.set(0,-.16,-12-i*3.2);foamLines.push(g);}
const sparkles=new THREE.Group();scene.add(sparkles);const sparkleMat=new THREE.MeshBasicMaterial({color:'#d0f3df',transparent:true,opacity:.55});for(let i=0;i<170;i++)mesh(new THREE.PlaneGeometry(.15+rnd()*1.5,.04+rnd()*.08),sparkleMat,[(rnd()-.5)*200,-.19,-14-rnd()*100],null,sparkles).rotation.x=-Math.PI/2;
const background=new THREE.Group();scene.add(background);
for(let i=0;i<9;i++){const mountain=mesh(new THREE.ConeGeometry(7+rnd()*9,5+rnd()*9,5),mat(i%2?'#8fbdb5':'#a4c9bd'),[-100+i*24,-.2,-112-rnd()*20],null,background);mountain.rotation.y=rnd()*6;}
for(let i=0;i<11;i++){const cloud=new THREE.Group();cloud.position.set(-100+i*20,15+rnd()*10,-65-rnd()*45);for(let j=0;j<4;j++)ell(M.white,[j*1.8,Math.sin(j)*.6,0],[2.3, .62+rnd()*.45,.8],cloud).castShadow=false;background.add(cloud);}
const sunDisc=mesh(new THREE.SphereGeometry(4,24,16),new THREE.MeshBasicMaterial({color:'#fff3c7'}),[35,24,-100],null,background);
// Small sailboats along the horizon.
for(let i=0;i<4;i++){const g=new THREE.Group();g.position.set(i*47-80,0,-35-i*8);background.add(g);ell(M.white,[0,0,0],[1.25,.2,.38],g);rod([0,0,0],[0,3.3,0],.035,M.trunk,g);const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute([0,3.2,0,0,.5,0,1.5,.5,0],3));sg.computeVertexNormals();const sm=M.white.clone();sm.side=THREE.DoubleSide;mesh(sg,sm,[0,0,0],null,g);}
const birds=[];for(let i=0;i<7;i++){const g=new THREE.Group();const wings=[];for(let s of [-1,1]){const wing=new THREE.Group();g.add(wing);rod([0,0,0],[0,.08,s*.42],.024,M.white,wing);rod([0,.08,s*.42],[-.12,.02,s*.78],.018,M.white,wing);wings.push(wing);}g.position.set(-10+i*8,7+i%3,-16-i*3);scene.add(g);birds.push({g,wings,x:g.position.x});}
// Scooter faces +X. Both wheels turn from the same travelled distance.
const rider=new THREE.Group();rider.position.z=1.6;scene.add(rider);const body=new THREE.Group();rider.add(body);const wheels=[];
for(const x of [-.92,1.0]){const w=new THREE.Group();w.position.set(x,.43,0);body.add(w);const tire=mesh(new THREE.TorusGeometry(.32,.115,12,32),M.rubber,[0,0,0],null,w);const rim=mesh(new THREE.CylinderGeometry(.245,.245,.22,24),M.chrome,[0,0,0],null,w);rim.rotation.x=Math.PI/2;for(let k=0;k<6;k++){const a=k/6*Math.PI*2;rod([Math.cos(a)*.06,Math.sin(a)*.06,.125],[Math.cos(a)*.22,Math.sin(a)*.22,.125],.025,M.mint,w);}ell(M.mint,[0,0,.145],[.085,.085,.027],w);wheels.push(w);}
ell(M.mint,[-.8,.79,0],[.72,.44,.4],body);cube(M.mint,[.08,.48,0],[1.5,.15,.69],body);cube(M.rubber,[.05,.567,0],[.85,.035,.57],body);
const shield=ell(M.mint,[.78,1.08,0],[.21,.69,.42],body);shield.rotation.z=.15;
rod([.99,.43,0],[.87,1.63,0],.065,M.chrome,body);ell(M.mint,[.99,.75,0],[.46,.17,.27],body);
ell(M.seat,[-.59,1.19,0],[.69,.13,.4],body);cube(M.seat,[-.56,1.17,0],[.83,.12,.64],body);
rod([.87,1.58,-.52],[.87,1.58,.52],.065,M.chrome,body);for(let s of [-1,1]){rod([.87,1.58,s*.37],[.87,1.58,s*.61],.075,M.rubber,body);rod([.87,1.62,s*.42],[.89,2.02,s*.58],.025,M.chrome,body);ell(M.chrome,[.89,2.04,s*.6],[.045,.12,.17],body);ell(M.black,[.842,2.04,s*.6],[.008,.089,.137],body);}
ell(M.mint,[1.0,1.62,0],[.22,.22,.28],body);ell(M.chrome,[1.188,1.62,0],[.04,.174,.21],body);const lampMat=new THREE.MeshStandardMaterial({color:'#fff6c5',emissive:'#ffda8a',emissiveIntensity:.8});ell(lampMat,[1.222,1.62,0],[.026,.14,.18],body);
ell(M.red,[-1.41,.89,0],[.055,.095,.2],body);rod([-1.16,1.05,-.38],[-1.16,1.05,.38],.035,M.chrome,body);cube(M.white,[-1.425,.66,0],[.035,.19,.26],body);
// Cat: seated haunches, bent knees, paws fixed on grips and floorboard.
const cat=new THREE.Group();body.add(cat);ell(M.fur,[-.45,1.64,0],[.36,.55,.31],cat);ell(M.lightFur,[-.155,1.65,0],[.09,.35,.225],cat);
for(let s of [-1,1]){ell(M.fur,[-.34,1.26,s*.29],[.3,.28,.21],cat);rod([-.24,1.32,s*.3],[.08,1.02,s*.32],.14,M.fur,cat);rod([.08,1.02,s*.32],[.02,.68,s*.34],.1,M.fur,cat);ell(M.lightFur,[.15,.665,s*.35],[.23,.11,.14],cat);rod([-.24,1.98,s*.23],[.26,1.67,s*.33],.12,M.fur,cat);rod([.26,1.67,s*.33],[.85,1.62,s*.48],.095,M.fur,cat);ell(M.lightFur,[.88,1.62,s*.49],[.14,.11,.13],cat);}
const head=new THREE.Group();head.position.set(-.23,2.32,0);cat.add(head);ell(M.fur,[0,0,0],[.51,.48,.46],head);
function ear(z){const e=new THREE.Shape();e.moveTo(-.23,0);e.lineTo(.22,0);e.lineTo(.025,.34);e.closePath();const geo=new THREE.ExtrudeGeometry(e,{depth:.16,bevelEnabled:true,bevelSize:.04,bevelThickness:.035,bevelSegments:2,steps:1});const o=mesh(geo,M.fur,[-.11,.28,z],null,head);o.rotation.y=Math.PI/2;const inner=new THREE.Shape();inner.moveTo(-.13,.035);inner.lineTo(.12,.035);inner.lineTo(.015,.24);inner.closePath();const ig=new THREE.ShapeGeometry(inner);const io=mesh(ig,M.pink,[.102,.32,z],null,head);io.rotation.y=Math.PI/2;}
ear(-.32);ear(.32);
ell(M.lightFur,[.39,-.15,-.14],[.17,.17,.21],head);ell(M.lightFur,[.39,-.15,.14],[.17,.17,.21],head);ell(M.pink,[.55,-.07,0],[.048,.05,.07],head);
const eyes=[];for(let s of [-1,1]){const e=ell(M.black,[.427,.06,s*.225],[.055,.102,.073],head);eyes.push(e);ell(M.white,[.474,.097,s*.228],[.014,.029,.022],head);ell(M.pink,[.425,-.11,s*.33],[.021,.065,.09],head);for(let j=0;j<3;j++)rod([.46,-.16-j*.035,s*.23],[.43,-.13-j*.08,s*.63],.009,M.black,head);}
line([[.55,-.115,0],[.55,-.2,0],[.51,-.225,.07]],.012,M.black,head);line([[.55,-.19,0],[.51,-.225,-.07]],.012,M.black,head);
for(let s of [-1,0,1]){const st=ell(M.stripe,[.29,.32,s*.14],[.12,.048,.042],head);st.rotation.z=.6;}
for(let s of [-1,1])for(let i=0;i<2;i++){const st=ell(M.stripe,[-.06,-.05-i*.14,s*.43],[.18,.032,.025],head);st.rotation.z=s*.1;}
const tailRoot=new THREE.Group();tailRoot.position.set(-.7,1.33,-.14);cat.add(tailRoot);line([[0,0,0],[-.55,.1,-.12],[-.82,.55,-.05],[-.68,.84,.08]],.1,M.fur,tailRoot);ell(M.lightFur,[-.68,.84,.08],[.108,.12,.105],tailRoot);
// Coral scarf and a soft wind-blown ribbon.
const scarf=mesh(new THREE.TorusGeometry(.285,.075,8,28),M.red,[-.3,2.01,0],null,cat);scarf.rotation.x=Math.PI/2;
const scarfGeo=new THREE.PlaneGeometry(.9,.18,12,1);const ribbon=mesh(scarfGeo,M.red,[-.86,1.96,.1],null,cat);ribbon.material=M.red.clone();ribbon.material.side=THREE.DoubleSide;const ribbonBase=scarfGeo.attributes.position.array.slice();
// Small canvas labels generated locally, without external fonts or images.
function sign(x){const g=new THREE.Group();g.position.set(x,0,5.4);scene.add(g);tileWrap(g,x);rod([0,0,0],[0,2.25,0],.065,M.chrome,g);const c=document.createElement('canvas');c.width=512;c.height=256;const cx=c.getContext('2d');cx.fillStyle='#2f7d70';cx.fillRect(0,0,512,256);cx.strokeStyle='#e9f6dc';cx.lineWidth=8;cx.strokeRect(10,10,492,236);cx.fillStyle='#fff8de';cx.textAlign='center';cx.font='bold 52px sans-serif';cx.fillText('COAST ROAD',256,106);cx.font='36px sans-serif';cx.fillText('海 岸 公 路   →',256,180);const sm=new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(c),roughness:.8});const p=mesh(new THREE.BoxGeometry(2.2,1.1,.09),[M.chrome,M.chrome,M.chrome,M.chrome,sm,sm],[0,2.15,0],null,g);p.rotation.y=-.13;}
sign(22);sign(-75);
let running=!matchMedia('(prefers-reduced-motion: reduce)').matches, speed=1,distance=0,time=0,view=0,zoom=1,orbit=0,dragging=false,lastX=0,lastY=0,elevation=0;
const views=[{p:[5.4,3.5,7.8],look:[0,1.38,0]},{p:[-5.6,3.1,5],look:[.5,1.25,0]},{p:[7.6,8.5,12],look:[0,.6,-1.3]}];
function updatePause(){$('pause').textContent=running?'Ⅱ 暂停':'▶ 继续';$('pause').setAttribute('aria-pressed',String(!running));$('status').textContent=running?'正在兜风':'停下来，看看海';}updatePause();
$('pause').onclick=()=>{running=!running;updatePause()};$('view').onclick=()=>{view=(view+1)%views.length;orbit=0;elevation=0;zoom=1;$('view').textContent=['◈ 侧前视角','◈ 跟随视角','◈ 海岸全景'][view]};$('speed').oninput=e=>{speed=+e.target.value;$('speedLabel').textContent=speed.toFixed(1)+'×'};
$('reset').onclick=()=>{view=0;orbit=0;elevation=0;zoom=1;speed=1;$('speed').value='1';$('speedLabel').textContent='1.0×';$('view').textContent='◈ 侧前视角';};
addEventListener('keydown',e=>{if(e.code==='Space'&&!['INPUT','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();$('pause').click();}});
const canvas=renderer.domElement;canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!dragging)return;orbit-=(e.clientX-lastX)*.007;elevation=THREE.MathUtils.clamp(elevation+(e.clientY-lastY)*.015,-1.6,5);lastX=e.clientX;lastY=e.clientY;});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.001,.65,1.75)},{passive:false});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
let prev=performance.now(),frames=0;const target=new THREE.Vector3(),desired=new THREE.Vector3();
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-prev)/1000,.05);prev=now;if(running){time+=dt;distance+=dt*5.4*speed;}
 rider.position.x=distance;rider.position.y=.014*Math.sin(distance*3);body.rotation.x=.016*Math.sin(time*1.4);wheels.forEach(w=>w.rotation.z=-distance/.435);tailRoot.rotation.x=.14*Math.sin(time*2.5);ribbon.rotation.y=.12*Math.sin(time*4);
 const ra=scarfGeo.attributes.position;for(let i=0;i<ra.count;i++){const x=ribbonBase[i*3];ra.setZ(i,Math.sin(time*8+x*8)*.065*(.5-x));}ra.needsUpdate=true;scarfGeo.computeVertexNormals();
 const blink=(time%5.3)>5.13;eyes.forEach(e=>e.scale.y=blink?.013:.102);
 for(const {g,base} of tiles)g.position.x=base+Math.floor((distance-base+roadLength/2)/roadLength)*roadLength;
 sea.position.x=distance;background.position.x=distance*.94;sparkles.position.x=distance;for(let i=0;i<foamLines.length;i++){foamLines[i].position.x=distance;foamLines[i].position.z=-11.5-i*3.2+Math.sin(time*.7+i)*.55;foamLines[i].scale.z=1+Math.sin(time+i)*.24;}
 if(frames%3===0){const pa=sea.geometry.attributes.position;for(let i=0;i<pa.count;i++){let x=seaBase[i*3],y=seaBase[i*3+1];pa.setZ(i,Math.sin(x*.32+time*.95)*Math.cos(y*.37+time*.7)*.07);}pa.needsUpdate=true;sea.geometry.computeVertexNormals();}
 birds.forEach((b,i)=>{b.g.position.x=distance+b.x+Math.sin(time*.13+i)*5;b.g.position.y=7+i%3+Math.sin(time*.7+i)*.3;b.wings.forEach((w,k)=>w.rotation.x=Math.sin(time*3+i)*(k?1:-1)*.25)});
 sun.position.set(distance+15,25,12);sun.target.position.set(distance,0,0);
 const v=views[view],a=orbit,p=v.p,mobile=innerWidth<650?1.28:1;desired.set((p[0]*Math.cos(a)+p[2]*Math.sin(a))*zoom*mobile+distance,(p[1]+elevation)*zoom,(p[2]*Math.cos(a)-p[0]*Math.sin(a))*zoom*mobile+1.6);target.set(distance+v.look[0],v.look[1],1.6+v.look[2]);camera.position.lerp(desired,frames===0?1:1-Math.exp(-dt*5));camera.lookAt(target);
 renderer.render(scene,camera);if(frames%12===0){$('distance').textContent=(distance/1000).toFixed(2);$('kmh').textContent=running?Math.round(5.4*speed*3.6):'0';}frames++;window.__rideState={distance,time,running,speed,view,wheelAngle:wheels[0].rotation.z,frames,drawCalls:renderer.info.render.calls};
}requestAnimationFrame(animate);$('loading').remove();
window.addEventListener('webglcontextlost',e=>{e.preventDefault();$('status').textContent='画面已暂停，请刷新恢复';},false);

