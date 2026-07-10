import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { HomenagemExperience } from "@/components/homenagem/HomenagemExperience";

/**
 * Mockup do celular na Landing: renderiza a homenagem oficial diretamente
 * (sem iframe) dentro de um viewport lógico de 390 × 844 escalonado para
 * caber na moldura visual do celular. O scroll acontece exclusivamente
 * dentro do container interno — a Landing nunca se move.
 */

const DEMO_SLUG = "06ab45c269";
const LOGICAL_WIDTH = 390;
const LOGICAL_HEIGHT = 844;

export default function MiniHomenagem() {
  const screenRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const s = Math.min(w / LOGICAL_WIDTH, h / LOGICAL_HEIGHT);
      setScale(s);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stageStyle: CSSProperties = {
    width: LOGICAL_WIDTH,
    height: LOGICAL_HEIGHT,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    position: "absolute",
    top: 0,
    left: 0,
  };

  return (
    <div ref={screenRef} className="mini-phone-screen" style={styles.screen}>
      <div className="mini-logical-stage" style={stageStyle}>
        <HomenagemExperience slug={DEMO_SLUG} landingDemo />
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
    background: "#0F0B08",
    borderRadius: "inherit",
  } as CSSProperties,
};
