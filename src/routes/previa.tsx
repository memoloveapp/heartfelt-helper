import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Image as ImageIcon, MessageSquare, Music, QrCode, Share2, Lock, Zap, ArrowRight, Smartphone } from "lucide-react";

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

const OVERLAY =
  "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.48))";
const PHOTO_FILTER = "brightness(0.92) contrast(1.05) saturate(1.03)";

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
  const preview = message.slice(0, 90) + (message.length > 90 ? "…" : "");

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
        <img
          src={url}
          alt=""
          className="w-full h-full object-cover ml-kenburns"
          style={{ filter: PHOTO_FILTER, willChange: "transform" }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#3a2820] via-[#2a1f17] to-[#1a1410]" />
      )}
      <div className="absolute inset-0" style={{ background: OVERLAY }} />
    </div>
  );

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none cursor-pointer text-white"
      style={SANS}
      onClick={handleTap}
    >
      {/* Progress bars — Instagram Stories style */}
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-[5px] px-4 pt-4">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-[2.5px] rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.35)" }}
          >
            <div
              className="h-full bg-white transition-[width] duration-300 ease-out"
              style={{ width: i <= currentSlide ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* Brand + close */}
      <div className="absolute top-8 left-0 right-0 z-30 flex items-center justify-between px-6 pt-2" data-stop-tap>
        <span className="text-white/85 text-[11px] tracking-[0.32em] font-medium" style={SERIF}>
          MEMOLOVE
        </span>
        <Link to="/" className="text-white/70 hover:text-white text-2xl leading-none transition" aria-label="Sair">×</Link>
      </div>

      {/* Slides */}
      <div key={currentSlide} className="absolute inset-0 animate-[mlFade_350ms_ease]">
        {currentSlide === 0 && (
          <div className="relative w-full h-full flex items-end justify-center">
            <PhotoBg url={photoAt(0)} />
            <div className="relative z-10 w-full px-8 pb-24 text-center max-w-xl mx-auto animate-[mlRise_600ms_350ms_ease_both]">
              <div className="text-[11px] tracking-[0.32em] uppercase text-white/75 mb-6">
                Feliz Dia dos Pais
              </div>
              <h1
                className="font-medium leading-[1.05] mb-8"
                style={{ ...SERIF, fontSize: "clamp(2.6rem, 7vw, 4.2rem)" }}
              >
                {fatherName}
              </h1>
              <div className="text-white/70 text-sm tracking-[0.18em] uppercase">
                Toque para começar
              </div>
            </div>
          </div>
        )}

        {currentSlide === 1 && (
          <div className="relative w-full h-full flex items-end justify-center">
            <PhotoBg url={photoAt(1)} />
            <div className="relative z-10 w-full px-10 pb-28 text-center max-w-xl mx-auto animate-[mlRise_600ms_300ms_ease_both]">
              <p
                className="italic leading-[1.55] text-white/95"
                style={{ ...SERIF, fontSize: "clamp(1.6rem, 3.6vw, 2.2rem)" }}
              >
                "Algumas lembranças merecem viver para sempre."
              </p>
            </div>
          </div>
        )}

        {currentSlide === 2 && (
          <div className="relative w-full h-full flex items-end justify-center">
            <PhotoBg url={photoAt(2)} />
            <div className="relative z-10 w-full px-10 pb-28 text-center max-w-xl mx-auto animate-[mlRise_600ms_300ms_ease_both]">
              <p
                className="italic leading-[1.55] text-white/95"
                style={{ ...SERIF, fontSize: "clamp(1.6rem, 3.6vw, 2.2rem)" }}
              >
                "Obrigado por todos os momentos."
              </p>
            </div>
          </div>
        )}

        {currentSlide === 3 && (
          <div className="relative w-full h-full flex items-center justify-center bg-[#FBF8F4] text-[#2a221c] px-8">
            <div className="relative max-w-md w-full text-center animate-[mlRise_600ms_200ms_ease_both]">
              <div className="text-[11px] tracking-[0.28em] uppercase text-[#C97B5E] mb-8">
                Uma mensagem do coração
              </div>
              <p
                className="leading-[1.7] mb-10"
                style={{ ...SERIF, fontSize: "clamp(1.25rem, 2.6vw, 1.55rem)" }}
              >
                {preview}
              </p>
              <div className="flex flex-col gap-3 my-8">
                <span className="h-[6px] rounded-full bg-[#C97B5E]/15" />
                <span className="h-[6px] rounded-full bg-[#C97B5E]/15 w-[85%] mx-auto" />
                <span className="h-[6px] rounded-full bg-[#C97B5E]/15 w-[60%] mx-auto" />
              </div>
              <p className="text-xs tracking-[0.18em] uppercase text-[#7a6e64] mb-8">
                🔒 Continue lendo após o desbloqueio
              </p>
              <div className="border-t border-black/10 pt-5 text-xs tracking-[0.14em] uppercase text-[#7a6e64]">
                Com carinho
                <div className="text-xl italic mt-2 normal-case tracking-normal text-[#2a221c]" style={SERIF}>
                  {fromName}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentSlide === 4 && (
          <div className="relative w-full h-full flex items-center justify-center bg-[#FBF8F4] text-[#2a221c] px-8">
            <div className="relative max-w-sm w-full text-center animate-[mlRise_600ms_200ms_ease_both]">
              <div className="text-[11px] tracking-[0.28em] uppercase text-[#C97B5E] mb-6">
                Trilha sonora
              </div>
              <div className="text-3xl mb-2" style={SERIF}>{trackTitle}</div>
              <div className="text-sm text-[#7a6e64] mb-12">{trackArtist}</div>
              <div className="mx-auto w-20 h-20 rounded-full bg-black/[0.04] flex items-center justify-center mb-8 border border-black/10">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-7 h-7 text-[#7a6e64]" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
                </svg>
              </div>
              <div className="h-[3px] rounded-full bg-black/10 overflow-hidden mb-4 max-w-[220px] mx-auto">
                <div className="h-full w-1/4 bg-[#C97B5E]/70" />
              </div>
              <p className="text-xs tracking-[0.18em] uppercase text-[#7a6e64]">
                Disponível após desbloqueio
              </p>
            </div>
          </div>
        )}

        {currentSlide === 5 && (
          <div className="relative w-full h-full flex items-center justify-center bg-[#FBF8F4] text-[#1f1915] px-5 overflow-y-auto">
            <div className="relative w-full max-w-[460px] py-10" data-stop-tap>
              <div
                className="relative rounded-[28px] bg-white px-8 py-11"
                style={{
                  border: "1px solid #ECECEC",
                  boxShadow: "0 1px 2px rgba(20,14,10,0.03), 0 36px 80px -44px rgba(60,40,30,0.22)",
                  animation: "mlRise 500ms ease-out both",
                }}
              >
                {/* Selo */}
                <div className="flex justify-center mb-6" style={{ animation: "mlRise 500ms ease-out 80ms both", opacity: 0 }}>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FBF1EA] text-[#a85f44] text-[11px] font-semibold tracking-[0.06em]">
                    ✨ Oferta Especial de Lançamento
                  </span>
                </div>

                {/* Título */}
                <h2
                  className="text-center leading-[1.12] mb-3"
                  style={{ ...SERIF, fontSize: "clamp(1.75rem, 5vw, 2.1rem)", fontWeight: 700, letterSpacing: "-0.015em", animation: "mlRise 500ms ease-out 140ms both", opacity: 0 }}
                >
                  ❤️ Sua homenagem já está pronta.
                </h2>

                {/* Subtítulo */}
                <p
                  className="text-center text-[#6b6058] text-[14.5px] leading-relaxed mb-8 px-2"
                  style={{ animation: "mlRise 500ms ease-out 200ms both", opacity: 0 }}
                >
                  Ela já foi criada especialmente para o seu pai. Agora falta apenas liberar a versão completa.
                </p>

                {/* Benefícios */}
                <ul className="space-y-4 mb-8" style={{ animation: "mlRise 500ms ease-out 260ms both", opacity: 0 }}>
                  {[
                    { icon: ImageIcon, label: "Todas as fotos em alta qualidade" },
                    { icon: MessageSquare, label: "Mensagem completa" },
                    { icon: Music, label: "Trilha sonora liberada" },
                    { icon: QrCode, label: "QR Code exclusivo" },
                    { icon: Share2, label: "Link para compartilhar" },
                  ].map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3.5 text-[14.5px] text-[#2a221c]">
                      <span className="flex-none w-8 h-8 rounded-full bg-[#FBF1EA] text-[#C97B5E] flex items-center justify-center">
                        <Icon size={15} strokeWidth={1.75} />
                      </span>
                      <span className="flex-1">{label}</span>
                      <Check size={16} strokeWidth={2} className="text-[#C97B5E]/75" />
                    </li>
                  ))}
                </ul>

                {/* Separador */}
                <div className="h-px my-8" style={{ background: "#EFEFEF" }} />

                {/* Preço */}
                <div className="text-center" style={{ animation: "mlRise 500ms ease-out 320ms both", opacity: 0 }}>
                  <div className="text-[13px] mb-1" style={{ color: "#A0A0A0" }}>
                    De <s>R$ 27,90</s>
                  </div>
                  <div className="text-[11px] tracking-[0.24em] uppercase text-[#7a6e64] mb-1">
                    Hoje por apenas
                  </div>
                  <div
                    className="leading-none my-3 text-[#C97B5E]"
                    style={{ ...SERIF, fontSize: "clamp(4rem, 13vw, 5.4rem)", fontWeight: 800, letterSpacing: "-0.035em" }}
                  >
                    R$ 13,90
                  </div>
                  <div
                    className="inline-block mt-3 px-3.5 py-1.5 rounded-full text-[12px] font-medium"
                    style={{ background: "#EAF6EE", color: "#2f7a4f" }}
                  >
                    💝 Economize 50% nesta oferta de lançamento.
                  </div>
                </div>

                {/* Botão */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                  className="group w-full mt-8 rounded-2xl text-white font-semibold tracking-[0.03em] text-[15px] transition-all duration-300 hover:-translate-y-[2px] active:translate-y-0 flex items-center justify-center gap-2"
                  style={{
                    height: 58,
                    background: "linear-gradient(135deg, #D88B6E 0%, #C97B5E 55%, #a85f44 100%)",
                    boxShadow: "0 18px 40px -16px rgba(168,95,68,0.6)",
                    animation: "mlRise 500ms ease-out 420ms both",
                    opacity: 0,
                  }}
                >
                  <span>❤️ REVELAR MINHA HOMENAGEM</span>
                  <ArrowRight size={17} strokeWidth={2.2} className="transition-transform duration-300 group-hover:translate-x-1" />
                </button>

                {/* Faixa de garantias */}
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-6 text-[11.5px] text-[#7a6e64]">
                  <span className="inline-flex items-center gap-1.5"><Lock size={12} strokeWidth={1.8} /> Pagamento 100% seguro</span>
                  <span className="inline-flex items-center gap-1.5"><Zap size={12} strokeWidth={1.8} /> Liberação automática</span>
                  <span className="inline-flex items-center gap-1.5"><Smartphone size={12} strokeWidth={1.8} /> Acesso imediato</span>
                </div>

                {/* Rodapé */}
                <p className="text-center text-[10.5px] text-[#a39a92] mt-5 leading-relaxed">
                  A homenagem será liberada automaticamente logo após a confirmação do pagamento.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => { setShowModal(false); setNotice(false); }} />
          <div className="relative w-full max-w-[360px] bg-[#FBF8F4] text-[#2a221c] rounded-2xl p-6 text-center shadow-2xl animate-[mlRise_320ms_ease_both]">
            <h2 className="text-base mb-1.5" style={SERIF}>🔒 Sua homenagem já está pronta.</h2>
            <p className="text-[#5a4f47] text-[12.5px] mb-4 leading-snug">Falta apenas confirmar o pagamento para liberar a versão completa.</p>
            <div className="mb-4">
              <div className="text-[12px] text-[#b9b3ad]">De <s>R$ 27,90</s></div>
              <div className="text-2xl font-semibold text-[#C97B5E]" style={SERIF}>R$ 13,90</div>
            </div>
            {notice ? (
              <p className="bg-[#F5EFE6] rounded-lg p-2.5 text-[#5a4f47] text-[12.5px]">Checkout será conectado na próxima etapa.</p>
            ) : (
              <button
                type="button"
                onClick={() => setNotice(true)}
                className="w-full py-3 rounded-xl text-white font-bold tracking-[0.05em] text-[13px]"
                style={{ background: "linear-gradient(135deg, #D88B6E, #C97B5E, #a85f44)" }}
              >
                CONTINUAR PARA O PAGAMENTO
              </button>
            )}
            <button
              type="button"
              onClick={() => { setShowModal(false); setNotice(false); }}
              className="mt-2 w-full py-1.5 text-[#7a6e64] text-[12.5px]"
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes mlFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mlRise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mlPop { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes mlKenBurns { from { transform: scale(1); } to { transform: scale(1.06); } }
        .ml-rise { opacity: 0; animation: mlRise 500ms ease-out both; }
        .ml-pop { opacity: 0; animation: mlPop 350ms ease-out both; }
        .ml-kenburns { transform: scale(1); animation: mlKenBurns 18s ease-out both; transform-origin: center center; }
        @media (prefers-reduced-motion: reduce) {
          .ml-rise, .ml-pop, .ml-kenburns { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
