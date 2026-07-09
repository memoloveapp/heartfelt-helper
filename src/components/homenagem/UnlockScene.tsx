import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";

/* UnlockScene — capítulo final da /previa.
   Nunca deve parecer landing/checkout: é uma continuação da homenagem.
   Entrada em cascata: headline → texto → grupos → CTA. */

const SERIF = '"Cormorant Garamond", "EB Garamond", Georgia, serif';
const SCRIPT = '"Great Vibes", "Allura", "Dancing Script", cursive';
const GOLD = "#C9A15A";
const GOLD_SOFT = "#B8924A";
const IVORY = "#F3ECDD";
const EASE = [0.22, 0.61, 0.36, 1] as const;

const GROUP_MEMORY = [
  "Hero completo",
  "Carta personalizada",
  "Trilha sonora",
  "Todas as memórias",
  "Encerramento completo",
];

const GROUP_GIFT = [
  "Porta-retrato premium",
  "Cartão premium",
  "Tag para presente",
  "Folha A4 pronta para impressão",
];

export function UnlockScene({ slug }: { slug: string }) {
  const reduce = useReducedMotion();
  const [buying, setBuying] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const unlock = async () => {
    if (buying || !slug) return;
    setBuying(true);
    setErr(null);
    try {
      const { data: mem, error } = await supabase
        .from("memories")
        .select("id, slug")
        .eq("slug", slug.trim())
        .maybeSingle();
      if (error || !mem?.id) {
        setErr("Não foi possível identificar sua homenagem.");
        setBuying(false);
        return;
      }
      try {
        localStorage.setItem("memolove:lastSlug", mem.slug);
        localStorage.setItem("pending_purchase_slug", mem.slug);
      } catch {}
      const res = await fetch("/api/public/create-mercado-pago-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoryId: mem.id, slug: mem.slug }),
      });
      const j = await res.json();
      if (!res.ok || !j?.init_point) {
        setErr("Não conseguimos abrir o pagamento. Tente novamente em instantes.");
        setBuying(false);
        return;
      }
      window.location.href = j.init_point as string;
    } catch {
      setErr("Erro de conexão. Tente novamente.");
      setBuying(false);
    }
  };

  // Cascata — mesmos ritmos das outras cenas
  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 22, filter: "blur(8px)" },
    whileInView: reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" },
    viewport: { once: true, margin: "-10% 0px" },
    transition: { duration: 1.6, ease: EASE, delay },
  });

  return (
    <section className="unlock-scene" aria-label="Continuar homenagem">
      <style>{`
        .unlock-scene {
          position: relative;
          width: 100%;
          padding: 0 22px 120px;
          color: ${IVORY};
          background: transparent;
          text-align: center;
          overflow: hidden;
        }
        .uk-inner {
          position: relative;
          z-index: 2;
          max-width: 520px;
          margin: 0 auto;
        }

        .uk-heart {
          display: block;
          margin: 0 auto 32px;
          color: ${GOLD};
          opacity: 0.9;
          filter: drop-shadow(0 0 6px rgba(201,161,90,0.4));
        }

        .uk-title {
          margin: 0 auto;
          width: min(100%, 560px);
          font-family: ${SERIF};
          font-weight: 500;
          font-size: clamp(30px, 8.4vw, 54px);
          line-height: 1.08;
          letter-spacing: -0.02em;
          color: ${IVORY};
          text-wrap: balance;
        }
        .uk-title-line {
          display: block;
          white-space: nowrap;
        }
        .uk-title em {
          font-style: italic;
          font-weight: 500;
          color: ${GOLD};
        }
        .uk-rule {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; margin: 30px auto 30px; max-width: 200px;
        }
        .uk-rule span { flex: 1; height: 1px; background: rgba(201,161,90,0.4); }
        .uk-rule i { color: ${GOLD}; font-style: normal; text-shadow: 0 0 6px rgba(216,180,114,0.35); }

        .uk-sub {
          margin: 0 auto 64px;
          max-width: 420px;
          font-family: ${SERIF};
          font-size: clamp(18px, 3.4vw, 21px);
          line-height: 1.55;
          color: rgba(243,236,221,0.86);
          font-style: italic;
        }

        .uk-groups {
          display: grid;
          gap: 44px;
          margin: 0 auto 68px;
          max-width: 360px;
          text-align: left;
        }
        .uk-group-title {
          font-family: "Karla", sans-serif;
          font-size: 10.5px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: ${GOLD};
          opacity: 0.72;
          margin: 0 0 18px;
          text-align: center;
        }
        .uk-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 14px;
        }
        .uk-list li {
          display: flex;
          align-items: center;
          gap: 14px;
          font-family: ${SERIF};
          font-size: 17px;
          color: rgba(243,236,221,0.9);
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(201,161,90,0.09);
        }
        .uk-list li:last-child { border-bottom: 0; }
        .uk-list svg { flex: none; color: ${GOLD}; opacity: 0.85; }

        .uk-cta {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-width: 280px;
          padding: 20px 40px;
          font-family: ${SERIF};
          font-size: 17px;
          letter-spacing: 0.02em;
          color: #0a0705;
          background: linear-gradient(135deg, #E8C48A 0%, ${GOLD} 55%, ${GOLD_SOFT} 100%);
          border: 0;
          border-radius: 999px;
          cursor: pointer;
          box-shadow:
            0 0 0 1px rgba(201,161,90,0.35),
            0 20px 50px -20px rgba(201,161,90,0.45),
            inset 0 0 0 1px rgba(255,240,210,0.35);
          transition: transform .35s cubic-bezier(0.22,0.61,0.36,1), box-shadow .4s ease;
        }
        .uk-cta:hover { transform: translateY(-2px); box-shadow: 0 0 0 1px rgba(201,161,90,0.5), 0 26px 58px -20px rgba(201,161,90,0.6), inset 0 0 0 1px rgba(255,240,210,0.5); }
        .uk-cta:disabled { opacity: 0.7; cursor: progress; }

        .uk-foot {
          margin: 26px auto 0;
          font-family: "Karla", sans-serif;
          font-size: 10.5px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: rgba(243,236,221,0.42);
        }
        .uk-err {
          margin-top: 18px;
          font-size: 13px;
          color: #E8B4A2;
          font-family: "Karla", sans-serif;
        }
        .uk-sig {
          margin-top: 76px;
          font-family: ${SCRIPT};
          font-size: 30px;
          color: ${GOLD};
          opacity: 0.85;
        }

        @media (max-width: 480px) {
          .unlock-scene { padding: 0 20px 96px; }
          .uk-groups { max-width: 100%; gap: 36px; }
          .uk-cta { width: 100%; min-width: 0; }
        }
      `}</style>

      <div className="uk-inner">
        <motion.svg
          className="uk-heart"
          width="18"
          height="16"
          viewBox="0 0 18 16"
          fill="none"
          aria-hidden
          {...rise(0)}
        >
          <path d="M9 14.5s-6-3.6-6-8.4A3.6 3.6 0 0 1 9 4a3.6 3.6 0 0 1 6 2.1c0 4.8-6 8.4-6 8.4z" stroke="currentColor" strokeWidth="1.1" fill="rgba(201,161,90,0.10)" />
        </motion.svg>

        <motion.h2 className="uk-title" {...rise(0.15)}>
          <span className="uk-title-line">O restante da homenagem</span>
          <span className="uk-title-line">já está <em>pronto.</em></span>
        </motion.h2>

        <motion.div className="uk-rule" aria-hidden {...rise(0.6)}>
          <span /><i>♥</i><span />
        </motion.div>

        <motion.p className="uk-sub" {...rise(0.9)}>
          Falta apenas um passo para que ele receba tudo.
        </motion.p>

        <div className="uk-groups">
          <motion.div {...rise(1.25)}>
            <p className="uk-group-title">sua homenagem</p>
            <ul className="uk-list">
              {GROUP_MEMORY.map((b) => (
                <li key={b}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7.4l3.2 3.2L12 3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div {...rise(1.65)}>
            <p className="uk-group-title">você também recebe</p>
            <ul className="uk-list">
              {GROUP_GIFT.map((b) => (
                <li key={b}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7.4l3.2 3.2L12 3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.button
          className="uk-cta"
          onClick={unlock}
          disabled={buying}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98, filter: "blur(6px)" }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.4, ease: EASE, delay: 2.15 }}
        >
          {buying ? "Abrindo…" : "Desbloquear homenagem"}
          {!buying && (
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M1 6h13m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </motion.button>

        {err && <div className="uk-err">{err}</div>}

        <motion.div className="uk-foot" {...rise(2.5)}>
          liberação imediata após o pagamento
        </motion.div>

        <motion.div className="uk-sig" {...rise(2.8)}>
          com carinho
        </motion.div>
      </div>
    </section>
  );
}
