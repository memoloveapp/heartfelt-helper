import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";

/* ============================================================
   MemoLove Premium V2 — Cenas
   Uma lembrança em forma de filme.
   Paleta: #08070A · #C8A47E · #F6F0E7
   ============================================================ */

const SANS = { fontFamily: '"Inter", system-ui, -apple-system, sans-serif' } as const;
const SERIF = { fontFamily: '"Playfair Display", Georgia, serif' } as const;

const GOLD = "#C8A47E";
const CREAM = "#F6F0E7";
const INK = "#08070A";

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
      { title: "Uma memória especial — MemoLove" },
      { name: "description", content: "Uma memória eterna criada com MemoLove." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@1,400;1,500&display=swap",
      },
    ],
  }),
  component: HomenagemPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: INK, color: CREAM }}>
      <div>
        <h1 className="text-2xl mb-2" style={SERIF}>Ops…</h1>
        <p className="text-sm opacity-70">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: INK, color: CREAM }}>
      <p style={SERIF}>Memória não encontrada.</p>
    </div>
  ),
  ssr: false,
});

/* ---------------- Reveal on scroll ---------------- */
function useInView<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }),
      { threshold, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, seen };
}

/* =========================================================
   CENA 1 — Abertura
   Foto full-bleed, Ken Burns, nome + frase + seta respirando.
   ========================================================= */
function SceneOpening({ name, photo, onNext }: { name: string; photo: string; onNext: () => void }) {
  return (
    <section className="ml-scene ml-opening" style={{ height: "100svh" }}>
      {photo && (
        <>
          <img src={photo} alt="" aria-hidden loading="eager" decoding="async" className="ml-open-img" />
          <div className="ml-open-veil" />
          <div className="ml-open-vignette" />
          <div className="ml-particles" aria-hidden>
            {Array.from({ length: 16 }).map((_, i) => (
              <i key={i} style={{
                left: `${(i * 71) % 100}%`,
                bottom: `-${(i * 13) % 60}px`,
                animationDelay: `${(i * 0.6) % 9}s`,
                animationDuration: `${10 + (i % 7)}s`,
              }} />
            ))}
          </div>
        </>
      )}

      <div className="ml-open-content">
        <div className="ml-open-eyebrow" style={SANS}>UMA HOMENAGEM</div>
        <h1 className="ml-open-name" style={SERIF}>{name}</h1>
        <p className="ml-open-line" style={SANS}>
          para reviver, sentir e nunca esquecer
        </p>
      </div>

      <button onClick={onNext} aria-label="Começar" className="ml-open-arrow">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14" /><path d="M6 13l6 6 6-6" />
        </svg>
      </button>
    </section>
  );
}

/* =========================================================
   CENA 2 — Carta
   A foto anterior permanece parcialmente visível (sticky).
   A carta "entra" deslizando sobre ela.
   ========================================================= */
