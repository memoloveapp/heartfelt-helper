/* HeroScene — V3 estático: layout, grading e overlay travados na referência.
   Sem animações, sem parallax (chegam em V4). */

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
        }
        .hero-bloom {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover; object-position: center 28%;
          display: block;
          filter: url(#hero-grade) blur(28px) brightness(1.22) saturate(1.02);
          mix-blend-mode: screen;
          opacity: 0.18;
          pointer-events: none;
        }

        .hero-layer { position: absolute; inset: 0; pointer-events: none; }
        /* Camada 1 — tint global */
        .hero-layer-1 { background: rgba(0,0,0,0.10); }
        /* Camada 2 — degradê vertical */
        .hero-layer-2 {
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,0.04) 0%,
            transparent 28%,
            rgba(0,0,0,0.20) 60%,
            rgba(0,0,0,0.82) 100%
          );
        }
        /* Camada 3 — vinheta radial */
        .hero-layer-3 {
          background: radial-gradient(
            120% 95% at 50% 45%,
            rgba(0,0,0,0) 55%,
            rgba(0,0,0,0.18) 85%,
            rgba(0,0,0,0.32) 100%
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
        }

        .hero-name {
          margin: 0;
          font-family: ${DISPLAY};
          font-weight: 500;
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
            {/* Grading cinematográfico — warm reduzido 45% em relação à versão anterior.
                 Deslocamento de canal mínimo → brancos continuam brancos,
                 verdes vivos ainda caem para oliva, pele permanece natural. */}
            <feColorMatrix
              type="matrix"
              values="
                1.022  0.011  0.000  0  0.0044
                0.011  0.978  0.011  0  0.0022
                0.000  0.017  0.956  0  0.0000
                0      0      0      1  0"
            />
            {/* Dessaturação sutil (mesmo valor da versão cinematográfica) */}
            <feColorMatrix type="saturate" values="0.94" />
            {/* Curva S: pretos profundos, highlights preservados.
                 Canais quase idênticos — a leve diferença mantém profundidade sem sépia. */}
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.00 0.09 0.24 0.41 0.58 0.74 0.88 1.00" />
              <feFuncG type="table" tableValues="0.00 0.09 0.23 0.40 0.57 0.73 0.87 1.00" />
              <feFuncB type="table" tableValues="0.00 0.08 0.22 0.39 0.56 0.72 0.86 0.99" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

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
      {photo && (
        <img
          className="hero-bloom"
          src={photo}
          alt=""
          aria-hidden
        />
      )}

      <div  className="hero-layer hero-layer-1" />
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
