/**
 * Reprocessa leads da análise gratuita (`free_analyses_leads`) que falharam após o POST
 * em `/api/teste-bloqueio`, regenerando PDF e reenviando via Edge Function `send-free-pdf`.
 *
 * Uso (na VPS, com `.env` de produção carregado):
 *
 *   # Dry-run (padrão): só lista o que faria
 *   npx tsx scripts/reprocess-free-leads.ts --error-like nome-social --limit 5
 *
 *   # IDs específicos (dry-run)
 *   npx tsx scripts/reprocess-free-leads.ts --ids uuid1,uuid2 --dry-run
 *
 *   # Executar de verdade (sequencial, pausa 1,5s entre leads)
 *   npx tsx scripts/reprocess-free-leads.ts --error-like nome-social --limit 5 --execute
 *
 * Opções:
 *   --ids           Lista de UUIDs separados por vírgula
 *   --error-like    Filtra leads com status `error` e error_message ILIKE %padrão%
 *   --limit         Máximo de linhas ao usar --error-like (padrão: 50)
 *   --pause-ms      Pausa entre leads em ms (padrão: 1500)
 *   --dry-run       Apenas listar (padrão se --execute não for passado)
 *   --execute       Gravar PDF, invocar send-free-pdf
 *
 * Idempotência: leads com status `complete` são ignorados.
 * Requer: SUPABASE_URL (ou PUBLIC_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY.
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  createDefaultReprocessDeps,
  fetchLeadsForReprocess,
  parseReprocessArgv,
  runReprocessFreeLeads,
} from '../src/backend/public-free-analysis/reprocess-free-leads.ts';

dotenv.config();

const HELP_TEXT = `Reprocessamento de free_analyses_leads — ver cabeçalho em scripts/reprocess-free-leads.ts`;

async function main() {
  let cli;
  try {
    cli = parseReprocessArgv(process.argv.slice(2));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'HELP') {
      console.log(HELP_TEXT);
      process.exit(0);
    }
    console.error(message);
    console.error(HELP_TEXT);
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL ?? process.env.PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Defina SUPABASE_URL (ou PUBLIC_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const leads = await fetchLeadsForReprocess(supabase, cli);
  if (cli.ids?.length) {
    const found = new Set(leads.map((l) => l.id));
    const missing = cli.ids.filter((id) => !found.has(id));
    if (missing.length) {
      console.warn(`IDs não encontrados: ${missing.join(', ')}`);
    }
  }

  console.log(
    `Modo: ${cli.dryRun ? 'dry-run' : 'execute'} · leads: ${leads.length} · pause: ${cli.pauseMs}ms`,
  );

  const deps = createDefaultReprocessDeps(supabase);
  const summary = await runReprocessFreeLeads(leads, cli, deps);

  console.log(
    `Resumo: listados=${summary.listed} skip_complete=${summary.skippedComplete} ok=${summary.processed} failed=${summary.failed}`,
  );

  if (summary.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
