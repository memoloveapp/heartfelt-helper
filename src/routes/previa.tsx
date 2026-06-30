import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/previa")({
  component: PreviaPage,
  head: () => ({
    meta: [{ title: "Prévia da sua homenagem · MemoLove" }],
  }),
});

type Tribute = {
  fatherName?: string;
  message?: string;
  photos?: string[];
  song?: { title?: string; artist?: string };
};

function PreviaPage() {
  const [current, setCurrent] = useState(0);
  const [tribute, setTribute] = useState<Tribute>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("memolove_tribute");
      if (raw) setTribute(JSON.parse(raw) || {});
    } catch {
      setTribute({});
    }
  }, []);

  const total = 6;
  const photos = tribute.photos && tribute.photos.length > 0 ? tribute.photos : [];
  const fatherName = tribute.fatherName?.trim() || "Pai";
  const message =
    tribute.message?.trim() ||
    "Pai, obrigado por cada conselho, cada abraço e cada exemplo de vida que você me deu...";
  const songTitle = tribute.song?.title || "Trilha especial";
  const songArtist = tribute.song?.artist || "Selecionada por você";

  const next = () => setCurrent((c) => Math.min(c + 1, total - 1));

  const photo = (idx: number) => photos[idx % photos.length] || "";

  return (
    <div
      onClick={next}
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#0a0604",
        color: "#fff",
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <style>{`
        @keyframes mlPrevFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes mlPrevRise {
          from { opacity: 0; transform: translateY(20px) }
          to { opacity: 1; transform: translateY(0) }
        }
        @keyframes mlPrevKen {
          from { transform: scale(1) }
          to { transform: scale(1.06) }
        }
        @keyframes mlPrevCtaIn {
          from { opacity: 0; transform: scale(.95) }
          to { opacity: 1; transform: scale(1) }
        }
        .ml-prev-scene { animation: mlPrevFade 350ms ease both; }
        .ml-prev-rise   { animation: mlPrevRise 500ms 200ms cubic-bezier(.22,.61,.36,1) both; }
        .ml-prev-rise-2 { animation: mlPrevRise 500ms 320ms cubic-bezier(.22,.61,.36,1) both; }
        .ml-prev-rise-3 { animation: mlPrevRise 500ms 440ms cubic-bezier(.22,.61,.36,1) both; }
        .ml-prev-rise-4 { animation: mlPrevRise 500ms 560ms cubic-bezier(.22,.61,.36,1) both; }
        .ml-prev-cta-in { animation: mlPrevCtaIn 350ms 560ms cubic-bezier(.22,.61,.36,1) both; }
        .ml-prev-photo {
          animation: mlPrevKen 18s ease-out forwards;
          filter: brightness(.92) contrast(1.05) saturate(1.03);
          will-change: transform;
        }
        .ml-prev-cta {
          transition: transform .25s ease, box-shadow .3s ease;
          will-change: transform;
        }
        .ml-prev-cta:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 28px 60px -22px rgba(201,123,94,.75);
        }
        @media (prefers-reduced-motion: reduce) {
          .ml-prev-photo, .ml-prev-rise, .ml-prev-rise-2, .ml-prev-rise-3, .ml-prev-rise-4, .ml-prev-cta-in {
            animation: none !important;
          }
        }
      `}</style>

      {/* Progress bars */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          gap: 6,
          padding: "14px 18px",
          zIndex: 30,
        }}
      >
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 2.5,
              borderRadius: 999,
              background: "rgba(255,255,255,0.35)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: i <= current ? "100%" : "0%",
                background: "#fff",
                transition: "width 400ms ease",
                borderRadius: 999,
              }}
            />
          </div>
        ))}
      </div>

      {current === 0 && (
        <PhotoScene photo={photo(0)}>
          <div className="ml-prev-rise" style={{ fontSize: 44, marginBottom: 28, letterSpacing: ".02em" }}>❤️</div>
          <h1 className="ml-prev-rise" style={heroTitle}>Feliz Dia dos Pais</h1>
          <p className="ml-prev-rise-2" style={heroName}>{fatherName}</p>
          <p className="ml-prev-rise-3" style={hint}>Toque para começar</p>
        </PhotoScene>
      )}

      {current === 1 && (
        <PhotoScene photo={photo(1)}>
          <p className="ml-prev-rise" style={quote}>
            Algumas lembranças<br/>merecem viver para sempre.
          </p>
        </PhotoScene>
      )}

      {current === 2 && (
        <PhotoScene photo={photo(2)}>
          <p className="ml-prev-rise" style={quote}>
            Obrigado por todos<br/>os momentos.
          </p>
        </PhotoScene>
      )}

      {current === 3 && (
        <WarmScene>
          <span className="ml-prev-rise" style={kicker}>Para você, com amor</span>
          <h2 className="ml-prev-rise" style={{ ...heroTitle, color: "#2a221c", marginTop: 18 }}>
            Uma mensagem<br/>do coração
          </h2>
          <p className="ml-prev-rise-2" style={{ ...body, color: "#5a4f47", marginTop: 36 }}>
            {message.slice(0, 130)}{message.length > 130 ? "…" : ""}
          </p>
          <p className="ml-prev-rise-3" style={{ ...lock, color: "#7a6e64", marginTop: 36 }}>
            🔒 &nbsp;Continue lendo após o desbloqueio
          </p>
        </WarmScene>
      )}

      {current === 4 && (
        <WarmScene>
          <div className="ml-prev-rise" style={{ fontSize: 38, marginBottom: 22 }}>🎵</div>
          <span className="ml-prev-rise" style={kicker}>Trilha sonora escolhida</span>
          <h3 className="ml-prev-rise-2" style={{
            fontFamily: '"Fraunces", serif',
            fontWeight: 500,
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            letterSpacing: "-0.01em",
            color: "#2a221c",
            margin: "18px 0 10px",
            lineHeight: 1.2,
          }}>
            {songTitle}
          </h3>
          <p className="ml-prev-rise-2" style={{ color: "#7a6e64", margin: 0, fontSize: 15, letterSpacing: ".02em" }}>
            {songArtist}
          </p>
          <div className="ml-prev-rise-3" style={{
            marginTop: 44,
            padding: "14px 24px",
            borderRadius: 999,
            background: "rgba(201,123,94,0.10)",
            color: "#a85f44",
            fontSize: 13,
            letterSpacing: ".06em",
          }}>
            🔒 &nbsp;Disponível após desbloqueio
          </div>
        </WarmScene>
      )}

      {current === 5 && (
        <WarmScene>
          <div className="ml-prev-rise" style={{ fontSize: 40, marginBottom: 20 }}>❤️</div>
          <h2 className="ml-prev-rise" style={{
            ...heroTitle,
            color: "#2a221c",
            fontSize: "clamp(1.8rem, 4.5vw, 2.4rem)",
          }}>
            Sua homenagem<br/>está pronta.
          </h2>

          <div className="ml-prev-rise-2" style={{ marginTop: 48, textAlign: "center" }}>
            <p style={{
              color: "#b9b3ad",
              textDecoration: "line-through",
              margin: 0,
              fontSize: 16,
              letterSpacing: ".02em",
            }}>
              De R$ 27,90
            </p>
            <p style={{
              color: "#7a6e64",
              margin: "10px 0 4px",
              fontSize: 13,
              letterSpacing: ".18em",
              textTransform: "uppercase",
            }}>
              Hoje por apenas
            </p>
            <p style={{
              fontFamily: '"Fraunces", serif',
              fontSize: "clamp(4rem, 14vw, 6rem)",
              fontWeight: 600,
              color: "#C97B5E",
              margin: "6px 0 0",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}>
              R$ 13,90
            </p>
          </div>

          <Link
            to="/memories"
            onClick={(e) => e.stopPropagation()}
            className="ml-prev-cta ml-prev-rise-3"
            style={{
              marginTop: 48,
              padding: "22px 38px",
              borderRadius: 18,
              background: "linear-gradient(135deg, #D88A6D 0%, #C97B5E 50%, #a85f44 100%)",
              color: "#fff",
              fontWeight: 700,
              letterSpacing: ".06em",
              fontSize: 15,
              textDecoration: "none",
              boxShadow: "0 20px 50px -18px rgba(201,123,94,.65), inset 0 1px 0 rgba(255,255,255,.18)",
              display: "inline-block",
            }}
          >
            ❤️ &nbsp;REVELAR MINHA HOMENAGEM
          </Link>
        </WarmScene>
      )}
    </div>
  );
}

