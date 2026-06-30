import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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

function PreviaPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [data, setData] = useState<Saved>({});
  const [index, setIndex] = useState(0);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("memolove:homenagem") : null;
      if (!raw) {
        setStatus("missing");
        return;
      }
      const parsed = JSON.parse(raw) as Saved;
      setData(parsed || {});
      setStatus("ready");
    } catch {
      setStatus("missing");
    }
  }, []);

  if (status === "loading") {
    return <div className="previa-shell previa-loading">Carregando…</div>;
  }

  if (status === "missing") {
    return (
      <div className="previa-shell previa-empty-shell">
        <div className="previa-empty">
          <h1>Não encontramos os dados da sua homenagem.</h1>
          <Link to="/criar" className="previa-empty__cta">Criar homenagem</Link>
        </div>
      </div>
    );
  }

  const photos: Photo[] = Array.isArray(data.photos) ? data.photos.filter((p) => p && p.url) : [];
  const fatherName = (data.fatherName || "").trim() || "Seu pai";
  const fromName = (data.fromName || "").trim() || "Com carinho";
  const message = (data.message || "").trim();
  const track = data.track || null;

  const slides = [
    "cover",
    "photo1",
    "photo2",
    "letter",
    "music",
    "album",
    "final",
  ] as const;
  const total = slides.length;

  const goTo = (i: number) => setIndex(Math.max(0, Math.min(total - 1, i)));
  const current = slides[index];

  return (
    <div className="previa-shell">
      <Link to="/" className="previa-brand" aria-label="MemoLove">
        Memo<em>Love</em>
      </Link>

      <div className="previa-stage">
        {current === "cover" && (
          <SlideCover photo={photos[0]} fatherName={fatherName} />
        )}
        {current === "photo1" && (
          <SlidePhoto photo={photos[1] || photos[0]} text="Algumas histórias merecem viver para sempre." />
        )}
        {current === "photo2" && (
          <SlidePhoto photo={photos[2] || photos[1] || photos[0]} text="Obrigado por todos os momentos que compartilhamos." />
        )}
        {current === "letter" && <SlideLetter message={message} />}
        {current === "music" && <SlideMusic track={track} />}
        {current === "album" && <SlideAlbum photos={photos} />}
        {current === "final" && <SlideFinal fromName={fromName} />}
      </div>

      <div className="previa-nav">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            className="previa-dot"
            data-active={i === index}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {index > 0 && (
        <button type="button" className="previa-arrow previa-arrow--prev" onClick={() => goTo(index - 1)} aria-label="Anterior">‹</button>
      )}
      {index < total - 1 && (
        <button type="button" className="previa-arrow previa-arrow--next" onClick={() => goTo(index + 1)} aria-label="Próximo">›</button>
      )}
    </div>
  );
}

function SlideCover({ photo, fatherName }: { photo?: Photo; fatherName: string }) {
  return (
    <section className="slide slide--cover">
      {photo ? (
        <div className="slide__bg"><img src={photo.url} alt="" /></div>
      ) : (
        <div className="slide__bg slide__bg--placeholder" />
      )}
      <div className="slide__overlay" />
      <div className="slide__content">
        <div className="slide__heart">❤️</div>
        <div className="slide__eyebrow">Feliz Dia dos Pais</div>
        <h1 className="slide__title">{fatherName}</h1>
        <p className="slide__hint">Use as setas para navegar →</p>
      </div>
    </section>
  );
}

function SlidePhoto({ photo, text }: { photo?: Photo; text: string }) {
  return (
    <section className="slide slide--photo">
      {photo ? (
        <div className="slide__bg slide__bg--soft"><img src={photo.url} alt="" /></div>
      ) : (
        <div className="slide__bg slide__bg--placeholder" />
      )}
      <div className="slide__overlay slide__overlay--soft" />
      <div className="slide__content slide__content--bottom">
        <p className="slide__quote">{text}</p>
      </div>
    </section>
  );
}

function SlideLetter({ message }: { message: string }) {
  const preview = message ? message.slice(0, 80) + (message.length > 80 ? "…" : "") : "Uma mensagem especial foi escrita com muito carinho.";
  return (
    <section className="slide slide--letter">
      <div className="letter">
        <span className="letter__eyebrow">Uma mensagem do coração</span>
        <p className="letter__text">{preview}</p>
        <div className="letter__lines"><span /><span /><span /></div>
        <div className="letter__lock">
          <div className="lock-glass">🔒</div>
          <p>Continuação disponível após desbloqueio.</p>
        </div>
      </div>
    </section>
  );
}

function SlideMusic({ track }: { track: Track }) {
  return (
    <section className="slide slide--music">
      <div className="player">
        <div className="player__cover">
          {track?.cover ? <img src={track.cover} alt="" /> : <div className="player__cover-fallback">🎵</div>}
          <div className="player__cover-lock">🔒</div>
        </div>
        <div className="player__meta">
          <strong>{track?.title || "Trilha sonora escolhida"}</strong>
          <span>{track?.artist || ""}</span>
        </div>
        <div className="player__bar"><div className="player__bar-fill" /></div>
        <p className="player__locked">Trilha sonora disponível após desbloqueio.</p>
      </div>
    </section>
  );
}

function SlideAlbum({ photos }: { photos: Photo[] }) {
  const sample = photos.slice(0, 4);
  return (
    <section className="slide slide--album">
      <div className="album">
        <div className="album__grid">
          {sample.length === 0 && <div className="album__cell album__cell--empty" />}
          {sample.map((p, i) => (
            <div className="album__cell" key={i} data-pos={i}>
              <img src={p.url} alt="" />
              <div className="album__lock">🔒</div>
            </div>
          ))}
        </div>
        <p className="album__quote">As lembranças mais bonitas merecem ser eternizadas.</p>
      </div>
    </section>
  );
}

function SlideFinal({ fromName }: { fromName: string }) {
  return (
    <section className="slide slide--final">
      <div className="final">
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

        <button type="button" className="final__cta">
          ❤️ VER MINHA HOMENAGEM COMPLETA
        </button>

        <p className="final__signature">— {fromName}</p>
      </div>
    </section>
  );
}
