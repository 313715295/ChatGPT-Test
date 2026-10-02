import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let paused = false, speed = 1, time = 0, distance = 0, sunsetTarget = 0, sunsetMix = 0;
let view = 'coast', cameraTransition = 0, toastTimer;
function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2200); }

try { init(); } catch (error) { console.error(error); $('loading').classList.add('failed'); $('error-message').textContent = '请使用支持 WebGL 2 的 Chrome、Edge 或 Safari，并开启浏览器硬件加速后重试。'; }

function init() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xb6dfe4, 48, 175);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 680 ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  $('scene').appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', '可拖动旋转、滚轮缩放的猫咪海岸骑行场景');
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 420);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .06; controls.enablePan = false;
  controls.minDistance = 4.2; controls.maxDistance = 22;
  controls.minPolarAngle = .25; controls.maxPolarAngle = Math.PI / 2 - .035;
  const isMobile = () => innerWidth < 680;
  function preset(name) {
    const mobile = isMobile();
    if (name === 'close') return { position: new THREE.Vector3(4.2, 2.9, mobile ? 7.4 : 5.6), target: new THREE.Vector3(.1, 1.55, .8) };
    if (name === 'follow') return { position: new THREE.Vector3(mobile ? -10 : -8.4, 3.5, mobile ? 6 : 4.4), target: new THREE.Vector3(1.3, 1.3, .35) };
    return { position: new THREE.Vector3(mobile ? 8.8 : 6.8, mobile ? 4.6 : 3.8, mobile ? 13.6 : 10), target: new THREE.Vector3(0, 1.3, -.8) };
  }
  let cameraGoal = preset(view);
  camera.position.copy(cameraGoal.position); controls.target.copy(cameraGoal.target); controls.update();
  controls.addEventListener('start', () => { cameraTransition = 0; document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', 'false')); view = 'free'; });

  const ambient = new THREE.HemisphereLight(0xc8edff, 0xc3b791, 2.25); scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff0c6, 3.6); sun.position.set(-9, 17, 10); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -18; sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 15; sun.shadow.camera.bottom = -15; sun.shadow.camera.near = .5; sun.shadow.camera.far = 55;
  sun.shadow.normalBias = .035; sun.shadow.bias = -.00008; sun.shadow.radius = 3; scene.add(sun); scene.add(sun.target);

  const skyUniforms = { uTop: { value: new THREE.Color('#58b9db') }, uHorizon: { value: new THREE.Color('#d5eee8') }, uSun: { value: new THREE.Vector3(-.45,.44,-.75).normalize() }, uSunColor: { value: new THREE.Color('#fff2bb') } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(350, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: skyUniforms,
    vertexShader: 'varying vec3 vDir; void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 vDir; uniform vec3 uTop,uHorizon,uSun,uSunColor; void main(){vec3 d=normalize(vDir);float h=smoothstep(-.05,.82,d.y);vec3 c=mix(uHorizon,uTop,h);float s=dot(d,uSun);c=mix(c,uSunColor,smoothstep(.9978,.9988,s));c+=uSunColor*.07*pow(max(s,0.),48.);gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
  })); scene.add(sky);

  const mat = (color, roughness = .75, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const materials = {
    asphalt: mat('#6b7b83'), sand: mat('#f1dbab'), edge: mat('#e4ddc9'), white: mat('#fff6df'),
    grass: mat('#88bb7f'), trunk: mat('#b68b5e'), leaf: mat('#4b966f'), leaf2: mat('#65b481'),
    teal: mat('#56c8bb', .28, .18), tealDark: mat('#239b98', .4, .15), cream: mat('#fdf0d5', .45),
    orange: mat('#eba451'), orangeDark: mat('#bd713b'), muzzle: mat('#fff1d6'), nose: mat('#cb746a'),
    eyes: mat('#233e43', .25), tire: mat('#27383e'), metal: mat('#becbd0', .25, .75), seat: mat('#754f3c'),
    coral: mat('#ed785b'), light: new THREE.MeshStandardMaterial({color:'#fff2c2',emissive:'#ffe9a4',emissiveIntensity:.5,roughness:.3}),
    seaRock: mat('#97b3a2'), hill: mat('#6d9d89')
  };
  const geos = { sphere: new THREE.SphereGeometry(1, 24, 16), box: new THREE.BoxGeometry(1,1,1), cylinder: new THREE.CylinderGeometry(1,1,1,16) };
  function mesh(geo, material, parent, p = [0,0,0], s = [1,1,1], shadows = true) {
    const m = new THREE.Mesh(geo, material); m.position.set(...p); m.scale.set(...s); m.castShadow = shadows; m.receiveShadow = shadows; parent.add(m); return m;
  }
  const sphere = (parent,m,p,s,shadows=true) => mesh(geos.sphere,m,parent,p,s,shadows);
  const box = (parent,m,p,s,shadows=true) => mesh(geos.box,m,parent,p,s,shadows);
  function rod(parent,m,a,b,r=.04) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), d = end.clone().sub(start);
    const obj = mesh(geos.cylinder,m,parent,start.clone().add(end).multiplyScalar(.5).toArray(),[r,d.length(),r]);
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()); return obj;
  }
  function tube(parent,m,points,r=.035,segments=24) {
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,r,7,false),m,parent);
  }

  // Ocean, shoreline, and a continuous two-lane coast road.
  const oceanUniforms = { uTime:{value:0}, uDeep:{value:new THREE.Color('#197e9c')}, uShallow:{value:new THREE.Color('#68d3cc')}, uFoam:{value:new THREE.Color('#e0fbec')} };
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(450,230,160,90),new THREE.ShaderMaterial({
    uniforms:oceanUniforms, side:THREE.DoubleSide,
    vertexShader:'uniform float uTime; varying vec3 vWorld; void main(){vec3 p=position;p.z+=sin(p.x*.38+uTime*1.2)*.055+sin(p.y*.63+uTime*.95)*.045;vec4 w=modelMatrix*vec4(p,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:'uniform float uTime;uniform vec3 uDeep,uShallow,uFoam;varying vec3 vWorld;void main(){float coast=smoothstep(-52.,-8.,vWorld.z);float n=sin(vWorld.x*.8+sin(vWorld.z*.31+uTime*.6)*2.+uTime*.6)*sin(vWorld.z*1.5-uTime*.85);float glint=pow(max(n,0.),24.);float swell=sin(vWorld.z*1.65+sin(vWorld.x*.26)*.7+uTime*1.4);float foam=pow(max(swell,0.),20.)*coast*.27;vec3 c=mix(uDeep,uShallow,coast*.83)+n*.018;c=mix(c,uFoam,glint*.42+foam);float fog=smoothstep(90.,220.,length(vWorld.xz));c=mix(c,vec3(.67,.84,.85),fog);gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
  })); ocean.rotation.x=-Math.PI/2; ocean.position.set(0,-.14,-121); scene.add(ocean);
  box(scene,materials.sand,[0,-.33,-5.5],[350,.6,5]);
  box(scene,materials.asphalt,[0,-.12,0],[350,.24,6.8]);
  box(scene,materials.edge,[0,-.09,-3.65],[350,.22,.56]);
  box(scene,materials.edge,[0,-.08,3.65],[350,.26,.56]);
  box(scene,materials.sand,[0,-.18,8],[350,.28,8.5]);
  box(scene,materials.grass,[0,-.26,18],[350,.35,15]);
  for(const z of [-3.15,3.15]) box(scene,materials.white,[0,.006,z],[350,.012,.075],false);

  const moving = new THREE.Group(); scene.add(moving); const loops=[];
  const period=120;
  function loopObject(object,x){object.position.x=x; moving.add(object);loops.push({object,x});}
  for(let x=-60;x<60;x+=5) { const m=box(new THREE.Group(),materials.white,[0,.012,0],[2.6,.02,.105],false); loopObject(m,x); }
  // A low seawall, its posts and reflective road bollards pass by the rider.
  box(scene,materials.edge,[0,.36,-3.91],[350,.17,.19]);
  for(let x=-60;x<60;x+=6){const g=new THREE.Group();box(g,materials.edge,[0,.21,-3.91],[.17,.6,.23]);box(g,materials.white,[0,.48,3.65],[.12,.85,.13]);box(g,materials.coral,[0,.65,3.65],[.125,.15,.14]);loopObject(g,x);}

  let seed=9137;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  function palm(height=4.4){
    const g=new THREE.Group();
    const bend=.35;
    tube(g,materials.trunk,[[0,0,0],[.12,height*.4,0],[bend,height*.85,.06],[bend,height,.07]],.125,12);
    for(let i=1;i<9;i++){const h=height*i/9;const ring=mesh(new THREE.TorusGeometry(.13,.018,5,12),materials.trunk,g,[bend*(i/9)**2,h,.04]);ring.rotation.x=Math.PI/2;}
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4+.13;
      const vertices=[],indices=[],length=1.9+rand()*.7;
      const steps=10;
      for(let j=0;j<=steps;j++){
        const t=j/steps,d=length*t,w=Math.sin(t*Math.PI)**.65*.24;
        const y=height+.07+Math.sin(t*Math.PI)*.35-t*t*.73;
        for(const side of [-1,1]) vertices.push(bend+Math.cos(a)*d-Math.sin(a)*w*side,y+(j%2)*.025,.07+Math.sin(a)*d+Math.cos(a)*w*side);
        if(j<steps){const q=j*2;indices.push(q,q+1,q+2,q+1,q+3,q+2);}
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
      const leafmat=(i%2?materials.leaf:materials.leaf2);leafmat.side=THREE.DoubleSide;mesh(geo,leafmat,g);
      tube(g,materials.leaf,[[bend,height,.07],[bend+Math.cos(a)*length*.5,height+.25,.07+Math.sin(a)*length*.5],[bend+Math.cos(a)*length,height-.66,.07+Math.sin(a)*length]],.022,8);
    }
    for(let i=0;i<3;i++)sphere(g,materials.trunk,[bend+Math.cos(i*2)*.18,height-.15,.07+Math.sin(i*2)*.18],[.14,.18,.14]);
    return g;
  }
  for(let x=-51;x<60;x+=17){const g=palm(3.8+rand()*.9);g.position.z=-5.45;g.rotation.y=rand()*2;loopObject(g,x);}
  for(let x=-60;x<60;x+=26){const g=palm(4.2+rand());g.position.z=6.6+rand()*2.5;g.rotation.y=rand()*3;loopObject(g,x);}
  // Beach stones and low dune grass.
  for(let i=0;i<32;i++){
    const g=new THREE.Group();g.position.z=4.4+rand()*5;
    if(i%3===0)mesh(new THREE.DodecahedronGeometry(.25+rand()*.3,0),materials.seaRock,g,[0,.12,0],[1,.65,.8]);
    else for(let j=0;j<5;j++)rod(g,materials.leaf,[0,0,0],[(rand()-.5)*.35,.18+rand()*.35,(rand()-.5)*.3],.012);
    loopObject(g,-60+rand()*120);
  }
  function sign(){const g=new THREE.Group();rod(g,materials.metal,[0,0,0],[0,2.8,0],.045);box(g,materials.tealDark,[0,2.55,0],[1.7,.7,.085]);
    const c=document.createElement('canvas');c.width=512;c.height=220;const ctx=c.getContext('2d');ctx.fillStyle='#218982';ctx.fillRect(0,0,512,220);ctx.strokeStyle='#d9f0d5';ctx.lineWidth=7;ctx.strokeRect(10,10,492,200);ctx.fillStyle='#fff9e5';ctx.font='bold 57px sans-serif';ctx.textAlign='center';ctx.fillText('海岸公路',256,95);ctx.font='28px sans-serif';ctx.fillText('COAST ROAD  ·  08',256,154);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;mesh(new THREE.PlaneGeometry(1.65,.7),new THREE.MeshBasicMaterial({map:tex}),g,[0,2.55,.052],undefined,false);g.position.z=-4.6;return g;}
  loopObject(sign(),31);

  // Distant islands, sailboats, and soft clouds remain on the horizon.
  for(const [x,z,s] of [[-43,-85,1.1],[32,-112,1.7],[72,-145,1.1]]){
    const g=new THREE.Group();g.position.set(x,-.4,z);
    sphere(g,materials.sand,[0,.1,0],[13*s,.6,5*s],false);
    mesh(new THREE.ConeGeometry(9*s,7*s,8),materials.hill,g,[-3*s,2.2*s,0],[1,1,.65],false);
    mesh(new THREE.ConeGeometry(6*s,5*s,7),materials.seaRock,g,[6*s,1.5*s,0],[1,1,.7],false);scene.add(g);
  }
  const boats=[];
  function boat(x,z,scale){const g=new THREE.Group();g.position.set(x,-.06,z);g.scale.setScalar(scale);
    sphere(g,materials.cream,[0,.13,0],[1.1,.23,.35],false);rod(g,materials.trunk,[0,.2,0],[0,2.9,0],.035);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([.08,.5,0,.08,2.85,0,1.35,.5,0],3));geo.computeVertexNormals();const sail=materials.white.clone();sail.side=THREE.DoubleSide;mesh(geo,sail,g,undefined,undefined,false);scene.add(g);boats.push({g,x,z});}
  boat(-19,-35,.8);boat(25,-49,1.1);
  const cloudMat=mat('#f4fcf7');const clouds=[];
  for(let i=0;i<11;i++){
    const g=new THREE.Group(),x=-85+i*18,z=-68-rand()*46,y=12+rand()*13;
    for(let j=0;j<5;j++)sphere(g,cloudMat,[(j-2)*1.8,Math.sin(j)*.4,0],[2.1,1+rand()*.6,1.25],false);
    g.position.set(x,y,z);scene.add(g);clouds.push({g,x});
  }

  // Detailed electric scooter. Forward is +X; the wheel axles point along Z.
  const rider=new THREE.Group();rider.position.set(0,0,1.32);scene.add(rider);
  const scooter=new THREE.Group();rider.add(scooter);
  const wheels=[];
  for(const x of [-.96,.98]){
    const g=new THREE.Group();g.position.set(x,.47,0);scooter.add(g);
    mesh(new THREE.TorusGeometry(.345,.108,12,32),materials.tire,g);
    const rim=mesh(new THREE.CylinderGeometry(.245,.245,.135,24),materials.cream,g);rim.rotation.x=Math.PI/2;
    for(const side of [-1,1]){
      const hub=mesh(new THREE.CylinderGeometry(.07,.07,.022,16),materials.tealDark,g,[0,0,side*.083]);hub.rotation.x=Math.PI/2;
      for(let j=0;j<6;j++){const a=j*Math.PI/3;rod(g,materials.metal,[Math.cos(a)*.07,Math.sin(a)*.07,side*.085],[Math.cos(a)*.20,Math.sin(a)*.20,side*.085],.018);}
    }wheels.push(g);
  }
  box(scooter,materials.tealDark,[-.06,.56,0],[1.9,.14,.68]);
  box(scooter,materials.cream,[.07,.647,0],[1.33,.055,.57]);
  for(let i=0;i<5;i++)box(scooter,materials.tealDark,[.07,.678,-.23+i*.115],[.95,.006,.022],false);
  sphere(scooter,materials.teal,[-.87,.85,0],[.57,.32,.41]);
  sphere(scooter,materials.teal,[-.61,1.08,0],[.5,.32,.34]);
  sphere(scooter,materials.seat,[-.55,1.32,0],[.59,.13,.39]);
  rod(scooter,materials.metal,[-1.04,.49,-.06],[-.50,1.08,-.06],.065);
  rod(scooter,materials.metal,[.98,.47,0],[.82,1.7,0],.075);
  sphere(scooter,materials.teal,[.87,1.09,0],[.26,.65,.41]);
  sphere(scooter,materials.cream,[1.07,1.13,0],[.06,.41,.285]);
  const frontFender=mesh(new THREE.TorusGeometry(.445,.085,10,28,Math.PI),materials.teal,scooter,[.98,.48,0],[1,1,1]);
  const rearFender=mesh(new THREE.TorusGeometry(.445,.06,10,28,Math.PI),materials.teal,scooter,[-.96,.47,0]);
  sphere(scooter,materials.teal,[.85,1.84,0],[.245,.175,.26]);
  const lamp=mesh(new THREE.CylinderGeometry(.125,.125,.06,32),materials.light,scooter,[1.071,1.85,0]);lamp.rotation.z=-Math.PI/2;
  const lampRim=mesh(new THREE.TorusGeometry(.135,.02,8,28),materials.metal,scooter,[1.11,1.85,0]);lampRim.rotation.y=Math.PI/2;
  rod(scooter,materials.metal,[.78,1.88,-.48],[.78,1.88,.48],.04);
  for(const z of [-.47,.47]){
    rod(scooter,materials.tire,[.78,1.88,z-.07],[.78,1.88,z+.07],.055);
    const sz=Math.sign(z);rod(scooter,materials.metal,[.78,1.91,z],[.84,2.24,z+sz*.11],.022);
    sphere(scooter,materials.teal,[.84,2.24,z+sz*.11],[.06,.10,.14]);
    sphere(scooter,materials.metal,[.895,2.24,z+sz*.11],[.012,.074,.115]);
    sphere(scooter,materials.coral,[1.01,1.51,sz*.33],[.07,.06,.08]);
  }
  box(scooter,materials.coral,[-1.33,.97,0],[.06,.12,.19]);
  const plate=box(scooter,materials.white,[-1.34,.77,0],[.028,.16,.31]);plate.rotation.z=-.12;
  rod(scooter,materials.metal,[-1.06,1.17,-.32],[-1.06,1.17,.32],.028);
  for(const z of [-.29,.29])rod(scooter,materials.metal,[-1.25,1.17,z],[-.88,1.17,z],.022);
  // Tiny lightning badge on the electric scooter's side.
  const boltShape=new THREE.Shape();boltShape.moveTo(-.03,.12);boltShape.lineTo(-.1,-.015);boltShape.lineTo(.015,-.015);boltShape.lineTo(-.035,-.12);boltShape.lineTo(.11,.04);boltShape.lineTo(0,.04);boltShape.closePath();
  for(const z of [-.404,.404])mesh(new THREE.ShapeGeometry(boltShape),new THREE.MeshBasicMaterial({color:'#fff3ce',side:THREE.DoubleSide}),scooter,[-.92,.92,z],[.8,.8,.8],false);

  // Orange cat: paws on the handlebars, feet on the deck, helmet and wind-blown scarf.
  const cat=new THREE.Group();rider.add(cat);
  sphere(cat,materials.orange,[-.43,1.79,0],[.31,.5,.31]);
  sphere(cat,materials.muzzle,[-.175,1.75,0],[.052,.32,.235]);
  sphere(cat,materials.orange,[-.55,1.44,-.19],[.28,.24,.21]);sphere(cat,materials.orange,[-.55,1.44,.19],[.28,.24,.21]);
  const head=new THREE.Group();head.position.set(-.28,2.4,0);cat.add(head);
  sphere(head,materials.orange,[0,0,0],[.48,.43,.43]);
  // Conical ears with inner pink triangles.
  for(const z of [-.29,.29]){
    const ear=mesh(new THREE.ConeGeometry(.175,.39,3),materials.orange,head,[-.065,.405,z]);ear.rotation.y=Math.PI/2;ear.rotation.x=Math.sign(z)*.19;
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([.063,.37,z-.11,.063,.37,z+.11,.063,.64,z],3));geo.computeVertexNormals();mesh(geo,new THREE.MeshStandardMaterial({color:'#eaa69a',side:THREE.DoubleSide,roughness:.9}),head,undefined,undefined,false);
  }
  for(const z of [-.22,.22]){
    sphere(head,materials.eyes,[.409,.055,z],[.07,.105,.062]);
    sphere(head,materials.white,[.464,.091,z+.012],[.018,.024,.015],false);
    sphere(head,materials.muzzle,[.417,-.125,z*.48],[.105,.115,.14]);
    sphere(head,materials.nose,[.364,-.105,Math.sign(z)*.324],[.012,.062,.087]);
    for(let k=0;k<3;k++)rod(head,materials.seat,[.432,-.13,z*.84],[.47,-.12+(k-1)*.076,Math.sign(z)*(.44+k*.025)],.008);
  }
  sphere(head,materials.nose,[.516,-.082,0],[.049,.036,.047]);
  tube(head,materials.seat,[[.509,-.13,0],[.502,-.17,0],[.479,-.19,-.07]],.009,8);
  tube(head,materials.seat,[[.502,-.17,0],[.479,-.19,.07]],.009,8);
  // Tabby markings are raised curved fur patches, visible on both cheeks.
  for(const z of [-.41,.41])for(let k=0;k<2;k++){
    const stripe=sphere(head,materials.orangeDark,[-.13+k*.13,.025-k*.09,z],[.045,.13,.013]);stripe.rotation.z=-.45;
  }
  for(let k=-1;k<=1;k++)sphere(head,materials.orangeDark,[.33,.273,k*.10],[.022,.11,.031]);
  const helmet=mesh(new THREE.SphereGeometry(.50,32,18,0,Math.PI*2,0,Math.PI*.45),materials.teal,head,[-.025,.065,0],[1,1,.95]);
  const helmetRim=mesh(new THREE.TorusGeometry(.49,.025,8,32),materials.cream,head,[-.025,.143,0],[1,1,.95]);helmetRim.rotation.x=Math.PI/2;
  // Two longitudinal cream helmet stripes.
  for(const z of [-.09,.09])tube(head,materials.cream,[[.418,.235,z],[.26,.47,z],[-.02,.565,z],[-.30,.46,z],[-.47,.22,z]],.025,20);
  sphere(head,materials.teal,[.42,.18,0],[.16,.033,.42]);
  for(const z of [-.32,.32])tube(head,materials.seat,[[-.22,.08,z],[-.12,-.34,z*.9],[.17,-.34,z*.7]],.016,10);
  const arms=[];
  for(const z of [-1,1]){
    const g=new THREE.Group();cat.add(g);arms.push(g);
    rod(g,materials.orange,[-.31,1.99,z*.23],[.17,1.76,z*.35],.105);
    sphere(g,materials.orange,[.17,1.76,z*.35],[.12,.11,.11]);
    rod(g,materials.orange,[.17,1.76,z*.35],[.72,1.89,z*.46],.082);
    sphere(g,materials.muzzle,[.75,1.89,z*.47],[.12,.09,.092]);
    rod(cat,materials.orange,[-.47,1.46,z*.24],[-.05,1.04,z*.36],.13);
    sphere(cat,materials.orange,[-.05,1.04,z*.36],[.15,.16,.14]);
    rod(cat,materials.orange,[-.05,1.04,z*.36],[.17,.72,z*.32],.105);
    sphere(cat,materials.muzzle,[.26,.73,z*.33],[.21,.08,.13]);
    for(let j=0;j<2;j++)rod(cat,materials.orangeDark,[.35,.786,z*.33+(j-.5)*.07],[.41,.764,z*.33+(j-.5)*.07],.008);
  }
  const tailPivot=new THREE.Group();tailPivot.position.set(-.74,1.49,-.10);cat.add(tailPivot);
  tube(tailPivot,materials.orange,[[0,0,0],[-.43,-.08,-.09],[-.77,.03,-.16],[-1.05,.28,-.12],[-1.02,.60,.04],[-.86,.73,.11]],.09,32);
  sphere(tailPivot,materials.orangeDark,[-.86,.73,.11],[.091,.092,.095]);
  for(const p of [[-.47,-.06,-.10],[-.83,.07,-.16],[-1.03,.31,-.10]])sphere(tailPivot,materials.orangeDark,p,[.035,.095,.095]);
  const scarf=new THREE.Group();cat.add(scarf);
  const collar=mesh(new THREE.TorusGeometry(.243,.067,10,28),materials.coral,scarf,[-.35,2.055,0],[1,1,1.06]);collar.rotation.x=Math.PI/2;
  sphere(scarf,materials.coral,[-.55,2.10,.23],[.115,.10,.10]);
  const scarfGeo=new THREE.PlaneGeometry(1.0,.16,14,1);const scarfMat=materials.coral.clone();scarfMat.side=THREE.DoubleSide;
  const scarfFlap=mesh(scarfGeo,scarfMat,scarf,[-1.10,2.08,.24],undefined,false);
  const scarfBase=scarfGeo.attributes.position.array.slice();

  // Soft contact shadow keeps the scooter grounded even with a low sun.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d');const grad=sc.createRadialGradient(64,64,5,64,64,62);grad.addColorStop(0,'rgba(20,38,40,.28)');grad.addColorStop(.5,'rgba(20,38,40,.13)');grad.addColorStop(1,'rgba(20,38,40,0)');sc.fillStyle=grad;sc.fillRect(0,0,128,128);
  const contact=mesh(new THREE.PlaneGeometry(3.8,1.8),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}),scene,[0,.026,1.32],undefined,false);contact.rotation.x=-Math.PI/2;

  const birds=[];
  for(let i=0;i<7;i++){
    const g=new THREE.Group(),left=new THREE.Group(),right=new THREE.Group();g.add(left,right);
    sphere(g,materials.white,[0,0,0],[.12,.06,.05],false);
    const wingGeo=new THREE.BufferGeometry();wingGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.13,.025,.2,0,0,.50],3));wingGeo.computeVertexNormals();
    const wingMat=materials.white.clone();wingMat.side=THREE.DoubleSide;mesh(wingGeo,wingMat,right,undefined,undefined,false);mesh(wingGeo,wingMat,left,[0,0,0],[1,1,-1],false);
    g.position.set(-12+i*4,5+rand()*3,-16-rand()*17);scene.add(g);birds.push({g,left,right,x:g.position.x,y:g.position.y,z:g.position.z,phase:rand()*6});
  }

  const day={top:new THREE.Color('#58b9db'),horizon:new THREE.Color('#d5eee8'),fog:new THREE.Color('#b6dfe4'),sun:new THREE.Color('#fff0c6'),ambient:new THREE.Color('#c8edff'),deep:new THREE.Color('#197e9c'),shallow:new THREE.Color('#68d3cc')};
  const dusk={top:new THREE.Color('#7d9fbe'),horizon:new THREE.Color('#ffd1a1'),fog:new THREE.Color('#dcc8b5'),sun:new THREE.Color('#ffb975'),ambient:new THREE.Color('#c6bfdb'),deep:new THREE.Color('#376f8a'),shallow:new THREE.Color('#72b8b2')};
  function updatePlay(){ $('play').dataset.paused=String(paused);$('play').setAttribute('aria-label',paused?'继续骑行':'暂停骑行');$('play').setAttribute('aria-pressed',String(paused)); }
  updatePlay();
  $('play').addEventListener('click',()=>{paused=!paused;updatePlay();});
  function setSpeed(value){speed=value;$('speed').value=String(speed);$('speed-value').value=speed.toFixed(1)+'×';$('speed').setAttribute('aria-valuetext',speed.toFixed(1)+' 倍速度');}
  function setView(name){view=name;cameraGoal=preset(view);cameraTransition=1;if(reducedMotion){camera.position.copy(cameraGoal.position);controls.target.copy(cameraGoal.target);cameraTransition=0;}document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));}
  $('speed').addEventListener('input',e=>setSpeed(Number(e.target.value)));
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
  $('sunset').addEventListener('click',()=>{sunsetTarget=1-sunsetTarget;$('sunset').setAttribute('aria-pressed',String(!!sunsetTarget));$('sunset').setAttribute('aria-label',sunsetTarget?'切换到晴天':'切换到日落');$('sunset').querySelector('span').textContent=sunsetTarget?'晴天海岸':'日落时分';$('weather-label').textContent=sunsetTarget?'日落 · 追着晚风':'晴天 · 海风轻拂';});
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('当前窗口暂不支持全屏，可在浏览器中打开。');}});
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'退出全屏':'进入全屏');});
  document.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target===document.body){e.preventDefault();paused=!paused;updatePlay();}});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('loading').classList.remove('hidden');$('loading').classList.add('failed');$('error-message').textContent='图形显示已中断，请重新加载页面。';});
  window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,isMobile()?1.5:2));if(view!=='free'){cameraGoal=preset(view);cameraTransition=1;}});

  let previous=performance.now(),frames=0;
  function render(now){
    const dt=Math.min((now-previous)/1000,.06);previous=now;
    const motion=paused?0:dt*speed;
    time+=motion;distance+=motion*5.56/1000;
    const offset=(time*5.56)%period;
    for(const {object,x} of loops)object.position.x=((x-offset+60)%period+period)%period-60;
    for(const wheel of wheels)wheel.rotation.z=-time*5.56/.445;
    rider.position.y=Math.sin(time*5)*.018;rider.rotation.x=Math.sin(time*1.35)*.022;rider.rotation.z=Math.sin(time*2.1)*.008;
    head.rotation.y=Math.sin(time*.7)*.055;head.rotation.z=Math.sin(time*2)*.015;
    tailPivot.rotation.x=Math.sin(time*2.4)*.13;tailPivot.rotation.y=Math.sin(time*1.8)*.09;
    const blink=Math.pow(Math.max(0,Math.sin(time*.57)),44);head.children.forEach(m=>{if(m.material===materials.eyes)m.scale.y=.105*(1-blink*.92);});
    const positions=scarfGeo.attributes.position;
    for(let i=0;i<positions.count;i++){const x=scarfBase[i*3],r=(.5-x);positions.setY(i,scarfBase[i*3+1]+Math.sin(r*7-time*8)*.06*r);positions.setZ(i,Math.sin(r*5-time*5)*.07*r);}
    positions.needsUpdate=true;scarfGeo.computeVertexNormals();oceanUniforms.uTime.value=time;
    for(const b of boats){b.g.position.y=-.05+Math.sin(time*.8+b.x)*.07;b.g.rotation.x=Math.sin(time*.7+b.x)*.045;b.g.rotation.z=Math.sin(time*.6+b.x)*.025;b.g.position.x=b.x+Math.sin(time*.03)*2;}
    for(const b of birds){b.g.position.x=b.x+Math.sin(time*.12+b.phase)*5;b.g.position.y=b.y+Math.sin(time*.6+b.phase)*.3;b.left.rotation.x=Math.sin(time*5+b.phase)*.45;b.right.rotation.x=-Math.sin(time*5+b.phase)*.45;}
    for(const c of clouds)c.g.position.x=c.x+Math.sin(time*.02)*3;
    if(cameraTransition){const k=1-Math.exp(-dt*4);camera.position.lerp(cameraGoal.position,k);controls.target.lerp(cameraGoal.target,k);if(camera.position.distanceTo(cameraGoal.position)<.015)cameraTransition=0;}
    controls.update();
    sunsetMix=THREE.MathUtils.damp(sunsetMix,sunsetTarget,2.5,dt);
    skyUniforms.uTop.value.copy(day.top).lerp(dusk.top,sunsetMix);skyUniforms.uHorizon.value.copy(day.horizon).lerp(dusk.horizon,sunsetMix);
    skyUniforms.uSun.value.set(-.45,.44-sunsetMix*.32,-.75).normalize();
    scene.fog.color.copy(day.fog).lerp(dusk.fog,sunsetMix);sun.color.copy(day.sun).lerp(dusk.sun,sunsetMix);sun.intensity=3.6-sunsetMix*1.3;
    sun.position.y=17-sunsetMix*11;ambient.color.copy(day.ambient).lerp(dusk.ambient,sunsetMix);ambient.intensity=2.25-sunsetMix*.5;
    oceanUniforms.uDeep.value.copy(day.deep).lerp(dusk.deep,sunsetMix);oceanUniforms.uShallow.value.copy(day.shallow).lerp(dusk.shallow,sunsetMix);
    renderer.render(scene,camera);
    if(++frames===2){$('loading').classList.add('hidden');setTimeout(()=>$('loading').style.display='none',650);}
    if(frames%20===0)$('distance').textContent=distance.toFixed(2);
  }
  renderer.setAnimationLoop(render);
  document.addEventListener('visibilitychange',()=>{previous=performance.now();});
  // Browser agents can use the same controls when WebMCP is available.
  const state=()=>({ready:frames>1,paused,speed,camera:view,sunset:!!sunsetTarget,elapsedSeconds:Number(time.toFixed(3)),distanceKm:Number(distance.toFixed(4))});
  const context=document.modelContext;
  if(context?.registerTool){
    const lifecycle=new AbortController();
    const tools=[
      {name:'inspect_coastal_ride',title:'查看骑行状态',description:'Read the current coastal cat animation playback, speed, camera, lighting and travel progress.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){if(input&&Object.keys(input).length)throw new Error('This tool accepts no input properties.');return state();}},
      {name:'configure_coastal_ride',title:'调整骑行场景',description:'Set the coastal cat animation playback, riding speed, camera preset or daylight using the same controls as the visible page.',inputSchema:{type:'object',properties:{paused:{type:'boolean'},speed:{type:'number',minimum:.3,maximum:2},camera:{type:'string',enum:['coast','close','follow']},sunset:{type:'boolean'}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(input){
        if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['paused','speed','camera','sunset'].includes(k)))throw new Error('Invalid configuration object.');
        if('paused'in input&&typeof input.paused!=='boolean')throw new Error('paused must be a boolean.');
        if('speed'in input&&(!Number.isFinite(input.speed)||input.speed<.3||input.speed>2))throw new Error('speed must be between 0.3 and 2.');
        if('camera'in input&&!['coast','close','follow'].includes(input.camera))throw new Error('Unknown camera preset.');
        if('sunset'in input&&typeof input.sunset!=='boolean')throw new Error('sunset must be a boolean.');
        if('paused'in input){paused=input.paused;updatePlay();}if('speed'in input)setSpeed(input.speed);if('camera'in input)setView(input.camera);if('sunset'in input&&input.sunset!==!!sunsetTarget)$('sunset').click();
        await new Promise(resolve=>requestAnimationFrame(resolve));return state();
      }}
    ];
    for(const tool of tools){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
    window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  }
}
