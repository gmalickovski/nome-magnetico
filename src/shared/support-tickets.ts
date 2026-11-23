export interface SupportTicketSummary {
  id: string;
  ticket_number: string | null;
  subject: string;
  status: string;
  created_at: string;
}

export interface SupportTicketDetail extends SupportTicketSummary {
  contact_email: string | null;
  messages: { id: string; is_admin: boolean; content: string; created_at: string }[];
  hasOlderMessages: boolean;
}

export interface SupportTicketPage {
  tickets: SupportTicketSummary[];
  hasNext: boolean;
}

const statusLabels: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em atendimento',
  resolved: 'Resolvido',
  closed: 'Encerrado',
};

export function supportStatusLabel(status: string): string {
  return Object.hasOwn(statusLabels, status) ? statusLabels[status] : 'Status indisponível';
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

export function supportDate(value: string): string {
  return dateFormatter.format(new Date(value));
}
