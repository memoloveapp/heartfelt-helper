import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";

/* ============================================================
   /homenagem/$slug — MemoLove Premium (Cinematic Grand Edition)
   Fundo #08070A, dourado #D4A257, marfim #F4EBDD.
   Playfair Display + Cormorant + Inter.
   ============================================================ */

const NIGHT = "#08070A";
const NIGHT_2 = "#141018";
const GOLD = "#D4A257";
const GOLD_HI = "#F0D28C";
const IVORY = "#F4EBDD";

const DISPLAY = { fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif' } as const;
const SERIF = { fontFamily: '"Playfair Display", Georgia, serif' } as const;
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
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,500;1,700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  component: HomenagemPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: NIGHT, color: IVORY }}>
      <div><h1 className="text-2xl mb-2" style={DISPLAY}>Ops…</h1><p className="text-sm opacity-70">{error.message}</p></div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: NIGHT, color: IVORY }}>
      <p style={DISPLAY}>Memória não encontrada.</p>
    </div>
  ),
  ssr: false,
});

/* ---------------- Utils ---------------- */
function useInView<T extends HTMLElement>(threshold = 0.2) {
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

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { setY(window.scrollY); raf = 0; });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return y;
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
   PROLOGUE — cortina cinematográfica de abertura
   ========================================================= */
function Prologue({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0); // 0 idle, 1 open, 2 gone
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1900);
    const t2 = setTimeout(() => { setPhase(2); onDone(); }, 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);
  if (phase === 2) return null;
  return (
    <div className={`ml-prologue ${phase >= 1 ? "is-open" : ""}`}>
      <div className="ml-prologue-top" />
      <div className="ml-prologue-bot" />
      <div className="ml-prologue-center">
        <span className="ml-prologue-mark" style={SERIF}>MemoLove</span>
        <span className="ml-prologue-line" />
        <span className="ml-prologue-sub" style={BODY}>Apresenta</span>
      </div>
    </div>
  );
}

/* =========================================================
   PROGRESS BAR
   ========================================================= */
function ProgressBar() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setP(total > 0 ? window.scrollY / total : 0);
    };
    window.addEventListener("scroll", on, { passive: true });
    on();
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className="ml-progress"><span style={{ width: `${p * 100}%` }} /></div>
  );
}

/* =========================================================
   HERO — referência oficial V3 (bottom-left cinematic)
   ========================================================= */
function ChapterHero({ name, photo, ready }: { name: string; photo: string; occasion: string | null; ready: boolean }) {
  return (
    <section className="ml-hero" data-chapter>
      {photo && <img src={photo} alt="" aria-hidden loading="eager" className="ml-hero-img" />}
      <div className="ml-hero-veil" aria-hidden />
      <div className="ml-hero-content">
        <p className={`ml-h-eyebrow ${ready ? "in" : ""}`} style={BODY}>Para o meu</p>
        <h1 className={`ml-h-name ${ready ? "in" : ""}`} style={SERIF}>Pai.</h1>
        <span className={`ml-h-rule ${ready ? "in" : ""}`} aria-hidden />
        <p className={`ml-h-sub ${ready ? "in" : ""}`} style={SERIF}>Meu maior exemplo.</p>
      </div>
      <div className={`ml-h-arrow ${ready ? "in" : ""}`} aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </div>
    </section>
  );
}

/* =========================================================
   CHAPTER MARK — marcador editorial entre seções
   ========================================================= */
function ChapterMark({ n, title, subtitle }: { n: string; title: string; subtitle: string }) {
  const { ref, seen } = useInView<HTMLElement>(0.4);
  return (
    <section ref={ref} className={`ml-mark ${seen ? "in" : ""}`} data-chapter>
      <span className="ml-mark-num" style={SERIF}>{n}</span>
      <span className="ml-mark-line" />
      <h2 className="ml-mark-title" style={SERIF}>{title}</h2>
      <p className="ml-mark-sub" style={BODY}>{subtitle}</p>
    </section>
  );
}

/* =========================================================
   CARTA — editorial com flourish dourado desenhado
   ========================================================= */
