import {
  BoxGeometry,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';

function initWireframe() {
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

  const outerBox = new BoxGeometry(2.7, 2.4, 2.2);
  const outerGeometry = new EdgesGeometry(outerBox);
  outerBox.dispose();
  const outer = new LineSegments(outerGeometry, new LineBasicMaterial({
    color: 0xe7f0e8,
    transparent: true,
    opacity: 0.53,
    depthTest: false,
  }));
  structure.add(outer);

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

initWireframe();
