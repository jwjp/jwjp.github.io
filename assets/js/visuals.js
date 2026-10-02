import {
  BoxGeometry,
  BufferGeometry,
  EdgesGeometry,
  Group,
  IcosahedronGeometry,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  WireframeGeometry,
} from 'three';

function initHeroWireframe() {
  const card = document.querySelector('.hero-card');
  if (!card) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-card-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  card.prepend(canvas);

  let renderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
  } catch {
    canvas.remove();
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.z = 7.2;

  const structure = new Group();
  scene.add(structure);

  const outerBox = new BoxGeometry(2.9, 2.55, 2.35);
  const outerGeometry = new EdgesGeometry(outerBox);
  outerBox.dispose();
  const outer = new LineSegments(outerGeometry, new LineBasicMaterial({
    color: 0xe7f0e8,
    transparent: true,
    opacity: 0.55,
    depthTest: false,
  }));
  structure.add(outer);

  // Two highlighted edges give the wireframe a clear front face as it turns.
  const accentEdges = new BufferGeometry().setFromPoints([
    new Vector3(1.45, 1.275, 1.175), new Vector3(1.45, -1.275, 1.175),
    new Vector3(1.45, -1.275, 1.175), new Vector3(-1.45, -1.275, 1.175),
  ]);
  structure.add(new LineSegments(accentEdges, new LineBasicMaterial({
    color: 0xff7652,
    transparent: true,
    opacity: 0.76,
    depthTest: false,
  })));

  const innerBox = new BoxGeometry(1.7, 1.55, 1.7);
  const innerGeometry = new EdgesGeometry(innerBox);
  innerBox.dispose();
  const inner = new LineSegments(innerGeometry, new LineDashedMaterial({
    color: 0xcad9d0,
    dashSize: 0.11,
    gapSize: 0.085,
    transparent: true,
    opacity: 0.43,
    depthTest: false,
  }));
  inner.computeLineDistances();
  inner.position.set(0.42, -0.28, 0.25);
  inner.rotation.set(0.1, 0.22, -0.1);
  structure.add(inner);

  const orbit = new Group();
  scene.add(orbit);
  const orbitStart = -0.35;
  const orbitSweep = Math.PI * 1.55;
  const orbitPath = (radiusX, radiusY, start, sweep, z) => {
    const points = [];
    for (let i = 0; i <= 96; i++) {
      const angle = start + sweep * i / 96;
      points.push(new Vector3(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY, z));
    }
    return new BufferGeometry().setFromPoints(points);
  };
  const orbitLine = new Line(orbitPath(2.2, 1.55, orbitStart, orbitSweep, -0.3), new LineBasicMaterial({
    color: 0xa8cbb8,
    transparent: true,
    opacity: 0.28,
    depthTest: false,
  }));
  orbitLine.rotation.set(0.6, -0.35, -0.3);
  orbit.add(orbitLine);

  const secondOrbit = new Line(orbitPath(1.9, 1.28, 0.6, Math.PI * 1.3, -0.5), new LineBasicMaterial({
    color: 0xf27856,
    transparent: true,
    opacity: 0.32,
    depthTest: false,
  }));
  secondOrbit.rotation.set(-0.55, 0.45, 0.62);
  orbit.add(secondOrbit);

  const marker = new Group();
  const markerGeometry = new SphereGeometry(0.04, 12, 8);
  marker.add(new Mesh(markerGeometry, new MeshBasicMaterial({ color: 0xffb48f, depthTest: false })));
  const halo = new Mesh(new SphereGeometry(0.105, 12, 8), new MeshBasicMaterial({
    color: 0xf06542,
    transparent: true,
    opacity: 0.14,
    depthTest: false,
  }));
  marker.add(halo);
  orbit.add(marker);

  // Sparse points add depth without competing with the JM mark.
  let seed = 29;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const particles = [];
  for (let i = 0; i < 58; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 1.65 + random() * 1.4;
    particles.push(new Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * 0.78,
      -1.6 + random() * 2.6,
    ));
  }
  const particleField = new Points(new BufferGeometry().setFromPoints(particles), new PointsMaterial({
    color: 0xc8e8d4,
    size: 0.026,
    transparent: true,
    opacity: 0.58,
    depthTest: false,
  }));
  scene.add(particleField);

  let visible = false;
  let running = false;
  let frameId = 0;
  let lastDraw = 0;
  let elapsed = 0;
  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };

  function resize() {
    const { width, height } = card.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function frame(time) {
    if (!running) return;
    frameId = window.requestAnimationFrame(frame);
    if (lastDraw && time - lastDraw < 32) return;

    const delta = lastDraw ? Math.min((time - lastDraw) / 1000, 0.1) : 0;
    lastDraw = time;
    elapsed += delta;
    eased.x += (pointer.x - eased.x) * 0.07;
    eased.y += (pointer.y - eased.y) * 0.07;

    structure.rotation.x = -0.22 + Math.sin(elapsed * 0.32) * 0.08 + eased.y * 0.18;
    structure.rotation.y = 0.48 + elapsed * 0.13 + eased.x * 0.28;
    structure.rotation.z = Math.sin(elapsed * 0.21) * 0.04;
    inner.scale.setScalar(1 + Math.sin(elapsed * 1.1) * 0.035);
    orbit.rotation.z = elapsed * -0.035 + eased.x * 0.08;
    orbit.rotation.y = Math.sin(elapsed * 0.2) * 0.1;
    const markerAngle = orbitStart + (Math.sin(elapsed * 0.55) * 0.5 + 0.5) * orbitSweep;
    marker.position.set(Math.cos(markerAngle) * 2.2, Math.sin(markerAngle) * 1.55, -0.3).applyEuler(orbitLine.rotation);
    particleField.rotation.z = elapsed * 0.018;
    halo.scale.setScalar(1 + Math.sin(elapsed * 2.5) * 0.25);

    try {
      renderer.render(scene, camera);
      card.classList.add('is-animated');
    } catch {
      running = false;
      window.cancelAnimationFrame(frameId);
      card.classList.remove('is-animated');
    }
  }

  function syncPlayback() {
    const shouldRun = visible && !document.hidden && !reducedMotion.matches;
    if (shouldRun && !running) {
      running = true;
      lastDraw = 0;
      frameId = window.requestAnimationFrame(frame);
    } else if (!shouldRun && running) {
      running = false;
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
    if (reducedMotion.matches) card.classList.remove('is-animated');
  }

  card.addEventListener('pointermove', (event) => {
    const bounds = card.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
  }, { passive: true });
  card.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; });
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', syncPlayback);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    visible = false;
    syncPlayback();
    card.classList.remove('is-animated');
  });

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncPlayback();
  }, { threshold: 0.05 });
  visibilityObserver.observe(card);

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(card);
  else window.addEventListener('resize', resize, { passive: true });
  resize();
}

