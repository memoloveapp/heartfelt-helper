import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, useReducedMotion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";

/* ============================================================
   /homenagem/$slug — MemoLove (Editorial Cinematic Redesign)
   ============================================================ */

const CREAM = "#F6F1E7";
const CREAM_WARM = "#EEE7D8";
const INK = "#1F1A14";
const INK_SOFT = "#5C534A";
const HAIR = "#B8A98E";

const SERIF = '"Fraunces", "Cormorant Garamond", Georgia, serif';
const SANS = '"Inter", system-ui, -apple-system, sans-serif';

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
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: CREAM, color: INK, fontFamily: SERIF }}>
      <div><h1 className="text-2xl mb-2" style={{ fontStyle: "italic" }}>Um instante…</h1><p className="text-sm opacity-70" style={{ fontFamily: SANS }}>{error.message}</p></div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: CREAM, color: INK, fontFamily: SERIF }}>
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
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const reduce = useReducedMotion();
  const MotionTag = motion(Tag as any);
  return (
    <MotionTag
      ref={ref as any}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: "blur(8px)" }}
      animate={inView ? (reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }) : undefined}
      transition={{ duration: reduce ? 0.4 : 1.1, ease: EASE, delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

/* ---------------- Sections ---------------- */

function Opening({ name, photo, ready }: { name: string; photo: string; ready: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const reduce = useReducedMotion();
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -80]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.02, 1.08]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section ref={ref} className="ml-opening" aria-label="Abertura">
      <motion.div className="ml-opening-photo-wrap" style={{ y, scale }}>
        {photo && (
          <img
            src={photo}
            alt=""
            aria-hidden
            loading="eager"
            {...({ fetchpriority: "high" } as any)}
            className="ml-opening-photo"
          />
        )}
        <div className="ml-opening-veil" aria-hidden />
      </motion.div>

      <motion.div className="ml-opening-content" style={{ opacity }}>
        <motion.p
          className="ml-opening-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
        >
          para o meu
        </motion.p>

        <motion.h1
          className="ml-opening-name"
          initial={{ opacity: 0, y: 28, filter: "blur(14px)" }}
          animate={ready ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 1.8, ease: EASE, delay: 0.55 }}
        >
          {name || "Pai"}<span className="ml-opening-dot">.</span>
        </motion.h1>

        <motion.div
          className="ml-opening-rule"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={ready ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 1.2, ease: EASE, delay: 1.4 }}
          aria-hidden
        >
          <span />
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20.5s-6.5-4.2-8.8-8.4A4.9 4.9 0 0 1 12 6.2a4.9 4.9 0 0 1 8.8 5.9C18.5 16.3 12 20.5 12 20.5z" />
          </svg>
          <span />
        </motion.div>

        <motion.p
          className="ml-opening-sub"
          initial={{ opacity: 0, y: 12 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.4, ease: EASE, delay: 1.9 }}
        >
          meu maior exemplo
        </motion.p>
      </motion.div>

      <motion.div
        className="ml-opening-scroll"
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 0.8 } : {}}
        transition={{ duration: 1.6, ease: EASE, delay: 2.4 }}
        style={{ opacity: opacity as any }}
        aria-hidden
      >
        <span className="ml-opening-scroll-label">continuar</span>
        <span className="ml-opening-scroll-line" />
      </motion.div>
    </section>
  );
}

function Whisper({ text }: { text: string }) {
  return (
    <section className="ml-whisper" aria-hidden>
      <Rise as="p" className="ml-whisper-text">{text}</Rise>
    </section>
  );
}

function LetterPage({ message, sender }: { message: string; sender: string }) {
  const paragraphs = useMemo(
    () => (message ?? "").split(/\n\s*\n|\n/).map((s) => s.trim()).filter(Boolean),
    [message]
  );

  return (
    <section className="ml-letter" aria-label="Uma carta">
      <div className="ml-letter-inner">
        <Rise as="div" className="ml-letter-open" y={16}>
          <span className="ml-letter-quote" aria-hidden>“</span>
        </Rise>

        {paragraphs.map((p, i) => (
          <Rise
            key={i}
            as="p"
            delay={0.05 * Math.min(i, 6)}
            className={`ml-letter-p ${i === 0 ? "ml-letter-first" : ""}`}
          >
            {p}
          </Rise>
        ))}

        <Rise as="div" className="ml-letter-sign-wrap">
          <span className="ml-letter-sign-line" aria-hidden />
          <span className="ml-letter-sign">{sender || "com amor"}</span>
        </Rise>
      </div>
    </section>
  );
}

