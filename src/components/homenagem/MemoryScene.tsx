import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/* MemoryScene — Exposição cinematográfica de fotografias.
   Cada foto ocupa sua própria cena. Scroll natural. Interface desaparece. */

const SERIF = '"Cormorant Garamond", "EB Garamond", Georgia, serif';
const SCRIPT = '"Great Vibes", "Allura", "Dancing Script", cursive';
const SANS = '"Karla", "Inter", system-ui, sans-serif';
const EASE = [0.22, 0.61, 0.36, 1] as const;

const IVORY = "#F3ECDD";
const IVORY_SOFT = "#EFE7D6";
const GOLD = "#C9A15A";
const GOLD_SOFT = "rgba(201,161,90,0.55)";
const BG = "#0a0806";

const CAPTIONS = [
  "Cada instante contigo virou eternidade.",
  "O tempo passa, mas você permanece.",
  "Nos pequenos gestos, o amor inteiro.",
  "Guardei cada sorriso como tesouro.",
  "Onde você está, é sempre casa.",
  "As melhores histórias começam contigo.",
  "Para sempre, no mesmo abraço.",
];

export function MemoryScene({ photos }: { photos: string[] }) {
  const items = photos.filter(Boolean).slice(0, 7);
  const total = items.length;
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (total === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        let best = { idx: active, ratio: 0 };
        entries.forEach((e) => {
          const idx = Number((e.target as HTMLElement).dataset.idx);
          if (e.intersectionRatio > best.ratio) best = { idx, ratio: e.intersectionRatio };
        });
        if (best.ratio > 0) setActive(best.idx);
      },
      { threshold: [0.35, 0.55, 0.75] }
    );
    slideRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [total]); // eslint-disable-line react-hooks/exhaustive-deps

  if (total === 0) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const progress = total > 1 ? ((active + 1) / total) * 100 : 100;

  return (
    <section className="ms-scene" aria-label="Memórias">
      <style>{`
        .ms-scene {
          position: relative;
          width: 100%;
          background: ${BG};
          color: ${IVORY};
          overflow: hidden;
        }
        .ms-scene::before {
          content: "";
          position: absolute; inset: 0;
          background:
            radial-gradient(120% 80% at 50% 0%, rgba(201,161,90,0.06) 0%, transparent 55%),
            radial-gradient(100% 60% at 50% 100%, rgba(0,0,0,0.5) 0%, transparent 60%);
          pointer-events: none;
          z-index: 1;
        }

        .ms-header {
          position: relative;
          z-index: 2;
          padding: 120px 28px 40px;
          text-align: center;
        }
        .ms-title {
          margin: 0;
          font-family: ${SERIF};
          font-weight: 500;
          font-size: clamp(38px, 9vw, 58px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: ${IVORY};
        }
        .ms-title .accent {
          color: ${GOLD};
          font-style: italic;
        }
        .ms-rule {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin: 22px auto 20px; max-width: 260px;
        }
        .ms-rule-line { flex: 1; height: 1px; background: ${GOLD_SOFT}; }
        .ms-rule-heart { color: ${GOLD}; font-size: 10px; }
        .ms-sub {
          margin: 0 auto;
          max-width: 460px;
          font-family: ${SERIF};
          font-size: 19px;
          line-height: 1.45;
          color: ${IVORY_SOFT};
          opacity: 0.88;
        }

        .ms-track {
          position: relative;
          z-index: 2;
        }

        .ms-slide {
          position: relative;
          min-height: 100vh;
          padding: 40px 28px 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 28px;
        }

        .ms-bg {
          position: absolute; inset: 0;
          background-size: cover;
          background-position: center;
          filter: blur(48px) saturate(0.7) brightness(0.45);
          opacity: 0.55;
          transform: scale(1.15);
          z-index: 0;
        }
        .ms-bg::after {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(10,8,6,0.55) 0%, rgba(10,8,6,0.75) 100%);
        }

        .ms-frame {
          position: relative;
          z-index: 1;
          width: 84vw;
          max-width: 520px;
          max-height: 72vh;
          border-radius: 28px;
          overflow: hidden;
          background: #0f0c09;
          border: 1px solid rgba(201,161,90,0.18);
          box-shadow:
            0 30px 80px -30px rgba(0,0,0,0.85),
            0 10px 40px -20px rgba(201,161,90,0.10),
            inset 0 0 0 1px rgba(255,255,255,0.02);
        }
        .ms-frame img {
          display: block;
          width: 100%;
          height: auto;
          max-height: 72vh;
          object-fit: contain;
          background: #0a0806;
        }

        .ms-caption-wrap {
          position: relative;
          z-index: 1;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          max-width: 84vw;
        }
        .ms-caption {
          margin: 0;
          font-family: ${SCRIPT};
          font-size: clamp(24px, 6.5vw, 30px);
          line-height: 1.25;
          color: ${IVORY};
          font-weight: 400;
        }
        .ms-heart {
          color: ${GOLD};
          font-size: 12px;
          opacity: 0.9;
        }
        .ms-index {
          font-family: ${SERIF};
          font-size: 15px;
          letter-spacing: 0.18em;
          color: ${IVORY_SOFT};
          opacity: 0.78;
        }
        .ms-index .num { color: ${GOLD}; }

        .ms-hint {
          position: relative;
          z-index: 1;
          margin-top: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: ${GOLD};
          opacity: 0.55;
          font-family: ${SANS};
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
        }
        .ms-hint svg { animation: ms-bob 2400ms ease-in-out infinite; }
        @keyframes ms-bob {
          0%,100% { transform: translateY(0); opacity: 0.7; }
          50%     { transform: translateY(4px); opacity: 1; }
        }

        .ms-progress {
          position: fixed;
          left: 0; right: 0;
          bottom: 0;
          height: 2px;
          background: rgba(255,255,255,0.05);
          z-index: 40;
          pointer-events: none;
          opacity: 0;
          transition: opacity 500ms ease;
        }
        .ms-scene.is-visible .ms-progress { opacity: 1; }
        .ms-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, rgba(201,161,90,0.6), ${GOLD});
          box-shadow: 0 0 8px rgba(201,161,90,0.4);
          transition: width 900ms cubic-bezier(0.22,0.61,0.36,1);
        }

        @media (min-width: 768px) {
          .ms-frame { max-width: 560px; }
          .ms-sub { font-size: 21px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ms-hint svg { animation: none; }
        }
      `}</style>

      <header className="ms-header">
        <motion.h2
          className="ms-title"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.6, ease: EASE }}
        >
          Memórias que <br /> o tempo não <span className="accent">apaga.</span>
        </motion.h2>
        <div className="ms-rule" aria-hidden>
          <span className="ms-rule-line" />
          <span className="ms-rule-heart">♥</span>
          <span className="ms-rule-line" />
        </div>
        <motion.p
          className="ms-sub"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.25 }}
        >
          Cada foto guarda um pedaço da nossa história.
        </motion.p>
      </header>

      <div className="ms-track">
        {items.map((src, i) => {
          const caption = CAPTIONS[i % CAPTIONS.length];
          const isLast = i === total - 1;
          const priority = i <= 1 ? "eager" : "lazy";
          return (
            <section
              key={i}
              data-idx={i}
              ref={(el) => { slideRefs.current[i] = el; }}
              className="ms-slide"
            >
              <div className="ms-bg" style={{ backgroundImage: `url(${src})` }} />

              <motion.div
                className="ms-frame"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
                whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-15% 0px" }}
                transition={{ duration: 1.6, ease: EASE }}
              >
                <img
                  src={src}
                  alt={`Memória ${i + 1}`}
                  loading={priority as "eager" | "lazy"}
                  decoding="async"
                />
              </motion.div>

              <motion.div
                className="ms-caption-wrap"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
                whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-15% 0px" }}
                transition={{ duration: 1.6, ease: EASE, delay: 0.3 }}
              >
                <p className="ms-caption">“{caption}”</p>
                <span className="ms-heart" aria-hidden>♡</span>
                <span className="ms-index">
                  <span className="num">{pad(i + 1)}</span> • {pad(total)}
                </span>
              </motion.div>

              {!isLast && (
                <div className="ms-hint" aria-hidden>
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                    <path d="M1 1l6 7 6-7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>deslize</span>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <VisibilityProgress progress={progress} />
    </section>
  );
}

/* Barra de progresso fixa — visível apenas enquanto a cena está no viewport. */
function VisibilityProgress({ progress }: { progress: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const scene = document.querySelector(".ms-scene");
    if (!scene) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        scene.classList.toggle("is-visible", entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    obs.observe(scene);
    return () => obs.disconnect();
  }, []);
  return (
    <div className="ms-progress" ref={ref} aria-hidden>
      <div className="ms-progress-fill" style={{ width: `${progress}%` }} />
    </div>
  );
}
