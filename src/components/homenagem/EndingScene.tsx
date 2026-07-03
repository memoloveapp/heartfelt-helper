import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const SERIF = '"Cormorant Garamond", "Fraunces", Georgia, serif';
const SANS = '"Karla", "Inter", system-ui, -apple-system, sans-serif';
const IVORY = "#EFE6D2";
const IVORY_SOFT = "#C9BE9F";
const GOLD = "#D9B166";
const GOLD_WARM = "#E6C079";
const EASE = [0.16, 0.84, 0.24, 1] as const;

export function EndingScene({ sender: _sender }: { sender: string }) {
  const reduce = useReducedMotion();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFadeOut(true), 14000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.section
      aria-label="Encerramento"
      initial={{ opacity: 1 }}
      animate={{ opacity: fadeOut ? 0.35 : 1 }}
      transition={{ duration: 6, ease: "linear" }}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        background: "#030303",
        color: IVORY,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 24px",
        isolation: "isolate",
      }}
    >
      {/* Feixe de luz superior — muito sutil */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(460px, 80%)",
          height: 420,
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(230,192,121,0.09) 0%, rgba(230,192,121,0.03) 30%, rgba(0,0,0,0) 65%)",
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />
      {/* Brilho atmosférico inferior — quase imperceptível */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: -200,
          left: "50%",
          transform: "translateX(-50%)",
          width: "140%",
          height: 300,
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(217,177,102,0.04) 0%, rgba(0,0,0,0) 60%)",
          pointerEvents: "none",
        }}
      />

      {/* Partículas douradas */}
      <Particles />

      <div
        style={{
          position: "relative",
          maxWidth: 560,
          width: "100%",
          textAlign: "center",
          zIndex: 2,
        }}
      >
        {/* Frase 1 */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2.2, ease: EASE, delay: 0.4 }}
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: "clamp(26px, 6.4vw, 40px)",
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
            color: IVORY,
          }}
        >
          Os momentos passam.
        </motion.p>

        {/* Frase 2 */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2.2, ease: EASE, delay: 2.6 }}
          style={{
            margin: "12px 0 0",
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: "clamp(26px, 6.4vw, 40px)",
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
            color: IVORY,
          }}
        >
          O amor{" "}
          <span style={{ color: GOLD_WARM, fontStyle: "italic" }}>
            permanece.
          </span>
        </motion.p>

        {/* Linha + coração pequeno */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.4, ease: EASE, delay: 4.6 }}
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <span
            style={{
              display: "block",
              width: 72,
              height: 1,
              background:
                "linear-gradient(90deg, rgba(217,177,102,0) 0%, rgba(217,177,102,0.75) 100%)",
            }}
          />
          <SmallHeart />
          <span
            style={{
              display: "block",
              width: 72,
              height: 1,
              background:
                "linear-gradient(90deg, rgba(217,177,102,0.75) 0%, rgba(217,177,102,0) 100%)",
            }}
          />
        </motion.div>

        {/* Coração grande */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 3.2, ease: EASE, delay: 5.6 }}
          style={{
            marginTop: 36,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <motion.div
            animate={
              reduce ? undefined : { scale: [1, 1.03, 1] }
            }
            transition={{
              duration: 3,
              ease: EASE,
              delay: 9.2,
              times: [0, 0.5, 1],
              repeat: 0,
            }}
            style={{ transformOrigin: "center" }}
          >
            <BigHeart />
          </motion.div>
        </motion.div>

        {/* Sussurro */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2.4, ease: EASE, delay: 8.6 }}
          style={{
            margin: "40px 0 0",
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "clamp(15px, 3.6vw, 19px)",
            letterSpacing: "0.01em",
            color: IVORY_SOFT,
          }}
        >
          Até a próxima memória.
        </motion.p>

        {/* Assinatura MemoLove */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 3, ease: EASE, delay: 10.8 }}
          style={{
            marginTop: 88,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <SignatureHeart />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                display: "block",
                width: 28,
                height: 1,
                background:
                  "linear-gradient(90deg, rgba(217,177,102,0) 0%, rgba(217,177,102,0.6) 100%)",
              }}
            />
            <span
              style={{
                fontFamily: SANS,
                fontSize: 10,
                letterSpacing: "0.55em",
                textTransform: "uppercase",
                color: GOLD,
                opacity: 0.85,
              }}
            >
              memolove
            </span>
            <span
              style={{
                display: "block",
                width: 28,
                height: 1,
                background:
                  "linear-gradient(90deg, rgba(217,177,102,0.6) 0%, rgba(217,177,102,0) 100%)",
              }}
            />
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

function SmallHeart() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s-7-4.5-9.5-9.2C.9 8.5 2.6 5 6 5c2 0 3.3 1 4 2.2C10.7 6 12 5 14 5c3.4 0 5.1 3.5 3.5 6.8C19 16.5 12 21 12 21z"
        fill={GOLD_WARM}
        style={{ filter: "drop-shadow(0 0 2px rgba(230,192,121,0.35))" }}
      />
    </svg>
  );
}

function SignatureHeart() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20s-6.5-4.2-8.8-8.5C1.7 8.4 3.2 5.4 6.2 5.4c1.9 0 3.1 1 3.8 2.1C10.7 6.4 11.9 5.4 13.8 5.4c3 0 4.5 3 3 6.1C18.5 15.8 12 20 12 20z"
        stroke={GOLD}
        strokeWidth="1"
        strokeLinejoin="round"
        opacity="0.75"
      />
    </svg>
  );
}

function BigHeart() {
  return (
    <svg
      width="176"
      height="160"
      viewBox="0 0 200 180"
      fill="none"
      aria-hidden
      style={{
        filter:
          "drop-shadow(0 0 8px rgba(217,177,102,0.45)) drop-shadow(0 0 20px rgba(217,177,102,0.18))",
      }}
    >
      <defs>
        <linearGradient id="ehg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F1D08A" />
          <stop offset="55%" stopColor={GOLD_WARM} />
          <stop offset="100%" stopColor="#B48A45" />
        </linearGradient>
      </defs>
      <path
        d="M100 168 C 40 128, 8 92, 8 58 C 8 30, 30 12, 56 12 C 76 12, 92 24, 100 42 C 108 24, 124 12, 144 12 C 170 12, 192 30, 192 58 C 192 92, 160 128, 100 168 Z"
        stroke="url(#ehg)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function Particles() {
  // Deterministic positions to avoid hydration mismatch
  const pts = [
    { l: 14, t: 26, s: 1.2, o: 0.18, d: 8 },
    { l: 84, t: 22, s: 1, o: 0.14, d: 9 },
    { l: 26, t: 72, s: 1, o: 0.16, d: 8.5 },
    { l: 76, t: 78, s: 1.2, o: 0.18, d: 10 },
    { l: 50, t: 90, s: 0.9, o: 0.12, d: 7.5 },
    { l: 8, t: 54, s: 0.9, o: 0.14, d: 9.5 },
  ];
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {pts.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, p.o, 0] }}
          transition={{
            duration: p.d,
            repeat: Infinity,
            delay: (i * 0.7) % 4,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: `${p.l}%`,
            top: `${p.t}%`,
            width: p.s,
            height: p.s,
            borderRadius: "50%",
            background: GOLD_WARM,
            boxShadow: `0 0 ${p.s * 2}px rgba(230,192,121,0.35)`,
          }}
        />
      ))}
    </div>
  );
}
