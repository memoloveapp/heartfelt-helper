import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";


/* MusicScene — cena cinematográfica escura + player premium minimalista. */

const SERIF = '"Cormorant Garamond", "EB Garamond", Georgia, serif';
const EASE = [0.22, 0.61, 0.36, 1] as const;
const GOLD = "#C9A15A";
const GOLD_SOFT = "#B8924A";
const CREAM = "#EFE3C8";

function fmt(t: number) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Waveform estática pré-computada (barras douradas)
const BARS = Array.from({ length: 72 }, (_, i) => {
  const x = i / 71;
  const env = Math.sin(x * Math.PI); // suaviza pontas
  const noise =
    0.55 +
    0.45 *
      Math.abs(Math.sin(i * 1.7) * 0.6 + Math.cos(i * 0.9) * 0.4 + Math.sin(i * 0.31) * 0.3);
  return Math.max(0.12, Math.min(1, env * 0.35 + noise * 0.7));
});

export function MusicScene({
  title,
  artist,
  src,
  cover,
}: {
  title: string;
  artist: string;
  src: string;
  cover?: string | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [liked, setLiked] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [showOutro, setShowOutro] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRevealed(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);


  const toggle = async () => {
    const a = audioRef.current;
    if (!a || !src) return;
    if (!a.paused) {
      a.pause();
      return;
    }
    if (typeof document !== "undefined") {
      document.querySelectorAll("audio").forEach((el) => {
        if (el !== a) { try { el.pause(); } catch {} }
      });
    }
    try {
      const p = a.play();
      if (p && typeof p.then === "function") await p;
    } catch {
      setPlaying(false);
    }
  };


  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onMeta = () => setDuration(a.duration || 0);
    const onEnd = () => setPlaying(false);
    const onPlay = () => {
      setPlaying(true);
      if (!hasPlayed) {
        setHasPlayed(true);
        window.setTimeout(() => setShowOutro(true), 1000);
      }
    };
    const onPause = () => setPlaying(false);
    const onError = () => {
      console.error("[MusicScene] audio error", a.error);
      setPlaying(false);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("error", onError);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("error", onError);
    };
  }, [src, hasPlayed]);

  const progress = duration > 0 ? current / duration : 0;
  const activeBar = Math.floor(progress * BARS.length);

  const seek = (pct: number) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    a.currentTime = Math.max(0, Math.min(duration, pct * duration));
  };

  return (
    <section
      ref={sectionRef}
      className={`music-scene${playing ? " is-playing" : ""}${revealed ? " is-revealed" : ""}`}
      aria-label="Trilha"
    >

      <style>{`
        .music-scene {
          position: relative;
          width: 100%;
          min-height: 100vh;
          background:
            radial-gradient(70% 55% at 78% 8%, rgba(201,161,90,0.10) 0%, rgba(201,161,90,0) 60%),
            radial-gradient(90% 70% at 50% 50%, #14100A 0%, #0A0805 60%, #050403 100%);
          color: #F3ECDD;
          overflow: hidden;
          padding: 112px 20px 128px;
        }
        /* Transição contínua vindo do creme da Letter — gradiente permanente
           que cria o crossfade real conforme o usuário rola. */
        .ms-fade-top {
          position: absolute;
          top: -1px; left: 0; right: 0;
          height: 620px;
          pointer-events: none;
          z-index: 3;
          background: linear-gradient(
            180deg,
            #EFE3C8 0%,
            rgba(239,227,200,0.92) 8%,
            rgba(232,215,180,0.72) 20%,
            rgba(120,90,55,0.42) 42%,
            rgba(40,28,18,0.22) 68%,
            rgba(20,16,10,0) 100%
          );
        }
        /* Raios de luz superior direito — sutis, aparecem só após entrar na cena */
        .ms-rays {
          position: absolute;
          top: -10%; right: -10%;
          width: 52%; height: 62%;
          pointer-events: none;
          background:
            linear-gradient(200deg, rgba(255,220,150,0.045) 0%, rgba(255,220,150,0) 55%),
            linear-gradient(215deg, rgba(255,220,150,0.026) 0%, rgba(255,220,150,0) 60%);
          filter: blur(3px);
          mix-blend-mode: screen;
          opacity: 0;
          transition: opacity 2600ms ease-out 1400ms;
        }
        .music-scene.is-revealed .ms-rays { opacity: 1; }
        /* Partículas douradas — poucas, lentas, discretas */
        .ms-dust {
          position: absolute; inset: 0;
          pointer-events: none;
          background-image:
            radial-gradient(1px 1px at 22% 26%, rgba(201,161,90,0.24), transparent 60%),
            radial-gradient(1px 1px at 68% 38%, rgba(201,161,90,0.20), transparent 60%),
            radial-gradient(1px 1px at 86% 72%, rgba(201,161,90,0.18), transparent 60%),
            radial-gradient(1px 1px at 14% 82%, rgba(201,161,90,0.18), transparent 60%);
          opacity: 0;
          transition: opacity 2400ms ease-out 900ms;
        }
        .music-scene.is-revealed .ms-dust { opacity: 0.20; }
        .music-scene.is-revealed.is-playing .ms-dust { opacity: 0.32; }




        .ms-inner {
          position: relative;
          z-index: 2;
          max-width: 560px;
          margin: 0 auto;
          text-align: center;
        }

        .ms-heart-top {
          display: block;
          margin: 0 auto 24px;
          color: ${GOLD};
        }

        .ms-title {
          margin: 0 auto;
          max-width: 520px;
          font-family: ${SERIF};
          font-weight: 400;
          font-size: clamp(28px, 5.6vw, 40px);
          line-height: 1.18;
          letter-spacing: -0.012em;
          color: #F3ECDD;
        }
        .ms-title em {
          font-style: italic;
          color: ${GOLD};
        }
        .ms-title-rule {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          margin: 20px auto 22px;
          max-width: 260px;
        }
        .ms-title-rule span {
          flex: 1; height: 1px; background: rgba(201,161,90,0.42);
        }
        .ms-title-rule i {
          width: 4px; height: 4px; background: ${GOLD}; transform: rotate(45deg);
        }

        .ms-sub {
          margin: 0 auto 8px;
          max-width: 420px;
          font-family: ${SERIF};
          font-size: 15px;
          line-height: 1.65;
          color: #E8DFC9;
          opacity: 0.82;
          letter-spacing: 0.005em;
        }

        .ms-cover-wrap {
          position: relative;
          width: min(44vw, 206px);
          aspect-ratio: 1 / 1;
          margin: 64px auto 68px;
        }


        /* Halo dourado muito discreto atrás da capa */
        .ms-cover-wrap::before {
          content: "";
          position: absolute;
          inset: -8%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,161,90,0.16) 0%, rgba(201,161,90,0) 65%);
          filter: blur(20px);
          pointer-events: none;
          z-index: 0;
        }
        .ms-rings {
          position: absolute; inset: -14%;
          border-radius: 50%;
          pointer-events: none;
        }
        .ms-ring {
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(201,161,90,0.22);
        }
        .ms-ring.r2 { inset: 4%; border-color: rgba(201,161,90,0.18); }
        .ms-ring.r3 { inset: 9%; border-color: rgba(201,161,90,0.14); }
        .ms-ring.r4 { inset: 14%; border-color: rgba(201,161,90,0.10); }
        .ms-rings-spin {
          position: absolute; inset: 0;
          animation-play-state: paused;
        }
        .music-scene.is-playing .ms-rings-spin {
          animation: ms-spin 60s linear infinite;
          animation-play-state: running;
        }
        @keyframes ms-spin { to { transform: rotate(360deg); } }
        /* Glow no anel */
        .ms-ring-glow {
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(201,161,90,0.45);
          box-shadow:
            inset 0 0 30px rgba(201,161,90,0.08),
            0 0 50px rgba(201,161,90,0.14);
        }
        .ms-ring-spark {
          position: absolute;
          top: 8%; right: 6%;
          width: 12px; height: 12px;
          border-radius: 50%;
          background: radial-gradient(circle, #FFE7B0 0%, rgba(255,231,176,0) 70%);
          filter: blur(1px);
        }

        .ms-cover {
          position: absolute; inset: 6%;
          border-radius: 50%;
          overflow: hidden;
          background: #1a1108;
          box-shadow:
            0 0 0 1px rgba(201,161,90,0.24),
            0 20px 56px rgba(0,0,0,0.45),
            0 6px 22px rgba(0,0,0,0.32);
          transition: transform 1400ms cubic-bezier(0.22,1,0.36,1);
          z-index: 1;
        }
        .music-scene.is-playing .ms-cover { transform: scale(1.01); }
        .ms-cover img {
          width: 100%; height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        .ms-cover-fallback {
          width: 100%; height: 100%;
          display: grid; place-items: center;
          color: ${GOLD};
          font-family: ${SERIF};
          font-size: 38px;
          font-style: italic;
        }

        .ms-meta {
          margin-top: 10px;
          font-family: ${SERIF};
        }
        .ms-track {
          margin: 0;
          font-size: clamp(20px, 3.6vw, 26px);
          font-weight: 400;
          letter-spacing: 0.005em;
          color: #F3ECDD;
        }
        .ms-artist {
          margin: 8px 0 0;
          font-size: 13.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${GOLD_SOFT};
          opacity: 0.78;
        }


        .ms-wave {
          display: flex; align-items: center; justify-content: center;
          gap: 2px;
          height: 18px;
          margin: 34px auto 0;
          max-width: 420px;
          padding: 0 8px;
          opacity: 0.7;
        }
        .ms-wave-bar {
          width: 1px;
          background: rgba(201,161,90,0.18);
          border-radius: 2px;
          transition: background 260ms ease, transform 260ms ease;
        }
        .ms-wave-bar.on {
          background: rgba(184,146,74,0.85);
        }
        .music-scene.is-playing .ms-wave-bar.on {
          animation: ms-pulse 1600ms ease-in-out infinite;
        }
        @keyframes ms-pulse {
          0%,100% { transform: scaleY(1); }
          50%     { transform: scaleY(1.14); }
        }

        .ms-progress {
          position: relative;
          margin: 18px auto 0;
          max-width: 420px;
          height: 14px;
          display: flex; align-items: center;
          cursor: pointer;
        }
        .ms-progress-track {
          width: 100%; height: 1px;
          background: rgba(255,255,255,0.06);
          position: relative;
        }
        .ms-progress-fill {
          position: absolute; left: 0; top: 0; bottom: 0;
          background: linear-gradient(90deg, rgba(201,161,90,0.22) 0%, ${GOLD_SOFT} 100%);
        }
        .ms-progress-thumb {
          position: absolute; top: 50%;
          width: 4px; height: 4px;
          border-radius: 50%;
          background: ${GOLD_SOFT};
          transform: translate(-50%, -50%);
        }

        .ms-times {
          display: flex; justify-content: space-between;
          max-width: 420px;
          margin: 10px auto 0;
          font-family: ${SERIF};
          font-size: 11.5px;
          letter-spacing: 0.06em;
          color: rgba(243,236,221,0.42);
        }

        .ms-controls {
          display: flex; align-items: center; justify-content: space-between;
          max-width: 260px;
          margin: 28px auto 0;
          padding: 0 4px;
          color: ${GOLD_SOFT};
        }
        .ms-ctrl {
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 6px;
          display: inline-flex; align-items: center; justify-content: center;
          transition: opacity .2s ease, transform .2s ease;
          opacity: 0.55;
        }
        .ms-ctrl:hover { opacity: 0.95; transform: translateY(-1px); }
        .ms-ctrl.small { opacity: 0.42; }
        .ms-ctrl.small:hover { opacity: 0.78; }

        .ms-play {
          width: 34px; height: 34px;
          border-radius: 50%;
          border: 1px solid rgba(184,146,74,0.38);
          background: transparent;
          color: rgba(184,146,74,0.85);
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer;
          box-shadow: none;
          transition: transform .3s cubic-bezier(0.22,1,0.36,1), border-color .35s ease, color .35s ease;
        }
        .ms-play:hover { transform: scale(1.03); border-color: rgba(184,146,74,0.6); color: #C9A15A; }
        .ms-play:active { transform: scale(0.97); }


        .ms-liked { color: ${GOLD}; }

        .ms-outro {
          margin: 64px auto 0;
          max-width: 440px;
          font-family: ${SERIF};
          font-size: 16px;
          line-height: 1.65;
          color: #E8DFC9;
          opacity: 0.88;
        }
        .ms-outro em { color: ${GOLD}; font-style: normal; }

        .ms-scroll {
          margin: 60px auto 0;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          color: ${GOLD};
          font-family: "Karla", sans-serif;
          font-size: 11px;
          letter-spacing: 0.35em;
          opacity: 0.7;
        }
        .ms-scroll-heart { color: ${GOLD}; margin-bottom: 14px; }
        .ms-scroll-line {
          width: 1px; height: 34px;
          background: linear-gradient(180deg, rgba(201,161,90,0) 0%, rgba(201,161,90,0.8) 100%);
        }
        .ms-scroll-arrow {
          animation: ms-bob 2600ms ease-in-out infinite;
        }
        @keyframes ms-bob {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(5px); }
        }

        @media (max-width: 480px) {
          .music-scene { padding: 68px 18px 92px; }
          .ms-title { font-size: 26px; }
          .ms-sub { font-size: 14.5px; margin-bottom: 36px; }
          .ms-cover-wrap { width: 62vw; max-width: 240px; margin: 40px auto 44px; }
          .ms-wave { max-width: 300px; height: 16px; margin-top: 28px; }
          .ms-progress, .ms-times { max-width: 300px; }
          .ms-controls { max-width: 240px; padding: 0; margin-top: 24px; }
          .ms-play { width: 42px; height: 42px; }
          .ms-outro { font-size: 15px; margin-top: 52px; }
        }


        @media (prefers-reduced-motion: reduce) {
          .ms-rings-spin, .ms-wave-bar.on, .ms-scroll-arrow {
            animation: none !important;
          }
          .music-scene.is-playing .ms-cover { transform: none; }
        }
      `}</style>

      <div className="ms-fade-top" aria-hidden />
      <div className="ms-rays" aria-hidden />
      <div className="ms-dust" aria-hidden />

      <motion.div
        className="ms-inner"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
        whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 1.6, ease: EASE }}
      >
        <svg className="ms-heart-top" width="18" height="16" viewBox="0 0 18 16" fill="none" aria-hidden>
          <path d="M9 14.5s-6-3.6-6-8.4A3.6 3.6 0 0 1 9 4a3.6 3.6 0 0 1 6 2.1c0 4.8-6 8.4-6 8.4z" stroke="currentColor" strokeWidth="1.1" fill="rgba(201,161,90,0.12)" />
        </svg>

        <motion.h2
          className="ms-title"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.3 }}
        >
          Existem músicas
          <br />
          que contam <em>histórias.</em>
        </motion.h2>

        <div className="ms-title-rule" aria-hidden>
          <span /><i /><span />
        </div>

        <motion.p
          className="ms-sub"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.6 }}
        >
          Essa me lembra nós.
          <br />
          Aperte o play e deixe essa lembrança tocar.
        </motion.p>

        <motion.div
          className="ms-cover-wrap"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.8 }}
        >
          <div className="ms-rings" aria-hidden>
            <div className="ms-rings-spin">
              <div className="ms-ring" />
              <div className="ms-ring r2" />
              <div className="ms-ring r3" />
              <div className="ms-ring r4" />
            </div>
            <div className="ms-ring-glow" />
            <div className="ms-ring-spark" />
          </div>
          <div className="ms-cover">
            {cover ? (
              <img src={cover} alt={title || "Capa"} loading="lazy" />
            ) : (
              <div className="ms-cover-fallback">♪</div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="ms-meta"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.2, ease: EASE, delay: 1.0 }}
        >
          <h3 className="ms-track">{title || "Nossa canção"}</h3>
          {artist && <p className="ms-artist">{artist}</p>}
        </motion.div>

        <div className="ms-wave" aria-hidden>
          {BARS.map((h, i) => (
            <span
              key={i}
              className={`ms-wave-bar${i <= activeBar ? " on" : ""}`}
              style={{
                height: `${Math.round(h * 100)}%`,
                animationDelay: `${(i % 10) * 90}ms`,
              }}
            />
          ))}
        </div>

        <div
          className="ms-progress"
          role="slider"
          aria-label="Progresso"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            seek((e.clientX - rect.left) / rect.width);
          }}
        >
          <div className="ms-progress-track">
            <div className="ms-progress-fill" style={{ width: `${progress * 100}%` }} />
            <div className="ms-progress-thumb" style={{ left: `${progress * 100}%` }} />
          </div>
        </div>

        <div className="ms-times">
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>

        <div className="ms-controls">
          <button
            className={`ms-ctrl${liked ? " ms-liked" : ""}`}
            aria-label="Curtir"
            aria-pressed={liked}
            onClick={() => setLiked((v) => !v)}
          >
            <svg width="20" height="18" viewBox="0 0 20 18" fill={liked ? "currentColor" : "none"}>
              <path d="M10 16s-7-4.2-7-9.8A4.2 4.2 0 0 1 10 4a4.2 4.2 0 0 1 7 2.2C17 11.8 10 16 10 16z" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>

          <button className="ms-ctrl" aria-label="Anterior" onClick={() => seek(0)}>
            <svg width="22" height="18" viewBox="0 0 22 18" fill="currentColor">
              <path d="M4 3v12M20 3v12l-9-6z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
            </svg>
          </button>

          <button className="ms-play" onClick={toggle} aria-label={playing ? "Pausar" : "Tocar"}>
            {playing ? (
              <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
                <rect x="2" y="1.5" width="3" height="13" rx="0.8" />
                <rect x="9" y="1.5" width="3" height="13" rx="0.8" />
              </svg>
            ) : (
              <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
                <path d="M3 1.5l10 6.5-10 6.5V1.5z" />
              </svg>
            )}
          </button>

          <button
            className="ms-ctrl"
            aria-label="Próxima"
            onClick={() => seek(Math.min(1, progress + 0.1))}
          >
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
              <path d="M18 3v12M2 3v12l9-6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </button>

          <button className="ms-ctrl small" aria-label="Mais opções">
            <svg width="20" height="6" viewBox="0 0 20 6" fill="currentColor">
              <circle cx="3" cy="3" r="1.4" />
              <circle cx="10" cy="3" r="1.4" />
              <circle cx="17" cy="3" r="1.4" />
            </svg>
          </button>
        </div>

        <audio
          ref={audioRef}
          src={src || undefined}
          preload="auto"
          playsInline
        />




        {showOutro && (
          <motion.p
            className="ms-outro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.0, ease: EASE }}
          >
            Algumas músicas não são só música.
            <br />
            Elas são <em>lembranças.</em>
          </motion.p>
        )}

        <div className="ms-scroll" aria-hidden>
          <svg className="ms-scroll-heart" width="14" height="12" viewBox="0 0 14 12" fill="currentColor">
            <path d="M7 11S1 7.2 1 3.9A2.9 2.9 0 0 1 7 2a2.9 2.9 0 0 1 6 1.9C13 7.2 7 11 7 11z" />
          </svg>
          <span>ROLE PARA CONTINUAR</span>
          <span className="ms-scroll-line" />
          <svg className="ms-scroll-arrow" width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M1 1l6 7 6-7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </motion.div>

    </section>
  );
}
