import { useEffect, useRef, useState } from "react";

/**
 * Janela para a homenagem oficial de demonstração do MemoLove.
 * Renderiza a página /homenagem/<slug demo> dentro de um iframe escalado
 * ao tamanho do mockup do celular, com scroll automático contemplativo em loop.
 *
 * Sem animações inventadas. Sem slideshows. É a homenagem real sendo navegada.
 */

const DEMO_SLUG = "06ab45c269";

// Viewport "real" simulado dentro do iframe (proporção próxima de um iPhone).
const DEVICE_W = 390;
const DEVICE_H = 844;

// Ritmo do scroll — contemplativo, jamais acelerado.
const HOLD_TOP_MS = 4_200;        // pausa no Hero
const SCENE_HOLD_MS = 3_800;      // pausa em Carta / Música / Ending
const SCENE_TRANSITION_MS = 2_600; // deslize suave entre cenas de altura ~1 viewport
const MEMORIES_SCROLL_MS = 14_000; // scroll contínuo pelas memórias
const HOLD_BOTTOM_MS = 3_000;      // pausa antes de reiniciar
const FADE_MS = 1_100;             // fade suave ao voltar ao Hero

export default function MiniHomenagem() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // Escala o iframe para preencher exatamente o mockup, sem barras.
  useEffect(() => {
    const compute = () => {
      const el = stageRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      const s = Math.max(width / DEVICE_W, height / DEVICE_H);
      setScale(s);
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, []);

  // Scroll automático em loop dentro do iframe (mesma origem).
  useEffect(() => {
    if (!loaded) return;
    const iframe = iframeRef.current;
    const win = iframe?.contentWindow;
    const doc = iframe?.contentDocument;
    if (!win || !doc) return;

    // Silencia áudio dentro do iframe — é uma vitrine, não uma reprodução.
    const mute = () => {
      doc.querySelectorAll<HTMLMediaElement>("audio,video").forEach((m) => {
        m.muted = true;
        try { m.pause(); } catch {}
      });
    };
    mute();
    const muteInterval = window.setInterval(mute, 1000);

    // Injeta estilo para esconder barra de rolagem interna.
    const style = doc.createElement("style");
    style.textContent = `
      ::-webkit-scrollbar { display: none !important; }
      html, body { scrollbar-width: none !important; overflow-x: hidden !important; }
      body { cursor: default !important; }
    `;
    doc.head.appendChild(style);

    let raf = 0;
    let cancelled = false;

    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    const animateTo = (from: number, to: number, duration: number) =>
      new Promise<void>((resolve) => {
        const start = performance.now();
        const step = (now: number) => {
          if (cancelled) return resolve();
          const t = Math.min(1, (now - start) / duration);
          // easing suave — inOutSine
          const eased = 0.5 - Math.cos(Math.PI * t) / 2;
          win.scrollTo(0, from + (to - from) * eased);
          if (t < 1) raf = requestAnimationFrame(step);
          else resolve();
        };
        raf = requestAnimationFrame(step);
      });

    const loop = async () => {
      while (!cancelled) {
        const vh = win.innerHeight;
        const max = Math.max(0, doc.documentElement.scrollHeight - vh);

        // Cenas assumidas em ordem: Hero, Carta, Música, [Memórias longas], Ending.
        // Cada cena curta ≈ 1 viewport; memórias ocupam o restante.
        const stops = [0, vh, vh * 2].filter((y) => y <= max);
        const memoriesStart = stops[stops.length - 1] ?? 0;
        const endingStart = Math.max(memoriesStart, max - vh);

        win.scrollTo(0, 0);
        await wait(HOLD_TOP_MS);
        if (cancelled) return;

        // Hero → Carta → Música (pausa em cada cena)
        for (let i = 1; i < stops.length; i++) {
          await animateTo(stops[i - 1], stops[i], SCENE_TRANSITION_MS);
          if (cancelled) return;
          await wait(SCENE_HOLD_MS);
          if (cancelled) return;
        }

        // Scroll contínuo pelas memórias
        if (endingStart > memoriesStart) {
          await animateTo(memoriesStart, endingStart, MEMORIES_SCROLL_MS);
          if (cancelled) return;
        }

        // Ending
        if (max > endingStart) {
          await animateTo(endingStart, max, SCENE_TRANSITION_MS);
          if (cancelled) return;
        }
        await wait(HOLD_BOTTOM_MS);
        if (cancelled) return;

        // Fade suave e retorno ao Hero
        if (iframe) {
          iframe.style.transition = `opacity ${FADE_MS}ms ease`;
          iframe.style.opacity = "0";
        }
        await wait(FADE_MS);
        win.scrollTo(0, 0);
        await wait(160);
        if (iframe) iframe.style.opacity = "1";
        await wait(FADE_MS);
      }
    };

    // Pequena espera para as cenas terminarem seu opening.
    const kickoff = window.setTimeout(loop, 1200);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(kickoff);
      clearInterval(muteInterval);
    };
  }, [loaded]);

  return (
    <div ref={stageRef} style={styles.stage}>
      <iframe
        ref={iframeRef}
        src={`/homenagem/${DEMO_SLUG}`}
        title="Homenagem MemoLove — demonstração"
        onLoad={() => setLoaded(true)}
        scrolling="no"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          ...styles.frame,
          width: DEVICE_W,
          height: DEVICE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      />
    </div>
  );
}

const styles = {
  stage: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    background: "#0F0B08",
  } as React.CSSProperties,
  frame: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transformOrigin: "center center",
    border: "0",
    display: "block",
    pointerEvents: "none",
    background: "#0F0B08",
  } as React.CSSProperties,
};
