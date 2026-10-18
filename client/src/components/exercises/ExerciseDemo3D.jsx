import { useEffect, useRef } from 'react';
import {
  ACESFilmicToneMapping,
  CircleGeometry,
  Clock,
  Color,
  DirectionalLight,
  HemisphereLight,
  LineBasicMaterial,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  RingGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { applyPose, buildMannequin } from './demo3d/mannequin.js';
import { buildProps } from './demo3d/props.js';
import { movementFor } from './demo3d/movements.js';
import { useTheme } from '../../theme/useTheme.js';

// Where the camera looks from, per movement ("side" shows most lifts best).
const VIEWS = {
  side: { position: [3.3, 1.6, 1.8], target: [0, 0.9, 0] },
  front: { position: [0.8, 1.5, 3.6], target: [0, 1.0, 0] },
  high: { position: [2.8, 2.5, 1.9], target: [0, 0.6, -0.1] },
  // For movements above the head (pull-ups, presses): further back and higher, so the bar stays in view.
  tall: { position: [3.9, 2.0, 2.2], target: [0, 1.2, 0] },
};

// Colours of the figure and equipment, per theme (the figure is light, the joints are our green).
const COLORS = {
  light: { body: '#e2e8f0', floor: '#e2e8f0', ring: '#10b981', equipment: '#334155', plate: '#0f172a' },
  dark: { body: '#cbd5e1', floor: '#1e293b', ring: '#34d399', equipment: '#475569', plate: '#020617' },
};

const handPosition = new Vector3();

// Hanging exercises: move the whole figure so its hands are exactly on the bar ([height, z]).
// Bending the elbows then lifts the body – just like a real pull-up.
function hangByHands({ root, joints }, [barY, barZ]) {
  joints.handL.getWorldPosition(handPosition);
  root.position.y += barY - handPosition.y;
  root.position.z += barZ - handPosition.z;
  root.updateMatrixWorld(true);
}

// A 3D figure doing `exercise` in a loop. Drag to turn it around. `isPlaying` pauses it.
// Uses three.js (WebGL) and is only loaded when a demo is opened (see ExerciseDemo.jsx).
function ExerciseDemo3D({ exercise, isPlaying, className = '' }) {
  const containerRef = useRef(null);
  const stateRef = useRef({ isPlaying });
  const { theme } = useTheme();

  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const container = containerRef.current;
    let renderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return undefined; // no WebGL: the written how-to next to the demo still explains the exercise
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const colors = COLORS[theme];
    const materials = {
      body: new MeshStandardMaterial({ color: colors.body, roughness: 0.45, metalness: 0.1 }),
      joint: new MeshStandardMaterial({ color: '#10b981', emissive: '#10b981', emissiveIntensity: 0.35, roughness: 0.3 }),
      metal: new MeshStandardMaterial({ color: '#94a3b8', metalness: 0.9, roughness: 0.25 }),
      plate: new MeshStandardMaterial({ color: colors.plate, metalness: 0.4, roughness: 0.5 }),
      equipment: new MeshStandardMaterial({ color: colors.equipment, roughness: 0.6 }),
      cable: new LineBasicMaterial({ color: '#10b981' }),
      band: new LineBasicMaterial({ color: '#f59e0b' }),
    };

    const scene = new Scene();
    const floor = new Mesh(new CircleGeometry(1.7, 64), new MeshStandardMaterial({ color: colors.floor, roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    const ring = new Mesh(new RingGeometry(1.66, 1.7, 64), new MeshStandardMaterial({ color: colors.ring, emissive: colors.ring, emissiveIntensity: 0.6 }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.002;
    scene.add(floor, ring);

    const movement = movementFor(exercise);
    const mannequin = buildMannequin(materials);
    const props = buildProps(movement.props, materials);
    scene.add(mannequin.root, props.group);

    scene.add(new HemisphereLight('#ffffff', new Color(colors.floor), 1.6));
    const sun = new DirectionalLight('#ffffff', 2.2);
    sun.position.set(2.5, 5, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -2.5, right: 2.5, top: 3, bottom: -1.5 });
    scene.add(sun);

    const view = VIEWS[movement.view] ?? VIEWS.side;
    const camera = new PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(...view.position);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...view.target);
    controls.enableZoom = false; // the mouse wheel keeps scrolling the page
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // never look from below the floor
    controls.update();

    function resize() {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    // "Reduce motion": show the middle of the movement as a still picture (it can still be turned).
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clock = new Clock();
    let phase = reduceMotion ? 0.5 : 0;
    let frame = 0;
    function render() {
      const delta = clock.getDelta();
      if (stateRef.current.isPlaying && !reduceMotion) phase = (phase + delta / movement.period) % 1;
      applyPose(mannequin, movement.pose(phase), movement.floorY ?? 0);
      mannequin.root.updateMatrixWorld(true);
      if (movement.hangFrom) hangByHands(mannequin, movement.hangFrom);
      props.update(mannequin.joints, mannequin.root, phase);
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      controls.dispose();
      scene.traverse((object) => {
        object.geometry?.dispose();
        object.material?.dispose?.();
      });
      Object.values(materials).forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
    // A new exercise or the light/dark switch: build the scene again.
  }, [exercise, theme]);

  return <div ref={containerRef} className={`cursor-grab active:cursor-grabbing ${className}`} />;
}

export default ExerciseDemo3D;
