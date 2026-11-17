/**
 * Classes dos controles compartilhados (DEV-309): botões e campo no mesmo vocabulário do `Button` e do
 * `Input` de `ui/` (dourado #D4AF37, pill, sem borda para seccionar). O admin usa estas classes em
 * formulários nativos; o `/app` usa os componentes React equivalentes.
 */
export const fieldClass =
  'w-full rounded-full bg-[#0c0c0c] px-4 py-2.5 text-sm text-[#e5e2e1] outline outline-1 outline-[#d7c6ff]/15 placeholder:text-[#76746a] transition-colors duration-300 hover:outline-[#d7c6ff]/30 focus:outline-[#d7c6ff]/40 disabled:opacity-50';

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-2.5 text-sm font-medium text-[#1A1A1A] transition-all duration-300 hover:scale-[1.02] hover:bg-[#f2ca50] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100';

export const ghostButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs text-[#e5e2e1] transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100';
