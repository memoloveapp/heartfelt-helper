import { Rise } from "./shared";

export function EndingScene({ sender }: { sender: string }) {
  return (
    <section className="ml-close" aria-label="Encerramento">
      <Rise as="p" className="ml-close-line">
        que essa memória viva com você, sempre.
      </Rise>
      <Rise as="p" delay={0.2} className="ml-close-sign">
        com amor, <em>{sender || "quem te ama"}</em>
      </Rise>
      <Rise as="div" delay={0.4} className="ml-close-seal">
        <span className="ml-close-heart" aria-hidden>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.5-9.5-9.2C.9 7.5 3 3.7 6.5 3.7c1.9 0 3.9 1 5.5 3 1.6-2 3.6-3 5.5-3 3.5 0 5.6 3.8 4 7.1C19 15.5 12 20 12 20z" /></svg>
        </span>
        <span className="ml-close-mark">memolove</span>
      </Rise>
    </section>
  );
}
