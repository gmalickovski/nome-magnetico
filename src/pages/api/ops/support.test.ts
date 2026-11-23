import assert from 'node:assert/strict';
import { beforeEach, it, mock } from 'node:test';

const actorId = '08ebe101-b62a-4783-83dd-1e195b8f5105';
const ticketId = 'e9563cd5-ec4f-4b7d-8fc2-d8ab00d194c0';
const ticket = {
  id: ticketId, subject: 'Assunto fictício', ticket_number: 'TKT-0042',
  status: 'open', created_at: '2026-11-22T12:00:00.000Z',
};
const message = (content: string) => ({ content, is_admin: false, created_at: ticket.created_at, id: content });
const queries: Array<{ table: string; fields?: string; filters: Record<string, unknown>; range?: [number, number] }> = [];
let role = 'admin';

mock.module('../../../backend/db/supabase', {
  namedExports: {
    supabase: {
      from(table: string) {
        const entry: typeof queries[number] = { table, filters: {} };
        queries.push(entry);
        const query = {
          select(fields: string) { entry.fields = fields; return query; },
          eq(key: string, value: unknown) { entry.filters[key] = value; return query; },
          order() { return query; },
          range(from: number, to: number) {
            entry.range = [from, to];
            return Promise.resolve({ data: [ticket], error: null });
          },
          maybeSingle() {
            const data = table === 'profiles'
              ? { id: actorId, role }
              : entry.filters.id === ticketId ? { ...ticket, contact_email: null } : null;
            return Promise.resolve({ data, error: null });
          },
          limit() {
            return Promise.resolve({ data: [message('segundo'), message('primeiro')], error: null });
          },
        };
        return query;
      },
    },
  },
});

const { GET } = await import('./support');
const { listCustomerSupportTickets } = await import('../../../backend/support/read-tickets');

function request(path = '', user = true, host = 'admin.localhost') {
  const url = new URL(`https://${host}/api/ops/support${path}`);
  return GET({
    url,
    request: new Request(url, { headers: { host } }),
    locals: user ? { user: { id: actorId } } : {},
  } as Parameters<typeof GET>[0]);
}

beforeEach(() => {
  role = 'admin';
  queries.length = 0;
});

it('bloqueia host público, visitante e perfil não administrativo antes de ler chamados', async () => {
  assert.equal((await request('', true, 'www.nomemagnetico.com.br')).status, 403);
  assert.equal((await request('', false)).status, 401);
  role = 'user';
  assert.equal((await request(`?ticket=${ticketId}`)).status, 403);
  assert.deepEqual(queries.map(({ table }) => table), ['profiles']);
});

it('valida a consulta e pagina os chamados com cache privado desativado', async () => {
  assert.equal((await request('?ticket=invalid')).status, 400);
  const response = await request('?page=2');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await response.json(), { tickets: [ticket], hasNext: false });
  assert.deepEqual(queries.at(-1)?.range, [25, 50]);
});

it('lê somente as mensagens do ticket aberto e responde 404 para outro id', async () => {
  const response = await request(`?ticket=${ticketId}`);
  assert.equal(response.status, 200);
  const { ticket: detail } = await response.json();
  assert.deepEqual(detail.messages.map(({ content }: { content: string }) => content), ['primeiro', 'segundo']);
  assert.equal(queries.at(-1)?.filters.ticket_id, ticketId);
  assert.equal((await request(`?ticket=${actorId}`)).status, 404);
  assert.equal(queries.filter(({ table }) => table === 'support_messages').length, 1);
});

it('filtra histórico pelo ID da sessão e não projeta e-mail ou conteúdo', async () => {
  assert.deepEqual(await listCustomerSupportTickets(actorId, 1), { tickets: [ticket], hasNext: false });
  assert.deepEqual(queries[0].filters, { user_id: actorId });
  assert.doesNotMatch(queries[0].fields ?? '', /email|content/);
});
