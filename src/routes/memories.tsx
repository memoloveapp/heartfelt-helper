import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/memories")({
  head: () => ({
    meta: [
      { title: "Sua homenagem — MemoLove" },
      { name: "description", content: "Uma homenagem MemoLove." },
    ],
  }),
  component: MemoriesPage,
  ssr: false,
});

type Photo = { name?: string; url: string };
type Track = { title?: string; artist?: string; preview?: string; url?: string } | null;
type Saved = {
  fatherName?: string;
  fromName?: string;
  photos?: Photo[];
  track?: Track;
  message?: string;
};

const SERIF = { fontFamily: '"Fraunces", Georgia, serif' };
const SANS = { fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' };

const QUOTES = [
  "Obrigado por tudo.",
  "Nunca esquecerei nossos momentos.",
  "Seu amor fez quem eu sou.",
];

const PHOTO_MS = 5000;
const QUOTE_MS = 3800;
const FADE_MS = 900;

function safeParse(raw: string | null): Saved {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? (v as Saved) : {};
  } catch {
    return {};
  }
}

type Scene =
  | { kind: "intro"; duration: number }
  | { kind: "photo"; url?: string; duration: number }
  | { kind: "quote"; text: string; duration: number }
  | { kind: "message"; duration: number }
  | { kind: "final"; duration: number };

function MemoriesPage() {
  const [data, setData] = useState<Saved>({});
  const [ready, setReady] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("memolove:homenagem") : null;
      setData(safeParse(raw));
    } catch {
      setData({});
    } finally {
      setReady(true);
    }
  }, []);

  const photos: Photo[] = Array.isArray(data.photos) ? data.photos.filter((p) => p && typeof p.url === "string") : [];
  const fatherName = (data.fatherName || "").trim() || "Pai";
  const fromName = (data.fromName || "").trim() || "Sua família";
  const message = (data.message || "").trim() || "Obrigado por todo amor, dedicação e carinho ao longo de cada dia da minha vida.";
  const trackUrl = data.track?.preview || data.track?.url;

  const scenes: Scene[] = useMemo(() => {
    const list: Scene[] = [{ kind: "intro", duration: 4200 }];
    if (photos.length === 0) {
      list.push({ kind: "photo", duration: PHOTO_MS });
    } else {
      photos.forEach((p, i) => {
        list.push({ kind: "photo", url: p.url, duration: PHOTO_MS });
        // insert a quote after every 2nd photo, up to QUOTES.length
        const qIndex = Math.floor(i / 2);
        if ((i + 1) % 2 === 0 && qIndex < QUOTES.length && i < photos.length - 1) {
          list.push({ kind: "quote", text: QUOTES[qIndex], duration: QUOTE_MS });
        }
      });
    }
    // ensure at least one quote before message
    if (!list.some((s) => s.kind === "quote")) {
      list.push({ kind: "quote", text: QUOTES[0], duration: QUOTE_MS });
    }
    list.push({ kind: "message", duration: Math.max(7000, message.length * 55) });
    list.push({ kind: "final", duration: 7000 });
    return list;
  }, [photos, message]);

  // auto-advance
  useEffect(() => {
    if (!ready || paused) return;
    if (sceneIndex >= scenes.length - 1) return;
    const t = setTimeout(() => setSceneIndex((i) => Math.min(i + 1, scenes.length - 1)), scenes[sceneIndex].duration);
    return () => clearTimeout(t);
  }, [ready, sceneIndex, scenes, paused]);

  // music
  useEffect(() => {
    if (!ready || !trackUrl) return;
    const a = new Audio(trackUrl);
    a.loop = true;
    a.volume = 0.6;
    audioRef.current = a;
    const tryPlay = () => a.play().catch(() => {});
    tryPlay();
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, [ready, trackUrl]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (musicOn && !paused) a.play().catch(() => {});
    else a.pause();
  }, [musicOn, paused]);

  if (!ready) {
    return <div className="fixed inset-0 bg-black" />;
  }

  const scene = scenes[sceneIndex];

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white" style={SANS}>
      <div key={sceneIndex} className="absolute inset-0 ml-fade">
        {scene.kind === "intro" && <IntroScene fatherName={fatherName} />}
        {scene.kind === "photo" && <PhotoScene url={scene.url} />}
        {scene.kind === "quote" && <QuoteScene text={scene.text} />}
        {scene.kind === "message" && <MessageScene message={message} />}
        {scene.kind === "final" && <FinalScene fromName={fromName} />}
      </div>

      {/* Music player */}
      {trackUrl && scene.kind !== "intro" && (
        <button
          type="button"
          onClick={() => setMusicOn((v) => !v)}
          aria-label={musicOn ? "Pausar música" : "Reproduzir música"}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 hover:bg-black/55 transition"
        >
          {musicOn ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
      )}

      {/* Pause overlay control */}
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        className="fixed bottom-6 left-6 z-40 w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 hover:bg-black/55 transition"
        aria-label={paused ? "Continuar" : "Pausar"}
      >
        {paused ? (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="5" y="5" width="5" height="14" rx="1"/><rect x="14" y="5" width="5" height="14" rx="1"/></svg>
        )}
      </button>

      <style>{`
        @keyframes mlFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mlKenBurns { from { transform: scale(1) translate(0,0); } to { transform: scale(1.12) translate(-1.5%,-1%); } }
        @keyframes mlRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mlBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        .ml-fade { animation: mlFadeIn ${FADE_MS}ms ease both; }
        .ml-rise { opacity: 0; animation: mlRise 900ms ease-out both; }
        .ml-kenburns { animation: mlKenBurns 6s ease-out both; transform-origin: center; will-change: transform; }
        .ml-caret::after { content:"▍"; display:inline-block; margin-left:2px; animation: mlBlink 1s steps(1) infinite; color:#C97B5E; font-weight:300; }
        @media (prefers-reduced-motion: reduce){
          .ml-fade,.ml-rise,.ml-kenburns{ animation: none !important; opacity:1 !important; transform:none !important; }
        }
      `}</style>
    </div>
  );
}

