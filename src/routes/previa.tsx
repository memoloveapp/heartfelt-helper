import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/previa")({
  head: () => ({
    meta: [
      { title: "Prévia da sua homenagem — MemoLove" },
      { name: "description", content: "Prévia da sua homenagem MemoLove." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: "css/tokens.css" },
      { rel: "stylesheet", href: "css/base.css" },
      { rel: "stylesheet", href: "css/previa.css" },
    ],
  }),
  component: PreviaPage,
  ssr: false,
});

type Photo = { name?: string; url: string };
type Track = { title?: string; artist?: string; cover?: string } | null;
type Saved = {
  fatherName?: string;
  fromName?: string;
  photos?: Photo[];
  track?: Track;
  message?: string;
};

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </svg>
  );
}

function useScrollReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return rootRef;
}

function PreviaPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [data, setData] = useState<Saved>({});
  const [unlockPhase, setUnlockPhase] = useState<"idle" | "loading" | "dimming" | "teasing" | "relocking">("idle");
  const [showModal, setShowModal] = useState(false);
  const [checkoutMsg, setCheckoutMsg] = useState(false);
  const rootRef = useScrollReveal();

  const startUnlockSequence = () => {
    if (unlockPhase !== "idle") return;
    setUnlockPhase("loading");
    window.setTimeout(() => setUnlockPhase("dimming"), 600);
    window.setTimeout(() => setUnlockPhase("teasing"), 750);
    window.setTimeout(() => setUnlockPhase("relocking"), 1050);
    window.setTimeout(() => {
      setShowModal(true);
    }, 1350);
  };

  const closeModal = () => {
    setShowModal(false);
    setCheckoutMsg(false);
    setUnlockPhase("idle");
  };

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("memolove:homenagem") : null;
      if (!raw) return setStatus("missing");
      setData((JSON.parse(raw) as Saved) || {});
      setStatus("ready");
    } catch {
      setStatus("missing");
    }
  }, []);

  if (status === "loading") {
    return <div className="previa-page previa-loading">Carregando…</div>;
  }

  if (status === "missing") {
    return (
      <div className="previa-page previa-empty-shell">
        <div className="previa-empty">
          <h1>Não encontramos os dados da sua homenagem.</h1>
          <Link to="/criar" className="previa-empty__cta">Criar homenagem</Link>
        </div>
      </div>
    );
  }

  const photos: Photo[] = Array.isArray(data.photos) ? data.photos.filter((p) => p && p.url) : [];
  const fatherName = (data.fatherName || "").trim() || "Seu pai";
  const fromName = (data.fromName || "").trim();
  const message = (data.message || "").trim();
  const track = data.track || null;

  const heroPhoto = photos[0];
  const galleryPhotos = photos.slice(1, 4);

  const preview = message
    ? message.slice(0, 80) + (message.length > 80 ? "..." : "")
    : "Uma mensagem especial foi escrita com muito carinho.";

  const handlePhotoTap = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.classList.remove("is-shaking");
    // restart animation
    void el.offsetWidth;
    el.classList.add("is-shaking");
    toast("🔒 Desbloqueie para visualizar esta foto.");
  };

  return (
    <div className={`previa-page previa-fade unlock-${unlockPhase}`} ref={rootRef}>
      <header className="previa-topbar">

        <Link to="/" className="previa-brand" aria-label="MemoLove — Início">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>Memo<em>Love</em></span>
        </Link>
      </header>

      <main className="previa-main">
        {/* 1. Abertura */}
        <section className="previa-intro intro-anim">
          <h1>❤️ Sua homenagem está pronta.</h1>
          <p>Ela já foi criada com sucesso. Veja uma prévia abaixo e desbloqueie a versão completa.</p>
        </section>

        {/* 2. Bloco da homenagem */}
        <article className="previa-album intro-anim intro-anim--3">
          <header className="previa-album__head">
            <span className="previa-album__eyebrow">MEMOLOVE</span>
            <h2 className="previa-album__title">Feliz Dia dos Pais</h2>
            <div className="previa-album__name">{fatherName}</div>
            <p className="previa-album__sub">Uma homenagem criada especialmente para você.</p>
          </header>

          {/* 3. Primeira foto */}
          <figure
            className="previa-photo previa-photo--hero intro-anim intro-anim--4"
            onClick={handlePhotoTap}
            role="button"
            tabIndex={0}
          >
            {heroPhoto ? (
              <img src={heroPhoto.url} alt="" />
            ) : (
              <div className="previa-photo__placeholder" />
            )}
            <div className="previa-photo__overlay" />
            <div className="lock-glass"><LockIcon /></div>
          </figure>

          {/* 4. Frase */}
          <p className="previa-quote reveal">Algumas lembranças merecem viver para sempre.</p>

          {/* 5. Galeria vertical */}
          {galleryPhotos.length > 0 && (
            <div className="previa-gallery">
              {galleryPhotos.map((p, i) => (
                <figure
                  key={i}
                  className="previa-photo reveal"
                  style={{ transitionDelay: `${i * 90}ms` }}
                  onClick={handlePhotoTap}
                  role="button"
                  tabIndex={0}
                >
                  <img src={p.url} alt="" />
                  <div className="previa-photo__overlay" />
                  <div className="lock-glass"><LockIcon /></div>
                </figure>
              ))}
            </div>
          )}

          {/* 6. Mensagem */}
          <div className="previa-letter reveal">
            <span className="previa-letter__eyebrow">Uma mensagem do coração</span>
            <p className="previa-letter__text">{preview}</p>
            <div className="previa-letter__lines" aria-hidden="true">
              <span /><span /><span />
            </div>
            <p className="previa-letter__lock">🔒 Continuação disponível após desbloqueio.</p>
          </div>

          {/* 7. Música */}
          <div className="previa-player reveal">
            <div className="previa-player__top">🎵 Trilha sonora escolhida</div>
            <div className="previa-player__meta">
              <strong>{track?.title || "Música selecionada"}</strong>
              <span>{track?.artist || ""}</span>
            </div>
            <p className="previa-player__lock">🔒 Disponível após desbloqueio.</p>
          </div>

          {/* 8. Assinatura */}
          {fromName && (
            <div className="previa-signature reveal">
              <span>Com carinho,</span>
              <strong>{fromName}</strong>
            </div>
          )}
        </article>

        {/* 9. Reassurance */}
        <section className="previa-reassure reveal">
          <span>✨</span>
          <p>
            <strong>Sua homenagem já foi criada com sucesso.</strong>
            <br />
            Agora falta apenas um passo para liberar a versão completa.
          </p>
        </section>

        {/* 10 + 11. Desbloqueio */}
        <section className="previa-cta reveal">
          <ul className="previa-cta__benefits">
            <li><span>📷</span> Fotos em alta qualidade</li>
            <li><span>💌</span> Mensagem completa</li>
            <li><span>🎵</span> Trilha sonora liberada</li>
            <li><span>📱</span> QR Code exclusivo</li>
            <li><span>🔗</span> Link para compartilhar</li>
          </ul>

          <div className="previa-cta__price reveal">
            <div className="previa-cta__price-old">De <s>R$ 27,90</s></div>
            <div className="previa-cta__price-label">Hoje por apenas</div>
            <div className="previa-cta__price-now">R$ 13,90</div>
            <span className="previa-cta__badge">💝 Oferta Especial</span>
          </div>

          <button type="button" className="previa-cta__button reveal">
            ❤️ QUERO VER MINHA HOMENAGEM COMPLETA
          </button>

          <div className="previa-cta__assurance">
            🔒 Pagamento 100% seguro • ⚡ Liberação imediata
          </div>
        </section>
      </main>
    </div>
  );
}
