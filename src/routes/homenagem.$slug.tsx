import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";
import { LuxuryLetter } from "@/components/LuxuryLetter";

/* ============================================================
   MemoLove Premium V2 — /homenagem/$slug
   Um filme interativo de memórias.
   Paleta: #0A0A0A · #C8A47E · #F6F0E7 · #FFFFFF
   ============================================================ */

const SANS = { fontFamily: '"Inter", system-ui, -apple-system, sans-serif' } as const;
const SERIF = { fontFamily: '"Playfair Display", Georgia, serif' } as const;
const SCRIPT = { fontFamily: '"Great Vibes", "Playfair Display", cursive' } as const;

const GOLD = "#C8A47E";
const CREAM = "#F6F0E7";
const INK = "#0A0A0A";

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
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@300;400;500;600;700&family=Great+Vibes&family=Cormorant+Garamond:ital,wght@1,500&display=swap",
      },
    ],
  }),
  component: HomenagemPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: CREAM, color: INK }}>
      <div>
        <h1 className="text-2xl mb-2" style={SERIF}>Ops…</h1>
        <p className="text-sm opacity-70">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: CREAM, color: INK }}>
      <p style={SERIF}>Memória não encontrada.</p>
    </div>
  ),
  ssr: false,
});

/* ---------------- Reveal on scroll ---------------- */
function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fallback = window.setTimeout(() => el.classList.add("is-in"), 2200);
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return () => window.clearTimeout(fallback);
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => { io.disconnect(); window.clearTimeout(fallback); };
  }, [threshold]);
  return ref;
}

function Reveal({
  children,
  delay = 0,
  variant = "up",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  variant?: "up" | "blur" | "scale" | "fade";
  className?: string;
}) {
  const ref = useReveal<HTMLDivElement>(0.12);
  return (
    <div ref={ref} className={`mlv-in mlv-${variant} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ---------------- Cinematic Photo (contain + blur backdrop) ---------------- */
function CinePhoto({
  url,
  aspect = "aspect-[4/5]",
  eager = false,
  onClick,
  radius = 6,
  contain = false,
}: {
  url: string;
  aspect?: string;
  eager?: boolean;
  onClick?: () => void;
  radius?: number;
  contain?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full ${aspect} overflow-hidden bg-[#111] focus:outline-none`}
      style={{ borderRadius: radius }}
      aria-label="Ampliar foto"
    >
      {url && (
        <>
          <img
            src={url} alt="" aria-hidden
            loading={eager ? "eager" : "lazy"} decoding="async"
            className="absolute inset-0 w-full h-full object-cover scale-125"
            style={{ filter: "blur(42px) brightness(0.5) saturate(1.1)" }}
          />
          <div className="absolute inset-0 bg-black/25" />
          <img
            src={url} alt=""
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            decoding="async"
            className={`mlv-photo relative w-full h-full ${contain ? "object-contain" : "object-cover"} transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]`}
            onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
          />
        </>
      )}
    </button>
  );
}

