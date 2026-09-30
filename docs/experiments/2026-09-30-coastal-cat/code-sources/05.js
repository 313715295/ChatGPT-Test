import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const $ = (id) => document.getElementById(id);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = THREE.MathUtils.clamp;
const loading = $('loading');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (error) {
  $('loading-detail').textContent = '当前浏览器没有启用 3D 图形。请在 Chrome 或 Edge 中启用硬件加速，再打开这个网页。';
  document.documentElement.dataset.error = error.message;
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 650 ? 1.5 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('world').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#d4edee');
scene.fog = new THREE.Fog('#d9ede6', 58, 170);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 450);
scene.add(new THREE.HemisphereLight('#e5f9ff', '#d8b582', 2.4));
const sunlight = new THREE.DirectionalLight('#fff1d6', 3.1);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(innerWidth < 650 ? 1024 : 2048, innerWidth < 650 ? 1024 : 2048);
Object.assign(sunlight.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 95 });
sunlight.shadow.bias = -.0003;
sunlight.shadow.normalBias = .035;
sunlight.shadow.radius = 3;
scene.add(sunlight, sunlight.target);

const mats = {};
function material(name, color, extra = {}) {
  mats[name] = new THREE.MeshStandardMaterial({ color, roughness: .82, ...extra });
  return mats[name];
}
material('fur', '#e89b46'); material('furLight', '#f7b35c'); material('tabby', '#a85c31');
material('cream', '#fff0ce'); material('pink', '#de8b7c'); material('ink', '#283d40');
material('mint', '#60b8aa', { roughness: .35, metalness: .12 });
material('mintLight', '#9ad5bc', { roughness: .48 }); material('shirt', '#437f81');
material('scarf', '#e98163'); material('rubber', '#283b42', { roughness: .95 });
material('metal', '#c3d0ca', { roughness: .32, metalness: .65 }); material('seat', '#634b3e');
material('road', '#627879'); material('paint', '#fbf1cd'); material('concrete', '#efe7c9');
material('sand', '#f0d7a4'); material('grass', '#a3ba87'); material('grassLight', '#c0ce96');
material('leaf', '#488b72'); material('leafLight', '#76a782'); material('trunk', '#b49163');
material('rock', '#9ba591'); material('roof', '#d27d5d'); material('house', '#f5dbb5');
material('housePink', '#dfb6a0'); material('glass', '#376a71', { roughness: .24, metalness: .12 });
material('blue', '#7bbabd'); material('yellow', '#f1bc65');
material('lamp', '#fff6bc', { emissive: '#ffdf95', emissiveIntensity: .5 });
const sphereGeo = new THREE.SphereGeometry(1, 24, 16);
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const yAxis = V(0, 1, 0);
function mesh(parent, geometry, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, mat); m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function box(parent, mat, pos, scale) { const m = mesh(parent, boxGeo, mat, ...pos); m.scale.set(...scale); return m; }
function ball(parent, mat, pos, scale) { const m = mesh(parent, sphereGeo, mat, ...pos); m.scale.set(...scale); return m; }
function cylinderBetween(parent, mat, a, b, radius, topRadius = radius, segments = 10) {
  const start = V(...a), end = V(...b), delta = end.clone().sub(start);
  const m = mesh(parent, new THREE.CylinderGeometry(topRadius, radius, delta.length(), segments), mat);
  m.position.copy(start).add(end).multiplyScalar(.5); m.quaternion.setFromUnitVectors(yAxis, delta.normalize()); return m;
}
function curveTube(parent, mat, points, radius, segments = 24) {
  return mesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => V(...p))), segments, radius, 6, false), mat);
}
function roundedBox(parent, mat, width, height, depth, radius, pos) {
  const s = new THREE.Shape(), x = -width / 2, y = -height / 2;
  s.moveTo(x + radius, y); s.lineTo(x + width - radius, y);
  s.quadraticCurveTo(x + width, y, x + width, y + radius); s.lineTo(x + width, y + height - radius);
  s.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); s.lineTo(x + radius, y + height);
  s.quadraticCurveTo(x, y + height, x, y + height - radius); s.lineTo(x, y + radius);
  s.quadraticCurveTo(x, y, x + radius, y);
  return mesh(parent, new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .025, bevelThickness: .025, curveSegments: 5 }), mat, ...pos);
}
function batchStatic(group) {
  group.updateMatrixWorld(true);
  const byMaterial = new Map();
  group.traverse(o => {
    if (!o.isMesh) return;
    const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    if (g.index) { const flat = g.toNonIndexed(); g.dispose(); byMaterial.set(o.material, [...(byMaterial.get(o.material) || []), flat]); }
    else byMaterial.set(o.material, [...(byMaterial.get(o.material) || []), g]);
  });
  group.clear();
  for (const [mat, geometries] of byMaterial) {
    const combined = mergeGeometries(geometries, false);
    geometries.forEach(g => g.dispose());
    mesh(group, combined, mat);
  }
}

