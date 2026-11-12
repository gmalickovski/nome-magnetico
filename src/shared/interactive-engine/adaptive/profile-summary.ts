/**
 * Resumo editável: preferência declarada vs inferência incerta (mínimo de dados).
 */

import type { AdaptiveInterviewRequest } from './schemas';

export interface ProfileSummaryBlock {
  id: string;
  kind: 'declared' | 'inferred';
  title: string;
  body: string;
  sourceRef: string;
  editable: boolean;
}

export interface ProfileSummaryPayload {
  blocks: ProfileSummaryBlock[];
  numerologyNote?: string;
  confirmed: boolean;
}

function declaredLine(stepId: string, text: string): ProfileSummaryBlock {
  return {
    id: `declared_${stepId}`,
    kind: 'declared',
    title: 'O que você nos disse',
    body: text,
    sourceRef: stepId,
    editable: true,
  };
}

function inferredLine(id: string, body: string, sourceRef: string): ProfileSummaryBlock {
  return {
    id,
    kind: 'inferred',
    title: 'O que entendemos (confira se está certo)',
    body,
    sourceRef,
    editable: true,
  };
}

/** Monta resumo a partir só das respostas e snapshot numérico (sem texto livre inventado). */
export function buildProfileSummary(req: AdaptiveInterviewRequest): ProfileSummaryPayload {
  const blocks: ProfileSummaryBlock[] = [];

  for (const a of req.answers) {
    const text = [a.optionIds?.join(' · '), a.freeText?.trim()].filter(Boolean).join(' — ');
    if (!text) continue;
    blocks.push(declaredLine(a.stepId, text));
  }

  const area = req.answers.find((a) => a.stepId === 'area_foco');
  const areaRaw = area?.optionIds?.[0] ?? area?.freeText;
  if (areaRaw && !area?.freeText) {
    blocks.push(
      inferredLine(
        'inferred_foco',
        `Prioridade de momento alinhada à opção "${areaRaw}".`,
        'area_foco:option'
      )
    );
  }

  const relacao = req.answers.find((a) => a.stepId === 'relacao_nome');
  if (relacao?.optionIds?.[0] === 'falta_algo') {
    blocks.push(
      inferredLine(
        'inferred_identidade',
        'Há espaço para a assinatura expressar melhor quem você é hoje.',
        'relacao_nome:falta_algo'
      )
    );
  }

  if (req.profileEdits) {
    for (const [id, body] of Object.entries(req.profileEdits)) {
      const idx = blocks.findIndex((b) => b.id === id);
      if (idx >= 0) blocks[idx] = { ...blocks[idx]!, body };
    }
  }

  const numerologyNote = req.numerologySnapshot
    ? `Seu ponto de partida: Destino ${req.numerologySnapshot.destino}, nota ${Math.round(req.numerologySnapshot.notaHoje)}.`
    : undefined;

  return {
    blocks: blocks.slice(0, 8),
    numerologyNote,
    confirmed: Boolean(req.profileConfirmed),
  };
}
