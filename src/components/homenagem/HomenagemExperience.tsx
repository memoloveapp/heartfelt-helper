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

export function HomenagemExperience({
  slug,
  preview = false,
  landingDemo = false,
}: {
  slug: string;
  preview?: boolean;
  landingDemo?: boolean;
}) {
  const { memory, photos, ready, err } = useMemoryData(slug);
  const [openingDone, setOpeningDone] = useState(false);
  const [cinematicUrl, setCinematicUrl] = useState<string | null>(null);
  const [selectedHeroUrl, setSelectedHeroUrl] = useState<string | null>(null);
  const [heroReady, setHeroReady] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);
  const [scrollerEl, setScrollerEl] = useState<HTMLElement | null>(null);

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

  // Auto-scroll interno controlado — usado apenas no modo landing-demo.
  useEffect(() => {
    if (!landingDemo) return;
    if (!ready || !memory || !heroReady) return;
    if (typeof window === "undefined") return;
    const scroller = scrollerEl;
    if (!scroller) return;

    let cancelled = false;
    let raf = 0;
    let timer: number | null = null;
    let paused = false;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        if (cancelled) return resolve();
        timer = window.setTimeout(() => {
          timer = null;
          resolve();
        }, ms);
      });

    const waitUntilVisibleAndActive = async () => {
      while (!cancelled && (paused || document.visibilityState === "hidden")) {
        await new Promise<void>((r) => (timer = window.setTimeout(() => r(), 250)));
      }
    };

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animateScrollTo = (target: number, duration: number) =>
      new Promise<void>((resolve) => {
        if (cancelled) return resolve();
        const start = scroller.scrollTop;
        const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        const end = Math.max(0, Math.min(target, max));
        const distance = end - start;
        if (Math.abs(distance) < 1 || duration <= 0) {
          scroller.scrollTop = end;
          return resolve();
        }
        const startedAt = performance.now();
        const step = (now: number) => {
          if (cancelled) return resolve();
          const elapsed = now - startedAt;
          const t = Math.min(1, elapsed / duration);
          scroller.scrollTop = start + distance * easeInOutCubic(t);
          if (t < 1) {
            raf = requestAnimationFrame(step);
          } else {
            resolve();
          }
        };
        raf = requestAnimationFrame(step);
      });

    const q = <T extends HTMLElement>(sel: string) =>
      scroller.querySelector<T>(sel);
    const qAll = <T extends HTMLElement>(sel: string) =>
      Array.from(scroller.querySelectorAll<T>(sel));

    const topOf = (el: HTMLElement) => el.offsetTop;
    const centerOf = (el: HTMLElement) =>
      Math.max(0, el.offsetTop - Math.max(0, (scroller.clientHeight - el.offsetHeight) / 2));

    const waitForImagesAndFonts = async () => {
      const fontReady = (document as any).fonts?.ready?.catch(() => undefined) ?? Promise.resolve();
      const imgs = Array.from(scroller.querySelectorAll("img"));
      const imageReady = Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((r) => {
            img.addEventListener("load", () => r(), { once: true });
            img.addEventListener("error", () => r(), { once: true });
          });
        }),
      );
      await Promise.race([Promise.all([fontReady, imageReady]), wait(4_000)]);
    };

    const buildStops = (): Array<{ top: number; pause: number; travel: number }> => {
      const stops: Array<{ top: number; pause: number; travel: number }> = [];
      const push = (top: number, pause: number, travel: number) =>
        stops.push({ top: Math.max(0, top), pause, travel });

      const hero = q<HTMLElement>('[data-memolove-scene="hero"]');
      const letter = q<HTMLElement>('[data-memolove-scene="letter"]');
      const music = q<HTMLElement>('[data-memolove-scene="music"]');
      const memoryEl = q<HTMLElement>('[data-memolove-scene="memory"]');
      const ending = q<HTMLElement>('[data-memolove-scene="ending"]');
      const viewport = scroller.clientHeight;

      push(hero ? topOf(hero) : 0, 3000, 1200);

      if (letter) {
        const start = topOf(letter);
        const height = letter.scrollHeight;
        const bottom = start + height;
        // início da carta
        push(start, 2200, 2200);
        // conteúdo intermediário
        for (let p = start + viewport * 0.6; p < bottom - viewport; p += viewport * 0.55) {
          push(p, 1800, 2400);
        }
        // final da carta / assinatura
        push(Math.max(start, bottom - viewport), 2400, 2200);
      }

      if (music) {
        const cover = music.querySelector<HTMLElement>(".ms-cover-wrap") ?? music;
        push(centerOf(cover), 3200, 2400);
      }

      if (memoryEl) {
        push(topOf(memoryEl), 2200, 2200);
        const photos = qAll<HTMLElement>("[data-memolove-memory-index], [data-memolove-memory-photo]");
        photos.forEach((photo) => {
          push(centerOf(photo), 2200, 2000);
        });
        const memoryBottom = topOf(memoryEl) + memoryEl.scrollHeight;
        push(Math.max(topOf(memoryEl), memoryBottom - viewport), 2400, 2000);
      }

      if (ending) {
        const inner = ending.querySelector<HTMLElement>(".es-inner") ?? ending;
        push(centerOf(inner), 3200, 2600);
      }

      // retorno suave ao Hero
      push(0, 2000, 3500);

      return stops;
    };

    const onVisibility = () => {
      paused = document.visibilityState === "hidden";
    };
    document.addEventListener("visibilitychange", onVisibility);

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) paused = !e.isIntersecting;
      },
      { threshold: 0.15 },
    );
    io.observe(scroller);

    const run = async () => {
      await waitForImagesAndFonts();
      // pequeno delay para hero terminar de aparecer
      await wait(800);
      while (!cancelled) {
        const stops = buildStops();
        for (const stop of stops) {
          if (cancelled) return;
          await waitUntilVisibleAndActive();
          await animateScrollTo(stop.top, stop.travel);
          if (cancelled) return;
          await wait(stop.pause);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
    };
  }, [landingDemo, ready, memory, heroReady, scrollerEl, photos]);


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

  const mainStyle: React.CSSProperties = landingDemo
    ? {
        background: PAPER,
        color: INK,
        overflowX: "hidden",
        overflowY: "auto",
        width: "100%",
        height: "100%",
        overscrollBehavior: "contain",
      }
    : { background: PAPER, color: INK, overflowX: "hidden" };

  return (
    <main
      ref={(node) => {
        mainRef.current = node;
        if (landingDemo) setScrollerEl(node);
      }}
      className={`homenagem-page${landingDemo ? " homenagem-experience--landing-demo" : ""}`}
      style={mainStyle}
    >
      {landingDemo && (
        <style>{`
          .homenagem-experience--landing-demo { scrollbar-width: none; -ms-overflow-style: none; }
          .homenagem-experience--landing-demo::-webkit-scrollbar { display: none; }
          .homenagem-experience--landing-demo .hero-scene { height: 844px; min-height: 844px; }
          .homenagem-experience--landing-demo .letter-scene,
          .homenagem-experience--landing-demo .music-scene,
          .homenagem-experience--landing-demo .es-scene { min-height: 844px; }
        `}</style>
      )}
      {heroReady ? (
        <HeroScene
          name={name}
          photo={hero}
          cinematicPhoto={cinematicUrl}
          ready={openingDone}
          scrollElement={landingDemo ? scrollerEl : undefined}
        />
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
