import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { generateHeroCinematic } from "@/lib/hero-cinematic.functions";

export const Route = createFileRoute("/api/public/hero-regen/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const extUrl = process.env.EXTERNAL_SUPABASE_URL;
        const extKey = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;
        if (!extUrl || !extKey) {
          return Response.json({ ok: false, reason: "missing_external_supabase" }, { status: 500 });
        }
        const supa = createClient(extUrl, extKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: mem } = await supa
          .from("memories")
          .select("id, slug")
          .eq("slug", params.slug)
          .maybeSingle();
        if (!mem) return Response.json({ ok: false, reason: "not_found" }, { status: 404 });

        const result = await generateHeroCinematic({ data: { memoryId: (mem as any).id, force: true } });
        return Response.json({ slug: params.slug, memoryId: (mem as any).id, result });
      },
    },
  },
});
