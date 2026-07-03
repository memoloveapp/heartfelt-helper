import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";


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
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["end 85%", "end 15%"],
  });
  const outroOpacity = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1, 0.12]);
  const outroScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1, 0.98]);
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
          padding: 112px 20px 40px;
        }
        /* A Letter já mergulha em preto quente no bottom — aqui apenas suavizamos
           o topo para que a costura seja invisível. */
        .ms-fade-top {
          position: absolute;
          top: -1px; left: 0; right: 0;
          height: 320px;
          pointer-events: none;
          z-index: 3;
          background: linear-gradient(
            180deg,
            rgba(10,8,5,1) 0%,
            rgba(10,8,5,0.85) 35%,
            rgba(10,8,5,0.35) 72%,
            rgba(10,8,5,0) 100%
          );
        }
        /* Costura invisível com a MemoryScene — aquece e escurece gradualmente
           os últimos ~280px para conversar com o fundo da próxima cena. */
        .ms-fade-bottom {
          position: absolute;
          left: 0; right: 0; bottom: -1px;
          height: 280px;
          pointer-events: none;
          z-index: 3;
          background:
            radial-gradient(80% 100% at 50% 100%, rgba(212,168,92,0.06) 0%, rgba(212,168,92,0) 65%),
            linear-gradient(
              180deg,
              rgba(10,8,5,0) 0%,
              rgba(12,9,6,0.55) 55%,
              rgba(14,10,7,0.95) 100%
            );
        }
        /* Raios de luz superior direito — mínimos */
        .ms-rays {
          position: absolute;
          top: -8%; right: -8%;
          width: 48%; height: 58%;
          pointer-events: none;
          background:
            linear-gradient(200deg, rgba(255,220,150,0.032) 0%, rgba(255,220,150,0) 55%),
            linear-gradient(215deg, rgba(255,220,150,0.018) 0%, rgba(255,220,150,0) 60%);
          filter: blur(4px);
          mix-blend-mode: screen;
          opacity: 0;
          transition: opacity 2800ms ease-out 1600ms;
        }
        .music-scene.is-revealed .ms-rays { opacity: 1; }
        /* Partículas douradas — mínimas, quase invisíveis até tocar */
        .ms-dust {
          position: absolute; inset: 0;
          pointer-events: none;
          background-image:
            radial-gradient(1px 1px at 24% 28%, rgba(201,161,90,0.18), transparent 60%),
            radial-gradient(1px 1px at 68% 40%, rgba(201,161,90,0.14), transparent 60%),
            radial-gradient(1px 1px at 84% 72%, rgba(201,161,90,0.12), transparent 60%),
            radial-gradient(1px 1px at 16% 82%, rgba(201,161,90,0.12), transparent 60%);
          opacity: 0;
          transition: opacity 2600ms ease-out 1100ms;
        }
        .music-scene.is-revealed .ms-dust { opacity: 0.14; }
        .music-scene.is-revealed.is-playing .ms-dust { opacity: 0.26; }






        .ms-inner {
          position: relative;
          z-index: 4; /* acima do .ms-fade-top (z-index: 3), que escurecia o título */
          max-width: 560px;
          margin: 0 auto;
          text-align: center;
        }

        .ms-heart-top {
          display: block;
          margin: 0 auto 32px;
          color: #93753C;
          opacity: 0.95;
          filter: drop-shadow(0 0 6px rgba(147,117,60,0.55));
          transform-origin: center;
          animation: ms-heart-beat 1.6s ease-in-out infinite;
        }
        @keyframes ms-heart-beat {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          15%      { transform: scale(1.18); opacity: 1; }
          30%      { transform: scale(1); opacity: 0.9; }
          45%      { transform: scale(1.12); opacity: 1; }
          60%      { transform: scale(1); opacity: 0.85; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ms-heart-top { animation: none; }
        }

        .ms-title {
          position: relative;
          margin: 0 auto;
          max-width: 520px;
          font-family: ${SERIF};
          font-weight: 500;
          font-size: clamp(26px, 5.2vw, 38px);
          line-height: 1.22;
          letter-spacing: -0.012em;
          color: #F0ECE4;
        }
        /* Feixe ambiente amplo e desfocado atrás da frase */
        .ms-title::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 140%;
          height: 320%;
          background: radial-gradient(ellipse at center, rgba(255,214,150,0.14) 0%, rgba(255,200,130,0.07) 35%, rgba(255,200,130,0) 70%);
          pointer-events: none;
          z-index: -1;
          filter: blur(38px);
        }
        .ms-title em {
          font-style: italic;
          font-weight: 500;
          color: #C8A15A;
        }
        .ms-title-rule {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          margin: 32px auto 0;
          max-width: 220px;
        }
        .ms-title-rule span {
          flex: 1; height: 1.5px;
          background: linear-gradient(90deg, rgba(232,196,128,0) 0%, #F0CE85 50%, rgba(232,196,128,0) 100%);
        }
        .ms-title-rule i {
          width: 5px; height: 5px; background: #F5D89A; transform: rotate(45deg);
          box-shadow: 0 0 12px rgba(232,196,128,0.95);
        }

        .ms-cover-wrap {
          position: relative;
          width: min(32vw, 148px);
          aspect-ratio: 1 / 1;
          margin: 96px auto 96px;
        }

        /* Halo dourado quase imperceptível atrás da capa */
        .ms-cover-wrap::before {
          content: "";
          position: absolute;
          inset: -6%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,161,90,0.09) 0%, rgba(201,161,90,0) 65%);
          filter: blur(22px);
          pointer-events: none;
          z-index: 0;
        }
        .ms-rings {
          position: absolute; inset: -10%;
          border-radius: 50%;
          pointer-events: none;
        }
        .ms-ring {
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(201,161,90,0.14);
        }
        .ms-ring.r2 { inset: 4%; border-color: rgba(201,161,90,0.10); }
        .ms-ring.r3 { inset: 9%; border-color: rgba(201,161,90,0.07); }
        .ms-ring.r4 { display: none; }
        .ms-rings-spin {
          position: absolute; inset: 0;
          animation-play-state: paused;
        }
        .music-scene.is-playing .ms-rings-spin {
          animation: ms-spin 72s linear infinite;
          animation-play-state: running;
        }
        @keyframes ms-spin { to { transform: rotate(360deg); } }
        .ms-ring-glow {
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(201,161,90,0.24);
          box-shadow: inset 0 0 22px rgba(201,161,90,0.04);
        }
        .ms-ring-spark { display: none; }



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
          margin: 0 auto;
          font-family: ${SERIF};
          font-size: clamp(19px, 3.2vw, 24px);
          font-weight: 400;
          letter-spacing: 0.006em;
          color: #F3ECDD;
          text-align: center;
        }
        .ms-artist {
          margin: 14px auto 0;
          font-family: "Karla", "Inter", sans-serif;
          font-size: 11px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: ${GOLD_SOFT};
          opacity: 0.62;
          text-align: center;
        }


        .ms-wave {
          display: flex; align-items: center; justify-content: center;
          gap: 2px;
          height: 16px;
          margin: 64px auto 0;
          max-width: 380px;
          padding: 0 8px;
          opacity: 0.62;
        }
        .ms-wave-bar {
          width: 1px;
          background: rgba(201,161,90,0.16);
          border-radius: 2px;
          transition: background 260ms ease, transform 260ms ease;
        }
        .ms-wave-bar.on {
          background: rgba(184,146,74,0.78);
        }
        .music-scene.is-playing .ms-wave-bar.on {
          animation: ms-pulse 1600ms ease-in-out infinite;
        }
        @keyframes ms-pulse {
          0%,100% { transform: scaleY(1); }
          50%     { transform: scaleY(1.12); }
        }

        .ms-progress {
          position: relative;
          margin: 22px auto 0;
          max-width: 380px;
          height: 14px;
          display: flex; align-items: center;
          cursor: pointer;
        }
        .ms-progress-track {
          width: 100%; height: 1px;
          background: rgba(255,255,255,0.05);
          position: relative;
        }
        .ms-progress-fill {
          position: absolute; left: 0; top: 0; bottom: 0;
          background: linear-gradient(90deg, rgba(201,161,90,0.18) 0%, ${GOLD_SOFT} 100%);
        }
        .ms-progress-thumb {
          position: absolute; top: 50%;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: ${GOLD_SOFT};
          transform: translate(-50%, -50%);
        }

        .ms-times {
          display: flex; justify-content: space-between;
          max-width: 380px;
          margin: 12px auto 0;
          font-family: ${SERIF};
          font-size: 11px;
          letter-spacing: 0.08em;
          color: rgba(243,236,221,0.35);
        }

        .ms-controls {
          display: flex; align-items: center; justify-content: space-between;
          max-width: 240px;
          margin: 44px auto 0;
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
          width: 30px; height: 30px;
          border-radius: 50%;
          border: 1px solid rgba(184,146,74,0.28);
          background: transparent;
          color: rgba(184,146,74,0.78);
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer;
          box-shadow: none;
          transition: transform .3s cubic-bezier(0.22,1,0.36,1), border-color .4s ease, color .4s ease;
        }
        .ms-play:hover { transform: scale(1.04); border-color: rgba(184,146,74,0.5); color: #C9A15A; }
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
          .music-scene { padding: 72px 22px 32px; }
          .ms-fade-top { height: 240px; }
          .ms-title { font-size: 24px; }
          .ms-cover-wrap { width: 36vw; max-width: 138px; margin: 76px auto 76px; }
          .ms-wave { max-width: 260px; height: 14px; margin-top: 52px; }
          .ms-progress, .ms-times { max-width: 260px; }
          .ms-controls { max-width: 220px; padding: 0; margin-top: 36px; }
          .ms-play { width: 32px; height: 32px; }
          .ms-outro { font-size: 14.5px; margin-top: 60px; }
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
        style={{ opacity: outroOpacity, scale: outroScale, transformOrigin: "center 35%", willChange: "opacity, transform" }}
      >
      <motion.div
        className="ms-inner"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 1.2, ease: EASE, delay: 0.5 }}
      >


        <svg className="ms-heart-top" width="16" height="14" viewBox="0 0 18 16" fill="none" aria-hidden>
          <path d="M9 14.5s-6-3.6-6-8.4A3.6 3.6 0 0 1 9 4a3.6 3.6 0 0 1 6 2.1c0 4.8-6 8.4-6 8.4z" stroke="currentColor" strokeWidth="1.1" fill="rgba(201,161,90,0.10)" />
        </svg>

        <motion.h2
          className="ms-title"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 2.0, ease: EASE, delay: 1.4 }}
          style={{ color: "#F2EEE7" }}
        >
          Algumas lembranças
          <br />
          nunca deixaram de <em style={{ color: "#C8A15A", fontStyle: "italic" }}>tocar.</em>
        </motion.h2>

        <motion.div
          className="ms-title-rule"
          aria-hidden
          initial={{ opacity: 0, scaleX: 0.6 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.6, ease: EASE, delay: 2.0 }}
          style={{ transformOrigin: "center" }}
        >
          <span /><i /><span />
        </motion.div>


        <motion.div
          className="ms-cover-wrap"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.4, ease: EASE, delay: 1.2 }}
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

        <motion.h3
          className="ms-track"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.0, ease: EASE, delay: 1.7 }}
        >
          {title || "Nossa canção"}
        </motion.h3>

        {artist && (
          <motion.p
            className="ms-artist"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.9, ease: EASE, delay: 1.95 }}
          >
            {artist}
          </motion.p>
        )}

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.0, ease: EASE, delay: 2.2 }}
        >
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
        </motion.div>


        <motion.div
          className="ms-controls"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.9, ease: EASE, delay: 2.5 }}
        >

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
              <svg width="10" height="12" viewBox="0 0 14 16" fill="currentColor">
                <rect x="2" y="1.5" width="3" height="13" rx="0.8" />
                <rect x="9" y="1.5" width="3" height="13" rx="0.8" />
              </svg>
            ) : (
              <svg width="10" height="12" viewBox="0 0 14 16" fill="currentColor">
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
        </motion.div>

        <audio
          ref={audioRef}
          src={src || undefined}
          preload="auto"
          playsInline
        />




        {showOutro && (
          <motion.p
            className="ms-outro"
            initial={{ opacity: 0, filter: "blur(12px)", y: 8 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 2.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            <motion.span
              style={{ display: "block" }}
              initial={{ opacity: 0, filter: "blur(10px)", y: 6 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            >
              Algumas músicas não são só música.
            </motion.span>
            <motion.span
              style={{ display: "block", marginTop: "0.35em" }}
              initial={{ opacity: 0, filter: "blur(10px)", y: 6 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 2.6, ease: [0.22, 1, 0.36, 1], delay: 1.4 }}
            >
              Elas são <em>lembranças.</em>
            </motion.span>
          </motion.p>
        )}

      </motion.div>
      </motion.div>

      <div className="ms-fade-bottom" aria-hidden />
    </section>
  );
}
