import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";

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

      const heroPath = mem.hero_image_cinematic || mem.hero_selected_photo_path;
      const heroUrl = heroPath ? await signStoragePath(heroPath) : "";

      const rawsAll = (photoRows ?? []).map((r) => r.photo_url).filter(Boolean);
      const memoryRaws = rawsAll.slice(0, 3);
      const memoryPhotos = await Promise.all(memoryRaws.map((r) => signStoragePath(r)));

      // Music background: prefer a photo that is NEITHER in the memories
      // shown here NOR the same as the Hero image, so the scene feels
      // like its own contemplative frame.
      const memorySet = new Set(memoryRaws);
      const musicRaw =
        rawsAll.find((r, i) => i >= 3 && !memorySet.has(r)) ||
        rawsAll[rawsAll.length - 1] ||
        null;
      let musicBg = musicRaw ? await signStoragePath(musicRaw) : "";
      if (!musicBg || musicBg === heroUrl) {
        const altRaw = mem.hero_selected_photo_path && mem.hero_selected_photo_path !== heroPath
          ? mem.hero_selected_photo_path
          : null;
        if (altRaw) musicBg = await signStoragePath(altRaw);
      }
      if (!musicBg) musicBg = heroUrl || "";

      if (cancelled) return;
      setData({
        senderName: mem.sender_name || "Sofia",
        message: mem.message || "",
        musicTitle: mem.music_title || "Nossa canção",
        musicArtist: mem.music_artist || "",
        musicCover: mem.music_cover || heroUrl || null,
        musicBg,
        heroUrl: heroUrl || memoryPhotos[0] || null,
        photos: memoryPhotos.filter(Boolean),
      });
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

export default function MiniHomenagem() {
  const { data, ready } = useDemoData();
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  const scenes: Scene[] = useMemo(() => {
    const memoryCount = Math.min(3, data?.photos.length ?? 0);
    const arr: Scene[] = [
      { key: "hero", duration: 4000 },
      { key: "letter", duration: 5000 },
      { key: "music", duration: 3500 },
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

  // pause when out of viewport / tab hidden
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

  useEffect(() => {
    if (!ready || !visible || scenes.length === 0) return;
    const t = window.setTimeout(() => {
      setActive((i) => (i + 1) % scenes.length);
    }, scenes[active % scenes.length].duration);
    return () => window.clearTimeout(t);
  }, [active, ready, visible, scenes]);

  return (
    <div ref={rootRef} className="phone-screen" style={styles.screen}>
      <style>{CSS}</style>
      <div className="landing-tribute-demo">
        {scenes.map((scene, i) => {
          const state = i === active ? "active" : i < active ? "past" : "future";
          return (
            <div
              key={`${scene.key}-${scene.index ?? 0}-${i}`}
              className={`demo-scene demo-scene--${state} demo-scene--${scene.key}`}
              aria-hidden={i !== active}
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
  const src = data?.heroUrl || "";
  return (
    <div className="hero-demo">
      {src && <img className="hero-demo__img" src={src} alt="" aria-hidden />}
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
  const bg = data?.musicBg || data?.heroUrl || data?.musicCover || "";
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
          <p className="music-demo__headline">
            Toda história merece<br />uma trilha.
          </p>
        </div>

        <div className="music-demo__meta">
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
    position: absolute; inset: -3%; width: 106%; height: 106%;
    object-fit: cover;
    filter: blur(2px) brightness(0.5) saturate(0.95) contrast(1.05);
    animation: musicBgDrift 9s ease-out both;
  }
  @keyframes musicBgDrift {
    from { transform: scale(1); }
    to { transform: scale(1.04); }
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
    animation: musicFadeIn 900ms 100ms ease-out both;
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
    animation: musicFadeIn 900ms 260ms ease-out both;
  }
  .music-demo__meta {
    display: flex; flex-direction: column; align-items: center; gap: 10px;
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
  }
  .music-demo__artist {
    margin: 0;
    font-size: 10px;
    letter-spacing: 0.42em;
    text-transform: uppercase;
    color: rgba(216, 181, 103, 0.72);
  }
  .music-demo__player {
    width: 78%;
    max-width: 260px;
    display: flex; flex-direction: column; align-items: center; gap: 16px;
    animation: musicFadeIn 900ms 720ms ease-out both;
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
    animation: musicProgress 3.8s ease-out both;
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
    animation: musicDot 3.8s ease-out both;
  }
  @keyframes musicProgress { from { width: 0%; } to { width: 55%; } }
  @keyframes musicDot { from { left: 0%; } to { left: 55%; } }
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
    animation: memoryFadeIn 800ms 200ms ease-out both;
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
    animation: memoryFadeIn 900ms 320ms ease-out both;
  }
  @keyframes memoryFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

`;
