import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/criar")({
  head: () => ({
    meta: [
      { title: "Criar homenagem — MemoLove" },
      {
        name: "description",
        content:
          "Monte em poucos passos uma homenagem premium e inesquecível para o seu pai.",
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

type Photo = { id: string; url: string; name: string; file: File };
type Track = { id: string; title: string; artist: string; cover: string };

const MOCK_TRACKS: Track[] = [
  { id: "1", title: "Pai", artist: "Fábio Jr.", cover: "https://picsum.photos/seed/pai-fabio/120/120" },
  { id: "2", title: "Como É Grande o Meu Amor por Você", artist: "Roberto Carlos", cover: "https://picsum.photos/seed/roberto/120/120" },
  { id: "3", title: "Trem Bala", artist: "Ana Vilela", cover: "https://picsum.photos/seed/trembala/120/120" },
  { id: "4", title: "Minha Velha", artist: "Os Filhos de Francisco", cover: "https://picsum.photos/seed/velha/120/120" },
  { id: "5", title: "You Raise Me Up", artist: "Josh Groban", cover: "https://picsum.photos/seed/raiseup/120/120" },
];

const TOTAL_STEPS = 6;
const MAX_PHOTOS = 7;
const MAX_MSG = 800;

function CriarPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [fatherName, setFatherName] = useState("");
  const [fromName, setFromName] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [query, setQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);


  const progress = (step / TOTAL_STEPS) * 100;

  const filteredTracks = useMemo(() => {
    if (!query.trim()) return MOCK_TRACKS;
    const q = query.toLowerCase();
    return MOCK_TRACKS.filter(
      (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validateStep(s: number): string | null {
    if (s === 1 && !fatherName.trim()) return "Conte para a gente o nome do seu pai.";
    if (s === 2 && !fromName.trim()) return "Inclua o nome de quem está presenteando.";
    if (s === 3 && photos.length < 1) return "Envie pelo menos uma foto especial.";
    if (s === 4 && !selectedTrack) return "Escolha uma música para a homenagem.";
    if (s === 5 && !message.trim()) return "Escreva uma mensagem para o seu pai.";
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) return setError(err);
    setError(null);

    if (step === TOTAL_STEPS) {
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
    setDirection(1);
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function back() {
    setError(null);
    setDirection(-1);
    setStep((s) => Math.max(1, s - 1));
  }

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = MAX_PHOTOS - photos.length;
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      const incoming: Photo[] = [];
      Array.from(files).slice(0, remaining).forEach((file) => {
        if (!allowed.includes(file.type)) return;
        incoming.push({
          id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
          url: URL.createObjectURL(file),
          name: file.name,
          file,
        });
      });

      setPhotos((p) => [...p, ...incoming]);
      if (fileRef.current) fileRef.current.value = "";
    },
    [photos.length],
  );

  function removePhoto(id: string) {
    setPhotos((p) => {
      const target = p.find((x) => x.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return p.filter((x) => x.id !== id);
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
      next();
    }
  }

  return (
    <div className="wz-page">
      <header className="wz-header">
        <div className="wz-header__inner">
          <Link to="/" className="brand-logo" aria-label="MemoLove — Início">
            <svg className="brand-logo__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z" />
            </svg>
            <span className="brand-logo__text">
              <span className="brand-logo__name">
                <span className="brand-logo__memo">Memo</span><span className="brand-logo__love">Love</span>
              </span>
            </span>
          </Link>
          <span className="wz-step-pill">Etapa {step} de {TOTAL_STEPS}</span>
          <Link to="/" className="wz-back-link">Sair</Link>
        </div>
        <div className="wz-progress" aria-hidden="true">
          <div className="wz-progress__fill" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="wz-main">
        <section className="wz-stage">
          <div
            key={step}
            className={`wz-slide ${direction === 1 ? "wz-slide--right" : "wz-slide--left"}`}
            onKeyDown={onKeyDown}
          >
            {step === 1 && (
              <Question title="Qual é o nome do seu pai?" hint="Esse será o nome exibido na homenagem.">
                <input
                  autoFocus
                  className="wz-input"
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="Ex.: Carlos Roberto"
                  maxLength={80}
                />
              </Question>
            )}

            {step === 2 && (
              <Question title="Quem está preparando essa homenagem?" hint="Seu nome aparecerá na assinatura final.">
                <input
                  autoFocus
                  className="wz-input"
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Ex.: Renan"
                  maxLength={120}
                />
              </Question>
            )}

            {step === 3 && (
              <Question title="Escolha as melhores fotos." hint={`Você pode enviar até ${MAX_PHOTOS} fotos.`}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  id="wz-upload-input"
                  hidden
                />
                <label
                  htmlFor="wz-upload-input"
                  className={`wz-drop${isDragging ? " is-drag" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFiles(e.dataTransfer.files);
                  }}
                >
                  <div className="wz-drop__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />
                    </svg>
                  </div>
                  <strong>Clique ou arraste suas fotos aqui</strong>
                  <small>JPG, PNG ou WEBP</small>
                </label>

                <div className="wz-counter-row">
                  <span>{photos.length} de {MAX_PHOTOS} fotos</span>
                  <div className="wz-counter-bar">
                    <div className="wz-counter-bar__fill" style={{ width: `${(photos.length / MAX_PHOTOS) * 100}%` }} />
                  </div>
                </div>

                {photos.length > 0 && (
                  <ul className="wz-thumbs">
                    {photos.map((p) => (
                      <li key={p.id} className="wz-thumb">
                        <img src={p.url} alt={p.name} />
                        <button
                          type="button"
                          className="wz-thumb__remove"
                          onClick={() => removePhoto(p.id)}
                          aria-label={`Remover ${p.name}`}
                        >×</button>
                      </li>
                    ))}
                  </ul>
                )}
              </Question>
            )}

            {step === 4 && (
              <Question title="Escolha uma trilha sonora." hint="Pesquise a música que mais representa vocês.">
                <div className="wz-search">
                  <svg className="wz-search__icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                  <input
                    autoFocus
                    className="wz-input wz-input--search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Pesquise por música ou artista"
                  />
                </div>

                {selectedTrack && (
                  <div className="wz-selected">
                    <img src={selectedTrack.cover} alt="" />
                    <div className="wz-selected__info">
                      <span className="wz-selected__kicker">Música selecionada</span>
                      <strong>{selectedTrack.title}</strong>
                      <span>{selectedTrack.artist}</span>
                    </div>
                    <button type="button" className="wz-selected__clear" onClick={() => setSelectedTrack(null)} aria-label="Remover seleção">×</button>
                  </div>
                )}

                <ul className="wz-tracks">
                  {filteredTracks.map((t) => {
                    const isSelected = selectedTrack?.id === t.id;
                    const isPlaying = playingId === t.id;
                    return (
                      <li
                        key={t.id}
                        className={`wz-track${isSelected ? " is-selected" : ""}`}
                        onClick={() => setSelectedTrack(t)}
                      >
                        <img src={t.cover} alt="" className="wz-track__cover" />
                        <div className="wz-track__info">
                          <strong>{t.title}</strong>
                          <span>{t.artist}</span>
                        </div>
                        <button
                          type="button"
                          className="wz-track__play"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlayingId(isPlaying ? null : t.id);
                          }}
                          aria-label={isPlaying ? "Pausar prévia" : "Tocar prévia"}
                        >
                          {isPlaying ? "❚❚" : "▶"}
                        </button>
                      </li>
                    );
                  })}
                  {filteredTracks.length === 0 && (
                    <li className="wz-tracks__empty">Nenhuma música encontrada.</li>
                  )}
                </ul>
              </Question>
            )}

            {step === 5 && (
              <Question title="Escreva sua mensagem." hint="Escreva com o coração.">
                <div className="wz-letter">
                  <textarea
                    autoFocus
                    className="wz-letter__paper"
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, MAX_MSG))}
                    placeholder={"Pai,\n\nescreva aqui as palavras que vêm do coração..."}
                    rows={10}
                    maxLength={MAX_MSG}
                  />
                  <div className="wz-letter__counter">
                    {message.length} / {MAX_MSG} caracteres
                  </div>
                </div>
              </Question>
            )}

            {step === 6 && (
              <Question title="Confira antes de criar sua homenagem." hint="Você ainda pode editar qualquer informação.">
                <ul className="wz-review">
                  <ReviewRow label="Nome do pai" value={fatherName} onEdit={() => { setDirection(-1); setStep(1); }} />
                  <ReviewRow label="Seu nome" value={fromName} onEdit={() => { setDirection(-1); setStep(2); }} />
                  <ReviewRow label="Fotos" value={`${photos.length} foto${photos.length !== 1 ? "s" : ""}`} onEdit={() => { setDirection(-1); setStep(3); }} />
                  <ReviewRow label="Música" value={selectedTrack ? `${selectedTrack.title} — ${selectedTrack.artist}` : "—"} onEdit={() => { setDirection(-1); setStep(4); }} />
                  <ReviewRow label="Mensagem" value={message ? (message.length > 60 ? message.slice(0, 60) + "…" : message) : "—"} onEdit={() => { setDirection(-1); setStep(5); }} />
                </ul>
              </Question>
            )}

            {error && <div className="wz-error" role="alert">{error}</div>}

            <div className="wz-actions">
              {step > 1 ? (
                <button type="button" className="wz-btn wz-btn--ghost" onClick={back}>
                  ← Voltar
                </button>
              ) : <span />}
              <button type="button" className="wz-btn wz-btn--primary" onClick={next}>
                {step === TOTAL_STEPS ? "✨ Gerar minha homenagem" : "Continuar →"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Question({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="wz-q">
      <h2 className="wz-q__title">{title}</h2>
      {hint && <p className="wz-q__hint">{hint}</p>}
      <div className="wz-q__field">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <li className="wz-review__row">
      <span className="wz-review__label">{label}</span>
      <span className="wz-review__value">{value || "—"}</span>
      <button type="button" className="wz-review__edit" onClick={onEdit}>Editar</button>
    </li>
  );
}
