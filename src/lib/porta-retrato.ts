// Porta-retrato premium — cartão 10x15cm @ 300dpi
// Renderiza em canvas offscreen e força download em PNG alta resolução.
// Sem dependências pesadas: canvas 2D + qrcode (create matrix).

import QRCode from "qrcode";

// Paleta MemoLove
const BG = "#F6F1E7";        // off-white quente (papel)
const BG_TINT = "#EFE7D6";   // sombra sutil para vinheta
const INK = "#1A1815";       // preto suave
const INK_SOFT = "#5B534A";  // cinza quente
const MUTED = "#8A8177";     // cinza mais claro
const GOLD = "#B8924A";      // dourado elegante
const GOLD_SOFT = "#D9BF86"; // dourado claro para linhas

const SERIF = '"Cormorant Garamond", "EB Garamond", "Fraunces", Georgia, serif';
const SANS = '"Inter", system-ui, -apple-system, sans-serif';

const DPI = 300;
const CM = DPI / 2.54; // px por cm
const W = Math.round(10 * CM); // 1181
const H = Math.round(15 * CM); // 1772

async function ensureFontsLoaded() {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`500 96px ${SERIF}`),
      document.fonts.load(`italic 500 96px ${SERIF}`),
      document.fonts.load(`400 40px ${SERIF}`),
      document.fonts.load(`500 22px ${SANS}`),
      document.fonts.load(`400 22px ${SANS}`),
    ]);
    await document.fonts.ready;
  } catch {
    // Silencioso — fallback para Georgia/system.
  }
}

// Ruído sutil de papel (imperceptível, apenas dá textura).
function addPaperTexture(ctx: CanvasRenderingContext2D) {
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 6; // ±3
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
}

// Coração sólido, vetor manual — proporção elegante.
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
  // ponta inferior
  const topY = cy - s * 0.35;
  ctx.moveTo(cx, cy + s * 0.55);
  ctx.bezierCurveTo(cx - s * 1.1, cy, cx - s * 0.9, topY - s * 0.55, cx, topY + s * 0.15);
  ctx.bezierCurveTo(cx + s * 0.9, topY - s * 0.55, cx + s * 1.1, cy, cx, cy + s * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// QR com módulos arredondados (dot style para "premium"),
// com finder patterns em quadrados arredondados para máxima leitura.
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

  // Máscara dos finder patterns (7x7 cantos + 1 de folga)
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

  // Desenha os 3 finder patterns como quadrados arredondados (leitura garantida)
  const drawFinder = (fr: number, fc: number) => {
    const outerX = x + fc * cell;
    const outerY = y + fr * cell;
    const outer = 7 * cell;
    const inner = 5 * cell;
    const dot = 3 * cell;

    // Anel externo
    ctx.fillStyle = INK;
    roundRect(ctx, outerX, outerY, outer, outer, cell * 1.6);
    ctx.fill();
    // Recorte branco
    ctx.fillStyle = BG;
    roundRect(
      ctx,
      outerX + cell,
      outerY + cell,
      inner,
      inner,
      cell * 1.2
    );
    ctx.fill();
    // Miolo escuro
    ctx.fillStyle = INK;
    roundRect(
      ctx,
      outerX + 2 * cell,
      outerY + 2 * cell,
      dot,
      dot,
      cell * 0.8
    );
    ctx.fill();
  };

  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);

  ctx.restore();

  // Coração dourado no centro (ECC H suporta ~30% de oclusão; usamos ~14%)
  const holeR = size * 0.09;
  const cxq = x + size / 2;
  const cyq = y + size / 2;
  // fundo branco arredondado
  ctx.save();
  ctx.fillStyle = BG;
  ctx.beginPath();
  ctx.arc(cxq, cyq, holeR + cell * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawHeart(ctx, cxq, cyq, holeR * 0.9, GOLD);
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

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  cx: number,
  yStart: number,
  lineHeight: number
) {
  lines.forEach((ln, i) => ctx.fillText(ln, cx, yStart + i * lineHeight));
}

