export type MobileDockScreen = 'questionnaire' | 'suggestions' | 'result';

export type MobileDockActionId =
  | 'summary'
  | 'restart'
  | 'regenerate'
  | 'pdf'
  | 'share';

export interface MobileDockActionSpec {
  id: MobileDockActionId;
  label: string;
  icon: 'panel-right' | 'rotate-ccw' | 'sparkles' | 'file-down' | 'share';
}

export interface MobileDockScreenInput {
  birthConfirmed: boolean;
  profileCollectionComplete: boolean;
  hasSuggestionsMessage: boolean;
  activeSuggestionId: string | null;
  canShowSummary: boolean;
  canRestart: boolean;
  canRegenerate: boolean;
  canPdf: boolean;
  canShare: boolean;
}

export function resolveMobileDockScreen(input: MobileDockScreenInput): MobileDockScreen | null {
  if (!input.birthConfirmed || !input.canShowSummary) return null;
  if (!input.profileCollectionComplete) return 'questionnaire';
  if (input.activeSuggestionId) return 'result';
  if (input.hasSuggestionsMessage) return 'suggestions';
  return 'questionnaire';
}

export function buildMobileDockActions(
  screen: MobileDockScreen,
  input: MobileDockScreenInput
): MobileDockActionSpec[] {
  const actions: MobileDockActionSpec[] = [];

  if (screen === 'questionnaire') {
    actions.push({ id: 'summary', label: 'Resumo', icon: 'panel-right' });
    if (input.canRestart) {
      actions.push({ id: 'restart', label: 'Recomeçar', icon: 'rotate-ccw' });
    }
    return actions;
  }

  if (screen === 'suggestions') {
    actions.push({ id: 'summary', label: 'Resumo', icon: 'panel-right' });
    if (input.canRegenerate) {
      actions.push({ id: 'regenerate', label: 'Gerar outras', icon: 'sparkles' });
    }
    if (input.canPdf) {
      actions.push({ id: 'pdf', label: 'PDF', icon: 'file-down' });
    }
    return actions;
  }

  actions.push({ id: 'summary', label: 'Resumo', icon: 'panel-right' });
  if (input.canPdf) {
    actions.push({ id: 'pdf', label: 'PDF', icon: 'file-down' });
  }
  if (input.canShare) {
    actions.push({ id: 'share', label: 'Compartilhar', icon: 'share' });
  }
  return actions;
}
