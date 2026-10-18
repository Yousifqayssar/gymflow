import { m, useReducedMotion, useTime, useTransform } from 'motion/react';
import { MUSCLE_GROUPS } from '../../utils/exerciseDisplay.js';

const GROUPS = Object.entries(MUSCLE_GROUPS);
const RADIUS_X = 150; // width of the ring (px)
const RADIUS_Y = 46; // height of the ring: a flat ellipse looks like a ring seen from above
const SECONDS_PER_TURN = 24;

// One icon on the ring. Its angle grows with the time, which moves it around the ellipse.
// Icons at the front (bottom of the ellipse) are bigger, brighter and on top: that makes it look 3D.
function OrbitIcon({ group, index, time, isStill }) {
  const startAngle = (index / GROUPS.length) * Math.PI * 2;
  const angle = useTransform(time, (t) => startAngle + (isStill ? 0 : (t / 1000 / SECONDS_PER_TURN) * Math.PI * 2));
  const x = useTransform(angle, (a) => Math.cos(a) * RADIUS_X);
  const y = useTransform(angle, (a) => Math.sin(a) * RADIUS_Y);
  const depth = useTransform(angle, (a) => (Math.sin(a) + 1) / 2); // 0 = far back, 1 = front
  const scale = useTransform(depth, (d) => 0.6 + d * 0.55);
  const opacity = useTransform(depth, (d) => 0.45 + d * 0.55);
  const zIndex = useTransform(depth, (d) => Math.round(d * 100));
  const { icon: Icon, gradient, label } = group;

  return (
    <m.span
      style={{ x, y, scale, opacity, zIndex }}
      title={label}
      className={`absolute top-1/2 left-1/2 -mt-7 -ml-7 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-xl ring-1 ring-white/20 ${gradient}`}
    >
      <Icon className="size-7" aria-hidden="true" />
    </m.span>
  );
}

// Decoration for the exercises page: the eight muscle-group icons orbiting around a glowing dumbbell core.
// "Reduce motion": the ring stands still.
function MuscleOrbit() {
  const time = useTime();
  const isStill = useReducedMotion();

  return (
    <div aria-hidden="true" className="relative h-56 w-[22rem]">
      {/* The ring itself, tilted backwards in real CSS 3D */}
      <div className="absolute inset-0 [perspective:600px]">
        <div className="absolute top-1/2 left-1/2 h-[92px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/15 shadow-[0_0_40px_rgb(16_185_129/0.25)_inset]" />
      </div>
      {/* Glow in the middle */}
      <div className="absolute top-1/2 left-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/30 blur-2xl" />
      {GROUPS.map(([key, group], index) => (
        <OrbitIcon key={key} group={group} index={index} time={time} isStill={isStill} />
      ))}
    </div>
  );
}

export default MuscleOrbit;
