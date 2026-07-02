import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

/* ============================================================
   LetterScene — página de livro de luxo
   Props: { message, sender }
   ============================================================ */

const PAPER = "#F8F4EC";
const INK = "#2B2623";
const INK_SOFT = "#5F5650";
const GOLD = "#B8924A";

const SERIF_DISPLAY = '"Cormorant Garamond", Georgia, serif';
const SERIF_BODY = '"EB Garamond", "Cormorant Garamond", Georgia, serif';

const EASE = [0.22, 0.61, 0.36, 1] as const;

function Paragraph({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.p
      className={`ls-p ${className ?? ""}`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
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

  const first = paragraphs[0] ?? "";
  const rest = paragraphs.slice(1);
  const firstLetter = first.charAt(0);
  const firstBody = first.slice(1);

  return (
    <section className="ls" aria-label="Carta">
      <style>{`
        .ls {
          position: relative;
          min-height: 100vh;
          width: 100%;
          background: ${PAPER};
          color: ${INK};
          padding: clamp(120px, 22vh, 220px) 24px clamp(160px, 24vh, 260px);
          isolation: isolate;
          overflow: hidden;
        }
        /* textura papel quase imperceptível */
        .ls::before {
          content: "";
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            radial-gradient(rgba(43,38,35,.018) 1px, transparent 1px),
            radial-gradient(rgba(43,38,35,.012) 1px, transparent 1px);
          background-size: 3px 3px, 7px 7px;
          background-position: 0 0, 1px 2px;
          opacity: .9;
          z-index: 0;
        }
        /* véu escuro que se dissipa — continua o hero */
        .ls::after {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: clamp(180px, 32vh, 340px);
          background: linear-gradient(
            to bottom,
            rgba(20,15,12,.55) 0%,
            rgba(20,15,12,.28) 35%,
            rgba(248,244,236,0) 100%
          );
          pointer-events: none;
          z-index: 1;
        }

        .ls-page {
          position: relative;
          z-index: 2;
          max-width: 920px;
          margin: 0 auto;
          padding: 0;
        }
        @media (min-width: 768px) {
          .ls { padding-left: 64px; padding-right: 64px; }
        }

        .ls-open {
          margin: 0 0 clamp(48px, 8vh, 96px);
          font-family: ${SERIF_DISPLAY};
          font-weight: 500;
          font-style: italic;
          font-size: clamp(48px, 8vw, 88px);
          line-height: 1;
          letter-spacing: -.015em;
          color: ${INK};
        }

        .ls-p {
          margin: 0 0 clamp(32px, 4.5vh, 48px);
          font-family: ${SERIF_BODY};
          font-weight: 400;
          font-size: clamp(19px, 1.6vw, 22px);
          line-height: 1.85;
          letter-spacing: .005em;
          color: ${INK};
          text-align: left;
          hyphens: auto;
          overflow-wrap: break-word;
          white-space: pre-wrap;
        }

        .ls-drop {
          float: left;
          font-family: ${SERIF_DISPLAY};
          font-weight: 500;
          font-size: 3em;
          line-height: .9;
          padding: .08em .12em 0 0;
          margin-top: .02em;
          color: ${INK};
        }

        .ls-sign {
          margin: clamp(80px, 14vh, 140px) 0 0;
          text-align: right;
          font-family: ${SERIF_BODY};
          color: ${INK_SOFT};
        }
        .ls-sign-rule {
          display: inline-block;
          width: 120px; height: 1px;
          background: ${GOLD};
          opacity: .7;
          margin: 0 0 clamp(20px, 3vh, 28px);
        }
        .ls-sign-line {
          margin: 0 0 6px;
          font-size: clamp(17px, 1.4vw, 19px);
          font-style: italic;
          color: ${INK_SOFT};
        }
        .ls-sign-name {
          margin: 0;
          font-family: ${SERIF_DISPLAY};
          font-style: italic;
          font-weight: 500;
          font-size: clamp(22px, 2.4vw, 30px);
          color: ${INK};
          letter-spacing: -.005em;
        }
      `}</style>

      <motion.div
        className="ls-page"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 60 }}
        whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-5% 0px" }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        <motion.h2
          className="ls-open"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
        >
          Pai,
        </motion.h2>

        {first && (
          <Paragraph delay={0.15}>
            {firstLetter && <span className="ls-drop">{firstLetter}</span>}
            {firstBody}
          </Paragraph>
        )}

        {rest.map((p, i) => (
          <Paragraph key={i} delay={0.05}>
            {p}
          </Paragraph>
        ))}

        <motion.div
          className="ls-sign"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div className="ls-sign-rule" aria-hidden />
          <p className="ls-sign-line">Com amor,</p>
          <p className="ls-sign-name">{sender || "quem te ama"}</p>
        </motion.div>
      </motion.div>
    </section>
  );
}