function SceneLetter({ photo, message, sender }: { photo: string; message: string; sender: string }) {
  const { ref, seen } = useInView<HTMLDivElement>(0.2);
  const paragraphs = (message ?? "").trim().split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);
  const lines = paragraphs.length ? paragraphs : ["Uma mensagem especial em breve."];

  return (
    <section className="ml-scene ml-letter-wrap">
      {photo && (
        <div className="ml-letter-bg" aria-hidden>
          <img src={photo} alt="" className="ml-letter-bg-img" />
          <div className="ml-letter-bg-veil" />
        </div>
      )}

      <div ref={ref} className={`ml-letter-sheet ${seen ? "is-in" : ""}`}>
        <div className="ml-letter-eyebrow" style={SANS}>CAPÍTULO · UMA CARTA</div>
        <div className="ml-letter-rule" aria-hidden />

        <div className="ml-letter-body" style={{ fontFamily: '"Cormorant Garamond", "Playfair Display", serif' }}>
          {lines.map((p, i) => (
            <p key={i} className="ml-letter-line" style={{ animationDelay: `${600 + i * 700}ms` }}>{p}</p>
          ))}
        </div>

        {sender && (
          <div className="ml-letter-sign" style={{ ...SERIF, animationDelay: `${600 + lines.length * 700 + 400}ms` }}>
            — {sender}
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   CENA 3 — Música
   Tela inteira. Visual próprio: anéis pulsantes, capa flutuante.
   ========================================================= */
function SceneMusic({ title, artist, cover, src }: { title: string; artist: string; cover: string; src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onTime = () => {
      setCurrent(a.currentTime);
      setDuration(a.duration || 0);
      setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    };
    const onEnd = () => { setPlaying(false); setProgress(0); setCurrent(0); };
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
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <section className={`ml-scene ml-music ${playing ? "is-playing" : ""}`} style={{ minHeight: "100svh" }}>
      {cover && (
        <div className="ml-music-atmos" aria-hidden>
          <img src={cover} alt="" className="ml-music-atmos-img" />
          <div className="ml-music-atmos-veil" />
        </div>
      )}

      <div className="ml-music-inner">
        <div className="ml-music-eyebrow" style={SANS}>A TRILHA DESSA HISTÓRIA</div>

        <div className="ml-music-stage">
          <div className="ml-music-rings" aria-hidden>
            <span /><span /><span />
          </div>
          <div className="ml-music-cover">
            {cover ? (
              <img src={cover} alt="" />
            ) : (
              <div className="ml-music-cover-fallback">♪</div>
            )}
          </div>
        </div>

        <h2 className="ml-music-title" style={SERIF}>{title}</h2>
        {artist && <div className="ml-music-artist" style={SANS}>{artist}</div>}

        <button type="button" onClick={toggle} aria-label={playing ? "Pausar" : "Tocar"} className="ml-music-play">
          {playing ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>

        <div className="ml-music-bar">
          <span className="ml-music-time" style={SANS}>{fmt(current)}</span>
          <div className="ml-music-track">
            <div className="ml-music-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="ml-music-time" style={SANS}>{fmt(duration)}</span>
        </div>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" />
    </section>
  );
}

/* =========================================================
   CENA 4 — Memórias vivas (narrativa visual, sem grid)
   ========================================================= */
type Chapter = { url: string; align: "left" | "right" | "center" };

function composeChapters(photos: string[]): Chapter[] {
  const aligns: Chapter["align"][] = ["center", "left", "right", "center", "right", "left"];
  return photos.map((url, i) => ({ url, align: aligns[i % aligns.length] }));
}

function MemoryChapter({ chapter, index, total, onOpen }: { chapter: Chapter; index: number; total: number; onOpen: () => void }) {
  const { ref, seen } = useInView<HTMLElement>(0.25);
  const num = String(index + 1).padStart(2, "0");
  const tot = String(total).padStart(2, "0");
  return (
    <section ref={ref} className={`ml-scene ml-chapter ml-chapter-${chapter.align} ${seen ? "is-in" : ""}`}>
      <div className="ml-chapter-meta" style={SANS}>
        <span className="ml-chapter-num">{num}</span>
        <span className="ml-chapter-sep" />
        <span className="ml-chapter-tot">{tot}</span>
      </div>
      <button onClick={onOpen} className="ml-chapter-btn" aria-label="Ampliar foto">
        <div className="ml-chapter-frame">
          <img src={chapter.url} alt="" aria-hidden className="ml-chapter-blur" />
          <div className="ml-chapter-shade" />
          <img src={chapter.url} alt="" loading="lazy" decoding="async" className="ml-chapter-img" />
        </div>
      </button>
    </section>
  );
}

/* =========================================================
   CENA 5 — Encerramento (frases uma a uma, com silêncio)
   ========================================================= */
function SceneEnding() {
  const { ref, seen } = useInView<HTMLDivElement>(0.35);
  const phrases = [
    "Os momentos passam.",
    "O amor permanece.",
    "Obrigado por fazer parte desta história.",
  ];
  return (
    <section ref={ref} className={`ml-scene ml-end ${seen ? "is-in" : ""}`} style={{ minHeight: "100svh" }}>
      <div className="ml-end-inner">
        {phrases.map((p, i) => (
          <p key={i} className="ml-end-line" style={{ ...SERIF, animationDelay: `${400 + i * 1600}ms` }}>{p}</p>
        ))}
        <div className="ml-end-heart" style={{ animationDelay: `${400 + phrases.length * 1600 + 300}ms` }} aria-hidden>❤</div>
        <p className="ml-end-line ml-end-final" style={{ ...SERIF, animationDelay: `${400 + phrases.length * 1600 + 1200}ms` }}>
          Até a próxima memória.
        </p>
        <div className="ml-end-sign" style={{ ...SANS, animationDelay: `${400 + phrases.length * 1600 + 2400}ms` }}>
          Criado com <span style={{ color: GOLD }}>♥</span> no MemoLove
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   Página
   ========================================================= */
function HomenagemPage() {
  const { slug } = Route.useParams();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => { stopAllAudio(); return () => stopAllAudio(); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cleanSlug = decodeURIComponent(slug ?? "").trim();
      const { data: list, error } = await supabase
        .from("memories")
        .select("id, slug, father_name, sender_name, message, occasion, music_title, music_artist, music_cover, music_preview_url")
        .eq("slug", cleanSlug)
        .limit(1);
      const mem = list && list.length ? list[0] : null;
      if (cancelled) return;
      if (error || !mem) { setErr("Não encontramos sua memória."); setReady(true); return; }
      setMemory(mem as Memory);
      setReady(true);

      const { data: rows } = await supabase
        .from("memory_photos")
        .select("photo_url, position")
        .eq("memory_id", mem.id)
        .order("position", { ascending: true });
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

  const hero = photos[0];
  const gallery = photos.slice(1).filter(Boolean);
  const blocks = composeNarrative(gallery);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") setLightbox((v) => (v !== null ? Math.max(0, v - 1) : v));
      if (e.key === "ArrowRight") setLightbox((v) => (v !== null && v < gallery.length - 1 ? v + 1 : v));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [lightbox, gallery.length]);

  let touchStartX = 0;
  const onTouchStart = (e: React.TouchEvent) => { touchStartX = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) setLightbox((v) => (v !== null && v < gallery.length - 1 ? v + 1 : v));
    else setLightbox((v) => (v !== null ? Math.max(0, v - 1) : v));
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: INK, ...SANS }}>
        <div className="text-[10px] tracking-[0.4em] uppercase animate-pulse" style={{ color: GOLD }}>Preparando</div>
      </div>
    );
  }

  if (err || !memory) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: INK, color: CREAM, ...SANS }}>
        <div className="max-w-xl mx-auto text-center p-8">
          <h1 className="text-2xl mb-2" style={SERIF}>Memória não encontrada</h1>
          <p className="text-sm opacity-70">{err}</p>
        </div>
      </div>
    );
  }

  const scrollToLetter = () => {
    const el = document.getElementById("ml-scene-letter");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="ml-root">
      <style>{`
        .ml-root { background: ${INK}; color: ${CREAM}; ${''}}
        .ml-scene { position: relative; width: 100%; overflow: hidden; }

        /* ========== Reveal utility ========== */
        @keyframes ml-rise {
          0%   { opacity: 0; transform: translateY(24px); filter: blur(12px); }
          100% { opacity: 1; transform: none; filter: none; }
        }
        @keyframes ml-breathe {
          0%,100% { transform: translateY(0); opacity: .55; }
          50%     { transform: translateY(6px); opacity: 1; }
        }

        /* ================= CENA 1 · Abertura ================= */
        .ml-opening { background: ${INK}; }
        @keyframes ml-kb {
          0%   { transform: scale(1.04) translate3d(0,0,0); }
          100% { transform: scale(1.18) translate3d(-2%, -1.5%, 0); }
        }
        .ml-open-img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover;
          animation: ml-kb 22s ease-out both;
        }
        .ml-open-veil {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.18) 32%, rgba(0,0,0,.45) 65%, rgba(0,0,0,.92) 100%);
        }
        .ml-open-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 40%, rgba(0,0,0,.6) 100%);
        }
        .ml-particles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .ml-particles i {
          position: absolute; width: 3px; height: 3px; border-radius: 999px;
          background: radial-gradient(circle, rgba(255,225,180,.9), rgba(255,225,180,0));
          filter: blur(.5px);
          animation: ml-drift linear infinite;
        }
        @keyframes ml-drift {
          0%   { transform: translate3d(0,0,0); opacity: 0; }
          20%  { opacity: .7; }
          100% { transform: translate3d(24px, -110px, 0); opacity: 0; }
        }
        .ml-open-content {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
          text-align: center; padding: 0 24px 22vh;
        }
        .ml-open-eyebrow {
          font-size: 11px; letter-spacing: .48em; color: ${GOLD};
          opacity: 0; animation: ml-rise 1.6s .4s ease-out forwards;
        }
        .ml-open-name {
          margin-top: 22px;
          font-style: italic; font-weight: 500; color: #fff;
          font-size: clamp(52px, 10vw, 108px); line-height: 1;
          letter-spacing: -.015em;
          text-shadow: 0 6px 40px rgba(0,0,0,.5);
          opacity: 0; animation: ml-rise 2s .9s ease-out forwards;
        }
        .ml-open-line {
          margin-top: 26px; max-width: 420px;
          color: rgba(246,240,231,.78);
          font-size: 14px; letter-spacing: .08em; line-height: 1.7;
          opacity: 0; animation: ml-rise 1.6s 1.9s ease-out forwards;
        }
        .ml-open-arrow {
          position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
          color: rgba(255,255,255,.75);
          opacity: 0;
          animation: ml-rise 1.4s 2.8s ease-out forwards, ml-breathe 2.6s 4s ease-in-out infinite;
        }

        /* ================= CENA 2 · Carta ================= */
        .ml-letter-wrap {
          background: ${INK};
          padding: 0;
          min-height: 100svh;
        }
        .ml-letter-bg {
          position: sticky; top: 0;
          width: 100%; height: 60svh;
          overflow: hidden;
        }
        .ml-letter-bg-img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover;
          transform: scale(1.08);
          filter: brightness(.55) saturate(1.05);
        }
        .ml-letter-bg-veil {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(8,7,10,.4) 0%, rgba(8,7,10,.85) 70%, ${INK} 100%);
        }
        .ml-letter-sheet {
          position: relative;
          margin: -22svh auto 0;
          max-width: 720px;
          padding: 84px 44px 96px;
          background: ${CREAM};
          color: ${INK};
          box-shadow: 0 -30px 80px rgba(0,0,0,.5), 0 40px 100px rgba(0,0,0,.4);
          opacity: 0;
          transform: translateY(60px);
          transition: opacity 1.2s cubic-bezier(.2,.7,.2,1), transform 1.2s cubic-bezier(.2,.7,.2,1);
        }
        .ml-letter-sheet.is-in { opacity: 1; transform: none; }
        .ml-letter-sheet::before,
        .ml-letter-sheet::after {
          content: ""; position: absolute; left: 0; right: 0; height: 20px; pointer-events: none;
        }
        .ml-letter-sheet::before { top: 0; background: linear-gradient(180deg, rgba(8,7,10,.06), transparent); }
        .ml-letter-eyebrow {
          font-size: 10px; letter-spacing: .48em; color: ${GOLD};
          text-align: center;
        }
        .ml-letter-rule {
          width: 40px; height: 1px; background: ${GOLD};
          margin: 20px auto 44px; opacity: .5;
        }
        .ml-letter-body {
          font-size: 22px;
          line-height: 1.75;
          color: #2a251f;
          font-style: italic;
        }
        .ml-letter-body p { margin: 0 0 1.1em; }
        .ml-letter-body p:last-child { margin-bottom: 0; }
        .ml-letter-sign {
          margin-top: 56px;
          text-align: right;
          font-style: italic;
          font-size: 24px;
          color: ${GOLD};
        }
        @media (max-width: 640px) {
          .ml-letter-sheet { padding: 60px 26px 72px; margin-top: -18svh; }
          .ml-letter-body { font-size: 19px; line-height: 1.7; }
          .ml-letter-sign { font-size: 20px; }
        }

        /* ================= CENA 3 · Música ================= */
        .ml-music {
          background: ${INK};
          display: flex; align-items: center; justify-content: center;
          padding: 100px 24px;
        }
        .ml-music-atmos { position: absolute; inset: 0; overflow: hidden; }
        .ml-music-atmos-img {
          position: absolute; inset: -10%;
          width: 120%; height: 120%;
          object-fit: cover;
          filter: blur(80px) brightness(.35) saturate(1.4);
          opacity: .8;
          transform: scale(1.2);
        }
        .ml-music-atmos-veil {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at center, rgba(8,7,10,.4) 0%, rgba(8,7,10,.92) 80%);
        }
        .ml-music-inner {
          position: relative; z-index: 1;
          text-align: center; max-width: 480px; width: 100%;
        }
        .ml-music-eyebrow {
          font-size: 10px; letter-spacing: .48em; color: ${GOLD};
          margin-bottom: 60px;
        }
        .ml-music-stage {
          position: relative;
          width: 260px; height: 260px;
          margin: 0 auto 44px;
          display: flex; align-items: center; justify-content: center;
        }
        .ml-music-rings { position: absolute; inset: 0; }
        .ml-music-rings span {
          position: absolute; inset: 0;
          border-radius: 999px;
          border: 1px solid rgba(200,164,126,.28);
          opacity: 0;
        }
        @keyframes ml-pulse {
          0%   { transform: scale(.85); opacity: 0; }
          25%  { opacity: .7; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        .ml-music.is-playing .ml-music-rings span {
          animation: ml-pulse 3.6s ease-out infinite;
        }
        .ml-music.is-playing .ml-music-rings span:nth-child(2) { animation-delay: 1.2s; }
        .ml-music.is-playing .ml-music-rings span:nth-child(3) { animation-delay: 2.4s; }
        .ml-music-cover {
          position: relative; z-index: 1;
          width: 220px; height: 220px; border-radius: 999px;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(200,164,126,.2);
          transition: box-shadow .8s ease;
        }
        .ml-music.is-playing .ml-music-cover {
          box-shadow: 0 30px 80px rgba(200,164,126,.35), 0 0 0 1px rgba(200,164,126,.45);
        }
        .ml-music-cover img { width: 100%; height: 100%; object-fit: cover; }
        .ml-music-cover-fallback {
          width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
          color: rgba(246,240,231,.4); font-size: 72px; background: #1a1613;
        }
        .ml-music-title {
          font-size: clamp(24px, 4vw, 32px);
          font-style: italic; color: #fff; margin: 0 0 8px;
        }
        .ml-music-artist {
          font-size: 12px; letter-spacing: .22em; text-transform: uppercase;
          color: rgba(246,240,231,.55); margin-bottom: 36px;
        }
        .ml-music-play {
          width: 72px; height: 72px; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          background: ${CREAM}; color: ${INK};
          box-shadow: 0 16px 40px rgba(200,164,126,.35);
          transition: transform .2s ease, box-shadow .3s ease;
          margin-bottom: 36px;
        }
        .ml-music-play:hover { transform: scale(1.06); }
        .ml-music-play:active { transform: scale(.96); }
        .ml-music.is-playing .ml-music-play { box-shadow: 0 20px 50px rgba(200,164,126,.55); }
        .ml-music-bar {
          display: flex; align-items: center; gap: 14px;
          max-width: 360px; margin: 0 auto;
        }
        .ml-music-time { font-size: 10px; color: rgba(246,240,231,.5); letter-spacing: .1em; font-variant-numeric: tabular-nums; }
        .ml-music-track { flex: 1; height: 1px; background: rgba(255,255,255,.15); border-radius: 999px; overflow: hidden; }
        .ml-music-fill { height: 100%; background: ${GOLD}; transition: width .2s linear; }

        /* ================= CENA 4 · Memórias ================= */
        .ml-mems {
          background: ${INK};
          padding: 120px 20px 140px;
        }
        .ml-mems-eyebrow {
          text-align: center;
          font-size: 10px; letter-spacing: .48em; color: ${GOLD};
          margin-bottom: 12px;
        }
        .ml-mems-title {
          text-align: center;
          font-style: italic; color: ${CREAM};
          font-size: clamp(30px, 5vw, 44px);
          margin: 0 0 100px;
        }
        .ml-mem {
          opacity: 0; transform: translateY(40px) scale(.98); filter: blur(10px);
          transition: opacity 1.1s cubic-bezier(.2,.7,.2,1), transform 1.1s cubic-bezier(.2,.7,.2,1), filter 1.1s ease-out;
          margin: 0 auto 120px;
        }
        .ml-mem.is-in { opacity: 1; transform: none; filter: none; }
        .ml-mem:last-child { margin-bottom: 0; }
        .ml-mem-btn { display: block; width: 100%; background: transparent; padding: 0; border: 0; cursor: zoom-in; }
        .ml-mem-frame { position: relative; width: 100%; overflow: hidden; background: #0d0b0d; }
        .ml-mem-blur {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; transform: scale(1.3);
          filter: blur(40px) brightness(.4);
        }
        .ml-mem-shade { position: absolute; inset: 0; background: rgba(0,0,0,.2); }
        .ml-mem-img {
          position: relative; z-index: 1;
          width: 100%; height: 100%;
          object-fit: contain;
          transition: transform 1.4s ease-out;
        }
        .ml-mem-btn:hover .ml-mem-img { transform: scale(1.02); }

        /* Layouts narrativos */
        .ml-mem-full     { max-width: 1080px; }
        .ml-mem-full     .ml-mem-frame { aspect-ratio: 16/10; }
        .ml-mem-center   { max-width: 620px; }
        .ml-mem-center   .ml-mem-frame { aspect-ratio: 4/5; }
        .ml-mem-left     { max-width: 820px; margin-right: auto; margin-left: 0; }
        .ml-mem-left     .ml-mem-frame { aspect-ratio: 3/4; }
        .ml-mem-right    { max-width: 820px; margin-left: auto; margin-right: 0; }
        .ml-mem-right    .ml-mem-frame { aspect-ratio: 3/4; }
        .ml-mem-small-left  { max-width: 420px; margin-right: auto; margin-left: 8%; }
        .ml-mem-small-left  .ml-mem-frame { aspect-ratio: 1/1; }
        .ml-mem-small-right { max-width: 420px; margin-left: auto; margin-right: 8%; }
        .ml-mem-small-right .ml-mem-frame { aspect-ratio: 1/1; }
        @media (max-width: 720px) {
          .ml-mems { padding: 80px 18px 100px; }
          .ml-mems-title { margin-bottom: 60px; }
          .ml-mem { margin-bottom: 80px; max-width: 100% !important; margin-left: auto !important; margin-right: auto !important; }
          .ml-mem-full .ml-mem-frame,
          .ml-mem-center .ml-mem-frame,
          .ml-mem-left .ml-mem-frame,
          .ml-mem-right .ml-mem-frame,
          .ml-mem-small-left .ml-mem-frame,
          .ml-mem-small-right .ml-mem-frame { aspect-ratio: 4/5; }
        }

        /* ================= CENA 5 · Encerramento ================= */
        .ml-end {
          background: ${INK};
          display: flex; align-items: center; justify-content: center;
          padding: 100px 24px;
        }
        .ml-end-inner { max-width: 640px; text-align: center; }
        .ml-end-line {
          font-size: clamp(26px, 4vw, 36px);
          line-height: 1.5;
          color: ${CREAM};
          margin: 0 0 42px;
          opacity: 0; filter: blur(12px);
          font-style: italic;
        }
        .ml-end.is-in .ml-end-line { animation: ml-rise 1.6s ease-out forwards; }
        .ml-end-heart {
          font-size: 28px; color: ${GOLD};
          margin: 20px 0 42px;
          opacity: 0;
        }
        .ml-end.is-in .ml-end-heart { animation: ml-rise 1.4s ease-out forwards, ml-breathe 3s 2s ease-in-out infinite; }
        .ml-end-final { color: ${GOLD}; font-size: clamp(22px, 3.5vw, 30px); margin-top: 20px; margin-bottom: 0; }
        .ml-end-sign {
          margin-top: 80px;
          font-size: 11px; letter-spacing: .42em; text-transform: uppercase;
          color: rgba(246,240,231,.55);
          opacity: 0;
        }
        .ml-end.is-in .ml-end-sign { animation: ml-rise 1.2s ease-out forwards; }

        /* ================= Lightbox ================= */
        .ml-lb {
          position: fixed; inset: 0; z-index: 60;
          background: rgba(4,3,5,.97);
          display: flex; align-items: center; justify-content: center;
          animation: ml-lb-fade .4s ease-out;
        }
        @keyframes ml-lb-fade { from { opacity: 0 } to { opacity: 1 } }
        .ml-lb-img {
          max-width: 92vw; max-height: 88vh;
          object-fit: contain; border-radius: 2px;
          box-shadow: 0 40px 120px rgba(0,0,0,.7);
          animation: ml-lb-zoom .6s cubic-bezier(.2,.7,.2,1);
        }
        @keyframes ml-lb-zoom { from { opacity: 0; transform: scale(.92) } to { opacity: 1; transform: scale(1) } }
        .ml-lb-close {
          position: absolute; top: 20px; right: 20px;
          width: 42px; height: 42px; border-radius: 999px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,.06); backdrop-filter: blur(8px);
          color: rgba(255,255,255,.85);
          transition: background .2s ease, color .2s ease;
        }
        .ml-lb-close:hover { background: rgba(255,255,255,.14); color: #fff; }
        .ml-lb-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 46px; height: 46px; border-radius: 999px;
          display: none; align-items: center; justify-content: center;
          background: rgba(255,255,255,.06); backdrop-filter: blur(8px);
          color: rgba(255,255,255,.85);
        }
        @media (min-width: 720px) { .ml-lb-nav { display: flex; } }
      `}</style>

      {/* CENA 1 */}
      <SceneOpening name={memory.father_name} photo={hero} onNext={scrollToLetter} />

      {/* CENA 2 */}
      <div id="ml-scene-letter">
        <SceneLetter photo={hero} message={memory.message} sender={memory.sender_name} />
      </div>

      {/* CENA 3 */}
      {memory.music_preview_url && (
        <SceneMusic
          title={memory.music_title ?? "Trilha"}
          artist={memory.music_artist ?? ""}
          cover={memory.music_cover ?? ""}
          src={memory.music_preview_url}
        />
      )}

      {/* CENA 4 */}
      {blocks.length > 0 && (
        <section className="ml-scene ml-mems">
          <div className="ml-mems-eyebrow" style={SANS}>MOMENTOS</div>
          <h2 className="ml-mems-title" style={SERIF}>As memórias que ficam</h2>
          {blocks.map((b, i) => (
            <MemoryBlock key={i} block={b} index={i} onOpen={() => setLightbox(i)} />
          ))}
        </section>
      )}

      {/* CENA 5 */}
      <SceneEnding />

      {/* Lightbox */}
      {lightbox !== null && gallery[lightbox] && (
        <div className="ml-lb" onClick={() => setLightbox(null)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} role="dialog" aria-modal="true">
          <img key={lightbox} src={gallery[lightbox]} alt="" className="ml-lb-img" />
          <button type="button" onClick={(e) => { e.stopPropagation(); setLightbox(null); }} aria-label="Fechar" className="ml-lb-close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
          {lightbox > 0 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }} aria-label="Anterior" className="ml-lb-nav" style={{ left: 24 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M15 6l-6 6 6 6"/></svg>
            </button>
          )}
          {lightbox < gallery.length - 1 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }} aria-label="Próxima" className="ml-lb-nav" style={{ right: 24 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 6l6 6-6 6"/></svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
