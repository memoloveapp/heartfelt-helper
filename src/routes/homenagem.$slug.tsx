import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";

/* ============================================================
   /homenagem/$slug — "Diário Íntimo"
   Reconstrução total. Nova identidade visual.
   Paleta: marfim quente, âmbar profundo, dourado antigo.
   ============================================================ */

const IVORY = "#F4EBDD";
const IVORY_DEEP = "#EADDC7";
const UMBER = "#3A2A1E";
const AMBER = "#B8823A";
const GOLD_SOFT = "#D4A96A";

const SERIF = { fontFamily: '"Cormorant Garamond", Georgia, serif' } as const;
const DISPLAY = { fontFamily: '"Fraunces", "Cormorant Garamond", Georgia, serif' } as const;
const MICRO = { fontFamily: '"Inter", system-ui, sans-serif' } as const;

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
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,400;1,9..144,500&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@300;400;500&display=swap",
      },
    ],
  }),
  component: HomenagemPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: IVORY, color: UMBER }}>
      <div>
        <h1 className="text-2xl mb-2" style={SERIF}>Ops…</h1>
        <p className="text-sm opacity-70">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: IVORY, color: UMBER }}>
      <p style={SERIF}>Memória não encontrada.</p>
    </div>
  ),
  ssr: false,
});

/* ---------------- Observador de entrada ---------------- */
function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }),
      { threshold, rootMargin: "0px 0px -5% 0px" }
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
   Cover — hero em marfim, foto com cantos suaves e vinheta clara
   ========================================================= */
function ChapterCover({ name, photo, occasion }: { name: string; photo: string; occasion: string | null }) {
  const subtitle = occasion?.trim() || "Meu herói. Meu exemplo.";
  return (
    <section className="di-cover" data-chapter>
      {photo && <img src={photo} alt="" aria-hidden loading="eager" className="di-cover-img" />}
      <div className="di-cover-veil" />
      <div className="di-cover-content">
        <div className="di-cover-eyebrow" style={DISPLAY}>Para o meu</div>
        <h1 className="di-cover-name" style={DISPLAY}>{name}</h1>
        <div className="di-cover-heart" aria-hidden>♡</div>
        <p className="di-cover-sub" style={DISPLAY}>{subtitle}</p>
      </div>
      <div className="di-cover-arrow" aria-hidden>
        <svg viewBox="0 0 44 44" width="44" height="44" fill="none">
          <circle cx="22" cy="22" r="21" stroke="rgba(244,235,221,.75)" strokeWidth="1" />
          <path d="M15 20l7 7 7-7" stroke="rgba(244,235,221,.85)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}

/* =========================================================
   Letter — página de diário, tinta sépia
   ========================================================= */
function ChapterLetter({ message, sender }: { message: string; sender: string }) {
  const { ref, seen } = useInView<HTMLElement>(0.2);
  const paragraphs = (message ?? "").trim().split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);
  const lines = paragraphs.length ? paragraphs : ["Uma mensagem especial em breve."];
  return (
    <section ref={ref} className={`di-letter ${seen ? "is-in" : ""}`} data-chapter>
      <article className="di-page">
        <header className="di-page-head">
          <div className="di-page-tab" style={MICRO}>I · CARTA</div>
        </header>
        <div className="di-page-body" style={SERIF}>
          {lines.map((p, i) => (
            <p key={i} className="di-line" style={{ animationDelay: `${500 + i * 600}ms` }}>{p}</p>
          ))}
        </div>
        {sender && (
          <footer className="di-page-foot" style={{ ...DISPLAY, animationDelay: `${500 + lines.length * 600 + 400}ms` }}>
            <span className="di-page-sign-rule" />
            <span>{sender}</span>
          </footer>
        )}
      </article>
    </section>
  );
}

/* =========================================================
   Music — fita cassete conceitual, barra fina
   ========================================================= */
function ChapterMusic({ title, artist, cover, src }: { title: string; artist: string; cover: string; src: string }) {
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
    return `${Math.floor(t/60)}:${Math.floor(t%60).toString().padStart(2,"0")}`;
  };
  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <section className={`di-music ${playing ? "is-playing" : ""}`} data-chapter>
      <div className="di-page-tab" style={MICRO}>II · TRILHA</div>

      <div className="di-music-plate">
        <div className="di-music-cover">
          {cover ? <img src={cover} alt="" /> : <div className="di-music-fallback">♪</div>}
          <div className="di-music-cover-shine" aria-hidden />
        </div>

        <div className="di-music-info">
          <div className="di-music-label" style={MICRO}>faixa</div>
          <h2 className="di-music-title" style={DISPLAY}>{title}</h2>
          {artist && <div className="di-music-artist" style={SERIF}>{artist}</div>}

          <div className="di-music-controls">
            <button type="button" onClick={toggle} className="di-music-play" aria-label={playing ? "Pausar" : "Tocar"}>
              {playing ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <div className="di-music-track"><div className="di-music-fill" style={{ width: `${pct}%` }} /></div>
            <div className="di-music-time" style={MICRO}>{fmt(current)} · {fmt(duration)}</div>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" />
    </section>
  );
}

