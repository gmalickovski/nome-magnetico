/**
 * PDFFonts — registro das fontes customizadas para @react-pdf/renderer.
 * Deve ser chamado uma vez antes de renderizar qualquer PDF.
 */
import { Font } from '@react-pdf/renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

Font.registerHyphenationCallback((word) => [word]);

const __pdfFontsDir = path.dirname(fileURLToPath(import.meta.url));

function isLikelyFontFile(filePath: string): boolean {
  try {
    const buf = fs.readFileSync(filePath);
    if (buf.length < 12) return false;
    if (buf[0] === 0x3c) return false; // HTML placeholder / LFS stub
    const magic = buf.readUInt32BE(0);
    return [0x00010000, 0x4f54544f, 0x74746366, 0x74727565, 0x774f4646].includes(magic);
  } catch {
    return false;
  }
}

function resolveFontFile(filename: string): string | null {
  const alt = filename.replace(/\.ttf$/i, '.woff');
  const names = alt !== filename ? [filename, alt] : [filename];
  const roots = [
    path.resolve(process.cwd(), 'public/fonts'),
    path.resolve(process.cwd(), 'dist/client/fonts'),
    path.resolve(__pdfFontsDir, '../../../../public/fonts'),
    path.resolve(__pdfFontsDir, '../../../../dist/client/fonts'),
  ];
  for (const name of names) {
    for (const root of roots) {
      const p = path.join(root, name);
      try {
        if (fs.existsSync(p) && fs.statSync(p).size > 1000 && isLikelyFontFile(p)) return p;
      } catch {
        continue;
      }
    }
  }
  return null;
}

function registerFontFile(family: string, filename: string): boolean {
  const resolved = resolveFontFile(filename);
  if (!resolved) return false;
  try {
    const buf = fs.readFileSync(resolved);
    if (buf.length < 12) return false;
    const magic = buf.readUInt32BE(0);
    if (![0x00010000, 0x4f54544f, 0x74746366, 0x74727565, 0x774f4646].includes(magic)) return false;
    Font.register({ family, src: resolved });
    return true;
  } catch {
    return false;
  }
}

function registerInterFamily(): { regular: boolean; bold: boolean } {
  const regularPath = resolveFontFile('Inter-Regular.ttf');
  const boldPath = resolveFontFile('Inter-Bold.ttf');
  if (!regularPath) return { regular: false, bold: false };
  try {
    Font.register({
      family: 'Inter',
      fonts: [
        { src: regularPath, fontWeight: 400, fontStyle: 'normal' },
        { src: regularPath, fontWeight: 400, fontStyle: 'italic' },
        ...(boldPath
          ? [
              { src: boldPath, fontWeight: 700, fontStyle: 'normal' as const },
              { src: boldPath, fontWeight: 700, fontStyle: 'italic' as const },
            ]
          : []),
      ],
    });
    return { regular: true, bold: Boolean(boldPath) };
  } catch {
    return { regular: registerFontFile('Inter', 'Inter-Regular.ttf'), bold: false };
  }
}

const cinzelOk = registerFontFile('Cinzel', 'Cinzel-Regular.ttf');
const cinzelBoldOk = registerFontFile('CinzelBold', 'Cinzel-Bold.ttf');
const interBoldOk = registerFontFile('InterBold', 'Inter-Bold.ttf');
const interRegistered = registerInterFamily();
const interOk = interRegistered.regular;

export const pdfFontRegistration = {
  cinzelOk,
  cinzelBoldOk,
  interOk,
  interBoldOk,
  interPaths: {
    regular: resolveFontFile('Inter-Regular.ttf'),
    bold: resolveFontFile('Inter-Bold.ttf'),
  },
} as const;

export const LOGO_FONT = cinzelOk ? 'Cinzel' : 'Helvetica-Bold';
export const TITLE_FONT = cinzelBoldOk
  ? 'CinzelBold'
  : cinzelOk
    ? 'Cinzel'
    : 'Helvetica-Bold';
export const BODY_FONT = interOk ? 'Inter' : 'Helvetica';
export const BODY_FONT_BOLD = interBoldOk ? 'InterBold' : 'Helvetica-Bold';

/** Falha explícita em testes quando Inter não foi embutida. */
export function assertPdfBodyFontsEmbedded(): void {
  if (!interOk || !interBoldOk) {
    throw new Error(
      `Inter não registrada para PDF (regular=${interOk}, bold=${interBoldOk}). Paths: ${JSON.stringify(pdfFontRegistration.interPaths)}`,
    );
  }
}

/** Tenta carregar o logo como data URI base64 */
export function loadLogoSrc(): string {
  const logoCandidates = [
    path.resolve(process.cwd(), 'public/logo-nome-magnetico.png'),
    path.resolve(process.cwd(), 'dist/client/logo-nome-magnetico.png'),
    path.resolve(process.cwd(), 'src/frontend/assets/logo-nome-magnético-v4.png'),
    path.resolve(__pdfFontsDir, '../../../../dist/client/logo-nome-magnetico.png'),
  ];
  for (const p of logoCandidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const buf = fs.readFileSync(p);
      if (buf.length < 1024) continue;
      return `data:image/png;base64,${buf.toString('base64')}`;
    } catch {
      continue;
    }
  }
  return '';
}

function tryLoadPngBase64(filename: string): string {
  const candidates = [
    path.resolve(process.cwd(), `public/${filename}`),
    path.resolve(process.cwd(), `dist/client/${filename}`),
    path.resolve(__pdfFontsDir, `../../../../dist/client/${filename}`),
    path.resolve(__pdfFontsDir, `../../../../public/${filename}`),
  ];
  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const buf = fs.readFileSync(p);
      if (buf.length < 100) continue;
      return `data:image/png;base64,${buf.toString('base64')}`;
    } catch {
      continue;
    }
  }
  return '';
}

export const CAPA_LOGO_SRC = tryLoadPngBase64('logo-nomemagnetico-capa-pdf.png');
export const HEADER_LOGO_SRC = tryLoadPngBase64('logo-nomemagnetico-header-pdf.png');

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    if (dateStr.includes('T')) {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    }
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  } catch {
    return dateStr;
  }
}
