import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const BUCKET = "memory-photos";

const SELECT_PROMPT = `You are an ART DIRECTOR curating the ONE cover photo for a heartfelt MemoLove tribute to a father. The Hero MUST represent the emotional core of the tribute — preferably showing PEOPLE, FACES, and human connection (father + child, family, hug, smile, tenderness).

⚠️ MANDATORY RULE — HUMAN PRESENCE FIRST:
Before scoring aesthetics, classify EACH photo:
  - has_people: true if there is at least one visible human being (body, silhouette, or face) as the subject. A close-up of a hand holding an object, an isolated object, food, landscape, watch, or detail without a visible person = false.
  - visible_faces: number of clearly visible human faces (0 if none).
  - emotional_subject: true if the photo conveys human emotion / connection (hug, smile, gaze, affection). false for objects, details, landscapes.

DISQUALIFICATION RULE:
- If AT LEAST ONE photo in the set has has_people=true, then EVERY photo with has_people=false MUST be marked "disqualified": true and its "total" score MUST be capped at 40 (max). A disqualified photo CANNOT be chosen as best_index.
- Only if ALL photos have has_people=false, pick the best by composition/quality (no disqualification applies).

SCORING (after classification) — weighted sum 0-100:
❤️ EMOTION max 35 — hugs, natural smiles, gazes, tenderness, real connection. Penalize artificial poses and blank expressions.
📸 QUALITY max 20 — sharpness, focus, exposure, no blur.
🎨 COMPOSITION max 15 — framing, balance, clean background, depth.
💡 LIGHTING max 15 — well-lit faces, natural tone. Penalize harsh shadows/backlight.
📱 HERO COMPATIBILITY max 15 — works as full-bleed vertical cover with large "Pai." title overlay in upper third; faces not hidden by title area; hits emotionally in 1 second.

TIE-BREAKER: within 3 points, prefer more emotional frame with people, then more negative space for typography.

Return ONLY a valid JSON object matching EXACTLY this shape (no prose, no markdown):
{
  "best_index": <int — MUST NOT be a disqualified photo if any non-disqualified exists>,
  "reason": "<one sentence in Portuguese explaining why this photo represents the whole tribute>",
  "scores": [
    {
      "index": 0,
      "total": <0-100, capped at 40 if disqualified>,
      "emotion": <0-35>, "quality": <0-20>, "composition": <0-15>, "lighting": <0-15>, "hero": <0-15>,
      "has_people": <bool>,
      "visible_faces": <int>,
      "emotional_subject": <bool>,
      "disqualified": <bool>,
      "disqualification_reason": "<string or empty>"
    }
  ]
}
"index" refers to the 0-based order in which the images were provided. Output nothing else.`;

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
        await persist(only);
        console.log("[hero-select] only one photo, saved", { memoryId: data.memoryId, path: only });
        return { ok: true, path: only, cached: false, singlePhoto: true };
      }
    }

    if (force) console.log("[hero-select] ♻️ force=true — re-selecting hero photo", { memoryId: data.memoryId, count: items.length });
    else console.log("[hero-select] 🧠 selecting hero photo via AI", { memoryId: data.memoryId, count: items.length });

    // Send signed URLs directly to the model (much smaller payload than base64).
    console.log("[hero-select] 📤 preparing", resolved.length, "photos for AI");
    const validIndices: number[] = [];
    const content: any[] = [{ type: "text", text: SELECT_PROMPT }];
    resolved.forEach((r, i) => {
      if (!r.url) return;
      validIndices.push(i);
      content.push({ type: "text", text: `Photo index ${validIndices.length - 1} (original position ${i}):` });
      content.push({ type: "image_url", image_url: { url: r.url } });
    });

    if (validIndices.length === 0) {
      console.warn("[hero-select] no images could be prepared — falling back to first photo");
      if (firstPath) {
        await persist(firstPath);
        return { ok: true, path: firstPath, cached: false, fallback: true };
      }
      return { ok: false, reason: "fetch_failed" as const };
    }

    // AI call with hard timeout so the endpoint never hangs.
    const AI_TIMEOUT_MS = 60_000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    const startedAt = Date.now();
    console.log(`[hero-select] 🤖 calling gemini-2.5-pro with ${validIndices.length} photos (timeout ${AI_TIMEOUT_MS}ms)`);

    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
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
      clearTimeout(timeoutId);
      console.log(`[hero-select] ⏱️  AI responded in ${Date.now() - startedAt}ms status=${aiRes.status}`);

      if (!aiRes.ok) {
        const txt = await aiRes.text().catch(() => "");
        console.error("[hero-select] gateway error", aiRes.status, txt.slice(0, 500));
        if (firstPath) {
          await persist(firstPath);
          return { ok: true, path: firstPath, cached: false, fallback: true, reason: `ai_${aiRes.status}` };
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

      // Server-side enforcement of the human-presence rule.
      const anyHasPeople = validScores.some((s: any) => s.has_people === true);
      if (anyHasPeople) {
        for (const s of validScores) {
          if (s.has_people !== true) {
            s.disqualified = true;
            if (typeof s.total !== "number" || s.total > 40) s.total = Math.min(s.total ?? 40, 40);
            if (!s.disqualification_reason) {
              s.disqualification_reason = "Foto sem rosto humano visível; existem outras fotos com pessoas.";
            }
          }
        }
      }

      const eligible = anyHasPeople
        ? validScores.filter((s: any) => s.disqualified !== true)
        : validScores;

      // Trust AI's best_index only if it points at an eligible photo.
      const aiPick = typeof parsed?.best_index === "number" ? parsed.best_index : null;
      const aiPickEligible = aiPick != null && eligible.some((s: any) => s.index === aiPick);
      if (aiPickEligible) {
        bestLocalIdx = aiPick;
      } else if (eligible.length > 0) {
        bestLocalIdx = eligible.reduce((best: any, cur: any) => (!best || cur.total > best.total ? cur : best), null)?.index ?? null;
        if (aiPick != null && !aiPickEligible) {
          console.warn(`[hero-select] ⚠️ AI picked disqualified index ${aiPick} — overriding to ${bestLocalIdx}`);
        }
      }

      // Reject if AI produced no usable scores
      if (validScores.length === 0 || bestLocalIdx == null) {
        console.warn("[hero-select] ⚠️ invalid AI response — falling back to first photo", { raw });
        if (firstPath) {
          await persist(firstPath);
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

      await persist(finalPath);

      // Pretty per-photo log
      console.log("[hero-select] scores:");
      validScores
        .slice()
        .sort((a: any, b: any) => a.index - b.index)
        .forEach((s: any) => {
          const flag = s.disqualified ? " ❌DQ" : "";
          const ppl = s.has_people === true ? `people:yes/faces:${s.visible_faces ?? "?"}` : "people:no";
          console.log(
            `  Foto ${s.index + 1} → ${s.total}${flag}  [${ppl}]  (emotion:${s.emotion ?? "-"} quality:${s.quality ?? "-"} composition:${s.composition ?? "-"} lighting:${s.lighting ?? "-"} hero:${s.hero ?? "-"})${s.disqualified ? ` — ${s.disqualification_reason ?? ""}` : ""}`,
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
    } catch (err: any) {
      clearTimeout(timeoutId);
      const aborted = err?.name === "AbortError";
      console.error(`[hero-select] ❌ ${aborted ? "TIMEOUT" : "exception"} after ${Date.now() - startedAt}ms`, err?.message ?? err);
      if (firstPath) {
        await persist(firstPath);
        return { ok: true, path: firstPath, cached: false, fallback: true, reason: aborted ? "ai_timeout" : "exception" };
      }
      return { ok: false, reason: aborted ? ("ai_timeout" as const) : ("exception" as const) };
    }
  });
