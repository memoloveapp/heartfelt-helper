import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Cakto-Signature",
};

// Match the same Supabase project used by the frontend (src/integrations/supabase/client.ts)
const SUPABASE_URL = "https://uvplcqmbeyyjighhzdsq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__6fPWpZZFM1_joQV0IUyjA_smLAMJlO";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function extractSlug(payload: any): string | null {
  if (!payload || typeof payload !== "object") return null;
  const candidates: Array<unknown> = [
    payload.slug,
    payload?.data?.slug,
    payload?.metadata?.slug,
    payload?.data?.metadata?.slug,
    payload?.checkout?.metadata?.slug,
    payload?.product?.metadata?.slug,
    payload?.customer?.metadata?.slug,
    payload?.custom_fields?.slug,
  ];

  // Try to parse a slug from a URL field (checkout appended ?slug=...)
  const urlFields: Array<unknown> = [
    payload?.checkout_url,
    payload?.checkoutUrl,
    payload?.url,
    payload?.data?.checkout_url,
    payload?.data?.url,
    payload?.return_url,
  ];
  for (const u of urlFields) {
    if (typeof u === "string") {
      try {
        const parsed = new URL(u);
        const s = parsed.searchParams.get("slug");
        if (s) candidates.push(s);
      } catch {
        // ignore
      }
    }
  }

  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c.trim();
  }
  return null;
}

function isApprovedEvent(payload: any): boolean {
  if (!payload || typeof payload !== "object") return false;
  const raw = [
    payload.event,
    payload.type,
    payload.status,
    payload?.data?.status,
    payload?.data?.event,
    payload?.payment?.status,
    payload?.transaction?.status,
  ]
    .filter((v) => typeof v === "string")
    .map((v) => (v as string).toLowerCase());

  const joined = raw.join(" ");
  return (
    joined.includes("approved") ||
    joined.includes("aprovad") ||
    joined.includes("paid") ||
    joined.includes("purchase_approved") ||
    joined.includes("payment_approved") ||
    joined.includes("compra_aprovada") ||
    joined.includes("order.paid") ||
    joined.includes("succeeded")
  );
}

export const Route = createFileRoute("/api/webhooks/cakto")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders }),

      POST: async ({ request }) => {
        const raw = await request.text();
        let payload: any = raw;
        try {
          payload = JSON.parse(raw);
        } catch {
          // keep raw
        }

        console.log("[cakto-webhook] evento recebido:", payload);

        if (!isApprovedEvent(payload)) {
          console.log("[cakto-webhook] evento ignorado (não aprovado)");
          return json(200, { received: true, ignored: true });
        }

        const slug = extractSlug(payload);
        console.log("[cakto-webhook] slug localizado:", slug);

        if (!slug) {
          console.warn("[cakto-webhook] slug ausente no payload");
          return json(400, { error: "slug ausente" });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const { data: existing, error: findErr } = await supabase
          .from("memories")
          .select("id, slug, payment_status, is_unlocked")
          .eq("slug", slug)
          .maybeSingle();

        if (findErr) {
          console.error("[cakto-webhook] erro ao buscar homenagem:", findErr);
          return json(500, { error: "erro ao buscar homenagem" });
        }

        if (!existing) {
          console.warn("[cakto-webhook] homenagem não encontrada para slug:", slug);
          return json(404, { error: "homenagem não encontrada" });
        }

        const { data: updated, error: updErr } = await supabase
          .from("memories")
          .update({
            payment_status: "approved",
            is_unlocked: true,
            updated_at: new Date().toISOString(),
          })
          .eq("slug", slug)
          .select("id, slug, payment_status, is_unlocked, updated_at")
          .maybeSingle();

        if (updErr) {
          console.error("[cakto-webhook] erro ao atualizar homenagem:", updErr);
          return json(500, { error: "erro ao atualizar homenagem" });
        }

        console.log("[cakto-webhook] registro atualizado:", updated);
        console.log("[cakto-webhook] status final: approved / unlocked=true");

        return json(200, { received: true, updated });
      },
    },
  },
});
