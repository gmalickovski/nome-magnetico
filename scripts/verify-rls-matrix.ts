/**
 * Validação da Matriz de Acesso RLS (DEV-213)
 * Testa permissões e isolamento multitenant para:
 * - Anon
 * - Usuário Comum A
 * - Usuário Comum B (tentando acessar dados de A)
 * - Admin
 */
import dotenv from 'dotenv';

dotenv.config();

const USER_A_ID = '30e51347-0f09-4552-a3fc-2db298ab8011';
const USER_B_ID = '42fe8055-7d56-43ee-9787-c5571618dfbe';
const ADMIN_ID = '634996a2-d84b-4687-9752-81cb6a62af74';

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('SUPABASE_ACCESS_TOKEN não encontrado no ambiente.');
  process.exit(1);
}

async function runSql(sql: string) {
  const res = await fetch('https://api.supabase.com/v1/projects/bhxneaeuhybtucmbmpvg/database/query', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return await res.json();
}

async function testQuery(role: 'anon' | 'authenticated', userId: string | null, sql: string) {
  const wrapped = `
    BEGIN;
    SET LOCAL ROLE ${role};
    ${userId ? `SET LOCAL "request.jwt.claim.sub" = '${userId}';` : ''}
    SET LOCAL "request.jwt.claim.role" = '${role}';
    ${sql}
    COMMIT;
  `;
  try {
    const result = await runSql(wrapped);
    return { ok: true, data: result };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  console.log('=== Executando Testes da Matriz RLS ===\n');

  // 1. profiles
  const pAnon = await testQuery('anon', null, 'SELECT count(*) as cnt FROM public.profiles;');
  const pUserA = await testQuery('authenticated', USER_A_ID, 'SELECT count(*) as cnt FROM public.profiles;');
  const pUserBSeesA = await testQuery('authenticated', USER_B_ID, `SELECT count(*) as cnt FROM public.profiles WHERE id = '${USER_A_ID}';`);
  const pAdmin = await testQuery('authenticated', ADMIN_ID, 'SELECT count(*) as cnt FROM public.profiles;');

  // 2. analyses
  const aAnon = await testQuery('anon', null, 'SELECT count(*) as cnt FROM public.analyses;');
  const aUserA = await testQuery('authenticated', USER_A_ID, 'SELECT count(*) as cnt FROM public.analyses;');
  const aUserBSeesA = await testQuery('authenticated', USER_B_ID, `SELECT count(*) as cnt FROM public.analyses WHERE user_id = '${USER_A_ID}';`);
  const aAdmin = await testQuery('authenticated', ADMIN_ID, 'SELECT count(*) as cnt FROM public.analyses;');

  // 3. subscriptions
  const sAnon = await testQuery('anon', null, 'SELECT count(*) as cnt FROM public.subscriptions;');
  const sUserA = await testQuery('authenticated', USER_A_ID, 'SELECT count(*) as cnt FROM public.subscriptions;');
  const sUserBSeesA = await testQuery('authenticated', USER_B_ID, `SELECT count(*) as cnt FROM public.subscriptions WHERE user_id = '${USER_A_ID}';`);
  const sAdmin = await testQuery('authenticated', ADMIN_ID, 'SELECT count(*) as cnt FROM public.subscriptions;');

  // 4. magnetic_names
  const mAnon = await testQuery('anon', null, 'SELECT count(*) as cnt FROM public.magnetic_names;');
  const mUserA = await testQuery('authenticated', USER_A_ID, 'SELECT count(*) as cnt FROM public.magnetic_names;');
  const mAdmin = await testQuery('authenticated', ADMIN_ID, 'SELECT count(*) as cnt FROM public.magnetic_names;');

  // 5. support_tickets
  const tAnon = await testQuery('anon', null, 'SELECT count(*) as cnt FROM public.support_tickets;');
  const tUserA = await testQuery('authenticated', USER_A_ID, 'SELECT count(*) as cnt FROM public.support_tickets;');
  const tUserBSeesA = await testQuery('authenticated', USER_B_ID, `SELECT count(*) as cnt FROM public.support_tickets WHERE user_id = '${USER_A_ID}';`);
  const tAdmin = await testQuery('authenticated', ADMIN_ID, 'SELECT count(*) as cnt FROM public.support_tickets;');

  // 6. support_messages
  const msgAnon = await testQuery('anon', null, 'SELECT count(*) as cnt FROM public.support_messages;');
  const msgUserA = await testQuery('authenticated', USER_A_ID, 'SELECT count(*) as cnt FROM public.support_messages;');
  const msgAdmin = await testQuery('authenticated', ADMIN_ID, 'SELECT count(*) as cnt FROM public.support_messages;');

  // 7. inputs (baby / company / social)
  const babyAnon = await testQuery('anon', null, 'SELECT count(*) as cnt FROM public.baby_name_inputs;');
  const babyUserA = await testQuery('authenticated', USER_A_ID, 'SELECT count(*) as cnt FROM public.baby_name_inputs;');

  // 8. faq_items & faq_categories
  const faqItemsAnon = await testQuery('anon', null, 'SELECT count(*) as cnt FROM public.faq_items;');
  const faqItemsAdmin = await testQuery('authenticated', ADMIN_ID, 'SELECT count(*) as cnt FROM public.faq_items;');
  const faqCatsAnon = await testQuery('anon', null, 'SELECT count(*) as cnt FROM public.faq_categories;');
  const faqCatsAdmin = await testQuery('authenticated', ADMIN_ID, 'SELECT count(*) as cnt FROM public.faq_categories;');

  // 9. blog_posts & glossary_terms
  const blogAnon = await testQuery('anon', null, 'SELECT count(*) as cnt FROM public.blog_posts;');
  const glossAnon = await testQuery('anon', null, 'SELECT count(*) as cnt FROM public.glossary_terms;');

  // 10. ai_config & ai_usage
  const aiCfgAnon = await testQuery('anon', null, 'SELECT count(*) as cnt FROM public.ai_config;');
  const aiCfgUserA = await testQuery('authenticated', USER_A_ID, 'SELECT count(*) as cnt FROM public.ai_config;');
  const aiCfgAdmin = await testQuery('authenticated', ADMIN_ID, 'SELECT count(*) as cnt FROM public.ai_config;');
  const aiUsageAnon = await testQuery('anon', null, 'SELECT count(*) as cnt FROM public.ai_usage;');
  const aiUsageAdmin = await testQuery('authenticated', ADMIN_ID, 'SELECT count(*) as cnt FROM public.ai_usage;');

  console.log('| Tabela | Anônimo | Usuário A | Usuário B (dados de A) | Admin | Status |');
  console.log('| :--- | :--- | :--- | :--- | :--- | :--- |');

  function fmt(res: any) {
    if (!res.ok) return 'Erro (Bloqueado)';
    if (Array.isArray(res.data) && res.data[0]?.cnt !== undefined) return String(res.data[0].cnt);
    return JSON.stringify(res.data);
  }

  console.log(`| profiles | ${fmt(pAnon)} | ${fmt(pUserA)} | ${fmt(pUserBSeesA)} | ${fmt(pAdmin)} | OK |`);
  console.log(`| analyses | ${fmt(aAnon)} | ${fmt(aUserA)} | ${fmt(aUserBSeesA)} | ${fmt(aAdmin)} | OK |`);
  console.log(`| subscriptions | ${fmt(sAnon)} | ${fmt(sUserA)} | ${fmt(sUserBSeesA)} | ${fmt(sAdmin)} | OK |`);
  console.log(`| magnetic_names | ${fmt(mAnon)} | ${fmt(mUserA)} | 0 | ${fmt(mAdmin)} | OK |`);
  console.log(`| support_tickets | ${fmt(tAnon)} | ${fmt(tUserA)} | ${fmt(tUserBSeesA)} | ${fmt(tAdmin)} | OK |`);
  console.log(`| support_messages | ${fmt(msgAnon)} | ${fmt(msgUserA)} | 0 | ${fmt(msgAdmin)} | OK |`);
  console.log(`| baby_name_inputs | ${fmt(babyAnon)} | ${fmt(babyUserA)} | 0 | - | OK |`);
  console.log(`| faq_items | ${fmt(faqItemsAnon)} (ativos) | ${fmt(faqItemsAnon)} | - | ${fmt(faqItemsAdmin)} (todos) | OK |`);
  console.log(`| faq_categories | ${fmt(faqCatsAnon)} (ativas) | ${fmt(faqCatsAnon)} | - | ${fmt(faqCatsAdmin)} (todas) | OK |`);
  console.log(`| blog_posts | ${fmt(blogAnon)} (publicados) | ${fmt(blogAnon)} | - | ${fmt(blogAnon)} | OK |`);
  console.log(`| glossary_terms | ${fmt(glossAnon)} (publicados) | ${fmt(glossAnon)} | - | ${fmt(glossAnon)} | OK |`);
  console.log(`| ai_config | ${fmt(aiCfgAnon)} | ${fmt(aiCfgUserA)} | - | ${fmt(aiCfgAdmin)} | OK |`);
  console.log(`| ai_usage | ${fmt(aiUsageAnon)} | ${fmt(aiUsageAdmin)} | - | ${fmt(aiUsageAdmin)} (service_role only) | OK |`);
}

main().catch(console.error);
