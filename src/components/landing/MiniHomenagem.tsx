import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Mini-homenagem que roda em loop dentro do mockup do celular da landing.
 * Reproduz uma versão reduzida do produto real: Hero → Carta → Música →
 * Foto 1 → Foto 2 → Ending, com fades suaves e reinício automático.
 */

const PAPER = "#F4EFE6";
const PAPER_DEEP = "#EDE6D8";
const INK = "#2A2622";
const INK_SOFT = "#6B625A";
const GOLD = "#9C7B3E";
const NIGHT = "#0F0B08";
const SERIF = '"Fraunces", "Cormorant Garamond", Georgia, serif';

const SCENE_MS = 2200;
const FADE_MS = 900;

type SceneKey = "hero" | "letter" | "music" | "photo1" | "photo2" | "ending";
const ORDER: SceneKey[] = ["hero", "letter", "music", "photo1", "photo2", "ending"];

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: FADE_MS / 1000, ease: [0.22, 0.61, 0.36, 1] as const },
};

function Hero() {
  return (
    <motion.div key="hero" {...fade} style={styles.scene(PAPER)}>
      <div style={{ textAlign: "center", padding: "0 18px" }}>
        <div style={styles.eyebrow}>Uma homenagem para</div>
        <div style={styles.heroName}>meu pai</div>
        <div style={styles.rule} />
        <div style={styles.heroSub}>
          <em>Aquilo que o tempo</em>
          <br />
          <em>jamais apaga.</em>
        </div>
      </div>
    </motion.div>
  );
}

function Letter() {
  return (
    <motion.div key="letter" {...fade} style={styles.scene(PAPER_DEEP)}>
      <div style={{ padding: "22px 20px", textAlign: "center" }}>
        <div style={styles.eyebrow}>Carta</div>
        <p style={styles.letterText}>
          &ldquo;Você me ensinou tudo <br /> o que sei sobre coragem, <br />
          amor e silêncio. <br />
          <em style={{ color: GOLD }}>Obrigado, pai.</em>&rdquo;
        </p>
      </div>
    </motion.div>
  );
}

function Music() {
  return (
    <motion.div key="music" {...fade} style={styles.scene(NIGHT)}>
      <div style={{ textAlign: "center", color: PAPER, padding: "0 18px" }}>
        <div style={{ ...styles.eyebrow, color: "rgba(243,236,221,0.55)" }}>Música</div>
        <div style={{ ...styles.heroName, color: PAPER, fontSize: 22 }}>
          <em>Nossa canção</em>
        </div>
        <div style={styles.rule} />
        <div style={styles.player}>
          <div style={styles.playBtn}>▶</div>
          <div style={styles.wave}>
            {[10, 18, 26, 14, 22, 12, 20].map((h, i) => (
              <motion.span
                key={i}
                animate={{ height: [h, h + 8, h] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.08 }}
                style={styles.waveBar}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Photo({ src, caption }: { src: string; caption: string }) {
  return (
    <motion.div key={src} {...fade} style={{ ...styles.scene(NIGHT), padding: 0 }}>
      <motion.img
        src={src}
        alt=""
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 3.2, ease: "easeOut" }}
        style={styles.photo}
      />
      <div style={styles.photoVignette} />
      <div style={styles.photoCaption}>
        <em>{caption}</em>
      </div>
    </motion.div>
  );
}

function Ending() {
  return (
    <motion.div key="ending" {...fade} style={styles.scene(NIGHT)}>
      <div style={{ textAlign: "center", color: PAPER, padding: "0 20px" }}>
        <div style={styles.heart}>♥</div>
        <div style={{ ...styles.heroSub, color: PAPER, marginTop: 14 }}>
          <em>Memórias que</em>
          <br />
          <em>o tempo não apaga.</em>
        </div>
        <div style={{ ...styles.rule, background: "rgba(201,161,90,0.55)" }} />
        <div style={{ ...styles.eyebrow, color: "rgba(243,236,221,0.55)" }}>
          feito com MemoLove
        </div>
      </div>
    </motion.div>
  );
}

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
        {scene === "music" && <Music />}
        {scene === "photo1" && (
          <Photo src="images/casal-photo1.jpg" caption="Nossa primeira memória" />
        )}
        {scene === "photo2" && (
          <Photo src="images/casal-photo2.jpg" caption="Momentos que ficam" />
        )}
        {scene === "ending" && <Ending />}
      </AnimatePresence>

      {/* progress dots */}
      <div style={styles.dots}>
        {ORDER.map((_, i) => (
          <span
            key={i}
            style={{
              ...styles.dot,
              opacity: i === idx ? 1 : 0.28,
              width: i === idx ? 14 : 5,
            }}
          />
        ))}
      </div>
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
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    color: INK_SOFT,
    marginBottom: 10,
  },
  heroName: {
    fontFamily: SERIF,
    fontSize: 30,
    lineHeight: 1.05,
    color: INK,
    fontWeight: 500,
    letterSpacing: "-0.01em",
  },
  rule: {
    width: 42,
    height: 1,
    background: GOLD,
    margin: "14px auto",
    opacity: 0.75,
  } as React.CSSProperties,
  heroSub: {
    fontFamily: SERIF,
    fontSize: 15,
    lineHeight: 1.45,
    color: INK,
  },
  letterText: {
    fontFamily: SERIF,
    fontSize: 14.5,
    lineHeight: 1.7,
    color: INK,
    fontStyle: "italic",
    margin: 0,
  },
  player: {
    marginTop: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  } as React.CSSProperties,
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: GOLD,
    color: NIGHT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    paddingLeft: 3,
  } as React.CSSProperties,
  wave: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    height: 32,
  } as React.CSSProperties,
  waveBar: {
    display: "block",
    width: 3,
    background: "rgba(243,236,221,0.75)",
    borderRadius: 2,
  } as React.CSSProperties,
  photo: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "saturate(0.92) contrast(0.96)",
  } as React.CSSProperties,
  photoVignette: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.65) 100%)",
  } as React.CSSProperties,
  photoCaption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 28,
    textAlign: "center",
    color: PAPER,
    fontFamily: SERIF,
    fontSize: 14,
    letterSpacing: "0.02em",
  } as React.CSSProperties,
  heart: {
    fontSize: 28,
    color: GOLD,
  } as React.CSSProperties,
  dots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    gap: 5,
    zIndex: 3,
  } as React.CSSProperties,
  dot: {
    display: "block",
    height: 4,
    borderRadius: 4,
    background: PAPER,
    transition: "all 0.5s ease",
  } as React.CSSProperties,
};
