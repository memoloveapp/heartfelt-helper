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

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF8F4] text-[#2a221c]" style={SANS}>
        Carregando…
      </div>
    );
  }

  const photos: Photo[] = Array.isArray(data.photos) ? data.photos.filter((p) => p && typeof p.url === "string") : [];
  const fatherName = (data.fatherName || "").trim() || "Seu pai";
  const fromName = (data.fromName || "").trim() || "Sua família";
  const message = (data.message || "").trim() || "Uma mensagem escrita com muito carinho para você.";
  const track = data.track || null;
  const trackTitle = track?.title || "Trilha selecionada";
  const trackArtist = track?.artist || "";

  const hero = photos[0]?.url;
  const preview = message.slice(0, 90) + (message.length > 90 ? "..." : "");

  return (
    <div className="min-h-screen bg-[#FBF8F4] text-[#2a221c]" style={SANS}>
      <header className="flex justify-between items-center px-5 py-4 border-b border-black/5">
        <Link to="/" className="text-lg" style={SERIF}>
          Memo<em className="text-[#C97B5E] not-italic font-medium">Love</em>
        </Link>
        <Link to="/criar" className="text-sm text-[#7a6e64]">Editar</Link>
      </header>

      <main className="max-w-md mx-auto px-5 py-8 space-y-8">
        {/* Hero */}
        <section className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-[#F5EFE6]">
          {hero ? (
            <img src={hero} alt="" className="w-full h-full object-cover" style={{ filter: "blur(3px)" }} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#e8ddd0] to-[#c9b8a4]" />
          )}
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-white">
            <div className="text-3xl mb-3">❤️</div>
            <h1 className="text-3xl mb-2" style={SERIF}>Feliz Dia dos Pais</h1>
            <div className="text-2xl italic" style={SERIF}>{fatherName}</div>
          </div>
        </section>

        {/* Gallery */}
        {photos.length > 1 && (
          <section className="grid grid-cols-2 gap-3">
            {photos.slice(1, 5).map((p, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#F5EFE6]">
                <img src={p.url} alt="" className="w-full h-full object-cover" style={{ filter: "blur(4px)" }} />
                <div className="absolute inset-0 bg-black/15 flex items-center justify-center text-white text-xl">🔒</div>
              </div>
            ))}
          </section>
        )}

        {/* Letter */}
        <section className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <div className="text-xs tracking-[0.2em] uppercase text-[#C97B5E] mb-4">Uma mensagem do coração</div>
          <p className="text-lg leading-relaxed mb-4" style={SERIF}>{preview}</p>
          <p className="text-sm text-[#7a6e64] mb-4">🔒 Continue lendo após o desbloqueio.</p>
          <div className="border-t border-black/10 pt-3 text-sm text-[#5a4f47]">
            Com carinho,
            <div className="text-lg italic mt-1" style={SERIF}>{fromName}</div>
          </div>
        </section>

        {/* Music */}
        <section className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="text-2xl">🎵</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate" style={SERIF}>{trackTitle}</div>
            {trackArtist && <div className="text-sm text-[#7a6e64] truncate">{trackArtist}</div>}
            <div className="text-xs text-[#7a6e64] mt-1">🔒 Disponível após desbloqueio</div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <h2 className="text-2xl mb-3" style={SERIF}>Sua homenagem está pronta.</h2>
          <p className="text-[#5a4f47] mb-5 text-sm leading-relaxed">
            Ela já foi criada. Agora falta apenas um passo para revelar a versão completa.
          </p>
          <ul className="text-left grid gap-2 mb-5 text-sm">
            <li className="bg-[#F5EFE6] rounded-lg px-3 py-2">✔ Fotos em alta qualidade</li>
            <li className="bg-[#F5EFE6] rounded-lg px-3 py-2">✔ Mensagem completa</li>
            <li className="bg-[#F5EFE6] rounded-lg px-3 py-2">✔ Música liberada</li>
            <li className="bg-[#F5EFE6] rounded-lg px-3 py-2">✔ QR Code exclusivo</li>
            <li className="bg-[#F5EFE6] rounded-lg px-3 py-2">✔ Link para compartilhar</li>
          </ul>
          <div className="mb-5">
            <div className="text-sm text-[#b9b3ad]">De <s>R$ 27,90</s></div>
            <div className="text-xs text-[#7a6e64] uppercase tracking-widest mt-1">Hoje por apenas</div>
            <div className="text-4xl font-semibold text-[#C97B5E] my-1" style={SERIF}>R$ 13,90</div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#C97B5E] text-white text-[11px] tracking-wider uppercase">Oferta Especial</span>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full py-4 rounded-2xl text-white font-bold tracking-wide"
            style={{ background: "linear-gradient(135deg, #C97B5E, #a85f44)" }}
          >
            ❤️ REVELAR MINHA HOMENAGEM
          </button>
          <div className="flex justify-center gap-4 mt-3 text-xs text-[#7a6e64]">
            <span>🔒 Pagamento seguro</span>
            <span>⚡ Liberação imediata</span>
          </div>
        </section>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/55" onClick={() => { setShowModal(false); setNotice(false); }} />
          <div className="relative w-full max-w-[420px] bg-[#FBF8F4] rounded-3xl p-7 text-center shadow-2xl">
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
    </div>
  );
}
