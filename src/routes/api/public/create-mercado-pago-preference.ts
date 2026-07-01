import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

export const Route = createFileRoute("/api/public/create-mercado-pago-preference")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
          if (!accessToken) return json({ error: "missing_access_token" }, 500);

          const body = (await request.json().catch(() => ({}))) as {
            memoryId?: string;
            slug?: string;
          };
          const memoryId = body.memoryId?.toString().trim();
          const slug = body.slug?.toString().trim();
          if (!memoryId || !slug) return json({ error: "memoryId and slug required" }, 400);

          const baseUrl = "https://memoloove.lovable.app";

          const preference = {
            items: [
              {
                title: "Homenagem Personalizada MemoLove",
                quantity: 1,
                unit_price: 13.9,
                currency_id: "BRL",
              },
            ],
            external_reference: memoryId,
            metadata: { slug, memory_id: memoryId },
            back_urls: {
              success: `${baseUrl}/retorno?slug=${encodeURIComponent(slug)}`,
              pending: `${baseUrl}/retorno?slug=${encodeURIComponent(slug)}`,
              failure: `${baseUrl}/previa?slug=${encodeURIComponent(slug)}`,
            },
            auto_return: "approved",
          };

          const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(preference),
          });

          const mpData = await mpRes.json().catch(() => ({}));
          if (!mpRes.ok) {
            console.error("[mercadopago] preference error", mpRes.status, mpData);
            return json({ error: "mp_error", status: mpRes.status, details: mpData }, 502);
          }

          return json({
            init_point: mpData.init_point,
            sandbox_init_point: mpData.sandbox_init_point,
            preference_id: mpData.id,
          });
        } catch (err) {
          console.error("[mercadopago] handler error", err);
          return json({ error: "internal_error" }, 500);
        }
      },
    },
  },
});
