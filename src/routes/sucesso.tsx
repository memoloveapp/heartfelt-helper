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

function SucessoPage() {
  const { slug } = useSearch({ from: "/sucesso" });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const homenagemUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/memories?slug=${slug}`
      : `/memories?slug=${slug}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, homenagemUrl, {
      width: 640,
      margin: 2,
      color: { dark: "#2C2A27", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    });
  }, [homenagemUrl]);

  const handleDownload = async () => {
    const dataUrl = await QRCode.toDataURL(homenagemUrl, {
      width: 1200,
      margin: 4,
      color: { dark: "#2C2A27", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `memolove-${slug}.png`;
    link.click();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(homenagemUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-5 py-12"
      style={{
        background:
          "radial-gradient(1200px 600px at 20% 0%, #F3DDD2 0%, transparent 60%), radial-gradient(1000px 500px at 80% 100%, #F0E6D0 0%, transparent 60%), #FBF8F4",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div
        className="w-full max-w-[560px] rounded-[28px] p-8 md:p-10 text-center"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(24px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "0 24px 60px rgba(60,45,30,0.12), 0 2px 8px rgba(60,45,30,0.06)",
          animation: "sucFadeUp 0.7s ease-out both",
        }}
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
          style={{
            background: "#F3DDD2",
            color: "#A65E44",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          ❤️ Homenagem criada
        </div>

        <h1
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: "clamp(28px, 4.5vw, 36px)",
            lineHeight: 1.15,
            color: "#2C2A27",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          Sua homenagem está pronta
        </h1>

        <p
          style={{
            color: "#7A736A",
            fontSize: 15.5,
            lineHeight: 1.6,
            marginTop: 12,
            marginBottom: 28,
          }}
        >
          Seu presente foi criado com sucesso.
          <br />
          Agora basta compartilhar o QR Code com quem você ama.
        </p>

        <div
          className="mx-auto mb-7 flex items-center justify-center"
          style={{
            width: 320,
            height: 320,
            padding: 18,
            borderRadius: 24,
            background: "#FFFFFF",
            boxShadow: "0 10px 30px rgba(60,45,30,0.10), inset 0 0 0 1px rgba(0,0,0,0.04)",
            animation: "sucQrIn 0.9s cubic-bezier(.2,.8,.2,1) both",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "100%", borderRadius: 12 }}
          />
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={homenagemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 rounded-full"
            style={{
              background: "#2C2A27",
              color: "#FBF8F4",
              padding: "16px 24px",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.01em",
              boxShadow: "0 8px 20px rgba(44,42,39,0.25)",
              transition: "transform .2s ease, box-shadow .2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            ❤️ Abrir homenagem
          </a>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownload}
              className="rounded-full"
              style={{
                background: "rgba(255,255,255,0.9)",
                color: "#2C2A27",
                padding: "14px 18px",
                fontSize: 14,
                fontWeight: 600,
                border: "1px solid #E8DECE",
                transition: "all .2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F5EFE6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.9)")}
            >
              ⬇️ Baixar QR
            </button>
            <button
              onClick={handleCopy}
              className="rounded-full"
              style={{
                background: "rgba(255,255,255,0.9)",
                color: "#2C2A27",
                padding: "14px 18px",
                fontSize: 14,
                fontWeight: 600,
                border: "1px solid #E8DECE",
                transition: "all .2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F5EFE6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.9)")}
            >
              {copied ? "✓ Copiado" : "🔗 Copiar link"}
            </button>
          </div>
        </div>

        <div
          className="mt-7 text-left rounded-2xl p-5"
          style={{
            background: "rgba(243,221,210,0.45)",
            border: "1px solid rgba(201,123,94,0.22)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#A65E44",
              marginBottom: 6,
            }}
          >
            💡 Dica
          </div>
          <p style={{ color: "#5C5249", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Imprima este QR Code e coloque dentro de um presente, porta-retrato ou cartão.
            Quando ele escanear, verá sua homenagem imediatamente.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes sucFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sucQrIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
