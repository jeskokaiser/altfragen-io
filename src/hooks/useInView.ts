import { useLayoutEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window === 'undefined' ||
  !window.matchMedia ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * 'out' until the element first scrolls into view, then 'in' for good. Returns undefined when
 * motion is reduced or IntersectionObserver is missing, so nothing is ever held back.
 * Spread as data-reveal; see the .stagger rules in index.css.
 */
export function useInView<T extends Element>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [state, setState] = useState<'out' | 'in' | undefined>(undefined);

  // Layout effect: hide before the first paint, so nothing flashes and then disappears.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !('IntersectionObserver' in window)) return;
    setState('out');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('in');
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, state] as const;
}

/**
 * Counts from 0 to `target` once `start` turns true, and holds 0 until then. Pass
 * `start = reveal !== 'out'` so that without motion (reveal undefined) the target shows at once.
 */
export function useCountUp(target: number | undefined, start: boolean, durationMs = 900) {
  const [value, setValue] = useState(target);

  useLayoutEffect(() => {
    if (target === undefined) return;
    if (!start || prefersReducedMotion()) {
      setValue(start ? target : 0);
      return;
    }
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3)))); // ease-out cubic
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, start, durationMs]);

  return value;
}
