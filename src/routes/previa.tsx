import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/previa")({
  head: () => ({
    meta: [
      { title: "Prévia da sua homenagem — MemoLove" },
      { name: "description", content: "Prévia exclusiva da sua homenagem MemoLove." },
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
      { rel: "stylesheet", href: "css/previa.css" },
    ],
  }),
  component: PreviaPage,
});

type Saved = {
  fatherName: string;
  fromName: string;
  photos: { name: string; url: string }[];
  track: { title: string; artist: string; cover: string } | null;
  message: string;
};

function PreviaPage() {
  const [data, setData] = useState<Saved | null | "missing">(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("memolove:homenagem");
      if (!raw) return setData("missing");
      setData(JSON.parse(raw) as Saved);
    } catch {
      setData("missing");
    }
  }, []);

  if (data === null) return null;

  if (data === "missing") {
    return (
      <div className="criar-page">
        <PreviaHeader />
        <main className="criar-main">
          <section className="criar-card previa-empty">
            <h1 className="criar-title">Não encontramos os dados da sua homenagem.</h1>
            <div className="criar-actions" style={{ justifyContent: "center" }}>
              <Link to="/criar" className="btn-primary btn-primary--cta">
                Criar homenagem
              </Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const photos = data.photos.slice(0, 3);
  const preview = data.message.slice(0, 80);
  const truncated = data.message.length > 80;

  return (
    <div className="criar-page previa-page">
      <PreviaHeader />
      <main className="criar-main previa-main">
        <section className="criar-intro previa-intro">
          <h1 className="criar-title">Sua homenagem ficou pronta ❤️</h1>
          <p className="criar-subtitle">
            Preparamos uma prévia especial com suas fotos, mensagem e trilha sonora. Desbloqueie para ver a versão completa.
          </p>
        </section>

        <article className="previa-card" aria-label="Prévia da homenagem">
          <header className="previa-card__top">
            <div className="previa-card__heart" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <span className="previa-card__eyebrow">FELIZ DIA DOS PAIS</span>
            <h2 className="previa-card__name">{data.fatherName}</h2>
          </header>

          <div className="previa-photos">
            {photos.length === 0 && (
              <div className="previa-photo previa-photo--placeholder">
                <div className="previa-lock" aria-hidden="true">
                  <LockIcon />
                </div>
              </div>
            )}
            {photos.map((p, i) => (
              <div className="previa-photo" key={i}>
                <img src={p.url} alt="" />
                <div className="previa-photo__overlay" />
                <div className="previa-lock" aria-hidden="true">
                  <LockIcon />
                </div>
              </div>
            ))}
          </div>

          <div className="previa-message">
            <p>
              {preview}
              {truncated ? "..." : ""}
            </p>
            <div className="previa-message__locked" aria-hidden="true">
              <span className="previa-bar previa-bar--lg" />
              <span className="previa-bar previa-bar--md" />
              <span className="previa-bar previa-bar--xl" />
            </div>
          </div>

          <div className="previa-signature">Com carinho, {data.fromName}</div>

          <div className="previa-track">
            <div className="previa-track__title">🎵 Trilha sonora escolhida</div>
            {data.track && (
              <div className="previa-track__info">
                <strong>{data.track.title}</strong>
                <span>{data.track.artist}</span>
              </div>
            )}
            <div className="previa-track__locked">🔒 Música liberada após o desbloqueio</div>
          </div>
        </article>

        <section className="previa-cta">
          <h2 className="previa-cta__title">Desbloqueie sua homenagem completa</h2>
          <p className="previa-cta__text">
            Veja tudo sem borrado, leia a mensagem completa, ouça a trilha sonora escolhida e receba seu QR Code exclusivo para compartilhar com seu pai.
          </p>
          <ul className="previa-cta__benefits">
            <li>Todas as fotos liberadas</li>
            <li>Mensagem completa</li>
            <li>Trilha sonora desbloqueada</li>
            <li>QR Code exclusivo</li>
            <li>Link para compartilhar</li>
          </ul>
          <div className="previa-cta__price-label">Desbloqueie por apenas</div>
          <div className="previa-cta__price">R$ 13,90</div>
          <button
            type="button"
            className="btn-primary btn-primary--cta previa-cta__button"
            onClick={() => toast("Checkout será conectado na próxima etapa.")}
          >
            🔓 DESBLOQUEAR AGORA
          </button>
          <p className="previa-cta__note">Pagamento seguro • Liberação imediata</p>
        </section>
      </main>
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10.5" width="16" height="11" rx="2.5" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  );
}

function PreviaHeader() {
  return (
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
        <span className="previa-tag">Prévia da sua homenagem</span>
      </div>
    </header>
  );
}
