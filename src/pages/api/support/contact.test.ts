import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { beforeEach, describe, it, mock } from 'node:test';

type DbCall = { table: string; op: 'insert' | 'delete'; payload?: unknown };
type SentMail = { from?: string; to?: string; subject?: string; text?: string; replyTo?: string };
type TransportOptions = { host?: string; port?: number; secure?: boolean; auth?: { user?: string } };

const dbCalls: DbCall[] = [];
const sent: SentMail[] = [];
const transports: TransportOptions[] = [];
const captured: { fluxo: string; error: unknown }[] = [];

let failEmail = false;
let rateCount = 0;

function from(table: string) {
  let payload: unknown;
  const finish = () => {
    if (table === 'support_contact_rate_limits') {
      return payload === undefined ? { count: rateCount, error: null } : { error: null };
    }
    if (table === 'profiles') {
      return { data: { nome: 'Ana Silva' }, error: null };
    }
    if (table === 'support_tickets' && payload !== undefined) {
      return { data: { id: 'ticket-1', ticket_number: 4821 }, error: null };
    }
    return { error: null };
  };

  const builder = {
    select() {
      return builder;
    },
    eq() {
      return builder;
    },
    gte() {
      return builder;
    },
    insert(row: unknown) {
      payload = row;
      dbCalls.push({ table, op: 'insert', payload: row });
      return builder;
    },
    delete() {
      dbCalls.push({ table, op: 'delete' });
      return builder;
    },
    single() {
      return Promise.resolve(finish());
    },
    then(onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) {
      return Promise.resolve(finish()).then(onFulfilled, onRejected);
    },
  };
  return builder;
}

function createTransport(options: TransportOptions) {
  transports.push(options);
  return {
    sendMail: async (mail: SentMail) => {
      if (failEmail) throw new Error('falha de envio');
      sent.push(mail);
      return { messageId: 'ok' };
    },
  };
}

mock.module('nodemailer', {
  defaultExport: { createTransport },
  namedExports: { createTransport },
});

mock.module('../../../backend/db/supabase', {
  namedExports: {
    supabase: { from },
  },
});

mock.module('../../../sentry/fluxo', {
  namedExports: {
    captureFluxoException(fluxo: string, error: unknown) {
      captured.push({ fluxo, error });
    },
  },
});

const { POST } = await import('./contact.ts');

const publicBody = {
  nome: 'Ana',
  email: 'ana@example.com',
  assunto: 'Dúvida sobre os planos',
  mensagem: 'Preciso de ajuda com o acesso da minha conta.',
};

function hashIp(ip: string) {
  return createHash('sha256').update(`test-salt:${ip}`).digest('hex');
}

async function call(
  body: unknown,
  init?: { user?: { id: string; email?: string } | null; ip?: string; raw?: string },
) {
  const ip = init?.ip ?? '203.0.113.10';
  const request = new Request('http://localhost/api/support/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'cf-connecting-ip': ip,
    },
    body: init?.raw ?? JSON.stringify(body),
  });
  return POST({
    request,
    locals: { user: init?.user ?? null, accessToken: null },
    clientAddress: ip,
  } as Parameters<typeof POST>[0]);
}

function inserts(table: string) {
  return dbCalls.filter((call) => call.table === table && call.op === 'insert');
}

