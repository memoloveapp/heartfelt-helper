import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { EASE, Rise } from "./shared";

function useImageLuminance(src: string): "dark" | "light" | "unknown" {
  const [mode, setMode] = useState<"dark" | "light" | "unknown">("unknown");
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = (canvas.width = 32);
        const h = (canvas.height = 32);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        }
        const avg = sum / (data.length / 4);
        setMode(avg < 128 ? "dark" : "light");
      } catch {
        setMode("dark");
      }
    };
    img.onerror = () => setMode("dark");
    img.src = src;
  }, [src]);
  return mode;
}

export function HeroScene({ name, photo, ready }: { name: string; photo: string; ready: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const reduce = useReducedMotion();
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 120]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.02, 1.1]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -40]);
  const lum = useImageLuminance(photo);
  const isLight = lum === "light";

  return (
    <section ref={ref} className="ml-hero" aria-label="Abertura">
      <motion.div className="ml-hero-photo" style={{ y, scale }}>
        {photo && (
          <img
            src={photo}
            alt=""
            aria-hidden
            loading="eager"
            {...({ fetchpriority: "high" } as any)}
            className="ml-hero-img"
          />
        )}
        <div className={`ml-hero-veil ${isLight ? "is-light" : "is-dark"}`} aria-hidden />
      </motion.div>

      <motion.div className="ml-hero-content" style={{ opacity: contentOpacity, y: contentY }}>
        <motion.p
          className="ml-hero-eyebrow"
          initial={{ opacity: 0, y: 10 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.4, ease: EASE, delay: 0.3 }}
        >
          para
        </motion.p>

        <motion.h1
          className="ml-hero-name"
          initial={{ opacity: 0, y: 24, filter: "blur(14px)" }}
          animate={ready ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 1.8, ease: EASE, delay: 0.55 }}
        >
          {name || "você"}
        </motion.h1>

        <motion.div
          className="ml-hero-rule"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={ready ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 1.2, ease: EASE, delay: 1.3 }}
          aria-hidden
        >
          <span />
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 20s-7-4.5-9.5-9.2C.9 7.5 3 3.7 6.5 3.7c1.9 0 3.9 1 5.5 3 1.6-2 3.6-3 5.5-3 3.5 0 5.6 3.8 4 7.1C19 15.5 12 20 12 20z" />
          </svg>
          <span />
        </motion.div>

        <motion.p
          className="ml-hero-sub"
          initial={{ opacity: 0, y: 10 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.4, ease: EASE, delay: 1.8 }}
        >
          feito com todo o tempo do mundo
        </motion.p>
      </motion.div>

      <motion.div
        className="ml-hero-scroll"
        style={{ opacity: contentOpacity }}
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 0.45 } : {}}
        transition={{ duration: 1.6, ease: EASE, delay: 2.4 }}
        aria-hidden
      >
        <span className="ml-hero-scroll-line" />
      </motion.div>
    </section>
  );
}

export function Whisper({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <section className="ml-whisper" aria-hidden>
      <Rise as="p" className="ml-whisper-text" delay={delay}>{text}</Rise>
    </section>
  );
}