function AlbumFrame({ src, index, total }: { src: string; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const reduce = useReducedMotion();
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [40, -40]);

  return (
    <section ref={ref} className="ml-album-frame" aria-label={`Memória ${index + 1} de ${total}`}>
      <Rise as="figure" className="ml-album-figure" y={40}>
        <motion.div className="ml-album-media" style={{ y }}>
          <img src={src} alt="" aria-hidden loading="lazy" className="ml-album-img" />
        </motion.div>
        <figcaption className="ml-album-caption">
          <span className="ml-album-index">{String(index + 1).padStart(2, "0")} — {String(total).padStart(2, "0")}</span>
        </figcaption>
      </Rise>
    </section>
  );
}

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
    <section className="ml-player" aria-label="Trilha da memória">
      <Rise as="div" className="ml-player-inner">
        <button className="ml-player-btn" onClick={toggle} aria-label={playing ? "Pausar música" : "Tocar música"}>
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5.5v13a.5.5 0 0 0 .77.42l10-6.5a.5.5 0 0 0 0-.84l-10-6.5A.5.5 0 0 0 8 5.5z" /></svg>
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
      </Rise>
    </section>
  );
}

function Farewell({ sender }: { sender: string }) {
  return (
    <section className="ml-farewell" aria-label="Despedida">
      <Rise as="p" className="ml-farewell-line">
        que essa memória viva com você — sempre.
      </Rise>
      <Rise as="p" delay={0.2} className="ml-farewell-sign">
        com amor, <em>{sender || "quem escreveu"}</em>
      </Rise>
    </section>
  );
}

