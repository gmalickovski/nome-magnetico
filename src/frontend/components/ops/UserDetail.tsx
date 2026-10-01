import React, { useEffect, useState } from 'react';
import { PRODUCT_LABELS } from '../../../shared/product-labels';

type OpsUser = {
  id: string;
  email: string;
  nome: string | null;
  phone: string | null;
  role: string;
  is_test: boolean;
  test_ends_at: string | null;
  created_at: string;
  updated_at: string | null;
  last_login_at: string | null;
  birth_name: string | null;
  birth_date: string | null;
  gender: string | null;
  email_verified_at: string | null;
  app_source: string | null;
  active_products: string[];
};

type SubscriptionRow = {
  id: string;
  product_type: string;
  payment_provider: string | null;
  amount_paid: number | null;
  currency: string | null;
  starts_at: string;
  ends_at: string;
  refunded_at: string | null;
  is_active: boolean;
  is_trial: boolean;
};

const fieldClass =
  'w-full rounded-full bg-[#0c0c0c] px-4 py-2.5 text-sm text-[#e5e2e1] outline outline-1 outline-[#d7c6ff]/15 focus:outline-[#d7c6ff]/40 disabled:opacity-50';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function formatBirth(iso: string | null): string {
  if (!iso) return '—';
  const [year, month, day] = iso.slice(0, 10).split('-');
  if (!year || !month || !day) return '—';
  return `${day}/${month}/${year}`;
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

function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function localInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function statusLabel(row: SubscriptionRow): string {
  if (row.refunded_at) return 'Reembolsada';
  if (row.is_active) return 'Ativa';
  return 'Expirada';
}

export function UserDetail({ userId }: { userId: string }) {
  const [user, setUser] = useState<OpsUser | null>(null);
  const [isSelf, setIsSelf] = useState(false);
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [isTest, setIsTest] = useState(false);
  const [endsLocal, setEndsLocal] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [userRes, subRes] = await Promise.all([
        fetch(`/api/ops/users/${userId}`, { headers: { Accept: 'application/json' } }),
        fetch(`/api/ops/subscriptions?user_id=${encodeURIComponent(userId)}&per_page=20`, { headers: { Accept: 'application/json' } }),
      ]);

      if (userRes.status === 401) {
        window.location.href = `/login?redirect=/users/${userId}`;
        return;
      }
      if (userRes.status === 403 || subRes.status === 403) {
        window.location.href = '/sem-permissao';
        return;
      }

      const userBody = await userRes.json().catch(() => null);
      if (!userRes.ok) {
        setError(userBody?.error ?? 'Erro ao carregar usuário');
        setLoading(false);
        return;
      }

      const next = userBody.user as OpsUser;
      setUser(next);
      setIsSelf(Boolean(userBody.is_self));
      setRole(next.role === 'admin' ? 'admin' : 'user');
      setIsTest(next.is_test);
      setEndsLocal(isoToLocalInput(next.test_ends_at));

      if (subRes.ok) {
        const subBody = await subRes.json().catch(() => null);
        setSubs((subBody?.subscriptions ?? []) as SubscriptionRow[]);
      } else {
        setSubs([]);
      }
    } catch {
      setError('Não foi possível carregar o usuário.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [userId]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaved('');
    setError('');

    const roleChanged = role !== (user.role === 'admin' ? 'admin' : 'user');
    if (roleChanged) {
      const nextLabel = role === 'admin' ? 'admin' : 'usuário';
      const confirmed = window.confirm(`Alterar o papel deste usuário para ${nextLabel}?`);
      if (!confirmed) return;
    }

    const endsAt = isTest ? localInputToIso(endsLocal) : null;
    if (isTest && endsLocal && !endsAt) {
      setError('Data de expiração inválida.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/ops/users/${userId}`, {
        method: 'PATCH',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          is_test: isTest,
          test_ends_at: endsAt,
        }),
      });
      if (response.status === 401) {
        window.location.href = `/login?redirect=/users/${userId}`;
        return;
      }
      if (response.status === 403) {
        window.location.href = '/sem-permissao';
        return;
      }
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? 'Erro ao salvar');
        return;
      }
      const next = body.user as OpsUser;
      setUser(next);
      setIsSelf(Boolean(body.is_self));
      setRole(next.role === 'admin' ? 'admin' : 'user');
      setIsTest(next.is_test);
      setEndsLocal(isoToLocalInput(next.test_ends_at));
      setSaved('Alterações salvas.');
    } catch {
      setError('Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[#76746a]">Carregando usuário…</p>;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error || 'Usuário não encontrado.'}</p>
        <a href="/users" className="inline-flex text-sm text-[#f2ca50]">Voltar para usuários</a>
      </div>
    );
  }

  const facts: Array<[string, string]> = [
    ['Email', user.email],
    ['Nome', user.nome || '—'],
    ['Telefone', user.phone || '—'],
    ['Nome de nascimento', user.birth_name || '—'],
    ['Nascimento', formatBirth(user.birth_date)],
    ['Gênero', user.gender || '—'],
    ['Email confirmado', user.email_verified_at ? formatDate(user.email_verified_at) : 'Pendente'],
    ['Último acesso', formatDate(user.last_login_at)],
    ['Cadastro', formatDate(user.created_at)],
    ['Origem', user.app_source || '—'],
  ];

  return (
    <div className="space-y-8">
      <a href="/users" className="inline-flex text-sm text-[#d7c6ff] transition-colors duration-700 hover:text-[#f2ca50]">
        Voltar para usuários
      </a>

      <section className="rounded-2xl bg-[#1c1b1a] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <h2 className="font-cinzel text-xl text-[#e5e2e1]">{user.nome || user.email}</h2>
        <p className="mt-2 text-sm text-[#76746a]">{user.email}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {user.active_products.length === 0 && <span className="text-sm text-[#76746a]">Sem produto ativo</span>}
          {user.active_products.map((product) => (
            <span key={product} className="rounded-full bg-[#d7c6ff]/10 px-3 py-1 text-xs text-[#d7c6ff]">
              {PRODUCT_LABELS[product] ?? product}
            </span>
          ))}
        </div>
        <dl className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-[#76746a]">{label}</dt>
              <dd className="mt-1 text-sm text-[#e5e2e1]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <form onSubmit={onSubmit} className="space-y-6 rounded-2xl bg-[#1c1b1a] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <div>
          <h2 className="font-cinzel text-xl text-[#e5e2e1]">Acesso</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#76746a]">
            Papel e acesso teste. Com teste ligado e sem assinatura trial por produto, o acesso vale para a conta inteira até a data abaixo. Sem data, o teste não expira.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-[#76746a]">
            Papel
            <select
              value={role}
              disabled={isSelf || saving}
              onChange={(event) => setRole(event.target.value === 'admin' ? 'admin' : 'user')}
              className={`${fieldClass} mt-2`}
            >
              <option value="user">Usuário</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="block text-sm text-[#76746a]">
            Acesso teste
            <select
              value={isTest ? 'true' : 'false'}
              disabled={saving}
              onChange={(event) => setIsTest(event.target.value === 'true')}
              className={`${fieldClass} mt-2`}
            >
              <option value="false">Desligado</option>
              <option value="true">Ligado</option>
            </select>
          </label>
          <label className="block text-sm text-[#76746a] md:col-span-2">
            Teste expira em
            <input
              type="datetime-local"
              value={isTest ? endsLocal : ''}
              disabled={!isTest || saving}
              onChange={(event) => setEndsLocal(event.target.value)}
              className={`${fieldClass} mt-2`}
            />
          </label>
        </div>

        {isSelf && (
          <p className="text-sm text-[#76746a]">O papel da própria conta fica bloqueado para não tirar o acesso da equipe.</p>
        )}
        {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
        {saved && <p className="rounded-2xl bg-[#f2ca50]/10 px-4 py-3 text-sm text-[#f2ca50]">{saved}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[#f2ca50] px-6 py-2.5 text-sm font-medium text-[#131313] shadow-[0_0_24px_rgba(242,202,80,0.18)] transition-colors duration-700 hover:bg-[#d4af37] disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar acesso'}
        </button>
      </form>

      <section className="overflow-x-auto rounded-2xl bg-[#1c1b1a] shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between gap-4 px-5 py-5">
          <h2 className="font-cinzel text-xl text-[#e5e2e1]">Assinaturas</h2>
          <a href={`/subscriptions?q=${encodeURIComponent(user.email)}`} className="text-sm text-[#d7c6ff]">
            Ver na lista
          </a>
        </div>
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Assinaturas deste usuário</caption>
          <thead className="text-[11px] uppercase tracking-[0.14em] text-[#76746a]">
            <tr>
              <th className="px-5 py-3 font-medium">Produto</th>
              <th className="px-5 py-3 font-medium">Situação</th>
              <th className="px-5 py-3 font-medium">Origem</th>
              <th className="px-5 py-3 font-medium">Valor</th>
              <th className="px-5 py-3 font-medium">Até</th>
            </tr>
          </thead>
          <tbody>
            {subs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-[#76746a]">Nenhuma assinatura.</td>
              </tr>
            )}
            {subs.map((row) => (
              <tr key={row.id} className="odd:bg-white/[0.02]">
                <td className="px-5 py-4 text-[#e5e2e1]">{PRODUCT_LABELS[row.product_type] ?? row.product_type}</td>
                <td className="px-5 py-4 text-[#e5e2e1]">{statusLabel(row)}</td>
                <td className="px-5 py-4 text-[#e5e2e1]">
                  {row.is_trial ? 'Teste' : row.payment_provider === 'asaas' ? 'Asaas' : 'Stripe'}
                </td>
                <td className="px-5 py-4 text-[#e5e2e1]">{formatMoney(row.amount_paid, row.currency)}</td>
                <td className="px-5 py-4 text-[#76746a]">{formatDate(row.ends_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
