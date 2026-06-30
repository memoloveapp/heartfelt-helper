import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/previa")({
  head: () => ({
    meta: [
      { title: "Prévia da sua homenagem — MemoLove" },
      { name: "description", content: "Prévia cinematográfica da sua homenagem MemoLove." },
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
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

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
      <div className="previa-shell previa-empty-shell">
        <div className="previa-empty">
          <h1>Não encontramos os dados da sua homenagem.</h1>
          <Link to="/criar" className="previa-empty__cta">Criar homenagem</Link>
        </div>
      </div>
    );
  }

  const photos = data.photos;
  const slides: SlideDef[] = [
    { type: "cover" },
    { type: "photo-text", photoIndex: 1, text: "Algumas histórias merecem viver para sempre." },
    { type: "photo-text", photoIndex: 2, text: "Obrigado por todos os momentos que compartilhamos." },
    { type: "letter" },
    { type: "music" },
    { type: "album" },
    { type: "final" },
  ];

  const total = slides.length;

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(total - 1, i));
    setIndex(next);
    trackRef.current?.scrollTo({ left: next * window.innerWidth, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / window.innerWidth);
    if (i !== index) setIndex(i);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(index + 1);
      if (e.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="previa-shell">
      <Link to="/" className="previa-brand" aria-label="MemoLove">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span>Memo<em>Love</em></span>
      </Link>

      <div className="previa-track" ref={trackRef} onScroll={onScroll}>
        {slides.map((slide, i) => (
          <div className="previa-slide" key={i} data-active={i === index}>
            <SlideRenderer slide={slide} data={data} photos={photos} active={i === index} onUnlock={() => goTo(total - 1)} />
          </div>
        ))}
      </div>

      <div className="previa-nav" aria-hidden="true">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            className="previa-dot"
            data-active={i === index}
            onClick={() => goTo(i)}
            aria-label={`Ir para slide ${i + 1}`}
          />
        ))}
      </div>

      {index > 0 && (
        <button type="button" className="previa-arrow previa-arrow--prev" onClick={() => goTo(index - 1)} aria-label="Anterior">
          ‹
        </button>
      )}
      {index < total - 1 && (
        <button type="button" className="previa-arrow previa-arrow--next" onClick={() => goTo(index + 1)} aria-label="Próximo">
          ›
        </button>
      )}
    </div>
  );
}

type SlideDef =
  | { type: "cover" }
  | { type: "photo-text"; photoIndex: number; text: string }
  | { type: "letter" }
  | { type: "music" }
  | { type: "album" }
  | { type: "final" };

