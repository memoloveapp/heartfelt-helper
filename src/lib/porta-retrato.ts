// Porta-retrato — carta escondida (10x15cm @ 300dpi)
// Direção: uma pequena lembrança, não um QR Code.

import QRCode from "qrcode";

const BG = "#F6F1E7";
const INK = "#1A1815";
const INK_SOFT = "#5B534A";
const MUTED = "#8A8177";
const GOLD = "#B8924A";
const GOLD_SOFT = "#D9BF86";

const SERIF = '"Cormorant Garamond", "EB Garamond", "Fraunces", Georgia, serif';
const SANS = '"Inter", system-ui, -apple-system, sans-serif';

const DPI = 300;
const CM = DPI / 2.54;
const W = Math.round(10 * CM);
const H = Math.round(15 * CM);

async function ensureFontsLoaded() {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`italic 500 96px ${SERIF}`),
      document.fonts.load(`italic 400 40px ${SERIF}`),
      document.fonts.load(`400 40px ${SERIF}`),
      document.fonts.load(`600 18px ${SANS}`),
    ]);
    await document.fonts.ready;
  } catch {
    /* fallback */
  }
}

function addPaperTexture(ctx: CanvasRenderingContext2D) {
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 5;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
) {
  const s = size;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const topY = cy - s * 0.35;
  ctx.moveTo(cx, cy + s * 0.55);
  ctx.bezierCurveTo(cx - s * 1.1, cy, cx - s * 0.9, topY - s * 0.55, cx, topY + s * 0.15);
  ctx.bezierCurveTo(cx + s * 0.9, topY - s * 0.55, cx + s * 1.1, cy, cx, cy + s * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawPremiumQR(
  ctx: CanvasRenderingContext2D,
  url: string,
  x: number,
  y: number,
  size: number
) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const n: number = qr.modules.size;
  const data: Uint8Array = qr.modules.data as unknown as Uint8Array;
  const cell = size / n;

  ctx.save();
  ctx.fillStyle = INK;

  const isFinder = (r: number, c: number) => {
    const inTL = r < 8 && c < 8;
    const inTR = r < 8 && c >= n - 8;
    const inBL = r >= n - 8 && c < 8;
    return inTL || inTR || inBL;
  };

  const dotR = cell * 0.42;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!data[r * n + c]) continue;
      if (isFinder(r, c)) continue;
      const px = x + c * cell + cell / 2;
      const py = y + r * cell + cell / 2;
      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const drawFinder = (fr: number, fc: number) => {
    const outerX = x + fc * cell;
    const outerY = y + fr * cell;
    const outer = 7 * cell;
    const inner = 5 * cell;
    const dot = 3 * cell;
    ctx.fillStyle = INK;
    roundRect(ctx, outerX, outerY, outer, outer, cell * 1.6);
    ctx.fill();
    ctx.fillStyle = BG;
    roundRect(ctx, outerX + cell, outerY + cell, inner, inner, cell * 1.2);
    ctx.fill();
    ctx.fillStyle = INK;
    roundRect(ctx, outerX + 2 * cell, outerY + 2 * cell, dot, dot, cell * 0.8);
    ctx.fill();
  };

  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);

  ctx.restore();

  const holeR = size * 0.085;
  const cxq = x + size / 2;
  const cyq = y + size / 2;
  ctx.save();
  ctx.fillStyle = BG;
  ctx.beginPath();
  ctx.arc(cxq, cyq, holeR + cell * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawHeart(ctx, cxq, cyq, holeR * 0.95, GOLD);
}

function drawHairline(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  width: number,
  color = GOLD_SOFT
) {
  const g = ctx.createLinearGradient(cx - width / 2, y, cx + width / 2, y);
  g.addColorStop(0, "rgba(184,146,74,0)");
  g.addColorStop(0.5, color);
  g.addColorStop(1, "rgba(184,146,74,0)");
  ctx.save();
  ctx.strokeStyle = g;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - width / 2, y);
  ctx.lineTo(cx + width / 2, y);
  ctx.stroke();
  ctx.restore();
}

