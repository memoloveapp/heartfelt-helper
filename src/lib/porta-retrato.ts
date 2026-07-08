// Porta-retrato editorial final — cartão 10x15cm @ 300dpi
// Direção: objeto de presente, não documento. QR incorporado ao papel.

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
      document.fonts.load(`400 18px ${SANS}`),
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

// QR renderizado diretamente sobre o papel off-white (sem placa branca).
// Módulos arredondados em tinta escura.
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
    // recorte = cor do papel (mantém integração ao fundo)
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

  // Coração dourado central — pequeno respiro no papel (~10%, ECC H)
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

function drawCornerBrackets(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  len: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.lineCap = "square";
  const segs: Array<[number, number, number, number]> = [
    [x, y, x + len, y],
    [x, y, x, y + len],
    [x + w - len, y, x + w, y],
    [x + w, y, x + w, y + len],
    [x, y + h, x + len, y + h],
    [x, y + h - len, x, y + h],
    [x + w - len, y + h, x + w, y + h],
    [x + w, y + h - len, x + w, y + h],
  ];
  for (const [x1, y1, x2, y2] of segs) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
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

// Filete vertical com fade (conduz o olhar título → QR)
function drawVerticalGuide(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y1: number,
  y2: number,
  color = GOLD_SOFT
) {
  const g = ctx.createLinearGradient(cx, y1, cx, y2);
  g.addColorStop(0, "rgba(184,146,74,0)");
  g.addColorStop(0.5, color);
  g.addColorStop(1, "rgba(184,146,74,0)");
  ctx.save();
  ctx.strokeStyle = g;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, y1);
  ctx.lineTo(cx, y2);
  ctx.stroke();
  ctx.restore();
}

function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  spacing: number
) {
  const chars = text.split("");
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + spacing;
  });
  ctx.textAlign = prevAlign;
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

  const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.42, W / 2, H / 2, W * 0.92);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(120,90,40,0.06)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  addPaperTexture(ctx);

  const topG = ctx.createLinearGradient(0, 0, 0, H * 0.4);
  topG.addColorStop(0, "rgba(255,255,255,0.24)");
  topG.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = topG;
  ctx.fillRect(0, 0, W, H * 0.4);

  // ============ MOLDURA — hairline única discreta com brackets nos cantos ============
  const m = Math.round(0.6 * CM);
  ctx.save();
  ctx.strokeStyle = "rgba(184,146,74,0.22)";
  ctx.lineWidth = 1;
  ctx.strokeRect(m + 0.5, m + 0.5, W - m * 2 - 1, H - m * 2 - 1);
  ctx.restore();

  // pequenos serifas nos cantos (marca editorial)
  drawCornerBrackets(ctx, m, m, W - m * 2, H - m * 2, 26, "rgba(184,146,74,0.55)");

  const cx = W / 2;

  // ============ TOPO — abertura emocional ============
  // Coração dourado minúsculo centralizado
  drawHeart(ctx, cx, Math.round(1.35 * CM), 7, GOLD);

  // Sussurro em italic (sem selo, sem tracking)
  ctx.fillStyle = INK_SOFT;
  ctx.font = `italic 400 22px ${SERIF}`;
  ctx.textAlign = "center";
  ctx.fillText("para você", cx, Math.round(1.35 * CM) + 44);

  // Numeração editorial delicada (— i —)
  ctx.fillStyle = MUTED;
  ctx.font = `400 14px ${SERIF}`;
  ctx.fillText("— i —", cx, Math.round(1.35 * CM) + 74);

  // ============ TÍTULO EMOCIONAL ============
  ctx.fillStyle = INK;
  ctx.font = `italic 500 56px ${SERIF}`;
  ctx.textAlign = "center";
  let ty = Math.round(3.2 * CM);
  ctx.fillText("Algumas lembranças", cx, ty);
  ty += 66;
  ctx.fillText("nunca deveriam", cx, ty);
  ty += 66;
  ctx.fillText("ser esquecidas.", cx, ty);

  // Preâmbulo curto, íntimo
  ty += 58;
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 23px ${SERIF}`;
  ctx.fillText("Existe uma homenagem", cx, ty);
  ty += 30;
  ctx.fillText("esperando por você.", cx, ty);

  // ============ FILETE VERTICAL — conduz o olhar até o QR ============
  const qrSize = Math.round(4.7 * CM); // reduzido ~10% e mais respiro
  const qrX = (W - qrSize) / 2;
  const qrY = Math.round(8.55 * CM);

  drawVerticalGuide(ctx, cx, ty + 22, qrY - 46);

  // ============ QR — direto sobre o papel, sem placa ============
  drawPremiumQR(ctx, url, qrX, qrY, qrSize);

  // Corner brackets muito finos ao redor (viewfinder editorial)
  const off = Math.round(0.4 * CM);
  drawCornerBrackets(
    ctx,
    qrX - off,
    qrY - off,
    qrSize + off * 2,
    qrSize + off * 2,
    20,
    "rgba(184,146,74,0.7)"
  );

  // ============ ABAIXO DO QR — convite íntimo ============
  const btmY = qrY + qrSize + off + Math.round(0.85 * CM);
  ctx.fillStyle = INK;
  ctx.font = `italic 400 24px ${SERIF}`;
  ctx.textAlign = "center";
  ctx.fillText("Aponte a câmera.", cx, btmY);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `italic 400 22px ${SERIF}`;
  ctx.fillText("O que estava guardado começa agora.", cx, btmY + 32);

  // ============ RODAPÉ ============
  const footerY = H - Math.round(1.0 * CM);

  drawHairline(ctx, cx, footerY - 30, Math.round(1.8 * CM));

  // Wordmark discreto e íntimo — italic, não caps
  ctx.fillStyle = INK_SOFT;
  ctx.font = `italic 500 18px ${SERIF}`;
  ctx.textAlign = "center";
  ctx.fillText("MemoLove", cx, footerY - 4);

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
