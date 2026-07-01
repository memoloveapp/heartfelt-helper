import { createFileRoute, notFound } from "@tanstack/react-router";
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

type DebugInfo = {
  slug: string;
  memoryId?: string;
  photoCount?: number;
  rows?: unknown[];
  urls?: string[];
  memErr?: string;
  photoErr?: string;
};

function HomenagemPage() {
  const { slug } = Route.useParams();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [dbg, setDbg] = useState<DebugInfo>({ slug });
  const [imgStatus, setImgStatus] = useState<Record<number, "ok" | "err">>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: mem, error } = await supabase
        .from("memories")
        .select("id, slug, father_name, sender_name, message, occasion, music_title, music_artist, music_cover, music_preview_url")
        .eq("slug", slug)
        .maybeSingle();

      console.log("[homenagem] memory query", { slug, mem, error });
      if (cancelled) return;
      if (error || !mem) {
        setDbg((d) => ({ ...d, memErr: error?.message ?? "not found" }));
        setErr("Não encontramos sua homenagem.");
        setReady(true);
        return;
      }
      setMemory(mem as Memory);

      const { data: rows, error: photoErr } = await supabase
        .from("memory_photos")
        .select("*")
        .eq("memory_id", mem.id)
        .order("position", { ascending: true });

      console.log("[homenagem] photos query", { memoryId: mem.id, rows, photoErr });
      if (cancelled) return;

      const BUCKET = "memory-photos";
      const toPath = (raw: string): string | null => {
        if (!raw) return null;
        const pub = `/object/public/${BUCKET}/`;
        const sign = `/object/sign/${BUCKET}/`;
        if (raw.includes(pub)) return raw.split(pub)[1].split("?")[0];
        if (raw.includes(sign)) return raw.split(sign)[1].split("?")[0];
        return raw.replace(/^\/+/, "");
      };

      const urls: string[] = [];
      for (const r of (rows ?? []) as Array<Record<string, string>>) {
        const raw = r.photo_url || r.image_url || r.url || r.storage_path;
        if (!raw) continue;
        if (raw.startsWith("http")) { urls.push(raw); continue; }
        const path = toPath(raw);
        if (!path) continue;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        if (pub?.publicUrl) urls.push(pub.publicUrl);
      }

      console.log("[homenagem] resolved urls", urls);
      if (cancelled) return;
      setPhotos(urls);
      setDbg({
        slug,
        memoryId: mem.id,
        photoCount: rows?.length ?? 0,
        rows: rows ?? [],
        urls,
        photoErr: photoErr?.message,
      });
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (!ready) {
    return <div className="min-h-screen bg-[#FBF8F4]" />;
  }

  if (err || !memory) {
    throw notFound();
  }

  const occasion = OCCASION_LABEL[memory.occasion ?? "father_day"] ?? "Uma homenagem especial";
  const hero = photos[0];
  const trackPreview = memory.music_preview_url;

  return (
    <div className="min-h-screen bg-[#FBF8F4] text-[#2a221c]" style={SANS}>
      {/* Hero */}
      <section className="relative w-full" style={{ height: "78vh", minHeight: 520 }}>
        {hero ? (
          <img src={hero} alt={memory.father_name} className="absolute inset-0 w-full h-full object-cover" onLoad={() => setImgStatus((s) => ({ ...s, 0: "ok" }))} onError={() => setImgStatus((s) => ({ ...s, 0: "err" }))} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#3a2820] via-[#2a1f17] to-[#0f0a07]" />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-end text-center text-white px-6 pb-16">
          <div className="text-[11px] tracking-[0.32em] uppercase mb-4 opacity-90">{occasion}</div>
          <h1 className="font-medium leading-[1.05]" style={{ ...SERIF, fontSize: "clamp(2.6rem, 7vw, 4.8rem)" }}>
            {memory.father_name}
          </h1>
          <div className="mt-4 text-sm opacity-85">Com carinho, {memory.sender_name}</div>
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
      {photos.length > 1 && (
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="text-center text-[11px] tracking-[0.28em] uppercase text-[#C97B5E] mb-6">Nossos momentos</div>

          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black shadow-lg">
            <img src={photos[idx]} alt="" className="w-full h-full object-cover transition-opacity duration-500" />
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur text-white hover:bg-black/60"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Próxima"
              onClick={() => setIdx((i) => (i + 1) % photos.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur text-white hover:bg-black/60"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
            {photos.map((u, i) => (
              <button
                key={u + i}
                type="button"
                onClick={() => setIdx(i)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                  i === idx ? "border-[#C97B5E]" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img src={u} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </section>
      )}

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

      {/* DEBUG PANEL — remover depois */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <details open className="rounded-xl bg-black/90 text-green-300 text-xs p-4 font-mono">
          <summary className="cursor-pointer text-white mb-2">🐞 Debug /homenagem</summary>
          <div>slug: {dbg.slug}</div>
          <div>memory.id: {dbg.memoryId ?? "—"}</div>
          <div>photoCount: {dbg.photoCount ?? "—"}</div>
          <div>memErr: {dbg.memErr ?? "—"}</div>
          <div>photoErr: {dbg.photoErr ?? "—"}</div>
          <div className="mt-2">rows:</div>
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(dbg.rows, null, 2)}</pre>
          <div className="mt-2">resolved urls + status:</div>
          <ul className="space-y-1">
            {(dbg.urls ?? []).map((u, i) => (
              <li key={i} className="break-all">
                [{i}] {imgStatus[i] === "ok" ? "✅" : imgStatus[i] === "err" ? "❌" : "…"} {u}
                <img
                  src={u}
                  alt=""
                  style={{ display: "none" }}
                  onLoad={() => setImgStatus((s) => ({ ...s, [i]: "ok" }))}
                  onError={() => setImgStatus((s) => ({ ...s, [i]: "err" }))}
                />
              </li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}
