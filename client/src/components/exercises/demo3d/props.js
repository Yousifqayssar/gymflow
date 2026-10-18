import { BoxGeometry, BufferGeometry, CylinderGeometry, Float32BufferAttribute, Group, Line, Mesh, SphereGeometry, TorusGeometry, Vector3 } from 'three';

// Gym equipment for the 3D demos: built once, then moved every frame to where the figure's hands are.

const toRad = (deg) => (deg * Math.PI) / 180;

function mesh(geometry, material, { position = [0, 0, 0], rotation = [0, 0, 0] } = {}) {
  const m = new Mesh(geometry, material);
  m.position.set(...position);
  m.rotation.set(...rotation);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// A bar lying left–right (along x) with a plate on each end. Big plates for squats and deadlifts,
// small ones (plates: 'small') for curls and presses.
function barbell(materials, plates) {
  const plateRadius = plates === 'small' ? 0.11 : 0.2;
  const group = new Group();
  group.add(mesh(new CylinderGeometry(0.015, 0.015, 1.7, 12), materials.metal, { rotation: [0, 0, Math.PI / 2] }));
  for (const side of [-1, 1]) {
    group.add(mesh(new CylinderGeometry(plateRadius, plateRadius, 0.05, 32), materials.plate, { position: [0.62 * side, 0, 0], rotation: [0, 0, Math.PI / 2] }));
    group.add(mesh(new CylinderGeometry(0.035, 0.035, 0.04, 16), materials.metal, { position: [0.57 * side, 0, 0], rotation: [0, 0, Math.PI / 2] }));
  }
  return group;
}

function dumbbell(materials) {
  const group = new Group();
  group.add(mesh(new CylinderGeometry(0.014, 0.014, 0.16, 10), materials.metal, { rotation: [0, 0, Math.PI / 2] }));
  for (const side of [-1, 1]) {
    group.add(mesh(new CylinderGeometry(0.055, 0.055, 0.05, 20), materials.plate, { position: [0.085 * side, 0, 0], rotation: [0, 0, Math.PI / 2] }));
  }
  return group;
}

function kettlebell(materials) {
  const group = new Group();
  group.add(mesh(new SphereGeometry(0.1, 20, 16), materials.plate, { position: [0, -0.12, 0] }));
  group.add(mesh(new TorusGeometry(0.06, 0.012, 8, 20, Math.PI), materials.plate, { position: [0, -0.04, 0] }));
  return group;
}

function box(size, material, position, tiltDeg = 0) {
  return mesh(new BoxGeometry(...size), material, { position, rotation: [toRad(tiltDeg), 0, 0] });
}

function cableLine(material) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
  return new Line(geometry, material);
}

