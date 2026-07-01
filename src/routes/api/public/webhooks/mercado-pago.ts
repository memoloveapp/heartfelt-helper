import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const PROD_ORIGIN = "https://memoloove.lovable.app";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

function extractPaymentId(payload: any, url: URL): string | null {
  const candidates: unknown[] = [
    payload?.data?.id,
    payload?.data?.payment?.id,
    payload?.resource,
    payload?.id,
    url.searchParams.get("data.id"),
    url.searchParams.get("id"),
  ];
  for (const c of candidates) {
    if (c == null) continue;
    const s = String(c).trim();
    if (!s) continue;
    // resource can be a full URL — extract trailing id
    const m = s.match(/(\d+)(?:\?|$)/);
    if (m) return m[1];
    if (/^\d+$/.test(s)) return s;
  }
  return null;
}

async function fetchMpPayment(paymentId: string, token: string) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export const Route = createFileRoute("/api/public/webhooks/mercado-pago")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => json(200, { received: true }),
      POST: async ({ request }) => {
        const url = new URL(request.url);
        let payload: any = {};
        try {
          payload = await request.json();
        } catch {}
        console.log("[mp-webhook] payload:", JSON.stringify(payload));
        console.log("[mp-webhook] query:", url.search);

        const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        if (!token) {
          console.error("[mp-webhook] MERCADO_PAGO_ACCESS_TOKEN ausente");
          return json(200, { received: true, reason: "missing_mp_token" });
        }

        // Only process payment notifications
        const type = payload?.type ?? payload?.action ?? url.searchParams.get("type");
        const isPayment =
          typeof type === "string" &&
          (type === "payment" || type.startsWith("payment."));

        const paymentId = extractPaymentId(payload, url);
        if (!isPayment && !paymentId) {
          return json(200, { received: true, reason: "not_payment_event" });
        }
        if (!paymentId) {
          return json(200, { received: true, reason: "no_payment_id" });
        }

        const serviceRoleKey = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
          console.error("[mp-webhook] SERVICE_ROLE_KEY ausente");
          return json(200, { received: true, reason: "missing_service_role" });
        }
        const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        async function releaseMemory(externalReference: string) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            externalReference,
          );

          let mem: { id: string; slug: string } | null = null;
          let byIdResult: unknown = null;
          let byIdError: unknown = null;
          let bySlugResult: unknown = null;
          let bySlugError: unknown = null;

          if (isUuid) {
            const r = await supabase
              .from("memories")
              .select("id, slug")
              .eq("id", externalReference)
              .maybeSingle();
            byIdResult = r.data;
            byIdError = r.error;
            if (r.data) mem = r.data as { id: string; slug: string };
          }

          if (!mem) {
            const r = await supabase
              .from("memories")
              .select("id, slug")
              .eq("slug", externalReference)
              .maybeSingle();
            bySlugResult = r.data;
            bySlugError = r.error;
            if (r.data) mem = r.data as { id: string; slug: string };
          }

          if (!mem) {
            console.error("[mp-webhook] memory not found", {
              external_reference: externalReference,
              tried_uuid_lookup: isUuid,
              by_id_result: byIdResult,
              by_id_error: byIdError,
              by_slug_result: bySlugResult,
              by_slug_error: bySlugError,
            });
            return { ok: false as const, reason: "memory_not_found" };
          }

          const publicUrl = `${PROD_ORIGIN}/homenagem/${mem.slug}`;
          const qrCodeUrl = `${PROD_ORIGIN}/sucesso?slug=${encodeURIComponent(mem.slug)}`;
          const { error: updErr } = await supabase
            .from("memories")
            .update({
              payment_status: "approved",
              is_unlocked: true,
              updated_at: new Date().toISOString(),
              public_url: publicUrl,
              qr_code_url: qrCodeUrl,
            })
            .eq("id", mem.id);
          if (updErr) {
            console.error("[mp-webhook] update failed", updErr);
            return { ok: false as const, reason: "update_failed" };
          }
          console.log("[mp-webhook] APPROVED", {
            payment_id: paymentId,
            slug: mem.slug,
            external_reference: externalReference,
            approved_at: new Date().toISOString(),
            public_url: publicUrl,
            qr_code_url: qrCodeUrl,
          });
          return { ok: true as const, slug: mem.slug, public_url: publicUrl, qr_code_url: qrCodeUrl };
        }

        // First check
        let attempt = 0;
        const maxAttempts = 10; // ~50s total (5s interval)
        const intervalMs = 5000;
        let lastStatus: string | undefined;
        let lastMemoryId: string | null = null;

        let lastMpData: any = null;

        while (attempt < maxAttempts) {
          attempt++;
          const mp = await fetchMpPayment(paymentId, token);
          if (!mp.ok) {
            console.error("[mp-webhook] mp fetch failed", mp.status, mp.data);
            return json(200, { received: true, reason: "mp_fetch_failed", status: mp.status, mp_response: mp.data });
          }
          lastMpData = mp.data;
          lastStatus = mp.data?.status;
          lastMemoryId =
            mp.data?.external_reference ||
            mp.data?.metadata?.memory_id ||
            mp.data?.metadata?.memoryId ||
            null;

          const debugFields = {
            attempt,
            "payment.id": mp.data?.id,
            status: mp.data?.status,
            status_detail: mp.data?.status_detail,
            external_reference: mp.data?.external_reference,
            date_approved: mp.data?.date_approved,
            live_mode: mp.data?.live_mode,
            at: new Date().toISOString(),
          };
          console.log("[mp-webhook] MP payment details:", JSON.stringify(debugFields, null, 2));

          if (lastStatus === "approved") {
            if (!lastMemoryId) {
              return json(200, { received: true, reason: "no_external_reference", debug: debugFields });
            }
            const result = await releaseMemory(lastMemoryId);
            if (!result.ok) return json(200, { received: true, reason: result.reason, debug: debugFields });
            return json(200, {
              received: true,
              updated: true,
              attempts: attempt,
              slug: result.slug,
              public_url: result.public_url,
              qr_code_url: result.qr_code_url,
              debug: debugFields,
            });
          }

          // Terminal negative states — stop polling
          if (
            lastStatus === "rejected" ||
            lastStatus === "cancelled" ||
            lastStatus === "refunded" ||
            lastStatus === "charged_back"
          ) {
            return json(200, { received: true, reason: "terminal_not_approved", debug: debugFields });
          }

          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, intervalMs));
          }
        }


        console.log("[mp-webhook] timeout, still not approved", {
          payment_id: paymentId,
          status: lastStatus,
          external_reference: lastMemoryId,
        });
        return json(200, {
          received: true,
          reason: "polling_timeout",
          debug: {
            "payment.id": lastMpData?.id,
            status: lastMpData?.status,
            status_detail: lastMpData?.status_detail,
            external_reference: lastMpData?.external_reference,
            date_approved: lastMpData?.date_approved,
            live_mode: lastMpData?.live_mode,
            attempts: attempt,
          },
        });
      },
    },
  },
});
