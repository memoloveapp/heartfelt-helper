/* HeroScene — V4: polimento final de animações (entradas suaves + fade no scroll).
   Layout, tipografia, imagem, grading e overlays permanecem congelados. */

import { useEffect, useRef } from "react";

const DISPLAY = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const SUB = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

export function HeroScene({
  name,
  photo,
  cinematicPhoto,
  scrollElement,
}: {
  name: string;
  photo: string;
  cinematicPhoto?: string | null;
  ready?: boolean;
  scrollElement?: HTMLElement | null;
}) {
  const displayName = name || "você";
  const heroSrc = cinematicPhoto || photo;
  const isTreated = !!cinematicPhoto;

  const sectionRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const scroller: HTMLElement | Window = scrollElement ?? window;
    let raf = 0;
    const update = () => {
      raf = 0;
      let h: number;
      let top: number;
      if (scrollElement) {
        h = scrollElement.clientHeight || 1;
        top = el.offsetTop - scrollElement.scrollTop;
      } else {
        h = window.innerHeight || 1;
        top = el.getBoundingClientRect().top;
      }
      const p = Math.min(1, Math.max(0, -top / (h * 0.9)));
      el.style.opacity = String(1 - p);
    };
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };
    update();
    scroller.addEventListener("scroll", onScroll, { passive: true } as AddEventListenerOptions);
    return () => {
      scroller.removeEventListener("scroll", onScroll as EventListener);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [scrollElement]);

  return (
    <section ref={sectionRef} data-memolove-scene="hero" className="hero-scene" aria-label="Abertura">
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
          background: rgba(110, 70, 35, 0.045);
          mix-blend-mode: soft-light;
        }
        /* Camada 1b — glow quente superior (bem sutil, quase neutro) */
        .hero-layer-1b {
          background: radial-gradient(
            75% 50% at 50% 6%,
            rgba(255, 190, 120, 0.10) 0%,
            rgba(255, 170, 100, 0.04) 40%,
            rgba(0, 0, 0, 0) 72%
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
          padding: 0 28px 110px;
          text-align: left;
        }
        @media (min-width: 768px) {
          .hero-content { padding: 0 80px 170px; }
        }


        .hero-eyebrow {
          margin: 0 0 2px;
          font-family: "Karla", "Inter", system-ui, sans-serif;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.42em;
          text-transform: uppercase;
          color: #F0C86A;
          text-shadow: 0 1px 2px rgba(0,0,0,0.45);
          padding-left: 0.42em;
          opacity: 0;
          transform: translateY(12px);
          animation: hero-text-in 1200ms cubic-bezier(0.22, 1, 0.36, 1) 900ms forwards;
        }





        .hero-name {
          margin: 0;
          font-family: ${DISPLAY};
          font-weight: 500;
          font-size: clamp(96px, 22vw, 240px);
          line-height: 0.88;
          letter-spacing: -0.015em;
          color: #F6EBD2;
          text-shadow: 0 4px 28px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.35);

          opacity: 0;
          transform: translateY(18px);
          animation: hero-text-in 1400ms cubic-bezier(0.22, 1, 0.36, 1) 1100ms forwards;
        }

        .hero-rule {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 6px 0 18px;
          width: 220px;
          max-width: 55%;
        }
        @media (min-width: 768px) {
          .hero-rule { width: 300px; max-width: 70%; margin: 10px 0 22px; }
        }



        .hero-rule-line {
          position: relative;
          flex: 1;
          height: 2px;
          border-radius: 1px;
          background: linear-gradient(
            90deg,
            rgba(239, 200, 106, 0) 0%,
            rgba(239, 200, 106, 0.95) 22%,
            rgba(247, 213, 128, 1) 50%,
            rgba(239, 200, 106, 0.95) 78%,
            rgba(239, 200, 106, 0) 100%
          );
          box-shadow:
            0 0 5px rgba(239, 200, 106, 0.30),
            0 1px 1px rgba(0, 0, 0, 0.35);
          transform: scaleX(0);
          transform-origin: left center;
          animation: hero-rule-draw 1400ms cubic-bezier(0.65, 0, 0.35, 1) 1500ms forwards;
          overflow: hidden;
        }
        .hero-rule-line::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,240,200,0.75) 50%,
            rgba(255,255,255,0) 100%
          );
          transform: translateX(-120%);
          animation: hero-rule-shimmer 4200ms ease-in-out 3200ms infinite;
        }
        .hero-rule-line.right {
          transform-origin: right center;
        }
        .hero-rule-line.right::after {
          animation-direction: reverse;
          animation-delay: 3400ms;
        }
        .hero-rule-heart {
          color: #EFC86A;
          text-shadow:
            0 1px 2px rgba(0,0,0,0.45),
            0 0 8px rgba(239,200,106,0.55);
          font-size: 14px;
          line-height: 1;
          opacity: 0;
          transform: scale(0.6);
          animation:
            hero-heart-in 900ms cubic-bezier(0.22, 1, 0.36, 1) 2500ms forwards,
            hero-heart-beat 2400ms ease-in-out 3600ms infinite;
        }

        @keyframes hero-rule-draw {
          to { transform: scaleX(1); }
        }
        @keyframes hero-rule-shimmer {
          0%   { transform: translateX(-120%); }
          55%  { transform: translateX(120%); }
          100% { transform: translateX(120%); }
        }
        @keyframes hero-heart-in {
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes hero-heart-beat {
          0%, 100% { transform: scale(1); text-shadow: 0 1px 2px rgba(0,0,0,0.45), 0 0 8px rgba(239,200,106,0.55); }
          25%      { transform: scale(1.22); text-shadow: 0 1px 2px rgba(0,0,0,0.45), 0 0 14px rgba(239,200,106,0.85); }
          40%      { transform: scale(1.05); }
          55%      { transform: scale(1.18); text-shadow: 0 1px 2px rgba(0,0,0,0.45), 0 0 12px rgba(239,200,106,0.75); }
        }

        @keyframes hero-text-in {
          to { opacity: 1; transform: translateY(0); }
        }

        .hero-sub {
          margin: 0;
          max-width: 320px;
          font-family: ${SUB};
          font-weight: 400;
          font-size: 19px;



          line-height: 1.4;
          color: #F5EBD6;
          text-shadow: 0 2px 14px rgba(0,0,0,0.55);

          opacity: 0;
          transform: translateY(12px);
          animation: hero-text-in 1400ms cubic-bezier(0.22, 1, 0.36, 1) 2800ms forwards;
        }
        @media (min-width: 768px) {
          .hero-sub { font-size: 20px; max-width: 380px; }
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
          color: #EFC86A;
          filter:
            drop-shadow(0 1px 2px rgba(0,0,0,0.45))
            drop-shadow(0 0 4px rgba(239,200,106,0.25));

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
          width: 1.5px;
          height: 36px;

          border-radius: 1px;
          background: linear-gradient(180deg, rgba(239,200,106,0) 0%, rgba(239,200,106,1) 100%);
          box-shadow: 0 0 4px rgba(239,200,106,0.30);

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
                1.030  0.012  0.000  0  0.004
                0.008  1.000  0.004  0  0.001
                0.000  0.004  0.965  0  -0.002
                0      0      0      1  0"
            />
            {/* Saturação neutra — cores naturais, sem look Instagram */}
            <feColorMatrix type="saturate" values="0.98" />
            {/* Curva S: pretos profundos, highlights preservados, canais próximos
                 para evitar sépia. */}
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.00 0.07 0.22 0.41 0.60 0.76 0.90 1.00" />
              <feFuncG type="table" tableValues="0.00 0.07 0.21 0.40 0.59 0.75 0.89 1.00" />
              <feFuncB type="table" tableValues="0.00 0.06 0.20 0.38 0.57 0.73 0.87 0.99" />
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
        <svg width="10" height="7" viewBox="0 0 14 10" fill="none">
          <path d="M1 1l6 7 6-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
