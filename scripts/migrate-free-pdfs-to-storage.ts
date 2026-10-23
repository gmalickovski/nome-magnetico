/**
 * Migra arquivos PDF de free_analyses_leads (pdf_base64) para o Supabase Storage (bucket free-pdfs)
 * DEV-211 (Fase 2)
 *
 * Uso:
 *   # Dry-run (padrão): lista quantos leads seriam migrados sem alterar o banco ou storage
 *   npx tsx scripts/migrate-free-pdfs-to-storage.ts
 *
 *   # Executar migração real
 *   npx tsx scripts/migrate-free-pdfs-to-storage.ts --execute
 *
 *   # Limitar a quantidade de leads para teste inicial
 *   npx tsx scripts/migrate-free-pdfs-to-storage.ts --execute --limit 10
 *
 * Opções:
 *   --dry-run       Apenas listar (padrão se --execute não for informado)
 *   --execute       Subir arquivos para o Storage e gravar pdf_path no banco
 *   --limit <n>     Limitar total de leads a processar
 *   --batch-size <n> Tamanho do lote de IDs (padrão: 50)
 *   --pause-ms <n>  Pausa entre itens em ms (padrão: 100)
 *
 * Regra de Segurança:
 *   NUNCA zera o campo pdf_base64 nesta fase. Apenas preenche pdf_path.
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

export interface CliOptions {
  isDryRun: boolean;
  limit?: number;
  batchSize: number;
  pauseMs: number;
}

export function parseCliArgs(args: string[]): CliOptions {
  let isDryRun = true;
  let limit: number | undefined;
  let batchSize = 50;
  let pauseMs = 100;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--execute') {
      isDryRun = false;
    } else if (arg === '--dry-run') {
      isDryRun = true;
    } else if (arg === '--limit') {
      const val = parseInt(args[++i], 10);
      if (!isNaN(val) && val > 0) limit = val;
    } else if (arg === '--batch-size') {
      const val = parseInt(args[++i], 10);
      if (!isNaN(val) && val > 0) batchSize = val;
    } else if (arg === '--pause-ms') {
      const val = parseInt(args[++i], 10);
      if (!isNaN(val) && val >= 0) pauseMs = val;
    }
  }

  return { isDryRun, limit, batchSize, pauseMs };
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));

  const url = process.env.SUPABASE_URL ?? process.env.PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Defina SUPABASE_URL (ou PUBLIC_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`[migrate-free-pdfs] Modo: ${options.isDryRun ? 'DRY-RUN (somente leitura)' : 'EXECUTE (gravação ativa)'}`);
  if (options.limit) {
    console.log(`[migrate-free-pdfs] Limite total configurado: ${options.limit}`);
  }

  // 1. Contar total de leads com pdf_base64 e sem pdf_path
  const { count: pendingCount, error: countError } = await supabase
    .from('free_analyses_leads')
    .select('id', { count: 'exact', head: true })
    .is('pdf_path', null)
    .not('pdf_base64', 'is', null);

  if (countError) {
    console.error('Erro ao consultar contagem de leads pendentes:', countError.message);
    process.exit(1);
  }

  const totalToMigrate = options.limit ? Math.min(pendingCount ?? 0, options.limit) : (pendingCount ?? 0);
  console.log(`[migrate-free-pdfs] Total de leads pendentes de migração: ${pendingCount ?? 0} (processando até: ${totalToMigrate})`);

  if (totalToMigrate === 0) {
    console.log('[migrate-free-pdfs] Nenhum lead pendente de migração para o Storage.');
    return;
  }

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  while (processed < totalToMigrate) {
    const currentBatchLimit = Math.min(options.batchSize, totalToMigrate - processed);

    // Buscar apenas os IDs do lote (leve e rápido)
    const { data: leadIds, error: fetchError } = await supabase
      .from('free_analyses_leads')
      .select('id')
      .is('pdf_path', null)
      .not('pdf_base64', 'is', null)
      .order('created_at', { ascending: true })
      .limit(currentBatchLimit);

    if (fetchError || !leadIds || leadIds.length === 0) {
      if (fetchError) console.error('Erro ao buscar lote de IDs:', fetchError.message);
      break;
    }

    for (const item of leadIds) {
      processed++;
      const storagePath = `${item.id}.pdf`;

      if (options.isDryRun) {
        console.log(`[dry-run] [${processed}/${totalToMigrate}] Lead ${item.id} -> free-pdfs/${storagePath}`);
        succeeded++;
        continue;
      }

      // Modo EXECUTE: busca o pdf_base64 individualmente pelo ID (rápido via index scan)
      try {
        const { data: leadRecord, error: leadError } = await supabase
          .from('free_analyses_leads')
          .select('id, pdf_base64')
          .eq('id', item.id)
          .single();

        if (leadError || !leadRecord || !leadRecord.pdf_base64) {
          throw new Error(`Registro sem pdf_base64 ou erro na busca: ${leadError?.message}`);
        }

        const pdfBuffer = Buffer.from(leadRecord.pdf_base64, 'base64');
        const sizeKb = (pdfBuffer.length / 1024).toFixed(1);

        const { error: uploadError } = await supabase.storage
          .from('free-pdfs')
          .upload(storagePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Upload falhou: ${uploadError.message}`);
        }

        const { error: updateError } = await supabase
          .from('free_analyses_leads')
          .update({ pdf_path: storagePath })
          .eq('id', item.id);

        if (updateError) {
          throw new Error(`Update pdf_path falhou: ${updateError.message}`);
        }

        succeeded++;
        if (processed % 10 === 0 || processed === totalToMigrate) {
          console.log(`[execute] [${processed}/${totalToMigrate}] Progresso: Lead ${item.id} migrado com sucesso (${sizeKb} kB)`);
        }
      } catch (err: any) {
        failed++;
        console.error(`[execute] [${processed}/${totalToMigrate}] Erro no lead ${item.id}: ${err.message}`);
      }

      if (options.pauseMs > 0 && processed < totalToMigrate) {
        await new Promise((resolve) => setTimeout(resolve, options.pauseMs));
      }
    }
  }

  console.log('\n--- Resumo da Migração ---');
  console.log(`Total avaliado: ${processed}`);
  console.log(`Sucesso: ${succeeded}`);
  console.log(`Falhas: ${failed}`);
  console.log('--------------------------');
}

if (process.argv[1]?.endsWith('migrate-free-pdfs-to-storage.ts')) {
  main().catch((err) => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });
}