describe('POST /api/support/contact', { concurrency: false }, () => {
  beforeEach(() => {
    dbCalls.length = 0;
    sent.length = 0;
    transports.length = 0;
    captured.length = 0;
    failEmail = false;
    rateCount = 0;
    process.env.SMTP_HOST = 'email-smtp.example.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_USER = 'smtp-user';
    process.env.SMTP_PASS = 'smtp-pass';
    process.env.SMTP_FROM = 'contato@example.com';
    process.env.RATE_LIMIT_SALT = 'test-salt';
    delete process.env.SUPPORT_INBOX_EMAIL;
  });

  it('grava ticket e mensagem e envia o aviso', async () => {
    const response = await call(publicBody);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });

    assert.deepEqual(inserts('support_tickets')[0]?.payload, {
      subject: 'Dúvida sobre os planos',
      contact_email: 'ana@example.com',
      contact_name: 'Ana',
      user_id: null,
      source: 'form',
    });
    assert.equal('ticket_number' in ((inserts('support_tickets')[0]?.payload ?? {}) as object), false);

    assert.deepEqual(inserts('support_messages')[0]?.payload, {
      ticket_id: 'ticket-1',
      author_id: null,
      is_admin: false,
      content: publicBody.mensagem,
    });

    assert.deepEqual(inserts('support_contact_rate_limits')[0]?.payload, {
      ip_hash: hashIp('203.0.113.10'),
    });

    assert.equal(transports[0]?.host, 'email-smtp.example.com');
    assert.equal(transports[0]?.port, 465);
    assert.equal(transports[0]?.secure, true);
    assert.equal(transports[0]?.auth?.user, 'smtp-user');
    assert.equal(sent[0]?.from, 'contato@example.com');
    assert.equal(sent[0]?.to, 'suporte@nomemagnetico.com.br');
    assert.equal(sent[0]?.replyTo, 'ana@example.com');
    assert.equal(sent[0]?.subject, '[Contato NM] Dúvida sobre os planos — Ana');
    assert.match(sent[0]?.text ?? '', /Nome: Ana/);
    assert.match(sent[0]?.text ?? '', /E-mail: ana@example.com/);
    assert.match(sent[0]?.text ?? '', /Data: \d{2}\/\d{2}\/\d{4}/);
    assert.match(sent[0]?.text ?? '', /Número do ticket: 4821/);
    assert.match(sent[0]?.text ?? '', /Id: ticket-1/);
    assert.match(sent[0]?.text ?? '', /Preciso de ajuda com o acesso da minha conta\./);
    assert.equal(captured.length, 0);
  });

  it('usa SUPPORT_INBOX_EMAIL quando a env está preenchida', async () => {
    process.env.SUPPORT_INBOX_EMAIL = 'fila@example.com';
    const response = await call(publicBody);

    assert.equal(response.status, 200);
    assert.equal(sent[0]?.to, 'fila@example.com');
    assert.equal(sent[0]?.replyTo, 'ana@example.com');
    assert.equal(sent[0]?.subject, '[Contato NM] Dúvida sobre os planos — Ana');
  });

  it('usa a conta logada e ignora nome e e-mail do corpo', async () => {
    const response = await call(
      {
        nome: 'Outra Pessoa',
        email: 'outra@example.com',
        assunto: 'Bug',
        mensagem: 'O botão de entrar não responde no celular.',
      },
      { user: { id: 'user-1', email: 'ana@example.com' } },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(inserts('support_tickets')[0]?.payload, {
      subject: 'Bug',
      contact_email: 'ana@example.com',
      contact_name: 'Ana Silva',
      user_id: 'user-1',
      source: 'form',
    });
    assert.deepEqual(inserts('support_messages')[0]?.payload, {
      ticket_id: 'ticket-1',
      author_id: 'user-1',
      is_admin: false,
      content: 'O botão de entrar não responde no celular.',
    });
    assert.equal(sent[0]?.to, 'suporte@nomemagnetico.com.br');
    assert.equal(sent[0]?.replyTo, 'ana@example.com');
    assert.equal(sent[0]?.subject, '[Contato NM] Bug — Ana Silva');
    assert.match(sent[0]?.text ?? '', /Nome: Ana Silva/);
    assert.match(sent[0]?.text ?? '', /E-mail: ana@example.com/);
    assert.match(sent[0]?.text ?? '', /Id: ticket-1/);
  });

  it('mantém o ticket gravado quando o e-mail falha', async () => {
    failEmail = true;
    const response = await call(publicBody);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(inserts('support_tickets').length, 1);
    assert.equal(inserts('support_messages').length, 1);
    assert.equal(sent.length, 0);
    assert.equal(captured.length, 1);
    assert.equal(captured[0]?.fluxo, 'suporte_contato');
    assert.match(String(captured[0]?.error), /falha de envio/);
  });

  it('recusa quando o IP passou do limite e não grava ticket', async () => {
    rateCount = 3;
    const response = await call(publicBody);
    const body = await response.json();

    assert.equal(response.status, 429);
    assert.equal(body.error, 'Você enviou muitas mensagens. Tente novamente mais tarde.');
    assert.equal(inserts('support_contact_rate_limits').length, 0);
    assert.equal(inserts('support_tickets').length, 0);
    assert.equal(inserts('support_messages').length, 0);
    assert.equal(sent.length, 0);
    assert.equal(captured.length, 0);
  });

  it('mantém a validação da mensagem curta', async () => {
    const response = await call({ ...publicBody, mensagem: 'curta' });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, 'Mensagem deve ter ao menos 10 caracteres');
    assert.equal(dbCalls.length, 0);
    assert.equal(sent.length, 0);
  });
});
