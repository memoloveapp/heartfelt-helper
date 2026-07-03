import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/* EndingScene — mesma identidade visual da MemoryScene:
   fundo warm-dark, ivory + gold, Cormorant Garamond, régua fina. */

const SERIF = '"Cormorant Garamond", "EB Garamond", Georgia, serif';
const SANS = '"Karla", "Inter", system-ui, -apple-system, sans-serif';
const IVORY = "#F3ECDD";
const IVORY_SOFT = "#EFE7D6";
const GOLD = "#C9A15A";
const GOLD_WARM = "#D8B472";
const GOLD_SOFT = "rgba(201,161,90,0.55)";
const EASE = [0.16, 0.84, 0.24, 1] as const;

export function EndingScene({ sender: _sender }: { sender: string }) {
  const reduce = useReducedMotion();
  const [dim, setDim] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDim(true), 16000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.section
      aria-label="Encerramento"
      className="es-scene"
      initial={{ opacity: 1 }}
      animate={{ opacity: dim ? 0.55 : 1 }}
      transition={{ duration: 7, ease: "linear" }}
    >
      <div className="es-grain" aria-hidden />
      <div className="es-vignette" aria-hidden />
      <div className="es-beam" aria-hidden />
      <Particles />

      <div className="es-inner">
        <motion.p
          className="es-line"
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 2.4, ease: EASE, delay: 0.4 }}
        >
          Os momentos passam.
        </motion.p>

        <motion.p
          className="es-line"
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 2.4, ease: EASE, delay: 2.8 }}
        >
          O amor <span className="es-accent">permanece.</span>
        </motion.p>

        <motion.div
          className="es-rule"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.2, ease: EASE, delay: 5.0 }}
          aria-hidden
        >
          <span className="es-rule-line" />
          <span className="es-rule-heart">♥</span>
          <span className="es-rule-line" />
        </motion.div>

        <motion.div
          className="es-heart-wrap"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 3.4, ease: EASE, delay: 6.0 }}
        >
          <motion.div
            animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
            transition={{
              duration: 3,
              ease: EASE,
              delay: 9.6,
              times: [0, 0.5, 1],
              repeat: 0,
            }}
            style={{ transformOrigin: "center" }}
          >
            <BigHeart />
          </motion.div>
        </motion.div>

        <motion.p
          className="es-whisper"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2.4, ease: EASE, delay: 9.0 }}
        >
          Até a próxima memória.
        </motion.p>

        <motion.div
          className="es-seal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 3, ease: EASE, delay: 11.2 }}
        >
          <span className="es-seal-heart">♥</span>
          <div className="es-seal-row">
            <span className="es-seal-line" />
            <span className="es-seal-name">memolove</span>
            <span className="es-seal-line" />
          </div>
        </motion.div>
      </div>

      <style>{`
        .es-scene {
          position: relative;
          width: 100%;
          min-height: 100vh;
          padding: 120px 24px 140px;
          color: ${IVORY};
          overflow: hidden;
          isolation: isolate;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(70% 45% at 50% 8%, rgba(212,168,92,0.10), transparent 60%),
            radial-gradient(70% 40% at 22% 92%, rgba(180,130,60,0.05), transparent 65%),
            radial-gradient(140% 90% at 50% 50%, #120d08 0%, #0a0705 45%, #050302 100%);
        }
        .es-grain {
          position: absolute; inset: 0;
          background:
            repeating-linear-gradient(118deg, rgba(255,240,210,0.018) 0 1px, transparent 1px 4px),
            repeating-linear-gradient(62deg, rgba(0,0,0,0.30) 0 1px, transparent 1px 5px);
          mix-blend-mode: overlay;
          opacity: 0.7;
          pointer-events: none;
          z-index: 1;
        }
        .es-vignette {
          position: absolute; inset: 0;
          background:
            radial-gradient(70% 55% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 82%, rgba(0,0,0,0.9) 100%);
          pointer-events: none;
          z-index: 1;
        }
        .es-beam {
          position: absolute;
          top: -140px;
          left: 50%;
          transform: translateX(-50%);
          width: min(460px, 82%);
          height: 460px;
          background: radial-gradient(ellipse at 50% 0%, rgba(216,180,114,0.10) 0%, rgba(216,180,114,0.03) 32%, transparent 65%);
          filter: blur(10px);
          pointer-events: none;
          z-index: 1;
        }

        .es-inner {
          position: relative;
          z-index: 2;
          max-width: 520px;
          width: 100%;
          text-align: center;
        }

        .es-line {
          margin: 0;
          font-family: ${SERIF};
          font-weight: 500;
          font-size: clamp(28px, 7vw, 42px);
          line-height: 1.18;
          letter-spacing: -0.015em;
          color: ${IVORY};
        }
        .es-line + .es-line { margin-top: 10px; }
        .es-accent {
          color: ${GOLD_WARM};
          font-style: italic;
        }

        .es-rule {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; margin: 36px auto 0; max-width: 220px;
        }
        .es-rule-line { flex: 1; height: 1px; background: ${GOLD_SOFT}; }
        .es-rule-heart {
          color: ${GOLD};
          font-size: 12px;
          line-height: 1;
          text-shadow: 0 0 6px rgba(216,180,114,0.35);
        }

        .es-heart-wrap {
          margin: 32px auto 0;
          display: flex;
          justify-content: center;
        }

        .es-whisper {
          margin: 36px auto 0;
          font-family: ${SERIF};
          font-style: italic;
          font-weight: 400;
          font-size: clamp(15px, 3.8vw, 19px);
          line-height: 1.5;
          letter-spacing: 0.005em;
          color: ${IVORY_SOFT};
          opacity: 0.85;
        }

        .es-seal {
          margin-top: 88px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .es-seal-heart {
          color: ${GOLD};
          font-size: 12px;
          line-height: 1;
          opacity: 0.85;
        }
        .es-seal-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .es-seal-line {
          display: block;
          width: 28px;
          height: 1px;
          background: ${GOLD_SOFT};
        }
        .es-seal-name {
          font-family: ${SANS};
          font-size: 10px;
          letter-spacing: 0.55em;
          text-transform: uppercase;
          color: ${GOLD};
          opacity: 0.9;
        }

        @media (min-width: 768px) {
          .es-scene { padding: 160px 40px 180px; }
          .es-seal { margin-top: 112px; }
        }
      `}</style>
    </motion.section>
  );
}

