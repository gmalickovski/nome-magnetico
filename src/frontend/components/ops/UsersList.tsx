import React, { useEffect, useState } from 'react';

type OpsUser = {
  id: string;
  email: string;
  nome: string | null;
  role: string;
  is_test: boolean;
  test_ends_at: string | null;
  created_at: string;
  active_products: string[];
};

type ListResponse = {
  users: OpsUser[];
  total: number;
  page: number;
  per_page: number;
};

const PRODUCT_LABELS: Record<string, string> = {
  nome_social: 'Nome Social',
  nome_bebe: 'Bebê',
  nome_empresa: 'Empresa',
};

const fieldClass =
  'w-full rounded-full bg-[#0c0c0c] px-4 py-2.5 text-sm text-[#e5e2e1] outline outline-1 outline-[#d7c6ff]/15 placeholder:text-[#76746a] focus:outline-[#d7c6ff]/40';

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
}

function testLabel(user: OpsUser): string | null {
  if (!user.is_test) return null;
  if (user.test_ends_at && new Date(user.test_ends_at).getTime() <= Date.now()) return 'Teste expirado';
  return 'Teste';
}

export function UsersList() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [isTest, setIsTest] = useState('');
  const [applied, setApplied] = useState({ q: '', role: '', isTest: '' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ListResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function load(nextPage: number, filters: { q: string; role: string; isTest: string }) {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (filters.q.trim()) params.set('q', filters.q.trim());
    if (filters.role) params.set('role', filters.role);
    if (filters.isTest) params.set('is_test', filters.isTest);
    params.set('page', String(nextPage));

    try {
      const response = await fetch(`/api/ops/users?${params.toString()}`, { headers: { Accept: 'application/json' } });
      if (response.status === 401) {
        window.location.href = '/login?redirect=/users';
        return;
      }
      if (response.status === 403) {
        window.location.href = '/sem-permissao';
        return;
      }
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? 'Erro ao listar usuários');
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
    void load(1, { q: '', role: '', isTest: '' });
  }, []);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next = { q, role, isTest };
    setApplied(next);
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
      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl bg-[#1c1b1a] p-5 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto] md:items-end">
        <label className="block text-sm text-[#76746a]">
          Busca
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Email ou nome"
            className={`${fieldClass} mt-2`}
          />
        </label>
        <label className="block text-sm text-[#76746a]">
          Papel
          <select value={role} onChange={(event) => setRole(event.target.value)} className={`${fieldClass} mt-2`}>
            <option value="">Todos</option>
            <option value="admin">Admin</option>
            <option value="user">Usuário</option>
          </select>
        </label>
        <label className="block text-sm text-[#76746a]">
          Acesso teste
          <select value={isTest} onChange={(event) => setIsTest(event.target.value)} className={`${fieldClass} mt-2`}>
            <option value="">Todos</option>
            <option value="true">Só teste</option>
            <option value="false">Sem teste</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-[#f2ca50] px-6 py-2.5 text-sm font-medium text-[#131313] shadow-[0_0_24px_rgba(242,202,80,0.18)] transition-colors duration-700 hover:bg-[#d4af37]"
        >
          Filtrar
        </button>
      </form>

      {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="overflow-x-auto rounded-2xl bg-[#1c1b1a] shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">Usuários do Nome Magnético</caption>
          <thead className="text-[11px] uppercase tracking-[0.14em] text-[#76746a]">
            <tr>
              <th className="px-5 py-4 font-medium">Email</th>
              <th className="px-5 py-4 font-medium">Nome</th>
              <th className="px-5 py-4 font-medium">Papel</th>
              <th className="px-5 py-4 font-medium">Teste</th>
              <th className="px-5 py-4 font-medium">Produtos ativos</th>
              <th className="px-5 py-4 font-medium">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {loading && !loaded && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-[#76746a]">Carregando usuários…</td>
              </tr>
            )}
            {loaded && result?.users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-[#76746a]">Nenhum usuário encontrado.</td>
              </tr>
            )}
            {result?.users.map((user) => {
              const trial = testLabel(user);
              return (
                <tr key={user.id} className="odd:bg-white/[0.02]">
                  <td className="px-5 py-4 text-[#e5e2e1]">{user.email}</td>
                  <td className="px-5 py-4 text-[#e5e2e1]">{user.nome || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs ${user.role === 'admin' ? 'bg-[#f2ca50]/15 text-[#f2ca50]' : 'bg-white/5 text-[#76746a]'}`}>
                      {user.role === 'admin' ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#e5e2e1]">{trial ?? '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.active_products.length === 0 && <span className="text-[#76746a]">—</span>}
                      {user.active_products.map((product) => (
                        <span key={product} className="rounded-full bg-[#d7c6ff]/10 px-3 py-1 text-xs text-[#d7c6ff]">
                          {PRODUCT_LABELS[product] ?? product}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#76746a]">{formatDate(user.created_at)}</td>
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
