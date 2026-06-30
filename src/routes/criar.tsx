import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/criar")({
  head: () => ({
    meta: [
      { title: "Criar homenagem — MemoLove" },
      {
        name: "description",
        content:
          "Preencha as informações e crie em poucos segundos uma homenagem inesquecível para o seu pai.",
      },
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
  component: CriarPage,
});

type Photo = { id: string; url: string; name: string };
type Track = { id: string; title: string; artist: string; cover: string };

const MOCK_TRACKS: Track[] = [
  { id: "1", title: "Pai", artist: "Fábio Jr.", cover: "https://picsum.photos/seed/pai-fabio/120/120" },
  { id: "2", title: "Como É Grande o Meu Amor por Você", artist: "Roberto Carlos", cover: "https://picsum.photos/seed/roberto/120/120" },
  { id: "3", title: "Trem Bala", artist: "Ana Vilela", cover: "https://picsum.photos/seed/trembala/120/120" },
  { id: "4", title: "Minha Velha", artist: "Os Filhos de Francisco", cover: "https://picsum.photos/seed/velha/120/120" },
  { id: "5", title: "You Raise Me Up", artist: "Josh Groban", cover: "https://picsum.photos/seed/raiseup/120/120" },
];

const TOTAL_STEPS = 4;
const MAX_PHOTOS = 7;
const MAX_MSG = 800;

function CriarPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [fatherName, setFatherName] = useState("");
  const [fromName, setFromName] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [query, setQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const progress = (step / TOTAL_STEPS) * 100;

  const filteredTracks = useMemo(() => {
    if (!query.trim()) return MOCK_TRACKS;
    const q = query.toLowerCase();
    return MOCK_TRACKS.filter(
      (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q),
    );
  }, [query]);

  function next() {
    setError(null);
    if (step === 1) {
      if (!fatherName.trim()) return setError("Conte para a gente o nome do seu pai.");
      if (!fromName.trim()) return setError("Inclua o nome de quem está presenteando.");
    }
    if (step === 2 && photos.length < 1) return setError("Envie pelo menos uma foto especial.");
    if (step === 3 && !selectedTrack) return setError("Escolha uma música para a homenagem.");
    if (step === 4) {
      if (!message.trim()) return setError("Escreva uma mensagem para o seu pai.");
      try {
        const payload = {
          fatherName,
          fromName,
          photos: photos.map((p) => ({ name: p.name, url: p.url })),
          track: selectedTrack,
          message,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem("memolove:homenagem", JSON.stringify(payload));
      } catch {}
      navigate({ to: "/preparando" }).catch(() => {
        window.location.href = "/preparando";
      });
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = MAX_PHOTOS - photos.length;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const next: Photo[] = [];
    Array.from(files).slice(0, remaining).forEach((file) => {
      if (!allowed.includes(file.type)) return;
      next.push({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        url: URL.createObjectURL(file),
        name: file.name,
      });
    });
    setPhotos((p) => [...p, ...next]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePhoto(id: string) {
    setPhotos((p) => {
      const target = p.find((x) => x.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return p.filter((x) => x.id !== id);
    });
  }

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
          <Link to="/" className="criar-back">← Voltar</Link>
        </div>
      </header>

      <main className="criar-main">
        <section className="criar-intro">
          <h1 className="criar-title">Vamos criar uma homenagem inesquecível para o seu pai</h1>
          <p className="criar-subtitle">
            Preencha as informações abaixo. Em poucos segundos, você verá uma prévia exclusiva da sua homenagem.
          </p>
        </section>

        <section className="criar-card" aria-label={`Etapa ${step} de ${TOTAL_STEPS}`}>
          <div className="criar-progress">
            <div className="criar-progress__label">
              <span>Etapa {step} de {TOTAL_STEPS}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="criar-progress__bar">
              <div className="criar-progress__fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="criar-step">
            {step === 1 && (
              <div className="criar-step__body">
                <h2 className="criar-step__title">Dados da homenagem</h2>
                <p className="criar-step__hint">Comece nos contando para quem é essa homenagem.</p>

                <label className="criar-field">
                  <span>Nome do pai</span>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="Ex: Carlos"
                    maxLength={80}
                  />
                </label>

                <label className="criar-field">
                  <span>Nome de quem está presenteando</span>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="Ex: João, Maria e família"
                    maxLength={120}
                  />
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="criar-step__body">
                <h2 className="criar-step__title">Envie até 7 fotos especiais</h2>
                <p className="criar-step__hint">
                  Escolha imagens que representem momentos importantes com seu pai.
                </p>

                <div className="criar-upload">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    id="criar-upload-input"
                    hidden
                  />
                  <label htmlFor="criar-upload-input" className="criar-upload__dropzone">
                    <span className="criar-upload__icon" aria-hidden="true">📷</span>
                    <strong>Clique para escolher suas fotos</strong>
                    <span className="criar-upload__formats">JPG, PNG ou WEBP</span>
                  </label>

                  <div className="criar-upload__counter">
                    {photos.length} de {MAX_PHOTOS} fotos enviadas
                  </div>

                  {photos.length > 0 && (
                    <ul className="criar-photos">
                      {photos.map((p) => (
                        <li key={p.id} className="criar-photo">
                          <img src={p.url} alt={p.name} />
                          <button
                            type="button"
                            className="criar-photo__remove"
                            onClick={() => removePhoto(p.id)}
                            aria-label={`Remover ${p.name}`}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="criar-step__body">
                <h2 className="criar-step__title">Escolha a trilha sonora da homenagem</h2>
                <p className="criar-step__hint">
                  Pesquise uma música especial para acompanhar esse momento.
                </p>

                <label className="criar-field">
                  <span className="visually-hidden">Buscar música</span>
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Digite o nome da música ou artista"
                  />
                </label>

                <ul className="criar-tracks">
                  {filteredTracks.map((t) => {
                    const isSelected = selectedTrack?.id === t.id;
                    const isPlaying = playingId === t.id;
                    return (
                      <li key={t.id} className={`criar-track${isSelected ? " is-selected" : ""}`}>
                        <img src={t.cover} alt="" className="criar-track__cover" />
                        <div className="criar-track__info">
                          <strong>{t.title}</strong>
                          <span>{t.artist}</span>
                        </div>
                        <div className="criar-track__actions">
                          <button
                            type="button"
                            className="criar-track__play"
                            onClick={() => setPlayingId(isPlaying ? null : t.id)}
                            aria-label={isPlaying ? "Pausar prévia" : "Tocar prévia"}
                          >
                            {isPlaying ? "❚❚" : "▶"}
                          </button>
                          <button
                            type="button"
                            className={`criar-track__select${isSelected ? " is-selected" : ""}`}
                            onClick={() => setSelectedTrack(t)}
                          >
                            {isSelected ? "Selecionada" : "Selecionar"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                  {filteredTracks.length === 0 && (
                    <li className="criar-tracks__empty">Nenhuma música encontrada.</li>
                  )}
                </ul>
              </div>
            )}

            {step === 4 && (
              <div className="criar-step__body">
                <h2 className="criar-step__title">Escreva sua declaração</h2>
                <p className="criar-step__hint">
                  Use suas próprias palavras. Escreva algo que você gostaria que seu pai nunca esquecesse.
                </p>

                <label className="criar-field">
                  <span className="visually-hidden">Mensagem</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, MAX_MSG))}
                    placeholder="Pai, obrigado por tudo que você fez por mim..."
                    rows={8}
                    maxLength={MAX_MSG}
                  />
                </label>
                <div className="criar-counter">
                  {message.length} / {MAX_MSG} caracteres
                </div>
              </div>
            )}

            {error && <div className="criar-error" role="alert">{error}</div>}

            <div className="criar-actions">
              {step > 1 ? (
                <button type="button" className="btn-ghost" onClick={back}>
                  ← Voltar
                </button>
              ) : <span />}
              <button type="button" className="btn-primary btn-primary--cta" onClick={next}>
                {step === TOTAL_STEPS ? "Gerar minha prévia" : "Continuar →"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
