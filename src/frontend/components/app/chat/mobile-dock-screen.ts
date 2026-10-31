export type ChatDockScreen = 'chat_questionnaire' | 'chat_suggestions';

export type DockSecondaryActionId = 'summary' | 'restart' | 'other_options' | 'share' | 'redo_analysis';

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
  secondaries: DockSecondarySpec[];
  primary: DockPrimarySpec | null;
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
  hasAnalysisId: boolean;
  suggestionSelected: boolean;
}

export function resolveChatDockScreen(input: ChatDockInput): ChatDockScreen | null {
  if (!input.birthConfirmed || !input.canShowSummary) return null;
  if (input.profileCollectionComplete && input.hasSuggestionsMessage) {
    return 'chat_suggestions';
  }
  if (!input.profileCollectionComplete) {
    return 'chat_questionnaire';
  }
  return null;
}

export function buildChatDockLayout(screen: ChatDockScreen, input: ChatDockInput): ChatDockLayout {
  if (screen === 'chat_questionnaire') {
    const secondaries: DockSecondarySpec[] = [{ id: 'summary', label: 'Resumo', icon: 'panel-right' }];
    if (input.canRestart) {
      secondaries.push({ id: 'restart', label: 'Recomeçar', icon: 'rotate-ccw' });
    }
    return { screen, secondaries, primary: null };
  }

  const secondaries: DockSecondarySpec[] = [{ id: 'summary', label: 'Resumo', icon: 'panel-right' }];
  if (input.canRegenerate) {
    secondaries.push({ id: 'other_options', label: 'Outras opções', icon: 'sparkles' });
  }

  let primary: DockPrimarySpec | null = null;
  if (input.hasAnalysisId) {
    primary = {
      id: 'generate_pdf',
      label: 'Gerar PDF',
      disabledLabel: 'Escolha um nome',
      icon: 'file-down',
      disabled: !input.suggestionSelected,
    };
  }

  return { screen: 'chat_suggestions', secondaries, primary };
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

/** Máximo 4 itens além do Voltar (secundários + primária). */
export function assertDockItemLimit(layout: MobileDockLayout): void {
  const count = layout.secondaries.length + (layout.primary ? 1 : 0);
  if (count > 4) {
    throw new Error(`Dock excede 4 itens: ${count}`);
  }
}
