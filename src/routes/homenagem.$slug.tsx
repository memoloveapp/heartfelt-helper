import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllAudio } from "@/lib/audio";
import letterPaper from "@/assets/letter-paper.jpg";


/* ============================================================
   /homenagem/$slug — MemoLove (Hero only)
   ============================================================ */

const NIGHT = "#08070A";
const GOLD = "#D4A257";
const IVORY = "#F4EBDD";

const DISPLAY = { fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif' } as const;
const SERIF = { fontFamily: '"Playfair Display", Georgia, serif' } as const;
const BODY = { fontFamily: '"Inter", system-ui, sans-serif' } as const;

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
      { name: "description", content: "Uma homenagem cinematográfica criada com MemoLove." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,500;1,700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Inter:wght@300;400;500;600&family=Dancing+Script:wght@500;600&display=swap",
      },
    ],
  }),
  component: HomenagemPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: NIGHT, color: IVORY }}>
      <div><h1 className="text-2xl mb-2" style={DISPLAY}>Ops…</h1><p className="text-sm opacity-70">{error.message}</p></div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: NIGHT, color: IVORY }}>
      <p style={DISPLAY}>Memória não encontrada.</p>
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

/* ---------------- Prologue ---------------- */
function Prologue({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1900);
    const t2 = setTimeout(() => { setPhase(2); onDone(); }, 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);
  if (phase === 2) return null;
  return (
    <div className={`ml-prologue ${phase >= 1 ? "is-open" : ""}`}>
      <div className="ml-prologue-top" />
      <div className="ml-prologue-bot" />
      <div className="ml-prologue-center">
        <span className="ml-prologue-mark" style={SERIF}>MemoLove</span>
        <span className="ml-prologue-line" />
        <span className="ml-prologue-sub" style={BODY}>Apresenta</span>
      </div>
    </div>
  );
}

/* ---------------- Hero ---------------- */
function ChapterHero({ photo, ready }: { name: string; photo: string; occasion: string | null; ready: boolean }) {
  return (
    <section className="ml-hero" data-chapter>
      {photo && <img src={photo} alt="" aria-hidden loading="eager" className="ml-hero-img" />}
      <div className="ml-hero-veil" aria-hidden />
      <div className="ml-hero-content">
        <p className={`ml-h-eyebrow ${ready ? "in" : ""}`} style={BODY}>PARA O MEU</p>
        <h1 className={`ml-h-name ${ready ? "in" : ""}`} style={SERIF}>Pai.</h1>
        <div className={`ml-h-rule ${ready ? "in" : ""}`} aria-hidden>
          <span className="ml-h-rule-line" />
          <svg className="ml-h-rule-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 20.5s-6.5-4.2-8.8-8.4A4.9 4.9 0 0 1 12 6.2a4.9 4.9 0 0 1 8.8 5.9C18.5 16.3 12 20.5 12 20.5z"/></svg>
          <span className="ml-h-rule-line" />
        </div>
        <p className={`ml-h-sub ${ready ? "in" : ""}`} style={BODY}>Meu maior exemplo.</p>
      </div>
      <div className={`ml-h-scroll ${ready ? "in" : ""}`} aria-hidden>
        <svg className="ml-h-scroll-chev" width="16" height="26" viewBox="0 0 16 26" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 1v22M2 17l6 6 6-6"/></svg>
      </div>
    </section>
  );
}

