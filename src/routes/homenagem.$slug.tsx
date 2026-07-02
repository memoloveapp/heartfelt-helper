import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";
import {
  PAPER,
  PAPER_DEEP,
  GRAPHITE,
  GRAPHITE_SOFT,
  GOLD,
  SERIF,
  SANS,
} from "@/components/homenagem/shared";
import { HeroScene, Whisper } from "@/components/homenagem/HeroScene";
import { LetterScene } from "@/components/homenagem/LetterScene";
import { MusicScene } from "@/components/homenagem/MusicScene";
import { MemoryScene } from "@/components/homenagem/MemoryScene";
import { EndingScene } from "@/components/homenagem/EndingScene";

/* ============================================================
   /homenagem/$slug — MemoLove
   Cenas separadas: HeroScene · LetterScene · MusicScene · MemoryScene · EndingScene
   ============================================================ */

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

export const Route = createFileRoute("/homenagem/$slug")({
  head: () => ({
    meta: [
      { title: "Uma memória eterna — MemoLove" },
      { name: "description", content: "Uma homenagem feita com tempo, carinho e amor." },
    ],
  }),
  component: HomenagemPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: PAPER, color: GRAPHITE, fontFamily: SERIF }}>
      <div><h1 className="text-2xl mb-2" style={{ fontStyle: "italic" }}>Um instante…</h1><p className="text-sm opacity-70" style={{ fontFamily: SANS }}>{error.message}</p></div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: PAPER, color: GRAPHITE, fontFamily: SERIF }}>
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
        .select("id, slug, father_name, sender_name, message, occasion, music_title, music_artist, music_cover, music_preview_url")
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

  useEffect(() => {
    stopAllAudio();
    const t = setTimeout(() => setOpeningDone(true), 250);
    return () => { clearTimeout(t); stopAllAudio(); };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: PAPER }}>
        <div style={{ fontFamily: SANS, color: GRAPHITE_SOFT, fontSize: 10, letterSpacing: ".5em" }} className="uppercase animate-pulse">preparando</div>
      </div>
    );
  }
  if (err || !memory) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: PAPER, color: GRAPHITE }}>
        <div className="text-center p-8"><h1 style={{ fontFamily: SERIF, fontStyle: "italic" }} className="text-2xl mb-2">Memória não encontrada</h1><p className="text-sm opacity-70" style={{ fontFamily: SANS }}>{err}</p></div>
      </div>
    );
  }

  const hero = photos[0] ?? "";
  const rest = photos.slice(1).filter(Boolean);
  const hasMusic = !!memory.music_preview_url;
  const name = memory.father_name;

  // Split rest into two halves: some before the letter, most after
  const beforeLetter = rest.slice(0, 1);
  const afterLetter = rest.slice(1);
  const musicBreakAt = Math.min(2, Math.floor(afterLetter.length / 2));
  const musicBefore = afterLetter.slice(0, musicBreakAt);
  const musicAfter = afterLetter.slice(musicBreakAt);

  return (
    <main className="ml-root">
      <style>{`
        html, body { background: ${PAPER}; }
        .ml-root {
          background: ${PAPER};
          color: ${GRAPHITE};
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
          font-family: ${SANS};
          font-weight: 300;
        }
        .ml-root ::selection { background: ${GRAPHITE}; color: ${PAPER}; }

        /* ========== HERO ========== */
        .ml-hero {
          position: relative;
          height: 100vh; height: 100svh;
          width: 100%;
          overflow: hidden;
          background: #111;
        }
        .ml-hero-photo { position: absolute; inset: 0; will-change: transform; }
        .ml-hero-img {
          width: 100%; height: 100%; object-fit: cover; object-position: center;
          display: block;
        }
        .ml-hero-veil {
          position: absolute; inset: 0; pointer-events: none;
        }
        .ml-hero-veil.is-dark {
          background:
            radial-gradient(70% 55% at 50% 55%, rgba(0,0,0,.35) 0%, rgba(0,0,0,.15) 55%, rgba(0,0,0,0) 85%),
            linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(20,15,10,.55) 100%);
        }
        .ml-hero-veil.is-light {
          background:
            radial-gradient(70% 55% at 50% 55%, rgba(20,15,10,.55) 0%, rgba(20,15,10,.28) 55%, rgba(20,15,10,.05) 85%),
            linear-gradient(180deg, rgba(20,15,10,.45) 0%, rgba(20,15,10,.05) 30%, rgba(20,15,10,.05) 60%, rgba(20,15,10,.6) 100%);
        }
        .ml-hero-content {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 0 24px;
          color: ${PAPER}; z-index: 2;
        }
        .ml-hero-eyebrow {
          margin: 0 0 clamp(20px, 3vh, 32px);
          font-family: ${SANS}; font-size: 11px; font-weight: 400;
          letter-spacing: .55em; text-transform: uppercase;
          color: rgba(244,239,230,.72);
        }
        .ml-hero-name {
          margin: 0;
          font-family: ${SERIF};
          font-weight: 300; font-style: italic;
          font-size: clamp(64px, 12vw, 148px);
          line-height: .95;
          letter-spacing: -.02em;
          color: ${PAPER};
        }
        .ml-hero-rule {
          display: flex; align-items: center; justify-content: center; gap: 14px;
          margin: clamp(28px, 4vh, 40px) 0 clamp(20px, 3vh, 28px);
          color: ${GOLD};
        }
        .ml-hero-rule span {
          display: block; width: clamp(56px, 10vw, 96px); height: 1px;
          background: rgba(244,239,230,.55);
        }
        .ml-hero-sub {
          margin: 0;
          font-family: ${SERIF}; font-style: italic; font-weight: 300;
          font-size: clamp(15px, 1.4vw, 19px);
          letter-spacing: .01em;
          color: rgba(244,239,230,.85);
        }
        .ml-hero-scroll {
          position: absolute; left: 50%; bottom: clamp(32px, 5vh, 56px);
          transform: translateX(-50%); z-index: 3;
        }
        .ml-hero-scroll-line {
          display: block; width: 1px; height: 48px;
          background: rgba(244,239,230,.5);
          animation: ml-drip 3.6s ease-in-out infinite;
          transform-origin: top;
        }
        @keyframes ml-drip {
          0%, 100% { transform: scaleY(.35); opacity: .25; }
          50%      { transform: scaleY(1);   opacity: .55; }
        }

        /* ========== WHISPER ========== */
        .ml-whisper {
          padding: clamp(140px, 22vh, 220px) 24px;
          display: flex; justify-content: center;
        }
        .ml-whisper-text {
          max-width: 640px; margin: 0; text-align: center;
          font-family: ${SERIF}; font-style: italic; font-weight: 300;
          font-size: clamp(24px, 3vw, 38px);
          line-height: 1.35; letter-spacing: -.005em;
          color: ${GRAPHITE};
        }

        /* ========== LETTER ========== */
        .ml-letter {
          padding: clamp(120px, 20vh, 200px) 24px;
          display: flex; justify-content: center;
        }
        .ml-letter-inner { width: 100%; max-width: 620px; }
        .ml-letter-eyebrow {
          display: block; margin: 0 0 clamp(32px, 5vh, 48px);
          font-family: ${SANS}; font-size: 10px; font-weight: 400;
          letter-spacing: .5em; text-transform: uppercase;
          color: ${GOLD}; opacity: .9;
        }
        .ml-letter-p {
          margin: 0 0 clamp(24px, 3.4vh, 34px);
          font-family: ${SERIF}; font-weight: 400;
          font-size: clamp(19px, 1.55vw, 23px);
          line-height: 1.75; letter-spacing: .005em;
          color: ${GRAPHITE};
        }
        .ml-letter-first::first-letter {
          font-family: ${SERIF}; font-style: italic; font-weight: 400;
          font-size: 3.2em; float: left; line-height: .95;
          padding: 6px 12px 0 0; color: ${GRAPHITE};
        }
        .ml-letter-sign {
          margin: clamp(40px, 6vh, 64px) 0 0;
          font-family: ${SERIF}; font-style: italic; font-weight: 300;
          font-size: clamp(19px, 1.5vw, 22px);
          color: ${GRAPHITE};
          display: flex; align-items: baseline; gap: 12px;
        }
        .ml-letter-sign-mark { color: ${GOLD}; font-style: normal; }

        /* ========== MOMENT (one photo per screen) ========== */
        .ml-moment {
          min-height: 100vh; min-height: 100svh;
          padding: clamp(80px, 14vh, 140px) 24px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .ml-moment-figure {
          margin: 0; width: 100%; max-width: 900px;
          display: flex; flex-direction: column; align-items: center;
        }
        .ml-moment-media {
          width: 100%;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          background: ${PAPER_DEEP};
          will-change: transform;
        }
        @media (min-width: 900px) {
          .ml-moment-media { aspect-ratio: 3 / 4; max-width: 720px; margin: 0 auto; }
        }
        .ml-moment-img {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .ml-moment-cap {
          margin-top: clamp(24px, 4vh, 40px);
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          text-align: center;
        }
        .ml-moment-index {
          font-family: ${SANS}; font-size: 10px; font-weight: 400;
          letter-spacing: .48em; text-transform: uppercase;
          color: ${GRAPHITE_SOFT};
        }
        .ml-moment-note {
          font-family: ${SERIF}; font-style: italic; font-weight: 300;
          font-size: 17px; color: ${GRAPHITE}; max-width: 480px;
        }

        /* ========== MUSIC ========== */
        .ml-music {
          padding: clamp(120px, 20vh, 200px) 24px;
          display: flex; justify-content: center;
        }
        .ml-music-inner {
          width: 100%; max-width: 520px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          grid-template-rows: auto auto;
          column-gap: 20px; row-gap: 16px;
          align-items: center;
        }
        .ml-music-btn {
          grid-row: 1 / span 2;
          width: 44px; height: 44px; border-radius: 999px;
          background: ${GRAPHITE}; color: ${PAPER};
          display: inline-flex; align-items: center; justify-content: center;
          border: 0; cursor: pointer; transition: transform .3s ${`cubic-bezier(0.16,0.84,0.24,1)`};
        }
        .ml-music-btn:hover { transform: scale(1.06); }
        .ml-music-meta { min-width: 0; }
        .ml-music-title {
          margin: 0;
          font-family: ${SERIF}; font-style: italic; font-weight: 400;
          font-size: 18px; color: ${GRAPHITE}; line-height: 1.2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ml-music-artist {
          margin: 4px 0 0;
          font-family: ${SANS}; font-size: 10px; font-weight: 400;
          letter-spacing: .32em; text-transform: uppercase;
          color: ${GRAPHITE_SOFT};
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ml-music-time {
          grid-row: 1 / span 2; align-self: center;
          font-family: ${SANS}; font-size: 10px; letter-spacing: .2em;
          color: ${GRAPHITE_SOFT};
        }
        .ml-music-track {
          grid-column: 2 / span 1;
          display: block; width: 100%; height: 1px;
          background: rgba(42,38,34,.15); overflow: hidden;
        }
        .ml-music-fill {
          display: block; width: 100%; height: 100%;
          background: ${GRAPHITE};
          transform-origin: left center; transform: scaleX(0);
          transition: transform .12s linear;
        }

        /* ========== CLOSE ========== */
        .ml-close {
          padding: clamp(160px, 26vh, 260px) 24px clamp(80px, 12vh, 120px);
          display: flex; flex-direction: column; align-items: center; text-align: center;
        }
        .ml-close-line {
          margin: 0 0 clamp(24px, 4vh, 40px);
          font-family: ${SERIF}; font-style: italic; font-weight: 300;
          font-size: clamp(24px, 3.4vw, 42px);
          line-height: 1.3; letter-spacing: -.005em;
          color: ${GRAPHITE}; max-width: 640px;
        }
        .ml-close-sign {
          margin: 0 0 clamp(80px, 14vh, 140px);
          font-family: ${SERIF}; font-weight: 300;
          font-size: clamp(15px, 1.3vw, 18px);
          color: ${GRAPHITE_SOFT};
        }
        .ml-close-seal {
          display: inline-flex; align-items: center; gap: 10px;
        }
        .ml-close-heart { color: ${GOLD}; display: inline-flex; }
        .ml-close-mark {
          font-family: ${SANS}; font-size: 10px; font-weight: 400;
          letter-spacing: .55em; text-transform: uppercase;
          color: ${GRAPHITE_SOFT};
        }
      `}</style>

      <Hero name={name} photo={hero} ready={openingDone} />

      <Whisper text="há coisas que só o silêncio consegue dizer." />

      {beforeLetter[0] && (
        <Moment src={beforeLetter[0]} index={0} total={rest.length} />
      )}

      <Letter message={memory.message} sender={memory.sender_name} />

      {musicBefore.map((src, i) => (
        <Moment key={`mb-${i}`} src={src} index={beforeLetter.length + i} total={rest.length} />
      ))}

      {hasMusic && (
        <Music
          title={memory.music_title || "Nossa canção"}
          artist={memory.music_artist || ""}
          src={memory.music_preview_url!}
        />
      )}

      {musicAfter.map((src, i) => (
        <Moment
          key={`ma-${i}`}
          src={src}
          index={beforeLetter.length + musicBefore.length + i}
          total={rest.length}
        />
      ))}

      <Whisper text="o tempo passa. o amor permanece." delay={0.05} />

      <Close sender={memory.sender_name} />
    </main>
  );
}
