import { useEffect, useRef, useState, RefObject } from "react";
import { motion, useReducedMotion, useInView } from "motion/react";

/* MemoryScene — narrativa cinematográfica única
   Toda foto (01 → 07) segue o mesmo ritmo de troca:
   a foto atual perde protagonismo lentamente enquanto a próxima nasce.
   Sem slider, sem carrossel, sem galeria. */

const SERIF = '"Cormorant Garamond", "EB Garamond", Georgia, serif';
const SCRIPT = '"Great Vibes", "Allura", "Dancing Script", cursive';

const IVORY = "#F3ECDD";
const IVORY_SOFT = "#EFE7D6";
const GOLD = "#C9A15A";
const GOLD_SOFT = "rgba(201,161,90,0.55)";
const EASE_SOFT = [0.22, 0.61, 0.36, 1] as const;

const TOTAL = 7;

const CAPTIONS = [
  "Você é meu lugar favorito.",
  "Com você, cada momento vira lembrança.",
  "Existem sorrisos que o tempo não consegue apagar.",
  "Alguns instantes são para sempre.",
  "Nos detalhes, moram os afetos mais antigos.",
  "O que se vive com amor, permanece.",
  "E ainda assim, eu escolheria tudo de novo.",
];

type MemoryPhotoProps = {
  src: string;
  caption: string;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  reduce: boolean;
  selfRef: RefObject<HTMLDivElement | null>;
  nextRef: RefObject<HTMLDivElement | null> | null;
};

function MemoryPhoto({
  src,
  caption,
  index,
  isFirst,
  isLast,
  reduce,
  selfRef,
  nextRef,
}: MemoryPhotoProps) {
  // A próxima foto entrando em cena faz a atual perder protagonismo — de forma
  // suave: só começa a ceder quando a próxima realmente entra em cena.
  const nextInView = useInView(nextRef ?? { current: null }, {
    margin: "-60% 0px -15% 0px",
  });
  const dim = !isLast && nextInView;

  const fill = `${((index + 1) / TOTAL) * 100}%`;
  const rotate = index % 2 === 0 ? "-1.35deg" : "1.35deg";

  // Vida sutil na fotografia — ken-burns quase imperceptível.
  // Detecta orientação no load e dispara UMA vez, 600ms após a entrada.
  const imgRef = useRef<HTMLImageElement>(null);
  const [orient, setOrient] = useState<"vertical" | "horizontal" | "square" | null>(null);
  const [alive, setAlive] = useState(false);
  const inView = useInView(selfRef, { once: true, margin: "-12% 0px" });

  useEffect(() => {
    if (reduce || !inView || alive) return;
    // 1.35s (entrada) + 600ms
    const t = setTimeout(() => setAlive(true), 1350 + 600);
    return () => clearTimeout(t);
  }, [inView, reduce, alive]);

  const handleImgLoad = () => {
    const el = imgRef.current;
    if (!el) return;
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    if (!w || !h) return;
    const r = w / h;
    if (r > 1.08) setOrient("horizontal");
    else if (r < 0.92) setOrient("vertical");
    else setOrient("square");
  };

  const imgAnimate = (() => {
    if (reduce || !alive || !orient) return { scale: 1, x: 0 };
    if (orient === "vertical") return { scale: 1.015, x: 0 };
    if (orient === "square") return { scale: 1.01, x: 0 };
    return { scale: 1.008, x: 4 }; // horizontal
  })();

  return (
    <motion.div
      ref={selfRef}
      animate={
        reduce
          ? {}
          : {
              opacity: dim ? 0.78 : 1,
              filter: dim
                ? "brightness(0.92) saturate(0.96)"
                : "brightness(1) saturate(1)",
            }
      }
      transition={{ duration: 1.8, ease: EASE_SOFT }}
      style={{ willChange: "opacity, filter" }}
    >
      <div className="ms-stage" style={{ marginTop: isFirst ? 44 : 96 }}>
        {isFirst && (
          <>
            {/* Fotos secundárias desfocadas — só ao redor da primeira, direção aprovada */}
            <div className="ms-side left placeholder" aria-hidden />
            <div className="ms-side right placeholder" aria-hidden />
          </>
        )}

        <motion.div
          className="ms-frame"
          style={{ ["--ms-rot" as string]: rotate }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.985 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 1.35, ease: EASE_SOFT }}
        >
          <div className="ms-frame-inner">
            <motion.img
              ref={imgRef}
              src={src}
              alt={`Memória ${index + 1}`}
              loading="eager"
              decoding="async"
              onLoad={handleImgLoad}
              initial={{ scale: 1, x: 0 }}
              animate={imgAnimate}
              transition={{ duration: 11, ease: [0.22, 1, 0.36, 1] }}
              style={{ willChange: alive ? "transform" : "auto", transformOrigin: "center center" }}
            />
          </div>
        </motion.div>
      </div>

      <div className="ms-caption-wrap">
        <motion.p
          className="ms-caption"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          /* imagem primeiro, emoção depois: ~120ms após a foto */
          transition={{ duration: 0.95, ease: EASE_SOFT, delay: 0.12 }}
        >
          {caption}
        </motion.p>
        <motion.span
          className="ms-heart"
          aria-hidden
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.9 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.8, ease: EASE_SOFT, delay: 0.28 }}
        >
          ♡
        </motion.span>
        <motion.span
          className="ms-index"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.78 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.8, ease: EASE_SOFT, delay: 0.28 }}
        >
          <span className="num">{String(index + 1).padStart(2, "0")}</span> •{" "}
          {String(TOTAL).padStart(2, "0")}
        </motion.span>
      </div>

      {/* Barra = jornada pelas memórias. O marcador avança em cada foto. */}
      <motion.div
        className="ms-bar"
        aria-hidden
        style={{ ["--ms-fill" as string]: fill }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-12% 0px" }}
        transition={{ duration: 0.9, ease: EASE_SOFT, delay: 0.5 }}
      />
    </motion.div>
  );
}

