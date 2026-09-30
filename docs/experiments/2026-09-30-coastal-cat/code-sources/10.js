import * as THREE from 'three';

const sceneHost = document.querySelector('#scene');
const loading = document.querySelector('#loading');
const errorPanel = document.querySelector('#errorPanel');
const pauseButton = document.querySelector('#pauseButton');
const pauseLabel = document.querySelector('#pauseLabel');
const speedRange = document.querySelector('#speedRange');
const speedValue = document.querySelector('#speedValue');
const viewButton = document.querySelector('#viewButton');
const viewLabel = document.querySelector('#viewLabel');
const hint = document.querySelector('#hint');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = {
  playing: !reducedMotion,
  speedKmh: 24,
  distance: 10,
  cameraMode: 0,
  dragYaw: 0,
  dragPitch: 0,
  zoom: 1,
};

const palette = {
  skyTop: 0x68cadc,
  skyLow: 0xdff5df,
  seaDeep: 0x147f9d,
  seaLight: 0x42ced0,
  ink: 0x113d4c,
  road: 0x495961,
  roadSide: 0xe9e1c4,
  grass: 0x78a85a,
  grassLight: 0xa3c973,
  sand: 0xeecf8e,
  cliff: 0xba7555,
  coral: 0xf06d52,
  mint: 0x6fd3b6,
  mintDark: 0x2d8f82,
  orange: 0xe9913d,
  orangeDark: 0xb85b2a,
  cream: 0xffe2ad,
};

let renderer;
let camera;
let oceanMaterial;
let roadCurve;
let pathLength;
let rideRig;
let scooterVisual;
let rearWheel;
let frontWheel;
let frontAssembly;
let catHead;
let catBody;
let tailSegments = [];
let scarfTails = [];
let eyes = [];
let gulls = [];
let clouds = [];
let cameraTarget = new THREE.Vector3();
let firstFrame = true;

const mat = (color, roughness = .78, metalness = .02) => new THREE.MeshStandardMaterial({
  color,
  roughness,
  metalness,
  flatShading: true,
});

const materials = {
  road: mat(palette.road, .95),
  white: mat(0xf8f5e9, .82),
  yellow: mat(0xffd66b, .72),
  dark: mat(palette.ink, .72),
  tire: mat(0x17272d, .92),
  metal: mat(0xc5d4d3, .34, .7),
  mint: mat(palette.mint, .55, .08),
  mintDark: mat(palette.mintDark, .65),
  coral: mat(palette.coral, .68),
  orange: mat(palette.orange, .8),
  orangeDark: mat(palette.orangeDark, .82),
  cream: mat(palette.cream, .82),
  pink: mat(0xef8f8b, .75),
  green: mat(palette.grass, .92),
  greenLight: mat(palette.grassLight, .92),
  sand: mat(palette.sand, .96),
  cliff: mat(palette.cliff, .96),
  trunk: mat(0x9b613c, .93),
  leaf: mat(0x2f7f64, .9),
  red: mat(0xe95548, .66),
};

function shadow(mesh, cast = true, receive = true) {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function mesh(geometry, material, cast = true, receive = true) {
  return shadow(new THREE.Mesh(geometry, material), cast, receive);
}

function cylinderBetween(a, b, radius, material, radial = 8) {
  const start = a.clone();
  const end = b.clone();
  const delta = end.clone().sub(start);
  const item = mesh(new THREE.CylinderGeometry(radius, radius * .92, delta.length(), radial), material);
  item.position.copy(start).add(end).multiplyScalar(.5);
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  return item;
}

function createSky() {
  const geometry = new THREE.SphereGeometry(260, 32, 16);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color(palette.skyTop) },
      bottomColor: { value: new THREE.Color(palette.skyLow) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y * 0.5 + 0.5;
        vec3 c = mix(bottomColor, topColor, smoothstep(0.1, 0.86, h));
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
  scene.add(new THREE.Mesh(geometry, material));

  const sun = mesh(new THREE.SphereGeometry(7.5, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffe6a0 }), false, false);
  sun.position.set(-72, 58, -110);
  scene.add(sun);

  const halo = mesh(new THREE.SphereGeometry(11, 20, 12), new THREE.MeshBasicMaterial({
    color: 0xffdd8a,
    transparent: true,
    opacity: .16,
    depthWrite: false,
  }), false, false);
  halo.position.copy(sun.position);
  scene.add(halo);
}

