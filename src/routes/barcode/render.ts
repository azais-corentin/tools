import {
  barcode,
  qrcode,
  datamatrix,
  gs1datamatrix,
  pdf417,
  aztec,
  renderMatrixSVG,
  renderMaxiCodeSVG,
  encodeMicroQR,
  encodeRMQR,
  encodeDotCode,
  encodeHanXin,
  encodeMicroPDF417,
  encodeCodablockF,
  encodeCode16K,
  encodeMaxiCode,
  encodeRM4SCC,
  encodeKIX,
  encodeAustraliaPost,
  encodeJapanPost,
  encodeIMb,
  encodeJABCode,
} from "etiket";
import type { BarcodeType, DotType, FourState } from "etiket";

export type FormatGroup = "1D" | "2D" | "Stacked" | "Postal" | "Color";

export type Control =
  | "size"
  | "margin"
  | "ec"
  | "dot"
  | "height"
  | "barWidth"
  | "showText"
  | "jabColors"
  | "color"
  | "background";

export interface RenderStyle {
  /** Foreground color. */
  color: string;
  /** Background color, or `transparent`. */
  background: string;
  /** Pixel size of the longest side for 2D/QR symbols. */
  size: number;
  /** Quiet zone in modules. */
  margin: number;
  ecLevel: "L" | "M" | "Q" | "H";
  dotType: DotType;
  /** Bar height for 1D / postal symbols (px). */
  height: number;
  /** Module width for 1D / postal symbols (px). */
  barWidth: number;
  /** Render the human-readable text under 1D barcodes. */
  showText: boolean;
  /** JAB Code palette size. */
  jabColors: 4 | 8;
}

export const DEFAULT_STYLE: RenderStyle = {
  color: "#000000",
  background: "#ffffff",
  size: 256,
  margin: 4,
  ecLevel: "M",
  dotType: "square",
  height: 80,
  barWidth: 2,
  showText: true,
  jabColors: 4,
};

export const DOT_TYPES: DotType[] = [
  "square",
  "rounded",
  "dots",
  "diamond",
  "classy",
  "classy-rounded",
  "extra-rounded",
  "vertical-line",
  "horizontal-line",
  "small-square",
  "tiny-square",
];

export interface FormatDef {
  id: string;
  label: string;
  group: FormatGroup;
  /** Style controls the UI exposes for this format. */
  controls: Control[];
  /** Prefilled sample so the preview is non-blank when first selected. */
  sample: string;
  /** Renders the symbology to an SVG string. May throw on invalid input. */
  render: (value: string, s: RenderStyle) => string;
}

/**
 * Render a 4-state postal barcode (T/A/D/F bars) as SVG. etiket emits the raw
 * `FourState[]` but ships no renderer, so we draw the standard three-band geometry
 * with a quiet zone all around.
 */
export function renderFourStateSVG(bars: FourState[], s: RenderStyle): string {
  const bw = s.barWidth;
  const pitch = bw * 2; // bar + equal gap
  const H = s.height;
  const pad = bw * 4; // quiet zone
  const third = H / 3;
  const width = pad * 2 + bars.length * pitch - bw;
  const height = H + pad * 2;

  const rects: string[] = [];
  for (let i = 0; i < bars.length; i++) {
    const x = pad + i * pitch;
    let y: number;
    let h: number;
    switch (bars[i]) {
      case "F": // full bar
        y = pad;
        h = H;
        break;
      case "A": // ascender: top + middle
        y = pad;
        h = (H * 2) / 3;
        break;
      case "D": // descender: middle + bottom
        y = pad + third;
        h = (H * 2) / 3;
        break;
      default: // 'T' tracker: middle only
        y = pad + third;
        h = third;
        break;
    }
    rects.push(`<rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${s.color}"/>`);
  }

  const bg =
    s.background === "transparent"
      ? ""
      : `<rect width="100%" height="100%" fill="${s.background}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">${bg}${rects.join("")}</svg>`;
}

/**
 * Render a JAB Code color-index matrix as SVG. Mirrors etiket's `renderMatrixSVG`
 * but fills each cell from the palette index instead of a single foreground color.
 */
