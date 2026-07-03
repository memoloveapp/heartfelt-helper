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
          padding: 110px 0 100px;
          color: ${IVORY};
          overflow: hidden;
          background:
            radial-gradient(85% 45% at 78% 8%, rgba(212,168,92,0.18), transparent 60%),
            radial-gradient(70% 40% at 22% 92%, rgba(180,130,60,0.08), transparent 65%),
            radial-gradient(140% 90% at 50% 50%, #120d08 0%, #0a0705 45%, #050302 100%);
        }
        /* Tecido escuro — trama fina + dobras suaves */
        .ms-scene::before {
          content: "";
          position: absolute; inset: 0;
          background:
            repeating-linear-gradient(118deg, rgba(255,240,210,0.020) 0 1px, transparent 1px 4px),
            repeating-linear-gradient(62deg, rgba(0,0,0,0.35) 0 1px, transparent 1px 5px),
            radial-gradient(60% 30% at 30% 20%, rgba(255,220,170,0.04), transparent 70%),
            radial-gradient(50% 30% at 75% 70%, rgba(0,0,0,0.35), transparent 70%);
          mix-blend-mode: overlay;
          opacity: 0.75;
          pointer-events: none;
        }
        .ms-scene::after {
          content: "";
          position: absolute; inset: 0;
          background:
            radial-gradient(70% 55% at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.92) 100%),
            linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.55) 100%);
          pointer-events: none;
        }

        .ms-inner {
          position: relative;
          z-index: 2;
          max-width: 560px;
          margin: 0 auto;
          padding: 0 14px;
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
          max-width: 380px;
          font-family: ${SERIF};
          font-size: 20px;
          line-height: 1.45;
          color: ${IVORY_SOFT};
          opacity: 0.9;
        }

        /* Palco da fotografia */
        .ms-stage {
          position: relative;
          margin: 64px auto 56px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ms-side {
          position: absolute;
          top: 50%;
          width: 40%;
          aspect-ratio: 3 / 4;
          border-radius: 4px;
          overflow: hidden;
          background-size: cover;
          background-position: center;
          filter: blur(14px) brightness(0.45) saturate(0.7);
          opacity: 0.22;
          box-shadow: 0 40px 70px -25px rgba(0,0,0,0.95);
        }
        .ms-side.left {
          left: -6%;
          transform: translateY(-50%) rotate(-9deg);
        }
        .ms-side.right {
          right: -6%;
          transform: translateY(-50%) rotate(8deg);
        }
        .ms-side.placeholder {
          background: linear-gradient(160deg, #1a1410, #0a0806);
        }

        .ms-frame {
          position: relative;
          width: 80vw;
          max-width: 460px;
          border-radius: 26px;
          padding: 7px;
          background: linear-gradient(155deg,
            rgba(230,190,120,0.55) 0%,
            rgba(180,140,80,0.25) 35%,
            rgba(120,90,50,0.18) 65%,
            rgba(210,170,100,0.45) 100%);
          box-shadow:
            0 70px 140px -50px rgba(0,0,0,0.95),
            0 25px 60px -25px rgba(0,0,0,0.75),
            0 0 0 0.5px rgba(201,161,90,0.35),
            0 0 60px -20px rgba(201,161,90,0.10),
            inset 0 0 0 1px rgba(255,220,170,0.08);
        }
        .ms-frame-inner {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          background: #050403;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.6);
        }
        .ms-frame img {
          display: block;
          width: 100%;
          height: auto;
          max-height: 74vh;
          object-fit: contain;
          background: #050403;
        }
        /* Brilho quente muito sutil vindo do canto superior */
        .ms-frame::after {
          content: "";
          position: absolute; inset: 0;
          border-radius: 26px;
          background: radial-gradient(55% 35% at 88% -5%, rgba(255,210,150,0.14), transparent 70%);
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
