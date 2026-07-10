import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

/**
 * Janela para a homenagem oficial dentro do mockup do celular.
 * Renderiza /homenagem/<slug>?mockup=true num iframe com dimensões
 * reais (100% da tela do celular). A rolagem acontece exclusivamente
 * dentro do iframe — a Landing nunca é movida.
 */

const DEMO_SLUG = "06ab45c269";

type MockupScene = "hero" | "letter" | "music" | "memory" | "ending";

type MockupCommand = {
  type: "memolove:mockup-command";
  action: "startAutoScroll" | "stopAutoScroll";
};

function isMockupReadyMessage(data: unknown): data is { type: "memolove:mockup-ready"; slug?: string } {
  return typeof data === "object" && data !== null && (data as { type?: unknown }).type === "memolove:mockup-ready";
}

const REQUIRED_SCENES: MockupScene[] = ["hero", "letter", "music", "memory", "ending"];

export default function MiniHomenagem() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [, setLoaded] = useState(false);
  const [mockupReady, setMockupReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const visibleRef = useRef(true);

  useEffect(() => { visibleRef.current = visible; }, [visible]);

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

  useEffect(() => {
    if (mockupReady) return;
    let raf = 0;
    let cancelled = false;
    const startedAt = performance.now();
    const check = () => {
      if (cancelled || mockupReady) return;
      const doc = iframeRef.current?.contentDocument;
      const hasAllScenes = !!doc && REQUIRED_SCENES.every((scene) =>
        doc.querySelector(`[data-memolove-scene="${scene}"]`),
      );
      if (hasAllScenes) {
        setLoaded(true);
        setMockupReady(true);
        return;
      }
      if (performance.now() - startedAt < 20_000) {
        raf = requestAnimationFrame(check);
      }
    };
    raf = requestAnimationFrame(check);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [mockupReady]);

  useEffect(() => {
    if (!mockupReady) return;
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let cancelled = false;

    const send = (message: MockupCommand) => {
      iframe.contentWindow?.postMessage(message, window.location.origin);
    };

    const syncAutoScroll = () => {
      if (cancelled) return;
      send({ type: "memolove:mockup-command", action: visibleRef.current ? "startAutoScroll" : "stopAutoScroll" });
    };

    const interval = window.setInterval(syncAutoScroll, 1_500);
    window.setTimeout(syncAutoScroll, 600);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      send({ type: "memolove:mockup-command", action: "stopAutoScroll" });
    };
  }, [mockupReady]);

  return (
    <div ref={stageRef} className="mini-homenagem-screen" style={styles.stage}>
      <iframe
        ref={iframeRef}
        src={`/homenagem/${DEMO_SLUG}?mockup=true`}
        title="Homenagem MemoLove — demonstração"
        onLoad={() => setLoaded(true)}
        scrolling="no"
        tabIndex={-1}
        aria-hidden="true"
        className="mini-homenagem-frame"
        style={styles.frame}
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
    borderRadius: "inherit",
  } as CSSProperties,
  frame: {
    width: "100%",
    height: "100%",
    display: "block",
    border: 0,
    background: "#0F0B08",
    pointerEvents: "none",
  } as CSSProperties,
};
