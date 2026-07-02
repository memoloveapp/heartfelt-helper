import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";

/* ============================================================
   MemoLove — /homenagem/$slug
   Design fiel à referência oficial (mockup aprovado)
   Paleta: #0D0D0D · #C8A47E · #F7EDE3 · #FFFFFF · #F2F2F2
   Tipografia: Inter (destaques/body) + Playfair Display Italic (assinatura)
   ============================================================ */

const SERIF = { fontFamily: '"Playfair Display", Georgia, serif' } as const;
const SANS = { fontFamily: '"Inter", system-ui, -apple-system, sans-serif' } as const;

const GOLD = "#C8A47E";
const CREAM = "#F7EDE3";
const INK = "#0D0D0D";

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
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap",
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

/* ---------------- Logo MemoLove ---------------- */
function Logo({ light = false }: { light?: boolean }) {
  const color = light ? "#FFFFFF" : INK;
  return (
    <div className="inline-flex items-center gap-2" style={{ color }}>
      <svg width="16" height="15" viewBox="0 0 24 22" fill="none">
        <path
          d="M12 20s-8-4.6-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6.4-8 11-8 11z"
          stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"
        />
      </svg>
      <span style={{ ...SANS, fontWeight: 600, fontSize: 13, letterSpacing: "0.22em" }}>
        MEMOL<span style={{ color: light ? "#FFFFFF" : INK }}>♥</span>VE
      </span>
    </div>
  );
}

/* ---------------- Reveal ---------------- */
function useReveal<T extends HTMLElement>(threshold = 0.15) {
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
      { threshold, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => { io.disconnect(); window.clearTimeout(fallback); };
  }, [threshold]);
  return ref;
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useReveal<HTMLDivElement>(0.12);
  return (
    <div ref={ref} className={`ml-in ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ---------------- Section label (small caps + heart) ---------------- */
function SectionLabel({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "light" }) {
  const color = tone === "dark" ? GOLD : GOLD;
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        style={{ ...SANS, color, fontSize: 10, letterSpacing: "0.42em", fontWeight: 500 }}
        className="uppercase"
      >
        {children}
      </span>
      <span style={{ color }} className="text-[11px]">♥</span>
    </div>
  );
}

/* ---------------- Photo (contain + blurred backdrop) ---------------- */
function Photo({
  url, aspect = "aspect-[4/3]", eager = false, onClick, radius = 10,
}: {
  url: string; aspect?: string; eager?: boolean; onClick?: () => void; radius?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full ${aspect} overflow-hidden bg-[#1a1210] focus:outline-none focus:ring-2 focus:ring-[${GOLD}]/60`}
      style={{ borderRadius: radius }}
      aria-label="Ampliar foto"
    >
      {url && (
        <>
          <img
            src={url} alt="" aria-hidden
            loading={eager ? "eager" : "lazy"} decoding="async"
            className="absolute inset-0 w-full h-full object-cover scale-125"
            style={{ filter: "blur(38px) brightness(0.55) saturate(1.05)" }}
          />
          <div className="absolute inset-0 bg-black/20" />
          <img
            src={url} alt=""
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            decoding="async"
            className="ml-photo relative w-full h-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.03]"
            onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
          />
        </>
      )}
    </button>
  );
}

