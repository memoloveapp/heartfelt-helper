// Tag para presente MemoLove — etiqueta premium (dupla face)
// Cada face: 5 x 9,5 cm @ 300dpi. Vertical, minimalista, luxuosa.
// Frente: assinatura + frase única + micro convite. Verso: QR + convite.
// Topo: reforço gráfico editorial (arco dourado + furo centralizado).

import QRCode from "qrcode";

const BG = "#F6F1E7";
const INK = "#1A1815";
const INK_SOFT = "#5B534A";
const MUTED = "#8A8177";
const GOLD = "#B8924A";

const SERIF = '"Cormorant Garamond", "EB Garamond", "Fraunces", Georgia, serif';

const DPI = 300;
const CM = DPI / 2.54;
const TAG_W = Math.round(5.0 * CM);   // 591
const TAG_H = Math.round(9.5 * CM);   // 1122
const GAP = Math.round(1.0 * CM);
const PAD = Math.round(0.6 * CM);
const W = PAD * 2 + TAG_W * 2 + GAP;
const H = PAD * 2 + TAG_H;

const LINE_W = 0.9;

async function ensureFontsLoaded() {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`italic 500 96px ${SERIF}`),
      document.fonts.load(`italic 400 40px ${SERIF}`),
      document.fonts.load(`400 40px ${SERIF}`),
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

// Silhueta da tag com reforço gráfico premium no topo (arco dourado + furo)
function drawTagShape(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const r = Math.round(0.5 * CM); // cantos generosamente arredondados
  const cx = x + TAG_W / 2;

  // sombra impressa quase imperceptível
  ctx.save();
  ctx.shadowColor = "rgba(60,45,20,0.05)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = BG;
  roundRect(ctx, x, y, TAG_W, TAG_H, r);
  ctx.fill();
  ctx.restore();

  // borda impressa extremamente fina
  ctx.save();
  ctx.strokeStyle = "rgba(184,146,74,0.22)";
  ctx.lineWidth = LINE_W;
  roundRect(ctx, x + 0.5, y + 0.5, TAG_W - 1, TAG_H - 1, r);
  ctx.stroke();
  ctx.restore();

  // ===== REFORÇO GRÁFICO DO TOPO =====
  const holeY = y + Math.round(0.75 * CM);
  const holeR = Math.round(0.18 * CM);

  // arco dourado sutil circundando o furo (evoca ilhós metálico)
  ctx.save();
  ctx.strokeStyle = "rgba(184,146,74,0.55)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, holeY, holeR + 6, 0, Math.PI * 2);
  ctx.stroke();
  // segundo anel muito fino externo (dupla borda de ilhós)
  ctx.strokeStyle = "rgba(184,146,74,0.28)";
  ctx.lineWidth = LINE_W;
  ctx.beginPath();
  ctx.arc(cx, holeY, holeR + 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // furo em si — pequeno disco vazado (indica corte)
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx, holeY, holeR, 0, Math.PI * 2);
  ctx.fill();
  // guia de corte pontilhada dentro do furo
  ctx.strokeStyle = "rgba(60,45,20,0.25)";
  ctx.lineWidth = LINE_W;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.arc(cx, holeY, holeR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ============ FRENTE ============
function drawFront(ctx: CanvasRenderingContext2D, x: number, y: number) {
  drawTagShape(ctx, x, y);
  const cx = x + TAG_W / 2;

  // 1. Assinatura MemoLove — extremamente discreta, abaixo do ilhós
  ctx.fillStyle = MUTED;
  ctx.font = `italic 400 13px ${SERIF}`;
  ctx.textAlign = "center";
  ctx.fillText("MemoLove", cx, y + Math.round(1.85 * CM));

  // 2. Frase única — centro óptico, italic serif grande e respirada
  ctx.fillStyle = INK;
  ctx.font = `italic 500 40px ${SERIF}`;
  const py = y + Math.round(4.6 * CM);
  ctx.fillText("Para o", cx, py);
  ctx.fillText("melhor pai.", cx, py + 46);

  // 3. Micro convite inferior
  ctx.fillStyle = INK_SOFT;
  ctx.font = `italic 400 15px ${SERIF}`;
  ctx.fillText("abra este presente", cx, y + TAG_H - Math.round(0.9 * CM));
}

// ============ VERSO ============
function drawBack(ctx: CanvasRenderingContext2D, x: number, y: number, url: string) {
  drawTagShape(ctx, x, y);
  const cx = x + TAG_W / 2;

  // QR grande e centralizado — protagonista absoluto
  const qrSize = Math.round(3.6 * CM);
  const qrX = cx - qrSize / 2;
  const qrY = y + Math.round(3.2 * CM);
  drawPremiumQR(ctx, url, qrX, qrY, qrSize);

  // Convite humano
  const btmY = qrY + qrSize + Math.round(0.85 * CM);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `italic 400 18px ${SERIF}`;
  ctx.textAlign = "center";
  ctx.fillText("aponte a câmera.", cx, btmY);
}

export async function generateTagPresenteBlob(url: string): Promise<Blob> {
  await ensureFontsLoaded();

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.textBaseline = "alphabetic";

  // Fundo da folha
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.85);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(120,90,40,0.05)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  addPaperTexture(ctx);

  drawFront(ctx, PAD, PAD);
  drawBack(ctx, PAD + TAG_W + GAP, PAD, url);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("blob failed"))),
      "image/png"
    );
  });
}

export async function downloadTagPresente(url: string, slug: string) {
  const blob = await generateTagPresenteBlob(url);
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = `memolove-tag-presente-${slug}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