/* =========================================================
   Momentos — foto em página, número romano, legenda em serif
   ========================================================= */
const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"];

function ChapterMoment({ url, index, total, onOpen }: { url: string; index: number; total: number; onOpen: () => void }) {
  const { ref, seen } = useInView<HTMLElement>(0.28);
  const side = index % 2 === 0 ? "left" : "right";
  return (
    <section ref={ref} className={`di-moment di-moment-${side} ${seen ? "is-in" : ""}`} data-chapter>
      <div className="di-moment-side">
        <div className="di-moment-num" style={DISPLAY}>{ROMAN[index] ?? String(index + 1)}</div>
        <div className="di-moment-label" style={MICRO}>MOMENTO</div>
        <div className="di-moment-rule" />
        <div className="di-moment-count" style={MICRO}>{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</div>
      </div>
      <button className="di-moment-photo" onClick={onOpen} aria-label="Ampliar foto">
        <div className="di-moment-frame">
          <img src={url} alt="" aria-hidden className="di-moment-blur" />
          <img src={url} alt="" loading="lazy" decoding="async" className="di-moment-img" />
        </div>
      </button>
    </section>
  );
}

/* =========================================================
   Encerramento — página em branco, frases em cascata
   ========================================================= */
function ChapterEnd() {
  const { ref, seen } = useInView<HTMLElement>(0.4);
  const phrases = [
    "Os momentos passam.",
    "O amor permanece.",
    "Obrigado por fazer parte desta história.",
  ];
  return (
    <section ref={ref} className={`di-end ${seen ? "is-in" : ""}`} data-chapter>
      <div className="di-end-inner">
        {phrases.map((p, i) => (
          <p key={i} className="di-end-line" style={{ ...SERIF, animationDelay: `${400 + i * 1500}ms` }}>{p}</p>
        ))}
        <div className="di-end-heart" style={{ animationDelay: `${400 + phrases.length * 1500 + 200}ms` }} aria-hidden>❦</div>
        <p className="di-end-final" style={{ ...DISPLAY, animationDelay: `${400 + phrases.length * 1500 + 1100}ms` }}>Até a próxima memória.</p>
        <div className="di-end-sign" style={{ ...MICRO, animationDelay: `${400 + phrases.length * 1500 + 2200}ms` }}>
          Feito com <span style={{ color: AMBER }}>♥</span> no MemoLove
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   Reel — indicador lateral de capítulo (rolo de filme)
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
    <aside className="di-reel" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={`di-reel-dot ${i === active ? "is-on" : ""}`} />
      ))}
    </aside>
  );
}

/* =========================================================
   Lightbox
   ========================================================= */
function Lightbox({ photos, index, onClose, onPrev, onNext }: {
  photos: string[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  let startX = 0;
  return (
    <div className="di-lb" role="dialog" aria-modal="true" onClick={onClose}
      onTouchStart={(e) => { startX = e.touches[0].clientX; }}
      onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - startX; if (Math.abs(dx) < 50) return; dx < 0 ? onNext() : onPrev(); }}>
      <img key={index} src={photos[index]} alt="" className="di-lb-img" />
      <button className="di-lb-btn di-lb-close" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Fechar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
      {index > 0 && (
        <button className="di-lb-btn di-lb-prev" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="Anterior">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
      )}
      {index < photos.length - 1 && (
        <button className="di-lb-btn di-lb-next" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="Próxima">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 6l6 6-6 6"/></svg>
        </button>
      )}
    </div>
  );
}