// Sky and water are generated locally: no remote images or model files.
const sky = new THREE.Mesh(new THREE.SphereGeometry(290, 32, 20), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  vertexShader: 'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: `varying vec3 vDir;void main(){vec3 d=normalize(vDir);float t=smoothstep(-.12,.72,d.y);vec3 col=mix(vec3(.86,.94,.89),vec3(.55,.80,.86),t);float glow=pow(max(0.,dot(d,normalize(vec3(-.6,.25,.9)))),32.);col+=glow*vec3(.09,.04,-.015);gl_FragColor=vec4(col,1.);}`
}));
sky.renderOrder = -10; scene.add(sky);
const sun = mesh(scene, new THREE.SphereGeometry(6.5, 24, 16), new THREE.MeshBasicMaterial({ color: '#fff3c5', fog: false }), -113, 53, 168);
sun.castShadow = false;
const seaUniforms = { uTime: { value: 0 }, uTravel: { value: 0 } };
const ocean = new THREE.Mesh(new THREE.PlaneGeometry(330, 660, 80, 160), new THREE.ShaderMaterial({
  uniforms: seaUniforms,
  vertexShader: `uniform float uTime;uniform float uTravel;varying vec3 vWorld;void main(){vec3 p=position;float z=p.y+uTravel;float w=sin(p.x*.37+z*.21+uTime*1.2)*.047+sin(z*.51-p.x*.12-uTime*.8)*.028;p.z+=w;vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,
  fragmentShader: `uniform float uTime;varying vec3 vWorld;void main(){float x=vWorld.x,z=vWorld.z;float nearShore=smoothstep(-90.,-7.,x);vec3 col=mix(vec3(.19,.57,.65),vec3(.36,.77,.72),nearShore);float ripple=sin(z*1.42+x*.66-uTime*1.55)+sin(x*1.7-z*.39+uTime);col+=ripple*.022;float line=abs(sin(z*.25+x*1.25+uTime*.65));float glint=pow(max(0.,sin(z*3.6+x*.59+uTime*.8)*sin(x*2.5-z*.36-uTime*.55)),16.);col+=glint*.17;float foam=(1.-smoothstep(.035,.2,abs(x+7.9+sin(z*.22+uTime)*.21)))*(.55+.3*sin(z*.65+uTime));col=mix(col,vec3(.88,.96,.84),foam);float mist=smoothstep(90.,200.,length(vWorld.xz-cameraPosition.xz));col=mix(col,vec3(.79,.9,.86),mist*.8);gl_FragColor=vec4(col,1.);}`
}));
ocean.rotation.x = -Math.PI / 2; ocean.position.set(-172, -.07, 0); scene.add(ocean);
const land = box(scene, mats.grass, [38, -.17, 0], [70, .3, 680]); land.castShadow = false;

// A reusable stretch of coastline. Static pieces are merged by material.
function palm(parent, x, z, height = 4.4, spin = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = spin; parent.add(g);
  const lean = .37;
  cylinderBetween(g, mats.trunk, [0, .2, 0], [lean * .35, height * .58, .08], .14, .105);
  cylinderBetween(g, mats.trunk, [lean * .35, height * .58, .08], [lean, height, .17], .106, .075);
  for (let j = 0; j < 8; j++) {
    const theta = j * Math.PI / 4 + .14;
    const positions = [], normals = [], uvs = [];
    const count = 10, span = 1.8 + (j % 3) * .15;
    for (let i = 0; i < count; i++) {
      const a = i / count, b = (i + 1) / count;
      const p = t => { const width = Math.sin(t * Math.PI) * .22; const l = t * span; const y = height + .12 + Math.sin(t * Math.PI) * .44 - t * .64; return [V(lean + Math.sin(theta) * l + Math.cos(theta) * width, y, .17 + Math.cos(theta) * l - Math.sin(theta) * width), V(lean + Math.sin(theta) * l - Math.cos(theta) * width, y, .17 + Math.cos(theta) * l + Math.sin(theta) * width)]; };
      const [al, ar] = p(a), [bl, br] = p(b);
      for (const v of [al, ar, bl, ar, br, bl]) { positions.push(v.x, v.y, v.z); normals.push(0, 1, 0); uvs.push(v.x, v.z); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    mesh(g, geo, j % 2 ? mats.leaf : mats.leafLight);
  }
  for (let j = 0; j < 3; j++) ball(g, mats.trunk, [lean + Math.sin(j * 2) * .12, height -.13, .17 + Math.cos(j * 2) * .12], [.14, .18, .14]);
}
mats.leaf.side = THREE.DoubleSide; mats.leafLight.side = THREE.DoubleSide;
function umbrella(parent, x, z, color) {
  cylinderBetween(parent, mats.cream, [x, .04, z], [x, 1.65, z], .025);
  const canopy = mesh(parent, new THREE.ConeGeometry(.85, .34, 12, 1, true), color, x, 1.72, z);
  canopy.material.side = THREE.DoubleSide;
  mesh(parent, new THREE.ConeGeometry(.035, .12, 8), mats.cream, x, 1.93, z);
  box(parent, mats.cream, [x + .15, .08, z + 1.1], [.65, .018, 1.18]);
  for (let i = 0; i < 3; i++) box(parent, color, [x + .15, .095, z + .75 + i * .31], [.65, .02, .10]);
}
function house(parent, z, color, flip) {
  const g = new THREE.Group(); parent.add(g); g.position.set(10.8, 0, z); g.rotation.y = -Math.PI / 2;
  box(g, color, [0, 1.15, 0], [3.8, 2.3, 3]);
  const roofShape = new THREE.Shape(); roofShape.moveTo(-2.10, 0); roofShape.lineTo(0, .94); roofShape.lineTo(2.10, 0); roofShape.closePath();
  mesh(g, new THREE.ExtrudeGeometry(roofShape, { depth: 3.48, bevelEnabled: false }), flip ? mats.mint : mats.roof, 0, 2.28, -1.74);
  box(g, mats.cream, [0, 1.45, 1.53], [3.85, .14, .10]);
  box(g, mats.glass, [-.85, 1.18, 1.53], [.84, .83, .06]);
  box(g, mats.cream, [-.85, 1.18, 1.58], [.055, .86, .04]); box(g, mats.cream, [-.85, 1.18, 1.58], [.89, .055, .04]);
  box(g, mats.shirt, [.83, .75, 1.53], [.68, 1.48, .07]); ball(g, mats.yellow, [.61, .78, 1.59], [.035, .035, .035]);
  const awning = box(g, flip ? mats.yellow : mats.blue, [0, 1.89, 1.95], [3.3, .08, 1.0]); awning.rotation.x = .13;
  for (let j = -2; j <= 2; j++) { const stripe = box(g, mats.cream, [j * .58, 1.90, 1.95], [.26, .085, 1.02]); stripe.rotation.x = .13; }
  cylinderBetween(g, mats.trunk, [-1.45, .05, 2.3], [-1.45, 1.8, 2.3], .04);
  cylinderBetween(g, mats.trunk, [1.45, .05, 2.3], [1.45, 1.8, 2.3], .04);
  box(g, mats.concrete, [0, .12, 2], [4.15, .24, 1.55]);
  for (const x of [-2.15, 2.15]) { mesh(g, new THREE.CylinderGeometry(.23, .17, .35, 10), mats.roof, x, .3, 1.8); ball(g, mats.leafLight, [x, .69, 1.8], [.42, .38, .42]); }
}
function sign(parent, x, z) {
  cylinderBetween(parent, mats.trunk, [x, .2, z], [x, 2.15, z], .045);
  box(parent, mats.shirt, [x, 1.92, z], [1.15, .42, .08]);
  const cv = document.createElement('canvas'); cv.width = 384; cv.height = 128;
  const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff1cf'; ctx.font = '600 48px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('海风湾  →', 192, 64);
  const texture = new THREE.CanvasTexture(cv); texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
  mesh(parent, new THREE.PlaneGeometry(1.02, .34), mat, x, 1.92, z + .047);
}
function streetlamp(parent, x, z) {
  cylinderBetween(parent, mats.shirt, [x, .22, z], [x, 3.6, z], .045);
  curveTube(parent, mats.shirt, [[x, 3.4, z], [x -.16, 3.85, z], [x -.70, 3.86, z], [x -.87, 3.57, z]], .042, 12);
  mesh(parent, new THREE.ConeGeometry(.22, .17, 12), mats.shirt, x -.87, 3.52, z);
  ball(parent, mats.lamp, [x -.87, 3.46, z], [.14, .045, .14]);
}
const tileSize = 64, tileCount = 7, tiles = [];
function coastTile() {
  const tile = new THREE.Group();
  box(tile, mats.road, [1, .08, 32], [7.8, .2, 64]);
  box(tile, mats.concrete, [-3.65, .15, 32], [1.5, .30, 64]);
  box(tile, mats.concrete, [5.65, .15, 32], [1.50, .30, 64]);
  box(tile, mats.sand, [-5.92, -.025, 32], [3.04, .13, 64]);
  for (const x of [-2.66, 4.67]) box(tile, mats.paint, [x, .186, 32], [.065, .008, 64]);
  for (let z = 1; z < 64; z += 6.4) box(tile, mats.paint, [1, .187, z + 1.6], [.105, .012, 2.9]);
  for (let z = 0; z < 64; z += 4) {
    box(tile, mats.cream, [-4.32, .56, z], [.10, .82, .10]);
    ball(tile, mats.cream, [-4.32, .99, z], [.07, .045, .07]);
  }
  box(tile, mats.cream, [-4.32, .82, 32], [.06, .06, 64]); box(tile, mats.cream, [-4.32, .50, 32], [.055, .055, 64]);
  palm(tile, 7.3, 8, 4.9, .8); palm(tile, 7.5, 43, 4.3, 2.3); palm(tile, -5.3, 40, 3.8, 1.7);
  house(tile, 19, mats.house, false); house(tile, 55, mats.housePink, true);
  umbrella(tile, -6.3, 12, mats['scarf']);
  umbrella(tile, -6.25, 52, mats.yellow);
  streetlamp(tile, 5.94, 4); streetlamp(tile, 5.94, 36);
  sign(tile, 6.8, 30);
  // A seaside bench and small, varied roadside planting.
  for (let i = 0; i < 3; i++) box(tile, mats.trunk, [-3.55 + i * .14, .63, 25], [.115, .065, 1.5]);
  for (let i = 0; i < 3; i++) box(tile, mats.trunk, [-3.88, .80 + i * .13, 25], [.075, .095, 1.5]);
  for (const z of [24.5, 25.5]) { box(tile, mats.shirt, [-3.7, .46, z], [.065, .37, .06]); box(tile, mats.shirt, [-3.39, .46, z], [.065, .37, .06]); }
  for (let j = 0; j < 17; j++) {
    const z = (j * 13.73 + 3) % 64, x = 7 + ((j * 2.31) % 7);
    ball(tile, j % 3 ? mats.grassLight : mats.leafLight, [x, .32, z], [.6 + (j % 3) * .16, .4, .55]);
  }
  for (let j = 0; j < 12; j++) {
    const z = (j * 17.1) % 64, x = -7.3 + (j % 3) * .14;
    const stone = mesh(tile, new THREE.IcosahedronGeometry(1, 0), mats.rock, x, .03, z); stone.scale.set(.13 + (j % 2) * .1, .12, .23); stone.rotation.y = j;
  }
  return tile;
}
const prototypeTile = coastTile();
batchStatic(prototypeTile);
for (let i = 0; i < tileCount; i++) { const tile = prototypeTile.clone(); scene.add(tile); tiles.push(tile); }

// Far out to sea: a lighthouse, quiet sails, and low islands.
const offshore = new THREE.Group(); scene.add(offshore);
function sailboat(x, z, size) {
  const g = new THREE.Group(); g.position.set(x, -.03, z); g.scale.setScalar(size); offshore.add(g);
  ball(g, mats.cream, [0, .13, 0], [.46, .22, 1.08]);
  cylinderBetween(g, mats.trunk, [0, .18, 0], [0, 2.15, 0], .025);
  const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(0, 1.72); shape.lineTo(1.05, .08); shape.closePath();
  const sail = mesh(g, new THREE.ShapeGeometry(shape), mats.cream, .04, .34, 0); sail.rotation.y = Math.PI / 2;
  const shape2 = new THREE.Shape(); shape2.moveTo(0, .05); shape2.lineTo(0, 1.38); shape2.lineTo(-.7, .05); shape2.closePath();
  const sail2 = mesh(g, new THREE.ShapeGeometry(shape2), mats.yellow, -.035, .36, 0); sail2.rotation.y = Math.PI / 2;
  g.rotation.y = .8;
}
mats.cream.side = THREE.DoubleSide; mats.yellow.side = THREE.DoubleSide;
sailboat(-29, 41, .95); sailboat(-72, -10, 1.5); sailboat(-56, 117, 1.3);
for (let i = 0; i < 5; i++) {
  const island = mesh(offshore, new THREE.IcosahedronGeometry(1, 1), mats.leafLight, -87 - (i % 2) * 40, 1, -135 + i * 84);
  island.scale.set(14 + i * 2, 3 + (i % 3) * 1.6, 9 + i * 1.3); island.rotation.y = i;
}
const lighthouse = new THREE.Group(); lighthouse.position.set(-42, 0, 87); offshore.add(lighthouse);
const islandRock = mesh(lighthouse, new THREE.IcosahedronGeometry(1, 1), mats.rock, 0, .18, 0); islandRock.scale.set(4.8, .86, 3.5);
mesh(lighthouse, new THREE.CylinderGeometry(.49, .78, 4.6, 20), mats.cream, 0, 2.82, 0);
mesh(lighthouse, new THREE.CylinderGeometry(.59, .62, .53, 20), mats['scarf'], 0, 3.12, 0);
mesh(lighthouse, new THREE.CylinderGeometry(.65, .65, .10, 20), mats.shirt, 0, 5.17, 0);
mesh(lighthouse, new THREE.CylinderGeometry(.46, .46, .69, 12), mats.glass, 0, 5.56, 0);
mesh(lighthouse, new THREE.ConeGeometry(.75, .41, 20), mats['scarf'], 0, 6.09, 0);
ball(lighthouse, mats.lamp, [0, 5.54, 0], [.3, .25, .3]);
batchStatic(offshore);

// The electric scooter uses an enclosed motor hub and a footboard.
const ride = new THREE.Group(); scene.add(ride); ride.position.set(-.9, .18, 0);
const scooter = new THREE.Group(); ride.add(scooter);
const wheelRadius = .44, wheels = [];
function makeWheel(parent, z) {
  const g = new THREE.Group(); g.position.set(0, .44, z); parent.add(g);
  const tire = mesh(g, new THREE.TorusGeometry(.35, .09, 12, 32), mats.rubber); tire.rotation.y = Math.PI / 2;
  const rim = mesh(g, new THREE.CylinderGeometry(.272, .272, .13, 24), mats.metal); rim.rotation.z = Math.PI / 2;
  for (const side of [-1, 1]) {
    const hub = mesh(g, new THREE.CylinderGeometry(.185, .185, .017, 24), mats.mintLight, side * .082, 0, 0); hub.rotation.z = Math.PI / 2;
    for (let j = 0; j < 5; j++) {
      const spoke = box(g, mats.cream, [side * .078, Math.cos(j * Math.PI * 2 / 5) * .207, Math.sin(j * Math.PI * 2 / 5) * .207], [.015, .09, .029]); spoke.rotation.x = j * Math.PI * 2 / 5;
    }
    const axle = mesh(g, new THREE.CylinderGeometry(.045, .045, .024, 12), mats.seat, side * .096, 0, 0); axle.rotation.z = Math.PI / 2;
  }
  // A small valve also makes the live rotation easy to see.
  box(g, mats.metal, [-.055, .30, 0], [.02, .042, .02]); wheels.push(g); return g;
}
const rearWheel = makeWheel(scooter, -.89);
const steering = new THREE.Group(); steering.position.z = .98; scooter.add(steering);
const frontWheel = makeWheel(steering, 0);
for (const z of [-.89, .98]) {
  const fender = mesh(scooter, new THREE.TorusGeometry(.49, .075, 8, 24, Math.PI), mats.mintLight, 0, .44, z); fender.rotation.y = Math.PI / 2;
}
ball(scooter, mats.mint, [0, .85, -.65], [.405, .34, .59]);
roundedBox(scooter, mats.mint, .60, .12, .94, .06, [0, .53, -.51]);
for (const x of [-.245, .245]) box(scooter, mats.rubber, [x, .629, -.02], [.12, .018, .69]);
ball(scooter, mats.seat, [0, 1.19, -.43], [.36, .12, .56]);
ball(scooter, mats.cream, [0, 1.14, -.44], [.345, .052, .545]);
curveTube(scooter, mats.metal, [[-.3, 1.16, -.96], [-.31, 1.23, -1.13], [0, 1.27, -1.16], [.31, 1.23, -1.13], [.3, 1.16, -.96]], .022);
const shieldShape = new THREE.Shape();
shieldShape.moveTo(-.33, .52); shieldShape.quadraticCurveTo(-.45, .76, -.28, 1.31); shieldShape.quadraticCurveTo(-.26, 1.49, 0, 1.49); shieldShape.quadraticCurveTo(.26, 1.49, .28, 1.31); shieldShape.quadraticCurveTo(.45, .76, .33, .52); shieldShape.closePath();
const shield = mesh(scooter, new THREE.ExtrudeGeometry(shieldShape, { depth: .13, bevelEnabled: true, bevelSize: .045, bevelThickness: .045, bevelSegments: 3, curveSegments: 16 }), mats.mint, 0, 0, .58); shield.rotation.x = -.16;
const inner = ball(scooter, mats.cream, [0, .99, .478], [.27, .38, .06]); inner.rotation.x = -.15;
curveTube(scooter, mats.mintLight, [[0, .77, .67], [0, 1.08, .58], [0, 1.40, .43]], .018);
for (const x of [-.13, .13]) cylinderBetween(scooter, mats.metal, [x, .43, .98], [x, 1.30, .62], .038);
cylinderBetween(scooter, mats.mint, [0, 1.08, .61], [0, 1.59, .60], .075, .085, 16);
const handlebars = new THREE.Group(); handlebars.position.set(0, 1.60, .59); scooter.add(handlebars);
curveTube(handlebars, mats.metal, [[-.49, 0, -.045], [-.26, .04, .045], [0, .035, .055], [.26, .04, .045], [.49, 0, -.045]], .025);
for (const x of [-.46, .46]) { const grip = mesh(handlebars, new THREE.CylinderGeometry(.038, .038, .17, 12), mats.seat, x, 0, -.045); grip.rotation.z = Math.PI / 2; }
ball(handlebars, mats.mint, [0, .04, .088], [.19, .15, .17]);
const headlight = mesh(handlebars, new THREE.CylinderGeometry(.112, .112, .042, 24), mats.lamp, 0, .036, .244); headlight.rotation.x = Math.PI / 2;
const lightRing = mesh(handlebars, new THREE.TorusGeometry(.12, .015, 8, 24), mats.metal, 0, .036, .268);
for (const x of [-.29, .29]) ball(handlebars, mats.yellow, [x, -.028, .105], [.042, .035, .055]);
for (const side of [-1, 1]) {
  cylinderBetween(scooter, mats.metal, [side * .39, 1.6, .55], [side * .56, 1.91, .58], .014);
  ball(scooter, mats.mint, [side * .57, 1.95, .58], [.125, .088, .04]);
  ball(scooter, mats.metal, [side * .57, 1.95, .539], [.103, .065, .007]);
  ball(scooter, mats.cream, [side * .383, .84, -.68], [.035, .15, .35]);
  const bolt = new THREE.Shape(); bolt.moveTo(.02, .09); bolt.lineTo(-.075, -.008); bolt.lineTo(-.015, -.008); bolt.lineTo(-.042, -.10); bolt.lineTo(.075, .028); bolt.lineTo(.02, .028); bolt.closePath();
  const emblem = mesh(scooter, new THREE.ShapeGeometry(bolt), mats.shirt, side * .423, .85, -.66); emblem.rotation.y = side * Math.PI / 2;
}
ball(scooter, mats['scarf'], [0, .86, -1.22], [.12, .048, .022]);
roundedBox(scooter, mats.cream, .22, .105, .013, .015, [0, .65, -1.19]);
cylinderBetween(scooter, mats.metal, [-.2, .46, -.87], [-.2, .89, -.6], .024);

// Orange tabby: ears, muzzle, whiskers, blinking eyes, and a windblown scarf.
const cat = new THREE.Group(); ride.add(cat);
ball(cat, mats.shirt, [0, 1.51, -.37], [.30, .36, .26]);
ball(cat, mats.cream, [0, 1.46, -.126], [.185, .24, .028]);
ball(cat, mats.fur, [0, 1.27, -.48], [.275, .18, .28]);
for (const side of [-1, 1]) {
  const hip = [side * .17, 1.27, -.48], knee = [side * .31, .97, -.15], ankle = [side * .27, .72, .17];
  cylinderBetween(cat, mats.fur, hip, knee, .112, .13, 14); ball(cat, mats.furLight, knee, [.117, .12, .13]);
  cylinderBetween(cat, mats.furLight, knee, ankle, .081, .099, 14);
  ball(cat, mats.cream, [side * .27, .695, .24], [.10, .065, .17]);
  for (let j = 0; j < 2; j++) ball(cat, mats.tabby, [side * .363, 1.01 + j * .065, -.175 - j * .06], [.008, .028, .078]);
  const shoulder = [side * .245, 1.70, -.33], elbow = [side * .37, 1.49, .07], hand = [side * .46, 1.61, .546];
  cylinderBetween(cat, mats.shirt, shoulder, [side * .30, 1.62, -.14], .097, .105, 14);
  cylinderBetween(cat, mats.fur, [side * .30, 1.62, -.14], elbow, .068, .085, 14);
  ball(cat, mats.furLight, elbow, [.079, .078, .08]); cylinderBetween(cat, mats.furLight, elbow, hand, .061, .075, 14);
  ball(cat, mats.cream, hand, [.094, .064, .091]);
}
const tail = new THREE.Group(); tail.position.set(0, 1.25, -.75); cat.add(tail);
const tailPath = [[0, .02, 0], [-.17, .01, -.20], [-.43, .16, -.33], [-.48, .42, -.31], [-.32, .59, -.31], [-.16, .57, -.33]];
curveTube(tail, mats.furLight, tailPath, .064, 30); ball(tail, mats.cream, [-.16, .57, -.33], [.073, .068, .073]);
for (const t of [.36, .58, .76]) {
  const path = new THREE.CatmullRomCurve3(tailPath.map(p => V(...p)));
  const a = path.getPoint(t), b = path.getPoint(t + .036);
  cylinderBetween(tail, mats.tabby, a.toArray(), b.toArray(), .066, .066, 10);
}
const head = new THREE.Group(); head.position.set(0, 2.13, -.29); cat.add(head);
ball(head, mats.furLight, [0, 0, 0], [.445, .43, .385]);
for (const side of [-1, 1]) {
  const ear = new THREE.Shape(); ear.moveTo(-.145, 0); ear.quadraticCurveTo(-.13, .18, -.08, .40); ear.quadraticCurveTo(-.02, .48, .015, .41); ear.lineTo(.15, 0); ear.closePath();
  const e = mesh(head, new THREE.ExtrudeGeometry(ear, { depth: .095, bevelEnabled: true, bevelSegments: 2, bevelSize: .015, bevelThickness: .015 }), mats.fur, side * .29, .27, -.038); e.rotation.z = -side * .20;
  const innerEar = new THREE.Shape(); innerEar.moveTo(-.09, .04); innerEar.lineTo(-.053, .31); innerEar.lineTo(.085, .04); innerEar.closePath();
  const ie = mesh(head, new THREE.ShapeGeometry(innerEar), mats.pink, side * .29, .27, .076); ie.rotation.z = -side * .20;
  ball(head, mats.cream, [side * .098, -.118, .35], [.12, .105, .099]);
  ball(head, mats.pink, [side * .269, -.088, .294], [.066, .031, .014]);
  for (let j = 0; j < 3; j++) {
    curveTube(head, mats.seat, [[side * .26, -.10 - j * .039, .336], [side * .42, -.07 - j * .045, .36], [side * .57, -.04 - j * .063, .35]], .006, 8);
  }
  for (let j = 0; j < 2; j++) ball(head, mats.tabby, [side * (.33 + j * .035), .012 - j * .10, .20], [.019, .040, .07]);
}
const eyes = [];
for (const side of [-1, 1]) {
  const eye = new THREE.Group(); eye.position.set(side * .163, .055, .349); head.add(eye); eyes.push(eye);
  ball(eye, mats.cream, [0, 0, 0], [.071, .087, .030]); ball(eye, mats.ink, [side * .008, -.003, .024], [.041, .060, .018]);
  const shine = mesh(eye, sphereGeo, new THREE.MeshBasicMaterial({ color: '#fffdf0' }), -.012, .022, .040); shine.scale.set(.014, .016, .006);
  curveTube(head, mats.tabby, [[side * .22, .165, .31], [side * .164, .186, .337], [side * .114, .17, .337]], .012, 8);
}
const nose = new THREE.Shape(); nose.moveTo(-.057, .016); nose.quadraticCurveTo(0, .033, .057, .016); nose.lineTo(0, -.041); nose.closePath();
mesh(head, new THREE.ShapeGeometry(nose), mats.pink, 0, -.09, .454);
curveTube(head, mats.seat, [[0, -.126, .449], [0, -.16, .434], [-.057, -.18, .419]], .007, 10);
curveTube(head, mats.seat, [[0, -.16, .435], [.033, -.18, .429], [.06, -.17, .419]], .007, 10);
for (const x of [-.115, 0, .115]) {
  const stripe = ball(head, mats.tabby, [x, .265, .285], [.027, .073, .012]); stripe.rotation.z = -x * 2;
}
const helmet = mesh(head, new THREE.SphereGeometry(.472, 32, 20, 0, Math.PI * 2, 0, 1.65), mats.mint, 0, .185, -.025); helmet.scale.z = .96;
const helmetRim = mesh(head, new THREE.TorusGeometry(.470, .023, 8, 40), mats.cream, 0, .148, -.025); helmetRim.rotation.x = Math.PI / 2; helmetRim.scale.y = .96;
curveTube(head, mats.cream, Array.from({ length: 17 }, (_, i) => { const a = i / 16 * Math.PI; return [0, .185 + Math.sin(a) * .478, -.025 + Math.cos(a) * .459]; }), .022, 25);
for (const side of [-1, 1]) curveTube(head, mats.seat, [[side * .386, .05, 0], [side * .31, -.27, .03], [side * .10, -.39, .14]], .013, 12);
ball(cat, mats['scarf'], [0, 1.79, -.27], [.315, .075, .262]);
ball(cat, mats['scarf'], [-.25, 1.78, -.45], [.095, .086, .084]);
const scarfSegments = 16, scarfGeo = new THREE.BufferGeometry();
const scarfPositions = new Float32Array((scarfSegments + 1) * 2 * 3), scarfUV = [], scarfIndices = [];
for (let i = 0; i <= scarfSegments; i++) { scarfUV.push(0, i / scarfSegments, 1, i / scarfSegments); if (i < scarfSegments) { const n = i * 2; scarfIndices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); } }
scarfGeo.setAttribute('position', new THREE.BufferAttribute(scarfPositions, 3)); scarfGeo.setAttribute('uv', new THREE.Float32BufferAttribute(scarfUV, 2)); scarfGeo.setIndex(scarfIndices);
mats['scarf'].side = THREE.DoubleSide;
const scarf = mesh(cat, scarfGeo, mats['scarf']); scarf.frustumCulled = false;
function animateCat(t, speed) {
  head.rotation.z = Math.sin(t * 1.7) * .023; head.rotation.y = Math.sin(t * .62) * .035;
  tail.rotation.z = Math.sin(t * 1.7) * .08; tail.rotation.y = Math.sin(t * 1.15) * .10;
  const blinkPhase = t % 4.7, blink = blinkPhase > 4.48 ? Math.max(.06, Math.abs((blinkPhase - 4.59) / .11)) : 1;
  eyes.forEach(e => e.scale.y = Math.min(1, blink));
  for (let i = 0; i <= scarfSegments; i++) {
    const q = i / scarfSegments, centerX = -.27 - q * .11 + Math.sin(t * 4.8 - q * 7) * .055 * q;
    const y = 1.78 + Math.sin(t * 5.0 - q * 9) * .065 * q + q * .07;
    const z = -.46 - q * (.51 + speed / 60), width = .105 * (1 - q * .45);
    for (let side = 0; side < 2; side++) { const at = (i * 2 + side) * 3; scarfPositions[at] = centerX + (side ? width : -width); scarfPositions[at + 1] = y + (side ? .024 : -.024); scarfPositions[at + 2] = z; }
  }
  scarfGeo.attributes.position.needsUpdate = true; scarfGeo.computeVertexNormals();
}

// A soft contact shadow complements the real sunlight shadows.
const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
const sc = shadowCanvas.getContext('2d'), gradient = sc.createRadialGradient(64, 64, 6, 64, 64, 62);
gradient.addColorStop(0, '#253e4280'); gradient.addColorStop(1, '#253e4200'); sc.fillStyle = gradient; sc.fillRect(0, 0, 128, 128);
const shadow = mesh(ride, new THREE.PlaneGeometry(1.9, 3.25), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }), 0, .011, 0);
shadow.rotation.x = -Math.PI / 2; shadow.castShadow = false;

const birds = [];
function wingGeometry(side) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, side * .50, .02, -.19, side * .83, -.05, -.33, side * .47, -.025, .02], 3)); g.setIndex([0, 1, 3, 1, 2, 3]); g.computeVertexNormals(); return g;
}
for (let i = 0; i < 6; i++) {
  const g = new THREE.Group(); scene.add(g);
  const left = mesh(g, wingGeometry(-1), mats.cream), right = mesh(g, wingGeometry(1), mats.cream);
  ball(g, mats.cream, [0, -.016, .045], [.065, .09, .20]); ball(g, mats.yellow, [0, .018, .258], [.026, .022, .08]);
  g.scale.setScalar(.50 + (i % 3) * .17); birds.push({ group: g, left, right, i });
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { paused: reducedMotion, speed: 24, path: 0, distance: 0, time: 0, frames: 0, view: 'follow', ready: false, sound: false };
const presets = { follow: { yaw: .79, elevation: .30, radius: 8.3 }, side: { yaw: 1.54, elevation: .32, radius: 8.2 }, wide: { yaw: .86, elevation: .55, radius: 19.5 } };
let desired = { ...presets.follow }, current = { ...desired };
function setView(view) {
  state.view = view; desired = { ...presets[view] };
  document.querySelectorAll('button[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
}
function syncPlayButton() {
  $('play').setAttribute('aria-pressed', String(state.paused));
  $('play').setAttribute('aria-label', state.paused ? '继续骑行' : '暂停骑行');
  $('play-label').textContent = state.paused ? '继续骑行' : '暂停骑行';
  $('play-icon').innerHTML = state.paused ? '<path d="m4 2 10 6-10 6z"/>' : '<path d="M3 2h3v12H3zm7 0h3v12h-3z"/>';
}
function togglePlay() { state.paused = !state.paused; syncPlayButton(); }
$('play').addEventListener('click', togglePlay); syncPlayButton();
document.querySelectorAll('button[data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
$('speed').addEventListener('input', e => { state.speed = Number(e.target.value); $('speed-value').innerHTML = `${state.speed} <span>km/h</span>`; });
addEventListener('keydown', e => {
  if (e.target.matches('input,button,select,textarea')) return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.code === 'KeyR') { setView('follow'); toast('镜头已回到小猫身边'); }
  if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) setView(['follow', 'side', 'wide'][Number(e.key) - 1]);
});
let toastTimer;
function toast(text) { $('toast').textContent = text; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2300); }

// Pointer controls remain active while the riding animation is paused.
const pointers = new Map(); let lastPinch = 0;
const canvas = renderer.domElement;
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); lastPinch = 0; });
canvas.addEventListener('pointermove', e => {
  const previous = pointers.get(e.pointerId); if (!previous) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) { desired.yaw -= (e.clientX - previous.x) * .006; desired.elevation = clamp(desired.elevation + (e.clientY - previous.y) * .004, .14, 1.18); }
  else {
    const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (lastPinch > 0) desired.radius = clamp(desired.radius * lastPinch / d, 6.0, 31);
    lastPinch = d;
  }
});
function endPointer(e) { pointers.delete(e.pointerId); lastPinch = 0; }
canvas.addEventListener('pointerup', endPointer); canvas.addEventListener('pointercancel', endPointer); canvas.addEventListener('lostpointercapture', endPointer);
canvas.addEventListener('wheel', e => { e.preventDefault(); desired.radius = clamp(desired.radius * Math.exp(e.deltaY * .001), 6.0, 31); }, { passive: false });
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 650 ? 1.5 : 1.75)); renderer.setSize(innerWidth, innerHeight); });

let audio;
function createAudio() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate), data = buffer.getChannelData(0);
  let last = 0; for (let i = 0; i < data.length; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; data[i] = last * 3.5; }
  const noise = context.createBufferSource(); noise.buffer = buffer; noise.loop = true;
  const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 800;
  const waveGain = context.createGain(); waveGain.gain.value = .14; noise.connect(filter).connect(waveGain).connect(context.destination); noise.start();
  const motor = context.createOscillator(); motor.type = 'sine'; motor.frequency.value = 85;
  const motorGain = context.createGain(); motorGain.gain.value = .004; motor.connect(motorGain).connect(context.destination); motor.start();
  return { context, waveGain, motor, motorGain };
}
$('sound').addEventListener('click', async () => {
  try {
    if (!audio) audio = createAudio(); state.sound = !state.sound;
    if (state.sound) await audio.context.resume(); else await audio.context.suspend();
    $('sound').setAttribute('aria-pressed', String(state.sound)); $('sound').setAttribute('aria-label', state.sound ? '关闭海浪声音' : '开启海浪声音');
    $('sound-waves').setAttribute('d', state.sound ? 'M16 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14' : 'm16 9 5 6m0-6-5 6');
    toast(state.sound ? '听，海风和浪花' : '海浪声音已关闭');
  } catch { state.sound = false; toast('这个浏览器暂时无法播放声音'); }
});
let lastFrame = performance.now(), hidden = document.hidden;
document.addEventListener('visibilitychange', () => { hidden = document.hidden; lastFrame = performance.now(); if (audio && state.sound) { if (hidden) audio.context.suspend(); else audio.context.resume(); } });
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); document.documentElement.dataset.contextLost = 'true'; toast('正在恢复 3D 画面…'); });
canvas.addEventListener('webglcontextrestored', () => { delete document.documentElement.dataset.contextLost; toast('画面已恢复'); });
const offset = V(), aim = V(), previousPosition = V();
function updateCamera(dt) {
  const factor = 1 - Math.exp(-dt * 6);
  for (const key of ['yaw', 'elevation', 'radius']) current[key] += (desired[key] - current[key]) * factor;
  const radius = current.radius * (innerWidth < 650 && state.view === 'wide' ? 1.12 : 1);
  offset.set(Math.sin(current.yaw) * Math.cos(current.elevation) * radius, Math.sin(current.elevation) * radius, Math.cos(current.yaw) * Math.cos(current.elevation) * radius);
  const bias = innerWidth < 650 ? 0 : state.view === 'wide' ? .35 : .80;
  aim.copy(ride.position).add(V(-Math.cos(current.yaw) * bias, innerWidth < 650 ? 1.40 : 1.25, Math.sin(current.yaw) * bias));
  camera.position.copy(aim).add(offset); camera.lookAt(aim);
}
function render(now) {
  requestAnimationFrame(render);
  const dt = Math.min(.05, Math.max(0, (now - lastFrame) / 1000)); lastFrame = now;
  if (hidden) return;
  if (!state.paused) {
    state.time += dt;
    previousPosition.copy(ride.position);
    const derivative = .012 * Math.cos(state.path * .12), v = state.speed / 3.6;
    state.path += dt * v / Math.sqrt(1 + derivative * derivative);
    ride.position.x = -.9 + .10 * Math.sin(state.path * .12); ride.position.z = state.path;
    state.distance += previousPosition.distanceTo(ride.position);
  }
  const derivative = .012 * Math.cos(state.path * .12), curvature = -.00144 * Math.sin(state.path * .12) / Math.pow(1 + derivative * derivative, 1.5);
  ride.rotation.y = Math.atan(derivative); steering.rotation.y = Math.atan(1.87 * curvature); handlebars.rotation.y = steering.rotation.y;
  rearWheel.rotation.x = state.distance / wheelRadius; frontWheel.rotation.x = state.distance / wheelRadius;
  animateCat(state.time, state.speed);
  const base = Math.floor(state.path / tileSize);
  tiles.forEach((tile, i) => tile.position.z = (base + i - 3) * tileSize);
  ocean.position.z = state.path; land.position.z = state.path; sky.position.copy(ride.position);
  sun.position.z = state.path + 168; seaUniforms.uTime.value = state.time; seaUniforms.uTravel.value = -state.path;
  offshore.position.z = Math.floor((state.path + 100) / 420) * 420;
  sunlight.position.copy(ride.position).add(V(-26, 47, 22)); sunlight.target.position.copy(ride.position);
  birds.forEach(({ group, left, right, i }) => {
    const a = state.time * .11 + i * 1.04;
    group.position.set(-13 - i * 2.6 + Math.cos(a) * 5, 6.3 + Math.sin(a * 1.8) * .85 + i * .44, state.path + 4 + Math.sin(a) * 18 + i * 3);
    group.rotation.y = .35 + Math.sin(a) * .35;
    left.rotation.z = Math.sin(state.time * 2.8 + i * 1.5) * .28; right.rotation.z = -left.rotation.z;
  });
  if (audio && state.sound) {
    const clock = audio.context.currentTime;
    audio.waveGain.gain.setTargetAtTime(.13 + Math.sin(state.time * .6) * .035, clock, .2);
    audio.motor.frequency.setTargetAtTime(50 + state.speed * 1.2, clock, .1);
    audio.motorGain.gain.setTargetAtTime(state.paused ? 0 : .0045, clock, .1);
  }
  updateCamera(dt); renderer.render(scene, camera); state.frames++;
  if (state.frames % 12 === 0) {
    $('distance').textContent = (state.distance / 1000).toFixed(2);
    const data = document.documentElement.dataset; data.distance = state.distance.toFixed(6); data.wheelAngle = rearWheel.rotation.x.toFixed(6); data.simTime = state.time.toFixed(6); data.paused = String(state.paused); data.speed = String(state.speed); data.view = state.view; data.frames = String(state.frames);
  }
  if (!state.ready) { state.ready = true; document.documentElement.dataset.ready = 'true'; loading.classList.add('hide'); setTimeout(() => loading.remove(), 600); }
}
// Read-only observations used to verify the delivered animation.
window.__coastSnapshot = () => ({ ...state, wheelRadius, rearAngle: rearWheel.rotation.x, frontAngle: frontWheel.rotation.x, position: ride.position.toArray(), heading: ride.rotation.y, camera: camera.position.toArray(), drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, yaw: current.yaw, radius: current.radius, scarfTip: [scarfPositions[scarfPositions.length - 3], scarfPositions[scarfPositions.length - 2], scarfPositions[scarfPositions.length - 1]], eyeScale: eyes[0].scale.y, webgl: renderer.getContext().getParameter(renderer.getContext().VERSION) });
animateCat(0, state.speed); updateCamera(1);
requestAnimationFrame(render);
