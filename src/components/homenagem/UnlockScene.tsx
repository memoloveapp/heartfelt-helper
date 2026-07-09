import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";

/* UnlockScene — última cena da /previa.
   Mantém a mesma linguagem cinematográfica escura da MusicScene/MemoryScene.
   Não é uma landing page: é o capítulo final antes da homenagem continuar. */

const SERIF = '"Cormorant Garamond", "EB Garamond", Georgia, serif';
const SCRIPT = '"Great Vibes", "Allura", "Dancing Script", cursive';
const GOLD = "#C9A15A";
const GOLD_SOFT = "#B8924A";
const IVORY = "#F3ECDD";
const EASE = [0.22, 0.61, 0.36, 1] as const;

const BENEFITS = [
  "Hero completo",
  "Carta personalizada",
  "Trilha sonora",
  "Todas as fotos",
  "Encerramento",
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

  return (
    <section className="unlock-scene" aria-label="Continuar homenagem">
      <style>{`
        .unlock-scene {
          position: relative;
          width: 100%;
          padding: 120px 22px 140px;
          color: ${IVORY};
          background: transparent;
          text-align: center;
          overflow: hidden;
        }
        .unlock-scene::before {
          content: "";
          position: absolute;
          left: 50%; top: 0;
          transform: translateX(-50%);
          width: 1px; height: 84px;
          background: linear-gradient(180deg, rgba(201,161,90,0) 0%, rgba(201,161,90,0.55) 100%);
          pointer-events: none;
        }
        .uk-inner {
          position: relative;
          z-index: 2;
          max-width: 560px;
          margin: 0 auto;
        }
        .uk-eyebrow {
          font-family: "Karla", sans-serif;
          font-size: 11px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: ${GOLD};
          opacity: 0.75;
          margin-bottom: 36px;
        }
        .uk-title {
          margin: 0;
          font-family: ${SERIF};
          font-weight: 500;
          font-size: clamp(34px, 8vw, 52px);
          line-height: 1.08;
          letter-spacing: -0.02em;
          color: ${IVORY};
        }
        .uk-title em {
          font-style: italic;
          color: ${GOLD};
        }
        .uk-rule {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; margin: 32px auto 32px; max-width: 200px;
        }
        .uk-rule span { flex: 1; height: 1px; background: rgba(201,161,90,0.4); }
        .uk-rule i { color: ${GOLD}; font-style: normal; text-shadow: 0 0 6px rgba(216,180,114,0.35); }

        .uk-sub {
          margin: 0 auto 56px;
          max-width: 420px;
          font-family: ${SERIF};
          font-size: clamp(18px, 3.4vw, 21px);
          line-height: 1.55;
          color: rgba(243,236,221,0.86);
          font-style: italic;
        }

        .uk-list {
          list-style: none;
          padding: 0;
          margin: 0 auto 64px;
          max-width: 340px;
          text-align: left;
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
          transition: transform .35s ${EASE.join(",")}, box-shadow .4s ease;
        }
        .uk-cta:hover { transform: translateY(-2px); box-shadow: 0 0 0 1px rgba(201,161,90,0.5), 0 26px 58px -20px rgba(201,161,90,0.6), inset 0 0 0 1px rgba(255,240,210,0.5); }
        .uk-cta:disabled { opacity: 0.7; cursor: progress; }

        .uk-foot {
          margin: 28px auto 0;
          font-family: "Karla", sans-serif;
          font-size: 11px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(243,236,221,0.45);
        }
        .uk-err {
          margin-top: 18px;
          font-size: 13px;
          color: #E8B4A2;
          font-family: "Karla", sans-serif;
        }
        .uk-sig {
          margin-top: 72px;
          font-family: ${SCRIPT};
          font-size: 28px;
          color: ${GOLD};
          opacity: 0.85;
        }

        @media (max-width: 480px) {
          .unlock-scene { padding: 92px 20px 108px; }
          .uk-list { max-width: 100%; }
          .uk-cta { width: 100%; min-width: 0; }
        }
      `}</style>

      <motion.div
        className="uk-inner"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30, filter: "blur(8px)" }}
        whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 1.6, ease: EASE }}
      >
        <div className="uk-eyebrow">continua…</div>

        <h2 className="uk-title">
          O restante desta homenagem<br />
          já está <em>pronto.</em>
        </h2>

        <div className="uk-rule" aria-hidden>
          <span /><i>♥</i><span />
        </div>

        <p className="uk-sub">
          Desbloqueie agora e entregue ao seu pai a experiência completa.
        </p>

        <ul className="uk-list">
          {BENEFITS.map((b) => (
            <li key={b}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7.4l3.2 3.2L12 3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {b}
            </li>
          ))}
        </ul>

        <button className="uk-cta" onClick={unlock} disabled={buying}>
          {buying ? "Abrindo…" : "Desbloquear homenagem"}
          {!buying && (
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M1 6h13m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {err && <div className="uk-err">{err}</div>}

        <div className="uk-foot">liberação imediata após o pagamento</div>

        <div className="uk-sig">com carinho</div>
      </motion.div>
    </section>
  );
}
