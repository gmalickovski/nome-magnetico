import React, { useCallback, useEffect, useRef, useState } from 'react';
import { opsFetch } from '../../ops/opsFetch';
import {
  formatDateTime,
  formatDiscount,
  formatProducts,
  KIND_LABELS,
  localInputToIso,
  reaisToCents,
  STATE_CLASSES,
  STATE_LABELS,
  type RegistryState,
} from '../../../shared/promo-format';
import { fieldClass, ghostButtonClass, Pager, primaryButtonClass, ProductChips } from './promo-fields';

type Kind = 'trial' | 'gift' | 'coupon';

type AccessCode = {
  id: string;
  code: string;
  kind: Kind;
  product_types: string[];
  trial_days: number | null;
  discount_type: 'percent' | 'fixed' | null;
  discount_value: number | null;
  expires_at: string | null;
  note: string | null;
  is_active: boolean;
  max_uses: number | null;
  excluded_user_ids: string[];
  new_customers_only: boolean;
  state: RegistryState;
  redemptions: number | null;
};

type ListResponse = { access_codes: AccessCode[]; total: number; page: number; per_page: number };

type Filters = { q: string; kind: string; state: string };

const EMPTY_FILTERS: Filters = { q: '', kind: '', state: '' };

type EligibilityForm = { excludedUserIds: string; newCustomersOnly: boolean };

const EMPTY_ELIGIBILITY: EligibilityForm = { excludedUserIds: '', newCustomersOnly: false };

const EMPTY_FORM = {
  code: '',
  kind: 'trial' as Kind,
  products: [] as string[],
  trialDays: '7',
  discountType: 'percent' as 'percent' | 'fixed',
  discountValue: '',
  expiresAt: '',
  note: '',
  maxUses: '',
  eligibility: EMPTY_ELIGIBILITY,
};

function eligibilityBody(form: EligibilityForm) {
  return {
    excluded_user_ids: form.excludedUserIds.split(/[\s,]+/).filter(Boolean),
    new_customers_only: form.newCustomersOnly,
  };
}

