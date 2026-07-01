import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
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

const LOADING_STEPS = [
  "Organizando suas fotos",
  "Preparando sua música",
  "Gerando QR Code",
];

const DELIVERY = [
  { icon: "🖼", title: "Porta-retrato", desc: "Coloque o QR Code atrás da foto." },
  { icon: "🎁", title: "Caixa de presente", desc: "Cole o QR Code dentro da tampa." },
  { icon: "💌", title: "Cartão", desc: "Imprima e entregue junto com uma carta." },
  { icon: "📱", title: "WhatsApp", desc: "Envie o QR Code para familiares." },
];

function SucessoPage() {
  const { slug } = useSearch({ from: "/sucesso" });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stepIdx, setStepIdx] = useState(0);
  const [allDone, setAllDone] = useState(false);

  const homenagemUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/memories?slug=${slug}`
      : `/memories?slug=${slug}`;

  // Loading sequence (~2s)
  useEffect(() => {
    const timers: number[] = [];
    LOADING_STEPS.forEach((_, i) => {
      timers.push(window.setTimeout(() => setStepIdx(i + 1), 400 + i * 500));
    });
    timers.push(window.setTimeout(() => setAllDone(true), 400 + LOADING_STEPS.length * 500));
    timers.push(window.setTimeout(() => setLoading(false), 400 + LOADING_STEPS.length * 500 + 700));
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (loading || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, homenagemUrl, {
      width: 440,
      margin: 1,
      color: { dark: "#1a1917", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    });
  }, [homenagemUrl, loading]);

  const handleDownload = () => {
    const c = document.createElement("canvas");
    QRCode.toCanvas(c, homenagemUrl, {
      width: 1200,
      margin: 2,
      color: { dark: "#1a1917", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    }, () => {
      const a = document.createElement("a");
      a.download = `memolove-${slug}.png`;
      a.href = c.toDataURL("image/png");
      a.click();
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(homenagemUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Minha homenagem MemoLove", url: homenagemUrl });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5EFE6", fontFamily: "'Inter', system-ui, sans-serif", color: "#1a1917" }}>
      <style>{styles}</style>

      {loading && (
        <div className="suc-loader">
          <div className="suc-loader-inner">
            <div className="suc-loader-title">❤️ Criando sua homenagem</div>
            <div className="suc-loader-steps">
              {LOADING_STEPS.map((s, i) => (
                <div key={s} className={`suc-loader-step ${i < stepIdx ? "on" : ""}`}>
                  <span className="suc-check">✓</span>
                  <span>{s}</span>
                </div>
              ))}
              {allDone && (
                <div className="suc-loader-step on suc-final">
                  <span className="suc-check">✓</span>
                  <span>Tudo pronto!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <main className="suc-wrap">
          {/* HEADER */}
          <header className="suc-header">
            <div className="suc-badge">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#2E7D57" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="suc-h1">❤️ Sua homenagem está pronta</h1>
            <p className="suc-sub">
              Tudo foi preparado com sucesso.<br />
              Agora basta compartilhar esse momento especial.
            </p>
          </header>

          {/* QR CARD */}
          <section className="suc-card suc-qr-card">
            <h2 className="suc-card-title">Seu QR Code</h2>
            <p className="suc-card-desc">Escaneie este QR Code para abrir sua homenagem imediatamente.</p>

            <div className="suc-qr-frame">
              <div className="suc-qr-box">
                <canvas ref={canvasRef} className="suc-qr-canvas" />
                <div className="suc-qr-logo">
                  <span>❤</span>
                </div>
              </div>
            </div>

            <div className="suc-lock">
              <span className="suc-lock-icon">🔒</span>
              <div>
                <strong>Link privado</strong>
                <p>Apenas quem possuir este QR Code poderá acessar sua homenagem.</p>
              </div>
            </div>

            <div className="suc-actions">
              <a href={homenagemUrl} target="_blank" rel="noopener noreferrer" className="suc-btn suc-btn-primary">
                <span className="suc-btn-shine" />
                <span className="suc-btn-label">❤️ Abrir homenagem</span>
              </a>
              <button onClick={handleDownload} className="suc-btn suc-btn-ghost">⬇️ Baixar QR Code</button>
              <button onClick={handleCopy} className="suc-btn suc-btn-ghost">
                {copied ? "✓ Link copiado" : "🔗 Copiar link"}
              </button>
              <button onClick={handleShare} className="suc-btn suc-btn-ghost">📤 Compartilhar</button>
            </div>
          </section>

          {/* EMOTIONAL */}
          <section className="suc-card suc-emotional">
            <h3 className="suc-emo-title">✨ Imagine esse momento...</h3>
            <div className="suc-emo-icon">💝</div>
            <p className="suc-emo-text">
              Seu pai vai escanear esse QR Code.
              <br /><br />
              Em poucos segundos verá suas fotos, ouvirá a música escolhida e lerá sua mensagem.
              <br /><br />
              <strong>Será uma surpresa inesquecível.</strong>
            </p>
          </section>

          {/* TIP */}
          <section className="suc-card">
            <div className="suc-tip-header">
              <div className="suc-tip-icon">💡</div>
              <h3 className="suc-tip-title">Como entregar esse presente</h3>
            </div>
            <div className="suc-tip-grid">
              {DELIVERY.map((d) => (
                <div key={d.title} className="suc-tip-card">
                  <div className="suc-tip-card-icon">{d.icon}</div>
                  <strong>{d.title}</strong>
                  <p>{d.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* DELIVERY DOWNLOADS */}
          <section className="suc-card">
            <h3 className="suc-deliv-title">Escolha como entregar sua homenagem</h3>
            <p className="suc-deliv-sub">Baixe um modelo pronto para imprimir e presentear com estilo.</p>
            <div className="suc-deliv-grid">
              {[
                { icon: "🖼️", title: "Porta-retrato", desc: "Modelo elegante para colocar atrás da foto.", file: "porta-retrato" },
                { icon: "💌", title: "Cartão", desc: "Cartão dobrável para escrever uma dedicatória.", file: "cartao" },
                { icon: "🎁", title: "Tag para presente", desc: "Etiqueta compacta para amarrar no presente.", file: "tag-presente" },
                { icon: "📄", title: "Folha A4", desc: "Página completa pronta para imprimir em A4.", file: "folha-a4" },
              ].map((d) => (
                <div key={d.file} className="suc-deliv-card">
                  <div className="suc-deliv-icon">{d.icon}</div>
                  <strong>{d.title}</strong>
                  <p>{d.desc}</p>
                  <button
                    className="suc-btn suc-btn-ghost suc-deliv-btn"
                    onClick={() => {
                      // Placeholder: baixa o próprio QR até que o modelo personalizado seja gerado.
                      const c = document.createElement("canvas");
                      QRCode.toCanvas(c, homenagemUrl, { width: 1200, margin: 2, errorCorrectionLevel: "H" }, () => {
                        const a = document.createElement("a");
                        a.download = `memolove-${d.file}-${slug}.png`;
                        a.href = c.toDataURL("image/png");
                        a.click();
                      });
                    }}
                  >
                    ⬇️ Baixar
                  </button>
                </div>
              ))}
            </div>
          </section>



          {/* CTA */}
          <section className="suc-card suc-cta">
            <h3 className="suc-cta-title">Gostou da experiência?</h3>
            <p className="suc-cta-text">
              Crie novas homenagens sempre que quiser surpreender alguém especial.
            </p>
            <Link to="/criar" className="suc-btn suc-btn-primary suc-btn-inline">
              <span className="suc-btn-label">❤️ Criar outra homenagem</span>
            </Link>
          </section>

          <footer className="suc-footer">Feito com carinho pela MemoLove.</footer>
        </main>
      )}
    </div>
  );
}

const styles = `
  @keyframes sucFade { from { opacity: 0; transform: translateY(12px);} to { opacity: 1; transform: none; } }
  @keyframes sucStepIn { from { opacity: 0; transform: translateX(-8px);} to { opacity: 1; transform: none; } }
  @keyframes sucPulse { 0%,100% { box-shadow: 0 12px 32px rgba(26,25,23,0.28);} 50% { box-shadow: 0 18px 44px rgba(26,25,23,0.42);} }
  @keyframes sucShine { 0% { left: -60%; } 60%,100% { left: 120%; } }
  @keyframes sucLoaderFade { to { opacity: 0; visibility: hidden; } }

  .suc-loader {
    position: fixed; inset: 0; background: #F5EFE6; z-index: 100;
    display: flex; align-items: center; justify-content: center;
    animation: sucLoaderFade 0.6s ease 2.4s forwards;
  }
  .suc-loader-inner { text-align: center; max-width: 340px; padding: 24px; }
  .suc-loader-title { font-size: 20px; font-weight: 600; margin-bottom: 28px; color: #1a1917; letter-spacing: -0.01em; }
  .suc-loader-steps { display: flex; flex-direction: column; gap: 14px; align-items: flex-start; }
  .suc-loader-step {
    display: flex; align-items: center; gap: 12px;
    font-size: 15px; color: #a8a29e; opacity: 0;
    transition: color .35s ease, opacity .35s ease;
  }
  .suc-loader-step.on { color: #1a1917; opacity: 1; animation: sucStepIn .4s ease; }
  .suc-check {
    width: 22px; height: 22px; border-radius: 50%;
    background: #E8DFD1; color: transparent;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; transition: all .3s ease;
  }
  .suc-loader-step.on .suc-check { background: #2E7D57; color: white; }
  .suc-final { font-weight: 600; margin-top: 6px; }

  .suc-wrap { max-width: 720px; margin: 0 auto; padding: 56px 20px 80px; animation: sucFade .5s ease; }

  .suc-header { text-align: center; margin-bottom: 40px; }
  .suc-badge {
    width: 72px; height: 72px; border-radius: 50%;
    background: #E4F1E9; display: inline-flex; align-items: center; justify-content: center;
    margin-bottom: 22px; box-shadow: 0 6px 20px rgba(46,125,87,0.15);
  }
  .suc-h1 { font-size: 30px; font-weight: 600; letter-spacing: -0.02em; margin: 0 0 12px; color: #1a1917; }
  .suc-sub { color: #6b6560; font-size: 16px; line-height: 1.55; margin: 0; }

  .suc-card {
    background: #ffffff; border-radius: 32px;
    padding: 44px 36px; margin-bottom: 24px;
    box-shadow: 0 4px 24px rgba(26,25,23,0.04), 0 1px 3px rgba(26,25,23,0.03);
  }
  .suc-card-title { font-size: 22px; font-weight: 600; letter-spacing: -0.015em; text-align: center; margin: 0 0 8px; }
  .suc-card-desc { text-align: center; color: #6b6560; font-size: 15px; margin: 0 0 32px; line-height: 1.5; }

  .suc-qr-frame { display: flex; justify-content: center; margin-bottom: 24px; }
  .suc-qr-box {
    position: relative; padding: 18px; background: white;
    border: 1px solid #EFE9DF; border-radius: 24px;
    box-shadow: 0 10px 30px rgba(26,25,23,0.06);
  }
  .suc-qr-canvas { display: block; width: 220px !important; height: 220px !important; border-radius: 8px; }
  .suc-qr-logo {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    width: 46px; height: 46px; border-radius: 12px; background: white;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12); font-size: 22px; color: #C97B5E;
  }

  .suc-lock {
    display: flex; gap: 12px; align-items: flex-start;
    background: #F9F5EE; border-radius: 16px; padding: 14px 16px;
    margin-bottom: 28px;
  }
  .suc-lock-icon { font-size: 18px; line-height: 1.4; }
  .suc-lock strong { display: block; font-size: 14px; margin-bottom: 2px; color: #1a1917; }
  .suc-lock p { margin: 0; color: #6b6560; font-size: 13px; line-height: 1.45; }

  .suc-actions { display: flex; flex-direction: column; gap: 10px; }
  .suc-btn {
    position: relative; overflow: hidden;
    display: inline-flex; align-items: center; justify-content: center;
    width: 100%; padding: 16px 20px; border-radius: 16px;
    font-size: 15px; font-weight: 600; letter-spacing: -0.005em;
    cursor: pointer; border: none; text-decoration: none;
    transition: transform .2s ease, box-shadow .25s ease, background .2s ease, border-color .2s ease;
  }
  .suc-btn-primary { background: #1a1917; color: white; animation: sucPulse 2.6s ease-in-out infinite; }
  .suc-btn-primary:hover { transform: translateY(-1px) scale(1.005); }
  .suc-btn-shine {
    position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
    animation: sucShine 3.2s ease-in-out infinite; pointer-events: none;
  }
  .suc-btn-label { position: relative; z-index: 1; }
  .suc-btn-ghost { background: white; color: #1a1917; border: 1px solid #E8DFD1; }
  .suc-btn-ghost:hover { background: #FAF6EF; border-color: #D6C9B3; transform: translateY(-1px); }
  .suc-btn-inline { max-width: 320px; margin: 0 auto; }

  .suc-emotional { text-align: center; }
  .suc-emo-title { font-size: 20px; font-weight: 600; margin: 0 0 18px; letter-spacing: -0.01em; }
  .suc-emo-icon { font-size: 56px; margin-bottom: 20px; }
  .suc-emo-text { color: #4a4642; font-size: 15px; line-height: 1.65; margin: 0; max-width: 460px; margin: 0 auto; }
  .suc-emo-text strong { color: #1a1917; font-weight: 600; }

  .suc-tip-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
  .suc-tip-icon {
    width: 48px; height: 48px; border-radius: 14px; background: #FFF4D6;
    display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;
  }
  .suc-tip-title { font-size: 19px; font-weight: 600; margin: 0; letter-spacing: -0.01em; }
  .suc-tip-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .suc-tip-card {
    background: #FAF6EF; border-radius: 18px; padding: 20px 18px;
    transition: transform .2s ease, background .2s ease;
  }
  .suc-tip-card:hover { transform: translateY(-2px); background: #F5EFE6; }
  .suc-tip-card-icon { font-size: 26px; margin-bottom: 10px; }
  .suc-tip-card strong { display: block; font-size: 14px; margin-bottom: 4px; color: #1a1917; }
  .suc-tip-card p { margin: 0; font-size: 13px; color: #6b6560; line-height: 1.45; }

  .suc-cta { text-align: center; }
  .suc-cta-title { font-size: 22px; font-weight: 600; margin: 0 0 10px; letter-spacing: -0.015em; }
  .suc-cta-text { color: #6b6560; font-size: 15px; line-height: 1.55; margin: 0 0 26px; }

  .suc-deliv-title { font-size: 22px; font-weight: 600; text-align: center; margin: 0 0 8px; letter-spacing: -0.015em; }
  .suc-deliv-sub { text-align: center; color: #6b6560; font-size: 15px; margin: 0 0 28px; line-height: 1.5; }
  .suc-deliv-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .suc-deliv-card {
    background: #FAF6EF; border-radius: 20px; padding: 24px 20px;
    display: flex; flex-direction: column; align-items: flex-start;
    transition: transform .2s ease, background .2s ease, box-shadow .25s ease;
  }
  .suc-deliv-card:hover { transform: translateY(-3px); background: #F5EFE6; box-shadow: 0 8px 20px rgba(26,25,23,0.05); }
  .suc-deliv-icon { font-size: 32px; margin-bottom: 12px; }
  .suc-deliv-card strong { font-size: 15px; margin-bottom: 6px; color: #1a1917; }
  .suc-deliv-card p { margin: 0 0 16px; font-size: 13px; color: #6b6560; line-height: 1.5; flex: 1; }
  .suc-deliv-btn { padding: 11px 16px; font-size: 14px; border-radius: 12px; }


  .suc-footer { text-align: center; color: #a8a29e; font-size: 13px; margin-top: 32px; }

  @media (max-width: 520px) {
    .suc-wrap { padding: 36px 16px 60px; }
    .suc-card { padding: 32px 22px; border-radius: 26px; }
    .suc-h1 { font-size: 25px; }
    .suc-qr-canvas { width: 200px !important; height: 200px !important; }
    .suc-tip-grid { grid-template-columns: 1fr; }
  }
`;
