import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

/* LetterScene — reconstruída a partir da referência visual.
   Fundo creme (a própria página é a carta), sombras suaves de janela,
   tipografia editorial, destaque dourado "Eu te amo, pai." e assinatura manuscrita. */

const SERIF = '"Cormorant Garamond", "EB Garamond", Georgia, serif';
const SCRIPT = '"Great Vibes", "Allura", "Dancing Script", cursive';
const EASE = [0.22, 0.61, 0.36, 1] as const;

const CREAM = "#EFE6D2";
const CREAM_DEEP = "#E7DCC3";
const INK = "#2A211A";
const INK_SOFT = "#5A4B3E";
const GOLD = "#B8924A";

function Paragraph({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.p
      className="letter-p"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1.95, ease: EASE, delay }}
    >
      {children}
    </motion.p>
  );
}

export function LetterScene({ message, sender }: { message: string; sender: string }) {
  const reduce = useReducedMotion();

  const paragraphs = useMemo(
    () =>
      (message ?? "")
        .split(/\n\s*\n|\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    [message]
  );

  return (
    <section className="letter-scene" aria-label="Carta">
      <style>{`
        .letter-scene {
          position: relative;
          width: 100%;
          min-height: 100vh;
          background:
            radial-gradient(120% 80% at 20% 10%, #F4ECD8 0%, ${CREAM} 55%, ${CREAM_DEEP} 100%);
          color: ${INK};
          overflow: hidden;
          padding: 0;
        }
        /* Textura de papel quase imperceptível */
        .letter-scene::before {
          content: "";
          position: absolute; inset: 0;
          pointer-events: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.18  0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>");
          background-size: 260px 260px;
          opacity: 0.035;
          mix-blend-mode: multiply;
        }
        /* Overlay cinematográfico — Hero se dissolvendo na carta */
        .letter-morph {
          position: absolute; inset: 0;
          pointer-events: none;
          z-index: 4;
          background: linear-gradient(
            180deg,
            #0a0806 0%,
            rgba(10,8,6,0.92) 18%,
            rgba(10,8,6,0.62) 40%,
            rgba(30,22,14,0.28) 60%,
            rgba(239,230,210,0.32) 80%,
            rgba(239,230,210,0) 100%
          );
        }
        /* Luz quente entrando */
        .letter-light {
          position: absolute; inset: 0;
          pointer-events: none;
          background:
            radial-gradient(60% 45% at 18% 8%, rgba(255,236,196,0.55) 0%, rgba(255,236,196,0) 70%);
          mix-blend-mode: screen;
        }
        /* Sombras de folhagem entrando pela janela (canto direito) */
        .letter-leaves {
          position: absolute;
          top: -8%; right: -12%;
          width: 65%; height: 115%;
          pointer-events: none;
          opacity: 0.27;
          mix-blend-mode: multiply;
          filter: blur(6px);
          background-image:
            radial-gradient(ellipse 22px 46px at 20% 10%, rgba(60,45,30,0.55) 0%, transparent 60%),
            radial-gradient(ellipse 28px 60px at 35% 22%, rgba(60,45,30,0.5) 0%, transparent 60%),
            radial-gradient(ellipse 20px 42px at 55% 30%, rgba(60,45,30,0.55) 0%, transparent 60%),
            radial-gradient(ellipse 34px 70px at 70% 45%, rgba(60,45,30,0.45) 0%, transparent 60%),
            radial-gradient(ellipse 24px 50px at 45% 55%, rgba(60,45,30,0.5) 0%, transparent 60%),
            radial-gradient(ellipse 30px 62px at 80% 65%, rgba(60,45,30,0.42) 0%, transparent 60%),
            radial-gradient(ellipse 22px 46px at 60% 78%, rgba(60,45,30,0.5) 0%, transparent 60%),
            radial-gradient(ellipse 28px 58px at 40% 88%, rgba(60,45,30,0.45) 0%, transparent 60%),
            linear-gradient(115deg, rgba(60,45,30,0.18) 0%, rgba(60,45,30,0) 60%);
          animation: leaves-drift 22s ease-in-out infinite alternate;
        }
        /* Faixas de luz de janela */
        .letter-blinds {
          position: absolute;
          top: -10%; left: -10%;
          width: 70%; height: 120%;
          pointer-events: none;
          opacity: 0.12;
          background: repeating-linear-gradient(
            118deg,
            rgba(255,235,190,0.55) 0px,
            rgba(255,235,190,0.55) 22px,
            rgba(255,235,190,0) 22px,
            rgba(255,235,190,0) 90px
          );
          mix-blend-mode: screen;
          animation: blinds-drift 30s ease-in-out infinite alternate;
        }
        @keyframes leaves-drift {
          0%   { transform: translate3d(0,0,0) rotate(0deg); }
          100% { transform: translate3d(-14px, 10px, 0) rotate(0.6deg); }
        }
        @keyframes blinds-drift {
          0%   { transform: translate3d(0,0,0); }
          100% { transform: translate3d(10px, -8px, 0); }
        }

        .letter-back {
          position: absolute;
          top: 24px; left: 24px;
          z-index: 3;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: ${SERIF};
          font-size: 18px;
          color: ${INK};
          text-decoration: none;
          opacity: 0.85;
          transition: opacity .2s ease;
        }
        .letter-back:hover { opacity: 1; }
        @media (min-width: 768px) {
          .letter-back { top: 34px; left: 40px; font-size: 20px; }
        }

        .letter-inner {
          position: relative;
          z-index: 2;
          max-width: 600px;
          margin: 0 auto;
          padding: 75px 28px 140px;
          will-change: transform;
        }
        @media (min-width: 768px) {
          .letter-inner { padding: 125px 32px 180px; }
        }

        .letter-open {
          margin: 0 0 14px;
          font-family: ${SERIF};
          font-weight: 500;
          font-size: clamp(78px, 13vw, 132px);
          line-height: 0.95;
          letter-spacing: -0.02em;
          color: ${INK};
        }
        .letter-open-rule {
          width: 130px;
          height: 1px;
          background: ${GOLD};
          opacity: 0.7;
          margin: 0 0 56px;
        }

        .letter-p {
          margin: 0 0 60px;
          font-family: ${SERIF};
          font-weight: 400;
          font-size: 20px;
          line-height: 2.0;
          letter-spacing: -0.005em;
          color: ${INK};
          white-space: pre-wrap;
          overflow-wrap: break-word;
        }
        @media (min-width: 768px) {
          .letter-p { font-size: 22px; line-height: 2.05; margin-bottom: 68px; }
        }

        .letter-highlight-wrap {
          margin: 56px 0 22px;
        }
        .letter-highlight {
          margin: 0 0 10px;
          font-family: ${SERIF};
          font-style: italic;
          font-weight: 500;
          font-size: clamp(34px, 5.4vw, 46px);
          line-height: 1.1;
          letter-spacing: -0.01em;
          color: ${GOLD};
        }
        .letter-highlight-rule {
          width: 260px; max-width: 100%;
          height: 1px;
          background: ${GOLD};
          opacity: 0.75;
        }
        .letter-highlight-sub {
          margin: 26px 0 0;
          font-family: ${SERIF};
          font-size: 19px;
          line-height: 1.6;
          color: ${INK};
        }

        .letter-sign {
          margin-top: 112px;
          font-family: ${SERIF};
          color: ${INK};
        }
        .letter-sign-line {
          margin: 0 0 14px;
          font-size: 18px;
          color: ${INK};
        }
        .letter-sign-name {
          margin: 0;
          font-family: ${SCRIPT};
          font-weight: 400;
          font-size: clamp(51px, 6.6vw, 68px);
          line-height: 1;
          color: #6E5326;
        }

        .letter-scroll {
          position: relative;
          z-index: 2;
          margin: 72px auto 0;
          padding-bottom: 56px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: ${GOLD};
          opacity: 0;
          animation: letter-scroll-in 1600ms ease-out 5200ms forwards, letter-scroll-bob 2800ms ease-in-out 6800ms infinite;
        }
        .letter-scroll-line {
          width: 1px;
          height: 44px;
          background: linear-gradient(180deg, rgba(184,146,74,0) 0%, rgba(184,146,74,0.9) 100%);
        }
        @keyframes letter-scroll-in {
          to { opacity: 0.85; }
        }
        @keyframes letter-scroll-bob {
          0%,100% { transform: translateY(0); opacity: 0.85; }
          50%     { transform: translateY(6px); opacity: 0.85; }
        }

        @media (prefers-reduced-motion: reduce) {
          .letter-leaves, .letter-blinds, .letter-scroll {
            animation: none !important;
            opacity: 0.85 !important;
          }
        }
      `}</style>

      {/* Overlay cinematográfico: Hero dissolvendo na carta */}
      <motion.div
        className="letter-morph"
        aria-hidden
        initial={reduce ? { opacity: 0 } : { opacity: 1 }}
        whileInView={{ opacity: 0 }}
        viewport={{ once: true, margin: "-5% 0px" }}
        transition={{ duration: 2.8, ease: EASE }}
      />

      <motion.div
        aria-hidden
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-5% 0px" }}
        transition={{ duration: 2.6, ease: EASE, delay: 0.6 }}
      >
        <div className="letter-light" />
        <div className="letter-blinds" />
        <div className="letter-leaves" />
      </motion.div>


      <div className="letter-inner">
        <motion.h2
          className="letter-open"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 2.2, ease: EASE, delay: 1.6 }}
        >
          Pai,
        </motion.h2>
        <motion.div
          className="letter-open-rule"
          aria-hidden
          initial={reduce ? { opacity: 0 } : { scaleX: 0, opacity: 0 }}
          whileInView={reduce ? { opacity: 1 } : { scaleX: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.8, ease: EASE, delay: 2.2 }}
          style={{ transformOrigin: "left center" }}
        />

        {paragraphs.map((p, i) => (
          <Paragraph key={i} delay={2.8 + i * 0.9}>
            {p}
          </Paragraph>
        ))}

        <div className="letter-highlight-wrap">
          <motion.p
            className="letter-highlight"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.5, ease: "linear", delay: 0.6 }}
          >
            Eu te amo, pai.
          </motion.p>
          <motion.div
            className="letter-highlight-rule"
            aria-hidden
            initial={reduce ? { opacity: 0 } : { scaleX: 0, opacity: 0 }}
            whileInView={reduce ? { opacity: 1 } : { scaleX: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 1.8, ease: EASE, delay: 1.3 }}
            style={{ transformOrigin: "left center" }}
          />
          <p className="letter-highlight-sub">Mais do que palavras podem dizer.</p>
        </div>

        <motion.div
          className="letter-sign"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 2.4, ease: EASE, delay: 1.8 }}
        >
          <p className="letter-sign-line">Com todo meu amor,</p>
          <p className="letter-sign-name">{sender || "Seu filho"}</p>
        </motion.div>
      </div>

      <div className="letter-scroll" aria-hidden>
        <span className="letter-scroll-line" />
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <path d="M1 1l6 7 6-7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
