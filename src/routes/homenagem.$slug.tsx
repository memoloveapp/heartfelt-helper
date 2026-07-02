import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, useReducedMotion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";

/* ============================================================
   /homenagem/$slug — MemoLove (Cinematic Editorial Flow)
   Palette: Paper & Ink · Type: Cormorant Garamond + Karla
   ============================================================ */

const PAPER = "#f5f3ee";
const PAPER_WARM = "#e8e4dd";
const INK = "#2d2d2d";
const INK_DEEP = "#0d0d0d";

const SERIF = '"Cormorant Garamond", "Fraunces", Georgia, serif';
const SANS = '"Karla", "Inter", system-ui, -apple-system, sans-serif';

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
  }),
  component: HomenagemPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: PAPER, color: INK, fontFamily: SERIF }}>
      <div><h1 className="text-2xl mb-2" style={{ fontStyle: "italic" }}>Um instante…</h1><p className="text-sm opacity-70" style={{ fontFamily: SANS }}>{error.message}</p></div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: PAPER, color: INK, fontFamily: SERIF }}>
      <p style={{ fontStyle: "italic" }}>Memória não encontrada.</p>
    </div>
  ),
  ssr: false,
});

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

/* ---------------- Motion helpers ---------------- */
const EASE = [0.16, 0.84, 0.24, 1] as const;

function Rise({ children, delay = 0, y = 24, className, as: Tag = "div" }: {
  children: React.ReactNode; delay?: number; y?: number; className?: string; as?: React.ElementType;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const MotionTag = motion(Tag as any);
  return (
    <MotionTag
      ref={ref as any}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: "blur(8px)" }}
      animate={inView ? (reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }) : undefined}
      transition={{ duration: reduce ? 0.4 : 1.2, ease: EASE, delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

/* ---------------- Sections ---------------- */

/* Band 1 — The Portrait: centered hero photo + name + dates */
function Portrait({ name, occasion, photo, ready }: { name: string; occasion: string | null; photo: string; ready: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const reduce = useReducedMotion();
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.02, 1.08]);
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -60]);

  const [first, ...restName] = (name || "Homenagem").split(" ");
  const last = restName.join(" ");

  return (
    <section ref={ref} className="ml-band ml-portrait" aria-label="Retrato">
      <div className="ml-portrait-eyebrow">
        <span>In Memoriam</span>
      </div>

      <Rise as="div" className="ml-portrait-frame">
        <motion.div className="ml-portrait-media" style={{ scale, y }}>
          {photo ? (
            <img src={photo} alt="" aria-hidden loading="eager" {...({ fetchpriority: "high" } as any)} className="ml-portrait-img" />
          ) : (
            <div className="ml-portrait-empty" aria-hidden />
          )}
        </motion.div>
      </Rise>

      <div className="ml-portrait-caption">
        <motion.h1
          className="ml-portrait-name"
          initial={{ opacity: 0, y: 28, filter: "blur(12px)" }}
          animate={ready ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 1.6, ease: EASE, delay: 0.4 }}
        >
          {first} {last && <span className="ml-portrait-italic">{last}</span>}
        </motion.h1>

        <motion.p
          className="ml-portrait-dates"
          initial={{ opacity: 0, y: 10 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2, ease: EASE, delay: 1.0 }}
        >
          {occasion || "uma memória eterna"}
        </motion.p>
      </div>

      <motion.div
        className="ml-portrait-scroll"
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 0.6 } : {}}
        transition={{ duration: 1.6, ease: EASE, delay: 1.6 }}
        aria-hidden
      >
        <span className="ml-portrait-scroll-label">continuar</span>
        <span className="ml-portrait-scroll-line" />
      </motion.div>
    </section>
  );
}