function CouponEligibilityFields({ value, onChange }: {
  value: EligibilityForm;
  onChange: (value: EligibilityForm) => void;
}) {
  return (
    <fieldset className="grid gap-3 md:col-span-2">
      <legend className="mb-2 text-sm font-medium text-[#e5e2e1]">Elegibilidade do cupom</legend>
      <label className="block text-sm text-[#e5e2e1]">
        IDs de usuários excluídos (opcional)
        <textarea
          value={value.excludedUserIds}
          onChange={(event) => onChange({ ...value, excludedUserIds: event.target.value })}
          rows={2}
          spellCheck={false}
          placeholder="UUIDs separados por vírgula ou quebra de linha"
          className={`${fieldClass} mt-2 w-full font-mono`}
        />
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm text-[#e5e2e1]">
        <input
          type="checkbox"
          checked={value.newCustomersOnly}
          onChange={(event) => onChange({ ...value, newCustomersOnly: event.target.checked })}
        />
        Somente novos clientes
      </label>
      <p className="text-sm text-[#a0a0a0]">Uma assinatura anterior sem reembolso impede o uso, mesmo após expirar.</p>
    </fieldset>
  );
}

function usesLabel(row: AccessCode): string {
  const used = row.redemptions ?? 0;
  if (row.max_uses == null) return `${used} / ∞`;
  return `${used} / ${row.max_uses}`;
}

function benefit(row: AccessCode): string {
  if (row.kind === 'coupon') return formatDiscount(row.discount_type, row.discount_value);
  return row.trial_days ? `${row.trial_days} ${row.trial_days === 1 ? 'dia' : 'dias'} de acesso` : '—';
}

export function AccessCodesPanel() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<{ id: string; code: string; eligibility: EligibilityForm } | null>(null);
  const editHeading = useRef<HTMLHeadingElement>(null);
  const editingId = editing?.id;
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async (nextPage: number, next: Filters) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(nextPage) });
    if (next.q.trim()) params.set('q', next.q.trim());
    if (next.kind) params.set('kind', next.kind);
    if (next.state) params.set('state', next.state);
    const response = await opsFetch<ListResponse>(`/api/ops/access-codes?${params.toString()}`);
    if (response.ok) {
      setResult(response.data);
      setPage(nextPage);
    } else {
      setError(response.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(1, EMPTY_FILTERS);
  }, [load]);

  useEffect(() => {
    if (editingId) editHeading.current?.focus();
  }, [editingId]);

  function onFilter(event: React.FormEvent) {
    event.preventDefault();
    setApplied(filters);
    void load(1, filters);
  }

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    setFormError('');
    setNotice('');

    const body: Record<string, unknown> = {
      code: form.code,
      kind: form.kind,
      product_types: form.products,
      note: form.note.trim() || null,
    };

    if (form.kind === 'coupon') {
      const value =
        form.discountType === 'percent' ? parseInt(form.discountValue, 10) : reaisToCents(form.discountValue);
      if (!value || value <= 0 || (form.discountType === 'percent' && value > 100)) {
        setFormError(form.discountType === 'percent' ? 'Informe um percentual de 1 a 100.' : 'Informe um valor em reais.');
        return;
      }
      body.discount_type = form.discountType;
      body.discount_value = value;
      Object.assign(body, eligibilityBody(form.eligibility));
    } else {
      const days = parseInt(form.trialDays, 10);
      if (!days || days < 1 || days > 365) {
        setFormError('Informe de 1 a 365 dias de acesso.');
        return;
      }
      body.trial_days = days;
    }

    if (form.maxUses.trim()) {
      const maxUses = parseInt(form.maxUses, 10);
      if (!maxUses || maxUses < 1) {
        setFormError('Limite de usos deve ser um número inteiro a partir de 1, ou vazio para ilimitado.');
        return;
      }
      body.max_uses = maxUses;
    }

    if (form.expiresAt) {
      const iso = localInputToIso(form.expiresAt);
      if (!iso) {
        setFormError('Validade inválida.');
        return;
      }
      body.expires_at = iso;
    }

    setSaving(true);
    const response = await opsFetch<{ access_code: AccessCode }>('/api/ops/access-codes', {
      method: 'POST',
      body,
    });
    setSaving(false);

    if (!response.ok) {
      setFormError(response.error);
      return;
    }
    setForm(EMPTY_FORM);
    setFormOpen(false);
    setNotice(`Código ${response.data.access_code.code} criado.`);
    void load(1, applied);
  }

  function editEligibility(row: AccessCode) {
    setFormOpen(false);
    setFormError('');
    setNotice('');
    setEditing({
      id: row.id,
      code: row.code,
      eligibility: {
        excludedUserIds: row.excluded_user_ids.join('\n'),
        newCustomersOnly: row.new_customers_only,
      },
    });
  }

  async function saveEligibility(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setFormError('');
    setSaving(true);
    const response = await opsFetch<{ access_code: AccessCode }>(`/api/ops/access-codes/${editing.id}`, {
      method: 'PATCH',
      body: eligibilityBody(editing.eligibility),
    });
    setSaving(false);
    if (!response.ok) {
      setFormError(response.error);
      return;
    }
    setEditing(null);
    setNotice(`Elegibilidade do cupom ${editing.code} atualizada.`);
    void load(page, applied);
  }

  async function toggle(row: AccessCode) {
    const next = !row.is_active;
    const confirmed = window.confirm(next ? `Reativar o código ${row.code}?` : `Desativar o código ${row.code}?`);
    if (!confirmed) return;

    setBusyId(row.id);
    setNotice('');
    setError('');
    const response = await opsFetch<{ access_code: AccessCode }>(`/api/ops/access-codes/${row.id}`, {
      method: 'PATCH',
      body: { is_active: next },
    });
    setBusyId('');

    if (!response.ok) {
      setError(response.error);
      return;
    }
    setNotice(next ? 'Código reativado.' : 'Código desativado.');
    void load(page, applied);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <form onSubmit={onFilter} className="flex flex-wrap items-end gap-4">
          <label className="block text-sm text-[#76746a]">
            Busca
            <input
              value={filters.q}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
              placeholder="Código ou nota"
              className={`${fieldClass} mt-2 min-w-[200px]`}
            />
          </label>
          <label className="block text-sm text-[#76746a]">
            Tipo
            <select
              value={filters.kind}
              onChange={(event) => setFilters({ ...filters, kind: event.target.value })}
              className={`${fieldClass} mt-2`}
            >
              <option value="">Todos</option>
              <option value="trial">Teste</option>
              <option value="gift">Presente</option>
              <option value="coupon">Cupom</option>
            </select>
          </label>
          <label className="block text-sm text-[#76746a]">
            Situação
            <select
              value={filters.state}
              onChange={(event) => setFilters({ ...filters, state: event.target.value })}
              className={`${fieldClass} mt-2`}
            >
              <option value="">Todas</option>
              <option value="active">Ativos</option>
              <option value="expired">Expirados</option>
              <option value="inactive">Desativados</option>
            </select>
          </label>
          <button type="submit" className={ghostButtonClass + ' py-2.5'}>Filtrar</button>
        </form>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setEditing(null);
            setFormError('');
            setFormOpen((open) => !open);
          }}
          className={primaryButtonClass}
        >
          {formOpen ? 'Fechar' : 'Novo código'}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={onCreate} className="grid gap-5 rounded-2xl bg-[#1c1b1a] p-6 md:grid-cols-2">
          <label className="block text-sm text-[#76746a]">
            Código
            <input
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
              maxLength={40}
              required
              placeholder="BEMVINDO7"
              className={`${fieldClass} mt-2 font-mono tracking-wider`}
            />
          </label>
          <label className="block text-sm text-[#76746a]">
            Tipo
            <select
              value={form.kind}
              onChange={(event) => setForm({ ...form, kind: event.target.value as Kind })}
              className={`${fieldClass} mt-2`}
            >
              <option value="trial">Teste (acesso por dias)</option>
              <option value="gift">Presente (acesso por dias)</option>
              <option value="coupon">Cupom (desconto)</option>
            </select>
          </label>

          {form.kind === 'coupon' ? (
            <>
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
            </>
          ) : (
            <label className="block text-sm text-[#76746a]">
              Dias de acesso (1 a 365)
              <input
                type="number"
                min={1}
                max={365}
                value={form.trialDays}
                onChange={(event) => setForm({ ...form, trialDays: event.target.value })}
                required
                className={`${fieldClass} mt-2`}
              />
            </label>
          )}

          <label className="block text-sm text-[#76746a]">
            Validade do código (opcional)
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
              className={`${fieldClass} mt-2`}
            />
          </label>
          <label className="block text-sm text-[#76746a]">
            Limite de usos (opcional)
            <input
              type="number"
              min={1}
              value={form.maxUses}
              onChange={(event) => setForm({ ...form, maxUses: event.target.value })}
              placeholder="Ilimitado"
              className={`${fieldClass} mt-2`}
            />
          </label>

          <div className="md:col-span-2">
            <p className="mb-2 text-sm text-[#76746a]">Produtos</p>
            <ProductChips value={form.products} onChange={(products) => setForm({ ...form, products })} />
          </div>

          <label className="block text-sm text-[#76746a] md:col-span-2">
            Nota interna (opcional)
            <input
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              maxLength={200}
              placeholder="Para que serve este código"
              className={`${fieldClass} mt-2`}
            />
          </label>

          {form.kind === 'coupon' && (
            <CouponEligibilityFields
              value={form.eligibility}
              onChange={(eligibility) => setForm({ ...form, eligibility })}
            />
          )}

          {formError && (
            <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300 md:col-span-2" role="alert">
              {formError}
            </p>
          )}

          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving ? 'Criando…' : 'Criar código'}
            </button>
          </div>
        </form>
      )}

      {editing && (
        <form onSubmit={saveEligibility} className="grid gap-5 rounded-2xl bg-[#1c1b1a] p-6">
          <h3 ref={editHeading} tabIndex={-1} className="text-base text-[#e5e2e1]">Editar cupom {editing.code}</h3>
          <CouponEligibilityFields
            value={editing.eligibility}
            onChange={(eligibility) => setEditing({ ...editing, eligibility })}
          />
          {formError && <p className="text-sm text-red-300" role="alert">{formError}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving ? 'Salvando…' : 'Salvar elegibilidade'}
            </button>
            <button type="button" disabled={saving} onClick={() => setEditing(null)} className={ghostButtonClass}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {notice && <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300" role="status">{notice}</p>}
      {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{error}</p>}

      <div className="overflow-x-auto rounded-2xl bg-[#1c1b1a] shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <table className="w-full min-w-[920px] text-left text-sm">
          <caption className="sr-only">Códigos de acesso</caption>
          <thead className="text-[11px] uppercase tracking-[0.14em] text-[#76746a]">
            <tr>
              <th className="px-5 py-4 font-medium">Código</th>
              <th className="px-5 py-4 font-medium">Tipo</th>
              <th className="px-5 py-4 font-medium">Benefício</th>
              <th className="px-5 py-4 font-medium">Validade</th>
              <th className="px-5 py-4 font-medium">Usos</th>
              <th className="px-5 py-4 font-medium">Situação</th>
              <th className="px-5 py-4 text-right font-medium">Ação</th>
            </tr>
          </thead>
          <tbody>
            {loading && !result && (
              <tr><td colSpan={7} className="px-5 py-10 text-[#76746a]">Carregando códigos…</td></tr>
            )}
            {result?.access_codes.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-[#76746a]">Nenhum código encontrado.</td></tr>
            )}
            {result?.access_codes.map((row) => (
              <tr key={row.id} className="odd:bg-white/[0.02]">
                <td className="px-5 py-4">
                  <p className="font-mono tracking-wider text-[#f2ca50]">{row.code}</p>
                  <p className="mt-1 text-xs text-[#76746a]">{formatProducts(row.product_types)}</p>
                  {row.note && <p className="mt-1 max-w-[260px] truncate text-xs text-[#76746a]" title={row.note}>{row.note}</p>}
                </td>
                <td className="px-5 py-4 text-[#e5e2e1]">{KIND_LABELS[row.kind] ?? row.kind}</td>
                <td className="px-5 py-4 text-[#e5e2e1]">
                  {benefit(row)}
                  {row.new_customers_only && <p className="mt-1 text-xs text-[#a0a0a0]">Somente novos clientes</p>}
                </td>
                <td className="px-5 py-4 text-[#76746a]">{row.expires_at ? formatDateTime(row.expires_at) : 'Sem validade'}</td>
                <td className="px-5 py-4 text-[#76746a]">{usesLabel(row)}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs ${STATE_CLASSES[row.state]}`}>{STATE_LABELS[row.state]}</span>
                </td>
                <td className="px-5 py-4 text-right">
                  {row.kind === 'coupon' && (
                    <button type="button" disabled={saving} onClick={() => editEligibility(row)} className={`${ghostButtonClass} mr-2`}>
                      Editar elegibilidade
                    </button>
                  )}
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
        onPage={(next) => void load(next, applied)}
      />
    </div>
  );
}
