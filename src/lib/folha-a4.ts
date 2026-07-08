// Folha A4 MemoLove — peça editorial premium (retrato)
// A4: 21,0 x 29,7 cm @ 300dpi. Muito respiro. Homenagem impressa.

import QRCode from "qrcode";

const BG = "#F6F1E7";
const INK = "#1A1815";
const INK_SOFT = "#5B534A";
const MUTED = "#8A8177";
const GOLD = "#B8924A";

const SERIF = '"Cormorant Garamond", "EB Garamond", "Fraunces", Georgia, serif';

const DPI = 300;
const CM = DPI / 2.54;
const W = Math.round(21.0 * CM);   // 2480
const H = Math.round(29.7 * CM);   // 3508
const MX = Math.round(2.6 * CM);   // margem lateral generosa

const LINE_W = 1.0;

async function ensureFontsLoaded() {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`italic 500 140px ${SERIF}`),
      document.fonts.load(`italic 400 40px ${SERIF}`),
      document.fonts.load(`400 30px ${SERIF}`),
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
      ctx.beginPath();
      ctx.arc(x + c * cell + cell / 2, y + r * cell + cell / 2, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const drawFinder = (fr: number, fc: number) => {
    const ox = x + fc * cell;
    const oy = y + fr * cell;
    ctx.fillStyle = INK;
    roundRect(ctx, ox, oy, 7 * cell, 7 * cell, cell * 1.6);
    ctx.fill();
    ctx.fillStyle = BG;
    roundRect(ctx, ox + cell, oy + cell, 5 * cell, 5 * cell, cell * 1.2);
    ctx.fill();
    ctx.fillStyle = INK;
    roundRect(ctx, ox + 2 * cell, oy + 2 * cell, 3 * cell, 3 * cell, cell * 0.8);
    ctx.fill();
  };
  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);
  ctx.restore();

  // Coração dourado no centro (miolo integrado)
  const holeR = size * 0.075;
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

function drawHairline(ctx: CanvasRenderingContext2D, cx: number, y: number, len: number) {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = LINE_W;
  ctx.beginPath();
  ctx.moveTo(cx - len / 2, y);
  ctx.lineTo(cx + len / 2, y);
  ctx.stroke();
  ctx.restore();
}

function drawCornerMarks(ctx: CanvasRenderingContext2D) {
  // Cantos editoriais extremamente sutis — micro filetes dourados
  const inset = Math.round(1.3 * CM);
  const len = Math.round(0.55 * CM);
  ctx.save();
  ctx.strokeStyle = "rgba(184,146,74,0.35)";
  ctx.lineWidth = LINE_W;
  const corners = [
    [inset, inset, 1, 1],
    [W - inset, inset, -1, 1],
    [inset, H - inset, 1, -1],
    [W - inset, H - inset, -1, -1],
  ] as const;
  for (const [x, y, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + sx * len, y);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + sy * len);
    ctx.stroke();
  }
  ctx.restore();
}

export async function generateFolhaA4Blob(url: string): Promise<Blob> {
  await ensureFontsLoaded();

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.textBaseline = "alphabetic";

  // Fundo
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.9);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(120,90,40,0.06)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  addPaperTexture(ctx);

  drawCornerMarks(ctx);

  const cx = W / 2;
  ctx.textAlign = "center";

  // 1. Assinatura MemoLove — discreta no alto
  ctx.fillStyle = MUTED;
  ctx.font = `italic 400 34px ${SERIF}`;
  ctx.fillText("MemoLove", cx, Math.round(3.2 * CM));

  // pequeno filete de abertura
  drawHairline(ctx, cx, Math.round(3.7 * CM), Math.round(1.4 * CM));

  // 2. Headline emocional — grande, elegante, italic
  ctx.fillStyle = INK;
  ctx.font = `italic 500 132px ${SERIF}`;
  const hlY = Math.round(7.6 * CM);
  ctx.fillText("Algumas lembranças", cx, hlY);
  ctx.fillText("merecem voltar a viver.", cx, hlY + 148);

  // 3. Texto curto — emocional
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 38px ${SERIF}`;
  const txtY = Math.round(13.6 * CM);
  ctx.fillText("Reserve apenas um instante.", cx, txtY);
  ctx.fillText("Preparei algo especialmente para você.", cx, txtY + 60);

  // 4. Linha editorial fina — conduz o olhar até o QR
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = LINE_W;
  const lineY = Math.round(15.8 * CM);
  ctx.beginPath();
  ctx.moveTo(cx, lineY);
  ctx.lineTo(cx, lineY + Math.round(1.6 * CM));
  ctx.stroke();
  ctx.restore();

  // coração dourado no meio da linha (micro-detalhe editorial)
  drawHeart(ctx, cx, lineY + Math.round(0.8 * CM), 9, GOLD);

  // 5. QR protagonista — grande, centralizado
  const qrSize = Math.round(7.6 * CM);
  const qrX = cx - qrSize / 2;
  const qrY = Math.round(18.2 * CM);

  // leito de papel sutil atrás do QR
  ctx.save();
  ctx.shadowColor = "rgba(60,45,20,0.06)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = BG;
  const pad = Math.round(0.45 * CM);
  roundRect(ctx, qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, Math.round(0.35 * CM));
  ctx.fill();
  ctx.restore();

  drawPremiumQR(ctx, url, qrX, qrY, qrSize);

  // 6. Convite abaixo do QR
  ctx.fillStyle = INK_SOFT;
  ctx.font = `italic 400 40px ${SERIF}`;
  const cvY = qrY + qrSize + Math.round(1.4 * CM);
  ctx.fillText("Quando estiver pronto,", cx, cvY);
  ctx.fillText("aponte a câmera.", cx, cvY + 58);

  // 7. Rodapé — assinatura discreta
  drawHairline(ctx, cx, H - Math.round(2.4 * CM), Math.round(1.0 * CM));
  ctx.fillStyle = MUTED;
  ctx.font = `italic 400 26px ${SERIF}`;
  ctx.fillText("MemoLove", cx, H - Math.round(1.7 * CM));

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("blob failed"))),
      "image/png"
    );
  });
}

export async function downloadFolhaA4(url: string, slug: string) {
  const blob = await generateFolhaA4Blob(url);
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = `memolove-folha-a4-${slug}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