export async function generatePortaRetratoBlob(url: string): Promise<Blob> {
  await ensureFontsLoaded();

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.textBaseline = "top";

  // Fundo off-white
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Vinheta sutil (papel envelhecido, muito leve)
  const vg = ctx.createRadialGradient(
    W / 2,
    H / 2,
    W * 0.35,
    W / 2,
    H / 2,
    W * 0.85
  );
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(120,90,40,0.05)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // Textura de papel (ruído imperceptível)
  addPaperTexture(ctx);

  // Sobreposição sutil de brilho superior
  const topG = ctx.createLinearGradient(0, 0, 0, H * 0.35);
  topG.addColorStop(0, "rgba(255,255,255,0.35)");
  topG.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = topG;
  ctx.fillRect(0, 0, W, H * 0.35);

  // Moldura interna extremamente sutil (respiro)
  const margin = Math.round(0.7 * CM); // 0.7cm
  ctx.strokeStyle = "rgba(184,146,74,0.18)";
  ctx.lineWidth = 1;
  roundRect(ctx, margin, margin, W - margin * 2, H - margin * 2, 24);
  ctx.stroke();

  // ==================== TOPO ====================
  const cx = W / 2;
  let y = Math.round(1.5 * CM); // 1.5cm do topo

  // Coração dourado pequeno
  drawHeart(ctx, cx, y + 14, 14, GOLD);
  y += 42;

  // Wordmark "MemoLove" — discreto
  ctx.fillStyle = INK_SOFT;
  ctx.font = `500 22px ${SANS}`;
  ctx.textAlign = "center";
  ctx.fillText("MemoLove", cx, y);

  // ==================== TÍTULO ====================
  y = Math.round(3.0 * CM);
  ctx.fillStyle = INK;
  ctx.font = `italic 500 48px ${SERIF}`;
  const titleLines = ["Uma homenagem preparada", "especialmente para você."];
  drawLines(ctx, titleLines, cx, y, 58);
  y += titleLines.length * 58 + 26;

  // ==================== SUBTÍTULO ====================
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 26px ${SERIF}`;
  ctx.fillText("Os melhores presentes", cx, y);
  ctx.fillText("não ficam apenas na memória.", cx, y + 34);
  ctx.font = `italic 500 26px ${SERIF}`;
  ctx.fillStyle = GOLD;
  ctx.fillText("Eles podem ser revividos.", cx, y + 82);

  // ==================== QR CODE ====================
  const qrSize = Math.round(5.4 * CM); // 5.4cm — grande, respirado, sem apertar
  const qrX = (W - qrSize) / 2;
  const qrY = Math.round(7.5 * CM);

  // Placa branca sutil atrás do QR (sem borda pesada)
  const pad = Math.round(0.4 * CM);
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(60,45,20,0.10)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 6;
  roundRect(ctx, qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 18);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  drawPremiumQR(ctx, url, qrX, qrY, qrSize);

  // ==================== INSTRUÇÕES ABAIXO DO QR ====================
  let ty = qrY + qrSize + pad + Math.round(0.65 * CM);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 20px ${SANS}`;
  ctx.fillText("Escaneie este código com a câmera do celular", cx, ty);
  ctx.fillStyle = MUTED;
  ctx.font = `italic 400 22px ${SERIF}`;
  ctx.fillText("e descubra uma homenagem criada especialmente para você.", cx, ty + 30);

  // ==================== RODAPÉ ====================
  const footerY = H - Math.round(1.4 * CM);

  // Linha dourada extremamente fina
  const ruleW = Math.round(2.4 * CM);
  const gradRule = ctx.createLinearGradient(cx - ruleW / 2, footerY - 24, cx + ruleW / 2, footerY - 24);
  gradRule.addColorStop(0, "rgba(184,146,74,0)");
  gradRule.addColorStop(0.5, GOLD_SOFT);
  gradRule.addColorStop(1, "rgba(184,146,74,0)");
  ctx.strokeStyle = gradRule;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - ruleW / 2, footerY - 22);
  ctx.lineTo(cx + ruleW / 2, footerY - 22);
  ctx.stroke();

  // "Feito com carinho." — discreto, serifado
  ctx.fillStyle = MUTED;
  ctx.font = `italic 400 22px ${SERIF}`;
  ctx.fillText("Feito com carinho.", cx, footerY);

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
