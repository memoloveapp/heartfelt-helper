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
      { threshold: 0.18, rootMargin: "0px 0px -80px 0px" }
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

  const startUnlockSequence = () => {
    if (unlockPhase !== "idle") return;
    setUnlockPhase("loading");
    window.setTimeout(() => setUnlockPhase("dimming"), 600);
    window.setTimeout(() => setUnlockPhase("teasing"), 750);
    window.setTimeout(() => setUnlockPhase("relocking"), 1050);
    window.setTimeout(() => setShowModal(true), 1350);
  };

  const closeModal = () => {
    setShowModal(false);
    setCheckoutMsg(false);
    setUnlockPhase("idle");
  };

  if (status === "loading") {
    return <div className="trailer-page trailer-loading">Carregando…</div>;
  }

  if (status === "missing") {
    return (
      <div className="trailer-page trailer-empty">
        <div className="trailer-empty__inner">
          <h1>Não encontramos os dados da sua homenagem.</h1>
          <Link to="/criar" className="trailer-empty__cta">Criar homenagem</Link>
        </div>
      </div>
    );
  }

  const photos: Photo[] = Array.isArray(data.photos) ? data.photos.filter((p) => p && p.url) : [];
  const fatherName = (data.fatherName || "").trim() || "Seu pai";
  const fromName = (data.fromName || "").trim();
  const message = (data.message || "").trim();

  const heroPhoto = photos[0];
  const secondPhoto = photos[1] || photos[0];

  const preview = message
    ? message.slice(0, 80) + (message.length > 80 ? "..." : "...")
    : "Uma mensagem escrita com muito carinho para você...";

  const tapPhoto = () => toast("Desbloqueie para visualizar esta lembrança.");
  const tapMessage = () => toast("Continue lendo após o desbloqueio.");

  return (
    <div className={`trailer-page unlock-${unlockPhase}`} ref={rootRef}>
      <header className="trailer-topbar">
        <Link to="/" className="trailer-brand" aria-label="MemoLove — Início">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>Memo<em>Love</em></span>
        </Link>
      </header>

      {/* SEÇÃO 1 — HERO */}
      <section className="trailer-scene trailer-hero">
        <div className="trailer-hero__photo" onClick={tapPhoto} role="button" tabIndex={0}>
          {heroPhoto ? <img src={heroPhoto.url} alt="" className="kenburns" /> : <div className="trailer-hero__placeholder" />}
          <div className="trailer-hero__veil" />
        </div>
        <div className="trailer-hero__overlay">
          <div className="trailer-hero__heart">❤️</div>
          <h1 className="trailer-hero__title">Feliz Dia dos Pais</h1>
          <div className="trailer-hero__name">{fatherName}</div>
          <p className="trailer-hero__sub">Uma homenagem criada especialmente para você.</p>
        </div>
      </section>

      {/* SEÇÃO 2 — Foto + frase */}
      <section className="trailer-scene trailer-quote-scene">
        <figure className="trailer-bigphoto reveal" onClick={tapPhoto} role="button" tabIndex={0}>
          {secondPhoto ? <img src={secondPhoto.url} alt="" className="kenburns kenburns--slow" /> : <div className="trailer-hero__placeholder" />}
        </figure>
        <blockquote className="trailer-quote reveal">
          “Algumas lembranças merecem viver para sempre.”
        </blockquote>
      </section>

      {/* SEÇÃO 3 — Carta */}
      <section className="trailer-scene trailer-letter-scene">
        <div className="trailer-letter reveal" onClick={tapMessage} role="button" tabIndex={0}>
          <span className="trailer-letter__eyebrow">Uma mensagem do coração</span>
          <p className="trailer-letter__text">{preview}</p>
          <div className="trailer-letter__lines" aria-hidden="true">
            <span /><span /><span /><span />
          </div>
          <p className="trailer-letter__lock">🔒 Continue lendo após o desbloqueio.</p>
          {fromName && (
            <div className="trailer-letter__sign">
              <span>Com carinho,</span>
              <strong>{fromName}</strong>
            </div>
          )}
        </div>
      </section>

      {/* SEÇÃO 4 — Final */}
      <section className="trailer-scene trailer-final">
        <div className="trailer-final__inner reveal">
          <div className="trailer-final__spark">✨</div>
          <h2 className="trailer-final__title">Sua homenagem já está pronta.</h2>
          <p className="trailer-final__text">
            Tudo foi preparado.
            <br />
            Agora falta apenas um passo para revelar a versão completa.
          </p>

          <ul className="trailer-final__list">
            <li><span>📷</span> Todas as fotos em alta qualidade</li>
            <li><span>💌</span> Mensagem completa</li>
            <li><span>🎵</span> Trilha sonora liberada</li>
            <li><span>📱</span> QR Code exclusivo</li>
            <li><span>🔗</span> Link para compartilhar</li>
          </ul>

          <div className="trailer-price">
            <div className="trailer-price__old">De <s>R$ 27,90</s></div>
            <div className="trailer-price__label">Hoje por apenas</div>
            <div className="trailer-price__now">R$ 13,90</div>
            <span className="trailer-price__badge">Oferta Especial</span>
          </div>

          <button
            type="button"
            className="trailer-cta"
            onClick={startUnlockSequence}
            disabled={unlockPhase !== "idle"}
          >
            {unlockPhase === "loading" ? (
              <><span className="trailer-spinner" aria-hidden="true" />Preparando seu acesso...</>
            ) : (
              <>❤️ REVELAR MINHA HOMENAGEM</>
            )}
          </button>

          <div className="trailer-assurance">
            <span>🔒 Pagamento 100% seguro</span>
            <span>⚡ Liberação imediata</span>
          </div>
        </div>
      </section>

      {(unlockPhase !== "idle" || showModal) && <div className="trailer-dim" aria-hidden="true" />}

      {showModal && (
        <div className="trailer-modal" role="dialog" aria-modal="true">
          <div className="trailer-modal__backdrop" onClick={closeModal} />
          <div className="trailer-modal__card">
            <h2 className="trailer-modal__title">🔒 Sua homenagem já está pronta.</h2>
            <p className="trailer-modal__text">
              Ela já foi criada e está pronta para ser acessada.
              <br />
              Falta apenas confirmar o pagamento para liberar a versão completa.
            </p>
            <ul className="trailer-modal__benefits">
              <li>✔ Fotos em alta qualidade</li>
              <li>✔ Mensagem completa</li>
              <li>✔ Trilha sonora</li>
              <li>✔ QR Code exclusivo</li>
              <li>✔ Link para compartilhar</li>
            </ul>
            <div className="trailer-modal__price">
              <div className="trailer-modal__price-old">De <s>R$ 27,90</s></div>
              <div className="trailer-modal__price-label">Hoje por apenas</div>
              <div className="trailer-modal__price-now">R$ 13,90</div>
            </div>
            {checkoutMsg ? (
              <p className="trailer-modal__notice">Checkout será conectado na próxima etapa.</p>
            ) : (
              <button type="button" className="trailer-modal__primary" onClick={() => setCheckoutMsg(true)}>
                CONTINUAR PARA O PAGAMENTO
              </button>
            )}
            <button type="button" className="trailer-modal__secondary" onClick={closeModal}>Voltar</button>
          </div>
        </div>
      )}
    </div>
  );
}
