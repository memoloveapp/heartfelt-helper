import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/deezer-search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") ?? "").trim();
        if (!q) {
          return Response.json({ data: [] }, { headers: { "cache-control": "no-store" } });
        }
        try {
          const upstream = await fetch(
            `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=20`,
            { headers: { accept: "application/json" } },
          );
          if (!upstream.ok) {
            return Response.json({ data: [], error: `deezer ${upstream.status}` }, { status: 200 });
          }
          const json = (await upstream.json()) as {
            data?: Array<{
              id: number;
              title: string;
              preview: string;
              artist?: { name?: string };
              album?: { cover_medium?: string; cover_small?: string };
            }>;
          };
          const raw = (json.data ?? [])
            .filter((t) => !!t.preview && t.preview.startsWith("http"))
            .map((t) => ({
              id: String(t.id),
              title: t.title,
              artist: t.artist?.name ?? "",
              cover: t.album?.cover_medium ?? t.album?.cover_small ?? "",
              preview: t.preview ?? "",
            }));

          // Validar cada preview (GET parcial): aceitar só 200/206 + audio/* + tamanho > 0
          const checks = await Promise.allSettled(
            raw.slice(0, 12).map(async (t) => {
              const ctrl = new AbortController();
              const timer = setTimeout(() => ctrl.abort(), 3000);
              try {
                const r = await fetch(t.preview, {
                  headers: { range: "bytes=0-1" },
                  redirect: "follow",
                  signal: ctrl.signal,
                });
                const ct = r.headers.get("content-type") ?? "";
                const ok =
                  (r.status === 200 || r.status === 206) &&
                  (ct.startsWith("audio/") || ct.includes("octet-stream"));
                return ok ? t : null;
              } finally {
                clearTimeout(timer);
              }
            }),
          );
          const data = checks
            .map((c) => (c.status === "fulfilled" ? c.value : null))
            .filter((t): t is NonNullable<typeof t> => t !== null);

          return Response.json(
            { data },
            { headers: { "cache-control": "public, max-age=300" } },
          );
        } catch (err) {
          return Response.json(
            { data: [], error: err instanceof Error ? err.message : "fetch failed" },
            { status: 200 },
          );
        }
      },
    },
  },
});
