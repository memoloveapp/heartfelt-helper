import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const BUCKET = "memory-photos";

const SELECT_PROMPT = `You are an ART DIRECTOR specialized in emotional photography, curating the ONE cover photo that will represent an entire heartfelt tribute (MemoLove) to a father. You are NOT picking the "prettiest" photo — you are picking the single frame that best tells the emotional story of the whole tribute.

Before choosing, tell yourself: "I am selecting the ONE photograph that will represent this entire tribute. Choose the most emotional, not the most technically perfect."

Score EVERY photo from 0 to 100 as a WEIGHTED SUM of these 5 criteria (max points shown):

❤️ 1. EMOTION — max 35 (MOST IMPORTANT)
   Reward: hugs, natural smiles, gazes between father and child, tenderness, spontaneous laughter, intimate moments, real connection, affection.
   Penalize: artificial poses, people looking in different directions, flat/blank expression, no feeling.

📸 2. QUALITY — max 20
   Sharpness, focus, resolution, low noise, good exposure, no motion blur.

🎨 3. COMPOSITION — max 15
   Framing, visual balance, clean background, correct horizon, subjects well placed, depth.

💡 4. LIGHTING — max 15
   Well-lit faces, pleasant contrast, natural skin tone, readable scene.
   Penalize: harsh shadows, extreme backlight, dark faces.

📱 5. HERO COMPATIBILITY — max 15 (MANDATORY)
   Imagine this photo as the full-bleed VERTICAL hero of MemoLove with the large title "Pai." overlaid on top. Ask yourself:
   - does it work as a cover?
   - is there room for the "Pai." typography (negative space, usually upper third)?
   - are faces hidden by the title area?
   - does it hit emotionally in the first second?
   - does the composition still look great cropped vertical?

TIE-BREAKER: within 3 points, prefer the more emotional frame, then the one with more negative space for typography.

Return ONLY a valid JSON object, no prose, no markdown, matching EXACTLY this shape:
{
  "best_index": <int>,
  "reason": "<one sentence in Portuguese explaining why this photo represents the whole tribute>",
  "scores": [
    {"index":0,"total":<0-100>,"emotion":<0-35>,"quality":<0-20>,"composition":<0-15>,"lighting":<0-15>,"hero":<0-15>},
    ...
  ]
}
"index" refers to the 0-based order in which the images were provided. "total" MUST equal emotion+quality+composition+lighting+hero. Output nothing else.`;

const Input = z.object({
  memoryId: z.string().uuid(),
  force: z.boolean().optional(),
});

async function fetchAsBase64(url: string): Promise<{ b64: string; mime: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mime = res.headers.get("content-type") || "image/jpeg";
    const buf = new Uint8Array(await res.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    return { b64: btoa(bin), mime };
  } catch {
    return null;
  }
}

