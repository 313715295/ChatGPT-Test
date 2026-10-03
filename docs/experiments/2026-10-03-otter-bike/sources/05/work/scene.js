'use strict';
(() => {
const T=THREE, PI=Math.PI, TAU=PI*2, V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const canvas=document.getElementById('scene');
const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
const scene=new T.Scene();scene.background=new T.Color('#dce9dc');scene.fog=new T.Fog('#dce9dc',55,160);
const camera=new T.PerspectiveCamera(40,innerWidth/innerHeight,.1,270);
const hemi=new T.HemisphereLight('#fff3d9','#879767',2.5);scene.add(hemi);
const sun=new T.DirectionalLight('#ffdfad',3.4);sun.position.set(-15,25,15);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.near=.5;sun.shadow.camera.far=100;
Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18});sun.shadow.bias=-.00035;sun.shadow.normalBias=.028;sun.shadow.radius=3;scene.add(sun,sun.target);
const fill=new T.DirectionalLight('#e0f2ec',.65);fill.position.set(4,8,-12);scene.add(fill);
let seed=73819;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};const rr=(a,b)=>a+(b-a)*rand();
const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.86,...extra});
const M={grass:material('#9faf6c'),grass2:material('#a7b779'),earth:material('#a98b60'),edge:material('#cab68a'),sand:material('#d8c392'),path:material('#e5cfaa'),stone:material('#b5b6a0'),wood:material('#8f6345'),woodLight:material('#c69465'),leaf:material('#728d4f'),leaf2:material('#91a864'),leaf3:material('#a9b777'),dark:material('#293f36'),ivory:material('#fff0ca'),red:material('#c96049'),metal:material('#d5d9c6',{metalness:.65,roughness:.35}),teal:material('#4e8a80'),gold:material('#cb9955',{metalness:.45,roughness:.4}),white:material('#fff6df'),brown:material('#765036'),fur:material('#95643e'),furLight:material('#ba8651'),muzzle:material('#e4be80'),nose:material('#382e28',{roughness:.42}),eye:material('#162b2a',{roughness:.13}),scarf:material('#cf6248',{roughness:.9,side:T.DoubleSide}),tire:material('#303d37'),rim:material('#eee2ba',{metalness:.25,roughness:.5}),bike:material('#588f85',{metalness:.25,roughness:.52}),saddle:material('#654633'),parcel:material('#c69a64'),tape:material('#dfbd83'),string:material('#f0d49f')};
const sphereG=new T.SphereGeometry(1,24,16), lowG=new T.IcosahedronGeometry(1,1), leafG=new T.IcosahedronGeometry(1,2), boxG=new T.BoxGeometry(1,1,1), cylG=new T.CylinderGeometry(1,1,1,12);
const world=new T.Group();scene.add(world);
function mesh(g,m,p,s,parent=world,shadow=true){let o=new T.Mesh(g,m);if(p)o.position.copy(p);if(s)o.scale.copy(s);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o}
function ball(p,s,m,parent=world,low=false){return mesh(low?lowG:sphereG,m,p,s,parent)}
function box(p,s,m,parent=world){return mesh(boxG,m,p,s,parent)}
function rod(a,b,r,m,parent=world,r2){let g=r2!==undefined?new T.CylinderGeometry(r2,r,1,12):cylG;let o=mesh(g,m,a.clone().add(b).multiplyScalar(.5),V(r2===undefined?r:1,a.distanceTo(b),r2===undefined?r:1),parent);o.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());return o}
function curveTube(points,r,m,parent=world,segments=32){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),segments,r,8,false),m,null,null,parent)}
function torus(r,t,m,parent,p,rot){let o=mesh(new T.TorusGeometry(r,t,8,48),m,p,null,parent);if(rot)o.rotation.set(...rot);return o}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=renderer.capabilities.getMaxAnisotropy();return tx}
const roadTex=canvasTex(256,256,(c,w,h)=>{c.fillStyle='#e2caa2';c.fillRect(0,0,w,h);for(let i=0;i<4200;i++){c.fillStyle=rand()>.5?'#efdbb74d':'#b1997630';const r=rr(.5,1.8);c.fillRect(rand()*w,rand()*h,r,r)}});roadTex.wrapS=roadTex.wrapT=T.RepeatWrapping;M.path.map=roadTex;
const path=new T.CatmullRomCurve3([V(23,0,0),V(15,0,17),V(-2,0,20),V(-22,0,11),V(-25,0,-6),V(-13,0,-19),V(8,0,-19),V(24,0,-10)],true,'catmullrom',.48);path.arcLengthDivisions=1800;const routeLength=path.getLength();
function sample(u,offset=0,y=0){u=((u%1)+1)%1;let p=path.getPointAt(u),d=path.getTangentAt(u),n=V(d.z,0,-d.x);return {p:p.addScaledVector(n,offset).setY(y),d,n}}
function strip(a,b,y,mat,segments=480,parent=world){const pos=[],uv=[],idx=[];for(let i=0;i<=segments;i++){for(const offset of [a,b]){const p=sample(i/segments,offset,y).p;pos.push(p.x,p.y,p.z);uv.push(i/segments*routeLength*.3,offset*.35)}}for(let i=0;i<segments;i++){let k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3)}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return mesh(g,mat,null,null,parent,false)}
// The landscape and all textures are built here, without external assets.
let base=mesh(new T.CylinderGeometry(1,1,.95,128),M.earth,V(0,-.72,0),V(54,1,43));
mesh(new T.CylinderGeometry(1,1,.2,128),M.edge,V(0,-.3,0),V(54.1,1,43.1));
function outline(offset){const pts=[];for(let i=0;i<360;i++){const p=sample(i/360,offset).p;pts.push(new T.Vector2(p.x,-p.z))}return pts}
const innerLand=new T.Shape(outline(1.81));
mesh(new T.ShapeGeometry(innerLand),M.grass,V(0,-.017,0)).rotation.x=-PI/2;
const outerLand=new T.Shape();outerLand.absellipse(0,0,54,43,0,TAU,false,0);outerLand.holes.push(new T.Path(outline(13.98)));
mesh(new T.ShapeGeometry(outerLand,128),M.grass,V(0,-.018,0)).rotation.x=-PI/2;
strip(-1.98,2.22,-.015,M.edge);strip(-1.7,1.7,.012,M.path);strip(1.8,3.4,-.035,M.sand);strip(12.4,14,-.055,M.sand);
const waterUniforms={time:{value:0},day:{value:1}};
const waterMat=new T.ShaderMaterial({uniforms:waterUniforms,side:T.DoubleSide,vertexShader:`varying vec3 w;uniform float time;void main(){vec3 p=position;p.y+=sin(p.x*.6+time*.8)*cos(p.z*.7-time*.6)*.025;w=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying vec3 w;uniform float time;uniform float day;void main(){vec2 p=w.xz;float broad=sin(p.x*.32+p.y*.21+time*.22)*.5+.5;float wave=sin(p.x*2.5+p.y*.9-time*1.1)+.42*sin(p.y*4.+time*.7);float streak=smoothstep(1.23,1.40,wave);float sparkle=pow(max(0.,sin(p.x*5.2-time)*sin(p.y*5.7+time*.55)),28.);vec3 c=mix(vec3(.19,.49,.46),vec3(.35,.65,.59),broad*.65);c+=streak*.09+sparkle*.13;c=mix(c*vec3(.58,.7,.88),c,day);gl_FragColor=vec4(c,1.);}`});
strip(3.2,12.65,-.12,waterMat,600);
const foam=material('#dfecce',{transparent:true,opacity:.42,depthWrite:false});strip(3.2,3.31,-.072,foam);strip(12.45,12.6,-.07,foam);
// Ground grain, roadside pebbles, and tiny flowers.
for(let i=0;i<280;i++){const u=rand(),off=rand()>.5?rr(1.95,2.6):rr(-2.8,-1.92);let p=sample(u,off,.04).p;let o=ball(p,V(rr(.04,.13),rr(.018,.06),rr(.03,.08)),rand()>.6?M.ivory:M.stone,world,true);o.rotation.y=rand()*TAU;o.castShadow=false;}
function tuft(p,scale=1){for(let j=0;j<3;j++){const a=j*TAU/3+rand();let g=new T.ConeGeometry(.065*scale,rr(.24,.5)*scale,3);let o=mesh(g,rand()>.45?M.leaf:M.grass2,p.clone().add(V(Math.cos(a)*.1,.16*scale,Math.sin(a)*.1)),null);o.rotation.z=Math.cos(a)*.3;o.castShadow=false;}}
for(let i=0;i<300;i++){const off=rand()>.38?rr(-8,-2.1):rr(13.8,19);const p=sample(rand(),off,0).p;tuft(p,rr(.7,1.7));}
const flowerM=[material('#edce83'),material('#f4e9cb'),material('#d58b72')];
for(let i=0;i<130;i++){const p=sample(rand(),rr(-4,-2),.12).p;let h=rr(.15,.34);rod(p,p.clone().add(V(0,h,0)),.014,M.leaf);ball(p.clone().add(V(0,h,0)),V(.075,.055,.075),flowerM[i%3],world,true)}
function tree(p,size,type=0){const g=new T.Group();g.position.copy(p);g.scale.setScalar(size);world.add(g);rod(V(),V(.12,2.65,0),.22,M.wood,g,.1);rod(V(.05,1.5,0),V(-.8,3,.2),.12,M.wood,g,.055);rod(V(.1,1.8,0),V(.75,3.15,-.25),.12,M.wood,g,.05);if(type===1){for(let j=0;j<3;j++){mesh(new T.ConeGeometry(1.35-j*.22,2.1,9),[M.leaf,M.leaf2,M.leaf3][j],V(0,2.3+j*.8,0),null,g)}}else{for(let j=0;j<6;j++){const a=j*2.4;ball(V(Math.cos(a)*.76,2.8+rand()*.75,Math.sin(a)*.72),V(rr(1,1.35),rr(1,1.5),rr(1,1.3)),[M.leaf,M.leaf2,M.leaf3][j%3],g,true);}ball(V(.1,3.65,0),V(1.1,1.28,1.04),M.leaf2,g,true)}}
for(let i=0;i<39;i++){let u=(i/39+.025*rand())%1;let off=rr(16,23);const p=sample(u,off,-.05).p;if((p.x/52)**2+(p.z/41)**2<.91)tree(p,rr(.7,1.45),i%5===0?1:0)}
for(const a of [[-8,-5,1.3],[6,-5,1.1],[-8,6,1.1],[5,6,.9],[13,4,.75],[-13,-8,.75],[-12,4,.65]])tree(V(a[0],0,a[1]),a[2]);
// Reeds, smooth stones, and lilies along the river edge.
const reedM=material('#888c48');for(let i=0;i<100;i++){const p=sample(rand(),rand()>.5?rr(3.2,3.65):rr(12,12.5),-.1).p;for(let j=0;j<3;j++){let q=p.clone().add(V(rr(-.22,.22),0,rr(-.22,.22)));let end=q.clone().add(V(rr(-.12,.12),rr(.6,1.15),rr(-.1,.1)));rod(q,end,.024,reedM);if(j===0)ball(end,V(.065,.17,.065),M.wood)}}
for(let i=0;i<36;i++){let p=sample(rand(),rand()>.5?rr(2.8,3.4):rr(12.5,13.2),-.03).p;ball(p,V(rr(.25,.75),rr(.18,.4),rr(.2,.5)),M.stone,world,true)}
const lilyM=material('#6e9c65',{side:T.DoubleSide});for(let i=0;i<25;i++){let p=sample(rr(.3,.75),rr(3.7,5),-.065).p;let leaf=mesh(new T.CircleGeometry(rr(.15,.36),22,.2,TAU-.4),lilyM,p,null,world,false);leaf.rotation.x=-PI/2;leaf.rotation.z=rand()*TAU;if(i%6===0)ball(p.clone().add(V(0,.075,0)),V(.10,.1,.10),flowerM[2],world,true)}
function signTexture(text,small,bg='#ede3bf',fg='#3d6454'){return canvasTex(512,256,(c,w,h)=>{c.fillStyle=bg;c.fillRect(0,0,w,h);c.strokeStyle=fg;c.lineWidth=4;c.strokeRect(14,14,w-28,h-28);c.fillStyle=fg;c.textAlign='center';c.font='bold 53px "Microsoft YaHei",sans-serif';c.fillText(text,w/2,118);c.font='20px sans-serif';c.fillText(small,w/2,174)})}
function board(p,size,tx,parent=world){return mesh(new T.BoxGeometry(...size),[M.wood,M.wood,M.wood,M.wood,new T.MeshStandardMaterial({map:tx,roughness:1}),M.wood],p,null,parent)}
// A small riverside post office in the island meadow.
const house=new T.Group();house.position.set(-1,0,-4);house.rotation.y=-.25;world.add(house);
box(V(0,.15,0),V(6.2,.3,4.6),M.stone,house);const plaster=material('#eddbac');box(V(0,1.7,0),V(5.4,3.1,3.7),plaster,house);
const roofM=material('#bb6c4f');for(const side of [-1,1]){let roof=box(V(side*1.55,3.55,0),V(3.55,.24,4.55),roofM,house);roof.rotation.z=-side*.42;for(let j=-5;j<=5;j++){let r=box(V(side*1.55,3.69,j*.39),V(3.56,.05,.07),M.red,house);r.rotation.z=-side*.42;}}
box(V(0,1.07,1.9),V(1.08,2.02,.15),M.teal,house);box(V(0,1.51,2),V(.69,.62,.06),material('#adc2ab'),house);ball(V(.33,.98,2.04),V(.06,.06,.06),M.gold,house);
const windowMat=material('#779c91',{metalness:.15,roughness:.28});for(const x of [-1.78,1.78]){box(V(x,1.78,1.88),V(1.13,1.19,.08),M.ivory,house);box(V(x,1.78,1.94),V(.93,.97,.06),windowMat,house);box(V(x,1.78,1.99),V(.045,.97,.05),M.ivory,house);box(V(x,1.78,1.99),V(.95,.045,.05),M.ivory,house);box(V(x,1.1,2.04),V(1.25,.25,.35),M.wood,house);for(let j=0;j<6;j++)ball(V(x+rr(-.48,.48),1.32,rr(1.95,2.15)),V(.16,.2,.14),j%2?M.leaf2:flowerM[2],house,true)}
board(V(0,2.83,2.02),[2.7,.64,.14],signTexture('河 畔 邮 局','R I V E R   P O S T'),house);
box(V(1.8,4.15,-.7),V(.55,1.55,.58),M.stone,house);box(V(1.8,4.96,-.7),V(.72,.14,.76),M.edge,house);
for(let i=0;i<8;i++){let stone=box(V(rr(-.12,.12),.055,2.5+i*.62),V(1.25,.1,.43),M.stone,house);stone.rotation.y=rr(-.1,.1)}
// Letter box and notice marker beside the path.
const marker=new T.Group();const mp=sample(.88,-2.8).p;marker.position.copy(mp);marker.rotation.y=-.4;world.add(marker);rod(V(),V(0,1.65,0),.09,M.wood,marker);box(V(0,1.57,0),V(.68,.72,.52),M.teal,marker);box(V(0,1.63,.267),V(.43,.07,.02),M.dark,marker);board(V(0,1.35,.27),[.36,.16,.015],signTexture('POST',''),marker);box(V(.4,1.76,0),V(.2,.25,.035),M.red,marker);
const sg=new T.Group();sg.position.copy(sample(.025,-2.75).p);sg.rotation.y=.8;world.add(sg);rod(V(),V(0,2.1,0),.07,M.wood,sg);board(V(0,1.8,0),[1.45,.55,.13],signTexture('河湾环线','RIVER LOOP   →'),sg);
function bench(u,off){const g=new T.Group(),s=sample(u,off);g.position.copy(s.p);g.rotation.y=-Math.atan2(s.d.z,s.d.x);world.add(g);for(let j=0;j<4;j++)box(V(0,.65,-.27+j*.18),V(2.2,.1,.13),M.woodLight,g);for(const x of [-.82,.82]){rod(V(x,0,-.26),V(x,.66,-.26),.045,M.dark,g);rod(V(x,0,.3),V(x,1.3,.3),.045,M.dark,g)}for(let j=0;j<3;j++)box(V(0,.88+j*.18,.34),V(2.2,.12,.07),M.woodLight,g)}bench(.16,-3.6);bench(.65,-3.3);
// Small timber landing, moored rowboat, and low fences.
const dock=new T.Group(),dp=sample(.42,2.5);dock.position.copy(dp.p);dock.rotation.y=Math.atan2(dp.n.x,dp.n.z);world.add(dock);for(let j=0;j<12;j++)box(V(0,.12,j*.34),V(2.3,.12,.29),M.woodLight,dock);for(const x of [-1.02,1.02])for(const z of [.2,3.5])rod(V(x,-.9,z),V(x,.75,z),.065,M.wood,dock);
for(let k=0;k<3;k++){const start=[.18,.53,.75][k];for(let j=0;j<9;j++){const s=sample(start+j*.008,2.3);rod(s.p,s.p.clone().add(V(0,.85,0)),.055,M.wood);if(j<8){const e=sample(start+(j+1)*.008,2.3);rod(s.p.clone().add(V(0,.69,0)),e.p.clone().add(V(0,.69,0)),.04,M.woodLight)}}}
const boat=new T.Group();boat.position.copy(sample(.427,7,-.02).p);boat.rotation.y=.6;scene.add(boat);const hullShape=new T.Shape();hullShape.moveTo(-.62,-1.05);hullShape.quadraticCurveTo(-.9,.1,0,1.6);hullShape.quadraticCurveTo(.9,.1,.62,-1.05);hullShape.closePath();let hull=mesh(new T.ExtrudeGeometry(hullShape,{depth:.28,bevelEnabled:true,bevelThickness:.12,bevelSize:.12,bevelSegments:3,steps:1}),M.teal,null,null,boat);hull.rotation.x=PI/2;box(V(0,.11,0),V(1,.13,.25),M.woodLight,boat);box(V(0,.11,-.75),V(1,.13,.25),M.woodLight,boat);rod(V(-.9,.24,-.7),V(.8,.24,.8),.035,M.woodLight,boat);
// Wooden footbridge across the far arm of the river.
const bridge=new T.Group();const bs=sample(.61,8);bridge.position.copy(bs.p);bridge.rotation.y=Math.atan2(bs.n.x,bs.n.z);world.add(bridge);for(let j=0;j<32;j++){let z=-5.1+j*.33,y=.15+.75*Math.sin(j/31*PI);box(V(0,y,z),V(2.6,.12,.3),M.woodLight,bridge);if(j%4===0||j===31)for(const x of [-1.25,1.25])rod(V(x,y,z),V(x,y+1,z),.055,M.wood,bridge)}for(const x of [-1.25,1.25]){const pts=[];for(let j=0;j<=16;j++)pts.push(V(x,1.15+.75*Math.sin(j/16*PI),-5.1+j/16*10.23));curveTube(pts,.052,M.wood,bridge)}
// Pastel cottages on the distant bank, under a soft skyline.
for(let k=0;k<4;k++){const g=new T.Group();g.position.copy(sample(.32+k*.075,19).p);g.rotation.y=rr(-1,1);world.add(g);box(V(0,1.1,0),V(3.2,2.2,2.7),[plaster,material('#d6c2a3'),material('#bdc6a3'),plaster][k],g);for(const s of [-1,1]){let r=box(V(s*.85,2.57,0),V(2,.18,3.1),k%2?M.teal:roofM,g);r.rotation.z=-s*.45}box(V(0,.8,1.38),V(.65,1.5,.1),M.wood,g);for(const x of [-1,1])box(V(x,1.25,1.38),V(.6,.7,.1),M.ivory,g)}
// A pale floor keeps the complete miniature visually grounded in the wide view.
const floor=mesh(new T.PlaneGeometry(1000,1000),material('#dce5cc'),V(0,-1.25,0),null,scene,false);floor.rotation.x=-PI/2;

