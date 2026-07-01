import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const SUPABASE_URL = "https://uvplcqmbeyyjighhzdsq.supabase.co";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function extractSlug(payload: any): string | null {
  if (!payload || typeof payload !== "object") return null;

  const bodySlug =
    payload.slug ??
    payload?.data?.slug ??
    payload?.metadata?.slug ??
    payload?.data?.metadata?.slug ??
    payload?.checkout?.metadata?.slug ??
    payload?.custom_fields?.slug;
  const bodyRef =
    payload.ref ?? payload?.data?.ref ?? payload?.metadata?.ref;
  const bodyExt =
    payload.external_id ??
    payload?.data?.external_id ??
    payload?.metadata?.external_id;

  let urlSlug: string | null = null;
  let urlRef: string | null = null;
  let urlExt: string | null = null;

  const urlFields: Array<unknown> = [
    payload?.data?.checkoutUrl,
    payload?.data?.checkout_url,
    payload?.checkoutUrl,
    payload?.checkout_url,
    payload?.url,
    payload?.data?.url,
    payload?.return_url,
  ];
  for (const u of urlFields) {
    if (typeof u !== "string") continue;
    try {
      const parsed = new URL(u);
      urlSlug = urlSlug || parsed.searchParams.get("slug");
      urlRef = urlRef || parsed.searchParams.get("ref");
      urlExt = urlExt || parsed.searchParams.get("external_id");
    } catch {}
  }

  const pick = (v: unknown) =>
    typeof v === "string" && v.trim().length > 0 ? v.trim() : null;

  return (
    pick(bodySlug) ||
    pick(urlSlug) ||
    pick(bodyRef) ||
    pick(urlRef) ||
    pick(bodyExt) ||
    pick(urlExt)
  );
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
    .map((v) => (v as string).toLowerCase())
    .join(" ");
  return (
    raw.includes("approved") ||
    raw.includes("aprovad") ||
    raw.includes("paid") ||
    raw.includes("purchase_approved") ||
    raw.includes("payment_approved") ||
    raw.includes("compra_aprovada") ||
    raw.includes("order.paid") ||
    raw.includes("succeeded")
  );
}

export const Route = createFileRoute("/api/public/webhooks/cakto")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders }),

      GET: async () =>
        json(200, { ok: true, endpoint: "cakto-webhook", ready: true }),

      POST: async ({ request }) => {
        const headersObj: Record<string, string> = {};
        request.headers.forEach((v, k) => (headersObj[k] = v));

        const raw = await request.text();
        let payload: any = raw;
        try {
          payload = JSON.parse(raw);
        } catch {}

        console.log("[cakto-webhook] headers:", headersObj);
        console.log("[cakto-webhook] body:", payload);

        // Sempre 200 para o "Testar" da Cakto
        if (!isApprovedEvent(payload)) {
          console.log("[cakto-webhook] evento não-aprovado (ok/teste)");
          return json(200, { received: true, ignored: true });
        }

        const slug = extractSlug(payload);
        console.log("[cakto-webhook] slug:", slug);

        if (!slug) {
          console.warn("[cakto-webhook] sem slug — respondendo 200 sem update");
          return json(200, { received: true, updated: false, reason: "no slug" });
        }

        const serviceRoleKey = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
          console.error("[cakto-webhook] SERVICE_ROLE_KEY ausente");
          return json(200, { received: true, updated: false, reason: "no key" });
        }

        const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

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
          console.error("[cakto-webhook] erro update:", updErr);
          return json(200, { received: true, updated: false, error: updErr.message });
        }

        console.log("[cakto-webhook] atualizado:", updated);
        return json(200, { received: true, updated });
      },
    },
  },
});
