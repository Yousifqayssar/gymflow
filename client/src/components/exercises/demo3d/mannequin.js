import { BoxGeometry, CapsuleGeometry, Group, Mesh, Object3D, SphereGeometry } from 'three';

// A simple 3D figure ("mannequin") made of capsules and spheres, built like a skeleton:
// every joint is a Group, and turning a joint turns everything below it (like a real arm).
// The figure faces +z (towards the default camera); +y is up. Lengths are in metres (1.8 m tall).

export const THIGH = 0.45;
export const SHIN = 0.45;
const HIP_DROP = 0.05; // hip joints sit a little below the pelvis centre
const FOOT_HEIGHT = 0.06;

const toRad = (deg) => (deg * Math.PI) / 180;

function capsule(radius, length, material, y) {
  const mesh = new Mesh(new CapsuleGeometry(radius, length, 6, 16), material);
  mesh.position.y = y;
  mesh.castShadow = true;
  return mesh;
}

function joint(material, radius) {
  const mesh = new Mesh(new SphereGeometry(radius, 20, 16), material);
  mesh.castShadow = true;
  return mesh;
}

// One arm: shoulder → upper arm → elbow → forearm → hand. `side` is +1 (left) or -1 (right).
function buildArm(side, materials) {
  const shoulder = new Group();
  shoulder.position.set(0.2 * side, 0.45, 0);
  shoulder.add(joint(materials.joint, 0.055));
  shoulder.add(capsule(0.045, 0.2, materials.body, -0.15));
  const elbow = new Group();
  elbow.position.y = -0.3;
  elbow.add(joint(materials.joint, 0.045));
  elbow.add(capsule(0.04, 0.18, materials.body, -0.14));
  const hand = new Object3D(); // marker: where props like a barbell are held
  hand.position.y = -0.3;
  hand.add(joint(materials.body, 0.045));
  elbow.add(hand);
  shoulder.add(elbow);
  return { shoulder, elbow, hand };
}

// One leg: hip → thigh → knee → shin → ankle → foot.
function buildLeg(side, materials) {
  const hip = new Group();
  hip.position.set(0.1 * side, -HIP_DROP, 0);
  hip.add(capsule(0.065, 0.32, materials.body, -THIGH / 2));
  const knee = new Group();
  knee.position.y = -THIGH;
  knee.add(joint(materials.joint, 0.06));
  knee.add(capsule(0.05, 0.34, materials.body, -SHIN / 2));
  const ankle = new Group();
  ankle.position.y = -SHIN;
  const foot = new Mesh(new BoxGeometry(0.09, FOOT_HEIGHT, 0.22), materials.body);
  foot.position.set(0, -FOOT_HEIGHT / 2, 0.06);
  foot.castShadow = true;
  ankle.add(foot);
  knee.add(ankle);
  hip.add(knee);
  return { hip, knee };
}

export function buildMannequin(materials) {
  const root = new Group(); // moved up/down so the feet stay on the floor
  const body = new Group(); // turned as a whole: lying on a bench, face down for push-ups…
  root.add(body);

  const pelvis = new Mesh(new SphereGeometry(0.14, 24, 16), materials.body);
  pelvis.scale.set(1.25, 0.7, 0.9);
  pelvis.castShadow = true;
  body.add(pelvis);

  const spine = new Group();
  spine.position.y = 0.05;
  spine.add(capsule(0.14, 0.3, materials.body, 0.25));
  const neck = new Object3D(); // marker: base of the neck (a back squat bar rests just behind it)
  neck.position.set(0, 0.5, -0.1);
  spine.add(neck);
  const head = joint(materials.body, 0.11);
  head.position.y = 0.66;
  spine.add(head);
  body.add(spine);

  const left = buildArm(1, materials);
  const right = buildArm(-1, materials);
  spine.add(left.shoulder, right.shoulder);
  const leftLeg = buildLeg(1, materials);
  const rightLeg = buildLeg(-1, materials);
  body.add(leftLeg.hip, rightLeg.hip);

  return {
    root,
    joints: {
      body,
      spine,
      neck,
      shoulderL: left.shoulder,
      elbowL: left.elbow,
      handL: left.hand,
      shoulderR: right.shoulder,
      elbowR: right.elbow,
      handR: right.hand,
      hipL: leftLeg.hip,
      kneeL: leftLeg.knee,
      hipR: rightLeg.hip,
      kneeR: rightLeg.knee,
    },
  };
}

// How high the pelvis must be so the lower foot just touches the floor (for standing poses).
// Forward kinematics of the leg: thigh tilted forward by the hip angle, shin bent back by the knee angle.
export function standingHeight(pose) {
  const legDrop = (hip, knee) => THIGH * Math.cos(toRad(hip)) + SHIN * Math.cos(toRad(hip - knee));
  return Math.max(legDrop(pose.hipL, pose.kneeL), legDrop(pose.hipR, pose.kneeR)) + HIP_DROP + FOOT_HEIGHT;
}

// Puts the figure into a pose (angles in degrees; see movements.js for what each angle means).
export function applyPose({ root, joints }, pose, floorY = 0) {
  joints.body.rotation.set(toRad(pose.pitch), toRad(pose.yaw), 0);
  joints.spine.rotation.set(toRad(pose.torso), toRad(pose.twist), 0);
  // Arms: flexion lifts the arm forward (negative x turn), abduction lifts it out to the side.
  joints.shoulderL.rotation.set(-toRad(pose.sFlexL), 0, toRad(pose.sAbdL));
  joints.shoulderR.rotation.set(-toRad(pose.sFlexR), 0, -toRad(pose.sAbdR));
  joints.elbowL.rotation.x = -toRad(pose.eL);
  joints.elbowR.rotation.x = -toRad(pose.eR);
  // Legs: hip flexion lifts the thigh forward, knee flexion bends the shin back.
  joints.hipL.rotation.x = -toRad(pose.hipL);
  joints.hipR.rotation.x = -toRad(pose.hipR);
  joints.kneeL.rotation.x = toRad(pose.kneeL);
  joints.kneeR.rotation.x = toRad(pose.kneeR);

  const y = pose.y ?? standingHeight(pose) + floorY;
  root.position.set(0, y + pose.lift, pose.z);
}
