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

  // Failsafe: garante visibilidade de todos os capítulos após a montagem.
  useEffect(() => {
    const t = window.setTimeout(() => {
      document.querySelectorAll(".ml-in").forEach((el) => el.classList.add("is-in"));
    }, 1800);
    return () => window.clearTimeout(t);
  }, []);

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
      {/* =============== HERO =============== */}
      <section className="relative w-full bg-[#0e0a08]" style={{ minHeight: "100svh" }}>
        {hero && (
          <img
            src={hero}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover ml-hero-fade"
            onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(10,7,5,0.55) 0%, rgba(10,7,5,0.35) 45%, rgba(10,7,5,0.85) 100%)" }}
        />

        <div
          className="relative z-10 flex flex-col items-center justify-center text-center text-white px-6 py-24"
          style={{ minHeight: "100svh" }}
        >
          <div className="text-[10px] tracking-[0.5em] uppercase text-white/70 mb-10">MemoLove</div>

          <p
            className="text-white/95 max-w-[18ch] mx-auto mb-6"
            style={{ ...SERIF, fontSize: "clamp(1.1rem, 3.5vw, 1.4rem)", fontWeight: 300, letterSpacing: "0.02em" }}
          >
            Uma memória para
          </p>

          <h1
            className="font-light leading-[1.05] tracking-[-0.02em] text-white max-w-[14ch] mx-auto"
            style={{ ...SERIF, fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
          >
            {memory.father_name}
          </h1>

          <p
            className="mt-8 text-white/75 max-w-[28ch] mx-auto"
            style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(1rem, 2.5vw, 1.15rem)", fontWeight: 300 }}
          >
            {occasion}
          </p>

          <button
            type="button"
            onClick={scrollNext}
            className="mt-14 px-10 py-4 rounded-full text-[11px] tracking-[0.35em] uppercase font-medium text-[#1e1815] bg-white shadow-[0_20px_45px_-15px_rgba(0,0,0,0.55)] hover:scale-[1.03] transition-transform"
          >
            Começar
          </button>
        </div>
      </section>

      {/* =============== CONTEÚDO =============== */}
      <div style={{ background: "linear-gradient(180deg, #F6F1EA 0%, #F0E7DA 100%)" }}>
        {/* MÚSICA */}
        {trackPreview && (
          <section id="cap-2" className="px-6 py-24 sm:py-28">
            <div className="max-w-[520px] mx-auto flex flex-col items-center">
              <div className="text-[10px] tracking-[0.4em] uppercase text-[#8a5a45] mb-8">Trilha sonora</div>
              <MusicCard
                title={memory.music_title ?? "Trilha sonora"}
                artist={memory.music_artist ?? ""}
                cover={memory.music_cover ?? ""}
                src={trackPreview}
              />
            </div>
          </section>
        )}

        {/* CARTA */}
        <section id={trackPreview ? undefined : "cap-2"} className="px-6 py-20 sm:py-28">
          <div className="max-w-[760px] mx-auto">
            <div className="text-center mb-10">
              <div className="text-[10px] tracking-[0.4em] uppercase text-[#8a5a45]">Uma mensagem</div>
            </div>

            <div
              className="rounded-[24px] px-6 py-12 sm:px-14 sm:py-16 shadow-[0_30px_80px_-45px_rgba(60,30,20,0.35)]"
              style={{
                background: "linear-gradient(180deg, #FFFDF8 0%, #FBF5EA 100%)",
                border: "1px solid rgba(201,142,106,0.18)",
              }}
            >
              <p
                className="whitespace-pre-line text-[#2a1e18] break-words"
                style={{
                  ...SERIF,
                  fontSize: "clamp(1.1rem, 2.2vw, 1.3rem)",
                  fontWeight: 400,
                  lineHeight: 1.8,
                }}
              >
                {memory.message}
              </p>

              {memory.sender_name && (
                <div className="mt-10 flex items-center justify-end gap-3">
                  <span className="w-8 h-px bg-[#C98E6A]/50" />
                  <span className="text-[11px] tracking-[0.32em] uppercase text-[#8a5a45]" style={SANS}>
                    {memory.sender_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* GALERIA */}
        {gallery.length > 0 && (
          <section className="px-6 py-20 sm:py-28">
            <div className="max-w-[1100px] mx-auto">
              <div className="text-center mb-12">
                <div className="text-[10px] tracking-[0.4em] uppercase text-[#8a5a45] mb-4">Momentos</div>
                <h2
                  className="text-[#1e1815]"
                  style={{ ...SERIF, fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 400 }}
                >
                  Instantes que ficam
                </h2>
              </div>

              <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
                {gallery.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => url && setLightbox(i)}
                    className="group relative block w-full overflow-hidden rounded-[16px] bg-[#EFE4D4] ml-skeleton shadow-[0_15px_40px_-25px_rgba(60,30,20,0.4)] mb-5 break-inside-avoid focus:outline-none focus:ring-2 focus:ring-[#C98E6A]/50"
                    aria-label={`Ver foto ${i + 2}`}
                  >
                    {url && (
                      <img
                        src={url}
                        alt=""
                        loading={i < 2 ? "eager" : "lazy"}
                        decoding="async"
                        className="w-full h-auto block ml-fade-in transition-transform duration-700 group-hover:scale-[1.03]"
                        onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ENCERRAMENTO */}
        <section
          className="px-6 py-24 sm:py-32"
          style={{ background: "#FBF7F0" }}
        >
          <div className="max-w-[600px] mx-auto text-center space-y-10 sm:space-y-14">
            <p
              className="text-[#1e1815]"
              style={{ ...SERIF, fontSize: "clamp(1.4rem, 4vw, 2rem)", fontWeight: 300, lineHeight: 1.4 }}
            >
              Os momentos passam.
            </p>
            <p
              className="text-[#7a3c2d]"
              style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(1.5rem, 4.5vw, 2.2rem)", fontWeight: 300, lineHeight: 1.4 }}
            >
              O amor permanece.
            </p>
            <p
              className="text-[#1e1815]/80"
              style={{ ...SERIF, fontSize: "clamp(1.1rem, 3vw, 1.4rem)", fontWeight: 300, lineHeight: 1.5 }}
            >
              Até a próxima memória.
            </p>
          </div>
        </section>

        <footer className="text-center py-10 text-[10px] tracking-[0.4em] uppercase text-[#8a5a45]/70">
          Criado com <span className="text-[#C98E6A]">❤</span> no MemoLove
        </footer>
      </div>

      {/* =============== LIGHTBOX =============== */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={gallery[lightbox]}
            alt=""
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
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
