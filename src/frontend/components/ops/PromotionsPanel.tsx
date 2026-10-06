import React, { useCallback, useEffect, useState } from 'react';
import { opsFetch } from '../../ops/opsFetch';
import {
  formatDateTime,
  formatDiscount,
  formatProducts,
  localInputToIso,
  reaisToCents,
  STATE_CLASSES,
  STATE_LABELS,
  type RegistryState,
} from '../../../shared/promo-format';
import { fieldClass, ghostButtonClass, Pager, primaryButtonClass, ProductChips } from './promo-fields';

type Promotion = {
  id: string;
  name: string;
  product_types: string[];
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  banner_text: string | null;
  state: RegistryState;
};

type ListResponse = { promotions: Promotion[]; total: number; page: number; per_page: number };

const EMPTY_FORM = {
  name: '',
  products: [] as string[],
  discountType: 'percent' as 'percent' | 'fixed',
  discountValue: '',
  startsAt: '',
  endsAt: '',
  bannerText: '',
};

export function PromotionsPanel() {
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async (nextPage: number, nextState: string) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(nextPage) });
    if (nextState) params.set('state', nextState);
    const response = await opsFetch<ListResponse>(`/api/ops/promotions?${params.toString()}`);
    if (response.ok) {
      setResult(response.data);
      setPage(nextPage);
    } else {
      setError(response.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(1, '');
  }, [load]);

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    setFormError('');
    setNotice('');

    const discountValue =
      form.discountType === 'percent' ? parseInt(form.discountValue, 10) : reaisToCents(form.discountValue);
    if (!discountValue || discountValue <= 0 || (form.discountType === 'percent' && discountValue > 100)) {
      setFormError(form.discountType === 'percent' ? 'Informe um percentual de 1 a 100.' : 'Informe um valor em reais.');
      return;
    }

    const endsAt = localInputToIso(form.endsAt);
    if (!endsAt) {
      setFormError('Informe a data de fim.');
      return;
    }
    const startsAt = localInputToIso(form.startsAt);

    setSaving(true);
    const response = await opsFetch<{ promotion: Promotion }>('/api/ops/promotions', {
      method: 'POST',
      body: {
        name: form.name,
        product_types: form.products,
        discount_type: form.discountType,
        discount_value: discountValue,
        starts_at: startsAt,
        ends_at: endsAt,
        banner_text: form.bannerText.trim() || null,
      },
    });
    setSaving(false);

    if (!response.ok) {
      setFormError(response.error);
      return;
    }
    setForm(EMPTY_FORM);
    setFormOpen(false);
    setNotice('Promoção criada.');
    void load(1, state);
  }

  async function toggle(row: Promotion) {
    const next = !row.is_active;
    const confirmed = window.confirm(
      next ? `Reativar a promoção "${row.name}"?` : `Desativar a promoção "${row.name}"?`,
    );
    if (!confirmed) return;

    setBusyId(row.id);
    setNotice('');
    setError('');
    const response = await opsFetch<{ promotion: Promotion }>(`/api/ops/promotions/${row.id}`, {
      method: 'PATCH',
      body: { is_active: next },
    });
    setBusyId('');

    if (!response.ok) {
      setError(response.error);
      return;
    }
    setNotice(next ? 'Promoção reativada.' : 'Promoção desativada.');
    void load(page, state);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="block text-sm text-[#76746a]">
          Situação
          <select
            value={state}
            onChange={(event) => {
              setState(event.target.value);
              void load(1, event.target.value);
            }}
            className={`${fieldClass} mt-2 min-w-[180px]`}
          >
            <option value="">Todas</option>
            <option value="active">Ativas</option>
            <option value="scheduled">Agendadas</option>
            <option value="expired">Expiradas</option>
            <option value="inactive">Desativadas</option>
          </select>
        </label>
        <button type="button" onClick={() => setFormOpen((open) => !open)} className={primaryButtonClass}>
          {formOpen ? 'Fechar' : 'Nova promoção'}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={onCreate} className="grid gap-5 rounded-2xl bg-[#1c1b1a] p-6 md:grid-cols-2">
          <label className="block text-sm text-[#76746a] md:col-span-2">
            Nome
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              maxLength={80}
              required
              placeholder="Ex.: Lua Cheia de outubro"
              className={`${fieldClass} mt-2`}
            />
          </label>
          <label className="block text-sm text-[#76746a] md:col-span-2">
            Texto do banner (opcional)
            <input
              value={form.bannerText}
              onChange={(event) => setForm({ ...form, bannerText: event.target.value })}
              maxLength={280}
              placeholder="Ex.: Lua Cheia — 20% até domingo"
              className={`${fieldClass} mt-2`}
            />
          </label>

          <div className="md:col-span-2">
            <p className="mb-2 text-sm text-[#76746a]">Produtos</p>
            <ProductChips value={form.products} onChange={(products) => setForm({ ...form, products })} />
          </div>

          <label className="block text-sm text-[#76746a]">
            Tipo de desconto
            <select
              value={form.discountType}
              onChange={(event) =>
                setForm({ ...form, discountType: event.target.value as 'percent' | 'fixed', discountValue: '' })
              }
              className={`${fieldClass} mt-2`}
            >
              <option value="percent">Percentual</option>
              <option value="fixed">Valor fixo (R$)</option>
            </select>
          </label>
          <label className="block text-sm text-[#76746a]">
            {form.discountType === 'percent' ? 'Percentual (1 a 100)' : 'Valor em reais'}
            <input
              value={form.discountValue}
              onChange={(event) => setForm({ ...form, discountValue: event.target.value })}
              inputMode={form.discountType === 'percent' ? 'numeric' : 'decimal'}
              required
              placeholder={form.discountType === 'percent' ? '20' : '15,00'}
              className={`${fieldClass} mt-2`}
            />
          </label>

          <label className="block text-sm text-[#76746a]">
            Início (opcional, padrão agora)
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
              className={`${fieldClass} mt-2`}
            />
          </label>
          <label className="block text-sm text-[#76746a]">
            Fim
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
              required
              className={`${fieldClass} mt-2`}
            />
          </label>

          {formError && (
            <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300 md:col-span-2" role="alert">
              {formError}
            </p>
          )}

          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving ? 'Criando…' : 'Criar promoção'}
            </button>
          </div>
        </form>
      )}

      {notice && <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300" role="status">{notice}</p>}
      {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{error}</p>}

      <div className="overflow-x-auto rounded-2xl bg-[#1c1b1a] shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <table className="w-full min-w-[860px] text-left text-sm">
          <caption className="sr-only">Promoções</caption>
          <thead className="text-[11px] uppercase tracking-[0.14em] text-[#76746a]">
            <tr>
              <th className="px-5 py-4 font-medium">Promoção</th>
              <th className="px-5 py-4 font-medium">Desconto</th>
              <th className="px-5 py-4 font-medium">Período</th>
              <th className="px-5 py-4 font-medium">Situação</th>
              <th className="px-5 py-4 text-right font-medium">Ação</th>
            </tr>
          </thead>
          <tbody>
            {loading && !result && (
              <tr><td colSpan={5} className="px-5 py-10 text-[#76746a]">Carregando promoções…</td></tr>
            )}
            {result?.promotions.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-[#76746a]">Nenhuma promoção encontrada.</td></tr>
            )}
            {result?.promotions.map((row) => (
              <tr key={row.id} className="odd:bg-white/[0.02]">
                <td className="px-5 py-4">
                  <p className="text-[#e5e2e1]">{row.name}</p>
                  <p className="mt-1 text-xs text-[#76746a]">{formatProducts(row.product_types)}</p>
                  {row.banner_text && (
                    <p className="mt-1 max-w-[280px] truncate text-xs text-[#d7c6ff]" title={row.banner_text}>
                      {row.banner_text}
                    </p>
                  )}
                </td>
                <td className="px-5 py-4 text-[#e5e2e1]">{formatDiscount(row.discount_type, row.discount_value)}</td>
                <td className="px-5 py-4 text-[#76746a]">
                  {formatDateTime(row.starts_at)}
                  <br />
                  até {formatDateTime(row.ends_at)}
                </td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs ${STATE_CLASSES[row.state]}`}>{STATE_LABELS[row.state]}</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button type="button" disabled={busyId === row.id} onClick={() => void toggle(row)} className={ghostButtonClass}>
                    {row.is_active ? 'Desativar' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager
        page={page}
        perPage={result?.per_page ?? 20}
        total={result?.total ?? 0}
        loading={loading}
        onPage={(next) => void load(next, state)}
      />
    </div>
  );
}