/* ---------------- Music — visual próprio MemoLove ---------------- */
function MusicExperience({ title, artist, cover, src }: { title: string; artist: string; cover: string; src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
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
    const a = audioRef.current;
    if (!a) return;
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
    <div className={`mlv-music ${playing ? "is-playing" : ""}`}>
      <div className="mlv-music-cover">
        {cover ? (
          <>
            <img src={cover} alt="" aria-hidden className="mlv-music-cover-bg" />
            <img src={cover} alt="" className="mlv-music-cover-img" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-6xl">♪</div>
        )}
        <div className="mlv-music-vinyl" aria-hidden />
      </div>

      <div className="mlv-music-info">
        <div className="mlv-music-eyebrow">TRILHA SONORA</div>
        <div className="mlv-music-title" style={SERIF}>{title}</div>
        {artist && <div className="mlv-music-artist">{artist}</div>}

        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pausar" : "Tocar"}
          className="mlv-music-play"
        >
          {playing ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>

        <div className="mlv-music-bar">
          <span className="mlv-music-time">{fmt(current)}</span>
          <div className="mlv-music-track">
            <div className="mlv-music-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="mlv-music-time">{fmt(duration)}</span>
        </div>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}

/* ---------------- Encerramento ---------------- */
function Ending() {
  const ref = useReveal<HTMLDivElement>(0.3);
  const phrases = [
    "Os momentos passam.",
    "O amor permanece.",
    "Obrigado por fazer parte desta história.",
    "Até a próxima memória.",
  ];
  return (
    <section
      ref={ref}
      className="mlv-in mlv-fade relative w-full flex flex-col items-center justify-center text-center px-6"
      style={{ background: INK, color: CREAM, minHeight: "100svh" }}
    >
      <div className="mlv-ending">
        {phrases.map((p, i) => (
          <p
            key={i}
            className="mlv-ending-line"
            style={{ ...SERIF, animationDelay: `${400 + i * 1100}ms` }}
          >
            {p}
          </p>
        ))}
        <div
          className="mlv-ending-sign"
          style={{ ...SANS, animationDelay: `${400 + phrases.length * 1100 + 300}ms` }}
        >
          Criado com <span style={{ color: GOLD }}>♥</span> no MemoLove
        </div>
      </div>
    </section>
  );
}

/* ---------------- Page ---------------- */
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

  const gallery = photos.slice(1).filter(Boolean);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") setLightbox((v) => (v !== null ? Math.max(0, v - 1) : v));
      if (e.key === "ArrowRight") setLightbox((v) => (v !== null && v < gallery.length - 1 ? v + 1 : v));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, gallery.length]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: INK, ...SANS }}>
        <div className="text-[10px] tracking-[0.4em] uppercase animate-pulse" style={{ color: GOLD }}>Preparando</div>
      </div>
    );
  }

  if (err || !memory) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: CREAM, color: INK, ...SANS }}>
        <div className="max-w-xl mx-auto text-center p-8">
          <h1 className="text-2xl mb-2" style={SERIF}>Memória não encontrada</h1>
          <p className="text-sm opacity-70">{err}</p>
        </div>
      </div>
    );
  }

  const hero = photos[0];
  const trackPreview = memory.music_preview_url;

  const scrollNext = () => {
    const el = document.getElementById("mlv-carta");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  let touchStartX = 0;
  const onTouchStart = (e: React.TouchEvent) => { touchStartX = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) setLightbox((v) => (v !== null && v < gallery.length - 1 ? v + 1 : v));
    else setLightbox((v) => (v !== null ? Math.max(0, v - 1) : v));
  };

  // Ritmo do álbum: padrões alternados
  const composePatterns = (list: string[]) => {
    const blocks: Array<{ kind: "hero" | "duo" | "wide" | "trio"; items: string[] }> = [];
    let i = 0;
    const patterns: Array<"hero" | "duo" | "wide" | "trio"> = ["hero", "duo", "wide", "hero", "trio", "wide"];
    let p = 0;
    while (i < list.length) {
      const kind = patterns[p % patterns.length];
      const take = kind === "hero" ? 1 : kind === "duo" ? 2 : kind === "wide" ? 1 : 3;
      const items = list.slice(i, i + take).filter(Boolean);
      if (items.length === 0) break;
      blocks.push({ kind, items });
      i += take;
      p++;
    }
    return blocks;
  };
  const blocks = composePatterns(gallery);

  return (
    <div className="min-h-screen antialiased mlv-root" style={{ background: CREAM, color: INK, ...SANS }}>
      <style>{`
        /* ========= Reveal ========= */
        .mlv-in { opacity: 0; transition: opacity 900ms cubic-bezier(.2,.7,.2,1), transform 900ms cubic-bezier(.2,.7,.2,1), filter 900ms ease-out; will-change: opacity, transform, filter; }
        .mlv-up { transform: translateY(28px); }
        .mlv-blur { filter: blur(14px); transform: translateY(14px); }
        .mlv-scale { transform: scale(.96); }
        .mlv-fade { }
        .mlv-in.is-in { opacity: 1; transform: none; filter: none; }

        /* ========= Photos ========= */
        .mlv-photo { opacity: 0; transform: scale(1.02); transition: opacity 900ms ease-out, transform 1600ms ease-out; }
        .mlv-photo.is-loaded { opacity: 1; transform: scale(1); }

        /* ========= Hero Ken Burns ========= */
        @keyframes mlv-kb {
          0%   { transform: scale(1.04) translate3d(0,0,0); }
          100% { transform: scale(1.14) translate3d(-1.5%, -1%, 0); }
        }
        .mlv-hero-img { animation: mlv-kb 18s ease-out both; }
        @keyframes mlv-fadein-up {
          0% { opacity: 0; transform: translateY(28px); filter: blur(10px); }
          100% { opacity: 1; transform: none; filter: none; }
        }
        .mlv-hero-eyebrow { animation: mlv-fadein-up 1.6s .3s ease-out both; }
        .mlv-hero-title { animation: mlv-fadein-up 1.8s .7s ease-out both; }
        .mlv-hero-sub   { animation: mlv-fadein-up 1.6s 1.5s ease-out both; }
        .mlv-hero-arrow { animation: mlv-fadein-up 1.4s 2.4s ease-out both, mlv-breathe 2.4s 3s ease-in-out infinite; }
        @keyframes mlv-breathe { 0%,100%{ transform: translateY(0); opacity:.7 } 50%{ transform: translateY(6px); opacity:1 } }

        /* Partículas de luz sutis */
        @keyframes mlv-drift {
          0%   { transform: translate3d(0,0,0); opacity: 0; }
          20%  { opacity: .65; }
          100% { transform: translate3d(20px, -80px, 0); opacity: 0; }
        }
        .mlv-particles { position: absolute; inset:0; pointer-events:none; overflow:hidden; }
        .mlv-particles i {
          position: absolute; width: 3px; height: 3px; border-radius: 999px;
          background: radial-gradient(circle, rgba(255,225,180,.9), rgba(255,225,180,0));
          filter: blur(.5px);
          animation: mlv-drift 12s linear infinite;
        }

        /* ========= Music ========= */
        .mlv-music {
          position: relative;
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
          width: 100%;
          max-width: 780px;
          margin: 0 auto;
          padding: 40px 28px 44px;
          background: linear-gradient(180deg, rgba(20,16,14,.98) 0%, rgba(10,8,7,.98) 100%);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 40px 100px -40px rgba(0,0,0,.6), 0 10px 30px -12px rgba(0,0,0,.35);
          transition: box-shadow 700ms ease;
        }
        .mlv-music.is-playing { box-shadow: 0 40px 100px -30px rgba(200,164,126,.35), 0 10px 30px -12px rgba(0,0,0,.5); }
        .mlv-music-cover {
          position: relative;
          width: 220px; height: 220px;
          margin: 0 auto 28px;
          border-radius: 999px;
          overflow: hidden;
          box-shadow: 0 20px 60px -20px rgba(0,0,0,.7);
        }
        .mlv-music-cover-bg { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; filter: blur(30px) brightness(.6); transform: scale(1.3); }
        .mlv-music-cover-img { position:relative; width:100%; height:100%; object-fit:cover; animation: mlv-spin 24s linear infinite paused; }
        .mlv-music.is-playing .mlv-music-cover-img { animation-play-state: running; }
        .mlv-music-vinyl {
          position:absolute; inset:0; border-radius:999px;
          background: radial-gradient(circle at center, rgba(0,0,0,.55) 0 12%, transparent 12.5%);
          pointer-events:none;
        }
        @keyframes mlv-spin { to { transform: rotate(360deg); } }
        .mlv-music-info { text-align:center; color: #f6f0e7; }
        .mlv-music-eyebrow { font-size: 10px; letter-spacing: .42em; color: ${GOLD}; font-weight: 500; }
        .mlv-music-title { font-size: 26px; margin: 12px 0 4px; color: #fff; font-style: italic; }
        .mlv-music-artist { font-size: 13px; color: rgba(246,240,231,.6); letter-spacing: .12em; text-transform: uppercase; }
        .mlv-music-play {
          margin: 24px auto 20px;
          width: 68px; height: 68px; border-radius: 999px;
          display:flex; align-items:center; justify-content:center;
          background: linear-gradient(140deg, #f6f0e7, #e5d5bf);
          color: #0a0a0a;
          box-shadow: 0 14px 30px -8px rgba(200,164,126,.5);
          transition: transform .2s ease, box-shadow .3s ease;
        }
        .mlv-music-play:hover { transform: scale(1.06); }
        .mlv-music-play:active { transform: scale(.96); }
        .mlv-music.is-playing .mlv-music-play { box-shadow: 0 14px 40px -6px rgba(200,164,126,.75); }
        .mlv-music-bar { display:flex; align-items:center; gap: 12px; max-width: 420px; margin: 0 auto; }
        .mlv-music-time { font-size: 10px; color: rgba(246,240,231,.5); font-variant-numeric: tabular-nums; letter-spacing: .1em; }
        .mlv-music-track { flex:1; height: 2px; background: rgba(255,255,255,.12); border-radius: 999px; overflow: hidden; }
        .mlv-music-fill { height:100%; background: linear-gradient(90deg, ${GOLD}, #e8caa8); transition: width .2s linear; }

        /* ========= Ending ========= */
        .mlv-ending { max-width: 640px; }
        .mlv-ending-line {
          font-size: clamp(24px, 4vw, 34px);
          line-height: 1.5;
          margin: 0 0 22px;
          opacity: 0;
          filter: blur(12px);
          animation: mlv-fadein-up 1.4s ease-out forwards;
        }
        .mlv-ending-sign {
          margin-top: 60px;
          font-size: 12px;
          letter-spacing: .38em;
          text-transform: uppercase;
          opacity: 0;
          animation: mlv-fadein-up 1.2s ease-out forwards;
          color: rgba(246,240,231,.65);
        }

        /* ========= Lightbox ========= */
        .mlv-lb { position: fixed; inset: 0; z-index: 60; background: rgba(6,4,3,.96); display:flex; align-items:center; justify-content:center; animation: mlv-lb-in .35s ease-out; }
        @keyframes mlv-lb-in { from { opacity:0 } to { opacity:1 } }
        .mlv-lb-img { max-width: 92vw; max-height: 88vh; object-fit: contain; border-radius: 4px; box-shadow: 0 30px 80px rgba(0,0,0,.6); animation: mlv-lb-zoom .5s cubic-bezier(.2,.7,.2,1); }
        @keyframes mlv-lb-zoom { from { opacity:0; transform: scale(.94) } to { opacity:1; transform: scale(1) } }

        /* ========= Helpers ========= */
        .mlv-eyebrow { font-size: 10px; letter-spacing: .42em; color: ${GOLD}; text-transform: uppercase; font-weight: 500; }

        @media (max-width: 640px) {
          .mlv-music { padding: 32px 20px 36px; border-radius: 20px; }
          .mlv-music-cover { width: 180px; height: 180px; margin-bottom: 24px; }
          .mlv-music-title { font-size: 22px; }
        }
      `}</style>

      {/* ============================================================
          1 · ABERTURA CINEMATOGRÁFICA
          ============================================================ */}
      <section className="relative w-full overflow-hidden" style={{ background: INK, height: "100svh" }}>
        {hero && (
          <>
            <img
              src={hero} alt="" aria-hidden loading="eager" decoding="async"
              className="mlv-hero-img absolute inset-0 w-full h-full object-cover"
            />
            {/* overlays cinematográficos */}
            <div className="absolute inset-0" style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.15) 30%, rgba(0,0,0,.35) 65%, rgba(0,0,0,.85) 100%)",
            }} />
            <div className="absolute inset-0" style={{
              background: "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 40%, rgba(0,0,0,.55) 100%)",
            }} />

            {/* Partículas / luz sutil */}
            <div className="mlv-particles">
              {Array.from({ length: 14 }).map((_, i) => (
                <i
                  key={i}
                  style={{
                    left: `${(i * 73) % 100}%`,
                    bottom: `-${(i * 9) % 40}px`,
                    animationDelay: `${(i * 0.7) % 10}s`,
                    animationDuration: `${9 + (i % 6)}s`,
                  }}
                />
              ))}
            </div>
          </>
        )}

        <div className="relative z-10 h-full w-full flex flex-col items-center justify-end pb-24 sm:pb-28 px-6 text-center">
          <div className="mlv-hero-eyebrow" style={{ ...SANS, color: GOLD, fontSize: 11, letterSpacing: "0.48em" }}>
            UMA HOMENAGEM
          </div>
          <h1
            className="mlv-hero-title mt-5"
            style={{
              ...SERIF,
              fontStyle: "italic",
              color: "#fff",
              fontWeight: 500,
              fontSize: "clamp(48px, 9vw, 96px)",
              lineHeight: 1.02,
              letterSpacing: "-0.01em",
              textShadow: "0 4px 30px rgba(0,0,0,.5)",
            }}
          >
            {memory.father_name}
          </h1>
          <p
            className="mlv-hero-sub mt-6 max-w-md"
            style={{ ...SANS, color: "rgba(246,240,231,.82)", fontSize: 14, letterSpacing: "0.06em", lineHeight: 1.7 }}
          >
            Um filme de memórias — para guardar, reviver e nunca esquecer.
          </p>

          <button
            onClick={scrollNext}
            aria-label="Começar a jornada"
            className="mlv-hero-arrow mt-14"
            style={{ color: "rgba(255,255,255,.85)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M6 13l6 6 6-6" />
            </svg>
          </button>
        </div>
      </section>

      {/* ============================================================
          2 · CARTA EMOCIONAL
          ============================================================ */}
      <section id="mlv-carta" className="relative">
        <Reveal variant="blur">
          <LuxuryLetter message={memory.message} senderName={memory.sender_name} />
        </Reveal>
      </section>

      {/* ============================================================
          3 · MÚSICA COMO EXPERIÊNCIA
          ============================================================ */}
      {trackPreview && (
        <section className="relative py-24 sm:py-32 px-6" style={{ background: INK }}>
          <Reveal variant="up" className="mb-14 text-center">
            <div className="mlv-eyebrow">A TRILHA DESSE AMOR</div>
            <h2 className="mt-4" style={{ ...SERIF, fontStyle: "italic", color: "#fff", fontSize: "clamp(32px, 5vw, 46px)" }}>
              Uma canção para lembrar
            </h2>
          </Reveal>
          <Reveal variant="scale" delay={120}>
            <MusicExperience
              title={memory.music_title ?? "Trilha"}
              artist={memory.music_artist ?? ""}
              cover={memory.music_cover ?? ""}
              src={trackPreview}
            />
          </Reveal>
        </section>
      )}

      {/* ============================================================
          4 · MEMÓRIAS VIVAS
          ============================================================ */}
      {gallery.length > 0 && (
        <section className="relative py-24 sm:py-32 px-5 sm:px-10" style={{ background: CREAM }}>
          <Reveal variant="up" className="text-center mb-16 sm:mb-20">
            <div className="mlv-eyebrow">MOMENTOS ETERNIZADOS</div>
            <h2 className="mt-4" style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(32px, 5vw, 48px)", color: INK }}>
              As memórias que ficam
            </h2>
          </Reveal>

          <div className="max-w-[1100px] mx-auto flex flex-col gap-8 sm:gap-14">
            {blocks.map((b, i) => {
              const globalIndex = blocks.slice(0, i).reduce((n, x) => n + x.items.length, 0);
              if (b.kind === "hero") {
                return (
                  <Reveal key={i} variant="blur">
                    <CinePhoto url={b.items[0]} aspect="aspect-[4/5] sm:aspect-[16/10]" onClick={() => setLightbox(globalIndex)} radius={10} />
                  </Reveal>
                );
              }
              if (b.kind === "wide") {
                return (
                  <Reveal key={i} variant="scale">
                    <CinePhoto url={b.items[0]} aspect="aspect-[16/9]" onClick={() => setLightbox(globalIndex)} radius={10} />
                  </Reveal>
                );
              }
              if (b.kind === "duo") {
                return (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    {b.items.map((u, j) => (
                      <Reveal key={j} variant="up" delay={j * 120}>
                        <CinePhoto url={u} aspect="aspect-[4/5]" onClick={() => setLightbox(globalIndex + j)} radius={8} />
                      </Reveal>
                    ))}
                  </div>
                );
              }
              // trio
              return (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                  {b.items.map((u, j) => (
                    <Reveal key={j} variant="up" delay={j * 120}>
                      <CinePhoto url={u} aspect="aspect-[3/4]" onClick={() => setLightbox(globalIndex + j)} radius={8} />
                    </Reveal>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================
          6 · ENCERRAMENTO
          ============================================================ */}
      <Ending />

      {/* ============================================================
          5 · LIGHTBOX
          ============================================================ */}
      {lightbox !== null && gallery[lightbox] && (
        <div
          className="mlv-lb"
          onClick={() => setLightbox(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="dialog"
          aria-modal="true"
        >
          <img key={lightbox} src={gallery[lightbox]} alt="" className="mlv-lb-img" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            aria-label="Fechar"
            className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,.06)", backdropFilter: "blur(8px)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18"/>
            </svg>
          </button>
          {lightbox > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
              aria-label="Anterior"
              className="hidden sm:flex absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full items-center justify-center text-white/80 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,.06)", backdropFilter: "blur(8px)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M15 6l-6 6 6 6"/></svg>
            </button>
          )}
          {lightbox < gallery.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
              aria-label="Próxima"
              className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full items-center justify-center text-white/80 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,.06)", backdropFilter: "blur(8px)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 6l6 6-6 6"/></svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