function roundedBox(w,h,d,r,mat,pos,parent){const g=new T.BoxGeometry(w,h,d,6,6,6),pa=g.attributes.position,na=g.attributes.normal;for(let i=0;i<pa.count;i++){let p=V().fromBufferAttribute(pa,i),q=V(Math.max(-w/2+r,Math.min(w/2-r,p.x)),Math.max(-h/2+r,Math.min(h/2-r,p.y)),Math.max(-d/2+r,Math.min(d/2-r,p.z))),n=p.clone().sub(q).normalize();p.copy(q).addScaledVector(n,r);pa.setXYZ(i,p.x,p.y,p.z);na.setXYZ(i,n.x,n.y,n.z)}return mesh(g,mat,pos,null,parent)}
const rig=new T.Group();scene.add(rig);const bike=new T.Group();rig.add(bike);
const rearX=-1.35,frontX=1.35,wheelY=.81,wheelR=.78;
const wheels=[];
for(const x of [rearX,frontX]){const wheel=new T.Group();wheel.position.set(x,wheelY,0);bike.add(wheel);wheels.push(wheel);
torus(wheelR-.065,.078,M.tire,wheel,V());torus(wheelR-.08,.025,M.rim,wheel,V(0,0,.059));torus(wheelR-.08,.025,M.rim,wheel,V(0,0,-.059));torus(wheelR-.13,.025,M.metal,wheel,V());
rod(V(0,0,-.14),V(0,0,.14),.075,M.metal,wheel);
const positions=[];for(let j=0;j<28;j++){let a=j/28*TAU,b=a+(j%2?.20:-.20);positions.push(Math.cos(a)*.09,Math.sin(a)*.09,(j%2?.035:-.035),Math.cos(b)*.63,Math.sin(b)*.63,0)}let geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(positions,3));wheel.add(new T.LineSegments(geom,new T.LineBasicMaterial({color:'#cbd5c4',transparent:true,opacity:.75})));
box(V(.43,.34,.031),V(.16,.06,.05),M.gold,wheel).rotation.z=.65;
// Curved enamel fenders, with fine brass stays.
let pts=[];for(let j=0;j<=32;j++){let a=.11+(PI-.22)*j/32;pts.push(V(x+Math.cos(a)*.88,wheelY+Math.sin(a)*.88,0))}curveTube(pts,.048,M.bike,bike,32);for(const z of [-.12,.12])rod(V(x,wheelY,z),V(x-.6,wheelY+.62,z),.015,M.metal,bike);
}
const bb=V(-.22,.96,0),seat=V(-.63,1.87,0),steer=V(.99,1.93,0),ra=V(rearX,wheelY,0);
for(const pair of [[bb,seat],[seat,steer],[bb,steer]])rod(...pair,.057,M.bike,bike);
for(const z of [-.14,.14]){rod(ra.clone().setZ(z),bb.clone().setZ(z),.038,M.bike,bike);rod(ra.clone().setZ(z),seat.clone().setZ(z*.25),.035,M.bike,bike);rod(V(frontX,wheelY,z),steer.clone().setZ(z),.047,M.bike,bike)}
rod(seat,V(-.68,2.07,0),.038,M.metal,bike);roundedBox(.62,.16,.43,.09,M.saddle,V(-.69,2.07,0),bike);
rod(steer,V(.93,2.21,0),.035,M.metal,bike);curveTube([V(.93,2.22,-.49),V(1.12,2.24,-.31),V(1.13,2.25,0),V(1.12,2.24,.31),V(.93,2.22,.49)],.036,M.metal,bike,24);
for(const z of [-.49,.49])rod(V(.91,2.22,z),V(1.12,2.24,z*.87),.063,M.saddle,bike);
// Brake cables, tiny lamp, bell, and a head badge.
curveTube([V(1.05,2.22,.32),V(1.43,2.1,.25),V(1.42,1.63,.15),V(1.32,1.62,0)],.011,M.dark,bike,22);
rod(V(1.05,1.93,0),V(1.4,1.97,0),.025,M.metal,bike);ball(V(1.43,1.97,0),V(.15,.13,.13),M.metal,bike);ball(V(1.54,1.97,0),V(.032,.105,.105),M.ivory,bike);
ball(V(1.1,2.3,.25),V(.105,.072,.105),M.gold,bike);
roundedBox(.035,.19,.085,.025,M.gold,V(1.055,1.85,0),bike);
// Drivetrain: the wheel and crank phase share actual travelled distance.
const crank=new T.Group();crank.position.copy(bb);bike.add(crank);torus(.20,.024,M.metal,crank,V(0,0,.17));rod(V(0,0,-.24),V(0,0,.24),.045,M.metal,crank);
for(const side of [-1,1])rod(V(0,0,side*.22),V(side*.34,0,side*.22),.032,M.metal,crank);
const chainPts=[V(-.22,1.17,.19),V(-1.35,.93,.19),V(-1.46,.81,.19),V(-1.35,.68,.19),V(-.22,.75,.19),V(-.02,.96,.19),V(-.22,1.17,.19)];curveTube(chainPts,.018,M.dark,bike,50);
// Luggage rack and three parcels with paper bands, twine, and a printed stamp.
for(const z of [-.29,.29]){rod(V(-1.47,.82,z*.55),V(-1.64,1.83,z),.025,M.metal,bike);rod(V(-.7,1.86,z),V(-1.92,1.86,z),.033,M.metal,bike)}for(let i=0;i<6;i++)rod(V(-.79-i*.2,1.87,-.31),V(-.79-i*.2,1.87,.31),.025,M.metal,bike);
const cargo=new T.Group();cargo.position.set(-1.46,1.9,0);bike.add(cargo);
const stampTex=canvasTex(256,192,(c,w,h)=>{c.fillStyle='#f0dfb7';c.fillRect(0,0,w,h);c.strokeStyle='#a56846';c.lineWidth=3;c.strokeRect(10,10,w-20,h-20);c.fillStyle='#9f6345';c.font='bold 25px serif';c.textAlign='center';c.fillText('RIVER POST',w/2,45);c.beginPath();c.ellipse(128,94,35,23,0,0,TAU);c.stroke();c.font='17px sans-serif';c.fillText('WITH LOVE',w/2,151);c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(185+i*7,72);c.lineTo(185+i*7,123);c.stroke()}});
function parcel(p,w,h,d,mat){const g=new T.Group();g.position.copy(p);cargo.add(g);roundedBox(w,h,d,.045,mat,V(),g);box(V(0,h/2+.003,0),V(w*.99,.012,.105),M.tape,g);box(V(0,0,d/2+.007),V(.065,h,.012),M.string,g);box(V(0,h/2+.01,0),V(.065,.015,d),M.string,g);box(V(w/2+.004,0,0),V(.008,h,.1),M.tape,g);const label=mesh(new T.PlaneGeometry(w*.52,h*.51),new T.MeshStandardMaterial({map:stampTex,roughness:1}),V(-w*.16,0,d/2+.01),null,g);return g}
parcel(V(0,.32,0),.93,.62,.73,M.parcel);let pg=parcel(V(-.045,.83,-.05),.73,.38,.61,M.tape);pg.rotation.y=-.085;let env=parcel(V(.13,1.08,-.02),.55,.08,.39,M.ivory);env.rotation.y=.16;
curveTube([V(-.1,1.04,0),V(-.31,1.14,.03),V(-.16,1.19,.06),V(0,1.04,0),V(.18,1.2,.05),V(.3,1.13,.03),V(0,1.04,0)],.013,M.string,cargo,35);

