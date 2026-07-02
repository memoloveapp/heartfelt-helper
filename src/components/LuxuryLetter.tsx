/* ============================================================
   LuxuryLetter — carta editorial premium
   Construída do zero. Sem card, sem borda, sem drop cap.
   ============================================================ */

type LuxuryLetterProps = {
  message: string;
  senderName?: string | null;
};

const SERIF = '"Playfair Display", Georgia, serif';
const SANS = '"Inter", system-ui, -apple-system, sans-serif';
const CURSIVE = '"Great Vibes", "Playfair Display", cursive';
const ROSE_GOLD = "#B0806A";

export function LuxuryLetter({ message, senderName }: LuxuryLetterProps) {
  return (
    <section
      className="letter-section"
      style={{
        width: "100%",
        background:
          "linear-gradient(180deg, #F5EADB 0%, #EFE1CE 100%), url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.30 0 0 0 0 0.22 0 0 0 0 0.15 0 0 0 0.07 0'/></filter><rect width='100%' height='100%' filter='url(%23p)'/></svg>\")",
        backgroundBlendMode: "multiply",
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "96px 48px",
          textAlign: "left",
        }}
      >
        {/* etiqueta */}
        <p
          style={{
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: "0.42em",
            fontWeight: 500,
            color: ROSE_GOLD,
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Carta para você
        </p>

        {/* coração */}
        <div
          aria-hidden
          style={{
            marginTop: 14,
            color: ROSE_GOLD,
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          ♥
        </div>

        {/* título */}
        <h2
          style={{
            fontFamily: SERIF,
            fontSize: 48,
            lineHeight: 1.1,
            fontWeight: 400,
            color: "#2C241F",
            letterSpacing: "-0.01em",
            margin: "36px 0 32px",
          }}
        >
          Meu pai,
        </h2>

        {/* texto */}
        <div
          className="whitespace-pre-line"
          style={{
            fontFamily: SANS,
            fontSize: 18,
            lineHeight: 1.9,
            fontWeight: 400,
            color: "#3B322D",
            maxWidth: 620,
          }}
        >
          {message}
        </div>

        {/* assinatura */}
        {senderName && (
          <div
            style={{
              marginTop: 64,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "baseline",
              gap: 10,
            }}
          >
            <span
              style={{
                fontFamily: CURSIVE,
                fontStyle: "italic",
                fontSize: 40,
                color: ROSE_GOLD,
                lineHeight: 1,
              }}
            >
              {senderName}
            </span>
            <span style={{ color: ROSE_GOLD, fontSize: 16 }}>♥</span>
          </div>
        )}
      </div>
    </section>
  );
}

export default LuxuryLetter;
