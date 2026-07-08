/* HeroScene — V4: polimento final de animações (entradas suaves + fade no scroll).
   Layout, tipografia, imagem, grading e overlays permanecem congelados. */

import { useEffect, useRef } from "react";

const DISPLAY = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const SUB = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

export function HeroScene({
  name,
  photo,
  cinematicPhoto,
}: {
  name: string;
  photo: string;
  cinematicPhoto?: string | null;
  ready?: boolean;
}) {
  const displayName = name || "você";
  // Se a imagem já vem tratada (cinematográfica), usamos ela e desligamos o
  // grading via CSS — o front não deve reprocessar uma foto já finalizada.
  const heroSrc = cinematicPhoto || photo;
  const isTreated = !!cinematicPhoto;

  // Fade suave no scroll: opacity do conteúdo diminui conforme sai da viewport.
  const sectionRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const h = window.innerHeight || 1;
      const y = window.scrollY || window.pageYOffset || 0;
      const p = Math.min(1, Math.max(0, y / (h * 0.9)));
      const opacity = 1 - p;
      el.style.opacity = String(opacity);
    };
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} className="hero-scene" aria-label="Abertura">
      <style>{`
        .hero-scene {
          position: relative;
          width: 100%;
          height: 100svh;
          min-height: 100svh;
          overflow: hidden;
          background: #060403;
          color: #fff;
          transition: opacity 200ms linear;
        }
        .hero-photo {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover; object-position: center 28%;
          display: block;
          filter: url(#hero-grade);
          opacity: 0;
          transform: scale(1.04);
          animation: hero-photo-in 1800ms cubic-bezier(0.22, 1, 0.36, 1) 100ms forwards;
        }
        .hero-bloom {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover; object-position: center 28%;
          display: block;
          filter: url(#hero-grade) blur(32px) brightness(1.28) saturate(1.15);
          mix-blend-mode: screen;
          opacity: 0;
          pointer-events: none;
          animation: hero-bloom-in 2200ms ease-out 300ms forwards;
        }
        @keyframes hero-photo-in {
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes hero-bloom-in {
          to { opacity: 0.24; }
        }

        .hero-layer { position: absolute; inset: 0; pointer-events: none; }
        /* Camada 1 — warm tint global (âmbar sutil) */
        .hero-layer-1 {
          background: rgba(120, 70, 25, 0.10);
          mix-blend-mode: soft-light;
        }
        /* Camada 1b — glow quente superior */
        .hero-layer-1b {
          background: radial-gradient(
            80% 55% at 50% 8%,
            rgba(255, 176, 92, 0.22) 0%,
            rgba(255, 150, 70, 0.10) 35%,
            rgba(0, 0, 0, 0) 70%
          );
          mix-blend-mode: screen;
        }
        /* Camada 2 — degradê vertical + vinheta inferior mais profunda */
        .hero-layer-2 {
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,0.10) 0%,
            rgba(0,0,0,0.02) 22%,
            rgba(0,0,0,0.28) 58%,
            rgba(8,4,2,0.78) 82%,
            rgba(4,2,1,0.94) 100%
          );
        }
        /* Camada 3 — vinheta radial mais marcada */
        .hero-layer-3 {
          background: radial-gradient(
            120% 95% at 50% 42%,
            rgba(0,0,0,0) 48%,
            rgba(0,0,0,0.24) 82%,
            rgba(0,0,0,0.46) 100%
          );
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


        .hero-content {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          z-index: 2;
          padding: 0 40px 150px;
          text-align: left;
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
          transform: translateY(12px);
          animation: hero-text-in 1200ms cubic-bezier(0.22, 1, 0.36, 1) 900ms forwards;
        }

        .hero-name {
          margin: 0;
          font-family: ${DISPLAY};
          font-weight: 500;
          font-size: clamp(140px, 34vw, 240px);
          line-height: 0.88;
          letter-spacing: -0.015em;
          color: #F3ECDD;
          opacity: 0;
          transform: translateY(18px);
          animation: hero-text-in 1400ms cubic-bezier(0.22, 1, 0.36, 1) 1100ms forwards;
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
          transform: scaleX(0);
          transform-origin: left center;
          animation: hero-rule-draw 1400ms cubic-bezier(0.65, 0, 0.35, 1) 1500ms forwards;
        }
        .hero-rule-line.right {
          transform-origin: right center;
        }
        .hero-rule-heart {
          color: #C9A15A;
          font-size: 10px;
          line-height: 1;
          opacity: 0;
          transform: scale(0.6);
          animation: hero-heart-in 900ms cubic-bezier(0.22, 1, 0.36, 1) 2500ms forwards;
        }
        @keyframes hero-rule-draw {
          to { transform: scaleX(1); }
        }
        @keyframes hero-heart-in {
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes hero-text-in {
          to { opacity: 1; transform: translateY(0); }
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
          transform: translateY(12px);
          animation: hero-text-in 1400ms cubic-bezier(0.22, 1, 0.36, 1) 2800ms forwards;
        }
        @media (min-width: 768px) {
          .hero-sub { font-size: 30px; }
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
          animation: hero-scroll-in 1200ms ease-out 3400ms forwards, hero-scroll-bob 2600ms ease-in-out 4600ms infinite;
        }

        @keyframes hero-scroll-in {
          to { opacity: 0.85; }
        }
        @keyframes hero-scroll-bob {
          0%, 100% { transform: translate(-50%, 0); }
          50%      { transform: translate(-50%, 6px); }
        }
        .hero-scroll-line {
          width: 1px;
          height: 44px;
          background: linear-gradient(180deg, rgba(201,161,90,0) 0%, rgba(201,161,90,0.9) 100%);
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-photo,
          .hero-bloom,
          .hero-layer-1, .hero-layer-2,
          .hero-eyebrow, .hero-name,
          .hero-rule-line, .hero-rule-heart,
          .hero-sub, .hero-scroll {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .hero-bloom { opacity: 0.18 !important; }
          .hero-scroll { opacity: 0.85 !important; }
        }
      `}</style>

      {/* Color grading filter — matriz + curva S + vibrance seletiva */}
      <svg aria-hidden width="0" height="0" style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="hero-grade" colorInterpolationFilters="sRGB">
            {/* Grading cinematográfico quente — puxa âmbar/dourado nos meios-tons,
                 preserva pele sem amarelar, aumenta contraste elegante. */}
            <feColorMatrix
              type="matrix"
              values="
                1.075  0.030  0.000  0  0.010
                0.020  1.005  0.010  0  0.004
                0.000  0.010  0.900  0  -0.006
                0      0      0      1  0"
            />
            {/* Vibrance sutil — cores um pouco mais vivas sem saturar pele */}
            <feColorMatrix type="saturate" values="1.06" />
            {/* Curva S mais marcada: pretos profundos, highlights preservados,
                 azul um pouco reduzido para reforçar temperatura quente. */}
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.00 0.06 0.22 0.42 0.62 0.78 0.91 1.00" />
              <feFuncG type="table" tableValues="0.00 0.05 0.20 0.39 0.58 0.74 0.88 0.99" />
              <feFuncB type="table" tableValues="0.00 0.04 0.17 0.34 0.52 0.68 0.82 0.95" />
            </feComponentTransfer>

          </filter>
        </defs>
      </svg>

      {heroSrc && (
        <img
          className="hero-photo"
          src={heroSrc}
          alt=""
          aria-hidden
          loading="eager"
          style={isTreated ? { filter: "none" } : undefined}
          fetchPriority="high"
        />
      )}
      {heroSrc && !isTreated && (
        <img
          className="hero-bloom"
          src={heroSrc}
          alt=""
          aria-hidden
        />
      )}


      <div  className="hero-layer hero-layer-1" />
      <div className="hero-layer hero-layer-1b" />

      <div className="hero-layer hero-layer-2" />
      <div className="hero-layer hero-layer-3" />
      <div className="hero-grain" />

      <div  className="hero-content">
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

      <div  className="hero-scroll" aria-hidden>
        <span className="hero-scroll-line" />
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <path d="M1 1l6 7 6-7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