export function renderColorMatrixSVG(
  matrix: number[][],
  palette: readonly string[],
  s: RenderStyle,
): string {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const module = s.size / (Math.max(rows, cols) + s.margin * 2);
  const width = (cols + s.margin * 2) * module;
  const height = (rows + s.margin * 2) * module;

  const rects: string[] = [];
  for (let r = 0; r < rows; r++) {
    const row = matrix[r];
    for (let c = 0; c < cols; c++) {
      const x = (c + s.margin) * module;
      const y = (r + s.margin) * module;
      rects.push(
        `<rect x="${x}" y="${y}" width="${module}" height="${module}" fill="${palette[row[c]]}"/>`,
      );
    }
  }

  const bg =
    s.background === "transparent"
      ? ""
      : `<rect width="100%" height="100%" fill="${s.background}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">${bg}${rects.join("")}</svg>`;
}

const matrixOpts = (s: RenderStyle) => ({
  size: s.size,
  color: s.color,
  background: s.background,
  margin: s.margin,
});

const ONE_D: Control[] = ["color", "background", "height", "barWidth", "showText"];
const MATRIX: Control[] = ["size", "margin", "color", "background"];
const POSTAL: Control[] = ["color", "background", "height"];

const oneD = (id: string, label: string, sample: string): FormatDef => ({
  id,
  label,
  group: "1D",
  controls: ONE_D,
  sample,
  render: (v, s) =>
    barcode(v, {
      type: id as BarcodeType,
      height: s.height,
      barWidth: s.barWidth,
      color: s.color,
      background: s.background,
      showText: s.showText,
    }),
});