function PhotoScene({ photo, children }: { photo: string; children: React.ReactNode }) {
  return (
    <div className="ml-prev-scene" style={{ position: "absolute", inset: 0 }}>
      <div
        className="ml-prev-photo"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: photo
            ? `url(${photo})`
            : "linear-gradient(135deg, #2a1810 0%, #6b3a23 50%, #c97b5e 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          transformOrigin: "center",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.45))",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 32px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 560 }}>{children}</div>
      </div>
    </div>
  );
}

function WarmScene({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="ml-prev-scene"
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg, #FBF8F4 0%, #F5EFE6 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "90px 36px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 520, width: "100%" }}>{children}</div>
    </div>
  );
}

const heroTitle: React.CSSProperties = {
  fontFamily: '"Fraunces", serif',
  fontWeight: 500,
  fontSize: "clamp(2.4rem, 7vw, 3.6rem)",
  lineHeight: 1.15,
  letterSpacing: "-0.02em",
  margin: 0,
};

const heroName: React.CSSProperties = {
  fontFamily: '"Fraunces", serif',
  fontStyle: "italic",
  fontWeight: 400,
  fontSize: "clamp(1.4rem, 4vw, 1.9rem)",
  color: "#f5cdb8",
  margin: "20px 0 0",
  letterSpacing: ".01em",
};

const quote: React.CSSProperties = {
  fontFamily: '"Fraunces", serif',
  fontStyle: "italic",
  fontWeight: 400,
  fontSize: "clamp(1.6rem, 4.8vw, 2.4rem)",
  lineHeight: 1.5,
  letterSpacing: "-0.005em",
  margin: 0,
};

const body: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.8,
  margin: 0,
  letterSpacing: ".005em",
};

const kicker: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: ".28em",
  textTransform: "uppercase",
  color: "#C97B5E",
  display: "block",
  fontWeight: 600,
};

const hint: React.CSSProperties = {
  marginTop: 56,
  fontSize: 11,
  letterSpacing: ".28em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.75)",
};

const lock: React.CSSProperties = {
  fontSize: 13,
  letterSpacing: ".04em",
};
