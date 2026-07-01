import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export const Route = createFileRoute("/sucesso")({
  head: () => ({
    meta: [
      { title: "Sua homenagem está pronta — MemoLove" },
      { name: "description", content: "Compartilhe o QR Code da sua homenagem MemoLove." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    slug: (search.slug as string) || "demo123",
  }),
  component: SucessoPage,
});

const STEPS = [
  { icon: "📸", label: "Fotos processadas" },
  { icon: "🎵", label: "Música preparada" },
  { icon: "✨", label: "Página criada" },
  { icon: "✓", label: "QR Code gerado" },
];

function SucessoPage() {
  const { slug } = useSearch({ from: "/sucesso" });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(0);

  const homenagemUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/memories?slug=${slug}`
      : `/memories?slug=${slug}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, homenagemUrl, {
      width: 440,
      margin: 1,
      color: { dark: "#1a1917", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    });
  }, [homenagemUrl]);

  useEffect(() => {
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setVisibleSteps((n) => Math.max(n, i + 1)), 400 + i * 350),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleDownload = async () => {
    const dataUrl = await QRCode.toDataURL(homenagemUrl, {
      width: 1200,
      margin: 4,
      color: { dark: "#1a1917", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `memolove-${slug}.png`;
    a.click();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(homenagemUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardStyle: React.CSSProperties = {
    background: "#FFFFFF",
    borderRadius: 28,
    boxShadow: "0 20px 50px rgba(60,45,30,0.08), 0 2px 6px rgba(60,45,30,0.04)",
    border: "1px solid rgba(232,222,206,0.6)",
  };

  const secondaryBtn: React.CSSProperties = {
    width: "100%",
    background: "#FFFFFF",
    color: "#2C2A27",
    padding: "16px 22px",
    fontSize: 15,
    fontWeight: 600,
    border: "1px solid #E8DECE",
    borderRadius: 999,
    transition: "all .2s ease",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FBF8F4",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        padding: "56px 20px 80px",
      }}
    >
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        {/* HERO */}
        <div style={{ textAlign: "center", animation: "sFade 0.7s ease-out both" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#DCF5E3",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              boxShadow: "0 0 0 8px rgba(220,245,227,0.4)",
              animation: "sPop 0.6s cubic-bezier(.2,.9,.3,1.2) both",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5l4.5 4.5L19 7"
                stroke="#2E7D48"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: "clamp(30px, 4.4vw, 40px)",
              lineHeight: 1.15,
              color: "#2C2A27",
              fontWeight: 600,
              letterSpacing: "-0.015em",
              margin: 0,
            }}
          >
            ❤️ Sua homenagem está pronta!
          </h1>
          <p
            style={{
              color: "#7A736A",
              fontSize: 16.5,
              lineHeight: 1.65,
              marginTop: 14,
              marginBottom: 0,
              maxWidth: 520,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Seu presente foi criado com sucesso. Agora basta compartilhar o QR Code com quem você ama.
          </p>
        </div>

        {/* STEPS */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
            marginTop: 32,
            marginBottom: 48,
          }}
        >
          {STEPS.map((s, i) => (
            <div
              key={s.label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 999,
                background: "#FFFFFF",
                border: "1px solid #EFE7DA",
                fontSize: 13,
                fontWeight: 500,
                color: "#2C2A27",
                opacity: i < visibleSteps ? 1 : 0,
                transform: i < visibleSteps ? "translateY(0)" : "translateY(6px)",
                transition: "all .5s ease",
                boxShadow: "0 1px 2px rgba(60,45,30,0.04)",
              }}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* QR CARD */}
        <div style={{ ...cardStyle, padding: "40px 32px", textAlign: "center" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#A65E44",
              marginBottom: 8,
            }}
          >
            Seu QR Code
          </div>
          <h2
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 24,
              color: "#2C2A27",
              fontWeight: 600,
              margin: "0 0 28px",
            }}
          >
            Escaneie e reviva o momento
          </h2>

          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <div
              style={{
                width: "min(220px, 60vw)",
                aspectRatio: "1 / 1",
                padding: 16,
                background: "#FFFFFF",
                borderRadius: 20,
                border: "1px solid #EFE7DA",
                boxShadow: "0 8px 24px rgba(60,45,30,0.08)",
                animation: "sQr 0.9s cubic-bezier(.2,.8,.2,1) both",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block", borderRadius: 8 }}
              />
            </div>
          </div>

          <p style={{ color: "#7A736A", fontSize: 13.5, marginTop: 20, marginBottom: 0 }}>
            Escaneie este QR Code para abrir sua homenagem.
          </p>
        </div>

        {/* BUTTONS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
          <a
            href={homenagemUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: "100%",
              background: "#1a1917",
              color: "#FBF8F4",
              padding: "18px 24px",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 999,
              textAlign: "center",
              boxShadow: "0 10px 24px rgba(26,25,23,0.28)",
              transition: "transform .2s ease, box-shadow .2s ease",
              position: "relative",
              overflow: "hidden",
              animation: "sBtnPulse 2.4s ease-in-out infinite",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px) scale(1.01)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0) scale(1)")}
          >
            <span style={{ position: "relative", zIndex: 2 }}>❤️ Abrir homenagem</span>
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: 0,
                left: "-40%",
                width: "40%",
                height: "100%",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
                animation: "sBtnShine 3s ease-in-out infinite",
                zIndex: 1,
              }}
            />
          </a>
          <button
            onClick={handleDownload}
            style={secondaryBtn}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F5EFE6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
          >
            ⬇️ Baixar QR Code
          </button>
          <button
            onClick={handleCopy}
            style={secondaryBtn}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F5EFE6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
          >
            {copied ? "✓ Link copiado" : "🔗 Copiar link"}
          </button>
        </div>

        {/* EMOTIONAL */}
        <div style={{ ...cardStyle, padding: "36px 32px", marginTop: 40 }}>
          <h3
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 22,
              color: "#2C2A27",
              fontWeight: 600,
              margin: "0 0 12px",
            }}
          >
            ❤️ O momento mais especial ainda está por vir
          </h3>
          <p style={{ color: "#7A736A", fontSize: 15, lineHeight: 1.65, margin: "0 0 20px" }}>
            Quando seu pai escanear este QR Code ele verá:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { i: "📸", t: "As fotos escolhidas por você" },
              { i: "💌", t: "Sua declaração" },
              { i: "🎵", t: "A música especial" },
            ].map((item) => (
              <div
                key={item.t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  background: "#FBF8F4",
                  borderRadius: 14,
                  border: "1px solid #EFE7DA",
                }}
              >
                <span style={{ fontSize: 20 }}>{item.i}</span>
                <span style={{ color: "#2C2A27", fontSize: 15, fontWeight: 500 }}>{item.t}</span>
              </div>
            ))}
          </div>
          <p
            style={{
              color: "#7A736A",
              fontSize: 14,
              fontStyle: "italic",
              marginTop: 20,
              marginBottom: 0,
              textAlign: "center",
            }}
          >
            Tudo em uma única experiência emocionante.
          </p>
        </div>

        {/* TIP */}
        <div
          style={{
            ...cardStyle,
            padding: "28px 32px",
            marginTop: 24,
            background:
              "linear-gradient(135deg, #FFFFFF 0%, #FDF7EE 100%)",
          }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div
              style={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: 12,
                background: "#F3DDD2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              💡
            </div>
            <div>
              <h4
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 18,
                  color: "#2C2A27",
                  fontWeight: 600,
                  margin: "0 0 6px",
                }}
              >
                Dica especial
              </h4>
              <p style={{ color: "#7A736A", fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
                Imprima este QR Code e coloque dentro de um presente, porta-retrato ou cartão.
                Quando ele escanear, verá sua homenagem imediatamente.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            ...cardStyle,
            padding: "36px 32px",
            marginTop: 24,
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 22,
              color: "#2C2A27",
              fontWeight: 600,
              margin: "0 0 10px",
            }}
          >
            Gostou da experiência?
          </h3>
          <p style={{ color: "#7A736A", fontSize: 15, lineHeight: 1.6, margin: "0 0 22px" }}>
            Compartilhe a MemoLove com alguém especial.
          </p>
          <a
            href="/criar"
            style={{
              display: "inline-block",
              background: "#C97B5E",
              color: "#FFFFFF",
              padding: "14px 28px",
              fontSize: 14.5,
              fontWeight: 600,
              borderRadius: 999,
              boxShadow: "0 8px 20px rgba(201,123,94,0.28)",
              transition: "transform .2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            Criar outra homenagem
          </a>
        </div>
      </div>

      <style>{`
        @keyframes sFade { from { opacity: 0; transform: translateY(12px);} to { opacity: 1; transform: translateY(0);} }
        @keyframes sPop { 0% { opacity: 0; transform: scale(0.5);} 100% { opacity: 1; transform: scale(1);} }
        @keyframes sQr { from { opacity: 0; transform: scale(0.94);} to { opacity: 1; transform: scale(1);} }
        @keyframes sBtnPulse {
          0%, 100% { box-shadow: 0 10px 24px rgba(26,25,23,0.28), 0 0 0 0 rgba(201,123,94,0.35); }
          50% { box-shadow: 0 14px 30px rgba(26,25,23,0.32), 0 0 0 10px rgba(201,123,94,0); }
        }
        @keyframes sBtnShine {
          0% { left: -40%; }
          60%, 100% { left: 120%; }
        }
      `}</style>
    </div>
  );
}
