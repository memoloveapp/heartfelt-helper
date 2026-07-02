import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";

/* ============================================================
   MemoLove — /homenagem/$slug
   Experiência narrativa em 6 capítulos.
   ============================================================ */

const SERIF = { fontFamily: '"Fraunces", "Cormorant Garamond", Georgia, serif' } as const;
const SANS = { fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, -apple-system, sans-serif' } as const;

const OCCASION_LABEL: Record<string, string> = {
  father_day: "Dia dos Pais",
  mother_day: "Dia das Mães",
  birthday: "Aniversário",
  anniversary: "Aniversário",
};

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
  }),
  component: HomenagemPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F1EA] text-[#1e1815] p-8 text-center">
      <div>
        <h1 className="text-2xl mb-2" style={SERIF}>Ops…</h1>
        <p className="text-sm opacity-70">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F1EA] text-[#1e1815] p-8 text-center">
      <p style={SERIF}>Memória não encontrada.</p>
    </div>
  ),
  ssr: false,
});

/* ---------------- Reveal on scroll (com fallback garantido) ---------------- */
function useReveal<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Fallback: se o observer não disparar em 1.5s, revela mesmo assim.
    const fallback = window.setTimeout(() => el.classList.add("is-in"), 1500);
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
      { threshold, rootMargin: "0px 0px -5% 0px" }
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
    <div className="relative mx-auto max-w-[420px] w-full">
      <div className="pointer-events-none absolute -inset-10 rounded-[40px] opacity-60 blur-3xl" aria-hidden
        style={{ background: "radial-gradient(60% 60% at 30% 30%, rgba(201,142,106,0.35), transparent 70%)" }} />

      <div
        className="relative rounded-[28px] p-6 sm:p-7 border border-white/60 shadow-[0_30px_80px_-40px_rgba(60,30,20,0.35)]"
        style={{
          background: "linear-gradient(180deg, rgba(255,253,250,0.92), rgba(246,240,231,0.78))",
          backdropFilter: "blur(24px) saturate(160%)",
        }}
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-[20px] shadow-[0_20px_50px_-25px_rgba(60,30,20,0.55)] ring-1 ring-black/5">
          {cover ? (
            <img src={cover} alt="" className={`w-full h-full object-cover transition-transform duration-[6000ms] ease-out ${playing ? "scale-[1.06]" : "scale-100"}`} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#E8D6C5] to-[#B08B72] flex items-center justify-center text-6xl text-white/70">♪</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        </div>

        <div className="mt-6 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="truncate text-[17px] leading-tight text-[#1e1815]" style={SERIF}>{title}</div>
            {artist && <div className="truncate text-[13px] text-[#7a6a5f] mt-1">{artist}</div>}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pausar" : "Tocar"}
            className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_15px_35px_-10px_rgba(122,60,45,0.55)] hover:scale-[1.05] active:scale-[0.96] transition-transform"
            style={{ background: "linear-gradient(135deg, #C98E6A 0%, #7a3c2d 100%)" }}
          >
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
        </div>

        <div className="mt-5">
          <div className="h-[3px] w-full rounded-full bg-[#E8DFD3] overflow-hidden">
            <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #C98E6A, #7a3c2d)" }} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] tracking-[0.18em] uppercase text-[#8a7a6f]">
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        <audio ref={audioRef} src={src} preload="metadata" />
      </div>
    </div>
  );
}

