import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

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
  const sectionRef = useRef<HTMLElement>(null);
  // Dispara cedo — enquanto a última foto ainda está saindo de cena,
  // a Ending já começa a nascer. Sem "carregou nova tela".
  const inView = useInView(sectionRef, { once: true, amount: 0.05 });
  const animate = (target: any) => (inView ? target : undefined);


  return (
    <section ref={sectionRef} aria-label="Encerramento" className="es-scene">
      <div className="es-grain" aria-hidden />
      <div className="es-vignette" aria-hidden />
      <div className="es-beam" aria-hidden />
      <Particles />

      <div className="es-inner">
        <p className="es-line">
          <Words text="Os momentos passam." startDelay={0.0} play={inView} />
        </p>

        <p className="es-line">
          <Words
            text="O amor permanece."
            startDelay={0.15}
            accentFromIndex={2}
            play={inView}
          />
        </p>

        <motion.div
          className="es-rule"
          initial={{ opacity: 0, scaleX: 0.4 }}
          animate={animate({ opacity: 1, scaleX: 1 })}
          transition={{ duration: 1.2, ease: EASE, delay: 0.9 }}
          aria-hidden
        >
          <span className="es-rule-line" />
          <span className="es-rule-heart">♥</span>
          <span className="es-rule-line" />
        </motion.div>

        <motion.div
          className="es-heart-wrap"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={animate({ opacity: 1, scale: 1 })}
          transition={{ duration: 1.8, ease: EASE, delay: 1.1 }}
        >
          <motion.div
            animate={
              inView && !reduce ? { scale: [1, 1.035, 1] } : undefined
            }
            transition={{
              duration: 4.6,
              ease: "easeInOut",
              delay: 3.0,
              repeat: Infinity,
              repeatType: "loop",
            }}
            style={{ transformOrigin: "center", position: "relative" }}
          >
            <BigHeart play={inView} />
          </motion.div>
        </motion.div>

        <motion.p
          className="es-whisper"
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={animate({ opacity: 1, y: 0, filter: "blur(0px)" })}
          transition={{ duration: 1.4, ease: EASE, delay: 2.0 }}
        >
          Até a próxima memória.
        </motion.p>

        <motion.div
          className="es-seal"
          initial={{ opacity: 0, y: 6 }}
          animate={animate({ opacity: 1, y: 0 })}
          transition={{ duration: 1.6, ease: EASE, delay: 2.6 }}
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
          /* Sem margin negativa: as duas cenas terminam/começam
             no MESMO preto (#050302), então encostam sem costura. */
          padding: 40px 24px 120px;
          color: ${IVORY};
          overflow: hidden;
          isolation: isolate;
          display: flex;
          align-items: center;
          justify-content: center;
          /* A Ending não cria fundo próprio: ela deixa o fundo compartilhado
             da sequência Memory → Ending aparecer sem reiniciar a tonalidade. */
          background: transparent;
        }


        .es-grain {
          display: none;
          pointer-events: none;
          z-index: 1;
        }
        .es-vignette {
          display: none;
          pointer-events: none;
          z-index: 1;
        }
        .es-beam {
          position: absolute;
          top: 40px;
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
        .es-word {
          display: inline-block;
          will-change: transform, opacity, filter;
        }
        .es-accent {
          color: ${GOLD_WARM};
          font-style: italic;
        }

        .es-heart-svg {
          position: relative;
          display: inline-block;
          line-height: 0;
        }
        .es-heart-halo {
          position: absolute;
          inset: -22%;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 52%, rgba(232,192,121,0.38) 0%, rgba(216,180,114,0.14) 35%, rgba(216,180,114,0.04) 60%, rgba(216,180,114,0) 75%);
          filter: blur(20px);
          pointer-events: none;
          z-index: 0;
        }
        .es-heart-shadow {
          position: absolute;
          left: 50%;
          bottom: -14%;
          width: 78%;
          height: 22px;
          transform: translateX(-50%);
          background: radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0) 75%);
          filter: blur(10px);
          pointer-events: none;
          z-index: 0;
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
          .es-scene { padding: 60px 40px 160px; }
          .es-seal { margin-top: 112px; }
        }
      `}</style>
    </section>
  );
}

function Words({
  text,
  startDelay = 0,
  accentFromIndex,
  play = true,
}: {
  text: string;
  startDelay?: number;
  accentFromIndex?: number;
  play?: boolean;
}) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => {
        const isAccent =
          typeof accentFromIndex === "number" && i >= accentFromIndex;
        return (
          <motion.span
            key={i}
            className={isAccent ? "es-word es-accent" : "es-word"}
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            animate={
              play ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined
            }
            transition={{
              duration: 0.9,
              ease: EASE,
              delay: startDelay + i * 0.12,

            }}
          >
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        );
      })}
    </>
  );
}

function BigHeart({ play = true }: { play?: boolean }) {
  // Coração refinado, simétrico, com curvas mais suaves
  const heartPath =
    "M100 172 C 42 132, 6 96, 6 58 C 6 28, 28 8, 54 8 C 76 8, 92 22, 100 44 C 108 22, 124 8, 146 8 C 172 8, 194 28, 194 58 C 194 96, 158 132, 100 172 Z";
  // Reflexo/sheen no lóbulo esquerdo (arco superior)
  const sheenPath = "M 30 40 C 40 22, 62 18, 82 30";

  return (
    <div className="es-heart-svg">
      {/* halo pulsante */}
      <motion.div
        className="es-heart-halo"
        aria-hidden
        animate={play ? { opacity: [0.4, 0.75, 0.4], scale: [1, 1.09, 1] } : undefined}
        transition={{ duration: 4.6, ease: "easeInOut", repeat: Infinity }}
      />

      {/* sombra ambiente logo abaixo */}
      <div className="es-heart-shadow" aria-hidden />

      <svg
        width="196"
        height="180"
        viewBox="0 0 200 180"
        fill="none"
        aria-hidden
        style={{
          position: "relative",
          filter:
            "drop-shadow(0 8px 22px rgba(0,0,0,0.55)) drop-shadow(0 0 14px rgba(216,180,114,0.55)) drop-shadow(0 0 32px rgba(201,161,90,0.28))",
        }}
      >
        <defs>
          {/* gradiente principal — dourado com reflexo quente */}
          <linearGradient id="es-heart-grad" x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#FBE6B2" />
            <stop offset="30%" stopColor="#E8C079" />
            <stop offset="55%" stopColor={GOLD_WARM} />
            <stop offset="80%" stopColor="#A87E3E" />
            <stop offset="100%" stopColor="#6E4E24" />
          </linearGradient>
          {/* gradiente do halo externo do traço */}
          <linearGradient id="es-heart-outer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(241,214,160,0.55)" />
            <stop offset="100%" stopColor="rgba(158,116,58,0.35)" />
          </linearGradient>
        </defs>

        {/* 1. Halo externo bem difuso */}
        <motion.path
          d={heartPath}
          stroke="url(#es-heart-outer)"
          strokeWidth="8"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={play ? { pathLength: 1, opacity: 0.9 } : undefined}
          transition={{
            pathLength: { duration: 3.4, ease: EASE },
            opacity: { duration: 1.2, ease: EASE },
          }}
          style={{ filter: "blur(6px)" }}
        />

        {/* 2. Halo médio */}
        <motion.path
          d={heartPath}
          stroke="rgba(232,192,121,0.55)"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={play ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{
            pathLength: { duration: 3.2, ease: EASE, delay: 0.1 },
            opacity: { duration: 1, ease: EASE, delay: 0.1 },
          }}
          style={{ filter: "blur(2px)" }}
        />

        {/* 3. Contorno principal — traço nítido com gradiente */}
        <motion.path
          d={heartPath}
          stroke="url(#es-heart-grad)"
          strokeWidth="1.9"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={play ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{
            pathLength: { duration: 3.2, ease: EASE, delay: 0.2 },
            opacity: { duration: 0.8, ease: EASE, delay: 0.2 },
          }}
        />

        {/* 4. Fio interno mais claro — dá volume ao contorno */}
        <motion.path
          d={heartPath}
          stroke="rgba(255,236,196,0.7)"
          strokeWidth="0.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={play ? { pathLength: 1, opacity: 0.85 } : undefined}
          transition={{
            pathLength: { duration: 2.8, ease: EASE, delay: 0.5 },
            opacity: { duration: 1, ease: EASE, delay: 0.5 },
          }}
          style={{ transform: "scale(0.985)", transformOrigin: "100px 100px" }}
        />

        {/* 5. Reflexo/sheen no lóbulo superior esquerdo */}
        <motion.path
          d={sheenPath}
          stroke="rgba(255,244,214,0.85)"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={play ? { pathLength: 1, opacity: 0.9 } : undefined}
          transition={{
            pathLength: { duration: 1.6, ease: EASE, delay: 2.4 },
            opacity: { duration: 0.8, ease: EASE, delay: 2.4 },
          }}
        />
      </svg>
    </div>
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
