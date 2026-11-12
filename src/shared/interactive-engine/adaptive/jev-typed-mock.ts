/**
 * Decisões tipadas JEV (Choice / Noul / Score) — somente mock, sem rede.
 */

import { CHOICE_MIN, NOUL_NO, NOUL_YES } from '../thresholds';
import type { AreaFocoNomeMagnetico } from '../copy';
import type { QuestionnaireStepId } from '../questionnaire-adaptive';
import { QUESTIONNAIRE_STEP_ORDER } from '../questionnaire-adaptive';
import { STEP_TO_INTERVIEW_LINE } from './interview-lines';
import type { AdaptiveAnswer, AdaptiveInterviewRequest, InterviewLine } from './schemas';

export interface JevTypedMockDecision {
  providerUsed: 'jev-typed-mock';
  providerPath: string[];
  nextStepId: QuestionnaireStepId | 'resumo_perfil' | 'fim_coleta';
  interviewLine: InterviewLine;
  choice: { stepId: QuestionnaireStepId; confidence: number };
  noulAprofundar: number;
  noulNenhumaOpcao: number;
  scores: Record<InterviewLine, number>;
  needsClarification: boolean;
  contradiction?: { stepId: QuestionnaireStepId; prior: string; current: string };
}

function answerForStep(answers: AdaptiveAnswer[], stepId: QuestionnaireStepId): AdaptiveAnswer | undefined {
  return answers.filter((a) => a.stepId === stepId).at(-1);
}

function summarizeAnswer(a: AdaptiveAnswer | undefined): string {
  if (!a) return '';
  const parts = [...(a.optionIds ?? []), a.freeText ?? ''].filter(Boolean);
  return parts.join('|').toLowerCase();
}

function inferAreaFromAnswers(answers: AdaptiveAnswer[]): AreaFocoNomeMagnetico {
  const area = answerForStep(answers, 'area_foco');
  const raw = area?.optionIds?.[0] ?? area?.freeText ?? '';
  const allowed: AreaFocoNomeMagnetico[] = [
    'prosperidade_financeira',
    'carreira_negocios',
    'relacionamentos_harmonia',
    'autoestima_expressao',
  ];
  if (allowed.includes(raw as AreaFocoNomeMagnetico)) return raw as AreaFocoNomeMagnetico;
  return 'carreira_negocios';
}

function scoreLine(line: InterviewLine, answers: AdaptiveAnswer[]): number {
  const steps = (Object.entries(STEP_TO_INTERVIEW_LINE) as [QuestionnaireStepId, InterviewLine][])
    .filter(([, l]) => l === line)
    .map(([s]) => s);
  const filled = steps.filter((s) => Boolean(answerForStep(answers, s)));
  if (filled.length === 0) return 0.15;
  return Math.min(1, 0.35 + filled.length * 0.22);
}

function detectContradiction(
  answers: AdaptiveAnswer[],
  correctStepId?: QuestionnaireStepId
): JevTypedMockDecision['contradiction'] | undefined {
  if (!correctStepId) return undefined;
  const same = answers.filter((a) => a.stepId === correctStepId);
  if (same.length < 2) return undefined;
  const prior = summarizeAnswer(same[same.length - 2]);
  const current = summarizeAnswer(same[same.length - 1]);
  if (!prior || !current || prior === current) return undefined;
  return { stepId: correctStepId, prior, current };
}

function nextMissingStep(answers: AdaptiveAnswer[]): QuestionnaireStepId | null {
  for (const stepId of QUESTIONNAIRE_STEP_ORDER) {
    if (!answerForStep(answers, stepId)) return stepId;
  }
  return null;
}

/**
 * Motor mock: escolhe próximo passo, sinaliza aprofundamento e scores por dimensão.
 */
