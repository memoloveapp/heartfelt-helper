import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";
import gypsophila from "@/assets/letter-gypsophila.png";
import letterPaper from "@/assets/letter-paper.png";



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
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,500;1,700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Inter:wght@300;400;500;600&family=Dancing+Script:wght@500;600&display=swap",
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
        <p className={`ml-h-eyebrow ${ready ? "in" : ""}`} style={BODY}>PARA O MEU</p>
        <h1 className={`ml-h-name ${ready ? "in" : ""}`} style={SERIF}>Pai.</h1>
        <div className={`ml-h-rule ${ready ? "in" : ""}`} aria-hidden>
          <span className="ml-h-rule-line" />
          <svg className="ml-h-rule-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 20.5s-6.5-4.2-8.8-8.4A4.9 4.9 0 0 1 12 6.2a4.9 4.9 0 0 1 8.8 5.9C18.5 16.3 12 20.5 12 20.5z"/></svg>
          <span className="ml-h-rule-line" />
        </div>
        <p className={`ml-h-sub ${ready ? "in" : ""}`} style={BODY}>Meu maior exemplo.</p>
      </div>
      <div className={`ml-h-scroll ${ready ? "in" : ""}`} aria-hidden>
        <svg className="ml-h-scroll-chev" width="16" height="26" viewBox="0 0 16 26" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 1v22M2 17l6 6 6-6"/></svg>
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
  const { ref, seen } = useInView<HTMLElement>(0.12);
  const paragraphs = (message ?? "").trim().split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);
  const lines = paragraphs.length ? paragraphs : ["Uma mensagem especial em breve."];
  return (
    <section ref={ref} className={`ml-letter ${seen ? "in" : ""}`} data-chapter>
      <article className="ml-letter-paper">
        <img src={letterPaper} alt="" className="ml-letter-sheet" loading="lazy" width={1283} height={1820} />

        <div className="ml-letter-paper-inner">
          <header className="ml-letter-head">
            <span className="ml-letter-eyebrow">CARTA PARA VOCÊ</span>
            <span className="ml-letter-rule" aria-hidden>
              <span className="ml-letter-rule-line" />
              <svg viewBox="0 0 24 24" width="14" height="14" fill="#C79A5A" aria-hidden><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z" /></svg>
              <span className="ml-letter-rule-line" />
            </span>
          </header>

          <div className="ml-letter-body">
            {lines.map((p, i) => (
              <p key={i} className={`ml-letter-line ${i === 0 ? "ml-letter-line-first" : ""}`} style={{ animationDelay: `${350 + i * 500}ms` }}>{p}</p>
            ))}
          </div>

          {sender && (
            <footer className="ml-letter-foot" style={{ animationDelay: `${350 + lines.length * 500 + 200}ms` }}>
              <span className="ml-letter-sign">{sender}</span>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#C79A5A" aria-hidden><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z" /></svg>
            </footer>
          )}

          <img src={gypsophila} alt="" className="ml-letter-branch" loading="lazy" width={768} height={1024} />
        </div>
      </article>

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
    <section ref={ref} className={`ml-music ${seen ? "in" : ""} ${playing ? "is-playing" : ""}`} data-chapter id="capitulo-musica">
      <div className="ml-player">
        <div className="ml-player-cover">
          {cover ? <img src={cover} alt="" /> : <span style={SERIF}>♪</span>}
        </div>
        <div className="ml-player-main">
          <div className="ml-player-info">
            <h3 className="ml-player-title">{title}</h3>
            {artist && <p className="ml-player-artist">{artist}</p>}
          </div>
          <div className="ml-player-progress">
            <div className="ml-player-track">
              <div className="ml-player-fill" style={{ width: `${pct}%` }} />
              <span className="ml-player-thumb" style={{ left: `${pct}%` }} />
            </div>
            <div className="ml-player-times">
              <span>{fmt(current)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>
          <div className="ml-player-controls">
            <button type="button" className="ml-player-btn" aria-label="Aleatório">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/></svg>
            </button>
            <button type="button" className="ml-player-btn" aria-label="Anterior">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM9.5 12l10 6V6z"/></svg>
            </button>
            <button type="button" onClick={toggle} className="ml-player-play" aria-label={playing ? "Pausar" : "Tocar"}>
              {playing ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button type="button" className="ml-player-btn" aria-label="Próxima">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM4.5 18l10-6-10-6z"/></svg>
            </button>
            <button type="button" className="ml-player-btn" aria-label="Favoritar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
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
        html, body { background: #EFE5CF; }
        .ml-root { background: #EFE5CF; color: ${IVORY}; position: relative; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
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
        @keyframes ml-kb-soft {
          0%   { transform: scale(1.06) translate(-1.2%, -0.8%); }
          50%  { transform: scale(1.10) translate(1%, 1%); }
          100% { transform: scale(1.06) translate(-1.2%, -0.8%); }
        }
        @keyframes ml-h-in { 0% { opacity: 0; transform: translateY(32px) scale(.985); filter: blur(14px); letter-spacing: .04em; } 60% { filter: blur(2px); } 100% { opacity: 1; transform: none; filter: none; } }
        @keyframes ml-h-name-in { 0% { opacity: 0; transform: translateY(46px) scale(.94); filter: blur(20px); } 55% { opacity: 1; filter: blur(3px); } 100% { opacity: 1; transform: none; filter: none; } }
        @keyframes ml-h-shimmer { 0%,92%,100% { background-position: 200% 0; } 50% { background-position: -50% 0; } }
        @keyframes ml-h-rule-in { 0% { opacity: 0; transform: scaleX(0); } 100% { opacity: 1; transform: scaleX(1); } }
        @keyframes ml-h-breath { 0%,100% { opacity: .5; transform: translate(-50%, 0); } 50% { opacity: 1; transform: translate(-50%, 4px); } }

        .ml-hero { position: relative; height: 100vh; height: 100svh; width: 100vw; overflow: hidden; background: #000; margin: 0; padding: 0; }
        .ml-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; opacity: 0; transform-origin: center; animation: ml-fade 1.8s ease-out .1s forwards, ml-kb-soft 28s ease-in-out 1.8s infinite; }
        .ml-hero-veil {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(68% 50% at 22% 88%, rgba(0,0,0,.72) 0%, rgba(0,0,0,.4) 46%, rgba(0,0,0,.14) 72%, rgba(0,0,0,0) 92%),
            linear-gradient(180deg,
              rgba(0,0,0,.18) 0%,
              rgba(0,0,0,.05) 30%,
              rgba(0,0,0,.32) 62%,
              rgba(0,0,0,.72) 88%,
              rgba(0,0,0,.9) 100%);
        }

        .ml-hero-content {
          position: absolute;
          left: clamp(28px, 5vw, 72px);
          right: 24px;
          bottom: clamp(120px, 17vh, 174px);
          z-index: 3;
          max-width: 88vw;
          text-align: left;
          color: ${IVORY};
          overflow: visible;
        }
        .ml-hero-content::before {
          content: "";
          position: absolute;
          left: -8%; right: -20%;
          top: -18%; bottom: -30%;
          background: radial-gradient(ellipse at 30% 65%, rgba(0,0,0,.55) 0%, rgba(0,0,0,.32) 38%, rgba(0,0,0,.12) 62%, rgba(0,0,0,0) 82%);
          filter: blur(24px);
          z-index: -1;
          pointer-events: none;
        }
        .ml-h-eyebrow {
          margin: 0 0 2px;
          font-family: "Inter", system-ui, -apple-system, sans-serif;
          font-size: clamp(12px, 1vw, 14px);
          font-weight: 500;
          letter-spacing: .32em;
          text-transform: uppercase;
          color: #E8C286;
          opacity: 0;
          text-shadow: 0 1px 2px rgba(0,0,0,.85), 0 2px 16px rgba(0,0,0,.7);
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
        }
        .ml-h-eyebrow.in { animation: ml-h-in 1.1s cubic-bezier(.16,.84,.24,1) .35s forwards; }
        .ml-h-name {
          margin: 0;
          padding: 0 0 .04em;
          font-family: "Playfair Display", "Didot", Georgia, serif;
          font-weight: 500;
          font-style: normal;
          font-size: clamp(119px, 21.6vw, 216px);
          line-height: .9;
          letter-spacing: -.028em;
          color: ${IVORY};
          text-shadow: 0 8px 40px rgba(0,0,0,.55), 0 2px 12px rgba(0,0,0,.5);
          opacity: 0;
          overflow: visible;
          transform-origin: left bottom;
          font-feature-settings: "kern" 1, "liga" 1, "dlig" 1, "onum" 1;
          font-kerning: normal;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: geometricPrecision;
        }
        .ml-h-name.in { animation: ml-h-name-in 1.6s cubic-bezier(.16,.84,.24,1) .7s forwards; }
        .ml-h-rule {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 72px;
          margin: 8px 0 0;
          transform-origin: left center;
          transform: scaleX(0);
          opacity: 0;
        }
        .ml-h-rule-line { flex: 1; height: 1px; background: #E1BB82; opacity: .9; }
        .ml-h-rule-heart { width: 10px; height: 10px; flex: none; color: #E1BB82; filter: drop-shadow(0 0 8px rgba(225,187,130,.7)); animation: ml-heart-beat 1.2s ease-in-out infinite; transform-origin: center; }
        @keyframes ml-heart-beat {
          0%   { transform: scale(1);    filter: drop-shadow(0 0 6px rgba(225,187,130,.55)); }
          14%  { transform: scale(1.32); filter: drop-shadow(0 0 12px rgba(225,187,130,.95)); }
          28%  { transform: scale(1);    filter: drop-shadow(0 0 6px rgba(225,187,130,.55)); }
          42%  { transform: scale(1.22); filter: drop-shadow(0 0 10px rgba(225,187,130,.85)); }
          70%,100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(225,187,130,.55)); }
        }
        .ml-h-rule.in { animation: ml-h-rule-in 1.1s cubic-bezier(.16,.84,.24,1) 1.6s forwards; }
        .ml-h-sub {
          margin: 12px 0 0;
          font-family: "Inter", system-ui, -apple-system, sans-serif;
          font-style: normal;
          font-weight: 300;
          font-size: clamp(14px, 1.1vw, 16px);
          line-height: 1.55;
          letter-spacing: .06em;
          color: rgba(244,235,221,.92);
          opacity: 0;
          text-shadow: 0 2px 12px rgba(0,0,0,.6);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: geometricPrecision;
        }
        .ml-h-sub.in { animation: ml-h-in 1.2s cubic-bezier(.16,.84,.24,1) 2.1s forwards; }

        .ml-h-scroll {
          position: absolute;
          left: 50%; bottom: clamp(28px, 4vh, 42px);
          transform: translate(-50%, 0);
          color: ${GOLD};
          opacity: 0;
          z-index: 4;
        }
        .ml-h-scroll.in { animation: ml-fade 1s ease-out 1.8s forwards, ml-h-breath 3.2s ease-in-out 2.8s infinite; }
        .ml-h-scroll-chev { display: block; opacity: .75; filter: drop-shadow(0 0 6px rgba(212,162,87,.4)); }

        @media (max-width: 640px) {
          .ml-hero-img { object-position: center center; }
          .ml-hero-content { left: 28px; right: 20px; bottom: clamp(88px, 12vh, 120px); max-width: 88vw; }
          .ml-h-name { font-size: clamp(96px, 26vw, 150px); }
          .ml-h-rule { width: clamp(140px, 40vw, 200px); }
        }


        /* ============ CHAPTER MARK ============ */
        .ml-mark { padding: clamp(120px, 20vh, 200px) 24px 40px; text-align: center; max-width: 720px; margin: 0 auto; opacity: 0; transform: translateY(30px); transition: opacity 1.2s ease-out, transform 1.2s ease-out; }
        .ml-mark.in { opacity: 1; transform: none; }
        .ml-mark-num { display: block; font-size: clamp(80px, 12vw, 140px); font-style: italic; color: ${GOLD}; opacity: .25; line-height: 1; letter-spacing: -.02em; }
        .ml-mark-line { display: block; width: 1px; height: 60px; background: linear-gradient(180deg, ${GOLD}, transparent); margin: 24px auto; }
        .ml-mark-title { margin: 0; font-size: clamp(32px, 5vw, 56px); font-style: italic; font-weight: 400; color: ${IVORY}; letter-spacing: -.01em; }
        .ml-mark-sub { margin: 16px 0 0; font-size: 12px; letter-spacing: .3em; text-transform: uppercase; color: rgba(244,235,221,.45); }

        /* ============ CARTA ============ */
        .ml-letter { position: relative; padding: 0; max-width: none; margin: 0; width: 100%; overflow: hidden; }
        .ml-letter-paper {
          position: relative; opacity: 0; transform: translateY(30px);
          transition: opacity 1.4s ease-out, transform 1.4s ease-out;
          filter: drop-shadow(0 40px 60px rgba(0,0,0,.55)) drop-shadow(0 10px 25px rgba(0,0,0,.35));
        }
        .ml-letter.in .ml-letter-paper { opacity: 1; transform: none; }
        .ml-letter-paper::before {
          content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background:
            linear-gradient(90deg, rgba(120,80,45,.55) 0%, rgba(150,105,65,.22) 7%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 82%, rgba(150,105,65,.22) 93%, rgba(120,80,45,.55) 100%),
            radial-gradient(ellipse at 50% 50%, rgba(255,240,220,.25) 0%, rgba(229,208,186,0) 65%);
          mix-blend-mode: multiply;
        }
        .ml-letter-sheet {
          position: absolute; top: -2px; bottom: -2px; left: -5%; width: 110%; max-width: none; height: calc(100% + 4px);
          object-fit: fill;
          pointer-events: none; user-select: none;
          z-index: 0;
          background-color: #E5D0BA;
          mix-blend-mode: multiply;
        }
        .ml-letter-paper-inner {
          position: relative; z-index: 1;
          padding: clamp(90px, 12vh, 150px) clamp(44px, 9vw, 130px) clamp(90px, 14vh, 160px);
        }

        .ml-letter-head { text-align: center; margin: 0 auto clamp(40px, 6vh, 70px); }
        .ml-letter-eyebrow { display: block; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; letter-spacing: .5em; color: #C79A5A; text-transform: uppercase; padding-left: .5em; }
        .ml-letter-rule { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 22px; }
        .ml-letter-rule-line { display: block; width: clamp(80px, 14vw, 140px); height: 1px; background: linear-gradient(90deg, transparent, #C79A5A 40%, #C79A5A 60%, transparent); opacity: .9; }
        .ml-letter-rule svg { animation: ml-heart-beat 1.4s ease-in-out infinite; filter: drop-shadow(0 0 6px rgba(199,154,90,.6)); }

        .ml-letter-body { position: relative; z-index: 2; max-width: 640px; margin: 0 auto; }
        .ml-letter-line { margin: 0 0 1.6em; font-family: 'Cormorant Garamond', 'Playfair Display', serif; font-size: clamp(20px, 2.1vw, 26px); line-height: 1.7; color: #2B2018; font-weight: 400; font-style: normal; opacity: 0; letter-spacing: .005em; }
        .ml-letter.in .ml-letter-line { animation: ml-rise 1.4s ease-out forwards; }
        .ml-letter-line:last-child { margin-bottom: 0; }
        .ml-letter-line-first::first-letter {
          font-family: 'Playfair Display', serif;
          font-size: 4.6em; float: left; line-height: .82; padding: .06em .12em 0 0;
          color: #C79A5A; font-weight: 600; font-style: normal;
        }

        .ml-letter-foot { position: relative; z-index: 2; margin: clamp(48px, 7vh, 80px) auto 0; max-width: 640px; display: flex; align-items: center; gap: 12px; opacity: 0; }
        .ml-letter.in .ml-letter-foot { animation: ml-rise 1.2s ease-out forwards; }
        .ml-letter-sign { font-family: 'Dancing Script', 'Cormorant Garamond', cursive; font-size: clamp(38px, 4.4vw, 56px); color: #C79A5A; line-height: 1; font-weight: 600; }
        .ml-letter-foot svg { animation: ml-heart-beat 1.4s ease-in-out infinite; filter: drop-shadow(0 0 8px rgba(199,154,90,.5)); }

        .ml-letter-branch { position: absolute; right: -20px; bottom: -10px; width: clamp(240px, 32vw, 420px); height: auto; pointer-events: none; opacity: .95; transform: rotate(-6deg); z-index: 2; }

        .ml-letter-scroll { position: absolute; left: 50%; bottom: 6px; transform: translateX(-50%); width: 56px; height: 56px; border-radius: 999px; background: ${NIGHT}; color: ${GOLD}; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(212,162,87,.5); box-shadow: 0 10px 30px rgba(0,0,0,.6); animation: ml-bounce 2.2s ease-in-out infinite; z-index: 3; text-decoration: none; }
        .ml-letter-scroll:hover { background: ${GOLD}; color: ${NIGHT}; }
        @keyframes ml-bounce { 0%,100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 8px); } }

        @media (max-width: 720px) {
          .ml-letter { padding: 0; }
          .ml-letter-paper-inner { padding: 90px 26px 100px; }
          .ml-letter-branch { width: 190px; right: -14px; bottom: 0; opacity: .9; }
          .ml-letter-line-first::first-letter { font-size: 3.8em; }
        }



        /* ============ MÚSICA (Player estilo referência) ============ */
        .ml-music { position: relative; padding: 0 24px clamp(40px, 6vh, 80px); margin-top: -40px; display: flex; align-items: center; justify-content: center; background: transparent; }
        .ml-player {
          width: 100%; max-width: 480px;
          background: #0E0E10;
          border-radius: 28px;
          padding: 20px;
          display: flex; align-items: stretch; gap: 20px;
          box-shadow: 0 30px 80px -20px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.04);
          color: #F4EBDD;
        }
        .ml-player-cover {
          flex: 0 0 auto; width: 110px; height: 110px; border-radius: 14px; overflow: hidden;
          background: #1a1a1e; display: flex; align-items: center; justify-content: center;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.05);
        }
        .ml-player-cover img { width: 100%; height: 100%; object-fit: cover; }
        .ml-player-main { flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; padding: 4px 6px 4px 0; }
        .ml-player-info { min-width: 0; }
        .ml-player-title { margin: 0; font-family: 'Inter', system-ui, sans-serif; font-size: 26px; font-weight: 600; font-style: normal; color: #F4EBDD; line-height: 1.15; letter-spacing: -.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ml-player-artist { margin: 4px 0 0; font-family: 'Inter', sans-serif; font-size: 15px; color: rgba(244,235,221,.55); font-weight: 400; }
        .ml-player-progress { margin-top: 14px; }
        .ml-player-track { position: relative; width: 100%; height: 4px; background: rgba(244,235,221,.18); border-radius: 4px; overflow: visible; }
        .ml-player-fill { position: absolute; top: 0; left: 0; height: 100%; background: #E9A268; border-radius: 4px; transition: width .2s linear; }
        .ml-player-thumb { position: absolute; top: 50%; width: 10px; height: 10px; border-radius: 999px; background: #E9A268; transform: translate(-50%, -50%); box-shadow: 0 0 10px rgba(233,162,104,.55); }
        .ml-player-times { display: flex; justify-content: space-between; margin-top: 8px; font-family: 'Inter', sans-serif; font-size: 12px; color: rgba(244,235,221,.5); font-variant-numeric: tabular-nums; }
        .ml-player-controls { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; gap: 8px; }
        .ml-player-btn { background: transparent; border: 0; color: rgba(244,235,221,.85); cursor: pointer; padding: 6px; display: flex; align-items: center; justify-content: center; transition: color .2s ease, transform .2s ease; }
        .ml-player-btn:hover { color: #E9A268; transform: scale(1.08); }
        .ml-player-play {
          width: 58px; height: 58px; border-radius: 999px; border: 0; cursor: pointer;
          background: linear-gradient(160deg, #F0B27A 0%, #D68A4C 100%); color: #1a1109;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 10px 28px rgba(214,138,76,.5), inset 0 1px 0 rgba(255,255,255,.35);
          transition: transform .2s ease;
        }
        .ml-player-play:hover { transform: scale(1.06); }

        @media (max-width: 640px) {
          .ml-player { flex-direction: column; padding: 16px; border-radius: 22px; }
          .ml-player-cover { width: 100%; height: 220px; }
          .ml-player-title { white-space: normal; font-size: 24px; }
        }


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

      <ChapterLetter message={memory.message} sender={memory.sender_name} />


      {hasMusic && (
        <>
          
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