function Seal() {
  return (
    <footer className="ml-seal" aria-label="MemoLove">
      <Rise as="span" className="ml-seal-mark">memolove</Rise>
    </footer>
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: CREAM }}>
        <div style={{ fontFamily: SANS, color: INK_SOFT, fontSize: 10, letterSpacing: ".5em" }} className="uppercase animate-pulse">preparando a memória</div>
      </div>
    );
  }
  if (err || !memory) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: CREAM, color: INK }}>
        <div className="text-center p-8"><h1 style={{ fontFamily: SERIF, fontStyle: "italic" }} className="text-2xl mb-2">Memória não encontrada</h1><p className="text-sm opacity-70" style={{ fontFamily: SANS }}>{err}</p></div>
      </div>
    );
  }

  const hero = photos[0] ?? "";
  const rest = photos.slice(1).filter(Boolean);
  const hasMusic = !!memory.music_preview_url;

  return (
    <main className="ml-root">
      <style>{`
        html, body { background: ${CREAM}; }
        .ml-root { background: ${CREAM}; color: ${INK}; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
        .ml-root ::selection { background: ${HAIR}; color: ${INK}; }

        /* ============ OPENING ============ */
        .ml-opening { position: relative; height: 100vh; height: 100svh; width: 100%; overflow: hidden; background: #14100b; }
        .ml-opening-photo-wrap { position: absolute; inset: 0; will-change: transform; }
        .ml-opening-photo { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
        .ml-opening-veil {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(90% 60% at 50% 62%, rgba(0,0,0,.55) 0%, rgba(0,0,0,.25) 50%, rgba(0,0,0,0) 82%),
            linear-gradient(180deg, rgba(0,0,0,.28) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 62%, rgba(0,0,0,.55) 100%);
        }
        .ml-opening-content {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center;
          padding: 0 24px;
          color: ${CREAM};
          z-index: 2;
        }
        .ml-opening-eyebrow {
          margin: 0 0 clamp(14px, 2.4vh, 22px);
          font-family: ${SANS};
          font-size: 11px;
          font-weight: 400;
          letter-spacing: .48em;
          text-transform: uppercase;
          color: rgba(246,241,231,.72);
          text-shadow: 0 1px 20px rgba(0,0,0,.5);
        }
        .ml-opening-name {
          margin: 0;
          font-family: ${SERIF};
          font-weight: 300;
          font-style: italic;
          font-size: clamp(72px, 14vw, 168px);
          line-height: .95;
          letter-spacing: -.02em;
          color: ${CREAM};
          text-shadow: 0 2px 32px rgba(0,0,0,.35);
        }
        .ml-opening-dot { font-style: italic; color: ${CREAM}; }
        .ml-opening-rule {
          display: flex; align-items: center; justify-content: center; gap: 14px;
          margin: clamp(20px, 3vh, 32px) 0 clamp(18px, 2.6vh, 26px);
          transform-origin: center;
          color: rgba(246,241,231,.78);
        }
        .ml-opening-rule span { display: block; width: clamp(48px, 10vw, 80px); height: 1px; background: currentColor; opacity: .6; }
        .ml-opening-sub {
          margin: 0;
          font-family: ${SERIF};
          font-style: italic;
          font-weight: 300;
          font-size: clamp(15px, 1.4vw, 19px);
          letter-spacing: .01em;
          color: rgba(246,241,231,.85);
          text-shadow: 0 1px 20px rgba(0,0,0,.4);
        }
        .ml-opening-scroll {
          position: absolute; left: 50%; bottom: clamp(28px, 5vh, 48px);
          transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          z-index: 3;
        }
        .ml-opening-scroll-label {
          font-family: ${SANS}; font-size: 9px; font-weight: 400;
          letter-spacing: .5em; text-transform: uppercase;
          color: rgba(246,241,231,.55);
        }
        .ml-opening-scroll-line { display: block; width: 1px; height: 40px; background: rgba(246,241,231,.4); animation: ml-drip 3.4s ease-in-out infinite; transform-origin: top; }
        @keyframes ml-drip {
          0%,100% { transform: scaleY(.35); opacity: .3; }
          50%     { transform: scaleY(1);    opacity: .8; }
        }

        /* ============ WHISPER ============ */
        .ml-whisper {
          padding: clamp(120px, 22vh, 220px) 24px;
          display: flex; align-items: center; justify-content: center;
          min-height: 60vh;
        }
        .ml-whisper-text {
          margin: 0;
          max-width: 620px;
          font-family: ${SERIF};
          font-style: italic;
          font-weight: 300;
          font-size: clamp(22px, 3vw, 34px);
          line-height: 1.45;
          text-align: center;
          color: ${INK_SOFT};
          letter-spacing: -.005em;
        }

        /* ============ LETTER ============ */
        .ml-letter {
          background: ${CREAM_WARM};
          padding: clamp(100px, 18vh, 180px) 24px clamp(120px, 20vh, 200px);
          display: flex; justify-content: center;
          position: relative;
        }
        .ml-letter::before, .ml-letter::after {
          content: "";
          position: absolute; left: 0; right: 0; height: 80px;
          pointer-events: none;
        }
        .ml-letter::before { top: -1px; background: linear-gradient(180deg, ${CREAM} 0%, ${CREAM_WARM} 100%); }
        .ml-letter::after  { bottom: -1px; background: linear-gradient(0deg, ${CREAM} 0%, ${CREAM_WARM} 100%); }
        .ml-letter-inner {
          width: 100%;
          max-width: 620px;
          font-family: ${SERIF};
          color: ${INK};
        }
        .ml-letter-open {
          text-align: center;
          margin-bottom: clamp(24px, 4vh, 40px);
        }
        .ml-letter-quote {
          font-family: ${SERIF};
          font-size: clamp(80px, 10vw, 140px);
          line-height: .5;
          color: ${HAIR};
          font-style: italic;
          display: inline-block;
          vertical-align: top;
        }
        .ml-letter-p {
          margin: 0 0 clamp(22px, 3vh, 32px);
          font-family: ${SERIF};
          font-weight: 300;
          font-size: clamp(18px, 1.55vw, 21px);
          line-height: 1.75;
          color: ${INK};
          letter-spacing: .002em;
        }
        .ml-letter-p:last-of-type { margin-bottom: 0; }
        .ml-letter-first::first-letter {
          font-family: ${SERIF};
          font-size: 3.4em;
          font-style: italic;
          font-weight: 300;
          float: left;
          line-height: .88;
          padding: .06em .14em 0 0;
          color: ${INK_SOFT};
        }
        .ml-letter-sign-wrap {
          margin: clamp(56px, 8vh, 96px) 0 0;
          display: flex; flex-direction: column; align-items: flex-start; gap: 20px;
        }
        .ml-letter-sign-line { display: block; width: 60px; height: 1px; background: ${HAIR}; opacity: .7; }
        .ml-letter-sign {
          font-family: ${SERIF};
          font-style: italic;
          font-weight: 300;
          font-size: clamp(22px, 2.2vw, 28px);
          color: ${INK_SOFT};
        }

        /* ============ ALBUM ============ */
        .ml-album-frame {
          padding: clamp(80px, 14vh, 160px) 24px;
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh;
        }
        .ml-album-figure {
          margin: 0;
          width: 100%;
          max-width: 720px;
          display: flex; flex-direction: column; align-items: center; gap: clamp(20px, 3vh, 32px);
        }
        .ml-album-media {
          width: 100%;
          overflow: hidden;
          border-radius: 2px;
          will-change: transform;
        }
        .ml-album-img {
          width: 100%; height: auto; max-height: 78vh;
          object-fit: cover; display: block;
          border-radius: 2px;
        }
        .ml-album-caption {
          font-family: ${SANS};
          font-size: 10px;
          font-weight: 400;
          letter-spacing: .5em;
          text-transform: uppercase;
          color: ${HAIR};
        }
        .ml-album-index { display: block; }

        /* ============ PLAYER ============ */
        .ml-player {
          padding: clamp(100px, 18vh, 180px) 24px;
          display: flex; align-items: center; justify-content: center;
        }
        .ml-player-inner {
          width: 100%;
          max-width: 460px;
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: 22px;
        }
        .ml-player-btn {
          width: 48px; height: 48px;
          border-radius: 999px;
          border: 1px solid ${HAIR};
          background: transparent;
          color: ${INK};
          display: grid; place-items: center;
          cursor: pointer;
          transition: background .4s ease, color .4s ease, border-color .4s ease;
        }
        .ml-player-btn:hover { background: ${INK}; color: ${CREAM}; border-color: ${INK}; }
        .ml-player-meta { min-width: 0; }
        .ml-player-title {
          margin: 0;
          font-family: ${SERIF};
          font-style: italic;
          font-weight: 400;
          font-size: 17px;
          color: ${INK};
          line-height: 1.2;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ml-player-artist {
          margin: 4px 0 0;
          font-family: ${SANS};
          font-size: 11px;
          font-weight: 400;
          letter-spacing: .3em;
          text-transform: uppercase;
          color: ${INK_SOFT};
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ml-player-track {
          margin-top: 14px;
          height: 1px;
          background: ${HAIR};
          opacity: .5;
          overflow: hidden;
          transform-origin: left center;
        }
        .ml-player-fill {
          display: block; height: 100%; background: ${INK};
          transform-origin: left center;
          transform: scaleX(0);
          transition: transform .12s linear;
        }

        /* ============ FAREWELL ============ */
        .ml-farewell {
          padding: clamp(140px, 26vh, 260px) 24px clamp(80px, 14vh, 140px);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center;
          gap: clamp(28px, 4vh, 44px);
          min-height: 80vh;
        }
        .ml-farewell-line {
          margin: 0;
          font-family: ${SERIF};
          font-style: italic;
          font-weight: 300;
          font-size: clamp(22px, 2.6vw, 30px);
          line-height: 1.45;
          color: ${INK_SOFT};
          max-width: 520px;
        }
        .ml-farewell-sign {
          margin: 0;
          font-family: ${SANS};
          font-size: 11px;
          font-weight: 400;
          letter-spacing: .4em;
          text-transform: uppercase;
          color: ${INK_SOFT};
        }
        .ml-farewell-sign em {
          font-family: ${SERIF};
          font-style: italic;
          text-transform: none;
          letter-spacing: 0;
          font-size: 15px;
          color: ${INK};
        }

        /* ============ SEAL ============ */
        .ml-seal {
          padding: 0 24px clamp(60px, 10vh, 100px);
          display: flex; justify-content: center;
        }
        .ml-seal-mark {
          font-family: ${SANS};
          font-size: 10px;
          font-weight: 400;
          letter-spacing: .55em;
          text-transform: lowercase;
          color: ${HAIR};
        }

        /* ============ RESPONSIVE ============ */
        @media (min-width: 720px) {
          .ml-whisper { padding: clamp(160px, 28vh, 280px) 8vw; }
          .ml-letter { padding: clamp(140px, 24vh, 240px) 6vw clamp(160px, 26vh, 260px); }
          .ml-album-frame { padding: clamp(120px, 20vh, 200px) 6vw; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ml-opening-scroll-line { animation: none; }
        }
      `}</style>

      <Opening name={memory.father_name} photo={hero} ready={openingDone} />

      <Whisper text="há coisas que só um pai ensina em silêncio." />

      <LetterPage message={memory.message} sender={memory.sender_name} />

      {rest.length > 0 && (
        <div className="ml-album">
          {rest.map((src, i) => (
            <AlbumFrame key={i} src={src} index={i} total={rest.length} />
          ))}
        </div>
      )}

      {hasMusic && (
        <QuietPlayer
          title={memory.music_title ?? "sem título"}
          artist={memory.music_artist ?? ""}
          src={memory.music_preview_url!}
        />
      )}

      <Farewell sender={memory.sender_name} />

      <Seal />
    </main>
  );
}
