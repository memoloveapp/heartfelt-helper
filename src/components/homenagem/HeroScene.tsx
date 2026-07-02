import { useReducedMotion } from "motion/react";

/* HeroScene — reprodução fiel da referência
   props: { name, photo, ready? } */

const DISPLAY = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const SUB = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

export function HeroScene({ name, photo }: { name: string; photo: string; ready?: boolean }) {
  const reduce = useReducedMotion();
  const displayName = name || "você";

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
          filter: saturate(1.05) contrast(1.06) brightness(0.94);
          will-change: transform;
        }
        .hero-layer { position: absolute; inset: 0; pointer-events: none; }
        /* base warm-dark tint */
        .hero-layer-1 {
          background: linear-gradient(
            180deg,
            rgba(10,7,4,0.28) 0%,
            rgba(10,7,4,0.10) 30%,
            rgba(10,7,4,0.10) 45%,
            rgba(10,7,4,0.55) 62%,
            rgba(10,7,4,0.92) 78%,
            rgba(6,4,3,0.985) 100%
          );
        }
        /* soft vignette */
        .hero-layer-2 {
          background: radial-gradient(
            120% 90% at 50% 30%,
            rgba(0,0,0,0) 45%,
            rgba(0,0,0,0.35) 100%
          );
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
        }

        .hero-name {
          margin: 0;
          font-family: ${DISPLAY};
          font-weight: 500;
          font-style: normal;
          font-size: clamp(140px, 34vw, 240px);
          line-height: 0.88;
          letter-spacing: -0.015em;
          color: #F3ECDD;
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
        }
        .hero-rule-heart {
          color: #C9A15A;
          font-size: 10px;
          line-height: 1;
        }

        .hero-sub {
          margin: 0;
          max-width: 520px;
          font-family: ${SUB};
          font-weight: 400;
          font-size: 26px;
          line-height: 1.35;
          color: #EFE7D6;
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
          opacity: 0.85;
        }
        .hero-scroll-line {
          width: 1px;
          height: 44px;
          background: linear-gradient(180deg, rgba(201,161,90,0) 0%, rgba(201,161,90,0.9) 100%);
        }
      `}</style>

      {photo && (
        <img
          className="hero-photo"
          src={photo}
          alt=""
          aria-hidden
          loading="eager"
          {...({ fetchpriority: "high" } as any)}
        />
      )}

      <div className="hero-layer hero-layer-1" />
      <div className="hero-layer hero-layer-2" />

      <div className="hero-content">
        <p className="hero-eyebrow">PARA O MEU</p>
        <h1 className="hero-name">{displayName}.</h1>

        <div className="hero-rule" aria-hidden>
          <span className="hero-rule-line" />
          <span className="hero-rule-heart">♥</span>
          <span className="hero-rule-line" />
        </div>

        <p className="hero-sub">
          Algumas histórias merecem
          <br />
          ser lembradas para sempre.
        </p>
      </div>

      <div className="hero-scroll" aria-hidden>
        <span className="hero-scroll-line" />
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <path d="M1 1l6 7 6-7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {reduce ? null : null}
    </section>
  );
}
