import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";

/* UnlockScene — capítulo final da /previa.
   Nunca deve parecer landing/checkout: é uma continuação da homenagem.
   Cascata: headline → texto → lista 1 → lista 2 → preço → CTA → nota. */

const SERIF = '"Cormorant Garamond", "EB Garamond", Georgia, serif';
const SCRIPT = '"Great Vibes", "Allura", "Dancing Script", cursive';
const GOLD = "#C9A15A";
const GOLD_SOFT = "#B8924A";
const IVORY = "#F3ECDD";
const EASE = [0.22, 0.61, 0.36, 1] as const;

const GROUP_MEMORY = [
  "Hero completo",
  "Carta personalizada",
  "Trilha sonora escolhida por você",
  "Todas as memórias",
  "Encerramento completo",
];

const GROUP_GIFT = [
  "Porta-retrato premium",
  "Cartão dobrável",
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

  // Cascata — mesmos ritmos das outras cenas. 400ms entre etapas.
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
        .uk-title-line { display: block; white-space: nowrap; }
        .uk-title em { font-style: italic; font-weight: 500; color: ${GOLD}; }

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
        .uk-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 14px; }
        .uk-list li {
          display: flex; align-items: center; gap: 14px;
          font-family: ${SERIF}; font-size: 17px;
          color: rgba(243,236,221,0.9);
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(201,161,90,0.09);
        }
        .uk-list li:last-child { border-bottom: 0; }
        .uk-list svg { flex: none; color: ${GOLD}; opacity: 0.85; }

        /* Frase de transição — prepara o preço, muito discreta. */
        .uk-transition {
          margin: 0 auto 34px;
          max-width: 380px;
          font-family: ${SERIF};
          font-style: italic;
          font-size: 15.5px;
          line-height: 1.6;
          color: rgba(243,236,221,0.58);
          text-wrap: balance;
        }

        /* Preço — editorial, nunca card. */
        .uk-price {
          margin: 0 auto 52px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .uk-price-label {
          font-family: "Karla", sans-serif;
          font-size: 10.5px;
          letter-spacing: 0.42em;
          text-transform: uppercase;
          color: rgba(243,236,221,0.55);
        }
        .uk-price-old {
          font-family: ${SERIF};
          font-size: 15px;
          color: rgba(243,236,221,0.4);
          text-decoration: line-through;
          text-decoration-thickness: 1px;
          letter-spacing: 0.02em;
          margin-top: 10px;
        }
        .uk-price-eyebrow {
          margin-top: 18px;
          font-family: "Karla", sans-serif;
          font-size: 10.5px;
          letter-spacing: 0.44em;
          text-transform: uppercase;
          color: ${GOLD};
          opacity: 0.8;
        }
        .uk-price-now {
          margin-top: 10px;
          font-family: ${SERIF};
          font-weight: 500;
          font-style: italic;
          font-size: clamp(54px, 13.5vw, 84px);
          line-height: 1;
          letter-spacing: -0.02em;
          color: ${IVORY};
          text-shadow: 0 0 34px rgba(201,161,90,0.2);
        }
        .uk-price-now .cents { font-size: 0.55em; opacity: 0.85; }

        .uk-cta {
          position: relative;
          display: inline-flex; align-items: center; justify-content: center;
          gap: 13px; min-width: 320px;
          padding: 22px 46px;
          font-family: ${SERIF}; font-size: 18.5px;
          letter-spacing: 0.02em; color: #0a0705;
          background: linear-gradient(135deg, #E8C48A 0%, ${GOLD} 55%, ${GOLD_SOFT} 100%);
          border: 0; border-radius: 999px; cursor: pointer;
          box-shadow:
            0 0 0 1px rgba(201,161,90,0.35),
            0 22px 54px -20px rgba(201,161,90,0.5),
            inset 0 0 0 1px rgba(255,240,210,0.35);
          transition: transform .35s cubic-bezier(0.22,0.61,0.36,1), box-shadow .4s ease;
        }
        .uk-cta:hover { transform: translateY(-2px); box-shadow: 0 0 0 1px rgba(201,161,90,0.5), 0 28px 62px -20px rgba(201,161,90,0.62), inset 0 0 0 1px rgba(255,240,210,0.5); }
        .uk-cta:disabled { opacity: 0.7; cursor: progress; }

        .uk-foot {
          margin: 22px auto 0;
          font-family: ${SERIF};
          font-style: italic;
          font-size: 14px;
          line-height: 1.55;
          color: rgba(243,236,221,0.5);
        }
        .uk-err {
          margin-top: 18px; font-size: 13px;
          color: #E8B4A2; font-family: "Karla", sans-serif;
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
        <motion.h2 className="uk-title" {...rise(0)}>
          <span className="uk-title-line">O restante da homenagem</span>
          <span className="uk-title-line">já está <em>pronto.</em></span>
        </motion.h2>

        <motion.div className="uk-rule" aria-hidden {...rise(0.25)}>
          <span /><i>♥</i><span />
        </motion.div>

        <motion.p className="uk-sub" {...rise(0.4)}>
          Desbloqueie agora e entregue ao seu pai a experiência completa.
        </motion.p>

        <div className="uk-groups">
          <motion.div {...rise(0.8)}>
            <p className="uk-group-title">Sua homenagem inclui</p>
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

          <motion.div {...rise(1.2)}>
            <p className="uk-group-title">Você também recebe</p>
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

        <motion.p className="uk-transition" {...rise(1.6)}>
          Tudo ficará disponível assim que o pagamento for confirmado.
        </motion.p>

        <motion.div className="uk-price" {...rise(1.85)}>
          <span className="uk-price-label">pagamento único</span>
          <span className="uk-price-old">De R$ 29,90</span>
          <span className="uk-price-eyebrow">por apenas</span>
          <span className="uk-price-now">
            R$ 13<span className="cents">,90</span>
          </span>
        </motion.div>

        <motion.button
          className="uk-cta"
          onClick={unlock}
          disabled={buying}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98, filter: "blur(6px)" }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.4, ease: EASE, delay: 2.0 }}
        >
          {buying ? "Abrindo…" : "Desbloquear minha homenagem"}
          {!buying && (
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M1 6h13m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </motion.button>

        {err && <div className="uk-err">{err}</div>}

        <motion.div className="uk-foot" {...rise(2.3)}>
          Liberação imediata após a confirmação do pagamento.
        </motion.div>

        <motion.div className="uk-sig" {...rise(2.7)}>
          com carinho
        </motion.div>
      </div>
    </section>
  );
}
