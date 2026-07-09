import { motion } from "motion/react";

/**
 * Vitrine — gravação de uma homenagem real sendo rolada dentro do celular.
 * A fotografia está SEMPRE visível. O texto apenas acompanha.
 * Um único scroll vertical, muito lento, em loop infinito.
 */

const PAPER = "#F4EFE6";
const GOLD = "#C9A15A";
const SERIF = '"Fraunces", "Cormorant Garamond", Georgia, serif';

const PHOTO_1 = "images/casal-photo1.jpg";
const PHOTO_2 = "images/casal-photo2.jpg";
const PHOTO_3 = "images/casal-photo3.jpg";

// 4 seções empilhadas (100% cada) + repetição do Hero no fim para loop suave.
// Cada seção fica ~5s parada; deslizes lentos entre elas.
const DURATION = 34; // segundos por ciclo
const KEYFRAMES = ["0%", "0%", "-100%", "-100%", "-200%", "-200%", "-300%", "-300%", "-400%"];
const TIMES = [0, 0.16, 0.22, 0.38, 0.44, 0.6, 0.66, 0.82, 0.88];

function Section({
  photo,
  children,
  overlay = "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.75) 100%)",
}: {
  photo: string;
  children: React.ReactNode;
  overlay?: string;
}) {
  return (
    <div style={styles.section}>
      <img src={photo} alt="" style={styles.photo} />
      <div style={{ ...styles.overlay, background: overlay }} />
      <div style={styles.content}>{children}</div>
    </div>
  );
}

export default function MiniHomenagem() {
  return (
    <div style={styles.stage}>
      <motion.div
        style={styles.strip}
        animate={{ y: KEYFRAMES }}
        transition={{
          duration: DURATION,
          times: TIMES,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "loop",
        }}
      >
        {/* HERO */}
        <Section photo={PHOTO_1}>
          <div style={styles.heroBlock}>
            <div style={styles.eyebrow}>uma homenagem</div>
            <div style={styles.rule} />
            <div style={styles.headline}>
              <em>Aquilo que o tempo</em>
              <br />
              <em>jamais apaga.</em>
            </div>
          </div>
        </Section>

        {/* CARTA — foto ao fundo, texto sobreposto */}
        <Section
          photo={PHOTO_2}
          overlay="linear-gradient(180deg, rgba(15,11,8,0.55) 0%, rgba(15,11,8,0.75) 100%)"
        >
          <div style={styles.letterBlock}>
            <p style={styles.letter}>
              &ldquo;Você me ensinou <br />
              tudo o que sei <br />
              sobre <em style={{ color: GOLD }}>coragem</em>.&rdquo;
            </p>
          </div>
        </Section>

        {/* MEMÓRIA 1 */}
        <Section photo={PHOTO_3}>
          <div style={styles.captionBlock}>
            <div style={styles.captionRule} />
            <div style={styles.caption}><em>a primeira memória</em></div>
          </div>
        </Section>

        {/* MEMÓRIA 2 */}
        <Section photo={PHOTO_1}>
          <div style={styles.captionBlock}>
            <div style={styles.captionRule} />
            <div style={styles.caption}><em>e todas as outras</em></div>
          </div>
        </Section>

        {/* Repetição do Hero para loop contínuo */}
        <Section photo={PHOTO_1}>
          <div style={styles.heroBlock}>
            <div style={styles.eyebrow}>uma homenagem</div>
            <div style={styles.rule} />
            <div style={styles.headline}>
              <em>Aquilo que o tempo</em>
              <br />
              <em>jamais apaga.</em>
            </div>
          </div>
        </Section>
      </motion.div>
    </div>
  );
}

const styles = {
  stage: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    background: "#0F0B08",
    fontFamily: SERIF,
  } as React.CSSProperties,
  strip: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    willChange: "transform",
  } as React.CSSProperties,
  section: {
    position: "relative",
    width: "100%",
    height: "100%",
    flexShrink: 0,
    overflow: "hidden",
  } as React.CSSProperties,
  photo: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "saturate(0.92) contrast(0.97) brightness(0.95)",
  } as React.CSSProperties,
  overlay: {
    position: "absolute",
    inset: 0,
  } as React.CSSProperties,
  content: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "0 22px 34px",
    color: PAPER,
    textAlign: "center",
  } as React.CSSProperties,
  heroBlock: {
    paddingBottom: 6,
  } as React.CSSProperties,
  eyebrow: {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: 10,
    letterSpacing: "0.32em",
    textTransform: "uppercase" as const,
    color: "rgba(244,239,230,0.75)",
  },
  rule: {
    width: 28,
    height: 1,
    background: GOLD,
    margin: "14px auto",
    opacity: 0.85,
  } as React.CSSProperties,
  headline: {
    fontFamily: SERIF,
    fontSize: 19,
    lineHeight: 1.32,
    color: PAPER,
    fontWeight: 400,
    textShadow: "0 2px 20px rgba(0,0,0,0.45)",
  } as React.CSSProperties,
  letterBlock: {
    alignSelf: "center",
    margin: "auto 0",
    paddingBottom: 0,
  } as React.CSSProperties,
  letter: {
    fontFamily: SERIF,
    fontSize: 17,
    lineHeight: 1.75,
    color: PAPER,
    fontStyle: "italic",
    margin: 0,
    textShadow: "0 2px 24px rgba(0,0,0,0.5)",
  } as React.CSSProperties,
  captionBlock: {
    paddingBottom: 4,
  } as React.CSSProperties,
  captionRule: {
    width: 22,
    height: 1,
    background: GOLD,
    margin: "0 auto 12px",
    opacity: 0.9,
  } as React.CSSProperties,
  caption: {
    fontFamily: SERIF,
    fontSize: 13,
    letterSpacing: "0.02em",
    color: PAPER,
    textShadow: "0 2px 16px rgba(0,0,0,0.5)",
  } as React.CSSProperties,
};
