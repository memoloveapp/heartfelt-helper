import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/preparando")({
  head: () => ({
    meta: [
      { title: "Preparando sua homenagem — MemoLove" },
      { name: "description", content: "Estamos preparando sua homenagem exclusiva." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500;1,9..144,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: "css/tokens.css" },
      { rel: "stylesheet", href: "css/base.css" },
      { rel: "stylesheet", href: "css/components.css" },
      { rel: "stylesheet", href: "css/landing.css" },
      { rel: "stylesheet", href: "css/criar.css" },
    ],
  }),
  component: PreparandoPage,
});

const STAGES = [
  { at: 0, label: "📷 Organizando suas fotos..." },
  { at: 2000, label: "💌 Preparando sua declaração..." },
  { at: 4000, label: "🎵 Configurando sua trilha sonora..." },
  { at: 6000, label: "✨ Finalizando os últimos detalhes..." },
  { at: 8000, label: "❤️ Sua prévia está pronta!" },
];
const TOTAL = 10000;

function PreparandoPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / TOTAL) * 100);
      setProgress(pct);
      const idx = STAGES.reduce((acc, s, i) => (elapsed >= s.at ? i : acc), 0);
      setStageIdx(idx);
      if (elapsed >= TOTAL) {
        clearInterval(interval);
        navigate({ to: "/previa" }).catch(() => {
          window.location.href = "/previa";
        });
      }
    }, 80);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="criar-page">
      <header className="criar-header">
        <div className="criar-header__inner">
          <Link to="/" className="brand-logo" aria-label="MemoLove — Início">
            <svg className="brand-logo__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="brand-logo__text">
              Memo<em>Love</em>
            </span>
          </Link>
        </div>
      </header>

      <main className="criar-main">
        <section className="criar-intro">
          <h1 className="criar-title">Estamos preparando sua homenagem exclusiva...</h1>
          <p className="criar-subtitle">Isso leva apenas alguns segundos.</p>
        </section>

        <section className="criar-card" aria-live="polite">
          <div className="criar-progress">
            <div className="criar-progress__label">
              <span>{STAGES[stageIdx].label}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="criar-progress__bar">
              <div className="criar-progress__fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
