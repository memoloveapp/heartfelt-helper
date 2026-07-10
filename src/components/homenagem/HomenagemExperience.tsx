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
      action: "startAutoScroll";
    }
  | {
      type: "memolove:mockup-command";
      action: "stopAutoScroll";
    };

type MockupStopLabel =
  | "hero"
  | "letter"
  | "music"
  | "memory-title"
  | "memory-photo"
  | "memory-end"
  | "ending"
  | "return-hero";

type MockupScrollStop = {
  top: number;
  duration: number;
  label: MockupStopLabel;
  behavior?: ScrollBehavior;
};

type MockupStats = {
  totalStops: number;
  letterStops: number;
  musicStops: number;
  memoryPhotos: number;
  memoryEndShown: boolean;
  endingStops: number;
  currentLabel?: MockupStopLabel;
  currentTop?: number;
};

declare global {
  interface Window {
    __memoloveMockupStats?: MockupStats;
  }
}

const MOCKUP_SCENES = new Set<MockupSceneName>(["hero", "letter", "music", "memory", "ending"]);

function isMockupSceneName(value: unknown): value is MockupSceneName {
  return typeof value === "string" && MOCKUP_SCENES.has(value as MockupSceneName);
}

function isMockupScrollMessage(value: unknown): value is MockupScrollMessage {
  if (typeof value !== "object" || value === null) return false;
  const data = value as { type?: unknown; action?: unknown };
  if (data.type !== "memolove:mockup-command") return false;
  return data.action === "startAutoScroll" || data.action === "stopAutoScroll";
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
  const mockupAutoActiveRef = useRef(false);

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
    if (!ready || !memory) return;
    if (typeof window === "undefined") return;

    const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

    const waitForJob = async (ms: number, jobId: number) => {
      const startedAt = performance.now();
      while (mockupScrollJobRef.current === jobId && performance.now() - startedAt < ms) {
        await wait(Math.min(120, ms));
      }
    };

    const muteMedia = () => {
      document.querySelectorAll<HTMLMediaElement>("audio,video").forEach((media) => {
        media.muted = true;
        try { media.pause(); } catch {}
      });
    };

    const getScroller = (): HTMLElement =>
      (document.scrollingElement as HTMLElement) || document.documentElement;

    const getMaxScroll = () => {
      const scroller = getScroller();
      return Math.max(0, scroller.scrollHeight - window.innerHeight);
    };

    const scrollInternalTo = (top: number, behavior: ScrollBehavior = "smooth") => {
      const scroller = getScroller();
      const clamped = Math.max(0, Math.min(top, getMaxScroll()));
      try {
        scroller.scrollTo({ top: clamped, behavior });
      } catch {
        scroller.scrollTop = clamped;
      }
    };

    const getElementTop = (element: HTMLElement) => {
      const scroller = getScroller();
      return element.getBoundingClientRect().top + scroller.scrollTop;
    };

    const appendStop = (stops: MockupScrollStop[], stop: MockupScrollStop) => {
      const clampedTop = Math.max(0, Math.min(stop.top, getMaxScroll()));
      const previous = stops[stops.length - 1];
      if (previous && Math.abs(previous.top - clampedTop) < 24 && previous.label === stop.label) {
        previous.duration = Math.max(previous.duration, stop.duration);
        return;
      }
      stops.push({ ...stop, top: clampedTop });
    };

    const createSceneStops = (
      element: HTMLElement,
      label: MockupStopLabel,
      duration = 2_200,
    ) => {
      const viewport = window.innerHeight;
      const top = getElementTop(element);
      const height = element.scrollHeight;
      const bottom = top + height;
      const stops: MockupScrollStop[] = [];

      for (let position = top; position < bottom - viewport; position += viewport * 0.55) {
        appendStop(stops, { top: position, duration, label });
      }

      appendStop(stops, {
        top: Math.max(top, bottom - viewport),
        duration,
        label,
      });

      return stops;
    };

    const waitForImagesAndFonts = async () => {
      const fontReady = document.fonts?.ready?.catch(() => undefined) ?? Promise.resolve();
      const imageReady = Promise.all(
        Array.from(document.images).map((image) => {
          if (image.complete) return Promise.resolve();
          if (typeof image.decode === "function") return image.decode().catch(() => undefined);
          return new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          });
        }),
      );

      await Promise.race([
        Promise.all([fontReady, imageReady]),
        wait(4_000),
      ]);
    };

    const buildScrollStops = (): MockupScrollStop[] => {
      const stops: MockupScrollStop[] = [];
      const hero = document.querySelector<HTMLElement>('[data-memolove-scene="hero"]');
      const letter = document.querySelector<HTMLElement>('[data-memolove-scene="letter"]');
      const music = document.querySelector<HTMLElement>('[data-memolove-scene="music"]');
      const memory = document.querySelector<HTMLElement>('[data-memolove-scene="memory"]');
      const ending = document.querySelector<HTMLElement>('[data-memolove-scene="ending"]');

      appendStop(stops, { top: hero ? getElementTop(hero) : 0, duration: 3_000, label: "hero", behavior: "auto" });

      if (letter) {
        createSceneStops(letter, "letter", 2_250).forEach((stop) => appendStop(stops, stop));
      }

      if (music) {
        createSceneStops(music, "music", 2_200).forEach((stop) => appendStop(stops, stop));
        const player = music.querySelector<HTMLElement>(".ms-cover-wrap, audio");
        if (player) {
          const centeredTop = getElementTop(player) - Math.max(0, (window.innerHeight - player.offsetHeight) / 2);
          appendStop(stops, { top: centeredTop, duration: 2_300, label: "music" });
        }
      }

      if (memory) {
        appendStop(stops, { top: getElementTop(memory), duration: 2_300, label: "memory-title" });
        const photos = Array.from(
          document.querySelectorAll<HTMLElement>("[data-memolove-memory-index], [data-memolove-memory-photo]"),
        );
        photos.forEach((photo) => {
          const photoTop = getElementTop(photo);
          const centeredTop = photoTop - Math.max(0, (window.innerHeight - photo.offsetHeight) / 2);
          appendStop(stops, { top: centeredTop, duration: 2_250, label: "memory-photo" });
        });

        const memoryBottom = getElementTop(memory) + memory.scrollHeight;
        appendStop(stops, {
          top: Math.max(getElementTop(memory), memoryBottom - window.innerHeight),
          duration: 2_500,
          label: "memory-end",
        });
      }

      if (ending) {
        createSceneStops(ending, "ending", 3_000).forEach((stop) => appendStop(stops, stop));
        const endingInner = ending.querySelector<HTMLElement>(".es-inner");
        if (endingInner) {
          const centeredTop = getElementTop(endingInner) - Math.max(0, (window.innerHeight - endingInner.offsetHeight) / 2);
          appendStop(stops, { top: centeredTop, duration: 3_000, label: "ending" });
        }
      }

      appendStop(stops, { top: 0, duration: 3_000, label: "return-hero" });

      return stops.sort((a, b) => {
        if (a.label === "return-hero") return 1;
        if (b.label === "return-hero") return -1;
        return a.top - b.top;
      });
    };

    const publishStats = (stops: MockupScrollStop[], current?: MockupScrollStop) => {
      const stats: MockupStats = {
        totalStops: stops.length,
        letterStops: stops.filter((stop) => stop.label === "letter").length,
        musicStops: stops.filter((stop) => stop.label === "music").length,
        memoryPhotos: document.querySelectorAll<HTMLElement>("[data-memolove-memory-index], [data-memolove-memory-photo]").length,
        memoryEndShown: stops.some((stop) => stop.label === "memory-end"),
        endingStops: stops.filter((stop) => stop.label === "ending").length,
        currentLabel: current?.label,
        currentTop: current?.top,
      };
      window.__memoloveMockupStats = stats;
      if (window.parent !== window) {
        window.parent.postMessage({ type: "memolove:mockup-stats", stats }, window.location.origin);
      }
    };

    const runAutoScroll = async (jobId: number) => {
      mockupAutoActiveRef.current = true;
      muteMedia();
      await waitForImagesAndFonts();

      while (mockupScrollJobRef.current === jobId) {
        const stops = buildScrollStops();
        publishStats(stops);

        for (const stop of stops) {
          if (mockupScrollJobRef.current !== jobId) return;
          muteMedia();
          publishStats(stops, stop);
          scrollInternalTo(stop.top, stop.behavior ?? "smooth");
          await waitForJob(stop.duration, jobId);
        }
      }
    };

    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin) return;
      if (!isMockupScrollMessage(event.data)) return;

      if (event.data.action === "stopAutoScroll") {
        mockupScrollJobRef.current += 1;
        mockupAutoActiveRef.current = false;
        return;
      }

      if (mockupAutoActiveRef.current) return;
      const jobId = mockupScrollJobRef.current + 1;
      mockupScrollJobRef.current = jobId;
      void runAutoScroll(jobId).finally(() => {
        if (mockupScrollJobRef.current === jobId) mockupAutoActiveRef.current = false;
      });
    };

    window.addEventListener("message", onMessage);

    return () => {
      mockupScrollJobRef.current += 1;
      window.removeEventListener("message", onMessage);
    };
  }, [ready, memory]);

  // Modo mockup: adiciona classe raiz e desativa foco automático de cenas
  // para não induzir rolagem nos ancestrais (nem no iframe pai).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMockup = new URLSearchParams(window.location.search).get("mockup") === "true";
    if (!isMockup) return;
    document.documentElement.classList.add("is-mockup");
    return () => { document.documentElement.classList.remove("is-mockup"); };
  }, []);

  useEffect(() => {
    if (!ready || !memory || !heroReady) return;
    if (typeof window === "undefined" || window.parent === window) return;

    let cancelled = false;
    let sent = 0;
    const requiredScenes: MockupSceneName[] = ["hero", "letter", "music", "memory", "ending"];

    const allScenesExist = () =>
      requiredScenes.every((scene) => document.querySelector(`[data-memolove-scene="${scene}"]`));

    const announceWhenReady = () => {
      if (cancelled) return;
      if (allScenesExist()) {
        window.parent.postMessage({ type: "memolove:mockup-ready", slug: memory.slug }, window.location.origin);
        sent += 1;
        if (sent >= 8) return;
        window.setTimeout(announceWhenReady, 500);
        return;
      }
      window.setTimeout(announceWhenReady, 250);
    };

    announceWhenReady();

    return () => {
      cancelled = true;
    };
  }, [ready, memory, heroReady, photos]);

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
      <style>{`
        html.is-mockup,
        html.is-mockup body {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        html.is-mockup::-webkit-scrollbar,
        html.is-mockup body::-webkit-scrollbar { display: none; }
      `}</style>
      {heroReady ? (
        <HeroScene name={name} photo={hero} cinematicPhoto={cinematicUrl} ready={openingDone} />
      ) : (
        <section
          aria-hidden
          data-memolove-scene="hero"
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
