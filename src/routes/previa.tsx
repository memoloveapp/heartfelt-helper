import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/previa")({
  head: () => ({
    meta: [
      { title: "Sua prévia — MemoLove" },
      { name: "description", content: "Prévia da sua homenagem MemoLove." },
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
  component: PreviaPage,
});

function PreviaPage() {
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
          <h1 className="criar-title">Sua prévia será exibida aqui.</h1>
        </section>

        <section className="criar-card" style={{ textAlign: "center" }}>
          <div className="criar-actions" style={{ justifyContent: "center" }}>
            <Link to="/" className="btn-primary btn-primary--cta">
              Voltar ao início
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
