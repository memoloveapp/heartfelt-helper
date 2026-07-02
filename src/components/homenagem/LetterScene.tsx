import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

/* ============================================================
   LetterScene — editorial premium letter
   Props idênticas ao componente anterior: { message, sender }
   ============================================================ */

const PAPER = "#F5E8D4";
const INK = "#2B211A";
const GOLD = "#C49A5F";
const BG_TOP = "#1A140F";       // fundo escuro quente no topo
const BG_BOTTOM = "#F1E7D3";    // creme na base

const SERIF = '"Cormorant Garamond", "Fraunces", Georgia, serif';
const SANS = '"Karla", "Inter", system-ui, -apple-system, sans-serif';

const EASE = [0.16, 0.84, 0.24, 1] as const;

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
    <section className="ls-scene" aria-label="Carta">
      <style>{`
        .ls-scene {
          position: relative;
          min-height: 100vh;
          width: 100%;
          padding: clamp(80px, 14vh, 160px) clamp(12px, 4vw, 48px) clamp(120px, 18vh, 220px);
          background:
            linear-gradient(
              to bottom,
              ${BG_TOP} 0%,
              #2A1F16 22%,
              #6B4F35 55%,
              ${BG_BOTTOM} 100%
            );
          display: flex;
          justify-content: center;
          align-items: flex-start;
          font-family: ${SANS};
          isolation: isolate;
          overflow: hidden;
        }
        .ls-scene::before {
          content: "";
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 50% 8%, rgba(196,154,95,.10), transparent 55%),
            radial-gradient(ellipse at 50% 95%, rgba(196,154,95,.06), transparent 60%);
          pointer-events: none; z-index: 0;
        }

        .ls-paper {
          position: relative;
          z-index: 1;
          width: min(720px, 96vw);
          background: ${PAPER};
          color: ${INK};
          padding: clamp(56px, 9vw, 96px) clamp(24px, 6vw, 72px) clamp(72px, 12vw, 112px);
          box-shadow:
            0 40px 80px -30px rgba(0,0,0,.55),
            0 8px 24px -12px rgba(0,0,0,.35),
            inset 0 0 120px rgba(139,101,58,.06);

          /* borda superior orgânica / rasgada */
          --torn: polygon(
            0% 3.2%, 2.5% 1.4%, 5% 2.6%, 8% 0.6%, 11% 2%, 14.5% 0.4%,
            17.5% 2.2%, 21% 0.8%, 24.5% 2.8%, 28% 1%, 32% 2.4%, 36% 0.6%,
            40% 2.2%, 44% 0.9%, 48% 2.6%, 52% 1.1%, 56% 2.3%, 60% 0.5%,
            64% 2.1%, 68% 0.8%, 72% 2.5%, 76% 1%, 80% 2.4%, 84% 0.6%,
            88% 2.2%, 91% 0.9%, 94% 2.6%, 97% 1.2%, 100% 3%,
            100% 100%, 0% 100%
          );
          clip-path: var(--torn);
          -webkit-clip-path: var(--torn);

          /* textura sutil de papel */
          background-image:
            radial-gradient(rgba(43,33,26,.035) 1px, transparent 1px),
            radial-gradient(rgba(43,33,26,.02) 1px, transparent 1px);
          background-size: 3px 3px, 7px 7px;
          background-position: 0 0, 1px 2px;
          background-color: ${PAPER};
        }
        .ls-paper::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse at 20% 15%, rgba(139,101,58,.09), transparent 55%),
            radial-gradient(ellipse at 85% 90%, rgba(139,101,58,.08), transparent 55%);
          mix-blend-mode: multiply;
        }

        .ls-eyebrow {
          display: block;
          text-align: center;
          font-family: ${SANS};
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .58em;
          text-transform: uppercase;
          color: ${GOLD};
          margin: 0 0 clamp(14px, 2.2vh, 22px);
        }
        .ls-rule {
          display: flex; align-items: center; justify-content: center;
          gap: 10px;
          margin: 0 auto clamp(28px, 5vh, 48px);
          color: ${GOLD};
        }
        .ls-rule span {
          display: block;
          width: clamp(48px, 10vw, 88px);
          height: 1px;
          background: currentColor;
          opacity: .55;
        }
        .ls-rule svg { flex: none; opacity: .9; }

        .ls-title {
          margin: 0 0 clamp(28px, 5vh, 44px);
          text-align: center;
          font-family: ${SERIF};
          font-style: italic;
          font-weight: 400;
          font-size: clamp(34px, 7vw, 56px);
          line-height: 1.05;
          letter-spacing: -.01em;
          color: ${INK};
        }

        .ls-p {
          margin: 0 0 clamp(18px, 2.6vh, 26px);
          font-family: ${SERIF};
          font-weight: 400;
          font-size: clamp(17px, 2.1vw, 20px);
          line-height: 1.75;
          color: ${INK};
          text-align: left;
          hyphens: auto;
          overflow-wrap: break-word;
          white-space: pre-wrap;
        }
        .ls-p--first::first-letter { /* fallback caso o span falhe */ }

        .ls-drop {
          float: left;
          font-family: ${SERIF};
          font-weight: 500;
          font-size: clamp(64px, 11vw, 96px);
          line-height: .85;
          padding: 6px 12px 0 0;
          margin: 4px 6px 0 0;
          color: ${GOLD};
        }

        .ls-sign {
          margin: clamp(40px, 7vh, 72px) 0 0;
          text-align: right;
          font-family: ${SERIF};
          font-size: clamp(16px, 1.9vw, 20px);
          color: ${INK};
        }
        .ls-sign-dash {
          display: inline-block;
          width: 32px; height: 1px;
          background: ${GOLD};
          vertical-align: middle;
          margin: 0 12px 4px 0;
          opacity: .8;
        }
        .ls-sign em { font-style: italic; font-weight: 400; }

        @media (max-width: 480px) {
          .ls-paper { width: 96vw; }
        }
      `}</style>

      <motion.article
        className="ls-paper"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, filter: "blur(10px)" }}
        whileInView={
          reduce
            ? { opacity: 1 }
            : { opacity: 1, y: 0, filter: "blur(0px)" }
        }
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: reduce ? 0.5 : 1.6, ease: EASE }}
      >
        <span className="ls-eyebrow">Carta para você</span>

        <div className="ls-rule" aria-hidden>
          <span />
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 20s-7-4.5-9.5-9.2C.9 7.5 3 3.7 6.5 3.7c1.9 0 3.9 1 5.5 3 1.6-2 3.6-3 5.5-3 3.5 0 5.6 3.8 4 7.1C19 15.5 12 20 12 20z" />
          </svg>
          <span />
        </div>

        <h2 className="ls-title">Meu pai,</h2>

        {first && (
          <p className="ls-p ls-p--first">
            {firstLetter && <span className="ls-drop">{firstLetter}</span>}
            {firstBody}
          </p>
        )}

        {rest.map((p, i) => (
          <p className="ls-p" key={i}>
            {p}
          </p>
        ))}

        <p className="ls-sign">
          <span className="ls-sign-dash" aria-hidden />
          <em>{sender || "com amor"}</em>
        </p>
      </motion.article>
    </section>
  );
}
