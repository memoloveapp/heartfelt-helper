import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";

/* ============================================================
   /homenagem/$slug — MemoLove Premium (Cinematic Noir)
   Fundo #0B0B0F, detalhes dourados #D4A257, marfim #F4EBDD.
   Playfair Display (display) + Inter (corpo).
   ============================================================ */

const NIGHT = "#0B0B0F";
const NIGHT_2 = "#161218";
const GOLD = "#D4A257";
const GOLD_SOFT = "#E9C88C";
const IVORY = "#F4EBDD";

const DISPLAY = { fontFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif' } as const;
const BODY = { fontFamily: '"Inter", system-ui, sans-serif' } as const;

type Memory = {
  id: string;
  slug: string;
  father_name: string;
  sender_name: string;
  message: string;
  occasion: string | null;
  music_title: string | null;
  music_artist: string | null;
  music_cover: string | null;
  music_preview_url: string | null;
};

export const Route = createFileRoute("/homenagem/$slug")({
  head: () => ({
    meta: [
      { title: "Uma memória eterna — MemoLove" },
      { name: "description", content: "Uma homenagem cinematográfica criada com MemoLove." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,500;1,700&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  component: HomenagemPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: NIGHT, color: IVORY }}>
      <div>
        <h1 className="text-2xl mb-2" style={DISPLAY}>Ops…</h1>
        <p className="text-sm opacity-70">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: NIGHT, color: IVORY }}>
      <p style={DISPLAY}>Memória não encontrada.</p>
    </div>
  ),
  ssr: false,
});

/* ---------------- Observador de entrada ---------------- */
function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }),
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, seen };
}

/* ---------------- Data fetch ---------------- */
function useMemoryData(slug: string) {
  const [memory, setMemory] = useState<Memory | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cleanSlug = decodeURIComponent(slug ?? "").trim();
      const { data: list, error } = await supabase
        .from("memories")
        .select("id, slug, father_name, sender_name, message, occasion, music_title, music_artist, music_cover, music_preview_url")
        .eq("slug", cleanSlug).limit(1);
      const mem = list && list.length ? list[0] : null;
      if (cancelled) return;
      if (error || !mem) { setErr("Não encontramos sua memória."); setReady(true); return; }
      setMemory(mem as Memory);
      setReady(true);

      const { data: rows } = await supabase
        .from("memory_photos").select("photo_url, position")
        .eq("memory_id", mem.id).order("position", { ascending: true });
      if (cancelled) return;

      const BUCKET = "memory-photos";
      const toPath = (raw: string): string | null => {
        if (!raw) return null;
        const pub = `/object/public/${BUCKET}/`;
        const sign = `/object/sign/${BUCKET}/`;
        if (raw.includes(pub)) return raw.split(pub)[1].split("?")[0];
        if (raw.includes(sign)) return raw.split(sign)[1].split("?")[0];
        return raw.replace(/^\/+/, "").replace(new RegExp(`^${BUCKET}/`), "");
      };
      const items = (rows ?? []).filter((r) => r.photo_url);
      if (items.length === 0) return;
      setPhotos(new Array(items.length).fill(""));
      const signOne = async (raw: string): Promise<string> => {
        try {
          if (raw.startsWith("http") && !raw.includes("/object/")) return raw;
          const path = toPath(raw);
          if (!path) return "";
          const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
          return data?.signedUrl ?? "";
        } catch { return ""; }
      };
      items.forEach((item, index) => {
        signOne(item.photo_url).then((u) => {
          if (cancelled || !u) return;
          setPhotos((prev) => { const next = [...prev]; next[index] = u; return next; });
        });
      });
    })();
    return () => { cancelled = true; };
  }, [slug]);

  return { memory, photos, ready, err };
}

/* =========================================================
   HERO — foto full-bleed, Ken Burns, nome dourado em serif itálica
   ========================================================= */
function ChapterHero({ name, photo, occasion }: { name: string; photo: string; occasion: string | null }) {
  const subtitle = occasion?.trim() || "Uma vida de luz e amor";
  return (
    <section className="ml-hero" data-chapter>
      {photo && <img src={photo} alt="" aria-hidden loading="eager" className="ml-hero-img" />}
      <div className="ml-hero-veil" />
      <div className="ml-hero-grain" aria-hidden />
      <div className="ml-hero-content">
        <p className="ml-hero-eyebrow" style={BODY}>Em memória eterna de</p>
        <h1 className="ml-hero-name" style={DISPLAY}>{name}</h1>
        <p className="ml-hero-sub" style={BODY}>{subtitle}</p>
        <div className="ml-hero-rule" />
      </div>
      <div className="ml-hero-arrow" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </section>
  );
}

