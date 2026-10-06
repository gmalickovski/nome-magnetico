import { useState } from 'react';
import { AccessCodesPanel } from './AccessCodesPanel';
import { PromotionsPanel } from './PromotionsPanel';

type TabId = 'promotions' | 'codes';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'promotions', label: 'Promoções' },
  { id: 'codes', label: 'Códigos de acesso' },
];

export function PromoManager() {
  const [tab, setTab] = useState<TabId>('promotions');

  return (
    <div className="space-y-8">
      <p className="max-w-2xl text-sm leading-relaxed text-[#76746a]">
        Registro da equipe. Criar, listar e desativar acontece só aqui, pelo servidor. Esta tela não altera o checkout,
        a landing nem a cobrança.
      </p>

      <div role="tablist" aria-label="Promoções e códigos" className="flex gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-full px-5 py-2.5 text-sm transition-colors duration-700 ${
              tab === item.id ? 'bg-[#f2ca50]/15 text-[#f2ca50]' : 'text-[#e5e2e1]/80 hover:bg-white/5'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'promotions' ? <PromotionsPanel /> : <AccessCodesPanel />}
    </div>
  );
}
