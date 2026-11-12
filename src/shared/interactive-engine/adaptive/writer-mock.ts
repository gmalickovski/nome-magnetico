/**
 * LLM escritor mock: redige copy a partir de evidências (sem chamada externa).
 */

import type { QuestionnaireStepId } from '../questionnaire-adaptive';
import { getQuestionSpec } from '../questionnaire-adaptive';
import type { JevTypedMockDecision } from './jev-typed-mock';
import type { AdaptiveInterviewRequest } from './schemas';

export interface WriterMockOutput {
  providerUsed: 'llm-writer-mock';
  prompt: string;
  explanation?: string;
  evidenceRefs: string[];
}

function evidenceFromAnswers(req: AdaptiveInterviewRequest): string[] {
  return req.answers.map((a) => {
    const opts = a.optionIds?.join(', ') ?? '';
    const txt = a.freeText?.trim() ?? '';
    return [a.stepId, opts, txt].filter(Boolean).join(': ');
  });
}

export function writeQuestionMock(
  req: AdaptiveInterviewRequest,
  decision: JevTypedMockDecision
): WriterMockOutput {
  const stepId = decision.nextStepId;
  if (stepId === 'resumo_perfil' || stepId === 'fim_coleta') {
    return {
      providerUsed: 'llm-writer-mock',
      prompt: 'Revise o resumo abaixo e confirme ou ajuste antes de ver as sugestões.',
      evidenceRefs: evidenceFromAnswers(req),
    };
  }

  const spec = getQuestionSpec(stepId as QuestionnaireStepId, {
    nomeCompleto: req.nomeCompleto,
    sobrenomes: [],
    areaFoco: null,
  });

  let prompt = spec.prompt;
  if (decision.interviewLine === 'contradicao' && decision.contradiction) {
    prompt = `Antes você indicou "${decision.contradiction.prior}" e agora "${decision.contradiction.current}". Qual vale para seguir?`;
  } else if (decision.needsClarification) {
    prompt = `${spec.prompt} (Pode detalhar um pouco mais para eu afinar as sugestões.)`;
  }

  const nums = req.numerologySnapshot;
  const explanation =
    nums && decision.interviewLine === 'objetivos'
      ? `Seu ponto de partida numérico: Destino ${nums.destino}, nota atual ${Math.round(nums.notaHoje)}.`
      : undefined;

  return {
    providerUsed: 'llm-writer-mock',
    prompt,
    explanation,
    evidenceRefs: evidenceFromAnswers(req),
  };
}