/* =========================================================
   CARTA — mensagem editorial em serif itálica, aspa dourada gigante
   ========================================================= */
function ChapterLetter({ message, sender }: { message: string; sender: string }) {
  const { ref, seen } = useInView<HTMLElement>(0.15);
  const paragraphs = (message ?? "").trim().split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);
  const lines = paragraphs.length ? paragraphs : ["Uma mensagem especial em breve."];
  return (
    <section ref={ref} className={`ml-letter ${seen ? "is-in" : ""}`} data-chapter>
      <div className="ml-letter-inner">
        <span className="ml-letter-quote" aria-hidden>“</span>
        <div className="ml-letter-body">
          {lines.map((p, i) => (
            <p
              key={i}
              className="ml-letter-line"
              style={{ ...DISPLAY, animationDelay: `${300 + i * 500}ms` }}
            >
              {p}
            </p>
          ))}
        </div>
        {sender && (
          <div className="ml-letter-sign" style={{ animationDelay: `${300 + lines.length * 500 + 300}ms` }}>
            <span className="ml-letter-sign-rule" />
            <p style={DISPLAY}>Com eterno amor,</p>
            <p className="ml-letter-sign-name" style={DISPLAY}>{sender}</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   MÚSICA — capa quadrada em grayscale respirando, halo dourado
   ========================================================= */
function ChapterMusic({ title, artist, cover, src }: { title: string; artist: string; cover: string; src: string }) {
  const { ref, seen } = useInView<HTMLElement>(0.2);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onTime = () => { setCurrent(a.currentTime); setDuration(a.duration || 0); };
    const onEnd = () => { setPlaying(false); setCurrent(0); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onTime);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onTime);
      a.removeEventListener("ended", onEnd);
      a.pause(); a.currentTime = 0;
    };
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current; if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { stopAllAudio(); a.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  }, [playing]);

  const fmt = (t: number) => {
    if (!isFinite(t) || t <= 0) return "0:00";
    return `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, "0")}`;
  };
  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <section ref={ref} className={`ml-music ${seen ? "is-in" : ""} ${playing ? "is-playing" : ""}`} data-chapter>
      <div className="ml-music-inner">
        <button
          type="button"
          onClick={toggle}
          className="ml-music-cover-wrap"
          aria-label={playing ? "Pausar" : "Tocar"}
        >
          <span className="ml-music-halo" aria-hidden />
          <span className="ml-music-frame">
            {cover ? (
              <img src={cover} alt="" className="ml-music-cover" />
            ) : (
              <span className="ml-music-fallback">♪</span>
            )}
            <span className="ml-music-hover">
              <span className="ml-music-play-badge">
                {playing ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><path d="M8 5v14l11-7z" /></svg>
                )}
              </span>
            </span>
          </span>
        </button>

        <p className="ml-music-eyebrow" style={BODY}>A canção que fica</p>
        <h3 className="ml-music-title" style={DISPLAY}>{title}</h3>
        {artist && <p className="ml-music-artist" style={BODY}>{artist}</p>}

        <div className="ml-music-controls">
          <div className="ml-music-track"><div className="ml-music-fill" style={{ width: `${pct}%` }} /></div>
          <div className="ml-music-time" style={BODY}>{fmt(current)} · {fmt(duration)}</div>
        </div>
      </div>
      <audio ref={audioRef} src={src} preload="metadata" />
    </section>
  );
}

/* =========================================================
   GALERIA MOMENTOS — bloco editorial assimétrico
   Foto grande à esquerda + duas fotos empilhadas à direita (offset)
   Ken Burns em cada foto + numerais serif dourados
   ========================================================= */