const otter=new T.Group();rig.add(otter);
const torso=new T.Group();otter.add(torso);
const body=ball(V(-.38,2.57,0),V(.48,.74,.43),M.fur,torso);body.rotation.z=-.22;
ball(V(-.55,2.18,0),V(.5,.39,.42),M.fur,torso);
const belly=ball(V(-.025,2.59,0),V(.16,.51,.32),M.furLight,torso);belly.rotation.z=-.23;
// Subtle fur tufts at cheeks and flanks preserve a clean silhouette.
for(const z of [-1,1]){ball(V(-.57,2.38,z*.34),V(.22,.31,.13),M.fur,torso);}
const head=new T.Group();head.position.set(.06,3.24,0);torso.add(head);
ball(V(),V(.57,.54,.49),M.fur,head);
ball(V(.35,-.17,0),V(.4,.31,.41),M.furLight,head);
for(const s of [-1,1]){let ear=ball(V(-.19,.35,s*.40),V(.185,.19,.125),M.fur,head);ear.rotation.x=s*.25;ball(V(-.14,.37,s*.477),V(.095,.106,.028),M.brown,head);
ball(V(.49,-.14,s*.165),V(.25,.195,.225),M.muzzle,head);
ball(V(.05,-.20,s*.42),V(.22,.17,.11),M.furLight,head);
}
ball(V(.715,-.105,0),V(.113,.085,.14),M.nose,head);ball(V(.761,-.073,.035),V(.025,.015,.033),M.furLight,head);
curveTube([V(.707,-.19,0),V(.68,-.245,0),V(.58,-.267,.07)],.013,M.brown,head,14);curveTube([V(.68,-.245,0),V(.58,-.267,-.07)],.013,M.brown,head,10);
const eyes=[];for(const s of [-1,1]){const g=new T.Group();g.position.set(.365,.115,s*.374);head.add(g);g.rotation.y=s*.35;ball(V(),V(.087,.108,.061),M.eye,g);ball(V(.019,.031,s*.046),V(.022,.027,.018),M.white,g);ball(V(-.018,-.04,s*.045),V(.009,.011,.009),M.muzzle,g);eyes.push(g);curveTube([V(.26,.27,s*.407),V(.34,.283,s*.41),V(.43,.25,s*.378)],.023,M.brown,head,12);
for(let j=0;j<3;j++){curveTube([V(.51,-.16+j*.045,s*.30),V(.49,-.15+j*.065,s*.57),V(.36-j*.045,-.18+j*.093,s*(.83+j*.06))],.0075,M.muzzle,head,12)}
for(let j=0;j<3;j++)ball(V(.632-j*.063,-.135+(j%2)*.052,s*.302),V(.012,.014,.012),M.brown,head);
}
// A knitted neck wrap and two individually animated fabric tails.
let neck=torus(.32,.112,M.scarf,torso,V(-.01,2.98,0),[PI/2,0,-.15]);neck.scale.set(1.14,1,1);
ball(V(-.32,2.98,.3),V(.15,.14,.15),M.scarf,torso);
const scarfMeshes=[];for(let k=0;k<2;k++){const n=44,w=6,pos=new Float32Array((n+1)*(w+1)*3),uv=new Float32Array((n+1)*(w+1)*2),ix=[];for(let i=0;i<=n;i++)for(let j=0;j<=w;j++){let id=i*(w+1)+j;uv[id*2]=i/n;uv[id*2+1]=j/w;if(i<n&&j<w){ix.push(id,id+w+1,id+1,id+1,id+w+1,id+w+2)}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('uv',new T.BufferAttribute(uv,2));geo.setIndex(ix);const mat=M.scarf.clone();mat.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat edgeLine=step(.87,vUv.y)+step(vUv.y,.13);float endLine=step(.82,vUv.x)*step(vUv.x,.85)+step(.91,vUv.x)*step(vUv.x,.94);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.94,.68,.38),min(1.,edgeLine*.6+endLine*.85));`);};mat.defines={USE_UV:''};const cloth=mesh(geo,mat,null,null,torso);cloth.frustumCulled=false;scarfMeshes.push({geo,n,w,k});}
// Tail uses a tapered surface; it hangs clear of the wheel and the parcels.
const tailN=25,tailSides=12,tailPos=new Float32Array((tailN+1)*(tailSides+1)*3),tailIdx=[];
for(let i=0;i<tailN;i++)for(let j=0;j<tailSides;j++){let a=i*(tailSides+1)+j;tailIdx.push(a,a+1,a+tailSides+1,a+1,a+tailSides+2,a+tailSides+1)}const tailGeo=new T.BufferGeometry();tailGeo.setAttribute('position',new T.BufferAttribute(tailPos,3));tailGeo.setIndex(tailIdx);const tail=mesh(tailGeo,M.fur,null,null,otter);tail.frustumCulled=false;
// Articulated limbs: hips and feet define a two-link knee solution.
const legs=[];for(const s of [-1,1]){let thigh=ball(V(),V(.19,.5,.20),M.fur,otter),shin=ball(V(),V(.12,.5,.13),M.fur,otter),knee=ball(V(),V(.175,.18,.18),M.fur,otter),foot=ball(V(),V(.25,.11,.145),M.brown,otter),pedal=box(V(),V(.33,.075,.25),M.dark,bike);legs.push({s,thigh,shin,knee,foot,pedal});for(let j=0;j<3;j++){const claw=ball(V(.14,.01,(j-1)*.048),V(.04,.025,.015),M.furLight,foot);claw.scale.set(.16,.22,.1);}}
const arms=[];for(const s of [-1,1]){const a=ball(V(),V(.16,.5,.16),M.fur,otter),b=ball(V(),V(.115,.5,.12),M.fur,otter),elbow=ball(V(),V(.14,.145,.14),M.fur,otter),hand=ball(V(.98,2.25,s*.46),V(.145,.13,.13),M.brown,otter);arms.push({s,a,b,elbow,hand});for(let j=0;j<3;j++)curveTube([V(.97+j*.052,2.3,s*.5),V(.96+j*.052,2.24,s*.55),V(.97+j*.052,2.2,s*.49)],.019,M.furLight,otter,8)}
function alignLimb(o,a,b,r1,r2){o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());o.scale.set(r1,a.distanceTo(b)*.58,r2)}
function kneeIK(hip,foot,l1,l2){let d=foot.clone().sub(hip),len=Math.min(d.length(),l1+l2-.001);d.normalize();let a=(l1*l1-l2*l2+len*len)/(2*len),h=Math.sqrt(Math.max(0,l1*l1-a*a));let bend=V(1,0,0).addScaledVector(d,-d.x).normalize();return hip.clone().addScaledVector(d,a).addScaledVector(bend,h)}

// A pair of ducks, drifting pollen, and swallows complete the quiet afternoon.
const ducks=[];for(let i=0;i<3;i++){const g=new T.Group();scene.add(g);ball(V(0,.12,0),V(.34,.2,.22),i===0?M.parcel:M.ivory,g);ball(V(.24,.33,0),V(.155,.155,.14),i===0?M.teal:M.ivory,g);ball(V(.39,.30,0),V(.12,.045,.063),M.gold,g);for(const s of [-1,1])ball(V(.302,.38,s*.106),V(.02,.024,.018),M.eye,g);ball(V(-.3,.17,0),V(.17,.10,.15),M.ivory,g);const rip=torus(.5,.012,foam,g,V(0,-.025,0),[PI/2,0,0]);rip.scale.y=.7;ducks.push({g,u:.055+i*.007,offset:6+i*.5,rip})}
const pollenCount=70,pollenArray=new Float32Array(pollenCount*3);for(let i=0;i<pollenCount;i++){pollenArray[i*3]=rr(-8,8);pollenArray[i*3+1]=rr(.5,6);pollenArray[i*3+2]=rr(-8,8)}const pollenGeo=new T.BufferGeometry();pollenGeo.setAttribute('position',new T.BufferAttribute(pollenArray,3));const particleTex=canvasTex(32,32,(c)=>{const g=c.createRadialGradient(16,16,0,16,16,16);g.addColorStop(0,'#fffbd9');g.addColorStop(.3,'#fffbd9bb');g.addColorStop(1,'#fffbd900');c.fillStyle=g;c.fillRect(0,0,32,32)});const pollen=new T.Points(pollenGeo,new T.PointsMaterial({color:'#fff4cf',size:.055,map:particleTex,transparent:true,opacity:.7,depthWrite:false}));scene.add(pollen);
const birds=[];for(let i=0;i<5;i++){const g=new T.Group();scene.add(g);const left=mesh(new T.ConeGeometry(.11,.9,3),M.dark,V(0,0,.34),V(1,.8,1),g,false);left.rotation.x=PI/2;const right=left.clone();right.position.z=-.34;g.add(right);birds.push({g,left,right,phase:rand()*TAU})}

// Batch the static scenery by material to keep the scene smooth on ordinary laptops.
function batchStatic(root){root.updateMatrixWorld(true);const bins=new Map(),remove=[];root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||o.material===waterMat)return;const key=o.material.uuid+'/'+o.castShadow+'/'+o.receiveShadow;if(!bins.has(key))bins.set(key,{m:o.material,cast:o.castShadow,receive:o.receiveShadow,list:[]});const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);bins.get(key).list.push(g);remove.push(o)});for(const o of remove)o.removeFromParent();for(const bin of bins.values()){let count=0;for(const g of bin.list)count+=g.attributes.position.count;let p=new Float32Array(count*3),n=new Float32Array(count*3),uv=new Float32Array(count*2),at=0;for(const g of bin.list){p.set(g.attributes.position.array,at*3);if(g.attributes.normal)n.set(g.attributes.normal.array,at*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,at*2);at+=g.attributes.position.count;g.dispose()}let g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('normal',new T.BufferAttribute(n,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));let o=new T.Mesh(g,bin.m);o.castShadow=bin.cast;o.receiveShadow=bin.receive;scene.add(o)}}batchStatic(world);

let running=true,speed=1,view='follow',dayTarget=1,day=1,sim=0,travel=0,progress=.035,bellUntil=-1;
let orbitYaw=0,orbitPitch=.0,zoom=1,drag=null,pinches=new Map(),lastPinch=0,toastTimer;
const target=V(),smoothTarget=V(),desired=V(),camOffset=V();let cameraInitialized=false;
const btnPlay=document.getElementById('play'),toastEl=document.getElementById('toast');
function toast(text){toastEl.textContent=text;toastEl.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove('show'),2300)}
function setRunning(v){running=v;btnPlay.setAttribute('aria-label',v?'暂停':'继续播放');btnPlay.innerHTML=v?'<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12" stroke-width="3"/></svg>':'<svg viewBox="0 0 24 24"><path d="m9 5 11 7-11 7z" fill="currentColor" stroke="none"/></svg>';}
btnPlay.onclick=()=>setRunning(!running);
document.getElementById('speed').oninput=e=>{speed=Number(e.target.value);document.getElementById('speedLabel').textContent=speed.toFixed(1)+'×'};
function setView(v){view=v;orbitYaw=0;orbitPitch=0;zoom=1;document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===v);b.setAttribute('aria-pressed',String(b.dataset.view===v))});const range=v==='wide'?65:18;Object.assign(sun.shadow.camera,{left:-range,right:range,top:range,bottom:-range});sun.shadow.camera.updateProjectionMatrix();scene.fog.near=v==='wide'?150:55;scene.fog.far=v==='wide'?550:160;camera.far=v==='wide'?800:270;camera.updateProjectionMatrix()}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
document.getElementById('light').onclick=()=>{dayTarget=dayTarget?0:1;document.body.classList.toggle('dusk',!dayTarget);document.getElementById('light').setAttribute('aria-label',dayTarget?'切换暮色':'切换午后');document.getElementById('weather').innerHTML=dayTarget?'晴 · 河风轻轻<span>GOLDEN AFTERNOON</span>':'晚 · 灯火将至<span>BLUE HOUR</span>';toast(dayTarget?'午后的风，刚刚好。':'天色晚了，心意仍在路上。')};
let isQuiet=false;document.getElementById('quiet').onclick=()=>{isQuiet=!isQuiet;document.body.classList.toggle('quiet',isQuiet);document.getElementById('quiet').setAttribute('aria-pressed',String(isQuiet));if(isQuiet)toast('按 H 恢复界面')};
// Entirely synthesized optional ambience; audio starts only on a user's gesture.
let audioCtx,master,ambientGain,soundOn=false,nextChirp=0;
function initAudio(){if(audioCtx){audioCtx.resume();return}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioCtx=new AC();master=audioCtx.createGain();master.gain.value=.28;master.connect(audioCtx.destination);ambientGain=audioCtx.createGain();ambientGain.gain.value=0;ambientGain.connect(master);const length=audioCtx.sampleRate*4,buf=audioCtx.createBuffer(1,length,audioCtx.sampleRate),data=buf.getChannelData(0);let s=0;for(let i=0;i<length;i++){s=(s+(Math.random()*2-1)*.05)/1.02;data[i]=s*3}const source=audioCtx.createBufferSource();source.buffer=buf;source.loop=true;const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=900;source.connect(filter);filter.connect(ambientGain);source.start();}
function tone(freq,start,duration,volume,type='sine',dest=master){if(!audioCtx)return;let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,start);g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(volume,start+.008);g.gain.exponentialRampToValueAtTime(.0001,start+duration);o.connect(g);g.connect(dest);o.start(start);o.stop(start+duration+.02);return o}
function ringBell(){initAudio();if(audioCtx){let t=audioCtx.currentTime;for(let d of [0,.16]){tone(1760,t+d,.9,.6);tone(2637,t+d,.55,.15);tone(3520,t+d,.32,.08)}}bellUntil=sim+1.1;toast('叮铃——心意借过。')}
document.getElementById('bell').onclick=ringBell;
document.getElementById('sound').onclick=()=>{initAudio();if(!audioCtx){toast('这个浏览器暂不支持环境音');return}soundOn=!soundOn;ambientGain.gain.setTargetAtTime(soundOn?.16:0,audioCtx.currentTime,.3);const el=document.getElementById('sound');el.classList.toggle('active',soundOn);el.setAttribute('aria-pressed',String(soundOn));el.setAttribute('aria-label',soundOn?'关闭自然环境音':'开启自然环境音');el.innerHTML=soundOn?'<svg viewBox="0 0 24 24"><path d="m11 5-6 4H2v6h3l6 4zM16 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/></svg>':'<svg viewBox="0 0 24 24"><path d="m11 5-6 4H2v6h3l6 4zM16 9l5 6m0-6-5 6"/></svg>';toast(soundOn?'听听河水和远处的鸟鸣。':'环境音已关闭')};
function keyHandler(e){if(e.target.matches('input,button')&&[' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;if(e.code==='Space'){e.preventDefault();setRunning(!running)}else if(e.key.toLowerCase()==='b')ringBell();else if(e.key.toLowerCase()==='r')setView('follow');else if(e.key.toLowerCase()==='h')document.getElementById('quiet').click();else if(['1','2','3'].includes(e.key))setView(['follow','side','wide'][+e.key-1]);}
window.addEventListener('keydown',keyHandler);
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pinches.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={x:e.clientX,y:e.clientY};canvas.classList.add('dragging');if(pinches.size===2){const a=[...pinches.values()];lastPinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}});
canvas.addEventListener('pointermove',e=>{if(!pinches.has(e.pointerId))return;pinches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinches.size===2){const a=[...pinches.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);zoom=T.MathUtils.clamp(zoom*lastPinch/Math.max(d,10),.65,2.3);lastPinch=d}else if(drag){orbitYaw-=(e.clientX-drag.x)*.006;orbitPitch=T.MathUtils.clamp(orbitPitch+(e.clientY-drag.y)*.004,-.22,.8)}drag={x:e.clientX,y:e.clientY}});
function endPointer(e){pinches.delete(e.pointerId);drag=pinches.size?[...pinches.values()][0]:null;if(!pinches.size)canvas.classList.remove('dragging')}
canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=T.MathUtils.clamp(zoom*Math.exp(e.deltaY*.001),.65,2.3)},{passive:false});
canvas.addEventListener('dblclick',()=>setView('follow'));
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();setRunning(false);toast('图形上下文暂时中断，请刷新页面恢复。')});
document.addEventListener('visibilitychange',()=>{if(audioCtx){if(document.hidden)audioCtx.suspend();else audioCtx.resume()}last=performance.now()});
function animateRider(time,phase,motion){
let bob=Math.sin(phase*2)*.025*motion;torso.position.y=bob;torso.rotation.x=Math.sin(phase)*.018*motion;
head.rotation.y=Math.sin(time*.7)*.07+Math.max(0,Math.sin(time*.22))*.05;head.rotation.z=Math.sin(phase*2+.4)*.023*motion;
const blinkPhase=time%5.7,blink=(blinkPhase>5.3&&blinkPhase<5.48)?Math.max(.07,Math.abs((blinkPhase-5.39)/.09)):1;eyes.forEach(e=>e.scale.y=blink);
for(const leg of legs){let a=phase+(leg.s<0?PI:0),foot=V(bb.x+Math.cos(a)*.34,bb.y+Math.sin(a)*.34+.1,leg.s*.31),hip=V(-.53,2.17+bob,leg.s*.28),knee=kneeIK(hip,foot,.75,.84);alignLimb(leg.thigh,hip,knee,.19,.19);alignLimb(leg.shin,knee,foot,.117,.125);leg.knee.position.copy(knee);leg.foot.position.copy(foot);leg.foot.rotation.z=.10+Math.cos(a)*.12;leg.pedal.position.copy(foot).add(V(0,-.105,leg.s*.015));}
for(const arm of arms){let shoulder=V(-.025,2.86+bob,arm.s*.33),elbow=V(.44+Math.sin(phase)*.015,2.43+bob*.4,arm.s*.42),hand=V(.99,2.25,arm.s*.47);alignLimb(arm.a,shoulder,elbow,.15,.155);alignLimb(arm.b,elbow,hand,.11,.12);arm.elbow.position.copy(elbow);arm.hand.position.copy(hand);}
for(const s of scarfMeshes){const arr=s.geo.attributes.position.array,len=s.k?1.55:1.92;for(let i=0;i<=s.n;i++){let u=i/s.n,flutter=Math.sin(u*10-time*(4.8+speed*.9)+s.k*.8)*(.02+.14*u)*(.55+speed*.45),lift=Math.sin(u*PI*.8)*.23+.14*u;for(let j=0;j<=s.w;j++){const v=j/s.w-.5,id=(i*(s.w+1)+j)*3;arr[id]=-.28-u*len;arr[id+1]=3.02+lift+flutter+v*.1*Math.sin(u*6-time*3)+s.k*.1;arr[id+2]=.26+s.k*.13+v*(.27-u*.08)+Math.sin(u*7-time*3.1)*.07*u;}}s.geo.attributes.position.needsUpdate=true;s.geo.computeVertexNormals();}
const centers=[];for(let i=0;i<=tailN;i++){let u=i/tailN;centers.push(V(-.68-u*1.8,2.15-1.59*Math.sin(u*PI*.5),.21+.43*Math.sin(u*PI*.65)+Math.sin(time*1.8+u*4)*.075*u))}for(let i=0;i<=tailN;i++){let u=i/tailN,c=centers[i],d=centers[Math.min(i+1,tailN)].clone().sub(centers[Math.max(i-1,0)]).normalize(),n=V(0,0,1).cross(d).normalize(),b=d.clone().cross(n).normalize(),r=.235*Math.pow(1-u,.9)+.013;for(let j=0;j<=tailSides;j++){const a=j/tailSides*TAU,p=c.clone().addScaledVector(n,Math.cos(a)*r).addScaledVector(b,Math.sin(a)*r*.8),id=(i*(tailSides+1)+j)*3;tailPos[id]=p.x;tailPos[id+1]=p.y;tailPos[id+2]=p.z;}}tailGeo.attributes.position.needsUpdate=true;tailGeo.computeVertexNormals();
cargo.position.y=1.9+Math.sin(phase*2-.3)*.011*motion;cargo.rotation.x=Math.sin(phase)*.014*motion;crank.rotation.z=phase;wheels.forEach(w=>w.rotation.z=-travel/wheelR);
}
const daySky=new T.Color('#dce9dc'),nightSky=new T.Color('#778f96'),sunDay=new T.Color('#ffdfad'),sunNight=new T.Color('#e8b4a2');
let last=performance.now(),frame=0,started=false,dtAverage=1/60;
function loop(now){requestAnimationFrame(loop);let rawDt=(now-last)/1000;last=now;let dt=Math.min(rawDt,.05);if(document.hidden)return;
if(running){sim+=dt;travel+=dt*3.1*speed;progress=(.035+travel/routeLength)%1;}let phase=-travel/wheelR/1.42;
const s=sample(progress),heading=-Math.atan2(s.d.z,s.d.x);rig.position.copy(s.p);rig.rotation.y=heading;const ahead=sample(progress+.004).d;let turn=s.d.x*ahead.z-s.d.z*ahead.x;rig.rotation.x=0;bike.rotation.x=turn*speed*.7;otter.rotation.x=bike.rotation.x;
animateRider(sim,phase,1);waterUniforms.time.value=sim;
boat.position.y=-.02+Math.sin(sim*1.2)*.035;boat.rotation.z=Math.sin(sim*.8)*.025;
for(let i=0;i<ducks.length;i++){const d=ducks[i],p=sample(d.u+sim*.00065,d.offset,-.015);d.g.position.copy(p.p);d.g.position.y+=Math.sin(sim*2+i)*.023;d.g.rotation.y=-Math.atan2(p.d.z,p.d.x);d.rip.scale.set(1+Math.sin(sim*2+i)*.1,.7+Math.sin(sim*2+i)*.06,1)}
pollen.position.copy(rig.position);pollen.rotation.y=sim*.028;for(let i=0;i<pollenCount;i++){pollenArray[i*3+1]=.5+((i*.293+sim*.06)%5.5)}pollenGeo.attributes.position.needsUpdate=true;
for(let i=0;i<birds.length;i++){const b=birds[i],a=sim*.07+b.phase;b.g.position.set(Math.cos(a)*27,8+i*.7+Math.sin(a*3),Math.sin(a)*22);b.g.rotation.y=-a;b.left.rotation.x=PI/2+Math.sin(sim*5+b.phase)*.48;b.right.rotation.x=PI/2-Math.sin(sim*5+b.phase)*.48;}
day+=(dayTarget-day)*(1-Math.exp(-dt*1.8));waterUniforms.day.value=day;scene.background.copy(nightSky).lerp(daySky,day);scene.fog.color.copy(scene.background);sun.color.copy(sunNight).lerp(sunDay,day);sun.intensity=1.05+day*2.35;hemi.intensity=1.15+day*1.35;renderer.toneMappingExposure=.92+day*.18;
// Camera stays attached to the route's tangent; orbit and zoom remain available when paused.
const isPortrait=innerWidth/innerHeight<.85;
if(view==='wide'){target.set(2,-.5,2);const radius=130*Math.max(1,1.4/camera.aspect)*zoom,a=.75+orbitYaw,e=T.MathUtils.clamp(.72+orbitPitch,.20,1.35);desired.set(Math.cos(a)*radius*Math.cos(e),radius*Math.sin(e),Math.sin(a)*radius*Math.cos(e));}
else{target.copy(rig.position).add(V(0,1.85,0)).addScaledVector(s.d,.14);let a=(view==='follow'?1.12:PI/2)+orbitYaw,e=T.MathUtils.clamp((view==='follow'?.31:.19)+orbitPitch,.07,1.25),r=(view==='follow'?12.3:11.5)*zoom*(isPortrait?1.13:1);camOffset.set(Math.cos(a)*r*Math.cos(e),Math.sin(e)*r,Math.sin(a)*r*Math.cos(e));camOffset.applyAxisAngle(V(0,1,0),heading);desired.copy(target).add(camOffset);}
let smooth=1-Math.exp(-dt*5.5);if(!cameraInitialized){camera.position.copy(desired);smoothTarget.copy(target);cameraInitialized=true}else{camera.position.lerp(desired,smooth);smoothTarget.lerp(target,smooth)}camera.lookAt(smoothTarget);
if(view==='wide'){sun.position.set(-24,45,30);sun.target.position.set(0,0,0)}else{sun.position.copy(rig.position).add(V(-12,22,15));sun.target.position.copy(rig.position)}sun.target.updateMatrixWorld();
if(soundOn&&running&&audioCtx&&sim>nextChirp){nextChirp=sim+rr(4,9);let t=audioCtx.currentTime;for(let j=0;j<3;j++){let o=tone(2300+j*240,t+j*.15,.11,.038,'sine',ambientGain);if(o)o.frequency.exponentialRampToValueAtTime(3600+j*100,t+j*.15+.07)}}
if(frame++%8===0){document.getElementById('distance').textContent=String(Math.floor(travel)).padStart(3,'0');const svgPath=document.querySelector('.map path'),len=svgPath.getTotalLength(),point=svgPath.getPointAtLength(progress*len);document.getElementById('mapDot').setAttribute('cx',point.x);document.getElementById('mapDot').setAttribute('cy',point.y);}
renderer.render(scene,camera);
if(!started){started=true;setTimeout(()=>document.getElementById('loading').classList.add('hide'),180)}
// Auto quality affects resolution only; animation and scene content stay intact.
if(frame<240&&frame>30){dtAverage=dtAverage*.96+rawDt*.04;if(frame===220&&dtAverage>.027&&renderer.getPixelRatio()>1.15){renderer.setPixelRatio(1.15);renderer.setSize(innerWidth,innerHeight)}}
}
animateRider(0,0,0);requestAnimationFrame(loop);
// Read-only diagnostics for verifying the standalone artifact.
window.__riverPost={get state(){return {running,speed,view,sim,travel,day:dayTarget,renderCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,three:T.REVISION}},get renderer(){return renderer},get scene(){return scene},get camera(){return camera}};
})();
