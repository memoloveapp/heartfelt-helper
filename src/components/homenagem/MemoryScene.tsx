import { motion, useReducedMotion } from "motion/react";

/* MemoryScene — ETAPA 1
   Apenas UMA memória. Cinematográfica. Sem scroll, sem troca, sem 7 fotos.
   Fundo escuro luxuoso + 2 fotos secundárias desfocadas + fotografia principal. */

const SERIF = '"Cormorant Garamond", "EB Garamond", Georgia, serif';
const SCRIPT = '"Great Vibes", "Allura", "Dancing Script", cursive';

const IVORY = "#F3ECDD";
const IVORY_SOFT = "#EFE7D6";
const GOLD = "#C9A15A";
const GOLD_SOFT = "rgba(201,161,90,0.55)";
const EASE = [0.22, 0.61, 0.36, 1] as const;

export function MemoryScene({ photos }: { photos: string[] }) {
  const clean = photos.filter(Boolean);
  const main = clean[0];
  const secondary = clean.slice(1, 3);
  const reduce = useReducedMotion();

  if (!main) return null;

  const total = 7;
  const caption = "Você é meu lugar favorito.";

  return (
    <section className="ms-scene" aria-label="Memórias">
      <style>{`
        .ms-scene {
          position: relative;
          width: 100%;
          min-height: 100vh;
          padding: 110px 0 90px;
          color: ${IVORY};
          overflow: hidden;
          background:
            radial-gradient(120% 60% at 80% 0%, rgba(201,161,90,0.10), transparent 55%),
            radial-gradient(90% 55% at 15% 100%, rgba(201,161,90,0.06), transparent 60%),
            linear-gradient(180deg, #050403 0%, #0a0806 40%, #0d0a07 100%);
        }
        /* Tecido escuro — dobras muito sutis */
        .ms-scene::before {
          content: "";
          position: absolute; inset: 0;
          background:
            repeating-linear-gradient(115deg, rgba(255,255,255,0.012) 0 2px, transparent 2px 9px),
            repeating-linear-gradient(65deg, rgba(0,0,0,0.25) 0 3px, transparent 3px 14px);
          mix-blend-mode: overlay;
          opacity: 0.55;
          pointer-events: none;
        }
        .ms-scene::after {
          content: "";
          position: absolute; inset: 0;
          background: radial-gradient(120% 80% at 50% 50%, transparent 45%, rgba(0,0,0,0.75) 100%);
          pointer-events: none;
        }

        .ms-inner {
          position: relative;
          z-index: 2;
          max-width: 520px;
          margin: 0 auto;
          padding: 0 22px;
          text-align: center;
        }

        .ms-title {
          margin: 0;
          font-family: ${SERIF};
          font-weight: 500;
          font-size: clamp(38px, 10vw, 56px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: ${IVORY};
        }
        .ms-title .accent { color: ${GOLD}; font-style: italic; }
        .ms-rule {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin: 22px auto 20px; max-width: 220px;
        }
        .ms-rule-line { flex: 1; height: 1px; background: ${GOLD_SOFT}; }
        .ms-rule-dot { color: ${GOLD}; font-size: 8px; }
        .ms-sub {
          margin: 0 auto;
          max-width: 360px;
          font-family: ${SERIF};
          font-size: 18px;
          line-height: 1.45;
          color: ${IVORY_SOFT};
          opacity: 0.85;
        }

        /* Palco da fotografia */
        .ms-stage {
          position: relative;
          margin: 70px auto 40px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ms-side {
          position: absolute;
          top: 50%;
          width: 46%;
          aspect-ratio: 3 / 4;
          border-radius: 6px;
          overflow: hidden;
          background-size: cover;
          background-position: center;
          filter: blur(9px) brightness(0.55) saturate(0.85);
          opacity: 0.32;
          box-shadow: 0 30px 60px -20px rgba(0,0,0,0.9);
        }
        .ms-side.left {
          left: -14%;
          transform: translateY(-50%) rotate(-8deg);
        }
        .ms-side.right {
          right: -14%;
          transform: translateY(-50%) rotate(7deg);
        }
        .ms-side.placeholder {
          background: linear-gradient(160deg, #1a1410, #0a0806);
        }

        .ms-frame {
          position: relative;
          width: 88vw;
          max-width: 460px;
          border-radius: 28px;
          padding: 10px;
          background: linear-gradient(180deg, rgba(201,161,90,0.18), rgba(201,161,90,0.06));
          border: 1px solid rgba(201,161,90,0.42);
          box-shadow:
            0 60px 120px -40px rgba(0,0,0,0.95),
            0 20px 50px -20px rgba(0,0,0,0.7),
            0 0 40px -10px rgba(201,161,90,0.12),
            inset 0 0 0 1px rgba(255,255,255,0.03);
        }
        .ms-frame-inner {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          background: #050403;
        }
        .ms-frame img {
          display: block;
          width: 100%;
          height: auto;
          max-height: 72vh;
          object-fit: contain;
          background: #050403;
        }
        /* Brilho quente muito sutil vindo do canto */
        .ms-frame::after {
          content: "";
          position: absolute; inset: 0;
          border-radius: 28px;
          background: radial-gradient(60% 40% at 90% 0%, rgba(201,161,90,0.10), transparent 70%);
          pointer-events: none;
        }

        .ms-caption-wrap {
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }
        .ms-caption {
          margin: 0;
          font-family: ${SCRIPT};
          font-size: clamp(24px, 6.8vw, 30px);
          line-height: 1.25;
          color: ${IVORY};
          font-weight: 400;
        }
        .ms-heart {
          color: ${GOLD};
          font-size: 16px;
          opacity: 0.9;
          line-height: 1;
        }
        .ms-index {
          font-family: ${SERIF};
          font-size: 14px;
          letter-spacing: 0.28em;
          color: ${IVORY_SOFT};
          opacity: 0.78;
        }
        .ms-index .num { color: ${GOLD}; }

        .ms-bar {
          margin: 26px auto 0;
          width: 78%;
          max-width: 320px;
          height: 1px;
          background: rgba(255,255,255,0.06);
          position: relative;
          overflow: hidden;
        }
        .ms-bar::after {
          content: "";
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 14%;
          background: linear-gradient(90deg, rgba(201,161,90,0.4), ${GOLD});
        }

        @media (min-width: 640px) {
          .ms-frame { max-width: 500px; }
          .ms-side { width: 42%; }
        }
      `}</style>

      <div className="ms-inner">
        <motion.h2
          className="ms-title"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.6, ease: EASE }}
        >
          Memórias que <br /> o tempo <span className="accent">não apaga.</span>
        </motion.h2>

        <div className="ms-rule" aria-hidden>
          <span className="ms-rule-line" />
          <span className="ms-rule-dot">✦</span>
          <span className="ms-rule-line" />
        </div>

        <motion.p
          className="ms-sub"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.2 }}
        >
          Cada foto guarda um pedaço da nossa história.
        </motion.p>

        <motion.div
          className="ms-stage"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.8, ease: EASE, delay: 0.35 }}
        >
          <div
            className={`ms-side left ${secondary[0] ? "" : "placeholder"}`}
            style={secondary[0] ? { backgroundImage: `url(${secondary[0]})` } : undefined}
            aria-hidden
          />
          <div
            className={`ms-side right ${secondary[1] ? "" : "placeholder"}`}
            style={secondary[1] ? { backgroundImage: `url(${secondary[1]})` } : undefined}
            aria-hidden
          />

          <div className="ms-frame">
            <div className="ms-frame-inner">
              <img src={main} alt="Memória" loading="eager" decoding="async" />
            </div>
          </div>
        </motion.div>

        <div className="ms-caption-wrap">
          <p className="ms-caption">{caption}</p>
          <span className="ms-heart" aria-hidden>♡</span>
          <span className="ms-index">
            <span className="num">01</span> • {String(total).padStart(2, "0")}
          </span>
        </div>

        <div className="ms-bar" aria-hidden />
      </div>
    </section>
  );
}