/* Band 2 — Narrative: 12-col italic H2 + body with side portrait + floating pull-quote */
function Narrative({ message, sender, sidePhoto }: { message: string; sender: string; sidePhoto: string }) {
  const paragraphs = useMemo(
    () => (message ?? "").split(/\n\s*\n|\n/).map((s) => s.trim()).filter(Boolean),
    [message]
  );
  const lead = paragraphs[0] ?? "";
  const rest = paragraphs.slice(1);

  // Take the shortest meaningful sentence for the pull-quote card
  const pullQuote = useMemo(() => {
    const flat = (message || "").replace(/\s+/g, " ").trim();
    const sentences = flat.split(/(?<=[.!?])\s+/).filter((s) => s.length >= 40 && s.length <= 180);
    return sentences[0] || sentences[1] || "";
  }, [message]);

  return (
    <section className="ml-band ml-narrative" aria-label="Uma carta">
      <div className="ml-narrative-grid">
        <div className="ml-narrative-copy">
          <Rise as="span" className="ml-eyebrow">Carta para você</Rise>
          <Rise as="h2" className="ml-narrative-h2" delay={0.05}>
            {lead || "Palavras que atravessam o tempo."}
          </Rise>
          <div className="ml-narrative-body">
            {(rest.length ? rest : [message]).map((p, i) => (
              <Rise key={i} as="p" delay={0.08 + i * 0.04} className="ml-narrative-p">
                {p}
              </Rise>
            ))}
            <Rise as="p" delay={0.4} className="ml-narrative-sign">
              — <em>{sender || "com amor"}</em>
            </Rise>
          </div>
        </div>

        <div className="ml-narrative-media-col">
          <Rise as="div" className="ml-narrative-media">
            {sidePhoto ? (
              <img src={sidePhoto} alt="" aria-hidden loading="lazy" className="ml-narrative-img" />
            ) : (
              <div className="ml-portrait-empty" aria-hidden />
            )}
          </Rise>
          {pullQuote && (
            <Rise as="blockquote" delay={0.15} className="ml-narrative-pull">
              <p>{`\u201C${pullQuote}\u201D`}</p>
            </Rise>
          )}
        </div>
      </div>
    </section>
  );
}

/* Band 3 — Deep ink reflection: giant italic pull-quote on black */
function Reflection({ name }: { name: string }) {
  return (
    <section className="ml-band ml-reflection" aria-label="Reflexão">
      <div className="ml-reflection-inner">
        <Rise as="div" className="ml-reflection-rule" y={0}>
          <span />
        </Rise>
        <Rise as="blockquote" className="ml-reflection-quote" delay={0.1}>
          O horizonte não é o fim, mas a promessa <span className="ml-italic">do que existe além</span> do nosso olhar.
        </Rise>
        <Rise as="span" delay={0.35} className="ml-reflection-tag">
          Luz eterna · {name || "para sempre"}
        </Rise>
      </div>
    </section>
  );
}

/* Band 4 — Archive: 4-col grayscale grid + footer strip */
function Archive({ photos, name, sender }: { photos: string[]; name: string; sender: string }) {
  const initials = useMemo(() => {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "M.L";
    if (parts.length === 1) return parts[0][0].toUpperCase() + ".";
    return `${parts[0][0].toUpperCase()}.${parts[parts.length - 1][0].toUpperCase()}`;
  }, [name]);

  // Take up to 8 photos, fallback tiles if fewer
  const tiles = photos.slice(0, 8);
  const fill = Math.max(0, 4 - tiles.length);

  return (
    <section className="ml-band ml-archive" aria-label="Arquivo">
      <div className="ml-archive-inner">
        <Rise as="span" className="ml-eyebrow ml-archive-eyebrow">Arquivo · {String(photos.length).padStart(2, "0")} memórias</Rise>

        <div className={`ml-archive-grid ml-archive-grid-${Math.min(4, Math.max(2, tiles.length))}`}>
          {tiles.map((src, i) => (
            <Rise key={i} as="figure" delay={0.04 * i} className="ml-archive-tile">
              <img src={src} alt="" aria-hidden loading="lazy" className="ml-archive-img" />
              <figcaption className="ml-archive-cap">
                <span>{String(i + 1).padStart(2, "0")}</span>
                <span>{String(photos.length).padStart(2, "0")}</span>
              </figcaption>
            </Rise>
          ))}
          {tiles.length === 0 &&
            Array.from({ length: fill }).map((_, i) => (
              <div key={`empty-${i}`} className="ml-archive-tile ml-archive-tile-empty" aria-hidden />
            ))}
        </div>

        <div className="ml-archive-footer">
          <div className="ml-archive-foot-left">
            <p className="ml-archive-foot-eyebrow">Uma homenagem MemoLove</p>
            <p className="ml-archive-foot-copy">Escrita por {sender || "quem ama"} · © {new Date().getFullYear()}</p>
          </div>
          <div className="ml-archive-foot-right">
            <p className="ml-archive-initials">{initials}</p>
            <p className="ml-archive-foot-tag">Memória perpétua</p>
          </div>
        </div>

        <div className="ml-seal">
          <Rise as="span" className="ml-seal-mark">memolove</Rise>
        </div>
      </div>
    </section>
  );
}

