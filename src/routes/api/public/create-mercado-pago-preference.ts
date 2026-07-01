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

          const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!UUID_RE.test(memoryId)) {
            console.error("[mercadopago] memoryId inválido (não é UUID)", { memoryId, slug });
            return json({ error: "invalid_memory_id" }, 400);
          }

          // Validar que a memória existe ANTES de criar a preferência
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(
            process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
            process.env.VITE_SUPABASE_ANON_KEY ||
              process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
              process.env.SUPABASE_PUBLISHABLE_KEY ||
              "",
            { auth: { persistSession: false, autoRefreshToken: false } },
          );
          const { data: memory, error: memErr } = await supabase
            .from("memories")
            .select("id, slug")
            .eq("id", memoryId)
            .maybeSingle();

          if (memErr || !memory) {
            console.error("[mercadopago] memoryId não existe na tabela memories — preferência NÃO criada", {
              memoryId,
              slug,
              dbError: memErr?.message ?? null,
            });
            return json({ error: "memory_not_found", memoryId }, 404);
          }
          if (memory.slug !== slug) {
            console.error("[mercadopago] slug enviado não bate com o slug da memória", {
              memoryId,
              slugEnviado: slug,
              slugReal: memory.slug,
            });
            return json({ error: "slug_mismatch", memoryId }, 400);
          }
          console.log("[mercadopago] memória validada", { memoryId: memory.id, slug: memory.slug });

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
            notification_url: `${baseUrl}/api/public/webhooks/mercado-pago`,
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