/* ---------------- Page ---------------- */
function HomenagemPage() {
  const { slug } = Route.useParams();
  const { memory, photos, ready, err } = useMemoryData(slug);
  const [prologueDone, setPrologueDone] = useState(false);

  useEffect(() => { stopAllAudio(); return () => stopAllAudio(); }, []);

  const hero = photos[0] ?? "";

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: NIGHT }}>
        <div style={{ ...BODY, color: GOLD, fontSize: 10, letterSpacing: ".5em" }} className="uppercase animate-pulse">Preparando a memória</div>
      </div>
    );
  }
  if (err || !memory) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: NIGHT, color: IVORY }}>
        <div className="text-center p-8"><h1 style={SERIF} className="text-2xl mb-2">Memória não encontrada</h1><p className="text-sm opacity-70">{err}</p></div>
      </div>
    );
  }

  return (
    <div className="ml-root">
      <style>{`
        html, body { background: #08070A; }
        .ml-root { background: #08070A; color: ${IVORY}; position: relative; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
        .ml-root ::selection { background: ${GOLD}; color: ${NIGHT}; }

        @keyframes ml-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ml-rise { 0% { opacity: 0; transform: translateY(28px); filter: blur(14px); } 100% { opacity: 1; transform: none; filter: none; } }

        /* Prologue */
        .ml-prologue { position: fixed; inset: 0; z-index: 100; pointer-events: none; }
        .ml-prologue-top, .ml-prologue-bot { position: absolute; left: 0; right: 0; height: 50%; background: ${NIGHT}; transition: transform 1.2s cubic-bezier(.7,0,.3,1); }
        .ml-prologue-top { top: 0; }
        .ml-prologue-bot { bottom: 0; }
        .ml-prologue.is-open .ml-prologue-top { transform: translateY(-100%); }
        .ml-prologue.is-open .ml-prologue-bot { transform: translateY(100%); }
        .ml-prologue-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; transition: opacity .6s ease; }
        .ml-prologue.is-open .ml-prologue-center { opacity: 0; }
        .ml-prologue-mark { color: ${GOLD}; font-size: clamp(32px, 5vw, 56px); font-style: italic; opacity: 0; animation: ml-rise 1.2s ease-out .2s forwards; letter-spacing: .02em; }
        .ml-prologue-line { width: 0; height: 1px; background: ${GOLD}; animation: ml-pline 1s ease-out 1s forwards; }
        @keyframes ml-pline { to { width: 120px; } }
        .ml-prologue-sub { color: rgba(244,235,221,.5); font-size: 10px; letter-spacing: .6em; text-transform: uppercase; opacity: 0; animation: ml-fade 1s ease-out 1.4s forwards; }

        /* Hero */
        @keyframes ml-kb-soft {
          0%   { transform: scale(1.06) translate(-1.2%, -0.8%); }
          50%  { transform: scale(1.10) translate(1%, 1%); }
          100% { transform: scale(1.06) translate(-1.2%, -0.8%); }
        }
        @keyframes ml-h-in { 0% { opacity: 0; transform: translateY(32px) scale(.985); filter: blur(14px); letter-spacing: .04em; } 60% { filter: blur(2px); } 100% { opacity: 1; transform: none; filter: none; } }
        @keyframes ml-h-name-in { 0% { opacity: 0; transform: translateY(46px) scale(.94); filter: blur(20px); } 55% { opacity: 1; filter: blur(3px); } 100% { opacity: 1; transform: none; filter: none; } }
        @keyframes ml-h-rule-in { 0% { opacity: 0; transform: scaleX(0); } 100% { opacity: 1; transform: scaleX(1); } }
        @keyframes ml-h-breath { 0%,100% { opacity: .5; transform: translate(-50%, 0); } 50% { opacity: 1; transform: translate(-50%, 4px); } }

        .ml-hero { position: relative; height: 100vh; height: 100svh; width: 100vw; overflow: hidden; background: #000; margin: 0; padding: 0; }
        .ml-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; opacity: 0; transform-origin: center; animation: ml-fade 1.8s ease-out .1s forwards, ml-kb-soft 28s ease-in-out 1.8s infinite; }
        .ml-hero-veil {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(68% 50% at 22% 88%, rgba(0,0,0,.72) 0%, rgba(0,0,0,.4) 46%, rgba(0,0,0,.14) 72%, rgba(0,0,0,0) 92%),
            linear-gradient(180deg,
              rgba(0,0,0,.18) 0%,
              rgba(0,0,0,.05) 30%,
              rgba(0,0,0,.32) 62%,
              rgba(0,0,0,.72) 88%,
              rgba(0,0,0,.9) 100%);
        }

        .ml-hero-content {
          position: absolute;
          left: clamp(28px, 5vw, 72px);
          right: 24px;
          bottom: clamp(120px, 17vh, 174px);
          z-index: 3;
          max-width: 88vw;
          text-align: left;
          color: ${IVORY};
          overflow: visible;
        }
        .ml-hero-content::before {
          content: "";
          position: absolute;
          left: -8%; right: -20%;
          top: -18%; bottom: -30%;
          background: radial-gradient(ellipse at 30% 65%, rgba(0,0,0,.55) 0%, rgba(0,0,0,.32) 38%, rgba(0,0,0,.12) 62%, rgba(0,0,0,0) 82%);
          filter: blur(24px);
          z-index: -1;
          pointer-events: none;
        }
        .ml-h-eyebrow {
          margin: 0 0 2px;
          font-family: "Inter", system-ui, -apple-system, sans-serif;
          font-size: clamp(12px, 1vw, 14px);
          font-weight: 500;
          letter-spacing: .32em;
          text-transform: uppercase;
          color: #E8C286;
          opacity: 0;
          text-shadow: 0 1px 2px rgba(0,0,0,.85), 0 2px 16px rgba(0,0,0,.7);
        }
        .ml-h-eyebrow.in { animation: ml-h-in 1.1s cubic-bezier(.16,.84,.24,1) .35s forwards; }
        .ml-h-name {
          margin: 0;
          padding: 0 0 .04em;
          font-family: "Playfair Display", "Didot", Georgia, serif;
          font-weight: 500;
          font-size: clamp(119px, 21.6vw, 216px);
          line-height: .9;
          letter-spacing: -.028em;
          color: ${IVORY};
          text-shadow: 0 8px 40px rgba(0,0,0,.55), 0 2px 12px rgba(0,0,0,.5);
          opacity: 0;
        }
        .ml-h-name.in { animation: ml-h-name-in 1.6s cubic-bezier(.16,.84,.24,1) .7s forwards; }
        .ml-h-rule {
          display: flex; align-items: center; gap: 8px;
          width: 72px; margin: 8px 0 0;
          transform-origin: left center; transform: scaleX(0); opacity: 0;
        }
        .ml-h-rule-line { flex: 1; height: 1px; background: #E1BB82; opacity: .9; }
        .ml-h-rule-heart { width: 10px; height: 10px; flex: none; color: #E1BB82; filter: drop-shadow(0 0 8px rgba(225,187,130,.7)); animation: ml-heart-beat 1.2s ease-in-out infinite; transform-origin: center; }
        @keyframes ml-heart-beat {
          0%   { transform: scale(1); }
          14%  { transform: scale(1.32); }
          28%  { transform: scale(1); }
          42%  { transform: scale(1.22); }
          70%,100% { transform: scale(1); }
        }
        .ml-h-rule.in { animation: ml-h-rule-in 1.1s cubic-bezier(.16,.84,.24,1) 1.6s forwards; }
        .ml-h-sub {
          margin: 12px 0 0;
          font-family: "Inter", system-ui, -apple-system, sans-serif;
          font-weight: 300;
          font-size: clamp(14px, 1.1vw, 16px);
          line-height: 1.55;
          letter-spacing: .06em;
          color: rgba(244,235,221,.92);
          opacity: 0;
          text-shadow: 0 2px 12px rgba(0,0,0,.6);
        }
        .ml-h-sub.in { animation: ml-h-in 1.2s cubic-bezier(.16,.84,.24,1) 2.1s forwards; }

        .ml-h-scroll {
          position: absolute;
          left: 50%; bottom: clamp(28px, 4vh, 42px);
          transform: translate(-50%, 0);
          color: ${GOLD}; opacity: 0; z-index: 4;
        }
        .ml-h-scroll.in { animation: ml-fade 1s ease-out 1.8s forwards, ml-h-breath 3.2s ease-in-out 2.8s infinite; }
        .ml-h-scroll-chev { display: block; opacity: .75; filter: drop-shadow(0 0 6px rgba(212,162,87,.4)); }

        @media (max-width: 640px) {
          .ml-hero-img { object-position: center center; }
          .ml-hero-content { left: 28px; right: 20px; bottom: clamp(88px, 12vh, 120px); max-width: 88vw; }
          .ml-h-name { font-size: clamp(96px, 26vw, 150px); }
          .ml-h-rule { width: clamp(140px, 40vw, 200px); }
        }

        /* ============ CARTA PARA VOCÊ ============ */
        .ml-letter-wrap {
          background: #EFE5CF;
          padding: clamp(60px, 10vh, 120px) 20px clamp(90px, 13vh, 160px);
          display: flex; justify-content: center;
        }
        .ml-letter-card {
          position: relative;
          width: 100%;
          max-width: 440px;
          padding: clamp(52px, 8vw, 74px) clamp(38px, 6vw, 54px) clamp(110px, 15vw, 140px);
          color: #3B2A18;
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          background-image: url(${JSON.stringify(letterPaper)});
          background-size: 100% 100%;
          background-repeat: no-repeat;
          opacity: 0;
          transform: translateY(24px);
          animation: ml-rise 1.2s cubic-bezier(.16,.84,.24,1) .2s forwards;
          filter: drop-shadow(0 24px 40px rgba(80,55,20,.28)) drop-shadow(0 8px 16px rgba(80,55,20,.18));
        }
        .ml-letter-inner { position: relative; z-index: 2; }

        .ml-letter-title {
          margin: 0 0 14px;
          text-align: center;
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-weight: 400;
          font-style: normal;
          font-size: clamp(24px, 3.4vw, 30px);
          color: #3B2A18;
          letter-spacing: .005em;
        }
        .ml-letter-heart {
          display: flex; justify-content: center;
          color: #6B4A2A;
          margin: 0 0 clamp(30px, 4.5vh, 44px);
          opacity: .9;
        }
        .ml-letter-greet {
          margin: 0 0 clamp(22px, 3vh, 28px);
          font-size: clamp(19px, 2vw, 22px);
          font-weight: 500;
          color: #2E1F0E;
        }
        .ml-letter-msg p {
          margin: 0 0 clamp(16px, 2.4vh, 22px);
          font-size: clamp(15px, 1.55vw, 17px);
          line-height: 1.55;
          color: #3B2A18;
          font-weight: 400;
        }
        .ml-letter-msg p:last-child { margin-bottom: 0; }
        .ml-letter-signoff {
          margin: clamp(30px, 4vh, 40px) 0 6px;
          font-size: clamp(15px, 1.55vw, 17px);
          color: #3B2A18;
        }
        .ml-letter-sign {
          font-family: 'Dancing Script', 'Cormorant Garamond', cursive;
          font-size: clamp(26px, 3vw, 32px);
          color: #4A3319;
          line-height: 1;
          margin: 0;
        }
      `}</style>


      {!prologueDone && <Prologue onDone={() => setPrologueDone(true)} />}

      <ChapterHero name={memory.father_name} photo={hero} occasion={memory.occasion} ready={prologueDone} />

      <ChapterLetter message={memory.message} sender={memory.sender_name} />
    </div>
  );
}