/* =========================================================
   Página
   ========================================================= */
function HomenagemPage() {
  const { slug } = Route.useParams();
  const { memory, photos, ready, err } = useMemoryData(slug);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => { stopAllAudio(); return () => stopAllAudio(); }, []);

  const hero = photos[0] ?? "";
  const gallery = photos.slice(1).filter(Boolean);
  const hasMusic = !!memory?.music_preview_url;

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: IVORY }}>
        <div style={{ ...MICRO, color: AMBER, fontSize: 10, letterSpacing: ".4em" }} className="uppercase animate-pulse">Abrindo o diário</div>
      </div>
    );
  }

  if (err || !memory) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: IVORY, color: UMBER }}>
        <div className="text-center p-8"><h1 style={SERIF} className="text-2xl mb-2">Memória não encontrada</h1><p className="text-sm opacity-70">{err}</p></div>
      </div>
    );
  }

  const chapterCount = 1 + 1 + (hasMusic ? 1 : 0) + gallery.length + 1;

  return (
    <div className="di-root">
      <style>{`
        html, body { background: ${IVORY}; }
        .di-root {
          background: ${IVORY};
          color: ${UMBER};
          position: relative;
          overflow-x: hidden;
        }
        /* textura de papel muito discreta */
        .di-root::before {
          content: "";
          position: fixed; inset: 0; pointer-events: none; z-index: 1;
          background-image:
            radial-gradient(rgba(58,42,30,.035) 1px, transparent 1px),
            radial-gradient(rgba(58,42,30,.02) 1px, transparent 1px);
          background-size: 3px 3px, 7px 7px;
          background-position: 0 0, 1px 2px;
          mix-blend-mode: multiply;
        }

        @keyframes di-rise {
          0% { opacity: 0; transform: translateY(18px); filter: blur(8px); }
          100% { opacity: 1; transform: none; filter: none; }
        }
        @keyframes di-breathe {
          0%,100% { transform: translateY(0); opacity: .6; }
          50%     { transform: translateY(6px); opacity: 1; }
        }

        /* ============ Cover ============ */
        .di-cover {
          position: relative;
          height: 100vh;
          height: 100svh;
          width: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #000;
        }
        @keyframes di-kb {
          0%   { transform: scale(1); }
          100% { transform: scale(1.03); }
        }
        .di-cover-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          transform-origin: center center;
          animation: di-kb 15s ease-in-out infinite alternate;
        }
        .di-cover-veil {
          position: absolute; inset: 0;
          background:
            linear-gradient(180deg, rgba(0,0,0,.10) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,.55) 65%, rgba(0,0,0,.88) 100%);
          pointer-events: none;
        }
        @keyframes di-hero-in {
          0%   { opacity: 0; transform: translateY(24px); filter: blur(12px); }
          100% { opacity: 1; transform: none; filter: none; }
        }
        .di-cover-content {
          position: absolute;
          left: clamp(24px, 6vw, 72px);
          right: clamp(24px, 6vw, 72px);
          bottom: clamp(110px, 18vh, 180px);
          z-index: 2;
          color: ${IVORY};
          text-align: left;
          max-width: 640px;
        }
        .di-cover-eyebrow {
          font-size: clamp(28px, 4.2vw, 44px);
          font-weight: 400;
          font-style: italic;
          line-height: 1;
          color: ${IVORY};
          opacity: 0; animation: di-hero-in 900ms 200ms ease-out forwards;
        }
        .di-cover-name {
          margin: 6px 0 0;
          font-weight: 400;
          font-size: clamp(88px, 16vw, 172px); line-height: .92;
          letter-spacing: -.015em;
          color: ${IVORY};
          text-shadow: 0 4px 40px rgba(0,0,0,.55);
          opacity: 0; animation: di-hero-in 900ms 500ms ease-out forwards;
        }
        .di-cover-heart {
          margin-top: 26px;
          font-size: 22px; color: ${GOLD_SOFT};
          opacity: 0; animation: di-hero-in 900ms 900ms ease-out forwards;
        }
        .di-cover-sub {
          margin: 12px 0 0;
          font-size: clamp(18px, 2.4vw, 24px);
          font-style: italic;
          font-weight: 400;
          line-height: 1.5;
          color: rgba(244,235,221,.92);
          opacity: 0; animation: di-hero-in 900ms 1200ms ease-out forwards;
        }
        @keyframes di-arrow-breathe {
          0%,100% { transform: translate(-50%, 0); opacity: .7; }
          50%     { transform: translate(-50%, 8px); opacity: 1; }
        }
        .di-cover-arrow {
          position: absolute;
          left: 50%; bottom: 34px;
          transform: translateX(-50%);
          z-index: 3;
          animation: di-arrow-breathe 2.8s ease-in-out infinite;
          display: flex;
        }
        @media (max-width: 640px) {
          .di-cover-content { bottom: clamp(96px, 15vh, 140px); }
        }

        /* ============ Página de diário base ============ */
        .di-page-tab {
          display: inline-block;
          font-size: 10px; letter-spacing: .48em;
          color: ${AMBER};
          padding-bottom: 8px;
          border-bottom: 1px solid ${GOLD_SOFT}80;
        }

        /* ============ Letter ============ */
        .di-letter {
          min-height: 100svh;
          display: flex; align-items: center; justify-content: center;
          padding: 100px 24px;
          position: relative;
        }
        .di-page {
          position: relative;
          width: 100%; max-width: 720px;
          background: linear-gradient(180deg, #FBF5EA 0%, #F5EBDA 100%);
          padding: 72px 64px 84px;
          border-radius: 1px;
          box-shadow:
            0 30px 60px -20px rgba(58,42,30,.25),
            0 1px 0 rgba(212,169,106,.5) inset,
            0 -1px 0 rgba(212,169,106,.3) inset;
        }
        .di-page::before {
          content: ""; position: absolute; left: 40px; top: 60px; bottom: 60px; width: 1px;
          background: repeating-linear-gradient(180deg, transparent 0 6px, ${AMBER}22 6px 7px);
        }
        .di-page-head { margin-bottom: 44px; }
        .di-page-body { font-size: 21px; line-height: 1.85; color: ${UMBER}; font-style: italic; }
        .di-page-body p { margin: 0 0 1em; }
        .di-line { opacity: 0; transform: translateY(10px); filter: blur(4px); animation: di-rise 1.4s ease-out forwards; }
        .di-page-foot {
          margin-top: 60px;
          display: flex; align-items: center; justify-content: flex-end; gap: 16px;
          font-style: italic; font-size: 26px; color: ${AMBER};
          opacity: 0; animation: di-rise 1.4s ease-out forwards;
        }
        .di-page-sign-rule { display: block; width: 80px; height: 1px; background: ${GOLD_SOFT}; }
        @media (max-width: 640px) {
          .di-letter { padding: 60px 16px; }
          .di-page { padding: 48px 28px 60px; }
          .di-page::before { left: 18px; top: 42px; bottom: 42px; }
          .di-page-body { font-size: 18px; }
          .di-page-foot { font-size: 22px; }
        }

        /* ============ Music ============ */
        .di-music {
          min-height: 100svh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 100px 24px;
          gap: 40px;
          background: ${IVORY_DEEP};
        }
        .di-music-plate {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 40px;
          align-items: center;
          width: 100%; max-width: 620px;
          padding: 32px;
          background: linear-gradient(180deg, #FBF5EA, #F1E4CE);
          border-radius: 2px;
          box-shadow: 0 20px 60px -20px rgba(58,42,30,.3), inset 0 0 0 1px ${GOLD_SOFT}55;
        }
        .di-music-cover {
          position: relative;
          width: 220px; height: 220px;
          overflow: hidden;
          border-radius: 2px;
          box-shadow: 0 14px 40px rgba(58,42,30,.35);
        }
        .di-music-cover img { width: 100%; height: 100%; object-fit: cover; }
        .di-music-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: ${AMBER}; font-size: 60px; background: ${IVORY_DEEP}; }
        .di-music-cover-shine {
          position: absolute; inset: 0;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,.15) 50%, transparent 70%);
          opacity: 0;
          transition: opacity .6s ease;
        }
        .di-music.is-playing .di-music-cover-shine { opacity: 1; animation: di-shine 4s linear infinite; }
        @keyframes di-shine {
          0% { transform: translateX(-100%); } 100% { transform: translateX(100%); }
        }
        .di-music-info { color: ${UMBER}; }
        .di-music-label { font-size: 10px; letter-spacing: .4em; text-transform: uppercase; color: ${AMBER}; }
        .di-music-title { margin: 8px 0 4px; font-size: clamp(22px, 3.4vw, 28px); font-style: italic; color: ${UMBER}; font-weight: 500; }
        .di-music-artist { font-size: 16px; color: ${UMBER}99; font-style: italic; }
        .di-music-controls { display: flex; align-items: center; gap: 12px; margin-top: 24px; }
        .di-music-play {
          width: 42px; height: 42px; border-radius: 999px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: ${UMBER}; color: ${IVORY};
          box-shadow: 0 8px 20px rgba(58,42,30,.35);
          transition: transform .2s ease;
        }
        .di-music-play:hover { transform: scale(1.05); }
        .di-music-play:active { transform: scale(.95); }
        .di-music-track { flex: 1; height: 2px; background: ${UMBER}22; border-radius: 999px; overflow: hidden; }
        .di-music-fill { height: 100%; background: ${AMBER}; transition: width .2s linear; }
        .di-music-time { font-size: 10px; color: ${UMBER}77; letter-spacing: .1em; font-variant-numeric: tabular-nums; }
        @media (max-width: 640px) {
          .di-music-plate { grid-template-columns: 1fr; gap: 24px; padding: 24px; text-align: center; }
          .di-music-cover { margin: 0 auto; width: 200px; height: 200px; }
          .di-music-controls { justify-content: center; flex-wrap: wrap; }
        }

        /* ============ Moment ============ */
        .di-moment {
          min-height: 100svh;
          display: grid;
          grid-template-columns: 220px 1fr;
          align-items: center;
          gap: 60px;
          padding: 80px 60px;
          max-width: 1200px; margin: 0 auto;
        }
        .di-moment-right { grid-template-columns: 1fr 220px; }
        .di-moment-right .di-moment-side { order: 2; text-align: left; }
        .di-moment-right .di-moment-photo { order: 1; }

        .di-moment-side {
          text-align: right;
          opacity: 0; transform: translateX(-16px);
          transition: opacity 900ms ease-out .15s, transform 900ms ease-out .15s;
        }
        .di-moment.is-in .di-moment-side { opacity: 1; transform: none; }
        .di-moment-num {
          font-size: clamp(56px, 8vw, 96px); line-height: 1;
          color: ${AMBER}; font-style: italic; font-weight: 500;
          letter-spacing: -.02em;
        }
        .di-moment-label { font-size: 10px; letter-spacing: .48em; color: ${UMBER}88; margin-top: 12px; }
        .di-moment-rule { width: 60px; height: 1px; background: ${GOLD_SOFT}; margin: 20px 0 20px auto; }
        .di-moment-right .di-moment-rule { margin: 20px auto 20px 0; }
        .di-moment-count { font-size: 10px; letter-spacing: .3em; color: ${UMBER}66; }

        .di-moment-photo {
          background: transparent; padding: 0; border: 0; cursor: zoom-in;
          opacity: 0; transform: translateY(30px) scale(.98); filter: blur(10px);
          transition: opacity 1.1s cubic-bezier(.2,.7,.2,1) .25s, transform 1.1s cubic-bezier(.2,.7,.2,1) .25s, filter 1.1s ease-out .25s;
        }
        .di-moment.is-in .di-moment-photo { opacity: 1; transform: none; filter: none; }
        .di-moment-frame {
          position: relative; width: 100%; overflow: hidden;
          aspect-ratio: 4/5;
          background: ${IVORY_DEEP};
          box-shadow: 0 30px 60px -20px rgba(58,42,30,.4), 0 0 0 1px ${GOLD_SOFT}44;
        }
        .di-moment-blur {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; transform: scale(1.3); filter: blur(30px) brightness(.85);
        }
        .di-moment-img {
          position: relative; z-index: 1;
          width: 100%; height: 100%; object-fit: contain;
          transition: transform 1.4s ease-out;
        }
        .di-moment-photo:hover .di-moment-img { transform: scale(1.02); }
        @media (max-width: 720px) {
          .di-moment, .di-moment-right {
            grid-template-columns: 1fr;
            padding: 60px 20px;
            gap: 30px;
            min-height: auto;
          }
          .di-moment-side, .di-moment-right .di-moment-side { text-align: left; order: 1; }
          .di-moment-photo, .di-moment-right .di-moment-photo { order: 2; }
          .di-moment-rule, .di-moment-right .di-moment-rule { margin: 16px 0; }
          .di-moment-num { font-size: 56px; }
        }

        /* ============ Ending ============ */
        .di-end {
          min-height: 100svh;
          display: flex; align-items: center; justify-content: center;
          padding: 100px 24px;
          background: linear-gradient(180deg, ${IVORY} 0%, ${IVORY_DEEP} 100%);
        }
        .di-end-inner { max-width: 620px; text-align: center; }
        .di-end-line {
          font-size: clamp(24px, 4vw, 34px); line-height: 1.5;
          color: ${UMBER}; margin: 0 0 40px; font-style: italic;
          opacity: 0; filter: blur(10px);
        }
        .di-end.is-in .di-end-line { animation: di-rise 1.6s ease-out forwards; }
        .di-end-heart { font-size: 26px; color: ${AMBER}; margin: 20px 0 40px; opacity: 0; }
        .di-end.is-in .di-end-heart { animation: di-rise 1.4s ease-out forwards, di-breathe 3s 2s ease-in-out infinite; }
        .di-end-final { font-size: clamp(22px, 3.4vw, 28px); color: ${AMBER}; font-style: italic; margin: 0; opacity: 0; }
        .di-end.is-in .di-end-final { animation: di-rise 1.4s ease-out forwards; }
        .di-end-sign {
          margin-top: 72px; font-size: 10px; letter-spacing: .4em; text-transform: uppercase;
          color: ${UMBER}77; opacity: 0;
        }
        .di-end.is-in .di-end-sign { animation: di-rise 1.2s ease-out forwards; }

        /* ============ Reel indicator ============ */
        .di-reel {
          position: fixed; top: 50%; right: 22px; transform: translateY(-50%);
          display: flex; flex-direction: column; gap: 10px;
          z-index: 20;
        }
        .di-reel-dot {
          display: block; width: 6px; height: 6px; border-radius: 999px;
          background: ${UMBER}33;
          transition: background .4s ease, transform .4s ease;
        }
        .di-reel-dot.is-on { background: ${AMBER}; transform: scale(1.6); }
        @media (max-width: 720px) { .di-reel { display: none; } }

        /* ============ Lightbox ============ */
        .di-lb {
          position: fixed; inset: 0; z-index: 60;
          background: rgba(58,42,30,.95);
          display: flex; align-items: center; justify-content: center;
          animation: di-fade .35s ease-out;
        }
        @keyframes di-fade { from { opacity: 0 } to { opacity: 1 } }
        .di-lb-img {
          max-width: 92vw; max-height: 88vh; object-fit: contain;
          box-shadow: 0 40px 120px rgba(0,0,0,.6);
          animation: di-zoom .5s cubic-bezier(.2,.7,.2,1);
        }
        @keyframes di-zoom { from { opacity: 0; transform: scale(.94) } to { opacity: 1; transform: scale(1) } }
        .di-lb-btn {
          position: absolute;
          width: 42px; height: 42px; border-radius: 999px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(244,235,221,.12); backdrop-filter: blur(8px);
          color: ${IVORY};
          transition: background .2s ease;
        }
        .di-lb-btn:hover { background: rgba(244,235,221,.22); }
        .di-lb-close { top: 22px; right: 22px; }
        .di-lb-prev  { left: 22px; top: 50%; transform: translateY(-50%); display: none; }
        .di-lb-next  { right: 22px; top: 50%; transform: translateY(-50%); display: none; }
        @media (min-width: 720px) { .di-lb-prev, .di-lb-next { display: flex; } }
      `}</style>

      <ChapterCover name={memory.father_name} photo={hero} occasion={memory.occasion} />
      <ChapterLetter message={memory.message} sender={memory.sender_name} />
      {hasMusic && (
        <ChapterMusic
          title={memory.music_title ?? "Trilha"}
          artist={memory.music_artist ?? ""}
          cover={memory.music_cover ?? ""}
          src={memory.music_preview_url!}
        />
      )}
      {gallery.map((u, i) => (
        <ChapterMoment key={i} url={u} index={i} total={gallery.length} onOpen={() => setLightbox(i)} />
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
