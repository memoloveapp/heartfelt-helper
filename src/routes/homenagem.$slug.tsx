import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

      // Hero primeiro
      const heroStart = performance.now();
      signOne(items[0].photo_url, 0).then((u) => {
        console.log("[homenagem] 6. hero signed em", (performance.now() - heroStart).toFixed(0), "ms");
        if (cancelled || !u) return;
        setPhotos((prev) => { const next = [...prev]; next[0] = u; return next; });
      });

      // Restante em paralelo
      if (items.length > 1) {
        const restStart = performance.now();
        console.log("[homenagem] 7. assinando", items.length - 1, "fotos em PARALELO");
        Promise.all(items.slice(1).map((r, i) => signOne(r.photo_url, i + 1))).then((urls) => {
          console.log("[homenagem] 8. galeria signed em", (performance.now() - restStart).toFixed(0), "ms");
          if (cancelled) return;
          setPhotos((prev) => {
            const next = [...prev];
            urls.forEach((u, i) => { if (u) next[i + 1] = u; });
            return next;
          });
        });
      }
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

  return (
    <div className="min-h-screen bg-[#FBF8F4] text-[#2a221c]" style={SANS}>
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-[#EFE7DC]" style={{ aspectRatio: "3 / 4", maxHeight: "90vh" }}>
        <div className="absolute inset-0 ml-skeleton" aria-hidden />
        {hero && (
          <img
            src={hero}
            alt={memory.father_name}
            width={1200}
            height={1600}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover ml-fade-in"
            onLoad={(e) => { console.log("[homenagem] IMG hero LOAD"); e.currentTarget.classList.add("is-loaded"); }}
            onError={() => console.warn("[homenagem] IMG hero ERROR")}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-8 text-center text-white">
          <div className="text-[11px] tracking-[0.32em] uppercase mb-3 opacity-90">{occasion}</div>
          <h1 className="font-medium leading-[1.05]" style={{ ...SERIF, fontSize: "clamp(2.2rem, 6vw, 4rem)" }}>
            {memory.father_name}
          </h1>
          <div className="mt-3 text-sm opacity-90">Com carinho, {memory.sender_name}</div>
        </div>
      </section>

      {/* Message */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="text-[11px] tracking-[0.28em] uppercase text-[#C97B5E] mb-6">Uma mensagem do coração</div>
        <p className="whitespace-pre-line leading-[1.7]" style={{ ...SERIF, fontSize: "clamp(1.1rem, 2.1vw, 1.35rem)" }}>
          {memory.message}
        </p>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <div className="text-[11px] tracking-[0.28em] uppercase text-[#C97B5E] mb-6 text-center">Momentos</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gallery.map((url, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl bg-[#EFE7DC] shadow-sm ml-skeleton" style={{ aspectRatio: "3 / 4" }}>
                {url && (
                  <img
                    src={url}
                    alt={`Momento ${i + 2}`}
                    width={800}
                    height={1067}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover ml-fade-in"
                    onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <style>{`
        @keyframes mlShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .ml-skeleton { background: linear-gradient(90deg, #EFE7DC 0%, #F5EFE6 50%, #EFE7DC 100%); background-size: 200% 100%; animation: mlShimmer 1.6s ease-in-out infinite; }
        .ml-fade-in { opacity: 0; transition: opacity 500ms ease; }
        .ml-fade-in.is-loaded { opacity: 1; }
        @media (prefers-reduced-motion: reduce) { .ml-skeleton { animation: none; } .ml-fade-in { transition: none; opacity: 1; } }
      `}</style>

      {/* Music */}
      {(memory.music_title || trackPreview) && (
        <section className="max-w-md mx-auto px-6 pb-16">
          <div className="rounded-2xl bg-white shadow-sm border border-black/5 p-4 flex items-center gap-4">
            {memory.music_cover ? (
              <img src={memory.music_cover} alt="" className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-[#C97B5E]/10 flex items-center justify-center text-2xl">🎵</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] tracking-[0.24em] uppercase text-[#C97B5E] mb-1">Trilha sonora</div>
              <div className="truncate font-medium" style={SERIF}>{memory.music_title}</div>
              {memory.music_artist && <div className="truncate text-xs opacity-70">{memory.music_artist}</div>}
            </div>
            {trackPreview && (
              <audio controls src={trackPreview} className="w-40 hidden sm:block" />
            )}
          </div>
          {trackPreview && (
            <audio controls src={trackPreview} className="w-full mt-3 sm:hidden" />
          )}
        </section>
      )}

      <footer className="text-center py-10 text-[10px] tracking-[0.4em] uppercase text-[#7a6e64]">
        MemoLove
      </footer>
    </div>
  );
}
