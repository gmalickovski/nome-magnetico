#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const hookPath = path.join(rootDir, '.cursor', 'hooks', 'guard-shell.mjs');

function runHook(input) {
  const stdinData = typeof input === 'string' ? input : JSON.stringify(input);
  const result = spawnSync('node', [hookPath], {
    input: stdinData,
    encoding: 'utf8',
    cwd: rootDir,
  });

  assert.equal(result.status, 0, `Hook should exit with code 0 (stderr: ${result.stderr})`);
  let parsed;
  try {
    parsed = JSON.parse(result.stdout.trim());
  } catch (err) {
    throw new Error(`Output is not valid JSON: "${result.stdout}"`);
  }
  return parsed;
}

const denyCases = [
  'git push origin main',
  'git push -f origin fix/x',
  'git push --force-with-lease',
  'supabase db push',
  'stripe listen',
  'op read op://NM-PROD/x/y',
  'gh pr merge 1',
  'git tag v1',
];

const allowCases = [
  'git push origin fix/nm-teste',
  'npm test',
  'npm run build',
  'op run --env-file=.env.1password -- npm run dev',
  'echo stripe-docs',
];

console.log('🧪 Executando testes do guard-shell hook...\n');
let passed = 0;

for (const cmd of denyCases) {
  const res = runHook({ command: cmd });
  assert.equal(res.permission, 'deny', `Esperava deny para o comando: "${cmd}", mas obteve: "${res.permission}"`);
  assert.ok(res.agent_message, `Esperava agent_message para o comando bloqueado: "${cmd}"`);
  console.log(`  ✔ [DENY] "${cmd}"`);
  passed++;
}

for (const cmd of allowCases) {
  const res = runHook({ command: cmd });
  assert.equal(res.permission, 'allow', `Esperava allow para o comando: "${cmd}", mas obteve: "${res.permission}"`);
  console.log(`  ✔ [ALLOW] "${cmd}"`);
  passed++;
}

// Testes de entrada inválida
const invalidCases = [
  '',
  '   ',
  'não é json',
  JSON.stringify({ command: '' }),
  JSON.stringify({ outroCampo: 'sem command' }),
];

for (const invalid of invalidCases) {
  const res = runHook(invalid);
  assert.equal(res.permission, 'deny', `Esperava deny para entrada inválida: "${invalid}"`);
  console.log(`  ✔ [DENY-INVALID] entrada inválida rejeitada`);
  passed++;
}

console.log(`\n🎉 Todos os ${passed} testes do guard-shell passaram com sucesso!`);
