import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";
import { HeroScene } from "@/components/homenagem/HeroScene";
import { LetterScene } from "@/components/homenagem/LetterScene";
import { MusicScene } from "@/components/homenagem/MusicScene";
import { MemoryScene } from "@/components/homenagem/MemoryScene";
import { EndingScene } from "@/components/homenagem/EndingScene";
import { ExperienceSection } from "@/components/homenagem/ExperienceSection";
import { generateHeroCinematic } from "@/lib/hero-cinematic.functions";
import { selectHeroPhoto } from "@/lib/hero-select.functions";

/* /homenagem/$slug — MemoLove
   HeroScene · LetterScene · MusicScene · MemoryScene · EndingScene */

const PAPER = "#F8F4EC";
const INK = "#2B2623";

type Memory = {
  id: string;
  slug: string;
  father_name: string;
  sender_name: string;
  message: string;
  occasion: string | null;
  music_id: string | null;
  music_title: string | null;
  music_artist: string | null;
  music_cover: string | null;
  music_preview_url: string | null;
  hero_image_cinematic: string | null;
  hero_selected_photo_path: string | null;
};

export const Route = createFileRoute("/homenagem/$slug")({
  head: () => ({
    meta: [
      { title: "Uma memória eterna — MemoLove" },
      { name: "description", content: "Uma homenagem feita com tempo, carinho e amor." },
    ],
  }),
  component: HomenagemPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: PAPER, color: INK }}>
      <div><h1 className="text-2xl mb-2" style={{ fontStyle: "italic" }}>Um instante…</h1><p className="text-sm opacity-70">{error.message}</p></div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: PAPER, color: INK }}>
      <p style={{ fontStyle: "italic" }}>Memória não encontrada.</p>
    </div>
  ),
  ssr: false,
});

/* ---------------- Data fetch ---------------- */
function useMemoryData(slug: string) {
  const [memory, setMemory] = useState<Memory | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cleanSlug = decodeURIComponent(slug ?? "").trim();
      const { data: list, error } = await supabase
        .from("memories")
        .select("id, slug, father_name, sender_name, message, occasion, music_id, music_title, music_artist, music_cover, music_preview_url, hero_image_cinematic, hero_selected_photo_path")
        .eq("slug", cleanSlug).limit(1);
      const mem = list && list.length ? list[0] : null;
      if (cancelled) return;
      if (error || !mem) { setErr("Não encontramos sua memória."); setReady(true); return; }
      setMemory(mem as Memory);
      setReady(true);

      const { data: rows } = await supabase
        .from("memory_photos").select("photo_url, position")
        .eq("memory_id", mem.id).order("position", { ascending: true });
      if (cancelled) return;

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
      if (items.length === 0) return;
      setPhotos(new Array(items.length).fill(""));
      const signOne = async (raw: string): Promise<string> => {
        try {
          if (raw.startsWith("http") && !raw.includes("/object/")) return raw;
          const path = toPath(raw);
          if (!path) return "";
          const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
          return data?.signedUrl ?? "";
        } catch { return ""; }
      };
      items.forEach((item, index) => {
        signOne(item.photo_url).then((u) => {
          if (cancelled || !u) return;
          setPhotos((prev) => { const next = [...prev]; next[index] = u; return next; });
        });
      });
    })();
    return () => { cancelled = true; };
  }, [slug]);

  return { memory, photos, ready, err };
}

/* ---------------- PAGE ---------------- */


/* ---------------- PAGE ---------------- */
function HomenagemPage() {
  const { slug } = Route.useParams();
  const { memory, photos, ready, err } = useMemoryData(slug);
  const [openingDone, setOpeningDone] = useState(false);
  const [cinematicUrl, setCinematicUrl] = useState<string | null>(null);
  const [selectedHeroUrl, setSelectedHeroUrl] = useState<string | null>(null);

  useEffect(() => {
    stopAllAudio();
    const t = setTimeout(() => setOpeningDone(true), 250);
    return () => { clearTimeout(t); stopAllAudio(); };
  }, []);

  // Hero Intelligence: pick best photo (once), then trigger cinematic processing on that photo.
  useEffect(() => {
    if (!memory) return;
    let cancelled = false;

    const signPath = async (path: string): Promise<string | null> => {
      if (path.startsWith("http")) return path;
      const { data } = await supabase.storage.from("memory-photos").createSignedUrl(path, 3600);
      return data?.signedUrl ?? null;
    };

    (async () => {
      // 1) Resolve cinematic if it already exists.
      if (memory.hero_image_cinematic) {
        const url = await signPath(memory.hero_image_cinematic);
        if (!cancelled && url) setCinematicUrl(url);
      }

      // 2) Resolve the AI-selected hero photo (or trigger selection).
      let selectedPath: string | null = memory.hero_selected_photo_path;
      if (!selectedPath && photos.some(Boolean)) {
        try {
          const res: any = await selectHeroPhoto({ data: { memoryId: memory.id } });
          if (res?.ok && res.path) selectedPath = res.path;
        } catch { /* fallback below */ }
      }
      if (selectedPath) {
        const url = await signPath(selectedPath);
        if (!cancelled && url) setSelectedHeroUrl(url);
      }

      // 3) Kick off cinematic generation if missing. It reads hero_selected_photo_path server-side.
      if (!memory.hero_image_cinematic && photos.some(Boolean)) {
        try {
          const res: any = await generateHeroCinematic({ data: { memoryId: memory.id } });
          if (!cancelled && res?.ok && res.path) {
            const url = await signPath(res.path);
            if (!cancelled && url) setCinematicUrl(url);
          }
        } catch { /* keep fallback */ }
      }
    })();
    return () => { cancelled = true; };
  }, [memory, photos]);


  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: PAPER, color: INK }}>
        <div style={{ fontSize: 10, letterSpacing: ".5em" }} className="uppercase animate-pulse">preparando</div>
      </div>
    );
  }
  if (err || !memory) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: PAPER, color: INK }}>
        <div className="text-center p-8">
          <h1 style={{ fontStyle: "italic" }} className="text-2xl mb-2">Memória não encontrada</h1>
          <p className="text-sm opacity-70">{err}</p>
        </div>
      </div>
    );
  }

  const hero = photos[0] ?? "";
  const rest = photos.slice(1).filter(Boolean);
  // Proxy same-origin: URL fresca + Content-Type audio/mpeg garantidos pelo backend
  const musicSrc = memory.music_id
    ? `/api/public/audio-preview/${encodeURIComponent(memory.music_id)}`
    : memory.music_preview_url ?? "";
  const hasMusic = !!musicSrc;
  const name = "Pai";


  return (
    <main className="homenagem-page" style={{ background: PAPER, color: INK, overflowX: "hidden" }}>
      <HeroScene name={name} photo={hero} cinematicPhoto={cinematicUrl} ready={openingDone} />

      <LetterScene message={memory.message} sender={memory.sender_name} />
      <ExperienceSection>
        {hasMusic && (
          <MusicScene
            title={memory.music_title || "Nossa canção"}
            artist={memory.music_artist || ""}
            src={musicSrc}
            cover={memory.music_cover || hero || null}
          />
        )}
        <MemoryScene photos={photos.filter(Boolean)} />
        <EndingScene sender={memory.sender_name} />
      </ExperienceSection>
    </main>
  );
}


