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
            radial-gradient(65% 50% at 50% 55%, transparent 35%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0.96) 100%),
            linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 20%, transparent 78%, rgba(0,0,0,0.6) 100%);
          pointer-events: none;
        }
        /* Costura invisível com a MusicScene — herda o preto quente da cena
           anterior e o dissolve na atmosfera da Memory sem quebra perceptível. */
        .ms-fade-in {
          position: absolute;
          top: -1px; left: 0; right: 0;
          height: 320px;
          pointer-events: none;
          z-index: 3;
          background:
            radial-gradient(70% 100% at 50% 0%, rgba(212,168,92,0.05) 0%, rgba(212,168,92,0) 60%),
            linear-gradient(
              180deg,
              rgba(14,10,7,1) 0%,
              rgba(14,10,7,0.85) 30%,
              rgba(14,10,7,0.4) 65%,
              rgba(14,10,7,0) 100%
            );
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
          margin: 78px auto 60px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        /* Halo dourado ambiente atrás da fotografia (sem forma, sem borda) */
        .ms-stage::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 140%;
          height: 120%;
          transform: translate(-50%, -50%);
          background:
            radial-gradient(38% 30% at 50% 50%, rgba(230,180,110,0.10), rgba(230,180,110,0.04) 45%, transparent 70%),
            radial-gradient(60% 55% at 50% 55%, rgba(0,0,0,0.55), transparent 65%);
          filter: blur(30px);
          pointer-events: none;
          z-index: 0;
        }
        .ms-stage > * { position: relative; z-index: 1; }

        .ms-side {
          position: absolute;
          top: 50%;
          width: 40%;
          aspect-ratio: 3 / 4;
          border-radius: 4px;
          overflow: hidden;
          background-size: cover;
          background-position: center;
          filter: blur(16px) brightness(0.42) saturate(0.65);
          opacity: 0.18;
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
          border-radius: 18px;
          padding: 1.5px;
          background: linear-gradient(158deg,
            rgba(220,180,115,0.55) 0%,
            rgba(160,120,70,0.20) 40%,
            rgba(110,80,45,0.14) 68%,
            rgba(210,170,100,0.45) 100%);
          transform: rotate(-1.2deg);
          transform-origin: center;
          box-shadow:
            0 80px 160px -55px rgba(0,0,0,0.92),
            0 40px 80px -35px rgba(0,0,0,0.65),
            0 12px 28px -14px rgba(0,0,0,0.55),
            inset 0 0 0 0.5px rgba(255,220,170,0.10);
        }
        
        .ms-frame-inner {
          position: relative;
          border-radius: 16.5px;
          overflow: hidden;
          background: #050403;
          box-shadow: inset 0 0 0 0.5px rgba(0,0,0,0.5);
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
          border-radius: 18px;
          background: radial-gradient(55% 35% at 88% -5%, rgba(255,210,150,0.07), transparent 70%);
          pointer-events: none;
        }


        .ms-caption-wrap {
          margin-top: 26px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
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
          margin-top: 10px;
        }
        .ms-index {
          font-family: ${SERIF};
          font-size: 14px;
          letter-spacing: 0.28em;
          color: ${IVORY_SOFT};
          opacity: 0.78;
          margin-top: 8px;
        }
        .ms-index .num { color: ${GOLD}; }

        .ms-bar {
          margin: 14px auto 0;
          width: 62%;
          max-width: 260px;
          height: 0.5px;
          background: rgba(255,255,255,0.035);
          position: relative;
          overflow: hidden;
        }
        .ms-bar::after {
          content: "";
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 12%;
          background: linear-gradient(90deg, rgba(201,161,90,0.15), rgba(201,161,90,0.55));
          opacity: 0.7;
        }

        @media (min-width: 640px) {
          .ms-frame { max-width: 500px; }
          .ms-side { width: 42%; }
        }
      `}</style>

      <div className="ms-fade-in" aria-hidden />

      <div className="ms-inner">
        <motion.h2
          className="ms-title"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.75, ease: "easeOut" }}
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
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.75, ease: "easeOut", delay: 0.12 }}
        >
          Cada foto guarda um pedaço da nossa história.
        </motion.p>

        <div className="ms-stage">
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

          <motion.div
            className="ms-frame"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
            whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.85, ease: "easeOut", delay: 0.32 }}
          >
            <div className="ms-frame-inner">
              <img src={main} alt="Memória" loading="eager" decoding="async" />
            </div>
          </motion.div>
        </div>

        <div className="ms-caption-wrap">
          <motion.p
            className="ms-caption"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.55 }}
          >
            {caption}
          </motion.p>
          <motion.span
            className="ms-heart"
            aria-hidden
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.9 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.68 }}
          >
            ♡
          </motion.span>
          <motion.span
            className="ms-index"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.78 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.68 }}
          >
            <span className="num">01</span> • {String(total).padStart(2, "0")}
          </motion.span>
        </div>

        <motion.div
          className="ms-bar"
          aria-hidden
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.82 }}
        />
      </div>
    </section>
  );
}
