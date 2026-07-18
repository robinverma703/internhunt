"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * A minimal ring cursor that trails the pointer with a spring, and grows
 * on hover over interactive elements. Disabled on touch devices and when
 * the user prefers reduced motion.
 */
export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const cx = useMotionValue(-100);
  const cy = useMotionValue(-100);
  const springX = useSpring(cx, { damping: 28, stiffness: 320, mass: 0.4 });
  const springY = useSpring(cy, { damping: 28, stiffness: 320, mass: 0.4 });
  const raf = useRef<number>();

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    setEnabled(true);
    document.body.classList.add("cursor-active");

    const move = (e: MouseEvent) => {
      cx.set(e.clientX - 14);
      cy.set(e.clientY - 14);
      const target = e.target as HTMLElement;
      setHovering(!!target.closest("a, button, [data-cursor-hover]"));
    };
    window.addEventListener("mousemove", move);

    return () => {
      window.removeEventListener("mousemove", move);
      document.body.classList.remove("cursor-active");
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [cx, cy]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[999] rounded-full border border-graphite/70 mix-blend-difference"
      style={{
        x: springX,
        y: springY,
        width: 28,
        height: 28,
        borderColor: "white",
      }}
      animate={{ scale: hovering ? 1.8 : 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    />
  );
}
