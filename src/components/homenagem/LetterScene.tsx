import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

/* LetterScene — folha única, sem card */

const PAPER = "#F8F4EC";
const INK = "#2B2623";
const INK_SOFT = "#5F5650";
const GOLD = "#B8924A";

const SERIF_DISPLAY = '"Cormorant Garamond", Georgia, serif';
const SERIF_BODY = '"EB Garamond", "Cormorant Garamond", Georgia, serif';

const EASE = [0.22, 0.61, 0.36, 1] as const;

function Paragraph({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.p
      className="letter-p"
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
    <section className="letter-scene" aria-label="Carta">
      <style>{`
        .letter-scene {
          width: 100%;
          background: ${PAPER};
          color: ${INK};
          position: relative;
        }
        .letter-scene::before {
          content: "";
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            radial-gradient(rgba(43,38,35,.018) 1px, transparent 1px),
            radial-gradient(rgba(43,38,35,.012) 1px, transparent 1px);
          background-size: 3px 3px, 7px 7px;
          background-position: 0 0, 1px 2px;
        }
        .letter-content {
          position: relative;
          max-width: 760px;
          margin: 0 auto;
          padding: 96px 24px 120px;
          background: transparent;
        }
        @media (min-width: 768px) {
          .letter-content { padding: 140px 64px 160px; }
        }
        .letter-open {
          margin: 0 0 clamp(48px, 8vh, 96px);
          font-family: ${SERIF_DISPLAY};
          font-weight: 500;
          font-style: italic;
          font-size: clamp(48px, 8vw, 88px);
          line-height: 1;
          letter-spacing: -.015em;
          color: ${INK};
        }
        .letter-p {
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
        .letter-drop {
          float: left;
          font-family: ${SERIF_DISPLAY};
          font-weight: 500;
          font-size: 3em;
          line-height: .9;
          padding: .08em .12em 0 0;
          margin-top: .02em;
          color: ${INK};
        }
        .letter-sign {
          margin: clamp(80px, 14vh, 140px) 0 0;
          text-align: right;
          font-family: ${SERIF_BODY};
          color: ${INK_SOFT};
        }
        .letter-sign-rule {
          display: inline-block;
          width: 120px; height: 1px;
          background: ${GOLD};
          opacity: .7;
          margin: 0 0 clamp(20px, 3vh, 28px);
        }
        .letter-sign-line {
          margin: 0 0 6px;
          font-size: clamp(17px, 1.4vw, 19px);
          font-style: italic;
          color: ${INK_SOFT};
        }
        .letter-sign-name {
          margin: 0;
          font-family: ${SERIF_DISPLAY};
          font-style: italic;
          font-weight: 500;
          font-size: clamp(22px, 2.4vw, 30px);
          color: ${INK};
          letter-spacing: -.005em;
        }
      `}</style>

      <div className="letter-content">
        <motion.h2
          className="letter-open"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
        >
          Pai,
        </motion.h2>

        {first && (
          <Paragraph delay={0.15}>
            {firstLetter && <span className="letter-drop">{firstLetter}</span>}
            {firstBody}
          </Paragraph>
        )}

        {rest.map((p, i) => (
          <Paragraph key={i} delay={0.05}>
            {p}
          </Paragraph>
        ))}

        <motion.div
          className="letter-sign"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div className="letter-sign-rule" aria-hidden />
          <p className="letter-sign-line">Com amor,</p>
          <p className="letter-sign-name">{sender || "quem te ama"}</p>
        </motion.div>
      </div>
    </section>
  );
}