function IntroScene({ fatherName }: { fatherName: string }) {
  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-center px-8">
      <div className="text-white/60 text-[10px] tracking-[0.4em] uppercase mb-16 ml-rise" style={{ animationDelay: "200ms" }}>
        MemoLove
      </div>
      <div className="text-4xl mb-6 ml-rise" style={{ animationDelay: "1000ms" }}>❤️</div>
      <div className="text-white/80 text-[11px] tracking-[0.32em] uppercase mb-5 ml-rise" style={{ animationDelay: "1600ms" }}>
        Feliz Dia dos Pais
      </div>
      <h1
        className="font-medium leading-[1.05] ml-rise"
        style={{ ...SERIF, fontSize: "clamp(2.6rem, 7vw, 4.4rem)", animationDelay: "2200ms" }}
      >
        {fatherName}
      </h1>
    </div>
  );
}

function PhotoScene({ url }: { url?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {url ? (
        <img
          src={url}
          alt=""
          className="w-full h-full object-cover ml-kenburns"
          style={{ filter: "brightness(0.95) contrast(1.04) saturate(1.04)" }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#3a2820] via-[#2a1f17] to-[#0f0a07]" />
      )}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.25))" }} />
    </div>
  );
}

function QuoteScene({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center text-center px-10">
      <p
        className="italic text-white/95 ml-rise"
        style={{ ...SERIF, fontSize: "clamp(1.8rem, 4.2vw, 2.6rem)", animationDelay: "300ms", lineHeight: 1.5, maxWidth: "20ch" }}
      >
        "{text}"
      </p>
    </div>
  );
}

function MessageScene({ message }: { message: string }) {
  const lines = useMemo(() => splitIntoLines(message, 38), [message]);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    const t = setInterval(() => {
      setShown((s) => (s >= lines.length ? s : s + 1));
    }, 750);
    return () => clearInterval(t);
  }, [lines]);

  return (
    <div className="absolute inset-0 bg-[#FBF8F4] text-[#2a221c] flex flex-col items-center justify-center text-center px-8">
      <div className="text-[11px] tracking-[0.28em] uppercase text-[#C97B5E] mb-8 ml-rise">
        Uma mensagem do coração
      </div>
      <div className="max-w-xl w-full" style={SERIF}>
        {lines.map((line, i) => (
          <p
            key={i}
            className={`leading-[1.7] ${i === shown - 1 ? "ml-caret" : ""}`}
            style={{
              fontSize: "clamp(1.15rem, 2.2vw, 1.4rem)",
              opacity: i < shown ? 1 : 0,
              transform: i < shown ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 500ms ease, transform 500ms ease",
              marginBottom: "0.4em",
            }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function FinalScene({ fromName }: { fromName: string }) {
  return (
    <div className="absolute inset-0 bg-[#FBF8F4] text-[#2a221c] flex flex-col items-center justify-center text-center px-8">
      <div className="text-4xl mb-6 ml-rise" style={{ animationDelay: "200ms" }}>❤️</div>
      <h2
        className="mb-8 ml-rise"
        style={{ ...SERIF, fontSize: "clamp(2rem, 5vw, 2.8rem)", animationDelay: "700ms" }}
      >
        Obrigado por tudo.
      </h2>
      <div className="text-[11px] tracking-[0.22em] uppercase text-[#7a6e64] mb-3 ml-rise" style={{ animationDelay: "1500ms" }}>
        Com carinho
      </div>
      <div className="italic ml-rise" style={{ ...SERIF, fontSize: "clamp(1.4rem, 3vw, 1.8rem)", animationDelay: "1900ms" }}>
        {fromName}
      </div>
      <div className="absolute bottom-8 left-0 right-0 text-center text-[#7a6e64] text-[10px] tracking-[0.4em] uppercase ml-rise" style={{ animationDelay: "2600ms" }}>
        MemoLove
      </div>
    </div>
  );
}

function splitIntoLines(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur.trim());
  return lines;
}
