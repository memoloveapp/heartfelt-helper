import { motion, useReducedMotion } from "motion/react";

/* HeroScene — primeiro frame de um filme
   props: { name, photo, ready? } */

const DISPLAY = '"Cormorant Garamond", Georgia, serif';
const SUB = '"Instrument Serif", "Cormorant Garamond", Georgia, serif';

export function HeroScene({ name, photo }: { name: string; photo: string; ready?: boolean }) {
  const reduce = useReducedMotion();
  const displayName = name || "você";

  return (
    <section className="hero-scene" aria-label="Abertura">
      <style>{`
        .hero-scene {
          position: relative;
          width: 100%;
          height: 100svh;
          min-height: 100svh;
          overflow: hidden;
          background: #0a0806;
          color: #fff;
        }
        .hero-photo {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover; object-position: center;
          display: block;
          will-change: transform;
        }
        .hero-layer { position: absolute; inset: 0; pointer-events: none; }
        .hero-layer-1 { background: rgba(0,0,0,0.20); }
        .hero-layer-2 {
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,0.08) 0%,
            rgba(0,0,0,0) 42%,
            rgba(0,0,0,0) 58%,
            rgba(0,0,0,0.72) 100%
          );
        }
        .hero-layer-3 {
          background: radial-gradient(
            ellipse at center,
            rgba(0,0,0,0) 55%,
            rgba(0,0,0,0.22) 100%
          );
        }

        .hero-content {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          z-index: 2;
          padding: 28px 28px 96px;
        }
        @media (min-width: 768px) {
          .hero-content { padding: 72px 72px 96px; }
        }
        .hero-inner {
          max-width: 1100px;
          margin: 0 auto;
        }

        .hero-eyebrow {
          margin: 0 0 18px;
          font-family: "Karla", system-ui, sans-serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.45em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.82);
        }

        .hero-name {
          margin: 0;
          font-family: ${DISPLAY};
          font-weight: 500;
          font-size: 56px;
          line-height: 0.92;
          letter-spacing: -0.02em;
          color: #FFFFFF;
        }
        @media (min-width: 768px) {
          .hero-name { font-size: clamp(72px, 10vw, 126px); }
        }

        .hero-rule {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 28px 0 24px;
        }
        .hero-rule-line {
          width: 80px; height: 1px;
          background: rgba(255,255,255,0.35);
        }
        .hero-rule-heart {
          color: #E7C58A;
          font-size: 12px;
          line-height: 1;
        }

        .hero-sub {
          margin: 8px 0 0;
          max-width: 560px;
          font-family: ${SUB};
          font-size: 22px;
          line-height: 1.45;
          color: rgba(255,255,255,0.92);
        }
        @media (min-width: 768px) {
          .hero-sub { font-size: 30px; }
        }

        .hero-scroll {
          position: absolute;
          left: 50%;
          bottom: 28px;
          transform: translateX(-50%);
          z-index: 3;
          opacity: 0.45;
          color: #fff;
          animation: hero-scroll-bob 2.8s ease-in-out infinite;
        }
        @keyframes hero-scroll-bob {
          0%, 100% { transform: translate(-50%, 0); }
          50%      { transform: translate(-50%, 8px); }
        }

        @keyframes hero-ken-burns {
          from { transform: scale(1.08); }
          to   { transform: scale(1.00); }
        }
        .hero-photo--anim {
          animation: hero-ken-burns 8s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-photo--anim { animation: none; transform: none; }
          .hero-scroll { animation: none; }
        }
      `}</style>

      {photo && (
        <img
          className={`hero-photo ${reduce ? "" : "hero-photo--anim"}`}
          src={photo}
          alt=""
          aria-hidden
          loading="eager"
          {...({ fetchpriority: "high" } as any)}
        />
      )}

      <div className="hero-layer hero-layer-1" />
      <div className="hero-layer hero-layer-2" />
      <div className="hero-layer hero-layer-3" />

      <div className="hero-content">
        <div className="hero-inner">
          <motion.p
            className="hero-eyebrow"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
          >
            Para o meu
          </motion.p>

          <motion.h1
            className="hero-name"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.35 }}
          >
            {displayName}
          </motion.h1>

          <motion.div
            className="hero-rule"
            aria-hidden
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.55 }}
          >
            <span className="hero-rule-line" />
            <span className="hero-rule-heart">♥</span>
            <span className="hero-rule-line" />
          </motion.div>

          <motion.p
            className="hero-sub"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.7 }}
          >
            Algumas histórias merecem
            <br />
            ser lembradas para sempre.
          </motion.p>
        </div>
      </div>

      <div className="hero-scroll" aria-hidden>
        <svg width="18" height="24" viewBox="0 0 18 24" fill="none">
          <path d="M9 3v17M2 14l7 7 7-7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
