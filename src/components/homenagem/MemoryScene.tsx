import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { Rise } from "./shared";

export function MemoryScene({ src, index, total, caption }: { src: string; index: number; total: number; caption?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const reduce = useReducedMotion();
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [30, -30]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], reduce ? [1, 1, 1] : [1.02, 1, 1.02]);

  return (
    <section ref={ref} className="ml-moment" aria-label={`Memória ${index + 1} de ${total}`}>
      <Rise as="figure" className="ml-moment-figure" y={32}>
        <motion.div className="ml-moment-media" style={{ y, scale }}>
          <img src={src} alt="" aria-hidden loading="lazy" className="ml-moment-img" />
        </motion.div>
        <figcaption className="ml-moment-cap">
          <span className="ml-moment-index">{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
          {caption && <span className="ml-moment-note">{caption}</span>}
        </figcaption>
      </Rise>
    </section>
  );
}
