import type { ReactNode } from 'react';
import { ChatOptionPills } from '../../shared/chat-ui/index.js';

/**
 * Bloco de sugestões do chat real (`SuggestionPicker`): fica direto no fluxo do chat,
 * sem balão por fora. Seção #161616 com título "Sugestões do sistema (n)", cards na largura
 * toda e o botão "Gerar outras opções" no fim.
 */
export function SuggestionsSection({
  count,
  children,
  className = '',
}: {
  count: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label="Sugestões do sistema"
      className={`w-full rounded-2xl bg-[#161616] p-4 space-y-4 ${className}`}
    >
      <h3 className="font-cinzel text-base font-bold text-gold">
        Sugestões do sistema
        <span className="ml-2 font-inter text-xs font-medium text-chat-muted">({count})</span>
      </h3>
      <div className="w-full min-w-0 flex flex-col gap-3">{children}</div>
      <ChatOptionPills
        options={[{ id: 'regen', label: 'Gerar outras opções' }]}
        size="lg"
        selectedIds={[]}
      />
    </section>
  );
}
