// Tag para presente MemoLove — dupla face (FRENTE + VERSO) em folha única
// Cada face: 6 x 11 cm @ 300dpi, cantos arredondados, furo superior indicado.
// Imprimir, recortar, colar costas com costas.

import QRCode from "qrcode";

const BG = "#F6F1E7";
const INK = "#1A1815";
const INK_SOFT = "#5B534A";
const MUTED = "#8A8177";
const GOLD = "#B8924A";
const GOLD_LINE = "rgba(184,146,74,0.55)";
const GOLD_LINE_FADE = "rgba(184,146,74,0)";
const LINE_W = 0.9;

const SERIF = '"Cormorant Garamond", "EB Garamond", "Fraunces", Georgia, serif';

const DPI = 300;
const CM = DPI / 2.54;
const TAG_W = Math.round(6 * CM); // 709
const TAG_H = Math.round(11 * CM); // 1299
const GAP = Math.round(1.2 * CM);
const PAD = Math.round(0.6 * CM); // margem sheet
const W = PAD * 2 + TAG_W * 2 + GAP;
const H = PAD * 2 + TAG_H;

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
  width: number
) {
  const g = ctx.createLinearGradient(cx - width / 2, y, cx + width / 2, y);
  g.addColorStop(0, GOLD_LINE_FADE);
  g.addColorStop(0.5, GOLD_LINE);
  g.addColorStop(1, GOLD_LINE_FADE);
  ctx.save();
  ctx.strokeStyle = g;
  ctx.lineWidth = LINE_W;
  ctx.beginPath();
  ctx.moveTo(cx - width / 2, y);
  ctx.lineTo(cx + width / 2, y);
  ctx.stroke();
  ctx.restore();
}

// Silhueta da tag: retângulo arredondado com "furo" superior indicado por um círculo vazado
function drawTagShape(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const r = Math.round(0.35 * CM); // cantos arredondados
  ctx.save();

  // sombra impressa quase imperceptível
  ctx.shadowColor = "rgba(60,45,20,0.05)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = BG;
  roundRect(ctx, x, y, TAG_W, TAG_H, r);
  ctx.fill();
  ctx.restore();

  // borda impressa extremamente fina
  ctx.save();
  ctx.strokeStyle = "rgba(184,146,74,0.20)";
  ctx.lineWidth = LINE_W;
  roundRect(ctx, x + 0.5, y + 0.5, TAG_W - 1, TAG_H - 1, r);
  ctx.stroke();
  ctx.restore();

  // marcação do furo superior — anel dourado sutil + guias de corte finíssimas
  const cx = x + TAG_W / 2;
  const holeY = y + Math.round(0.75 * CM);
  const holeR = Math.round(0.22 * CM);

  ctx.save();
  ctx.strokeStyle = "rgba(184,146,74,0.30)";
  ctx.lineWidth = LINE_W;
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.arc(cx, holeY, holeR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ponto dourado central microscópico (centro do furo)
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(cx, holeY, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // pequena legenda editorial abaixo do furo (só na primeira renderização — micro guia)
  ctx.save();
  ctx.fillStyle = MUTED;
  ctx.font = `italic 400 11px ${SERIF}`;
  ctx.textAlign = "center";
  ctx.fillText("· fure aqui ·", cx, holeY + holeR + 16);
  ctx.restore();
}

// FRENTE — assinatura, frase, convite
function drawFront(ctx: CanvasRenderingContext2D, x: number, y: number) {
  drawTagShape(ctx, x, y);
  const cx = x + TAG_W / 2;

  // Coração dourado central alto
  drawHeart(ctx, cx, y + Math.round(2.4 * CM), 11, GOLD);

  // Wordmark
  ctx.fillStyle = MUTED;
  ctx.font = `italic 400 14px ${SERIF}`;
  ctx.textAlign = "center";
  ctx.fillText("MemoLove", cx, y + Math.round(2.4 * CM) + 42);

  // Hairline curta
  drawHairline(ctx, cx, y + Math.round(3.5 * CM), Math.round(1.4 * CM));

  // Frase principal — íntima
  ctx.fillStyle = INK;
  ctx.font = `italic 500 34px ${SERIF}`;
  const py = y + Math.round(5.5 * CM);
  ctx.fillText("Há uma lembrança", cx, py);
  ctx.fillText("esperando por você.", cx, py + 40);

  // Hairline curta
  drawHairline(ctx, cx, y + TAG_H - Math.round(2.1 * CM), Math.round(1.2 * CM));

  // Convite inferior
  ctx.fillStyle = INK_SOFT;
  ctx.font = `italic 400 18px ${SERIF}`;
  ctx.fillText("Abra este presente.", cx, y + TAG_H - Math.round(1.3 * CM));
}

// VERSO — QR grande + convite
function drawBack(ctx: CanvasRenderingContext2D, x: number, y: number, url: string) {
  drawTagShape(ctx, x, y);
  const cx = x + TAG_W / 2;

  // Wordmark discreto no topo
  ctx.fillStyle = MUTED;
  ctx.font = `italic 400 14px ${SERIF}`;
  ctx.textAlign = "center";
  ctx.fillText("MemoLove", cx, y + Math.round(2.0 * CM));

  drawHairline(ctx, cx, y + Math.round(2.35 * CM), Math.round(1.2 * CM));

  // QR grande e centralizado
  const qrSize = Math.round(3.9 * CM);
  const qrX = cx - qrSize / 2;
  const qrY = y + Math.round(3.1 * CM);

  // Bed sutil (baixo relevo)
  const bedPad = Math.round(0.3 * CM);
  ctx.save();
  ctx.fillStyle = "rgba(255,253,247,0.55)";
  roundRect(ctx, qrX - bedPad, qrY - bedPad, qrSize + bedPad * 2, qrSize + bedPad * 2, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(184,146,74,0.16)";
  ctx.lineWidth = LINE_W;
  roundRect(ctx, qrX - bedPad + 0.5, qrY - bedPad + 0.5, qrSize + bedPad * 2 - 1, qrSize + bedPad * 2 - 1, 8);
  ctx.stroke();
  ctx.restore();

  drawPremiumQR(ctx, url, qrX, qrY, qrSize);

  // Convite humano
  const btmY = qrY + qrSize + bedPad + Math.round(0.7 * CM);
  ctx.fillStyle = INK;
  ctx.font = `italic 400 20px ${SERIF}`;
  ctx.fillText("Quando estiver pronto,", cx, btmY);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `italic 400 18px ${SERIF}`;
  ctx.fillText("aponte a câmera.", cx, btmY + 26);
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
  const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.8);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(120,90,40,0.05)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  addPaperTexture(ctx);

  // Duas faces lado a lado
  const y0 = PAD;
  drawFront(ctx, PAD, y0);
  drawBack(ctx, PAD + TAG_W + GAP, y0, url);

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