// Builds every prop the movement needs. Returns the group to add to the scene and
// update(joints, root, phase), which moves the props to follow the figure.
export function buildProps(spec, materials) {
  const group = new Group();
  const updates = [];
  const left = new Vector3();
  const right = new Vector3();
  const middle = new Vector3();
  const handsWorld = (joints) => {
    joints.handL.getWorldPosition(left);
    joints.handR.getWorldPosition(right);
    middle.addVectors(left, right).multiplyScalar(0.5);
  };

  if (spec.barbell) {
    const bar = barbell(materials, spec.plates);
    group.add(bar);
    const neck = new Vector3();
    updates.push((joints) => {
      if (spec.barbell === 'back') {
        joints.neck.getWorldPosition(neck);
        bar.position.copy(neck);
      } else {
        handsWorld(joints);
        bar.position.copy(middle);
      }
    });
  }

  if (spec.dumbbells) {
    const pair = [dumbbell(materials), dumbbell(materials)];
    group.add(...pair);
    updates.push((joints) => {
      handsWorld(joints);
      pair[0].position.copy(left);
      pair[1].position.copy(right);
    });
  }

  if (spec.kettlebell) {
    const bell = kettlebell(materials);
    group.add(bell);
    updates.push((joints) => {
      handsWorld(joints);
      bell.position.copy(middle);
    });
  }

  if (spec.bench) group.add(box(spec.bench.size, materials.equipment, spec.bench.position, spec.bench.tilt));
  if (spec.seat) group.add(box(spec.seat.size, materials.equipment, spec.seat.position, spec.seat.tilt));

  if (spec.bar) {
    const [x, y, z] = spec.bar.position;
    group.add(mesh(new CylinderGeometry(0.02, 0.02, 1.4, 12), materials.metal, { position: [x, y, z], rotation: [0, 0, Math.PI / 2] }));
    for (const side of [-1, 1]) group.add(box([0.06, y, 0.06], materials.equipment, [0.7 * side, y / 2, z]));
  }

  for (const cable of spec.cables ?? []) {
    const line = cableLine(cable.color === 'band' ? materials.band : materials.cable);
    const pulley = mesh(new SphereGeometry(0.04, 12, 10), materials.metal, { position: cable.anchor });
    group.add(line, pulley);
    const anchor = new Vector3(...cable.anchor);
    updates.push((joints) => {
      handsWorld(joints);
      const from = cable.hand === 'L' ? left : cable.hand === 'R' ? right : middle;
      line.geometry.attributes.position.setXYZ(0, from.x, from.y, from.z);
      line.geometry.attributes.position.setXYZ(1, anchor.x, anchor.y, anchor.z);
      line.geometry.attributes.position.needsUpdate = true;
    });
  }

  if (spec.treadmill) {
    group.add(box([0.8, 0.12, 1.7], materials.equipment, [0, 0.06, 0]));
    group.add(box([0.06, 1.1, 0.06], materials.equipment, [0.38, 0.6, 0.8]), box([0.06, 1.1, 0.06], materials.equipment, [-0.38, 0.6, 0.8]));
    group.add(box([0.8, 0.08, 0.2], materials.equipment, [0, 1.15, 0.8]));
  }

  if (spec.bike) {
    group.add(box([0.25, 0.08, 0.3], materials.equipment, [0, 0.93, -0.1]));
    group.add(box([0.06, 0.9, 0.06], materials.equipment, [0, 0.45, -0.05], 15));
    group.add(mesh(new CylinderGeometry(0.02, 0.02, 0.5, 10), materials.metal, { position: [0, 1.1, 0.5], rotation: [0, 0, Math.PI / 2] }));
    group.add(box([0.06, 0.8, 0.06], materials.equipment, [0, 0.7, 0.45], -10));
    group.add(mesh(new TorusGeometry(0.3, 0.04, 10, 32), materials.plate, { position: [0, 0.32, 0.55], rotation: [0, Math.PI / 2, 0] }));
    group.add(box([0.6, 0.06, 1.2], materials.equipment, [0, 0.03, 0.2]));
  }

  if (spec.rower) {
    group.add(box([0.14, 0.08, 1.9], materials.equipment, [0, 0.2, 0.15]));
    group.add(mesh(new CylinderGeometry(0.22, 0.22, 0.12, 28), materials.plate, { position: [0, 0.35, 1.15], rotation: [0, 0, Math.PI / 2] }));
    const seat = box([0.3, 0.06, 0.3], materials.equipment, [0, 0.27, 0]);
    group.add(seat);
    updates.push((joints, root) => {
      seat.position.z = root.position.z;
    });
  }

  if (spec.rope) {
    const rope = mesh(new TorusGeometry(0.85, 0.008, 6, 64), materials.cable);
    rope.rotation.y = Math.PI / 2;
    group.add(rope);
    updates.push((joints, root, phase) => {
      rope.position.set(0, root.position.y + 0.25, root.position.z);
      rope.rotation.x = 2 * Math.PI * phase;
    });
  }

  return {
    group,
    update(joints, root, phase) {
      for (const update of updates) update(joints, root, phase);
    },
  };
}
