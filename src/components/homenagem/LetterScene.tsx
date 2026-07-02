import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

/* LetterScene — folha editorial premium (a section inteira é o papel) */

const SERIF = '"Cormorant Garamond", "EB Garamond", Georgia, serif';
const EASE = [0.22, 0.61, 0.36, 1] as const;

function Paragraph({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.p
      className={`letter-p ${className ?? ""}`}
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
          background: #F8F4EC;
          color: #2B2623;
          position: relative;
          padding: 0;
          overflow: hidden;
        }
        .letter-inner {
          max-width: 760px;
          margin: 0 auto;
          padding: 96px 24px 120px;
        }
        @media (min-width: 768px) {
          .letter-inner { padding: 150px 64px 170px; }
        }

        .letter-open {
          margin: 0 0 48px;
          font-family: ${SERIF};
          font-weight: 500;
          font-style: italic;
          font-size: clamp(52px, 8vw, 92px);
          line-height: 1;
          letter-spacing: -0.015em;
          color: #2B2623;
        }

        .letter-p {
          margin: 0 0 34px;
          font-family: ${SERIF};
          font-weight: 400;
          font-size: 22px;
          line-height: 1.7;
          letter-spacing: -0.01em;
          color: #2B2623;
          white-space: pre-wrap;
          overflow-wrap: break-word;
          hyphens: auto;
        }
        @media (min-width: 768px) {
          .letter-p { font-size: 28px; line-height: 1.75; }
        }

        .letter-drop {
          float: left;
          font-family: ${SERIF};
          font-weight: 500;
          font-size: 4.2em;
          line-height: 0.85;
          margin-right: 12px;
          padding-top: 0.05em;
          color: #2B2623;
        }

        .letter-sign {
          margin-top: 96px;
          text-align: right;
          font-family: ${SERIF};
          color: #5F5650;
        }
        .letter-sign-rule {
          width: 120px;
          height: 1px;
          background: #B8924A;
          opacity: 0.45;
          margin-left: auto;
          margin-bottom: 32px;
        }
        .letter-sign-line {
          margin: 0 0 6px;
          font-size: 18px;
          font-style: italic;
          color: #5F5650;
        }
        .letter-sign-name {
          margin: 0;
          font-style: italic;
          font-weight: 500;
          font-size: clamp(22px, 2.4vw, 30px);
          color: #5F5650;
          letter-spacing: -0.005em;
        }
      `}</style>

      <div className="letter-inner">
        <motion.h2
          className="letter-open"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          Pai,
        </motion.h2>

        {first && (
          <Paragraph delay={0.1}>
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
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div className="letter-sign-rule" aria-hidden />
          <p className="letter-sign-line">Com amor,</p>
          <p className="letter-sign-name">{sender || "quem te ama"}</p>
        </motion.div>
      </div>
    </section>
  );
}