// Ornamento editorial: linha — losango — linha
function drawOrnament(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  totalWidth: number
) {
  const gap = 10;
  const diamond = 5;
  const lineW = (totalWidth - diamond * 2 - gap * 2) / 2;

  // linha esquerda com fade
  const gl = ctx.createLinearGradient(cx - totalWidth / 2, y, cx - diamond - gap, y);
  gl.addColorStop(0, "rgba(184,146,74,0)");
  gl.addColorStop(1, GOLD_SOFT);
  ctx.save();
  ctx.strokeStyle = gl;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - totalWidth / 2, y);
  ctx.lineTo(cx - totalWidth / 2 + lineW, y);
  ctx.stroke();

  // linha direita
  const gr = ctx.createLinearGradient(cx + diamond + gap, y, cx + totalWidth / 2, y);
  gr.addColorStop(0, GOLD_SOFT);
  gr.addColorStop(1, "rgba(184,146,74,0)");
  ctx.strokeStyle = gr;
  ctx.beginPath();
  ctx.moveTo(cx + diamond + gap, y);
  ctx.lineTo(cx + totalWidth / 2, y);
  ctx.stroke();

  // losango dourado central
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(cx, y - diamond);
  ctx.lineTo(cx + diamond, y);
  ctx.lineTo(cx, y + diamond);
  ctx.lineTo(cx - diamond, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export async function generatePortaRetratoBlob(url: string): Promise<Blob> {
  await ensureFontsLoaded();

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.textBaseline = "alphabetic";

  // ============ PAPEL ============
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.42, W / 2, H / 2, W * 0.95);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(120,90,40,0.06)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  addPaperTexture(ctx);

  const topG = ctx.createLinearGradient(0, 0, 0, H * 0.45);
  topG.addColorStop(0, "rgba(255,255,255,0.22)");
  topG.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = topG;
  ctx.fillRect(0, 0, W, H * 0.45);

  const cx = W / 2;

  // ============ 1. ASSINATURA DISCRETA (topo) ============
  // Coração dourado minúsculo + wordmark quase invisível
  drawHeart(ctx, cx, Math.round(1.35 * CM), 5.5, GOLD);
  ctx.fillStyle = MUTED;
  ctx.font = `italic 400 15px ${SERIF}`;
  ctx.textAlign = "center";
  ctx.fillText("MemoLove", cx, Math.round(1.35 * CM) + 34);

  // ============ 2. HEADLINE EMOCIONAL ============
  ctx.fillStyle = INK;
  ctx.font = `italic 500 62px ${SERIF}`;
  let ty = Math.round(3.4 * CM);
  ctx.fillText("Algumas lembranças", cx, ty);
  ty += 74;
  ctx.fillText("merecem ser revividas.", cx, ty);

  // ============ 3. TEXTO ÍNTIMO ============
  ty += 62;
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 24px ${SERIF}`;
  ctx.fillText("Reserve apenas um minuto.", cx, ty);
  ty += 32;
  ctx.font = `italic 400 24px ${SERIF}`;
  ctx.fillText("Há algo preparado para você.", cx, ty);

  // ============ 4. TRANSIÇÃO EDITORIAL ============
  ty += 58;
  drawOrnament(ctx, cx, ty, Math.round(3.2 * CM));

  // ============ 5. QR — protagonista integrado ============
  const qrSize = Math.round(4.4 * CM);
  const qrX = (W - qrSize) / 2;
  const qrY = ty + Math.round(0.9 * CM);

  drawPremiumQR(ctx, url, qrX, qrY, qrSize);

  // ============ 6. CONVITE HUMANO ABAIXO DO QR ============
  const btmY = qrY + qrSize + Math.round(0.9 * CM);
  ctx.fillStyle = INK;
  ctx.font = `italic 400 26px ${SERIF}`;
  ctx.fillText("Quando estiver pronto,", cx, btmY);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `italic 400 24px ${SERIF}`;
  ctx.fillText("aponte a câmera.", cx, btmY + 34);

  // ============ 7. RODAPÉ MÍNIMO ============
  const footerY = H - Math.round(0.85 * CM);
  drawHairline(ctx, cx, footerY - 14, Math.round(1.2 * CM));
  ctx.fillStyle = MUTED;
  ctx.font = `italic 400 13px ${SERIF}`;
  ctx.fillText("feito com carinho", cx, footerY + 4);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("blob failed"))),
      "image/png"
    );
  });
}

export async function downloadPortaRetrato(url: string, slug: string) {
  const blob = await generatePortaRetratoBlob(url);
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = `memolove-porta-retrato-${slug}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