/* ---------------- Music (dark horizontal card — Apple Music) ---------------- */
function MusicBar({ title, artist, cover, src }: { title: string; artist: string; cover: string; src: string }) {
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
    <div
      className={`w-full max-w-[880px] mx-auto rounded-[14px] overflow-hidden transition-shadow duration-700 ${playing ? "ml-player-glow" : ""}`}
      style={{
        background: "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)",
        boxShadow: "0 40px 90px -40px rgba(0,0,0,0.7), 0 12px 30px -18px rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex items-stretch gap-4 sm:gap-6 p-4 sm:p-6">
        {/* Cover */}
        <div className="shrink-0 w-[110px] h-[110px] sm:w-[150px] sm:h-[150px] rounded-[8px] overflow-hidden bg-black/40">
          {cover ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-4xl">♪</div>
          )}
        </div>

        {/* Right block */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="min-w-0">
            <div className="truncate text-white text-[18px] sm:text-[22px]" style={{ ...SANS, fontWeight: 600 }}>
              {title}
            </div>
            {artist && (
              <div className="truncate text-white/60 text-[13px] sm:text-[15px] mt-1" style={SANS}>
                {artist}
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="mt-4 sm:mt-5">
            <div className="flex items-center gap-3 text-[10px] text-white/50 tabular-nums" style={SANS}>
              <span>{fmt(current)}</span>
              <div className="flex-1 h-[3px] rounded-full bg-white/15 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: GOLD }} />
              </div>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-3 sm:mt-4 flex items-center justify-between text-white/80">
            <button className="p-2 hover:text-white transition-colors" aria-label="Shuffle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/>
              </svg>
            </button>
            <button className="p-2 hover:text-white transition-colors" aria-label="Anterior">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM9.5 12l10-6v12z"/></svg>
            </button>
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "Pausar" : "Tocar"}
              className="w-14 h-14 rounded-full flex items-center justify-center text-black shadow-[0_10px_25px_-6px_rgba(200,164,126,0.6)] hover:scale-105 active:scale-95 transition-transform"
              style={{ background: "#FFFFFF" }}
            >
              {playing ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button className="p-2 hover:text-white transition-colors" aria-label="Próxima">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM4.5 6l10 6-10 6z"/></svg>
            </button>
            <button className="p-2 transition-colors" style={{ color: GOLD }} aria-label="Favoritar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8-4.6-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6.4-8 11-8 11z"/></svg>
            </button>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
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
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { stopAllAudio(); return () => stopAllAudio(); }, []);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: CREAM, ...SANS }}>
        <div className="text-[10px] tracking-[0.4em] uppercase animate-pulse" style={{ color: "#8a7a6f" }}>Carregando</div>
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

  const trackPreview = memory.music_preview_url;
  const hero = photos[0];
  const paraQuem = memory.occasion?.toLowerCase().includes("mãe") ? "PARA A MELHOR MÃE" : "PARA O MELHOR PAI";

  const scrollNext = () => {
    const el = document.getElementById("section-carta");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Álbum: 1 grande + 2 pequenas + 1 wide + 1 pequena + 1 pequena (padrão da referência)
  const initialGallery = gallery.slice(0, 5);
  const extraGallery = gallery.slice(5);
  const layout = (list: string[]) => {
    const [a, b, c, d, e] = list;
    return { a, b, c, d, e };
  };
  const L = layout(initialGallery);

  let touchStartX = 0;
  const onTouchStart = (e: React.TouchEvent) => { touchStartX = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) setLightbox((v) => (v !== null && v < gallery.length - 1 ? v + 1 : v));
    else setLightbox((v) => (v !== null ? Math.max(0, v - 1) : v));
  };

  return (
    <div className="min-h-screen antialiased" style={{ background: CREAM, color: INK, ...SANS }}>
      {/* ============================================================
          1 · HERO
          ============================================================ */}
      <section className="relative w-full overflow-hidden" style={{ background: INK, height: "100svh" }}>
        {hero && (
          <div className="absolute inset-0">
            <img
              src={hero} alt="" aria-hidden loading="eager" decoding="async"
              className="absolute inset-0 w-full h-full object-cover scale-125"
              style={{ filter: "blur(46px) brightness(0.5)" }}
            />
            <img
              src={hero} alt="" loading="eager" fetchPriority="high" decoding="async"
              className="absolute inset-0 w-full h-full object-cover ml-hero-fade ml-hero-zoom"
              style={{ objectPosition: "50% 30%" }}
              onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
            />
          </div>
        )}

        {/* Overlay pôster */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)",
          }}
        />

        {/* Logo topo-esquerdo */}
        <div className="absolute top-6 left-6 sm:top-8 sm:left-10 z-10 ml-rise" style={{ animationDelay: "200ms" }}>
          <Logo light />
        </div>

        {/* Bloco de texto — inferior esquerdo */}
        <div className="absolute inset-x-0 z-10 px-6 sm:px-14" style={{ bottom: "10%" }}>
          <div className="max-w-[720px]">
            <div
              className="ml-rise"
              style={{
                ...SANS, color: GOLD, fontSize: 11, letterSpacing: "0.4em",
                textTransform: "uppercase", fontWeight: 500, marginBottom: 18,
                animationDelay: "400ms",
              }}
            >
              {paraQuem}
            </div>
            <h1
              className="ml-rise text-white leading-[0.98] tracking-[-0.02em]"
              style={{
                ...SERIF, fontWeight: 400,
                fontSize: "clamp(46px, 12vw, 96px)",
                animationDelay: "600ms",
                textShadow: "0 4px 40px rgba(0,0,0,0.55)",
              }}
            >
              {memory.father_name}
            </h1>
            <div
              className="ml-rise mt-6 mb-5 h-px"
              style={{ width: 72, background: GOLD, animationDelay: "800ms" }}
            />
            <p
              className="ml-rise text-white/85"
              style={{ ...SANS, fontSize: "clamp(14px, 3.4vw, 17px)", fontWeight: 300, animationDelay: "1000ms" }}
            >
              Obrigado por tudo.
            </p>
          </div>
        </div>

        {/* Seta */}
        <button
          type="button"
          onClick={scrollNext}
          className="ml-rise absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/70 hover:text-white transition-colors"
          style={{ animationDelay: "1400ms" }}
          aria-label="Rolar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="ml-arrow-blink">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>

      {/* ============================================================
          2 · CARTA
          ============================================================ */}
      <section id="section-carta" className="relative w-full px-6 py-24 sm:py-36" style={{ background: CREAM, marginTop: "-40px" }}>
        <Reveal className="max-w-[760px] mx-auto">
          <div
            className="ml-carta relative mx-auto px-6 sm:px-14 py-14 sm:py-20 rounded-[10px]"
            style={{
              background: "#FBF3E7",
              boxShadow: "0 40px 80px -40px rgba(60,40,20,0.28), 0 10px 24px -12px rgba(60,40,20,0.14)",
            }}
          >
            <div className="flex justify-center mb-10 sm:mb-12">
              <SectionLabel>CARTA PARA VOCÊ</SectionLabel>
            </div>

            <h2
              className="mb-8 sm:mb-10"
              style={{ ...SERIF, color: INK, fontSize: "clamp(2rem, 5vw, 2.6rem)", fontWeight: 400 }}
            >
              Meu pai,
            </h2>

            <div
              className="whitespace-pre-line"
              style={{ ...SANS, color: "#2a1f19", fontSize: "clamp(15px, 2.2vw, 16px)", fontWeight: 400, lineHeight: 1.9 }}
            >
              {memory.message}
            </div>

            {memory.sender_name && (
              <div className="mt-14 flex justify-start items-center gap-2">
                <span style={{ ...SERIF, fontStyle: "italic", color: GOLD, fontSize: "clamp(22px, 3.4vw, 30px)", fontWeight: 400 }}>
                  {memory.sender_name}
                </span>
                <span style={{ color: GOLD }} className="text-sm">♥</span>
              </div>
            )}
          </div>
        </Reveal>
      </section>


      {/* ============================================================
          3 · MÚSICA
          ============================================================ */}
      {trackPreview && (
        <section className="relative w-full px-4 sm:px-6 py-16 sm:py-24" style={{ background: CREAM }}>
          <Reveal>
            <MusicBar
              title={memory.music_title ?? "Trilha sonora"}
              artist={memory.music_artist ?? ""}
              cover={memory.music_cover ?? ""}
              src={trackPreview}
            />
          </Reveal>
        </section>
      )}

      {/* ============================================================
          4 · ÁLBUM — NOSSAS MEMÓRIAS
          ============================================================ */}
      {gallery.length > 0 && (
        <section className="relative w-full px-4 sm:px-8 py-20 sm:py-28" style={{ background: CREAM }}>
          <Reveal className="max-w-[1180px] mx-auto">
            <div className="flex justify-center mb-14 sm:mb-16">
              <SectionLabel>NOSSAS MEMÓRIAS</SectionLabel>
            </div>

            {/* Grid seguindo a referência: 2 colunas
                Esquerda: foto grande (row 1) + foto wide (row 3)
                Direita: 2 fotos empilhadas (rows 1-2) + 1 pequena (row 3)  */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              {L.a && (
                <Reveal className="row-span-2" delay={0}>
                  <Photo url={L.a} aspect="aspect-[3/4]" eager onClick={() => setLightbox(0)} />
                </Reveal>
              )}
              {L.b && <Reveal delay={80}><Photo url={L.b} aspect="aspect-[4/3]" eager onClick={() => setLightbox(1)} /></Reveal>}
              {L.c && <Reveal delay={160}><Photo url={L.c} aspect="aspect-[4/3]" onClick={() => setLightbox(2)} /></Reveal>}
              {L.d && <Reveal delay={240}><Photo url={L.d} aspect="aspect-[4/3]" onClick={() => setLightbox(3)} /></Reveal>}
              {L.e && <Reveal delay={320}><Photo url={L.e} aspect="aspect-[4/3]" onClick={() => setLightbox(4)} /></Reveal>}
            </div>

            {showAll && extraGallery.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:gap-6 mt-3 sm:mt-6">
                {extraGallery.map((u, i) => (
                  <Reveal key={i} delay={(i % 6) * 80}>
                    <Photo url={u} aspect="aspect-[4/3]" onClick={() => setLightbox(5 + i)} />
                  </Reveal>
                ))}
              </div>
            )}


            {/* Botão "Ver mais memórias" */}
            {extraGallery.length > 0 && !showAll && (
              <div className="mt-10 sm:mt-12 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-full transition-all hover:shadow-md"
                  style={{
                    ...SANS, background: "#FFFFFF", color: INK,
                    fontSize: 11, letterSpacing: "0.32em", fontWeight: 500,
                    textTransform: "uppercase",
                    boxShadow: "0 8px 24px -12px rgba(0,0,0,0.15)",
                    border: `1px solid ${GOLD}33`,
                  }}
                >
                  <span style={{ color: GOLD }}>❁</span>
                  Ver mais memórias
                </button>
              </div>
            )}
          </Reveal>
        </section>
      )}

      {/* ============================================================
          5 · ENCERRAMENTO — cena dark
          ============================================================ */}
      <FinalScene backdrop={hero} />

      {/* ============================================================
          LIGHTBOX
          ============================================================ */}
      {lightbox !== null && gallery[lightbox] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={gallery[lightbox]} alt="" aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-125"
            style={{ filter: "blur(50px) brightness(0.35)" }}
          />
          <div className="absolute inset-0 bg-black/60" />
          <img
            src={gallery[lightbox]} alt=""
            className="relative max-w-full max-h-full object-contain ml-zoom-in"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightbox((v) => (v !== null ? Math.max(0, v - 1) : v)); }}
              className="hidden sm:flex absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white items-center justify-center backdrop-blur-md border border-white/20"
              aria-label="Anterior"
            >‹</button>
          )}
          {lightbox < gallery.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightbox((v) => (v !== null ? Math.min(gallery.length - 1, v + 1) : v)); }}
              className="hidden sm:flex absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white items-center justify-center backdrop-blur-md border border-white/20"
              aria-label="Próxima"
            >›</button>
          )}
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center text-xl backdrop-blur-md border border-white/20"
            aria-label="Fechar"
          >×</button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 text-[10px] tracking-[0.35em] uppercase">
            {String(lightbox + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}
          </div>
        </div>
      )}

      {/* ============================================================
          Estilos globais
          ============================================================ */}
      <style>{`
        .ml-photo { opacity: 0; transform: scale(1.015); transition: opacity 1100ms ease, transform 2000ms ease; }
        .ml-photo.is-loaded { opacity: 1; transform: scale(1); }

        .ml-hero-fade { opacity: 0; transition: opacity 1600ms cubic-bezier(0.22,1,0.36,1); }
        .ml-hero-fade.is-loaded { opacity: 1; }

        @keyframes mlHeroZoom { 0% { transform: scale(1); } 100% { transform: scale(1.03); } }
        .ml-hero-zoom { transform-origin: center; animation: mlHeroZoom 15000ms ease-out both; }

        @keyframes mlArrowBlink { 0%,100% { opacity: 0.4; transform: translateY(0); } 50% { opacity: 1; transform: translateY(4px); } }
        .ml-arrow-blink { animation: mlArrowBlink 2.4s ease-in-out infinite; }

        @keyframes mlRise {
          0% { opacity: 0; transform: translateY(22px); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .ml-rise { opacity: 0; animation: mlRise 1300ms cubic-bezier(0.22, 1, 0.36, 1) both; }

        .ml-in {
          opacity: 0;
          transform: translateY(24px);
          filter: blur(8px);
          transition: opacity 700ms cubic-bezier(0.22,1,0.36,1),
                      transform 700ms cubic-bezier(0.22,1,0.36,1),
                      filter 700ms cubic-bezier(0.22,1,0.36,1);
        }
        .ml-in.is-in { opacity: 1; transform: translateY(0); filter: blur(0); }

        @keyframes mlZoomIn { 0% { transform: scale(0.96); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .ml-zoom-in { animation: mlZoomIn 420ms cubic-bezier(0.22,1,0.36,1) both; }

        @media (prefers-reduced-motion: reduce) {
          .ml-rise, .ml-zoom-in, .ml-photo { animation: none; transition: none; opacity: 1; transform: none; }
          .ml-hero-fade, .ml-in { transition: none; opacity: 1; transform: none; filter: none; }
        }
      `}</style>
    </div>
  );
}

