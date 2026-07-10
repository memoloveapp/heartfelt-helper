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

      const raws = (photoRows ?? []).map((r) => r.photo_url).filter(Boolean).slice(0, 3);
      const photos = await Promise.all(raws.map((r) => signStoragePath(r)));

      if (cancelled) return;
      setData({
        senderName: mem.sender_name || "Sofia",
        message: mem.message || "",
        musicTitle: mem.music_title || "Nossa canção",
        musicArtist: mem.music_artist || "",
        musicCover: mem.music_cover || heroUrl || null,
        heroUrl: heroUrl || photos[0] || null,
        photos: photos.filter(Boolean),
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

type SceneKey = "hero" | "letter" | "music" | "memory" | "ending";

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
      { key: "letter", duration: 4200 },
      { key: "music", duration: 4000 },
    ];
    for (let i = 0; i < memoryCount; i++) arr.push({ key: "memory", index: i, duration: 3000 });
    arr.push({ key: "ending", duration: 3500 });
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
    case "ending":
      return <EndingDemo />;
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
  const cover = data?.musicCover || data?.heroUrl || "";
  const title = data?.musicTitle || "Nossa canção";
  const artist = data?.musicArtist || "";
  return (
    <div className="music-demo">
      {cover && <img className="music-demo__bg" src={cover} alt="" aria-hidden />}
      <div className="music-demo__overlay" />
      <div className="music-demo__content">
        <p className="music-demo__eyebrow">TRILHA DA HOMENAGEM</p>
        <div className="music-demo__cover-wrap">
          {cover && <img className="music-demo__cover" src={cover} alt="" aria-hidden />}
          <button type="button" className="music-demo__play" aria-label="Prévia da música">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          </button>
        </div>
        <h3 className="music-demo__title">{title}</h3>
        {artist && <p className="music-demo__artist">{artist}</p>}
        <div className="music-demo__progress" aria-hidden>
          <span />
        </div>
      </div>
    </div>
  );
}

function MemoryDemo({ data, index }: { data: DemoData | null; index: number }) {
  const photo = data?.photos[index] || "";
  const total = Math.min(3, data?.photos.length || 0);
  const label = `${String(index + 1).padStart(2, "0")} · ${String(total).padStart(2, "0")}`;
  return (
    <div className="memory-demo">
      {photo && <img className="memory-demo__img" src={photo} alt="" aria-hidden />}
      <div className="memory-demo__grad" />
      <div className="memory-demo__meta">
        <span className="memory-demo__index">{label}</span>
        <span className="memory-demo__label">Memórias</span>
      </div>
    </div>
  );
}

