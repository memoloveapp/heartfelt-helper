import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Vitrine — 3 cenas contemplativas dentro do celular da landing.
 * Hero → Carta → Memória. Cada cena permanece ~4.5s com fades muito longos.
 */

const PAPER = "#F4EFE6";
const PAPER_DEEP = "#EDE6D8";
const INK = "#2A2622";
const INK_SOFT = "#6B625A";
const GOLD = "#9C7B3E";
const NIGHT = "#0F0B08";
const SERIF = '"Fraunces", "Cormorant Garamond", Georgia, serif';

const SCENE_MS = 4500;
const FADE_MS = 1600;

const EASE = [0.22, 0.61, 0.36, 1] as const;

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: FADE_MS / 1000, ease: EASE },
};

function Hero() {
  return (
    <motion.div key="hero" {...fade} style={styles.scene(PAPER)}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2.2, ease: EASE, delay: 0.4 }}
        style={{ textAlign: "center", padding: "0 22px" }}
      >
        <div style={styles.eyebrow}>uma homenagem</div>
        <div style={styles.rule} />
        <div style={styles.headline}>
          <em>Aquilo que o tempo</em>
          <br />
          <em>jamais apaga.</em>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Letter() {
  return (
    <motion.div key="letter" {...fade} style={styles.scene(PAPER_DEEP)}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2.4, ease: EASE, delay: 0.5 }}
        style={{ padding: "0 24px", textAlign: "center" }}
      >
        <p style={styles.letter}>
          &ldquo;Você me ensinou <br />
          tudo o que sei <br />
          sobre <em style={{ color: GOLD }}>coragem</em>.&rdquo;
        </p>
      </motion.div>
    </motion.div>
  );
}

function Memory() {
  return (
    <motion.div key="memory" {...fade} style={{ ...styles.scene(NIGHT), padding: 0 }}>
      <motion.img
        src="images/casal-photo1.jpg"
        alt=""
        initial={{ scale: 1.12, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 5.5, ease: "easeOut" }}
        style={styles.photo}
      />
      <div style={styles.vignette} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: EASE, delay: 1.2 }}
        style={styles.caption}
      >
        <em>uma memória</em>
      </motion.div>
    </motion.div>
  );
}

const ORDER = ["hero", "letter", "memory"] as const;

export default function MiniHomenagem() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setIdx((i) => (i + 1) % ORDER.length), SCENE_MS);
    return () => window.clearInterval(t);
  }, []);

  const scene = ORDER[idx];
  return (
    <div style={styles.stage}>
      <AnimatePresence mode="sync">
        {scene === "hero" && <Hero />}
        {scene === "letter" && <Letter />}
        {scene === "memory" && <Memory />}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  stage: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    background: NIGHT,
    fontFamily: SERIF,
  } as React.CSSProperties,
  scene: (bg: string): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: bg,
  }),
  eyebrow: {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: 11,
    letterSpacing: "0.28em",
    textTransform: "uppercase" as const,
    color: INK_SOFT,
  },
  rule: {
    width: 32,
    height: 1,
    background: GOLD,
    margin: "18px auto",
    opacity: 0.7,
  } as React.CSSProperties,
  headline: {
    fontFamily: SERIF,
    fontSize: 20,
    lineHeight: 1.35,
    color: INK,
    fontWeight: 400,
    letterSpacing: "-0.005em",
  } as React.CSSProperties,
  letter: {
    fontFamily: SERIF,
    fontSize: 17,
    lineHeight: 1.7,
    color: INK,
    fontStyle: "italic",
    margin: 0,
  } as React.CSSProperties,
  photo: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "saturate(0.9) contrast(0.95) brightness(0.92)",
  } as React.CSSProperties,
  vignette: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.7) 100%)",
  } as React.CSSProperties,
  caption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 34,
    textAlign: "center",
    color: PAPER,
    fontFamily: SERIF,
    fontSize: 13,
    letterSpacing: "0.22em",
    textTransform: "lowercase" as const,
    opacity: 0.85,
  } as React.CSSProperties,
};