export const selectHeroPhoto = createServerFn({ method: "POST" })
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

    const { data: mem } = await supabaseAdmin
      .from("memories")
      .select("*")
      .eq("id", data.memoryId)
      .maybeSingle();
    if (!mem) return { ok: false, reason: "memory_not_found" as const };

    const cachedPath = (mem as any).hero_selected_photo_path as string | undefined;
    if (cachedPath && !force) {
      console.log("[hero-select] ✅ using cached selection", { memoryId: data.memoryId, path: cachedPath });
      return { ok: true, path: cachedPath, cached: true };
    }

    // Safe update helper — column may not exist on external Supabase yet.
    const persist = async (path: string) => {
      const { error } = await supabaseAdmin
        .from("memories")
        .update({ hero_selected_photo_path: path } as any)
        .eq("id", data.memoryId);
      if (error) console.warn("[hero-select] ⚠️ could not persist hero_selected_photo_path", error.message);
    };

    const { data: photos } = await supabaseAdmin
      .from("memory_photos")
      .select("photo_url, position")
      .eq("memory_id", data.memoryId)
      .order("position", { ascending: true });

    const items = (photos ?? []).filter((p: any) => p?.photo_url);
    if (items.length === 0) return { ok: false, reason: "no_photos" as const };

    // Resolve to paths inside the bucket
    const toPath = (raw: string): string | null => {
      const pub = `/object/public/${BUCKET}/`;
      const sign = `/object/sign/${BUCKET}/`;
      if (raw.includes(pub)) return raw.split(pub)[1].split("?")[0];
      if (raw.includes(sign)) return raw.split(sign)[1].split("?")[0];
      if (!raw.startsWith("http")) return raw.replace(/^\/+/, "").replace(new RegExp(`^${BUCKET}/`), "");
      return null;
    };

    const resolved: { path: string | null; url: string }[] = await Promise.all(
      items.map(async (item: any) => {
        const raw = item.photo_url as string;
        const path = toPath(raw);
        if (!path) return { path: null, url: raw };
        const { data: signed } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, 600);
        return { path, url: signed?.signedUrl ?? raw };
      }),
    );

    // Single photo shortcut
    const firstPath = resolved.find((r) => r.path)?.path;
    if (items.length === 1) {
      const only = resolved[0].path;
      if (only) {
        await supabaseAdmin.from("memories").update({ hero_selected_photo_path: only } as any).eq("id", data.memoryId);
        console.log("[hero-select] only one photo, saved", { memoryId: data.memoryId, path: only });
        return { ok: true, path: only, cached: false, singlePhoto: true };
      }
    }

    if (force) console.log("[hero-select] ♻️ force=true — re-selecting hero photo", { memoryId: data.memoryId, count: items.length });
    else console.log("[hero-select] 🧠 selecting hero photo via AI", { memoryId: data.memoryId, count: items.length });

    // Fetch and encode images (parallel). Skip ones that fail.
    const encoded = await Promise.all(resolved.map((r) => fetchAsBase64(r.url)));
    const validIndices: number[] = [];
    const content: any[] = [{ type: "text", text: SELECT_PROMPT }];
    encoded.forEach((enc, i) => {
      if (!enc) return;
      validIndices.push(i);
      content.push({
        type: "text",
        text: `Photo index ${validIndices.length - 1} (original position ${i}):`,
      });
      content.push({ type: "image_url", image_url: { url: `data:${enc.mime};base64,${enc.b64}` } });
    });

    if (validIndices.length === 0) {
      console.warn("[hero-select] no images could be fetched — falling back to first photo");
      if (firstPath) {
        await supabaseAdmin.from("memories").update({ hero_selected_photo_path: firstPath } as any).eq("id", data.memoryId);
        return { ok: true, path: firstPath, cached: false, fallback: true };
      }
      return { ok: false, reason: "fetch_failed" as const };
    }

    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [{ role: "user", content }],
          response_format: { type: "json_object" },
        }),
      });

      if (!aiRes.ok) {
        const txt = await aiRes.text().catch(() => "");
        console.error("[hero-select] gateway error", aiRes.status, txt);
        // Fallback to first photo
        if (firstPath) {
          await supabaseAdmin.from("memories").update({ hero_selected_photo_path: firstPath } as any).eq("id", data.memoryId);
          return { ok: true, path: firstPath, cached: false, fallback: true };
        }
        return { ok: false, reason: "ai_failed" as const };
      }
      const payload = (await aiRes.json()) as any;
      const raw = payload?.choices?.[0]?.message?.content ?? "";
      let parsed: any = null;
      try {
        parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        // try to extract JSON substring
        const m = typeof raw === "string" ? raw.match(/\{[\s\S]*\}/) : null;
        if (m) { try { parsed = JSON.parse(m[0]); } catch { /* noop */ } }
      }

      let bestLocalIdx: number | null = null;
      const scoresArr: any[] = Array.isArray(parsed?.scores) ? parsed.scores : [];
      const validScores = scoresArr.filter(
        (s) => s && typeof s.index === "number" && typeof s.total === "number" && s.total >= 0 && s.total <= 100,
      );

      if (parsed && typeof parsed.best_index === "number") {
        bestLocalIdx = parsed.best_index;
      } else if (validScores.length > 0) {
        bestLocalIdx = validScores.reduce((best: any, cur: any) => (!best || cur.total > best.total ? cur : best), null)?.index ?? null;
      }

      // Reject if AI produced no usable scores
      if (validScores.length === 0 || bestLocalIdx == null) {
        console.warn("[hero-select] ⚠️ invalid AI response — falling back to first photo", { raw });
        if (firstPath) {
          await supabaseAdmin.from("memories").update({ hero_selected_photo_path: firstPath } as any).eq("id", data.memoryId);
          return { ok: true, path: firstPath, cached: false, fallback: true };
        }
        return { ok: false, reason: "invalid_ai_response" as const };
      }

      const bestOriginalIdx = validIndices[bestLocalIdx];
      const chosen = bestOriginalIdx != null ? resolved[bestOriginalIdx]?.path : null;
      const finalPath = chosen ?? firstPath;
      if (!finalPath) {
        console.error("[hero-select] no valid path from AI or fallback");
        return { ok: false, reason: "no_path" as const };
      }

      await supabaseAdmin
        .from("memories")
        .update({ hero_selected_photo_path: finalPath } as any)
        .eq("id", data.memoryId);

      // Pretty per-photo log
      console.log("[hero-select] scores:");
      validScores
        .slice()
        .sort((a: any, b: any) => a.index - b.index)
        .forEach((s: any) => {
          console.log(
            `  Foto ${s.index + 1} → ${s.total}  (emotion:${s.emotion ?? "-"} quality:${s.quality ?? "-"} composition:${s.composition ?? "-"} lighting:${s.lighting ?? "-"} hero:${s.hero ?? "-"})`,
          );
        });
      console.log(`[hero-select] 🏆 Foto vencedora → Foto ${bestLocalIdx + 1} (path=${finalPath})`);
      console.log(`[hero-select] Motivo: ${parsed?.reason ?? "(sem justificativa)"}`);

      return {
        ok: true,
        path: finalPath,
        cached: false,
        fallback: !chosen,
        best_index: bestLocalIdx,
        reason: parsed?.reason ?? null,
        scores: validScores,
      };
    } catch (err) {
      console.error("[hero-select] ❌ exception", err);
      if (firstPath) {
        await supabaseAdmin.from("memories").update({ hero_selected_photo_path: firstPath } as any).eq("id", data.memoryId);
        return { ok: true, path: firstPath, cached: false, fallback: true };
      }
      return { ok: false, reason: "exception" as const };
    }
  });