/* ---------------- Carta ---------------- */
function ChapterLetter({ message, sender }: { message: string; sender: string }) {
  const paragraphs = (message ?? "").split(/\n\s*\n|\n/).map((s) => s.trim()).filter(Boolean);
  const greeting = paragraphs[0] ?? "";
  const rest = paragraphs.slice(1);

  return (
    <section className="ml-letter-wrap" data-chapter>
      <article className="ml-letter-card">
        <div className="ml-letter-paper" aria-hidden />
        <div className="ml-letter-curl" aria-hidden />
        <div className="ml-letter-inner">
          <h2 className="ml-letter-title">Carta para você</h2>
          <div className="ml-letter-heart" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.5s-6.5-4.2-8.8-8.4A4.9 4.9 0 0 1 12 6.2a4.9 4.9 0 0 1 8.8 5.9C18.5 16.3 12 20.5 12 20.5z"/></svg>
          </div>

          {greeting && <p className="ml-letter-greet">{greeting}</p>}

          <div className="ml-letter-msg">
            {rest.map((p, i) => <p key={i}>{p}</p>)}
          </div>

          <p className="ml-letter-signoff">Com amor,</p>
          <p className="ml-letter-sign">{sender || "Seu filho"}</p>
        </div>
      </article>
    </section>

  );
}
