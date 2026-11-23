import { supabase } from '../db/supabase';
import type { SupportTicketDetail, SupportTicketPage } from '../../shared/support-tickets';

const FIELDS = 'id, ticket_number, subject, status, created_at';
const PAGE_SIZE = 25;
const MESSAGE_LIMIT = 100;

async function listTickets(page: number, owner: { id: string } | null): Promise<SupportTicketPage> {
  const start = (page - 1) * PAGE_SIZE;
  const query = supabase.from('support_tickets').select(FIELDS);
  if (owner) query.eq('user_id', owner.id);
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(start, start + PAGE_SIZE);
  if (error) throw new Error('Falha ao listar chamados');
  const tickets = data ?? [];
  return { tickets: tickets.slice(0, PAGE_SIZE), hasNext: tickets.length > PAGE_SIZE };
}

export function listCustomerSupportTickets(userId: string, page: number): Promise<SupportTicketPage> {
  return listTickets(page, { id: userId });
}

export function listAdminSupportTickets(page: number): Promise<SupportTicketPage> {
  return listTickets(page, null);
}

export async function readAdminSupportTicket(id: string): Promise<SupportTicketDetail | null> {
  const { data: ticket, error } = await supabase.from('support_tickets')
    .select(`${FIELDS}, contact_email`)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error('Falha ao consultar chamado');
  if (!ticket) return null;

  const { data: messages, error: messagesError } = await supabase.from('support_messages')
    .select('id, is_admin, content, created_at')
    .eq('ticket_id', id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(MESSAGE_LIMIT + 1);
  if (messagesError) throw new Error('Falha ao consultar mensagens');
  const thread = messages ?? [];
  return {
    ...ticket,
    messages: thread.slice(0, MESSAGE_LIMIT).reverse(),
    hasOlderMessages: thread.length > MESSAGE_LIMIT,
  };
}
