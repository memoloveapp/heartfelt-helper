import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

export const PAPER = "#F4EFE6";
export const PAPER_DEEP = "#EDE6D8";
export const GRAPHITE = "#2A2622";
export const GRAPHITE_SOFT = "#6B625A";
export const GOLD = "#9C7B3E";

export const SERIF = '"Cormorant Garamond", "Fraunces", Georgia, serif';
export const SANS = '"Karla", "Inter", system-ui, -apple-system, sans-serif';

export const EASE = [0.16, 0.84, 0.24, 1] as const;

export function Rise({
  children,
  delay = 0,
  y = 20,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  const reduce = useReducedMotion();
  const MotionTag = motion(Tag as any);
  return (
    <MotionTag
      ref={ref as any}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: "blur(6px)" }}
      animate={inView ? (reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }) : undefined}
      transition={{ duration: reduce ? 0.4 : 1.4, ease: EASE, delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
