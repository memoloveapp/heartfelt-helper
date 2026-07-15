import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";

const HERO_CACHE_KEY = "memolove:landing-demo:hero-url:v1";



/**
 * LandingTributeDemo — demonstração exclusiva para a Landing.
 * Usa dados reais da homenagem oficial (06ab45c269) mas não renderiza a
 * página completa. Cenas fullscreen com crossfade, sem scroll, sem iframe.
 */

const DEMO_SLUG = "06ab45c269";
const BUCKET = "memory-photos";

type DemoData = {
  senderName: string;
  message: string;
  musicTitle: string;
  musicArtist: string;
  musicCover: string | null;
  musicBg: string | null;
  heroUrl: string | null;
  photos: string[];
};

function toBucketPath(raw: string): string | null {
  if (!raw) return null;
  const pub = `/object/public/${BUCKET}/`;
  const sign = `/object/sign/${BUCKET}/`;
  if (raw.includes(pub)) return raw.split(pub)[1].split("?")[0];
  if (raw.includes(sign)) return raw.split(sign)[1].split("?")[0];
  return raw.replace(/^\/+/, "").replace(new RegExp(`^${BUCKET}/`), "");
}

async function signStoragePath(path: string): Promise<string> {
  if (!path) return "";
  if (path.startsWith("http") && !path.includes("/object/")) return path;
  const clean = toBucketPath(path) || path;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(clean, 3600);
  return data?.signedUrl ?? "";
}

function useDemoData(): { data: DemoData | null; ready: boolean } {
  const [data, setData] = useState<DemoData | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: list } = await supabase
        .from("memories")
        .select("id, sender_name, message, music_title, music_artist, music_cover, hero_image_cinematic, hero_selected_photo_path")
        .eq("slug", DEMO_SLUG)
        .limit(1);
      const mem = list?.[0];
      if (!mem) {
        if (!cancelled) setReady(true);
        return;
      }

      const { data: photoRows } = await supabase
        .from("memory_photos")
        .select("photo_url, position")
        .eq("memory_id", mem.id)
        .order("position", { ascending: true });

      const heroPath = mem.hero_image_cinematic || mem.hero_selected_photo_path || "";
      const heroUrl = heroPath ? await signStoragePath(heroPath) : "";

      const rawsAll = (photoRows ?? []).map((r) => r.photo_url).filter(Boolean);

      // Reserve four independent visual sets: Hero, Music, Memories, (Letter has none).
      // No important photo may appear twice. Exclude every known hero path from
      // both Music and Memories candidate pools.
      const heroKeys = new Set(
        [mem.hero_image_cinematic, mem.hero_selected_photo_path, heroPath].filter(Boolean) as string[]
      );
      const nonHeroRaws = rawsAll.filter((r) => !heroKeys.has(r));

      // Music: pick the LAST non-hero photo (least likely to overlap the first 3 memories).
      const musicRaw = nonHeroRaws.length > 0 ? nonHeroRaws[nonHeroRaws.length - 1] : null;

      // Memories: first 3 non-hero photos, excluding the one reserved for Music.
      const memoryRaws = nonHeroRaws.filter((r) => r !== musicRaw).slice(0, 3);
      const memoryPhotos = await Promise.all(memoryRaws.map((r) => signStoragePath(r)));

      let musicBg = musicRaw ? await signStoragePath(musicRaw) : "";
      // Final guard: if signed URLs somehow collide with the Hero URL, drop it.
      if (musicBg && heroUrl && musicBg === heroUrl) musicBg = "";

      if (cancelled) return;
      setData({
        senderName: mem.sender_name || "Sofia",
        message: mem.message || "",
        musicTitle: mem.music_title || "Nossa canção",
        musicArtist: mem.music_artist || "",
        musicCover: mem.music_cover || null,
        musicBg: musicBg || null,
        heroUrl: heroUrl || memoryPhotos[0] || null,
        photos: memoryPhotos.filter(Boolean),
      });
      if (heroUrl) {
        try { window.localStorage.setItem(HERO_CACHE_KEY, heroUrl); } catch {}
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, ready };
}

