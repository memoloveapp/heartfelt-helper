import { createFileRoute } from "@tanstack/react-router";

/**
 * Proxy de áudio: resolve uma preview_url FRESCA na Deezer (elas expiram em
 * ~15 min) e faz streaming do MP3 pelo nosso próprio domínio.
 * Isso elimina: expiração da URL, CORS e "Format error" no <audio>.
 */
export const Route = createFileRoute("/api/public/audio-preview/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const id = params.id?.trim();
        if (!id || !/^\d+$/.test(id)) {
          return new Response("invalid id", { status: 400 });
        }
        try {
          // 1) URL fresca via API da Deezer
          const meta = await fetch(`https://api.deezer.com/track/${id}`, {
            headers: { accept: "application/json" },
          });
          if (!meta.ok) return new Response("deezer unavailable", { status: 502 });
          const t = (await meta.json()) as { preview?: string };
          const previewUrl = t.preview ?? "";
          if (!previewUrl || !previewUrl.startsWith("http")) {
            return new Response("no preview for this track", { status: 404 });
          }

          // 2) Baixar o áudio (repassando Range para permitir seek)
          const range = request.headers.get("range");
          const upstream = await fetch(previewUrl, {
            headers: range ? { range } : undefined,
            redirect: "follow",
          });

          const ct = upstream.headers.get("content-type") ?? "";
          const len = upstream.headers.get("content-length");
          // 3) Validar: precisa ser áudio real, não HTML/JSON/vazio
          if (!upstream.ok || !upstream.body) {
            return new Response("preview fetch failed", { status: 502 });
          }
          if (ct && !ct.startsWith("audio/") && !ct.includes("octet-stream")) {
            return new Response("upstream is not audio", { status: 502 });
          }
          if (len !== null && Number(len) === 0) {
            return new Response("empty audio", { status: 502 });
          }

          // 4) Stream com headers corretos
          const headers = new Headers({
            "content-type": "audio/mpeg",
            "accept-ranges": "bytes",
            "cache-control": "public, max-age=600",
          });
          if (len) headers.set("content-length", len);
          const cr = upstream.headers.get("content-range");
          if (cr) headers.set("content-range", cr);

          return new Response(upstream.body, {
            status: upstream.status === 206 ? 206 : 200,
            headers,
          });
        } catch (err) {
          return new Response(
            err instanceof Error ? err.message : "proxy failed",
            { status: 502 },
          );
        }
      },
    },
  },
});
