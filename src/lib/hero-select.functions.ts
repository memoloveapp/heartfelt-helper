import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const BUCKET = "memory-photos";

const SELECT_PROMPT = `You are a senior photo editor curating the COVER photo of a heartfelt tribute (MemoLove). You will receive several candidate photos from the same tribute. Score EACH photo from 0 to 100 based on how well it works as the emotional hero image, using these weighted criteria:

1. EMOTION (very high weight): hugs, smiles, tenderness, meaningful gazes, spontaneous connection between people.
2. QUALITY: sharp focus, high resolution, no motion blur, no heavy noise.
3. LIGHTING: faces are well-lit, balanced exposure, pleasant contrast, scene is readable.
4. COMPOSITION: good framing, people centered or well-placed, clean background, sense of depth.
5. HERO COMPATIBILITY (important): the photo must work as a full-bleed vertical hero with a large title "Pai." overlaid. Faces MUST NOT be hidden by the title area, there must be enough negative space, and the composition must survive a vertical crop.
6. AVOID: blurry, too dark, too bright, cropped faces, people with backs turned, closed/blinking eyes, partially hidden faces, bad selfies, low resolution.

TIE-BREAKER: if two photos are within 3 points of each other, prefer the one with more negative space for typography.

Return ONLY a valid JSON object, no prose, no markdown, matching exactly this shape:
{"scores":[{"index":0,"score":<0-100>,"reason":"<short>"}, ...],"best_index":<int>}
Where index refers to the order the images were provided (0-based). Nothing else.`;

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
      .select("id, hero_selected_photo_path")
      .eq("id", data.memoryId)
      .maybeSingle();
    if (!mem) return { ok: false, reason: "memory_not_found" as const };

    if ((mem as any).hero_selected_photo_path && !force) {
      console.log("[hero-select] ✅ using cached selection", { memoryId: data.memoryId, path: (mem as any).hero_selected_photo_path });
      return { ok: true, path: (mem as any).hero_selected_photo_path, cached: true };
    }

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
      if (parsed && typeof parsed.best_index === "number") {
        bestLocalIdx = parsed.best_index;
      } else if (parsed && Array.isArray(parsed.scores)) {
        bestLocalIdx = parsed.scores.reduce((best: any, cur: any) => (!best || cur.score > best.score ? cur : best), null)?.index ?? null;
      }

      const bestOriginalIdx = bestLocalIdx != null ? validIndices[bestLocalIdx] : null;
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

      console.log("[hero-select] ✅ chosen", {
        memoryId: data.memoryId,
        path: finalPath,
        chosenIdx: bestOriginalIdx,
        scores: parsed?.scores ?? null,
        fallback: !chosen,
      });
      return { ok: true, path: finalPath, cached: false, fallback: !chosen, scores: parsed?.scores ?? null };
    } catch (err) {
      console.error("[hero-select] ❌ exception", err);
      if (firstPath) {
        await supabaseAdmin.from("memories").update({ hero_selected_photo_path: firstPath } as any).eq("id", data.memoryId);
        return { ok: true, path: firstPath, cached: false, fallback: true };
      }
      return { ok: false, reason: "exception" as const };
    }
  });
