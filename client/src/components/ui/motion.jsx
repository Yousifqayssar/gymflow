import { useEffect, useState } from 'react';
import { animate, m, useReducedMotion } from 'motion/react';

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
