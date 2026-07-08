// Porta-retrato editorial premium — cartão 10x15cm @ 300dpi
// Direção de arte: objeto de presente, não documento.
// Layout editorial com hairlines, corner brackets, tipografia respirada.

import QRCode from "qrcode";

// Paleta MemoLove
const BG = "#F6F1E7";        // off-white quente (papel)
const INK = "#1A1815";       // preto suave
const INK_SOFT = "#5B534A";  // cinza quente
const MUTED = "#8A8177";     // cinza mais claro
const GOLD = "#B8924A";      // dourado elegante
const GOLD_SOFT = "#D9BF86"; // dourado claro para linhas

const SERIF = '"Cormorant Garamond", "EB Garamond", "Fraunces", Georgia, serif';
const SANS = '"Inter", system-ui, -apple-system, sans-serif';

const DPI = 300;
const CM = DPI / 2.54;
const W = Math.round(10 * CM); // 1181
const H = Math.round(15 * CM); // 1772

async function ensureFontsLoaded() {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`500 96px ${SERIF}`),
      document.fonts.load(`italic 500 96px ${SERIF}`),
      document.fonts.load(`italic 400 40px ${SERIF}`),
      document.fonts.load(`400 40px ${SERIF}`),
      document.fonts.load(`600 18px ${SANS}`),
      document.fonts.load(`400 18px ${SANS}`),
    ]);
    await document.fonts.ready;
  } catch {
    /* fallback silencioso */
  }
}

// Ruído sutil de papel
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

// Coração vetorial
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

// QR com módulos arredondados
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
    ctx.fillStyle = "#FFFFFF";
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

  // Coração dourado central (oclusão ~10% — ECC H tolera)
  const holeR = size * 0.085;
  const cxq = x + size / 2;
  const cyq = y + size / 2;
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cxq, cyq, holeR + cell * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawHeart(ctx, cxq, cyq, holeR * 0.95, GOLD);
}

// Corner brackets — viewfinder editorial ao redor do QR
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
  ctx.lineWidth = 1.2;
  ctx.lineCap = "square";
  const corners: Array<[number, number, number, number]> = [
    // top-left: horizontal then vertical
    [x, y, x + len, y],
    [x, y, x, y + len],
    // top-right
    [x + w - len, y, x + w, y],
    [x + w, y, x + w, y + len],
    // bottom-left
    [x, y + h, x + len, y + h],
    [x, y + h - len, x, y + h],
    // bottom-right
    [x + w - len, y + h, x + w, y + h],
    [x + w, y + h - len, x + w, y + h],
  ];
  for (const [x1, y1, x2, y2] of corners) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

// Hairline horizontal com fade dourado
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

