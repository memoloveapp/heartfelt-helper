import { useMemo } from "react";
import { Rise } from "./shared";

export function LetterScene({ message, sender }: { message: string; sender: string }) {
  const paragraphs = useMemo(
    () => (message ?? "").split(/\n\s*\n|\n/).map((s) => s.trim()).filter(Boolean),
    [message]
  );

  return (
    <section className="ml-letter" aria-label="Carta">
      <div className="ml-letter-inner">
        <Rise as="span" className="ml-letter-eyebrow">uma carta</Rise>
        {paragraphs.map((p, i) => (
          <Rise
            key={i}
            as="p"
            delay={0.05 + Math.min(i, 6) * 0.03}
            className={`ml-letter-p ${i === 0 ? "ml-letter-first" : ""}`}
          >
            {p}
          </Rise>
        ))}
        <Rise as="p" delay={0.2} className="ml-letter-sign">
          <span className="ml-letter-sign-mark" aria-hidden>—</span>
          <em>{sender || "com amor"}</em>
        </Rise>
      </div>
    </section>
  );
}
