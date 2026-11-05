import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../../../../', import.meta.url));
const INSPECTOR = join(REPO_ROOT, 'scripts/pdf-named-destinations.py');

export type NamedDestinations = Record<string, number>;

export function inspectNamedDestinations(pdfBuffer: Buffer): NamedDestinations | { error: string } {
  const dir = mkdtempSync(join(tmpdir(), 'nm-pdf-'));
  const pdfPath = join(dir, 'inspect.pdf');
  writeFileSync(pdfPath, pdfBuffer);

  const pip = spawnSync('python3', ['-m', 'pip', 'install', 'pypdf', '-q'], {
    encoding: 'utf8',
    timeout: 120_000,
  });
  if (pip.status !== 0 && pip.stderr?.includes('pypdf')) {
    try {
      unlinkSync(pdfPath);
    } catch {
      /* ignore */
    }
    return { error: 'pip_install_failed' };
  }

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

/** Extrai nomes de fontes embutidas via pdffonts (poppler), se disponível. */
export function inspectEmbeddedFonts(pdfPath: string): string[] | { error: string } {
  const run = spawnSync('pdffonts', [pdfPath], { encoding: 'utf8', timeout: 15_000 });
  if (run.error || run.status !== 0) {
    return { error: 'pdffonts_unavailable' };
  }
  const lines = run.stdout.split('\n').slice(2);
  const embedded: string[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split(/\s+/);
    const name = cols[0];
    const emb = cols[1];
    if (emb === 'yes' && name) embedded.push(name);
  }
  return embedded;
}
