export type ChatDockScreen = 'chat_questionnaire' | 'chat_suggestions' | 'chat_free_paywall';

export type DockSecondaryActionId =
  | 'summary'
  | 'restart'
  | 'other_options'
  | 'share'
  | 'redo_analysis'
  | 'free_pdf';

export type DockPrimaryActionId = 'generate_pdf' | 'download_pdf' | 'unlock_nome_social';

export type DockIconKind =
  | 'panel-right'
  | 'rotate-ccw'
  | 'sparkles'
  | 'file-down'
  | 'share'
  | 'lock-open';

export interface DockSecondarySpec {
  id: DockSecondaryActionId;
  label: string;
  icon: DockIconKind;
}

export interface DockPrimarySpec {
  id: DockPrimaryActionId;
  label: string;
  disabledLabel?: string;
  icon: DockIconKind;
  disabled: boolean;
}

export interface ChatDockLayout {
  screen: ChatDockScreen;
  /** Ações centrais (sem Resumo). */
  middleSecondaries: DockSecondarySpec[];
  /** Botão circular de PDF quando há assinatura selecionada. */
  showPdfCircle: boolean;
  /** Paywall gratuito: CTA principal Desbloquear na dock. */
  primary?: DockPrimarySpec;
}

export interface ResultadoDockLayout {
  screen: 'resultado';
  secondaries: DockSecondarySpec[];
  primary: DockPrimarySpec;
}

export type MobileDockLayout = ChatDockLayout | ResultadoDockLayout;

export interface ChatDockInput {
  birthConfirmed: boolean;
  canShowSummary: boolean;
  profileCollectionComplete: boolean;
  hasSuggestionsMessage: boolean;
  canRestart: boolean;
  canRegenerate: boolean;
  suggestionSelected: boolean;
  /** Usuário sem assinatura Nome Social, após leitura gratuita. */
  freePaywallActive?: boolean;
  /** Resumo fullscreen aberto — oculta Recomeçar na dock (após animação no UI). */
  summaryPanelOpen?: boolean;
}

export function resolveChatDockScreen(input: ChatDockInput): ChatDockScreen | null {
  if (!input.birthConfirmed || !input.canShowSummary) return null;
  if (input.freePaywallActive) {
    return 'chat_free_paywall';
  }
  if (input.profileCollectionComplete && input.hasSuggestionsMessage) {
    return 'chat_suggestions';
  }
  if (!input.profileCollectionComplete) {
    return 'chat_questionnaire';
  }
  return null;
}

export function buildChatDockLayout(screen: ChatDockScreen, input: ChatDockInput): ChatDockLayout {
  if (screen === 'chat_free_paywall') {
    return {
      screen,
      middleSecondaries: [{ id: 'free_pdf', label: 'PDF grátis', icon: 'file-down' }],
      showPdfCircle: false,
      primary: {
        id: 'unlock_nome_social',
        label: 'Desbloquear',
        icon: 'lock-open',
        disabled: false,
      },
    };
  }

  if (screen === 'chat_questionnaire') {
    const middleSecondaries: DockSecondarySpec[] = [];
    if (input.canRestart && !input.summaryPanelOpen) {
      middleSecondaries.push({ id: 'restart', label: 'Recomeçar', icon: 'rotate-ccw' });
    }
    return { screen, middleSecondaries, showPdfCircle: false };
  }

  const middleSecondaries: DockSecondarySpec[] = [];
  if (input.canRestart && !input.summaryPanelOpen) {
    middleSecondaries.push({ id: 'restart', label: 'Recomeçar', icon: 'rotate-ccw' });
  }

  return {
    screen: 'chat_suggestions',
    middleSecondaries,
    showPdfCircle: input.suggestionSelected,
  };
}

export interface ResultadoDockInput {
  canShare: boolean;
  canRedo: boolean;
  canDownloadPdf: boolean;
  isFree: boolean;
}

export function buildResultadoDockLayout(input: ResultadoDockInput): ResultadoDockLayout {
  const secondaries: DockSecondarySpec[] = [];
  if (input.canShare) {
    secondaries.push({ id: 'share', label: 'Compartilhar', icon: 'share' });
  }
  if (input.canRedo) {
    secondaries.push({ id: 'redo_analysis', label: 'Refazer análise', icon: 'rotate-ccw' });
  }

  const primary: DockPrimarySpec = input.isFree
    ? {
        id: 'unlock_nome_social',
        label: 'Desbloquear Nome Social',
        icon: 'lock-open',
        disabled: false,
      }
    : {
        id: 'download_pdf',
        label: 'Baixar PDF',
        icon: 'file-down',
        disabled: !input.canDownloadPdf,
      };

  return { screen: 'resultado', secondaries, primary };
}

/** Máximo 4 itens além do Voltar (centro + resumo + pdf). */
export function assertDockItemLimit(layout: MobileDockLayout): void {
  if (layout.screen === 'resultado') {
    const count = layout.secondaries.length + 1;
    if (count > 4) throw new Error(`Dock excede 4 itens: ${count}`);
    return;
  }
  const count =
    layout.middleSecondaries.length + (layout.showPdfCircle ? 1 : 0) + 1;
  if (count > 5) {
    throw new Error(`Dock chat excede limite de ações: ${count}`);
  }
}