function GalleryBlock({
  photos,
  startIndex,
  onOpen,
}: {
  photos: { url: string; abs: number }[];
  startIndex: number;
  onOpen: (i: number) => void;
}) {
  const { ref, seen } = useInView<HTMLElement>(0.15);
  const big = photos[0];
  const a = photos[1];
  const b = photos[2];

  return (
    <section ref={ref} className={`ml-gallery ${seen ? "is-in" : ""}`} data-chapter>
      <div className="ml-gallery-grid">
        {big && (
          <button
            className="ml-tile ml-tile-big"
            style={{ transitionDelay: "0ms" }}
            onClick={() => onOpen(big.abs)}
          >
            <span className="ml-tile-num" style={DISPLAY}>{String(startIndex + 1).padStart(2, "0")}</span>
            <span className="ml-tile-inner">
              <img src={big.url} alt="" loading="lazy" decoding="async" />
            </span>
            <span className="ml-tile-hover" />
          </button>
        )}
        <div className="ml-gallery-side">
          {a && (
            <button
              className="ml-tile ml-tile-a"
              style={{ transitionDelay: "180ms" }}
              onClick={() => onOpen(a.abs)}
            >
              <span className="ml-tile-num sm" style={DISPLAY}>{String(startIndex + 2).padStart(2, "0")}</span>
              <span className="ml-tile-inner">
                <img src={a.url} alt="" loading="lazy" decoding="async" />
              </span>
              <span className="ml-tile-hover" />
            </button>
          )}
          {b && (
            <button
              className="ml-tile ml-tile-b"
              style={{ transitionDelay: "320ms" }}
              onClick={() => onOpen(b.abs)}
            >
              <span className="ml-tile-num sm" style={DISPLAY}>{String(startIndex + 3).padStart(2, "0")}</span>
              <span className="ml-tile-inner">
                <img src={b.url} alt="" loading="lazy" decoding="async" />
              </span>
              <span className="ml-tile-hover" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function ChapterMomentsIntro() {
  const { ref, seen } = useInView<HTMLElement>(0.35);
  return (
    <section ref={ref} className={`ml-intro ${seen ? "is-in" : ""}`} data-chapter>
      <div className="ml-intro-inner">
        <p className="ml-intro-kicker" style={BODY}>Capítulo III</p>
        <h2 className="ml-intro-title" style={DISPLAY}>
          Momentos <em>eternos</em>
        </h2>
        <p className="ml-intro-sub" style={BODY}>
          Instantes onde o tempo parou para admirar a beleza do ser.
        </p>
        <span className="ml-intro-rule" />
      </div>
    </section>
  );
}

/* =========================================================
   ENCERRAMENTO — frase editorial + selo MemoLove
   ========================================================= */
function ChapterEnd() {
  const { ref, seen } = useInView<HTMLElement>(0.35);
  return (
    <section ref={ref} className={`ml-end ${seen ? "is-in" : ""}`} data-chapter>
      <div className="ml-end-inner">
        <p className="ml-end-kicker" style={BODY}>Presença eterna</p>
        <h2 className="ml-end-quote" style={DISPLAY}>
          Nossa saudade virou <em>amor</em> que nos guia.
        </h2>
        <div className="ml-end-seal" aria-hidden>
          <span className="ml-end-seal-ping" />
          <span className="ml-end-seal-inner">
            <span className="ml-end-seal-mark" style={DISPLAY}>MemoLove</span>
            <span className="ml-end-seal-dot" />
          </span>
        </div>
        <p className="ml-end-foot" style={BODY}>Memorial digital · MemoLove</p>
      </div>
    </section>
  );
}

/* =========================================================
   REEL — indicador vertical dourado
   ========================================================= */
function ReelIndicator({ count }: { count: number }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
    if (!nodes.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const idx = nodes.indexOf(e.target as HTMLElement);
          if (idx >= 0) setActive(idx);
        }
      });
    }, { threshold: 0.55 });
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [count]);

  return (
    <aside className="ml-reel" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={`ml-reel-dot ${i === active ? "is-on" : ""}`} />
      ))}
    </aside>
  );
}

/* =========================================================
   LIGHTBOX
   ========================================================= */
function Lightbox({ photos, index, onClose, onPrev, onNext }: {
  photos: string[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  let startX = 0;
  return (
    <div className="ml-lb" role="dialog" aria-modal="true" onClick={onClose}
      onTouchStart={(e) => { startX = e.touches[0].clientX; }}
      onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - startX; if (Math.abs(dx) < 50) return; dx < 0 ? onNext() : onPrev(); }}>
      <img key={index} src={photos[index]} alt="" className="ml-lb-img" />
      <button className="ml-lb-btn ml-lb-close" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Fechar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      {index > 0 && (
        <button className="ml-lb-btn ml-lb-prev" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="Anterior">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
      )}
      {index < photos.length - 1 && (
        <button className="ml-lb-btn ml-lb-next" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="Próxima">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      )}
    </div>
  );
}