function ChapterLetter({ message, sender }: { message: string; sender: string }) {
  const { ref, seen } = useInView<HTMLElement>(0.15);
  const paragraphs = (message ?? "").trim().split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);
  const lines = paragraphs.length ? paragraphs : ["Uma mensagem especial em breve."];
  return (
    <section ref={ref} className={`ml-letter ${seen ? "in" : ""}`} data-chapter>
      <div className="ml-letter-glow" aria-hidden />
      <div className="ml-letter-inner">
        <svg className="ml-letter-flourish" viewBox="0 0 200 40" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
          <path d="M0 20 Q40 0 100 20 T200 20" strokeDasharray="400" strokeDashoffset="400" />
        </svg>
        <span className="ml-letter-quote" aria-hidden>“</span>
        <div className="ml-letter-body">
          {lines.map((p, i) => (
            <p key={i} className="ml-letter-line" style={{ ...SERIF, animationDelay: `${400 + i * 550}ms` }}>{p}</p>
          ))}
        </div>
        {sender && (
          <div className="ml-letter-sign" style={{ animationDelay: `${400 + lines.length * 550 + 300}ms` }}>
            <span className="ml-letter-sign-rule" />
            <p style={SERIF}>Com eterno amor,</p>
            <p className="ml-letter-sign-name" style={SERIF}>{sender}</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   MÚSICA — vitrola giratória + equalizador
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

  const fmt = (t: number) => !isFinite(t) || t <= 0 ? "0:00" : `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, "0")}`;
  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <section ref={ref} className={`ml-music ${seen ? "in" : ""} ${playing ? "is-playing" : ""}`} data-chapter>
      <div className="ml-music-bg" aria-hidden>
        {cover && <img src={cover} alt="" />}
        <span className="ml-music-bg-veil" />
      </div>
      <div className="ml-music-inner">
        <div className="ml-vinyl-stage">
          <div className="ml-vinyl">
            <div className="ml-vinyl-disc">
              <span className="ml-vinyl-grooves" />
              <span className="ml-vinyl-grooves ml-vinyl-grooves-2" />
              <div className="ml-vinyl-label">
                {cover ? <img src={cover} alt="" /> : <span style={SERIF}>♪</span>}
                <span className="ml-vinyl-hole" />
              </div>
              <span className="ml-vinyl-shine" />
            </div>
          </div>
          <div className="ml-tonearm">
            <span className="ml-tonearm-base" />
            <span className="ml-tonearm-rod" />
            <span className="ml-tonearm-head" />
          </div>
          <button type="button" onClick={toggle} className="ml-vinyl-play" aria-label={playing ? "Pausar" : "Tocar"}>
            {playing ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
        </div>
        <p className="ml-music-eyebrow" style={BODY}>A canção que fica</p>
        <h3 className="ml-music-title" style={SERIF}>{title}</h3>
        {artist && <p className="ml-music-artist" style={BODY}>{artist}</p>}
        <div className="ml-eq" aria-hidden>
          {Array.from({ length: 32 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${(i % 8) * 0.09}s`, opacity: playing ? 1 : .3 }} />
          ))}
        </div>
        <div className="ml-music-controls">
          <span className="ml-music-time" style={BODY}>{fmt(current)}</span>
          <div className="ml-music-track"><div className="ml-music-fill" style={{ width: `${pct}%` }} /></div>
          <span className="ml-music-time" style={BODY}>{fmt(duration)}</span>
        </div>
      </div>
      <audio ref={audioRef} src={src} preload="metadata" />
    </section>
  );
}

/* =========================================================
   GALERIA — variedade de layouts com parallax por scroll
   ========================================================= */
function ParallaxTile({
  url, abs, num, aspect, className, onOpen, offset,
}: {
  url: string; abs: number; num: number; aspect: string; className: string; onOpen: (i: number) => void; offset: number;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = ref.current; if (!el) return;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        const c = (r.top + r.height / 2 - vh / 2) / vh;
        setT(c);
      });
    };
    window.addEventListener("scroll", on, { passive: true });
    on();
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <button ref={ref} className={`ml-tile ${className}`} style={{ transitionDelay: `${offset}ms` }} onClick={() => onOpen(abs)}>
      <span className="ml-tile-num" style={SERIF}>{String(num).padStart(2, "0")}</span>
      <span className="ml-tile-frame" style={{ aspectRatio: aspect }}>
        <span className="ml-tile-mat">
          <span className="ml-tile-inner">
            <img src={url} alt="" loading="lazy" decoding="async" style={{ transform: `translate3d(0, ${t * -30}px, 0) scale(1.18)` }} />
            <span className="ml-tile-sheen" aria-hidden />
            <span className="ml-tile-vignette" aria-hidden />
          </span>
        </span>
        <span className="ml-tile-corner tl" aria-hidden>
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1"><path d="M2 14 V2 H14 M2 2 L14 14" /><circle cx="2" cy="2" r="1.5" fill="currentColor" stroke="none" /></svg>
        </span>
        <span className="ml-tile-corner tr" aria-hidden>
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1"><path d="M38 14 V2 H26 M38 2 L26 14" /><circle cx="38" cy="2" r="1.5" fill="currentColor" stroke="none" /></svg>
        </span>
        <span className="ml-tile-corner bl" aria-hidden>
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1"><path d="M2 26 V38 H14 M2 38 L14 26" /><circle cx="2" cy="38" r="1.5" fill="currentColor" stroke="none" /></svg>
        </span>
        <span className="ml-tile-corner br" aria-hidden>
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1"><path d="M38 26 V38 H26 M38 38 L26 26" /><circle cx="38" cy="38" r="1.5" fill="currentColor" stroke="none" /></svg>
        </span>
        <span className="ml-tile-shine" aria-hidden />
      </span>
    </button>
  );
}

function GalleryBlock({
  photos, startIndex, variant, onOpen,
}: {
  photos: { url: string; abs: number }[]; startIndex: number; variant: number; onOpen: (i: number) => void;
}) {
  const { ref, seen } = useInView<HTMLElement>(0.12);
  const v = variant % 3;
  return (
    <section ref={ref} className={`ml-gallery v-${v} ${seen ? "in" : ""}`} data-chapter>
      <div className="ml-gallery-grid">
        {v === 0 && photos[0] && (
          <>
            <ParallaxTile url={photos[0].url} abs={photos[0].abs} num={startIndex + 1} aspect="4/5" className="g0-a" onOpen={onOpen} offset={0} />
            {photos[1] && <ParallaxTile url={photos[1].url} abs={photos[1].abs} num={startIndex + 2} aspect="1/1" className="g0-b" onOpen={onOpen} offset={180} />}
            {photos[2] && <ParallaxTile url={photos[2].url} abs={photos[2].abs} num={startIndex + 3} aspect="3/4" className="g0-c" onOpen={onOpen} offset={340} />}
          </>
        )}
        {v === 1 && (
          <>
            {photos[0] && <ParallaxTile url={photos[0].url} abs={photos[0].abs} num={startIndex + 1} aspect="3/4" className="g1-a" onOpen={onOpen} offset={0} />}
            {photos[1] && <ParallaxTile url={photos[1].url} abs={photos[1].abs} num={startIndex + 2} aspect="16/10" className="g1-b" onOpen={onOpen} offset={180} />}
            {photos[2] && <ParallaxTile url={photos[2].url} abs={photos[2].abs} num={startIndex + 3} aspect="1/1" className="g1-c" onOpen={onOpen} offset={340} />}
          </>
        )}
        {v === 2 && (
          <>
            {photos[0] && <ParallaxTile url={photos[0].url} abs={photos[0].abs} num={startIndex + 1} aspect="1/1" className="g2-a" onOpen={onOpen} offset={0} />}
            {photos[1] && <ParallaxTile url={photos[1].url} abs={photos[1].abs} num={startIndex + 2} aspect="4/5" className="g2-b" onOpen={onOpen} offset={180} />}
            {photos[2] && <ParallaxTile url={photos[2].url} abs={photos[2].abs} num={startIndex + 3} aspect="4/3" className="g2-c" onOpen={onOpen} offset={340} />}
          </>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   ENCERRAMENTO — selo dourado desenhado por stroke
   ========================================================= */
function ChapterEnd() {
  const { ref, seen } = useInView<HTMLElement>(0.3);
  return (
    <section ref={ref} className={`ml-end ${seen ? "in" : ""}`} data-chapter>
      <div className="ml-end-glow" aria-hidden />
      <div className="ml-end-inner">
        <p className="ml-end-kicker" style={BODY}>Presença eterna</p>
        <h2 className="ml-end-quote" style={SERIF}>
          Nossa saudade virou<br /><em>amor</em> que nos guia.
        </h2>
        <div className="ml-end-seal" aria-hidden>
          <svg viewBox="0 0 140 140" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="70" cy="70" r="66" strokeDasharray="415" strokeDashoffset="415" className="ml-end-ring" />
            <circle cx="70" cy="70" r="54" strokeDasharray="340" strokeDashoffset="340" className="ml-end-ring ml-end-ring-2" />
            <path d="M70 40 L74 66 L100 70 L74 74 L70 100 L66 74 L40 70 L66 66 Z" strokeDasharray="220" strokeDashoffset="220" className="ml-end-star" />
          </svg>
          <span className="ml-end-mark" style={SERIF}>M</span>
        </div>
        <p className="ml-end-foot" style={BODY}>Memorial digital · MemoLove</p>
      </div>
    </section>
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
      <div className="ml-lb-count" style={BODY}>{String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</div>
      <button className="ml-lb-btn ml-lb-close" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Fechar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
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
  const [prologueDone, setPrologueDone] = useState(false);

  useEffect(() => { stopAllAudio(); return () => stopAllAudio(); }, []);

  const hero = photos[0] ?? "";
  const gallery = photos.slice(1).filter(Boolean);
  const hasMusic = !!memory?.music_preview_url;

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
        <div className="text-center p-8"><h1 style={SERIF} className="text-2xl mb-2">Memória não encontrada</h1><p className="text-sm opacity-70">{err}</p></div>
      </div>
    );
  }

  return (
    <div className="ml-root">
      <style>{`
        html, body { background: ${NIGHT}; }
        .ml-root { background: ${NIGHT}; color: ${IVORY}; position: relative; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
        .ml-root ::selection { background: ${GOLD}; color: ${NIGHT}; }

        /* ============ Keyframes ============ */
        @keyframes ml-rise { 0% { opacity: 0; transform: translateY(28px); filter: blur(14px); } 100% { opacity: 1; transform: none; filter: none; } }
        @keyframes ml-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ml-letter-in { 0% { opacity: 0; transform: translateY(80px) rotateX(-40deg); filter: blur(14px); } 100% { opacity: 1; transform: none; filter: none; } }
        @keyframes ml-shimmer { 0% { transform: translateX(-120%) skewX(-15deg); } 100% { transform: translateX(220%) skewX(-15deg); } }
        @keyframes ml-arrow { 0%,100% { transform: translateY(0); opacity: .55; } 50% { transform: translateY(10px); opacity: 1; } }
        @keyframes ml-halo { 0%,100% { transform: scale(.9); opacity: .5; } 50% { transform: scale(1.06); opacity: 1; } }
        @keyframes ml-spin { to { transform: rotate(360deg); } }
        @keyframes ml-eq { 0%,100% { transform: scaleY(.2); } 50% { transform: scaleY(1); } }
        @keyframes ml-dust { 0% { transform: translate(0,0); opacity: 0; } 20% { opacity: .9; } 100% { transform: translate(60px,-120px); opacity: 0; } }
        @keyframes ml-draw { to { stroke-dashoffset: 0; } }
        @keyframes ml-glow-pulse { 0%,100% { opacity: .35; } 50% { opacity: .8; } }

        /* ============ Prologue ============ */
        .ml-prologue { position: fixed; inset: 0; z-index: 100; pointer-events: none; }
        .ml-prologue-top, .ml-prologue-bot { position: absolute; left: 0; right: 0; height: 50%; background: ${NIGHT}; transition: transform 1.2s cubic-bezier(.7,0,.3,1); }
        .ml-prologue-top { top: 0; }
        .ml-prologue-bot { bottom: 0; }
        .ml-prologue.is-open .ml-prologue-top { transform: translateY(-100%); }
        .ml-prologue.is-open .ml-prologue-bot { transform: translateY(100%); }
        .ml-prologue-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; transition: opacity .6s ease; }
        .ml-prologue.is-open .ml-prologue-center { opacity: 0; }
        .ml-prologue-mark { color: ${GOLD}; font-size: clamp(32px, 5vw, 56px); font-style: italic; opacity: 0; animation: ml-rise 1.2s ease-out .2s forwards; letter-spacing: .02em; }
        .ml-prologue-line { width: 0; height: 1px; background: ${GOLD}; animation: ml-pline 1s ease-out 1s forwards; }
        @keyframes ml-pline { to { width: 120px; } }
        .ml-prologue-sub { color: rgba(244,235,221,.5); font-size: 10px; letter-spacing: .6em; text-transform: uppercase; opacity: 0; animation: ml-fade 1s ease-out 1.4s forwards; }

        /* ============ Progress ============ */
        .ml-progress { position: fixed; top: 0; left: 0; right: 0; height: 2px; background: rgba(212,162,87,.08); z-index: 50; }
        .ml-progress span { display: block; height: 100%; background: linear-gradient(90deg, ${GOLD}, ${GOLD_HI}); box-shadow: 0 0 12px rgba(212,162,87,.6); transition: width .1s linear; }

        /* ============ HERO — referência V3 ============ */
        @keyframes ml-kb-soft { 0% { transform: scale(1); } 100% { transform: scale(1.03); } }
        @keyframes ml-h-in { 0% { opacity: 0; transform: translateY(18px); filter: blur(10px); } 100% { opacity: 1; transform: none; filter: none; } }
        @keyframes ml-h-rule { 0% { opacity: 0; transform: scaleX(0); } 100% { opacity: 1; transform: scaleX(1); } }
        @keyframes ml-h-arrow { 0%,100% { opacity: .35; transform: translate(-50%, 0); } 50% { opacity: .9; transform: translate(-50%, 6px); } }

        .ml-hero { position: relative; height: 100vh; height: 100svh; width: 100vw; overflow: hidden; background: #000; margin: 0; padding: 0; }
        .ml-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; opacity: 0; animation: ml-fade 1.8s ease-out .1s forwards, ml-kb-soft 15s ease-in-out 1.8s infinite alternate; }
        .ml-hero-veil { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,.55) 78%, rgba(0,0,0,.9) 100%); }

        .ml-hero-content {
          position: absolute;
          left: clamp(28px, 6vw, 88px);
          bottom: clamp(90px, 12vh, 140px);
          z-index: 3;
          max-width: min(560px, 82vw);
          text-align: left;
          color: ${IVORY};
        }
        .ml-h-eyebrow {
          margin: 0 0 clamp(14px, 2vh, 22px);
          font-size: clamp(11px, 1.05vw, 13px);
          letter-spacing: .38em;
          text-transform: uppercase;
          color: ${GOLD};
          opacity: 0;
        }
        .ml-h-eyebrow.in { animation: ml-h-in 1.2s cubic-bezier(.2,.7,.2,1) .3s forwards; }
        .ml-h-name {
          margin: 0;
          font-family: "Playfair Display", Georgia, serif;
          font-weight: 500;
          font-style: normal;
          font-size: clamp(96px, 15vw, 190px);
          line-height: .92;
          letter-spacing: -.02em;
          color: ${IVORY};
          text-shadow: 0 8px 60px rgba(0,0,0,.55);
          opacity: 0;
        }
        .ml-h-name.in { animation: ml-h-in 1.4s cubic-bezier(.2,.7,.2,1) 1s forwards; }
        .ml-h-rule {
          display: block;
          width: clamp(64px, 8vw, 100px);
          height: 1px;
          background: ${GOLD};
          margin: clamp(22px, 3vh, 32px) 0 clamp(20px, 3vh, 28px);
          transform-origin: left center;
          transform: scaleX(0);
          opacity: 0;
        }
        .ml-h-rule.in { animation: ml-h-rule 1.1s cubic-bezier(.2,.7,.2,1) 1.9s forwards; }
        .ml-h-sub {
          margin: 0;
          font-family: "Playfair Display", Georgia, serif;
          font-style: italic;
          font-weight: 400;
          font-size: clamp(16px, 1.6vw, 22px);
          line-height: 1.4;
          color: rgba(244,235,221,.82);
          opacity: 0;
        }
        .ml-h-sub.in { animation: ml-h-in 1.2s cubic-bezier(.2,.7,.2,1) 2.5s forwards; }

        .ml-h-arrow {
          position: absolute;
          left: 50%; bottom: clamp(24px, 4vh, 40px);
          transform: translateX(-50%);
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 999px;
          border: 1px solid rgba(244,235,221,.35);
          color: ${IVORY};
          opacity: 0;
          z-index: 4;
        }
        .ml-h-arrow.in { animation: ml-fade .8s ease-out 3.2s forwards, ml-h-arrow 2.6s ease-in-out 4s infinite; }

        @media (max-width: 640px) {
          .ml-hero-content { left: 22px; right: 22px; bottom: 96px; }
          .ml-h-name { font-size: clamp(84px, 22vw, 130px); }
        }

        /* ============ CHAPTER MARK ============ */
        .ml-mark { padding: clamp(120px, 20vh, 200px) 24px 40px; text-align: center; max-width: 720px; margin: 0 auto; opacity: 0; transform: translateY(30px); transition: opacity 1.2s ease-out, transform 1.2s ease-out; }
        .ml-mark.in { opacity: 1; transform: none; }
        .ml-mark-num { display: block; font-size: clamp(80px, 12vw, 140px); font-style: italic; color: ${GOLD}; opacity: .25; line-height: 1; letter-spacing: -.02em; }
        .ml-mark-line { display: block; width: 1px; height: 60px; background: linear-gradient(180deg, ${GOLD}, transparent); margin: 24px auto; }
        .ml-mark-title { margin: 0; font-size: clamp(32px, 5vw, 56px); font-style: italic; font-weight: 400; color: ${IVORY}; letter-spacing: -.01em; }
        .ml-mark-sub { margin: 16px 0 0; font-size: 12px; letter-spacing: .3em; text-transform: uppercase; color: rgba(244,235,221,.45); }

        /* ============ CARTA ============ */
        .ml-letter { position: relative; padding: clamp(80px, 12vh, 140px) 24px clamp(100px, 16vh, 180px); max-width: 900px; margin: 0 auto; }
        .ml-letter-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60%; height: 60%; background: radial-gradient(ellipse, rgba(212,162,87,.14), transparent 70%); filter: blur(80px); pointer-events: none; }
        .ml-letter-inner { position: relative; }
        .ml-letter-flourish { position: absolute; top: -60px; left: 50%; transform: translateX(-50%); width: 200px; color: ${GOLD}; opacity: .8; }
        .ml-letter.in .ml-letter-flourish path { animation: ml-draw 2s ease-out .3s forwards; }
        .ml-letter-quote { position: absolute; top: -30px; left: -30px; font-family: 'Playfair Display', serif; font-size: clamp(180px, 22vw, 320px); line-height: 1; color: ${GOLD}; opacity: .08; font-style: italic; font-weight: 900; pointer-events: none; user-select: none; }
        .ml-letter-body { position: relative; z-index: 1; }
        .ml-letter-line { margin: 0 0 clamp(28px, 3vh, 44px); font-size: clamp(24px, 3vw, 36px); line-height: 1.5; font-style: italic; color: rgba(244,235,221,.95); font-weight: 400; opacity: 0; }
        .ml-letter.in .ml-letter-line { animation: ml-rise 1.6s ease-out forwards; }
        .ml-letter-line:first-child { font-size: clamp(28px, 3.8vw, 44px); }
        .ml-letter-line:first-child::first-letter { font-size: 1.8em; float: left; line-height: .9; padding: .05em .12em 0 0; color: ${GOLD}; font-weight: 500; }
        .ml-letter-sign { margin-top: clamp(60px, 8vh, 100px); display: flex; flex-direction: column; align-items: flex-end; text-align: right; gap: 6px; opacity: 0; }
        .ml-letter.in .ml-letter-sign { animation: ml-rise 1.2s ease-out forwards; }
        .ml-letter-sign-rule { width: 120px; height: 1px; background: ${GOLD}; margin-bottom: 18px; }
        .ml-letter-sign p { margin: 0; font-size: clamp(18px, 2vw, 24px); font-style: italic; color: rgba(244,235,221,.75); }
        .ml-letter-sign-name { color: ${GOLD} !important; font-size: clamp(22px, 2.6vw, 32px) !important; }
        @media (max-width: 640px) { .ml-letter { padding: 80px 22px; } .ml-letter-quote { top: -20px; left: -10px; } .ml-letter-flourish { top: -30px; width: 140px; } }

        /* ============ MÚSICA ============ */
        .ml-music { position: relative; padding: clamp(100px, 16vh, 180px) 24px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .ml-music-bg { position: absolute; inset: 0; z-index: 0; }
        .ml-music-bg img { width: 100%; height: 100%; object-fit: cover; filter: blur(60px) brightness(.35) saturate(1.2); transform: scale(1.2); }
        .ml-music-bg-veil { position: absolute; inset: 0; background: linear-gradient(180deg, ${NIGHT} 0%, rgba(8,7,10,.85) 40%, rgba(8,7,10,.85) 60%, ${NIGHT} 100%); }
        .ml-music-inner { position: relative; z-index: 1; max-width: 520px; width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .ml-vinyl-stage { position: relative; width: clamp(260px, 34vw, 360px); height: clamp(260px, 34vw, 360px); opacity: 0; transform: translateY(30px); transition: opacity 1.2s ease-out, transform 1.2s ease-out; }
        .ml-music.in .ml-vinyl-stage { opacity: 1; transform: none; }
        .ml-vinyl { position: relative; width: 100%; height: 100%; }
        .ml-vinyl-disc { position: relative; width: 100%; height: 100%; border-radius: 999px; background: radial-gradient(circle at 30% 30%, #2a2229 0%, #0d0a10 60%, #050307 100%); box-shadow: 0 40px 100px rgba(0,0,0,.7), 0 0 0 1px rgba(212,162,87,.15), inset 0 0 40px rgba(0,0,0,.6); animation: ml-spin 8s linear infinite; animation-play-state: paused; }
        .ml-music.is-playing .ml-vinyl-disc { animation-play-state: running; }
        .ml-vinyl-grooves { position: absolute; inset: 6%; border-radius: 999px; border: 1px solid rgba(255,255,255,.03); box-shadow: inset 0 0 0 1px rgba(255,255,255,.02), inset 0 0 0 10px rgba(0,0,0,.5), inset 0 0 0 12px rgba(255,255,255,.02), inset 0 0 0 22px rgba(0,0,0,.5), inset 0 0 0 24px rgba(255,255,255,.02), inset 0 0 0 40px rgba(0,0,0,.5), inset 0 0 0 42px rgba(255,255,255,.02); }
        .ml-vinyl-grooves-2 { inset: 24%; }
        .ml-vinyl-label { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 36%; height: 36%; border-radius: 999px; overflow: hidden; box-shadow: 0 0 0 2px ${GOLD}, 0 0 20px rgba(212,162,87,.4); background: ${NIGHT_2}; display: flex; align-items: center; justify-content: center; color: ${GOLD}; font-size: 60px; }
        .ml-vinyl-label img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(60%) brightness(.9); transition: filter .8s ease; }
        .ml-music.is-playing .ml-vinyl-label img { filter: grayscale(0) brightness(1); }
        .ml-vinyl-hole { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 10px; height: 10px; border-radius: 999px; background: ${NIGHT}; box-shadow: 0 0 0 1px rgba(212,162,87,.4); }
        .ml-vinyl-shine { position: absolute; inset: 0; border-radius: 999px; background: linear-gradient(120deg, transparent 40%, rgba(255,255,255,.06) 50%, transparent 60%); pointer-events: none; }
        .ml-tonearm { position: absolute; top: -6%; right: -6%; width: 40%; height: 65%; pointer-events: none; transform-origin: 100% 0%; transform: rotate(-18deg); transition: transform .8s cubic-bezier(.2,.7,.2,1); }
        .ml-music.is-playing .ml-tonearm { transform: rotate(-4deg); }
        .ml-tonearm-base { position: absolute; top: 0; right: 0; width: 22px; height: 22px; border-radius: 999px; background: linear-gradient(135deg, ${GOLD}, #8a6a3f); box-shadow: 0 4px 12px rgba(0,0,0,.6); }
        .ml-tonearm-rod { position: absolute; top: 8px; right: 8px; width: 2px; height: 90%; background: linear-gradient(180deg, ${GOLD}, #8a6a3f); transform-origin: top; transform: rotate(28deg); box-shadow: 0 2px 6px rgba(0,0,0,.5); }
        .ml-tonearm-head { position: absolute; bottom: 6%; left: 8%; width: 14px; height: 20px; background: ${GOLD}; border-radius: 3px; box-shadow: 0 4px 10px rgba(0,0,0,.6); }
        .ml-vinyl-play { position: absolute; inset: 0; margin: auto; width: 72px; height: 72px; border-radius: 999px; background: ${GOLD}; color: ${NIGHT}; border: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 40px rgba(212,162,87,.5), 0 0 0 1px rgba(255,255,255,.15); opacity: 0; transition: opacity .3s ease, transform .3s ease; z-index: 3; }
        .ml-vinyl-stage:hover .ml-vinyl-play, .ml-music.is-playing .ml-vinyl-play { opacity: 1; }
        .ml-vinyl-play:hover { transform: scale(1.08); }
        .ml-music-eyebrow { margin: 40px 0 0; font-size: 10px; letter-spacing: .5em; text-transform: uppercase; color: ${GOLD}; opacity: 0; transition: opacity 1s ease-out .3s; }
        .ml-music-title { margin: 12px 0 4px; font-size: clamp(28px, 4vw, 46px); font-style: italic; color: ${IVORY}; opacity: 0; transition: opacity 1s ease-out .5s, transform 1s ease-out .5s; transform: translateY(10px); }
        .ml-music-artist { margin: 0; font-size: 11px; letter-spacing: .35em; text-transform: uppercase; color: rgba(244,235,221,.5); opacity: 0; transition: opacity 1s ease-out .7s; }
        .ml-music.in .ml-music-eyebrow, .ml-music.in .ml-music-title, .ml-music.in .ml-music-artist { opacity: 1; transform: none; }
        .ml-eq { display: flex; align-items: center; gap: 3px; height: 32px; margin: 28px 0 0; }
        .ml-eq span { display: block; width: 2px; height: 100%; background: linear-gradient(180deg, ${GOLD_HI}, ${GOLD}); transform-origin: bottom; transform: scaleY(.3); animation: ml-eq 1.1s ease-in-out infinite; transition: opacity .4s ease; }
        .ml-music-controls { margin-top: 24px; width: 100%; display: flex; align-items: center; gap: 14px; opacity: 0; transition: opacity 1s ease-out .9s; }
        .ml-music.in .ml-music-controls { opacity: 1; }
        .ml-music-track { flex: 1; height: 1px; background: rgba(244,235,221,.15); position: relative; overflow: hidden; }
        .ml-music-fill { height: 100%; background: linear-gradient(90deg, ${GOLD}, ${GOLD_HI}); transition: width .2s linear; box-shadow: 0 0 8px ${GOLD}; }
        .ml-music-time { font-size: 10px; letter-spacing: .2em; color: rgba(244,235,221,.5); font-variant-numeric: tabular-nums; min-width: 32px; }

        /* ============ GALLERY ============ */
        .ml-gallery { padding: clamp(50px, 8vh, 100px) clamp(20px, 5vw, 80px); max-width: 1400px; margin: 0 auto; }
        .ml-gallery-grid { display: grid; gap: clamp(20px, 3vw, 48px); }
        .v-0 .ml-gallery-grid { grid-template-columns: 1.6fr 1fr; grid-template-rows: auto auto; grid-template-areas: "a b" "a c"; }
        .v-0 .g0-a { grid-area: a; } .v-0 .g0-b { grid-area: b; } .v-0 .g0-c { grid-area: c; margin-left: 20%; }
        .v-1 .ml-gallery-grid { grid-template-columns: 1fr 1.4fr; grid-template-rows: auto auto; grid-template-areas: "a b" "a c"; }
        .v-1 .g1-a { grid-area: a; margin-top: 8%; } .v-1 .g1-b { grid-area: b; } .v-1 .g1-c { grid-area: c; margin-right: 15%; }
        .v-2 .ml-gallery-grid { grid-template-columns: 1fr 1fr 1fr; grid-template-areas: "a b b" "a c c"; }
        .v-2 .g2-a { grid-area: a; margin-top: 15%; } .v-2 .g2-b { grid-area: b; } .v-2 .g2-c { grid-area: c; margin-left: 15%; }
        @media (max-width: 720px) { .ml-gallery-grid { grid-template-columns: 1fr !important; grid-template-areas: none !important; } .ml-gallery-grid > * { grid-area: auto !important; margin: 0 !important; } }
        @keyframes ml-float-a { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-10px) rotate(.3deg); } }
        @keyframes ml-float-b { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-14px) rotate(-.4deg); } }
        @keyframes ml-float-c { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-8px) rotate(.2deg); } }
        @keyframes ml-sheen { 0% { transform: translateX(-120%) skewX(-18deg); } 100% { transform: translateX(220%) skewX(-18deg); } }
        @keyframes ml-corner-in { 0% { opacity: 0; transform: scale(.4); } 100% { opacity: 1; transform: scale(1); } }
        .ml-tile { position: relative; padding: 0; border: 0; background: transparent; display: block; width: 100%; cursor: zoom-in; opacity: 0; transform: translateY(60px) scale(.96); filter: blur(14px); transition: opacity 1.3s cubic-bezier(.2,.7,.2,1), transform 1.3s cubic-bezier(.2,.7,.2,1), filter 1.3s ease-out; }
        .ml-gallery.in .ml-tile { opacity: 1; transform: none; filter: none; }
        .ml-tile-frame { position: relative; display: block; width: 100%; padding: clamp(10px, 1.4vw, 20px); background: linear-gradient(140deg, rgba(212,162,87,.32) 0%, rgba(212,162,87,.08) 40%, rgba(212,162,87,.02) 60%, rgba(212,162,87,.28) 100%); box-shadow: 0 40px 90px -20px rgba(0,0,0,.8), 0 0 0 1px rgba(212,162,87,.35), inset 0 0 0 1px rgba(255,255,255,.04), inset 0 0 40px rgba(0,0,0,.4); animation: ml-float-a 9s ease-in-out infinite; will-change: transform; }
        .g0-b .ml-tile-frame, .g1-b .ml-tile-frame, .g2-b .ml-tile-frame { animation-name: ml-float-b; animation-duration: 11s; animation-delay: -3s; }
        .g0-c .ml-tile-frame, .g1-c .ml-tile-frame, .g2-c .ml-tile-frame { animation-name: ml-float-c; animation-duration: 13s; animation-delay: -6s; }
        .ml-tile-mat { position: relative; display: block; width: 100%; height: 100%; padding: 6px; background: ${NIGHT}; box-shadow: inset 0 0 0 1px rgba(212,162,87,.5), inset 0 0 30px rgba(0,0,0,.7); }
        .ml-tile-inner { position: relative; display: block; width: 100%; height: 100%; overflow: hidden; background: ${NIGHT_2}; }
        .ml-tile-inner img { width: 100%; height: 100%; object-fit: cover; filter: brightness(.82) saturate(.92) contrast(1.05); transition: filter 1.2s ease; will-change: transform; }
        .ml-tile:hover .ml-tile-inner img { filter: brightness(1.05) saturate(1.1) contrast(1.02); }
        .ml-tile-vignette { position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%); pointer-events: none; }
        .ml-tile-sheen { position: absolute; top: 0; bottom: 0; left: 0; width: 40%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent); pointer-events: none; transform: translateX(-120%) skewX(-18deg); }
        .ml-tile:hover .ml-tile-sheen { animation: ml-sheen 1.4s ease-out; }
        .ml-tile-corner { position: absolute; width: clamp(22px, 2.4vw, 34px); height: clamp(22px, 2.4vw, 34px); color: ${GOLD}; opacity: 0; pointer-events: none; }
        .ml-gallery.in .ml-tile-corner { animation: ml-corner-in .8s cubic-bezier(.2,.7,.2,1) 1.2s forwards; }
        .ml-tile-corner svg { width: 100%; height: 100%; filter: drop-shadow(0 2px 6px rgba(0,0,0,.6)); }
        .ml-tile-corner.tl { top: -2px; left: -2px; }
        .ml-tile-corner.tr { top: -2px; right: -2px; }
        .ml-tile-corner.bl { bottom: -2px; left: -2px; }
        .ml-tile-corner.br { bottom: -2px; right: -2px; }
        .ml-tile:hover .ml-tile-corner { color: ${GOLD_HI}; }
        .ml-tile-shine { position: absolute; inset: -12px; border: 1px solid rgba(212,162,87,0); pointer-events: none; transition: inset .5s cubic-bezier(.2,.7,.2,1), border-color .5s ease, box-shadow .5s ease; }
        .ml-tile:hover .ml-tile-shine { inset: -22px; border-color: rgba(212,162,87,.4); box-shadow: 0 0 80px rgba(212,162,87,.2); }
        .ml-tile:hover .ml-tile-frame { animation-play-state: paused; }
        .ml-tile-num { position: absolute; top: -28px; left: -18px; z-index: 4; font-size: clamp(48px, 5vw, 76px); font-style: italic; color: ${GOLD}; opacity: .9; text-shadow: 0 6px 24px rgba(0,0,0,.8); pointer-events: none; line-height: 1; }

        /* ============ ENCERRAMENTO ============ */
        .ml-end { position: relative; padding: clamp(140px, 22vh, 240px) 24px; text-align: center; overflow: hidden; }
        .ml-end-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 800px; height: 800px; max-width: 90vw; max-height: 90vw; background: radial-gradient(circle, rgba(212,162,87,.18), transparent 60%); filter: blur(60px); animation: ml-glow-pulse 6s ease-in-out infinite; pointer-events: none; }
        .ml-end-inner { position: relative; max-width: 760px; margin: 0 auto; opacity: 0; transform: translateY(30px); filter: blur(12px); transition: opacity 1.4s ease-out, transform 1.4s ease-out, filter 1.4s ease-out; }
        .ml-end.in .ml-end-inner { opacity: 1; transform: none; filter: none; }
        .ml-end-kicker { font-size: 10px; letter-spacing: .5em; text-transform: uppercase; color: ${GOLD}; margin: 0 0 32px; }
        .ml-end-quote { margin: 0; font-size: clamp(34px, 5.5vw, 64px); line-height: 1.2; font-weight: 400; font-style: italic; color: ${IVORY}; }
        .ml-end-quote em { color: ${GOLD}; font-style: italic; }
        .ml-end-seal { position: relative; width: 160px; height: 160px; margin: 80px auto 40px; color: ${GOLD}; display: flex; align-items: center; justify-content: center; }
        .ml-end-seal svg { position: absolute; inset: 0; width: 100%; height: 100%; }
        .ml-end.in .ml-end-ring { animation: ml-draw 2s ease-out .3s forwards; }
        .ml-end.in .ml-end-ring-2 { animation: ml-draw 2s ease-out .6s forwards; }
        .ml-end.in .ml-end-star { animation: ml-draw 2.2s ease-out 1s forwards; }
        .ml-end-mark { font-size: 48px; font-style: italic; color: ${GOLD}; opacity: 0; transition: opacity 1s ease-out 2.2s; }
        .ml-end.in .ml-end-mark { opacity: 1; }
        .ml-end-foot { margin: 40px 0 0; font-size: 9px; letter-spacing: .6em; text-transform: uppercase; color: rgba(244,235,221,.3); }

        /* ============ LIGHTBOX ============ */
        .ml-lb { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.96); display: flex; align-items: center; justify-content: center; animation: ml-fade .4s ease-out; backdrop-filter: blur(10px); }
        .ml-lb-img { max-width: 92vw; max-height: 88vh; object-fit: contain; box-shadow: 0 60px 140px rgba(0,0,0,.8), 0 0 0 1px rgba(212,162,87,.2); animation: ml-rise .6s ease-out; }
        .ml-lb-count { position: absolute; top: 30px; left: 50%; transform: translateX(-50%); font-size: 10px; letter-spacing: .4em; color: rgba(244,235,221,.5); }
        .ml-lb-btn { position: absolute; width: 46px; height: 46px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: rgba(244,235,221,.06); backdrop-filter: blur(8px); color: ${IVORY}; border: 1px solid rgba(212,162,87,.2); transition: background .2s ease, border-color .2s ease, transform .2s ease; }
        .ml-lb-btn:hover { background: rgba(212,162,87,.2); border-color: rgba(212,162,87,.6); transform: scale(1.08); }
        .ml-lb-close { top: 22px; right: 22px; }
        .ml-lb-prev { left: 22px; top: 50%; transform: translateY(-50%); display: none; }
        .ml-lb-next { right: 22px; top: 50%; transform: translateY(-50%); display: none; }
        @media (min-width: 720px) { .ml-lb-prev, .ml-lb-next { display: flex; } }
      `}</style>

      {!prologueDone && <Prologue onDone={() => setPrologueDone(true)} />}
      <ProgressBar />

      <ChapterHero name={memory.father_name} photo={hero} occasion={memory.occasion} ready={prologueDone} />

      <ChapterMark n="I" title="A carta" subtitle="Palavras que atravessam o tempo" />
      <ChapterLetter message={memory.message} sender={memory.sender_name} />

      {hasMusic && (
        <>
          <ChapterMark n="II" title="A canção" subtitle="A trilha desta memória" />
          <ChapterMusic
            title={memory.music_title ?? "Trilha"}
            artist={memory.music_artist ?? ""}
            cover={memory.music_cover ?? ""}
            src={memory.music_preview_url!}
          />
        </>
      )}

      {blocks.length > 0 && (
        <>
          <ChapterMark n={hasMusic ? "III" : "II"} title="Momentos eternos" subtitle="Instantes onde o tempo parou" />
          {blocks.map((b, i) => (
            <GalleryBlock key={i} photos={b} startIndex={i * 3} variant={i} onOpen={(abs) => setLightbox(abs)} />
          ))}
        </>
      )}

      <ChapterEnd />

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