/* ---------------- Final Scene — dark ---------------- */
function FinalScene({ backdrop }: { backdrop?: string }) {
  const ref = useReveal<HTMLDivElement>(0.2);
  return (
    <section
      className="relative w-full px-6 py-32 sm:py-44 flex items-center justify-center overflow-hidden"
      style={{ background: INK, minHeight: "80svh" }}
    >
      {backdrop && (
        <>
          <img
            src={backdrop} alt="" aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-110"
            style={{ filter: "blur(28px) brightness(0.28) saturate(0.9)" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(13,13,13,0.7) 0%, rgba(13,13,13,0.9) 100%)" }}
          />
        </>
      )}

      <div ref={ref} className="ml-in relative z-10 max-w-[620px] w-full mx-auto text-center flex flex-col items-center">
        <p
          className="text-white"
          style={{ ...SERIF, fontSize: "clamp(1.6rem, 4.5vw, 2.2rem)", fontWeight: 400, lineHeight: 1.35 }}
        >
          Os momentos passam.
        </p>
        <p
          className="mt-2"
          style={{ ...SERIF, fontStyle: "italic", color: GOLD, fontSize: "clamp(1.8rem, 5vw, 2.4rem)", fontWeight: 400, lineHeight: 1.35 }}
        >
          O amor permanece.
        </p>

        <div className="mt-8 mb-8 flex items-center gap-4">
          <span className="h-px w-16" style={{ background: `${GOLD}66` }} />
          <span style={{ color: GOLD }} className="text-sm">♥</span>
          <span className="h-px w-16" style={{ background: `${GOLD}66` }} />
        </div>

        <p
          className="text-white/85"
          style={{ ...SERIF, fontSize: "clamp(1.05rem, 3vw, 1.35rem)", fontWeight: 300, lineHeight: 1.5 }}
        >
          Obrigado por fazer parte<br />desta história.
        </p>

        <div
          className="mt-14 mb-10 grid place-items-center w-16 h-16 rounded-full"
          style={{ background: `${GOLD}22`, color: GOLD }}
          aria-hidden
        >
          <svg width="28" height="26" viewBox="0 0 24 22" fill="currentColor">
            <path d="M12 20s-8-4.6-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6.4-8 11-8 11z" />
          </svg>
        </div>

        <p
          className="text-white/70"
          style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(1rem, 3vw, 1.25rem)", fontWeight: 400 }}
        >
          Até a próxima memória.
        </p>

        <div className="mt-16">
          <Logo light />
        </div>
      </div>
    </section>
  );
}
