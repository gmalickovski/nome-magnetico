import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const REPO_ROOT = fileURLToPath(new URL('../../../../../', import.meta.url));
export const PDF_OFFLINE_REQUIREMENTS = join(REPO_ROOT, 'scripts/pdf-offline-requirements.txt');

export type PdfOfflineTooling = {
  pypdf: boolean;
  pdftotext: boolean;
  pdffonts: boolean;
  messages: string[];
};

function commandOk(cmd: string, args: string[]): boolean {
  const run = spawnSync(cmd, args, { encoding: 'utf8', timeout: 15_000 });
  return !run.error && run.status === 0;
}

/** Somente verifica ferramentas já instaladas — sem pip/apt/rede. */
export function probePdfOfflineTooling(): PdfOfflineTooling {
  const messages: string[] = [];
  const pypdf = commandOk(process.platform === 'win32' ? 'python' : 'python3', ['-c', 'import pypdf']);
  if (!pypdf) {
    messages.push(
      `pypdf ausente (python3 -c "import pypdf"). Instale fora do teste: pip install -r ${PDF_OFFLINE_REQUIREMENTS}`,
    );
  }
  const pdftotext = commandOk('pdftotext', ['-v']);
  if (!pdftotext) {
    messages.push('pdftotext ausente (pacote poppler-utils no sistema).');
  }
  const pdffonts = commandOk('pdffonts', ['-v']);
  if (!pdffonts) {
    messages.push('pdffonts ausente (pacote poppler-utils no sistema).');
  }
  return { pypdf, pdftotext, pdffonts, messages };
}

export function assertPdfOfflineHarnessReady(): PdfOfflineTooling {
  const probe = probePdfOfflineTooling();
  if (!probe.pypdf || !probe.pdffonts || !probe.pdftotext) {
    throw new Error(
      `Harness PDF offline incompleto — checks de destino/copy/fontes no binário NÃO foram executados.\n${probe.messages.join('\n')}`,
    );
  }
  return probe;
}
