import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parsePdffontsEmbeddedFontNames } from './pdfPdffontsParse.ts';

const REPO_ROOT = fileURLToPath(new URL('../../../../../', import.meta.url));
const INSPECTOR = join(REPO_ROOT, 'scripts/pdf-named-destinations.py');

export type NamedDestinations = Record<string, number>;

function inspectNamedDestinationsPython(
  pdfBuffer: Buffer,
): NamedDestinations | { error: string } {
  const dir = mkdtempSync(join(tmpdir(), 'nm-pdf-'));
  const pdfPath = join(dir, 'inspect.pdf');
  writeFileSync(pdfPath, pdfBuffer);

  const run = spawnSync(process.env.NM_PDF_PYTHON || (process.platform === 'win32' ? 'python' : 'python3'), [INSPECTOR, pdfPath], { encoding: 'utf8', timeout: 30_000 });
  try {
    unlinkSync(pdfPath);
  } catch {
    /* ignore */
  }

  if (run.status === 2) {
    return { error: 'pypdf_missing' };
  }
  if (run.status !== 0) {
    return { error: run.stderr || 'inspect_failed' };
  }

  try {
    const parsed = JSON.parse(run.stdout.trim()) as Record<string, unknown>;
    if (parsed.error) return { error: String(parsed.error) };
    const out: NamedDestinations = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'number') out[k] = v;
    }
    return out;
  } catch {
    return { error: 'invalid_json' };
  }
}

async function inspectNamedDestinationsPdfJs(
  pdfBuffer: Buffer,
): Promise<NamedDestinations | { error: string }> {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
    });
    const doc = await loadingTask.promise;
    const rawDests = await doc.getDestinations();
    const out: NamedDestinations = {};

    for (const [name, destArray] of Object.entries(rawDests)) {
      if (!destArray || !Array.isArray(destArray)) continue;
      try {
        const pageIndex = await doc.getPageIndex(destArray[0]);
        out[name] = pageIndex + 1;
      } catch {
        continue;
      }
    }
    await doc.destroy();
    return out;
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'pdfjs_inspect_failed' };
  }
}

/** Quando `1`, não usa fallback Python (testes/prova de caminho pdfjs). */
export function pdfInspectPrefersPdfJsOnly(): boolean {
  return process.env.NM_PDF_INSPECT_PDFJS_ONLY === '1';
}

/** Inspeção de destinos nomeados — pdfjs-dist no Node; fallback python+pypdf (CI/dev). */
export async function inspectNamedDestinations(
  pdfBuffer: Buffer,
): Promise<NamedDestinations | { error: string }> {
  const fromPdfJs = await inspectNamedDestinationsPdfJs(pdfBuffer);
  if (!('error' in fromPdfJs) && Object.keys(fromPdfJs).length > 0) {
    return fromPdfJs;
  }
  if (pdfInspectPrefersPdfJsOnly()) {
    return 'error' in fromPdfJs ? fromPdfJs : { error: 'pdfjs_empty_destinations' };
  }
  const fromPython = inspectNamedDestinationsPython(pdfBuffer);
  if (!('error' in fromPython)) return fromPython;
  if ('error' in fromPdfJs) return fromPdfJs;
  return fromPython;
}

/** Fontes embutidas via pdffonts (Poppler), se o binário existir no PATH. */
export function inspectEmbeddedFonts(pdfPath: string): string[] | { error: string } {
  const run = spawnSync('pdffonts', [pdfPath], { encoding: 'utf8', timeout: 15_000 });
  if (run.error || run.status !== 0) {
    return { error: 'pdffonts_unavailable' };
  }
  return parsePdffontsEmbeddedFontNames(run.stdout);
}
