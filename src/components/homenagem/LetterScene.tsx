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
      transition={{ duration: 1.6, ease: EASE, delay }}
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
            rgba(10,8,6,0.85) 22%,
            rgba(10,8,6,0.45) 46%,
            rgba(239,230,210,0.35) 72%,
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
          opacity: 0.32;
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
          opacity: 0.14;
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
          max-width: 620px;
          margin: 0 auto;
          padding: 110px 28px 140px;
        }
        @media (min-width: 768px) {
          .letter-inner { padding: 160px 32px 180px; }
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
          margin: 0 0 48px;
          font-family: ${SERIF};
          font-weight: 400;
          font-size: 20px;
          line-height: 1.9;
          letter-spacing: -0.005em;
          color: ${INK};
          white-space: pre-wrap;
          overflow-wrap: break-word;
        }
        @media (min-width: 768px) {
          .letter-p { font-size: 22px; line-height: 1.95; margin-bottom: 54px; }
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
          margin-top: 72px;
          font-family: ${SERIF};
          color: ${INK};
        }
        .letter-sign-line {
          margin: 0 0 10px;
          font-size: 18px;
          color: ${INK};
        }
        .letter-sign-name {
          margin: 0;
          font-family: ${SCRIPT};
          font-weight: 400;
          font-size: clamp(38px, 5.2vw, 52px);
          line-height: 1;
          color: ${GOLD};
        }

        .letter-scroll {
          position: relative;
          z-index: 2;
          margin: 60px auto 0;
          padding-bottom: 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: ${GOLD};
          font-family: ${SERIF};
          font-size: 15px;
          letter-spacing: 0.02em;
        }
        .letter-scroll-arrow {
          animation: letter-scroll-bob 2600ms ease-in-out infinite;
        }
        @keyframes letter-scroll-bob {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(6px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .letter-leaves, .letter-blinds, .letter-scroll-arrow {
            animation: none !important;
          }
        }
      `}</style>

      <div className="letter-light" aria-hidden />
      <div className="letter-blinds" aria-hidden />
      <div className="letter-leaves" aria-hidden />

      <a
        href="#"
        className="letter-back"
        onClick={(e) => {
          e.preventDefault();
          if (typeof window !== "undefined") window.history.length > 1 ? window.history.back() : (window.location.href = "/");
        }}
        aria-label="Voltar"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Voltar</span>
      </a>

      <div className="letter-inner">
        <motion.h2
          className="letter-open"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.8, ease: EASE }}
        >
          Pai,
        </motion.h2>
        <motion.div
          className="letter-open-rule"
          aria-hidden
          initial={reduce ? { opacity: 0 } : { scaleX: 0, opacity: 0 }}
          whileInView={reduce ? { opacity: 1 } : { scaleX: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.4 }}
          style={{ transformOrigin: "left center" }}
        />

        {paragraphs.map((p, i) => (
          <Paragraph key={i} delay={0.6 + i * 0.35}>
            {p}
          </Paragraph>
        ))}

        <motion.div
          className="letter-highlight-wrap"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 2.0, ease: EASE, delay: 0.5 }}
        >
          <p className="letter-highlight">Eu te amo, pai.</p>
          <motion.div
            className="letter-highlight-rule"
            aria-hidden
            initial={reduce ? { opacity: 0 } : { scaleX: 0, opacity: 0 }}
            whileInView={reduce ? { opacity: 1 } : { scaleX: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 1.6, ease: EASE, delay: 1.0 }}
            style={{ transformOrigin: "left center" }}
          />
          <p className="letter-highlight-sub">Mais do que palavras podem dizer.</p>
        </motion.div>

        <motion.div
          className="letter-sign"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 2.0, ease: EASE, delay: 1.2 }}
        >
          <p className="letter-sign-line">Com todo meu amor,</p>
          <p className="letter-sign-name">{sender || "Seu filho"}</p>
        </motion.div>
      </div>

      <motion.div
        className="letter-scroll"
        aria-hidden
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.85 }}
        viewport={{ once: true, margin: "-5% 0px" }}
        transition={{ duration: 1.8, ease: EASE, delay: 1.8 }}
      >
        <svg className="letter-scroll-arrow" width="16" height="18" viewBox="0 0 16 18" fill="none">
          <path d="M8 1v14M2 10l6 6 6-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Role para continuar</span>
      </motion.div>
    </section>
  );
}
