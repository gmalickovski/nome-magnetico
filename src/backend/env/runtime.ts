/**
 * Leitura de variáveis de ambiente no processo Node, em runtime.
 *
 * O build de produção (GitHub Actions) não recebe segredos. A VPS injeta o
 * `.env` só ao subir o processo (`start.mjs`). Por isso chaves server-only
 * não podem ir para `import.meta.env` nem para `process.env.NOME` estático —
 * o Vite gravaria `undefined` no bundle.
 *
 * Usar `process.env[name]` (bracket) evita a substituição estática.
 * Nunca importar este módulo em código de client/browser.
 */

export function readServerEnv(name: string): string | undefined {
  const proc = globalThis.process;
  if (!proc?.env) return undefined;
  const value = proc.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
