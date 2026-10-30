#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_WINDOW_LINES = 10;

/**
 * Remove comentários comuns para evitar falsos positivos em documentação,
 * mas preserva se a linha contiver a exceção 'polling-ok:'.
 */
function cleanLineForMatching(rawLine) {
  const isExempt = /polling-ok\s*:/i.test(rawLine);
  // Remove comentários de linha única // ...
  const withoutSingleComment = rawLine.replace(/\/\/.*$/, '');
  // Remove comentários de bloco /* ... */ na mesma linha
  const withoutBlockComment = withoutSingleComment.replace(/\/\*.*?\*\//g, '');
  return {
    isExempt,
    text: withoutBlockComment,
  };
}

/**
 * Varre o código fornecido e retorna array de violações encontradas.
 */
export function checkCode(content, filePath = 'snippet') {
  const lines = content.split(/\r?\n/);
  const violations = [];

  // Mapeia cada linha com tokens identificados
  const analyzedLines = lines.map((line, idx) => {
    const { isExempt, text } = cleanLineForMatching(line);
    const hasSetInterval = /\bsetInterval\s*\(/.test(text);
    const hasSetTimeout = /\bsetTimeout\s*\(/.test(text);
    const hasReload = /(?:window\.)?location\.reload\s*\(/.test(text);
    const hasFetch = /\bfetch\s*\(/.test(text);
    const hasSupabase = /\bsupabase\s*\./.test(text);

    return {
      lineNum: idx + 1,
      raw: line,
      isExempt,
      hasSetInterval,
      hasSetTimeout,
      hasReload,
      hasFetch,
      hasSupabase,
    };
  });

  // Janela deslizante de até MAX_WINDOW_LINES linhas
  for (let i = 0; i < analyzedLines.length; i++) {
    const lineA = analyzedLines[i];

    // Checa pares com linhas seguintes dentro da janela
    for (let j = i; j < Math.min(analyzedLines.length, i + MAX_WINDOW_LINES); j++) {
      const lineB = analyzedLines[j];
      // Considera isExempt na janela e nas linhas imediatamente adjacentes (até 2 linhas antes ou depois)
      const exemptStart = Math.max(0, i - 2);
      const exemptEnd = Math.min(analyzedLines.length, j + 3);
      const isWindowExempt = analyzedLines.slice(exemptStart, exemptEnd).some((l) => l.isExempt);

      if (isWindowExempt) {
        continue;
      }

      // 1. setInterval ou setTimeout junto de location.reload
      const hasTimer = lineA.hasSetInterval || lineA.hasSetTimeout || lineB.hasSetInterval || lineB.hasSetTimeout;
      const hasReload = lineA.hasReload || lineB.hasReload;
      if (hasTimer && hasReload) {
        const timerLine = lineA.hasSetInterval || lineA.hasSetTimeout ? lineA : lineB;
        const reloadLine = lineA.hasReload ? lineA : lineB;
        violations.push({
          filePath,
          startLine: lineA.lineNum,
          endLine: lineB.lineNum,
          type: 'timer_with_reload',
          description: `Uso de ${timerLine.hasSetInterval ? 'setInterval' : 'setTimeout'} (linha ${timerLine.lineNum}) próximo a location.reload() (linha ${reloadLine.lineNum}).`,
          snippet: `Linhas ${lineA.lineNum}-${lineB.lineNum}`,
        });
      }

      // 2. setInterval junto de fetch() ou supabase.
      const hasInterval = lineA.hasSetInterval || lineB.hasSetInterval;
      const hasApi = lineA.hasFetch || lineA.hasSupabase || lineB.hasFetch || lineB.hasSupabase;
      if (hasInterval && hasApi) {
        const intervalLine = lineA.hasSetInterval ? lineA : lineB;
        const apiLine = lineA.hasFetch || lineA.hasSupabase ? lineA : lineB;
        const apiType = apiLine.hasFetch ? 'fetch()' : 'supabase.';
        violations.push({
          filePath,
          startLine: lineA.lineNum,
          endLine: lineB.lineNum,
          type: 'interval_with_api',
          description: `Uso de setInterval (linha ${intervalLine.lineNum}) chamando ${apiType} (linha ${apiLine.lineNum}). Proibido polling sem backoff.`,
          snippet: `Linhas ${lineA.lineNum}-${lineB.lineNum}`,
        });
      }
    }
  }

  // Deduplica violações sobrepostas no mesmo bloco
  const uniqueViolations = [];
  for (const v of violations) {
    const isDuplicate = uniqueViolations.some(
      (uv) => uv.type === v.type && Math.abs(uv.startLine - v.startLine) <= 2 && Math.abs(uv.endLine - v.endLine) <= 2
    );
    if (!isDuplicate) {
      uniqueViolations.push(v);
    }
  }

  return uniqueViolations;
}

export function findSourceFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.astro') {
        findSourceFiles(fullPath, fileList);
      }
    } else if (/\.(ts|tsx|astro|js|mjs)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export function runCheck(srcDir) {
  const files = findSourceFiles(srcDir);
  const allViolations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const violations = checkCode(content, file);
    if (violations.length > 0) {
      allViolations.push(...violations);
    }
  }

  return allViolations;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  const rootDir = path.resolve(path.dirname(currentFile), '..');
  const srcDir = path.join(rootDir, 'src');

  console.log('🔍 Executando lint:polling em src/**/*.{ts,tsx,astro,js}...\n');
  const violations = runCheck(srcDir);

  if (violations.length > 0) {
    console.error(`❌ Encontrada(s) ${violations.length} violação(ões) de polling/reload em loop:\n`);
    for (const v of violations) {
      const relPath = path.relative(rootDir, v.filePath);
      console.error(`  [${relPath}:${v.startLine}] ${v.description}`);
    }
    console.error('\nRegra violada: proibido location.reload() dentro de setInterval/setTimeout e proibido setInterval chamando API/Supabase.');
    console.error('Se for uma exceção legítima, adicione o comentário `// polling-ok: <motivo>` na linha justificando no PR.\n');
    process.exit(1);
  } else {
    console.log('✔ Verificação de polling/reload concluída sem violações.');
    process.exit(0);
  }
}
