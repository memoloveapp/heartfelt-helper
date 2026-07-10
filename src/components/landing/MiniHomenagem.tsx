import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

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
const SCENE_SETTLE_MS = 2_600;
const MEMORY_START_MS = 1_800;
const MEMORIES_SCROLL_MS = 17_000;
const RETURN_SETTLE_MS = 2_800;

type MockupScene = "hero" | "letter" | "music" | "memory" | "ending";

type MockupCommand =
  | {
      type: "memolove:mockup-command";
      action: "scrollToScene";
      scene: MockupScene;
      behavior?: ScrollBehavior;
      block?: ScrollLogicalPosition;
    }
  | {
      type: "memolove:mockup-command";
      action: "scrollThroughMemory";
    };

function isMockupReadyMessage(data: unknown): data is { type: "memolove:mockup-ready"; slug?: string } {
  return typeof data === "object" && data !== null && (data as { type?: unknown }).type === "memolove:mockup-ready";
}

export default function MiniHomenagem() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [mockupReady, setMockupReady] = useState(false);
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

  // A homenagem avisa quando as cenas reais já existem no iframe.
  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin) return;
      if (!isMockupReadyMessage(event.data)) return;
      if (event.data.slug && event.data.slug !== DEMO_SLUG) return;
      setLoaded(true);
      setMockupReady(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Auto-navegação: a Landing só envia comandos; quem rola é a homenagem real.
  useEffect(() => {
    if (!mockupReady) return;
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf = 0;
    let cancelled = false;

    const send = (message: MockupCommand) => {
      iframe.contentWindow?.postMessage(message, window.location.origin);
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

    const loop = async () => {
      while (!cancelled) {
        send({ type: "memolove:mockup-command", action: "scrollToScene", scene: "hero", behavior: "auto", block: "start" });
        await wait(HOLD_HERO_MS);
        if (cancelled) return;

        send({ type: "memolove:mockup-command", action: "scrollToScene", scene: "letter", behavior: "smooth", block: "start" });
        await wait(SCENE_SETTLE_MS + HOLD_SCENE_MS);
        if (cancelled) return;

        send({ type: "memolove:mockup-command", action: "scrollToScene", scene: "music", behavior: "smooth", block: "start" });
        await wait(SCENE_SETTLE_MS + HOLD_SCENE_MS);
        if (cancelled) return;

        send({ type: "memolove:mockup-command", action: "scrollToScene", scene: "memory", behavior: "smooth", block: "start" });
        await wait(MEMORY_START_MS);
        if (cancelled) return;

        send({ type: "memolove:mockup-command", action: "scrollThroughMemory" });
        await wait(MEMORIES_SCROLL_MS);
        if (cancelled) return;

        send({ type: "memolove:mockup-command", action: "scrollToScene", scene: "ending", behavior: "smooth", block: "start" });
        await wait(SCENE_SETTLE_MS + HOLD_END_MS);
        if (cancelled) return;

        send({ type: "memolove:mockup-command", action: "scrollToScene", scene: "hero", behavior: "smooth", block: "start" });
        await wait(RETURN_SETTLE_MS);
      }
    };

    (async () => {
      await wait(600);
      if (cancelled) return;
      await loop();
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [mockupReady]);

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
  } as CSSProperties,
  frame: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transformOrigin: "center center",
    border: "0",
    display: "block",
    pointerEvents: "none",
    background: "#0F0B08",
  } as CSSProperties,
};
