import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HomenagemExperience } from "@/components/homenagem/HomenagemExperience";

/* /previa — a mesma experiência de /homenagem, apenas com bloqueio elegante
   após a segunda foto. Reutiliza componentes; sem duplicação. */

export const Route = createFileRoute("/previa")({
  validateSearch: (search: Record<string, unknown>) => ({
    slug: typeof search.slug === "string" ? search.slug : "",
  }),
  head: () => ({
    meta: [
      { title: "Sua homenagem — MemoLove" },
      { name: "description", content: "A homenagem feita para o seu pai." },
    ],
  }),
  component: PreviaPage,
  ssr: false,
});

function PreviaPage() {
  const { slug } = Route.useSearch();
  const [approvedSlug, setApprovedSlug] = useState<string | null>(null);

  // Se o pagamento já foi confirmado antes, exibe um selo discreto no topo.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pending = localStorage.getItem("pending_purchase_slug");
        if (!pending) return;
        const { data: mem } = await supabase
          .from("memories")
          .select("slug, payment_status, is_unlocked")
          .eq("slug", pending)
          .maybeSingle();
        if (cancelled) return;
        if (mem && (mem.payment_status === "approved" || mem.is_unlocked === true)) {
          setApprovedSlug(mem.slug);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  if (!slug) {
    return (
      <div className="fixed inset-0 flex flex-col gap-4 items-center justify-center px-6 text-center"
        style={{ background: "#F8F4EC", color: "#2B2623", fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
        <p style={{ fontStyle: "italic" }}>Não encontramos sua homenagem.</p>
        <Link to="/criar" className="underline text-sm opacity-70">Voltar e tentar novamente</Link>
      </div>
    );
  }

  return (
    <>
      {approvedSlug && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[min(92vw,420px)] rounded-2xl bg-white text-[#1f1915] px-5 py-4 shadow-2xl border border-black/5"
          style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', animation: "mlRise 400ms ease-out both" }}
        >
          <div className="text-[15px] font-semibold" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Pagamento confirmado</div>
          <div className="text-[13px] text-[#6b6058] mt-0.5 mb-3">Sua homenagem já está liberada.</div>
          <Link
            to="/sucesso"
            search={{ slug: approvedSlug }}
            onClick={() => { try { localStorage.removeItem("pending_purchase_slug"); } catch {} }}
            className="block w-full text-center rounded-xl text-white font-semibold py-3 text-[14px]"
            style={{ background: "linear-gradient(135deg, #D88B6E 0%, #C97B5E 50%, #a85f44 100%)" }}
          >
            Ver minha homenagem
          </Link>
          <style>{`@keyframes mlRise { from { opacity:0; transform: translate(-50%, -8px);} to { opacity:1; transform: translate(-50%, 0);} }`}</style>
        </div>
      )}
      <HomenagemExperience slug={slug} preview={true} />
    </>
  );
}