function excerptFromMessage(message: string): string {
  const clean = message.replace(/\s+/g, " ").trim();
  if (!clean) {
    return "Nem sempre percebemos, no momento em que vivemos, que estamos criando lembranças para a vida inteira.";
  }
  // pega até 220 caracteres em um limite de frase
  const cap = 220;
  if (clean.length <= cap) return clean;
  const slice = clean.slice(0, cap);
  const lastPunct = Math.max(slice.lastIndexOf("."), slice.lastIndexOf("!"), slice.lastIndexOf("?"));
  return (lastPunct > 120 ? slice.slice(0, lastPunct + 1) : slice.trimEnd() + "…");
}

type SceneKey = "hero" | "letter" | "music" | "memory";

type Scene = {
  key: SceneKey;
  duration: number;
  index?: number; // for memory
};

const SWIPE_THRESHOLD = 45;
const AUTOPLAY_RESUME_MS = 6000;
const MAX_DRAG_VISUAL = 26;
const TRANSITION_MS = 380;
const HINT_DISMISS_KEY = "memolove:landing-demo:swipe-hint-dismissed:v1";

export default function MiniHomenagem() {
  const { data, ready } = useDemoData();
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dragX, setDragX] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem(HINT_DISMISS_KEY) === "1"; } catch { return false; }
  });
  const [showHint, setShowHint] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pauseUntilRef = useRef<number>(0);
  const pointerRef = useRef<{
    id: number; x: number; y: number; startX: number; startY: number;
    active: boolean; locked: null | "h" | "v"; startedAt: number;
  } | null>(null);

  const scenes: Scene[] = useMemo(() => {
    const memoryCount = Math.min(3, data?.photos.length ?? 0);
    const arr: Scene[] = [
      { key: "hero", duration: 4000 },
      { key: "letter", duration: 5000 },
      { key: "music", duration: 5200 },
    ];
    for (let i = 0; i < memoryCount; i++) {
      const isLast = i === memoryCount - 1;
      arr.push({ key: "memory", index: i, duration: isLast ? 3200 : 2500 });
    }
    return arr;
  }, [data]);

  const memoryCaptions = [
    "Existem abraços que o tempo nunca consegue levar.",
    "O amor também mora nas risadas mais simples.",
    "Alguns momentos se tornam parte de quem somos.",
  ];

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    io.observe(el);
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Autoplay
  useEffect(() => {
    if (!ready || !visible || scenes.length === 0 || isTransitioning) return;
    const now = Date.now();
    const wait = Math.max(
      scenes[active % scenes.length].duration,
      pauseUntilRef.current - now,
    );
    const t = window.setTimeout(() => {
      setActive((i) => (i + 1) % scenes.length);
    }, wait);
    return () => window.clearTimeout(t);
  }, [active, ready, visible, scenes, isTransitioning]);

  // Show hint on first hero visit
  useEffect(() => {
    if (hasInteracted) return;
    if (!ready || !visible) return;
    if (scenes[active]?.key !== "hero") return;
    setShowHint(true);
    const t = window.setTimeout(() => setShowHint(false), 3500);
    return () => window.clearTimeout(t);
  }, [active, ready, visible, scenes, hasInteracted]);

  const goTo = (delta: number) => {
    if (isTransitioning || scenes.length === 0) return;
    pauseUntilRef.current = Date.now() + AUTOPLAY_RESUME_MS;
    setIsTransitioning(true);
    setActive((i) => (i + delta + scenes.length) % scenes.length);
    window.setTimeout(() => setIsTransitioning(false), TRANSITION_MS);
    if (!hasInteracted) {
      setHasInteracted(true);
      setShowHint(false);
      try { window.localStorage.setItem(HINT_DISMISS_KEY, "1"); } catch {}
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isTransitioning) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerRef.current = {
      id: e.pointerId, x: e.clientX, y: e.clientY,
      startX: e.clientX, startY: e.clientY,
      active: true, locked: null, startedAt: Date.now(),
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pointerRef.current;
    if (!p || !p.active || p.id !== e.pointerId) return;
    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;
    if (p.locked === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      // Lock direction: horizontal only when clearly horizontal
      if (Math.abs(dx) > Math.abs(dy) * 1.2) {
        p.locked = "h";
        try { (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId); } catch {}
      } else {
        p.locked = "v";
        p.active = false;
        return;
      }
    }
    if (p.locked === "h") {
      // subtle visual drag
      const clamped = Math.max(-MAX_DRAG_VISUAL, Math.min(MAX_DRAG_VISUAL, dx * 0.35));
      setDragX(clamped);
    }
  };

  const finishPointer = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const p = pointerRef.current;
    if (!p || p.id !== e.pointerId) return;
    pointerRef.current = null;
    if (!p.active || p.locked !== "h" || cancelled) {
      setDragX(0);
      return;
    }
    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;
    const dt = Math.max(1, Date.now() - p.startedAt);
    const velocity = Math.abs(dx) / dt; // px/ms
    const isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.2;
    setDragX(0);
    if (isHorizontal && (Math.abs(dx) >= SWIPE_THRESHOLD || velocity > 0.6)) {
      goTo(dx < 0 ? 1 : -1);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(-1); }
  };

  return (
    <div
      ref={rootRef}
      className="phone-screen"
      style={styles.screen}
      tabIndex={0}
      role="group"
      aria-label="Demonstração da homenagem. Use as setas do teclado ou arraste para navegar."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => finishPointer(e, false)}
      onPointerCancel={(e) => finishPointer(e, true)}
      onKeyDown={onKeyDown}
    >
      <style>{CSS}</style>
      <div className="landing-tribute-demo" style={{ touchAction: "pan-y" }}>
        {scenes.map((scene, i) => {
          const state = i === active ? "active" : i < active ? "past" : "future";
          const isActive = i === active;
          const sceneStyle: CSSProperties = isActive
            ? { transform: `translate3d(${dragX}px, 0, 0) scale(1)`, transition: dragX === 0 ? undefined : "transform 0ms" }
            : {};
          return (
            <div
              key={`${scene.key}-${scene.index ?? 0}-${i}`}
              className={`demo-scene demo-scene--${state} demo-scene--${scene.key}`}
              aria-hidden={i !== active}
              style={sceneStyle}
            >
              {renderScene(scene, data, memoryCaptions)}
            </div>
          );
        })}

        <div className="demo-progress" aria-hidden>
          {scenes.map((_, i) => (
            <span
              key={i}
              className={`demo-progress__bar${i === active ? " is-active" : ""}${i < active ? " is-past" : ""}`}
            />
          ))}
        </div>

        {showHint && (
          <div className="demo-hint" aria-hidden>
            <span className="demo-hint__arrow">‹</span>
            <span className="demo-hint__text">Deslize para explorar</span>
            <span className="demo-hint__arrow">›</span>
          </div>
        )}
      </div>
    </div>
  );
}

