import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

/* MemoryScene — 7 mini-Heros cinematográficos.
   Cada foto ocupa uma cena inteira. Sticky + scroll-linked scale/opacity.
   Sem grid, sem carrossel, sem polaroid. A interface desaparece. */

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
  const sceneRef = useRef<HTMLElement | null>(null);
  const [sceneVisible, setSceneVisible] = useState(false);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setSceneVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (total === 0) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const progress = total > 1 ? ((active + 1) / total) * 100 : 100;

  return (
    <section ref={sceneRef} className="ms-scene" aria-label="Memórias">
      <style>{`
        .ms-scene {
          position: relative;
          width: 100%;
          background: ${BG};
          color: ${IVORY};
          overflow: hidden;
        }

        /* Cabeçalho */
        .ms-header {
          position: relative;
          z-index: 2;
          padding: 120px 28px 60px;
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
        .ms-title .accent { color: ${GOLD}; font-style: italic; }
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

        /* Cada foto vive num "wrap" alto que segura o sticky. */
        .ms-wrap {
          position: relative;
          height: 175vh;              /* espaço de scroll por foto */
        }
        .ms-wrap:last-child { height: 120vh; }

        .ms-stage {
          position: sticky;
          top: 0;
          height: 100vh;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Fundo — a própria foto desfocada, empurrando profundidade */
        .ms-bg {
          position: absolute; inset: -8%;
          background-size: cover;
          background-position: center;
          filter: blur(52px) saturate(0.65) brightness(0.42);
          transform: scale(1.2);
          z-index: 0;
        }
        .ms-bg::after {
          content: "";
          position: absolute; inset: 0;
          background:
            radial-gradient(120% 80% at 50% 40%, transparent 40%, rgba(0,0,0,0.55) 100%),
            linear-gradient(180deg, rgba(10,8,6,0.55) 0%, rgba(10,8,6,0.8) 100%);
        }
        .ms-bg-glow {
          position: absolute; inset: 0;
          background: radial-gradient(60% 40% at 50% 20%, rgba(201,161,90,0.08), transparent 70%);
          z-index: 1;
          pointer-events: none;
        }

        /* Conteúdo empilhado da cena */
        .ms-content {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 26px;
          padding: 40px 20px 60px;
        }

        .ms-frame {
          width: 88vw;
          max-width: 540px;
          max-height: 62vh;
          border-radius: 28px;
          overflow: hidden;
          background: #0a0806;
          border: 1px solid rgba(201,161,90,0.20);
          box-shadow:
            0 40px 90px -30px rgba(0,0,0,0.9),
            0 12px 40px -18px rgba(201,161,90,0.12),
            inset 0 0 0 1px rgba(255,255,255,0.02);
        }
        .ms-frame img {
          display: block;
          width: 100%;
          height: auto;
          max-height: 62vh;
          object-fit: contain;
          background: #0a0806;
        }

        .ms-caption-wrap {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
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
        .ms-heart { color: ${GOLD}; font-size: 12px; opacity: 0.9; }
        .ms-index {
          font-family: ${SERIF};
          font-size: 15px;
          letter-spacing: 0.22em;
          color: ${IVORY_SOFT};
          opacity: 0.82;
        }
        .ms-index .num { color: ${GOLD}; }

        /* Barra de progresso fixa — só visível dentro da cena */
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
        .ms-scene[data-visible="true"] .ms-progress { opacity: 1; }
        .ms-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, rgba(201,161,90,0.55), ${GOLD});
          box-shadow: 0 0 8px rgba(201,161,90,0.4);
          transition: width 700ms cubic-bezier(0.22,0.61,0.36,1);
        }

        @media (min-width: 768px) {
          .ms-frame { max-width: 620px; max-height: 68vh; }
          .ms-frame img { max-height: 68vh; }
          .ms-sub { font-size: 21px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ms-wrap { height: auto; }
          .ms-stage { position: relative; height: auto; padding: 80px 0; }
        }
      `}</style>

      <div {...({} as any)} data-visible={sceneVisible} />

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

      {items.map((src, i) => (
        <MemorySlide
          key={i}
          src={src}
          index={i}
          total={total}
          caption={CAPTIONS[i % CAPTIONS.length]}
          neighborLoad={i <= 2}
          onActive={setActive}
          reduce={!!reduce}
        />
      ))}

      <div
        className="ms-progress"
        aria-hidden
        style={{ opacity: sceneVisible ? 1 : 0 }}
      >
        <div className="ms-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}

/* ---------------- Slide ---------------- */
function MemorySlide({
  src,
  index,
  total,
  caption,
  neighborLoad,
  onActive,
  reduce,
}: {
  src: string;
  index: number;
  total: number;
  caption: string;
  neighborLoad: boolean;
  onActive: (i: number) => void;
  reduce: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pad = (n: number) => String(n).padStart(2, "0");

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start end", "end start"],
  });

  // Cena entra 0.15 → 0.4, permanece, sai 0.7 → 0.9
  const scale = useTransform(scrollYProgress, [0.15, 0.4, 0.7, 0.9], [0.97, 1, 1, 0.98]);
  const opacity = useTransform(scrollYProgress, [0.15, 0.35, 0.7, 0.9], [0, 1, 1, 0]);
  const captionOpacity = useTransform(scrollYProgress, [0.25, 0.42, 0.68, 0.85], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0.15, 0.4, 0.7, 0.9], [40, 0, 0, -20]);

  // Detecta cena "ativa" para o indicador global
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      if (v > 0.35 && v < 0.7) onActive(index);
    });
    return () => unsub();
  }, [scrollYProgress, index, onActive]);

  const safeStyle = reduce
    ? undefined
    : ({ scale, opacity, y } as unknown as React.CSSProperties);

  return (
    <div ref={wrapRef} className="ms-wrap">
      <div className="ms-stage">
        <div className="ms-bg" style={{ backgroundImage: `url(${src})` }} />
        <div className="ms-bg-glow" />

        <motion.div className="ms-content" style={safeStyle as any}>
          <div className="ms-frame">
            <img
              src={src}
              alt={`Memória ${index + 1}`}
              loading={neighborLoad ? "eager" : "lazy"}
              decoding="async"
            />
          </div>

          <motion.div
            className="ms-caption-wrap"
            style={reduce ? undefined : ({ opacity: captionOpacity } as any)}
          >
            <p className="ms-caption">“{caption}”</p>
            <span className="ms-heart" aria-hidden>♡</span>
            <span className="ms-index">
              <span className="num">{pad(index + 1)}</span> • {pad(total)}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// Evita warning de import não usado quando TS reclama sobre MotionValue
export type _MV = MotionValue<number>;
