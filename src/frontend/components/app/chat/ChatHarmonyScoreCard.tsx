import type { ResultPanelData } from './chat-types.js';
import { ChatScorePanelCard } from '../../shared/chat-ui/ChatAnalysisPanel.js';

export interface ChatHarmonyScoreCardProps {
  birthPanel: ResultPanelData;
  harmonizedPanel?: ResultPanelData | null;
  className?: string;
}

/**
 * Painel lateral de scores — delega para o componente compartilhado `ChatScorePanelCard`.
 */
export function ChatHarmonyScoreCard({
  birthPanel,
  harmonizedPanel = null,
  className = '',
}: ChatHarmonyScoreCardProps) {
  return (
    <ChatScorePanelCard
      birth={{ nome: birthPanel.nome, score: birthPanel.score }}
      harmonized={
        harmonizedPanel
          ? { nome: harmonizedPanel.nome, score: harmonizedPanel.score }
          : null
      }
      className={className}
    />
  );
}

export default ChatHarmonyScoreCard;
