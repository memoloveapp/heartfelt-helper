import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, supabaseUrl } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";


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

type Photo = {
  id: string;
  url: string;
  name: string;
  file: File;
  optimized?: OptimizedImage;
  optimizing?: boolean;
  optimizeError?: boolean;
};

type OptimizedImage = { blob: Blob; ext: string; type: string };

async function optimizeImage(file: File): Promise<OptimizedImage> {
  const MAX = 900;
  const QUALITY = 0.65;
  const originalSize = file.size;
  const originalType = file.type || "unknown";

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error ?? new Error("FileReader falhou"));
      r.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("image decode failed"));
      i.src = dataUrl;
    });

    let { width, height } = { width: img.naturalWidth, height: img.naturalHeight };
    if (!width || !height) throw new Error("dimensões inválidas");
    if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
    if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX; }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas ctx");
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY),
    );
    if (!blob || blob.size === 0) throw new Error("toBlob(webp) retornou vazio");

    console.log("[optimizeImage] OK", {
      name: file.name,
      originalType,
      originalSize,
      finalType: "image/webp",
      finalSize: blob.size,
      dimensions: `${width}x${height}`,
      fallback: false,
    });

    return { blob, ext: "webp", type: "image/webp" };
  } catch (err) {
    console.warn("[optimizeImage] FAIL", {
      name: file.name,
      originalType,
      originalSize,
      fallback: true,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}


type Track = { id: string; title: string; artist: string; cover: string; preview: string };

type BackendErrorShape = {
  message?: unknown;
  details?: unknown;
  hint?: unknown;
  code?: unknown;
  status?: unknown;
  statusCode?: unknown;
  name?: unknown;
};

function stringifyUnknown(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  if (value == null) return "Erro desconhecido.";

  if (typeof value === "object") {
    const error = value as BackendErrorShape;
    const parts = [
      typeof error.name === "string" ? error.name : null,
      typeof error.code === "string" ? `code=${error.code}` : null,
      typeof error.status === "number" || typeof error.status === "string" ? `status=${error.status}` : null,
      typeof error.statusCode === "number" || typeof error.statusCode === "string"
        ? `statusCode=${error.statusCode}`
        : null,
      typeof error.message === "string" ? error.message : null,
      typeof error.details === "string" ? `details=${error.details}` : null,
      typeof error.hint === "string" ? `hint=${error.hint}` : null,
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(" | ");

    try {
      return JSON.stringify(value);
    } catch {
      return "Erro não serializável.";
    }
  }

  return String(value);
}



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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);

  const progress = (step / TOTAL_STEPS) * 100;

  // Deezer live search (debounced)
  useEffect(() => {
    const term = query.trim();
    if (!term) { setTracks([]); return; }
    setSearching(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/public/deezer-search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const j = (await r.json()) as { data?: Track[] };
        // apenas músicas com preview
        setTracks((j.data ?? []).filter((x) => !!x.preview));
      } catch (err) {
        if ((err as { name?: string })?.name !== "AbortError") console.warn("[deezer] falha", err);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [query]);

  const filteredTracks = tracks;

  // Cleanup ao desmontar: pausa e reseta qualquer prévia tocando (global)
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.url));
      stopAllAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopPreview() {
    stopAllAudio();
    setPlayingId(null);
  }

  function togglePreview(t: Track) {
    if (playingId === t.id) {
      stopPreview();
      return;
    }
    // Garante que só exista uma música tocando por vez
    stopAllAudio();
    setPlayingId(null);
    if (!t.preview) return;
    const a = audioRef.current;
    if (!a) return;
    a.src = t.preview;
    a.onended = () => stopPreview();
    a.play().catch(() => setPlayingId(null));
    setPlayingId(t.id);
  }

  function validateStep(s: number): string | null {
    if (s === 1 && !fatherName.trim()) return "Conte para a gente o nome do seu pai.";
    if (s === 2 && !fromName.trim()) return "Inclua o nome de quem está presenteando.";
    if (s === 3 && photos.length < 1) return "Envie pelo menos uma foto especial.";
    if (s === 4 && !selectedTrack) return "Escolha uma música para a homenagem.";
    if (s === 5 && !message.trim()) return "Escreva uma mensagem para o seu pai.";
    return null;
  }

  async function submitMemory() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    console.log("SUPABASE_URL_ATIVA =", supabaseUrl);

    console.log("[Supabase externo] diagnóstico", {
      supabaseUrl,
      photoCount: photos.length,
    });

    // slug curto a partir do UUID
    const slug = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`)
      .replace(/-/g, "")
      .slice(0, 10)
      .toLowerCase();

    try {
      console.log("[Supabase externo] criando memory", { slug });
      const { data: memory, error: memErr } = await supabase
        .from("memories")
        .insert({
          slug,
          occasion: "father_day",
          father_name: fatherName.trim(),
          sender_name: fromName.trim(),
          message: message.trim(),
          music_id: selectedTrack?.id ?? null,
          music_title: selectedTrack?.title ?? null,
          music_artist: selectedTrack?.artist ?? null,
          music_cover: selectedTrack?.cover ?? null,
          music_preview_url: selectedTrack?.preview ?? null,
          payment_status: "pending",
          is_unlocked: false,
        })
        .select("id, slug")
        .single();

      if (memErr) throw memErr;
      if (!memory) throw new Error("INSERT em memories não retornou id/slug.");

      console.log("[Supabase externo] memory criada", { memoryId: memory.id, slug: memory.slug });

      const photoRows: { memory_id: string; photo_url: string; position: number }[] = [];

      const FRIENDLY_OPT_ERR = "Não conseguimos otimizar uma das fotos. Tente escolher outra imagem ou tirar um print dela antes de enviar.";

      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        let optimized: OptimizedImage;
        try {
          optimized = p.optimized ?? (await optimizeImage(p.file));
        } catch (err) {
          console.warn("[criar] otimização falhou — abortando upload da foto", { index: i + 1, name: p.file.name, err });
          throw new Error(FRIENDLY_OPT_ERR);
        }

        if (!optimized || !optimized.blob || optimized.type !== "image/webp" || optimized.ext !== "webp") {
          console.warn("[criar] arquivo não é webp otimizado — bloqueando upload", { index: i + 1, optimized });
          throw new Error(FRIENDLY_OPT_ERR);
        }

        const path = `${memory.id}/foto-${i + 1}.webp`;
        console.log("[Supabase externo] upload foto", { path, index: i + 1, sizeKB: Math.round(optimized.blob.size / 1024) });

        const { error: upErr } = await supabase.storage
          .from("memory-photos")
          .upload(path, optimized.blob, {
            cacheControl: "3600",
            upsert: true,
            contentType: "image/webp",
          });
        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from("memory-photos").getPublicUrl(path);
        console.log("[Supabase externo] foto salva", { path, url: pub.publicUrl });
        photoRows.push({ memory_id: memory.id, photo_url: pub.publicUrl, position: i + 1 });
      }


      if (photoRows.length > 0) {
        const { error: phErr } = await supabase.from("memory_photos").insert(photoRows);
        if (phErr) throw phErr;
      }

      console.log("[Supabase externo] navegando", { slug: memory.slug });
      navigate({ to: "/preparando", search: { slug: memory.slug } }).catch(() => {
        window.location.href = `/preparando?slug=${memory.slug}`;
      });
    } catch (e) {
      const technicalDetails = stringifyUnknown(e);
      console.error("[criar] erro ao salvar homenagem", e);
      console.error("[criar] detalhe técnico", technicalDetails);
      setError(
        `Não conseguimos salvar sua homenagem agora. Detalhe técnico: ${technicalDetails}`,
      );
      setSubmitting(false);
    }
  }

  function next() {
    if (submitting) return;
    // Ao avançar de etapa, nenhuma prévia deve continuar tocando
    stopPreview();
    const err = validateStep(step);
    if (err) return setError(err);
    setError(null);

    if (step === TOTAL_STEPS) {
      void submitMemory();
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
          optimizing: true,
        });
      });

      setPhotos((p) => [...p, ...incoming]);
      if (fileRef.current) fileRef.current.value = "";

      // Optimize in background, one at a time to avoid jank
      (async () => {
        for (const item of incoming) {
          try {
            const optimized = await optimizeImage(item.file);
            setPhotos((prev) =>
              prev.map((x) => (x.id === item.id ? { ...x, optimized, optimizing: false } : x)),
            );
          } catch (err) {
            console.warn("[criar] otimização falhou", err);
            setPhotos((prev) =>
              prev.map((x) =>
                x.id === item.id ? { ...x, optimizing: false, optimizeError: true } : x,
              ),
            );
          }
        }
      })();
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
                        onClick={() => { stopPreview(); setSelectedTrack(t); }}
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
                            togglePreview(t);
                          }}
                          aria-label={isPlaying ? "Pausar prévia" : "Tocar prévia"}
                        >
                          {isPlaying ? "❚❚" : "▶"}
                        </button>
                      </li>
                    );
                  })}
                  {filteredTracks.length === 0 && (
                    <li className="wz-tracks__empty">
                      {searching ? "Buscando…" : query.trim() ? "Nenhuma música com prévia disponível." : "Digite o nome da música ou do artista."}
                    </li>
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
                <button type="button" className="wz-btn wz-btn--ghost" onClick={back} disabled={submitting}>
                  ← Voltar
                </button>
              ) : <span />}
              <button type="button" className="wz-btn wz-btn--primary" onClick={next} disabled={submitting}>
                {submitting
                  ? "Salvando…"
                  : step === TOTAL_STEPS
                    ? "✨ Gerar minha homenagem"
                    : "Continuar →"}
              </button>
            </div>

            {/* Elemento de áudio controlado pelo React — nunca criado solto via new Audio() */}
            <audio ref={audioRef} preload="none" style={{ display: "none" }} />

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
