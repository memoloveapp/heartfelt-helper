import { useRef, useState } from "react";
import { stopAllAudio } from "@/lib/audio";

export function MusicScene({ title, artist, src }: { title: string; artist: string; src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      stopAllAudio();
      try {
        await a.play();
        setPlaying(true);
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <section
      style={{
        width: "100%",
        background: "#111",
        color: "#fff",
        padding: "96px 24px",
        textAlign: "center",
      }}
      aria-label="Trilha"
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: ".3em", textTransform: "uppercase", opacity: 0.7 }}>
          Trilha
        </p>
        <h3
          style={{
            margin: "16px 0 4px",
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontWeight: 500,
            fontSize: 28,
          }}
        >
          {title || "Nossa canção"}
        </h3>
        {artist && <p style={{ margin: "0 0 24px", opacity: 0.7 }}>{artist}</p>}
        {src && (
          <>
            <button
              onClick={toggle}
              style={{
                marginTop: 16,
                padding: "12px 28px",
                background: "#fff",
                color: "#111",
                border: "none",
                borderRadius: 999,
                fontSize: 14,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {playing ? "Pausar" : "Tocar"}
            </button>
            <audio ref={audioRef} src={src} preload="none" onEnded={() => setPlaying(false)} />
          </>
        )}
      </div>
    </section>
  );
}
