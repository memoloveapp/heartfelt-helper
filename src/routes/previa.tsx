import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/previa")({
  head: () => ({
    meta: [
      { title: "Prévia da sua homenagem — MemoLove" },
      { name: "description", content: "Prévia da sua homenagem MemoLove." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: PreviaPage,
  ssr: false,
});

type Photo = { name?: string; url: string };
type Track = { title?: string; artist?: string; cover?: string } | null;
type Saved = {
  fatherName?: string;
  fromName?: string;
  photos?: Photo[];
  track?: Track;
  message?: string;
};

const SERIF = { fontFamily: '"Fraunces", Georgia, serif' };
const SANS = { fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' };

function PreviaPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [data, setData] = useState<Saved>({});
  const [index, setIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("memolove:homenagem") : null;
      if (!raw) return setStatus("missing");
      setData((JSON.parse(raw) as Saved) || {});
      setStatus("ready");
    } catch {
      setStatus("missing");
    }
  }, []);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-[#FBF8F4] text-[#2a221c]" style={SANS}>Carregando…</div>;
  }
  if (status === "missing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF8F4] text-[#2a221c] p-6 text-center" style={SANS}>
        <div>
          <h1 className="text-xl mb-4" style={SERIF}>Não encontramos os dados da sua homenagem.</h1>
          <Link to="/criar" className="inline-block px-6 py-3 rounded-xl bg-[#C97B5E] text-white font-semibold">Criar homenagem</Link>
        </div>
      </div>
    );
  }

  const photos: Photo[] = Array.isArray(data.photos) ? data.photos.filter((p) => p && p.url) : [];
  const fatherName = (data.fatherName || "").trim() || "Seu pai";
  const fromName = (data.fromName || "").trim();
  const message = (data.message || "").trim();
  const track = data.track || null;

  const photo = (i: number) => photos[i] || photos[i % Math.max(photos.length, 1)] || null;
  const preview = message ? message.slice(0, 90) + (message.length > 90 ? "..." : "...") : "Uma mensagem escrita com muito carinho para você...";

  const screens = [0, 1, 2, 3, 4, 5];
  const total = screens.length;

  const next = () => {
    if (index < total - 1) {
      setIndex(index + 1);
      setAnimKey((k) => k + 1);
    }
  };
  const prev = () => {
    if (index > 0) {
      setIndex(index - 1);
      setAnimKey((k) => k + 1);
    }
  };

  // Tap zones: left third = prev, rest = next
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-stop-tap]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) prev();
    else next();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      className="fixed inset-0 bg-black text-white overflow-hidden select-none cursor-pointer"
      style={SANS}
      onClick={handleTap}
    >
      {/* Progress bars (Stories style) */}
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 px-3 pt-3">
        {screens.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: i < index ? "100%" : i === index ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* Top brand + close */}
      <div className="absolute top-6 left-0 right-0 z-30 flex items-center justify-between px-4 pt-2" data-stop-tap>
        <span className="text-white/80 text-sm tracking-[0.2em]" style={SERIF}>MEMOLOVE</span>
        <Link to="/" className="text-white/70 hover:text-white text-xl leading-none" aria-label="Sair">×</Link>
      </div>

      {/* Screen container — key forces fade-in on change */}
      <div key={animKey} className="absolute inset-0 animate-[fadeIn_300ms_ease]">
        {index === 0 && <Screen1 photoUrl={photo(0)?.url} fatherName={fatherName} />}
        {index === 1 && <ScreenPhotoQuote photoUrl={photo(1)?.url} quote="Algumas lembranças merecem viver para sempre." />}
        {index === 2 && <ScreenPhotoQuote photoUrl={photo(2)?.url} quote="Obrigado por todos os momentos." />}
        {index === 3 && <ScreenLetter preview={preview} fromName={fromName} />}
        {index === 4 && <ScreenMusic track={track} />}
        {index === 5 && <ScreenFinal onUnlock={() => setShowModal(true)} />}
      </div>

      {/* Hint on first screen */}
      {index === 0 && (
        <div className="absolute bottom-8 left-0 right-0 z-20 text-center text-white/70 text-sm animate-[fadeIn_900ms_ease_300ms_both]">
          Toque para começar
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <UnlockModal onClose={() => setShowModal(false)} />
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes kenburns { from { transform: scale(1.05); } to { transform: scale(1.18); } }
      `}</style>
    </div>
  );
}

function PhotoLayer({ url, blur = 3, overlay = "rgba(0,0,0,0.35)" }: { url?: string; blur?: number; overlay?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {url ? (
        <img
          src={url}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: `blur(${blur}px)`, animation: "kenburns 18s ease-in-out infinite alternate", transformOrigin: "center center" }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#3a2a22] to-[#1a1410]" />
      )}
      <div className="absolute inset-0" style={{ background: overlay }} />
    </div>
  );
}

function Screen1({ photoUrl, fatherName }: { photoUrl?: string; fatherName: string }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center px-6">
      <PhotoLayer url={photoUrl} blur={4} overlay="rgba(0,0,0,0.38)" />
      <div className="relative z-10 text-center max-w-md" style={{ animation: "rise 900ms cubic-bezier(.22,.61,.36,1) both" }}>
        <div className="text-4xl mb-5">❤️</div>
        <h1 className="text-white text-4xl sm:text-5xl mb-3 leading-tight" style={SERIF}>Feliz Dia dos Pais</h1>
        <div className="text-3xl sm:text-4xl italic text-white/95" style={SERIF}>{fatherName}</div>
      </div>
    </div>
  );
}

function ScreenPhotoQuote({ photoUrl, quote }: { photoUrl?: string; quote: string }) {
  return (
    <div className="relative w-full h-full flex items-end justify-center">
      <PhotoLayer url={photoUrl} blur={3} overlay="linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.75) 100%)" />
      <div className="relative z-10 px-8 pb-24 text-center max-w-lg" style={{ animation: "rise 900ms cubic-bezier(.22,.61,.36,1) both" }}>
        <p className="text-white text-2xl sm:text-3xl italic leading-snug" style={SERIF}>“{quote}”</p>
      </div>
    </div>
  );
}

function ScreenLetter({ preview, fromName }: { preview: string; fromName: string }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#FBF8F4] px-6">
      <div
        className="relative max-w-md w-full text-center text-[#2a221c]"
        style={{ animation: "rise 900ms cubic-bezier(.22,.61,.36,1) both" }}
      >
        <div className="text-xs tracking-[0.22em] uppercase text-[#C97B5E] mb-5">Uma mensagem do coração</div>
        <p className="text-xl sm:text-2xl leading-relaxed mb-6" style={SERIF}>{preview}</p>
        <div className="flex flex-col gap-2 my-6">
          <span className="h-2 rounded-full bg-[#C97B5E]/15" />
          <span className="h-2 rounded-full bg-[#C97B5E]/15 w-[88%] mx-auto" />
          <span className="h-2 rounded-full bg-[#C97B5E]/15 w-[70%] mx-auto" />
        </div>
        <p className="text-sm text-[#7a6e64] mb-6">🔒 Continue lendo após o desbloqueio.</p>
        {fromName && (
          <div className="border-t border-black/10 pt-4">
            <div className="text-sm text-[#5a4f47]">Com carinho,</div>
            <div className="text-xl italic mt-1" style={SERIF}>{fromName}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScreenMusic({ track }: { track: Track }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-[#1a1410] to-[#2a1f17] px-6">
      <div className="relative text-center max-w-sm w-full" style={{ animation: "rise 900ms cubic-bezier(.22,.61,.36,1) both" }}>
        <div className="text-5xl mb-6">🎵</div>
        <div className="text-2xl text-white mb-1" style={SERIF}>{track?.title || "Trilha selecionada"}</div>
        <div className="text-white/60 text-sm mb-8">{track?.artist || ""}</div>

        <div className="mx-auto w-20 h-20 rounded-full bg-white/10 backdrop-blur flex items-center justify-center mb-6 border border-white/15">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-8 h-8 text-white/60" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
          </svg>
        </div>

        <div className="h-1 rounded-full bg-white/15 overflow-hidden mb-3">
          <div className="h-full w-1/4 bg-white/40" />
        </div>
        <p className="text-white/60 text-sm">Trilha sonora disponível após desbloqueio.</p>
      </div>
    </div>
  );
}

function ScreenFinal({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-white text-[#2a221c] px-6 overflow-y-auto">
      <div className="relative max-w-sm w-full text-center py-16" style={{ animation: "rise 900ms cubic-bezier(.22,.61,.36,1) both" }} data-stop-tap>
        <div className="text-4xl mb-4">❤️</div>
        <h2 className="text-2xl sm:text-3xl mb-4" style={SERIF}>Sua homenagem está pronta.</h2>
        <p className="text-[#5a4f47] mb-8 leading-relaxed">
          Ela já foi criada. Agora falta apenas um passo para revelar a versão completa.
        </p>

        <ul className="text-left grid gap-2 mb-8 text-[15px]">
          <li className="bg-[#F5EFE6] rounded-xl px-4 py-2.5">✔ Fotos em alta qualidade</li>
          <li className="bg-[#F5EFE6] rounded-xl px-4 py-2.5">✔ Mensagem completa</li>
          <li className="bg-[#F5EFE6] rounded-xl px-4 py-2.5">✔ Música liberada</li>
          <li className="bg-[#F5EFE6] rounded-xl px-4 py-2.5">✔ QR Code exclusivo</li>
          <li className="bg-[#F5EFE6] rounded-xl px-4 py-2.5">✔ Link para compartilhar</li>
        </ul>

        <div className="rounded-2xl border border-[#C97B5E]/20 bg-gradient-to-b from-white to-[#F5EFE6] p-5 mb-6">
          <div className="text-sm text-[#b9b3ad]">De <s>R$ 27,90</s></div>
          <div className="text-[11px] tracking-[0.16em] uppercase text-[#7a6e64] mt-1">Hoje por apenas</div>
          <div className="text-5xl font-semibold text-[#C97B5E] my-1" style={SERIF}>R$ 13,90</div>
          <span className="inline-block mt-2 px-3 py-1 rounded-full bg-[#C97B5E] text-white text-[11px] tracking-[0.12em] uppercase font-semibold">Oferta Especial</span>
        </div>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onUnlock(); }}
          className="w-full py-4 rounded-2xl text-white font-bold tracking-wide shadow-[0_16px_40px_-16px_rgba(201,123,94,0.55)] hover:-translate-y-0.5 transition-transform"
          style={{ background: "linear-gradient(135deg, #C97B5E, #a85f44)" }}
        >
          ❤️ REVELAR MINHA HOMENAGEM
        </button>

        <div className="flex justify-center gap-4 mt-4 text-xs text-[#7a6e64]">
          <span>🔒 Pagamento seguro</span>
          <span>⚡ Liberação imediata</span>
        </div>
      </div>
    </div>
  );
}

function UnlockModal({ onClose }: { onClose: () => void }) {
  const [notice, setNotice] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5" onClick={(e) => e.stopPropagation()}>
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="relative w-full max-w-[420px] bg-[#FBF8F4] text-[#2a221c] rounded-3xl p-7 text-center shadow-2xl" style={{ animation: "rise 320ms cubic-bezier(.22,.61,.36,1) both" }}>
        <h2 className="text-xl mb-2" style={SERIF}>🔒 Sua homenagem já está pronta.</h2>
        <p className="text-[#5a4f47] text-sm mb-4 leading-relaxed">
          Ela já foi criada e está pronta para ser acessada.<br />
          Falta apenas confirmar o pagamento para liberar a versão completa.
        </p>
        <ul className="text-left grid gap-1.5 mb-5 text-sm">
          <li>✔ Fotos em alta qualidade</li>
          <li>✔ Mensagem completa</li>
          <li>✔ Trilha sonora</li>
          <li>✔ QR Code exclusivo</li>
          <li>✔ Link para compartilhar</li>
        </ul>
        <div className="mb-5">
          <div className="text-sm text-[#b9b3ad]">De <s>R$ 27,90</s></div>
          <div className="text-xs text-[#7a6e64]">Hoje por apenas</div>
          <div className="text-3xl font-semibold text-[#C97B5E]" style={SERIF}>R$ 13,90</div>
        </div>
        {notice ? (
          <p className="bg-[#F5EFE6] rounded-xl p-3.5 text-[#5a4f47] text-sm">Checkout será conectado na próxima etapa.</p>
        ) : (
          <button
            type="button"
            onClick={() => setNotice(true)}
            className="w-full py-3.5 rounded-2xl text-white font-bold tracking-wide"
            style={{ background: "linear-gradient(135deg, #C97B5E, #a85f44)" }}
          >
            CONTINUAR PARA O PAGAMENTO
          </button>
        )}
        <button type="button" onClick={onClose} className="mt-3 w-full py-2 text-[#7a6e64] text-sm">Voltar</button>
      </div>
    </div>
  );
}