/* ---------------- Chapter label ---------------- */
function ChapterKicker({ n, title }: { n: string; title: string }) {
  return (
    <div className="inline-flex items-center gap-3 text-[10px] tracking-[0.5em] uppercase text-[#8a5a45]">
      <span className="w-6 h-px bg-[#C98E6A]/60" />
      <span>Cap. {n}</span>
      <span className="opacity-40">·</span>
      <span>{title}</span>
      <span className="w-6 h-px bg-[#C98E6A]/60" />
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
  const [heroScroll, setHeroScroll] = useState(0);

  useEffect(() => { stopAllAudio(); return () => stopAllAudio(); }, []);

  useEffect(() => {
    const onScroll = () => setHeroScroll(Math.min(window.scrollY, 800));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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

  // Lightbox: swipe + teclado
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") setLightbox((v) => (v !== null ? Math.max(0, v - 1) : v));
      if (e.key === "ArrowRight") setLightbox((v) => (v !== null && v < gallery.length - 1 ? v + 1 : v));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox]);

  const dedRef = useReveal<HTMLDivElement>();
  const musicRef = useReveal<HTMLDivElement>();
  const letterRef = useReveal<HTMLDivElement>();
  const galleryRef = useReveal<HTMLDivElement>();
  const end1 = useReveal<HTMLParagraphElement>();
  const end2 = useReveal<HTMLParagraphElement>();
  const end3 = useReveal<HTMLParagraphElement>();
  const end4 = useReveal<HTMLParagraphElement>();

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F6F1EA] flex items-center justify-center" style={SANS}>
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#8a7a6f] animate-pulse">Carregando</div>
      </div>
    );
  }

  if (err || !memory) {
    return (
      <div className="min-h-screen bg-[#F6F1EA] text-[#1e1815] flex items-center justify-center" style={SANS}>
        <div className="max-w-xl mx-auto text-center p-8">
          <h1 className="text-2xl mb-2" style={SERIF}>Memória não encontrada</h1>
          <p className="text-sm opacity-70">{err}</p>
        </div>
      </div>
    );
  }

  const occasion = OCCASION_LABEL[memory.occasion ?? "father_day"] ?? "Uma memória especial";
  const trackPreview = memory.music_preview_url;
  const hero = photos[0];
  const gallery = photos.slice(1);

  const scrollNext = () => {
    const el = document.getElementById("cap-2");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // touch swipe no lightbox
  let touchStartX = 0;
  const onTouchStart = (e: React.TouchEvent) => { touchStartX = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) setLightbox((v) => (v !== null && v < gallery.length - 1 ? v + 1 : v));
    else setLightbox((v) => (v !== null ? Math.max(0, v - 1) : v));
  };

  return (
    <div className="min-h-screen bg-[#F6F1EA] text-[#1e1815] antialiased" style={SANS}>
      {/* =============== CAPÍTULO 1 — ABERTURA =============== */}
      <section className="relative w-full overflow-hidden bg-[#0e0a08]" style={{ minHeight: "100svh" }}>
        {hero && (
          <img
            src={hero}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover ml-hero-fade ml-kenburns will-change-transform"
            style={{ transform: `translate3d(0, ${heroScroll * 0.25}px, 0) scale(1.06)` }}
            onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
          />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,7,5,0.55) 0%, rgba(10,7,5,0.25) 40%, rgba(10,7,5,0.9) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 40%, transparent 40%, rgba(0,0,0,0.6) 100%)" }} />
        <div className="absolute inset-0 ml-grain opacity-[0.09] mix-blend-overlay pointer-events-none" aria-hidden />

        <div className="absolute top-6 left-0 right-0 flex justify-center z-10">
          <div className="text-[10px] tracking-[0.55em] uppercase text-white/70 ml-rise" style={{ animationDelay: "100ms" }}>MemoLove</div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 text-white" style={{ minHeight: "100svh" }}>
          <div className="ml-rise" style={{ animationDelay: "400ms" }}>
            <div className="text-5xl mb-8 opacity-90 select-none" aria-hidden>❤</div>
          </div>
          <div className="ml-rise" style={{ animationDelay: "800ms" }}>
            <p className="max-w-xl mx-auto text-white/95" style={{ ...SERIF, fontSize: "clamp(1.6rem, 5vw, 2.4rem)", fontWeight: 300, lineHeight: 1.3 }}>
              Você recebeu uma memória especial.
            </p>
          </div>
          <div className="ml-rise" style={{ animationDelay: "1400ms" }}>
            <div className="mt-6 text-[10px] tracking-[0.5em] uppercase text-white/60">{occasion}</div>
          </div>

          <div className="ml-rise absolute bottom-14 inset-x-0 flex flex-col items-center gap-5" style={{ animationDelay: "1900ms" }}>
            <button
              type="button"
              onClick={scrollNext}
              className="px-9 py-4 rounded-full text-[11px] tracking-[0.35em] uppercase font-medium text-[#1e1815] bg-white shadow-[0_20px_45px_-15px_rgba(0,0,0,0.6)] hover:shadow-[0_25px_55px_-15px_rgba(0,0,0,0.75)] transition-all"
            >
              Começar esta memória
            </button>
            <button type="button" onClick={scrollNext} aria-label="Rolar" className="text-white/60 hover:text-white transition-colors">
              <svg width="16" height="24" viewBox="0 0 16 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ml-scroll-hint">
                <rect x="1" y="1" width="14" height="22" rx="7" />
                <line x1="8" y1="6" x2="8" y2="10" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* =============== CONTEÚDO EM CAPÍTULOS =============== */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #F6F1EA 0%, #F0E7DA 60%, #EAD9C6 100%)" }}>
        <div className="pointer-events-none absolute top-[8%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, rgba(201,142,106,0.28), transparent 60%)" }} aria-hidden />
        <div className="pointer-events-none absolute bottom-[15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, rgba(122,60,45,0.22), transparent 60%)" }} aria-hidden />

        {/* ===== CAPÍTULO 2 — DEDICATÓRIA ===== */}
        <section id="cap-2" className="relative min-h-[95svh] flex items-center px-6 py-32">
          <div ref={dedRef} className="ml-in max-w-[820px] mx-auto text-center w-full">
            <ChapterKicker n="II" title="Dedicatória" />
            <div className="mt-10 text-[11px] tracking-[0.42em] uppercase text-[#8a5a45]">Para</div>
            <h1 className="mt-6 font-light leading-[0.98] tracking-[-0.02em] text-[#1e1815]" style={{ ...SERIF, fontSize: "clamp(3rem, 12vw, 6.5rem)" }}>
              {memory.father_name}
            </h1>
            <div className="mx-auto mt-12 w-10 h-px bg-[#C98E6A]" />
            <p className="mt-8 text-[#7a3c2d]" style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(1.1rem, 2.4vw, 1.4rem)" }}>
              Com todo carinho
            </p>
            {memory.sender_name && (
              <p className="mt-4 text-[11px] tracking-[0.4em] uppercase text-[#8a5a45]">
                {memory.sender_name}
              </p>
            )}
          </div>
        </section>

        {/* ===== CAPÍTULO 3 — MÚSICA ===== */}
        {trackPreview && (
          <section className="relative min-h-[90svh] flex items-center px-6 py-24">
            <div ref={musicRef} className="ml-in max-w-[1200px] mx-auto flex flex-col items-center w-full">
              <ChapterKicker n="III" title="A canção" />
              <h2 className="text-center mt-8 mb-12 text-[#1e1815]" style={{ ...SERIF, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 400, letterSpacing: "-0.01em" }}>
                A trilha desta memória
              </h2>
              <MusicCard
                title={memory.music_title ?? "Trilha sonora"}
                artist={memory.music_artist ?? ""}
                cover={memory.music_cover ?? ""}
                src={trackPreview}
              />
              <p className="mt-8 text-[11px] tracking-[0.3em] uppercase text-[#8a5a45]/80">Toque para ouvir</p>
            </div>
          </section>
        )}

        {/* ===== CAPÍTULO 4 — A CARTA ===== */}
        <section className="relative min-h-[95svh] flex items-center px-6 py-28">
          <div ref={letterRef} className="ml-in max-w-[760px] mx-auto w-full">
            <div className="text-center mb-14">
              <ChapterKicker n="IV" title="A carta" />
            </div>

            <div
              className="relative rounded-[28px] px-8 py-14 sm:px-16 sm:py-20 shadow-[0_40px_100px_-45px_rgba(60,30,20,0.45)]"
              style={{
                background: "linear-gradient(180deg, #FFFDF8 0%, #FBF5EA 100%)",
                border: "1px solid rgba(201,142,106,0.18)",
              }}
            >
              {/* moldura interna sutil */}
              <div className="pointer-events-none absolute inset-4 rounded-[22px] border border-[#C98E6A]/15" aria-hidden />

              <span
                aria-hidden
                className="absolute top-6 left-8 text-[#C98E6A]/40 select-none"
                style={{ ...SERIF, fontSize: "5rem", lineHeight: 1 }}
              >
                &ldquo;
              </span>

              <div className="relative">
                <p
                  className="whitespace-pre-line text-[#2a1e18] leading-[1.85] first-letter:text-[3.5rem] first-letter:font-normal first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.9] first-letter:text-[#7a3c2d]"
                  style={{ ...SERIF, fontSize: "clamp(1.15rem, 2.2vw, 1.35rem)", fontWeight: 400 }}
                >
                  {memory.message}
                </p>
              </div>

              <div className="mt-12 flex items-center justify-end gap-3">
                <span className="w-10 h-px bg-[#C98E6A]/50" />
                <span className="text-[11px] tracking-[0.35em] uppercase text-[#8a5a45]" style={SANS}>
                  {memory.sender_name || "Com amor"}
                </span>
              </div>

              <span
                aria-hidden
                className="absolute bottom-6 right-8 text-[#C98E6A]/40 select-none rotate-180"
                style={{ ...SERIF, fontSize: "5rem", lineHeight: 1 }}
              >
                &ldquo;
              </span>
            </div>
          </div>
        </section>

        {/* ===== CAPÍTULO 5 — AS MEMÓRIAS ===== */}
        {gallery.length > 0 && (
          <section className="relative px-6 py-28">
            <div ref={galleryRef} className="ml-in max-w-[1200px] mx-auto">
              <div className="text-center mb-16">
                <ChapterKicker n="V" title="As memórias" />
                <h2 className="mt-8 text-[#1e1815]" style={{ ...SERIF, fontSize: "clamp(2rem, 4.5vw, 3rem)", fontWeight: 400, letterSpacing: "-0.01em" }}>
                  Instantes que ficam
                </h2>
                <div className="mx-auto mt-6 w-10 h-px bg-[#C98E6A]" />
              </div>

              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 md:gap-8 [column-fill:_balance]">
                {gallery.map((url, i) => {
                  const priority = i < 2;
                  const ratios = ["3 / 4", "4 / 5", "1 / 1", "3 / 4", "4 / 5", "2 / 3", "3 / 4"];
                  const ratio = ratios[i % ratios.length];
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => url && setLightbox(i)}
                      className="group relative block w-full overflow-hidden rounded-[18px] bg-[#EFE4D4] ml-skeleton shadow-[0_20px_50px_-30px_rgba(60,30,20,0.5)] mb-6 md:mb-8 break-inside-avoid focus:outline-none focus:ring-2 focus:ring-[#C98E6A]/50 focus:ring-offset-4 focus:ring-offset-[#F0E7DA] transition-shadow duration-700 hover:shadow-[0_30px_70px_-25px_rgba(60,30,20,0.65)]"
                      style={{ aspectRatio: ratio }}
                      aria-label={`Ver foto ${i + 2}`}
                    >
                      {url && (
                        <img
                          src={url}
                          alt=""
                          loading={priority ? "eager" : "lazy"}
                          fetchPriority={priority ? "high" : "auto"}
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover ml-fade-in transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]"
                          onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      <div className="absolute bottom-4 left-4 text-white/90 text-[10px] tracking-[0.3em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                        {String(i + 2).padStart(2, "0")}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ===== CAPÍTULO 6 — ENCERRAMENTO ===== */}
        <section className="relative min-h-[100svh] flex items-center px-6 py-32">
          <div className="max-w-[680px] mx-auto text-center w-full space-y-40 md:space-y-48">
            <p
              ref={end1}
              className="ml-in text-[#1e1815]"
              style={{ ...SERIF, fontSize: "clamp(1.7rem, 4.5vw, 2.4rem)", fontWeight: 300, lineHeight: 1.3 }}
            >
              Os momentos passam.
            </p>
            <p
              ref={end2}
              className="ml-in text-[#7a3c2d]"
              style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(1.9rem, 5vw, 2.8rem)", fontWeight: 300, lineHeight: 1.3 }}
            >
              O amor permanece.
            </p>
            <p
              ref={end3}
              className="ml-in text-[#1e1815]/85"
              style={{ ...SERIF, fontSize: "clamp(1.2rem, 3vw, 1.6rem)", fontWeight: 300, lineHeight: 1.4 }}
            >
              Obrigado por fazer parte desta história.
            </p>
            <p
              ref={end4}
              className="ml-in text-[10px] tracking-[0.5em] uppercase text-[#8a5a45]"
            >
              Até a próxima memória
            </p>
          </div>
        </section>

        <footer className="relative text-center py-12 text-[10px] tracking-[0.45em] uppercase text-[#8a5a45]/70">
          Criado com <span className="text-[#C98E6A]">❤</span> no MemoLove
        </footer>
      </div>

      {/* =============== LIGHTBOX =============== */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 ml-fade-in is-loaded"
          onClick={() => setLightbox(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={gallery[lightbox]}
            alt=""
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl ml-zoom-in"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightbox((v) => (v !== null ? Math.max(0, v - 1) : v)); }}
              className="hidden sm:flex absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white items-center justify-center backdrop-blur-md border border-white/20"
              aria-label="Anterior"
            >
              ‹
            </button>
          )}
          {lightbox < gallery.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightbox((v) => (v !== null ? Math.min(gallery.length - 1, v + 1) : v)); }}
              className="hidden sm:flex absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white items-center justify-center backdrop-blur-md border border-white/20"
              aria-label="Próxima"
            >
              ›
            </button>
          )}
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center text-xl backdrop-blur-md border border-white/20"
            aria-label="Fechar"
          >
            ×
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 text-[10px] tracking-[0.35em] uppercase">
            {String(lightbox + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}
          </div>
        </div>
      )}

      <style>{`
        @keyframes mlShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .ml-skeleton { background: linear-gradient(90deg, #EFE4D4 0%, #F6EEDF 50%, #EFE4D4 100%); background-size: 200% 100%; animation: mlShimmer 1.8s ease-in-out infinite; }

        .ml-fade-in { opacity: 0; transition: opacity 700ms ease; }
        .ml-fade-in.is-loaded { opacity: 1; }

        @keyframes mlKen { 0% { transform: scale(1.02); } 100% { transform: scale(1.14); } }
        .ml-hero-fade { opacity: 0; transition: opacity 1200ms cubic-bezier(0.22,1,0.36,1); }
        .ml-hero-fade.is-loaded { opacity: 1; }
        .ml-kenburns { animation: mlKen 22s ease-out both; transform-origin: center; }

        @keyframes mlRise { 0% { opacity: 0; transform: translateY(24px); filter: blur(6px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0); } }
        .ml-rise { opacity: 0; animation: mlRise 1200ms cubic-bezier(0.22, 1, 0.36, 1) both; }

        .ml-in { opacity: 0; transform: translateY(32px); filter: blur(6px); transition: opacity 1100ms cubic-bezier(0.22,1,0.36,1), transform 1100ms cubic-bezier(0.22,1,0.36,1), filter 1100ms ease; }
        .ml-in.is-in { opacity: 1; transform: translateY(0); filter: blur(0); }

        @keyframes mlZoomIn { 0% { transform: scale(0.96); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .ml-zoom-in { animation: mlZoomIn 400ms cubic-bezier(0.22,1,0.36,1) both; }

        @keyframes mlScrollHint { 0%,100% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(4px); opacity: 0.4; } }
        .ml-scroll-hint line { animation: mlScrollHint 1.8s ease-in-out infinite; transform-origin: center; }

        .ml-grain { background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px); background-size: 3px 3px; }

        @media (prefers-reduced-motion: reduce) {
          .ml-kenburns, .ml-rise, .ml-in, .ml-skeleton, .ml-zoom-in, .ml-scroll-hint line { animation: none; }
          .ml-hero-fade, .ml-fade-in { transition: none; opacity: 1; }
          .ml-rise, .ml-in { opacity: 1; transform: none; filter: none; }
        }
      `}</style>
    </div>
  );
}