function SlideRenderer({
  slide,
  data,
  photos,
  active,
  onUnlock,
}: {
  slide: SlideDef;
  data: Saved;
  photos: Saved["photos"];
  active: boolean;
  onUnlock: () => void;
}) {
  const handleCheckout = () => toast("Checkout será conectado na próxima etapa.");

  if (slide.type === "cover") {
    const photo = photos[0]?.url;
    return (
      <div className="slide slide--cover">
        {photo && (
          <div className="slide__bg">
            <img src={photo} alt="" className="kenburns" />
          </div>
        )}
        <div className="slide__overlay" />
        <div className="slide__content slide__content--center fade-up">
          <div className="slide__heart">❤️</div>
          <div className="slide__eyebrow">Feliz Dia dos Pais</div>
          <h1 className="slide__title">{data.fatherName}</h1>
          <p className="slide__sub slide__sub--light">Uma homenagem criada especialmente para você.</p>
        </div>
        <div className="slide__swipe">
          <span>Deslize para começar</span>
          <span className="slide__arrow">→</span>
        </div>
      </div>
    );
  }

  if (slide.type === "photo-text") {
    const photo = photos[slide.photoIndex]?.url ?? photos[0]?.url;
    return (
      <div className="slide slide--photo">
        {photo ? (
          <div className="slide__bg slide__bg--soft">
            <img src={photo} alt="" className="kenburns" />
          </div>
        ) : (
          <div className="slide__bg slide__bg--placeholder" />
        )}
        <div className="slide__overlay slide__overlay--soft" />
        <div className="slide__content slide__content--bottom fade-up" key={active ? "a" : "b"}>
          <p className="slide__quote">{slide.text}</p>
        </div>
      </div>
    );
  }

  if (slide.type === "letter") {
    const preview = data.message.slice(0, 80);
    const truncated = data.message.length > 80;
    return (
      <div className="slide slide--letter">
        <div className="letter fade-up">
          <span className="letter__eyebrow">Uma mensagem do coração</span>
          <p className="letter__text">
            {preview}
            {truncated ? "…" : ""}
          </p>
          <div className="letter__lines" aria-hidden="true">
            <span /><span /><span /><span />
          </div>
          <div className="letter__lock">
            <div className="lock-glass"><LockIcon /></div>
            <p>Continuação disponível após desbloqueio.</p>
          </div>
        </div>
      </div>
    );
  }

  if (slide.type === "music") {
    const t = data.track;
    return (
      <div className="slide slide--music">
        <div className="player fade-up">
          <div className="player__cover">
            {t?.cover ? <img src={t.cover} alt="" /> : <div className="player__cover-fallback">🎵</div>}
            <div className="player__cover-lock"><LockIcon /></div>
          </div>
          <div className="player__meta">
            <strong>{t?.title ?? "Trilha sonora escolhida"}</strong>
            <span>{t?.artist ?? ""}</span>
          </div>
          <div className="player__bar"><div className="player__bar-fill" /></div>
          <div className="player__controls">
            <button type="button" className="player__play" disabled aria-label="Play bloqueado">
              <LockIcon />
            </button>
          </div>
          <p className="player__locked">Trilha sonora disponível após desbloqueio.</p>
        </div>
      </div>
    );
  }

  if (slide.type === "album") {
    const sample = photos.slice(0, 4);
    return (
      <div className="slide slide--album">
        <div className="album fade-up">
          <div className="album__grid">
            {sample.map((p, i) => (
              <div className="album__cell" key={i} data-pos={i}>
                <img src={p.url} alt="" />
                <div className="album__lock"><LockIcon /></div>
              </div>
            ))}
            {sample.length === 0 && <div className="album__cell album__cell--empty" />}
          </div>
          <p className="album__quote">As lembranças mais bonitas merecem ser eternizadas.</p>
        </div>
      </div>
    );
  }

  // final
  return (
    <div className="slide slide--final">
      <div className="final fade-up">
        <div className="final__heart">❤️</div>
        <h2 className="final__title">Sua homenagem está pronta.</h2>
        <p className="final__sub">
          Ela já foi criada. Agora falta apenas um passo para liberar a versão completa.
        </p>

        <ul className="final__benefits">
          <li><span>✔</span> Fotos em alta qualidade</li>
          <li><span>✔</span> Mensagem completa</li>
          <li><span>✔</span> Música liberada</li>
          <li><span>✔</span> QR Code exclusivo</li>
          <li><span>✔</span> Link para compartilhar</li>
        </ul>

        <div className="final__price">
          <div className="final__price-old">De <s>R$ 27,90</s></div>
          <div className="final__price-now">R$ 13,90</div>
          <span className="final__badge">💝 Oferta Especial</span>
        </div>

        <button type="button" className="final__cta" onClick={handleCheckout}>
          <span className="final__cta-heart">❤️</span>
          <span>VER MINHA HOMENAGEM COMPLETA</span>
        </button>

        <div className="final__assurance">
          <span>🔒 Pagamento seguro</span>
          <span>⚡ Liberação imediata</span>
        </div>
      </div>
      {/* keep reference to avoid unused warning */}
      <span hidden onClick={onUnlock} />
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
