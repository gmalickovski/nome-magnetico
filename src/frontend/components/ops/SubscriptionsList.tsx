import React, { useEffect, useState } from 'react';
import { PRODUCT_LABELS } from '../../../shared/product-labels';

type SubscriptionRow = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_nome: string | null;
  product_type: string;
  payment_provider: string | null;
  amount_paid: number | null;
  currency: string | null;
  starts_at: string;
  ends_at: string;
  created_at: string;
  refunded_at: string | null;
  is_active: boolean;
  is_trial: boolean;
  asaas_payment_id: string | null;
  stripe_session_id: string | null;
};

type ListResponse = {
  subscriptions: SubscriptionRow[];
  total: number;
  page: number;
  per_page: number;
};

type Filters = {
  q: string;
  product: string;
  status: string;
  provider: string;
  kind: string;
};

const fieldClass =
  'w-full rounded-full bg-[#0c0c0c] px-4 py-2.5 text-sm text-[#e5e2e1] outline outline-1 outline-[#d7c6ff]/15 placeholder:text-[#76746a] focus:outline-[#d7c6ff]/40';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
}

function formatMoney(cents: number | null, currency: string | null): string {
  if (cents === null || cents === undefined) return '—';
  const code = (currency || 'brl').toUpperCase();
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: code === 'BRL' ? 'BRL' : code }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${code}`;
  }
}

function statusLabel(row: SubscriptionRow): { label: string; className: string } {
  if (row.refunded_at) return { label: 'Reembolsada', className: 'bg-red-500/10 text-red-300' };
  if (row.is_active) return { label: 'Ativa', className: 'bg-emerald-500/10 text-emerald-300' };
  return { label: 'Expirada', className: 'bg-white/5 text-[#76746a]' };
}

function originLabel(row: SubscriptionRow): string {
  if (row.is_trial) return 'Teste';
  if (row.payment_provider === 'asaas') return 'Asaas';
  return 'Stripe';
}

const EMPTY_FILTERS: Filters = { q: '', product: '', status: '', provider: '', kind: '' };

export function SubscriptionsList() {
  const [q, setQ] = useState('');
  const [product, setProduct] = useState('');
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');
  const [kind, setKind] = useState('');
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ListResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function load(nextPage: number, filters: Filters) {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (filters.q.trim()) params.set('q', filters.q.trim());
    if (filters.product) params.set('product_type', filters.product);
    if (filters.status) params.set('status', filters.status);
    if (filters.provider) params.set('provider', filters.provider);
    if (filters.kind) params.set('kind', filters.kind);
    params.set('page', String(nextPage));

    try {
      const response = await fetch(`/api/ops/subscriptions?${params.toString()}`, { headers: { Accept: 'application/json' } });
      if (response.status === 401) {
        window.location.href = '/login?redirect=/subscriptions';
        return;
      }
      if (response.status === 403) {
        window.location.href = '/sem-permissao';
        return;
      }
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? 'Erro ao listar assinaturas');
        setLoading(false);
        return;
      }
      setResult(body as ListResponse);
      setPage(nextPage);
      setLoaded(true);
    } catch {
      setError('Não foi possível carregar a lista.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial: Filters = {
      q: params.get('q') ?? '',
      product: params.get('product_type') ?? '',
      status: params.get('status') ?? '',
      provider: params.get('provider') ?? '',
      kind: params.get('kind') ?? '',
    };
    setQ(initial.q);
    setProduct(initial.product);
    setStatus(initial.status);
    setProvider(initial.provider);
    setKind(initial.kind);
    setApplied(initial);
    void load(1, initial);
  }, []);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next = { q, product, status, provider, kind };
    setApplied(next);
    const url = new URL(window.location.href);
    url.search = '';
    if (next.q.trim()) url.searchParams.set('q', next.q.trim());
    if (next.product) url.searchParams.set('product_type', next.product);
    if (next.status) url.searchParams.set('status', next.status);
    if (next.provider) url.searchParams.set('provider', next.provider);
    if (next.kind) url.searchParams.set('kind', next.kind);
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
    void load(1, next);
  }

  const total = result?.total ?? 0;
  const perPage = result?.per_page ?? 20;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const hasPrev = page > 1;
  const hasNext = page * perPage < total;

  return (
    <div className="space-y-8">
      <p className="max-w-2xl text-sm leading-relaxed text-[#76746a]">
        Lista somente leitura das assinaturas gravadas no Nome Magnético. Reembolso e alteração de cobrança ficam fora desta tela.
      </p>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl bg-[#1c1b1a] p-5 md:grid-cols-3 xl:grid-cols-6 xl:items-end">
        <label className="block text-sm text-[#76746a] xl:col-span-2">
          Busca
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Email, nome ou id"
            className={`${fieldClass} mt-2`}
          />
        </label>
        <label className="block text-sm text-[#76746a]">
          Produto
          <select value={product} onChange={(event) => setProduct(event.target.value)} className={`${fieldClass} mt-2`}>
            <option value="">Todos</option>
            <option value="nome_social">Nome Social</option>
            <option value="nome_bebe">Nome de Bebê</option>
            <option value="nome_empresa">Nome Empresarial</option>
          </select>
        </label>
        <label className="block text-sm text-[#76746a]">
          Situação
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={`${fieldClass} mt-2`}>
            <option value="">Todas</option>
            <option value="active">Ativa</option>
            <option value="expired">Expirada</option>
            <option value="refunded">Reembolsada</option>
          </select>
        </label>
        <label className="block text-sm text-[#76746a]">
          Provedor
          <select value={provider} onChange={(event) => setProvider(event.target.value)} className={`${fieldClass} mt-2`}>
            <option value="">Todos</option>
            <option value="stripe">Stripe</option>
            <option value="asaas">Asaas</option>
          </select>
        </label>
        <label className="block text-sm text-[#76746a]">
          Tipo
          <select value={kind} onChange={(event) => setKind(event.target.value)} className={`${fieldClass} mt-2`}>
            <option value="">Todos</option>
            <option value="paid">Pago</option>
            <option value="trial">Teste</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-[#f2ca50] px-6 py-2.5 text-sm font-medium text-[#131313] shadow-[0_0_24px_rgba(242,202,80,0.18)] transition-colors duration-700 hover:bg-[#d4af37] xl:col-span-6 xl:justify-self-start"
        >
          Filtrar
        </button>
      </form>

      {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="overflow-x-auto rounded-2xl bg-[#1c1b1a] shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <table className="w-full min-w-[980px] text-left text-sm">
          <caption className="sr-only">Assinaturas do Nome Magnético</caption>
          <thead className="text-[11px] uppercase tracking-[0.14em] text-[#76746a]">
            <tr>
              <th className="px-5 py-4 font-medium">Usuário</th>
              <th className="px-5 py-4 font-medium">Produto</th>
              <th className="px-5 py-4 font-medium">Situação</th>
              <th className="px-5 py-4 font-medium">Origem</th>
              <th className="px-5 py-4 font-medium">Valor</th>
              <th className="px-5 py-4 font-medium">Início</th>
              <th className="px-5 py-4 font-medium">Até</th>
            </tr>
          </thead>
          <tbody>
            {loading && !loaded && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-[#76746a]">Carregando assinaturas…</td>
              </tr>
            )}
            {loaded && result?.subscriptions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-[#76746a]">Nenhuma assinatura encontrada.</td>
              </tr>
            )}
            {result?.subscriptions.map((row) => {
              const statusBadge = statusLabel(row);
              return (
                <tr key={row.id} className="odd:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    {row.user_id ? (
                      <a href={`/users/${row.user_id}`} className="text-[#f2ca50] transition-colors duration-700 hover:text-[#d4af37]">
                        {row.user_email || 'Sem email'}
                      </a>
                    ) : (
                      <span className="text-[#76746a]">Conta removida</span>
                    )}
                    {row.user_nome && <p className="mt-1 text-xs text-[#76746a]">{row.user_nome}</p>}
                  </td>
                  <td className="px-5 py-4 text-[#e5e2e1]">{PRODUCT_LABELS[row.product_type] ?? row.product_type}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs ${statusBadge.className}`}>{statusBadge.label}</span>
                  </td>
                  <td className="px-5 py-4 text-[#e5e2e1]">
                    {originLabel(row)}
                    {row.stripe_session_id && (
                      <p className="mt-1 max-w-[180px] truncate text-xs text-[#76746a]" title={row.stripe_session_id}>
                        {row.stripe_session_id}
                      </p>
                    )}
                    {row.asaas_payment_id && (
                      <p className="mt-1 max-w-[180px] truncate text-xs text-[#76746a]" title={row.asaas_payment_id}>
                        {row.asaas_payment_id}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-[#e5e2e1]">{formatMoney(row.amount_paid, row.currency)}</td>
                  <td className="px-5 py-4 text-[#76746a]">{formatDate(row.starts_at)}</td>
                  <td className="px-5 py-4 text-[#76746a]">{formatDate(row.ends_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4 text-sm text-[#76746a]">
        <p>{loaded ? `${from}–${to} de ${total}` : ' '}</p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!hasPrev || loading}
            onClick={() => void load(page - 1, applied)}
            className="rounded-full bg-[#1c1b1a] px-4 py-2 text-[#e5e2e1] disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={!hasNext || loading}
            onClick={() => void load(page + 1, applied)}
            className="rounded-full bg-[#1c1b1a] px-4 py-2 text-[#e5e2e1] disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
