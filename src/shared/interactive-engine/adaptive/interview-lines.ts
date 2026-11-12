import type { QuestionnaireStepId } from '../questionnaire-adaptive';
import type { InterviewLine } from './schemas';

/** Mapeia passos do questionário para linhas de entrevista DEV-274. */
export const STEP_TO_INTERVIEW_LINE: Record<QuestionnaireStepId, InterviewLine> = {
  nome_uso: 'uso',
  sobrenomes_uso: 'sobrenomes',
  relacao_nome: 'identidade',
  onde_assina: 'uso',
  estilo_presenca: 'identidade',
  area_foco: 'objetivos',
  subfoco: 'objetivos',
  abertura_mudanca: 'tolerancia_mudanca',
};

export const INTERVIEW_LINE_ORDER: InterviewLine[] = [
  'objetivos',
  'identidade',
  'uso',
  'sobrenomes',
  'tolerancia_mudanca',
];