export function MemoryScene({ photos }: { photos: string[] }) {
  const clean = photos.filter(Boolean).slice(0, TOTAL);
  const reduce = useReducedMotion() ?? false;

  // Pré-carrega TODAS as fotos assim que as URLs chegam,
  // garantindo que nenhuma memória apareça vazia durante o scroll.
  useEffect(() => {
    clean.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clean.join("|")]);

  // Refs fixos — a quantidade de fotos é <= TOTAL (7). Refs estáveis por render.
  const r0 = useRef<HTMLDivElement>(null);
  const r1 = useRef<HTMLDivElement>(null);
  const r2 = useRef<HTMLDivElement>(null);
  const r3 = useRef<HTMLDivElement>(null);
  const r4 = useRef<HTMLDivElement>(null);
  const r5 = useRef<HTMLDivElement>(null);
  const r6 = useRef<HTMLDivElement>(null);
  const refs = [r0, r1, r2, r3, r4, r5, r6];

  if (clean.length === 0) return null;

  return (
    <section className="ms-scene" aria-label="Memórias">
      <style>{`
        .ms-scene {
          position: relative;
          width: 100%;
          padding: 48px 0 20px;
          color: ${IVORY};
          overflow: hidden;
          background: transparent;
        }
        @media (min-width: 768px) {
          .ms-scene { padding: 88px 0 24px; }
        }
        .ms-scene::before {
          display: none;
          pointer-events: none;
        }
        .ms-scene::after { display: none; }
        .ms-fade-in { display: none; }

        .ms-inner {
          position: relative;
          z-index: 2;
          max-width: 560px;
          margin: 0 auto;
          padding: 0 14px;
          text-align: center;
        }

        .ms-title {
          margin: 0;
          font-family: ${SERIF};
          font-weight: 500;
          font-size: clamp(38px, 10vw, 56px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: ${IVORY};
        }
        .ms-title .accent { color: ${GOLD}; font-style: italic; }
        .ms-rule {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin: 16px auto 12px; max-width: 220px;
        }
        .ms-rule-line { flex: 1; height: 1px; background: ${GOLD_SOFT}; }
        .ms-rule-dot { color: ${GOLD}; font-size: 8px; }
        .ms-sub {
          margin: 0 auto;
          max-width: 380px;
          font-family: ${SERIF};
          font-size: 20px;
          line-height: 1.45;
          color: ${IVORY_SOFT};
          opacity: 0.9;
        }

        .ms-stage {
          position: relative;
          margin: 44px auto 60px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        /* Halo warm-brown por trás do palco removido — pintava um retângulo
           amarronzado sobre o fundo compartilhado. Sem background aqui. */
        .ms-stage::before { display: none; }
        .ms-stage > * { position: relative; z-index: 1; }

        .ms-side {
          position: absolute;
          top: 50%;
          width: 40%;
          aspect-ratio: 3 / 4;
          border-radius: 4px;
          overflow: hidden;
          background-size: cover;
          background-position: center;
          filter: blur(16px) brightness(0.42) saturate(0.65);
          opacity: 0.18;
          box-shadow: 0 40px 70px -25px rgba(0,0,0,0.95);
        }
        .ms-side.left { left: -6%; transform: translateY(-50%) rotate(-9deg); }
        .ms-side.right { right: -6%; transform: translateY(-50%) rotate(8deg); }
        .ms-side.placeholder { background: transparent; }

        .ms-frame {
          position: relative;
          display: inline-block;
          border-radius: 18px;
          padding: 1.5px;
          background: linear-gradient(158deg,
            rgba(220,180,115,0.55) 0%,
            rgba(160,120,70,0.20) 40%,
            rgba(110,80,45,0.14) 68%,
            rgba(210,170,100,0.45) 100%);
          transform: rotate(var(--ms-rot, -1.35deg));
          transform-origin: center 60%;
          box-shadow:
            0 2px 4px -3px rgba(0,0,0,0.35),
            0 18px 30px -22px rgba(0,0,0,0.45),
            -14px 46px 60px -40px rgba(0,0,0,0.42),
            18px 58px 80px -45px rgba(0,0,0,0.5),
            0 90px 130px -70px rgba(0,0,0,0.55),
            inset 0 0 0 0.5px rgba(255,220,170,0.08);
        }
        .ms-frame-inner {
          position: relative;
          border-radius: 16.5px;
          overflow: hidden;
          background: #050403;
          box-shadow: inset 0 0 0 0.5px rgba(0,0,0,0.5);
          font-size: 0;
        }
        .ms-frame img {
          display: block;
          width: auto; height: auto;
          max-width: min(80vw, 460px);
          max-height: 74vh;
          background: #050403;
        }
        @media (min-width: 768px) {
          .ms-frame img { max-width: 460px; max-height: 70vh; }
        }
        .ms-frame::after {
          content: "";
          position: absolute; inset: 0;
          border-radius: 18px;
          background: radial-gradient(55% 35% at 88% -5%, rgba(255,210,150,0.07), transparent 70%);
          pointer-events: none;
        }

        .ms-caption-wrap {
          margin-top: 26px;
          display: flex; flex-direction: column; align-items: center; gap: 0;
        }
        .ms-caption {
          margin: 0;
          font-family: ${SCRIPT};
          font-size: clamp(24px, 6.8vw, 30px);
          line-height: 1.25;
          color: ${IVORY};
          font-weight: 400;
        }
        .ms-heart { color: ${GOLD}; font-size: 16px; opacity: 0.9; line-height: 1; margin-top: 10px; }
        .ms-index {
          font-family: ${SERIF};
          font-size: 14px; letter-spacing: 0.28em;
          color: ${IVORY_SOFT}; opacity: 0.78; margin-top: 8px;
        }
        .ms-index .num { color: ${GOLD}; }

        .ms-bar {
          margin: 14px auto 0;
          width: 62%;
          max-width: 260px;
          height: 0.5px;
          background: rgba(255,255,255,0.05);
          position: relative;
          overflow: hidden;
        }
        .ms-bar::after {
          content: "";
          position: absolute; left: 0; top: 0; bottom: 0;
          width: var(--ms-fill, 14%);
          background: linear-gradient(90deg, rgba(201,161,90,0.15), rgba(201,161,90,0.6));
          opacity: 0.75;
          transition: width 1.6s cubic-bezier(0.22,0.61,0.36,1);
        }

        @media (min-width: 640px) { .ms-side { width: 42%; } }
      `}</style>

      <div className="ms-fade-in" aria-hidden />

      <div className="ms-inner">
        <motion.h2
          className="ms-title"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px 45% 0px" }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        >
          Memórias que <br /> o tempo <span className="accent">não apaga.</span>
        </motion.h2>

        <div className="ms-rule" aria-hidden>
          <span className="ms-rule-line" />
          <span className="ms-rule-dot">✦</span>
          <span className="ms-rule-line" />
        </div>

        <motion.p
          className="ms-sub"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px 42% 0px" }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.09 }}
        >
          Cada foto guarda um pedaço da nossa história.
        </motion.p>

        {clean.map((src, i) => (
          <MemoryPhoto
            key={i}
            src={src}
            caption={CAPTIONS[i] ?? CAPTIONS[CAPTIONS.length - 1]}
            index={i}
            isFirst={i === 0}
            isLast={i === clean.length - 1}
            reduce={reduce}
            selfRef={refs[i]}
            nextRef={i < clean.length - 1 ? refs[i + 1] : null}
          />
        ))}
      </div>
    </section>
  );
}