/* Quiet player — floating, minimalist */
function QuietPlayer({ title, artist, src }: { title: string; artist: string; src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.duration ? a.currentTime / a.duration : 0);
    const onEnd = () => { setPlaying(false); setProgress(0); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => { a.removeEventListener("timeupdate", onTime); a.removeEventListener("ended", onEnd); };
  }, []);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { stopAllAudio(); try { await a.play(); setPlaying(true); } catch { /* ignore */ } }
  };

  return (
    <div className="ml-player" role="region" aria-label="Trilha da memória">
      <button className="ml-player-btn" onClick={toggle} aria-label={playing ? "Pausar música" : "Tocar música"}>
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5.5v13a.5.5 0 0 0 .77.42l10-6.5a.5.5 0 0 0 0-.84l-10-6.5A.5.5 0 0 0 8 5.5z" /></svg>
        )}
      </button>
      <div className="ml-player-meta">
        <p className="ml-player-title">{title}</p>
        {artist && <p className="ml-player-artist">{artist}</p>}
        <div className="ml-player-track" aria-hidden>
          <span className="ml-player-fill" style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
      <audio ref={audioRef} src={src} preload="none" />
    </div>
  );
}

/* ---------------- Page ---------------- */
function HomenagemPage() {
  const { slug } = Route.useParams();
  const { memory, photos, ready, err } = useMemoryData(slug);
  const [openingDone, setOpeningDone] = useState(false);

  useEffect(() => {
    stopAllAudio();
    const t = setTimeout(() => setOpeningDone(true), 300);
    return () => { clearTimeout(t); stopAllAudio(); };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: PAPER }}>
        <div style={{ fontFamily: SANS, color: INK, opacity: .55, fontSize: 10, letterSpacing: ".5em" }} className="uppercase animate-pulse">preparando a memória</div>
      </div>
    );
  }
  if (err || !memory) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: PAPER, color: INK }}>
        <div className="text-center p-8"><h1 style={{ fontFamily: SERIF, fontStyle: "italic" }} className="text-2xl mb-2">Memória não encontrada</h1><p className="text-sm opacity-70" style={{ fontFamily: SANS }}>{err}</p></div>
      </div>
    );
  }

  const hero = photos[0] ?? "";
  const side = photos[1] ?? hero;
  const gallery = photos.slice(0);
  const hasMusic = !!memory.music_preview_url;

  return (
    <main className="ml-root">
      <style>{`
        html, body { background: ${PAPER}; }
        .ml-root { background: ${PAPER}; color: ${INK}; -webkit-font-smoothing: antialiased; overflow-x: hidden; font-family: ${SANS}; }
        .ml-root ::selection { background: ${INK}; color: ${PAPER}; }
        .ml-italic { font-style: italic; }

        .ml-eyebrow {
          display: inline-block;
          font-family: ${SANS};
          font-size: 10px; font-weight: 400;
          letter-spacing: .4em; text-transform: uppercase;
          color: ${INK}; opacity: .55;
        }

        .ml-band { position: relative; width: 100%; }

        /* ================= BAND 1 — PORTRAIT ================= */
        .ml-portrait {
          min-height: 100vh; min-height: 100svh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: clamp(80px, 12vh, 140px) 24px clamp(80px, 12vh, 140px);
          background: ${PAPER};
        }
        .ml-portrait-eyebrow {
          position: absolute; top: clamp(28px, 5vh, 56px); left: clamp(24px, 5vw, 64px);
          font-family: ${SANS}; font-size: 10px; letter-spacing: .32em; text-transform: uppercase;
          color: ${INK}; opacity: .6;
        }
        .ml-portrait-frame {
          width: 100%; max-width: 1120px;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: ${PAPER_WARM};
          position: relative;
        }
        .ml-portrait-media { position: absolute; inset: 0; will-change: transform; }
        .ml-portrait-img {
          width: 100%; height: 100%; object-fit: cover; object-position: center;
          filter: grayscale(1) contrast(1.02);
          display: block;
        }
        .ml-portrait-empty { width: 100%; height: 100%; background: ${PAPER_WARM}; }
        .ml-portrait-caption { margin-top: clamp(48px, 8vh, 80px); text-align: center; }
        .ml-portrait-name {
          margin: 0;
          font-family: ${SERIF};
          font-weight: 300;
          font-size: clamp(52px, 9.5vw, 148px);
          line-height: .95;
          letter-spacing: -.02em;
          color: ${INK_DEEP};
        }
        .ml-portrait-italic { font-style: italic; font-weight: 300; }
        .ml-portrait-dates {
          margin: clamp(24px, 4vh, 36px) 0 0;
          font-family: ${SANS};
          font-size: 11px; font-weight: 400;
          letter-spacing: .5em; text-transform: uppercase;
          color: ${INK}; opacity: .7;
        }
        .ml-portrait-scroll {
          position: absolute; left: 50%; bottom: clamp(24px, 4vh, 40px);
          transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          pointer-events: none;
        }
        .ml-portrait-scroll-label {
          font-family: ${SANS}; font-size: 9px; letter-spacing: .5em; text-transform: uppercase;
          color: ${INK}; opacity: .5;
        }
        .ml-portrait-scroll-line {
          display: block; width: 1px; height: 40px;
          background: ${INK}; opacity: .35;
          animation: ml-drip 3.4s ease-in-out infinite; transform-origin: top;
        }
        @keyframes ml-drip {
          0%, 100% { transform: scaleY(.4); opacity: .2; }
          50% { transform: scaleY(1); opacity: .5; }
        }

        /* ================= BAND 2 — NARRATIVE ================= */
        .ml-narrative {
          background: ${PAPER_WARM};
          padding: clamp(96px, 18vh, 200px) 24px;
        }
        .ml-narrative-grid {
          max-width: 1280px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(12, 1fr);
          gap: clamp(32px, 5vw, 64px);
          align-items: start;
        }
        .ml-narrative-copy { grid-column: 2 / span 5; }
        .ml-narrative-media-col { grid-column: 8 / span 5; position: relative; }

        @media (max-width: 900px) {
          .ml-narrative-copy, .ml-narrative-media-col { grid-column: 1 / -1; }
        }

        .ml-narrative-h2 {
          margin: 20px 0 clamp(36px, 5vh, 56px);
          font-family: ${SERIF};
          font-style: italic; font-weight: 300;
          font-size: clamp(28px, 3.6vw, 52px);
          line-height: 1.15;
          letter-spacing: -.01em;
          color: ${INK_DEEP};
        }
        .ml-narrative-body { font-family: ${SANS}; font-weight: 300; font-size: 17px; line-height: 1.85; color: ${INK}; max-width: 460px; }
        .ml-narrative-p { margin: 0 0 24px; }
        .ml-narrative-sign {
          margin-top: 40px;
          font-family: ${SERIF};
          font-style: italic; font-size: 20px;
          color: ${INK_DEEP};
        }
        .ml-narrative-media {
          aspect-ratio: 4 / 5;
          background: #dcd7cf;
          overflow: hidden;
        }
        .ml-narrative-img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) contrast(1.02); display: block; }
        .ml-narrative-pull {
          position: absolute; bottom: -40px; left: -40px;
          max-width: 320px;
          background: ${PAPER};
          padding: 40px;
          border: 1px solid rgba(45,45,45,.06);
          box-shadow: 0 24px 60px -30px rgba(0,0,0,.15);
          margin: 0;
        }
        .ml-narrative-pull p {
          margin: 0;
          font-family: ${SERIF}; font-style: italic; font-weight: 400;
          font-size: 22px; line-height: 1.35; color: ${INK_DEEP};
        }
        @media (max-width: 900px) {
          .ml-narrative-pull { position: static; margin: 24px 0 0; max-width: 100%; }
        }

        /* ================= BAND 3 — REFLECTION (deep ink) ================= */
        .ml-reflection {
          background: ${INK_DEEP};
          padding: clamp(140px, 24vh, 260px) 24px;
        }
        .ml-reflection-inner { max-width: 960px; margin: 0 auto; text-align: center; }
        .ml-reflection-rule { display: flex; justify-content: center; margin-bottom: clamp(48px, 8vh, 80px); }
        .ml-reflection-rule span { display: block; width: 1px; height: clamp(80px, 14vh, 128px); background: ${PAPER}; opacity: .22; }
        .ml-reflection-quote {
          margin: 0;
          font-family: ${SERIF};
          font-weight: 300;
          font-size: clamp(34px, 5.4vw, 76px);
          line-height: 1.12;
          letter-spacing: -.01em;
          color: ${PAPER};
        }
        .ml-reflection-tag {
          display: inline-block;
          margin-top: clamp(48px, 8vh, 80px);
          font-family: ${SANS};
          font-size: 10px; letter-spacing: .6em; text-transform: uppercase;
          color: ${PAPER}; opacity: .4;
        }

        /* ================= BAND 4 — ARCHIVE ================= */
        .ml-archive {
          background: ${PAPER};
          padding: clamp(96px, 18vh, 200px) 24px clamp(48px, 8vh, 88px);
        }
        .ml-archive-inner { max-width: 1280px; margin: 0 auto; }
        .ml-archive-eyebrow { display: block; margin-bottom: clamp(40px, 6vh, 64px); }

        .ml-archive-grid {
          display: grid;
          gap: clamp(12px, 1.4vw, 20px);
          grid-template-columns: repeat(2, 1fr);
        }
        @media (min-width: 720px) {
          .ml-archive-grid-3, .ml-archive-grid-4 { grid-template-columns: repeat(4, 1fr); }
          .ml-archive-grid-2 { grid-template-columns: repeat(2, 1fr); }
        }
        .ml-archive-tile {
          margin: 0;
          aspect-ratio: 3 / 4;
          background: ${PAPER_WARM};
          overflow: hidden;
          position: relative;
        }
        .ml-archive-tile-empty { background: ${PAPER_WARM}; }
        .ml-archive-img {
          width: 100%; height: 100%; object-fit: cover;
          filter: grayscale(1) contrast(1.02);
          transition: transform 1.4s ${`cubic-bezier(0.16,0.84,0.24,1)`}, filter 1.4s ease;
          display: block;
        }
        .ml-archive-tile:hover .ml-archive-img { transform: scale(1.04); filter: grayscale(0.4) contrast(1.04); }
        .ml-archive-cap {
          position: absolute; left: 12px; bottom: 12px; right: 12px;
          display: flex; justify-content: space-between;
          font-family: ${SANS}; font-size: 9px; letter-spacing: .32em; text-transform: uppercase;
          color: ${PAPER}; mix-blend-mode: difference; opacity: .8;
        }

        .ml-archive-footer {
          margin-top: clamp(96px, 18vh, 180px);
          padding-top: 32px;
          border-top: 1px solid rgba(45,45,45,.1);
          display: flex; flex-wrap: wrap; gap: 32px;
          justify-content: space-between; align-items: flex-end;
        }
        .ml-archive-foot-left { text-align: left; }
        .ml-archive-foot-right { text-align: right; }
        @media (max-width: 640px) {
          .ml-archive-footer { flex-direction: column; align-items: center; text-align: center; }
          .ml-archive-foot-left, .ml-archive-foot-right { text-align: center; }
        }
        .ml-archive-foot-eyebrow {
          margin: 0 0 6px;
          font-family: ${SANS}; font-size: 9px; letter-spacing: .4em; text-transform: uppercase;
          color: ${INK}; opacity: .45;
        }
        .ml-archive-foot-copy {
          margin: 0;
          font-family: ${SANS}; font-size: 10px; letter-spacing: .2em; text-transform: uppercase;
          color: ${INK};
        }
        .ml-archive-initials {
          margin: 0;
          font-family: ${SERIF}; font-style: italic; font-weight: 300;
          font-size: 32px; color: ${INK_DEEP};
        }
        .ml-archive-foot-tag {
          margin: 6px 0 0;
          font-family: ${SANS}; font-size: 9px; letter-spacing: .4em; text-transform: uppercase;
          color: ${INK}; opacity: .5;
        }

        .ml-seal {
          margin-top: clamp(80px, 14vh, 140px);
          text-align: center;
        }
        .ml-seal-mark {
          display: inline-block;
          font-family: ${SANS}; font-size: 11px; font-weight: 400;
          letter-spacing: .55em; text-transform: uppercase;
          color: ${INK}; opacity: .55;
        }

        /* ================= FLOATING PLAYER ================= */
        .ml-player {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          z-index: 40;
          display: flex; align-items: center; gap: 16px;
          padding: 12px 20px 12px 12px;
          background: rgba(245,243,238,.92);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(45,45,45,.08);
          box-shadow: 0 20px 50px -25px rgba(0,0,0,.35);
          min-width: 280px; max-width: 92vw;
        }
        .ml-player-btn {
          width: 40px; height: 40px; border-radius: 999px;
          background: ${INK_DEEP}; color: ${PAPER};
          display: inline-flex; align-items: center; justify-content: center;
          border: 0; cursor: pointer; transition: transform .2s ease;
          flex-shrink: 0;
        }
        .ml-player-btn:hover { transform: scale(1.05); }
        .ml-player-meta { flex: 1; min-width: 0; }
        .ml-player-title {
          margin: 0;
          font-family: ${SERIF}; font-style: italic; font-size: 14px;
          color: ${INK_DEEP}; line-height: 1.2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ml-player-artist {
          margin: 2px 0 6px;
          font-family: ${SANS}; font-size: 9px; letter-spacing: .3em; text-transform: uppercase;
          color: ${INK}; opacity: .55;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ml-player-track { display: block; width: 100%; height: 1px; background: rgba(45,45,45,.15); overflow: hidden; }
        .ml-player-fill { display: block; width: 100%; height: 100%; background: ${INK_DEEP}; transform-origin: left center; transform: scaleX(0); transition: transform .12s linear; }
      `}</style>

      <Portrait
        name={memory.father_name}
        occasion={memory.occasion}
        photo={hero}
        ready={openingDone}
      />

      <Narrative
        message={memory.message}
        sender={memory.sender_name}
        sidePhoto={side}
      />

      <Reflection name={memory.father_name} />

      <Archive photos={gallery} name={memory.father_name} sender={memory.sender_name} />

      {hasMusic && (
        <QuietPlayer
          title={memory.music_title || "Trilha da memória"}
          artist={memory.music_artist || ""}
          src={memory.music_preview_url!}
        />
      )}
    </main>
  );
}
