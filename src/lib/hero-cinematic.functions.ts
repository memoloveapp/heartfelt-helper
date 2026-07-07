import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const BUCKET = "memory-photos";
const CINEMATIC_PREFIX = "cinematic";

const CINEMATIC_PROMPT = `You are BOTH a world-class professional photographer AND a senior cinema colorist working on a premium memorial tribute (MemoLove). Your job is NOT to apply a filter. Your job is to re-edit this photograph as a professional retoucher would in Lightroom + Capture One, so the final frame looks like a Leica / Canon / Sony Alpha / Apple campaign still — never like an AI filter.

═══════════════════════════════════════════
STEP 1 — ANALYZE THE PHOTO FIRST (silent, internal)
═══════════════════════════════════════════
Before editing, silently identify:
- Time of day (day / golden hour / sunset / blue hour / night)
- Light source (natural sun, window light, indoor artificial, mixed, street lights, candlelight)
- Indoor or outdoor
- Existing color temperature (warm / neutral / cool)
- Natural contrast level
- Number of people and where their faces are
- Depth of the scene (flat / layered)
- Overall mood already present

Only AFTER this analysis, choose the treatment. Do NOT apply a single generic preset to every photo.

═══════════════════════════════════════════
STEP 2 — CHOOSE THE TREATMENT BASED ON THE SCENE
═══════════════════════════════════════════

▸ DAYTIME PHOTOS (sun up, bright natural light)
Transform into a cinematic golden-hour feel:
- Add warm, natural golden light as if late afternoon
- Soft honey glow on skin, hair rim light
- Deeper background, more dimension
- Refined filmic contrast (S-curve), lifted shadows with teal/olive
- Emotional, movie-still atmosphere (A24 / Kodak Portra 400 feel)

▸ SUNSET / GOLDEN HOUR PHOTOS
Reinforce what's already there:
- Enhance sun rays and side light
- Warmer highlights, luminous skin
- Deeper background separation
- Romantic, intimate atmosphere
- Do NOT wash it out — keep it rich and directional

▸ NIGHT PHOTOS
DO NOT try to turn night into golden hour — that looks fake. Instead:
- Preserve the nocturnal mood
- Reduce digital noise, keep grain filmic
- Enhance existing light sources (lamps, street lights, neon, candle) — make them elegant, soft, cinematic (gentle bloom, not harsh)
- Lift faces just enough to be clearly visible and warm
- Improve subject/background separation with subtle depth
- Deep true blacks, controlled highlights, moody teal/amber split
- Think Blade Runner 2049 restraint, not Instagram night filter

▸ INDOOR PHOTOS
Editorial magazine treatment:
- Correct white balance (remove yellow/green cast from bulbs)
- Balanced contrast, natural skin tones
- Better face lighting (subtle dodge on faces)
- Add depth between subject and background
- Never HDR, never plastic, never over-sharpened

═══════════════════════════════════════════
STEP 3 — UNIVERSAL QUALITY RULES (always apply)
═══════════════════════════════════════════
- Faces razor sharp and perfectly recognizable
- Skin luminous, healthy, natural — never orange, red, waxy or plastic
- Whites stay white (a white shirt must remain white)
- Filmic S-curve, rolled-off highlights (never clipped)
- Delicate Portra-like grain, very soft vignette
- Subtle simulated shallow depth on background only — never blur faces, clothing or the subject
- The result must look like a professional photographer edited it, not like an AI filter or Instagram preset

═══════════════════════════════════════════
STEP 4 — HARD PROHIBITIONS
═══════════════════════════════════════════
Do NOT change any person's identity, face, features, age, gender, hair, skin structure, or expression.
Do NOT change clothing, accessories, background, scene, composition, framing, aspect ratio, or crop.
Do NOT add, remove, duplicate or invent people or objects.
Do NOT turn night into day, or day into night.
Do NOT produce illustration, painting, cartoon, anime, 3D render, HDR, or "AI art" look.
Do NOT apply a flat orange/sepia overlay or an Instagram-style filter.
Do NOT add text, watermarks, borders, or logos.

═══════════════════════════════════════════
STEP 5 — SELF-CHECK BEFORE RETURNING
═══════════════════════════════════════════
Mentally compare your output to the original.
- If the difference is subtle or barely visible → the edit FAILED. Redo it stronger, with more intentional light, depth and grade, while staying photorealistic.
- The final image must feel like a NEW professional edit of the same photograph, with clear emotional impact in the first second — reference quality: Apple, Leica, Canon, Sony Alpha campaigns.

DELIVERABLE
Return ONLY the re-edited photograph. Same people, same pose, same clothes, same background, same framing — but now visibly and professionally graded according to the scene type detected above.`;


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
      .select("id, hero_image_cinematic, hero_selected_photo_path")
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

    // Prefer AI-selected hero photo (Hero Intelligence); fallback to first photo.
    let raw: string | undefined = (mem as any).hero_selected_photo_path ?? undefined;
    if (raw) {
      console.log("[hero-cinematic] 🎯 using AI-selected hero photo", { memoryId: data.memoryId, path: raw });
    } else {
      const { data: photos } = await supabaseAdmin
        .from("memory_photos")
        .select("photo_url, position")
        .eq("memory_id", data.memoryId)
        .order("position", { ascending: true })
        .limit(1);
      raw = photos?.[0]?.photo_url;
    }
    if (!raw) return { ok: false, reason: "no_photo" as const };


    // Resolve to a fetchable URL
    let sourceUrl = raw;
    const marker = `/object/public/${BUCKET}/`;
    const signMarker = `/object/sign/${BUCKET}/`;
    let sourcePath: string | null = null;
    if (raw.includes(marker)) sourcePath = raw.split(marker)[1].split("?")[0];
    else if (raw.includes(signMarker)) sourcePath = raw.split(signMarker)[1].split("?")[0];
    else if (!raw.startsWith("http")) sourcePath = raw.replace(/^\/+/, "").replace(new RegExp(`^${BUCKET}/`), "");

    let stage = "signed_url";
    const timings: Record<string, number> = {};
    const t0 = Date.now();
    try {
      if (sourcePath) {
        const { data: signed, error: signErr } = await supabaseAdmin.storage
          .from(BUCKET)
          .createSignedUrl(sourcePath, 300);
        if (signErr || !signed?.signedUrl) {
          console.error("[hero-cinematic] ❌ stage=signed_url", signErr);
          return { ok: false, stage, status: null, provider_error: signErr?.message ?? "no_signed_url", details: { sourcePath } };
        }
        sourceUrl = signed.signedUrl;
      }
      console.log("[hero-cinematic] ✅ stage=signed_url", { url: sourceUrl.slice(0, 120) });
      timings.signed_url = Date.now() - t0;

      stage = "download_image";
      const dlStart = Date.now();
      const dlCtrl = new AbortController();
      const dlTimer = setTimeout(() => dlCtrl.abort(), 20_000);
      let mime = "image/jpeg";
      let b64 = "";
      try {
        const res = await fetch(sourceUrl, { signal: dlCtrl.signal });
        clearTimeout(dlTimer);
        if (!res.ok) {
          console.error("[hero-cinematic] ❌ stage=download_image", res.status);
          return { ok: false, stage, status: res.status, provider_error: `download_failed`, details: { sourceUrl: sourceUrl.slice(0, 120) } };
        }
        mime = res.headers.get("content-type") || "image/jpeg";
        const buf = new Uint8Array(await res.arrayBuffer());
        stage = "base64_conversion";
        let bin = "";
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        b64 = btoa(bin);
        console.log("[hero-cinematic] ✅ stage=download_image", { bytes: buf.length, mime });
        timings.download = Date.now() - dlStart;
      } catch (e: any) {
        clearTimeout(dlTimer);
        const aborted = e?.name === "AbortError";
        return { ok: false, stage: aborted ? "download_image_timeout" : stage, status: null, provider_error: e?.message ?? String(e), details: { sourceUrl: sourceUrl.slice(0, 120) } };
      }

      stage = "gateway_request";
      const AI_TIMEOUT_MS = 120_000;
      const aiCtrl = new AbortController();
      const aiTimer = setTimeout(() => aiCtrl.abort(), AI_TIMEOUT_MS);
      const aiStart = Date.now();
      console.log(`[hero-cinematic] 🤖 stage=gateway_request model=google/gemini-3.1-flash-image (timeout ${AI_TIMEOUT_MS}ms) payload≈${Math.round(b64.length / 1024)}KB`);

      let aiRes: Response;
      try {
        aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          signal: aiCtrl.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image",
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
        clearTimeout(aiTimer);
      } catch (e: any) {
        clearTimeout(aiTimer);
        const aborted = e?.name === "AbortError";
        console.error(`[hero-cinematic] ❌ stage=gateway_request ${aborted ? "TIMEOUT" : "exception"} after ${Date.now() - aiStart}ms`);
        return { ok: false, stage: aborted ? "gateway_timeout" : "gateway_request", status: null, provider_error: e?.message ?? String(e), details: { elapsedMs: Date.now() - aiStart } };
      }
      timings.gateway = Date.now() - aiStart;
      console.log(`[hero-cinematic] ⏱️  gateway status=${aiRes.status} in ${timings.gateway}ms`);

      if (!aiRes.ok) {
        const errTxt = await aiRes.text().catch(() => "");
        let provider_error = errTxt.slice(0, 800);
        try { const j = JSON.parse(errTxt); provider_error = j?.error?.message ?? j?.message ?? provider_error; } catch { /* noop */ }
        console.error("[hero-cinematic] ❌ stage=gateway_request", aiRes.status, provider_error);
        return { ok: false, stage: "gateway_request", status: aiRes.status, provider_error, details: { model: "google/gemini-3.1-flash-image", elapsedMs: timings.gateway } };
      }

      stage = "gemini_response";
      const payload = (await aiRes.json()) as any;
      const images: any[] = payload?.choices?.[0]?.message?.images ?? [];
      const imgUrl: string | undefined = images[0]?.image_url?.url;
      if (!imgUrl || !imgUrl.startsWith("data:")) {
        const finish = payload?.choices?.[0]?.finish_reason;
        const textOut = payload?.choices?.[0]?.message?.content;
        console.error("[hero-cinematic] ❌ stage=gemini_response no image", { finish, textOut: typeof textOut === "string" ? textOut.slice(0, 300) : textOut });
        return { ok: false, stage, status: aiRes.status, provider_error: "no_image_in_response", details: { finish_reason: finish, text: typeof textOut === "string" ? textOut.slice(0, 300) : null } };
      }
      const [, outB64] = imgUrl.split(",");
      const bytes = b64ToUint8Array(outB64);
      console.log("[hero-cinematic] ✅ stage=gemini_response", { outBytes: bytes.length });

      stage = "storage_upload";
      const outPath = `${CINEMATIC_PREFIX}/${data.memoryId}.png`;
      const { error: upErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(outPath, bytes, { contentType: "image/png", upsert: true });
      if (upErr) {
        console.error("[hero-cinematic] ❌ stage=storage_upload", upErr);
        return { ok: false, stage, status: null, provider_error: upErr.message, details: { outPath } };
      }

      stage = "database_update";
      const { error: updErr } = await supabaseAdmin
        .from("memories")
        .update({ hero_image_cinematic: outPath } as any)
        .eq("id", data.memoryId);
      if (updErr) {
        console.error("[hero-cinematic] ❌ stage=database_update", updErr);
        return { ok: false, stage, status: null, provider_error: updErr.message, details: { outPath } };
      }

      console.log("[hero-cinematic] ✅ AI image saved", { memoryId: data.memoryId, path: outPath, timings });
      return { ok: true, path: outPath, cached: false, regenerated: force, timings };
    } catch (err: any) {
      console.error(`[hero-cinematic] ❌ stage=${stage} unhandled`, err);
      return { ok: false, stage, status: null, provider_error: err?.message ?? String(err), details: { name: err?.name } };
    }
  });