export const FORMATS: FormatDef[] = [
  // 1D linear barcodes
  oneD("code128", "Code 128", "Hello World"),
  oneD("code39", "Code 39", "HELLO"),
  oneD("code39ext", "Code 39 Extended", "HELLO"),
  oneD("code93", "Code 93", "HELLO"),
  oneD("code93ext", "Code 93 Extended", "HELLO"),
  oneD("ean13", "EAN-13", "4006381333931"),
  oneD("ean8", "EAN-8", "96385074"),
  oneD("ean5", "EAN-5 (add-on)", "52495"),
  oneD("ean2", "EAN-2 (add-on)", "12"),
  oneD("upca", "UPC-A", "036000291452"),
  oneD("upce", "UPC-E", "01234565"),
  oneD("itf", "ITF (Interleaved 2 of 5)", "1234567890"),
  oneD("itf14", "ITF-14", "00012345678905"),
  oneD("codabar", "Codabar", "A12345B"),
  oneD("msi", "MSI Plessey", "1234567"),
  oneD("pharmacode", "Pharmacode", "1234"),
  oneD("code11", "Code 11", "1234567"),
  oneD("gs1-128", "GS1-128", "(01)12345678901234(17)260101"),
  oneD("gs1-databar", "GS1 DataBar", "0001234567890"),
  oneD("gs1-databar-limited", "GS1 DataBar Limited", "0001234567890"),
  oneD("gs1-databar-expanded", "GS1 DataBar Expanded", "(01)90012345678908"),
  oneD("identcode", "Identcode", "563102430313"),
  oneD("leitcode", "Leitcode", "2108012345678"),
  oneD("postnet", "POSTNET", "12345"),
  oneD("planet", "PLANET", "12345678901"),
  oneD("plessey", "Plessey", "12345"),

  // 2D matrix codes
  {
    id: "qr",
    label: "QR Code",
    group: "2D",
    controls: ["size", "margin", "ec", "dot", "color", "background"],
    sample: "https://example.com",
    render: (v, s) =>
      qrcode(v, {
        size: s.size,
        ecLevel: s.ecLevel,
        dotType: s.dotType,
        color: s.color,
        background: s.background,
        margin: s.margin,
      }),
  },
  {
    id: "datamatrix",
    label: "Data Matrix",
    group: "2D",
    controls: MATRIX,
    sample: "Hello World",
    render: (v, s) => datamatrix(v, matrixOpts(s)),
  },
  {
    id: "gs1datamatrix",
    label: "GS1 DataMatrix",
    group: "2D",
    controls: MATRIX,
    sample: "(01)12345678901234",
    render: (v, s) => gs1datamatrix(v, matrixOpts(s)),
  },
  {
    id: "pdf417",
    label: "PDF417",
    group: "2D",
    controls: MATRIX,
    sample: "Hello World",
    render: (v, s) => pdf417(v, { width: s.size, color: s.color, background: s.background }),
  },
  {
    id: "aztec",
    label: "Aztec",
    group: "2D",
    controls: MATRIX,
    sample: "Hello World",
    render: (v, s) => aztec(v, matrixOpts(s)),
  },
  {
    id: "microqr",
    label: "Micro QR",
    group: "2D",
    controls: MATRIX,
    sample: "Hi",
    render: (v, s) => renderMatrixSVG(encodeMicroQR(v), matrixOpts(s)),
  },
  {
    id: "rmqr",
    label: "rMQR (Rectangular Micro QR)",
    group: "2D",
    controls: MATRIX,
    sample: "Hello World",
    render: (v, s) => renderMatrixSVG(encodeRMQR(v), matrixOpts(s)),
  },
  {
    id: "dotcode",
    label: "DotCode",
    group: "2D",
    controls: MATRIX,
    sample: "Hello World",
    render: (v, s) => renderMatrixSVG(encodeDotCode(v), matrixOpts(s)),
  },
  {
    id: "hanxin",
    label: "Han Xin",
    group: "2D",
    controls: MATRIX,
    sample: "Hello World",
    render: (v, s) => renderMatrixSVG(encodeHanXin(v), matrixOpts(s)),
  },
  {
    id: "maxicode",
    label: "MaxiCode",
    group: "2D",
    controls: MATRIX,
    sample: "Test shipment",
    render: (v, s) => renderMaxiCodeSVG(encodeMaxiCode(v), matrixOpts(s)),
  },

  // Stacked codes
  {
    id: "micropdf417",
    label: "MicroPDF417",
    group: "Stacked",
    controls: MATRIX,
    sample: "Hello World",
    render: (v, s) => renderMatrixSVG(encodeMicroPDF417(v).matrix, matrixOpts(s)),
  },
  {
    id: "codablockf",
    label: "Codablock F",
    group: "Stacked",
    controls: MATRIX,
    sample: "Hello World",
    render: (v, s) => renderMatrixSVG(encodeCodablockF(v).matrix, matrixOpts(s)),
  },
  {
    id: "code16k",
    label: "Code 16K",
    group: "Stacked",
    controls: MATRIX,
    sample: "Hello World",
    render: (v, s) => renderMatrixSVG(encodeCode16K(v).matrix, matrixOpts(s)),
  },

  // Color matrix
  {
    id: "jabcode",
    label: "JAB Code",
    group: "Color",
    controls: ["size", "margin", "jabColors", "background"],
    sample: "Hello World",
    render: (v, s) => {
      const r = encodeJABCode(v, { colors: s.jabColors });
      return renderColorMatrixSVG(r.matrix, r.palette, s);
    },
  },

  // 4-state postal codes
  {
    id: "rm4scc",
    label: "RM4SCC (Royal Mail)",
    group: "Postal",
    controls: POSTAL,
    sample: "SN34RD1A",
    render: (v, s) => renderFourStateSVG(encodeRM4SCC(v), s),
  },
  {
    id: "kix",
    label: "KIX (PostNL)",
    group: "Postal",
    controls: POSTAL,
    sample: "SN34RD1A",
    render: (v, s) => renderFourStateSVG(encodeKIX(v), s),
  },
  {
    id: "imb",
    label: "USPS Intelligent Mail (IMb)",
    group: "Postal",
    controls: POSTAL,
    sample: "01234567094987654321 01234567891",
    render: (v, s) => {
      const [t, r] = v.trim().split(/\s+/);
      return renderFourStateSVG(encodeIMb(t ?? "", r ?? ""), s);
    },
  },
  {
    id: "auspost",
    label: "Australia Post",
    group: "Postal",
    controls: POSTAL,
    sample: "11 12345678",
    render: (v, s) => {
      const [fcc, dpid] = v.trim().split(/\s+/);
      if (!fcc || !dpid) throw new Error('Enter "<FCC> <DPID>", e.g. "11 12345678"');
      return renderFourStateSVG(encodeAustraliaPost(fcc, dpid), s);
    },
  },
  {
    id: "japanpost",
    label: "Japan Post",
    group: "Postal",
    controls: POSTAL,
    sample: "1500013",
    render: (v, s) => {
      const [zip, ...rest] = v.trim().split(/\s+/);
      return renderFourStateSVG(encodeJapanPost(zip ?? "", rest.join("") || undefined), s);
    },
  },
];

/** Render a format by id. Throws on unknown id or invalid input (surfaced in the UI). */
export function renderFormat(id: string, value: string, s: RenderStyle): string {
  const def = FORMATS.find((f) => f.id === id);
  if (!def) throw new Error(`Unknown format: ${id}`);
  return def.render(value, s);
}
