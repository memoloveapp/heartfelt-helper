import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/retorno")({
  validateSearch: (search: Record<string, unknown>) => ({
    slug: typeof search.slug === "string" ? search.slug : "",
  }),
  head: () => ({
    meta: [
      { title: "Confirmando pagamento — MemoLove" },
      { name: "description", content: "Confirmando seu pagamento MemoLove." },
    ],
  }),
  component: RetornoPage,
  ssr: false,
});

function RetornoPage() {
  const { slug } = Route.useSearch();
  const [elapsed, setElapsed] = useState(0);
  const [canRetry, setCanRetry] = useState(false);
  const [status, setStatus] = useState("Confirmando seu pagamento...");

  useEffect(() => {
    if (!slug) {
      setStatus("Slug ausente na URL.");
      setCanRetry(true);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const MAX = 30; // 60s

    const check = async () => {
      attempts++;
      try {
        const { data, error } = await supabase
          .from("memories")
          .select("payment_status, is_unlocked")
          .eq("slug", slug)
          .maybeSingle();
        if (cancelled) return;
        if (!error && data && (data.payment_status === "approved" || data.is_unlocked === true)) {
          setStatus("Pagamento confirmado! Redirecionando...");
          window.location.href = `/sucesso?slug=${encodeURIComponent(slug)}`;
          return;
        }
      } catch {}
      if (attempts >= MAX) {
        setStatus("Ainda não recebemos a confirmação do pagamento.");
        setCanRetry(true);
      }
    };

    check();
    const iv = setInterval(() => {
      setElapsed((s) => s + 2);
      check();
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [slug]);

  const retry = () => {
    setCanRetry(false);
    setElapsed(0);
    setStatus("Confirmando seu pagamento...");
    // reboot the effect via reload — simplest and safest
    window.location.reload();
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: "#F5EFE6", fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-8 text-center"
        style={{ boxShadow: "0 24px 60px -24px rgba(60,40,20,0.18)" }}
      >
        <div className="mx-auto mb-6 h-14 w-14 rounded-full border-[3px] border-[#EAD9CB] border-t-[#C97B5E] animate-spin" />
        <h1
          className="text-[22px] font-semibold text-[#3f342d] mb-2"
          style={{ fontFamily: '"Fraunces", Georgia, serif' }}
        >
          {status}
        </h1>
        <p className="text-[13px] text-[#8a7d72] leading-relaxed">
          Assim que o Mercado Pago confirmar seu pagamento, sua homenagem será liberada automaticamente.
        </p>
        {!canRetry && (
          <p className="mt-4 text-[12px] text-[#a89b90]">Aguardando... {elapsed}s</p>
        )}
        {canRetry && (
          <button
            type="button"
            onClick={retry}
            className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-white text-[14px] font-semibold"
            style={{ background: "linear-gradient(135deg,#D88B6E,#C97B5E)" }}
          >
            Verificar novamente
          </button>
        )}
      </div>
    </main>
  );
}
