import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parsePdffontsEmbeddedFontNames } from './pdfPdffontsParse.ts';

const REPO_ROOT = fileURLToPath(new URL('../../../../../', import.meta.url));
const INSPECTOR = join(REPO_ROOT, 'scripts/pdf-named-destinations.py');

export type NamedDestinations = Record<string, number>;

/** Inspeção de destinos — exige pypdf já instalado (sem pip/rede neste fluxo). */
export function inspectNamedDestinations(pdfBuffer: Buffer): NamedDestinations | { error: string } {
  const dir = mkdtempSync(join(tmpdir(), 'nm-pdf-'));
  const pdfPath = join(dir, 'inspect.pdf');
  writeFileSync(pdfPath, pdfBuffer);

  const run = spawnSync('python3', [INSPECTOR, pdfPath], { encoding: 'utf8', timeout: 30_000 });
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

/** Fontes embutidas via pdffonts (Poppler), se o binário existir no PATH. */
export function inspectEmbeddedFonts(pdfPath: string): string[] | { error: string } {
  const run = spawnSync('pdffonts', [pdfPath], { encoding: 'utf8', timeout: 15_000 });
  if (run.error || run.status !== 0) {
    return { error: 'pdffonts_unavailable' };
  }
  return parsePdffontsEmbeddedFontNames(run.stdout);
}
