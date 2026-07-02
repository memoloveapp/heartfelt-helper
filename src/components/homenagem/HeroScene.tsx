import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/* HeroScene — reprodução fiel + animações cinematográficas
   props: { name, photo, ready? } */

const DISPLAY = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const SUB = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

export function HeroScene({ name, photo }: { name: string; photo: string; ready?: boolean }) {
  const reduce = useReducedMotion();
  const displayName = name || "você";

  const photoRef = useRef<HTMLImageElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const vh = window.innerHeight || 1;
        const t = Math.min(1, y / vh);
        if (photoRef.current) {
          photoRef.current.style.transform = `translate3d(0, ${y * 0.1}px, 0) scale(${1 - t * 0.02})`;
        }
        if (contentRef.current) {
          contentRef.current.style.opacity = String(Math.max(0, 1 - t * 1.4));
          contentRef.current.style.transform = `translate3d(0, ${-y * 0.05}px, 0)`;
        }
        if (overlayRef.current) {
          overlayRef.current.style.opacity = String(Math.min(1, 0.4 + t * 0.9));
        }
        if (scrollRef.current) {
          scrollRef.current.style.opacity = String(Math.max(0, 0.85 - t * 2));
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  return (
    <section className="hero-scene" aria-label="Abertura">
      <style>{`
        .hero-scene {
          position: relative;
          width: 100%;
          height: 100svh;
          min-height: 100svh;
          overflow: hidden;
          background: #0a0806;
          color: #fff;
        }
        .hero-photo {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover; object-position: center 28%;
          display: block;
          filter: url(#hero-grade);
          will-change: transform;
          animation: hero-kenburns 8000ms ease-out both;
        }
        .hero-bloom {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover; object-position: center 28%;
          display: block;
          filter: url(#hero-grade) blur(28px) brightness(1.25) saturate(1.05);
          mix-blend-mode: screen;
          opacity: 0.22;
          pointer-events: none;
          will-change: transform;
          animation: hero-kenburns 8000ms ease-out both;
        }
        @keyframes hero-kenburns {
          from { transform: scale(1.08); }
          to   { transform: scale(1.00); }
        }

        .hero-layer { position: absolute; inset: 0; pointer-events: none; will-change: opacity; }
        /* Camada 1 — tint global */
        .hero-layer-1 {
          background: rgba(0,0,0,0.10);
          opacity: 0;
          animation: hero-fade 700ms ease-out 100ms forwards;
        }
        /* Camada 2 — degradê vertical (spec) */
        .hero-layer-2 {
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,0.04) 0%,
            transparent 28%,
            rgba(0,0,0,0.20) 60%,
            rgba(0,0,0,0.82) 100%
          );
          opacity: 0;
          animation: hero-fade 700ms ease-out 100ms forwards;
        }
        /* Camada 3 — vinheta radial extremamente sutil */
        .hero-layer-3 {
          background: radial-gradient(
            120% 95% at 50% 45%,
            rgba(0,0,0,0) 55%,
            rgba(0,0,0,0.18) 85%,
            rgba(0,0,0,0.32) 100%
          );
          opacity: 0;
          animation: hero-fade 700ms ease-out 100ms forwards;
        }
        /* Grain cinematográfico */
        .hero-grain {
          position: absolute; inset: 0;
          pointer-events: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>");
          background-size: 240px 240px;
          opacity: 0.055;
          mix-blend-mode: overlay;
        }
        @keyframes hero-fade {
          from { opacity: 0; } to { opacity: 1; }
        }


        .hero-content {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          z-index: 2;
          padding: 0 40px 150px;
          text-align: left;
          will-change: transform, opacity;
        }
        @media (min-width: 768px) {
          .hero-content { padding: 0 80px 170px; }
        }

        .hero-eyebrow {
          margin: 0 0 6px;
          font-family: "Karla", "Inter", system-ui, sans-serif;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.55em;
          text-transform: uppercase;
          color: #C9A15A;
          padding-left: 0.55em;
          opacity: 0;
          transform: translateY(20px);
          animation: hero-rise 800ms ease-out 300ms forwards;
        }

        .hero-name {
          margin: 0;
          font-family: ${DISPLAY};
          font-weight: 500;
          font-size: clamp(140px, 34vw, 240px);
          line-height: 0.88;
          letter-spacing: -0.015em;
          color: #F3ECDD;
          transform-origin: left bottom;
          opacity: 0;
          transform: translateY(40px) scale(0.97);
          animation: hero-name-in 900ms cubic-bezier(0.2, 0.7, 0.2, 1) 500ms forwards;
        }
        @keyframes hero-name-in {
          from { opacity: 0; transform: translateY(40px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }

        .hero-rule {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 26px 0 30px;
          max-width: 520px;
        }
        .hero-rule-line {
          flex: 1;
          height: 1px;
          background: rgba(201, 161, 90, 0.65);
          transform-origin: left center;
          transform: scaleX(0);
          animation: hero-draw 700ms cubic-bezier(0.2, 0.7, 0.2, 1) 900ms forwards;
        }
        .hero-rule-line.right {
          transform-origin: right center;
        }
        @keyframes hero-draw {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        .hero-rule-heart {
          color: #C9A15A;
          font-size: 10px;
          line-height: 1;
          opacity: 0;
          transform: scale(0.7);
          animation: hero-heart 500ms ease-out 1600ms forwards;
        }
        @keyframes hero-heart {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }

        .hero-sub {
          margin: 0;
          max-width: 520px;
          font-family: ${SUB};
          font-weight: 400;
          font-size: 26px;
          line-height: 1.35;
          color: #EFE7D6;
          opacity: 0;
          transform: translateY(24px);
          animation: hero-rise 900ms ease-out 1200ms forwards;
        }
        @media (min-width: 768px) {
          .hero-sub { font-size: 30px; }
        }
        @keyframes hero-rise {
          from { opacity: 0; transform: translateY(var(--y, 20px)); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hero-scroll {
          position: absolute;
          left: 50%;
          bottom: 40px;
          transform: translateX(-50%);
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: #C9A15A;
          opacity: 0;
          animation:
            hero-scroll-in 900ms ease-out 3800ms forwards,
            hero-scroll-bob 2500ms ease-in-out 4700ms infinite;
        }
        @keyframes hero-scroll-in {
          from { opacity: 0; transform: translate(-50%, 8px); }
          to   { opacity: 0.85; transform: translate(-50%, 0); }
        }
        @keyframes hero-scroll-bob {
          0%, 100% { transform: translate(-50%, 0); }
          50%      { transform: translate(-50%, 8px); }
        }
        .hero-scroll-line {
          width: 1px;
          height: 44px;
          background: linear-gradient(180deg, rgba(201,161,90,0) 0%, rgba(201,161,90,0.9) 100%);
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-photo,
          .hero-layer-1, .hero-layer-2,
          .hero-eyebrow, .hero-name,
          .hero-rule-line, .hero-rule-heart,
          .hero-sub, .hero-scroll {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Color grading filter — matriz + curva S + vibrance seletiva */}
      <svg aria-hidden width="0" height="0" style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="hero-grade" colorInterpolationFilters="sRGB">
            {/* 1. Warm shift + reduz verde vivo (→ oliva) + puxa azul p/ teal escuro */}
            <feColorMatrix
              type="matrix"
              values="
                1.06  0.02  0.00  0  0.010
                0.02  0.94  0.02  0  0.005
                0.00  0.04  0.86  0  0.000
                0     0     0     1  0"
            />
            {/* 2. Dessaturação seletiva global suave (evita cores artificiais) */}
            <feColorMatrix type="saturate" values="0.88" />
            {/* 3. Curva S: pretos mais profundos, highlights suaves */}
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.00 0.05 0.22 0.48 0.72 0.88 0.97 1.00" />
              <feFuncG type="table" tableValues="0.00 0.04 0.20 0.46 0.70 0.86 0.95 0.99" />
              <feFuncB type="table" tableValues="0.00 0.03 0.17 0.42 0.66 0.82 0.92 0.97" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {photo && (
        <img
          ref={photoRef}
          className="hero-photo"
          src={photo}
          alt=""
          aria-hidden
          loading="eager"
          {...({ fetchpriority: "high" } as any)}
        />
      )}
      {photo && (
        <img
          className="hero-bloom"
          src={photo}
          alt=""
          aria-hidden
        />
      )}

      <div ref={overlayRef} className="hero-layer hero-layer-1" />
      <div className="hero-layer hero-layer-2" />
      <div className="hero-layer hero-layer-3" />
      <div className="hero-grain" />

      <div ref={contentRef} className="hero-content">
        <p className="hero-eyebrow">PARA O MEU</p>
        <h1 className="hero-name">{displayName}.</h1>

        <div className="hero-rule" aria-hidden>
          <span className="hero-rule-line" />
          <span className="hero-rule-heart">♥</span>
          <span className="hero-rule-line right" />
        </div>

        <p className="hero-sub">
          Algumas histórias merecem
          <br />
          ser lembradas para sempre.
        </p>
      </div>

      <div ref={scrollRef} className="hero-scroll" aria-hidden>
        <span className="hero-scroll-line" />
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <path d="M1 1l6 7 6-7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
