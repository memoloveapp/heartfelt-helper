import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const BUCKET = "memory-photos";
const CINEMATIC_PREFIX = "cinematic";

const CINEMATIC_PROMPT = `You are a senior cinema colorist and editorial photo retoucher. Re-grade this photograph as if it were the final still of an A24 film (Aftersun, Past Lives, Moonlight), a Kodak Portra 400 scan, or a Leica editorial family/couple campaign shot at golden hour. The result MUST look visibly and clearly different from the original — the viewer should feel an emotional, cinematic memory, not a filtered selfie.

1. CINEMATIC LIGHT (mandatory)
- Add warm, natural golden-hour sunlight as if the sun were low, coming preferentially from the upper-left.
- Add a soft, believable golden glow / rim light wrapping the subject's face, hair and shoulders.
- Introduce gentle atmospheric haze in the highlights (subtle bloom), like late-afternoon backlight.
- Ambient temperature: warm amber/honey in the highlights, cool and deep in the shadows (teal/olive), classic cinematic split-tone — but subtle and elegant, never neon.

2. DEPTH & FOCUS ON THE PEOPLE
- The people are the emotional subject. Make them feel present, luminous, alive.
- Slightly reduce contrast and micro-detail on the background so the subject pops.
- Add a very gentle simulated shallow depth-of-field feel on the background only (do NOT blur faces, do NOT blur clothing, do NOT blur the subject).
- Keep every face razor sharp and perfectly recognizable.

3. PREMIUM COLOR GRADE (Lightroom-level, not filter-level)
- Deep, rich blacks with a filmic S-curve; lifted-but-controlled shadows.
- Rolled-off, creamy highlights — never clipped, never HDR.
- Warm amber/honey highlights, soft teal/olive shadows.
- Skin: natural, healthy, luminous — never orange, never red, never plastic.
- Whites stay truly white (a white shirt must remain white, not sepia).
- Greens pulled toward soft olive; oversaturated colors calmed down.
- Add delicate, fine film grain (Portra-like), and a very soft vignette.

4. EMOTIONAL RESULT
- The final frame must feel like a cherished memory, an intimate movie still, a tribute photograph.
- Nostalgic, warm, cinematic, timeless.

5. HARD PROHIBITIONS (do not violate)
- Do NOT change any person's identity, face, features, skin structure, age, gender, hair, or expression.
- Do NOT change clothing, accessories, background scene, or composition.
- Do NOT add or remove people or objects.
- Do NOT crop, rotate, stretch, deform, or reframe the image — keep the exact same framing and aspect ratio.
- Do NOT turn it into an illustration, painting, cartoon, anime, 3D render, or AI-art look.
- Do NOT apply a flat orange/sepia overlay or an Instagram filter.
- Do NOT produce an HDR / over-processed / plastic look.
- Do NOT introduce text, watermarks, borders, or logos.

6. DELIVERABLE
Return ONLY the re-graded photograph — same subject, same pose, same clothes, same background, same framing — but now clearly lit and colored like a premium cinematic editorial frame at golden hour. The difference from the original should be immediately visible: warmer, deeper, more emotional, more filmic.`;

const Input = z.object({
  memoryId: z.string().uuid(),
  force: z.boolean().optional(),
});

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

    const force = data.force === true;

    // Skip if already generated (unless force)
    const { data: mem } = await supabaseAdmin
      .from("memories")
      .select("id, hero_image_cinematic")
      .eq("id", data.memoryId)
      .maybeSingle();
    if (!mem) return { ok: false, reason: "memory_not_found" as const };
    if ((mem as any).hero_image_cinematic && !force) {
      console.log("[hero-cinematic] ✅ using cached AI image", { memoryId: data.memoryId, path: (mem as any).hero_image_cinematic });
      return { ok: true, path: (mem as any).hero_image_cinematic, cached: true };
    }
    if (force) {
      console.log("[hero-cinematic] ♻️ force=true — regenerating AI image", { memoryId: data.memoryId });
    } else {
      console.log("[hero-cinematic] ✨ generating new AI image", { memoryId: data.memoryId });
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

      console.log("[hero-cinematic] ✅ AI image saved", { memoryId: data.memoryId, path: outPath });
      return { ok: true, path: outPath, cached: false, regenerated: force };
    } catch (err) {
      console.error("[hero-cinematic] ❌ exception — falling back to original photo", err);
      return { ok: false, reason: "exception" as const };
    }
  });
