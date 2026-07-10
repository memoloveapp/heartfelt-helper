import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";
import { HeroScene } from "@/components/homenagem/HeroScene";
import { LetterScene } from "@/components/homenagem/LetterScene";
import { MusicScene } from "@/components/homenagem/MusicScene";
import { MemoryScene } from "@/components/homenagem/MemoryScene";
import { EndingScene } from "@/components/homenagem/EndingScene";
import { ExperienceSection } from "@/components/homenagem/ExperienceSection";
import { UnlockScene } from "@/components/homenagem/UnlockScene";
import { generateHeroCinematic } from "@/lib/hero-cinematic.functions";
import { selectHeroPhoto } from "@/lib/hero-select.functions";

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

type MockupSceneName = "hero" | "letter" | "music" | "memory" | "ending";

type MockupScrollMessage =
  | {
      type: "memolove:mockup-command";
      action: "scrollToScene";
      scene: MockupSceneName;
      behavior?: ScrollBehavior;
      block?: ScrollLogicalPosition;
    }
  | {
      type: "memolove:mockup-command";
      action: "scrollThroughMemory";
    };

const MOCKUP_SCENES = new Set<MockupSceneName>(["hero", "letter", "music", "memory", "ending"]);

function isMockupSceneName(value: unknown): value is MockupSceneName {
  return typeof value === "string" && MOCKUP_SCENES.has(value as MockupSceneName);
}

function isMockupScrollMessage(value: unknown): value is MockupScrollMessage {
  if (typeof value !== "object" || value === null) return false;
  const data = value as { type?: unknown; action?: unknown; scene?: unknown };
  if (data.type !== "memolove:mockup-command") return false;
  if (data.action === "scrollThroughMemory") return true;
  return data.action === "scrollToScene" && isMockupSceneName(data.scene);
}