// Texto em kerning largo (letter-spacing manual)
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

  // ============ FUNDO ============
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Vinheta muito sutil
  const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.4, W / 2, H / 2, W * 0.9);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(120,90,40,0.06)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  addPaperTexture(ctx);

  // Highlight superior levíssimo
  const topG = ctx.createLinearGradient(0, 0, 0, H * 0.4);
  topG.addColorStop(0, "rgba(255,255,255,0.28)");
  topG.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = topG;
  ctx.fillRect(0, 0, W, H * 0.4);

  // ============ MOLDURA EDITORIAL — hairline dupla ============
  const outerM = Math.round(0.55 * CM);
  const innerM = outerM + 10;

  ctx.save();
  ctx.strokeStyle = "rgba(184,146,74,0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(outerM + 0.5, outerM + 0.5, W - outerM * 2 - 1, H - outerM * 2 - 1);
  ctx.strokeStyle = "rgba(184,146,74,0.18)";
  ctx.strokeRect(innerM + 0.5, innerM + 0.5, W - innerM * 2 - 1, H - innerM * 2 - 1);
  ctx.restore();

  // Cantos: pequeno ornamento dourado (quadrado + hairline diagonal)
  const cornerSize = 14;
  ctx.save();
  ctx.fillStyle = GOLD;
  const corners = [
    [outerM, outerM],
    [W - outerM - cornerSize / 2 - cornerSize / 2, outerM],
    [outerM, H - outerM],
    [W - outerM, H - outerM],
  ] as const;
  for (const [cx0, cy0] of corners) {
    ctx.beginPath();
    ctx.arc(cx0, cy0, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const cx = W / 2;

  // ============ TOPO — cabeçalho editorial ============
  // Pequena marcação vertical acima do wordmark
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, Math.round(1.2 * CM));
  ctx.lineTo(cx, Math.round(1.2 * CM) + 32);
  ctx.stroke();
  ctx.restore();

  // Wordmark discreto — tracked uppercase
  ctx.fillStyle = INK_SOFT;
  ctx.font = `600 15px ${SANS}`;
  ctx.textAlign = "center";
  drawTracked(ctx, "MEMOLOVE", cx, Math.round(1.2 * CM) + 60, 4.5);

  // Sub-label editorial
  ctx.fillStyle = MUTED;
  ctx.font = `400 12px ${SANS}`;
  drawTracked(ctx, "EDIÇÃO ÚNICA  ·  FEITA À MÃO", cx, Math.round(1.2 * CM) + 84, 2.6);

  // Hairline divisora curta
  drawHairline(ctx, cx, Math.round(1.2 * CM) + 110, Math.round(1.6 * CM));

  // ============ TÍTULO EMOCIONAL ============
  ctx.fillStyle = INK;
  ctx.font = `italic 500 62px ${SERIF}`;
  ctx.textAlign = "center";
  let ty = Math.round(3.3 * CM);
  ctx.fillText("Algumas lembranças", cx, ty);
  ty += 72;
  ctx.fillText("nunca deveriam", cx, ty);
  ty += 72;
  ctx.fillText("ser esquecidas.", cx, ty);

  // Linha de assinatura
  ty += 46;
  drawHairline(ctx, cx, ty, Math.round(1.2 * CM), GOLD);

  // Subtítulo confidente
  ty += 40;
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 24px ${SERIF}`;
  ctx.fillText("Existe uma homenagem", cx, ty);
  ty += 32;
  ctx.fillText("esperando por você.", cx, ty);

  // ============ QR — protagonista, com viewfinder ============
  const qrSize = Math.round(5.2 * CM);
  const qrX = (W - qrSize) / 2;
  const qrY = Math.round(8.0 * CM);

  // Placa branca sutilíssima (sem sombra pesada)
  const pad = Math.round(0.35 * CM);
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(60,45,20,0.08)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 6);
  ctx.fill();
  ctx.restore();

  drawPremiumQR(ctx, url, qrX, qrY, qrSize);

  // Viewfinder — corner brackets dourados ao redor da placa
  const bx = qrX - pad - 14;
  const by = qrY - pad - 14;
  const bw = qrSize + pad * 2 + 28;
  const bh = qrSize + pad * 2 + 28;
  drawCornerBrackets(ctx, bx, by, bw, bh, 22, GOLD);

  // Micro-label acima do QR
  ctx.fillStyle = MUTED;
  ctx.font = `600 11px ${SANS}`;
  drawTracked(ctx, "APROXIME  ·  ESCANEIE  ·  REVIVA", cx, qrY - pad - 34, 3);

  // ============ ABAIXO DO QR — convite ============
  const btmY = qrY + qrSize + pad + Math.round(0.9 * CM);
  ctx.fillStyle = INK;
  ctx.font = `italic 400 26px ${SERIF}`;
  ctx.textAlign = "center";
  ctx.fillText("Vire a foto. Aponte a câmera.", cx, btmY);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `italic 400 22px ${SERIF}`;
  ctx.fillText("O que estava guardado começa agora.", cx, btmY + 34);

  // ============ RODAPÉ ============
  const footerY = H - Math.round(1.1 * CM);

  // Hairline central
  drawHairline(ctx, cx, footerY - 30, Math.round(2.2 * CM));

  // Coração + assinatura
  drawHeart(ctx, cx - 62, footerY - 6, 6, GOLD);
  ctx.fillStyle = MUTED;
  ctx.font = `600 11px ${SANS}`;
  ctx.textAlign = "left";
  drawTracked(ctx, "FEITO COM CARINHO", cx - 44, footerY - 2, 2.8);

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
