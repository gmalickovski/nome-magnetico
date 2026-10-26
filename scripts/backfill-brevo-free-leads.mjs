import { createClient } from '@supabase/supabase-js';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const brevoApiKey = process.env.BREVO_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[backfill-brevo] PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function splitName(fullName) {
  const parts = String(fullName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const firstName = parts[0] ?? '';
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAllCompletedLeads() {
  const pageSize = 1000;
  let from = 0;
  const allRows = [];

  while (true) {
    const { data, error } = await supabase
      .from('free_analyses_leads')
      .select('id, email, nome_completo, status, created_at')
      .eq('status', 'complete')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Erro ao consultar free_analyses_leads: ${error.message}`);
    }
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
}

async function main() {
  const rows = await fetchAllCompletedLeads();
  const byEmail = new Map();

  for (const row of rows) {
    const email = String(row.email ?? '').trim().toLowerCase();
    if (!email) continue;
    byEmail.set(email, row);
  }

  const uniqueLeads = Array.from(byEmail.values());
  console.log(`[backfill-brevo] Total de registros 'complete': ${rows.length}`);
  console.log(`[backfill-brevo] Total de leads únicos deduplicados por e-mail: ${uniqueLeads.length}`);

  if (dryRun) {
    console.log('[backfill-brevo] Modo --dry-run ativo. Primeiros 5 exemplos:');
    for (const lead of uniqueLeads.slice(0, 5)) {
      const { firstName, lastName } = splitName(lead.nome_completo);
      console.log({
        id: lead.id,
        email: String(lead.email).trim().toLowerCase(),
        firstName,
        lastName,
        created_at: lead.created_at,
      });
    }
    return;
  }

  if (!brevoApiKey) {
    console.warn('[backfill-brevo] BREVO_API_KEY não definida no ambiente. Nenhum contato enviado.');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const lead of uniqueLeads) {
    const email = String(lead.email).trim().toLowerCase();
    const { firstName, lastName } = splitName(lead.nome_completo);

    try {
      const res = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': brevoApiKey,
        },
        body: JSON.stringify({
          email,
          updateEnabled: true,
          listIds: [16],
          attributes: {
            NOME: firstName,
            SOBRENOME: lastName,
            ORIGEM: 'analise_gratis',
          },
        }),
      });

      if (!res.ok) {
        const bodyText = await res.text();
        console.error(`[backfill-brevo] Erro (${res.status}) para ${email}: ${bodyText}`);
        errorCount += 1;
      } else {
        successCount += 1;
      }
    } catch (err) {
      console.error(`[backfill-brevo] Falha de rede para ${email}:`, err);
      errorCount += 1;
    }

    await sleep(150);
  }

  console.log(`[backfill-brevo] Concluído. Sucesso: ${successCount}, Erros: ${errorCount}`);
}

main().catch((err) => {
  console.error('[backfill-brevo] Erro fatal:', err);
  process.exit(1);
});
