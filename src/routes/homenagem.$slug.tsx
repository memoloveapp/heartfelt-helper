import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";

/* ============================================================
   MemoLove — /homenagem/$slug
   Redesign premium: Hero · Carta · Música · Álbum · Encerramento
   Fotos nunca cortadas (object-contain + fundo desfocado)
   ============================================================ */

const SERIF = { fontFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif' } as const;
const SANS = { fontFamily: '"Inter", system-ui, -apple-system, sans-serif' } as const;

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
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  component: HomenagemPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F2EA] text-[#1a1210] p-8 text-center">
      <div>
        <h1 className="text-2xl mb-2" style={SERIF}>Ops…</h1>
        <p className="text-sm opacity-70">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F2EA] text-[#1a1210] p-8 text-center">
      <p style={SERIF}>Memória não encontrada.</p>
    </div>
  ),
  ssr: false,
});

/* ---------------- Reveal com fallback ---------------- */
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

/* ---------------- Foto Premium (object-contain + fundo desfocado) ---------------- */
function PremiumPhoto({
  url,
  aspect = "aspect-[4/3]",
  eager = false,
  onClick,
  radius = 6,
}: {
  url: string;
  aspect?: string;
  eager?: boolean;
  onClick?: () => void;
  radius?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full ${aspect} overflow-hidden bg-[#1a1210] focus:outline-none focus:ring-2 focus:ring-[#7a3c2d]/50 focus:ring-offset-4 focus:ring-offset-[#F7F2EA]`}
      style={{
        borderRadius: `${radius}px`,
        boxShadow: "0 40px 90px -40px rgba(60,25,20,0.55), 0 14px 30px -18px rgba(60,25,20,0.2)",
      }}
      aria-label="Ampliar foto"
    >
      {url && (
        <>
          {/* Fundo desfocado — mesma imagem, como Apple/Google Photos */}
          <img
            src={url}
            alt=""
            aria-hidden
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover scale-125"
            style={{ filter: "blur(38px) brightness(0.55) saturate(1.05)" }}
          />
          <div className="absolute inset-0 bg-black/25" />
          {/* Foto real — inteira, nunca cortada */}
          <img
            src={url}
            alt=""
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            decoding="async"
            className="ml-photo relative w-full h-full object-contain transition-transform duration-[1600ms] ease-out group-hover:scale-[1.025]"
            onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
          />
        </>
      )}
    </button>
  );
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
      </div>

      <div className="mt-8 flex items-center gap-5">
        <div className="flex-1 min-w-0">
          <div className="truncate text-[18px] leading-tight text-[#1a1210]" style={SERIF}>{title}</div>
          {artist && <div className="truncate text-[12px] text-[#7a6a5f] mt-1.5 tracking-[0.08em]" style={SANS}>{artist}</div>}
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
        <div className="mt-3 flex justify-between text-[10px] tracking-[0.28em] uppercase text-[#8a7a6f]" style={SANS}>
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}

/* ---------------- Álbum: blocos alternando tamanho ---------------- */
type AlbumBlock =
  | { kind: "single"; urls: [string]; indices: [number]; size: "hero" | "wide" }
  | { kind: "pair"; urls: [string, string]; indices: [number, number] };

function buildAlbum(urls: string[]): AlbumBlock[] {
  // Sequência: enorme → par → enorme wide → par → enorme → par ...
  const blocks: AlbumBlock[] = [];
  let i = 0;
  let step = 0;
  const sequence: ("hero" | "pair" | "wide")[] = ["hero", "pair", "wide", "pair", "hero", "pair"];
  while (i < urls.length) {
    const kind = sequence[step % sequence.length];
    if (kind === "pair") {
      if (i + 1 < urls.length) {
        blocks.push({ kind: "pair", urls: [urls[i], urls[i + 1]], indices: [i, i + 1] });
        i += 2;
      } else {
        blocks.push({ kind: "single", urls: [urls[i]], indices: [i], size: "hero" });
        i += 1;
      }
    } else {
      blocks.push({ kind: "single", urls: [urls[i]], indices: [i], size: kind });
      i += 1;
    }
    step += 1;
  }
  return blocks;
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
  const album = buildAlbum(gallery);

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
      <div className="min-h-screen bg-[#F7F2EA] flex items-center justify-center" style={SANS}>
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#8a7a6f] animate-pulse">Carregando</div>
      </div>
    );
  }

  if (err || !memory) {
    return (
      <div className="min-h-screen bg-[#F7F2EA] text-[#1a1210] flex items-center justify-center" style={SANS}>
        <div className="max-w-xl mx-auto text-center p-8">
          <h1 className="text-2xl mb-2" style={SERIF}>Memória não encontrada</h1>
          <p className="text-sm opacity-70">{err}</p>
        </div>
      </div>
    );
  }

  const trackPreview = memory.music_preview_url;
  const hero = photos[0];

  const scrollNext = () => {
    const el = document.getElementById("section-carta");
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

  return (
    <div className="min-h-screen bg-[#F7F2EA] text-[#1a1210] antialiased" style={SANS}>
      {/* ============================================================
          1 · HERO — cinematográfico
          ============================================================ */}
      <section className="relative w-full bg-[#0b0705] overflow-hidden" style={{ height: "100svh" }}>
        {hero && (
          <div className="absolute inset-0 ml-hero-stage">
            {/* Fundo desfocado — evita cortar rosto quando a foto é vertical */}
            <img
              src={hero}
              alt=""
              aria-hidden
              loading="eager"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover scale-125"
              style={{ filter: "blur(46px) brightness(0.45) saturate(1.1)" }}
            />
            {/* Foto principal — cobre a tela mas com object-position priorizando o topo (rostos) */}
            <img
              src={hero}
              alt=""
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover ml-hero-fade ml-hero-zoom"
              style={{ objectPosition: "50% 30%" }}
              onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
            />
          </div>
        )}

        {/* Overlay pôster: 15% topo · 0% centro · 70% rodapé */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,7,5,0.15) 0%, rgba(11,7,5,0) 35%, rgba(11,7,5,0) 55%, rgba(11,7,5,0.70) 100%)",
          }}
        />

        {/* Texto — canto inferior esquerdo, ~75% da tela */}
        <div className="absolute inset-x-0 z-10 px-8 sm:px-16" style={{ top: "72%" }}>
          <div className="max-w-[640px]">
            <div
              className="ml-rise text-[22px] leading-none mb-5"
              style={{ animationDelay: "300ms" }}
              aria-hidden
            >
              ❤️
            </div>
            <div
              className="ml-rise text-white/90 mb-4"
              style={{
                ...SANS,
                animationDelay: "500ms",
                fontSize: "12px",
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Para o melhor pai
            </div>
            <h1
              className="ml-rise text-white leading-[1] tracking-[-0.02em]"
              style={{
                ...SERIF,
                fontSize: "clamp(52px, 8vw, 68px)",
                fontWeight: 700,
                animationDelay: "700ms",
                textShadow: "0 4px 40px rgba(0,0,0,0.45)",
              }}
            >
              {memory.father_name}
            </h1>
            {memory.sender_name && (
              <p
                className="ml-rise mt-5 text-white/80"
                style={{
                  ...SANS,
                  fontSize: "18px",
                  fontWeight: 400,
                  animationDelay: "950ms",
                }}
              >
                com carinho, {memory.sender_name}
              </p>
            )}
          </div>
        </div>

        {/* Seta minimalista centralizada */}
        <button
          type="button"
          onClick={scrollNext}
          className="ml-rise absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/70 hover:text-white transition-colors"
          style={{ animationDelay: "1400ms" }}
          aria-label="Rolar"
        >
          <svg width="14" height="22" viewBox="0 0 14 22" fill="none" stroke="currentColor" strokeWidth="1" className="ml-arrow-blink">
            <path d="M7 3v14 M2 13l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>

      {/* ============================================================
          2 · CARTA — folha elegante, sem cards
          ============================================================ */}
      <section id="section-carta" className="relative w-full px-6 py-32 sm:py-48" style={{ background: "#F7F2EA" }}>
        <Reveal className="max-w-[700px] mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <div className="text-[10px] tracking-[0.5em] uppercase text-[#8a5a45]">Uma carta</div>
            <div className="mx-auto mt-6 w-8 h-px bg-[#8a5a45]/40" />
          </div>

          <p
            className="whitespace-pre-line text-[#2a1a15] break-words first-letter:text-[4.5rem] sm:first-letter:text-[5.5rem] first-letter:font-light first-letter:float-left first-letter:mr-4 first-letter:mt-2 first-letter:leading-[0.85] first-letter:text-[#7a3c2d]"
            style={{ ...SERIF, fontSize: "clamp(1.2rem, 2.3vw, 1.4rem)", fontWeight: 400, lineHeight: 1.95, letterSpacing: "0.005em" }}
          >
            {memory.message}
          </p>

          {memory.sender_name && (
            <div className="mt-16 flex items-center justify-end gap-4">
              <span className="w-12 h-px bg-[#7a3c2d]/40" />
              <span className="text-[#7a3c2d]" style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(1.1rem, 2.2vw, 1.3rem)", fontWeight: 400 }}>
                {memory.sender_name}
              </span>
            </div>
          )}
        </Reveal>
      </section>

      {/* ============================================================
          3 · MÚSICA
          ============================================================ */}
      {trackPreview && (
        <section
          className="relative w-full px-6 py-32 sm:py-40 flex items-center justify-center"
          style={{ background: "linear-gradient(180deg, #F7F2EA 0%, #EFE6D5 100%)" }}
        >
          <Reveal className="w-full flex flex-col items-center">
            <div className="text-[10px] tracking-[0.5em] uppercase text-[#8a5a45] mb-3">A canção</div>
            <div className="w-8 h-px bg-[#8a5a45]/40 mb-14" />
            <MusicCard
              title={memory.music_title ?? "Trilha sonora"}
              artist={memory.music_artist ?? ""}
              cover={memory.music_cover ?? ""}
              src={trackPreview}
            />
          </Reveal>
        </section>
      )}

      {/* ============================================================
          4 · ÁLBUM — blocos grandes, fotos inteiras
          ============================================================ */}
      {album.length > 0 && (
        <section className="relative w-full px-6 sm:px-10 py-32 sm:py-40" style={{ background: "#F7F2EA" }}>
          <Reveal className="max-w-[1180px] mx-auto">
            <div className="text-center mb-24 sm:mb-32">
              <div className="text-[10px] tracking-[0.5em] uppercase text-[#8a5a45]">Álbum</div>
              <div className="mx-auto mt-6 w-8 h-px bg-[#8a5a45]/40" />
              <h2
                className="mt-8 text-[#1a1210]"
                style={{ ...SERIF, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 300, letterSpacing: "-0.02em" }}
              >
                Instantes que ficam
              </h2>
            </div>

            <div className="flex flex-col gap-20 sm:gap-28">
              {album.map((block, bi) => {
                if (block.kind === "single") {
                  const [url] = block.urls;
                  const [idx] = block.indices;
                  const aspect = block.size === "wide" ? "aspect-[16/9]" : "aspect-[4/5] sm:aspect-[3/2]";
                  return (
                    <Reveal key={bi} className="w-full">
                      <PremiumPhoto
                        url={url}
                        aspect={aspect}
                        eager={idx < 2}
                        onClick={() => setLightbox(idx)}
                      />
                    </Reveal>
                  );
                }
                // pair — duas fotos lado a lado
                return (
                  <div key={bi} className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
                    <Reveal delay={0}>
                      <PremiumPhoto url={block.urls[0]} aspect="aspect-[4/5]" onClick={() => setLightbox(block.indices[0])} />
                    </Reveal>
                    <Reveal delay={140}>
                      <PremiumPhoto url={block.urls[1]} aspect="aspect-[4/5]" onClick={() => setLightbox(block.indices[1])} />
                    </Reveal>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </section>
      )}

      {/* ============================================================
          5 · ENCERRAMENTO
          ============================================================ */}
      <FinalScene />

      {/* ============================================================
          LIGHTBOX — foto inteira, fundo desfocado
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
            src={gallery[lightbox]}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-125"
            style={{ filter: "blur(50px) brightness(0.35)" }}
          />
          <div className="absolute inset-0 bg-black/60" />
          <img
            src={gallery[lightbox]}
            alt=""
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
          Estilos globais das animações
          ============================================================ */}
      <style>{`
        .ml-photo { opacity: 0; transform: scale(1.015); transition: opacity 1100ms ease, transform 2000ms ease; }
        .ml-photo.is-loaded { opacity: 1; transform: scale(1); }

        .ml-hero-fade { opacity: 0; transition: opacity 1600ms cubic-bezier(0.22,1,0.36,1); }
        .ml-hero-fade.is-loaded { opacity: 1; }

        @keyframes mlHeroZoom { 0% { transform: scale(1); } 100% { transform: scale(1.03); } }
        .ml-hero-zoom { transform-origin: center; animation: mlHeroZoom 12000ms ease-out both; }

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

        @keyframes mlScrollHint { 0%,100% { transform: translateY(0); opacity: 0.85; } 50% { transform: translateY(3px); opacity: 0.35; } }
        .ml-scroll-hint { animation: mlScrollHint 2s ease-in-out infinite; transform-origin: center; }

        @media (prefers-reduced-motion: reduce) {
          .ml-rise, .ml-zoom-in, .ml-scroll-hint, .ml-photo { animation: none; transition: none; opacity: 1; transform: none; }
          .ml-hero-fade, .ml-in { transition: none; opacity: 1; transform: none; filter: none; }
        }
      `}</style>
    </div>
  );
}

/* ---------------- Final — sem cards, sem caixas ---------------- */
function FinalScene() {
  const l1 = useReveal<HTMLParagraphElement>(0.4);
  const l2 = useReveal<HTMLParagraphElement>(0.4);
  const l3 = useReveal<HTMLParagraphElement>(0.4);
  const l4 = useReveal<HTMLDivElement>(0.4);
  const l5 = useReveal<HTMLParagraphElement>(0.4);
  const l6 = useReveal<HTMLDivElement>(0.4);

  return (
    <section
      className="relative w-full px-6 py-40 sm:py-56 flex items-center justify-center"
      style={{ background: "#FBF7EF", minHeight: "100svh" }}
    >
      <div className="max-w-[680px] w-full mx-auto text-center flex flex-col items-center gap-24 sm:gap-32">
        <p
          ref={l1}
          className="ml-in text-[#1a1210]"
          style={{ ...SERIF, fontSize: "clamp(1.6rem, 4.5vw, 2.4rem)", fontWeight: 300, lineHeight: 1.3 }}
        >
          Os momentos passam.
        </p>
        <p
          ref={l2}
          className="ml-in text-[#7a3c2d]"
          style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(1.9rem, 5.5vw, 2.8rem)", fontWeight: 300, lineHeight: 1.3, transitionDelay: "200ms" }}
        >
          O amor permanece.
        </p>
        <p
          ref={l3}
          className="ml-in text-[#1a1210]/85"
          style={{ ...SERIF, fontSize: "clamp(1.15rem, 3.2vw, 1.55rem)", fontWeight: 300, lineHeight: 1.45, transitionDelay: "200ms" }}
        >
          Obrigado por fazer parte desta história.
        </p>
        <div ref={l4} className="ml-in text-3xl text-[#7a3c2d]/80 select-none" aria-hidden style={{ transitionDelay: "200ms" }}>❤</div>
        <p
          ref={l5}
          className="ml-in text-[#1a1210]/70"
          style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(1rem, 3vw, 1.35rem)", fontWeight: 300, transitionDelay: "200ms" }}
        >
          Até a próxima memória.
        </p>
        <div ref={l6} className="ml-in pt-6" style={{ transitionDelay: "300ms" }}>
          <div className="text-[9px] tracking-[0.5em] uppercase text-[#8a5a45]/60" style={SANS}>
            Criado com <span className="text-[#C98E6A]">❤</span> no MemoLove
          </div>
        </div>
      </div>
    </section>
  );
}
