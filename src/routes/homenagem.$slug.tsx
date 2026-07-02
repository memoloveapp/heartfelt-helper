import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";

function MusicPlayer({ title, artist, cover, src }: { title: string; artist: string; cover: string; src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    const onEnd = () => { setPlaying(false); setProgress(0); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      // Cleanup: pausa e reseta ao desmontar/trocar de rota
      a.pause();
      a.currentTime = 0;
    };
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else {
      // Garante que só exista uma música tocando por vez
      stopAllAudio();
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  return (
    <div className="relative rounded-[28px] p-6 flex items-center gap-5 overflow-hidden shadow-[0_20px_60px_-25px_rgba(122,46,59,0.35)] border border-white/60" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(251,246,238,0.75))", backdropFilter: "blur(20px) saturate(140%)" }}>
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#C97B5E]/20 blur-3xl pointer-events-none" aria-hidden />
      {cover ? (
        <img src={cover} alt="" className="w-20 h-20 rounded-2xl object-cover shadow-lg ring-1 ring-black/5 relative z-10" />
      ) : (
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#C97B5E]/20 to-[#7a2e3b]/10 flex items-center justify-center text-3xl relative z-10">🎵</div>
      )}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="text-[10px] tracking-[0.32em] uppercase text-[#7a2e3b] mb-1.5 font-medium">Trilha sonora</div>
        <div className="truncate text-[15px]" style={{ fontFamily: '"Fraunces", Georgia, serif' }}>{title}</div>
        {artist && <div className="truncate text-xs opacity-60 mb-2.5">{artist}</div>}
        <div className="h-[3px] rounded-full bg-[#EFE7DC] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#C97B5E] to-[#7a2e3b] transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pausar" : "Tocar prévia"}
        className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-br from-[#C97B5E] to-[#7a2e3b] text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform shrink-0"
      >
        {playing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}

export const Route = createFileRoute("/homenagem/$slug")({
  head: () => ({
    meta: [
      { title: "Uma homenagem — MemoLove" },
      { name: "description", content: "Uma homenagem eterna criada com MemoLove." },
    ],
  }),
  component: HomenagemPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF8F4] text-[#2a221c] p-8 text-center">
      <div>
        <h1 className="text-2xl mb-2" style={{ fontFamily: '"Fraunces", Georgia, serif' }}>Ops…</h1>
        <p className="text-sm opacity-70">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF8F4] text-[#2a221c] p-8 text-center">
      <p style={{ fontFamily: '"Fraunces", Georgia, serif' }}>Homenagem não encontrada.</p>
    </div>
  ),
  ssr: false,
});

const SERIF = { fontFamily: '"Fraunces", Georgia, serif' } as const;
const SANS = { fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' } as const;

type Memory = {
  id: string;
  slug: string;
  father_name: string;
  sender_name: string;
  message: string;
  occasion: string | null;
  music_title: string | null;
  music_artist: string | null;
  music_cover: string | null;
  music_preview_url: string | null;
};

const OCCASION_LABEL: Record<string, string> = {
  father_day: "Feliz Dia dos Pais",
  mother_day: "Feliz Dia das Mães",
  birthday: "Feliz Aniversário",
  anniversary: "Nosso aniversário",
};

function HomenagemPage() {
  const { slug } = Route.useParams();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Ao entrar na /homenagem, silencia qualquer prévia que ficou tocando
  useEffect(() => {
    stopAllAudio();
    return () => stopAllAudio();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const T0 = performance.now();
    console.log("[homenagem] START", { slug });
    (async () => {
      const cleanSlug = decodeURIComponent(slug ?? "").trim();

      console.time("[homenagem] 1. query memories");
      const { data: list, error } = await supabase
        .from("memories")
        .select("id, slug, father_name, sender_name, message, occasion, music_title, music_artist, music_cover, music_preview_url")
        .eq("slug", cleanSlug)
        .limit(1);
      console.timeEnd("[homenagem] 1. query memories");

      const mem = list && list.length ? list[0] : null;
      if (cancelled) return;
      if (error || !mem) {
        console.warn("[homenagem] memory não encontrada", error);
        setErr("Não encontramos sua homenagem.");
        setReady(true);
        return;
      }
      setMemory(mem as Memory);
      setReady(true);
      console.log("[homenagem] 2. render pronto em", (performance.now() - T0).toFixed(0), "ms");

      console.time("[homenagem] 3. query memory_photos");
      const { data: rows, error: phErr } = await supabase
        .from("memory_photos")
        .select("photo_url, position")
        .eq("memory_id", mem.id)
        .order("position", { ascending: true });
      console.timeEnd("[homenagem] 3. query memory_photos");

      if (cancelled) return;
      if (phErr) console.warn("[homenagem] erro memory_photos", phErr);

      const BUCKET = "memory-photos";
      const toPath = (raw: string): string | null => {
        if (!raw) return null;
        const pub = `/object/public/${BUCKET}/`;
        const sign = `/object/sign/${BUCKET}/`;
        if (raw.includes(pub)) return raw.split(pub)[1].split("?")[0];
        if (raw.includes(sign)) return raw.split(sign)[1].split("?")[0];
        return raw.replace(/^\/+/, "").replace(new RegExp(`^${BUCKET}/`), "");
      };

      const items = (rows ?? []).filter((r) => r.photo_url);
      console.log("[homenagem] 4. photos encontradas:", items.length);
      items.forEach((r, i) => console.log(`   [${i}] path=`, toPath(r.photo_url)));
      if (items.length === 0) return;

      setPhotos(new Array(items.length).fill(""));

      const signOne = async (raw: string, idx: number): Promise<string> => {
        const label = `[homenagem] 5. sign #${idx}`;
        console.time(label);
        try {
          if (raw.startsWith("http") && !raw.includes("/object/")) {
            console.timeEnd(label);
            console.log(`   #${idx} URL direta (sem sign)`);
            return raw;
          }
          const path = toPath(raw);
          if (!path) { console.timeEnd(label); return ""; }
          const { data, error: sErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
          console.timeEnd(label);
          if (sErr || !data?.signedUrl) {
            console.warn(`   #${idx} sign FALHOU`, sErr);
            return "";
          }
          console.log(`   #${idx} sign OK`);
          return data.signedUrl;
        } catch (e) {
          console.timeEnd(label);
          console.warn(`   #${idx} sign EXCEPTION`, e);
          return "";
        }
      };

      // Cada foto assinada individualmente — atualiza estado assim que fica pronta
      items.forEach((item, index) => {
        signOne(item.photo_url, index).then((u) => {
          if (cancelled || !u) return;
          setPhotos((prev) => {
            const next = [...prev];
            next[index] = u;
            return next;
          });
        });
      });
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex items-center justify-center">
        <div className="text-sm opacity-60">carregando…</div>
      </div>
    );
  }

  if (err || !memory) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] text-[#2a221c] flex items-center justify-center">
        <div className="max-w-xl mx-auto text-center p-8">
          <h1 className="text-2xl mb-2" style={SERIF}>Homenagem não encontrada</h1>
          <p className="text-sm opacity-70">{err}</p>
        </div>
      </div>
    );
  }

  const occasion = OCCASION_LABEL[memory.occasion ?? "father_day"] ?? "Uma homenagem especial";
  const trackPreview = memory.music_preview_url;
  const hero = photos[0];
  const gallery = photos.slice(1);

  const scrollNext = () => {
    const el = document.getElementById("ml-next");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#0e0b09] text-[#2a221c]" style={SANS}>
      {/* Hero cinemático full screen */}
      <section className="relative w-full overflow-hidden bg-[#0e0b09]" style={{ minHeight: "100svh" }}>
        <div className="absolute inset-0 ml-skeleton opacity-30" aria-hidden />
        {hero && (
          <img
            src={hero}
            alt={memory.father_name}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover ml-hero-fade ml-kenburns"
            onLoad={(e) => { e.currentTarget.classList.add("is-loaded"); }}
            onError={() => console.warn("[homenagem] IMG hero ERROR")}
          />
        )}
        {/* Overlays de leitura */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

        {/* Conteúdo centralizado */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 py-16 text-white" style={{ minHeight: "100svh" }}>
          <div className="ml-rise" style={{ animationDelay: "200ms" }}>
            <div className="text-[10px] sm:text-[11px] tracking-[0.42em] uppercase mb-6 opacity-90">
              {occasion}
            </div>
          </div>

          <div className="ml-rise" style={{ animationDelay: "500ms" }}>
            <h1
              className="font-medium leading-[1.02] tracking-tight"
              style={{ ...SERIF, fontSize: "clamp(2.6rem, 9vw, 5.5rem)" }}
            >
              {memory.father_name}
            </h1>
          </div>

          <div className="ml-rise" style={{ animationDelay: "900ms" }}>
            <div
              className="mt-8 mx-auto max-w-md opacity-90 leading-relaxed"
              style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(1rem, 2.4vw, 1.2rem)" }}
            >
              Com carinho, {memory.sender_name}
            </div>
          </div>

          <div className="ml-rise absolute bottom-10 inset-x-0 flex flex-col items-center gap-4" style={{ animationDelay: "1300ms" }}>
            <button
              type="button"
              onClick={scrollNext}
              className="px-8 py-3.5 rounded-full bg-white/95 text-[#1a1512] text-sm tracking-[0.24em] uppercase font-medium shadow-2xl hover:bg-white transition-all hover:scale-[1.03] active:scale-[0.98] backdrop-blur"
            >
              Ver homenagem
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Rolar"
              className="opacity-70 hover:opacity-100 transition-opacity animate-bounce"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13l5 5 5-5"/><path d="M7 6l5 5 5-5"/></svg>
            </button>
          </div>
        </div>
      </section>

      <div id="ml-next" className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #FBF6EE 0%, #F5EBDF 55%, #F0DFD3 100%)" }}>
        {/* ornamentos suaves de fundo */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, rgba(201,168,106,0.25), transparent 60%)" }} aria-hidden />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, rgba(122,46,59,0.2), transparent 60%)" }} aria-hidden />

        {/* Música — logo após o hero */}
        {trackPreview && (
          <section className="relative max-w-lg mx-auto px-6 pt-16 md:pt-24 ml-reveal">
            <MusicPlayer
              title={memory.music_title ?? "Trilha sonora"}
              artist={memory.music_artist ?? ""}
              cover={memory.music_cover ?? ""}
              src={trackPreview}
            />
          </section>
        )}

        {/* Mensagem */}
        <section className="relative max-w-2xl mx-auto px-6 py-20 md:py-28 ml-reveal">
          <div className="relative rounded-[32px] p-10 md:p-14 text-center border border-white/70 shadow-[0_30px_80px_-40px_rgba(122,46,59,0.35)]" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))", backdropFilter: "blur(24px) saturate(140%)" }}>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #C9A86A, #7a2e3b)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 21s-7-4.35-9.5-9C.72 8.5 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.28 4.5 4.5 8-2.5 4.65-9.5 9-9.5 9z"/></svg>
            </div>
            <div className="text-[11px] tracking-[0.32em] uppercase text-[#7a2e3b] mb-6 font-medium">Uma mensagem do coração</div>
            <span className="block text-6xl leading-none text-[#C9A86A] font-serif opacity-70" style={SERIF} aria-hidden>&ldquo;</span>
            <p className="whitespace-pre-line leading-[1.75] text-[#2a1a1e] -mt-4" style={{ ...SERIF, fontSize: "clamp(1.15rem, 2.2vw, 1.4rem)" }}>
              {memory.message}
            </p>
            <div className="mt-8 text-[11px] tracking-[0.3em] uppercase text-[#7a2e3b]/70">— {memory.sender_name}</div>
          </div>
        </section>

        {/* Galeria editorial */}
        {gallery.length > 0 && (
          <section className="relative max-w-5xl mx-auto px-6 pb-24 ml-reveal">
            <div className="text-center mb-12">
              <div className="text-[11px] tracking-[0.32em] uppercase text-[#7a2e3b] mb-3 font-medium">Momentos</div>
              <h2 className="text-[#2a1a1e]" style={{ ...SERIF, fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Instantes eternos</h2>
              <div className="mx-auto mt-4 w-16 h-px bg-gradient-to-r from-transparent via-[#C9A86A] to-transparent" />
            </div>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-5 [column-fill:_balance]">
              {gallery.map((url, i) => {
                const priority = i < 2;
                // alterna alturas para efeito editorial/masonry
                const ratios = ["3 / 4", "4 / 5", "1 / 1", "3 / 4", "4 / 5", "2 / 3"];
                const ratio = ratios[i % ratios.length];
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => url && setLightbox(url)}
                    className="group relative overflow-hidden rounded-2xl bg-[#EFE7DC] ml-skeleton shadow-[0_15px_40px_-20px_rgba(122,46,59,0.4)] hover:shadow-[0_25px_60px_-20px_rgba(122,46,59,0.55)] focus:outline-none focus:ring-2 focus:ring-[#C9A86A] mb-4 md:mb-5 block w-full break-inside-avoid transition-shadow duration-500"
                    style={{ aspectRatio: ratio }}
                    aria-label={`Ver foto ${i + 2}`}
                  >
                    {url && (
                      <img
                        src={url}
                        alt={`Momento ${i + 2}`}
                        loading={priority ? "eager" : "lazy"}
                        fetchPriority={priority ? "high" : "auto"}
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover ml-fade-in transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                        onLoad={(e) => { e.currentTarget.classList.add("is-loaded"); }}
                        onError={() => console.warn(`[homenagem] IMG gallery #${i + 1} ERROR`)}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Encerramento emocional */}
        <section className="relative max-w-2xl mx-auto px-6 pb-20 text-center ml-reveal">
          <div className="mx-auto mb-8 w-px h-16 bg-gradient-to-b from-transparent to-[#C9A86A]" />
          <p className="text-[#2a1a1e]/80 leading-[1.8]" style={{ ...SERIF, fontStyle: "italic", fontSize: "clamp(1.05rem, 2vw, 1.2rem)" }}>
            Essa homenagem foi criada com carinho para eternizar momentos especiais.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <ShareButton name={memory.father_name} />
          </div>
        </section>

        <footer className="relative text-center py-10 text-[10px] tracking-[0.4em] uppercase text-[#7a2e3b]/70">
          Feito com <span className="text-[#C97B5E]">❤</span> no MemoLove
        </footer>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 ml-fade-in is-loaded"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={lightbox}
            alt=""
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center text-xl backdrop-blur-md border border-white/20"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      )}


      <style>{`
        @keyframes mlShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .ml-skeleton { background: linear-gradient(90deg, #EFE7DC 0%, #F5EFE6 50%, #EFE7DC 100%); background-size: 200% 100%; animation: mlShimmer 1.6s ease-in-out infinite; }
        .ml-fade-in { opacity: 0; transition: opacity 500ms ease; }
        .ml-fade-in.is-loaded { opacity: 1; }
        @keyframes mlKen { 0% { transform: scale(1.02); } 100% { transform: scale(1.12); } }
        .ml-hero-fade { opacity: 0; transition: opacity 900ms ease; }
        .ml-hero-fade.is-loaded { opacity: 1; }
        .ml-kenburns { animation: mlKen 14s ease-out both; transform-origin: center; }
        @keyframes mlRise { 0% { opacity: 0; transform: translateY(18px); } 100% { opacity: 1; transform: translateY(0); } }
        .ml-rise { opacity: 0; animation: mlRise 900ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes mlReveal { 0% { opacity: 0; transform: translateY(28px); } 100% { opacity: 1; transform: translateY(0); } }
        .ml-reveal { animation: mlReveal 1s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .ml-kenburns, .ml-rise, .ml-reveal, .ml-skeleton { animation: none; }
          .ml-hero-fade, .ml-fade-in { transition: none; opacity: 1; }
          .ml-rise, .ml-reveal { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function ShareButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = `Homenagem para ${name}`;
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title, url });
        return;
      }
    } catch { /* usuário cancelou */ }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* ignore */ }
  }
  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-white text-[13px] tracking-[0.2em] uppercase font-medium shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-transform"
      style={{ background: "linear-gradient(135deg, #C97B5E, #7a2e3b)" }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      {copied ? "Link copiado" : "Compartilhar"}
    </button>
  );
}
    </div>
  );
}