function EndingDemo() {
  return (
    <div className="ending-demo">
      <div className="ending-demo__glow" aria-hidden />
      <div className="ending-demo__content">
        <div className="ending-demo__heart" aria-hidden>♥</div>
        <p className="ending-demo__line">Até a próxima memória.</p>
        <p className="ending-demo__brand">MemoLove</p>
        <p className="ending-demo__cta">Crie a sua homenagem</p>
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
    animation: heroDemoZoom 6s ease-out both;
  }
  @keyframes heroDemoZoom { from { transform: scale(1); } to { transform: scale(1.045); } }
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
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; filter: blur(28px) brightness(0.55) saturate(1.1);
    transform: scale(1.15);
  }
  .music-demo__overlay {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(10,8,6,0.55) 0%, rgba(10,8,6,0.85) 100%);
  }
  .music-demo__content {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: clamp(18px, 6%, 32px);
    text-align: center;
  }
  .music-demo__eyebrow {
    margin: 0 0 clamp(14px, 5%, 22px);
    font-size: clamp(9px, 2.4%, 11px);
    letter-spacing: 0.42em;
    color: #EFC86A;
    font-weight: 500;
  }
  .music-demo__cover-wrap {
    position: relative;
    width: clamp(120px, 45%, 200px);
    aspect-ratio: 1/1;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(239,200,106,0.18);
    margin-bottom: clamp(14px, 5%, 22px);
  }
  .music-demo__cover { width: 100%; height: 100%; object-fit: cover; display: block; }
  .music-demo__play {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.28);
    color: #F6EBD2;
    border: 0;
    cursor: default;
  }
  .music-demo__play svg {
    padding: 10px;
    background: rgba(239,200,106,0.9);
    color: #1a1108;
    border-radius: 999px;
    box-shadow: 0 6px 20px rgba(239,200,106,0.35);
  }
  .music-demo__title {
    margin: 0 0 4px;
    font-family: "Cormorant Garamond", Georgia, serif;
    font-size: clamp(16px, 4.6%, 22px);
    color: #F6EBD2;
    font-weight: 500;
  }
  .music-demo__artist {
    margin: 0 0 clamp(14px, 5%, 20px);
    font-size: clamp(11px, 3%, 13px);
    color: rgba(246,235,210,0.7);
    letter-spacing: 0.06em;
  }
  .music-demo__progress {
    width: min(70%, 220px);
    height: 2px;
    background: rgba(255,255,255,0.14);
    border-radius: 1px;
    overflow: hidden;
    position: relative;
  }
  .music-demo__progress span {
    display: block; height: 100%;
    background: linear-gradient(90deg, #EFC86A, #F6EBD2);
    animation: musicProgress 3.4s ease-out both;
  }
  @keyframes musicProgress { from { width: 0%; } to { width: 72%; } }

  /* Memory */
  .memory-demo { position: absolute; inset: 0; overflow: hidden; background: #0a0806; }
  .memory-demo__img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; object-position: center center;
    animation: memoryZoom 3s ease-out both;
  }
  @keyframes memoryZoom { from { transform: scale(1.02) translateY(0); } to { transform: scale(1.06) translateY(-6px); } }
  .memory-demo__grad {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%);
  }
  .memory-demo__meta {
    position: absolute;
    left: clamp(14px, 6%, 24px);
    bottom: clamp(18px, 6%, 30px);
    display: flex; flex-direction: column; gap: 2px;
  }
  .memory-demo__index {
    font-size: clamp(10px, 2.8%, 12px);
    letter-spacing: 0.34em;
    color: #EFC86A;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  .memory-demo__label {
    font-family: "Cormorant Garamond", Georgia, serif;
    font-size: clamp(14px, 4%, 18px);
    color: #F6EBD2;
    text-shadow: 0 2px 12px rgba(0,0,0,0.55);
  }

  /* Ending */
  .ending-demo {
    position: absolute; inset: 0;
    background: radial-gradient(140% 100% at 50% 40%, #1c130a 0%, #0a0806 70%);
    display: flex; align-items: center; justify-content: center;
    padding: clamp(20px, 8%, 40px);
    text-align: center;
    color: #F6EBD2;
  }
  .ending-demo__glow {
    position: absolute; inset: 0;
    background: radial-gradient(45% 30% at 50% 42%, rgba(239,200,106,0.18) 0%, rgba(0,0,0,0) 70%);
  }
  .ending-demo__content { position: relative; }
  .ending-demo__heart {
    font-size: clamp(24px, 8%, 34px);
    color: #EFC86A;
    text-shadow: 0 0 20px rgba(239,200,106,0.55);
    animation: endingBeat 1.8s ease-in-out infinite;
  }
  @keyframes endingBeat {
    0%, 100% { transform: scale(1); }
    35% { transform: scale(1.18); }
    50% { transform: scale(1.05); }
    65% { transform: scale(1.12); }
  }
  .ending-demo__line {
    margin: 14px 0 0;
    font-family: "Cormorant Garamond", Georgia, serif;
    font-style: italic;
    font-size: clamp(18px, 5%, 24px);
    color: #F6EBD2;
  }
  .ending-demo__brand {
    margin: 22px 0 0;
    font-size: clamp(10px, 2.6%, 12px);
    letter-spacing: 0.52em;
    color: rgba(246,235,210,0.55);
  }
  .ending-demo__cta {
    margin: 6px 0 0;
    font-size: clamp(10px, 2.8%, 12px);
    letter-spacing: 0.18em;
    color: #EFC86A;
  }
`;