function renderScene(scene: Scene, data: DemoData | null, captions: string[]) {
  switch (scene.key) {
    case "hero":
      return <HeroDemo data={data} />;
    case "letter":
      return <LetterDemo data={data} />;
    case "music":
      return <MusicDemo data={data} />;
    case "memory":
      return <MemoryDemo data={data} index={scene.index ?? 0} caption={captions[scene.index ?? 0] ?? ""} />;
  }
}

function HeroDemo({ data }: { data: DemoData | null }) {
  // Poster = URL do Hero real cacheada de uma execução anterior (mesma fonte).
  // Assim não mostramos nunca uma fotografia diferente da oficial.
  const [cachedPoster] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try { return window.localStorage.getItem(HERO_CACHE_KEY) || ""; } catch { return ""; }
  });
  const remote = data?.heroUrl || "";
  const [remoteReady, setRemoteReady] = useState(false);
  // Se o remoto ainda não chegou, mas temos o poster cacheado (mesma imagem),
  // ele já é visualmente idêntico ao Hero real.
  const showPoster = !!cachedPoster && !remoteReady;
  return (
    <div className="hero-demo">
      {cachedPoster && (
        <img
          className="hero-demo__img hero-demo__img--poster"
          src={cachedPoster}
          alt=""
          aria-hidden
          loading="eager"
          fetchPriority="high"
          decoding="async"
          style={{ opacity: showPoster ? 1 : 0, transition: "opacity 200ms ease" }}
        />
      )}
      {remote && (
        <img
          className="hero-demo__img"
          src={remote}
          alt=""
          aria-hidden
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onLoad={() => setRemoteReady(true)}
          onError={() => setRemoteReady(false)}
          style={{ opacity: remoteReady ? 1 : 0, transition: "opacity 200ms ease" }}
        />
      )}

      <div className="hero-demo__grad" />
      <div className="hero-demo__vignette" />
      <div className="hero-demo__content">
        <p className="hero-demo__eyebrow">PARA O MEU</p>
        <h2 className="hero-demo__name">Pai.</h2>
        <div className="hero-demo__rule" aria-hidden>
          <span />
          <span className="hero-demo__heart">♥</span>
          <span />
        </div>
        <p className="hero-demo__sub">
          Algumas histórias merecem
          <br />ser lembradas para sempre.
        </p>
      </div>
    </div>
  );
}


