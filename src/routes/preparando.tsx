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
      { rel: "stylesheet", href: "css/preparando.css" },
    ],
  }),
  component: PreparandoPage,
});

const STAGES: { until: number; label: string }[] = [
  { until: 15, label: "📷 Organizando suas fotos..." },
  { until: 35, label: "✨ Ajustando cada detalhe..." },
  { until: 55, label: "💌 Preparando sua mensagem..." },
  { until: 75, label: "🎵 Configurando sua trilha sonora..." },
  { until: 90, label: "❤️ Finalizando sua homenagem..." },
  { until: 100, label: "🎉 Sua homenagem está pronta." },
];
const TOTAL = 10000;
const SUCCESS_HOLD = 850;

function PreparandoPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / TOTAL) * 100);
      setProgress(pct);
      if (elapsed < TOTAL) {
        raf = requestAnimationFrame(tick);
      } else {
        setDone(true);
        setTimeout(() => {
          navigate({ to: "/previa" }).catch(() => {
            window.location.href = "/previa";
          });
        }, SUCCESS_HOLD);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [navigate]);

  const currentLabel = done
    ? "❤️ Sua homenagem foi criada com sucesso."
    : (STAGES.find((s) => progress < s.until) ?? STAGES[STAGES.length - 1]).label;

  const ringCirc = 2 * Math.PI * 54;
  const ringOffset = ringCirc * (1 - progress / 100);

  return (
    <div className="pr-page">
      <header className="pr-header">
        <Link to="/" className="brand-logo" aria-label="MemoLove — Início">
          <svg className="brand-logo__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="brand-logo__text">Memo<em>Love</em></span>
        </Link>
      </header>

      <main className="pr-main">
        <div className="pr-stack">
          <div className="pr-title-wrap">
            <span className="pr-emoji" aria-hidden="true">❤️</span>
            <h1 className="pr-title">
              {done ? "Sua homenagem foi criada" : "Criando sua homenagem..."}
            </h1>
            <p className="pr-subtitle">
              Estamos organizando suas lembranças para criar uma experiência única.
            </p>
          </div>

          <div className="pr-ring-wrap" aria-hidden="true">
            <div className="pr-glow" />
            <svg className="pr-ring" viewBox="0 0 120 120" width="160" height="160">
              <circle className="pr-ring__track" cx="60" cy="60" r="54" />
              <circle
                className="pr-ring__progress"
                cx="60"
                cy="60"
                r="54"
                strokeDasharray={ringCirc}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div className={`pr-ring__heart${done ? " is-done" : ""}`}>❤️</div>
          </div>

          <div className="pr-progress" aria-live="polite">
            <div className="pr-bar">
              <div className="pr-bar__fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="pr-pct">{Math.round(progress)}%</div>
          </div>

          <div className="pr-status" aria-live="polite">
            <span key={currentLabel} className="pr-status__text">{currentLabel}</span>
          </div>
        </div>
      </main>

      <footer className="pr-footer">
        Cada homenagem é preparada especialmente para emocionar.
      </footer>
    </div>
  );
}
