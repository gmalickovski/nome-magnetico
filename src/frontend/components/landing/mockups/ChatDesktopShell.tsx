import type { ReactNode } from 'react';
import { ChatProgressBar } from '../../shared/chat-ui/index.js';
import { AnalysisPanelAside } from './AnalysisPanelMock.js';
import { ScaledMockupCanvas } from './ScaledMockupCanvas.js';
import type { MockupTheme } from './types.js';

/**
 * Casca desktop ÚNICA de todos os mockups de chat: barra de progresso, chat à esquerda
 * (começa no topo) e Painel de análise à direita, na posição real do sistema.
 * No modo `both` o celular fica por cima e corta o painel, como no desktop real.
 * Cada cena só muda a animação (`children`) e os dados.
 */
export function ChatDesktopShell({
  stepIndex,
  theme,
  dual,
  children,
}: {
  stepIndex: number;
  theme: MockupTheme;
  dual: boolean;
  children: ReactNode;
}) {
  return (
    <ScaledMockupCanvas logicalWidth={1180}>
      <div className="flex flex-col flex-1 min-h-0 bg-[#131313]">
        <ChatProgressBar
          currentStep={stepIndex}
          totalSteps={4}
          className="shrink-0 bg-dark-deeper/95 backdrop-blur-md border-b border-white/5"
        />
        <div className="flex-1 min-h-0 grid grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)] gap-4 px-5">
          <div className="flex flex-col min-h-0 min-w-0">{children}</div>
          <AnalysisPanelAside theme={theme} dual={dual} />
        </div>
      </div>
    </ScaledMockupCanvas>
  );
}
