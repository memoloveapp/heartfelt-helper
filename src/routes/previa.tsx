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
      <div className="criar-page previa-page">
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

  const handlePhotoTap = () => {
    toast("Desbloqueie sua homenagem para visualizar esta foto.");
  };
  const handleTrackTap = () => {
    toast("Desbloqueie para ouvir a trilha sonora.");
  };

  return (
    <div className="criar-page previa-page">
      <div className="previa-glow" aria-hidden="true" />
      <PreviaHeader />
      <main className="criar-main previa-main">
        <section className="criar-intro previa-intro previa-anim-intro">
          <h1 className="criar-title previa-title">❤️ Sua homenagem está pronta.</h1>
          <p className="criar-subtitle">
            Ela já foi criada com sucesso. Veja uma prévia abaixo e desbloqueie a versão completa.
          </p>
        </section>

        <article className="previa-card previa-book previa-anim-card" aria-label="Livro de memórias">
          {/* 1. Capa */}
          <header className="previa-book__cover">
            <div className="previa-card__heart" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <span className="previa-book__eyebrow">MEMOLOVE</span>
            <h2 className="previa-book__title">Feliz Dia dos Pais</h2>
            <div className="previa-book__name">{data.fatherName}</div>
            <p className="previa-book__sub">Uma homenagem criada especialmente para você.</p>
            <div className="previa-book__rule" aria-hidden="true" />
          </header>

          {/* 2. Primeira foto grande */}
          {photos[0] && (
            <button
              type="button"
              className="previa-photo previa-photo--hero previa-photo--soft"
              onClick={handlePhotoTap}
              aria-label="Foto bloqueada"
            >
              <img src={photos[0].url} alt="" />
              <div className="previa-photo__overlay" />
              <div className="previa-lock" aria-hidden="true"><LockIcon /></div>
            </button>
          )}
          {photos.length === 0 && (
            <button type="button" className="previa-photo previa-photo--hero previa-photo--placeholder" onClick={handlePhotoTap}>
              <div className="previa-lock" aria-hidden="true"><LockIcon /></div>
            </button>
          )}

          {/* 3. Frase divisória */}
          <p className="previa-book__quote">
            "Algumas lembranças merecem viver para sempre."
          </p>

          {/* 4. Galeria dinâmica */}
          {photos.length > 1 && (
            <div className="previa-book__gallery">
              {photos[1] && (
                <button type="button" className="previa-photo gal gal--sm" onClick={handlePhotoTap} aria-label="Foto bloqueada">
                  <img src={photos[1].url} alt="" />
                  <div className="previa-photo__overlay" />
                  <div className="previa-lock" aria-hidden="true"><LockIcon /></div>
                </button>
              )}
              {photos[2] && (
                <button type="button" className="previa-photo gal gal--sm" onClick={handlePhotoTap} aria-label="Foto bloqueada">
                  <img src={photos[2].url} alt="" />
                  <div className="previa-photo__overlay" />
                  <div className="previa-lock" aria-hidden="true"><LockIcon /></div>
                </button>
              )}
              {photos[3] && (
                <button type="button" className="previa-photo gal gal--lg" onClick={handlePhotoTap} aria-label="Foto bloqueada">
                  <img src={photos[3].url} alt="" />
                  <div className="previa-photo__overlay" />
                  <div className="previa-lock" aria-hidden="true"><LockIcon /></div>
                </button>
              )}
              {photos[4] && (
                <button type="button" className="previa-photo gal gal--sm gal--full" onClick={handlePhotoTap} aria-label="Foto bloqueada">
                  <img src={photos[4].url} alt="" />
                  <div className="previa-photo__overlay" />
                  <div className="previa-lock" aria-hidden="true"><LockIcon /></div>
                </button>
              )}
            </div>
          )}

          {/* 5. Mensagem - carta */}
          <div className="previa-letter">
            <h3 className="previa-letter__title">Uma mensagem do coração</h3>
            <p className="previa-letter__text">
              {preview}
              {truncated ? "..." : ""}
            </p>
            <div className="previa-message__locked" aria-hidden="true">
              <span className="previa-bar previa-bar--xl" />
              <span className="previa-bar previa-bar--lg" />
              <span className="previa-bar previa-bar--md" />
            </div>
          </div>

          {/* 6. Assinatura */}
          <div className="previa-signature previa-signature--book">
            <span>Com carinho,</span>
            <strong>{data.fromName}</strong>
          </div>

          {/* 7. Música - player */}
          <button type="button" className="previa-player" onClick={handleTrackTap}>
            <div className="previa-player__icon" aria-hidden="true">🎵</div>
            <div className="previa-player__body">
              {data.track ? (
                <>
                  <strong>{data.track.title}</strong>
                  <span>{data.track.artist}</span>
                </>
              ) : (
                <strong>Trilha sonora escolhida</strong>
              )}
            </div>
            <div className="previa-player__divider" aria-hidden="true" />
            <div className="previa-player__locked">🔒 Disponível após desbloqueio</div>
          </button>

          {/* 8. Final */}
          <p className="previa-book__footer">
            Sua homenagem já está pronta. Falta apenas desbloquear.
          </p>
        </article>


        <section className="previa-cta previa-anim-cta">
          <h2 className="previa-cta__title">Desbloqueie sua homenagem completa</h2>
          <p className="previa-cta__text">
            Veja todas as fotos em alta qualidade, leia sua mensagem completa, ouça a trilha sonora escolhida e receba um QR Code exclusivo para compartilhar esse momento com seu pai.
          </p>
          <ul className="previa-cta__benefits">
            <li><span>📷</span> Veja todas as fotos em alta qualidade</li>
            <li><span>💌</span> Leia sua mensagem completa</li>
            <li><span>🎵</span> Ouça a trilha sonora escolhida</li>
            <li><span>📱</span> Receba um QR Code exclusivo</li>
            <li><span>🔗</span> Compartilhe com toda a família</li>
          </ul>
          <div className="previa-cta__price-old">De <s>R$ 27,90</s></div>
          <div className="previa-cta__price-label">por apenas</div>
          <div className="previa-cta__price">R$ 13,90</div>
          <div className="previa-cta__badge">🎉 Oferta especial de lançamento</div>
          <button
            type="button"
            className="btn-primary previa-cta__button"
            onClick={() => toast("Checkout será conectado na próxima etapa.")}
          >
            ❤️ DESBLOQUEAR POR R$ 13,90
          </button>
          <div className="previa-cta__assurance">
            <span>🔒 Pagamento 100% seguro</span>
            <span>⚡ Liberação imediata</span>
          </div>
        </section>
      </main>
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
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