function useMemoryData(slug: string) {
  const [memory, setMemory] = useState<Memory | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cleanSlug = decodeURIComponent(slug ?? "").trim();
      if (!cleanSlug) { setErr("Slug ausente."); setReady(true); return; }
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

export function HomenagemExperience({ slug, preview = false }: { slug: string; preview?: boolean }) {
  const { memory, photos, ready, err } = useMemoryData(slug);
  const [openingDone, setOpeningDone] = useState(false);
  const [cinematicUrl, setCinematicUrl] = useState<string | null>(null);
  const [selectedHeroUrl, setSelectedHeroUrl] = useState<string | null>(null);
  const [heroReady, setHeroReady] = useState(false);
  const mockupScrollJobRef = useRef(0);

  useEffect(() => {
    stopAllAudio();
    const t = setTimeout(() => setOpeningDone(true), 250);
    return () => { clearTimeout(t); stopAllAudio(); };
  }, []);

  useEffect(() => {
    if (!memory) return;
    let cancelled = false;

    const signPath = async (path: string): Promise<string | null> => {
      if (path.startsWith("http")) return path;
      const { data } = await supabase.storage.from("memory-photos").createSignedUrl(path, 3600);
      return data?.signedUrl ?? null;
    };

    const preload = (url: string) =>
      new Promise<void>((resolve) => {
        if (!url) return resolve();
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
      });

    (async () => {
      if (memory.hero_image_cinematic) {
        const url = await signPath(memory.hero_image_cinematic);
        if (!cancelled && url) setCinematicUrl(url);
      }

      let selectedPath: string | null = memory.hero_selected_photo_path;
      if (!selectedPath && photos.some(Boolean)) {
        try {
          const res: any = await selectHeroPhoto({ data: { memoryId: memory.id } });
          if (res?.ok && res.path) selectedPath = res.path;
        } catch {}
      }

      let selectedUrl: string | null = null;
      if (selectedPath) {
        selectedUrl = await signPath(selectedPath);
        if (!cancelled && selectedUrl) setSelectedHeroUrl(selectedUrl);
      }

      const finalUrl = selectedUrl ?? photos.find(Boolean) ?? "";
      if (!finalUrl) return;
      await preload(finalUrl);
      if (!cancelled) setHeroReady(true);

      if (!memory.hero_image_cinematic && photos.some(Boolean)) {
        try {
          const res: any = await generateHeroCinematic({ data: { memoryId: memory.id } });
          if (!cancelled && res?.ok && res.path) {
            const url = await signPath(res.path);
            if (!cancelled && url) setCinematicUrl(url);
          }
        } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, [memory, photos]);

  useEffect(() => {
    if (!ready || !memory || !heroReady) return;
    if (typeof window === "undefined") return;

    const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

    const muteMedia = () => {
      document.querySelectorAll<HTMLMediaElement>("audio,video").forEach((media) => {
        media.muted = true;
        try { media.pause(); } catch {}
      });
    };

    const getScene = (scene: MockupSceneName) =>
      document.querySelector<HTMLElement>(`[data-memolove-scene="${scene}"]`);

    const scrollToScene = (
      scene: MockupSceneName,
      behavior: ScrollBehavior = "smooth",
      block: ScrollLogicalPosition = "start",
    ) => {
      muteMedia();
      const target = getScene(scene);
      if (!target) return false;
      target.scrollIntoView({ behavior, block, inline: "nearest" });
      return true;
    };

    const scrollThroughMemory = async (jobId: number) => {
      const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-memolove-memory-photo]"));
      if (targets.length === 0) {
        scrollToScene("memory", "smooth", "start");
        return;
      }

      scrollToScene("memory", "smooth", "start");
      await wait(1_400);

      for (const target of targets) {
        if (mockupScrollJobRef.current !== jobId) return;
        muteMedia();
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        await wait(2_250);
      }
    };

    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin) return;
      if (!isMockupScrollMessage(event.data)) return;

      const jobId = mockupScrollJobRef.current + 1;
      mockupScrollJobRef.current = jobId;

      if (event.data.action === "scrollToScene") {
        scrollToScene(event.data.scene, event.data.behavior ?? "smooth", event.data.block ?? "start");
        return;
      }

      void scrollThroughMemory(jobId);
    };

    window.addEventListener("message", onMessage);

    if (window.parent !== window) {
      window.parent.postMessage({ type: "memolove:mockup-ready", slug: memory.slug }, window.location.origin);
    }

    return () => {
      mockupScrollJobRef.current += 1;
      window.removeEventListener("message", onMessage);
    };
  }, [ready, memory, heroReady]);

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

  const hero = selectedHeroUrl ?? photos[0] ?? "";
  const musicSrc = memory.music_id
    ? `/api/public/audio-preview/${encodeURIComponent(memory.music_id)}`
    : memory.music_preview_url ?? "";
  const hasMusic = !!musicSrc;
  const name = "Pai";

  return (
    <main className="homenagem-page" style={{ background: PAPER, color: INK, overflowX: "hidden" }}>
      {heroReady ? (
        <HeroScene name={name} photo={hero} cinematicPhoto={cinematicUrl} ready={openingDone} />
      ) : (
        <section
          aria-hidden
          style={{ width: "100%", height: "100svh", minHeight: "100svh", background: "#0a0806" }}
        />
      )}

      <LetterScene message={memory.message} sender={memory.sender_name} />
      <ExperienceSection>
        {hasMusic && (
          <MusicScene
            title={memory.music_title || "Nossa canção"}
            artist={memory.music_artist || ""}
            src={musicSrc}
            cover={memory.music_cover || hero || null}
            preview={preview}
          />
        )}
        <MemoryScene photos={photos.filter(Boolean)} preview={preview} />
        {preview ? (
          <UnlockScene slug={memory.slug} />
        ) : (
          <EndingScene sender={memory.sender_name} />
        )}
      </ExperienceSection>
    </main>
  );
}
