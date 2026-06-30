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
    "Pai, obrigado por cada conselho, cada abraço e cada exemplo. Você é meu maior herói...";
  const songTitle = tribute.song?.title || "Trilha especial";
  const songArtist = tribute.song?.artist || "Selecionada por você";

  const next = () => setCurrent((c) => Math.min(c + 1, total - 1));

  const bgPhoto = (idx: number) =>
    photos[idx % photos.length] || "";

  const sceneBg = (idx: number) => {
    const photo = bgPhoto(idx);
    return photo
      ? { backgroundImage: `url(${photo})` }
      : {
          backgroundImage:
            "linear-gradient(135deg, #2a1810 0%, #6b3a23 50%, #c97b5e 100%)",
        };
  };

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
      {/* Progress bars */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          gap: 4,
          padding: "12px 14px",
          zIndex: 20,
        }}
      >
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 999,
              background: "rgba(255,255,255,0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: i < current ? "100%" : i === current ? "100%" : "0%",
                background: "#fff",
                transition: "width 400ms ease",
              }}
            />
          </div>
        ))}
      </div>

      {/* Slides */}
      {current === 0 && (
        <Scene bg={sceneBg(0)} dark>
          <div style={{ fontSize: 52, marginBottom: 18 }}>❤️</div>
          <h1 style={titleStyle}>Feliz Dia dos Pais</h1>
          <p style={{ ...italicStyle, marginTop: 8 }}>{fatherName}</p>
          <p style={hintStyle}>Toque para começar</p>
        </Scene>
      )}

      {current === 1 && (
        <Scene bg={sceneBg(1)} dark>
          <p style={quoteStyle}>
            Algumas lembranças merecem viver para sempre.
          </p>
        </Scene>
      )}

      {current === 2 && (
        <Scene bg={sceneBg(2)} dark>
          <p style={quoteStyle}>Obrigado por todos os momentos.</p>
        </Scene>
      )}

      {current === 3 && (
        <Scene warm>
          <span style={kickerStyle}>Para você, com amor</span>
          <h2 style={{ ...titleStyle, color: "#2a221c" }}>
            Uma mensagem do coração
          </h2>
          <p
            style={{
              ...bodyStyle,
              color: "#5a4f47",
              maxWidth: 460,
              marginTop: 18,
            }}
          >
            {message.slice(0, 120)}
            {message.length > 120 ? "…" : ""}
          </p>
          <p style={{ ...lockStyle, color: "#7a6e64" }}>
            🔒 Continue lendo após o desbloqueio.
          </p>
        </Scene>
      )}

      {current === 4 && (
        <Scene warm>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🎵</div>
          <span style={kickerStyle}>Trilha sonora escolhida</span>
          <h3
            style={{
              fontFamily: '"Fraunces", serif',
              fontSize: 28,
              margin: "12px 0 4px",
              color: "#2a221c",
            }}
          >
            {songTitle}
          </h3>
          <p style={{ color: "#7a6e64", margin: 0 }}>{songArtist}</p>
          <div
            style={{
              marginTop: 28,
              padding: "14px 22px",
              borderRadius: 999,
              background: "rgba(201,123,94,0.12)",
              color: "#a85f44",
              fontSize: 14,
            }}
          >
            🔒 Disponível após desbloqueio
          </div>
        </Scene>
      )}

      {current === 5 && (
        <Scene warm>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❤️</div>
          <h2 style={{ ...titleStyle, color: "#2a221c" }}>
            Sua homenagem está pronta.
          </h2>
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <p
              style={{
                color: "#b9b3ad",
                textDecoration: "line-through",
                margin: 0,
                fontSize: 16,
              }}
            >
              De R$ 27,90
            </p>
            <p
              style={{
                fontFamily: '"Fraunces", serif',
                fontSize: 48,
                fontWeight: 600,
                color: "#C97B5E",
                margin: "6px 0 4px",
              }}
            >
              R$ 13,90
            </p>
            <p style={{ color: "#7a6e64", margin: 0, fontSize: 14 }}>
              Hoje, por apenas
            </p>
          </div>
          <Link
            to="/memories"
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: 32,
              padding: "18px 28px",
              borderRadius: 16,
              background: "linear-gradient(135deg, #C97B5E, #a85f44)",
              color: "#fff",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textDecoration: "none",
              boxShadow: "0 16px 40px -16px rgba(201,123,94,0.6)",
              display: "inline-block",
            }}
          >
            ❤️ REVELAR MINHA HOMENAGEM
          </Link>
        </Scene>
      )}
    </div>
  );
}

function Scene({
  children,
  bg,
  dark,
  warm,
}: {
  children: React.ReactNode;
  bg?: React.CSSProperties;
  dark?: boolean;
  warm?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 28px",
        textAlign: "center",
        backgroundSize: "cover",
        backgroundPosition: "center",
        background: warm ? "#FBF8F4" : "#0a0604",
        animation: "previaFade 600ms ease both",
        ...bg,
      }}
    >
      {dark && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 100%)",
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 520 }}>
        {children}
      </div>
      <style>{`@keyframes previaFade { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: none;} }`}</style>
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontFamily: '"Fraunces", serif',
  fontWeight: 500,
  fontSize: "clamp(2rem, 6vw, 3rem)",
  lineHeight: 1.1,
  margin: 0,
};

const italicStyle: React.CSSProperties = {
  fontFamily: '"Fraunces", serif',
  fontStyle: "italic",
  fontSize: "clamp(1.4rem, 4vw, 2rem)",
  color: "#f5cdb8",
  margin: 0,
};

const quoteStyle: React.CSSProperties = {
  fontFamily: '"Fraunces", serif',
  fontStyle: "italic",
  fontSize: "clamp(1.6rem, 4.5vw, 2.4rem)",
  lineHeight: 1.4,
  margin: 0,
};

const bodyStyle: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.6,
  margin: 0,
};

const kickerStyle: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "#C97B5E",
  marginBottom: 14,
  display: "block",
};

const hintStyle: React.CSSProperties = {
  marginTop: 36,
  fontSize: 13,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.7)",
  animation: "previaBlink 2s ease-in-out infinite",
};

const lockStyle: React.CSSProperties = {
  marginTop: 24,
  fontSize: 14,
};