function createOcean() {
  const geometry = new THREE.PlaneGeometry(520, 520, 90, 90);
  oceanMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      deep: { value: new THREE.Color(palette.seaDeep) },
      light: { value: new THREE.Color(palette.seaLight) },
      sunColor: { value: new THREE.Color(0xffe5a4) },
    },
    vertexShader: `
      uniform float uTime;
      varying float vWave;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float w1 = sin(p.x * .09 + uTime * .85) * .22;
        float w2 = sin(p.y * .135 - uTime * 1.12) * .16;
        float w3 = sin((p.x + p.y) * .055 + uTime * .55) * .12;
        p.z += w1 + w2 + w3;
        vWave = p.z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 deep;
      uniform vec3 light;
      uniform vec3 sunColor;
      uniform float uTime;
      varying float vWave;
      varying vec2 vUv;
      void main() {
        float band = .5 + .5 * sin(vUv.y * 210.0 + vUv.x * 35.0 + uTime * .6);
        float glint = smoothstep(.94, 1.0, band) * smoothstep(.1, .72, vUv.y);
        vec3 color = mix(deep, light, clamp(vWave * 1.25 + .5, 0.0, 1.0));
        color = mix(color, sunColor, glint * .2);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const ocean = new THREE.Mesh(geometry, oceanMaterial);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -2.25;
  ocean.receiveShadow = true;
  scene.add(ocean);
}

function createIsland() {
  const cliff = mesh(new THREE.CylinderGeometry(72, 77, 3.2, 64), materials.cliff, false, true);
  cliff.scale.set(1.12, 1, .76);
  cliff.position.y = -1.55;
  scene.add(cliff);

  const sand = mesh(new THREE.CylinderGeometry(70.8, 73, .8, 64), materials.sand, false, true);
  sand.scale.set(1.12, 1, .76);
  sand.position.y = -.23;
  scene.add(sand);

  const grass = mesh(new THREE.CylinderGeometry(62.5, 64, .75, 64), materials.green, false, true);
  grass.scale.set(1.12, 1, .74);
  grass.position.y = .12;
  scene.add(grass);

  const foam = mesh(new THREE.TorusGeometry(1, .022, 4, 160), new THREE.MeshBasicMaterial({
    color: 0xf4ffff,
    transparent: true,
    opacity: .75,
  }), false, false);
  foam.scale.set(78, 55, 1);
  foam.rotation.x = Math.PI / 2;
  foam.position.y = -1.8;
  scene.add(foam);
}

function createRoadRibbon(curve, width, material, y, offset = 0) {
  const segments = 420;
  const positions = [];
  const indices = [];
  for (let i = 0; i <= segments; i++) {
    const u = (i % segments) / segments;
    const p = curve.getPointAt(u);
    const t = curve.getTangentAt(u).normalize();
    const n = new THREE.Vector3(t.z, 0, -t.x).normalize();
    const center = p.clone().addScaledVector(n, offset);
    const left = center.clone().addScaledVector(n, width / 2);
    const right = center.clone().addScaledVector(n, -width / 2);
    positions.push(left.x, y, left.z, right.x, y, right.z);
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const ribbon = mesh(geometry, material, false, true);
  scene.add(ribbon);
  return ribbon;
}

function createRoad() {
  const points = [
    new THREE.Vector3(-33, 0, 35),
    new THREE.Vector3(8, 0, 39),
    new THREE.Vector3(47, 0, 24),
    new THREE.Vector3(58, 0, -4),
    new THREE.Vector3(39, 0, -31),
    new THREE.Vector3(2, 0, -40),
    new THREE.Vector3(-40, 0, -31),
    new THREE.Vector3(-57, 0, -4),
    new THREE.Vector3(-51, 0, 24),
  ];
  roadCurve = new THREE.CatmullRomCurve3(points, true, 'centripetal', .45);
  pathLength = roadCurve.getLength();

  createRoadRibbon(roadCurve, 9.4, materials.roadSide, .56);
  createRoadRibbon(roadCurve, 8.2, materials.road, .59);
  createRoadRibbon(roadCurve, .13, materials.white, .625, 3.63);
  createRoadRibbon(roadCurve, .13, materials.white, .625, -3.63);

  for (let i = 0; i < 72; i += 2) {
    const u = i / 72;
    const p = roadCurve.getPointAt(u);
    const t = roadCurve.getTangentAt(u).normalize();
    const dash = mesh(new THREE.BoxGeometry(.16, .045, 2.35), materials.yellow, false, true);
    dash.position.set(p.x, .655, p.z);
    dash.rotation.y = Math.atan2(t.x, t.z);
    scene.add(dash);
  }
}

function createPalm(scale = 1) {
  const group = new THREE.Group();
  const trunkPoints = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(.12, 1.6 * scale, 0),
    new THREE.Vector3(-.08, 3.2 * scale, .08),
    new THREE.Vector3(.18, 4.7 * scale, 0),
  ];
  for (let i = 0; i < trunkPoints.length - 1; i++) {
    group.add(cylinderBetween(trunkPoints[i], trunkPoints[i + 1], (.19 - i * .025) * scale, materials.trunk, 7));
  }
  const crown = new THREE.Vector3(.18, 4.75 * scale, 0);
  for (let i = 0; i < 7; i++) {
    const angle = i / 7 * Math.PI * 2;
    const leaf = mesh(new THREE.ConeGeometry(.34 * scale, 3.1 * scale, 5), i % 2 ? materials.greenLight : materials.leaf);
    leaf.position.copy(crown).add(new THREE.Vector3(Math.cos(angle) * 1.25 * scale, -.2 * scale, Math.sin(angle) * 1.25 * scale));
    leaf.rotation.z = Math.PI / 2 + .2;
    leaf.rotation.y = -angle;
    group.add(leaf);
  }
  const coconuts = mesh(new THREE.IcosahedronGeometry(.28 * scale, 1), materials.trunk);
  coconuts.position.copy(crown).add(new THREE.Vector3(.15, -.3, .08));
  group.add(coconuts);
  return group;
}

function createBush(scale = 1) {
  const group = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const b = mesh(new THREE.IcosahedronGeometry((.7 + i * .08) * scale, 1), i % 2 ? materials.greenLight : materials.green);
    b.position.set((i - 1.5) * .45 * scale, (i % 2) * .22 * scale, (i % 3 - 1) * .32 * scale);
    group.add(b);
  }
  return group;
}

function scatterIslandLife() {
  const palmUs = [.03, .12, .23, .35, .48, .61, .73, .84, .93];
  palmUs.forEach((u, i) => {
    const p = roadCurve.getPointAt(u);
    const t = roadCurve.getTangentAt(u).normalize();
    const n = new THREE.Vector3(t.z, 0, -t.x).normalize();
    const palm = createPalm(.72 + (i % 3) * .12);
    palm.position.copy(p).addScaledVector(n, -7.2 - (i % 2) * 3.1);
    palm.position.y = .48;
    palm.rotation.y = i * 1.7;
    scene.add(palm);
  });

  for (let i = 0; i < 24; i++) {
    const u = (i * .041 + .018) % 1;
    const p = roadCurve.getPointAt(u);
    const t = roadCurve.getTangentAt(u).normalize();
    const n = new THREE.Vector3(t.z, 0, -t.x).normalize();
    const bush = createBush(.45 + (i % 4) * .08);
    bush.position.copy(p).addScaledVector(n, -6.6 - (i % 3) * 1.8);
    bush.position.y = .58;
    scene.add(bush);
  }

  for (let i = 0; i < 16; i++) {
    const angle = i / 16 * Math.PI * 2;
    const rock = mesh(new THREE.DodecahedronGeometry(1.1 + (i % 3) * .35, 0), i % 2 ? materials.sand : materials.cliff);
    rock.scale.y = .55;
    rock.position.set(Math.cos(angle) * (70 + (i % 2) * 3), -1.2, Math.sin(angle) * (48 + (i % 3)));
    rock.rotation.set(i * .4, i * .77, i * .21);
    scene.add(rock);
  }
}

function createLighthouse() {
  const group = new THREE.Group();
  const base = mesh(new THREE.CylinderGeometry(2.3, 2.8, 1.2, 10), materials.cliff);
  base.position.y = -1.0;
  group.add(base);
  const tower = mesh(new THREE.CylinderGeometry(.75, 1.15, 7.2, 12), materials.white);
  tower.position.y = 3.15;
  group.add(tower);
  const stripe = mesh(new THREE.CylinderGeometry(.91, .97, 1.25, 12), materials.coral);
  stripe.position.y = 3.0;
  group.add(stripe);
  const cap = mesh(new THREE.ConeGeometry(1.18, 1.15, 12), materials.coral);
  cap.position.y = 7.25;
  group.add(cap);
  const lamp = mesh(new THREE.CylinderGeometry(.7, .7, 1.1, 12), new THREE.MeshStandardMaterial({
    color: 0xffe7a0,
    emissive: 0xffcf62,
    emissiveIntensity: 1.4,
    transparent: true,
    opacity: .92,
  }));
  lamp.position.y = 6.45;
  group.add(lamp);
  group.position.set(-78, -.8, 8);
  scene.add(group);
}

function createCloud(x, y, z, scale, speed) {
  const group = new THREE.Group();
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .76, depthWrite: false });
  [[0,0,0,2.2],[2.1,.2,0,1.65],[-2,.05,0,1.5],[.5,.75,0,1.55]].forEach(([px,py,pz,s]) => {
    const puff = mesh(new THREE.IcosahedronGeometry(s, 1), cloudMat, false, false);
    puff.position.set(px, py, pz);
    group.add(puff);
  });
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  group.userData.speed = speed;
  scene.add(group);
  clouds.push(group);
}

function createGull(x, y, z, phase) {
  const group = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(.12, .45, 2, 6), materials.white, false, false);
  body.rotation.x = Math.PI / 2;
  group.add(body);
  const wingGeo = new THREE.ConeGeometry(.09, 1.2, 4);
  const left = mesh(wingGeo, materials.white, false, false);
  left.position.x = -.55;
  left.rotation.z = -Math.PI / 2;
  const right = mesh(wingGeo, materials.white, false, false);
  right.position.x = .55;
  right.rotation.z = Math.PI / 2;
  group.add(left, right);
  group.position.set(x, y, z);
  group.scale.setScalar(.8);
  group.userData = { phase, left, right };
  scene.add(group);
  gulls.push(group);
}

function createWheel() {
  const group = new THREE.Group();
  const tire = mesh(new THREE.TorusGeometry(.64, .115, 10, 28), materials.tire);
  tire.rotation.y = Math.PI / 2;
  group.add(tire);

  const rim = mesh(new THREE.TorusGeometry(.48, .028, 6, 28), materials.metal);
  rim.rotation.y = Math.PI / 2;
  group.add(rim);

  for (let i = 0; i < 8; i++) {
    const spoke = mesh(new THREE.BoxGeometry(.024, .92, .026), materials.metal, false, false);
    spoke.rotation.x = i / 8 * Math.PI;
    group.add(spoke);
  }
  const hub = mesh(new THREE.CylinderGeometry(.09, .09, .34, 10), materials.metal);
  hub.rotation.z = Math.PI / 2;
  group.add(hub);
  return group;
}

function createScooter() {
  rideRig = new THREE.Group();
  scooterVisual = new THREE.Group();
  rideRig.add(scooterVisual);
  scene.add(rideRig);

  const blob = mesh(new THREE.CircleGeometry(1.9, 24), new THREE.MeshBasicMaterial({
    color: 0x17343d,
    transparent: true,
    opacity: .18,
    depthWrite: false,
  }), false, false);
  blob.rotation.x = -Math.PI / 2;
  blob.scale.set(1, 1.7, 1);
  blob.position.y = .02;
  rideRig.add(blob);

  rearWheel = createWheel();
  rearWheel.position.set(0, .64, -1.48);
  scooterVisual.add(rearWheel);

  frontAssembly = new THREE.Group();
  frontAssembly.position.z = 1.48;
  frontWheel = createWheel();
  frontWheel.position.y = .64;
  frontAssembly.add(frontWheel);
  scooterVisual.add(frontAssembly);

  const deck = mesh(new THREE.BoxGeometry(.72, .18, 2.35), materials.mintDark);
  deck.position.set(0, .83, -.02);
  deck.rotation.x = -.02;
  scooterVisual.add(deck);

  const floor = mesh(new THREE.BoxGeometry(.58, .08, 1.68), materials.dark);
  floor.position.set(0, .95, .13);
  scooterVisual.add(floor);

  const body = mesh(new THREE.CapsuleGeometry(.48, .58, 5, 10), materials.mint);
  body.scale.set(1.08, 1, .78);
  body.rotation.x = -.28;
  body.position.set(0, 1.43, -1.03);
  scooterVisual.add(body);

  const panel = mesh(new THREE.CapsuleGeometry(.29, .32, 4, 8), materials.mintDark);
  panel.rotation.x = Math.PI / 2;
  panel.position.set(0, 1.25, -1.38);
  scooterVisual.add(panel);

  const seatStem = mesh(new THREE.CylinderGeometry(.1, .13, .68, 8), materials.metal);
  seatStem.position.set(0, 1.66, -.65);
  scooterVisual.add(seatStem);
  const seat = mesh(new THREE.CapsuleGeometry(.26, .52, 4, 8), materials.dark);
  seat.rotation.x = Math.PI / 2;
  seat.scale.x = 1.35;
  seat.position.set(0, 2.03, -.63);
  scooterVisual.add(seat);

  const stemA = new THREE.Vector3(0, .88, 1.45);
  const stemB = new THREE.Vector3(0, 2.58, 1.65);
  frontAssembly.add(cylinderBetween(stemA.clone().setZ(0), stemB.clone().setZ(.17), .075, materials.metal, 10));
  const head = mesh(new THREE.CapsuleGeometry(.32, .42, 4, 8), materials.mint);
  head.rotation.x = -.22;
  head.position.set(0, 1.88, .08);
  frontAssembly.add(head);

  const handle = mesh(new THREE.CylinderGeometry(.055, .055, 1.48, 10), materials.dark);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0, 2.55, .18);
  frontAssembly.add(handle);

  const lamp = mesh(new THREE.SphereGeometry(.22, 12, 8), new THREE.MeshStandardMaterial({
    color: 0xfff1ba,
    emissive: 0xffda72,
    emissiveIntensity: 1.2,
    roughness: .35,
  }));
  lamp.scale.set(1, .75, .45);
  lamp.position.set(0, 2.03, .44);
  frontAssembly.add(lamp);

  [-1, 1].forEach((side) => {
    const mirrorStem = cylinderBetween(new THREE.Vector3(side * .48, 2.57, .18), new THREE.Vector3(side * .65, 2.93, .2), .025, materials.metal, 7);
    frontAssembly.add(mirrorStem);
    const mirror = mesh(new THREE.SphereGeometry(.14, 10, 7), materials.dark);
    mirror.scale.set(1.25, .9, .35);
    mirror.position.set(side * .67, 2.97, .21);
    frontAssembly.add(mirror);
  });

  createCat();
}

function createCat() {
  const cat = new THREE.Group();
  scooterVisual.add(cat);

  catBody = mesh(new THREE.CapsuleGeometry(.5, 1.0, 6, 12), materials.orange);
  catBody.position.set(0, 2.94, -.45);
  catBody.rotation.x = -.11;
  cat.add(catBody);

  const belly = mesh(new THREE.CapsuleGeometry(.28, .7, 5, 10), materials.cream);
  belly.position.set(0, 2.98, -.03);
  belly.rotation.x = -.18;
  belly.scale.z = .45;
  cat.add(belly);

  catHead = new THREE.Group();
  catHead.position.set(0, 4.13, -.03);
  cat.add(catHead);

  const head = mesh(new THREE.SphereGeometry(.58, 18, 13), materials.orange);
  head.scale.set(.94, .9, .9);
  catHead.add(head);

  [-1, 1].forEach((side) => {
    const ear = mesh(new THREE.ConeGeometry(.23, .58, 4), materials.orange);
    ear.position.set(side * .34, .48, -.03);
    ear.rotation.z = side * -.09;
    ear.rotation.y = Math.PI / 4;
    catHead.add(ear);
    const inner = mesh(new THREE.ConeGeometry(.105, .31, 4), materials.pink);
    inner.position.set(side * .34, .5, .18);
    inner.rotation.z = side * -.09;
    inner.rotation.y = Math.PI / 4;
    catHead.add(inner);
  });

  const muzzleLeft = mesh(new THREE.SphereGeometry(.18, 12, 8), materials.cream);
  muzzleLeft.position.set(-.13, -.1, .48);
  muzzleLeft.scale.set(1, .72, .55);
  const muzzleRight = muzzleLeft.clone();
  muzzleRight.position.x = .13;
  catHead.add(muzzleLeft, muzzleRight);

  const nose = mesh(new THREE.ConeGeometry(.07, .1, 3), materials.pink);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -.05, .59);
  catHead.add(nose);

  [-1, 1].forEach((side) => {
    const eye = mesh(new THREE.SphereGeometry(.075, 10, 7), materials.dark);
    eye.position.set(side * .205, .16, .49);
    eye.scale.set(.72, 1.3, .42);
    catHead.add(eye);
    eyes.push(eye);

    for (let i = -1; i <= 1; i++) {
      const whisker = cylinderBetween(
        new THREE.Vector3(side * .24, -.08 + i * .06, .48),
        new THREE.Vector3(side * .73, -.04 + i * .13, .58),
        .008,
        materials.cream,
        5,
      );
      catHead.add(whisker);
    }
  });

  const helmet = mesh(new THREE.SphereGeometry(.63, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2), materials.coral);
  helmet.position.y = .08;
  helmet.scale.set(1, .82, 1);
  catHead.add(helmet);
  const strap = mesh(new THREE.TorusGeometry(.48, .028, 6, 20, Math.PI), materials.dark);
  strap.rotation.set(Math.PI / 2, 0, 0);
  strap.position.set(0, -.18, .04);
  catHead.add(strap);

  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Vector3(side * .36, 3.45, -.08);
    const elbow = new THREE.Vector3(side * .5, 3.02, .7);
    const paw = new THREE.Vector3(side * .55, 2.62, 1.64);
    cat.add(cylinderBetween(shoulder, elbow, .115, materials.orange, 9));
    cat.add(cylinderBetween(elbow, paw, .1, materials.cream, 9));
    const pawMesh = mesh(new THREE.SphereGeometry(.13, 10, 8), materials.cream);
    pawMesh.position.copy(paw);
    cat.add(pawMesh);

    const hip = new THREE.Vector3(side * .3, 2.45, -.5);
    const knee = new THREE.Vector3(side * .42, 1.75, -.05);
    const foot = new THREE.Vector3(side * .32, 1.1, .35);
    cat.add(cylinderBetween(hip, knee, .15, materials.orange, 9));
    cat.add(cylinderBetween(knee, foot, .13, materials.orangeDark, 9));
    const footMesh = mesh(new THREE.CapsuleGeometry(.11, .27, 4, 8), materials.cream);
    footMesh.rotation.x = Math.PI / 2;
    footMesh.position.copy(foot).add(new THREE.Vector3(0, 0, .1));
    cat.add(footMesh);
  });

  const scarfKnot = mesh(new THREE.SphereGeometry(.14, 10, 7), materials.red);
  scarfKnot.position.set(.34, 3.7, -.36);
  cat.add(scarfKnot);
  [0, 1].forEach((i) => {
    const tail = mesh(new THREE.CapsuleGeometry(.065, .58 - i * .08, 4, 7), materials.red);
    tail.rotation.x = Math.PI / 2 + .18;
    tail.rotation.z = -.15 + i * .28;
    tail.position.set(.25 + i * .14, 3.63 - i * .08, -.73 - i * .16);
    cat.add(tail);
    scarfTails.push(tail);
  });

  const tailRoot = new THREE.Group();
  tailRoot.position.set(-.28, 2.77, -.74);
  cat.add(tailRoot);
  let parent = tailRoot;
  for (let i = 0; i < 6; i++) {
    const segmentRoot = new THREE.Group();
    const segment = mesh(new THREE.CapsuleGeometry(.14 - i * .012, .38, 4, 7), i % 3 === 1 ? materials.orangeDark : materials.orange);
    segment.rotation.x = Math.PI / 2;
    segment.position.z = -.28;
    segmentRoot.add(segment);
    parent.add(segmentRoot);
    segmentRoot.position.z = i === 0 ? 0 : -.5;
    segmentRoot.rotation.y = -.08;
    tailSegments.push(segmentRoot);
    parent = segmentRoot;
  }
}

function addLights() {
  const hemi = new THREE.HemisphereLight(0xdaf6ff, 0x815c42, 2.2);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0ca, 3.4);
  sun.position.set(-45, 62, -30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  sun.shadow.camera.left = -35;
  sun.shadow.camera.right = 35;
  sun.shadow.camera.top = 35;
  sun.shadow.camera.bottom = -35;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 150;
  sun.shadow.bias = -.0004;
  scene.add(sun);
}

function init() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) throw new Error('WebGL unavailable');

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.45 : 1.8));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    sceneHost.appendChild(renderer.domElement);

    scene.background = new THREE.Color(palette.skyTop);
    scene.fog = new THREE.Fog(0x9adfcf, 95, 230);
    camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, .1, 600);
    camera.position.set(0, 8, -14);

    createSky();
    createOcean();
    createIsland();
    createRoad();
    scatterIslandLife();
    createLighthouse();
    createCloud(-75, 45, -105, 1.9, .16);
    createCloud(38, 52, -130, 1.3, .1);
    createCloud(96, 39, -72, 1.05, .13);
    createGull(-18, 17, -36, 0);
    createGull(-23, 19, -41, 1.3);
    createGull(29, 16, -48, 2.1);
    createScooter();
    addLights();
    bindControls();
    updatePauseUI();
    resize();
    animate();
  } catch (error) {
    console.error(error);
    loading.classList.add('is-hidden');
    errorPanel.hidden = false;
    document.documentElement.dataset.sceneStatus = 'error';
  }
}

function ridePose() {
  const u = ((state.distance % pathLength) + pathLength) % pathLength / pathLength;
  const point = roadCurve.getPointAt(u);
  const tangent = roadCurve.getTangentAt(u).normalize();
  const normal = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
  const lanePoint = point.clone().addScaledVector(normal, 2.02);
  lanePoint.y = .66;
  rideRig.position.copy(lanePoint);
  rideRig.rotation.y = Math.atan2(tangent.x, tangent.z);

  const ahead = roadCurve.getTangentAt((u + .008) % 1).normalize();
  const heading = Math.atan2(tangent.x, tangent.z);
  const headingAhead = Math.atan2(ahead.x, ahead.z);
  let steering = headingAhead - heading;
  steering = Math.atan2(Math.sin(steering), Math.cos(steering));
  frontAssembly.rotation.y = THREE.MathUtils.clamp(steering * 2.6, -.27, .27);
  return { point: lanePoint, tangent, heading };
}

function updateRide(delta, elapsed) {
  if (state.playing) state.distance += (state.speedKmh / 3.6) * delta;
  const pose = ridePose();
  const travelPhase = state.distance * 1.85;
  const wheelSpin = -state.distance / .64;
  rearWheel.rotation.x = wheelSpin;
  frontWheel.rotation.x = wheelSpin;
  scooterVisual.position.y = Math.sin(travelPhase) * .018 + Math.sin(travelPhase * .47) * .012;
  scooterVisual.rotation.z = Math.sin(travelPhase * .18) * .012;

  catBody.rotation.z = Math.sin(travelPhase * .62) * .025;
  catHead.rotation.y = Math.sin(elapsed * .43) * .13;
  catHead.rotation.z = Math.sin(elapsed * .72) * .018;
  const blinkCycle = elapsed % 4.6;
  const blink = blinkCycle > 4.18 && blinkCycle < 4.36 ? .08 : 1;
  eyes.forEach((eye) => { eye.scale.y = 1.3 * blink; });

  tailSegments.forEach((segment, i) => {
    segment.rotation.y = Math.sin(elapsed * 2.0 - i * .5) * (.19 + i * .015) - .08;
    segment.rotation.x = Math.cos(elapsed * 1.45 - i * .35) * .055;
  });
  scarfTails.forEach((tail, i) => {
    tail.rotation.y = Math.sin(elapsed * 4.2 + i) * .11;
    tail.rotation.x = Math.PI / 2 + .18 + Math.sin(elapsed * 3.2 + i * .8) * .1;
  });

  document.documentElement.dataset.sceneStatus = 'ready';
  document.documentElement.dataset.distance = state.distance.toFixed(4);
  document.documentElement.dataset.wheelRotation = wheelSpin.toFixed(4);
  document.documentElement.dataset.speedKmh = String(state.speedKmh);
  document.documentElement.dataset.playing = String(state.playing);
  document.documentElement.dataset.cameraMode = String(state.cameraMode);
  return pose;
}

const cameraModes = [
  { label: '追随镜头', offset: new THREE.Vector3(0, 5.1, -10.5), target: new THREE.Vector3(0, 2.7, 1.5), fov: 48 },
  { label: '侧拍镜头', offset: new THREE.Vector3(10.5, 4.0, -1.5), target: new THREE.Vector3(0, 2.55, .25), fov: 50 },
  { label: '海岸全景', offset: new THREE.Vector3(17, 15, -18), target: new THREE.Vector3(0, 1.2, 2), fov: 54 },
];

function updateCamera(pose, delta) {
  const mode = cameraModes[state.cameraMode];
  const yaw = pose.heading + state.dragYaw;
  const raw = mode.offset.clone();
  raw.y += state.dragPitch * 8;
  raw.multiplyScalar(state.zoom);
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const rotated = new THREE.Vector3(raw.x * c + raw.z * s, raw.y, -raw.x * s + raw.z * c);
  const desired = pose.point.clone().add(rotated);

  const targetLocal = mode.target.clone();
  const targetRotated = new THREE.Vector3(
    targetLocal.x * Math.cos(pose.heading) + targetLocal.z * Math.sin(pose.heading),
    targetLocal.y,
    -targetLocal.x * Math.sin(pose.heading) + targetLocal.z * Math.cos(pose.heading),
  );
  const desiredTarget = pose.point.clone().add(targetRotated);
  const ease = 1 - Math.exp(-delta * 4.2);
  camera.position.lerp(desired, ease);
  cameraTarget.lerp(desiredTarget, ease);
  camera.fov = THREE.MathUtils.lerp(camera.fov, mode.fov, ease);
  camera.updateProjectionMatrix();
  camera.lookAt(cameraTarget);
}

function updateWorld(elapsed) {
  oceanMaterial.uniforms.uTime.value = elapsed;
  gulls.forEach((gull, i) => {
    const wing = Math.sin(elapsed * 3.4 + gull.userData.phase) * .42;
    gull.userData.left.rotation.z = -Math.PI / 2 + wing;
    gull.userData.right.rotation.z = Math.PI / 2 - wing;
    gull.position.y += Math.sin(elapsed * .8 + i) * .0015;
    gull.rotation.y = Math.sin(elapsed * .18 + i) * .28;
  });
  clouds.forEach((cloud) => {
    cloud.position.x += cloud.userData.speed * .01;
    if (cloud.position.x > 130) cloud.position.x = -130;
  });
}

const clock = new THREE.Clock();
function animate() {
  const delta = Math.min(clock.getDelta(), .05);
  const elapsed = clock.elapsedTime;
  const pose = updateRide(delta, elapsed);
  updateWorld(elapsed);
  updateCamera(pose, delta);
  renderer.render(scene, camera);
  if (firstFrame) {
    firstFrame = false;
    requestAnimationFrame(() => loading.classList.add('is-hidden'));
    window.__sceneReady = true;
  }
  requestAnimationFrame(animate);
}

function updatePauseUI() {
  pauseButton.setAttribute('aria-pressed', String(!state.playing));
  pauseLabel.textContent = state.playing ? '暂停' : '继续';
}

function togglePause() {
  state.playing = !state.playing;
  updatePauseUI();
}

function cycleCamera() {
  state.cameraMode = (state.cameraMode + 1) % cameraModes.length;
  state.dragYaw = 0;
  state.dragPitch = 0;
  state.zoom = 1;
  viewLabel.textContent = cameraModes[state.cameraMode].label;
}

function bindControls() {
  pauseButton.addEventListener('click', togglePause);
  viewButton.addEventListener('click', cycleCamera);
  speedRange.addEventListener('input', () => {
    state.speedKmh = Number(speedRange.value);
    speedValue.textContent = speedRange.value;
  });

  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.code === 'Space' || event.key.toLowerCase() === 'p') {
      event.preventDefault();
      togglePause();
    } else if (event.key.toLowerCase() === 'v') {
      cycleCamera();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
      state.speedKmh = Math.min(36, state.speedKmh + 1);
      speedRange.value = String(state.speedKmh);
      speedValue.textContent = String(state.speedKmh);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
      state.speedKmh = Math.max(10, state.speedKmh - 1);
      speedRange.value = String(state.speedKmh);
      speedValue.textContent = String(state.speedKmh);
    }
  });

  const canvas = renderer.domElement;
  let dragging = false;
  let pointerX = 0;
  let pointerY = 0;
  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    pointerX = event.clientX;
    pointerY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    hint.classList.add('is-hidden');
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - pointerX;
    const dy = event.clientY - pointerY;
    pointerX = event.clientX;
    pointerY = event.clientY;
    state.dragYaw -= dx * .005;
    state.dragPitch = THREE.MathUtils.clamp(state.dragPitch + dy * .003, -.32, .48);
  });
  const stopDrag = (event) => {
    dragging = false;
    if (event.pointerId !== undefined && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    state.zoom = THREE.MathUtils.clamp(state.zoom + event.deltaY * .0007, .68, 1.55);
    hint.classList.add('is-hidden');
  }, { passive: false });
  window.setTimeout(() => hint.classList.add('is-hidden'), 7000);
}

function resize() {
  if (!renderer || !camera) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.45 : 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', resize);
const scene = new THREE.Scene();
init();

