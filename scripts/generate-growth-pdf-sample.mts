/**
 * Amostra Growth — páginas afetadas (DEV-266 PR124).
 * Uso: npm run pdf:growth-sample
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, copyFileSync, existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const FIXTURE_DIR = process.env.NM_PDF_OUT ?? '/opt/cursor/artifacts/nm-pdf-dev266-round2';
const OUT = '/opt/cursor/artifacts/growth-pdf-sample-0511';
const gitSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

execSync('npm run pdf:dev266-fixtures', { stdio: 'inherit', cwd: '/agent/repos/nome-magnetico' });

mkdirSync(`${OUT}/pages`, { recursive: true });
mkdirSync(`${OUT}/pdfs`, { recursive: true });

const manifest = JSON.parse(readFileSync(`${FIXTURE_DIR}/manifest.json`, 'utf8')) as {
  namedDestinations: Record<string, Record<string, number>>;
  sha256: Record<string, string>;
};

for (const f of ['gratuito.pdf', 'pago-chat-export-6-sugestoes.pdf', 'manifest.json']) {
  copyFileSync(`${FIXTURE_DIR}/${f}`, `${OUT}/pdfs/${f}`);
}

function pagePng(pdf: string, page: number, outName: string) {
  if (!page || page < 1) return;
  const base = `${OUT}/pages/${outName}`;
  execSync(`pdftoppm -png -f ${page} -l ${page} -r 144 "${FIXTURE_DIR}/${pdf}" "${base}"`, {
    stdio: 'pipe',
  });
  const generated = `${base}-${String(page).padStart(2, '0')}.png`;
  if (existsSync(generated)) {
    copyFileSync(generated, `${base}.png`);
  }
}

const g = manifest.namedDestinations.gratuito;
pagePng('gratuito.pdf', g['pdf-sumario'], 'gratuito-sumario');
pagePng('gratuito.pdf', g['pdf-essencia-licoes'], 'gratuito-licoes');
pagePng('gratuito.pdf', g['pdf-essencia-tendencias'], 'gratuito-p18-tendencias');
pagePng('gratuito.pdf', g['pdf-mapa'], 'gratuito-mapa');

const p = manifest.namedDestinations.pagoChatExport6 ?? manifest.namedDestinations.pagoAssinaturaManual;
const pagoPdf = manifest.namedDestinations.pagoChatExport6
  ? 'pago-chat-export-6-sugestoes.pdf'
  : 'pago-assinatura-manual-73-50.pdf';
if (!manifest.namedDestinations.pagoChatExport6) {
  copyFileSync(`${FIXTURE_DIR}/pago-assinatura-manual-73-50.pdf`, `${OUT}/pdfs/pago-assinatura-manual-73-50.pdf`);
}

pagePng(pagoPdf, p['pdf-harmonizacao'], 'pago-estrela-harmonizacao');
pagePng(pagoPdf, p['pdf-mapa-alinhamento'], 'pago-mapa-alinhamento');
pagePng(pagoPdf, (p['pdf-harmonizacao-comparativa'] ?? p['pdf-mapa-alinhamento'] + 1), 'pago-pos-teia');
pagePng(pagoPdf, p['pdf-guia'], 'pago-guia');
pagePng(pagoPdf, p['pdf-score'], 'pago-como-calculamos');

writeFileSync(
  `${OUT}/SHA.txt`,
  `HEAD ${gitSha}\ngratuito.pdf sha256=${manifest.sha256.gratuito}\npago-chat sha256=${manifest.sha256.pagoChatExport6}\n`,
);

writeFileSync(
  `${OUT}/RELATORIO-GROWTH-AMOSTRA.md`,
  `# Amostra Growth PR124\n\nSHA: \`${gitSha}\`\n\nPáginas extraídas via \`manifest.json\` (destinos nomeados).\n\n- Gratuito p.18 → \`pdf-essencia-tendencias\` (p.${g['pdf-essencia-tendencias']})\n- Teia → \`pdf-mapa-alinhamento\` (p.${p['pdf-mapa-alinhamento']})\n`,
);

execSync(`cd /opt/cursor/artifacts && rm -f growth-pdf-sample-0511.zip && zip -r growth-pdf-sample-0511.zip growth-pdf-sample-0511`, {
  stdio: 'inherit',
});

console.log(`OK ${OUT} ${gitSha}`);
