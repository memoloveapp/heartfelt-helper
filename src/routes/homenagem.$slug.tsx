import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";

/* ============================================================
   MemoLove — /homenagem/$slug
   Experiência cinematográfica em cenas.
   ============================================================ */

const SERIF = {
  fontFamily:
    '"Playfair Display", "Cormorant Garamond", "Fraunces", Georgia, serif',
} as const;
const SANS = {
  fontFamily: '"Manrope", "Inter", system-ui, -apple-system, sans-serif',
} as const;

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

/* ---------------- Route ---------------- */
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
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Manrope:wght@300;400;500;600&family=Inter:wght@300;400;500&display=swap",
      },
    ],
  }),
  component: HomenagemPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-[#F5EFE6] text-[#1a1210] p-8 text-center">
      <div>
        <h1 className="text-2xl mb-2" style={SERIF}>Ops…</h1>
        <p className="text-sm opacity-70">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#F5EFE6] text-[#1a1210] p-8 text-center">
      <p style={SERIF}>Memória não encontrada.</p>
    </div>
  ),
  ssr: false,
});

/* ---------------- Reveal on scroll (com fallback) ---------------- */
function useReveal<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fallback = window.setTimeout(() => el.classList.add("is-in"), 1600);
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

/* ---------------- Music (Apple-Music inspired) ---------------- */
function MusicCard({ title, artist, cover, src }: { title: string; artist: string; cover: string; src: string }) {
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
      a.pause();
      a.currentTime = 0;
    };
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else {
      stopAllAudio();
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [playing]);

  const fmt = (t: number) => {
    if (!isFinite(t) || t <= 0) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="w-full max-w-[380px] mx-auto">
      <div
        className="relative aspect-square w-full overflow-hidden shadow-[0_40px_90px_-30px_rgba(60,25,20,0.45),0_10px_30px_-15px_rgba(60,25,20,0.2)]"
        style={{ borderRadius: "6px" }}
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            className={`w-full h-full object-cover transition-transform duration-[8000ms] ease-out ${playing ? "scale-[1.08]" : "scale-100"}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#E8D6C5] to-[#B08B72] flex items-center justify-center text-7xl text-white/70">♪</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>

      <div className="mt-8 flex items-center gap-5">
        <div className="flex-1 min-w-0">
          <div className="truncate text-[18px] leading-tight text-[#1a1210]" style={SERIF}>{title}</div>
          {artist && <div className="truncate text-[13px] text-[#7a6a5f] mt-1.5 tracking-wide">{artist}</div>}
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pausar" : "Tocar"}
          className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_18px_35px_-10px_rgba(122,60,45,0.55)] hover:scale-[1.05] active:scale-[0.96] transition-transform"
          style={{ background: "linear-gradient(135deg, #C98E6A 0%, #7a3c2d 100%)" }}
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
      </div>

      <div className="mt-6">
        <div className="h-[2px] w-full rounded-full bg-[#E8DFD3] overflow-hidden">
          <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #C98E6A, #7a3c2d)" }} />
        </div>
        <div className="mt-3 flex justify-between text-[10px] tracking-[0.28em] uppercase text-[#8a7a6f]">
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}

/* ---------------- Scene wrappers ---------------- */
function Scene({
  children,
  bg = "#F5EFE6",
  className = "",
}: {
  children: React.ReactNode;
  bg?: string;
  className?: string;
}) {
  const ref = useReveal<HTMLElement>(0.15);
  return (
    <section
      ref={ref}
      className={`ml-in relative w-full flex items-center justify-center px-6 py-24 ${className}`}
      style={{ minHeight: "100svh", background: bg }}
    >
      {children}
    </section>
  );
}

/* ---------------- Photo scene: uma foto por tela ---------------- */
function PhotoScene({ url, index, total }: { url: string; index: number; total: number }) {
  const ref = useReveal<HTMLElement>(0.2);
  return (
    <section
      ref={ref}
      className="ml-in relative w-full flex items-center justify-center bg-[#0b0705] overflow-hidden"
      style={{ minHeight: "100svh" }}
    >
      {url && (
        <img
          src={url}
          alt=""
          loading={index < 2 ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover ml-photo-fade"
          onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <div className="text-[10px] tracking-[0.55em] uppercase text-white/70">
          {String(index + 1).padStart(2, "0")} <span className="opacity-40 mx-2">/</span> {String(total).padStart(2, "0")}
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

  useEffect(() => { stopAllAudio(); return () => stopAllAudio(); }, []);

  // Failsafe: garante visibilidade de tudo depois da montagem.
  useEffect(() => {
    const t = window.setTimeout(() => {
      document.querySelectorAll(".ml-in").forEach((el) => el.classList.add("is-in"));
    }, 1800);
    return () => window.clearTimeout(t);
  }, []);

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

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] flex items-center justify-center" style={SANS}>
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#8a7a6f] animate-pulse">Carregando</div>
      </div>
    );
  }

  if (err || !memory) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] text-[#1a1210] flex items-center justify-center" style={SANS}>
        <div className="max-w-xl mx-auto text-center p-8">
          <h1 className="text-2xl mb-2" style={SERIF}>Memória não encontrada</h1>
          <p className="text-sm opacity-70">{err}</p>
        </div>
      </div>
    );
  }

  const trackPreview = memory.music_preview_url;
  const hero = photos[0];
  const scenes = photos.slice(1).filter(Boolean);

  const scrollNext = () => {
    const el = document.getElementById("scene-2");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#F5EFE6] text-[#1a1210] antialiased" style={SANS}>
      {/* ============================================================
          CENA 1 — Abertura silenciosa
          ============================================================ */}
      <section className="relative w-full bg-[#0b0705] overflow-hidden" style={{ minHeight: "100svh" }}>
        {hero && (
          <img
            src={hero}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover ml-hero-fade ml-kenburns"
            onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,7,5,0.45) 0%, rgba(11,7,5,0.25) 40%, rgba(11,7,5,0.55) 75%, rgba(11,7,5,0.85) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(120% 90% at 50% 40%, transparent 45%, rgba(0,0,0,0.55) 100%)" }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center text-center text-white px-6" style={{ minHeight: "100svh" }}>
          <div className="ml-rise text-4xl sm:text-5xl mb-10 select-none" aria-hidden style={{ animationDelay: "400ms" }}>❤</div>
          <p
            className="ml-rise text-white/95 max-w-[22ch] mx-auto"
            style={{
              ...SERIF,
              fontSize: "clamp(1.3rem, 3.6vw, 1.9rem)",
              fontWeight: 300,
              letterSpacing: "0.01em",
              lineHeight: 1.4,
              animationDelay: "900ms",
            }}
          >
            Você recebeu uma memória.
          </p>

          <button
            type="button"
            onClick={scrollNext}
            aria-label="Continuar"
            className="ml-rise absolute bottom-14 inset-x-0 flex flex-col items-center gap-3 text-white/70 hover:text-white transition-colors"
            style={{ animationDelay: "1800ms" }}
          >
            <span className="text-[10px] tracking-[0.45em] uppercase">Continuar</span>
            <svg width="14" height="22" viewBox="0 0 14 22" fill="none" stroke="currentColor" strokeWidth="1.2" className="ml-scroll-hint">
              <path d="M7 3v14 M2 13l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </section>

      {/* ============================================================
          CENA 2 — Dedicatória
          ============================================================ */}
      <Scene bg="#F5EFE6" className="!py-32">
        <div id="scene-2" className="max-w-[820px] w-full text-center">
          <div
            className="text-[10px] tracking-[0.55em] uppercase text-[#8a5a45] mb-10"
            style={SANS}
          >
            Para
          </div>
          <h1
            className="font-light leading-[0.98] tracking-[-0.03em] text-[#1a1210] break-words"
            style={{ ...SERIF, fontSize: "clamp(3.2rem, 14vw, 8rem)", fontWeight: 300 }}
          >
            {memory.father_name}
          </h1>
        </div>
      </Scene>

      {/* ============================================================
          CENA 3 — Carta (folha elegante, sem card)
          ============================================================ */}
      <Scene bg="#F8F2E9" className="!py-32">
        <div className="max-w-[680px] w-full">
          <div className="text-center mb-16">
            <div className="text-[10px] tracking-[0.5em] uppercase text-[#8a5a45]" style={SANS}>
              Uma carta
            </div>
          </div>
          <p
            className="whitespace-pre-line text-[#2a1a15] break-words first-letter:text-[4.5rem] sm:first-letter:text-[5.5rem] first-letter:font-light first-letter:float-left first-letter:mr-4 first-letter:mt-2 first-letter:leading-[0.85] first-letter:text-[#7a3c2d]"
            style={{
              ...SERIF,
              fontSize: "clamp(1.2rem, 2.3vw, 1.45rem)",
              fontWeight: 400,
              lineHeight: 1.95,
              letterSpacing: "0.005em",
            }}
          >
            {memory.message}
          </p>
          {memory.sender_name && (
            <div className="mt-16 flex items-center justify-end gap-4">
              <span className="w-12 h-px bg-[#7a3c2d]/40" />
              <span
                className="text-[#7a3c2d]"
                style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(1.1rem, 2.2vw, 1.35rem)", fontWeight: 400 }}
              >
                {memory.sender_name}
              </span>
            </div>
          )}
        </div>
      </Scene>

      {/* ============================================================
          CENA 4 — Música
          ============================================================ */}
      {trackPreview && (
        <Scene bg="#F1E9DB">
          <div className="w-full flex flex-col items-center">
            <div className="text-[10px] tracking-[0.5em] uppercase text-[#8a5a45] mb-14" style={SANS}>
              A canção
            </div>
            <MusicCard
              title={memory.music_title ?? "Trilha sonora"}
              artist={memory.music_artist ?? ""}
              cover={memory.music_cover ?? ""}
              src={trackPreview}
            />
          </div>
        </Scene>
      )}

      {/* ============================================================
          CENAS 5+ — Cada foto, um capítulo
          ============================================================ */}
      {scenes.length > 0 && (
        <Scene bg="#F5EFE6" className="!py-24 !min-h-[60svh]">
          <div className="text-center">
            <div className="text-[10px] tracking-[0.5em] uppercase text-[#8a5a45] mb-6" style={SANS}>
              Memórias
            </div>
            <p
              className="text-[#1a1210]/80"
              style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(1.2rem, 3vw, 1.6rem)", fontWeight: 300 }}
            >
              Instantes que ficam.
            </p>
          </div>
        </Scene>
      )}

      {scenes.map((url, i) => (
        <PhotoScene key={i} url={url} index={i} total={scenes.length} />
      ))}

      {/* ============================================================
          CENA FINAL — Créditos em cascata
          ============================================================ */}
      <FinalScene />
    </div>
  );
}

/* ---------------- Final scene ---------------- */
function FinalScene() {
  const l1 = useReveal<HTMLParagraphElement>(0.5);
  const l2 = useReveal<HTMLParagraphElement>(0.5);
  const l3 = useReveal<HTMLParagraphElement>(0.5);
  const l4 = useReveal<HTMLParagraphElement>(0.5);
  const l5 = useReveal<HTMLDivElement>(0.5);

  return (
    <section
      className="relative w-full px-6 py-32 sm:py-48"
      style={{ background: "#FBF7EF", minHeight: "100svh" }}
    >
      <div className="max-w-[680px] mx-auto text-center flex flex-col items-center gap-24 sm:gap-32">
        <p
          ref={l1}
          className="ml-in text-[#1a1210]"
          style={{ ...SERIF, fontSize: "clamp(1.6rem, 5vw, 2.6rem)", fontWeight: 300, lineHeight: 1.3, transitionDelay: "150ms" }}
        >
          Os momentos passam.
        </p>
        <p
          ref={l2}
          className="ml-in text-[#7a3c2d]"
          style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(1.9rem, 6vw, 3rem)", fontWeight: 300, lineHeight: 1.3, transitionDelay: "300ms" }}
        >
          O amor permanece.
        </p>
        <p
          ref={l3}
          className="ml-in text-[#1a1210]/85"
          style={{ ...SERIF, fontSize: "clamp(1.2rem, 3.4vw, 1.7rem)", fontWeight: 300, lineHeight: 1.45, transitionDelay: "300ms" }}
        >
          Obrigado por fazer parte desta história.
        </p>
        <p
          ref={l4}
          className="ml-in text-[#1a1210]/70"
          style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(1rem, 3vw, 1.4rem)", fontWeight: 300, transitionDelay: "300ms" }}
        >
          Até a próxima memória.
        </p>
        <div ref={l5} className="ml-in pt-8" style={{ transitionDelay: "400ms" }}>
          <div className="mx-auto w-8 h-px bg-[#7a3c2d]/30 mb-5" />
          <div className="text-[9px] tracking-[0.5em] uppercase text-[#8a5a45]/70" style={SANS}>
            Criado com <span className="text-[#C98E6A]">❤</span> no MemoLove
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mlShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .ml-skeleton { background: linear-gradient(90deg, #EFE4D4 0%, #F6EEDF 50%, #EFE4D4 100%); background-size: 200% 100%; animation: mlShimmer 1.8s ease-in-out infinite; }

        .ml-photo-fade { opacity: 0; transition: opacity 1400ms cubic-bezier(0.22,1,0.36,1); }
        .ml-photo-fade.is-loaded { opacity: 1; }

        @keyframes mlKen { 0% { transform: scale(1.02); } 100% { transform: scale(1.14); } }
        .ml-hero-fade { opacity: 0; transition: opacity 1400ms cubic-bezier(0.22,1,0.36,1); }
        .ml-hero-fade.is-loaded { opacity: 1; }
        .ml-kenburns { animation: mlKen 26s ease-out both; transform-origin: center; }

        @keyframes mlRise { 0% { opacity: 0; transform: translateY(20px); filter: blur(4px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0); } }
        .ml-rise { opacity: 0; animation: mlRise 1400ms cubic-bezier(0.22, 1, 0.36, 1) both; }

        .ml-in { opacity: 0; transform: translateY(24px); transition: opacity 1400ms cubic-bezier(0.22,1,0.36,1), transform 1400ms cubic-bezier(0.22,1,0.36,1); }
        .ml-in.is-in { opacity: 1; transform: translateY(0); }

        @keyframes mlScrollHint { 0%,100% { transform: translateY(0); opacity: 0.85; } 50% { transform: translateY(3px); opacity: 0.35; } }
        .ml-scroll-hint { animation: mlScrollHint 2s ease-in-out infinite; transform-origin: center; }

        @media (prefers-reduced-motion: reduce) {
          .ml-kenburns, .ml-rise, .ml-skeleton, .ml-scroll-hint { animation: none; }
          .ml-hero-fade, .ml-photo-fade, .ml-in { transition: none; opacity: 1; transform: none; filter: none; }
        }
      `}</style>
    </section>
  );
}
