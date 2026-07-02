import { useEffect, useRef, useState } from "react";
import { stopAllAudio } from "@/lib/audio";
import { Rise } from "./shared";

export function MusicScene({ title, artist, src }: { title: string; artist: string; src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState({ cur: 0, dur: 0 });

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      setProgress(a.duration ? a.currentTime / a.duration : 0);
      setTime({ cur: a.currentTime || 0, dur: a.duration || 0 });
    };
    const onEnd = () => { setPlaying(false); setProgress(0); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onTime);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onTime);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { stopAllAudio(); try { await a.play(); setPlaying(true); } catch { /* ignore */ } }
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60); const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  return (
    <section className="ml-music" aria-label="Trilha">
      <Rise as="div" className="ml-music-inner">
        <button className="ml-music-btn" onClick={toggle} aria-label={playing ? "Pausar" : "Tocar"}>
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5.5v13a.5.5 0 0 0 .77.42l10-6.5a.5.5 0 0 0 0-.84l-10-6.5A.5.5 0 0 0 8 5.5z" /></svg>
          )}
        </button>
        <div className="ml-music-meta">
          <p className="ml-music-title">{title}</p>
          {artist && <p className="ml-music-artist">{artist}</p>}
        </div>
        <div className="ml-music-track" aria-hidden>
          <span className="ml-music-fill" style={{ transform: `scaleX(${progress})` }} />
        </div>
        <span className="ml-music-time">{fmt(time.cur)} · {fmt(time.dur)}</span>
        <audio ref={audioRef} src={src} preload="none" />
      </Rise>
    </section>
  );
}
