import { ChatScene } from '../mockups/ChatScene.js';
import type { NicheId } from './niche-types.js';

export interface NicheHeroSceneProps {
  niche: NicheId;
  srSummary: string;
}

/**
 * Seção 1 (Hero) das páginas de nicho: `DeviceFrame both` + `ChatScene` no tema do nicho.
 */
export function NicheHeroScene({ niche, srSummary }: NicheHeroSceneProps) {
  return (
    <div className="w-full min-w-0">
      <ChatScene device="both" theme={niche} srSummary={srSummary} />
    </div>
  );
}
