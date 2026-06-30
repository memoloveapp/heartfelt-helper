import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
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
  const unlockRef = useRef<HTMLElement | null>(null);

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

  const scrollToUnlock = () => {
    unlockRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white" style={SANS}>
        Carregando…
      </div>
    );
  }

  const PhotoBlock = ({ url, children }: { url?: string; children: ReactNode }) => (
    <section className="min-h-[88vh] bg-[#1a1410] text-white flex flex-col justify-end">
      <div className="grow grid">
        {url ? (
          <img
            src={url}
            alt=""
            className="w-full h-full object-cover col-start-1 row-start-1"
            style={{ filter: PHOTO_FILTER }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#3a2820] via-[#2a1f17] to-[#1a1410] col-start-1 row-start-1" />
        )}
        <div
          className="w-full h-full col-start-1 row-start-1"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.58))" }}
        />
        <div className="col-start-1 row-start-1 flex items-end justify-center px-8 pb-20 text-center">
          {children}
        </div>
      </div>
    </section>
  );

  return (
    <main className="min-h-screen bg-[#FBF8F4] text-[#1f1915]" style={SANS}>
      <header className="bg-[#1a1410] text-white px-6 py-6 flex items-center justify-between">
        <span className="text-white/85 text-[11px] tracking-[0.32em] font-medium" style={SERIF}>
          MEMOLOVE
        </span>
        <Link to="/" className="text-white/70 hover:text-white text-2xl leading-none transition" aria-label="Sair">×</Link>
      </header>

      <PhotoBlock url={photoAt(0)}>
        <div className="w-full max-w-xl mx-auto ml-rise">
          <div className="text-[11px] tracking-[0.32em] uppercase text-white/75 mb-6">
            Feliz Dia dos Pais
          </div>
          <h1
            className="font-medium leading-[1.05] mb-8"
            style={{ ...SERIF, fontSize: "clamp(2.6rem, 7vw, 4.2rem)" }}
          >
            {fatherName}
          </h1>
        </div>
      </PhotoBlock>

      <PhotoBlock url={photoAt(1)}>
        <p
          className="max-w-xl mx-auto italic leading-[1.55] text-white/95 ml-rise"
          style={{ ...SERIF, fontSize: "clamp(1.6rem, 3.6vw, 2.2rem)" }}
        >
          "Algumas lembranças merecem viver para sempre."
        </p>
      </PhotoBlock>

      <PhotoBlock url={photoAt(2)}>
        <p
          className="max-w-xl mx-auto italic leading-[1.55] text-white/95 ml-rise"
          style={{ ...SERIF, fontSize: "clamp(1.6rem, 3.6vw, 2.2rem)" }}
        >
          "Obrigado por todos os momentos."
        </p>
      </PhotoBlock>

      <section className="min-h-[78vh] flex items-center justify-center px-8 py-20 bg-[#FBF8F4] text-[#2a221c]">
        <div className="max-w-md w-full text-center ml-rise">
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
      </section>

      <section className="min-h-[70vh] flex items-center justify-center bg-[#FBF8F4] text-[#2a221c] px-8 py-20">
        <div className="max-w-sm w-full text-center ml-rise">
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
          <div className="h-[3px] rounded-full bg-black/10 mb-4 max-w-[220px] mx-auto">
            <div className="h-full w-1/4 bg-[#C97B5E]/70 rounded-full" />
          </div>
          <p className="text-xs tracking-[0.18em] uppercase text-[#7a6e64]">
            Disponível após desbloqueio
          </p>
          <button
            type="button"
            onClick={scrollToUnlock}
            className="group ml-cta-btn w-full mt-10 rounded-2xl text-white font-semibold tracking-[0.04em] text-[15px] transition-all duration-300 flex items-center justify-center gap-2"
            style={{
              height: 60,
              background: "linear-gradient(135deg, #D88B6E 0%, #C97B5E 50%, #a85f44 100%)",
              boxShadow: "0 18px 40px -14px rgba(168,95,68,0.6), 0 0 0 1px rgba(255,255,255,0.18) inset",
              animation: "mlCtaPulse 2.6s ease-in-out 1.2s infinite",
            }}
          >
            <span>❤️ REVELAR MINHA HOMENAGEM</span>
            <ArrowRight size={18} strokeWidth={2.3} />
          </button>
        </div>
      </section>

      <section ref={unlockRef} id="desbloqueio" className="px-5 py-14 bg-[#FBF8F4]">
        <div
          className="w-full max-w-[460px] mx-auto rounded-[28px] bg-white px-8 py-11"
          style={{
            border: "1px solid #ECECEC",
            boxShadow: "0 1px 2px rgba(20,14,10,0.03), 0 36px 80px -44px rgba(60,40,30,0.22)",
          }}
        >
          <h2
            className="text-center leading-[1.12] mb-3"
            style={{ ...SERIF, fontSize: "clamp(1.75rem, 5vw, 2.1rem)", fontWeight: 700 }}
          >
            ❤️ Sua homenagem já está pronta.
          </h2>

          <p className="text-center text-[#6b6058] text-[14.5px] leading-relaxed mb-8 px-2">
            Ela já foi criada especialmente para o seu pai. Agora falta apenas liberar a versão completa.
          </p>

          <ul className="space-y-4 mb-8">
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

          <div className="h-px my-8" style={{ background: "#EFEFEF" }} />

          <div className="text-center">
            <div className="text-[13px] mb-1" style={{ color: "#d23b3b" }}>
              De <s>R$ 27,90</s>
            </div>
            <div className="text-[11px] tracking-[0.24em] uppercase text-[#7a6e64] mb-1">
              Hoje por apenas
            </div>
            <div
              className="leading-none my-3 ml-price-shine"
              style={{
                ...SERIF,
                fontSize: "clamp(4rem, 13vw, 5.4rem)",
                fontWeight: 800,
                background: "linear-gradient(135deg, #D88B6E 0%, #C97B5E 45%, #a85f44 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                backgroundSize: "200% 100%",
                display: "inline-block",
              }}
            >
              R$ 13,90
            </div>
          </div>

          <button
            type="button"
            className="ml-cta-btn w-full mt-8 rounded-2xl text-white font-semibold tracking-[0.04em] text-[15px] transition-all duration-300 flex items-center justify-center gap-2"
            style={{
              height: 60,
              background: "linear-gradient(135deg, #D88B6E 0%, #C97B5E 50%, #a85f44 100%)",
              boxShadow: "0 18px 40px -14px rgba(168,95,68,0.6), 0 0 0 1px rgba(255,255,255,0.18) inset",
              animation: "mlCtaPulse 2.6s ease-in-out 1.2s infinite",
            }}
          >
            ❤️ REVELAR MINHA HOMENAGEM
          </button>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-6 text-[11.5px] text-[#7a6e64]">
            <span className="inline-flex items-center gap-1.5"><Lock size={12} strokeWidth={1.8} /> Pagamento 100% seguro</span>
            <span className="inline-flex items-center gap-1.5"><Zap size={12} strokeWidth={1.8} /> Liberação automática</span>
            <span className="inline-flex items-center gap-1.5"><Smartphone size={12} strokeWidth={1.8} /> Acesso imediato</span>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes mlRise { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mlCtaPulse { 0%,100% { box-shadow: 0 18px 40px -14px rgba(168,95,68,0.6), 0 0 0 1px rgba(255,255,255,0.18) inset, 0 0 0 0 rgba(201,123,94,0.45); } 50% { box-shadow: 0 22px 46px -14px rgba(168,95,68,0.7), 0 0 0 1px rgba(255,255,255,0.22) inset, 0 0 0 10px rgba(201,123,94,0); } }
        @keyframes mlPriceShine { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .ml-rise { opacity: 0; animation: mlRise 500ms ease-out both; }
        .ml-price-shine { animation: mlPriceShine 3.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ml-rise, .ml-price-shine, .ml-cta-btn { animation: none !important; opacity: 1 !important; }
        }
      `}</style>
    </main>
  );
}
