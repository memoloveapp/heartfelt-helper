import { useEffect, useRef, useState } from "react";

/**
 * Janela para a homenagem oficial dentro do mockup do celular.
 * Renderiza /homenagem/<slug> num iframe escalado e faz auto-scroll
 * contemplativo dentro do iframe (sem tocar na Landing).
 */

const DEMO_SLUG = "06ab45c269";

// Viewport simulado dentro do iframe.
const DEVICE_W = 390;
const DEVICE_H = 844;

// Ritmo contemplativo.
const HOLD_HERO_MS = 3_000;
const HOLD_SCENE_MS = 2_000;
const HOLD_END_MS = 3_000;
const SCENE_TRANSITION_MS = 2_400;
const MEMORIES_SCROLL_MS = 14_000;
const FADE_MS = 1_000;

export default function MiniHomenagem() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(true);
  const visibleRef = useRef(true);

  useEffect(() => { visibleRef.current = visible; }, [visible]);

  // Escala o iframe para preencher o mockup.
  useEffect(() => {
    const compute = () => {
      const el = stageRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      setScale(Math.max(width / DEVICE_W, height / DEVICE_H));
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, []);

  // Pausa o loop quando o mockup sai da viewport da Landing.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Auto-scroll dentro do iframe (mesma origem).
  useEffect(() => {
    if (!loaded) return;
    const iframe = iframeRef.current;
    const win = iframe?.contentWindow;
    const doc = iframe?.contentDocument;
    if (!win || !doc) return;

    const reduce = win.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // Silencia áudio/vídeo — é uma vitrine.
    const mute = () => {
      doc.querySelectorAll<HTMLMediaElement>("audio,video").forEach((m) => {
        m.muted = true;
        try { m.pause(); } catch {}
      });
    };
    mute();
    const muteInterval = window.setInterval(mute, 800);

    // Esconde barras de rolagem internas.
    const style = doc.createElement("style");
    style.textContent = `
      ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
      html, body { scrollbar-width: none !important; overflow-x: hidden !important; }
      html { scroll-behavior: auto !important; }
      body { cursor: default !important; }
    `;
    doc.head.appendChild(style);

    let raf = 0;
    let cancelled = false;

    const scroller: HTMLElement =
      (doc.scrollingElement as HTMLElement) || doc.documentElement;

    const getMax = () => Math.max(0, scroller.scrollHeight - win.innerHeight);

    const setScrollTop = (y: number) => {
      scroller.scrollTop = y;
      // fallback para navegadores que rolam via window
      win.scrollTo(0, y);
    };

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const start = performance.now();
        const tick = () => {
          if (cancelled) return resolve();
          if (!visibleRef.current) { raf = requestAnimationFrame(tick); return; }
          if (performance.now() - start >= ms) return resolve();
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      });

    const animateTo = (to: number, duration: number) =>
      new Promise<void>((resolve) => {
        const from = scroller.scrollTop;
        let elapsed = 0;
        let last = performance.now();
        const step = (now: number) => {
          if (cancelled) return resolve();
          const dt = now - last;
          last = now;
          if (visibleRef.current) elapsed += dt;
          const t = Math.min(1, elapsed / duration);
          const eased = 0.5 - Math.cos(Math.PI * t) / 2;
          setScrollTop(from + (to - from) * eased);
          if (t < 1) raf = requestAnimationFrame(step);
          else resolve();
        };
        raf = requestAnimationFrame(step);
      });

    // Aguarda o conteúdo real do documento crescer (imagens/cenas montarem).
    const waitForContent = async () => {
      const start = performance.now();
      while (!cancelled) {
        if (getMax() > win.innerHeight * 2) return;
        if (performance.now() - start > 8000) return;
        await new Promise((r) => setTimeout(r, 200));
      }
    };

    // Warmup invisível: rola até o fim para forçar renderização (useInView),
    // depois volta ao topo antes do loop visível iniciar.
    const warmup = async () => {
      if (!iframe) return;
      iframe.style.opacity = "0";
      const max = getMax();
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        if (cancelled) return;
        setScrollTop((getMax() * i) / steps);
        await new Promise((r) => setTimeout(r, 220));
      }
      setScrollTop(0);
      await new Promise((r) => setTimeout(r, 400));
      iframe.style.transition = `opacity ${FADE_MS}ms ease`;
      iframe.style.opacity = "1";
      await new Promise((r) => setTimeout(r, FADE_MS));
      void max;
    };

    const loop = async () => {
      while (!cancelled) {
        const vh = win.innerHeight;
        const max = getMax();
        if (max <= 0) { await new Promise((r) => setTimeout(r, 500)); continue; }

        setScrollTop(0);
        await wait(HOLD_HERO_MS);
        if (cancelled) return;

        // Cenas curtas: Carta e Música (aprox 1 viewport cada).
        const targets = [vh, vh * 2].filter((y) => y < max);
        for (const y of targets) {
          await animateTo(y, SCENE_TRANSITION_MS);
          if (cancelled) return;
          await wait(HOLD_SCENE_MS);
          if (cancelled) return;
        }

        // Memórias — scroll contínuo até próximo ao fim.
        const memStart = scroller.scrollTop;
        const endingStart = Math.max(memStart, getMax() - vh);
        if (endingStart > memStart) {
          await animateTo(endingStart, MEMORIES_SCROLL_MS);
          if (cancelled) return;
        }

        // Ending.
        await animateTo(getMax(), SCENE_TRANSITION_MS);
        if (cancelled) return;
        await wait(HOLD_END_MS);
        if (cancelled) return;

        // Fade suave e volta ao Hero.
        if (iframe) {
          iframe.style.transition = `opacity ${FADE_MS}ms ease`;
          iframe.style.opacity = "0";
        }
        await new Promise((r) => setTimeout(r, FADE_MS));
        setScrollTop(0);
        await new Promise((r) => setTimeout(r, 200));
        if (iframe) iframe.style.opacity = "1";
        await new Promise((r) => setTimeout(r, FADE_MS));
      }
    };

    let stopped = false;
    (async () => {
      if (reduce) return; // respeita prefers-reduced-motion
      await new Promise((r) => setTimeout(r, 800));
      if (cancelled) return;
      await waitForContent();
      if (cancelled) return;
      await warmup();
      if (cancelled || stopped) return;
      await loop();
    })();

    return () => {
      cancelled = true;
      stopped = true;
      cancelAnimationFrame(raf);
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
