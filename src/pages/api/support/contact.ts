import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { readServerEnv } from '../../../backend/env/runtime';
import { sendSmtpMail } from '../../../backend/notifications/smtp';
import { supabase } from '../../../backend/db/supabase';
import { captureFluxoException } from '../../../sentry/fluxo';

const DEFAULT_SUPPORT_INBOX = 'suporte@nomemagnetico.com.br';
const CONTACT_RATE_LIMIT = 3;
const CONTACT_RATE_WINDOW_MS = 24 * 60 * 60 * 1000;

const schema = z.object({
  assunto: z.string().min(1, 'Assunto é obrigatório'),
  mensagem: z.string().min(10, 'Mensagem deve ter ao menos 10 caracteres'),
  // nome e email: obrigatórios apenas para usuários públicos (validado abaixo)
  nome: z.string().min(2, 'Nome é obrigatório').optional(),
  email: z.string().email('Email inválido').optional(),
});

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getClientIp(request: Request, clientAddress?: string) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    forwardedFor ||
    clientAddress ||
    'unknown'
  );
}

function hashIp(ip: string) {
  const salt = readServerEnv('RATE_LIMIT_SALT') || readServerEnv('SUPABASE_SERVICE_ROLE_KEY') || 'nome-magnetico';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

/**
 * Mesmo desenho do analyze-live: hash do IP, janela de 24h, limite 3,
 * falha de contagem não bloqueia o envio. Vale para visitante e conta logada.
 * Devolve a resposta 429, ou null para seguir.
 */
async function enforceContactRateLimit(request: Request, clientAddress?: string): Promise<Response | null> {
  const ipHash = hashIp(getClientIp(request, clientAddress));
  const since = new Date(Date.now() - CONTACT_RATE_WINDOW_MS).toISOString();
  const { count, error: countError } = await supabase
    .from('support_contact_rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', since);

  if (countError) {
    console.error('[support/contact] rate limit count failed:', countError.message);
  } else if ((count ?? 0) >= CONTACT_RATE_LIMIT) {
    return json(
      { error: 'Você enviou muitas mensagens. Tente novamente mais tarde.' },
      429,
    );
  }

  const { error: insertError } = await supabase
    .from('support_contact_rate_limits')
    .insert({ ip_hash: ipHash });

  if (insertError) {
    console.error('[support/contact] rate limit insert failed:', insertError.message);
  }

  return null;
}

function supportInbox(): string {
  return readServerEnv('SUPPORT_INBOX_EMAIL') ?? DEFAULT_SUPPORT_INBOX;
}

function formatSaoPaulo(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

function alertText(input: {
  ticketNumber: string;
  ticketId: string;
  name: string;
  email: string;
  message: string;
  sentAt: Date;
}) {
  return [
    `Nome: ${input.name}`,
    `E-mail: ${input.email}`,
    `Data: ${formatSaoPaulo(input.sentAt)}`,
    `Número do ticket: ${input.ticketNumber}`,
    `Id: ${input.ticketId}`,
    '',
    'Mensagem:',
    input.message,
  ].join('\n');
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, 400);
  }

  const user = locals.user;
  let nome: string;
  let email: string;
  let userId: string | null = null;

  if (!user) {
    if (!parsed.data.nome?.trim()) {
      return json({ error: 'Nome é obrigatório.' }, 400);
    }
    if (!parsed.data.email?.trim()) {
      return json({ error: 'Email é obrigatório.' }, 400);
    }
    nome = parsed.data.nome.trim();
    email = parsed.data.email.trim();
  } else {
    userId = user.id;
    email = user.email?.trim() ?? '';
    nome = '';
  }

  const limited = await enforceContactRateLimit(request, clientAddress);
  if (limited) return limited;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome')
      .eq('id', user.id)
      .single();
    nome = typeof profile?.nome === 'string' ? profile.nome.trim() : '';
  }

  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .insert({
      subject: parsed.data.assunto,
      contact_email: email,
      contact_name: nome,
      user_id: userId,
      source: 'form',
    })
    .select('id, ticket_number')
    .single();

  if (ticketError || !ticket?.id) {
    console.error('[support/contact] falha ao gravar ticket', ticketError?.code ?? 'sem-codigo');
    captureFluxoException('suporte_contato', new Error('Falha ao gravar ticket'));
    return json({ error: 'Não foi possível enviar sua mensagem. Tente novamente.' }, 500);
  }

  const { error: messageError } = await supabase.from('support_messages').insert({
    ticket_id: ticket.id,
    author_id: userId,
    is_admin: false,
    content: parsed.data.mensagem,
  });

  if (messageError) {
    console.error('[support/contact] falha ao gravar mensagem', messageError.code ?? 'sem-codigo');
    const { error: deleteError } = await supabase.from('support_tickets').delete().eq('id', ticket.id);
    if (deleteError) {
      console.error('[support/contact] falha ao desfazer ticket sem mensagem', deleteError.code ?? 'sem-codigo');
    }
    captureFluxoException('suporte_contato', new Error('Falha ao gravar mensagem'));
    return json({ error: 'Não foi possível enviar sua mensagem. Tente novamente.' }, 500);
  }

  const ticketNumber = ticket.ticket_number == null ? '' : String(ticket.ticket_number);
  const ticketId = String(ticket.id);

  try {
    await sendSmtpMail({
      to: supportInbox(),
      replyTo: email || undefined,
      subject: `[Contato NM] ${parsed.data.assunto} — ${nome}`,
      text: alertText({
        ticketNumber,
        ticketId,
        name: nome,
        email,
        message: parsed.data.mensagem,
        sentAt: new Date(),
      }),
    });
  } catch (error) {
    console.error('[support/contact] falha ao enviar aviso do ticket', ticketId, error);
    try {
      captureFluxoException('suporte_contato', error);
    } catch (captureError) {
      console.error('[support/contact] falha ao registrar aviso', captureError);
    }
  }

  return json({ ok: true });
};
