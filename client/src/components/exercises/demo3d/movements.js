// The movements the 3D figure can show, as joint angles in degrees.
//   pitch / yaw : the whole body (pitch -90 = lying on the back, +85 = face down)
//   torso, twist: leaning forward / turning the upper body
//   sFlex       : lifting the arm forward (90 = straight ahead, 180 = overhead)
//   sAbd        : lifting the arm out to the side
//   e           : elbow bend      hip: lifting the thigh forward      knee: knee bend
//   y           : fixed pelvis height (otherwise the feet are kept on the floor), lift: extra height, z: forward
// Most movements go smoothly from pose A to pose B and back; running and cycling are continuous cycles.

const BASE = { pitch: 0, yaw: 0, torso: 0, twist: 0, sFlexL: 0, sFlexR: 0, sAbdL: 8, sAbdR: 8, eL: 8, eR: 8, hipL: 0, hipR: 0, kneeL: 0, kneeR: 0, y: undefined, lift: 0, z: 0 };
const SYMMETRIC = ['sFlex', 'sAbd', 'e', 'hip', 'knee'];

// "sFlex: 90" means both arms; "hipL: 80" only the left leg.
function pose(values) {
  const result = { ...BASE };
  for (const [key, value] of Object.entries(values)) {
    if (SYMMETRIC.includes(key)) {
      result[`${key}L`] = value;
      result[`${key}R`] = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

const mix = (a, b, t) => a + (b - a) * t;
function lerpPose(a, b, t) {
  const result = {};
  for (const key of Object.keys(BASE)) {
    if (key === 'y') result.y = a.y === undefined || b.y === undefined ? (a.y ?? b.y) : mix(a.y, b.y, t);
    else result[key] = mix(a[key], b[key], t);
  }
  return result;
}

// 0 → 1 → 0 over one repetition, slow at both ends like a controlled rep.
const wave = (phase) => 0.5 - 0.5 * Math.cos(2 * Math.PI * phase);

// A movement that goes from pose A to pose B and back again.
function between(base, a, b) {
  const poseA = pose({ ...base, ...a });
  const poseB = pose({ ...base, ...b });
  return (phase) => lerpPose(poseA, poseB, wave(phase));
}

const HANDS_AT_SHOULDERS = { sFlex: 25, sAbd: 65, e: 140 };
const ARMS_OVERHEAD = { sFlex: 172, sAbd: 12, e: 0 };

export const MOVEMENTS = {
  squat: { view: 'side', period: 2.6, props: { barbell: 'back' }, pose: between({ sFlex: 35, sAbd: 60, e: 150 }, { torso: 8 }, { torso: 40, hip: 105, knee: 115 }) },
  lunge: { view: 'side', period: 2.4, props: { dumbbells: true }, pose: between({ e: 5 }, {}, { hipL: 80, kneeL: 90, hipR: -15, kneeR: 95, torso: 5 }) },
  legPress: {
    view: 'side',
    period: 2.4,
    props: { seat: { size: [0.5, 0.5, 0.6], position: [0, 0.25, -0.2], tilt: 0 } },
    pose: between({ pitch: -45, y: 0.62, sFlex: 20, e: 10 }, { hip: 110, knee: 110 }, { hip: 60, knee: 10 }),
  },
  deadlift: { view: 'side', period: 2.8, props: { barbell: 'hands' }, pose: between({ e: 0, sAbd: 5 }, { torso: 65, sFlex: 65, hip: 55, knee: 65 }, {}) },
  romanianDeadlift: { view: 'side', period: 2.8, props: { barbell: 'hands' }, pose: between({ e: 0, sAbd: 5 }, {}, { torso: 75, sFlex: 75, hip: 10, knee: 15 }) },
  kettlebellSwing: { view: 'side', period: 1.6, props: { kettlebell: true }, pose: between({ e: 0, sAbd: 4 }, { torso: 60, sFlex: 30, hip: 35, knee: 40 }, { torso: -5, sFlex: 95 }) },
  benchPress: {
    view: 'high',
    period: 2.4,
    props: { barbell: 'hands', bench: { size: [0.36, 0.42, 1.1], position: [0, 0.21, -0.15] } },
    pose: between({ pitch: -90, y: 0.56, z: 0.25, hip: -35, knee: 95 }, { sFlex: 45, sAbd: 55, e: 95 }, { sFlex: 90, sAbd: 12, e: 0 }),
  },
  inclinePress: {
    view: 'side',
    period: 2.4,
    props: { dumbbells: true, bench: { size: [0.36, 0.08, 0.9], position: [0, 0.6, -0.25], tilt: -35 } },
    pose: between({ pitch: -55, y: 0.66, z: 0.1, hip: 10, knee: 85 }, { sFlex: 45, sAbd: 60, e: 95 }, { sFlex: 90, sAbd: 15, e: 0 }),
  },
  pushUp: { view: 'side', period: 2, props: {}, pose: between({ pitch: 85, sFlex: 90, sAbd: 10, z: -0.1 }, { y: 0.55, e: 0 }, { y: 0.3, e: 95, sFlex: 60, pitch: 88 }) },
  plank: { view: 'side', period: 3.2, props: {}, pose: between({ pitch: 85, y: 0.3, sFlex: 90, e: 90 }, {}, { torso: -3, lift: 0.015 }) },
  // Hanging movements: the figure hangs from the bar by its hands (see hangFrom in ExerciseDemo3D).
  pullUp: {
    view: 'tall',
    period: 2.6,
    hangFrom: [2.25, 0.05],
    props: { bar: { position: [0, 2.25, 0.05] } },
    pose: between({ hip: 15, knee: 45, y: 1 }, { sFlex: 170, sAbd: 15, e: 0 }, { sFlex: 150, sAbd: 35, e: 115 }),
  },
  kneeRaise: {
    view: 'tall',
    period: 2.4,
    hangFrom: [2.25, 0.05],
    props: { bar: { position: [0, 2.25, 0.05] } },
    pose: between({ sFlex: 170, sAbd: 15, e: 0, y: 1 }, {}, { hip: 95, knee: 90 }),
  },
  latPulldown: {
    view: 'tall',
    period: 2.4,
    props: { seat: { size: [0.4, 0.45, 0.4], position: [0, 0.22, -0.05] }, cables: [{ hand: 'both', anchor: [0, 2.35, 0.15] }] },
    pose: between({ hip: 90, knee: 90, y: 0.55, torso: -10 }, { sFlex: 165, sAbd: 20, e: 0 }, { sFlex: 110, sAbd: 55, e: 120 }),
  },
  seatedRow: {
    view: 'side',
    period: 2.4,
    props: { seat: { size: [0.35, 0.3, 0.5], position: [0, 0.15, -0.1] }, cables: [{ hand: 'both', anchor: [0, 0.45, 1.35] }] },
    pose: between({ hip: 85, knee: 25, y: 0.48 }, { torso: 20, sFlex: 85, e: 0 }, { torso: -12, sFlex: 35, e: 105 }),
  },
  bandRow: {
    view: 'side',
    period: 2.2,
    props: { cables: [{ hand: 'both', anchor: [0, 0.95, 1.4], color: 'band' }] },
    pose: between({ hip: 30, knee: 35, torso: 20 }, { sFlex: 80, e: 0 }, { sFlex: 25, e: 110 }),
  },
  facePull: {
    view: 'side',
    period: 2.2,
    props: { cables: [{ hand: 'both', anchor: [0, 1.75, 1.4] }] },
    pose: between({}, { sFlex: 85, sAbd: 10, e: 0 }, { sFlex: 80, sAbd: 75, e: 110 }),
  },
  overheadPress: { view: 'tall', period: 2.4, props: { barbell: 'hands', plates: 'small' }, pose: between({}, HANDS_AT_SHOULDERS, ARMS_OVERHEAD) },
  arnoldPress: { view: 'tall', period: 2.4, props: { dumbbells: true }, pose: between({}, { sFlex: 70, sAbd: 5, e: 150 }, ARMS_OVERHEAD) },
  thruster: { view: 'tall', period: 2.4, props: { dumbbells: true }, pose: between({}, { ...HANDS_AT_SHOULDERS, hip: 100, knee: 110, torso: 35 }, ARMS_OVERHEAD) },
  lateralRaise: { view: 'front', period: 2.2, props: { dumbbells: true }, pose: between({ e: 12 }, { sAbd: 10 }, { sAbd: 85 }) },
  curl: { view: 'side', period: 2, props: { barbell: 'hands', plates: 'small' }, pose: between({ sAbd: 6 }, { e: 5 }, { e: 140, sFlex: 5 }) },
  hammerCurl: { view: 'side', period: 2, props: { dumbbells: true }, pose: between({ sAbd: 6 }, { e: 5 }, { e: 140, sFlex: 5 }) },
  tricepsPushdown: {
    view: 'tall',
    period: 2,
    props: { cables: [{ hand: 'both', anchor: [0, 2.25, 0.45] }] },
    pose: between({ torso: 10 }, { sFlex: 15, e: 100 }, { sFlex: 5, e: 5 }),
  },
  benchDip: {
    view: 'side',
    period: 2.2,
    props: { bench: { size: [0.9, 0.42, 0.36], position: [0, 0.21, -0.32] } },
    pose: between({ hip: 85, knee: 85, sFlex: -35, sAbd: 10, z: 0.12 }, { y: 0.66, e: 5 }, { y: 0.46, e: 85 }),
  },
  cableFly: {
    view: 'front',
    period: 2.4,
    props: { cables: [{ hand: 'L', anchor: [1.05, 1.9, -0.2] }, { hand: 'R', anchor: [-1.05, 1.9, -0.2] }] },
    pose: between({ e: 15 }, { sAbd: 80, sFlex: 5 }, { sAbd: 25, sFlex: 75 }),
  },
  cableCrunch: {
    view: 'tall',
    period: 2.4,
    props: { cables: [{ hand: 'both', anchor: [0, 2.2, 0.35] }] },
    pose: between({ knee: 90, y: 0.56, sFlex: 160, e: 130 }, { torso: 5 }, { torso: 75 }),
  },
  russianTwist: { view: 'front', period: 2, props: { kettlebell: true }, pose: between({ torso: -35, hip: 60, knee: 95, y: 0.24, sFlex: 20, e: 100 }, { twist: -40 }, { twist: 40 }) },
  burpee: { view: 'tall', period: 1.4, props: {}, pose: between({}, { hip: 100, knee: 110, torso: 45, sFlex: 60 }, { lift: 0.25, sFlex: 170, sAbd: 15, e: 0 }) },
  run: {
    view: 'side',
    period: 0.7,
    floorY: 0.12,
    props: { treadmill: true },
    pose: (phase) => {
      const s = Math.sin(2 * Math.PI * phase);
      return pose({
        torso: 8,
        hipL: 35 * s,
        hipR: -35 * s,
        kneeL: 20 + 55 * (0.5 - 0.5 * s),
        kneeR: 20 + 55 * (0.5 + 0.5 * s),
        sFlexL: -30 * s,
        sFlexR: 30 * s,
        e: 85,
        lift: 0.04 * Math.abs(Math.cos(2 * Math.PI * phase)),
      });
    },
  },
  bike: {
    view: 'side',
    period: 1,
    props: { bike: true },
    pose: (phase) => {
      const a = 2 * Math.PI * phase;
      return pose({ y: 0.98, torso: 35, sFlex: 55, e: 20, hipL: 55 + 28 * Math.sin(a), kneeL: 85 + 35 * Math.sin(a + 0.6), hipR: 55 - 28 * Math.sin(a), kneeR: 85 - 35 * Math.sin(a + 0.6) });
    },
  },
  rowing: {
    view: 'side',
    period: 2.4,
    props: { rower: true, cables: [{ hand: 'both', anchor: [0, 0.45, 1.05] }] },
    pose: between({ y: 0.32 }, { z: 0.35, hip: 115, knee: 125, torso: 25, sFlex: 80, e: 0 }, { z: -0.25, hip: 85, knee: 5, torso: -20, sFlex: 40, e: 110 }),
  },
  jumpRope: { view: 'side', period: 0.55, props: { rope: true }, pose: between({ sAbd: 30, e: 75, sFlex: 10, knee: 15, hip: 5 }, {}, { lift: 0.07 }) },
};

// Which movement shows which library exercise.
const BY_NAME = {
  'Bench press': 'benchPress',
  'Incline dumbbell press': 'inclinePress',
  'Push-up': 'pushUp',
  'Cable fly': 'cableFly',
  Deadlift: 'deadlift',
  'Pull-up': 'pullUp',
  'Lat pulldown': 'latPulldown',
  'Seated cable row': 'seatedRow',
  'Back squat': 'squat',
  'Leg press': 'legPress',
  'Walking lunge': 'lunge',
  'Romanian deadlift': 'romanianDeadlift',
  'Overhead press': 'overheadPress',
  'Dumbbell lateral raise': 'lateralRaise',
  'Face pull': 'facePull',
  'Arnold press': 'arnoldPress',
  'Barbell curl': 'curl',
  'Hammer curl': 'hammerCurl',
  'Triceps pushdown': 'tricepsPushdown',
  'Bench dip': 'benchDip',
  Plank: 'plank',
  'Hanging knee raise': 'kneeRaise',
  'Cable crunch': 'cableCrunch',
  'Russian twist': 'russianTwist',
  'Kettlebell swing': 'kettlebellSwing',
  Burpee: 'burpee',
  Thruster: 'thruster',
  'Resistance band row': 'bandRow',
  'Treadmill run': 'run',
  'Rowing machine': 'rowing',
  'Stationary bike': 'bike',
  'Jump rope': 'jumpRope',
};

// Exercises trainers add later: the typical movement of their muscle group.
const BY_MUSCLE_GROUP = {
  CHEST: 'benchPress',
  BACK: 'seatedRow',
  LEGS: 'squat',
  SHOULDERS: 'overheadPress',
  ARMS: 'hammerCurl',
  CORE: 'plank',
  FULL_BODY: 'burpee',
  CARDIO: 'run',
};

// For an unknown exercise the hand props follow its equipment (a curl with dumbbells shows dumbbells).
function propsForEquipment(movementProps, equipment) {
  const { barbell, dumbbells, kettlebell, ...rest } = movementProps;
  const holds = barbell || dumbbells || kettlebell;
  if (!holds) return movementProps;
  if (equipment === 'BARBELL') return { ...rest, barbell: barbell || 'hands' };
  if (equipment === 'DUMBBELL') return { ...rest, dumbbells: true };
  if (equipment === 'KETTLEBELL') return { ...rest, kettlebell: true };
  return rest; // bodyweight, machine, cable…: empty hands
}

export function movementFor(exercise) {
  const key = BY_NAME[exercise.name];
  if (key) return MOVEMENTS[key];
  const fallback = MOVEMENTS[BY_MUSCLE_GROUP[exercise.muscleGroup] ?? 'squat'];
  return { ...fallback, props: propsForEquipment(fallback.props, exercise.equipment) };
}
