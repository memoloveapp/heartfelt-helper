import { createFileRoute } from "@tanstack/react-router";

/**
 * Resolve uma URL de preview FRESCA para um track Deezer.
 * As URLs de preview da Deezer são assinadas com HMAC e expiram em ~15 min,
 * então não podem ser persistidas — precisam ser regeradas por request.
 */
export const Route = createFileRoute("/api/public/deezer-track/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id?.trim();
        if (!id || !/^\d+$/.test(id)) {
          return Response.json({ error: "invalid id" }, { status: 400 });
        }
        try {
          const upstream = await fetch(`https://api.deezer.com/track/${id}`, {
            headers: { accept: "application/json" },
          });
          if (!upstream.ok) {
            return Response.json(
              { error: `deezer ${upstream.status}`, preview: "" },
              { status: 200, headers: { "cache-control": "no-store" } },
            );
          }
          const t = (await upstream.json()) as {
            id?: number;
            title?: string;
            preview?: string;
            artist?: { name?: string };
            album?: { cover_medium?: string; cover_small?: string };
          };
          return Response.json(
            {
              id: String(t.id ?? id),
              title: t.title ?? "",
              artist: t.artist?.name ?? "",
              cover: t.album?.cover_medium ?? t.album?.cover_small ?? "",
              preview: t.preview ?? "",
            },
            {
              headers: {
                // URLs expiram em ~15min; cache curto do lado do proxy é seguro
                "cache-control": "public, max-age=300",
              },
            },
          );
        } catch (err) {
          return Response.json(
            { error: err instanceof Error ? err.message : "fetch failed", preview: "" },
            { status: 200 },
          );
        }
      },
    },
  },
});
