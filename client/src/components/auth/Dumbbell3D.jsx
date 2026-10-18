import { useEffect, useRef } from 'react';
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Clock,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Scene,
  SphereGeometry,
  TorusGeometry,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// A shiny 3D dumbbell for the login page, drawn with three.js (WebGL).
// It turns slowly, floats up and down, and leans towards the mouse.
// Everything is built from simple shapes (cylinders and rings), so no 3D model file is needed.
// This file is loaded only on the login/register pages (see AuthCard.jsx), so other pages stay light.

const BRAND = 0x10b981; // emerald-500, our brand colour
const PLATE_SIZES = [1.05, 0.88, 0.72]; // radius of the weight plates, from the inside out

// One side of the dumbbell: three plates with a glowing green ring, and a collar.
function buildWeights(side, materials) {
  const group = new Group();
  PLATE_SIZES.forEach((radius, index) => {
    const x = side * (1.05 + index * 0.27);
    const plate = new Mesh(new CylinderGeometry(radius, radius, 0.22, 64), materials.plate);
    plate.rotation.z = Math.PI / 2;
    plate.position.x = x;
    group.add(plate);

    const ring = new Mesh(new TorusGeometry(radius * 0.82, 0.025, 12, 64), materials.glow);
    ring.rotation.y = Math.PI / 2;
    ring.position.x = x + side * 0.115;
    group.add(ring);
  });
  const collar = new Mesh(new CylinderGeometry(0.2, 0.2, 0.16, 32), materials.chrome);
  collar.rotation.z = Math.PI / 2;
  collar.position.x = side * 0.88;
  group.add(collar);
  return group;
}

function buildScene() {
  const scene = new Scene();
  const materials = {
    chrome: new MeshStandardMaterial({ color: 0xe5e7eb, metalness: 1, roughness: 0.18 }),
    plate: new MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.35 }),
    glow: new MeshStandardMaterial({ color: BRAND, emissive: BRAND, emissiveIntensity: 1.6 }),
    orb: new MeshStandardMaterial({ color: 0x6ee7b7, emissive: BRAND, emissiveIntensity: 0.8, metalness: 0.3, roughness: 0.2 }),
  };

  const dumbbell = new Group();
  const handle = new Mesh(new CylinderGeometry(0.11, 0.11, 2.1, 32), materials.chrome);
  handle.rotation.z = Math.PI / 2;
  dumbbell.add(handle, buildWeights(1, materials), buildWeights(-1, materials));
  dumbbell.rotation.set(0.35, -0.6, 0.25);
  scene.add(dumbbell);

  // Small glowing spheres circling around the dumbbell, for depth.
  const orbs = Array.from({ length: 6 }, (_, i) => {
    const orb = new Mesh(new SphereGeometry(0.06 + (i % 3) * 0.03, 24, 24), materials.orb);
    orb.userData = { angle: (i / 6) * Math.PI * 2, radius: 2.4 + (i % 2) * 0.5, height: (i % 3) - 1, speed: 0.25 + i * 0.04 };
    scene.add(orb);
    return orb;
  });

  // Light: a soft "room" for realistic metal reflections, a key light and a green rim light.
  const keyLight = new DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(3, 4, 5);
  const rimLight = new PointLight(BRAND, 30, 12);
  rimLight.position.set(-3, -2, 2);
  scene.add(keyLight, rimLight, new AmbientLight(0xffffff, 0.35));

  return { scene, dumbbell, orbs, materials };
}

function Dumbbell3D({ className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    let renderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return undefined; // no WebGL (very old computer or disabled): the page simply shows no 3D
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    const { scene, dumbbell, orbs, materials } = buildScene();
    const pmrem = new PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // "Reduce motion": draw one still picture (again after every resize) instead of an animation.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const camera = new PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    function resize() {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      if (reduceMotion) renderer.render(scene, camera);
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    // The mouse position on the page, from -1 to 1; the dumbbell leans towards it.
    const pointer = { x: 0, y: 0 };
    function handlePointerMove(event) {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener('pointermove', handlePointerMove);

    const clock = new Clock();
    let frame = 0;

    function render() {
      const t = clock.getElapsedTime();
      if (!reduceMotion) {
        dumbbell.rotation.y += 0.004;
        dumbbell.position.y = Math.sin(t * 1.2) * 0.12;
        // Ease towards the mouse instead of jumping (a tenth of the way each frame).
        dumbbell.rotation.x += (0.35 + pointer.y * 0.35 - dumbbell.rotation.x) * 0.05;
        dumbbell.rotation.z += (0.25 - pointer.x * 0.3 - dumbbell.rotation.z) * 0.05;
        for (const orb of orbs) {
          const { angle, radius, height, speed } = orb.userData;
          const a = angle + t * speed;
          orb.position.set(Math.cos(a) * radius, height * 0.9 + Math.sin(t + angle) * 0.2, Math.sin(a) * radius * 0.6);
        }
      }
      renderer.render(scene, camera);
      if (!reduceMotion) frame = requestAnimationFrame(render);
    }
    render();

    // Clean up when the page is left: stop drawing and free the graphics memory.
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();
      scene.traverse((object) => object.geometry?.dispose());
      Object.values(materials).forEach((material) => material.dispose());
      scene.environment?.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={containerRef} aria-hidden="true" className={className} />;
}

export default Dumbbell3D;
