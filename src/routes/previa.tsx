import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/previa")({
  head: () => ({
    meta: [
      { title: "Prévia da sua homenagem — MemoLove" },
      { name: "description", content: "Prévia da sua homenagem MemoLove." },
    ],
  }),
  component: PreviaPage,
  ssr: false,
});

type Photo = { name?: string; url: string };
type Track = { title?: string; artist?: string } | null;
type Saved = {
  fatherName?: string;
  fromName?: string;
  photos?: Photo[];
  track?: Track;
  message?: string;
};

const SERIF = { fontFamily: '"Fraunces", Georgia, serif' };
const SANS = { fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' };
const TOTAL = 6;

function safeParse(raw: string | null): Saved {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? (v as Saved) : {};
  } catch {
    return {};
  }
}

function PreviaPage() {
  const [data, setData] = useState<Saved>({});
  const [ready, setReady] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("memolove:homenagem") : null;
      setData(safeParse(raw));
    } catch {
      setData({});
    } finally {
      setReady(true);
    }
  }, []);

  const photos: Photo[] = Array.isArray(data.photos) ? data.photos.filter((p) => p && typeof p.url === "string") : [];
  const fatherName = (data.fatherName || "").trim() || "Seu pai";
  const fromName = (data.fromName || "").trim() || "Sua família";
  const message = (data.message || "").trim() || "Uma mensagem escrita com muito carinho para você.";
  const track = data.track || null;
  const trackTitle = track?.title || "Trilha selecionada";
  const trackArtist = track?.artist || "Artista";

  const photoAt = (i: number) => photos[i % Math.max(photos.length, 1)]?.url;
  const preview = message.slice(0, 90) + (message.length > 90 ? "..." : "");

  const advance = () => {
    if (currentSlide < TOTAL - 1) setCurrentSlide((s) => s + 1);
  };
  const goBack = () => {
    if (currentSlide > 0) setCurrentSlide((s) => s - 1);
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-stop-tap]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.25) goBack();
    else advance();
  };

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white" style={SANS}>
        Carregando…
      </div>
    );
  }

  const PhotoBg = ({ url }: { url?: string }) => (
    <div className="absolute inset-0 overflow-hidden">
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover scale-110" style={{ filter: "blur(3px)" }} />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#3a2820] via-[#2a1f17] to-[#1a1410]" />
      )}
      <div className="absolute inset-0 bg-black/45" />
    </div>
  );

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none cursor-pointer text-white"
      style={SANS}
      onClick={handleTap}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 px-3 pt-3">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div key={i} className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: i <= currentSlide ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* Brand + close */}
      <div className="absolute top-6 left-0 right-0 z-30 flex items-center justify-between px-5 pt-2" data-stop-tap>
        <span className="text-white/80 text-xs tracking-[0.25em]" style={SERIF}>MEMOLOVE</span>
        <Link to="/" className="text-white/70 text-2xl leading-none" aria-label="Sair">×</Link>
      </div>

      {/* Slides */}
      <div key={currentSlide} className="absolute inset-0 animate-[fadeIn_320ms_ease]">
        {currentSlide === 0 && (
          <div className="relative w-full h-full flex items-center justify-center px-6">
            <PhotoBg url={photoAt(0)} />
            <div className="relative z-10 text-center max-w-md">
              <div className="text-4xl mb-5">❤️</div>
              <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={SERIF}>Feliz Dia dos Pais</h1>
              <div className="text-3xl italic text-white/95 mb-8" style={SERIF}>{fatherName}</div>
              <div className="text-white/70 text-sm tracking-wide">Toque para começar</div>
            </div>
          </div>
        )}

        {currentSlide === 1 && (
          <div className="relative w-full h-full flex items-end justify-center">
            <PhotoBg url={photoAt(1)} />
            <div className="relative z-10 px-8 pb-24 text-center max-w-lg">
              <p className="text-2xl sm:text-3xl italic leading-snug" style={SERIF}>
                “Algumas lembranças merecem viver para sempre.”
              </p>
            </div>
          </div>
        )}

        {currentSlide === 2 && (
          <div className="relative w-full h-full flex items-end justify-center">
            <PhotoBg url={photoAt(2)} />
            <div className="relative z-10 px-8 pb-24 text-center max-w-lg">
              <p className="text-2xl sm:text-3xl italic leading-snug" style={SERIF}>
                “Obrigado por todos os momentos.”
              </p>
            </div>
          </div>
        )}

        {currentSlide === 3 && (
          <div className="relative w-full h-full flex items-center justify-center bg-[#FBF8F4] text-[#2a221c] px-6">
            <div className="relative max-w-md w-full text-center">
              <div className="text-xs tracking-[0.22em] uppercase text-[#C97B5E] mb-5">Uma mensagem do coração</div>
              <p className="text-xl sm:text-2xl leading-relaxed mb-6" style={SERIF}>{preview}</p>
              <div className="flex flex-col gap-2 my-6">
                <span className="h-2 rounded-full bg-[#C97B5E]/15" />
                <span className="h-2 rounded-full bg-[#C97B5E]/15 w-[85%] mx-auto" />
                <span className="h-2 rounded-full bg-[#C97B5E]/15 w-[65%] mx-auto" />
              </div>
              <p className="text-sm text-[#7a6e64] mb-5">🔒 Continue lendo após o desbloqueio.</p>
              <div className="border-t border-black/10 pt-3 text-sm text-[#5a4f47]">
                Com carinho,
                <div className="text-lg italic mt-1" style={SERIF}>{fromName}</div>
              </div>
            </div>
          </div>
        )}

        {currentSlide === 4 && (
          <div className="relative w-full h-full flex items-center justify-center bg-[#FBF8F4] text-[#2a221c] px-6">
            <div className="relative max-w-sm w-full text-center">
              <div className="text-5xl mb-4">🎵</div>
              <div className="text-xs tracking-[0.22em] uppercase text-[#C97B5E] mb-4">Trilha sonora escolhida</div>
              <div className="text-2xl mb-1" style={SERIF}>{trackTitle}</div>
              <div className="text-sm text-[#7a6e64] mb-8">{trackArtist}</div>
              <div className="mx-auto w-20 h-20 rounded-full bg-black/5 flex items-center justify-center mb-6 border border-black/10">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-8 h-8 text-[#7a6e64]" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
                </svg>
              </div>
              <div className="h-1 rounded-full bg-black/10 overflow-hidden mb-3">
                <div className="h-full w-1/4 bg-[#C97B5E]/60" />
              </div>
              <p className="text-sm text-[#7a6e64]">🔒 Disponível após desbloqueio.</p>
            </div>
          </div>
        )}

        {currentSlide === 5 && (
          <div className="relative w-full h-full flex items-center justify-center bg-white text-[#2a221c] px-6 overflow-y-auto">
            <div className="relative max-w-sm w-full text-center py-12" data-stop-tap>
              <div className="text-4xl mb-4">❤️</div>
              <h2 className="text-2xl sm:text-3xl mb-4" style={SERIF}>Sua homenagem está pronta.</h2>
              <p className="text-[#5a4f47] mb-7 text-sm leading-relaxed">
                Falta apenas um passo para revelar a versão completa.
              </p>
              <div className="rounded-2xl border border-[#C97B5E]/20 bg-gradient-to-b from-white to-[#F5EFE6] p-5 mb-6">
                <div className="text-sm text-[#b9b3ad]">De <s>R$ 27,90</s></div>
                <div className="text-[11px] tracking-[0.16em] uppercase text-[#7a6e64] mt-1">Hoje por apenas</div>
                <div className="text-5xl font-semibold text-[#C97B5E] my-1" style={SERIF}>R$ 13,90</div>
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-[#C97B5E] text-white text-[11px] tracking-[0.12em] uppercase font-semibold">Oferta Especial</span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                className="w-full py-4 rounded-2xl text-white font-bold tracking-wide shadow-[0_16px_40px_-16px_rgba(201,123,94,0.55)]"
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
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/55" onClick={() => { setShowModal(false); setNotice(false); }} />
          <div className="relative w-full max-w-[420px] bg-[#FBF8F4] text-[#2a221c] rounded-3xl p-7 text-center shadow-2xl">
            <h2 className="text-xl mb-2" style={SERIF}>🔒 Sua homenagem já está pronta.</h2>
            <p className="text-[#5a4f47] text-sm mb-4">Falta apenas confirmar o pagamento para liberar a versão completa.</p>
            <div className="mb-5">
              <div className="text-sm text-[#b9b3ad]">De <s>R$ 27,90</s></div>
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
            <button
              type="button"
              onClick={() => { setShowModal(false); setNotice(false); }}
              className="mt-3 w-full py-2 text-[#7a6e64] text-sm"
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}
