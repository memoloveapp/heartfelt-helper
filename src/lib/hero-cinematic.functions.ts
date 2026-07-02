import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const BUCKET = "memory-photos";
const CINEMATIC_PREFIX = "cinematic";

const CINEMATIC_PROMPT = `Apply a subtle cinematic color grade to this photograph — like a still frame from an A24 film (Aftersun, Past Lives, Moonlight) or a Kodak Portra 400 / Cinestill 800T scan.

Strict rules:
- Preserve every person's face and identity exactly. Do not restyle, do not change features, do not alter skin structure.
- Preserve sharpness and details.
- Keep whites truly white (a white shirt must stay white — no yellow, no sepia, no orange cast).
- Keep grays and concrete neutral.
- Keep skin tones natural — not orange, not red.
- Warmth only in the highlights and light sources, NOT a global filter.
- Deepen shadows with a soft filmic contrast (gentle S-curve), lift blacks slightly, roll off highlights.
- Reduce over-saturated greens toward a soft olive/teal.
- Add gentle depth: subtle vignette, delicate film grain.
- Result must look like a professional cinema frame, not a selfie or an Instagram filter.

Do NOT apply a yellow, sepia, or orange overlay. Return only the edited photograph.`;

const Input = z.object({ memoryId: z.string().uuid() });

async function fetchAsBase64(url: string): Promise<{ b64: string; mime: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch source image: ${res.status}`);
  const mime = res.headers.get("content-type") || "image/jpeg";
  const buf = new Uint8Array(await res.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return { b64: btoa(bin), mime };
}

function b64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const generateHeroCinematic = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false, reason: "missing_api_key" as const };

    const extUrl = process.env.EXTERNAL_SUPABASE_URL;
    const extKey = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;
    if (!extUrl || !extKey) return { ok: false, reason: "missing_external_supabase" as const };
    const supabaseAdmin = createClient(extUrl, extKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Skip if already generated
    const { data: mem } = await supabaseAdmin
      .from("memories")
      .select("id, hero_image_cinematic")
      .eq("id", data.memoryId)
      .maybeSingle();
    if (!mem) return { ok: false, reason: "memory_not_found" as const };
    if ((mem as any).hero_image_cinematic) {
      return { ok: true, path: (mem as any).hero_image_cinematic, cached: true };
    }

    // Get first photo
    const { data: photos } = await supabaseAdmin
      .from("memory_photos")
      .select("photo_url, position")
      .eq("memory_id", data.memoryId)
      .order("position", { ascending: true })
      .limit(1);
    const raw = photos?.[0]?.photo_url;
    if (!raw) return { ok: false, reason: "no_photo" as const };

    // Resolve to a fetchable URL
    let sourceUrl = raw;
    const marker = `/object/public/${BUCKET}/`;
    const signMarker = `/object/sign/${BUCKET}/`;
    let sourcePath: string | null = null;
    if (raw.includes(marker)) sourcePath = raw.split(marker)[1].split("?")[0];
    else if (raw.includes(signMarker)) sourcePath = raw.split(signMarker)[1].split("?")[0];
    else if (!raw.startsWith("http")) sourcePath = raw.replace(/^\/+/, "").replace(new RegExp(`^${BUCKET}/`), "");

    if (sourcePath) {
      const { data: signed } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrl(sourcePath, 300);
      if (signed?.signedUrl) sourceUrl = signed.signedUrl;
    }

    try {
      const { b64, mime } = await fetchAsBase64(sourceUrl);

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          modalities: ["image", "text"],
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: CINEMATIC_PROMPT },
                { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } },
              ],
            },
          ],
        }),
      });

      if (!aiRes.ok) {
        const errTxt = await aiRes.text().catch(() => "");
        console.error("[hero-cinematic] gateway error", aiRes.status, errTxt);
        return { ok: false, reason: "ai_failed" as const };
      }
      const payload = (await aiRes.json()) as any;
      const images: any[] = payload?.choices?.[0]?.message?.images ?? [];
      const imgUrl: string | undefined = images[0]?.image_url?.url;
      if (!imgUrl || !imgUrl.startsWith("data:")) {
        console.error("[hero-cinematic] no image in response");
        return { ok: false, reason: "no_image" as const };
      }
      const [, outB64] = imgUrl.split(",");
      const bytes = b64ToUint8Array(outB64);

      const outPath = `${CINEMATIC_PREFIX}/${data.memoryId}.png`;
      const { error: upErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(outPath, bytes, { contentType: "image/png", upsert: true });
      if (upErr) {
        console.error("[hero-cinematic] upload error", upErr);
        return { ok: false, reason: "upload_failed" as const };
      }

      const { error: updErr } = await supabaseAdmin
        .from("memories")
        .update({ hero_image_cinematic: outPath } as any)
        .eq("id", data.memoryId);
      if (updErr) {
        console.error("[hero-cinematic] update error", updErr);
        return { ok: false, reason: "update_failed" as const };
      }

      return { ok: true, path: outPath };
    } catch (err) {
      console.error("[hero-cinematic] exception", err);
      return { ok: false, reason: "exception" as const };
    }
  });
