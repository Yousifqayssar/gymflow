import { useEffect, useState } from 'react';
import { animate, m, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';

// Small animation building blocks (library: Motion, https://motion.dev), used across the app.
// We use `m.div` instead of `motion.div`: together with <LazyMotion> in main.jsx it only loads
// the animation features we need, which keeps the app download smaller.
// <MotionConfig reducedMotion="user"> in main.jsx turns movement off for people who ask their
// system for less motion; the components below also show the final state straight away then.

const EASE_OUT = [0.22, 1, 0.36, 1]; // fast start, soft landing – feels natural for things appearing

// A number that counts up from 0 when it first appears, e.g. "210" points or "9" active members.
export function AnimatedNumber({ value, duration = 0.8 }) {
  const shouldReduceMotion = useReducedMotion();
  const isNumber = typeof value === 'number';
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!isNumber || shouldReduceMotion) return;
    const controls = animate(0, value, { duration, ease: EASE_OUT, onUpdate: (n) => setShown(Math.round(n)) });
    return () => controls.stop();
  }, [value, isNumber, duration, shouldReduceMotion]);

  // Not a number (e.g. the level "Silver"), or no motion wanted: show the value as it is.
  if (!isNumber || shouldReduceMotion) return value;
  return shown;
}

// The coloured part of a progress bar, growing from the left to `percent`.
// It animates `scaleX` (not `width`): the browser can do that without recalculating the layout.
export function ProgressFill({ percent, className = '', delay = 0.2 }) {
  return (
    <m.div
      className={`h-full origin-left rounded-full ${className}`}
      style={{ width: `${percent}%` }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.9, delay, ease: EASE_OUT }}
    />
  );
}

// Parent + children that fade in one after another ("stagger"), e.g. the four stat cards.
//   <Stagger className="grid …"><StaggerItem>…</StaggerItem>…</Stagger>
// `as` lets the parent be a <ul> and the children <li>.
const staggerParent = { hidden: {}, shown: { transition: { staggerChildren: 0.06 } } };
const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
};

export function Stagger({ as = 'div', className, children }) {
  const Component = m[as];
  return (
    <Component className={className} variants={staggerParent} initial="hidden" animate="shown">
      {children}
    </Component>
  );
}

export function StaggerItem({ as = 'div', className, children }) {
  const Component = m[as];
  return (
    <Component className={className} variants={staggerChild}>
      {children}
    </Component>
  );
}

// Every page slides up a little and fades in when it is opened.
export function PageTransition({ children }) {
  return (
    <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }}>
      {children}
    </m.div>
  );
}

// Only devices with a real mouse get the 3D tilt: on touch screens there is no "hover", and a
// tilting card under your finger feels broken. Read once, when the app starts.
const CAN_HOVER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const TILT_SPRING = { stiffness: 300, damping: 25 };

// A card that tilts in 3D towards the mouse, with a soft light reflection ("glare") under the pointer.
//   <TiltCard className="h-full"><ClassCard … /></TiltCard>
// `maxTilt` is the largest angle in degrees. Off for touch screens and for "reduce motion".
export function TiltCard({ children, className = '', maxTilt = 7 }) {
  const shouldReduceMotion = useReducedMotion();
  // Pointer position inside the card, from 0 (left/top) to 1 (right/bottom); 0.5 = centre = no tilt.
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  // Springs make the card follow the pointer smoothly instead of jumping.
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [maxTilt, -maxTilt]), TILT_SPRING);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-maxTilt, maxTilt]), TILT_SPRING);
  const glareX = useTransform(pointerX, (v) => v * 100);
  const glareY = useTransform(pointerY, (v) => v * 100);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgb(255 255 255 / 0.22), transparent 55%)`;

  if (shouldReduceMotion || !CAN_HOVER) {
    return <div className={className}>{children}</div>;
  }

  function handlePointerMove(event) {
    const box = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - box.left) / box.width);
    pointerY.set((event.clientY - box.top) / box.height);
  }

  function handlePointerLeave() {
    pointerX.set(0.5);
    pointerY.set(0.5);
  }

  return (
    // perspective: how "deep" the 3D space is; smaller = stronger effect.
    <div className={`group/tilt ${className}`} style={{ perspective: 900 }}>
      <m.div
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{ rotateX, rotateY }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="relative h-full"
      >
        {children}
        <m.div
          aria-hidden="true"
          style={{ background: glare }}
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
        />
      </m.div>
    </div>
  );
}
