// Cartão dobrável MemoLove — folha A5 paisagem (21 x 14,8 cm @ 300dpi)
// Impressão SINGLE-SIDE. Dobra vertical ao meio.
// Painel esquerdo = INTERIOR (headline + QR).
// Painel direito = CAPA (visível quando fechado).
// Dobrar levando o painel DIREITO sobre o ESQUERDO: capa fica por cima.

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
const SANS = '"Inter", system-ui, -apple-system, sans-serif';

const DPI = 300;
const CM = DPI / 2.54;
const W = Math.round(21 * CM); // 2480
const H = Math.round(14.8 * CM); // 1748
const PANEL_W = W / 2;

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

  const holeR = size * 0.08;
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

function drawOrnament(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  totalWidth: number
) {
  const gap = 12;
  const diamond = 4;
  const lineW = (totalWidth - diamond * 2 - gap * 2) / 2;
  ctx.save();
  ctx.lineWidth = LINE_W;
  const gl = ctx.createLinearGradient(cx - totalWidth / 2, y, cx - diamond - gap, y);
  gl.addColorStop(0, GOLD_LINE_FADE);
  gl.addColorStop(1, GOLD_LINE);
  ctx.strokeStyle = gl;
  ctx.beginPath();
  ctx.moveTo(cx - totalWidth / 2, y);
  ctx.lineTo(cx - totalWidth / 2 + lineW, y);
  ctx.stroke();
  const gr = ctx.createLinearGradient(cx + diamond + gap, y, cx + totalWidth / 2, y);
  gr.addColorStop(0, GOLD_LINE);
  gr.addColorStop(1, GOLD_LINE_FADE);
  ctx.strokeStyle = gr;
  ctx.beginPath();
  ctx.moveTo(cx + diamond + gap, y);
  ctx.lineTo(cx + totalWidth / 2, y);
  ctx.stroke();
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

// Dobra vertical central — pontilhado dourado extremamente discreto
function drawFoldGuide(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.strokeStyle = "rgba(184,146,74,0.28)";
  ctx.lineWidth = LINE_W;
  ctx.setLineDash([3, 8]);
  ctx.beginPath();
  ctx.moveTo(W / 2, Math.round(0.6 * CM));
  ctx.lineTo(W / 2, H - Math.round(0.6 * CM));
  ctx.stroke();
  ctx.setLineDash([]);
  // pequenas marcas de dobra nas bordas superior/inferior
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(W / 2, Math.round(0.55 * CM), 1.6, 0, Math.PI * 2);
  ctx.arc(W / 2, H - Math.round(0.55 * CM), 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Moldura impressa muito discreta por painel
function drawPanelBorder(ctx: CanvasRenderingContext2D, px: number) {
  const bm = Math.round(0.6 * CM);
  ctx.save();
  ctx.strokeStyle = "rgba(184,146,74,0.16)";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(px + bm + 0.5, bm + 0.5, PANEL_W - bm * 2 - 1, H - bm * 2 - 1);
  ctx.restore();
}

// ============ PAINEL: CAPA (direita) ============
function drawCover(ctx: CanvasRenderingContext2D, offsetX: number) {
  const cx = offsetX + PANEL_W / 2;
  drawPanelBorder(ctx, offsetX);

  // Coração dourado grande, centralizado no terço superior
  drawHeart(ctx, cx, Math.round(3.2 * CM), 20, GOLD);

  // Wordmark
  ctx.fillStyle = MUTED;
  ctx.font = `italic 400 18px ${SERIF}`;
  ctx.textAlign = "center";
  ctx.fillText("MemoLove", cx, Math.round(3.2 * CM) + 78);

  // Frase evocativa no centro
  ctx.fillStyle = INK;
  ctx.font = `italic 500 54px ${SERIF}`;
  let y = Math.round(6.8 * CM);
  ctx.fillText("Para o melhor pai", cx, y);
  y += 66;
  ctx.fillText("do mundo.", cx, y);

  // Texto secundário
  y += 70;
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 22px ${SERIF}`;
  ctx.fillText("Hoje eu queria te entregar", cx, y);
  y += 30;
  ctx.font = `italic 400 22px ${SERIF}`;
  ctx.fillText("algo diferente.", cx, y);

  // Ornamento
  y += 46;
  drawOrnament(ctx, cx, y, Math.round(2.8 * CM));

  // Convite delicado próximo ao rodapé
  ctx.fillStyle = INK_SOFT;
  ctx.font = `italic 400 22px ${SERIF}`;
  ctx.fillText("Abra este cartão.", cx, H - Math.round(1.6 * CM));
}

// ============ PAINEL: INTERIOR (esquerda) ============
function drawInterior(ctx: CanvasRenderingContext2D, offsetX: number, url: string) {
  const cx = offsetX + PANEL_W / 2;
  drawPanelBorder(ctx, offsetX);

  // Headline emocional
  ctx.fillStyle = INK;
  ctx.font = `italic 500 52px ${SERIF}`;
  ctx.textAlign = "center";
  let y = Math.round(2.4 * CM);
  ctx.fillText("Algumas lembranças", cx, y);
  y += 62;
  ctx.fillText("merecem ser revividas.", cx, y);

  // Texto íntimo
  y += 52;
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 22px ${SERIF}`;
  ctx.fillText("Reserve apenas um minuto.", cx, y);
  y += 30;
  ctx.font = `italic 400 22px ${SERIF}`;
  ctx.fillText("Há algo preparado para você.", cx, y);

  // Ornamento como transição
  y += 44;
  drawOrnament(ctx, cx, y, Math.round(2.8 * CM));

  // QR grande e centralizado
  const qrSize = Math.round(5.2 * CM);
  const qrX = cx - qrSize / 2;
  const qrY = y + Math.round(0.7 * CM);

  // Bed sutilíssimo (baixo relevo)
  const bedPad = Math.round(0.35 * CM);
  ctx.save();
  ctx.fillStyle = "rgba(255,253,247,0.55)";
  roundRect(ctx, qrX - bedPad, qrY - bedPad, qrSize + bedPad * 2, qrSize + bedPad * 2, 10);
  ctx.fill();
  ctx.shadowColor = "rgba(60,45,20,0.06)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 3;
  ctx.strokeStyle = "rgba(184,146,74,0.16)";
  ctx.lineWidth = LINE_W;
  roundRect(ctx, qrX - bedPad + 0.5, qrY - bedPad + 0.5, qrSize + bedPad * 2 - 1, qrSize + bedPad * 2 - 1, 10);
  ctx.stroke();
  ctx.restore();

  drawPremiumQR(ctx, url, qrX, qrY, qrSize);

  // Convite humano abaixo do QR
  const btmY = qrY + qrSize + bedPad + Math.round(0.75 * CM);
  ctx.fillStyle = INK;
  ctx.font = `italic 400 24px ${SERIF}`;
  ctx.fillText("Quando estiver pronto,", cx, btmY);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `italic 400 22px ${SERIF}`;
  ctx.fillText("aponte a câmera.", cx, btmY + 30);

  // Rodapé mínimo
  const footerY = H - Math.round(1.0 * CM);
  drawHairline(ctx, cx, footerY - 14, Math.round(1.4 * CM));
  ctx.fillStyle = MUTED;
  ctx.font = `italic 400 14px ${SERIF}`;
  ctx.fillText("MemoLove", cx, footerY + 4);
}

export async function generateCartaoBlob(url: string): Promise<Blob> {
  await ensureFontsLoaded();

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.textBaseline = "alphabetic";

  // Papel
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.85);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(120,90,40,0.05)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  addPaperTexture(ctx);

  // Painéis: esquerda = INTERIOR, direita = CAPA
  drawInterior(ctx, 0, url);
  drawCover(ctx, PANEL_W);

  // Guia de dobra central
  drawFoldGuide(ctx);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("blob failed"))),
      "image/png"
    );
  });
}

export async function downloadCartao(url: string, slug: string) {
  const blob = await generateCartaoBlob(url);
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = `memolove-cartao-${slug}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