function LetterDemo({ data }: { data: DemoData | null }) {
  const excerpt = excerptFromMessage(data?.message ?? "");
  const sender = data?.senderName || "Sofia";
  return (
    <div className="letter-demo">
      <div className="letter-demo__paper">
        <p className="letter-demo__eyebrow">UMA CARTA PARA VOCÊ</p>
        <div className="letter-demo__rule" aria-hidden />
        <p className="letter-demo__text">{excerpt}</p>
        <p className="letter-demo__signature">Com amor,<br /><span>{sender}</span></p>
      </div>
    </div>
  );
}

function MusicDemo({ data }: { data: DemoData | null }) {
  const bg = data?.musicBg || "";
  const title = data?.musicTitle || "Nossa canção";
  const artist = data?.musicArtist || "";
  return (
    <div className="music-demo">
      {bg && <img className="music-demo__bg" src={bg} alt="" aria-hidden />}
      <div className="music-demo__overlay" />
      <div className="music-demo__vignette" />
      <div className="music-demo__content">
        <div className="music-demo__top">
          <div className="music-demo__note" aria-hidden>♪♪</div>
        </div>


        <div className="music-demo__meta">
          <p className="music-demo__caption">
            Porque algumas lembranças<br />também podem ser ouvidas.
          </p>
          <h3 className="music-demo__title">{title}</h3>
          {artist && <p className="music-demo__artist">{artist}</p>}
        </div>

        <div className="music-demo__player" aria-hidden>
          <div className="music-demo__track">
            <span className="music-demo__track-fill" />
            <span className="music-demo__track-dot" />
          </div>
          <button type="button" className="music-demo__play" aria-label="Prévia da música">
            <svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function MemoryDemo({ data, index, caption }: { data: DemoData | null; index: number; caption: string }) {
  const photo = data?.photos[index] || "";
  return (
    <div className="memory-demo">
      {photo && <img className="memory-demo__img" src={photo} alt="" aria-hidden />}
      <div className="memory-demo__caption-grad" />
      <div className="memory-demo__caption">
        <span className="memory-demo__accent" aria-hidden />
        <p className="memory-demo__text">{caption}</p>
      </div>
    </div>
  );
}


const styles = {
  screen: {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    background: "#0a0806",
    borderRadius: "inherit",
  } as CSSProperties,
};

const CSS = `
  .phone-screen * { box-sizing: border-box; }
  .landing-tribute-demo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: "Inter", system-ui, -apple-system, sans-serif;
    color: #F6EBD2;
  }
  .demo-scene {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transform: translateY(8px) scale(1.005);
    transition: opacity 900ms ease, transform 1100ms cubic-bezier(.22,1,.36,1);
    pointer-events: none;
    will-change: opacity, transform;
  }
  .demo-scene--active {
    opacity: 1;
    transform: translateY(0) scale(1);
    z-index: 2;
  }
  .demo-scene--past {
    opacity: 0;
    transform: translateY(-6px) scale(0.998);
    z-index: 1;
  }

  /* Progress bars */
  .demo-progress {
    position: absolute;
    top: clamp(8px, 2.5%, 14px);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 4px;
    z-index: 10;
  }
  .demo-progress__bar {
    display: block;
    width: clamp(14px, 4.5%, 22px);
    height: 2px;
    background: rgba(255,255,255,0.22);
    border-radius: 1px;
    transition: background 400ms ease;
  }
  .demo-progress__bar.is-past { background: rgba(239,200,106,0.45); }
  .demo-progress__bar.is-active { background: #EFC86A; box-shadow: 0 0 6px rgba(239,200,106,0.55); }

  /* Hero */
  .hero-demo { position: absolute; inset: 0; overflow: hidden; background: #060403; }
  .hero-demo__img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; object-position: center 30%;
    animation: heroDemoZoom 9s ease-out both;
  }
  @keyframes heroDemoZoom { from { transform: scale(1); } to { transform: scale(1.05); } }
  .hero-demo__grad {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 78%, rgba(4,2,1,0.92) 100%);
  }
  .hero-demo__vignette {
    position: absolute; inset: 0;
    background: radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%);
  }
  .hero-demo__content {
    position: absolute; left: 0; right: 0; bottom: 0;
    padding: 0 clamp(14px, 6%, 28px) clamp(20px, 8%, 40px);
    text-align: left;
  }
  .hero-demo__eyebrow {
    margin: 0 0 4px;
    font-size: clamp(9px, 2.4%, 11px);
    letter-spacing: 0.42em;
    color: #F0C86A;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  .hero-demo__name {
    margin: 0;
    font-family: "Cormorant Garamond", "Playfair Display", Georgia, serif;
    font-weight: 500;
    font-size: clamp(56px, 22%, 120px);
    line-height: 0.9;
    letter-spacing: -0.015em;
    color: #F6EBD2;
    text-shadow: 0 4px 24px rgba(0,0,0,0.6);
  }
  .hero-demo__rule {
    display: flex; align-items: center; gap: 8px;
    margin: 8px 0 14px;
    width: 62%;
  }
  .hero-demo__rule span:not(.hero-demo__heart) {
    flex: 1; height: 1.5px; border-radius: 1px;
    background: linear-gradient(90deg, rgba(239,200,106,0) 0%, #EFC86A 50%, rgba(239,200,106,0) 100%);
  }
  .hero-demo__heart { color: #EFC86A; font-size: clamp(10px, 3%, 14px); }
  .hero-demo__sub {
    margin: 0;
    font-family: "Cormorant Garamond", Georgia, serif;
    font-size: clamp(13px, 3.6%, 17px);
    line-height: 1.4;
    color: #F5EBD6;
    text-shadow: 0 2px 12px rgba(0,0,0,0.55);
  }

  /* Letter */
  .letter-demo {
    position: absolute; inset: 0;
    background:
      radial-gradient(120% 80% at 50% 20%, rgba(255,240,205,0.10) 0%, rgba(0,0,0,0) 60%),
      linear-gradient(180deg, #F5EDD9 0%, #EEE3C8 100%);
    display: flex; align-items: center; justify-content: center;
    padding: clamp(18px, 6%, 32px);
  }
  .letter-demo::before {
    content: "";
    position: absolute; inset: 0;
    background: radial-gradient(60% 40% at 30% 0%, rgba(255,235,190,0.35) 0%, rgba(255,235,190,0) 60%);
    pointer-events: none;
    animation: letterLightSweep 6s ease-in-out both;
  }
  @keyframes letterLightSweep {
    0% { transform: translate(-8%, -6%); opacity: 0.6; }
    100% { transform: translate(6%, 4%); opacity: 0.9; }
  }
  .letter-demo__paper {
    position: relative;
    width: 100%;
    max-width: 100%;
    text-align: center;
    color: #3B2C1E;
  }
  .letter-demo__eyebrow {
    margin: 0 0 12px;
    font-size: clamp(9px, 2.4%, 11px);
    letter-spacing: 0.42em;
    color: #A67C2F;
    font-weight: 600;
  }
  .letter-demo__rule {
    width: 44px; height: 1.5px;
    margin: 0 auto 18px;
    background: linear-gradient(90deg, rgba(166,124,47,0), #A67C2F, rgba(166,124,47,0));
  }
  .letter-demo__text {
    margin: 0 0 22px;
    font-family: "Cormorant Garamond", Georgia, serif;
    font-size: clamp(14px, 4.2%, 20px);
    line-height: 1.55;
    color: #2B2016;
    font-style: italic;
  }
  .letter-demo__signature {
    margin: 0;
    font-family: "Cormorant Garamond", Georgia, serif;
    font-size: clamp(12px, 3.4%, 15px);
    color: #4a3720;
    line-height: 1.4;
  }
  .letter-demo__signature span {
    display: inline-block;
    font-family: "Great Vibes", "Dancing Script", cursive;
    font-size: clamp(22px, 6.5%, 32px);
    color: #A67C2F;
    margin-top: 4px;
  }

  /* Music */
  .music-demo {
    position: absolute; inset: 0;
    background: #0a0806;
    overflow: hidden;
  }
  .music-demo__bg {
    position: absolute; inset: -2%; width: 104%; height: 104%;
    object-fit: cover;
    filter: brightness(0.62) saturate(0.95) contrast(1.02);
    animation: musicBgDrift 12s ease-out both;
  }
  @keyframes musicBgDrift {
    from { transform: scale(1) translateY(0); }
    to { transform: scale(1.05) translateY(-1.2%); }
  }
  .music-demo__overlay {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(10,8,6,0.35) 0%, rgba(10,8,6,0.55) 55%, rgba(10,8,6,0.75) 100%);
  }
  .music-demo__vignette {
    position: absolute; inset: 0;
    background: radial-gradient(120% 100% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%);
  }
  .music-demo__content {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    padding: clamp(38px, 12%, 64px) clamp(22px, 8%, 40px);
    text-align: center;
  }
  .music-demo__top {
    display: flex; flex-direction: column; align-items: center; gap: 14px;
  }
  .music-demo__note {
    font-size: clamp(14px, 3.8%, 18px);
    color: rgba(216, 181, 103, 0.85);
    letter-spacing: 0.2em;
    animation: musicFadeIn 900ms 400ms ease-out both;
  }
  .music-demo__headline {
    margin: 0;
    font-family: "Cormorant Garamond", Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: clamp(15px, 4.2%, 19px);
    line-height: 1.35;
    color: rgba(246,235,210,0.92);
    letter-spacing: 0.01em;
    text-shadow: 0 2px 12px rgba(0,0,0,0.55);
    animation: musicFadeIn 900ms 700ms ease-out both;
  }
  .music-demo__meta {
    display: flex; flex-direction: column; align-items: center; gap: 14px;
  }
  .music-demo__caption {
    margin: 0 auto 6px;
    max-width: 220px;
    font-family: "Cormorant Garamond", Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: 14px;
    line-height: 1.55;
    letter-spacing: 0.01em;
    color: rgba(246,235,210,0.78);
    text-shadow: 0 1px 10px rgba(0,0,0,0.55);
    text-align: center;
    animation: musicFadeIn 900ms 500ms ease-out both;
  }
  .music-demo__title {
    margin: 0;
    font-family: "Cormorant Garamond", Georgia, serif;
    font-weight: 400;
    font-size: clamp(26px, 7.5%, 34px);
    line-height: 1.05;
    letter-spacing: -0.01em;
    color: rgba(250,244,232,0.98);
    text-shadow: 0 2px 18px rgba(0,0,0,0.5);
    animation: musicFadeIn 1000ms 1100ms ease-out both;
  }
  .music-demo__artist {
    margin: 0;
    font-size: 10px;
    letter-spacing: 0.42em;
    text-transform: uppercase;
    color: rgba(216, 181, 103, 0.72);
    animation: musicFadeIn 900ms 1500ms ease-out both;
  }
  .music-demo__player {
    width: 78%;
    max-width: 260px;
    display: flex; flex-direction: column; align-items: center; gap: 16px;
    animation: musicFadeIn 900ms 1900ms ease-out both;
  }
  .music-demo__track {
    position: relative;
    width: 100%;
    height: 1px;
    background: rgba(246,235,210,0.14);
  }
  .music-demo__track-fill {
    position: absolute; inset: 0;
    background: linear-gradient(90deg, rgba(216,181,103,0.75), rgba(246,235,210,0.85));
    width: 0;
    animation: musicProgress 2.4s 2100ms ease-out both;
  }
  .music-demo__track-dot {
    position: absolute;
    top: 50%;
    left: 0;
    width: 6px; height: 6px;
    border-radius: 999px;
    background: rgba(232, 200, 130, 0.95);
    box-shadow: 0 0 6px rgba(216,181,103,0.5);
    transform: translate(-50%, -50%);
    animation: musicDot 2.4s 2100ms ease-out both;
  }
  @keyframes musicProgress { from { width: 0%; } to { width: 50%; } }
  @keyframes musicDot { from { left: 0%; } to { left: 50%; } }
  .music-demo__play {
    display: grid; place-items: center;
    width: 38px; height: 38px;
    border-radius: 999px;
    border: 1px solid rgba(210, 174, 92, 0.48);
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(6px);
    color: rgba(232, 200, 130, 0.92);
    cursor: default;
    animation: musicPlayPulse 3s ease-in-out infinite;
  }
  .music-demo__play svg {
    opacity: 0.9;
    transform: translateX(1px);
  }
  @keyframes musicFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes musicPlayPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(210, 174, 92, 0); opacity: 0.9; }
    50% { box-shadow: 0 0 0 5px rgba(210, 174, 92, 0.06); opacity: 1; }
  }

  /* Memory */
  .memory-demo { position: absolute; inset: 0; overflow: hidden; background: #0a0806; }
  .memory-demo__img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; object-position: center center;
    animation: memoryZoom 3.2s ease-out both;
  }
  @keyframes memoryZoom { from { transform: scale(1.02) translateY(0); } to { transform: scale(1.06) translateY(-6px); } }
  .memory-demo__caption-grad {
    position: absolute; left: 0; right: 0; bottom: 0;
    height: 55%;
    background: linear-gradient(to top, rgba(8,7,6,0.88) 0%, rgba(8,7,6,0.55) 40%, rgba(8,7,6,0) 100%);
    pointer-events: none;
  }
  .memory-demo__caption {
    position: absolute; left: 0; right: 0; bottom: 0;
    padding: clamp(48px, 12%, 70px) clamp(18px, 6%, 28px) clamp(20px, 5.5%, 28px);
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    text-align: center;
  }
  .memory-demo__accent {
    display: block; width: 34px; height: 1.5px;
    background: linear-gradient(90deg, rgba(239,200,106,0), #EFC86A, rgba(239,200,106,0));
    animation: memoryFadeIn 800ms 400ms ease-out both;
  }
  .memory-demo__text {
    margin: 0;
    font-family: "Cormorant Garamond", Georgia, serif;
    font-style: italic;
    font-size: clamp(15px, 4.2%, 19px);
    line-height: 1.4;
    color: #F6EBD2;
    text-shadow: 0 2px 14px rgba(0,0,0,0.6);
    max-width: 90%;
    animation: memoryFadeIn 1000ms 550ms ease-out both;
  }
  @keyframes memoryFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .phone-screen:focus { outline: none; }
  .phone-screen:focus-visible { outline: 2px solid rgba(239,200,106,0.6); outline-offset: 3px; }

  .demo-hint {
    position: absolute;
    left: 50%;
    bottom: clamp(52px, 12%, 78px);
    transform: translateX(-50%);
    display: flex; align-items: center; gap: 10px;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(8,6,4,0.42);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    color: rgba(246,235,210,0.85);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 500;
    z-index: 12;
    pointer-events: none;
    animation: demoHintFade 400ms ease-out both, demoHintNudge 2200ms ease-in-out 400ms infinite;
  }
  .demo-hint__arrow {
    font-size: 15px; line-height: 1; color: rgba(239,200,106,0.85);
  }
  @keyframes demoHintFade {
    from { opacity: 0; transform: translate(-50%, 6px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
  @keyframes demoHintNudge {
    0%,100% { transform: translate(-50%, 0); }
    50% { transform: translate(-50%, -2px); }
  }
`;
