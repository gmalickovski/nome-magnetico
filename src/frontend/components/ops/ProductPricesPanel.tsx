import { useCallback, useEffect, useState } from 'react';
import { opsFetch } from '../../ops/opsFetch';

import { formatBRLFromCents } from '../../../shared/format-brl-cents';

interface PriceRow {
  product_type: string;
  base_cents: number;
  min_cents: number;
  label: string;
  effective_preview?: {
    base_cents: number;
    final_cents: number;
    formatted: string;
    validUntilLabel?: string | null;
    hasDiscount?: boolean;
  };
}

export function ProductPricesPanel() {
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, { base: string; min: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await opsFetch<{ prices?: PriceRow[] }>('/api/ops/product-prices');
      if (!res.ok) throw new Error(res.error);
      setRows(res.data.prices ?? []);
      const next: Record<string, { base: string; min: string }> = {};
      for (const row of res.data.prices ?? []) {
        next[row.product_type] = {
          base: String(row.base_cents / 100),
          min: String(row.min_cents / 100),
        };
      }
      setDraft(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar preços');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(productType: string) {
    const d = draft[productType];
    if (!d) return;
    const baseCents = Math.round(Number(d.base.replace(',', '.')) * 100);
    const minCents = Math.round(Number(d.min.replace(',', '.')) * 100);
    if (!Number.isFinite(baseCents) || !Number.isFinite(minCents) || baseCents <= 0 || minCents <= 0) {
      setError('Informe valores válidos em reais.');
      return;
    }
    if (minCents > baseCents) {
      setError('O piso não pode ser maior que o preço base.');
      return;
    }

    setSaving(productType);
    setError('');
    try {
      const res = await opsFetch<{ error?: string }>('/api/ops/product-prices', {
        method: 'PATCH',
        body: {
          product_type: productType,
          base_cents: baseCents,
          min_cents: minCents,
        },
      });
      if (!res.ok) throw new Error(res.error);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-[#76746a]">Carregando preços…</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#76746a] max-w-2xl">
        Preço base e piso por produto. O site e o checkout usam estes valores; promoções e cupons não
        podem ficar abaixo do piso.
      </p>
      {error ? (
        <p className="text-sm text-red-400/90" role="alert">
          {error}
        </p>
      ) : null}

      <div className="space-y-5">
        {rows.map((row) => {
          const d = draft[row.product_type] ?? { base: '', min: '' };
          const preview = row.effective_preview;
          return (
            <div
              key={row.product_type}
              className="rounded-2xl bg-[#1a1a1a]/80 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-cinzel text-lg text-[#f2ca50]">{row.label}</h3>
                <span className="text-xs uppercase tracking-widest text-[#76746a]">{row.product_type}</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-[#e5e2e1]">
                  Preço base (R$)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={d.base}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [row.product_type]: { ...d, base: e.target.value },
                      }))
                    }
                    className="mt-2 w-full rounded-xl bg-[#131313] px-4 py-3 text-[#e5e2e1] outline outline-[#bea5ff]/15 focus:outline-[#bea5ff]/40"
                  />
                </label>
                <label className="block text-sm text-[#e5e2e1]">
                  Piso mínimo (R$)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={d.min}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [row.product_type]: { ...d, min: e.target.value },
                      }))
                    }
                    className="mt-2 w-full rounded-xl bg-[#131313] px-4 py-3 text-[#e5e2e1] outline outline-[#bea5ff]/15 focus:outline-[#bea5ff]/40"
                  />
                </label>
              </div>

              {preview ? (
                <p className="text-sm text-[#76746a]">
                  Pré-visualização efetiva agora:{' '}
                  <span className="text-[#f2ca50] font-medium">{preview.formatted}</span>
                  {preview.hasDiscount && preview.validUntilLabel ? (
                    <span className="ml-2 text-[#d7c6ff]">({preview.validUntilLabel})</span>
                  ) : null}
                  <span className="block text-xs mt-1">
                    Base {formatBRL(preview.base_cents)} → cobrança {formatBRL(preview.final_cents)}
                  </span>
                </p>
              ) : null}

              <button
                type="button"
                disabled={saving === row.product_type}
                onClick={() => void save(row.product_type)}
                className="rounded-full bg-[#f2ca50]/15 px-5 py-2.5 text-sm font-medium text-[#f2ca50] hover:bg-[#f2ca50]/25 disabled:opacity-50"
              >
                {saving === row.product_type ? 'Salvando…' : 'Salvar preços'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