function initConnectNetwork(visual, reducedMotion) {
  if (reducedMotion.matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'connect-visual-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  visual.prepend(canvas);

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    canvas.remove();
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.z = 5.8;

  const constellation = new Group();
  scene.add(constellation);
  const outerShape = new IcosahedronGeometry(1.36, 1);
  const outerWire = new LineSegments(new WireframeGeometry(outerShape), new LineBasicMaterial({
    color: 0xc9ead7, transparent: true, opacity: 0.46, depthTest: false,
  }));
  constellation.add(outerWire);

  const uniqueVertices = new Map();
  const positions = outerShape.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const point = new Vector3().fromBufferAttribute(positions, i);
    const key = [point.x, point.y, point.z].map((value) => value.toFixed(3)).join(',');
    uniqueVertices.set(key, point);
  }
  outerShape.dispose();
  const vertices = [...uniqueVertices.values()];
  constellation.add(new Points(new BufferGeometry().setFromPoints(vertices), new PointsMaterial({
    color: 0xf0fff0, size: 0.055, transparent: true, opacity: 0.9, depthTest: false,
  })));

  const nodeGeometry = new SphereGeometry(0.045, 10, 8);
  const nodeMaterial = new MeshBasicMaterial({ color: 0xff926b, depthTest: false });
  [2, 13, 24, 35].forEach((index) => {
    const node = new Mesh(nodeGeometry, nodeMaterial);
    node.position.copy(vertices[index % vertices.length]);
    constellation.add(node);
  });

  const core = new Group();
  constellation.add(core);
  const coreShape = new IcosahedronGeometry(0.68, 0);
  core.add(new Mesh(coreShape, new MeshBasicMaterial({
    color: 0xe66a47, transparent: true, opacity: 0.14, depthWrite: false,
  })));
  core.add(new LineSegments(new WireframeGeometry(coreShape), new LineBasicMaterial({
    color: 0xffa17d, transparent: true, opacity: 0.92, depthTest: false,
  })));

  const orbit = new Group();
  scene.add(orbit);
  const makeRing = (radius, color, opacity, rotation) => {
    const points = [];
    for (let i = 0; i <= 128; i++) {
      const angle = i / 128 * Math.PI * 2;
      points.push(new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
    }
    const ring = new Line(new BufferGeometry().setFromPoints(points), new LineBasicMaterial({
      color, transparent: true, opacity, depthTest: false,
    }));
    ring.rotation.set(...rotation);
    orbit.add(ring);
    return ring;
  };
  const frontRing = makeRing(1.84, 0xff8965, 0.62, [0.78, -0.35, 0.2]);
  makeRing(1.68, 0x96d0ae, 0.4, [-0.58, 0.55, -0.35]);
  makeRing(2.02, 0xb8e0c7, 0.22, [1.18, 0.22, 0.55]);

  const beacon = new Group();
  beacon.add(new Mesh(new SphereGeometry(0.052, 12, 8), new MeshBasicMaterial({
    color: 0xffc2a3, depthTest: false,
  })));
  const beaconHalo = new Mesh(new SphereGeometry(0.13, 12, 8), new MeshBasicMaterial({
    color: 0xff7652, transparent: true, opacity: 0.2, depthTest: false,
  }));
  beacon.add(beaconHalo);
  orbit.add(beacon);

  let seed = 83;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const dust = [];
  for (let i = 0; i < 75; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 1.52 + random() * 0.9;
    dust.push(new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, (random() - 0.5) * 2.7));
  }
  const particleField = new Points(new BufferGeometry().setFromPoints(dust), new PointsMaterial({
    color: 0xb0e2bd, size: 0.025, transparent: true, opacity: 0.54, depthTest: false,
  }));
  scene.add(particleField);

  let visible = false;
  let running = false;
  let contextLost = false;
  let frameId = 0;
  let lastDraw = 0;
  let elapsed = 0;
  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };

  function resize() {
    const { width, height } = visual.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function frame(time) {
    if (!running) return;
    frameId = window.requestAnimationFrame(frame);
    if (lastDraw && time - lastDraw < 32) return;

    const delta = lastDraw ? Math.min((time - lastDraw) / 1000, 0.1) : 0;
    lastDraw = time;
    elapsed += delta;
    eased.x += (pointer.x - eased.x) * 0.06;
    eased.y += (pointer.y - eased.y) * 0.06;

    constellation.rotation.x = -0.18 + Math.sin(elapsed * 0.22) * 0.14 + eased.y * 0.23;
    constellation.rotation.y = elapsed * 0.18 + eased.x * 0.3;
    constellation.rotation.z = Math.sin(elapsed * 0.16) * 0.08;
    core.rotation.y = -elapsed * 0.6;
    core.rotation.z = elapsed * 0.28;
    core.scale.setScalar(1 + Math.sin(elapsed * 1.7) * 0.07);
    orbit.rotation.y = -elapsed * 0.12;
    orbit.rotation.z = elapsed * 0.045;
    const beaconAngle = elapsed * 0.5 + 0.45;
    beacon.position.set(Math.cos(beaconAngle) * 1.84, Math.sin(beaconAngle) * 1.84, 0).applyEuler(frontRing.rotation);
    beaconHalo.scale.setScalar(1 + Math.sin(elapsed * 2.8) * 0.22);
    particleField.rotation.z = -elapsed * 0.018;

    try {
      renderer.render(scene, camera);
      visual.classList.add('is-animated');
    } catch {
      running = false;
      window.cancelAnimationFrame(frameId);
      visual.classList.remove('is-animated');
    }
  }

  function syncPlayback() {
    const shouldRun = visible && !document.hidden && !reducedMotion.matches && !contextLost;
    if (shouldRun && !running) {
      running = true;
      lastDraw = 0;
      frameId = window.requestAnimationFrame(frame);
    } else if (!shouldRun && running) {
      running = false;
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
    if (reducedMotion.matches || contextLost) visual.classList.remove('is-animated');
  }

  visual.addEventListener('pointermove', (event) => {
    const bounds = visual.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
  }, { passive: true });
  visual.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; });
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', syncPlayback);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    contextLost = true;
    syncPlayback();
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0.05 });
    observer.observe(visual);
  } else {
    visible = true;
    syncPlayback();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(visual);
  else window.addEventListener('resize', resize, { passive: true });
  resize();
}

function watchConnect() {
  const visual = document.querySelector('.connect-visual');
  if (!visual) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let initialized = false;
  let observer;

  function observe() {
    if (initialized || reducedMotion.matches) return;
    if (!('IntersectionObserver' in window)) {
      initialized = true;
      initConnectNetwork(visual, reducedMotion);
      return;
    }
    observer?.disconnect();
    observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || reducedMotion.matches) return;
      initialized = true;
      observer.disconnect();
      initConnectNetwork(visual, reducedMotion);
    }, { rootMargin: '120px' });
    observer.observe(visual);
  }

  reducedMotion.addEventListener('change', observe);
  observe();
}

initHeroWireframe();
watchConnect();