/* =========================================================
   PÁGINA
   ========================================================= */
function HomenagemPage() {
  const { slug } = Route.useParams();
  const { memory, photos, ready, err } = useMemoryData(slug);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => { stopAllAudio(); return () => stopAllAudio(); }, []);

  const hero = photos[0] ?? "";
  const gallery = photos.slice(1).filter(Boolean);
  const hasMusic = !!memory?.music_preview_url;

  // group gallery into blocks of 3
  const blocks: { url: string; abs: number }[][] = [];
  for (let i = 0; i < gallery.length; i += 3) {
    blocks.push(gallery.slice(i, i + 3).map((url, j) => ({ url, abs: i + j })));
  }

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") setLightbox((v) => (v !== null ? Math.max(0, v - 1) : v));
      if (e.key === "ArrowRight") setLightbox((v) => (v !== null && v < gallery.length - 1 ? v + 1 : v));
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [lightbox, gallery.length]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: NIGHT }}>
        <div style={{ ...BODY, color: GOLD, fontSize: 10, letterSpacing: ".5em" }} className="uppercase animate-pulse">Preparando a memória</div>
      </div>
    );
  }

  if (err || !memory) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: NIGHT, color: IVORY }}>
        <div className="text-center p-8"><h1 style={DISPLAY} className="text-2xl mb-2">Memória não encontrada</h1><p className="text-sm opacity-70">{err}</p></div>
      </div>
    );
  }

  const chapterCount = 1 + 1 + (hasMusic ? 1 : 0) + (blocks.length ? 1 + blocks.length : 0) + 1;

  return (
    <div className="ml-root">
      <style>{`
        html, body { background: ${NIGHT}; }
        .ml-root {
          background: ${NIGHT};
          color: ${IVORY};
          position: relative;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }
        .ml-root ::selection { background: ${GOLD}; color: ${NIGHT}; }

        /* ============ Keyframes ============ */
        @keyframes ml-rise {
          0%   { opacity: 0; transform: translateY(24px); filter: blur(12px); }
          100% { opacity: 1; transform: none; filter: none; }
        }
        @keyframes ml-fade {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes ml-kb {
          0%   { transform: scale(1) translate(0,0); }
          50%  { transform: scale(1.12) translate(-1.2%, 1%); }
          100% { transform: scale(1) translate(0,0); }
        }
        @keyframes ml-arrow {
          0%,100% { transform: translate(-50%, 0); opacity: .55; }
          50%     { transform: translate(-50%, 8px); opacity: 1; }
        }
        @keyframes ml-breathe {
          0%,100% { transform: scale(1); filter: brightness(1); }
          50%     { transform: scale(1.03); filter: brightness(1.08); }
        }
        @keyframes ml-halo {
          0%,100% { transform: scale(.85); opacity: .5; }
          50%     { transform: scale(1.05); opacity: 1; }
        }
        @keyframes ml-ping {
          0%   { transform: scale(.6); opacity: .6; }
          80%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes ml-shine {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }

        /* ============ HERO ============ */
        .ml-hero {
          position: relative;
          height: 100vh; height: 100svh;
          width: 100%;
          overflow: hidden;
          background: #000;
        }
        .ml-hero-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          opacity: 0;
          animation: ml-fade 1.4s ease-out .1s forwards, ml-kb 22s ease-in-out 1.4s infinite;
        }
        .ml-hero-veil {
          position: absolute; inset: 0;
          background:
            linear-gradient(180deg, rgba(11,11,15,.35) 0%, rgba(11,11,15,0) 20%, rgba(11,11,15,.55) 65%, ${NIGHT} 100%);
          pointer-events: none;
        }
        .ml-hero-grain {
          position: absolute; inset: 0; pointer-events: none;
          opacity: .12; mix-blend-mode: overlay;
          background-image:
            radial-gradient(rgba(255,255,255,.6) 1px, transparent 1px),
            radial-gradient(rgba(0,0,0,.5) 1px, transparent 1px);
          background-size: 3px 3px, 4px 4px;
          background-position: 0 0, 1px 2px;
        }
        .ml-hero-content {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center;
          padding: 24px;
          z-index: 3;
        }
        .ml-hero-eyebrow {
          font-size: clamp(10px, 1.1vw, 12px);
          letter-spacing: .5em;
          text-transform: uppercase;
          color: ${GOLD};
          opacity: 0; animation: ml-rise 1.2s ease-out .5s forwards;
          margin: 0 0 28px;
        }
        .ml-hero-name {
          margin: 0;
          font-weight: 400; font-style: italic;
          font-size: clamp(64px, 12vw, 168px);
          line-height: .96;
          letter-spacing: -.012em;
          color: ${GOLD};
          text-shadow: 0 6px 60px rgba(0,0,0,.6);
          opacity: 0; animation: ml-rise 1.3s ease-out .8s forwards;
        }
        .ml-hero-sub {
          margin: 24px 0 0;
          font-size: clamp(11px, 1.2vw, 13px);
          letter-spacing: .35em;
          text-transform: uppercase;
          color: rgba(244,235,221,.7);
          opacity: 0; animation: ml-rise 1.2s ease-out 1.1s forwards;
        }
        .ml-hero-rule {
          width: 1px; height: 80px;
          background: linear-gradient(180deg, ${GOLD}, transparent);
          margin: 40px auto 0;
          opacity: 0; animation: ml-rise 1.2s ease-out 1.4s forwards;
        }
        .ml-hero-arrow {
          position: absolute; left: 50%; bottom: 32px;
          transform: translateX(-50%);
          color: ${IVORY};
          animation: ml-arrow 2.6s ease-in-out infinite;
          z-index: 4;
        }

        /* ============ CARTA ============ */
        .ml-letter {
          position: relative;
          padding: clamp(96px, 16vh, 180px) 24px;
          max-width: 900px;
          margin: 0 auto;
        }
        .ml-letter-inner { position: relative; }
        .ml-letter-quote {
          position: absolute;
          top: -60px; left: -30px;
          font-family: 'Playfair Display', serif;
          font-size: clamp(180px, 22vw, 320px);
          line-height: 1;
          color: ${GOLD};
          opacity: .07;
          font-style: italic;
          font-weight: 900;
          pointer-events: none;
          user-select: none;
        }
        .ml-letter-body { position: relative; z-index: 1; }
        .ml-letter-line {
          margin: 0 0 clamp(28px, 3vh, 44px);
          font-size: clamp(22px, 2.8vw, 34px);
          line-height: 1.55;
          font-style: italic;
          color: rgba(244,235,221,.94);
          opacity: 0;
          animation: ml-rise 1.6s ease-out forwards;
        }
        .ml-letter-line:first-child {
          font-size: clamp(26px, 3.4vw, 40px);
        }
        .ml-letter-sign {
          margin-top: clamp(60px, 8vh, 100px);
          display: flex; flex-direction: column; align-items: flex-end; text-align: right;
          gap: 6px;
          opacity: 0;
          animation: ml-rise 1.2s ease-out forwards;
        }
        .ml-letter-sign-rule {
          width: 120px; height: 1px;
          background: ${GOLD};
          margin-bottom: 18px;
        }
        .ml-letter-sign p {
          margin: 0;
          font-size: clamp(18px, 2vw, 24px);
          font-style: italic;
          color: rgba(244,235,221,.75);
        }
        .ml-letter-sign-name {
          color: ${GOLD} !important;
          font-size: clamp(22px, 2.6vw, 30px) !important;
        }
        @media (max-width: 640px) {
          .ml-letter { padding: 80px 22px; }
          .ml-letter-quote { top: -30px; left: -10px; }
        }

        /* ============ MÚSICA ============ */
        .ml-music {
          position: relative;
          padding: clamp(100px, 16vh, 180px) 24px;
          background: linear-gradient(180deg, ${NIGHT} 0%, ${NIGHT_2} 50%, ${NIGHT} 100%);
          border-top: 1px solid rgba(212,162,87,.08);
          border-bottom: 1px solid rgba(212,162,87,.08);
          display: flex; align-items: center; justify-content: center;
        }
        .ml-music-inner {
          max-width: 460px; width: 100%;
          display: flex; flex-direction: column; align-items: center; text-align: center;
        }
        .ml-music-cover-wrap {
          position: relative;
          width: clamp(220px, 30vw, 320px);
          height: clamp(220px, 30vw, 320px);
          padding: 0; border: 0; background: transparent;
          cursor: pointer;
          opacity: 0; transform: translateY(20px);
          transition: opacity 1s ease-out, transform 1s ease-out;
        }
        .ml-music.is-in .ml-music-cover-wrap { opacity: 1; transform: none; }
        .ml-music-halo {
          position: absolute; inset: -18%;
          background: radial-gradient(circle, rgba(212,162,87,.28) 0%, rgba(212,162,87,0) 65%);
          filter: blur(30px);
          border-radius: 999px;
          animation: ml-halo 6s ease-in-out infinite;
        }
        .ml-music-frame {
          position: relative; display: block;
          width: 100%; height: 100%;
          overflow: hidden;
          border-radius: 2px;
          box-shadow: 0 30px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(212,162,87,.25);
          animation: ml-breathe 6s ease-in-out infinite;
        }
        .ml-music-cover {
          width: 100%; height: 100%; object-fit: cover;
          filter: grayscale(80%) brightness(.9);
          transition: filter .8s ease;
        }
        .ml-music-cover-wrap:hover .ml-music-cover,
        .ml-music.is-playing .ml-music-cover {
          filter: grayscale(0%) brightness(1);
        }
        .ml-music-fallback {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: ${NIGHT_2};
          color: ${GOLD};
          font-size: 80px;
        }
        .ml-music-hover {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity .5s ease;
          background: linear-gradient(180deg, rgba(11,11,15,.3), rgba(11,11,15,.55));
        }
        .ml-music-cover-wrap:hover .ml-music-hover,
        .ml-music.is-playing .ml-music-hover { opacity: 1; }
        .ml-music-play-badge {
          width: 68px; height: 68px; border-radius: 999px;
          background: ${GOLD}; color: ${NIGHT};
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 12px 40px rgba(212,162,87,.5);
        }
        .ml-music-eyebrow {
          margin: 40px 0 0;
          font-size: 10px; letter-spacing: .5em; text-transform: uppercase;
          color: ${GOLD};
          opacity: 0; animation: ml-rise 1s .2s ease-out forwards;
        }
        .ml-music-title {
          margin: 14px 0 4px;
          font-size: clamp(28px, 4vw, 44px);
          font-style: italic;
          color: ${IVORY};
          opacity: 0; animation: ml-rise 1s .4s ease-out forwards;
        }
        .ml-music-artist {
          margin: 0;
          font-size: 12px; letter-spacing: .3em; text-transform: uppercase;
          color: rgba(244,235,221,.5);
          opacity: 0; animation: ml-rise 1s .6s ease-out forwards;
        }
        .ml-music-controls {
          margin-top: 32px; width: 100%;
          display: flex; align-items: center; gap: 14px;
          opacity: 0; animation: ml-rise 1s .8s ease-out forwards;
        }
        .ml-music-track {
          flex: 1; height: 1px; background: rgba(244,235,221,.15);
          position: relative; overflow: hidden;
        }
        .ml-music-fill { height: 100%; background: ${GOLD}; transition: width .2s linear; }
        .ml-music-time {
          font-size: 10px; letter-spacing: .2em;
          color: rgba(244,235,221,.5);
          font-variant-numeric: tabular-nums;
        }

        /* ============ MOMENTOS INTRO ============ */
        .ml-intro {
          padding: clamp(120px, 20vh, 200px) 24px 60px;
          max-width: 1100px; margin: 0 auto;
          text-align: center;
        }
        .ml-intro-inner {
          opacity: 0; transform: translateY(24px); filter: blur(10px);
          transition: opacity 1.2s ease-out, transform 1.2s ease-out, filter 1.2s ease-out;
        }
        .ml-intro.is-in .ml-intro-inner { opacity: 1; transform: none; filter: none; }
        .ml-intro-kicker {
          font-size: 10px; letter-spacing: .5em; text-transform: uppercase;
          color: ${GOLD}; margin: 0 0 24px;
        }
        .ml-intro-title {
          margin: 0;
          font-size: clamp(48px, 8vw, 108px);
          line-height: 1; font-weight: 400;
          color: ${IVORY};
          letter-spacing: -.015em;
        }
        .ml-intro-title em {
          color: ${GOLD}; font-style: italic; font-weight: 400;
        }
        .ml-intro-sub {
          margin: 24px auto 0;
          max-width: 480px;
          font-size: 14px;
          font-style: italic;
          color: rgba(244,235,221,.55);
        }
        .ml-intro-rule {
          display: block;
          width: 1px; height: 80px;
          background: linear-gradient(180deg, ${GOLD}, transparent);
          margin: 40px auto 0;
        }

        /* ============ GALLERY BLOCK ============ */
        .ml-gallery {
          padding: clamp(50px, 8vh, 90px) clamp(20px, 5vw, 60px);
          max-width: 1200px; margin: 0 auto;
        }
        .ml-gallery-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: clamp(24px, 4vw, 60px);
          align-items: start;
        }
        .ml-gallery-side {
          display: flex; flex-direction: column;
          gap: clamp(24px, 4vw, 60px);
          margin-top: clamp(40px, 8vh, 120px);
        }
        .ml-tile {
          position: relative;
          padding: 0; border: 0; background: transparent;
          display: block; width: 100%;
          cursor: zoom-in;
          opacity: 0; transform: translateY(40px) scale(.98); filter: blur(12px);
          transition: opacity 1.2s cubic-bezier(.2,.7,.2,1),
                      transform 1.2s cubic-bezier(.2,.7,.2,1),
                      filter 1.2s ease-out;
        }
        .ml-gallery.is-in .ml-tile { opacity: 1; transform: none; filter: none; }
        .ml-tile-inner {
          position: relative; display: block;
          width: 100%; overflow: hidden;
          background: ${NIGHT_2};
          box-shadow: 0 30px 60px -20px rgba(0,0,0,.6);
        }
        .ml-tile-big .ml-tile-inner { aspect-ratio: 4/5; }
        .ml-tile-a .ml-tile-inner, .ml-tile-b .ml-tile-inner { aspect-ratio: 1/1; }
        .ml-tile-b { transform: translateX(0); }
        @media (min-width: 900px) {
          .ml-tile-b { transform: translateX(-40px) translateY(20px); }
          .ml-gallery.is-in .ml-tile-b { transform: translateX(-40px) translateY(0); }
        }
        .ml-tile-inner img {
          width: 100%; height: 100%; object-fit: cover;
          filter: brightness(.82);
          transition: transform 1.8s cubic-bezier(.2,.7,.2,1), filter 1s ease;
        }
        .ml-tile:hover .ml-tile-inner img {
          transform: scale(1.06);
          filter: brightness(1.05);
        }
        .ml-tile-hover {
          position: absolute; inset: 0; pointer-events: none;
          border: 1px solid rgba(212,162,87,0);
          transition: border-color .6s ease, box-shadow .6s ease;
        }
        .ml-tile:hover .ml-tile-hover {
          border-color: rgba(212,162,87,.35);
          box-shadow: inset 0 0 60px rgba(212,162,87,.12);
        }
        .ml-tile-num {
          position: absolute; top: 20px; left: 20px; z-index: 2;
          font-size: clamp(36px, 4vw, 56px);
          font-style: italic;
          color: ${GOLD};
          opacity: .55;
          text-shadow: 0 4px 20px rgba(0,0,0,.5);
          pointer-events: none;
        }
        .ml-tile-num.sm { font-size: clamp(24px, 3vw, 34px); top: 14px; left: 14px; }
        @media (max-width: 720px) {
          .ml-gallery-grid { grid-template-columns: 1fr; gap: 28px; }
          .ml-gallery-side { margin-top: 0; }
          .ml-tile-b { transform: none !important; }
        }

        /* ============ ENCERRAMENTO ============ */
        .ml-end {
          padding: clamp(140px, 22vh, 220px) 24px;
          background: linear-gradient(180deg, ${NIGHT} 0%, ${NIGHT_2} 100%);
          text-align: center;
        }
        .ml-end-inner {
          max-width: 720px; margin: 0 auto;
          opacity: 0; transform: translateY(30px); filter: blur(12px);
          transition: opacity 1.4s ease-out, transform 1.4s ease-out, filter 1.4s ease-out;
        }
        .ml-end.is-in .ml-end-inner { opacity: 1; transform: none; filter: none; }
        .ml-end-kicker {
          font-size: 10px; letter-spacing: .5em; text-transform: uppercase;
          color: ${GOLD}; margin: 0 0 32px;
        }
        .ml-end-quote {
          margin: 0;
          font-size: clamp(30px, 5vw, 56px);
          line-height: 1.25;
          font-weight: 400; font-style: italic;
          color: ${IVORY};
        }
        .ml-end-quote em { color: ${GOLD}; font-style: italic; }
        .ml-end-seal {
          position: relative;
          width: 140px; height: 140px;
          margin: 80px auto 32px;
          display: flex; align-items: center; justify-content: center;
        }
        .ml-end-seal-ping {
          position: absolute; inset: 0;
          border-radius: 999px;
          border: 1px solid ${GOLD};
          animation: ml-ping 3s ease-out infinite;
        }
        .ml-end-seal-inner {
          position: relative;
          width: 100%; height: 100%;
          border-radius: 999px;
          border: 1px solid rgba(212,162,87,.45);
          background: ${NIGHT};
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 6px;
        }
        .ml-end-seal-mark {
          font-size: 14px; font-style: italic;
          color: ${GOLD}; letter-spacing: .08em;
        }
        .ml-end-seal-dot {
          width: 4px; height: 4px; border-radius: 999px;
          background: ${GOLD};
          animation: ml-halo 2.2s ease-in-out infinite;
        }
        .ml-end-foot {
          margin: 40px 0 0;
          font-size: 9px; letter-spacing: .6em; text-transform: uppercase;
          color: rgba(244,235,221,.25);
        }

        /* ============ REEL ============ */
        .ml-reel {
          position: fixed; top: 50%; right: 22px;
          transform: translateY(-50%);
          display: flex; flex-direction: column; gap: 10px;
          z-index: 20;
        }
        .ml-reel-dot {
          display: block; width: 5px; height: 5px; border-radius: 999px;
          background: rgba(244,235,221,.18);
          transition: background .4s ease, transform .4s ease, box-shadow .4s ease;
        }
        .ml-reel-dot.is-on {
          background: ${GOLD};
          transform: scale(1.8);
          box-shadow: 0 0 12px rgba(212,162,87,.6);
        }
        @media (max-width: 720px) { .ml-reel { display: none; } }

        /* ============ LIGHTBOX ============ */
        .ml-lb {
          position: fixed; inset: 0; z-index: 60;
          background: rgba(0,0,0,.95);
          display: flex; align-items: center; justify-content: center;
          animation: ml-fade .35s ease-out;
        }
        .ml-lb-img {
          max-width: 92vw; max-height: 88vh; object-fit: contain;
          box-shadow: 0 40px 120px rgba(0,0,0,.7), 0 0 0 1px rgba(212,162,87,.15);
          animation: ml-fade .5s ease-out;
        }
        .ml-lb-btn {
          position: absolute;
          width: 44px; height: 44px; border-radius: 999px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(244,235,221,.08);
          backdrop-filter: blur(8px);
          color: ${IVORY};
          border: 1px solid rgba(212,162,87,.2);
          transition: background .2s ease, border-color .2s ease;
        }
        .ml-lb-btn:hover {
          background: rgba(212,162,87,.15);
          border-color: rgba(212,162,87,.5);
        }
        .ml-lb-close { top: 22px; right: 22px; }
        .ml-lb-prev  { left: 22px; top: 50%; transform: translateY(-50%); display: none; }
        .ml-lb-next  { right: 22px; top: 50%; transform: translateY(-50%); display: none; }
        @media (min-width: 720px) { .ml-lb-prev, .ml-lb-next { display: flex; } }
      `}</style>

      <ChapterHero name={memory.father_name} photo={hero} occasion={memory.occasion} />
      <ChapterLetter message={memory.message} sender={memory.sender_name} />
      {hasMusic && (
        <ChapterMusic
          title={memory.music_title ?? "Trilha"}
          artist={memory.music_artist ?? ""}
          cover={memory.music_cover ?? ""}
          src={memory.music_preview_url!}
        />
      )}
      {blocks.length > 0 && <ChapterMomentsIntro />}
      {blocks.map((b, i) => (
        <GalleryBlock
          key={i}
          photos={b}
          startIndex={i * 3}
          onOpen={(abs) => setLightbox(abs)}
        />
      ))}
      <ChapterEnd />

      <ReelIndicator count={chapterCount} />

      {lightbox !== null && gallery[lightbox] && (
        <Lightbox
          photos={gallery}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox((v) => (v !== null ? Math.max(0, v - 1) : v))}
          onNext={() => setLightbox((v) => (v !== null && v < gallery.length - 1 ? v + 1 : v))}
        />
      )}
    </div>
  );
}
