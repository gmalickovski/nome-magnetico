import { useEffect, useRef, useState } from 'react';
import {
  supportDate,
  supportStatusLabel,
  type SupportTicketDetail,
  type SupportTicketPage,
} from '../../../shared/support-tickets';

async function fetchInbox<T>(params: URLSearchParams, signal: AbortSignal): Promise<T> {
  const response = await fetch(`/api/ops/support?${params}`, { signal });
  if (!response.ok) throw new Error('Falha na consulta de suporte');
  return response.json();
}

const panel = 'min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6';
const control = 'min-h-11 rounded-xl px-3 text-sm text-[#f2ca50] hover:bg-white/10 disabled:opacity-50';

export function SupportInbox() {
  const [page, setPage] = useState(1);
  const [list, setList] = useState<SupportTicketPage | null>(null);
  const [listError, setListError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null);
  const [detailError, setDetailError] = useState(false);
  const thread = useRef<HTMLElement>(null);

  useEffect(() => {
    const request = new AbortController();
    fetchInbox<SupportTicketPage>(new URLSearchParams({ page: String(page) }), request.signal)
      .then((result) => { if (!request.signal.aborted) setList(result); })
      .catch(() => { if (!request.signal.aborted) setListError(true); });
    return () => request.abort();
  }, [page]);

  useEffect(() => {
    if (!selected) return;
    const request = new AbortController();
    fetchInbox<{ ticket: SupportTicketDetail }>(new URLSearchParams({ ticket: selected }), request.signal)
      .then(({ ticket }) => { if (!request.signal.aborted) setDetail(ticket); })
      .catch(() => { if (!request.signal.aborted) setDetailError(true); });
    return () => request.abort();
  }, [selected]);

  function changePage(next: number) {
    setList(null);
    setListError(false);
    setPage(next);
  }

  function selectTicket(id: string) {
    if (id !== selected) {
      setDetail(null);
      setDetailError(false);
      setSelected(id);
    }
    thread.current?.focus();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section className={panel} aria-labelledby="inbox-title">
        <h2 id="inbox-title" className="mb-4 text-lg font-semibold">Chamados</h2>
        {listError && <p role="alert" className="text-sm text-red-300">Não foi possível carregar os chamados. Atualize a página para tentar novamente.</p>}
        {!list && !listError && <p role="status" className="text-sm text-neutral-300">Carregando chamados…</p>}
        {list?.tickets.length === 0 && <p className="text-sm text-neutral-300">Nenhum chamado nesta página.</p>}
        {list && (
          <>
            <ul className="space-y-2">
              {list.tickets.map((ticket) => (
                <li key={ticket.id}>
                  <button
                    type="button"
                    aria-pressed={selected === ticket.id}
                    className="w-full rounded-xl border border-white/10 p-3 text-left hover:bg-white/10 aria-pressed:border-[#f2ca50]"
                    onClick={() => selectTicket(ticket.id)}
                  >
                    <span className="block break-words text-sm font-semibold">{ticket.subject}</span>
                    <span className="mt-1 flex flex-wrap gap-x-2 text-xs text-neutral-300">
                      {ticket.ticket_number}
                      <span>{supportStatusLabel(ticket.status)}</span>
                      <time dateTime={ticket.created_at}>{supportDate(ticket.created_at)}</time>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {(page > 1 || list.hasNext) && (
              <nav aria-label="Páginas dos chamados" className="mt-4 flex flex-wrap items-center justify-between">
                <button className={control} type="button" disabled={page === 1} onClick={() => changePage(page - 1)}>Anterior</button>
                <span className="text-sm text-neutral-300">Página {page}</span>
                <button className={control} type="button" disabled={!list.hasNext} onClick={() => changePage(page + 1)}>Próxima</button>
              </nav>
            )}
          </>
        )}
      </section>
      <section className={panel} aria-labelledby="thread-title" ref={thread} tabIndex={-1}>
        <h2 id="thread-title" className="mb-4 text-lg font-semibold">Conversa</h2>
        {!selected && <p className="text-sm text-neutral-300">Selecione um chamado para ver as mensagens.</p>}
        {detailError && <p role="alert" className="text-sm text-red-300">Não foi possível abrir este chamado.</p>}
        {selected && !detail && !detailError && <p role="status" className="text-sm text-neutral-300">Carregando conversa…</p>}
        {detail && (
          <>
            <h3 className="break-words font-semibold">{detail.subject}</h3>
            <p className="mt-1 text-sm text-neutral-300">
              {detail.ticket_number && `${detail.ticket_number} · `}{supportStatusLabel(detail.status)}
            </p>
            {detail.contact_email && <p className="mt-1 break-all text-sm text-neutral-300">{detail.contact_email}</p>}
            {detail.hasOlderMessages && <p className="mt-4 text-xs text-neutral-300">Exibindo as 100 mensagens mais recentes.</p>}
            {detail.messages.length === 0 && <p className="mt-4 text-sm text-neutral-300">Nenhuma mensagem neste chamado.</p>}
            <ol className="mt-4 space-y-3">
              {detail.messages.map((message) => (
                <li key={message.id} className="rounded-xl border border-white/10 p-3">
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-neutral-300">
                    <span>{message.is_admin ? 'Equipe de suporte' : 'Solicitante'}</span>
                    <time dateTime={message.created_at}>{supportDate(message.created_at)}</time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm">{message.content}</p>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </div>
  );
}
