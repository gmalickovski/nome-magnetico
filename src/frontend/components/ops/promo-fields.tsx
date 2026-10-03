import { PRODUCT_LABELS, PRODUCT_TYPES } from '../../../shared/product-labels';

export const fieldClass =
  'w-full rounded-full bg-[#0c0c0c] px-4 py-2.5 text-sm text-[#e5e2e1] outline outline-1 outline-[#d7c6ff]/15 placeholder:text-[#76746a] focus:outline-[#d7c6ff]/40 disabled:opacity-50';

export const primaryButtonClass =
  'rounded-full bg-[#f2ca50] px-6 py-2.5 text-sm font-medium text-[#131313] shadow-[0_0_24px_rgba(242,202,80,0.18)] transition-colors duration-700 hover:bg-[#d4af37] disabled:opacity-50';

export const ghostButtonClass =
  'rounded-full bg-white/5 px-4 py-2 text-xs text-[#e5e2e1] transition-colors duration-700 hover:bg-white/10 disabled:opacity-50';

export function ProductChips({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(type: string) {
    onChange(value.includes(type) ? value.filter((item) => item !== type) : [...value, type]);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Produtos">
        {PRODUCT_TYPES.map((type) => {
          const selected = value.includes(type);
          return (
            <button
              key={type}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(type)}
              className={`rounded-full px-4 py-2 text-sm transition-colors duration-700 ${
                selected
                  ? 'bg-gradient-to-r from-[#bea5ff]/30 to-[#d7c6ff]/20 text-[#d7c6ff]'
                  : 'bg-[#0c0c0c] text-[#76746a] hover:text-[#e5e2e1]'
              }`}
            >
              {PRODUCT_LABELS[type]}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-[#76746a]">Sem seleção, vale para todos os produtos.</p>
    </div>
  );
}

export function Pager({
  page,
  perPage,
  total,
  loading,
  onPage,
}: {
  page: number;
  perPage: number;
  total: number;
  loading: boolean;
  onPage: (next: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex items-center justify-between gap-4 text-sm text-[#76746a]">
      <p>{total > 0 ? `${from}–${to} de ${total}` : ' '}</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => onPage(page - 1)}
          className="rounded-full bg-[#1c1b1a] px-4 py-2 text-[#e5e2e1] disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={page * perPage >= total || loading}
          onClick={() => onPage(page + 1)}
          className="rounded-full bg-[#1c1b1a] px-4 py-2 text-[#e5e2e1] disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
