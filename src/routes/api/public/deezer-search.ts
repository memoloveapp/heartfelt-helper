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
          const data = (json.data ?? []).map((t) => ({
            id: String(t.id),
            title: t.title,
            artist: t.artist?.name ?? "",
            cover: t.album?.cover_medium ?? t.album?.cover_small ?? "",
            preview: t.preview ?? "",
          }));
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