export function runJevTypedMockDecision(req: AdaptiveInterviewRequest): JevTypedMockDecision {
  const providerPath = ['jev-typed-mock', 'no-external-provider'];
  const answers = req.answers;
  const contradiction = detectContradiction(
    answers,
    req.correctStepId as QuestionnaireStepId | undefined
  );

  if (contradiction) {
    return {
      providerUsed: 'jev-typed-mock',
      providerPath: [...providerPath, 'branch:contradicao'],
      nextStepId: contradiction.stepId,
      interviewLine: 'contradicao',
      choice: { stepId: contradiction.stepId, confidence: 0.9 },
      noulAprofundar: NOUL_YES,
      noulNenhumaOpcao: NOUL_NO,
      scores: {
        objetivos: scoreLine('objetivos', answers),
        uso: scoreLine('uso', answers),
        identidade: scoreLine('identidade', answers),
        sobrenomes: scoreLine('sobrenomes', answers),
        tolerancia_mudanca: scoreLine('tolerancia_mudanca', answers),
        contradicao: 1,
      },
      needsClarification: true,
      contradiction,
    };
  }

  const missing = nextMissingStep(answers);
  if (!missing) {
    return {
      providerUsed: 'jev-typed-mock',
      providerPath: [...providerPath, 'branch:resumo'],
      nextStepId: req.profileConfirmed ? 'fim_coleta' : 'resumo_perfil',
      interviewLine: 'objetivos',
      choice: { stepId: 'area_foco', confidence: 1 },
      noulAprofundar: NOUL_NO,
      noulNenhumaOpcao: NOUL_NO,
      scores: {
        objetivos: scoreLine('objetivos', answers),
        uso: scoreLine('uso', answers),
        identidade: scoreLine('identidade', answers),
        sobrenomes: scoreLine('sobrenomes', answers),
        tolerancia_mudanca: scoreLine('tolerancia_mudanca', answers),
        contradicao: 0,
      },
      needsClarification: false,
    };
  }

  const line = STEP_TO_INTERVIEW_LINE[missing];
  const last = answerForStep(answers, missing);
  const ambiguous =
    (last?.freeText?.trim().length ?? 0) > 0 &&
    (last?.freeText?.trim().length ?? 0) < 4 &&
    !(last?.optionIds?.length);
  const noulAprofundar = ambiguous ? NOUL_YES : NOUL_NO;
  const confidence = ambiguous ? CHOICE_MIN - 0.05 : 0.78;
  const needsClarification = ambiguous || confidence < CHOICE_MIN;

  const scores: Record<InterviewLine, number> = {
    objetivos: scoreLine('objetivos', answers),
    uso: scoreLine('uso', answers),
    identidade: scoreLine('identidade', answers),
    sobrenomes: scoreLine('sobrenomes', answers),
    tolerancia_mudanca: scoreLine('tolerancia_mudanca', answers),
    contradicao: 0,
  };

  // Score de aderência: reforça dimensão alinhada à área quando já escolhida
  const area = inferAreaFromAnswers(answers);
  if (area === 'prosperidade_financeira') scores.objetivos = Math.max(scores.objetivos, 0.55);
  if (missing === 'sobrenomes_uso' && scores.sobrenomes < 0.4) {
    return {
      providerUsed: 'jev-typed-mock',
      providerPath: [...providerPath, 'noul:nenhuma_opcao_sobrenome'],
      nextStepId: missing,
      interviewLine: 'sobrenomes',
      choice: { stepId: missing, confidence },
      noulAprofundar: NOUL_NO,
      noulNenhumaOpcao: NOUL_YES,
      scores,
      needsClarification: true,
    };
  }

  return {
    providerUsed: 'jev-typed-mock',
    providerPath: [...providerPath, needsClarification ? 'noul:aprofundar' : 'choice:next'],
    nextStepId: missing,
    interviewLine: line,
    choice: { stepId: missing, confidence },
    noulAprofundar,
    noulNenhumaOpcao: NOUL_NO,
    scores,
    needsClarification,
  };
}