function BigHeart() {
  return (
    <svg
      width="176"
      height="160"
      viewBox="0 0 200 180"
      fill="none"
      aria-hidden
      style={{
        filter:
          "drop-shadow(0 0 6px rgba(216,180,114,0.4)) drop-shadow(0 0 18px rgba(201,161,90,0.15))",
      }}
    >
      <defs>
        <linearGradient id="es-heart-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E9C68A" />
          <stop offset="55%" stopColor={GOLD_WARM} />
          <stop offset="100%" stopColor="#9C7B3E" />
        </linearGradient>
      </defs>
      <path
        d="M100 168 C 40 128, 8 92, 8 58 C 8 30, 30 12, 56 12 C 76 12, 92 24, 100 42 C 108 24, 124 12, 144 12 C 170 12, 192 30, 192 58 C 192 92, 160 128, 100 168 Z"
        stroke="url(#es-heart-grad)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function Particles() {
  const pts = [
    { l: 14, t: 26, s: 1.2, o: 0.16, d: 8 },
    { l: 84, t: 22, s: 1, o: 0.13, d: 9 },
    { l: 26, t: 72, s: 1, o: 0.15, d: 8.5 },
    { l: 76, t: 78, s: 1.2, o: 0.17, d: 10 },
    { l: 50, t: 90, s: 0.9, o: 0.11, d: 7.5 },
    { l: 8, t: 54, s: 0.9, o: 0.13, d: 9.5 },
  ];
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
      {pts.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, p.o, 0] }}
          transition={{
            duration: p.d,
            repeat: Infinity,
            delay: (i * 0.7) % 4,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: `${p.l}%`,
            top: `${p.t}%`,
            width: p.s,
            height: p.s,
            borderRadius: "50%",
            background: GOLD_WARM,
            boxShadow: `0 0 ${p.s * 2}px rgba(216,180,114,0.35)`,
          }}
        />
      ))}
    </div>
  );
}
